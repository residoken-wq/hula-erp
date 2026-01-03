import AttachmentUpload from '../common/AttachmentUpload';
// ... existing imports

const SalesDeliveries: React.FC<Props> = ({ order, products, customers = [], onSuccess }) => {
    // ... existing state
    const [attachments, setAttachments] = useState<string[]>([]); // <--- Add State

    // ... existing fetchHistory

    const openCreateModal = () => {
        setEditingDeliveryId(null);
        // ... existing reset logic
        setAttachments([]); // <--- Reset
        setIsModalOpen(true);
    };

    const openEditModal = (delivery: any) => {
        setEditingDeliveryId(delivery.id);
        // ... existing set logic
        setAttachments(delivery.attachments || []); // <--- Load existing
        setIsModalOpen(true);
    };

    const handleShip = async () => {
        try {
            const payload = {
                // ... existing payload fields
                attachments: attachments, // <--- Send attachments
                items: shipItems.filter(i => i.quantity > 0)
            };
            // ... API calls
        } catch (e) { message.error('Lỗi lưu phiếu xuất kho'); }
    };

    return (
        <div>
            {/* ... Summary Table ... */}

            <Table dataSource={history} rowKey="id" pagination={false} size="small" bordered columns={[
                // ... existing columns
                { title: 'Chứng từ', render: (r) => r.attachments?.length > 0 ? <AttachmentUpload value={r.attachments} maxFiles={0} /> : '-' }, // Read-only view
                // ... existing action columns
            ]} />

            <Modal title={editingDeliveryId ? "Cập nhật Phiếu Xuất Kho" : "Tạo Phiếu Xuất Kho"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handleShip} width={600}>
                {/* ... existing fields ... */}

                <AttachmentUpload value={attachments} onChange={setAttachments} /> {/* <--- Add Component */}

                <div style={{ fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Danh sách xuất:</div>
                {/* ... Items Table ... */}
            </Modal>
        </div>
    );
}

export default SalesDeliveries;