import React, { useState } from 'react';
import { Card, Row, Col, Button, Table, Tag, Space, Empty, Divider, List, Avatar, message } from 'antd';
import { UserOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

interface Props {
    employees: any[];
    attendances: any[];
    onRefresh: () => void;
}

const AttendanceTab: React.FC<Props> = ({ employees, attendances, onRefresh }) => {
    const [selectedEmp, setSelectedEmp] = useState<number | null>(null);

    const handleCheckIn = async (empId: number) => {
        try {
            await api.post('/hr/check-in', { employee_id: empId });
            message.success('Check-in thành công!');
            onRefresh();
        } catch (e) { message.error('Lỗi check-in'); }
    };

    const handleCheckOut = async (empId: number) => {
        try {
            await api.post('/hr/check-out', { employee_id: empId });
            message.success('Check-out thành công!');
            onRefresh();
        } catch (e) { message.error('Lỗi check-out'); }
    };

    return (
        <Row gutter={16}>
            <Col span={8}>
                <Card title="Chọn nhân viên" size="small">
                    <List
                        dataSource={employees}
                        renderItem={(emp: any) => (
                            <List.Item
                                style={{ cursor: 'pointer', background: selectedEmp === emp.id ? '#e6f7ff' : 'transparent' }}
                                onClick={() => setSelectedEmp(emp.id)}
                            >
                                <List.Item.Meta avatar={<Avatar icon={<UserOutlined />} />} title={emp.full_name} description={emp.position} />
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
            <Col span={16}>
                {selectedEmp ? (
                    <Card title="Chấm công hôm nay" size="small">
                        <Space size="large">
                            <Button type="primary" size="large" icon={<LoginOutlined />} onClick={() => handleCheckIn(selectedEmp)}>
                                CHECK IN
                            </Button>
                            <Button size="large" icon={<LogoutOutlined />} onClick={() => handleCheckOut(selectedEmp)}>
                                CHECK OUT
                            </Button>
                        </Space>
                        <Divider />
                        <Table
                            dataSource={attendances.filter(a => a.employee_id === selectedEmp)}
                            columns={[
                                { title: 'Ngày', dataIndex: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                                { title: 'Check-in', dataIndex: 'check_in', render: (d: string) => d ? dayjs(d).format('HH:mm') : '-' },
                                { title: 'Check-out', dataIndex: 'check_out', render: (d: string) => d ? dayjs(d).format('HH:mm') : '-' },
                                { title: 'Giờ làm', dataIndex: 'work_hours', render: (h: number) => h ? `${h}h` : '-' },
                                {
                                    title: 'Trạng thái', dataIndex: 'status', render: (s: string) => {
                                        const c: any = { PRESENT: 'green', LATE: 'orange', ABSENT: 'red', HALF_DAY: 'blue' };
                                        return <Tag color={c[s]}>{s}</Tag>;
                                    }
                                }
                            ]}
                            rowKey="id"
                            size="small"
                        />
                    </Card>
                ) : <Empty description="Chọn nhân viên để chấm công" />}
            </Col>
        </Row>
    );
};

export default AttendanceTab;
