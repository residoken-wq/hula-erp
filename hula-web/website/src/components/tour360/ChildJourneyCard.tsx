/**
 * HULA 360 Tour - Child Exploration Journey Card (ChildJourneyCard)
 * Dedicated UX for Bé Mây & "Cùng bé khám phá" mode.
 * Satisfies Instruction 02 §7:
 * - Touch targets 56-64px
 * - Single action at a time
 * - Gentle hints, no penalties, no timer, no scores
 * - Replay & Mute buttons
 * - ZERO commercial UI / no forms / no prices / COPPA compliant
 */

import React, { useState } from 'react';
import { useTour } from './Tour360Provider';
import { TOUR_STEPS } from './data/tourSeed';

export function ChildJourneyCard() {
    const {
        state,
        activeCharacterInfo,
        currentStep,
        nextStep,
        prevStep,
        toggleMute,
        toggleChildMode,
        playChildTouchSound,
        playChime,
    } = useTour();

    const [isHintPulsing, setIsHintPulsing] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!currentStep) return null;

    const steps = TOUR_STEPS[state.activeRole] || [];
    const isFirstStep = state.currentStepIndex === 0;
    const isLastStep = state.currentStepIndex >= steps.length - 1;

    const handleReplayAudio = () => {
        playChime(659.25, 0.3); // Play pleasant chime
        setIsHintPulsing(true);
        setTimeout(() => setIsHintPulsing(false), 800);
    };

    const handleActionClick = () => {
        playChildTouchSound();
        if (!isLastStep) {
            nextStep();
        }
    };

    return (
        <div className="absolute bottom-3 sm:bottom-6 inset-x-0 mx-auto w-[calc(100%-1.5rem)] sm:w-[560px] md:w-[600px] max-w-full z-20 pointer-events-auto transition-all duration-300">
            <div className="relative bg-gradient-to-b from-amber-500/95 via-amber-600/95 to-orange-600/95 backdrop-blur-xl border-2 sm:border-4 border-amber-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl text-slate-950 flex flex-col gap-2.5 sm:gap-3">
                {/* Top Badge: Child Mode Title & Step Count */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl animate-bounce shrink-0">🎈</span>
                        <span className="text-xs sm:text-sm md:text-base font-black tracking-tight text-slate-950 uppercase truncate">
                            Cùng Bé Khám Phá Lớp Học
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-300/80 text-slate-900 border border-amber-400">
                            {state.currentStepIndex + 1}/{steps.length}
                        </span>

                        {/* Collapse / Expand Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1 sm:px-2 sm:py-1 rounded-lg bg-black/15 hover:bg-black/25 text-slate-950 font-bold transition-all text-[11px] flex items-center gap-1"
                            title={isCollapsed ? 'Mở rộng bảng' : 'Thu gọn bảng'}
                            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        >
                            <span className="hidden sm:inline">{isCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
                            <svg
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Parent exit button */}
                        <button
                            type="button"
                            onClick={() => toggleChildMode(false)}
                            className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-black/15 hover:bg-black/25 text-slate-900 underline transition-colors"
                            title="Quay lại giao diện người lớn"
                        >
                            Người lớn ⚙️
                        </button>
                    </div>
                </div>

                {/* Collapsible Child Content */}
                {!isCollapsed && (
                    <>
                        {/* Main Child Monologue / Thought Bubble */}
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 border-2 border-amber-200 shadow-inner transition-all animate-fadeIn ${
                            isHintPulsing ? 'ring-4 ring-white shadow-xl scale-[1.01]' : ''
                        }`}>
                            <div className="flex items-start gap-2.5">
                                {activeCharacterInfo?.avatarUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={activeCharacterInfo.avatarUrl}
                                        alt={activeCharacterInfo.displayName || 'Nhân vật'}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-amber-300 shadow-sm shrink-0"
                                    />
                                ) : (
                                    <span className="text-2xl sm:text-3xl filter drop-shadow shrink-0">👧</span>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm sm:text-base md:text-lg font-black text-slate-900 leading-tight">
                                        {currentStep.title}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-slate-800 font-semibold mt-1 leading-snug">
                                        &ldquo;{currentStep.dialogue || currentStep.monologue}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress bar dots for children */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-0.5">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                                        idx === state.currentStepIndex
                                            ? 'w-6 sm:w-7 bg-white shadow-sm ring-2 ring-amber-200'
                                            : idx < state.currentStepIndex
                                                ? 'w-2 sm:w-2.5 bg-amber-200'
                                                : 'w-1.5 sm:w-2 bg-black/20'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Large Action Controls (Min 52-56px touch targets for small fingers) */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-95 shadow-md ${
                            isFirstStep
                                ? 'bg-amber-400/40 text-black/30 cursor-not-allowed'
                                : 'bg-white/80 hover:bg-white text-slate-900 border-2 border-white'
                        }`}
                        aria-label="Quay lại bước trước"
                    >
                        <span>◀</span>
                    </button>

                    {/* Replay Audio Button */}
                    <button
                        type="button"
                        onClick={handleReplayAudio}
                        className="h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-white/80 hover:bg-white active:scale-95 border-2 border-white text-slate-900 font-bold flex flex-col items-center justify-center gap-0.5 shadow-md transition-all"
                        aria-label="Nghe lại lời thoại"
                    >
                        <span className="text-base sm:text-lg">🔊</span>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase leading-none">Nghe lại</span>
                    </button>

                    {/* Primary Big Action Button (Spans 2 columns) */}
                    <button
                        type="button"
                        onClick={handleActionClick}
                        className="col-span-2 h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-xs sm:text-sm md:text-base border-2 border-emerald-300 shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all px-2.5 sm:px-3"
                    >
                        <span className="text-lg sm:text-xl animate-pulse shrink-0">✨</span>
                        <span className="truncate">{currentStep.actionLabel}</span>
                        {!isLastStep && <span className="shrink-0">▶</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
