'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Select, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, SendOutlined, RocketOutlined, SettingOutlined, GoogleOutlined, ShareAltOutlined } from '@ant-design/icons';
import ImageUploader from '@/components/ImageUploader';
import dynamic from 'next/dynamic';
import { SeoAnalysis } from '@/components/seo/SeoAnalysis';
import { SnippetPreview } from '@/components/seo/SnippetPreview';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { Tabs } from 'antd';
import { PageBuilder, LivePreviewModal, BlockData } from '@/components/PageBuilder';

// Dynamic import CKEditor to avoid SSR issues
const RichTextEditor = dynamic(
    () => import('@/components/RichTextEditor'),
    {
        ssr: false,
        loading: () => (
            <div style={{
                height: 300,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: '1px solid #d9d9d9',
            }}>
                Loading editor...
            </div>
        ),
    }
);

import { blogsApi } from '@/lib/api';

interface BlogPost {
    id?: number;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category: string;
    status: string;
    meta_title: string;
    meta_description: string;
    tags: string[];
    // SEO Fields
    focus_keyword?: string;
    seo_score?: number;
    seo_meta?: any;
}


export default function BlogEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [contentBlocks, setContentBlocks] = useState<BlockData[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    const isEditing = params?.id && params.id !== 'new';
    const blogId = isEditing ? Number(params.id) : null;

    useEffect(() => {
        if (blogId) {
            loadBlog();
        }
        loadCategories();
    }, [blogId]);

    const loadCategories = async () => {
        try {
            const res = await blogsApi.getCategories();
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCategories(['Hướng dẫn', 'Mẹo vặt', 'Kiến thức', 'Tin tức']);
        }
    };

    const loadBlog = async () => {
        setLoading(true);
        try {
            const res = await blogsApi.getOne(blogId!);
            const data = res.data;
            // Normalize featured_image: it should be a plain URL string.
            // Fix for cases where it was previously saved as JSON string '{"url":"..."}' or as an object {url:"..."}
            if (data.featured_image) {
                if (typeof data.featured_image === 'object' && data.featured_image.url) {
                    data.featured_image = data.featured_image.url;
                } else if (typeof data.featured_image === 'string' && data.featured_image.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(data.featured_image);
                        if (parsed.url) data.featured_image = parsed.url;
                    } catch { /* keep as-is */ }
                }
            }
            form.setFieldsValue(data);
            setContent(data.content || '');
            setContentBlocks(Array.isArray(data.content_blocks) ? data.content_blocks : []);
        } catch (error) {
            message.error('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (publish = false) => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = {
                ...values,
                content,
                content_blocks: contentBlocks,
                status: publish ? 'PUBLISHED' : (values.status || 'DRAFT'),
            };

            if (blogId) {
                await blogsApi.update(blogId, payload);
                message.success('Đã cập nhật bài viết');
            } else {
                await blogsApi.create(payload);
                message.success('Đã tạo bài viết mới');
                router.push('/blogs');
            }

            if (publish && blogId) {
                await blogsApi.publish(blogId);
                message.success('Đã đăng bài viết');
            }
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    // Watch values for SEO Analysis
    const title = Form.useWatch('title', form);
    const metaTitle = Form.useWatch('meta_title', form);
    const metaDesc = Form.useWatch('meta_description', form);
    const slug = Form.useWatch('slug', form);
    const keyword = Form.useWatch('focus_keyword', form);

    const SeoPanel = () => (
        <Card
            title={<span><RocketOutlined /> RankMath SEO</span>}
            bodyStyle={{ padding: 0 }}
        >
            <Tabs
                defaultActiveKey="general"
                tabPosition="top"
                type="card"
                items={[
                    {
                        key: 'general',
                        label: 'Chung',
                        icon: <GoogleOutlined />,
                        children: (
                            <div style={{ padding: 16 }}>
                                <SnippetPreview
                                    title={metaTitle || title}
                                    description={metaDesc}
                                    slug={slug}
                                    date={new Date().toLocaleDateString('vi-VN')}
                                />

                                <div style={{ marginTop: 16 }}>
                                    <Form.Item name="focus_keyword" label="Từ khóa tập trung (Focus Keyword)">
                                        <Input placeholder="ví dụ: nệm mầm non" prefix={<span style={{ color: '#faad14' }}>🔑</span>} />
                                    </Form.Item>
                                </div>

                                <SeoAnalysis
                                    content={content}
                                    keyword={keyword}
                                    title={metaTitle || title}
                                    description={metaDesc}
                                    slug={slug}
                                    onScoreChange={(score) => form.setFieldValue('seo_score', score)}
                                />
                                <Form.Item name="seo_score" hidden><Input /></Form.Item>
                            </div>
                        )
                    },
                    {
                        key: 'schema',
                        label: 'Schema',
                        icon: <SettingOutlined />,
                        children: (
                            <div style={{ padding: 16 }}>
                                <Form.Item name="seo_meta" noStyle>
                                    <SchemaGenerator />
                                </Form.Item>
                            </div>
                        )
                    },
                    {
                        key: 'social',
                        label: 'Social',
                        icon: <ShareAltOutlined />,
                        children: (
                            <div style={{ padding: 16 }}>
                                <p>Cấu hình chia sẻ Facebook / Zalo (Sử dụng ảnh đại diện mặc định nếu trống)</p>
                                <Form.Item name="meta_title" label="Social Title">
                                    <Input placeholder="Tiêu đề khi chia sẻ..." />
                                </Form.Item>
                                <Form.Item name="meta_description" label="Social Description">
                                    <Input.TextArea rows={2} placeholder="Mô tả khi chia sẻ..." />
                                </Form.Item>
                            </div>
                        )
                    }
                ]}
            />
        </Card>
    );

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/blogs')}>
                    Quay lại
                </Button>
                <Space>
                    <Button icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving}>
                        Lưu nháp
                    </Button>
                    <Button type="primary" icon={<SendOutlined />} onClick={() => handleSave(true)} loading={saving}>
                        Đăng bài
                    </Button>
                </Space>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 16 }}>
                {/* Main Content */}
                <Card title="Nội dung bài viết" style={{ overflow: 'visible' }} styles={{ body: { overflow: 'visible' } }}>
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="title"
                            label="Tiêu đề"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                        >
                            <Input placeholder="Nhập tiêu đề bài viết" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="excerpt"
                            label="Mô tả ngắn"
                        >
                            <Input.TextArea rows={3} placeholder="Mô tả ngắn hiển thị ở trang danh sách..." />
                        </Form.Item>

                        <Form.Item label="Nội dung Bài Viết (Block Builder)">
                            <PageBuilder 
                                value={contentBlocks} 
                                onChange={setContentBlocks} 
                                onPreview={() => setPreviewOpen(true)}
                            />
                        </Form.Item>
                    </Form>
                </Card>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Card title="Thông tin">
                        <Form form={form} layout="vertical">
                            <Form.Item name="category" label="Danh mục">
                                <Select placeholder="Chọn danh mục">
                                    {categories.map((cat) => (
                                        <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="featured_image"
                                label="Ảnh đại diện"
                            >
                                <ImageUploader simple hint="📐 Kích thước: 1200x630px (1.91:1) — Tối ưu SEO + chia sẻ mạng xã hội" />
                            </Form.Item>

                            <Form.Item name="featured_image_alt" label="Alt Text (SEO Ảnh)" tooltip="Mô tả nội dung ảnh cho Google (từ khóa chính)">
                                <Input placeholder="Văn bản thay thế cho ảnh..." />
                            </Form.Item>

                            <Form.Item name="featured_image_title" label="Title Text (SEO Ảnh)" tooltip="Tiêu đề hiển thị khi người dùng di chuột vào ảnh">
                                <Input placeholder="Tiêu đề ảnh..." />
                            </Form.Item>

                            <Form.Item name="slug" label="Slug URL">
                                <Input placeholder="url-bai-viet" />
                            </Form.Item>
                        </Form>
                    </Card>

                    <SeoPanel />
                </div>
            </div>

            <LivePreviewModal 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)} 
                blocks={contentBlocks} 
                title={`Live Preview: ${form.getFieldValue('title') || 'Bài viết mới'}`}
            />
        </AdminLayout>
    );
}
