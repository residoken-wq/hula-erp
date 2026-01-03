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

    const fetchComments = async () => {
        try { const res = await axios.get(`${API_URL}/sales/${orderId}/comments`); setComments(res.data); } catch (e) { }
    };

    useEffect(() => { if (orderId) fetchComments(); }, [orderId]);

    const send = async () => {
        // Strip HTML tags to check if empty
        const stripped = text.replace(/<[^>]*>?/gm, '').trim();
        if (!stripped) return;

        await axios.post(`${API_URL}/sales/${orderId}/comment`, { content: text, sender: 'STAFF', name: 'Nhân viên' });
        setText(''); fetchComments();
    };

    const toggle = async (id: number) => { await axios.post(`${API_URL}/sales/comment/${id}/toggle`); fetchComments(); };

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
                                    {item.sender_type === 'CUSTOMER' && <Button type="text" size="small" icon={item.is_visible ? <EyeOutlined /> : <EyeInvisibleOutlined />} onClick={() => toggle(item.id)}>{item.is_visible ? 'Hiện' : 'Ẩn'}</Button>}
                                </div>
                            }
                        />
                    </List.Item>
                )} />
            </div>

            <div style={{ marginBottom: 10 }}>
                {/* ReactQuill Editor */}
                <ReactQuill
                    theme="snow"
                    value={text}
                    onChange={setText}
                    style={{ background: 'white', minHeight: '100px' }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<MessageOutlined />} onClick={send}>Gửi</Button>
            </div>
        </div>
    );
};
export default SalesComments;