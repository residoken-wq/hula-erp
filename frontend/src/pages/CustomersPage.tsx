import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, InputNumber, Popconfirm, Space, Tag, Row, Col, Select } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined, AuditOutlined } from '@ant-design/icons';
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

  // 1. Fetch Data
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

  // 2. Search Logic
  useEffect(() => {
      const lower = searchText.toLowerCase();
      const filtered = customers.filter(c => 
          (c.name && c.name.toLowerCase().includes(lower)) ||
          (c.code && c.code.toLowerCase().includes(lower)) ||
          (c.phone && c.phone.includes(lower))
      );
      setFilteredData(filtered);
  }, [searchText, customers]);

  // 3. Save (Create/Update)
  const handleSave = async (values: any) => {
    try {
      if (editingItem) {
          await axios.put(`${API_URL}/customers/${editingItem.id}`, values);
          message.success('Cập nhật thành công');
      } else {
          // Mặc định tạo mới là LEAD nếu không chọn
          await axios.post(`${API_URL}/customers`, values);
          message.success('Thêm khách hàng mới thành công');
      }
      setIsModalOpen(false); 
      fetchData();
    } catch (e: any) { 
        message.error(e.response?.data?.message || 'Có lỗi xảy ra'); 
    }
  };

  // 4. Delete
  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API_URL}/customers/${id}`); message.success('Đã xóa'); fetchData(); } 
    catch (e) { message.error('Không thể xóa (KH đã có đơn hàng)'); }
  };

  // --- COLUMNS ---
  const columns = [
    { 
        title: 'Mã KH', dataIndex: 'code', width: 120,
        render: (t:any) => <b>{t}</b> 
    },
    { 
        title: 'Tên Khách Hàng', dataIndex: 'name',
        render: (t:any, r:any) => (
            <div>
                <div style={{fontWeight:500, color:'#1890ff'}}>{t}</div>
                <small style={{color:'#888'}}>{r.address}</small>
            </div>
        )
    },
    { 
        title: 'Phân Loại', dataIndex: 'type', width: 100, align: 'center' as const,
        render: (t:any) => t === 'CUSTOMER' ? <Tag color="blue">Khách Hàng</Tag> : <Tag color="orange">Tiềm Năng</Tag>
    },
    { 
        title: 'Liên Hệ', key: 'contact', width: 200,
        render: (_:any, r:any) => (
            <div>
                <div><UserOutlined /> {r.phone}</div>
                {r.email && <div style={{fontSize:12, color:'#666'}}>{r.email}</div>}
            </div>
        )
    },
    { 
        title: 'Hạn Mức Nợ', dataIndex: 'credit_limit', align: 'right' as const, width: 150,
        render: (v:any) => v > 0 ? <b>{Number(v).toLocaleString()}</b> : <span style={{color:'#ccc'}}>Không giới hạn</span>
    },
    { 
        title: 'Nợ Hiện Tại', dataIndex: 'current_debt', align: 'right' as const, width: 150,
        render: (v:any) => <span style={{color: v>0?'red':'green'}}>{Number(v).toLocaleString()}</span>
    },
    { 
      title: '', key: 'action', width: 100, align: 'right' as const,
      render: (_: any, r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingItem(r); form.setFieldsValue(r); setIsModalOpen(true); }} />
          <Popconfirm title="Xóa khách này?" description="Chỉ xóa được khi chưa có đơn hàng" onConfirm={() => handleDelete(r.id)}>
              <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title="Danh Mục Khách Hàng (Master Data)" 
        extra={
            <Space>
                <Button icon={<PlusOutlined />} type="primary" onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }}>Thêm Mới</Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Tải lại</Button>
            </Space>
        }
      >
        <div style={{marginBottom: 16}}>
            <Input 
                placeholder="Tìm kiếm theo Mã, Tên, SĐT..." 
                prefix={<SearchOutlined style={{color:'#ccc'}}/>} 
                style={{width: 300}}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
            />
        </div>
        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} bordered pagination={{pageSize: 10}} />
      </Card>

      {/* MODAL FORM */}
      <Modal 
        title={editingItem ? `Sửa Khách Hàng: ${editingItem.name}` : "Thêm Khách Hàng Mới"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onOk={() => form.submit()} 
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'LEAD', credit_limit: 0 }}>
          <Row gutter={16}>
              <Col span={8}><Form.Item name="code" label="Mã Khách Hàng" rules={[{ required: true }]}><Input placeholder="VD: KH001" disabled={!!editingItem} /></Form.Item></Col>
              <Col span={16}><Form.Item name="name" label="Tên Khách Hàng / Công Ty" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          
          <Row gutter={16}>
              <Col span={12}><Form.Item name="phone" label="Số Điện Thoại" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
          </Row>

          <Form.Item name="address" label="Địa Chỉ Giao Hàng/Trụ Sở"><Input /></Form.Item>

          <Row gutter={16}>
              <Col span={12}><Form.Item name="tax_code" label="Mã Số Thuế"><Input prefix={<AuditOutlined />} /></Form.Item></Col>
              <Col span={12}>
                  <Form.Item name="type" label="Phân Loại">
                      <Select>
                          <Option value="LEAD">Khách Tiềm Năng (Lead)</Option>
                          <Option value="CUSTOMER">Khách Chính Thức</Option>
                      </Select>
                  </Form.Item>
              </Col>
          </Row>

          <div style={{background: '#fff1f0', padding: 15, borderRadius: 8, border: '1px solid #ffa39e'}}>
              <Row gutter={16}>
                  <Col span={24}>
                      <Form.Item name="credit_limit" label="Hạn Mức Tín Dụng (Credit Limit)" help="Nhập 0 nếu không giới hạn. Hệ thống sẽ chặn đơn hàng nếu vượt quá hạn mức." style={{marginBottom:0}}>
                          <InputNumber 
                            style={{width:'100%'}} 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            addonAfter="VNĐ"
                          />
                      </Form.Item>
                  </Col>
              </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;