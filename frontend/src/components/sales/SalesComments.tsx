import React, { useEffect, useState } from 'react';
import { List, Avatar, Button, message, Tabs, Mentions } from 'antd';
import { UserOutlined, MessageOutlined, EyeInvisibleOutlined, EyeOutlined, TeamOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { API_URL } from '../../config';
import api from '../../utils/api';
import useMobile from '../../hooks/useMobile';

const SalesComments: React.FC<{ orderId: number }> = ({ orderId }) => {
    const [comments, setComments] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'INTERNAL'>('CUSTOMER');
    const [users, setUsers] = useState<any[]>([]);
    const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
    const isMobile = useMobile();

    const fetchComments = async () => {
        try { const res = await axios.get(`${API_URL}/sales/${orderId}/comments`); setComments(res.data); } catch (e) { }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) {
            console.error('Failed to fetch users for mentions:', e);
        }
    };

    useEffect(() => { if (orderId) { fetchComments(); fetchUsers(); } }, [orderId]);

    const filteredComments = comments.filter(c => c.comment_type === activeTab || (!c.comment_type && activeTab === 'CUSTOMER'));

    const send = async () => {
        // Strip HTML tags to check if empty
        const stripped = text.replace(/<[^>]*>?/gm, '').trim();
        if (!stripped) return;

        if (editingId) {
            await axios.put(`${API_URL}/sales/comment/${editingId}`, { content: text });
            message.success('Cập nhật tin nhắn thành công');
            setEditingId(null);
        } else {
            await axios.post(`${API_URL}/sales/${orderId}/comment`, {
                content: text,
                sender: 'STAFF',
                name: 'Nhân viên',
                comment_type: activeTab,
                mentioned_user_ids: mentionedUserIds.join(',')
            });
        }
        setText('');
        setMentionedUserIds([]);
        fetchComments();
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

    // --- IMAGE COMPRESSION UTILITY ---
    const compressImage = async (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // Only resize if larger than maxWidth
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name || 'pasted-image.jpg', { type: 'image/jpeg' });
                        console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    // --- UPLOAD IMAGE (with compression) ---
    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            message.loading({ content: 'Đang nén và upload ảnh...', key: 'upload' });
            const compressed = await compressImage(file);
            const formData = new FormData();
            formData.append('file', compressed);

            const res = await axios.post(`${API_URL}/upload/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            message.success({ content: 'Upload ảnh thành công!', key: 'upload', duration: 2 });
            return res.data.url;
        } catch (e) {
            message.error({ content: 'Upload ảnh thất bại', key: 'upload' });
            return null;
        }
    };

    // --- PASTE EVENT HANDLER ---
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        const url = await uploadImage(file);
                        if (url) {
                            const quill = (quillRef.current as any)?.getEditor();
                            const range = quill?.getSelection();
                            if (quill) {
                                const index = range ? range.index : quill.getLength();
                                quill.insertEmbed(index, 'image', url);
                                quill.setSelection(index + 1);
                            }
                        }
                    }
                    break; // Only handle first image
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // --- IMAGE BUTTON HANDLER (File Picker) ---
    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (file) {
                const url = await uploadImage(file);
                if (url) {
                    const quill = (quillRef.current as any)?.getEditor();
                    const range = quill?.getSelection();
                    if (quill && range) {
                        quill.insertEmbed(range.index, 'image', url);
                    }
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
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as 'CUSTOMER' | 'INTERNAL')}
                items={[
                    {
                        key: 'CUSTOMER',
                        label: <span><CustomerServiceOutlined /> Chat Khách Hàng</span>,
                    },
                    {
                        key: 'INTERNAL',
                        label: <span><TeamOutlined /> Chat Nội Bộ</span>,
                    }
                ]}
            />

            <div style={{ maxHeight: 300, overflowY: 'auto', background: '#fafafa', padding: 10, borderRadius: 8, marginBottom: 10, border: '1px solid #eee' }}>
                <List dataSource={filteredComments} renderItem={(item: any) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: item.sender_type === 'STAFF' ? '#1890ff' : '#87d068' }} />}
                            title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.sender_name} ({item.sender_type})</span><span style={{ fontSize: 11, color: '#999' }}>{dayjs(item.created_at).format('DD/MM HH:mm')}</span></div>}
                            description={
                                <div>
                                    <div style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                    {activeTab === 'CUSTOMER' && (
                                        <div style={{ marginTop: 5 }}>
                                            <Button type="text" size="small" icon={item.is_visible ? <EyeOutlined /> : <EyeInvisibleOutlined />} onClick={() => toggle(item.id)}>{item.is_visible ? 'Hiện ở Portal' : 'Ẩn ở Portal'}</Button>
                                            {item.sender_type === 'STAFF' && (
                                                <Button type="link" size="small" onClick={() => handleEdit(item)}>Sửa</Button>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'INTERNAL' && item.sender_type === 'STAFF' && (
                                        <Button type="link" size="small" onClick={() => handleEdit(item)}>Sửa</Button>
                                    )}
                                </div>
                            }
                        />
                    </List.Item>
                )} />
            </div>

            {/* Editor Section - Different for each tab */}
            <div style={{ marginBottom: 10 }}>
                {activeTab === 'INTERNAL' && (
                    // INTERNAL: Show @mention user selector above editor
                    <div style={{ marginBottom: 8 }}>
                        <Mentions
                            style={{ width: '100%' }}
                            placeholder="Gõ @ để mention đồng nghiệp..."
                            prefix="@"
                            onSelect={(option) => {
                                const selectedUser = users.find((u: any) => u.full_name === option.value);
                                if (selectedUser && !mentionedUserIds.includes(String(selectedUser.id))) {
                                    setMentionedUserIds([...mentionedUserIds, String(selectedUser.id)]);
                                    message.info(`Đã tag @${selectedUser.full_name}`);
                                }
                            }}
                            options={users.map((u: any) => ({
                                value: u.full_name,
                                label: u.full_name,
                                key: String(u.id),
                            }))}
                        />
                        {mentionedUserIds.length > 0 && (
                            <div style={{ marginTop: 4, fontSize: 12, color: '#1890ff' }}>
                                📢 Sẽ thông báo: {mentionedUserIds.map(id => {
                                    const user = users.find((u: any) => String(u.id) === id);
                                    return user ? `@${user.full_name}` : '';
                                }).filter(Boolean).join(', ')}
                            </div>
                        )}
                    </div>
                )}

                {/* ReactQuill for both CUSTOMER and INTERNAL */}
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={text}
                    onChange={setText}
                    modules={modules}
                    style={{ background: 'white', minHeight: '100px' }}
                    placeholder={activeTab === 'INTERNAL' ? 'Nhập nội dung chat nội bộ...' : 'Nhập nội dung trả lời khách hàng...'}
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