import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, DatePicker, Row, Col, Tabs, Statistic, Tag, Progress, Typography } from 'antd';
import { CalendarOutlined, ExperimentOutlined, AlertOutlined, ProjectOutlined, ReloadOutlined, CheckCircleOutlined, DollarOutlined, ShoppingCartOutlined, BarChartOutlined, AppstoreAddOutlined, ScissorOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker;

const PlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  
  // State dữ liệu phân tích (MRP + Outsourcing)
  const [mrpData, setMrpData] = useState<any>(null); 
  const [outsourcingList, setOutsourcingList] = useState<any[]>([]); // <--- MỚI: State cho gia công
  
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
        const [resSuggest, resPlans] = await Promise.all([
            axios.get(`${API_URL}/planning/suggestion`),
            axios.get(`${API_URL}/planning`)
        ]);
        setPendingOrders(Array.isArray(resSuggest.data) ? resSuggest.data : []);
        setPlans(Array.isArray(resPlans.data) ? resPlans.data : []);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
          setIsCreateModalOpen(false); setSelectedRowKeys([]); fetchData(); setActiveTab('PLANS');
      } catch(e) { message.error('Lỗi tạo kế hoạch'); }
  };

  const handleRunMrp = async (planId: number) => {
      setLoading(true);
      try {
          const res = await axios.post(`${API_URL}/planning/mrp/${planId}`);
          setMrpData(res.data);
          // Set danh sách gia công từ response
          setOutsourcingList(res.data.outsourcing_result || []);
          setIsDashboardOpen(true);
          fetchData();
      } catch(e) { message.error('Lỗi chạy MRP'); }
      setLoading(false);
  };

  // --- HÀM TẠO PO CHUNG (NPL hoặc Gia công) ---
  const handleGeneratePOs = async (type: 'MATERIAL' | 'OUTSOURCING') => {
      if (!mrpData) return;
      
      // Chọn nguồn dữ liệu dựa trên loại
      const itemsToOrder = type === 'MATERIAL' ? mrpData.mrp_result : outsourcingList;
      
      try {
          const res = await axios.post(`${API_URL}/planning/${mrpData.plan_info.id}/generate-pos`, { 
              items: itemsToOrder // Gửi kèm note đã nhập
          });
          message.success(res.data.message);
          // Không đóng modal để user có thể tạo tiếp loại kia
      } catch(e) { message.error('Lỗi tạo PO'); }
  };

  // --- HÀM UPDATE GHI CHÚ TRONG STATE ---
  const handleNoteChange = (type: 'MATERIAL' | 'OUTSOURCING', index: number, value: string) => {
      if (type === 'MATERIAL') {
          const newData = [...mrpData.mrp_result];
          newData[index].note = value;
          setMrpData({ ...mrpData, mrp_result: newData });
      } else {
          const newData = [...outsourcingList];
          newData[index].note = value;
          setOutsourcingList(newData);
      }
  };

  const pendingColumns = [
      { title: 'Mã Đơn', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách Hàng', dataIndex: 'customer_name' },
      { title: 'Trạng Thái', dataIndex: 'status', render: (t:any) => <Tag>{t}</Tag> },
      { title: 'Ngày Giao', dataIndex: 'delivery_date', render: (t:any) => t ? <Tag color="red">{dayjs(t).format('DD/MM')}</Tag> : '-' },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() }
  ];

  const planColumns = [
      { title: 'Mã KH', dataIndex: 'code', render: (t:any) => <b>{t}</b> },
      { title: 'Tên Đợt', dataIndex: 'name' },
      { title: 'Thời Gian', render: (r:any) => <small>{dayjs(r.start_date).format('DD/MM')} - {dayjs(r.end_date).format('DD/MM')}</small> },
      { title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const, render: (t:any) => t==='CALCULATED' ? <Tag color="green">Đã tính MRP</Tag> : <Tag>Mới</Tag> },
      { title: 'Hành động', key: 'act', align: 'right' as const, render: (_:any, r:any) => <Button type="primary" size="small" icon={<ExperimentOutlined />} onClick={() => handleRunMrp(r.id)}>Phân Tích</Button> }
  ];

  const renderDashboard = () => {
      if (!mrpData) return null;
      const totalRevenue = mrpData.plan_info.sales_orders.reduce((s:number, o:any) => s + Number(o.total_amount), 0);
      const estMaterialCost = mrpData.mrp_result.reduce((s:number, i:any) => s + (Number(i.net_requirement) * Number(i.cost)), 0);
      // Ước tính chi phí gia công
      const estOutsourceCost = outsourcingList.reduce((s:number, i:any) => s + (Number(i.total_cost)), 0);
      
      return (
          <div>
              <div style={{marginBottom: 20, background:'#f5f7fa', padding:15, borderRadius:8}}>
                  <Row gutter={24} style={{textAlign:'center'}}>
                      <Col span={6}><Statistic title="Doanh Thu" value={totalRevenue} prefix={<DollarOutlined/>} suffix="đ" valueStyle={{fontSize:16}} /></Col>
                      <Col span={6}><Statistic title="CP Nguyên Liệu" value={estMaterialCost} prefix={<ShoppingCartOutlined/>} suffix="đ" valueStyle={{color:'#cf1322', fontSize:16}} /></Col>
                      <Col span={6}><Statistic title="CP Gia Công" value={estOutsourceCost} prefix={<ScissorOutlined/>} suffix="đ" valueStyle={{color:'#d46b08', fontSize:16}} /></Col>
                      <Col span={6}><Statistic title="Lợi Nhuận Gộp (Dự kiến)" value={totalRevenue - estMaterialCost - estOutsourceCost} prefix={<BarChartOutlined/>} suffix="đ" valueStyle={{color:'green', fontSize:16}} /></Col>
                  </Row>
              </div>
              <Tabs defaultActiveKey="1" items={[
                  {
                      key: '1', label: '1. Nhu Cầu Nguyên Liệu (MRP)',
                      children: (
                          <div>
                              <Table dataSource={mrpData.mrp_result} rowKey="material_id" pagination={false} size="small" scroll={{y: 300}}
                                columns={[
                                  { title: 'Nguyên Liệu', dataIndex: 'material_name', render: (t:any,r:any) => <div><b>{r.material_code}</b><br/>{t}</div> },
                                  { title: 'Tổng Cần', dataIndex: 'gross_requirement', align:'center' as const },
                                  { title: 'Tồn Kho', dataIndex: 'available_stock', align:'center' as const },
                                  { title: 'Cần Mua', dataIndex: 'net_requirement', align:'center' as const, render: (v:any)=> v>0 ? <b style={{color:'red'}}>{Number(v).toLocaleString()}</b> : '-' },
                                  { title: 'NCC', dataIndex: 'supplier_name' },
                                  // --- CỘT GHI CHÚ ---
                                  { 
                                      title: 'Ghi chú PO', 
                                      render: (t:any, r:any, idx:number) => <Input size="small" value={r.note} onChange={(e) => handleNoteChange('MATERIAL', idx, e.target.value)} placeholder="Note..." /> 
                                  }
                              ]} />
                              <div style={{marginTop: 15, textAlign:'right'}}><Button type="primary" icon={<AppstoreAddOutlined />} onClick={() => handleGeneratePOs('MATERIAL')}>Tạo PO Nguyên Liệu</Button></div>
                          </div>
                      )
                  },
                  {
                      // --- TAB GIA CÔNG MỚI ---
                      key: '2', label: '2. Nhu Cầu Gia Công (Outsource)',
                      children: (
                          <div>
                              <Table dataSource={outsourcingList} rowKey={(r,i)=>i||0} pagination={false} size="small" scroll={{y: 300}}
                                columns={[
                                  { title: 'Sản Phẩm', dataIndex: 'product_sku', render: (t:any) => <b>{t}</b> },
                                  { title: 'Công Đoạn', dataIndex: 'step_name' },
                                  { title: 'Nhà Gia Công', dataIndex: 'supplier_name', render: (t:any) => <Tag color="blue">{t || 'Chưa gán'}</Tag> },
                                  { title: 'Số Lượng', dataIndex: 'quantity', align:'center' as const },
                                  { title: 'Đơn Giá', dataIndex: 'unit_price', align:'right' as const, render: (v:any) => Number(v).toLocaleString() },
                                  { title: 'Thành Tiền', dataIndex: 'total_cost', align:'right' as const, render: (v:any) => <b>{Number(v).toLocaleString()}</b> },
                                  // --- CỘT GHI CHÚ ---
                                  { 
                                      title: 'Ghi chú PO', 
                                      width: 200,
                                      render: (t:any, r:any, idx:number) => <Input size="small" value={r.note} onChange={(e) => handleNoteChange('OUTSOURCING', idx, e.target.value)} placeholder="Ghi chú đơn hàng..." /> 
                                  }
                              ]} />
                              <div style={{marginTop: 15, textAlign:'right'}}><Button type="primary" style={{backgroundColor:'#d46b08'}} icon={<ScissorOutlined />} onClick={() => handleGeneratePOs('OUTSOURCING')}>Tạo Đơn Hàng Gia Công</Button></div>
                          </div>
                      )
                  },
                  {
                      key: '3', label: '3. Tiến Độ (Gantt)',
                      children: (
                          <div>
                              {mrpData.gantt_data.map((task:any) => (
                                  <div key={task.id} style={{marginBottom: 15}}>
                                      <div style={{display:'flex', justifyContent:'space-between'}}><strong>{task.name}</strong><small>{dayjs(task.end).format('DD/MM')}</small></div>
                                      <Progress percent={30} strokeColor="#1890ff" trailColor="#f0f0f0" />
                                  </div>
                              ))}
                          </div>
                      )
                  }
              ]} />
          </div>
      );
  };

  return (
    <div>
      <Row gutter={16} style={{marginBottom: 16}}><Col span={8}><Card><Statistic title="Đơn Hàng Chờ SX" value={pendingOrders.length} prefix={<AlertOutlined />} valueStyle={{color:'#faad14'}} /></Card></Col><Col span={8}><Card><Statistic title="Kế Hoạch Đang Chạy" value={plans.length} prefix={<ProjectOutlined />} valueStyle={{color:'#1890ff'}} /></Card></Col></Row>
      <Card title="Trung Tâm Điều Hành Sản Xuất (Planning Center)" extra={<Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              { key: 'PENDING', label: '1. Gom Đơn Lập Kế Hoạch', children: <div><div style={{marginBottom: 10, background:'#fffbe6', padding: 10}}><AlertOutlined /> Chọn đơn hàng để lập kế hoạch.</div><Table rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }} dataSource={pendingOrders} columns={pendingColumns} rowKey="id" footer={() => (<Button type="primary" disabled={selectedRowKeys.length === 0} onClick={()=>setIsCreateModalOpen(true)}>Lập Kế Hoạch</Button>)} /></div> },
              { key: 'PLANS', label: '2. Danh Sách Kế Hoạch', children: <Table dataSource={plans} columns={planColumns} rowKey="id" /> }
          ]} />
      </Card>
      <Modal title={`Phân Tích Kế Hoạch: ${mrpData?.plan_info?.name || ''}`} open={isDashboardOpen} onCancel={()=>setIsDashboardOpen(false)} footer={null} width={1100} style={{top: 20}}>{renderDashboard()}</Modal>
      <Modal title="Thiết Lập Kế Hoạch" open={isCreateModalOpen} onCancel={()=>setIsCreateModalOpen(false)} onOk={()=>form.submit()}><Form form={form} layout="vertical" onFinish={handleCreatePlan}><Form.Item name="code" label="Mã KH" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="name" label="Tên Đợt" rules={[{required:true}]}><Input /></Form.Item><Form.Item name="dateRange" label="Thời Gian" rules={[{required:true}]}><RangePicker style={{width:'100%'}} /></Form.Item></Form></Modal>
    </div>
  );
};
export default PlanningPage;