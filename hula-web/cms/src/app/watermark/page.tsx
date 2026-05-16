'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Upload, Slider, Select, Switch, message, Spin, Typography, Space, Row, Col, Divider, Modal, Progress } from 'antd';
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
    const [config, setConfig] = useState<WatermarkConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [watermarkPreviewUrl, setWatermarkPreviewUrl] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    // Redraw preview when config changes
    useEffect(() => {
        drawPreview();
    }, [config, watermarkPreviewUrl]);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await watermarkApi.getConfig();
            const data = res.data || defaultConfig;
            setConfig(data);
            if (data.imageFile) {
                setWatermarkPreviewUrl(resolveImageUrl(`/uploads/${data.imageFile}`));
            }
        } catch (err) {
            console.error('Failed to load watermark config:', err);
            message.error('Không thể tải cấu hình watermark');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            await watermarkApi.saveConfig(config);
            message.success('Đã lưu cấu hình watermark');
        } catch (err) {
            message.error('Lưu cấu hình thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadWatermark = async (file: File) => {
        try {
            const res = await watermarkApi.uploadImage(file);
            const url = res.data?.url;
            if (url) {
                setConfig(prev => ({ ...prev, imageFile: '_watermark.png', enabled: true }));
                setWatermarkPreviewUrl(resolveImageUrl(url) + '?t=' + Date.now());
                message.success('Đã upload hình watermark');
            }
        } catch (err) {
            message.error('Upload watermark thất bại');
        }
        return false; // Prevent default upload behavior
    };

    const handleRegenerate = () => {
        Modal.confirm({
            title: 'Áp dụng watermark cho tất cả hình?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Thao tác này sẽ:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>Áp dụng watermark hiện tại cho tất cả hình ảnh đã upload</li>
                        <li>Bỏ qua hình nhỏ hơn 400x400px (icons, logos)</li>
                        <li>Hình gốc được giữ nguyên trong thư mục _originals</li>
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
                    if (data.errors?.length) {
                        console.warn('Regeneration errors:', data.errors);
                    }
                } catch (err) {
                    message.error('Batch regenerate thất bại');
                } finally {
                    setRegenerating(false);
                }
            }
        });
    };

    // Canvas preview drawing
    const drawPreview = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 500, H = 350;
        canvas.width = W;
        canvas.height = H;

        // Draw sample "product image" background
        ctx.fillStyle = '#f0f2f5';
        ctx.fillRect(0, 0, W, H);

        // Grid pattern to simulate image
        ctx.strokeStyle = '#d9d9d9';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Center placeholder text
        ctx.fillStyle = '#bfbfbf';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hình ảnh sản phẩm mẫu', W / 2, H / 2 - 10);
        ctx.font = '14px Arial';
        ctx.fillText(`${W} × ${H}px`, W / 2, H / 2 + 20);

        // Draw watermark overlay
        if (config.enabled && watermarkPreviewUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const wmWidth = Math.round(W * config.sizeRatio);
                const wmHeight = Math.round((img.height / img.width) * wmWidth);
                const padding = 16;

                // Calculate position
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
            img.src = watermarkPreviewUrl;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <Title level={3} style={{ marginBottom: 8 }}>⚙️ Cài đặt Watermark</Title>
                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                    Tự động thêm watermark cho tất cả hình ảnh khi upload lên hệ thống ERP và Website.
                </Paragraph>

                <Row gutter={24}>
                    {/* Left: Settings */}
                    <Col xs={24} md={12}>
                        <Card
                            title="Cấu hình"
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
                            {/* Upload watermark image */}
                            <div style={{ marginBottom: 20 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Hình watermark</Text>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {watermarkPreviewUrl && (
                                        <div style={{
                                            background: '#f5f5f5',
                                            border: '1px dashed #d9d9d9',
                                            borderRadius: 8,
                                            padding: 16,
                                            textAlign: 'center'
                                        }}>
                                            <img
                                                src={watermarkPreviewUrl}
                                                alt="Watermark"
                                                style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    )}
                                    <Upload
                                        accept=".png"
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            handleUploadWatermark(file);
                                            return false;
                                        }}
                                    >
                                        <Button icon={<UploadOutlined />} block>
                                            {watermarkPreviewUrl ? 'Thay đổi hình watermark' : 'Upload hình watermark (PNG)'}
                                        </Button>
                                    </Upload>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Khuyến nghị: file PNG nền trong suốt, logo hoặc text
                                    </Text>
                                </Space>
                            </div>

                            <Divider />

                            {/* Position */}
                            <div style={{ marginBottom: 20 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Vị trí</Text>
                                <Select
                                    value={config.position}
                                    onChange={(value) => setConfig(prev => ({ ...prev, position: value }))}
                                    options={positionOptions}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Size Ratio */}
                            <div style={{ marginBottom: 20 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Kích thước: {Math.round(config.sizeRatio * 100)}% chiều rộng ảnh
                                </Text>
                                <Slider
                                    min={10}
                                    max={50}
                                    value={Math.round(config.sizeRatio * 100)}
                                    onChange={(value) => setConfig(prev => ({ ...prev, sizeRatio: value / 100 }))}
                                    marks={{ 10: '10%', 25: '25%', 40: '40%', 50: '50%' }}
                                />
                            </div>

                            {/* Opacity */}
                            <div style={{ marginBottom: 20 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Độ mờ: {Math.round(config.opacity * 100)}%
                                </Text>
                                <Slider
                                    min={5}
                                    max={100}
                                    value={Math.round(config.opacity * 100)}
                                    onChange={(value) => setConfig(prev => ({ ...prev, opacity: value / 100 }))}
                                    marks={{ 5: '5%', 20: '20%', 40: '40%', 60: '60%', 100: '100%' }}
                                />
                            </div>

                            <Divider />

                            {/* Save button */}
                            <Space style={{ width: '100%' }} direction="vertical">
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSaveConfig}
                                    loading={saving}
                                    block
                                    size="large"
                                >
                                    Lưu cấu hình
                                </Button>
                            </Space>
                        </Card>

                        {/* Batch Regenerate */}
                        <Card
                            title="Áp dụng cho hình đã có"
                            style={{ marginBottom: 16 }}
                        >
                            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                                Áp dụng watermark hiện tại cho tất cả hình ảnh đã upload trước đó.
                                Hình nhỏ hơn 400×400px (icons, logos) sẽ được bỏ qua tự động.
                            </Paragraph>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRegenerate}
                                loading={regenerating}
                                block
                                danger
                            >
                                {regenerating ? 'Đang xử lý...' : 'Áp dụng cho tất cả hình đã có'}
                            </Button>
                        </Card>
                    </Col>

                    {/* Right: Preview */}
                    <Col xs={24} md={12}>
                        <Card
                            title={<Space><EyeOutlined /> Xem trước</Space>}
                            style={{ position: 'sticky', top: 80 }}
                        >
                            <div style={{
                                background: '#fafafa',
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #f0f0f0'
                            }}>
                                <canvas
                                    ref={canvasRef}
                                    style={{ width: '100%', height: 'auto', display: 'block' }}
                                />
                            </div>
                            <div style={{ marginTop: 12, textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {config.enabled ? '✅ Watermark đang BẬT' : '⚪ Watermark đang TẮT'} 
                                    {' • '} Vị trí: {positionOptions.find(p => p.value === config.position)?.label || config.position}
                                </Text>
                            </div>

                            <Divider />

                            <div style={{ padding: '0 8px' }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>ℹ️ Lưu ý:</Text>
                                <ul style={{ paddingLeft: 20, color: '#666', fontSize: 13, lineHeight: '22px' }}>
                                    <li>Watermark áp dụng cho <strong>tất cả hình upload</strong> từ ERP và CMS</li>
                                    <li>Hình gốc luôn được lưu trong thư mục _originals</li>
                                    <li>Bỏ qua tự động: hình &lt; 400px, GIF, SVG, icon</li>
                                    <li>Khi thay đổi watermark, nhấn "Áp dụng cho tất cả" để cập nhật</li>
                                </ul>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}
