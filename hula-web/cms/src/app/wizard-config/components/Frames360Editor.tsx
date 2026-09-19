'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Card, InputNumber, Input, Space, message, Slider, Select, Popconfirm, Empty, Tooltip, Tag, Badge } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    PictureOutlined,
    UploadOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    RotateRightOutlined,
    BgColorsOutlined,
    EyeOutlined,
    ThunderboltOutlined,
    SwapOutlined
} from '@ant-design/icons';
import { Wizard360Frame } from '@/types/wizard';
import { uploadApi } from '@/lib/api';

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

interface Props {
    value?: Wizard360Frame[];
    onChange: (frames: Wizard360Frame[]) => void;
    productName?: string;
}

// Preset standard 8-angles for 360 photography
const PRESET_8_ANGLES = [
    { angle: 0, label: 'Chính diện (0°)' },
    { angle: 45, label: 'Góc 3/4 Phải (45°)' },
    { angle: 90, label: 'Mặt bên Phải (90°)' },
    { angle: 135, label: 'Góc sau Phải (135°)' },
    { angle: 180, label: 'Mặt sau (180°)' },
    { angle: 225, label: 'Góc sau Trái (225°)' },
    { angle: 270, label: 'Mặt bên Trái (270°)' },
    { angle: 315, label: 'Góc 3/4 Trái (315°)' },
];

const PRESET_4_ANGLES = [
    { angle: 0, label: 'Mặt Trước (0°)' },
    { angle: 90, label: 'Mặt Phải (90°)' },
    { angle: 180, label: 'Mặt Sau (180°)' },
    { angle: 270, label: 'Mặt Trái (270°)' },
];

// Palette test màu thực tế của HULA
const HULA_TEST_COLORS = [
    { name: 'Xanh ngọc', hex: '#8CE3CB' },
    { name: 'Xanh dương', hex: '#56C5ED' },
    { name: 'Hồng phấn', hex: '#EFA9D7' },
    { name: 'Vàng kem', hex: '#F5E978' },
    { name: 'Cam tươi', hex: '#FFC076' },
    { name: 'Xanh lá', hex: '#ACD942' },
    { name: 'Ghi sáng', hex: '#D4DDD9' },
    { name: 'Xanh đậm', hex: '#0284C7' },
];

