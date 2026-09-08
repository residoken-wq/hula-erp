/**
 * HULA 360 Tour - Core Type Definitions
 * Covers 4-layer state architecture: activeRole, currentEvent, productState, progressByRole
 */

export type RoleId = 'CHAR-AN' | 'CHAR-LINH' | 'CHAR-MAY';

export type EventId = 'EV-01' | 'EV-02' | 'EV-03' | 'EV-04' | 'EV-05' | 'EV-06';

export type RendererMode = 'guided2d' | 'panorama360' | 'scene3d';

export type ProductHolder = 'mother' | 'teacher' | 'child' | 'cubby' | 'table' | 'floor';

export type ProductStatus =
    | 'packed'          // Gói trọn vẹn trong túi
    | 'table_demo'      // Mở trên bàn demo cho phụ huynh xem
    | 'cubby_stored'    // Đặt trong ngăn tủ cá nhân
    | 'mat_spread'      // Nệm đã trải trên sàn
    | 'pillow_placed'   // Nệm trải + gối đặt ở đầu
    | 'mat_folded';     // Nệm gấp lại chuẩn bị cất

export interface ProductState {
    holder: ProductHolder;
    status: ProductStatus;
    location: 'door' | 'table' | 'cubby' | 'rest_area';
}

export type HandoverPhase = 'ready' | 'transferring' | 'received';

export interface TourCharacter {
    id: RoleId;
    displayName: string;
    roleTitle: string;
    avatar: string; // Emoji fallback
    avatarUrl?: string; // High-resolution cropped portrait from official references
    intro: string;
    cameraHeight: number; // 1.55m, 1.60m, 0.95m
    armStyle: {
        sleeveColor?: string;
        sleeveLength: 'short';
        isChild: boolean;
        cuffDescription: string;
    };
    quote: string;
}

export interface TourStep {
    id: string; // 'CA-01'..'CA-06', 'PH-01'..'PH-06', 'BE-01'..'BE-06'
    roleId: RoleId;
    eventId: EventId;
    stepIndex: number;
    title: string;
    speaker: RoleId;
    monologue: string;   // Suy nghĩ nội tâm (dùng "mình...")
    dialogue?: string;   // Lời nói trực tiếp ("cô / mẹ / con...")
    actionLabel: string; // Nhãn nút hành động
    sceneAssetId: string;
    cameraTarget: {
        yaw: number;
        pitch: number;
        zoom?: number;
    };
    coopAnimation?: {
        primaryActor: RoleId;
        assistingActor?: RoleId;
        actionType: 'handover' | 'inspect' | 'unfold' | 'place_pillow' | 'fold' | 'store';
        hint: string;
    };
    nextStepId?: string;
    checkpointLabel?: string; // Nhãn mốc chuyển thời gian (ví dụ "Sau giờ nghỉ", "Cuối tuần — giờ đón trẻ")
    audioUrl?: string;
}

export interface TimelineEvent {
    id: EventId;
    name: string;
    label: string;
    presentRoles: RoleId[];
    description: string;
    defaultProductState: ProductState;
}

export interface TourHotspot {
    id: string;
    sceneId: string;
    x: number; // Tỷ lệ tọa độ % (0..100)
    y: number; // Tỷ lệ tọa độ % (0..100)
    label: string;
    category: 'material' | 'action' | 'feature' | 'info';
    title: string;
    description: string;
    specDetail?: {
        label: string;
        value: string;
    }[];
    imageUrl?: string;
}

export interface TourAsset {
    id: string;
    type: 'image' | 'panorama_equirectangular' | 'glb_model';
    url: string;
    title: string;
    verified: boolean;
}

export interface InspectorContent {
    type: 'hotspot' | 'product_spec' | 'care_guide' | 'role_info';
    title: string;
    subtitle?: string;
    badge?: string;
    description?: string;
    imageUrl?: string;
    specs?: { label: string; value: string }[];
    notice?: string;
}
