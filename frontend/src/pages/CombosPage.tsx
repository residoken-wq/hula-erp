import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Typography, Row, Col, Statistic, Divider } from 'antd';
import { ReloadOutlined, PlusOutlined, DeleteOutlined, GiftOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

import { API_URL } from '../config'; const API = `${API_URL}/products`;

const CombosPage: React.FC = () => {
  const [combos, setCombos] = useState([]); // Danh sach Combo
  const [products, setProducts] = useState([]); // Danh sach SP le de chon
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // State luu gia tri tinh toan
  const [refPrice, setRefPrice] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try { 
      const res = await axios.get(API);
      const allData = Array.isArray(res.data) ? res.data : [];
      
      // 1. Loc ra danh sach SP le (khong phai combo) de lam nguyen lieu
      const singleProducts = allData.filter((p: any) => 
        !((p.category||'').toLowerCase().includes('combo') || (p.product_type||'').toLowerCase().includes('bộ'))
      );
      setProducts(singleProducts.map((p:any) => ({ 
          label: `${p.sku} - ${p.name} (${Number(p.base_price).toLocaleString()}đ)`, 
          value: p.sku,
          price: Number(p.base_price) || 0 // Luu gia de tinh toan
      })));

      // 2. Loc ra danh sach Combo de hien thi len bang
      const comboList = allData.filter((p: any) => 
        (p.category||'').toLowerCase().includes('combo') || (p.product_type||'').toLowerCase().includes('bộ')
      );
      setCombos(comboList);

    } catch (e) { message.error('Lỗi kết nối Server'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC TINH GIA TU DONG ---
  const handleFormChange = (_: any, allValues: any) => {
      const components = allValues.components || [];
      let total = 0;
      
      components.forEach((comp: any) => {
          if (comp?.sku && comp?.quantity) {
              const prod = products.find((p:any) => p.value === comp.sku);
              if (prod) {
                  total += (prod.price * comp.quantity);
              }
          }
      });

      setRefPrice(total);
      
      // Tu dong dien gia tham khao
      form.setFieldValue('ref_price_display', total);
      
      // Tu dong dien gia chinh thuc (neu nguoi dung chua nhap gi hoac muon reset)
      // O day ta chi goi y, nguoi dung sua lai sau
      // form.setFieldValue('base_price', total); 
  };

  const handleSave = async (values: any) => {
    try {
      // 1. Tao San Pham Cha (Combo) truoc
      const productPayload = {
          sku: values.sku,
          name: values.name,
          category: 'Combo',
          product_type: 'Bộ',
          unit: 'Bộ',
          base_price: values.base_price, // Gia chinh thuc user chot
          quantity_in_stock: 0, // Combo khong co ton kho vat ly
          is_active: true
      };

      // Goi API Tao SP
      await axios.post(API, productPayload);

      // 2. Tao lien ket cac mon con (Add Components)
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
      setIsModalOpen(false); 
      fetchData();
    } catch (e) { message.error('Lỗi tạo combo (Có thể trùng mã SKU)'); }
  };

  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API}/${id}`); fetchData(); } catch (e) { message.error('Lỗi xóa'); }
  };

  const columns = [
    { title: 'Mã Combo', dataIndex: 'sku', render: (t:any) => <b>{t}</b> },
    { title: 'Tên Bộ Sản Phẩm', dataIndex: 'name' },
    { title: 'Loại', dataIndex: 'product_type', render: (t:any) => <Tag color="purple">{t}</Tag> },
    { title: 'Giá Bán', dataIndex: 'base_price', align: 'right' as const, render: (v:any) => <b style={{color:'green', fontSize:16}}>{Number(v).toLocaleString()} đ</b> },
    { 
      title: '', key: 'action', align: 'right' as const,
      render: (_: any, record: any) => (
        <Popconfirm title="Xóa combo này?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger type="text" />
        </Popconfirm>
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
           <Button icon={<PlusOutlined />} type="primary" onClick={() => { form.resetFields(); setIsModalOpen(true); setRefPrice(0); }}>Tạo Combo Mới</Button>
           <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={combos} rowKey="id" loading={loading} bordered />
      </Card>

      <Modal title="Tạo Bộ Sản Phẩm Mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} width={800}>
        <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={handleFormChange}>
          <Row gutter={16}>
             <Col span={12}><Form.Item name="sku" label="Mã Combo (SKU)" rules={[{ required: true }]}><Input placeholder="VD: BO_TET_2025" /></Form.Item></Col>
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
                        <Select showSearch placeholder="Chọn sản phẩm..." options={products} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
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
                        <InputNumber 
                            style={{width:'100%', color: '#888'}} 
                            disabled 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="base_price" label="Giá Bán Chính Thức" rules={[{ required: true }]} tooltip="Giá bạn muốn bán cho khách (có thể giảm giá so với tổng)">
                        <InputNumber 
                            style={{width:'100%', fontWeight: 'bold', color: 'green'}} 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                        />
                    </Form.Item>
                </Col>
             </Row>
             <div style={{textAlign: 'right', color: '#888'}}>
                <i>* Đơn vị tính mặc định: <b>Bộ</b></i>
             </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
export default CombosPage;
