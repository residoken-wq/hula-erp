import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// FIX: Thêm Space, Divider vào import
import { Spin, Result, Button, message, Modal, Steps, Typography, List, Input, Avatar, Row, Col, Card, Descriptions, Tag, Table, Space, Divider } from 'antd'; 
import { CheckCircleOutlined, SolutionOutlined, FileDoneOutlined, CarOutlined, DollarOutlined, UserOutlined, SendOutlined, ShopOutlined, PrinterOutlined } from '@ant-design/icons';
import QuotationTemplate from '../components/QuotationTemplate';
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

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: 40 }}>
       {/* HEADER BAR */}
       <div style={{background:'#fff', padding: '15px 40px', boxShadow: '0 2px 8px #f0f1f2', position:'sticky', top:0, zIndex:100}}>
           <Row justify="space-between" align="middle">
               <Col>
                   <Title level={4} style={{margin:0, color:'#1890ff'}}>HULA ERP PORTAL</Title>
                   <Text type="secondary">Mã đơn: <b>{data.order_code}</b></Text>
               </Col>
               <Col>
                   <Button icon={<PrinterOutlined />} onClick={() => window.print()}>In Đơn Hàng</Button>
               </Col>
           </Row>
           <div style={{marginTop: 20, maxWidth: 900, margin: '20px auto 0'}}>
                <Steps current={currentStep} size="small" items={[
                   { title: 'Báo Giá', icon: <SolutionOutlined /> },
                   { title: 'Duyệt Mẫu', icon: <FileDoneOutlined /> },
                   { title: 'Đặt Cọc', icon: <DollarOutlined /> }, 
                   { title: 'Giao Hàng', icon: <CarOutlined /> },
                   { title: 'Hoàn Tất', icon: <CheckCircleOutlined /> },
               ]} />
           </div>
       </div>

       {/* ACTION BAR */}
       {data.status === 'QUOTATION' && (
           <div style={{ background: '#001529', color: '#fff', padding: 15, textAlign: 'center' }}>
               <Space size="large">
                   <span>Vui lòng phản hồi báo giá này:</span>
                   <Button type="primary" danger onClick={()=>handleAction('REJECT')}>Từ chối</Button>
                   <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} onClick={()=>handleAction('ACCEPT')}>Xác nhận Đồng ý</Button>
               </Space>
           </div>
       )}

       <div style={{ padding: '20px 40px', maxWidth: 1400, margin: '0 auto' }}>
           <Row gutter={24}>
               {/* --- LEFT COLUMN --- */}
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
                           <div style={{fontSize:20, fontWeight:'bold', color:'#cf1322'}}>
                               {(Number(data.total_amount) - Number(data.paid_amount)).toLocaleString()} ₫
                           </div>
                       </div>
                       <p><b>Ngân hàng:</b> ACB - Chi nhánh TP.HCM</p>
                       <p><b>Số TK:</b> 141847859</p>
                       <p><b>Chủ TK:</b> CTY TNHH TM DV TƯỜNG LINH</p>
                       <p><b>Nội dung:</b> {data.order_code}</p>
                   </Card>

                   <Card title="💬 Trao đổi / Ghi chú" className="comment-widget">
                        <div style={{maxHeight: 400, overflowY:'auto', paddingRight:5}}>
                            <List dataSource={visibleComments} renderItem={(item:any) => (
                                <List.Item style={{padding:'10px 0'}}>
                                    <List.Item.Meta 
                                        avatar={<Avatar style={{backgroundColor: item.sender_type === 'CUSTOMER' ? '#87d068' : '#1890ff'}} icon={item.sender_type === 'CUSTOMER' ? <UserOutlined/> : <SolutionOutlined/>} />}
                                        title={<div style={{fontSize:12, color:'#999'}}>{item.sender_name} - {dayjs(item.created_at).format('DD/MM HH:mm')}</div>}
                                        description={<div style={{color:'#333', background:'#f5f5f5', padding:8, borderRadius:6}}>{item.content}</div>}
                                    />
                                </List.Item>
                            )} />
                        </div>
                        <Divider style={{margin:'10px 0'}} />
                        <div style={{display:'flex', gap:5}}>
                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Nhập tin nhắn..." onPressEnter={(e)=>{if(!e.shiftKey) {e.preventDefault(); handleSendComment()}}}/>
                            <Button type="primary" icon={<SendOutlined/>} onClick={handleSendComment} />
                        </div>
                   </Card>
               </Col>

               {/* --- RIGHT COLUMN --- */}
               <Col span={16} xs={24} md={16}>
                   <Card title="📄 Chi Tiết Đơn Hàng" style={{marginBottom: 20}}>
                        <div className="quotation-wrapper">
                            <QuotationTemplate data={data} />
                        </div>
                   </Card>

                   {data.deliveries && data.deliveries.length > 0 && (
                       <Card title="📦 Lịch Sử Giao Hàng">
                           <Table dataSource={data.deliveries} rowKey="id" pagination={false} size="small" columns={[
                               { title: 'Ngày giao', render: (r:any)=>dayjs(r.delivery_date).format('DD/MM/YYYY') },
                               { title: 'Mã phiếu', dataIndex: 'code' },
                               { title: 'Ghi chú', dataIndex: 'note' },
                               { title: 'Chi tiết', render: (r:any)=>r.items.map((i:any)=>`${i.sku} (x${i.quantity})`).join(', ') }
                           ]} />
                       </Card>
                   )}
               </Col>
           </Row>
       </div>
    </div>
  );
};
export default PortalQuotePage;