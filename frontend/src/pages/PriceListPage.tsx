import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, DatePicker, Select, Tag, Drawer, Row, Col, InputNumber, Divider, Space, Typography } from 'antd';
import { PlusOutlined, SettingOutlined, CalendarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const PriceListsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // Master data cho Select
  
  // State Modal Tạo Bảng Giá
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formList] = Form.useForm();

  // State Drawer Cấu hình Rules
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPriceList, setCurrentPriceList] = useState<any>(null);
  const [currentRules, setCurrentRules] = useState<any[]>([]);
  const [formRule] = Form.useForm();
  const [loadingRules, setLoadingRules] = useState(false);

  // 1. Init Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const [resLists, resProds] = await Promise.all([
            axios.get(`${API_URL}/sales/price-lists`),
            axios.get(`${API_URL}/products`)
        ]);
        setPriceLists(Array.isArray(resLists.data) ? resLists.data : []);
        // Map sản phẩm để dùng trong Select
        setProducts(Array.isArray(resProds.data) ? resProds.data.map((p:any) => ({label: `${p.sku} - ${p.name}`, value: p.sku})) : []);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Xử lý Tạo Bảng Giá
  const handleCreateList = async (values: any) => {
      try {
          const payload = {
              ...values,
              valid_from: values.validity[0].format('YYYY-MM-DD'),
              valid_to: values.validity[1].format('YYYY-MM-DD'),
              is_active: true
          };
          await axios.post(`${API_URL}/sales/price-lists`, payload);
          message.success('Tạo bảng giá thành công');
          setIsModalOpen(false);
          fetchData();
      } catch(e) { message.error('Lỗi tạo bảng giá'); }
  };

  // 3. Mở Drawer & Tải Rules
  const openRulesDrawer = async (record: any) => {
      setCurrentPriceList(record);
      setIsDrawerOpen(true);
      fetchRules(record.id);
  };

  const fetchRules = async (listId: number) => {
      setLoadingRules(true);
      try {
          const res = await axios.get(`${API_URL}/sales/price-lists/${listId}/rules`);
          setCurrentRules(res.data || []);
      } catch(e) { message.error('Lỗi tải quy tắc giá'); }
      setLoadingRules(false);
  };

  // 4. Thêm Rule Mới
  const handleAddRule = async (values: any) => {
      try {
          await axios.post(`${API_URL}/sales/price-lists/${currentPriceList.id}/rules`, values);
          message.success('Đã thêm quy tắc giá');
          formRule.resetFields();
          fetchRules(currentPriceList.id);
      } catch(e: any) { message.error(e.response?.data?.message || 'Lỗi thêm quy tắc'); }
  };

  // --- CẤU HÌNH CỘT BẢNG GIÁ ---
  const listColumns = [
      { 
          title: 'Tên Bảng Giá', dataIndex: 'name', 
          render: (t:any) => <span style={{fontWeight: 600, fontSize: 15, color: '#1890ff'}}>{t}</span> 
      },
      { 
          title: 'Áp dụng cho', dataIndex: 'user_id', 
          render: (uid: number) => <Tag color="blue">User ID: {uid}</Tag> 
      },
      { 
          title: 'Thời gian hiệu lực', 
          render: (_:any, r:any) => (
              <Space>
                  <Tag icon={<CalendarOutlined />}>{dayjs(r.valid_from).format('DD/MM/YYYY')}</Tag>
                  →
                  <Tag>{dayjs(r.valid_to).format('DD/MM/YYYY')}</Tag>
                  {dayjs().isAfter(dayjs(r.valid_to)) && <Tag color="red">Hết hạn</Tag>}
              </Space>
          )
      },
      { 
          title: 'Trạng thái', dataIndex: 'is_active', 
          render: (act: boolean) => act ? <Tag color="success">Đang chạy</Tag> : <Tag>Dừng</Tag> 
      },
      {
          title: '', key: 'action', align: 'right' as const,
          render: (_:any, r:any) => (
              <Button type="primary" ghost size="small" icon={<SettingOutlined />} onClick={() => openRulesDrawer(r)}>
                  Cấu hình giá
              </Button>
          )
      }
  ];

  // --- CẤU HÌNH CỘT RULES ---
  const ruleColumns = [
      { title: 'Sản phẩm (SKU)', dataIndex: 'product_sku', width: 200, render: (t:any) => <b>{t}</b> },
      { 
          title: 'Giới hạn Giá bán (VND)', 
          render: (_:any, r:any) => (
              <div style={{fontSize: 13}}>
                  {r.min_price && <div style={{color: '#faad14'}}><FallOutlined/> Min: {Number(r.min_price).toLocaleString()} ₫</div>}
                  {r.max_price && <div style={{color: '#52c41a'}}><RiseOutlined/> Max: {Number(r.max_price).toLocaleString()} ₫</div>}
                  {!r.min_price && !r.max_price && <span style={{color:'#ccc'}}>Không giới hạn</span>}
              </div>
          )
      },
      { 
          title: 'Giới hạn Lợi nhuận (%)', 
          render: (_:any, r:any) => (
              <div style={{fontSize: 13}}>
                  {r.min_margin && <div>Min: <b>{r.min_margin}%</b></div>}
                  {r.max_margin && <div>Max: <b>{r.max_margin}%</b></div>}
                  {!r.min_margin && !r.max_margin && <span style={{color:'#ccc'}}>Không giới hạn</span>}
              </div>
          )
      }
  ];

  return (
    <div style={{paddingBottom: 20}}>
        <Card 
            title={<Title level={4} style={{margin:0}}>Quản Lý Bảng Giá (Price Lists)</Title>} 
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setIsModalOpen(true); formList.resetFields()}}>Tạo Bảng Giá Mới</Button>}
            bordered={false}
            style={{boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}
        >
            <Table dataSource={priceLists} columns={listColumns} rowKey="id" loading={loading} pagination={{pageSize: 10}} />
        </Card>

        {/* --- MODAL TẠO BẢNG GIÁ --- */}
        <Modal 
            title="Thiết lập Bảng Giá Mới" 
            open={isModalOpen} 
            onCancel={()=>setIsModalOpen(false)} 
            onOk={()=>formList.submit()}
        >
            <Form form={formList} layout="vertical" onFinish={handleCreateList}>
                <Form.Item name="name" label="Tên Bảng Giá" rules={[{required:true}]}><Input placeholder="VD: Bảng giá Sale Team A - Q1/2024" /></Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="user_id" label="Áp dụng cho User (ID)" rules={[{required:true}]} help="Nhập ID Sale (VD: 1)."><InputNumber style={{width:'100%'}} /></Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="validity" label="Thời gian hiệu lực" rules={[{required:true}]}>
                            <RangePicker style={{width:'100%'}} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
            </Form>
        </Modal>

        {/* --- DRAWER CẤU HÌNH RULES --- */}
        <Drawer 
            title={currentPriceList ? `Cấu hình chi tiết: ${currentPriceList.name}` : 'Chi tiết Bảng Giá'} 
            width={800} 
            open={isDrawerOpen} 
            onClose={()=>setIsDrawerOpen(false)}
            bodyStyle={{paddingTop: 10, background: '#f0f2f5'}}
        >
            <div style={{background: '#fff', padding: 20, borderRadius: 8, marginBottom: 15, boxShadow: '0 1px 2px rgba(0,0,0,0.03)'}}>
                <div style={{fontWeight: 600, marginBottom: 15, color: '#0050b3', textTransform: 'uppercase', fontSize: 13}}>Thêm Quy Tắc Giá Mới</div>
                <Form form={formRule} layout="vertical" onFinish={handleAddRule}>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item name="product_sku" label="Sản phẩm áp dụng" rules={[{required:true}]}>
                                <Select showSearch options={products} placeholder="Tìm kiếm SKU hoặc Tên sản phẩm..." optionFilterProp="label" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label=" " colon={false}>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>Lưu Quy Tắc</Button>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Divider orientation="left" style={{margin: '5px 0 15px 0', fontSize: 12}}>Giới hạn (Nhập số 0 hoặc bỏ trống nếu không áp dụng)</Divider>
                    
                    <Row gutter={16}>
                        <Col span={6}><Form.Item name="min_price" label="Giá Min (₫)"><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} placeholder="Thấp nhất" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="max_price" label="Giá Max (₫)"><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} placeholder="Cao nhất" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="min_margin" label="Margin Min (%)"><InputNumber style={{width:'100%'}} placeholder="Lãi min" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="max_margin" label="Margin Max (%)"><InputNumber style={{width:'100%'}} placeholder="Lãi max" /></Form.Item></Col>
                    </Row>
                </Form>
            </div>

            <Table 
                dataSource={currentRules} 
                columns={ruleColumns} 
                rowKey="id" 
                loading={loadingRules} 
                size="small"
                pagination={{pageSize: 10}}
                style={{background: '#fff', borderRadius: 8}}
            />
        </Drawer>
    </div>
  );
};

export default PriceListsPage;