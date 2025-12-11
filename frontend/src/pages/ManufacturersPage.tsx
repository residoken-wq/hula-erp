import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Space, Popconfirm, Row, Col, Divider, Tabs, Drawer, List, DatePicker, InputNumber, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, ScissorOutlined, BankOutlined, DollarOutlined, ExperimentOutlined, AppstoreOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const ManufacturersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);
  const [currentManu, setCurrentManu] = useState<any>(null);
  
  // Data for Pricing
  const [priceList, setPriceList] = useState([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  const [processes, setProcesses] = useState<any[]>([]); // Danh mục công đoạn
  
  // Form Pricing
  const [activePriceTab, setActivePriceTab] = useState('PROCESS'); // PROCESS or MATERIAL
  const [selItemId, setSelItemId] = useState(null);
  const [inputPrice, setInputPrice] = useState(0);
  const [dateRange, setDateRange] = useState<any>([]);

  const [form] = Form.useForm();

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        const manufacturers = Array.isArray(res.data) 
            ? res.data.filter((s:any) => s.type === 'PROCESSING' || s.type === 'MIX') 
            : [];
        setData(manufacturers);

        // Load NPL
        const resMat = await axios.get(`${API_URL}/materials`);
        if(Array.isArray(resMat.data)) setMaterials(resMat.data.map((m:any) => ({label: `${m.code} - ${m.name}`, value: m.id})));

        // Load Processes (Công đoạn)
        try {
            const resProc = await axios.get(`${API_URL}/processes`);
            // Nếu chưa có data, gọi seed
            if (!resProc.data || resProc.data.length === 0) {
                await axios.post(`${API_URL}/processes/seed`);
                const resProc2 = await axios.get(`${API_URL}/processes`);
                setProcesses(resProc2.data.map((p:any) => ({label: `${p.name} (${p.unit})`, value: p.id})));
            } else {
                setProcesses(resProc.data.map((p:any) => ({label: `${p.name} (${p.unit})`, value: p.id})));
            }
        } catch(e) {}

    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Save Manufacturer
  const handleSave = async (values: any) => {
      try {
          const payload = { ...values };
          if(editingItem) await axios.put(`${API_URL}/suppliers/${editingItem.id}`, payload);
          else await axios.post(`${API_URL}/suppliers`, payload);
          message.success('Thành công'); setIsModalOpen(false); fetchData();
      } catch(e) { message.error('Lỗi lưu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); fetchData(); } catch(e) { message.error('Lỗi xóa'); }
  };

  // 3. Price List Logic
  const openPriceList = async (manu: any) => {
      setCurrentManu(manu);
      // Mặc định tab: Nếu là MIX thì hiện PROCESS trước, PROCESSING thì chắc chắn là PROCESS
      setActivePriceTab('PROCESS');
      setPriceDrawerOpen(true);
      loadPrices(manu.id);
  };

  const loadPrices = async (id: number) => {
      try { const res = await axios.get(`${API_URL}/suppliers/${id}/prices`); setPriceList(res.data); } catch(e) { setPriceList([]); }
  };

  const handleAddPrice = async () => {
      if(!selItemId) return message.warning('Chọn mục');
      try {
          await axios.post(`${API_URL}/suppliers/price`, {
              supplierId: currentManu.id,
              itemId: selItemId,
              itemType: activePriceTab, // MATERIAL hoặc PROCESS
              price: inputPrice,
              isPreferred: true,
              validFrom: dateRange && dateRange[0] ? dateRange[0].toISOString() : null,
              validTo: dateRange && dateRange[1] ? dateRange[1].toISOString() : null
          });
          message.success('Đã lưu giá');
          loadPrices(currentManu.id);
          setSelItemId(null); setInputPrice(0); setDateRange([]);
      } catch(e) { message.error('Lỗi thêm giá'); }
  };

  const handleRemovePrice = async (priceId: number) => {
      await axios.delete(`${API_URL}/suppliers/price/${priceId}`);
      loadPrices(currentManu.id);
  };

  // Helper render price table
  const renderPriceTable = (type: string) => {
      const data = priceList.filter((p:any) => type === 'MATERIAL' ? p.material_id : p.process_id);
      return (
          <List
            bordered
            dataSource={data}
            renderItem={(item: any) => (
              <List.Item actions={[<Popconfirm title="Xóa?" onConfirm={()=>handleRemovePrice(item.id)}><a style={{color:'red'}}>Xóa</a></Popconfirm>]}>
                <List.Item.Meta
                  title={
                      type === 'MATERIAL' 
                        ? <span><AppstoreOutlined /> {item.material?.name} ({item.material?.code})</span> 
                        : <span><ExperimentOutlined /> {item.process?.name} ({item.process?.unit})</span>
                  }
                  description={item.valid_from ? <Tag color="blue">{dayjs(item.valid_from).format('DD/MM')} - {item.valid_to ? dayjs(item.valid_to).format('DD/MM') : '...'}</Tag> : <span style={{fontSize:12,color:'#ccc'}}>Không thời hạn</span>}
                />
                <div style={{fontWeight: 'bold', color: '#1890ff'}}>{Number(item.price).toLocaleString()} ₫</div>
              </List.Item>
            )}
          />
      );
  };

  const columns = [
      { title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> },
      { title: 'Đơn Vị', dataIndex: 'name', render: (t:any, r:any) => <div><ScissorOutlined style={{color:'#fa8c16'}}/> <b>{t}</b><br/><small>{r.address}</small></div> },
      { title: 'Pháp Nhân', dataIndex: 'legal_name', render: (t:any) => t ? <span style={{fontSize:12}}><BankOutlined /> {t}</span> : '-' },
      { title: 'Loại hình', dataIndex: 'type', align: 'center' as const, width: 100, render: (t:any) => t==='MIX' ? <Tag color="purple">Đa năng</Tag> : <Tag color="orange">Gia công</Tag> },
      { 
          title: '', key: 'act', align: 'right' as const, width: 120,
          render: (_:any, r:any) => (
              <Space>
                  <Button icon={<DollarOutlined />} size="small" onClick={()=>openPriceList(r)} type="primary" ghost>Giá</Button>
                  <Button icon={<EditOutlined />} size="small" onClick={()=>{setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true)}} />
                  <Popconfirm title="Xóa?" onConfirm={()=>handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
              </Space>
          )
      }
  ];

  return (
    <div>
        <Card title="Quản Lý Nhà Gia Công & Xưởng Phụ" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true)}}>Thêm Xưởng</Button>}>
            <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />
        </Card>

        {/* MODAL EDIT */}
        <Modal title={editingItem ? "Sửa" : "Thêm"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()} width={700}>
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'PROCESSING' }}>
                <Row gutter={16}><Col span={8}><Form.Item name="code" label="Mã" rules={[{required:true}]}><Input /></Form.Item></Col><Col span={16}><Form.Item name="name" label="Tên" rules={[{required:true}]}><Input /></Form.Item></Col></Row>
                <Form.Item name="type" label="Loại Hình"><Select><Option value="PROCESSING">Chuyên Gia Công</Option><Option value="MIX">Hỗn Hợp (Vừa bán NPL)</Option></Select></Form.Item>
                <Divider />
                <Form.Item name="legal_name" label="Tên Pháp Nhân VAT"><Input prefix={<BankOutlined />} /></Form.Item>
                <Row gutter={16}><Col span={12}><Form.Item name="tax_code" label="MST"><Input /></Form.Item></Col><Col span={12}><Form.Item name="address" label="Địa Chỉ"><Input /></Form.Item></Col></Row>
            </Form>
        </Modal>

        {/* DRAWER PRICE LIST */}
        <Drawer title={`Bảng Giá: ${currentManu?.name}`} width={600} open={priceDrawerOpen} onClose={()=>setPriceDrawerOpen(false)}>
            {/* Nếu là MIX thì hiện Tabs, nếu không chỉ hiện Process */}
            <Tabs activeKey={activePriceTab} onChange={setActivePriceTab} items={[
                { 
                    key: 'PROCESS', label: 'Giá Gia Công', icon: <ExperimentOutlined />,
                    children: (
                        <div>
                            <div style={{background: '#f6ffed', padding: 10, marginBottom: 15, borderRadius: 6}}>
                                <Select showSearch placeholder="Chọn công đoạn..." style={{width:'100%', marginBottom:8}} options={processes} value={selItemId} onChange={setSelItemId} />
                                <Row gutter={8}><Col span={12}><InputNumber style={{width:'100%'}} placeholder="Giá" value={inputPrice} onChange={(v:any)=>setInputPrice(v)} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Col><Col span={12}><Button type="primary" block onClick={handleAddPrice}>Lưu</Button></Col></Row>
                            </div>
                            {renderPriceTable('PROCESS')}
                        </div>
                    )
                },
                ...(currentManu?.type === 'MIX' ? [{
                    key: 'MATERIAL', label: 'Giá Nguyên Liệu', icon: <AppstoreOutlined />,
                    children: (
                        <div>
                            <div style={{background: '#e6f7ff', padding: 10, marginBottom: 15, borderRadius: 6}}>
                                <Select showSearch placeholder="Chọn NPL..." style={{width:'100%', marginBottom:8}} options={materials} value={selItemId} onChange={setSelItemId} />
                                <Row gutter={8}><Col span={12}><InputNumber style={{width:'100%'}} placeholder="Giá" value={inputPrice} onChange={(v:any)=>setInputPrice(v)} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Col><Col span={12}><Button type="primary" block onClick={handleAddPrice}>Lưu</Button></Col></Row>
                            </div>
                            {renderPriceTable('MATERIAL')}
                        </div>
                    )
                }] : [])
            ]} />
        </Drawer>
    </div>
  );
};

export default ManufacturersPage;