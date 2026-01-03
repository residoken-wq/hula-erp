import React, { useEffect, useState } from 'react';
import { List, Avatar, Button, message } from 'antd';
import { UserOutlined, MessageOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { API_URL } from '../../config';

const SalesComments: React.FC<{ orderId: number }> = ({ orderId }) => {
    const [comments, setComments] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchComments = async () => {
        try { const res = await axios.get(`${API_URL}/sales/${orderId}/comments`); setComments(res.data); } catch (e) { }
    };

    useEffect(() => { if (orderId) fetchComments(); }, [orderId]);

    const send = async () => {
        // Strip HTML tags to check if empty
        const stripped = text.replace(/<[^>]*>?/gm, '').trim();
        if (!stripped) return;

        if (editingId) {
            await axios.put(`${API_URL}/sales/comment/${editingId}`, { content: text });
            message.success('Cập nhật tin nhắn thành công');
            setEditingId(null);
        } else {
            await axios.post(`${API_URL}/sales/${orderId}/comment`, { content: text, sender: 'STAFF', name: 'Nhân viên' });
        }
        setText(''); fetchComments();
    };

    const toggle = async (id: number) => { await axios.post(`${API_URL}/sales/comment/${id}/toggle`); fetchComments(); };

    const handleEdit = (item: any) => {
        setText(item.content);
        setEditingId(item.id);
    };

    const cancelEdit = () => {
        setText('');
        setEditingId(null);
    };

    const quillRef = React.useRef<ReactQuill>(null);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                try {
                    const res = await axios.post(`${API_URL}/upload/image`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    const baseUrl = API_URL.replace(/\/api$/, '');
                    const url = `${baseUrl}${res.data.url}`; // Static files served at base URL, not /api
                    const quill = (quillRef.current as any)?.getEditor();
                    const range = quill?.getSelection();
                    if (quill && range) {
                        quill.insertEmbed(range.index, 'image', url);
                    }
                } catch (e) {
                    message.error('Upload ảnh thất bại');
                }
            }
        };
    };

    const modules = React.useMemo(() => ({
        toolbar: {
            container: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), []);

    return (
        <div>
            <div style={{ maxHeight: 300, overflowY: 'auto', background: '#fafafa', padding: 10, borderRadius: 8, marginBottom: 10, border: '1px solid #eee' }}>
                <List dataSource={comments} renderItem={(item: any) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: item.sender_type === 'STAFF' ? '#1890ff' : '#87d068' }} />}
                            title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.sender_name} ({item.sender_type})</span><span style={{ fontSize: 11, color: '#999' }}>{dayjs(item.created_at).format('DD/MM HH:mm')}</span></div>}
                            description={
                                <div>
                                    <div style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                    <div style={{ marginTop: 5 }}>
                                        <Button type="text" size="small" icon={item.is_visible ? <EyeOutlined /> : <EyeInvisibleOutlined />} onClick={() => toggle(item.id)}>{item.is_visible ? 'Hiện ở Portal' : 'Ẩn ở Portal'}</Button>
                                        {item.sender_type === 'STAFF' && (
                                            <Button type="link" size="small" onClick={() => handleEdit(item)}>Sửa</Button>
                                        )}
                                    </div>
                                </div>
                            }
                        />
                    </List.Item>
                )} />
            </div>

            <div style={{ marginBottom: 10 }}>
                {/* ReactQuill Editor */}
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={text}
                    onChange={setText}
                    modules={modules}
                    style={{ background: 'white', minHeight: '100px' }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {editingId && <Button onClick={cancelEdit}>Hủy</Button>}
                <Button type="primary" icon={<MessageOutlined />} onClick={send}>{editingId ? 'Cập nhật' : 'Gửi'}</Button>
            </div>
        </div>
    );
};
export default SalesComments;