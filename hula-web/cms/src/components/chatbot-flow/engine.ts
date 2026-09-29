// Client-side mirror of src/chatbot/flow/flow-graph.ts (backend is the source of truth).
// Used by the CMS editor for the "Chạy thử" simulator only.

export type FlowNodeType = 'start' | 'message' | 'knowledge' | 'handoff' | 'end';

export interface FlowButton {
  id: string;
  label: string;
  keywords?: string[];
}

export interface FlowNodeData {
  start_actions?: string[];
  keywords?: string[];
  text?: string;
  buttons?: FlowButton[];
  topic?: string;
  fallback_text?: string;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowIssue {
  level: 'error' | 'warning';
  code: string;
  node_id?: string;
  message: string;
}

export const START_ACTION_OPTIONS = [
  { value: 'school', label: 'Tìm cho trường' },
  { value: 'parent', label: 'Cho bé ở nhà' },
  { value: 'sample', label: 'Xem mẫu nệm' },
  { value: 'support', label: 'Hỗ trợ đơn hàng' },
];

export const PLACEHOLDERS = ['{short_name}', '{hotline}', '{email_public}', '{zalo_url}', '{working_hours_text}'];

export const MAX_BUTTONS = 6;
export const MAX_LABEL = 40;
export const MAX_TEXT = 1000;

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function normalizeVi(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function padNorm(s: string): string {
  return ` ${normalizeVi(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

export function textHasKeyword(text: string, keyword: string): boolean {
  const k = padNorm(keyword).trim();
  if (!k) return false;
  return padNorm(text).includes(` ${k} `);
}

export function nextOf(graph: FlowGraph, nodeId: string, handle: string): FlowNode | null {
  const e = graph.edges.find((x) => x.source === nodeId && (x.sourceHandle || 'next') === handle);
  return e ? graph.nodes.find((n) => n.id === e.target) || null : null;
}

export function matchBranch(graph: FlowGraph, node: FlowNode, text: string): string | null {
  const buttons = node.data.buttons || [];
  const t = padNorm(text).trim();
  const exact = buttons.find((b) => padNorm(b.label).trim() === t);
  if (exact) return exact.id;
  const kw = buttons.find((b) => (b.keywords || []).some((k) => textHasKeyword(text, k)));
  if (kw) return kw.id;
  if (graph.edges.some((e) => e.source === node.id && e.sourceHandle === 'other')) return 'other';
  return null;
}

export interface SimStep {
  texts: { node_id: string; text: string; kind: 'bot' | 'kb' | 'handoff' | 'end' }[];
  waitNode: FlowNode | null;
  ended: boolean;
  handoff: boolean;
}

export function walk(graph: FlowGraph, from: FlowNode | null): SimStep {
  const out: SimStep = { texts: [], waitNode: null, ended: false, handoff: false };
  let cur = from;
  let steps = 0;
  while (cur && steps < 10) {
    steps++;
    if (cur.type === 'start') {
      cur = nextOf(graph, cur.id, 'next');
      continue;
    }
    if (cur.type === 'message') {
      if (cur.data.text) out.texts.push({ node_id: cur.id, text: cur.data.text, kind: 'bot' });
      if (cur.data.buttons?.length) {
        out.waitNode = cur;
        return out;
      }
      cur = nextOf(graph, cur.id, 'next');
      continue;
    }
    if (cur.type === 'knowledge') {
      out.texts.push({
        node_id: cur.id,
        text: `[Tri thức "${cur.data.topic || '?'}"]${cur.data.fallback_text ? ` — dự phòng: ${cur.data.fallback_text}` : ''}`,
        kind: 'kb',
      });
      cur = nextOf(graph, cur.id, 'next');
      continue;
    }
    if (cur.type === 'handoff') {
      if (cur.data.text) out.texts.push({ node_id: cur.id, text: cur.data.text, kind: 'handoff' });
      out.handoff = true;
      out.ended = true;
      return out;
    }
    if (cur.data.text) out.texts.push({ node_id: cur.id, text: cur.data.text, kind: 'end' });
    out.ended = true;
    return out;
  }
  out.ended = true;
  return out;
}

/** Minimal starter: start → one message with buttons. */
export function blankGraph(): FlowGraph {
  const start = uid('n');
  const msg = uid('n');
  const b1 = uid('b');
  const b2 = uid('b');
  return {
    nodes: [
      { id: start, type: 'start', position: { x: 0, y: 120 }, data: { start_actions: [], keywords: [] } },
      {
        id: msg,
        type: 'message',
        position: { x: 320, y: 60 },
        data: {
          text: 'Dạ em chào anh/chị ạ. Anh/chị cần em hỗ trợ gì ạ?',
          buttons: [
            { id: b1, label: 'Lựa chọn 1', keywords: [] },
            { id: b2, label: 'Lựa chọn 2', keywords: [] },
          ],
        },
      },
    ],
    edges: [{ id: uid('e'), source: start, sourceHandle: 'next', target: msg }],
  };
}

/** Template built only from reply texts the bot already uses today (no new facts). */
export function schoolTemplate(): FlowGraph {
  const ids = { start: uid('n'), ask: uid('n'), qty: uid('n'), other: uid('n'), human: uid('n') };
  const b = { nem: uid('b'), goi: uid('b'), bo: uid('b'), nv: uid('b') };
  return {
    nodes: [
      { id: ids.start, type: 'start', position: { x: 0, y: 120 }, data: { start_actions: ['school'], keywords: [] } },
      {
        id: ids.ask,
        type: 'message',
        position: { x: 280, y: 60 },
        data: {
          text: 'Dạ em chào anh/chị ạ. Trường mình đang cần nệm, gối hay cả bộ ạ?',
          buttons: [
            { id: b.nem, label: 'Nệm ngủ trưa', keywords: ['nệm', 'nem ngu'] },
            { id: b.goi, label: 'Gối', keywords: ['gối'] },
            { id: b.bo, label: 'Cả bộ', keywords: ['trọn bộ', 'cả bộ'] },
            { id: b.nv, label: 'Gặp nhân viên', keywords: [] },
          ],
        },
      },
      {
        id: ids.qty,
        type: 'message',
        position: { x: 580, y: 0 },
        data: { text: 'Dạ trường mình dự kiến khoảng bao nhiêu bộ ạ?', buttons: [] },
      },
      {
        id: ids.other,
        type: 'message',
        position: { x: 580, y: 150 },
        data: { text: 'Dạ anh/chị mô tả thêm nhu cầu giúp em để em tư vấn đúng sản phẩm ạ.', buttons: [] },
      },
      {
        id: ids.human,
        type: 'handoff',
        position: { x: 580, y: 300 },
        data: { text: 'Dạ em đã ghi nhận thông tin và chuyển cho chuyên viên tư vấn HULA liên hệ hỗ trợ anh/chị ạ.' },
      },
    ],
    edges: [
      { id: uid('e'), source: ids.start, sourceHandle: 'next', target: ids.ask },
      { id: uid('e'), source: ids.ask, sourceHandle: b.nem, target: ids.qty },
      { id: uid('e'), source: ids.ask, sourceHandle: b.goi, target: ids.qty },
      { id: uid('e'), source: ids.ask, sourceHandle: b.bo, target: ids.qty },
      { id: uid('e'), source: ids.ask, sourceHandle: b.nv, target: ids.human },
      { id: uid('e'), source: ids.ask, sourceHandle: 'other', target: ids.other },
    ],
  };
}
