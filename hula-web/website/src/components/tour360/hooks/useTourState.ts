/**
 * HULA 360 Tour - State Management Hook (useTourState)
 * Implements 4-layer state architecture: activeRole, currentEvent, productState, progressByRole
 * Complies with Instruction 02 (04_AI-IDE_Instructions_Multi-Role.md) & Instruction 03.
 */

import { useReducer, useCallback } from 'react';
import { RoleId, EventId, ProductState, HandoverPhase, InspectorContent, TourStep } from '../types';
import { CHARACTERS, TIMELINE_EVENTS, TOUR_STEPS } from '../data/tourSeed';

export interface TourState {
    lifecycle: 'idle' | 'loading' | 'ready' | 'error';
    errorMessage?: string;

    // 1. Nhân vật đang điều khiển
    activeRole: RoleId;

    // 2. Mốc thời gian chung
    currentEvent: EventId;

    // 3. Trạng thái vật thể duy nhất
    productState: ProductState;
    // 3b. Tiến trình bàn giao vật thể mẫu (EV-06 / Instruction 04 §Prompt 03)
    handoverPhase: HandoverPhase;

    // 4. Tiến độ hành trình lưu theo vai
    progressByRole: Record<RoleId, number>;

    currentStepIndex: number;
    transitionLabel?: string; // Nhãn chuyển mốc thời gian

    // Camera State (Ownership model)
    camera: {
        yaw: number;
        pitch: number;
        zoom: number;
        isAutoPanning: boolean;
        isDragging: boolean;
    };

    // Inspector
    isInspectorOpen: boolean;
    inspectorContent?: InspectorContent;

    // Audio & Settings
    isMuted: boolean;
    isChildMode: boolean; // Giao diện đơn giản cho trẻ em (nút 56-64px, không thương mại)
    currentAudioText?: string;
    audioPlayingId?: string;
}

export type TourAction =
    | { type: 'SET_LIFECYCLE'; status: TourState['lifecycle']; error?: string }
    | { type: 'SWITCH_ROLE_SAME_MOMENT'; targetRole: RoleId }
    | { type: 'START_ROLE_JOURNEY'; targetRole: RoleId; fromBeginning?: boolean }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'SELECT_STEP'; index: number }
    | { type: 'START_HANDOVER' }
    | { type: 'COMPLETE_HANDOVER' }
    | { type: 'RESET_HANDOVER' }
    | { type: 'START_USER_DRAG' }
    | { type: 'END_USER_DRAG' }
    | { type: 'UPDATE_CAMERA'; yaw: number; pitch: number; zoom?: number }
    | { type: 'RECENTER_CAMERA' }
    | { type: 'OPEN_INSPECTOR'; content: InspectorContent }
    | { type: 'CLOSE_INSPECTOR' }
    | { type: 'TOGGLE_MUTE' }
    | { type: 'TOGGLE_CHILD_MODE'; enabled?: boolean }
    | { type: 'SET_AUDIO_TEXT'; text?: string; audioId?: string }
    | { type: 'STOP_AUDIO' }
    | { type: 'RESET_TOUR' };

const initialProductState: ProductState = {
    holder: 'mother',
    status: 'packed',
    location: 'door',
};

export const initialTourState: TourState = {
    lifecycle: 'ready',
    activeRole: 'CHAR-AN',
    currentEvent: 'EV-01',
    productState: initialProductState,
    handoverPhase: 'ready',
    progressByRole: {
        'CHAR-AN': 0,
        'CHAR-LINH': 0,
        'CHAR-MAY': 0,
    },
    currentStepIndex: 0,
    camera: {
        yaw: 0,
        pitch: 0,
        zoom: 1,
        isAutoPanning: false, // Default off per UX blueprint
        isDragging: false,
    },
    isInspectorOpen: false,
    isMuted: true, // Default mute for clean initial experience
    isChildMode: false,
};

