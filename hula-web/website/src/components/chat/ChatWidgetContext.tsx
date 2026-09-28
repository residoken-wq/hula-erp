'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

export interface ChatbotWidgetConfig {
  cta_label: string;
  subtitle?: string;
  auto_open: boolean;
  auto_open_delay_s: number;
  auto_open_mobile: 'teaser' | 'panel' | 'off';
  snooze_hours: number;
}

export interface ChatbotConfig {
  enabled: boolean;
  display_name: string;
  short_name: string;
  avatar_url: string;
  greeting?: string;
  contact_channels: {
    hotline?: string;
    zalo_url?: string;
    email_public?: string;
    messenger_url?: string;
  };
  widget: ChatbotWidgetConfig;
  poll_ms: number;
}

interface ChatWidgetContextValue {
  config: ChatbotConfig | null;
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  isTeaserOpen: boolean;
  closeTeaser: () => void;
  sessionToken: string | null;
  sessionCode: string | null;
  conversation: any | null;
  messages: any[];
  brief: { revision: number; data: Record<string, any> } | null;
  loading: boolean;
  sending: boolean;
  sendMessage: (text: string) => Promise<void>;
  sendAction: (action: string, value: any) => Promise<void>;
  updateBrief: (patch: Record<string, any>) => Promise<boolean>;
  submitRequest: (contact: any, consent: any) => Promise<{ code: string; status: string } | null>;
  requestHuman: () => Promise<void>;
}

