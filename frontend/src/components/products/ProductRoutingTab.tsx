import React from 'react';
import { Table, Button, message, Card, Form, Select, InputNumber, Popconfirm, Row, Col, Tag, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';

interface ProductRoutingTabProps {
    editingItem: any;
    routings: any[];
    suppliers: any[];
    processes: any[];
    fetchDetailData: (id: number) => void;
    setRoutings: React.Dispatch<React.SetStateAction<any[]>>;
}

const ProductRoutingTab: React.FC<ProductRoutingTabProps> = ({ editingItem, routings, suppliers, processes, fetchDetailData, setRoutings }) => {
    const [routingForm] = Form.useForm();

    const handleSaveRouting = async (values: any) => {
        try {
            const items = [...routings, { ...values, id: Date.now() }];
            setRoutings(items);
            
            const payload = items.map(i => ({
                step_name: i.step_name,
                process_id: i.process_id,
                supplier_id: i.supplier_id,
                cost: i.cost,
                is_required: i.is_required || false,
            }));

            await axios.post(`${API_URL}/products/${editingItem.id}/routings`, payload);
            message.success('Đã lưu Quy trình');
            fetchDetailData(editingItem.id);
            routingForm.resetFields();
        } catch(e) { message.error('Lỗi lưu Quy trình'); }
    };
    
    const handleRemoveRouting = async (idToRemove: number) => {
        const updatedRoutings = routings.filter(r => r.id !== idToRemove);
        setRoutings(updatedRoutings);
        
        const payload = updatedRoutings.map(i => ({
            step_name: i.step_name,
            process_id: i.process_id,
            supplier_id: i.supplier_id,
            cost: i.cost,
            is_required: i.is_required || false,
        }));
        
        await axios.post(`${API_URL}/products/${editingItem.id}/routings`, payload);
        message.success('Đã xóa Quy trình');
        fetchDetailData(editingItem.id);
    };

    const routingColumns = [
        { title: 'Công đoạn', dataIndex: 'step_name' },
        { title: 'NCC', dataIndex: 'supplier_id', render: (id: number) => suppliers.find(s => s.id === id)?.name || '-' },
        { title: 'Bắt buộc', dataIndex: 'is_required', render: (val: boolean) => val ? <Tag color="green">Có</Tag> : <Tag color="red">Không</Tag> },
        { title: 'Chi phí', dataIndex: 'cost', width: 100, align: 'right' as const, render: (v: number) => Number(v).toLocaleString() },
        { title: '', key: 'action', width: 70, align: 'center' as const, render: (r:any) => (<Popconfirm title="Xóa?" onConfirm={() => handleRemoveRouting(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>) },
    ];

    return (
        <Row gutter={16}>
            <Col span={8}>
                <Card title="Thêm Công Đoạn" size="small">
                    <Form form={routingForm} layout="vertical" onFinish={handleSaveRouting}>
                        <Form.Item name="step_name" label="Tên Công Đoạn" rules={[{required:true}]}><Input/></Form.Item>
                        <Form.Item name="process_id" label="Loại Công Đoạn">
                            <Select options={processes} placeholder="VD: May, Ủi, Đóng gói..." />
                        </Form.Item>
                        <Form.Item name="supplier_id" label="Nhà Gia Công">
                            <Select showSearch options={suppliers.filter(s => s.type !== 'MATERIAL').map(s => ({label: s.name, value: s.id}))} placeholder="Chọn NCC/Xưởng GC"/>
                        </Form.Item>
                        <Form.Item name="cost" label="Chi phí (₫)" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} addonAfter="₫"/></Form.Item>
                        <Form.Item name="is_required" valuePropName="checked">
                            <Checkbox>Công đoạn bắt buộc (Tính vào giá vốn)</Checkbox>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block><PlusOutlined /> Thêm</Button>
                    </Form>
                </Card>
            </Col>
            <Col span={16}>
                <Table dataSource={routings} columns={routingColumns} rowKey="id" pagination={false} size="small" bordered />
            </Col>
        </Row>
    );
}

export default ProductRoutingTab;