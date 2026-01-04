import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Button } from 'antd';
import { ReloadOutlined, DatabaseOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const ActivityLogPage: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/system/logs'); // Need to ensure this endpoint exists in SystemController
            setLogs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            width: 180,
            render: (t: any) => dayjs(t).format('DD/MM/YYYY HH:mm:ss')
        },
        {
            title: 'User',
            dataIndex: 'username',
            width: 150,
            render: (t: string) => <Tag color="blue">{t}</Tag>
        },
        {
            title: 'Module',
            dataIndex: 'module',
            width: 120,
            render: (t: string) => <Tag color="geekblue">{t}</Tag>
        },
        {
            title: 'Hành động',
            dataIndex: 'action',
            width: 200,
            render: (t: string) => <b>{t}</b>
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
        },
        {
            title: 'Chi tiết thay đổi',
            dataIndex: 'details',
            width: 300,
            render: (details: any, record: any) => {
                if (!details || Object.keys(details).length === 0) return <span style={{ color: '#999' }}>-</span>;

                // Format 1: { field1: { old: x, new: y }, field2: { old: a, new: b } }
                // This is what our backend sends for UPDATE actions
                const keys = Object.keys(details);

                // Helper to format values
                const fmt = (v: any) => {
                    if (v === null || v === undefined) return <span style={{ color: '#bbb' }}>null</span>;
                    if (typeof v === 'object') return JSON.stringify(v).slice(0, 50);
                    if (typeof v === 'number') return v.toLocaleString();
                    return String(v);
                };

                return (
                    <div style={{ fontSize: 11, maxHeight: 120, overflowY: 'auto' }}>
                        {keys.map(key => {
                            const val = details[key];
                            // Check if it's { old, new } format
                            if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
                                return (
                                    <div key={key} style={{ marginBottom: 4 }}>
                                        <b style={{ color: '#595959' }}>{key}:</b>{' '}
                                        <span style={{ color: '#ff4d4f', textDecoration: 'line-through' }}>{fmt(val.old)}</span>
                                        {' → '}
                                        <span style={{ color: '#52c41a' }}>{fmt(val.new)}</span>
                                    </div>
                                );
                            }
                            // Simple value (e.g., "Items changed")
                            return (
                                <div key={key} style={{ marginBottom: 4 }}>
                                    <b style={{ color: '#595959' }}>{key}:</b> {fmt(val)}
                                </div>
                            );
                        })}
                    </div>
                );
            }
        }
    ];

    return (
        <Card
            title={<span><DatabaseOutlined /> Nhật ký hoạt động hệ thống</span>}
            extra={<Button icon={<ReloadOutlined />} onClick={fetchLogs}>Làm mới</Button>}
        >
            <Table
                dataSource={logs}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20 }}
            />
        </Card>
    );
};

export default ActivityLogPage;