const ChatWidgetContext = createContext<ChatWidgetContextValue | undefined>(undefined);

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
const EXCLUDED_PATHS = ['/checkout', '/lien-he', '/dat-hang-si', '/beta-login'];

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTeaserOpen, setIsTeaserOpen] = useState(false);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [brief, setBrief] = useState<{ revision: number; data: Record<string, any> } | null>(null);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // 1. Fetch public config on mount
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/public/chat/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted && data) {
          setConfig(data);
        }
      })
      .catch(() => {
        // Fallback disabled
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Manage body.chat-open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }
    return () => {
      document.body.classList.remove('chat-open');
    };
  }, [isOpen]);

  // 3. Ensure Session exists
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionToken) return sessionToken;

    // Check localStorage cache
    try {
      const cached = localStorage.getItem('hula_chat_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.token) {
          // Verify session validity
          const testRes = await fetch(`${API_BASE}/public/chat/conversation`, {
            headers: { 'X-Chat-Session': parsed.token },
          });
          if (testRes.ok) {
            const convData = await testRes.json();
            setSessionToken(parsed.token);
            setSessionCode(parsed.code || convData.conversation?.public_code);
            setConversation(convData.conversation);
            setMessages(convData.messages || []);
            setBrief(convData.brief || null);
            return parsed.token;
          }
        }
      }
    } catch {
      // LocalStorage access issue
    }

    // Create new session
    try {
      const res = await fetch(`${API_BASE}/public/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        const tok = data.session_token;
        const code = data.conversation?.public_code;
        setSessionToken(tok);
        setSessionCode(code);
        setConversation(data.conversation);
        setMessages(data.conversation?.messages || []);
        try {
          localStorage.setItem(
            'hula_chat_session',
            JSON.stringify({ token: tok, code, createdAt: Date.now() })
          );
        } catch {}
        return tok;
      }
    } catch (err) {
      console.error('Failed to create chat session:', err);
    }
    return null;
  }, [sessionToken]);

  // 4. Polling messages & conversation
  const pollConversation = useCallback(async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/public/chat/conversation`, {
        headers: { 'X-Chat-Session': token },
      });
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.messages || []);
        setBrief(data.brief || null);
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !sessionToken) return;

    const pollIntervalMs = config?.poll_ms || 4000;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollConversation(sessionToken);
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [isOpen, sessionToken, config?.poll_ms, pollConversation]);

  // 5. Open & Close handlers
  const openChat = useCallback(async () => {
    setIsTeaserOpen(false);
    setIsOpen(true);
    setLoading(true);
    const token = await ensureSession();
    if (token) {
      await pollConversation(token);
    }
    setLoading(false);
  }, [ensureSession, pollConversation]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    const snoozeHours = config?.widget?.snooze_hours || 24;
    try {
      localStorage.setItem(
        'hula_chat_snooze_until',
        String(Date.now() + snoozeHours * 3600 * 1000)
      );
    } catch {}
  }, [config?.widget?.snooze_hours]);

  const closeTeaser = useCallback(() => {
    setIsTeaserOpen(false);
    const snoozeHours = config?.widget?.snooze_hours || 24;
    try {
      localStorage.setItem(
        'hula_chat_snooze_until',
        String(Date.now() + snoozeHours * 3600 * 1000)
      );
    } catch {}
  }, [config?.widget?.snooze_hours]);

  // 6. Auto Open Timer (5 seconds)
  useEffect(() => {
    if (!config || !config.enabled || !config.widget?.auto_open) return;

    // Check path exclusion
    const isExcluded = EXCLUDED_PATHS.some((p) => pathname?.startsWith(p));
    if (isExcluded) return;

    // Check session auto-opened
    try {
      if (sessionStorage.getItem('hula_chat_autoopened') === '1') {
        return;
      }
      const snoozeUntil = localStorage.getItem('hula_chat_snooze_until');
      if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
        return;
      }
    } catch {}

    const delaySeconds = config.widget.auto_open_delay_s || 5;
    const timer = setTimeout(() => {
      // Check conditions right before opening
      if (document.visibilityState !== 'visible') return;
      if (document.body.classList.contains('tour-360-active')) return;
      if (document.querySelector('[data-modal-open="true"]')) return;

      try {
        sessionStorage.setItem('hula_chat_autoopened', '1');
      } catch {}

      // Trigger GA event without PII
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'chat_auto_open');
      }

      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const mobileMode = config.widget.auto_open_mobile || 'teaser';
        if (mobileMode === 'teaser') {
          setIsTeaserOpen(true);
        } else if (mobileMode === 'panel') {
          openChat();
        }
      } else {
        openChat();
      }
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [config, pathname, openChat]);

  // 7. Send Message
  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const token = await ensureSession();
    if (!token) return;

    const clientMsgId = 'msg_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

    // Optimistic append
    const tempMsg = {
      id: clientMsgId,
      role: 'customer',
      text: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/public/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chat-Session': token,
        },
        body: JSON.stringify({ client_msg_id: clientMsgId, text: text.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.replies && Array.isArray(data.replies)) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== clientMsgId);
            return [...filtered, data.message || tempMsg, ...data.replies];
          });
        }
        await pollConversation(token);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // 8. Send Action (e.g. start, human, set_slot)
  const sendAction = async (action: string, value: any) => {
    if (sending) return;
    const token = await ensureSession();
    if (!token) return;

    setSending(true);
    const clientMsgId = 'act_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

    try {
      const res = await fetch(`${API_BASE}/public/chat/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chat-Session': token,
        },
        body: JSON.stringify({ client_msg_id: clientMsgId, action, value }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.replies && Array.isArray(data.replies)) {
          setMessages((prev) => [...prev, ...data.replies]);
        }
        await pollConversation(token);
      }
    } catch (err) {
      console.error('Failed to execute chat action:', err);
    } finally {
      setSending(false);
    }
  };

  // 9. Update Brief
  const updateBrief = async (patch: Record<string, any>): Promise<boolean> => {
    const token = await ensureSession();
    if (!token) return false;

    const baseRev = brief ? brief.revision : 0;
    try {
      const res = await fetch(`${API_BASE}/public/chat/brief`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Chat-Session': token,
        },
        body: JSON.stringify({ base_revision: baseRev, patch }),
      });

      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
        await pollConversation(token);
        return true;
      }
    } catch (err) {
      console.error('Failed to update brief:', err);
    }
    return false;
  };

  // 10. Submit Request
  const submitRequest = async (
    contact: any,
    consent: any
  ): Promise<{ code: string; status: string } | null> => {
    const token = await ensureSession();
    if (!token) return null;

    const key = 'req_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const currentRev = brief ? brief.revision : 0;

    try {
      const res = await fetch(`${API_BASE}/public/chat/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chat-Session': token,
        },
        body: JSON.stringify({
          idempotency_key: key,
          type: 'quote',
          brief_revision: currentRev,
          contact,
          consent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await pollConversation(token);
        return data;
      }
    } catch (err) {
      console.error('Failed to submit request:', err);
    }
    return null;
  };

  // 11. Request Human
  const requestHuman = async () => {
    await sendAction('human', null);
  };

  return (
    <ChatWidgetContext.Provider
      value={{
        config,
        isOpen,
        openChat,
        closeChat,
        isTeaserOpen,
        closeTeaser,
        sessionToken,
        sessionCode,
        conversation,
        messages,
        brief,
        loading,
        sending,
        sendMessage,
        sendAction,
        updateBrief,
        submitRequest,
        requestHuman,
      }}
    >
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  const context = useContext(ChatWidgetContext);
  if (!context) {
    throw new Error('useChatWidget must be used within a ChatWidgetProvider');
  }
  return context;
}
