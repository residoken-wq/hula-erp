import { useState, useEffect, useRef } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Tabs,
    Space,
    InputNumber,
    Select,
    Card,
    Row,
    Col,
    Typography,
    Divider,
    Switch,
    Upload,
    message,
    Collapse,
    Badge,
    Tag,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    MinusCircleOutlined,
    DeleteOutlined,
    UploadOutlined,
    PictureOutlined,
    SaveOutlined,
    CloseOutlined,
    SettingOutlined,
    BgColorsOutlined,
    AppstoreOutlined,
    DollarOutlined,
    CompassOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { WizardCategoryL2, WizardCustomizationStep, WizardPriceTier, WizardBaseImage, Wizard360Frame } from '@/types/wizard';
import ImageBaseEditor from './ImageBaseEditor';
import Frames360Editor from './Frames360Editor';
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

const { Text, Title } = Typography;

// --- Inline ImagePicker: upload hoặc chọn từ thư viện ---
function InlineImagePicker({
    value,
    onChange,
    multiple = false,
    onMultiChange
}: {
    value?: string;
    onChange?: (url: string) => void;
    multiple?: boolean;
    onMultiChange?: (urls: string[]) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState<Array<{ name: string; url: string; size: number; modified?: string }>>([]);
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const pendingUploadsRef = useRef<string[]>([]);
    const uploadTimerRef = useRef<any>(null);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            message.error('Chỉ cho phép tải lên hình ảnh!');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            message.error('Dung lượng ảnh tối đa 8MB!');
            return;
        }
        setUploading(true);
        try {
            const res = await uploadApi.image(file);
            const url = res.data?.url || '';
            if (multiple && onMultiChange) {
                pendingUploadsRef.current.push(url);
                clearTimeout(uploadTimerRef.current);
                uploadTimerRef.current = setTimeout(() => {
                    if (pendingUploadsRef.current.length > 0) {
                        onMultiChange([...pendingUploadsRef.current]);
                        pendingUploadsRef.current = [];
                    }
                }, 400);
            } else {
                onChange?.(url);
            }
            message.success('Tải ảnh thành công!');
        } catch {
            message.error('Tải ảnh thất bại!');
        } finally {
            setUploading(false);
        }
    };

    const openLibrary = async () => {
        setLibraryOpen(true);
        setMonthFilter('all');
        setNameFilter('');
        setSelectedUrls([]);
        try {
            setLibraryLoading(true);
            const res = await uploadApi.listFiles();
            setLibraryFiles(Array.isArray(res.data) ? res.data : []);
        } catch {
            setLibraryFiles([]);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handleConfirmMulti = () => {
        if (selectedUrls.length > 0 && onMultiChange) {
            onMultiChange(selectedUrls);
        }
        setLibraryOpen(false);
        setSelectedUrls([]);
    };

    const getMonthStr = (dateStr?: string) => {
        if (!dateStr) return 'Khác';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Khác';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const months = Array.from(new Set(libraryFiles.map(f => getMonthStr(f.modified)))).sort().reverse();

    const filteredFiles = libraryFiles.filter(f => {
        if (monthFilter !== 'all' && getMonthStr(f.modified) !== monthFilter) return false;
        if (nameFilter && !f.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
        return true;
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {value && (
                <div style={{ position: 'relative', width: 34, height: 34, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
                    <img src={resolveImageUrl(value)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}
            <Upload
                multiple={multiple}
                beforeUpload={(file) => { handleUpload(file); return false; }}
                showUploadList={false}
                accept="image/*"
            >
                <Button size="small" icon={<UploadOutlined />} loading={uploading} style={{ fontSize: 12, borderRadius: 6 }}>
                    {value ? 'Đổi' : (multiple ? 'Upload nhiều' : 'Upload')}
                </Button>
            </Upload>
            <Button size="small" icon={<PictureOutlined />} onClick={openLibrary} style={{ fontSize: 12, borderRadius: 6 }}>
                Thư viện
            </Button>
            {value && (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onChange?.('')} style={{ fontSize: 12 }} />
            )}

            <Modal
                open={libraryOpen}
                onCancel={() => setLibraryOpen(false)}
                footer={multiple ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Đã chọn {selectedUrls.length} ảnh</span>
                        <Space>
                            <Button onClick={() => setLibraryOpen(false)}>Hủy</Button>
                            <Button type="primary" onClick={handleConfirmMulti} disabled={selectedUrls.length === 0}>Xác nhận</Button>
                        </Space>
                    </div>
                ) : null}
                width={950}
                title="Chọn ảnh từ Thư viện Media"
                destroyOnClose
            >
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Input
                        placeholder="Tìm kiếm theo tên file..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        allowClear
                        style={{ width: 260, borderRadius: 6 }}
                    />
                    <Select
                        value={monthFilter}
                        onChange={setMonthFilter}
                        style={{ width: 160 }}
                    >
                        <Select.Option value="all">Tất cả các tháng</Select.Option>
                        {months.map(m => (
                            <Select.Option key={m} value={m}>Tháng {m}</Select.Option>
                        ))}
                    </Select>
                </div>
                {libraryLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Đang tải danh sách ảnh...</div>
                ) : (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                        gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4
                    }}>
                        {filteredFiles.map(f => {
                            const isSelected = selectedUrls.includes(f.url);
                            return (
                                <div
                                    key={f.name}
                                    onClick={() => {
                                        if (multiple) {
                                            setSelectedUrls(prev => prev.includes(f.url) ? prev.filter(u => u !== f.url) : [...prev, f.url]);
                                        } else {
                                            onChange?.(f.url);
                                            setLibraryOpen(false);
                                            message.success('Đã chọn ảnh!');
                                        }
                                    }}
                                    style={{
                                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                                        borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: '#ffffff',
                                        position: 'relative', transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 0 0 2px rgba(2, 132, 199, 0.2)' : 'none'
                                    }}
                                >
                                    <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 4 }}>
                                        <img src={resolveImageUrl(f.url)} alt={f.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ padding: '6px 8px', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>
                                        {f.name}
                                    </div>
                                    {isSelected && (
                                        <div style={{ position: 'absolute', top: 6, right: 6, background: '#0284c7', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold' }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
        </div>
    );
}

// --- Color Picker Field: swatch, HEX input, xóa giá trị ---
function ColorPickerField({ value, onChange }: { value?: string; onChange?: (val: string) => void }) {
    const displayValue = value && value !== '#000000' ? value : '';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
                type="color"
                value={displayValue || '#ffffff'}
                onChange={(e) => onChange?.(e.target.value)}
                style={{
                    width: 32,
                    height: 28,
                    padding: 0,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    cursor: 'pointer',
                    flexShrink: 0
                }}
            />
            <Input
                placeholder="#HEX"
                size="small"
                value={displayValue}
                onChange={(e) => onChange?.(e.target.value)}
                style={{ width: '100%', flex: 1, fontSize: 12, borderRadius: 6 }}
                allowClear
            />
        </div>
    );
}

// --- Image URL Field wrapper ---
function ImageUrlField({ value, onChange }: { value?: string; onChange?: (val: string) => void }) {
    return <InlineImagePicker value={value} onChange={(url) => onChange?.(url)} />;
}

// --- Multi-image field wrapper ---
function MultiImageField({ value, onChange }: { value?: string[]; onChange?: (val: string[]) => void }) {
    const images = Array.isArray(value) ? value : [];

    const handleAddMulti = (urls: string[]) => {
        onChange?.([...images, ...urls]);
    };

    const handleRemove = (index: number) => {
        const next = images.filter((_, i) => i !== index);
        onChange?.(next);
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 4 }}>
            {images.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#f8fafc' }}>
                    <img src={resolveImageUrl(url)} alt="" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }} />
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(idx)}
                        style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, padding: 0, width: 18, height: 18, lineHeight: '18px', minWidth: 18, background: 'rgba(255,255,255,0.85)' }}
                    />
                </div>
            ))}
            <InlineImagePicker value="" multiple={true} onMultiChange={handleAddMulti} />
        </div>
    );
}

export default function SubcategoryConfigModal({ visible, onClose, onSave, data }: Props) {
    const [form] = Form.useForm();
    const [baseImages, setBaseImages] = useState<WizardBaseImage[]>(data.base_images || []);
    const [frames360, setFrames360] = useState<Wizard360Frame[]>(data.frames_360 || []);
    const [activeTab, setActiveTab] = useState<string>('0');

    useEffect(() => {
        if (visible && data) {
            form.setFieldsValue({
                customization_steps: data.customization_steps || [],
                price_tiers: data.price_tiers || []
            });
            setBaseImages(data.base_images || []);
            setFrames360(data.frames_360 || []);
        }
    }, [visible, data, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSave({
                ...data,
                base_images: baseImages,
                frames_360: frames360,
                customization_steps: values.customization_steps || [],
                price_tiers: values.price_tiers || []
            });
            message.success('Đã lưu toàn bộ cấu hình sản phẩm thành công!');
        } catch (error) {
            console.error('Validation failed:', error);
            message.error('Vui lòng kiểm tra lại các trường bắt buộc!');
        }
    };

    // Get frames list for step's required_frame_id dropdown
    const frameOptions = baseImages.map(f => ({
        label: `${f.label || f.id} (Layer: ${f.layer ?? 0})`,
        value: f.id,
    }));

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            width="95%"
            style={{ maxWidth: 1240, top: 16 }}
            styles={{
                body: { maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', padding: '16px 24px' },
                content: { borderRadius: 16, overflow: 'hidden', padding: 0 }
            }}
            title={
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    margin: '-16px -24px 0 -24px',
                    color: '#ffffff',
                    borderBottom: '1px solid #334155'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                        }}>
                            ✨
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                                    Cấu Hình Tùy Biến: {data.name}
                                </span>
                                <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Sản phẩm L2</Tag>
                                {frames360 && frames360.length > 0 ? (
                                    <Tag color="cyan" icon={<CompassOutlined />} style={{ borderRadius: 6, margin: 0 }}>
                                        360° ({frames360.length} góc)
                                    </Tag>
                                ) : (
                                    <Tag color="orange" style={{ borderRadius: 6, margin: 0 }}>
                                        Chưa có 360°
                                    </Tag>
                                )}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                Cấu hình Frames lớp, chuỗi ảnh 360° đổi màu HEX, các bước tùy chọn (B1-B6) và bảng giá bậc thang sỉ B2B.
                            </div>
                        </div>
                    </div>
                </div>
            }
            footer={
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    margin: '0 -24px -16px -24px',
                    flexWrap: 'wrap',
                    gap: 10
                }}>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <InfoCircleOutlined style={{ color: '#0284c7' }} />
                        <span>Mọi thay đổi sẽ được cập nhật trực tiếp vào hệ thống đặt hàng sỉ B2B.</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button onClick={onClose} size="middle" style={{ borderRadius: 8 }}>
                            Hủy bỏ
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            size="middle"
                            onClick={handleOk}
                            style={{
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                                border: 'none',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                            }}
                        >
                            Lưu Cấu Hình
                        </Button>
                    </div>
                </div>
            }
        >
            <Form form={form} layout="vertical">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    style={{ marginTop: 8 }}
                    items={[
                        {
                            key: '0',
                            label: (
                                <Space orientation="horizontal" size={6}>
                                    <span>🖼️ Image Base & Layers</span>
                                    <Badge count={baseImages.length} style={{ backgroundColor: '#0284c7' }} />
                                </Space>
                            ),
                            forceRender: true,
                            children: (
                                <div style={{ background: '#ffffff', borderRadius: 12, padding: 12, border: '1px solid #e2e8f0' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                        padding: '10px 14px',
                                        background: '#f0f9ff',
                                        borderRadius: 8,
                                        border: '1px solid #bae6fd',
                                        flexWrap: 'wrap',
                                        gap: 8
                                    }}>
                                        <div style={{ fontSize: 13, color: '#0369a1' }}>
                                            💡 <strong>Quản lý Frames & Layers:</strong> Kéo thả để đặt vị trí, kéo góc để resize. Click frame để chọn và chỉnh sửa thuộc tính.
                                        </div>
                                        <Tag color="processing" style={{ borderRadius: 6, margin: 0 }}>Tối đa 10 layers</Tag>
                                    </div>
                                    <ImageBaseEditor value={baseImages} onChange={setBaseImages} />
                                </div>
                            )
                        },
                        {
                            key: '1',
                            label: (
                                <Space orientation="horizontal" size={6}>
                                    <span>🌐 Frame Dựng 360° (Đổi Màu HEX)</span>
                                    <Badge
                                        count={frames360.length}
                                        style={{ backgroundColor: frames360.length > 0 ? '#10b981' : '#f59e0b' }}
                                    />
                                </Space>
                            ),
                            forceRender: true,
                            children: (
                                <Frames360Editor
                                    value={frames360}
                                    onChange={setFrames360}
                                    productName={data.name}
                                />
                            )
                        },
                        {
                            key: '2',
                            label: (
                                <Space orientation="horizontal" size={6}>
                                    <span>⚙️ Các Bước Tùy Biến (B1-B6)</span>
                                    <Badge
                                        count={(form.getFieldValue('customization_steps') || data.customization_steps || []).length}
                                        style={{ backgroundColor: '#6366f1' }}
                                    />
                                </Space>
                            ),
                            forceRender: true,
                            children: (
                                <Form.List name="customization_steps">
                                    {(stepFields, { add: addStep, remove: removeStep }) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {stepFields.map((stepField, stepIndex) => (
                                                <Card
                                                    key={stepField.key}
                                                    size="small"
                                                    style={{
                                                        borderRadius: 12,
                                                        border: '1px solid #cbd5e1',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                        overflow: 'hidden'
                                                    }}
                                                    title={
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                                            <div style={{
                                                                width: 26,
                                                                height: 26,
                                                                borderRadius: '50%',
                                                                background: '#4f46e5',
                                                                color: '#ffffff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 700,
                                                                fontSize: 12
                                                            }}>
                                                                {stepIndex + 1}
                                                            </div>
                                                            <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                                                                Bước {stepIndex + 1}: {form.getFieldValue(['customization_steps', stepField.name, 'label']) || 'Cấu hình bước'}
                                                            </span>
                                                        </div>
                                                    }
                                                    extra={
                                                        <Button
                                                            danger
                                                            type="text"
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => removeStep(stepField.name)}
                                                            style={{ borderRadius: 6 }}
                                                        >
                                                            Xóa bước
                                                        </Button>
                                                    }
                                                >
                                                    <Row gutter={[16, 12]}>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Form.Item
                                                                {...stepField}
                                                                name={[stepField.name, 'id']}
                                                                label={<span style={{ fontWeight: 600, fontSize: 12 }}>ID Bước (VD: step_size)</span>}
                                                                rules={[{ required: true, message: 'Nhập ID bước' }]}
                                                            >
                                                                <Input placeholder="step_id" style={{ borderRadius: 6 }} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Form.Item
                                                                {...stepField}
                                                                name={[stepField.name, 'label']}
                                                                label={<span style={{ fontWeight: 600, fontSize: 12 }}>Tiêu đề (VD: Chọn size nệm)</span>}
                                                                rules={[{ required: true, message: 'Nhập tiêu đề' }]}
                                                            >
                                                                <Input placeholder="Tên bước hiển thị..." style={{ borderRadius: 6 }} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Form.Item
                                                                {...stepField}
                                                                name={[stepField.name, 'type']}
                                                                label={<span style={{ fontWeight: 600, fontSize: 12 }}>Loại Giao Diện (UI)</span>}
                                                                rules={[{ required: true }]}
                                                            >
                                                                <Select
                                                                    style={{ borderRadius: 6 }}
                                                                    options={[
                                                                        { label: '🔘 Single Choice (Nút bấm)', value: 'toggle' },
                                                                        { label: '🔽 Dropdown List (Menu thả)', value: 'dropdown' },
                                                                        { label: '🎨 Color Swatch (Bảng mã màu)', value: 'color_swatch' },
                                                                        { label: '🏷️ Branding (In/thêu Logo)', value: 'branding' },
                                                                        { label: '⚡ Ẩn/Hiện (Có/Không)', value: 'yes_no' },
                                                                    ]}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Form.Item
                                                                {...stepField}
                                                                name={[stepField.name, 'required_frame_id']}
                                                                label={<span style={{ fontWeight: 600, fontSize: 12 }}>Frame Base Liên Kết</span>}
                                                            >
                                                                <Select
                                                                    allowClear
                                                                    placeholder="Chọn frame..."
                                                                    options={[{ label: '-- Không liên kết --', value: '' }, ...frameOptions]}
                                                                    style={{ borderRadius: 6 }}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>

                                                    <Row gutter={[16, 12]}>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Form.Item
                                                                {...stepField}
                                                                name={[stepField.name, 'is_skippable']}
                                                                label={<span style={{ fontWeight: 600, fontSize: 12 }}>Cho phép bỏ qua</span>}
                                                                valuePropName="checked"
                                                            >
                                                                <Switch checkedChildren="Có thể bỏ qua" unCheckedChildren="Bắt buộc" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Form.Item
                                                                {...stepField}
                                                                name={[stepField.name, 'default_option_id']}
                                                                label={<span style={{ fontWeight: 600, fontSize: 12 }}>ID Option Mặc Định</span>}
                                                            >
                                                                <Input placeholder="ID option chọn sẵn" style={{ borderRadius: 6 }} />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>

                                                    <Divider style={{ margin: '14px 0' }}>
                                                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                                            DANH SÁCH CÁC TÙY CHỌN (OPTIONS)
                                                        </span>
                                                    </Divider>

                                                    <Form.List name={[stepField.name, 'options']}>
                                                        {(optionFields, { add: addOption, remove: removeOption }) => (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                                {optionFields.map((optField, optIdx) => (
                                                                    <div
                                                                        key={optField.key}
                                                                        style={{
                                                                            background: '#f8fafc',
                                                                            padding: 14,
                                                                            borderRadius: 10,
                                                                            border: '1px solid #e2e8f0',
                                                                            position: 'relative'
                                                                        }}
                                                                    >
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                                                                Tùy chọn #{optIdx + 1}
                                                                            </span>
                                                                            <Button
                                                                                type="text"
                                                                                danger
                                                                                size="small"
                                                                                icon={<DeleteOutlined />}
                                                                                onClick={() => removeOption(optField.name)}
                                                                                style={{ fontSize: 12 }}
                                                                            >
                                                                                Xóa option
                                                                            </Button>
                                                                        </div>

                                                                        <Row gutter={[12, 10]}>
                                                                            <Col xs={24} sm={6} md={4}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Mã ID:</label>
                                                                                <Form.Item {...optField} name={[optField.name, 'id']} noStyle rules={[{ required: true }]}>
                                                                                    <Input placeholder="ID (VD: size_s)" size="small" style={{ borderRadius: 6 }} />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} sm={10} md={6}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tên hiển thị:</label>
                                                                                <Form.Item {...optField} name={[optField.name, 'name']} noStyle rules={[{ required: true }]}>
                                                                                    <Input placeholder="Tên (VD: Size S - 65x120cm)" size="small" style={{ borderRadius: 6 }} />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} sm={8} md={4}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Giá (+/- VNĐ):</label>
                                                                                <Form.Item {...optField} name={[optField.name, 'price_modifier']} noStyle rules={[{ required: true }]}>
                                                                                    <InputNumber
                                                                                        placeholder="0"
                                                                                        style={{ width: '100%', borderRadius: 6 }}
                                                                                        size="small"
                                                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                                        parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, '') || 0) as any}
                                                                                    />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} sm={12} md={5}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Mã màu HEX (nếu có):</label>
                                                                                <Form.Item {...optField} name={[optField.name, 'color_code']} noStyle>
                                                                                    <ColorPickerField />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} sm={12} md={5}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Mô tả ngắn:</label>
                                                                                <Form.Item {...optField} name={[optField.name, 'description']} noStyle>
                                                                                    <Input placeholder="Ghi chú chi tiết..." size="small" style={{ borderRadius: 6 }} />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row gutter={[12, 10]} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                                                                            <Col xs={24} md={12}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                                                                    🖼️ Ảnh Đại Diện Option:
                                                                                </label>
                                                                                <Form.Item {...optField} name={[optField.name, 'image_url']} noStyle>
                                                                                    <ImageUrlField />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={12}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                                                                    🎭 Ảnh Overlay/Texture Frame:
                                                                                </label>
                                                                                <Form.Item {...optField} name={[optField.name, 'visualization_overlay']} noStyle>
                                                                                    <ImageUrlField />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row style={{ marginTop: 8 }}>
                                                                            <Col span={24}>
                                                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                                                                    📚 Bộ sưu tập ảnh mẫu (Multi-gallery):
                                                                                </label>
                                                                                <Form.Item {...optField} name={[optField.name, 'image_urls']} noStyle>
                                                                                    <MultiImageField />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        </Row>
                                                                    </div>
                                                                ))}

                                                                <Button
                                                                    type="dashed"
                                                                    onClick={() => addOption()}
                                                                    block
                                                                    icon={<PlusOutlined />}
                                                                    style={{ borderRadius: 8, height: 38, borderColor: '#6366f1', color: '#4f46e5' }}
                                                                >
                                                                    Thêm Tùy Chọn Mới (Option)
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </Form.List>
                                                </Card>
                                            ))}

                                            <Button
                                                type="dashed"
                                                onClick={() => addStep()}
                                                block
                                                icon={<PlusOutlined />}
                                                style={{
                                                    borderRadius: 10,
                                                    height: 44,
                                                    fontWeight: 600,
                                                    fontSize: 14,
                                                    borderColor: '#0284c7',
                                                    color: '#0284c7',
                                                    background: '#f0f9ff'
                                                }}
                                            >
                                                + Thêm Bước Tùy Biến Mới
                                            </Button>
                                        </div>
                                    )}
                                </Form.List>
                            )
                        },
                        {
                            key: '3',
                            label: (
                                <Space orientation="horizontal" size={6}>
                                    <span>💰 Bảng Giá Bậc Thang (Tiers)</span>
                                    <Badge
                                        count={(form.getFieldValue('price_tiers') || data.price_tiers || []).length}
                                        style={{ backgroundColor: '#10b981' }}
                                    />
                                </Space>
                            ),
                            forceRender: true,
                            children: (
                                <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                                    <div style={{
                                        marginBottom: 16,
                                        padding: '12px 16px',
                                        background: '#ecfdf5',
                                        borderRadius: 8,
                                        border: '1px solid #a7f3d0',
                                        color: '#065f46',
                                        fontSize: 13
                                    }}>
                                        💵 <strong>Chính Sách Chiết Khấu Sỉ Theo Số Lượng:</strong> Cấu hình giá base cho từng khoảng số lượng đặt hàng. Khách hàng đặt mua nhiều hơn sẽ tự động nhận đơn giá ưu đãi tốt hơn.
                                    </div>

                                    <Form.List name="price_tiers">
                                        {(tierFields, { add, remove }) => (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {tierFields.map((field, idx) => (
                                                    <div
                                                        key={field.key}
                                                        style={{
                                                            background: '#f8fafc',
                                                            borderRadius: 10,
                                                            padding: '14px 16px',
                                                            border: '1px solid #e2e8f0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            flexWrap: 'wrap'
                                                        }}
                                                    >
                                                        <Tag color="green" style={{ borderRadius: 6, fontWeight: 700, margin: 0, height: 26, lineHeight: '26px' }}>
                                                            Mốc #{idx + 1}
                                                        </Tag>
                                                        <div style={{ flex: '1 1 180px' }}>
                                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                                                Số lượng Tối thiểu:
                                                            </label>
                                                            <Form.Item {...field} name={[field.name, 'min_quantity']} noStyle rules={[{ required: true, message: 'Bắt buộc' }]}>
                                                                <InputNumber min={1} placeholder="SL từ (VD: 10)" style={{ width: '100%', borderRadius: 6 }} />
                                                            </Form.Item>
                                                        </div>
                                                        <div style={{ flex: '1 1 180px' }}>
                                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                                                Số lượng Tối đa (bỏ trống = vô hạn):
                                                            </label>
                                                            <Form.Item {...field} name={[field.name, 'max_quantity']} noStyle>
                                                                <InputNumber min={1} placeholder="SL đến (VD: 49)" style={{ width: '100%', borderRadius: 6 }} />
                                                            </Form.Item>
                                                        </div>
                                                        <div style={{ flex: '1 1 240px' }}>
                                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                                                Đơn giá Base (VNĐ):
                                                            </label>
                                                            <Form.Item {...field} name={[field.name, 'base_price']} noStyle rules={[{ required: true, message: 'Bắt buộc' }]}>
                                                                <InputNumber
                                                                    min={0}
                                                                    placeholder="Giá cơ bản (VNĐ)"
                                                                    style={{ width: '100%', borderRadius: 6 }}
                                                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                    parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any}
                                                                />
                                                            </Form.Item>
                                                        </div>
                                                        <Button
                                                            danger
                                                            type="text"
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(field.name)}
                                                            style={{ borderRadius: 6, alignSelf: 'flex-end', marginBottom: 2 }}
                                                        >
                                                            Xóa mốc
                                                        </Button>
                                                    </div>
                                                ))}

                                                <Button
                                                    type="dashed"
                                                    onClick={() => add()}
                                                    block
                                                    icon={<PlusOutlined />}
                                                    style={{
                                                        borderRadius: 8,
                                                        height: 40,
                                                        fontWeight: 600,
                                                        borderColor: '#10b981',
                                                        color: '#059669',
                                                        background: '#f0fdf4'
                                                    }}
                                                >
                                                    + Thêm Mốc Giá Bậc Thang
                                                </Button>
                                            </div>
                                        )}
                                    </Form.List>
                                </div>
                            )
                        }
                    ]}
                />
            </Form>
        </Modal>
    );
}
