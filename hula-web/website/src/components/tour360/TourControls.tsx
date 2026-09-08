/**
 * HULA 360 Tour - Floating Utility Controls (TourControls)
 * Provides recenter camera, reset checkpoint and helper tools.
 */

import React from 'react';
import { useTour } from './Tour360Provider';

export function TourControls() {
    const {
        recenterCamera,
        resetTour,
    } = useTour();

    return (
        <div className="absolute top-16 right-3 sm:right-6 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Recenter Camera Button */}
            <button
                type="button"
                onClick={recenterCamera}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white/90 hover:text-white border border-white/20 shadow-lg flex items-center justify-center transition-all backdrop-blur-md group"
                title="Về hướng nhìn chuẩn của bước"
                aria-label="Căn giữa góc nhìn"
            >
                <svg className="w-5 h-5 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
            </button>

            {/* Reset Tour Button */}
            <button
                type="button"
                onClick={resetTour}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white/90 hover:text-white border border-white/20 shadow-lg flex items-center justify-center transition-all backdrop-blur-md group"
                title="Đặt lại toàn bộ hành trình"
                aria-label="Bắt đầu lại"
            >
                <svg className="w-5 h-5 group-hover:-rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
    );
}
