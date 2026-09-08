/**
 * HULA 360 Tour - Adult Journey Card (JourneyCard)
 * Satisfies:
 * - Prompt 03: 3-phase handover state machine (ready -> transferring -> received) with replay & anti-spam.
 * - Prompt 04: Compact UI (desktop height <= 112px), 1-line title, 1-line hint, CTA >= 48px,
 *   and "Chi tiết" toggle opening detailed dialogue sheet (max 45vh on mobile) without blocking center action.
 */

import React, { useState, useEffect } from 'react';
import { useTour } from './Tour360Provider';
import { TOUR_STEPS } from './data/tourSeed';

export function JourneyCard() {
    const {
        state,
        currentStep,
        nextStep,
        prevStep,
        selectStep,
        startHandover,
        resetHandover,
    } = useTour();

    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Close detail drawer on Escape key (before closing whole tour)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDetailOpen) {
                e.stopPropagation();
                setIsDetailOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isDetailOpen]);

    if (!currentStep) return null;

    const steps = TOUR_STEPS[state.activeRole] || [];
    const isFirstStep = state.currentStepIndex === 0;
    const isLastStep = state.currentStepIndex >= steps.length - 1;

    // Detect if current step is the Handover step (PH-05 in CHAR-LINH POV, or CA-06 in CHAR-AN POV)
    const isHandoverStep = (currentStep.id === 'PH-05' && state.activeRole === 'CHAR-LINH')
        || (currentStep.id === 'CA-06' && state.activeRole === 'CHAR-AN');
    const isTeacher = state.activeRole === 'CHAR-AN';

    // Step summary text
    const getHintText = () => {
        if (isHandoverStep) {
            switch (state.handoverPhase) {
                case 'ready':
                    return isTeacher
                        ? 'Túi quai xách nhãn "Mây — Lớp Mầm" đang trên tay cô An. Bấm "Trao túi" để bàn giao cho mẹ Linh.'
                        : 'Cô An đang giữ túi quai xách nhãn "Mây — Lớp Mầm". Bấm "Nhận túi" để thực hiện bàn giao.';
                case 'transferring':
                    return isTeacher
                        ? 'Đang trao túi nệm sang mẹ Linh... (Kiểm tra nhãn tên "Mây — Lớp Mầm")'
                        : 'Đang nhận túi từ cô An... (Hai bên hoàn tất kiểm tra đồ cá nhân)';
                case 'received':
                    return isTeacher
                        ? 'Đã bàn giao túi nệm sang mẹ Linh thành công.'
                        : 'Đã nhận túi quai xách an toàn vào tay mẹ Linh. Đồ dùng cá nhân đầy đủ.';
            }
        }
        return currentStep.dialogue
            ? `💬 "${currentStep.dialogue}"`
            : `💭 "${currentStep.monologue}"`;
    };

    return (
        <>
            {/* Detail Dialogue / Monologue Sheet / Panel */}
            {isDetailOpen && (
                <div
                    className="fixed inset-0 z-30 flex items-end sm:items-center sm:justify-end p-0 sm:p-6 bg-black/50 backdrop-blur-[2px] pointer-events-auto"
                    onClick={() => setIsDetailOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="w-full sm:w-[380px] max-h-[45vh] sm:max-h-[80vh] bg-slate-900/95 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl text-white flex flex-col overflow-hidden animate-slideUp sm:animate-slideLeft"
                        role="dialog"
                        aria-label="Chi tiết kịch bản & lời thoại"
                    >
                        {/* Mobile handle */}
                        <div className="sm:hidden -mt-1 mb-2 flex justify-center">
                            <div className="w-10 h-1 rounded-full bg-white/25" />
                        </div>

                        {/* Sheet Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                    Bước {state.currentStepIndex + 1}/{steps.length}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold truncate">
                                    {currentStep.title}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDetailOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs shrink-0"
                                aria-label="Đóng bảng chi tiết"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sheet Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs sm:text-sm text-slate-200">
                            {/* Inner monologue */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                                    Suy nghĩ nội tâm
                                </div>
                                <div className="italic text-slate-300 leading-relaxed">
                                    &ldquo;{currentStep.monologue}&rdquo;
                                </div>
                            </div>

                            {/* Spoken dialogue */}
                            {currentStep.dialogue && (
                                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1">
                                        <span>💬 Lời thoại trực tiếp</span>
                                    </div>
                                    <div className="text-white font-medium leading-relaxed">
                                        &ldquo;{currentStep.dialogue}&rdquo;
                                    </div>
                                </div>
                            )}

                            {/* Step Timeline Dots */}
                            <div className="pt-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Tiến trình hành trình
                                </div>
                                <div className="flex items-center gap-1.5 py-1">
                                    {steps.map((s, idx) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                selectStep(idx);
                                                setIsDetailOpen(false);
                                            }}
                                            className="flex-1 py-1 group cursor-pointer focus:outline-none"
                                            title={`Chuyển tới bước ${idx + 1}: ${s.title}`}
                                        >
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    idx === state.currentStepIndex
                                                        ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50 scale-y-125'
                                                        : idx < state.currentStepIndex
                                                            ? 'bg-cyan-700/80 group-hover:bg-cyan-600'
                                                            : 'bg-white/20 group-hover:bg-white/30'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Main Card (Desktop max height <= 112px) */}
            <div className="absolute bottom-2.5 sm:bottom-5 inset-x-0 mx-auto w-[calc(100%-1.25rem)] sm:w-[620px] lg:w-[740px] max-w-full z-20 pointer-events-auto">
                <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:py-3 sm:px-4.5 shadow-2xl text-white ring-1 ring-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 sm:gap-3">
                    {/* Left: Info area (1-line title, 1-line hint, detail button) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        {/* Step tag + Title + Checkpoint */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                Bước {state.currentStepIndex + 1}/{steps.length}
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                                {currentStep.title}
                            </h4>
                            {currentStep.checkpointLabel && (
                                <span className="hidden xs:inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/70 shrink-0">
                                    ⏱️ {currentStep.checkpointLabel}
                                </span>
                            )}
                        </div>

                        {/* 1-line Hint + "Chi tiết" toggle */}
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-300 min-w-0">
                            <span className="truncate flex-1 text-slate-300/90">
                                {getHintText()}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsDetailOpen(true)}
                                className="shrink-0 inline-flex items-center gap-0.5 text-cyan-300 hover:text-cyan-200 font-bold hover:underline active:scale-95 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                title="Xem đầy đủ lời thoại và suy nghĩ nhân vật"
                                aria-label="Mở chi tiết kịch bản"
                            >
                                <span>Chi tiết</span>
                                <span className="text-[10px]">📖</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Controls & CTAs (Touch target >= 48px on mobile) */}
                    <div className="flex items-center gap-2 shrink-0 pt-0.5 lg:pt-0">
                        {/* Prev Button */}
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={isFirstStep}
                            className={`h-11 sm:h-12 px-3 sm:px-3.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                                isFirstStep
                                    ? 'border-white/5 text-white/20 cursor-not-allowed bg-transparent'
                                    : 'border-white/15 bg-white/10 hover:bg-white/20 text-white'
                            }`}
                            aria-label="Bước trước"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="hidden sm:inline">Trước</span>
                        </button>

                        {/* Handover Specific CTA (Prompt 03 & Prompt 05) */}
                        {isHandoverStep ? (
                            state.handoverPhase === 'ready' ? (
                                <button
                                    type="button"
                                    onClick={startHandover}
                                    className="flex-1 lg:flex-initial h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-400/40 shadow-cyan-500/25"
                                >
                                    <span>{isTeacher ? 'Trao túi cho mẹ Linh' : 'Nhận túi từ cô An'}</span>
                                    <span>▶</span>
                                </button>
                            ) : state.handoverPhase === 'transferring' ? (
                                <button
                                    type="button"
                                    disabled
                                    className="flex-1 lg:flex-initial h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold bg-white/15 text-white/70 border border-white/20 flex items-center justify-center gap-2 cursor-wait"
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                                    <span>{isTeacher ? 'Đang trao túi...' : 'Đang nhận túi...'}</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 flex-1 lg:flex-initial">
                                    {/* Replay Handover Button */}
                                    <button
                                        type="button"
                                        onClick={resetHandover}
                                        className="h-11 sm:h-12 px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white/90 font-bold transition-all flex items-center gap-1"
                                        title="Làm lại thao tác bàn giao"
                                        aria-label="Làm lại thao tác"
                                    >
                                        <span>Làm lại</span>
                                        <span>🔄</span>
                                    </button>

                                    {/* Complete Step Button */}
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-1 h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-300/40 shadow-emerald-500/25"
                                    >
                                        <span>{isTeacher ? 'Hoàn tất bàn giao' : 'Hoàn tất hành trình'}</span>
                                        <span>✓</span>
                                    </button>
                                </div>
                            )
                        ) : (
                            /* Standard Step CTA */
                            <button
                                type="button"
                                onClick={nextStep}
                                className={`flex-1 lg:flex-initial h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                                    isLastStep
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-300/40 shadow-emerald-500/20'
                                        : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white border border-cyan-400/40 shadow-cyan-500/20'
                                }`}
                            >
                                <span className="truncate">{currentStep.actionLabel}</span>
                                {!isLastStep && (
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
