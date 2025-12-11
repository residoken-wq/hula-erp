import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Space, Drawer, List, Row, Col, Statistic, Tabs, Checkbox, Typography, Divider, Tooltip } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CopyOutlined, MinusCircleOutlined, SearchOutlined, FilterOutlined, AppstoreAddOutlined, BuildOutlined, ExperimentOutlined, ArrowRightOutlined, CalculatorOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const { Text } = Typography;

const ProductsPage: React.FC = () => {
  const [rawList, setRawList] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]); // Sửa thành any[] để chứa ID

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  const [processes, setProcesses] = useState<any[]>([]);

  const [comboDrawerOpen, setComboDrawerOpen] = useState(false);
  const [currentComboSku, setCurrentComboSku] = useState('');
  const [comboItems, setComboItems] = useState([]);
  const [childSku, setChildSku] = useState('');
  const [childQty, setChildQty] = useState(1);

  const [form] = Form.useForm();
  const bomValues = Form.useWatch('boms', form);
  const routingValues = Form.useWatch('routings', form);
  const logisticValues = Form.useWatch('logistics', form);
  const profitMargin = Form.useWatch('profit_margin', form) || 30;

  const fetchData = async () => {
    setLoading(true);
    try { 
      const res = await axios.get(`${API_URL}/products`);
      const products = Array.isArray(res.data) ? res.data : [];
      setRawList(products);

      try {
          const resCat = await axios.get(`${API_URL}/categories`);
          setCategories(resCat.data.map((c:any) => ({ label: `${c.name} (${c.profit_margin}%)`, value: c.id })));
      } catch(e) {}
      
      const resSupp = await axios.get(`${API_URL}/suppliers`);
      setSuppliers(resSupp.data.filter((s:any) => s.type !== 'MATERIAL').map((s:any) => ({label: s.name, value: s.id})));

      const resMat = await axios.get(`${API_URL}/materials`);
      setMaterials(resMat.data.map((m:any) => ({
          label: `${m.name} (${m.code})`, 
          value: m.id, 
          unit: m.unit, 
          price: Number(m.cost_per_unit) || 0
      })));

      try {
          const resProc = await axios.get(`${API_URL}/processes`);
          setProcesses(resProc.data.map((p:any) => ({label: p.name, value: p.code, id: p.id, cost: p.standard_cost})));
      } catch(e) {}

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
          // Lọc theo Category ID (nếu có) hoặc text
          filtered = filtered.filter(p => p.category_id === filterCategory || p.category === filterCategory);
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
                  product_type: p.product_type,
                  base_price: p.base_price,
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

  // --- LOGIC LẤY GIÁ TỰ ĐỘNG (MỚI) ---
  const handleRoutingChange = async (index: number, field: string, value: any) => {
      // Lấy danh sách hiện tại
      const currentRoutings = form.getFieldValue('routings') || [];
      const currentItem = currentRoutings[index] || {};
      
      let supplierId = currentItem.supplier_id;
      let stepName = currentItem.step_name;

      if (field === 'supplier') supplierId = value;
      if (field === 'step') stepName = value;

      // Nếu đủ thông tin và đang ở chế độ Edit Item
      if (supplierId && stepName && editingItem?.id) {
          // Tìm ID process từ tên (vì FE đang lưu step_name string)
          const process = processes.find(p => p.label === stepName || p.value === stepName);
          if (process) {
              try {
                  const res = await axios.post(`${API_URL}/suppliers/check-price`, {
                      supplierId: supplierId,
                      processId: process.id,
                      productId: editingItem.id
                  });
                  
                  if (res.data.price > 0) {
                      // Cập nhật giá vào form
                      currentRoutings[index].cost = res.data.price;
                      form.setFieldValue('routings', [...currentRoutings]);
                      message.success(`Đã cập nhật giá: ${res.data.price.toLocaleString()}đ`);
                  }
              } catch (e) {}
          }
      }
  };
  // ------------------------------------

  const handleCreateNew = () => {
      setEditingItem(null);
      form.resetFields();
      setIsModalOpen(true);
  };

  const handleAddVariant = (group: any) => {
      setEditingItem(null);
      form.resetFields();
      form.setFieldsValue({
          name: group.name,
          category: group.category,
          product_type: group.product_type,
          base_price: group.base_price,
          profit_margin: 30
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
    } catch (e) { message.error('Lỗi lưu'); }
  };

  const handleSaveAll = async () => {
      if(!editingItem) return;
      try {
          await axios.post(`${API_URL}/products/${editingItem.id}/boms`, form.getFieldValue('boms'));
          
          // Thêm process_id vào routing payload để backend biết đường tìm giá (nếu cần)
          const routingPayload = form.getFieldValue('routings').map((r:any) => {
              const proc = processes.find(p => p.label === r.step_name);
              return { ...r, process_id: proc?.id };
          });
          await axios.post(`${API_URL}/products/${editingItem.id}/routings`, routingPayload);
          
          await axios.post(`${API_URL}/products/${editingItem.id}/logistics`, form.getFieldValue('logistics'));
          
          const res = await axios.get(`${API_URL}/products/calculate-cost/${editingItem.sku}`);
          const newCost = Number(res.data.new_cost_price) || 0;
          const margin = form.getFieldValue('profit_margin') || 30;
          const suggestedPrice = Math.ceil((newCost * (1 + margin/100)) / 1000) * 1000;
          
          await axios.put(`${API_URL}/products/${editingItem.id}`, {
              ...form.getFieldsValue(),
              base_price: suggestedPrice,
              cost_price: newCost
          });

          message.success(`Đã cập nhật: Giá vốn ${newCost.toLocaleString()} -> Giá bán ${suggestedPrice.toLocaleString()}`);
          fetchData();
          setIsModalOpen(false);
      } catch(e) { message.error('Có lỗi khi lưu chi tiết'); }
  };

  const handleSyncVariants = async (item: any) => {
      const targetItem = item || editingItem;
      if(!targetItem) return;
      Modal.confirm({
          title: 'Đồng bộ dữ liệu?',
          content: `Sao chép BOM & Quy trình từ "${targetItem.sku}" sang tất cả các biến thể khác?`,
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
      form.setFieldsValue({ 
          ...r, 
          color: r.attributes?.color, 
          size: r.attributes?.size, 
          fabric: r.attributes?.fabric,
          profit_margin: r.profit_margin || 30
      });
      setTimeout(async () => {
          try {
             const resBom = await axios.get(`${API_URL}/products/${r.sku}/boms`);
             form.setFieldValue('boms', resBom.data);
             
             const resRoute = await axios.get(`${API_URL}/products/${r.id}/routings`);
             let routeData = resRoute.data;
             if(!routeData || routeData.length === 0) {
                 routeData = [
                     { step_name: 'Cắt', is_required: true, cost: 0 },
                     { step_name: 'May', is_required: true, cost: 0 },
                     { step_name: 'Ủi/Đóng gói', is_required: true, cost: 0 }
                 ];
             }
             form.setFieldValue('routings', routeData);
             
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
              <Col span={10}><Tag>{mat.unit}</Tag> {mat.name}</Col>
              <Col span={14} style={{textAlign:'right', fontWeight:'bold', color:'#1890ff'}}>= {subTotal.toLocaleString(undefined, {maximumFractionDigits:0})} đ</Col>
          </Row>
      );
  };

  const columns = [
    { 
        title: 'Sản Phẩm', dataIndex: 'name', key: 'name', width: 250, 
        render: (text:string, r:any) => r.isGroup ? 
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <b style={{fontSize:15, color:'#1890ff'}}>{text} <Tag>{r.children.length}</Tag></b>
                <Button size="small" type="dashed" icon={<AppstoreAddOutlined />} onClick={(e) => { e.stopPropagation(); handleAddVariant(r); }}>Thêm Biến Thể</Button>
            </div> 
            : <Space>{r.attributes?.color && <Tag color="magenta">{r.attributes.color}</Tag>} {text}</Space> 
    },
    { title: 'SKU', dataIndex: 'sku', width: 150, render: (t:any, r:any) => r.isGroup ? '' : <b>{t}</b> },
    { title: 'Giá Bán', dataIndex: 'base_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? <small>{Number(r.minPrice).toLocaleString()} - {Number(r.maxPrice).toLocaleString()}</small> : Number(v).toLocaleString() },
    { title: 'Tồn Kho', dataIndex: 'quantity_in_stock', align: 'right' as const, width: 100, render: (v:any, r:any) => r.isGroup ? <b>{v}</b> : <span style={{color: v>0?'green':'red'}}>{v}</span> },
    { title: 'Giá Vốn', dataIndex: 'cost_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? '' : <span style={{color:'red'}}>{Number(v).toLocaleString()}</span> },
    { 
        title: '', key: 'action', width: 100, 
        render: (_: any, r: any) => !r.isGroup && (
            <Space>
                <Tooltip title="Chỉnh sửa & BOM"><Button icon={<EditOutlined />} onClick={() => openEditModal(r)} /></Tooltip>
                <Tooltip title="Copy BOM"><Button icon={<CopyOutlined />} onClick={() => handleSyncVariants(r)} /></Tooltip>
            </Space>
        ) 
    },
  ];

  const totalCostEstimate = calcBomTotal() + calcRoutingTotal() + calcLogisticTotal();
  const suggestedPrice = Math.ceil((totalCostEstimate * (1 + (profitMargin/100))) / 1000) * 1000;

  const modalContent = (
      <Tabs defaultActiveKey="1" items={[
          {
              key: '1', label: 'Thông tin & Định giá',
              children: (
                  <>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="name" label="Tên SP" rules={[{required:true}]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="sku" label="SKU" rules={[{required:true}]}><Input disabled={!!editingItem} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            {/* --- CHỌN DANH MỤC TỪ DB --- */}
                            <Form.Item name="category_id" label="Danh Mục (Quyết định % Margin)" rules={[{required:true}]}>
                                <Select options={categories} />
                            </Form.Item>
                        </Col>
                        <Col span={12}><Form.Item name="product_type" label="Loại"><Input placeholder="VD: Nam/Nữ" /></Form.Item></Col>
                    </Row>
                    <Divider orientation="left">Thuộc tính</Divider>
                    <Row gutter={16}><Col span={8}><Form.Item name="color" label="Màu"><Input /></Form.Item></Col><Col span={8}><Form.Item name="size" label="Size"><Input /></Form.Item></Col><Col span={8}><Form.Item name="fabric" label="Chất liệu"><Input /></Form.Item></Col></Row>
                    
                    <div style={{background: '#f6ffed', padding: '15px', borderRadius: 8, border: '1px solid #b7eb8f', marginTop: 10}}>
                        <Row gutter={16} align="middle">
                            <Col span={8}><Statistic title="Giá Vốn (Tạm tính)" value={totalCostEstimate} suffix="đ" valueStyle={{fontSize:16}} /></Col>
                            <Col span={1} style={{textAlign:'center'}}><PlusOutlined /></Col>
                            <Col span={6}>
                                <Form.Item name="profit_margin" label="% Lợi Nhuận" style={{marginBottom:0}} help="Để trống nếu muốn dùng % của Danh mục">
                                    <InputNumber min={0} max={500} style={{width:'100%'}} suffix="%" />
                                </Form.Item>
                            </Col>
                            <Col span={1} style={{textAlign:'center'}}><ArrowRightOutlined /></Col>
                            <Col span={8}>
                                <Form.Item name="base_price" label="Giá Bán (Đề xuất)" style={{marginBottom:0}} help={`Gợi ý: ${suggestedPrice.toLocaleString()} đ`}>
                                    <InputNumber style={{width:'100%', fontWeight:'bold', color:'green'}} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                    <div style={{textAlign:'right', marginTop:15}}><Button type="primary" onClick={() => form.submit()} icon={<SaveOutlined />}>Lưu Thông Tin</Button></div>
                  </>
              )
          },
          {
              key: '2', label: 'BOM & Định Mức',
              disabled: !editingItem,
              children: (
                  <Form.List name="boms">
                        {(fields, { add, remove }) => (
                            <div style={{maxHeight: 350, overflowY: 'auto'}}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{marginBottom: 8, borderBottom:'1px dashed #f0f0f0', paddingBottom: 5}}>
                                        <Row gutter={8} align="top">
                                            <Col span={10}><Form.Item {...restField} name={[name, 'material_id']} noStyle rules={[{ required: true }]}><Select placeholder="Chọn NPL..." showSearch optionFilterProp="label" options={materials} style={{width:'100%'}} /></Form.Item></Col>
                                            <Col span={4}><Form.Item {...restField} name={[name, 'quantity']} noStyle><InputNumber placeholder="SL" style={{width:'100%'}} min={0} /></Form.Item></Col>
                                            <Col span={3}><Form.Item {...restField} name={[name, 'waste_percent']} noStyle><InputNumber placeholder="%" style={{width:'100%'}} min={0} /></Form.Item></Col>
                                            <Col span={6}><Form.Item shouldUpdate>{()=><MaterialInfoRow matId={form.getFieldValue(['boms', name, 'material_id'])} qty={form.getFieldValue(['boms', name, 'quantity'])} waste={form.getFieldValue(['boms', name, 'waste_percent'])} />}</Form.Item></Col>
                                            <Col span={1}><MinusCircleOutlined onClick={() => remove(name)} style={{color:'red', marginTop:5}} /></Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm nguyên liệu</Button>
                                <div style={{textAlign:'right', marginTop:10}}>Tổng NPL: <b>{calcBomTotal().toLocaleString()} đ</b></div>
                            </div>
                        )}
                    </Form.List>
              )
          },
          {
              key: '3', label: 'Quy Trình & Vận Chuyển',
              disabled: !editingItem,
              children: (
                  <div style={{maxHeight: 450, overflowY: 'auto'}}>
                    <div style={{background:'#fafafa', padding: 8, borderBottom:'1px solid #eee', fontWeight:'bold', marginBottom:10}}>
                        <Row gutter={8}><Col span={1}></Col><Col span={11}>Công Đoạn (Quy trình)</Col><Col span={7}>Nhà Gia Công</Col><Col span={4}>Đơn Giá</Col><Col span={1}></Col></Row>
                    </div>
                    <Form.List name="routings">
                        {(fields, { add, remove }) => (
                            <div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{marginBottom: 8, background:'#f9f9f9', padding: 8, borderRadius: 4}}>
                                        <Col span={1}><Form.Item {...restField} name={[name, 'is_required']} valuePropName="checked" noStyle><Checkbox /></Form.Item></Col>
                                        <Col span={11}>
                                            <Form.Item {...restField} name={[name, 'step_name']} noStyle rules={[{required:true}]}>
                                                <Select 
                                                    placeholder="Công đoạn..." showSearch optionFilterProp="label" 
                                                    options={processes.map(p=>({label: p.label, value: p.label, id: p.id}))} 
                                                    onChange={(val) => handleRoutingChange(key, 'step', val)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={7}>
                                            <Form.Item {...restField} name={[name, 'supplier_id']} noStyle>
                                                <Select 
                                                    placeholder="Nhà Gia Công..." options={suppliers} allowClear 
                                                    onChange={(val) => handleRoutingChange(key, 'supplier', val)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}><Form.Item {...restField} name={[name, 'cost']} noStyle><InputNumber placeholder="Giá" style={{width:'100%'}} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                                        <Col span={1}><DeleteOutlined onClick={() => remove(name)} style={{color:'red', cursor:'pointer'}} /></Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm công đoạn</Button>
                            </div>
                        )}
                    </Form.List>
                    <div style={{textAlign:'right', marginBottom: 20}}>Tổng gia công: <b>{calcRoutingTotal().toLocaleString()} đ</b></div>

                    <Divider orientation="left">Vận chuyển</Divider>
                    <Form.List name="logistics">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} style={{marginBottom: 8}}>
                                        <Col span={12}><Form.Item {...restField} name={[name, 'route_name']} noStyle><Input placeholder="Tên chặng..." /></Form.Item></Col>
                                        <Col span={10}><Form.Item {...restField} name={[name, 'cost']} noStyle><InputNumber placeholder="Chi phí" style={{width:'100%'}} /></Form.Item></Col>
                                        <Col span={2}><DeleteOutlined onClick={() => remove(name)} style={{color:'red'}} /></Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm chặng vận chuyển</Button>
                            </>
                        )}
                    </Form.List>
                    <div style={{textAlign:'right', marginTop:10}}>Tổng vận chuyển: <b>{calcLogisticTotal().toLocaleString()} đ</b></div>
                  </div>
              )
          }
      ]} />
  );

  return (
    <div>
      <Card title="Quản lý Sản Phẩm (Lẻ)" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>Thêm Mới</Button><Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button></Space>}>
        <div style={{marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 8}}>
            <Row gutter={16} align="middle">
                <Col span={12}><Input placeholder="Tìm kiếm..." prefix={<SearchOutlined style={{color:'#999'}} />} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear /></Col>
                <Col span={8}><Select placeholder="Lọc nhóm hàng" style={{width:'100%'}} allowClear onChange={setFilterCategory} options={categories} suffixIcon={<FilterOutlined />} /></Col>
                <Col span={4} style={{textAlign:'right'}}><Text type="secondary">Tổng: <b style={{color:'black'}}>{treeData.length}</b> nhóm</Text></Col>
            </Row>
        </div>
        <Table columns={columns} dataSource={treeData} rowKey="key" loading={loading} bordered pagination={{ pageSize: 20 }} expandable={{ defaultExpandAllRows: true }} scroll={{ y: 600 }} />
      </Card>

      <Modal title={editingItem ? `Chi tiết: ${editingItem.sku}` : "Thêm Sản Phẩm Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={900} style={{top: 20}}>
        <Form form={form} layout="vertical" onFinish={handleSaveProduct} initialValues={{profit_margin: 30}}>{modalContent}</Form>
        {editingItem && (
            <div style={{marginTop: 20, paddingTop: 15, borderTop: '2px solid #eee', background:'#fff', position:'sticky', bottom:0}}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Space>
                            <Button type="default" icon={<CopyOutlined />} onClick={() => handleSyncVariants(editingItem)}>Đồng bộ biến thể</Button>
                            <Statistic title="Tổng Giá Vốn" value={totalCostEstimate} valueStyle={{color: '#cf1322', fontSize: 18, fontWeight: 'bold'}} prefix="~" suffix="₫" />
                        </Space>
                    </Col>
                    <Col><Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveAll}>LƯU & CẬP NHẬT GIÁ</Button></Col>
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