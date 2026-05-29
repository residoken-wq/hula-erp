import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Tabs, Space, InputNumber, Select, Card, Row, Col, Typography, Divider, Switch, Upload, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DeleteOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { WizardCategoryL2, WizardCustomizationStep, WizardPriceTier, WizardBaseImage } from '@/types/wizard';
import ImageBaseEditor from './ImageBaseEditor';
import { uploadApi } from '@/lib/api';

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (data: WizardCategoryL2) => void;
    data: WizardCategoryL2;
}

const { Text } = Typography;

// --- Inline ImagePicker: upload hoặc chọn từ thư viện ---
function InlineImagePicker({ value, onChange }: { value?: string; onChange?: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState<Array<{ name: string; url: string; size: number }>>([]);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) { message.error('Chỉ cho phép hình ảnh!'); return; }
        if (file.size > 5 * 1024 * 1024) { message.error('Tối đa 5MB!'); return; }
        setUploading(true);
        try {
            const res = await uploadApi.image(file);
            onChange?.(res.data?.url || '');
            message.success('Upload OK');
        } catch { message.error('Upload thất bại'); }
        finally { setUploading(false); }
    };

    const openLibrary = async () => {
        setLibraryOpen(true);
        try {
            setLibraryLoading(true);
            const res = await uploadApi.listFiles();
            setLibraryFiles(Array.isArray(res.data) ? res.data : []);
        } catch { setLibraryFiles([]); }
        finally { setLibraryLoading(false); }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {value && (
                <img src={resolveImageUrl(value)} alt="" style={{ width: 32, height: 32, objectFit: 'contain', border: '1px solid #f0f0f0', borderRadius: 4 }} />
            )}
            <Upload
                beforeUpload={(file) => { handleUpload(file); return false; }}
                showUploadList={false}
                accept="image/*"
            >
                <Button size="small" icon={<UploadOutlined />} loading={uploading} style={{ fontSize: 11 }}>
                    {value ? 'Đổi' : 'Upload'}
                </Button>
            </Upload>
            <Button size="small" icon={<PictureOutlined />} onClick={openLibrary} style={{ fontSize: 11 }}>
                Thư viện
            </Button>
            {value && (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onChange?.('')} style={{ fontSize: 11 }} />
            )}

            <Modal open={libraryOpen} onCancel={() => setLibraryOpen(false)} footer={null} width={700} title="Chọn ảnh" destroyOnClose>
                {libraryLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
                ) : (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: 8, maxHeight: '50vh', overflow: 'auto',
                    }}>
                        {libraryFiles.map(f => (
                            <div key={f.name} onClick={() => { onChange?.(f.url); setLibraryOpen(false); message.success('Đã chọn'); }}
                                style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: '#fafafa' }}
                            >
                                <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={resolveImageUrl(f.url)} alt={f.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ padding: '4px 6px', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default function SubcategoryConfigModal({ visible, onClose, onSave, data }: Props) {
    const [form] = Form.useForm();
    const [baseImages, setBaseImages] = useState<WizardBaseImage[]>(data.base_images || []);

    useEffect(() => {
        if (visible && data) {
            form.setFieldsValue({
                customization_steps: data.customization_steps || [],
                price_tiers: data.price_tiers || []
            });
            setBaseImages(data.base_images || []);
        }
    }, [visible, data, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSave({
                ...data,
                base_images: baseImages,
                customization_steps: values.customization_steps || [],
                price_tiers: values.price_tiers || []
            });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    // Get frames list for step's required_frame_id dropdown
    const frameOptions = baseImages.map(f => ({
        label: f.label || f.id,
        value: f.id,
    }));

    return (
        <Modal
            title={`Cấu Hình Tùy Biến: ${data.name}`}
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            width={1100}
            style={{ top: 20 }}
            styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
            okText="Lưu Cấu Hình"
        >
            <Form form={form} layout="vertical">
                <Tabs defaultActiveKey="0" items={[
                    {
                        key: '0',
                        label: '🖼️ Image Base',
                        forceRender: true,
                        children: (
                            <Card title="Quản lý Frames (max 10 layers)" size="small">
                                <div style={{ marginBottom: 12, color: '#888', fontSize: 12 }}>
                                    Kéo thả frame để đặt vị trí, kéo góc để resize. Click frame để chọn và chỉnh sửa thuộc tính.
                                </div>
                                <ImageBaseEditor value={baseImages} onChange={setBaseImages} />
                            </Card>
                        )
                    },
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
                                                    <Col span={6}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'id']} label="ID Bước (VD: step_size)" rules={[{ required: true }]}>
                                                            <Input />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'label']} label="Tiêu đề (VD: Chọn size túi ngủ)" rules={[{ required: true }]}>
                                                            <Input />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'type']} label="Loại UI" rules={[{ required: true }]}>
                                                            <Select options={[
                                                                { label: 'Single Choice (S/M/L/Others)', value: 'toggle' },
                                                                { label: 'Dropdown List', value: 'dropdown' },
                                                                { label: 'Color Swatch (Màu)', value: 'color_swatch' },
                                                                { label: 'Branding (Logo)', value: 'branding' },
                                                                { label: 'Ẩn/Hiện (Có/Không)', value: 'yes_no' },
                                                            ]} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'required_frame_id']} label="Frame liên kết">
                                                            <Select
                                                                allowClear
                                                                placeholder="Chọn frame..."
                                                                options={[{ label: '-- Không liên kết --', value: '' }, ...frameOptions]}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>

                                                <Row gutter={16}>
                                                    <Col span={6}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'is_skippable']} label="Cho phép bỏ qua" valuePropName="checked">
                                                            <Switch checkedChildren="Có" unCheckedChildren="Không" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item {...stepField} name={[stepField.name, 'default_option_id']} label="ID Option Mặc định">
                                                            <Input placeholder="Nhập ID Option sẽ được chọn sẵn" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>

                                                <Divider style={{ margin: '12px 0' }} />
                                                <Text strong>Các Tùy Chọn (Options)</Text>
                                                
                                                <Form.List name={[stepField.name, 'options']}>
                                                    {(optionFields, { add: addOption, remove: removeOption }) => (
                                                        <div style={{ marginTop: 12 }}>
                                                            {optionFields.map((optField) => (
                                                                <div key={optField.key} style={{ marginBottom: 12, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                                                                    <Row gutter={8} align="middle">
                                                                        <Col span={3}>
                                                                            <Form.Item {...optField} name={[optField.name, 'id']} noStyle rules={[{ required: true }]}>
                                                                                <Input placeholder="ID Option" size="small" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={4}>
                                                                            <Form.Item {...optField} name={[optField.name, 'name']} noStyle rules={[{ required: true }]}>
                                                                                <Input placeholder="Tên hiển thị" size="small" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={3}>
                                                                            <Form.Item {...optField} name={[optField.name, 'price_modifier']} noStyle rules={[{ required: true }]}>
                                                                                <InputNumber placeholder="Giá (+/-)" style={{ width: '100%' }} size="small" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={3}>
                                                                            <Form.Item {...optField} name={[optField.name, 'color_code']} noStyle>
                                                                                <ColorPickerField />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={4}>
                                                                            <Form.Item {...optField} name={[optField.name, 'description']} noStyle>
                                                                                <Input placeholder="Mô tả phụ" size="small" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={1}>
                                                                            <MinusCircleOutlined onClick={() => removeOption(optField.name)} style={{ color: 'red' }} />
                                                                        </Col>
                                                                    </Row>
                                                                    <Row gutter={8} style={{ marginTop: 8 }}>
                                                                        <Col span={12}>
                                                                            <label style={{ fontSize: 11, color: '#888' }}>Hình URL (upload/thư viện):</label>
                                                                            <Form.Item {...optField} name={[optField.name, 'image_url']} noStyle>
                                                                                <ImageUrlField />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={12}>
                                                                            <label style={{ fontSize: 11, color: '#888' }}>Overlay/Texture (upload/thư viện):</label>
                                                                            <Form.Item {...optField} name={[optField.name, 'visualization_overlay']} noStyle>
                                                                                <ImageUrlField />
                                                                            </Form.Item>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row style={{ marginTop: 8 }}>
                                                                        <Col span={24}>
                                                                            <label style={{ fontSize: 11, color: '#888' }}>Danh sách hình (Multi-image gallery):</label>
                                                                            <Form.Item {...optField} name={[optField.name, 'image_urls']} noStyle>
                                                                                <MultiImageField />
                                                                            </Form.Item>
                                                                        </Col>
                                                                    </Row>
                                                                </div>
                                                            ))}
                                                            <Button type="dashed" onClick={() => addOption()} block icon={<PlusOutlined />}>
                                                                Thêm Option
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Form.List>
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

// --- Wrapper component for Ant Design Form.Item compatibility ---
function ImageUrlField({ value, onChange }: { value?: string; onChange?: (val: string) => void }) {
    return <InlineImagePicker value={value} onChange={(url) => onChange?.(url)} />;
}

// --- Multi-image picker: manage array of image URLs ---
function MultiImageField({ value, onChange }: { value?: string[]; onChange?: (val: string[]) => void }) {
    const images = Array.isArray(value) ? value : [];

    const handleAdd = (url: string) => {
        if (url) onChange?.([...images, url]);
    };

    const handleRemove = (index: number) => {
        const next = images.filter((_, i) => i !== index);
        onChange?.(next);
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
            {images.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <img src={resolveImageUrl(url)} alt="" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }} />
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(idx)}
                        style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, padding: 0, width: 16, height: 16, lineHeight: '16px', minWidth: 16 }}
                    />
                </div>
            ))}
            <InlineImagePicker value="" onChange={handleAdd} />
        </div>
    );
}

// --- Color Picker Field: cho phép nhập HEX, chọn color, và XÓA giá trị (tránh false-positive #000000) ---
function ColorPickerField({ value, onChange }: { value?: string; onChange?: (val: string) => void }) {
    const displayValue = value && value !== '#000000' ? value : '';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Input
                placeholder="#HEX"
                size="small"
                value={displayValue}
                onChange={(e) => onChange?.(e.target.value)}
                style={{ width: '100%', flex: 1, fontSize: 11 }}
                allowClear
            />
            <input
                type="color"
                value={displayValue || '#ffffff'}
                onChange={(e) => onChange?.(e.target.value)}
                style={{ width: 28, height: 24, padding: 0, border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer' }}
            />
        </div>
    );
}
