import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, InputNumber, Select, Row, Col, Space, Divider, Tooltip, Statistic, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, GiftOutlined, DollarOutlined, EditOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const CombosPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // State cho item đang edit
  const [form] = Form.useForm();

  // Dữ liệu sản phẩm dưới dạng Map để dễ dàng tra cứu giá
  const productMap = useMemo(() => {
    return products.reduce((acc, p) => {
        // Lấy SKU/Value ra khỏi label
        const sku = p.value;
        const price = p.price;
        acc[sku] = { price: price, name: p.label.split(' - ')[1], unit: p.unit };
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
                price: Number(p.base_price) || 0, // Lưu giá bán vào options
                unit: p.unit
            })));

            // Lọc sản phẩm là COMBO
            const comboList = resProd.data.filter((p:any) => p.product_type === 'COMBO');
            setCombos(comboList);
        }
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- HÀM TẢI CHI TIẾT COMBO (ĐỂ EDIT) ---
  const fetchComboDetail = async (comboSku: string) => {
      try {
          // API: GET /products/combo/:sku trả về các ProductComponent
          const res = await axios.get(`${API_URL}/products/combo/${comboSku}`);
          // Chuyển đổi dữ liệu trả về sang định dạng Form.List mong muốn
          return (res.data || []).map((comp: any) => ({
              sku: comp.child_product.sku,
              quantity: comp.quantity,
              // ID của Component, cần cho việc xóa (nếu có)
              id: comp.id
          }));
      } catch(e) {
          message.error('Lỗi tải chi tiết thành phần Combo');
          return [];
      }
  };

  // --- HÀM MỞ EDIT ---
  const openEdit = async (record: any) => {
      setEditingItem(record);
      form.resetFields();
      
      const comboItems = await fetchComboDetail(record.sku);
      
      // Tính total ban đầu để hiển thị ngay trong form
      let initialTotal = 0;
      comboItems.forEach((item: any) => {
          const productInfo = productMap[item.sku] || { price: 0 };
          initialTotal += Number(item.quantity) * Number(productInfo.price);
      });

      form.setFieldsValue({
          sku: record.sku,
          name: record.name,
          items: comboItems,
          total_price_calculated: Math.round(initialTotal)
      });
      setIsModalOpen(true);
  };


  // --- HÀM LƯU COMBO ---
  const handleSave = async (values: any) => {
      try {
          const { sku, name, items } = values;

          let comboProduct = editingItem;
          
          if (!comboProduct) {
              // 1. TẠO MỚI (Product Type: COMBO)
              const res = await axios.post(`${API_URL}/products`, {
                  sku: sku,
                  name: name,
                  product_type: 'COMBO',
                  base_price: form.getFieldValue('total_price_calculated'), 
                  is_active: true
              });
              comboProduct = res.data;
          } else {
              // 1. CẬP NHẬT thông tin chung (giá bán)
              await axios.put(`${API_URL}/products/${comboProduct.id}`, {
                  name: name,
                  base_price: form.getFieldValue('total_price_calculated'),
              });
          }

          if (!comboProduct || !comboProduct.id) {
              throw new Error("Không thể tạo hoặc tìm thấy ID Combo.");
          }

          // 2. Lưu các thành phần Combo (Components)
          const componentPayload = items.map((item: any) => ({
              sku: item.sku,
              quantity: item.quantity
          }));
          
          // API /products/:id/components sẽ xóa component cũ và tạo mới toàn bộ
          await axios.post(`${API_URL}/products/${comboProduct.id}/components`, componentPayload);
          
          message.success(`Đã lưu Combo ${sku} thành công!`);
          setIsModalOpen(false);
          setEditingItem(null);
          fetchData(); // Cập nhật danh sách Combo
      } catch(e: any) { 
          let errorMessage = "Lỗi lưu Combo.";
          if (axios.isAxiosError(e) && e.response?.data?.message) {
              errorMessage = e.response.data.message;
          }
          message.error(`Lỗi: ${errorMessage}`);
      }
  };

  // --- HÀM XÓA COMBO ---
  const handleDelete = async (id: number) => {
      try {
          // DELETE /products/:id sẽ xóa sản phẩm
          await axios.delete(`${API_URL}/products/${id}`);
          message.success('Đã xóa Combo thành công.');
          fetchData();
      } catch(e: any) {
          let errorMessage = "Lỗi xóa Combo. Có thể Combo này đã được sử dụng.";
          if (axios.isAxiosError(e) && e.response?.status === 400) {
               // Giả định Backend trả về 400/409 nếu có ràng buộc
               errorMessage = e.response.data.message || "Combo này đã được sử dụng trong Đơn hàng/Báo giá và không thể xóa.";
          }
          Modal.warning({
              title: 'Không thể xóa Combo',
              icon: <WarningOutlined />,
              content: errorMessage,
              okText: 'Đóng'
          });
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
          title: '', key: 'action', width: 100, align: 'center' as const,
          render: (r: any) => (
             <Space size="small">
                 <Button icon={<EditOutlined/>} size="small" onClick={() => openEdit(r)} />
                 <Popconfirm 
                    title="Xóa Combo này?" 
                    onConfirm={() => handleDelete(r.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                 >
                    <Button icon={<DeleteOutlined/>} danger size="small" />
                 </Popconfirm>
             </Space>
          ) 
      }
  ];

  return (
    <Card 
        title="Quản lý Combo Quà Tặng" 
        extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true);}}>Tạo Combo</Button>}
    >
        <Table 
            dataSource={combos} 
            columns={columns} 
            rowKey="id" 
            loading={loading} 
            locale={{ emptyText: "Chưa có Combo nào được tạo." }} 
        />
        
        <Modal 
            title={<span><GiftOutlined /> {editingItem ? `Chỉnh sửa Combo: ${editingItem.sku}` : "Thiết lập Combo"}</span>} 
            open={isModalOpen} 
            onCancel={()=>{setIsModalOpen(false); form.resetFields(); setEditingItem(null);}} 
            onOk={()=>form.submit()} 
            width={1000} 
            okText={editingItem ? "Lưu Cập Nhật" : "Tạo Combo"}
        >
            <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSave}
                onValuesChange={calculateTotal} // Gọi hàm tính toán Total
            >
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="sku" label="Mã Combo" rules={[{required:true}]}><Input disabled={!!editingItem} /></Form.Item></Col>
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
                                const unit = productMap[currentSku]?.unit || 'Cái';

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
                                                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
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
                                                    label={`Số lượng (${unit})`}
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