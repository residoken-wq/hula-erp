import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { List, Avatar, Button, message, Tabs, Tag, Empty } from 'antd';
import { UserOutlined, MessageOutlined, EyeInvisibleOutlined, EyeOutlined, TeamOutlined, CustomerServiceOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import quill-mention - it auto-registers with Quill
import 'quill-mention';
import 'quill-mention/dist/quill.mention.css';

import { API_URL } from '../../config';
import api from '../../utils/api';
import useMobile from '../../hooks/useMobile';
import './SalesComments.css';

interface User {
    id: number;
    full_name: string;
    avatar_url?: string;
}

interface Comment {
    id: number;
    sender_type: 'STAFF' | 'CUSTOMER';
    sender_name: string;
    content: string;
    is_visible: boolean;
    comment_type: 'CUSTOMER' | 'INTERNAL';
    mentioned_user_ids?: string;
    created_at: string;
    deleted_at?: string;
}

const SalesComments: React.FC<{ orderId: number }> = ({ orderId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'INTERNAL'>('CUSTOMER');
    const [users, setUsers] = useState<User[]>([]);
    const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set());
    const isMobile = useMobile();
    const quillRef = useRef<ReactQuill>(null);

    // Fetch comments
    const fetchComments = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/${orderId}/comments`);
            setComments(res.data);
        } catch (e) {
            console.error('Failed to fetch comments:', e);
        }
    };

    // Fetch users for mentions
    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) {
            console.error('Failed to fetch users for mentions:', e);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchComments();
            fetchUsers();
        }
    }, [orderId]);

    // Filter comments by tab
    const filteredComments = comments.filter(c =>
        c.comment_type === activeTab || (!c.comment_type && activeTab === 'CUSTOMER')
    );

    // Extract mentioned user IDs from Quill content
    const extractMentionedUserIds = useCallback((html: string): string[] => {
        const ids: string[] = [];
        // Match data-id attributes in mention spans
        const regex = /data-id="(\d+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            ids.push(match[1]);
        }
        return [...new Set(ids)];
    }, []);

    // Send/Update comment
    const send = async () => {
        // Strip HTML tags to check if empty
        const stripped = text.replace(/<[^>]*>?/gm, '').trim();
        if (!stripped) return;

        // Extract mentioned users from content
        const mentionIds = extractMentionedUserIds(text);

        try {
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
                    mentioned_user_ids: mentionIds.join(',')
                });

                if (mentionIds.length > 0) {
                    message.success(`Đã gửi và thông báo cho ${mentionIds.length} người`);
                }
            }
            setText('');
            setMentionedUserIds(new Set());
            fetchComments();
        } catch (e) {
            message.error('Gửi tin nhắn thất bại');
        }
    };

    // Toggle visibility
    const toggle = async (id: number) => {
        await axios.post(`${API_URL}/sales/comment/${id}/toggle`);
        fetchComments();
    };

    // Edit comment
    const handleEdit = (item: Comment) => {
        setText(item.content);
        setEditingId(item.id);
    };

    // Cancel edit
    const cancelEdit = () => {
        setText('');
        setEditingId(null);
    };

    // --- IMAGE COMPRESSION UTILITY ---
    const compressImage = async (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

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

    // --- UPLOAD IMAGE ---
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
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // --- IMAGE BUTTON HANDLER ---
    const imageHandler = useCallback(() => {
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
    }, []);

    // --- QUILL MODULES with MENTION ---
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        },
        mention: {
            allowedChars: /^[A-Za-z\sÀ-ỹ0-9]*$/,
            mentionDenotationChars: ['@'],
            showDenotationChar: false,
            spaceAfterInsert: true,
            defaultMenuOrientation: 'bottom',
            dataAttributes: ['id', 'value', 'denotationChar'],
            renderItem: (item: any) => {
                const initials = item.value.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                return `<div class="mention-item">
                    <span class="mention-avatar">${initials}</span>
                    <span>${item.value}</span>
                </div>`;
            },
            source: (searchTerm: string, renderList: Function, mentionChar: string) => {
                const matches = users.filter(u =>
                    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                renderList(matches.map(u => ({
                    id: u.id,
                    value: u.full_name
                })), searchTerm);
            },
            onSelect: (item: any, insertItem: Function) => {
                insertItem(item);
                // Track mentioned user (for UI preview)
                setMentionedUserIds(prev => new Set([...prev, String(item.id)]));
            }
        }
    }), [users, imageHandler]);

    // Get user name by ID
    const getUserName = (id: string): string => {
        const user = users.find(u => String(u.id) === id);
        return user ? user.full_name : `User ${id}`;
    };

    return (
        <div className="sales-comments-container">
            <Tabs
                className="chat-tabs"
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as 'CUSTOMER' | 'INTERNAL')}
                items={[
                    {
                        key: 'CUSTOMER',
                        label: <span><CustomerServiceOutlined /> {!isMobile && 'Chat Khách Hàng'}</span>,
                    },
                    {
                        key: 'INTERNAL',
                        label: <span><TeamOutlined /> {!isMobile && 'Chat Nội Bộ'}</span>,
                    }
                ]}
            />

            {/* Comments List */}
            <div className="comments-list">
                {filteredComments.length === 0 ? (
                    <Empty description="Chưa có tin nhắn" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <List
                        dataSource={filteredComments}
                        renderItem={(item: Comment) => (
                            <div className={`comment-item ${item.sender_type === 'STAFF' ? 'staff' : 'customer'}`}>
                                <div className="comment-header">
                                    <span className="comment-sender">
                                        <Avatar
                                            size="small"
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: item.sender_type === 'STAFF' ? '#1890ff' : '#52c41a' }}
                                        />
                                        {item.sender_name}
                                        <Tag color={item.sender_type === 'STAFF' ? 'blue' : 'green'} style={{ marginLeft: 4 }}>
                                            {item.sender_type === 'STAFF' ? 'NV' : 'KH'}
                                        </Tag>
                                    </span>
                                    <span className="comment-time">
                                        {dayjs(item.created_at).format('DD/MM HH:mm')}
                                    </span>
                                </div>
                                <div
                                    className="comment-content"
                                    dangerouslySetInnerHTML={{ __html: item.content }}
                                />
                                <div className="comment-actions">
                                    {activeTab === 'CUSTOMER' && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={item.is_visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                            onClick={() => toggle(item.id)}
                                        >
                                            {item.is_visible ? 'Hiện' : 'Ẩn'}
                                        </Button>
                                    )}
                                    {item.sender_type === 'STAFF' && (
                                        <Button type="link" size="small" onClick={() => handleEdit(item)}>
                                            Sửa
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                )}
            </div>

            {/* Editor Section */}
            <div className="editor-section">
                {/* Mentioned users preview (for Internal chat) */}
                {activeTab === 'INTERNAL' && mentionedUserIds.size > 0 && (
                    <div className="mentioned-preview">
                        <span className="label">📢 Sẽ thông báo:</span>
                        {[...mentionedUserIds].map(id => (
                            <span key={id} className="user-tag">@{getUserName(id)}</span>
                        ))}
                    </div>
                )}

                {/* Hint for Internal chat */}
                {activeTab === 'INTERNAL' && (
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>
                        💡 Gõ <strong>@</strong> để mention đồng nghiệp
                    </div>
                )}

                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={text}
                    onChange={setText}
                    modules={modules}
                    placeholder={activeTab === 'INTERNAL' ? 'Nhập nội dung chat nội bộ... (Gõ @ để mention)' : 'Nhập nội dung trả lời khách hàng...'}
                />
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                {editingId && (
                    <Button onClick={cancelEdit}>Hủy</Button>
                )}
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={send}
                >
                    {editingId ? 'Cập nhật' : 'Gửi'}
                </Button>
            </div>
        </div>
    );
};

export default SalesComments;