'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Button, message, Spin, Tabs, Space } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUploader from '@/components/ImageUploader';
import dynamic from 'next/dynamic';
import { systemApi } from '@/lib/api';

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

interface StatItem {
    id: string;
    number: string;
    label: string;
    icon?: string;
}

interface ValueItem {
    id: string;
    title: string;
    description: string;
    icon?: string;
}

export default function AboutHulaPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storyContent, setStoryContent] = useState('');
    const [stats, setStats] = useState<StatItem[]>([]);
    const [values, setValues] = useState<ValueItem[]>([]);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await systemApi.getAboutConfig();
            const data = res.data || {};
            form.setFieldsValue(data);
            setStoryContent(data.story_content || '');
            setStats(Array.isArray(data.stats) ? data.stats : []);
            setValues(Array.isArray(data.values) ? data.values : []);
        } catch (error) {
            console.error('Failed to load about config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const formValues = form.getFieldsValue();
            setSaving(true);
            await systemApi.saveAboutConfig({
                ...formValues,
                story_content: storyContent,
                stats,
                values,
            });
            message.success('Đã lưu cấu hình trang Về Hula!');
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi lưu.');
        } finally {
            setSaving(false);
        }
    };

    // Stats helpers
    const addStat = () => setStats([...stats, { id: Date.now().toString(), number: '', label: '', icon: '📊' }]);
    const removeStat = (id: string) => setStats(stats.filter(s => s.id !== id));
    const updateStat = (id: string, field: string, value: string) =>
        setStats(stats.map(s => s.id === id ? { ...s, [field]: value } : s));

    // Values helpers
    const addValue = () => setValues([...values, { id: Date.now().toString(), title: '', description: '', icon: '✨' }]);
    const removeValue = (id: string) => setValues(values.filter(v => v.id !== id));
    const updateValue = (id: string, field: string, value: string) =>
        setValues(values.map(v => v.id === id ? { ...v, [field]: value } : v));

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
                <h2 style={{ margin: 0 }}>Quản lý trang "Về Hula"</h2>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} size="large">
                    Lưu tất cả
                </Button>
            </div>

            <Tabs
                defaultActiveKey="hero"
                type="card"
                items={[
                    {
                        key: 'hero',
                        label: '🎯 Hero Banner',
                        children: (
                            <Card>
                                <Form form={form} layout="vertical">
                                    <Form.Item name="hero_title" label="Tiêu đề Hero">
                                        <Input placeholder="VD: Giải Pháp Nệm Trường Học Toàn Diện" size="large" />
                                    </Form.Item>
                                    <Form.Item name="hero_description" label="Mô tả Hero">
                                        <Input.TextArea rows={3} placeholder="Mô tả ngắn hiển thị dưới tiêu đề..." />
                                    </Form.Item>
                                    <Form.Item name="hero_image" label="Ảnh nền Hero">
                                        <ImageUploader hint="📐 Kích thước: 1920x600px — Ảnh nền banner" />
                                    </Form.Item>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: 'story',
                        label: '📖 Câu chuyện',
                        children: (
                            <Card>
                                <Form form={form} layout="vertical">
                                    <Form.Item name="story_title" label="Tiêu đề phần câu chuyện">
                                        <Input placeholder="VD: Câu Chuyện HULA" />
                                    </Form.Item>
                                    <Form.Item label="Nội dung câu chuyện (Rich Text)">
                                        <RichTextEditor
                                            value={storyContent}
                                            onChange={setStoryContent}
                                            minHeight={300}
                                            placeholder="Viết câu chuyện về HULA..."
                                        />
                                    </Form.Item>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: 'vision',
                        label: '🔭 Tầm nhìn & Sứ mệnh',
                        children: (
                            <Card>
                                <Form form={form} layout="vertical">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <Form.Item name="vision_title" label="Tiêu đề Tầm nhìn">
                                                <Input placeholder="Tầm nhìn" />
                                            </Form.Item>
                                            <Form.Item name="vision_description" label="Nội dung Tầm nhìn">
                                                <Input.TextArea rows={4} placeholder="Mô tả tầm nhìn..." />
                                            </Form.Item>
                                        </div>
                                        <div>
                                            <Form.Item name="mission_title" label="Tiêu đề Sứ mệnh">
                                                <Input placeholder="Sứ mệnh" />
                                            </Form.Item>
                                            <Form.Item name="mission_description" label="Nội dung Sứ mệnh">
                                                <Input.TextArea rows={4} placeholder="Mô tả sứ mệnh..." />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: 'stats',
                        label: '📊 Số liệu nổi bật',
                        children: (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {stats.map((stat, idx) => (
                                        <Card key={stat.id} size="small" style={{ background: '#fafafa' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                                                <Input
                                                    value={stat.icon}
                                                    onChange={e => updateStat(stat.id, 'icon', e.target.value)}
                                                    placeholder="Icon"
                                                    style={{ textAlign: 'center', fontSize: 20 }}
                                                />
                                                <Input
                                                    value={stat.number}
                                                    onChange={e => updateStat(stat.id, 'number', e.target.value)}
                                                    placeholder="VD: 10+"
                                                    addonBefore="Số liệu"
                                                />
                                                <Input
                                                    value={stat.label}
                                                    onChange={e => updateStat(stat.id, 'label', e.target.value)}
                                                    placeholder="VD: Năm kinh nghiệm"
                                                    addonBefore="Mô tả"
                                                />
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeStat(stat.id)} />
                                            </div>
                                        </Card>
                                    ))}
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={addStat} block>
                                        Thêm số liệu
                                    </Button>
                                </Space>
                            </Card>
                        ),
                    },
                    {
                        key: 'values',
                        label: '💎 Giá trị cốt lõi',
                        children: (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {values.map((val) => (
                                        <Card key={val.id} size="small" style={{ background: '#fafafa' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 8, alignItems: 'start' }}>
                                                <Input
                                                    value={val.icon}
                                                    onChange={e => updateValue(val.id, 'icon', e.target.value)}
                                                    placeholder="Icon"
                                                    style={{ textAlign: 'center', fontSize: 20 }}
                                                />
                                                <div>
                                                    <Input
                                                        value={val.title}
                                                        onChange={e => updateValue(val.id, 'title', e.target.value)}
                                                        placeholder="VD: Chất lượng hàng đầu"
                                                        style={{ marginBottom: 8 }}
                                                    />
                                                    <Input.TextArea
                                                        value={val.description}
                                                        onChange={e => updateValue(val.id, 'description', e.target.value)}
                                                        placeholder="Mô tả giá trị..."
                                                        rows={2}
                                                    />
                                                </div>
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeValue(val.id)} />
                                            </div>
                                        </Card>
                                    ))}
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={addValue} block>
                                        Thêm giá trị cốt lõi
                                    </Button>
                                </Space>
                            </Card>
                        ),
                    },
                    {
                        key: 'cta',
                        label: '📢 CTA Section',
                        children: (
                            <Card>
                                <Form form={form} layout="vertical">
                                    <Form.Item name="cta_title" label="Tiêu đề CTA">
                                        <Input placeholder="VD: Liên hệ ngay với chúng tôi!" />
                                    </Form.Item>
                                    <Form.Item name="cta_description" label="Mô tả CTA">
                                        <Input.TextArea rows={2} placeholder="Mô tả ngắn kêu gọi hành động..." />
                                    </Form.Item>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <Form.Item name="cta_button_text" label="Text nút CTA">
                                            <Input placeholder="VD: Liên hệ tư vấn" />
                                        </Form.Item>
                                        <Form.Item name="cta_button_url" label="URL nút CTA">
                                            <Input placeholder="VD: /lien-he" />
                                        </Form.Item>
                                    </div>
                                </Form>
                            </Card>
                        ),
                    },
                ]}
            />
        </AdminLayout>
    );
}
