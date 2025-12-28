import React, { useState, useEffect } from 'react';
import { Table, Button, message, Card, Form, Input, InputNumber, Select, Row, Col, Space, Drawer, Popconfirm, Divider, Tag, List } from 'antd';
import { PlusOutlined, DeleteOutlined, SettingOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';

interface ProductSemiFinishedTabProps {
    editingItem: any;
    materials: any[];
    fetchDetailData: (id: number) => void;
    components: any[]; // Đây là list components hiện tại (bao gồm cả Combo components)
}

const ProductSemiFinishedTab: React.FC<ProductSemiFinishedTabProps> = ({ editingItem, materials, fetchDetailData, components }) => {
    const [createForm] = Form.useForm();
    const [isDrawOpen, setIsDrawOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter chỉ lấy component là Bán Thành Phẩm (SEMI_FINISHED)
    const semiFinishedList = components.filter(c => c.child_product?.product_type === 'SEMI_FINISHED');

    // State cho việc tạo mới
    const [bomItems, setBomItems] = useState<any[]>([]);

    const handleAddBomItem = () => {
        setBomItems([...bomItems, { material_id: null, quantity: 0, waste_percent: 0 }]);
    };

    const handleRemoveBomItem = (index: number) => {
        const newItems = [...bomItems];
        newItems.splice(index, 1);
        setBomItems(newItems);
    }

    const handleBomItemChange = (index: number, field: string, value: any) => {
        const newItems = [...bomItems];
        newItems[index][field] = value;
        setBomItems(newItems);
    }

    const handleCreateSemiFinished = async (values: any) => {
        setLoading(true);
        try {
            // 1. Tạo Product ảo (SEMI_FINISHED)
            const phantomSku = `${editingItem.sku}_${values.name_suffix.toUpperCase().replace(/\s+/g, '_')}`;
            const phantomName = `${editingItem.name} - ${values.name_suffix}`;

            const productPayload = {
                sku: phantomSku,
                name: phantomName,
                unit: values.unit,
                product_type: 'SEMI_FINISHED',
                is_active: true,
                base_price: 0,
                cost_price: 0 // Sẽ tự tính
            };

            // Check if exist (đơn giản hoá, nếu trùng SKU API sẽ lỗi hoặc trả về existing)
            // Ở đây assume tạo mới hoàn toàn
            const resProd = await axios.post(`${API_URL}/products`, productPayload);
            const newProduct = resProd.data;

            // 2. Tạo BOM cho Product ảo này
            const bomPayload = bomItems.map(item => ({
                material_id: item.material_id,
                quantity: item.quantity,
                waste_percent: item.waste_percent
            }));
            await axios.post(`${API_URL}/products/${newProduct.id}/boms`, bomPayload);

            // 3. Link Product ảo vào Product cha (editingItem)
            // Component payload: [{ sku: childSku, quantity: 1 }]
            const componentPayload = [
                { sku: phantomSku, quantity: values.quantity_usage || 1 }
            ];

            // Backend endpoint thêm components (Cần check xem endpoint này có append hay replace. 
            // Thường là replace nếu gửi mảng. Nhưng endpoint `POST /products/:id/components` hiện tại implementation thường là Bulk Create/Update.
            // Để an toàn, nên fetch list cũ rồi append. Nhưng `components` prop đã có list cũ.
            // Tuy nhiên endpoint `/components` thường thiết kế để nhận list full.
            // Hãy check lại implementation cũ ở CombosPage. Nó gửi list items từ Form.
            // Ở đây ta muốn APPEND.
            // Gọi endpoint create riêng lẻ nếu có hoặc gửi full list.
            // Giải pháp an toàn: Gửi request thêm 1 component. Nếu BE chưa có endpoint add single -> Phải gửi full list.

            // Tạm thời gửi full list including existing + new
            const currentComponents = components.map(c => ({
                sku: c.child_product.sku,
                quantity: c.quantity
            }));
            const finalComponents = [...currentComponents, ...componentPayload];

            await axios.post(`${API_URL}/products/${editingItem.id}/components`, finalComponents);

            // 4. Tính lại giá vốn cho BTP vừa tạo
            await axios.get(`${API_URL}/products/calculate-cost/${encodeURIComponent(phantomSku)}`);

            message.success('Đã tạo Bán thành phẩm thành công');
            setIsDrawOpen(false);
            createForm.resetFields();
            setBomItems([]);
            fetchDetailData(editingItem.id);

        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi tạo Bán thành phẩm');
        }
        setLoading(false);
    };

    const handleDeleteLink = async (childSku: string) => {
        try {
            // Remove from components list
            const newComponents = components
                .filter(c => c.child_product.sku !== childSku)
                .map(c => ({ sku: c.child_product.sku, quantity: c.quantity }));

            await axios.post(`${API_URL}/products/${editingItem.id}/components`, newComponents);
            message.success('Đã gỡ bỏ liên kết');
            fetchDetailData(editingItem.id);
        } catch (e) { message.error('Lỗi xóa'); }
    }

    const columns = [
        { title: 'Tên Bán Thành Phẩm', dataIndex: 'child_product', render: (p: any) => <b>{p.name}</b> },
        { title: 'ĐVT', dataIndex: 'child_product', width: 80, render: (p: any) => p.unit },
        { title: 'Định mức (trong SP chính)', dataIndex: 'quantity', width: 150, align: 'center' as const, render: (v: number) => v },
        {
            title: 'Giá vốn',
            dataIndex: 'child_product',
            align: 'right' as const,
            width: 150,
            render: (p: any) => <span style={{ color: 'red' }}>{Number(p.cost_price).toLocaleString()} ₫</span>
        },
        {
            title: 'Thành tiền',
            key: 'total',
            align: 'right' as const,
            width: 150,
            render: (_: any, r: any) => <b>{(Number(r.child_product?.cost_price || 0) * r.quantity).toLocaleString()} ₫</b>
        },
        {
            title: '', key: 'act', width: 100, align: 'center' as const,
            render: (_: any, r: any) => (
                <Popconfirm title="Gỡ bỏ BTP này?" onConfirm={() => handleDeleteLink(r.child_product.sku)}>
                    <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
            )
        }
    ];

    // Expanded Row render BOM of Semi-Finished
    const expandedRowRender = (record: any) => {
        // Cần fetch BOM của BTP này.
        // Tuy nhiên ở danh sách `components` hiện tại API endpoint `/products/combo/:sku` trả về `ProductComponent`
        // có `child_product` là object Product.
        // Product này có thể chưa load relation `boms`.
        // Nếu chưa load, ta cần component con tự fetch hoặc hiển thị "Click xem chi tiết".
        // Để đơn giản, hiển thị nút "Xem BOM" hoặc fetch lazy.
        return <SemiFinishedBOMViewer productId={record.child_product.id} />;
    };

    return (
        <div style={{ padding: 10 }}>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsDrawOpen(true)}>Tạo Bán Thành Phẩm Mới</Button>
            </div>

            <Table
                dataSource={semiFinishedList}
                columns={columns}
                rowKey="id"
                expandable={{ expandedRowRender, rowExpandable: () => true }}
                pagination={false}
                bordered
            />

            <Drawer
                title="Tạo Bán Thành Phẩm (BTP)"
                width={720}
                open={isDrawOpen}
                onClose={() => setIsDrawOpen(false)}
                maskClosable={false}
                extra={
                    <Space>
                        <Button onClick={() => setIsDrawOpen(false)}>Hủy</Button>
                        <Button type="primary" onClick={() => createForm.submit()} loading={loading}>Lưu & Liên Kết</Button>
                    </Space>
                }
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreateSemiFinished}>
                    <Card title="1. Thông tin BTP" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="name_suffix" label="Tên BTP (Hậu tố)" rules={[{ required: true }]} tooltip="Ví dụ: 'Mặt trước chần', 'Lót túi'">
                                    <Input addonBefore={editingItem.name + " - "} placeholder="VD: Mặt trước" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="unit" label="ĐVT" rules={[{ required: true }]} initialValues={{ unit: editingItem.unit }}>
                                    <Input placeholder="Cái/Bộ" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="quantity_usage" label="Định mức sử dụng" rules={[{ required: true }]} initialValue={1} tooltip="Số lượng BTP này dùng cho 1 SP chính">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="2. Cấu thành Nguyên Liệu (BOM)" size="small" extra={<Button size="small" icon={<PlusOutlined />} onClick={handleAddBomItem}>Thêm NL</Button>}>
                        {bomItems.map((item, index) => (
                            <Row key={index} gutter={8} style={{ marginBottom: 10, alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: 5 }}>
                                <Col span={10}>
                                    <Select
                                        showSearch
                                        options={materials}
                                        placeholder="Chọn Nguyên liệu"
                                        style={{ width: '100%' }}
                                        value={item.material_id}
                                        onChange={(v) => handleBomItemChange(index, 'material_id', v)}
                                        optionFilterProp="label"
                                    />
                                </Col>
                                <Col span={6}>
                                    <InputNumber
                                        placeholder="Số lượng"
                                        style={{ width: '100%' }}
                                        value={item.quantity}
                                        onChange={(v) => handleBomItemChange(index, 'quantity', v)}
                                        addonAfter="Định mức"
                                    />
                                </Col>
                                <Col span={6}>
                                    <InputNumber
                                        placeholder="Hao hụt %"
                                        style={{ width: '100%' }}
                                        value={item.waste_percent}
                                        onChange={(v) => handleBomItemChange(index, 'waste_percent', v)}
                                        addonBefore="Hao hụt"
                                        addonAfter="%"
                                    />
                                </Col>
                                <Col span={2}>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveBomItem(index)} />
                                </Col>
                            </Row>
                        ))}
                        {bomItems.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '10px 0' }}>Chưa có nguyên liệu nào. Nhấn "Thêm NL" để định nghĩa BOM.</div>}
                    </Card>
                </Form>
            </Drawer>
        </div>
    );
};

