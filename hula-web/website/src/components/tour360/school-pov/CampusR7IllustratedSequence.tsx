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
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Subscribe to state machine
    useEffect(() => {
        const unsubscribe = handoverStateMachine.subscribe(() => {
            setHandoverState(handoverStateMachine.state);
        });
        return unsubscribe;
    }, []);

    // Handle role switch: reset sequence to H0 and notify user
    useEffect(() => {
        handoverStateMachine.switchRole(activeRole);
        const roleName = ROLES[activeRole]?.name || activeRole;
        setToastMessage(`Bắt đầu lại theo góc nhìn ${roleName}`);
        const timer = setTimeout(() => setToastMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [activeRole]);

    const stepInfo = STATE_TO_STEP[handoverState] || STATE_TO_STEP.waiting;
    const roleKey = activeRole; // 'co-an' | 'me-linh' | 'be-may'
    const slotKey = `r7/${roleKey}/${stepInfo.code}`;

    // Determine target media URL (custom override, or optimized WebP with cache buster)
    const rawTargetUrl = customMediaMap?.[slotKey] || `/images/tour360/r7/${roleKey}/${stepInfo.code}.webp`;
    const targetUrl = rawTargetUrl.includes('?') ? rawTargetUrl : `${rawTargetUrl}?v=inst16`;

    // Preload & decode image with fallback chain: WebP -> PNG -> SVG
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setLoadError(false);

        const tryLoad = (src: string, fallbackFn?: () => void) => {
            const img = new Image();
            img.src = src;
            img.onload = async () => {
                if (!isMounted) return;
                try {
                    if (img.decode) {
                        await img.decode();
                    }
                } catch {
                    // Ignore decode error and continue
                }
                if (!isMounted) return;
                setCurrentImageSrc(src);
                setIsLoading(false);
                setLoadError(false);
            };
            img.onerror = () => {
                if (!isMounted) return;
                if (fallbackFn) fallbackFn();
                else {
                    setIsLoading(false);
                    setLoadError(true);
                }
            };
        };

        // Attempt WebP first, then high-res PNG, then SVG vector
        tryLoad(targetUrl, () => {
            const pngFallback = `/images/tour360/r7/${roleKey}/${stepInfo.code}.png?v=inst16`;
            tryLoad(pngFallback, () => {
                const svgFallback = `/images/tour360/r7/${roleKey}/${stepInfo.code}.svg`;
                tryLoad(svgFallback);
            });
        });

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
    const activeColor = campusWorldState.getActiveColorInfo();
    const isDifferentColor = activeColor && activeColor.colorId !== 'blue' && activeColor.colorId !== 'teal';

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

                {/* 2. UI-Rendered Name Label Badge Overlay on bag-may-01 in H1, H2, H3 */}
                {(handoverState === 'bag_selected' || handoverState === 'label_verified' || handoverState === 'ready_to_transfer') && !loadError && (
                    <div
                        className={`absolute z-20 transition-all duration-300 pointer-events-none ${
                            handoverState === 'label_verified'
                                ? 'top-[62%] left-1/2 -translate-x-1/2 scale-105 sm:scale-115'
                                : 'top-[65%] left-1/2 -translate-x-1/2 scale-95 sm:scale-100'
                        }`}
                    >
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border-2 border-[#087F8C] shadow-xl text-[#087F8C]">
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
                {/* 3. Role Switch Toast Notification */}
                {toastMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fadeIn">
                        <div className="px-4 py-2 rounded-2xl bg-[#183B3A]/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-xl flex items-center gap-2">
                            <span>🔄</span>
                            <span>{toastMessage}</span>
                        </div>
                    </div>
                )}

                {/* 4. Blue Bag Color Disclaimer Note if Custom Color Selected */}
                {isDifferentColor && (
                    <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
                        <div className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white/80 text-[10px] font-medium border border-white/10">
                            ℹ️ Minh họa tiêu chuẩn túi xanh mầm non
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
