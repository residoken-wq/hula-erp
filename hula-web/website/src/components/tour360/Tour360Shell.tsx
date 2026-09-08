/**
 * HULA 360 Tour - Main Modal Shell (Tour360Shell)
 * Replaces the 1720-LOC monolithic Classroom360Modal.
 * Orchestrates subcomponents, handles accessibility, responsive layouts and focus management.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Tour360Provider, useTour } from './Tour360Provider';
import { TourHeader } from './TourHeader';
import { TourViewport } from './TourViewport';
import { TourControls } from './TourControls';
import { JourneyCard } from './JourneyCard';
import { ChildJourneyCard } from './ChildJourneyCard';
import { TourInspector } from './TourInspector';
import { CharacterSelection } from './CharacterSelection';
import { ProductShowroom } from './ProductShowroom';

interface Tour360ShellProps {
    isOpen: boolean;
    onClose: () => void;
    settings?: any;
    initialMode?: 'showroom' | 'roleplay';
}

function TourContent({
    onClose,
    onSwitchToShowroom,
}: {
    onClose: () => void;
    onSwitchToShowroom?: () => void;
}) {
    const { state, closeInspector } = useTour();
    const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);

    // Global keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (state.isInspectorOpen) {
                    closeInspector();
                } else if (isRoleSelectorOpen) {
                    setIsRoleSelectorOpen(false);
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [state.isInspectorOpen, isRoleSelectorOpen, closeInspector, onClose]);

    return (
        <div
            className="fixed inset-0 z-[9999] w-screen h-screen bg-black select-none overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Trải nghiệm Lớp học 360 độ HULA"
        >
            {/* Top Bar Header */}
            <TourHeader
                onClose={onClose}
                onOpenRoleSelector={() => setIsRoleSelectorOpen(true)}
                onSwitchToShowroom={onSwitchToShowroom}
            />

            {/* Main Interactive Viewport */}
            <TourViewport />

            {/* Floating Camera / Utility Controls */}
            <TourControls />

            {/* Bottom Card: Child mode vs Adult mode */}
            {state.isChildMode ? <ChildJourneyCard /> : <JourneyCard />}

            {/* Unified Inspector Panel */}
            <TourInspector />

            {/* Role Selection Modal */}
            <CharacterSelection
                isOpen={isRoleSelectorOpen}
                onClose={() => setIsRoleSelectorOpen(false)}
            />
        </div>
    );
}

export default function Tour360Shell({
    isOpen,
    onClose,
    settings,
    initialMode = 'showroom',
}: Tour360ShellProps) {
    const [activeMode, setActiveMode] = useState<'showroom' | 'roleplay'>(initialMode);

    // Prevent body scrolling while modal is open & hide external widgets
    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = 'hidden';
        document.body.classList.add('tour-360-active');

        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('tour-360-active');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Showroom mode is the primary default per Instruction 06
    if (activeMode === 'showroom') {
        return (
            <ProductShowroom
                onClose={onClose}
                onSwitchToRoleplay={() => setActiveMode('roleplay')}
            />
        );
    }

    return (
        <Tour360Provider settings={settings}>
            <TourContent
                onClose={onClose}
                onSwitchToShowroom={() => setActiveMode('showroom')}
            />
        </Tour360Provider>
    );
}