// Sub-component to fetch BOM on expand
const SemiFinishedBOMViewer = ({ productId }: { productId: number }) => {
    const [boms, setBoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Chúng ta cần endpoint get BOM by ID hoặc SKU
                // Hiện tại ProductsPage dùng: GET /products/:sku/boms
                // Cần lấy SKU của productId này.
                // Nhưng ta có thể dùng endpoint detail: GET /products/:id -> lấy SKU -> get BOMs
                // Hoặc endpoint detail product trả về relations=['boms'] ?

                // Cách 1: Get Detail -> Get BOMs
                const resProd = await axios.get(`${API_URL}/products/${productId}`);
                const sku = resProd.data.sku;
                const resBom = await axios.get(`${API_URL}/products/${encodeURIComponent(sku)}/boms`);
                setBoms(resBom.data);
            } catch (e) { }
            setLoading(false);
        }
        if (productId) load();
    }, [productId]);

    if (loading) return <div>Đang tải BOM...</div>;

    return (
        <div style={{ margin: '0 20px', background: '#fafafa', padding: 10, borderRadius: 4 }}>
            <h4>Cấu trúc BOM:</h4>
            <List
                size="small"
                dataSource={boms}
                renderItem={(item: any) => (
                    <List.Item>
                        <Space>
                            <Tag color="cyan">{item.material?.code}</Tag>
                            <span>{item.material?.name}</span>
                            <b>x {Number(item.quantity).toLocaleString()}</b>
                            <span style={{ color: '#888' }}>(Hao hụt: {item.waste_percent}%)</span>
                        </Space>
                    </List.Item>
                )}
            />
        </div>
    )
}

export default ProductSemiFinishedTab;
