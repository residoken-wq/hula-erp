import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const SuppliersPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

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
      } catch(e) { message.error('Lỗi'); }
  };

  const handleDelete = async (id: number) => {
      try { await axios.delete(`${API_URL}/suppliers/${id}`); message.success('Xóa thành công'); fetchData(); } 
      catch(e) { message.error('Lỗi xóa'); }
  };

  const openEdit = (item: any) => {
      setEditingItem(item);
      form.setFieldsValue(item);
      setIsModalOpen(true);
  };

  const columns = [
      { title: 'Tên NCC', dataIndex: 'name', render: (t:any) => <b>{t}</b> },
      { title: 'Mã', dataIndex: 'code' },
      { title: 'Loại', dataIndex: 'type', render: (t:any) => t === 'MATERIAL' ? <Tag color="blue">Nguyên Liệu</Tag> : <Tag color="orange">Gia Công</Tag> },
      { title: 'SĐT', dataIndex: 'phone' },
      { title: 'Email', dataIndex: 'email' },
      { 
          title: '', key: 'action', 
          render: (_:any, r:any) => (
              <>
                  <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} style={{marginRight:5}} />
                  <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
              </>
          ) 
      }
  ];

  return (
    <Card title="Quản lý Nhà Cung Cấp" extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>{setEditingItem(null); form.resetFields(); setIsModalOpen(true)}}>Thêm NCC</Button>}>
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />
        <Modal title={editingItem ? "Sửa NCC" : "Thêm NCC"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()}>
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="name" label="Tên Nhà Cung Cấp" rules={[{required:true}]}><Input /></Form.Item>
                <Form.Item name="code" label="Mã NCC (Viết tắt)" rules={[{required:true}]}><Input /></Form.Item>
                {/* FIX: Use options prop instead of Option children */}
                <Form.Item name="type" label="Loại Cung Cấp" rules={[{required:true}]}>
                    <Select options={[
                        { label: 'Cung cấp Nguyên Liệu', value: 'MATERIAL' },
                        { label: 'Dịch vụ Gia Công', value: 'MANUFACTURER' }
                    ]} />
                </Form.Item>
                <Form.Item name="phone" label="SĐT"><Input /></Form.Item>
                <Form.Item name="email" label="Email"><Input /></Form.Item>
                <Form.Item name="address" label="Địa chỉ"><Input.TextArea /></Form.Item>
            </Form>
        </Modal>
    </Card>
  );
};
export default SuppliersPage;