import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
        const [resUsers, resGroups] = await Promise.all([
            axios.get(`${API_URL}/users`),
            axios.get(`${API_URL}/users/groups`)
        ]);
        setUsers(resUsers.data);
        setGroups(resGroups.data);
    } catch(e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
      try {
          if (editingUser) {
              await axios.put(`${API_URL}/users/${editingUser.id}`, values);
              message.success('Cập nhật user thành công');
          } else {
              await axios.post(`${API_URL}/users`, { ...values, password: '123' }); // Mặc định pass 123
              message.success('Tạo user mới thành công (Pass mặc định: 123)');
          }
          setIsModalOpen(false);
          fetchData();
      } catch(e: any) { message.error(e.response?.data?.message || 'Lỗi'); }
  };

  const columns = [
      { title: 'Username', dataIndex: 'username', render: (t:any) => <b>{t}</b> },
      { title: 'Họ Tên', dataIndex: 'full_name' },
      { 
          title: 'Nhóm (Role)', dataIndex: 'group', 
          render: (g:any) => g ? <Tag color="blue">{g.name}</Tag> : <Tag color="red">Chưa phân nhóm</Tag> 
      },
      { 
          title: 'Trạng thái', dataIndex: 'is_active', 
          render: (act: boolean) => <Switch size="small" checked={act} disabled /> 
      },
      {
          title: '', key: 'act', align: 'right' as const,
          render: (_:any, r:any) => <Button icon={<EditOutlined/>} size="small" onClick={()=>{setEditingUser(r); form.setFieldsValue({...r, group_id: r.group?.id}); setIsModalOpen(true);}} />
      }
  ];

  return (
    <Card title="Quản lý Người Dùng (Users)" extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setEditingUser(null); form.resetFields(); setIsModalOpen(true);}}>Thêm User</Button>}>
        <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />
        
        <Modal title={editingUser ? "Sửa User" : "Thêm User Mới"} open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()}>
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="username" label="Tên đăng nhập" rules={[{required:true}]}><Input disabled={!!editingUser} /></Form.Item>
                <Form.Item name="full_name" label="Họ và tên" rules={[{required:true}]}><Input prefix={<UserOutlined/>} /></Form.Item>
                <Form.Item name="group_id" label="Nhóm quyền (Role)" rules={[{required:true}]}>
                    <Select placeholder="Chọn nhóm">
                        {groups.map(g => <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="email" label="Email"><Input /></Form.Item>
                {editingUser && <Form.Item name="is_active" valuePropName="checked" label="Kích hoạt"><Switch /></Form.Item>}
            </Form>
        </Modal>
    </Card>
  );
};

export default UsersPage;