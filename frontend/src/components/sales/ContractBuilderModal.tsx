import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Form, Select, Button, Checkbox, Row, Col, Input, Divider, Card, AutoComplete, message, Spin } from 'antd';
import { PrinterOutlined, ReloadOutlined, SaveOutlined, FileSyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AttachmentUpload from '../common/AttachmentUpload';
import api from '../../utils/api';

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess?: () => void; // Added for reload
    initialData: any; // Order Data
    templates: any[]; // Contract Templates
}

const BUILT_IN_VARS = [
    'customer_name', 'customer_address', 'customer_tax_code', 'customer_representative', 'customer_position',
    'order_code', 'order_date', 'total_amount_text', 'sign_date', 'items_table'
];

const ContractBuilderModal: React.FC<Props> = ({ open, onCancel, onSuccess, initialData, templates }) => {
    const [form] = Form.useForm();
    const [appendixImages, setAppendixImages] = useState<string[]>([]);
    const [previewHtml, setPreviewHtml] = useState('');
    const [customVariables, setCustomVariables] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Initial Setup
    useEffect(() => {
        if (open && initialData) {
            // Restore saved appendix images or from items
            let restoredImages: string[] = [];
            if (initialData.contract_variables?.appendixImages) {
                 restoredImages = initialData.contract_variables.appendixImages;
            } else {
                 const itemImages = initialData.items?.filter((i: any) => i.image_url).map((i: any) => i.image_url) || [];
                 restoredImages = [...new Set(itemImages)] as string[];
            }
            setAppendixImages(restoredImages);

            const initialVars = initialData.contract_variables || {};
            
            form.setFieldsValue({
                template_id: initialData.contract_template_id || (templates.length > 0 ? templates[0].id : undefined),
                include_product_list: initialVars.include_product_list !== false,
                sign_date: initialVars.sign_date ? dayjs(initialVars.sign_date) : dayjs(),
                ...initialVars
            });
            setTimeout(handleGeneratePreview, 100); // Initial preview
        }
    }, [open, initialData, templates]);

    const suggestions = useMemo(() => {
        if (!initialData?.customer) return [];
        const c = initialData.customer;
        const opts: {value: string, label: string}[] = [];
        if (c.name) opts.push({ value: c.name, label: `Tên: ${c.name}` });
        if (c.legal_name) opts.push({ value: c.legal_name, label: `Pháp nhân: ${c.legal_name}` });
        if (c.phone) opts.push({ value: c.phone, label: `SĐT: ${c.phone}` });
        if (c.email) opts.push({ value: c.email, label: `Email: ${c.email}` });
        if (c.tax_code) opts.push({ value: c.tax_code, label: `MST: ${c.tax_code}` });
        if (c.address) opts.push({ value: c.address, label: `Địa chỉ: ${c.address}` });
        if (c.legal_address) opts.push({ value: c.legal_address, label: `ĐC Pháp nhân: ${c.legal_address}` });
        if (c.legal_representative) opts.push({ value: c.legal_representative, label: `Đại diện: ${c.legal_representative}` });
        
        // Add contacts
        c.contacts?.forEach((contact: any) => {
            if (contact.name) opts.push({ value: contact.name, label: `Liên hệ: ${contact.name}` });
            if (contact.phone) opts.push({ value: contact.phone, label: `SĐT LH: ${contact.phone}` });
            if (contact.email) opts.push({ value: contact.email, label: `Email LH: ${contact.email}` });
        });
        
        return opts;
    }, [initialData]);

    const handleGeneratePreview = async () => {
        const values = form.getFieldsValue();
        const template = templates.find(t => t.id === values.template_id);

        if (!template) {
            setPreviewHtml('<div style="padding:20px; text-align:center; color:#999">Vui lòng chọn mẫu hợp đồng</div>');
            setCustomVariables([]);
            return;
        }

        let content = template.content;

        // Extract placeholders from template
        const matches = content.match(/\{\{([^\}]+)\}\}/g);
        let extractedVars: string[] = [];
        if (matches) {
            extractedVars = matches.map((m: string) => m.replace('{{', '').replace('}}', '').trim());
            extractedVars = [...new Set(extractedVars)]; // unique
            extractedVars = extractedVars.filter(v => !BUILT_IN_VARS.includes(v)); // Keep only custom
        }
        setCustomVariables(extractedVars);

        const data: any = {
            customer_name: initialData.customer?.name || '...',
            customer_address: initialData.customer?.address || '...',
            customer_tax_code: initialData.customer?.tax_code || '...',
            customer_representative: initialData.customer?.representative_name || initialData.customer?.legal_representative || '...',
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
            if (data[key] !== undefined && data[key] !== null) {
                // Ensure strictly global replace
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                content = content.replace(regex, (data as any)[key]);
            }
        });
        
        // Ensure unknown variables are not completely hidden or left as {{code}}, maybe leave them so user sees they are missing?
        // We leave them so the user knows they need to fill them, or we can replace them with a red span.
        extractedVars.forEach(key => {
             if (!data[key]) {
                  const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                  content = content.replace(regex, `<span style="color:red; background: #ffe6e6; border-bottom: 1px dotted red;"> [Điền: ${key}] </span>`);
             }
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

    const handleSave = async (createVersion: boolean = false) => {
        try {
            setSaving(true);
            const values = form.getFieldsValue();
            
            // Clean content to not include the red spans when saving (just re-evaluate without replacing empties with red spans)
            // Actually it is better to generate the clean HTML to save.
            const template = templates.find(t => t.id === values.template_id);
            if (!template) {
                 message.error("Vui lòng chọn mẫu hợp đồng");
                 return;
            }
            
            let cleanContent = template.content;
            const dataToSave = {
                customer_name: initialData.customer?.name || '',
                customer_address: initialData.customer?.address || '',
                customer_tax_code: initialData.customer?.tax_code || '',
                customer_representative: initialData.customer?.representative_name || initialData.customer?.legal_representative || '',
                customer_position: initialData.customer?.representative_position || '',
                order_code: initialData.order_code || '',
                order_date: dayjs(initialData.order_date).format('DD/MM/YYYY'),
                total_amount_text: (initialData.total_amount || 0).toLocaleString() + ' đ',
                ...values,
                sign_date: values.sign_date ? dayjs(values.sign_date).format('DD/MM/YYYY') : '',
                appendixImages // Include images in variables
            };
            
            Object.keys(dataToSave).forEach(key => {
                if (dataToSave[key] !== undefined && dataToSave[key] !== null) {
                    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                    cleanContent = cleanContent.replace(regex, (dataToSave as any)[key]);
                }
            });
            // (Note: Optional: We don't append the product table directly into the saved HTML string if we want it strictly dynamic, 
            // but for a true snapshot, the previewHtml should be what is saved).
            // Let's just save the `previewHtml` as it represents what the user saw, but we replace the red spans with empty string or keep them.
            // Actually, `previewHtml` is fine.
            let finalHtmlToSave = previewHtml.replace(/<span style="color:red; background: #ffe6e6; border-bottom: 1px dotted red;"> \[Điền: [^\]]+\] <\/span>/g, '...');
            
            await api.put(`/sales/${initialData.id}`, {
                contract_template_id: values.template_id,
                contract_html: finalHtmlToSave,
                contract_variables: { ...values, appendixImages }
            });
            
            if (createVersion) {
                await api.post(`/sales/${initialData.id}/revision`);
                message.success("Đã lưu hợp đồng và tạo Version mới!");
            } else {
                message.success("Đã lưu bản nháp hợp đồng thành công!");
            }
            
            if (onSuccess) onSuccess();
        } catch(e) {
            message.error("Lỗi khi lưu hợp đồng");
        } finally {
            setSaving(false);
        }
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
                 <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }} key="footer-group">
                    <div>
                        <Button key="save_draft" type="default" icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving}>
                            Lưu Bản Nháp
                        </Button>
                        <Button key="save_version" type="dashed" icon={<FileSyncOutlined />} onClick={() => handleSave(true)} loading={saving} style={{ marginLeft: 8 }}>
                            Lưu & Tạo Version
                        </Button>
                    </div>
                    <div>
                        <Button key="cancel" onClick={onCancel}>Đóng</Button>
                        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} size="middle" style={{ marginLeft: 8 }}>
                            In Hợp Đồng
                        </Button>
                    </div>
                 </div>
            ]}
        >
            <Row gutter={24} style={{ height: '70vh' }}>
                <Col span={7} style={{ borderRight: '1px solid #f0f0f0', height: '100%', overflowY: 'auto', paddingRight: 10 }}>
                    <Form form={form} layout="vertical" onValuesChange={() => setTimeout(handleGeneratePreview, 200)}>
                        <Card title="1. Thông Tin Chung" size="small" bordered={false}>
                            <Form.Item name="template_id" label="Mẫu Hợp Đồng">
                                <Select options={templates.map(t => ({ label: t.name, value: t.id }))} />
                            </Form.Item>
                            <Form.Item name="sign_date" label="Ngày Ký (Hiển thị)">
                                <Input type="date" />
                            </Form.Item>
                        </Card>

                        {customVariables.length > 0 && (
                            <>
                                <Divider style={{ margin: '12px 0' }} />
                                <Card title={<span style={{ color: '#1890ff' }}>2. Thông Tin Điền Thêm</span>} size="small" bordered={false}>
                                    <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
                                        <i>Các biến được phát hiện từ mẫu hợp đồng (gõ để hiển thị gợi ý thông tin của KH):</i>
                                    </div>
                                    {customVariables.map(v => (
                                        <Form.Item key={v} name={v} label={<span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{`{${v}}`}</span>}>
                                            <AutoComplete
                                                options={suggestions}
                                                placeholder={`Tìm thông tin KH hoặc nhập tự do...`}
                                                filterOption={(inputValue: string, option: any) =>
                                                    String(option!.label).toUpperCase().indexOf(inputValue.toUpperCase()) !== -1 ||
                                                    String(option!.value).toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                }
                                                allowClear
                                            />
                                        </Form.Item>
                                    ))}
                                </Card>
                            </>
                        )}

                        <Divider style={{ margin: '12px 0' }} />

                        <Card title={`${customVariables.length > 0 ? '3' : '2'}. Nội Dung Phụ Lục`} size="small" bordered={false}>
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
                <Col span={17} style={{ height: '100%', overflowY: 'auto', background: '#e8e8e8', padding: '20px 40px' }}>
                    {saving && <Spin spinning style={{position: 'absolute', top: '50%', left: '50%', zIndex: 10}}/>}
                    <div
                        style={{
                            background: 'white',
                            padding: '40px 60px',
                            minHeight: '100%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                            opacity: saving ? 0.6 : 1
                        }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                </Col>
            </Row>
        </Modal>
    );
};

export default ContractBuilderModal;
