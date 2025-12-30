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
            render: (details: any, record: any) => {
                if (!details) return null;

                // Diff update
                if (record.action === 'UPDATE' && details.new && details.old) {
                    return (
                        <div style={{ fontSize: 12 }}>
                            {Object.keys(details.new).map(key => {
                                let oldVal = details.old[key];
                                let newVal = details.new[key];
                                // Helper to format objects/dates
                                const fmt = (v: any) => {
                                    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
                                    return String(v);
                                };
                                return (
                                    <div key={key}>
                                        <b style={{ color: '#8c8c8c' }}>{key}:</b> {fmt(oldVal)} &rarr; <span style={{ color: '#52c41a' }}>{fmt(newVal)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                return null;
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
