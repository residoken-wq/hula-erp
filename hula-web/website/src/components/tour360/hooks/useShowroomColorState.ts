/**
 * HULA 360 Product Showroom - State Management Hook
 * Strict implementation of Color and Asset Contract (Instruction 06):
 * - Scope handling: 'allMatchingProducts' vs 'selectedInstance'
 * - Single vs multi-instance recoloring
 * - 'mixed' ("Nhiều màu") state detection when instances diverge
 * - Scope toggle does NOT auto-repaint existing mats until next selection
 * - Angle switching retains instance colors
 */

import { useReducer, useMemo, useCallback } from 'react';
import {
    SHOWROOM_COLORS,
    SHOWROOM_INSTANCES,
    SHOWROOM_ANGLES,
    ShowroomColor,
    ShowroomAngle,
} from '../data/showroomConfig';

export type ShowroomScope = 'allMatchingProducts' | 'selectedInstance';
export type ShowroomAngleId = 'overview' | 'closeup' | 'storage';

export interface ShowroomState {
    activeAngle: ShowroomAngleId;
    scope: ShowroomScope;
    selectedInstanceId: string;
    instanceColors: Record<string, string>; // mat-01..mat-06 -> colorId
    isDetailOpen: boolean;
    isHelpOpen: boolean;
    liveMessage: string;
    pipelineNotice: string | null;
}

export type ShowroomAction =
    | { type: 'SET_COLOR'; colorId: string }
    | { type: 'SET_SCOPE'; scope: ShowroomScope }
    | { type: 'SELECT_INSTANCE'; instanceId: string }
    | { type: 'SET_ANGLE'; angleId: ShowroomAngleId }
    | { type: 'OPEN_DETAIL' }
    | { type: 'CLOSE_DETAIL' }
    | { type: 'OPEN_HELP' }
    | { type: 'CLOSE_HELP' }
    | { type: 'SET_PIPELINE_NOTICE'; notice: string | null };

const initialInstanceColors: Record<string, string> = {};
SHOWROOM_INSTANCES.forEach(inst => {
    initialInstanceColors[inst.id] = inst.defaultColorId;
});

export const initialShowroomState: ShowroomState = {
    activeAngle: 'overview',
    scope: 'allMatchingProducts',
    selectedInstanceId: 'mat-01',
    instanceColors: initialInstanceColors,
    isDetailOpen: false,
    isHelpOpen: false,
    liveMessage: 'Đã tải showroom phòng học HULA với 6 bộ Cotton Cara Xanh dương',
    pipelineNotice: null,
};

export function showroomReducer(state: ShowroomState, action: ShowroomAction): ShowroomState {
    switch (action.type) {
        case 'SET_COLOR': {
            const color = SHOWROOM_COLORS.find(c => c.id === action.colorId);
            const colorName = color ? color.label : action.colorId;

            if (state.scope === 'allMatchingProducts') {
                const newColors: Record<string, string> = {};
                Object.keys(state.instanceColors).forEach(k => {
                    newColors[k] = action.colorId;
                });
                return {
                    ...state,
                    instanceColors: newColors,
                    liveMessage: `Đã áp dụng màu ${colorName} cho toàn bộ lớp`,
                    pipelineNotice: action.colorId !== 'blue'
                        ? `Đã chọn màu ${colorName}. Ảnh phối cảnh đang dùng mẫu chuẩn Xanh dương. Pipeline 3D/Mask sẽ render trực tiếp lên vải khi có GLB mesh.`
                        : null,
                };
            } else {
                // Scope is selectedInstance
                const targetInstance = SHOWROOM_INSTANCES.find(i => i.id === state.selectedInstanceId);
                const instanceName = targetInstance ? targetInstance.label : state.selectedInstanceId;
                return {
                    ...state,
                    instanceColors: {
                        ...state.instanceColors,
                        [state.selectedInstanceId]: action.colorId,
                    },
                    liveMessage: `Đã áp dụng màu ${colorName} cho ${instanceName}`,
                    pipelineNotice: `Đã chọn màu ${colorName} cho ${instanceName}.`,
                };
            }
        }

        case 'SET_SCOPE': {
            if (state.scope === action.scope) return state;
            return {
                ...state,
                scope: action.scope,
                liveMessage: action.scope === 'allMatchingProducts'
                    ? 'Chuyển sang áp dụng màu cho Toàn bộ lớp'
                    : 'Chuyển sang áp dụng màu cho Một bộ',
            };
        }

        case 'SELECT_INSTANCE': {
            if (state.selectedInstanceId === action.instanceId && state.scope === 'selectedInstance') {
                return state;
            }
            const targetInstance = SHOWROOM_INSTANCES.find(i => i.id === action.instanceId);
            const instanceName = targetInstance ? targetInstance.label : action.instanceId;
            return {
                ...state,
                scope: 'selectedInstance',
                selectedInstanceId: action.instanceId,
                liveMessage: `Đang chọn ${instanceName}`,
            };
        }

        case 'SET_ANGLE': {
            if (state.activeAngle === action.angleId) return state;
            const angle = SHOWROOM_ANGLES.find(a => a.id === action.angleId);
            return {
                ...state,
                activeAngle: action.angleId,
                liveMessage: `Chuyển góc nhìn: ${angle?.label || action.angleId}`,
            };
        }

        case 'OPEN_DETAIL':
            return { ...state, isDetailOpen: true };

        case 'CLOSE_DETAIL':
            return { ...state, isDetailOpen: false };

        case 'OPEN_HELP':
            return { ...state, isHelpOpen: true };

        case 'CLOSE_HELP':
            return { ...state, isHelpOpen: false };

        case 'SET_PIPELINE_NOTICE':
            return { ...state, pipelineNotice: action.notice };

        default:
            return state;
    }
}

