/**
 * HULA 360 Tour - Adult Journey Card (JourneyCard)
 * Standard task execution card for Cô An & Mẹ Linh.
 * Desktop: bottom centered card (max 560px) | Mobile: bottom sheet.
 */

import React from 'react';
import { useTour } from './Tour360Provider';
import { TOUR_STEPS } from './data/tourSeed';

export function JourneyCard() {
    const {
        state,
        currentStep,
        nextStep,
        prevStep,
        selectStep,
    } = useTour();

    if (!currentStep) return null;

    const steps = TOUR_STEPS[state.activeRole] || [];
    const isFirstStep = state.currentStepIndex === 0;
    const isLastStep = state.currentStepIndex >= steps.length - 1;

    return (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[560px] z-20 pointer-events-auto">
            <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl text-white flex flex-col gap-3">
                {/* Header: Step Index & Checkpoint Label */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            Bước {state.currentStepIndex + 1} / {steps.length}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[240px] sm:max-w-[320px]">
                            {currentStep.title}
                        </h4>
                    </div>

                    {currentStep.checkpointLabel && (
                        <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10">
                            ⏱️ {currentStep.checkpointLabel}
                        </span>
                    )}
                </div>

                {/* Monologue / Dialogue Thought Bubble */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-200 space-y-1.5">
                    {/* Inner Thought */}
                    <div className="italic text-slate-300 leading-relaxed">
                        &ldquo;{currentStep.monologue}&rdquo;
                    </div>

                    {/* Spoken Dialogue (if present) */}
                    {currentStep.dialogue && (
                        <div className="pt-1 border-t border-white/5 flex items-start gap-2 text-cyan-200 font-medium">
                            <span className="text-xs">💬</span>
                            <span className="leading-snug">&ldquo;{currentStep.dialogue}&rdquo;</span>
                        </div>
                    )}
                </div>

                {/* Steps Mini Timeline Dots */}
                <div className="flex items-center gap-1.5 px-1 overflow-x-auto">
                    {steps.map((s, idx) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => selectStep(idx)}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                idx === state.currentStepIndex
                                    ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50 scale-y-125'
                                    : idx < state.currentStepIndex
                                        ? 'bg-cyan-700/80 hover:bg-cyan-600'
                                        : 'bg-white/20 hover:bg-white/30'
                            }`}
                            title={`Chuyển tới ${s.title}`}
                            aria-label={`Bước ${idx + 1}: ${s.title}`}
                        />
                    ))}
                </div>

                {/* Bottom Controls: Prev, Next / Action */}
                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                            isFirstStep
                                ? 'border-white/5 text-white/20 cursor-not-allowed bg-transparent'
                                : 'border-white/15 bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        aria-label="Bước trước"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Trước</span>
                    </button>

                    <button
                        type="button"
                        onClick={nextStep}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                            isLastStep
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-300/40 shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white border border-cyan-400/40 shadow-cyan-500/20'
                        }`}
                    >
                        <span>{currentStep.actionLabel}</span>
                        {!isLastStep && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
