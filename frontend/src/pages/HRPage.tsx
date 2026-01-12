import React, { useState, useEffect } from 'react';
import {
    Tabs, Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber,
    Card, Row, Col, Tag, message, Popconfirm, Space, Badge, Progress, Timeline,
    Statistic, Empty, Descriptions, Divider, Calendar, List, Avatar
} from 'antd';
import {
    UserOutlined, ClockCircleOutlined, CalendarOutlined, GiftOutlined,
    DollarOutlined, ReadOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
    CheckCircleOutlined, CloseCircleOutlined, LoginOutlined, LogoutOutlined,
    ManOutlined, WomanOutlined, TeamOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const HRPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('employees');

    // ==================== EMPLOYEES STATE ====================
    const [employees, setEmployees] = useState<any[]>([]);
    const [empModal, setEmpModal] = useState(false);
    const [empForm] = Form.useForm();
    const [editingEmp, setEditingEmp] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    // ==================== ATTENDANCE STATE ====================
    const [attendances, setAttendances] = useState<any[]>([]);
    const [selectedEmpForAttendance, setSelectedEmpForAttendance] = useState<number | null>(null);

    // ==================== LEAVE STATE ====================
    const [leaves, setLeaves] = useState<any[]>([]);
    const [leaveModal, setLeaveModal] = useState(false);
    const [leaveForm] = Form.useForm();

    // ==================== ASSETS STATE ====================
    const [assets, setAssets] = useState<any[]>([]);
    const [assetModal, setAssetModal] = useState(false);
    const [assetForm] = Form.useForm();
    const [editingAsset, setEditingAsset] = useState<any>(null);

    // ==================== PAYSLIPS STATE ====================
    const [payslips, setPayslips] = useState<any[]>([]);
    const [payslipModal, setPayslipModal] = useState(false);
    const [payslipForm] = Form.useForm();
    const [viewPayslip, setViewPayslip] = useState<any>(null);

    // ==================== TRAINING STATE ====================
    const [trainings, setTrainings] = useState<any[]>([]);
    const [trainingModal, setTrainingModal] = useState(false);
    const [trainingForm] = Form.useForm();
    const [editingTraining, setEditingTraining] = useState<any>(null);

    // ==================== LOAD DATA ====================
    useEffect(() => {
        loadEmployees();
        loadUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'attendance') loadAttendances();
        if (activeTab === 'leave') loadLeaves();
        if (activeTab === 'assets') loadAssets();
        if (activeTab === 'payslip') loadPayslips();
        if (activeTab === 'training') loadTrainings();
    }, [activeTab]);

    const loadEmployees = async () => {
        try {
            const res = await api.get('/hr/employees');
            setEmployees(res.data);
        } catch (e) { console.error(e); }
    };

    const loadUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) { console.error(e); }
    };

    const loadAttendances = async () => {
        try {
            const res = await api.get('/hr/attendances');
            setAttendances(res.data);
        } catch (e) { console.error(e); }
    };

    const loadLeaves = async () => {
        try {
            const res = await api.get('/hr/leaves');
            setLeaves(res.data);
        } catch (e) { console.error(e); }
    };

    const loadAssets = async () => {
        try {
            const res = await api.get('/hr/assets');
            setAssets(res.data);
        } catch (e) { console.error(e); }
    };

    const loadPayslips = async () => {
        try {
            const res = await api.get('/hr/payslips');
            setPayslips(res.data);
        } catch (e) { console.error(e); }
    };

    const loadTrainings = async () => {
        try {
            const res = await api.get('/hr/trainings');
            setTrainings(res.data);
        } catch (e) { console.error(e); }
    };

    // ==================== EMPLOYEE FUNCTIONS ====================
    const handleSaveEmployee = async (values: any) => {
        try {
            if (values.date_of_birth) values.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
            if (values.hire_date) values.hire_date = values.hire_date.format('YYYY-MM-DD');

            if (editingEmp) {
                await api.put(`/hr/employees/${editingEmp.id}`, values);
                message.success('Đã cập nhật');
            } else {
                await api.post('/hr/employees', values);
                message.success('Đã thêm nhân viên');
            }
            setEmpModal(false);
            empForm.resetFields();
            setEditingEmp(null);
            loadEmployees();
        } catch (e) { message.error('Lỗi lưu nhân viên'); }
    };

    const handleEditEmployee = (emp: any) => {
        setEditingEmp(emp);
        empForm.setFieldsValue({
            ...emp,
            date_of_birth: emp.date_of_birth ? dayjs(emp.date_of_birth) : null,
            hire_date: emp.hire_date ? dayjs(emp.hire_date) : null,
        });
        setEmpModal(true);
    };

    const handleDeleteEmployee = async (id: number) => {
        try {
            await api.delete(`/hr/employees/${id}`);
            message.success('Đã xóa');
            loadEmployees();
        } catch (e) { message.error('Lỗi xóa'); }
    };

    // ==================== ATTENDANCE FUNCTIONS ====================
    const handleCheckIn = async (empId: number) => {
        try {
            await api.post('/hr/check-in', { employee_id: empId });
            message.success('Check-in thành công!');
            loadAttendances();
        } catch (e) { message.error('Lỗi check-in'); }
    };

    const handleCheckOut = async (empId: number) => {
        try {
            await api.post('/hr/check-out', { employee_id: empId });
            message.success('Check-out thành công!');
            loadAttendances();
        } catch (e) { message.error('Lỗi check-out'); }
    };

    // ==================== LEAVE FUNCTIONS ====================
    const handleSaveLeave = async (values: any) => {
        try {
            values.start_date = values.start_date.format('YYYY-MM-DD');
            values.end_date = values.end_date.format('YYYY-MM-DD');
            await api.post('/hr/leaves', values);
            message.success('Đã tạo đơn nghỉ phép');
            setLeaveModal(false);
            leaveForm.resetFields();
            loadLeaves();
        } catch (e) { message.error('Lỗi tạo đơn'); }
    };

    const handleApproveLeave = async (id: number, approved: boolean) => {
        try {
            await api.put(`/hr/leaves/${id}/approve`, { approved });
            message.success(approved ? 'Đã duyệt' : 'Đã từ chối');
            loadLeaves();
        } catch (e) { message.error('Lỗi duyệt đơn'); }
    };

    // ==================== ASSET FUNCTIONS ====================
    const handleSaveAsset = async (values: any) => {
        try {
            values.assigned_date = values.assigned_date.format('YYYY-MM-DD');
            if (values.returned_date) values.returned_date = values.returned_date.format('YYYY-MM-DD');

            if (editingAsset) {
                await api.put(`/hr/assets/${editingAsset.id}`, values);
                message.success('Đã cập nhật');
            } else {
                await api.post('/hr/assets', values);
                message.success('Đã thêm tài sản');
            }
            setAssetModal(false);
            assetForm.resetFields();
            setEditingAsset(null);
            loadAssets();
        } catch (e) { message.error('Lỗi lưu tài sản'); }
    };

    // ==================== PAYSLIP FUNCTIONS ====================
    const handleSavePayslip = async (values: any) => {
        try {
            await api.post('/hr/payslips', values);
            message.success('Đã tạo phiếu lương');
            setPayslipModal(false);
            payslipForm.resetFields();
            loadPayslips();
        } catch (e) { message.error('Lỗi tạo phiếu'); }
    };

    // ==================== TRAINING FUNCTIONS ====================
    const handleSaveTraining = async (values: any) => {
        try {
            if (values.start_date) values.start_date = values.start_date.format('YYYY-MM-DD');
            if (values.target_date) values.target_date = values.target_date.format('YYYY-MM-DD');
            if (values.skills) values.skills = values.skills.split(',').map((s: string) => s.trim());

            if (editingTraining) {
                await api.put(`/hr/trainings/${editingTraining.id}`, values);
                message.success('Đã cập nhật');
            } else {
                await api.post('/hr/trainings', values);
                message.success('Đã thêm kế hoạch đào tạo');
            }
            setTrainingModal(false);
            trainingForm.resetFields();
            setEditingTraining(null);
            loadTrainings();
        } catch (e) { message.error('Lỗi lưu'); }
    };

    // ==================== RENDER TABS ====================
    const empColumns = [
        { title: 'ID', dataIndex: 'id', width: 60 },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            render: (t: string, r: any) => (
                <Space>
                    <Avatar icon={r.gender === 'FEMALE' ? <WomanOutlined /> : <ManOutlined />}
                        style={{ backgroundColor: r.gender === 'FEMALE' ? '#eb2f96' : '#1890ff' }} />
                    {t}
                </Space>
            )
        },
        { title: 'Giới tính', dataIndex: 'gender', render: (g: string) => g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : 'Khác' },
        { title: 'Ngày sinh', dataIndex: 'date_of_birth', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
        { title: 'Phòng ban', dataIndex: 'department' },
        { title: 'Chức vụ', dataIndex: 'position' },
        { title: 'Lương cơ bản', dataIndex: 'base_salary', render: (v: number) => v?.toLocaleString() + ' đ' },
        { title: 'User', dataIndex: ['user', 'username'], render: (u: string) => u || <Tag>Chưa liên kết</Tag> },
        {
            title: 'Thao tác',
            render: (_: any, r: any) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEditEmployee(r)} />
                    <Popconfirm title="Xóa nhân viên này?" onConfirm={() => handleDeleteEmployee(r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const leaveColumns = [
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
            title: 'Duyệt',
            render: (_: any, r: any) => r.status === 'PENDING' && (
                <Space>
                    <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApproveLeave(r.id, true)}>Duyệt</Button>
                    <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleApproveLeave(r.id, false)}>Từ chối</Button>
                </Space>
            )
        }
    ];

    const assetColumns = [
        { title: 'Nhân viên', dataIndex: ['employee', 'full_name'] },
        { title: 'Tên tài sản', dataIndex: 'asset_name' },
        { title: 'Mã', dataIndex: 'asset_code' },
        { title: 'Serial', dataIndex: 'serial_number' },
        { title: 'Ngày cấp', dataIndex: 'assigned_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
        { title: 'Ngày trả', dataIndex: 'returned_date', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
        {
            title: 'Tình trạng', dataIndex: 'condition', render: (c: string) => {
                const colors: any = { NEW: 'green', GOOD: 'blue', FAIR: 'orange', DAMAGED: 'red' };
                const labels: any = { NEW: 'Mới', GOOD: 'Tốt', FAIR: 'Bình thường', DAMAGED: 'Hư hỏng' };
                return <Tag color={colors[c]}>{labels[c]}</Tag>;
            }
        },
    ];

    const payslipColumns = [
        { title: 'Nhân viên', dataIndex: ['employee', 'full_name'] },
        { title: 'Tháng', render: (_: any, r: any) => `${r.month}/${r.year}` },
        { title: 'Lương CB', dataIndex: 'base_salary', render: (v: number) => v?.toLocaleString() },
        { title: 'Ngày công', dataIndex: 'actual_work_days' },
        { title: 'Tổng thu', dataIndex: 'gross_income', render: (v: number) => v?.toLocaleString() },
        { title: 'Thực nhận', dataIndex: 'net_salary', render: (v: number) => <b style={{ color: 'green' }}>{v?.toLocaleString()}</b> },
        { title: '', render: (_: any, r: any) => <Button size="small" onClick={() => setViewPayslip(r)}>Xem phiếu</Button> }
    ];

    const formatMoney = (v: number) => (v || 0).toLocaleString();

    return (
        <div style={{ padding: 20 }}>
            <Card title={<><TeamOutlined /> Quản Lý Nhân Sự (HR)</>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    {/* TAB 1: NHÂN VIÊN */}
                    <TabPane tab={<><UserOutlined /> Nhân viên</>} key="employees">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingEmp(null); empForm.resetFields(); setEmpModal(true); }} style={{ marginBottom: 16 }}>
                            Thêm nhân viên
                        </Button>
                        <Table dataSource={employees} columns={empColumns} rowKey="id" size="small" />
                    </TabPane>

                    {/* TAB 2: CHẤM CÔNG */}
                    <TabPane tab={<><ClockCircleOutlined /> Chấm công</>} key="attendance">
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card title="Chọn nhân viên" size="small">
                                    <List
                                        dataSource={employees}
                                        renderItem={(emp: any) => (
                                            <List.Item
                                                style={{ cursor: 'pointer', background: selectedEmpForAttendance === emp.id ? '#e6f7ff' : 'transparent' }}
                                                onClick={() => setSelectedEmpForAttendance(emp.id)}
                                            >
                                                <List.Item.Meta avatar={<Avatar icon={<UserOutlined />} />} title={emp.full_name} description={emp.position} />
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </Col>
                            <Col span={16}>
                                {selectedEmpForAttendance ? (
                                    <Card title="Chấm công hôm nay" size="small">
                                        <Space size="large">
                                            <Button type="primary" size="large" icon={<LoginOutlined />} onClick={() => handleCheckIn(selectedEmpForAttendance)}>
                                                CHECK IN
                                            </Button>
                                            <Button size="large" icon={<LogoutOutlined />} onClick={() => handleCheckOut(selectedEmpForAttendance)}>
                                                CHECK OUT
                                            </Button>
                                        </Space>
                                        <Divider />
                                        <Table
                                            dataSource={attendances.filter(a => a.employee_id === selectedEmpForAttendance)}
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
                    </TabPane>

                    {/* TAB 3: NGHỈ PHÉP */}
                    <TabPane tab={<><CalendarOutlined /> Nghỉ phép</>} key="leave">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { leaveForm.resetFields(); setLeaveModal(true); }} style={{ marginBottom: 16 }}>
                            Đăng ký nghỉ phép
                        </Button>
                        <Table dataSource={leaves} columns={leaveColumns} rowKey="id" size="small" />
                    </TabPane>

                    {/* TAB 4: TÀI SẢN */}
                    <TabPane tab={<><GiftOutlined /> Tài sản</>} key="assets">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingAsset(null); assetForm.resetFields(); setAssetModal(true); }} style={{ marginBottom: 16 }}>
                            Cấp phát tài sản
                        </Button>
                        <Table dataSource={assets} columns={assetColumns} rowKey="id" size="small" />
                    </TabPane>

                    {/* TAB 5: BẢNG LƯƠNG */}
                    <TabPane tab={<><DollarOutlined /> Bảng lương</>} key="payslip">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { payslipForm.resetFields(); setPayslipModal(true); }} style={{ marginBottom: 16 }}>
                            Tạo phiếu lương
                        </Button>
                        <Table dataSource={payslips} columns={payslipColumns} rowKey="id" size="small" />
                    </TabPane>

                    {/* TAB 6: ĐÀO TẠO */}
                    <TabPane tab={<><ReadOutlined /> Đào tạo</>} key="training">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTraining(null); trainingForm.resetFields(); setTrainingModal(true); }} style={{ marginBottom: 16 }}>
                            Thêm kế hoạch
                        </Button>
                        <Row gutter={16}>
                            {trainings.map((t: any) => (
                                <Col span={8} key={t.id} style={{ marginBottom: 16 }}>
                                    <Card
                                        title={t.title}
                                        size="small"
                                        extra={<Tag color={t.status === 'COMPLETED' ? 'green' : t.status === 'IN_PROGRESS' ? 'blue' : 'default'}>{t.status}</Tag>}
                                    >
                                        <p><b>Nhân viên:</b> {t.employee?.full_name}</p>
                                        <p><b>Kỹ năng:</b> {t.skills?.join(', ')}</p>
                                        <Progress percent={t.progress} size="small" />
                                        {t.milestones && (
                                            <Timeline style={{ marginTop: 16 }}>
                                                {t.milestones.map((m: any, i: number) => (
                                                    <Timeline.Item key={i} color={m.completed ? 'green' : 'gray'}>
                                                        {m.title}
                                                    </Timeline.Item>
                                                ))}
                                            </Timeline>
                                        )}
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </TabPane>
                </Tabs>
            </Card>

            {/* EMPLOYEE MODAL */}
            <Modal title={editingEmp ? 'Sửa nhân viên' : 'Thêm nhân viên'} open={empModal} onCancel={() => setEmpModal(false)} onOk={() => empForm.submit()} width={600}>
                <Form form={empForm} layout="vertical" onFinish={handleSaveEmployee}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="full_name" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="gender" label="Giới tính"><Select><Option value="MALE">Nam</Option><Option value="FEMALE">Nữ</Option><Option value="OTHER">Khác</Option></Select></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="date_of_birth" label="Ngày sinh"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="department" label="Phòng ban"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="position" label="Chức vụ"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="hire_date" label="Ngày vào làm"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="base_salary" label="Lương cơ bản"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="user_id" label="Liên kết User">
                        <Select allowClear placeholder="Chọn user hệ thống">
                            {users.map(u => <Option key={u.id} value={u.id}>{u.username} - {u.full_name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* LEAVE MODAL */}
            <Modal title="Đăng ký nghỉ phép" open={leaveModal} onCancel={() => setLeaveModal(false)} onOk={() => leaveForm.submit()}>
                <Form form={leaveForm} layout="vertical" onFinish={handleSaveLeave}>
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

            {/* ASSET MODAL */}
            <Modal title="Cấp phát tài sản" open={assetModal} onCancel={() => setAssetModal(false)} onOk={() => assetForm.submit()}>
                <Form form={assetForm} layout="vertical" onFinish={handleSaveAsset}>
                    <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                        <Select>{employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}</Select>
                    </Form.Item>
                    <Form.Item name="asset_name" label="Tên tài sản" rules={[{ required: true }]}><Input placeholder="VD: Laptop Dell XPS 15" /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="asset_code" label="Mã tài sản"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="serial_number" label="Serial Number"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="assigned_date" label="Ngày cấp" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="condition" label="Tình trạng"><Select><Option value="NEW">Mới</Option><Option value="GOOD">Tốt</Option><Option value="FAIR">Bình thường</Option></Select></Form.Item></Col>
                    </Row>
                    <Form.Item name="note" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* PAYSLIP MODAL */}
            <Modal title="Tạo phiếu lương" open={payslipModal} onCancel={() => setPayslipModal(false)} onOk={() => payslipForm.submit()} width={600}>
                <Form form={payslipForm} layout="vertical" onFinish={handleSavePayslip}>
                    <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                        <Select onChange={(id) => {
                            const emp = employees.find(e => e.id === id);
                            if (emp) payslipForm.setFieldsValue({ base_salary: emp.base_salary });
                        }}>
                            {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="month" label="Tháng" rules={[{ required: true }]}><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="year" label="Năm" rules={[{ required: true }]}><InputNumber min={2020} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="actual_work_days" label="Ngày công" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="base_salary" label="Lương cơ bản"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="bonus" label="Thưởng"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="allowance_meal" label="PC Ăn trưa"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="allowance_transport" label="PC Đi lại"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="allowance_phone" label="PC Điện thoại"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>

            {/* PAYSLIP VIEW MODAL */}
            <Modal title="Phiếu Lương" open={!!viewPayslip} onCancel={() => setViewPayslip(null)} footer={null} width={400}>
                {viewPayslip && (
                    <div style={{ fontFamily: 'monospace' }}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>BẢNG THANH TOÁN LƯƠNG</h3>
                            <p>Tháng {viewPayslip.month} / {viewPayslip.year}</p>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <p><b>Nhân viên:</b> {viewPayslip.employee?.full_name}</p>
                        <p><b>Chức vụ:</b> {viewPayslip.employee?.position}</p>
                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ background: '#f5f5f5', padding: 8, marginBottom: 8 }}><b>THU NHẬP</b></div>
                        <Row><Col span={14}>Lương cơ bản</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.base_salary)}</Col></Row>
                        <Row><Col span={14}>Ngày công: {viewPayslip.actual_work_days}/{viewPayslip.standard_work_days}</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.actual_salary)}</Col></Row>
                        <Row><Col span={14}>PC Ăn trưa</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.allowance_meal)}</Col></Row>
                        <Row><Col span={14}>PC Đi lại</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.allowance_transport)}</Col></Row>
                        <Row><Col span={14}>PC Điện thoại</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.allowance_phone)}</Col></Row>
                        <Row><Col span={14}>Thưởng</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.bonus)}</Col></Row>
                        <Row style={{ fontWeight: 'bold', marginTop: 8 }}><Col span={14}>TỔNG THU NHẬP</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.gross_income)}</Col></Row>

                        <div style={{ background: '#fff1f0', padding: 8, margin: '16px 0 8px' }}><b>KHẤU TRỪ</b></div>
                        <Row><Col span={14}>BHXH (8%)</Col><Col span={10} style={{ textAlign: 'right' }}>-{formatMoney(viewPayslip.bhxh_employee)}</Col></Row>
                        <Row><Col span={14}>BHYT (1.5%)</Col><Col span={10} style={{ textAlign: 'right' }}>-{formatMoney(viewPayslip.bhyt_employee)}</Col></Row>
                        <Row><Col span={14}>BHTN (1%)</Col><Col span={10} style={{ textAlign: 'right' }}>-{formatMoney(viewPayslip.bhtn_employee)}</Col></Row>
                        <Row><Col span={14}>Công đoàn</Col><Col span={10} style={{ textAlign: 'right' }}>-{formatMoney(viewPayslip.union_fee)}</Col></Row>
                        <Row><Col span={14}>Thuế TNCN</Col><Col span={10} style={{ textAlign: 'right' }}>-{formatMoney(viewPayslip.tax_income)}</Col></Row>

                        <Divider style={{ margin: '16px 0 8px' }} />
                        <Row style={{ fontSize: 18, fontWeight: 'bold', color: 'green' }}>
                            <Col span={14}>THỰC NHẬN</Col>
                            <Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.net_salary)}</Col>
                        </Row>

                        <div style={{ background: '#e6f7ff', padding: 8, marginTop: 16, fontSize: 11 }}>
                            <b>Công ty đóng:</b> BHXH {formatMoney(viewPayslip.bhxh_company)} | BHYT {formatMoney(viewPayslip.bhyt_company)} | BHTN {formatMoney(viewPayslip.bhtn_company)}
                        </div>
                    </div>
                )}
            </Modal>

            {/* TRAINING MODAL */}
            <Modal title="Kế hoạch đào tạo" open={trainingModal} onCancel={() => setTrainingModal(false)} onOk={() => trainingForm.submit()}>
                <Form form={trainingForm} layout="vertical" onFinish={handleSaveTraining}>
                    <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                        <Select>{employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}</Select>
                    </Form.Item>
                    <Form.Item name="title" label="Tên kế hoạch" rules={[{ required: true }]}><Input placeholder="VD: Đào tạo kỹ năng lãnh đạo" /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><TextArea rows={2} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label="Ngày bắt đầu"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="target_date" label="Ngày hoàn thành"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="skills" label="Kỹ năng (phân cách bởi dấu phẩy)"><Input placeholder="VD: Leadership, Communication, Problem Solving" /></Form.Item>
                    <Form.Item name="status" label="Trạng thái">
                        <Select>
                            <Option value="PLANNED">Kế hoạch</Option>
                            <Option value="IN_PROGRESS">Đang thực hiện</Option>
                            <Option value="COMPLETED">Hoàn thành</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default HRPage;
