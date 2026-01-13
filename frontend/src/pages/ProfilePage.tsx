import React, { useState, useEffect } from 'react';
import {
    Card, Tabs, Row, Col, Button, Table, Tag, Statistic, Space, Empty,
    Form, Input, DatePicker, message, Divider, Timeline, Descriptions, Avatar
} from 'antd';
import {
    UserOutlined, ClockCircleOutlined, CalendarOutlined, DollarOutlined,
    LoginOutlined, LogoutOutlined, CheckCircleOutlined, CloseCircleOutlined,
    ManOutlined, WomanOutlined, BankOutlined, GiftOutlined, CarOutlined,
    CoffeeOutlined, PhoneOutlined, SafetyCertificateOutlined, PrinterOutlined,
    WalletOutlined, RiseOutlined, FallOutlined
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

    const formatMoney = (v: any) => {
        const num = Number(v) || 0;
        return num.toLocaleString('vi-VN');
    };

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
                    {/* TAB: CHẤM CÔNG - Premium Design */}
                    <TabPane tab={<><ClockCircleOutlined /> Chấm công</>} key="attendance">
                        <Row gutter={24}>
                            {/* Today's Attendance Card */}
                            <Col xs={24} md={10}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: 16,
                                    padding: 24,
                                    color: '#fff',
                                    marginBottom: 16,
                                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                                }}>
                                    <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>
                                        <CalendarOutlined /> HÔM NAY
                                    </div>
                                    <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
                                        {dayjs().format('DD/MM/YYYY')}
                                    </div>
                                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                                        {dayjs().format('dddd').charAt(0).toUpperCase() + dayjs().format('dddd').slice(1)}
                                    </div>
                                </div>

                                {/* Check In/Out Status */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: 20,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                    marginBottom: 16
                                }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <div style={{
                                                background: todayAttendance?.check_in ? '#f6ffed' : '#f5f5f5',
                                                borderRadius: 12,
                                                padding: 16,
                                                textAlign: 'center'
                                            }}>
                                                <LoginOutlined style={{ fontSize: 24, color: todayAttendance?.check_in ? '#52c41a' : '#999' }} />
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Check-in</div>
                                                <div style={{ fontSize: 20, fontWeight: 600, color: todayAttendance?.check_in ? '#52c41a' : '#999' }}>
                                                    {todayAttendance?.check_in ? dayjs(todayAttendance.check_in).format('HH:mm') : '--:--'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{
                                                background: todayAttendance?.check_out ? '#fff7e6' : '#f5f5f5',
                                                borderRadius: 12,
                                                padding: 16,
                                                textAlign: 'center'
                                            }}>
                                                <LogoutOutlined style={{ fontSize: 24, color: todayAttendance?.check_out ? '#fa8c16' : '#999' }} />
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Check-out</div>
                                                <div style={{ fontSize: 20, fontWeight: 600, color: todayAttendance?.check_out ? '#fa8c16' : '#999' }}>
                                                    {todayAttendance?.check_out ? dayjs(todayAttendance.check_out).format('HH:mm') : '--:--'}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {todayAttendance && (
                                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                                            <Tag
                                                color={todayAttendance.status === 'PRESENT' ? 'green' : 'orange'}
                                                style={{ fontSize: 13, padding: '4px 16px' }}
                                            >
                                                {todayAttendance.status === 'PRESENT' ? '✓ Có mặt' : todayAttendance.status}
                                            </Tag>
                                        </div>
                                    )}

                                    <Divider style={{ margin: '20px 0 16px' }} />

                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Button
                                                type="primary"
                                                icon={<LoginOutlined />}
                                                onClick={handleCheckIn}
                                                disabled={!!todayAttendance?.check_in}
                                                block
                                                size="large"
                                                style={{
                                                    borderRadius: 10,
                                                    height: 48,
                                                    background: todayAttendance?.check_in ? undefined : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                                    border: 'none'
                                                }}
                                            >
                                                CHECK IN
                                            </Button>
                                        </Col>
                                        <Col span={12}>
                                            <Button
                                                icon={<LogoutOutlined />}
                                                onClick={handleCheckOut}
                                                disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}
                                                block
                                                size="large"
                                                style={{
                                                    borderRadius: 10,
                                                    height: 48,
                                                    background: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? undefined : '#fa8c16',
                                                    borderColor: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? undefined : '#fa8c16',
                                                    color: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? undefined : '#fff'
                                                }}
                                            >
                                                CHECK OUT
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>

                            {/* Attendance History */}
                            <Col xs={24} md={14}>
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: 20,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ClockCircleOutlined style={{ color: '#1890ff' }} /> Lịch sử chấm công
                                    </div>
                                    <Table
                                        dataSource={attendances.slice(0, 10)}
                                        columns={[
                                            {
                                                title: 'Ngày',
                                                dataIndex: 'date',
                                                render: (d: string) => (
                                                    <span style={{ fontWeight: 500 }}>{dayjs(d).format('DD/MM')}</span>
                                                )
                                            },
                                            {
                                                title: 'Vào',
                                                dataIndex: 'check_in',
                                                render: (d: string) => (
                                                    <span style={{ color: d ? '#52c41a' : '#999' }}>
                                                        {d ? dayjs(d).format('HH:mm') : '-'}
                                                    </span>
                                                )
                                            },
                                            {
                                                title: 'Ra',
                                                dataIndex: 'check_out',
                                                render: (d: string) => (
                                                    <span style={{ color: d ? '#fa8c16' : '#999' }}>
                                                        {d ? dayjs(d).format('HH:mm') : '-'}
                                                    </span>
                                                )
                                            },
                                            {
                                                title: 'Giờ',
                                                dataIndex: 'work_hours',
                                                render: (h: number) => (
                                                    <Tag color={h >= 8 ? 'green' : h > 0 ? 'orange' : 'default'}>
                                                        {h ? `${h}h` : '-'}
                                                    </Tag>
                                                )
                                            },
                                            {
                                                title: '',
                                                dataIndex: 'status',
                                                render: (s: string) => (
                                                    s === 'PRESENT' ?
                                                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                                                        <CloseCircleOutlined style={{ color: '#faad14' }} />
                                                )
                                            },
                                        ]}
                                        rowKey="id"
                                        size="small"
                                        pagination={false}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* TAB: NGHỈ PHÉP - Premium Design */}
                    <TabPane tab={<><CalendarOutlined /> Nghỉ phép</>} key="leave">
                        {/* Leave Balance Summary */}
                        {leaveBalance && (
                            <div style={{
                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                borderRadius: 16,
                                padding: 24,
                                color: '#fff',
                                marginBottom: 24,
                                boxShadow: '0 4px 20px rgba(19, 194, 194, 0.3)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 14, opacity: 0.85 }}>
                                            <CalendarOutlined /> SỐ DƯ PHÉP NĂM {leaveBalance.year}
                                        </div>
                                        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
                                            {leaveBalance.remaining_days} <span style={{ fontSize: 16, fontWeight: 400 }}>ngày còn lại</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 28,
                                        fontWeight: 700
                                    }}>
                                        {Math.round((leaveBalance.remaining_days / (leaveBalance.annual_days + leaveBalance.carried_days)) * 100)}%
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, height: 8, marginBottom: 16 }}>
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 8,
                                        height: 8,
                                        width: `${Math.min(100, (leaveBalance.remaining_days / (leaveBalance.annual_days + leaveBalance.carried_days)) * 100)}%`,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>

                                <Row gutter={16}>
                                    <Col span={6}>
                                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, fontWeight: 600 }}>{leaveBalance.annual_days}</div>
                                            <div style={{ fontSize: 12, opacity: 0.85 }}>Phép năm</div>
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, fontWeight: 600 }}>{leaveBalance.carried_days}</div>
                                            <div style={{ fontSize: 12, opacity: 0.85 }}>Tồn năm trước</div>
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, fontWeight: 600 }}>{leaveBalance.used_days}</div>
                                            <div style={{ fontSize: 12, opacity: 0.85 }}>Đã sử dụng</div>
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, fontWeight: 600 }}>{leaveBalance.remaining_days}</div>
                                            <div style={{ fontSize: 12, opacity: 0.85 }}>Còn lại ✓</div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        <Row gutter={24}>
                            {/* Leave Request Form */}
                            <Col xs={24} md={10}>
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: 24,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CalendarOutlined style={{ color: '#13c2c2' }} /> Đăng ký nghỉ phép
                                    </div>
                                    <Form form={leaveForm} layout="vertical" onFinish={handleRequestLeave}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="start_date" label={<span style={{ fontWeight: 500 }}>Từ ngày</span>} rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}>
                                                    <DatePicker
                                                        style={{ width: '100%', borderRadius: 8 }}
                                                        format="DD/MM/YYYY"
                                                        placeholder="Chọn ngày"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="end_date" label={<span style={{ fontWeight: 500 }}>Đến ngày</span>} rules={[{ required: true, message: 'Chọn ngày kết thúc' }]}>
                                                    <DatePicker
                                                        style={{ width: '100%', borderRadius: 8 }}
                                                        format="DD/MM/YYYY"
                                                        placeholder="Chọn ngày"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="reason" label={<span style={{ fontWeight: 500 }}>Lý do nghỉ phép</span>}>
                                            <TextArea
                                                rows={3}
                                                placeholder="Nhập lý do nghỉ phép..."
                                                style={{ borderRadius: 8 }}
                                            />
                                        </Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            size="large"
                                            style={{
                                                borderRadius: 10,
                                                height: 48,
                                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                                border: 'none'
                                            }}
                                        >
                                            <CalendarOutlined /> Gửi đơn nghỉ phép
                                        </Button>
                                    </Form>
                                </div>
                            </Col>

                            {/* Leave History */}
                            <Col xs={24} md={14}>
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: 24,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ClockCircleOutlined style={{ color: '#1890ff' }} /> Lịch sử đơn nghỉ phép
                                    </div>
                                    <Table
                                        dataSource={leaves}
                                        columns={[
                                            {
                                                title: 'Từ ngày',
                                                dataIndex: 'start_date',
                                                render: (d: string) => (
                                                    <span style={{ fontWeight: 500 }}>{dayjs(d).format('DD/MM/YYYY')}</span>
                                                )
                                            },
                                            {
                                                title: 'Đến ngày',
                                                dataIndex: 'end_date',
                                                render: (d: string) => dayjs(d).format('DD/MM/YYYY')
                                            },
                                            {
                                                title: 'Ngày',
                                                dataIndex: 'days',
                                                render: (d: number) => (
                                                    <Tag color="blue">{d} ngày</Tag>
                                                )
                                            },
                                            {
                                                title: 'Trạng thái',
                                                dataIndex: 'status',
                                                render: (s: string) => {
                                                    const config: any = {
                                                        PENDING: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Chờ duyệt' },
                                                        APPROVED: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã duyệt' },
                                                        REJECTED: { color: 'red', icon: <CloseCircleOutlined />, text: 'Từ chối' }
                                                    };
                                                    const item = config[s] || config.PENDING;
                                                    return (
                                                        <Tag color={item.color} icon={item.icon} style={{ borderRadius: 6 }}>
                                                            {item.text}
                                                        </Tag>
                                                    );
                                                }
                                            }
                                        ]}
                                        rowKey="id"
                                        size="small"
                                        pagination={{ pageSize: 5 }}
                                    />
                                </div>
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

                        {/* Payslip Detail Modal - Premium Design */}
                        {viewPayslip && (
                            <Card
                                style={{
                                    marginTop: 16,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                                }}
                                bodyStyle={{ padding: 0 }}
                            >
                                {/* Header with Gradient */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '24px 24px 20px',
                                    color: '#fff',
                                    position: 'relative'
                                }}>
                                    <Button
                                        type="text"
                                        onClick={() => setViewPayslip(null)}
                                        style={{ position: 'absolute', top: 12, right: 12, color: '#fff' }}
                                    >
                                        ✕ Đóng
                                    </Button>
                                    <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>
                                        <WalletOutlined /> PHIẾU LƯƠNG
                                    </div>
                                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                                        Tháng {viewPayslip.month}/{viewPayslip.year}
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        {viewPayslip.is_paid ? (
                                            <Tag color="#52c41a" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
                                                ĐÃ THANH TOÁN {viewPayslip.paid_date && `• ${dayjs(viewPayslip.paid_date).format('DD/MM/YYYY')}`}
                                            </Tag>
                                        ) : (
                                            <Tag color="#faad14" icon={<ClockCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
                                                CHƯA THANH TOÁN
                                            </Tag>
                                        )}
                                    </div>
                                </div>

                                <div style={{ padding: 24 }}>
                                    {/* Summary Stats Row */}
                                    <Row gutter={16} style={{ marginBottom: 24 }}>
                                        <Col span={8}>
                                            <div style={{ textAlign: 'center', padding: '16px 8px', background: '#f0f5ff', borderRadius: 12 }}>
                                                <BankOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Lương cơ bản</div>
                                                <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>{formatMoney(viewPayslip.base_salary)}</div>
                                            </div>
                                        </Col>
                                        <Col span={8}>
                                            <div style={{ textAlign: 'center', padding: '16px 8px', background: '#fff7e6', borderRadius: 12 }}>
                                                <CalendarOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Ngày công</div>
                                                <div style={{ fontSize: 16, fontWeight: 600, color: '#fa8c16' }}>{viewPayslip.actual_work_days}/{viewPayslip.standard_work_days}</div>
                                            </div>
                                        </Col>
                                        <Col span={8}>
                                            <div style={{ textAlign: 'center', padding: '16px 8px', background: '#f6ffed', borderRadius: 12 }}>
                                                <RiseOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Tổng thu</div>
                                                <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>{formatMoney(viewPayslip.gross_income)}</div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Income Section */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                                        borderRadius: 12,
                                        padding: 16,
                                        marginBottom: 16
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1890ff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <RiseOutlined /> THU NHẬP
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><BankOutlined style={{ color: '#1890ff', marginRight: 8 }} />Lương theo ngày công</span>
                                                <span style={{ fontWeight: 500 }}>{formatMoney(viewPayslip.actual_salary)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><CoffeeOutlined style={{ color: '#fa8c16', marginRight: 8 }} />Phụ cấp ăn trưa</span>
                                                <span style={{ fontWeight: 500 }}>{formatMoney(viewPayslip.allowance_meal)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><CarOutlined style={{ color: '#722ed1', marginRight: 8 }} />Phụ cấp đi lại</span>
                                                <span style={{ fontWeight: 500 }}>{formatMoney(viewPayslip.allowance_transport)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><PhoneOutlined style={{ color: '#13c2c2', marginRight: 8 }} />Phụ cấp điện thoại</span>
                                                <span style={{ fontWeight: 500 }}>{formatMoney(viewPayslip.allowance_phone)}</span>
                                            </div>
                                            {viewPayslip.bonus > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span><GiftOutlined style={{ color: '#eb2f96', marginRight: 8 }} />Thưởng</span>
                                                    <span style={{ fontWeight: 500, color: '#eb2f96' }}>+{formatMoney(viewPayslip.bonus)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                                            <span>Tổng thu nhập</span>
                                            <span style={{ fontSize: 16, color: '#1890ff' }}>{formatMoney(viewPayslip.gross_income)}</span>
                                        </div>
                                    </div>

                                    {/* Deductions Section */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fff1f0 0%, #fff0f6 100%)',
                                        borderRadius: 12,
                                        padding: 16,
                                        marginBottom: 16
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#cf1322', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FallOutlined /> KHẤU TRỪ
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><SafetyCertificateOutlined style={{ color: '#cf1322', marginRight: 8 }} />BHXH (8%)</span>
                                                <span style={{ fontWeight: 500, color: '#cf1322' }}>-{formatMoney(viewPayslip.bhxh_employee)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><SafetyCertificateOutlined style={{ color: '#cf1322', marginRight: 8 }} />BHYT (1.5%)</span>
                                                <span style={{ fontWeight: 500, color: '#cf1322' }}>-{formatMoney(viewPayslip.bhyt_employee)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span><SafetyCertificateOutlined style={{ color: '#cf1322', marginRight: 8 }} />BHTN (1%)</span>
                                                <span style={{ fontWeight: 500, color: '#cf1322' }}>-{formatMoney(viewPayslip.bhtn_employee)}</span>
                                            </div>
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                                            <span>Tổng khấu trừ</span>
                                            <span style={{ fontSize: 16, color: '#cf1322' }}>
                                                -{formatMoney(Number(viewPayslip.bhxh_employee || 0) + Number(viewPayslip.bhyt_employee || 0) + Number(viewPayslip.bhtn_employee || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Net Salary - Hero Section */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                        borderRadius: 16,
                                        padding: '24px 20px',
                                        textAlign: 'center',
                                        color: '#fff',
                                        boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
                                    }}>
                                        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>
                                            <WalletOutlined /> THỰC NHẬN
                                        </div>
                                        <div style={{ fontSize: 32, fontWeight: 700 }}>
                                            {formatMoney(viewPayslip.net_salary)} <span style={{ fontSize: 16, fontWeight: 400 }}>VNĐ</span>
                                        </div>
                                    </div>

                                    {/* Print Button */}
                                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                                        <Button icon={<PrinterOutlined />} size="large" style={{ borderRadius: 8 }}>
                                            In phiếu lương
                                        </Button>
                                    </div>
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
