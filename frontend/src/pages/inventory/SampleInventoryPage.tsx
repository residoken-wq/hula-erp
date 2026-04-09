import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Tabs, Space, Modal, Form, InputNumber, Input, Select, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined, HistoryOutlined, CheckCircleOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const SampleInventoryPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('stocks');
    const [stocks, setStocks] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
    
    const [form] = Form.useForm();
    const [selectedItems, setSelectedItems] = useState<{product_id: number, quantity: number, note: string}[]>([]);

    useEffect(() => {
        fetchProducts();
        if (activeTab === 'stocks') fetchStocks();
        if (activeTab === 'transactions') fetchTransactions();
    }, [activeTab]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/samples/stocks');
            setStocks(res.data);
        } catch (e) {
            message.error('Lỗi tải tồn kho mẫu');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/samples/transactions');
            setTransactions(res.data);
        } catch (e) {
            message.error('Lỗi tải lịch sử');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransaction = async (values: any) => {
        if (selectedItems.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 sản phẩm');
            return;
        }

        try {
            await api.post('/inventory/samples/transactions', {
                type: modalType,
                reference_type: values.reference_type,
                reference_id: values.reference_id, // can be ID or string for now
                note: values.note,
                items: selectedItems
            });
            message.success('Tạo phiếu thành công!');
            setIsModalOpen(false);
            if (activeTab === 'transactions') fetchTransactions();
            else setActiveTab('transactions');
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleConfirmTransaction = async (id: number) => {
        try {
            await api.post(`/inventory/samples/transactions/${id}/confirm`);
            message.success('Đã xác nhận phiếu!');
            fetchTransactions();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        try {
            await api.delete(`/inventory/samples/transactions/${id}`);
            message.success('Đã xóa phiếu!');
            fetchTransactions();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Không thể xóa phiếu');
        }
    };

    const stockColumns = [
        { title: 'Item ID', dataIndex: 'item_id', width: 80 },
        { 
            title: 'Sản phẩm', 
            key: 'product',
            render: (_: any, r: any) => {
                const p = products.find(x => x.id === r.item_id);
                return p ? `${p.sku} - ${p.name}` : `Loading ID ${r.item_id}`;
            }
        },
        { 
            title: 'Hình ảnh', 
            key: 'image', 
            width: 80,
            render: (_: any, r: any) => {
                const p = products.find(x => x.id === r.item_id);
                return p?.image_url ? <img src={p.image_url} style={{width:40, height:40, objectFit:'cover'}} alt="" /> : '-';
            }
        },
        { title: 'SL Tồn Hàng Mẫu', dataIndex: 'quantity', width: 150, align: 'right' as const, render: (v:any)=> <b>{Number(v).toLocaleString()}</b> },
    ];

    const txColumns = [
        { title: 'Mã Phiếu', dataIndex: 'code', width: 140, render: (t:any)=> <b>{t}</b> },
        { 
            title: 'Loại', dataIndex: 'type', width: 100, 
            render: (t:any) => <Tag color={t === 'IMPORT' ? 'blue' : 'orange'}>{t === 'IMPORT' ? 'NHẬP MAIN' : 'XUẤT MẪU'}</Tag>
        },
        { 
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (s:any) => <Tag color={s === 'COMPLETED' ? 'green' : 'default'}>{s}</Tag>
        },
        { title: 'Nguồn/Đích', dataIndex: 'reference_type', render: (_:any, r:any) => r.reference_type ? `${r.reference_type} #${r.reference_id||''}` : 'Nội bộ' },
        { title: 'Chi tiết SP', key: 'items', render: (_:any, r:any) => (
            <ul style={{ margin:0, paddingLeft: 16 }}>
                {(r.items || []).map((i:any) => (
                    <li key={i.id}>{i.product?.name || `Product#${i.product_id}`} (SL: {i.quantity}) {i.note ? `- ${i.note}`:''}</li>
                ))}
            </ul>
        )},
        { title: 'Ngày tạo', dataIndex: 'created_at', render: (d:any) => dayjs(d).format('DD/MM/YY HH:mm') },
        {
            title: 'Hành động',
            key: 'action',
            render: (_:any, r:any) => (
                <Space>
                    {r.status === 'DRAFT' && (
                        <>
                            <Popconfirm title="Xác nhận phiếu này kho?" onConfirm={() => handleConfirmTransaction(r.id)}>
                                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Duyệt</Button>
                            </Popconfirm>
                            <Popconfirm title="Xóa phiếu này?" onConfirm={() => handleDeleteTransaction(r.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            )
        }
    ];

    const openModal = (type: 'IMPORT' | 'EXPORT') => {
        setModalType(type);
        setSelectedItems([]);
        form.resetFields();
        setIsModalOpen(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Kho Hàng Mẫu</Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('IMPORT')}>Tạo Phiếu Nhập Mẫu</Button>
                    <Button type="primary" danger icon={<PlusOutlined />} onClick={() => openModal('EXPORT')}>Tạo Phiếu Xuất Mẫu</Button>
                </Space>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'stocks',
                            label: <span><AppstoreOutlined /> Tồn Kho Hàng Mẫu</span>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Table 
                                        loading={loading}
                                        columns={stockColumns}
                                        dataSource={stocks}
                                        rowKey="id"
                                        pagination={{ pageSize: 20 }}
                                    />
                                </div>
                            )
                        },
                        {
                            key: 'transactions',
                            label: <span><HistoryOutlined /> Lịch sử Nhập/Xuất Mẫu</span>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Table 
                                        loading={loading}
                                        columns={txColumns}
                                        dataSource={transactions}
                                        rowKey="id"
                                    />
                                </div>
                            )
                        }
                    ]} 
                />
            </Card>

            <Modal
                title={modalType === 'IMPORT' ? "Tạo Phiếu Nhập Hàng Mẫu" : "Tạo Phiếu Xuất Hàng Mẫu"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                width={700}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleCreateTransaction}>
                    {modalType === 'EXPORT' && (
                        <Space style={{ display: 'flex' }}>
                            <Form.Item name="reference_type" label="Loại chứng từ">
                                <Select style={{ width: 150 }} placeholder="Chọn loại">
                                    <Option value="LEAD">Khách tiềm năng (Lead)</Option>
                                    <Option value="QUOTE">Báo giá (Quote)</Option>
                                    <Option value="SO">Đơn hàng (SO)</Option>
                                    <Option value="OTHER">Khác</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="reference_id" label="Mã Số Chứng Từ">
                                <Input placeholder="Nhập ID hoặc mã..." style={{ width: 200 }} />
                            </Form.Item>
                        </Space>
                    )}
                    
                    <Form.Item name="note" label="Ghi chú chung">
                        <Input.TextArea rows={2} placeholder="Vd: Chuyển hàng mẫu từ kho chính sang kho mẫu..." />
                    </Form.Item>

                    <Card size="small" title="Danh sách sản phẩm" style={{ marginTop: 10 }}>
                        <Form onFinish={(vals) => {
                            setSelectedItems([...selectedItems, { product_id: vals.prodId, quantity: vals.qty, note: '' }]);
                        }} layout="inline">
                            <Form.Item name="prodId" rules={[{required: true}]}>
                                <Select showSearch filterOption={(inpt, opt:any) => (opt?.children as string).toLowerCase().includes(inpt.toLowerCase())} style={{ width: 300 }} placeholder="Chọn sản phẩm">
                                    {products.map(p => <Option key={p.id} value={p.id}>{p.sku} - {p.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item name="qty" rules={[{required: true}]}>
                                <InputNumber min={1} placeholder="SL" />
                            </Form.Item>
                            <Button type="dashed" htmlType="submit">Thêm</Button>
                        </Form>

                        <Table 
                            size="small" 
                            style={{ marginTop: 15 }}
                            dataSource={selectedItems} 
                            rowKey={(r, idx) => idx as number}
                            pagination={false}
                            columns={[
                                { title: 'Sản phẩm', render: (_, r) => products.find(p => p.id === r.product_id)?.name },
                                { title: 'SL', dataIndex: 'quantity' },
                                { title: '', width: 50, render: (_, r, idx) => <Button danger size="small" icon={<DeleteOutlined />} onClick={()=> {
                                    const n = [...selectedItems]; n.splice(idx, 1); setSelectedItems(n);
                                }}/> }
                            ]}
                        />
                    </Card>
                </Form>
            </Modal>
        </div>
    );
};

export default SampleInventoryPage;
