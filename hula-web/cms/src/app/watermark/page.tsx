'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Upload, Slider, Select, Switch, message, Spin, Typography, Space, Row, Col, Divider, Modal, Tabs } from 'antd';
import { UploadOutlined, SaveOutlined, ReloadOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/AdminLayout';
import { watermarkApi } from '../../lib/api';

const { Title, Text, Paragraph } = Typography;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    const base = API_URL.endsWith('/api') ? API_URL.replace(/\/api$/, '') : API_URL;
    if (url.startsWith('/uploads/')) return `${base}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

const positionOptions = [
    { value: 'northwest', label: '↖ Trên trái' },
    { value: 'north', label: '↑ Trên giữa' },
    { value: 'northeast', label: '↗ Trên phải' },
    { value: 'west', label: '← Giữa trái' },
    { value: 'center', label: '⊕ Chính giữa' },
    { value: 'east', label: '→ Giữa phải' },
    { value: 'southwest', label: '↙ Dưới trái' },
    { value: 'south', label: '↓ Dưới giữa' },
    { value: 'southeast', label: '↘ Dưới phải' },
];

interface WatermarkConfig {
    enabled: boolean;
    position: string;
    opacity: number;
    sizeRatio: number;
    imageFile: string;
}

const defaultConfig: WatermarkConfig = {
    enabled: false,
    position: 'southeast',
    opacity: 0.4,
    sizeRatio: 0.25,
    imageFile: '',
};

export default function WatermarkPage() {
    const [generalConfig, setGeneralConfig] = useState<WatermarkConfig>(defaultConfig);
    const [b2bConfig, setB2bConfig] = useState<WatermarkConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [generalPreviewUrl, setGeneralPreviewUrl] = useState('');
    const [b2bPreviewUrl, setB2bPreviewUrl] = useState('');

    const [activeTab, setActiveTab] = useState('general');

    const generalCanvasRef = useRef<HTMLCanvasElement>(null);
    const b2bCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        loadConfigs();
    }, []);

    useEffect(() => {
        if (activeTab === 'general') drawPreview(generalCanvasRef, generalConfig, generalPreviewUrl);
        else drawPreview(b2bCanvasRef, b2bConfig, b2bPreviewUrl);
    }, [generalConfig, generalPreviewUrl, b2bConfig, b2bPreviewUrl, activeTab]);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const [genRes, b2bRes] = await Promise.all([
                watermarkApi.getConfig(),
                watermarkApi.getB2BConfig()
            ]);
            
            const genData = genRes.data || defaultConfig;
            setGeneralConfig(genData);
            if (genData.imageFile) setGeneralPreviewUrl(resolveImageUrl(`/uploads/${genData.imageFile}`));

            const b2bData = b2bRes.data || defaultConfig;
            setB2bConfig(b2bData);
            if (b2bData.imageFile) setB2bPreviewUrl(resolveImageUrl(`/uploads/${b2bData.imageFile}`));
            
        } catch (err) {
            console.error('Failed to load watermark configs:', err);
            message.error('Không thể tải cấu hình watermark');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (isB2B: boolean) => {
        try {
            setSaving(true);
            if (isB2B) {
                await watermarkApi.saveB2BConfig(b2bConfig);
            } else {
                await watermarkApi.saveConfig(generalConfig);
            }
            message.success('Đã lưu cấu hình watermark');
        } catch (err) {
            message.error('Lưu cấu hình thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadWatermark = async (file: File, isB2B: boolean) => {
        try {
            if (isB2B) {
                const res = await watermarkApi.uploadB2BImage(file);
                if (res.data?.url) {
                    setB2bConfig(prev => ({ ...prev, imageFile: '_watermark_b2b.png', enabled: true }));
                    setB2bPreviewUrl(resolveImageUrl(res.data.url) + '?t=' + Date.now());
                    message.success('Đã upload hình watermark B2B');
                }
            } else {
                const res = await watermarkApi.uploadImage(file);
                if (res.data?.url) {
                    setGeneralConfig(prev => ({ ...prev, imageFile: '_watermark.png', enabled: true }));
                    setGeneralPreviewUrl(resolveImageUrl(res.data.url) + '?t=' + Date.now());
                    message.success('Đã upload hình watermark chung');
                }
            }
        } catch (err) {
            message.error('Upload watermark thất bại');
        }
        return false;
    };

    const handleRegenerate = () => {
        Modal.confirm({
            title: 'Áp dụng watermark cho tất cả hình?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Thao tác này sẽ áp dụng lại CẢ 2 LOẠI watermark cho tất cả hình ảnh:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>Tạo hình ảnh watermark chung</li>
                        <li>Tạo hình ảnh watermark B2B (trong thư mục _b2b)</li>
                        <li>Bỏ qua hình nhỏ hơn 400x400px (icons, logos)</li>
                    </ul>
                    <p><strong>Quá trình có thể mất vài phút tùy số lượng hình.</strong></p>
                </div>
            ),
            okText: 'Tiến hành',
            cancelText: 'Hủy',
            okType: 'primary',
            async onOk() {
                try {
                    setRegenerating(true);
                    const res = await watermarkApi.regenerateAll();
                    const data = res.data;
                    message.success(`Hoàn tất! Đã xử lý ${data.processed} hình, bỏ qua ${data.skipped} hình nhỏ${data.errors?.length ? `, ${data.errors.length} lỗi` : ''}`);
                } catch (err) {
                    message.error('Batch regenerate thất bại');
                } finally {
                    setRegenerating(false);
                }
            }
        });
    };

    const drawPreview = (canvasRef: React.RefObject<HTMLCanvasElement>, config: WatermarkConfig, previewUrl: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 500, H = 350;
        canvas.width = W;
        canvas.height = H;

        ctx.fillStyle = '#f0f2f5';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#d9d9d9';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        ctx.fillStyle = '#bfbfbf';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hình ảnh sản phẩm mẫu', W / 2, H / 2 - 10);
        ctx.font = '14px Arial';
        ctx.fillText(`${W} × ${H}px`, W / 2, H / 2 + 20);

        if (config.enabled && previewUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const wmWidth = Math.round(W * config.sizeRatio);
                const wmHeight = Math.round((img.height / img.width) * wmWidth);
                const padding = 16;

                let x = 0, y = 0;
                const pos = config.position;
                if (pos.includes('west') || pos === 'west') x = padding;
                else if (pos.includes('east') || pos === 'east') x = W - wmWidth - padding;
                else x = (W - wmWidth) / 2;

                if (pos.includes('north') || pos === 'north') y = padding;
                else if (pos.includes('south') || pos === 'south') y = H - wmHeight - padding;
                else y = (H - wmHeight) / 2;

                ctx.globalAlpha = config.opacity;
                ctx.drawImage(img, x, y, wmWidth, wmHeight);
                ctx.globalAlpha = 1;
            };
            img.src = previewUrl;
        }
    };

    const renderConfigForm = (isB2B: boolean) => {
        const config = isB2B ? b2bConfig : generalConfig;
        const setConfig = isB2B ? setB2bConfig : setGeneralConfig;
        const previewUrl = isB2B ? b2bPreviewUrl : generalPreviewUrl;
        const canvasRef = isB2B ? b2bCanvasRef : generalCanvasRef;

        return (
            <Row gutter={24}>
                <Col xs={24} md={12}>
                    <Card
                        title={`Cấu hình Watermark ${isB2B ? 'B2B' : 'Chung'}`}
                        style={{ marginBottom: 16 }}
                        extra={
                            <Switch
                                checked={config.enabled}
                                onChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                                checkedChildren="BẬT"
                                unCheckedChildren="TẮT"
                            />
                        }
                    >
                        <div style={{ marginBottom: 20 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Hình watermark</Text>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {previewUrl && (
                                    <div style={{
                                        background: '#f5f5f5', border: '1px dashed #d9d9d9', borderRadius: 8, padding: 16, textAlign: 'center'
                                    }}>
                                        <img src={previewUrl} alt="Watermark" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                                <Upload
                                    accept=".png"
                                    showUploadList={false}
                                    beforeUpload={(file) => handleUploadWatermark(file, isB2B)}
                                >
                                    <Button icon={<UploadOutlined />} block>
                                        {previewUrl ? 'Thay đổi hình watermark' : 'Upload hình watermark (PNG)'}
                                    </Button>
                                </Upload>
                            </Space>
                        </div>

                        <Divider />

                        <div style={{ marginBottom: 20 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Vị trí</Text>
                            <Select
                                value={config.position}
                                onChange={(value) => setConfig(prev => ({ ...prev, position: value }))}
                                options={positionOptions}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Kích thước: {Math.round(config.sizeRatio * 100)}% chiều rộng ảnh</Text>
                            <Slider
                                min={10} max={50} value={Math.round(config.sizeRatio * 100)}
                                onChange={(value) => setConfig(prev => ({ ...prev, sizeRatio: value / 100 }))}
                                marks={{ 10: '10%', 25: '25%', 40: '40%', 50: '50%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Độ mờ: {Math.round(config.opacity * 100)}%</Text>
                            <Slider
                                min={5} max={100} value={Math.round(config.opacity * 100)}
                                onChange={(value) => setConfig(prev => ({ ...prev, opacity: value / 100 }))}
                                marks={{ 5: '5%', 20: '20%', 40: '40%', 60: '60%', 100: '100%' }}
                            />
                        </div>

                        <Divider />

                        <Space style={{ width: '100%' }} direction="vertical">
                            <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSaveConfig(isB2B)} loading={saving} block size="large">
                                Lưu cấu hình {isB2B ? 'B2B' : 'Chung'}
                            </Button>
                        </Space>
                    </Card>

                    <Card title="Áp dụng cho hình đã có" style={{ marginBottom: 16 }}>
                        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                            Áp dụng lại CẢ 2 cấu hình watermark (Chung và B2B) cho tất cả hình ảnh trên hệ thống.
                        </Paragraph>
                        <Button icon={<ReloadOutlined />} onClick={handleRegenerate} loading={regenerating} block danger>
                            {regenerating ? 'Đang xử lý...' : 'Áp dụng cho tất cả hình đã có'}
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title={<Space><EyeOutlined /> Xem trước</Space>} style={{ position: 'sticky', top: 80 }}>
                        <div style={{ background: '#fafafa', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {config.enabled ? '✅ Watermark đang BẬT' : '⚪ Watermark đang TẮT'}
                                {' • '} Vị trí: {positionOptions.find(p => p.value === config.position)?.label || config.position}
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <Title level={3} style={{ marginBottom: 8 }}>⚙️ Cài đặt Watermark</Title>
                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                    Hệ thống hỗ trợ 2 loại Watermark độc lập: một dùng chung cho Website/ERP và một chuyên dụng cho trang Đặt Hàng Sỉ (B2B).
                </Paragraph>

                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    type="card"
                    items={[
                        {
                            key: 'general',
                            label: '🌍 Watermark Chung (Global)',
                            children: renderConfigForm(false)
                        },
                        {
                            key: 'b2b',
                            label: '🏭 Watermark Đặt Hàng Sỉ (B2B)',
                            children: renderConfigForm(true)
                        }
                    ]}
                />
            </div>
        </AdminLayout>
    );
}
