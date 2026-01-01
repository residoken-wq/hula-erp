import React, { useState, useRef, useEffect } from 'react';
import { FloatButton, Drawer, Input, Button, List, Avatar, Tag, Space, Typography } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../utils/api';

interface Message {
    id: string;
    sender: 'USER' | 'BOT';
    text: string;
    timestamp: Date;
}

const AiChatWidget: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', sender: 'BOT', text: 'Xin chào! Tôi là trợ lý ảo Hula. Tôi có thể giúp gì cho bạn? (Thử "Tồn kho [Mã]", "Doanh thu tháng 12")', timestamp: new Date() }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'USER', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg.text });
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'BOT',
                text: res.data.text || 'Xin lỗi, tôi không hiểu.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'BOT', text: 'Có lỗi xảy ra khi kết nối máy chủ.', timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <>
            <FloatButton
                icon={<RobotOutlined />}
                type="primary"
                style={{ right: 24, bottom: 80 }}
                onClick={() => setOpen(true)}
                tooltip="Trợ lý ảo AI"
            />

            <Drawer
                title={<span><RobotOutlined style={{ color: '#1890ff' }} /> Hula AI Assistant</span>}
                placement="right"
                onClose={() => setOpen(false)}
                open={open}
                width={350}
                bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}
                mask={false} // Allow interacting with BG
            >
                {/* Chat Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f5f5f5' }}>
                    <List
                        dataSource={messages}
                        renderItem={item => (
                            <List.Item style={{ border: 'none', padding: '4px 0', justifyContent: item.sender === 'USER' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '85%',
                                    display: 'flex',
                                    flexDirection: item.sender === 'USER' ? 'row-reverse' : 'row',
                                    gap: 8
                                }}>
                                    <Avatar
                                        size="small"
                                        icon={item.sender === 'USER' ? <UserOutlined /> : <RobotOutlined />}
                                        style={{ backgroundColor: item.sender === 'USER' ? '#87d068' : '#1890ff', flexShrink: 0 }}
                                    />
                                    <div style={{
                                        background: item.sender === 'USER' ? '#95de64' : '#fff',
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        whiteSpace: 'pre-wrap',
                                        fontSize: 13
                                    }}>
                                        {item.text}
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: 12, background: '#fff', borderTop: '1px solid #ebd9d9' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Input
                            placeholder="Nhập yêu cầu..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} />
                    </div>
                </div>
            </Drawer>
        </>
    );
};

export default AiChatWidget;
