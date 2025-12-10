import React, { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, InputNumber, Select, Space, DatePicker, Typography, Divider, Row, Col, Popconfirm, Statistic, Tabs, Badge, Avatar } from 'antd';
import { PlusOutlined, ReloadOutlined, UserOutlined, ShoppingCartOutlined, PrinterOutlined, CheckCircleOutlined, DeleteOutlined, MinusCircleOutlined, CalculatorOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Text, Title } = Typography;
const { Option } = Select;

const SalesPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Master Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form handling
  const [form] = Form.useForm();
  const selectedCustomerId = Form.useWatch('customer_id', form);
  const itemsValue = Form.useWatch('items', form);

  // --- 1. LOAD DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Load Orders (Backend cần API GET /sales - nếu chưa có sẽ catch lỗi)
      try {
          const res = await axios.get(`${API_URL}/sales`); // Bạn cần bổ sung findAll bên Controller
          if(Array.isArray(res.data)) setOrders(res.data);
      } catch(e) { console.log('Chưa có API List Sales'); }

      // Load Customers
      const resCust = await axios.get(`${API_URL}/customers`);
      setCustomers(resCust.data);

      // Load Products
      const resProd = await axios.get(`${API_URL}/products`);
      setProducts(resProd.data.map((p:any) => ({
          label: `${p.sku} - ${p.name}`,
          value: p.sku,
          price: Number(p.base_price) || 0,
          stock: Number(p.quantity_in_stock) || 0,
          name: p.name
      })));

    } catch (e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. LOGIC TÍNH TOÁN & KHÁCH HÀNG ---
  
  // Thông tin khách hàng đang chọn (để hiển thị công nợ)
  const currentCustomer = useMemo(() => {
      return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  // Tính tổng tiền đơn hàng
  const orderTotal = useMemo(() => {
      if(!itemsValue || !Array.isArray(itemsValue)) return 0;
      return itemsValue.reduce((sum, item) => sum + (Number(item?.quantity||0) * Number(item?.price||0)), 0);
  }, [itemsValue]);

  // Cảnh báo công nợ
  const creditWarning = useMemo(() => {
      if(!currentCustomer) return null;
      const limit = Number(currentCustomer.credit_limit) || 0;
      const debt = Number(currentCustomer.current_debt) || 0;
      const remaining = limit - debt;
      const afterOrder = debt + orderTotal;
      
      if (limit > 0 && afterOrder > limit) {
          return { type: 'danger', msg: `Vượt hạn mức! (Dư nợ: ${remaining.toLocaleString()} - Đơn này: ${orderTotal.toLocaleString()})` };
      }
      return { type: 'success', msg: `Khả dụng: ${remaining.toLocaleString()} đ` };
  }, [currentCustomer, orderTotal]);


  // --- 3. ACTIONS ---
  const handleCreateOrder = async (values: any) => {
      try {
          const payload = {
              order_code: values.order_code || `SO-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*1000)}`,
              customer_id: values.customer_id,
              customer_name: currentCustomer?.name,
              items: values.items.map((i:any) => ({
                  sku: i.sku,
                  quantity: i.quantity,
                  price: i.price
              }))
          };
          
          await axios.post(`${API_URL}/sales/create`, payload);
          message.success('Tạo đơn hàng thành công');
          setIsModalOpen(false);
          fetchData();
      } catch (e: any) { 
          message.error(e.response?.data?.message || 'Lỗi tạo đơn'); 
      }
  };

  // --- 4. COLUMNS TABLE ---
  const columns = [
      { 
          title: 'Mã Đơn', dataIndex: 'order_code', 
          render: (t:any) => <b style={{color:'#1890ff'}}>{t}</b> 
      },
      { 
          title: 'Khách Hàng', dataIndex: 'customer',
          render: (c:any, r:any) => (
              <div>
                  <div>{c?.name || r.customer_name}</div>
                  <small style={{color:'#888'}}>{c?.phone}</small>
              </div>
          )
      },
      { 
          title: 'Tổng Tiền', dataIndex: 'total_amount', align: 'right' as const,
          render: (v:any) => <b>{Number(v).toLocaleString()} đ</b>
      },
      { 
          title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const,
          render: (t:string) => {
              const color = t === 'DRAFT' ? 'default' : t === 'CONFIRMED' ? 'blue' : t === 'PLANNED' ? 'purple' : t === 'COMPLETED' ? 'green' : 'red';
              return <Tag color={color}>{t}</Tag>;
          }
      },
      {
          title: 'Lợi Nhuận Gộp', key: 'profit', align: 'right' as const,
          render: (_:any, r:any) => {
              const profit = Number(r.total_amount) - Number(r.total_cost);
              const percent = r.total_amount > 0 ? (profit/r.total_amount)*100 : 0;
              return <Tooltip title={`Giá vốn: ${Number(r.total_cost).toLocaleString()}`}><span style={{color: percent<10 ? 'red' : 'green'}}>{percent.toFixed(1)}%</span></Tooltip>
          }
      }
  ];

  // --- 5. RENDER ---
  return (
    <div className="sales-page">
        <Row gutter={16} style={{marginBottom: 20}}>
            <Col span={6}><Card><Statistic title="Doanh số hôm nay" value={0} prefix={<ShoppingCartOutlined />} suffix="đ" /></Card></Col>
            <Col span={6}><Card><Statistic title="Đơn chờ duyệt" value={orders.filter(o=>o.status==='DRAFT').length} valueStyle={{color:'#faad14'}} /></Card></Col>
            <Col span={6}><Card><Statistic title="Đang sản xuất (Planned)" value={orders.filter(o=>o.status==='PLANNED').length} valueStyle={{color:'#722ed1'}} /></Card></Col>
        </Row>

        <Card 
            title="Quản Lý Đơn Hàng (CRM)" 
            extra={
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={()=>{form.resetFields(); setIsModalOpen(true)}}>Tạo Đơn Hàng</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>Tải lại</Button>
                </Space>
            }
        >
            <Tabs defaultActiveKey="ALL" items={[
                { label: 'Tất cả', key: 'ALL', children: <Table dataSource={orders} columns={columns} rowKey="id" loading={loading} /> },
                { label: 'Nháp (Draft)', key: 'DRAFT', children: <Table dataSource={orders.filter(o=>o.status==='DRAFT')} columns={columns} rowKey="id" /> },
                { label: 'Đã Chốt', key: 'CONFIRMED', children: <Table dataSource={orders.filter(o=>o.status==='CONFIRMED')} columns={columns} rowKey="id" /> },
                { label: 'Đang SX', key: 'PLANNED', children: <Table dataSource={orders.filter(o=>o.status==='PLANNED')} columns={columns} rowKey="id" /> },
            ]} />
        </Card>

        {/* MODAL TẠO ĐƠN */}
        <Modal 
            title={<Space><ShoppingCartOutlined /> Tạo Đơn Bán Hàng Mới</Space>} 
            open={isModalOpen} 
            onCancel={()=>setIsModalOpen(false)} 
            onOk={()=>form.submit()} 
            width={900}
            style={{top: 20}}
        >
            <Form form={form} layout="vertical" onFinish={handleCreateOrder} initialValues={{ items: [{}] }}>
                
                {/* SECTION 1: KHÁCH HÀNG */}
                <div style={{background: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 20}}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="customer_id" label="Khách Hàng" rules={[{required:true}]}>
                                <Select 
                                    showSearch 
                                    placeholder="Tìm khách hàng (Tên, SĐT)..." 
                                    optionFilterProp="children"
                                    filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                    options={customers.map(c => ({label: `${c.name} (${c.phone})`, value: c.id}))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="order_code" label="Mã Đơn (Để trống tự tạo)">
                                <Input prefix="#" placeholder="SO-..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* INFO CÔNG NỢ */}
                    {currentCustomer && (
                        <Row gutter={16} style={{marginTop: -10}}>
                            <Col span={24}>
                                <div style={{display:'flex', gap: 20, fontSize: 13}}>
                                    <span><UserOutlined /> MST: <b>{currentCustomer.tax_code}</b></span>
                                    <span>Hạn mức: <b>{Number(currentCustomer.credit_limit).toLocaleString()}</b></span>
                                    <span style={{color:'red'}}>Nợ hiện tại: <b>{Number(currentCustomer.current_debt).toLocaleString()}</b></span>
                                    {creditWarning && (
                                        <Tag color={creditWarning.type === 'danger' ? 'red' : 'green'}>{creditWarning.msg}</Tag>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}
                </div>

                {/* SECTION 2: DANH SÁCH SẢN PHẨM */}
                <Divider orientation="left">Chi tiết đơn hàng</Divider>
                <div style={{background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 10}}>
                    <Row gutter={8} style={{fontWeight:'bold', marginBottom: 5, paddingLeft: 5}}>
                        <Col span={10}>Sản Phẩm</Col>
                        <Col span={4}>Số Lượng</Col>
                        <Col span={4}>Đơn Giá</Col>
                        <Col span={4} style={{textAlign:'right'}}>Thành Tiền</Col>
                    </Row>
                    
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <div style={{maxHeight: 300, overflowY: 'auto'}}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{marginBottom: 8}}>
                                        <Col span={10}>
                                            <Form.Item {...restField} name={[name, 'sku']} noStyle rules={[{required:true}]}>
                                                <Select 
                                                    showSearch placeholder="Chọn SP..." 
                                                    options={products} 
                                                    style={{width:'100%'}} 
                                                    onChange={(val) => {
                                                        // Tự động điền giá khi chọn SP
                                                        const p = products.find(i => i.value === val);
                                                        if(p) {
                                                            const items = form.getFieldValue('items');
                                                            items[name].price = p.price;
                                                            form.setFieldsValue({ items });
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                            {/* Show Stock */}
                                            <Form.Item shouldUpdate noStyle>
                                                {() => {
                                                    const sku = form.getFieldValue(['items', name, 'sku']);
                                                    const p = products.find(i => i.value === sku);
                                                    return p ? <div style={{fontSize:11, color: p.stock>0?'green':'red'}}>Tồn: {p.stock}</div> : null;
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item {...restField} name={[name, 'quantity']} noStyle rules={[{required:true}]}>
                                                <InputNumber min={1} style={{width:'100%'}} placeholder="SL" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item {...restField} name={[name, 'price']} noStyle rules={[{required:true}]}>
                                                <InputNumber 
                                                    style={{width:'100%'}} 
                                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4} style={{textAlign:'right'}}>
                                            <Form.Item shouldUpdate noStyle>
                                                {() => {
                                                    const qty = form.getFieldValue(['items', name, 'quantity']) || 0;
                                                    const price = form.getFieldValue(['items', name, 'price']) || 0;
                                                    return <b>{(qty*price).toLocaleString()}</b>;
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <MinusCircleOutlined onClick={() => remove(name)} style={{color:'red', cursor:'pointer'}} />
                                        </Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{marginTop: 10}}>Thêm sản phẩm</Button>
                            </div>
                        )}
                    </Form.List>
                </div>

                {/* SECTION 3: TỔNG KẾT */}
                <div style={{textAlign:'right', marginTop: 20}}>
                    <Space size={30}>
                        <Text type="secondary">Số lượng SP: {itemsValue?.length || 0}</Text>
                        <Statistic title="Tổng Thanh Toán" value={orderTotal} prefix={<CalculatorOutlined />} suffix="đ" valueStyle={{color: '#cf1322', fontWeight: 'bold'}} />
                    </Space>
                </div>
            </Form>
        </Modal>
    </div>
  );
};

export default SalesPage;