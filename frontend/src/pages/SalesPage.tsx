import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Modal, Form, Input, Select, DatePicker, Row, Col, Tabs, Progress, Tooltip, Space } from 'antd';
import { PlusOutlined, ReloadOutlined, DollarOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  
  // FIX: Thêm <any[]> để tránh lỗi never[]
  const [data, setData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/sales`);
        setData(Array.isArray(res.data) ? res.data : []);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
      }
  ];

  const filteredData = activeTab === 'ALL' ? data : data.filter((x:any) => x.status === activeTab);

  return (
    <Card title="Pipeline Bán Hàng" extra={<Button icon={<ReloadOutlined />} onClick={fetchData} />}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'QUOTATION', label: 'Báo Giá' },
            { key: 'SO_PENDING', label: 'Chốt Đơn (SO)' },
            { key: 'DEPOSITED', label: 'Đã Cọc' },
            { key: 'DELIVERED', label: 'Đã Giao' },
        ]} />
        <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
    </Card>
  );
};

export default SalesPage;