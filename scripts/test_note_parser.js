const assert = require('assert');

function parseAddressHeuristic(fullAddress) {
    if (!fullAddress) return {};
    const segments = fullAddress.split(',').map(s => s.trim()).filter(Boolean);
    if (segments.length >= 4) {
        return {
            province: segments[segments.length - 1],
            district: segments[segments.length - 2],
            ward: segments[segments.length - 3],
            street: segments.slice(0, segments.length - 3).join(', ')
        };
    } else if (segments.length === 3) {
        return {
            province: segments[2],
            district: segments[1],
            ward: '',
            street: segments[0]
        };
    } else if (segments.length === 2) {
        return {
            province: segments[1],
            district: '',
            ward: '',
            street: segments[0]
        };
    }
    return { street: fullAddress };
}

function parseWebsiteOrderNote(note, order) {
    const text = note || '';
    const isWeb = /ĐƠN HÀNG TỪ WEBSITE|hula-website/i.test(text) || 
                  order?.order_source === 'WEBSITE' ||
                  /(?:Tên người mua|Địa chỉ giao hàng)\s*:/i.test(text);

    const nameMatch = text.match(/(?:👤\s*)?(?:Tên người mua|Người nhận|Khách hàng)\s*:\s*([^\n\r]+)/i);
    const receiverName = nameMatch 
        ? nameMatch[1].trim() 
        : (order?.receiver_name || (order?.customer_name && order.customer_name !== 'Khách lẻ' ? order.customer_name : ''));

    const phoneMatch = text.match(/(?:📞\s*)?(?:Số điện thoại|SĐT|Điện thoại)\s*:\s*([0-9\.\-\s\+]{8,15})/i);
    const receiverPhone = phoneMatch 
        ? phoneMatch[1].replace(/[\s\.\-]/g, '').trim() 
        : (order?.receiver_phone || order?.customer?.phone || '');

    const emailMatch = text.match(/(?:📧\s*)?Email\s*:\s*([^\s\n\r@]+@[^\s\n\r@]+\.[^\s\n\r]+)/i);
    const receiverEmail = emailMatch ? emailMatch[1].trim() : undefined;

    const addrMatch = text.match(/(?:📍\s*)?(?:Địa chỉ giao hàng|Địa chỉ nhận hàng|Địa chỉ)\s*:\s*([^\n\r]+)/i);
    const shippingAddress = addrMatch 
        ? addrMatch[1].trim() 
        : (order?.shipping_address || order?.customer?.address || '');

    const payMatch = text.match(/(?:💳\s*)?(?:Phương thức thanh toán|Thanh toán)\s*:\s*([^\n\r]+)/i);
    const payText = payMatch ? payMatch[1].toLowerCase() : '';
    const isCod = payText.includes('cod') || payText.includes('khi nhận hàng') || payText.includes('tiền mặt');
    const paymentMethod = isCod 
        ? 'COD' 
        : (payText.includes('chuyển khoản') || payText.includes('bank') ? 'BANK_TRANSFER' : 'OTHER');

    let totalAmount = Number(order?.total_amount) || 0;
    if (!totalAmount && order?.items && Array.isArray(order.items)) {
        totalAmount = order.items.reduce((sum, item) => sum + (Number(item.unit_price || 0) * Number(item.quantity || 0)), 0);
    }
    const paidAmount = Number(order?.paid_amount) || 0;
    const remainingUnpaid = Math.max(0, totalAmount - paidAmount);
    const suggestedCodAmount = isCod ? (remainingUnpaid > 0 ? remainingUnpaid : totalAmount) : 0;

    const noteMatch = text.match(/(?:📝\s*)?(?:Ghi chú|Lời nhắn|Ghi chú giao hàng)\s*:\s*([\s\S]+?)(?=\n[^\n:]+:|$)/i);
    let deliveryNote = noteMatch ? noteMatch[1].trim() : '';
    if (!deliveryNote && text && !text.includes('📦 ĐƠN HÀNG TỪ WEBSITE')) {
        deliveryNote = text.trim();
    }

    const addressParts = parseAddressHeuristic(shippingAddress);

    return {
        isWebsiteOrder: isWeb,
        receiverName,
        receiverPhone,
        receiverEmail,
        shippingAddress,
        paymentMethod,
        isCod,
        suggestedCodAmount,
        deliveryNote,
        addressParts
    };
}

console.log('=== TEST 1: Standard Website Order Note with COD ===');
const testNote1 = `📦 ĐƠN HÀNG TỪ WEBSITE
─────────────────────────
👤 Tên người mua: Nguyễn Văn Hoàng
📞 Số điện thoại: 0987.654.321
📧 Email: hoangnv@gmail.com
📍 Địa chỉ giao hàng: Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
💳 Phương thức thanh toán: COD (Thanh toán khi nhận hàng)
📝 Ghi chú: Giao giờ hành chính, gọi trước khi đến 15 phút`;

const order1 = {
    order_source: 'WEBSITE',
    total_amount: 1500000,
    paid_amount: 0
};
const res1 = parseWebsiteOrderNote(testNote1, order1);
assert.strictEqual(res1.isWebsiteOrder, true);
assert.strictEqual(res1.receiverName, 'Nguyễn Văn Hoàng');
assert.strictEqual(res1.receiverPhone, '0987654321');
assert.strictEqual(res1.receiverEmail, 'hoangnv@gmail.com');
assert.strictEqual(res1.shippingAddress, 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh');
assert.strictEqual(res1.paymentMethod, 'COD');
assert.strictEqual(res1.isCod, true);
assert.strictEqual(res1.suggestedCodAmount, 1500000);
assert.strictEqual(res1.deliveryNote, 'Giao giờ hành chính, gọi trước khi đến 15 phút');
assert.strictEqual(res1.addressParts.province, 'TP. Hồ Chí Minh');
assert.strictEqual(res1.addressParts.district, 'Quận 1');
assert.strictEqual(res1.addressParts.ward, 'Phường Bến Nghé');
console.log('✔ Test 1 PASSED');

console.log('=== TEST 2: Bank Transfer with Partial Deposit ===');
const testNote2 = `📦 ĐƠN HÀNG TỪ WEBSITE
👤 Tên người mua: Trần Thị Mai
📞 Số điện thoại: 0912 345 678
📍 Địa chỉ giao hàng: 789 Đường 3/2, Quận 10, Hồ Chí Minh
💳 Phương thức thanh toán: Chuyển khoản`;

const order2 = {
    order_source: 'WEBSITE',
    total_amount: 2000000,
    paid_amount: 2000000
};
const res2 = parseWebsiteOrderNote(testNote2, order2);
assert.strictEqual(res2.isWebsiteOrder, true);
assert.strictEqual(res2.receiverName, 'Trần Thị Mai');
assert.strictEqual(res2.receiverPhone, '0912345678');
assert.strictEqual(res2.paymentMethod, 'BANK_TRANSFER');
assert.strictEqual(res2.isCod, false);
assert.strictEqual(res2.suggestedCodAmount, 0);
console.log('✔ Test 2 PASSED');

console.log('=== TEST 3: Order with Partial Payment & COD ===');
const order3 = {
    order_source: 'WEBSITE',
    total_amount: 3500000,
    paid_amount: 1000000 // Đã cọc 1 triệu
};
const res3 = parseWebsiteOrderNote(testNote1, order3);
assert.strictEqual(res3.suggestedCodAmount, 2500000); // Thu nốt 2.5 triệu
console.log('✔ Test 3 PASSED');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
