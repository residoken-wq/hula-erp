// src/components/products/ProductBOMTab.tsx

import React from 'react';
import { Table, Button, message, Card, Form, Select, InputNumber, Popconfirm, Row, Col, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config'; // FIX: Dùng ../../config

interface ProductBOMTabProps {
    editingItem: any;
    boms: any[];
    materials: any[]; // Đã được chuẩn hóa thành { value, label } trong ProductsPage
    fetchDetailData: (id: number) => void;
    setBoms: React.Dispatch<React.SetStateAction<any[]>>;
}

const ProductBOMTab: React.FC<ProductBOMTabProps> = ({ editingItem, boms, materials, fetchDetailData, setBoms }) => {
    const [bomForm] = Form.useForm();

    const handleSaveBOM = async (values: any) => {
        try {
            const items = [...boms, { ...values, id: Date.now() }]; // Thêm tạm ID giả
            setBoms(items);
            
            const payload = items.map(i => ({
                material_id: i.material_id, 
                quantity: i.quantity, 
                waste_percent: i.waste_percent 
            }));

            await axios.post(`${API_URL}/products/${editingItem.id}/boms`, payload);
            message.success('Đã lưu BOM');
            fetchDetailData(editingItem.id);
            bomForm.resetFields();
        } catch(e) { message.error('Lỗi lưu BOM'); }
    };
    
    const handleRemoveBOM = async (idToRemove: number) => {
        const updatedBoms = boms.filter(b => b.id !== idToRemove);
        setBoms(updatedBoms);

        const payload = updatedBoms.map(i => ({
            material_id: i.material_id, 
            quantity: i.quantity, 
            waste_percent: i.waste_percent 
        }));

        await axios.post(`${API_URL}/products/${editingItem.id}/boms`, payload);
        message.success('Đã xóa BOM');
        fetchDetailData(editingItem.id);
    };

    const bomColumns = [
        { 
            title: 'Mã NPL', 
            dataIndex: 'material_id', 
            render: (id: number, record: any) => {
                if (record.material?.sku) return record.material.sku;
                const materialItem = materials.find(m => m.value === id);
                return materialItem ? materialItem.label.split(' - ')[0] : '-';
            }
        },
        { 
            title: 'Tên NPL', 
            dataIndex: 'material_id', 
            render: (id: number, record: any) => {
                if (record.material?.name) return record.material.name;
                const materialItem = materials.find(m => m.value === id);
                return materialItem ? materialItem.label.split(' - ')[1] : '-';
            }
        },
        { title: 'SL', dataIndex: 'quantity', width: 70, align: 'right' as const },
        { title: 'Hao hụt (%)', dataIndex: 'waste_percent', width: 90, align: 'right' as const },
        { title: '', key: 'action', width: 70, align: 'center' as const, render: (r:any) => (<Popconfirm title="Xóa?" onConfirm={() => handleRemoveBOM(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>) },
    ];

    return (
        <Row gutter={16}>
            <Col span={8}>
                <Card title="Thêm NPL" size="small">
                    <Form form={bomForm} layout="vertical" onFinish={handleSaveBOM}>
                        <Form.Item name="material_id" label="Nguyên Vật Liệu" rules={[{required:true}]}>
                            <Select showSearch options={materials} optionFilterProp="label" placeholder="Chọn NPL..." />
                        </Form.Item>
                        <Row gutter={8}>
                            <Col span={12}><Form.Item name="quantity" label="Số lượng" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} /></Form.Item></Col>
                            <Col span={12}><Form.Item name="waste_percent" label="Hao hụt (%)"><InputNumber style={{width:'100%'}} min={0} max={100}/></Form.Item></Col>
                        </Row>
                        <Button type="primary" htmlType="submit" block><PlusOutlined /> Thêm</Button>
                    </Form>
                </Card>
            </Col>
            <Col span={16}>
                <Table dataSource={boms} columns={bomColumns} rowKey="id" pagination={false} size="small" bordered />
            </Col>
        </Row>
    );
}

export default ProductBOMTab;