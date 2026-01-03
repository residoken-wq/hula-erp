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

    const renderFileList = () => (
        <List
            size="small"
            dataSource={value}
            renderItem={(url, index) => {
                const fileName = url.split('/').pop();
                return (
                    <List.Item
                        actions={[
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(index)} />
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<FileOutlined />}
                            title={<a href={`${API_URL}${url}`} target="_blank" rel="noopener noreferrer">{fileName}</a>}
                        />
                    </List.Item>
                );
            }}
        />
    );

    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>
                    <PaperClipOutlined /> {title} ({value.length}/{maxFiles})
                </span>
            </div>

            <Upload
                customRequest={handleUpload}
                showUploadList={false}
                multiple={false}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
            >
                <Button icon={<UploadOutlined />} loading={uploading} disabled={value.length >= maxFiles}>
                    Thêm file
                </Button>
            </Upload>

            {value.length > 0 && (
                <div style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 4, padding: '4px 8px', background: '#fafafa' }}>
                    {renderFileList()}
                </div>
            )}
        </div>
    );
};

export default AttachmentUpload;
