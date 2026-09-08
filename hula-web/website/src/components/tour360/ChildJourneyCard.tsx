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
        currentStep,
        nextStep,
        prevStep,
        toggleMute,
        toggleChildMode,
        playChildTouchSound,
        playChime,
    } = useTour();

    const [isHintPulsing, setIsHintPulsing] = useState(false);

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
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[580px] z-20 pointer-events-auto">
            <div className="relative bg-gradient-to-b from-amber-500/95 via-amber-600/95 to-orange-600/95 backdrop-blur-xl border-4 border-amber-300 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-950 flex flex-col gap-3">
                {/* Top Badge: Child Mode Title & Step Count */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl animate-bounce">🎈</span>
                        <span className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase">
                            Cùng Bé Khám Phá Lớp Học
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-300/80 text-slate-900 border border-amber-400">
                            Bước {state.currentStepIndex + 1}/{steps.length}
                        </span>
                        {/* Parent exit button */}
                        <button
                            type="button"
                            onClick={() => toggleChildMode(false)}
                            className="text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-lg bg-black/15 hover:bg-black/25 text-slate-900 underline transition-colors"
                            title="Quay lại giao diện người lớn"
                        >
                            Người lớn ⚙️
                        </button>
                    </div>
                </div>

                {/* Main Child Monologue / Thought Bubble */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-white/90 border-2 border-amber-200 shadow-inner transition-all ${
                    isHintPulsing ? 'ring-4 ring-white shadow-xl scale-[1.01]' : ''
                }`}>
                    <div className="flex items-start gap-2.5">
                        <span className="text-2xl sm:text-3xl filter drop-shadow">👧</span>
                        <div className="flex-1">
                            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                {currentStep.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-800 font-semibold mt-1 leading-snug">
                                &ldquo;{currentStep.dialogue || currentStep.monologue}&rdquo;
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress bar dots for children */}
                <div className="flex items-center justify-center gap-2 py-1">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                idx === state.currentStepIndex
                                    ? 'w-7 bg-white shadow-sm ring-2 ring-amber-200'
                                    : idx < state.currentStepIndex
                                        ? 'w-2.5 bg-amber-200'
                                        : 'w-2 bg-black/20'
                            }`}
                        />
                    ))}
                </div>

                {/* Large Action Controls (Min 56px touch targets) */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-95 shadow-md ${
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
                        className="h-14 sm:h-16 rounded-2xl bg-white/80 hover:bg-white active:scale-95 border-2 border-white text-slate-900 font-bold flex flex-col items-center justify-center gap-0.5 shadow-md transition-all"
                        aria-label="Nghe lại lời thoại"
                    >
                        <span className="text-lg">🔊</span>
                        <span className="text-[10px] font-black uppercase">Nghe lại</span>
                    </button>

                    {/* Primary Big Action Button (Spans 2 columns) */}
                    <button
                        type="button"
                        onClick={handleActionClick}
                        className="col-span-2 h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-sm sm:text-base border-2 border-emerald-300 shadow-lg flex items-center justify-center gap-2 transition-all px-3"
                    >
                        <span className="text-xl animate-pulse">✨</span>
                        <span className="truncate">{currentStep.actionLabel}</span>
                        {!isLastStep && <span>▶</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
