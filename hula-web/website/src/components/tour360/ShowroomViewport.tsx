/**
 * HULA 360 Product Showroom - Viewport Component
 * Clean, unoccupied classroom scene viewport:
 * - Absolutely ZERO people: no teachers, parents, sleeping kids, or cartoon arms
 * - Renders 3 clean camera angles: "Tổng thể" (Overview), "Cận sản phẩm" (Close-up), "Góc cất đồ" (Storage)
 * - 3-angle bottom bar (height 64px desktop / 48px mobile)
 * - Dynamic product badge ("Cotton Cara · [Color]")
 * - Transparent asset pipeline notice
 * - Bounded 2D perspective panning
 */

import React, { useRef, useState, useCallback } from 'react';
import { ShowroomAngle, SHOWROOM_ANGLES } from './data/showroomConfig';
import { ShowroomAngleId } from './hooks/useShowroomColorState';

interface ShowroomViewportProps {
    currentAngle: ShowroomAngle;
    activeColorLabel: string;
    onSelectAngle: (angleId: ShowroomAngleId) => void;
    pipelineNotice?: string | null;
    onDismissNotice?: () => void;
}

export function ShowroomViewport({
    currentAngle,
    activeColorLabel,
    onSelectAngle,
    pipelineNotice,
    onDismissNotice,
}: ShowroomViewportProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    // Pointer events for gentle 2D perspective panning
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging || !dragStart) return;
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        // Bounded subtle pan (max ±40px horizontally, ±20px vertically)
        setPanOffset(prev => ({
            x: Math.max(-40, Math.min(40, prev.x + deltaX * 0.2)),
            y: Math.max(-20, Math.min(20, prev.y + deltaY * 0.15)),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, dragStart]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            setDragStart(null);
            try {
                (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            } catch {}
        }
    }, [isDragging]);

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full select-none p-3 sm:p-4 lg:p-6 pb-2 lg:pb-4">
            {/* Main Scene Frame */}
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative flex-1 w-full min-h-[220px] sm:min-h-[300px] lg:min-h-[420px] rounded-2xl lg:rounded-3xl overflow-hidden bg-slate-900 border border-[#DDE5E1] shadow-sm cursor-grab active:cursor-grabbing touch-none"
                role="region"
                aria-label={`Khung cảnh ${currentAngle.label}`}
            >
                {/* Scene Image with gentle parallax pan */}
                <div
                    className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
                    style={{
                        backgroundImage: `url(${currentAngle.imageUrl})`,
                        backgroundPosition: `calc(50% + ${panOffset.x}px) calc(50% + ${panOffset.y}px)`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                />

                {/* Subtle Lighting Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 pointer-events-none" />

                {/* Top-Left: Active Product & Color Badge */}
                <div className="absolute top-3 sm:top-5 left-3 sm:left-5 z-10 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#DDE5E1] shadow-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#087F8C] animate-pulse" />
                        <span className="text-xs sm:text-sm font-medium text-[#183B3A]">
                            <span className="hidden sm:inline">Cotton Cara · </span>
                            <span className="sm:hidden">Cara · </span>
                            <span className="font-semibold text-[#087F8C]">{activeColorLabel}</span>
                        </span>
                    </div>
                </div>

                {/* Top-Right: Subtle 2D Pan Hint */}
                <div className="absolute top-3 sm:top-5 right-3 sm:right-5 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 text-white/80 text-[11px] font-medium backdrop-blur-md border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    <span>Kéo để lia góc</span>
                </div>

                {/* Transparent Pipeline Notice Badge */}
                {pipelineNotice && (
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5 z-20 pointer-events-auto animate-fadeIn">
                        <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#183B3A]/90 text-white text-xs sm:text-[13px] backdrop-blur-md border border-white/20 shadow-lg">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-amber-300 shrink-0">ℹ️</span>
                                <span className="truncate">{pipelineNotice}</span>
                            </div>
                            {onDismissNotice && (
                                <button
                                    type="button"
                                    onClick={onDismissNotice}
                                    className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white shrink-0"
                                    aria-label="Đóng thông báo"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sub-scene Info & Camera Angle Controls */}
            <div className="mt-2.5 sm:mt-3 lg:mt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 shrink-0">
                {/* Caption text */}
                <p className="text-[11px] sm:text-xs lg:text-sm text-[#566967] text-center sm:text-left truncate max-w-full">
                    Phối cảnh AI tham khảo • Sản phẩm đối chiếu catalogue HULA
                </p>

                {/* 3 Angle Tabs (Height 48-64px) */}
                <div
                    className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-white border border-[#DDE5E1] shadow-xs"
                    role="tablist"
                    aria-label="Chọn góc nhìn camera"
                >
                    {SHOWROOM_ANGLES.map(angle => {
                        const isActive = currentAngle.id === angle.id;
                        return (
                            <button
                                key={angle.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onSelectAngle(angle.id)}
                                className={`min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] px-3 sm:px-4 lg:px-5 rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all active:scale-95 flex items-center justify-center whitespace-nowrap ${
                                    isActive
                                        ? 'bg-[#183B3A] text-white shadow-sm font-semibold'
                                        : 'bg-transparent hover:bg-[#F7F8F5] text-[#183B3A]'
                                }`}
                            >
                                {angle.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
