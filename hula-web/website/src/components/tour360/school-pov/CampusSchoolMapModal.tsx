/**
 * CampusSchoolMapModal.tsx
 * Interactive School Map Dialog for HULA Preschool Campus:
 * - Shows H0 Corridor + 7 Rooms
 * - Highlights current room & visited status
 * - Quick Route: R1 -> R6 -> R7
 * - Click any room door to navigate immediately
 */

'use client';

import React from 'react';
import { campusWorldState, ROOMS, RoomId } from '../engine/CampusWorldState';

interface CampusSchoolMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoomId: RoomId;
    visitedRooms: Set<RoomId>;
}

export function CampusSchoolMapModal({
    isOpen,
    onClose,
    currentRoomId,
    visitedRooms,
}: CampusSchoolMapModalProps) {
    if (!isOpen) return null;

    const handleSelectRoom = (roomId: RoomId) => {
        campusWorldState.setRoom(roomId);
        onClose();
    };

    const roomEntries: Array<{ id: RoomId; label: string; desc: string; side: 'left' | 'right' | 'center' }> = [
        { id: 'R7', label: 'R7 · Phòng Đón Bé', desc: 'Bàn giao túi cuối tuần (An, Linh, Mây)', side: 'center' },
        { id: 'R5', label: 'R5 · Góc Gọn Gàng', desc: 'Túi bảo quản 5 mẫu', side: 'left' },
        { id: 'R6', label: 'R6 · Lớp HULA', desc: 'Phối hợp đa sản phẩm', side: 'right' },
        { id: 'R3', label: 'R3 · Lớp Mầm', desc: 'Nệm foam gấp 4 khúc & cất kệ', side: 'left' },
        { id: 'R4', label: 'R4 · Lớp Mây', desc: 'Túi ngủ tiêu chuẩn & nâng cao', side: 'right' },
        { id: 'R1', label: 'R1 · Lớp Lá', desc: 'Cotton Cara 6 màu & viền xám', side: 'left' },
        { id: 'R2', label: 'R2 · Lớp Nắng', desc: 'Bộ nệm Satin mềm mát', side: 'right' },
        { id: 'H0', label: 'H0 · Hành Lang', desc: 'Lối đi chung kết nối toàn trường', side: 'center' },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-label="Sơ đồ trường mầm non HULA"
        >
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-[#DDE5E1] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#DDE5E1]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#087F8C]/10 text-[#087F8C] flex items-center justify-center font-bold">
                            🗺️
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[#183B3A]">
                                Sơ Đồ Trường Mầm Non HULA
                            </h3>
                            <p className="text-xs text-[#566967]">
                                Chọn phòng để di chuyển trực tiếp đến cửa phòng
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#F6F8F5] text-[#566967] hover:text-[#183B3A] transition-all"
                        aria-label="Đóng sơ đồ trường học"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Quick Route Banner */}
                <div className="my-3 p-3.5 rounded-2xl bg-[#E0F0EA] border border-[#B7D9CC] space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#183B3A]">Tuyến khám phá nhanh (3 chặng chính):</span>
                        <span className="text-[11px] text-[#087F8C] font-semibold">Chỉ 3-5 phút</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleSelectRoom('R1')}
                            className={`py-2 px-2 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                                currentRoomId === 'R1'
                                    ? 'bg-[#183B3A] text-white shadow-xs'
                                    : 'bg-white text-[#183B3A] hover:bg-[#D4E8E1]'
                            }`}
                        >
                            1. R1 Cara
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectRoom('R6')}
                            className={`py-2 px-2 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                                currentRoomId === 'R6'
                                    ? 'bg-[#183B3A] text-white shadow-xs'
                                    : 'bg-white text-[#183B3A] hover:bg-[#D4E8E1]'
                            }`}
                        >
                            2. R6 Phối Hợp
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectRoom('R7')}
                            className={`py-2 px-2 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                                currentRoomId === 'R7'
                                    ? 'bg-[#183B3A] text-white shadow-xs'
                                    : 'bg-white text-[#183B3A] hover:bg-[#D4E8E1]'
                            }`}
                        >
                            3. R7 Bàn Giao
                        </button>
                    </div>
                </div>

                {/* Rooms Grid */}
                <div className="flex-1 overflow-y-auto py-2 space-y-2.5">
                    {roomEntries.map(room => {
                        const isCurrent = currentRoomId === room.id;
                        const isVisited = visitedRooms.has(room.id);

                        return (
                            <button
                                key={room.id}
                                type="button"
                                onClick={() => handleSelectRoom(room.id)}
                                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                                    isCurrent
                                        ? 'bg-[#183B3A] text-white border-[#183B3A] shadow-md ring-2 ring-[#087F8C]/30'
                                        : 'bg-[#F7F9F6] text-[#183B3A] border-[#DDE5E1] hover:bg-white hover:border-[#B7D9CC]'
                                }`}
                            >
                                <div className="flex flex-col min-w-0 pr-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm truncate">{room.label}</span>
                                        {isCurrent && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#087F8C] text-white uppercase tracking-wider">
                                                Đang ở đây
                                            </span>
                                        )}
                                        {!isCurrent && isVisited && (
                                            <span className="text-[10px] text-[#087F8C] font-semibold">
                                                ✓ Đã ghé
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-xs mt-0.5 truncate ${isCurrent ? 'text-white/80' : 'text-[#566967]'}`}>
                                        {room.desc}
                                    </span>
                                </div>

                                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                                    isCurrent ? 'bg-white/20 text-white' : 'bg-white text-[#183B3A] border border-[#DDE5E1]'
                                }`}>
                                    Đi đến →
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer notes */}
                <div className="pt-3 border-t border-[#DDE5E1] text-[11px] text-[#566967] text-center">
                    Góc nhìn thứ nhất (School POV) • Mọi phòng đều có lối quay lại hành lang
                </div>
            </div>
        </div>
    );
}
