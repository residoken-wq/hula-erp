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
                    {/* Top Left Status & Product Prop Bar */}
                    <div className="absolute top-14 sm:top-18 left-3 sm:left-6 z-10 flex items-center gap-2 pointer-events-auto">
                        <div className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-white/80 backdrop-blur-sm pointer-events-none">
                            {rendererMode === 'panorama360' ? '🌐 Panorama 360°' : '🖼️ Khung nhìn 2D'}
                        </div>

                        {/* Single Product Prop Badge (Responsive & Clean) */}
                        <button
                            type="button"
                            onClick={() => openInspector({
                                type: 'product_spec',
                                title: 'Bộ Nệm Ngủ Cotton Cara (REF-MAT-CARA-STD)',
                                subtitle: `Nhãn: Mây — Lớp Mầm · Người giữ: ${state.productState.holder === 'mother' ? 'Mẹ Linh' : 'Cô An'}`,
                                badge: 'Sản phẩm Sale Kit HULA',
                                imageUrl: '/images/tour360/products/nem-cara-spec.jpg',
                                description: 'Bộ sản phẩm thực tế từ Sale Kit HULA gồm nệm Cotton Cara chần gòn 120x63cm, gối 40x25cm, chăn 130x70cm và túi bảo quản quai xách size S (48x40cm). Duy nhất 1 bộ đồ đồng bộ xuyên suốt cả 3 góc nhìn.',
                                specs: [
                                    { label: 'Mã bộ nệm', value: 'REF-MAT-CARA-STD' },
                                    { label: 'Quy cách nệm', value: '120 x 63 cm' },
                                    { label: 'Gối tiêu chuẩn', value: '40 x 25 cm' },
                                    { label: 'Chăn tiêu chuẩn', value: '130 x 70 cm' },
                                    { label: 'Túi bảo quản', value: 'REF-BAG-HANDLE Size S (48x40 cm)' },
                                    { label: 'Nhãn định danh', value: 'Mây — Lớp Mầm' },
                                    { label: 'Người giữ hiện tại', value: state.productState.holder === 'mother' ? 'Mẹ Linh (CHAR-LINH)' : 'Cô An (CHAR-AN)' },
                                    { label: 'Trạng thái', value: state.productState.status },
                                ]
                            })}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 border border-emerald-400/40 text-emerald-200 text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 max-w-[170px] sm:max-w-none"
                            title="Bấm xem thông tin bộ đồ Cotton Cara"
                        >
                            <span className="shrink-0">🎒</span>
                            <span className="hidden sm:inline">Bộ đồ:</span>
                            <span className="text-white capitalize truncate">{state.productState.status.replace('_', ' ')}</span>
                        </button>
                    </div>
                    {/* Hotspot Markers (Optimized min 44px touch target for Mobile & Tablet) */}
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
                                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group pointer-events-auto cursor-pointer focus:outline-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label={`Điểm tương tác: ${h.title}`}
                            >
                                {/* Pulsing Ring */}
                                <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-cyan-400/40 animate-ping group-hover:bg-cyan-300/60 pointer-events-none"></span>
                                
                                {/* Core Dot */}
                                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-white group-hover:scale-125 active:scale-95 transition-transform">
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
                        <div className="absolute inset-0 pointer-events-none z-10">
                            {currentTimelineEvent.presentRoles
                                .filter(r => r !== state.activeRole)
                                .map((npcRole) => {
                                    const npc = CHARACTERS[npcRole];
                                    if (!npc) return null;
                                    const isChild = npcRole === 'CHAR-MAY';
                                    const isTeacher = npcRole === 'CHAR-AN';
                                    const isMother = npcRole === 'CHAR-LINH';

                                    const isEv06 = state.currentEvent === 'EV-06';
                                    const isMavPOV = state.activeRole === 'CHAR-MAY';
                                    const isAnPOV = state.activeRole === 'CHAR-AN';
                                    const isLinhPOV = state.activeRole === 'CHAR-LINH';

                                    // Perspective geometry based on who is looking:
                                    // If Bé Mây (0.95m) is looking: Adults are higher up (18%) and seen from below
                                    // If Adult (1.55m-1.60m) is looking: Adults at eye level (26%), child at 44%
                                    let topPos = isChild ? '44%' : isMavPOV ? '18%' : '26%';
                                    let leftPos = '50%';

                                    if (isLinhPOV) {
                                        leftPos = isTeacher ? '38%' : isChild ? '58%' : '50%';
                                    } else if (isAnPOV) {
                                        leftPos = isMother ? '62%' : isChild ? '38%' : '50%';
                                    } else if (isMavPOV) {
                                        leftPos = isTeacher ? '36%' : isMother ? '64%' : '50%';
                                    }

                                    // Pan adjust
                                    const adjustedLeft = `calc(${leftPos} - ${state.camera.yaw * 0.18}%)`;

                                    // Check if this NPC is currently holding the bag in EV-06
                                    const npcHoldsBag = isEv06 && (
                                        (isTeacher && state.productState.holder === 'teacher' && state.handoverPhase === 'ready') ||
                                        (isMother && state.productState.holder === 'mother' && state.handoverPhase === 'received')
                                    );

                                    return (
                                        <div
                                            key={npc.id}
                                            style={{ left: adjustedLeft, top: topPos }}
                                            className="absolute -translate-x-1/2 flex flex-col items-center animate-fadeIn pointer-events-auto transition-transform duration-100"
                                        >
                                            {/* NPC Badge Name */}
                                            <div className="px-2.5 py-0.5 rounded-full bg-slate-900/85 border border-white/20 text-white text-[10px] sm:text-[11px] font-bold shadow-lg flex items-center gap-1.5 mb-1.5 backdrop-blur-md">
                                                <span>{npc.displayName}</span>
                                                <span className="text-[10px] text-white/50">{npc.roleTitle}</span>
                                            </div>

                                            {/* NPC Real Portrait Token (Prompt 02, 04, 05) */}
                                            <div className="relative group">
                                                <div className={`${
                                                    isChild
                                                        ? 'w-14 h-14 sm:w-16 sm:h-16'
                                                        : isMavPOV
                                                            ? 'w-18 h-18 sm:w-22 sm:h-22' // Appears larger/taller to child
                                                            : 'w-16 h-16 sm:w-20 sm:h-20'
                                                } rounded-2xl sm:rounded-3xl bg-slate-900/40 border-2 border-white/40 overflow-hidden shadow-2xl backdrop-blur-sm group-hover:scale-105 group-hover:border-cyan-300 transition-all`}>
                                                    {npc.avatarUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={npc.avatarUrl}
                                                            alt={npc.displayName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">
                                                            {npc.avatar}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Grounding Shadow */}
                                                <div className="w-12 h-2 bg-black/40 rounded-full blur-[2px] mx-auto mt-1" />

                                                {/* Handover Bag Badge when NPC holds bag */}
                                                {npcHoldsBag && (
                                                    <div className="absolute -bottom-2 -right-3 animate-bounce">
                                                        <div className="px-2 py-1 rounded-xl bg-amber-500/90 border border-amber-300 text-slate-950 font-black text-[10px] shadow-lg flex items-center gap-1">
                                                            <span>🎒🏷️</span>
                                                            <span>Túi Mây — Lớp Mầm</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                            {/* Handover Bag in Transferring Phase (Prompt 03 & 05: moving between hands) */}
                            {state.currentEvent === 'EV-06' && state.handoverPhase === 'transferring' && (
                                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 pointer-events-auto animate-pulse flex flex-col items-center z-20">
                                    <div className="px-3 py-1.5 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center gap-2">
                                        <span className="text-sm animate-spin">⏳</span>
                                        <span>Đang chuyển giao túi Mây — Lớp Mầm...</span>
                                        <span>🎒🏷️</span>
                                    </div>
                                </div>
                            )}

                            {/* Handover Bag when held by active player (Cô An in 'ready' or Mẹ Linh in 'received') */}
                            {state.currentEvent === 'EV-06' && (
                                (state.activeRole === 'CHAR-AN' && state.handoverPhase === 'ready') ||
                                (state.activeRole === 'CHAR-LINH' && state.handoverPhase === 'received')
                            ) && (
                                <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto z-20 animate-fadeIn">
                                    <div className={`px-3.5 py-1.5 rounded-2xl ${
                                        state.handoverPhase === 'received' ? 'bg-emerald-500' : 'bg-cyan-500'
                                    } text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center gap-2`}>
                                        <span>🎒🏷️</span>
                                        <span>
                                            {state.activeRole === 'CHAR-AN'
                                                ? 'Túi nệm đang trên tay cô An (Sẵn sàng trao)'
                                                : 'Mẹ Linh đã nhận túi Mây — Lớp Mầm an toàn'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                </div>
            )}

            {/* First-Person Perspective Hand / Arm Overlay */}
            {status === 'ready' && (
                <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-between px-4 sm:px-24 z-10 transition-transform duration-150"
                    style={{ transform: `translateY(${Math.max(0, -state.camera.pitch * 2)}px)` }}
                >
                    {/* Left Arm/Hand representation */}
                    <div className="flex flex-col items-center opacity-85 sm:opacity-90 transition-all">
                        <div
                            className={`${
                                activeCharacterInfo.armStyle.isChild
                                    ? 'w-9 sm:w-14 h-14 sm:h-22 rounded-t-2xl shadow-xl'
                                    : 'w-11 sm:w-20 h-20 sm:h-32 rounded-t-full shadow-2xl'
                            } border-t-2 border-white/20 transform -rotate-12 translate-y-8 sm:translate-y-10 overflow-hidden`}
                            style={{
                                backgroundColor: activeCharacterInfo.armStyle.sleeveColor || '#fed7aa',
                            }}
                        >
                            {/* Hand tone tip */}
                            <div className={`w-full ${activeCharacterInfo.armStyle.isChild ? 'h-8 sm:h-10' : 'h-11 sm:h-14'} bg-[#fed7aa] rounded-t-full border-t border-white/30`}></div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full hidden sm:inline-block">
                            {activeCharacterInfo.armStyle.isChild ? 'Tay Bé Mây' : `Tay ${activeCharacterInfo.displayName}`}
                        </span>
                    </div>

                    {/* Right Arm/Hand representation */}
                    <div className="flex flex-col items-center opacity-85 sm:opacity-90 transition-all">
                        <div
                            className={`${
                                activeCharacterInfo.armStyle.isChild
                                    ? 'w-9 sm:w-14 h-14 sm:h-22 rounded-t-2xl shadow-xl'
                                    : 'w-11 sm:w-20 h-20 sm:h-32 rounded-t-full shadow-2xl'
                            } border-t-2 border-white/20 transform rotate-12 translate-y-8 sm:translate-y-10 overflow-hidden`}
                            style={{
                                backgroundColor: activeCharacterInfo.armStyle.sleeveColor || '#fed7aa',
                            }}
                        >
                            <div className={`w-full ${activeCharacterInfo.armStyle.isChild ? 'h-8 sm:h-10' : 'h-11 sm:h-14'} bg-[#fed7aa] rounded-t-full border-t border-white/30`}></div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full hidden sm:inline-block">
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
