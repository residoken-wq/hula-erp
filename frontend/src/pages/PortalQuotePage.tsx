import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spin, Result, Button, message, Modal, Steps, Checkbox, Typography, List, Input, Divider, Avatar, Row, Col, Table } from 'antd'; 
import { CheckCircleOutlined, CloseCircleOutlined, SolutionOutlined, FileDoneOutlined, CarOutlined, DollarOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import QuotationTemplate from '../components/QuotationTemplate';
import { API_URL } from '../config';
import dayjs from 'dayjs';

const { Title } = Typography;

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
  if (!data) return <Result status="404" title="404" subTitle="Không tìm thấy báo giá" />;

  const currentStep = ['QUOTATION','SO_PENDING','SAMPLE_APPROVED','DEPOSITED','PLANNED','PARTIAL_DELIVERY','DELIVERED','COMPLETED','CANCELLED'].indexOf(data.status);
  const visibleComments = (data.comments || []).filter((c:any) => c.sender_type === 'CUSTOMER' || c.is_visible);

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '20px 0' }}>
       <div style={{ maxWidth: '210mm', margin: '0 auto', background: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
           
           <div style={{padding: '20px 40px', background:'#fff', borderBottom:'1px solid #eee'}}>
               <Steps current={currentStep > 4 ? 3 : currentStep} size="small" items={[
                   { title: 'Báo Giá', icon: <SolutionOutlined /> },
                   { title: 'Duyệt Mẫu', icon: <FileDoneOutlined /> },
                   { title: 'Đặt Cọc', icon: <DollarOutlined /> }, 
                   { title: 'Giao Hàng', icon: <CarOutlined /> },
                   { title: 'Hoàn Tất', icon: <CheckCircleOutlined /> },
               ]} />
           </div>

           {!['QUOTATION','CANCELLED'].includes(data.status) && (
             <div style={{padding: '15px', background:'#f6ffed', borderBottom:'1px solid #b7eb8f', textAlign:'center', fontWeight:'bold', color:'green'}}>
                 TRẠNG THÁI HIỆN TẠI: {data.status}
             </div>
           )}

           {data.status === 'QUOTATION' && (
               <div style={{ padding: 15, background: '#001529', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>Vui lòng phản hồi báo giá:</div>
                   <div style={{display:'flex', gap: 10}}>
                       <Button type="primary" danger onClick={()=>handleAction('REJECT')}>Từ chối</Button>
                       <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} onClick={()=>handleAction('ACCEPT')}>Xác nhận Báo Giá</Button>
                   </div>
               </div>
           )}
           
           <QuotationTemplate data={data} />

           {/* --- DELIVERY INFO --- */}
           {data.deliveries && data.deliveries.length > 0 && (
               <div style={{padding: 40, borderTop: '5px solid #f0f2f5'}}>
                   <Title level={4}>📦 Lịch Sử Giao Hàng</Title>
                   <Table dataSource={data.deliveries} rowKey="id" pagination={false} size="small" columns={[
                       { title: 'Ngày giao', render: (r:any)=>dayjs(r.delivery_date).format('DD/MM/YYYY') },
                       { title: 'Mã phiếu', dataIndex: 'code' },
                       { title: 'Ghi chú', dataIndex: 'note' },
                       { title: 'Chi tiết', render: (r:any)=>r.items.map((i:any)=>`${i.sku} (x${i.quantity})`).join(', ') }
                   ]} />
               </div>
           )}

           {/* --- COMMENTS --- */}
           <div style={{padding: 40, borderTop: '5px solid #f0f2f5', background:'#fafafa'}}>
               <Title level={4}>💬 Trao Đổi / Ghi Chú</Title>
               <List dataSource={visibleComments} renderItem={(item:any) => (
                   <List.Item>
                       <List.Item.Meta 
                           avatar={<Avatar icon={<UserOutlined />} style={{backgroundColor: item.sender_type === 'CUSTOMER' ? '#87d068' : '#1890ff'}} />}
                           title={<span>{item.sender_name} <small style={{color:'#999'}}>{dayjs(item.created_at).format('DD/MM HH:mm')}</small></span>}
                           description={item.content}
                       />
                   </List.Item>
               )} />
               <div style={{display:'flex', gap:10, marginTop:10}}>
                   <Input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Nhập nội dung trao đổi với nhân viên..." onPressEnter={handleSendComment}/>
                   <Button type="primary" icon={<SendOutlined/>} onClick={handleSendComment}>Gửi</Button>
               </div>
           </div>
       </div>
    </div>
  );
};
export default PortalQuotePage;