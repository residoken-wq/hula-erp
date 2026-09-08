/**
 * HULA 360 Product Showroom - Master Configuration
 * Sourced strictly from:
 * - docs/website_v2/HULA-360/HULA-360_Product-Showroom_Instruction06/color-preview-config.json
 * - references/NEM_MN_-_01.jpg & NEM_MN_-_03.jpg
 */

export interface ShowroomColor {
    id: string;
    label: string;
    previewHex: string;
}

export interface ShowroomInstance {
    id: string;
    label: string;
    defaultColorId: string;
}

export interface ShowroomAngle {
    id: 'overview' | 'closeup' | 'storage';
    label: string;
    description: string;
    imageUrl: string;
}

export const SHOWROOM_PRODUCT = {
    referenceId: 'REF-MAT-CARA-STD',
    name: 'Cotton Cara',
    category: 'BỘ NỆM MẦM NON',
    subtitle: 'Chăn tiêu chuẩn',
    dimensions: {
        mattress: '120 × 63 cm',
        pillow: '40 × 25 cm',
        blanket: '130 × 70 cm',
        bag: 'Size S (48 × 40 cm)',
    },
    specs: [
        { label: 'Mã quy chiếu', value: 'REF-MAT-CARA-STD' },
        { label: 'Dòng sản phẩm', value: 'Cotton Cara chần gòn mỏng tiêu chuẩn' },
        { label: 'Quy cách nệm', value: '120 × 63 cm' },
        { label: 'Gối nằm', value: '40 × 25 cm' },
        { label: 'Chăn đắp', value: '130 × 70 cm' },
        { label: 'Túi bảo quản', value: 'Túi quai xách Size S (48 × 40 cm)' },
        { label: 'Chất liệu vải', value: 'Cotton Cara dệt nổi thoáng khí, thấm hút mồ hôi' },
        { label: 'Lớp chần', value: 'Gòn mềm mại, chần sóng giữ form sau nhiều lần giặt' },
        { label: 'Viền định hình', value: 'Piping xám bọc mép toàn bộ chu vi' },
        { label: 'Mặt dưới', value: 'Vải chống trượt (AntiSlip) tiếp xúc sàn gỗ an toàn' },
    ],
    features: [
        'Không dùng lõi mút foam dày 3cm bí bách; nệm mỏng gọn nhẹ đúng tiêu chuẩn trường mầm non.',
        'Đồng bộ 1 tông màu cho nệm, gối và chăn trong từng bộ sản phẩm.',
        'Viền xám may kép định hình nệm không bị quăn mép khi bé nằm.',
        'Dễ dàng gấp 3 và xếp gọn gàng vào túi xách hoặc ngăn tủ cubby lớp học.',
    ],
    catalogueImages: [
        {
            url: '/images/tour360/showroom/catalogue_01.jpg',
            title: 'Quy cách nệm và chi tiết chần Cotton Cara',
            caption: 'Ảnh chụp catalogue HULA — Nệm mầm non chần gòn viền xám',
        },
        {
            url: '/images/tour360/showroom/catalogue_03.jpg',
            title: 'Bảng màu vải Cotton Cara thực tế',
            caption: 'Ảnh chụp catalogue HULA — 6 màu nệm mầm non tiêu chuẩn',
        },
    ],
};

export const SHOWROOM_COLORS: ShowroomColor[] = [
    { id: 'blue', label: 'Xanh dương', previewHex: '#56C5ED' },
    { id: 'green', label: 'Xanh lá', previewHex: '#ACD942' },
    { id: 'mint', label: 'Xanh ngọc', previewHex: '#8CE3CB' },
    { id: 'orange', label: 'Cam', previewHex: '#FFC076' },
    { id: 'yellow', label: 'Vàng', previewHex: '#F5E978' },
    { id: 'pink', label: 'Hồng', previewHex: '#EFA9D7' },
];

export const SHOWROOM_INSTANCES: ShowroomInstance[] = [
    { id: 'mat-01', label: 'Bộ 01', defaultColorId: 'blue' },
    { id: 'mat-02', label: 'Bộ 02', defaultColorId: 'blue' },
    { id: 'mat-03', label: 'Bộ 03', defaultColorId: 'blue' },
    { id: 'mat-04', label: 'Bộ 04', defaultColorId: 'blue' },
    { id: 'mat-05', label: 'Bộ 05', defaultColorId: 'blue' },
    { id: 'mat-06', label: 'Bộ 06', defaultColorId: 'blue' },
];

export const SHOWROOM_ANGLES: ShowroomAngle[] = [
    {
        id: 'overview',
        label: 'Tổng thể',
        description: 'Toàn cảnh phòng học 6 nệm nhìn chéo góc từ lối vào',
        imageUrl: '/images/tour360/showroom/classroom-concept.png',
    },
    {
        id: 'closeup',
        label: 'Cận sản phẩm',
        description: 'Cận cảnh chất liệu vải cotton Cara và đường chần',
        imageUrl: '/images/tour360/mattress_macro.jpg',
    },
    {
        id: 'storage',
        label: 'Góc cất đồ',
        description: 'Kệ tủ cubby cất nệm gọn gàng sau giờ ngủ trưa',
        imageUrl: '/images/tour360/cubby_nap.jpg',
    },
];
