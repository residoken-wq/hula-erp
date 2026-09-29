'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  useUpdateNodeInternals,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Empty,
  Input,
  InputNumber,
  List,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloudUploadOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/AdminLayout';
import { chatbotFlowApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { nodeTypes, NODE_META, type EditorNodeData } from '@/components/chatbot-flow/nodes';
import {
  MAX_BUTTONS,
  MAX_LABEL,
  MAX_TEXT,
  PLACEHOLDERS,
  START_ACTION_OPTIONS,
  matchBranch,
  nextOf,
  uid,
  walk,
  type FlowGraph,
  type FlowIssue,
  type FlowNode,
  type FlowNodeType,
} from '@/components/chatbot-flow/engine';

const { Text } = Typography;
const DND_TYPE = 'application/hula-flow-node';
const PALETTE: FlowNodeType[] = ['message', 'knowledge', 'handoff', 'end'];

type RFNode = Node<EditorNodeData>;

const errMsg = (err: any) => err?.response?.data?.message || err?.message || 'Lỗi';

// ---------------------------------------------------------------- graph <-> React Flow

function toRF(graph: FlowGraph): { nodes: RFNode[]; edges: Edge[] } {
  return {
    nodes: (graph?.nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position || { x: 0, y: 0 },
      data: { ...n.data },
      deletable: n.type !== 'start',
    })),
    edges: (graph?.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle || 'next',
      target: e.target,
    })),
  };
}

function toGraph(nodes: RFNode[], edges: Edge[]): FlowGraph {
  return {
    nodes: nodes.map((n) => {
      const data: any = {};
      for (const [k, v] of Object.entries(n.data || {})) if (!k.startsWith('__')) data[k] = v;
      return {
        id: n.id,
        type: n.type as FlowNodeType,
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        data,
      };
    }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, sourceHandle: e.sourceHandle || 'next', target: e.target })),
  };
}

/** Handles a node may use right now (mirrors backend allowedHandles). */
function handlesOf(n: RFNode): string[] {
  if (n.type === 'start' || n.type === 'knowledge') return ['next'];
  if (n.type === 'message') {
    const b = (n.data.buttons || []) as { id: string }[];
    return b.length ? [...b.map((x) => x.id), 'other'] : ['next'];
  }
  return [];
}

function pruneEdges(nodes: RFNode[], edges: Edge[]): Edge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.filter((e) => {
    const s = byId.get(e.source);
    return s && byId.has(e.target) && handlesOf(s).includes(e.sourceHandle || 'next');
  });
}

function defaultData(type: FlowNodeType): EditorNodeData {
  if (type === 'message') return { text: '', buttons: [] };
  if (type === 'knowledge') return { topic: '', fallback_text: '' };
  if (type === 'handoff') return { text: 'Dạ em chuyển thông tin để chuyên viên tư vấn HULA hỗ trợ anh/chị ngay ạ.' };
  return { text: '' };
}

// ---------------------------------------------------------------- simulator

type SimMsg = { from: 'bot' | 'user' | 'sys'; text: string; kind?: string };

