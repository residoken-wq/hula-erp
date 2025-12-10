import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, InputNumber, Popconfirm, Space, Tag, Row, Col, Select, Tabs, Divider } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined, AuditOutlined, MinusCircleOutlined, BranchesOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const { Option } = Select;

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [form] = Form.useForm();

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try { 
        const res = await axios.get(`${API_URL}/customers`); 
        setCustomers(res.data);
        setFilteredData(res.data);
    } catch (e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Search Logic
  useEffect(() => {
      const lower = searchText.toLowerCase();
      const filtered = customers.filter(c => 
          (c.name && c.name.toLowerCase().includes(lower)) ||
          (c.code && c.code.toLowerCase().includes(lower)) ||
          (c.phone && c.phone.includes(lower))
      );
      setFilteredData(filtered);
  }, [searchText, customers]);

  // Save
  const handleSave = async (values: any) => {
    try {
      if (editingItem) {
          await axios.put(`${API_URL}/customers/${editingItem.id}`, values);
          message.success('Cập nhật thành công');
      } else {
          await axios.post(`${API_URL}/customers`, values);
          message.success('Thêm mới thành công');
      }
      setIsModalOpen(false); 
      fetchData();
    } catch (e: any) { 
        message.error(e.response?.data?.message || 'Có lỗi xảy ra'); 
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API_URL}/customers/${id}`); message.success('Đã xóa'); fetchData(); } 
    catch (e) { message.error('Không thể xóa (KH đã có dữ liệu ràng buộc)'); }
  };

  const columns = [
    { 
        title: 'Mã KH', dataIndex: 'code', width: 100,
        render: (t:any) => <b>{t}</b> 
    },
    { 
        title: 'Tên Khách Hàng', dataIndex: 'name',
        render: (t:any, r:any) => (
            <div>
                <div style={{fontWeight:500, color:'#1890ff'}}>{t}</div>
                {r.parent && <Tag icon={<BranchesOutlined />} color="purple" style={{marginTop:4}}>Thuộc: {r.parent.name}</Tag>}
                <div style={{color:'#888', fontSize:12}}>{r.address}</div>
            </div>
        )
    },
    { 
        title: 'Phân Loại', dataIndex: 'type', width: 100, align: 'center' as const,
        render: (t:any) => t === 'CUSTOMER' ? <Tag color="blue">Khách Hàng</Tag> : <Tag color="orange">Tiềm Năng</Tag>
    },
    { 
        title: 'Liên Hệ (Chính)', key: 'contact', width: 200,
        render: (_:any, r:any) => {
            // Ưu tiên hiển thị Contact trong danh sách liên hệ, nếu không có thì lấy sđt công ty
            if (r.contacts && r.contacts.length > 0) {
                return (
                    <div>
                        <UserOutlined /> {r.contacts[0].full_name} <br/>
                        <small>{r.contacts[0].phone || r.contacts[0].email}</small>
                        {r.contacts.length > 1 && <Tag style={{marginLeft:5}}>+{r.contacts.length-1}</Tag>}
                    </div>
                )
            }
            return <div><UserOutlined /> {r.phone}</div>
        }
    },
    { 
        title: 'Công Nợ', dataIndex: 'current_debt', align: 'right' as const, width: 120,
        render: (v:any) => <span style={{color: v>0?'red':'green'}}>{Number(v).toLocaleString()}</span>
    },
    { 
      title: '', key: 'action', width: 80, align: 'right' as const,
      render: (_: any, r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true); }} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title="Danh Mục Khách Hàng & Đối Tác" 
        extra={
            <Space>
                <Button icon={<PlusOutlined />} type="primary" onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }}>Thêm Mới</Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Tải lại</Button>
            </Space>
        }
      >
        <div style={{marginBottom: 16}}>
            <Input 
                placeholder="Tìm kiếm..." 
                prefix={<SearchOutlined style={{color:'#ccc'}}/>} 
                style={{width: 300}}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
            />
        </div>
        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} bordered pagination={{pageSize: 10}} />
      </Card>

      <Modal 
        title={editingItem ? `Sửa: ${editingItem.name}` : "Thêm Khách Hàng"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onOk={() => form.submit()} 
        width={700}
        style={{top: 20}}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'LEAD', credit_limit: 0 }}>
          <Tabs defaultActiveKey="1" items={[
              {
                  key: '1', label: 'Thông tin chung',
                  children: (
                      <>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="code" label="Mã KH" rules={[{ required: true }]}><Input disabled={!!editingItem} /></Form.Item></Col>
                            <Col span={16}><Form.Item name="name" label="Tên Công Ty / Khách Hàng" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="phone" label="SĐT Tổng đài"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="email" label="Email chung"><Input /></Form.Item></Col>
                        </Row>
                        <Form.Item name="address" label="Địa Chỉ"><Input /></Form.Item>
                        
                        <Divider orientation="left">Thiết lập</Divider>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="parent_id" label="Thuộc công ty mẹ (Nếu có)">
                                    <Select 
                                        allowClear 
                                        showSearch 
                                        placeholder="Chọn công ty mẹ..."
                                        optionFilterProp="children"
                                        filterOption={(input, option:any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                        options={customers.filter(c => c.id !== editingItem?.id).map(c => ({label: c.name, value: c.id}))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="credit_limit" label="Hạn Mức Nợ (VNĐ)">
                                    <InputNumber style={{width:'100%'}} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="tax_code" label="Mã Số Thuế"><Input prefix={<AuditOutlined />} /></Form.Item></Col>
                            <Col span={12}>
                                <Form.Item name="type" label="Phân Loại">
                                    <Select>
                                        <Option value="LEAD">Tiềm Năng (Lead)</Option>
                                        <Option value="CUSTOMER">Khách Hàng (Customer)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                      </>
                  )
              },
              {
                  key: '2', label: 'Người liên hệ (Contacts)',
                  children: (
                      <Form.List name="contacts">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{marginBottom: 8, borderBottom:'1px dashed #eee', paddingBottom:5}}>
                                        <Col span={8}><Form.Item {...restField} name={[name, 'full_name']} noStyle rules={[{required:true, message:'Nhập tên'}]}><Input placeholder="Họ Tên" prefix={<UserOutlined />} /></Form.Item></Col>
                                        <Col span={6}><Form.Item {...restField} name={[name, 'job_title']} noStyle><Input placeholder="Chức danh" /></Form.Item></Col>
                                        <Col span={8}>
                                            <Form.Item {...restField} name={[name, 'phone']} noStyle><Input placeholder="Di động/Email" /></Form.Item>
                                        </Col>
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
    </div>
  );
};

export default CustomersPage;