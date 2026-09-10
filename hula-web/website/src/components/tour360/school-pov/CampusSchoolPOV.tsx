/**
 * CampusSchoolPOV.tsx
 * Master Component for HULA-360 School POV Experience (Instruction 07):
 * - Mounts Three.js WebGL CampusEngine
 * - Houses Top Header, Right Inspector, Map Modal & Role Modal
 * - First-person character speech banner & interaction hints
 * - Manages Escape key navigation & responsive states
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    campusWorldState,
    ROLES,
    ROOMS,
    RoleId,
    RoomId,
    CampusInstance,
} from '../engine/CampusWorldState';
import { CampusEngine } from '../engine/CampusEngine';
import { CampusTopHeader } from './CampusTopHeader';
import { CampusInspector } from './CampusInspector';
import { CampusSchoolMapModal } from './CampusSchoolMapModal';
import { CampusRoleModal } from './CampusRoleModal';
import { CampusHandoverPanel } from './CampusHandoverPanel';
import { CampusR7IllustratedSequence } from './CampusR7IllustratedSequence';
import { handoverStateMachine } from '../engine/HandoverStateMachine';

interface CampusSchoolPOVProps {
    onClose: () => void;
}

export function CampusSchoolPOV({ onClose }: CampusSchoolPOVProps) {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<CampusEngine | null>(null);

    // Local reactive state mirrored from campusWorldState
    const [activeRole, setActiveRole] = useState<RoleId>(campusWorldState.activeRole);
    const [currentRoomId, setCurrentRoomId] = useState<RoomId>(campusWorldState.currentRoomId);
    const [selectedInstance, setSelectedInstance] = useState<CampusInstance | null>(campusWorldState.getSelectedInstance());
    const [isApproached, setIsApproached] = useState<boolean>(!!campusWorldState.approachedInstanceId);
    const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(campusWorldState.isInspectorOpen);
    const [isMapOpen, setIsMapOpen] = useState<boolean>(campusWorldState.isMapOpen);
    const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState<boolean>(campusWorldState.isRoleSelectorOpen);
    const [visitedRooms, setVisitedRooms] = useState<Set<RoomId>>(new Set(campusWorldState.visitedRooms));
    const [activeColorInfo, setActiveColorInfo] = useState(campusWorldState.getActiveColorInfo());
    const [r7RenderMode, setR7RenderMode] = useState(campusWorldState.r7RenderMode);

    // Sync from CampusWorldState
    useEffect(() => {
        const unsubscribe = campusWorldState.subscribe(() => {
            setActiveRole(campusWorldState.activeRole);
            setCurrentRoomId(campusWorldState.currentRoomId);
            setSelectedInstance(campusWorldState.getSelectedInstance());
            setIsApproached(!!campusWorldState.approachedInstanceId);
            setIsInspectorOpen(campusWorldState.isInspectorOpen);
            setIsMapOpen(campusWorldState.isMapOpen);
            setIsRoleSelectorOpen(campusWorldState.isRoleSelectorOpen);
            setVisitedRooms(new Set(campusWorldState.visitedRooms));
            setActiveColorInfo(campusWorldState.getActiveColorInfo());
            setR7RenderMode(campusWorldState.r7RenderMode);
        });
        return unsubscribe;
    }, []);

    // Initialize 3D CampusEngine on mount
    useEffect(() => {
        if (!canvasContainerRef.current) return;

        const engine = new CampusEngine(canvasContainerRef.current);
        engineRef.current = engine;

        return () => {
            engine.dispose();
            engineRef.current = null;
        };
    }, []);

    // Ensure on mobile (< 640px), inspector defaults to closed and resets on room change
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            campusWorldState.toggleInspector(false);
        }
    }, [currentRoomId]);

    // Focus restoration on close
    useEffect(() => {
        const previousActiveElement = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
        return () => {
            if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                previousActiveElement.focus();
            }
        };
    }, []);

    // Global keyboard listener (Escape key hierarchy: Role -> Map -> Label Modal -> Approach -> Inspector -> Close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isRoleSelectorOpen) {
                    campusWorldState.toggleRoleSelector(false);
                } else if (isMapOpen) {
                    campusWorldState.toggleMap(false);
                } else if (handoverStateMachine.isLabelModalOpen) {
                    handoverStateMachine.closeLabelModal();
                } else if (isApproached) {
                    campusWorldState.setApproached(false);
                } else if (isInspectorOpen) {
                    campusWorldState.toggleInspector(false);
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRoleSelectorOpen, isMapOpen, isApproached, isInspectorOpen, onClose]);

    const roleConfig = ROLES[activeRole] || ROLES['me-linh'];
    const currentSpeech = roleConfig.speechLines[currentRoomId] || '';

    // Render inside a React Portal to completely bypass page layout, banner, and z-index stacks
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] w-screen h-[100dvh] max-h-[100dvh] bg-[#F6F8F5] flex flex-col overflow-hidden select-none font-sans pb-[env(safe-area-inset-bottom)]"
            role="dialog"
            aria-modal="true"
            aria-label="Trải nghiệm trường mầm non HULA 3D góc nhìn thứ nhất"
        >
            {/* 1. Top Bar Header (Desktop: 64px, Mobile: 2 rows < 640px) */}
            <CampusTopHeader
                onClose={onClose}
                activeRole={activeRole}
                currentRoomId={currentRoomId}
                onToggleMap={() => {
                    campusWorldState.toggleInspector(false);
                    campusWorldState.toggleRoleSelector(false);
                    campusWorldState.toggleMap(true);
                }}
                onToggleRoleSelector={() => {
                    campusWorldState.toggleInspector(false);
                    campusWorldState.toggleMap(false);
                    campusWorldState.toggleRoleSelector(true);
                }}
            />

            {/* 2. Main 3D Viewport & Overlays */}
            <div className="relative flex-1 w-full h-full min-h-0 min-w-0 overflow-hidden bg-slate-900">
                {/* Three.js Canvas Container (disabled when overlay modal is open or when in R7) */}
                <div
                    ref={canvasContainerRef}
                    className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none ${
                        currentRoomId === 'R7' || isMapOpen || isRoleSelectorOpen
                            ? 'opacity-0 pointer-events-none'
                            : 'opacity-100'
                    }`}
                    role="region"
                    aria-label="Khung cảnh 3D trường học mầm non"
                />

                {/* If in Room R7, render desktop split / mobile vertical layout */}
                {currentRoomId === 'R7' ? (
                    <div className="relative w-full h-full flex flex-col lg:flex-row min-h-0 min-w-0 overflow-hidden bg-[#101F20]">
                        {/* Left / Top: Illustrated Sequence Scene */}
                        <div className="w-full lg:flex-1 h-[260px] sm:h-[340px] lg:h-full shrink-0 lg:shrink min-w-0 relative flex items-center justify-center bg-[#101F20] overflow-hidden">
                            <CampusR7IllustratedSequence
                                activeRole={activeRole}
                                onBackToCorridor={() => campusWorldState.setRoom('H0')}
                                customMediaMap={campusWorldState.customMediaMap}
                            />
                        </div>

                        {/* Right / Bottom: Dedicated Step Card Panel (340px on desktop) */}
                        <div className="w-full lg:w-[340px] xl:w-[360px] shrink-0 flex-1 lg:flex-initial lg:h-full bg-white border-t lg:border-t-0 lg:border-l border-[#DDE5E1] overflow-y-auto">
                            <CampusHandoverPanel
                                activeRole={activeRole}
                                onExploreMore={() => campusWorldState.setRoom('R1')}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Floating Re-open Inspector Button (when collapsed) */}
                        {!isInspectorOpen && (
                            <button
                                type="button"
                                onClick={() => campusWorldState.toggleInspector(true)}
                                className="hidden sm:flex absolute top-4 right-4 z-10 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DDE5E1] text-[#183B3A] text-xs sm:text-sm font-bold shadow-lg hover:bg-white active:scale-95 items-center gap-2"
                                aria-label="Mở bảng phối màu"
                            >
                                <span className="w-2.5 h-2.5 rounded-full bg-[#087F8C]" />
                                <span>Bảng Phối Màu</span>
                            </button>
                        )}

                        {/* Mobile Bottom Floating Control Bar (When Inspector is closed in R1-R6) */}
                        {!isInspectorOpen && (
                            <div className="sm:hidden absolute bottom-4 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-none animate-fadeIn">
                                <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center justify-between shadow-lg">
                                    <span>💡 Chạm để xem chi tiết & chọn phối màu</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => campusWorldState.toggleInspector(true)}
                                    className="pointer-events-auto w-full py-3 px-4 min-h-[44px] rounded-2xl bg-[#087F8C] hover:bg-[#076C77] text-white text-sm font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    aria-label="Xem sản phẩm trong phòng"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span>Xem sản phẩm</span>
                                </button>
                            </div>
                        )}

                        {/* Bottom Center: Role Speech & Exploration Hint */}
                        <div className="absolute bottom-24 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-10 pointer-events-none flex flex-col gap-2 animate-fadeIn">
                            {/* Character Speech Bubble */}
                            {currentSpeech && (
                                <div className="pointer-events-auto p-3 sm:p-3.5 rounded-2xl bg-[#183B3A]/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-start gap-2.5">
                                    <span className="text-base shrink-0">
                                        {activeRole === 'be-may' ? '👶' : activeRole === 'co-an' ? '👩‍🏫' : '👩'}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] font-bold text-[#8CE3CB] uppercase tracking-wider">
                                            {roleConfig.name} suy nghĩ
                                        </span>
                                        <p className="text-xs sm:text-[13px] leading-snug mt-0.5 text-white/95">
                                            "{currentSpeech}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation / Control Hint */}
                            <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white/80 text-[11px] font-medium border border-white/10 flex items-center justify-between gap-2">
                                <span>💡 Kéo để nhìn xung quanh • Bấm nệm để xem & đổi màu</span>
                                <span className="hidden sm:inline text-white/60">Phím W A S D để đi</span>
                            </div>
                        </div>

                        {/* 3. Right / Bottom Sheet Inspector Panel */}
                        <CampusInspector
                            isOpen={isInspectorOpen}
                            onClose={() => campusWorldState.toggleInspector(false)}
                            selectedInstance={selectedInstance}
                            isApproached={isApproached}
                            onToggleApproach={() => campusWorldState.setApproached(!isApproached)}
                            activeColorInfo={activeColorInfo}
                        />
                    </>
                )}
            </div>

            {/* 4. Interactive School Map Modal */}
            <CampusSchoolMapModal
                isOpen={isMapOpen}
                onClose={() => campusWorldState.toggleMap(false)}
                currentRoomId={currentRoomId}
                visitedRooms={visitedRooms}
            />

            {/* 5. Role Selection Modal */}
            <CampusRoleModal
                isOpen={isRoleSelectorOpen}
                onClose={() => campusWorldState.toggleRoleSelector(false)}
                activeRole={activeRole}
            />
        </div>,
        document.body
    );
}

export default CampusSchoolPOV;
