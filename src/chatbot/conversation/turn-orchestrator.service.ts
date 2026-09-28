import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ChatbotConversation } from '../entities/chatbot-conversation.entity';
import { ChatbotMessage } from '../entities/chatbot-message.entity';
import { ChatbotBrief } from '../entities/chatbot-brief.entity';
import { ChatbotOutbox } from '../entities/chatbot-outbox.entity';
import { ChatbotConfigService } from '../config/chatbot-config.service';
import { ChatbotToolsService } from '../tools/chatbot-tools.service';
import { LlmBudgetService } from '../llm/llm-budget.service';
import { ScriptedResponderService } from './scripted-responder.service';
import { LLM_PROVIDER, LlmProvider } from '../llm/llm-provider';
import { redactPiiForLlm, validateReply } from './reply-validator';

@Injectable()
export class TurnOrchestratorService {
  private readonly logger = new Logger(TurnOrchestratorService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ChatbotConfigService,
    private readonly toolsService: ChatbotToolsService,
    private readonly budgetService: LlmBudgetService,
    private readonly scriptedResponder: ScriptedResponderService,
    @Inject(LLM_PROVIDER) private readonly llmProvider: LlmProvider,
  ) {}

  async handleTurn(
    conv: ChatbotConversation,
    rawText: string,
    clientMsgId?: string,
  ): Promise<{
    customerMsg: ChatbotMessage;
    replies: any[];
    conversation: { state: string; human_active: boolean };
  }> {
    // Phase 1: Lock conversation & save customer message
    let customerMsg!: ChatbotMessage;
    let currentConv!: ChatbotConversation;

    const earlyExit = await this.dataSource.transaction(async (mgr) => {
      const locked = await mgr.findOne(ChatbotConversation, {
        where: { id: conv.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked) {
        throw new Error(`Conversation ${conv.id} not found`);
      }
      currentConv = locked;

      // Check if human active -> drop AI reply, unread_staff + 1
      if (currentConv.human_active) {
        this.logger.log('turn: human is active, dropping AI replies');
        currentConv.unread_staff += 1;
        currentConv.last_message_at = new Date();
        await mgr.save(ChatbotConversation, currentConv);

        customerMsg = mgr.create(ChatbotMessage, {
          conversation_id: currentConv.id,
          role: 'customer',
          text: rawText,
          client_msg_id: clientMsgId || null,
        });
        await mgr.save(ChatbotMessage, customerMsg);

        return true;
      }

      // Save customer message
      customerMsg = mgr.create(ChatbotMessage, {
        conversation_id: currentConv.id,
        role: 'customer',
        text: rawText,
        client_msg_id: clientMsgId || null,
      });
      await mgr.save(ChatbotMessage, customerMsg);
      currentConv.last_message_at = new Date();
      await mgr.save(ChatbotConversation, currentConv);

      return false;
    });

    if (earlyExit) {
      return {
        customerMsg,
        replies: [],
        conversation: {
          state: currentConv.state,
          human_active: currentConv.human_active,
        },
      };
    }

    // Test Hook: delay
    if (process.env.CHATBOT_TEST_HOOKS === 'true' && rawText.includes('[[delay:')) {
      const match = rawText.match(/\[\[delay:(\d+)\]\]/);
      if (match) {
        const delayMs = Math.min(parseInt(match[1], 10), 10000);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    // Redacted customer preview
    const redactedText = redactPiiForLlm(rawText);
    const inputPreview = redactedText.slice(0, 200);

    const config = await this.configService.get();
    const providerEnv = (process.env.CHATBOT_LLM_PROVIDER || '').toLowerCase();

    // If provider is explicitly scripted -> use ScriptedResponder
    if (providerEnv === 'scripted') {
      const scriptedRes = await this.runScriptedFallback(
        currentConv,
        rawText,
        inputPreview,
        undefined,
      );
      return {
        customerMsg,
        replies: scriptedRes.replies,
        conversation: {
          state: currentConv.state,
          human_active: currentConv.human_active,
        },
      };
    }

    // Budget Check: tryConsume atomically checks and increments today's usage
    const kbVersion = await this.toolsService.getKbVersion();
    const allowed = await this.budgetService.tryConsume();

    if (!allowed) {
      this.logger.warn(`LLM budget exhausted, falling back to scripted`);
      const scriptedRes = await this.runScriptedFallback(
        currentConv,
        rawText,
        inputPreview,
        'budget',
      );
      return {
        customerMsg,
        replies: scriptedRes.replies,
        conversation: {
          state: currentConv.state,
          human_active: currentConv.human_active,
        },
      };
    }

    // Execute LLM Pipeline with timeout
    const timeoutMs = config.llm?.timeout_ms || 20000;

    try {
      let timer: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const err = new Error(`LLM pipeline timed out after ${timeoutMs}ms`);
          err.name = 'TimeoutError';
          reject(err);
        }, timeoutMs);
        if (timer.unref) timer.unref();
      });

      const pipelinePromise = this.executePipeline(
        currentConv,
        rawText,
        redactedText,
        inputPreview,
        config,
        timeoutMs,
        kbVersion,
      );

      const pipelineResult = await Promise.race([pipelinePromise, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });

      return {
        customerMsg,
        replies: pipelineResult.replies,
        conversation: {
          state: currentConv.state,
          human_active: currentConv.human_active,
        },
      };
    } catch (err: any) {
      const isTimeout =
        err?.name === 'TimeoutError' ||
        err?.message?.includes('timed out') ||
        err?.name === 'AbortError';

      const fallbackType = isTimeout ? 'timeout' : 'error';
      this.logger.warn(`LLM pipeline ${fallbackType}: ${err?.message}, running scripted fallback`);

      const scriptedRes = await this.runScriptedFallback(
        currentConv,
        rawText,
        inputPreview,
        fallbackType,
      );

      return {
        customerMsg,
        replies: scriptedRes.replies,
        conversation: {
          state: currentConv.state,
          human_active: currentConv.human_active,
        },
      };
    }
  }

