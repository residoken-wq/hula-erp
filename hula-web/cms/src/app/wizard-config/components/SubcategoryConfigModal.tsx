import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Tabs, Space, InputNumber, Select, Card, Row, Col, Typography, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { WizardCategoryL2, WizardCustomizationStep, WizardPriceTier } from '@/types/wizard';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (data: WizardCategoryL2) => void;
    data: WizardCategoryL2;
}

const { Text } = Typography;

export default function SubcategoryConfigModal({ visible, onClose, onSave, data }: Props) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && data) {
            form.setFieldsValue({
                customization_steps: data.customization_steps || [],
                price_tiers: data.price_tiers || []
            });
        }
    }, [visible, data, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSave({
                ...data,
                customization_steps: values.customization_steps || [],
                price_tiers: values.price_tiers || []
            });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={`Cấu Hình Tùy Biến: ${data.name}`}
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            width={1000}
            style={{ top: 20 }}
            bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
            okText="Lưu Cấu Hình"
        >
            <Form form={form} layout="vertical">
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: 'Các Bước Tùy Biến (B1-B6)',
                        forceRender: true,
                        children: (
                            <Form.List name="customization_steps">
                                {(stepFields, { add: addStep, remove: removeStep }) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        {stepFields.map((stepField, stepIndex) => (
                                            <Card 
                                                key={stepField.key} 
                                                size="small" 
                                                title={`Bước ${stepIndex + 1}`}
                                                extra={<Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeStep(stepField.name)} />}
                                                style={{ border: '1px solid #d9d9d9' }}
                                            >
                                                <Row gutter={16}>
                                                    <Col span={8}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'id']} label="ID Bước (VD: step_size)" rules={[{ required: true }]}>
                                                            <Input />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={8}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'label']} label="Tiêu đề (VD: Chọn size túi ngủ)" rules={[{ required: true }]}>
                                                            <Input />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={8}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'type']} label="Loại UI" rules={[{ required: true }]}>
                                                            <Select options={[
                                                                { label: 'Toggle Buttons (S/M)', value: 'toggle' },
                                                                { label: 'Dropdown List', value: 'dropdown' },
                                                                { label: 'Color Swatch (Màu)', value: 'color_swatch' },
                                                            ]} />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>

                                                <Divider style={{ margin: '12px 0' }} />
                                                <Text strong>Các Tùy Chọn (Options)</Text>
                                                
                                                <Form.List name={[stepField.name, 'options']}>
                                                    {(optionFields, { add: addOption, remove: removeOption }) => (
                                                        <div style={{ marginTop: 12 }}>
                                                            {optionFields.map((optField, optIndex) => (
                                                                <Row key={optField.key} gutter={8} align="middle" style={{ marginBottom: 8, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                                                    <Col span={3}>
                                                                        <Form.Item {...optField} name={[optField.name, 'id']} noStyle rules={[{ required: true }]}>
                                                                            <Input placeholder="ID Option" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={4}>
                                                                        <Form.Item {...optField} name={[optField.name, 'name']} noStyle rules={[{ required: true }]}>
                                                                            <Input placeholder="Tên hiển thị" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={3}>
                                                                        <Form.Item {...optField} name={[optField.name, 'price_modifier']} noStyle rules={[{ required: true }]}>
                                                                            <InputNumber placeholder="Giá (+/-)" style={{ width: '100%' }} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={4}>
                                                                        <Form.Item {...optField} name={[optField.name, 'color_code']} noStyle>
                                                                            <Input placeholder="Mã màu HEX" type="color" style={{ width: '100%', padding: '0 4px' }} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={6}>
                                                                        <Form.Item {...optField} name={[optField.name, 'visualization_overlay']} noStyle>
                                                                            <Input placeholder="URL Texture/Overlay" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={3}>
                                                                        <Form.Item {...optField} name={[optField.name, 'description']} noStyle>
                                                                            <Input placeholder="Mô tả phụ" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={1}>
                                                                        <MinusCircleOutlined onClick={() => removeOption(optField.name)} style={{ color: 'red' }} />
                                                                    </Col>
                                                                </Row>
                                                            ))}
                                                            <Button type="dashed" onClick={() => addOption()} block icon={<PlusOutlined />}>
                                                                Thêm Option
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Form.List>

                                                <Row style={{ marginTop: 16 }}>
                                                    <Col span={12}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'default_option_id']} label="ID Option Mặc định (Tùy chọn)">
                                                            <Input placeholder="Nhập ID Option sẽ được chọn sẵn" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                        <Button type="dashed" onClick={() => addStep()} block icon={<PlusOutlined />}>
                                            Thêm Bước Tùy Biến
                                        </Button>
                                    </div>
                                )}
                            </Form.List>
                        )
                    },
                    {
                        key: '2',
                        label: 'Bảng Giá Bậc Thang (Tiers)',
                        forceRender: true,
                        children: (
                            <Card title="Cấu Hình Giá Theo Số Lượng">
                                <Form.List name="price_tiers">
                                    {(tierFields, { add, remove }) => (
                                        <>
                                            {tierFields.map(field => (
                                                <Row key={field.key} gutter={16} align="middle" style={{ marginBottom: 16 }}>
                                                    <Col span={6}>
                                                        <Form.Item {...field} name={[field.name, 'min_quantity']} label="SL Tối thiểu" rules={[{ required: true }]}>
                                                            <InputNumber min={1} style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item {...field} name={[field.name, 'max_quantity']} label="SL Tối đa (bỏ trống = vô hạn)">
                                                            <InputNumber min={1} style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={8}>
                                                        <Form.Item {...field} name={[field.name, 'base_price']} label="Giá Base (VNĐ)" rules={[{ required: true }]}>
                                                            <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={4}>
                                                        <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>Xóa Mốc Giá</Button>
                                                    </Col>
                                                </Row>
                                            ))}
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Thêm Mốc Giá Bậc Thang
                                            </Button>
                                        </>
                                    )}
                                </Form.List>
                            </Card>
                        )
                    }
                ]} />
            </Form>
        </Modal>
    );
}
