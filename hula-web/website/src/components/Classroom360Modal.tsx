'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';

// ============================================
// DATA TYPES & INTERFACES
// ============================================
export type CharacterId = 'teacher' | 'parent' | 'student';
export type StandpointId = 'classroom' | 'cubby' | 'macro';

export interface StandpointDef {
    id: StandpointId;
    name: string;
    subtitle: string;
    icon: string;
    image: string;
    defaultYaw: number;
    defaultPitch: number;
    defaultZoom: number;
    description: string;
}

export interface ScenarioStep {
    step: number;
    timeTag: string;
    title: string;
    actionBtn: string;
    monologue: string;
    standpoint: StandpointId;
    targetYaw: number;
    targetPitch: number;
    actionDetail: {
        heading: string;
        description: string;
        bulletPoints: string[];
        badge: string;
        quoteText: string;
        schoolName: string;
        projectLink?: string;
        photoPreview: string;
    };
    inspectorHighlight?: 'foam' | 'embroidery' | 'zipper' | 'storage';
}

export interface CharacterDef {
    id: CharacterId;
    name: string;
    roleTag: string;
    avatar: string;
    ageInfo: string;
    cameraHeight: string;
    canvasCenterRatio: number;
    initialStandpoint: StandpointId;
    initialYaw: number;
    initialPitch: number;
    themeColor: string;
    accentColor: string;
    bgGradient: string;
    introSpeech: string;
    scenarios: ScenarioStep[];
}

export interface Hotspot {
    id: string;
    standpoint: StandpointId | 'all';
    yaw: number;
    pitch: number;
    relativeY: number; // 0 (top) to 1 (bottom) in panoramic frame
    label: string;
    shortTitle: string;
    icon: string;
    perspective: 'teacher' | 'parent' | 'student' | 'all';
    badge: string;
    headline: string;
    photoPreview: string;
    quote: {
        text: string;
        source: string;
        school: string;
        link?: string;
    };
    highlights: string[];
    specs: { label: string; value: string }[];
    themeColor: string;
}

export interface ColorwayOption {
    id: string;
    name: string;
    hex: string;
    accentHex: string;
    description: string;
    tag: string;
}

// ============================================
// 3 REAL VR SHOWROOM STANDPOINTS (Góc Đứng Thực Tế)
// ============================================
const STANDPOINTS: Record<StandpointId, StandpointDef> = {
    classroom: {
        id: 'classroom',
        name: 'Toàn Cảnh Lớp Học & Dãy Nệm Ngủ',
        subtitle: 'Showroom Phòng Ngủ Mầm Non Bắc Âu',
        icon: '🏫',
        image: '/images/tour360/classroom_wide.jpg',
        defaultYaw: 140,
        defaultPitch: -8,
        defaultZoom: 1.0,
        description: 'Không gian phòng ngủ mầm non tràn ngập ánh sáng tự nhiên với sàn gỗ sồi ấm áp, nệm trải sàn ngăn nắp theo hàng.'
    },
    cubby: {
        id: 'cubby',
        name: 'Tủ Kệ Cá Nhân & Nệm Gấp Gọn',
        subtitle: 'Hệ Lưu Trữ Montessori Chuẩn Quốc Tế',
        icon: '🚪',
        image: '/images/tour360/cubby_nap.jpg',
        defaultYaw: 50,
        defaultPitch: -6,
        defaultZoom: 1.05,
        description: 'Góc nhìn cận cảnh nệm HULA gấp 3 khúc siêu tốc 30x40cm xếp vừa khít trong từng ô tủ cá nhân của các bé.'
    },
    macro: {
        id: 'macro',
        name: 'Bàn Soi Cấu Trúc Lõi Mút & Khóa Kéo',
        subtitle: 'Kiểm Định Vật Liệu Y Khoa & Vải Cotton',
        icon: '🔬',
        image: '/images/tour360/mattress_macro.jpg',
        defaultYaw: 200,
        defaultPitch: -15,
        defaultZoom: 1.15,
        description: 'Mặt cắt phóng đại lõi mút PU Foam y tế đàn hồi không xẹp lún, vải 100% cotton chần bông và khóa kéo an toàn giấu nẹp âm.'
    }
};

// ============================================
// 4 COLORWAYS (VRPlus 3.4 Product Customizer)
// ============================================
const COLORWAYS: ColorwayOption[] = [
    {
        id: 'cyan',
        name: 'Xanh Ngọc HULA Signature',
        hex: '#0284c7',
        accentHex: '#38bdf8',
        description: 'Tông màu mát lành dịu mắt chuẩn nhận diện, giúp giảm căng thẳng thần kinh thị giác cho trẻ mầm non.',
        tag: 'Bán chạy nhất'
    },
    {
        id: 'sage',
        name: 'Xanh Bơ Scandinavian',
        hex: '#16a34a',
        accentHex: '#4ade80',
        description: 'Xu hướng Bắc Âu tối giản, thanh lịch, tạo cảm giác gần gũi thiên nhiên và thư thái tuyệt đối.',
        tag: 'Xu hướng 2026'
    },
    {
        id: 'amber',
        name: 'Vàng Cam Năng Động',
        hex: '#ea580c',
        accentHex: '#fb923c',
        description: 'Tươi vui, ấm áp, kích thích trí tò mò và cảm xúc hào hứng cho lứa tuổi Mầm - Chồi.',
        tag: 'Trẻ trung'
    },
    {
        id: 'pink',
        name: 'Hồng Pastel Mộng Mơ',
        hex: '#db2777',
        accentHex: '#f472b6',
        description: 'Dịu dàng, ngọt ngào, chất liệu vải mềm mịn nâng niu giấc ngủ êm ái cho các bé gái.',
        tag: 'Dịu êm'
    },
];

