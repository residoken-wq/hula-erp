import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Input } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';

interface Props {
    isMobile?: boolean;
}

const ProductDemandDashboard: React.FC<Props> = ({ isMobile }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/planning/demand/gc`);
            setData(res.data);
        } catch (e) {
            message.error('Lỗi tải dữ liệu nhu cầu Gia Công');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item => {
        if (!searchText) return true;
        const lowerSearch = searchText.toLowerCase();
        const matchProd = (item.product_sku && item.product_sku.toLowerCase().includes(lowerSearch)) || 
                          (item.product_name && item.product_name.toLowerCase().includes(lowerSearch));
        const matchCustomer = item.details && item.details.some((d: any) => d.customer_name && d.customer_name.toLowerCase().includes(lowerSearch));
        return matchProd || matchCustomer;
    });

    const totalAmountSum = filteredData.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    const columns = [
        {
            title: 'Mã SP (BTP)',
            dataIndex: 'product_sku',
            key: 'product_sku',
            render: (text: string) => <Tag color="geekblue">{text || 'N/A'}</Tag>,
        },
        {
            title: 'Tên Sản Phẩm',
            dataIndex: 'product_name',
            key: 'product_name',
        },
        {
            title: 'ĐVT',
            dataIndex: 'product_unit',
            key: 'product_unit',
        },
        {
            title: 'Tổng Cần Đặt',
            dataIndex: 'total_planned',
            key: 'total_planned',
            render: (val: number) => <b>{val?.toLocaleString()}</b>,
        },
        {
            title: (
                <div>
                    Thành Tiền<br/>
                    <span style={{ color: '#cf1322', fontSize: 12 }}>Tổng: {totalAmountSum.toLocaleString(undefined, { style: 'currency', currency: 'VND' })}</span>
                </div>
            ),
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (val: number) => <b>{val ? val.toLocaleString(undefined, { style: 'currency', currency: 'VND' }) : 0}</b>,
        },
        {
            title: 'Đã Dùng Tồn Kho',
            dataIndex: 'inventory_used',
            key: 'inventory_used',
            render: (val: number) => <Tag color="cyan">{val?.toLocaleString() || 0}</Tag>,
        },
        {
            title: 'PO Nháp',
            dataIndex: 'po_draft',
            key: 'po_draft',
            render: (val: number) => <Tag color="orange">{val?.toLocaleString() || 0}</Tag>,
        },
        {
            title: 'Còn Thiếu',
            key: 'shortage',
            render: (_: any, record: any) => {
                const shortage = (record.total_planned || 0) - (record.inventory_used || 0) - (record.po_draft || 0);
                return <Tag color={shortage > 0 ? "red" : "green"}>{shortage > 0 ? shortage.toLocaleString() : 0}</Tag>;
            }
        },
        {
            title: 'Đã Giao NGC',
            dataIndex: 'ngc_delivered',
            key: 'ngc_delivered',
            render: (val: number) => <Tag color="purple">{val?.toLocaleString() || 0}</Tag>,
        }
    ];

    const expandedRowRender = (record: any) => {
        const expandedColumns = [
            { title: 'Lệnh SX (PFO)', dataIndex: 'pfo_code', key: 'pfo_code' },
            { title: 'Đơn Hàng (SO)', dataIndex: 'sales_order_code', key: 'sales_order_code' },
            { title: 'Khách Hàng', dataIndex: 'customer_name', key: 'customer_name' },
            { title: 'Nhu Cầu', dataIndex: 'planned_quantity', key: 'planned_quantity', render: (val: number) => val?.toLocaleString() },
            { title: 'Thành Tiền', dataIndex: 'total_amount', key: 'total_amount', render: (val: number) => val ? val.toLocaleString(undefined, { style: 'currency', currency: 'VND' }) : 0 },
        ];
        return <Table columns={expandedColumns} dataSource={record.details} pagination={false} rowKey="pfo_id" size="small" />;
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Input.Search 
                    placeholder="Tìm theo SP, mã, khách hàng..." 
                    allowClear 
                    onSearch={setSearchText} 
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: isMobile ? '100%' : 300 }}
                />
                <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Làm mới</Button>
            </div>
            <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="product_id"
                loading={loading}
                expandable={{ expandedRowRender }}
                scroll={{ x: isMobile ? 800 : undefined }}
                size="middle"
            />
        </div>
    );
};

export default ProductDemandDashboard;
