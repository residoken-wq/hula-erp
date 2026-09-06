'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

interface Hotspot {
    id: string;
    yaw: number; // 0 - 360 degrees
    pitch: number; // -45 to 45 degrees
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
            text: 'Hula mang đến giải pháp toàn diện với Bộ Gối - Nệm - Túi cao cấp. Vượt qua những tiêu chuẩn khắt khe nhất về công năng và thẩm mỹ, thiết kế của Hula không chỉ chăm chút giấc ngủ cho trẻ mà còn giải quyết bài toán tối ưu diện tích không gian lớp học.',
            source: 'Dự án Cung cấp giải pháp nệm cho Trường MN 19/5 Thành phố',
            school: 'Trường Mầm Non 19/5 TP.HCM',
            link: '/du-an/cung-cap-giai-phap-nem-mam-non-cho-truong-mam-non-195-thanh-pho'
        },
        highlights: [
            'Thiết kế gấp 3 hoặc cuộn túi ngủ siêu tốc, thao tác nhẹ nhàng cho cô giáo.',
            'Kích thước chuẩn khít theo từng ngăn tủ cá nhân của lớp học mầm non hiện đại.',
            'Trọng lượng siêu nhẹ, giảm áp lực mang vác hàng ngày cho giáo viên bán trú.',
            'Không gian sàn được giải phóng tức thì cho hoạt động thể chất và giờ học buổi chiều.'
        ],
        specs: [
            { label: 'Quy cách gấp', value: 'Gấp 3 khúc gọn hoặc Túi ngủ cuộn' },
            { label: 'Thời gian thao tác', value: '3 - 5 giây / bộ' },
            { label: 'Trọng lượng', value: 'Khoảng 650g - 900g (cực nhẹ)' },
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
            text: 'Dự án ghi dấu ấn mạnh mẽ với những bộ túi ngủ đồng bộ, đẹp mắt và cực kỳ chỉn chu trong từng đường kim mũi chỉ, mang đến một không gian say giấc hoàn hảo cho các thiên thần nhỏ.',
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
            text: 'Nhờ thiết kế tối ưu, trọng lượng nhẹ và dễ dàng thao tác, các bé mầm non hoàn toàn có thể tự tay trải và gấp nệm của mình. Đây là phương pháp tuyệt vời giúp nhà trường rèn luyện tính kỷ luật và sự tự giác cho trẻ ngay từ những thói quen nhỏ nhất.',
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
    const [perspective, setPerspective] = useState<'all' | 'teacher' | 'parent' | 'student'>('all');
    const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
    const [yaw, setYaw] = useState<number>(30); // Horizontal angle (0-360)
    const [pitch, setPitch] = useState<number>(0); // Vertical tilt (-30 to 30)
    const [zoom, setZoom] = useState<number>(1);
    const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef<boolean>(false);
    const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const animFrameRef = useRef<number>(0);

    // Filter hotspots based on selected perspective
    const filteredHotspots = useMemo(() => {
        if (perspective === 'all') return HOTSPOTS;
        return HOTSPOTS.filter(h => h.perspective === perspective || h.perspective === 'all');
    }, [perspective]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeHotspot) {
                    setActiveHotspot(null);
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
    }, [isOpen, activeHotspot, onClose]);

    // Auto rotate loop
    useEffect(() => {
        if (!isOpen) return;

        let lastTime = performance.now();
        const loop = (currentTime: number) => {
            const delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            if (isAutoRotate && !isDraggingRef.current && !activeHotspot) {
                setYaw(prev => (prev + delta * 6) % 360);
            }

            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isOpen, isAutoRotate, activeHotspot]);

    // Draw panoramic environment on canvas
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width = canvas.parentElement?.clientWidth || 1200;
        const height = canvas.height = canvas.parentElement?.clientHeight || 700;

        // Render Classroom Panorama Canvas
        ctx.clearRect(0, 0, width, height);

        // Sky & Ambient Lighting Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#bae6fd'); // Daylight sky blue
        skyGrad.addColorStop(0.35, '#e0f2fe');
        skyGrad.addColorStop(0.55, '#fef9c3'); // Warm classroom daylight
        skyGrad.addColorStop(0.85, '#fed7aa'); // Warm wooden floor reflection
        skyGrad.addColorStop(1, '#d97706'); // Natural oak floor
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw 360 panoramic room walls with repeating perspective segments
        const fov = 110 / zoom;
        const pixelsPerDegree = width / fov;
        const centerY = height / 2 + (pitch * 8);

        // Draw Wooden Floor Grid
        ctx.save();
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, centerY + 80, width, height - (centerY + 80));

        // Floor planks
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
        ctx.lineWidth = 2;
        for (let x = -360; x <= 720; x += 30) {
            const screenX = ((x - yaw + 360) % 360) * pixelsPerDegree;
            ctx.beginPath();
            ctx.moveTo(screenX, centerY + 80);
            ctx.lineTo(screenX + (screenX - width / 2) * 1.5, height);
            ctx.stroke();
        }
        ctx.restore();

        // Draw Walls & Windows at specific angular positions
        const wallSegments = [
            { angle: 0, type: 'window', title: 'Cửa Sổ Lấy Sáng Tự Nhiên' },
            { angle: 60, type: 'cabinet', title: 'Hệ Tủ Kệ Nệm HULA Gấp Gọn' },
            { angle: 120, type: 'nap_area', title: 'Khu Vực Ngủ Trưa Học Sinh' },
            { angle: 180, type: 'whiteboard', title: 'Góc Hoạt Động & Bảng Lớp' },
            { angle: 240, type: 'shelves', title: 'Kệ Đồ Dùng & Đồ Chơi Montessori' },
            { angle: 300, type: 'teacher_desk', title: 'Góc Làm Việc Giáo Viên' }
        ];

        wallSegments.forEach(seg => {
            const relAngle = ((seg.angle - yaw + 540) % 360) - 180;
            const screenX = width / 2 + relAngle * pixelsPerDegree;

            if (screenX >= -200 && screenX <= width + 200) {
                ctx.save();
                if (seg.type === 'window') {
                    // Window frame
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(screenX - 120, centerY - 160, 240, 220);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(screenX - 110, centerY - 150, 105, 95);
                    ctx.fillRect(screenX + 5, centerY - 150, 105, 95);
                    ctx.fillRect(screenX - 110, centerY - 45, 105, 95);
                    ctx.fillRect(screenX + 5, centerY - 45, 105, 95);

                    // Sunshine ray
                    const sun = ctx.createLinearGradient(screenX - 50, centerY - 100, screenX + 150, centerY + 180);
                    sun.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
                    sun.addColorStop(1, 'rgba(254, 240, 138, 0)');
                    ctx.fillStyle = sun;
                    ctx.beginPath();
                    ctx.moveTo(screenX - 110, centerY - 150);
                    ctx.lineTo(screenX + 180, centerY + 220);
                    ctx.lineTo(screenX + 20, centerY + 220);
                    ctx.lineTo(screenX - 110, centerY - 50);
                    ctx.fill();
                } else if (seg.type === 'cabinet') {
                    // Storage Cubbies with Folded Hula Mattresses
                    ctx.fillStyle = '#fcd34d'; // Wood cabinet
                    ctx.fillRect(screenX - 140, centerY - 140, 280, 240);
                    ctx.strokeStyle = '#d97706';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(screenX - 140, centerY - 140, 280, 240);

                    // 6 Cubbies
                    for (let row = 0; row < 3; row++) {
                        for (let col = 0; col < 2; col++) {
                            const cubX = screenX - 130 + col * 135;
                            const cubY = centerY - 130 + row * 75;
                            ctx.fillStyle = '#fef3c7';
                            ctx.fillRect(cubX, cubY, 125, 65);
                            ctx.strokeRect(cubX, cubY, 125, 65);

                            // Folded HULA Mattress
                            ctx.fillStyle = row % 2 === 0 ? '#0284c7' : '#059669';
                            ctx.beginPath();
                            ctx.roundRect(cubX + 8, cubY + 12, 108, 42, 6);
                            ctx.fill();

                            // Mattress Stitch detail & Logo badge
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 9px sans-serif';
                            ctx.fillText('HULA ★ Bé An', cubX + 18, cubY + 36);
                        }
                    }
                } else if (seg.type === 'nap_area') {
                    // Floor sleeping mats neatly aligned
                    ctx.fillStyle = '#e0f2fe';
                    ctx.beginPath();
                    ctx.ellipse(screenX, centerY + 140, 180, 70, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Nap Mattresses laid out
                    [-70, 0, 70].forEach((offset, idx) => {
                        ctx.fillStyle = idx === 1 ? '#38bdf8' : '#34d399';
                        ctx.beginPath();
                        ctx.roundRect(screenX + offset - 28, centerY + 100 + Math.abs(offset) * 0.2, 56, 90, 8);
                        ctx.fill();

                        // Pillow
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.roundRect(screenX + offset - 22, centerY + 105, 44, 20, 5);
                        ctx.fill();

                        // Embroidered name tag
                        ctx.fillStyle = '#0f172a';
                        ctx.font = '7px sans-serif';
                        ctx.fillText('HULA', screenX + offset - 10, centerY + 118);
                    });
                } else if (seg.type === 'whiteboard') {
                    // Classroom wall & whiteboard
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(screenX - 130, centerY - 150, 260, 140);
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(screenX - 130, centerY - 150, 260, 140);

                    // Writing on board
                    ctx.fillStyle = '#0284c7';
                    ctx.font = 'bold 15px sans-serif';
                    ctx.fillText('🏫 LỚP HỌC MẦM NON HULA', screenX - 110, centerY - 110);
                    ctx.fillStyle = '#475569';
                    ctx.font = '12px sans-serif';
                    ctx.fillText('🌟 100% Chất liệu an toàn cho bé', screenX - 100, centerY - 80);
                    ctx.fillText('✨ Gấp gọn 5 giây • Nhẹ tênh vận hành', screenX - 100, centerY - 55);
                    ctx.fillText('💤 Giấc ngủ êm ái • Nâng niu cột sống', screenX - 100, centerY - 30);
                } else {
                    // Activity shelves / desk
                    ctx.fillStyle = '#fef08a';
                    ctx.fillRect(screenX - 100, centerY - 80, 200, 160);
                    ctx.strokeStyle = '#eab308';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(screenX - 100, centerY - 80, 200, 160);

                    // Toys and books
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(screenX - 50, centerY - 40, 18, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(screenX, centerY - 55, 30, 40);
                }
                ctx.restore();
            }
        });

        // Ambient ceiling lights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 4; i++) {
            const lx = ((i * 90 - yaw + 360) % 360) * pixelsPerDegree;
            ctx.beginPath();
            ctx.ellipse(lx, centerY - 240, 50, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

    }, [isOpen, yaw, pitch, zoom]);

    // Mouse drag handlers for 360 rotation
    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
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

    // Touch handlers for mobile devices
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            isDraggingRef.current = true;
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

    // Calculate screen position for a hotspot given current yaw, pitch, zoom
    const getHotspotScreenPos = (hs: Hotspot) => {
        if (!containerRef.current) return { x: -999, y: -999, isVisible: false };
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const fov = 110 / zoom;
        const pixelsPerDegree = width / fov;

        const relYaw = ((hs.yaw - yaw + 540) % 360) - 180;
        const screenX = width / 2 + relYaw * pixelsPerDegree;
        const centerY = height / 2 + (pitch * 8);
        const screenY = centerY + (hs.pitch * 6);

        const isVisible = relYaw >= -fov / 2 && relYaw <= fov / 2;
        return { x: screenX, y: screenY, isVisible };
    };

    // Perspective switch helper with auto-focus to relevant hotspot
    const switchPerspective = (p: 'all' | 'teacher' | 'parent' | 'student') => {
        setPerspective(p);
        if (p === 'teacher') {
            setYaw(50);
            setPitch(-4);
        } else if (p === 'parent') {
            setYaw(200);
            setPitch(-15);
        } else if (p === 'student') {
            setYaw(320);
            setPitch(-12);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 transition-all animate-fadeIn">
            {/* Main Experience Container */}
            <div
                ref={containerRef}
                className={`relative w-full ${isFullscreen ? 'h-full' : 'h-[92vh] max-w-7xl'} bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col`}
            >
                {/* TOP BAR: Perspectives & Controls */}
                <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-white/10 text-white">
                    {/* Brand & Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#23a7d3] to-[#1788b0] flex items-center justify-center font-bold text-white shadow-lg text-sm tracking-wider">
                            360°
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                                    Lớp Học 360° HULA
                                </h2>
                                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#23a7d3]/20 text-[#23a7d3] border border-[#23a7d3]/30">
                                    Trải nghiệm thực tế
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 hidden sm:block">
                                Khám phá giải pháp nệm mầm non từ 3 góc nhìn then chốt
                            </p>
                        </div>
                    </div>

                    {/* Perspective Switcher Tabs */}
                    <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
                        <button
                            onClick={() => switchPerspective('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${perspective === 'all'
                                ? 'bg-[#23a7d3] text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>🌐</span> Toàn cảnh
                        </button>
                        <button
                            onClick={() => switchPerspective('teacher')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${perspective === 'teacher'
                                ? 'bg-[#0284c7] text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>👩‍🏫</span> Góc Giáo Viên
                        </button>
                        <button
                            onClick={() => switchPerspective('parent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${perspective === 'parent'
                                ? 'bg-[#059669] text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>👨‍👩‍👧</span> Góc Phụ Huynh
                        </button>
                        <button
                            onClick={() => switchPerspective('student')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${perspective === 'student'
                                ? 'bg-[#d97706] text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>🧒</span> Góc Bé Yêu
                        </button>
                    </div>

                    {/* Window Controls */}
                    <div className="flex items-center gap-2">
                        {/* Auto rotate toggle */}
                        <button
                            onClick={() => setIsAutoRotate(!isAutoRotate)}
                            title={isAutoRotate ? 'Tạm dừng tự xoay' : 'Bật tự xoay 360'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition border ${isAutoRotate
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                        >
                            {isAutoRotate ? '⏸️' : '▶️'}
                        </button>

                        {/* Fullscreen toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title="Toàn màn hình"
                            className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white items-center justify-center text-xs border border-slate-700"
                        >
                            {isFullscreen ? '🗗' : '🗖'}
                        </button>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white flex items-center justify-center transition border border-red-500/30"
                            title="Đóng (ESC)"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Perspective Header Highlight Banner */}
                <div className="relative z-10 px-4 py-2 bg-slate-800/80 backdrop-blur-sm border-b border-white/5 text-xs text-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="font-bold text-[#23a7d3]">
                            {perspective === 'all' && '📌 HỆ SINH THÁI TOÀN DIỆN:'}
                            {perspective === 'teacher' && '👩‍🏫 GÓC GIÁO VIÊN:'}
                            {perspective === 'parent' && '👨‍👩‍👧 GÓC PHỤ HUYNH:'}
                            {perspective === 'student' && '🧒 GÓC HỌC SINH:'}
                        </span>
                        <span className="text-slate-300 text-[11px] sm:text-xs">
                            {perspective === 'all' && 'Khám phá tất cả các điểm chạm nệm mầm non tối ưu cho trường học.'}
                            {perspective === 'teacher' && 'Nhàn tênh vận hành – Nệm gấp gọn 5 giây, cất vừa ô tủ, thêu tên không thất lạc.'}
                            {perspective === 'parent' && 'An tâm gửi con – 100% Cotton & Tencel an toàn, mút y tế bảo vệ cột sống, kháng khuẩn.'}
                            {perspective === 'student' && 'Giấc ngủ vui & Tự lập – Êm ái, mát lưng, bé hào hứng tự trải nệm và gấp nệm cùng bạn.'}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>🖱️ Kéo chuột để xoay 360°</span>
                        <span>•</span>
                        <span>🔍 Cuộn chuột để phóng to</span>
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
                    {filteredHotspots.map(hs => {
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

                                {/* Main hotspot button */}
                                <button
                                    className={`relative flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-bold transition-all border ${isSelected
                                        ? 'bg-white text-slate-900 border-white ring-4 ring-cyan-400'
                                        : 'bg-slate-900/90 text-white border-white/40 hover:border-white'
                                        }`}
                                    style={{
                                        boxShadow: `0 8px 24px -4px ${hs.themeColor}88`
                                    }}
                                >
                                    <span className="text-sm">{hs.icon}</span>
                                    <span className="whitespace-nowrap">{hs.shortTitle}</span>
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: hs.themeColor }}
                                    />
                                </button>
                            </div>
                        );
                    })}

                    {/* Compass & Angle Indicator */}
                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300">
                        <span className="text-cyan-400 font-mono font-bold">🧭 {Math.round(yaw)}°</span>
                        <span className="text-slate-500">|</span>
                        <span>Zoom {zoom.toFixed(1)}x</span>
                    </div>

                    {/* Zoom in/out Floating Bar */}
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
                            title="Đặt lại góc nhìn"
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

                {/* HOTSPOT DETAIL DRAWER / POPUP MODAL */}
                {activeHotspot && (
                    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[75vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-t border-white/20 p-5 sm:p-6 shadow-2xl animate-slideUp">
                        <div className="max-w-4xl mx-auto">
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                                        style={{ backgroundColor: `${activeHotspot.themeColor}25`, border: `2px solid ${activeHotspot.themeColor}50` }}
                                    >
                                        {activeHotspot.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white"
                                                style={{ backgroundColor: activeHotspot.themeColor }}
                                            >
                                                {activeHotspot.badge}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {activeHotspot.perspective === 'teacher' && 'Dành cho Giáo viên & Ban Giám Hiệu'}
                                                {activeHotspot.perspective === 'parent' && 'Dành cho Phụ huynh học sinh'}
                                                {activeHotspot.perspective === 'student' && 'Dành cho Bé yêu mầm non'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                                            {activeHotspot.label}
                                        </h3>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setActiveHotspot(null)}
                                    className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Headline */}
                            <p className="text-sm sm:text-base text-cyan-200 font-medium mb-4 leading-relaxed">
                                ✨ {activeHotspot.headline}
                            </p>

                            {/* Content Grid */}
                            <div className="grid md:grid-cols-2 gap-5 mb-5">
                                {/* Highlights */}
                                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                                        <span>💎</span> Điểm Ưu Việt Của Sản Phẩm
                                    </h4>
                                    <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                                        {activeHotspot.highlights.map((h, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-cyan-400 font-bold">•</span>
                                                <span>{h}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Specifications & Verified Project Quote */}
                                <div className="space-y-4">
                                    {/* Quote Box */}
                                    <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/40 rounded-xl p-4 border-l-4 border-cyan-400 shadow-md">
                                        <p className="text-xs italic text-slate-300 leading-relaxed mb-2">
                                            "{activeHotspot.quote.text}"
                                        </p>
                                        <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
                                            <span>🏫 {activeHotspot.quote.school}</span>
                                            {activeHotspot.quote.link && (
                                                <Link
                                                    href={activeHotspot.quote.link}
                                                    target="_blank"
                                                    className="underline hover:text-white"
                                                >
                                                    Xem dự án ↗
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Specs Table */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {activeHotspot.specs.map((s, idx) => (
                                            <div key={idx} className="bg-slate-800/40 px-3 py-2 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-slate-400">{s.label}</div>
                                                <div className="font-semibold text-white">{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Inside Drawer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Khám phá thêm:</span>
                                    {HOTSPOTS.filter(h => h.id !== activeHotspot.id).map(h => (
                                        <button
                                            key={h.id}
                                            onClick={() => setActiveHotspot(h)}
                                            className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white text-xs border border-white/5 transition"
                                        >
                                            {h.icon} {h.shortTitle}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/du-an"
                                        target="_blank"
                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition border border-white/10"
                                    >
                                        Xem 12 Dự Án Thực Tế
                                    </Link>
                                    <a
                                        href={settings?.zalo_url || 'https://zalo.me/0983882210'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#23a7d3] to-[#0ea5e9] hover:opacity-90 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 transition flex items-center gap-2"
                                    >
                                        <span>💬</span> Nhận Tư Vấn & Mẫu Vải Thử
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* BOTTOM ACTION BAR */}
                <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-t border-white/10 text-white text-xs">
                    <div className="flex items-center gap-4 text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            500+ Trường tin tưởng
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            100% Chất liệu an toàn
                        </span>
                        <span className="hidden md:inline">•</span>
                        <span className="hidden md:flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            98% Đối tác hài lòng
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/du-an"
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition"
                        >
                            Tất cả dự án trường học
                        </Link>
                        <a
                            href={`tel:${settings?.contact_phone || '0983882210'}`}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5"
                        >
                            <span>📞</span> {settings?.contact_phone || '0983 882 210'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
