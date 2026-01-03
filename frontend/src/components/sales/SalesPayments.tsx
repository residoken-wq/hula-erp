import AttachmentUpload from '../common/AttachmentUpload';
// ... existing imports

const SalesPayments: React.FC<Props> = ({ orderId, orderCode, totalAmount, paidAmount, customerName, onSuccess }) => {
    // ... existing state
    const [attachments, setAttachments] = useState<string[]>([]); // <--- Add State

    // ... handlePayment
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
                attachments: attachments // <--- Send attachments
            });

            message.success('Đã lưu thanh toán!');
            setIsModalOpen(false);
            setAmount(0);
            setNote('');
            setDate(dayjs());
            setAttachments([]); // <--- Reset

            await fetchHistory();
            onSuccess();
        } catch (e) {
            message.error('Lỗi lưu thanh toán');
        }
    };

    const openModal = () => {
        // ... existing
        const remain = totalAmount - realTimePaidAmount;
        setAmount(remain > 0 ? remain : 0);
        setNote('');
        setAttachments([]); // <--- Reset
        setIsModalOpen(true);
    };

    return (
        <div>
            {/* ... Statistics ... */}

            {/* ... Divider & Button ... */}

            <Table
                dataSource={history}
                // ...
                columns={[
                    // ... existing cols
                    { title: 'Số tiền', dataIndex: 'amount', align: 'right' as const, render: (v: any) => <b style={{ color: 'green' }}>{Number(v).toLocaleString()}</b>, width: 120 },
                    { title: 'Nội dung', dataIndex: 'description' },
                    { title: 'Chứng từ', render: (r: any) => r.attachments?.length > 0 ? <AttachmentUpload value={r.attachments} maxFiles={0} /> : '-' } // Read-only view
                ]}
            />

            <Modal title="Thêm Đợt Thanh Toán" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handlePayment}>
                {/* ... existing form items ... */}

                <Form.Item label="Ghi chú">
                    <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú..." />
                </Form.Item>

                <Form.Item label="Chứng từ kèm theo">
                    <AttachmentUpload value={attachments} onChange={setAttachments} />
                </Form.Item>
            </Modal>
        </div>
    );
};
export default SalesPayments;