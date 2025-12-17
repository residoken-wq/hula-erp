import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Tag, Statistic, Radio, Divider, Space, Tooltip } from 'antd';
import { 
    ReloadOutlined, SwapOutlined, HistoryOutlined, 
    AppstoreOutlined, ArrowUpOutlined, ArrowDownOutlined,
    InboxOutlined, FilterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Option } = Select;

const InventoryPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  // Watch form values để đổi list item tương ứng
  const adjustmentType = Form.useWatch('type', form);
  const itemType = Form.useWatch('itemType', form);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [resProd, resMat, resHist] = await Promise.all([
            axios.get(`${API_URL}/products`),
            axios.get(`${API_URL}/materials`),
            axios.get(`${API_URL}/inventory/history`)
        ]);
        setProducts(Array.isArray(resProd.data) ? resProd.data : []);
        setMaterials(Array.isArray(resMat.data) ? resMat.data : []);
        setHistory(Array.isArray(resHist.data) ? resHist.data : []);
    } catch(e) { message.error('Lỗi tải dữ liệu kho'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- XỬ LÝ ĐIỀU CHỈNH KHO ---
  const handleAdjust = async (values: any) => {
      try {
          await axios.post(`${API_URL}/inventory/adjust`, {
              ...values,
              ref: values.ref || 'MANUAL_ADJ', // Đánh dấu là điều chỉnh thủ công
          });
          message.success('Điều chỉnh kho thành công!');
          setIsModalOpen(false);
          form.resetFields();
          fetchData(); // Reload lại số liệu
      } catch(e: any) {
          message.error(e.response?.data?.message || 'Lỗi điều chỉnh');
      }
  };

  // --- TAB 1: TỔNG QUAN TỒN KHO (Hợp nhất SP & NL) ---
  const stockData = useMemo(() => {
      const prodList = products.map(p => ({ ...p, type: 'PRODUCT', key: `P_${p.id}` }));
      const matList = materials.map(m => ({ ...m, type: 'MATERIAL', key: `M_${m.id}` }));
      return [...prodList, ...matList];
  }, [products, materials]);

  const stockColumns = [
      {
          title: 'Phân loại', dataIndex: 'type', width: 100,
          filters: [{text: 'Sản phẩm', value: 'PRODUCT'}, {text: 'Nguyên liệu', value: 'MATERIAL'}],
          onFilter: (value: any, record: any) => record.type === value,
          render: (t: string) => t==='PRODUCT' ? <Tag color="blue">Sản phẩm</Tag> : <Tag color="cyan">Nguyên liệu</Tag>
      },
      { title: 'Mã', dataIndex: 'sku', render: (t:any, r:any) => <b>{t || r.code}</b> },
      { title: 'Tên', dataIndex: 'name' },
      { title: 'ĐVT', dataIndex: 'unit', align: 'center' as const, width: 80 },
      { 
          title: 'Tồn kho', dataIndex: 'quantity_in_stock', align: 'right' as const, width: 120,
          sorter: (a:any, b:any) => a.quantity_in_stock - b.quantity_in_stock,
          render: (v: number) => {
              const color = v <= 0 ? 'red' : (v < 10 ? 'orange' : 'green');
              return <Tag color={color} style={{fontSize: 14, fontWeight: 'bold'}}>{Number(v).toLocaleString()}</Tag>
          }
      },
      {
          title: '', key: 'action', align: 'center' as const,
          render: (_:any, r:any) => (
              <Button size="small" icon={<SwapOutlined/>} onClick={()=>{
                  form.setFieldsValue({
                      itemType: r.type,
                      itemId: r.id,
                      type: 'IMPORT'
                  });
                  setIsModalOpen(true);
              }}>Điều chỉnh</Button>
          )
      }
  ];

  // --- TAB 2: LỊCH SỬ GIAO DỊCH ---
  const historyColumns = [
      { 
          title: 'Thời gian', dataIndex: 'created_at', width: 160,
          render: (t:any) => <span style={{fontSize: 13}}>{dayjs(t).format('DD/MM/YYYY HH:mm')}</span> 
      },
      { 
          title: 'Loại GD', dataIndex: 'type', width: 100, align: 'center' as const,
          render: (t: string) => t==='IMPORT' 
              ? <Tag color="success" icon={<ArrowDownOutlined/>}>NHẬP</Tag> 
              : <Tag color="error" icon={<ArrowUpOutlined/>}>XUẤT</Tag>
      },
      {
          title: 'Đối tượng', key: 'obj',
          render: (_:any, r:any) => (
              <div>
                  <div style={{fontWeight: 600}}>{r.item_code}</div>
                  <div style={{fontSize: 11, color: '#888'}}>{r.item_type}</div>
              </div>
          )
      },
      { 
          title: 'Số lượng', dataIndex: 'quantity', align: 'right' as const, 
          render: (v:any, r:any) => <b style={{color: r.type==='IMPORT'?'green':'red'}}>{r.type==='IMPORT'?'+':'-'}{Number(v).toLocaleString()}</b>
      },
      { title: 'Tồn sau GD', dataIndex: 'balance_after', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'Chứng từ', dataIndex: 'reference_code', render: (t:any) => <Tag>{t}</Tag> },
      { title: 'Ghi chú', dataIndex: 'note', ellipsis: true }
  ];

  // --- SELECT LIST DYNAMIC ---
  const itemList = useMemo(() => {
      if(itemType === 'PRODUCT') return products.map(p => ({ label: `${p.sku} - ${p.name}`, value: p.id }));
      if(itemType === 'MATERIAL') return materials.map(m => ({ label: `${m.code} - ${m.name}`, value: m.id }));
      return [];
  }, [itemType, products, materials]);

  return (
    <div>
        <Row gutter={16} style={{marginBottom: 16}}>
            <Col span={8}>
                <Card>
                    <Statistic title="Tổng SP Tồn Kho" value={products.reduce((s,p)=>s+Number(p.quantity_in_stock||0),0)} prefix={<AppstoreOutlined />} valueStyle={{color:'#3f8600'}} />
                </Card>
            </Col>
            <Col span={8}>
                <Card>
                    <Statistic title="Tổng NL Tồn Kho" value={materials.reduce((s,m)=>s+Number(m.quantity_in_stock||0),0)} prefix={<InboxOutlined />} valueStyle={{color:'#1890ff'}} />
                </Card>
            </Col>
            <Col span={8}>
                <Card>
                    <Statistic title="Cảnh báo Tồn thấp" value={products.filter(p=>p.quantity_in_stock<10).length + materials.filter(m=>m.quantity_in_stock<10).length} prefix={<FilterOutlined />} valueStyle={{color:'#cf1322'}} />
                </Card>
            </Col>
        </Row>

        <Card 
            title="Quản Lý Kho Hàng" 
            extra={
                <Space>
                    <Button type="primary" icon={<SwapOutlined />} onClick={()=>{form.resetFields(); setIsModalOpen(true)}}>Điều Chỉnh Kho</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                </Space>
            }
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                { key: '1', label: <span><AppstoreOutlined /> Tồn Kho Hiện Tại</span>, children: <Table dataSource={stockData} columns={stockColumns} size="small" rowKey="key" pagination={{pageSize: 10}} loading={loading} /> },
                { key: '2', label: <span><HistoryOutlined /> Lịch Sử Giao Dịch</span>, children: <Table dataSource={history} columns={historyColumns} size="small" rowKey="id" pagination={{pageSize: 10}} loading={loading} /> },
            ]} />
        </Card>

        {/* MODAL ĐIỀU CHỈNH KHO */}
        <Modal 
            title="Phiếu Điều Chỉnh Kho (Manual Adjustment)" 
            open={isModalOpen} 
            onCancel={()=>setIsModalOpen(false)} 
            onOk={()=>form.submit()}
            okText="Thực hiện"
        >
            <Form form={form} layout="vertical" onFinish={handleAdjust} initialValues={{ type: 'IMPORT', itemType: 'PRODUCT', quantity: 1 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="type" label="Loại giao dịch">
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value="IMPORT" style={{color:'green'}}>NHẬP (+)</Radio.Button>
                                <Radio.Button value="EXPORT" style={{color:'red'}}>XUẤT (-)</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="itemType" label="Đối tượng">
                            <Select>
                                <Option value="PRODUCT">Sản phẩm (Product)</Option>
                                <Option value="MATERIAL">Nguyên liệu (Material)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="itemId" label="Chọn Mã Hàng" rules={[{required:true, message:'Vui lòng chọn mã hàng'}]}>
                    <Select showSearch optionFilterProp="label" options={itemList} placeholder="Tìm kiếm theo mã hoặc tên..." />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="quantity" label="Số lượng" rules={[{required:true}]}>
                            <InputNumber style={{width:'100%'}} min={0.01} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="ref" label="Mã tham chiếu (Optional)">
                            <Input placeholder="VD: KIEMKE-01" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="note" label="Ghi chú / Lý do">
                    <Input.TextArea rows={2} placeholder="VD: Nhập hàng đầu kỳ, Xuất hủy hàng lỗi..." />
                </Form.Item>

                <div style={{background: adjustmentType==='IMPORT' ? '#f6ffed' : '#fff1f0', padding: 10, borderRadius: 4, border: adjustmentType==='IMPORT' ? '1px solid #b7eb8f' : '1px solid #ffa39e'}}>
                    <Space>
                        {adjustmentType==='IMPORT' ? <ArrowDownOutlined style={{color:'green'}}/> : <ArrowUpOutlined style={{color:'red'}}/>}
                        <span>Bạn đang thực hiện <b>{adjustmentType==='IMPORT'?'TĂNG':'GIẢM'}</b> tồn kho. Hành động này sẽ được ghi vào lịch sử.</span>
                    </Space>
                </div>
            </Form>
        </Modal>
    </div>
  );
};

export default InventoryPage;