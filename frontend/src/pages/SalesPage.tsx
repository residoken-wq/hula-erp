import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Input, Space, Badge, Statistic, Row, Col, Tabs, Progress, Tooltip, Dropdown } from 'antd';
import { PlusOutlined, ReloadOutlined, DollarOutlined, SearchOutlined, CheckCircleOutlined, UnorderedListOutlined, BellOutlined, EditOutlined, LinkOutlined, ShoppingCartOutlined, MoreOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import QuickTaskModal from '../components/QuickTaskModal';
import SalesOrderDetail from '../components/SalesOrderDetail'; // Đảm bảo import đúng

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // State Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskInitialValues, setTaskInitialValues] = useState<any>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [resSales, resProd, resCust] = await Promise.all([
            axios.get(`${API_URL}/sales`),
            axios.get(`${API_URL}/products`),
            axios.get(`${API_URL}/customers`)
        ]);
        
        // Lọc chỉ lấy Đơn hàng (Không lấy Báo giá chưa chốt)
        const allSales = Array.isArray(resSales.data) ? resSales.data : [];
        // Tùy chọn: Có thể muốn hiện cả Báo giá ở đây hoặc chỉ Đơn hàng. 
        // Logic dưới đây hiện tất cả nhưng Tab mặc định là ALL
        setData(allSales);
        
        if(Array.isArray(resProd.data)) {
            setProducts(resProd.data.map((p:any) => ({
                label: p.name, value: p.sku, price: Number(p.base_price) || 0, unit: p.unit
            })));
        }
        setCustomers(Array.isArray(resCust.data) ? resCust.data : []);

    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const handleCreateTask = (record: any) => {
      setTaskInitialValues({
          title: `Theo dõi đơn: ${record.order_code}`,
          reference_code: record.order_code,
          reference_type: 'SALES',
          description: `Khách: ${record.customer_name}\nTrạng thái: ${record.status}`
      });
      setTaskModalOpen(true);
  };

  const openDetailModal = async (record?: any) => {
      if (record) {
          try {
              const res = await axios.get(`${API_URL}/sales/${record.order_code}`);
              setEditingOrder(res.data);
          } catch(e) { message.error('Không tải được chi tiết đơn'); return; }
      } else {
          setEditingOrder(null); // Tạo đơn mới
      }
      setDetailModalOpen(true);
  };

  const handleCopyLink = (uuid: string) => {
      if (!uuid) return message.warning('Chưa có Link');
      const link = `${window.location.protocol}//${window.location.host}/portal/quote/${uuid}`;
      navigator.clipboard.writeText(link).then(() => message.success('Đã copy Link Portal!')).catch(() => {});
  };

  const columns = [
      { 
          title: 'Mã Đơn', dataIndex: 'order_code', 
          render: (t:any, r:any) => <a onClick={()=>openDetailModal(r)}><b>{t}</b></a> 
      },
      { 
          title: 'Khách Hàng', dataIndex: 'customer_name',
          render: (t:any) => <span style={{fontWeight:500}}>{t}</span>
      },
      { 
          title: 'Ngày Đặt', dataIndex: 'order_date', 
          render: (t:any) => <span style={{color:'#888', fontSize:13}}>{dayjs(t).format('DD/MM/YYYY')}</span> 
      },
      { 
          title: 'Doanh Thu', dataIndex: 'total_amount', align: 'right' as const, 
          render: (v:any) => <b style={{color: '#cf1322'}}>{Number(v).toLocaleString()}</b> 
      },
      { 
          title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const,
          render: (t:any) => {
              let color = 'default';
              let label = t;
              if(t==='QUOTATION') { color = 'orange'; label='Báo Giá'; }
              if(t==='SO_PENDING') { color = 'processing'; label='Mới'; }
              if(t==='SAMPLE_APPROVED') { color = 'cyan'; label='Đã Duyệt'; }
              if(t==='DEPOSITED') { color = 'purple'; label='Đã Cọc'; }
              if(t==='COMPLETED') { color = 'success'; label='Hoàn Thành'; }
              if(t==='DELIVERED') { color = 'geekblue'; label='Đã Giao'; }
              if(t==='CANCELLED') { color = 'error'; label='Hủy'; }
              return <Tag color={color} style={{minWidth:80, textAlign:'center'}}>{label}</Tag>
          } 
      },
      {
          title: 'Thanh Toán', dataIndex: 'payment_status', width: 160,
          render: (t:any, r:any) => {
              const total = Number(r.total_amount) || 0;
              const paid = Number(r.paid_amount) || 0;
              const pct = total > 0 ? Math.round((paid/total)*100) : 0;
              return (
                  <Tooltip title={`Đã trả: ${paid.toLocaleString()} / ${total.toLocaleString()}`}>
                      <div style={{display:'flex', alignItems:'center', gap:5}}>
                          <Progress percent={pct} size="small" steps={5} strokeColor={pct>=100?'#52c41a':'#1890ff'} showInfo={false} />
                          <span style={{fontSize:11, color: pct>=100?'green':'#666'}}>{pct}%</span>
                      </div>
                  </Tooltip>
              )
          }
      },
      {
          title: '', key: 'act', width: 60, align: 'center' as const,
          render: (r: any) => (
              <Dropdown menu={{ items: [
                  { key: 'edit', label: 'Xem chi tiết / Sửa', icon: <EditOutlined/>, onClick: () => openDetailModal(r) },
                  { key: 'task', label: 'Tạo nhắc nhở', icon: <BellOutlined/>, onClick: () => handleCreateTask(r) },
                  { key: 'link', label: 'Copy Link Portal', icon: <LinkOutlined/>, onClick: () => handleCopyLink(r.uuid) },
              ] }} trigger={['click']}>
                  <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
          )
      }
  ];

  // Filter Data
  const filteredData = data.filter((x:any) => {
      const matchTab = activeTab === 'ALL' ? true : x.status === activeTab;
      const matchSearch = x.order_code?.toLowerCase().includes(searchText.toLowerCase()) 
                       || x.customer_name?.toLowerCase().includes(searchText.toLowerCase());
      return matchTab && matchSearch;
  });

  // Calculate Metrics
  const totalOrders = data.filter(x => x.status !== 'QUOTATION' && x.status !== 'CANCELLED').length;
  const totalRevenue = data.filter(x => x.status !== 'QUOTATION' && x.status !== 'CANCELLED').reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const pendingOrders = data.filter(x => x.status === 'SO_PENDING' || x.status === 'SAMPLE_APPROVED').length;

  return (
    <div>
        {/* METRICS ROW */}
        <Row gutter={16} style={{marginBottom: 16}}>
            <Col span={8}><Card bordered={false} bodyStyle={{padding:16}} style={{background:'#f6ffed', border:'1px solid #b7eb8f'}}><Statistic title="Doanh Thu Thực Tế" value={totalRevenue} precision={0} suffix="₫" prefix={<DollarOutlined style={{color:'#52c41a'}}/>} valueStyle={{fontWeight:'bold'}} /></Card></Col>
            <Col span={8}><Card bordered={false} bodyStyle={{padding:16}} style={{background:'#e6f7ff', border:'1px solid #91d5ff'}}><Statistic title="Đơn Hàng (Chính thức)" value={totalOrders} prefix={<ShoppingCartOutlined style={{color:'#1890ff'}}/>} /></Card></Col>
            <Col span={8}><Card bordered={false} bodyStyle={{padding:16}} style={{background:'#fff7e6', border:'1px solid #ffd591'}}><Statistic title="Đang Xử Lý" value={pendingOrders} prefix={<ReloadOutlined style={{color:'#fa8c16'}}/>} /></Card></Col>
        </Row>

        <Card 
            title={
                <div style={{display:'flex', alignItems:'center', gap: 12}}>
                    <span style={{fontSize:18, fontWeight:600}}>Quản Lý Đơn Hàng (SO)</span>
                    <Input prefix={<SearchOutlined style={{color:'#bfbfbf'}}/>} placeholder="Tìm mã đơn, tên khách..." value={searchText} onChange={e=>setSearchText(e.target.value)} style={{width: 280}} allowClear />
                </div>
            } 
            extra={
                <Space>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={() => openDetailModal(null)}>Tạo Đơn Mới</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                </Space>
            }
            bodyStyle={{padding: '0 24px 24px'}}
        >
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                items={[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'SO_PENDING', label: 'Chờ Duyệt' },
                    { key: 'SAMPLE_APPROVED', label: 'Đã Duyệt Mẫu' },
                    { key: 'DEPOSITED', label: 'Đang Sản Xuất' },
                    { key: 'DELIVERED', label: 'Đã Giao' },
                    { key: 'COMPLETED', label: 'Hoàn Thành' },
                    { key: 'QUOTATION', label: 'Báo Giá (Draft)' },
                ]} 
                style={{marginBottom: 16}}
            />
            
            <Table 
                dataSource={filteredData} 
                columns={columns} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} đơn hàng` }} 
                size="middle"
            />

            {/* MODALS */}
            <QuickTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} initialValues={taskInitialValues} />
            
            <SalesOrderDetail 
                open={detailModalOpen} 
                onClose={() => setDetailModalOpen(false)} 
                onSuccess={fetchData} 
                initialData={editingOrder} 
                customers={customers} 
                products={products}
                isQuotation={false} 
            />
        </Card>
    </div>
  );
};

export default SalesPage;