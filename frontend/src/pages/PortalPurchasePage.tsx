import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spin, Result, Button, message, Modal, Descriptions, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { API_URL } from '../config';
import dayjs from 'dayjs';

const { Title } = Typography;

const PortalPurchasePage: React.FC = () => {
  const { uuid } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/purchasing/portal/${uuid}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleConfirm = () => {
      Modal.confirm({
          title: 'Xác nhận cung cấp?',
          content: 'Bạn xác nhận sẽ giao hàng đúng hạn và đủ số lượng?',
          onOk: async () => {
              await axios.post(`${API_URL}/purchasing/portal/${uuid}/action`, { action: 'CONFIRM' });
              message.success('Đã xác nhận!');
              window.location.reload();
          }
      });
  };

  if (loading) return <Spin size="large" style={{margin:'100px auto', display:'block'}} />;
  if (!data) return <Result status="404" title="Không tìm thấy đơn hàng" />;

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: '0 auto', background: '#fff' }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #1890ff', paddingBottom:15, marginBottom:20}}>
            <div>
                <Title level={3} style={{margin:0, color:'#1890ff'}}>ĐƠN ĐẶT HÀNG (PO)</Title>
                <span>Mã: <b>{data.po_code}</b></span>
            </div>
            {data.status === 'SENT' && <Button type="primary" size="large" icon={<CheckCircleOutlined/>} onClick={handleConfirm}>Xác nhận cung cấp</Button>}
            {data.status === 'CONFIRMED' && <Tag color="green" style={{fontSize:16, padding:8}}>ĐÃ XÁC NHẬN</Tag>}
        </div>

        <Descriptions bordered column={2}>
            <Descriptions.Item label="Ngày đặt">{dayjs(data.created_at).format('DD/MM/YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Ngày giao dự kiến"><b>{dayjs(data.expected_delivery_date).format('DD/MM/YYYY')}</b></Descriptions.Item>
            <Descriptions.Item label="Địa chỉ giao">{data.delivery_address || 'Kho Công Ty'}</Descriptions.Item>
            <Descriptions.Item label="Thanh toán">{data.payment_term}</Descriptions.Item>
        </Descriptions>

        <Table 
            style={{marginTop: 20}}
            dataSource={data.items}
            pagination={false}
            bordered
            columns={[
                { title: 'Tên hàng / Công đoạn', render: (r:any) => r.material?.name || r.product?.name || r.description },
                { title: 'ĐVT', render: (r:any) => r.material?.unit || r.product?.unit || 'Cái' },
                { title: 'Số lượng', dataIndex: 'quantity', align:'center' as const },
                { title: 'Đơn giá', dataIndex: 'unit_price', align:'right' as const, render: (v:any)=>Number(v).toLocaleString() },
                { title: 'Thành tiền', dataIndex: 'subtotal', align:'right' as const, render: (v:any)=><b>{Number(v).toLocaleString()}</b> }
            ]}
            summary={(pageData) => {
                let total = 0;
                pageData.forEach(({ subtotal }) => { total += Number(subtotal); });
                return (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right"><b>Tổng cộng</b></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right"><b>{total.toLocaleString()}</b></Table.Summary.Cell>
                    </Table.Summary.Row>
                );
            }}
        />
        <div style={{marginTop:20, fontStyle:'italic'}}>Ghi chú: {data.note}</div>
    </div>
  );
};
export default PortalPurchasePage;