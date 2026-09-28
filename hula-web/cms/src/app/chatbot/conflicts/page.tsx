'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Typography,
  message,
  Popconfirm,
  Badge,
} from 'antd';
import {
  CheckOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { Text } = Typography;

export default function ConflictsPage() {
  const { user, hasPermission } = useAuth();
  const canResolve = user?.username === 'admin' || hasPermission('CHATBOT_KB', 'delete');

  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingItem, setResolvingItem] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const res = await chatbotKbApi.getConflicts();
      setConflicts(res.data.items || []);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const openResolveModal = (record: any) => {
    setResolvingItem(record);
    setResolutionText(record.resolution || '');
    setModalOpen(true);
  };

  const handleResolve = async () => {
    if (!resolvingItem) return;
    try {
      await chatbotKbApi.resolveConflict(resolvingItem.code, {
        status: 'resolved',
        resolution: resolutionText,
      });
      message.success(`Đã giải quyết mâu thuẫn ${resolvingItem.code}`);
      setModalOpen(false);
      fetchConflicts();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handleReopen = async (code: string) => {
    try {
      await chatbotKbApi.resolveConflict(code, {
        status: 'open',
        resolution: null,
      });
      message.success(`Đã mở lại mâu thuẫn ${code}`);
      fetchConflicts();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      render: (c: string) => <Tag color="volcano" style={{ fontWeight: 600 }}>{c}</Tag>,
      width: 70,
    },
    {
      title: 'Tiêu đề & Rủi ro',
      key: 'title',
      render: (_: any, r: any) => (
        <div style={{ maxWidth: 450 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
          <Text type="danger" style={{ fontSize: 12 }}>
            Rủi ro: {r.risk}
          </Text>
        </div>
      ),
    },
    {
      title: 'Topic bị khóa',
      dataIndex: 'locked_topics',
      key: 'locked_topics',
      render: (topics: string[]) => (
        <div>
          {(topics || []).map((t, idx) => (
            <Tag key={idx} color="red" icon={<LockOutlined />}>
              {t}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Phụ trách',
      dataIndex: 'owner_role',
      key: 'owner_role',
      render: (r: string) => <Tag color="blue">{r}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Badge
          status={s === 'resolved' ? 'success' : 'error'}
          text={s === 'resolved' ? 'Đã giải quyết' : 'Đang mở (Khóa)'}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          {canResolve && r.status === 'open' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => openResolveModal(r)}
            >
              Giải quyết
            </Button>
          )}
          {canResolve && r.status === 'resolved' && (
            <Popconfirm title="Mở lại mâu thuẫn này?" onConfirm={() => handleReopen(r.code)}>
              <Button size="small" icon={<ReloadOutlined />}>
                Mở lại
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card
        title="Danh sách Mâu thuẫn Dữ liệu (D01 - D16)"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchConflicts}>
            Tải lại
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Khi mâu thuẫn ở trạng thái "Đang mở", các topic liên quan sẽ tự động bị khóa, không thể xuất bản
            cho đến khi người có thẩm quyền phê duyệt phương án giải quyết.
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={conflicts}
          rowKey="code"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={`Giải quyết mâu thuẫn ${resolvingItem?.code}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleResolve}
        okText="Xác nhận giải quyết"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong>{resolvingItem?.title}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Nhập phương án giải quyết / căn cứ chính sách:</Text>
        </div>
        <Input.TextArea
          rows={4}
          value={resolutionText}
          onChange={(e) => setResolutionText(e.target.value)}
          placeholder="Ghi rõ quyết định của ban giám đốc hoặc chính sách áp dụng..."
        />
      </Modal>
    </AdminLayout>
  );
}
