import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spin, Result, Button, message, Modal, Input, Layout } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import QuotationTemplate from '../components/QuotationTemplate';
import { API_URL } from '../config';

const PortalQuotePage: React.FC = () => {
  const { uuid } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await axios.get(`${API_URL}/sales/portal/${uuid}`);
        setData(res.data);
      } catch (e) {
        setError('Báo giá không tồn tại hoặc đường dẫn sai.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [uuid]);

  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
      if (action === 'REJECT') {
          // TODO: Có thể thêm popup hỏi lý do
      }
      
      Modal.confirm({
          title: action === 'ACCEPT' ? 'Xác nhận đặt hàng?' : 'Từ chối báo giá?',
          content: action === 'ACCEPT' ? 'Hệ thống sẽ ghi nhận đơn hàng và nhân viên sẽ liên hệ lại.' : 'Bạn chắc chắn muốn từ chối báo giá này?',
          onOk: async () => {
              setActionLoading(true);
              try {
                  await axios.post(`${API_URL}/sales/portal/${uuid}/action`, { action });
                  message.success('Đã gửi phản hồi thành công!');
                  window.location.reload(); // Reload để cập nhật trạng thái
              } catch (e: any) {
                  message.error(e.response?.data?.message || 'Có lỗi xảy ra');
              } finally {
                  setActionLoading(false);
              }
          }
      });
  };

  if (loading) return <div style={{textAlign:'center', marginTop:100}}><Spin size="large" /></div>;
  if (error) return <Result status="404" title="404" subTitle={error} />;

  // Nếu đã xử lý rồi
  if (data.status !== 'QUOTATION') {
       return (
           <Result
            status="success"
            title="Báo giá này đã được xử lý"
            subTitle={`Trạng thái hiện tại: ${data.status}`}
           />
       );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '20px 0' }}>
       <div style={{ maxWidth: '210mm', margin: '0 auto', background: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
           {/* HEADER ACTIONS FOR CUSTOMER */}
           <div style={{ padding: 15, background: '#001529', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{fontWeight:'bold'}}>HULA PORTAL</div>
               <div style={{display:'flex', gap: 10}}>
                   <Button type="primary" danger icon={<CloseCircleOutlined/>} loading={actionLoading} onClick={()=>handleAction('REJECT')}>Từ chối</Button>
                   <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} icon={<CheckCircleOutlined/>} loading={actionLoading} onClick={()=>handleAction('ACCEPT')}>Xác nhận Đặt hàng</Button>
               </div>
           </div>
           
           <QuotationTemplate data={data} />
       </div>
    </div>
  );
};

export default PortalQuotePage;