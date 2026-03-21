'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { systemApi } from '@/lib/api';
import { PageBuilder, LivePreviewModal, BlockData } from '@/components/PageBuilder';

export default function AboutHulaPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [blocks, setBlocks] = useState<BlockData[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await systemApi.getAboutConfig();
            const data = res.data || {};
            // Load the newly structured blocks arrays
            if (Array.isArray(data.about_page_blocks)) {
                setBlocks(data.about_page_blocks);
            } else {
                // If this is the first migration load, provide an empty array
                // The old static data still lives in DB but won't be rendered here.
                setBlocks([]);
            }
        } catch (error) {
            console.error('Failed to load about config:', error);
            message.error('Không thể tải cấu hình cũ');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await systemApi.saveAboutConfig({
                about_page_blocks: blocks,
            });
            message.success('Đã lưu cấu hình blocks trang Về Hula!');
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi lưu.');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Quản lý trang "Về Hula" (Page Builder)</h2>
                    <p style={{ color: '#888', margin: 0, marginTop: 4 }}>
                        Dễ dàng ghép nối các Block để cấu trúc nên một giao diện trang hoàn chỉnh.
                    </p>
                </div>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} size="large">
                    Lưu tất cả thay đổi
                </Button>
            </div>

            <Card bordered={false} style={{ minHeight: '60vh' }}>
                <PageBuilder 
                    value={blocks} 
                    onChange={setBlocks} 
                    onPreview={() => setPreviewOpen(true)}
                />
            </Card>

            <LivePreviewModal 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)} 
                blocks={blocks} 
                title="Live Preview trang Về Hula"
            />
        </AdminLayout>
    );
}
