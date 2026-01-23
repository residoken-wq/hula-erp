'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Modal, message, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

export default function BlogsPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/blogs`);
            const data = await res.json();
            setBlogs(Array.isArray(data) ? data : []);
        } catch (error) {
            // Fallback mock data for development
            setBlogs([
                { id: 1, slug: 'cach-chon-nem', title: 'Cách Chọn Nệm Mầm Non Phù Hợp', status: 'PUBLISHED', category: 'Hướng dẫn', view_count: 1250, published_at: '2026-01-05', created_at: '2026-01-04' },
                { id: 2, slug: 'bao-quan-nem', title: 'Bảo Quản Nệm Đúng Cách', status: 'PUBLISHED', category: 'Mẹo vặt', view_count: 980, published_at: '2026-01-03', created_at: '2026-01-02' },
                { id: 3, slug: 'loi-ich-giac-ngu', title: 'Lợi Ích Của Giấc Ngủ Trưa', status: 'DRAFT', category: 'Kiến thức', view_count: 0, published_at: null, created_at: '2026-01-01' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa bài viết này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const res = await fetch(`${API_URL}/blogs/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete');
                    setBlogs(blogs.filter(b => b.id !== id));
                    message.success('Đã xóa bài viết');
                } catch {
                    message.error('Không thể xóa bài viết');
                }
            },
        });
    };

    const handlePublish = async (id: number, publish: boolean) => {
        try {
            const res = await fetch(`${API_URL}/blogs/${id}/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to update status');
            loadBlogs();
            message.success(publish ? 'Đã đăng bài viết' : 'Đã gỡ bài viết');
        } catch {
            message.error('Có lỗi xảy ra');
        }
    };

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: BlogPost) => (
                <a onClick={() => router.push(`/blogs/${record.id}`)} style={{ fontWeight: 500 }}>
                    {text}
                </a>
            ),
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: BlogPost) =>
                record.title.toLowerCase().includes(value.toLowerCase()),
        },
        { title: 'Danh mục', dataIndex: 'category', key: 'category', width: 120 },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={status === 'PUBLISHED' ? 'success' : 'default'}>
                    {status === 'PUBLISHED' ? 'Đã đăng' : 'Nháp'}
                </Tag>
            ),
        },
        { title: 'Lượt xem', dataIndex: 'view_count', key: 'view_count', width: 100 },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            render: (_: any, record: BlogPost) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/blogs/${record.id}`)}
                    />
                    {record.status === 'DRAFT' ? (
                        <Button
                            type="text"
                            icon={<CheckCircleOutlined />}
                            style={{ color: '#52c41a' }}
                            onClick={() => handlePublish(record.id, true)}
                            title="Đăng bài"
                        />
                    ) : (
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined />}
                            style={{ color: '#faad14' }}
                            onClick={() => handlePublish(record.id, false)}
                            title="Gỡ bài"
                        />
                    )}
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`https://nemmamnon.com/tin-tuc/${record.slug}`, '_blank')}
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

    return (
        <AdminLayout>
            <Card
                title="Quản lý Blog"
                extra={
                    <Space>
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/blogs/new')}>
                            Tạo bài viết
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={blogs}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} bài viết` }}
                />
            </Card>
        </AdminLayout>
    );
}
