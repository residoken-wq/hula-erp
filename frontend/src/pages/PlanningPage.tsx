import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, DatePicker, Row, Col, Tabs, Statistic, Tag, Progress, List, Typography, Divider, Spin, Empty } from 'antd';
import { 
    CalendarOutlined, ExperimentOutlined, AlertOutlined, ProjectOutlined, ReloadOutlined, 
    CheckCircleOutlined, DollarOutlined, ShoppingCartOutlined, BarChartOutlined, AppstoreAddOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const PlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [pendingOrders, setPendingOrders] = useState([]);
  const [plans, setPlans] = useState([]);
  
  // MRP & Analysis Data
  const [mrpData, setMrpData] = useState<any>(null); // Dữ liệu phân tích
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Selection for Creation
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        // Lấy danh sách gợi ý (Đơn đã cọc, chưa có Plan)
        const resSuggest = await axios.get(`${API_URL}/planning/suggestion`);
        setPendingOrders(resSuggest.data);

        // Lấy danh sách kế hoạch đã tạo
        const resPlans = await axios.get(`${API_URL}/planning`);
        setPlans(resPlans.data);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Actions
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
          setIsCreateModalOpen(false); 
          setSelectedRowKeys([]); 
          fetchData(); 
          setActiveTab('PLANS');
      } catch(e) { message.error('Lỗi tạo kế hoạch'); }
  };

  const handleRunMrp = async (planId: number) => {
      setLoading(true);
      try {
          const res = await axios.post(`${API_URL}/planning/mrp/${planId}`);
          setMrpData(res.data);
          setIsDashboardOpen(true);
          fetchData(); // Reload status PLAN
      } catch(e) { message.error('Lỗi chạy MRP'); }
      setLoading(false);
  };

  const handleGeneratePOs = async () => {
      if (!mrpData) return;
      try {
          // Gọi API sinh PO từ kết quả MRP
          const res = await axios.post(`${API_URL}/planning/${mrpData.plan_info.id}/generate-pos`, { mrpData: mrpData.mrp_result });
          message.success(res.data.message);
          setIsDashboardOpen(false); // Đóng modal để user qua trang Purchasing check
      } catch(e) { message.error('Lỗi tạo PO'); }
  };

  // --- COLUMNS ---
  const pendingColumns = [
      { title: 'Mã Đơn', dataIndex: 'order_code', render: (t:any) => <b>{t}</b> },
      { title: 'Khách Hàng', dataIndex: 'customer_name' },
      { title: 'Ngày Giao (Deadline)', dataIndex: 'delivery_date', render: (t:any) => t ? <Tag color="red">{dayjs(t).format('DD/MM/YYYY')}</Tag> : <span style={{color:'#ccc'}}>Chưa chốt</span> },
      { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() }
  ];

  const planColumns = [
      { title: 'Mã Kế Hoạch', dataIndex: 'code', render: (t:any) => <b>{t}</b> },
      { title: 'Diễn Giải', dataIndex: 'name' },
      { title: 'Thời Gian', render: (r:any) => <small>{dayjs(r.start_date).format('DD/MM')} - {dayjs(r.end_date).format('DD/MM')}</small> },
      { title: 'Số Đơn', render: (r:any) => <Tag color="blue">{r.sales_orders?.length || 0} Đơn</Tag> },
      { 
          title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const,
          render: (t:any) => t==='CALCULATED' ? <Tag color="green" icon={<CheckCircleOutlined/>}>Đã tính MRP</Tag> : <Tag>Mới tạo</Tag> 
      },
      { 
          title: 'Hành động', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => (
              <Button type="primary" size="small" icon={<ExperimentOutlined />} onClick={() => handleRunMrp(r.id)}>Phân Tích & Chỉ Đạo</Button>
          )
      }
  ];

  // --- DASHBOARD CALCULATIONS ---
  const renderDashboard = () => {
      if (!mrpData) return null;
      
      const totalRevenue = mrpData.plan_info.sales_orders.reduce((s:number, o:any) => s + Number(o.total_amount), 0);
      const estMaterialCost = mrpData.mrp_result.reduce((s:number, i:any) => s + (Number(i.net_requirement) * Number(i.cost)), 0);
      const estProfit = totalRevenue - estMaterialCost; // (Lợi nhuận gộp tạm tính, chưa trừ nhân công/khấu hao chi tiết ở đây)
      
      return (
          <div>
              {/* 1. FINANCIAL DASHBOARD */}
              <div style={{marginBottom: 20, background:'#f5f7fa', padding:20, borderRadius:12, border:'1px solid #e6ebf1'}}>
                  <Row gutter={24} style={{textAlign:'center'}}>
                      <Col span={8} style={{borderRight:'1px solid #ddd'}}>
                          <Statistic title="Tổng Doanh Thu Đơn Hàng" value={totalRevenue} prefix={<DollarOutlined/>} suffix="đ" valueStyle={{color:'#1890ff', fontWeight:'bold'}} />
                      </Col>
                      <Col span={8} style={{borderRight:'1px solid #ddd'}}>
                          <Statistic title="Chi Phí NPL Cần Mua" value={estMaterialCost} prefix={<ShoppingCartOutlined/>} suffix="đ" valueStyle={{color:'#cf1322', fontWeight:'bold'}} />
                          <div style={{fontSize:12, color:'#888'}}>Dựa trên BOM và giá nhập gần nhất</div>
                      </Col>
                      <Col span={8}>
                          <Statistic title="Lợi Nhuận Gộp (Ước tính)" value={estProfit} prefix={<BarChartOutlined/>} suffix="đ" valueStyle={{color: estProfit>0?'#3f8600':'#cf1322', fontWeight:'bold'}} />
                          <div style={{fontSize:12, color:'#888'}}>Chưa trừ nhân công & Vận hành</div>
                      </Col>
                  </Row>
              </div>

              {/* 2. TABS DETAIL */}
              <Tabs defaultActiveKey="1" items={[
                  {
                      key: '1', label: 'Nhu Cầu Nguyên Liệu (MRP)',
                      children: (
                          <div>
                              <Table 
                                dataSource={mrpData.mrp_result} 
                                rowKey="material_id" 
                                pagination={false} 
                                size="small" 
                                scroll={{y: 300}}
                                columns={[
                                  { title: 'Nguyên Liệu', dataIndex: 'material_name', render: (t,r) => <div><b>{r.material_code}</b><br/>{t}</div> },
                                  { title: 'ĐVT', dataIndex: 'unit', align:'center', width: 60 },
                                  { title: 'Tổng Cần', dataIndex: 'gross_requirement', align:'center', render: (v)=>Number(v).toLocaleString() },
                                  { title: 'Tồn Kho', dataIndex: 'available_stock', align:'center', render: (v)=><span style={{color:'green'}}>{Number(v).toLocaleString()}</span> },
                                  { title: 'Cần Mua Thêm', dataIndex: 'net_requirement', align:'center', render: (v)=> v>0 ? <b style={{color:'red'}}>{Number(v).toLocaleString()}</b> : '-' },
                                  { title: 'NCC Gợi ý', dataIndex: 'supplier_name', render: (t) => t || <span style={{color:'#ccc'}}>Chưa có</span> },
                                  { title: 'Chi phí', align:'right', render: (r) => (r.net_requirement * r.cost).toLocaleString() }
                              ]} />
                              
                              <div style={{marginTop: 20, textAlign:'right'}}>
                                  <Button type="primary" size="large" icon={<AppstoreAddOutlined />} onClick={handleGeneratePOs}>
                                      Tạo Đơn Mua Hàng (PO) Tự Động
                                  </Button>
                                  <div style={{fontSize:12, color:'#666', marginTop:5}}>Hệ thống sẽ tự động gom NPL theo Nhà cung cấp để tạo PO nháp</div>
                              </div>
                          </div>
                      )
                  },
                  {
                      key: '2', label: 'Tiến Độ (Gantt Chart)',
                      children: (
                          <div>
                              <div style={{marginBottom: 10, fontSize: 12, color:'#888'}}>Kế hoạch thực hiện: {dayjs(mrpData.plan_info.start).format('DD/MM')} - {dayjs(mrpData.plan_info.end).format('DD/MM')}</div>
                              {mrpData.gantt_data.map((task:any) => (
                                  <div key={task.id} style={{marginBottom: 15}}>
                                      <div style={{display:'flex', justifyContent:'space-between', marginBottom: 2}}>
                                          <strong>{task.name}</strong>
                                          <small>Deadline: {dayjs(task.end).format('DD/MM')}</small>
                                      </div>
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
                              <AlertOutlined /> Vui lòng chọn các đơn hàng đã nhận cọc (DEPOSITED) để lập chung 1 kế hoạch sản xuất.
                          </div>
                          <Table 
                            rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
                            dataSource={pendingOrders} columns={pendingColumns} rowKey="id" 
                            footer={() => (
                                <Button type="primary" disabled={selectedRowKeys.length === 0} onClick={()=>setIsCreateModalOpen(true)}>
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

      {/* MODAL DASHBOARD */}
      <Modal 
        title={`Phân Tích & Chỉ Đạo: ${mrpData?.plan_info?.name || ''}`} 
        open={isDashboardOpen} 
        onCancel={()=>setIsDashboardOpen(false)} 
        footer={null} 
        width={1000}
        style={{top: 20}}
      >
          {renderDashboard()}
      </Modal>

      {/* MODAL TẠO PLAN */}
      <Modal title="Thiết Lập Kế Hoạch Sản Xuất" open={isCreateModalOpen} onCancel={()=>setIsCreateModalOpen(false)} onOk={()=>form.submit()}>
          <Form form={form} layout="vertical" onFinish={handleCreatePlan}>
              <Form.Item name="code" label="Mã Kế Hoạch" rules={[{required:true}]}><Input placeholder="VD: PLAN-T12-01" /></Form.Item>
              <Form.Item name="name" label="Tên Đợt / Diễn Giải" rules={[{required:true}]}><Input placeholder="VD: Đợt hàng Noel" /></Form.Item>
              <Form.Item name="dateRange" label="Thời Gian Thực Hiện" rules={[{required:true}]}><RangePicker style={{width:'100%'}} /></Form.Item>
              <div style={{background:'#f6ffed', padding:10, borderRadius:4, border:'1px solid #b7eb8f'}}>
                  Đã chọn: <b>{selectedRowKeys.length}</b> đơn hàng. Tổng giá trị: <b>{pendingOrders.filter((o:any) => selectedRowKeys.includes(o.id)).reduce((s, o:any) => s + Number(o.total_amount), 0).toLocaleString()} đ</b>
              </div>
          </Form>
      </Modal>
    </div>
  );
};

export default PlanningPage;