import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm, Row, Col, Tabs, Typography, InputNumber, DatePicker, Checkbox, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, DollarOutlined, ExperimentOutlined, UserOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { RangePicker } = DatePicker; // Import RangePicker

const SuppliersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('1');
  
  const [priceList, setPriceList] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  
  // State Input
  const [selectedMatId, setSelectedMatId] = useState<number | null>(null);
  const [inputPrice, setInputPrice] = useState<number>(0);
  
  // --- MỚI: State cho khoảng thời gian ---
  const [validRange, setValidRange] = useState<any>([dayjs(), dayjs().add(1, 'year')]); // Mặc định 1 năm
  const [isDefault, setIsDefault] = useState(false);

  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        setData(Array.isArray(res.data) ? res.data : []);
        const resMat = await axios.get(`${API_URL}/materials`);
        setMaterials(Array.isArray(resMat.data) ? resMat.data : []);
    } catch(e) { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const refreshDetail = async (id: number) => {
      try {
          const res = await axios.get(`${API_URL}/suppliers/${id}`);
          setPriceList(res.data.price_list || []);
          setRoutings(res.data.routings || []);
      } catch(e) {}
  };

  const handleSave = async (values: any) => {
      try {
          if (editingItem) await axios.put(`${API_URL}/suppliers/${editingItem.id}`, values);
          else await axios.post(`${API_URL}/suppliers`, values);
          message.success('Đã lưu thông tin');
          if(!editingItem) setIsModalOpen(false); 
          else refreshDetail(editingItem.id);
          fetchData();
      } catch(e: any) { message.error('Lỗi lưu dữ liệu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); message.success('Đã xóa'); fetchData(); } 
      catch(e) { message.error('Lỗi xóa'); }
  };

  const openEdit = (item: any) => {
      setEditingItem(item);
      form.setFieldsValue(item);
      setActiveTab('1');
      
      setSelectedMatId(null); 
      setInputPrice(0);
      setValidRange([dayjs(), dayjs().add(1, 'year')]); // Reset date
      setIsDefault(false);
      
      setIsModalOpen(true);
      refreshDetail(item.id);
  };

  const handleAddPrice = async () => {
      if(!editingItem) return;
      if(!selectedMatId || !inputPrice) return message.warning('Vui lòng chọn NPL và nhập giá');

      try {
          await axios.post(`${API_URL}/suppliers/${editingItem.id}/material-price`, { 
              material_id: selectedMatId, 
              price: inputPrice,
              // Gửi cả From và To
              valid_from: validRange ? validRange[0] : null, 
              valid_to: validRange ? validRange[1] : null,
              is_preferred: isDefault
          });
          message.success(isDefault ? 'Đã lưu và cập nhật giá tính BOM' : 'Đã thêm giá');
          
          setSelectedMatId(null);
          setInputPrice(0);
          setIsDefault(false);
          refreshDetail(editingItem.id);
      } catch(e) { message.error('Lỗi thêm giá'); }
  };

  const filteredData = data.filter(d => d.name?.toLowerCase().includes(searchText.toLowerCase()) || d.code?.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <Card title="Quản lý Đối Tác (NCC / Gia Công)" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setActiveTab('1'); setIsModalOpen(true)}}>Thêm Mới</Button>}>
        <div style={{marginBottom: 16, maxWidth: 400}}><Input placeholder="Tìm kiếm..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} /></div>
        <Table dataSource={filteredData} columns={[{ title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> }, { title: 'Tên Nhà Cung Cấp', dataIndex: 'name' }, { title: 'Loại', dataIndex: 'type', width: 120, align: 'center', render: (t:any) => t==='MATERIAL'?<Tag color="blue">NPL</Tag>:t==='PROCESSING'?<Tag color="orange">Gia Công</Tag>:<Tag color="purple">MIX</Tag> }, { title: 'SĐT', dataIndex: 'phone', width: 120 }, { title: 'Ghi chú', dataIndex: 'note', ellipsis: true }, { title: '', key: 'action', width: 100, align: 'center', render: (_:any, r:any) => (<><Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} style={{marginRight:5}} /><Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm></>) }]} rowKey="id" loading={loading} size="small" />
        
        <Modal title={editingItem ? `Cập nhật: ${editingItem.name}` : "Thêm Đối Tác Mới"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>{ if(activeTab==='1') form.submit(); else setIsModalOpen(false); }} width={950} okText={activeTab==='1' ? "Lưu Thông Tin" : "Đóng"}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: '1', label: <span><UserOutlined /> Thông Tin Chung</span>,
                    children: (
                        <Form form={form} layout="vertical" onFinish={handleSave}>
                            <Row gutter={16}><Col span={12}><Form.Item name="name" label="Tên gọi" rules={[{required:true}]}><Input/></Form.Item></Col><Col span={12}><Form.Item name="code" label="Mã quản lý" rules={[{required:true}]}><Input/></Form.Item></Col></Row>
                            <Row gutter={16}><Col span={12}><Form.Item name="type" label="Loại hình" rules={[{required:true}]}><Select options={[{ label: 'Chỉ bán NPL', value: 'MATERIAL' }, { label: 'Chỉ gia công', value: 'PROCESSING' }, { label: 'Cả hai (Mix)', value: 'MIX' }]} /></Form.Item></Col><Col span={12}><Form.Item name="phone" label="SĐT"><Input/></Form.Item></Col></Row>
                            <Form.Item name="email" label="Email"><Input/></Form.Item><Form.Item name="address" label="Địa chỉ"><Input/></Form.Item>
                            <div style={{background: '#f5f5f5', padding: '10px', borderRadius: 6, marginBottom: 15}}><div style={{fontWeight: 'bold', marginBottom: 10}}>Pháp nhân (Hợp đồng/VAT)</div><Row gutter={16}><Col span={16}><Form.Item name="legal_name" label="Tên Công Ty" style={{marginBottom:10}}><Input/></Form.Item></Col><Col span={8}><Form.Item name="tax_code" label="MST" style={{marginBottom:10}}><Input/></Form.Item></Col></Row><Form.Item name="vat_address" label="Địa chỉ ĐKKD" style={{marginBottom:0}}><Input/></Form.Item></div>
                            <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2}/></Form.Item>
                        </Form>
                    )
                },
                {
                    key: '2', label: <span><DollarOutlined /> Bảng Giá NPL</span>,
                    disabled: !editingItem || (editingItem.type === 'PROCESSING'),
                    children: (
                        <div>
                            <div style={{marginBottom: 10, display:'flex', gap: 10, background:'#f0f5ff', padding:10, borderRadius:6, alignItems:'flex-end'}}>
                                <div style={{flex:1.5}}>
                                    <div style={{fontSize:12, marginBottom:4, color:'#666'}}>Nguyên liệu:</div>
                                    <Select showSearch placeholder="Chọn Nguyên Liệu..." style={{width:'100%'}} optionFilterProp="label" 
                                        options={materials.map(m => ({label: `${m.code} - ${m.name} (${m.unit})`, value: m.id}))} 
                                        value={selectedMatId} onChange={(v) => setSelectedMatId(v)} 
                                    />
                                </div>
                                <div style={{width: 140}}>
                                    <div style={{fontSize:12, marginBottom:4, color:'#666'}}>Giá nhập:</div>
                                    <InputNumber style={{width: '100%'}} addonAfter="₫" value={inputPrice} onChange={(v) => setInputPrice(Number(v))} />
                                </div>
                                <div style={{width: 220}}>
                                    <div style={{fontSize:12, marginBottom:4, color:'#666'}}>Hiệu lực (Từ - Đến):</div>
                                    {/* MỚI: RangePicker */}
                                    <RangePicker style={{width:'100%'}} value={validRange} onChange={(d) => setValidRange(d)} format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} />
                                </div>
                                <div style={{marginBottom: 5}}>
                                    <Checkbox checked={isDefault} onChange={e=>setIsDefault(e.target.checked)}>Giá chuẩn</Checkbox>
                                </div>
                                <Button type="primary" onClick={handleAddPrice} icon={<PlusOutlined />}>Thêm</Button>
                            </div>
                            
                            <Table dataSource={priceList} rowKey="id" pagination={false} size="small" bordered locale={{emptyText: 'Chưa có bảng giá'}}
                                columns={[
                                    { title: 'Default', width: 60, align: 'center', render: (r:any) => r.is_preferred ? <Tooltip title="Giá mặc định tính BOM"><StarFilled style={{color:'#faad14', fontSize:16}} /></Tooltip> : <StarOutlined style={{color:'#ccc'}} /> },
                                    { title: 'Mã NPL', render: (r:any) => <b>{r.material?.code}</b> },
                                    { title: 'Tên Nguyên Liệu', render: (r:any) => r.material?.name },
                                    { title: 'ĐVT', width: 70, align:'center', render: (r:any) => <Tag>{r.material?.unit || '-'}</Tag> },
                                    { title: 'Đơn giá', dataIndex: 'price', align: 'right', render: (v:any) => <span style={{color:'green', fontWeight:'bold'}}>{Number(v).toLocaleString()} ₫</span> },
                                    // Hiển thị Range ngày
                                    { title: 'Hiệu lực', width: 150, align:'center', render: (r:any) => <small style={{color:'#666'}}>{r.valid_from ? dayjs(r.valid_from).format('DD/MM/YY') : '...'} - {r.valid_to ? dayjs(r.valid_to).format('DD/MM/YY') : '...'}</small> },
                                    { title: 'Cập nhật', width: 80, align:'center', render: (r:any) => <small style={{color:'#999'}}>{dayjs(r.updated_at).format('DD/MM')}</small> }
                                ]} 
                            />
                        </div>
                    )
                },
                {
                    key: '3', label: <span><ExperimentOutlined /> Giá Gia Công</span>,
                    disabled: !editingItem || (editingItem.type === 'MATERIAL'),
                    children: (
                        <Table dataSource={routings} rowKey="id" pagination={false} size="small" bordered locale={{emptyText: 'Chưa được gán công đoạn nào'}}
                            columns={[
                                { title: 'Sản Phẩm', render: (r:any) => <b>{r.product?.sku}</b> },
                                { title: 'Tên SP', render: (r:any) => r.product?.name },
                                { title: 'Công đoạn', dataIndex: 'step_name', render: (t:any)=><Tag color="orange">{t}</Tag> },
                                { title: 'Giá GC', dataIndex: 'cost', align: 'right', render: (v:any) => <span style={{color:'blue', fontWeight:'bold'}}>{Number(v).toLocaleString()} ₫</span> }
                            ]} 
                        />
                    )
                }
            ]} />
        </Modal>
    </Card>
  );
};
export default SuppliersPage;