import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
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
              // Logic Edit: Nếu không nhập password thì xóa field đó khỏi payload để không bị overwrite thành rỗng
              const payload = { ...values };
              if (!payload.password) {
                  delete payload.password;
              }
              
              await axios.put(`${API_URL}/users/${editingUser.id}`, payload);
              message.success('Cập nhật thông tin thành công');
          } else {
              // Logic Create: Gửi toàn bộ values (bao gồm password bắt buộc)
              await axios.post(`${API_URL}/users`, values);
              message.success('Tạo user mới thành công');
          }
          setIsModalOpen(false);
          fetchData();
      } catch(e: any) { 
          message.error(e.response?.data?.message || 'Có lỗi xảy ra'); 
      }
  };

  const openModal = (record?: any) => {
      setEditingUser(record);
      if (record) {
          form.setFieldsValue({
              ...record,
              group_id: record.group?.id,
              password: '', // Reset password field khi edit để tránh hiện mật khẩu cũ (đã hash)
          });
      } else {
          form.resetFields();
      }
      setIsModalOpen(true);
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
          render: (_:any, r:any) => <Button icon={<EditOutlined/>} size="small" onClick={() => openModal(r)} />
      }
  ];

  return (
    <Card title="Quản lý Người Dùng (Users)" extra={<Button type="primary" icon={<PlusOutlined/>} onClick={() => openModal(null)}>Thêm User</Button>}>
        <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />
        
        <Modal 
            title={editingUser ? "Sửa thông tin User" : "Thêm User Mới"} 
            open={isModalOpen} 
            onCancel={()=>setIsModalOpen(false)} 
            onOk={()=>form.submit()}
        >
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ is_active: true }}>
                <Form.Item 
                    name="username" 
                    label="Tên đăng nhập" 
                    rules={[{required: true, message: 'Vui lòng nhập tên đăng nhập'}]}
                >
                    <Input disabled={!!editingUser} prefix={<UserOutlined />} placeholder="Ví dụ: admin" />
                </Form.Item>

                {/* --- MỚI: TRƯỜNG PASSWORD --- */}
                <Form.Item 
                    name="password" 
                    label={editingUser ? "Mật khẩu mới (Bỏ trống nếu không đổi)" : "Mật khẩu"} 
                    rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu' }]}
                    tooltip={editingUser ? "Chỉ nhập nếu bạn muốn đổi mật khẩu cho user này" : undefined}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder={editingUser ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."} />
                </Form.Item>
                {/* --------------------------- */}

                <Form.Item 
                    name="full_name" 
                    label="Họ và tên" 
                    rules={[{required: true, message: 'Vui lòng nhập họ tên'}]}
                >
                    <Input placeholder="Ví dụ: Nguyễn Văn A" />
                </Form.Item>

                <Form.Item 
                    name="group_id" 
                    label="Nhóm quyền (Role)" 
                    rules={[{required: true, message: 'Vui lòng chọn nhóm'}]}
                >
                    <Select placeholder="Chọn nhóm">
                        {groups.map(g => <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="email" label="Email">
                    <Input placeholder="email@example.com" />
                </Form.Item>

                {editingUser && (
                    <Form.Item name="is_active" valuePropName="checked" label="Trạng thái kích hoạt">
                        <Switch checkedChildren="Active" unCheckedChildren="Locked" />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    </Card>
  );
};

export default UsersPage;