'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Modal, message, Input, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, FolderOutlined } from '@ant-design/icons';
import { blogsApi } from '@/lib/api';

interface BlogPost {
    id: number;
    slug: string;
    title: string;
    status: string;
    category: string;
    view_count: number;
    is_hidden: boolean;
    published_at: string | null;
    created_at: string;
}

export default function BlogsPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Category management
    const [categories, setCategories] = useState<string[]>([]);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [savingCategories, setSavingCategories] = useState(false);

    useEffect(() => {
        loadBlogs();
        loadCategories();
    }, []);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const res = await blogsApi.getAll();
            const data = res.data;
            setBlogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await blogsApi.getCategories();
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCategories(['Hướng dẫn', 'Mẹo vặt', 'Kiến thức', 'Tin tức']);
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
                    await blogsApi.delete(id);
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
            if (publish) {
                await blogsApi.publish(id);
            } else {
                await blogsApi.unpublish(id);
            }
            loadBlogs();
            message.success(publish ? 'Đã đăng bài viết' : 'Đã gỡ bài viết');
        } catch {
            message.error('Có lỗi xảy ra');
        }
    };

    const handleToggleHidden = async (id: number, hidden: boolean) => {
        try {
            await blogsApi.update(id, { is_hidden: hidden });
            loadBlogs();
            message.success(hidden ? 'Đã ẩn bài viết khỏi website' : 'Đã hiển thị bài viết trên website');
        } catch {
            message.error('Có lỗi xảy ra');
        }
    };

    const handleAddCategory = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (categories.includes(trimmed)) {
            message.warning('Danh mục đã tồn tại');
            return;
        }
        setCategories([...categories, trimmed]);
        setNewCategory('');
    };

    const handleRemoveCategory = (cat: string) => {
        setCategories(categories.filter(c => c !== cat));
    };

    const handleSaveCategories = async () => {
        setSavingCategories(true);
        try {
            await blogsApi.saveCategories(categories);
            message.success('Đã lưu danh mục');
            setCategoryModalOpen(false);
        } catch {
            message.error('Không thể lưu danh mục');
        } finally {
            setSavingCategories(false);
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
            title: 'Hiển thị',
            dataIndex: 'is_hidden',
            key: 'is_hidden',
            width: 90,
            align: 'center' as const,
            render: (isHidden: boolean, record: BlogPost) => (
                <Switch
                    checked={!isHidden}
                    onChange={(checked) => handleToggleHidden(record.id, !checked)}
                    checkedChildren="Hiện"
                    unCheckedChildren="Ẩn"
                    size="small"
                />
            ),
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
                        <Button icon={<FolderOutlined />} onClick={() => setCategoryModalOpen(true)}>
                            Danh mục
                        </Button>
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
                    rowClassName={(record: BlogPost) => record.is_hidden ? 'row-hidden' : ''}
                />
                <style jsx global>{`
                    .row-hidden { opacity: 0.5; }
                    .row-hidden td:first-child { text-decoration: line-through; }
                `}</style>
            </Card>

            {/* Category Management Modal */}
            <Modal
                title="Quản lý danh mục bài viết"
                open={categoryModalOpen}
                onCancel={() => setCategoryModalOpen(false)}
                onOk={handleSaveCategories}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={savingCategories}
            >
                <div style={{ marginBottom: 16 }}>
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            placeholder="Nhập tên danh mục mới..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onPressEnter={handleAddCategory}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
                            Thêm
                        </Button>
                    </Space.Compact>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {categories.map((cat) => (
                        <Tag
                            key={cat}
                            closable
                            onClose={() => handleRemoveCategory(cat)}
                            style={{ padding: '4px 12px', fontSize: 14 }}
                        >
                            {cat}
                        </Tag>
                    ))}
                    {categories.length === 0 && (
                        <span style={{ color: '#999' }}>Chưa có danh mục nào</span>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
