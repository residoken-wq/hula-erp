'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    message,
    Space,
    Popconfirm,
    Table,
    Select,
    Tag,
    Badge,
    Tooltip,
    Row,
    Col,
    Typography,
    Empty
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    SettingOutlined,
    CompassOutlined,
    SearchOutlined,
    AppstoreOutlined,
    FolderOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    PictureOutlined,
    SyncOutlined,
    DownOutlined,
    UpOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { wizardApi, uploadApi } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { WizardConfigData, WizardCategoryL1, WizardCategoryL2 } from '@/types/wizard';
import SubcategoryConfigModal from './components/SubcategoryConfigModal';

const { Title, Text } = Typography;

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

// Mini Image picker for L1/L2 modals
function MiniImagePicker({ value, onChange }: { value?: string; onChange?: (val: string) => void }) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            message.error('Vui lòng chọn file hình ảnh!');
            return;
        }
        setUploading(true);
        try {
            const res = await uploadApi.image(file);
            onChange?.(res.data?.url || '');
            message.success('Đã tải ảnh lên!');
        } catch {
            message.error('Upload thất bại!');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {value && (
                <div style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}>
                    <img src={resolveImageUrl(value)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}
            <Input
                placeholder="URL hình ảnh hoặc tải lên..."
                value={value}
                onChange={e => onChange?.(e.target.value)}
                style={{ flex: 1, borderRadius: 6 }}
                allowClear
            />
            <label style={{ cursor: 'pointer', margin: 0 }}>
                <Button size="middle" loading={uploading} icon={<PictureOutlined />} style={{ borderRadius: 6 }}>
                    Upload
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                    }}
                />
            </label>
        </div>
    );
}

