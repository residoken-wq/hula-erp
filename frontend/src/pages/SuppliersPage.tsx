import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Drawer, List, Tag, Switch, Typography, Row, Col, Tabs, DatePicker, Divider } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, UserOutlined, MinusCircleOutlined, BankOutlined, AppstoreOutlined, WarningOutlined, CalendarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

import { API_URL } from '../config'; 
const API = API_URL;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal NCC
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Drawer Price List
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);
  const [priceList, setPriceList] = useState([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  
  // Form input gia
  const [selMatId, setSelMatId] = useState(null);
  const [inputPrice, setInputPrice] = useState(0);
  const [isPreferred, setIsPreferred] = useState(true);
  const [dateRange, setDateRange] = useState<any>([]);

  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    setLoading(true);
    try { 
        const res = await axios.get(`${API}/suppliers`); 
        // Lọc chỉ lấy NCC NPL (MATERIAL) hoặc MIX, không lấy ông chỉ làm Gia công (PROCESSING)
        const data = Array.isArray(res.data) 
            ? res.data.filter((s:any) => s.type !== 'PROCESSING') 
            : [];
        setSuppliers(data); 
        
        try {
            const resMat = await axios.get(`${API}/materials`);
            if(Array.isArray(resMat.data)) setMaterials(resMat.data.map((m:any) => ({label: `${m.code} - ${m.name}`, value: m.id})));
        } catch(e) {}
    } catch (e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSave = async (values: any) => {
    try {
      const payload = { ...values, type: values.type || 'MATERIAL' };
      if (editingItem) await axios.put(`${API}/suppliers/${editingItem.id}`, payload);
      else await axios.post(`${API}/suppliers`, payload);
      message.success('Lưu thành công'); setIsModalOpen(false); fetchSuppliers();
    } catch (e) { message.error('Lỗi'); }
  };

  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API}/suppliers/${id}`); fetchSuppliers(); } catch (e) { message.error('Lỗi xóa'); }
  };

  // --- PRICE LIST ---
  const openPriceList = async (supplier: any) => {
      setCurrentSupplier(supplier);
      setPriceDrawerOpen(true);
      setDateRange([]);
      loadPrices(supplier.id);
  };

  const loadPrices = async (supplierId: number) => {
      try { const res = await axios.get(`${API}/suppliers/${supplierId}/prices`); setPriceList(res.data); } catch(e) { setPriceList([]); }
  };

  const addPrice = async () => {
      if(!selMatId) return message.warning('Chọn nguyên liệu');
      try {
          await axios.post(`${API}/suppliers/price`, {
              supplierId: currentSupplier.id,
              itemId: selMatId,
              itemType: 'MATERIAL', // Mặc định là Material cho trang này
              price: inputPrice,
              isPreferred: isPreferred,
              validFrom: dateRange && dateRange[0] ? dateRange[0].toISOString() : null,
              validTo: dateRange && dateRange[1] ? dateRange[1].toISOString() : null
          });
          message.success('Đã thêm giá');
          loadPrices(currentSupplier.id);
          setSelMatId(null); setInputPrice(0); setDateRange([]);
      } catch(e) { message.error('Lỗi thêm giá'); }
  };

  const removePrice = async (id: number) => {
      await axios.delete(`${API}/suppliers/price/${id}`);
      loadPrices(currentSupplier.id);
  };

  const columns = [
    { title: 'Mã NCC', dataIndex: 'code', render: (t:any) => <b>{t}</b> },
    { 
        title: 'Nhà Cung Cấp', key: 'name', 
        render: (r:any) => (
            <div>
                <div style={{fontWeight:'bold', color: '#1890ff'}}>{r.name}</div>
                {r.tax_code && <div style={{fontSize:12, color:'#888'}}>MST: {r.tax_code}</div>}
            </div>
        )
    },
    { 
        title: 'Liên hệ', key: 'contact',
        render: (r:any) => {
            if(r.contacts && r.contacts.length > 0) {
                const c = r.contacts[0]; 
                return <div><UserOutlined /> {c.full_name} <br/><small>{c.phone_number}</small></div>
            }
            return <small style={{color:'#ccc'}}>Chưa có LH</small>
        }
    },
    { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true },
    { 
      title: '', key: 'action', align: 'right' as const,
      render: (_: any, r: any) => (
        <Space>
          <Button icon={<DollarOutlined />} onClick={() => openPriceList(r)}>Bảng Giá</Button>
          <Button icon={<EditOutlined />} onClick={() => { setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true); }} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} danger /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="Quản Lý Nhà Cung Cấp (NPL)" extra={
        <Space>
           <Button icon={<PlusOutlined />} type="primary" onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }}>Thêm NCC</Button>
           <Button icon={<ReloadOutlined />} onClick={fetchSuppliers}>Tải lại</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={suppliers} rowKey="id" loading={loading} />
      </Card>

      {/* MODAL THEM/SUA NCC */}
      <Modal title={editingItem ? "Sửa NCC" : "Thêm NCC"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} width={700}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Tabs defaultActiveKey="1" items={[
              {
                  key: '1', label: 'Thông tin chung',
                  children: (
                      <>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="code" label="Mã NCC" rules={[{ required: true }]}><Input /></Form.Item></Col>
                            <Col span={16}><Form.Item name="name" label="Tên Thường Gọi" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        </Row>
                        <Form.Item name="address" label="Địa chỉ Kho/Giao dịch"><Input /></Form.Item>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="phone" label="SĐT Công Ty"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="email" label="Email Công Ty"><Input /></Form.Item></Col>
                        </Row>
                        <Form.Item name="type" label="Loại Hình">
                            <Select>
                                <Option value="MATERIAL">Cung cấp Nguyên Liệu</Option>
                                <Option value="MIX">Hỗn Hợp (Vừa bán NPL vừa Gia công)</Option>
                            </Select>
                        </Form.Item>
                        
                        <Divider orientation="left"><UserOutlined /> Người Liên Hệ</Divider>
                        <Form.List name="contacts">
                            {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                <Row key={key} gutter={8} align="middle" style={{marginBottom: 8}}>
                                    <Col span={8}><Form.Item {...restField} name={[name, 'full_name']} noStyle><Input placeholder="Họ Tên" /></Form.Item></Col>
                                    <Col span={6}><Form.Item {...restField} name={[name, 'job_title']} noStyle><Input placeholder="Chức danh" /></Form.Item></Col>
                                    <Col span={8}><Form.Item {...restField} name={[name, 'phone_number']} noStyle><Input placeholder="Di động" /></Form.Item></Col>
                                    <Col span={2}><MinusCircleOutlined onClick={() => remove(name)} style={{color:'red'}} /></Col>
                                </Row>
                                ))}
                                <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm người liên hệ</Button></Form.Item>
                            </>
                            )}
                        </Form.List>
                      </>
                  )
              },
              {
                  key: '2', label: 'Pháp nhân & VAT',
                  children: (
                      <>
                        <Form.Item name="legal_name" label="Tên Pháp Nhân (Trên Hóa Đơn)"><Input placeholder="Công ty Cổ phần..." prefix={<BankOutlined />} /></Form.Item>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="tax_code" label="Mã Số Thuế"><Input /></Form.Item></Col>
                        </Row>
                        <Form.Item name="vat_address" label="Địa chỉ ĐKKD (Trên Hóa Đơn)"><Input /></Form.Item>
                      </>
                  )
              }
          ]} />
        </Form>
      </Modal>

      {/* DRAWER PRICE LIST */}
      <Drawer title={`Bảng Giá: ${currentSupplier?.name}`} width={600} onClose={() => setPriceDrawerOpen(false)} open={priceDrawerOpen}>
          <div style={{background: '#f6ffed', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #b7eb8f'}}>
              <Typography.Title level={5} style={{marginTop:0}}>Thiết lập giá mới</Typography.Title>
              <Space direction="vertical" style={{width: '100%'}}>
                  <Select showSearch placeholder="Chọn Nguyên Liệu..." style={{width: '100%'}} options={materials} value={selMatId} onChange={setSelMatId} filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                  
                  {/* --- FIX: ADD DATE RANGE --- */}
                  <div style={{marginBottom: 5}}><span style={{fontSize:12, color:'#666'}}>Thời hạn áp dụng (Tùy chọn):</span> <RangePicker style={{width:'100%'}} value={dateRange} onChange={setDateRange} /></div>

                  <Row gutter={8}>
                      <Col span={12}><InputNumber placeholder="Giá nhập" style={{width: '100%'}} value={inputPrice} onChange={(v:any) => setInputPrice(v)} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" /></Col>
                      <Col span={12} style={{display:'flex', alignItems:'center'}}><Switch checked={isPreferred} onChange={setIsPreferred} /> &nbsp; Giá Chuẩn</Col>
                  </Row>

                  <Button type="primary" block onClick={addPrice} icon={<PlusOutlined />} style={{marginTop: 10}}>Lưu Giá</Button>
              </Space>
          </div>

          <List
            header={<div>Lịch sử báo giá</div>}
            bordered
            dataSource={priceList.filter((p:any) => p.material_id)} // Chỉ hiện giá NPL
            renderItem={(item: any) => (
              <List.Item actions={[ <Popconfirm title="Xóa giá này?" onConfirm={() => removePrice(item.id)}><a style={{color:'red'}}>Xóa</a></Popconfirm> ]}>
                <List.Item.Meta
                  title={
                      // --- FIX: SAFE RENDER (Hiển thị an toàn khi data null) ---
                      item.material 
                      ? <span><AppstoreOutlined /> <b>{item.material.code}</b> - {item.material.name} {item.is_preferred && <Tag color="green" style={{marginLeft: 10}}>Giá Chuẩn</Tag>}</span>
                      : <span style={{color:'red'}}><WarningOutlined /> Dữ liệu lỗi (ID: {item.material_id})</span>
                  }
                  description={
                      <div>
                          {item.valid_from ? 
                            <Tag icon={<CalendarOutlined />} color="orange">
                                {dayjs(item.valid_from).format('DD/MM/YYYY')} - {item.valid_to ? dayjs(item.valid_to).format('DD/MM/YYYY') : '∞'}
                            </Tag> 
                            : <span style={{fontSize:12, color:'#999'}}>Không thời hạn</span>
                          }
                      </div>
                  }
                />
                <div style={{fontWeight: 'bold', fontSize: 16, color: '#1890ff'}}>{Number(item.price).toLocaleString()} ₫</div>
              </List.Item>
            )}
          />
      </Drawer>
    </div>
  );
};
export default SuppliersPage;