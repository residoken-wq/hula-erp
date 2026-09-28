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
  Select,
  Drawer,
  Form,
  Typography,
  message,
  Badge,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { Text, Title } = Typography;

export default function KnowledgeGapsPage() {
  const { user, hasPermission } = useAuth();
  const canUpdate = user?.username === 'admin' || (hasPermission && hasPermission('CHATBOT_KB', 'update'));
  const canCreate = user?.username === 'admin' || (hasPermission && hasPermission('CHATBOT_KB', 'create'));

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Drawer state for "Soạn trả lời"
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeGap, setActiveGap] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const res = await chatbotKbApi.getGaps({
        status: statusFilter === 'all' ? undefined : statusFilter,
        q: searchText || undefined,
        page,
        limit,
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách khoảng trống kiến thức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [statusFilter, page, limit]);

  const handleSearch = () => {
    setPage(1);
    fetchGaps();
  };

  const handleUpdateStatus = async (gapId: string, newStatus: string) => {
    try {
      await chatbotKbApi.updateGap(gapId, { status: newStatus });
      message.success('Cập nhật trạng thái thành công');
      fetchGaps();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const openComposeDrawer = (gap: any) => {
    setActiveGap(gap);
    form.resetFields();
    form.setFieldsValue({
      question: gap.sample_text || gap.question_norm,
      topic: 'faq.general',
      intent: gap.intent || 'product_advice',
      answer: '',
      public_allowed: true,
    });
    setDrawerOpen(true);
  };

  const handleSaveKnowledge = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 1. Create draft knowledge item
      await chatbotKbApi.create('knowledge', {
        topic: values.topic.trim(),
        intent: values.intent || undefined,
        question: values.question.trim(),
        answer: values.answer.trim(),
        public_allowed: values.public_allowed ?? true,
      });

      // 2. Mark gap as answered
      if (activeGap) {
        await chatbotKbApi.updateGap(activeGap.id, { status: 'answered' });
      }

      message.success('Đã lưu câu trả lời bản nháp và đánh dấu gap đã giải quyết!');
      setDrawerOpen(false);
      fetchGaps();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Không thể lưu câu trả lời');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'idx',
      width: 60,
      render: (_: any, __: any, index: number) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Câu hỏi của khách (Mẫu)',
      dataIndex: 'sample_text',
      key: 'sample_text',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>{text || record.question_norm}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Chuẩn hoá: <code>{record.question_norm}</code>
          </div>
        </div>
      ),
    },
    {
      title: 'Ý định',
      dataIndex: 'intent',
      key: 'intent',
      width: 140,
      render: (intent: string) => (intent ? <Tag color="blue">{intent}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Số lần gặp',
      dataIndex: 'count',
      key: 'count',
      width: 110,
      align: 'center' as const,
      sorter: (a: any, b: any) => a.count - b.count,
      render: (count: number) => (
        <Badge
          count={count}
          overflowCount={9999}
          style={{
            backgroundColor: count > 3 ? '#ef4444' : count > 1 ? '#f59e0b' : '#3b82f6',
            fontSize: 13,
            padding: '0 8px',
          }}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        if (status === 'open') return <Tag color="error">Đang mở</Tag>;
        if (status === 'answered') return <Tag color="success">Đã giải quyết</Tag>;
        if (status === 'ignored') return <Tag color="default">Bỏ qua</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: 'Lần cuối xuất hiện',
      dataIndex: 'last_seen_at',
      key: 'last_seen_at',
      width: 170,
      render: (dateStr: string) =>
        dateStr ? new Date(dateStr).toLocaleString('vi-VN', { hour12: false }) : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {canCreate && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openComposeDrawer(record)}
            >
              Soạn trả lời
            </Button>
          )}
          {canUpdate && record.status === 'open' && (
            <Tooltip title="Đánh dấu bỏ qua">
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'ignored')}
              />
            </Tooltip>
          )}
          {canUpdate && record.status !== 'open' && (
            <Tooltip title="Mở lại khoảng trống">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'open')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '0 8px' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            Khoảng trống kiến thức
          </Title>
          <Text type="secondary">
            Tổng hợp các câu hỏi khách hàng đặt ra mà trợ lý AI chưa có câu trả lời phù hợp trong kho tri thức
          </Text>
        </div>

        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Space wrap>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 160 }}
                options={[
                  { value: 'open', label: '🔴 Đang mở' },
                  { value: 'answered', label: '🟢 Đã giải quyết' },
                  { value: 'ignored', label: '⚪ Bỏ qua' },
                  { value: 'all', label: 'Tất cả trạng thái' },
                ]}
              />

              <Input.Search
                placeholder="Tìm kiếm câu hỏi..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 280 }}
              />
            </Space>

            <Button icon={<ReloadOutlined />} onClick={fetchGaps} loading={loading}>
              Làm mới
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (p, l) => {
                setPage(p);
                setLimit(l);
              },
              showTotal: (t) => `Tổng cộng ${t} khoảng trống`,
            }}
          />
        </Card>

        {/* Drawer Soạn trả lời */}
        <Drawer
          title={
            <div>
              <div style={{ fontWeight: 600 }}>Soạn câu trả lời cho khoảng trống kiến thức</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Lưu vào kho tri thức dạng bản nháp và tự động đánh dấu gap là đã giải quyết
              </div>
            </div>
          }
          width={560}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setDrawerOpen(false)}>Huỷ</Button>
              <Button type="primary" loading={saving} onClick={handleSaveKnowledge}>
                Lưu bản nháp & Đóng gap
              </Button>
            </div>
          }
        >
          {activeGap && (
            <div
              style={{
                marginBottom: 20,
                padding: '12px 16px',
                background: '#f3f4f6',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                CÂU HỎI KHÁCH HÀNG ĐẶT RA ({activeGap.count} lần):
              </div>
              <div style={{ fontWeight: 600, color: '#111827' }}>
                "{activeGap.sample_text || activeGap.question_norm}"
              </div>
            </div>
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              name="question"
              label="Câu hỏi chuẩn hoá"
              rules={[{ required: true, message: 'Vui lòng nhập câu hỏi' }]}
            >
              <Input placeholder="Ví dụ: Có bán nệm cho chó mèo không?" />
            </Form.Item>

            <Form.Item
              name="topic"
              label="Chủ đề (Topic)"
              extra="Chỉ dùng chữ thường, số, dấu chấm và gạch dưới (VD: faq.general, product.accessories)"
              rules={[
                { required: true, message: 'Vui lòng nhập chủ đề' },
                {
                  pattern: /^[a-z0-9_.]+$/,
                  message: 'Chủ đề chỉ được chứa chữ thường, số, dấu chấm (.) và gạch dưới (_)',
                },
              ]}
            >
              <Input placeholder="faq.general" />
            </Form.Item>

            <Form.Item name="intent" label="Ý định (Intent)">
              <Select
                options={[
                  { value: 'product_advice', label: 'Tư vấn sản phẩm (product_advice)' },
                  { value: 'price', label: 'Hỏi giá (price)' },
                  { value: 'order_status', label: 'Đơn hàng (order_status)' },
                  { value: 'invoice', label: 'Hoá đơn VAT (invoice)' },
                  { value: 'payment', label: 'Thanh toán (payment)' },
                  { value: 'sample', label: 'Xem mẫu (sample)' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="answer"
              label="Câu trả lời của trợ lý AI"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung câu trả lời' }]}
              extra="Có thể dùng placeholder: {short_name}, {hotline}, {email_public}, {zalo_url}, {working_hours_text}"
            >
              <Input.TextArea
                rows={6}
                placeholder="Nhập nội dung trả lời cho khách hàng..."
              />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </AdminLayout>
  );
}
