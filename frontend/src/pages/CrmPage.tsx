import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Tabs, Statistic, Divider, Popconfirm, Tooltip, Progress, Typography } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';
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
            setOrders(salesData.filter((s:any) => !['QUOTATION', 'CANCELLED'].includes(s.status)));
        } catch(e) {}

        try { const resSamples = await axios.get(`${API_URL}/sales/samples/all`); setSamples(resSamples.data || []); } catch (e) {}

        const resProd = await axios.get(`${API_URL}/products`);
        if (Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => ({
                label: p.name, value: p.sku, price: Number(p.base_price) || 0, unit: p.unit
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
    
    // 100% Hoan tat
    if (myOrders.some((o:any) => o.status === 'COMPLETED')) return { percent: 100, status: 'success', text: 'Hoàn tất' };
    
    // 95% Giao hang
    if (myOrders.some((o:any) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERY')) return { percent: 95, status: 'active', text: 'Đang giao hàng' };

    // 90% SX / Cọc
    if (myOrders.some((o:any) => o.status === 'DEPOSITED' || o.status === 'PLANNED')) return { percent: 90, status: 'active', text: 'Đang SX' };

    // 75% Chờ cọc / Duyệt mẫu
    if (myOrders.some((o:any) => o.status === 'SO_PENDING')) return { percent: 75, status: 'active', text: 'Duyệt Mẫu/HĐ' };

    // 50% Bao gia
    const myQuotes = quotes.filter((q:any) => q.customer?.id === leadId);
    if (myQuotes.length > 0) return { percent: 50, status: 'active', text: 'Đã báo giá' };

    // 5% Lead
    return { percent: 5, status: 'normal', text: 'Mới tạo' };
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
          message.success(accepted ? 'Đã xác nhận báo giá! Chuyển sang duyệt mẫu.' : 'Đã hủy'); fetchData();
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
      // Nếu là tạo mới -> set theo tham số isQuote
      // Nếu là edit -> check status hiện tại của record
      const isQuoteMode = record ? (record.status === 'QUOTATION') : isQuote;
      setIsQuotationMode(isQuoteMode);
      setDetailModalOpen(true);
  };

  // --- FIX: BUTTON TẠO BÁO GIÁ TỪ DRAWER ---
  const handleCreateQuoteFromFollow = () => {
      setFollowDrawerOpen(false);
      setEditingOrder({ customer_id: currentCustomer.id }); // Pre-fill Customer ID
      setIsQuotationMode(true);
      setDetailModalOpen(true);
  };

  const handleCopyLink = (uuid: string) => {
      if (!uuid) return message.error('Lỗi link');
      const link = `${window.location.protocol}//${window.location.host}/portal/quote/${uuid}`;
      navigator.clipboard.writeText(link).then(()=>message.success('Copied')).catch(()=>Modal.info({title:'Link', content:<Input value={link}/>}));
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
      { 
          // --- FIX: HIỂN THỊ NGÀY GIỜ CHĂM SÓC ---
          title: 'Lần chăm sóc cuối', dataIndex: 'history', width: 150,
          render: (h:any[]) => h && h.length > 0 ? <Tag>{dayjs(h[0].date || h[0].created_at).format('DD/MM HH:mm')}</Tag> : '-' 
      },
      { title: '', key: 'act', render: (_:any, r:any) => <Button size="small" icon={<ClockCircleOutlined />} onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}} /> }
  ];

  const quoteColumns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <Tag color="orange">{t}</Tag> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name || 'N/A' },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'TT', dataIndex: 'status', render: (t:any) => t==='CANCELLED' ? <Tag color="red">Hủy</Tag> : <Tag color="processing">Chờ KH</Tag> },
      {
          title: 'Thao tác', key: 'act', align: 'center' as const, width: 200,
          render: (_:any, r:any) => r.status === 'QUOTATION' ? (
              <Space size={2}>
                  <Tooltip title="Lấy Link Portal"><Button icon={<LinkOutlined />} size="small" onClick={()=>handleCopyLink(r.uuid)} /></Tooltip>
                  <Tooltip title="Xem & In"><Button icon={<PrinterOutlined />} size="small" onClick={()=>{openDetailModal(r); setTimeout(()=>setIsPreviewOpen(true), 500)}} /></Tooltip>
                  <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={()=>openDetailModal(r, true)} /></Tooltip>
                  <Popconfirm title="Xóa?" onConfirm={()=>handleDeleteQuote(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
                  <Divider type="vertical" />
                  <Popconfirm title="Xác nhận?" onConfirm={()=>handleConvertQuote(r.id, true)}><Button type="primary" size="small" icon={<CheckOutlined />} /></Popconfirm>
              </Space>
          ) : <span style={{color:'#ccc'}}>Đã chuyển</span>
      }
  ];

  const orderColumns = [
      { title: 'Mã SO', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách', dataIndex: 'customer', render: (c:any) => c?.name },
      { title: 'Ngày giao', dataIndex: 'delivery_date', render: (t:any) => t ? dayjs(t).format('DD/MM') : '-' },
      { 
          title: 'TT', dataIndex: 'status', align: 'center' as const,
          render: (t:any) => t === 'SO_PENDING' ? <Tag color="warning">Chờ Duyệt Mẫu</Tag> : <Tag color="green">{t}</Tag> 
      },
      { 
          title: 'Thao tác', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => (
              <Space>
                  {/* Link cho khach xem tien do SO */}
                  <Tooltip title="Link Portal"><Button icon={<LinkOutlined />} size="small" onClick={()=>handleCopyLink(r.uuid)} /></Tooltip>
                  <Tooltip title="Chi tiết & Sửa"><Button icon={<EditOutlined />} size="small" onClick={()=>openDetailModal(r, false)} /></Tooltip>
              </Space>
          )
      }
  ];

  return (
    <div>
      <Row gutter={16} style={{marginBottom: 16}}>
          <Col span={8}><Card><Statistic title="Leads" value={leads.length} prefix={<UserOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Báo Giá" value={quotes.length} prefix={<FileTextOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Đơn Hàng (SO)" value={orders.length} prefix={<DollarOutlined />} /></Card></Col>
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

      <Modal title="Xem Trước" open={isPreviewOpen} onCancel={()=>setIsPreviewOpen(false)} footer={null} width={900}>
          <div id="printableArea"><QuotationTemplate data={editingOrder} /></div>
          <div style={{textAlign:'center', marginTop:20}}><Button type="primary" onClick={()=>{ const c = document.getElementById('printableArea'); const w = window.open(); if(w && c) { w.document.write(c.innerHTML); w.print(); } }}>In Ngay</Button></div>
      </Modal>

      <Modal title="Tạo Lead" open={isLeadModalOpen} onCancel={()=>setIsLeadModalOpen(false)} onOk={()=>formLead.submit()}><Form form={formLead} layout="vertical" onFinish={handleSaveLead}><Form.Item name="code" label="Mã"><Input disabled /></Form.Item><Form.Item name="name" label="Tên" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Form></Modal>
      
      {/* DRAWER FIX */}
      <Drawer title={`Chăm sóc: ${currentCustomer?.name}`} open={followDrawerOpen} onClose={()=>setFollowDrawerOpen(false)} footer={<Button type="primary" block onClick={handleCreateQuoteFromFollow}>Tạo Báo Giá Ngay</Button>}>
          <div style={{marginBottom:20}}><Input.TextArea rows={3} value={followNote} onChange={e=>setFollowNote(e.target.value)} placeholder="Ghi chú..." /><Button block type="primary" style={{marginTop:10}} onClick={handleFollowLead}>Lưu</Button></div>
          <Divider>Lịch sử</Divider>
          <Timeline mode="left">{currentCustomer?.history?.map((h:any,i:number)=><Timeline.Item key={i} label={<span style={{fontSize:11}}>{dayjs(h.date).format('DD/MM HH:mm')}</span>}>{h.note}</Timeline.Item>)}</Timeline>
      </Drawer>
    </div>
  );
};

export default CrmPage;