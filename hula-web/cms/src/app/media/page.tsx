'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Upload, Button, Space, message, Modal, Input, Empty, Spin, Tooltip, Typography, Popconfirm, Tag, Checkbox, Pagination } from 'antd';
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
    LinkOutlined,
    StopOutlined,
    DownloadOutlined,
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
    const [usageMap, setUsageMap] = useState<Record<string, Array<{ type: string; id?: number; label: string }>>>({});
    const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(48);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, usageFilter, viewMode]);

    const loadFiles = useCallback(async () => {
        try {
            setLoading(true);
            const [filesRes, usageRes] = await Promise.all([
                uploadApi.listFiles(),
                uploadApi.imageUsage()
            ]);
            setFiles(filesRes.data || []);
            setUsageMap(usageRes.data || {});
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

    const handleDeleteSelected = () => {
        Modal.confirm({
            title: `Xóa ${selectedKeys.length} hình ảnh đã chọn?`,
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    setLoading(true);
                    for (const key of selectedKeys) {
                        await uploadApi.deleteFile(key);
                    }
                    message.success(`Đã xóa ${selectedKeys.length} hình ảnh`);
                    setSelectedKeys([]);
                    loadFiles();
                } catch {
                    message.error('Có lỗi xảy ra khi xóa một số hình ảnh');
                    loadFiles();
                }
            }
        });
    };

    const toggleSelection = (name: string) => {
        setSelectedKeys(prev => 
            prev.includes(name) ? prev.filter(k => k !== name) : [...prev, name]
        );
    };

    const handleDownload = async (file: UploadedFile) => {
        try {
            const url = resolveUrl(file.url);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            message.error(`Không thể tải xuống ${file.name}`);
        }
    };

    const handleDownloadSelected = async () => {
        if (selectedKeys.length === 0) return;
        message.info(`Đang tải xuống ${selectedKeys.length} hình ảnh...`);
        const selectedFiles = files.filter(f => selectedKeys.includes(f.name));
        for (let i = 0; i < selectedFiles.length; i++) {
            await handleDownload(selectedFiles[i]);
            // Small delay to prevent browser from blocking multiple downloads
            if (i < selectedFiles.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        message.success('Đã tải xuống hoàn tất');
    };

    const handleSelectAllUnused = () => {
        const unusedFiles = filteredFiles.filter(f => getFileUsage(f.name).length === 0);
        const newSelected = [...selectedKeys];
        unusedFiles.forEach(f => {
            if (!newSelected.includes(f.name)) newSelected.push(f.name);
        });
        setSelectedKeys(newSelected);
        message.success(`Đã chọn thêm ${unusedFiles.length} hình chưa dùng trong danh sách`);
    };

    const handleCopyUrl = (file: UploadedFile) => {
        const url = resolveUrl(file.url);
        navigator.clipboard.writeText(url);
        message.success('Đã copy URL');
    };

    const getFileUsage = (name: string) => usageMap[name] || [];

    const filteredFiles = files.filter(f => {
        const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (usageFilter === 'used') return getFileUsage(f.name).length > 0;
        if (usageFilter === 'unused') return getFileUsage(f.name).length === 0;
        return true;
    });

    const usedCount = files.filter(f => getFileUsage(f.name).length > 0).length;
    const unusedCount = files.length - usedCount;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedFiles = filteredFiles.slice(startIndex, startIndex + pageSize);

    return (
        <AdminLayout>
            <Card
                title={
                    <Space>
                        <span style={{ fontSize: 20 }}>🖼️</span>
                        <span>Quản lý Hình ảnh</span>
                        <Space>
                        <Tag color="blue">{files.length} files</Tag>
                        <Tag color="green">{usedCount} đang dùng</Tag>
                        <Tag color="default">{unusedCount} chưa dùng</Tag>
                    </Space>
                    </Space>
                }
                extra={
                    <Space style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {selectedKeys.length > 0 && (
                            <Space style={{ marginRight: 16 }}>
                                <Text strong type="danger">{selectedKeys.length} đã chọn</Text>
                                <Button size="small" onClick={() => setSelectedKeys([])}>Bỏ chọn</Button>
                                <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadSelected}>Tải xuống</Button>
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDeleteSelected}>Xóa</Button>
                            </Space>
                        )}
                        <Tooltip title="Chọn tất cả hình chưa sử dụng đang hiển thị">
                            <Button size="small" onClick={handleSelectAllUnused}>Chọn tất cả chưa dùng</Button>
                        </Tooltip>
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Button.Group>
                            <Tooltip title="Tất cả">
                                <Button
                                    type={usageFilter === 'all' ? 'primary' : 'default'}
                                    onClick={() => setUsageFilter('all')}
                                >
                                    Tất cả
                                </Button>
                            </Tooltip>
                            <Tooltip title="Đang sử dụng">
                                <Button
                                    icon={<LinkOutlined />}
                                    type={usageFilter === 'used' ? 'primary' : 'default'}
                                    onClick={() => setUsageFilter('used')}
                                />
                            </Tooltip>
                            <Tooltip title="Chưa sử dụng">
                                <Button
                                    icon={<StopOutlined />}
                                    type={usageFilter === 'unused' ? 'primary' : 'default'}
                                    onClick={() => setUsageFilter('unused')}
                                />
                            </Tooltip>
                        </Button.Group>
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
                        {paginatedFiles.map((file) => (
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
                                        position: 'relative',
                                    }}
                                    onClick={() => setPreviewFile(file)}
                                >
                                    <div 
                                        style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(file.name); }}
                                    >
                                        <Checkbox checked={selectedKeys.includes(file.name)} />
                                    </div>
                                    <img
                                        src={resolveUrl(file.url)}
                                        alt={file.name}
                                        loading="lazy"
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
                                    {(() => {
                                        const usage = getFileUsage(file.name);
                                        return usage.length > 0 ? (
                                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                {usage.slice(0, 2).map((u, i) => (
                                                    <Tag key={i} color="green" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>{u.type}</Tag>
                                                ))}
                                                {usage.length > 2 && <Tag style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>+{usage.length - 2}</Tag>}
                                            </div>
                                        ) : (
                                            <Tag color="default" style={{ fontSize: 10, lineHeight: '16px', marginTop: 4 }}>Chưa dùng</Tag>
                                        );
                                    })()}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(file.size)}</Text>
                                        <Space size={4}>
                                            <Tooltip title="Tải xuống">
                                                <Button type="text" size="small" icon={<DownloadOutlined />} onClick={(e) => { e.stopPropagation(); handleDownload(file); }} />
                                            </Tooltip>
                                            <Tooltip title="Copy URL">
                                                <Button type="text" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); handleCopyUrl(file); }} />
                                            </Tooltip>
                                            <Popconfirm
                                                title={getFileUsage(file.name).length > 0 ? `⚠️ Hình này đang được sử dụng tại ${getFileUsage(file.name).length} nơi. Xóa?` : 'Xóa hình này?'}
                                                onConfirm={() => handleDelete(file.name)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                okButtonProps={getFileUsage(file.name).length > 0 ? { danger: true } : {}}
                                            >
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
                        {paginatedFiles.map((file) => (
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
                                <Checkbox 
                                    checked={selectedKeys.includes(file.name)} 
                                    onChange={() => toggleSelection(file.name)} 
                                />
                                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                                    <img src={resolveUrl(file.url)} alt={file.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text ellipsis style={{ fontSize: 13 }}>{file.name}</Text>
                                </div>
                                <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{formatSize(file.size)}</Text>
                                <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{new Date(file.modified).toLocaleDateString('vi-VN')}</Text>
                                <div style={{ flexShrink: 0 }}>
                                    {(() => {
                                        const usage = getFileUsage(file.name);
                                        return usage.length > 0 ? (
                                            <Tooltip title={usage.map(u => `${u.type}: ${u.label}`).join('\n')}>
                                                <Tag color="green" style={{ cursor: 'help' }}><LinkOutlined /> {usage.length}</Tag>
                                            </Tooltip>
                                        ) : (
                                            <Tag color="default">Chưa dùng</Tag>
                                        );
                                    })()}
                                </div>
                                <Space size={4}>
                                    <Tooltip title="Xem"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreviewFile(file)} /></Tooltip>
                                    <Tooltip title="Tải xuống"><Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(file)} /></Tooltip>
                                    <Tooltip title="Copy URL"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyUrl(file)} /></Tooltip>
                                    <Popconfirm
                                        title={getFileUsage(file.name).length > 0 ? `⚠️ Hình này đang được sử dụng tại ${getFileUsage(file.name).length} nơi. Xóa?` : 'Xóa hình này?'}
                                        onConfirm={() => handleDelete(file.name)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={getFileUsage(file.name).length > 0 ? { danger: true } : {}}
                                    >
                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && filteredFiles.length > 0 && (
                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredFiles.length}
                            onChange={(page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            }}
                            showSizeChanger
                            pageSizeOptions={['24', '48', '96', '200']}
                            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} hình ảnh`}
                        />
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
                            <Button icon={<DownloadOutlined />} onClick={() => handleDownload(previewFile)}>
                                Tải xuống
                            </Button>
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
                        {(() => {
                            const usage = getFileUsage(previewFile.name);
                            return usage.length > 0 ? (
                                <div style={{ marginTop: 12, padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
                                    <Text strong style={{ fontSize: 13 }}><LinkOutlined /> Đang sử dụng tại {usage.length} nơi:</Text>
                                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {usage.map((u, i) => (
                                            <div key={i} style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <Tag color="green" style={{ margin: 0 }}>{u.type}</Tag>
                                                <span>{u.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 12, padding: '12px 16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}>
                                    <Text type="warning" style={{ fontSize: 13 }}><StopOutlined /> Hình ảnh này chưa được sử dụng trong bài viết, sản phẩm hay trang nào.</Text>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
