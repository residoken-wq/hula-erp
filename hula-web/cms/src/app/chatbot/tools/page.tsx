'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Card,
  Select,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  message,
  Space,
  Row,
  Col,
} from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { chatbotKbApi } from '@/lib/api';

const { Text, Title } = Typography;

const TOOLS = [
  { value: 'searchKnowledge', label: '1. searchKnowledge (Tìm kiếm tri thức)' },
  { value: 'searchCatalog', label: '2. searchCatalog (Tìm danh mục SP có facts)' },
  { value: 'getProductDetails', label: '3. getProductDetails (Chi tiết sản phẩm & facts)' },
  { value: 'compareProducts', label: '4. compareProducts (So sánh 2-3 sản phẩm)' },
  { value: 'getPriceEstimate', label: '5. getPriceEstimate (Dự toán giá & thuế)' },
];

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string>('getPriceEstimate');
  const [ignoreFeatureFlag, setIgnoreFeatureFlag] = useState(true);
  const [resultJson, setResultJson] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleToolChange = (tool: string) => {
    setSelectedTool(tool);
    setResultJson(null);
    form.resetFields();

    // Set sample defaults for quick testing
    if (tool === 'getPriceEstimate') {
      form.setFieldsValue({
        target_type: 'sku',
        target_code: 'NEM-COTTON-120',
        quantity: 30,
        fabric: '',
        requested_tier_qty: '',
      });
    } else if (tool === 'searchKnowledge') {
      form.setFieldsValue({
        query: 'nệm',
        intent: '',
        limit: 5,
      });
    } else if (tool === 'getProductDetails') {
      form.setFieldsValue({
        sku: 'NEM-COTTON-120',
      });
    } else if (tool === 'compareProducts') {
      form.setFieldsValue({
        skus: 'NEM-COTTON-120, NEM-GOI-01',
      });
    } else if (tool === 'searchCatalog') {
      form.setFieldsValue({
        keywords: 'nệm',
        skus: '',
      });
    }
  };

  const handleRunTool = async (values: any) => {
    setLoading(true);
    setResultJson(null);
    try {
      let args: any = {};
      if (selectedTool === 'getPriceEstimate') {
        args = {
          target_type: values.target_type,
          target_code: values.target_code,
          quantity: parseInt(values.quantity, 10),
          fabric: values.fabric || undefined,
          requested_tier_qty: values.requested_tier_qty ? parseInt(values.requested_tier_qty, 10) : undefined,
        };
      } else if (selectedTool === 'searchKnowledge') {
        args = {
          query: values.query,
          intent: values.intent || undefined,
          limit: values.limit ? parseInt(values.limit, 10) : 5,
        };
      } else if (selectedTool === 'getProductDetails') {
        args = {
          sku: values.sku,
        };
      } else if (selectedTool === 'compareProducts') {
        args = {
          skus: (values.skus || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
        };
      } else if (selectedTool === 'searchCatalog') {
        args = {
          keywords: values.keywords || undefined,
          skus: values.skus
            ? values.skus
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : undefined,
        };
      }

      const res = await chatbotKbApi.preview(selectedTool, args, ignoreFeatureFlag);
      setResultJson(res.data.result);
      message.success('Chạy công cụ thành công');
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.message || err.message;
      const code = data?.code;
      message.error(code ? `[${code}] ${msg}` : msg);
      setResultJson({ error: true, code, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Card title="Thử nghiệm Công cụ AI (Chatbot Read-only Tools)">
        <Row gutter={24}>
          <Col span={10}>
            <Title level={5}>Tham số đầu vào</Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                Chọn công cụ:
              </Text>
              <Select
                value={selectedTool}
                onChange={handleToolChange}
                options={TOOLS}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={ignoreFeatureFlag}
                onChange={(e) => setIgnoreFeatureFlag(e.target.checked)}
              >
                Bỏ qua cờ dự toán (ignore_feature_flag)
              </Checkbox>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleRunTool}
              initialValues={{
                target_type: 'sku',
                target_code: 'NEM-COTTON-120',
                quantity: 30,
              }}
            >
              {selectedTool === 'getPriceEstimate' && (
                <>
                  <Form.Item label="Loại đối tượng (target_type)" name="target_type" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'sku', label: 'sku' },
                        { value: 'bundle', label: 'bundle' },
                        { value: 'service', label: 'service' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="Mã đối tượng (target_code)" name="target_code" rules={[{ required: true }]}>
                    <Input placeholder="ví dụ: NEM-COTTON-120" />
                  </Form.Item>
                  <Form.Item label="Số lượng đặt (quantity)" name="quantity" rules={[{ required: true }]}>
                    <Input type="number" min={1} />
                  </Form.Item>
                  <Form.Item label="Chất liệu (fabric, tùy chọn)" name="fabric">
                    <Input placeholder="ví dụ: Cotton Hàn Quốc" />
                  </Form.Item>
                  <Form.Item label="SL bậc giá khách đòi (requested_tier_qty)" name="requested_tier_qty">
                    <Input type="number" placeholder="Kiểm tra discount request..." />
                  </Form.Item>
                </>
              )}

              {selectedTool === 'searchKnowledge' && (
                <>
                  <Form.Item label="Từ khóa tìm kiếm (query)" name="query" rules={[{ required: true }]}>
                    <Input placeholder="ví dụ: nệm, giặt máy, đổi trả..." />
                  </Form.Item>
                  <Form.Item label="Ý định (intent, tùy chọn)" name="intent">
                    <Input placeholder="ví dụ: product_spec, faq..." />
                  </Form.Item>
                  <Form.Item label="Giới hạn kết quả (limit <= 5)" name="limit">
                    <Input type="number" min={1} max={5} defaultValue={5} />
                  </Form.Item>
                </>
              )}

              {selectedTool === 'getProductDetails' && (
                <>
                  <Form.Item label="Mã SKU sản phẩm" name="sku" rules={[{ required: true }]}>
                    <Input placeholder="ví dụ: NEM-COTTON-120" />
                  </Form.Item>
                </>
              )}

              {selectedTool === 'compareProducts' && (
                <>
                  <Form.Item
                    label="Danh sách SKU (cách nhau bởi dấu phẩy, 2 đến 3 SKU)"
                    name="skus"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="SKU1, SKU2, SKU3" />
                  </Form.Item>
                </>
              )}

              {selectedTool === 'searchCatalog' && (
                <>
                  <Form.Item label="Từ khóa (keywords, tùy chọn)" name="keywords">
                    <Input placeholder="ví dụ: nệm bông ép..." />
                  </Form.Item>
                  <Form.Item label="Danh sách SKU (tùy chọn, phẩy ngăn cách)" name="skus">
                    <Input placeholder="SKU1, SKU2..." />
                  </Form.Item>
                </>
              )}

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlayCircleOutlined />}
                block
                size="large"
              >
                Chạy thử công cụ
              </Button>
            </Form>
          </Col>

          <Col span={14}>
            <Title level={5}>Kết quả JSON phản hồi</Title>
            <div
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: 16,
                borderRadius: 8,
                minHeight: 380,
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 13,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {resultJson ? (
                JSON.stringify(resultJson, null, 2)
              ) : (
                <Text style={{ color: '#666' }}>
                  // Nhấn "Chạy thử công cụ" để xem kết quả JSON trả về từ backend API /preview...
                </Text>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </AdminLayout>
  );
}
