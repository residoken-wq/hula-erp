import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Row, Col, Modal, Form, Input, InputNumber, Select, Popconfirm, Space, Divider, Tabs, Tooltip } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import axios from 'axios';

import { API_URL } from '../config'; const API = `${API_URL}/materials`;

const MaterialsPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try { const res = await axios.get(API); setData(res.data); } catch (e) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editingItem) {
        await axios.put(`${API}/${editingItem.id}`, values);
        message.success('Cập nhật thành công');
      } else {
        await axios.post(API, values);
        message.success('Thêm mới thành công');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) { message.error('Có lỗi xảy ra'); }
  };

  const handleDelete = async (id: number) => {
    try { await axios.delete(`${API}/${id}`); message.success('Đã xóa'); fetchData(); } 
    catch (e) { message.error('Xóa thất bại'); }
  };

  // --- CẤU HÌNH CỘT CHO TAB 1: KHO CƠ BẢN (DA TACH COT) ---
  const columnsBase = [
    { 
      title: 'Nhóm', 
      dataIndex: 'category', 
      key: 'cat',
      width: 100,
      filters: [
        { text: 'Vải', value: 'Vải' },
        { text: 'Phụ liệu', value: 'Phụ liệu' },
        { text: 'Chỉ', value: 'Chỉ' },
      ],
      onFilter: (value: any, record: any) => (record.category || '').includes(value),
      render: (t:any) => t ? <Tag color="blue">{t}</Tag> : '-' 
    },
    { 
      title: 'Loại', 
      dataIndex: 'material_type', 
      key: 'type',
      width: 100,
      render: (t:any) => t ? <Tag color="cyan">{t}</Tag> : '-'
    },
    { title: 'Mã VL', dataIndex: 'code', width: 120, render: (t:any) => <b>{t}</b> },
    { title: 'Tên Nguyên Liệu', dataIndex: 'name' },
    { 
      title: 'ĐVT', dataIndex: 'unit', align: 'center' as const, width: 80,
      render: (t:any) => <Tag color="orange">{t}</Tag>
    },
    { 
      title: 'Giá Vốn', dataIndex: 'cost_per_unit', align: 'right' as const, width: 120,
      render: (v:any) => Number(v).toLocaleString()
    },
    { 
      title: 'Tồn Kho', dataIndex: 'quantity_in_stock', align: 'right' as const, width: 120,
      render: (v:any, r:any) => <b style={{color: v>0?'green':'red', fontSize: 15}}>{Number(v).toLocaleString()}</b>
    },
    {
      title: 'Hành động', key: 'action', width: 100, align: 'center' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingItem(record); form.setFieldsValue(record); setIsModalOpen(true); }} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- CẤU HÌNH CỘT CHO TAB 2: QUY ĐỔI ---
  const columnsConvert = [
    { title: 'Mã NPL', dataIndex: 'code', width: 120, render: (t:any) => <b>{t}</b> },
    { title: 'Tên Nguyên Liệu', dataIndex: 'name' },
    { 
        title: 'Công Thức Quy Đổi', key: 'formula', 
        render: (r:any) => (
            <div style={{ background: '#f5f5f5', padding: '5px 10px', borderRadius: 4, display: 'inline-block' }}>
                1 <b>{r.purchase_unit || '?'}</b> <SwapOutlined /> {r.conversion_factor} <b>{r.unit}</b>
            </div>
        )
    },
    { 
        title: 'Giá Mua (Tham khảo)', key: 'purchase_price', align: 'right' as const,
        render: (r:any) => {
            const purchasePrice = Number(r.cost_per_unit) * Number(r.conversion_factor);
            return (
                <Tooltip title={`= ${Number(r.cost_per_unit).toLocaleString()} * ${r.conversion_factor}`}>
                    {purchasePrice.toLocaleString()} / {r.purchase_unit}
                </Tooltip>
            )
        }
    },
    {
      title: '', key: 'action', width: 80,
      render: (_: any, record: any) => (
        <Button size="small" onClick={() => { setEditingItem(record); form.setFieldsValue(record); setIsModalOpen(true); }}>Sửa</Button>
      ),
    },
  ];

  const conversionData = data.filter((item: any) => item.purchase_unit && item.conversion_factor > 1);

  const tabItems = [
    {
      key: '1',
      label: 'Danh Sách Tồn Kho (Cơ Bản)',
      children: <Table columns={columnsBase} dataSource={data} rowKey="id" loading={loading} bordered pagination={{ pageSize: 10 }} />
    },
    {
      key: '2',
      label: `Cấu Hình Quy Đổi (${conversionData.length})`,
      children: <Table columns={columnsConvert} dataSource={conversionData} rowKey="id" loading={loading} bordered />
    }
  ];

  return (
    <div>
      <Card 
        title="Quản lý Nguyên Vật Liệu" 
        extra={
            <Space>
                <Button icon={<PlusOutlined />} type="primary" onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }}>Thêm Mới</Button>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Tải lại</Button>
            </Space>
        }
      >
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>

      <Modal title={editingItem ? "Sửa Nguyên Liệu" : "Thêm Nguyên Liệu Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ conversion_factor: 1 }}>
          <Row gutter={16}>
             <Col span={12}><Form.Item name="code" label="Mã VL" rules={[{ required: true }]}><Input /></Form.Item></Col>
             <Col span={12}><Form.Item name="name" label="Tên Nguyên Liệu" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
             <Col span={12}><Form.Item name="category" label="Nhóm"><Input placeholder="Vải, Chỉ..."/></Form.Item></Col>
             <Col span={12}><Form.Item name="material_type" label="Loại"><Input placeholder="Cotton..."/></Form.Item></Col>
          </Row>
          
          <Divider orientation="left" style={{ borderColor: '#1890ff', color: '#1890ff' }}>Quy Cách & Tồn Kho</Divider>
          
          <Row gutter={16}>
             <Col span={8}><Form.Item name="unit" label="ĐVT Kho (Gốc)" rules={[{ required: true }]}><Input placeholder="m, kg" /></Form.Item></Col>
             <Col span={8}><Form.Item name="purchase_unit" label="ĐVT Mua"><Input placeholder="Tấm, Cây" /></Form.Item></Col>
             <Col span={8}><Form.Item name="conversion_factor" label="Hệ số"><InputNumber style={{width:'100%'}} /></Form.Item></Col>
          </Row>

          <div style={{ background: '#f0f5ff', padding: '10px', borderRadius: 4, marginBottom: 20 }}>
             <Row gutter={16}>
                <Col span={12}><Form.Item name="cost_per_unit" label="Giá Vốn (trên 1 ĐVT Gốc)" style={{marginBottom:0}}><InputNumber style={{width:'100%'}} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                <Col span={12}><Form.Item name="quantity_in_stock" label="Số lượng Tồn (ĐVT Gốc)" style={{marginBottom:0}}><InputNumber style={{width:'100%'}} /></Form.Item></Col>
             </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
export default MaterialsPage;
