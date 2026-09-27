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
  Switch,
  Typography,
  message,
  Alert,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { Text } = Typography;

export default function PricesPage() {
  const { user, hasPermission } = useAuth();
  const canPublish = user?.username === 'admin' || hasPermission('CHATBOT_KB', 'delete');

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ title: string; content: string } | null>(null);
  const [form] = Form.useForm();
  const [allowFixtures, setAllowFixtures] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const [rulesRes, verRes] = await Promise.all([
        chatbotKbApi.getList('prices', { limit: 100 }),
        chatbotKbApi.getVersion(),
      ]);
      setRules(rulesRes.data.items || []);
      setAllowFixtures(!!verRes.data.allow_fixtures);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openCreateModal = () => {
    setErrorMessage(null);
    form.resetFields();
    form.setFieldsValue({
      target_type: 'sku',
      target_code: '',
      qty_min: 1,
      qty_max: null,
      unit_price: 100000,
      currency: 'VND',
      qty_scope: 'per_design',
      tax_included: true,
      tax_rate: null,
      customer_scope: 'PUBLIC',
      is_fixture: false,
      valid_from: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
    });
    setModalOpen(true);
  };

  const handleSaveRule = async (values: any) => {
    setErrorMessage(null);
    try {
      const payload = {
        ...values,
        qty_min: parseInt(values.qty_min, 10),
        qty_max: values.qty_max ? parseInt(values.qty_max, 10) : null,
        unit_price: parseInt(values.unit_price, 10),
        tax_rate: values.tax_rate ? parseFloat(values.tax_rate) : null,
      };
      await chatbotKbApi.create('prices', payload);
      message.success('Tạo quy tắc giá thành công');
      setModalOpen(false);
      fetchRules();
    } catch (err: any) {
      const data = err.response?.data;
      const code = data?.code;
      const msg = data?.message || err.message;
      setErrorMessage({
        title: code ? `Lỗi [${code}]` : 'Lỗi tạo quy tắc giá',
        content: msg,
      });
    }
  };

  const handlePublishRule = async (id: string) => {
    setErrorMessage(null);
    try {
      await chatbotKbApi.publish('prices', id);
      message.success('Xuất bản quy tắc giá thành công');
      fetchRules();
    } catch (err: any) {
      const data = err.response?.data;
      const code = data?.code;
      const conflicts = data?.conflicts;
      const ruleIds = data?.rule_ids;

      let detail = data?.message || err.message;
      if (code === 'CONFLICT_LOCKED' && conflicts) {
        detail = `Bị khóa bởi các mâu thuẫn mở: ${conflicts.join(', ')}`;
      } else if (code === 'PRICE_CONFLICT' && ruleIds) {
        detail = `Xung đột khoảng giá/ngày với các rule: ${ruleIds.join(', ')}`;
      }

      setErrorMessage({
        title: `Lỗi xuất bản: ${code || 'ERROR'}`,
        content: detail,
      });
    }
  };

  const handleRetireRule = async (id: string) => {
    setErrorMessage(null);
    try {
      await chatbotKbApi.retire('prices', id);
      message.success('Đã thu hồi quy tắc giá');
      fetchRules();
    } catch (err: any) {
      const data = err.response?.data;
      message.error(data?.message || err.message);
    }
  };

  const columns = [
    {
      title: 'Mục tiêu',
      key: 'target',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Tag color="cyan">{r.target_type}</Tag>
            <Text strong>{r.target_code}</Text>
          </Space>
          {r.fabric && <Text type="secondary" style={{ fontSize: 12 }}>Chất liệu: {r.fabric}</Text>}
        </Space>
      ),
    },
    {
      title: 'Khoảng số lượng',
      key: 'qty',
      render: (_: any, r: any) => (
        <span>
          {r.qty_min} - {r.qty_max ?? '∞'} ({r.qty_scope})
        </span>
      ),
    },
    {
      title: 'Đơn giá',
      key: 'price',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#389e0d' }}>
            {Number(r.unit_price).toLocaleString('vi-VN')} {r.currency}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.tax_included ? 'Đã gồm thuế' : `Chưa thuế (${r.tax_rate || 0}%)`}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Đối tượng & Hiệu lực',
      key: 'scope',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Tag color={r.customer_scope === 'PUBLIC' ? 'green' : 'purple'}>
            {r.customer_scope}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Từ: {r.valid_from || r.effective_from}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, r: any) => (
        <Space>
          <Tag color={r.status === 'published' ? 'green' : r.status === 'draft' ? 'blue' : 'default'}>
            {r.status === 'published' ? 'Xuất bản' : r.status === 'draft' ? 'Bản nháp' : r.status}
          </Tag>
          {r.is_fixture && <Tag color="red">FIXTURE</Tag>}
        </Space>
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
              onClick={() => handlePublishRule(r.id)}
            >
              Xuất bản
            </Button>
          )}
          {canPublish && r.status === 'published' && (
            <Popconfirm title="Thu hồi quy tắc giá này?" onConfirm={() => handleRetireRule(r.id)}>
              <Button size="small" danger icon={<StopOutlined />}>
                Thu hồi
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
        title="Quản lý Bảng giá AI (Chatbot Price Rules)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Thêm quy tắc giá
          </Button>
        }
      >
        {errorMessage && (
          <Alert
            message={errorMessage.title}
            description={errorMessage.content}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">
            Bảng giá phục vụ công cụ tính giá tự động của Trợ lý AI. Mọi thay đổi đều được ghi audit.
          </Text>
          <Tag color={allowFixtures ? 'orange' : 'default'}>
            Fixtures mode: {allowFixtures ? 'BẬT' : 'TẮT'}
          </Tag>
        </div>

        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="Thêm quy tắc giá AI"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRule}>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item label="Loại mục tiêu" name="target_type" rules={[{ required: true }]}>
              <Select
                style={{ width: 140 }}
                options={[
                  { value: 'sku', label: 'SKU sản phẩm' },
                  { value: 'bundle', label: 'Bộ sản phẩm' },
                  { value: 'service', label: 'Dịch vụ' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Mã mục tiêu (target_code)" name="target_code" rules={[{ required: true }]}>
              <Input placeholder="ví dụ: NEM-COTTON-120, LOGO_THEU..." style={{ width: 260 }} />
            </Form.Item>
          </Space>

          <Form.Item label="Chất liệu vải (tùy chọn)" name="fabric">
            <Input placeholder="ví dụ: Cotton Hàn Quốc, Thô Lụa..." />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item label="Số lượng tối thiểu" name="qty_min" rules={[{ required: true }]}>
              <Input type="number" min={1} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="Số lượng tối đa (null = vô hạn)" name="qty_max">
              <Input type="number" min={1} placeholder="Không giới hạn" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="Phạm vi số lượng" name="qty_scope">
              <Select
                style={{ width: 140 }}
                options={[
                  { value: 'per_design', label: 'Theo mẫu' },
                  { value: 'per_color', label: 'Theo màu' },
                  { value: 'per_order', label: 'Theo đơn' },
                ]}
              />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item label="Đơn giá (VND)" name="unit_price" rules={[{ required: true }]}>
              <Input type="number" min={0} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item label="Đã gồm thuế VAT" name="tax_included" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Thuế suất % (nếu chưa thuế)" name="tax_rate">
              <Input type="number" min={0} max={100} placeholder="ví dụ: 8, 10" style={{ width: 120 }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item label="Đối tượng khách" name="customer_scope">
              <Input placeholder="PUBLIC hoặc CUSTOMER:123" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item label="Hiệu lực từ ngày" name="valid_from" rules={[{ required: true }]}>
              <Input placeholder="YYYY-MM-DD" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="Là dữ liệu Fixture" name="is_fixture" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Button type="primary" htmlType="submit" block size="large" icon={<DollarOutlined />}>
            Tạo quy tắc giá
          </Button>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
