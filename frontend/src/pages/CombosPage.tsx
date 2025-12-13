import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, InputNumber, Select, Row, Col, Space, Divider, Tooltip, Statistic, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, GiftOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const CombosPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Dữ liệu sản phẩm dưới dạng Map để dễ dàng tra cứu giá
  const productMap = useMemo(() => {
    return products.reduce((acc, p) => {
        // Lấy SKU/Value ra khỏi label
        const sku = p.value;
        const price = p.price;
        acc[sku] = { price: price, name: p.label.split(' - ')[1] };
        return acc;
    }, {});
  }, [products]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const resProd = await axios.get(`${API_URL}/products`);
        if (Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => ({
                label: `${p.sku} - ${p.name}`, 
                value: p.sku, 
                price: Number(p.base_price) || 0 // Lưu giá bán vào options
            })));

            // Lọc sản phẩm là COMBO
            const comboList = resProd.data.filter((p:any) => p.product_type === 'COMBO');
            setCombos(comboList);
        }
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- HÀM LƯU COMBO (FIX & TRIỂN KHAI) ---
  const handleSave = async (values: any) => {
      try {
          const { sku, name, items } = values;

          // 1. Lưu thông tin chung của Combo (Tạo mới nếu chưa có)
          let comboProduct = combos.find(c => c.sku === sku);
          
          if (!comboProduct) {
              // Tạo sản phẩm mới (Type: COMBO)
              const res = await axios.post(`${API_URL}/products`, {
                  sku: sku,
                  name: name,
                  product_type: 'COMBO',
                  base_price: form.getFieldValue('total_price_calculated'), // Sử dụng giá tính toán
                  is_active: true
              });
              comboProduct = res.data;
          } else {
              // Cập nhật giá bán nếu là Combo đã tồn tại
              await axios.put(`${API_URL}/products/${comboProduct.id}`, {
                  base_price: form.getFieldValue('total_price_calculated'),
              });
          }

          if (!comboProduct || !comboProduct.id) {
              throw new Error("Không thể tạo hoặc tìm thấy ID Combo.");
          }

          // 2. Lưu các thành phần Combo (Components)
          // API /products/:id/components dự kiến nhận [{ sku: 'CHILD_SKU', quantity: 1 }]
          const componentPayload = items.map((item: any) => ({
              sku: item.sku,
              quantity: item.quantity
          }));

          await axios.post(`${API_URL}/products/${comboProduct.id}/components`, componentPayload);
          
          message.success('Đã lưu Combo thành công và cập nhật thành phần!');
          setIsModalOpen(false);
          fetchData(); // Cập nhật danh sách Combo
      } catch(e) { 
          let errorMessage = "Lỗi lưu Combo.";
          if (axios.isAxiosError(e) && e.response?.data?.message) {
              errorMessage = e.response.data.message;
          }
          message.error(`Lỗi: ${errorMessage}`);
      }
  };

  // --- HÀM TÍNH TOÁN TỔNG TIỀN TRÊN FORM ---
  const calculateTotal = (changedValues: any, allValues: any) => {
    const items = allValues.items || [];
    let total = 0;

    items.forEach((item: any) => {
        if (item.sku && item.quantity) {
            const productInfo = productMap[item.sku];
            if (productInfo) {
                total += Number(item.quantity) * Number(productInfo.price);
            }
        }
    });

    // Lưu tổng tiền vào một trường ẩn trên form để có thể submit
    form.setFieldsValue({ total_price_calculated: Math.round(total) });
  };
  // ------------------------------------------

  const columns = [
      { title: 'Mã Combo', dataIndex: 'sku', render: (t:any) => <b>{t}</b> },
      { title: 'Tên Combo', dataIndex: 'name' },
      { title: 'Giá bán', dataIndex: 'base_price', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() + ' ₫' },
      { 
          title: '', key: 'action', width: 70, 
          render: (r: any) => (
             <Popconfirm title="Xóa Combo này?" onConfirm={() => message.info('Tính năng xóa đang phát triển')}>
                <Button icon={<DeleteOutlined/>} danger size="small" />
             </Popconfirm>
          ) 
      }
  ];

  return (
    <Card 
        title="Quản lý Combo Quà Tặng" 
        extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{form.resetFields(); setIsModalOpen(true);}}>Tạo Combo</Button>}
    >
        <Table dataSource={combos} columns={columns} rowKey="id" loading={loading} locale={{ emptyText: "Chưa có Combo nào được tạo." }} />
        
        <Modal 
            title={<span><GiftOutlined /> Thiết lập Combo</span>} 
            open={isModalOpen} 
            onCancel={()=>{setIsModalOpen(false); form.resetFields();}} 
            onOk={()=>form.submit()} 
            width={1000} // Mở rộng để chứa cột giá
        >
            <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSave}
                onValuesChange={calculateTotal} // Gọi hàm tính toán Total
            >
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="sku" label="Mã Combo" rules={[{required:true}]}><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="name" label="Tên Combo" rules={[{required:true}]}><Input /></Form.Item></Col>
                </Row>
                
                <Divider orientation="left">Sản phẩm Thành phần</Divider>
                
                {/* Trường ẩn để lưu giá tính toán */}
                <Form.Item name="total_price_calculated" hidden><InputNumber /></Form.Item>

                <Row gutter={16}>
                    <Col span={12}>**Sản phẩm con**</Col>
                    <Col span={4} style={{textAlign: 'right'}}>**Giá bán**</Col>
                    <Col span={4}>**SL**</Col>
                    <Col span={4} style={{textAlign: 'right'}}>**Thành tiền**</Col>
                </Row>
                <Divider style={{ margin: '8px 0' }} />

                <Form.List name="items">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => {
                                const currentSku = form.getFieldValue(['items', name, 'sku']);
                                const currentQty = form.getFieldValue(['items', name, 'quantity']) || 0;
                                const productInfo = productMap[currentSku] || { price: 0 };
                                const price = productInfo.price;
                                const lineTotal = currentQty * price;

                                return (
                                    <Card 
                                        key={key} 
                                        size="small"
                                        style={{ marginBottom: 16 }}
                                        title={`Sản phẩm ${index + 1}`}
                                        extra={
                                            <Tooltip title="Xóa sản phẩm này">
                                                <Button 
                                                    icon={<DeleteOutlined/>} 
                                                    onClick={() => remove(name)} 
                                                    danger 
                                                    size="small"
                                                />
                                            </Tooltip>
                                        }
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item 
                                                    key={`sku-${key}`} 
                                                    {...restField} 
                                                    name={[name, 'sku']} 
                                                    label="Sản phẩm con"
                                                    rules={[{ required: true, message: 'Vui lòng chọn SKU' }]}
                                                >
                                                    <Select 
                                                        placeholder="Tìm kiếm SKU hoặc Tên sản phẩm" 
                                                        options={products} 
                                                        showSearch 
                                                        optionFilterProp="label" 
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            
                                            <Col span={4}>
                                                <Form.Item label="Giá bán" style={{marginBottom: 0}}>
                                                    <Input value={Number(price).toLocaleString() + ' ₫'} disabled />
                                                </Form.Item>
                                            </Col>
                                            
                                            <Col span={4}>
                                                <Form.Item 
                                                    key={`qty-${key}`} 
                                                    {...restField} 
                                                    name={[name, 'quantity']} 
                                                    label="Số lượng"
                                                    rules={[{ required: true, message: 'Nhập SL' }]}
                                                >
                                                    <InputNumber 
                                                        min={1} 
                                                        placeholder="SL" 
                                                        style={{ width: '100%' }} 
                                                    />
                                                </Form.Item>
                                            </Col>
                                            
                                            <Col span={4}>
                                                <Form.Item label="Thành tiền" style={{marginBottom: 0}}>
                                                    <Input value={Number(lineTotal).toLocaleString() + ' ₫'} disabled />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                );
                            })}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm sản phẩm vào Combo</Button>
                        </>
                    )}
                </Form.List>
                
                <Divider />
                
                <Row justify="end" style={{ paddingRight: 16 }}>
                    <Statistic 
                        title="TỔNG GIÁ VỐN COMBO (Giá bán SP con)" 
                        value={form.getFieldValue('total_price_calculated') || 0} 
                        precision={0} 
                        valueStyle={{ color: '#3f8600', fontSize: 24, fontWeight: 'bold' }} 
                        prefix={<DollarOutlined />}
                        suffix="₫"
                    />
                </Row>
            </Form>
        </Modal>
    </Card>
  );
};

export default CombosPage;