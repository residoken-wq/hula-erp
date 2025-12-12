import React from 'react';
import { Row, Col, Typography, Table, Divider, Tag, Image } from 'antd';
import { FileImageOutlined, CheckCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const QuotationTemplate: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;

  // --- LOGIC XỬ LÝ DỮ LIỆU THÔNG MINH ---
  const isOrder = ['DEPOSITED', 'PLANNED', 'PARTIAL_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(data.status) || Number(data.paid_amount) > 0;
  const docTitle = isOrder ? "ĐƠN ĐẶT HÀNG" : "BẢNG BÁO GIÁ";
  
  // Tính toán tiền
  const paidAmount = Number(data.paid_amount) || 0;
  const remainingAmount = Number(data.total_amount) - paidAmount;

  // FIX: Lấy thông tin khách hàng từ object customer (nếu có) hoặc từ root
  const customerName = data.customer?.name || data.customer_name || data.receiver_name || 'Khách lẻ';
  const customerAddress = data.vat_address || data.customer?.address || data.shipping_address || '...';
  const customerPhone = data.receiver_phone || data.customer?.phone || '...';
  const customerTax = data.vat_tax_code || data.customer?.tax_code || '...';

  return (
    <div style={{ padding: 40, background: '#fff', fontSize: 14, fontFamily: 'Times New Roman, serif', color: '#000' }}>
      
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{borderBottom: '2px solid #1890ff', paddingBottom: 20, marginBottom: 30}}>
          <Col span={12}>
              <div style={{border: '2px solid #1890ff', padding: '10px 20px', display: 'inline-block', textAlign:'center', minWidth: 200}}>
                  <Title level={4} style={{margin: 0, color: '#1890ff', textTransform: 'uppercase'}}>HULA</Title>
                  <Text type="secondary">NỆM MẦM NON</Text>
              </div>
          </Col>
          <Col span={12} style={{textAlign: 'right'}}>
              <Title level={2} style={{margin: 0, color: '#1890ff', textTransform: 'uppercase'}}>{docTitle}</Title>
              <div>Số: <b>{data.order_code}</b></div>
              <div>TP. HCM, ngày {dayjs(data.order_date).format('DD')} tháng {dayjs(data.order_date).format('MM')} năm {dayjs(data.order_date).format('YYYY')}</div>
          </Col>
      </Row>

      {/* INFO SECTIONS */}
      <Row gutter={40} style={{marginBottom: 30}}>
          {/* BÊN BÁN */}
          <Col span={12}>
              <div style={{background: '#f9f9f9', padding: 15, borderRadius: 8, height: '100%', border: '1px solid #eee'}}>
                  <h4 style={{marginTop:0, color:'#1890ff', borderBottom:'1px solid #ddd', paddingBottom:5, textTransform:'uppercase'}}>BÊN BÁN (PARTY A)</h4>
                  <p style={{marginBottom:5}}><b>CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH</b></p>
                  <p style={{marginBottom:5}}>📍 74/21/2A Nguyễn Khuyến, P. 12, Q. Bình Thạnh, TP. HCM</p>
                  <p style={{marginBottom:5}}>📞 0983.882210 - 0983.796654</p>
                  <p style={{marginBottom:5}}>✉️ nemmamnonhula@gmail.com</p>
                  <p style={{marginBottom:0}}><b>MST:</b> 0311.874.522</p>
              </div>
          </Col>

          {/* BÊN MUA - ĐÃ FIX HIỂN THỊ */}
          <Col span={12}>
              <div style={{background: '#fff', border:'1px solid #1890ff', padding: 15, borderRadius: 8, height: '100%'}}>
                  <h4 style={{marginTop:0, color:'#1890ff', borderBottom:'1px solid #ddd', paddingBottom:5, textTransform:'uppercase'}}>BÊN MUA (PARTY B)</h4>
                  <p style={{marginBottom:5, fontSize: 15}}><b>{customerName}</b></p>
                  <p style={{marginBottom:5}}>📍 {customerAddress}</p>
                  <p style={{marginBottom:5}}>📞 {customerPhone}</p>
                  <p style={{marginBottom:0}}><b>MST:</b> {customerTax}</p>
              </div>
          </Col>
      </Row>

      <p>Kính gửi Quý khách hàng bảng chi tiết các sản phẩm như sau:</p>

      {/* TABLE */}
      <Table
        dataSource={data.items}
        pagination={false}
        rowKey="id"
        bordered
        size="small"
        columns={[
            { title: 'STT', width: 50, align: 'center', render: (_:any, __:any, index:number) => index + 1 },
            { 
                title: 'Tên Sản phẩm', 
                render: (r:any) => (
                    <div>
                        <div style={{fontWeight:600}}>{r.sku}</div>
                        {r.is_sample_approved && (
                            <div style={{marginTop: 5, fontSize: 12}}>
                                <Tag color="success" icon={<CheckCircleFilled />}>Mẫu đã duyệt</Tag>
                                {r.sample_image && (
                                    <a href={r.sample_image} target="_blank" rel="noreferrer" style={{color: '#1890ff'}}>
                                        <FileImageOutlined /> Xem hình ảnh
                                    </a>
                                )}
                            </div>
                        )}
                        {r.variant_color && <div style={{fontSize:12, color:'#666'}}>Màu: {r.variant_color}</div>}
                    </div>
                ) 
            },
            { 
                title: 'Chi tiết / Mô tả', 
                render: (r:any) => (
                    <div style={{fontSize: 12, color: '#555'}}>
                        {r.variant_color && <div>- Màu: {r.variant_color}</div>}
                        {r.sample_note && <div style={{fontStyle:'italic'}}>- Note: {r.sample_note}</div>}
                    </div>
                ) 
            },
            { title: 'SL', dataIndex: 'quantity', align: 'center', width: 60, render: (v:any) => Number(v).toLocaleString() },
            { title: 'ĐVT', width: 60, align: 'center', render: () => 'Cái' },
            { title: 'Đơn giá', dataIndex: 'unit_price', align: 'right', render: (v:any) => Number(v).toLocaleString() },
            { title: 'Thành tiền', dataIndex: 'subtotal', align: 'right', render: (v:any) => <b>{Number(v).toLocaleString()}</b> }
        ]}
        summary={() => {
            return (
                <>
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={6} align="right">Cộng tiền hàng:</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right"><b>{(Number(data.total_amount) - data.shipping_fee - (data.total_amount * data.vat_rate / (100 + data.vat_rate))).toLocaleString()}</b></Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={6} align="right">Thuế GTGT ({data.vat_rate}%):</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">{((data.total_amount - data.shipping_fee) * data.vat_rate / (100 + data.vat_rate)).toLocaleString()}</Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={6} align="right">Phí vận chuyển:</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">{Number(data.shipping_fee).toLocaleString()}</Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={6} align="right"><b style={{fontSize: 16}}>TỔNG CỘNG:</b></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right"><b style={{fontSize: 16, color: '#cf1322'}}>{Number(data.total_amount).toLocaleString()} ₫</b></Table.Summary.Cell>
                    </Table.Summary.Row>

                    {/* HIỂN THỊ THANH TOÁN */}
                    {paidAmount > 0 && (
                        <>
                            <Table.Summary.Row style={{background: '#f6ffed'}}>
                                <Table.Summary.Cell index={0} colSpan={6} align="right"><b style={{color: 'green'}}>ĐÃ THANH TOÁN / ĐẶT CỌC:</b></Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right"><b style={{color: 'green'}}>{paidAmount.toLocaleString()} ₫</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={6} align="right"><b style={{color: '#faad14'}}>SỐ TIỀN CÒN LẠI:</b></Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right"><b style={{color: '#faad14'}}>{remainingAmount.toLocaleString()} ₫</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    )}
                </>
            );
        }}
      />

      <div style={{marginTop: 20}}>
          <p><i>(Bằng chữ: .........................................................................................................................)</i></p>
      </div>

      <div style={{marginTop: 30}}>
          <b style={{textDecoration:'underline'}}>GHI CHÚ & ĐIỀU KHOẢN:</b>
          <ul style={{fontSize: 13, paddingLeft: 20, marginTop: 5, lineHeight: 1.6}}>
              <li>Báo giá có hiệu lực trong vòng 07 ngày.</li>
              <li>Thời gian giao hàng: <b>{dayjs(data.delivery_date).isValid() ? dayjs(data.delivery_date).format('DD/MM/YYYY') : '3-5 ngày'}</b> (hoặc theo thỏa thuận).</li>
              <li>Hiệu lực báo giá: 07 ngày kể từ ngày phát hành.</li>
              <li><b>Thanh toán:</b> Tạm ứng 50% ngay khi xác nhận đơn, 50% còn lại trước khi giao hàng.</li>
              <li><b>Thông tin chuyển khoản:</b></li>
              <div style={{color: '#1890ff', fontWeight: 600, marginLeft: 10, background: '#e6f7ff', padding: 10, borderRadius: 6, display: 'inline-block'}}>
                  CTK: CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH<br/>
                  STK: 141847859 - NH Thương mại Cổ phần Á Châu (ACB)
              </div>
          </ul>
      </div>

      <Row style={{marginTop: 50, textAlign: 'center'}}>
          <Col span={12}>
              <b>ĐẠI DIỆN KHÁCH HÀNG</b><br/>
              <i>(Ký, ghi rõ họ tên)</i>
          </Col>
          <Col span={12}>
              <b>ĐẠI DIỆN CÔNG TY TƯỜNG LINH</b><br/>
              <i>(Ký, đóng dấu)</i>
              <div style={{height: 80}}></div>
          </Col>
      </Row>
    </div>
  );
};

export default QuotationTemplate;