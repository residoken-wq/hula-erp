import React, { useEffect, useState } from 'react';
import { Card, Modal, Form, Input, DatePicker, Tabs, Button, message, Drawer, Space, Typography, Tag, Divider } from 'antd';
import { ReloadOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import useMobile from '../hooks/useMobile';

// Components
import ControlTowerKPI from '../components/planning/ControlTowerKPI';
import PfoKanbanBoard from '../components/planning/PfoKanbanBoard';
import MaterialMatrix from '../components/planning/MaterialMatrix';
import PendingOrdersTab from '../components/planning/PendingOrdersTab';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const PlanningPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('CONTROL_TOWER');
    const [loading, setLoading] = useState(false);
    const isMobile = !!useMobile();

    // Data State
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [pfos, setPfos] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [form] = Form.useForm();
    
    // PFO Detail Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedPfo, setSelectedPfo] = useState<any>(null);
    const [pfoDetails, setPfoDetails] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSuggest, resPfos] = await Promise.all([
                axios.get(`${API_URL}/planning/pfo/suggestions`),
                axios.get(`${API_URL}/planning`) // using old endpoint for now, will map PFOs
            ]);
            setPendingOrders(Array.isArray(resSuggest.data) ? resSuggest.data : []);
            
            // Map old 'plans' to PFOs if using old endpoint temporarily
            const loadedPfos = Array.isArray(resPfos.data) ? resPfos.data : [];
            setPfos(loadedPfos);
            
            // Mock Stats (In real app, fetch from backend)
            setStats({
                alerts: loadedPfos.filter(p => p.status === 'WAITING_VENDOR').length,
                activePfos: loadedPfos.filter(p => ['MATERIAL_PREP', 'IN_PRODUCTION', 'RECEIVING'].includes(p.status)).length,
                qcPassed: 12,
                otif: 94
            });
        } catch (e) { message.error('Lỗi tải dữ liệu'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // --- Handlers ---
    const handleCreatePfo = async (values: any) => {
        try {
            const selectedOrders = pendingOrders.filter((o: any) => selectedRowKeys.includes(o.id));
            const payload = {
                code: values.code,
                name: values.name,
                start_date: values.dateRange[0].toISOString(),
                end_date: values.dateRange[1].toISOString(),
                orderCode: selectedOrders[0]?.order_code // Pass first order for now (1 PFO - 1 SO)
            };
            await axios.post(`${API_URL}/planning/pfo/generate`, payload);
            message.success('Đã phát hành Lệnh SX (PFO)');
            setIsCreateModalOpen(false); setSelectedRowKeys([]); fetchData(); setActiveTab('CONTROL_TOWER');
        } catch (e: any) { 
            message.error(e.response?.data?.message || 'Lỗi phát hành PFO'); 
        }
    };

    const handlePfoClick = async (pfo: any) => {
        setSelectedPfo(pfo);
        setIsDrawerOpen(true);
        // Fetch detailed PFO info (Gate 2, 3, 4 data)
        try {
            const res = await axios.get(`${API_URL}/planning/pfo/${pfo.id}`);
            setPfoDetails(res.data);
        } catch (e) {
            // For now, if endpoint fails, just show basic data
            setPfoDetails({ ...pfo, material_requirements: [] });
        }
    };

    const handleCalculateBom = async () => {
        if (!selectedPfo) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/planning/pfo/${selectedPfo.id}/calculate-bom`);
            message.success('Đã bóc tách BOM thành công');
            // Refresh details
            const res = await axios.get(`${API_URL}/planning/pfo/${selectedPfo.id}`);
            setPfoDetails(res.data);
            fetchData();
        } catch (e) { message.error('Lỗi tính toán BOM'); }
        setLoading(false);
    };

    const handleGeneratePo = async () => {
        if (!selectedPfo) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/planning/pfo/${selectedPfo.id}/generate-pos`);
            message.success(res.data.message || 'Đã tạo PO');
            fetchData();
        } catch (e: any) { message.error(e.response?.data?.message || 'Lỗi tạo PO'); }
        setLoading(false);
    };

    return (
        <div>
            {/* STATS CARDS */}
            <ControlTowerKPI stats={stats} />

            <Card
                bodyStyle={{ padding: isMobile ? '8px 12px' : undefined }}
                style={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                title={
                    <span style={{ fontSize: isMobile ? 14 : 17, fontWeight: 600, color: '#1d39c4' }}>
                        🏭 Outsourced Manufacturing Control Tower
                    </span>
                }
                extra={
                    <Space>
                        <Button icon={<PlusOutlined />} onClick={() => setActiveTab('DEMAND')} type={activeTab === 'DEMAND' ? 'primary' : 'default'}>
                            Gom Đơn
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchData} />
                    </Space>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'CONTROL_TOWER',
                        label: 'Kanban Theo Dõi (PFO)',
                        children: (
                            <PfoKanbanBoard pfos={pfos} onPfoClick={handlePfoClick} />
                        )
                    },
                    {
                        key: 'DEMAND',
                        label: 'Gom Đơn & Phát Hành (Gate 1)',
                        children: (
                            <PendingOrdersTab
                                pendingOrders={pendingOrders}
                                selectedRowKeys={selectedRowKeys}
                                onSelectedRowKeysChange={setSelectedRowKeys}
                                onCreatePlan={() => {
                                    if (selectedRowKeys.length === 0) {
                                        message.warning('Chọn ít nhất 1 đơn hàng'); return;
                                    }
                                    if (selectedRowKeys.length > 1) {
                                        message.warning('Hiện tại 1 PFO chỉ link 1 Sales Order'); return;
                                    }
                                    const selectedOrders = pendingOrders.filter(o => selectedRowKeys.includes(o.id));
                                    form.setFieldsValue({
                                        code: `PFO-${selectedOrders[0]?.order_code}`,
                                        name: `Sản xuất ${selectedOrders[0]?.order_code}`
                                    });
                                    setIsCreateModalOpen(true);
                                }}
                                isMobile={isMobile}
                                loading={loading}
                                setLoading={setLoading}
                                onRefresh={fetchData}
                            />
                        )
                    }
                ]} />
            </Card>

            {/* Create PFO Modal */}
            <Modal title="Phát hành Lệnh SX (PFO)" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleCreatePfo}>
                    <Form.Item name="code" label="Mã PFO" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="name" label="Tên Lệnh" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="dateRange" label="Thời Gian (Planned Start - End)" rules={[{ required: true }]}><RangePicker style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            {/* PFO Detail Drawer */}
            <Drawer
                title={
                    <Space>
                        <Text strong style={{ fontSize: 18 }}>Chi Tiết Lệnh SX: {selectedPfo?.code}</Text>
                        <Tag color="blue">{selectedPfo?.status}</Tag>
                    </Space>
                }
                placement="right"
                width={isMobile ? '100%' : 900}
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                extra={
                    <Space>
                        <Button type="primary" onClick={handleCalculateBom}>Tính Toán Lại BOM</Button>
                        <Button icon={<SettingOutlined />}>Cài Đặt</Button>
                    </Space>
                }
            >
                {pfoDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <Title level={5}>1. Thông tin chung</Title>
                            <Card size="small" style={{ background: '#fafafa' }}>
                                <p><b>Sales Order:</b> {pfoDetails.sales_order?.order_code}</p>
                                <p><b>Nhà gia công:</b> {pfoDetails.vendor_id ? `Vendor #${pfoDetails.vendor_id}` : <span style={{color:'red'}}>Chưa gán (Gate 3)</span>}</p>
                                <p><b>Deadline:</b> {pfoDetails.committed_finish_date ? dayjs(pfoDetails.committed_finish_date).format('DD/MM/YYYY') : 'N/A'}</p>
                            </Card>
                        </div>
                        
                        <Divider style={{ margin: '12px 0' }} />

                        <div>
                            <Title level={5}>2. Ma Trận Vật Tư (Material Matrix)</Title>
                            <MaterialMatrix 
                                requirements={pfoDetails.material_requirements || []} 
                                loading={loading}
                                onGeneratePo={handleGeneratePo}
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>
                )}
            </Drawer>
        </div>
    );
};

export default PlanningPage;