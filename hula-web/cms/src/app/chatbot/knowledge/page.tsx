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
  Switch,
  Tabs,
  Typography,
  message,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { Text } = Typography;

export default function KnowledgePage() {
  const { user, hasPermission } = useAuth();
  const canPublish = user?.username === 'admin' || hasPermission('CHATBOT_KB', 'delete');

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await chatbotKbApi.getList('knowledge', {
        status: statusFilter || undefined,
        q: searchText || undefined,
        page,
        limit: 20,
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, page]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const openCreate = () => {
    setEditingItem(null);
    setComparisonData(null);
    setActiveTab('editor');
    form.resetFields();
    form.setFieldsValue({
      topic: '',
      question: '',
      answer: '',
      public_allowed: true,
      product_sku: '',
      conflict_code: '',
      effective_from: '',
      effective_to: '',
    });
    setDrawerOpen(true);
  };

  const openEdit = async (record: any) => {
    try {
      const detailRes = await chatbotKbApi.getOne('knowledge', record.id);
      const data = detailRes.data;
      setEditingItem(data);
      setComparisonData(data);
      setActiveTab('editor');
      form.resetFields();
      form.setFieldsValue({
        topic: data.topic,
        question: data.question || '',
        answer: data.answer || '',
        public_allowed: !!data.public_allowed,
        product_sku: data.product_sku || '',
        conflict_code: data.conflict_code || '',
        effective_from: data.effective_from || '',
        effective_to: data.effective_to || '',
      });
      setDrawerOpen(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handleSave = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await chatbotKbApi.update('knowledge', editingItem.id, values);
        message.success('Cập nhật tri thức thành công');
      } else {
        await chatbotKbApi.create('knowledge', values);
        message.success('Tạo bản nháp tri thức thành công');
      }
      setDrawerOpen(false);
      fetchItems();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (id: string) => {
    try {
      await chatbotKbApi.submit('knowledge', id);
      message.success('Đã gửi duyệt tri thức');
      fetchItems();
      if (editingItem?.id === id) setDrawerOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await chatbotKbApi.publish('knowledge', id);
      message.success('Xuất bản tri thức thành công');
      fetchItems();
      if (editingItem?.id === id) setDrawerOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handleRetire = async (id: string) => {
    try {
      await chatbotKbApi.retire('knowledge', id);
      message.success('Đã thu hồi tri thức');
      fetchItems();
      if (editingItem?.id === id) setDrawerOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'published':
        return <Tag color="green">Xuất bản</Tag>;
      case 'needs_review':
        return <Tag color="orange">Chờ duyệt</Tag>;
      case 'draft':
        return <Tag color="blue">Bản nháp</Tag>;
      case 'retired':
        return <Tag color="default">Đã thu hồi</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (t: string, r: any) => (
        <Space direction="vertical" size={2}>
          <Text strong>{t}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            v{r.version} • {r.public_allowed ? 'Công khai' : 'Nội bộ'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Câu hỏi / Trả lời',
      key: 'qa',
      render: (_: any, r: any) => (
        <div style={{ maxWidth: 450 }}>
          {r.question && (
            <div style={{ fontWeight: 500, marginBottom: 4, color: '#1677ff' }}>
              Q: {r.question}
            </div>
          )}
          <div
            style={{
              whiteSpace: 'pre-wrap',
              maxHeight: 70,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 13,
            }}
          >
            {r.answer}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => getStatusTag(s),
    },
    {
      title: 'Conflict',
      dataIndex: 'conflict_code',
      key: 'conflict_code',
      render: (c: string) => (c ? <Tag color="volcano">{c}</Tag> : '-'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(r)}
            disabled={r.status === 'retired'}
          >
            Sửa
          </Button>
          {r.status === 'draft' && (
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSubmitReview(r.id)}
            >
              Gửi duyệt
            </Button>
          )}
          {canPublish && (r.status === 'draft' || r.status === 'needs_review') && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handlePublish(r.id)}
            >
              Xuất bản
            </Button>
          )}
          {canPublish && r.status === 'published' && (
            <Popconfirm
              title="Thu hồi tri thức này?"
              onConfirm={() => handleRetire(r.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Thu hồi
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const prevItem = comparisonData?.previous_published;

  return (
    <AdminLayout>
      <Card
        title="Quản lý Tri thức & Kịch bản"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm tri thức
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Tìm theo từ khóa..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'published', label: 'Đang xuất bản' },
              { value: 'needs_review', label: 'Chờ duyệt' },
              { value: 'draft', label: 'Bản nháp' },
              { value: 'retired', label: 'Đã thu hồi' },
            ]}
          />
          <Button onClick={handleSearch} icon={<SearchOutlined />}>
            Lọc
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>

      <Drawer
        title={editingItem ? `Chỉnh sửa tri thức (v${editingItem.version})` : 'Tạo mới tri thức'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            {editingItem && editingItem.status === 'draft' && (
              <Button icon={<SendOutlined />} onClick={() => handleSubmitReview(editingItem.id)}>
                Gửi duyệt
              </Button>
            )}
            {canPublish && editingItem && (editingItem.status === 'draft' || editingItem.status === 'needs_review') && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handlePublish(editingItem.id)}>
                Xuất bản
              </Button>
            )}
            {canPublish && editingItem && editingItem.status === 'published' && (
              <Button danger icon={<StopOutlined />} onClick={() => handleRetire(editingItem.id)}>
                Thu hồi
              </Button>
            )}
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'editor',
              label: 'Soạn thảo',
              children: (
                <Form form={form} layout="vertical" onFinish={handleSave}>
                  <Form.Item
                    label="Topic"
                    name="topic"
                    rules={[
                      { required: true, message: 'Vui lòng nhập topic' },
                      { pattern: /^[a-z0-9_.]+$/, message: 'Chỉ gồm chữ thường, số, dấu chấm và gạch dưới' },
                    ]}
                  >
                    <Input placeholder="ví dụ: faq.nem_ve_sinh, product.spec.size..." />
                  </Form.Item>

                  <Form.Item label="Câu hỏi (tùy chọn)" name="question">
                    <Input placeholder="Câu hỏi mẫu thường gặp từ khách..." />
                  </Form.Item>

                  <Form.Item
                    label="Nội dung trả lời"
                    name="answer"
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung trả lời' }]}
                  >
                    <Input.TextArea rows={6} placeholder="Nội dung tri thức chính xác, không đưa thông tin nhạy cảm..." />
                  </Form.Item>

                  <Form.Item label="Mã SKU liên quan (tùy chọn)" name="product_sku">
                    <Input placeholder="ví dụ: NEM-COTTON-120" />
                  </Form.Item>

                  <Form.Item label="Mã mâu thuẫn cần khóa (nếu có)" name="conflict_code">
                    <Input placeholder="ví dụ: D03, D05..." />
                  </Form.Item>

                  <Space size="large" style={{ display: 'flex', marginBottom: 16 }}>
                    <Form.Item label="Cho phép công khai" name="public_allowed" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Hiệu lực từ" name="effective_from">
                      <Input placeholder="YYYY-MM-DD" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item label="Hiệu lực đến" name="effective_to">
                      <Input placeholder="YYYY-MM-DD" style={{ width: 140 }} />
                    </Form.Item>
                  </Space>

                  <Button type="primary" htmlType="submit" loading={submitting} block size="large">
                    {editingItem ? 'Lưu cập nhật' : 'Tạo bản nháp'}
                  </Button>
                </Form>
              ),
            },
            {
              key: 'compare',
              label: (
                <span>
                  <SwapOutlined /> So sánh phiên bản
                </span>
              ),
              children: (
                <div>
                  {!prevItem ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                      Chưa có bản xuất bản trước đó để so sánh.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <Text type="secondary">
                        Đang so sánh bản hiện tại (v{editingItem?.version} - {editingItem?.status}) với bản xuất bản trước (v{prevItem?.version}).
                      </Text>

                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item
                          label="Topic"
                          style={{
                            backgroundColor: editingItem?.topic !== prevItem?.topic ? '#fffbe6' : undefined,
                          }}
                        >
                          <div><strong>Hiện tại:</strong> {editingItem?.topic}</div>
                          <div><Text type="secondary">Bản trước:</Text> {prevItem?.topic}</div>
                        </Descriptions.Item>

                        <Descriptions.Item
                          label="Câu hỏi"
                          style={{
                            backgroundColor: editingItem?.question !== prevItem?.question ? '#fffbe6' : undefined,
                          }}
                        >
                          <div><strong>Hiện tại:</strong> {editingItem?.question || '(trống)'}</div>
                          <div><Text type="secondary">Bản trước:</Text> {prevItem?.question || '(trống)'}</div>
                        </Descriptions.Item>

                        <Descriptions.Item
                          label="Trả lời"
                          style={{
                            backgroundColor: editingItem?.answer !== prevItem?.answer ? '#fffbe6' : undefined,
                          }}
                        >
                          <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                            <strong>Hiện tại:</strong>
                            <div style={{ padding: 6, background: '#f6ffed', borderRadius: 4 }}>{editingItem?.answer}</div>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>
                            <Text type="secondary">Bản trước:</Text>
                            <div style={{ padding: 6, background: '#f5f5f5', borderRadius: 4 }}>{prevItem?.answer}</div>
                          </div>
                        </Descriptions.Item>

                        <Descriptions.Item
                          label="Công khai"
                          style={{
                            backgroundColor: editingItem?.public_allowed !== prevItem?.public_allowed ? '#fffbe6' : undefined,
                          }}
                        >
                          <div><strong>Hiện tại:</strong> {editingItem?.public_allowed ? 'Có' : 'Không'}</div>
                          <div><Text type="secondary">Bản trước:</Text> {prevItem?.public_allowed ? 'Có' : 'Không'}</div>
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    </AdminLayout>
  );
}
