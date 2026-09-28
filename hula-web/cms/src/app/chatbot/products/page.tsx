'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Input,
  Modal,
  Form,
  Tabs,
  Typography,
  message,
  Popconfirm,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { Text } = Typography;

const FACT_KEYS = [
  { value: 'size', label: 'Kích thước (size)' },
  { value: 'structure', label: 'Cấu tạo (structure)' },
  { value: 'finished_thickness', label: 'Độ dày hoàn thiện (finished_thickness)' },
  { value: 'material', label: 'Tuyên bố chất liệu (material)' },
  { value: 'care_instruction', label: 'Hướng dẫn bảo quản (care_instruction)' },
  { value: 'age_guidance', label: 'Độ tuổi phù hợp (age_guidance)' },
  { value: 'anti_slip', label: 'Chống trượt (anti_slip)' },
  { value: 'bag_fit', label: 'Độ vừa túi đựng (bag_fit)' },
  { value: 'other', label: 'Khác (other)' },
];

export default function ProductsPage() {
  const { user, hasPermission } = useAuth();
  const canPublish = user?.username === 'admin' || hasPermission('CHATBOT_KB', 'delete');

  const [products, setProducts] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Facts
  const [facts, setFacts] = useState<any[]>([]);
  const [loadingFacts, setLoadingFacts] = useState(false);
  const [factModalOpen, setFactModalOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<any | null>(null);
  const [factForm] = Form.useForm();

  // Bundles
  const [bundles, setBundles] = useState<any[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleForm] = Form.useForm();

  // Fetch website products
  const fetchProducts = async () => {
    try {
      const res = await chatbotKbApi.getWebsiteProducts();
      const items = res.data.items || [];
      setProducts(items);
      if (items.length > 0 && !selectedSku) {
        setSelectedSku(items[0].sku);
        setSelectedProduct(items[0]);
      }
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // Fetch facts for selected SKU
  const fetchFacts = async (sku: string) => {
    if (!sku) return;
    setLoadingFacts(true);
    try {
      const res = await chatbotKbApi.getList('facts', { sku, limit: 100 });
      setFacts(res.data.items || []);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoadingFacts(false);
    }
  };

  // Fetch bundles
  const fetchBundles = async () => {
    setLoadingBundles(true);
    try {
      const res = await chatbotKbApi.getList('bundles', { limit: 100 });
      setBundles(res.data.items || []);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoadingBundles(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBundles();
  }, []);

  useEffect(() => {
    if (selectedSku) {
      fetchFacts(selectedSku);
    }
  }, [selectedSku]);

  const handleSelectSku = (sku: string) => {
    setSelectedSku(sku);
    const prod = products.find((p) => p.sku === sku);
    setSelectedProduct(prod || null);
  };

  // --- Facts Handlers ---
  const openCreateFact = () => {
    setEditingFact(null);
    factForm.resetFields();
    factForm.setFieldsValue({
      sku: selectedSku,
      fact_key: 'size',
      value: '',
      unit: '',
      conflict_code: '',
    });
    setFactModalOpen(true);
  };

  const openEditFact = (record: any) => {
    setEditingFact(record);
    factForm.resetFields();
    factForm.setFieldsValue({
      sku: record.sku,
      fact_key: record.fact_key,
      value: record.value,
      unit: record.unit || '',
      conflict_code: record.conflict_code || '',
    });
    setFactModalOpen(true);
  };

  const handleSaveFact = async (values: any) => {
    try {
      if (editingFact) {
        await chatbotKbApi.update('facts', editingFact.id, values);
        message.success('Cập nhật thông số thành công');
      } else {
        await chatbotKbApi.create('facts', { ...values, sku: selectedSku });
        message.success('Thêm thông số thành công');
      }
      setFactModalOpen(false);
      fetchFacts(selectedSku);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handlePublishFact = async (id: string) => {
    try {
      await chatbotKbApi.publish('facts', id);
      message.success('Xuất bản thông số thành công');
      fetchFacts(selectedSku);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handleRetireFact = async (id: string) => {
    try {
      await chatbotKbApi.retire('facts', id);
      message.success('Đã thu hồi thông số');
      fetchFacts(selectedSku);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  // --- Bundles Handlers ---
  const handleSaveBundle = async (values: any) => {
    try {
      const items = (values.items || []).map((it: any) => ({
        sku: it.sku,
        qty: parseInt(it.qty, 10),
      }));
      await chatbotKbApi.create('bundles', {
        code: values.code,
        name: values.name,
        items,
      });
      message.success('Tạo bộ sản phẩm thành công');
      setBundleModalOpen(false);
      fetchBundles();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const handlePublishBundle = async (id: string) => {
    try {
      await chatbotKbApi.publish('bundles', id);
      message.success('Xuất bản bộ sản phẩm thành công');
      fetchBundles();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
    }
  };

  const factColumns = [
    {
      title: 'Thuộc tính',
      dataIndex: 'fact_key',
      key: 'fact_key',
      render: (k: string) => {
        const found = FACT_KEYS.find((x) => x.value === k);
        return <Text strong>{found ? found.label : k}</Text>;
      },
    },
    {
      title: 'Giá trị',
      key: 'val',
      render: (_: any, r: any) => (
        <span>
          {r.value} {r.unit && <Text type="secondary">({r.unit})</Text>}
        </span>
      ),
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'published' ? 'green' : s === 'draft' ? 'blue' : 'default'}>
          {s === 'published' ? 'Xuất bản' : s === 'draft' ? 'Bản nháp' : s}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditFact(r)}>
            Sửa
          </Button>
          {canPublish && r.status === 'draft' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handlePublishFact(r.id)}
            >
              Xuất bản
            </Button>
          )}
          {canPublish && r.status === 'published' && (
            <Popconfirm title="Thu hồi thông số này?" onConfirm={() => handleRetireFact(r.id)}>
              <Button size="small" danger icon={<StopOutlined />}>
                Thu hồi
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const bundleColumns = [
    {
      title: 'Mã bộ',
      dataIndex: 'code',
      key: 'code',
      render: (c: string) => <Text strong>{c}</Text>,
    },
    {
      title: 'Tên bộ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Thành phần',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <div>
          {(items || []).map((it, idx) => (
            <Tag key={idx} color="blue">
              {it.sku} x{it.qty}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'published' ? 'green' : 'blue'}>
          {s === 'published' ? 'Xuất bản' : 'Bản nháp'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          {canPublish && r.status === 'draft' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handlePublishBundle(r.id)}
            >
              Xuất bản
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Tabs
        defaultActiveKey="facts"
        items={[
          {
            key: 'facts',
            label: 'Thông số sản phẩm (Facts)',
            children: (
              <Card
                title="Thông số & Đặc tả sản phẩm"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateFact}>
                    Thêm thông số
                  </Button>
                }
              >
                <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'center' }}>
                  <div style={{ width: 320 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Chọn sản phẩm hiển thị trên website:
                    </Text>
                    <Select
                      showSearch
                      style={{ width: '100%' }}
                      placeholder="Tìm SKU hoặc tên sản phẩm..."
                      value={selectedSku}
                      onChange={handleSelectSku}
                      options={products.map((p) => ({
                        value: p.sku,
                        label: `${p.sku} - ${p.name}`,
                      }))}
                    />
                  </div>

                  {selectedProduct && (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                      {selectedProduct.image_url ? (
                        <Image
                          src={selectedProduct.image_url}
                          alt={selectedProduct.sku}
                          width={60}
                          height={60}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                      ) : (
                        <div style={{ width: 60, height: 60, background: '#ddd', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Ảnh
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedProduct.name}</div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          SKU: {selectedProduct.sku}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>

                <Table
                  columns={factColumns}
                  dataSource={facts}
                  rowKey="id"
                  loading={loadingFacts}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'bundles',
            label: 'Bộ sản phẩm (Bundles)',
            children: (
              <Card
                title="Quản lý Bộ sản phẩm (Bundles)"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setBundleModalOpen(true)}>
                    Tạo bộ sản phẩm
                  </Button>
                }
              >
                <Table
                  columns={bundleColumns}
                  dataSource={bundles}
                  rowKey="id"
                  loading={loadingBundles}
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal Add/Edit Fact */}
      <Modal
        title={editingFact ? 'Chỉnh sửa thông số' : 'Thêm thông số sản phẩm'}
        open={factModalOpen}
        onCancel={() => setFactModalOpen(false)}
        footer={null}
      >
        <Form form={factForm} layout="vertical" onFinish={handleSaveFact}>
          <Form.Item label="SKU sản phẩm" name="sku">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Loại thông số" name="fact_key" rules={[{ required: true }]}>
            <Select options={FACT_KEYS} />
          </Form.Item>
          <Form.Item label="Giá trị" name="value" rules={[{ required: true }]}>
            <Input placeholder="ví dụ: 120x60, 5, Bông gòn 100%..." />
          </Form.Item>
          <Form.Item label="Đơn vị (tùy chọn)" name="unit">
            <Input placeholder="ví dụ: cm, kg, cái..." />
          </Form.Item>
          <Form.Item label="Mã mâu thuẫn cần khóa (nếu có)" name="conflict_code">
            <Input placeholder="ví dụ: D03, D04..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            {editingFact ? 'Lưu thông số' : 'Tạo thông số'}
          </Button>
        </Form>
      </Modal>

      {/* Modal Create Bundle */}
      <Modal
        title="Tạo mới bộ sản phẩm"
        open={bundleModalOpen}
        onCancel={() => setBundleModalOpen(false)}
        footer={null}
      >
        <Form form={bundleForm} layout="vertical" onFinish={handleSaveBundle}>
          <Form.Item label="Mã bộ (code)" name="code" rules={[{ required: true }]}>
            <Input placeholder="ví dụ: BUNDLE_NEM_GOI" />
          </Form.Item>
          <Form.Item label="Tên bộ sản phẩm" name="name" rules={[{ required: true }]}>
            <Input placeholder="ví dụ: Bộ nệm gối sơ sinh cao cấp" />
          </Form.Item>
          <Form.List name="items" initialValue={[{ sku: selectedSku, qty: 1 }]}>
            {(fields, { add, remove }) => (
              <>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Thành phần SKU trong bộ:
                </Text>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'sku']}
                      rules={[{ required: true, message: 'Chọn SKU' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn SKU"
                        style={{ width: 220 }}
                        options={products.map((p) => ({ value: p.sku, label: p.sku }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'qty']}
                      rules={[{ required: true, message: 'Số lượng' }]}
                    >
                      <Input placeholder="SL" style={{ width: 80 }} type="number" min={1} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>
                      Xóa
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
                  Thêm SKU vào bộ
                </Button>
              </>
            )}
          </Form.List>
          <Button type="primary" htmlType="submit" block size="large">
            Tạo bộ sản phẩm
          </Button>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
