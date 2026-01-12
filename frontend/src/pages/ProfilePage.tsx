import React, { useState, useEffect } from 'react';
import {
    Card, Tabs, Row, Col, Button, Table, Tag, Statistic, Space, Empty,
    Form, Input, DatePicker, message, Divider, Timeline, Descriptions, Avatar
} from 'antd';
import {
    UserOutlined, ClockCircleOutlined, CalendarOutlined, DollarOutlined,
    LoginOutlined, LogoutOutlined, CheckCircleOutlined, CloseCircleOutlined,
    ManOutlined, WomanOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;

const ProfilePage: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [leaveForm] = Form.useForm();
    const [viewPayslip, setViewPayslip] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            loadEmployeeData(user.id);
        }
    }, []);

    const [leaveBalance, setLeaveBalance] = useState<any>(null);

    const loadEmployeeData = async (userId: number) => {
        setLoading(true);
        try {
            // Find employee by user_id using dedicated endpoint
            const empRes = await api.get(`/hr/employees/by-user/${userId}`);
            const emp = empRes.data;
            setEmployee(emp);

            if (emp) {
                // Load related data
                const [attRes, leaveRes, payRes, assetRes, balRes] = await Promise.all([
                    api.get(`/hr/attendances?employee_id=${emp.id}`),
                    api.get('/hr/leaves'),
                    api.get(`/hr/payslips?employee_id=${emp.id}`),
                    api.get(`/hr/assets?employee_id=${emp.id}`),
                    api.get(`/hr/balance/${emp.id}?year=${new Date().getFullYear()}`).catch(() => ({ data: null })),
                ]);
                setAttendances(attRes.data || []);
                setLeaves((leaveRes.data || []).filter((l: any) => l.employee_id === emp.id));
                setPayslips(payRes.data || []);
                setAssets(assetRes.data || []);
                setLeaveBalance(balRes.data);
            }
        } catch (e) {
            console.error('Error loading employee data:', e);
        }
        setLoading(false);
    };

    const handleCheckIn = async () => {
        if (!employee) return;
        try {
            await api.post('/hr/check-in', { employee_id: employee.id });
            message.success('Check-in thành công!');
            loadEmployeeData(currentUser.id);
        } catch (e) { message.error('Lỗi check-in'); }
    };

    const handleCheckOut = async () => {
        if (!employee) return;
        try {
            await api.post('/hr/check-out', { employee_id: employee.id });
            message.success('Check-out thành công!');
            loadEmployeeData(currentUser.id);
        } catch (e) { message.error('Lỗi check-out'); }
    };

    const handleRequestLeave = async (values: any) => {
        if (!employee) return;
        try {
            await api.post('/hr/leaves', {
                employee_id: employee.id,
                leave_type: 'ANNUAL',
                start_date: values.start_date.format('YYYY-MM-DD'),
                end_date: values.end_date.format('YYYY-MM-DD'),
                reason: values.reason,
            });
            message.success('Đã gửi đơn nghỉ phép');
            leaveForm.resetFields();
            loadEmployeeData(currentUser.id);
        } catch (e) { message.error('Lỗi gửi đơn'); }
    };

    const formatMoney = (v: number) => (v || 0).toLocaleString();

    if (loading) return <Card loading />;

    if (!employee) {
        return (
            <Card>
                <Empty description={<span>Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên.<br />Vui lòng liên hệ Admin để được hỗ trợ.</span>} />
            </Card>
        );
    }

    const todayAttendance = attendances.find(a =>
        dayjs(a.date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    );

    return (
        <div style={{ padding: 20 }}>
            <Card>
                <Row gutter={24}>
                    <Col span={6} style={{ textAlign: 'center' }}>
                        <Avatar
                            size={100}
                            icon={employee.gender === 'FEMALE' ? <WomanOutlined /> : <ManOutlined />}
                            style={{ backgroundColor: employee.gender === 'FEMALE' ? '#eb2f96' : '#1890ff' }}
                        />
                        <h2 style={{ marginTop: 16, marginBottom: 4 }}>{employee.full_name}</h2>
                        <Tag color="blue">{employee.position || 'Nhân viên'}</Tag>
                        <p style={{ color: '#888' }}>{employee.department}</p>
                    </Col>
                    <Col span={18}>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Email">{currentUser?.email || '-'}</Descriptions.Item>
                            <Descriptions.Item label="SĐT">{employee.phone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày sinh">{employee.date_of_birth ? dayjs(employee.date_of_birth).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày vào làm">{employee.hire_date ? dayjs(employee.hire_date).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ" span={2}>{employee.address || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>
            </Card>

            <Card style={{ marginTop: 16 }}>
                <Tabs defaultActiveKey="attendance">
                    {/* TAB: CHẤM CÔNG */}
                    <TabPane tab={<><ClockCircleOutlined /> Chấm công</>} key="attendance">
                        <Row gutter={24}>
                            <Col span={8}>
                                <Card size="small" title="Hôm nay" style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                                        {dayjs().format('DD/MM/YYYY')}
                                    </p>
                                    {todayAttendance ? (
                                        <>
                                            <p>Check-in: <b>{todayAttendance.check_in ? dayjs(todayAttendance.check_in).format('HH:mm') : '-'}</b></p>
                                            <p>Check-out: <b>{todayAttendance.check_out ? dayjs(todayAttendance.check_out).format('HH:mm') : '-'}</b></p>
                                            <Tag color={todayAttendance.status === 'PRESENT' ? 'green' : 'orange'}>{todayAttendance.status}</Tag>
                                        </>
                                    ) : (
                                        <p style={{ color: '#999' }}>Chưa chấm công</p>
                                    )}
                                    <Divider />
                                    <Space>
                                        <Button type="primary" icon={<LoginOutlined />} onClick={handleCheckIn} disabled={!!todayAttendance?.check_in}>
                                            CHECK IN
                                        </Button>
                                        <Button icon={<LogoutOutlined />} onClick={handleCheckOut} disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}>
                                            CHECK OUT
                                        </Button>
                                    </Space>
                                </Card>
                            </Col>
                            <Col span={16}>
                                <Card size="small" title="Lịch sử chấm công">
                                    <Table
                                        dataSource={attendances.slice(0, 10)}
                                        columns={[
                                            { title: 'Ngày', dataIndex: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                                            { title: 'Check-in', dataIndex: 'check_in', render: (d: string) => d ? dayjs(d).format('HH:mm') : '-' },
                                            { title: 'Check-out', dataIndex: 'check_out', render: (d: string) => d ? dayjs(d).format('HH:mm') : '-' },
                                            { title: 'Giờ làm', dataIndex: 'work_hours', render: (h: number) => h ? `${h}h` : '-' },
                                            { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag color={s === 'PRESENT' ? 'green' : 'orange'}>{s}</Tag> },
                                        ]}
                                        rowKey="id"
                                        size="small"
                                        pagination={false}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* TAB: NGHỈ PHÉP */}
                    <TabPane tab={<><CalendarOutlined /> Nghỉ phép</>} key="leave">
                        <Row gutter={24}>
                            <Col span={24}>
                                {leaveBalance && (
                                    <div style={{ marginBottom: 16 }}>
                                        <Card size="small" title={`Số dư phép năm ${leaveBalance.year}`}>
                                            <Row gutter={16}>
                                                <Col span={6}><Statistic title="Phép năm" value={leaveBalance.annual_days} prefix={<CalendarOutlined />} /></Col>
                                                <Col span={6}><Statistic title="Tồn năm trước" value={leaveBalance.carried_days} /></Col>
                                                <Col span={6}><Statistic title="Đã sử dụng" value={leaveBalance.used_days} valueStyle={{ color: '#cf1322' }} /></Col>
                                                <Col span={6}><Statistic title="Còn lại" value={leaveBalance.remaining_days} valueStyle={{ color: '#3f8600' }} /></Col>
                                            </Row>
                                        </Card>
                                    </div>
                                )}
                            </Col>
                            <Col span={10}>
                                <Card size="small" title="Đăng ký nghỉ phép">
                                    <Form form={leaveForm} layout="vertical" onFinish={handleRequestLeave}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="start_date" label="Từ ngày" rules={[{ required: true }]}>
                                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="end_date" label="Đến ngày" rules={[{ required: true }]}>
                                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="reason" label="Lý do">
                                            <TextArea rows={3} />
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit">Gửi đơn</Button>
                                    </Form>
                                </Card>
                            </Col>
                            <Col span={14}>
                                <Card size="small" title="Đơn nghỉ phép của tôi">
                                    <Table
                                        dataSource={leaves}
                                        columns={[
                                            { title: 'Từ ngày', dataIndex: 'start_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                                            { title: 'Đến ngày', dataIndex: 'end_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                                            { title: 'Số ngày', dataIndex: 'days' },
                                            {
                                                title: 'Trạng thái', dataIndex: 'status', render: (s: string) => {
                                                    const c: any = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
                                                    const t: any = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
                                                    return <Tag color={c[s]}>{t[s]}</Tag>;
                                                }
                                            }
                                        ]}
                                        rowKey="id"
                                        size="small"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* TAB: BẢNG LƯƠNG */}
                    <TabPane tab={<><DollarOutlined /> Bảng lương</>} key="payslip">
                        <Table
                            dataSource={payslips}
                            columns={[
                                { title: 'Tháng', render: (_: any, r: any) => `${r.month}/${r.year}` },
                                { title: 'Lương CB', dataIndex: 'base_salary', render: (v: number) => formatMoney(v) },
                                { title: 'Ngày công', dataIndex: 'actual_work_days' },
                                { title: 'Tổng thu', dataIndex: 'gross_income', render: (v: number) => formatMoney(v) },
                                { title: 'Thực nhận', dataIndex: 'net_salary', render: (v: number) => <b style={{ color: 'green' }}>{formatMoney(v)}</b> },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'is_paid',
                                    render: (p: boolean) => p ?
                                        <Tag color="green" icon={<CheckCircleOutlined />}>Đã TT</Tag> :
                                        <Tag color="orange">Chưa TT</Tag>
                                },
                                { title: '', render: (_: any, r: any) => <Button size="small" onClick={() => setViewPayslip(r)}>Xem chi tiết</Button> }
                            ]}
                            rowKey="id"
                            size="small"
                        />

                        {/* Payslip Detail Modal */}
                        {viewPayslip && (
                            <Card
                                title={
                                    <Space>
                                        <span>Phiếu lương tháng {viewPayslip.month}/{viewPayslip.year}</span>
                                        {viewPayslip.is_paid ?
                                            <Tag color="green" icon={<CheckCircleOutlined />}>ĐÃ THANH TOÁN</Tag> :
                                            <Tag color="orange" icon={<ClockCircleOutlined />}>CHƯA THANH TOÁN</Tag>}
                                    </Space>
                                }
                                style={{ marginTop: 16 }}
                                extra={<Button onClick={() => setViewPayslip(null)}>Đóng</Button>}
                            >
                                <div style={{ maxWidth: 450, margin: '0 auto', fontFamily: 'monospace' }}>
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

                                    <Divider style={{ margin: '16px 0 8px' }} />
                                    <Row style={{ fontSize: 18, fontWeight: 'bold', color: 'green' }}>
                                        <Col span={14}>THỰC NHẬN</Col>
                                        <Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.net_salary)}</Col>
                                    </Row>

                                    {viewPayslip.is_paid && viewPayslip.paid_date && (
                                        <div style={{ marginTop: 12, textAlign: 'center', color: '#888', fontSize: 12 }}>
                                            Ngày thanh toán: {dayjs(viewPayslip.paid_date).format('DD/MM/YYYY')}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </TabPane>

                    {/* TAB: TÀI SẢN */}
                    <TabPane tab="Tài sản được cấp" key="assets">
                        <Table
                            dataSource={assets}
                            columns={[
                                { title: 'Tên tài sản', dataIndex: 'asset_name' },
                                { title: 'Mã', dataIndex: 'asset_code' },
                                { title: 'Serial', dataIndex: 'serial_number' },
                                { title: 'Ngày cấp', dataIndex: 'assigned_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                                {
                                    title: 'Tình trạng', dataIndex: 'condition', render: (c: string) => {
                                        const colors: any = { NEW: 'green', GOOD: 'blue', FAIR: 'orange', DAMAGED: 'red' };
                                        return <Tag color={colors[c]}>{c}</Tag>;
                                    }
                                }
                            ]}
                            rowKey="id"
                            size="small"
                        />
                    </TabPane>
                </Tabs >
            </Card >
        </div >
    );
};

export default ProfilePage;
