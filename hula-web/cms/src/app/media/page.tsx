'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Upload, Button, Space, message, Modal, Input, Empty, Spin, Tooltip, Typography, Popconfirm, Tag } from 'antd';
import {
    UploadOutlined,
    DeleteOutlined,
    CopyOutlined,
    SearchOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    EyeOutlined,
    CloudUploadOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { uploadApi } from '@/lib/api';

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    modified: string;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getApiBaseUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return apiUrl.replace(/\/api$/, '');
}

function resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
}

export default function MediaPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
    const [uploading, setUploading] = useState(false);

    const loadFiles = useCallback(async () => {
        try {
            setLoading(true);
            const res = await uploadApi.listFiles();
            setFiles(res.data || []);
        } catch {
            message.error('Không thể tải danh sách hình ảnh');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            setUploading(true);
            await uploadApi.image(file);
            message.success(`Đã upload: ${file.name}`);
            onSuccess?.('ok');
            loadFiles();
        } catch (err) {
            message.error('Upload thất bại');
            onError?.(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        try {
            await uploadApi.deleteFile(filename);
            message.success('Đã xóa');
            loadFiles();
        } catch {
            message.error('Không thể xóa');
        }
    };

    const handleCopyUrl = (file: UploadedFile) => {
        const url = resolveUrl(file.url);
        navigator.clipboard.writeText(url);
        message.success('Đã copy URL');
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <Card
                title={
                    <Space>
                        <span style={{ fontSize: 20 }}>🖼️</span>
                        <span>Quản lý Hình ảnh</span>
                        <Tag color="blue">{files.length} files</Tag>
                    </Space>
                }
                extra={
                    <Space>
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Button.Group>
                            <Tooltip title="Grid">
                                <Button
                                    icon={<AppstoreOutlined />}
                                    type={viewMode === 'grid' ? 'primary' : 'default'}
                                    onClick={() => setViewMode('grid')}
                                />
                            </Tooltip>
                            <Tooltip title="List">
                                <Button
                                    icon={<UnorderedListOutlined />}
                                    type={viewMode === 'list' ? 'primary' : 'default'}
                                    onClick={() => setViewMode('list')}
                                />
                            </Tooltip>
                        </Button.Group>
                        <Tooltip title="Refresh">
                            <Button icon={<ReloadOutlined />} onClick={loadFiles} loading={loading} />
                        </Tooltip>
                    </Space>
                }
            >
                {/* Upload Zone */}
                <div style={{ marginBottom: 24 }}>
                    <Dragger
                        customRequest={handleUpload}
                        multiple
                        showUploadList={false}
                        accept="image/*"
                        disabled={uploading}
                        style={{
                            background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)',
                            borderColor: '#91caff',
                            borderRadius: 12,
                            padding: '20px 0',
                        }}
                    >
                        <p style={{ fontSize: 48, margin: '0 0 8px', lineHeight: 1 }}>
                            {uploading ? <Spin size="large" /> : <CloudUploadOutlined style={{ color: '#1677ff' }} />}
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>
                            Kéo thả hoặc click để upload hình ảnh
                        </p>
                        <p style={{ fontSize: 13, color: '#999' }}>
                            Hỗ trợ: JPG, PNG, GIF, WEBP, SVG — Tối đa 10MB
                        </p>
                    </Dragger>
                </div>

                {/* File Grid / List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
                ) : filteredFiles.length === 0 ? (
                    <Empty description={search ? 'Không tìm thấy' : 'Chưa có hình ảnh nào'} />
                ) : viewMode === 'grid' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 16,
                    }}>
                        {filteredFiles.map((file) => (
                            <div
                                key={file.name}
                                style={{
                                    borderRadius: 12,
                                    border: '1px solid #f0f0f0',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    background: '#fafafa',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    (e.currentTarget as HTMLElement).style.transform = 'none';
                                }}
                            >
                                {/* Image Preview */}
                                <div
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        background: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                    onClick={() => setPreviewFile(file)}
                                >
                                    <img
                                        src={resolveUrl(file.url)}
                                        alt={file.name}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50" y="50" text-anchor="middle" fill="%23ccc" font-size="40">🖼️</text></svg>';
                                        }}
                                    />
                                </div>

                                {/* File Info */}
                                <div style={{ padding: '8px 12px' }}>
                                    <Text ellipsis style={{ fontSize: 12, display: 'block' }}>{file.name}</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(file.size)}</Text>
                                        <Space size={4}>
                                            <Tooltip title="Copy URL">
                                                <Button type="text" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); handleCopyUrl(file); }} />
                                            </Tooltip>
                                            <Popconfirm title="Xóa hình này?" onConfirm={() => handleDelete(file.name)} okText="Xóa" cancelText="Hủy">
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                                            </Popconfirm>
                                        </Space>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div>
                        {filteredFiles.map((file) => (
                            <div
                                key={file.name}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f0f0f0',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                                    <img src={resolveUrl(file.url)} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text ellipsis style={{ fontSize: 13 }}>{file.name}</Text>
                                </div>
                                <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{formatSize(file.size)}</Text>
                                <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{new Date(file.modified).toLocaleDateString('vi-VN')}</Text>
                                <Space size={4}>
                                    <Tooltip title="Xem"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreviewFile(file)} /></Tooltip>
                                    <Tooltip title="Copy URL"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyUrl(file)} /></Tooltip>
                                    <Popconfirm title="Xóa hình này?" onConfirm={() => handleDelete(file.name)} okText="Xóa" cancelText="Hủy">
                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Preview Modal */}
            <Modal
                open={!!previewFile}
                onCancel={() => setPreviewFile(null)}
                footer={
                    previewFile ? (
                        <Space>
                            <Button icon={<CopyOutlined />} onClick={() => handleCopyUrl(previewFile)}>
                                Copy URL
                            </Button>
                            <Popconfirm title="Xóa hình này?" onConfirm={() => { handleDelete(previewFile.name); setPreviewFile(null); }}>
                                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                            </Popconfirm>
                        </Space>
                    ) : null
                }
                width={800}
                title={previewFile?.name}
            >
                {previewFile && (
                    <div style={{ textAlign: 'center' }}>
                        <img
                            src={resolveUrl(previewFile.url)}
                            alt={previewFile.name}
                            style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8 }}
                        />
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 24 }}>
                            <Text type="secondary">Kích thước: {formatSize(previewFile.size)}</Text>
                            <Text type="secondary">Ngày upload: {new Date(previewFile.modified).toLocaleString('vi-VN')}</Text>
                        </div>
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 8 }}>
                            <Text copyable={{ text: resolveUrl(previewFile.url) }} style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                {resolveUrl(previewFile.url)}
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