function tourReducer(state: TourState, action: TourAction): TourState {
    switch (action.type) {
        case 'SET_LIFECYCLE':
            return {
                ...state,
                lifecycle: action.status,
                errorMessage: action.error,
            };

        // Cơ chế 1: Xem cùng thời điểm (Giữ nguyên event, productState, người đang giữ túi)
        case 'SWITCH_ROLE_SAME_MOMENT': {
            const targetRole = action.targetRole;
            if (targetRole === state.activeRole) return state;
            // Hoãn đổi vai nếu đang trong tiến trình bàn giao (Prompt 05)
            if (state.handoverPhase === 'transferring') return state;

            // Tra cứu xem vai đích có mặt trong sự kiện hiện tại không
            const eventObj = TIMELINE_EVENTS.find(e => e.id === state.currentEvent);
            if (!eventObj || !eventObj.presentRoles.includes(targetRole)) {
                // Không có mặt ở mốc này -> tự động chuyển sang cơ chế 2: Bắt đầu hành trình
                return tourReducer(state, { type: 'START_ROLE_JOURNEY', targetRole });
            }

            const targetSteps = TOUR_STEPS[targetRole] || [];
            // Tìm bước tương ứng với currentEvent
            const matchingIndex = targetSteps.findIndex(s => s.eventId === state.currentEvent);
            const newIndex = matchingIndex >= 0 ? matchingIndex : 0;
            const newStep = targetSteps[newIndex];

            return {
                ...state,
                activeRole: targetRole,
                currentStepIndex: newIndex,
                isChildMode: targetRole === 'CHAR-MAY',
                transitionLabel: undefined,
                camera: {
                    ...state.camera,
                    yaw: newStep?.cameraTarget.yaw ?? 0,
                    pitch: newStep?.cameraTarget.pitch ?? 0,
                    zoom: newStep?.cameraTarget.zoom ?? 1,
                    isAutoPanning: false,
                },
                currentAudioText: newStep?.monologue,
                audioPlayingId: undefined, // ngắt audio queue cũ
            };
        }

        // Cơ chế 2: Bắt đầu / Tiếp tục hành trình của vai khác (Replay / Resume)
        case 'START_ROLE_JOURNEY': {
            // Hoãn đổi vai nếu đang trong tiến trình bàn giao (Prompt 05)
            if (state.handoverPhase === 'transferring') return state;
            const targetRole = action.targetRole;
            const targetSteps = TOUR_STEPS[targetRole] || [];
            const savedProgress = action.fromBeginning ? 0 : (state.progressByRole[targetRole] || 0);
            const safeIndex = Math.min(savedProgress, targetSteps.length - 1);
            const newStep = targetSteps[safeIndex];
            const newEvent = newStep?.eventId || 'EV-01';
            const eventObj = TIMELINE_EVENTS.find(e => e.id === newEvent);

            const roleName = CHARACTERS[targetRole]?.displayName || targetRole;

            return {
                ...state,
                activeRole: targetRole,
                currentStepIndex: safeIndex,
                currentEvent: newEvent,
                isChildMode: targetRole === 'CHAR-MAY',
                transitionLabel: `Bắt đầu hành trình ${roleName} (${eventObj?.label || ''})`,
                productState: eventObj ? { ...eventObj.defaultProductState } : state.productState,
                camera: {
                    ...state.camera,
                    yaw: newStep?.cameraTarget.yaw ?? 0,
                    pitch: newStep?.cameraTarget.pitch ?? 0,
                    zoom: newStep?.cameraTarget.zoom ?? 1,
                    isAutoPanning: false,
                },
                currentAudioText: newStep?.monologue,
                audioPlayingId: undefined,
            };
        }

        case 'NEXT_STEP': {
            const steps = TOUR_STEPS[state.activeRole] || [];
            if (state.currentStepIndex >= steps.length - 1) {
                return state; // Đã ở bước cuối
            }
            const nextIndex = state.currentStepIndex + 1;
            const nextStep = steps[nextIndex];
            const nextEvent = nextStep.eventId;
            const eventObj = TIMELINE_EVENTS.find(e => e.id === nextEvent);

            return {
                ...state,
                currentStepIndex: nextIndex,
                currentEvent: nextEvent,
                transitionLabel: nextStep.checkpointLabel,
                progressByRole: {
                    ...state.progressByRole,
                    [state.activeRole]: Math.max(state.progressByRole[state.activeRole], nextIndex),
                },
                productState: eventObj ? { ...eventObj.defaultProductState } : state.productState,
                camera: {
                    ...state.camera,
                    yaw: nextStep.cameraTarget.yaw,
                    pitch: nextStep.cameraTarget.pitch,
                    zoom: nextStep.cameraTarget.zoom || 1,
                    isAutoPanning: false,
                },
                currentAudioText: nextStep.monologue,
                audioPlayingId: undefined,
            };
        }

        case 'PREV_STEP': {
            if (state.currentStepIndex <= 0) return state;
            const steps = TOUR_STEPS[state.activeRole] || [];
            const prevIndex = state.currentStepIndex - 1;
            const prevStep = steps[prevIndex];
            const prevEvent = prevStep.eventId;
            const eventObj = TIMELINE_EVENTS.find(e => e.id === prevEvent);

            return {
                ...state,
                currentStepIndex: prevIndex,
                currentEvent: prevEvent,
                transitionLabel: prevStep.checkpointLabel,
                productState: eventObj ? { ...eventObj.defaultProductState } : state.productState,
                camera: {
                    ...state.camera,
                    yaw: prevStep.cameraTarget.yaw,
                    pitch: prevStep.cameraTarget.pitch,
                    zoom: prevStep.cameraTarget.zoom || 1,
                    isAutoPanning: false,
                },
                currentAudioText: prevStep.monologue,
                audioPlayingId: undefined,
            };
        }

        case 'SELECT_STEP': {
            const steps = TOUR_STEPS[state.activeRole] || [];
            if (action.index < 0 || action.index >= steps.length) return state;
            const step = steps[action.index];
            const eventObj = TIMELINE_EVENTS.find(e => e.id === step.eventId);

            return {
                ...state,
                currentStepIndex: action.index,
                currentEvent: step.eventId,
                transitionLabel: step.checkpointLabel,
                productState: eventObj ? { ...eventObj.defaultProductState } : state.productState,
                camera: {
                    ...state.camera,
                    yaw: step.cameraTarget.yaw,
                    pitch: step.cameraTarget.pitch,
                    zoom: step.cameraTarget.zoom || 1,
                    isAutoPanning: false,
                },
                currentAudioText: step.monologue,
                audioPlayingId: undefined,
            };
        }

        case 'START_HANDOVER': {
            if (state.handoverPhase !== 'ready') return state; // Chống bấm đúp / kích hoạt lặp
            return {
                ...state,
                handoverPhase: 'transferring',
                transitionLabel: 'Đang bàn giao túi nệm...',
            };
        }

        case 'COMPLETE_HANDOVER': {
            if (state.handoverPhase !== 'transferring') return state;
            return {
                ...state,
                handoverPhase: 'received',
                transitionLabel: 'Mẹ Linh đã nhận túi an toàn',
                productState: {
                    holder: 'mother',
                    status: 'packed',
                    location: 'door',
                },
                progressByRole: {
                    ...state.progressByRole,
                    [state.activeRole]: Math.max(state.progressByRole[state.activeRole], state.currentStepIndex + 1),
                },
            };
        }

        case 'RESET_HANDOVER': {
            return {
                ...state,
                handoverPhase: 'ready',
                transitionLabel: 'Đã đặt lại vị trí túi',
                productState: {
                    holder: 'teacher',
                    status: 'packed',
                    location: 'door',
                },
            };
        }

        // Quyền Camera: Kéo -> HỦY AUTO-PAN NGAY LẬP TỨC (A06 requirement)
        case 'START_USER_DRAG':
            return {
                ...state,
                camera: {
                    ...state.camera,
                    isDragging: true,
                    isAutoPanning: false, // Bắt buộc tắt auto-pan ngay
                },
            };

        case 'END_USER_DRAG':
            return {
                ...state,
                camera: {
                    ...state.camera,
                    isDragging: false,
                },
            };

        case 'UPDATE_CAMERA':
            return {
                ...state,
                camera: {
                    ...state.camera,
                    yaw: action.yaw,
                    pitch: action.pitch,
                    zoom: action.zoom ?? state.camera.zoom,
                },
            };

        case 'RECENTER_CAMERA': {
            const steps = TOUR_STEPS[state.activeRole] || [];
            const step = steps[state.currentStepIndex];
            return {
                ...state,
                camera: {
                    ...state.camera,
                    yaw: step?.cameraTarget.yaw ?? 0,
                    pitch: step?.cameraTarget.pitch ?? 0,
                    zoom: step?.cameraTarget.zoom ?? 1,
                    isAutoPanning: false,
                },
            };
        }

        case 'OPEN_INSPECTOR':
            return {
                ...state,
                isInspectorOpen: true,
                inspectorContent: action.content,
                camera: {
                    ...state.camera,
                    isAutoPanning: false, // Tạm dừng chuyển động khi đọc chi tiết
                },
            };

        case 'CLOSE_INSPECTOR':
            return {
                ...state,
                isInspectorOpen: false,
                inspectorContent: undefined,
            };

        case 'TOGGLE_MUTE':
            return {
                ...state,
                isMuted: !state.isMuted,
            };

        case 'TOGGLE_CHILD_MODE':
            return {
                ...state,
                isChildMode: action.enabled ?? !state.isChildMode,
            };

        case 'SET_AUDIO_TEXT':
            return {
                ...state,
                currentAudioText: action.text,
                audioPlayingId: action.audioId,
            };

        case 'STOP_AUDIO':
            return {
                ...state,
                audioPlayingId: undefined,
            };

        case 'RESET_TOUR':
            return {
                ...initialTourState,
                progressByRole: state.progressByRole, // Giữ tiến độ đã đạt được trong phiên
            };

        default:
            return state;
    }
}