// ============================================
// 3 CHARACTERS CONFIGURATION & POV SCENARIOS
// ============================================
const CHARACTERS: Record<CharacterId, CharacterDef> = {
    teacher: {
        id: 'teacher',
        name: 'Cô Giáo Mai',
        roleTag: 'Góc nhìn Giáo Viên Mầm Non',
        avatar: '👩‍🏫',
        ageInfo: '28 tuổi • Phụ trách lớp Chồi (28 bé)',
        cameraHeight: 'Tầm mắt 1.60m (Bao quát toàn cảnh lớp)',
        canvasCenterRatio: 0.44,
        initialStandpoint: 'cubby',
        initialYaw: 50,
        initialPitch: -6,
        themeColor: '#0284c7',
        accentColor: '#38bdf8',
        bgGradient: 'from-[#0369a1] to-[#0284c7]',
        introSpeech: 'Chào bạn! Mình là cô Mai. Mỗi ngày lớp có 28 bé bán trú, việc trải và cất 28 chiếc nệm từng là nỗi ám ảnh đau lưng của các cô. Hãy cùng mình trải nghiệm giải pháp nệm HULA tối ưu vận hành nhé!',
        scenarios: [
            {
                step: 1,
                timeTag: '11:30 Trưa',
                title: 'Mở Ô Tủ Cá Nhân Lấy Nệm',
                actionBtn: '👉 Mở ô tủ cá nhân lấy nệm HULA',
                monologue: 'Chuẩn bị tới giờ ngủ trưa rồi! Mình tiến lại hệ tủ cá nhân. Nệm HULA dạng gấp 3 khúc xếp vừa khít trong từng ô tủ 30x40cm, phòng học gọn gàng ngăn nắp tuyệt đối.',
                standpoint: 'cubby',
                targetYaw: 50,
                targetPitch: -6,
                actionDetail: {
                    heading: 'Hệ Tủ Kệ Thông Minh – Vừa Khít Ô Tủ Cá Nhân',
                    description: 'Nệm mầm non HULA được đo ni đóng giày theo kích thước chuẩn của các hệ tủ trường mầm non đô thị hiện đại. Mỗi ô tủ cá nhân chứa vừa vặn 1 bộ nệm - gối - mền.',
                    bulletPoints: [
                        'Thiết kế gấp 3 khúc siêu tốc chỉ mất 3 giây/bộ.',
                        'Kích thước gấp chỉ 30x40cm, tiết kiệm 70% không gian kho trữ.',
                        'Trọng lượng nhẹ (~750g), các cô mang vác nhẹ nhàng, không đau lưng.'
                    ],
                    badge: 'Tối Ưu Không Gian',
                    quoteText: 'Giải quyết bài toán diện tích hạn chế tại các trường mầm non trung tâm đô thị với bộ nệm gấp gọn thông minh.',
                    schoolName: 'Trường Mầm Non 19/5 TP.HCM (Quận 1)',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-195-thanh-pho',
                    photoPreview: '/images/tour360/cubby_nap.jpg'
                },
                inspectorHighlight: 'storage'
            },
            {
                step: 2,
                timeTag: '11:35 Trưa',
                title: 'Phân Loại Nệm Theo Tên Thêu Của Bé',
                actionBtn: '👉 Kiểm tra tên thêu & logo riêng của từng bé',
                monologue: 'Nhìn này, trên mép mỗi nệm và gối đều được thêu tên bé "Bé Bắp - Lớp Chồi 1" kèm logo trường sắc nét. Không còn tình trạng thất lạc đồ hay nằm nhầm nệm của nhau nữa!',
                standpoint: 'macro',
                targetYaw: 200,
                targetPitch: -15,
                actionDetail: {
                    heading: 'Thêu Tên Riêng Từng Bé & Logo Nhận Diện Trường',
                    description: 'Công nghệ thêu vi tính mật độ cao công nghiệp trực tiếp tại xưởng HULA, chỉ thêu cao cấp không phai màu sau hàng trăm lần giặt sấy công nghiệp.',
                    bulletPoints: [
                        'Tên riêng từng bé giúp cô giáo phát nệm chuẩn xác 100% trong nháy mắt.',
                        'Logo trường thêu chỉn chu, nâng tầm chuyên nghiệp khi đón tiếp phụ huynh.',
                        'Đường thêu phẳng mịn, giấu gút chỉ, không gây cộm cấn khi bé nằm xoay người.'
                    ],
                    badge: 'Cá Nhân Hóa 100%',
                    quoteText: 'Những bộ nệm túi ngủ thêu tên riêng từng bé cực kỳ chỉn chu trong từng đường kim mũi chỉ mang đến không gian say giấc hoàn hảo.',
                    schoolName: 'Trường Quốc Tế Piaget (Hành Trình Piaget)',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-piaget',
                    photoPreview: '/images/tour360/mattress_macro.jpg'
                },
                inspectorHighlight: 'embroidery'
            },
            {
                step: 3,
                timeTag: '11:40 Trưa',
                title: 'Trải Nệm & Lớp Vỏ Chống Thấm',
                actionBtn: '👉 Trải nệm ra sàn & kiểm tra lớp chống thấm',
                monologue: 'Mình trải nhanh nệm ra sàn gỗ. Lớp vải lót chống thấm thông minh bên trong ngăn trọn vẹn bụi sàn ẩm lạnh và sự cố bé tè dầm ngấm vào lõi mút. Vỏ nệm tháo giặt cực kỳ nhanh!',
                standpoint: 'classroom',
                targetYaw: 140,
                targetPitch: -8,
                actionDetail: {
                    heading: 'Lớp Vỏ Kháng Ẩm & Màng Thở TPU Chống Thấm 1 Chiều',
                    description: 'Kết cấu 2 lớp tách biệt: Vỏ ngoài Cotton Hàn Quốc êm ái, lớp trong trang bị màng chống thấm cao cấp ngăn nước nhưng vẫn thoát hơi ẩm, bảo vệ mút tuyệt đối.',
                    bulletPoints: [
                        'Khóa kéo may giấu nẹp âm, tránh tối đa trầy xước làn da nhạy cảm của bé.',
                        'Tháo rời vỏ áo nệm trong 15 giây, thuận tiện cho việc giặt sấy định kỳ mỗi tuần.',
                        'Ngăn hoàn toàn hơi ẩm từ nền gạch hay sàn gỗ xông lên cơ thể trẻ.'
                    ],
                    badge: 'Vệ Sinh Học Đường',
                    quoteText: 'Vừa nâng niu giấc ngủ của trẻ, vừa giải quyết triệt để bài toán vận hành và vệ sinh cho nhà trường.',
                    schoolName: 'Trường Mầm Non Nam Sài Gòn (Phú Mỹ Hưng)',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-nam-sai-gon',
                    photoPreview: '/images/tour360/classroom_wide.jpg'
                },
                inspectorHighlight: 'zipper'
            },
            {
                step: 4,
                timeTag: '13:45 Chiều',
                title: 'Dọn Nệm Siêu Tốc Trong 4 Phút',
                actionBtn: '👉 Bấm giờ thu dọn nệm cả lớp',
                monologue: 'Chuông báo thức reo! 28 bé cùng các cô gấp nệm làm 3 và cất lại vào ô tủ. Chỉ mất chưa đầy 4 phút là sàn lớp học đã sạch bóng thênh thang cho giờ học múa buổi chiều!',
                standpoint: 'classroom',
                targetYaw: 70,
                targetPitch: -6,
                actionDetail: {
                    heading: 'Giải Phóng 100% Mặt Sàn Lớp Học Buổi Chiều',
                    description: 'Quy trình thu dọn nệm nhanh gọn giải quyết bài toán thiếu diện tích phòng sinh hoạt chung tại các trường mầm non khu vực trung tâm đô thị.',
                    bulletPoints: [
                        '28 chiếc nệm cất gọn chỉ trong chưa đầy 4 phút.',
                        'Không cần phòng kho chứa nệm riêng biệt, tận dụng tối đa diện tích phòng học.',
                        'Các cô giáo không còn cảm giác đau lưng hay kiệt sức sau mỗi ca trực trưa.'
                    ],
                    badge: 'Hiệu Quả Vận Hành',
                    quoteText: 'HULA là đối tác cung cấp trang thiết bị nệm ngủ tin cậy cho Hệ thống Trường Mầm Non BAY.',
                    schoolName: 'Hệ Thống Trường Mầm Non BAY Preschool',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-bay',
                    photoPreview: '/images/tour360/cubby_nap.jpg'
                },
                inspectorHighlight: 'storage'
            }
        ]
    },
    parent: {
        id: 'parent',
        name: 'Mẹ Hương & Bố Dũng',
        roleTag: 'Góc nhìn Phụ Huynh Học Sinh',
        avatar: '👨‍👩‍👧',
        ageInfo: '32 tuổi • Có con 3 tuổi gửi trường bán trú',
        cameraHeight: 'Tầm mắt 1.55m (Soi cận cảnh chất liệu)',
        canvasCenterRatio: 0.50,
        initialStandpoint: 'macro',
        initialYaw: 200,
        initialPitch: -15,
        themeColor: '#059669',
        accentColor: '#34d399',
        bgGradient: 'from-[#065f46] to-[#059669]',
        introSpeech: 'Xin chào! Vợ chồng mình lần đầu gửi con đi học mầm non, lo nhất là giấc ngủ trưa của con ở trường: Nệm có êm không? Vải có độc hại không? Có bị cong vẹo cột sống không? Hãy cùng mình mục sở thị chất lượng nệm HULA nhé!',
        scenarios: [
            {
                step: 1,
                timeTag: '12:00 Trưa',
                title: 'Bước Vào Lớp Giờ Nghỉ Trưa',
                actionBtn: '👉 Tham quan phòng ngủ đồng bộ của con',
                monologue: 'Bước vào lớp giờ ngủ trưa, không gian thật yên bình và ấm cúng. Tất cả các bạn nhỏ đều nằm trên bộ nệm gối đồng bộ màu nhã nhặn, thêu logo trường chỉn chu.',
                standpoint: 'classroom',
                targetYaw: 140,
                targetPitch: -8,
                actionDetail: {
                    heading: 'Chuẩn Mực Chuyên Nghiệp Tạo Niềm Tin Tuyệt Đối',
                    description: 'Sự đồng bộ từ chăn, gối, nệm đến túi xách cá nhân thể hiện sự đầu tư bài bản và trách nhiệm của nhà trường đối với từng giấc ngủ của con em.',
                    bulletPoints: [
                        'Gam màu pastel dịu mắt giúp hệ thần kinh của trẻ thư giãn, dễ đi vào giấc ngủ.',
                        'Nhận diện thương hiệu đẳng cấp nâng tầm uy tín của trường trong mắt phụ huynh.',
                        'Tạo cho con cảm giác thuộc về một cộng đồng bạn bè thân thiện, an toàn.'
                    ],
                    badge: 'Đồng Bộ Hình Ảnh',
                    quoteText: 'Kiến tạo hệ thống sản phẩm chăm sóc giấc ngủ cao cấp, đáp ứng hoàn hảo các tiêu chuẩn khắt khe nhất về nhận diện thương hiệu.',
                    schoolName: 'Trường Mầm Non Sright Preschool',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-sright',
                    photoPreview: '/images/tour360/classroom_wide.jpg'
                }
            },
            {
                step: 2,
                timeTag: '12:05 Trưa',
                title: 'Cúi Xuống Sờ Thử Sợi Vải Tự Nhiên',
                actionBtn: '👉 Chạm vào bề mặt vải Cotton Hàn Quốc',
                monologue: 'Mình cúi xuống sờ thử bề mặt nệm. Vải Cotton Hàn Quốc 100% tự nhiên mềm mịn như lụa, mát tay, không có bụi vải hay mùi hôi hóa chất. Con da nhạy cảm nằm đây chắc chắn không lo dị ứng!',
                standpoint: 'macro',
                targetYaw: 200,
                targetPitch: -15,
                actionDetail: {
                    heading: '100% Vải Cotton Hàn Quốc & Tencel Tự Nhiên',
                    description: 'Làn da của trẻ mầm non mỏng manh gấp 5 lần người lớn. HULA tuyển chọn khắt khe các loại vải sợi tự nhiên cao cấp, thoáng khí và thấm hút mồ hôi tối ưu.',
                    bulletPoints: [
                        'Không chứa Formaldehyde, không kim loại nặng, đạt chứng nhận an toàn cho trẻ sơ sinh.',
                        'Sợi vải chải kỹ mật độ cao, không xù lông, không bay bụi bông gây dị ứng hô hấp.',
                        'Khả năng tản nhiệt thông minh giúp lưng bé luôn khô ráo, không bị rôm sảy hay mồ hôi trộm.'
                    ],
                    badge: '100% An Toàn',
                    quoteText: 'Chinh phục khách hàng bằng chất lượng thật – Nệm Hula với chất liệu êm ái, thoáng khí và an toàn tuyệt đối.',
                    schoolName: 'Kindy Garden International Preschool',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-kindy-garden',
                    photoPreview: '/images/tour360/mattress_macro.jpg'
                },
                inspectorHighlight: 'foam'
            },
            {
                step: 3,
                timeTag: '12:10 Trưa',
                title: 'Bóp Thử Độ Đàn Hồi Ruột Mút Y Khoa',
                actionBtn: '👉 Ấn thử độ đàn hồi ruột mút PU Foam',
                monologue: 'Mình ấn mạnh tay xuống nệm rồi buông ra: Mút bật lại ngay lập tức! Ruột mút định hình PU Foam tỷ trọng cao nâng đỡ êm ái, độ cứng vừa phải chuẩn y khoa, bảo vệ cột sống non nớt của con.',
                standpoint: 'macro',
                targetYaw: 215,
                targetPitch: -18,
                actionDetail: {
                    heading: 'Lõi Mút PU Foam Định Hình – Nâng Đỡ Chuẩn Y Khoa',
                    description: 'Xương sống trẻ từ 1-6 tuổi đang trong giai đoạn phát triển then chốt. Nệm quá mềm sẽ gây võng lưng gù vẹo, nệm quá cứng lại gây đau nhức các khớp xương.',
                    bulletPoints: [
                        'Độ đàn hồi chuẩn D25/D30 y tế, nâng đỡ đa điểm theo đường cong sinh lý cột sống.',
                        'Cam kết không xẹp lún, không biến dạng sau hơn 3 năm sử dụng liên tục tại trường.',
                        'Độ dày lý tưởng 3cm - 5cm cách nhiệt tuyệt hảo với mặt sàn gạch men lạnh.'
                    ],
                    badge: 'Bảo Vệ Cột Sống',
                    quoteText: 'Hula tự hào được đại diện trường tin tưởng lựa chọn đồng hành với triết lý: "Không ngại đầu tư những điều tốt nhất cho các con".',
                    schoolName: 'Trường Mầm Non Montessori Việt Nam Canada',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-montessori-viet-nam-canada-2025',
                    photoPreview: '/images/tour360/mattress_macro.jpg'
                },
                inspectorHighlight: 'foam'
            },
            {
                step: 4,
                timeTag: '12:15 Trưa',
                title: 'Kiểm Tra Khóa Kéo Giấu Kín',
                actionBtn: '👉 Tìm đầu khóa kéo an toàn',
                monologue: 'Mình tìm đầu khóa kéo: Nằm giấu kín mít bên dưới lớp nẹp vải bảo vệ! Con tha hồ lăn lộn mà không sợ va đập hay trầy xước da mặt. Nhà trường chọn nệm HULA phụ huynh thực sự an tâm 100%!',
                standpoint: 'macro',
                targetYaw: 190,
                targetPitch: -12,
                actionDetail: {
                    heading: 'Thiết Kế Khóa Kéo Âm An Toàn 360° Cho Trẻ Nhỏ',
                    description: 'Mọi chi tiết cơ khí cứng như con lăn, răng kéo, móc khóa đều được che giấu kỹ lưỡng dưới lớp viền nẹp bo tròn êm ái.',
                    bulletPoints: [
                        'Không có góc nhọn hay kim loại thừa lộ ra ngoài tiếp xúc với cơ thể trẻ.',
                        'Tay kéo êm trơn tru, cô giáo dễ thao tác tháo vỏ nhưng bé nhỏ không tự nghịch mở ruột ra được.',
                        'Bền chắc, chống gỉ sét, chịu được hàng trăm chu trình máy giặt công nghiệp.'
                    ],
                    badge: 'An Toàn Tối Đa',
                    quoteText: 'Bộ nệm mầm non hoàn hảo cả về độ êm lẫn độ an toàn cơ học cho từng cử động của các bé.',
                    schoolName: 'ILO Academy (Học Viện Mầm Non Quốc Tế ILO)',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-ilo-academy',
                    photoPreview: '/images/tour360/mattress_macro.jpg'
                },
                inspectorHighlight: 'zipper'
            }
        ]
    },
    student: {
        id: 'student',
        name: 'Bé Bắp (Lớp Chồi)',
        roleTag: 'Góc nhìn Học Sinh Mầm Non',
        avatar: '🧒',
        ageInfo: '4 tuổi • Tự giác và yêu thích giờ ngủ trưa',
        cameraHeight: 'Tầm mắt 0.95m (Góc nhìn tầm thấp của bé)',
        canvasCenterRatio: 0.64,
        initialStandpoint: 'classroom',
        initialYaw: 135,
        initialPitch: -10,
        themeColor: '#d97706',
        accentColor: '#fbbf24',
        bgGradient: 'from-[#b45309] to-[#d97706]',
        introSpeech: 'Dạ con chào cô chú! Con tên là Bắp. Con học lớp Chồi 2 nè. Hồi xưa ở nhà con lười ngủ trưa lắm, nhưng đi học trường có nệm khủng long êm ơi là êm, con thích ngủ với các bạn lắm!',
        scenarios: [
            {
                step: 1,
                timeTag: '11:30 Trưa',
                title: 'Con Tự Đi Lấy Nệm Về Chỗ',
                actionBtn: '👉 Giúp bé Bắp nhấc nệm ra khỏi ô tủ',
                monologue: 'Tới giờ ngủ trưa rồi! Cô Mai mở tủ, con tự chạy lại lấy chiếc nệm có hình bạn Khủng Long thêu tên con. Nệm nhẹ tênh à, con tự ôm về chỗ ngủ của con được luôn!',
                standpoint: 'cubby',
                targetYaw: 50,
                targetPitch: -6,
                actionDetail: {
                    heading: 'Rèn Luyện Tính Tự Lập Theo Phương Pháp Montessori',
                    description: 'Trọng lượng siêu nhẹ chỉ từ 650g - 850g giúp bé từ 3 tuổi có thể tự tay nâng, mang và định vị chỗ ngủ của mình mà không cần người lớn bế ẵm.',
                    bulletPoints: [
                        'Kích thích ý thức tự phục vụ bản thân ngay từ lứa tuổi mẫu giáo.',
                        'Kích thước vừa vặn sải tay của bé, các góc bo tròn an toàn không gây vấp ngã.',
                        'Bé tự hào khoe với ba mẹ mỗi chiều: "Hôm nay con tự lấy nệm và tự trải nệm giỏi lắm!"'
                    ],
                    badge: 'Rèn Tính Tự Lập',
                    quoteText: 'Giải pháp nệm HULA khuyến khích tinh thần tự giác và hào hứng cho các bé trong mọi hoạt động sinh hoạt bán trú.',
                    schoolName: 'Trường Mầm Non Dino Kinder',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-dino-kinder',
                    photoPreview: '/images/tour360/cubby_nap.jpg'
                },
                inspectorHighlight: 'storage'
            },
            {
                step: 2,
                timeTag: '11:35 Trưa',
                title: 'Trải Nệm Hình Bạn Thú Dễ Thương',
                actionBtn: '👉 Bung nệm 3 khúc ra sàn lớp học',
                monologue: 'Con bung nệm ra cái vèo! Wow, bạn Khủng Long xanh đang cười với con nè. Bạn Thỏ của bạn Na bên cạnh cũng đẹp lắm. Nệm êm và thơm tho mùi nắng, con thích lắm!',
                standpoint: 'classroom',
                targetYaw: 140,
                targetPitch: -10,
                actionDetail: {
                    heading: 'Họa Tiết Sinh Động Nuôi Dưỡng Trí Tưởng Tượng',
                    description: 'Các bộ sưu tập họa tiết độc quyền: Thế giới khủng long vui nhộn, Vũ trụ phi hành gia, Rừng xanh nhiệt đới kích thích thị giác tích cực cho trẻ.',
                    bulletPoints: [
                        'Mực in gốc nước an toàn theo tiêu chuẩn OEKO-TEX, không độc hại khi bé cắn ngậm.',
                        'Tạo tâm lý hào hứng, xua tan nỗi sợ xa ba mẹ khi đi học những tuần đầu tiên.',
                        'Màu sắc tươi sáng nhưng nhã nhặn, không gây chói gắt mắt bé.'
                    ],
                    badge: 'Thế Giới Tuổi Thơ',
                    quoteText: 'Những bộ nệm mang màu sắc ấm áp, tạo cho trẻ cảm giác được nâng niu và yêu thương như đang ở trong chính ngôi nhà của mình.',
                    schoolName: 'Hệ Thống Mầm Non Quốc Tế Khai Sáng',
                    projectLink: '/du-an',
                    photoPreview: '/images/tour360/classroom_wide.jpg'
                }
            },
            {
                step: 3,
                timeTag: '11:45 Trưa',
                title: 'Nằm Say Giấc Êm Ái Như Vòng Tay Mẹ',
                actionBtn: '👉 Nằm xuống nệm nghe nhạc ru êm ái',
                monologue: 'Con mở nệm ra nằm xuống. Nệm êm ru, gối mềm xốp, chăn ấm áp ôm trọn người con. Có tiếng nhạc ru du dương ngoài phòng khách, con nhắm mắt ngủ một giấc thật ngon...',
                standpoint: 'classroom',
                targetYaw: 180,
                targetPitch: -14,
                actionDetail: {
                    heading: 'Giấc Ngủ Sâu Tái Tạo Năng Lượng Cho Bé',
                    description: 'Giấc ngủ trưa từ 1.5 - 2 tiếng có ý nghĩa sống còn đối với sự phát triển não bộ và chiều cao của trẻ mầm non. Nệm HULA mang lại giấc ngủ sâu, không giật mình thức giấc.',
                    bulletPoints: [
                        'Không gây bí bách hay hầm nóng vùng lưng và gáy bé.',
                        'Gối bông êm ái nâng đỡ đốt sống cổ tự nhiên, cho giấc ngủ thư thái.',
                        'Bé thức dậy với tâm trạng vui vẻ, hào hứng tham gia các hoạt động buổi chiều.'
                    ],
                    badge: 'Chăm Chút Giấc Ngủ',
                    quoteText: 'Một không gian say giấc hoàn hảo cho các thiên thần nhỏ nạp đầy năng lượng học tập và vui chơi.',
                    schoolName: 'Trường Mầm Non Hugo House',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-hugo-house',
                    photoPreview: '/images/tour360/classroom_wide.jpg'
                },
                inspectorHighlight: 'foam'
            },
            {
                step: 4,
                timeTag: '13:45 Chiều',
                title: 'Thức Dậy Tự Hào Cùng Bạn Gấp Nệm',
                actionBtn: '👉 Gấp nệm lại làm 3 cất vào ô tủ',
                monologue: 'Con thức dậy rồi! Con tự tay gấp nệm lại làm 3 khúc nè, rồi mang lại ô tủ của bạn Khủng Long. Cô giáo khen con ngoan và thưởng cho con một bông hoa điểm mười!',
                standpoint: 'cubby',
                targetYaw: 50,
                targetPitch: -6,
                actionDetail: {
                    heading: 'Niềm Vui Tự Giác Sau Giờ Ngủ Trưa',
                    description: 'Hành động tự gấp nệm mỗi trưa giúp các con rèn luyện tính gọn gàng ngăn nắp, tinh thần trách nhiệm và niềm tự hào khi hoàn thành công việc của mình.',
                    bulletPoints: [
                        'Các nếp gấp định hình sẵn giúp bé 3 tuổi cũng có thể gập nệm vuông vức.',
                        'Tạo tinh thần gắn kết tập thể khi các bạn nhỏ cùng nhau thu dọn lớp học.',
                        'Ghi điểm tuyệt đối trong mắt phụ huynh khi thấy con lớn khôn và tự lập mỗi ngày.'
                    ],
                    badge: 'Trưởng Thành Mỗi Ngày',
                    quoteText: 'Minh chứng rõ nét nhất cho chất lượng thật và giá trị giáo dục nhân văn mà sản phẩm HULA mang lại cho các trường mầm non.',
                    schoolName: 'Hệ Thống Mầm Non Chuẩn Quốc Gia',
                    projectLink: '/du-an',
                    photoPreview: '/images/tour360/cubby_nap.jpg'
                },
                inspectorHighlight: 'storage'
            }
        ]
    }
};

