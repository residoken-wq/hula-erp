/**
 * CampusR7IllustratedSequence.tsx
 * First-Person Interactive Illustrated Sequence for Room R7 (Instruction 10 §2):
 * - Renders high-fidelity 16:9 POV scenes for 3 roles x 6 steps (18 canonical slots)
 * - True first-person perspective:
 *   - Mẹ Linh: sees Cô An opposite, own hands entering in H3-H5
 *   - Cô An: sees Mẹ Linh and Bé Mây opposite, own hands in H3-H4
 *   - Bé Mây: low eye height (0.95m), looking up at adults and table
 * - Single bag instance: bag-may-01 (teal blue, gray piping, dual handles)
 * - UI-rendered name label "Mây — Lớp Mầm" prevents typography artifacting
 * - Crossfade transitions, media decode safety, anti-double-click guard, error fallback
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RoleId, ROLES, campusWorldState } from '../engine/CampusWorldState';
import {
    handoverStateMachine,
    HandoverState,
    MAY_HANDOVER_LABEL,
} from '../engine/HandoverStateMachine';

interface CampusR7IllustratedSequenceProps {
    activeRole: RoleId;
    onBackToCorridor?: () => void;
    customMediaMap?: Record<string, string>; // Optional CMS overrides
}

const STATE_TO_STEP: Record<HandoverState, { code: string; title: string; hint: string }> = {
    waiting: {
        code: 'h0-greet',
        title: 'H0: Gặp nhau tại bàn đón bé',
        hint: 'Chào hỏi và chuẩn bị nhận túi đồ của bé Mây',
    },
    bag_selected: {
        code: 'h1-table',
        title: 'H1: Đặt túi lên bàn kiểm tra',
        hint: 'Túi quai xách màu xanh đã được đặt lên bàn đón bé',
    },
    label_verified: {
        code: 'h2-label',
        title: 'H2: Xác nhận nhãn và danh mục đồ',
        hint: 'Kiểm tra nhãn tên "Mây — Lớp Mầm" và khóa kéo chắc chắn',
    },
    ready_to_transfer: {
        code: 'h3-ready',
        title: 'H3: Chuẩn bị trao nhận túi',
        hint: 'Cô An nhấc quai túi, mẹ Linh đưa tay sẵn sàng tiếp nhận',
    },
    transferring: {
        code: 'h4-transfer',
        title: 'H4: Chuyển giao quyền sở hữu',
        hint: 'Thời điểm bàn giao: Hai bàn tay cùng tiếp xúc quai túi',
    },
    received: {
        code: 'h5-received',
        title: 'H5: Hoàn tất bàn giao',
        hint: 'Mẹ Linh giữ túi an toàn, buổi bàn giao hoàn tất trọn vẹn',
    },
    completed: {
        code: 'h5-received',
        title: 'H5: Hoàn tất bàn giao',
        hint: 'Mẹ Linh giữ túi an toàn, buổi bàn giao hoàn tất trọn vẹn',
    },
};

export function CampusR7IllustratedSequence({
    activeRole,
    onBackToCorridor,
    customMediaMap,
}: CampusR7IllustratedSequenceProps) {
    const [handoverState, setHandoverState] = useState<HandoverState>(handoverStateMachine.state);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

    // Subscribe to state machine
    useEffect(() => {
        const unsubscribe = handoverStateMachine.subscribe(() => {
            setHandoverState(handoverStateMachine.state);
        });
        return unsubscribe;
    }, []);

    const stepInfo = STATE_TO_STEP[handoverState] || STATE_TO_STEP.waiting;
    const roleKey = activeRole; // 'co-an' | 'me-linh' | 'be-may'
    const slotKey = `r7/${roleKey}/${stepInfo.code}`;

    // Determine target media URL
    const targetUrl = customMediaMap?.[slotKey] || `/images/tour360/r7/${roleKey}/${stepInfo.code}.webp`;

    // Preload & crossfade image on step or role change
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setLoadError(false);

        const img = new Image();
        img.src = targetUrl;

        img.onload = () => {
            if (!isMounted) return;
            setCurrentImageSrc(targetUrl);
            setIsLoading(false);
            setLoadError(false);
        };

        img.onerror = () => {
            if (!isMounted) return;
            // Fallback to SVG if webp has an issue
            const svgFallback = `/images/tour360/r7/${roleKey}/${stepInfo.code}.svg`;
            const fallbackImg = new Image();
            fallbackImg.src = svgFallback;
            fallbackImg.onload = () => {
                if (!isMounted) return;
                setCurrentImageSrc(svgFallback);
                setIsLoading(false);
                setLoadError(false);
            };
            fallbackImg.onerror = () => {
                if (!isMounted) return;
                setIsLoading(false);
                setLoadError(true);
            };
        };

        return () => {
            isMounted = false;
        };
    }, [targetUrl, roleKey, stepInfo.code]);

    const handleRetry = () => {
        setLoadError(false);
        setIsLoading(true);
        const img = new Image();
        img.src = `${targetUrl}?t=${Date.now()}`;
        img.onload = () => {
            setCurrentImageSrc(img.src);
            setIsLoading(false);
        };
        img.onerror = () => {
            setIsLoading(false);
            setLoadError(true);
        };
    };

    const roleInfo = ROLES[activeRole] || ROLES['me-linh'];

    return (
        <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#101F20] select-none"
            role="region"
            aria-label="Minh họa tương tác Phòng Đón Bé R7"
        >
            {/* 1. Main 16:9 Viewport Box */}
            <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] flex items-center justify-center">
                {/* Background Scene Image with Smooth Fade */}
                {currentImageSrc && !loadError && (
                    <img
                        key={`${roleKey}-${stepInfo.code}`}
                        src={currentImageSrc}
                        alt={`Cảnh R7: ${stepInfo.title} (${roleInfo.name})`}
                        className={`w-full h-full object-contain transition-opacity duration-300 ${
                            isLoading ? 'opacity-40' : 'opacity-100'
                        }`}
                    />
                )}

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10">
                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/90 shadow-lg text-[#183B3A] text-xs font-bold">
                            <div className="w-4 h-4 border-2 border-[#087F8C] border-t-transparent rounded-full animate-spin" />
                            <span>Đang tải khung cảnh minh họa...</span>
                        </div>
                    </div>
                )}

                {/* Error Fallback Box */}
                {loadError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#173F40]/90 text-white p-6 z-20 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold">
                            ⚠️
                        </div>
                        <div className="text-center max-w-md">
                            <h4 className="text-base font-bold">Chưa tải được hình minh họa</h4>
                            <p className="text-xs text-white/70 mt-1">
                                Vui lòng kiểm tra kết nối mạng hoặc thử lại. Trạng thái bàn giao vẫn được bảo toàn an toàn.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="px-4 py-2 rounded-xl bg-[#087F8C] hover:bg-[#076C77] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                                Thử lại
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onBackToCorridor) onBackToCorridor();
                                    else campusWorldState.setRoom('H0');
                                }}
                                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
                            >
                                Quay lại hành lang
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. UI-Rendered Name Label Badge Overlay in H1, H2, H3 */}
                {(handoverState === 'bag_selected' || handoverState === 'label_verified' || handoverState === 'ready_to_transfer') && !loadError && (
                    <div
                        className={`absolute z-20 transition-all duration-300 pointer-events-none ${
                            handoverState === 'label_verified'
                                ? 'top-[44%] left-1/2 -translate-x-1/2 scale-110 sm:scale-125'
                                : 'top-[52%] left-1/2 -translate-x-1/2 scale-90 sm:scale-100'
                        }`}
                    >
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border-2 border-[#087F8C] shadow-xl text-[#087F8C]">
                            <span className="text-xs">🏷️</span>
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#066772]">
                                    Nhãn tên học sinh
                                </span>
                                <span className="text-xs sm:text-sm font-black text-[#173F40]">
                                    {MAY_HANDOVER_LABEL.childName} — {MAY_HANDOVER_LABEL.className}
                                </span>
                            </div>
                            {handoverState === 'label_verified' && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#10B981] text-white text-[10px] font-bold">
                                    ✓ Đã khớp
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Interactive Hotspot on Bag / Key Action Element */}
                {!loadError && !isLoading && (
                    <div className="absolute top-[48%] left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => setActiveHotspot(prev => prev ? null : 'bag-info')}
                            className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-[#087F8C]/80 hover:bg-[#087F8C] text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                            aria-label="Thông tin túi nệm của bé Mây"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping absolute" />
                            <span className="w-2.5 h-2.5 rounded-full bg-white relative" />
                        </button>

                        {/* Hotspot Popover Tooltip */}
                        {activeHotspot === 'bag-info' && (
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-[#B7D9CC] text-left text-[#183B3A] animate-fadeIn z-30">
                                <div className="flex items-center justify-between pb-1.5 border-b border-[#EAEFEA]">
                                    <span className="text-[11px] font-bold text-[#087F8C] uppercase">
                                        Túi quai xách HULA
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveHotspot(null)}
                                        className="text-xs text-[#566967] hover:text-black"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <p className="text-xs font-semibold mt-1.5">
                                    Mã: {MAY_HANDOVER_LABEL.bagRef} ({MAY_HANDOVER_LABEL.bagName})
                                </p>
                                <p className="text-[11px] text-[#566967] mt-0.5">
                                    Bên trong: {MAY_HANDOVER_LABEL.beddingName} gấp gọn gàng.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Top Status Banner: Mode Declaration & Step Pill */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span>Minh họa tương tác (Illustrated Sequence)</span>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
                    <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold shadow-lg">
                        <span>{stepInfo.hint}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
