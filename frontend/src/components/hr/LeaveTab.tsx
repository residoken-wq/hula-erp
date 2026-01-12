import React, { useState } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Row, Col, Tag, Space, message, Popconfirm, Input } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
    employees: any[];
    leaves: any[];
    onRefresh: () => void;
}

const LeaveTab: React.FC<Props> = ({ employees, leaves, onRefresh }) => {
    const [modal, setModal] = useState(false);
    const [form] = Form.useForm();

    const handleSave = async (values: any) => {
        try {
            values.start_date = values.start_date.format('YYYY-MM-DD');
            values.end_date = values.end_date.format('YYYY-MM-DD');
            await api.post('/hr/leaves', values);
            message.success('Đã tạo đơn nghỉ phép');
            setModal(false);
            form.resetFields();
            onRefresh();
        } catch (e) { message.error('Lỗi tạo đơn'); }
    };

    const handleApprove = async (id: number, approved: boolean) => {
        try {
            await api.put(`/hr/leaves/${id}/approve`, { approved });
            message.success(approved ? 'Đã duyệt' : 'Đã từ chối');
            onRefresh();
        } catch (e) { message.error('Lỗi duyệt đơn'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/hr/leaves/${id}`);
            message.success('Đã xóa đơn');
            onRefresh();
        } catch (e) { message.error('Lỗi xóa đơn'); }
    };

    const columns = [
        { title: 'Nhân viên', dataIndex: ['employee', 'full_name'] },
        {
            title: 'Loại', dataIndex: 'leave_type', render: (t: string) => {
                const map: any = { ANNUAL: 'Phép năm', SICK: 'Ốm', UNPAID: 'Không lương', MATERNITY: 'Thai sản', OTHER: 'Khác' };
                return map[t] || t;
            }
        },
        { title: 'Từ ngày', dataIndex: 'start_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
        { title: 'Đến ngày', dataIndex: 'end_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
        { title: 'Số ngày', dataIndex: 'days' },
        { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
        {
            title: 'Trạng thái', dataIndex: 'status', render: (s: string) => {
                const c: any = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
                const t: any = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
                return <Tag color={c[s]}>{t[s]}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            render: (_: any, r: any) => (
                <Space>
                    {r.status === 'PENDING' && (
                        <>
                            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(r.id, true)}>Duyệt</Button>
                            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleApprove(r.id, false)}>Từ chối</Button>
                        </>
                    )}
                    <Popconfirm title="Xóa đơn này?" onConfirm={() => handleDelete(r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModal(true); }} style={{ marginBottom: 16 }}>
                Đăng ký nghỉ phép
            </Button>
            <Table dataSource={leaves} columns={columns} rowKey="id" size="small" />

            <Modal title="Đăng ký nghỉ phép" open={modal} onCancel={() => setModal(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                        <Select>{employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}</Select>
                    </Form.Item>
                    <Form.Item name="leave_type" label="Loại nghỉ" rules={[{ required: true }]}>
                        <Select>
                            <Option value="ANNUAL">Phép năm</Option>
                            <Option value="SICK">Ốm</Option>
                            <Option value="UNPAID">Không lương</Option>
                            <Option value="MATERNITY">Thai sản</Option>
                            <Option value="OTHER">Khác</Option>
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label="Từ ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Đến ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="reason" label="Lý do"><TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default LeaveTab;
