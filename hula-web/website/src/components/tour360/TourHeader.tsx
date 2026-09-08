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
        activeCharacterInfo,
        currentTimelineEvent,
        toggleMute,
        toggleChildMode,
    } = useTour();

    return (
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-auto backdrop-blur-[2px]">
            {/* Left: Role Info & Selector Button */}
            <div className="flex items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onOpenRoleSelector}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/20 shadow-lg group"
                    title="Bấm để đổi góc nhìn nhân vật khác"
                    aria-label="Chọn góc nhìn nhân vật"
                >
                    <span className="text-xl sm:text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                        {activeCharacterInfo.avatar}
                    </span>
                    <div className="text-left">
                        <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 leading-tight">
                            <span>{activeCharacterInfo.displayName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 font-medium">
                                {activeCharacterInfo.cameraHeight}m
                            </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-white/70 leading-tight">
                            {activeCharacterInfo.roleTitle}
                        </div>
                    </div>
                    {/* Switch icon */}
                    <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </button>

                {/* Event milestone pill (Desktop only) */}
                {currentTimelineEvent && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-white/80 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-medium text-white">{currentTimelineEvent.name}</span>
                        <span className="text-white/50 text-[11px]">({currentTimelineEvent.label})</span>
                    </div>
                )}
            </div>

            {/* Right: Mode switches, Audio & Close */}
            <div className="flex items-center gap-2 sm:gap-3">
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

                {/* Mute Audio Button */}
                <button
                    type="button"
                    onClick={toggleMute}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/20 flex items-center justify-center shadow-md"
                    title={state.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    aria-label={state.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                    {state.isMuted ? (
                        // Muted Icon
                        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        // Unmuted Sound Wave Icon
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    )}
                </button>

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
