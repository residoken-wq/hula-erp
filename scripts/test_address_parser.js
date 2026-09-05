const PROVINCES_MAP = [
    { names: ['vũng tàu', 'vung tau', 'bà rịa', 'ba ria', 'bà rịa vũng tàu', 'ba ria vung tau'], standard: 'Bà Rịa - Vũng Tàu', defaultCity: 'TP. Vũng Tàu' },
    { names: ['hồ chí minh', 'ho chi minh', 'hcm', 'tphcm', 'tp hcm', 'sài gòn', 'sai gon'], standard: 'Hồ Chí Minh' },
    { names: ['hà nội', 'ha noi', 'hn'], standard: 'Hà Nội' },
    { names: ['đà nẵng', 'da nang'], standard: 'Đà Nẵng' },
    { names: ['hải phòng', 'hai phong'], standard: 'Hải Phòng' },
    { names: ['cần thơ', 'can tho'], standard: 'Cần Thơ' },
    { names: ['bình dương', 'binh duong'], standard: 'Bình Dương' },
    { names: ['đồng nai', 'dong nai', 'biên hòa', 'bien hoa'], standard: 'Đồng Nai' },
    { names: ['long an', 'tân an', 'tan an'], standard: 'Long An' },
    { names: ['tiền giang', 'mỹ tho', 'my tho'], standard: 'Tiền Giang' },
    { names: ['bến tre', 'ben tre'], standard: 'Bến Tre' },
    { names: ['vĩnh long', 'vinh long'], standard: 'Vĩnh Long' },
    { names: ['trà vinh', 'tra vinh'], standard: 'Trà Vinh' },
    { names: ['hậu giang', 'hau giang', 'vị thanh'], standard: 'Hậu Giang' },
    { names: ['sóc trăng', 'soc trang'], standard: 'Sóc Trăng' },
    { names: ['bạc liêu', 'bac lieu'], standard: 'Bạc Liêu' },
    { names: ['cà mau', 'ca mau'], standard: 'Cà Mau' },
    { names: ['kiên giang', 'kien giang', 'rạch giá', 'phú quốc'], standard: 'Kiên Giang' },
    { names: ['an giang', 'long xuyên', 'châu đốc'], standard: 'An Giang' },
    { names: ['đồng tháp', 'dong thap', 'cao lãnh', 'sa đéc'], standard: 'Đồng Tháp' },
    { names: ['tây ninh', 'tay ninh'], standard: 'Tây Ninh' },
    { names: ['bình phước', 'binh phuoc', 'đồng xoài'], standard: 'Bình Phước' },
    { names: ['lâm đồng', 'lam dong', 'đà lạt', 'da lat', 'bảo lộc'], standard: 'Lâm Đồng' },
    { names: ['khánh hòa', 'khanh hoa', 'nha trang', 'cam ranh'], standard: 'Khánh Hòa' },
    { names: ['ninh thuận', 'ninh thuan', 'phan rang'], standard: 'Ninh Thuận' },
    { names: ['bình thuận', 'binh thuan', 'phan thiết'], standard: 'Bình Thuận' },
    { names: ['đắk lắk', 'dak lak', 'daklak', 'buôn ma thuột'], standard: 'Đắk Lắk' },
    { names: ['đắk nông', 'dak nong'], standard: 'Đắk Nông' },
    { names: ['gia lai', 'pleiku'], standard: 'Gia Lai' },
    { names: ['kon tum'], standard: 'Kon Tum' },
    { names: ['phú yên', 'tuy hòa'], standard: 'Phú Yên' },
    { names: ['bình định', 'binh dinh', 'quy nhơn'], standard: 'Bình Định' },
    { names: ['quảng ngãi', 'quang ngai'], standard: 'Quảng Ngãi' },
    { names: ['quảng nam', 'tam kỳ', 'hội an'], standard: 'Quảng Nam' },
    { names: ['thừa thiên huế', 'huế', 'hue'], standard: 'Thừa Thiên Huế' },
    { names: ['quảng trị', 'đông hà'], standard: 'Quảng Trị' },
    { names: ['quảng bình', 'đồng hới'], standard: 'Quảng Bình' },
    { names: ['hà tĩnh', 'ha tinh'], standard: 'Hà Tĩnh' },
    { names: ['nghệ an', 'vinh'], standard: 'Nghệ An' },
    { names: ['thanh hóa', 'thanh hoa'], standard: 'Thanh Hóa' },
    { names: ['ninh bình', 'ninh binh'], standard: 'Ninh Bình' },
    { names: ['nam định', 'nam dinh'], standard: 'Nam Định' },
    { names: ['thái bình', 'thai binh'], standard: 'Thái Bình' },
    { names: ['hà nam', 'phủ lý'], standard: 'Hà Nam' },
    { names: ['hưng yên', 'hung yen'], standard: 'Hưng Yên' },
    { names: ['hải dương', 'hai duong'], standard: 'Hải Dương' },
    { names: ['bắc ninh', 'bac ninh'], standard: 'Bắc Ninh' },
    { names: ['bắc giang', 'bac giang'], standard: 'Bắc Giang' },
    { names: ['vĩnh phúc', 'vinh phuc', 'vĩnh yên'], standard: 'Vĩnh Phúc' },
    { names: ['phú thọ', 'việt trì'], standard: 'Phú Thọ' },
    { names: ['thái nguyên', 'thai nguyen'], standard: 'Thái Nguyên' },
    { names: ['tuyên quang'], standard: 'Tuyên Quang' },
    { names: ['hà giang'], standard: 'Hà Giang' },
    { names: ['cao bằng'], standard: 'Cao Bằng' },
    { names: ['bắc kạn', 'bac kan'], standard: 'Bắc Kạn' },
    { names: ['lạng sơn', 'lang son'], standard: 'Lạng Sơn' },
    { names: ['quảng ninh', 'hạ long', 'cẩm phả', 'uông bí'], standard: 'Quảng Ninh' },
    { names: ['lào cai'], standard: 'Lào Cai' },
    { names: ['yên bái'], standard: 'Yên Bái' },
    { names: ['điện biên'], standard: 'Điện Biên' },
    { names: ['lai châu'], standard: 'Lai Châu' },
    { names: ['sơn la'], standard: 'Sơn La' },
    { names: ['hòa bình', 'hoa binh'], standard: 'Hòa Bình' },
];

