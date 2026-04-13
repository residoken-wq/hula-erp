import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Card, Statistic, Row, Col, Divider, Popconfirm, Empty, Tabs, Descriptions, List } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, DeleteOutlined, ExperimentOutlined, BarChartOutlined, BugOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const QCPage: React.FC = () => {
    const [inspections, setInspections] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentQC, setCurrentQC] = useState<any>(null);
    const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);

    const [form] = Form.useForm();
    const [defectForm] = Form.useForm();
    const [completeForm] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [res, sumRes, supRes] = await Promise.all([
                axios.get(`${API_URL}/qc`),
                axios.get(`${API_URL}/qc/summary`),
                axios.get(`${API_URL}/suppliers`)
            ]);
            setInspections(Array.isArray(res.data) ? res.data : []);
            setSummary(sumRes.data);
            setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (values: any) => {
        try {
            await axios.post(`${API_URL}/qc`, {
                ...values,
                inspection_date: values.inspection_date?.format('YYYY-MM-DD')
            });
            message.success('Đã tạo phiếu kiểm tra chất lượng');
            setIsCreateOpen(false);
            form.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi tạo phiếu QC'); }
    };

    const handleStartInspection = async (id: number) => {
        try {
            await axios.post(`${API_URL}/qc/${id}/start`);
            message.success('Bắt đầu kiểm tra');
            fetchData();
            if (currentQC?.id === id) viewDetail(id);
        } catch (e) { message.error('Lỗi'); }
    };

    const handleAddDefect = async (values: any) => {
        if (!currentQC) return;
        try {
            await axios.post(`${API_URL}/qc/${currentQC.id}/defects`, values);
            message.success('Đã thêm lỗi');
            setIsDefectModalOpen(false);
            defectForm.resetFields();
            viewDetail(currentQC.id);
        } catch (e) { message.error('Lỗi thêm defect'); }
    };

    const handleRemoveDefect = async (defectId: number) => {
        try {
            await axios.delete(`${API_URL}/qc/defects/${defectId}`);
            message.success('Đã xóa');
            viewDetail(currentQC.id);
        } catch (e) { message.error('Lỗi xóa'); }
    };

    const handleComplete = async (values: any) => {
        if (!currentQC) return;
        try {
            await axios.post(`${API_URL}/qc/${currentQC.id}/complete`, values);
            message.success('Hoàn thành kiểm tra');
            setIsCompleteOpen(false);
            completeForm.resetFields();
            fetchData();
            viewDetail(currentQC.id);
        } catch (e) { message.error('Lỗi hoàn thành'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/qc/${id}`);
            message.success('Đã xóa phiếu QC');
            fetchData();
        } catch (e) { message.error('Lỗi xóa'); }
    };

    const viewDetail = async (id: number) => {
        try {
            const res = await axios.get(`${API_URL}/qc/${id}`);
            setCurrentQC(res.data);
            setIsDetailOpen(true);
        } catch (e) { message.error('Lỗi tải chi tiết'); }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'PASSED': return 'green';
            case 'FAILED': return 'red';
            case 'CONDITIONAL': return 'orange';
            case 'IN_PROGRESS': return 'blue';
            default: return 'default';
        }
    };

    const statusLabel = (s: string) => {
        switch (s) {
            case 'PASSED': return '✅ Đạt';
            case 'FAILED': return '❌ Không đạt';
            case 'CONDITIONAL': return '⚠️ Đạt ĐK';
            case 'IN_PROGRESS': return '🔍 Đang kiểm';
            case 'PENDING': return 'Chờ kiểm';
            default: return s;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>🔬 Kiểm Tra Chất Lượng (QC)</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>Tạo Phiếu QC</Button>
            </div>

            {/* SUMMARY CARDS */}
            {summary && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={4}><Card size="small"><Statistic title="Tổng phiếu" value={summary.total_inspections} /></Card></Col>
                    <Col span={4}><Card size="small"><Statistic title="Chờ kiểm" value={summary.pending} valueStyle={{ color: '#999' }} /></Card></Col>
                    <Col span={4}><Card size="small"><Statistic title="Đang kiểm" value={summary.in_progress} valueStyle={{ color: '#1890ff' }} /></Card></Col>
                    <Col span={4}><Card size="small"><Statistic title="Đạt" value={summary.passed} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                    <Col span={4}><Card size="small"><Statistic title="Đạt ĐK" value={summary.conditional} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
                    <Col span={4}><Card size="small"><Statistic title="Không đạt" value={summary.failed} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
                </Row>
            )}

            <Tabs defaultActiveKey="list" items={[
                {
                    key: 'list', label: '📋 Danh sách Phiếu QC', children: (
                        <Table
                            dataSource={inspections}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            columns={[
                                { title: 'Mã QC', dataIndex: 'code', width: 140, render: (t: any) => <b>{t}</b> },
                                { title: 'Loại', dataIndex: 'type', width: 120, align: 'center' as const, render: (t: string) => <Tag color={t === 'OUTSOURCING' ? 'purple' : t === 'INCOMING' ? 'blue' : 'cyan'}>{t === 'OUTSOURCING' ? 'Gia công' : t === 'INCOMING' ? 'NPL' : 'Thành phẩm'}</Tag> },
                                { title: 'NCC/GC', render: (_: any, r: any) => r.supplier?.name || '-' },
                                { title: 'SL Kiểm', dataIndex: 'total_quantity', width: 80, align: 'right' as const, render: (v: number) => Number(v).toLocaleString() },
                                { title: 'Đạt', dataIndex: 'passed_quantity', width: 70, align: 'right' as const, render: (v: number) => <span style={{ color: '#52c41a' }}>{Number(v).toLocaleString()}</span> },
                                { title: 'Lỗi', dataIndex: 'defect_quantity', width: 70, align: 'right' as const, render: (v: number) => <span style={{ color: v > 0 ? '#ff4d4f' : '#999' }}>{Number(v).toLocaleString()}</span> },
                                { title: '% Lỗi', dataIndex: 'defect_rate', width: 80, align: 'center' as const, render: (v: number) => <Tag color={Number(v) > 5 ? 'red' : Number(v) > 2 ? 'orange' : 'green'}>{Number(v).toFixed(1)}%</Tag> },
                                { title: 'Điểm NCC', dataIndex: 'supplier_score', width: 80, align: 'center' as const, render: (v: any) => v ? <b>{Number(v).toFixed(1)}</b> : '-' },
                                { title: 'Trạng thái', dataIndex: 'status', width: 120, align: 'center' as const, render: (t: string) => <Tag color={statusColor(t)}>{statusLabel(t)}</Tag> },
                                { title: 'Ngày', dataIndex: 'inspection_date', width: 90, render: (t: any) => t ? dayjs(t).format('DD/MM/YY') : '-' },
                                {
                                    title: '', key: 'act', width: 120, align: 'right' as const,
                                    render: (r: any) => (
                                        <Space size={4}>
                                            <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r.id)} />
                                            {r.status === 'PENDING' && (
                                                <Popconfirm title="Xóa phiếu?" onConfirm={() => handleDelete(r.id)}>
                                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    )
                                }
                            ]}
                        />
                    )
                },
                {
                    key: 'analytics', label: '📊 Thống kê NCC', children: (
                        <div>
                            {summary?.by_supplier?.length > 0 ? (
                                <Table
                                    dataSource={summary.by_supplier}
                                    rowKey="supplier_id"
                                    size="small"
                                    pagination={false}
                                    columns={[
                                        { title: 'Nhà cung cấp', dataIndex: 'supplier_name' },
                                        { title: 'Tổng phiếu', dataIndex: 'total', width: 80, align: 'center' as const },
                                        { title: 'Đạt', dataIndex: 'passed', width: 80, align: 'center' as const, render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span> },
                                        { title: 'Không đạt', dataIndex: 'failed', width: 80, align: 'center' as const, render: (v: number) => <span style={{ color: v > 0 ? '#ff4d4f' : '#999' }}>{v}</span> },
                                        { title: 'Tổng SL lỗi', dataIndex: 'total_defects', width: 100, align: 'right' as const, render: (v: number) => Number(v).toLocaleString() },
                                        {
                                            title: '% Lỗi TB', width: 100, align: 'center' as const,
                                            render: (r: any) => {
                                                const rate = r.total_inspected > 0 ? (r.total_defects / r.total_inspected * 100) : 0;
                                                return <Tag color={rate > 5 ? 'red' : rate > 2 ? 'orange' : 'green'}>{rate.toFixed(1)}%</Tag>;
                                            }
                                        },
                                        {
                                            title: 'Tỷ lệ đạt', width: 100, align: 'center' as const,
                                            render: (r: any) => {
                                                const rate = r.total > 0 ? (r.passed / r.total * 100) : 0;
                                                return <b style={{ color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#fa8c16' : '#ff4d4f' }}>{rate.toFixed(0)}%</b>;
                                            }
                                        }
                                    ]}
                                />
                            ) : (
                                <Empty description="Chưa có dữ liệu thống kê" />
                            )}
                        </div>
                    )
                }
            ]} />

            {/* CREATE MODAL */}
            <Modal title="Tạo Phiếu Kiểm Tra Chất Lượng" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} onOk={() => form.submit()} okText="Tạo Phiếu">
                <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ type: 'OUTSOURCING' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Loại kiểm tra" rules={[{ required: true }]}>
                                <Select options={[
                                    { value: 'OUTSOURCING', label: '🏭 Hàng gia công' },
                                    { value: 'INCOMING', label: '📦 NPL nhập kho' },
                                    { value: 'FINAL', label: '✅ Thành phẩm' }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="supplier_id" label="NCC / Nhà gia công">
                                <Select showSearch optionFilterProp="label" placeholder="Chọn NCC..." allowClear
                                    options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="total_quantity" label="Tổng SL kiểm" rules={[{ required: true }]}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="inspector" label="Người kiểm tra">
                                <Input placeholder="Họ tên người kiểm..." />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="inspection_date" label="Ngày kiểm">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* DETAIL MODAL */}
            <Modal
                title={<span><ExperimentOutlined style={{ color: '#722ed1', marginRight: 8 }} />Chi tiết QC — {currentQC?.code}</span>}
                open={isDetailOpen}
                onCancel={() => setIsDetailOpen(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>,
                    currentQC?.status === 'PENDING' && (
                        <Button key="start" type="primary" onClick={() => handleStartInspection(currentQC.id)}>🔍 Bắt đầu Kiểm Tra</Button>
                    ),
                    currentQC?.status === 'IN_PROGRESS' && (
                        <>
                            <Button key="defect" icon={<BugOutlined />} onClick={() => setIsDefectModalOpen(true)}>+ Thêm Lỗi</Button>
                            <Button key="complete" type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => { completeForm.setFieldsValue({ inspected_quantity: currentQC.total_quantity, passed_quantity: currentQC.total_quantity - currentQC.defect_quantity }); setIsCompleteOpen(true); }}>✅ Hoàn thành</Button>
                        </>
                    )
                ]}
            >
                {currentQC && (
                    <>
                        <Descriptions bordered size="small" column={3}>
                            <Descriptions.Item label="Loại"><Tag color="purple">{currentQC.type === 'OUTSOURCING' ? 'Gia công' : currentQC.type === 'INCOMING' ? 'NPL' : 'Thành phẩm'}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Trạng thái"><Tag color={statusColor(currentQC.status)}>{statusLabel(currentQC.status)}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Ngày kiểm">{currentQC.inspection_date ? dayjs(currentQC.inspection_date).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
                            <Descriptions.Item label="NCC">{currentQC.supplier?.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Người kiểm">{currentQC.inspector || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Điểm NCC">{currentQC.supplier_score ? <b>{Number(currentQC.supplier_score).toFixed(1)}/10</b> : '-'}</Descriptions.Item>
                        </Descriptions>

                        <Row gutter={16} style={{ margin: '16px 0' }}>
                            <Col span={6}><Card size="small"><Statistic title="Tổng SL" value={currentQC.total_quantity} /></Card></Col>
                            <Col span={6}><Card size="small"><Statistic title="Đã kiểm" value={currentQC.inspected_quantity} /></Card></Col>
                            <Col span={6}><Card size="small"><Statistic title="Đạt" value={currentQC.passed_quantity} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                            <Col span={6}><Card size="small"><Statistic title="Lỗi" value={currentQC.defect_quantity} valueStyle={{ color: '#ff4d4f' }} suffix={<small>({Number(currentQC.defect_rate).toFixed(1)}%)</small>} /></Card></Col>
                        </Row>

                        <Divider orientation="left" style={{ fontSize: 13 }}>Danh sách Lỗi phát hiện</Divider>
                        {currentQC.defect_items?.length > 0 ? (
                            <Table
                                dataSource={currentQC.defect_items}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                columns={[
                                    { title: 'Loại lỗi', dataIndex: 'defect_type' },
                                    { title: 'Mức độ', dataIndex: 'severity', width: 100, align: 'center' as const, render: (t: string) => <Tag color={t === 'CRITICAL' ? 'red' : t === 'MAJOR' ? 'orange' : 'default'}>{t === 'CRITICAL' ? 'Nghiêm trọng' : t === 'MAJOR' ? 'Nặng' : 'Nhẹ'}</Tag> },
                                    { title: 'SL', dataIndex: 'quantity', width: 80, align: 'right' as const },
                                    { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
                                    { title: 'Xử lý', dataIndex: 'action_taken', ellipsis: true },
                                    {
                                        title: '', width: 40, render: (r: any) => currentQC.status === 'IN_PROGRESS' ? (
                                            <Popconfirm title="Xóa lỗi?" onConfirm={() => handleRemoveDefect(r.id)}>
                                                <Button size="small" danger icon={<DeleteOutlined />} type="text" />
                                            </Popconfirm>
                                        ) : null
                                    }
                                ]}
                            />
                        ) : (
                            <Empty description="Không phát hiện lỗi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}

                        {currentQC.corrective_action && (
                            <>
                                <Divider orientation="left" style={{ fontSize: 13 }}>Biện pháp khắc phục</Divider>
                                <p style={{ padding: '8px 12px', background: '#fffbe6', borderRadius: 6 }}>{currentQC.corrective_action}</p>
                            </>
                        )}
                    </>
                )}
            </Modal>

            {/* ADD DEFECT MODAL */}
            <Modal title="Thêm Lỗi Phát Hiện" open={isDefectModalOpen} onCancel={() => setIsDefectModalOpen(false)} onOk={() => defectForm.submit()} okText="Thêm">
                <Form form={defectForm} layout="vertical" onFinish={handleAddDefect}>
                    <Form.Item name="defect_type" label="Loại lỗi" rules={[{ required: true }]}>
                        <Select placeholder="Chọn hoặc nhập loại lỗi..." showSearch allowClear
                            options={[
                                { value: 'Đường may lệch', label: 'Đường may lệch' },
                                { value: 'Vải khác màu', label: 'Vải khác màu' },
                                { value: 'Thiếu phụ kiện', label: 'Thiếu phụ kiện' },
                                { value: 'Size sai', label: 'Size sai' },
                                { value: 'Bung chỉ', label: 'Bung chỉ' },
                                { value: 'Vải bẩn/dơ', label: 'Vải bẩn/dơ' },
                                { value: 'Ép nhiệt không đều', label: 'Ép nhiệt không đều' },
                                { value: 'Khác', label: 'Khác' }
                            ]}
                        />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="severity" label="Mức độ" initialValue="MINOR">
                                <Select options={[
                                    { value: 'MINOR', label: '🟡 Nhẹ' },
                                    { value: 'MAJOR', label: '🟠 Nặng' },
                                    { value: 'CRITICAL', label: '🔴 Nghiêm trọng' }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="quantity" label="Số lượng lỗi" rules={[{ required: true }]}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả chi tiết">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="action_taken" label="Hành động xử lý">
                        <Select placeholder="Chọn..." allowClear options={[
                            { value: 'Sửa lại', label: 'Sửa lại' },
                            { value: 'Bỏ / Hủy', label: 'Bỏ / Hủy' },
                            { value: 'Chấp nhận', label: 'Chấp nhận (Minor)' },
                            { value: 'Trả lại NCC', label: 'Trả lại NCC' }
                        ]} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* COMPLETE INSPECTION MODAL */}
            <Modal title="Hoàn thành Kiểm Tra" open={isCompleteOpen} onCancel={() => setIsCompleteOpen(false)} onOk={() => completeForm.submit()} okText="Xác nhận">
                <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="inspected_quantity" label="SL đã kiểm" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="passed_quantity" label="SL đạt" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="supplier_score" label="Điểm đánh giá NCC (1-10)">
                        <InputNumber min={1} max={10} step={0.5} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="corrective_action" label="Biện pháp khắc phục">
                        <Input.TextArea rows={3} placeholder="Mô tả biện pháp khắc phục nếu có lỗi..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default QCPage;
