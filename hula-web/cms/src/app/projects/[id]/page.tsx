'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Select, Button, Space, message, Spin, InputNumber, Tabs } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, SendOutlined, RocketOutlined } from '@ant-design/icons';
import ImageUploader from '@/components/ImageUploader';
import { PageBuilder, LivePreviewModal, BlockData } from '@/components/PageBuilder';
import { websiteProjectsApi } from '@/lib/api';

const { Option } = Select;

export default function ProjectEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Legacy mapping and Block Builder
    const [content, setContent] = useState('');
    const [contentBlocks, setContentBlocks] = useState<BlockData[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);

    const isEditing = params?.id && params.id !== 'new';
    const projectId = isEditing ? String(params.id) : null; // Can be ID or Slug on backend usually, but let's assume it's ID.

    useEffect(() => {
        if (projectId) {
            loadProject();
        } else {
            form.setFieldValue('status', 'DRAFT');
            form.setFieldValue('sort_order', 0);
        }
    }, [projectId]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const res = await websiteProjectsApi.getOne(projectId!);
            const data = res.data;
            form.setFieldsValue(data);
            setContent(data.content || '');
            setContentBlocks(Array.isArray(data.content_blocks) ? data.content_blocks : []);
        } catch (error) {
            message.error('Không thể tải dữ liệu dự án');
            router.push('/projects');
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

            if (isEditing && projectId) {
                await websiteProjectsApi.update(Number(projectId), payload);
                message.success('Đã cập nhật dự án');
            } else {
                await websiteProjectsApi.create(payload);
                message.success('Đã tạo dự án mới');
                router.push('/projects');
            }
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi lưu dự án');
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
                <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/projects')}>
                    Quay lại danh sách
                </Button>
                <Space>
                    <Button icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving}>
                        Lưu nháp
                    </Button>
                    <Button type="primary" icon={<SendOutlined />} onClick={() => handleSave(true)} loading={saving}>
                        Xuất bản
                    </Button>
                </Space>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 16 }}>
                {/* Main Content Area */}
                <Card title="Nội dung Dự án">
                    <Form form={form} layout="vertical">
                        <Form.Item name="title" label="Tên dự án" rules={[{ required: true, message: 'Vui lòng nhập tên dự án' }]}>
                            <Input size="large" placeholder="VD: Dự án thi công rèm mầm non Hoa Hồng..." />
                        </Form.Item>

                        <Form.Item name="description" label="Mô tả ngắn">
                            <Input.TextArea rows={3} placeholder="Sẽ hiển thị trên thẻ dự án ở danh sách..." />
                        </Form.Item>

                        <Form.Item label="Chi tiết Dự án (Block Builder)">
                            <PageBuilder 
                                value={contentBlocks} 
                                onChange={setContentBlocks} 
                                onPreview={() => setPreviewOpen(true)}
                            />
                        </Form.Item>
                    </Form>
                </Card>

                {/* Sidebar Info & SEO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Card title="Thông tin cơ bản">
                        <Form form={form} layout="vertical">
                            <Form.Item name="school_name" label="Tên trường / Đơn vị (Tùy chọn)">
                                <Input placeholder="VD: Trường mầm non Hoa Hồng" />
                            </Form.Item>

                            <Form.Item name="status" label="Trạng thái">
                                <Select>
                                    <Option value="DRAFT">Bản nháp</Option>
                                    <Option value="PUBLISHED">Đã xuất bản</Option>
                                    <Option value="ARCHIVED">Đã lưu trữ</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="sort_order" label="Độ ưu tiên hiển thị (Lớn hơn xếp trước)">
                                <InputNumber min={0} max={9999} style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item name="image_url" label="Ảnh đại diện Dự án">
                                <ImageUploader simple hint="Khuyên dùng ảnh tỷ lệ 4:3 hoặc 16:9" />
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title={<span><RocketOutlined /> Tối ưu SEO</span>}>
                        <Form form={form} layout="vertical">
                            <Form.Item name="slug" label="Đường dẫn (Slug)">
                                <Input placeholder="Tuỳ chỉnh URL thân thiện..." />
                            </Form.Item>
                            <Form.Item name="meta_title" label="Tiêu đề SEO">
                                <Input placeholder="Tiêu đề trên Google..." />
                            </Form.Item>
                            <Form.Item name="meta_description" label="Mô tả SEO">
                                <Input.TextArea rows={3} placeholder="Mô tả gọn kết quả tìm kiếm Google..." />
                            </Form.Item>
                            <Form.Item name="focus_keyword" label="Từ khóa chính">
                                <Input placeholder="VD: rèm mầm non, thi công rèm..." />
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>

            <LivePreviewModal 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)} 
                blocks={contentBlocks} 
                title={`Live Preview: ${form.getFieldValue('title') || 'Dự án mới'}`}
            />
        </AdminLayout>
    );
}
