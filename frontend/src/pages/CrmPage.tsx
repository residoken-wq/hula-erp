import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Tabs, Statistic, Divider, Popconfirm, Tooltip, Progress, Typography } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import QuotationTemplate from '../components/QuotationTemplate';
import SalesOrderDetail from '../components/SalesOrderDetail';

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
  const [followDrawerOpen, setFollowDrawerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // State cho Component SalesOrderDetail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isQuotationMode, setIsQuotationMode] = useState(false);

  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [formLead] = Form.useForm();
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
            setOrders(salesData.filter((s:any) => ['SO_PENDING', 'PLANNED', 'SHIPPING', 'COMPLETED', 'DEPOSITED', 'PARTIAL_DELIVERY', 'DELIVERED'].includes(s.status)));
        } catch(e) {}

        try { const resSamples = await axios.get(`${API_URL}/sales/samples/all`); setSamples(resSamples.data || []); } catch (e) {}

        const resProd = await axios.get(`${API_URL}/products`);
        if (Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => ({
                label: p.name, 
                value: p.sku, 
                price: Number(p.base_price) || 0,
                unit: p.unit || 'Cái' // LAY THEM DON VI TINH
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
  
  const calculateProgress = (lead: any) => {
    const leadId = lead.id;
    const myOrders = orders.filter((o:any) => o.customer?.id === leadId);
    const fullyPaid = myOrders.find((o:any) => Number(o.paid_amount) >= Number(o.total_amount));
    if (fullyPaid) return { percent: 100, status: 'success', text: 'Đã thanh toán', link: null };

    const deposited = myOrders.find((o:any) => Number(o.paid_amount) > 0);
    if (deposited) return { percent: 95, status: 'active', text: 'Đã cọc', link: null };

    if (myOrders.length > 0) return { percent: 90, status: 'active', text: 'Đã đặt hàng', link: myOrders[0].order_code };

    const mySamples = samples.filter((s:any) => s.customer?.id === leadId);
    if (mySamples.some((s:any) => s.status === 'APPROVED')) return { percent: 75, status: 'active', text: 'Đã duyệt mẫu', link: null };

    const myQuotes = quotes.filter((q:any) => q.customer?.id === leadId);
    if (myQuotes.length > 0) return { percent: 50, status: 'active', text: 'Đã báo giá', link: myQuotes[0].order_code };

    if (mySamples.length > 0) return { percent: 20, status: 'normal', text: 'Đang xem mẫu', link: null };

    if (lead.history && lead.history.length > 0) return { percent: 5, status: 'normal', text: 'Đang chăm sóc', link: null };

    return { percent: 0, status: 'normal', text: 'Mới tạo', link: null };
  };

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

  const handleConvertQuote = async (id: number, accepted: boolean) => {
      try {
          await axios.post(`${API_URL}/sales/${id}/convert`, { accepted });
          message.success(accepted ? 'Đã chốt đơn!' : 'Đã hủy'); fetchData();
      } catch(e: any) { Modal.error({ title: 'Lỗi', content: e.response?.data?.message }); }
  };
  
  const handleDeleteQuote = async (id: number) => {
      try { await axios.delete(`${API_URL}/sales/quote/${id}`); message.success('Đã xóa'); fetchData(); } 
      catch(e: any) { message.error(e.response?.data?.message || 'Không thể xóa'); }
  };

  const openDetailModal = async (record?: any, isQuote = false) => {
      if (record) {
          try {
              const res = await axios.get(`${API_URL}/sales/${record.order_code}`);
              setEditingOrder(res.data);
          } catch(e) {}
      } else {
          setEditingOrder(null);
      }
      setIsQuotationMode(isQuote || (record && record.status === 'QUOTATION'));
      setDetailModalOpen(true);
  };

  const handleCreateQuoteFromFollow = () => {
      setFollowDrawerOpen(false);
      setEditingOrder({ customer_id: currentCustomer.id }); // Pre-fill
      setIsQuotationMode(true);
      setDetailModalOpen(true);
  };

  // COLUMNS
  const leadColumns = [
      { title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> },
      { title: 'Tên Khách', dataIndex: 'name', render: (t:any, r:any) => <a onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>{t}</a> },
      { title: 'SĐT', dataIndex: 'phone' },
      { 
          title: 'Tiến Độ', key: 'progress', width: 200,
          render: (_:any, r:any) => {
              const prog = calculateProgress(r);
              return <Tooltip title={prog.text}><Progress percent={prog.percent} size="small" status={prog.status as any} showInfo={false} /></Tooltip>
          }
      },
      { title: '', key: 'act', render: (_:any, r:any) => <Button size="small" icon={<ClockCircleOutlined />} onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}} /> }
  ];

  const quoteColumns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <Tag color="orange">{t}</Tag> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name || 'N/A' },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'TT', dataIndex: 'status', render: (t:any) => t==='CANCELLED' ? <Tag color="red">Hủy</Tag> : <Tag color="processing">Chờ</Tag> },
      {
          title: 'Thao tác', key: 'act', align: 'center' as const, width: 180,
          render: (_:any, r:any) => r.status === 'QUOTATION' ? (
              <Space size={2}>
                  <Tooltip title="Xem & In"><Button icon={<PrinterOutlined />} size="small" onClick={()=>{openDetailModal(r); setTimeout(()=>setIsPreviewOpen(true), 500)}} /></Tooltip>
                  <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={()=>openDetailModal(r, true)} /></Tooltip>
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
      { title: 'TT', dataIndex: 'status', render: (t:any) => <Tag color="green">{t}</Tag> },
      { title: '', key: 'act', render: (_:any, r:any) => <Button icon={<EditOutlined />} size="small" onClick={()=>openDetailModal(r, false)} /> }
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
              { key: 'QUOTE', label: '2. Báo Giá', children: <><Button type="primary" onClick={()=>openDetailModal(null, true)} style={{marginBottom:10}}>+ Báo Giá Mới</Button><Table dataSource={quotes} columns={quoteColumns} rowKey="id" /></> },
              { key: 'SO', label: '3. Đơn Hàng', children: <Table dataSource={orders} columns={orderColumns} rowKey="id" /> }
          ]} />
      </Card>

      <SalesOrderDetail 
        open={detailModalOpen} 
        onClose={()=>setDetailModalOpen(false)} 
        onSuccess={fetchData}
        initialData={editingOrder}
        isQuotation={isQuotationMode}
        customers={allCustomers}
        products={products}
      />

      <Modal title="Xem Trước Báo Giá" open={isPreviewOpen} onCancel={()=>setIsPreviewOpen(false)} footer={null} width={900}>
          <div id="printableArea"><QuotationTemplate data={editingOrder} /></div>
          <div style={{textAlign:'center', marginTop:20}}><Button type="primary" onClick={()=>{ const c = document.getElementById('printableArea'); const w = window.open(); if(w && c) { w.document.write(c.innerHTML); w.print(); } }}>In Ngay</Button></div>
      </Modal>

      <Modal title="Tạo Lead" open={isLeadModalOpen} onCancel={()=>setIsLeadModalOpen(false)} onOk={()=>formLead.submit()}><Form form={formLead} layout="vertical" onFinish={handleSaveLead}><Form.Item name="code" label="Mã"><Input disabled /></Form.Item><Form.Item name="name" label="Tên" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Form></Modal>
      <Drawer title="Chăm sóc" open={followDrawerOpen} onClose={()=>setFollowDrawerOpen(false)} footer={<Button type="primary" block onClick={handleCreateQuoteFromFollow}>Tạo Báo Giá</Button>}><Input.TextArea rows={3} value={followNote} onChange={e=>setFollowNote(e.target.value)} /><Button block style={{marginTop:10}} onClick={handleFollowLead}>Lưu</Button><Divider /><Timeline>{currentCustomer?.history?.map((h:any,i:number)=><Timeline.Item key={i}>{h.note}</Timeline.Item>)}</Timeline></Drawer>
    </div>
  );
};

export default CrmPage;