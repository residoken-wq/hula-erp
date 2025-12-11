import React, { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Tabs, Statistic, Divider, InputNumber, Popconfirm, Tooltip, Progress, Typography } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, ArrowRightOutlined, SolutionOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Text, Link } = Typography;

const CrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('LEAD');
  const [loading, setLoading] = useState(false);
  
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);

  // State Modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [followDrawerOpen, setFollowDrawerOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  
  // State Edit
  const [editingQuote, setEditingQuote] = useState<any>(null);

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

        try {
            const resSamples = await axios.get(`${API_URL}/sales/samples/all`);
            setSamples(resSamples.data || []);
        } catch (e) { setSamples([]); }

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

  // ... (Giữ nguyên logic calculateProgress) ...
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

  // ACTIONS
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
          message.success('Đã lưu'); setFollowNote(''); 
          const res = await axios.get(`${API_URL}/customers/${currentCustomer.id}`);
          setCurrentCustomer(res.data); fetchData();
      } catch(e) { message.error('Lỗi'); }
  };

  const handleCreateQuoteFromFollow = () => {
      setFollowDrawerOpen(false);
      setEditingQuote(null); // Reset edit mode
      formQuote.resetFields();
      formQuote.setFieldsValue({ customer_id: currentCustomer.id });
      setIsQuoteModalOpen(true);
  };

  // SAVE QUOTE (Create or Update)
  const handleSaveQuote = async (values: any) => {
      try {
          const payload = {
              order_code: editingQuote ? editingQuote.order_code : `QUOTE-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*1000)}`,
              customer_id: values.customer_id,
              isQuotation: true, 
              items: values.items.map((i:any) => ({ sku: i.sku, quantity: Number(i.quantity), price: Number(i.price) }))
          };

          if (editingQuote) {
              await axios.put(`${API_URL}/sales/quote/${editingQuote.id}`, payload);
              message.success('Đã cập nhật báo giá');
          } else {
              await axios.post(`${API_URL}/sales/create`, payload);
              message.success('Đã tạo báo giá mới');
          }
          
          setIsQuoteModalOpen(false); 
          fetchData(); 
          setActiveTab('QUOTE');
      } catch(e: any) { message.error(e.response?.data?.message || 'Lỗi lưu báo giá'); }
  };

  // EDIT QUOTE UI
  const openEditQuote = async (record: any) => {
      // Gọi API lấy chi tiết để fill items
      try {
          const res = await axios.get(`${API_URL}/sales/${record.order_code}`);
          const detail = res.data;
          
          setEditingQuote(detail);
          formQuote.setFieldsValue({
              customer_id: detail.customer ? detail.customer.id : detail.customer_id,
              items: detail.items.map((i:any) => ({
                  sku: i.sku,
                  quantity: i.quantity,
                  price: i.unit_price
              }))
          });
          setIsQuoteModalOpen(true);
      } catch(e) { message.error('Không tải được chi tiết báo giá'); }
  };

  // DELETE QUOTE
  const handleDeleteQuote = async (id: number) => {
      try {
          await axios.delete(`${API_URL}/sales/quote/${id}`);
          message.success('Đã xóa báo giá');
          fetchData();
      } catch(e: any) { message.error(e.response?.data?.message || 'Không thể xóa'); }
  };

  const handleConvertQuote = async (id: number, accepted: boolean) => {
      try {
          await axios.post(`${API_URL}/sales/${id}/convert`, { accepted });
          message.success(accepted ? 'Đã chuyển thành Đơn hàng!' : 'Đã hủy'); fetchData();
      } catch(e: any) { Modal.error({ title: 'Lỗi', content: e.response?.data?.message }); }
  };

  const leadColumns = [
      { title: 'Mã Lead', dataIndex: 'code', width: 120, render: (t:any) => <b>{t}</b> },
      { title: 'Tên Khách', dataIndex: 'name', render: (t:any, r:any) => <a onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>{t}</a> },
      { title: 'SĐT', dataIndex: 'phone' },
      { 
          title: 'Tiến Độ (Pipeline)', key: 'progress', width: 250,
          render: (_:any, r:any) => {
              const prog = calculateProgress(r);
              return (
                  <Tooltip title={prog.text}>
                      <div style={{width:'100%'}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2}}>
                              <span>{prog.text}</span>
                              {prog.link && <Tag color="blue">{prog.link}</Tag>}
                          </div>
                          <Progress percent={prog.percent} size="small" status={prog.status as any} showInfo={false} />
                      </div>
                  </Tooltip>
              )
          }
      },
      { 
          title: 'Lần chăm sóc cuối', dataIndex: 'history', width: 150,
          render: (h:any[]) => h && h.length > 0 ? <Tag color="default">{dayjs(h[0].date).format('DD/MM HH:mm')}</Tag> : '-' 
      },
      { 
          title: '', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => <Button size="small" icon={<ClockCircleOutlined />} onClick={()=>{setCurrentCustomer(r); setFollowDrawerOpen(true)}}>Follow</Button>
      }
  ];

  const quoteColumns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <Tag color="orange">{t}</Tag> },
      { title: 'Khách Hàng', dataIndex: 'customer', render: (c:any) => c?.name || 'N/A' },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'TT', dataIndex: 'status', render: (t:any) => t==='CANCELLED' ? <Tag color="red">Hủy</Tag> : <Tag color="processing">Chờ</Tag> },
      {
          title: 'Thao tác', key: 'act', align: 'center' as const,
          render: (_:any, r:any) => r.status === 'QUOTATION' ? (
              <Space>
                  <Tooltip title="Sửa báo giá"><Button icon={<EditOutlined />} size="small" onClick={()=>openEditQuote(r)} /></Tooltip>
                  <Popconfirm title="Xóa báo giá?" onConfirm={()=>handleDeleteQuote(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
                  <Divider type="vertical" />
                  <Popconfirm title="Chốt đơn & Nhận cọc?" onConfirm={()=>handleConvertQuote(r.id, true)}><Button type="primary" size="small" icon={<CheckOutlined />}>OK</Button></Popconfirm>
              </Space>
          ) : <span style={{color:'#ccc'}}>Đã khóa</span>
      }
  ];

  const orderColumns = [
      { title: 'Mã SO', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách Hàng', dataIndex: 'customer', render: (c:any) => c?.name },
      { title: 'Thanh Toán', dataIndex: 'paid_amount', align: 'right' as const, render: (v:any, r:any) => <span>{Number(v).toLocaleString()} / {Number(r.total_amount).toLocaleString()}</span> },
      { title: 'TT', dataIndex: 'status', render: (t:any) => <Tag color="green">{t}</Tag> }
  ];

  return (
    <div>
      <Row gutter={16} style={{marginBottom: 16}}>
          <Col span={8}><Card><Statistic title="Leads Tiềm Năng" value={leads.length} prefix={<UserOutlined />} /></Card></Col>
          <Col span={8}><Card><Statistic title="Báo Giá Đang Chờ" value={quotes.filter((q:any)=>q.status==='QUOTATION').length} prefix={<FileTextOutlined />} valueStyle={{color:'#faad14'}} /></Card></Col>
          <Col span={8}><Card><Statistic title="Đơn Hàng (SO)" value={orders.length} prefix={<DollarOutlined />} valueStyle={{color:'#52c41a'}} /></Card></Col>
      </Row>

      <Card title="Sales Pipeline" extra={<Button icon={<ReloadOutlined />} onClick={fetchData} />}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              { key: 'LEAD', label: '1. Leads', children: <><Button type="primary" onClick={openCreateLead} style={{marginBottom:10}}>+ Lead</Button><Table dataSource={leads} columns={leadColumns} rowKey="id" pagination={{pageSize:10}} /></> },
              { key: 'QUOTE', label: '2. Báo Giá', children: <><Button type="primary" onClick={()=>{setEditingQuote(null); formQuote.resetFields(); setIsQuoteModalOpen(true)}} style={{marginBottom:10}}>+ Báo Giá</Button><Table dataSource={quotes} columns={quoteColumns} rowKey="id" pagination={{pageSize:5}} /></> },
              { key: 'SO', label: '3. Đơn Hàng', children: <Table dataSource={orders} columns={orderColumns} rowKey="id" pagination={{pageSize:5}} /> }
          ]} />
      </Card>

      <Modal title="Tạo Lead" open={isLeadModalOpen} onCancel={()=>setIsLeadModalOpen(false)} onOk={()=>formLead.submit()}><Form form={formLead} layout="vertical" onFinish={handleSaveLead}><Form.Item name="code" label="Mã Lead (Tự động)" rules={[{required:true}]}><Input disabled style={{background:'#f5f5f5', color:'#1890ff', fontWeight:'bold'}} /></Form.Item><Form.Item name="name" label="Tên Khách Hàng" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Form></Modal>
      
      <Drawer title={`Chăm sóc: ${currentCustomer?.name}`} open={followDrawerOpen} onClose={()=>setFollowDrawerOpen(false)} width={400} footer={<Button type="primary" block icon={<FileTextOutlined/>} onClick={handleCreateQuoteFromFollow}>Tạo Báo Giá Ngay</Button>}><div style={{marginBottom: 20}}><Input.TextArea rows={3} placeholder="Ghi chú cuộc gọi..." value={followNote} onChange={e=>setFollowNote(e.target.value)} /><Button type="primary" block style={{marginTop:10}} onClick={handleFollowLead} icon={<SendOutlined />}>Lưu Ghi Chú</Button></div><Divider>Lịch sử chăm sóc</Divider><Timeline mode="left">{currentCustomer?.history?.map((h:any, idx:number) => (<Timeline.Item key={idx} label={<span style={{fontSize:11, color:'#888'}}>{dayjs(h.date).format('DD/MM HH:mm')}</span>}>{h.note}</Timeline.Item>))}</Timeline></Drawer>

      <Modal title={editingQuote ? `Cập Nhật Báo Giá: ${editingQuote.order_code}` : "Tạo Báo Giá Mới"} open={isQuoteModalOpen} onCancel={()=>setIsQuoteModalOpen(false)} onOk={()=>formQuote.submit()} width={800} style={{top:20}}>
          <Form form={formQuote} layout="vertical" onFinish={handleSaveQuote} initialValues={{ items: [{}] }}>
              <Form.Item name="customer_id" label="Khách" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={allCustomers.map(c => ({label: `${c.code} - ${c.name}`, value: c.id}))} /></Form.Item>
              <Form.List name="items">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Row key={key} gutter={8} style={{marginBottom: 10}}>
                                <Col span={10}><Form.Item {...restField} name={[name, 'sku']} style={{marginBottom:0}} rules={[{required:true}]}><Select placeholder="Chọn SP..." options={products} onChange={(v)=>{ const p = products.find((x:any)=>x.value===v); if(p) { const items = formQuote.getFieldValue('items'); items[name].price = p.price; formQuote.setFieldsValue({items}); } }} /></Form.Item></Col>
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