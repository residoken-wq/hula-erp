/**
 * HULA 360 Product Showroom - Header Component
 * Implements strict design tokens from design/desktop.svg & design/mobile.svg:
 * - Desktop height: 72px, Mobile height: 56px
 * - Background: #FFFFFF with #DDE5E1 border
 * - Logo HULA (#087F8C) + Title "Phối màu lớp học" (#183B3A)
 * - 48px min touch target for Help and Close buttons
 * - Roleplay journey switcher to preserve previous work
 */

import React from 'react';

interface ShowroomHeaderProps {
    onClose: () => void;
    onOpenHelp: () => void;
    onSwitchToRoleplay?: () => void;
}

export function ShowroomHeader({
    onClose,
    onOpenHelp,
    onSwitchToRoleplay,
}: ShowroomHeaderProps) {
    return (
        <header
            className="w-full h-14 lg:h-[72px] bg-white border-b border-[#DDE5E1] px-4 sm:px-6 lg:px-7 flex items-center justify-between z-30 shrink-0 select-none"
            role="banner"
        >
            {/* Left: Branding & Feature Title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <span className="text-xl sm:text-2xl lg:text-[27px] font-bold text-[#087F8C] tracking-tight shrink-0">
                    HULA
                </span>
                <div className="h-6 sm:h-7 w-[1px] bg-[#DDE5E1] shrink-0" aria-hidden="true" />
                <h1 className="text-sm sm:text-base lg:text-[20px] font-semibold text-[#183B3A] truncate">
                    Phối màu lớp học
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Optional switch to role-play story */}
                {onSwitchToRoleplay && (
                    <button
                        type="button"
                        onClick={onSwitchToRoleplay}
                        className="hidden md:flex items-center gap-1.5 h-10 lg:h-12 px-3.5 rounded-xl bg-[#F7F8F5] hover:bg-[#EBECE7] active:scale-95 text-[#183B3A] text-xs lg:text-sm font-medium border border-[#DDE5E1] transition-all"
                        title="Chuyển sang trải nghiệm theo góc nhìn vai diễn"
                    >
                        <span>🎭</span>
                        <span>Trải nghiệm theo vai</span>
                    </button>
                )}

                {/* Help Button */}
                <button
                    type="button"
                    onClick={onOpenHelp}
                    className="h-10 sm:h-11 lg:h-12 px-3 sm:px-4 rounded-xl bg-white hover:bg-[#F7F8F5] active:scale-95 text-[#183B3A] text-xs sm:text-sm lg:text-base font-normal border border-[#DDE5E1] transition-all flex items-center justify-center shadow-xs"
                    aria-label="Hướng dẫn sử dụng"
                >
                    <span className="hidden sm:inline">Trợ giúp</span>
                    <span className="sm:hidden font-bold">?</span>
                </button>

                {/* Close Button (min 48px touch target) */}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-10 sm:w-11 lg:w-14 h-10 sm:h-11 lg:h-12 rounded-xl bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:scale-95 text-[#183B3A] text-xl sm:text-2xl lg:text-[25px] font-light border border-[#DDE5E1] transition-all flex items-center justify-center shadow-xs"
                    title="Đóng cửa sổ (Phím Escape)"
                    aria-label="Đóng phối màu lớp học"
                >
                    ×
                </button>
            </div>
        </header>
    );
}
