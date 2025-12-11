import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Tabs, Statistic, Divider, InputNumber, Popconfirm, Tooltip, Alert } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const CrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('LEAD');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // UI
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [followDrawerOpen, setFollowDrawerOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  
  const [formLead] = Form.useForm();
  const [formQuote] = Form.useForm();
  const [followNote, setFollowNote] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
        const resCust = await axios.get(`${API_URL}/customers`);
        const custData = Array.isArray(resCust.data) ? resCust.data : [];
        setAllCustomers(custData);
        setLeads(custData.filter((c:any) => c.type === 'LEAD'));
        
        try {
            const resSales = await axios.get(`${API_URL}/sales`);
            const salesData = Array.isArray(resSales.data) ? resSales.data : [];
            setQuotes(salesData.filter((s:any) => s.status === 'QUOTATION' || s.status === 'CANCELLED'));
            setOrders(salesData.filter((s:any) => ['SO_PENDING', 'PLANNED', 'SHIPPING', 'COMPLETED', 'DEPOSITED'].includes(s.status)));
        } catch(e) {}

        const resProd = await axios.get(`${API_URL}/products`);
        if (Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => {
                // Logic hiển thị tên sản phẩm chuẩn xác
                let label = p.name;
                const attrs = p.attributes || {};
                const variants = [];
                if(attrs.color) variants.push(attrs.color);
                if(attrs.size) variants.push(attrs.size);
                
                if(variants.length > 0) label += ` [${variants.join(' - ')}]`;
                
                // Đánh dấu nếu là sản phẩm cha (không có màu)
                const isGeneric = !attrs.color && !(p.category || '').toLowerCase().includes('combo');

                return {
                    label: label, 
                    value: p.sku, 
                    price: Number(p.base_price) || 0,
                    isGeneric: isGeneric, // Cờ báo hiệu SP chung chung
                    stock: p.quantity_in_stock
                };
            }));
        }
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Actions
  const handleSaveLead = async (values: any) => {
      try {
          await axios.post(`${API_URL}/customers`, { ...values, type: 'LEAD' });
          message.success('Thành công'); setIsLeadModalOpen(false); fetchData();
      } catch(e) { message.error('Lỗi'); }
  };

  const handleFollowLead = async () => {
      if(!followNote) return;
      try {
          await axios.post(`${API_URL}/customers/${currentCustomer.id}/follow`, { note: followNote });
          message.success('Đã lưu'); setFollowNote(''); 
          const res = await axios.get(`${API_URL}/customers/${currentCustomer.id}`);
          setCurrentCustomer(res.data); fetchData();
      } catch(e) { message.error('Lỗi'); }
  };

  const handleCreateQuote = async (values: any) => {
      try {
          const payload = {
              order_code: `QUOTE-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*1000)}`,
              customer_id: values.customer_id,
              isQuotation: true, 
              items: values.items.map((i:any) => ({ sku: i.sku, quantity: Number(i.quantity), price: Number(i.price) }))
          };
          await axios.post(`${API_URL}/sales/create`, payload);
          message.success('Đã tạo báo giá'); setIsQuoteModalOpen(false); fetchData(); setActiveTab('QUOTE');
      } catch(e) { message.error('Lỗi'); }
  };

  const handleConvertQuote = async (id: number, accepted: boolean) => {
      try {
          await axios.post(`${API_URL}/sales/${id}/convert`, { accepted });
          message.success(accepted ? 'Đã chuyển thành Đơn hàng!' : 'Đã hủy');
          fetchData();
      } catch(e: any) { 
          // Hiển thị lỗi từ backend (Validation)
          Modal.error({
              title: 'Không thể chốt đơn',
              content: e.response?.data?.message || 'Lỗi không xác định. Vui lòng kiểm tra lại sản phẩm trong báo giá.'
          });
      }
  };

  // Columns
  const leadColumns = [
      { title: 'Tên Khách', dataIndex: 'name', render: (t:any, r:any) => <a onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>{t}</a> },
      { title: 'SĐT', dataIndex: 'phone' },
      { title: 'Hành động', key: 'act', render: (_:any, r:any) => <Button size="small" icon={<ClockCircleOutlined />} onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>Follow</Button> }
  ];

  const quoteColumns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <Tag color="orange">{t}</Tag> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name || 'N/A' },
      { title: 'Trị Giá', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'TT', dataIndex: 'status', render: (t:any) => t==='CANCELLED' ? <Tag color="red">Hủy</Tag> : <Tag color="processing">Chờ</Tag> },
      {
          title: 'Duyệt', key: 'act', align: 'center' as const,
          render: (_:any, r:any) => r.status === 'QUOTATION' && (
              <Space>
                  <Popconfirm title="Chốt đơn & Nhận cọc?" onConfirm={()=>handleConvertQuote(r.id, true)}>
                      <Button type="primary" size="small" icon={<CheckOutlined />}>OK</Button>
                  </Popconfirm>
                  <Popconfirm title="Khách từ chối?" onConfirm={()=>handleConvertQuote(r.id, false)}>
                      <Button danger size="small" icon={<CloseOutlined />} />
                  </Popconfirm>
              </Space>
          )
      }
  ];

  const orderColumns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name },
      { title: 'Thanh Toán', dataIndex: 'paid_amount', align: 'right' as const, render: (v:any, r:any) => `${Number(v).toLocaleString()} / ${Number(r.total_amount).toLocaleString()}` },
      { title: 'TT', dataIndex: 'status', render: (t:any) => <Tag color="green">{t}</Tag> }
  ];

  return (
    <div>
      <Row gutter={16} style={{marginBottom: 16}}>
          <Col span={8}><Card><Statistic title="Leads" value={leads.length} prefix={<UserOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Báo Giá" value={quotes.filter((q:any)=>q.status==='QUOTATION').length} prefix={<FileTextOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Đơn Hàng" value={orders.length} prefix={<DollarOutlined />} /></Card></Col>
      </Row>

      <Card title="Sales Pipeline" extra={<Button icon={<ReloadOutlined />} onClick={fetchData} />}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              { key: 'LEAD', label: '1. Leads', children: <><Button type="primary" onClick={()=>{formLead.resetFields(); setIsLeadModalOpen(true)}} style={{marginBottom:10}}>+ Lead</Button><Table dataSource={leads} columns={leadColumns} rowKey="id" pagination={{pageSize:5}} /></> },
              { key: 'QUOTE', label: '2. Báo Giá', children: <><Button type="primary" onClick={()=>{formQuote.resetFields(); setIsQuoteModalOpen(true)}} style={{marginBottom:10}}>+ Báo Giá</Button><Table dataSource={quotes} columns={quoteColumns} rowKey="id" pagination={{pageSize:5}} /></> },
              { key: 'SO', label: '3. Đơn Hàng', children: <Table dataSource={orders} columns={orderColumns} rowKey="id" pagination={{pageSize:5}} /> }
          ]} />
      </Card>

      <Modal title="Tạo Lead" open={isLeadModalOpen} onCancel={()=>setIsLeadModalOpen(false)} onOk={()=>formLead.submit()}><Form form={formLead} layout="vertical" onFinish={handleSaveLead}><Form.Item name="code" label="Mã" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="name" label="Tên" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Form></Modal>
      
      <Drawer title="Chăm sóc" open={followDrawerOpen} onClose={()=>setFollowDrawerOpen(false)}><Input.TextArea rows={3} value={followNote} onChange={e=>setFollowNote(e.target.value)} /><Button block type="primary" style={{marginTop:10}} onClick={handleFollowLead}>Lưu</Button><Divider /><Timeline>{currentCustomer?.history?.map((h:any,i:number)=><Timeline.Item key={i}>{dayjs(h.date).format('DD/MM')}: {h.note}</Timeline.Item>)}</Timeline></Drawer>

      <Modal title="Tạo Báo Giá" open={isQuoteModalOpen} onCancel={()=>setIsQuoteModalOpen(false)} onOk={()=>formQuote.submit()} width={800} style={{top:20}}>
          <Form form={formQuote} layout="vertical" onFinish={handleCreateQuote} initialValues={{ items: [{}] }}>
              <Alert message="Lưu ý: Chỉ chọn Sản phẩm có Màu sắc/Size hoặc Combo để sau này có thể chốt đơn SX." type="info" showIcon style={{marginBottom:15}} />
              <Form.Item name="customer_id" label="Khách" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={allCustomers.map(c => ({label: `${c.code} - ${c.name}`, value: c.id}))} /></Form.Item>
              <Form.List name="items">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Row key={key} gutter={8} style={{marginBottom: 10}}>
                                <Col span={10}>
                                    <Form.Item {...restField} name={[name, 'sku']} style={{marginBottom:0}} rules={[{required:true}]}>
                                        <Select 
                                            placeholder="Chọn SP..." 
                                            options={products} 
                                            filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                            onChange={(v)=>{
                                                const p = products.find((x:any)=>x.value===v);
                                                if(p) {
                                                    const items = formQuote.getFieldValue('items');
                                                    items[name].price = p.price;
                                                    formQuote.setFieldsValue({items});
                                                }
                                            }}
                                            // Render custom option để cảnh báo SP chung chung
                                            optionRender={(option:any) => (
                                                <Space>
                                                    {option.data.label}
                                                    {option.data.isGeneric && <Tag color="warning">Chưa có màu</Tag>}
                                                </Space>
                                            )}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}><Form.Item {...restField} name={[name, 'quantity']} style={{marginBottom:0}} rules={[{required:true}]}><InputNumber placeholder="SL" style={{width:'100%'}}/></Form.Item></Col>
                                <Col span={6}><Form.Item {...restField} name={[name, 'price']} style={{marginBottom:0}} rules={[{required:true}]}><InputNumber placeholder="Giá" style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Form.Item></Col>
                                <Col span={2}><MinusCircleOutlined onClick={()=>remove(name)} /></Col>
                            </Row>
                        ))}
                        <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined />}>Thêm SP</Button>
                    </>
                )}
              </Form.List>
          </Form>
      </Modal>
    </div>
  );
};

export default CrmPage;