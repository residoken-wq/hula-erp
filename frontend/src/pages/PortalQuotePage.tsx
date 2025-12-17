import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// FIX: Đã bổ sung Table, Space, Tag vào dòng import dưới đây
import { Spin, Result, Button, message, Modal, Steps, Typography, List, Input, Avatar, Row, Col, Card, Descriptions, Divider, Table, Space, Tag } from 'antd'; 
import { CheckCircleOutlined, SolutionOutlined, FileDoneOutlined, CarOutlined, DollarOutlined, UserOutlined, SendOutlined, ShopOutlined, PrinterOutlined } from '@ant-design/icons';
import QuotationTemplate from '../components/QuotationTemplate'; // Import component đã fix
import { API_URL } from '../config';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PortalQuotePage: React.FC = () => {
  const { uuid } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

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
          onOk: async () => {
              await axios.post(`${API_URL}/sales/portal/${uuid}/action`, { action });
              message.success('Thành công!'); window.location.reload();
          }
      });
  };

  const handleSendComment = async () => {
      if(!commentText) return;
      try {
          await axios.post(`${API_URL}/sales/${data.id}/comment`, { content: commentText, sender: 'CUSTOMER', name: data.customer_name || 'Khách hàng' });
          setCommentText(''); fetchQuote(); message.success('Đã gửi tin nhắn');
      } catch(e) {}
  };

  if (loading) return <div style={{textAlign:'center', marginTop:100}}><Spin size="large" /></div>;
  if (!data) return <Result status="404" title="404" subTitle="Không tìm thấy đơn hàng" />;

  const statusList = ['QUOTATION','SO_PENDING','SAMPLE_APPROVED','DEPOSITED','PARTIAL_DELIVERY','DELIVERED','COMPLETED'];
  let currentStep = statusList.indexOf(data.status);
  if(data.status === 'PLANNED') currentStep = 3; 
  if(data.status === 'COMPLETED') currentStep = 6;

  const visibleComments = (data.comments || []).filter((c:any) => c.sender_type === 'CUSTOMER' || c.is_visible);

  // --- CẤU HÌNH CỘT BẢNG BÁO GIÁ CHI TIẾT ---
  const columns = [
      { title: 'STT', key: 'index', width: 50, align: 'center' as const, render: (_:any, __:any, index: number) => index + 1 },
      { 
          title: 'Sản phẩm', 
          key: 'product',
          render: (r:any) => (
              <div>
                  <div style={{fontWeight: 600}}>{r.product_name_real || r.sku}</div>
                  <div style={{fontSize: 12, color: '#666'}}>SKU: {r.sku} {r.variant_color ? `- ${r.variant_color}` : ''}</div>
              </div>
          ) 
      },
      // --- CỘT MỚI: MÔ TẢ SẢN PHẨM ---
      { 
          title: 'Mô tả chi tiết', 
          dataIndex: 'product_desc', 
          width: '30%',
          render: (t: string) => <div style={{whiteSpace: 'pre-line', fontSize: 13, color: '#555'}}>{t || '-'}</div>
      },
      // -------------------------------
      { title: 'ĐVT', dataIndex: 'unit', width: 80, align: 'center' as const, render: () => 'Cái' }, 
      { title: 'SL', dataIndex: 'quantity', width: 80, align: 'center' as const, render: (v:any) => Number(v) },
      { title: 'Đơn giá', dataIndex: 'unit_price', width: 120, align: 'right' as const, render: (v:any) => Number(v).toLocaleString() },
      { title: 'Thành tiền', dataIndex: 'subtotal', width: 120, align: 'right' as const, render: (v:any) => <b>{Number(v).toLocaleString()}</b> }
  ];

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: 40 }}>
       <div style={{background:'#fff', padding: '15px 40px', boxShadow: '0 2px 8px #f0f1f2', position:'sticky', top:0, zIndex:100}}>
           <Row justify="space-between" align="middle">
               <Col><Title level={4} style={{margin:0, color:'#1890ff'}}>HULA ERP PORTAL</Title><Text type="secondary">Mã đơn: <b>{data.order_code}</b></Text></Col>
               <Col><Button icon={<PrinterOutlined />} onClick={() => window.print()}>In Đơn Hàng</Button></Col>
           </Row>
           <div style={{marginTop: 20, maxWidth: 900, margin: '20px auto 0'}}>
                <Steps current={currentStep} size="small" items={[{ title: 'Báo Giá', icon: <SolutionOutlined /> }, { title: 'Duyệt Mẫu', icon: <FileDoneOutlined /> }, { title: 'Đặt Cọc', icon: <DollarOutlined /> }, { title: 'Giao Hàng', icon: <CarOutlined /> }, { title: 'Hoàn Tất', icon: <CheckCircleOutlined /> }]} />
           </div>
       </div>

       {data.status === 'QUOTATION' && (
           <div style={{ background: '#001529', color: '#fff', padding: 15, textAlign: 'center' }}>
               <Space size="large"><span>Vui lòng phản hồi báo giá này:</span><Button type="primary" danger onClick={()=>handleAction('REJECT')}>Từ chối</Button><Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} onClick={()=>handleAction('ACCEPT')}>Xác nhận Đồng ý</Button></Space>
           </div>
       )}

       <div style={{ padding: '20px 40px', maxWidth: 1400, margin: '0 auto' }}>
           <Row gutter={24}>
               <Col span={8} xs={24} md={8}>
                   <Card title={<span><UserOutlined /> Thông tin Khách hàng</span>} style={{marginBottom: 20}}>
                       <Descriptions column={1} size="small" bordered>
                           <Descriptions.Item label="Tên đơn vị"><b>{data.customer_name || data.customer?.name || 'Khách lẻ'}</b></Descriptions.Item>
                           <Descriptions.Item label="Người nhận">{data.receiver_name}</Descriptions.Item>
                           <Descriptions.Item label="SĐT">{data.receiver_phone}</Descriptions.Item>
                           <Descriptions.Item label="Địa chỉ giao">{data.shipping_address}</Descriptions.Item>
                       </Descriptions>
                   </Card>
                   <Card title={<span><ShopOutlined /> Thông tin Xuất Hóa Đơn (VAT)</span>} style={{marginBottom: 20}}>
                       <Descriptions column={1} size="small" bordered>
                           <Descriptions.Item label="Công ty">{data.vat_company_name || '-'}</Descriptions.Item>
                           <Descriptions.Item label="MST">{data.vat_tax_code || '-'}</Descriptions.Item>
                           <Descriptions.Item label="Địa chỉ">{data.vat_address || '-'}</Descriptions.Item>
                       </Descriptions>
                   </Card>
                   <Card title={<span><DollarOutlined /> Thông tin Thanh toán</span>} style={{marginBottom: 20}}>
                       <div style={{background:'#f6ffed', padding:10, borderRadius:4, border:'1px solid #b7eb8f', textAlign:'center', marginBottom:10}}>
                           <div style={{color:'#666'}}>Số tiền còn lại phải thanh toán:</div>
                           <div style={{fontSize:20, fontWeight:'bold', color:'#cf1322'}}>{(Number(data.total_amount) - Number(data.paid_amount)).toLocaleString()} ₫</div>
                       </div>
                       <div style={{textAlign:'center', margin: '15px 0'}}><img src={`https://img.vietqr.io/image/ACB-141847859-compact2.jpg?amount=${Math.floor(Number(data.total_amount) - Number(data.paid_amount))}&addInfo=${data.order_code}&accountName=CTY TNHH TM DV TUONG LINH`} alt="VietQR" style={{maxWidth: '100%', border: '1px solid #eee', borderRadius: 8}}/><div style={{fontSize:12, color:'#999', marginTop:5}}>Mở App Ngân hàng để quét</div></div>
                       <p><b>Ngân hàng:</b> ACB - Chi nhánh TP.HCM</p><p><b>Số TK:</b> 141847859</p><p><b>Chủ TK:</b> CTY TNHH TM DV TƯỜNG LINH</p><p><b>Nội dung:</b> {data.order_code}</p>
                   </Card>
                   <Card title="💬 Trao đổi / Ghi chú" className="comment-widget">
                        <div style={{maxHeight: 400, overflowY:'auto', paddingRight:5}}>
                            <List dataSource={visibleComments} renderItem={(item:any) => (<List.Item style={{padding:'10px 0'}}><List.Item.Meta avatar={<Avatar style={{backgroundColor: item.sender_type === 'CUSTOMER' ? '#87d068' : '#1890ff'}} icon={item.sender_type === 'CUSTOMER' ? <UserOutlined/> : <SolutionOutlined/>} />} title={<div style={{fontSize:12, color:'#999'}}>{item.sender_name} - {dayjs(item.created_at).format('DD/MM HH:mm')}</div>} description={<div style={{color:'#333', background:'#f5f5f5', padding:8, borderRadius:6}}>{item.content}</div>} /></List.Item>)} />
                        </div>
                        <Divider style={{margin:'10px 0'}} />
                        <div style={{display:'flex', gap:5}}><Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Nhập tin nhắn..." onPressEnter={(e)=>{if(!e.shiftKey) {e.preventDefault(); handleSendComment()}}} /><Button type="primary" icon={<SendOutlined/>} onClick={handleSendComment} /></div>
                   </Card>
               </Col>
               
               {/* SỬ DỤNG TABLE TRỰC TIẾP THAY VÌ COMPONENT ĐỂ DỄ CẤU HÌNH CỘT MÔ TẢ */}
               <Col span={16} xs={24} md={16}>
                   <Card title="📄 Chi Tiết Báo Giá / Đơn Hàng" style={{marginBottom: 20}}>
                       <div style={{padding: 10}}>
                           <Table 
                               dataSource={data.items} 
                               columns={columns} 
                               rowKey="id" 
                               pagination={false} 
                               bordered 
                               summary={() => {
                                   const vatRate = data.vat_rate || 0;
                                   const subTotal = data.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
                                   const vatAmount = subTotal * (vatRate / 100);
                                   const total = subTotal + vatAmount + Number(data.shipping_fee || 0);
                                   
                                   return (
                                       <>
                                           <Table.Summary.Row>
                                               <Table.Summary.Cell index={0} colSpan={5} align="right"><b>Tổng tiền hàng:</b></Table.Summary.Cell>
                                               <Table.Summary.Cell index={1} align="right">{subTotal.toLocaleString()}</Table.Summary.Cell>
                                           </Table.Summary.Row>
                                           <Table.Summary.Row>
                                               <Table.Summary.Cell index={0} colSpan={5} align="right">Thuế VAT ({vatRate}%):</Table.Summary.Cell>
                                               <Table.Summary.Cell index={1} align="right">{vatAmount.toLocaleString()}</Table.Summary.Cell>
                                           </Table.Summary.Row>
                                           <Table.Summary.Row>
                                               <Table.Summary.Cell index={0} colSpan={5} align="right">Phí vận chuyển:</Table.Summary.Cell>
                                               <Table.Summary.Cell index={1} align="right">{Number(data.shipping_fee || 0).toLocaleString()}</Table.Summary.Cell>
                                           </Table.Summary.Row>
                                           <Table.Summary.Row style={{background: '#fafafa'}}>
                                               <Table.Summary.Cell index={0} colSpan={5} align="right"><b style={{fontSize: 16, color: '#1890ff'}}>TỔNG CỘNG:</b></Table.Summary.Cell>
                                               <Table.Summary.Cell index={1} align="right"><b style={{fontSize: 16, color: '#cf1322'}}>{total.toLocaleString()} ₫</b></Table.Summary.Cell>
                                           </Table.Summary.Row>
                                       </>
                                   );
                               }}
                           />
                           
                           {/* Điều khoản */}
                           {data.terms_content && (
                               <div style={{marginTop: 20, background: '#fffbe6', padding: 15, borderRadius: 6, border: '1px dashed #ffe58f'}}>
                                   <div style={{fontWeight: 600, marginBottom: 5}}>Điều khoản & Ghi chú:</div>
                                   <div style={{whiteSpace: 'pre-line', fontSize: 13}}>{data.terms_content}</div>
                               </div>
                           )}
                       </div>
                   </Card>
                   
                   {data.deliveries && data.deliveries.length > 0 && (
                       <Card title="📦 Lịch Sử Giao Hàng">
                           <Table dataSource={data.deliveries} rowKey="id" pagination={false} size="small" columns={[{ title: 'Ngày giao', render: (r:any)=>dayjs(r.delivery_date).format('DD/MM/YYYY') }, { title: 'Mã phiếu', dataIndex: 'code' }, { title: 'Ghi chú', dataIndex: 'note' }, { title: 'Chi tiết', render: (r:any)=>r.items.map((i:any)=>`${i.sku} (x${i.quantity})`).join(', ') }]} />
                       </Card>
                   )}
               </Col>
           </Row>
       </div>
    </div>
  );
};
export default PortalQuotePage;