import React from 'react';
import { Row, Col, Typography, Table, Divider, Tag, Image } from 'antd';
import { FileImageOutlined, CheckCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const QuotationTemplate: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;

  // 1. LOGIC ĐỔI TIÊU ĐỀ
  // Nếu đã cọc hoặc trạng thái đã qua bước duyệt mẫu -> Là Đơn Hàng
  const isOrder = ['DEPOSITED', 'PLANNED', 'PARTIAL_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(data.status) || Number(data.paid_amount) > 0;
  const docTitle = isOrder ? "ĐƠN ĐẶT HÀNG" : "BẢNG BÁO GIÁ";
  const docIdPrefix = isOrder ? "SO" : "QUOTE";

  // Tính toán tiền
  const paidAmount = Number(data.paid_amount) || 0;
  const remainingAmount = Number(data.total_amount) - paidAmount;

  return (
    <div style={{ padding: 40, background: '#fff', fontSize: 14, fontFamily: 'Times New Roman, serif' }}>
      
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

      {/* INFO */}
      <Row gutter={40} style={{marginBottom: 30}}>
          <Col span={12}>
              <div style={{background: '#f5f7fa', padding: 15, borderRadius: 8, height: '100%'}}>
                  <h4 style={{marginTop:0, color:'#1890ff', borderBottom:'1px solid #ddd', paddingBottom:5}}>BÊN BÁN (PARTY A)</h4>
                  <p><b>CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH</b></p>
                  <p>📍 74/21/2A Nguyễn Khuyến, P. 12, Q. Bình Thạnh, TP. HCM</p>
                  <p>📞 0983.882210 - 0983.796654</p>
                  <p>✉️ nemmamnonhula@gmail.com</p>
                  <p><b>MST:</b> 0311.874.522</p>
              </div>
          </Col>
          <Col span={12}>
              <div style={{background: '#fff', border:'1px solid #eee', padding: 15, borderRadius: 8, height: '100%'}}>
                  <h4 style={{marginTop:0, color:'#1890ff', borderBottom:'1px solid #ddd', paddingBottom:5}}>BÊN MUA (PARTY B)</h4>
                  <p><b>{data.customer_name || data.receiver_name}</b></p>
                  <p>📍 {data.vat_address || data.shipping_address || '...'}</p>
                  <p>📞 {data.receiver_phone || '...'}</p>
                  <p><b>MST:</b> {data.vat_tax_code || '...'}</p>
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
                        <div style={{fontWeight:500}}>{r.sku}</div>
                        {/* 2. HIỂN THỊ LINK MẪU ĐÃ DUYỆT */}
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
                        {/* Biến thể màu */}
                        {r.variant_color && <div style={{fontSize:12, color:'#666'}}>Màu: {r.variant_color}</div>}
                    </div>
                ) 
            },
            { 
                title: 'Chi tiết / Mô tả', 
                render: (r:any) => (
                    <div style={{fontSize: 12, color: '#666'}}>
                        {r.variant_color && <div>- Màu: {r.variant_color}</div>}
                        {r.sample_note && <div style={{fontStyle:'italic'}}>- Note: {r.sample_note}</div>}
                    </div>
                ) 
            },
            { title: 'SL', dataIndex: 'quantity', align: 'center', width: 60 },
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

                    {/* 3. HIỂN THỊ THÔNG TIN THANH TOÁN (NẾU CÓ) */}
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
          <b>GHI CHÚ & ĐIỀU KHOẢN:</b>
          <ul style={{fontSize: 13, paddingLeft: 20, marginTop: 5}}>
              <li>Báo giá có hiệu lực trong vòng 07 ngày.</li>
              <li>Thời gian giao hàng: {dayjs(data.delivery_date).isValid() ? dayjs(data.delivery_date).format('DD/MM/YYYY') : '3-5 ngày'} (hoặc theo thỏa thuận).</li>
              <li><b>Thanh toán:</b> Tạm ứng 50% ngay khi xác nhận đơn, 50% còn lại trước khi giao hàng.</li>
              <li><b>Thông tin chuyển khoản:</b></li>
              <div style={{color: '#1890ff', fontWeight: 500, marginLeft: 10}}>
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