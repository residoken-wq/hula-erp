/**
 * CampusTopHeader.tsx
 * Top Navigation Header for HULA School POV Experience:
 * - Desktop: 64px, Mobile: 56px
 * - Displays School Name & Room Identifier
 * - Role Switcher Pill (Cô An 1.55m, Mẹ Linh 1.60m, Bé Mây 0.95m)
 * - Interactive School Map button
 * - Clean Close button restoring parent page state
 */

'use client';

import React from 'react';
import { campusWorldState, ROLES, ROOMS, RoomId, RoleId } from '../engine/CampusWorldState';

interface CampusTopHeaderProps {
    onClose: () => void;
    activeRole: RoleId;
    currentRoomId: RoomId;
    onToggleMap: () => void;
    onToggleRoleSelector: () => void;
}

export function CampusTopHeader({
    onClose,
    activeRole,
    currentRoomId,
    onToggleMap,
    onToggleRoleSelector,
}: CampusTopHeaderProps) {
    const roleConfig = ROLES[activeRole] || ROLES['me-linh'];
    const currentRoom = ROOMS[currentRoomId] || ROOMS['R1'];

    return (
        <header className="relative z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-[#DDE5E1] px-3 sm:px-6 flex items-center justify-between shadow-xs select-none">
            {/* Left: School Name & Room Name */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#087F8C] flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm shrink-0">
                    360°
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-[#087F8C] truncate">
                            Trường Mầm Non HULA
                        </span>
                        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-[#9FB3A8]" />
                        <span className="hidden md:inline-block text-[11px] sm:text-xs text-[#566967] font-medium">
                            Góc Nhìn Thực Tế (POV)
                        </span>
                    </div>
                    <h1 className="text-sm sm:text-base font-bold text-[#183B3A] truncate">
                        {currentRoom.title}
                    </h1>
                </div>
            </div>

            {/* Right: Role Pill, Map Button & Close Button */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {/* Role Switcher Pill */}
                <button
                    type="button"
                    onClick={onToggleRoleSelector}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] rounded-xl bg-[#F6F8F5] hover:bg-[#EAEFEA] border border-[#DDE5E1] text-[#183B3A] transition-all text-xs sm:text-sm font-medium active:scale-95"
                    aria-label="Chọn góc nhìn nhân vật"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087F8C] shrink-0" />
                    <span className="font-semibold">{roleConfig.name}</span>
                    <span className="text-[11px] sm:text-xs text-[#566967] hidden sm:inline">
                        ({roleConfig.eyeHeight.toFixed(2)} m)
                    </span>
                    <svg className="w-3.5 h-3.5 text-[#566967]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Map Button */}
                <button
                    type="button"
                    onClick={onToggleMap}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[44px] rounded-xl bg-white hover:bg-[#F6F8F5] border border-[#DDE5E1] text-[#183B3A] transition-all text-xs sm:text-sm font-medium shadow-xs active:scale-95"
                    aria-label="Mở sơ đồ trường học"
                >
                    <svg className="w-4 h-4 text-[#087F8C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="hidden sm:inline font-semibold">Bản Đồ Trường</span>
                </button>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#F6F8F5] border border-[#DDE5E1] flex items-center justify-center text-[#566967] hover:text-[#183B3A] transition-all active:scale-95 shadow-xs"
                    aria-label="Thoát khỏi trường học 3D"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
