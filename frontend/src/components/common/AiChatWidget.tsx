import React, { useState, useRef, useEffect } from 'react';
import { FloatButton, Drawer, Input, Button, List, Avatar, Tag, Space, Typography } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined, LikeOutlined, DislikeOutlined, AudioOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import { API_URL } from '../../config';

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
    const [isListening, setIsListening] = useState(false);
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

        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, sender: 'BOT', text: '', timestamp: new Date() }]);

        try {
            const token = localStorage.getItem('token');
            const apiUrl = API_URL;
            const response = await fetch(`${apiUrl}/ai/chat-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    message: userMsg.text,
                    contextUrl: window.location.pathname
                })
            });

            if (!response.ok) {
                throw new Error("Lỗi kết nối API");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder('utf-8');

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.replace('data: ', '').trim();
                            if (dataStr === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.text) {
                                    setMessages(prev => prev.map(m => 
                                        m.id === botMsgId ? { ...m, text: m.text + parsed.text } : m
                                    ));
                                } else if (parsed.error) {
                                    setMessages(prev => prev.map(m => 
                                        m.id === botMsgId ? { ...m, text: m.text + '\n[Lỗi: ' + parsed.error + ']' } : m
                                    ));
                                }
                            } catch (e) {
                                // ignore JSON parse error for incomplete chunks
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => prev.map(m => 
                m.id === botMsgId ? { ...m, text: m.text + '\n[Có lỗi xảy ra khi kết nối máy chủ]' } : m
            ));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    const toggleListen = async () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        // Kiểm tra permission trước
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            }
        } catch (err) {
            alert('Lỗi: Bạn cần cấp quyền sử dụng Microphone cho trình duyệt để dùng tính năng này.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert('Quyền truy cập Microphone bị từ chối.');
            }
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.start();
    };


    const handleFeedback = async (msgId: string, rating: 'GOOD' | 'BAD') => {
        try {
            const token = localStorage.getItem('token');
            const botMsg = messages.find(m => m.id === msgId);
            const userMsg = messages.slice().reverse().find((m, index) => m.sender === 'USER' && messages.indexOf(m) < messages.indexOf(botMsg!));
            
            if (!botMsg || !userMsg) return;

            let correction = undefined;
            if (rating === 'BAD') {
                correction = prompt('Bạn mong đợi AI trả lời như thế nào?');
                if (!correction && correction !== "") return; // Cancelled
            }

            await fetch(`${API_URL}/ai/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageId: msgId,
                    rating,
                    question: userMsg.text,
                    answer: botMsg.text,
                    correction
                })
            });
            alert('Cảm ơn bạn đã góp ý!');
        } catch (e) {
            console.error('Error sending feedback:', e);
        }
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
                width={window.innerWidth > 768 ? '30vw' : 350}
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
                                    }} dangerouslySetInnerHTML={{
                                        __html: item.text
                                            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    }}>
                                    </div>
                                    {item.sender === 'BOT' && item.id !== '0' && (
                                        <div style={{ marginTop: 4, display: 'flex', gap: 4, justifyContent: 'flex-start', width: '100%' }}>
                                            <Button type="text" size="small" icon={<LikeOutlined />} onClick={() => handleFeedback(item.id, 'GOOD')} />
                                            <Button type="text" size="small" icon={<DislikeOutlined />} onClick={() => handleFeedback(item.id, 'BAD')} />
                                        </div>
                                    )}
                                </div>
                            </List.Item>
                        )}
                    />
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div style={{ padding: '8px 12px', background: '#fafafa', borderTop: '1px solid #ebd9d9', display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => setInput('Đơn hàng tháng này chưa thanh toán đủ')}>Đơn chưa thanh toán</Tag>
                    <Tag color="green" style={{ cursor: 'pointer' }} onClick={() => setInput('Doanh thu tháng này')}>Doanh thu</Tag>
                    <Tag color="orange" style={{ cursor: 'pointer' }} onClick={() => setInput('Tìm khách hàng VIP')}>Khách VIP</Tag>
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
                        <Button 
                            type={isListening ? "primary" : "default"} 
                            danger={isListening}
                            icon={<AudioOutlined />} 
                            onClick={toggleListen} 
                            disabled={loading} 
                            title="Nhập bằng giọng nói"
                        />
                        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} />
                    </div>
                </div>
            </Drawer>
        </>
    );
};

export default AiChatWidget;
