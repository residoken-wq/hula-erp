import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spin, Result, Button, message, Modal, Steps, Tag } from 'antd';
// FIX: Thêm DollarOutlined vào danh sách import
import { CheckCircleOutlined, CloseCircleOutlined, SolutionOutlined, FileDoneOutlined, CarOutlined, DollarOutlined } from '@ant-design/icons';
import QuotationTemplate from '../components/QuotationTemplate';
import { API_URL } from '../config';
import { Checkbox } from 'antd'; // Import Checkbox

const PortalQuotePage: React.FC = () => {
  const { uuid } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/sales/portal/${uuid}`)
      .then(res => setData(res.data))
      .catch(() => setError('Không tìm thấy báo giá hoặc đường dẫn không hợp lệ.'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
      Modal.confirm({
          title: action === 'ACCEPT' ? 'Xác nhận Báo giá?' : 'Từ chối?',
          content: action === 'ACCEPT' ? 'Sau khi xác nhận, nhân viên sẽ liên hệ để Duyệt Mẫu và Ký Hợp Đồng.' : '',
          onOk: async () => {
              setActionLoading(true);
              try {
                  await axios.post(`${API_URL}/sales/portal/${uuid}/action`, { action });
                  message.success('Đã gửi phản hồi!');
                  window.location.reload();
              } catch (e: any) { message.error(e.response?.data?.message || 'Lỗi'); }
              finally { setActionLoading(false); }
          }
      });
  };

  if (loading) return <div style={{textAlign:'center', marginTop:100}}><Spin size="large" /></div>;
  if (error) return <Result status="404" title="404" subTitle={error} />;

  // --- LOGIC HIỂN THỊ TIẾN ĐỘ ---
  let currentStep = 0;
  if (data.status === 'QUOTATION') currentStep = 0;
  else if (data.status === 'SO_PENDING') currentStep = 1; // Đang duyệt mẫu
  else if (['DEPOSITED', 'PLANNED'].includes(data.status)) currentStep = 2; // Đã cọc/SX
  else if (['SHIPPING', 'PARTIAL_DELIVERY', 'DELIVERED'].includes(data.status)) currentStep = 3;
  else if (data.status === 'COMPLETED') currentStep = 4;
  else if (data.status === 'CANCELLED') currentStep = -1;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '20px 0' }}>
       <div style={{ maxWidth: '210mm', margin: '0 auto', background: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
           
           {/* HEADER STATUS */}
           <div style={{padding: '20px 40px', background:'#fff', borderBottom:'1px solid #eee'}}>
               <Steps current={currentStep} size="small" items={[
                   { title: 'Báo Giá', icon: <SolutionOutlined /> },
                   { title: 'Duyệt Mẫu & HĐ', description: 'Chốt màu/size', icon: <FileDoneOutlined /> },
                   { title: 'Đặt Cọc & SX', icon: <DollarOutlined /> }, // Icon này đã được import
                   { title: 'Giao Hàng', icon: <CarOutlined /> },
                   { title: 'Hoàn Tất', icon: <CheckCircleOutlined /> },
               ]} />
           </div>

           {/* ACTION BAR (Chỉ hiện khi đang là QUOTATION) */}
           {data.status === 'QUOTATION' && (
               <div style={{ padding: 15, background: '#001529', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>Vui lòng phản hồi báo giá này:</div>
                   <div style={{display:'flex', gap: 10}}>
                       <Button type="primary" danger icon={<CloseCircleOutlined/>} loading={actionLoading} onClick={()=>handleAction('REJECT')}>Từ chối</Button>
                       <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} icon={<CheckCircleOutlined/>} loading={actionLoading} onClick={()=>handleAction('ACCEPT')}>Xác nhận Báo Giá</Button>
                   </div>
               </div>
           )}

            {/* STATUS CHECKBOXES FOR CUSTOMER */}
            {!['QUOTATION','CANCELLED'].includes(data.status) && (
            <div style={{padding: '20px 40px', background:'#f6ffed', borderBottom:'1px solid #b7eb8f', display:'flex', gap: 30, justifyContent:'center'}}>
                <Checkbox checked={['DEPOSITED','PLANNED','PARTIAL_DELIVERY','DELIVERED','COMPLETED'].includes(data.status)} style={{fontWeight:'bold', fontSize:16}}>ĐÃ ĐẶT CỌC</Checkbox>
                
                <Checkbox checked={['PARTIAL_DELIVERY','DELIVERED','COMPLETED'].includes(data.status)} style={{fontWeight:'bold', fontSize:16}}>
                    ĐANG GIAO HÀNG 
                    {data.status === 'PARTIAL_DELIVERY' && <span style={{fontSize:12, fontWeight:'normal', color:'#666'}}> (Giao 1 phần)</span>}
                </Checkbox>
                
                <Checkbox checked={data.status === 'COMPLETED'} style={{fontWeight:'bold', fontSize:16}}>HOÀN TẤT ĐƠN HÀNG</Checkbox>
            </div>
            )}

           {/* ALERTS */}
           {data.status === 'SO_PENDING' && <div style={{padding:15, background:'#fffbe6', textAlign:'center', border:'1px solid #ffe58f'}}>🎉 Cảm ơn Quý khách đã xác nhận! Nhân viên kinh doanh sẽ liên hệ để tiến hành <b>Duyệt Mẫu</b>.</div>}
           {data.status === 'CANCELLED' && <div style={{padding:15, background:'#fff1f0', textAlign:'center', color:'red'}}>Báo giá này đã bị hủy.</div>}
           
           <QuotationTemplate data={data} />
       </div>
    </div>
  );
};

export default PortalQuotePage;