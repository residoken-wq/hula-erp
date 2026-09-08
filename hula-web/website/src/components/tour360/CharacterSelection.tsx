/**
 * HULA 360 Tour - Role Selection Modal (CharacterSelection)
 * Provides 2 role switching mechanisms (Instruction 02 §4):
 * 1. "Xem cùng thời điểm" (Same-moment perspective switch)
 * 2. "Bắt đầu hành trình của vai khác" (Replay from beginning / resume)
 */

import React from 'react';
import { useTour } from './Tour360Provider';
import { RoleId } from './types';
import { CHARACTERS, TIMELINE_EVENTS } from './data/tourSeed';

interface CharacterSelectionProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CharacterSelection({ isOpen, onClose }: CharacterSelectionProps) {
    const {
        state,
        currentTimelineEvent,
        switchRoleSameMoment,
        startRoleJourney,
    } = useTour();

    if (!isOpen) return null;

    const roles: RoleId[] = ['CHAR-AN', 'CHAR-LINH', 'CHAR-MAY'];

    const handleSelectRoleSameMoment = (roleId: RoleId) => {
        switchRoleSameMoment(roleId);
        onClose();
    };

    const handleSelectRoleFromBeginning = (roleId: RoleId) => {
        startRoleJourney(roleId, true);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-selection-title"
        >
            <div className="relative w-full max-w-3xl bg-slate-900/95 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2">
                    <div className="min-w-0">
                        <h2 id="role-selection-title" className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 truncate">
                            <span>🎭</span>
                            <span>Chọn Góc Nhìn Trải Nghiệm</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-0.5 truncate">
                            Trải nghiệm lớp học qua mắt Cô giáo, Phụ huynh hoặc Bé nhỏ
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center justify-center"
                        aria-label="Đóng bảng chọn vai"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Event info context banner */}
                {currentTimelineEvent && (
                    <div className="mt-3 px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
                        <span>
                            Thời điểm hiện tại: <strong>{currentTimelineEvent.name}</strong> ({currentTimelineEvent.label})
                        </span>
                        <span className="text-[11px] text-cyan-300/80">
                            Nhân vật có mặt: {currentTimelineEvent.presentRoles.map(r => CHARACTERS[r]?.displayName).join(', ')}
                        </span>
                    </div>
                )}

                {/* Character Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 overflow-y-auto pr-1 pb-2">
                    {roles.map(roleId => {
                        const char = CHARACTERS[roleId];
                        const isCurrentActive = state.activeRole === roleId;
                        const isPresentInCurrentEvent = currentTimelineEvent?.presentRoles.includes(roleId);

                        return (
                            <div
                                key={roleId}
                                className={`flex flex-col rounded-2xl p-4 transition-all border ${
                                    isCurrentActive
                                        ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                                }`}
                            >
                                {/* Role Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shadow-inner border border-white/10">
                                        {char.avatar}
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-base text-white flex items-center gap-1.5">
                                            <span>{char.displayName}</span>
                                            {isCurrentActive && (
                                                <span className="text-[10px] bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                                                    ĐANG XEM
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium">{char.roleTitle}</div>
                                    </div>
                                </div>

                                {/* Specs Pill */}
                                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/5">
                                        👁️ Tầm mắt: <strong>{char.cameraHeight}m</strong>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/5">
                                        👕 {char.armStyle.cuffDescription.split(',')[0]}
                                    </span>
                                </div>

                                {/* Intro / Quote */}
                                <p className="text-xs text-slate-300/90 mt-3 leading-relaxed flex-1 italic">
                                    &ldquo;{char.quote}&rdquo;
                                </p>

                                {/* Action Buttons */}
                                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                    {/* Nút 1: Xem cùng thời điểm (nếu có mặt trong mốc này) */}
                                    {isPresentInCurrentEvent && !isCurrentActive ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSelectRoleSameMoment(roleId)}
                                            className="w-full h-10 sm:h-11 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <span>👁️ Xem tại mốc này</span>
                                        </button>
                                    ) : null}

                                    {/* Nút 2: Bắt đầu / Tiếp tục hành trình */}
                                    <button
                                        type="button"
                                        onClick={() => handleSelectRoleFromBeginning(roleId)}
                                        className={`w-full h-10 sm:h-11 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                                            isCurrentActive
                                                ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                                                : isPresentInCurrentEvent
                                                    ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                                                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-md'
                                        }`}
                                    >
                                        <span>
                                            {isCurrentActive
                                                ? '🔄 Xem lại từ đầu'
                                                : isPresentInCurrentEvent
                                                    ? 'Bắt đầu từ cảnh 1'
                                                    : '🚀 Bắt đầu hành trình'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
