import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, Tag, message, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;

interface Props {
    employees: any[];
    payslips: any[];
    onRefresh: () => void;
}

const PayslipTab: React.FC<Props> = ({ employees, payslips, onRefresh }) => {
    const [modal, setModal] = useState(false);
    const [form] = Form.useForm();
    const [viewPayslip, setViewPayslip] = useState<any>(null);

    const formatMoney = (v: number) => (v || 0).toLocaleString();

    // Calculate standard work days in a month based on work days per week (5 or 6)
    const calcStandardWorkDays = (year: number, month: number, daysPerWeek: number = 6): number => {
        const daysInMonth = new Date(year, month, 0).getDate();
        let workDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dow = new Date(year, month - 1, day).getDay(); // 0=Sun, 6=Sat
            if (daysPerWeek === 5) {
                // Mon-Fri (1-5)
                if (dow >= 1 && dow <= 5) workDays++;
            } else {
                // Mon-Sat (1-6)
                if (dow >= 1 && dow <= 6) workDays++;
            }
        }
        return workDays;
    };

    // Auto calculate when month/year/employee changes
    const autoCalcDays = () => {
        const empId = form.getFieldValue('employee_id');
        const month = form.getFieldValue('month');
        const year = form.getFieldValue('year');
        if (empId && month && year) {
            const emp = employees.find(e => e.id === empId);
            const daysPerWeek = emp?.work_shift?.work_days_per_week || 6;
            const stdDays = calcStandardWorkDays(year, month, daysPerWeek);
            form.setFieldsValue({ standard_work_days: stdDays, actual_work_days: stdDays });
        }
    };

    const handleSave = async (values: any) => {
        try {
            await api.post('/hr/payslips', values);
            message.success('Đã tạo phiếu lương');
            setModal(false);
            form.resetFields();
            onRefresh();
        } catch (e) { message.error('Lỗi tạo phiếu'); }
    };

    const columns = [
        { title: 'Nhân viên', dataIndex: ['employee', 'full_name'] },
        { title: 'Tháng', render: (_: any, r: any) => `${r.month}/${r.year}` },
        { title: 'Lương CB', dataIndex: 'base_salary', render: (v: number) => v?.toLocaleString() },
        { title: 'Ngày công', dataIndex: 'actual_work_days' },
        { title: 'Tổng thu', dataIndex: 'gross_income', render: (v: number) => v?.toLocaleString() },
        { title: 'Thực nhận', dataIndex: 'net_salary', render: (v: number) => <b style={{ color: 'green' }}>{v?.toLocaleString()}</b> },
        { title: '', render: (_: any, r: any) => <Button size="small" onClick={() => setViewPayslip(r)}>Xem phiếu</Button> }
    ];

    return (
        <>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModal(true); }} style={{ marginBottom: 16 }}>
                Tạo phiếu lương
            </Button>
            <Table dataSource={payslips} columns={columns} rowKey="id" size="small" />

            {/* Create Modal */}
            <Modal title="Tạo phiếu lương" open={modal} onCancel={() => setModal(false)} onOk={() => form.submit()} width={650}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                        <Select onChange={(id) => {
                            const emp = employees.find(e => e.id === id);
                            if (emp) {
                                form.setFieldsValue({ base_salary: emp.base_salary });
                                // Auto calc standard days if month/year set
                                const month = form.getFieldValue('month');
                                const year = form.getFieldValue('year');
                                if (month && year) {
                                    const stdDays = calcStandardWorkDays(year, month, emp.work_shift?.work_days_per_week || 6);
                                    form.setFieldsValue({ standard_work_days: stdDays, actual_work_days: stdDays });
                                }
                            }
                        }}>
                            {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="month" label="Tháng" rules={[{ required: true }]}>
                                <Select onChange={() => autoCalcDays()}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => <Option key={m} value={m}>Tháng {m}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}><Form.Item name="year" label="Năm" rules={[{ required: true }]}><InputNumber min={2020} style={{ width: '100%' }} onChange={() => autoCalcDays()} /></Form.Item></Col>
                        <Col span={6}><Form.Item name="standard_work_days" label="Ngày chuẩn"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={6}><Form.Item name="actual_work_days" label="Ngày công" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} step={0.5} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="base_salary" label="Lương cơ bản"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="bonus" label="Thưởng"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="allowance_meal" label="PC Ăn trưa"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="allowance_transport" label="PC Đi lại"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="allowance_phone" label="PC Điện thoại"><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>

            {/* View Payslip Modal */}
            <Modal title="Phiếu Lương" open={!!viewPayslip} onCancel={() => setViewPayslip(null)} footer={null} width={420}>
                {viewPayslip && (
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
                        {/* Header với Logo */}
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff', marginBottom: 4 }}>HULA</div>
                            <h3 style={{ margin: 0, fontSize: 16 }}>BẢNG THANH TOÁN LƯƠNG</h3>
                            <p style={{ margin: '4px 0 0', color: '#666' }}>Tháng {viewPayslip.month} / {viewPayslip.year}</p>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <p><b>Nhân viên:</b> {viewPayslip.employee?.full_name}</p>
                        <p><b>Chức vụ:</b> {viewPayslip.employee?.position || '-'}</p>
                        <p><b>Phòng ban:</b> {viewPayslip.employee?.department || '-'}</p>
                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ background: '#f5f5f5', padding: 8, marginBottom: 8, fontWeight: 'bold' }}>THU NHẬP</div>
                        <Row><Col span={14}>Lương cơ bản</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.base_salary)}</Col></Row>
                        <Row><Col span={14}>Ngày công: {viewPayslip.actual_work_days}/{viewPayslip.standard_work_days || 26}</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.actual_salary)}</Col></Row>
                        <Row><Col span={14}>PC Ăn trưa</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.allowance_meal)}</Col></Row>
                        <Row><Col span={14}>PC Đi lại</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.allowance_transport)}</Col></Row>
                        <Row><Col span={14}>PC Điện thoại</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.allowance_phone)}</Col></Row>
                        <Row><Col span={14}>Thưởng</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.bonus)}</Col></Row>
                        <Row style={{ fontWeight: 'bold', marginTop: 8, background: '#fafafa', padding: '4px 0' }}><Col span={14}>TỔNG THU NHẬP</Col><Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.gross_income)}</Col></Row>

                        <div style={{ background: '#fff1f0', padding: 8, margin: '16px 0 8px', fontWeight: 'bold' }}>KHẤU TRỪ</div>
                        <Row><Col span={14}>BHXH (8%)</Col><Col span={10} style={{ textAlign: 'right', color: '#cf1322' }}>-{formatMoney(viewPayslip.bhxh_employee)}</Col></Row>
                        <Row><Col span={14}>BHYT (1.5%)</Col><Col span={10} style={{ textAlign: 'right', color: '#cf1322' }}>-{formatMoney(viewPayslip.bhyt_employee)}</Col></Row>
                        <Row><Col span={14}>BHTN (1%)</Col><Col span={10} style={{ textAlign: 'right', color: '#cf1322' }}>-{formatMoney(viewPayslip.bhtn_employee)}</Col></Row>
                        <Row><Col span={14}>Công đoàn</Col><Col span={10} style={{ textAlign: 'right', color: '#cf1322' }}>-{formatMoney(viewPayslip.union_fee)}</Col></Row>
                        <Row><Col span={14}>Thuế TNCN</Col><Col span={10} style={{ textAlign: 'right', color: '#cf1322' }}>-{formatMoney(viewPayslip.tax_income)}</Col></Row>

                        <Divider style={{ margin: '16px 0 8px' }} />
                        <Row style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a', background: '#f6ffed', padding: '8px', borderRadius: 4 }}>
                            <Col span={14}>THỰC NHẬN</Col>
                            <Col span={10} style={{ textAlign: 'right' }}>{formatMoney(viewPayslip.net_salary)} đ</Col>
                        </Row>

                        <div style={{ background: '#e6f7ff', padding: 8, marginTop: 16, fontSize: 11, borderRadius: 4 }}>
                            <b>Công ty đóng:</b> BHXH {formatMoney(viewPayslip.bhxh_company)} | BHYT {formatMoney(viewPayslip.bhyt_company)} | BHTN {formatMoney(viewPayslip.bhtn_company)}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default PayslipTab;