function smartParseVietnameseAddress(rawAddress) {
    if (!rawAddress || !rawAddress.trim()) {
        return { province: '', district: '', ward: '', street: '' };
    }

    const clean = rawAddress.trim();
    let province = '';
    let district = '';
    let ward = '';
    let street = clean;
    let workText = clean;

    // 1. Phân tích Tỉnh/Thành
    const lower = clean.toLowerCase();
    for (const item of PROVINCES_MAP) {
        for (const alias of item.names) {
            const pattern = new RegExp(`(?:tp\\.?|thành phố|tỉnh)?\\s*${alias}(?:\\s*$|[\\,\\.])`, 'i');
            if (pattern.test(lower)) {
                province = item.standard;
                if (item.defaultCity) {
                    district = item.defaultCity;
                }
                workText = workText.replace(new RegExp(`(?:tp\\.?|thành phố|tỉnh)?\\s*${alias}(?:\\s*$|[\\,\\.])`, 'gi'), '').trim();
                break;
            }
        }
        if (province) break;
    }

    // 2. Phân tích Phường/Xã/Thị trấn
    const wardMatch = workText.match(/(?:phường|p\.|xã|x\.|thị trấn|tt\.)\s+([0-9a-zA-Zà-ỹÀ-Ỹ\s]+?)(?=\s+(?:quận|huyện|thị xã|tx\.|tp\.|thành phố)|[\,\.]|$)/i);
    if (wardMatch) {
        ward = wardMatch[0].trim();
        workText = workText.replace(wardMatch[0], '').trim();
    }

    // 3. Phân tích Quận/Huyện/Thị xã/Thành phố nếu chưa có district
    if (!district) {
        const distMatch = workText.match(/(?:quận|huyện|thị xã|tx\.|tp\.|thành phố)\s+([0-9a-zA-Zà-ỹÀ-Ỹ\s]+?)(?=[\,\.]|$)/i);
        if (distMatch) {
            district = distMatch[0].trim();
            workText = workText.replace(distMatch[0], '').trim();
        }
    }

    // 4. Bóc tách Tên đường / Số nhà (phần trước phường/xã hoặc quận/huyện)
    const splitIndex = clean.search(/(?:phường|p\.|xã|x\.|thị trấn|tt\.|quận|huyện|thị xã|tx\.|tp\.|thành phố)/i);
    if (splitIndex > 0) {
        street = clean.substring(0, splitIndex).trim().replace(/[\,\-]+$/, '').trim();
    } else {
        street = workText.replace(/[\,\-]+$/, '').trim();
    }

    const capitalize = (str) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

    return {
        province: province || '',
        district: capitalize(district) || '',
        ward: capitalize(ward) || '',
        street: street || clean,
    };
}

console.log("Input 1:", "88/14 Nguyễn hữu cảnh phường thắng nhất tp Vũng tàu");
console.log("Result 1:", smartParseVietnameseAddress("88/14 Nguyễn hữu cảnh phường thắng nhất tp Vũng tàu"));

console.log("Input 2:", "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh");
console.log("Result 2:", smartParseVietnameseAddress("123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh"));

console.log("Input 3:", "Số 10 Hai Bà Trưng quận Hoàn Kiếm Hà Nội");
console.log("Result 3:", smartParseVietnameseAddress("Số 10 Hai Bà Trưng quận Hoàn Kiếm Hà Nội"));
