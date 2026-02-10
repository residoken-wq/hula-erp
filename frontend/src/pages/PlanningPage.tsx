import React, { useEffect, useState } from 'react';
import { Card, Modal, Form, Input, DatePicker, Row, Col, Tabs, Statistic, Button, message } from 'antd';
import { AlertOutlined, ProjectOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import useMobile from '../hooks/useMobile';

// Extracted Tab Components
import PendingOrdersTab from '../components/planning/PendingOrdersTab';
import PlanDashboardTab from '../components/planning/PlanDashboardTab';
import GanttChartTab from '../components/planning/GanttChartTab';

const { RangePicker } = DatePicker;

const PlanningPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('PENDING');
    const [loading, setLoading] = useState(false);
    const isMobile = !!useMobile();

    // Data State
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [ganttPlans, setGanttPlans] = useState<any[]>([]);

    // Analysis Data (Editable)
    const [mrpData, setMrpData] = useState<any>(null);
    const [outsourcingList, setOutsourcingList] = useState<any[]>([]);
    const [logisticsList, setLogisticsList] = useState<any[]>([]);
    const [costBasis, setCostBasis] = useState<'REFERENCE' | 'PURCHASE'>('REFERENCE');

    // UI State
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSuggest, resPlans, resSupp, resGantt] = await Promise.all([
                axios.get(`${API_URL}/planning/suggestion`),
                axios.get(`${API_URL}/planning`),
                axios.get(`${API_URL}/suppliers`),
                axios.get(`${API_URL}/planning/gantt`).catch(() => ({ data: [] }))
            ]);
            setPendingOrders(Array.isArray(resSuggest.data) ? resSuggest.data : []);
            setPlans(Array.isArray(resPlans.data) ? resPlans.data : []);
            setSuppliers(Array.isArray(resSupp.data) ? resSupp.data : []);
            setGanttPlans(Array.isArray(resGantt.data) ? resGantt.data : []);
        } catch (e) { message.error('Lỗi tải dữ liệu'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // --- Handlers ---
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
            if (res.data && res.data.mrp_result) {
                res.data.mrp_result = res.data.mrp_result.map((item: any) => ({ ...item, use_stock: true }));
            }
            setMrpData(res.data);
            setOutsourcingList(res.data.outsourcing_result || []);
            setLogisticsList(res.data.logistics_result || []);
            setIsDashboardOpen(true);
            fetchData();
        } catch (e) { message.error('Lỗi chạy MRP'); }
        setLoading(false);
    };

    const handleGeneratePOs = async (type: 'MATERIAL' | 'OUTSOURCING') => {
        if (!mrpData) return;
        const itemsToOrder = type === 'MATERIAL' ? mrpData.mrp_result : outsourcingList;
        try {
            const res = await axios.post(`${API_URL}/planning/${mrpData.plan_info.id}/generate-pos`, { items: itemsToOrder });
            message.success(res.data.message);
        } catch (e) { message.error('Lỗi tạo PO'); }
    };

    const handleDataChange = (type: 'MATERIAL' | 'OUTSOURCING', index: number, field: string, value: any) => {
        if (type === 'MATERIAL') {
            const newData = [...mrpData.mrp_result];
            newData[index] = { ...newData[index], [field]: value };
            if (field === 'supplier_name') {
                const supplierInfo = newData[index].possible_suppliers?.find(
                    (s: any) => s.supplier_name?.trim().toLowerCase() === String(value).trim().toLowerCase()
                );
                newData[index].reference_price = supplierInfo ? supplierInfo.price : 0;
            }
            setMrpData({ ...mrpData, mrp_result: newData });
        } else {
            const newData = [...outsourcingList];
            newData[index] = { ...newData[index], [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                newData[index].total_cost = Number(newData[index].quantity) * Number(newData[index].unit_price);
            }
            setOutsourcingList(newData);
        }
    };

    const handleToggleStock = (index: number, checked: boolean) => {
        const newData = [...mrpData.mrp_result];
        const item = newData[index];
        item.use_stock = checked;
        item.net_requirement = checked
            ? Math.max(0, Number(item.gross_requirement || 0) - Number(item.available_stock || 0))
            : Number(item.gross_requirement || 0);
        setMrpData({ ...mrpData, mrp_result: newData });
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
        } catch (e) { message.error('Lỗi khi lưu dữ liệu'); }
        setLoading(false);
    };

    const handleDeletePlan = (id: number) => {
        Modal.confirm({
            title: 'Xóa kế hoạch',
            content: 'Bạn có chắc muốn xóa kế hoạch này?',
            okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await axios.delete(`${API_URL}/planning/${id}`);
                    message.success('Đã xóa kế hoạch');
                    fetchData();
                } catch (e: any) { message.error(e.response?.data?.message || 'Lỗi xóa kế hoạch'); }
            }
        });
    };

    return (
        <div>
            {/* STATS CARDS */}
            <div style={{ overflowX: isMobile ? 'auto' : 'visible', marginBottom: 16 }}>
                <Row gutter={[isMobile ? 8 : 16, 8]} wrap={!isMobile} style={{ flexWrap: isMobile ? 'nowrap' : 'wrap', minWidth: isMobile ? 320 : 'auto' }}>
                    <Col flex={isMobile ? '150px' : 1}>
                        <Card bodyStyle={{ padding: isMobile ? 10 : 20 }}>
                            <Statistic title={<span style={{ fontSize: isMobile ? 12 : 14 }}>Chờ SX</span>} value={pendingOrders.length} prefix={<AlertOutlined />} valueStyle={{ color: '#faad14', fontSize: isMobile ? 18 : 24 }} />
                        </Card>
                    </Col>
                    <Col flex={isMobile ? '150px' : 1}>
                        <Card bodyStyle={{ padding: isMobile ? 10 : 20 }}>
                            <Statistic title={<span style={{ fontSize: isMobile ? 12 : 14 }}>Kế Hoạch</span>} value={plans.length} prefix={<ProjectOutlined />} valueStyle={{ color: '#1890ff', fontSize: isMobile ? 18 : 24 }} />
                        </Card>
                    </Col>
                </Row>
            </div>

            <Card
                bodyStyle={{ padding: isMobile ? '8px 12px' : undefined }}
                title={<span style={{ fontSize: isMobile ? 14 : 16 }}>MRP / Planning</span>}
                extra={
                    isMobile
                        ? <Button icon={<ReloadOutlined />} onClick={fetchData} />
                        : <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'PENDING',
                        label: isMobile ? 'Gom Đơn' : '1. Gom Đơn Lập Kế Hoạch',
                        children: (
                            <PendingOrdersTab
                                pendingOrders={pendingOrders}
                                selectedRowKeys={selectedRowKeys}
                                onSelectedRowKeysChange={setSelectedRowKeys}
                                onCreatePlan={() => setIsCreateModalOpen(true)}
                                isMobile={isMobile}
                                loading={loading}
                                setLoading={setLoading}
                                onRefresh={fetchData}
                            />
                        )
                    },
                    {
                        key: 'PLANS',
                        label: isMobile ? 'Kế Hoạch' : '2. Danh Sách Kế Hoạch',
                        children: (
                            <PlanDashboardTab
                                plans={plans}
                                mrpData={mrpData}
                                outsourcingList={outsourcingList}
                                logisticsList={logisticsList}
                                suppliers={suppliers}
                                costBasis={costBasis}
                                setCostBasis={setCostBasis}
                                isMobile={isMobile}
                                loading={loading}
                                isDashboardOpen={isDashboardOpen}
                                setIsDashboardOpen={setIsDashboardOpen}
                                onRunMrp={handleRunMrp}
                                onDeletePlan={handleDeletePlan}
                                onDataChange={handleDataChange}
                                onToggleStock={handleToggleStock}
                                onGeneratePOs={handleGeneratePOs}
                                onSaveAnalysis={handleSaveAnalysis}
                            />
                        )
                    },
                    {
                        key: 'GANTT',
                        label: isMobile ? 'Gantt' : '📊 Gantt Chart',
                        children: (
                            <GanttChartTab
                                ganttPlans={ganttPlans}
                                setGanttPlans={setGanttPlans}
                            />
                        )
                    }
                ]} />
            </Card>

            {/* Create Plan Modal */}
            <Modal title="Thiết Lập Kế Hoạch" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleCreatePlan}>
                    <Form.Item name="code" label="Mã KH" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="name" label="Tên Đợt" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="dateRange" label="Thời Gian" rules={[{ required: true }]}><RangePicker style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PlanningPage;