import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Space, Popconfirm, Row, Col, Divider, Drawer, List, DatePicker, InputNumber, Checkbox, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BankOutlined, DollarOutlined, AppstoreOutlined, CalendarOutlined, StarFilled, StarOutlined, ShopOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const SuppliersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // DRAWER PRICE STATE
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);
  const [priceList, setPriceList] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  
  // Input State for Price
  const [selectedMatId, setSelectedMatId] = useState<number | null>(null);
  const [inputPrice, setInputPrice] = useState<number>(0);
  const [dateRange, setDateRange] = useState<any>([dayjs(), dayjs().add(1, 'year')]);
  const [isDefault, setIsDefault] = useState(false);

  const [form] = Form.useForm();

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        setData(Array.isArray(res.data) ? res.data : []);
        // Load NPL
        const resMat = await axios.get(`${API_URL}/materials`);
        if(Array.isArray(resMat.data)) setMaterials(resMat.data.map((m:any) => ({label: `${m.code} - ${m.name} (${m.unit})`, value: m.id})));
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Main CRUD
  const handleSave = async (values: any) => {
      try {
          if(editingItem) await axios.put(`${API_URL}/suppliers/${editingItem.id}`, values);
          else await axios.post(`${API_URL}/suppliers`, values);
          message.success('Thành công'); setIsModalOpen(false); fetchData();
      } catch(e) { message.error('Lỗi lưu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); fetchData(); } catch(e) { message.error('Lỗi xóa'); }
  };

  // 3. Price Logic (DRAWER)
  const openPriceList = async (supplier: any) => {
      setCurrentSupplier(supplier);
      setPriceDrawerOpen(true);
      // Reset Inputs
      setSelectedMatId(null); setInputPrice(0); setDateRange([dayjs(), dayjs().add(1, 'year')]); setIsDefault(false);
      loadPrices(supplier.id);
  };

  const loadPrices = async (id: number) => {
      try { const res = await axios.get(`${API_URL}/suppliers/${id}`); setPriceList(res.data.price_list || []); } catch(e) { setPriceList([]); }
  };

  const handleAddPrice = async () => {
      if(!selectedMatId || !inputPrice) return message.warning('Chọn NPL và nhập giá');
      try {
          await axios.post(`${API_URL}/suppliers/${currentSupplier.id}/material-price`, {
              material_id: selectedMatId,
              price: inputPrice,
              valid_from: dateRange?.[0], valid_to: dateRange?.[1],
              is_preferred: isDefault
          });
          message.success('Đã lưu giá');
          loadPrices(currentSupplier.id);
          // Reset nhẹ để nhập tiếp
          setSelectedMatId(null); setInputPrice(0); setIsDefault(false);
      } catch(e) { message.error('Lỗi thêm giá'); }
  };

  const handleRemovePrice = async (priceId: number) => {
      try {
          // Giả sử có API delete, nếu chưa có thì update controller
          await axios.delete(`${API_URL}/suppliers/material-price/${priceId}`).catch(() => message.info('Backend cần thêm API xóa')); 
          loadPrices(currentSupplier.id);
      } catch(e) {}
  };

  // Columns Main Table
  const columns = [
      { title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> },
      { title: 'Nhà Cung Cấp', dataIndex: 'name', render: (t:any, r:any) => <div><ShopOutlined style={{color:'#1890ff'}}/> <b>{t}</b><br/><span style={{fontSize:11, color:'#888'}}>{r.address}</span></div> },
      { title: 'Pháp Nhân', dataIndex: 'legal_name', render: (t:any) => t ? <><BankOutlined /> {t}</> : '-' },
      { title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 100, render: (t:any) => t==='MATERIAL'?<Tag color="blue">NPL</Tag>:t==='PROCESSING'?<Tag color="orange">Gia Công</Tag>:<Tag color="purple">MIX</Tag> },
      { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
      { 
          title: '', key: 'act', align: 'right' as const, width: 120,
          render: (_:any, r:any) => (
              <Space>
                  <Button icon={<DollarOutlined />} size="small" type="primary" ghost onClick={()=>openPriceList(r)}>Giá</Button>
                  <Button icon={<EditOutlined />} size="small" onClick={()=>{setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true)}} />
                  <Popconfirm title="Xóa?" onConfirm={()=>handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
              </Space>
          )
      }
  ];

  const filteredData = data.filter(d => d.name?.toLowerCase().includes(searchText.toLowerCase()) || d.code?.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div>
        <Card title="Quản Lý Nhà Cung Cấp & Đối Tác" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true)}}>Thêm NCC</Button>}>
            <div style={{marginBottom: 16, maxWidth: 400}}><Input placeholder="Tìm kiếm..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} /></div>
            <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} size="small" />
        </Card>

        {/* MODAL EDIT INFO */}
        <Modal title={editingItem ? "Cập nhật NCC" : "Thêm NCC Mới"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()} width={700}>
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'MATERIAL' }}>
                <Row gutter={16}><Col span={8}><Form.Item name="code" label="Mã" rules={[{required:true}]}><Input /></Form.Item></Col><Col span={16}><Form.Item name="name" label="Tên" rules={[{required:true}]}><Input /></Form.Item></Col></Row>
                <Row gutter={16}><Col span={12}><Form.Item name="type" label="Loại hình"><Select options={[{ label: 'Bán NPL', value: 'MATERIAL' }, { label: 'Gia công', value: 'PROCESSING' }, { label: 'Hỗn hợp', value: 'MIX' }]} /></Form.Item></Col><Col span={12}><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Col></Row>
                <Form.Item name="email" label="Email"><Input /></Form.Item><Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
                <Divider dashed />
                <div style={{background: '#fafafa', padding: 10, borderRadius: 6}}>
                    <Form.Item name="legal_name" label="Tên Pháp Nhân VAT"><Input prefix={<BankOutlined />} /></Form.Item>
                    <Row gutter={16}><Col span={12}><Form.Item name="tax_code" label="MST"><Input /></Form.Item></Col><Col span={12}><Form.Item name="vat_address" label="Đia chỉ ĐKKD"><Input /></Form.Item></Col></Row>
                </div>
                <Form.Item name="note" label="Ghi chú" style={{marginTop:10}}><Input.TextArea rows={2}/></Form.Item>
            </Form>
        </Modal>

        {/* DRAWER PRICE LIST (GIỐNG NGC) */}
        <Drawer title={`Bảng Giá: ${currentSupplier?.name}`} width={600} open={priceDrawerOpen} onClose={()=>setPriceDrawerOpen(false)}>
            <div style={{background: '#e6f7ff', padding: 15, marginBottom: 20, borderRadius: 8, border: '1px solid #91d5ff'}}>
                <div style={{fontWeight:'bold', color:'#0050b3', marginBottom:10}}><PlusOutlined/> Thêm giá mới</div>
                <Select showSearch placeholder="Chọn Nguyên Liệu..." style={{width:'100%', marginBottom:10}} options={materials} value={selectedMatId} onChange={setSelectedMatId} filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                <Row gutter={10} style={{marginBottom:10}}>
                    <Col span={12}><InputNumber style={{width:'100%'}} placeholder="Giá nhập" addonAfter="₫" value={inputPrice} onChange={(v:any)=>setInputPrice(v)} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Col>
                    <Col span={12}><RangePicker style={{width:'100%'}} value={dateRange} onChange={setDateRange} format="DD/MM/YY" /></Col>
                </Row>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <Checkbox checked={isDefault} onChange={e=>setIsDefault(e.target.checked)}>Đặt làm giá mặc định (Tính BOM)</Checkbox>
                    <Button type="primary" onClick={handleAddPrice}>Lưu Giá</Button>
                </div>
            </div>

            <Divider>Danh sách giá hiện tại</Divider>

            <List
                itemLayout="horizontal"
                dataSource={priceList}
                renderItem={(item: any) => (
                    <List.Item actions={[<a key="del" style={{color:'red'}} onClick={()=>handleRemovePrice(item.id)}>Xóa</a>]}>
                        <List.Item.Meta
                            avatar={<AppstoreOutlined style={{fontSize: 20, color: '#1890ff', marginTop: 10}} />}
                            title={
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <span>{item.material?.name} <span style={{fontWeight:'normal', color:'#888'}}>({item.material?.code})</span></span>
                                    <span style={{color: '#389e0d', fontWeight:'bold'}}>{Number(item.price).toLocaleString()} ₫</span>
                                </div>
                            }
                            description={
                                <Space size="small" style={{fontSize:12}}>
                                    <Tag>{item.material?.unit}</Tag>
                                    {item.is_preferred && <Tag color="gold" icon={<StarFilled />}>Giá chuẩn</Tag>}
                                    {item.valid_from && <Tag icon={<CalendarOutlined />}>{dayjs(item.valid_from).format('DD/MM/YY')} - {item.valid_to ? dayjs(item.valid_to).format('DD/MM/YY') : '∞'}</Tag>}
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
        </Drawer>
    </div>
  );
};

export default SuppliersPage;