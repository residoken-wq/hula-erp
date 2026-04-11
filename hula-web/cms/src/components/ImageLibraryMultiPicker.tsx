'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Spin, Empty, Space, Badge, Tag, message } from 'antd';
import { CheckCircleFilled, PictureOutlined } from '@ant-design/icons';
import { uploadApi } from '@/lib/api';
import { resolveImageUrl } from '@/components/ImageUploader';

interface LibraryFile {
    name: string;
    url: string;
    size: number;
    modified: string;
}

interface ImageLibraryMultiPickerProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: (urls: string[]) => void;
    /** Max images that can be selected */
    max?: number;
}

export default function ImageLibraryMultiPicker({ open, onCancel, onConfirm, max = 10 }: ImageLibraryMultiPickerProps) {
    const [files, setFiles] = useState<LibraryFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            const res = await uploadApi.listFiles();
            setFiles(Array.isArray(res.data) ? res.data : []);
        } catch {
            message.error('Không thể tải thư viện hình ảnh');
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setSelected([]);
            setSearch('');
            loadFiles();
        }
    }, [open]);

    const toggleSelect = (url: string) => {
        setSelected(prev => {
            if (prev.includes(url)) {
                return prev.filter(u => u !== url);
            }
            if (prev.length >= max) {
                message.warning(`Chỉ được chọn tối đa ${max} hình`);
                return prev;
            }
            return [...prev, url];
        });
    };

    const handleConfirm = () => {
        if (selected.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 hình ảnh');
            return;
        }
        onConfirm(selected);
    };

    const filteredFiles = files.filter(f =>
        (f?.name || '').toLowerCase().includes(search.trim().toLowerCase())
    );

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            width={950}
            title={
                <Space>
                    <PictureOutlined />
                    <span>Chọn nhiều ảnh từ thư viện</span>
                    {selected.length > 0 && (
                        <Tag color="blue">{selected.length} đã chọn</Tag>
                    )}
                </Space>
            }
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#999', fontSize: 13 }}>
                        {selected.length > 0
                            ? `Đã chọn ${selected.length} / ${max} hình`
                            : 'Click vào hình để chọn, click lần nữa để bỏ chọn'}
                    </span>
                    <Space>
                        <Button onClick={onCancel}>Hủy</Button>
                        <Button
                            type="primary"
                            onClick={handleConfirm}
                            disabled={selected.length === 0}
                        >
                            Xác nhận ({selected.length})
                        </Button>
                    </Space>
                </div>
            }
            destroyOnClose
        >
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <Input
                    placeholder="Tìm theo tên file..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1 }}
                />
                <Button onClick={loadFiles} loading={loading}>
                    Tải lại
                </Button>
                {selected.length > 0 && (
                    <Button onClick={() => setSelected([])}>
                        Bỏ chọn tất cả
                    </Button>
                )}
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <Spin />
                </div>
            ) : filteredFiles.length === 0 ? (
                <Empty description={files.length === 0 ? 'Chưa có hình ảnh trong thư viện' : 'Không tìm thấy'} />
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 12,
                        maxHeight: '60vh',
                        overflow: 'auto',
                        paddingRight: 4,
                    }}
                >
                    {filteredFiles.map((f) => {
                        const isSelected = selected.includes(f.url);
                        return (
                            <div
                                key={f.name}
                                onClick={() => toggleSelect(f.url)}
                                style={{
                                    border: isSelected ? '2px solid #1677ff' : '1px solid #f0f0f0',
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: isSelected ? '#e6f4ff' : '#fafafa',
                                    transition: 'all 0.15s',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    (e.currentTarget as HTMLElement).style.transform = 'none';
                                }}
                                title={f.name}
                            >
                                {isSelected && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 6,
                                        zIndex: 10,
                                        background: '#fff',
                                        borderRadius: '50%',
                                        lineHeight: 0,
                                    }}>
                                        <CheckCircleFilled style={{ fontSize: 22, color: '#1677ff' }} />
                                    </div>
                                )}
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: isSelected ? 0.85 : 1,
                                }}>
                                    <img
                                        src={resolveImageUrl(f.url)}
                                        alt={f.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ccc" font-size="40">🖼️</text></svg>';
                                        }}
                                    />
                                </div>
                                <div style={{ padding: '6px 10px', fontSize: 12, color: '#555' }}>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
