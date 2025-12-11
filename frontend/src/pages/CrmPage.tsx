import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Tabs, Statistic, Divider, InputNumber, Popconfirm, Tooltip, Progress, Typography, DatePicker } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, ArrowRightOutlined, SolutionOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, PrinterOutlined, CarOutlined, BankOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import QuotationTemplate from '../components/QuotationTemplate'; // IMPORT MOI

const { Text } = Typography;

const CrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('LEAD');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);

  // UI State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false); // Modal Full Edit
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Modal In Bao Gia
  const [followDrawerOpen, setFollowDrawerOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  
  // State Edit
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const [formLead] = Form.useForm();
  const [formOrder] = Form.useForm();
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

        try { const resSamples = await axios.get(`${API_URL}/sales/samples/all`); setSamples(resSamples.data || []); } catch (e) {}

        const resProd = await axios.get(`${API_URL}/products`);
        if (Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => ({
                label: p.name, value: p.sku, price: Number(p.base_price) || 0
            })));
        }
    } catch(e) { message.error('Lỗi kết nối dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateLead = () => {
      const autoCode = `LEAD-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*1000)}`;
      formLead.setFieldsValue({ code: autoCode });
      setIsLeadModalOpen(true);
  };

  // ACTIONS
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

  // --- QUẢN LÝ ORDER (CREATE / UPDATE) ---
  const openOrderModal = async (record?: any, isQuote = false) => {
      if (record) {
          try {
              const res = await axios.get(`${API_URL}/sales/${record.order_code}`);
              const detail = res.data;
              setEditingOrder(detail);
              formOrder.setFieldsValue({
                  ...detail,
                  customer_id: detail.customer?.id || detail.customer_id,
                  delivery_date: detail.delivery_date ? dayjs(detail.delivery_date) : null,
                  items: detail.items.map((i:any) => ({ sku: i.sku, quantity: i.quantity, price: i.unit_price }))
              });
          } catch(e) {}
      } else {
          setEditingOrder(null);
          formOrder.resetFields();
          formOrder.setFieldsValue({ isQuotation: isQuote }); // Set flag
      }
      setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (values: any) => {
      try {
          const payload = {
              ...values,
              order_code: editingOrder ? editingOrder.order_code : `${values.isQuotation?'QUOTE':'SO'}-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*1000)}`,
              isQuotation: values.isQuotation, // Truyen flag xuong service
              items: values.items.map((i:any) => ({ sku: i.sku, quantity: Number(i.quantity), price: Number(i.price) }))
          };

          if (editingOrder) {
              await axios.put(`${API_URL}/sales/quote/${editingOrder.id}`, payload); // Dung chung API update
              message.success('Đã cập nhật');
          } else {
              await axios.post(`${API_URL}/sales/create`, payload);
              message.success('Đã tạo mới');
          }
          
          setIsOrderModalOpen(false); 
          fetchData(); 
      } catch(e: any) { message.error(e.response?.data?.message || 'Lỗi lưu'); }
  };

  const handleDeleteQuote = async (id: number) => {
      try { await axios.delete(`${API_URL}/sales/quote/${id}`); message.success('Đã xóa'); fetchData(); } 
      catch(e: any) { message.error(e.response?.data?.message || 'Không thể xóa'); }
  };

  const handleConvertQuote = async (id: number, accepted: boolean) => {
      try {
          await axios.post(`${API_URL}/sales/${id}/convert`, { accepted });
          message.success(accepted ? 'Đã chốt đơn!' : 'Đã hủy'); fetchData();
      } catch(e: any) { Modal.error({ title: 'Lỗi', content: e.response?.data?.message }); }
  };

  // --- COLUMNS ---
  const leadColumns = [
      { title: 'Mã', dataIndex: 'code', render: (t:any) => <b>{t}</b> },
      { title: 'Tên', dataIndex: 'name', render: (t:any, r:any) => <a onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>{t}</a> },
      { title: 'SĐT', dataIndex: 'phone' },
      { title: 'Lần chăm sóc cuối', dataIndex: 'history', render: (h:any[]) => h && h.length > 0 ? <Tag>{dayjs(h[0].date).format('DD/MM')}</Tag> : '-' },
      { title: '', key: 'act', render: (_:any, r:any) => <Button size="small" icon={<ClockCircleOutlined />} onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}} /> }
  ];

  const quoteColumns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <Tag color="orange">{t}</Tag> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name || 'N/A' },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'TT', dataIndex: 'status', render: (t:any) => <Tag>{t}</Tag> },
      {
          title: 'Thao tác', key: 'act', align: 'center' as const, width: 180,
          render: (_:any, r:any) => r.status === 'QUOTATION' ? (
              <Space size={2}>
                  <Tooltip title="Xem & In"><Button icon={<PrinterOutlined />} size="small" onClick={()=>{openOrderModal(r); setTimeout(()=>setIsPreviewOpen(true), 500)}} /></Tooltip>
                  <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={()=>openOrderModal(r)} /></Tooltip>
                  <Popconfirm title="Xóa?" onConfirm={()=>handleDeleteQuote(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
                  <Divider type="vertical" />
                  <Popconfirm title="Chốt đơn?" onConfirm={()=>handleConvertQuote(r.id, true)}><Button type="primary" size="small" icon={<CheckOutlined />} /></Popconfirm>
              </Space>
          ) : <span style={{color:'#ccc'}}>Đã khóa</span>
      }
  ];

  const orderColumns = [
      { title: 'Mã SO', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name },
      { title: 'Ngày giao', dataIndex: 'delivery_date', render: (t:any) => t ? dayjs(t).format('DD/MM') : '-' },
      { title: 'Vận chuyển', dataIndex: 'shipping_carrier', render: (t:any, r:any) => t ? <Tag icon={<CarOutlined/>}>{t}</Tag> : '-' },
      { title: 'Thanh Toán', dataIndex: 'paid_amount', align: 'right' as const, render: (v:any, r:any) => <span>{Number(v).toLocaleString()} / {Number(r.total_amount).toLocaleString()}</span> },
      { title: 'TT', dataIndex: 'status', render: (t:any) => <Tag color="green">{t}</Tag> },
      { title: '', key: 'act', render: (_:any, r:any) => <Button icon={<EditOutlined />} size="small" onClick={()=>openOrderModal(r)} /> }
  ];

  return (
    <div>
      <Row gutter={16} style={{marginBottom: 16}}>
          <Col span={8}><Card><Statistic title="Leads" value={leads.length} prefix={<UserOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Báo Giá" value={quotes.filter((q:any)=>q.status==='QUOTATION').length} prefix={<FileTextOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Đơn Hàng" value={orders.length} prefix={<DollarOutlined />} /></Card></Col>
      </Row>

      <Card title="Quản Lý Kinh Doanh (CRM)" extra={<Button icon={<ReloadOutlined />} onClick={fetchData} />}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              { key: 'LEAD', label: '1. Leads', children: <><Button type="primary" onClick={openCreateLead} style={{marginBottom:10}}>+ Lead</Button><Table dataSource={leads} columns={leadColumns} rowKey="id" /></> },
              { key: 'QUOTE', label: '2. Báo Giá', children: <><Button type="primary" onClick={()=>openOrderModal(null, true)} style={{marginBottom:10}}>+ Báo Giá Mới</Button><Table dataSource={quotes} columns={quoteColumns} rowKey="id" /></> },
              { key: 'SO', label: '3. Đơn Hàng', children: <Table dataSource={orders} columns={orderColumns} rowKey="id" /> }
          ]} />
      </Card>

      {/* MODAL ORDER/QUOTE FULL EDIT */}
      <Modal title={formOrder.getFieldValue('isQuotation') ? "Báo Giá Chi Tiết" : "Quản Lý Đơn Hàng"} open={isOrderModalOpen} onCancel={()=>setIsOrderModalOpen(false)} onOk={()=>formOrder.submit()} width={1000} style={{top:20}}>
          <Form form={formOrder} layout="vertical" onFinish={handleSaveOrder}>
              <Form.Item name="isQuotation" hidden><Input /></Form.Item>
              
              <Tabs defaultActiveKey="1" items={[
                  {
                      key: '1', label: 'Thông tin Đơn hàng',
                      children: (
                          <Row gutter={16}>
                              <Col span={12}>
                                  <Form.Item name="customer_id" label="Khách Hàng" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={allCustomers.map(c => ({label: `${c.code} - ${c.name}`, value: c.id}))} onChange={(val)=>{ const c = allCustomers.find(x=>x.id===val); if(c){ formOrder.setFieldsValue({customer_name: c.name, receiver_name: c.name, receiver_phone: c.phone, shipping_address: c.address}); } }} /></Form.Item>
                                  <Form.Item name="items" label="Danh sách sản phẩm">
                                      <Form.List name="items">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Row key={key} gutter={8} style={{marginBottom: 10}}>
                                                        <Col span={10}><Form.Item {...restField} name={[name, 'sku']} style={{marginBottom:0}} rules={[{required:true}]}><Select placeholder="SP" options={products} onChange={(v)=>{ const p = products.find((x:any)=>x.value===v); if(p) { const items = formOrder.getFieldValue('items'); items[name].price = p.price; formOrder.setFieldsValue({items}); } }} /></Form.Item></Col>
                                                        <Col span={5}><Form.Item {...restField} name={[name, 'quantity']} style={{marginBottom:0}} rules={[{required:true}]}><InputNumber placeholder="SL" style={{width:'100%'}}/></Form.Item></Col>
                                                        <Col span={7}><Form.Item {...restField} name={[name, 'price']} style={{marginBottom:0}} rules={[{required:true}]}><InputNumber placeholder="Giá" style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Form.Item></Col>
                                                        <Col span={2}><MinusCircleOutlined onClick={()=>remove(name)} /></Col>
                                                    </Row>
                                                ))}
                                                <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined />}>Thêm SP</Button>
                                            </>
                                        )}
                                      </Form.List>
                                  </Form.Item>
                              </Col>
                              <Col span={12}>
                                  <Divider orientation="left"><BankOutlined /> Thông tin Xuất Hóa Đơn (VAT)</Divider>
                                  <Form.Item name="vat_company_name" label="Tên Đơn vị"><Input placeholder="Để trống nếu là khách lẻ" /></Form.Item>
                                  <Row gutter={8}>
                                      <Col span={10}><Form.Item name="vat_tax_code" label="MST"><Input /></Form.Item></Col>
                                      <Col span={14}><Form.Item name="vat_address" label="Địa chỉ ĐKKD"><Input /></Form.Item></Col>
                                  </Row>
                                  <Form.Item name="payment_note" label="Ghi chú thanh toán"><Input.TextArea rows={2} placeholder="VD: CK 50% cọc..." /></Form.Item>
                              </Col>
                          </Row>
                      )
                  },
                  {
                      key: '2', label: 'Vận chuyển & Giao hàng',
                      children: (
                          <Row gutter={16}>
                              <Col span={12}>
                                  <Form.Item name="delivery_date" label="Ngày Giao Dự Kiến"><DatePicker style={{width:'100%'}} /></Form.Item>
                                  <Form.Item name="shipping_address" label="Địa chỉ Nhận hàng"><Input /></Form.Item>
                                  <Row gutter={8}>
                                      <Col span={14}><Form.Item name="receiver_name" label="Người nhận"><Input /></Form.Item></Col>
                                      <Col span={10}><Form.Item name="receiver_phone" label="SĐT Nhận"><Input /></Form.Item></Col>
                                  </Row>
                              </Col>
                              <Col span={12}>
                                  <Form.Item name="shipping_carrier" label="Đơn vị Vận chuyển"><Input placeholder="GHTK, Viettel Post, Grab..." prefix={<CarOutlined/>} /></Form.Item>
                                  <Form.Item name="tracking_code" label="Mã Vận Đơn"><Input /></Form.Item>
                                  <Form.Item name="shipping_fee" label="Phí Vận Chuyển"><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Form.Item>
                              </Col>
                          </Row>
                      )
                  }
              ]} />
          </Form>
          
          {editingOrder && formOrder.getFieldValue('isQuotation') && (
               <div style={{marginTop:10, textAlign:'right'}}>
                   <Button icon={<PrinterOutlined />} onClick={()=>setIsPreviewOpen(true)}>Xem & In Mẫu Báo Giá</Button>
               </div>
          )}
      </Modal>

      {/* MODAL PREVIEW PORTAL */}
      <Modal title="Xem Trước Báo Giá (Portal View)" open={isPreviewOpen} onCancel={()=>setIsPreviewOpen(false)} footer={null} width={900}>
          <div id="printableArea">
              <QuotationTemplate data={editingOrder} />
          </div>
          <div style={{textAlign:'center', marginTop:20}}>
              <Button type="primary" onClick={()=>{ 
                  const content = document.getElementById('printableArea');
                  const pri = window.open('','','height=800,width=900');
                  if(pri && content) {
                      pri.document.write('<html><head><title>IN BÁO GIÁ</title>');
                      pri.document.write('</head><body>');
                      pri.document.write(content.innerHTML);
                      pri.document.write('</body></html>');
                      pri.document.close();
                      pri.focus();
                      pri.print();
                  }
              }}>In Ngay</Button>
          </div>
      </Modal>

      <Modal title="Tạo Lead" open={isLeadModalOpen} onCancel={()=>setIsLeadModalOpen(false)} onOk={()=>formLead.submit()}><Form form={formLead} layout="vertical" onFinish={handleSaveLead}><Form.Item name="code" label="Mã"><Input disabled /></Form.Item><Form.Item name="name" label="Tên" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Form></Modal>
      <Drawer title="Chăm sóc" open={followDrawerOpen} onClose={()=>setFollowDrawerOpen(false)}><Input.TextArea rows={3} value={followNote} onChange={e=>setFollowNote(e.target.value)} /><Button block type="primary" style={{marginTop:10}} onClick={handleFollowLead}>Lưu</Button><Divider /><Timeline>{currentCustomer?.history?.map((h:any,i:number)=><Timeline.Item key={i}>{dayjs(h.date).format('DD/MM')}: {h.note}</Timeline.Item>)}</Timeline></Drawer>
    </div>
  );
};

export default CrmPage;