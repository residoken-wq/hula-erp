'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

interface BlogPost {
    id: number;
    slug: string;
    title: string;
    status: string;
    category: string;
    view_count: number;
    published_at: string | null;
    created_at: string;
}

// Mock data - sẽ được thay bằng API call
const mockBlogs: BlogPost[] = [
    { id: 1, slug: 'cach-chon-nem', title: 'Cách Chọn Nệm Mầm Non Phù Hợp', status: 'PUBLISHED', category: 'Hướng dẫn', view_count: 1250, published_at: '2026-01-05', created_at: '2026-01-04' },
    { id: 2, slug: 'bao-quan-nem', title: 'Bảo Quản Nệm Đúng Cách', status: 'PUBLISHED', category: 'Mẹo vặt', view_count: 980, published_at: '2026-01-03', created_at: '2026-01-02' },
    { id: 3, slug: 'loi-ich-giac-ngu', title: 'Lợi Ích Của Giấc Ngủ Trưa', status: 'DRAFT', category: 'Kiến thức', view_count: 0, published_at: null, created_at: '2026-01-01' },
];

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<BlogPost[]>(mockBlogs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
    const [form] = Form.useForm();

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <strong>{text}</strong>,
        },
        { title: 'Danh mục', dataIndex: 'category', key: 'category' },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'PUBLISHED' ? 'success' : 'default'}>
                    {status === 'PUBLISHED' ? 'Đã đăng' : 'Nháp'}
                </Tag>
            ),
        },
        { title: 'Lượt xem', dataIndex: 'view_count', key: 'view_count' },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at' },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: BlogPost) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/tin-tuc/${record.slug}`, '_blank')}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            ),
        },
    ];

    const handleEdit = (blog: BlogPost) => {
        setEditingBlog(blog);
        form.setFieldsValue(blog);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa bài viết này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: () => {
                setBlogs(blogs.filter(b => b.id !== id));
                message.success('Đã xóa bài viết');
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingBlog) {
                // Update
                setBlogs(blogs.map(b => b.id === editingBlog.id ? { ...b, ...values } : b));
                message.success('Đã cập nhật bài viết');
            } else {
                // Create
                const newBlog: BlogPost = {
                    id: blogs.length + 1,
                    slug: values.title.toLowerCase().replace(/\s+/g, '-'),
                    ...values,
                    view_count: 0,
                    published_at: null,
                    created_at: new Date().toISOString().split('T')[0],
                };
                setBlogs([newBlog, ...blogs]);
                message.success('Đã tạo bài viết mới');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingBlog(null);
        } catch { }
    };

    const handleCreate = () => {
        setEditingBlog(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    return (
        <AdminLayout>
            <Card
                title="Quản lý Blog"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                        Tạo bài viết
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={blogs}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingBlog ? 'Sửa bài viết' : 'Tạo bài viết mới'}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
                width={600}
                okText={editingBlog ? 'Cập nhật' : 'Tạo'}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Nhập tiêu đề bài viết" />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Danh mục"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                        <Select placeholder="Chọn danh mục">
                            <Select.Option value="Hướng dẫn">Hướng dẫn</Select.Option>
                            <Select.Option value="Mẹo vặt">Mẹo vặt</Select.Option>
                            <Select.Option value="Kiến thức">Kiến thức</Select.Option>
                            <Select.Option value="Tin tức">Tin tức</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        initialValue="DRAFT"
                    >
                        <Select>
                            <Select.Option value="DRAFT">Nháp</Select.Option>
                            <Select.Option value="PUBLISHED">Đăng ngay</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
