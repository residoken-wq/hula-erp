import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Tabs, Statistic, Divider, InputNumber, Popconfirm } from 'antd';
import { UserOutlined, PhoneOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, CarOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const CrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('LEAD');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [leads, setLeads] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // UI State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [followDrawerOpen, setFollowDrawerOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  
  const [formLead] = Form.useForm();
  const [formQuote] = Form.useForm();
  const [followNote, setFollowNote] = useState('');

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const resCust = await axios.get(`${API_URL}/customers`);
        const allCust = resCust.data;
        setLeads(allCust.filter((c:any) => c.type === 'LEAD'));
        
        const resSales = await axios.get(`${API_URL}/sales`);
        const allSales = resSales.data;
        setQuotes(allSales.filter((s:any) => s.status === 'QUOTATION' || s.status === 'CANCELLED'));
        setOrders(allSales.filter((s:any) => ['SO_PENDING', 'PLANNED', 'SHIPPING', 'COMPLETED'].includes(s.status)));

        const resProd = await axios.get(`${API_URL}/products`);
        setProducts(resProd.data.map((p:any) => ({label: p.name, value: p.sku, price: Number(p.base_price)})));
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. LEAD ACTIONS
  const handleSaveLead = async (values: any) => {
      try {
          await axios.post(`${API_URL}/customers`, { ...values, type: 'LEAD' });
          message.success('Tạo Lead thành công'); setIsLeadModalOpen(false); fetchData();
      } catch(e) { message.error('Lỗi tạo Lead'); }
  };

  const handleFollowLead = async () => {
      if(!followNote) return;
      try {
          await axios.post(`${API_URL}/customers/${currentCustomer.id}/follow`, { note: followNote });
          message.success('Đã lưu lịch sử'); setFollowNote(''); 
          // Reload current customer history
          const res = await axios.get(`${API_URL}/customers/${currentCustomer.id}`);
          setCurrentCustomer(res.data);
          fetchData();
      } catch(e) { message.error('Lỗi'); }
  };

  // 3. QUOTE ACTIONS
  const handleCreateQuote = async (values: any) => {
      try {
          const payload = {
              order_code: `QUOTE-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*1000)}`,
              customer_id: values.customer_id,
              isQuotation: true, // Flag quan trọng báo backend đây là Báo giá
              items: values.items.map((i:any) => ({ sku: i.sku, quantity: i.quantity, price: i.price }))
          };
          await axios.post(`${API_URL}/sales/create`, payload);
          message.success('Tạo báo giá thành công'); setIsQuoteModalOpen(false); fetchData(); setActiveTab('QUOTE');
      } catch(e) { message.error('Lỗi tạo báo giá'); }
  };

  const handleConvertQuote = async (id: number, accepted: boolean) => {
      try {
          await axios.post(`${API_URL}/sales/${id}/convert`, { accepted });
          message.success(accepted ? 'Đã chuyển thành Đơn hàng!' : 'Đã hủy báo giá');
          fetchData();
      } catch(e) { message.error('Lỗi xử lý'); }
  };

  // --- COLUMNS ---
  const leadColumns = [
      { title: 'Mã', dataIndex: 'code', render: (t:any) => <b>{t}</b> },
      { title: 'Tên Khách', dataIndex: 'name' },
      { title: 'SĐT', dataIndex: 'phone' },
      { title: 'Lần chăm sóc cuối', dataIndex: 'history', render: (h:any[]) => h && h.length ? dayjs(h[0].date).format('DD/MM HH:mm') : '-' },
      { 
          title: '', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => <Button size="small" icon={<ClockCircleOutlined />} onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>Follow</Button>
      }
  ];

  const quoteColumns = [
      { title: 'Mã Báo Giá', dataIndex: 'order_code', render: (t:any) => <Tag color="orange">{t}</Tag> },
      { title: 'Khách Hàng', dataIndex: 'customer', render: (c:any) => c?.name },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'Trạng Thái', dataIndex: 'status', render: (t:any) => t==='CANCELLED' ? <Tag color="red">Từ chối</Tag> : <Tag color="processing">Chờ KH</Tag> },
      {
          title: 'Phản hồi KH', key: 'act', align: 'center' as const,
          render: (_:any, r:any) => r.status === 'QUOTATION' && (
              <Space>
                  <Popconfirm title="Khách đồng ý mua?" onConfirm={()=>handleConvertQuote(r.id, true)}>
                      <Button type="primary" size="small" icon={<CheckOutlined />}>Chốt đơn</Button>
                  </Popconfirm>
                  <Popconfirm title="Khách từ chối?" onConfirm={()=>handleConvertQuote(r.id, false)}>
                      <Button danger size="small" icon={<CloseOutlined />}>Hủy</Button>
                  </Popconfirm>
              </Space>
          )
      }
  ];

  const orderColumns = [
      { title: 'Mã SO', dataIndex: 'order_code', render: (t:any) => <b style={{color:'#1890ff'}}>{t}</b> },
      { title: 'Khách Hàng', dataIndex: 'customer', render: (c:any) => c?.name },
      { title: 'Vận Chuyển', dataIndex: 'shipping_status', render: (t:any) => <Tag color={t==='DELIVERED'?'green':'default'}>{t}</Tag> },
      { title: 'Thanh Toán', dataIndex: 'paid_amount', align: 'right' as const, render: (v:any, r:any) => 
        <div>
            {Number(v).toLocaleString()} / {Number(r.total_amount).toLocaleString()}
            {Number(v) >= Number(r.total_amount) && <CheckOutlined style={{color:'green', marginLeft:5}} />}
        </div> 
      },
      { title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const, render: (t:any) => <Tag>{t}</Tag> }
  ];

  return (
    <div style={{padding:0}}>
      <Row gutter={16} style={{marginBottom: 16}}>
          <Col span={8}><Card><Statistic title="Leads Tiềm Năng" value={leads.length} prefix={<UserOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Báo Giá Đang Chờ" value={quotes.filter((q:any)=>q.status==='QUOTATION').length} prefix={<FileTextOutlined />} valueStyle={{color:'#faad14'}} /></Card></Col>
          <Col span={8}><Card><Statistic title="Đơn Hàng (SO)" value={orders.length} prefix={<DollarOutlined />} valueStyle={{color:'#52c41a'}} /></Card></Col>
      </Row>

      <Card title="Quy Trình Bán Hàng (CRM Pipeline)" extra={<Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              {
                  key: 'LEAD', label: '1. Khách Hàng Tiềm Năng (Leads)',
                  children: (
                      <>
                        <Button type="primary" icon={<PlusOutlined />} onClick={()=>{formLead.resetFields(); setIsLeadModalOpen(true)}} style={{marginBottom:10}}>Tạo Lead Mới</Button>
                        <Table dataSource={leads} columns={leadColumns} rowKey="id" />
                      </>
                  )
              },
              {
                  key: 'QUOTE', label: '2. Báo Giá (Quotations)',
                  children: (
                      <>
                        <Button type="primary" icon={<PlusOutlined />} onClick={()=>{formQuote.resetFields(); setIsQuoteModalOpen(true)}} style={{marginBottom:10}}>Tạo Báo Giá</Button>
                        <Table dataSource={quotes} columns={quoteColumns} rowKey="id" />
                      </>
                  )
              },
              {
                  key: 'SO', label: '3. Đơn Hàng & Vận Chuyển',
                  children: <Table dataSource={orders} columns={orderColumns} rowKey="id" />
              }
          ]} />
      </Card>

      {/* MODAL TẠO LEAD */}
      <Modal title="Thêm Khách Hàng Tiềm Năng" open={isLeadModalOpen} onCancel={()=>setIsLeadModalOpen(false)} onOk={()=>formLead.submit()}>
          <Form form={formLead} layout="vertical" onFinish={handleSaveLead}>
              <Form.Item name="code" label="Mã KH (Tự đặt)" rules={[{required:true}]}><Input /></Form.Item>
              <Form.Item name="name" label="Tên Khách Hàng" rules={[{required:true}]}><Input /></Form.Item>
              <Form.Item name="phone" label="Số điện thoại" rules={[{required:true}]}><Input /></Form.Item>
              <Form.Item name="email" label="Email"><Input /></Form.Item>
          </Form>
      </Modal>

      {/* DRAWER FOLLOW LEAD */}
      <Drawer title={`Chăm sóc: ${currentCustomer?.name}`} open={followDrawerOpen} onClose={()=>setFollowDrawerOpen(false)} width={400}>
          <div style={{marginBottom: 20}}>
              <Input.TextArea rows={3} placeholder="Ghi chú cuộc gọi/gặp mặt..." value={followNote} onChange={e=>setFollowNote(e.target.value)} />
              <Button type="primary" block style={{marginTop:10}} onClick={handleFollowLead} icon={<SendOutlined />}>Lưu Ghi Chú</Button>
          </div>
          <Divider>Lịch sử chăm sóc</Divider>
          <Timeline mode="left">
              {currentCustomer?.history?.map((h:any, idx:number) => (
                  <Timeline.Item key={idx} label={dayjs(h.date).format('DD/MM')}>
                      <p>{h.note}</p>
                      <small style={{color:'#999'}}>{dayjs(h.date).format('HH:mm')} - by {h.user}</small>
                  </Timeline.Item>
              ))}
          </Timeline>
      </Drawer>

      {/* MODAL TẠO BÁO GIÁ */}
      <Modal title="Tạo Báo Giá Mới" open={isQuoteModalOpen} onCancel={()=>setIsQuoteModalOpen(false)} onOk={()=>formQuote.submit()} width={800}>
          <Form form={formQuote} layout="vertical" onFinish={handleCreateQuote} initialValues={{ items: [{}] }}>
              <Form.Item name="customer_id" label="Khách Hàng (Lead hoặc Cũ)" rules={[{required:true}]}>
                  <Select showSearch options={leads.concat(orders.map((o:any)=>o.customer)).filter((v,i,a)=>a.findIndex(t=>(t?.id===v?.id))===i).map((c:any)=>({label:c?.name, value:c?.id}))} placeholder="Chọn khách..." />
              </Form.Item>
              
              <Form.List name="items">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Row key={key} gutter={8} style={{marginBottom: 10}}>
                                <Col span={10}><Form.Item {...restField} name={[name, 'sku']} style={{marginBottom:0}} rules={[{required:true}]}><Select options={products} placeholder="Sản phẩm" onChange={(v)=>{
                                    const p = products.find((x:any)=>x.value===v);
                                    if(p) {
                                        const items = formQuote.getFieldValue('items');
                                        items[name].price = p.price;
                                        formQuote.setFieldsValue({items});
                                    }
                                }}/></Form.Item></Col>
                                <Col span={6}><Form.Item {...restField} name={[name, 'quantity']} style={{marginBottom:0}} rules={[{required:true}]}><InputNumber placeholder="SL" style={{width:'100%'}}/></Form.Item></Col>
                                <Col span={6}><Form.Item {...restField} name={[name, 'price']} style={{marginBottom:0}} rules={[{required:true}]}><InputNumber placeholder="Giá" style={{width:'100%'}} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                                <Col span={2}><MinusCircleOutlined onClick={() => remove(name)} /></Col>
                            </Row>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm SP</Button>
                    </>
                )}
              </Form.List>
          </Form>
      </Modal>
    </div>
  );
};

export default CrmPage;