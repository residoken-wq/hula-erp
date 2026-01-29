'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Select, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

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
}


export default function BlogEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');

    const isEditing = params?.id && params.id !== 'new';
    const blogId = isEditing ? Number(params.id) : null;

    useEffect(() => {
        if (blogId) {
            loadBlog();
        }
    }, [blogId]);

    const loadBlog = async () => {
        setLoading(true);
        try {
            const res = await blogsApi.getOne(blogId!);
            const data = res.data;
            form.setFieldsValue(data);
            setContent(data.content || '');
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
                <Card title="Nội dung bài viết">
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

                        <Form.Item label="Nội dung">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                minHeight={400}
                                placeholder="Nhập nội dung bài viết..."
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
                                    <Select.Option value="Hướng dẫn">Hướng dẫn</Select.Option>
                                    <Select.Option value="Mẹo vặt">Mẹo vặt</Select.Option>
                                    <Select.Option value="Kiến thức">Kiến thức</Select.Option>
                                    <Select.Option value="Tin tức">Tin tức</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="featured_image" label="Ảnh đại diện">
                                <Input placeholder="URL hình ảnh" />
                            </Form.Item>

                            <Form.Item name="slug" label="Slug URL">
                                <Input placeholder="url-bai-viet" />
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title="SEO">
                        <Form form={form} layout="vertical">
                            <Form.Item name="meta_title" label="Meta Title">
                                <Input placeholder="Tiêu đề SEO" />
                            </Form.Item>

                            <Form.Item name="meta_description" label="Meta Description">
                                <Input.TextArea rows={3} placeholder="Mô tả SEO..." />
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