export default function WizardConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<WizardConfigData>({ hero_title: '', categories: [] });
    const [form] = Form.useForm();

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filter360, setFilter360] = useState<'all' | 'has_360' | 'no_360'>('all');
    const [expandedL1s, setExpandedL1s] = useState<Record<string, boolean>>({});

    // Modal states
    const [l1ModalVisible, setL1ModalVisible] = useState(false);
    const [editingL1, setEditingL1] = useState<WizardCategoryL1 | null>(null);

    const [l2ModalVisible, setL2ModalVisible] = useState(false);
    const [editingL2, setEditingL2] = useState<{ l1Id: string; l2: WizardCategoryL2 | null } | null>(null);

    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [activeConfigL2, setActiveConfigL2] = useState<{ l1Id: string; l2: WizardCategoryL2 } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await wizardApi.getConfig();
            const data = res.data || { hero_title: 'Tự Thiết Kế Bộ Sản Phẩm Mầm Non Cao Cấp', categories: [] };
            if (!data.categories) data.categories = [];
            setConfig(data);
            // Default expand all L1s
            const initialExpanded: Record<string, boolean> = {};
            data.categories.forEach((cat: WizardCategoryL1) => {
                initialExpanded[cat.id] = true;
            });
            setExpandedL1s(initialExpanded);
        } catch (error) {
            message.error('Không thể tải cấu hình wizard!');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            await wizardApi.saveConfig(config);
            message.success('Đã lưu toàn bộ cấu hình wizard thành công!');
        } catch (error) {
            message.error('Không thể lưu cấu hình, vui lòng thử lại!');
        } finally {
            setSaving(false);
        }
    };

    // Toggle collapse for L1 card
    const toggleL1Expand = (id: string) => {
        setExpandedL1s(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Stats calculations ---
    const stats = useMemo(() => {
        const totalL1 = config.categories.length;
        let totalL2 = 0;
        let with360Count = 0;
        let totalSteps = 0;

        config.categories.forEach(l1 => {
            (l1.subcategories || []).forEach(l2 => {
                totalL2++;
                if (l2.frames_360 && l2.frames_360.length > 0) {
                    with360Count++;
                }
                totalSteps += (l2.customization_steps || []).length;
            });
        });

        return { totalL1, totalL2, with360Count, totalSteps };
    }, [config]);

    // --- Filtered categories and products ---
    const filteredCategories = useMemo(() => {
        return config.categories.map(l1 => {
            const matchesL1Name = l1.name.toLowerCase().includes(searchQuery.toLowerCase());
            const filteredSubs = (l1.subcategories || []).filter(l2 => {
                const matchesSearch = matchesL1Name || l2.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l2.description || '').toLowerCase().includes(searchQuery.toLowerCase());
                const has360 = Boolean(l2.frames_360 && l2.frames_360.length > 0);
                if (filter360 === 'has_360') return matchesSearch && has360;
                if (filter360 === 'no_360') return matchesSearch && !has360;
                return matchesSearch;
            });
            return {
                ...l1,
                filteredSubcategories: filteredSubs,
                matchesSearch: matchesL1Name || filteredSubs.length > 0
            };
        }).filter(l1 => l1.matchesSearch);
    }, [config.categories, searchQuery, filter360]);

    // --- L1 Management ---
    const handleSaveL1 = (values: any) => {
        let newCategories = [...config.categories];
        if (editingL1) {
            newCategories = newCategories.map(c => c.id === editingL1.id ? { ...c, ...values } : c);
        } else {
            const newId = `L1-${Date.now()}`;
            newCategories.push({
                id: newId,
                ...values,
                subcategories: []
            });
            setExpandedL1s(prev => ({ ...prev, [newId]: true }));
        }
        setConfig({ ...config, categories: newCategories });
        setL1ModalVisible(false);
        message.success(editingL1 ? 'Đã cập nhật danh mục L1' : 'Đã thêm danh mục L1 mới');
    };

    const handleDeleteL1 = (id: string) => {
        setConfig({ ...config, categories: config.categories.filter(c => c.id !== id) });
        message.success('Đã xóa danh mục L1');
    };

    // --- L2 Management ---
    const handleSaveL2 = (values: any) => {
        if (!editingL2) return;
        const newCategories = config.categories.map(c => {
            if (c.id === editingL2.l1Id) {
                let newSubs = [...c.subcategories];
                if (editingL2.l2) {
                    newSubs = newSubs.map(sub => sub.id === editingL2.l2!.id ? { ...sub, ...values } : sub);
                } else {
                    newSubs.push({
                        id: `L2-${Date.now()}`,
                        ...values,
                        customization_steps: [],
                        price_tiers: [],
                        frames_360: []
                    });
                }
                return { ...c, subcategories: newSubs };
            }
            return c;
        });
        setConfig({ ...config, categories: newCategories });
        setL2ModalVisible(false);
        message.success(editingL2.l2 ? 'Đã cập nhật sản phẩm L2' : 'Đã thêm sản phẩm L2 mới');
    };

    const handleDeleteL2 = (l1Id: string, l2Id: string) => {
        const newCategories = config.categories.map(c => {
            if (c.id === l1Id) {
                return { ...c, subcategories: c.subcategories.filter(sub => sub.id !== l2Id) };
            }
            return c;
        });
        setConfig({ ...config, categories: newCategories });
        message.success('Đã xóa sản phẩm L2');
    };

    const handleSaveConfigL2 = (updatedL2: WizardCategoryL2) => {
        if (!activeConfigL2) return;
        const newCategories = config.categories.map(c => {
            if (c.id === activeConfigL2.l1Id) {
                return {
                    ...c,
                    subcategories: c.subcategories.map(sub => sub.id === updatedL2.id ? updatedL2 : sub)
                };
            }
            return c;
        });
        setConfig({ ...config, categories: newCategories });
        setConfigModalVisible(false);
        message.success(`Đã lưu cấu hình cho sản phẩm "${updatedL2.name}"`);
    };

    return (
        <AdminLayout>
            <div style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>
                {/* TOP HERO HEADER */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -30,
                        right: -20,
                        width: 180,
                        height: 180,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 50,
                                height: 50,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 26,
                                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
                            }}>
                                🧙‍♂️
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                                        Cấu Hình Wizard Tùy Biến B2B & Chuỗi Frame 360°
                                    </h1>
                                    <span style={{
                                        background: 'rgba(56, 189, 248, 0.2)',
                                        color: '#38bdf8',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(56, 189, 248, 0.3)'
                                    }}>
                                        v2.5 Studio
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                                    Quản lý danh mục L1, sản phẩm L2, chuỗi frame 360° đổi màu theo mã HEX, các bước tùy chọn và biểu giá sỉ bậc thang.
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Button
                                icon={<SyncOutlined />}
                                onClick={loadData}
                                loading={loading}
                                style={{ borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                                Tải Lại
                            </Button>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={saving}
                                onClick={handleSaveConfig}
                                size="large"
                                style={{
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                                    border: 'none',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
                                }}
                            >
                                Lưu Cấu Hình Wizard
                            </Button>
                        </div>
                    </div>

                    {/* STATS TILES */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12,
                        marginTop: 20,
                        paddingTop: 18,
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Danh mục (L1)</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{stats.totalL1}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Sản phẩm tùy biến (L2)</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{stats.totalL2}</div>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <div style={{ fontSize: 12, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CompassOutlined /> Đã có Chuỗi Frame 360°
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                                {stats.with360Count} / {stats.totalL2} <span style={{ fontSize: 13, fontWeight: 500, color: '#a7f3d0' }}>({stats.totalL2 > 0 ? Math.round((stats.with360Count / stats.totalL2) * 100) : 0}%)</span>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Tổng bước tùy biến (Steps)</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{stats.totalSteps}</div>
                        </div>
                    </div>
                </div>

                {/* HERO TITLE CONFIG CARD */}
                <Card
                    size="small"
                    style={{
                        borderRadius: 12,
                        marginBottom: 20,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 4 }}>
                                🏷️ Tiêu đề chính trang đặt hàng (Hero Title B2B):
                            </label>
                            <Input
                                value={config.hero_title}
                                onChange={e => setConfig({ ...config, hero_title: e.target.value })}
                                placeholder="VD: Tự Thiết Kế Bộ Sản Phẩm Mầm Non Cao Cấp HULA..."
                                style={{ borderRadius: 8, height: 38 }}
                            />
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', flex: '1 1 250px' }}>
                            Dòng tiêu đề này hiển thị nổi bật ở đầu trang Đặt Hàng B2B (<code style={{ color: '#0284c7' }}>/dat-hang-si</code>) để giới thiệu tính năng cá nhân hóa thương hiệu độc quyền cho khách hàng.
                        </div>
                    </div>
                </Card>

                {/* SEARCH & FILTER BAR */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    gap: 12,
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: '1 1 360px' }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Tìm kiếm danh mục L1 hoặc sản phẩm L2..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            allowClear
                            style={{ maxWidth: 360, borderRadius: 8 }}
                        />
                        <Select
                            value={filter360}
                            onChange={setFilter360}
                            style={{ width: 180 }}
                            options={[
                                { label: 'Tất cả trạng thái 360°', value: 'all' },
                                { label: '🌐 Đã có Frame 360°', value: 'has_360' },
                                { label: '⚠️ Chưa có Frame 360°', value: 'no_360' },
                            ]}
                        />
                    </div>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingL1(null);
                            form.resetFields();
                            setL1ModalVisible(true);
                        }}
                        style={{
                            borderRadius: 8,
                            background: '#0f172a',
                            border: 'none',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
                        }}
                    >
                        + Thêm Danh Mục (L1)
                    </Button>
                </div>

                {/* CATEGORIES L1 LIST */}
                {filteredCategories.length === 0 ? (
                    <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
                        <Empty description="Không tìm thấy danh mục hoặc sản phẩm phù hợp!" />
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {filteredCategories.map(l1 => {
                            const isExpanded = expandedL1s[l1.id] ?? true;
                            const subCount = (l1.subcategories || []).length;
                            const subWith360 = (l1.subcategories || []).filter(sub => sub.frames_360 && sub.frames_360.length > 0).length;

                            return (
                                <div
                                    key={l1.id}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 14,
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                        overflow: 'hidden',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                >
                                    {/* L1 HEADER BAR */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '14px 18px',
                                            background: '#f8fafc',
                                            borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                                            cursor: 'pointer',
                                            userSelect: 'none'
                                        }}
                                        onClick={() => toggleL1Expand(l1.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: 10,
                                                background: '#e0f2fe',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #bae6fd',
                                                overflow: 'hidden'
                                            }}>
                                                {l1.icon_url ? (
                                                    <img src={resolveImageUrl(l1.icon_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <FolderOutlined style={{ fontSize: 18, color: '#0284c7' }} />
                                                )}
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                                        {l1.name}
                                                    </span>
                                                    <Tag color="geekblue" style={{ borderRadius: 6, margin: 0 }}>
                                                        {subCount} sản phẩm L2
                                                    </Tag>
                                                    {subWith360 > 0 && (
                                                        <Tag color="cyan" icon={<CompassOutlined />} style={{ borderRadius: 6, margin: 0 }}>
                                                            {subWith360} có 360°
                                                        </Tag>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                    Mã ID: <code>{l1.id}</code> | Thứ tự: {l1.sort_order ?? 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* L1 ACTIONS */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                                            <Button
                                                size="small"
                                                type="dashed"
                                                icon={<PlusOutlined />}
                                                onClick={() => {
                                                    setEditingL2({ l1Id: l1.id, l2: null });
                                                    form.resetFields();
                                                    setL2ModalVisible(true);
                                                }}
                                                style={{ borderRadius: 6, fontWeight: 600, color: '#0284c7', borderColor: '#0284c7' }}
                                            >
                                                + Sản phẩm (L2)
                                            </Button>

                                            <Tooltip title="Chỉnh sửa thông tin danh mục L1">
                                                <Button
                                                    size="small"
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => {
                                                        setEditingL1(l1);
                                                        form.setFieldsValue(l1);
                                                        setL1ModalVisible(true);
                                                    }}
                                                    style={{ borderRadius: 6 }}
                                                />
                                            </Tooltip>

                                            <Popconfirm
                                                title="Xác nhận xóa danh mục L1?"
                                                description="Hành động này sẽ xóa toàn bộ các sản phẩm L2 thuộc danh mục!"
                                                onConfirm={() => handleDeleteL1(l1.id)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <Tooltip title="Xóa danh mục này">
                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                                                </Tooltip>
                                            </Popconfirm>

                                            <Button
                                                size="small"
                                                type="text"
                                                icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                                                onClick={() => toggleL1Expand(l1.id)}
                                                style={{ borderRadius: 6, color: '#64748b' }}
                                            />
                                        </div>
                                    </div>

                                    {/* L2 SUBCATEGORIES SECTION */}
                                    {isExpanded && (
                                        <div style={{ padding: '12px 16px' }}>
                                            {l1.filteredSubcategories.length === 0 ? (
                                                <div style={{
                                                    padding: '24px 0',
                                                    textAlign: 'center',
                                                    color: '#94a3b8',
                                                    fontSize: 13,
                                                    background: '#fafafa',
                                                    borderRadius: 8,
                                                    border: '1px dashed #e2e8f0'
                                                }}>
                                                    Chưa có sản phẩm L2 nào trong danh mục này.{' '}
                                                    <a
                                                        onClick={() => {
                                                            setEditingL2({ l1Id: l1.id, l2: null });
                                                            form.resetFields();
                                                            setL2ModalVisible(true);
                                                        }}
                                                        style={{ color: '#0284c7', fontWeight: 600 }}
                                                    >
                                                        Thêm sản phẩm mới ngay
                                                    </a>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* DESKTOP TABLE VIEW (Ẩn trên mobile < 768px) */}
                                                    <div className="hidden md:block">
                                                        <Table
                                                            size="middle"
                                                            dataSource={l1.filteredSubcategories}
                                                            rowKey="id"
                                                            pagination={false}
                                                            columns={[
                                                                {
                                                                    title: 'Sản Phẩm L2',
                                                                    key: 'product_info',
                                                                    render: (_, r) => {
                                                                        const thumb = r.base_image || (r.base_images?.[0]?.url) || (r.frames_360?.[0]?.image_url);
                                                                        return (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                                <div style={{
                                                                                    width: 44,
                                                                                    height: 44,
                                                                                    borderRadius: 8,
                                                                                    border: '1px solid #e2e8f0',
                                                                                    overflow: 'hidden',
                                                                                    background: '#f8fafc',
                                                                                    flexShrink: 0,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center'
                                                                                }}>
                                                                                    {thumb ? (
                                                                                        <img src={resolveImageUrl(thumb)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                                    ) : (
                                                                                        <AppstoreOutlined style={{ color: '#cbd5e1', fontSize: 20 }} />
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{r.name}</div>
                                                                                    <div style={{ fontSize: 11, color: '#64748b', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                        {r.description || 'Chưa có mô tả'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                },
                                                                {
                                                                    title: 'Frames Base',
                                                                    key: 'base_layers',
                                                                    width: 120,
                                                                    render: (_, r) => {
                                                                        const count = r.base_images?.length || (r.base_image ? 1 : 0);
                                                                        return (
                                                                            <Tag color={count > 0 ? 'blue' : 'default'} style={{ borderRadius: 6 }}>
                                                                                {count} layers
                                                                            </Tag>
                                                                        );
                                                                    }
                                                                },
                                                                {
                                                                    title: 'Frame Dựng 360°',
                                                                    key: 'frames_360',
                                                                    width: 170,
                                                                    render: (_, r) => {
                                                                        const count = r.frames_360?.length || 0;
                                                                        if (count > 0) {
                                                                            return (
                                                                                <Tag
                                                                                    color="cyan"
                                                                                    icon={<CheckCircleOutlined />}
                                                                                    style={{
                                                                                        borderRadius: 6,
                                                                                        fontWeight: 600,
                                                                                        background: '#ecfeff',
                                                                                        borderColor: '#a5f3fc',
                                                                                        color: '#0891b2'
                                                                                    }}
                                                                                >
                                                                                    🌐 {count} góc 360°
                                                                                </Tag>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <Tag
                                                                                color="warning"
                                                                                icon={<ExclamationCircleOutlined />}
                                                                                style={{ borderRadius: 6, color: '#b45309', background: '#fffbeb', borderColor: '#fde68a' }}
                                                                            >
                                                                                Chưa có 360°
                                                                            </Tag>
                                                                        );
                                                                    }
                                                                },
                                                                {
                                                                    title: 'Tùy Biến (B1-B6)',
                                                                    key: 'steps',
                                                                    width: 130,
                                                                    render: (_, r) => {
                                                                        const count = r.customization_steps?.length || 0;
                                                                        return (
                                                                            <Tag color="purple" style={{ borderRadius: 6 }}>
                                                                                {count} bước
                                                                            </Tag>
                                                                        );
                                                                    }
                                                                },
                                                                {
                                                                    title: 'Mốc Giá Sỉ',
                                                                    key: 'price_tiers',
                                                                    width: 110,
                                                                    render: (_, r) => {
                                                                        const count = r.price_tiers?.length || 0;
                                                                        return (
                                                                            <Tag color="green" style={{ borderRadius: 6 }}>
                                                                                {count} mốc
                                                                            </Tag>
                                                                        );
                                                                    }
                                                                },
                                                                {
                                                                    title: 'Thao Tác',
                                                                    key: 'actions',
                                                                    width: 240,
                                                                    render: (_, r) => (
                                                                        <Space size={6}>
                                                                            <Button
                                                                                type="primary"
                                                                                size="small"
                                                                                icon={<SettingOutlined />}
                                                                                onClick={() => {
                                                                                    setActiveConfigL2({ l1Id: l1.id, l2: r });
                                                                                    setConfigModalVisible(true);
                                                                                }}
                                                                                style={{
                                                                                    borderRadius: 6,
                                                                                    background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                                                                                    border: 'none',
                                                                                    fontWeight: 600,
                                                                                    fontSize: 12,
                                                                                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                                                                                }}
                                                                            >
                                                                                Cấu Hình Wizard & 360°
                                                                            </Button>
                                                                            <Tooltip title="Sửa tên / mô tả sản phẩm">
                                                                                <Button
                                                                                    size="small"
                                                                                    type="text"
                                                                                    icon={<EditOutlined />}
                                                                                    onClick={() => {
                                                                                        setEditingL2({ l1Id: l1.id, l2: r });
                                                                                        form.setFieldsValue(r);
                                                                                        setL2ModalVisible(true);
                                                                                    }}
                                                                                    style={{ borderRadius: 6 }}
                                                                                />
                                                                            </Tooltip>
                                                                            <Popconfirm
                                                                                title="Xác nhận xóa sản phẩm L2?"
                                                                                onConfirm={() => handleDeleteL2(l1.id, r.id)}
                                                                                okText="Xóa"
                                                                                cancelText="Hủy"
                                                                                okButtonProps={{ danger: true }}
                                                                            >
                                                                                <Tooltip title="Xóa sản phẩm này">
                                                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                                                                                </Tooltip>
                                                                            </Popconfirm>
                                                                        </Space>
                                                                    )
                                                                }
                                                            ]}
                                                        />
                                                    </div>

                                                    {/* MOBILE CARD VIEW (Hiển thị trên điện thoại < 768px) */}
                                                    <div className="block md:hidden">
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            {l1.filteredSubcategories.map(r => {
                                                                const thumb = r.base_image || (r.base_images?.[0]?.url) || (r.frames_360?.[0]?.image_url);
                                                                const count360 = r.frames_360?.length || 0;
                                                                return (
                                                                    <div
                                                                        key={r.id}
                                                                        style={{
                                                                            background: '#f8fafc',
                                                                            border: '1px solid #e2e8f0',
                                                                            borderRadius: 12,
                                                                            padding: 14,
                                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                                                                        }}
                                                                    >
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                                            <div style={{
                                                                                width: 48,
                                                                                height: 48,
                                                                                borderRadius: 8,
                                                                                border: '1px solid #cbd5e1',
                                                                                background: '#fff',
                                                                                overflow: 'hidden',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                flexShrink: 0
                                                                            }}>
                                                                                {thumb ? (
                                                                                    <img src={resolveImageUrl(thumb)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                                ) : (
                                                                                    <AppstoreOutlined style={{ color: '#cbd5e1', fontSize: 22 }} />
                                                                                )}
                                                                            </div>
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{r.name}</div>
                                                                                <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                    {r.description || 'Chưa có mô tả'}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                                                            <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                                                                                {r.base_images?.length || 0} Frames
                                                                            </Tag>
                                                                            <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                                                                                {r.customization_steps?.length || 0} Steps
                                                                            </Tag>
                                                                            <Tag color="green" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                                                                                {r.price_tiers?.length || 0} Mốc giá
                                                                            </Tag>
                                                                            {count360 > 0 ? (
                                                                                <Tag color="cyan" style={{ borderRadius: 6, margin: 0, fontSize: 11, fontWeight: 600 }}>
                                                                                    🌐 {count360} góc 360°
                                                                                </Tag>
                                                                            ) : (
                                                                                <Tag color="warning" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                                                                                    ⚠️ Chưa có 360°
                                                                                </Tag>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                                            <Button
                                                                                type="primary"
                                                                                block
                                                                                icon={<SettingOutlined />}
                                                                                onClick={() => {
                                                                                    setActiveConfigL2({ l1Id: l1.id, l2: r });
                                                                                    setConfigModalVisible(true);
                                                                                }}
                                                                                style={{
                                                                                    borderRadius: 8,
                                                                                    height: 40,
                                                                                    fontWeight: 600,
                                                                                    background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                                                                                    border: 'none',
                                                                                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                                                                                }}
                                                                            >
                                                                                Cấu Hình Tùy Biến & 360°
                                                                            </Button>
                                                                            <Button
                                                                                icon={<EditOutlined />}
                                                                                onClick={() => {
                                                                                    setEditingL2({ l1Id: l1.id, l2: r });
                                                                                    form.setFieldsValue(r);
                                                                                    setL2ModalVisible(true);
                                                                                }}
                                                                                style={{ borderRadius: 8, height: 40, width: 44, padding: 0 }}
                                                                            />
                                                                            <Popconfirm
                                                                                title="Xác nhận xóa sản phẩm?"
                                                                                onConfirm={() => handleDeleteL2(l1.id, r.id)}
                                                                                okText="Xóa"
                                                                                cancelText="Hủy"
                                                                                okButtonProps={{ danger: true }}
                                                                            >
                                                                                <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8, height: 40, width: 44, padding: 0 }} />
                                                                            </Popconfirm>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MODAL L1 (DANH MỤC) */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700 }}>
                            <FolderOutlined style={{ color: '#0284c7' }} />
                            <span>{editingL1 ? 'Chỉnh Sửa Danh Mục (L1)' : 'Thêm Danh Mục Mới (L1)'}</span>
                        </div>
                    }
                    open={l1ModalVisible}
                    onCancel={() => setL1ModalVisible(false)}
                    onOk={() => form.submit()}
                    okText={editingL1 ? 'Cập nhật' : 'Thêm mới'}
                    cancelText="Hủy"
                    styles={{ content: { borderRadius: 14 } }}
                >
                    <Form form={form} layout="vertical" onFinish={handleSaveL1} style={{ marginTop: 16 }}>
                        <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Tên Danh Mục (L1)</span>} rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}>
                            <Input placeholder="VD: Bộ Nệm & Phụ Kiện Giấc Ngủ" style={{ borderRadius: 8, height: 38 }} />
                        </Form.Item>
                        <Form.Item name="icon_url" label={<span style={{ fontWeight: 600 }}>Icon Danh Mục:</span>}>
                            <MiniImagePicker />
                        </Form.Item>
                        <Form.Item name="image_url" label={<span style={{ fontWeight: 600 }}>Ảnh Thumbnail Banner:</span>}>
                            <MiniImagePicker />
                        </Form.Item>
                        <Form.Item name="sort_order" label={<span style={{ fontWeight: 600 }}>Thứ tự sắp xếp:</span>} initialValue={0}>
                            <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* MODAL L2 (SẢN PHẨM) */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700 }}>
                            <AppstoreOutlined style={{ color: '#6366f1' }} />
                            <span>{editingL2?.l2 ? 'Chỉnh Sửa Sản Phẩm (L2)' : 'Thêm Sản Phẩm Mới (L2)'}</span>
                        </div>
                    }
                    open={l2ModalVisible}
                    onCancel={() => setL2ModalVisible(false)}
                    onOk={() => form.submit()}
                    okText={editingL2?.l2 ? 'Cập nhật' : 'Thêm mới'}
                    cancelText="Hủy"
                    styles={{ content: { borderRadius: 14 } }}
                >
                    <Form form={form} layout="vertical" onFinish={handleSaveL2} style={{ marginTop: 16 }}>
                        <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Tên Sản Phẩm (L2)</span>} rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}>
                            <Input placeholder="VD: Bộ Nệm Mầm Non Cao Cấp Dòng Satin HQ" style={{ borderRadius: 8, height: 38 }} />
                        </Form.Item>
                        <Form.Item name="description" label={<span style={{ fontWeight: 600 }}>Mô tả sản phẩm:</span>}>
                            <Input.TextArea rows={3} placeholder="Nhập mô tả ngắn tính năng, công dụng của sản phẩm..." style={{ borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item name="base_image" label={<span style={{ fontWeight: 600 }}>Ảnh Base Cơ Bản (Legacy):</span>} extra="Ảnh nền chính (dùng tab Image Base và tab Frame 360 trong Cấu hình để quản lý chi tiết).">
                            <MiniImagePicker />
                        </Form.Item>
                        <Form.Item name="sort_order" label={<span style={{ fontWeight: 600 }}>Thứ tự sắp xếp:</span>} initialValue={0}>
                            <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* FULLSCREEN CONFIG MODAL (IMAGE BASE, FRAMES 360, STEPS, PRICE TIERS) */}
                {configModalVisible && activeConfigL2 && (
                    <SubcategoryConfigModal
                        visible={configModalVisible}
                        onClose={() => setConfigModalVisible(false)}
                        onSave={handleSaveConfigL2}
                        data={activeConfigL2.l2}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
