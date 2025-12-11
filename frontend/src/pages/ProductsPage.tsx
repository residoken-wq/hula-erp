import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Space, Drawer, List, Row, Col, Statistic, Tabs, Checkbox, Typography, Divider, Tooltip } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CopyOutlined, MinusCircleOutlined, SearchOutlined, FilterOutlined, AppstoreAddOutlined, BuildOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const { Text } = Typography;

const ProductsPage: React.FC = () => {
  const [rawList, setRawList] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState<any[]>([]); 

  const [comboDrawerOpen, setComboDrawerOpen] = useState(false);
  const [currentComboSku, setCurrentComboSku] = useState('');
  const [comboItems, setComboItems] = useState([]);
  const [childSku, setChildSku] = useState('');
  const [childQty, setChildQty] = useState(1);

  const [form] = Form.useForm();
  const bomValues = Form.useWatch('boms', form);
  const routingValues = Form.useWatch('routings', form);
  const logisticValues = Form.useWatch('logistics', form);

  const fetchData = async () => {
    setLoading(true);
    try { 
      const res = await axios.get(`${API_URL}/products`);
      const products = Array.isArray(res.data) ? res.data : [];
      setRawList(products);

      const uniqueCats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[];
      setCategories(uniqueCats);
      
      const resSupp = await axios.get(`${API_URL}/suppliers`);
      setSuppliers(resSupp.data.map((s:any) => ({label: s.name, value: s.id, type: s.type})));

      const resMat = await axios.get(`${API_URL}/materials`);
      setMaterials(resMat.data.map((m:any) => ({
          label: `${m.name} (${m.code})`, 
          value: m.id, 
          unit: m.unit, 
          price: Number(m.cost_per_unit) || 0
      })));

    } catch (e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
      let filtered = rawList;
      if (searchText) {
          const lower = searchText.toLowerCase();
          filtered = filtered.filter(p => (p.name && p.name.toLowerCase().includes(lower)) || (p.sku && p.sku.toLowerCase().includes(lower)));
      }
      if (filterCategory) {
          filtered = filtered.filter(p => p.category === filterCategory);
      }

      const groups: any = {};
      filtered.forEach((p: any) => {
          const catName = p.category || 'Khác';
          const groupKey = `${p.name}-${catName}`;
          
          if (!groups[groupKey]) {
              groups[groupKey] = { 
                  key: 'group_' + groupKey, 
                  isGroup: true, 
                  name: p.name, 
                  category: catName,
                  product_type: p.product_type, // Lưu loại để pre-fill
                  base_price: p.base_price,     // Lưu giá để pre-fill
                  children: [], 
                  totalStock: 0, minPrice: Infinity, maxPrice: -Infinity 
              };
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
  }, [rawList, searchText, filterCategory]);

  const calcBomTotal = () => {
      if (!bomValues || !Array.isArray(bomValues)) return 0;
      return bomValues.reduce((sum, item) => {
          if (!item?.material_id) return sum;
          const mat = materials.find(m => m.value === item.material_id);
          const price = mat ? mat.price : 0;
          return sum + ((Number(item.quantity)||0) * price * (1 + (Number(item.waste_percent)||0)/100));
      }, 0);
  };

  const calcRoutingTotal = () => {
      if (!routingValues || !Array.isArray(routingValues)) return 0;
      return routingValues.reduce((sum, r) => r?.is_required ? sum + (Number(r.cost)||0) : sum, 0);
  };

  const calcLogisticTotal = () => {
      if (!logisticValues || !Array.isArray(logisticValues)) return 0;
      return logisticValues.reduce((sum, l) => sum + (Number(l?.cost)||0), 0);
  };

  // --- ACTIONS ---
  const handleCreateNew = () => {
      setEditingItem(null);
      form.resetFields();
      setIsModalOpen(true);
  };

  // --- NEW: TẠO BIẾN THỂ TỪ GROUP ---
  const handleAddVariant = (group: any) => {
      setEditingItem(null);
      form.resetFields();
      // Pre-fill thông tin chung
      form.setFieldsValue({
          name: group.name,
          category: group.category,
          product_type: group.product_type,
          base_price: group.base_price
      });
      setIsModalOpen(true);
  };

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
    } catch (e) { message.error('Lỗi lưu (Có thể trùng SKU)'); }
  };

  const handleSaveAll = async () => {
      if(!editingItem) return;
      try {
          await axios.post(`${API_URL}/products/${editingItem.id}/boms`, form.getFieldValue('boms'));
          await axios.post(`${API_URL}/products/${editingItem.id}/routings`, form.getFieldValue('routings'));
          await axios.post(`${API_URL}/products/${editingItem.id}/logistics`, form.getFieldValue('logistics'));
          
          const res = await axios.get(`${API_URL}/products/calculate-cost/${editingItem.sku}`);
          message.success(`Đã lưu & Cập nhật giá vốn: ${Number(res.data.new_cost_price).toLocaleString()} đ`);
          fetchData();
      } catch(e) { message.error('Có lỗi khi lưu chi tiết'); }
  };

  const handleSyncVariants = async (item: any) => {
      // Nếu gọi từ Modal (editingItem) hoặc từ nút ngoài bảng
      const targetItem = item || editingItem;
      if(!targetItem) return;

      Modal.confirm({
          title: 'Đồng bộ dữ liệu?',
          content: `Sao chép BOM & Quy trình từ "${targetItem.sku}" sang tất cả các biến thể khác của "${targetItem.name}"?`,
          onOk: async () => {
              try {
                  const res = await axios.post(`${API_URL}/products/${targetItem.id}/sync-variants`);
                  message.success(res.data.message);
              } catch(e) { message.error('Lỗi đồng bộ'); }
          }
      });
  };

  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API_URL}/products/${id}`); fetchData(); } catch (e) { message.error('Lỗi xóa'); }
  };

  const openComboConfig = (sku: string) => { setCurrentComboSku(sku); setComboDrawerOpen(true); loadComboItems(sku); };
  const loadComboItems = async (sku: string) => { try { const res = await axios.get(`${API_URL}/products/combo/${sku}`); setComboItems(Array.isArray(res.data) ? res.data : []); } catch (e) { setComboItems([]); } };
  const addComboItem = async () => { try { await axios.post(`${API_URL}/products/combo/add`, { parentSku: currentComboSku, childSku, qty: childQty }); message.success('Đã thêm'); loadComboItems(currentComboSku); } catch(e) { message.error('Lỗi SKU'); } };
  const removeComboItem = async (id: number) => { await axios.delete(`${API_URL}/products/combo/item/${id}`); loadComboItems(currentComboSku); };

  const openEditModal = (r: any) => {
      setEditingItem(r);
      form.setFieldsValue({ ...r, color: r.attributes?.color, size: r.attributes?.size, fabric: r.attributes?.fabric });
      setTimeout(async () => {
          try {
             const resBom = await axios.get(`${API_URL}/products/${r.sku}/boms`);
             form.setFieldValue('boms', resBom.data);
             const resRoute = await axios.get(`${API_URL}/products/${r.id}/routings`);
             const defaultRouting = [
                { step_name: '1. Nối vải', is_required: false, cost: 0 },
                { step_name: '2. Chần gòn', is_required: true, cost: 0 },
                { step_name: '3. May thành phẩm', is_required: true, cost: 0 },
                { step_name: '4. Đóng gói', is_required: true, cost: 0 }
             ];
             form.setFieldValue('routings', resRoute.data.length ? resRoute.data : defaultRouting);
             const resLog = await axios.get(`${API_URL}/products/${r.id}/logistics`);
             form.setFieldValue('logistics', resLog.data);
          } catch(e) {}
      }, 200);
      setIsModalOpen(true);
  };

  const MaterialInfoRow = ({ matId, qty, waste }: any) => {
      const mat = materials.find(m => m.value === matId);
      if (!mat) return <div style={{color:'#ccc'}}>Chưa chọn</div>;
      const subTotal = (Number(qty)||0) * mat.price * (1 + (Number(waste)||0)/100);
      return (
          <Row gutter={4} style={{fontSize:12, marginTop:5, color:'#666'}}>
              <Col span={6}><Tag>{mat.unit}</Tag></Col>
              <Col span={8} style={{textAlign:'right'}}>{mat.price.toLocaleString()}</Col>
              <Col span={10} style={{textAlign:'right', fontWeight:'bold', color:'#1890ff'}}>{subTotal.toLocaleString(undefined, {maximumFractionDigits:0})} đ</Col>
          </Row>
      );
  };

  const columns = [
    { 
        title: 'Sản Phẩm', dataIndex: 'name', key: 'name', width: 250, 
        render: (text:string, r:any) => r.isGroup ? 
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <b style={{fontSize:15, color:'#1890ff'}}>{text} <Tag>{r.children.length}</Tag></b>
                {/* BUTTON THÊM BIẾN THỂ */}
                <Button size="small" type="dashed" icon={<AppstoreAddOutlined />} onClick={(e) => { e.stopPropagation(); handleAddVariant(r); }}>Thêm Biến Thể</Button>
            </div> 
            : <Space>{r.attributes?.color && <Tag color="magenta">{r.attributes.color}</Tag>} {text}</Space> 
    },
    { title: 'SKU', dataIndex: 'sku', width: 150, render: (t:any, r:any) => r.isGroup ? '' : <b>{t}</b> },
    { title: 'Nhóm', dataIndex: 'category', width: 100, render: (t:any, r:any) => r.isGroup ? <Tag>{t}</Tag> : t },
    { title: 'Giá Bán', dataIndex: 'base_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? <small>{Number(r.minPrice).toLocaleString()} - {Number(r.maxPrice).toLocaleString()}</small> : Number(v).toLocaleString() },
    { title: 'Tồn Kho', dataIndex: 'quantity_in_stock', align: 'right' as const, width: 100, render: (v:any, r:any) => r.isGroup ? <b>{v}</b> : <span style={{color: v>0?'green':'red'}}>{v}</span> },
    { title: 'Giá Vốn', dataIndex: 'cost_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? '' : <span style={{color:'red'}}>{Number(v).toLocaleString()}</span> },
    { 
        title: '', key: 'action', width: 100, 
        render: (_: any, r: any) => !r.isGroup && (
            <Space>
                <Tooltip title="Chỉnh sửa & BOM"><Button icon={<EditOutlined />} onClick={() => openEditModal(r)} /></Tooltip>
                <Tooltip title="Copy BOM sang biến thể khác"><Button icon={<CopyOutlined />} onClick={() => handleSyncVariants(r)} /></Tooltip>
            </Space>
        ) 
    },
  ];

  const modalContent = (
      <Tabs defaultActiveKey="1" items={[
          {
              key: '1', label: 'Thông tin',
              children: (
                  <>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="name" label="Tên SP" rules={[{required:true}]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="sku" label="SKU" rules={[{required:true}]}><Input disabled={!!editingItem} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="category" label="Nhóm hàng"><Input placeholder="VD: Áo Thun" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="product_type" label="Loại"><Input placeholder="VD: Nam/Nữ" /></Form.Item></Col>
                    </Row>
                    <Divider orientation="left">Thuộc tính & Giá</Divider>
                    <Row gutter={16}><Col span={8}><Form.Item name="color" label="Màu"><Input /></Form.Item></Col><Col span={8}><Form.Item name="size" label="Size"><Input /></Form.Item></Col><Col span={8}><Form.Item name="base_price" label="Giá Bán"><InputNumber style={{width:'100%'}} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col></Row>
                    <div style={{textAlign:'right'}}><Button type="primary" onClick={() => form.submit()} icon={<SaveOutlined />}>Lưu Thông Tin</Button></div>
                  </>
              )
          },
          {
              key: '2', label: 'BOM & Định Mức',
              disabled: !editingItem,
              children: (
                  <>
                    <div style={{background:'#fafafa', padding: 8, borderBottom:'1px solid #eee', fontWeight:'bold', marginBottom:10}}>
                        <Row gutter={8}>
                            <Col span={8}>Nguyên Liệu</Col>
                            <Col span={4}>Định mức</Col>
                            <Col span={4}>% Hao hụt</Col>
                            <Col span={8} style={{textAlign:'center'}}>Chi tiết</Col>
                        </Row>
                    </div>
                    <Form.List name="boms">
                        {(fields, { add, remove }) => (
                            <div style={{maxHeight: 350, overflowY: 'auto'}}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{marginBottom: 8, borderBottom:'1px dashed #f0f0f0', paddingBottom: 5}}>
                                        <Row gutter={8} align="top">
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'material_id']} noStyle rules={[{ required: true }]}>
                                                    <Select placeholder="Chọn NPL..." showSearch optionFilterProp="label" options={materials} style={{width:'100%'}} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}><Form.Item {...restField} name={[name, 'quantity']} noStyle><InputNumber placeholder="SL" style={{width:'100%'}} min={0} /></Form.Item></Col>
                                            <Col span={4}><Form.Item {...restField} name={[name, 'waste_percent']} noStyle><InputNumber placeholder="%" style={{width:'100%'}} min={0} /></Form.Item></Col>
                                            <Col span={7}>
                                                <Form.Item shouldUpdate>
                                                    {() => (
                                                        <MaterialInfoRow 
                                                            matId={form.getFieldValue(['boms', name, 'material_id'])}
                                                            qty={form.getFieldValue(['boms', name, 'quantity'])}
                                                            waste={form.getFieldValue(['boms', name, 'waste_percent'])}
                                                        />
                                                    )}
                                                </Form.Item>
                                            </Col>
                                            <Col span={1}><MinusCircleOutlined onClick={() => remove(name)} style={{color:'red', marginTop:5}} /></Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm nguyên liệu</Button>
                            </div>
                        )}
                    </Form.List>
                    <div style={{marginTop:15, textAlign:'right', padding:10, background:'#f6ffed', borderRadius:4}}>
                        <Text type="secondary">Tổng chi phí NPL: </Text>
                        <Text style={{color:'#3f8600', fontSize:16, fontWeight:'bold'}}>{calcBomTotal().toLocaleString()} đ</Text>
                    </div>
                  </>
              )
          },
          {
              key: '3', label: 'Quy Trình & Vận Chuyển',
              disabled: !editingItem,
              children: (
                  <div style={{maxHeight: 450, overflowY: 'auto'}}>
                    <Divider orientation="left">Các công đoạn gia công</Divider>
                    <Form.List name="routings">
                        {(fields) => (
                            <div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{marginBottom: 8, background:'#f9f9f9', padding: 8, borderRadius: 4}}>
                                        <Col span={1}><Form.Item {...restField} name={[name, 'is_required']} valuePropName="checked" noStyle><Checkbox /></Form.Item></Col>
                                        <Col span={9}><Form.Item {...restField} name={[name, 'step_name']} noStyle><span style={{fontWeight:500}}>{form.getFieldValue(['routings', name, 'step_name'])}</span></Form.Item></Col>
                                        <Col span={8}><Form.Item {...restField} name={[name, 'supplier_id']} noStyle><Select placeholder="Nhà Gia Công..." options={suppliers.filter((s:any)=>s.type!=='MATERIAL')} allowClear style={{width:'100%'}} bordered={false} /></Form.Item></Col>
                                        <Col span={6}><Form.Item {...restField} name={[name, 'cost']} noStyle><InputNumber placeholder="Chi phí" style={{width:'100%'}} addonAfter="₫" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} bordered={false} /></Form.Item></Col>
                                    </Row>
                                ))}
                            </div>
                        )}
                    </Form.List>
                    <div style={{textAlign:'right', marginBottom: 20}}><Text type="secondary">Tổng gia công: </Text><Text strong>{calcRoutingTotal().toLocaleString()} đ</Text></div>

                    <Divider orientation="left">Chi phí vận chuyển SX</Divider>
                    <Form.List name="logistics">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} style={{marginBottom: 8}}>
                                        <Col span={12}><Form.Item {...restField} name={[name, 'route_name']} noStyle><Input placeholder="Tên chặng..." /></Form.Item></Col>
                                        <Col span={10}><Form.Item {...restField} name={[name, 'cost']} noStyle><InputNumber placeholder="Chi phí" style={{width:'100%'}} addonAfter="₫" /></Form.Item></Col>
                                        <Col span={2}><DeleteOutlined onClick={() => remove(name)} style={{color:'red'}} /></Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm chặng vận chuyển</Button>
                            </>
                        )}
                    </Form.List>
                    <div style={{textAlign:'right', marginTop:10}}><Text type="secondary">Tổng vận chuyển: </Text><Text strong>{calcLogisticTotal().toLocaleString()} đ</Text></div>
                  </div>
              )
          }
      ]} />
  );

  const totalCostEstimate = calcBomTotal() + calcRoutingTotal() + calcLogisticTotal();

  return (
    <div>
      <Card 
        title="Quản lý Sản Phẩm (Lẻ)" 
        extra={
            <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>Thêm Sản Phẩm Mới</Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            </Space>
        }
      >
        <div style={{marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 8}}>
            <Row gutter={16} align="middle">
                <Col span={12}>
                    <Input 
                        placeholder="Tìm kiếm theo Tên SP hoặc SKU..." 
                        prefix={<SearchOutlined style={{color:'#999'}} />} 
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={8}>
                    <Select 
                        placeholder="Lọc theo Nhóm hàng" 
                        style={{width:'100%'}} 
                        allowClear 
                        onChange={setFilterCategory}
                        options={categories.map(c => ({label: c, value: c}))}
                        suffixIcon={<FilterOutlined />}
                    />
                </Col>
                <Col span={4} style={{textAlign:'right'}}>
                    <Text type="secondary">Tìm thấy: <b style={{color:'black'}}>{treeData.length}</b> nhóm</Text>
                </Col>
            </Row>
        </div>

        <Table 
            columns={columns} 
            dataSource={treeData} 
            rowKey="key" 
            loading={loading} 
            bordered 
            pagination={{ pageSize: 20 }} 
            expandable={{ defaultExpandAllRows: true }} 
            scroll={{ y: 600 }}
        />
      </Card>

      <Modal title={editingItem ? `Chi tiết: ${editingItem.sku}` : "Thêm Sản Phẩm Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={900} style={{top: 20}}>
        <Form form={form} layout="vertical" onFinish={handleSaveProduct}>{modalContent}</Form>
        {editingItem && (
            <div style={{marginTop: 20, paddingTop: 15, borderTop: '2px solid #eee', background:'#fff', position:'sticky', bottom:0}}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Space>
                            <Button type="default" icon={<CopyOutlined />} onClick={() => handleSyncVariants(editingItem)}>Đồng bộ biến thể</Button>
                            <Statistic title="Giá Vốn (Ước tính)" value={totalCostEstimate} valueStyle={{color: '#cf1322', fontSize: 18, fontWeight: 'bold'}} prefix="~" suffix="₫" />
                        </Space>
                    </Col>
                    <Col>
                        <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveAll}>LƯU & TÍNH GIÁ</Button>
                    </Col>
                </Row>
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