  private async executePipeline(
    currentConv: ChatbotConversation,
    rawText: string,
    redactedText: string,
    inputPreview: string,
    config: any,
    timeoutMs: number,
    kbVersion: number,
  ): Promise<{ replies: any[] }> {
    // A. Understand (LLM #1)
    const t0 = Date.now();
    const understandRes = await this.llmProvider.generateJson<any>({
      schemaName: 'understand.v1',
      messages: [{ role: 'user', text: redactedText }],
      timeoutMs,
    });
    const understandLatency = Date.now() - t0;
    const understandData = understandRes.data || {};

    // B. Load & Merge Brief
    let activeRevision = 0;
    let activeData: Record<string, any> = {};

    await this.dataSource.transaction(async (mgr) => {
      const latestBrief = await mgr.findOne(ChatbotBrief, {
        where: { conversation_id: currentConv.id },
        order: { revision: 'DESC' },
      });
      const currentBriefData = latestBrief ? { ...latestBrief.data } : {};
      activeRevision = latestBrief ? latestBrief.revision : 0;
      activeData = { ...currentBriefData };

      if (understandData.slots && typeof understandData.slots === 'object') {
        let hasNew = false;
        for (const [k, v] of Object.entries(understandData.slots)) {
          if (v !== undefined && v !== null && activeData[k] !== v) {
            activeData[k] = v;
            hasNew = true;
          }
        }
        if (hasNew) {
          activeRevision += 1;
          const newBrief = mgr.create(ChatbotBrief, {
            conversation_id: currentConv.id,
            revision: activeRevision,
            data: activeData,
            changed_by: 'customer',
          });
          await mgr.save(ChatbotBrief, newBrief);
        }
      }
    });

    // C. Business Rules (code-enforced)
    let payload: any = null;
    const isComplaint = Boolean(understandData.is_complaint);
    const ageMonths = activeData.age_months !== undefined ? activeData.age_months : understandData.slots?.age_months;
    const isInfant =
      (ageMonths !== undefined && ageMonths < 18) ||
      understandData.topic_hint === 'infant';

    if (isComplaint) {
      payload = { type: 'suggest_ticket', category: 'complaint_quality' };
    } else if (isInfant) {
      payload = { type: 'handoff_suggest', reason: 'infant' };
    } else if (understandData.wants_human) {
      currentConv.state = 'waiting_sales';
      await this.dataSource.transaction(async (mgr) => {
        await mgr.save(ChatbotConversation, currentConv);
        const outboxInapp = mgr.create(ChatbotOutbox, {
          event: 'human.requested',
          channel: 'inapp',
          ref_id: currentConv.id,
          payload: { conversation_id: currentConv.id, text: rawText },
        });
        await mgr.save(ChatbotOutbox, outboxInapp);

        if (config.notify_emails && config.notify_emails.length > 0) {
          const outboxEmail = mgr.create(ChatbotOutbox, {
            event: 'human.requested',
            channel: 'email',
            ref_id: currentConv.id,
            payload: { conversation_id: currentConv.id, text: rawText, emails: config.notify_emails },
          });
          await mgr.save(ChatbotOutbox, outboxEmail);
        }
      });
    }

    // D. Tools (retrieveForTurn)
    const t1 = Date.now();
    let factsItems: any[] = [];
    if (!isComplaint && !isInfant) {
      const toolRes = await this.toolsService.retrieveForTurn(redactedText, {
        intent: understandData.intent,
        topic_hint: understandData.topic_hint,
      });
      factsItems = toolRes.items || [];
    }
    const toolsLatency = Date.now() - t1;
    const factsText = factsItems.map((f: any) => `- ${f.answer}`).join('\n');

    // E. Compose (LLM #2)
    const t2 = Date.now();
    const systemPrompt = `Bạn là ${config.display_name}, trợ lý AI của HULA. Dưới đây là thông tin cần biết:
<facts>
${factsText}
</facts>
<brief>
${JSON.stringify(activeData)}
</brief>
Lượt chat này có: is_complaint: ${isComplaint}, is_infant: ${isInfant}.`;

    const composeRes = await this.llmProvider.generateJson<any>({
      schemaName: 'compose.v1',
      system: systemPrompt,
      messages: [{ role: 'user', text: redactedText }],
      timeoutMs,
    });
    const composeLatency = Date.now() - t2;
    const rawReply = composeRes.data?.reply_text || '';

    // F. ReplyValidator
    const valRes = validateReply(rawReply, {
      factsText,
      briefData: activeData,
      intent: understandData.intent,
      fallbackKnowledgeAnswer: factsItems[0]?.answer,
    });

    const finalReplyText = valRes.replyText;

    // G. T35: Check human_active again before saving AI reply
    const freshConv = await this.dataSource.getRepository(ChatbotConversation).findOne({
      where: { id: currentConv.id },
    });
    if (freshConv?.human_active) {
      this.logger.log('turn: human took over before AI message save, dropping reply');
      return { replies: [] };
    }

    // H. Save AI message
    const llmMeta: any = {
      provider: this.llmProvider.name,
      model: composeRes.model || 'fake-model',
      prompt_version: 'v1',
      kb_version: kbVersion,
      latency_ms: {
        understand: understandLatency,
        tools: toolsLatency,
        compose: composeLatency,
      },
      input_preview: inputPreview,
    };

    if (valRes.validator) {
      llmMeta.validator = valRes.validator;
    }

    const aiMsg = this.dataSource.getRepository(ChatbotMessage).create({
      conversation_id: currentConv.id,
      role: 'ai',
      text: finalReplyText,
      payload,
      llm_meta: llmMeta,
    });
    await this.dataSource.getRepository(ChatbotMessage).save(aiMsg);

    return {
      replies: [
        {
          id: aiMsg.id,
          role: 'ai',
          text: aiMsg.text,
          payload: aiMsg.payload,
          created_at: aiMsg.created_at,
        },
      ],
    };
  }