export function useShowroomColorState() {
    const [state, dispatch] = useReducer(showroomReducer, initialShowroomState);

    // Calculate whether all instances have the same color or 'mixed'
    const colorAnalysis = useMemo(() => {
        const colors = Object.values(state.instanceColors);
        const firstColor = colors[0];
        const isUniform = colors.every(c => c === firstColor);

        if (state.scope === 'selectedInstance') {
            const activeInstanceColor = state.instanceColors[state.selectedInstanceId];
            const colorObj = SHOWROOM_COLORS.find(c => c.id === activeInstanceColor);
            return {
                isUniform: false,
                activeColorId: activeInstanceColor,
                activeColorLabel: colorObj ? colorObj.label : 'Xanh dương',
                isMixed: false,
            };
        }

        if (isUniform) {
            const colorObj = SHOWROOM_COLORS.find(c => c.id === firstColor);
            return {
                isUniform: true,
                activeColorId: firstColor,
                activeColorLabel: colorObj ? colorObj.label : 'Xanh dương',
                isMixed: false,
            };
        }

        return {
            isUniform: false,
            activeColorId: 'mixed',
            activeColorLabel: 'Nhiều màu',
            isMixed: true,
        };
    }, [state.instanceColors, state.scope, state.selectedInstanceId]);

    // Active angle data
    const currentAngle = useMemo(() => {
        return SHOWROOM_ANGLES.find(a => a.id === state.activeAngle) || SHOWROOM_ANGLES[0];
    }, [state.activeAngle]);

    // Action creators
    const setColor = useCallback((colorId: string) => {
        dispatch({ type: 'SET_COLOR', colorId });
    }, []);

    const setScope = useCallback((scope: ShowroomScope) => {
        dispatch({ type: 'SET_SCOPE', scope });
    }, []);

    const selectInstance = useCallback((instanceId: string) => {
        dispatch({ type: 'SELECT_INSTANCE', instanceId });
    }, []);

    const setAngle = useCallback((angleId: ShowroomAngleId) => {
        dispatch({ type: 'SET_ANGLE', angleId });
    }, []);

    const openDetail = useCallback(() => {
        dispatch({ type: 'OPEN_DETAIL' });
    }, []);

    const closeDetail = useCallback(() => {
        dispatch({ type: 'CLOSE_DETAIL' });
    }, []);

    const openHelp = useCallback(() => {
        dispatch({ type: 'OPEN_HELP' });
    }, []);

    const closeHelp = useCallback(() => {
        dispatch({ type: 'CLOSE_HELP' });
    }, []);

    const dismissNotice = useCallback(() => {
        dispatch({ type: 'SET_PIPELINE_NOTICE', notice: null });
    }, []);

    return {
        state,
        dispatch,
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
    };
}
