import React from 'react';
import { Descriptions, Table, Typography, Divider, Row, Col } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Props {
    data: any; // Dữ liệu SalesOrder
}

const QuotationTemplate: React.FC<Props> = ({ data }) => {
    if (!data) return null;

    const columns = [
        { title: 'STT', render: (_:any, __:any, index:number) => index + 1, width: 50, align: 'center' as const },
        { title: 'Tên Sản phẩm', dataIndex: 'sku', render: (t:any) => <b>{t}</b> },
        { title: 'Mô tả / Chất liệu', render: () => 'Theo mẫu yêu cầu' }, // Placeholder
        { title: 'ĐVT', render: () => 'Cái', align: 'center' as const },
        { title: 'Số lượng', dataIndex: 'quantity', align: 'center' as const },
        { title: 'Đơn giá', dataIndex: 'unit_price', align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
        { title: 'Thành tiền', dataIndex: 'subtotal', align: 'right' as const, render: (v:any) => <b>{Number(v).toLocaleString()}</b> },
    ];

    return (
        <div style={{ padding: 40, background: '#fff', maxWidth: 800, margin: '0 auto', border: '1px solid #ddd', minHeight: 1100 }}>
            {/* HEADER */}
            <Row gutter={16}>
                <Col span={14}>
                    <Title level={4} style={{marginBottom:0, color:'#0050b3'}}>CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH</Title>
                    <Text>ĐC: 74/21/24 Nguyễn Khuyến, P. Bình Thạnh, TP. HCM</Text><br/>
                    <Text>Hotline: 0983.882210 - 0983.796654</Text><br/>
                    <Text>Email: nemmamnonhula@gmail.com</Text><br/>
                    <Text>Website: nemmamnonhula.com</Text>
                </Col>
                <Col span={10} style={{textAlign:'right'}}>
                    <div style={{border:'2px solid #0050b3', padding: 10, display:'inline-block'}}>
                        <Title level={3} style={{margin:0, color:'#0050b3'}}>BẢNG BÁO GIÁ</Title>
                        <Text strong>Số: {data.order_code}</Text><br/>
                        <Text type="secondary">Ngày: {dayjs(data.order_date).format('DD/MM/YYYY')}</Text>
                    </div>
                </Col>
            </Row>

            <Divider />

            {/* INFO */}
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Khách hàng"><b>{data.vat_company_name || data.customer_name}</b></Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{data.vat_address || data.shipping_address}</Descriptions.Item>
                <Descriptions.Item label="MST / SĐT">{data.vat_tax_code || data.customer?.phone}</Descriptions.Item>
                <Descriptions.Item label="Người liên hệ">{data.receiver_name || data.customer_name}</Descriptions.Item>
            </Descriptions>

            <br/>
            <Text>Kính gửi Quý khách hàng bảng báo giá các sản phẩm như sau:</Text>
            <br/><br/>

            {/* TABLE */}
            <Table 
                dataSource={data.items} 
                columns={columns} 
                pagination={false} 
                bordered 
                summary={(pageData) => {
                    let total = 0;
                    pageData.forEach(({ subtotal }) => { total += Number(subtotal); });
                    return (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={6} align="right"><b>TỔNG CỘNG</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right"><Text type="danger" strong>{total.toLocaleString()}</Text></Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />

            <div style={{marginTop: 20}}>
                <Text strong>Ghi chú:</Text>
                <ul style={{fontSize: 13}}>
                    <li>Giá trên chưa bao gồm thuế GTGT (VAT) và Phí vận chuyển.</li>
                    <li>Hiệu lực báo giá: 07 ngày kể từ ngày phát hành.</li>
                    <li>Thanh toán: {data.payment_note || 'Chuyển khoản 100% trước khi giao hàng.'}</li>
                    <li>Thời gian giao hàng dự kiến: {data.delivery_date ? dayjs(data.delivery_date).format('DD/MM/YYYY') : 'Thỏa thuận'}</li>
                </ul>
            </div>

            <Row style={{marginTop: 50}}>
                <Col span={12} style={{textAlign:'center'}}>
                    <Text strong>ĐẠI DIỆN KHÁCH HÀNG</Text><br/>
                    <Text type="secondary">(Ký, ghi rõ họ tên)</Text>
                </Col>
                <Col span={12} style={{textAlign:'center'}}>
                    <Text strong>ĐẠI DIỆN CÔNG TY TƯỜNG LINH</Text><br/>
                    <div style={{marginTop: 60}}>
                        <Text strong>Phạm Thu Hằng</Text>
                    </div>
                </Col>
            </Row>
            
            <div style={{marginTop: 50, borderTop:'1px dashed #ccc', paddingTop: 10, fontSize: 12, textAlign:'center', color:'#888'}}>
                <i>Cảm ơn Quý khách đã quan tâm đến sản phẩm của HULA!</i>
            </div>
        </div>
    );
};

export default QuotationTemplate;