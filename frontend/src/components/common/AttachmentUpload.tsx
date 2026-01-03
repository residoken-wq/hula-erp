import React, { useState } from 'react';
import { Upload, Button, message, Popover, Image } from 'antd';
import { UploadOutlined, FileOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { API_URL } from '../../config';
import axios from 'axios';

interface Props {
    value?: string[]; // Array of file URLs
    onChange?: (urls: string[]) => void;
    maxFiles?: number;
    title?: string;
}

const AttachmentUpload: React.FC<Props> = ({ value = [], onChange, maxFiles = 5, title = "Đính kèm chứng từ" }) => {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;

        if (value.length >= maxFiles) {
            message.error(`Chỉ được tải lên tối đa ${maxFiles} file.`);
            onError("Max files exceeded");
            return;
        }

        const isLt1M = file.size / 1024 / 1024 < 1;
        if (!isLt1M) {
            message.error('File phải nhỏ hơn 1MB!');
            onError("File too large");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/upload/file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newUrl = res.data.url;
            const newFileList = [...value, newUrl];
            if (onChange) onChange(newFileList);
            onSuccess("Ok");
            message.success('Tải lên thành công');
        } catch (err) {
            message.error('Lỗi tải lên file');
            onError(err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index: number) => {
        const newFileList = [...value];
        newFileList.splice(index, 1);
        if (onChange) onChange(newFileList);
    };

    const getDownloadUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        // Extract just the filename from any path format
        const filename = path.split('/').pop();
        if (!filename) return '';

        // Always use the controller endpoint since static serving isn't configured on production
        return `${API_URL}/upload/files/${filename}`;
    };

    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>
                    <PaperClipOutlined /> {title} ({value.length}/{maxFiles})
                </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <Image.PreviewGroup>
                    {value.map((url, index) => {
                        const fileName = url ? url.split('/').pop() : 'file';
                        const fullUrl = getDownloadUrl(url);
                        // Improved isImage detection - check filename for common extensions
                        const isImage = fileName ? /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName) : false;

                        return (
                            <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                <Popover content={fileName} trigger="hover">
                                    {isImage ? (
                                        <div style={{
                                            width: 40, height: 40,
                                            border: '1px solid #d9d9d9',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}>
                                            <Image
                                                width={40}
                                                height={40}
                                                src={fullUrl}
                                                style={{ objectFit: 'cover' }}
                                                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='%23f5f5f5' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23bbb'%3E?%3C/text%3E%3C/svg%3E"
                                            />
                                        </div>
                                    ) : (
                                        <a
                                            href={fullUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 40,
                                                height: 40,
                                                border: '1px solid #d9d9d9',
                                                borderRadius: 4,
                                                background: '#fafafa',
                                                color: '#1890ff',
                                                fontSize: 20
                                            }}
                                        >
                                            <FileOutlined />
                                        </a>
                                    )}
                                </Popover>
                                {onChange && maxFiles > 0 && (
                                    <Button
                                        type="text"
                                        size="small"
                                        style={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            background: 'white',
                                            border: '1px solid #eee',
                                            borderRadius: '50%',
                                            width: 16,
                                            height: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0,
                                            fontSize: 10,
                                            color: 'red',
                                            zIndex: 10,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        onClick={() => handleRemove(index)}
                                    >
                                        <DeleteOutlined />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </Image.PreviewGroup>

                <Upload
                    customRequest={handleUpload}
                    showUploadList={false}
                    multiple={false}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                >
                    <Button icon={<UploadOutlined />} loading={uploading} disabled={value.length >= maxFiles} type="dashed" style={{ height: 40, width: 40, padding: 0 }} />
                </Upload>
            </div>
        </div>
    );
};

export default AttachmentUpload;
