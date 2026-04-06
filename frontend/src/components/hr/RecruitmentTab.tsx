import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, Switch, message, Tooltip, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SendOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import moment from 'moment';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Paragraph, Text } = Typography;

const RecruitmentTab: React.FC = () => {
    const [activeKey, setActiveKey] = useState('jobs');
    
    // States
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [jobModalVisible, setJobModalVisible] = useState(false);
    const [interviewModalVisible, setInterviewModalVisible] = useState(false);
    const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [form] = Form.useForm();
    const [interviewForm] = Form.useForm();
    const [assessmentForm] = Form.useForm();

    useEffect(() => {
        if (activeKey === 'jobs') loadJobs();
        if (activeKey === 'candidates') loadCandidates();
        if (activeKey === 'interviews') loadInterviews();
    }, [activeKey]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hr/recruitment/jobs');
            setJobs(res.data || []);
        } catch (e) {
            message.error('Lỗi tải danh sách tin tuyển dụng');
        }
        setLoading(false);
    };

    const loadCandidates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hr/recruitment/candidates');
            setCandidates(res.data || []);
        } catch (e) {
            message.error('Lỗi tải danh sách ứng viên');
        }
        setLoading(false);
    };

    const loadInterviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hr/recruitment/interviews');
            setInterviews(res.data || []);
        } catch (e) {
            message.error('Lỗi tải danh sách phỏng vấn');
        }
        setLoading(false);
    };

    // --- JOBS ACTIONS ---
    const handleSaveJob = async (values: any) => {
        try {
            if (values.id) {
                await api.put(`/hr/recruitment/jobs/${values.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/hr/recruitment/jobs', values);
                message.success('Tạo thành công');
            }
            setJobModalVisible(false);
            loadJobs();
        } catch (error) {
            message.error('Lỗi khi lưu dữ liệu');
        }
    };

    const deleteJob = async (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa job này?',
            onOk: async () => {
                await api.delete(`/hr/recruitment/jobs/${id}`);
                message.success('Xóa thành công');
                loadJobs();
            }
        });
    };

    const processQuestionsStr = (str: string) => {
        try {
            return JSON.parse(str);
        } catch {
            return str.split('\n').filter(s => s.trim() !== '').map(q => ({ category: 'General', question: q }));
        }
    }

    // --- CANDIDATE ACTIONS ---
    const sendAssessment = async (values: any) => {
        try {
            const parsedQuestions = processQuestionsStr(values.questionsStr);
            await api.post(`/hr/recruitment/candidates/${selectedCandidate.id}/send-assessment`, { questions: parsedQuestions });
            message.success('Đã gửi bài đánh giá');
            setAssessmentModalVisible(false);
            loadCandidates();
        } catch {
            message.error('Lỗi khi gửi');
        }
    }

    const copyPortalLink = (token: string) => {
        const link = `${window.location.origin}/portal/recruitment/${token}`;
        navigator.clipboard.writeText(link);
        message.success('Đã copy link portal ứng viên');
    }

    // --- INTERVIEWS ACTIONS ---
    const scheduleInterview = async (values: any) => {
        try {
            const data = {
                ...values,
                candidate_id: selectedCandidate.id,
                scheduled_at: values.scheduled_at.toISOString()
            };
            await api.post('/hr/recruitment/interviews', data);
            message.success('Đã lên lịch phỏng vấn');
            setInterviewModalVisible(false);
            loadCandidates();
            if (activeKey === 'interviews') loadInterviews();
        } catch {
            message.error('Lỗi tạo lịch phỏng vấn');
        }
    };

    return (
        <div>
            <Tabs activeKey={activeKey} onChange={setActiveKey} size="small" type="card">
                <TabPane tab="Tin Tuyển Dụng" key="jobs">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setJobModalVisible(true); }} style={{ marginBottom: 16 }}>
                        Tạo JD Mới
                    </Button>
                    <Table
                        size="small"
                        loading={loading}
                        dataSource={jobs}
                        rowKey="id"
                        columns={[
                            { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
                            { title: 'Loại', dataIndex: 'job_type', key: 'job_type' },
                            { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
                            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: val => <Tag color={val === 'PUBLISHED' ? 'green' : 'default'}>{val}</Tag> },
                            { title: 'Hiển thị Web', dataIndex: 'show_on_website', key: 'show_on_website', render: val => val ? <Tag color="blue">Có</Tag> : <Tag>Không</Tag> },
                            {
                                title: 'Thao tác', key: 'actions', render: (_, record) => (
                                    <Space>
                                        <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { form.setFieldsValue(record); setJobModalVisible(true); }} />
                                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => deleteJob(record.id)} />
                                    </Space>
                                )
                            }
                        ]}
                    />
                </TabPane>

                <TabPane tab="Ứng Viên" key="candidates">
                    <Table
                        size="small"
                        loading={loading}
                        dataSource={candidates}
                        rowKey="id"
                        columns={[
                            { title: 'Tên', dataIndex: 'name', key: 'name' },
                            { title: 'Vị trí', key: 'job', render: (_, record) => record.job_post?.title },
                            { title: 'Score', dataIndex: 'overall_score', key: 'score', render: val => val ? <Tag color={val >= 7 ? 'green' : 'red'}>{val}</Tag> : '-' },
                            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: val => <Tag color="geekblue">{val}</Tag> },
                            { title: 'Nguồn', dataIndex: 'source', key: 'source' },
                            {
                                title: 'Thao tác', key: 'actions', render: (_, record) => (
                                    <Space size="small" wrap>
                                        <Tooltip title="Copy Portal Link">
                                            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyPortalLink(record.portal_token)} />
                                        </Tooltip>
                                        <Tooltip title="Gửi bài Test">
                                            <Button size="small" type="text" icon={<SendOutlined />} onClick={() => { 
                                                setSelectedCandidate(record); 
                                                assessmentForm.resetFields(); 
                                                // Pre-fill from job template if any
                                                const jt = record.job_post?.assessment_template;
                                                if (jt && Array.isArray(jt)) {
                                                    assessmentForm.setFieldsValue({ questionsStr: jt.map((q:any) => q.question || q).join('\n') });
                                                }
                                                setAssessmentModalVisible(true); 
                                            }} />
                                        </Tooltip>
                                        <Tooltip title="Lên lịch PV">
                                            <Button size="small" type="text" icon={<CalendarOutlined />} onClick={() => { setSelectedCandidate(record); interviewForm.resetFields(); setInterviewModalVisible(true); }} />
                                        </Tooltip>
                                    </Space>
                                )
                            }
                        ]}
                    />
                </TabPane>

                <TabPane tab="Lịch Phỏng Vấn" key="interviews">
                    <Table
                        size="small"
                        loading={loading}
                        dataSource={interviews}
                        rowKey="id"
                        columns={[
                            { title: 'Ứng viên', key: 'candidate', render: (_, record) => record.candidate?.name },
                            { title: 'Thời gian', dataIndex: 'scheduled_at', key: 'scheduled_at', render: val => moment(val).format('HH:mm DD/MM/YYYY') },
                            { title: 'Hình thức', key: 'loc', render: (_, record) => record.meeting_link ? <a href={record.meeting_link} target="_blank" rel="noreferrer">Online</a> : record.location },
                            { title: 'Người PV', dataIndex: 'hr_interviewer', key: 'hr' },
                            { title: 'Ket quả', dataIndex: 'result_status', key: 'status', render: val => <Tag color={val === 'PASS' ? 'green' : (val === 'FAIL' ? 'red' : 'default')}>{val}</Tag> }
                        ]}
                    />
                </TabPane>
            </Tabs>

            {/* JOB MODAL */}
            <Modal title="Cập nhật Job" visible={jobModalVisible} onCancel={() => setJobModalVisible(false)} onOk={() => form.submit()} width={800}>
                <Form form={form} layout="vertical" onFinish={handleSaveJob}>
                    <Form.Item name="id" hidden><Input /></Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="slug" label="Slug URL" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="department" label="Phòng ban"><Input /></Form.Item>
                        <Form.Item name="location" label="Địa điểm"><Input /></Form.Item>
                        <Form.Item name="job_type" label="Loại hợp đồng"><Select><Select.Option value="FULL_TIME">Full Time</Select.Option><Select.Option value="PART_TIME">Part Time</Select.Option><Select.Option value="INTERN">Thực tập sinh</Select.Option></Select></Form.Item>
                        <Form.Item name="status" label="Trạng thái"><Select><Select.Option value="DRAFT">Nháp</Select.Option><Select.Option value="PUBLISHED">Đang mở</Select.Option><Select.Option value="CLOSED">Đóng</Select.Option></Select></Form.Item>
                        <Form.Item name="salary_range" label="Mức lương (Hiển thị text)"><Input /></Form.Item>
                        <Form.Item name="show_on_website" label="Hiển thị Website" valuePropName="checked"><Switch /></Form.Item>
                    </div>
                    <Form.Item name="description" label="Mô tả công việc (HTML cho phép)"><TextArea rows={4} /></Form.Item>
                    <Form.Item name="assessment_template" label="Template Câu hỏi mặc định (JSON Array hoặc list text)">
                        <TextArea rows={3} placeholder='[{"category": "Logic", "question": "Tại sao nắp cống hình tròn?"}]' />
                    </Form.Item>
                </Form>
            </Modal>

            {/* SEND ASSESSMENT MODAL */}
            <Modal title={`Gửi bài test cho ${selectedCandidate?.name}`} visible={assessmentModalVisible} onCancel={() => setAssessmentModalVisible(false)} onOk={() => assessmentForm.submit()}>
                <Alert message="Sẽ tạo 1 link Portal riêng cho ứng viên và thay đổi trạng thái thành 'Đã Gửi Bài Test'" type="info" showIcon style={{marginBottom: 16}} />
                <Form form={assessmentForm} layout="vertical" onFinish={sendAssessment}>
                    <Form.Item name="questionsStr" label="Danh sách câu hỏi (Mỗi câu 1 dòng)" rules={[{ required: true }]}>
                        <TextArea rows={6} placeholder="Câu 1: ...&#10;Câu 2: ..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* SCHEDULE INTERVIEW MODAL */}
            <Modal title={`Lên lịch phỏng vấn cho ${selectedCandidate?.name}`} visible={interviewModalVisible} onCancel={() => setInterviewModalVisible(false)} onOk={() => interviewForm.submit()}>
                <Form form={interviewForm} layout="vertical" onFinish={scheduleInterview}>
                    <Form.Item name="scheduled_at" label="Thời gian" rules={[{ required: true }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{width: '100%'}} /></Form.Item>
                    <Form.Item name="location" label="Địa điểm (Offline)"><Input placeholder="VP chính..." /></Form.Item>
                    <Form.Item name="meeting_link" label="Link Meeting (Online)"><Input placeholder="https://meet.google.com/..." /></Form.Item>
                    <Form.Item name="hr_interviewer" label="Người phỏng vấn"><Input /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RecruitmentTab;
