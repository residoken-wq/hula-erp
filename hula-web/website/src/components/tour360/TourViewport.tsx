/**
 * HULA 360 Tour - Viewport & Renderer Adapter (TourViewport)
 * Implements camera ownership (drag cancels auto-pan immediately - A06),
 * renders hotspots, first-person arm overlays and safe asset fallback (A11).
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTour } from './Tour360Provider';
import { useAssetLoader } from './hooks/useAssetLoader';
import { TOUR_ASSETS, TOUR_HOTSPOTS, CHARACTERS, TIMELINE_EVENTS } from './data/tourSeed';
import { TourHotspot } from './types';

export function TourViewport() {
    const {
        state,
        currentStep,
        activeCharacterInfo,
        startUserDrag,
        endUserDrag,
        updateCamera,
        openInspector,
        playChime,
        settings,
        currentTimelineEvent,
    } = useTour();

    const containerRef = useRef<HTMLDivElement>(null);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    // Current scene asset & custom URL support (B04 & Critical Issue #4)
    const defaultSceneUrl = currentStep ? TOUR_ASSETS[currentStep.sceneAssetId]?.url : undefined;
    const cmsCustomUrl = (currentStep?.sceneAssetId === 'scene_classroom' && settings?.widget_360_panorama_url)
        ? String(settings.widget_360_panorama_url).trim()
        : '';
    const initialUrl = cmsCustomUrl || defaultSceneUrl;

    const [activeUrl, setActiveUrl] = useState(initialUrl);

    useEffect(() => {
        setActiveUrl(cmsCustomUrl || defaultSceneUrl);
    }, [cmsCustomUrl, defaultSceneUrl]);

    const { status, image, errorMessage, retry } = useAssetLoader(activeUrl);

    // Fallback: If custom URL errors out, fallback to default verified scene image
    const handleRetryWithFallback = useCallback(() => {
        if (cmsCustomUrl && activeUrl === cmsCustomUrl && defaultSceneUrl) {
            setActiveUrl(defaultSceneUrl);
        } else {
            retry();
        }
    }, [cmsCustomUrl, activeUrl, defaultSceneUrl, retry]);

    const rendererMode = settings?.widget_360_renderer_mode || 'guided2d';

    // Hotspots for the current scene
    const activeHotspots = currentStep
        ? TOUR_HOTSPOTS.filter(h => h.sceneId === currentStep.sceneAssetId)
        : [];

    // Camera Ownership: Dragging handlers (satisfies A06)
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Only track primary click or touch
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        startUserDrag(); // DỪNG AUTO-PAN NGAY LẬP TỨC
        setDragStart({ x: e.clientX, y: e.clientY });
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, [startUserDrag]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!state.camera.isDragging || !dragStart) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        // Sensitivity
        const sensitivity = 0.15;
        const newYaw = state.camera.yaw - deltaX * sensitivity;
        const newPitch = Math.max(-45, Math.min(45, state.camera.pitch + deltaY * sensitivity));

        updateCamera(newYaw, newPitch);
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [state.camera.isDragging, state.camera.yaw, state.camera.pitch, dragStart, updateCamera]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (state.camera.isDragging) {
            endUserDrag();
            setDragStart(null);
            try {
                (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            } catch {}
        }
    }, [state.camera.isDragging, endUserDrag]);

    const handleHotspotClick = (h: TourHotspot, e: React.MouseEvent) => {
        e.stopPropagation();
        playChime(587.33, 0.2); // D5 chime
        openInspector({
            type: 'hotspot',
            title: h.title,
            subtitle: h.label,
            badge: h.category,
            description: h.description,
            imageUrl: h.imageUrl,
            specs: h.specDetail,
        });
    };

    // Calculate panoramic pan offset for 2D wide image
    // Normalizing yaw (-180..180) to background offset %
    const panPercent = 50 + (state.camera.yaw * 0.4);
    const pitchOffsetPx = state.camera.pitch * 3;

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full h-full overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing touch-none"
            aria-label="Không gian trải nghiệm 360"
        >
            {/* Loading State */}
            {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10">
                    <div className="w-12 h-12 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin mb-3"></div>
                    <p className="text-xs font-semibold text-cyan-200 animate-pulse">
                        Đang nạp không gian lớp học...
                    </p>
                </div>
            )}

            {/* Error State with Retry (A11) */}
            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/95 z-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-2xl mb-3">
                        ⚠️
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Không thể tải khung cảnh</h4>
                    <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                        {errorMessage || 'Đã có lỗi xảy ra khi nạp hình ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.'}
                    </p>
                    <button
                        type="button"
                        onClick={handleRetryWithFallback}
                        className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg transition-all"
                    >
                        🔄 Thử Lại {activeUrl === cmsCustomUrl ? '(Dùng ảnh mặc định)' : ''}
                    </button>
                </div>
            )}

            {/* Rendered Scene (guided2d / panorama360 adapter) */}
            {status === 'ready' && activeUrl && (
                <div
                    className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
                    style={{
                        backgroundImage: `url(${activeUrl})`,
                        backgroundPosition: `${panPercent}% calc(50% + ${pitchOffsetPx}px)`,
                        backgroundSize: rendererMode === 'panorama360' ? 'auto 100%' : 'cover',
                        transform: `scale(${state.camera.zoom})`,
                    }}
                >
                    {/* Renderer Mode Indicator Badge */}
                    <div className="absolute top-16 left-4 z-10 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] text-white/70 backdrop-blur-sm pointer-events-none">
                        {rendererMode === 'panorama360' ? '🌐 Panorama 360° Mode' : '🖼️ Guided 2D View'}
                    </div>
                    {/* Hotspot Markers */}
                    {activeHotspots.map(h => {
                        // Position adjusted by pan offset
                        const adjustedX = h.x - (state.camera.yaw * 0.15);
                        // Hide if wrapped behind
                        if (adjustedX < -10 || adjustedX > 110) return null;

                        return (
                            <button
                                key={h.id}
                                type="button"
                                onClick={e => handleHotspotClick(h, e)}
                                style={{ left: `${adjustedX}%`, top: `${h.y}%` }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group pointer-events-auto cursor-pointer focus:outline-none"
                                aria-label={`Điểm tương tác: ${h.title}`}
                            >
                                {/* Pulsing Ring */}
                                <span className="absolute -inset-2.5 rounded-full bg-cyan-400/40 animate-ping group-hover:bg-cyan-300/60 pointer-events-none"></span>
                                
                                {/* Core Dot */}
                                <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-white group-hover:scale-125 transition-transform">
                                    <span className="text-xs font-black">✦</span>
                                </div>

                                {/* Tooltip Pill */}
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/95 border border-white/20 text-white text-xs font-bold shadow-2xl flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                    <span>{h.title}</span>
                                </div>
                            </button>
                        );
                    })}

                    {/* In-Scene NPCs (Anti-Clone Culling: active role never appears as NPC) */}
                    {currentTimelineEvent && (
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-none z-10">
                            {currentTimelineEvent.presentRoles
                                .filter(r => r !== state.activeRole)
                                .map(npcRole => {
                                    const npc = CHARACTERS[npcRole];
                                    if (!npc) return null;
                                    return (
                                        <div
                                            key={npc.id}
                                            className="flex flex-col items-center animate-fadeIn pointer-events-auto"
                                        >
                                            <div className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/20 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 mb-1 backdrop-blur-sm">
                                                <span>{npc.avatar}</span>
                                                <span>{npc.displayName}</span>
                                                <span className="text-[9px] text-cyan-300">({npc.cameraHeight}m)</span>
                                            </div>
                                            <div className="w-11 h-11 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center text-xl shadow-xl backdrop-blur-md">
                                                {npc.avatar}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    {/* Single Product Prop Badge (Single source of truth) */}
                    <div className="absolute top-16 right-16 z-10 pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => openInspector({
                                type: 'product_spec',
                                title: 'Bộ Nệm Ngủ Mầm Non HULA',
                                subtitle: `Ký hiệu: Chiếc lá xanh · Vị trí: ${state.productState.location}`,
                                badge: 'Sản phẩm minh họa',
                                description: 'Bộ sản phẩm cá nhân gồm túi vải kem hình chiếc lá, nệm mint chần bông êm ái và gối nhỏ. Duy nhất 1 bộ đồ xuyên suốt cả 3 góc nhìn.',
                                specs: [
                                    { label: 'Người giữ hiện tại', value: state.productState.holder },
                                    { label: 'Trạng thái', value: state.productState.status },
                                    { label: 'Vị trí', value: state.productState.location },
                                    { label: 'Ký hiệu nhận diện', value: 'Hình chiếc lá xanh' },
                                ]
                            })}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 border border-emerald-400/40 text-emerald-200 text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95"
                            title="Bấm xem thông tin bộ đồ HULA"
                        >
                            <span>🎒</span>
                            <span className="hidden sm:inline">Bộ Đồ HULA:</span>
                            <span className="text-white capitalize">{state.productState.status.replace('_', ' ')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* First-Person Perspective Hand / Arm Overlay */}
            {status === 'ready' && (
                <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-between px-8 sm:px-24 z-10 transition-transform duration-150"
                    style={{ transform: `translateY(${Math.max(0, -state.camera.pitch * 2)}px)` }}
                >
                    {/* Left Arm/Hand representation */}
                    <div className="flex flex-col items-center opacity-90 transition-all">
                        <div
                            className={`${
                                activeCharacterInfo.armStyle.isChild
                                    ? 'w-10 sm:w-14 h-16 sm:h-22 rounded-t-2xl shadow-xl'
                                    : 'w-14 sm:w-20 h-24 sm:h-32 rounded-t-full shadow-2xl'
                            } border-t-2 border-white/20 transform -rotate-12 translate-y-6 sm:translate-y-10 overflow-hidden`}
                            style={{
                                backgroundColor: activeCharacterInfo.armStyle.sleeveColor || '#fed7aa',
                            }}
                        >
                            {/* Hand tone tip */}
                            <div className={`w-full ${activeCharacterInfo.armStyle.isChild ? 'h-10' : 'h-14'} bg-[#fed7aa] rounded-t-full border-t border-white/30`}></div>
                        </div>
                        <span className="text-[10px] text-white/70 font-bold mt-1 bg-black/40 px-2 py-0.5 rounded-full">
                            {activeCharacterInfo.armStyle.isChild ? 'Tay Bé Mây' : `Tay ${activeCharacterInfo.displayName}`}
                        </span>
                    </div>

                    {/* Right Arm/Hand representation */}
                    <div className="flex flex-col items-center opacity-90 transition-all">
                        <div
                            className={`${
                                activeCharacterInfo.armStyle.isChild
                                    ? 'w-10 sm:w-14 h-16 sm:h-22 rounded-t-2xl shadow-xl'
                                    : 'w-14 sm:w-20 h-24 sm:h-32 rounded-t-full shadow-2xl'
                            } border-t-2 border-white/20 transform rotate-12 translate-y-6 sm:translate-y-10 overflow-hidden`}
                            style={{
                                backgroundColor: activeCharacterInfo.armStyle.sleeveColor || '#fed7aa',
                            }}
                        >
                            <div className={`w-full ${activeCharacterInfo.armStyle.isChild ? 'h-10' : 'h-14'} bg-[#fed7aa] rounded-t-full border-t border-white/30`}></div>
                        </div>
                        <span className="text-[10px] text-white/70 font-bold mt-1 bg-black/40 px-2 py-0.5 rounded-full">
                            Tầm mắt {activeCharacterInfo.cameraHeight}m
                        </span>
                    </div>
                </div>
            )}

            {/* Transition Milestone Toast */}
            {state.transitionLabel && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs sm:text-sm font-black shadow-2xl flex items-center gap-2 animate-bounce">
                    <span>⏱️</span>
                    <span>{state.transitionLabel}</span>
                </div>
            )}
        </div>
    );
}