// ============================================
// 5 INTERACTIVE HOTSPOTS (VR Radar Pulse Markers)
// ============================================
const HOTSPOTS: Hotspot[] = [
    {
        id: 'hs-storage',
        standpoint: 'cubby',
        yaw: 45,
        pitch: -5,
        relativeY: 0.48,
        label: 'Tủ Kệ Lưu Trữ & Nệm Gấp Gọn 3 Giây',
        shortTitle: 'Nệm Gấp Gọn & Ô Tủ',
        icon: '📦',
        perspective: 'teacher',
        badge: 'Tối Ưu Vận Hành',
        headline: 'Giải phóng 100% diện tích sàn lớp học chỉ sau 3-5 phút dọn dẹp',
        photoPreview: '/images/tour360/cubby_nap.jpg',
        quote: {
            text: 'Hula mang đến giải pháp toàn diện với Bộ Gối - Nệm - Túi cao cấp [...] giải quyết bài toán tối ưu diện tích không gian lớp học.',
            source: 'Dự án Cung cấp giải pháp nệm cho Trường MN 19/5 Thành phố',
            school: 'Trường Mầm Non 19/5 TP.HCM',
            link: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-195-thanh-pho'
        },
        highlights: [
            'Thiết kế gấp 3 hoặc cuộn túi ngủ siêu tốc, thao tác nhẹ nhàng cho cô giáo.',
            'Kích thước chuẩn khít theo từng ngăn tủ cá nhân của lớp học mầm non hiện đại.',
            'Trọng lượng siêu nhẹ (~750g), giảm áp lực mang vác hàng ngày cho giáo viên bán trú.',
            'Không gian sàn được giải phóng tức thì cho hoạt động thể chất và giờ học buổi chiều.'
        ],
        specs: [
            { label: 'Quy cách gấp', value: 'Gấp 3 khúc gọn hoặc Túi ngủ cuộn' },
            { label: 'Thời gian thao tác', value: '3 - 5 giây / bộ' },
            { label: 'Trọng lượng', value: 'Khoảng 650g - 850g (siêu nhẹ)' },
            { label: 'Chứng thực', value: 'MN 19/5, MN Nam Sài Gòn' }
        ],
        themeColor: '#0284c7'
    },
    {
        id: 'hs-embroidery',
        standpoint: 'macro',
        yaw: 185,
        pitch: -12,
        relativeY: 0.52,
        label: 'Thêu Tên Bé & Logo Đồng Bộ Trường',
        shortTitle: 'Thêu Tên & Logo Trường',
        icon: '🏷️',
        perspective: 'teacher',
        badge: 'Quản Lý Khoa Học',
        headline: 'Mỗi bé một dấu ấn riêng – Chấm dứt tình trạng thất lạc và nhầm lẫn đồ',
        photoPreview: '/images/tour360/mattress_macro.jpg',
        quote: {
            text: 'Dự án ghi dấu ấn mạnh mẽ với những bộ túi ngủ đồng bộ, đẹp mắt và cực kỳ chỉn chu trong từng đường kim mũi chỉ, mang đến một không gian say giấc hoàn hảo.',
            source: 'Dự án Trường Hành Trình Piaget',
            school: 'Trường Mầm Non Quốc Tế Piaget',
            link: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-piaget'
        },
        highlights: [
            'Thêu vi tính tên bé + biểu tượng con giáp/lớp học sắc nét, không bay màu.',
            'Giúp giáo viên phân loại và lấy đúng nệm của từng bé trong nháy mắt.',
            'Đồng bộ nhận diện màu sắc & logo trường học, tạo thiện cảm chuyên nghiệp với phụ huynh.',
            'Chỉ thêu mềm mịn, không gây cộm cấn khi bé nằm xoay người.'
        ],
        specs: [
            { label: 'Kỹ thuật thêu', value: 'Thêu vi tính mật độ cao công nghiệp' },
            { label: 'Độ bền chỉ', value: 'Chịu được giặt sấy nhiệt độ cao' },
            { label: 'Nhận diện', value: 'Thêu logo trường + tên riêng từng bé' },
            { label: 'Chứng thực', value: 'Hệ thống Piaget, Sright Preschool' }
        ],
        themeColor: '#0ea5e9'
    },
    {
        id: 'hs-ergonomics',
        standpoint: 'macro',
        yaw: 215,
        pitch: -18,
        relativeY: 0.60,
        label: 'Cấu Tạo Ruột Nệm Chuẩn Y Khoa 100% An Toàn',
        shortTitle: 'Ruột Mút Y Khoa',
        icon: '🩺',
        perspective: 'parent',
        badge: 'Chuẩn Y Tế Học Đường',
        headline: 'Nâng niu cột sống non nớt của trẻ với chất liệu không độc hại',
        photoPreview: '/images/tour360/mattress_macro.jpg',
        quote: {
            text: 'Hula tự hào được đại diện trường tin tưởng lựa chọn làm đối tác đồng hành từ những ngày đầu thành lập, cùng chung tầm nhìn: "Không ngại đầu tư những điều tốt nhất cho các con".',
            source: 'Dự án Trường Mầm Non Montessori Việt Nam Canada',
            school: 'Montessori Việt Nam Canada',
            link: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-montessori-viet-nam-canada-2025'
        },
        highlights: [
            'Lõi mút tỷ trọng cao định hình, độ đàn hồi chuẩn hỗ trợ phát triển xương cột sống bé.',
            '100% không chứa Formaldehyde, không kim loại nặng, không mùi hôi công nghiệp.',
            'Vải bọc Cotton Hàn Quốc 100% tự nhiên hoặc Tencel thoáng khí, mát lưng, không hầm nóng.',
            'Được hơn 500+ trường mầm non chuẩn quốc gia và quốc tế tin tưởng sử dụng suốt 10 năm qua.'
        ],
        specs: [
            { label: 'Chất liệu ruột', value: 'Mousse PU Foam y tế đàn hồi cao' },
            { label: 'Vải bọc chính', value: 'Cotton Hàn Quốc 100% / Tencel sợi tự nhiên' },
            { label: 'Kiểm định', value: 'Không Formaldehyde, an toàn sơ sinh' },
            { label: 'Chứng thực', value: 'ILO Academy, Montessori VN Canada' }
        ],
        themeColor: '#059669'
    },
    {
        id: 'hs-hygiene',
        standpoint: 'classroom',
        yaw: 160,
        pitch: -10,
        relativeY: 0.58,
        label: 'Khóa Kéo Giấu Kín & Vỏ Chống Thấm',
        shortTitle: 'Khóa Ẩn & Chống Thấm',
        icon: '🛡️',
        perspective: 'parent',
        badge: 'An Toàn Tuyệt Đối',
        headline: 'Bảo vệ toàn diện: Chống trầy xước da bé và ngăn thấm mồ hôi, ẩm mốc',
        photoPreview: '/images/tour360/classroom_wide.jpg',
        quote: {
            text: 'Hành trình đồng hành cùng Hệ thống Trường mầm non Kindy Garden chính là minh chứng rõ nét nhất cho triết lý "chinh phục khách hàng bằng chất lượng thật".',
            source: 'Dự án Cung cấp hệ thống nệm Kindy Garden International',
            school: 'Kindy Garden International',
            link: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-kindy-garden'
        },
        highlights: [
            'Đầu khóa kéo được giấu chìm hoàn toàn dưới nẹp vải bảo vệ, không cọ xát vào da trẻ.',
            'Lớp lót chống thấm thông minh ngăn sữa đổ hoặc bé tè dầm ngấm sâu vào lõi mút.',
            'Dễ dàng tháo rời vỏ áo nệm để giặt phơi định kỳ mỗi tuần.',
            'Đường may kép gia cố mép nệm, bền bỉ ngay cả khi giặt máy công nghiệp.'
        ],
        specs: [
            { label: 'Khóa kéo', value: 'Dây kéo giấu âm an toàn tuyệt đối' },
            { label: 'Lớp chống thấm', value: 'Màng TPU thở 1 chiều ngăn nước thấm' },
            { label: 'Bảo quản', value: 'Vỏ tháo rời tiện giặt sấy hàng tuần' },
            { label: 'Chứng thực', value: 'Kindy Garden, BAY Preschool' }
        ],
        themeColor: '#10b981'
    },
    {
        id: 'hs-independence',
        standpoint: 'classroom',
        yaw: 120,
        pitch: -12,
        relativeY: 0.55,
        label: 'Khu Vực Bé Tự Lập Gấp Nệm & Ngủ Ngoan',
        shortTitle: 'Bé Tự Lập Gấp Nệm',
        icon: '🧸',
        perspective: 'student',
        badge: 'Rèn Luyện Tự Lập',
        headline: 'Giờ ngủ trưa êm ái như ở nhà – Bé tự hào tự phục vụ bản thân',
        photoPreview: '/images/tour360/classroom_wide.jpg',
        quote: {
            text: 'Nhờ thiết kế tối ưu, trọng lượng nhẹ và dễ dàng thao tác, các bé mầm non hoàn toàn có thể tự tay trải và gấp nệm của mình. Đây là phương pháp tuyệt vời giúp nhà trường rèn luyện tính kỷ luật và sự tự giác.',
            source: 'Website nemmamnon.com – Thao tác dễ dàng, rèn tính tự lập',
            school: 'Dino Kinder & Các Trường Thực Nghiệm',
            link: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-dino-kinder'
        },
        highlights: [
            'Họa tiết các bạn khủng long, phi hành gia, rừng xanh thân thuộc tạo cảm giác thích thú.',
            'Trọng lượng nệm chỉ vài trăm gram, vừa sức tay các bé từ 2 - 5 tuổi tự bê và trải nệm.',
            'Tập cho bé thói quen gọn gàng ngăn nắp theo phương pháp giáo dục sớm Montessori.',
            'Nệm êm ái, nâng đỡ dịu nhẹ giúp bé dễ dàng đi vào giấc ngủ trưa sâu giấc mà không khóc đòi mẹ.'
        ],
        specs: [
            { label: 'Họa tiết', value: 'Chủ đề sinh động (Động vật, Khủng long, Vũ trụ)' },
            { label: 'Độ thân thiện', value: 'Cạnh bo tròn êm ái, khóa không góc nhọn' },
            { label: 'Ý nghĩa giáo dục', value: 'Rèn tính tự lập, ý thức ngăn nắp' },
            { label: 'Chứng thực', value: 'Dino Kinder, Những Ngón Tay Bay' }
        ],
        themeColor: '#d97706'
    }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    settings?: any;
}

