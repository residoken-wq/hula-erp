import React, { useState, useRef, useEffect } from 'react';
import { Form, Upload, Button, Space, Typography, message, Input, Tabs, Row, Col, Card, Tooltip } from 'antd';
import { UploadOutlined, QuestionCircleOutlined, LinkOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ProductVisualEditorProps {
    value?: any;
    onChange?: (value: any) => void;
}

// Helper to convert Google Drive View links to Direct/Preview links
const convertImageLink = (url: string) => {
    if (!url) return '';

    // Google Drive Link
    if (url.includes('drive.google.com') && url.includes('/file/d/')) {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            // Use lh3.googleusercontent.com for display as it's reliable for images
            return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        }
    }
    return url;
};

export const ProductVisualEditor: React.FC<ProductVisualEditorProps> = ({ value, onChange }) => {
    const [config, setConfig] = useState(value || {});
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    // Default config values if missing
    const matDim = config.dimensions?.mattress || { width: 120, height: 63 };
    const logoDim = config.dimensions?.logo || { width: 10, height: 20 };

    // Calculate aspect ratio for preview container
    const aspectRatio = matDim.width / matDim.height;

    // Calculate Logo Size in Percent relative to Mattress
    const logoWidthPct = (logoDim.width / matDim.width) * 100;
    const logoHeightPct = (logoDim.height / matDim.height) * 100;

    // Use stored position or default to center(ish)
    // Note: stored position might need to be clamped if dimensions change drastically, but for now we trust usage.
    const logoPos = config.logo_position || { x: 40, y: 40, width: logoWidthPct, height: logoHeightPct };

    // Force update logo size in position state if dimensions change (visual sync)
    // We only update the width/height of the box, preserving x/y
    const displayLogoPos = { ...logoPos, width: logoWidthPct, height: logoHeightPct };

    useEffect(() => {
        setConfig(value || {});
    }, [value]);

    const triggerChange = (changedValue: any) => {
        const newConfig = { ...config, ...changedValue };
        setConfig(newConfig);
        onChange?.(newConfig);
    };

    // Helper to update specific dimension
    const updateDimension = (type: 'mattress' | 'pillow' | 'logo', key: 'width' | 'height', val: number) => {
        const currentDims = config.dimensions || {};
        const newDims = {
            ...currentDims,
            [type]: { ...currentDims[type], [key]: val }
        };
        triggerChange({ dimensions: newDims });
    };

    const handleLinkChange = (key: string, val: string) => {
        const directLink = convertImageLink(val);
        triggerChange({ [key]: directLink });
    };

    // --- Drag Logic ---
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate raw percentage position
        let xPct = (x / rect.width) * 100;
        let yPct = (y / rect.height) * 100;

        // Center on cursor
        xPct = xPct - (displayLogoPos.width / 2);
        yPct = yPct - (displayLogoPos.height / 2);

        // Clamp to stay within mattress
        xPct = Math.max(0, Math.min(100 - displayLogoPos.width, xPct));
        yPct = Math.max(0, Math.min(100 - displayLogoPos.height, yPct));

        const newPos = { ...displayLogoPos, x: xPct, y: yPct };
        // We save the full pos object including calculated width/height for passing back to parent/backend
        triggerChange({ logo_position: newPos });
    };

    // Render configuration inputs
    const renderInputs = () => (
        <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: 10 }}>

            <Card title="1. Kích thước & Cấu hình Nệm" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Chiều Rộng (cm)">
                            <Input
                                type="number"
                                value={config.dimensions?.mattress?.width || 120}
                                onChange={e => updateDimension('mattress', 'width', Number(e.target.value))}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Chiều Dài/Cao (cm)">
                            <Input
                                type="number"
                                value={config.dimensions?.mattress?.height || 63}
                                onChange={e => updateDimension('mattress', 'height', Number(e.target.value))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label={<Space>Hình Mặt Trước <Tooltip title="Mặt nệm thường là nơi in Logo trường"><QuestionCircleOutlined /></Tooltip></Space>}>
                    <Input
                        placeholder="Link ảnh (Google Drive ok)"
                        value={config.base_image}
                        onChange={e => handleLinkChange('base_image', e.target.value)}
                        prefix={<LinkOutlined />}
                    />
                </Form.Item>
                <Form.Item label="Hình Mặt Sau">
                    <Input
                        placeholder="Link ảnh mặt sau"
                        value={config.mattress_back_image}
                        onChange={e => handleLinkChange('mattress_back_image', e.target.value)}
                        prefix={<LinkOutlined />}
                    />
                </Form.Item>
            </Card>

            <Card title="2. Kích thước & Cấu hình Gối" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Rộng (cm)">
                            <Input
                                type="number"
                                value={config.dimensions?.pillow?.width || 40}
                                onChange={e => updateDimension('pillow', 'width', Number(e.target.value))}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Cao (cm)">
                            <Input
                                type="number"
                                value={config.dimensions?.pillow?.height || 25}
                                onChange={e => updateDimension('pillow', 'height', Number(e.target.value))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="Hình Gối (Trước)">
                    <Input
                        placeholder="Link ảnh gối"
                        value={config.pillow_image}
                        onChange={e => handleLinkChange('pillow_image', e.target.value)}
                        prefix={<LinkOutlined />}
                    />
                </Form.Item>
                <Form.Item label="Hình Gối (Sau)">
                    <Input
                        placeholder="Link ảnh gối sau"
                        value={config.pillow_back_image}
                        onChange={e => handleLinkChange('pillow_back_image', e.target.value)}
                        prefix={<LinkOutlined />}
                    />
                </Form.Item>
            </Card>

            <Card title="🎮 Mô hình 3D (Tùy chọn)" size="small" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea11, #764ba211)' }}>
                <Form.Item label="Link file 3D (.glb/.gltf)">
                    <Input
                        placeholder="URL đến file 3D model (ví dụ: https://...model.glb)"
                        value={config.model_3d_url}
                        onChange={e => triggerChange({ model_3d_url: e.target.value })}
                        prefix={<LinkOutlined />}
                    />
                </Form.Item>
                <Paragraph style={{ fontSize: 11, color: '#666' }}>
                    💡 Nếu có link file .glb, khách sẽ thấy mô hình 3D xoay 360° và AR trên website.
                    <br />Bạn có thể tạo model 3D từ <a href="https://meshy.ai" target="_blank" rel="noopener noreferrer">Meshy.ai</a> hoặc thuê thiết kế.
                </Paragraph>
            </Card>

            <Card title="3. Kích thước & Vị trí Logo" size="small">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Rộng Logo (cm)">
                            <Input
                                type="number"
                                value={config.dimensions?.logo?.width || 10}
                                onChange={e => updateDimension('logo', 'width', Number(e.target.value))}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Cao Logo (cm)">
                            <Input
                                type="number"
                                value={config.dimensions?.logo?.height || 20}
                                onChange={e => updateDimension('logo', 'height', Number(e.target.value))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Paragraph style={{ fontSize: 12, color: '#666' }}>
                    Kéo thả khung xanh bên phải để chỉnh vị trí in Logo trên nệm.
                    <br />
                    Tọa độ: X={Math.round(displayLogoPos.x)}%, Y={Math.round(displayLogoPos.y)}%
                </Paragraph>
            </Card>
        </div>
    );

    // Render Live Preview
    const renderPreview = () => (
        <div style={{ position: 'sticky', top: 0 }}>
            <Title level={5} style={{ textAlign: 'center' }}>Mô phỏng kích thước thực ({matDim.width}x{matDim.height}cm)</Title>
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: `${aspectRatio}`, // Use calculated aspect ratio
                    margin: '0 auto',
                    backgroundColor: '#eee',
                    backgroundImage: config.base_image ? `url(${config.base_image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #999',
                    borderRadius: 4,
                    cursor: dragging ? 'grabbing' : 'default',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {!config.base_image && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}><UploadOutlined style={{ fontSize: 32, marginBottom: 8 }} /><span>Chưa có hình nệm</span></div>}

                {/* Logo Box - Scaled Exactly */}
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        left: `${displayLogoPos.x}%`,
                        top: `${displayLogoPos.y}%`,
                        width: `${displayLogoPos.width}%`, // calculated % based on cm
                        height: `${displayLogoPos.height}%`, // calculated % based on cm
                        border: '2px dashed #ff4d4f',
                        backgroundColor: 'rgba(255, 77, 79, 0.3)',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 10,
                        userSelect: 'none',
                        zIndex: 20
                    }}
                >
                    {logoDim.width}x{logoDim.height}
                </div>

                {/* Pillow Preview (Visual Only) - Optional */}
                {config.pillow_image && (
                    // Simply show pillow at the top for context, sizing is trickier without explicit pillow pos, 
                    // but we can scale it relative to mattress if users want that. 
                    // For now, keep it simple visual.
                    <div style={{
                        position: 'absolute',
                        top: '5%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: `${((config.dimensions?.pillow?.width || 40) / matDim.width) * 100}%`,
                        zIndex: 10,
                        pointerEvents: 'none'
                    }}>
                        <img
                            src={config.pillow_image}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            alt="Pillow"
                        />
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Khung mô phỏng đúng tỷ lệ thực tế. Vui lòng nhập đúng kích thước Cm.</Text>
            </div>
        </div>
    );

    return (
        <div style={{ padding: 0 }}>
            <Row gutter={24}>
                <Col span={12}>
                    {renderInputs()}
                </Col>
                <Col span={12}>
                    {renderPreview()}
                </Col>
            </Row>
        </div>
    );
};
