import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm, Row, Col, Divider, Tabs, InputNumber, Tooltip, Space, Badge, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined, ExperimentOutlined, AppstoreOutlined, BuildOutlined, SettingOutlined, SyncOutlined, LinkOutlined, TagOutlined, FileTextOutlined, SendOutlined, ForkOutlined, ScissorOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

// --- IMPORTS CÁC COMPONENT ĐÃ TÁCH ---
import ProductBOMTab from '../components/products/ProductBOMTab';
import ProductRoutingTab from '../components/products/ProductRoutingTab';
import ProductVariantsTab from '../components/products/ProductVariantsTab'; 
import ProductPatternTab from '../components/products/ProductPatternTab'; // <--- MỚI: Tab Sơ đồ rập
// -------------------------------------

const { TextArea } = Input;
const { Option } = Select;

const ProductsPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('1'); 
    
    // Variant State
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [baseProductForVariant, setBaseProductForVariant] = useState<any>(null);

    // Master Data
    const [categories, setCategories] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]); 
    const [suppliers, setSuppliers] = useState<any[]>([]); 
    const [processes, setProcesses] = useState<any[]>([]); 

    // Sub-data State 
    const [boms, setBoms] = useState<any[]>([]);
    const [routings, setRoutings] = useState<any[]>([]);
    const [logistics, setLogistics] = useState<any[]>([]);
    const [components, setComponents] = useState<any[]>([]); 

    const [form] = Form.useForm();
    const [variantForm] = Form.useForm(); 

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
    
    // 2. Detail Data Fetcher
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
            let savedProduct: any; 

            if (editingItem) {
                // Cập nhật sản phẩm
                await axios.put(`${API_URL}/products/${editingItem.id}`, payload);
                message.success('Đã lưu thành công'); 
                setIsModalOpen(false); 
                fetchData();
            } else {
                // TẠO MỚI SẢN PHẨM (FIX: Nhận ID để xử lý các bước tiếp theo)
                const res = await axios.post(`${API_URL}/products`, payload);
                savedProduct = res.data; 
                
                message.success('Đã tạo sản phẩm mới thành công. Vui lòng thiết lập BOM/Quy trình.'); 
                
                setEditingItem(savedProduct); 
                form.setFieldsValue(savedProduct);
                setActiveTab('2'); // Chuyển sang Tab BOM
                
                fetchDetailData(savedProduct.id); 
                fetchData(); 
            }
            
        } catch(e) { message.error('Lỗi lưu'); }
    };

    const handleDelete = async (id: number) => {
        try { await axios.delete(`${API_URL}/products/${id}`); message.success('Đã xóa'); fetchData(); } 
        catch(e) { message.error('Lỗi xóa'); }
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        
        // Logic Lợi nhuận mong muốn theo Danh mục (Fix)
        let initialProfitMargin = 30; 
        if (item.category_id) {
            const category = categories.find(c => c.id === item.category_id);
            if (category && category.profit_margin !== undefined) {
                initialProfitMargin = category.profit_margin;
            }
        }

        const initialValues = {
            ...item,
            profit_margin: item.profit_margin !== undefined ? item.profit_margin : initialProfitMargin, 
        };
        
        form.setFieldsValue(initialValues);
        setActiveTab('1');
        setIsModalOpen(true);
        fetchDetailData(item.id);
    };
    
    const openCreateVariant = (item: any) => {
        setBaseProductForVariant(item);
        variantForm.resetFields();
        variantForm.setFieldsValue({
            base_sku: item.sku,
            base_name: item.name,
        });
        setIsVariantModalOpen(true);
    }
    
    const handleCreateVariant = async (values: any) => {
        // Lấy thêm Logo và Design từ form tạo biến thể
        const { base_sku, variant_sku_suffix, variant_name_suffix, color, size, logo, design, ...otherValues } = values;

        const newSku = `${base_sku}_${variant_sku_suffix}`;
        const newName = `${baseProductForVariant.name} ${variant_name_suffix}`;
        
        const payload = {
            baseSku: base_sku,
            newSku: newSku,
            newName: newName,
            attributes: {
                color: color,
                size: size,
                logo: logo,     
                design: design, 
            }
        };
        
        try {
            await axios.post(`${API_URL}/products/create-variant`, payload); 
            message.success(`Đã tạo biến thể mới: ${newSku}`); 
            setIsVariantModalOpen(false);
            fetchData();
        } catch(e) {
            let errorMessage = "Đã xảy ra lỗi không xác định.";
            if (axios.isAxiosError(e)) {
                errorMessage = e.response?.data?.message || e.message;
            } else if (e instanceof Error) {
                errorMessage = e.message;
            }
            message.error(`Lỗi tạo biến thể: ${errorMessage}`);
        }
    }

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

    // --- LOGIC LỌC DỮ LIỆU ---
    const filteredData = useMemo(() => {
        if (!searchText) return data;
        const lower = searchText.toLowerCase();
        return data.filter(d => 
            (d.name && d.name.toLowerCase().includes(lower)) || 
            (d.sku && d.sku.toLowerCase().includes(lower))
        );
    }, [data, searchText]);

    const columns = [
        { 
            title: 'Mã (SKU)', dataIndex: 'sku', width: 120, render: (t:any) => <b>{t}</b>,
            sorter: (a: any, b: any) => (a.sku || '').localeCompare(b.sku || '')
        },
        { 
            title: 'Tên Sản Phẩm', 
            dataIndex: 'name', 
            render: (t:any) => (
                <Space size={4}>
                    <TagOutlined /> 
                    {t}
                </Space>
            ),
            sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || '')
        },
        { 
            title: 'Phân loại', 
            dataIndex: 'category_id', 
            width: 150, 
            render: (id: number) => <Tag color="blue">{getCategoryName(id)}</Tag>,
            filters: categories.map(c => ({ text: c.name, value: c.id })),
            onFilter: (value: any, record: any) => record.category_id === value,
        },
        { 
            title: 'Giá vốn', dataIndex: 'cost_price', width: 100, align: 'right' as const,
            render: (v: number) => <span style={{fontWeight:'bold', color:'red'}}>{Number(v).toLocaleString()}</span>,
            sorter: (a: any, b: any) => Number(a.cost_price) - Number(b.cost_price)
        },
        { 
            title: 'Giá bán', dataIndex: 'base_price', width: 100, align: 'right' as const,
            render: (v: number) => <span style={{fontWeight:'bold', color:'green'}}>{Number(v).toLocaleString()}</span>,
            sorter: (a: any, b: any) => Number(a.base_price) - Number(b.base_price)
        },
        { 
            title: 'Tồn kho', dataIndex: 'quantity_in_stock', width: 80, align: 'right' as const,
            render: (v: number) => <Badge count={v} showZero overflowCount={999} style={{ backgroundColor: v > 0 ? '#52c41a' : '#faad14' }} />,
            sorter: (a: any, b: any) => Number(a.quantity_in_stock) - Number(b.quantity_in_stock)
        },
        { 
            title: '', key: 'action', width: 160, align: 'center' as const,
            render: (_:any, r:any) => (
                <Space size="small">
                    <Tooltip title="Tạo Biến thể mới từ Sản phẩm này">
                         <Button 
                             icon={<ForkOutlined />} 
                             size="small" 
                             type="default" 
                             onClick={() => openCreateVariant(r)}
                         />
                    </Tooltip>
                    <Tooltip title="Tính Giá Vốn"><Button icon={<DollarOutlined />} size="small" onClick={() => handleCalculateCost(r.sku)} type="primary" ghost /></Tooltip>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
                </Space>
            )
        }
    ];

    const handleFormValuesChange = (changedValues: any) => {
        if (changedValues.category_id !== undefined) {
            const newCategoryId = changedValues.category_id;
            const category = categories.find(c => c.id === newCategoryId);
            
            if (category && category.profit_margin !== undefined) {
                if (form.getFieldValue('profit_margin') !== category.profit_margin) {
                    form.setFieldsValue({ profit_margin: category.profit_margin });
                }
            } else {
                form.setFieldsValue({ profit_margin: 30 }); 
            }
        }
    };

    return (
        <Card 
            title="Quản Lý Sản Phẩm (SKU)" 
            extra={
                <Space>
                    <Input 
                        placeholder="Tìm kiếm SKU/Tên..." 
                        prefix={<SearchOutlined />} 
                        value={searchText} 
                        onChange={e => setSearchText(e.target.value)} 
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true); setActiveTab('1')}}>Thêm Mới</Button>
                </Space>
            }
        >
            <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} size="small" />
            
            {/* Modal chính (Cập nhật sản phẩm) */}
            <Modal title={editingItem ? `Cập nhật: ${editingItem.sku}` : "Thêm Sản Phẩm Mới"} 
                   open={isModalOpen} 
                   onCancel={()=>setIsModalOpen(false)} 
                   onOk={()=>{ 
                       if(activeTab==='1') {
                           form.submit();
                       } else {
                           setIsModalOpen(false);
                       }
                   }} 
                   width={1400} 
                   okText={editingItem ? "Lưu Thông Tin Chung" : "Tạo Sản Phẩm & Tiếp tục"} 
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: '1', label: <span><BuildOutlined /> Thông Tin Chung</span>,
                        children: (
                            <Form 
                                form={form} 
                                layout="vertical" 
                                onFinish={handleSave} 
                                initialValues={{ is_active: true }}
                                onValuesChange={handleFormValuesChange} 
                            >
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
                                        
                                        <Form.Item name="cost_price" label="Giá vốn (Hệ thống tính)" tooltip="Hệ thống tính tự động (BOM + Gia công). Click refresh để tính lại.">
                                            <InputNumber 
                                                style={{width:'100%'}} 
                                                addonAfter={<Tooltip title="Tính lại Giá vốn (BOM + Gia công)"><SyncOutlined onClick={() => handleCalculateCost(form.getFieldValue('sku'))} style={{cursor: 'pointer'}}/></Tooltip>}
                                                formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
                                                disabled
                                            />
                                        </Form.Item>
                                        
                                        <Form.Item name="profit_margin" label="Lợi nhuận mong muốn (%)" tooltip="Lấy từ Danh mục nếu tạo mới, có thể override tại đây"><InputNumber style={{width:'100%'}} addonAfter="%" min={0} max={99}/></Form.Item>
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
                        key: '7', label: <span><ScissorOutlined /> Sơ đồ & Định mức</span>,
                        disabled: !editingItem,
                        children: (
                            <ProductPatternTab editingItem={editingItem} />
                        )
                    },
                    {
                        key: '4', label: <span><SendOutlined /> Logistics & Vận chuyển</span>,
                        disabled: !editingItem,
                        children: (
                            <div>Logistics Tab (Cần tạo component riêng)</div>
                        )
                    },
                    {
                        key: '5', label: <span><LinkOutlined /> Combo/Thành phần</span>,
                        disabled: !editingItem,
                        children: (
                            <div >Combo Tab (Cần tạo component riêng)</div>
                        )
                    },
                    {
                        key: '6', 
                        label: <span><SyncOutlined /> Quản lý Biến thể</span>,
                        disabled: !editingItem,
                        children: (
                            <ProductVariantsTab
                                editingItem={editingItem}
                                data={data} 
                                fetchData={fetchData}
                                fetchDetailData={fetchDetailData}
                            />
                        )
                    }
                ]} />
            </Modal>
            
            {/* Modal Tạo Biến thể */}
            <Modal
                title={`Tạo Biến thể mới từ ${baseProductForVariant?.sku}`}
                open={isVariantModalOpen}
                onCancel={() => setIsVariantModalOpen(false)}
                okText="Tạo & Sao chép BOM"
                onOk={() => variantForm.submit()}
                destroyOnClose={true}
                width={800} 
            >
                <Form form={variantForm} layout="vertical" onFinish={handleCreateVariant} initialValues={{ base_sku: baseProductForVariant?.sku }}>
                    <Form.Item name="base_sku" label="SKU Gốc" ><Input disabled /></Form.Item>
                    <Divider />
                    
                    <Row gutter={16}>
                        <Col span={12}>
                             <Form.Item name="variant_sku_suffix" label="Hậu tố SKU Biến thể" rules={[{required: true, message: 'Nhập hậu tố SKU (VD: RED)'}]}>
                                <Input addonBefore={baseProductForVariant?.sku} addonAfter='_' placeholder="VD: RED, L" /> 
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="variant_name_suffix" label="Hậu tố Tên Biến thể">
                                <Input addonBefore={baseProductForVariant?.name + ' '} placeholder="VD: Đỏ, Size L" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Thuộc tính Biến thể</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="color" label="Màu sắc (Color)">
                                <Input placeholder="VD: Đỏ, Xanh Navy" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="size" label="Kích thước (Size)">
                                <Input placeholder="VD: L, 40x60cm" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* --- MỚI: Bổ sung Logo và Design --- */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="logo" label="Logo (Hình in/Thêu)">
                                <Input placeholder="VD: Logo ngực trái, In Pet" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="design" label="Design (Thiết kế)">
                                <Input placeholder="VD: Mẫu A, Hình in rồng" />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* ----------------------------------- */}
                </Form>
            </Modal>
        </Card>
    );
};
export default ProductsPage;