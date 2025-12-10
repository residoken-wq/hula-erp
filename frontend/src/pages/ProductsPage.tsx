import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Drawer, List, Row, Col, Statistic, Tabs, Checkbox, Tooltip, Alert } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, AppstoreAddOutlined, SaveOutlined, CalculatorOutlined, CopyOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

import { API_URL } from '../config'; const API = API_URL;

const ProductsPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Data Options
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]); // List NPL de chon trong BOM

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try { 
      const res = await axios.get(`${API}/products`);
      const products = Array.isArray(res.data) ? res.data : [];
      
      // Load Suppliers
      const resSupp = await axios.get(`${API}/suppliers`);
      setSuppliers(resSupp.data.map((s:any) => ({label: s.name, value: s.id, type: s.type})));

      // Load Materials cho BOM
      const resMat = await axios.get(`${API}/materials`);
      setMaterials(resMat.data.map((m:any) => ({
          label: `${m.name} (${m.code})`, 
          value: m.id, 
          unit: m.unit, 
          price: m.cost_per_unit
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

  const handleSaveProduct = async (values: any) => {
    try {
      const payload = {
          ...values,
          attributes: { color: values.color, size: values.size, fabric: values.fabric },
          base_price: Number(values.base_price) || 0,
          quantity_in_stock: Number(values.quantity_in_stock) || 0
      };
      if (editingItem) await axios.put(`${API}/products/${editingItem.id}`, payload);
      else await axios.post(`${API}/products`, payload);
      message.success('Lưu thành công'); setIsModalOpen(false); fetchData();
    } catch (e) { message.error('Lỗi lưu'); }
  };

  const handleSaveBoms = async () => {
      if(!editingItem) return;
      try {
          await axios.post(`${API}/products/${editingItem.id}/boms`, form.getFieldValue('boms'));
          message.success('Đã lưu BOM');
      } catch(e) { message.error('Lỗi lưu BOM'); }
  };

  const handleSaveRouting = async () => {
      if(!editingItem) return;
      try {
          await axios.post(`${API}/products/${editingItem.id}/routings`, form.getFieldValue('routings'));
          message.success('Đã lưu quy trình');
      } catch(e) { message.error('Lỗi lưu routing'); }
  };

  const handleSyncVariants = async () => {
      if(!editingItem) return;
      Modal.confirm({
          title: 'Đồng bộ dữ liệu?',
          content: `Bạn có chắc muốn sao chép BOM, Quy trình, Vận chuyển của sản phẩm "${editingItem.sku}" sang TẤT CẢ các biến thể khác cùng tên "${editingItem.name}" không?`,
          onOk: async () => {
              try {
                  const res = await axios.post(`${API}/products/${editingItem.id}/sync-variants`);
                  message.success(res.data.message);
              } catch(e) { message.error('Lỗi đồng bộ'); }
          }
      });
  };

  const handleCalculateCost = async () => {
      if(!editingItem) return;
      try {
          const res = await axios.get(`${API}/products/calculate-cost/${editingItem.sku}`);
          message.success(`Giá vốn mới: ${Number(res.data.new_cost_price).toLocaleString()} đ`);
          fetchData();
      } catch(e) { message.error('Lỗi tính toán'); }
  };

  const openEditModal = (r: any) => {
      setEditingItem(r);
      form.setFieldsValue({
          ...r,
          color: r.attributes?.color, size: r.attributes?.size, fabric: r.attributes?.fabric
      });
      
      // Load Details
      setTimeout(async () => {
          try {
             // 1. Load BOM
             const resBom = await axios.get(`${API}/products/${r.sku}/boms`);
             form.setFieldValue('boms', resBom.data);

             // 2. Load Routing
             const resRoute = await axios.get(`${API}/products/${r.id}/routings`);
             const defaultRouting = [
                { step_name: '1. Nối vải', is_required: false, cost: 0 },
                { step_name: '2. Chần gòn', is_required: true, cost: 0 },
                { step_name: '3. May thành phẩm', is_required: true, cost: 0 },
                { step_name: '4. Đóng gói', is_required: true, cost: 0 }
             ];
             form.setFieldValue('routings', resRoute.data.length ? resRoute.data : defaultRouting);

             // 3. Load Logistics
             const resLog = await axios.get(`${API}/products/${r.id}/logistics`);
             form.setFieldValue('logistics', resLog.data);
          } catch(e) {}
      }, 200);
      setIsModalOpen(true);
  };

  const columns = [
    { title: 'Sản Phẩm', dataIndex: 'name', key: 'name', render: (text:string, r:any) => r.isGroup ? <b>{text} <Tag>{r.children.length}</Tag></b> : <Space>{r.attributes?.color && <Tag color="magenta">{r.attributes.color}</Tag>} {text}</Space> },
    { title: 'SKU', dataIndex: 'sku', width: 150, render: (t:any, r:any) => r.isGroup ? '' : <b>{t}</b> },
    { title: 'Giá Bán', dataIndex: 'base_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? '' : Number(v).toLocaleString() },
    { title: 'Giá Vốn', dataIndex: 'cost_price', align: 'right' as const, width: 120, render: (v:any, r:any) => r.isGroup ? '' : <span style={{color:'red'}}>{Number(v).toLocaleString()}</span> },
    { title: '', key: 'action', width: 80, render: (_: any, r: any) => !r.isGroup && <Button icon={<EditOutlined />} onClick={() => openEditModal(r)} /> },
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
                    <Alert message="Nhập tay định mức nguyên liệu (Nếu chưa import Excel)" type="info" showIcon style={{marginBottom: 10}} />
                    <Form.List name="boms">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} style={{marginBottom: 8}}>
                                        <Col span={10}>
                                            <Form.Item {...restField} name={[name, 'material_id']} noStyle rules={[{ required: true, message: 'Chọn NPL' }]}>
                                                <Select placeholder="Chọn Nguyên Liệu..." showSearch optionFilterProp="label" options={materials} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}><Form.Item {...restField} name={[name, 'quantity']} noStyle><InputNumber placeholder="Định mức" style={{width:'100%'}} /></Form.Item></Col>
                                        <Col span={6}><Form.Item {...restField} name={[name, 'waste_percent']} noStyle><InputNumber placeholder="% Hao hụt" style={{width:'100%'}} /></Form.Item></Col>
                                        <Col span={2}><MinusCircleOutlined onClick={() => remove(name)} style={{color:'red'}} /></Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm nguyên liệu</Button>
                            </>
                        )}
                    </Form.List>
                    <Button type="primary" style={{marginTop:10}} onClick={handleSaveBoms} icon={<SaveOutlined />}>Lưu BOM</Button>
                  </>
              )
          },
          {
              key: '3', label: 'Quy Trình (Routing)',
              children: (
                  <>
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
                                                <Select placeholder="Nhà Gia Công..." options={suppliers} allowClear style={{width:'100%'}} bordered={false} />
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
                    <div style={{marginTop: 10}}>
                        <Button type="primary" onClick={handleSaveRouting} icon={<SaveOutlined />}>Lưu Quy Trình</Button>
                    </div>
                  </>
              )
          }
      ]} />
  );

  return (
    <div>
      <Card title="Quản lý Sản Phẩm"><Table columns={columns} dataSource={treeData} rowKey="key" loading={loading} bordered pagination={{ pageSize: 10 }} expandable={{ defaultExpandAllRows: true }} /></Card>
      <Modal title={editingItem ? `Chi tiết: ${editingItem.sku}` : "Thêm SP"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={850}>
        <Form form={form} layout="vertical" onFinish={handleSaveProduct}>{modalContent}</Form>
        {editingItem && (
            <div style={{marginTop: 20, paddingTop: 10, borderTop: '1px dashed #ccc', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <Button type="dashed" icon={<CopyOutlined />} onClick={handleSyncVariants}>Áp dụng BOM & Quy trình cho tất cả biến thể cùng loại</Button>
                <Button type="primary" danger icon={<CalculatorOutlined />} onClick={handleCalculateCost}>Tính Lại Giá Vốn</Button>
            </div>
        )}
      </Modal>
    </div>
  );
};
export default ProductsPage;
