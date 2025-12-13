import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm, Row, Col, Divider, Tabs, InputNumber, Tooltip, Space, Badge, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined, ExperimentOutlined, AppstoreOutlined, BuildOutlined, SettingOutlined, SyncOutlined, LinkOutlined, TagOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

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
  
  // Data State
  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  const [suppliers, setSuppliers] = useState<any[]>([]); 
  const [processes, setProcesses] = useState<any[]>([]); 

  // Sub-data State (BOM, Routing, Logistics)
  const [boms, setBoms] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]); // For Combo

  const [form] = Form.useForm();
  const [bomForm] = Form.useForm();
  const [routingForm] = Form.useForm();
  const [logisticsForm] = Form.useForm();
  const [componentForm] = Form.useForm();


  // 1. Fetch Master Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/products`);
        setData(Array.isArray(res.data) ? res.data : []);
        
        const resCat = await axios.get(`${API_URL}/categories`);
        setCategories(Array.isArray(resCat.data) ? resCat.data : []);

        const resMat = await axios.get(`${API_URL}/materials`);
        setMaterials(Array.isArray(resMat.data) ? resMat.data : []);

        const resSup = await axios.get(`${API_URL}/suppliers`);
        setSuppliers(Array.isArray(resSup.data) ? resSup.data : []);
        
        const resProc = await axios.get(`${API_URL}/processes`);
        setProcesses(Array.isArray(resProc.data) ? resProc.data : []);
        
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  
  const getCategoryName = (id: number) => {
      return categories.find(c => c.id === id)?.name || 'N/A';
  }

  // 2. Detail Data Fetcher
  const fetchDetailData = async (id: number) => {
      if (!id) return;
      try {
          const res = await axios.get(`${API_URL}/products/${id}`);
          const product = res.data;
          
          // Load BOM
          const resBOM = await axios.get(`${API_URL}/products/${product.sku}/boms`);
          setBoms(resBOM.data || []);
          
          // Load Routings
          const resRouting = await axios.get(`${API_URL}/products/${id}/routings`);
          setRoutings(resRouting.data || []);

          // Load Logistics
          const resLogistics = await axios.get(`${API_URL}/products/${id}/logistics`);
          setLogistics(resLogistics.data || []);

          // Load Components (Combo)
          const resComp = await axios.get(`${API_URL}/products/combo/${product.sku}`);
          setComponents(resComp.data || []);

      } catch(e) { message.error('Lỗi tải chi tiết'); }
  };
  
  // 3. Main CRUD
  const handleSave = async (values: any) => {
      try {
          // Xử lý data attribute
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
      // Gán giá trị vào Form (Nếu attributes là JSON)
      const initialValues = {
          ...item,
          // Gán lại các thuộc tính nếu cần (ví dụ: item.attributes.color)
      };
      form.setFieldsValue(initialValues);
      setActiveTab('1');
      setIsModalOpen(true);
      fetchDetailData(item.id);
  };

  // 4. Sub-CRUD (BOM, Routing, Logistics)
  
  const handleSaveBOM = async () => {
      try {
          const values = await bomForm.validateFields();
          const items = [...boms, { ...values, id: Date.now() }]; // Tạm thêm vào list để hiển thị
          setBoms(items);
          await axios.post(`${API_URL}/products/${editingItem.id}/boms`, items);
          message.success('Đã lưu BOM');
          fetchDetailData(editingItem.id);
          bomForm.resetFields();
      } catch(e) { message.error('Lỗi lưu BOM'); }
  };
  
  const handleRemoveBOM = async (id: number) => {
      const updatedBoms = boms.filter(b => b.id !== id);
      setBoms(updatedBoms);
      await axios.post(`${API_URL}/products/${editingItem.id}/boms`, updatedBoms);
      message.success('Đã xóa BOM');
      fetchDetailData(editingItem.id);
  };

  const handleSaveRouting = async () => {
      try {
          const values = await routingForm.validateFields();
          const items = [...routings, { ...values, id: Date.now() }];
          setRoutings(items);
          await axios.post(`${API_URL}/products/${editingItem.id}/routings`, items);
          message.success('Đã lưu Quy trình');
          fetchDetailData(editingItem.id);
          routingForm.resetFields();
      } catch(e) { message.error('Lỗi lưu Quy trình'); }
  };
  
  const handleRemoveRouting = async (id: number) => {
      const updatedRoutings = routings.filter(r => r.id !== id);
      setRoutings(updatedRoutings);
      await axios.post(`${API_URL}/products/${editingItem.id}/routings`, updatedRoutings);
      message.success('Đã xóa Quy trình');
      fetchDetailData(editingItem.id);
  };

  const handleSaveLogistics = async () => {
      try {
          const values = await logisticsForm.validateFields();
          const items = [...logistics, { ...values, id: Date.now() }];
          setLogistics(items);
          await axios.post(`${API_URL}/products/${editingItem.id}/logistics`, items);
          message.success('Đã lưu Logistics');
          fetchDetailData(editingItem.id);
          logisticsForm.resetFields();
      } catch(e) { message.error('Lỗi lưu Logistics'); }
  };

  const handleRemoveLogistics = async (id: number) => {
      const updatedLogistics = logistics.filter(l => l.id !== id);
      setLogistics(updatedLogistics);
      await axios.post(`${API_URL}/products/${editingItem.id}/logistics`, updatedLogistics);
      message.success('Đã xóa Logistics');
      fetchDetailData(editingItem.id);
  };
  
  // Combo Logic (Simplified)
  const handleSaveComponent = async () => {
      try {
          const values = await componentForm.validateFields();
          const parentSku = editingItem.sku;
          const { childSku, quantity } = values;
          
          await axios.post(`${API_URL}/products/combo/add`, { parentSku, childSku, qty: Number(quantity) });
          message.success('Đã thêm thành phần Combo');
          fetchDetailData(editingItem.id);
          componentForm.resetFields();
      } catch(e) { message.error('Lỗi thêm Combo'); }
  };

  const handleRemoveComponent = async (id: number) => {
      try {
          await axios.delete(`${API_URL}/products/combo/item/${id}`);
          message.success('Đã xóa thành phần Combo');
          fetchDetailData(editingItem.id);
      } catch(e) { message.error('Lỗi xóa Combo'); }
  };

  // 5. Cost Price Calculation
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

  // 6. Table Definitions

  const bomColumns = [
      { title: 'Mã NPL', dataIndex: 'material_id', render: (id: number) => materials.find(m => m.id === id)?.label.split(' - ')[0] || '-' },
      { title: 'Tên NPL', dataIndex: 'material_id', render: (id: number) => materials.find(m => m.id === id)?.label.split(' - ')[1] || '-' },
      { title: 'SL', dataIndex: 'quantity', width: 70, align: 'right' as const },
      { title: 'Hao hụt (%)', dataIndex: 'waste_percent', width: 90, align: 'right' as const },
      { title: '', key: 'action', width: 70, align: 'center' as const, render: (r:any) => (<Popconfirm title="Xóa?" onConfirm={() => handleRemoveBOM(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>) },
  ];

  const routingColumns = [
      { title: 'Công đoạn', dataIndex: 'step_name' },
      { title: 'NCC', dataIndex: 'supplier_id', render: (id: number) => suppliers.find(s => s.id === id)?.name || '-' },
      { title: 'Bắt buộc', dataIndex: 'is_required', render: (val: boolean) => val ? <Tag color="green">Có</Tag> : <Tag color="red">Không</Tag> },
      { title: 'Chi phí', dataIndex: 'cost', width: 100, align: 'right' as const, render: (v: number) => v.toLocaleString() },
      { title: '', key: 'action', width: 70, align: 'center' as const, render: (r:any) => (<Popconfirm title="Xóa?" onConfirm={() => handleRemoveRouting(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>) },
  ];

  const logisticsColumns = [
      { title: 'Tuyến đường', dataIndex: 'route_name' },
      { title: 'Chi phí', dataIndex: 'cost', width: 100, align: 'right' as const, render: (v: number) => v.toLocaleString() },
      { title: '', key: 'action', width: 70, align: 'center' as const, render: (r:any) => (<Popconfirm title="Xóa?" onConfirm={() => handleRemoveLogistics(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>) },
  ];

  const componentColumns = [
      { title: 'Mã SP con', render: (r:any) => r.child_product?.sku || '-' },
      { title: 'Tên SP con', render: (r:any) => r.child_product?.name || '-' },
      { title: 'Số lượng', dataIndex: 'quantity', width: 100, align: 'right' as const },
      { title: '', key: 'action', width: 70, align: 'center' as const, render: (r:any) => (<Popconfirm title="Xóa?" onConfirm={() => handleRemoveComponent(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>) },
  ];


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

  const filteredData = data.filter(d => d.name?.toLowerCase().includes(searchText.toLowerCase()) || d.sku?.toLowerCase().includes(searchText.toLowerCase()));

  // Lọc danh sách sản phẩm cho Combo
  const productOptions = useMemo(() => {
      return data.map(p => ({ label: `${p.sku} - ${p.name}`, value: p.sku }));
  }, [data]);

  return (
    <Card title="Quản Lý Sản Phẩm (SKU)" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true); setActiveTab('1')}}>Thêm Mới</Button>}>
        <div style={{marginBottom: 16, maxWidth: 400}}><Input placeholder="Tìm kiếm SKU/Tên..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} /></div>
        <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} size="small" />
        
        {/* MODAL EDIT */}
        <Modal title={editingItem ? `Cập nhật: ${editingItem.sku}` : "Thêm Sản Phẩm Mới"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>{ if(activeTab==='1') form.submit(); else message.warning('Vui lòng lưu thông tin chung trước') }} width={1200} okText="Lưu Thông Tin Chung">
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: '1', label: <span><BuildOutlined /> Thông Tin Chung</span>,
                    children: (
                        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ is_active: true }}>
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
                                    
                                    {/* --- FIX: FIELD MÔ TẢ KHÁCH HÀNG --- */}
                                    <Form.Item name="customer_description" label="Mô tả Khách hàng/Bán hàng" tooltip="Hiển thị trên Báo giá, SO, Phiếu giao hàng">
                                        <TextArea rows={3} placeholder="Mô tả thương mại, chất liệu cơ bản, v.v."/>
                                    </Form.Item>
                                    
                                    {/* --- FIX: FIELD MÔ TẢ GIA CÔNG --- */}
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
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card title="Thêm NPL" size="small">
                                    <Form form={bomForm} layout="vertical" onFinish={handleSaveBOM}>
                                        <Form.Item name="material_id" label="Nguyên Vật Liệu" rules={[{required:true}]}>
                                            <Select showSearch options={materials} optionFilterProp="label" placeholder="Chọn NPL..." />
                                        </Form.Item>
                                        <Row gutter={8}>
                                            <Col span={12}><Form.Item name="quantity" label="Số lượng" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} /></Form.Item></Col>
                                            <Col span={12}><Form.Item name="waste_percent" label="Hao hụt (%)"><InputNumber style={{width:'100%'}} min={0} max={100}/></Form.Item></Col>
                                        </Row>
                                        <Button type="primary" htmlType="submit" block><PlusOutlined /> Thêm</Button>
                                    </Form>
                                </Card>
                            </Col>
                            <Col span={16}>
                                <Table dataSource={boms} columns={bomColumns} rowKey="id" pagination={false} size="small" bordered />
                            </Col>
                        </Row>
                    )
                },
                {
                    key: '3', label: <span><ExperimentOutlined /> Quy Trình Gia Công</span>,
                    disabled: !editingItem,
                    children: (
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card title="Thêm Công Đoạn" size="small">
                                    <Form form={routingForm} layout="vertical" onFinish={handleSaveRouting}>
                                        <Form.Item name="step_name" label="Tên Công Đoạn" rules={[{required:true}]}><Input/></Form.Item>
                                        <Form.Item name="process_id" label="Loại Công Đoạn">
                                            <Select options={processes} placeholder="VD: May, Ủi, Đóng gói..." />
                                        </Form.Item>
                                        <Form.Item name="supplier_id" label="Nhà Gia Công">
                                            <Select showSearch options={suppliers.filter(s => s.type !== 'MATERIAL').map(s => ({label: s.name, value: s.id}))} placeholder="Chọn NCC/Xưởng GC"/>
                                        </Form.Item>
                                        <Form.Item name="cost" label="Chi phí (₫)" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} addonAfter="₫"/></Form.Item>
                                        <Form.Item name="is_required" valuePropName="checked">
                                            <Checkbox>Công đoạn bắt buộc (Tính vào giá vốn)</Checkbox>
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit" block><PlusOutlined /> Thêm</Button>
                                    </Form>
                                </Card>
                            </Col>
                            <Col span={16}>
                                <Table dataSource={routings} columns={routingColumns} rowKey="id" pagination={false} size="small" bordered />
                            </Col>
                        </Row>
                    )
                },
                {
                    key: '4', label: <span><SendOutlined /> Logistics & Vận chuyển</span>,
                    disabled: !editingItem,
                    children: (
                        <Row gutter={16}>
                             <Col span={8}>
                                <Card title="Thêm Chi Phí Vận Chuyển" size="small">
                                    <Form form={logisticsForm} layout="vertical" onFinish={handleSaveLogistics}>
                                        <Form.Item name="route_name" label="Tuyến Đường" rules={[{required:true}]}><Input placeholder="VD: Kho->Xưởng May->Kho"/></Form.Item>
                                        <Form.Item name="cost" label="Chi phí ước tính (₫/SP)" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} addonAfter="₫"/></Form.Item>
                                        <Form.Item name="note" label="Ghi chú"><TextArea rows={2}/></Form.Item>
                                        <Button type="primary" htmlType="submit" block><PlusOutlined /> Thêm</Button>
                                    </Form>
                                </Card>
                            </Col>
                            <Col span={16}>
                                <Table dataSource={logistics} columns={logisticsColumns} rowKey="id" pagination={false} size="small" bordered />
                            </Col>
                        </Row>
                    )
                },
                {
                    key: '5', label: <span><LinkOutlined /> Combo/Thành phần</span>,
                    disabled: !editingItem,
                    children: (
                         <Row gutter={16}>
                             <Col span={8}>
                                <Card title="Thêm Sản Phẩm Con" size="small">
                                    <Form form={componentForm} layout="vertical" onFinish={handleSaveComponent}>
                                        <Form.Item name="childSku" label="Mã SP con" rules={[{required:true}]}>
                                            <Select showSearch options={productOptions} optionFilterProp="label" placeholder="Chọn SKU thành phần..." />
                                        </Form.Item>
                                        <Form.Item name="quantity" label="Số lượng" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={1}/></Form.Item>
                                        <Button type="primary" htmlType="submit" block><PlusOutlined /> Thêm</Button>
                                    </Form>
                                </Card>
                            </Col>
                            <Col span={16}>
                                <Table dataSource={components} columns={componentColumns} rowKey="id" pagination={false} size="small" bordered />
                            </Col>
                        </Row>
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