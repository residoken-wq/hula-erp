import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const SuppliersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        setData(Array.isArray(res.data) ? res.data : []);
    } catch(e) { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
      try {
          if (editingItem) await axios.put(`${API_URL}/suppliers/${editingItem.id}`, values);
          else await axios.post(`${API_URL}/suppliers`, values);
          message.success('Thành công');
          setIsModalOpen(false); fetchData();
      } catch(e: any) { message.error(e.response?.data?.message || 'Lỗi lưu dữ liệu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); message.success('Đã xóa'); fetchData(); } 
      catch(e) { message.error('Lỗi xóa'); }
  };

  const openEdit = (item: any) => {
      setEditingItem(item);
      form.setFieldsValue(item);
      setIsModalOpen(true);
  };

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
    <Card title="Quản lý Đối Tác (NCC / Gia Công)" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true)}}>Thêm Mới</Button>}>
        <div style={{marginBottom: 16, maxWidth: 400}}>
            <Input placeholder="Tìm kiếm theo tên hoặc mã..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} />
        </div>
        <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} size="small" />
        
        <Modal title={editingItem ? "Cập nhật Thông tin" : "Thêm Đối Tác Mới"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()} width={700}>
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

                {/* Thông tin pháp nhân */}
                <div style={{background: '#f5f5f5', padding: '10px 15px', borderRadius: 6, marginBottom: 15}}>
                    <div style={{fontWeight: 'bold', marginBottom: 10, color: '#666'}}>Thông tin Pháp nhân (Hợp đồng/VAT)</div>
                    <Row gutter={16}>
                        <Col span={16}><Form.Item name="legal_name" label="Tên Công Ty/Hộ KD" style={{marginBottom:10}}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="tax_code" label="Mã Số Thuế" style={{marginBottom:10}}><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item name="vat_address" label="Địa chỉ ĐKKD" style={{marginBottom:0}}><Input /></Form.Item>
                </div>

                {/* Cột Note mới */}
                <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} placeholder="Ghi chú thế mạnh, công nợ, lưu ý..." /></Form.Item>
            </Form>
        </Modal>
    </Card>
  );
};
export default SuppliersPage;