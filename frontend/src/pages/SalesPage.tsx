import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Input, Select, DatePicker, Row, Col, Tabs, Progress, Tooltip, Space, Badge, Statistic } from 'antd';
import { PlusOutlined, ReloadOutlined, DollarOutlined, SearchOutlined, CheckCircleOutlined, UnorderedListOutlined, BellOutlined, EditOutlined, LinkOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import QuickTaskModal from '../components/QuickTaskModal';

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE CHO TASK MODAL ---
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskInitialValues, setTaskInitialValues] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/sales`);
        setData(Array.isArray(res.data) ? res.data : []);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateTask = (record: any) => {
      setTaskInitialValues({
          title: `Theo dõi đơn: ${record.order_code}`,
          reference_code: record.order_code,
          reference_type: 'SALES',
          description: `Khách: ${record.customer_name}\nTrạng thái: ${record.status}`
      });
      setTaskModalOpen(true);
  };

  const columns = [
      { 
          title: 'Mã Đơn', dataIndex: 'order_code', 
          render: (t:any) => <Tag color="geekblue" style={{fontSize:13}}>#{t}</Tag> 
      },
      { 
          title: 'Khách Hàng', dataIndex: 'customer_name',
          render: (t:any) => <b>{t}</b>
      },
      { 
          title: 'Ngày Đặt', dataIndex: 'order_date', 
          render: (t:any) => <span style={{color:'#666'}}>{dayjs(t).format('DD/MM/YYYY')}</span> 
      },
      { 
          title: 'Tổng Giá Trị', dataIndex: 'total_amount', align: 'right' as const, 
          render: (v:any) => <b style={{color: '#cf1322', fontSize:14}}>{Number(v).toLocaleString()} ₫</b> 
      },
      { 
          title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const,
          render: (t:any) => {
              let color = 'default';
              let label = t;
              if(t==='QUOTATION') { color = 'orange'; label='Báo Giá'; }
              if(t==='SO_PENDING') { color = 'blue'; label='Chờ Duyệt Mẫu'; }
              if(t==='SAMPLE_APPROVED') { color = 'cyan'; label='Đã Duyệt Mẫu'; }
              if(t==='DEPOSITED') { color = 'purple'; label='Đã Cọc/SX'; }
              if(t==='COMPLETED') { color = 'green'; label='Hoàn Thành'; }
              if(t==='DELIVERED') { color = 'geekblue'; label='Đã Giao'; }
              return <Tag color={color}>{label}</Tag>
          } 
      },
      {
          title: 'Thanh Toán', dataIndex: 'payment_status', width: 150,
          render: (t:any, r:any) => {
              const total = Number(r.total_amount) || 0;
              const paid = Number(r.paid_amount) || 0;
              const pct = total > 0 ? Math.round((paid/total)*100) : 0;
              return (
                  <Tooltip title={`Đã trả: ${paid.toLocaleString()} / ${total.toLocaleString()}`}>
                      <Progress percent={pct} size="small" status={pct>=100?'success':'active'} strokeColor={pct>=100?'#52c41a':'#1890ff'} />
                  </Tooltip>
              )
          }
      },
      {
          title: '', key: 'act', width: 80, align: 'right' as const,
          render: (r: any) => (
              <Space size="small">
                  <Tooltip title="Tạo nhắc nhở"><Button size="small" icon={<BellOutlined/>} onClick={() => handleCreateTask(r)} /></Tooltip>
              </Space>
          )
      }
  ];

  // Lọc dữ liệu theo Tab và Search
  const filteredData = data.filter((x:any) => {
      const matchTab = activeTab === 'ALL' ? true : x.status === activeTab;
      const matchSearch = x.order_code?.toLowerCase().includes(searchText.toLowerCase()) 
                       || x.customer_name?.toLowerCase().includes(searchText.toLowerCase());
      return matchTab && matchSearch;
  });

  const totalRevenue = data.filter((x:any)=>x.status!=='QUOTATION' && x.status!=='CANCELLED').reduce((acc, curr) => acc + Number(curr.total_amount), 0);

  return (
    <div>
        <Row gutter={16} style={{marginBottom: 16}}>
            <Col span={8}><Card bordered={false} style={{background: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)'}}><Statistic title="Doanh Số (Tạm tính)" value={totalRevenue} precision={0} suffix="₫" prefix={<DollarOutlined style={{color:'red'}}/>} /></Card></Col>
            <Col span={8}><Card bordered={false} style={{background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)'}}><Statistic title="Tổng Đơn Hàng" value={data.length} prefix={<ShoppingCartOutlined style={{color:'blue'}}/>} /></Card></Col>
        </Row>

        <Card 
            title={
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                    <span>Pipeline Bán Hàng</span>
                    <Input prefix={<SearchOutlined/>} placeholder="Tìm đơn hàng..." value={searchText} onChange={e=>setSearchText(e.target.value)} style={{width: 200, fontSize:13}} allowClear />
                </div>
            } 
            extra={
                <Space>
                    <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/sales/pricelist')}>Bảng Giá</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
                </Space>
            }
        >
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                type="card"
                items={[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'QUOTATION', label: 'Báo Giá' },
                    { key: 'SO_PENDING', label: 'Chờ Duyệt' },
                    { key: 'SAMPLE_APPROVED', label: 'Đã Duyệt' },
                    { key: 'DEPOSITED', label: 'SX / Cọc' },
                    { key: 'DELIVERED', label: 'Đã Giao' },
                ]} 
            />
            <Table 
                dataSource={filteredData} 
                columns={columns} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true }} 
            />

            <QuickTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} initialValues={taskInitialValues} />
        </Card>
    </div>
  );
};

export default SalesPage;