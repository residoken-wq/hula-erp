import React, { useEffect, useState } from 'react';
import { Card, Modal, Form, Input, DatePicker, Row, Col, Tabs, Statistic, Button, message } from 'antd';
import { AlertOutlined, ProjectOutlined, ReloadOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import useMobile from '../hooks/useMobile';

// Extracted Tab Components
import PendingOrdersTab from '../components/planning/PendingOrdersTab';
import PlanDashboardTab from '../components/planning/PlanDashboardTab';
import GanttChartTab from '../components/planning/GanttChartTab';
import BookingApprovalModal from '../components/planning/BookingApprovalModal';
import BookingListTab from '../components/planning/BookingListTab';
import MrpSummaryDashboardTab from '../components/planning/MrpSummaryDashboardTab';

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

    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingPlanInfo, setBookingPlanInfo] = useState<{id: number, name: string} | null>(null);
    const [bookingItems, setBookingItems] = useState<any[]>([]);

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

    const handleRunMrp = async (planId: number, force: boolean = false) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/planning/mrp/${planId}${force ? '?force=true' : ''}`);
            if (res.data && res.data.mrp_result) {
                res.data.mrp_result = res.data.mrp_result.map((item: any) => ({ ...item, use_stock: true }));
            }
            setMrpData(res.data);
            setOutsourcingList(res.data.outsourcing_result || []);
            setLogisticsList(res.data.logistics_result || []);
            setIsDashboardOpen(true);
            if (force) message.success('Đã tính lại MRP thành công!');
            fetchData();
        } catch (e) { message.error('Lỗi chạy MRP'); }
        setLoading(false);
    };

    const handleForceRunMrp = (planId: number) => {
        handleRunMrp(planId, true);
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

    const handleDetailDataChange = (materialIndex: number, detailIndex: number, val: any) => {
        const newData = [...mrpData.mrp_result];
        const item = newData[materialIndex];
        if (item.details) {
            const newDetails = [...item.details];
            newDetails[detailIndex] = { ...newDetails[detailIndex], net_requirement: val };
            item.details = newDetails;
            item.net_requirement = newDetails.reduce((sum, d) => sum + Number(d.net_requirement || 0), 0);
        }
        setMrpData({ ...mrpData, mrp_result: newData });
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

    const handleDeletePlan = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) {
            try {
                await axios.delete(`${API_URL}/planning/${id}`);
                message.success('Đã xóa kế hoạch');
                fetchData();
            } catch (error) {
                console.error(error);
                message.error('Lỗi khi xóa kế hoạch');
            }
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await axios.put(`${API_URL}/planning/${id}/status`, { status });
            message.success('Cập nhật trạng thái thành công');
            fetchData();
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleConfirmBookings = async (planId: number) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/planning/${planId}/booking-items`);
            const { items: extractedItems, plan } = res.data;
            
            setBookingItems(extractedItems);
            setBookingPlanInfo({ id: plan.id, name: plan.name });
            setIsBookingModalOpen(true);
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi lấy dữ liệu Kế hoạch');
        }
        setLoading(false);
    };

    const submitBookings = async (itemIds?: number[]) => {
        if (!bookingPlanInfo) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/planning/${bookingPlanInfo.id}/confirm-bookings`, {
                itemIds: itemIds
            });
            message.success('Đã duyệt Booking thành công.');
            setIsBookingModalOpen(false);
            fetchData();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi xác nhận Booking');
        }
        setLoading(false);
    };

    return (
        <div>
            {/* STATS CARDS */}
            <div style={{ overflowX: isMobile ? 'auto' : 'visible', marginBottom: 16 }}>
                <Row gutter={[isMobile ? 8 : 16, 8]} wrap={!isMobile} style={{ flexWrap: isMobile ? 'nowrap' : 'wrap', minWidth: isMobile ? 600 : 'auto' }}>
                    <Col flex={isMobile ? '140px' : 1}>
                        <Card bodyStyle={{ padding: isMobile ? 10 : 16 }} style={{ borderRadius: 10, border: '1px solid #ffd591', background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)' }}>
                            <Statistic title={<span style={{ fontSize: isMobile ? 11 : 13, color: '#d46b08' }}>Chờ Lập KH</span>} value={pendingOrders.length} prefix={<AlertOutlined />} valueStyle={{ color: '#d46b08', fontSize: isMobile ? 20 : 28, fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col flex={isMobile ? '140px' : 1}>
                        <Card bodyStyle={{ padding: isMobile ? 10 : 16 }} style={{ borderRadius: 10, border: '1px solid #91d5ff', background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)' }}>
                            <Statistic title={<span style={{ fontSize: isMobile ? 11 : 13, color: '#096dd9' }}>Kế Hoạch</span>} value={plans.length} prefix={<ProjectOutlined />} valueStyle={{ color: '#096dd9', fontSize: isMobile ? 20 : 28, fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col flex={isMobile ? '140px' : 1}>
                        <Card bodyStyle={{ padding: isMobile ? 10 : 16 }} style={{ borderRadius: 10, border: '1px solid #b7eb8f', background: 'linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%)' }}>
                            <Statistic title={<span style={{ fontSize: isMobile ? 11 : 13, color: '#389e0d' }}>Sẵn sàng xuất</span>} value={pendingOrders.filter((o: any) => o.can_fulfill_stock).length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#389e0d', fontSize: isMobile ? 20 : 28, fontWeight: 700 }} />
                        </Card>
                    </Col>
                </Row>
            </div>

            <Card
                bodyStyle={{ padding: isMobile ? '8px 12px' : undefined }}
                style={{ borderRadius: 10 }}
                title={
                    <span style={{ fontSize: isMobile ? 14 : 17, fontWeight: 600, color: '#1d39c4' }}>
                        📋 MRP / Planning Center
                    </span>
                }
                extra={
                    isMobile
                        ? <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 6 }} />
                        : <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 6 }}>Làm mới</Button>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'PENDING',
                        label: isMobile ? '📥 Gom Đơn' : '📥 1. Gom Đơn Lập Kế Hoạch',
                        children: (
                            <PendingOrdersTab
                                pendingOrders={pendingOrders}
                                selectedRowKeys={selectedRowKeys}
                                onSelectedRowKeysChange={setSelectedRowKeys}
                                onCreatePlan={() => {
                                    const selectedOrders = pendingOrders.filter(o => selectedRowKeys.includes(o.id));
                                    const codes = selectedOrders.map(o => o.order_code).join('-');
                                    form.setFieldsValue({
                                        code: `PL-${codes}`,
                                        name: `Kế hoạch SX ${dayjs().format('DD/MM/YYYY')}`
                                    });
                                    setIsCreateModalOpen(true);
                                }}
                                isMobile={isMobile}
                                loading={loading}
                                setLoading={setLoading}
                                onRefresh={fetchData}
                            />
                        )
                    },
                    {
                        key: 'PLANS',
                        label: isMobile ? '📋 Đang chạy' : '📋 2. KH Đang chạy',
                        children: (
                            <PlanDashboardTab
                                plans={plans.filter((p: any) => p.status !== 'DONE')}
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
                                onConfirmBookings={handleConfirmBookings}
                                onDataChange={handleDataChange}
                                onDetailDataChange={handleDetailDataChange}
                                onToggleStock={handleToggleStock}
                                onGeneratePOs={handleGeneratePOs}
                                onSaveAnalysis={handleSaveAnalysis}
                                onUpdateStatus={handleUpdateStatus}
                                onForceRunMrp={handleForceRunMrp}
                            />
                        )
                    },
                    {
                        key: 'DONE_PLANS',
                        label: isMobile ? '✅ Đã xong' : '✅ KH Hoàn Thành',
                        children: (
                            <PlanDashboardTab
                                plans={plans.filter((p: any) => p.status === 'DONE')}
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
                                onConfirmBookings={handleConfirmBookings}
                                onDataChange={handleDataChange}
                                onDetailDataChange={handleDetailDataChange}
                                onToggleStock={handleToggleStock}
                                onGeneratePOs={handleGeneratePOs}
                                onSaveAnalysis={handleSaveAnalysis}
                                onUpdateStatus={handleUpdateStatus}
                                onForceRunMrp={handleForceRunMrp}
                            />
                        )
                    },
                    {
                        key: 'GANTT',
                        label: isMobile ? '📊 Gantt' : '📊 3. Gantt Chart',
                        children: (
                            <GanttChartTab
                                ganttPlans={ganttPlans}
                                setGanttPlans={setGanttPlans}
                            />
                        )
                    },
                    {
                        key: 'BOOKINGS',
                        label: isMobile ? '📦 Booking' : '📦 4. Quản Lý Booking',
                        children: (
                            <BookingListTab isMobile={isMobile} />
                        )
                    },
                    {
                        key: 'SUMMARY',
                        label: isMobile ? '📊 Tổng hợp' : '📊 5. Tổng Hợp Nhu Cầu',
                        children: (
                            <MrpSummaryDashboardTab isMobile={isMobile} />
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

            {/* Booking Approval Modal */}
            <BookingApprovalModal
                open={isBookingModalOpen}
                planName={bookingPlanInfo?.name || ''}
                items={bookingItems}
                loading={loading}
                onCancel={() => setIsBookingModalOpen(false)}
                onConfirm={submitBookings}
            />
        </div>
    );
};

export default PlanningPage;