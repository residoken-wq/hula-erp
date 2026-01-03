import React, { useState } from 'react';
import { Upload, Button, message, Popover, List } from 'antd';
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
        if (path.startsWith('http')) return path;
        // Fix for legacy data: remove '/api' prefix from stored path if present, 
        // because API_URL already includes '/api'
        const cleanPath = path.replace(/^\/api/, '');
        return `${API_URL}${cleanPath}`;
    };

    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>
                    <PaperClipOutlined /> {title} ({value.length}/{maxFiles})
                </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {value.map((url, index) => {
                    const fileName = url.split('/').pop();
                    const fullUrl = getDownloadUrl(url);
                    return (
                        <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                            <Popover content={fileName} trigger="hover">
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
                            </Popover>
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
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onClick={() => handleRemove(index)}
                            >
                                <DeleteOutlined />
                            </Button>
                        </div>
                    );
                })}


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
