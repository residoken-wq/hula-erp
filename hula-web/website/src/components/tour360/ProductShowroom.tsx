/**
 * HULA 360 Product Showroom - Main Page / Modal Component (Instruction 06)
 * Orchestrates ShowroomHeader, ShowroomViewport, ColorConfiguratorPanel and Modals:
 * - Desktop: 1024px+ full viewport dialog layout matching design/desktop.png
 * - Mobile: 390x844 responsive stacked layout matching design/mobile.png
 * - Color and Scope contract compliance
 * - Accessible live-region announcements
 */

'use client';

import React from 'react';
import { useShowroomColorState } from './hooks/useShowroomColorState';
import { ShowroomHeader } from './ShowroomHeader';
import { ShowroomViewport } from './ShowroomViewport';
import { ColorConfiguratorPanel } from './ColorConfiguratorPanel';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { ShowroomHelpModal } from './ShowroomHelpModal';

interface ProductShowroomProps {
    onClose: () => void;
    onSwitchToRoleplay?: () => void;
}

export function ProductShowroom({ onClose, onSwitchToRoleplay }: ProductShowroomProps) {
    const {
        state,
        colorAnalysis,
        currentAngle,
        setColor,
        setScope,
        selectInstance,
        setAngle,
        openDetail,
        closeDetail,
        openHelp,
        closeHelp,
        dismissNotice,
    } = useShowroomColorState();

    return (
        <div
            className="fixed inset-0 z-50 w-screen h-screen bg-[#F7F8F5] flex flex-col overflow-hidden select-none"
            role="dialog"
            aria-modal="true"
            aria-label="Phối màu lớp học mầm non HULA"
        >
            {/* 1. Header Bar (72px desktop / 56px mobile) */}
            <ShowroomHeader
                onClose={onClose}
                onOpenHelp={openHelp}
                onSwitchToRoleplay={onSwitchToRoleplay}
            />

            {/* 2. Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 overflow-hidden">
                {/* Left: Viewport (Clean Unoccupied Room + 3 Camera Angles) */}
                <ShowroomViewport
                    currentAngle={currentAngle}
                    activeColorLabel={colorAnalysis.activeColorLabel}
                    onSelectAngle={setAngle}
                    pipelineNotice={state.pipelineNotice}
                    onDismissNotice={dismissNotice}
                />

                {/* Right: Color Configurator Panel (360px desktop / scrollable mobile) */}
                <ColorConfiguratorPanel
                    activeColorId={colorAnalysis.activeColorId}
                    activeColorLabel={colorAnalysis.activeColorLabel}
                    isMixed={colorAnalysis.isMixed}
                    scope={state.scope}
                    selectedInstanceId={state.selectedInstanceId}
                    instanceColors={state.instanceColors}
                    onSelectColor={setColor}
                    onSetScope={setScope}
                    onSelectInstance={selectInstance}
                    onOpenDetail={openDetail}
                />
            </main>

            {/* 3. Detail Drawer (Catalogue specs & photos) */}
            <ProductDetailDrawer
                isOpen={state.isDetailOpen}
                onClose={closeDetail}
            />

            {/* 4. Help Modal */}
            <ShowroomHelpModal
                isOpen={state.isHelpOpen}
                onClose={closeHelp}
            />

            {/* 5. Accessible Live Region for Screen Readers */}
            <div
                className="sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                {state.liveMessage}
            </div>
        </div>
    );
}

export default ProductShowroom;
