import dayjs from 'dayjs';

export const handlePrintPO = (currentPO: any, packingList: any[], template: string, showPrice = true, companyConfig: any) => {
    const w = window.open('', '_blank');
    if (!w) return;

    let content = '';
    const dateStr = dayjs().format('DD/MM/YYYY');
    const poCode = currentPO?.po_code || 'PO-XXXX';
    const supplierDisplayName = currentPO?.supplier?.legal_name || currentPO?.supplier?.name || '';

    const style = `
        <style>
            body { font-family: 'Times New Roman', serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 5px; text-align: center; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
            .left-align { text-align: left; }
            .bold { font-weight: bold; }
            @media print { .no-print { display: none; } }
        </style>
    `;

    if (template === 'STANDARD') {
        const rows = currentPO?.items?.map((i: any, idx: number) => `
            <tr>
                <td>${idx + 1}</td>
                <td class="left-align">${i.description}</td>
                <td>${Number(i.quantity).toLocaleString()}</td>
                <td>${Number(i.unit_price).toLocaleString()}</td>
                <td>${Number(i.subtotal).toLocaleString()}</td>
            </tr>
        `).join('');

        content = `
            ${style}
            <div class="header">
                <div>
                        <div class="title" style="margin-bottom:5px; text-align:left;">${companyConfig?.COMPANY_NAME || 'HULA'}</div>
                        <div>${companyConfig?.COMPANY_ADDRESS ? `Đ/C: ${companyConfig.COMPANY_ADDRESS}` : 'Đ/C: 123 ABC...'}</div>
                </div>
                <div style="text-align:right;">
                    <div><b>Ngày:</b> ${dateStr}</div>
                    <div><b>Mã PO:</b> ${poCode}</div>
                </div>
            </div>
            <div class="title">ĐƠN ĐẶT HÀNG (NPL)</div>
            <div style="margin-bottom:10px;"><b>Kính gửi:</b> ${supplierDisplayName}</div>
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" style="text-align:right; font-weight:bold;">Total</td>
                        <td style="font-weight:bold;">${Number(currentPO?.total_amount).toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (template === 'OUTSOURCING') {
        const priceHeaders = showPrice ? `<th>Đơn giá</th><th>Thành tiền</th>` : '';
        const priceColspan = showPrice ? 2 : 0;

        const rows = currentPO?.items?.map((i: any, idx: number) => {
            const priceCells = showPrice ? `<td>${Number(i.unit_price || 0).toLocaleString()}</td><td>${Number(i.subtotal || 0).toLocaleString()}</td>` : '';
            let sku = i.material?.code || i.product?.sku || '-';
            let processingDesc = i.product?.processing_description || i.material?.name || ''; 

            if (i.product && !processingDesc) {
                processingDesc = i.product.name;
            }

            if (!i.product && !i.material && i.description) {
                const skuMatch = i.description.match(/\\(([^)]+)\\)\\s*$/);
                const descMatch = i.description.match(/^(.+?)\\s*\\([^)]+\\)\\s*$/);

                if (skuMatch) sku = skuMatch[1].trim();
                if (descMatch) {
                    processingDesc = descMatch[1].trim();
                } else {
                    if (!processingDesc) processingDesc = i.description;
                }
            } else if (!processingDesc && i.description) {
                const descMatch = i.description.match(/^(.+?)\\s*\\([^)]+\\)\\s*$/);
                processingDesc = descMatch ? descMatch[1].trim() : i.description;
            }

            return `
            <tr>
                <td>${idx + 1}</td>
                <td>${sku}</td>
                <td class="left-align">${processingDesc}</td>
                <td>-</td> 
                <td>-</td> 
                <td>${Number(i.quantity).toLocaleString()}</td>
                <td>-</td> 
                ${priceCells}
                <td>${i.note || ''}</td>
            </tr>
        `}).join('');

        content = `
            ${style}
                <div class="header">
                <div>
                        <div class="title" style="margin-bottom:5px; text-align:left;">${companyConfig?.COMPANY_NAME || 'HULA'}</div>
                        <div>${companyConfig?.COMPANY_ADDRESS ? `Đ/C: ${companyConfig.COMPANY_ADDRESS}` : 'Đ/C: 123 ABC...'}</div>
                </div>
                <div style="text-align:right;">
                    <div><b>Ngày:</b> ${dateStr}</div>
                    <div><b>Mã:</b> ${poCode}</div>
                </div>
            </div>
            <div class="title">ĐƠN ĐẶT HÀNG GIA CÔNG</div>
            <div style="margin-bottom:10px;"><b>Kính gửi:</b> ${supplierDisplayName}</div>
                <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Mã SKU</th>
                        <th>Mô tả sản phẩm</th>
                        <th>Định mức vải (VMT)</th>
                        <th>Định mức vải (VMS)</th>
                        <th>Số lượng</th>
                        <th>Thêu</th>
                        ${priceHeaders}
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
                    <tfoot>
                    <tr>
                        <td colspan="5" style="text-align:right; font-weight:bold;">Tổng cộng</td>
                        <td style="font-weight:bold;">${Number(currentPO?.items?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)).toLocaleString()}</td>
                        <td colspan="${2 + priceColspan}"></td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top:20px;">
                <div><b>Ghi chú chung:</b> ${currentPO?.note || ''}</div>
            </div>
                <div style="display:flex; justify-content:space-between; margin-top:40px; text-align:center;">
                <div><b>Người lập phiếu</b><br/><br/><br/>(Ký, họ tên)</div>
                <div><b>Người duyệt</b><br/><br/><br/>(Ký, họ tên)</div>
                    <div><b>Nhà cung cấp</b><br/><br/><br/>(Ký, họ tên)</div>
            </div>
        `;
    } else if (template === 'CARA' || template === 'HQ') {
        const list = packingList.length > 0 ? packingList : [{ po_form_code: '', material_name: '' }];
        const rows = list.map((r: any, idx: number) => `
            <tr>
                <td>${idx + 1}</td>
                <td class="left-align">${r.po_form_code || ''}</td>
                <td class="left-align">${r.material_name || ''}</td>
                <td>${r.n1 || '-'}</td>
                <td>${r.n2 || '-'}</td>
                <td>${r.c1 || '-'}</td>
                <td>${r.c2 || '-'}</td>
                <td>${r.g1 || '-'}</td>
                <td>${r.g2 || '-'}</td>
                <td>${r.odd || '-'}</td>
                <td>${r.border || '-'}</td>
                <td>${r.note || ''}</td>
            </tr>
        `).join('');

        content = `
            ${style}
            <style>th { background-color: #f0f0f0; }</style>
            <div class="header">
                <div><b>Ngày:</b> ${dateStr}</div>
                <div><b>Mã PO:</b> ${poCode}</div>
            </div>
            <div class="title">ĐƠN ĐẶT HÀNG</div>
                <table>
                <thead>
                    <tr>
                        <th rowspan="2">STT</th>
                        <th rowspan="2">Mã PO Form</th>
                        <th rowspan="2">Mã Vải / Tên NPL</th>
                        <th colspan="2">N</th>
                        <th colspan="2">C</th>
                        <th colspan="2">G</th>
                        <th rowspan="2">Kiện lẻ</th>
                        <th rowspan="2">Kiện viền</th>
                        <th rowspan="2">Ghi chú</th>
                    </tr>
                    <tr>
                        <th>N1</th><th>N2</th><th>C1</th><th>C2</th><th>G1</th><th>G2</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    w.document.write(`<html><head><title>Print PO ${poCode}</title></head><body>${content}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
};
