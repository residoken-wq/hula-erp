'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Modal, Input, message, Typography, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, UploadOutlined, GlobalOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { websiteProjectsApi } from '@/lib/api';
import ImageUploader, { resolveImageUrl } from '@/components/ImageUploader';


const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'default',
    PUBLISHED: 'success',
    ARCHIVED: 'warning'
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PUBLISHED: 'Đã xuất bản',
    ARCHIVED: 'Đã lưu trữ'
};

export default function WebsiteProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
    const [searchText, setSearchText] = useState('');

    const fetchData = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const res = await websiteProjectsApi.getAll({ page, limit: pagination.pageSize, search });
            setProjects(res.data.data);
            setPagination({ ...pagination, current: page, total: res.data.total });
        } catch (e) {
            message.error('Không thể tải danh sách dự án');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchData(1, value);
    };

    const handleTableChange = (newPagination: any) => {
        fetchData(newPagination.current, searchText);
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await websiteProjectsApi.delete(id);
                    message.success('Đã xóa dự án');
                    fetchData(1, searchText);
                } catch (e) {
                    message.error('Lỗi khi xóa dự án');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            render: (url: string) => url ? <img src={resolveImageUrl(url)} alt="Project" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: 60, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>No Image</div>
        },
        {
            title: 'Tên dự án',
            dataIndex: 'title',
            render: (text: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 500, color: '#1890ff', cursor: 'pointer' }} onClick={() => router.push(`/projects/${record.id}`)}>
                        {text}
                    </div>
                    {record.school_name && <div style={{ fontSize: 12, color: '#888' }}>{record.school_name}</div>}
                </div>
            )
        },
        {
            title: 'Lượt xem',
            dataIndex: 'view_count',
            align: 'right' as const,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{STATUS_LABELS[s] || s}</Tag>
        },
        {
            title: 'Độ ưu tiên',
            dataIndex: 'sort_order',
            align: 'right' as const,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            render: (d: string) => new Date(d).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => router.push(`/projects/${record.id}`)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            )
        }
    ];

    return (
        <AdminLayout>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>
                            <GlobalOutlined style={{ marginRight: 8 }} />
                            Quản lý Dự án Website
                        </Title>
                        <Text type="secondary">
                            Quản lý các bài viết về dự án, công trình thi công để hiển thị trên website chính thức.
                        </Text>
                    </div>
                    <Space>
                        <Input.Search
                            placeholder="Tìm kiếm dự án..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 250 }}
                        />
                        <Button icon={<SyncOutlined />} onClick={() => fetchData(pagination.current, searchText)} loading={loading}>
                            Làm mới
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/projects/new')}>
                            Thêm dự án
                        </Button>
                    </Space>
                </div>

                <Alert
                    message="Mẹo: Hệ thống tự động tối ưu hóa URL (Slug) từ Tên dự án để thân thiện với SEO."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Table
                    columns={columns}
                    dataSource={projects}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} dự án`
                    }}
                    onChange={handleTableChange}
                />
            </Card>
        </AdminLayout>
    );
}
