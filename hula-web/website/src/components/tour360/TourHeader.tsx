/**
 * HULA 360 Tour - Header Bar (TourHeader)
 * Displays role badge, audio mute toggle, child mode switch, and close button.
 * Responsive design: compact on mobile (<768px), full on desktop.
 */

import React, { useState } from 'react';
import { useTour } from './Tour360Provider';
import { RoleId } from './types';
import { CHARACTERS } from './data/tourSeed';

interface TourHeaderProps {
    onClose: () => void;
    onOpenRoleSelector: () => void;
}

export function TourHeader({ onClose, onOpenRoleSelector }: TourHeaderProps) {
    const {
        state,
        currentStep,
        activeCharacterInfo,
        currentTimelineEvent,
        toggleMute,
        toggleChildMode,
        openInspector,
    } = useTour();

    const hasAudio = Boolean(currentStep?.audioUrl);

    const handleOpenHelp = () => {
        openInspector({
            type: 'hotspot',
            title: 'Hướng Dẫn Trải Nghiệm Lớp Học 360°',
            subtitle: 'Phím tắt và tương tác cử chỉ',
            badge: 'Trợ giúp',
            description: 'Khám phá không gian thực tế ảo lớp học mầm non HULA qua góc nhìn thứ nhất (POV). Kéo rê chuột hoặc vuốt màn hình để xoay camera 360 độ. Bấm vào các điểm tương tác ✦ để xem chi tiết vật dụng và quy trình.',
            specs: [
                { label: 'Xoay góc nhìn', value: 'Kéo chuột trái hoặc vuốt trên màn hình' },
                { label: 'Đổi góc nhìn vai', value: 'Bấm vào thẻ tên nhân vật góc trên bên trái' },
                { label: 'Đóng cửa sổ / Thoát', value: 'Phím Escape hoặc nút X góc trên bên phải' },
                { label: 'Phóng to / Thu nhỏ', value: 'Con lăn chuột hoặc nút +/- trên thanh điều khiển' },
            ],
        });
    };

    return (
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 pt-[max(0.5rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/85 via-black/50 to-transparent pointer-events-auto backdrop-blur-[2px] gap-2">
            {/* Left: Role Info & Selector Button */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onOpenRoleSelector}
                    className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/20 shadow-lg group max-w-[220px] xs:max-w-xs sm:max-w-none"
                    title={`Góc nhìn: ${activeCharacterInfo.displayName} - Bấm để đổi vai`}
                    aria-label="Chọn góc nhìn nhân vật"
                >
                    {activeCharacterInfo.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={activeCharacterInfo.avatarUrl}
                            alt={activeCharacterInfo.displayName}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/40 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                        />
                    ) : (
                        <span className="text-xl sm:text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform shrink-0">
                            {activeCharacterInfo.avatar}
                        </span>
                    )}
                    <div className="text-left min-w-0">
                        <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 leading-tight">
                            <span className="truncate">{activeCharacterInfo.displayName}</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-white/70 leading-tight hidden xs:block truncate">
                            {activeCharacterInfo.roleTitle}
                        </div>
                    </div>
                    {/* Switch icon */}
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover:text-white transition-colors ml-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </button>

                {/* Event milestone pill (Desktop only) */}
                {currentTimelineEvent && (
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-white/80 text-xs shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-medium text-white">{currentTimelineEvent.name}</span>
                        <span className="text-white/50 text-[11px]">({currentTimelineEvent.label})</span>
                    </div>
                )}
            </div>

            {/* Right: Mode switches, Help, Audio & Close */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Child Mode Toggle Button */}
                <button
                    type="button"
                    onClick={() => toggleChildMode()}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${
                        state.isChildMode
                            ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-amber-500/20'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    }`}
                    title={state.isChildMode ? 'Chuyển về giao diện tiêu chuẩn' : 'Chuyển sang chế độ Cùng bé khám phá'}
                    aria-label="Chế độ trẻ em"
                >
                    <span className="text-sm">🎈</span>
                    <span className="hidden sm:inline">
                        {state.isChildMode ? 'Chế độ Trẻ Em' : 'Cùng Bé'}
                    </span>
                </button>

                {/* Help Guide Button */}
                <button
                    type="button"
                    onClick={handleOpenHelp}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/20 flex items-center justify-center shadow-md text-xs font-bold"
                    title="Hướng dẫn sử dụng & phím tắt"
                    aria-label="Trợ giúp"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Mute Audio Button: only shown if audio exists */}
                {hasAudio && (
                    <button
                        type="button"
                        onClick={toggleMute}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/20 flex items-center justify-center shadow-md"
                        title={state.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                        aria-label={state.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    >
                        {state.isMuted ? (
                            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-red-500/80 active:scale-95 transition-all text-white border border-white/20 flex items-center justify-center shadow-md group"
                    title="Đóng trải nghiệm (Phím Escape)"
                    aria-label="Đóng trải nghiệm 360"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
