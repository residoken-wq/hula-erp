import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Button, Checkbox, Row, Col, Input, Divider, Card, Image } from 'antd';
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AttachmentUpload from '../common/AttachmentUpload';

interface Props {
    open: boolean;
    onCancel: () => void;
    initialData: any; // Order Data
    templates: any[]; // Contract Templates
}

const ContractBuilderModal: React.FC<Props> = ({ open, onCancel, initialData, templates }) => {
    const [form] = Form.useForm();
    const [appendixImages, setAppendixImages] = useState<string[]>([]);
    const [previewHtml, setPreviewHtml] = useState('');

    // Initial Setup
    useEffect(() => {
        if (open && initialData) {
            // Pre-fill images from order items if available
            const itemImages = initialData.items?.filter((i: any) => i.image_url).map((i: any) => i.image_url) || [];
            // Remove duplicates
            setAppendixImages([...new Set(itemImages)] as string[]);

            form.setFieldsValue({
                template_id: templates.length > 0 ? templates[0].id : undefined,
                include_product_list: true,
                sign_date: dayjs()
            });
            handleGeneratePreview(); // Initial preview
        }
    }, [open, initialData, templates]);

    const handleGeneratePreview = async () => {
        const values = form.getFieldsValue();
        const template = templates.find(t => t.id === values.template_id);

        if (!template) {
            setPreviewHtml('<div style="padding:20px; text-align:center; color:#999">Vui lòng chọn mẫu hợp đồng</div>');
            return;
        }

        let content = template.content;

        // 1. Prepare Data
        const data = {
            customer_name: initialData.customer?.name || '...',
            customer_address: initialData.customer?.address || '...',
            customer_tax_code: initialData.customer?.tax_code || '...',
            customer_representative: initialData.customer?.representative_name || '...',
            customer_position: initialData.customer?.representative_position || 'Giám Đốc',

            order_code: initialData.order_code || '...',
            order_date: dayjs(initialData.order_date).format('DD/MM/YYYY'),
            total_amount_text: (initialData.total_amount || 0).toLocaleString() + ' đ',

            // Custom fields that might be in the form (placeholder)
            ...values,
            sign_date: values.sign_date ? dayjs(values.sign_date).format('DD/MM/YYYY') : '...'
        };

        // 2. Replace Placeholders
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, (data as any)[key]);
        });

        // 3. Generate Appendix
        let appendixHtml = '';

        // Product List
        if (values.include_product_list) {
            appendixHtml += `
                <div style="page-break-before: always;">
                    <h3 style="text-align: center; text-transform: uppercase; margin-top: 30px;">Phụ Lục 01: Danh Sách Sản Phẩm</h3>
                    <table border="1" style="width:100%; border-collapse:collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background:#f5f5f5">
                                <th style="padding: 8px;">STT</th>
                                <th style="padding: 8px;">Hình ảnh</th>
                                <th style="padding: 8px;">Tên sản phẩm / SKU</th>
                                <th style="padding: 8px;">Số lượng</th>
                                <th style="padding: 8px;">Đơn giá</th>
                                <th style="padding: 8px;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${initialData.items?.map((item: any, index: number) => `
                                <tr>
                                    <td style="text-align:center; padding: 8px;">${index + 1}</td>
                                    <td style="text-align:center; padding: 8px;">
                                        ${item.image_url ? `<img src="${item.image_url}" style="width: 50px; height: 50px; object-fit: cover;" />` : ''}
                                    </td>
                                    <td style="padding: 8px;">
                                        <div><b>${item.sku || 'SP'}</b></div>
                                        <div style="font-size: 12px; color: #666;">${item.product?.name || ''}</div>
                                    </td>
                                    <td style="text-align:center; padding: 8px;">${item.quantity}</td>
                                    <td style="text-align:right; padding: 8px;">${(item.unit_price || 0).toLocaleString()}</td>
                                    <td style="text-align:right; padding: 8px;">${(item.total_price || 0).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                             <tr>
                                <td colspan="5" style="text-align:right; padding: 8px; font-weight:bold">Tổng cộng:</td>
                                <td style="text-align:right; padding: 8px; font-weight:bold">${(initialData.total_amount || 0).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }

        // Images Appendix
        if (appendixImages.length > 0) {
            appendixHtml += `
                <div style="page-break-before: always;">
                    <h3 style="text-align: center; text-transform: uppercase; margin-top: 30px;">Phụ Lục 02: Hình Ảnh Tham Khảo</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;">
                        ${appendixImages.map(img => `
                            <div style="text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
                                <img src="${img}" style="max-width: 300px; max-height: 300px; object-fit: contain;" />
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Replace {{items_table}} if it exists in main content (legacy support), otherwise append to end
        if (content.includes('{{items_table}}')) {
            content = content.replace('{{items_table}}', ''); // Clear placeholder to avoid dupes if we append
        }

        // Append Appendix
        content += appendixHtml;

        setPreviewHtml(content);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>In Hợp Đồng - ${initialData.order_code}</title>
                        <style>
                            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 40px; }
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #000; padding: 5px; }
                            @media print {
                                @page { margin: 2cm; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>${previewHtml}</body>
                </html>
            `);
            printWindow.document.close();
            // Wait for images to load?
            setTimeout(() => {
                printWindow.print();
            }, 1000);
        }
    };

    const handleResetImages = () => {
        const itemImages = initialData.items?.filter((i: any) => i.image_url).map((i: any) => i.image_url) || [];
        setAppendixImages([...new Set(itemImages)] as string[]);
        setTimeout(handleGeneratePreview, 200);
    }

    return (
        <Modal
            title={<span style={{ fontWeight: 'bold' }}>📄 Soạn Thảo Hợp Đồng</span>}
            open={open}
            onCancel={onCancel}
            width={1200}
            style={{ top: 20 }}
            footer={[
                <Button key="cancel" onClick={onCancel}>Đóng</Button>,
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} size="large">
                    In Hợp Đồng
                </Button>
            ]}
        >
            <Row gutter={24} style={{ height: '70vh' }}>
                <Col span={8} style={{ borderRight: '1px solid #f0f0f0', height: '100%', overflowY: 'auto', paddingRight: 10 }}>
                    <Form form={form} layout="vertical" onValuesChange={() => setTimeout(handleGeneratePreview, 200)}>
                        <Card title="1. Thông Tin Chung" size="small" bordered={false}>
                            <Form.Item name="template_id" label="Mẫu Hợp Đồng">
                                <Select options={templates.map(t => ({ label: t.name, value: t.id }))} />
                            </Form.Item>
                            <Form.Item name="sign_date" label="Ngày Ký (Hiển thị)">
                                <Input type="date" />
                            </Form.Item>
                        </Card>

                        <Divider style={{ margin: '12px 0' }} />

                        <Card title="2. Nội Dung Phụ Lục" size="small" bordered={false}>
                            <Form.Item name="include_product_list" valuePropName="checked">
                                <Checkbox>Bao gồm Danh Sách Sản Phẩm</Checkbox>
                            </Form.Item>

                            <Divider style={{ margin: '12px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontWeight: 500 }}>Hình Ảnh Phụ Lục:</span>
                                <Button size="small" icon={<ReloadOutlined />} onClick={handleResetImages}>Reset</Button>
                            </div>

                            <AttachmentUpload
                                value={appendixImages}
                                onChange={(newUrls) => {
                                    setAppendixImages(newUrls);
                                    setTimeout(handleGeneratePreview, 200);
                                }}
                                maxFiles={20}
                                title=""
                                allowUpload={true}
                                allowDelete={true}
                            />

                            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                                (Hệ thống sẽ tự động ghép các hình ảnh vào cuối hợp đồng)
                            </div>
                        </Card>
                    </Form>
                </Col>
                <Col span={16} style={{ height: '100%', overflowY: 'auto', background: '#f5f5f5', padding: 20 }}>
                    <div
                        style={{
                            background: 'white',
                            padding: '40px',
                            minHeight: '100%',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                </Col>
            </Row>
        </Modal>
    );
};

export default ContractBuilderModal;
