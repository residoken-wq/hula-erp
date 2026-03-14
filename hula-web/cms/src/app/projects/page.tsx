'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Upload, Tabs, Typography, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, UploadOutlined, GlobalOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { websiteProjectsApi, uploadApi } from '@/lib/api';

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading editor...</p>,
});

const { Option } = Select;
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

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form] = Form.useForm();

    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

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

    const handleOpenModal = (record?: any) => {
        if (record) {
            setEditingId(record.id);
            form.setFieldsValue({
                title: record.title,
                school_name: record.school_name,
                status: record.status,
                description: record.description,
                content: record.content,
                meta_title: record.meta_title,
                meta_description: record.meta_description,
                focus_keyword: record.focus_keyword,
                slug: record.slug
            });
            setImageUrl(record.image_url || '');
        } else {
            setEditingId(null);
            form.resetFields();
            form.setFieldValue('status', 'DRAFT');
            setImageUrl('');
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSave = async (values: any) => {
        try {
            let uploadedImageUrl = imageUrl;

            // Handle image upload if there's a new file
            if (imageFile) {
                try {
                    const uploadRes = await uploadApi.image(imageFile);
                    uploadedImageUrl = uploadRes.data.url;
                } catch (err) {
                    message.error('Lỗi khi tải ảnh lên');
                    return;
                }
            }

            const payload = {
                ...values,
                image_url: uploadedImageUrl
            };

            if (editingId) {
                await websiteProjectsApi.update(editingId, payload);
                message.success('Cập nhật dự án thành công');
            } else {
                await websiteProjectsApi.create(payload);
                message.success('Tạo dự án mới thành công');
            }

            setIsModalOpen(false);
            fetchData(pagination.current, searchText);
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi khi lưu dự án');
        }
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
            render: (url: string) => url ? <img src={url} alt="Project" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: 60, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>No Image</div>
        },
        {
            title: 'Tên dự án',
            dataIndex: 'title',
            render: (text: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 500, color: '#1890ff', cursor: 'pointer' }} onClick={() => handleOpenModal(record)}>
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
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            render: (d: string) => new Date(d).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleOpenModal(record)} />
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
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
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

            <Modal
                title={editingId ? "Cập nhật dự án" : "Thêm dự án mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                width={800}
                centered
                destroyOnClose
                maskClosable={false}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Tabs defaultActiveKey="1">
                        <Tabs.TabPane tab="Thông tin cơ bản" key="1">
                            <Form.Item name="title" label="Tên dự án" rules={[{ required: true, message: 'Vui lòng nhập tên dự án' }]}>
                                <Input size="large" placeholder="VD: Dự án thi công rèm mầm non Hoa Hồng..." />
                            </Form.Item>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <Form.Item name="school_name" label="Tên trường/Đơn vị" style={{ flex: 1 }}>
                                    <Input placeholder="VD: Trường mầm non Hoa Hồng" />
                                </Form.Item>
                                <Form.Item name="status" label="Trạng thái" style={{ width: 150 }}>
                                    <Select>
                                        <Option value="DRAFT">Bản nháp</Option>
                                        <Option value="PUBLISHED">Đã xuất bản</Option>
                                        <Option value="ARCHIVED">Đã lưu trữ</Option>
                                    </Select>
                                </Form.Item>
                            </div>

                            <Form.Item name="description" label="Mô tả ngắn">
                                <Input.TextArea rows={2} placeholder="Sẽ hiển thị ở danh sách dự án..." />
                            </Form.Item>

                            <Form.Item label="Ảnh đại diện">
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                                    {imageUrl && (
                                        <img src={imageUrl} alt="Preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }} />
                                    )}
                                    <Upload
                                        beforeUpload={(file) => {
                                            setImageFile(file);
                                            setImageUrl(URL.createObjectURL(file));
                                            return false; // Prevent auto upload
                                        }}
                                        showUploadList={false}
                                        accept="image/*"
                                    >
                                        <Button icon={<UploadOutlined />}>Đổi ảnh</Button>
                                    </Upload>
                                </div>
                            </Form.Item>

                            <Form.Item name="content" label="Nội dung chi tiết" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
                                <ReactQuill
                                    theme="snow"
                                    style={{ height: 250, marginBottom: 50 }}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link', 'image'],
                                            ['clean']
                                        ],
                                    }}
                                />
                            </Form.Item>
                        </Tabs.TabPane>

                        <Tabs.TabPane tab="Tối ưu SEO" key="2">
                            {editingId && (
                                <Form.Item name="slug" label="Đường dẫn (Slug)">
                                    <Input placeholder="Tuỳ chỉnh URL thân thiện..." />
                                </Form.Item>
                            )}
                            <Form.Item name="meta_title" label="Tiêu đề (Meta Title)">
                                <Input placeholder="Tiêu đề hiển thị trên kết quả tìm kiếm Google..." maxLength={60} showCount />
                            </Form.Item>
                            <Form.Item name="meta_description" label="Mô tả (Meta Description)">
                                <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn kết quả tìm kiếm Google..." maxLength={160} showCount />
                            </Form.Item>
                            <Form.Item name="focus_keyword" label="Từ khóa chính (Focus Keyword)">
                                <Input placeholder="VD: rèm mầm non, thi công rèm..." />
                            </Form.Item>
                        </Tabs.TabPane>
                    </Tabs>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
