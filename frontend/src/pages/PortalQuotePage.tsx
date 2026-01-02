import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spin, Result, Button, message, Modal, Steps, Typography, List, Input, Avatar, Row, Col, Card, Descriptions, Divider, Table, Space, Tag, Empty } from 'antd';
import { LinkOutlined, CheckCircleOutlined, SolutionOutlined, FileDoneOutlined, CarOutlined, DollarOutlined, UserOutlined, SendOutlined, ShopOutlined, PrinterOutlined, InfoCircleOutlined, CreditCardOutlined, EyeOutlined, AppstoreAddOutlined, FilePdfOutlined } from '@ant-design/icons';
import { API_URL } from '../config';
import dayjs from 'dayjs';
import useMobile from '../hooks/useMobile'; // <--- Import Hook

const { Title, Text } = Typography;

const PortalQuotePage: React.FC = () => {
    const { uuid } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const isMobile = useMobile(); // <--- Detect Mobile

    const handlePreview = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setPreviewVisible(true);
    };

    const fetchQuote = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/portal/${uuid}`);
            setData(res.data);
        } catch (e) { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchQuote(); }, [uuid]);

    const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
        Modal.confirm({
            title: action === 'ACCEPT' ? 'Xác nhận Báo giá?' : 'Từ chối?',
            content: action === 'ACCEPT' ? 'Bạn đồng ý với các điều khoản và giá của báo giá này?' : 'Bạn muốn từ chối báo giá này?',
            okText: action === 'ACCEPT' ? 'Đồng Ý' : 'Từ Chối',
            cancelText: 'Hủy',
            okType: action === 'ACCEPT' ? 'primary' : 'danger',
            onOk: async () => {
                await axios.post(`${API_URL}/sales/portal/${uuid}/action`, { action });
                message.success('Thành công!'); window.location.reload();
            }
        });
    };

    const handleSendComment = async () => {
        if (!commentText) return;
        try {
            await axios.post(`${API_URL}/sales/${data.id}/comment`, { content: commentText, sender: 'CUSTOMER', name: data.customer_name || 'Khách hàng' });
            setCommentText(''); fetchQuote(); message.success('Đã gửi tin nhắn');
        } catch (e) { }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;
    if (!data) return <Result status="404" title="404" subTitle="Không tìm thấy báo giá hoặc đường dẫn không hợp lệ." />;

    const statusList = ['QUOTATION', 'DEPOSITED', 'SAMPLE_APPROVED', 'IN_PRODUCTION', 'DELIVERED', 'COMPLETED'];
    let currentStep = statusList.indexOf(data.status);

    // Map status to steps
    if (data.status === 'SO_PENDING') currentStep = 0; // Still Quotation/Pending
    if (data.status === 'PLANNED') currentStep = 3; // Planned -> Production
    if (data.status === 'PARTIAL_DELIVERY') currentStep = 4; // Partial -> Delivery
    if (data.status === 'COMPLETED') currentStep = 5;

    const visibleComments = (data.comments || []).filter((c: any) => c.sender_type === 'CUSTOMER' || c.is_visible);

    // --- CẤU HÌNH CỘT BẢNG MỚI: CỘT SẢN PHẨM RỘNG HƠN ---
    const columns = [
        {
            title: '#',
            key: 'index',
            width: 40,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => <span style={{ color: '#999' }}>{index + 1}</span>
        },
        {
            title: 'Hình',
            key: 'image',
            width: 60,
            align: 'center' as const,
            render: (_: any, r: any) => {
                const rawUrl = r.sample_image || r.product?.image_url;
                if (!rawUrl) return <div style={{ color: '#ccc', fontSize: 10, textAlign: 'center' }}>No Img</div>;

                let finalSrc = rawUrl;
                let isImage = false;

                // 1. Handle Google Drive
                if (rawUrl.includes('drive.google.com') && rawUrl.includes('/d/')) {
                    const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        finalSrc = `https://lh3.googleusercontent.com/d/${match[1]}`;
                        isImage = true;
                    }
                }
                // 2. Handle Google User Content (already direct)
                else if (rawUrl.includes('googleusercontent.com')) {
                    isImage = true;
                }
                // 3. Handle Normal Images
                else {
                    if (!rawUrl.startsWith('http') && !rawUrl.startsWith('data:')) finalSrc = `${API_URL}${rawUrl}`;
                    isImage = !!(rawUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(?:\?.*)?$/i) || rawUrl.startsWith('data:image'));
                }

                // Force isImage true if we detected Drive link
                if (rawUrl.includes('drive.google.com')) isImage = true;

                return (
                    <div style={{ textAlign: 'center' }}>
                        {isImage ? (
                            <img
                                src={finalSrc}
                                alt="product"
                                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #eee' }}
                                onClick={() => handlePreview(finalSrc)}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).onerror = null;
                                }}
                            />
                        ) : (
                            <a href={finalSrc} target="_blank" rel="noopener noreferrer">
                                <LinkOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                            </a>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Sản Phẩm',
            key: 'product_details',
            width: 80,
            render: (_: any, r: any) => {
                const imgUrl = r.sample_image || r.product?.image_url;
                const isImage = imgUrl && (imgUrl.match(/\.(jpeg|jpg|gif|png)$/i) || imgUrl.includes('drive.google.com') || imgUrl.includes('googleusercontent.com'));

                // Helper to convert Google Drive link to Direct Link
                const getDirectLink = (url: string) => {
                    if (!url) return '';
                    if (url.includes('drive.google.com') && url.includes('/d/')) {
                        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) {
                            return `https://lh3.googleusercontent.com/d/${match[1]}`;
                        }
                    }
                    return url;
                };

                const finalSrc = getDirectLink(imgUrl!);

                const customerDesc = r.product?.customer_description;
                return (
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1f1f1f', lineHeight: 1.2, marginBottom: 4 }}>
                            {r.product?.customer_description || r.product_name_real || r.product?.name || r.sku}
                        </div>
                        {/* 
                        {customerDesc && (
                            <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 4, whiteSpace: 'pre-wrap', background: '#fafafa', padding: 5, borderRadius: 4, border: '1px dashed #e8e8e8' }}>
                                {customerDesc}
                            </div>
                        )} 
                        */}
                        <div>
                            <Tag style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>{r.sku}</Tag>
                            {r.variant_color && <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px', marginLeft: 4 }}>{r.variant_color}</Tag>}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Mô Tả Sản Phẩm (VAT)',
            dataIndex: 'vat_content',
            key: 'vat_content',
            width: 300,
            render: (text: string) => {
                return (
                    <div style={{
                        fontSize: 13,
                        color: '#555',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                        minWidth: 200
                    }}>
                        {text || '-'}
                    </div>
                );
            }
        },
        {
            title: 'ĐVT',
            dataIndex: 'unit',
            width: 50,
            align: 'center' as const,
            render: () => <span style={{ color: '#666' }}>Cái</span>
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            width: 50,
            align: 'center' as const,
            render: (v: any) => <b style={{ fontSize: 14 }}>{Number(v)}</b>
        },
        {
            title: 'Đơn Giá',
            dataIndex: 'unit_price',
            width: 100,
            align: 'right' as const,
            render: (v: any) => <span style={{ color: '#555' }}>{Number(v).toLocaleString()}</span>
        },
        {
            title: 'Thành Tiền',
            dataIndex: 'subtotal',
            width: 110,
            align: 'right' as const,
            render: (v: any) => <b style={{ fontSize: 14, color: '#1f1f1f' }}>{Number(v).toLocaleString()}</b>
        }
    ];

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh', paddingBottom: 60, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
            {/* --- HEADER --- */}
            <div style={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '15px 20px' }}>
                    <Row justify="space-between" align="middle" gutter={[16, 16]}>
                        <Col>
                            <Space size={15} align="center">
                                {/* Place Logo Here if needed */}
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1890ff', textTransform: 'uppercase', letterSpacing: 1 }}>HULA ERP</div>
                                    <div style={{ fontSize: 12, color: '#999' }}>Cổng thông tin khách hàng</div>
                                </div>
                                <Divider type="vertical" style={{ height: 30 }} />
                                <div>
                                    <div style={{ fontSize: 12, color: '#888' }}>Mã đơn hàng</div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>#{data.order_code}</div>
                                </div>
                            </Space>
                        </Col>
                        <Col>
                            <Space>
                                <Button icon={<LinkOutlined />} onClick={() => { navigator.clipboard.writeText(window.location.href); message.success('Đã copy link!'); }}>Copy Link</Button>
                                <Button icon={<PrinterOutlined />} onClick={() => window.print()}>In Trang Này</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                {!isMobile && data.status === 'QUOTATION' && (
                    <div style={{ borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <InfoCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                                <span style={{ fontSize: 14 }}>Vui lòng kiểm tra kỹ thông tin và phản hồi báo giá này.</span>
                            </div>
                            <Space>
                                <Button danger size="large" onClick={() => handleAction('REJECT')}>Từ Chối</Button>
                                <Button type="primary" size="large" style={{ background: '#52c41a', borderColor: '#52c41a', boxShadow: '0 4px 10px rgba(82, 196, 26, 0.3)' }} onClick={() => handleAction('ACCEPT')}>Xác Nhận Đồng Ý</Button>
                            </Space>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MOBILE FIXED BOTTOM ACTIONS --- */}
            {isMobile && data.status === 'QUOTATION' && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: '#fff', padding: '12px 16px',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 9999,
                    display: 'flex', gap: 10
                }}>
                    <Button danger size="large" block onClick={() => handleAction('REJECT')}>Từ Chối</Button>
                    <Button type="primary" size="large" block style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleAction('ACCEPT')}>Đồng Ý</Button>
                </div>
            )}

            {/* --- MAIN CONTENT --- */}
            <div style={{ maxWidth: 1200, margin: isMobile ? '16px auto' : '30px auto', padding: isMobile ? '0 12px' : '0 20px' }}>

                {/* STATUS BAR */}
                <Card bordered={false} style={{ marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                    <Steps
                        current={currentStep}
                        size={isMobile ? "small" : "small"}
                        direction={isMobile ? "vertical" : "horizontal"} // <--- Vertical on Mobile
                        items={[
                            { title: 'Báo Giá', icon: <SolutionOutlined /> },
                            { title: 'Xác Nhận & Cọc', icon: <DollarOutlined /> },
                            { title: 'Duyệt Mẫu', icon: <FileDoneOutlined /> },
                            { title: 'Sản Xuất', icon: <AppstoreAddOutlined /> },
                            { title: 'Giao Hàng', icon: <CarOutlined /> },
                            { title: 'Hoàn Tất', icon: <CheckCircleOutlined /> }
                        ]}
                    />
                </Card>

                {/* --- INFO ROW: CUSTOMER / VAT / PAYMENT --- */}
                <Row gutter={24} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={8}>
                        <Card title={<span><UserOutlined /> Thông Tin Khách Hàng</span>} bordered={false} style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                            <Descriptions column={1} size="small" labelStyle={{ color: '#888' }} contentStyle={{ fontWeight: 500 }}>
                                <Descriptions.Item label="Đơn vị">{data.customer_name || data.customer?.name || 'Khách lẻ'}</Descriptions.Item>
                                <Descriptions.Item label="Người nhận">{data.receiver_name || data.customer?.contacts?.[0]?.full_name || data.customer?.name || '-'}</Descriptions.Item>
                                <Descriptions.Item label="SĐT">{data.receiver_phone || data.customer?.contacts?.[0]?.phone || data.customer?.phone || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ">{data.shipping_address || data.customer?.address || '-'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card title={<span><ShopOutlined /> Thông Tin Xuất Hóa Đơn</span>} bordered={false} style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                            <Descriptions column={1} size="small" labelStyle={{ color: '#888' }} contentStyle={{ fontWeight: 500 }}>
                                <Descriptions.Item label="Công ty">{data.vat_company_name || data.customer?.legal_name || data.customer?.name || '-'}</Descriptions.Item>
                                <Descriptions.Item label="MST">{data.vat_tax_code || data.customer?.tax_code || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ">{data.vat_address || data.customer?.legal_address || data.customer?.address || '-'}</Descriptions.Item>
                                {(data.vat_email || data.customer?.einvoice_email) && <Descriptions.Item label="Email nhận HĐ">{data.vat_email || data.customer.einvoice_email}</Descriptions.Item>}
                                {data.vat_invoice_link && (
                                    <Descriptions.Item label="Hóa đơn">
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={<FilePdfOutlined />}
                                            onClick={() => window.open(data.vat_invoice_link, '_blank')}
                                            style={{ padding: 0 }}
                                        >
                                            Xem/Tải Hóa Đơn
                                        </Button>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card title={<span><CreditCardOutlined /> Thông Tin Thanh Toán</span>} bordered={false} style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                            {Number(data.paid_amount) > 0 && (
                                <div style={{ background: '#f0f5ff', padding: 8, borderRadius: 8, border: '1px solid #adc6ff', textAlign: 'center', marginBottom: 8 }}>
                                    <div style={{ color: '#2f54eb', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Đã thanh toán</div>
                                    <div style={{ fontSize: 18, fontWeight: '700', color: '#1d39c4' }}>{Number(data.paid_amount).toLocaleString()} ₫</div>
                                </div>
                            )}

                            <div style={{ background: '#f6ffed', padding: 10, borderRadius: 8, border: '1px solid #b7eb8f', textAlign: 'center', marginBottom: 10 }}>
                                <div style={{ color: '#52c41a', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Cần thanh toán</div>
                                <div style={{ fontSize: 20, fontWeight: '800', color: '#389e0d' }}>{(Number(data.total_amount) - Number(data.paid_amount)).toLocaleString()} ₫</div>
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                                <div><b>ACB - TP.HCM</b></div>
                                <div>STK: <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '0 4px' }}>141847859</span></div>
                                <div>Chủ TK: CTY TNHH TM DV TƯỜNG LINH</div>
                                <div>Nội dung: <b>{data.order_code}</b></div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* --- DETAILS ROW: TABLE --- */}
                <Row gutter={24}>
                    <Col span={24}>
                        <Card title={<span style={{ fontWeight: 700, fontSize: 16 }}>📋 Chi Tiết Đơn Hàng</span>} bordered={false} style={{ marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                            {data.note && (
                                <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: '#fff7e6', padding: 15, borderRadius: 8, border: '1px solid #ffec3d' }}>
                                    <InfoCircleOutlined style={{ color: '#faad14', marginTop: 4 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#d48806', marginBottom: 5 }}>Ghi chú từ người bán:</div>
                                        <div style={{ color: '#595959', whiteSpace: 'pre-line' }}>{data.note}</div>
                                    </div>
                                </div>
                            )}

                            {isMobile ? (
                                // MOBILE LIST VIEW
                                <List
                                    dataSource={data.items}
                                    rowKey="id"
                                    renderItem={(item: any, index: number) => {
                                        // Re-use logic for image
                                        const rawUrl = item.sample_image || item.product?.image_url;
                                        let finalSrc = rawUrl;
                                        let isImage = false;
                                        if (rawUrl && rawUrl.includes('drive.google.com') && rawUrl.includes('/d/')) {
                                            const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                            if (match && match[1]) { finalSrc = `https://lh3.googleusercontent.com/d/${match[1]}`; isImage = true; }
                                        } else if (rawUrl && rawUrl.includes('googleusercontent.com')) { isImage = true; }
                                        else if (rawUrl && (rawUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)(?:\?.*)?$/i) || rawUrl.startsWith('data:image'))) {
                                            if (!rawUrl.startsWith('http') && !rawUrl.startsWith('data:')) finalSrc = `${API_URL}${rawUrl}`;
                                            isImage = true;
                                        }

                                        return (
                                            <Card
                                                size="small"
                                                style={{ marginBottom: 12, borderRadius: 8, border: '1px solid #f0f0f0' }}
                                                bodyStyle={{ padding: 12 }}
                                            >
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    {/* Image */}
                                                    <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
                                                        {isImage ? (
                                                            <img
                                                                src={finalSrc} alt="prod"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                onClick={() => handlePreview(finalSrc)}
                                                            />
                                                        ) : <div style={{ width: '100%', height: '100%', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><ShopOutlined /></div>}
                                                    </div>

                                                    {/* Content */}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>
                                                            {item.product?.customer_description || item.product_name_real || item.product?.name}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{item.sku} {item.variant_color && `• ${item.variant_color}`}</div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontSize: 12 }}>
                                                                <b>{Number(item.quantity)}</b> x {Number(item.unit_price).toLocaleString()}
                                                            </div>
                                                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                                                                {Number(item.subtotal).toLocaleString()}₫
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.vat_content && (
                                                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #f0f0f0', fontSize: 11, color: '#888' }}>
                                                        {item.vat_content}
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    }}
                                />
                            ) : (
                                // DESKTOP TABLE VIEW
                                <Table
                                    dataSource={data.items}
                                    columns={columns}
                                    rowKey="id"
                                    pagination={false}
                                    bordered={false}
                                    scroll={{ x: '100%' }}
                                    className="quote-table"
                                    summary={() => {
                                        // Summary handled below for both views actually, but Antd Table Summary is properly placed inside Table.
                                        // For mobile, we might need a separate summary block or use specific mobile summary logic. 
                                        // Let's keep the Desktop summary here and add a visual summary for mobile below the list.
                                        const vatRate = data.vat_rate || 0;
                                        const subTotal = data.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
                                        const discountAmount = Number(data.discount_amount || 0);
                                        const taxable = Math.max(0, subTotal - discountAmount);
                                        const vatAmount = taxable * (vatRate / 100);
                                        const total = taxable + vatAmount + Number(data.shipping_fee || 0);

                                        return (
                                            <Table.Summary fixed>
                                                <Table.Summary.Row>
                                                    <Table.Summary.Cell index={0} colSpan={5} align="right"><span style={{ color: '#888' }}>Tổng tiền hàng</span></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><b>{subTotal.toLocaleString()}</b></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                                {discountAmount > 0 && (
                                                    <Table.Summary.Row>
                                                        <Table.Summary.Cell index={0} colSpan={5} align="right"><span style={{ color: '#888' }}>Giảm giá ({data.discount_rate}%)</span></Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} align="right"><span style={{ color: '#52c41a' }}>-{discountAmount.toLocaleString()}</span></Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                )}
                                                <Table.Summary.Row>
                                                    <Table.Summary.Cell index={0} colSpan={5} align="right"><span style={{ color: '#888' }}>Thuế VAT ({vatRate}%)</span></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right">{vatAmount.toLocaleString()}</Table.Summary.Cell>
                                                </Table.Summary.Row>
                                                <Table.Summary.Row>
                                                    <Table.Summary.Cell index={0} colSpan={5} align="right"><span style={{ color: '#888' }}>Phí vận chuyển</span></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right">{Number(data.shipping_fee || 0).toLocaleString()}</Table.Summary.Cell>
                                                </Table.Summary.Row>
                                                <Table.Summary.Row style={{ background: '#fafafa' }}>
                                                    <Table.Summary.Cell index={0} colSpan={5} align="right"><b style={{ fontSize: 18, color: '#1890ff' }}>TỔNG CỘNG</b></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><b style={{ fontSize: 20, color: '#cf1322' }}>{total.toLocaleString()} ₫</b></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            </Table.Summary>
                                        );
                                    }}
                                />
                            )}

                            {/* MOBILE SUMMARY BLOCK (Since Table Summary won't show in List) */}
                            {isMobile && (
                                <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginTop: 12 }}>
                                    {[
                                        { label: 'Tổng tiền hàng', value: data.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0).toLocaleString() },
                                        { log: data.discount_amount > 0, label: `Giảm giá (${data.discount_rate}%)`, value: `-${Number(data.discount_amount).toLocaleString()}`, color: 'green' },
                                        { label: `Thuế VAT (${data.vat_rate || 0}%)`, value: ((Math.max(0, data.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) - Number(data.discount_amount || 0))) * ((data.vat_rate || 0) / 100)).toLocaleString() },
                                        { label: 'Phí vận chuyển', value: Number(data.shipping_fee || 0).toLocaleString() }
                                    ].map((row, idx) => {
                                        if (row.log === false) return null;
                                        return (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                <span style={{ color: '#888' }}>{row.label}</span>
                                                <span style={{ fontWeight: 600, color: row.color || '#333' }}>{row.value}</span>
                                            </div>
                                        )
                                    })}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 15 }}>TỔNG CỘNG</span>
                                        <span style={{ fontWeight: 700, fontSize: 18, color: '#ff4d4f' }}>
                                            {(
                                                (Math.max(0, data.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) - Number(data.discount_amount || 0))) * (1 + (data.vat_rate || 0) / 100) + Number(data.shipping_fee || 0)
                                            ).toLocaleString()} ₫
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {data.terms_content && (
                                <div style={{ marginTop: 30, background: '#f9f9f9', padding: '20px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                                    <div style={{ fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', fontSize: 12, color: '#999' }}>Điều khoản & Quy định</div>
                                    <div style={{ whiteSpace: 'pre-line', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{data.terms_content}</div>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* --- BOTTOM ROW: COMMENTS & HISTORY --- */}
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <Card title="💬 Thảo Luận" bordered={false} bodyStyle={{ padding: 0 }} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12, overflow: 'hidden', height: '100%' }}>
                            <div style={{ height: 300, overflowY: 'auto', padding: 20, background: '#f9f9f9' }}>
                                <List dataSource={visibleComments} renderItem={(item: any) => (
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexDirection: item.sender_type === 'CUSTOMER' ? 'row-reverse' : 'row' }}>
                                        <Avatar style={{ backgroundColor: item.sender_type === 'CUSTOMER' ? '#87d068' : '#1890ff' }} icon={item.sender_type === 'CUSTOMER' ? <UserOutlined /> : <SolutionOutlined />} />
                                        <div style={{ maxWidth: '80%' }}>
                                            <div style={{ fontSize: 11, color: '#999', marginBottom: 2, textAlign: item.sender_type === 'CUSTOMER' ? 'right' : 'left' }}>
                                                {item.sender_name} • {dayjs(item.created_at).format('HH:mm DD/MM')}
                                            </div>
                                            <div style={{
                                                padding: '8px 12px',
                                                background: item.sender_type === 'CUSTOMER' ? '#d9f7be' : '#fff',
                                                borderRadius: 8,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                color: '#333'
                                            }}>
                                                {item.content}
                                            </div>
                                        </div>
                                    </div>
                                )} />
                                {visibleComments.length === 0 && <Empty description="Chưa có tin nhắn nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                            </div>
                            <div style={{ padding: 15, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <Input.TextArea
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        value={commentText}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        onPressEnter={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                            if (!e.shiftKey) {
                                                e.preventDefault();
                                                handleSendComment();
                                            }
                                        }}
                                    />
                                    <Button type="primary" icon={<SendOutlined />} onClick={handleSendComment} />
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        {/* --- DELIVERY HISTORY --- */}
                        {data.deliveries && data.deliveries.length > 0 && (
                            <Card title={<span><CarOutlined /> Lịch Sử Giao Hàng</span>} size="small" style={{ marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                                {isMobile ? (
                                    <List dataSource={data.deliveries} renderItem={(r: any) => (
                                        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontWeight: 700, color: '#1890ff' }}>{r.code}</span>
                                                <span style={{ fontSize: 12, color: '#999' }}>{dayjs(r.delivery_date).format('DD/MM/YY')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Tag color={r.status === 'SHIPPED' ? 'green' : 'orange'}>{r.status === 'SHIPPED' ? 'Đã Giao' : 'Đang Giao'}</Tag>
                                            </div>
                                            <div style={{ background: '#fafafa', padding: 8, borderRadius: 4, fontSize: 12 }}>
                                                {r.items?.map((item: any, idx: number) => {
                                                    const p = data.items.find((x: any) => x.sku === item.sku);
                                                    const name = p ? (p.product_name_real || p.product?.name) : item.sku;
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>{name}</span>
                                                            <b>x{item.quantity}</b>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )} />
                                ) : (
                                    <Table
                                        dataSource={data.deliveries}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            { title: 'Ngày', width: 90, align: 'center', render: (r: any) => dayjs(r.delivery_date).format('DD/MM/YY') },
                                            { title: 'Mã Phiếu', width: 100, dataIndex: 'code', render: (t: string) => <div style={{ fontWeight: 700, color: '#1890ff' }}>{t}</div> },
                                            {
                                                title: 'Trạng thái', width: 90, align: 'center',
                                                render: (r: any) => (
                                                    <Tag color={r.status === 'SHIPPED' ? 'green' : 'orange'}>
                                                        {r.status === 'SHIPPED' ? 'Đã Giao' : 'Đang Giao'}
                                                    </Tag>
                                                )
                                            },
                                            {
                                                title: 'Chi tiết sản phẩm',
                                                render: (r: any) => (
                                                    <div style={{ fontSize: 12 }}>
                                                        {r.items?.map((item: any, idx: number) => {
                                                            const p = data.items.find((x: any) => x.sku === item.sku);
                                                            const name = p ? (p.product_name_real || p.product?.name) : item.sku;
                                                            return (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f0f0f0', padding: '3px 0' }}>
                                                                    <span style={{ color: '#444', marginRight: 5 }}>{name}</span>
                                                                    <b>x{item.quantity}</b>
                                                                </div>
                                                            );
                                                        })}
                                                        {r.note && <div style={{ color: '#999', fontStyle: 'italic', marginTop: 4 }}>Example: {r.note}</div>}
                                                    </div>
                                                )
                                            },
                                        ]}
                                    />
                                )}
                            </Card>
                        )}

                        {/* --- PAYMENT HISTORY & QR --- */}
                        <Card title={<span><DollarOutlined /> Thanh Toán & Lịch Sử</span>} size="small" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                            <div style={{ textAlign: 'center', marginBottom: 20, padding: 10, background: '#fcfcfc', borderRadius: 8 }}>
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Quét mã để thanh toán</div>
                                <img src={`https://img.vietqr.io/image/ACB-141847859-compact2.jpg?amount=${Math.floor(Number(data.total_amount) - Number(data.paid_amount))}&addInfo=${data.order_code}&accountName=CTY TNHH TM DV TUONG LINH`} alt="VietQR" style={{ width: 160 }} />
                            </div>

                            <Divider orientation="left" style={{ fontSize: 12, color: '#bbb' }}>Chi tiết giao dịch</Divider>

                            {data.payments && data.payments.length > 0 ? (
                                isMobile ? (
                                    <List dataSource={data.payments} renderItem={(r: any) => {
                                        let text = r.type === 'INCOME' ? 'Thanh toán' : 'Hoàn tiền';
                                        let color = r.type === 'INCOME' ? 'success' : 'red';
                                        let desc = r.description || '';
                                        const match = desc.match(/^\[(.*?)\]/);
                                        if (match) {
                                            text = match[1]; desc = desc.replace(match[0], '').trim();
                                            if (text.includes('ĐẶT CỌC')) color = 'orange';
                                            if (text.includes('TẤT TOÁN')) color = 'blue';
                                        }
                                        return (
                                            <div style={{ padding: '8px 0', borderBottom: '1px dashed #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 12, color: '#999' }}>{dayjs(r.date).format('DD/MM/YYYY')}</div>
                                                    <div><Tag color={color}>{text}</Tag></div>
                                                    {desc && <div style={{ fontSize: 11, color: '#666' }}>{desc}</div>}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{Number(r.amount).toLocaleString()}</div>
                                            </div>
                                        )
                                    }} />
                                ) : (
                                    <Table
                                        dataSource={data.payments}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            { title: 'Ngày', render: (r: any) => dayjs(r.date).format('DD/MM/YYYY') },
                                            {
                                                title: 'Loại',
                                                render: (r: any) => {
                                                    let text = r.type === 'INCOME' ? 'Thanh toán' : 'Hoàn tiền';
                                                    let color = r.type === 'INCOME' ? 'success' : 'red';
                                                    let desc = r.description || '';

                                                    // Try to parse [TYPE] from description (saved in SalesPayments.tsx)
                                                    // Format: [ĐẶT CỌC] Note...
                                                    const match = desc.match(/^\[(.*?)\]/);
                                                    if (match) {
                                                        text = match[1]; // e.g. "ĐẶT CỌC", "TẤT TOÁN"
                                                        desc = desc.replace(match[0], '').trim();
                                                        if (text.includes('ĐẶT CỌC')) color = 'orange';
                                                        if (text.includes('TẤT TOÁN')) color = 'blue';
                                                        if (text.includes('THANH TOÁN')) color = 'green';
                                                    }

                                                    return (
                                                        <div>
                                                            <Tag color={color}>{text}</Tag>
                                                            {desc && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{desc}</div>}
                                                        </div>
                                                    );
                                                }
                                            },
                                            { title: 'Số tiền', align: 'right', render: (r: any) => <b>{Number(r.amount).toLocaleString()}</b> },
                                        ]}
                                    />
                                )
                            ) : (
                                <Empty description="Chưa có giao dịch nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>

            <div style={{ textAlign: 'center', padding: '20px 0', color: '#ccc', fontSize: 12 }}>
                Powered by HULA ERP Technology
            </div>

            <Modal
                open={previewVisible}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                width={800}
                centered
                styles={{ body: { padding: 0, background: 'transparent' } }}
                closeIcon={<span style={{ color: '#fff', fontSize: 20 }}>×</span>}
            >
                {previewImage && (
                    <img
                        alt="preview"
                        style={{ width: '100%', borderRadius: 8 }}
                        src={previewImage}
                    />
                )}
            </Modal>
        </div >
    );
};

export default PortalQuotePage;