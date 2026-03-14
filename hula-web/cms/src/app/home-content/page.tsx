'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Form, Input, InputNumber, Switch, Button, message, Spin, Collapse, Row, Col, Divider, Space, Radio, Select, Rate, Card, Tooltip, Tabs, Modal } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, SettingOutlined, DesktopOutlined, HomeOutlined, BgColorsOutlined, EyeOutlined, MobileOutlined, LinkOutlined, GlobalOutlined, ClockCircleOutlined, ToolOutlined, RightOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import ImageUploader from '@/components/ImageUploader';
import { systemApi, websiteProjectsApi } from '@/lib/api';
import { List } from 'antd';

// ============================================
// INTERFACES
// ============================================
interface Feature {
    id: string;
    icon: string;
    title: string;
    description: string;
}

interface UspItem {
    id: string;
    icon: string;
    text: string;
}

interface Guarantee {
    id: string;
    icon: string;
    icon_url?: string;
    title: string;
    description: string;
}

interface CategoryItem {
    id: string;
    icon: string;
    title: string;
    image_url: string;
    slug: string;
}

interface Milestone {
    id: string;
    icon: string;
    title: string;
    description: string;
    image_url: string;
}

interface Partner {
    id: string;
    name: string;
    logo_url: string;
}

interface Testimonial {
    id: string;
    name: string;
    school: string;
    content: string;
    rating: number;
    image_url: string;
    product_image_url: string;
    product_name: string;
}

interface FeaturedProject {
    id: string;
    title: string;
    school_name: string;
    description?: string;
    image_url: string;
    slug: string;
}

interface FooterLink {
    id: string;
    label: string;
    url: string;
}

