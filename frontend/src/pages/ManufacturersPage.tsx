import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Space, Popconfirm, Row, Col, Divider, Tabs, Drawer, List, DatePicker, InputNumber, Switch, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, ShopOutlined, PhoneOutlined, ScissorOutlined, BankOutlined, UserOutlined, MinusCircleOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const ManufacturersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal Thêm/Sửa NCC
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Drawer Bảng Giá
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);
  const [currentManu, setCurrentManu] = useState<any>(null);
  const [priceList, setPriceList] = useState([]);
  const [materials, setMaterials] = useState<any[]>([]); // Dùng để chọn loại dịch vụ/gia công (nếu coi dịch vụ là 1 mã)
  const [dateRange, setDateRange] = useState<any>([]);
  const [inputPrice, setInputPrice] = useState(0);
  const [selMatId, setSelMatId] = useState(null);

  const [form] = Form.useForm();

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        // Lọc NGC: PROCESSING hoặc MIX
        const manufacturers = Array.isArray(res.data) 
            ? res.data.filter((s:any) => s.type === 'PROCESSING' || s.type === 'MIX') 
            : [];
        setData(manufacturers);

        // Load danh sách "Nguyên liệu/Dịch vụ" để làm bảng giá
        const resMat = await axios.get(`${API_URL}/materials`);
        if(Array.isArray(resMat.data)) setMaterials(resMat.data.map((m:any) => ({label: `${m.code} - ${m.name}`, value: m.id})));

    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Save Manufacturer
  const handleSave = async (values: any) => {
      try {
          // Gộp form data
          const payload = { ...values };
          
          if(editingItem) {
              await axios.put(`${API_URL}/suppliers/${editingItem.id}`, payload);
              message.success('Cập nhật thành công');
          } else {
              await axios.post(`${API_URL}/suppliers`, payload);
              message.success('Thêm mới thành công');
          }
          setIsModalOpen(false); 
          fetchData();
      } catch(e) { message.error('Lỗi lưu dữ liệu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); fetchData(); } catch(e) { message.error('Lỗi xóa'); }
  };

  // 3. Price List Functions
  const openPriceList = async (manu: any) => {
      setCurrentManu(manu);
      setPriceDrawerOpen(true);
      loadPrices(manu.id);
  };

  const loadPrices = async (id: number) => {
      try { const res = await axios.get(`${API_URL}/suppliers/${id}/prices`); setPriceList(res.data); } catch(e) { setPriceList([]); }
  };

  const handleAddPrice = async () => {
      if(!selMatId) return message.warning('Chọn hạng mục gia công (Material/Service)');
      try {
          await axios.post(`${API_URL}/suppliers/price`, {
              supplierId: currentManu.id,
              materialId: selMatId,
              price: inputPrice,
              isPreferred: true, // Mặc định giá mới là ưu tiên
              validFrom: dateRange && dateRange[0] ? dateRange[0].toISOString() : null,
              validTo: dateRange && dateRange[1] ? dateRange[1].toISOString() : null
          });
          message.success('Đã cập nhật giá');
          loadPrices(currentManu.id);
          setSelMatId(null); setInputPrice(0); setDateRange([]);
      } catch(e) { message.error('Lỗi thêm giá'); }
  };

  const handleRemovePrice = async (priceId: number) => {
      await axios.delete(`${API_URL}/suppliers/price/${priceId}`);
      loadPrices(currentManu.id);
  };

  // --- COLUMNS ---
  const columns = [
      { title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> },
      { 
          title: 'Đơn Vị Gia Công', dataIndex: 'name', 
          render: (t:any, r:any) => (
              <div>
                  <div><ScissorOutlined style={{color:'#fa8c16'}}/> <b>{t}</b></div>
                  {r.tax_code && <small style={{color:'#888'}}>MST: {r.tax_code}</small>}
              </div>
          ) 
      },
      { 
          title: 'Pháp Nhân VAT', dataIndex: 'legal_name', 
          render: (t:any) => t ? <span style={{fontSize:12}}><BankOutlined /> {t}</span> : '-'
      },
      { 
          title: 'Liên Hệ Chính', key: 'contact',
          render: (r:any) => {
              if (r.contacts && r.contacts.length > 0) {
                  return <div>{r.contacts[0].full_name} <br/> <small>{r.contacts[0].phone}</small></div>
              }
              return <div>{r.phone}</div>
          }
      },
      { title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 100, render: (t:any) => t==='MIX' ? <Tag color="purple">Đa năng</Tag> : <Tag color="orange">Gia công</Tag> },
      { 
          title: '', key: 'act', align: 'right' as const, width: 120,
          render: (_:any, r:any) => (
              <Space>
                  <Button icon={<DollarOutlined />} size="small" onClick={()=>openPriceList(r)} />
                  <Button icon={<EditOutlined />} size="small" onClick={()=>{setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true)}} />
                  <Popconfirm title="Xóa?" onConfirm={()=>handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
              </Space>
          )
      }
  ];

  return (
    <div>
        <Card title="Quản Lý Nhà Gia Công & Xưởng Phụ" extra={
            <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true)}}>Thêm Xưởng</Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
            </Space>
        }>
            <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />
        </Card>

        {/* MODAL THÊM/SỬA */}
        <Modal 
            title={editingItem ? `Cập Nhật: ${editingItem.name}` : "Thêm Xưởng Gia Công Mới"} 
            open={isModalOpen} 
            onCancel={()=>setIsModalOpen(false)} 
            onOk={()=>form.submit()} 
            width={700}
            style={{top: 20}}
        >
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'PROCESSING' }}>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1', label: 'Thông tin chung',
                        children: (
                            <>
                                <Row gutter={16}>
                                    <Col span={8}><Form.Item name="code" label="Mã Xưởng" rules={[{required:true}]}><Input disabled={!!editingItem} /></Form.Item></Col>
                                    <Col span={16}><Form.Item name="name" label="Tên Thường Gọi" rules={[{required:true}]}><Input /></Form.Item></Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}><Form.Item name="phone" label="SĐT Chung"><Input /></Form.Item></Col>
                                    <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
                                </Row>
                                <Form.Item name="address" label="Địa Chỉ Xưởng"><Input /></Form.Item>
                                <Form.Item name="type" label="Loại Hình">
                                    <Select>
                                        <Option value="PROCESSING">Chuyên Gia Công (Chỉ nhận khoán)</Option>
                                        <Option value="MIX">Hỗn Hợp (Vừa bán NL vừa Gia công)</Option>
                                    </Select>
                                </Form.Item>
                            </>
                        )
                    },
                    {
                        key: '2', label: 'Pháp nhân & VAT',
                        children: (
                            <>
                                <div style={{marginBottom:15, color:'#888', fontStyle:'italic'}}>Thông tin dùng để xuất hóa đơn và làm hợp đồng.</div>
                                <Form.Item name="legal_name" label="Tên Pháp Nhân (Công ty/Hộ KD)"><Input prefix={<BankOutlined />} /></Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}><Form.Item name="tax_code" label="Mã Số Thuế"><Input /></Form.Item></Col>
                                    <Col span={12}><Form.Item name="vat_address" label="Địa Chỉ ĐKKD"><Input /></Form.Item></Col>
                                </Row>
                            </>
                        )
                    },
                    {
                        key: '3', label: 'Liên hệ',
                        children: (
                            <Form.List name="contacts">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Row key={key} gutter={8} align="middle" style={{marginBottom: 8, borderBottom:'1px dashed #eee', paddingBottom:5}}>
                                                <Col span={8}><Form.Item {...restField} name={[name, 'full_name']} noStyle rules={[{required:true}]}><Input placeholder="Họ Tên" prefix={<UserOutlined />} /></Form.Item></Col>
                                                <Col span={6}><Form.Item {...restField} name={[name, 'job_title']} noStyle><Input placeholder="Chức vụ" /></Form.Item></Col>
                                                <Col span={8}><Form.Item {...restField} name={[name, 'phone']} noStyle><Input placeholder="SĐT/Zalo" /></Form.Item></Col>
                                                <Col span={2}><MinusCircleOutlined onClick={() => remove(name)} style={{color:'red'}} /></Col>
                                            </Row>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{marginTop:10}}>Thêm người liên hệ</Button>
                                    </>
                                )}
                            </Form.List>
                        )
                    }
                ]} />
            </Form>
        </Modal>

        {/* DRAWER BẢNG GIÁ */}
        <Drawer title={`Bảng Giá: ${currentManu?.name}`} width={600} open={priceDrawerOpen} onClose={()=>setPriceDrawerOpen(false)}>
            <div style={{background: '#f6ffed', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #b7eb8f'}}>
                <Text strong>Thêm đơn giá mới</Text>
                <div style={{marginTop:10}}>
                    <Select 
                        showSearch placeholder="Chọn hạng mục (VD: Công cắt, may...)" 
                        style={{width:'100%', marginBottom:8}} 
                        options={materials} 
                        value={selMatId} onChange={setSelMatId} 
                        filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                    <Row gutter={8}>
                        <Col span={12}><InputNumber style={{width:'100%'}} placeholder="Đơn giá" value={inputPrice} onChange={(v:any)=>setInputPrice(v)} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" /></Col>
                        <Col span={12}><RangePicker style={{width:'100%'}} value={dateRange} onChange={setDateRange} /></Col>
                    </Row>
                    <Button type="primary" block icon={<PlusOutlined />} style={{marginTop:10}} onClick={handleAddPrice}>Lưu Giá</Button>
                </div>
            </div>

            <List
                header={<div><b>Lịch sử giá đã lưu</b></div>}
                bordered
                dataSource={priceList}
                renderItem={(item: any) => (
                    <List.Item actions={[<Popconfirm title="Xóa?" onConfirm={()=>handleRemovePrice(item.id)}><a style={{color:'red'}}>Xóa</a></Popconfirm>]}>
                        <List.Item.Meta
                            title={<span>{item.material?.code} - {item.material?.name}</span>}
                            description={
                                <div>
                                    {item.valid_from && <Tag color="blue">{dayjs(item.valid_from).format('DD/MM/YYYY')} - {item.valid_to ? dayjs(item.valid_to).format('DD/MM/YYYY') : 'Nay'}</Tag>}
                                    {item.is_preferred && <Tag color="green">Hiện tại</Tag>}
                                </div>
                            }
                        />
                        <div style={{fontWeight:'bold', color:'#1890ff'}}>{Number(item.price).toLocaleString()} ₫</div>
                    </List.Item>
                )}
            />
        </Drawer>
    </div>
  );
};

export default ManufacturersPage;