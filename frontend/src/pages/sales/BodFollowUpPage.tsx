import React, { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Tooltip, Progress, Drawer, Button, Form, Checkbox, message, Space, Card, Typography, Input } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../../utils/api';
import dayjs from 'dayjs';
import RichTextEditor from '../../components/RichTextEditor';
import useMobile from '../../hooks/useMobile';

const { Title } = Typography;

const VALID_STATUSES = ['DEPOSITED', 'SAMPLE_APPROVED', 'IN_PRODUCTION', 'MANUFACTURING_COMPLETED', 'PLANNED', 'PARTIAL_DELIVERY'];

type FollowUpKey = 'care' | 'design' | 'production' | 'debt' | 'photo' | 'delivery' | 'other';

export default function BodFollowUpPage() {
    const isMobile = useMobile();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<any>(null);
    const [currentColumn, setCurrentColumn] = useState<FollowUpKey | null>(null);

    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/sales');
            const arr = Array.isArray(res.data) ? res.data : [];
            const filtered = arr.filter(o => VALID_STATUSES.includes(o.status));
            setData(filtered);
        } catch (e) {
            message.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        return data.filter(x => 
            x.order_code?.toLowerCase().includes(searchText.toLowerCase()) || 
            x.customer?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            x.customer_name?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [data, searchText]);

    const handleOpenEdit = (order: any, colKey: FollowUpKey) => {
        setCurrentOrder(order);
        setCurrentColumn(colKey);
        
        const fup = order.bod_follow_up || {};
        
        switch (colKey) {
            case 'design':
                form.setFieldsValue({
                    design_note: fup.design_note || '',
                    design_checkboxes: fup.design_checkboxes || []
                });
                break;
            case 'production':
                form.setFieldsValue({
                    prod_note: fup.prod_note || '',
                    prod_checkboxes: fup.prod_checkboxes || []
                });
                break;
            case 'debt':
                form.setFieldsValue({ debt_note: fup.debt_note || '' });
                break;
            case 'care':
                form.setFieldsValue({ care_note: fup.care_note || '' });
                break;
            case 'photo':
                form.setFieldsValue({ photo_note: fup.photo_note || '' });
                break;
            case 'delivery':
                form.setFieldsValue({ delivery_note: fup.delivery_note || '' });
                break;
            case 'other':
                form.setFieldsValue({ other_note: fup.other_note || '' });
                break;
        }

        setDrawerOpen(true);
    };

    const handleSaveFollowUp = async (values: any) => {
        if (!currentOrder) return;
        try {
            const currentFup = currentOrder.bod_follow_up || {};
            const newFup = { ...currentFup, ...values };
            
            await api.put(`/sales/${currentOrder.id}/bod-follow-up`, newFup);
            message.success('Đã cập nhật tiến độ!');
            
            // local update
            const newData = [...data];
            const idx = newData.findIndex(o => o.id === currentOrder.id);
            if (idx > -1) {
                newData[idx].bod_follow_up = newFup;
                setData(newData);
            }
            
            setDrawerOpen(false);
        } catch (e) {
            message.error('Lỗi khi lưu');
        }
    };

    const renderCell = (order: any, key: FollowUpKey, title: string) => {
        const fup = order.bod_follow_up || {};
        
        let cbs: React.ReactNode = null;
        let noteStr = '';

        if (key === 'design') {
            const arr = (fup.design_checkboxes || []) as string[];
            const labels: any = { 'design': 'Design', 'approve': 'Duyệt in', 'print': 'Đặt in', 'sew': 'Đạt may' };
            if (arr.length > 0) cbs = <div style={{marginBottom:4}}>{arr.map(x => <Tag key={x} color="cyan">{labels[x] || x}</Tag>)}</div>;
            noteStr = fup.design_note || '';
        } else if (key === 'production') {
            const arr = (fup.prod_checkboxes || []) as string[];
            const labels: any = { 'fabric': 'Lấy vải', 'quilt': 'Chần gòn', 'embroider': 'Thêu', 'process': 'Gia công' };
            if (arr.length > 0) cbs = <div style={{marginBottom:4}}>{arr.map(x => <Tag key={x} color="blue">{labels[x] || x}</Tag>)}</div>;
            noteStr = fup.prod_note || '';
        } else {
            noteStr = fup[`${key}_note`] || '';
        }

        // strip html for preview
        const plainText = noteStr.replace(/<[^>]*>?/gm, '').substring(0, 50) + (noteStr.length > 50 ? '...' : '');

        return (
            <div style={{ minHeight: 40, cursor: 'pointer' }} onClick={() => handleOpenEdit(order, key)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        {cbs}
                        <div style={{ fontSize: 12, color: '#555', fontStyle: plainText ? 'normal' : 'italic' }}>
                            {plainText || 'click để thêm...'}
                        </div>
                    </div>
                    <EditOutlined style={{ color: '#d9d9d9', marginTop: 4 }} />
                </div>
            </div>
        );
    };

    const columns = [
        {
            title: 'Mã Đơn', dataIndex: 'order_code', width: 140, fixed: 'left' as const,
            render: (t: any) => <b>{t}</b>
        },
        {
            title: 'Khách Hàng', width: 180, fixed: 'left' as const,
            render: (r: any) => <span style={{ fontWeight: 500 }}>{r.customer?.name || r.customer_name || 'Khách lẻ'}</span>
        },
        {
            title: 'Ngày Đặt', dataIndex: 'order_date', width: 110,
            render: (t: any) => <span style={{ color: '#666' }}>{dayjs(t).format('DD/MM/YYYY')}</span>
        },
        {
            title: 'Ngày Giao', dataIndex: 'delivery_date', width: 110,
            render: (t: any) => t ? <span style={{ color: '#1890ff' }}>{dayjs(t).format('DD/MM/YYYY')}</span> : '-'
        },
        {
            title: 'Doanh Thu', dataIndex: 'total_amount', align: 'right' as const, width: 110,
            render: (v: any) => <b style={{ color: '#cf1322' }}>{Number(v).toLocaleString()}</b>
        },
        {
            title: 'Đã Thu', dataIndex: 'paid_amount', align: 'right' as const, width: 110,
            render: (v: any) => <span style={{ color: '#389e0d' }}>{Number(v).toLocaleString()}</span>
        },
        {
            title: 'Còn Lại', key: 'remaining', align: 'right' as const, width: 110,
            render: (r: any) => {
                const total = Number(r.total_amount) || 0;
                const paid = Number(r.paid_amount) || 0;
                const remain = total - paid;
                return <span style={{ color: remain > 0 ? '#fa541c' : '#999' }}>{remain.toLocaleString()}</span>
            }
        },
        {
            title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const, width: 120,
            render: (t: any) => {
                let color = 'default';
                let label = t;
                if (t === 'SO_PENDING') { color = 'processing'; label = 'Mới'; }
                if (t === 'SAMPLE_APPROVED') { color = 'cyan'; label = 'Đã Duyệt'; }
                if (t === 'DEPOSITED') { color = 'purple'; label = 'Đã Cọc'; }
                if (t === 'IN_PRODUCTION') { color = 'blue'; label = 'Đang SX'; }
                if (t === 'MANUFACTURING_COMPLETED') { color = 'gold'; label = 'Xong SX'; }
                if (t === 'DELIVERED') { color = 'geekblue'; label = 'Đã Giao'; }
                return <Tag color={color}>{label}</Tag>
            }
        },
        {
            title: 'Thanh Toán', dataIndex: 'payment_status', width: 100,
            render: (t: any, r: any) => {
                const total = Number(r.total_amount) || 0;
                const paid = Number(r.paid_amount) || 0;
                const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 12, color: pct >= 100 ? 'green' : '#666', fontWeight: 'bold' }}>{pct}%</span>
                    </div>
                )
            }
        },
        {
            title: 'Công Nợ', key: 'col_debt', width: 200,
            render: (r:any) => renderCell(r, 'debt', 'Công Nợ')
        },
        {
            title: 'Chăm sóc', key: 'col_care', width: 200,
            render: (r:any) => renderCell(r, 'care', 'Chăm sóc')
        },
        {
            title: 'THIẾT KẾ (Làm túi)', key: 'col_design', width: 250,
            render: (r:any) => renderCell(r, 'design', 'Thiết kế & Túi')
        },
        {
            title: 'SẢN XUẤT', key: 'col_prod', width: 250,
            render: (r:any) => renderCell(r, 'production', 'Sản xuất')
        },
        {
            title: 'Chụp mẫu', key: 'col_photo', width: 200,
            render: (r:any) => renderCell(r, 'photo', 'Chụp mẫu')
        },
        {
            title: 'Giao hàng', key: 'col_deliv', width: 200,
            render: (r:any) => renderCell(r, 'delivery', 'Giao hàng')
        },
        {
            title: 'Khác', key: 'col_other', width: 200,
            render: (r:any) => renderCell(r, 'other', 'Ghi chú Khác')
        }
    ];

    const drawerTitleMap: Record<string, string> = {
        'care': 'Cập nhật Chăm sóc khách hàng',
        'design': 'Cập nhật Tiến độ Thiết kế & Làm túi',
        'production': 'Cập nhật Tiến độ Sản xuất chính',
        'debt': 'Cập nhật Công Nợ / Kế Toán',
        'photo': 'Cập nhật Hình chụp mẫu / Media',
        'delivery': 'Cập nhật Thông tin Giao hàng',
        'other': 'Cập nhật Ghi chú chung'
    }

    return (
        <div>
            <Card bodyStyle={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>BOD Follow Up: Tiến độ Đơn hàng</Title>
                    <Input prefix={<SearchOutlined />} placeholder="Tìm mã đơn, tên khách..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} />
                </div>

                <Table 
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 2600 }}
                    size="middle"
                    bordered
                    pagination={{ pageSize: 20 }}
                />
            </Card>

            <Drawer
                title={drawerTitleMap[currentColumn || 'other']}
                width={isMobile ? '100%' : 500}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                extra={<Button type="primary" onClick={() => form.submit()}>Lưu thông tin</Button>}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSaveFollowUp}>
                    {currentColumn === 'design' && (
                        <Card size="small" style={{ marginBottom: 16, background: '#e6f7ff' }}>
                            <Form.Item name="design_checkboxes" label={<b>Checklist Các khâu</b>}>
                                <Checkbox.Group style={{ width: '100%' }}>
                                    <Space direction="vertical">
                                        <Checkbox value="design">Design mẫu in</Checkbox>
                                        <Checkbox value="approve">KH duyệt in</Checkbox>
                                        <Checkbox value="print">Đặt in</Checkbox>
                                        <Checkbox value="sew">Đạt may túi</Checkbox>
                                    </Space>
                                </Checkbox.Group>
                            </Form.Item>
                        </Card>
                    )}

                    {currentColumn === 'production' && (
                        <Card size="small" style={{ marginBottom: 16, background: '#fffbe6' }}>
                            <Form.Item name="prod_checkboxes" label={<b>Checklist Vật tư & Gia công</b>}>
                                <Checkbox.Group style={{ width: '100%' }}>
                                    <Space direction="vertical">
                                        <Checkbox value="fabric">Đặt vải</Checkbox>
                                        <Checkbox value="quilt">Đặt chần gòn</Checkbox>
                                        <Checkbox value="embroider">Đặt thêu</Checkbox>
                                        <Checkbox value="process">Đặt gia công</Checkbox>
                                    </Space>
                                </Checkbox.Group>
                            </Form.Item>
                        </Card>
                    )}

                    {/* DYNAMIC CkEditor field base on currentColumn */}
                    <Form.Item name={currentColumn === 'design' ? 'design_note' : 
                                    currentColumn === 'production' ? 'prod_note' : 
                                    `${currentColumn}_note`} 
                               label={<b>Ghi chú chi tiết</b>}>
                        <RichTextEditor />
                    </Form.Item>

                </Form>
            </Drawer>
        </div>
    );
}
