import React, { useEffect, useState } from 'react';
import { Badge, Popover, List, Avatar, Button, Typography, Empty } from 'antd';
import { BellOutlined, CheckCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

const HeaderNotifications: React.FC = () => {
    const navigate = useNavigate();
    const [list, setList] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    // Get user ID
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id : null;

    const [hasNew, setHasNew] = useState(false);

    // Sound notification (optional, played when new notification arrives)
    const playNotificationSound = () => {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdG+Bg4l8cXl/g4OHfn1+g4aDh4KAfn+CgoOEfn5+goOEg4B/f4GCgoOFg4CAgICBgYOCgoKBgIGBgYGCgYGBgYGBgoKBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ==');
            audio.volume = 0.5;
            audio.play().catch(() => { }); // Ignore if blocked
        } catch (e) { }
    };

    const fetchNoti = async () => {
        if (!userId) return;
        try {
            const res = await api.get('/notifications');
            const data = Array.isArray(res.data) ? res.data : [];
            const newUnread = data.filter((n: any) => !n.is_read).length;

            // Check if new notifications arrived
            if (newUnread > unreadCount && list.length > 0) {
                setHasNew(true);
                playNotificationSound();
                // Reset animation after 3s
                setTimeout(() => setHasNew(false), 3000);
            }

            setList(data);
            setUnreadCount(newUnread);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    };

    useEffect(() => {
        fetchNoti();
        const interval = setInterval(fetchNoti, 10000); // Polling every 10s for faster updates
        return () => clearInterval(interval);
    }, [userId]);

    const handleRead = async (item: any) => {
        if (!item.is_read) {
            try {
                await api.post(`/notifications/${item.id}/read`);
                fetchNoti();
            } catch (e) {
                console.error("Failed to mark read:", e);
            }
        }
        // Navigate to the linked content
        if (item.link) {
            setOpen(false); // Close popover
            if (item.link.startsWith('/')) {
                // Internal link - use React Router
                navigate(item.link);
            } else {
                // External link - use window.location
                window.location.href = item.link;
            }
        }
    };

    const handleReadAll = async () => {
        try {
            await api.post('/notifications/read-all');
            fetchNoti();
        } catch (e) {
            console.error("Failed to read all:", e);
        }
    };

    const content = (
        <div style={{ width: 350 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Thông báo</Text>
                <Button type="link" size="small" onClick={handleReadAll} disabled={unreadCount === 0}>Đánh dấu đã đọc hết</Button>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <List
                    dataSource={list}
                    locale={{ emptyText: <Empty description="Không có thông báo mới" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                    renderItem={(item) => (
                        <List.Item
                            className="notification-item"
                            style={{
                                background: item.is_read ? '#fff' : '#e6f7ff',
                                cursor: 'pointer',
                                padding: '12px 16px',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => handleRead(item)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        style={{ backgroundColor: item.type === 'WARNING' ? '#ff4d4f' : item.type === 'SUCCESS' ? '#52c41a' : '#1890ff' }}
                                        icon={item.type === 'WARNING' ? <WarningOutlined /> : item.type === 'SUCCESS' ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                                    />
                                }
                                title={<Text style={{ fontSize: 13 }} strong={!item.is_read}>{item.title}</Text>}
                                description={
                                    <div>
                                        <div style={{ fontSize: 12, color: '#666' }}>{item.message}</div>
                                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{dayjs(item.created_at).fromNow()}</div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomRight"
            arrow={false}
            overlayInnerStyle={{ padding: 0 }}
        >
            <div style={{ cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                <Badge count={unreadCount} overflowCount={99} size="small">
                    <BellOutlined
                        style={{
                            fontSize: 20,
                            color: hasNew ? '#fa8c16' : '#333',
                            animation: hasNew ? 'shake 0.5s ease-in-out infinite' : 'none'
                        }}
                    />
                </Badge>
                {/* CSS Animation for shake effect */}
                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: rotate(0deg); }
                        25% { transform: rotate(-15deg); }
                        50% { transform: rotate(15deg); }
                        75% { transform: rotate(-10deg); }
                    }
                `}</style>
            </div>
        </Popover>
    );
};

export default HeaderNotifications;