/**
 * HULA 360 Tour - Unified Inspector (TourInspector)
 * Replaces the 3 fragmented sub-modals (Hotspot Detail, Action Detail, Material Inspector).
 * Desktop: Side Drawer (380px) | Mobile: Bottom Sheet (max 65vh).
 * Accessible, Escape key handled, clean verified content.
 */

import React, { useEffect, useRef } from 'react';
import { useTour } from './Tour360Provider';

export function TourInspector() {
    const { state, closeInspector } = useTour();
    const panelRef = useRef<HTMLDivElement>(null);

    // Focus trap & Escape key
    useEffect(() => {
        if (!state.isInspectorOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeInspector();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        panelRef.current?.focus();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [state.isInspectorOpen, closeInspector]);

    if (!state.isInspectorOpen || !state.inspectorContent) {
        return null;
    }

    const content = state.inspectorContent;

    return (
        <div
            className="fixed inset-0 z-40 flex items-end sm:items-stretch justify-end pointer-events-auto bg-black/40 backdrop-blur-[2px] sm:bg-transparent"
            onClick={closeInspector}
        >
            <div
                ref={panelRef}
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
                className="w-full sm:w-[420px] max-h-[85vh] sm:max-h-full sm:h-full bg-slate-900/95 sm:bg-slate-900/90 backdrop-blur-xl border-t sm:border-t-0 sm:border-l border-white/20 shadow-2xl rounded-t-3xl sm:rounded-none flex flex-col text-white overflow-hidden animate-slideUp sm:animate-slideLeft outline-none"
                role="dialog"
                aria-modal="true"
                aria-labelledby="inspector-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        {content.badge && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                {content.badge}
                            </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">Chi tiết chiết xuất</span>
                    </div>
                    <button
                        type="button"
                        onClick={closeInspector}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center justify-center"
                        aria-label="Đóng bảng thông tin"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* Image Preview if available */}
                    {content.imageUrl && (
                        <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-lg aspect-video bg-black/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={content.imageUrl}
                                alt={content.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                    )}

                    {/* Title & Subtitle */}
                    <div>
                        <h3 id="inspector-title" className="text-lg sm:text-xl font-black text-white leading-snug">
                            {content.title}
                        </h3>
                        {content.subtitle && (
                            <p className="text-xs text-cyan-300 font-medium mt-0.5">
                                {content.subtitle}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    {content.description && (
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {content.description}
                        </p>
                    )}

                    {/* Specs Table */}
                    {content.specs && content.specs.length > 0 && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 space-y-2">
                            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                                Thông Số Quy Cách
                            </div>
                            <div className="divide-y divide-white/5 text-xs">
                                {content.specs.map((item, idx) => (
                                    <div key={idx} className="py-1.5 flex justify-between gap-3">
                                        <span className="text-slate-400 font-medium">{item.label}:</span>
                                        <span className="text-white font-semibold text-right">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notice for unverified / pending data (Instruction 03 §8) */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2">
                        <span className="text-sm">ℹ️</span>
                        <div className="leading-relaxed">
                            {content.notice || 'Quy cách sản phẩm minh họa cho demo. Hướng dẫn chăm sóc và chứng nhận chính thức đang chờ xưởng xác nhận theo từng mã SKU.'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <button
                        type="button"
                        onClick={closeInspector}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                        <span>Quay lại Khám Phá</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
