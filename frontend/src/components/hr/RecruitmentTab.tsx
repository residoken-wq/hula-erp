import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, Switch, message, Tooltip, Typography, Alert, Drawer, Divider, Card, Badge, Spin, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SendOutlined, CalendarOutlined, LoadingOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';
import RichTextEditor from '../common/RichTextEditor';

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
    const [aiLoading, setAiLoading] = useState(false);
    const [questionsCache, setQuestionsCache] = useState<Record<number, string>>({});
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

    const handleParseJD = async () => {
        const desc = form.getFieldValue('description');
        if (!desc || desc.trim() === '') {
            message.warning('Vui lòng nhập mô tả công việc (JD) trước khi phân tích');
            return;
        }
        setLoading(true);
        message.loading({ content: 'AI đang phân tích JD...', key: 'ai-parse' });
        try {
            const res = await api.post('/hr/recruitment/jobs/parse-requirements', { description: desc });
            form.setFieldsValue({ requirements_json: JSON.stringify(res.data, null, 2) });
            message.success({ content: 'Phân tích thành công', key: 'ai-parse' });
        } catch (e) {
            message.error({ content: 'Lỗi phân tích JD', key: 'ai-parse' });
        }
        setLoading(false);
    };

    const handleGenerateAIQuestions = async () => {
        if (!selectedCandidate) return;
        setAiLoading(true);
        message.loading({ content: 'AI đang phân tích JD & CV để tạo câu hỏi... (10-30 giây)', key: 'ai-gen', duration: 60 });
        try {
            const res = await api.post(`/hr/recruitment/candidates/${selectedCandidate.id}/generate-questions`);
            const qs = res.data?.questions || [];
            if (qs.length > 0) {
                const text = qs.map((q: any, i: number) => `Câu ${i+1}: ${q.question}`).join('\n');
                assessmentForm.setFieldsValue({ questionsStr: text });
                setQuestionsCache(prev => ({ ...prev, [selectedCandidate.id]: text }));
                message.success({ content: `Đã tạo xong ${qs.length} câu hỏi`, key: 'ai-gen' });
            } else {
                const errMsg = res.data?.error || 'Không tạo được câu hỏi (JD có thể trống)';
                message.warning({ content: errMsg, key: 'ai-gen', duration: 5 });
            }
        } catch (e: any) {
            const errDetail = e?.response?.data?.message || e?.message || 'Lỗi tạo câu hỏi chạy AI';
            message.error({ content: errDetail, key: 'ai-gen', duration: 5 });
        }
        setAiLoading(false);
    };

    return (
        <div>
            <Tabs activeKey={activeKey} onChange={setActiveKey} size="small" type="card">
                <TabPane tab={<><Badge status="processing" /> Tin Tuyển Dụng</>} key="jobs">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Quản lý Tin Tuyển Dụng</div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ status: 'DRAFT', job_type: 'FULL_TIME', show_on_website: true }); setJobModalVisible(true); }}>
                            Tạo JD Mới
                        </Button>
                    </div>
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
                            { title: 'CV', dataIndex: 'cv_url', key: 'cv', render: val => val ? <a href={val} target="_blank" rel="noreferrer">Xem CV</a> : '-' },
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
                                                // Restore from cache first, then from job template
                                                const cached = questionsCache[record.id];
                                                if (cached) {
                                                    assessmentForm.setFieldsValue({ questionsStr: cached });
                                                } else {
                                                    const jt = record.job_post?.assessment_template;
                                                    if (jt && Array.isArray(jt)) {
                                                        assessmentForm.setFieldsValue({ questionsStr: jt.map((q:any) => q.question || q).join('\n') });
                                                    }
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
                            { title: 'Thời gian', dataIndex: 'scheduled_at', key: 'scheduled_at', render: val => dayjs(val).format('HH:mm DD/MM/YYYY') },
                            { title: 'Hình thức', key: 'loc', render: (_, record) => record.meeting_link ? <a href={record.meeting_link} target="_blank" rel="noreferrer">Online</a> : record.location },
                            { title: 'Người PV', dataIndex: 'hr_interviewer', key: 'hr' },
                            { title: 'Ket quả', dataIndex: 'result_status', key: 'status', render: val => <Tag color={val === 'PASS' ? 'green' : (val === 'FAIL' ? 'red' : 'default')}>{val}</Tag> }
                        ]}
                    />
                </TabPane>
            </Tabs>

            {/* JOB DRAWER */}
            <Drawer 
                title={form.getFieldValue('id') ? "Cập nhật Tin Tuyển Dụng" : "Tạo Tin Tuyển Dụng mới"} 
                open={jobModalVisible} 
                onClose={() => setJobModalVisible(false)} 
                width={960}
                extra={
                    <Space>
                        <Button onClick={() => setJobModalVisible(false)}>Hủy</Button>
                        <Button type="primary" onClick={() => form.submit()} icon={<SendOutlined />}>Lưu thông tin</Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical" onFinish={handleSaveJob} requiredMark="optional">
                    <Form.Item name="id" hidden><Input /></Form.Item>
                    
                    <Card size="small" title="Thông tin cơ bản" bordered={false} style={{ marginBottom: 16, background: '#f8fafc' }}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <Form.Item name="title" label="Tiêu đề JD" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}><Input placeholder="VD: Nhân viên Kinh Doanh" size="large" /></Form.Item>
                            <Form.Item name="slug" label="Đường dẫn (Slug)" rules={[{ required: true, message: 'Vui lòng nhập slug' }]}><Input placeholder="vd: nhan-vien-kinh-doanh" size="large" addonBefore="/" /></Form.Item>
                            <Form.Item name="department" label="Phòng ban"><Input placeholder="VD: Phòng Kinh Doanh" /></Form.Item>
                            <Form.Item name="location" label="Địa điểm làm việc"><Input placeholder="VD: Trụ sở chính HN" /></Form.Item>
                            <Form.Item name="job_type" label="Loại hợp đồng">
                                <Select>
                                    <Select.Option value="FULL_TIME">Full Time (Toàn thời gian)</Select.Option>
                                    <Select.Option value="PART_TIME">Part Time (Bán thời gian)</Select.Option>
                                    <Select.Option value="INTERN">Thực tập sinh</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="salary_range" label="Mức lương đề xuất"><Input placeholder="VD: 10.000.000 - 15.000.000 VNĐ" /></Form.Item>
                        </div>
                    </Card>

                    <Card size="small" title="Cấu hình hiển thị" bordered={false} style={{ marginBottom: 16, background: '#f8fafc' }}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <Form.Item name="status" label="Trạng thái tuyển dụng">
                                <Select>
                                    <Select.Option value="DRAFT">Nháp (Chưa công bố)</Select.Option>
                                    <Select.Option value="PUBLISHED">Đang mở (Nhận hồ sơ)</Select.Option>
                                    <Select.Option value="CLOSED">Đóng (Ngừng nhận)</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="show_on_website" label="Hiển thị trên Trang chủ Website" valuePropName="checked">
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </div>
                    </Card>

                    <Alert message="Mô tả công việc sẽ hiển thị nguyên bản trên màn hình ứng viên. Vui lòng trình bày rõ ràng, sạch sẽ." type="info" showIcon style={{ marginBottom: 16 }} />
                    <Form.Item name="description" label={<span style={{fontWeight: 600}}>Chi tiết Mô Tả Công Việc (JD)</span>} getValueProps={(v: any) => ({ value: v })}>
                        <RichTextEditor minHeight={450} placeholder="Nhập mục tiêu công việc, yêu cầu kỹ năng, quyền lợi..." />
                    </Form.Item>

                    <Divider />
                    <Form.Item name="requirements_json" label={
                        <Space>
                            <span style={{fontWeight: 600}}>Yêu cầu năng lực (Competencies)</span>
                            <Button type="dashed" size="small" onClick={handleParseJD} disabled={loading} icon={<span style={{fontSize: 14}}>🤖</span>}>AI Phân Tích JD</Button>
                        </Space>
                    }>
                        <TextArea rows={4} placeholder='VD: {"skills": ["React"], "experience": ["2 years"]}' />
                    </Form.Item>

                    <Form.Item name="assessment_template" label={<span style={{fontWeight: 600}}>Khung câu hỏi Test Năng lực (Tùy chọn)</span>} tooltip="Danh sách bộ câu hỏi mặc định khi gửi bài Test cho ứng viên vị trí này">
                        <TextArea rows={4} placeholder='VD: [{"category": "Chuyên môn", "question": "Bạn đã có kinh nghiệm gì?"}]' />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* SEND ASSESSMENT MODAL */}
            <Modal title={`Gửi bài test cho ${selectedCandidate?.name}`} open={assessmentModalVisible} onCancel={() => setAssessmentModalVisible(false)} onOk={() => assessmentForm.submit()} okButtonProps={{ disabled: aiLoading }}>
                <Alert message="Sẽ tạo 1 link Portal riêng cho ứng viên và thay đổi trạng thái thành 'Đã Gửi Bài Test'" type="info" showIcon style={{marginBottom: 16}} />
                <Button type="dashed" block style={{marginBottom: 16}} loading={aiLoading} onClick={handleGenerateAIQuestions} icon={!aiLoading ? <span style={{fontSize: 16}}>🤖</span> : undefined}>
                    {aiLoading ? 'AI đang tạo câu hỏi... vui lòng chờ' : 'AI Tạo 10 Câu Hỏi (Dựa theo JD & CV)'}
                </Button>
                {aiLoading && <Progress percent={99.9} status="active" showInfo={false} strokeColor={{ from: '#108ee9', to: '#87d068' }} style={{marginBottom: 16, marginTop: -8}} />}
                <Form form={assessmentForm} layout="vertical" onFinish={sendAssessment}>
                    <Form.Item name="questionsStr" label="Danh sách câu hỏi (Mỗi câu 1 dòng)" rules={[{ required: true }]}>
                        <TextArea rows={8} placeholder="Câu 1: ...&#10;Câu 2: ..." disabled={aiLoading} />
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
