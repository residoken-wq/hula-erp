'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';

// ============================================
// DATA TYPES & INTERFACES
// ============================================
export type CharacterId = 'teacher' | 'parent' | 'student';

export interface ScenarioStep {
    step: number;
    timeTag: string;
    title: string;
    actionBtn: string;
    monologue: string;
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
    canvasCenterRatio: number; // 0.44 (high POV for teacher), 0.50 (normal POV for parent), 0.68 (low POV for child)
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
    yaw: number;
    pitch: number;
    label: string;
    shortTitle: string;
    icon: string;
    perspective: 'teacher' | 'parent' | 'student' | 'all';
    badge: string;
    headline: string;
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

// ============================================
// 3 CHARACTERS CONFIGURATION & POV SCENARIOS
// ============================================
const CHARACTERS: Record<CharacterId, CharacterDef> = {
    teacher: {
        id: 'teacher',
        name: 'Cô Giáo Mai',
        roleTag: 'Giáo Viên Mầm Non',
        avatar: '👩‍🏫',
        ageInfo: '28 tuổi • Phụ trách lớp Chồi (28 bé)',
        cameraHeight: 'Tầm mắt 1.60m (Bao quát toàn cảnh lớp)',
        canvasCenterRatio: 0.44, // Looking from above down to mats
        initialYaw: 55,
        initialPitch: -6,
        themeColor: '#0284c7',
        accentColor: '#38bdf8',
        bgGradient: 'from-[#0369a1] to-[#0284c7]',
        introSpeech: 'Chào bạn! Mình là cô Mai. Mỗi ngày lớp có 28 bé bán trú, việc trải và cất 28 chiếc nệm từng là nỗi ám ảnh đau lưng của các cô. Hãy cùng mình trải nghiệm giờ ngủ trưa với giải pháp nệm HULA nhé!',
        scenarios: [
            {
                step: 1,
                timeTag: '11:30 Trưa',
                title: 'Mở Ô Tủ Cá Nhân Lấy Nệm',
                actionBtn: '👉 Mở ô tủ cá nhân lấy nệm HULA',
                monologue: 'Chuẩn bị tới giờ ngủ trưa rồi! Mình tiến lại hệ tủ cá nhân. Nệm HULA dạng gấp 3 khúc xếp vừa khít trong từng ô tủ 30x40cm, phòng học gọn gàng ngăn nắp tuyệt đối.',
                targetYaw: 50,
                targetPitch: -4,
                actionDetail: {
                    heading: 'Hệ Tủ Kệ Thông Minh – Vừa Khít Ô Tủ Cá Nhân',
                    description: 'Nệm mầm non HULA được đo ni đóng giày theo kích thước chuẩn của các hệ tủ trường mầm non đô thị hiện đại. Mỗi ô tủ cá nhân chứa vừa vặn 1 bộ nệm - gối - mền.',
                    bulletPoints: [
                        'Thiết kế gấp 3 khúc siêu tốc chỉ mất 3 giây/bộ.',
                        'Tiết kiệm hơn 70% không gian lưu trữ so với nệm cuộn truyền thống.',
                        'Không chiếm dụng diện tích sàn, giúp lớp học luôn thông thoáng.'
                    ],
                    badge: 'Tối Ưu Vận Hành',
                    quoteText: 'Hula mang đến giải pháp toàn diện với Bộ Gối - Nệm - Túi cao cấp [...] giải quyết triệt để bài toán tối ưu diện tích không gian lớp học cho Trường MN 19/5.',
                    schoolName: 'Trường Mầm Non 19/5 TP.HCM',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-195-thanh-pho'
                },
                inspectorHighlight: 'storage'
            },
            {
                step: 2,
                timeTag: '11:35 Trưa',
                title: 'Phân Loại Nệm Theo Tên Thêu Của Bé',
                actionBtn: '👉 Soi nhãn tên thêu của từng bé',
                monologue: 'Mỗi chiếc nệm đều có thêu tên bé và logo trường sắc nét ở góc. Mình chỉ cần liếc mắt 1 giây là phát đúng nệm cho bé An, bé Bắp, không bao giờ lo nhầm lẫn đồ của các con!',
                targetYaw: 115,
                targetPitch: -12,
                actionDetail: {
                    heading: 'Thêu Vi Tính Cá Nhân Hóa Từng Học Sinh',
                    description: 'Dịch vụ thêu tên học sinh kết hợp logo trường độc quyền của HULA giúp ban giám hiệu và giáo viên quản lý đồ dùng nội trú khoa học, ngăn nắp.',
                    bulletPoints: [
                        'Chỉ thêu chất lượng cao, bền màu qua hàng trăm lần giặt sấy nhiệt độ cao.',
                        'Đường thêu phẳng mịn, không ráp da, an toàn khi trẻ nằm tì má.',
                        'Đồng bộ nhận diện thương hiệu đẳng cấp cho các trường chuẩn quốc tế.'
                    ],
                    badge: 'Quản Lý Khoa Học',
                    quoteText: 'Dự án ghi dấu ấn mạnh mẽ với những bộ túi ngủ đồng bộ, đẹp mắt và cực kỳ chỉn chu trong từng đường kim mũi chỉ, mang đến một không gian say giấc hoàn hảo.',
                    schoolName: 'Trường Mầm Non Quốc Tế Piaget',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-piaget'
                },
                inspectorHighlight: 'embroidery'
            },
            {
                step: 3,
                timeTag: '11:40 Trưa',
                title: 'Trải Nệm & Lớp Vỏ Chống Thấm',
                actionBtn: '👉 Trải nệm ra sàn & kiểm tra đáy chống thấm',
                monologue: 'Nệm chỉ nặng khoảng 750g, mình trải ra nhẹ nhàng trong tích tắc. Mặt đáy có lớp chống trượt và chống thấm mồ hôi sàn gỗ, các con nằm ấm lưng mà không lo trơn trượt.',
                targetYaw: 155,
                targetPitch: -20,
                actionDetail: {
                    heading: 'Lớp Vỏ Chống Thấm Đáy & Vệ Sinh Dễ Dàng',
                    description: 'Môi trường mầm non luôn tiềm ẩn nguy cơ bé đổ nước hoặc tè dầm. Nệm HULA được trang bị lớp chống thấm ngăn chất bẩn ngấm vào lõi mút bên trong.',
                    bulletPoints: [
                        'Khóa kéo may ẩn tinh tế, tháo vỏ áo nệm ra giặt chỉ trong 10 giây.',
                        'Chất liệu màng chống thấm thở 1 chiều giúp nệm khô thoáng không mùi hôi.',
                        'Giảm tải tối đa áp lực vệ sinh nệm cho đội ngũ bảo mẫu và giáo viên.'
                    ],
                    badge: 'Vệ Sinh Học Đường',
                    quoteText: 'Vừa nâng niu giấc ngủ của trẻ, vừa giải quyết triệt để bài toán vận hành và vệ sinh cho nhà trường.',
                    schoolName: 'Trường Mầm Non Nam Sài Gòn (Phú Mỹ Hưng)',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-nam-sai-gon'
                },
                inspectorHighlight: 'zipper'
            },
            {
                step: 4,
                timeTag: '13:45 Chiều',
                title: 'Dọn Nệm Siêu Tốc Trong 4 Phút',
                actionBtn: '👉 Bấm giờ thu dọn nệm cả lớp',
                monologue: 'Chuông báo thức reo! 28 bé cùng các cô gấp nệm làm 3 và cất lại vào ô tủ. Chỉ mất 3 phút 45 giây là sàn lớp học đã sạch bóng thênh thang cho giờ học múa buổi chiều!',
                targetYaw: 65,
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
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-bay'
                },
                inspectorHighlight: 'storage'
            }
        ]
    },
    parent: {
        id: 'parent',
        name: 'Mẹ Hương & Bố Dũng',
        roleTag: 'Phụ Huynh Học Sinh',
        avatar: '👨‍👩‍👧',
        ageInfo: '32 tuổi • Có con 3 tuổi gửi trường bán trú',
        cameraHeight: 'Tầm mắt 1.55m (Soi cận cảnh chất liệu)',
        canvasCenterRatio: 0.50, // Straight forward perspective looking closely at materials
        initialYaw: 190,
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
                monologue: 'Bước vào lớp giờ ngủ trưa, không gian thật yên bình và ấm cúng. Tất cả các bạn nhỏ đều nằm trên bộ nệm gối đồng bộ màu xanh ngọc nhã nhặn, thêu logo trường chỉn chu.',
                targetYaw: 140,
                targetPitch: -10,
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
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-sright'
                }
            },
            {
                step: 2,
                timeTag: '12:05 Trưa',
                title: 'Cúi Xuống Sờ Thử Sợi Vải Tự Nhiên',
                actionBtn: '👉 Chạm vào bề mặt vải Cotton Hàn Quốc',
                monologue: 'Mình cúi xuống sờ thử bề mặt nệm. Vải Cotton Hàn Quốc 100% tự nhiên mềm mịn như lụa, mát tay, không có bụi vải hay mùi hôi hóa chất. Con da nhạy cảm nằm đây chắc chắn không lo dị ứng!',
                targetYaw: 195,
                targetPitch: -22,
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
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-kindy-garden'
                },
                inspectorHighlight: 'foam'
            },
            {
                step: 3,
                timeTag: '12:10 Trưa',
                title: 'Bóp Thử Độ Đàn Hồi Ruột Mút Y Khoa',
                actionBtn: '👉 Ấn thử độ đàn hồi ruột mút PU Foam',
                monologue: 'Mình ấn mạnh tay xuống nệm rồi buông ra: Mút bật lại ngay lập tức! Ruột mút định hình PU Foam tỷ trọng cao nâng đỡ êm ái, độ cứng vừa phải chuẩn y khoa, bảo vệ cột sống non nớt của con.',
                targetYaw: 215,
                targetPitch: -25,
                actionDetail: {
                    heading: 'Ruột Mút PU Foam Định Hình Nâng Đỡ Cột Sống',
                    description: 'Trẻ từ 1 - 6 tuổi đang trong giai đoạn hình thành đường cong sinh lý cột sống. Nệm quá mềm sẽ gây võng lưng gù vẹo; nệm quá cứng sẽ gây đau cơ, trằn trọc.',
                    bulletPoints: [
                        'Mút PU Foam tỷ trọng cao nhập khẩu, không xẹp lún sau nhiều năm sử dụng.',
                        'Độ dày chuẩn 3cm - 5cm cách nhiệt hoàn hảo với mặt sàn lạnh mùa đông và hầm nóng mùa hè.',
                        'Kháng khuẩn tự nhiên, không giữ ẩm, ngăn ngừa nấm mốc phát triển bên trong lõi đệm.'
                    ],
                    badge: 'Chuẩn Y Khoa Học Đường',
                    quoteText: 'Không ngại đầu tư những điều tốt nhất cho các con – HULA đồng hành cùng trường từ những ngày đầu thành lập.',
                    schoolName: 'Montessori Việt Nam Canada',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-montessori-viet-nam-canada-2025'
                },
                inspectorHighlight: 'foam'
            },
            {
                step: 4,
                timeTag: '12:15 Trưa',
                title: 'Kiểm Tra Khóa Kéo Giấu & Tháo Giặt',
                actionBtn: '👉 Soi nẹp che khóa kéo giấu an toàn',
                monologue: 'Cạnh hông nệm có nẹp vải che kín hoàn toàn đầu khóa kéo, không sợ con lăn qua lăn lại cọ xước da. Vỏ nệm tháo rời giặt sấy cực tiện lợi. Thấy con ngủ say sưa thế này, ba mẹ hoàn toàn yên tâm gửi gắm!',
                targetYaw: 265,
                targetPitch: -16,
                actionDetail: {
                    heading: 'Nẹp Khóa Kéo Giấu Kín – An Toàn Đến Từng Chi Tiết Nhỏ',
                    description: 'HULA chăm chút từng đường kim mũi chỉ theo triết lý "An toàn tối thượng cho trẻ". Khóa kéo được giấu chìm sâu trong nẹp vải bảo vệ 2 lớp.',
                    bulletPoints: [
                        'Tuyệt đối không có góc cạnh kim loại hay đầu khóa nhọn tiếp xúc với cơ thể bé.',
                        'Dễ dàng tháo rời vỏ áo để giặt giũ phơi khô định kỳ vào mỗi cuối tuần.',
                        'Bộ nệm có túi quai xách sạch sẽ cho ba mẹ mang về giặt mỗi tháng.'
                    ],
                    badge: 'Thiết Kế Tinh Tế',
                    quoteText: 'Thể hiện sự tận tâm của trường trong việc chăm chút từng bữa ăn, giấc ngủ cho các mầm non tương lai.',
                    schoolName: 'Hệ Thống Trường ILO Academy',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-ilo-academy'
                },
                inspectorHighlight: 'zipper'
            }
        ]
    },
    student: {
        id: 'student',
        name: 'Bé Bắp (4 Tuổi)',
        roleTag: 'Học Sinh Lớp Chồi',
        avatar: '🧒',
        ageInfo: '4 tuổi • Học sinh lớp Mầm non',
        cameraHeight: 'Tầm mắt 0.95m (Góc nhìn thấp đáng yêu của bé)',
        canvasCenterRatio: 0.68, // Low camera height, looking up at cubbies and down closely at floor
        initialYaw: 330,
        initialPitch: -10,
        themeColor: '#d97706',
        accentColor: '#f59e0b',
        bgGradient: 'from-[#b45309] to-[#d97706]',
        introSpeech: 'Dạ con chào cô chú! Con tên là Bắp, năm nay con 4 tuổi rồi! Ở trường con thích nhất là giờ ngủ trưa, vì nệm của con êm ru và có hình bạn khủng long đáng yêu lắm. Để con dắt cô chú đi ngủ trưa cùng con nha!',
        scenarios: [
            {
                step: 1,
                timeTag: '11:30 Trưa',
                title: 'Tìm Chiếc Nệm Có Bạn Khủng Long',
                actionBtn: '👉 Nhìn lên ô tủ tìm nệm của con',
                monologue: 'A! Ô tủ của con ở ngăn dưới vừa tầm tay nè! Có dán hình bạn Khủng Long màu cam và thêu chữ "Bé Bắp". Chiếc nệm êm ái của con đây rồi!',
                targetYaw: 45,
                targetPitch: 5, // Looking up at cubbies from low height
                actionDetail: {
                    heading: 'Khơi Gợi Hứng Thú Với Họa Tiết Sinh Động',
                    description: 'Bộ sưu tập nệm HULA dành cho các bé mầm non được thiết kế với các chủ đề thân thuộc như Khủng long Dino, Vũ trụ phi hành gia, Rừng xanh muông thú, tạo cảm giác gần gũi như ở nhà.',
                    bulletPoints: [
                        'Giúp bé xua tan nỗi sợ hãi khi những ngày đầu tiên đến trường bán trú.',
                        'Kích thích trí tưởng tượng và sự sáng tạo của con trẻ.',
                        'Bé tự nhận biết nệm của mình qua hình vẽ và ký hiệu riêng biệt.'
                    ],
                    badge: 'Thân Thiện Với Trẻ',
                    quoteText: 'Kiến tạo không gian nghỉ ngơi trọn vẹn và an toàn nhất cho các bạn nhỏ khủng long Dino Kinder.',
                    schoolName: 'Trường Mầm Non Dino Kinder',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-dino-kinder'
                },
                inspectorHighlight: 'storage'
            },
            {
                step: 2,
                timeTag: '11:35 Trưa',
                title: 'Tự Tay Ôm Nệm Ra Vị Trí Ngủ',
                actionBtn: '👉 Hai tay ôm nệm tung tăng ra sàn',
                monologue: 'Nệm nhẹ tênh à! Con chỉ cần dùng 2 tay nhỏ là ôm được nệm chạy lon ton ra vị trí ngủ. Con 4 tuổi rồi, con lớn rồi nên không cần cô bế giúp đâu ạ!',
                targetYaw: 85,
                targetPitch: -6,
                actionDetail: {
                    heading: 'Trọng Lượng Siêu Nhẹ – Rèn Tính Tự Lập Cho Trẻ',
                    description: 'Phương pháp giáo dục sớm Montessori khuyến khích trẻ tự phục vụ đồ dùng cá nhân. Trọng lượng nệm HULA được tính toán tối ưu chỉ từ 650g - 800g, phù hợp với thể trạng trẻ mầm non.',
                    bulletPoints: [
                        'Bé 2 - 5 tuổi hoàn toàn có thể tự ôm và di chuyển nệm của mình an toàn.',
                        'Hình thành thói quen kỷ luật, tự giác và tự tin ngay từ những hành động nhỏ.',
                        'Giảm bớt gánh nặng mang vác cho các cô giáo trong giờ chuẩn bị ngủ trưa.'
                    ],
                    badge: 'Rèn Luyện Tự Lập',
                    quoteText: 'Các bé mầm non hoàn toàn có thể tự tay trải và gấp nệm của mình. Đây là phương pháp tuyệt vời giúp nhà trường rèn luyện tính kỷ luật và sự tự giác.',
                    schoolName: 'Những Ngón Tay Bay (Flying Fingers School)',
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-nhung-ngon-tay-bay'
                }
            },
            {
                step: 3,
                timeTag: '11:45 Trưa',
                title: 'Nằm Say Giấc Êm Ái Như Vòng Tay Mẹ',
                actionBtn: '👉 Nằm xuống nệm nghe nhạc ru êm ái',
                monologue: 'Con mở nệm ra nằm xuống. Nệm êm ru, gối mềm xốp, chăn ấm áp ôm trọn người con. Có tiếng nhạc ru du dương ngoài phòng khách, con nhắm mắt ngủ một giấc thật ngon...',
                targetYaw: 310,
                targetPitch: -28, // Looking directly at the mat on floor
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
                    projectLink: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-hugo-house'
                },
                inspectorHighlight: 'foam'
            },
            {
                step: 4,
                timeTag: '13:45 Chiều',
                title: 'Thức Dậy Tự Hào Cùng Bạn Gấp Nệm',
                actionBtn: '👉 Gấp nệm lại làm 3 cất vào ô tủ',
                monologue: 'Con thức dậy rồi! Con tự tay gấp nệm lại làm 3 khúc nè, rồi mang lại ô tủ của bạn Khủng Long. Cô giáo khen con ngoan và thưởng cho con một bông hoa điểm mười!',
                targetYaw: 60,
                targetPitch: 0,
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
                    projectLink: '/du-an'
                },
                inspectorHighlight: 'storage'
            }
        ]
    }
};

