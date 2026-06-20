'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Card, InputNumber, Input, Space, message, Tooltip, Upload, Modal, Spin, Empty, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, PictureOutlined, UploadOutlined, DragOutlined, EyeOutlined } from '@ant-design/icons';
import { WizardBaseImage } from '@/types/wizard';
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
    value: WizardBaseImage[];
    onChange: (frames: WizardBaseImage[]) => void;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

export default function ImageBaseEditor({ value, onChange }: Props) {
    const [frames, setFrames] = useState<WizardBaseImage[]>(value || []);
    const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizing, setResizing] = useState<string | null>(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [uploading, setUploading] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState<Array<{ name: string; url: string; size: number, modified?: string }>>([]);
    const [librarySearch, setLibrarySearch] = useState('');
    const [libraryMonthFilter, setLibraryMonthFilter] = useState<string>('all');
    const [addingFrameViaLibrary, setAddingFrameViaLibrary] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFrames(value || []);
    }, [value]);

    const emitChange = useCallback((newFrames: WizardBaseImage[]) => {
        setFrames(newFrames);
        onChange(newFrames);
    }, [onChange]);

    // --- Add frame ---
    const addFrame = (url: string, label?: string) => {
        if (frames.length >= 10) {
            message.warning('Tối đa 10 frames!');
            return;
        }
        const newFrame: WizardBaseImage = {
            id: `frame-${Date.now()}`,
            url,
            label: label || `Frame ${frames.length + 1}`,
            sort_order: frames.length,
            x: 50 + frames.length * 20,
            y: 50 + frames.length * 20,
            width: 300,
            height: 300,
        };
        emitChange([...frames, newFrame]);
        setSelectedFrameId(newFrame.id);
    };

    const handleUploadFrame = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            message.error('Chỉ cho phép upload hình ảnh!');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error('File quá lớn! Tối đa 5MB');
            return;
        }
        setUploading(true);
        try {
            const res = await uploadApi.image(file);
            const url = res.data?.url || '';
            addFrame(url);
            message.success('Đã tải lên frame mới');
        } catch (err: any) {
            message.error('Upload thất bại: ' + (err?.message || ''));
        } finally {
            setUploading(false);
        }
    };

    // --- Library ---
    const openLibrary = async (forAdding: boolean = true) => {
        setAddingFrameViaLibrary(forAdding);
        setLibraryOpen(true);
        setLibrarySearch('');
        setLibraryMonthFilter('all');
        try {
            setLibraryLoading(true);
            const res = await uploadApi.listFiles();
            setLibraryFiles(Array.isArray(res.data) ? res.data : []);
        } catch {
            message.error('Không thể tải thư viện');
            setLibraryFiles([]);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handlePickFromLibrary = (url: string) => {
        if (addingFrameViaLibrary) {
            addFrame(url);
        } else if (selectedFrameId) {
            // Replace image of selected frame
            emitChange(frames.map(f => f.id === selectedFrameId ? { ...f, url } : f));
        }
        setLibraryOpen(false);
        message.success('Đã chọn ảnh');
    };

    // --- Delete ---
    const deleteFrame = (id: string) => {
        emitChange(frames.filter(f => f.id !== id));
        if (selectedFrameId === id) setSelectedFrameId(null);
    };

    // Ref to track latest frames for use inside event listeners
    const framesRef = useRef<WizardBaseImage[]>(frames);
    framesRef.current = frames;

    // --- Update frame props ---
    const updateFrame = useCallback((id: string, updates: Partial<WizardBaseImage>) => {
        const newFrames = framesRef.current.map(f => f.id === id ? { ...f, ...updates } : f);
        emitChange(newFrames);
    }, [emitChange]);

    // --- Drag handlers ---
    const handleMouseDown = (e: React.MouseEvent, frameId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const frame = framesRef.current.find(f => f.id === frameId);
        if (!frame) return;
        setSelectedFrameId(frameId);
        setDragging(frameId);
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
            setDragOffset({
                x: e.clientX - canvasRect.left - frame.x * (canvasRect.width / CANVAS_WIDTH),
                y: e.clientY - canvasRect.top - frame.y * (canvasRect.height / CANVAS_HEIGHT),
            });
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent, frameId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const frame = framesRef.current.find(f => f.id === frameId);
        if (!frame) return;
        setResizing(frameId);
        setResizeStart({ x: e.clientX, y: e.clientY, w: frame.width, h: frame.height });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (dragging && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = CANVAS_WIDTH / rect.width;
                const scaleY = CANVAS_HEIGHT / rect.height;
                const newX = Math.round((e.clientX - rect.left - dragOffset.x) * scaleX);
                const newY = Math.round((e.clientY - rect.top - dragOffset.y) * scaleY);
                updateFrame(dragging, {
                    x: Math.max(0, Math.min(newX, CANVAS_WIDTH - 50)),
                    y: Math.max(0, Math.min(newY, CANVAS_HEIGHT - 50)),
                });
            }
            if (resizing) {
                const dx = e.clientX - resizeStart.x;
                const dy = e.clientY - resizeStart.y;
                const canvasRect = canvasRef.current?.getBoundingClientRect();
                const scaleX = canvasRect ? CANVAS_WIDTH / canvasRect.width : 1;
                const scaleY = canvasRect ? CANVAS_HEIGHT / canvasRect.height : 1;
                updateFrame(resizing, {
                    width: Math.max(40, Math.round(resizeStart.w + dx * scaleX)),
                    height: Math.max(40, Math.round(resizeStart.h + dy * scaleY)),
                });
            }
        };

        const handleMouseUp = () => {
            setDragging(null);
            setResizing(null);
        };

        if (dragging || resizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragging, resizing, dragOffset, resizeStart, updateFrame]);

    const selectedFrame = frames.find(f => f.id === selectedFrameId);

    const getMonthStr = (dateStr?: string) => {
        if (!dateStr) return 'Khác';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Khác';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const libraryMonths = Array.from(new Set(libraryFiles.map(f => getMonthStr(f.modified)))).sort().reverse();

    const filteredLibraryFiles = libraryFiles.filter(f => {
        if (libraryMonthFilter !== 'all' && getMonthStr(f.modified) !== libraryMonthFilter) return false;
        if (librarySearch && !(f?.name || '').toLowerCase().includes(librarySearch.trim().toLowerCase())) return false;
        return true;
    });

    // Bring selected frame to front
    const bringToFront = (id: string) => {
        const maxOrder = Math.max(...frames.map(f => f.sort_order), 0);
        updateFrame(id, { sort_order: maxOrder + 1 });
    };

    const sendToBack = (id: string) => {
        const minOrder = Math.min(...frames.map(f => f.sort_order), 0);
        updateFrame(id, { sort_order: minOrder - 1 });
    };

    return (
        <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Upload
                    beforeUpload={(file) => { handleUploadFrame(file); return false; }}
                    showUploadList={false}
                    accept="image/*"
                >
                    <Button icon={<UploadOutlined />} loading={uploading} disabled={frames.length >= 10}>
                        Upload Frame
                    </Button>
                </Upload>
                <Button icon={<PictureOutlined />} onClick={() => openLibrary(true)} disabled={frames.length >= 10}>
                    Chọn từ thư viện
                </Button>
                <span style={{ color: '#999', fontSize: 12 }}>
                    {frames.length}/10 frames
                </span>
                {selectedFrame && (
                    <>
                        <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 4px' }} />
                        <Button size="small" onClick={() => bringToFront(selectedFrame.id)}>↑ Đưa lên trên</Button>
                        <Button size="small" onClick={() => sendToBack(selectedFrame.id)}>↓ Đưa xuống dưới</Button>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteFrame(selectedFrame.id)}>
                            Xóa frame
                        </Button>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
                {/* Frame List */}
                <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: CANVAS_HEIGHT, overflowY: 'auto', paddingRight: 4 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Danh sách Frames</div>
                    {frames.length === 0 && <div style={{ fontSize: 12, color: '#999' }}>Chưa có frame</div>}
                    {[...frames].sort((a, b) => b.sort_order - a.sort_order).map(f => (
                        <div
                            key={f.id}
                            onClick={() => setSelectedFrameId(f.id)}
                            style={{
                                padding: 8,
                                border: selectedFrameId === f.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                                borderRadius: 6,
                                cursor: 'pointer',
                                background: selectedFrameId === f.id ? '#e6f7ff' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                        >
                            <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {f.url ? <img src={resolveImageUrl(f.url)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <PictureOutlined style={{ color: '#ccc' }} />}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{f.label || f.id}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>Layer: {f.sort_order}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Canvas area */}
                <div
                    ref={canvasRef}
                    onClick={() => setSelectedFrameId(null)}
                    style={{
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        position: 'relative',
                        border: '2px dashed #d9d9d9',
                        borderRadius: 12,
                        background: '#fafafa url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'><rect width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/><rect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/></svg>") repeat',
                        overflow: 'hidden',
                        cursor: dragging ? 'grabbing' : 'default',
                        flexShrink: 0,
                    }}
                >
                    {frames.length === 0 && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexDirection: 'column', gap: 8 }}>
                            <PictureOutlined style={{ fontSize: 48 }} />
                            <div>Chưa có frame nào</div>
                            <div style={{ fontSize: 12 }}>Upload hoặc chọn ảnh để tạo frame</div>
                        </div>
                    )}

                    {[...frames].sort((a, b) => a.sort_order - b.sort_order).map(frame => {
                        const isSelected = selectedFrameId === frame.id;
                        return (
                            <div
                                key={frame.id}
                                onMouseDown={(e) => handleMouseDown(e, frame.id)}
                                onClick={(e) => { e.stopPropagation(); setSelectedFrameId(frame.id); }}
                                style={{
                                    position: 'absolute',
                                    left: frame.x,
                                    top: frame.y,
                                    width: frame.width,
                                    height: frame.height,
                                    border: isSelected ? '2px solid #1890ff' : '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: 4,
                                    cursor: dragging === frame.id ? 'grabbing' : 'grab',
                                    boxShadow: isSelected ? '0 0 0 2px rgba(24,144,255,0.2)' : 'none',
                                    zIndex: frame.sort_order + 10,
                                    overflow: 'hidden',
                                    background: '#fff',
                                }}
                            >
                                {frame.url ? (
                                    <img
                                        src={resolveImageUrl(frame.url)}
                                        alt={frame.label || 'Frame'}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                        <PictureOutlined style={{ fontSize: 32 }} />
                                    </div>
                                )}

                                {/* Label badge */}
                                <div style={{
                                    position: 'absolute', top: 4, left: 4,
                                    background: isSelected ? '#1890ff' : 'rgba(0,0,0,0.5)',
                                    color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                    pointerEvents: 'none', userSelect: 'none',
                                }}>
                                    {frame.label || frame.id}
                                </div>

                                {/* Resize handle */}
                                {isSelected && (
                                    <div
                                        onMouseDown={(e) => handleResizeMouseDown(e, frame.id)}
                                        style={{
                                            position: 'absolute', right: 0, bottom: 0,
                                            width: 16, height: 16,
                                            cursor: 'nwse-resize',
                                            background: '#1890ff',
                                            borderRadius: '4px 0 4px 0',
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Properties panel */}
                {selectedFrame && (
                    <Card size="small" title={`Thuộc tính: ${selectedFrame.label || selectedFrame.id}`} style={{ width: 260, flexShrink: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#666' }}>Tên frame</label>
                                <Input
                                    size="small"
                                    value={selectedFrame.label || ''}
                                    onChange={(e) => updateFrame(selectedFrame.id, { label: e.target.value })}
                                    placeholder="VD: Mặt trước"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#666' }}>X (px)</label>
                                    <InputNumber size="small" style={{ width: '100%' }} value={selectedFrame.x} onChange={(v) => updateFrame(selectedFrame.id, { x: v || 0 })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#666' }}>Y (px)</label>
                                    <InputNumber size="small" style={{ width: '100%' }} value={selectedFrame.y} onChange={(v) => updateFrame(selectedFrame.id, { y: v || 0 })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#666' }}>Width (px)</label>
                                    <InputNumber size="small" style={{ width: '100%' }} min={40} value={selectedFrame.width} onChange={(v) => updateFrame(selectedFrame.id, { width: v || 40 })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#666' }}>Height (px)</label>
                                    <InputNumber size="small" style={{ width: '100%' }} min={40} value={selectedFrame.height} onChange={(v) => updateFrame(selectedFrame.id, { height: v || 40 })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#666' }}>Layer Order</label>
                                <InputNumber size="small" style={{ width: '100%' }} value={selectedFrame.sort_order} onChange={(v) => updateFrame(selectedFrame.id, { sort_order: v || 0 })} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Upload
                                    beforeUpload={async (file) => {
                                        setUploading(true);
                                        try {
                                            const res = await uploadApi.image(file);
                                            updateFrame(selectedFrame.id, { url: res.data?.url || '' });
                                            message.success('Đã đổi ảnh frame');
                                        } catch { message.error('Upload thất bại'); }
                                        finally { setUploading(false); }
                                        return false;
                                    }}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button size="small" icon={<UploadOutlined />} loading={uploading}>Đổi ảnh</Button>
                                </Upload>
                                <Button size="small" onClick={() => openLibrary(false)}>Thư viện</Button>
                            </div>
                            {selectedFrame.url && (
                                <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                    <img src={resolveImageUrl(selectedFrame.url)} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'contain' }} />
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Library Modal */}
            <Modal
                open={libraryOpen}
                onCancel={() => setLibraryOpen(false)}
                footer={null}
                width={900}
                title="Chọn ảnh từ thư viện"
                destroyOnClose
            >
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <Input
                        placeholder="Tìm theo tên file..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        allowClear
                        style={{ width: 250 }}
                    />
                    <Select 
                        value={libraryMonthFilter} 
                        onChange={setLibraryMonthFilter} 
                        style={{ width: 150 }}
                    >
                        <Select.Option value="all">Tất cả các tháng</Select.Option>
                        {libraryMonths.map(m => (
                            <Select.Option key={m} value={m}>Tháng {m}</Select.Option>
                        ))}
                    </Select>
                    <Button onClick={() => openLibrary(addingFrameViaLibrary)} loading={libraryLoading}>
                        Tải lại
                    </Button>
                </div>

                {libraryLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                ) : filteredLibraryFiles.length === 0 ? (
                    <Empty description="Không tìm thấy" />
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 12,
                        maxHeight: '60vh',
                        overflow: 'auto',
                    }}>
                        {filteredLibraryFiles.map((f) => (
                            <div
                                key={f.name}
                                onClick={() => handlePickFromLibrary(f.url)}
                                style={{
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: '#fafafa',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    (e.currentTarget as HTMLElement).style.transform = 'none';
                                }}
                                title={f.name}
                            >
                                <div style={{ width: '100%', aspectRatio: '1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src={resolveImageUrl(f.url)}
                                        alt={f.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <div style={{ padding: '6px 10px', fontSize: 12, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {f.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