function Simulator({
  graph,
  onActive,
  onClose,
}: {
  graph: FlowGraph;
  onActive: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [log, setLog] = useState<SimMsg[]>([]);
  const [wait, setWait] = useState<FlowNode | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    const s = graph.nodes.find((n) => n.type === 'start') || null;
    if (!s) {
      setLog([{ from: 'sys', text: 'Sơ đồ chưa có bước Bắt đầu' }]);
      return;
    }
    const step = walk(graph, s);
    const msgs: SimMsg[] = [{ from: 'sys', text: 'Khách bấm nút khởi động / gõ từ khoá' }];
    for (const t of step.texts) msgs.push({ from: 'bot', text: t.text, kind: t.kind });
    if (!step.texts.length) msgs.push({ from: 'sys', text: 'Bước Bắt đầu chưa nối tới đâu' });
    if (step.ended) msgs.push({ from: 'sys', text: step.handoff ? 'Hiện nút “Gặp nhân viên tư vấn” — hết kịch bản' : 'Hết kịch bản — bot trả lời bằng Tri thức/AI' });
    setLog(msgs);
    setWait(step.waitNode);
    onActive(step.texts.map((t) => t.node_id));
  }, [graph, onActive]);

  useEffect(() => {
    start();
    return () => onActive([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const answer = (text: string) => {
    if (!wait || !text.trim()) return;
    const msgs: SimMsg[] = [{ from: 'user', text }];
    const handle = matchBranch(graph, wait, text);
    const target = handle ? nextOf(graph, wait.id, handle) : null;
    if (!target) {
      msgs.push({
        from: 'sys',
        text: handle ? 'Nhánh này chưa nối — hết kịch bản, bot trả lời bằng Tri thức/AI' : 'Không khớp nút/từ khoá nào và không có nhánh “Khác” — khách rời kịch bản',
      });
      setLog((l) => [...l, ...msgs]);
      setWait(null);
      onActive([]);
      return;
    }
    const step = walk(graph, target);
    for (const t of step.texts) msgs.push({ from: 'bot', text: t.text, kind: t.kind });
    if (step.ended) msgs.push({ from: 'sys', text: step.handoff ? 'Hiện nút “Gặp nhân viên tư vấn” — hết kịch bản' : 'Hết kịch bản — bot trả lời bằng Tri thức/AI' });
    setLog((l) => [...l, ...msgs]);
    setWait(step.waitNode);
    onActive(step.texts.map((t) => t.node_id));
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
        <PlayCircleOutlined style={{ color: '#16a34a' }} />
        <b style={{ flex: 1 }}>Chạy thử (bản đang sửa)</b>
        <Tooltip title="Chạy lại từ đầu">
          <Button size="small" icon={<ReloadOutlined />} onClick={start} />
        </Tooltip>
        <Button size="small" icon={<CloseOutlined />} onClick={onClose} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {log.map((m, i) =>
          m.from === 'sys' ? (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              style={{
                alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.from === 'user' ? '#2563eb' : m.kind === 'kb' ? '#f5f3ff' : '#fff',
                color: m.from === 'user' ? '#fff' : '#1e293b',
                border: m.from === 'user' ? 'none' : '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '6px 10px',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
            </div>
          ),
        )}
        {wait && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(wait.data.buttons || []).map((b) => (
              <Button key={b.id} size="small" shape="round" onClick={() => answer(b.label)}>
                {b.label}
              </Button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 10, borderTop: '1px solid #e2e8f0' }}>
        <Input.Search
          placeholder={wait ? 'Hoặc gõ như khách để thử từ khoá…' : 'Kịch bản đã kết thúc'}
          disabled={!wait}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSearch={answer}
          enterButton="Gửi"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- inspector

function ButtonsEditor({
  node,
  readOnly,
  onChange,
}: {
  node: RFNode;
  readOnly: boolean;
  onChange: (patch: Partial<EditorNodeData>) => void;
}) {
  const buttons = (node.data.buttons || []) as { id: string; label: string; keywords?: string[] }[];
  const set = (next: typeof buttons) => onChange({ buttons: next });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= buttons.length) return;
    const next = [...buttons];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <b style={{ flex: 1 }}>Nút cho khách chọn</b>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {buttons.length}/{MAX_BUTTONS}
        </Text>
      </div>
      {buttons.length === 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Không có nút: bot nói xong đi tiếp ngay sang bước được nối.
        </Text>
      )}
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {buttons.map((b, i) => (
          <div key={b.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#f8fafc' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={b.label}
                maxLength={MAX_LABEL}
                placeholder="Chữ trên nút"
                disabled={readOnly}
                onChange={(e) => set(buttons.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))}
              />
              <Button icon={<ArrowUpOutlined />} disabled={readOnly || i === 0} onClick={() => move(i, -1)} />
              <Button icon={<ArrowDownOutlined />} disabled={readOnly || i === buttons.length - 1} onClick={() => move(i, 1)} />
              <Button danger icon={<DeleteOutlined />} disabled={readOnly} onClick={() => set(buttons.filter((x) => x.id !== b.id))} />
            </Space.Compact>
            <Select
              mode="tags"
              size="small"
              style={{ width: '100%', marginTop: 6 }}
              placeholder="Từ khoá khi khách gõ tay (Enter để thêm)"
              value={b.keywords || []}
              disabled={readOnly}
              tokenSeparators={[',']}
              open={false}
              onChange={(v) => set(buttons.map((x) => (x.id === b.id ? { ...x, keywords: (v as string[]).slice(0, 20) } : x)))}
            />
          </div>
        ))}
      </Space>
      <Button
        block
        type="dashed"
        icon={<PlusOutlined />}
        style={{ marginTop: 8 }}
        disabled={readOnly || buttons.length >= MAX_BUTTONS}
        onClick={() => set([...buttons, { id: uid('b'), label: '', keywords: [] }])}
      >
        Thêm nút
      </Button>
      {buttons.length > 0 && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
          Nhánh “Khác” dùng khi khách gõ câu không khớp nút/từ khoá nào. Không nối nhánh Khác thì khách rời kịch bản và bot trả lời bằng Tri thức/AI.
        </Text>
      )}
    </div>
  );
}

function TextField({
  value,
  readOnly,
  onChange,
  label = 'Bot nói',
}: {
  value: string;
  readOnly: boolean;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div>
      <b>{label}</b>
      <Input.TextArea
        style={{ marginTop: 6 }}
        rows={5}
        value={value}
        maxLength={MAX_TEXT}
        showCount
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
      <div style={{ marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {PLACEHOLDERS.map((p) => (
          <Tag key={p} style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => !readOnly && onChange(`${value || ''}${p}`)}>
            {p}
          </Tag>
        ))}
      </div>
    </div>
  );
}

function Inspector({
  node,
  readOnly,
  topics,
  issues,
  onChange,
  onDelete,
}: {
  node: RFNode;
  readOnly: boolean;
  topics: { topic: string; question: string | null }[];
  issues: FlowIssue[];
  onChange: (patch: Partial<EditorNodeData>) => void;
  onDelete: () => void;
}) {
  const type = node.type as FlowNodeType;
  const meta = NODE_META[type];
  const d = node.data;
  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <b>{meta.label}</b>
          <div style={{ fontSize: 12, color: '#64748b' }}>{meta.hint}</div>
        </div>
        {type !== 'start' && !readOnly && (
          <Popconfirm title="Xoá bước này?" onConfirm={onDelete}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </div>
      {issues.map((i, k) => (
        <Alert key={k} style={{ marginTop: 8 }} type={i.level === 'error' ? 'error' : 'warning'} showIcon message={i.message} />
      ))}
      <Divider style={{ margin: '12px 0' }} />

      {type === 'start' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <b>Chạy khi khách bấm nút mở đầu</b>
            <Checkbox.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}
              options={START_ACTION_OPTIONS}
              value={d.start_actions || []}
              disabled={readOnly}
              onChange={(v) => onChange({ start_actions: v as string[] })}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mỗi nút mở đầu chỉ thuộc 1 kịch bản đang chạy.
            </Text>
          </div>
          <div>
            <b>Hoặc khi khách gõ câu có từ khoá</b>
            <Select
              mode="tags"
              style={{ width: '100%', marginTop: 6 }}
              placeholder="VD: báo giá, đặt cho trường (Enter để thêm)"
              value={d.keywords || []}
              disabled={readOnly}
              tokenSeparators={[',']}
              open={false}
              onChange={(v) => onChange({ keywords: (v as string[]).slice(0, 20) })}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Không phân biệt dấu, khớp nguyên từ. Chỉ xét khi khách chưa ở trong kịch bản nào.
            </Text>
          </div>
        </Space>
      )}

      {type === 'message' && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <TextField value={d.text || ''} readOnly={readOnly} onChange={(v) => onChange({ text: v })} />
          <ButtonsEditor node={node} readOnly={readOnly} onChange={onChange} />
        </Space>
      )}

      {type === 'knowledge' && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <b>Chủ đề tri thức (đã duyệt)</b>
            <Select
              showSearch
              style={{ width: '100%', marginTop: 6 }}
              placeholder="Chọn topic"
              value={d.topic || undefined}
              disabled={readOnly}
              onChange={(v) => onChange({ topic: v })}
              optionFilterProp="label"
              options={[
                ...topics.map((t) => ({ value: t.topic, label: t.question ? `${t.topic} — ${t.question}` : t.topic })),
                ...(d.topic && !topics.some((t) => t.topic === d.topic) ? [{ value: d.topic, label: `${d.topic} (chưa duyệt)` }] : []),
              ]}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bot đọc câu trả lời mới nhất đã duyệt của chủ đề này, nên sửa ở Tri thức là sơ đồ tự cập nhật.
            </Text>
          </div>
          <TextField
            label="Câu dự phòng (khi chủ đề chưa có bản duyệt)"
            value={d.fallback_text || ''}
            readOnly={readOnly}
            onChange={(v) => onChange({ fallback_text: v })}
          />
        </Space>
      )}

      {(type === 'handoff' || type === 'end') && (
        <TextField
          label={type === 'end' ? 'Lời chào kết thúc (có thể để trống)' : 'Bot nói'}
          value={d.text || ''}
          readOnly={readOnly}
          onChange={(v) => onChange({ text: v })}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- editor

function FlowEditor({ id }: { id: string }) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.username === 'admin';
  const canEdit = isAdmin || hasPermission('CHATBOT_KB', 'update');
  const canApprove = isAdmin || hasPermission('CHATBOT_KB', 'delete');
  const readOnly = !canEdit;

  const { screenToFlowPosition, fitView, setCenter, getNode } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const [meta, setMeta] = useState<any>(null);
  const [nodes, setNodes] = useState<RFNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [issues, setIssues] = useState<FlowIssue[]>([]);
  const [topics, setTopics] = useState<{ topic: string; question: string | null }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simOpen, setSimOpen] = useState(false);
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chatbotFlowApi.get(id);
      const rf = toRF(res.data.draft_graph);
      setMeta(res.data);
      setNodes(rf.nodes);
      setEdges(rf.edges);
      setIssues(res.data.issues || []);
      setDirty(false);
      setTimeout(() => fitView({ padding: 0.12, minZoom: 0.7, maxZoom: 1 }), 50);
    } catch (err: any) {
      message.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [id, fitView]);

  useEffect(() => {
    load();
    chatbotFlowApi
      .topics()
      .then((r) => setTopics(r.data || []))
      .catch(() => setTopics([]));
  }, [load]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const graph = useMemo(() => toGraph(nodes, edges), [nodes, edges]);
  // Restart the simulator only when logic changes, not when nodes are dragged
  const simKey = useMemo(() => JSON.stringify([graph.nodes.map((n) => [n.id, n.type, n.data]), graph.edges]), [graph]);

  const issueByNode = useMemo(() => {
    const m = new Map<string, FlowIssue[]>();
    for (const i of issues) if (i.node_id) m.set(i.node_id, [...(m.get(i.node_id) || []), i]);
    return m;
  }, [issues]);

  // Decorate nodes with issue/active flags for rendering only
  const viewNodes = useMemo(
    () =>
      nodes.map((n) => {
        const list = issueByNode.get(n.id) || [];
        const level = list.some((i) => i.level === 'error') ? 'error' : list.length ? 'warning' : undefined;
        return { ...n, data: { ...n.data, __issue: level, __active: activeIds.includes(n.id) } };
      }),
    [nodes, issueByNode, activeIds],
  );

  const viewEdges = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return edges.map((e) => {
      const s = byId.get(e.source);
      const h = e.sourceHandle || 'next';
            const isOther = h === 'other';
      const active = activeIds.includes(e.source) && activeIds.includes(e.target);
      return {
        ...e,
        animated: active,
        style: { stroke: isOther ? '#94a3b8' : active ? '#16a34a' : '#64748b', strokeDasharray: isOther ? '5 4' : undefined, strokeWidth: 1.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isOther ? '#94a3b8' : '#64748b' },
      };
    });
  }, [edges, nodes, activeIds]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) {
        changes = changes.filter((c) => c.type === 'select' || c.type === 'dimensions');
      }
      const meaningful = changes.some((c) => c.type !== 'select' && c.type !== 'dimensions');
      setNodes((ns) => {
        const next = applyNodeChanges(changes, ns) as RFNode[];
        if (changes.some((c) => c.type === 'remove')) setEdges((es) => pruneEdges(next, es));
        return next;
      });
      if (meaningful) setDirty(true);
    },
    [readOnly],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) changes = changes.filter((c) => c.type === 'select');
      setEdges((es) => applyEdgeChanges(changes, es));
      if (changes.some((c) => c.type !== 'select')) setDirty(true);
    },
    [readOnly],
  );

  const isValidConnection = useCallback(
    (c: Connection | Edge) => {
      if (!c.source || !c.target || c.source === c.target) return false;
      const t = nodes.find((n) => n.id === c.target);
      return !!t && t.type !== 'start';
    },
    [nodes],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (readOnly) return;
      const handle = c.sourceHandle || 'next';
      // One branch → one target: reconnecting replaces the old edge.
      setEdges((es) =>
        addEdge(
          { ...c, id: uid('e'), sourceHandle: handle },
          es.filter((e) => !(e.source === c.source && (e.sourceHandle || 'next') === handle)),
        ),
      );
      setDirty(true);
    },
    [readOnly],
  );

  const addNode = useCallback(
    (type: FlowNodeType, position?: { x: number; y: number }) => {
      if (readOnly) return;
      const nid = uid('n');
      const pos = position || screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id: nid, type, position: pos, data: defaultData(type), selected: true, deletable: true }]);
      setSelectedId(nid);
      setDirty(true);
    },
    [readOnly, screenToFlowPosition],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(DND_TYPE) as FlowNodeType;
      if (!type || !PALETTE.includes(type)) return;
      addNode(type, screenToFlowPosition({ x: e.clientX - 120, y: e.clientY - 20 }));
    },
    [addNode, screenToFlowPosition],
  );

  const updateNodeData = useCallback(
    (nodeId: string, patch: Partial<EditorNodeData>) => {
      setNodes((ns) => {
        const next = ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n));
        if ('buttons' in patch) setEdges((es) => pruneEdges(next, es));
        return next;
      });
      setDirty(true);
      if ('buttons' in patch) requestAnimationFrame(() => updateNodeInternals(nodeId));
    },
    [updateNodeInternals],
  );

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((ns) => {
      const next = ns.filter((n) => n.id !== nodeId);
      setEdges((es) => pruneEdges(next, es));
      return next;
    });
    setSelectedId(null);
    setDirty(true);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (readOnly) return false;
    setSaving(true);
    try {
      const res = await chatbotFlowApi.update(id, {
        name: meta?.name,
        description: meta?.description,
        priority: meta?.priority,
        graph: toGraph(nodes, edges),
      });
      setMeta(res.data);
      setIssues(res.data.issues || []);
      setDirty(false);
      const errs = (res.data.issues || []).filter((i: FlowIssue) => i.level === 'error').length;
      if (errs) message.warning(`Đã lưu nháp — còn ${errs} lỗi cần sửa trước khi xuất bản`);
      else message.success('Đã lưu nháp');
      return true;
    } catch (err: any) {
      message.error(errMsg(err));
      return false;
    } finally {
      setSaving(false);
    }
  }, [readOnly, id, meta, nodes, edges]);

  // Ctrl/Cmd + S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [dirty, saving, save]);

  const publish = async () => {
    if (dirty && !(await save())) return;
    setPublishing(true);
    try {
      const res = await chatbotFlowApi.publish(id);
      setMeta(res.data);
      setIssues(res.data.issues || []);
      message.success(`Đã xuất bản v${res.data.published_version}`);
    } catch (err: any) {
      const list = err?.response?.data?.issues;
      if (Array.isArray(list)) setIssues(list);
      message.error(errMsg(err));
    } finally {
      setPublishing(false);
    }
  };

  const focusNode = (nodeId?: string) => {
    if (!nodeId) return;
    const n = getNode(nodeId);
    if (!n) return;
    setSelectedId(nodeId);
    setNodes((ns) => ns.map((x) => ({ ...x, selected: x.id === nodeId })));
    setCenter(n.position.x + 120, n.position.y + 60, { zoom: 1.1, duration: 400 });
  };

  const selected = nodes.find((n) => n.id === selectedId) || null;
  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warnCount = issues.length - errorCount;

  if (loading && !meta) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 560, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => (!dirty || window.confirm('Có thay đổi chưa lưu. Rời trang?')) && router.push('/chatbot/flows')} />
        <Input
          value={meta?.name || ''}
          maxLength={120}
          disabled={readOnly}
          onChange={(e) => {
            setMeta((m: any) => ({ ...m, name: e.target.value }));
            setDirty(true);
          }}
          style={{ maxWidth: 320, fontWeight: 600 }}
          variant="borderless"
        />
        {meta?.published_version > 0 ? <Tag color="blue">Đã xuất bản v{meta.published_version}</Tag> : <Tag>Bản nháp</Tag>}
        {meta && !meta.enabled && <Tag color="default">Đang tắt</Tag>}
        {(dirty || meta?.has_unpublished_changes) && meta?.published_version > 0 && <Tag color="orange">Chưa xuất bản thay đổi</Tag>}
        {dirty && <Text type="secondary" style={{ fontSize: 12 }}>● chưa lưu</Text>}
        <div style={{ flex: 1 }} />
        <Button icon={<PlayCircleOutlined />} onClick={() => setSimOpen((v) => !v)} type={simOpen ? 'primary' : 'default'} ghost={simOpen}>
          Chạy thử
        </Button>
        {canEdit && (
          <Tooltip title="Ctrl + S">
            <Button icon={<SaveOutlined />} loading={saving} disabled={!dirty} onClick={save}>
              Lưu nháp
            </Button>
          </Tooltip>
        )}
        {canApprove && (
          <Popconfirm
            title="Xuất bản sơ đồ này?"
            description="Khách trên website sẽ đi theo bản mới ngay (tối đa 30 giây)."
            onConfirm={publish}
            disabled={errorCount > 0 && !dirty}
          >
            <Button type="primary" icon={<CloudUploadOutlined />} loading={publishing} disabled={errorCount > 0 && !dirty}>
              Xuất bản
            </Button>
          </Popconfirm>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Palette */}
        <div style={{ width: 190, borderRight: '1px solid #e2e8f0', padding: 10, overflowY: 'auto', background: '#fafafa' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kéo thả vào sơ đồ
          </Text>
          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size={8}>
            {PALETTE.map((t) => (
              <div
                key={t}
                draggable={!readOnly}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DND_TYPE, t);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDoubleClick={() => addNode(t)}
                style={{
                  cursor: readOnly ? 'not-allowed' : 'grab',
                  border: `1px solid ${NODE_META[t].color}55`,
                  borderLeft: `4px solid ${NODE_META[t].color}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: '#fff',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {NODE_META[t].icon} {NODE_META[t].label}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{NODE_META[t].hint}</div>
              </div>
            ))}
          </Space>
          <Divider style={{ margin: '14px 0 10px' }} />
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            • Kéo từ chấm tròn của nút sang bước tiếp theo để nối nhánh.
            <br />• Chọn liên kết rồi nhấn Delete để xoá.
            <br />• Nhấp đúp vào mục ở trên để thêm nhanh.
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={onDrop}>
          <ReactFlow
            nodes={viewNodes}
            edges={viewEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onSelectionChange={({ nodes: sel }) => setSelectedId(sel.length === 1 ? sel[0].id : null)}
            onPaneClick={() => setSelectedId(null)}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
            fitView
            fitViewOptions={{ padding: 0.12, minZoom: 0.7, maxZoom: 1 }}
            minZoom={0.2}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={(n) => NODE_META[(n.type as FlowNodeType) || 'message']?.color || '#94a3b8'} />
          </ReactFlow>
          {nodes.length <= 1 && (
            <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
              <Alert type="info" showIcon message="Kéo “Tin nhắn” từ cột trái vào đây, rồi nối từ bước Bắt đầu." />
            </div>
          )}
        </div>

        {/* Right panel: simulator or inspector */}
        <div style={{ width: 340, borderLeft: '1px solid #e2e8f0', overflowY: 'auto', background: '#fff' }}>
          {simOpen ? (
            <Simulator key={simKey} graph={graph} onActive={setActiveIds} onClose={() => setSimOpen(false)} />
          ) : selected ? (
            <Inspector
              key={selected.id}
              node={selected}
              readOnly={readOnly}
              topics={topics}
              issues={issueByNode.get(selected.id) || []}
              onChange={(p) => updateNodeData(selected.id, p)}
              onDelete={() => deleteNode(selected.id)}
            />
          ) : (
            <div style={{ padding: 12 }}>
              <b>Cài đặt kịch bản</b>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Mô tả</Text>
                <Input.TextArea
                  rows={2}
                  maxLength={500}
                  value={meta?.description || ''}
                  disabled={readOnly}
                  onChange={(e) => {
                    setMeta((m: any) => ({ ...m, description: e.target.value }));
                    setDirty(true);
                  }}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Độ ưu tiên (khi nhiều kịch bản cùng khớp từ khoá, số lớn chạy trước)</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={-100}
                  max={100}
                  value={meta?.priority ?? 0}
                  disabled={readOnly}
                  onChange={(v) => {
                    setMeta((m: any) => ({ ...m, priority: Number(v) || 0 }));
                    setDirty(true);
                  }}
                />
              </div>
              <Divider style={{ margin: '14px 0 8px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <b style={{ flex: 1 }}>Kiểm tra sơ đồ</b>
                {errorCount > 0 && <Tag color="red">{errorCount} lỗi</Tag>}
                {warnCount > 0 && <Tag color="orange">{warnCount} cảnh báo</Tag>}
              </div>
              {dirty && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kết quả theo lần lưu gần nhất — bấm Lưu nháp để kiểm tra lại.
                </Text>
              )}
              {issues.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có lỗi" />
              ) : (
                <List
                  size="small"
                  dataSource={issues}
                  renderItem={(i) => (
                    <List.Item style={{ cursor: i.node_id ? 'pointer' : 'default', padding: '6px 0' }} onClick={() => focusNode(i.node_id)}>
                      <Space align="start">
                        <span>{i.level === 'error' ? '⛔' : '⚠️'}</span>
                        <span style={{ fontSize: 12 }}>{i.message}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
              <Divider style={{ margin: '14px 0 8px' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chọn 1 bước trên sơ đồ để sửa nội dung. Bấm “Chạy thử” để đóng vai khách đi qua các nhánh.
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlowEditorPage() {
  const params = useParams();
  const id = String(params?.id || '');
  return (
    <AdminLayout>
      <ReactFlowProvider>
        <FlowEditor id={id} />
      </ReactFlowProvider>
    </AdminLayout>
  );
}
