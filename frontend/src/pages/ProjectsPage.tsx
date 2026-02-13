import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, DatePicker, message, Row, Col, Progress } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, FolderOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';
import useMobile from '../hooks/useMobile';

const { Option } = Select;

const ProjectsPage: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const isMobile = useMobile(); // Use if needed for responsiveness

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resProjects, resUsers] = await Promise.all([
                api.get('/projects'),
                api.get('/users')
            ]);
            setProjects(resProjects.data);
            setManagers(resUsers.data);
        } catch (e) { message.error('Failed to load projects'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (values: any) => {
        try {
            const payload = {
                ...values,
                start_date: values.start_date ? values.start_date.toISOString() : null,
                end_date: values.end_date ? values.end_date.toISOString() : null
            };

            if (editingProject) {
                await api.put(`/projects/${editingProject.id}`, payload);
                message.success('Project updated');
            } else {
                await api.post('/projects', payload);
                message.success('Project created');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (e) { message.error('Failed to save project'); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await api.delete(`/projects/${id}`);
            message.success('Project deleted');
            fetchData();
        } catch (e) { message.error('Failed to delete'); }
    };

    const columns = [
        {
            title: 'Project', dataIndex: 'title',
            render: (t: string, r: any) => (
                <div style={{ cursor: 'pointer', color: '#1890ff', fontWeight: 'bold' }} onClick={() => navigate(`/projects/${r.id}`)}>
                    <FolderOutlined style={{ marginRight: 8 }} />
                    {t}
                </div>
            )
        },
        {
            title: 'Manager', dataIndex: 'manager',
            render: (u: any) => u ? <Tag color="blue">{u.full_name}</Tag> : <Tag>Unassigned</Tag>
        },
        {
            title: 'Status', dataIndex: 'status',
            render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : s === 'COMPLETED' ? 'blue' : 'default'}>{s}</Tag>
        },
        {
            title: 'Timeline',
            render: (r: any) => (
                <div style={{ fontSize: 12, color: '#666' }}>
                    {r.start_date ? dayjs(r.start_date).format('DD/MM/YY') : '?'} - {r.end_date ? dayjs(r.end_date).format('DD/MM/YY') : '?'}
                </div>
            )
        },
        {
            title: '', key: 'action', width: 100, align: 'right' as const,
            render: (r: any) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingProject(r); form.setFieldsValue({ ...r, start_date: r.start_date ? dayjs(r.start_date) : null, end_date: r.end_date ? dayjs(r.end_date) : null }); setIsModalOpen(true) }} style={{ marginRight: 5 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
                </div>
            )
        }
    ];

    return (
        <div style={{ paddingBottom: 20 }}>
            <Card
                title="Projects"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingProject(null); form.resetFields(); setIsModalOpen(true) }}>New Project</Button>}
            >
                <Table
                    dataSource={projects}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    onRow={(record) => ({
                        onClick: () => navigate(`/projects/${record.id}`)
                    })}
                />
            </Card>

            <Modal
                title={editingProject ? "Edit Project" : "New Project"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ status: 'PLANNING' }}>
                    <Form.Item name="title" label="Project Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="status" label="Status">
                                <Select>
                                    <Option value="PLANNING">Planning</Option>
                                    <Option value="ACTIVE">Active</Option>
                                    <Option value="COMPLETED">Completed</Option>
                                    <Option value="ARCHIVED">Archived</Option>
                                    <Option value="ON_HOLD">On Hold</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="manager_id" label="Project Manager">
                                <Select showSearch optionFilterProp="children">
                                    {managers.map(u => <Option key={u.id} value={u.id}>{u.full_name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="start_date" label="Start Date">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_date" label="End Date">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default ProjectsPage;
