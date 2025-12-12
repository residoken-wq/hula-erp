import React from 'react';
import { Row, Col, Divider, Typography, Table, Image } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Props {
    data: any; // Dữ liệu Sales Order đầy đủ
}

const QuotationTemplate: React.FC<Props> = ({ data }) => {
    if (!data) return null;

    // --- MAPPING DATA ĐỂ KHỚP VỚI PDF ---
    const sellerInfo = {
        name: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH',
        address: '74/21/2A Nguyễn Khuyến, P. 12, Q. Bình Thạnh, TP. HCM',
        phone: '0983.882210 - 0983.796654',
        email: 'nemmamnonhula@gmail.com',
        taxCode: '0311.874.522',
        bankAccount: '141847859',
        bankName: 'NH Thương mại Cổ phần Á Châu (ACB)'
    };

    const columns = [
        { 
            title: 'STT', 
            width: 50, 
            align: 'center' as const,
            render: (_:any, __:any, index:number) => index + 1 
        },
        { 
            title: 'Tên Sản phẩm', 
            dataIndex: 'sku', 
            render: (t:any) => <b>{t}</b> 
        },
        { 
            title: 'Chất liệu / Mô tả', 
            width: 200,
            render: () => (
                <div style={{fontSize: 12}}>
                    - Vải cotton CARA/Dù<br/>
                    - Chần gòn 300gr<br/>
                    - Viền vải dù, chống trượt
                </div>
            ) 
        },
        { 
            title: 'Kích thước', 
            dataIndex: 'sku',
            align: 'center' as const,
            render: (t: string) => {
                // Giả lập bóc tách kích thước từ SKU hoặc attributes nếu có
                // VD: NMN_120x60 -> 120 x 60 cm
                return t.includes('_') ? t.split('_').find(s => s.includes('x')) || '-' : '-';
            } 
        },
        { 
            title: 'SL', 
            dataIndex: 'quantity', 
            align: 'center' as const,
            render: (v:any) => <b>{Number(v)}</b>
        },
        { 
            title: 'Đơn giá', 
            dataIndex: 'unit_price', 
            align: 'right' as const, 
            render: (v:any) => Number(v).toLocaleString() 
        },
        { 
            title: 'Thành tiền', 
            dataIndex: 'subtotal', 
            align: 'right' as const, 
            render: (v:any) => <b>{Number(v).toLocaleString()}</b> 
        },
        // { 
        //     title: 'Ảnh', 
        //     width: 80,
        //     render: () => <div style={{width:50, height:50, background:'#eee', margin:'0 auto'}}></div> 
        // }
    ];

    return (
        <div className="quotation-paper" style={{ padding: '40px', background: '#fff', width: '100%', maxWidth: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: 'Times New Roman, serif', color: '#000' }}>
            
            {/* --- HEADER --- */}
            <Row gutter={24} align="middle">
                <Col span={8}>
                    {/* LOGO GIẢ LẬP */}
                    <div style={{border:'2px solid #0050b3', color:'#0050b3', padding: 10, textAlign:'center', fontWeight:'bold', fontSize: 24}}>
                        HULA <br/><span style={{fontSize:12}}>NỆM MẦM NON</span>
                    </div>
                </Col>
                <Col span={16} style={{textAlign:'right'}}>
                    <h1 style={{color: '#0050b3', margin: 0, fontSize: 28}}>BẢNG BÁO GIÁ</h1>
                    <div style={{fontSize: 14}}>
                        <b>Số BG:</b> {data.order_code}<br/>
                        <i>TP. HCM, ngày {dayjs(data.order_date).format('DD')} tháng {dayjs(data.order_date).format('MM')} năm {dayjs(data.order_date).format('YYYY')}</i>
                    </div>
                </Col>
            </Row>

            <Divider style={{borderColor: '#0050b3', borderWidth: 2, margin: '20px 0'}} />

            {/* --- INFO SECTION --- */}
            <Row gutter={48}>
                {/* BÊN BÁN */}
                <Col span={12}>
                    <div style={{background:'#f0f5ff', padding: 15, borderRadius: 8, height: '100%'}}>
                        <h4 style={{marginTop:0, color:'#0050b3', borderBottom:'1px solid #ccc', paddingBottom:5}}>BÊN BÁN (PARTY A)</h4>
                        <div style={{fontSize: 13, lineHeight: '1.6'}}>
                            <b>{sellerInfo.name}</b><br/>
                            📍 {sellerInfo.address}<br/>
                            📞 {sellerInfo.phone}<br/>
                            ✉️ {sellerInfo.email}<br/>
                            <b>MST:</b> {sellerInfo.taxCode}<br/>
                            <b>TK:</b> {sellerInfo.bankAccount} - {sellerInfo.bankName}
                        </div>
                    </div>
                </Col>

                {/* BÊN MUA */}
                <Col span={12}>
                    <div style={{border:'1px solid #ddd', padding: 15, borderRadius: 8, height: '100%'}}>
                        <h4 style={{marginTop:0, color:'#0050b3', borderBottom:'1px solid #ccc', paddingBottom:5}}>BÊN MUA (PARTY B)</h4>
                        <div style={{fontSize: 13, lineHeight: '1.6'}}>
                            <b>{data.vat_company_name || data.customer_name}</b><br/>
                            📍 {data.vat_address || data.shipping_address || '...'}<br/>
                            📞 {data.receiver_phone || data.customer?.phone || '...'}<br/>
                            <b>Người liên hệ:</b> {data.receiver_name || data.customer_name}<br/>
                            <b>MST:</b> {data.vat_tax_code || '...'}<br/>
                        </div>
                    </div>
                </Col>
            </Row>

            <br/>
            <p>Kính gửi Quý khách hàng bảng báo giá chi tiết các sản phẩm như sau:</p>

            {/* --- TABLE --- */}
            <Table 
                dataSource={data.items} 
                columns={columns} 
                pagination={false} 
                bordered 
                size="small"
                summary={(pageData) => {
                    let total = 0;
                    pageData.forEach(({ subtotal }) => { total += Number(subtotal); });
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={6} align="right"><b>TỔNG CỘNG</b></Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right"><b style={{fontSize: 16, color:'#cf1322'}}>{total.toLocaleString()} ₫</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
            
            <div style={{textAlign:'right', fontStyle:'italic', marginTop: 5}}>
                (Bằng chữ: ........................................................................)
            </div>

            {/* --- TERMS & CONDITIONS --- */}
            <div style={{marginTop: 30, fontSize: 13}}>
                <h4 style={{borderBottom:'1px solid #000', display:'inline-block'}}>GHI CHÚ & ĐIỀU KHOẢN:</h4>
                <ul style={{paddingLeft: 20, lineHeight: '1.8'}}>
                    <li>Giá trên <b>chưa bao gồm</b> thuế GTGT (VAT) và Phí giao hàng (nếu có).</li>
                    <li><b>Thời gian giao hàng:</b> {data.delivery_date ? dayjs(data.delivery_date).format('DD/MM/YYYY') : '3-5 ngày đối với hàng có sẵn'}.</li>
                    <li><b>Hiệu lực báo giá:</b> 07 ngày kể từ ngày phát hành.</li>
                    <li><b>Thanh toán:</b> {data.payment_note || 'Tạm ứng 50% ngay khi xác nhận đơn, 50% còn lại trước khi giao hàng.'}</li>
                    <li><b>Thông tin chuyển khoản:</b>
                        <ul style={{listStyleType: 'none', paddingLeft: 0, fontWeight:'bold', color: '#0050b3'}}>
                            <li>CTK: {sellerInfo.name}</li>
                            <li>STK: {sellerInfo.bankAccount} - {sellerInfo.bankName}</li>
                        </ul>
                    </li>
                </ul>
            </div>

            {/* --- SIGNATURE --- */}
            <Row style={{marginTop: 60}}>
                <Col span={12} style={{textAlign:'center'}}>
                    <b>ĐẠI DIỆN KHÁCH HÀNG</b><br/>
                    <i>(Ký, ghi rõ họ tên)</i>
                </Col>
                <Col span={12} style={{textAlign:'center'}}>
                    <b>ĐẠI DIỆN CÔNG TY TƯỜNG LINH</b><br/>
                    <i>(Ký, đóng dấu)</i>
                    <div style={{marginTop: 80}}>
                        <b>Phạm Thu Hằng</b><br/>
                        <i style={{fontSize:12}}>Giám Đốc</i>
                    </div>
                </Col>
            </Row>

        </div>
    );
};

export default QuotationTemplate;