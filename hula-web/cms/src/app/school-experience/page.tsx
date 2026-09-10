'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    Tabs,
    Button,
    Space,
    Typography,
    Tag,
    Row,
    Col,
    Form,
    Input,
    Select,
    Switch,
    Table,
    Modal,
    message,
    Spin,
    Radio,
    Badge,
    Divider,
    Alert,
    Tooltip,
} from 'antd';
import {
    SaveOutlined,
    CloudUploadOutlined,
    HistoryOutlined,
    RollbackOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    CompassOutlined,
    PictureOutlined,
    ShopOutlined,
    HomeOutlined,
    ReloadOutlined,
    SettingOutlined,
    MobileOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/AdminLayout';
import ImageUploader from '@/components/ImageUploader';
import { schoolExperienceApi } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

export default function SchoolExperiencePage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [config, setConfig] = useState<any>(null);
    const [draftMeta, setDraftMeta] = useState<any>(null);

    // Selected product & color binding editor state
    const [selectedProduct, setSelectedProduct] = useState<string>('REF-MAT-CARA-STD');
    const [selectedColor, setSelectedColor] = useState<string>('blue');
    const [selectedSlot, setSelectedSlot] = useState<string>('real_photo');

    // Modals
    const [publishModalVisible, setPublishModalVisible] = useState<boolean>(false);
    const [changelogInput, setChangelogInput] = useState<string>('');
    const [revisionsModalVisible, setRevisionsModalVisible] = useState<boolean>(false);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loadingRevisions, setLoadingRevisions] = useState<boolean>(false);

    // R7 Bounds & Mobile Crop Editor
    const [editingR7Slot, setEditingR7Slot] = useState<{ role: string; step: string; cell: any } | null>(null);
    const [r7FormDraft, setR7FormDraft] = useState<any>({});
    const [previewPreset, setPreviewPreset] = useState<'desktop' | 'mobile_compact' | 'mobile_standard'>('mobile_compact');

    // Load draft config on mount
    const fetchDraft = async () => {
        setLoading(true);
        try {
            const res = await schoolExperienceApi.getDraft();
            if (res.data) {
                setConfig(res.data);
                setDraftMeta({
                    revisionNumber: res.data.revisionNumber,
                    updatedAt: res.data.updatedAt,
                    author: res.data.author,
                });
            }
        } catch (err: any) {
            console.warn('Could not fetch draft, falling back to public config:', err);
            try {
                const pub = await schoolExperienceApi.getPublic();
                if (pub.data) {
                    setConfig(pub.data);
                }
            } catch (e) {
                message.error('Không thể tải cấu hình trải nghiệm trường học.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDraft();
    }, []);

    // Save draft
    const handleSaveDraft = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await schoolExperienceApi.saveDraft(config);
            message.success(res.data?.message || 'Đã lưu bản nháp thành công');
            await fetchDraft();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Lỗi khi lưu bản nháp');
        } finally {
            setSaving(false);
        }
    };

    // Publish draft
    const handlePublish = async () => {
        setSaving(true);
        try {
            const res = await schoolExperienceApi.publish(changelogInput || 'Cập nhật trải nghiệm trường học');
            message.success(res.data?.message || 'Xuất bản thành công!');
            setPublishModalVisible(false);
            setChangelogInput('');
            await fetchDraft();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Không thể xuất bản');
        } finally {
            setSaving(false);
        }
    };

    // Load revisions list
    const fetchRevisions = async () => {
        setLoadingRevisions(true);
        try {
            const res = await schoolExperienceApi.getRevisions();
            setRevisions(res.data || []);
            setRevisionsModalVisible(true);
        } catch (err: any) {
            message.error('Không thể tải danh sách phiên bản');
        } finally {
            setLoadingRevisions(false);
        }
    };

    // Rollback to revision
    const handleRollback = async (revId: number) => {
        Modal.confirm({
            title: 'Xác nhận khôi phục phiên bản?',
            icon: <ExclamationCircleOutlined />,
            content: 'Hệ thống sẽ tạo một phiên bản xuất bản mới với dữ liệu của phiên bản được chọn.',
            okText: 'Khôi phục ngay',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const res = await schoolExperienceApi.rollback(revId);
                    message.success(res.data?.message || 'Đã khôi phục thành công!');
                    setRevisionsModalVisible(false);
                    await fetchDraft();
                } catch (err: any) {
                    message.error(err.response?.data?.message || 'Lỗi khi khôi phục');
                }
            },
        });
    };

    if (loading || !config) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[500px]">
                    <Spin size="large" tip="Đang tải dữ liệu Trải nghiệm trường học..." />
                </div>
            </AdminLayout>
        );
    }

    const currentBindingKey = `${selectedProduct}_${selectedColor}_${selectedSlot}`;
    const currentBinding = config.productBindings?.[currentBindingKey] || {
        assetUrl: '',
        productReference: selectedProduct,
        colorId: selectedColor,
        slotType: selectedSlot,
    };

    const handleUpdateBinding = (url: string) => {
        setConfig((prev: any) => ({
            ...prev,
            productBindings: {
                ...(prev.productBindings || {}),
                [currentBindingKey]: {
                    productReference: selectedProduct,
                    colorId: selectedColor,
                    slotType: selectedSlot,
                    assetUrl: url,
                    updatedAt: new Date().toISOString(),
                },
            },
        }));
    };

    const handleUpdateRoom = (roomId: string, field: string, val: any) => {
        setConfig((prev: any) => ({
            ...prev,
            rooms: {
                ...(prev.rooms || {}),
                [roomId]: {
                    ...(prev.rooms?.[roomId] || {}),
                    [field]: val,
                },
            },
        }));
    };

    const handleUpdateR7Cell = (role: string, step: string, url: string) => {
        const key = `r7/${role}/${step}`;
        setConfig((prev: any) => ({
            ...prev,
            r7MediaMatrix: {
                ...(prev.r7MediaMatrix || {}),
                [key]: {
                    roleId: role,
                    stepCode: step,
                    assetUrl: url,
                    mediaDesktopUrl: url,
                    mediaMobileUrl: url,
                    mediaType: 'image',
                    status: url ? 'available' : 'missing',
                },
            },
        }));
    };

    const handleSaveR7SlotDetails = (role: string, step: string, updatedFields: any) => {
        const key = `r7/${role}/${step}`;
        setConfig((prev: any) => ({
            ...prev,
            r7MediaMatrix: {
                ...(prev.r7MediaMatrix || {}),
                [key]: {
                    ...(prev.r7MediaMatrix?.[key] || {}),
                    ...updatedFields,
                    roleId: role,
                    stepCode: step,
                    assetUrl: updatedFields.assetUrl || updatedFields.mediaDesktopUrl || prev.r7MediaMatrix?.[key]?.assetUrl || '',
                    status: (updatedFields.assetUrl || updatedFields.mediaDesktopUrl || prev.r7MediaMatrix?.[key]?.assetUrl) ? 'available' : 'missing',
                },
            },
        }));
        message.success('Đã lưu cấu hình vùng an toàn slot R7');
    };

    const roles = [
        { id: 'co-an', label: 'Cô An (Giáo viên)' },
        { id: 'me-linh', label: 'Mẹ Linh (Phụ huynh)' },
        { id: 'be-may', label: 'Bé Mây (Học sinh)' },
    ];

    const steps = [
        { code: 'h0-greet', title: 'H0: Gặp nhau tại bàn đón bé' },
        { code: 'h1-table', title: 'H1: Đặt túi lên bàn kiểm' },
        { code: 'h2-label', title: 'H2: Xác nhận nhãn & danh mục' },
        { code: 'h3-ready', title: 'H3: Chuẩn bị trao nhận túi' },
        { code: 'h4-transfer', title: 'H4: Tiếp xúc quai bàn giao' },
        { code: 'h5-received', title: 'H5: Hoàn tất bàn giao' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6 pb-12">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <Title level={4} style={{ margin: 0 }}>
                                Trải Nghiệm Trường Học (School Experience CMS)
                            </Title>
                            <Tag color="purple">Instruction 10</Tag>
                            <Tag color={config.status === 'PUBLISHED' ? 'green' : 'blue'}>
                                Revision #{draftMeta?.revisionNumber || config.revisionNumber || 1}
                            </Tag>
                        </div>
                        <Paragraph type="secondary" className="text-xs mt-1 mb-0">
                            Quản lý tài nguyên sản phẩm, phòng học, chuỗi bàn giao R7, mặt bằng SVG và kiểm soát xuất bản / rollback.
                        </Paragraph>
                    </div>

                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={fetchDraft} loading={loading}>
                            Tải lại
                        </Button>
                        <Button icon={<HistoryOutlined />} onClick={fetchRevisions} loading={loadingRevisions}>
                            Lịch sử phiên bản
                        </Button>
                        <Button type="default" icon={<SaveOutlined />} onClick={handleSaveDraft} loading={saving}>
                            Lưu nháp
                        </Button>
                        <Button
                            type="primary"
                            icon={<CloudUploadOutlined />}
                            onClick={() => setPublishModalVisible(true)}
                            loading={saving}
                            className="bg-[#087F8C] hover:bg-[#076C77]"
                        >
                            Xuất bản
                        </Button>
                    </Space>
                </div>

                {/* Main Tabs */}
                <Card className="shadow-sm rounded-2xl border-gray-100">
                    <Tabs
                        defaultActiveKey="products"
                        items={[
                            // TAB 1: PRODUCT VISUAL BINDINGS
                            {
                                key: 'products',
                                label: (
                                    <span>
                                        <ShopOutlined /> Sản phẩm theo màu & vị trí
                                    </span>
                                ),
                                children: (
                                    <div className="space-y-6">
                                        <Alert
                                            message="Quy tắc quản trị ảnh sản phẩm (Instruction 10 §1)"
                                            description="Gắn đúng sản phẩm và màu sắc; ảnh thiếu phải để trạng thái thiếu rõ ràng, không tự ý mượn ảnh màu khác. Thay ảnh tự động tạo phiên bản mới, không ghi đè URL cũ."
                                            type="info"
                                            showIcon
                                            className="rounded-xl"
                                        />

                                        <Row gutter={[24, 24]}>
                                            <Col xs={24} md={8}>
                                                <Card title="1. Chọn Vị Trí Cần Đổi Ảnh" size="small" className="rounded-xl border-gray-200">
                                                    <Form layout="vertical">
                                                        <Form.Item label="Dòng sản phẩm">
                                                            <Select
                                                                value={selectedProduct}
                                                                onChange={setSelectedProduct}
                                                                options={[
                                                                    { value: 'REF-MAT-CARA-STD', label: 'Cotton Cara chăn tiêu chuẩn (R1, R6)' },
                                                                    { value: 'REF-MAT-SATIN-STD', label: 'Satin Hàn Quốc mềm mát (R2, R6)' },
                                                                    { value: 'REF-FOAM-FOLD4', label: 'Nệm Foam gấp 4 khúc (R3, R6)' },
                                                                    { value: 'REF-SLEEP-CARA-STD', label: 'Túi ngủ mầm non (R4, R6)' },
                                                                    { value: 'REF-BAG-HANDLE', label: 'Túi quai xách mầm non (R5, R7)' },
                                                                    { value: 'REF-BAG-DRAWSTRING', label: 'Túi dây rút mầm non (R5, R6)' },
                                                                ]}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item label="Biến thể màu sắc">
                                                            <Select
                                                                value={selectedColor}
                                                                onChange={setSelectedColor}
                                                                options={[
                                                                    { value: 'blue', label: 'Xanh dương' },
                                                                    { value: 'green', label: 'Xanh lá' },
                                                                    { value: 'mint', label: 'Xanh ngọc' },
                                                                    { value: 'orange', label: 'Cam' },
                                                                    { value: 'yellow', label: 'Vàng' },
                                                                    { value: 'pink', label: 'Hồng' },
                                                                    { value: 'satin-mint', label: 'Satin Xanh ngọc' },
                                                                    { value: 'satin-pink', label: 'Satin Hồng phấn' },
                                                                    { value: 'satin-gold', label: 'Satin Vàng kem' },
                                                                    { value: 'satin-gray', label: 'Satin Ghi sáng' },
                                                                ]}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item label="Vị trí hiển thị (Slot)">
                                                            <Select
                                                                value={selectedSlot}
                                                                onChange={setSelectedSlot}
                                                                options={[
                                                                    { value: 'real_photo', label: 'Ảnh sản phẩm thật (Gallery / Cận cảnh)' },
                                                                    { value: 'color_variant', label: 'Ảnh theo màu (Hiển thị biến thể)' },
                                                                    { value: 'cubby_storage', label: 'Ảnh góc cất đồ (Kệ cubby minh họa)' },
                                                                    { value: 'texture_3d', label: 'Bề mặt mô hình 3D (Texture PBR)' },
                                                                ]}
                                                            />
                                                        </Form.Item>

                                                        <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-600 space-y-1">
                                                            <Text strong>Khóa liên kết:</Text>
                                                            <p className="font-mono text-[11px] text-gray-500">{currentBindingKey}</p>
                                                            <p className="text-gray-500">
                                                                Phòng ảnh hưởng:{' '}
                                                                <Tag color="cyan">
                                                                    {selectedProduct.includes('CARA') ? 'Lớp Lá (R1), Lớp HULA (R6)' : 'Lớp học tương ứng'}
                                                                </Tag>
                                                            </p>
                                                        </div>
                                                    </Form>
                                                </Card>
                                            </Col>

                                            <Col xs={24} md={16}>
                                                <Card title="2. Tải Ảnh Mới & Xem Trước" size="small" className="rounded-xl border-gray-200">
                                                    <div className="space-y-4">
                                                        <ImageUploader
                                                            value={currentBinding.assetUrl}
                                                            onChange={(val) => {
                                                                const url = typeof val === 'string' ? val : val?.url || '';
                                                                handleUpdateBinding(url);
                                                            }}
                                                            simple={true}
                                                            hint="Chấp nhận JPG, PNG, WebP tối đa 10 MB. Hệ thống tự tạo tên lưu an toàn."
                                                        />

                                                        {currentBinding.assetUrl ? (
                                                            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-gray-200 space-y-2">
                                                                <Text strong className="text-sm">
                                                                    Xem trước trong slot:
                                                                </Text>
                                                                <div className="w-full max-w-sm h-48 rounded-xl overflow-hidden border border-gray-300 relative bg-gray-100">
                                                                    <img
                                                                        src={currentBinding.assetUrl}
                                                                        alt="Preview slot"
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                </div>
                                                                <Text type="secondary" className="text-xs block">
                                                                    Trạng thái: <Tag color="blue">Đang lưu nháp</Tag> (Khách chưa thấy cho đến khi xuất bản)
                                                                </Text>
                                                            </div>
                                                        ) : (
                                                            <Alert
                                                                message="Vị trí này hiện chưa có ảnh riêng."
                                                                description="Hệ thống sẽ ghi rõ 'Thiếu ảnh' thay vì mượn màu khác."
                                                                type="warning"
                                                                showIcon
                                                            />
                                                        )}
                                                    </div>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </div>
                                ),
                            },

                            // TAB 2: ROOMS CONFIGURATION
                            {
                                key: 'rooms',
                                label: (
                                    <span>
                                        <HomeOutlined /> Danh mục phòng học (R1–R7)
                                    </span>
                                ),
                                children: (
                                    <div className="space-y-4">
                                        <Paragraph type="secondary" className="text-xs">
                                            Chỉnh sửa tên hiển thị tiếng Việt, mô tả, ảnh thumbnail bản đồ và trạng thái hiển thị của 7 phòng học.
                                        </Paragraph>

                                        <Table
                                            dataSource={Object.entries(config.rooms || {}).map(([key, val]: [string, any]) => ({
                                                key,
                                                ...val,
                                            }))}
                                            columns={[
                                                {
                                                    title: 'Mã phòng',
                                                    dataIndex: 'id',
                                                    key: 'id',
                                                    width: 90,
                                                    render: (id: string) => <Tag color="geekblue">{id}</Tag>,
                                                },
                                                {
                                                    title: 'Tên hiển thị tiếng Việt',
                                                    dataIndex: 'name',
                                                    key: 'name',
                                                    render: (text: string, record: any) => (
                                                        <Input
                                                            value={text}
                                                            onChange={(e) => handleUpdateRoom(record.id, 'name', e.target.value)}
                                                        />
                                                    ),
                                                },
                                                {
                                                    title: 'Tiêu đề trải nghiệm',
                                                    dataIndex: 'title',
                                                    key: 'title',
                                                    render: (text: string, record: any) => (
                                                        <Input
                                                            value={text}
                                                            onChange={(e) => handleUpdateRoom(record.id, 'title', e.target.value)}
                                                        />
                                                    ),
                                                },
                                                {
                                                    title: 'Thumbnail bản đồ',
                                                    dataIndex: 'thumbnail',
                                                    key: 'thumbnail',
                                                    width: 140,
                                                    render: (url: string) => (
                                                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                            {url ? <img src={url} alt="Room" className="w-full h-full object-cover" /> : null}
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    title: 'Hiển thị',
                                                    dataIndex: 'active',
                                                    key: 'active',
                                                    width: 100,
                                                    render: (active: boolean, record: any) => (
                                                        <Switch
                                                            checked={active}
                                                            onChange={(val) => handleUpdateRoom(record.id, 'active', val)}
                                                        />
                                                    ),
                                                },
                                            ]}
                                            pagination={false}
                                            bordered
                                        />
                                    </div>
                                ),
                            },

                            // TAB 3: R7 HANDOVER MEDIA MATRIX
                            {
                                key: 'r7',
                                label: (
                                    <span>
                                        <CompassOutlined /> Bàn giao R7 (Ma trận 18 Slot)
                                    </span>
                                ),
                                children: (
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <Text strong className="text-sm text-blue-900">
                                                    Chế độ hiển thị Phòng Đón Bé R7:
                                                </Text>
                                                <Paragraph className="text-xs text-blue-800 mb-0">
                                                    {config.r7RenderMode === 'illustrated_sequence'
                                                        ? 'Chuỗi minh họa tương tác góc nhìn thứ nhất (Khuyên dùng khi chưa có rig nhân vật 3D hoàn chỉnh).'
                                                        : 'Chế độ 3D đầy đủ (Yêu cầu nhân vật có rig, chuyển động và túi hợp lệ).'}
                                                </Paragraph>
                                            </div>

                                            <Radio.Group
                                                value={config.r7RenderMode || 'illustrated_sequence'}
                                                onChange={(e) => setConfig((prev: any) => ({ ...prev, r7RenderMode: e.target.value }))}
                                                buttonStyle="solid"
                                            >
                                                <Radio.Button value="illustrated_sequence">Minh họa tương tác (Active)</Radio.Button>
                                                <Radio.Button value="scene3d">Mô hình 3D (GLB)</Radio.Button>
                                            </Radio.Group>
                                        </div>

                                        <Table
                                            dataSource={steps.map((s, idx) => ({
                                                key: s.code,
                                                stepCode: s.code,
                                                stepTitle: s.title,
                                                stepIndex: idx,
                                            }))}
                                            columns={[
                                                {
                                                    title: 'Bước bàn giao',
                                                    dataIndex: 'stepTitle',
                                                    key: 'stepTitle',
                                                    width: 220,
                                                    render: (text: string) => <Text strong className="text-xs">{text}</Text>,
                                                },
                                                ...roles.map(role => ({
                                                    title: role.label,
                                                    key: role.id,
                                                    render: (_: any, record: any) => {
                                                        const key = `r7/${role.id}/${record.stepCode}`;
                                                        const cell = config.r7MediaMatrix?.[key] || {
                                                            assetUrl: `/images/tour360/r7/${role.id}/${record.stepCode}.webp`,
                                                            status: 'available',
                                                        };
                                                        const hasUrl = !!cell.assetUrl;

                                                        return (
                                                            <div className="space-y-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200">
                                                                <div className="flex items-center justify-between">
                                                                    <Tag color={hasUrl ? 'green' : 'red'}>
                                                                        {hasUrl ? 'Đã có ảnh' : 'Thiếu ảnh'}
                                                                    </Tag>
                                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                                        {role.id}
                                                                    </span>
                                                                </div>

                                                                {hasUrl && (
                                                                    <div className="w-full h-20 rounded-lg overflow-hidden border border-gray-300 relative bg-black/5">
                                                                        <img
                                                                            src={cell.assetUrl}
                                                                            alt={key}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                )}

                                                                <Input
                                                                    size="small"
                                                                    placeholder="URL ảnh/clip WebP"
                                                                    value={cell.assetUrl || ''}
                                                                    onChange={(e) => handleUpdateR7Cell(role.id, record.stepCode, e.target.value)}
                                                                    className="text-xs font-mono"
                                                                />

                                                                <Button
                                                                    size="small"
                                                                    type="dashed"
                                                                    icon={<SettingOutlined />}
                                                                    onClick={() => {
                                                                        setEditingR7Slot({ role: role.id, step: record.stepCode, cell });
                                                                        setR7FormDraft({
                                                                            assetUrl: cell.assetUrl || '',
                                                                            mediaDesktopUrl: cell.mediaDesktopUrl || cell.assetUrl || '',
                                                                            mediaMobileUrl: cell.mediaMobileUrl || cell.assetUrl || '',
                                                                            focalPoint: cell.focalPoint || [50, 50],
                                                                            actionBounds: cell.actionBounds || { x: 30, y: 40, width: 40, height: 40 },
                                                                            faceBounds: cell.faceBounds || { x: 35, y: 15, width: 30, height: 25 },
                                                                            description: cell.description || '',
                                                                        });
                                                                    }}
                                                                    className="w-full text-[11px] mt-1"
                                                                >
                                                                    Vùng an toàn & Mobile
                                                                </Button>
                                                            </div>
                                                        );
                                                    },
                                                })),
                                            ]}
                                            pagination={false}
                                            bordered
                                        />
                                    </div>
                                ),
                            },

                            // TAB 4: MAP CONFIGURATION
                            {
                                key: 'map',
                                label: (
                                    <span>
                                        <CompassOutlined /> Cấu hình bản đồ
                                    </span>
                                ),
                                children: (
                                    <div className="space-y-6 max-w-2xl">
                                        <Alert
                                            message="Cấu hình Tuyến khám phá nhanh & Bản đồ trường"
                                            description="Bản đồ trường được hiển thị trực quan theo kiến trúc khuôn viên. Bạn có thể sắp xếp thứ tự chặng của Tuyến khám phá nhanh."
                                            type="info"
                                            showIcon
                                            className="rounded-xl"
                                        />

                                        <Form layout="vertical">
                                            <Form.Item label="Thứ tự các phòng trong Tuyến khám phá nhanh">
                                                <Select
                                                    mode="multiple"
                                                    value={config.mapConfig?.quickRoute || ['R1', 'R6', 'R7']}
                                                    onChange={(val) =>
                                                        setConfig((prev: any) => ({
                                                            ...prev,
                                                            mapConfig: { ...(prev.mapConfig || {}), quickRoute: val },
                                                        }))
                                                    }
                                                    options={[
                                                        { value: 'R1', label: '1. R1 · Lớp Lá (Cara)' },
                                                        { value: 'R2', label: '2. R2 · Lớp Nắng (Satin)' },
                                                        { value: 'R3', label: '3. R3 · Lớp Mầm (Foam gấp 4)' },
                                                        { value: 'R4', label: '4. R4 · Lớp Mây (Túi ngủ)' },
                                                        { value: 'R5', label: '5. R5 · Góc Gọn Gàng (Kệ túi)' },
                                                        { value: 'R6', label: '6. R6 · Lớp HULA (Phối hợp)' },
                                                        { value: 'R7', label: '7. R7 · Phòng Đón Bé (Bàn giao)' },
                                                    ]}
                                                />
                                            </Form.Item>

                                            <Form.Item label="Hiển thị dấu '✓ Đã ghé' trên bản đồ">
                                                <Switch
                                                    checked={config.mapConfig?.showVisitedBadge !== false}
                                                    onChange={(val) =>
                                                        setConfig((prev: any) => ({
                                                            ...prev,
                                                            mapConfig: { ...(prev.mapConfig || {}), showVisitedBadge: val },
                                                        }))
                                                    }
                                                />
                                            </Form.Item>
                                        </Form>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>
            </div>

            {/* Modal Publish */}
            <Modal
                title="Xuất bản cấu hình Trải nghiệm trường học"
                open={publishModalVisible}
                onOk={handlePublish}
                onCancel={() => setPublishModalVisible(false)}
                okText="Xác nhận Xuất bản"
                confirmLoading={saving}
                className="rounded-2xl"
            >
                <div className="space-y-4 py-2">
                    <Alert
                        message="Thao tác này sẽ phát hành Revision mới cho toàn bộ khách tham quan."
                        description="Hệ thống sẽ kiểm tra toàn vẹn tham chiếu ảnh và khóa phiên bản nguyên tử. Phiên khách đang mở sẽ giữ nguyên cho đến lần tải tiếp theo."
                        type="warning"
                        showIcon
                    />

                    <div>
                        <Text strong className="text-xs">
                            Ghi chú thay đổi (Changelog):
                        </Text>
                        <Input.TextArea
                            rows={3}
                            placeholder="Ví dụ: Cập nhật ảnh màu xanh nệm Cara và hoàn thiện 18 slot R7"
                            value={changelogInput}
                            onChange={(e) => setChangelogInput(e.target.value)}
                            className="mt-1.5"
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal Revisions History */}
            <Modal
                title="Lịch sử các phiên bản xuất bản (Revisions)"
                open={revisionsModalVisible}
                onCancel={() => setRevisionsModalVisible(false)}
                footer={null}
                width={800}
                className="rounded-2xl"
            >
                <Table
                    dataSource={revisions}
                    rowKey="id"
                    columns={[
                        {
                            title: 'Phiên bản',
                            dataIndex: 'revision_number',
                            key: 'revision_number',
                            width: 100,
                            render: (num: number, r: any) => (
                                <Space>
                                    <Tag color={r.status === 'PUBLISHED' ? 'green' : 'default'}>
                                        #{num}
                                    </Tag>
                                    {r.status === 'PUBLISHED' && <Badge status="processing" text="Active" />}
                                </Space>
                            ),
                        },
                        {
                            title: 'Ghi chú thay đổi',
                            dataIndex: 'changelog',
                            key: 'changelog',
                            render: (text: string) => text || 'Không có mô tả',
                        },
                        {
                            title: 'Người thực hiện',
                            dataIndex: 'author',
                            key: 'author',
                            width: 130,
                        },
                        {
                            title: 'Thời gian xuất bản',
                            dataIndex: 'published_at',
                            key: 'published_at',
                            width: 180,
                            render: (date: string) => (date ? new Date(date).toLocaleString('vi-VN') : 'Bản nháp'),
                        },
                        {
                            title: 'Thao tác',
                            key: 'action',
                            width: 130,
                            render: (_: any, r: any) =>
                                r.status !== 'PUBLISHED' ? (
                                    <Button
                                        size="small"
                                        icon={<RollbackOutlined />}
                                        onClick={() => handleRollback(r.id)}
                                    >
                                        Khôi phục
                                    </Button>
                                ) : (
                                    <Text type="secondary" className="text-xs">
                                        Đang chạy
                                    </Text>
                                ),
                        },
                    ]}
                    pagination={{ pageSize: 8 }}
                />
            </Modal>

            {/* R7 Bounds & Mobile Preview Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <MobileOutlined className="text-[#087F8C]" />
                        <span>Cấu Hình Vùng An Toàn & Xem Trước Di Động ({editingR7Slot?.role} - {editingR7Slot?.step})</span>
                    </div>
                }
                open={editingR7Slot !== null}
                onCancel={() => setEditingR7Slot(null)}
                onOk={() => {
                    if (editingR7Slot) {
                        handleSaveR7SlotDetails(editingR7Slot.role, editingR7Slot.step, r7FormDraft);
                        setEditingR7Slot(null);
                    }
                }}
                okText="Lưu vùng an toàn"
                cancelText="Hủy"
                width={840}
                destroyOnClose
            >
                {editingR7Slot && (
                    <div className="space-y-4 py-2">
                        <Row gutter={20}>
                            {/* Left Form Controls */}
                            <Col span={12} className="space-y-3">
                                <div>
                                    <Text strong className="text-xs">URL Ảnh Desktop (16:9):</Text>
                                    <Input
                                        size="small"
                                        value={r7FormDraft.mediaDesktopUrl || ''}
                                        onChange={(e) => setR7FormDraft({ ...r7FormDraft, mediaDesktopUrl: e.target.value, assetUrl: e.target.value })}
                                        className="text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <Text strong className="text-xs">URL Ảnh Mobile (Tùy chọn):</Text>
                                    <Input
                                        size="small"
                                        placeholder="Để trống nếu dùng chung ảnh Desktop"
                                        value={r7FormDraft.mediaMobileUrl || ''}
                                        onChange={(e) => setR7FormDraft({ ...r7FormDraft, mediaMobileUrl: e.target.value })}
                                        className="text-xs font-mono mt-1"
                                    />
                                </div>

                                <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200 text-xs">
                                    <Text strong>Tâm điểm quan trọng (Focal Point %):</Text>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[11px] text-gray-500">X (%):</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.focalPoint?.[0] ?? 50}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    focalPoint: [Number(e.target.value), r7FormDraft.focalPoint?.[1] ?? 50],
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-gray-500">Y (%):</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.focalPoint?.[1] ?? 50}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    focalPoint: [r7FormDraft.focalPoint?.[0] ?? 50, Number(e.target.value)],
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50/60 rounded-xl space-y-2 border border-blue-200 text-xs">
                                    <Text strong className="text-blue-900">Vùng mặt nhân vật (Face Bounds %):</Text>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <div>
                                            <span className="text-[10px] text-gray-500">X:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.faceBounds?.x ?? 35}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    faceBounds: { ...(r7FormDraft.faceBounds || {}), x: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500">Y:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.faceBounds?.y ?? 15}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    faceBounds: { ...(r7FormDraft.faceBounds || {}), y: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500">W:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.faceBounds?.width ?? 30}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    faceBounds: { ...(r7FormDraft.faceBounds || {}), width: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500">H:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.faceBounds?.height ?? 25}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    faceBounds: { ...(r7FormDraft.faceBounds || {}), height: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-emerald-50/60 rounded-xl space-y-2 border border-emerald-200 text-xs">
                                    <Text strong className="text-emerald-900">Vùng hành động túi/tay (Action Bounds %):</Text>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <div>
                                            <span className="text-[10px] text-gray-500">X:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.actionBounds?.x ?? 30}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    actionBounds: { ...(r7FormDraft.actionBounds || {}), x: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500">Y:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.actionBounds?.y ?? 40}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    actionBounds: { ...(r7FormDraft.actionBounds || {}), y: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500">W:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.actionBounds?.width ?? 40}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    actionBounds: { ...(r7FormDraft.actionBounds || {}), width: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500">H:</span>
                                            <Input
                                                size="small"
                                                type="number"
                                                value={r7FormDraft.actionBounds?.height ?? 40}
                                                onChange={(e) => setR7FormDraft({
                                                    ...r7FormDraft,
                                                    actionBounds: { ...(r7FormDraft.actionBounds || {}), height: Number(e.target.value) },
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            {/* Right Interactive Preview */}
                            <Col span={12} className="space-y-3 flex flex-col items-center">
                                <div className="w-full flex items-center justify-between">
                                    <Text strong className="text-xs">Mô phỏng khung hình:</Text>
                                    <Radio.Group
                                        size="small"
                                        value={previewPreset}
                                        onChange={(e) => setPreviewPreset(e.target.value)}
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="desktop">16:9 Desktop</Radio.Button>
                                        <Radio.Button value="mobile_compact">400×528</Radio.Button>
                                        <Radio.Button value="mobile_standard">390×844</Radio.Button>
                                    </Radio.Group>
                                </div>

                                {/* Preview Viewport Box */}
                                <div
                                    className={`relative rounded-2xl overflow-hidden border-2 border-[#087F8C] bg-slate-900 transition-all flex items-center justify-center ${
                                        previewPreset === 'desktop'
                                            ? 'w-full aspect-[16/9]'
                                            : previewPreset === 'mobile_compact'
                                            ? 'w-[240px] h-[316px]'
                                            : 'w-[200px] h-[432px]'
                                    }`}
                                >
                                    <img
                                        src={
                                            (previewPreset !== 'desktop' && r7FormDraft.mediaMobileUrl)
                                                ? r7FormDraft.mediaMobileUrl
                                                : (r7FormDraft.mediaDesktopUrl || r7FormDraft.assetUrl)
                                        }
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/tour360/r7/me-linh/h0-greet.webp';
                                        }}
                                    />

                                    {/* Focal Point Indicator */}
                                    <div
                                        className="absolute w-3 h-3 rounded-full bg-red-500 border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md"
                                        style={{
                                            left: `${r7FormDraft.focalPoint?.[0] ?? 50}%`,
                                            top: `${r7FormDraft.focalPoint?.[1] ?? 50}%`,
                                        }}
                                        title="Focal Point"
                                    />

                                    {/* Face Bounds Rectangle */}
                                    {r7FormDraft.faceBounds && (
                                        <div
                                            className="absolute border-2 border-blue-400 bg-blue-500/20 pointer-events-none"
                                            style={{
                                                left: `${r7FormDraft.faceBounds.x}%`,
                                                top: `${r7FormDraft.faceBounds.y}%`,
                                                width: `${r7FormDraft.faceBounds.width}%`,
                                                height: `${r7FormDraft.faceBounds.height}%`,
                                            }}
                                        >
                                            <span className="absolute -top-4 left-0 text-[9px] font-bold bg-blue-500 text-white px-1 rounded">
                                                Mặt
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Bounds Rectangle */}
                                    {r7FormDraft.actionBounds && (
                                        <div
                                            className="absolute border-2 border-emerald-400 bg-emerald-500/20 pointer-events-none"
                                            style={{
                                                left: `${r7FormDraft.actionBounds.x}%`,
                                                top: `${r7FormDraft.actionBounds.y}%`,
                                                width: `${r7FormDraft.actionBounds.width}%`,
                                                height: `${r7FormDraft.actionBounds.height}%`,
                                            }}
                                        >
                                            <span className="absolute -top-4 left-0 text-[9px] font-bold bg-emerald-500 text-white px-1 rounded">
                                                Túi/Hành động
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Crop Safety Warning Check */}
                                {(() => {
                                    const faceX = r7FormDraft.faceBounds?.x ?? 35;
                                    const faceW = r7FormDraft.faceBounds?.width ?? 30;
                                    const actX = r7FormDraft.actionBounds?.x ?? 30;
                                    const actW = r7FormDraft.actionBounds?.width ?? 40;
                                    const isRisk = faceX < 15 || (faceX + faceW) > 85 || actX < 15 || (actX + actW) > 85;

                                    if (isRisk && previewPreset !== 'desktop') {
                                        return (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                message="Cảnh báo cắt xén trên di động"
                                                description="Vùng mặt hoặc túi nệm nằm sát mép biên, có thể bị cắt khi hiển thị trên màn hình hẹp (400×528). Hãy căn giữa focal point hoặc cung cấp ảnh mobile riêng."
                                                className="text-xs"
                                            />
                                        );
                                    }
                                    return (
                                        <Alert
                                            type="success"
                                            showIcon
                                            message="Vùng an toàn đảm bảo"
                                            description="Khuôn mặt và túi nệm nằm trọn trong khung hình trải nghiệm di động."
                                            className="text-xs"
                                        />
                                    );
                                })()}
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
