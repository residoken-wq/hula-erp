import React, { useEffect, useState } from 'react';
import { Card, Modal, Form, Input, DatePicker, Tabs, Button, message, Drawer, Space, Typography, Tag, Divider, Select } from 'antd';
import { ReloadOutlined, PlusOutlined, SettingOutlined, CalculatorOutlined, UserAddOutlined } from '@ant-design/icons';
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
const { Option } = Select;

const PlanningPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('CONTROL_TOWER');
    const [loading, setLoading] = useState(false);
    const isMobile = !!useMobile();

    // Data State
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [pfos, setPfos] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [suppliers, setSuppliers] = useState<any[]>([]);
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [form] = Form.useForm();
    
    // PFO Detail Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedPfo, setSelectedPfo] = useState<any>(null);
    const [pfoDetails, setPfoDetails] = useState<any>(null);
    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSuggest, resPfos, resSuppliers] = await Promise.all([
                axios.get(`${API_URL}/planning/pfo/suggestions`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/planning`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/suppliers`).catch(() => ({ data: [] }))
            ]);
            setPendingOrders(Array.isArray(resSuggest.data) ? resSuggest.data : []);
            
            const loadedPfos = Array.isArray(resPfos.data) ? resPfos.data : [];
            setPfos(loadedPfos);
            setSuppliers(Array.isArray(resSuppliers.data) ? resSuppliers.data : []);
            
            // Calculate real stats
            setStats({
                alerts: loadedPfos.filter(p => p.status === 'WAITING_VENDOR' || !p.vendor_id).length,
                activePfos: loadedPfos.filter(p => ['MATERIAL_PREP', 'IN_PRODUCTION', 'RECEIVING'].includes(p.status)).length,
                qcPassed: loadedPfos.filter(p => p.status === 'COMPLETED').length,
                otif: 95
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
                orderCode: selectedOrders[0]?.order_code
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
        setSelectedVendorId(pfo.vendor_id || null);
        setIsDrawerOpen(true);
        
        try {
            const res = await axios.get(`${API_URL}/planning/pfo/${pfo.id}`);
            setPfoDetails(res.data);
            if (res.data?.vendor_id) {
                setSelectedVendorId(res.data.vendor_id);
            }
        } catch (e) {
            setPfoDetails({ ...pfo, material_requirements: [] });
        }
    };

    const handleCalculateBom = async () => {
        if (!selectedPfo) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/planning/pfo/${selectedPfo.id}/calculate-bom`);
            message.success('Đã bóc tách BOM thành công!');
            
            // Refresh details
            const res = await axios.get(`${API_URL}/planning/pfo/${selectedPfo.id}`);
            setPfoDetails(res.data);
            fetchData();
        } catch (e: any) { 
            message.error(e.response?.data?.message || 'Lỗi tính toán BOM'); 
        }
        setLoading(false);
    };

    const handleAssignVendor = async () => {
        if (!selectedPfo || !selectedVendorId) {
            message.warning('Vui lòng chọn Nhà gia công');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/planning/pfo/${selectedPfo.id}/assign-vendor`, { vendor_id: selectedVendorId });
            message.success('Đã gán Nhà gia công thành công!');
            
            const res = await axios.get(`${API_URL}/planning/pfo/${selectedPfo.id}`);
            setPfoDetails(res.data);
            fetchData();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi gán xưởng gia công');
        }
        setLoading(false);
    };

    const handleGeneratePo = async () => {
        if (!selectedPfo) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/planning/pfo/${selectedPfo.id}/generate-pos`);
            message.success(res.data.message || 'Đã tạo Đơn mua hàng (PO)');
            fetchData();
        } catch (e: any) { 
            message.error(e.response?.data?.message || 'Lỗi tạo PO'); 
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: isMobile ? '100%' : '82%', margin: '0 auto', padding: isMobile ? '8px 4px' : '16px 0' }}>
            {/* STATS CARDS */}
            <ControlTowerKPI stats={stats} />

            <Card
                bodyStyle={{ padding: isMobile ? '8px 12px' : 16 }}
                style={{ borderRadius: 12, border: '1px solid #e8e8e8', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
                title={
                    <span style={{ fontSize: isMobile ? 14 : 17, fontWeight: 600, color: '#1d39c4' }}>
                        🏭 Outsourced Manufacturing Control Tower
                    </span>
                }
                extra={
                    <Space>
                        <Button 
                            icon={<PlusOutlined />} 
                            onClick={() => setActiveTab('DEMAND')} 
                            type={activeTab === 'DEMAND' ? 'primary' : 'default'}
                            style={{ borderRadius: 6 }}
                        >
                            Gom Đơn
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 6 }} />
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
                        <Tag color="blue">{pfoDetails?.status || selectedPfo?.status}</Tag>
                    </Space>
                }
                placement="right"
                width={isMobile ? '100%' : 850}
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                extra={
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<CalculatorOutlined />}
                            onClick={handleCalculateBom}
                            loading={loading}
                        >
                            Tính Toán Lại BOM
                        </Button>
                    </Space>
                }
            >
                {selectedPfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <Title level={5} style={{ marginBottom: 12 }}>1. Thông tin chung</Title>
                            <Card size="small" style={{ background: '#fafafa', borderRadius: 8 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                                    <p style={{ margin: 0 }}>
                                        <b>Sales Order:</b> {pfoDetails?.sales_order?.order_code || selectedPfo?.sales_order_code || selectedPfo?.sales_order?.order_code || selectedPfo?.code?.replace('PFO-', '') || 'Chưa liên kết'}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <b>Khách hàng:</b> {pfoDetails?.sales_order?.customer_name || pfoDetails?.sales_order?.customer?.name || 'N/A'}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <b>Deadline:</b> {selectedPfo?.committed_finish_date ? dayjs(selectedPfo.committed_finish_date).format('DD/MM/YYYY') : 'N/A'}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <b>Tiến độ:</b> <Tag color="green">{selectedPfo?.progress || 0}%</Tag>
                                    </p>
                                </div>
                            </Card>
                        </div>

                        <div>
                            <Title level={5} style={{ marginBottom: 8 }}>2. Xưởng Gia Công (Gate 3)</Title>
                            <Space wrap>
                                <Select 
                                    style={{ width: 260 }} 
                                    placeholder="Chọn Nhà gia công" 
                                    value={selectedVendorId}
                                    onChange={setSelectedVendorId}
                                >
                                    {suppliers.map(s => (
                                        <Option key={s.id} value={s.id}>{s.name} ({s.code || s.supplier_code})</Option>
                                    ))}
                                </Select>
                                <Button 
                                    type="primary" 
                                    ghost
                                    icon={<UserAddOutlined />}
                                    onClick={handleAssignVendor}
                                    loading={loading}
                                >
                                    Lưu Xưởng Gia Công
                                </Button>
                            </Space>
                        </div>
                        
                        <Divider style={{ margin: '8px 0' }} />

                        <div>
                            <Title level={5} style={{ marginBottom: 12 }}>3. Ma Trận Vật Tư (Material Matrix)</Title>
                            <MaterialMatrix 
                                requirements={pfoDetails?.material_requirements || []} 
                                loading={loading}
                                onGeneratePo={handleGeneratePo}
                                onCalculateBom={handleCalculateBom}
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