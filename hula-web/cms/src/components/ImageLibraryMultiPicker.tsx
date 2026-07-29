'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Spin, Empty, Space, Badge, Tag, message, Upload } from 'antd';
import { CheckCircleFilled, PictureOutlined, UploadOutlined } from '@ant-design/icons';
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
            width="80vw"
            centered
            style={{ top: '10vh', paddingBottom: '10vh' }}
            title={
                <Space>
                    <PictureOutlined style={{ color: '#1677ff' }} />
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Chọn nhiều ảnh từ thư viện</span>
                    {selected.length > 0 && (
                        <Tag color="blue" style={{ borderRadius: 12 }}>{selected.length} đã chọn</Tag>
                    )}
                </Space>
            }
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                        {selected.length > 0
                            ? `Đã chọn ${selected.length} / ${max} hình`
                            : 'Click vào hình để chọn, click lần nữa để bỏ chọn'}
                    </span>
                    <Space>
                        <Button onClick={onCancel} size="large">Hủy</Button>
                        <Button
                            type="primary"
                            size="large"
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
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, marginTop: 8 }}>
                <Input.Search
                    placeholder="Tìm kiếm hình ảnh theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onSearch={loadFiles}
                    allowClear
                    size="large"
                    style={{ flex: 1 }}
                />
                <Button type="primary" size="large" onClick={loadFiles} loading={loading}>
                    Tải lại
                </Button>
                <Upload
                    name="file"
                    customRequest={async (options) => {
                        try {
                            const { file, onSuccess, onError } = options;
                            const res = await uploadApi.image(file as File);
                            if (res.data?.url) {
                                message.success('Tải lên thành công');
                                onSuccess?.(res.data);
                                toggleSelect(res.data.url);
                                loadFiles();
                            } else {
                                onError?.(new Error('Lỗi tải lên'));
                                message.error('Tải lên thất bại');
                            }
                        } catch (e: any) {
                            options.onError?.(e);
                            message.error('Tải lên thất bại');
                        }
                    }}
                    showUploadList={false}
                    multiple
                >
                    <Button size="large" icon={<UploadOutlined />} type="default">Tải lên</Button>
                </Upload>
                {selected.length > 0 && (
                    <Button size="large" onClick={() => setSelected([])}>
                        Bỏ chọn tất cả
                    </Button>
                )}
            </div>

            {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Spin size="large" />
                </div>
            ) : filteredFiles.length === 0 ? (
                <div style={{ padding: '60px 20px' }}>
                    <Empty description={files.length === 0 ? 'Chưa có hình ảnh trong thư viện' : 'Không tìm thấy hình ảnh phù hợp'} />
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 16,
                        maxHeight: 'calc(80vh - 160px)',
                        overflowY: 'auto',
                        padding: '4px 8px 8px 4px',
                    }}
                >
                    {filteredFiles.map((f) => {
                        const isSelected = selected.includes(f.url);
                        return (
                            <div
                                key={f.name}
                                onClick={() => toggleSelect(f.url)}
                                style={{
                                    border: isSelected ? '2px solid #1677ff' : '1px solid #e5e7eb',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: isSelected ? '#eff6ff' : '#ffffff',
                                    transition: 'all 0.2s ease-in-out',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transform: isSelected ? 'translateY(-2px)' : 'none',
                                    boxShadow: isSelected ? '0 10px 25px -5px rgba(22, 119, 255, 0.15)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                        (e.currentTarget as HTMLElement).style.transform = 'none';
                                    }
                                }}
                                title={f.name}
                            >
                                {isSelected && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        zIndex: 10,
                                        background: '#fff',
                                        borderRadius: '50%',
                                        lineHeight: 0,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    }}>
                                        <CheckCircleFilled style={{ fontSize: 24, color: '#1677ff' }} />
                                    </div>
                                )}
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    background: isSelected ? '#eff6ff' : '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: isSelected ? 0.9 : 1,
                                    padding: 8,
                                }}>
                                    <img
                                        src={resolveImageUrl(f.url)}
                                        alt={f.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', borderRadius: 6 }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ccc" font-size="40">🖼️</text></svg>';
                                        }}
                                    />
                                </div>
                                <div style={{ padding: '8px 12px', fontSize: 13, color: isSelected ? '#1d4ed8' : '#374151', borderTop: isSelected ? '1px solid #bfdbfe' : '1px solid #f3f4f6', background: isSelected ? '#eff6ff' : '#fff' }}>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{f.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
