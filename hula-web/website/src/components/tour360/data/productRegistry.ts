/**
 * HULA 360 Tour - Real Product Catalog Registry (Instruction 05)
 * Standardized from HULA Sale Kit (56-page catalog) via product-reference-registry.json.
 * 
 * Rules:
 * - 15 catalog product references across 4 core categories.
 * - Reference IDs (REF-*) are internal catalog anchors, NOT production SKUs.
 * - Null fields indicate unverified data in catalog; no guessed numbers.
 * - Fictional personal item identification: "Mây — Lớp Mầm" (replacing old green leaf tag).
 */

export type ProductCategory = 'bedding_set' | 'foam_mattress' | 'sleeping_bag' | 'storage_bag';

export interface CatalogDimension {
    component: string;
    raw: string;
    valuesCm?: number[];
    axisConventionVerified: boolean;
}

export interface ProductReference {
    referenceId: string;
    name: string;
    category: ProductCategory;
    categoryNameVi: string;
    sourceFile: string;
    materialOptions: string[];
    dimensions: CatalogDimension[];
    features: string[];
    notes: string[];
    packshotUrl?: string;
    officialColorPreview?: string[];
}

export const DEMO_CHILD_LABEL = {
    studentName: 'Mây',
    className: 'Lớp Mầm',
    fullLabel: 'Mây — Lớp Mầm',
    description: 'Nhãn tên và lớp in/thêu sắc nét trên mặt trước của túi bảo quản HULA',
};

