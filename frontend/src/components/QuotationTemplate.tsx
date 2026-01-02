import React from 'react';
import { Row, Col, Typography, Table, Tag, Image } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- FIX: ĐỊNH NGHĨA TYPE RÕ RÀNG ĐỂ TRÁNH LỖI TS2322 ---
interface QuotationProps {
    data: any;
}

const QuotationTemplate: React.FC<QuotationProps> = ({ data }) => {
    if (!data) return null;

    const isOrder = ['DEPOSITED', 'PLANNED', 'PARTIAL_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(data.status) || Number(data.paid_amount) > 0;
    const docTitle = isOrder ? "ĐƠN ĐẶT HÀNG" : "BẢNG BÁO GIÁ";

    const paidAmount = Number(data.paid_amount) || 0;
    const remainingAmount = Number(data.total_amount) - paidAmount;
    const finalAmount = remainingAmount > 0 ? remainingAmount : Number(data.total_amount);

    const customerName = data.customer?.name || data.customer_name || data.receiver_name || 'Khách lẻ';
    const qrLink = `https://img.vietqr.io/image/ACB-141847859-compact2.jpg?amount=${Math.floor(finalAmount)}&addInfo=${data.order_code}&accountName=CTY TNHH TM DV TUONG LINH`;

    return (
        <div style={{ padding: 40, background: '#fff', fontSize: 14, fontFamily: 'Times New Roman, serif', color: '#000' }}>

            {/* HEADER */}
            <Row justify="space-between" align="middle" style={{ borderBottom: '2px solid #1890ff', paddingBottom: 20, marginBottom: 30 }}>
                <Col span={12}>
                    <div style={{ textAlign: 'left' }}>
                        <Image preview={false} src="/company_header.png" alt="Company Header" style={{ maxWidth: '100%', height: 'auto', maxHeight: 80 }} />
                    </div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <Title level={2} style={{ margin: 0, color: '#1890ff', textTransform: 'uppercase' }}>{docTitle}</Title>
                    <div>Số: <b>{data.order_code}</b></div>
                    <div>TP. HCM, ngày {dayjs(data.order_date).format('DD')} tháng {dayjs(data.order_date).format('MM')} năm {dayjs(data.order_date).format('YYYY')}</div>
                </Col>
            </Row>

            {/* THÔNG TIN 2 BÊN */}
            <Row gutter={40} style={{ marginBottom: 30 }}>
                <Col span={12}>
                    <div style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, height: '100%', border: '1px solid #eee' }}>
                        <h4 style={{ marginTop: 0, color: '#1890ff', borderBottom: '1px solid #ddd', paddingBottom: 5, textTransform: 'uppercase' }}>BÊN BÁN (PARTY A)</h4>
                        <p style={{ marginBottom: 5 }}><b>CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH</b></p>
                        <p style={{ marginBottom: 5 }}>📍 74/21/2A Nguyễn Khuyến, P. 12, Q. Bình Thạnh, TP. HCM</p>
                        <p style={{ marginBottom: 5 }}>📞 0983.882210 - 0983.796654</p>
                        <p style={{ marginBottom: 0 }}><b>MST:</b> 0311.874.522</p>
                    </div>
                </Col>
                <Col span={12}>
                    <div style={{ background: '#fff', border: '1px solid #1890ff', padding: 15, borderRadius: 8, height: '100%' }}>
                        <h4 style={{ marginTop: 0, color: '#1890ff', borderBottom: '1px solid #ddd', paddingBottom: 5, textTransform: 'uppercase' }}>BÊN MUA (PARTY B)</h4>
                        <p style={{ marginBottom: 5, fontSize: 15 }}><b>{customerName}</b></p>
                        <p style={{ marginBottom: 5 }}>📍 {data.vat_address || data.shipping_address || '...'}</p>
                        <p style={{ marginBottom: 5 }}>📞 {data.receiver_phone || '...'}</p>
                        <p style={{ marginBottom: 0 }}><b>MST:</b> {data.vat_tax_code || '...'}</p>
                    </div>
                </Col>
            </Row>

            <p>Kính gửi Quý khách hàng bảng chi tiết các sản phẩm như sau:</p>

            {/* BẢNG SẢN PHẨM */}
            <Table
                dataSource={data.items}
                pagination={false}
                rowKey="id"
                bordered
                size="small"
                columns={[
                    { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, index: number) => index + 1 },
                    {
                        title: 'Tên Sản phẩm',
                        render: (r: any) => (
                            <div>
                                <div style={{ fontWeight: 600 }}>{r.product_name_real || r.sku}</div>
                                {r.variant_color && <div style={{ fontSize: 12, color: '#666' }}>Màu: {r.variant_color}</div>}
                                {r.is_sample_approved && <div style={{ marginTop: 5, fontSize: 12 }}><Tag color="success" icon={<CheckCircleFilled />}>Mẫu đã duyệt</Tag></div>}
                            </div>
                        )
                    },
                    // --- MỚI: CỘT MÔ TẢ SẢN PHẨM ---
                    {
                        title: 'Mô tả chi tiết',
                        dataIndex: 'product_desc',
                        width: '30%',
                        render: (t: string) => <div style={{ whiteSpace: 'pre-line', fontSize: 12, color: '#555' }}>{t || ''}</div>
                    },
                    // -------------------------------
                    { title: 'SL', dataIndex: 'quantity', align: 'center', width: 60, render: (v: any) => Number(v).toLocaleString() },
                    { title: 'ĐVT', width: 60, align: 'center', render: (t: any, r: any) => r.unit || 'Cái' },
                    { title: 'Đơn giá', dataIndex: 'unit_price', align: 'right', width: 100, render: (v: any) => Number(v).toLocaleString() },
                    { title: 'Thành tiền', dataIndex: 'subtotal', align: 'right', width: 110, render: (v: any) => <b>{Number(v).toLocaleString()}</b> }
                ]}
                summary={() => (
                    <>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={6} align="right"><b>Tổng tiền hàng:</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                                {data.items.reduce((s: number, i: any) => s + Number(i.subtotal), 0).toLocaleString()}
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={6} align="right">Thuế VAT ({data.vat_rate || 0}%):</Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                                {(Number(data.total_amount) - Number(data.shipping_fee || 0) - data.items.reduce((s: number, i: any) => s + Number(i.subtotal), 0)).toLocaleString()}
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={6} align="right">Phí vận chuyển:</Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">{Number(data.shipping_fee || 0).toLocaleString()}</Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row style={{ background: '#fafafa' }}>
                            <Table.Summary.Cell index={0} colSpan={6} align="right"><b style={{ fontSize: 16, color: '#1890ff' }}>TỔNG CỘNG:</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right"><b style={{ fontSize: 16, color: '#cf1322' }}>{Number(data.total_amount).toLocaleString()} ₫</b></Table.Summary.Cell>
                        </Table.Summary.Row>
                        {paidAmount > 0 && (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={6} align="right"><b style={{ color: 'green' }}>ĐÃ CỌC:</b></Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right"><b style={{ color: 'green' }}>{paidAmount.toLocaleString()} ₫</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                        )}
                    </>
                )}
            />

            <div style={{ marginTop: 20 }}><p><i>(Bằng chữ: .........................................................................................................................)</i></p></div>

            {/* FOOTER & THANH TOÁN */}
            <div style={{ marginTop: 30, display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <b style={{ textDecoration: 'underline' }}>GHI CHÚ & ĐIỀU KHOẢN:</b>
                    <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{data.terms_content || "Chưa có điều khoản."}</div>
                    <div style={{ marginTop: 15 }}><b>Thông tin chuyển khoản:</b><ul style={{ fontSize: 13, paddingLeft: 20, marginTop: 5 }}><li>Ngân hàng: <b>ACB</b> - CN TP.HCM</li><li>Số TK: <b>141847859</b></li><li>Chủ TK: <b>CTY TNHH TM DV TUONG LINH</b></li></ul></div>
                </div>
                <div style={{ width: 200, textAlign: 'center', border: '1px solid #ddd', padding: 10, borderRadius: 8 }}>
                    <div style={{ marginBottom: 5, fontSize: 12, color: '#666' }}>Quét mã để thanh toán</div>
                    <Image src={qrLink} width={150} preview={false} />
                    <div style={{ marginTop: 5, fontWeight: 'bold', color: '#1890ff' }}>HULA PAYMENT</div>
                </div>
            </div>

            <Row style={{ marginTop: 50, textAlign: 'center' }}>
                <Col span={12}><b>ĐẠI DIỆN KHÁCH HÀNG</b><br /><i>(Ký, ghi rõ họ tên)</i></Col>
                <Col span={12}><b>ĐẠI DIỆN CÔNG TY TƯỜNG LINH</b><br /><i>(Ký, đóng dấu)</i><div style={{ height: 80 }}></div></Col>
            </Row>
        </div>
    );
};

export default QuotationTemplate;