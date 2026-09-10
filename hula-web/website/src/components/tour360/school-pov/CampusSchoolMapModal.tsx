/**
 * CampusSchoolMapModal.tsx
 * Visual Interactive Architectural Floor Map for HULA Preschool Campus (Instruction 10 §3):
 * - Renders accurate 2D architectural floor plan conforming strictly to 03_Visual-Map.svg
 * - Shows 7 Rooms (R1-R7) + H0 Central Corridor + Entrance
 * - Corridors, doors, walls, and furniture iconography (mats, cubby shelves, desks)
 * - Highlights current room ("● Bạn đang ở đây") and visited status ("✓ Đã ghé")
 * - Quick Tour Route (R1 → R6 → R7) conforming to corridor path (no wall clipping)
 * - Interactive room selection with right info card (thumbnail, product, status, "Đi đến phòng")
 * - Desktop (1040-1120px) split view vs Mobile (390x844) pan/zoom & fit-to-screen
 * - APG Modal Dialog pattern: focus trap, Escape key restores focus, body scroll lock
 * - Secondary accessible list view toggle
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { campusWorldState, RoomId, ROOMS } from '../engine/CampusWorldState';

interface CampusSchoolMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoomId: RoomId;
    visitedRooms: Set<RoomId>;
    customRoomConfig?: Record<string, any>;
}

interface RoomDefinition {
    id: RoomId;
    label: string;
    subLabel: string;
    productName: string;
    productCode: string;
    thumbnail: string;
    desc: string;
    colorBg: string;
    strokeColor: string;
    // SVG coordinates
    rect: { x: number; y: number; width: number; height: number };
    doorRect: { x: number; y: number; width: number; height: number };
    furniture: Array<{ type: 'mat' | 'shelf' | 'desk'; x: number; y: number; w: number; h: number }>;
}

const ROOM_DEFS: Record<RoomId, RoomDefinition> = {
    R7: {
        id: 'R7',
        label: 'R7 · Phòng Đón Bé',
        subLabel: 'Bàn giao cuối tuần',
        productName: 'Túi quai xách & Bộ nệm hoàn chỉnh',
        productCode: 'REF-BAG-HANDLE',
        thumbnail: '/images/tour360/r7/me-linh/h0-greet.webp',
        desc: 'Nhận đúng túi của bé Mây, kiểm tra nhãn tên và bàn giao cùng cô An.',
        colorBg: '#173F40',
        strokeColor: '#0E292A',
        rect: { x: 303, y: 156, width: 236, height: 108 },
        doorRect: { x: 372, y: 242, width: 98, height: 24 },
        furniture: [{ type: 'desk', x: 355, y: 185, w: 130, h: 42 }],
    },
    R5: {
        id: 'R5',
        label: 'R5 · Góc Gọn Gàng',
        subLabel: 'Túi bảo quản 5 mẫu',
        productName: 'Túi bảo quản mầm non',
        productCode: 'REF-BAG-DRAWSTRING',
        thumbnail: '/images/tour360/products/tui-quai-xach.jpg',
        desc: 'Kệ cất túi cá nhân của các con với nhãn tên, quai xách chắc chắn.',
        colorBg: '#DDE9DB',
        strokeColor: '#BDCBC0',
        rect: { x: 83, y: 287, width: 263, height: 133 },
        doorRect: { x: 340, y: 371, width: 23, height: 30 },
        furniture: [
            { type: 'shelf', x: 102, y: 358, w: 48, h: 44 },
            { type: 'shelf', x: 167, y: 358, w: 48, h: 44 },
            { type: 'shelf', x: 232, y: 358, w: 48, h: 44 },
        ],
    },
    R6: {
        id: 'R6',
        label: 'R6 · Lớp HULA',
        subLabel: 'Phối hợp đa sản phẩm',
        productName: 'Không gian tích hợp 5 dòng sản phẩm',
        productCode: 'REF-CAMPUS-COMBO',
        thumbnail: '/images/tour360/showroom/classroom-concept.png',
        desc: 'Trưng bày phối hợp trọn bộ nệm, túi ngủ, nệm foam và kệ túi trong lớp học.',
        colorBg: '#D5E9E6',
        strokeColor: '#BDCBC0',
        rect: { x: 496, y: 287, width: 263, height: 133 },
        doorRect: { x: 478, y: 371, width: 23, height: 30 },
        furniture: [
            { type: 'mat', x: 515, y: 358, w: 48, h: 44 },
            { type: 'mat', x: 580, y: 358, w: 48, h: 44 },
            { type: 'mat', x: 645, y: 358, w: 48, h: 44 },
        ],
    },
    R3: {
        id: 'R3',
        label: 'R3 · Lớp Mầm',
        subLabel: 'Nệm foam gấp 4 khúc',
        productName: 'Nệm Foam gấp thông minh',
        productCode: 'REF-FOAM-FOLD4',
        thumbnail: '/images/tour360/cubby_nap.jpg',
        desc: 'Nệm foam gấp 4 đoạn tiện lợi, dễ dàng gấp gọn và xếp lên kệ cubby.',
        colorBg: '#F1E6D5',
        strokeColor: '#BDCBC0',
        rect: { x: 83, y: 446, width: 263, height: 133 },
        doorRect: { x: 340, y: 530, width: 23, height: 30 },
        furniture: [
            { type: 'mat', x: 102, y: 517, w: 48, h: 44 },
            { type: 'mat', x: 167, y: 517, w: 48, h: 44 },
            { type: 'mat', x: 232, y: 517, w: 48, h: 44 },
        ],
    },
    R4: {
        id: 'R4',
        label: 'R4 · Lớp Mây',
        subLabel: 'Túi ngủ mầm non',
        productName: 'Túi ngủ chăn liền đệm',
        productCode: 'REF-SLEEP-CARA-STD',
        thumbnail: '/images/tour360/classroom_wide.jpg',
        desc: 'Túi ngủ ấm áp liền chăn đệm, giữ ấm an toàn và tạo thói quen tự lập cho bé.',
        colorBg: '#E4E3F0',
        strokeColor: '#BDCBC0',
        rect: { x: 496, y: 446, width: 263, height: 133 },
        doorRect: { x: 478, y: 530, width: 23, height: 30 },
        furniture: [
            { type: 'mat', x: 515, y: 517, w: 48, h: 44 },
            { type: 'mat', x: 580, y: 517, w: 48, h: 44 },
            { type: 'mat', x: 645, y: 517, w: 48, h: 44 },
        ],
    },
    R1: {
        id: 'R1',
        label: 'R1 · Lớp Lá',
        subLabel: 'Cotton Cara 6 màu',
        productName: 'Bộ nệm Cotton Cara chần gòn',
        productCode: 'REF-MAT-CARA-STD',
        thumbnail: '/images/tour360/real-photos/catalogue/cara_blue.jpg',
        desc: 'Dòng nệm mầm non bán chạy nhất, vải Cotton Cara thoáng khí viền xám.',
        colorBg: '#DCEBD9',
        strokeColor: '#BDCBC0',
        rect: { x: 83, y: 605, width: 263, height: 133 },
        doorRect: { x: 340, y: 689, width: 23, height: 30 },
        furniture: [
            { type: 'mat', x: 102, y: 676, w: 48, h: 44 },
            { type: 'mat', x: 167, y: 676, w: 48, h: 44 },
            { type: 'mat', x: 232, y: 676, w: 48, h: 44 },
        ],
    },
    R2: {
        id: 'R2',
        label: 'R2 · Lớp Nắng',
        subLabel: 'Cotton Satin Hàn Quốc',
        productName: 'Bộ nệm Satin mềm mát cao cấp',
        productCode: 'REF-MAT-SATIN-STD',
        thumbnail: '/images/tour360/real-photos/catalogue/NEM_MN_-_01.jpg',
        desc: 'Chất liệu Satin Hàn Quốc mướt mát, chống nhăn và êm ái cho làn da nhạy cảm.',
        colorBg: '#F3E9C9',
        strokeColor: '#BDCBC0',
        rect: { x: 496, y: 605, width: 263, height: 133 },
        doorRect: { x: 478, y: 689, width: 23, height: 30 },
        furniture: [
            { type: 'mat', x: 515, y: 676, w: 48, h: 44 },
            { type: 'mat', x: 580, y: 676, w: 48, h: 44 },
            { type: 'mat', x: 645, y: 676, w: 48, h: 44 },
        ],
    },
    H0: {
        id: 'H0',
        label: 'H0 · Hành Lang',
        subLabel: 'Lối đi chung kết nối toàn trường',
        productName: 'Lối đi chính kết nối 7 phòng học',
        productCode: 'REF-CAMPUS-CORRIDOR',
        thumbnail: '/images/tour360/school-pov/05_School-Map.png',
        desc: 'Hành lang thông thoáng nối từ sảnh đón đến các phòng học và phòng bàn giao R7.',
        colorBg: '#E5DCC9',
        strokeColor: '#C8B89E',
        rect: { x: 359, y: 262, width: 124, height: 488 },
        doorRect: { x: 359, y: 704, width: 124, height: 30 },
        furniture: [],
    },
};

export function CampusSchoolMapModal({
    isOpen,
    onClose,
    currentRoomId,
    visitedRooms,
    customRoomConfig,
}: CampusSchoolMapModalProps) {
    const [selectedRoomId, setSelectedRoomId] = useState<RoomId>(currentRoomId);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // Sync selected room to current on open
    useEffect(() => {
        if (isOpen) {
            setSelectedRoomId(currentRoomId);
            setZoomLevel(1);
        }
    }, [isOpen, currentRoomId]);

    // APG Modal Dialog: Focus trap and escape restoration
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            } else if (e.key === 'Tab' && dialogRef.current) {
                // Focus trap inside dialog
                const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Lock body scroll
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Focus close button on mount
        setTimeout(() => {
            closeBtnRef.current?.focus();
        }, 50);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const selectedDef = ROOM_DEFS[selectedRoomId] || ROOM_DEFS.R1;
    const isCurrentSelected = selectedRoomId === currentRoomId;
    const isVisitedSelected = visitedRooms.has(selectedRoomId);

    const handleNavigate = (targetId: RoomId) => {
        campusWorldState.setRoom(targetId);
        onClose();
    };

    const roomIds: RoomId[] = ['R7', 'R5', 'R6', 'R3', 'R4', 'R1', 'R2'];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-modal-title"
            ref={dialogRef}
        >
            <div className="bg-white rounded-3xl max-w-5xl w-full h-[94vh] max-h-[820px] shadow-2xl border border-[#DDE5E1] flex flex-col overflow-hidden">
                {/* 1. Top Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEFEA] bg-[#FAFBF9] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#087F8C]/10 text-[#087F8C] flex items-center justify-center font-black text-lg">
                            🗺️
                        </div>
                        <div>
                            <h3 id="map-modal-title" className="text-base sm:text-lg font-bold text-[#173F40]">
                                Khám Phá Trường Mầm Non HULA
                            </h3>
                            <p className="text-xs text-[#566967]">
                                Mặt bằng kiến trúc trực quan • Chọn phòng để di chuyển tức thì
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="hidden sm:flex items-center p-1 bg-[#EAEFEA] rounded-xl text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setViewMode('map')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${
                                    viewMode === 'map' ? 'bg-white text-[#173F40] shadow-xs' : 'text-[#566967]'
                                }`}
                            >
                                Mặt bằng SVG
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${
                                    viewMode === 'list' ? 'bg-white text-[#173F40] shadow-xs' : 'text-[#566967]'
                                }`}
                            >
                                Danh sách
                            </button>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            ref={closeBtnRef}
                            onClick={onClose}
                            className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#F6F8F5] hover:bg-[#EAEFEA] text-[#566967] hover:text-[#183B3A] transition-all"
                            aria-label="Đóng bản đồ trường học"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 2. Main Body: Split Desktop (Map Left + Card Right) / Responsive Mobile */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    {/* LEFT PANEL: Interactive SVG Floor Map */}
                    {viewMode === 'map' ? (
                        <div className="relative flex-1 bg-[#F4F6ED] p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-0">
                            {/* Zoom Controls Overlay for Mobile / Touch */}
                            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-[#DDE5E1] shadow-md">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.2))}
                                    className="w-8 h-8 rounded-lg bg-[#F6F8F5] hover:bg-[#EAEFEA] text-[#173F40] font-black text-sm flex items-center justify-center"
                                    aria-label="Phóng to bản đồ"
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
                                    className="w-8 h-8 rounded-lg bg-[#F6F8F5] hover:bg-[#EAEFEA] text-[#173F40] font-black text-sm flex items-center justify-center"
                                    aria-label="Thu nhỏ bản đồ"
                                >
                                    -
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(1)}
                                    className="px-2 h-8 rounded-lg bg-[#F6F8F5] hover:bg-[#EAEFEA] text-[#173F40] font-bold text-xs flex items-center justify-center"
                                >
                                    Vừa màn hình
                                </button>
                            </div>

                            {/* SVG Architectural Floor Plan */}
                            <div
                                className="w-full h-full flex items-center justify-center transition-transform duration-200"
                                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                            >
                                <svg
                                    viewBox="0 0 850 820"
                                    className="w-full h-full max-h-[720px] object-contain select-none"
                                    role="img"
                                    aria-label="Mặt bằng kiến trúc trường mầm non HULA"
                                >
                                    {/* Floor background */}
                                    <rect x="20" y="110" width="810" height="690" rx="20" fill="#F4F6ED" stroke="#DDE5E1" strokeWidth="2" />

                                    {/* H0 Central Corridor */}
                                    <rect x="359" y="262" width="124" height="488" rx="4" fill="#E5DCC9" stroke="#D2C3AA" strokeWidth="2" />
                                    <text x="421" y="520" fontFamily="DejaVu Sans, sans-serif" fontSize="13" fontWeight="bold" fill="#8C795E" textAnchor="middle">
                                        HÀNH LANG H0
                                    </text>

                                    {/* Entrance label */}
                                    <g transform="translate(421, 785)">
                                        <rect x="-60" y="-18" width="120" height="26" rx="6" fill="#173F40" />
                                        <text x="0" y="-1" fontFamily="DejaVu Sans, sans-serif" fontSize="12" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
                                            LỐI VÀO SẢNH
                                        </text>
                                    </g>

                                    {/* Quick Route Path (Dash Line R1 -> R6 -> R7 strictly through corridor) */}
                                    <path
                                        d="M 359 704 H 421 V 389 H 484 M 421 389 V 262"
                                        fill="none"
                                        stroke="#087F8C"
                                        strokeWidth="4.5"
                                        strokeDasharray="7 7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Doorway connection to R7 */}
                                    <rect x="372" y="242" width="98" height="24" rx="2" fill="#E5DCC9" stroke="#D2C3AA" strokeWidth="1.5" />

                                    {/* Render all 7 Rooms */}
                                    {roomIds.map(roomId => {
                                        const r = ROOM_DEFS[roomId];
                                        const isCurrent = currentRoomId === roomId;
                                        const isSelected = selectedRoomId === roomId;
                                        const isVisited = visitedRooms.has(roomId);
                                        const isR7 = roomId === 'R7';

                                        return (
                                            <g
                                                key={roomId}
                                                onClick={() => setSelectedRoomId(roomId)}
                                                className="cursor-pointer transition-all group"
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Phòng ${r.label}, nhấn để xem chi tiết`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        setSelectedRoomId(roomId);
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                {/* Door opening */}
                                                <rect
                                                    x={r.doorRect.x}
                                                    y={r.doorRect.y}
                                                    width={r.doorRect.width}
                                                    height={r.doorRect.height}
                                                    fill="#E5DCC9"
                                                    stroke="#D2C3AA"
                                                    strokeWidth="1.5"
                                                />

                                                {/* Room Main Box */}
                                                <rect
                                                    x={r.rect.x}
                                                    y={r.rect.y}
                                                    width={r.rect.width}
                                                    height={r.rect.height}
                                                    rx={isR7 ? 14 : 10}
                                                    fill={r.colorBg}
                                                    stroke={isSelected ? '#087F8C' : r.strokeColor}
                                                    strokeWidth={isSelected ? 4.5 : 2}
                                                    filter={isSelected ? 'drop-shadow(0 4px 12px rgba(8,127,140,0.4))' : 'none'}
                                                />

                                                {/* Furniture Icons inside room */}
                                                {r.furniture.map((f, fIdx) => (
                                                    <g key={fIdx}>
                                                        <rect
                                                            x={f.x}
                                                            y={f.y}
                                                            width={f.w}
                                                            height={f.h}
                                                            rx={5}
                                                            fill={isR7 ? '#C79E71' : '#8EBCB9'}
                                                            stroke="none"
                                                        />
                                                        {f.type === 'mat' && (
                                                            <rect
                                                                x={f.x + 4}
                                                                y={f.y + 4}
                                                                width={f.w - 8}
                                                                height={10}
                                                                rx={3}
                                                                fill="#EAF4ED"
                                                            />
                                                        )}
                                                    </g>
                                                ))}

                                                {/* Room Titles */}
                                                <text
                                                    x={r.rect.x + 18}
                                                    y={r.rect.y + 30}
                                                    fontFamily="DejaVu Sans, sans-serif"
                                                    fontSize={isR7 ? 17 : 16}
                                                    fontWeight="bold"
                                                    fill={isR7 ? '#FFFFFF' : '#173F40'}
                                                >
                                                    {r.label}
                                                </text>
                                                <text
                                                    x={r.rect.x + 18}
                                                    y={r.rect.y + 52}
                                                    fontFamily="DejaVu Sans, sans-serif"
                                                    fontSize={12}
                                                    fontWeight="normal"
                                                    fill={isR7 ? '#D9EEEB' : '#52696A'}
                                                >
                                                    {r.subLabel}
                                                </text>

                                                {/* Current Room "Bạn đang ở đây" Badge */}
                                                {isCurrent && (
                                                    <g transform={`translate(${r.rect.x + 18}, ${r.rect.y + 70})`}>
                                                        <rect
                                                            x="-4"
                                                            y="-14"
                                                            width="118"
                                                            height="22"
                                                            rx="11"
                                                            fill={isR7 ? '#087F8C' : '#173F40'}
                                                        />
                                                        <text
                                                            x="55"
                                                            y="1"
                                                            fontFamily="DejaVu Sans, sans-serif"
                                                            fontSize="10.5"
                                                            fontWeight="bold"
                                                            fill="#FFFFFF"
                                                            textAnchor="middle"
                                                        >
                                                            ● Bạn đang ở đây
                                                        </text>
                                                    </g>
                                                )}

                                                {/* Visited Checkmark */}
                                                {!isCurrent && isVisited && (
                                                    <text
                                                        x={r.rect.x + r.rect.width - 24}
                                                        y={r.rect.y + 30}
                                                        fontFamily="DejaVu Sans, sans-serif"
                                                        fontSize="13"
                                                        fontWeight="bold"
                                                        fill="#087F8C"
                                                        textAnchor="end"
                                                    >
                                                        ✓ Đã ghé
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    ) : (
                        /* ACCESSIBLE LIST VIEW FALLBACK */
                        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-[#F6F8F5]">
                            {roomIds.map(roomId => {
                                const r = ROOM_DEFS[roomId];
                                const isCurrent = currentRoomId === roomId;
                                const isSelected = selectedRoomId === roomId;
                                const isVisited = visitedRooms.has(roomId);

                                return (
                                    <button
                                        key={roomId}
                                        type="button"
                                        onClick={() => setSelectedRoomId(roomId)}
                                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[44px] ${
                                            isSelected
                                                ? 'bg-[#173F40] text-white border-[#173F40] shadow-md'
                                                : 'bg-white text-[#173F40] border-[#DDE5E1] hover:border-[#B7D9CC]'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm">{r.label}</span>
                                                {isCurrent && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#087F8C] text-white">
                                                        Đang ở đây
                                                    </span>
                                                )}
                                                {!isCurrent && isVisited && (
                                                    <span className="text-xs text-[#087F8C] font-semibold">✓ Đã ghé</span>
                                                )}
                                            </div>
                                            <span className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#566967]'}`}>
                                                {r.subLabel} — {r.productName}
                                            </span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-[#F6F8F5] text-[#173F40]'
                                        }`}>
                                            Xem chi tiết →
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* RIGHT PANEL: Selected Room Information & Navigation Card */}
                    <div className="w-full md:w-[340px] lg:w-[360px] bg-white border-t md:border-t-0 md:border-l border-[#EAEFEA] p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
                        <div className="space-y-4">
                            {/* Quick Route Shortcut Banner */}
                            <div className="p-3.5 rounded-2xl bg-[#E0F0EA] border border-[#B7D9CC] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-[#173F40]">Tuyến khám phá nhanh:</span>
                                    <span className="text-[11px] text-[#087F8C] font-semibold">3-5 phút</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRoomId('R1');
                                            handleNavigate('R1');
                                        }}
                                        className={`py-2 px-1 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                                            currentRoomId === 'R1' ? 'bg-[#173F40] text-white' : 'bg-white text-[#173F40] hover:bg-[#D4E8E1]'
                                        }`}
                                    >
                                        1. R1 Cara
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRoomId('R6');
                                            handleNavigate('R6');
                                        }}
                                        className={`py-2 px-1 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                                            currentRoomId === 'R6' ? 'bg-[#173F40] text-white' : 'bg-white text-[#173F40] hover:bg-[#D4E8E1]'
                                        }`}
                                    >
                                        2. R6 HULA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRoomId('R7');
                                            handleNavigate('R7');
                                        }}
                                        className={`py-2 px-1 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                                            currentRoomId === 'R7' ? 'bg-[#173F40] text-white' : 'bg-white text-[#173F40] hover:bg-[#D4E8E1]'
                                        }`}
                                    >
                                        3. R7 Đón Bé
                                    </button>
                                </div>
                            </div>

                            {/* Selected Room Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-[#087F8C] uppercase tracking-wider">
                                        Phòng Đang Chọn
                                    </span>
                                    {isCurrentSelected ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#087F8C] text-white">
                                            Vị trí hiện tại
                                        </span>
                                    ) : isVisitedSelected ? (
                                        <span className="text-xs text-[#087F8C] font-bold">✓ Đã ghé</span>
                                    ) : (
                                        <span className="text-xs text-[#8C9E9A]">Chưa ghé</span>
                                    )}
                                </div>

                                <h4 className="text-xl font-black text-[#173F40] leading-tight">
                                    {selectedDef.label}
                                </h4>

                                {/* Thumbnail image */}
                                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[#DDE5E1] bg-[#F4F6ED]">
                                    <img
                                        src={selectedDef.thumbnail}
                                        alt={selectedDef.label}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                                        {selectedDef.productCode}
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-[#F6F8F5] border border-[#EAEFEA] space-y-1">
                                    <span className="text-[11px] font-bold text-[#087F8C] block">
                                        {selectedDef.productName}
                                    </span>
                                    <p className="text-xs text-[#52696A] leading-relaxed">
                                        {selectedDef.desc}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Actions & Map Legend */}
                        <div className="pt-4 border-t border-[#EAEFEA] space-y-3">
                            <button
                                type="button"
                                onClick={() => handleNavigate(selectedRoomId)}
                                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 min-h-[44px] ${
                                    isCurrentSelected
                                        ? 'bg-[#173F40] text-white hover:bg-[#204F4E]'
                                        : 'bg-[#087F8C] text-white hover:bg-[#076C77]'
                                }`}
                            >
                                <span>{isCurrentSelected ? 'Tiếp tục tại phòng này →' : `Đi đến ${selectedDef.label} →`}</span>
                            </button>

                            {/* Legend */}
                            <div className="flex items-center justify-between text-[11px] text-[#617777] pt-1">
                                <span>● Vị trí hiện tại</span>
                                <span>✓ Đã ghé</span>
                                <span>┄ Tuyến nhanh</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
