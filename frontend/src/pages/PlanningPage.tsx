import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, DatePicker, Row, Col, Tabs, Statistic, Tag, Progress, Select, InputNumber } from 'antd';
import { CalendarOutlined, ExperimentOutlined, AlertOutlined, ProjectOutlined, ReloadOutlined, DollarOutlined, ShoppingCartOutlined, BarChartOutlined, AppstoreAddOutlined, ScissorOutlined, SaveOutlined, TruckOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PlanningPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('PENDING');
    const [loading, setLoading] = useState(false);

    // Data State
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]); // <--- MỚI: Danh sách NCC

    // Analysis Data (Editable)
    const [mrpData, setMrpData] = useState<any>(null);
    const [outsourcingList, setOutsourcingList] = useState<any[]>([]);
    const [logisticsList, setLogisticsList] = useState<any[]>([]); // <--- MỚI
    const [costBasis, setCostBasis] = useState<'REFERENCE' | 'PURCHASE'>('REFERENCE'); // <--- MỚI

    // UI State
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSuggest, resPlans, resSupp] = await Promise.all([
                axios.get(`${API_URL}/planning/suggestion`),
                axios.get(`${API_URL}/planning`),
                axios.get(`${API_URL}/suppliers`)
            ]);
            setPendingOrders(Array.isArray(resSuggest.data) ? resSuggest.data : []);
            setPlans(Array.isArray(resPlans.data) ? resPlans.data : []);
            setSuppliers(Array.isArray(resSupp.data) ? resSupp.data : []);
        } catch (e) { message.error('Lỗi tải dữ liệu'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreatePlan = async (values: any) => {
        try {
            const payload = {
                code: values.code,
                name: values.name,
                start_date: values.dateRange[0].toISOString(),
                end_date: values.dateRange[1].toISOString(),
                orderCodes: pendingOrders.filter((o: any) => selectedRowKeys.includes(o.id)).map((o: any) => o.order_code)
            };
            await axios.post(`${API_URL}/planning/create`, payload);
            message.success('Đã tạo kế hoạch SX');
            setIsCreateModalOpen(false); setSelectedRowKeys([]); fetchData(); setActiveTab('PLANS');
        } catch (e) { message.error('Lỗi tạo kế hoạch'); }
    };

    const handleRunMrp = async (planId: number) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/planning/mrp/${planId}`);
            setMrpData(res.data);
            setOutsourcingList(res.data.outsourcing_result || []);
            setLogisticsList(res.data.logistics_result || []); // <--- MỚI
            setIsDashboardOpen(true);
            fetchData();
        } catch (e) { message.error('Lỗi chạy MRP'); }
        setLoading(false);
    };

    const handleGeneratePOs = async (type: 'MATERIAL' | 'OUTSOURCING') => {
        if (!mrpData) return;

        // Gửi dữ liệu ĐÃ ĐƯỢC CHỈNH SỬA (trong state) về Backend
        const itemsToOrder = type === 'MATERIAL' ? mrpData.mrp_result : outsourcingList;

        try {
            const res = await axios.post(`${API_URL}/planning/${mrpData.plan_info.id}/generate-pos`, {
                items: itemsToOrder
            });
            message.success(res.data.message);
        } catch (e) { message.error('Lỗi tạo PO'); }
    };

    // --- MỚI: HÀM XỬ LÝ CHỈNH SỬA DỮ LIỆU TRÊN BẢNG ---
    const handleDataChange = (type: 'MATERIAL' | 'OUTSOURCING', index: number, field: string, value: any) => {
        if (type === 'MATERIAL') {
            const newData = [...mrpData.mrp_result];
            newData[index] = { ...newData[index], [field]: value };

            // Nếu đổi NCC, tự động lấy lại Đơn giá tham khảo từ possible_suppliers
            if (field === 'supplier_name') {
                const supplierInfo = newData[index].possible_suppliers?.find(
                    (s: any) => s.supplier_name?.trim().toLowerCase() === String(value).trim().toLowerCase()
                );
                if (supplierInfo) {
                    newData[index].reference_price = supplierInfo.price;
                } else {
                    newData[index].reference_price = 0;
                }
            }
            setMrpData({ ...mrpData, mrp_result: newData });
        } else {
            const newData = [...outsourcingList];
            newData[index] = { ...newData[index], [field]: value };

            // Tự động tính lại Thành tiền nếu đổi SL hoặc Đơn giá
            if (field === 'quantity' || field === 'unit_price') {
                newData[index].total_cost = Number(newData[index].quantity) * Number(newData[index].unit_price);
            }

            setOutsourcingList(newData);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!mrpData) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/planning/save/${mrpData.plan_info.id}`, {
                mrp_result: mrpData.mrp_result,
                outsourcing_result: outsourcingList,
                logistics_result: logisticsList
            });
            message.success('Đã lưu kết quả phân tích');
        } catch (e) {
            message.error('Lỗi khi lưu dữ liệu');
        }
        setLoading(false);
    };
    // --------------------------------------------------
    const handleDeletePlan = (id: number) => {
        Modal.confirm({
            title: 'Xóa kế hoạch',
            content: 'Bạn có chắc muốn xóa kế hoạch này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await axios.delete(`${API_URL}/planning/${id}`);
                    message.success('Đã xóa kế hoạch');
                    fetchData();
                } catch (e: any) {
                    message.error(e.response?.data?.message || 'Lỗi xóa kế hoạch');
                }
            }
        });
    };

    const pendingColumns = [
        { title: 'Mã Đơn', dataIndex: 'order_code', render: (t: any) => <b>{t}</b> },
        { title: 'Khách Hàng', dataIndex: 'customer_name' },
        { title: 'Trạng Thái', dataIndex: 'status', render: (t: any) => <Tag>{t}</Tag> },
        { title: 'Ngày Giao', dataIndex: 'delivery_date', render: (t: any) => t ? <Tag color="red">{dayjs(t).format('DD/MM')}</Tag> : '-' },
        { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v: any) => Number(v).toLocaleString() }
    ];

    const planColumns = [
        { title: 'Mã KH', dataIndex: 'code', render: (t: any) => <b>{t}</b> },
        { title: 'Tên Đợt', dataIndex: 'name' },
        { title: 'Thời Gian', render: (r: any) => <small>{dayjs(r.start_date).format('DD/MM')} - {dayjs(r.end_date).format('DD/MM')}</small> },
        { title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const, render: (t: any) => t === 'CALCULATED' ? <Tag color="green">Đã tính MRP</Tag> : <Tag>Mới</Tag> },
        {
            title: 'Hành động', key: 'act', align: 'right' as const, render: (_: any, r: any) => (
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                    <Button type="primary" size="small" icon={<ExperimentOutlined />} onClick={() => handleRunMrp(r.id)}>Phân Tích</Button>
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeletePlan(r.id)} />
                </div>
            )
        }
    ];

    const renderDashboard = () => {
        if (!mrpData) return null;
        const totalRevenue = mrpData.plan_info.sales_orders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);

        // Tính lại tổng chi phí realtime dựa trên dữ liệu đang edit
        const estMaterialCost = mrpData.mrp_result.reduce((s: number, i: any) => {
            // Logic Toggle Cost Basis
            const price = costBasis === 'REFERENCE' ? Number(i.reference_price || 0) : Number(i.purchase_price || 0);
            return s + (Number(i.net_requirement || 0) * price);
        }, 0);

        const estOutsourceCost = outsourcingList.reduce((s: number, i: any) => s + (Number(i.total_cost)), 0);
        const estLogisticsCost = logisticsList.reduce((s: number, i: any) => s + (Number(i.total_cost)), 0);

        return (
            <div>
                <div style={{ marginBottom: 20, background: '#f5f7fa', padding: 15, borderRadius: 8 }}>
                    <div style={{ textAlign: 'right', marginBottom: 10 }}>
                        <span>Cơ sở tính giá: </span>
                        <Select value={costBasis} onChange={setCostBasis} style={{ width: 180 }}>
                            <Option value="REFERENCE">Giá Tham Khảo (NCC)</Option>
                            <Option value="PURCHASE">Giá Đặt Hàng (PO)</Option>
                        </Select>
                    </div>
                    <Row gutter={24} style={{ textAlign: 'center' }}>
                        <Col span={6}><Statistic title="Doanh Thu" value={totalRevenue} prefix={<DollarOutlined />} suffix="đ" valueStyle={{ fontSize: 16 }} /></Col>
                        <Col span={6}>
                            <Statistic title="CP Nguyên Liệu" value={estMaterialCost} prefix={<ShoppingCartOutlined />} suffix="đ" valueStyle={{ color: '#cf1322', fontSize: 16 }} />
                            <small style={{ color: '#888' }}>({costBasis === 'REFERENCE' ? 'Theo giá NCC' : 'Theo PO'})</small>
                        </Col>
                        <Col span={6}><Statistic title="CP Gia Công" value={estOutsourceCost} prefix={<ScissorOutlined />} suffix="đ" valueStyle={{ color: '#d46b08', fontSize: 16 }} /></Col>
                        <Col span={6}><Statistic title="CP Logistics" value={estLogisticsCost} prefix={<TruckOutlined />} suffix="đ" valueStyle={{ color: '#096dd9', fontSize: 16 }} /></Col>
                    </Row>
                    <div style={{ marginTop: 10, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: (totalRevenue - estMaterialCost - estOutsourceCost - estLogisticsCost) > 0 ? 'green' : 'red' }}>
                        Lợi Nhuận Gộp (Dự kiến): {(totalRevenue - estMaterialCost - estOutsourceCost - estLogisticsCost).toLocaleString()} đ
                    </div>
                </div>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1', label: '1. Nhu Cầu Nguyên Liệu (MRP)',
                        children: (
                            <div>
                                <Table dataSource={mrpData.mrp_result} rowKey="material_id" pagination={false} size="middle" scroll={{ x: 1600, y: 450 }}
                                    columns={[
                                        {
                                            title: 'Nguyên Liệu',
                                            dataIndex: 'material_name',
                                            width: 250,
                                            fixed: 'left',
                                            render: (t: any, r: any) => (
                                                <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                                    <div style={{ color: '#096dd9', fontWeight: 'bold' }}>{r.material_code}</div>
                                                    <div>{t}</div>
                                                </div>
                                            )
                                        },
                                        { title: 'Tổng Cần (Gốc)', dataIndex: 'gross_raw', align: 'center' as const, width: 100, render: (v: any) => Number(v || 0).toLocaleString() },
                                        { title: '% Hao hụt', dataIndex: 'wastage_percent', align: 'center' as const, width: 90, render: (v: any) => <Tag color="orange">{v}%</Tag> },
                                        { title: 'Tổng (+Hao hụt)', dataIndex: 'gross_requirement', align: 'center' as const, width: 110, render: (v: any) => <b>{Number(v).toLocaleString()}</b> },
                                        { title: 'Tồn Kho', dataIndex: 'available_stock', align: 'center' as const, width: 100 },
                                        {
                                            title: 'Cần Mua (SL)',
                                            dataIndex: 'net_requirement',
                                            width: 130,
                                            render: (v: any, r: any, i: number) => (
                                                <InputNumber
                                                    value={v}
                                                    min={0}
                                                    onChange={(val) => handleDataChange('MATERIAL', i, 'net_requirement', val)}
                                                    status={v > 0 ? 'warning' : ''}
                                                    style={{ width: '100%' }}
                                                />
                                            )
                                        },
                                        { title: 'ĐVT', align: 'center' as const, dataIndex: 'unit', width: 70 },
                                        {
                                            title: 'Nhà Cung Cấp',
                                            dataIndex: 'supplier_name',
                                            width: 220,
                                            render: (v: any, r: any, i: number) => (
                                                <Select
                                                    value={v}
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    placeholder="Chọn NCC"
                                                    filterOption={(input, option) =>
                                                        (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    onChange={(val) => handleDataChange('MATERIAL', i, 'supplier_name', val)}
                                                    options={suppliers.filter(s => s.type !== 'MANUFACTURER').map(s => ({ label: s.name, value: s.name }))}
                                                />
                                            )
                                        },
                                        {
                                            title: 'Đơn giá tham khảo',
                                            dataIndex: 'reference_price',
                                            width: 140,
                                            render: (v: any, r: any, i: number) => (
                                                <InputNumber
                                                    value={v}
                                                    min={0}
                                                    formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    onChange={(val) => handleDataChange('MATERIAL', i, 'reference_price', val)}
                                                    style={{ width: '100%' }}
                                                />
                                            )
                                        },
                                        {
                                            title: 'Giá mua (PO)',
                                            dataIndex: 'purchase_price',
                                            align: 'right' as const,
                                            width: 120,
                                            render: (v: any) => <b style={{ color: costBasis === 'PURCHASE' ? '#cf1322' : '#888' }}>{Number(v || 0).toLocaleString()}</b>
                                        },
                                        {
                                            title: 'Ghi chú PO',
                                            width: 150,
                                            render: (t: any, r: any, i: number) => <Input value={r.note} onChange={(e) => handleDataChange('MATERIAL', i, 'note', e.target.value)} placeholder="Note..." />
                                        }
                                    ]} />
                                <div style={{ marginTop: 15, textAlign: 'right' }}><Button type="primary" icon={<AppstoreAddOutlined />} onClick={() => handleGeneratePOs('MATERIAL')}>Tạo PO Nguyên Liệu</Button></div>
                            </div>
                        )
                    },
                    {
                        key: '2', label: '2. Nhu Cầu Gia Công',
                        children: (
                            <div>
                                <Table dataSource={outsourcingList} rowKey={(r, i) => i || 0} pagination={false} size="small" scroll={{ y: 300 }}
                                    columns={[
                                        { title: 'Sản Phẩm', dataIndex: 'product_sku', width: 100, render: (t: any) => <b>{t}</b> },
                                        { title: 'Công Đoạn', dataIndex: 'step_name', width: 150 },
                                        {
                                            title: 'Nhà Gia Công',
                                            dataIndex: 'supplier_name',
                                            width: 180,
                                            render: (v: any, r: any, i: number) => (
                                                <Select
                                                    value={v}
                                                    style={{ width: '100%' }}
                                                    placeholder="Chọn Nhà GC"
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    onChange={(val) => handleDataChange('OUTSOURCING', i, 'supplier_name', val)}
                                                    options={suppliers.filter(s => s.type !== 'MATERIAL').map(s => ({ label: s.name, value: s.name }))}
                                                />
                                            )
                                        },
                                        {
                                            title: 'Số Lượng',
                                            dataIndex: 'quantity',
                                            width: 100,
                                            render: (v: any, r: any, i: number) => (
                                                <InputNumber
                                                    value={v}
                                                    min={0}
                                                    onChange={(val) => handleDataChange('OUTSOURCING', i, 'quantity', val)}
                                                    style={{ width: '100%' }}
                                                />
                                            )
                                        },
                                        {
                                            title: 'Đơn Giá',
                                            dataIndex: 'unit_price',
                                            width: 120,
                                            render: (v: any, r: any, i: number) => (
                                                <InputNumber
                                                    value={v}
                                                    min={0}
                                                    formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    onChange={(val) => handleDataChange('OUTSOURCING', i, 'unit_price', val)}
                                                    style={{ width: '100%' }}
                                                />
                                            )
                                        },
                                        { title: 'Thành Tiền', dataIndex: 'total_cost', align: 'right' as const, width: 120, render: (v: any) => <b>{Number(v).toLocaleString()}</b> },
                                        {
                                            title: 'Ghi chú PO',
                                            render: (t: any, r: any, i: number) => <Input size="small" value={r.note} onChange={(e) => handleDataChange('OUTSOURCING', i, 'note', e.target.value)} placeholder="Ghi chú đơn hàng..." />
                                        }
                                    ]} />
                                <div style={{ marginTop: 15, textAlign: 'right' }}><Button type="primary" style={{ backgroundColor: '#d46b08' }} icon={<ScissorOutlined />} onClick={() => handleGeneratePOs('OUTSOURCING')}>Tạo Đơn Hàng Gia Công</Button></div>
                            </div>
                        )
                    },
                    {
                        key: '3', label: '3. Chi Phí Vận Chuyển',
                        children: (
                            <div>
                                <div style={{ marginBottom: 10 }}>Dữ liệu lấy từ mục <b>Logistics</b> của từng sản phẩm.</div>
                                <Table dataSource={logisticsList} rowKey={(r, i) => i || 0} pagination={false} size="small"
                                    columns={[
                                        { title: 'Sản Phẩm', dataIndex: 'product_sku', render: (t: any) => <b>{t}</b> },
                                        { title: 'Khoản Mục', dataIndex: 'name' },
                                        { title: 'Đơn Giá', dataIndex: 'cost', align: 'right' as const, render: (v: any) => Number(v).toLocaleString() },
                                        { title: 'Số Lượng', dataIndex: 'quantity', align: 'center' as const },
                                        { title: 'Thành Tiền', dataIndex: 'total_cost', align: 'right' as const, render: (v: any) => <b style={{ color: '#096dd9' }}>{Number(v).toLocaleString()}</b> },
                                        { title: 'Ghi chú', dataIndex: 'note' }
                                    ]}
                                    summary={(pageData) => {
                                        const total = pageData.reduce((prev, current) => prev + Number(current.total_cost), 0);
                                        return (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={4} align="right"><b>Tổng:</b></Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right"><b>{total.toLocaleString()}</b></Table.Summary.Cell>
                                                <Table.Summary.Cell index={2} />
                                            </Table.Summary.Row>
                                        );
                                    }}
                                />
                            </div>
                        )
                    },
                    {
                        key: '4', label: '4. Tiến Độ (Gantt)',
                        children: (
                            <div>
                                {mrpData?.gantt_data?.map((task: any) => (
                                    <div key={task.id} style={{ marginBottom: 15 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{task.name}</strong><small>{dayjs(task.end).format('DD/MM')}</small></div>
                                        <Progress percent={30} strokeColor="#1890ff" trailColor="#f0f0f0" />
                                    </div>
                                ))}
                            </div>
                        )
                    }
                ]} />
            </div>
        );
    };

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: 16 }}><Col span={8}><Card><Statistic title="Đơn Hàng Chờ SX" value={pendingOrders.length} prefix={<AlertOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col><Col span={8}><Card><Statistic title="Kế Hoạch Đang Chạy" value={plans.length} prefix={<ProjectOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col></Row>
            <Card title="Trung Tâm Điều Hành Sản Xuất (Planning Center)" extra={<Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    { key: 'PENDING', label: '1. Gom Đơn Lập Kế Hoạch', children: <div><div style={{ marginBottom: 10, background: '#fffbe6', padding: 10 }}><AlertOutlined /> Chọn đơn hàng để lập kế hoạch.</div><Table rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }} dataSource={pendingOrders} columns={pendingColumns} rowKey="id" footer={() => (<Button type="primary" disabled={selectedRowKeys.length === 0} onClick={() => setIsCreateModalOpen(true)}>Lập Kế Hoạch</Button>)} /></div> },
                    { key: 'PLANS', label: '2. Danh Sách Kế Hoạch', children: <Table dataSource={plans} columns={planColumns} rowKey="id" /> }
                ]} />
            </Card>
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 30 }}>
                        <span>Phân Tích Kế Hoạch: {mrpData?.plan_info?.name || ''}</span>
                        <Button type="primary" onClick={handleSaveAnalysis} icon={<SaveOutlined />} loading={loading}>Lưu Kết Quả</Button>
                    </div>
                }
                open={isDashboardOpen}
                onCancel={() => setIsDashboardOpen(false)}
                footer={null}
                width={1100}
                style={{ top: 20 }}
            >
                {renderDashboard()}
            </Modal>
            <Modal title="Thiết Lập Kế Hoạch" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} onOk={() => form.submit()}><Form form={form} layout="vertical" onFinish={handleCreatePlan}><Form.Item name="code" label="Mã KH" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="name" label="Tên Đợt" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="dateRange" label="Thời Gian" rules={[{ required: true }]}><RangePicker style={{ width: '100%' }} /></Form.Item></Form></Modal>
        </div>
    );
};
export default PlanningPage;