// 5 Interactive Hotspots for Free-Look Mode
const HOTSPOTS: Hotspot[] = [
    {
        id: 'hs-storage',
        yaw: 45,
        pitch: -5,
        label: 'Tủ Kệ Lưu Trữ & Nệm Gấp Gọn 5 Giây',
        shortTitle: 'Nệm Gấp Gọn & Ô Tủ',
        icon: '📦',
        perspective: 'teacher',
        badge: 'Tối Ưu Vận Hành',
        headline: 'Giải phóng 100% diện tích sàn lớp học chỉ sau 3-5 phút dọn dẹp',
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
            { label: 'Trọng lượng', value: 'Khoảng 650g - 900g (siêu nhẹ)' },
            { label: 'Chứng thực', value: 'MN 19/5, MN Nam Sài Gòn' }
        ],
        themeColor: '#0284c7'
    },
    {
        id: 'hs-embroidery',
        yaw: 120,
        pitch: -12,
        label: 'Thêu Tên Bé & Logo Đồng Bộ Trường',
        shortTitle: 'Thêu Tên & Logo Trường',
        icon: '🏷️',
        perspective: 'teacher',
        badge: 'Quản Lý Khoa Học',
        headline: 'Mỗi bé một dấu ấn riêng – Chấm dứt tình trạng thất lạc và nhầm lẫn đồ',
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
        yaw: 195,
        pitch: -18,
        label: 'Cấu Tạo Ruột Nệm Chuẩn Y Khoa 100% An Toàn',
        shortTitle: 'Ruột Mút Y Khoa',
        icon: '🩺',
        perspective: 'parent',
        badge: 'Chuẩn Y Tế Học Đường',
        headline: 'Nâng niu cột sống non nớt của trẻ với chất liệu không độc hại',
        quote: {
            text: 'Hula tự hào được chị Thy – đại diện trường – tin tưởng lựa chọn làm đối tác đồng hành từ những ngày đầu thành lập, cùng chung tầm nhìn: "Không ngại đầu tư những điều tốt nhất cho các con".',
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
        yaw: 260,
        pitch: -8,
        label: 'Khóa Kéo Giấu Kín & Vỏ Chống Thấm',
        shortTitle: 'Khóa Ẩn & Chống Thấm',
        icon: '🛡️',
        perspective: 'parent',
        badge: 'An Toàn Tuyệt Đối',
        headline: 'Bảo vệ toàn diện: Chống trầy xước da bé và ngăn thấm mồ hôi, ẩm mốc',
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
        yaw: 325,
        pitch: -15,
        label: 'Khu Vực Bé Tự Lập Gấp Nệm & Ngủ Ngoan',
        shortTitle: 'Bé Tự Lập Gấp Nệm',
        icon: '🧸',
        perspective: 'student',
        badge: 'Rèn Luyện Tự Lập',
        headline: 'Giờ ngủ trưa êm ái như ở nhà – Bé tự hào tự phục vụ bản thân',
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
    // Mode: Character Selection Screen vs Active POV Experience
    const [selectedCharacter, setSelectedCharacter] = useState<CharacterId | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isFreeLook, setIsFreeLook] = useState<boolean>(false);

    // Camera & Canvas Controls
    const [yaw, setYaw] = useState<number>(55);
    const [pitch, setPitch] = useState<number>(-6);
    const [zoom, setZoom] = useState<number>(1.0);
    const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Modals & Panels
    const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
    const [activeActionModal, setActiveActionModal] = useState<ScenarioStep['actionDetail'] | null>(null);
    const [inspectorTab, setInspectorTab] = useState<'layers' | 'elasticity' | 'embroidery' | 'projects' | null>(null);
    const [elasticityPressed, setElasticityPressed] = useState<boolean>(false);

    // Audio Ambiance Synthesizer
    const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioTimerRef = useRef<any>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef<boolean>(false);
    const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const targetYawRef = useRef<number | null>(null);
    const targetPitchRef = useRef<number | null>(null);
    const animFrameRef = useRef<number>(0);

    const currentCharacter = useMemo(() => {
        if (!selectedCharacter) return null;
        return CHARACTERS[selectedCharacter];
    }, [selectedCharacter]);

    const currentScenario = useMemo(() => {
        if (!currentCharacter) return null;
        return currentCharacter.scenarios[currentStepIndex] || currentCharacter.scenarios[0];
    }, [currentCharacter, currentStepIndex]);

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

            // Brahms lullaby pentatonic note frequencies (C4, D4, E4, G4, A4, C5)
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

    // Select character and set initial camera height and angle
    const handleSelectCharacter = (charId: CharacterId) => {
        const char = CHARACTERS[charId];
        setSelectedCharacter(charId);
        setCurrentStepIndex(0);
        setIsFreeLook(false);
        setYaw(char.initialYaw);
        setPitch(char.initialPitch);
        setActiveHotspot(null);
        setActiveActionModal(null);
    };

    // Smooth Auto-Pan to target angle when scenario step changes
    useEffect(() => {
        if (!currentScenario || isFreeLook) return;
        targetYawRef.current = currentScenario.targetYaw;
        targetPitchRef.current = currentScenario.targetPitch;
    }, [currentScenario, isFreeLook]);

    // Main animation loop: Canvas rendering & smooth auto-pan
    useEffect(() => {
        if (!isOpen) return;

        let lastTime = performance.now();
        const loop = (currentTime: number) => {
            const delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Smooth pan interpolation towards scenario target
            if (targetYawRef.current !== null && !isDraggingRef.current && !isFreeLook) {
                setYaw(prev => {
                    const target = targetYawRef.current!;
                    const diff = ((target - prev + 540) % 360) - 180;
                    if (Math.abs(diff) < 0.2) {
                        targetYawRef.current = null;
                        return target;
                    }
                    return (prev + diff * Math.min(1, delta * 3.5) + 360) % 360;
                });
            }

            if (targetPitchRef.current !== null && !isDraggingRef.current && !isFreeLook) {
                setPitch(prev => {
                    const target = targetPitchRef.current!;
                    const diff = target - prev;
                    if (Math.abs(diff) < 0.2) {
                        targetPitchRef.current = null;
                        return target;
                    }
                    return prev + diff * Math.min(1, delta * 3.5);
                });
            }

            // Auto rotate if enabled
            if (isAutoRotate && !isDraggingRef.current && !activeActionModal && !activeHotspot) {
                setYaw(prev => (prev + delta * 5) % 360);
            }

            // Render Panoramic Canvas
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const width = canvas.width = canvas.parentElement?.clientWidth || 1200;
                    const height = canvas.height = canvas.parentElement?.clientHeight || 700;

                    ctx.clearRect(0, 0, width, height);

                    // Sky & Ambient Lighting Gradient
                    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
                    skyGrad.addColorStop(0, '#bae6fd');
                    skyGrad.addColorStop(0.35, '#e0f2fe');
                    skyGrad.addColorStop(0.55, '#fef9c3'); // Classroom warm daylight
                    skyGrad.addColorStop(0.85, '#fed7aa');
                    skyGrad.addColorStop(1, '#b45309'); // Oak wood floor
                    ctx.fillStyle = skyGrad;
                    ctx.fillRect(0, 0, width, height);

                    const fov = 110 / zoom;
                    const pixelsPerDegree = width / fov;

                    // Camera Eye Level Center: Changes dynamically based on selected character!
                    // Teacher = 0.44 (looking down), Parent = 0.50 (eye level), Child = 0.68 (very low eye level, looking up!)
                    const centerRatio = currentCharacter ? currentCharacter.canvasCenterRatio : 0.50;
                    const centerY = height * centerRatio + (pitch * 8);

                    // Wooden Floor Planks
                    ctx.save();
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(0, centerY + 80, width, height - (centerY + 80));

                    ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
                    ctx.lineWidth = 2;
                    for (let x = -360; x <= 720; x += 30) {
                        const screenX = ((x - yaw + 360) % 360) * pixelsPerDegree;
                        ctx.beginPath();
                        ctx.moveTo(screenX, centerY + 80);
                        ctx.lineTo(screenX + (screenX - width / 2) * 1.8, height);
                        ctx.stroke();
                    }
                    ctx.restore();

                    // 360 Panoramic Classroom Landmarks
                    const wallSegments = [
                        { angle: 0, type: 'window', title: 'Cửa Sổ Lấy Sáng Tự Nhiên' },
                        { angle: 50, type: 'cabinet', title: 'Hệ Tủ Kệ Nệm HULA Gấp Gọn' },
                        { angle: 120, type: 'embroidery_station', title: 'Góc Trưng Bày Nhãn Tên Thêu' },
                        { angle: 160, type: 'nap_area', title: 'Khu Vực Giấc Ngủ Trưa Của Bé' },
                        { angle: 220, type: 'inspection_desk', title: 'Bàn Trải Nghiệm Mút Y Khoa' },
                        { angle: 280, type: 'activity_area', title: 'Góc Hoạt Động & Tranh Vẽ Lớp' },
                        { angle: 325, type: 'montessori_shelf', title: 'Kệ Học Cụ Bé Tự Lập' }
                    ];

                    wallSegments.forEach(seg => {
                        const relAngle = ((seg.angle - yaw + 540) % 360) - 180;
                        const screenX = width / 2 + relAngle * pixelsPerDegree;

                        if (screenX >= -240 && screenX <= width + 240) {
                            ctx.save();
                            if (seg.type === 'window') {
                                // Natural Daylight Window
                                ctx.fillStyle = '#f8fafc';
                                ctx.fillRect(screenX - 120, centerY - 170, 240, 230);
                                ctx.fillStyle = '#38bdf8';
                                ctx.fillRect(screenX - 110, centerY - 160, 105, 100);
                                ctx.fillRect(screenX + 5, centerY - 160, 105, 100);
                                ctx.fillRect(screenX - 110, centerY - 50, 105, 100);
                                ctx.fillRect(screenX + 5, centerY - 50, 105, 100);

                                // Warm sunshine beam
                                const sun = ctx.createLinearGradient(screenX - 50, centerY - 110, screenX + 150, centerY + 220);
                                sun.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
                                sun.addColorStop(1, 'rgba(254, 240, 138, 0)');
                                ctx.fillStyle = sun;
                                ctx.beginPath();
                                ctx.moveTo(screenX - 110, centerY - 160);
                                ctx.lineTo(screenX + 190, centerY + 220);
                                ctx.lineTo(screenX + 20, centerY + 220);
                                ctx.lineTo(screenX - 110, centerY - 50);
                                ctx.fill();
                            } else if (seg.type === 'cabinet') {
                                // Cabinet Cubbies with Folded HULA 3-fold mattresses
                                ctx.fillStyle = '#fcd34d';
                                ctx.fillRect(screenX - 145, centerY - 150, 290, 250);
                                ctx.strokeStyle = '#d97706';
                                ctx.lineWidth = 4;
                                ctx.strokeRect(screenX - 145, centerY - 150, 290, 250);

                                // Cubby slots
                                for (let row = 0; row < 3; row++) {
                                    for (let col = 0; col < 2; col++) {
                                        const cubX = screenX - 135 + col * 140;
                                        const cubY = centerY - 140 + row * 78;
                                        ctx.fillStyle = '#fef3c7';
                                        ctx.fillRect(cubX, cubY, 130, 68);
                                        ctx.strokeRect(cubX, cubY, 130, 68);

                                        // Folded Hula Mattress
                                        ctx.fillStyle = (row + col) % 2 === 0 ? '#0284c7' : '#059669';
                                        ctx.beginPath();
                                        ctx.roundRect(cubX + 8, cubY + 12, 114, 44, 6);
                                        ctx.fill();

                                        ctx.fillStyle = '#ffffff';
                                        ctx.font = 'bold 9px sans-serif';
                                        ctx.fillText('HULA ★ Bé Bắp', cubX + 16, cubY + 38);
                                    }
                                }
                            } else if (seg.type === 'nap_area') {
                                // Nap Area with Mattresses on Floor
                                ctx.fillStyle = '#e0f2fe';
                                ctx.beginPath();
                                ctx.ellipse(screenX, centerY + 140, 200, 75, 0, 0, Math.PI * 2);
                                ctx.fill();

                                // Laid-out mattresses
                                [-80, 0, 80].forEach((offset, idx) => {
                                    ctx.fillStyle = idx === 1 ? '#38bdf8' : '#34d399';
                                    ctx.beginPath();
                                    ctx.roundRect(screenX + offset - 30, centerY + 95 + Math.abs(offset) * 0.25, 60, 95, 8);
                                    ctx.fill();

                                    // Soft Pillow
                                    ctx.fillStyle = '#ffffff';
                                    ctx.beginPath();
                                    ctx.roundRect(screenX + offset - 24, centerY + 102, 48, 22, 5);
                                    ctx.fill();

                                    // Logo tag
                                    ctx.fillStyle = '#0f172a';
                                    ctx.font = '8px sans-serif';
                                    ctx.fillText('HULA', screenX + offset - 12, centerY + 116);
                                });
                            } else if (seg.type === 'inspection_desk') {
                                // Foam inspection table
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(screenX - 130, centerY - 150, 260, 150);
                                ctx.strokeStyle = '#94a3b8';
                                ctx.lineWidth = 4;
                                ctx.strokeRect(screenX - 130, centerY - 150, 260, 150);

                                ctx.fillStyle = '#0284c7';
                                ctx.font = 'bold 14px sans-serif';
                                ctx.fillText('🧪 KIỂM ĐỊNH CHẤT LIỆU Y KHOA', screenX - 110, centerY - 110);
                                ctx.fillStyle = '#475569';
                                ctx.font = '11px sans-serif';
                                ctx.fillText('✓ 100% Cotton & Tencel tự nhiên', screenX - 100, centerY - 80);
                                ctx.fillText('✓ Không chứa Formaldehyde gây hại', screenX - 100, centerY - 55);
                                ctx.fillText('✓ Lõi mút PU Foam nâng đỡ cột sống', screenX - 100, centerY - 30);
                            } else {
                                // Montessori shelves and toy boxes
                                ctx.fillStyle = '#fef08a';
                                ctx.fillRect(screenX - 100, centerY - 90, 200, 170);
                                ctx.strokeStyle = '#eab308';
                                ctx.lineWidth = 3;
                                ctx.strokeRect(screenX - 100, centerY - 90, 200, 170);

                                // Toys
                                ctx.fillStyle = '#ef4444';
                                ctx.beginPath();
                                ctx.arc(screenX - 45, centerY - 45, 18, 0, Math.PI * 2);
                                ctx.fill();

                                ctx.fillStyle = '#10b981';
                                ctx.fillRect(screenX + 10, centerY - 60, 35, 45);
                            }
                            ctx.restore();
                        }
                    });

                    // Ambient ceiling lamps
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    for (let i = 0; i < 4; i++) {
                        const lx = ((i * 90 - yaw + 360) % 360) * pixelsPerDegree;
                        ctx.beginPath();
                        ctx.ellipse(lx, centerY - 240, 50, 15, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isOpen, yaw, pitch, zoom, isAutoRotate, activeActionModal, activeHotspot, currentCharacter, isFreeLook]);

    // Drag handlers for 360 rotation
    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        targetYawRef.current = null;
        targetPitchRef.current = null;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        setYaw(prev => (prev - dx * 0.25 + 360) % 360);
        setPitch(prev => Math.max(-25, Math.min(25, prev + dy * 0.15)));
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            isDraggingRef.current = true;
            targetYawRef.current = null;
            targetPitchRef.current = null;
            lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDraggingRef.current || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - lastMousePosRef.current.x;
        const dy = e.touches[0].clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        setYaw(prev => (prev - dx * 0.35 + 360) % 360);
        setPitch(prev => Math.max(-25, Math.min(25, prev + dy * 0.2)));
    };

    const handleTouchEnd = () => {
        isDraggingRef.current = false;
    };

    // Calculate screen position for hotspots
    const getHotspotScreenPos = (hs: Hotspot) => {
        if (!containerRef.current) return { x: -999, y: -999, isVisible: false };
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const fov = 110 / zoom;
        const pixelsPerDegree = width / fov;

        const relYaw = ((hs.yaw - yaw + 540) % 360) - 180;
        const screenX = width / 2 + relYaw * pixelsPerDegree;
        const centerRatio = currentCharacter ? currentCharacter.canvasCenterRatio : 0.50;
        const centerY = height * centerRatio + (pitch * 8);
        const screenY = centerY + (hs.pitch * 6);

        const isVisible = relYaw >= -fov / 2 && relYaw <= fov / 2;
        return { x: screenX, y: screenY, isVisible };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 transition-all animate-fadeIn">
            {/* Main Modal Shell */}
            <div
                ref={containerRef}
                className={`relative w-full ${isFullscreen ? 'h-full' : 'h-[92vh] max-w-7xl'} bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col`}
            >
                {/* =========================================================================
                    SCREEN 1: CHARACTER SELECTION (MÀN HÌNH CHỌN NHÂN VẬT NHẬP VAI)
                   ========================================================================= */}
                {!currentCharacter ? (
                    <div className="relative flex-1 flex flex-col justify-between p-6 sm:p-10 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
                                    <span>🌐</span> Trải Nghiệm Góc Nhìn Thứ Nhất (First-Person POV)
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                                    Khám Phá Lớp Học Mầm Non HULA
                                </h1>
                                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-1 leading-relaxed">
                                    Hãy chọn nhân vật bạn muốn nhập vai để trải nghiệm chân thực không gian lớp học, sản phẩm nệm và kịch bản thực tế qua đôi mắt của họ.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-white/10"
                                title="Đóng (ESC)"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 3 Character Persona Cards */}
                        <div className="grid md:grid-cols-3 gap-6 my-8">
                            {Object.values(CHARACTERS).map((char) => (
                                <div
                                    key={char.id}
                                    onClick={() => handleSelectCharacter(char.id)}
                                    className="group relative bg-slate-900/90 rounded-2xl p-6 border-2 border-white/10 hover:border-cyan-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                                >
                                    {/* Ambient Glow */}
                                    <div
                                        className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition duration-500"
                                        style={{ backgroundColor: char.themeColor }}
                                    />

                                    <div className="relative z-10">
                                        {/* Avatar & Role */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/20"
                                                style={{ backgroundColor: `${char.themeColor}30` }}
                                            >
                                                {char.avatar}
                                            </div>
                                            <span
                                                className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wider"
                                                style={{ backgroundColor: char.themeColor }}
                                            >
                                                {char.roleTag}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                                            {char.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5 mb-3 font-medium">
                                            {char.ageInfo}
                                        </p>

                                        {/* Camera Height Badge */}
                                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-white/5 mb-4">
                                            <span>📷</span> {char.cameraHeight}
                                        </div>

                                        {/* Character Quote */}
                                        <p className="text-xs italic text-slate-300 line-clamp-3 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                            "{char.introSpeech}"
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="relative z-10 pt-5 mt-4 border-t border-white/10">
                                        <button
                                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition duration-200 group-hover:scale-105"
                                            style={{ backgroundColor: char.themeColor }}
                                        >
                                            <span>Nhập Vai Góc Nhìn Này</span>
                                            <span>➔</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Credentials */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
                            <div className="flex items-center gap-4">
                                <span>🏫 500+ Trường Mầm Non Đối Tác</span>
                                <span>•</span>
                                <span>🌿 100% Chất Liệu An Toàn Y Khoa</span>
                                <span>•</span>
                                <span>⭐ 98% Đối Tác Hài Lòng</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleSelectCharacter('teacher')}
                                    className="text-cyan-400 hover:underline font-semibold"
                                >
                                    Khám phá nhanh với Cô Giáo Mai ➔
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* =========================================================================
                        SCREEN 2: FIRST-PERSON POV EXPERIENCE (TRẢI NGHIỆM GÓC NHÌN THỨ NHẤT)
                       ========================================================================= */
                    <>
                        {/* TOP NAVIGATION & POV CONTROLS */}
                        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border-b border-white/10 text-white">
                            {/* Current Character Badge */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-md border border-white/30"
                                    style={{ backgroundColor: currentCharacter.themeColor }}
                                >
                                    {currentCharacter.avatar}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white tracking-wide">
                                            {currentCharacter.name}
                                        </span>
                                        <span
                                            className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase text-white"
                                            style={{ backgroundColor: currentCharacter.themeColor }}
                                        >
                                            POV {currentCharacter.roleTag}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                                        📷 {currentCharacter.cameraHeight}
                                    </p>
                                </div>
                            </div>

                            {/* Mode Controls & Switcher */}
                            <div className="flex items-center gap-2">
                                {/* Switch Character Button */}
                                <button
                                    onClick={() => setSelectedCharacter(null)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-white/10 flex items-center gap-1.5"
                                >
                                    <span>🔄</span> Đổi nhân vật
                                </button>

                                {/* Free Look Mode Toggle */}
                                <button
                                    onClick={() => setIsFreeLook(!isFreeLook)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${isFreeLook
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                                        }`}
                                    title="Tự do xoay 360 ngắm phòng học"
                                >
                                    <span>🌐</span> {isFreeLook ? 'Đang Xoay Tự Do 360°' : 'Xoay Tự Do'}
                                </button>

                                {/* Product Inspector Button */}
                                <button
                                    onClick={() => setInspectorTab('layers')}
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
                                >
                                    <span>🔍</span> Soi Nệm 3D
                                </button>

                                {/* Audio Ambience Mute/Unmute */}
                                <button
                                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition border ${!isAudioMuted
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                        : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'
                                        }`}
                                    title={isAudioMuted ? 'Bật nhạc ru êm dịu lớp học' : 'Tắt âm thanh'}
                                >
                                    {isAudioMuted ? '🔇' : '🎵'}
                                </button>

                                {/* Fullscreen */}
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white items-center justify-center text-xs border border-white/10"
                                    title="Toàn màn hình"
                                >
                                    {isFullscreen ? '🗗' : '🗖'}
                                </button>

                                {/* Close Modal */}
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white flex items-center justify-center transition border border-red-500/30"
                                    title="Đóng (ESC)"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* SCENARIO TIMELINE HUD (THANH TIẾN TRÌNH 4 BƯỚC KỊCH BẢN) */}
                        <div className="relative z-10 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border-b border-white/10 flex items-center justify-between overflow-x-auto gap-3">
                            <div className="flex items-center gap-2 min-w-max">
                                {currentCharacter.scenarios.map((sc, idx) => {
                                    const isCurrent = currentStepIndex === idx;
                                    const isPassed = currentStepIndex > idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setCurrentStepIndex(idx);
                                                setIsFreeLook(false);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${isCurrent
                                                ? 'bg-white text-slate-900 border-white shadow-md ring-2 ring-cyan-400'
                                                : isPassed
                                                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/30'
                                                    : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
                                                }`}
                                        >
                                            <span
                                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isCurrent ? 'bg-slate-900 text-white' : 'bg-slate-700 text-slate-300'
                                                }`}
                                            >
                                                {sc.step}
                                            </span>
                                            <span>{sc.timeTag} - {sc.title}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 min-w-max">
                                <button
                                    disabled={currentStepIndex === 0}
                                    onClick={() => {
                                        setCurrentStepIndex(prev => Math.max(0, prev - 1));
                                        setIsFreeLook(false);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-semibold border border-white/10"
                                >
                                    ◀ Trước
                                </button>
                                <button
                                    disabled={currentStepIndex === currentCharacter.scenarios.length - 1}
                                    onClick={() => {
                                        setCurrentStepIndex(prev => Math.min(currentCharacter.scenarios.length - 1, prev + 1));
                                        setIsFreeLook(false);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 text-xs font-bold shadow flex items-center gap-1"
                                >
                                    <span>Bước Sau</span>
                                    <span>▶</span>
                                </button>
                            </div>
                        </div>

                        {/* INTERACTIVE 360 VIEWER CANVAS */}
                        <div
                            className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onWheel={(e) => {
                                e.preventDefault();
                                setZoom(prev => Math.max(0.7, Math.min(2.0, prev - e.deltaY * 0.001)));
                            }}
                        >
                            <canvas ref={canvasRef} className="w-full h-full block" />

                            {/* OVERLAY HOTSPOT BUTTONS */}
                            {HOTSPOTS.map(hs => {
                                const { x, y, isVisible } = getHotspotScreenPos(hs);
                                if (!isVisible) return null;

                                const isSelected = activeHotspot?.id === hs.id;

                                return (
                                    <div
                                        key={hs.id}
                                        style={{
                                            left: `${x}px`,
                                            top: `${y}px`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        className="absolute z-20 pointer-events-auto transition-transform duration-150 hover:scale-110"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveHotspot(hs);
                                        }}
                                    >
                                        {/* Radar pulse ring */}
                                        <div
                                            className="absolute -inset-2 rounded-full animate-ping opacity-75"
                                            style={{ backgroundColor: hs.themeColor }}
                                        />

                                        {/* Button */}
                                        <button
                                            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md text-xs font-bold transition-all border ${isSelected
                                                ? 'bg-white text-slate-900 border-white ring-4 ring-cyan-400'
                                                : 'bg-slate-900/90 text-white border-white/40 hover:border-white'
                                                }`}
                                            style={{ boxShadow: `0 8px 24px -4px ${hs.themeColor}88` }}
                                        >
                                            <span className="text-sm">{hs.icon}</span>
                                            <span className="whitespace-nowrap">{hs.shortTitle}</span>
                                        </button>
                                    </div>
                                );
                            })}

                            {/* FIRST-PERSON POV HUD: SPEECH BUBBLE & CURRENT ACTION */}
                            {currentScenario && !activeActionModal && !activeHotspot && !inspectorTab && (
                                <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-20 pointer-events-auto">
                                    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 text-white animate-slideDown">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow border border-white/20"
                                                style={{ backgroundColor: currentCharacter.themeColor }}
                                            >
                                                {currentCharacter.avatar}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                                        {currentScenario.timeTag} • {currentScenario.title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">Góc nhìn thứ nhất</span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-100 italic leading-relaxed mb-3">
                                                    "{currentScenario.monologue}"
                                                </p>

                                                {/* Action Button */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setActiveActionModal(currentScenario.actionDetail)}
                                                        className="px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-lg transition hover:scale-105 active:scale-95 flex items-center gap-1.5"
                                                        style={{ backgroundColor: currentCharacter.themeColor }}
                                                    >
                                                        <span>{currentScenario.actionBtn}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setIsFreeLook(true)}
                                                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10"
                                                    >
                                                        🖱️ Kéo chuột xoay tự do
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Camera Heading Indicator */}
                            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300">
                                <span className="text-cyan-400 font-mono font-bold">🧭 {Math.round(yaw)}°</span>
                                <span className="text-slate-500">|</span>
                                <span>Tầm mắt: {currentCharacter.cameraHeight.split(' ')[2]}</span>
                            </div>

                            {/* Zoom Floating Buttons */}
                            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setZoom(prev => Math.min(2.0, prev + 0.2))}
                                    className="w-8 h-8 rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                                    title="Phóng to"
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => setZoom(1.0)}
                                    className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs"
                                    title="Đặt lại zoom"
                                >
                                    ↺
                                </button>
                                <button
                                    onClick={() => setZoom(prev => Math.max(0.7, prev - 0.2))}
                                    className="w-8 h-8 rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                                    title="Thu nhỏ"
                                >
                                    -
                                </button>
                            </div>
                        </div>

                        {/* =========================================================================
                            ACTION DETAIL MODAL (KHI NHÂN VẬT THỰC HIỆN HÀNH ĐỘNG CỤ THỂ)
                           ========================================================================= */}
                        {activeActionModal && (
                            <div className="absolute inset-x-0 bottom-0 z-40 max-h-[75vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-t border-white/20 p-5 sm:p-6 shadow-2xl animate-slideUp">
                                <div className="max-w-4xl mx-auto text-white">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white"
                                                style={{ backgroundColor: currentCharacter.themeColor }}
                                            >
                                                {activeActionModal.badge}
                                            </span>
                                            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                                                {activeActionModal.heading}
                                            </h3>
                                        </div>

                                        <button
                                            onClick={() => setActiveActionModal(null)}
                                            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                                        {activeActionModal.description}
                                    </p>

                                    {/* Bullet points & Project Quote */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-5">
                                        <div className="bg-slate-800/70 p-4 rounded-xl border border-white/10">
                                            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5">
                                                💡 Giá Trị Thực Tiễn
                                            </h4>
                                            <ul className="space-y-2 text-xs text-slate-200">
                                                {activeActionModal.bulletPoints.map((bp, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-cyan-400 font-bold">•</span>
                                                        <span>{bp}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-slate-800/70 p-4 rounded-xl border-l-4 border-cyan-400 flex flex-col justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                                                    🏫 Trích Dẫn Thực Tế Từ Đối Tác
                                                </div>
                                                <p className="text-xs italic text-slate-300 leading-relaxed">
                                                    "{activeActionModal.quoteText}"
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-cyan-300 font-bold mt-3 pt-2 border-t border-white/10">
                                                <span>{activeActionModal.schoolName}</span>
                                                {activeActionModal.projectLink && (
                                                    <Link
                                                        href={activeActionModal.projectLink}
                                                        target="_blank"
                                                        className="underline hover:text-white"
                                                    >
                                                        Xem dự án ↗
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom action row */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                                        <button
                                            onClick={() => {
                                                setActiveActionModal(null);
                                                setInspectorTab('layers');
                                            }}
                                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 transition border border-white/10 flex items-center gap-1.5"
                                        >
                                            <span>🔬</span> Soi Mặt Cắt Cấu Tạo Ruột Nệm 3D
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setActiveActionModal(null);
                                                    if (currentStepIndex < currentCharacter.scenarios.length - 1) {
                                                        setCurrentStepIndex(prev => prev + 1);
                                                    }
                                                }}
                                                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition hover:opacity-90 flex items-center gap-1.5"
                                                style={{ backgroundColor: currentCharacter.themeColor }}
                                            >
                                                <span>Hoàn Thành Bước Này</span>
                                                <span>➔</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =========================================================================
                            PRODUCT INSPECTOR (SOI CHI TIẾT SẢN PHẨM & MÚT Y KHOA)
                           ========================================================================= */}
                        {inspectorTab && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
                                <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-3xl w-full p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
                                    {/* Inspector Header */}
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🔬</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">
                                                    Kiểm Định Cấu Tạo & Chất Liệu Nệm HULA
                                                </h3>
                                                <p className="text-xs text-slate-400">
                                                    Tiêu chuẩn nệm học đường chất lượng cao – An toàn 100% cho trẻ mầm non
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setInspectorTab(null)}
                                            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex items-center gap-2 mb-5 border-b border-white/10 pb-2">
                                        <button
                                            onClick={() => setInspectorTab('layers')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${inspectorTab === 'layers'
                                                ? 'bg-cyan-500 text-white'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Cấu Tạo 3 Lớp
                                        </button>
                                        <button
                                            onClick={() => setInspectorTab('elasticity')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${inspectorTab === 'elasticity'
                                                ? 'bg-emerald-500 text-white'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Thử Độ Đàn Hồi Ruột Mút
                                        </button>
                                        <button
                                            onClick={() => setInspectorTab('embroidery')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${inspectorTab === 'embroidery'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Chỉ Thêu & Khóa Giấu
                                        </button>
                                        <button
                                            onClick={() => setInspectorTab('projects')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${inspectorTab === 'projects'
                                                ? 'bg-amber-500 text-white'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            12 Dự Án Trường Học
                                        </button>
                                    </div>

                                    {/* Tab 1: Cấu Tạo 3 Lớp */}
                                    {inspectorTab === 'layers' && (
                                        <div className="space-y-4 text-xs sm:text-sm">
                                            <div className="p-4 rounded-xl bg-slate-800/80 border border-cyan-500/30">
                                                <div className="font-bold text-cyan-300 text-sm mb-1">
                                                    1. Lớp Vải Áo Nệm (Cotton Hàn Quốc 100% / Tencel)
                                                </div>
                                                <p className="text-slate-300 leading-relaxed">
                                                    Sợi vải tự nhiên chải kỹ, mềm mại, thoáng mát tuyệt đối, không gây kích ứng da non nớt của trẻ.
                                                </p>
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                                                <div className="font-bold text-emerald-300 text-sm mb-1">
                                                    2. Lớp Chần Gòn Kháng Khuẩn Êm Ái
                                                </div>
                                                <p className="text-slate-300 leading-relaxed">
                                                    Lớp bông gòn vi sợi chần ép kỹ lưỡng bằng máy chần hiện đại, tạo độ xốp êm mà không bị xô lệch bông khi giặt.
                                                </p>
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/30">
                                                <div className="font-bold text-amber-300 text-sm mb-1">
                                                    3. Lõi Mút PU Foam Định Hình Chuẩn Y Khoa
                                                </div>
                                                <p className="text-slate-300 leading-relaxed">
                                                    Độ cứng và đàn hồi được các chuyên gia y tế khuyên dùng cho trẻ mầm non, nâng đỡ cột sống thẳng tự nhiên, không xẹp lún.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 2: Thử Độ Đàn Hồi */}
                                    {inspectorTab === 'elasticity' && (
                                        <div className="text-center py-6">
                                            <div className="mb-4">
                                                <h4 className="text-base font-bold text-white mb-1">
                                                    Mô Phỏng Thử Nghiệm Ấn Lực Mút PU Foam HULA
                                                </h4>
                                                <p className="text-xs text-slate-300">
                                                    Nhấn và giữ nút bên dưới để thử độ chịu nén và đàn hồi tức thì của lõi mút:
                                                </p>
                                            </div>

                                            <div className="w-64 h-32 mx-auto bg-slate-800 rounded-2xl border-4 border-emerald-400/40 relative flex items-center justify-center transition-all duration-300 mb-6 shadow-xl">
                                                <div
                                                    className={`w-48 rounded-xl bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center shadow-lg transition-all duration-200 ${elasticityPressed ? 'h-10 scale-95 opacity-80' : 'h-24'
                                                        }`}
                                                >
                                                    {elasticityPressed ? '⚡ Đang Chịu Nén Tải Trọng' : '✨ PU Foam Đàn Hồi Chuẩn'}
                                                </div>
                                            </div>

                                            <button
                                                onMouseDown={() => setElasticityPressed(true)}
                                                onMouseUp={() => setElasticityPressed(false)}
                                                onTouchStart={() => setElasticityPressed(true)}
                                                onTouchEnd={() => setElasticityPressed(false)}
                                                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-xs shadow-lg transition"
                                            >
                                                {elasticityPressed ? 'ĐANG ẤN LỰC (Nhả tay để xem phục hồi)' : '👉 NHẤN & GIỮ ĐỂ ẤN THỬ ĐỘ ĐÀN HỒI'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Tab 3: Chỉ Thêu & Khóa Giấu */}
                                    {inspectorTab === 'embroidery' && (
                                        <div className="grid sm:grid-cols-2 gap-4 text-xs">
                                            <div className="bg-slate-800/80 p-4 rounded-xl border border-white/10">
                                                <h5 className="font-bold text-cyan-300 text-sm mb-2">
                                                    🏷️ Thêu Vi Tính Mật Độ Cao
                                                </h5>
                                                <p className="text-slate-300 leading-relaxed mb-3">
                                                    Logo trường học và tên từng bé được thêu bằng máy thêu công nghiệp Nhật Bản, từng mũi chỉ khít khao, không bung sợi khi giặt máy nhiều lần.
                                                </p>
                                                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-cyan-400">
                                                    Độ bền: &gt; 500 chu kỳ giặt sấy nhiệt độ cao
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/80 p-4 rounded-xl border border-white/10">
                                                <h5 className="font-bold text-amber-300 text-sm mb-2">
                                                    🛡️ Nẹp Khóa Kéo Giấu Kín
                                                </h5>
                                                <p className="text-slate-300 leading-relaxed mb-3">
                                                    Thiết kế khóa kéo giấu âm dưới nẹp vải bảo vệ 2 lớp giúp loại bỏ hoàn toàn nguy cơ cào xước làn da mềm mỏng của trẻ nhỏ.
                                                </p>
                                                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-amber-400">
                                                    Tiêu chuẩn an toàn: 100% Zero-scratch
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 4: 12 Dự Án Trường Học Thực Tế */}
                                    {inspectorTab === 'projects' && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
                                            {[
                                                { name: 'Trường MN 19/5 TP.HCM', tag: 'Chuẩn Quốc Gia' },
                                                { name: 'Trường QT Piaget', tag: 'Túi Ngủ Cao Cấp' },
                                                { name: 'Montessori VN Canada', tag: 'Montessori' },
                                                { name: 'Hệ thống ILO Academy', tag: 'Chất Lượng Cao' },
                                                { name: 'MN Nam Sài Gòn', tag: 'Phú Mỹ Hưng' },
                                                { name: 'Sright Preschool', tag: 'Đồng Bộ Brand' },
                                                { name: 'Dino Kinder', tag: 'Học Viện Khủng Long' },
                                                { name: 'Kindy Garden International', tag: 'Quốc Tế' },
                                                { name: 'BAY Preschool', tag: 'Cali Group' },
                                                { name: 'Hugo House', tag: 'TP.HCM & Long An' },
                                                { name: 'Những Ngón Tay Bay', tag: 'Hà Nội' },
                                                { name: 'Hơn 500+ Trường Khác', tag: 'Toàn Quốc' }
                                            ].map((proj, idx) => (
                                                <div key={idx} className="bg-slate-800/90 p-2.5 rounded-lg border border-white/10">
                                                    <div className="font-bold text-white text-[11px] truncate">{proj.name}</div>
                                                    <div className="text-[9px] text-cyan-400 mt-0.5">{proj.tag}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Modal Footer CTA */}
                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">
                                            Chứng nhận an toàn cho trẻ sơ sinh & mầm non
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href="/du-an"
                                                target="_blank"
                                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition border border-white/10"
                                            >
                                                Xem Tất Cả Dự Án
                                            </Link>
                                            <a
                                                href={settings?.zalo_url || 'https://zalo.me/0983882210'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#23a7d3] to-[#0ea5e9] text-white text-xs font-bold shadow-lg"
                                            >
                                                Nhận Mẫu Thử Vải Miễn Phí
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BOTTOM ACTION BAR */}
                        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border-t border-white/10 text-white text-xs">
                            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    500+ Trường Tin Dùng
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                    100% Chất Liệu An Toàn Y Khoa
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href="/du-an"
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition"
                                >
                                    Xem 12 Dự Án Thực Tế
                                </Link>
                                <a
                                    href={`tel:${settings?.contact_phone || '0983882210'}`}
                                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow hover:opacity-95 transition flex items-center gap-1.5"
                                >
                                    <span>📞</span> {settings?.contact_phone || '0983 882 210'}
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
