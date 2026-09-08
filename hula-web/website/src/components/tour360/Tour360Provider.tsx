/**
 * HULA 360 Tour - Context Provider (Tour360Provider)
 * Supplies unified state, audio dispatcher and action handlers to all tour components.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useTourState, TourState, TourAction } from './hooks/useTourState';
import { useTourAudio } from './hooks/useTourAudio';
import { RoleId, TourStep, InspectorContent, TourHotspot } from './types';
import { CHARACTERS, TIMELINE_EVENTS } from './data/tourSeed';

interface TourContextValue {
    state: TourState;
    dispatch: React.Dispatch<TourAction>;
    currentStep?: TourStep;
    activeCharacterInfo: typeof CHARACTERS[string];
    currentTimelineEvent: typeof TIMELINE_EVENTS[0] | undefined;

    // Actions
    switchRoleSameMoment: (targetRole: RoleId) => void;
    startRoleJourney: (targetRole: RoleId, fromBeginning?: boolean) => void;
    nextStep: () => void;
    prevStep: () => void;
    selectStep: (index: number) => void;
    startUserDrag: () => void;
    endUserDrag: () => void;
    updateCamera: (yaw: number, pitch: number, zoom?: number) => void;
    recenterCamera: () => void;
    openInspector: (content: InspectorContent) => void;
    closeInspector: () => void;
    toggleMute: () => void;
    toggleChildMode: (enabled?: boolean) => void;
    resetTour: () => void;

    // Handover Actions (EV-06 Prompt 03)
    startHandover: () => void;
    completeHandover: () => void;
    resetHandover: () => void;

    // Audio
    playChime: (freq?: number, duration?: number) => void;
    playChildTouchSound: () => void;
    playSuccessSound: () => void;
    stopAudio: () => void;

    // CMS Settings
    settings?: any;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
    const ctx = useContext(TourContext);
    if (!ctx) {
        throw new Error('useTour must be used within a Tour360Provider');
    }
    return ctx;
}

interface Tour360ProviderProps {
    children: ReactNode;
    settings?: any;
}

export function Tour360Provider({ children, settings }: Tour360ProviderProps) {
    const tourStateHook = useTourState();
    const audioHook = useTourAudio(tourStateHook.state.isMuted);

    const currentStep = tourStateHook.getCurrentStep();
    const activeCharacterInfo = CHARACTERS[tourStateHook.state.activeRole] || CHARACTERS['CHAR-AN'];
    const currentTimelineEvent = TIMELINE_EVENTS.find(e => e.id === tourStateHook.state.currentEvent);

    // Bọc chuyển vai để ngắt audio queue cũ và phát chime
    const handleSwitchRoleSameMoment = (role: RoleId) => {
        audioHook.stopAudio();
        tourStateHook.switchRoleSameMoment(role);
        audioHook.playChime(440, 0.15);
    };

    const handleStartRoleJourney = (role: RoleId, fromBeginning?: boolean) => {
        audioHook.stopAudio();
        tourStateHook.startRoleJourney(role, fromBeginning);
        audioHook.playChime(440, 0.15);
    };

    const handleNextStep = () => {
        audioHook.stopAudio();
        tourStateHook.nextStep();
        audioHook.playSuccessSound();
    };

    const handlePrevStep = () => {
        audioHook.stopAudio();
        tourStateHook.prevStep();
        audioHook.playChime(350, 0.15);
    };

    const handleResetTour = () => {
        audioHook.stopAudio();
        tourStateHook.resetTour();
    };

    const handleStartHandover = () => {
        if (tourStateHook.state.handoverPhase !== 'ready') return;
        tourStateHook.startHandover();
        audioHook.playChime(520, 0.2);
        // Kích hoạt mốc chuyển giao vật thể sau 800ms
        setTimeout(() => {
            tourStateHook.completeHandover();
            audioHook.playSuccessSound();
        }, 800);
    };

    const handleResetHandover = () => {
        tourStateHook.resetHandover();
        audioHook.playChime(350, 0.15);
    };

    const value: TourContextValue = {
        state: tourStateHook.state,
        dispatch: tourStateHook.dispatch,
        currentStep,
        activeCharacterInfo,
        currentTimelineEvent,

        switchRoleSameMoment: handleSwitchRoleSameMoment,
        startRoleJourney: handleStartRoleJourney,
        nextStep: handleNextStep,
        prevStep: handlePrevStep,
        selectStep: tourStateHook.selectStep,
        startHandover: handleStartHandover,
        completeHandover: tourStateHook.completeHandover,
        resetHandover: handleResetHandover,
        startUserDrag: tourStateHook.startUserDrag,
        endUserDrag: tourStateHook.endUserDrag,
        updateCamera: tourStateHook.updateCamera,
        recenterCamera: tourStateHook.recenterCamera,
        openInspector: tourStateHook.openInspector,
        closeInspector: tourStateHook.closeInspector,
        toggleMute: tourStateHook.toggleMute,
        toggleChildMode: tourStateHook.toggleChildMode,
        resetTour: handleResetTour,

        playChime: audioHook.playChime,
        playChildTouchSound: audioHook.playChildTouchSound,
        playSuccessSound: audioHook.playSuccessSound,
        stopAudio: audioHook.stopAudio,
        settings,
    };

    return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
