import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, InputNumber, Select, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const CombosPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  // FIX: Định nghĩa rõ kiểu mảng để tránh lỗi "never[]"
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
        const resProd = await axios.get(`${API_URL}/products`);
        if (Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => ({
                label: `${p.sku} - ${p.name}`, 
                value: p.sku, 
                price: Number(p.base_price) || 0
            })));

            // Lọc sản phẩm là COMBO
            const comboList = resProd.data.filter((p:any) => p.product_type === 'COMBO');
            setCombos(comboList);
        }
    } catch(e) { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
      console.log('Saving combo:', values); // Dùng biến values để không bị lỗi unused
      message.success('Tính năng đang phát triển');
      setIsModalOpen(false);
  };

  const columns = [
      { title: 'Mã Combo', dataIndex: 'sku', render: (t:any) => <b>{t}</b> },
      { title: 'Tên Combo', dataIndex: 'name' },
      { title: 'Giá bán', dataIndex: 'base_price', render: (v:any) => Number(v).toLocaleString() },
      { title: '', render: () => <Button icon={<DeleteOutlined/>} danger size="small" /> }
  ];

  return (
    <Card title="Quản lý Combo Quà Tặng" extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>setIsModalOpen(true)}>Tạo Combo</Button>}>
        <Table dataSource={combos} columns={columns} rowKey="id" loading={loading} />
        
        <Modal title="Thiết lập Combo" open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()} width={700}>
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="sku" label="Mã Combo" rules={[{required:true}]}><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="name" label="Tên Combo" rules={[{required:true}]}><Input /></Form.Item></Col>
                </Row>
                <Form.List name="items">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Row key={key} gutter={8} style={{marginBottom:10}}>
                                    <Col span={14}>
                                        <Form.Item {...restField} name={[name, 'sku']} noStyle rules={[{ required: true }]}>
                                            <Select placeholder="Chọn sản phẩm con" options={products} showSearch optionFilterProp="label" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item {...restField} name={[name, 'quantity']} noStyle rules={[{ required: true }]}>
                                            <InputNumber min={1} placeholder="SL" style={{width:'100%'}} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={2}><DeleteOutlined onClick={() => remove(name)} style={{color:'red'}} /></Col>
                                </Row>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm sản phẩm vào Combo</Button>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    </Card>
  );
};

export default CombosPage;