export const PRODUCT_REFERENCES: Record<string, ProductReference> = {
    // -------------------------------------------------------------------------
    // 1. DÒNG NỆM MẦM NON (BEDDING SETS)
    // -------------------------------------------------------------------------
    'REF-MAT-CARA-STD': {
        referenceId: 'REF-MAT-CARA-STD',
        name: 'Bộ nệm Cotton Cara — chăn tiêu chuẩn',
        category: 'bedding_set',
        categoryNameVi: 'Bộ nệm mầm non',
        sourceFile: 'sale-kit/NEM_MN_-_01.jpg',
        materialOptions: ['Cotton Cara'],
        dimensions: [
            { component: 'nệm', raw: '120×63 cm', valuesCm: [120, 63], axisConventionVerified: false },
            { component: 'gối', raw: '40×25 cm', valuesCm: [40, 25], axisConventionVerified: false },
            { component: 'chăn', raw: '130×70 cm', valuesCm: [130, 70], axisConventionVerified: false },
        ],
        features: ['In/thêu logo thương hiệu', 'Móc cố định chống rơi gối', 'Nhãn tên lớp chống thất lạc', 'Mặt đáy chống trượt an toàn'],
        notes: ['Màu mẫu chính: Xanh dương.', 'Chiều dày bông ép nệm mềm chưa định lượng trong catalogue.'],
        packshotUrl: '/images/tour360/products/nem-cara-spec.jpg',
        officialColorPreview: ['#38bdf8', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#f472b6'],
    },
    'REF-MAT-CARA-LARGE': {
        referenceId: 'REF-MAT-CARA-LARGE',
        name: 'Bộ nệm Cotton Cara — chăn size lớn',
        category: 'bedding_set',
        categoryNameVi: 'Bộ nệm mầm non',
        sourceFile: 'sale-kit/NEM_MN_-_02.jpg',
        materialOptions: ['Cotton Cara'],
        dimensions: [
            { component: 'nệm', raw: '120×63 cm', valuesCm: [120, 63], axisConventionVerified: false },
            { component: 'gối', raw: '40×25 cm', valuesCm: [40, 25], axisConventionVerified: false },
            { component: 'chăn', raw: '130×80/90 cm', axisConventionVerified: false },
        ],
        features: ['In/thêu logo', 'Móc cố định', 'Nhãn tên lớp', 'Mặt chống trượt'],
        notes: ['Chưa tách SKU cho chuỗi kích thước 130×80/90.'],
    },
    'REF-MAT-SATIN-STD': {
        referenceId: 'REF-MAT-SATIN-STD',
        name: 'Bộ nệm Satin Hàn Quốc — chăn tiêu chuẩn',
        category: 'bedding_set',
        categoryNameVi: 'Bộ nệm mầm non',
        sourceFile: 'sale-kit/NEM_MN_-_05.jpg',
        materialOptions: ['Satin Hàn Quốc'],
        dimensions: [
            { component: 'nệm', raw: '120×65 cm', valuesCm: [120, 65], axisConventionVerified: false },
            { component: 'gối', raw: '40×25 cm', valuesCm: [40, 25], axisConventionVerified: false },
            { component: 'chăn', raw: '130×70 cm', valuesCm: [130, 70], axisConventionVerified: false },
        ],
        features: ['In/thêu logo', 'Móc cố định', 'Nhãn tên lớp', 'Mặt chống trượt'],
        notes: ['Chất liệu Satin mềm mịn, thoáng mát.'],
    },
    'REF-MAT-SATIN-LARGE': {
        referenceId: 'REF-MAT-SATIN-LARGE',
        name: 'Bộ nệm Satin Hàn Quốc — chăn size lớn',
        category: 'bedding_set',
        categoryNameVi: 'Bộ nệm mầm non',
        sourceFile: 'sale-kit/NEM_MN_-_06.jpg',
        materialOptions: ['Satin Hàn Quốc'],
        dimensions: [
            { component: 'nệm', raw: '120×65 cm', valuesCm: [120, 65], axisConventionVerified: false },
            { component: 'gối', raw: '40×25 cm', valuesCm: [40, 25], axisConventionVerified: false },
            { component: 'chăn', raw: '130×80/90 cm', axisConventionVerified: false },
        ],
        features: ['In/thêu logo', 'Móc cố định', 'Nhãn tên lớp', 'Mặt chống trượt'],
        notes: ['Catalogue ghi 80 màu, liên hệ xem bảng màu thực tế.'],
    },

    // -------------------------------------------------------------------------
    // 2. DÒNG NỆM FOAM (FOAM MATTRESS)
    // -------------------------------------------------------------------------
    'REF-FOAM-FOLD4': {
        referenceId: 'REF-FOAM-FOLD4',
        name: 'Nệm foam gấp bốn khúc — drap Satin Hàn Quốc',
        category: 'foam_mattress',
        categoryNameVi: 'Nệm foam',
        sourceFile: 'sale-kit/NEM_KHUC_-_01.jpg',
        materialOptions: ['Foam', 'Drap Satin Hàn Quốc'],
        dimensions: [
            { component: 'nệm', raw: '120×60×3 cm', valuesCm: [120, 60, 3], axisConventionVerified: true },
            { component: 'gối', raw: '40×25 cm', valuesCm: [40, 25], axisConventionVerified: false },
        ],
        features: ['Gấp 4 khúc gọn gàng', 'Drap Satin tháo rời', 'Khóa kéo mặt sau', 'Dây đai cố định'],
        notes: ['Độ dày nệm foam chuẩn 3 cm.'],
    },
    'REF-FOAM-BASIC': {
        referenceId: 'REF-FOAM-BASIC',
        name: 'Nệm foam cơ bản — drap Poly',
        category: 'foam_mattress',
        categoryNameVi: 'Nệm foam',
        sourceFile: 'sale-kit/NEM_KHUC_-_02.jpg',
        materialOptions: ['Foam', 'Drap Poly'],
        dimensions: [
            { component: 'nệm', raw: '120×60×3 cm', valuesCm: [120, 60, 3], axisConventionVerified: true },
            { component: 'gối', raw: '40×25 cm', valuesCm: [40, 25], axisConventionVerified: false },
        ],
        features: ['Lõi foam êm ái', 'Drap Poly bền chắc', 'Khóa kéo phía sau'],
        notes: ['Dòng cơ bản tiết kiệm.'],
    },

    // -------------------------------------------------------------------------
    // 3. DÒNG TÚI NGỦ (SLEEPING BAGS)
    // -------------------------------------------------------------------------
    'REF-SLEEP-CARA-STD': {
        referenceId: 'REF-SLEEP-CARA-STD',
        name: 'Túi ngủ Cotton Cara tiêu chuẩn',
        category: 'sleeping_bag',
        categoryNameVi: 'Túi ngủ',
        sourceFile: 'sale-kit/TUI_NGU_-_01.jpg',
        materialOptions: ['Cotton Cara'],
        dimensions: [
            { component: 'nệm', raw: '125×63 cm', valuesCm: [125, 63], axisConventionVerified: false },
            { component: 'chăn', raw: '98×80 cm', valuesCm: [98, 80], axisConventionVerified: false },
        ],
        features: ['Chăn liền nệm', 'Gấp gọn thành gối', 'Nhãn tên lớp'],
        notes: ['Chăn mỏng mùa hè thu.'],
    },
    'REF-SLEEP-CARA-PLUS': {
        referenceId: 'REF-SLEEP-CARA-PLUS',
        name: 'Túi ngủ Cotton Cara nâng cao',
        category: 'sleeping_bag',
        categoryNameVi: 'Túi ngủ',
        sourceFile: 'sale-kit/TUI_NGU_-_02.jpg',
        materialOptions: ['Cotton Cara'],
        dimensions: [
            { component: 'nệm', raw: '125×63 cm', valuesCm: [125, 63], axisConventionVerified: false },
            { component: 'chăn', raw: '98×80 cm', valuesCm: [98, 80], axisConventionVerified: false },
        ],
        features: ['Chăn chần gòn êm ái', 'Khóa kéo tiện lợi', 'Họa tiết chần cao cấp'],
        notes: ['Bản nâng cao giữ ấm tốt hơn.'],
    },
    'REF-SLEEP-SATIN-STD': {
        referenceId: 'REF-SLEEP-SATIN-STD',
        name: 'Túi ngủ Satin Hàn Quốc tiêu chuẩn',
        category: 'sleeping_bag',
        categoryNameVi: 'Túi ngủ',
        sourceFile: 'sale-kit/TUI_NGU_-_05.jpg',
        materialOptions: ['Satin Hàn Quốc'],
        dimensions: [
            { component: 'nệm', raw: '130×70 cm', valuesCm: [130, 70], axisConventionVerified: false },
            { component: 'chăn', raw: '98×70 cm', valuesCm: [98, 70], axisConventionVerified: false },
        ],
        features: ['Vải Satin mát mịn', 'Thiết kế thông minh', 'Gấp gọn'],
        notes: ['Thích hợp phòng máy lạnh.'],
    },
    'REF-SLEEP-SATIN-PLUS': {
        referenceId: 'REF-SLEEP-SATIN-PLUS',
        name: 'Túi ngủ Satin Hàn Quốc nâng cao',
        category: 'sleeping_bag',
        categoryNameVi: 'Túi ngủ',
        sourceFile: 'sale-kit/TUI_NGU_-_06.jpg',
        materialOptions: ['Satin Hàn Quốc'],
        dimensions: [
            { component: 'nệm', raw: '130×70 cm', valuesCm: [130, 70], axisConventionVerified: false },
            { component: 'chăn', raw: '98×90 cm', valuesCm: [98, 90], axisConventionVerified: false },
        ],
        features: ['Chăn rộng 90 cm', 'Khóa kéo liên kết linh hoạt', 'Chần bông kháng khuẩn'],
        notes: ['Dòng cao cấp nhất trong catalogue túi ngủ.'],
    },

    // -------------------------------------------------------------------------
    // 4. DÒNG TÚI BẢO QUẢN (STORAGE BAGS)
    // -------------------------------------------------------------------------
    'REF-BAG-HANDLE': {
        referenceId: 'REF-BAG-HANDLE',
        name: 'Túi bảo quản quai xách (Size S)',
        category: 'storage_bag',
        categoryNameVi: 'Túi bảo quản',
        sourceFile: 'sale-kit/TUI_BAO_QUAN_-_01.jpg',
        materialOptions: ['Vải Poly Canvas', 'Vải Dù'],
        dimensions: [
            { component: 'thân túi Size S', raw: '48×40 cm', valuesCm: [48, 40], axisConventionVerified: false },
            { component: 'thân túi Size M', raw: '50×42 cm', valuesCm: [50, 42], axisConventionVerified: false },
        ],
        features: [
            'Hai quai xách màu xám chắc chắn',
            'Mặt trước màu xanh dương in logo và nhãn tên/lớp',
            'Mặt sau màu xám có khóa kéo ngang tiện lợi',
            'Chống bụi, chống ẩm khi vận chuyển cuối tuần',
        ],
        notes: [
            'Dùng cho cảnh bàn giao cuối tuần EV-06.',
            'Chọn Size S: 48×40 cm, nhãn "Mây — Lớp Mầm".',
        ],
        packshotUrl: '/images/tour360/products/tui-quai-xach.jpg',
    },
    'REF-BAG-DRAWSTRING': {
        referenceId: 'REF-BAG-DRAWSTRING',
        name: 'Balo rút bảo quản',
        category: 'storage_bag',
        categoryNameVi: 'Túi bảo quản',
        sourceFile: 'sale-kit/TUI_BAO_QUAN_-_00.jpg',
        materialOptions: ['Vải Dù', 'Canvas'],
        dimensions: [
            { component: 'Size S', raw: '40×50 cm', valuesCm: [40, 50], axisConventionVerified: false },
            { component: 'Size M', raw: '42×52 cm', valuesCm: [42, 52], axisConventionVerified: false },
        ],
        features: ['Dây rút tiện lợi', 'Đeo 2 vai như balo', 'Gọn nhẹ'],
        notes: ['Dành cho các bé tự mang đồ.'],
    },
    'REF-BAG-SHOULDER': {
        referenceId: 'REF-BAG-SHOULDER',
        name: 'Túi bảo quản quai đeo',
        category: 'storage_bag',
        categoryNameVi: 'Túi bảo quản',
        sourceFile: 'sale-kit/TUI_BAO_QUAN_-_02.jpg',
        materialOptions: ['Vải Poly Canvas'],
        dimensions: [
            { component: 'Size S', raw: '48×40 cm', valuesCm: [48, 40], axisConventionVerified: false },
            { component: 'Size M', raw: '50×42 cm', valuesCm: [50, 42], axisConventionVerified: false },
        ],
        features: ['Quai đeo chéo vai tăng giảm chiều dài', 'Khóa kéo sau', 'Nhãn tên'],
        notes: ['Tiện cho phụ huynh chở xe máy.'],
    },
    'REF-BAG-BOX': {
        referenceId: 'REF-BAG-BOX',
        name: 'Túi hộp quai đeo',
        category: 'storage_bag',
        categoryNameVi: 'Túi bảo quản',
        sourceFile: 'sale-kit/TUI_BAO_QUAN_-_03.jpg',
        materialOptions: ['Vải Dù tráng nhựa'],
        dimensions: [
            { component: 'Size S', raw: '36×28 cm', valuesCm: [36, 28], axisConventionVerified: false },
            { component: 'Size M', raw: '36×30 cm', valuesCm: [36, 30], axisConventionVerified: false },
        ],
        features: ['Dáng hộp có hông', 'Khóa kéo phía trên', 'Form đứng chắc chắn'],
        notes: ['Dáng hộp đứng.'],
    },
    'REF-BAG-BOX-STITCH': {
        referenceId: 'REF-BAG-BOX-STITCH',
        name: 'Túi quai đeo hộp diễu',
        category: 'storage_bag',
        categoryNameVi: 'Túi bảo quản',
        sourceFile: 'sale-kit/TUI_BAO_QUAN_-_04.jpg',
        materialOptions: ['Vải Dù cao cấp'],
        dimensions: [
            { component: 'Size S', raw: '40×32 cm', valuesCm: [40, 32], axisConventionVerified: false },
            { component: 'Size M', raw: '45×35 cm', valuesCm: [45, 35], axisConventionVerified: false },
        ],
        features: ['Đường diễu gân viền tinh tế', 'Quai đeo bản rộng', 'Chống thấm nước'],
        notes: ['Phiên bản may diễu cao cấp.'],
    },
};

/**
 * Lấy Hero Bedding Product chính thức cho lớp học HULA 360 (REF-MAT-CARA-STD)
 */
export function getHeroBeddingProduct(): ProductReference {
    return PRODUCT_REFERENCES['REF-MAT-CARA-STD'];
}

/**
 * Lấy Túi bảo quản bàn giao chính thức (REF-BAG-HANDLE Size S)
 */
export function getHandoverBagProduct(): ProductReference {
    return PRODUCT_REFERENCES['REF-BAG-HANDLE'];
}

/**
 * Tra cứu thông tin sản phẩm theo reference ID
 */
export function getProductReference(refId: string): ProductReference | undefined {
    return PRODUCT_REFERENCES[refId];
}
