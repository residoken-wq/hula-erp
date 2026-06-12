import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Space, Modal, Form, Input, Select, Upload, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../utils/api';
import usePermission from '../hooks/usePermission';
import dayjs from 'dayjs';
import NestingMarkerTool from '../components/production/NestingMarkerTool';

const { TabPane } = Tabs;

const DesignManagementPage: React.FC = () => {
    const { canView, canCreate, canUpdate, canDelete } = usePermission('PRODUCTION');

    const [activeTab, setActiveTab] = useState('LOGOS');
    
    // --- Logos State ---
    const [logos, setLogos] = useState<any[]>([]);
    const [loadingLogos, setLoadingLogos] = useState(false);
    const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
    const [currentLogo, setCurrentLogo] = useState<any>(null);
    const [logoForm] = Form.useForm();

    // --- Print Designs State ---
    const [designs, setDesigns] = useState<any[]>([]);
    const [loadingDesigns, setLoadingDesigns] = useState(false);
    const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
    const [currentDesign, setCurrentDesign] = useState<any>(null);
    const [designForm] = Form.useForm();

    // --- Shared State ---
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (canView) {
            fetchCustomers();
            fetchProducts();
            if (activeTab === 'LOGOS') fetchLogos();
            if (activeTab === 'DESIGNS') fetchDesigns();
        }
    }, [activeTab, canView]);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (e) { console.error('Failed to fetch customers'); }
    }

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (e) { console.error('Failed to fetch products'); }
    }

    const fetchLogos = async () => {
        setLoadingLogos(true);
        try {
            const res = await api.get('/designs/logos');
            setLogos(res.data);
        } catch (e) { message.error('Lỗi tải danh sách logo'); }
        setLoadingLogos(false);
    }

    const fetchDesigns = async () => {
        setLoadingDesigns(true);
        try {
            const res = await api.get('/designs/print-designs');
            setDesigns(res.data);
        } catch (e) { message.error('Lỗi tải danh sách thiết kế'); }
        setLoadingDesigns(false);
    }

    // --- Handle Upload ---
    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess(res.data.url);
            message.success('Tải ảnh thành công');
            return res.data.url;
        } catch (e) {
            onError(e);
            message.error('Lỗi tải ảnh');
            return null;
        }
    };

    const normFile = (e: any) => {
        if (Array.isArray(e)) return e;
        return e?.fileList;
    };

    // --- Handle Logos ---
    const saveLogo = async (values: any) => {
        try {
            const payload = {
                ...values,
                image_url: values.image_url?.[0]?.response || values.image_url?.[0]?.url || currentLogo?.image_url
            };
            if (currentLogo) {
                await api.put(`/designs/logos/${currentLogo.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/designs/logos', payload);
                message.success('Tạo thành công');
            }
            setIsLogoModalOpen(false);
            fetchLogos();
        } catch (e) { message.error('Lỗi lưu logo'); }
    };

    const deleteLogo = async (id: number) => {
        try {
            await api.delete(`/designs/logos/${id}`);
            message.success('Đã xóa');
            fetchLogos();
        } catch (e) { message.error('Lỗi xóa logo'); }
    }

    // --- Handle Designs ---
    const saveDesign = async (values: any) => {
        try {
            const payload = {
                ...values,
                layout_image_url: values.layout_image_url?.[0]?.response || values.layout_image_url?.[0]?.url || currentDesign?.layout_image_url
            };
            if (currentDesign) {
                await api.put(`/designs/print-designs/${currentDesign.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/designs/print-designs', payload);
                message.success('Tạo thành công');
            }
            setIsDesignModalOpen(false);
            fetchDesigns();
        } catch (e) { message.error('Lỗi lưu thiết kế'); }
    };

    const deleteDesign = async (id: number) => {
        try {
            await api.delete(`/designs/print-designs/${id}`);
            message.success('Đã xóa');
            fetchDesigns();
        } catch (e) { message.error('Lỗi xóa thiết kế'); }
    }


    if (!canView) return <div>Bạn không có quyền truy cập module này</div>;

    return (
        <Card title="Quản lý Thiết kế In ấn & Thêu">
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: 'LOGOS', label: 'Logo Khách hàng', children: (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentLogo(null); logoForm.resetFields(); setIsLogoModalOpen(true); }}>Thêm Logo</Button>}
                            </div>
                            <Table 
                                dataSource={logos} 
                                rowKey="id" 
                                loading={loadingLogos}
                                columns={[
                                    { title: 'ID', dataIndex: 'id', width: 80 },
                                    { title: 'Hình ảnh', dataIndex: 'image_url', render: (url: string) => url ? <img src={url} style={{height: 50, objectFit: 'contain'}} /> : '-' },
                                    { title: 'Tên Logo', dataIndex: 'name' },
                                    { title: 'Khách hàng', dataIndex: 'customer', render: (c: any) => c?.name || '-' },
                                    { title: 'Kích thước', dataIndex: 'dimensions' },
                                    { title: 'Ghi chú', dataIndex: 'note' },
                                    { title: 'Ngày tạo', dataIndex: 'created_at', render: (d: any) => dayjs(d).format('DD/MM/YYYY') },
                                    { title: 'Thao tác', render: (r: any) => (
                                        <Space>
                                            {canUpdate && <Button icon={<EditOutlined/>} size="small" onClick={() => { 
                                                setCurrentLogo(r); 
                                                logoForm.setFieldsValue({
                                                    ...r,
                                                    image_url: r.image_url ? [{ uid: '-1', name: 'image', status: 'done', url: r.image_url }] : []
                                                }); 
                                                setIsLogoModalOpen(true); 
                                            }} />}
                                            {canDelete && <Popconfirm title="Xóa logo này?" onConfirm={() => deleteLogo(r.id)}><Button danger icon={<DeleteOutlined/>} size="small" /></Popconfirm>}
                                        </Space>
                                    )}
                                ]}
                            />
                        </>
                    )
                },
                {
                    key: 'DESIGNS', label: 'Sơ đồ In/Thêu', forceRender: true, children: (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentDesign(null); designForm.resetFields(); setIsDesignModalOpen(true); }}>Thêm Sơ đồ Thiết kế</Button>}
                            </div>
                            <Table 
                                dataSource={designs} 
                                rowKey="id" 
                                loading={loadingDesigns}
                                columns={[
                                    { title: 'Mã', dataIndex: 'code', width: 100 },
                                    { title: 'Tên Sơ đồ', dataIndex: 'name' },
                                    { title: 'Loại', dataIndex: 'type', render: (t: string) => <Tag color={t === 'PRINT' ? 'blue' : 'purple'}>{t}</Tag> },
                                    { title: 'Khách hàng', dataIndex: 'customer', render: (c: any) => c?.name || 'Chung' },
                                    { title: 'Sản phẩm', dataIndex: 'product', render: (p: any) => p?.name || '-' },
                                    { title: 'Sơ đồ', dataIndex: 'layout_image_url', render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">Xem</a> : '-' },
                                    { title: 'Ngày tạo', dataIndex: 'created_at', render: (d: any) => dayjs(d).format('DD/MM/YYYY') },
                                    { title: 'Thao tác', render: (r: any) => (
                                        <Space>
                                            {canUpdate && <Button icon={<EditOutlined/>} size="small" onClick={() => { 
                                                setCurrentDesign(r); 
                                                designForm.setFieldsValue({
                                                    ...r,
                                                    logo_ids: r.customer_logos?.map((l:any) => l.id) || [],
                                                    layout_image_url: r.layout_image_url ? [{ uid: '-1', name: 'image', status: 'done', url: r.layout_image_url }] : []
                                                }); 
                                                setIsDesignModalOpen(true); 
                                            }} />}
                                            {canDelete && <Popconfirm title="Xóa thiết kế này?" onConfirm={() => deleteDesign(r.id)}><Button danger icon={<DeleteOutlined/>} size="small" /></Popconfirm>}
                                        </Space>
                                    )}
                                ]}
                            />
                        </>
                    )
                },
                {
                    key: 'MARKER_TOOL', label: 'Công cụ Xếp Sơ đồ (Marker)', forceRender: true, children: (
                        <NestingMarkerTool />
                    )
                }
            ]} />

            {/* Modal Logo */}
            <Modal title={currentLogo ? "Sửa Logo" : "Thêm Logo"} open={isLogoModalOpen} onCancel={() => setIsLogoModalOpen(false)} onOk={() => logoForm.submit()}>
                <Form form={logoForm} layout="vertical" onFinish={saveLogo}>
                    <Form.Item name="name" label="Tên Logo" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="customer_id" label="Khách hàng">
                        <Select showSearch options={customers.map(c => ({label: c.name, value: c.id}))} optionFilterProp="label" allowClear />
                    </Form.Item>
                    <Form.Item name="dimensions" label="Kích thước (cm)">
                        <Input placeholder="VD: 10x5" />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="image_url" label="Hình ảnh Logo" valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload customRequest={handleUpload} listType="picture" maxCount={1}>
                            <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Design */}
            <Modal title={currentDesign ? "Sửa Sơ đồ" : "Thêm Sơ đồ"} open={isDesignModalOpen} onCancel={() => setIsDesignModalOpen(false)} onOk={() => designForm.submit()} width={700}>
                <Form form={designForm} layout="vertical" onFinish={saveDesign}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item name="code" label="Mã thiết kế" style={{flex: 1}} rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="name" label="Tên sơ đồ" style={{flex: 2}} rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="type" label="Loại" style={{flex: 1}} rules={[{ required: true }]}>
                            <Select options={[{label: 'In ấn', value: 'PRINT'}, {label: 'Thêu', value: 'EMBROIDERY'}]} />
                        </Form.Item>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item name="customer_id" label="Khách hàng (Tùy chọn)" style={{flex: 1}}>
                            <Select showSearch options={customers.map(c => ({label: c.name, value: c.id}))} optionFilterProp="label" allowClear />
                        </Form.Item>
                        <Form.Item name="product_id" label="Sản phẩm (Tùy chọn)" style={{flex: 1}}>
                            <Select showSearch options={products.map(p => ({label: `${p.sku} - ${p.name}`, value: p.id}))} optionFilterProp="label" allowClear />
                        </Form.Item>
                    </div>
                    
                    <Form.Item name="logo_ids" label="Chọn Logo áp dụng">
                        <Select mode="multiple" showSearch options={logos.map(l => ({label: l.name, value: l.id}))} optionFilterProp="label" />
                    </Form.Item>

                    <Form.Item name="layout_image_url" label="Sơ đồ bố cục" valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload customRequest={handleUpload} listType="picture" maxCount={1}>
                            <Button icon={<UploadOutlined />}>Tải sơ đồ lên</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default DesignManagementPage;
