import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Statistic, Row, Col, Divider, Modal, Form, InputNumber, Radio, Input, message, DatePicker } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../../config';
import AttachmentUpload from '../common/AttachmentUpload';

interface Props {
    orderId: number;
    orderCode: string;
    totalAmount: number;
    paidAmount: number;
    customerName?: string;
    onSuccess: () => void;
}

const SalesPayments: React.FC<Props> = ({ orderId, orderCode, totalAmount, paidAmount, customerName, onSuccess }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState<number>(0);
    const [type, setType] = useState('DEPOSIT');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(dayjs());
    const [attachments, setAttachments] = useState<string[]>([]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/${orderCode}/payment-history`);
            setHistory(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [orderCode]);

    const realTimePaidAmount = useMemo(() => {
        return Math.round(history.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    }, [history]);

    const remainingAmount = Math.round(totalAmount - realTimePaidAmount);

    const handlePayment = async () => {
        if (amount <= 0) return message.warning('Nhập số tiền hợp lệ');

        const prefix = type === 'DEPOSIT' ? '[ĐẶT CỌC]' : type === 'FINAL' ? '[TẤT TOÁN]' : '[THANH TOÁN]';
        const finalNote = `${prefix} ${note}`.trim();

        try {
            await axios.post(`${API_URL}/finance/payment`, {
                type: 'INCOME',
                amount,
                refCode: orderCode,
                note: finalNote,
                customerName: customerName,
                date: date,
                attachments: attachments
            });

            message.success('Đã lưu thanh toán!');
            setIsModalOpen(false);
            setAmount(0);
            setNote('');
            setDate(dayjs());
            setAttachments([]);

            await fetchHistory(); // Load lại history -> Tự động update realTimePaidAmount
            onSuccess(); // Báo cho parent reload nếu cần
        } catch (e) {
            message.error('Lỗi lưu thanh toán');
        }
    };

    const openModal = () => {
        // Gợi ý số tiền còn lại khi mở modal
        const remain = totalAmount - realTimePaidAmount;
        setAmount(remain > 0 ? remain : 0);
        setNote('');
        setAttachments([]);
        setIsModalOpen(true);
    };

    return (
        <div>
            <Row gutter={16}>
                <Col span={8}>
                    <Statistic title="Tổng giá trị" value={totalAmount} suffix="đ" />
                </Col>
                <Col span={8}>
                    {/* Sử dụng realTimePaidAmount thay vì paidAmount */}
                    <Statistic
                        title="Đã thanh toán"
                        value={realTimePaidAmount}
                        valueStyle={{ color: 'green' }}
                        suffix="đ"
                    />
                </Col>
                <Col span={8}>
                    {/* Sử dụng remainingAmount đã tính toán lại */}
                    <Statistic
                        title="Còn lại"
                        value={remainingAmount}
                        valueStyle={{ color: remainingAmount > 0 ? 'red' : 'gray' }}
                        suffix="đ"
                    />
                </Col>
            </Row>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <b>Lịch sử thanh toán:</b>
                {/* Chỉ cho phép thêm thanh toán nếu còn nợ */}
                <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={openModal}
                    disabled={remainingAmount <= 0}
                >
                    Thêm thanh toán
                </Button>
            </div>

            <Table
                dataSource={history}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
                columns={[
                    { title: 'Ngày tạo', dataIndex: 'created_at', render: (t: any) => dayjs(t).format('DD/MM/YYYY HH:mm'), width: 140 },
                    { title: 'Ngày thanh toán', dataIndex: 'date', render: (t: any) => t ? dayjs(t).format('DD/MM/YYYY HH:mm') : '-', width: 140 },
                    { title: 'Số tiền', dataIndex: 'amount', align: 'right' as const, render: (v: any) => <b style={{ color: 'green' }}>{Number(v).toLocaleString()}</b>, width: 120 },
                    { title: 'Nội dung', dataIndex: 'description' },
                    { title: 'Chứng từ', render: (r: any) => r.attachments?.length > 0 ? <AttachmentUpload value={r.attachments} maxFiles={0} /> : '-' }
                ]}
            />

            <Modal title="Thêm Đợt Thanh Toán" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handlePayment}>
                <Form layout="vertical">
                    <Form.Item label="Ngày thanh toán">
                        <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            value={date}
                            onChange={(d) => setDate(d || dayjs())}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item label="Số tiền">
                        <InputNumber
                            style={{ width: '100%' }}
                            value={amount}
                            onChange={(v: any) => setAmount(v)}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            addonAfter="₫"
                            max={remainingAmount} // Không cho nhập quá số tiền còn lại
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
                    <Form.Item label="Chứng từ kèm theo">
                        <AttachmentUpload value={attachments} onChange={setAttachments} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default SalesPayments;