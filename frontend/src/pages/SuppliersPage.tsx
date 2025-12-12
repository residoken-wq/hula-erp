import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm, Row, Col, Tabs, Typography, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, DollarOutlined, ExperimentOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const { Text } = Typography;

const SuppliersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('1');
  
  // Detail Data State
  const [priceList, setPriceList] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); // Để chọn khi thêm giá NPL

  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        setData(Array.isArray(res.data) ? res.data : []);
        // Load materials để dùng cho dropdown
        const resMat = await axios.get(`${API_URL}/materials`);
        setMaterials(Array.isArray(resMat.data) ? resMat.data : []);
    } catch(e) { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
      try {
          if (editingItem) await axios.put(`${API_URL}/suppliers/${editingItem.id}`, values);
          else await axios.post(`${API_URL}/suppliers`, values);
          message.success('Đã lưu thông tin');
          if(!editingItem) setIsModalOpen(false); // Nếu tạo mới thì đóng, sửa thì giữ để xem tab khác
          fetchData();
      } catch(e: any) { message.error(e.response?.data?.message || 'Lỗi lưu dữ liệu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); message.success('Đã xóa'); fetchData(); } 
      catch(e) { message.error('Lỗi xóa'); }
  };

  const openEdit = async (item: any) => {
      setEditingItem(item);
      form.setFieldsValue(item);
      setActiveTab('1');
      setIsModalOpen(true);
      
      // Load chi tiết Bảng giá & Gia công
      try {
          const res = await axios.get(`${API_URL}/suppliers/${item.id}`);
          setPriceList(res.data.price_list || []);
          setRoutings(res.data.routings || []);
      } catch(e) {
          setPriceList([]);
          setRoutings([]);
      }
  };

  // --- LOGIC XỬ LÝ BẢNG GIÁ NPL ---
  const handleAddPrice = async (materialId: number, price: number) => {
      if(!editingItem) return;
      try {
          await axios.post(`${API_URL}/suppliers/${editingItem.id}/material-price`, { material_id: materialId, price });
          message.success('Đã cập nhật giá');
          // Reload
          const res = await axios.get(`${API_URL}/suppliers/${editingItem.id}`);
          setPriceList(res.data.price_list || []);
      } catch(e) { message.error('Lỗi thêm giá'); }
  };

  // Columns chính
  const columns = [
      { title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> },
      { title: 'Tên Nhà Cung Cấp', dataIndex: 'name' },
      { 
          title: 'Loại', dataIndex: 'type', width: 120, align: 'center' as const,
          render: (t:any) => {
              if(t === 'MATERIAL') return <Tag color="blue">Nguyên Liệu</Tag>;
              if(t === 'PROCESSING') return <Tag color="orange">Gia Công</Tag>;
              if(t === 'MIX') return <Tag color="purple">Hỗn Hợp</Tag>;
              return t;
          } 
      },
      { title: 'SĐT', dataIndex: 'phone', width: 120 },
      { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
      { 
          title: '', key: 'action', width: 100, align: 'center' as const,
          render: (_:any, r:any) => (
              <>
                  <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} style={{marginRight:5}} />
                  <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
              </>
          ) 
      }
  ];

  const filteredData = data.filter(d => 
      d.name?.toLowerCase().includes(searchText.toLowerCase()) || 
      d.code?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card title="Quản lý Đối Tác (NCC / Gia Công)" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setActiveTab('1'); setIsModalOpen(true)}}>Thêm Mới</Button>}>
        <div style={{marginBottom: 16, maxWidth: 400}}>
            <Input placeholder="Tìm kiếm theo tên hoặc mã..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} />
        </div>
        <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} size="small" />
        
        <Modal 
            title={editingItem ? `Cập nhật: ${editingItem.name}` : "Thêm Đối Tác Mới"} 
            open={isModalOpen} 
            onCancel={()=>setIsModalOpen(false)} 
            onOk={()=>{ if(activeTab==='1') form.submit(); else setIsModalOpen(false); }}
            width={800}
            okText={activeTab==='1' ? "Lưu Thông Tin" : "Đóng"}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: '1', label: <span><UserOutlined /> Thông Tin Chung</span>,
                    children: (
                        <Form form={form} layout="vertical" onFinish={handleSave}>
                            <Row gutter={16}>
                                <Col span={12}><Form.Item name="name" label="Tên gọi (Nội bộ)" rules={[{required:true}]}><Input placeholder="VD: Anh Ba Vải" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="code" label="Mã quản lý" rules={[{required:true}]}><Input placeholder="VD: VAI-01" /></Form.Item></Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="type" label="Loại hình" rules={[{required:true}]}>
                                        <Select options={[
                                            { label: 'Chỉ bán NPL (Material)', value: 'MATERIAL' },
                                            { label: 'Chỉ gia công (Processing)', value: 'PROCESSING' },
                                            { label: 'Cả hai (Mix)', value: 'MIX' }
                                        ]} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}><Form.Item name="phone" label="Số điện thoại"><Input /></Form.Item></Col>
                            </Row>
                            <Form.Item name="email" label="Email"><Input /></Form.Item>
                            <Form.Item name="address" label="Địa chỉ kho/xưởng"><Input /></Form.Item>

                            {/* Thông tin pháp nhân - Mới */}
                            <div style={{background: '#f5f5f5', padding: '10px 15px', borderRadius: 6, marginBottom: 15}}>
                                <div style={{fontWeight: 'bold', marginBottom: 10, color: '#666'}}>Thông tin Pháp nhân (Hợp đồng/VAT)</div>
                                <Row gutter={16}>
                                    <Col span={16}><Form.Item name="legal_name" label="Tên Công Ty/Hộ KD" style={{marginBottom:10}}><Input /></Form.Item></Col>
                                    <Col span={8}><Form.Item name="tax_code" label="Mã Số Thuế" style={{marginBottom:10}}><Input /></Form.Item></Col>
                                </Row>
                                <Form.Item name="vat_address" label="Địa chỉ ĐKKD" style={{marginBottom:0}}><Input /></Form.Item>
                            </div>

                            {/* Cột Note - Mới */}
                            <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} placeholder="Ghi chú thế mạnh, công nợ, lưu ý..." /></Form.Item>
                        </Form>
                    )
                },
                {
                    key: '2', label: <span><DollarOutlined /> Bảng Giá NPL</span>,
                    disabled: !editingItem || (editingItem.type === 'PROCESSING'),
                    children: (
                        <div>
                            <div style={{marginBottom: 10, display:'flex', gap: 10, background:'#f0f5ff', padding:10, borderRadius:6}}>
                                <Select 
                                    showSearch placeholder="Chọn Nguyên Liệu..." style={{flex:1}} 
                                    optionFilterProp="label"
                                    options={materials.map(m => ({label: `${m.code} - ${m.name}`, value: m.id}))}
                                    id="add_mat_id"
                                    onChange={(v) => { /* Xử lý state tạm nếu cần */ }}
                                />
                                <Input type="number" placeholder="Giá nhập" style={{width: 150}} id="add_mat_price" suffix="đ" />
                                <Button type="primary" onClick={()=>{
                                    // Hacky way to get value from uncontrolled input for simplicity or use Form
                                    const matId = (document.getElementById('add_mat_id') as any)?.value; // Cần fix logic này chuẩn React sau
                                    // Gợi ý: Logic add price nên dùng Form hoặc State riêng. 
                                    // Ở đây hiển thị danh sách trước.
                                    message.info('Tính năng thêm giá nhanh đang cập nhật...');
                                }}>Thêm Giá</Button>
                            </div>
                            
                            <Table 
                                dataSource={priceList} 
                                rowKey="id" 
                                pagination={false}
                                size="small"
                                bordered
                                locale={{emptyText: 'Chưa có bảng giá nguyên liệu'}}
                                columns={[
                                    { title: 'Mã NPL', render: (r:any) => <b>{r.material?.code}</b> },
                                    { title: 'Tên Nguyên Liệu', render: (r:any) => r.material?.name },
                                    { title: 'ĐVT', width: 80, render: (r:any) => <Tag>{r.material?.unit}</Tag> },
                                    { title: 'Đơn giá', dataIndex: 'price', align: 'right', render: (v:any) => <span style={{color:'green', fontWeight:'bold'}}>{Number(v).toLocaleString()} ₫</span> },
                                    { title: 'Ngày cập nhật', render: (r:any) => <small>{new Date(r.updated_at).toLocaleDateString()}</small> }
                                ]} 
                            />
                        </div>
                    )
                },
                {
                    key: '3', label: <span><ExperimentOutlined /> Giá Gia Công (SP)</span>,
                    disabled: !editingItem || (editingItem.type === 'MATERIAL'),
                    children: (
                        <div>
                            <div style={{marginBottom:10, color:'#666'}}>
                                <i>Danh sách các sản phẩm/công đoạn mà đơn vị này đang nhận gia công:</i>
                            </div>
                            <Table 
                                dataSource={routings} 
                                rowKey="id" 
                                pagination={false}
                                size="small"
                                bordered
                                locale={{emptyText: 'Chưa được gán công đoạn nào'}}
                                columns={[
                                    { title: 'Sản Phẩm', render: (r:any) => <b>{r.product?.sku}</b> },
                                    { title: 'Tên SP', render: (r:any) => r.product?.name },
                                    { title: 'Công đoạn', dataIndex: 'step_name', render: (t:any)=><Tag color="orange">{t}</Tag> },
                                    { title: 'Đơn giá GC', dataIndex: 'cost', align: 'right', render: (v:any) => <span style={{color:'blue', fontWeight:'bold'}}>{Number(v).toLocaleString()} ₫</span> }
                                ]} 
                            />
                        </div>
                    )
                }
            ]} />
        </Modal>
    </Card>
  );
};
export default SuppliersPage;