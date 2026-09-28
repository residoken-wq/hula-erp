import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import {
  LlmProvider,
  LlmGenerateRequest,
  LlmGenerateResult,
  LlmInvalidOutputError,
} from './llm-provider';

export function resolveGeminiKey(): { key: string; source: 'CHATBOT_LLM_API_KEY' | 'GEMINI_API_KEY' | 'none' } {
  if (process.env.CHATBOT_LLM_API_KEY) {
    return { key: process.env.CHATBOT_LLM_API_KEY, source: 'CHATBOT_LLM_API_KEY' };
  }
  if (process.env.GEMINI_API_KEY) {
    return { key: process.env.GEMINI_API_KEY, source: 'GEMINI_API_KEY' };
  }
  return { key: '', source: 'none' };
}

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini' as const;
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly configuredModel: string;
  private readonly fetchFn: typeof fetch;
  private cachedBestModel: { model: string; expiresAt: number } | null = null;

  constructor(
    @Optional() @Inject('GEMINI_API_KEY') apiKey?: string,
    @Optional() @Inject('GEMINI_MODEL') model?: string,
    @Optional() @Inject('GEMINI_FETCH') fetchFn?: typeof fetch,
  ) {
    const resolved = resolveGeminiKey();
    this.apiKey = apiKey || resolved.key;
    this.configuredModel = model || process.env.CHATBOT_LLM_MODEL || '';
    this.fetchFn = fetchFn || globalThis.fetch;
  }

  async getModel(): Promise<string> {
    if (this.configuredModel) {
      return this.configuredModel;
    }
    const now = Date.now();
    if (this.cachedBestModel && now < this.cachedBestModel.expiresAt) {
      return this.cachedBestModel.model;
    }

    let selected = 'models/gemini-1.5-flash';
    if (this.apiKey) {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1/models`;
        const res = await this.fetchFn(listUrl, {
          headers: { 'x-goog-api-key': this.apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models)) {
            const models = data.models.filter((m: any) =>
              m.supportedGenerationMethods?.includes('generateContent'),
            );
            const preferred = models.find((m: any) => m.name?.includes('flash')) || models[0];
            if (preferred?.name) {
              selected = preferred.name;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not list Gemini models: ${err?.message}, using fallback`);
      }
    }

    this.cachedBestModel = {
      model: selected,
      expiresAt: now + 24 * 60 * 60 * 1000,
    };
    return selected;
  }

  async generateJson<T>(req: LlmGenerateRequest): Promise<LlmGenerateResult<T>> {
    const startTime = Date.now();
    const model = await this.getModel();
    const cleanModel = model.startsWith('models/') ? model.slice(7) : model;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;

    const payload: any = {
      contents: req.messages.map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: req.jsonSchema,
      },
    };

    if (req.system) {
      payload.systemInstruction = {
        parts: [{ text: req.system }],
      };
    }

    const executeCall = async (attempt: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), req.timeoutMs || 20000);

      try {
        const response = await this.fetchFn(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutTimer);

        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          // Retry once after 1 second backoff
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return executeCall(1);
        }

        return response;
      } catch (err: any) {
        clearTimeout(timeoutTimer);
        if (err.name === 'AbortError' || controller.signal.aborted) {
          const timeoutErr = new Error(`LLM request timed out after ${req.timeoutMs}ms`);
          timeoutErr.name = 'TimeoutError';
          throw timeoutErr;
        }
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return executeCall(1);
        }
        throw err;
      }
    };

    const res = await executeCall(0);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      this.logger.error(`Gemini request failed with HTTP ${res.status}`);
      throw new Error(`Gemini API error (HTTP ${res.status}): ${errText}`);
    }

    let jsonResponse: any;
    try {
      jsonResponse = await res.json();
    } catch {
      throw new LlmInvalidOutputError('Gemini response could not be parsed as JSON');
    }

    const candidate = jsonResponse.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;
    if (!textPart) {
      throw new LlmInvalidOutputError('Gemini returned empty or missing content candidate');
    }

    let parsedData: T;
    try {
      parsedData = JSON.parse(textPart);
    } catch {
      throw new LlmInvalidOutputError('Gemini candidate text could not be parsed as JSON');
    }

    const latencyMs = Date.now() - startTime;
    const usageMetadata = jsonResponse.usageMetadata;

    return {
      data: parsedData,
      model,
      latencyMs,
      usage: usageMetadata
        ? {
            input: usageMetadata.promptTokenCount,
            output: usageMetadata.candidatesTokenCount,
          }
        : undefined,
    };
  }
}
