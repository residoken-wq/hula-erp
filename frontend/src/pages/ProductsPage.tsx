import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm, Row, Col, Divider, Tabs, InputNumber, Tooltip, Space, Badge, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined, ExperimentOutlined, AppstoreOutlined, BuildOutlined, SettingOutlined, SyncOutlined, LinkOutlined, TagOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

// --- IMPORTS CÁC COMPONENT ĐÃ TÁCH ---
import ProductBOMTab from '../components/products/ProductBOMTab';
import ProductRoutingTab from '../components/products/ProductRoutingTab';
// Import các component khác khi bạn tạo chúng:
// import ProductLogisticsTab from '../components/products/ProductLogisticsTab';
// import ProductComponentTab from '../components/products/ProductComponentTab'; 
// -------------------------------------

const { TextArea } = Input;
const { Option } = Select;

const ProductsPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('1'); 
    
    // Master Data
    const [categories, setCategories] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]); 
    const [suppliers, setSuppliers] = useState<any[]>([]); 
    const [processes, setProcesses] = useState<any[]>([]); 

    // Sub-data State (Đã giữ lại logic fetch/state trong ProductsPage)
    const [boms, setBoms] = useState<any[]>([]);
    const [routings, setRoutings] = useState<any[]>([]);
    const [logistics, setLogistics] = useState<any[]>([]);
    const [components, setComponents] = useState<any[]>([]); 

    const [form] = Form.useForm();

    const getCategoryName = (id: number) => {
        return categories.find(c => c.id === id)?.name || 'N/A';
    }

    // 1. Fetch Master Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/products`);
            setData(Array.isArray(res.data) ? res.data : []);
            
            const resCat = await axios.get(`${API_URL}/categories`);
            setCategories(Array.isArray(resCat.data) ? resCat.data : []);

            const resMat = await axios.get(`${API_URL}/materials`);
            const normalizedMaterials = Array.isArray(resMat.data) 
                ? resMat.data.map(m => ({
                    value: m.id, 
                    label: `${m.sku || m.code} - ${m.name}` 
                }))
                : [];
            setMaterials(normalizedMaterials);

            const resSup = await axios.get(`${API_URL}/suppliers`);
            setSuppliers(Array.isArray(resSup.data) ? resSup.data : []);
            
            const resProc = await axios.get(`${API_URL}/processes`);
            setProcesses(Array.isArray(resProc.data) ? resProc.data : []);
            
        } catch(e) { message.error('Lỗi tải dữ liệu'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    
    // 2. Detail Data Fetcher (Truyền xuống các Component con)
    const fetchDetailData = async (id: number) => {
        if (!id) return;
        try {
            const res = await axios.get(`${API_URL}/products/${id}`);
            const product = res.data;
            
            const resBOM = await axios.get(`${API_URL}/products/${product.sku}/boms`);
            setBoms(resBOM.data || []);
            
            const resRouting = await axios.get(`${API_URL}/products/${id}/routings`);
            setRoutings(resRouting.data || []);

            const resLogistics = await axios.get(`${API_URL}/products/${id}/logistics`);
            setLogistics(resLogistics.data || []);

            const resComp = await axios.get(`${API_URL}/products/combo/${product.sku}`);
            setComponents(resComp.data || []);

        } catch(e) { message.error('Lỗi tải chi tiết'); }
    };
    
    // 3. Main CRUD
    const handleSave = async (values: any) => {
        try {
            const payload = { ...values };
            
            if (editingItem) {
                await axios.put(`${API_URL}/products/${editingItem.id}`, payload);
            } else {
                await axios.post(`${API_URL}/products`, payload);
            }
            message.success('Đã lưu thành công'); 
            setIsModalOpen(false); 
            fetchData();
        } catch(e) { message.error('Lỗi lưu'); }
    };

    const handleDelete = async (id: number) => {
        try { await axios.delete(`${API_URL}/products/${id}`); message.success('Đã xóa'); fetchData(); } 
        catch(e) { message.error('Lỗi xóa'); }
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        form.setFieldsValue(item);
        setActiveTab('1');
        setIsModalOpen(true);
        fetchDetailData(item.id);
    };

    const handleCalculateCost = async (sku: string) => {
        try {
            const res = await axios.get(`${API_URL}/products/calculate-cost/${sku}`);
            message.success(`Giá vốn mới: ${Number(res.data.new_cost_price).toLocaleString()} ₫`);
            fetchData(); 
            if(editingItem) {
                const updatedItem = await axios.get(`${API_URL}/products/${editingItem.id}`);
                setEditingItem(updatedItem.data);
                form.setFieldsValue(updatedItem.data);
            }
        } catch(e) { message.error('Lỗi tính giá vốn'); }
    };

    const columns = [
        { title: 'Mã (SKU)', dataIndex: 'sku', width: 120, render: (t:any) => <b>{t}</b> },
        { title: 'Tên Sản Phẩm', dataIndex: 'name', render: (t:any) => <TagOutlined /> + t },
        { title: 'Phân loại', dataIndex: 'category_id', width: 150, render: (id: number) => <Tag color="blue">{getCategoryName(id)}</Tag> },
        { 
            title: 'Giá vốn', dataIndex: 'cost_price', width: 100, align: 'right' as const,
            render: (v: number) => <span style={{fontWeight:'bold', color:'red'}}>{Number(v).toLocaleString()}</span>
        },
        { 
            title: 'Giá bán', dataIndex: 'base_price', width: 100, align: 'right' as const,
            render: (v: number) => <span style={{fontWeight:'bold', color:'green'}}>{Number(v).toLocaleString()}</span>
        },
        { 
            title: 'Tồn kho', dataIndex: 'quantity_in_stock', width: 80, align: 'right' as const,
            render: (v: number) => <Badge count={v} showZero overflowCount={999} style={{ backgroundColor: v > 0 ? '#52c41a' : '#faad14' }} />
        },
        { 
            title: '', key: 'action', width: 120, align: 'center' as const,
            render: (_:any, r:any) => (
                <Space size="small">
                    <Tooltip title="Tính Giá Vốn"><Button icon={<DollarOutlined />} size="small" onClick={() => handleCalculateCost(r.sku)} type="primary" ghost /></Tooltip>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
                </Space>
            )
        }
    ];

    const filteredData = data.filter(d => {
        const textMatch = d.name?.toLowerCase().includes(searchText.toLowerCase()) || d.sku?.toLowerCase().includes(searchText.toLowerCase());
        const categoryMatch = selectedCategory === undefined || d.category_id === selectedCategory;
        return textMatch && categoryMatch;
    });

    return (
        <Card title="Quản Lý Sản Phẩm (SKU)" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true); setActiveTab('1')}}>Thêm Mới</Button>}>
            
            <div style={{marginBottom: 16, display: 'flex', gap: 16}}>
                <Input 
                    placeholder="Tìm kiếm SKU/Tên..." 
                    prefix={<SearchOutlined />} 
                    value={searchText} 
                    onChange={e => setSearchText(e.target.value)} 
                    style={{maxWidth: 300}}
                />
                <Select 
                    placeholder="Lọc theo Phân loại" 
                    allowClear
                    style={{minWidth: 200}}
                    onChange={setSelectedCategory}
                    options={categories.map(c => ({ label: c.name, value: c.id }))}
                />
            </div>
            
            <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} size="small" />
            
            <Modal title={editingItem ? `Cập nhật: ${editingItem.sku}` : "Thêm Sản Phẩm Mới"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>{ if(activeTab==='1') form.submit(); else message.warning('Vui lòng lưu thông tin chung trước') }} width={1200} okText="Lưu Thông Tin Chung">
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: '1', label: <span><BuildOutlined /> Thông Tin Chung</span>,
                        children: (
                            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ is_active: true, profit_margin: 30 }}>
                                {/* Đây là nơi bạn cần tạo ProductForm.tsx và nhúng vào */}
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item name="sku" label="Mã Sản Phẩm (SKU)" rules={[{required:true}]}><Input/></Form.Item>
                                        <Form.Item name="name" label="Tên Sản Phẩm" rules={[{required:true}]}><Input/></Form.Item>
                                        <Row gutter={16}>
                                            <Col span={12}><Form.Item name="unit" label="ĐVT"><Input/></Form.Item></Col>
                                            <Col span={12}><Form.Item name="is_active" label="Trạng thái"><Select><Option value={true}>Hoạt động</Option><Option value={false}>Ngừng bán</Option></Select></Form.Item></Col>
                                        </Row>
                                        <Form.Item name="category_id" label="Phân loại"><Select showSearch optionFilterProp="children" options={categories.map(c => ({ label: c.name, value: c.id }))} /></Form.Item>
                                    </Col>
                                    
                                    <Col span={8}>
                                        <Divider orientation="left">Thông tin Giá & Tồn</Divider>
                                        <Form.Item name="base_price" label="Giá bán (Chưa KM)"><InputNumber style={{width:'100%'}} addonAfter="₫" formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Form.Item>
                                        <Form.Item name="cost_price" label="Giá vốn (Hệ thống tính)" tooltip="Hệ thống tính tự động, không cần nhập"><InputNumber style={{width:'100%'}} addonAfter="₫" disabled/></Form.Item>
                                        <Form.Item name="profit_margin" label="Lợi nhuận mong muốn (%)" tooltip="Override Margin của danh mục (Ví dụ: 30)"><InputNumber style={{width:'100%'}} addonAfter="%" min={0} max={99}/></Form.Item>
                                        <Form.Item name="quantity_in_stock" label="Tồn kho"><InputNumber style={{width:'100%'}}/></Form.Item>
                                    </Col>
                                    
                                    <Col span={8}>
                                        <Divider orientation="left"><FileTextOutlined /> Mô tả & Thông tin chi tiết</Divider>
                                        <Form.Item name="customer_description" label="Mô tả Khách hàng/Bán hàng" tooltip="Hiển thị trên Báo giá, SO, Phiếu giao hàng">
                                            <TextArea rows={3} placeholder="Mô tả thương mại, chất liệu cơ bản, v.v."/>
                                        </Form.Item>
                                        <Form.Item name="processing_description" label="Mô tả Gia công/Sản xuất" tooltip="Hiển thị trên PO Gia công, Lệnh sản xuất">
                                            <TextArea rows={3} placeholder="Yêu cầu kỹ thuật, chi tiết may/cắt, v.v."/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        )
                    },
                    {
                        key: '2', label: <span><AppstoreOutlined /> BOM (Nguyên liệu)</span>,
                        disabled: !editingItem,
                        children: (
                            <ProductBOMTab
                                editingItem={editingItem}
                                boms={boms}
                                materials={materials}
                                fetchDetailData={fetchDetailData}
                                setBoms={setBoms}
                            />
                        )
                    },
                    {
                        key: '3', label: <span><ExperimentOutlined /> Quy Trình Gia Công</span>,
                        disabled: !editingItem,
                        children: (
                            <ProductRoutingTab
                                editingItem={editingItem}
                                routings={routings}
                                suppliers={suppliers}
                                processes={processes}
                                fetchDetailData={fetchDetailData}
                                setRoutings={setRoutings}
                            />
                        )
                    },
                    {
                        key: '4', label: <span><SendOutlined /> Logistics & Vận chuyển</span>,
                        disabled: !editingItem,
                        children: (
                            // Thay thế bằng ProductLogisticsTab
                            <div>Logistics Tab (Cần tạo component riêng)</div>
                        )
                    },
                    {
                        key: '5', label: <span><LinkOutlined /> Combo/Thành phần</span>,
                        disabled: !editingItem,
                        children: (
                            // Thay thế bằng ProductComponentTab
                            <div>Combo Tab (Cần tạo component riêng)</div>
                        )
                    }
                ]} />
                
                {editingItem && activeTab !== '1' && (
                    <div style={{ position: 'absolute', bottom: 10, right: 24 }}>
                        <Button type="default" onClick={() => handleCalculateCost(editingItem.sku)} icon={<SyncOutlined />}>
                            Tính lại Giá Vốn
                        </Button>
                    </div>
                )}
            </Modal>
        </Card>
    );
};
export default ProductsPage;