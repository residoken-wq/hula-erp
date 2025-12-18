import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Tag, Statistic, Radio, Divider, Space, Badge } from 'antd';
import { 
    ReloadOutlined, SwapOutlined, HistoryOutlined, 
    AppstoreOutlined, ArrowUpOutlined, ArrowDownOutlined,
    InboxOutlined, ShopOutlined, AlertOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Option } = Select;

// ĐỊNH NGHĨA 4 KHO
const WAREHOUSES = [
    { code: 'KHO_TP', name: '1. Kho Thành Phẩm', color: 'green' },
    { code: 'KHO_BTP', name: '2. Kho Bán Thành Phẩm', color: 'orange' },
    { code: 'KHO_NPL', name: '3. Kho Nguyên Phụ Liệu', color: 'blue' },
    { code: 'KHO_LOI', name: '4. Kho Hàng Lỗi', color: 'red' },
];

const InventoryPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]); // Dữ liệu tồn chi tiết
  const [history, setHistory] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('ALL_STOCKS'); // Tab chính
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  const adjustmentType = Form.useWatch('type', form);
  const itemType = Form.useWatch('itemType', form);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [resProd, resMat, resStock, resHist] = await Promise.all([
            axios.get(`${API_URL}/products`),
            axios.get(`${API_URL}/materials`),
            axios.get(`${API_URL}/inventory/stocks`), // API mới lấy chi tiết kho
            axios.get(`${API_URL}/inventory/history`)
        ]);
        setProducts(Array.isArray(resProd.data) ? resProd.data : []);
        setMaterials(Array.isArray(resMat.data) ? resMat.data : []);
        setStocks(Array.isArray(resStock.data) ? resStock.data : []);
        setHistory(Array.isArray(resHist.data) ? resHist.data : []);
    } catch(e) { message.error('Lỗi tải dữ liệu kho'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdjust = async (values: any) => {
      try {
          await axios.post(`${API_URL}/inventory/adjust`, {
              ...values,
              ref: values.ref || 'MANUAL_ADJ',
          });
          message.success('Điều chỉnh kho thành công!');
          setIsModalOpen(false);
          form.resetFields();
          fetchData(); 
      } catch(e: any) {
          message.error(e.response?.data?.message || 'Lỗi điều chỉnh');
      }
  };

  // --- HÀM TÍNH TỒN KHO CỤ THỂ ---
  const getStockQty = (type: string, id: number, whCode: string) => {
      const record = stocks.find(s => s.item_type === type && s.item_id === id && s.warehouse_code === whCode);
      return Number(record?.quantity || 0);
  };

  // --- PREPARE DATA ---
  const masterData = useMemo(() => {
      const prodList = products.map(p => ({ ...p, item_type: 'PRODUCT', key: `P_${p.id}` }));
      const matList = materials.map(m => ({ ...m, item_type: 'MATERIAL', key: `M_${m.id}` }));
      return [...prodList, ...matList];
  }, [products, materials]);

  // Cột hiển thị linh động theo Kho
  const getStockColumns = (whCode?: string) => [
      {
          title: 'Phân loại', dataIndex: 'item_type', width: 100,
          render: (t: string) => t==='PRODUCT' ? <Tag color="blue">Sản phẩm</Tag> : <Tag color="cyan">Nguyên liệu</Tag>
      },
      { title: 'Mã', dataIndex: 'sku', render: (t:any, r:any) => <b>{t || r.code}</b> },
      { title: 'Tên hàng', dataIndex: 'name' },
      { title: 'ĐVT', dataIndex: 'unit', align: 'center' as const, width: 80 },
      { 
          title: whCode ? `Tồn ${WAREHOUSES.find(w=>w.code===whCode)?.name}` : 'Tổng Tồn Hệ Thống', 
          key: 'qty', align: 'right' as const, width: 150,
          render: (_:any, r:any) => {
              const qty = whCode 
                  ? getStockQty(r.item_type, r.id, whCode) 
                  : Number(r.quantity_in_stock || 0); // Nếu xem tất cả thì lấy tổng
              
              return <Tag color={qty > 0 ? 'green' : 'red'} style={{fontSize: 14, fontWeight: 'bold'}}>{qty.toLocaleString()}</Tag>
          }
      },
      {
          title: '', key: 'action', align: 'center' as const, width: 100,
          render: (_:any, r:any) => (
              <Button size="small" icon={<SwapOutlined/>} onClick={()=>{
                  form.setFieldsValue({
                      itemType: r.item_type,
                      itemId: r.id,
                      type: 'IMPORT',
                      warehouse: whCode || 'KHO_TP' // Default
                  });
                  setIsModalOpen(true);
              }}>Điều chỉnh</Button>
          )
      }
  ];

  const historyColumns = [
      { title: 'Thời gian', dataIndex: 'created_at', width: 140, render: (t:any) => <span style={{fontSize:12}}>{dayjs(t).format('DD/MM/YY HH:mm')}</span> },
      { title: 'Kho', dataIndex: 'warehouse', width: 120, render: (w:string) => { const wh = WAREHOUSES.find(x=>x.code===w); return <Tag color={wh?.color}>{wh?.name || w}</Tag> } },
      { title: 'GD', dataIndex: 'type', width: 80, render: (t:string) => t==='IMPORT' ? <span style={{color:'green'}}><ArrowDownOutlined/> Nhập</span> : <span style={{color:'red'}}><ArrowUpOutlined/> Xuất</span> },
      { title: 'Mã Hàng', dataIndex: 'item_code', width: 120, render: (t:any) => <b>{t}</b> },
      { title: 'SL', dataIndex: 'quantity', align: 'right' as const, width: 80, render: (v:any, r:any) => <b style={{color: r.type==='IMPORT'?'green':'red'}}>{r.type==='IMPORT'?'+':'-'}{Number(v).toLocaleString()}</b> },
      { title: 'Tồn sau', dataIndex: 'balance_after', align: 'right' as const, width: 80, render: (v:any) => Number(v).toLocaleString() },
      { title: 'Ref', dataIndex: 'reference_code', render: (t:any) => <Tag>{t}</Tag> },
      { title: 'Note', dataIndex: 'note' }
  ];

  // List item cho Select trong Modal
  const itemList = useMemo(() => {
      if(itemType === 'PRODUCT') return products.map(p => ({ label: `${p.sku} - ${p.name}`, value: p.id }));
      if(itemType === 'MATERIAL') return materials.map(m => ({ label: `${m.code} - ${m.name}`, value: m.id }));
      return [];
  }, [itemType, products, materials]);

  return (
    <div>
        {/* --- DASHBOARD MINI --- */}
        <Row gutter={16} style={{marginBottom: 16}}>
            {WAREHOUSES.map(wh => {
                // Tính tổng tồn của kho này (chỉ mang tính tham khảo tổng số lượng)
                const totalInWh = stocks.filter(s => s.warehouse_code === wh.code).reduce((sum, s) => sum + Number(s.quantity), 0);
                return (
                    <Col span={6} key={wh.code}>
                        <Card size="small" style={{borderTop: `3px solid ${wh.color}`}}>
                            <Statistic 
                                title={wh.name} 
                                value={totalInWh} 
                                valueStyle={{color: wh.color}} 
                                prefix={<AppstoreOutlined />} 
                                suffix="đv"
                            />
                        </Card>
                    </Col>
                )
            })}
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
            <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
                {/* TAB TỔNG HỢP */}
                <Tabs.TabPane tab={<span><AppstoreOutlined /> Toàn bộ hệ thống</span>} key="ALL_STOCKS">
                    <Table dataSource={masterData} columns={getStockColumns()} size="small" rowKey="key" pagination={{pageSize:10}} />
                </Tabs.TabPane>

                {/* CÁC TAB KHO CON */}
                {WAREHOUSES.map(wh => (
                    <Tabs.TabPane tab={<span style={{color: wh.color}}>{wh.name}</span>} key={wh.code}>
                        <Table dataSource={masterData} columns={getStockColumns(wh.code)} size="small" rowKey="key" pagination={{pageSize:10}} />
                    </Tabs.TabPane>
                ))}

                {/* TAB LỊCH SỬ */}
                <Tabs.TabPane tab={<span><HistoryOutlined /> Nhật Ký GD</span>} key="HISTORY">
                    <Table dataSource={history} columns={historyColumns} size="small" rowKey="id" pagination={{pageSize:15}} />
                </Tabs.TabPane>
            </Tabs>
        </Card>

        {/* MODAL ĐIỀU CHỈNH */}
        <Modal title="Phiếu Điều Chỉnh Kho" open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={()=>form.submit()} okText="Xác nhận">
            <Form form={form} layout="vertical" onFinish={handleAdjust} initialValues={{ type: 'IMPORT', itemType: 'PRODUCT', warehouse: 'KHO_TP', quantity: 1 }}>
                
                <Form.Item name="warehouse" label="Chọn Kho tác động" rules={[{required:true}]}>
                    <Select>
                        {WAREHOUSES.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}
                    </Select>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="type" label="Hành động">
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value="IMPORT">NHẬP (+)</Radio.Button>
                                <Radio.Button value="EXPORT">XUẤT (-)</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="itemType" label="Loại hàng">
                            <Select><Option value="PRODUCT">Sản phẩm</Option><Option value="MATERIAL">Nguyên liệu</Option></Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="itemId" label="Mã hàng" rules={[{required:true}]}>
                    <Select showSearch optionFilterProp="label" options={itemList} placeholder="Tìm kiếm..." />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}><Form.Item name="quantity" label="Số lượng" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0}/></Form.Item></Col>
                    <Col span={12}><Form.Item name="ref" label="Mã tham chiếu"><Input placeholder="VD: KK-01" /></Form.Item></Col>
                </Row>
                <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2}/></Form.Item>
            </Form>
        </Modal>
    </div>
  );
};

export default InventoryPage;