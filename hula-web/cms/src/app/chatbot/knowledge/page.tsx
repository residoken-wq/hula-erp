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
  Modal,
  Upload,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  SwapOutlined,
  UploadOutlined,
  CheckSquareOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { Text } = Typography;

export default function KnowledgePage() {
  const { user, hasPermission } = useAuth();
  const canPublish = user?.username === 'admin' || (hasPermission && hasPermission('CHATBOT_KB', 'delete'));

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  // Selection for Batch Publish
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    success: number;
    locked: { id: string; topic: string; conflicts: string[] }[];
    errors: { id: string; topic: string; error: string }[];
  } | null>(null);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonData, setImportJsonData] = useState<any | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    skipped: number;
    conflicts_inserted: number;
  } | null>(null);

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

  // Batch Publish Logic
  const handleBatchPublish = async () => {
    if (selectedRowKeys.length === 0) return;
    setBatchPublishing(true);

    let successCount = 0;
    const lockedList: { id: string; topic: string; conflicts: string[] }[] = [];
    const errorList: { id: string; topic: string; error: string }[] = [];

    for (const key of selectedRowKeys) {
      const id = String(key);
      const item = items.find((it) => it.id === id);
      const topic = item?.topic || id;

      try {
        await chatbotKbApi.publish('knowledge', id);
        successCount++;
      } catch (err: any) {
        const resp = err.response?.data;
        if (resp?.code === 'CONFLICT_LOCKED') {
          lockedList.push({
            id,
            topic,
            conflicts: resp.conflicts || [],
          });
        } else {
          errorList.push({
            id,
            topic,
            error: resp?.message || err.message,
          });
        }
      }
    }

    setBatchPublishing(false);
    setSelectedRowKeys([]);
    setBatchResult({
      success: successCount,
      locked: lockedList,
      errors: errorList,
    });
    fetchItems();
  };

  // File Upload handler for Import JSON
  const handleFileChange = (file: File) => {
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.format !== 'hula-chatbot-kb') {
          message.error('File không đúng định dạng hula-chatbot-kb');
          setImportJsonData(null);
          return;
        }
        setImportJsonData(parsed);
      } catch (err: any) {
        message.error('Không thể đọc file JSON: ' + err.message);
        setImportJsonData(null);
      }
    };
    reader.readAsText(file);
    return false; // prevent default upload
  };

  const handleExecuteImport = async () => {
    if (!importJsonData) return;
    setImporting(true);
    try {
      const res = await chatbotKbApi.importKb(importJsonData);
      setImportResult(res.data);
      message.success('Nhập dữ liệu thành công!');
      fetchItems();
    } catch (err: any) {
      const resp = err.response?.data;
      const code = resp?.code;
      const msg = resp?.message || err.message;
      message.error(code ? `[${code}] ${msg}` : msg);
    } finally {
      setImporting(false);
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
      render: (c: string) => (c ? <Tag color="magenta">{c}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            Xem / Sửa
          </Button>
          {r.status === 'draft' && (
            <Button size="small" icon={<SendOutlined />} onClick={() => handleSubmitReview(r.id)}>
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

  // Extract review note if present
  const reviewNote =
    editingItem?.review_note ||
    (Array.isArray(editingItem?.source_refs)
      ? editingItem.source_refs.find((s: any) => s.review_note || s.note)?.review_note ||
        editingItem.source_refs.find((s: any) => s.review_note || s.note)?.note
      : null);

  return (
    <AdminLayout>
      <Card
        title="Quản lý Tri thức & Kịch bản"
        extra={
          <Space>
            {canPublish && selectedRowKeys.length > 0 && (
              <Button
                type="default"
                icon={<CheckSquareOutlined />}
                loading={batchPublishing}
                onClick={handleBatchPublish}
                style={{ borderColor: '#10b981', color: '#10b981' }}
              >
                Duyệt hàng loạt ({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
              Nhập JSON
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm tri thức
            </Button>
          </Space>
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
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status === 'published' || record.status === 'retired',
            }),
          }}
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

      {/* Drawer Soạn thảo & Xem chi tiết */}
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
        {/* Yellow callout for review note */}
        {reviewNote && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              color: '#92400e',
            }}
          >
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <WarningOutlined style={{ color: '#d97706' }} /> Ghi chú cho người duyệt
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{reviewNote}</div>
          </div>
        )}

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
                    <Descriptions title="So sánh với bản đang/đã xuất bản" bordered column={1}>
                      <Descriptions.Item label="Phiên bản trước">v{prevItem.version} ({prevItem.status})</Descriptions.Item>
                      <Descriptions.Item label="Câu hỏi trước">{prevItem.question || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Trả lời trước">
                        <div style={{ whiteSpace: 'pre-wrap', color: '#dc2626' }}>{prevItem.answer}</div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trả lời hiện tại">
                        <div style={{ whiteSpace: 'pre-wrap', color: '#16a34a' }}>{editingItem?.answer}</div>
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Drawer>

      {/* Modal Nhập JSON */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>Nhập kho tri thức từ file JSON (kb-v2.json)</span>
          </div>
        }
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          setImportJsonData(null);
          setImportResult(null);
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onClick={() => {
                setImportModalOpen(false);
                setImportJsonData(null);
                setImportResult(null);
              }}
            >
              Đóng
            </Button>
            {importJsonData && !importResult && (
              <Button type="primary" loading={importing} onClick={handleExecuteImport}>
                Tiến hành nhập
              </Button>
            )}
          </div>
        }
        width={580}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>
            Chọn file định dạng <code>hula-chatbot-kb</code> (ví dụ: <code>docs/chatbot/knowledge/kb-v2.json</code>).
            Mọi mục nhập mới sẽ ở trạng thái <strong>draft</strong> hoặc <strong>needs_review</strong>.
          </p>

          <Upload.Dragger
            accept=".json"
            beforeUpload={handleFileChange}
            showUploadList={false}
            style={{ padding: '20px 0', background: '#fafafa', borderRadius: 8 }}
          >
            <p className="ant-upload-drag-icon" style={{ fontSize: 36, color: '#1677ff', marginBottom: 8 }}>
              <UploadOutlined />
            </p>
            <p style={{ fontWeight: 500, margin: '0 0 4px 0' }}>
              {importFileName ? importFileName : 'Nhấp hoặc kéo thả file JSON vào đây'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Hỗ trợ file kb-v2.json</p>
          </Upload.Dragger>
        </div>

        {importJsonData && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 6 }}>
              Xem trước nội dung file:
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#0f172a' }}>
              <li>
                Mục tri thức (knowledge): <strong>{importJsonData.knowledge?.length || 0}</strong> mục
              </li>
              <li>
                Kịch bản (scripts): <strong>{importJsonData.scripts?.length || 0}</strong> mục
              </li>
              <li>
                Mâu thuẫn (conflicts): <strong>{importJsonData.conflicts?.length || 0}</strong> mục
              </li>
              <li>Phiên bản: v{importJsonData.version}</li>
            </ul>
          </div>
        )}

        {importResult && (
          <Alert
            message="Kết quả nhập dữ liệu"
            description={
              <div>
                <div>
                  - Đã nhập mới: <strong>{importResult.inserted}</strong> mục
                </div>
                <div>
                  - Bỏ qua (đã tồn tại): <strong>{importResult.skipped}</strong> mục
                </div>
                <div>
                  - Mâu thuẫn đã thêm: <strong>{importResult.conflicts_inserted}</strong> mục
                </div>
              </div>
            }
            type="success"
            showIcon
          />
        )}
      </Modal>

      {/* Modal Kết quả Duyệt hàng loạt */}
      <Modal
        title="Kết quả duyệt hàng loạt"
        open={!!batchResult}
        onOk={() => setBatchResult(null)}
        onCancel={() => setBatchResult(null)}
        width={600}
      >
        {batchResult && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Alert
                message={`Đã xử lý xong ${batchResult.success + batchResult.locked.length + batchResult.errors.length} mục`}
                description={
                  <div>
                    <div style={{ color: '#16a34a' }}>
                      ✔ Xuất bản thành công: <strong>{batchResult.success}</strong> mục
                    </div>
                    {batchResult.locked.length > 0 && (
                      <div style={{ color: '#d97706', marginTop: 4 }}>
                        ⚠ Bị khoá do mâu thuẫn (CONFLICT_LOCKED): <strong>{batchResult.locked.length}</strong> mục
                      </div>
                    )}
                    {batchResult.errors.length > 0 && (
                      <div style={{ color: '#dc2626', marginTop: 4 }}>
                        ✖ Lỗi khác: <strong>{batchResult.errors.length}</strong> mục
                      </div>
                    )}
                  </div>
                }
                type={batchResult.locked.length > 0 ? 'warning' : 'success'}
                showIcon
              />
            </div>

            {batchResult.locked.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
                  Danh sách mục bị khoá mâu thuẫn:
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {batchResult.locked.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        padding: '6px 10px',
                        background: '#fef3c7',
                        borderRadius: 6,
                        marginBottom: 4,
                        fontSize: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{l.topic}</span>
                      <span>
                        Mã khoá: <strong>{l.conflicts.join(', ') || 'N/A'}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
