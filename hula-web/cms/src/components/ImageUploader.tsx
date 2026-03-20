'use client';

import { useState, useEffect } from 'react';
import { Upload, Input, Button, Collapse, Space, message, Tooltip, Modal, Spin, Empty } from 'antd';
import {
    UploadOutlined,
    DeleteOutlined,
    LinkOutlined,
    PictureOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadApi } from '@/lib/api';

// Helpers
const getGoogleDriveImageUrl = (url?: string) => {
    if (!url) return '';
    try {
        if (url.includes('drive.google.com')) {
            const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
        }
        return url;
    } catch { return url || ''; }
};

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

export const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return getGoogleDriveImageUrl(url);
};

// ---------- TYPES ----------
export interface ImageValue {
    url: string;
    alt?: string;
    title?: string;
    caption?: string;
    description?: string;
    link?: string;
}

interface ImageUploaderProps {
    value?: string | ImageValue;
    onChange?: (val: string | ImageValue) => void;
    /** simple=true: only upload+preview, no SEO fields, value stays string */
    simple?: boolean;
    /** Hint text shown below the uploader */
    hint?: string;
}

// ---------- COMPONENT ----------
export default function ImageUploader({ value, onChange, simple = false, hint }: ImageUploaderProps) {
    // Normalize incoming value
    const normalize = (v: any): ImageValue => {
        if (!v) return { url: '' };
        if (typeof v === 'string') return { url: v };
        return { url: '', ...v };
    };

    const [data, setData] = useState<ImageValue>(normalize(value));
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState<Array<{ name: string; url: string; size: number; modified: string }>>([]);
    const [librarySearch, setLibrarySearch] = useState('');

    // Sync when external value changes
    useEffect(() => {
        setData(normalize(value));
    }, [value]);

    const emit = (next: ImageValue) => {
        setData(next);
        if (!onChange) return;
        if (simple) {
            onChange(next.url);
        } else {
            onChange(next);
        }
    };

    // Upload handler
    const handleUpload: UploadProps['customRequest'] = async (options) => {
        const file = options.file as File;
        if (!file) return;

        // Validate file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Chỉ cho phép upload hình ảnh!');
            options.onError?.(new Error('Not an image'));
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            message.error('File quá lớn! Tối đa 5MB');
            options.onError?.(new Error('File too large'));
            return;
        }

        setUploading(true);
        try {
            const res = await uploadApi.image(file);
            const url = res.data?.url || '';
            emit({ ...data, url });
            setHasError(false);
            message.success('Upload thành công');
            options.onSuccess?.(res.data);
        } catch (err: any) {
            message.error('Upload thất bại: ' + (err?.message || 'Unknown error'));
            options.onError?.(err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        emit({ ...data, url: '' });
        setHasError(false);
    };

    const handleUrlChange = (url: string) => {
        emit({ ...data, url });
        setHasError(false);
    };

    const handleSeoChange = (field: keyof ImageValue, val: string) => {
        emit({ ...data, [field]: val });
    };

    const previewUrl = resolveImageUrl(data.url);

    const openLibrary = async () => {
        setLibraryOpen(true);
        setLibrarySearch('');
        try {
            setLibraryLoading(true);
            const res = await uploadApi.listFiles();
            setLibraryFiles(Array.isArray(res.data) ? res.data : []);
        } catch {
            message.error('Không thể tải thư viện hình ảnh');
            setLibraryFiles([]);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handlePickFromLibrary = (url: string) => {
        // We store relative /uploads/<file> for portability across envs
        emit({ ...data, url });
        setHasError(false);
        setLibraryOpen(false);
        message.success('Đã chọn ảnh');
    };

    const filteredLibraryFiles = libraryFiles.filter(f =>
        (f?.name || '').toLowerCase().includes(librarySearch.trim().toLowerCase())
    );

    return (
        <div>
            {/* Upload area OR Preview */}
            {data.url ? (
                <div style={{
                    position: 'relative',
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#fafafa',
                }}>
                    {!hasError ? (
                        <img
                            src={previewUrl}
                            alt={data.alt || 'Preview'}
                            style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
                            onError={() => setHasError(true)}
                        />
                    ) : (
                        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                            <PictureOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                            <div>Không thể tải hình ảnh</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{data.url}</div>
                        </div>
                    )}
                    <div style={{
                        position: 'absolute', top: 8, right: 8,
                        display: 'flex', gap: 4,
                    }}>
                        <Upload customRequest={handleUpload} showUploadList={false} accept="image/*">
                            <Button size="small" icon={<UploadOutlined />} loading={uploading}>
                                Đổi ảnh
                            </Button>
                        </Upload>
                        <Button size="small" onClick={openLibrary}>
                            Chọn từ thư viện
                        </Button>
                        <Button size="small" icon={<DeleteOutlined />} danger onClick={handleRemove}>
                            Xóa
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    <Upload.Dragger
                        customRequest={handleUpload}
                        showUploadList={false}
                        accept="image/*"
                        disabled={uploading}
                        style={{ padding: '20px 0' }}
                    >
                        <p className="ant-upload-drag-icon">
                            <PictureOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                        </p>
                        <p className="ant-upload-text" style={{ fontSize: 14 }}>
                            {uploading ? 'Đang upload...' : 'Kéo thả hình ảnh hoặc click để chọn'}
                        </p>
                        <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                            Hỗ trợ JPG, PNG, WebP. Tối đa 5MB
                        </p>
                    </Upload.Dragger>
                    <div style={{ marginTop: 8 }}>
                        <Button block onClick={openLibrary}>
                            Chọn từ thư viện
                        </Button>
                    </div>
                </div>
            )}

            {/* Manual URL toggle */}
            {!data.url && (
                <div style={{ marginTop: 8 }}>
                    {showUrlInput ? (
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="https://... hoặc link Google Drive"
                                value={data.url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                prefix={<LinkOutlined />}
                            />
                            <Button onClick={() => setShowUrlInput(false)}>Ẩn</Button>
                        </Space.Compact>
                    ) : (
                        <Button
                            type="link"
                            size="small"
                            icon={<LinkOutlined />}
                            onClick={() => setShowUrlInput(true)}
                        >
                            Hoặc nhập URL thủ công
                        </Button>
                    )}
                </div>
            )}

            {hint && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#999' }}>
                    {hint}
                </div>
            )}

            {/* SEO Fields (only when simple=false and has image) */}
            {!simple && data.url && (
                <Collapse
                    size="small"
                    style={{ marginTop: 12 }}
                    items={[{
                        key: 'seo',
                        label: (
                            <span>
                                <InfoCircleOutlined style={{ marginRight: 6 }} />
                                SEO Hình ảnh
                            </span>
                        ),
                        children: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666', marginBottom: 2, display: 'block' }}>
                                        Văn bản thay thế (Alt Text)
                                        <Tooltip title="Mô tả ngắn về hình ảnh, quan trọng cho SEO và accessibility">
                                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#bbb' }} />
                                        </Tooltip>
                                    </label>
                                    <Input
                                        size="small"
                                        placeholder="Ví dụ: Nệm mầm non HULA màu xanh"
                                        value={data.alt || ''}
                                        onChange={(e) => handleSeoChange('alt', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666', marginBottom: 2, display: 'block' }}>Tiêu đề (Title)</label>
                                    <Input
                                        size="small"
                                        placeholder="Tiêu đề khi hover lên hình"
                                        value={data.title || ''}
                                        onChange={(e) => handleSeoChange('title', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666', marginBottom: 2, display: 'block' }}>Chú thích (Caption)</label>
                                    <Input
                                        size="small"
                                        placeholder="Chú thích hiển thị bên dưới hình"
                                        value={data.caption || ''}
                                        onChange={(e) => handleSeoChange('caption', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666', marginBottom: 2, display: 'block' }}>Mô tả (Description)</label>
                                    <Input.TextArea
                                        size="small"
                                        rows={2}
                                        placeholder="Mô tả chi tiết về hình ảnh..."
                                        value={data.description || ''}
                                        onChange={(e) => handleSeoChange('description', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#666', marginBottom: 2, display: 'block' }}>
                                        Đường dẫn liên kết nội bộ
                                        <Tooltip title="Khi click vào hình sẽ chuyển đến trang này">
                                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#bbb' }} />
                                        </Tooltip>
                                    </label>
                                    <Input
                                        size="small"
                                        placeholder="/san-pham/nem-hula-xanh"
                                        value={data.link || ''}
                                        onChange={(e) => handleSeoChange('link', e.target.value)}
                                        prefix={<LinkOutlined />}
                                    />
                                </div>
                            </div>
                        ),
                    }]}
                />
            )}

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
                    />
                    <Button onClick={openLibrary} loading={libraryLoading}>
                        Tải lại
                    </Button>
                </div>

                {libraryLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Spin />
                    </div>
                ) : filteredLibraryFiles.length === 0 ? (
                    <Empty description={libraryFiles.length === 0 ? 'Chưa có hình ảnh trong thư viện' : 'Không tìm thấy'} />
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
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
