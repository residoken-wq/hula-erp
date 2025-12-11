import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Space, Popconfirm, Row, Col, Divider } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, ShopOutlined, PhoneOutlined, ScissorOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const { Option } = Select;

const ManufacturersPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/suppliers`);
        // Chỉ lọc lấy Nhà gia công (PROCESSING) hoặc Hỗn hợp (MIX)
        const manufacturers = Array.isArray(res.data) 
            ? res.data.filter((s:any) => s.type === 'PROCESSING' || s.type === 'MIX') 
            : [];
        setData(manufacturers);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
      try {
          const payload = { ...values, type: values.type || 'PROCESSING' };
          if(editingItem) await axios.put(`${API_URL}/suppliers/${editingItem.id}`, payload);
          else await axios.post(`${API_URL}/suppliers`, payload);
          message.success('Lưu thành công'); setIsModalOpen(false); fetchData();
      } catch(e) { message.error('Lỗi lưu dữ liệu'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); fetchData(); } catch(e) { message.error('Lỗi xóa'); }
  };

  const columns = [
      { title: 'Mã', dataIndex: 'code', width: 100, render: (t:any) => <b>{t}</b> },
      { title: 'Đơn Vị Gia Công', dataIndex: 'name', render: (t:any) => <><ScissorOutlined style={{marginRight:5, color:'#fa8c16'}}/> {t}</> },
      { title: 'Loại hình', dataIndex: 'type', align: 'center' as const, render: (t:any) => t==='MIX' ? <Tag color="purple">Đa năng</Tag> : <Tag color="orange">Chuyên Gia công</Tag> },
      { title: 'Liên hệ', render: (r:any) => <div><PhoneOutlined /> {r.phone} <br/><small>{r.address}</small></div> },
      { 
          title: 'Hành động', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => (
              <Space>
                  <Button icon={<EditOutlined />} size="small" onClick={()=>{setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true)}} />
                  <Popconfirm title="Xóa?" onConfirm={()=>handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
              </Space>
          )
      }
  ];

  return (
    <div>
        <Card title="Danh Sách Nhà Gia Công (Xưởng Phụ)" extra={
            <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true)}}>Thêm Xưởng Mới</Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
            </Space>
        }>
            <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />
        </Card>

        <Modal title={editingItem ? "Cập Nhật Xưởng" : "Thêm Xưởng Gia Công"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()}>
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'PROCESSING' }}>
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="code" label="Mã Xưởng" rules={[{required:true}]}><Input /></Form.Item></Col>
                    <Col span={16}><Form.Item name="name" label="Tên Xưởng / Tổ Đội" rules={[{required:true}]}><Input /></Form.Item></Col>
                </Row>
                <Form.Item name="type" label="Loại Hình">
                    <Select>
                        <Option value="PROCESSING">Chuyên Gia Công (Chỉ nhận khoán)</Option>
                        <Option value="MIX">Hỗn Hợp (Vừa bán NL vừa Gia công)</Option>
                    </Select>
                </Form.Item>
                <Divider />
                <Form.Item name="phone" label="SĐT Liên Hệ"><Input /></Form.Item>
                <Form.Item name="address" label="Địa Chỉ Xưởng"><Input /></Form.Item>
            </Form>
        </Modal>
    </div>
  );
};

export default ManufacturersPage;