import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Select, DatePicker, Tag, message, Space, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

interface Props {
    employees: any[];
}

const Review360Tab: React.FC<Props> = ({ employees }) => {
    const [activeTab, setActiveTab] = useState('questions');
    
    // Questions State
    const [questions, setQuestions] = useState<any[]>([]);
    const [qModal, setQModal] = useState(false);
    const [qForm] = Form.useForm();
    const [editingQ, setEditingQ] = useState<any>(null);

    // Campaigns State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [cModal, setCModal] = useState(false);
    const [cForm] = Form.useForm();
    const [editingC, setEditingC] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'questions') loadQuestions();
        if (activeTab === 'campaigns') loadCampaigns();
    }, [activeTab]);

    // --- Questions Logic ---
    const loadQuestions = async () => {
        try {
            const res = await api.get('/hr/review-questions');
            setQuestions(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSaveQ = async (values: any) => {
        try {
            if (editingQ) {
                await api.put(`/hr/review-questions/${editingQ.id}`, values);
                message.success('Đã cập nhật câu hỏi');
            } else {
                await api.post('/hr/review-questions', values);
                message.success('Đã tạo câu hỏi');
            }
            setQModal(false);
            qForm.resetFields();
            setEditingQ(null);
            loadQuestions();
        } catch (e) { message.error('Lỗi lưu câu hỏi'); }
    };

    const handleDeleteQ = async (id: number) => {
        try {
            await api.delete(`/hr/review-questions/${id}`);
            message.success('Đã xóa câu hỏi');
            loadQuestions();
        } catch (e) { message.error('Lỗi xóa'); }
    };

    // --- Campaigns Logic ---
    const loadCampaigns = async () => {
        try {
            const res = await api.get('/hr/review-campaigns');
            setCampaigns(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSaveC = async (values: any) => {
        try {
            const payload = {
                ...values,
                config_json: [
                    { category: 'Kỹ năng', count: values.skill_count || 0 },
                    { category: 'Thái độ', count: values.attitude_count || 0 },
                    { category: 'Hiệu suất', count: values.performance_count || 0 }
                ].filter(c => c.count > 0)
            };

            if (editingC) {
                await api.put(`/hr/review-campaigns/${editingC.id}`, payload);
                message.success('Đã cập nhật đợt đánh giá');
            } else {
                await api.post('/hr/review-campaigns', payload);
                message.success('Đã tạo đợt đánh giá');
            }
            setCModal(false);
            cForm.resetFields();
            setEditingC(null);
            loadCampaigns();
        } catch (e) { message.error('Lỗi lưu đợt đánh giá'); }
    };

    const handleDeleteC = async (id: number) => {
        try {
            await api.delete(`/hr/review-campaigns/${id}`);
            message.success('Đã xóa đợt');
            loadCampaigns();
        } catch (e) { message.error('Lỗi xóa'); }
    };

    const handlePublishC = async (campaign: any) => {
        try {
            // Get all employee ids to participate
            const participant_ids = employees.map(e => e.id);
            await api.put(`/hr/review-campaigns/${campaign.id}`, { status: 'ACTIVE', participant_ids });
            message.success('Đã Publish đợt đánh giá. Bài làm đã được giao cho nhân sự.');
            loadCampaigns();
        } catch (e) { message.error('Lỗi Publish'); }
    };

    return (
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
            {/* TAB: NGÂN HÀNG CÂU HỎI */}
            <TabPane tab="Ngân hàng câu hỏi" key="questions">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { qForm.resetFields(); setQModal(true); }} style={{ marginBottom: 16 }}>
                    Thêm câu hỏi
                </Button>
                <Table
                    dataSource={questions}
                    rowKey="id"
                    size="small"
                    columns={[
                        { title: 'Nội dung', dataIndex: 'content' },
                        { title: 'Phân loại', dataIndex: 'category', render: (t) => <Tag color="blue">{t}</Tag> },
                        { title: 'Loại câu', dataIndex: 'type' },
                        {
                            title: 'Thao tác',
                            render: (_: any, r: any) => (
                                <Space>
                                    <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingQ(r); qForm.setFieldsValue(r); setQModal(true); }} />
                                    <Popconfirm title="Xóa câu hỏi?" onConfirm={() => handleDeleteQ(r.id)}>
                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            )
                        }
                    ]}
                />

                <Modal title="Thêm/Sửa câu hỏi" open={qModal} onCancel={() => setQModal(false)} onOk={() => qForm.submit()}>
                    <Form form={qForm} layout="vertical" onFinish={handleSaveQ}>
                        <Form.Item name="content" label="Nội dung câu hỏi" rules={[{ required: true }]}>
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="category" label="Phân loại (Category)" rules={[{ required: true }]}>
                            <Select>
                                <Option value="Kỹ năng">Kỹ năng</Option>
                                <Option value="Thái độ">Thái độ</Option>
                                <Option value="Hiệu suất">Hiệu suất</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="type" label="Loại câu trả lời" rules={[{ required: true }]} initialValue="RATING">
                            <Select>
                                <Option value="RATING">Chấm điểm (1-5)</Option>
                                <Option value="TEXT">Văn bản (Tự luận)</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </TabPane>

            {/* TAB: ĐỢT ĐÁNH GIÁ */}
            <TabPane tab="Đợt đánh giá 360" key="campaigns">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { cForm.resetFields(); setCModal(true); }} style={{ marginBottom: 16 }}>
                    Tạo đợt đánh giá
                </Button>
                <Table
                    dataSource={campaigns}
                    rowKey="id"
                    size="small"
                    columns={[
                        { title: 'Tên đợt', dataIndex: 'title' },
                        { title: 'Trạng thái', dataIndex: 'status', render: (s) => <Tag color={s === 'ACTIVE' ? 'green' : 'orange'}>{s}</Tag> },
                        {
                            title: 'Thao tác',
                            render: (_: any, r: any) => (
                                <Space>
                                    {r.status === 'DRAFT' && (
                                        <Popconfirm title="Publish đợt này và tự động giao cho tất cả nhân sự?" onConfirm={() => handlePublishC(r)}>
                                            <Button size="small" type="primary" icon={<SendOutlined />}>Publish</Button>
                                        </Popconfirm>
                                    )}
                                    <Button size="small" icon={<EditOutlined />} onClick={() => { 
                                        setEditingC(r); 
                                        const vals = { ...r };
                                        if (r.config_json) {
                                            vals.skill_count = r.config_json.find((c: any) => c.category === 'Kỹ năng')?.count || 0;
                                            vals.attitude_count = r.config_json.find((c: any) => c.category === 'Thái độ')?.count || 0;
                                            vals.performance_count = r.config_json.find((c: any) => c.category === 'Hiệu suất')?.count || 0;
                                        }
                                        cForm.setFieldsValue(vals); 
                                        setCModal(true); 
                                    }} />
                                    <Popconfirm title="Xóa đợt đánh giá?" onConfirm={() => handleDeleteC(r.id)}>
                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            )
                        }
                    ]}
                />

                <Modal title="Tạo/Sửa Đợt đánh giá" open={cModal} onCancel={() => setCModal(false)} onOk={() => cForm.submit()}>
                    <Form form={cForm} layout="vertical" onFinish={handleSaveC}>
                        <Form.Item name="title" label="Tên đợt đánh giá" rules={[{ required: true }]}>
                            <Input placeholder="VD: Đánh giá nhân sự Quý 1/2026" />
                        </Form.Item>
                        <p style={{ fontWeight: 'bold' }}>Cấu hình sinh câu hỏi ngẫu nhiên:</p>
                        <Space>
                            <Form.Item name="skill_count" label="Số câu Kỹ năng" initialValue={0}>
                                <InputNumber min={0} />
                            </Form.Item>
                            <Form.Item name="attitude_count" label="Số câu Thái độ" initialValue={0}>
                                <InputNumber min={0} />
                            </Form.Item>
                            <Form.Item name="performance_count" label="Số câu Hiệu suất" initialValue={0}>
                                <InputNumber min={0} />
                            </Form.Item>
                        </Space>
                    </Form>
                </Modal>
            </TabPane>
        </Tabs>
    );
};

export default Review360Tab;
