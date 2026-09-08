/**
 * HULA 360 Tour - Formal CMS Content Schema (tourSchema)
 * Complies with Instruction 03 §3: Structured, versioned CMS contract.
 */

import { RoleId, EventId, RendererMode } from '../types';

export interface TourCharacterSchema {
    id: RoleId;
    displayName: string;
    roleTitle: string;
    avatar: string;
    cameraHeight: number;
    armStyle: {
        sleeveColor?: string;
        sleeveLength: 'short';
        isChild: boolean;
        cuffDescription: string;
    };
    intro: string;
    quote: string;
}

export interface TourSceneSchema {
    id: string;
    title: string;
    assetId: string;
    initialCamera: {
        yaw: number;
        pitch: number;
        zoom?: number;
    };
}

export interface TourStepSchema {
    id: string;
    roleId: RoleId;
    eventId: EventId;
    stepIndex: number;
    title: string;
    speaker: RoleId;
    monologue: string;
    dialogue?: string;
    actionLabel: string;
    sceneId: string;
    cameraTarget: {
        yaw: number;
        pitch: number;
        zoom?: number;
    };
    checkpointLabel?: string;
}

export interface TourHotspotSchema {
    id: string;
    sceneId: string;
    x: number;
    y: number;
    label: string;
    category: 'material' | 'action' | 'feature' | 'info';
    title: string;
    description: string;
    imageUrl?: string;
    specDetail?: { label: string; value: string }[];
}

export interface TourAssetSchema {
    id: string;
    type: 'image' | 'panorama_equirectangular' | 'glb_model';
    url: string;
    title: string;
    verified: boolean;
    aspectRatio?: string;
}

export interface TourProductContentSchema {
    sku: string;
    name: string;
    dimensions: {
        open: string;
        folded: string;
        thickness: string;
    };
    fabric: string;
    careInstructionStatus: 'verified' | 'pending';
    careNotice: string;
}

export interface Tour360Data {
    id: string;
    schemaVersion: string;
    contentVersion: string;
    status: 'draft' | 'published';
    rendererMode: RendererMode;
    title: string;
    poster: string;
    characters: TourCharacterSchema[];
    scenes: TourSceneSchema[];
    steps: TourStepSchema[];
    hotspots: TourHotspotSchema[];
    assets: TourAssetSchema[];
    productContent: TourProductContentSchema[];
}

/**
 * Validates a Tour360Data payload
 */
export function validateTourData(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
        return { isValid: false, errors: ['Payload rỗng hoặc không phải object'] };
    }

    const payload = data as Partial<Tour360Data>;

    if (!payload.schemaVersion) errors.push('Thiếu schemaVersion');
    if (!payload.contentVersion) errors.push('Thiếu contentVersion');
    if (!payload.status || !['draft', 'published'].includes(payload.status)) {
        errors.push('Status không hợp lệ (phải là draft hoặc published)');
    }
    if (!payload.rendererMode || !['guided2d', 'panorama360', 'scene3d'].includes(payload.rendererMode)) {
        errors.push('rendererMode không hợp lệ (guided2d | panorama360 | scene3d)');
    }

    if (!Array.isArray(payload.characters) || payload.characters.length === 0) {
        errors.push('Danh sách characters không được rỗng');
    }

    if (!Array.isArray(payload.steps) || payload.steps.length === 0) {
        errors.push('Danh sách steps không được rỗng');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
