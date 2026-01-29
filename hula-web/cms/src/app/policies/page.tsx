'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/AdminLayout';
import { Card, Tabs, Button, message, Spin, Space } from 'antd';
import { SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { policiesApi } from '@/lib/api';

// Dynamic import CKEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
});

interface Policy {
    slug: string;
    title: string;
    content: string;
    icon: string;
    is_active: boolean;
    display_order: number;
}

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('bao-hanh');
    const [editedContent, setEditedContent] = useState<Record<string, string>>({});
    const [previewMode, setPreviewMode] = useState<string | null>(null);

    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = async () => {
        try {
            const res = await policiesApi.getAll();
            setPolicies(res.data || []);
            // Initialize edited content
            const content: Record<string, string> = {};
            (res.data || []).forEach((p: Policy) => {
                content[p.slug] = p.content || '';
            });
            setEditedContent(content);
        } catch (error) {
            console.error('Failed to load policies:', error);
            message.error('Không thể tải dữ liệu chính sách');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (slug: string) => {
        setSaving(slug);
        try {
            await policiesApi.update(slug, {
                content: editedContent[slug] || ''
            });
            message.success('Đã lưu chính sách thành công!');
        } catch (error) {
            console.error('Failed to save policy:', error);
            message.error('Có lỗi xảy ra khi lưu');
        } finally {
            setSaving(null);
        }
    };

    const handleContentChange = (slug: string, content: string) => {
        setEditedContent(prev => ({
            ...prev,
            [slug]: content
        }));
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    const tabItems = policies.map(policy => ({
        key: policy.slug,
        label: (
            <span>
                <span className="mr-2">{policy.icon}</span>
                {policy.title}
            </span>
        ),
        children: (
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{policy.title}</h3>
                    <Space>
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => setPreviewMode(previewMode === policy.slug ? null : policy.slug)}
                        >
                            {previewMode === policy.slug ? 'Sửa' : 'Xem trước'}
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={saving === policy.slug}
                            onClick={() => handleSave(policy.slug)}
                        >
                            Lưu
                        </Button>
                    </Space>
                </div>

                {/* Editor or Preview */}
                {previewMode === policy.slug ? (
                    <Card className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: editedContent[policy.slug] || '' }} />
                    </Card>
                ) : (
                    <RichTextEditor
                        value={editedContent[policy.slug] || ''}
                        onChange={(content) => handleContentChange(policy.slug, content)}
                        placeholder={`Nhập nội dung ${policy.title}...`}
                        minHeight={400}
                    />
                )}
            </div>
        )
    }));

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Chính sách</h1>
                        <p className="text-gray-500">Chỉnh sửa nội dung các trang chính sách hiển thị trên website</p>
                    </div>
                </div>

                <Card>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        tabPosition="left"
                        className="policies-tabs"
                    />
                </Card>
            </div>
        </AdminLayout>
    );
}
