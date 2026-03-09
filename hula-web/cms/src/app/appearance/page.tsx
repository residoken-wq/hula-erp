'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Collapse, Drawer, Form, Input, Button, Switch, message, Spin,
    ColorPicker, Radio, Space, Divider, Alert, InputNumber, List, Modal, Row, Col, Slider, Rate
} from 'antd';
import {
    SaveOutlined, EyeOutlined, GlobalOutlined, ToolOutlined, ClockCircleOutlined,
    RightOutlined, PlusOutlined, DeleteOutlined, EditOutlined, DesktopOutlined,
    BgColorsOutlined, SettingOutlined, HomeOutlined, MobileOutlined, LinkOutlined
} from '@ant-design/icons';
import { systemApi } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';

// ============================================
// SECTION DEFINITIONS
// ============================================
interface SectionDef {
    key: string;
    label: string;
    icon: string;
    defaultBg: string;
    defaultText: string;
    settingBgKey: string;
    settingTextKey: string;
}

const SECTIONS: SectionDef[] = [
    { key: 'topbar', label: 'Top Bar', icon: '📌', defaultBg: '#1e3a5f', defaultText: '#FFFFFF', settingBgKey: '', settingTextKey: '' },
    { key: 'hero', label: 'Banner Slider', icon: '🎯', defaultBg: '#23A7D3', defaultText: '#FFFFFF', settingBgKey: 'section_hero_bg', settingTextKey: 'section_hero_text' },
    { key: 'usp', label: 'USP Bar', icon: '✨', defaultBg: '#1e8fb5', defaultText: '#FFFFFF', settingBgKey: 'section_hero_usp_bg', settingTextKey: 'section_hero_usp_text' },
    { key: 'categories', label: 'Danh mục Sản phẩm', icon: '🛍️', defaultBg: '#FFFFFF', defaultText: '#1F2937', settingBgKey: 'section_categories_bg', settingTextKey: 'section_categories_text' },
    { key: 'about', label: 'Giới thiệu HULA', icon: '🏢', defaultBg: '#B9E5FB', defaultText: '#1F2937', settingBgKey: 'section_about_bg', settingTextKey: 'section_about_text' },
    { key: 'journey', label: 'Hành trình HULA', icon: '🚀', defaultBg: '#FFFFFF', defaultText: '#1F2937', settingBgKey: 'section_journey_bg', settingTextKey: 'section_journey_text' },
    { key: 'projects', label: 'Dự án Nổi bật', icon: '🏗️', defaultBg: '#E6E7E8', defaultText: '#1F2937', settingBgKey: 'section_projects_bg', settingTextKey: 'section_projects_text' },
    { key: 'partners', label: 'Đối tác', icon: '🤝', defaultBg: '#FFFFFF', defaultText: '#1F2937', settingBgKey: 'section_partners_bg', settingTextKey: 'section_partners_text' },
    { key: 'testimonials', label: 'Feedback Khách hàng', icon: '💬', defaultBg: '#B9E5FB', defaultText: '#1F2937', settingBgKey: 'section_testimonials_bg', settingTextKey: 'section_testimonials_text' },
    { key: 'blog', label: 'Blog Tư vấn', icon: '📰', defaultBg: '#FFFFFF', defaultText: '#1F2937', settingBgKey: 'section_blog_bg', settingTextKey: 'section_blog_text' },
];

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
    image_url: string;
    slug: string;
}

