// src/components/products/ProductVariantsTab.tsx

import React, { useState } from 'react';
import { Table, Button, message, Card, Form, Select, Input, Popconfirm, Row, Col, Space, Tooltip, Divider, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';

interface ProductVariantsTabProps {
    editingItem: any;
    data: any[]; // Toàn bộ danh sách sản phẩm (để tìm biến thể)
    fetchData: () => void;
    fetchDetailData: (id: number) => void;
}

const ProductVariantsTab: React.FC<ProductVariantsTabProps> = ({ editingItem, data, fetchData, fetchDetailData }) => {
    
    // Giả định: Các biến thể cùng loại được tìm thông qua một tiền tố SKU chung
    const baseSku = editingItem.sku?.split('_')[0] || editingItem.sku;
    
    // Lọc biến thể: Những sản phẩm có SKU bắt đầu bằng tiền tố SKU gốc và không phải là sản phẩm hiện tại
    const variants = data.filter(p => 
        p.sku !== editingItem.sku && p.sku.startsWith(baseSku)
    );
    
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

    // Xử lý Copy BOM (Cần API Backend: /products/copy-bom)
    const handleCopyBOM = async (targetSku: string, sourceSku: string) => {
        if (!sourceSku) {
            return message.error("Vui lòng chọn hoặc xác định biến thể nguồn.");
        }
        try {
            await axios.post(`${API_URL}/products/copy-bom`, {
                sourceSku: sourceSku,
                targetSku: targetSku
            });
            message.success(`Đã sao chép BOM từ ${sourceSku} sang ${targetSku}`);
            fetchDetailData(editingItem.id); 
        } catch (error) {
            message.error("Lỗi khi sao chép BOM. Kiểm tra API Backend.");
        }
    };
    
    const variantColumns = [
        { title: 'Mã Biến thể (SKU)', dataIndex: 'sku', render: (text: string) => <b>{text}</b> },
        { 
            title: 'Thuộc tính', 
            dataIndex: 'attributes', 
            render: (attr: any) => (
                <Space>
                    {attr && Object.entries(attr).map(([key, value]: [string, any]) => (
                        <Tag key={key} color="blue">{key}: {value}</Tag>
                    ))}
                </Space>
            )
        },
        { title: 'Giá bán', dataIndex: 'base_price', align: 'right' as const, render: (v: number) => Number(v).toLocaleString() },
        { 
            title: 'Hành động', 
            key: 'action', 
            width: 150, 
            render: (v: any) => (
                <Space size="small">
                    <Tooltip title={`Sao chép BOM từ ${v.sku} sang Sản phẩm đang sửa`}>
                        <Popconfirm
                            title={`Chắc chắn sao chép BOM từ ${v.sku} sang ${editingItem.sku}?`}
                            onConfirm={() => handleCopyBOM(editingItem.sku, v.sku)}
                        >
                            <Button icon={<CopyOutlined />} size="small">Copy BOM</Button>
                        </Popconfirm>
                    </Tooltip>
                    
                </Space>
            )
        },
    ];

    return (
        <Row gutter={16}>
            <Col span={24}>
                <Card title={`Biến thể cùng loại (${baseSku}...)`} size="small">
                    <Table 
                        dataSource={variants} 
                        columns={variantColumns} 
                        rowKey="id" 
                        pagination={false} 
                        size="small" 
                        bordered 
                        locale={{ emptyText: "Không tìm thấy biến thể cùng loại." }}
                    />
                </Card>
            </Col>
            
            <Col span={24}><Divider orientation="left">Sao chép BOM từ Sản phẩm bất kỳ</Divider></Col>
            <Col span={8}>
                <Card title="Chọn Nguồn BOM" size="small">
                    <Form layout="vertical">
                        <Form.Item label="Chọn Biến thể Nguồn">
                             <Select 
                                showSearch
                                placeholder="Tìm kiếm SKU hoặc Tên"
                                optionFilterProp="label"
                                options={data.map(p => ({ label: `${p.sku} - ${p.name}`, value: p.sku }))}
                                onChange={setSelectedVariant}
                            />
                        </Form.Item>
                        <Button 
                            type="primary" 
                            onClick={() => selectedVariant && handleCopyBOM(editingItem.sku, selectedVariant)} 
                            disabled={!selectedVariant || selectedVariant === editingItem.sku}
                            block
                            icon={<CopyOutlined />}
                        >
                            Copy BOM đến Sản phẩm hiện tại
                        </Button>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default ProductVariantsTab;