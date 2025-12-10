import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Drawer, List, Row, Col, Statistic, Tabs, Checkbox, Tooltip, Alert, Typography } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, AppstoreAddOutlined, SaveOutlined, CalculatorOutlined, CopyOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const { Text } = Typography;

const ProductsPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // State UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Data Options
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState<any[]>([]); 

  // Combo State
  const [comboDrawerOpen, setComboDrawerOpen] = useState(false);
  const [currentComboSku, setCurrentComboSku] = useState('');
  const [comboItems, setComboItems] = useState([]);
  const [childSku, setChildSku] = useState('');
  const [childQty, setChildQty] = useState(1);

  // Watch Form de tinh toan realtime
  const [form] = Form.useForm();
  // Theo doi su thay doi cua field 'boms' de tinh tong tien
  const bomValues = Form.useWatch('boms', form);

  // --- 1. LOAD DU LIEU ---
  const fetchData = async () => {
    setLoading(true);
    try { 
      const res = await axios.get(`${API_URL}/products`);
      const products = Array.isArray(res.data) ? res.data : [];
      
      const resSupp = await axios.get(`${API_URL}/suppliers`);
      setSuppliers(resSupp.data.map((s:any) => ({label: s.name, value: s.id, type: s.type})));

      const resMat = await axios.get(`${API_URL}/materials`);
      // Luu full object material de lay gia va DVT
      setMaterials(resMat.data.map((m:any) => ({
          label: `${m.name} (${m.code})`, 
          value: m.id, 
          unit: m.unit, 
          price: Number(m.cost_per_unit) || 0
      })));

      // Grouping Logic
      const groups: any = {};
      products.forEach((p: any) => {
          const groupKey = `${p.name}-${p.category}`;
          if (!groups[groupKey]) {
              groups[groupKey] = { key: 'group_' + groupKey, isGroup: true, name: p.name, category: p.category, children: [], totalStock: 0, minPrice: Infinity, maxPrice: -Infinity };
          }
          const price = Number(p.base_price) || 0;
          groups[groupKey].totalStock += (Number(p.quantity_in_stock) || 0);
          if (price < groups[groupKey].minPrice) groups[groupKey].minPrice = price;
          if (price > groups[groupKey].maxPrice) groups[groupKey].maxPrice = price;
          groups[groupKey].children.push({ ...p, key: p.id });
      });
      const tree = Object.values(groups).map((g: any) => {
          if (g.minPrice === Infinity) g.minPrice = 0;
          if (g.maxPrice === -Infinity) g.maxPrice = 0;
          return g;
      });
      setTreeData(tree);
    } catch (e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. LOGIC TINH TONG TIEN BOM (REALTIME) ---
  const calculateBomTotal = () => {
      if (!bomValues || !Array.isArray(bomValues)) return 0;
      return bomValues.reduce((sum, item) => {
          if (!item?.material_id) return sum;
          const mat = materials.find(m => m.value === item.material_id);
          const price = mat ? mat.price : 0;
          const qty = Number(item.quantity) || 0;
          const waste = Number(item.waste_percent) || 0;
          // Cong thuc: SL * Gia * (1 + Hao hut%)
          return sum + (qty * price * (1 + waste/100));
      }, 0);
  };

  // --- 3. CRUD ---
  const handleSaveProduct = async (values: any) => {
    try {
      const payload = {
          ...values,
          attributes: { color: values.color, size: values.size, fabric: values.fabric },
          base_price: Number(values.base_price) || 0,
          quantity_in_stock: Number(values.quantity_in_stock) || 0
      };
      if (editingItem) await axios.put(`${API_URL}/products/${editingItem.id}`, payload);
      else await axios.post(`${API_URL}/products`, payload);
      message.success('Lưu thành công'); setIsModalOpen(false); fetchData();
    } catch (e) { message.error('Lỗi lưu'); }
  };

  const handleSaveBoms = async () => {
      if(!editingItem) return;
      try {
          await axios.post(`${API_URL}/products/${editingItem.id}/boms`, form.getFieldValue('boms'));
          message.success('Đã lưu BOM');
          // Tu dong tinh lai gia von sau khi luu BOM
          handleCalculateCost();
      } catch(e) { message.error('Lỗi lưu BOM'); }
  };

  const handleSaveRouting = async () => {
      if(!editingItem) return;
      try {
          await axios.post(`${API_URL}/products/${editingItem.id}/routings`, form.getFieldValue('routings'));
          message.success('Đã lưu quy trình');
          handleCalculateCost();
      } catch(e) { message.error('Lỗi lưu routing'); }
  };

  const handleSyncVariants = async () => {
      if(!editingItem) return;
      Modal.confirm({
          title: 'Đồng bộ dữ liệu?',
          content: `Sao chép BOM & Quy trình từ "${editingItem.sku}" sang tất cả các màu khác cùng loại?`,
          onOk: async () => {
              try {
                  const res = await axios.post(`${API_URL}/products/${editingItem.id}/sync-variants`);
                  message.success(res.data.message);
              } catch(e) { message.error('Lỗi đồng bộ'); }
          }
      });
  };

  const handleCalculateCost = async () => {
      if(!editingItem) return;
      try {
          const res = await axios.get(`${API_URL}/products/calculate-cost/${editingItem.sku}`);
          message.success(`Giá vốn cập nhật: ${Number(res.data.new_cost_price).toLocaleString()} đ`);
          fetchData();
      } catch(e) { message.error('Lỗi tính toán'); }
  };

  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API_URL}/products/${id}`); fetchData(); } catch (e) { message.error('Lỗi xóa'); }
  };

  // Combo logic
  const openComboConfig = (sku: string) => { setCurrentComboSku(sku); setComboDrawerOpen(true); loadComboItems(sku); };
  const loadComboItems = async (sku: string) => { try { const res = await axios.get(`${API_URL}/products/combo/${sku}`); setComboItems(Array.isArray(res.data) ? res.data : []); } catch (e) { setComboItems([]); } };
  const addComboItem = async () => { try { await axios.post(`${API_URL}/products/combo/add`, { parentSku: currentComboSku, childSku, qty: childQty }); message.success('Đã thêm'); loadComboItems(currentComboSku); } catch(e) { message.error('Lỗi (Kiểm tra mã SKU con)'); } };
  const removeComboItem = async (id: number) => { await axios.delete(`${API_URL}/products/combo/item/${id}`); loadComboItems(currentComboSku); };


  const openEditModal = (r: any) => {
      setEditingItem(r);
      form.setFieldsValue({
          ...r,
          color: r.attributes?.color, size: r.attributes?.size, fabric: r.attributes?.fabric
      });
      
      setTimeout(async () => {
          try {
             // Load BOM
             const resBom = await axios.get(`${API_URL}/products/${r.sku}/boms`);
             form.setFieldValue('boms', resBom.data);

             // Load Routing
             const resRoute = await axios.get(`${API_URL}/products/${r.id}/routings`);
             const defaultRouting = [
                { step_name: '1. Nối vải', is_required: false, cost: 0 },
                { step_name: '2. Chần gòn', is_required: true, cost: 0 },
                { step_name: '3. May thành phẩm', is_required: true, cost: 0 },
                { step_name: '4. Đóng gói', is_required: true, cost: 0 }
             ];
             form.setFieldValue('routings', resRoute.data.length ? resRoute.data : defaultRouting);
          } catch(e) {}
      }, 200);
      setIsModalOpen(true);
  };

  // --- HELPER RENDER BOM ROW (Hien thi thong tin Readonly) ---
  const MaterialInfo = ({ matId, qty, waste }: any) => {
      const mat = materials.find(m => m.value === matId);
      if (!mat) return <span style={{color:'#ccc'}}>-</span>;
      
      const subTotal = (Number(qty)||0) * mat.price * (1 + (Number(waste)||0)/100);
      
      return (
          <Row gutter={8} style={{fontSize: 12, color: '#666', marginTop: 5}}>
              <Col span={6}><Tag color="orange">{mat.unit}</Tag></Col>
              <Col span={8} style={{textAlign:'right'}}>{mat.price.toLocaleString()} ₫</Col>
              <Col span={10} style={{textAlign:'right', fontWeight:'bold', color: '#1890ff'}}>
                  {subTotal.toLocaleString(undefined, {maximumFractionDigits:0})} ₫
              </Col>
          </Row>
      );
  };

  const columns = [
    { title: 'Sản Phẩm', dataIndex: 'name', key: 'name', render: (text:string, r:any) => r.isGroup ? <b>{text} <Tag>{r.children.length}</Tag></b> : <Space>{r.attributes?.color && <Tag color="magenta">{r.attributes.color}</Tag>} {text}</Space> },
    { title: 'SKU', dataIndex: 'sku', width: 150, render: (t:any, r:any) => r.isGroup ? '' : <b>{t}</b> },
    { title: 'Giá Bán', dataIndex: 'base_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? '' : Number(v).toLocaleString() },
    { title: 'Giá Vốn', dataIndex: 'cost_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? '' : <span style={{color:'red'}}>{Number(v).toLocaleString()}</span> },
    { title: '', key: 'action', width: 100, render: (_: any, r: any) => !r.isGroup && (
        <Space>
            {((r.category || '').toLowerCase().includes('combo') || (r.product_type || '').toLowerCase().includes('bộ')) && (
               <Button icon={<AppstoreAddOutlined />} size="small" type="dashed" onClick={() => openComboConfig(r.sku || '')} title="Combo" />
            )}
            <Button icon={<EditOutlined />} onClick={() => openEditModal(r)} />
            <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} danger /></Popconfirm>
        </Space>
    ) },
  ];

  const modalContent = (
      <Tabs defaultActiveKey="1" items={[
          {
              key: '1', label: 'Thông tin',
              children: (
                  <>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="name" label="Tên SP"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="sku" label="SKU"><Input disabled={!!editingItem} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}><Col span={8}><Form.Item name="color" label="Màu"><Input /></Form.Item></Col><Col span={8}><Form.Item name="size" label="Size"><Input /></Form.Item></Col><Col span={8}><Form.Item name="base_price" label="Giá Bán"><InputNumber style={{width:'100%'}} /></Form.Item></Col></Row>
                    <div style={{textAlign:'right'}}><Button type="primary" onClick={() => form.submit()} icon={<SaveOutlined />}>Lưu Thông Tin</Button></div>
                  </>
              )
          },
          {
              key: '2', label: 'BOM & Định Mức',
              children: (
                  <>
                    {/* HEADER */}
                    <Row gutter={8} style={{background: '#fafafa', padding: '8px 0', fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: 10}}>
                        <Col span={8}>Nguyên Liệu</Col>
                        <Col span={4}>Định mức</Col>
                        <Col span={4}>% Hao hụt</Col>
                        <Col span={8} style={{textAlign:'center'}}>ĐVT | Giá | Thành tiền</Col>
                    </Row>

                    <Form.List name="boms">
                        {(fields, { add, remove }) => (
                            <div style={{maxHeight: 400, overflowY: 'auto'}}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{marginBottom: 10, borderBottom:'1px dashed #eee', paddingBottom: 5}}>
                                        <Row gutter={8} align="top">
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'material_id']} noStyle rules={[{ required: true, message: 'Chọn NPL' }]}>
                                                    <Select placeholder="Chọn Nguyên Liệu..." showSearch optionFilterProp="label" options={materials} style={{width:'100%'}} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                <Form.Item {...restField} name={[name, 'quantity']} noStyle><InputNumber placeholder="SL" style={{width:'100%'}} min={0} step={0.01} /></Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                <Form.Item {...restField} name={[name, 'waste_percent']} noStyle><InputNumber placeholder="%" style={{width:'100%'}} min={0} /></Form.Item>
                                            </Col>
                                            {/* COT HIEN THI THONG TIN (READ ONLY) */}
                                            <Col span={7}>
                                                <Form.Item shouldUpdate>
                                                    {() => (
                                                        <MaterialInfo 
                                                            matId={form.getFieldValue(['boms', name, 'material_id'])}
                                                            qty={form.getFieldValue(['boms', name, 'quantity'])}
                                                            waste={form.getFieldValue(['boms', name, 'waste_percent'])}
                                                        />
                                                    )}
                                                </Form.Item>
                                            </Col>
                                            <Col span={1}><MinusCircleOutlined onClick={() => remove(name)} style={{color:'red', marginTop: 8}} /></Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm nguyên liệu</Button>
                            </div>
                        )}
                    </Form.List>
                    
                    {/* FOOTER TONG CONG */}
                    <div style={{marginTop: 20, background: '#f6ffed', padding: 15, borderRadius: 8, border: '1px solid #b7eb8f', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <Space>
                            <Button type="primary" onClick={handleSaveBoms} icon={<SaveOutlined />}>Lưu & Tính Giá</Button>
                            <span style={{color: '#888'}}>* Giá vốn NPL tự động lấy từ NCC mặc định</span>
                        </Space>
                        <Statistic 
                            title="Tổng Giá Vốn Nguyên Liệu" 
                            value={calculateBomTotal()} 
                            precision={0} 
                            valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} 
                            suffix="₫" 
                        />
                    </div>
                  </>
              )
          },
          {
              key: '3', label: 'Quy Trình (Routing)',
              children: (
                  <>
                    <Alert message="Tích chọn các công đoạn cần thiết cho sản phẩm này" type="info" style={{marginBottom: 10}} />
                    <Form.List name="routings">
                        {(fields) => (
                            <div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{marginBottom: 8, background:'#f0f2f5', padding: '8px 5px', borderRadius: 4, borderLeft: '3px solid #1890ff'}}>
                                        <Col span={2} style={{textAlign:'center'}}>
                                            <Form.Item {...restField} name={[name, 'is_required']} valuePropName="checked" noStyle><Checkbox /></Form.Item>
                                        </Col>
                                        <Col span={8}><Form.Item {...restField} name={[name, 'step_name']} noStyle><span style={{fontWeight:500}}>{form.getFieldValue(['routings', name, 'step_name'])}</span></Form.Item></Col>
                                        <Col span={8}>
                                            <Form.Item {...restField} name={[name, 'supplier_id']} noStyle>
                                                <Select placeholder="Chọn Nhà Gia Công..." options={suppliers.filter((s:any)=>s.type!=='MATERIAL')} allowClear style={{width:'100%'}} bordered={false} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item {...restField} name={[name, 'cost']} noStyle>
                                                <InputNumber placeholder="Chi phí" style={{width:'100%'}} addonAfter="₫" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} bordered={false} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                ))}
                            </div>
                        )}
                    </Form.List>
                    <div style={{marginTop: 10}}><Button type="primary" onClick={handleSaveRouting} icon={<SaveOutlined />}>Lưu Quy Trình</Button></div>
                  </>
              )
          }
      ]} />
  );

  return (
    <div>
      <Card title="Quản lý Sản Phẩm"><Table columns={columns} dataSource={treeData} rowKey="key" loading={loading} bordered pagination={{ pageSize: 10 }} expandable={{ defaultExpandAllRows: true }} /></Card>
      <Modal title={editingItem ? `Chi tiết: ${editingItem.sku}` : "Thêm SP"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={1000}>
        <Form form={form} layout="vertical" onFinish={handleSaveProduct}>{modalContent}</Form>
        {editingItem && (
            <div style={{marginTop: 20, paddingTop: 10, borderTop: '1px dashed #ccc', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <Button type="dashed" icon={<CopyOutlined />} onClick={handleSyncVariants}>Áp dụng BOM & Quy trình cho tất cả biến thể cùng loại</Button>
                <Button type="primary" danger icon={<CalculatorOutlined />} onClick={handleCalculateCost}>Cập Nhật Giá Vốn Tổng Hợp</Button>
            </div>
        )}
      </Modal>

      <Drawer title={`Combo: ${currentComboSku}`} placement="right" width={400} onClose={() => setComboDrawerOpen(false)} open={comboDrawerOpen}>
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input placeholder="Mã SKU con" value={childSku} onChange={e => setChildSku(e.target.value)} />
            <InputNumber min={1} value={childQty} onChange={(v:any) => setChildQty(v)} />
            <Button type="primary" onClick={addComboItem}>+</Button>
          </Space.Compact>
          <List bordered dataSource={comboItems} renderItem={(item: any) => (<List.Item actions={[<a onClick={() => removeComboItem(item.id)}>Xóa</a>]}><List.Item.Meta title={item.child_product?.sku} description={'x '+item.quantity}/></List.Item>)} />
      </Drawer>
    </div>
  );
};
export default ProductsPage;