interface FooterLink {
    id: string;
    label: string;
    url: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AppearancePage() {
    const [settingsForm] = Form.useForm();
    const [homeForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [siteMode, setSiteMode] = useState('live');
    const [modeSaving, setModeSaving] = useState(false);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Features / WhyChoose state
    const [features, setFeatures] = useState<Feature[]>([]);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [featureModal, setFeatureModal] = useState(false);

    // Content arrays
    const [uspItems, setUspItems] = useState<UspItem[]>([]);
    const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
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

    // Preview refs & state
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewScale, setPreviewScale] = useState(1);

    // Dynamic scale for desktop preview
    useEffect(() => {
        if (!previewContainerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                if (previewMode === 'desktop') {
                    // Caculate scale to fit 1440px desktop width into container
                    setPreviewScale(width / 1440);
                } else {
                    setPreviewScale(1);
                }
            }
        });

        observer.observe(previewContainerRef.current);
        return () => observer.disconnect();
    }, [previewMode]);

    // ============================================
    // DATA LOADING
    // ============================================
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // 1. Load site mode
            try {
                const modeRes = await systemApi.getConfig('SITE_MODE');
                if (modeRes.data?.value) setSiteMode(modeRes.data.value);
            } catch { }

            // 2. Load settings (general + colors)
            const settingsKeys = [
                'site_name', 'site_description', 'logo_url', 'contact_phone', 'contact_email', 'contact_address',
                'facebook_url', 'zalo_url', 'google_maps_url', 'facebook_page_url',
                'section_hero_bg', 'section_hero_usp_bg', 'section_categories_bg', 'section_about_bg',
                'section_journey_bg', 'section_projects_bg', 'section_partners_bg', 'section_testimonials_bg', 'section_blog_bg',
                'section_hero_text', 'section_hero_usp_text', 'section_categories_text', 'section_about_text',
                'section_journey_text', 'section_projects_text', 'section_partners_text', 'section_testimonials_text', 'section_blog_text',
            ];
            const settingsValues: Record<string, string> = {};
            for (const key of settingsKeys) {
                try {
                    const res = await systemApi.getConfig(key);
                    if (res.data?.value) settingsValues[key] = res.data.value;
                } catch { }
            }
            if (Object.keys(settingsValues).length > 0) {
                settingsForm.setFieldsValue(settingsValues);
            }

            // 3. Load home config
            const homeRes = await systemApi.getHomeConfig();
            if (homeRes.data) {
                const data = { ...homeRes.data };
                if (!data.hero_images?.length && data.hero_image) {
                    data.hero_images = [data.hero_image];
                }
                homeForm.setFieldsValue(data);
                if (homeRes.data.features?.length) setFeatures(homeRes.data.features);
                if (homeRes.data.why_choose_reasons?.length) setFeatures(homeRes.data.why_choose_reasons);
                if (homeRes.data.usp_items?.length) setUspItems(homeRes.data.usp_items);
                if (homeRes.data.why_choose_guarantees?.length) setGuarantees(homeRes.data.why_choose_guarantees);
                if (homeRes.data.categories?.length) setCategories(homeRes.data.categories);
                if (homeRes.data.milestones?.length) setMilestones(homeRes.data.milestones);
                if (homeRes.data.partners?.length) setPartners(homeRes.data.partners);
                if (homeRes.data.testimonials?.length) setTestimonials(homeRes.data.testimonials);
                if (homeRes.data.featured_projects?.length) setFeaturedProjects(homeRes.data.featured_projects);
                if (homeRes.data.footer_quick_links?.length) setFooterQuickLinks(homeRes.data.footer_quick_links);
                if (homeRes.data.footer_product_links?.length) setFooterProductLinks(homeRes.data.footer_product_links);
            }
        } catch (error) {
            console.error('Failed to load:', error);
            message.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SAVING
    // ============================================
    const handleSaveAll = async () => {
        try {
            setSaving(true);

            // Save settings
            const settingsValues = settingsForm.getFieldsValue();
            const settingsKeys = [
                'site_name', 'site_description', 'logo_url', 'favicon_url', 'contact_phone', 'contact_email', 'contact_address',
                'facebook_url', 'zalo_url', 'google_maps_url', 'facebook_page_url',
                'section_hero_bg', 'section_hero_usp_bg', 'section_categories_bg', 'section_about_bg',
                'section_journey_bg', 'section_projects_bg', 'section_partners_bg', 'section_testimonials_bg', 'section_blog_bg',
                'section_hero_text', 'section_hero_usp_text', 'section_categories_text', 'section_about_text',
                'section_journey_text', 'section_projects_text', 'section_partners_text', 'section_testimonials_text', 'section_blog_text',
            ];
            for (const key of settingsKeys) {
                if (settingsValues[key] !== undefined) {
                    await systemApi.setConfig(key, settingsValues[key] || '', `Website ${key}`);
                }
            }

            // Save home config
            const homeValues = homeForm.getFieldsValue();
            await systemApi.saveHomeConfig({
                ...homeValues,
                features,
                why_choose_reasons: features,
                usp_items: uspItems,
                why_choose_guarantees: guarantees,
                categories,
                milestones,
                partners,
                testimonials,
                featured_projects: featuredProjects,
                footer_quick_links: footerQuickLinks,
                footer_product_links: footerProductLinks,
            });

            message.success('✅ Đã lưu tất cả thay đổi!');

            // Refresh preview
            if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
            }
        } catch (error) {
            console.error('Save error:', error);
            message.error('Có lỗi xảy ra khi lưu');
        } finally {
            setSaving(false);
        }
    };

    const handleModeChange = async (mode: string) => {
        setModeSaving(true);
        try {
            await systemApi.setConfig('SITE_MODE', mode, 'Website display mode');
            setSiteMode(mode);
            message.success(`Đã chuyển sang chế độ: ${mode === 'live' ? 'Website hoạt động' : mode === 'coming-soon' ? 'Coming Soon' : 'Bảo trì'}`);
        } catch {
            message.error('Không thể lưu chế độ website');
        } finally {
            setModeSaving(false);
        }
    };

    // ============================================
    // FEATURES CRUD
    // ============================================
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
    // SECTION DRAWER
    // ============================================
    const openSectionDrawer = (sectionKey: string) => {
        setActiveSection(sectionKey);
        setDrawerOpen(true);
    };

    const renderSectionEditor = () => {
        if (!activeSection) return null;
        const section = SECTIONS.find(s => s.key === activeSection);
        if (!section) return null;

        switch (activeSection) {
            case 'topbar':
                return (
                    <Form form={homeForm} layout="vertical">
                        <Form.Item name="topbar_enabled" label="Hiển thị Topbar" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="topbar_left_text" label="Text bên trái (ngang logo)">
                            <Input placeholder="📞 Hotline: 0909 123 456" />
                        </Form.Item>
                        <Form.Item name="topbar_right_text" label="Text chạy (marquee)">
                            <Input placeholder="🎉 Miễn phí vận chuyển..." />
                        </Form.Item>
                        <Form.Item name="topbar_right_url" label="URL liên kết">
                            <Input placeholder="/san-pham hoặc https://..." />
                        </Form.Item>
                        <Form.Item name="topbar_speed" label="Tốc độ chạy chữ (giây/vòng)">
                            <InputNumber min={5} max={60} style={{ width: '100%' }} placeholder="20" />
                        </Form.Item>
                    </Form>
                );

            case 'hero':
                return (
                    <>
                        <Form form={settingsForm} layout="vertical">
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                {section.settingBgKey && (
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🎨 Màu nền</div>
                                        <Form.Item name={section.settingBgKey} noStyle
                                            getValueFromEvent={(c: any) => c?.toHexString?.() || c}
                                            getValueProps={(v: any) => ({ value: v || section.defaultBg })}
                                        >
                                            <ColorPicker size="small" showText />
                                        </Form.Item>
                                    </div>
                                )}
                                {section.settingTextKey && (
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>✏️ Màu chữ</div>
                                        <Form.Item name={section.settingTextKey} noStyle
                                            getValueFromEvent={(c: any) => c?.toHexString?.() || c}
                                            getValueProps={(v: any) => ({ value: v || section.defaultText })}
                                        >
                                            <ColorPicker size="small" showText />
                                        </Form.Item>
                                    </div>
                                )}
                            </div>
                        </Form>
                        <Form form={homeForm} layout="vertical">
                            <Form.Item name="hero_title_1" label="Tiêu đề dòng 1">
                                <Input placeholder="Giấc Ngủ Ngon" />
                            </Form.Item>
                            <Form.Item name="hero_title_2" label="Tiêu đề dòng 2 (highlight)">
                                <Input placeholder="Cho Bé Yêu" />
                            </Form.Item>
                            <Form.Item name="hero_description" label="Mô tả">
                                <Input.TextArea rows={2} placeholder="Mô tả ngắn..." />
                            </Form.Item>
                            <Form.Item name="hero_button_1" label="Nút CTA chính">
                                <Input placeholder="Xem Sản Phẩm" />
                            </Form.Item>
                            <Form.Item name="hero_button_2" label="Nút CTA phụ">
                            </Form.Item>
                            <Form.Item name="hero_mask_opacity" label="Độ mờ lớp phủ màu đen (0% - 100%)"
                                tooltip="Làm tối hình nền để text dễ đọc hơn. 0 là không che, 100 là đen hoàn toàn."
                            >
                                <Slider min={0} max={100} marks={{ 0: '0%', 40: '40%', 100: '100%' }} />
                            </Form.Item>
                            <Form.List name="hero_images">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map((field, index) => (
                                            <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <strong style={{ fontSize: 13 }}>Slider {index + 1}</strong>
                                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                                </div>
                                                <Form.Item {...field} style={{ marginBottom: 0 }}>
                                                    <ImageUploader hint="📐 1920x800px" />
                                                </Form.Item>
                                            </div>
                                        ))}
                                        {fields.length < 5 && (
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                                                Thêm hình ({fields.length}/5)
                                            </Button>
                                        )}
                                    </>
                                )}
                            </Form.List>
                        </Form>
                    </>
                );

            case 'usp':
                return (
                    <>
                        <Form form={settingsForm} layout="vertical">
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🎨 Màu nền</div>
                                    <Form.Item name="section_hero_usp_bg" noStyle getValueFromEvent={(c: any) => c?.toHexString?.() || c} getValueProps={(v: any) => ({ value: v || '#1e8fb5' })}><ColorPicker size="small" showText /></Form.Item>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>✏️ Màu chữ</div>
                                    <Form.Item name="section_hero_usp_text" noStyle getValueFromEvent={(c: any) => c?.toHexString?.() || c} getValueProps={(v: any) => ({ value: v || '#FFFFFF' })}><ColorPicker size="small" showText /></Form.Item>
                                </div>
                            </div>
                        </Form>
                        <Divider orientation="left">Nội dung USP</Divider>
                        {uspItems.map((item: UspItem, idx: number) => (
                            <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <Input value={item.icon} onChange={(e: any) => setUspItems(uspItems.map((u: UspItem, i: number) => i === idx ? { ...u, icon: e.target.value } : u))} style={{ width: 60, textAlign: 'center', fontSize: 18 }} />
                                <Input value={item.text} onChange={(e: any) => setUspItems(uspItems.map((u: UspItem, i: number) => i === idx ? { ...u, text: e.target.value } : u))} placeholder="Free tư vấn" style={{ flex: 1 }} />
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setUspItems(uspItems.filter((_: UspItem, i: number) => i !== idx))} />
                            </div>
                        ))}
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setUspItems([...uspItems, { id: Date.now().toString(), icon: '⭐', text: '' }])}>Thêm mục</Button>
                    </>
                );

            case 'categories':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Divider orientation="left">Danh mục</Divider>
                        {categories.map((cat: CategoryItem, idx: number) => (
                            <div key={cat.id} style={{ marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <strong>Danh mục {idx + 1}</strong>
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setCategories(categories.filter((_: CategoryItem, i: number) => i !== idx))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 8 }}>
                                    <Input value={cat.icon} onChange={(e: any) => setCategories(categories.map((c: CategoryItem, i: number) => i === idx ? { ...c, icon: e.target.value } : c))} style={{ textAlign: 'center', fontSize: 18 }} />
                                    <Input value={cat.title} onChange={(e: any) => setCategories(categories.map((c: CategoryItem, i: number) => i === idx ? { ...c, title: e.target.value } : c))} placeholder="Tên danh mục" />
                                    <Input value={cat.slug} onChange={(e: any) => setCategories(categories.map((c: CategoryItem, i: number) => i === idx ? { ...c, slug: e.target.value } : c))} placeholder="slug" addonBefore="/" />
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <ImageUploader simple value={cat.image_url} onChange={(val: any) => setCategories(categories.map((c: CategoryItem, i: number) => i === idx ? { ...c, image_url: typeof val === 'string' ? val : val?.url || '' } : c))} hint="Hình ảnh" />
                                </div>
                            </div>
                        ))}
                        <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => setCategories([...categories, { id: Date.now().toString(), icon: '📦', title: '', slug: '', image_url: '' }])}>Thêm danh mục</Button>
                    </>
                );

            case 'about':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Form form={homeForm} layout="vertical">
                            <Form.Item name="about_title" label="Tiêu đề">
                                <Input placeholder="Hơn 10 Năm Đồng Hành..." />
                            </Form.Item>
                            <Form.Item name="about_description" label="Mô tả">
                                <Input.TextArea rows={4} placeholder="HULA tự hào..." />
                            </Form.Item>
                            <Divider>Video giới thiệu</Divider>
                            <Form.Item name="video_youtube_url" label="YouTube URL">
                                <Input placeholder="https://www.youtube.com/watch?v=..." prefix={<span style={{ color: '#ff0000' }}>▶</span>} />
                            </Form.Item>
                        </Form>
                    </>
                );

            case 'journey':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Divider orientation="left">Điểm nổi bật (Tại sao chọn HULA)</Divider>
                        {features.map((f: Feature, idx: number) => (
                            <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <Input value={f.icon} onChange={(e: any) => setFeatures(features.map((x: Feature, i: number) => i === idx ? { ...x, icon: e.target.value } : x))} style={{ width: 50, textAlign: 'center', fontSize: 16 }} />
                                <Input value={f.title} onChange={(e: any) => setFeatures(features.map((x: Feature, i: number) => i === idx ? { ...x, title: e.target.value } : x))} placeholder="Tiêu đề" style={{ flex: 1 }} />
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setFeatures(features.filter((_: Feature, i: number) => i !== idx))} />
                            </div>
                        ))}
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setFeatures([...features, { id: Date.now().toString(), icon: '✨', title: '', description: '' }])} style={{ marginBottom: 16 }}>Thêm</Button>

                        <Divider orientation="left">Cam kết mua hàng</Divider>
                        {guarantees.map((g: Guarantee, idx: number) => (
                            <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <Input value={g.icon} onChange={(e: any) => setGuarantees(guarantees.map((x: Guarantee, i: number) => i === idx ? { ...x, icon: e.target.value } : x))} style={{ width: 50, textAlign: 'center', fontSize: 16 }} />
                                <Input value={g.title} onChange={(e: any) => setGuarantees(guarantees.map((x: Guarantee, i: number) => i === idx ? { ...x, title: e.target.value } : x))} placeholder="Tiêu đề" style={{ flex: 1 }} />
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setGuarantees(guarantees.filter((_: Guarantee, i: number) => i !== idx))} />
                            </div>
                        ))}
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setGuarantees([...guarantees, { id: Date.now().toString(), icon: '🛡️', title: '', description: '' }])}>Thêm</Button>

                        <Divider orientation="left">Cột mốc hành trình</Divider>
                        {milestones.map((m: Milestone, idx: number) => (
                            <div key={m.id} style={{ marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <strong>Mốc {idx + 1}</strong>
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setMilestones(milestones.filter((_: Milestone, i: number) => i !== idx))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8 }}>
                                    <Input value={m.icon} onChange={(e: any) => setMilestones(milestones.map((x: Milestone, i: number) => i === idx ? { ...x, icon: e.target.value } : x))} style={{ textAlign: 'center', fontSize: 18 }} />
                                    <Input value={m.title} onChange={(e: any) => setMilestones(milestones.map((x: Milestone, i: number) => i === idx ? { ...x, title: e.target.value } : x))} placeholder="Tiêu đề" />
                                </div>
                                <Input.TextArea value={m.description} onChange={(e: any) => setMilestones(milestones.map((x: Milestone, i: number) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="Mô tả" rows={2} style={{ marginTop: 8 }} />
                                <div style={{ marginTop: 8 }}>
                                    <ImageUploader simple value={m.image_url} onChange={(val: any) => setMilestones(milestones.map((x: Milestone, i: number) => i === idx ? { ...x, image_url: typeof val === 'string' ? val : val?.url || '' } : x))} hint="Hình ảnh" />
                                </div>
                            </div>
                        ))}
                        <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => setMilestones([...milestones, { id: Date.now().toString(), icon: '🎯', title: '', description: '', image_url: '' }])}>Thêm cột mốc</Button>
                    </>
                );

            case 'projects':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Divider orientation="left">Dự án nổi bật (liên kết: /du-an)</Divider>
                        {featuredProjects.map((p: FeaturedProject, idx: number) => (
                            <div key={p.id} style={{ marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <strong>Dự án {idx + 1}</strong>
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setFeaturedProjects(featuredProjects.filter((_: FeaturedProject, i: number) => i !== idx))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <Input value={p.title} onChange={(e: any) => setFeaturedProjects(featuredProjects.map((x: FeaturedProject, i: number) => i === idx ? { ...x, title: e.target.value } : x))} placeholder="Tên dự án" />
                                    <Input value={p.school_name} onChange={(e: any) => setFeaturedProjects(featuredProjects.map((x: FeaturedProject, i: number) => i === idx ? { ...x, school_name: e.target.value } : x))} placeholder="Tên trường" />
                                </div>
                                <Input value={p.slug} onChange={(e: any) => setFeaturedProjects(featuredProjects.map((x: FeaturedProject, i: number) => i === idx ? { ...x, slug: e.target.value } : x))} placeholder="slug" addonBefore="/du-an/" style={{ marginTop: 8 }} />
                                <div style={{ marginTop: 8 }}>
                                    <ImageUploader simple value={p.image_url} onChange={(val: any) => setFeaturedProjects(featuredProjects.map((x: FeaturedProject, i: number) => i === idx ? { ...x, image_url: typeof val === 'string' ? val : val?.url || '' } : x))} hint="Hình 16:10" />
                                </div>
                            </div>
                        ))}
                        <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => setFeaturedProjects([...featuredProjects, { id: Date.now().toString(), title: '', school_name: '', image_url: '', slug: '' }])}>Thêm dự án ({featuredProjects.length}/12)</Button>
                    </>
                );

            case 'partners':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Divider orientation="left">Đối tác</Divider>
                        {partners.map((p: Partner, idx: number) => (
                            <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <Input value={p.name} onChange={(e: any) => setPartners(partners.map((x: Partner, i: number) => i === idx ? { ...x, name: e.target.value } : x))} placeholder="Tên đối tác" style={{ flex: 1 }} />
                                <div style={{ width: 120 }}>
                                    <ImageUploader simple value={p.logo_url} onChange={(val: any) => setPartners(partners.map((x: Partner, i: number) => i === idx ? { ...x, logo_url: typeof val === 'string' ? val : val?.url || '' } : x))} hint="Logo" />
                                </div>
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setPartners(partners.filter((_: Partner, i: number) => i !== idx))} />
                            </div>
                        ))}
                        <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => setPartners([...partners, { id: Date.now().toString(), name: '', logo_url: '' }])}>Thêm đối tác</Button>
                    </>
                );

            case 'testimonials':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Divider orientation="left">Đánh giá khách hàng</Divider>
                        {testimonials.map((t: Testimonial, idx: number) => (
                            <div key={t.id} style={{ marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <strong>{t.name || `KH ${idx + 1}`}</strong>
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setTestimonials(testimonials.filter((_: Testimonial, i: number) => i !== idx))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <Input value={t.name} onChange={(e: any) => setTestimonials(testimonials.map((x: Testimonial, i: number) => i === idx ? { ...x, name: e.target.value } : x))} placeholder="Tên" />
                                    <Input value={t.school} onChange={(e: any) => setTestimonials(testimonials.map((x: Testimonial, i: number) => i === idx ? { ...x, school: e.target.value } : x))} placeholder="Trường" />
                                </div>
                                <Input.TextArea value={t.content} onChange={(e: any) => setTestimonials(testimonials.map((x: Testimonial, i: number) => i === idx ? { ...x, content: e.target.value } : x))} placeholder="Nội dung đánh giá" rows={2} style={{ marginTop: 8 }} />
                                <div style={{ marginTop: 8 }}><Rate value={t.rating || 5} onChange={(v: number) => setTestimonials(testimonials.map((x: Testimonial, i: number) => i === idx ? { ...x, rating: v } : x))} /></div>
                            </div>
                        ))}
                        <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => setTestimonials([...testimonials, { id: Date.now().toString(), name: '', school: '', content: '', rating: 5, image_url: '', product_image_url: '', product_name: '' }])}>Thêm đánh giá</Button>
                    </>
                );

            case 'blog':
                return (
                    <>
                        {renderColorPicker(section)}
                        <Alert message="Blog lấy dữ liệu tự động từ hệ thống. Bạn có thể điều chỉnh màu sắc ở trên." type="info" showIcon style={{ marginTop: 8 }} />
                    </>
                );

            default:
                return renderColorPicker(section);
        }
    };

    // Helper: render color picker for a section
    const renderColorPicker = (section: SectionDef) => {
        if (!section.settingBgKey) return null;
        return (
            <Form form={settingsForm} layout="vertical">
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🎨 Màu nền</div>
                        <Form.Item name={section.settingBgKey} noStyle getValueFromEvent={(c: any) => c?.toHexString?.() || c} getValueProps={(v: any) => ({ value: v || section.defaultBg })}><ColorPicker size="small" showText /></Form.Item>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>✏️ Màu chữ</div>
                        <Form.Item name={section.settingTextKey} noStyle getValueFromEvent={(c: any) => c?.toHexString?.() || c} getValueProps={(v: any) => ({ value: v || section.defaultText })}><ColorPicker size="small" showText /></Form.Item>
                    </div>
                </div>
            </Form>
        );
    };

    // ============================================
    // COLLAPSE PANELS
    // ============================================
    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <Spin size="large" tip="Đang tải cấu hình..." />
                </div>
            </AdminLayout>
        );
    }

    const collapseItems = [
        {
            key: 'general',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15 }}>
                    <SettingOutlined style={{ color: '#667eea' }} />
                    1. Thiết lập Tổng quát
                </div>
            ),
            children: (
                <Form form={settingsForm} layout="vertical">
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item name="site_name" label="Tên website">
                                <Input placeholder="Nệm Mầm Non HULA" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="logo_url" label="Logo">
                                <ImageUploader simple hint="📐 200x56px" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="favicon_url" label="Favicon">
                                <ImageUploader simple hint="📐 32x32px (ICO, PNG)" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="site_description" label="Mô tả website">
                        <Input.TextArea rows={2} placeholder="Mô tả ngắn về website..." />
                    </Form.Item>
                    <Divider>Thông tin liên hệ</Divider>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_phone" label="Số điện thoại">
                                <Input placeholder="0123 456 789" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_email" label="Email">
                                <Input placeholder="info@example.com" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_address" label="Địa chỉ">
                                <Input placeholder="Địa chỉ công ty..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider>Mạng xã hội & Tích hợp</Divider>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="facebook_url" label="Facebook URL">
                                <Input placeholder="https://facebook.com/..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="zalo_url" label="Zalo URL">
                                <Input placeholder="https://zalo.me/..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="facebook_page_url" label="Facebook Page URL (Embed)">
                                <Input placeholder="https://www.facebook.com/TenPage" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="google_maps_url" label="Google Maps Embed URL">
                                <Input placeholder="https://www.google.com/maps/embed?pb=..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Chế độ Website</Divider>
                    <Radio.Group value={siteMode} onChange={(e) => handleModeChange(e.target.value)} disabled={modeSaving}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {[
                                { value: 'live', label: 'Website Hoạt Động', desc: 'Hiển thị đầy đủ nội dung', color: '#16a34a', icon: <GlobalOutlined /> },
                                { value: 'coming-soon', label: 'Coming Soon', desc: 'Hiển thị trang countdown', color: '#2563eb', icon: <ClockCircleOutlined /> },
                                { value: 'maintenance', label: 'Bảo Trì', desc: 'Hiển thị trang bảo trì', color: '#d97706', icon: <ToolOutlined /> },
                            ].map(mode => (
                                <label key={mode.value} style={{
                                    display: 'flex', alignItems: 'center', width: '100%',
                                    padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                                    border: siteMode === mode.value ? `2px solid ${mode.color}` : '1px solid #d9d9d9',
                                    background: siteMode === mode.value ? `${mode.color}08` : '#fff',
                                }}>
                                    <Radio value={mode.value} style={{ marginRight: 8 }} />
                                    <span style={{ color: mode.color, marginRight: 8, fontSize: 18 }}>{mode.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{mode.label}</div>
                                        <div style={{ fontSize: 11, color: '#666' }}>{mode.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </Space>
                    </Radio.Group>
                </Form>
            ),
        },
        {
            key: 'header',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15 }}>
                    <DesktopOutlined style={{ color: '#667eea' }} />
                    2. Header & Navigation
                </div>
            ),
            children: (
                <div style={{ padding: '8px 0' }}>
                    <Alert message="Header sử dụng cấu hình từ Thiết lập Tổng quát (Logo, Site Name). Navigation menu hiện tại được cấu hình cố định trong code." type="info" showIcon />
                </div>
            ),
        },
        {
            key: 'homepage',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15 }}>
                    <HomeOutlined style={{ color: '#667eea' }} />
                    3. Trang chủ
                </div>
            ),
            children: (
                <div>
                    <Row gutter={[16, 16]}>
                        {/* Preview */}
                        <Col xs={0} lg={10}>
                            <div style={{
                                border: '2px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
                                background: '#f8fafc', height: 600, display: 'flex', flexDirection: 'column'
                            }}>
                                {/* Preview Header */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white', padding: '8px 12px', fontSize: 13, fontWeight: 600,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <EyeOutlined /> Live Preview
                                    </div>
                                    <Radio.Group
                                        size="small"
                                        value={previewMode}
                                        onChange={(e) => setPreviewMode(e.target.value)}
                                        optionType="button"
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="desktop" style={{ padding: '0 8px' }}><DesktopOutlined /></Radio.Button>
                                        <Radio.Button value="mobile" style={{ padding: '0 8px' }}><MobileOutlined /></Radio.Button>
                                    </Radio.Group>
                                </div>

                                {/* Iframe Container */}
                                <div
                                    ref={previewContainerRef}
                                    style={{
                                        flex: 1,
                                        background: '#e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'flex-start',
                                        padding: previewMode === 'mobile' ? '16px 0' : 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{
                                        width: previewMode === 'desktop' ? '1440px' : '375px',
                                        height: previewMode === 'desktop' ? '810px' : 'calc(100% - 16px)',
                                        background: 'white',
                                        transition: 'all 0.3s ease',
                                        borderRadius: previewMode === 'desktop' ? 0 : 24,
                                        overflow: 'hidden',
                                        boxShadow: previewMode === 'mobile' ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        border: previewMode === 'mobile' ? '8px solid #333' : 'none',
                                        transform: previewMode === 'desktop' ? `scale(${previewScale})` : 'none',
                                        transformOrigin: 'top center',
                                    }}>
                                        <iframe
                                            ref={iframeRef}
                                            src={process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://beta.nemmamnon.com'}
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                            title="Website Preview"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* Section List */}
                        <Col xs={24} lg={14}>
                            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                                Click vào section để chỉnh sửa nội dung và màu sắc
                            </div>
                            {SECTIONS.map((section, index) => (
                                <div
                                    key={section.key}
                                    onClick={() => openSectionDrawer(section.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 16px', marginBottom: 2,
                                        background: activeSection === section.key ? '#e0e7ff' : index % 2 === 0 ? '#f0f7ff' : '#e8f4fd',
                                        borderRadius: 8, cursor: 'pointer',
                                        border: activeSection === section.key ? '2px solid #667eea' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = '#dbeafe';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = activeSection === section.key ? '#e0e7ff' : index % 2 === 0 ? '#f0f7ff' : '#e8f4fd';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {index + 1}
                                        </span>
                                        <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{section.label}</span>
                                    </div>
                                    <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                                </div>
                            ))}
                        </Col>
                    </Row>
                </div>
            ),
        },
        {
            key: 'footer',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15 }}>
                    <BgColorsOutlined style={{ color: '#667eea' }} />
                    4. Footer
                </div>
            ),
            children: (
                <div>
                    <Form form={homeForm} layout="vertical">
                        <Form.Item name="footer_slogan" label="Slogan / Mô tả công ty" extra="Hiển thị dưới logo">
                            <Input.TextArea rows={2} placeholder="Hơn 10 năm đồng hành cùng giấc ngủ học đường..." />
                        </Form.Item>
                        <Form.Item name="footer_copyright" label="Dòng Copyright">
                            <Input placeholder="© 2026 HULA - Giải pháp nệm trường học toàn diện." />
                        </Form.Item>
                    </Form>
                    <Divider orientation="left">Menu nhanh</Divider>
                    {footerQuickLinks.map((link: FooterLink, idx: number) => (
                        <div key={link.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <Input value={link.label} onChange={(e: any) => setFooterQuickLinks(footerQuickLinks.map((l: FooterLink, i: number) => i === idx ? { ...l, label: e.target.value } : l))} placeholder="Label" style={{ flex: 1 }} />
                            <Input value={link.url} onChange={(e: any) => setFooterQuickLinks(footerQuickLinks.map((l: FooterLink, i: number) => i === idx ? { ...l, url: e.target.value } : l))} placeholder="/url" style={{ flex: 1 }} addonBefore={<LinkOutlined />} />
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setFooterQuickLinks(footerQuickLinks.filter((_: FooterLink, i: number) => i !== idx))} />
                        </div>
                    ))}
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setFooterQuickLinks([...footerQuickLinks, { id: Date.now().toString(), label: '', url: '' }])} style={{ marginBottom: 16 }}>Thêm</Button>
                    <Divider orientation="left">Liên kết phụ</Divider>
                    {footerProductLinks.map((link: FooterLink, idx: number) => (
                        <div key={link.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <Input value={link.label} onChange={(e: any) => setFooterProductLinks(footerProductLinks.map((l: FooterLink, i: number) => i === idx ? { ...l, label: e.target.value } : l))} placeholder="Label" style={{ flex: 1 }} />
                            <Input value={link.url} onChange={(e: any) => setFooterProductLinks(footerProductLinks.map((l: FooterLink, i: number) => i === idx ? { ...l, url: e.target.value } : l))} placeholder="/url" style={{ flex: 1 }} addonBefore={<LinkOutlined />} />
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setFooterProductLinks(footerProductLinks.filter((_: FooterLink, i: number) => i !== idx))} />
                        </div>
                    ))}
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setFooterProductLinks([...footerProductLinks, { id: Date.now().toString(), label: '', url: '' }])}>Thêm</Button>
                    <Alert message="Thông tin liên hệ, Mạng xã hội, Google Maps quản lý ở panel Thiết lập Tổng quát." type="info" showIcon style={{ marginTop: 16 }} />
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            {/* Header bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 22 }}>🎨 Giao diện Website</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Quản lý giao diện trang chủ theo kiểu trực quan</p>
                </div>
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => window.open(process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://beta.nemmamnon.com', '_blank')}>
                        Xem website
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll} loading={saving} size="large">
                        Lưu tất cả thay đổi
                    </Button>
                </Space>
            </div>

            {/* Main Collapse */}
            <Collapse
                items={collapseItems}
                defaultActiveKey={['homepage']}
                expandIconPosition="end"
                style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}
                size="large"
            />

            {/* Section Editor Drawer */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{SECTIONS.find(s => s.key === activeSection)?.icon}</span>
                        <span>{SECTIONS.find(s => s.key === activeSection)?.label}</span>
                    </div>
                }
                placement="right"
                onClose={() => { setDrawerOpen(false); setActiveSection(null); }}
                open={drawerOpen}
                width={Math.min(480, typeof window !== 'undefined' ? window.innerWidth : 480)}
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button onClick={() => { setDrawerOpen(false); setActiveSection(null); }}>
                            Đóng
                        </Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll} loading={saving}>
                            Lưu thay đổi
                        </Button>
                    </div>
                }
            >
                {renderSectionEditor()}
            </Drawer>

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

            {/* Mobile sticky save button */}
            <div className="mobile-save-btn" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px',
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
                borderTop: '1px solid #e2e8f0', zIndex: 100,
                display: 'none', // controlled by CSS media query
            }}>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll} loading={saving} block size="large">
                    Lưu tất cả thay đổi
                </Button>
            </div>
        </AdminLayout>
    );
}
