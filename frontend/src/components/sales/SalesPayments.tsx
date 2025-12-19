import React, { useEffect, useState } from 'react';
import { Table, Button, Statistic, Row, Col, Divider, Modal, Form, InputNumber, Radio, Input, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../../config'; // <--- FIX: Lùi 2 cấp thư mục

interface Props { 
    orderId: number; 
    orderCode: string; 
    totalAmount: number; 
    paidAmount: number; 
    onSuccess: () => void; 
}

const SalesPayments: React.FC<Props> = ({ orderId, orderCode, totalAmount, paidAmount, onSuccess }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState<number>(0);
    const [type, setType] = useState('DEPOSIT');
    const [note, setNote] = useState('');

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/${orderCode}/payments`);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (e) {}
    };

    useEffect(() => { 
        if (orderCode) fetchHistory(); 
    }, [orderCode, paidAmount]);

    const handlePayment = async () => {
        if (amount <= 0) return message.warning('Nhập số tiền hợp lệ');
        
        const prefix = type === 'DEPOSIT' ? '[ĐẶT CỌC]' : type === 'FINAL' ? '[TẤT TOÁN]' : '[THANH TOÁN]';
        const finalNote = `${prefix} ${note}`.trim();

        try {
            await axios.post(`${API_URL}/finance/payment`, {
                type: 'INCOME', 
                amount, 
                refCode: orderCode,
                note: finalNote
            });
            
            message.success('Đã lưu thanh toán!'); 
            setIsModalOpen(false); 
            setAmount(0);
            setNote('');
            
            fetchHistory(); 
            onSuccess();
        } catch (e) { 
            message.error('Lỗi lưu thanh toán'); 
        }
    };

    const openModal = () => {
        const remain = totalAmount - paidAmount;
        setAmount(remain > 0 ? remain : 0);
        setNote('');
        setIsModalOpen(true);
    };

    return (
        <div>
            <Row gutter={16}>
                <Col span={8}><Statistic title="Tổng giá trị" value={totalAmount} suffix="đ" /></Col>
                <Col span={8}><Statistic title="Đã thanh toán" value={paidAmount} valueStyle={{ color: 'green' }} suffix="đ" /></Col>
                <Col span={8}><Statistic title="Còn lại" value={totalAmount - paidAmount} valueStyle={{ color: 'red' }} suffix="đ" /></Col>
            </Row>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <b>Lịch sử thanh toán:</b>
                <Button type="primary" icon={<DollarOutlined />} onClick={openModal}>Thêm thanh toán</Button>
            </div>
            
            <Table 
                dataSource={history} 
                rowKey="id" 
                pagination={false} 
                size="small" 
                bordered 
                columns={[
                    { title: 'Ngày', dataIndex: 'created_at', render: (t: any) => dayjs(t).format('DD/MM/YYYY HH:mm') },
                    { title: 'Số tiền', dataIndex: 'amount', align: 'right' as const, render: (v: any) => <b style={{ color: 'green' }}>{Number(v).toLocaleString()}</b> },
                    { title: 'Nội dung', dataIndex: 'description' } 
                ]} 
            />

            <Modal title="Thêm Đợt Thanh Toán" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handlePayment}>
                <Form layout="vertical">
                    <Form.Item label="Số tiền">
                        <InputNumber 
                            style={{ width: '100%' }} 
                            value={amount} 
                            onChange={(v:any) => setAmount(v)} 
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                            addonAfter="₫"
                        />
                    </Form.Item>
                    <Form.Item label="Loại">
                        <Radio.Group value={type} onChange={e => setType(e.target.value)} buttonStyle="solid">
                            <Radio.Button value="DEPOSIT">Đặt Cọc</Radio.Button>
                            <Radio.Button value="PAYMENT">Thanh Toán</Radio.Button>
                            <Radio.Button value="FINAL">Tất Toán</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Ghi chú">
                        <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default SalesPayments;