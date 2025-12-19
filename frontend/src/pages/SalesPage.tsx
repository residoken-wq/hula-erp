import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, DatePicker, Row, Col, Tabs, Progress, Tooltip, Space } from 'antd';
import { PlusOutlined, ReloadOutlined, DollarOutlined, InfoCircleOutlined, CheckCircleOutlined, UnorderedListOutlined, BellOutlined, EditOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';
import QuickTaskModal from '../components/QuickTaskModal'; // <--- MỚI: Import Modal Task

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE CHO TASK MODAL (MỚI) ---
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskInitialValues, setTaskInitialValues] = useState<any>({});
  // ----------------------------------

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/sales`);
        setData(Array.isArray(res.data) ? res.data : []);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- HÀM MỞ TASK MODAL (MỚI) ---
  const handleCreateTask = (record: any) => {
      setTaskInitialValues({
          title: `Theo dõi đơn: ${record.order_code}`,
          reference_code: record.order_code,
          reference_type: 'SALES',
          description: `Khách: ${record.customer_name}\nTrạng thái: ${record.status}`
      });
      setTaskModalOpen(true);
  };
  // -------------------------------

  const columns = [
      { title: 'Mã', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách', dataIndex: 'customer_name' },
      { title: 'Ngày', dataIndex: 'order_date', render: (t:any) => dayjs(t).format('DD/MM/YYYY') },
      { title: 'Giá trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { 
          title: 'Trạng thái', dataIndex: 'status', 
          render: (t:any) => {
              let color = 'default';
              if(t==='QUOTATION') color = 'orange';
              if(t==='SO_PENDING') color = 'blue';
              if(t==='SAMPLE_APPROVED') color = 'cyan';
              if(t==='DEPOSITED') color = 'purple';
              if(t==='COMPLETED') color = 'green';
              return <Tag color={color}>{t}</Tag>
          } 
      },
      {
          title: 'Thanh toán', dataIndex: 'payment_status',
          render: (t:any, r:any) => {
              const pct = r.total_amount > 0 ? Math.round((Number(r.paid_amount)/Number(r.total_amount))*100) : 0;
              return <Tooltip title={`Đã trả: ${Number(r.paid_amount).toLocaleString()}`}><Progress percent={pct} size="small" status={pct>=100?'success':'active'} /></Tooltip>
          }
      },
      {
          title: 'Thao tác', key: 'act', width: 100, align: 'right' as const,
          render: (r: any) => (
              <Space size="small">
                  {/* --- MỚI: Nút Tạo Task --- */}
                  <Tooltip title="Tạo nhắc nhở">
                      <Button size="small" icon={<BellOutlined/>} onClick={() => handleCreateTask(r)} />
                  </Tooltip>
                  {/* Demo nút xem chi tiết (nếu có logic modal ở đây thì gắn vào) */}
                  {/* <Button size="small" icon={<EditOutlined/>} /> */}
              </Space>
          )
      }
  ];

  const filteredData = activeTab === 'ALL' ? data : data.filter((x:any) => x.status === activeTab);

  return (
    <Card 
        title="Pipeline Bán Hàng" 
        extra={
            <Space>
                <Button 
                    icon={<UnorderedListOutlined />} 
                    onClick={() => navigate('/sales/pricelist')}
                >
                    Quản lý Bảng Giá
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Tải lại</Button>
            </Space>
        }
    >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'QUOTATION', label: 'Báo Giá' },
            { key: 'SO_PENDING', label: 'Chờ Duyệt Mẫu' },
            { key: 'SAMPLE_APPROVED', label: 'Đã Duyệt Mẫu' },
            { key: 'DEPOSITED', label: 'Đã Cọc/SX' },
            { key: 'DELIVERED', label: 'Đã Giao' },
        ]} />
        <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />

        {/* --- MỚI: Modal Quick Task --- */}
        <QuickTaskModal 
            open={taskModalOpen} 
            onClose={() => setTaskModalOpen(false)} 
            initialValues={taskInitialValues} 
        />
        {/* --------------------------- */}
    </Card>
  );
};

export default SalesPage;