// ============================================
// COMPONENT
// ============================================
export default function HomeContentPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const previewRef = useRef<HTMLIFrameElement>(null);

    // --- Existing state ---
    const [features, setFeatures] = useState<Feature[]>([
        { id: '1', icon: '🌿', title: 'Kinh nghiệm 10 năm', description: 'Hơn một thập kỷ đồng hành cùng các hệ thống giáo dục' },
        { id: '2', icon: '🏆', title: 'Không ngừng cải tiến', description: 'Đội ngũ chuyên gia tận tâm liên tục nghiên cứu và phát triển' },
        { id: '3', icon: '🎨', title: 'Đậm dấu ấn thương hiệu', description: 'Tư vấn và thiết kế sản phẩm "may đo" theo đúng màu sắc nhận diện' },
        { id: '4', icon: '💯', title: 'Chất lượng vượt trội', description: 'Làm chủ 100% quy trình sản xuất' },
    ]);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [featureModal, setFeatureModal] = useState(false);

    const [uspItems, setUspItems] = useState<UspItem[]>([
        { id: '1', icon: '✨', text: 'Free tư vấn' },
        { id: '2', icon: '🎨', text: 'Free thiết kế' },
        { id: '3', icon: '🚚', text: 'Giao hàng toàn quốc' },
    ]);

    const [guarantees, setGuarantees] = useState<Guarantee[]>([
        { id: '1', icon: '🏭', title: 'Từ nhà máy đến người tiêu dùng', description: '' },
        { id: '2', icon: '🔄', title: 'Bảo hành 1 đổi 1', description: 'nếu lỗi sản xuất' },
        { id: '3', icon: '🚚', title: 'Giao hàng toàn quốc', description: 'Freeship từ 1.000.000đ' },
    ]);

    // --- NEW state ---
    const [categories, setCategories] = useState<CategoryItem[]>([
        { id: '1', icon: '🛏️', title: 'Nệm', image_url: '', slug: '/san-pham?category=nem' },
        { id: '2', icon: '🌙', title: 'Gối', image_url: '', slug: '/san-pham?category=goi' },
        { id: '3', icon: '🛌', title: 'Bộ Ga Giường', image_url: '', slug: '/san-pham?category=ga-giuong' },
        { id: '4', icon: '✨', title: 'Combo Tiết Kiệm', image_url: '', slug: '/san-pham?category=combo' },
    ]);

    const [milestones, setMilestones] = useState<Milestone[]>([
        { id: '1', icon: '🏪', title: 'Showroom trải nghiệm', description: 'Đa dạng, nhiều mẫu mã', image_url: '' },
        { id: '2', icon: '👷', title: 'Nhân công lành nghề', description: 'Kỹ thuật cao', image_url: '' },
        { id: '3', icon: '📦', title: 'Kệ hàng nhà máy', description: 'Sắp xếp khoa học', image_url: '' },
        { id: '4', icon: '🏢', title: 'Văn phòng hiện đại', description: 'Môi trường năng động', image_url: '' },
    ]);

    const [partners, setPartners] = useState<Partner[]>([
        { id: '1', name: 'Đối tác 1', logo_url: '' },
        { id: '2', name: 'Đối tác 2', logo_url: '' },
    ]);

    const [testimonials, setTestimonials] = useState<Testimonial[]>([
        { id: '1', name: 'Cô Nguyễn Thị A', school: 'Trường MN Hoa Sen', content: 'Trường rất hài lòng về sản phẩm của HULA.', rating: 5, image_url: '', product_image_url: '', product_name: 'Bộ Chăn Ga Gối HULA Classic' },
    ]);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [testimonialModal, setTestimonialModal] = useState(false);

    // --- NEW: Featured Projects ---
    const [projectOptions, setProjectOptions] = useState<{label: string, value: number}[]>([]);

    // --- NEW: Footer ---
    const [footerQuickLinks, setFooterQuickLinks] = useState<FooterLink[]>([
        { id: '1', label: 'Trang chủ', url: '/' },
        { id: '2', label: 'Về Hula', url: '/ve-hula' },
        { id: '3', label: 'Dự án', url: '/du-an' },
        { id: '4', label: 'Đặt hàng B2B', url: '/dat-hang-si' },
        { id: '5', label: 'Liên hệ', url: '/lien-he' },
    ]);
    const [footerProductLinks, setFooterProductLinks] = useState<FooterLink[]>([
        { id: '1', label: 'Hula Shop', url: '/san-pham' },
        { id: '2', label: 'Blog tư vấn', url: '/tin-tuc' },
        { id: '3', label: 'Chính sách', url: '/chinh-sach' },
    ]);

    // LivePreview state
    const [showPreview, setShowPreview] = useState(false);

    // ============================================
    // LOAD / SAVE
    // ============================================
    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await systemApi.getHomeConfig();
            if (res.data) {
                const data = { ...res.data };
                if (!data.hero_images || data.hero_images.length === 0) {
                    data.hero_images = data.hero_image ? [data.hero_image] : [];
                }
                form.setFieldsValue(data);

                // Fetch Project Options
                try {
                    const projectsRes = await websiteProjectsApi.getAll({ limit: 100 });
                    if (projectsRes.data && projectsRes.data.data) {
                        setProjectOptions(projectsRes.data.data.map((p: any) => ({
                            label: p.title,
                            value: p.id
                        })));
                    }
                } catch (e) {
                    console.error('Failed to fetch project options', e);
                }

                // Features / WhyChoose
                if (res.data.why_choose_reasons !== undefined) setFeatures(res.data.why_choose_reasons);
                else if (res.data.features !== undefined) setFeatures(res.data.features);
                if (res.data.usp_items !== undefined) setUspItems(res.data.usp_items);
                if (res.data.why_choose_guarantees !== undefined) setGuarantees(res.data.why_choose_guarantees);

                // NEW
                if (res.data.categories !== undefined) setCategories(res.data.categories);
                if (res.data.milestones !== undefined) setMilestones(res.data.milestones);
                if (res.data.partners !== undefined) setPartners(res.data.partners);
                if (res.data.testimonials !== undefined) setTestimonials(res.data.testimonials);
                if (res.data.footer_quick_links !== undefined) setFooterQuickLinks(res.data.footer_quick_links);
                if (res.data.footer_product_links !== undefined) setFooterProductLinks(res.data.footer_product_links);
            }
        } catch {
            message.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await systemApi.saveHomeConfig({
                ...values,
                features,
                why_choose_reasons: features,
                usp_items: uspItems,
                why_choose_guarantees: guarantees,
                categories,
                milestones,
                partners,
                testimonials,
                footer_quick_links: footerQuickLinks,
                footer_product_links: footerProductLinks,
            });
            message.success('Đã lưu nội dung trang chủ');
            // Refresh LivePreview
            if (previewRef.current) {
                previewRef.current.src = previewRef.current.src;
            }
        } catch {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // FEATURE HANDLERS
    // ============================================
    const handleAddFeature = () => { setEditingFeature(null); setFeatureModal(true); };
    const handleEditFeature = (f: Feature) => { setEditingFeature(f); setFeatureModal(true); };
    const handleDeleteFeature = (id: string) => { setFeatures(features.filter(f => f.id !== id)); message.success('Đã xóa'); };
    const handleSaveFeature = (values: any) => {
        if (editingFeature) {
            setFeatures(features.map(f => f.id === editingFeature.id ? { ...f, ...values } : f));
        } else {
            setFeatures([...features, { id: Date.now().toString(), ...values }]);
        }
        setFeatureModal(false);
        message.success(editingFeature ? 'Đã cập nhật' : 'Đã thêm');
    };

    // ============================================
    // TESTIMONIAL HANDLERS
    // ============================================
    const handleAddTestimonial = () => { setEditingTestimonial(null); setTestimonialModal(true); };
    const handleEditTestimonial = (t: Testimonial) => { setEditingTestimonial(t); setTestimonialModal(true); };
    const handleDeleteTestimonial = (id: string) => { setTestimonials(testimonials.filter(t => t.id !== id)); message.success('Đã xóa'); };
    const handleSaveTestimonial = (values: any) => {
        if (editingTestimonial) {
            setTestimonials(testimonials.map(t => t.id === editingTestimonial.id ? { ...t, ...values } : t));
        } else {
            setTestimonials([...testimonials, { id: Date.now().toString(), ...values }]);
        }
        setTestimonialModal(false);
        message.success(editingTestimonial ? 'Đã cập nhật' : 'Đã thêm');
    };

    // ============================================
    // TABS
    // ============================================
    const items = [
        // ==================== HERO ====================
        {
            key: 'hero',
            label: '🎯 Hero',
            children: (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="hero_title_1" label="Tiêu đề dòng 1">
                            <Input placeholder="Giấc Ngủ Ngon" size="large" />
                        </Form.Item>
                        <Form.Item name="hero_title_2" label="Tiêu đề dòng 2 (highlight)">
                            <Input placeholder="Cho Bé Yêu" size="large" />
                        </Form.Item>
                    </div>
                    <Form.Item name="hero_description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn về sản phẩm..." />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="hero_button_1" label="Nút CTA chính">
                            <Input placeholder="Xem Sản Phẩm" />
                        </Form.Item>
                        <Form.Item name="hero_button_2" label="Nút CTA phụ">
                            <Input placeholder="Liên Hệ Mua Sỉ" />
                        </Form.Item>
                    </div>
                    <Form.List name="hero_images">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <div key={field.key} style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <strong>Slider {index + 1}</strong>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                        </div>
                                        <Form.Item {...field} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Vui lòng chọn hình ảnh' }]}>
                                            <ImageUploader hint="📐 Kích thước: 1920x800px (2.4:1)" />
                                        </Form.Item>
                                    </div>
                                ))}
                                {fields.length < 5 && (
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Thêm hình ảnh ({fields.length}/5)
                                        </Button>
                                    </Form.Item>
                                )}
                            </>
                        )}
                    </Form.List>
                </>
            ),
        },
        // ==================== USP BAR ====================
        {
            key: 'usp',
            label: '🔖 USP Bar',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý các icon trên thanh USP (dưới Hero banner)</span>
                    </div>
                    {uspItems.map((item: UspItem, index: number) => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                            <Input value={item.icon} onChange={(e) => setUspItems(uspItems.map((u: UspItem, i: number) => i === index ? { ...u, icon: e.target.value } : u))} style={{ width: 60, textAlign: 'center', fontSize: 20 }} maxLength={4} placeholder="⭐" />
                            <Input value={item.text} onChange={(e) => setUspItems(uspItems.map((u: UspItem, i: number) => i === index ? { ...u, text: e.target.value } : u))} placeholder="Free tư vấn" style={{ flex: 1 }} />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setUspItems(uspItems.filter((_: UspItem, i: number) => i !== index))} />
                        </div>
                    ))}
                    {uspItems.length < 5 && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setUspItems([...uspItems, { id: Date.now().toString(), icon: '⭐', text: '' }])}>
                            Thêm USP ({uspItems.length}/5)
                        </Button>
                    )}
                </div>
            ),
        },
        // ==================== CATEGORIES ====================
        {
            key: 'categories',
            label: '🏷️ Danh Mục SP',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý danh mục sản phẩm hiển thị trên trang chủ</span>
                    </div>
                    {categories.map((cat: CategoryItem, index: number) => (
                        <div key={cat.id} style={{ marginBottom: 16, padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <strong>Danh mục {index + 1}</strong>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setCategories(categories.filter((_: CategoryItem, i: number) => i !== index))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12, alignItems: 'start' }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666' }}>Icon</label>
                                    <Input value={cat.icon} onChange={(e) => setCategories(categories.map((c: CategoryItem, i: number) => i === index ? { ...c, icon: e.target.value } : c))} style={{ textAlign: 'center', fontSize: 24 }} maxLength={4} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666' }}>Tên danh mục</label>
                                    <Input value={cat.title} onChange={(e) => setCategories(categories.map((c: CategoryItem, i: number) => i === index ? { ...c, title: e.target.value } : c))} placeholder="Nệm" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666' }}>Link (slug)</label>
                                    <Input value={cat.slug} onChange={(e) => setCategories(categories.map((c: CategoryItem, i: number) => i === index ? { ...c, slug: e.target.value } : c))} placeholder="/san-pham?category=nem" />
                                </div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Hình ảnh (tùy chọn, thay thế icon)</label>
                                <ImageUploader simple value={cat.image_url} onChange={(val: any) => setCategories(categories.map((c: CategoryItem, i: number) => i === index ? { ...c, image_url: typeof val === 'string' ? val : val?.url || '' } : c))} hint="📐 Vuông 400x400px" />
                            </div>
                        </div>
                    ))}
                    {categories.length < 8 && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setCategories([...categories, { id: Date.now().toString(), icon: '📦', title: '', image_url: '', slug: '' }])}>
                            Thêm danh mục ({categories.length}/8)
                        </Button>
                    )}
                </div>
            ),
        },
        // ==================== ABOUT / GIỚI THIỆU ====================
        {
            key: 'about',
            label: '📝 Giới Thiệu',
            children: (
                <>
                    <Form.Item name="about_title" label="Tiêu đề section">
                        <Input placeholder="Hơn 10 Năm Đồng Hành Cùng Giấc Ngủ Học Đường" size="large" />
                    </Form.Item>
                    <Form.Item name="about_description" label="Mô tả chi tiết">
                        <Input.TextArea rows={4} placeholder="HULA tự hào là đơn vị tiên phong..." />
                    </Form.Item>
                    <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 8, marginTop: 8 }}>
                        <p style={{ margin: 0, color: '#1890ff', fontSize: 13 }}>
                            💡 Section này hiển thị kèm Video YouTube (cấu hình ở tab Video Giới Thiệu)
                        </p>
                    </div>
                </>
            ),
        },
        // ==================== FEATURES / TẠI SAO CHỌN ====================
        {
            key: 'features',
            label: '✨ Tại Sao Chọn HULA',
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666' }}>Quản lý các điểm nổi bật hiển thị trên trang chủ</span>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFeature}>Thêm mới</Button>
                    </div>
                    <List
                        dataSource={features}
                        renderItem={(feature: Feature) => (
                            <List.Item
                                style={{ background: '#fff', marginBottom: 8, borderRadius: 8, padding: '12px 16px', border: '1px solid #f0f0f0' }}
                                actions={[
                                    <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleEditFeature(feature)} />,
                                    <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteFeature(feature.id)} />,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<span style={{ fontSize: 32 }}>{feature.icon}</span>}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            ),
        },
        // ==================== GUARANTEES ====================
        {
            key: 'guarantees',
            label: '🛡️ Mua Hàng Đảm Bảo',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý các cam kết hiển thị trong mục &quot;Mua hàng đảm bảo cùng HULA&quot;</span>
                    </div>
                    {guarantees.map((item: Guarantee, index: number) => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'start', marginBottom: 12, padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                            <div style={{ width: 80, flexShrink: 0 }}>
                                <label style={{ fontSize: 12, color: '#666' }}>Icon ảnh</label>
                                <ImageUploader simple value={item.icon_url} onChange={(val: any) => setGuarantees(guarantees.map((g: Guarantee, i: number) => i === index ? { ...g, icon_url: typeof val === 'string' ? val : val?.url || '' } : g))} hint="📐 Vuông" />
                            </div>
                            <div style={{ width: 80, flexShrink: 0 }}>
                                <label style={{ fontSize: 12, color: '#666' }}>Icon chữ</label>
                                <Input value={item.icon} onChange={(e) => setGuarantees(guarantees.map((g: Guarantee, i: number) => i === index ? { ...g, icon: e.target.value } : g))} style={{ textAlign: 'center', fontSize: 24 }} maxLength={4} placeholder="🏭" />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666' }}>Tiêu đề</label>
                                    <Input value={item.title} onChange={(e) => setGuarantees(guarantees.map((g: Guarantee, i: number) => i === index ? { ...g, title: e.target.value } : g))} placeholder="Tiêu đề" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666' }}>Mô tả (tùy chọn)</label>
                                    <Input value={item.description} onChange={(e) => setGuarantees(guarantees.map((g: Guarantee, i: number) => i === index ? { ...g, description: e.target.value } : g))} placeholder="Mô tả" />
                                </div>
                            </div>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setGuarantees(guarantees.filter((_: Guarantee, i: number) => i !== index))} style={{ marginTop: 24 }} />
                        </div>
                    ))}
                    {guarantees.length < 8 && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setGuarantees([...guarantees, { id: Date.now().toString(), icon: '⭐', icon_url: '', title: '', description: '' }])}>
                            Thêm cam kết ({guarantees.length}/8)
                        </Button>
                    )}
                </div>
            ),
        },
        // ==================== JOURNEY / HÀNH TRÌNH ====================
        {
            key: 'journey',
            label: '🏫 Hành Trình',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý các cột mốc trong &quot;Hành trình HULA đồng hành cùng trường học&quot;</span>
                    </div>
                    {milestones.map((item: Milestone, index: number) => (
                        <div key={item.id} style={{ marginBottom: 16, padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setMilestones(milestones.filter((_: Milestone, i: number) => i !== index))} style={{ position: 'absolute', top: 12, right: 12 }} />
                            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                                <div style={{ width: 180, flexShrink: 0 }}>
                                    <ImageUploader value={item.image_url} onChange={(val: any) => setMilestones(milestones.map((m: Milestone, i: number) => i === index ? { ...m, image_url: typeof val === 'string' ? val : val?.url || '' } : m))} hint="📐 Ngang 4:3" />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 24 }}>
                                    <Input value={item.title} onChange={(e) => setMilestones(milestones.map((m: Milestone, i: number) => i === index ? { ...m, title: e.target.value } : m))} placeholder="Tiêu đề (VD: Showroom trải nghiệm)" size="large" style={{ fontWeight: 600 }} />
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <Input value={item.icon} onChange={(e) => setMilestones(milestones.map((m: Milestone, i: number) => i === index ? { ...m, icon: e.target.value } : m))} style={{ width: 80, textAlign: 'center', fontSize: 24 }} maxLength={4} title="Icon tĩnh" prefix={<span style={{ fontSize: 12, color: '#aaa' }}>Icon</span>} />
                                        <Input.TextArea value={item.description} onChange={(e) => setMilestones(milestones.map((m: Milestone, i: number) => i === index ? { ...m, description: e.target.value } : m))} placeholder="Mô tả chi tiết" style={{ flex: 1 }} rows={3} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {milestones.length < 12 && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setMilestones([...milestones, { id: Date.now().toString(), icon: '📸', title: '', description: '', image_url: '' }])}>
                            Thêm cột mốc ({milestones.length}/12)
                        </Button>
                    )}
                </div>
            ),
        },
        // ==================== VIDEO ====================
        {
            key: 'video',
            label: '🎬 Video',
            children: (
                <>
                    <Form.Item name="video_enabled" label="Hiển thị video section" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="video_title" label="Tiêu đề section">
                        <Input placeholder="Khám Phá HULA" />
                    </Form.Item>
                    <Form.Item name="video_subtitle" label="Tiêu đề phụ">
                        <Input placeholder="Xem video giới thiệu về sản phẩm..." />
                    </Form.Item>
                    <Form.Item
                        name="video_youtube_url"
                        label="YouTube Video URL"
                        extra="Nhập link video YouTube. Ví dụ: https://www.youtube.com/watch?v=abc123"
                        rules={[{
                            pattern: /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/,
                            message: 'Vui lòng nhập đúng định dạng link YouTube'
                        }]}
                    >
                        <Input placeholder="https://www.youtube.com/watch?v=VIDEO_ID" size="large" prefix={<span style={{ color: '#ff0000' }}>▶</span>} />
                    </Form.Item>
                </>
            ),
        },
        // ==================== PARTNERS ====================
        {
            key: 'partners',
            label: '🤝 Đối Tác',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý logo đối tác hiển thị trên trang chủ (auto-scroll)</span>
                    </div>
                    {partners.map((p: Partner, index: number) => (
                        <div key={p.id} style={{ marginBottom: 16, padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setPartners(partners.filter((_: Partner, i: number) => i !== index))} style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }} />
                            <div style={{ display: 'flex', gap: 24, alignItems: 'center', paddingRight: 40 }}>
                                <div style={{ flex: 1 }}>
                                    <Input value={p.name} onChange={(e: any) => setPartners(partners.map((pp: Partner, i: number) => i === index ? { ...pp, name: e.target.value } : pp))} placeholder="Tên đối tác (VD: Trường MN ABC)" size="large" />
                                </div>
                                <div style={{ width: 160, flexShrink: 0 }}>
                                    <ImageUploader value={p.logo_url} onChange={(val: any) => setPartners(partners.map((pp: Partner, i: number) => i === index ? { ...pp, logo_url: typeof val === 'string' ? val : val?.url || '' } : pp))} hint="📐 Logo" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {partners.length < 20 && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setPartners([...partners, { id: Date.now().toString(), name: '', logo_url: '' }])}>
                            Thêm đối tác ({partners.length}/20)
                        </Button>
                    )}
                </div>
            ),
        },
        // ==================== TESTIMONIALS ====================
        {
            key: 'testimonials',
            label: '⭐ Đánh Giá KH',
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666' }}>Quản lý đánh giá từ khách hàng</span>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTestimonial}>Thêm mới</Button>
                    </div>
                    <List
                        dataSource={testimonials}
                        renderItem={(t: Testimonial) => (
                            <List.Item
                                style={{ background: '#fff', marginBottom: 8, borderRadius: 8, padding: '12px 16px', border: '1px solid #f0f0f0' }}
                                actions={[
                                    <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleEditTestimonial(t)} />,
                                    <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTestimonial(t.id)} />,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Rate disabled defaultValue={t.rating || 5} style={{ fontSize: 14 }} />}
                                    title={<>{t.name} <span style={{ color: '#999', fontWeight: 400 }}>— {t.school}</span></>}
                                    description={t.content?.substring(0, 100) + (t.content?.length > 100 ? '...' : '')}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            ),
        },
        // ==================== DỰ ÁN NỔI BẬT ====================
        {
            key: 'projects',
            label: '🏗️ Dự Án',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Chọn các dự án hiển thị trên trang chủ (lấy từ Quản lý Dự án). Lưu ý: Dự án có "Độ ưu tiên" cao sẽ hiển thị hình lớn.</span>
                    </div>
                    <Form.Item name="selected_project_ids" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 dự án' }]}>
                        <Select
                            mode="multiple"
                            placeholder="Khám phá và chọn dự án..."
                            options={projectOptions}
                            maxCount={12}
                            optionFilterProp="label"
                            style={{ width: '100%' }}
                            size="large"
                        />
                    </Form.Item>
                </div>
            ),
        },
        // ==================== PRODUCTS ====================
        {
            key: 'products',
            label: '🛍️ Sản Phẩm',
            children: (
                <>
                    <Form.Item name="products_title" label="Tiêu đề section">
                        <Input placeholder="Sản Phẩm Nổi Bật" />
                    </Form.Item>
                    <Form.Item name="products_subtitle" label="Tiêu đề phụ">
                        <Input placeholder="Những sản phẩm được yêu thích nhất" />
                    </Form.Item>
                    <Form.Item name="products_limit" label="Số sản phẩm hiển thị">
                        <InputNumber min={2} max={8} style={{ width: 120 }} />
                    </Form.Item>
                    <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                            💡 Sản phẩm được lấy tự động từ ERP (sắp xếp theo mới nhất).
                        </p>
                    </div>
                </>
            ),
        },
        // ==================== CTA ====================
        {
            key: 'cta',
            label: '📢 Banner CTA',
            children: (
                <>
                    <Form.Item name="cta_enabled" label="Hiển thị banner" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="cta_title" label="Tiêu đề">
                        <Input placeholder="Bạn là đại lý hoặc trường mầm non?" />
                    </Form.Item>
                    <Form.Item name="cta_description" label="Mô tả">
                        <Input.TextArea rows={2} placeholder="Mô tả ngắn..." />
                    </Form.Item>
                    <Form.Item name="cta_button" label="Nội dung nút">
                        <Input placeholder="Đăng Ký Mua Sỉ Ngay" />
                    </Form.Item>
                </>
            ),
        },
        // ==================== TOPBAR ====================
        {
            key: 'topbar',
            label: '📌 Topbar',
            children: (
                <>
                    <Form.Item name="topbar_enabled" label="Hiển thị Topbar" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="topbar_left_text" label="Text bên trái" extra="Hiển thị cố định">
                            <Input placeholder="📞 Hotline: 0909 123 456" />
                        </Form.Item>
                        <Form.Item name="topbar_right_text" label="Text chạy (marquee)" extra="Hiệu ứng chạy">
                            <Input placeholder="🎉 Miễn phí vận chuyển cho đơn từ 2 triệu đồng" />
                        </Form.Item>
                    </div>
                    <Form.Item name="topbar_right_url" label="URL liên kết">
                        <Input placeholder="/san-pham hoặc https://..." />
                    </Form.Item>
                    <Form.Item name="topbar_speed" label="Tốc độ chạy chữ (giây)" extra="Mặc định: 20">
                        <InputNumber min={5} max={60} style={{ width: 120 }} placeholder="20" />
                    </Form.Item>
                </>
            ),
        },
        // ==================== FOOTER ====================
        {
            key: 'footer',
            label: '🦶 Footer',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý nội dung Footer (Thông tin liên hệ quản lý ở <a href="/settings" target="_blank">Cài đặt</a>)</span>
                    </div>

                    <Form.Item name="footer_slogan" label="Slogan / Mô tả công ty" extra="Hiển thị dưới logo trong footer">
                        <Input.TextArea rows={2} placeholder="Hơn 10 năm đồng hành cùng giấc ngủ học đường. Giải pháp nệm, gối, chăn trường học toàn diện." />
                    </Form.Item>

                    <Form.Item name="footer_copyright" label="Dòng Copyright" extra="Mặc định: © 2026 HULA">
                        <Input placeholder="© 2026 HULA - Giải pháp nệm trường học toàn diện. Tất cả quyền được bảo lưu." />
                    </Form.Item>

                    <Divider orientation="left">Menu nhanh</Divider>
                    {footerQuickLinks.map((link: FooterLink, index: number) => (
                        <div key={link.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                            <Input value={link.label} onChange={(e: any) => setFooterQuickLinks(footerQuickLinks.map((l: FooterLink, i: number) => i === index ? { ...l, label: e.target.value } : l))} placeholder="Trang chủ" style={{ flex: 1 }} />
                            <Input value={link.url} onChange={(e: any) => setFooterQuickLinks(footerQuickLinks.map((l: FooterLink, i: number) => i === index ? { ...l, url: e.target.value } : l))} placeholder="/" style={{ flex: 1 }} addonBefore={<LinkOutlined />} />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setFooterQuickLinks(footerQuickLinks.filter((_: FooterLink, i: number) => i !== index))} />
                        </div>
                    ))}
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setFooterQuickLinks([...footerQuickLinks, { id: Date.now().toString(), label: '', url: '' }])} style={{ marginBottom: 16 }}>
                        Thêm link
                    </Button>

                    <Divider orientation="left">Sản phẩm / Liên kết phụ</Divider>
                    {footerProductLinks.map((link: FooterLink, index: number) => (
                        <div key={link.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                            <Input value={link.label} onChange={(e: any) => setFooterProductLinks(footerProductLinks.map((l: FooterLink, i: number) => i === index ? { ...l, label: e.target.value } : l))} placeholder="Hula Shop" style={{ flex: 1 }} />
                            <Input value={link.url} onChange={(e: any) => setFooterProductLinks(footerProductLinks.map((l: FooterLink, i: number) => i === index ? { ...l, url: e.target.value } : l))} placeholder="/san-pham" style={{ flex: 1 }} addonBefore={<LinkOutlined />} />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setFooterProductLinks(footerProductLinks.filter((_: FooterLink, i: number) => i !== index))} />
                        </div>
                    ))}
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setFooterProductLinks([...footerProductLinks, { id: Date.now().toString(), label: '', url: '' }])}>
                        Thêm link
                    </Button>

                    <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 8, marginTop: 16 }}>
                        <p style={{ margin: 0, color: '#1890ff', fontSize: 13 }}>
                            💡 Thông tin liên hệ (ĐT, Email, Địa chỉ), Mạng xã hội (Facebook, Zalo), và Google Maps được quản lý trong trang <a href="/settings" target="_blank"><strong>Cài đặt</strong></a>
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    // ============================================
    // RENDER
    // ============================================
    return (
        <AdminLayout>
            <div style={{ display: 'flex', gap: 16, height: showPreview ? 'calc(100vh - 120px)' : 'auto' }}>
                {/* Main Editor */}
                <div style={{ flex: showPreview ? '0 0 55%' : '1 1 auto', overflow: showPreview ? 'auto' : 'visible' }}>
                    <Card
                        title="Quản lý nội dung Trang Chủ"
                        extra={
                            <Space>
                                <Tooltip title={showPreview ? 'Đóng Preview' : 'Mở LivePreview'}>
                                    <Button
                                        icon={<EyeOutlined />}
                                        onClick={() => setShowPreview(!showPreview)}
                                        type={showPreview ? 'primary' : 'default'}
                                    >
                                        {showPreview ? 'Đóng Preview' : 'LivePreview'}
                                    </Button>
                                </Tooltip>
                                <Button icon={<EyeOutlined />} onClick={() => window.open('https://beta.nemmamnon.com', '_blank')}>
                                    Xem Beta
                                </Button>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                                    Lưu thay đổi
                                </Button>
                            </Space>
                        }
                    >
                        <Form form={form} layout="vertical">
                            <Tabs items={items} tabPosition="left" style={{ minHeight: showPreview ? 'calc(100vh - 220px)' : 'auto' }} />
                        </Form>
                    </Card>
                </div>

                {/* LivePreview Panel — Full Desktop Mode */}
                {showPreview && (
                    <div style={{ flex: '0 0 45%', position: 'sticky', top: 16, height: 'calc(100vh - 140px)' }}>
                        <Card
                            title="LivePreview — beta.nemmamnon.com (Desktop 1440px)"
                            size="small"
                            extra={
                                <Tooltip title="Refresh Preview">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        size="small"
                                        onClick={() => { if (previewRef.current) previewRef.current.src = previewRef.current.src; }}
                                    />
                                </Tooltip>
                            }
                            bodyStyle={{ padding: 0, height: 'calc(100% - 40px)', overflow: 'hidden' }}
                            style={{ height: '100%' }}
                        >
                            <div style={{
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden',
                                position: 'relative',
                            }}>
                                <iframe
                                    ref={previewRef}
                                    src="https://beta.nemmamnon.com"
                                    style={{
                                        width: '1440px',
                                        height: 'calc(100% / 0.45)',
                                        border: 'none',
                                        borderRadius: '0 0 8px 8px',
                                        transform: 'scale(0.45)',
                                        transformOrigin: 'top left',
                                    }}
                                    title="LivePreview"
                                />
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Feature Edit Modal */}
            <Modal
                title={editingFeature ? 'Sửa điểm nổi bật' : 'Thêm điểm nổi bật'}
                open={featureModal}
                onCancel={() => setFeatureModal(false)}
                footer={null}
            >
                <Form
                    layout="vertical"
                    initialValues={editingFeature || { icon: '⭐', title: '', description: '' }}
                    onFinish={handleSaveFeature}
                    style={{ marginTop: 16 }}
                    key={editingFeature?.id || 'new'}
                >
                    <Form.Item name="icon" label="Icon (emoji)" rules={[{ required: true }]}>
                        <Input placeholder="🌿" maxLength={4} style={{ width: 100, fontSize: 24, textAlign: 'center' }} />
                    </Form.Item>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                        <Input placeholder="Nguyên Liệu Tự Nhiên" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Chất liệu 100% cotton organic..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        {editingFeature ? 'Cập nhật' : 'Thêm'}
                    </Button>
                </Form>
            </Modal>

            {/* Testimonial Edit Modal */}
            <Modal
                title={editingTestimonial ? 'Sửa đánh giá' : 'Thêm đánh giá'}
                open={testimonialModal}
                onCancel={() => setTestimonialModal(false)}
                footer={null}
                width={640}
            >
                <Form
                    layout="vertical"
                    initialValues={editingTestimonial || { name: '', school: '', content: '', rating: 5, image_url: '', product_image_url: '', product_name: '' }}
                    onFinish={handleSaveTestimonial}
                    style={{ marginTop: 16 }}
                    key={editingTestimonial?.id || 'new-testimonial'}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="name" label="Tên khách hàng" rules={[{ required: true }]}>
                            <Input placeholder="Cô Nguyễn Thị An" />
                        </Form.Item>
                        <Form.Item name="school" label="Trường / Đơn vị" rules={[{ required: true }]}>
                            <Input placeholder="Trường MN Hoa Sen" />
                        </Form.Item>
                    </div>
                    <Form.Item name="rating" label="Đánh giá (sao)">
                        <Rate />
                    </Form.Item>
                    <Form.Item name="content" label="Nội dung đánh giá" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="Trường rất hài lòng về sản phẩm..." />
                    </Form.Item>
                    <Form.Item name="product_name" label="Tên sản phẩm liên quan">
                        <Input placeholder="Bộ Chăn Ga Gối HULA Classic" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="image_url" label="Avatar khách hàng (tùy chọn)">
                            <ImageUploader simple hint="📐 Vuông 200x200px" />
                        </Form.Item>
                        <Form.Item name="product_image_url" label="Hình sản phẩm (tùy chọn)">
                            <ImageUploader simple hint="📐 Ngang 4:3" />
                        </Form.Item>
                    </div>
                    <Button type="primary" htmlType="submit" block>
                        {editingTestimonial ? 'Cập nhật' : 'Thêm'}
                    </Button>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
