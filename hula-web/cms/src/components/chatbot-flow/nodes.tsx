'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { START_ACTION_OPTIONS, type FlowNodeData, type FlowNodeType } from './engine';

export type EditorNodeData = FlowNodeData & {
  __issue?: 'error' | 'warning';
  __active?: boolean;
  [key: string]: unknown;
};

export const NODE_META: Record<FlowNodeType, { label: string; icon: string; color: string; hint: string }> = {
  start: { label: 'Bắt đầu', icon: '▶', color: '#16a34a', hint: 'Khi nào kịch bản chạy' },
  message: { label: 'Tin nhắn', icon: '💬', color: '#2563eb', hint: 'Bot nói + nút cho khách chọn' },
  knowledge: { label: 'Tri thức', icon: '📚', color: '#7c3aed', hint: 'Lấy câu trả lời đã duyệt trong kho' },
  handoff: { label: 'Chuyển nhân viên', icon: '🙋', color: '#ea580c', hint: 'Mời khách gặp nhân viên, kết thúc' },
  end: { label: 'Kết thúc', icon: '🏁', color: '#64748b', hint: 'Dừng kịch bản, bot trả lời thường' },
};

const handleStyle = (color: string) => ({ width: 10, height: 10, background: color, border: '2px solid #fff' });

function Shell({
  type,
  data,
  selected,
  children,
}: {
  type: FlowNodeType;
  data: EditorNodeData;
  selected?: boolean;
  children: React.ReactNode;
}) {
  const meta = NODE_META[type];
  const border = data.__issue === 'error' ? '#dc2626' : data.__issue === 'warning' ? '#f59e0b' : selected ? meta.color : '#e2e8f0';
  return (
    <div
      style={{
        width: 240,
        background: '#fff',
        borderRadius: 10,
        border: `2px solid ${border}`,
        boxShadow: data.__active
          ? `0 0 0 4px ${meta.color}33, 0 6px 16px rgba(15,23,42,.15)`
          : '0 2px 6px rgba(15,23,42,.08)',
        fontSize: 12,
        transition: 'box-shadow .2s',
      }}
    >
      <div
        style={{
          background: meta.color,
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '7px 7px 0 0',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{meta.icon}</span>
        <span style={{ flex: 1 }}>{meta.label}</span>
        {data.__issue === 'error' && <span title="Có lỗi">⛔</span>}
        {data.__issue === 'warning' && <span title="Cần xem lại">⚠️</span>}
      </div>
      <div style={{ padding: '8px 10px' }}>{children}</div>
    </div>
  );
}

const clamp: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  color: '#334155',
  whiteSpace: 'pre-wrap',
};

const Empty = ({ text }: { text: string }) => <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{text}</span>;

export const StartNode = memo(({ data, selected }: NodeProps) => {
  const d = data as EditorNodeData;
  const actions = d.start_actions || [];
  const keywords = d.keywords || [];
  return (
    <Shell type="start" data={d} selected={selected}>
      {!actions.length && !keywords.length && <Empty text="Chưa chọn cách khởi động" />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {actions.map((a) => (
          <span key={a} style={{ background: '#dcfce7', color: '#166534', borderRadius: 999, padding: '1px 8px' }}>
            Nút: {START_ACTION_OPTIONS.find((o) => o.value === a)?.label || a}
          </span>
        ))}
        {keywords.map((k) => (
          <span key={k} style={{ background: '#f1f5f9', borderRadius: 999, padding: '1px 8px' }}>
            “{k}”
          </span>
        ))}
      </div>
      <Handle type="source" position={Position.Right} id="next" style={handleStyle(NODE_META.start.color)} />
    </Shell>
  );
});
StartNode.displayName = 'StartNode';

export const MessageNode = memo(({ data, selected }: NodeProps) => {
  const d = data as EditorNodeData;
  const buttons = d.buttons || [];
  const color = NODE_META.message.color;
  return (
    <Shell type="message" data={d} selected={selected}>
      <Handle type="target" position={Position.Left} style={handleStyle('#94a3b8')} />
      <div style={clamp}>{d.text || <Empty text="Chưa có nội dung" />}</div>
      {buttons.length > 0 ? (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {buttons.map((b) => (
            <div
              key={b.id}
              style={{
                position: 'relative',
                border: `1px solid ${color}55`,
                background: '#eff6ff',
                color: '#1e40af',
                borderRadius: 999,
                padding: '3px 14px 3px 10px',
                fontWeight: 600,
              }}
            >
              {b.label || <Empty text="(chưa đặt chữ)" />}
              {!!b.keywords?.length && (
                <span style={{ color: '#64748b', fontWeight: 400 }}> · {b.keywords.length} từ khoá</span>
              )}
              <Handle type="source" position={Position.Right} id={b.id} style={{ ...handleStyle(color), right: -12 }} />
            </div>
          ))}
          <div
            style={{
              position: 'relative',
              border: '1px dashed #cbd5e1',
              color: '#64748b',
              borderRadius: 999,
              padding: '3px 14px 3px 10px',
            }}
          >
            Khác (khách gõ câu khác)
            <Handle type="source" position={Position.Right} id="other" style={{ ...handleStyle('#94a3b8'), right: -12 }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 11 }}>Không có nút → đi tiếp ngay</div>
          <Handle type="source" position={Position.Right} id="next" style={handleStyle(color)} />
        </>
      )}
    </Shell>
  );
});
MessageNode.displayName = 'MessageNode';

export const KnowledgeNode = memo(({ data, selected }: NodeProps) => {
  const d = data as EditorNodeData;
  return (
    <Shell type="knowledge" data={d} selected={selected}>
      <Handle type="target" position={Position.Left} style={handleStyle('#94a3b8')} />
      <div style={{ fontWeight: 600, color: '#5b21b6' }}>{d.topic || <Empty text="Chưa chọn chủ đề" />}</div>
      {d.fallback_text && <div style={{ ...clamp, marginTop: 4, color: '#64748b' }}>Dự phòng: {d.fallback_text}</div>}
      <Handle type="source" position={Position.Right} id="next" style={handleStyle(NODE_META.knowledge.color)} />
    </Shell>
  );
});
KnowledgeNode.displayName = 'KnowledgeNode';

export const HandoffNode = memo(({ data, selected }: NodeProps) => {
  const d = data as EditorNodeData;
  return (
    <Shell type="handoff" data={d} selected={selected}>
      <Handle type="target" position={Position.Left} style={handleStyle('#94a3b8')} />
      <div style={clamp}>{d.text || <Empty text="Chưa có nội dung" />}</div>
      <div style={{ marginTop: 6, color: '#c2410c', fontSize: 11 }}>+ nút “Gặp nhân viên tư vấn”</div>
    </Shell>
  );
});
HandoffNode.displayName = 'HandoffNode';

export const EndNode = memo(({ data, selected }: NodeProps) => {
  const d = data as EditorNodeData;
  return (
    <Shell type="end" data={d} selected={selected}>
      <Handle type="target" position={Position.Left} style={handleStyle('#94a3b8')} />
      <div style={clamp}>{d.text || <Empty text="(không nói gì thêm)" />}</div>
    </Shell>
  );
});
EndNode.displayName = 'EndNode';

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  knowledge: KnowledgeNode,
  handoff: HandoffNode,
  end: EndNode,
};
