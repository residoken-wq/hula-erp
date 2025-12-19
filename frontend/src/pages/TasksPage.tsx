import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, DatePicker, Row, Col, message, Progress, Avatar, Tooltip, Radio } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, FlagOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Option } = Select;

const TasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [form] = Form.useForm();
    const [filterStatus, setFilterStatus] = useState('ALL');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resTasks, resUsers] = await Promise.all([
                axios.get(`${API_URL}/tasks`),
                axios.get(`${API_URL}/users`)
            ]);
            setTasks(resTasks.data);
            setUsers(resUsers.data);
        } catch (e) {}
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (values: any) => {
        try {
            const payload = {
                ...values,
                creator_id: currentUser.id,
                due_date: values.due_date ? values.due_date.toISOString() : null
            };
            
            if (editingTask) {
                await axios.put(`${API_URL}/tasks/${editingTask.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await axios.post(`${API_URL}/tasks`, payload);
                message.success('Tạo công việc thành công');
            }
            setIsModalOpen(false);
            fetchData();
        } catch(e) { message.error('Lỗi lưu'); }
    };

    const handleDelete = async (id: number) => {
        try { await axios.delete(`${API_URL}/tasks/${id}`); message.success('Đã xóa'); fetchData(); }
        catch(e) { message.error('Lỗi xóa'); }
    };

    const getPriorityColor = (p: string) => {
        if(p === 'URGENT') return 'red';
        if(p === 'HIGH') return 'orange';
        if(p === 'MEDIUM') return 'blue';
        return 'green';
    };

    const columns = [
        { 
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (s: string) => (
                <Tag color={s==='DONE'?'green': s==='IN_PROGRESS'?'processing': 'default'}>
                    {s==='DONE'?'Hoàn thành': s==='IN_PROGRESS'?'Đang làm':'Cần làm'}
                </Tag>
            )
        },
        { 
            title: 'Công việc', dataIndex: 'title', 
            render: (t:string, r:any) => (
                <div>
                    <div style={{fontWeight:'bold', fontSize:15}}>{t}</div>
                    <div style={{color:'#888', fontSize:12}}>{r.description}</div>
                </div>
            )
        },
        { 
            title: 'Mức độ', dataIndex: 'priority', width: 100, align: 'center' as const,
            render: (p: string) => <Tag color={getPriorityColor(p)} icon={<FlagOutlined/>}>{p}</Tag>
        },
        { 
            title: 'Hạn chót (Reminder)', dataIndex: 'due_date', width: 150,
            render: (d: any) => {
                if(!d) return '-';
                const isOverdue = dayjs().isAfter(dayjs(d));
                return <span style={{color: isOverdue ? 'red' : 'inherit'}}><ClockCircleOutlined/> {dayjs(d).format('DD/MM/YY HH:mm')}</span>
            }
        },
        { 
            title: 'Người thực hiện', dataIndex: 'assignee', 
            render: (u: any) => u ? <Tag color="blue">{u.full_name}</Tag> : <Tag>Chưa gán</Tag>
        },
        {
            title: '', key: 'act', width: 100, align: 'right' as const,
            render: (r:any) => (
                <div style={{display:'flex', gap:5, justifyContent:'flex-end'}}>
                    <Button size="small" icon={<EditOutlined/>} onClick={()=>{setEditingTask(r); form.setFieldsValue({...r, due_date: r.due_date ? dayjs(r.due_date) : null}); setIsModalOpen(true)}} />
                    <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>handleDelete(r.id)} />
                </div>
            )
        }
    ];

    const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);

    return (
        <div style={{paddingBottom: 20}}>
            <Card 
                title="Quản lý Công Việc & Nhắc Nhở" 
                extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setEditingTask(null); form.resetFields(); setIsModalOpen(true)}}>Thêm Công Việc</Button>}
            >
                <div style={{marginBottom: 16}}>
                    <Radio.Group value={filterStatus} onChange={e => setFilterStatus(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="ALL">Tất cả</Radio.Button>
                        <Radio.Button value="TODO">Cần làm</Radio.Button>
                        <Radio.Button value="IN_PROGRESS">Đang thực hiện</Radio.Button>
                        <Radio.Button value="DONE">Hoàn thành</Radio.Button>
                    </Radio.Group>
                </div>
                <Table dataSource={filteredTasks} columns={columns} rowKey="id" loading={loading} />
            </Card>

            <Modal 
                title={editingTask ? "Cập nhật Công Việc" : "Thêm Công Việc Mới"} 
                open={isModalOpen} 
                onCancel={()=>setIsModalOpen(false)} 
                onOk={()=>form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ priority: 'MEDIUM', status: 'TODO' }}>
                    <Form.Item name="title" label="Tên công việc" rules={[{required:true}]}><Input/></Form.Item>
                    <Form.Item name="description" label="Mô tả chi tiết"><Input.TextArea rows={3}/></Form.Item>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="priority" label="Mức độ ưu tiên">
                                <Select>
                                    <Option value="LOW">Thấp</Option>
                                    <Option value="MEDIUM">Trung bình</Option>
                                    <Option value="HIGH">Cao</Option>
                                    <Option value="URGENT">Khẩn cấp</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Trạng thái">
                                <Select>
                                    <Option value="TODO">Cần làm</Option>
                                    <Option value="IN_PROGRESS">Đang thực hiện</Option>
                                    <Option value="REVIEW">Chờ duyệt</Option>
                                    <Option value="DONE">Hoàn thành</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="assignee_id" label="Giao cho ai?">
                                <Select showSearch optionFilterProp="children">
                                    {users.map(u => <Option key={u.id} value={u.id}>{u.full_name} ({u.username})</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="due_date" label="Hạn chót (Sẽ nhắc nhở)">
                                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{width:'100%'}} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default TasksPage;