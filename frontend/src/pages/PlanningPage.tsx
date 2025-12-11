import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, DatePicker, Row, Col, Tabs, Statistic, Tag, Progress, List, Steps, Alert } from 'antd';
import { CalendarOutlined, ExperimentOutlined, AlertOutlined, ProjectOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker;

const PlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [pendingOrders, setPendingOrders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [mrpData, setMrpData] = useState<any>(null);

  // Selection
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. Load Sales Order đã đặt cọc (Giả lập lọc client nếu API chưa support)
        const resSales = await axios.get(`${API_URL}/sales`);
        const allSales = Array.isArray(resSales.data) ? resSales.data : [];
        // Lọc đơn đã chốt (SO_PENDING/DEPOSITED) và chưa có Plan
        setPendingOrders(allSales.filter((s:any) => 
            (s.status === 'SO_PENDING' || s.status === 'DEPOSITED') && !s.plan_id
        ));

        // 2. Load Plans
        const resPlans = await axios.get(`${API_URL}/planning`);
        setPlans(resPlans.data);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const handleCreatePlan = async (values: any) => {
      try {
          const payload = {
              code: values.code,
              name: values.name,
              start_date: values.dateRange[0].toISOString(),
              end_date: values.dateRange[1].toISOString(),
              orderCodes: pendingOrders.filter((o:any) => selectedRowKeys.includes(o.id)).map((o:any) => o.order_code)
          };
          await axios.post(`${API_URL}/planning/create`, payload);
          message.success('Đã tạo kế hoạch SX');
          setIsModalOpen(false); setSelectedRowKeys([]); fetchData(); setActiveTab('PLANS');
      } catch(e) { message.error('Lỗi tạo kế hoạch'); }
  };

  const handleRunMrp = async (planId: number) => {
      try {
          const res = await axios.post(`${API_URL}/planning/mrp/${planId}`);
          setMrpData(res.data);
          message.success('Đã phân tích BOM & Tồn kho');
          fetchData(); // Reload status
      } catch(e) { message.error('Lỗi chạy MRP'); }
  };

  // --- COLUMNS ---
  const pendingColumns = [
      { title: 'Mã Đơn', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách Hàng', dataIndex: 'customer_name' },
      { title: 'Ngày Giao (Dự kiến)', dataIndex: 'delivery_date', render: (t:any) => t ? <Tag color="orange">{dayjs(t).format('DD/MM/YYYY')}</Tag> : <span style={{color:'red'}}>Chưa chốt</span> },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() }
  ];

  const planColumns = [
      { title: 'Mã KH', dataIndex: 'code', render: (t:any) => <b>{t}</b> },
      { title: 'Tên Đợt', dataIndex: 'name' },
      { title: 'Thời Gian', render: (r:any) => <small>{dayjs(r.start_date).format('DD/MM')} - {dayjs(r.end_date).format('DD/MM')}</small> },
      { title: 'Số Đơn', render: (r:any) => <Tag>{r.sales_orders?.length || 0}</Tag> },
      { title: 'Trạng Thái', dataIndex: 'status', render: (t:any) => t==='CALCULATED' ? <Tag color="green">Đã tính MRP</Tag> : <Tag>Mới tạo</Tag> },
      { 
          title: 'Hành động', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => (
              <Button type="primary" size="small" icon={<ExperimentOutlined />} onClick={() => handleRunMrp(r.id)}>Phân Tích & Gantt</Button>
          )
      }
  ];

  return (
    <div>
      <Row gutter={16} style={{marginBottom: 16}}>
          <Col span={8}><Card><Statistic title="Đơn Hàng Chờ SX" value={pendingOrders.length} prefix={<AlertOutlined />} valueStyle={{color:'#faad14'}} /></Card></Col>
          <Col span={8}><Card><Statistic title="Kế Hoạch Đang Chạy" value={plans.length} prefix={<ProjectOutlined />} valueStyle={{color:'#1890ff'}} /></Card></Col>
      </Row>

      <Card title="Trung Tâm Điều Hành Sản Xuất (Planning Center)" extra={<Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              {
                  key: 'PENDING', label: '1. Gom Đơn Lập Kế Hoạch',
                  children: (
                      <div>
                          <div style={{marginBottom: 10, background:'#fffbe6', padding: 10, border:'1px solid #ffe58f', borderRadius: 4}}>
                              <AlertOutlined /> Vui lòng chọn các đơn hàng có cùng thời điểm giao hàng để lập chung 1 kế hoạch.
                          </div>
                          <Table 
                            rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
                            dataSource={pendingOrders} columns={pendingColumns} rowKey="id" 
                            footer={() => (
                                <Button type="primary" disabled={selectedRowKeys.length === 0} onClick={()=>setIsModalOpen(true)}>
                                    Lập Kế Hoạch Cho {selectedRowKeys.length} Đơn Đã Chọn
                                </Button>
                            )}
                          />
                      </div>
                  )
              },
              {
                  key: 'PLANS', label: '2. Danh Sách Kế Hoạch',
                  children: <Table dataSource={plans} columns={planColumns} rowKey="id" />
              }
          ]} />
      </Card>

      {/* DASHBOARD PHÂN TÍCH (HIỆN KHI CHẠY MRP) */}
      {mrpData && (
          <Modal title={`Phân Tích Kế Hoạch: ${mrpData.plan_info.name}`} open={!!mrpData} onCancel={()=>setMrpData(null)} footer={null} width={900}>
              <Tabs defaultActiveKey="1" items={[
                  {
                      key: '1', label: 'Nhu Cầu Nguyên Liệu (MRP)',
                      children: (
                          <Table dataSource={mrpData.mrp_result} rowKey="material_code" pagination={false} size="small" columns={[
                              { title: 'Nguyên Liệu', dataIndex: 'material_name' },
                              { title: 'Tổng Cần', dataIndex: 'gross_requirement', render: (v:any, r:any) => `${v} ${r.unit}` },
                              { title: 'Tồn Kho', dataIndex: 'available_stock', render: (v:any, r:any) => `${v} ${r.unit}` },
                              { title: 'Cần Mua Thêm', dataIndex: 'net_requirement', render: (v:any, r:any) => <b style={{color: v>0?'red':'green'}}>{v} {r.unit}</b> },
                              { title: 'TT', dataIndex: 'status', render: (t:any) => t==='THIẾU' ? <Tag color="red">THIẾU</Tag> : <Tag color="green">ĐỦ</Tag> }
                          ]} />
                      )
                  },
                  {
                      key: '2', label: 'Tiến Độ (Gantt Chart)',
                      children: (
                          <div>
                              <div style={{marginBottom: 10, fontSize: 12, color:'#888'}}>Biểu đồ tiến độ dự kiến (Từ {dayjs(mrpData.plan_info.start).format('DD/MM')} đến {dayjs(mrpData.plan_info.end).format('DD/MM')})</div>
                              {mrpData.gantt_data.map((task:any) => (
                                  <div key={task.id} style={{marginBottom: 15}}>
                                      <div style={{display:'flex', justifyContent:'space-between', marginBottom: 2}}>
                                          <strong>{task.name}</strong>
                                          <small>{dayjs(task.end).format('DD/MM')}</small>
                                      </div>
                                      <div style={{background:'#f0f0f0', height: 20, borderRadius: 10, overflow:'hidden', position:'relative'}}>
                                          <div style={{width: '100%', height:'100%', background: '#d9d9d9'}}></div>
                                          {/* Giả lập thanh Gantt */}
                                          <div style={{
                                              position: 'absolute', left: '10%', width: '60%', height: '100%', background: '#1890ff',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10
                                          }}>
                                              Tiến độ SX
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )
                  }
              ]} />
          </Modal>
      )}

      {/* MODAL TẠO PLAN */}
      <Modal title="Thiết Lập Kế Hoạch Sản Xuất" open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()}>
          <Form form={form} layout="vertical" onFinish={handleCreatePlan}>
              <Form.Item name="code" label="Mã Kế Hoạch" rules={[{required:true}]}><Input placeholder="VD: PLAN-T12-01" /></Form.Item>
              <Form.Item name="name" label="Tên Đợt / Diễn Giải" rules={[{required:true}]}><Input placeholder="VD: Đợt hàng Noel" /></Form.Item>
              <Form.Item name="dateRange" label="Thời Gian Thực Hiện" rules={[{required:true}]}><RangePicker style={{width:'100%'}} /></Form.Item>
              <div style={{background:'#f6ffed', padding:10, borderRadius:4, border:'1px solid #b7eb8f'}}>
                  Đã chọn: <b>{selectedRowKeys.length}</b> đơn hàng để đưa vào kế hoạch này.
              </div>
          </Form>
      </Modal>
    </div>
  );
};

export default PlanningPage;