  private async runScriptedFallback(
    currentConv: ChatbotConversation,
    rawText: string,
    inputPreview: string,
    fallbackReason: string | undefined,
  ): Promise<{ replies: any[] }> {
    const kbVersion = await this.toolsService.getKbVersion();
    const config = await this.configService.get();

    // Extract slots and update brief
    const latestBrief = await this.dataSource.getRepository(ChatbotBrief).findOne({
      where: { conversation_id: currentConv.id },
      order: { revision: 'DESC' },
    });
    const currentBriefData = latestBrief ? { ...latestBrief.data } : {};
    const currentRevision = latestBrief ? latestBrief.revision : 0;

    const { slots, hasNewSlots } = this.scriptedResponder.extractSlots(rawText, currentBriefData);
    let activeRevision = currentRevision;
    let activeData = currentBriefData;

    if (hasNewSlots) {
      activeRevision = currentRevision + 1;
      activeData = { ...currentBriefData, ...slots };
      const newBrief = this.dataSource.getRepository(ChatbotBrief).create({
        conversation_id: currentConv.id,
        revision: activeRevision,
        data: activeData,
        changed_by: 'customer',
      });
      await this.dataSource.getRepository(ChatbotBrief).save(newBrief);
    }

    const response = this.scriptedResponder.generateResponse(
      rawText,
      activeData,
      activeRevision,
      config,
    );

    if (response.newState) {
      currentConv.state = response.newState;
      await this.dataSource.getRepository(ChatbotConversation).save(currentConv);
    }

    if (response.isHumanRequest) {
      const outboxInapp = this.dataSource.getRepository(ChatbotOutbox).create({
        event: 'human.requested',
        channel: 'inapp',
        ref_id: currentConv.id,
        payload: { conversation_id: currentConv.id, text: rawText },
      });
      await this.dataSource.getRepository(ChatbotOutbox).save(outboxInapp);

      if (config.notify_emails && config.notify_emails.length > 0) {
        const outboxEmail = this.dataSource.getRepository(ChatbotOutbox).create({
          event: 'human.requested',
          channel: 'email',
          ref_id: currentConv.id,
          payload: { conversation_id: currentConv.id, text: rawText, emails: config.notify_emails },
        });
        await this.dataSource.getRepository(ChatbotOutbox).save(outboxEmail);
      }
    }

    if (!response.replyText) {
      return { replies: [] };
    }

    // Save AI reply
    const llmMeta: any = {
      provider: this.llmProvider.name,
      model: 'fake-model',
      prompt_version: 'v1',
      kb_version: kbVersion,
      latency_ms: { understand: 0, tools: 0, compose: 0 },
      input_preview: inputPreview,
    };
    if (fallbackReason) {
      llmMeta.fallback = fallbackReason;
    }

    const aiMsg = this.dataSource.getRepository(ChatbotMessage).create({
      conversation_id: currentConv.id,
      role: 'ai',
      text: response.replyText,
      payload: response.payload,
      llm_meta: llmMeta,
    });
    await this.dataSource.getRepository(ChatbotMessage).save(aiMsg);

    return {
      replies: [
        {
          id: aiMsg.id,
          role: 'ai',
          text: aiMsg.text,
          payload: aiMsg.payload,
          created_at: aiMsg.created_at,
        },
      ],
    };
  }
}