export function useTourState() {
    const [state, dispatch] = useReducer(tourReducer, initialTourState);

    const switchRoleSameMoment = useCallback((targetRole: RoleId) => {
        dispatch({ type: 'SWITCH_ROLE_SAME_MOMENT', targetRole });
    }, []);

    const startRoleJourney = useCallback((targetRole: RoleId, fromBeginning?: boolean) => {
        dispatch({ type: 'START_ROLE_JOURNEY', targetRole, fromBeginning });
    }, []);

    const nextStep = useCallback(() => {
        dispatch({ type: 'NEXT_STEP' });
    }, []);

    const prevStep = useCallback(() => {
        dispatch({ type: 'PREV_STEP' });
    }, []);

    const selectStep = useCallback((index: number) => {
        dispatch({ type: 'SELECT_STEP', index });
    }, []);

    const startUserDrag = useCallback(() => {
        dispatch({ type: 'START_USER_DRAG' });
    }, []);

    const endUserDrag = useCallback(() => {
        dispatch({ type: 'END_USER_DRAG' });
    }, []);

    const updateCamera = useCallback((yaw: number, pitch: number, zoom?: number) => {
        dispatch({ type: 'UPDATE_CAMERA', yaw, pitch, zoom });
    }, []);

    const recenterCamera = useCallback(() => {
        dispatch({ type: 'RECENTER_CAMERA' });
    }, []);

    const openInspector = useCallback((content: InspectorContent) => {
        dispatch({ type: 'OPEN_INSPECTOR', content });
    }, []);

    const closeInspector = useCallback(() => {
        dispatch({ type: 'CLOSE_INSPECTOR' });
    }, []);

    const toggleMute = useCallback(() => {
        dispatch({ type: 'TOGGLE_MUTE' });
    }, []);

    const toggleChildMode = useCallback((enabled?: boolean) => {
        dispatch({ type: 'TOGGLE_CHILD_MODE', enabled });
    }, []);

    const startHandover = useCallback(() => {
        dispatch({ type: 'START_HANDOVER' });
    }, []);

    const completeHandover = useCallback(() => {
        dispatch({ type: 'COMPLETE_HANDOVER' });
    }, []);

    const resetHandover = useCallback(() => {
        dispatch({ type: 'RESET_HANDOVER' });
    }, []);

    const resetTour = useCallback(() => {
        dispatch({ type: 'RESET_TOUR' });
    }, []);

    const getCurrentStep = useCallback((): TourStep | undefined => {
        const steps = TOUR_STEPS[state.activeRole] || [];
        return steps[state.currentStepIndex];
    }, [state.activeRole, state.currentStepIndex]);

    return {
        state,
        dispatch,
        getCurrentStep,
        switchRoleSameMoment,
        startRoleJourney,
        nextStep,
        prevStep,
        selectStep,
        startHandover,
        completeHandover,
        resetHandover,
        startUserDrag,
        endUserDrag,
        updateCamera,
        recenterCamera,
        openInspector,
        closeInspector,
        toggleMute,
        toggleChildMode,
        resetTour,
    };
}
