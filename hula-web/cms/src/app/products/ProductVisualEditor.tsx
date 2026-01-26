import React, { useState, useRef, useEffect } from 'react';
import { Form, Upload, Button, Space, Typography, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface ProductVisualEditorProps {
    value?: any;
    onChange?: (value: any) => void;
}

export const ProductVisualEditor: React.FC<ProductVisualEditorProps> = ({ value, onChange }) => {
    const [config, setConfig] = useState(value || {});
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    // Default position if not set
    const logoPos = config.logo_position || { x: 30, y: 20, width: 40, height: 20 };

    useEffect(() => {
        setConfig(value || {});
    }, [value]);

    const triggerChange = (changedValue: any) => {
        const newConfig = { ...config, ...changedValue };
        setConfig(newConfig);
        onChange?.(newConfig);
    };

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

        // Calculate percentage
        let xPct = (x / rect.width) * 100;
        let yPct = (y / rect.height) * 100;

        // Center the box on cursor approximately
        xPct = xPct - (logoPos.width / 2);
        yPct = yPct - (logoPos.height / 2);

        // Clamp
        xPct = Math.max(0, Math.min(100 - logoPos.width, xPct));
        yPct = Math.max(0, Math.min(100 - logoPos.height, yPct));

        const newPos = { ...logoPos, x: xPct, y: yPct };
        triggerChange({ logo_position: newPos });
    };

    return (
        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
            <Typography.Title level={5}>Cấu hình hình ảnh</Typography.Title>

            <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
                <Form.Item label="Hình Nệm (Base Upload)">
                    <Space>
                        <Upload
                            listType="picture"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={() => false} // Prevent auto upload
                            onChange={(info) => {
                                // In real app, upload to server/S3 and get URL. 
                                // Here we mock by just using local preview or simple text input for URL
                            }}
                        >
                            <Button icon={<UploadOutlined />}>Upload hình nệm</Button>
                        </Upload>
                        <input
                            style={{ width: 300, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 6 }}
                            placeholder="Link hình nệm (URL)"
                            value={config.base_image || ''}
                            onChange={(e) => triggerChange({ base_image: e.target.value })}
                        />
                    </Space>
                </Form.Item>

                <Form.Item label="Hình Gối (Pillow Upload)">
                    <Space>
                        <input
                            style={{ width: 300, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 6 }}
                            placeholder="Link hình gối (URL)"
                            value={config.pillow_image || ''}
                            onChange={(e) => triggerChange({ pillow_image: e.target.value })}
                        />
                    </Space>
                </Form.Item>
            </Space>

            <Typography.Text strong>Vị trí Logo (Kéo thả khung xanh để chỉnh vị trí):</Typography.Text>

            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 500,
                    aspectRatio: '3/4', // Portrait nệm
                    backgroundColor: '#eee',
                    backgroundImage: config.base_image ? `url(${config.base_image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px dashed #ccc',
                    marginTop: 8,
                    cursor: dragging ? 'grabbing' : 'default'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {!config.base_image && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Chưa có hình nệm</div>}

                {/* Logo Box */}
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        left: `${logoPos.x}%`,
                        top: `${logoPos.y}%`,
                        width: `${logoPos.width}%`,
                        height: `${logoPos.height}%`,
                        border: '2px dashed #1890ff',
                        backgroundColor: 'rgba(24, 144, 255, 0.3)',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 12,
                        userSelect: 'none'
                    }}
                >
                    LOGO
                </div>

                {/* Optional: Pillow Preview if needed */}
                {config.pillow_image && (
                    <img
                        src={config.pillow_image}
                        style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: '60%' }}
                        alt="Pillow" // Just a visual guess for preview
                    />
                )}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Position: X={Math.round(logoPos.x)}%, Y={Math.round(logoPos.y)}%
            </div>
        </div>
    );
};