export default function Frames360Editor({ value = [], onChange, productName }: Props) {
    const [frames, setFrames] = useState<Wizard360Frame[]>(value || []);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Live color tinting test state
    const [testColor, setTestColor] = useState<string>('#8CE3CB');
    const [testOpacity, setTestOpacity] = useState<number>(0.65);
    const [testBlendMode, setTestBlendMode] = useState<'multiply' | 'color' | 'overlay' | 'soft-light'>('multiply');
    const [enableTintTest, setEnableTintTest] = useState<boolean>(true);

    // Drag-to-rotate interaction
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    // Library Modal
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState<Array<{ name: string; url: string; size: number; modified?: string }>>([]);
    const [targetFrameId, setTargetFrameId] = useState<string | null>(null);
    const [targetField, setTargetField] = useState<'image' | 'mask'>('image');

    useEffect(() => {
        setFrames(value || []);
    }, [value]);

    // Auto rotate turntable player
    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % frames.length);
        }, 150);
        return () => clearInterval(interval);
    }, [isPlaying, frames.length]);

    const emitChange = useCallback((newFrames: Wizard360Frame[]) => {
        setFrames(newFrames);
        onChange(newFrames);
    }, [onChange]);

    // --- Drag to rotate handler ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (frames.length === 0) return;
        setIsDragging(true);
        setStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || frames.length === 0) return;
        const diff = e.clientX - startX;
        const threshold = 18; // px per frame
        if (Math.abs(diff) > threshold) {
            const steps = Math.floor(diff / threshold);
            setCurrentIndex(prev => {
                let next = (prev - steps) % frames.length;
                if (next < 0) next += frames.length;
                return next;
            });
            setStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch support for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (frames.length === 0) return;
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || frames.length === 0) return;
        const diff = e.touches[0].clientX - startX;
        const threshold = 16;
        if (Math.abs(diff) > threshold) {
            const steps = Math.floor(diff / threshold);
            setCurrentIndex(prev => {
                let next = (prev - steps) % frames.length;
                if (next < 0) next += frames.length;
                return next;
            });
            setStartX(e.touches[0].clientX);
        }
    };

    // --- Quick Presets Generator ---
    const handleApplyPreset = (angles: typeof PRESET_8_ANGLES) => {
        const newFrames: Wizard360Frame[] = angles.map((item, idx) => ({
            id: `f360-${Date.now()}-${idx}`,
            angle: item.angle,
            label: item.label,
            image_url: frames[idx]?.image_url || '',
            mask_url: frames[idx]?.mask_url || '',
            tint_blend_mode: 'multiply',
            tint_opacity: 0.65,
            sort_order: idx,
        }));
        emitChange(newFrames);
        setCurrentIndex(0);
        message.success(`Đã tạo bộ khung chuẩn ${angles.length} góc nhìn 360°`);
    };

    // --- Add single frame ---
    const handleAddFrame = () => {
        const nextAngle = frames.length > 0 ? (frames[frames.length - 1].angle + 45) % 360 : 0;
        const newFrame: Wizard360Frame = {
            id: `f360-${Date.now()}`,
            angle: nextAngle,
            label: `Góc ${nextAngle}°`,
            image_url: '',
            mask_url: '',
            tint_blend_mode: 'multiply',
            tint_opacity: 0.65,
            sort_order: frames.length,
        };
        const updated = [...frames, newFrame];
        emitChange(updated);
        setCurrentIndex(updated.length - 1);
    };

    const handleUpdateFrame = (id: string, updates: Partial<Wizard360Frame>) => {
        const updated = frames.map(f => f.id === id ? { ...f, ...updates } : f);
        emitChange(updated);
    };

    const handleDeleteFrame = (id: string) => {
        const updated = frames.filter(f => f.id !== id);
        emitChange(updated);
        if (currentIndex >= updated.length) {
            setCurrentIndex(Math.max(0, updated.length - 1));
        }
    };

    // --- Upload Handlers ---
    const handleUpload = async (file: File, frameId?: string, field: 'image' | 'mask' = 'image') => {
        if (!file.type.startsWith('image/')) {
            message.error('Vui lòng chọn file hình ảnh (PNG/WebP có nền trong suốt)!');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error('Dung lượng tối đa 5MB');
            return;
        }

        try {
            setUploading(true);
            const res = await uploadApi.image(file);
            const url = res.data?.url || '';

            if (frameId) {
                handleUpdateFrame(frameId, field === 'image' ? { image_url: url } : { mask_url: url });
                message.success('Đã tải lên ảnh góc nhìn!');
            } else {
                // Add new frame
                const nextAngle = (frames.length * 45) % 360;
                const newFrame: Wizard360Frame = {
                    id: `f360-${Date.now()}`,
                    angle: nextAngle,
                    label: `Góc ${nextAngle}°`,
                    image_url: url,
                    tint_blend_mode: 'multiply',
                    tint_opacity: 0.65,
                    sort_order: frames.length,
                };
                const updated = [...frames, newFrame];
                emitChange(updated);
                setCurrentIndex(updated.length - 1);
                message.success('Đã thêm frame 360 mới!');
            }
        } catch (err: any) {
            message.error('Upload thất bại: ' + (err?.message || ''));
        } finally {
            setUploading(false);
        }
    };

    // Library picker
    const openLibrary = async (frameId: string | null, field: 'image' | 'mask' = 'image') => {
        setTargetFrameId(frameId);
        setTargetField(field);
        setLibraryOpen(true);
        try {
            setLibraryLoading(true);
            const res = await uploadApi.listFiles();
            setLibraryFiles(Array.isArray(res.data) ? res.data : []);
        } catch {
            setLibraryFiles([]);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handleSelectLibraryImage = (url: string) => {
        if (targetFrameId) {
            handleUpdateFrame(targetFrameId, targetField === 'image' ? { image_url: url } : { mask_url: url });
        } else {
            const nextAngle = (frames.length * 45) % 360;
            const newFrame: Wizard360Frame = {
                id: `f360-${Date.now()}`,
                angle: nextAngle,
                label: `Góc ${nextAngle}°`,
                image_url: url,
                tint_blend_mode: 'multiply',
                tint_opacity: 0.65,
                sort_order: frames.length,
            };
            const updated = [...frames, newFrame];
            emitChange(updated);
            setCurrentIndex(updated.length - 1);
        }
        setLibraryOpen(false);
        message.success('Đã áp dụng ảnh');
    };

    const currentFrame = frames[currentIndex] || frames[0];
    const hasCurrentFrameImg = Boolean(currentFrame?.image_url);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. TOP TOOLBAR: Quick Presets & Actions */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
                    padding: '16px 20px',
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>🌐</span>
                        <strong style={{ fontSize: 15, color: '#1e293b' }}>
                            Khung Hình 360° & Đổi Màu Theo Mã HEX ({frames.length} góc nhìn)
                        </strong>
                        <Tag color="cyan">Khung chuẩn L2</Tag>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                        Tải lên chuỗi ảnh góc quay (khuyên dùng PNG nền trong suốt). Khi khách chọn màu HEX trên website, hệ thống 360 sẽ tự động đổi màu theo.
                    </p>
                </div>

                <Space wrap>
                    <Button
                        icon={<ThunderboltOutlined />}
                        onClick={() => handleApplyPreset(PRESET_8_ANGLES)}
                        style={{ borderRadius: 8 }}
                    >
                        Tạo Nhanh 8 Góc Chuẩn (0° - 315°)
                    </Button>
                    <Button
                        icon={<ThunderboltOutlined />}
                        onClick={() => handleApplyPreset(PRESET_4_ANGLES)}
                        style={{ borderRadius: 8 }}
                    >
                        Tạo 4 Góc Chính
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddFrame}
                        style={{ borderRadius: 8, background: '#0284c7' }}
                    >
                        Thêm Góc Quay
                    </Button>
                </Space>
            </div>

            {/* 2. MAIN DUAL-PANE VIEWPORT */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(320px, 460px) 1fr',
                    gap: 24,
                    alignItems: 'start',
                }}
                className="frames-360-grid-responsive"
            >
                {/* LEFT PANE: Live 360 Turntable Preview & Real-Time Color Tinting */}
                <Card
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <RotateRightOutlined style={{ color: '#0284c7' }} />
                                <span>Preview Xoay 360° Trực Quan</span>
                            </Space>
                            {currentFrame && (
                                <Tag color="blue">{currentFrame.label || `Góc ${currentFrame.angle}°`}</Tag>
                            )}
                        </div>
                    }
                    size="small"
                    style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                >
                    {/* Interactive Turntable Screen */}
                    <div
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                        style={{
                            width: '100%',
                            aspectRatio: '1/1',
                            background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)',
                            borderRadius: 12,
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                        }}
                    >
                        {hasCurrentFrameImg ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {/* Base Image of Current Angle */}
                                <img
                                    src={resolveImageUrl(currentFrame.image_url)}
                                    alt={currentFrame.label || '360 frame'}
                                    style={{
                                        maxWidth: '90%',
                                        maxHeight: '90%',
                                        objectFit: 'contain',
                                        pointerEvents: 'none',
                                        transition: 'all 0.1s ease-out',
                                    }}
                                />

                                {/* REAL-TIME HEX COLOR TINT OVERLAY */}
                                {enableTintTest && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            pointerEvents: 'none',
                                            backgroundColor: testColor,
                                            mixBlendMode: currentFrame.tint_blend_mode || testBlendMode,
                                            opacity: currentFrame.tint_opacity || testOpacity,
                                            WebkitMaskImage: `url('${resolveImageUrl(currentFrame.mask_url || currentFrame.image_url)}')`,
                                            WebkitMaskSize: 'contain',
                                            WebkitMaskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',
                                            maskImage: `url('${resolveImageUrl(currentFrame.mask_url || currentFrame.image_url)}')`,
                                            maskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                            transition: 'background-color 0.2s ease',
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                                <PictureOutlined style={{ fontSize: 44, display: 'block', marginBottom: 8, opacity: 0.5 }} />
                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Chưa có hình cho góc này</div>
                                <div style={{ fontSize: 11 }}>Tải lên ảnh ở danh sách bên phải</div>
                            </div>
                        )}

                        {/* Interactive Drag Hint Overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(15, 23, 42, 0.75)',
                                backdropFilter: 'blur(8px)',
                                color: 'white',
                                fontSize: 10,
                                padding: '4px 10px',
                                borderRadius: 20,
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                            }}
                        >
                            ⇄ Kéo ngang để xoay 360° · {frames.length > 0 ? `${currentIndex + 1}/${frames.length}` : '0/0'}
                        </div>
                    </div>

                    {/* Turntable Controls: Slider & Play/Pause */}
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Button
                                type="text"
                                shape="circle"
                                icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: 22, color: '#0284c7' }} /> : <PlayCircleOutlined style={{ fontSize: 22, color: '#0284c7' }} />}
                                onClick={() => setIsPlaying(!isPlaying)}
                                disabled={frames.length <= 1}
                                title={isPlaying ? 'Dừng xoay' : 'Tự động xoay tròn'}
                            />
                            <div style={{ flex: 1 }}>
                                <Slider
                                    min={0}
                                    max={Math.max(0, frames.length - 1)}
                                    value={currentIndex}
                                    onChange={val => setCurrentIndex(val)}
                                    tooltip={{
                                        formatter: (val) => frames[val || 0]?.label || `Góc ${frames[val || 0]?.angle || 0}°`
                                    }}
                                    disabled={frames.length <= 1}
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIVE HEX COLOR TEST BOX */}
                    <div
                        style={{
                            marginTop: 16,
                            padding: 14,
                            background: '#f8fafc',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Space size={6}>
                                <BgColorsOutlined style={{ color: '#0284c7' }} />
                                <strong style={{ fontSize: 12, color: '#1e293b' }}>Thử Nghiệm Đổi Màu Theo Mã HEX</strong>
                            </Space>
                            <label style={{ fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                    type="checkbox"
                                    checked={enableTintTest}
                                    onChange={e => setEnableTintTest(e.target.checked)}
                                />
                                Bật Test Màu
                            </label>
                        </div>

                        {/* Quick Palette Swatches */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {HULA_TEST_COLORS.map(c => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => { setTestColor(c.hex); setEnableTintTest(true); }}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        backgroundColor: c.hex,
                                        border: testColor === c.hex ? '2px solid #0f172a' : '1px solid rgba(0,0,0,0.15)',
                                        cursor: 'pointer',
                                        transform: testColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'all 0.15s ease',
                                    }}
                                    title={`${c.name} (${c.hex})`}
                                />
                            ))}
                        </div>

                        {/* Custom HEX Input & Blend Settings */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                                <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Mã màu HEX:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input
                                        type="color"
                                        value={testColor}
                                        onChange={e => { setTestColor(e.target.value); setEnableTintTest(true); }}
                                        style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    />
                                    <Input
                                        size="small"
                                        value={testColor}
                                        onChange={e => setTestColor(e.target.value)}
                                        style={{ fontFamily: 'monospace', fontSize: 11 }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Độ phủ màu (Opacity):</label>
                                <Slider
                                    min={0.2}
                                    max={1.0}
                                    step={0.05}
                                    value={testOpacity}
                                    onChange={val => setTestOpacity(val)}
                                    style={{ margin: '6px 0' }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* RIGHT PANE: Frame Cards & Angle Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong style={{ fontSize: 14, color: '#1e293b' }}>Danh Sách Góc Nhìn 360°</strong>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                                ({frames.length} góc · Khuyên dùng từ 8 đến 16 góc)
                            </span>
                        </div>
                        <Button
                            size="small"
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddFrame}
                            style={{ borderRadius: 8 }}
                        >
                            Thêm Góc
                        </Button>
                    </div>

                    {frames.length === 0 ? (
                        <Card style={{ textAlign: 'center', padding: '36px 16px', borderRadius: 14 }}>
                            <Empty
                                description={
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Chưa có khung hình 360° nào</div>
                                        <p style={{ color: '#94a3b8', fontSize: 12 }}>
                                            Bấm "Tạo Nhanh 8 Góc Chuẩn" ở thanh trên để tạo bộ khung chụp mẫu 360 cho sản phẩm {productName || 'này'}.
                                        </p>
                                    </div>
                                }
                            />
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '620px', overflowY: 'auto', paddingRight: 4 }}>
                            {frames.map((frame, index) => {
                                const isCurrent = index === currentIndex;
                                return (
                                    <div
                                        key={frame.id}
                                        onClick={() => setCurrentIndex(index)}
                                        style={{
                                            background: isCurrent ? '#f0f9ff' : '#ffffff',
                                            borderRadius: 12,
                                            border: isCurrent ? '2px solid #0284c7' : '1px solid #e2e8f0',
                                            padding: 12,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                            boxShadow: isCurrent ? '0 4px 12px rgba(2,132,199,0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                            {/* Thumbnail & Active Indicator */}
                                            <div
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 8,
                                                    background: '#f8fafc',
                                                    border: '1px solid #cbd5e1',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {frame.image_url ? (
                                                    <img
                                                        src={resolveImageUrl(frame.image_url)}
                                                        alt={frame.label || ''}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <PictureOutlined style={{ color: '#cbd5e1', fontSize: 20 }} />
                                                )}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: 2,
                                                        left: 2,
                                                        background: 'rgba(15, 23, 42, 0.8)',
                                                        color: 'white',
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        padding: '1px 4px',
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    {index + 1}
                                                </div>
                                            </div>

                                            {/* Angle Degree & Label Input */}
                                            <div style={{ flex: '1 1 180px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <Tag color="cyan" style={{ fontWeight: 700 }}>
                                                        {frame.angle}°
                                                    </Tag>
                                                    <Input
                                                        size="small"
                                                        value={frame.label}
                                                        placeholder="Nhãn góc (VD: Chính diện 0°)"
                                                        onChange={e => handleUpdateFrame(frame.id, { label: e.target.value })}
                                                        style={{ fontWeight: 600, flex: 1 }}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                                                    <span>Góc quay:</span>
                                                    <InputNumber
                                                        size="small"
                                                        min={0}
                                                        max={359}
                                                        value={frame.angle}
                                                        onChange={val => handleUpdateFrame(frame.id, { angle: val || 0 })}
                                                        style={{ width: 65 }}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                    <span>độ</span>
                                                </div>
                                            </div>

                                            {/* Upload & Library Action Buttons */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                                                <label
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        background: '#e0f2fe',
                                                        color: '#0369a1',
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        border: '1px solid #bae6fd',
                                                    }}
                                                >
                                                    <UploadOutlined />
                                                    {frame.image_url ? 'Đổi ảnh' : 'Tải ảnh'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={e => {
                                                            if (e.target.files?.[0]) {
                                                                handleUpload(e.target.files[0], frame.id, 'image');
                                                            }
                                                        }}
                                                    />
                                                </label>

                                                <Button
                                                    size="small"
                                                    icon={<PictureOutlined />}
                                                    onClick={() => openLibrary(frame.id, 'image')}
                                                    style={{ fontSize: 11 }}
                                                >
                                                    Thư viện
                                                </Button>

                                                <Popconfirm
                                                    title="Xóa góc nhìn này?"
                                                    onConfirm={() => handleDeleteFrame(frame.id)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                >
                                                    <Button
                                                        size="small"
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                    />
                                                </Popconfirm>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. IMAGE LIBRARY MODAL */}
            {libraryOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1050,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                    onClick={() => setLibraryOpen(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: 16,
                            width: '100%',
                            maxWidth: 800,
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: 15 }}>Chọn Ảnh Góc Nhìn 360° Từ Thư Viện</strong>
                            <button
                                onClick={() => setLibraryOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                            {libraryLoading ? (
                                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Đang tải thư viện ảnh...</div>
                            ) : libraryFiles.length === 0 ? (
                                <Empty description="Chưa có ảnh trong thư viện" />
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                                    {libraryFiles.map(file => (
                                        <div
                                            key={file.url}
                                            onClick={() => handleSelectLibraryImage(file.url)}
                                            style={{
                                                aspectRatio: '1/1',
                                                borderRadius: 10,
                                                border: '1px solid #cbd5e1',
                                                padding: 6,
                                                cursor: 'pointer',
                                                background: '#f8fafc',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <img
                                                src={resolveImageUrl(file.url)}
                                                alt={file.name}
                                                style={{ maxWidth: '100%', maxHeight: '75%', objectFit: 'contain' }}
                                            />
                                            <div style={{ fontSize: 9, color: '#475569', marginTop: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                                {file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
