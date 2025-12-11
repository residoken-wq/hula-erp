import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Typography, Row, Col, Statistic, Divider } from 'antd';
import { ReloadOutlined, PlusOutlined, DeleteOutlined, GiftOutlined, MinusCircleOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

import { API_URL } from '../config'; const API = `${API_URL}/products`;

const CombosPage: React.FC = () => {
  const [combos, setCombos] = useState([]); // Danh sach Combo
  const [products, setProducts] = useState([]); // Danh sach SP le de chon
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // State luu item dang sua
  const [form] = Form.useForm();

  const [refPrice, setRefPrice] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try { 
      const res = await axios.get(API);
      const allData = Array.isArray(res.data) ? res.data : [];
      
      const singleProducts = allData.filter((p: any) => 
        !((p.category||'').toLowerCase().includes('combo') || (p.product_type||'').toLowerCase().includes('bộ'))
      );
      setProducts(singleProducts.map((p:any) => ({ 
          label: `${p.sku} - ${p.name} (${Number(p.base_price).toLocaleString()}đ)`, 
          value: p.sku,
          price: Number(p.base_price) || 0 
      })));

      const comboList = allData.filter((p: any) => 
        (p.category||'').toLowerCase().includes('combo') || (p.product_type||'').toLowerCase().includes('bộ')
      );
      setCombos(comboList);

    } catch (e) { message.error('Lỗi kết nối Server'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC TINH GIA ---
  const handleFormChange = (_: any, allValues: any) => {
      const components = allValues.components || [];
      let total = 0;
      components.forEach((comp: any) => {
          if (comp?.sku && comp?.quantity) {
              const prod = products.find((p:any) => p.value === comp.sku);
              if (prod) total += (prod.price * comp.quantity);
          }
      });
      setRefPrice(total);
      form.setFieldValue('ref_price_display', total);
  };

  // --- SAVE ---
  const handleSave = async (values: any) => {
    try {
      const productPayload = {
          sku: values.sku,
          name: values.name,
          category: 'Combo',
          product_type: 'Bộ',
          unit: 'Bộ',
          base_price: values.base_price,
          quantity_in_stock: 0,
          is_active: true
      };

      if (editingItem) {
          // UPDATE
          await axios.put(`${API}/${editingItem.id}`, productPayload);
          // Update Components
          if (values.components) {
              await axios.post(`${API}/${editingItem.id}/components`, values.components);
          }
          message.success('Cập nhật thành công');
      } else {
          // CREATE
          await axios.post(API, productPayload);
          // Add Components loop (for Create we use loop because ID is not available until created - but wait, we don't have ID returned properly in create sometimes, let's fix logic)
          // Actually, create returns the object.
          // But to be safe and consistent, we can just use the loop logic for create
          // Or fetch the newly created item by SKU then add components.
          // Simple way for Create:
          if (values.components && values.components.length > 0) {
              for (const comp of values.components) {
                  await axios.post(`${API}/combo/add`, { 
                      parentSku: values.sku, 
                      childSku: comp.sku, 
                      qty: comp.quantity 
                  });
              }
          }
          message.success('Tạo Combo thành công'); 
      }
      
      setIsModalOpen(false); 
      fetchData();
    } catch (e) { message.error('Lỗi lưu combo'); }
  };

  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API}/${id}`); fetchData(); } catch (e) { message.error('Lỗi xóa'); }
  };

  // --- OPEN EDIT ---
  const handleEdit = async (record: any) => {
      setEditingItem(record);
      form.setFieldsValue({
          sku: record.sku,
          name: record.name,
          base_price: record.base_price
      });
      
      // Load components
      try {
          const res = await axios.get(`${API}/combo/${record.sku}`);
          const comps = res.data.map((c:any) => ({
              sku: c.child_product.sku,
              quantity: c.quantity
          }));
          form.setFieldValue('components', comps);
          
          // Trigger calc price
          handleFormChange(null, { components: comps });
      } catch(e) {}

      setIsModalOpen(true);
  };

  const columns = [
    { title: 'Mã Combo', dataIndex: 'sku', render: (t:any) => <b>{t}</b> },
    { title: 'Tên Bộ Sản Phẩm', dataIndex: 'name' },
    { title: 'Giá Bán', dataIndex: 'base_price', align: 'right' as const, render: (v:any) => <b style={{color:'green', fontSize:16}}>{Number(v).toLocaleString()} đ</b> },
    { 
      title: '', key: 'action', align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
            <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
            <Popconfirm title="Xóa combo này?" onConfirm={() => handleDelete(record.id)}>
                <Button icon={<DeleteOutlined />} size="small" danger type="text" />
            </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="Số lượng Combo đang bán" value={combos.length} prefix={<GiftOutlined />} /></Card></Col>
      </Row>

      <Card title="Quản Lý Combo Sản Phẩm" extra={
        <Space>
           <Button icon={<PlusOutlined />} type="primary" onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); setRefPrice(0); }}>Tạo Combo Mới</Button>
           <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={combos} rowKey="id" loading={loading} bordered />
      </Card>

      <Modal title={editingItem ? "Cập Nhật Combo" : "Tạo Bộ Sản Phẩm Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} width={800}>
        <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={handleFormChange}>
          <Row gutter={16}>
             <Col span={12}><Form.Item name="sku" label="Mã Combo (SKU)" rules={[{ required: true }]}><Input placeholder="VD: BO_TET_2025" disabled={!!editingItem} /></Form.Item></Col>
             <Col span={12}><Form.Item name="name" label="Tên Combo" rules={[{ required: true }]}><Input placeholder="VD: Bộ Quà Tết" /></Form.Item></Col>
          </Row>
          
          <Divider orientation="left">Thành phần (Chọn sản phẩm con)</Divider>
          
          <Form.List name="components">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" style={{marginBottom: 10}}>
                    <Col span={14}>
                      <Form.Item {...restField} name={[name, 'sku']} rules={[{ required: true, message: 'Chon SP' }]} style={{marginBottom:0}}>
                        <Select showSearch placeholder="Chọn sản phẩm..." options={products} filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Nhap SL' }]} style={{marginBottom:0}}>
                        <InputNumber min={1} placeholder="Số lượng" style={{width: '100%'}} addonAfter="Cái" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{color:'red'}} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm sản phẩm vào bộ</Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div style={{ background: '#f6ffed', padding: '15px', borderRadius: 8, border: '1px solid #b7eb8f' }}>
             <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="ref_price_display" label="Giá Tham Khảo (Tổng giá con)" tooltip="Tự động cộng giá bán lẻ của các món thành phần">
                        <InputNumber style={{width:'100%', color: '#888'}} disabled formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="base_price" label="Giá Bán Chính Thức" rules={[{ required: true }]} tooltip="Giá bạn muốn bán cho khách">
                        <InputNumber style={{width:'100%', fontWeight: 'bold', color: 'green'}} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                </Col>
             </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
export default CombosPage;