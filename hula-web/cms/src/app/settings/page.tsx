'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Button, Space, message, Divider, Switch, Tabs, Radio, Alert, Spin, ColorPicker, Row, Col, Select } from 'antd';
import { SaveOutlined, GlobalOutlined, ToolOutlined, ClockCircleOutlined, BgColorsOutlined, TagOutlined, PlusOutlined, MinusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { systemApi } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';

export default function SettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [siteMode, setSiteMode] = useState('live');
    const [modeLoading, setModeLoading] = useState(true);
    const [modeSaving, setModeSaving] = useState(false);

    // Load settings from backend on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Load site mode
                const modeRes = await systemApi.getConfig('SITE_MODE');
                if (modeRes.data && modeRes.data.value) {
                    setSiteMode(modeRes.data.value);
                }

                // Load general settings
                const configKeys = [
                    'site_name', 'site_description', 'logo_url', 'contact_phone', 'contact_email', 'contact_address',
                    'facebook_url', 'zalo_url', 'google_maps_url', 'facebook_page_url',
                    'section_hero_bg', 'section_hero_usp_bg', 'section_categories_bg', 'section_about_bg',
                    'section_journey_bg', 'section_projects_bg', 'section_partners_bg', 'section_testimonials_bg', 'section_blog_bg',
                    'section_hero_text', 'section_hero_usp_text', 'section_categories_text', 'section_about_text',
                    'section_journey_text', 'section_projects_text', 'section_partners_text', 'section_testimonials_text', 'section_blog_text',
                    'banner_projects_title', 'banner_projects_desc', 'banner_projects_image',
                    'banner_b2b_title', 'banner_b2b_desc', 'banner_b2b_image',
                    'banner_contact_title', 'banner_contact_desc', 'banner_contact_image',
                    'banner_news_title', 'banner_news_desc', 'banner_news_image',
                    'banner_shop_title', 'banner_shop_desc', 'banner_shop_image',
                    'product_tags_config', 'hidden_pages'
                ];
                const configValues: Record<string, any> = {};

                for (const key of configKeys) {
                    try {
                        const res = await systemApi.getConfig(key);
                        if (res.data && res.data.value) {
                            let val = res.data.value;
                            // HOTFIX: recovery for accidentally saved JSON objects for banner images
                            if (val && val.startsWith('{') && val.includes('"url":')) {
                                try {
                                    const parsed = JSON.parse(val);
                                    if (parsed.url) val = parsed.url;
                                } catch (e) {}
                            } else if (val === '[object Object]') {
                                val = '';
                            }

                            // Special handling for JSON fields
                            if (key === 'product_tags_config' || key === 'hidden_pages') {
                                try {
                                    configValues[key] = JSON.parse(val);
                                } catch (e) {
                                    configValues[key] = [];
                                }
                            } else {
                                configValues[key] = val;
                            }
                        }
                    } catch (e) {
                        // Key doesn't exist yet, use default
                    }
                }

                const defaultValues = {
                    site_name: 'Nệm Mầm Non HULA',
                    site_description: 'Nệm mầm non chất lượng cao, an toàn cho bé',
                    contact_phone: '0123 456 789',
                    contact_email: 'info@nemmamnon.com',
                    contact_address: '123 Đường ABC, Quận XYZ, TP.HCM',
                    facebook: 'https://facebook.com/nemmamnon',
                    meta_title: 'Nệm Mầm Non HULA - Giấc Ngủ Ngon Cho Bé Yêu',
                    meta_description: 'Nệm mầm non HULA chất lượng cao, an toàn cho sức khỏe bé. Nguyên liệu tự nhiên, thiết kế chống khuẩn, bảo hành 12 tháng.',
                    meta_keywords: 'nệm mầm non, nệm trẻ em, HULA, nệm cao cấp',
                };

                if (Object.keys(configValues).length > 0) {
                    form.setFieldsValue({ ...defaultValues, ...configValues });
                } else {
                    form.setFieldsValue(defaultValues);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setModeLoading(false);
            }
        };
        loadSettings();
    }, [form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Save each config field to backend
            const configKeys = [
                'site_name', 'site_description', 'logo_url', 'contact_phone', 'contact_email', 'contact_address',
                'facebook_url', 'zalo_url', 'google_maps_url', 'facebook_page_url',
                'section_hero_bg', 'section_hero_usp_bg', 'section_categories_bg', 'section_about_bg',
                'section_journey_bg', 'section_projects_bg', 'section_partners_bg', 'section_testimonials_bg', 'section_blog_bg',
                'section_hero_text', 'section_hero_usp_text', 'section_categories_text', 'section_about_text',
                'section_journey_text', 'section_projects_text', 'section_partners_text', 'section_testimonials_text', 'section_blog_text',
                'banner_projects_title', 'banner_projects_desc', 'banner_projects_image',
                'banner_b2b_title', 'banner_b2b_desc', 'banner_b2b_image',
                'banner_contact_title', 'banner_contact_desc', 'banner_contact_image',
                'banner_news_title', 'banner_news_desc', 'banner_news_image',
                'banner_shop_title', 'banner_shop_desc', 'banner_shop_image',
                'product_tags_config', 'hidden_pages'
            ];

            for (const key of configKeys) {
                if (values[key] !== undefined) {
                    let valToSave = values[key];
                    if (key === 'product_tags_config' || key === 'hidden_pages') {
                        valToSave = JSON.stringify(valToSave || []);
                    }
                    await systemApi.setConfig(key, valToSave || '', `Website ${key}`);
                }
            }

            message.success('Đã lưu cài đặt thành công!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            message.error('Có lỗi xảy ra khi lưu cài đặt');
        } finally {
            setLoading(false);
        }
    };

    const handleModeChange = async (mode: string) => {
        setModeSaving(true);
        try {
            // Save mode to backend
            await systemApi.setConfig('SITE_MODE', mode, 'Website display mode: live, coming-soon, or maintenance');
            setSiteMode(mode);

            // Try to invalidate website cache (best effort - may fail in some environments)
            try {
                // Use the public website URL
                const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://nemmamnon.com';
                await fetch(`${websiteUrl}/api/revalidate`, {
                    method: 'POST',
                    mode: 'no-cors', // May be cross-origin
                });
            } catch (revalidateError) {
                console.warn('Could not revalidate website cache:', revalidateError);
                // Not critical - cache will expire in 30 seconds anyway
            }

            const modeNames: Record<string, string> = {
                'live': 'Website hoạt động',
                'coming-soon': 'Coming Soon',
                'maintenance': 'Bảo trì'
            };
            message.success(`Đã chuyển sang chế độ: ${modeNames[mode] || mode}. Website sẽ cập nhật trong 30 giây.`);
        } catch (error) {
            console.error('Failed to save site mode:', error);
            message.error('Không thể lưu chế độ website. Vui lòng thử lại.');
        } finally {
            setModeSaving(false);
        }
    };

    const items = [
        {
            key: 'site-mode',
            label: '🌐 Chế độ Website',
            children: (
                <div>
                    <Alert
                        message="Điều khiển trạng thái website"
                        description="Chọn chế độ hiển thị cho khách truy cập. Khi chọn Coming Soon hoặc Bảo trì, khách sẽ thấy trang thông báo thay vì nội dung website."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    {modeLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin tip="Đang tải cấu hình..." />
                        </div>
                    ) : (
                        <Radio.Group
                            value={siteMode}
                            onChange={(e) => handleModeChange(e.target.value)}
                            style={{ width: '100%' }}
                            disabled={modeSaving}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        cursor: modeSaving ? 'not-allowed' : 'pointer',
                                        border: siteMode === 'live' ? '2px solid #16a34a' : '1px solid #d9d9d9',
                                        background: siteMode === 'live' ? '#f0fdf4' : '#fff',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Radio value="live" style={{ marginRight: 12 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            background: siteMode === 'live' ? '#dcfce7' : '#f5f5f5',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <GlobalOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Website Hoạt Động</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>Hiển thị đầy đủ nội dung website cho khách hàng</div>
                                        </div>
                                    </div>
                                </label>

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        cursor: modeSaving ? 'not-allowed' : 'pointer',
                                        border: siteMode === 'coming-soon' ? '2px solid #2563eb' : '1px solid #d9d9d9',
                                        background: siteMode === 'coming-soon' ? '#eff6ff' : '#fff',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Radio value="coming-soon" style={{ marginRight: 12 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            background: siteMode === 'coming-soon' ? '#dbeafe' : '#f5f5f5',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ClockCircleOutlined style={{ fontSize: 20, color: '#2563eb' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Coming Soon</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>Hiển thị trang countdown + đăng ký email</div>
                                        </div>
                                    </div>
                                </label>

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        cursor: modeSaving ? 'not-allowed' : 'pointer',
                                        border: siteMode === 'maintenance' ? '2px solid #d97706' : '1px solid #d9d9d9',
                                        background: siteMode === 'maintenance' ? '#fffbeb' : '#fff',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Radio value="maintenance" style={{ marginRight: 12 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            background: siteMode === 'maintenance' ? '#fef3c7' : '#f5f5f5',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ToolOutlined style={{ fontSize: 20, color: '#d97706' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Bảo Trì</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>Hiển thị trang bảo trì với progress bar</div>
                                        </div>
                                    </div>
                                </label>
                            </Space>
                        </Radio.Group>
                    )}

                    <Divider />

                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                            <strong>💡 Lưu ý:</strong> Thay đổi chế độ sẽ được lưu vào hệ thống. Website sẽ tự động chuyển hướng khách truy cập đến trang tương ứng (cache 5 phút).
                            Xem trang preview:
                        </p>
                        <Space style={{ marginTop: 8 }}>
                            <Button size="small" onClick={() => window.open('https://nemmamnon.com/coming-soon', '_blank')}>
                                Xem Coming Soon
                            </Button>
                            <Button size="small" onClick={() => window.open('https://nemmamnon.com/maintenance', '_blank')}>
                                Xem Bảo Trì
                            </Button>
                        </Space>
                    </div>
                </div>
            ),
        },
        {
            key: 'general',
            label: 'Thông tin chung',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Form.Item name="site_name" label="Tên website">
                        <Input placeholder="Tên website" />
                    </Form.Item>

                    <Form.Item name="logo_url" label="Logo" extra="Logo sẽ tự động scale để vừa với frame header">
                        <ImageUploader simple hint="📐 Khuyến nghị: 200x56px hoặc tỷ lệ tương đương" />
                    </Form.Item>

                    <Form.Item name="site_description" label="Mô tả website">
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn về website..." />
                    </Form.Item>

                    <Divider>Thông tin liên hệ</Divider>

                    <Form.Item name="contact_phone" label="Số điện thoại">
                        <Input placeholder="0123 456 789" />
                    </Form.Item>

                    <Form.Item name="contact_email" label="Email">
                        <Input placeholder="info@example.com" />
                    </Form.Item>

                    <Form.Item name="contact_address" label="Địa chỉ">
                        <Input.TextArea rows={2} placeholder="Địa chỉ công ty..." />
                    </Form.Item>

                    <Divider>Mạng xã hội & Tích hợp</Divider>

                    <Form.Item name="facebook_url" label="Facebook URL">
                        <Input placeholder="https://facebook.com/... (link trang Facebook)" />
                    </Form.Item>

                    <Form.Item name="zalo_url" label="Zalo URL">
                        <Input placeholder="https://zalo.me/... (link Zalo OA)" />
                    </Form.Item>

                    <Form.Item name="facebook_page_url" label="Facebook Page URL (Embed)" extra="URL trang Facebook để nhúng widget ở Footer">
                        <Input placeholder="https://www.facebook.com/TenPage" />
                    </Form.Item>

                    <Form.Item name="google_maps_url" label="Google Maps Embed URL" extra="Copy embed URL từ Google Maps (Share > Embed a map)">
                        <Input placeholder="https://www.google.com/maps/embed?pb=..." />
                    </Form.Item>
                </div>
            ),
        },
        {
            key: 'social',
            label: 'Mạng xã hội',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Form.Item name="facebook" label="Facebook">
                        <Input placeholder="https://facebook.com/..." />
                    </Form.Item>

                    <Form.Item name="instagram" label="Instagram">
                        <Input placeholder="https://instagram.com/..." />
                    </Form.Item>

                    <Form.Item name="tiktok" label="TikTok">
                        <Input placeholder="https://tiktok.com/@..." />
                    </Form.Item>

                    <Form.Item name="youtube" label="YouTube">
                        <Input placeholder="https://youtube.com/..." />
                    </Form.Item>
                </div>
            ),
        },
        {
            key: 'seo',
            label: 'SEO',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Form.Item name="meta_title" label="Meta Title">
                        <Input placeholder="Tiêu đề SEO mặc định" />
                    </Form.Item>

                    <Form.Item name="meta_description" label="Meta Description">
                        <Input.TextArea rows={3} placeholder="Mô tả SEO mặc định..." />
                    </Form.Item>

                    <Form.Item name="meta_keywords" label="Meta Keywords">
                        <Input placeholder="keyword1, keyword2, ..." />
                    </Form.Item>

                    <Form.Item name="google_analytics" label="Google Analytics ID">
                        <Input placeholder="G-XXXXXXXXXX" />
                    </Form.Item>
                </div>
            ),
        },
        {
            key: 'section-colors',
            label: '🎨 Màu Sections',
            children: (
                <div>
                    <Alert
                        message="Quản lý màu nền & màu chữ các section trang chủ"
                        description="Chọn màu nền và màu chữ cho từng section. Để trống để sử dụng màu mặc định. Nhấn 'Lưu cài đặt' sau khi thay đổi."
                        type="info"
                        showIcon
                        icon={<BgColorsOutlined />}
                        style={{ marginBottom: 24 }}
                    />
                    <Row gutter={[24, 16]}>
                        {[
                            { key: 'section_hero', label: '§1 Hero Banner', defaultBg: '#23A7D3', defaultText: '#FFFFFF' },
                            { key: 'section_hero_usp', label: '§1 USP Bar', defaultBg: '#1e8fb5', defaultText: '#FFFFFF' },
                            { key: 'section_categories', label: '§2 Danh mục Sản phẩm', defaultBg: '#FFFFFF', defaultText: '#1F2937' },
                            { key: 'section_about', label: '§3 Giới thiệu HULA', defaultBg: '#B9E5FB', defaultText: '#1F2937' },
                            { key: 'section_journey', label: '§4 Hành trình HULA', defaultBg: '#FFFFFF', defaultText: '#1F2937' },
                            { key: 'section_projects', label: '§5 Dự án Nổi bật', defaultBg: '#E6E7E8', defaultText: '#1F2937' },
                            { key: 'section_partners', label: '§6 Đối tác', defaultBg: '#FFFFFF', defaultText: '#1F2937' },
                            { key: 'section_testimonials', label: '§7 Feedback Khách hàng', defaultBg: '#B9E5FB', defaultText: '#1F2937' },
                            { key: 'section_blog', label: '§8 Blog Tư vấn', defaultBg: '#FFFFFF', defaultText: '#1F2937' },
                        ].map((item) => (
                            <Col xs={24} sm={12} key={item.key}>
                                <div style={{
                                    padding: '12px 16px',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 8,
                                    background: '#fafafa',
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{item.label}</div>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        {/* Background color */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>🎨 Nền</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Form.Item
                                                    name={`${item.key}_bg`}
                                                    noStyle
                                                    getValueFromEvent={(color: any) => color.toHexString()}
                                                    getValueProps={(value: any) => ({ value: value || item.defaultBg })}
                                                >
                                                    <ColorPicker size="small" showText />
                                                </Form.Item>
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    style={{ padding: 0, fontSize: 11 }}
                                                    onClick={() => form.setFieldsValue({ [`${item.key}_bg`]: '' })}
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Text color */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>✏️ Chữ</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Form.Item
                                                    name={`${item.key}_text`}
                                                    noStyle
                                                    getValueFromEvent={(color: any) => color.toHexString()}
                                                    getValueProps={(value: any) => ({ value: value || item.defaultText })}
                                                >
                                                    <ColorPicker size="small" showText />
                                                </Form.Item>
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    style={{ padding: 0, fontSize: 11 }}
                                                    onClick={() => form.setFieldsValue({ [`${item.key}_text`]: '' })}
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            ),
        },
        {
            key: 'page-banners',
            label: '🖼️ Banners Trang',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Alert
                        message="Quản lý Banner các trang con"
                        description="Cấu hình Hình nền, Tiêu đề và Mô tả cho Hero banner của các trang: Dự án, Đặt hàng B2B, Liên hệ, Tin tức. (Trang Về Hula được cấu hình ở menu riêng bên trái)."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Divider orientation="left">Trang Hula Shop (/san-pham)</Divider>
                    <Form.Item name="banner_shop_title" label="Tiêu đề banner">
                        <Input placeholder="Sản Phẩm Nệm Mầm Non" />
                    </Form.Item>
                    <Form.Item name="banner_shop_desc" label="Mô tả">
                        <Input.TextArea placeholder="Khám phá bộ sưu tập nệm mầm non chất lượng cao, an toàn cho bé yêu" rows={2} />
                    </Form.Item>
                    <Form.Item name="banner_shop_image" label="Hình nền">
                        <ImageUploader simple hint="1920x400 (hoặc 600) pixels" />
                    </Form.Item>

                    <Divider orientation="left">Trang Dự án (/du-an)</Divider>
                    <Form.Item name="banner_projects_title" label="Tiêu đề banner">
                        <Input placeholder="Dự Án Của HULA" />
                    </Form.Item>
                    <Form.Item name="banner_projects_desc" label="Mô tả">
                        <Input.TextArea placeholder="Khám phá các dự án HULA..." rows={2} />
                    </Form.Item>
                    <Form.Item name="banner_projects_image" label="Hình nền">
                        <ImageUploader simple hint="1920x400 (hoặc 600) pixels" />
                    </Form.Item>

                    <Divider orientation="left">Trang Đặt hàng B2B (/dat-hang-si)</Divider>
                    <Form.Item name="banner_b2b_title" label="Tiêu đề banner">
                        <Input placeholder="Đặt Hàng Sỉ" />
                    </Form.Item>
                    <Form.Item name="banner_b2b_desc" label="Mô tả">
                        <Input.TextArea placeholder="Customize sản phẩm nệm theo yêu cầu..." rows={2} />
                    </Form.Item>
                    <Form.Item name="banner_b2b_image" label="Hình nền">
                        <ImageUploader simple hint="1920x400 (hoặc 600) pixels" />
                    </Form.Item>

                    <Divider orientation="left">Trang Liên hệ (/lien-he)</Divider>
                    <Form.Item name="banner_contact_title" label="Tiêu đề banner">
                        <Input placeholder="Liên Hệ Với Chúng Tôi" />
                    </Form.Item>
                    <Form.Item name="banner_contact_desc" label="Mô tả">
                        <Input.TextArea placeholder="Bạn là trường mầm non muốn tư vấn sỉ?..." rows={2} />
                    </Form.Item>
                    <Form.Item name="banner_contact_image" label="Hình nền">
                        <ImageUploader simple hint="1920x400 (hoặc 600) pixels" />
                    </Form.Item>

                    <Divider orientation="left">Trang Tin tức (/tin-tuc)</Divider>
                    <Form.Item name="banner_news_title" label="Tiêu đề banner">
                        <Input placeholder="Tin Tức & Kiến Thức" />
                    </Form.Item>
                    <Form.Item name="banner_news_desc" label="Mô tả">
                        <Input.TextArea placeholder="Cập nhật thông tin hữu ích..." rows={2} />
                    </Form.Item>
                    <Form.Item name="banner_news_image" label="Hình nền">
                        <ImageUploader simple hint="1920x400 (hoặc 600) pixels" />
                    </Form.Item>
                </div>
            ),
        },
        {
            key: 'display_settings',
            label: <span><EyeOutlined /> Menu & Hiển Thị</span>,
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Alert
                        message="Ẩn trang trên Website"
                        description="Chọn các trang mảng bạn muốn ẨN khỏi thanh menu điều hướng chính trên Desktop và Mobile của Hula Website. Những trang được chọn sẽ không xuất hiện trên Menu cấu hình."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                    <Form.Item name="hidden_pages" label="Các trang đang bị ẩn">
                        <Select
                            mode="multiple"
                            placeholder="Chọn trang để ẩn..."
                            style={{ width: '100%' }}
                            options={[
                                { label: 'Về Hula (/ve-hula)', value: '/ve-hula' },
                                { label: 'Dự án (/du-an)', value: '/du-an' },
                                { label: 'Đặt hàng B2B (/dat-hang-si)', value: '/dat-hang-si' },
                                { label: 'Hula Shop (/san-pham)', value: '/san-pham' },
                                { label: 'Tin Tức (/tin-tuc)', value: '/tin-tuc' },
                                { label: 'Liên Hệ (/lien-he)', value: '/lien-he' },
                            ]}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'product_tags',
            label: <span><TagOutlined /> Tags Sản Phẩm</span>,
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Alert
                        message="Quản lý Tag (2 cấp)"
                        description="Hệ thống lọc sản phẩm trên Hula Shop sẽ dựa vào các Nhóm Tag này. Nhập tên Nhóm (vd: Phân loại, Độ tuổi) và các Tag con tương ứng."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                    
                    <Form.List name="product_tags_config">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start', background: '#fafafa', padding: 16, borderRadius: 8, border: '1px solid #d9d9d9' }}>
                                        <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'group']}
                                                rules={[{ required: true, message: 'Nhập tên nhóm' }]}
                                                style={{ marginBottom: 0, width: '30%' }}
                                                label="Nhóm Tag"
                                            >
                                                <Input placeholder="Vd: Độ tuổi" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'tags']}
                                                rules={[{ required: true, message: 'Nhập ít nhất 1 tag' }]}
                                                style={{ marginBottom: 0, width: '70%' }}
                                                label="Các Tag thuộc nhóm"
                                            >
                                                <Select 
                                                    mode="tags" 
                                                    style={{ width: '100%' }} 
                                                    placeholder="Gõ tên tag và nhấn Enter (Vd: Mầm non, Tiểu học)"
                                                    tokenSeparators={[',']} 
                                                />
                                            </Form.Item>
                                        </div>
                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 36, color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />
                                    </div>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Thêm Nhóm Tag mới
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </div>
            )
        },
        {
            key: 'notification',
            label: 'Thông báo',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Form.Item name="email_new_lead" label="Email khi có Lead mới" valuePropName="checked">
                        <Switch defaultChecked />
                    </Form.Item>

                    <Form.Item name="email_new_order" label="Email khi có Đơn hàng mới" valuePropName="checked">
                        <Switch defaultChecked />
                    </Form.Item>

                    <Form.Item name="notification_email" label="Email nhận thông báo">
                        <Input placeholder="admin@example.com" />
                    </Form.Item>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Form form={form} layout="vertical" preserve={true}>
                <Card
                    title="Cài đặt"
                    extra={
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                            Lưu cài đặt
                        </Button>
                    }
                >
                    <Tabs items={items} />
                </Card>
            </Form>
        </AdminLayout>
    );
}