export default function Classroom360Modal({ isOpen, onClose, settings }: Props) {
    // Character and Scenario State
    const [selectedCharacter, setSelectedCharacter] = useState<CharacterId | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isFreeLook, setIsFreeLook] = useState<boolean>(false);

    // Standpoint and Colorway State (VRPlus features)
    const [activeStandpoint, setActiveStandpoint] = useState<StandpointId>('classroom');
    const [activeColorway, setActiveColorway] = useState<ColorwayOption>(COLORWAYS[0]);
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

    // Camera & Canvas Controls
    const [yaw, setYaw] = useState<number>(140);
    const [pitch, setPitch] = useState<number>(-8);
    const [zoom, setZoom] = useState<number>(1.0);
    const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Modals & Panels
    const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
    const [activeActionModal, setActiveActionModal] = useState<ScenarioStep['actionDetail'] | null>(null);
    const [inspectorTab, setInspectorTab] = useState<'layers' | 'elasticity' | 'zipper' | 'specs' | null>(null);
    const [elasticityPressed, setElasticityPressed] = useState<boolean>(false);

    // Audio Ambiance Synthesizer
    const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioTimerRef = useRef<any>(null);

    // Canvas & Image Preloading
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef<boolean>(false);
    const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const targetYawRef = useRef<number | null>(null);
    const targetPitchRef = useRef<number | null>(null);
    const imagesRef = useRef<Record<string, HTMLImageElement>>({});
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

    const currentCharacter = useMemo(() => {
        if (!selectedCharacter) return null;
        return CHARACTERS[selectedCharacter];
    }, [selectedCharacter]);

    const currentScenario = useMemo(() => {
        if (!currentCharacter) return null;
        return currentCharacter.scenarios[currentStepIndex] || currentCharacter.scenarios[0];
    }, [currentCharacter, currentStepIndex]);

    // Preload all real 360 panoramic images
    useEffect(() => {
        if (!isOpen) return;

        Object.values(STANDPOINTS).forEach(sp => {
            if (!imagesRef.current[sp.id]) {
                const img = new Image();
                img.src = sp.image;
                img.onload = () => {
                    imagesRef.current[sp.id] = img;
                    setImagesLoaded(prev => ({ ...prev, [sp.id]: true }));
                };
            }
        });
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (inspectorTab) {
                    setInspectorTab(null);
                } else if (activeActionModal) {
                    setActiveActionModal(null);
                } else if (activeHotspot) {
                    setActiveHotspot(null);
                } else if (selectedCharacter) {
                    setSelectedCharacter(null);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, inspectorTab, activeActionModal, activeHotspot, selectedCharacter, onClose]);

    // Lullaby synthesizer via Web Audio API (gentle music box chime)
    const playLullabyNote = useCallback((freq: number, duration: number) => {
        if (!audioCtxRef.current) return;
        try {
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch { }
    }, []);

    // Audio Lullaby loop
    useEffect(() => {
        if (isAudioMuted || !isOpen) {
            if (audioTimerRef.current) clearInterval(audioTimerRef.current);
            return;
        }

        try {
            if (!audioCtxRef.current) {
                const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtxClass) {
                    audioCtxRef.current = new AudioCtxClass();
                }
            }
            if (audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            const melody = [261.63, 261.63, 329.63, 261.63, 329.63, 392.00, 329.63, 261.63, 293.66, 329.63, 293.66];
            let noteIdx = 0;

            audioTimerRef.current = setInterval(() => {
                const note = melody[noteIdx % melody.length];
                playLullabyNote(note, 1.2);
                noteIdx++;
            }, 1400);
        } catch (e) {
            console.log('Audio init skipped', e);
        }

        return () => {
            if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        };
    }, [isAudioMuted, isOpen, playLullabyNote]);

    // Select character and set initial camera height and standpoint
    const handleSelectCharacter = (charId: CharacterId) => {
        const char = CHARACTERS[charId];
        setSelectedCharacter(charId);
        setCurrentStepIndex(0);
        setIsFreeLook(false);
        setActiveStandpoint(char.initialStandpoint);
        setYaw(char.initialYaw);
        setPitch(char.initialPitch);
        setActiveHotspot(null);
        setActiveActionModal(null);
    };

    // Change Standpoint (VR Viewpoint Switcher)
    const handleSwitchStandpoint = (spId: StandpointId) => {
        const sp = STANDPOINTS[spId];
        setActiveStandpoint(spId);
        setYaw(sp.defaultYaw);
        setPitch(sp.defaultPitch);
        setZoom(sp.defaultZoom);
        targetYawRef.current = null;
        targetPitchRef.current = null;
    };

    // Smooth Auto-Pan to target angle when scenario step changes
    useEffect(() => {
        if (!currentScenario || isFreeLook) return;
        if (currentScenario.standpoint) {
            setActiveStandpoint(currentScenario.standpoint);
        }
        targetYawRef.current = currentScenario.targetYaw;
        targetPitchRef.current = currentScenario.targetPitch;
    }, [currentScenario, isFreeLook]);

    // Main 60FPS animation loop: Photorealistic Real-Time Panoramic Rendering
    useEffect(() => {
        if (!isOpen) return;

        let lastTime = performance.now();
        let animId: number;

        const loop = (currentTime: number) => {
            const delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Smooth pan interpolation towards scenario target
            if (targetYawRef.current !== null && !isDraggingRef.current && !isFreeLook) {
                setYaw(prev => {
                    const target = targetYawRef.current!;
                    const diff = ((target - prev + 540) % 360) - 180;
                    if (Math.abs(diff) < 0.25) {
                        targetYawRef.current = null;
                        return target;
                    }
                    return (prev + diff * Math.min(1, delta * 4) + 360) % 360;
                });
            }

            if (targetPitchRef.current !== null && !isDraggingRef.current && !isFreeLook) {
                setPitch(prev => {
                    const target = targetPitchRef.current!;
                    const diff = target - prev;
                    if (Math.abs(diff) < 0.25) {
                        targetPitchRef.current = null;
                        return target;
                    }
                    return prev + diff * Math.min(1, delta * 4);
                });
            }

            // Auto rotate if enabled
            if (isAutoRotate && !isDraggingRef.current && !activeActionModal && !activeHotspot) {
                setYaw(prev => (prev + delta * 6) % 360);
            }

            // Render Panoramic Canvas with Photorealistic Wrap
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const parentW = canvas.parentElement?.clientWidth || 1200;
                    const parentH = canvas.parentElement?.clientHeight || 700;

                    if (canvas.width !== parentW || canvas.height !== parentH) {
                        canvas.width = parentW;
                        canvas.height = parentH;
                    }

                    const width = canvas.width;
                    const height = canvas.height;
                    const centerRatio = currentCharacter ? currentCharacter.canvasCenterRatio : 0.50;

                    ctx.clearRect(0, 0, width, height);

                    const activeImg = imagesRef.current[activeStandpoint];

                    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
                        const imgAspect = activeImg.naturalWidth / activeImg.naturalHeight;
                        const drawH = height * 1.30 * zoom;
                        const drawW = drawH * imgAspect;

                        const normYaw = ((yaw % 360) + 360) % 360;
                        const xPan = (normYaw / 360) * drawW;
                        const yPan = (pitch / 35) * (height * 0.25);
                        const drawY = (height - drawH) / 2 + yPan + (centerRatio - 0.5) * height;

                        // Wrap image horizontally across viewport
                        const startTile = Math.floor((-xPan - width) / drawW);
                        const endTile = Math.ceil((width - xPan + width) / drawW);

                        for (let i = startTile; i <= endTile; i++) {
                            const drawX = -xPan + i * drawW;
                            ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);
                        }

                        // Luxury Showroom Vignette & Depth
                        const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.85);
                        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
                        vignette.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
                        ctx.fillStyle = vignette;
                        ctx.fillRect(0, 0, width, height);

                        // Subtle Colorway Tint (VRPlus feature 3.4)
                        if (activeColorway.id !== 'cyan') {
                            ctx.save();
                            ctx.globalCompositeOperation = 'soft-light';
                            ctx.fillStyle = activeColorway.hex;
                            ctx.globalAlpha = 0.12;
                            ctx.fillRect(0, 0, width, height);
                            ctx.restore();
                        }
                    } else {
                        // Fallback sleek gradient while loading real image
                        const grad = ctx.createLinearGradient(0, 0, 0, height);
                        grad.addColorStop(0, '#0f172a');
                        grad.addColorStop(1, '#1e293b');
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, width, height);

                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '16px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('Đang tải không gian 360° thực tế...', width / 2, height / 2);
                    }
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [isOpen, yaw, pitch, zoom, isAutoRotate, isFreeLook, currentCharacter, activeStandpoint, activeColorway, activeActionModal, activeHotspot]);

    // Drag / Touch Controls for 360 Free Navigation
    const handlePointerDown = (e: React.PointerEvent) => {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        targetYawRef.current = null;
        targetPitchRef.current = null;
        setIsFreeLook(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        const sensitivity = 0.22 / zoom;
        setYaw(prev => (prev - dx * sensitivity + 360) % 360);
        setPitch(prev => Math.max(-35, Math.min(35, prev + dy * sensitivity)));
    };

    const handlePointerUp = () => {
        isDraggingRef.current = false;
    };

    // Zoom via wheel
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => Math.max(0.85, Math.min(2.2, prev - e.deltaY * 0.0012)));
    };

    // Hotspot Screen Position Calculator for HTML Overlay
    const visibleHotspots = useMemo(() => {
        if (!canvasRef.current) return [];
        const w = canvasRef.current.clientWidth || 1200;
        const h = canvasRef.current.clientHeight || 700;
        const centerRatio = currentCharacter ? currentCharacter.canvasCenterRatio : 0.50;

        return HOTSPOTS.filter(hs => hs.standpoint === activeStandpoint || hs.standpoint === 'all').map(hs => {
            const diffYaw = ((hs.yaw - yaw + 540) % 360) - 180;
            const fov = 85 / zoom;

            if (Math.abs(diffYaw) > fov / 1.7) {
                return null;
            }

            const screenX = w / 2 + (diffYaw / (fov / 2)) * (w / 2);
            const pitchOffset = (pitch / 35) * (h * 0.25);
            const screenY = h * (hs.relativeY || 0.5) + pitchOffset + (centerRatio - 0.5) * h;

            return {
                ...hs,
                screenX,
                screenY
            };
        }).filter(Boolean) as (Hotspot & { screenX: number; screenY: number })[];
    }, [activeStandpoint, yaw, pitch, zoom, currentCharacter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-all duration-300">
            {/* Main Showroom Container */}
            <div
                ref={containerRef}
                className={`relative w-full h-full ${isFullscreen ? 'max-w-none max-h-none' : 'max-w-[1580px] max-h-[94vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl'} flex flex-col bg-slate-950 select-none`}
            >
                {/* 1. TOP HEADER: VR Control Bar & POV Switcher */}
                <header className="h-16 px-4 sm:px-6 bg-slate-900/85 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20 shrink-0">
                    {/* Left: Brand & Active Standpoint */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-primary-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-sky-500/25">
                            360°
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-white font-bold text-sm sm:text-base leading-tight">
                                    Tour 360° Showroom Lớp Học Mầm Non
                                </h2>
                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Ảnh Thật 100%
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                                <span>{STANDPOINTS[activeStandpoint].icon}</span>
                                <span>{STANDPOINTS[activeStandpoint].name}</span>
                            </p>
                        </div>
                    </div>

                    {/* Center: VR Standpoint Switcher (VR Floorplan Navigation) */}
                    <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/10">
                        {Object.values(STANDPOINTS).map(sp => {
                            const isActive = sp.id === activeStandpoint;
                            return (
                                <button
                                    key={sp.id}
                                    onClick={() => handleSwitchStandpoint(sp.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span>{sp.icon}</span>
                                    <span>{sp.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: POV Character Switcher & Tools */}
                    <div className="flex items-center gap-2">
                        {/* Character POV quick button */}
                        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/10">
                            {(['teacher', 'parent', 'student'] as CharacterId[]).map(cId => {
                                const char = CHARACTERS[cId];
                                const isCharActive = selectedCharacter === cId;
                                return (
                                    <button
                                        key={cId}
                                        onClick={() => handleSelectCharacter(cId)}
                                        title={char.name}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            isCharActive
                                                ? 'bg-sky-600 text-white shadow'
                                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>{char.avatar}</span>
                                        <span className="hidden xl:inline">{char.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Color customizer toggle (VRPlus 3.4) */}
                        <div className="relative">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                title="Đổi màu nệm (Tùy biến VRPlus)"
                                className="h-9 px-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 text-xs font-medium flex items-center gap-2 transition-all"
                            >
                                <span className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: activeColorway.hex }} />
                                <span className="hidden md:inline">Màu Nệm</span>
                            </button>

                            {/* Colorway Dropdown Panel */}
                            {showColorPicker && (
                                <div className="absolute right-0 top-11 w-72 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-50">
                                    <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                                        Tùy Biến Màu Nệm HULA
                                    </div>
                                    <div className="space-y-1.5">
                                        {COLORWAYS.map(cw => (
                                            <button
                                                key={cw.id}
                                                onClick={() => {
                                                    setActiveColorway(cw);
                                                    setShowColorPicker(false);
                                                }}
                                                className={`w-full p-2 rounded-xl text-left flex items-center gap-3 transition-all ${
                                                    activeColorway.id === cw.id
                                                        ? 'bg-sky-500/20 border border-sky-400/40 text-white'
                                                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                                                }`}
                                            >
                                                <span className="w-5 h-5 rounded-full border border-white/30 shrink-0 shadow" style={{ backgroundColor: cw.hex }} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold truncate text-white">{cw.name}</div>
                                                    <div className="text-[11px] text-slate-400 truncate">{cw.description}</div>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 shrink-0">
                                                    {cw.tag}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audio Toggle */}
                        <button
                            onClick={() => setIsAudioMuted(!isAudioMuted)}
                            title={isAudioMuted ? 'Bật nhạc ru lofi' : 'Tắt âm thanh'}
                            className="w-9 h-9 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 flex items-center justify-center transition-all text-sm"
                        >
                            {isAudioMuted ? '🔇' : '🎵'}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title="Toàn màn hình"
                            className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 items-center justify-center transition-all text-sm"
                        >
                            {isFullscreen ? '🗗' : '🗖'}
                        </button>

                        {/* Close Modal */}
                        <button
                            onClick={onClose}
                            title="Đóng trải nghiệm (ESC)"
                            className="w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 flex items-center justify-center transition-all text-base font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </header>

                {/* 2. SCENARIO TIMELINE BAR (If a character POV is selected) */}
                {currentCharacter && (
                    <div className="px-4 sm:px-6 py-2 bg-slate-900/90 border-b border-white/10 flex items-center justify-between gap-3 overflow-x-auto z-20 shrink-0">
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-lg">{currentCharacter.avatar}</span>
                            <span className="text-white text-xs font-bold">{currentCharacter.roleTag}:</span>
                        </div>

                        {/* Scenario Step Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {currentCharacter.scenarios.map((sc, idx) => {
                                const isCurrent = idx === currentStepIndex;
                                return (
                                    <button
                                        key={sc.step}
                                        onClick={() => {
                                            setCurrentStepIndex(idx);
                                            setIsFreeLook(false);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                            isCurrent
                                                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 ring-1 ring-white/30'
                                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        <span className="opacity-75 font-mono text-[11px]">{sc.timeTag}</span>
                                        <span>•</span>
                                        <span>{sc.title}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setIsFreeLook(true)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
                                isFreeLook
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>🧭</span>
                            <span className="hidden md:inline">Xoay Tự Do</span>
                        </button>
                    </div>
                )}

                {/* 3. MAIN 360 VIEWPORT & INTERACTIVE CANVAS */}
                <div
                    className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                >
                    {/* HTML5 Canvas Rendering Photorealistic Equirectangular Panorama */}
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />

                    {/* OVERLAID VR RADAR HOTSPOTS */}
                    {visibleHotspots.map(hs => (
                        <div
                            key={hs.id}
                            style={{
                                left: `${hs.screenX}px`,
                                top: `${hs.screenY}px`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            className="absolute pointer-events-auto z-10 group"
                        >
                            {/* Glowing Radar Pulse Waves */}
                            <div className="absolute -inset-3 rounded-full bg-sky-400/30 animate-ping" />
                            <div className="absolute -inset-1.5 rounded-full bg-sky-400/40 animate-pulse" />

                            {/* Hotspot Interactive Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveHotspot(hs);
                                }}
                                className="relative w-10 h-10 rounded-full bg-slate-900/90 border-2 border-sky-400 text-white flex items-center justify-center text-lg shadow-xl shadow-sky-500/40 hover:scale-110 active:scale-95 transition-all duration-200"
                            >
                                <span>{hs.icon}</span>
                            </button>

                            {/* Tooltip Label Pill */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-12 whitespace-nowrap bg-slate-900/95 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none group-hover:scale-105 transition-all">
                                <div className="text-white text-xs font-bold flex items-center gap-1.5">
                                    <span>{hs.shortTitle}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-200 font-normal">
                                        {hs.badge}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate">
                                    {hs.headline}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* FLOATING ACTION HUD: Active Character Monologue Speech Bubble */}
                    {currentCharacter && currentScenario && (
                        <div className="absolute left-4 sm:left-6 bottom-16 sm:bottom-20 max-w-md w-[calc(100%-2rem)] bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-white/15 shadow-2xl z-20 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{currentCharacter.avatar}</span>
                                <div>
                                    <div className="text-white font-bold text-xs sm:text-sm">{currentCharacter.name}</div>
                                    <div className="text-slate-400 text-[11px]">{currentScenario.timeTag} • {currentScenario.title}</div>
                                </div>
                            </div>

                            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-3">
                                &ldquo;{currentScenario.monologue}&rdquo;
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveActionModal(currentScenario.actionDetail)}
                                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-primary-600 hover:from-sky-400 hover:to-primary-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all"
                                >
                                    <span>{currentScenario.actionBtn}</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setInspectorTab('layers');
                                    }}
                                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-white/10 flex items-center gap-1.5 transition-all"
                                >
                                    <span>🔬 Soi Cấu Trúc</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* HUD COMPASS & ANGLE INFO */}
                    <div className="absolute right-4 bottom-16 sm:bottom-20 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 font-mono text-[11px] flex items-center gap-2 pointer-events-none z-10">
                        <span>🧭 {Math.round(yaw)}°</span>
                        <span>•</span>
                        <span>{currentCharacter ? currentCharacter.cameraHeight.split(' ')[0] : 'Tầm mắt 1.60m'}</span>
                        <span>•</span>
                        <span>Zoom: {zoom.toFixed(1)}x</span>
                    </div>

                    {/* STANDPOINT SWITCHER FLOATING PILL (Mobile view) */}
                    <div className="lg:hidden absolute top-4 left-4 right-4 flex items-center justify-center gap-1.5 z-20">
                        {Object.values(STANDPOINTS).map(sp => (
                            <button
                                key={sp.id}
                                onClick={() => handleSwitchStandpoint(sp.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all backdrop-blur-md border ${
                                    activeStandpoint === sp.id
                                        ? 'bg-sky-500 text-white border-sky-400 shadow-lg'
                                        : 'bg-slate-900/80 text-slate-300 border-white/10'
                                }`}
                            >
                                <span>{sp.icon}</span> {sp.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. BOTTOM BAR: Quick Hotspots & Verified Proof Links */}
                <footer className="h-14 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-semibold text-white">500+ Trường Tin Dùng:</span>
                        </div>
                        <span className="hidden sm:inline text-slate-400 truncate max-w-md">
                            MN 19/5 TP.HCM, Piaget Kindergarten, Montessori VN Canada, Nam Sài Gòn, Kindy Garden, BAY Preschool
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/du-an"
                            target="_blank"
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-medium text-xs border border-sky-500/20 transition-all flex items-center gap-1"
                        >
                            <span>Xem 12 Dự Án Thực Tế</span>
                            <span>↗</span>
                        </Link>

                        <a
                            href="tel:0983882210"
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5"
                        >
                            <span>📞 Nhận Mẫu Thật</span>
                        </a>
                    </div>
                </footer>
            </div>

            {/* ============================================ */}
            {/* MODAL 1: HOTSPOT DETAIL INSPECTOR           */}
            {/* ============================================ */}
            {activeHotspot && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 bg-slate-800/80 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl p-2 rounded-xl bg-slate-700/60 border border-white/10">{activeHotspot.icon}</span>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                            {activeHotspot.badge}
                                        </span>
                                        <span className="text-xs text-slate-400">Tiêu Chuẩn Học Đường HULA</span>
                                    </div>
                                    <h3 className="text-white font-bold text-base sm:text-lg leading-snug">
                                        {activeHotspot.label}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveHotspot(null)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-5 overflow-y-auto space-y-4 text-slate-300 text-xs sm:text-sm">
                            {/* Real Image Preview */}
                            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-slate-950">
                                <img
                                    src={activeHotspot.photoPreview}
                                    alt={activeHotspot.label}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-white text-[11px] font-mono">
                                    Ảnh chụp thực tế tại xưởng HULA
                                </div>
                            </div>

                            <p className="text-white font-medium text-sm leading-relaxed">
                                {activeHotspot.headline}
                            </p>

                            {/* Key Highlights */}
                            <div className="space-y-2 bg-slate-800/50 p-3.5 rounded-xl border border-white/5">
                                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Ưu Điểm Nổi Bật:</div>
                                {activeHotspot.highlights.map((hl, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                                        <span className="text-slate-200">{hl}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Tech Specs */}
                            <div className="grid grid-cols-2 gap-2">
                                {activeHotspot.specs.map((sp, i) => (
                                    <div key={i} className="p-2.5 rounded-lg bg-slate-800/80 border border-white/5">
                                        <div className="text-[11px] text-slate-400">{sp.label}</div>
                                        <div className="text-xs font-bold text-white mt-0.5">{sp.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Verified Customer Quote */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/50 to-slate-900 border border-sky-500/30">
                                <div className="text-xs text-sky-300 font-bold mb-1 flex items-center justify-between">
                                    <span>Chứng thực từ dự án: {activeHotspot.quote.school}</span>
                                    {activeHotspot.quote.link && (
                                        <Link href={activeHotspot.quote.link} target="_blank" className="text-sky-400 hover:underline">
                                            Xem dự án ↗
                                        </Link>
                                    )}
                                </div>
                                <p className="text-slate-300 italic text-xs leading-relaxed">
                                    &ldquo;{activeHotspot.quote.text}&rdquo;
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-slate-800/60 flex items-center justify-between">
                            <button
                                onClick={() => setActiveHotspot(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                            >
                                Đóng lại
                            </button>
                            <a
                                href="tel:0983882210"
                                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-1.5"
                            >
                                <span>Tư Vấn & Gửi Mẫu Vật Liệu Thật</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* MODAL 2: SCENARIO ACTION DETAIL MODAL        */}
            {/* ============================================ */}
            {activeActionModal && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="relative w-full max-w-xl bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-white/10 bg-slate-800/80 flex items-start justify-between gap-4">
                            <div>
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {activeActionModal.badge}
                                </span>
                                <h3 className="text-white font-bold text-base sm:text-lg leading-snug mt-1.5">
                                    {activeActionModal.heading}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveActionModal(null)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 text-slate-300 text-xs sm:text-sm">
                            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-slate-950">
                                <img
                                    src={activeActionModal.photoPreview}
                                    alt={activeActionModal.heading}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <p className="text-slate-200 leading-relaxed">
                                {activeActionModal.description}
                            </p>

                            <div className="space-y-2 bg-slate-800/50 p-3.5 rounded-xl border border-white/5">
                                {activeActionModal.bulletPoints.map((bp, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className="text-sky-400 font-bold shrink-0">✓</span>
                                        <span className="text-slate-200">{bp}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/50 to-slate-900 border border-sky-500/30">
                                <div className="text-xs text-sky-300 font-bold mb-1">
                                    Khách hàng chứng thực: {activeActionModal.schoolName}
                                </div>
                                <p className="text-slate-300 italic text-xs leading-relaxed">
                                    &ldquo;{activeActionModal.quoteText}&rdquo;
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-slate-800/60 flex items-center justify-between">
                            <button
                                onClick={() => setActiveActionModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                            >
                                Tiếp tục trải nghiệm
                            </button>
                            {activeActionModal.projectLink && (
                                <Link
                                    href={activeActionModal.projectLink}
                                    target="_blank"
                                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                                >
                                    Xem Hồ Sơ Dự Án Này ↗
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* MODAL 3: MACRO MATERIAL INSPECTOR (Soi mút) */}
            {/* ============================================ */}
            {inspectorTab && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="relative w-full max-w-3xl bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 bg-slate-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl p-2 rounded-xl bg-sky-500/20 text-sky-400">🔬</span>
                                <div>
                                    <h3 className="text-white font-bold text-base sm:text-lg">
                                        Kính Soi Cấu Trúc Lõi Mút & Vật Liệu Y Khoa
                                    </h3>
                                    <p className="text-slate-400 text-xs">Mặt cắt chi tiết độ phóng đại cao – Chứng nhận an toàn học đường</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setInspectorTab(null)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Inspector Body */}
                        <div className="p-5 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm">
                            {/* Real Macro Photography with Interactive Layer Callouts */}
                            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 aspect-[16/9]">
                                <img
                                    src="/images/tour360/mattress_macro.jpg"
                                    alt="Cấu tạo lõi nệm HULA"
                                    className="w-full h-full object-cover"
                                />

                                {/* Interactive Callout Overlay */}
                                <div className="absolute top-4 left-4 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/20 text-xs space-y-1">
                                    <div className="text-sky-300 font-bold">1. Vải 100% Cotton Hàn Quốc chần bông</div>
                                    <div className="text-emerald-300 font-bold">2. Màng TPU thở 1 chiều kháng nước</div>
                                    <div className="text-amber-300 font-bold">3. Lõi mút PU Foam y tế đàn hồi D25</div>
                                </div>
                            </div>

                            {/* Interactive Foam Elasticity Simulator */}
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold text-sm">Thử Nghiệm Độ Đàn Hồi & Bật Nảy Của Mút</div>
                                        <div className="text-slate-400 text-xs">Nhấn và giữ nút bên dưới để mô phỏng lực ấn của lưng trẻ</div>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Chuẩn Y Tế
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center">
                                    <div
                                        className={`w-48 h-16 rounded-xl border-2 transition-all duration-300 flex items-center justify-center font-bold text-xs ${
                                            elasticityPressed
                                                ? 'h-10 bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-95 shadow-inner'
                                                : 'bg-slate-800 border-sky-400 text-white shadow-lg'
                                        }`}
                                    >
                                        {elasticityPressed ? 'Đang ép nén (Khả năng chịu lực 100%)' : 'Lõi mút PU Foam nguyên bản'}
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <button
                                        onMouseDown={() => setElasticityPressed(true)}
                                        onMouseUp={() => setElasticityPressed(false)}
                                        onTouchStart={() => setElasticityPressed(true)}
                                        onTouchEnd={() => setElasticityPressed(false)}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                                    >
                                        {elasticityPressed ? 'Thả ra để xem mút bật nảy lại tức thì' : '👉 Nhấn & Giữ để thử đàn hồi'}
                                    </button>
                                </div>
                            </div>

                            {/* Technical Certifications */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5">
                                    <div className="text-2xl mb-1">🌿</div>
                                    <div className="text-white font-bold text-xs">0% Formaldehyde</div>
                                    <div className="text-[11px] text-slate-400">An toàn cho trẻ sơ sinh</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5">
                                    <div className="text-2xl mb-1">🩺</div>
                                    <div className="text-white font-bold text-xs">Nâng Đỡ Đa Điểm</div>
                                    <div className="text-[11px] text-slate-400">Bảo vệ cong sinh lý cột sống</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5">
                                    <div className="text-2xl mb-1">🛡️</div>
                                    <div className="text-white font-bold text-xs">Bảo Hành 3 Năm</div>
                                    <div className="text-[11px] text-slate-400">Cam kết không xẹp lún</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-slate-800/60 flex items-center justify-between">
                            <button
                                onClick={() => setInspectorTab(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                            >
                                Đóng kính soi
                            </button>
                            <a
                                href="tel:0983882210"
                                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/30"
                            >
                                <span>Gặp Kỹ Sư Vật Liệu HULA</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
