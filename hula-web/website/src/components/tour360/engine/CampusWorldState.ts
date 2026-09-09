/**
 * CampusWorldState.ts
 * Manages session-level campus state for HULA-360 School POV (Instruction 07):
 * - Role & Eye height design specs: Cô An (1.55m), Mẹ Linh (1.60m), Bé Mây (0.95m)
 * - Persistent room & product instances (colors, fold state, storage slot)
 * - Room navigation (H0 Corridor + R1-R7 rooms)
 * - Scope: 'selectedInstance' | 'matchingProductsInCurrentRoom'
 * - Single source of truth across room transitions
 */

export type RoleId = 'co-an' | 'me-linh' | 'be-may';
export type RoomId = 'H0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7';
export type ColorScope = 'selectedInstance' | 'matchingProductsInCurrentRoom';

export interface RoleConfig {
    id: RoleId;
    name: string;
    title: string;
    eyeHeight: number; // in meters
    description: string;
    speechLines: Record<RoomId, string>;
}

export const ROLES: Record<RoleId, RoleConfig> = {
    'me-linh': {
        id: 'me-linh',
        name: 'Mẹ Linh',
        title: 'Phụ huynh tìm hiểu',
        eyeHeight: 1.60,
        description: 'Tôi muốn nhìn kỹ bộ nệm Mây sẽ dùng và quan sát cách trường chuẩn bị cho con.',
        speechLines: {
            H0: 'Mình đi dọc hành lang để tìm hiểu các lớp học của trường.',
            R1: 'Mình muốn nhìn kỹ bộ nệm Mây sẽ dùng. Thử đổi màu và lại gần xem chất vải.',
            R2: 'Bộ Satin này khác bộ Cara vừa xem ở điểm nào? Mình xem kích thước và viền.',
            R3: 'Mình xem bộ nệm foam được cô giáo gấp gọn và cất lên kệ như thế nào.',
            R4: 'Mình xem kỹ phần chăn và kích thước túi ngủ của con.',
            R5: 'Mình cần nhận ra túi của Mây trên kệ trước giờ đón.',
            R6: 'Mình xem đồ được dùng và cất trong lớp thế nào trước khi sang phòng bàn giao.',
            R7: 'Em chào cô An, em đến đón Mây và kiểm tra túi đồ của con.',
        },
    },
    'co-an': {
        id: 'co-an',
        name: 'Cô An',
        title: 'Giáo viên phụ trách',
        eyeHeight: 1.55,
        description: 'Tôi kiểm tra cách bố trí nệm, phối màu đồng bộ và chuẩn bị giờ đón trẻ.',
        speechLines: {
            H0: 'Mình kiểm tra các phòng học chuẩn bị đón các con vào tuần mới.',
            R1: 'Mình phối màu đồng bộ cho các bộ nệm của Lớp Lá, kiểm tra viền và chần gòn.',
            R2: 'Mình xem dòng nệm Satin và cách bài trí trong không gian lớp.',
            R3: 'Mình thử gấp và cất bộ foam bốn khúc lên kệ cubby.',
            R4: 'Mình so sánh cấu tạo phần chăn tiêu chuẩn và nâng cao của túi ngủ.',
            R5: 'Mình kiểm tra quai xách, khóa kéo và nhãn tên trước khi xếp vào ô tủ.',
            R6: 'Mình sắp xếp phối hợp các nhóm nệm, túi ngủ và kệ túi cho cả lớp.',
            R7: 'Chào mẹ Linh, cô đã chuẩn bị sẵn túi đồ cuối tuần của bé Mây.',
        },
    },
    'be-may': {
        id: 'be-may',
        name: 'Bé Mây',
        title: 'Học sinh Lớp Mầm',
        eyeHeight: 0.95,
        description: 'Con tự do khám phá góc lớp, tìm chiếc nệm màu đẹp và nhận ra túi của con.',
        speechLines: {
            H0: 'Con tung tăng đi dọc hành lang trường mầm non!',
            R1: 'Con thử chọn màu con thích nhé! Nệm màu Cam hay màu Vàng đẹp hơn?',
            R2: 'Con đi tới bộ nệm êm ái bên cửa sổ xem nào!',
            R3: 'Con xem chiếc nệm được gấp 4 khúc gọn gàng thế nào nhé!',
            R4: 'Con thích chiếc túi ngủ ấm áp có chăn đắp này!',
            R5: 'Con tìm nhãn tên Mây trên kệ túi của lớp mình!',
            R6: 'Con đi theo dấu chân đến góc đồ chơi và góc nghỉ trưa của con!',
            R7: 'Con chào cô An! Con đã nhận ra chiếc túi Lớp Mầm của con rồi!',
        },
    },
};

export interface ColorOption {
    id: string;
    label: string;
    previewHex: string;
}

export const CARA_COLORS: ColorOption[] = [
    { id: 'blue', label: 'Xanh dương', previewHex: '#56C5ED' },
    { id: 'green', label: 'Xanh lá', previewHex: '#ACD942' },
    { id: 'mint', label: 'Xanh ngọc', previewHex: '#8CE3CB' },
    { id: 'orange', label: 'Cam', previewHex: '#FFC076' },
    { id: 'yellow', label: 'Vàng', previewHex: '#F5E978' },
    { id: 'pink', label: 'Hồng', previewHex: '#EFA9D7' },
];

export const SATIN_COLORS: ColorOption[] = [
    { id: 'satin-mint', label: 'Xanh ngọc', previewHex: '#78C4B8' },
    { id: 'satin-pink', label: 'Hồng phấn', previewHex: '#F7C5CC' },
    { id: 'satin-gold', label: 'Vàng kem', previewHex: '#F5E4B5' },
    { id: 'satin-gray', label: 'Ghi sáng', previewHex: '#D4DDD9' },
];

export interface RoomMeta {
    id: RoomId;
    name: string;
    title: string;
    productReference: string;
    doorPos: [number, number, number];
    spawnPos: [number, number, number];
    lookAtPos: [number, number, number];
}

export const ROOMS: Record<RoomId, RoomMeta> = {
    H0: {
        id: 'H0',
        name: 'Hành Lang',
        title: 'Hành Lang Trường Mầm Non HULA',
        productReference: '',
        doorPos: [0, 0, 0.5],
        spawnPos: [0, 0, 1.0],
        lookAtPos: [0, 0, 10],
    },
    R1: {
        id: 'R1',
        name: 'Lớp Lá',
        title: 'Lớp Lá · Cotton Cara (REF-MAT-CARA-STD)',
        productReference: 'REF-MAT-CARA-STD',
        doorPos: [-2, 0, 4],
        spawnPos: [-3.5, 0, 4],
        lookAtPos: [-6, 0, 4],
    },
    R2: {
        id: 'R2',
        name: 'Lớp Nắng',
        title: 'Lớp Nắng · Satin (REF-MAT-SATIN-STD)',
        productReference: 'REF-MAT-SATIN-STD',
        doorPos: [2, 0, 4],
        spawnPos: [3.5, 0, 4],
        lookAtPos: [6, 0, 4],
    },
    R3: {
        id: 'R3',
        name: 'Lớp Mầm',
        title: 'Lớp Mầm · Nệm Foam (REF-FOAM-FOLD4)',
        productReference: 'REF-FOAM-FOLD4',
        doorPos: [-2, 0, 11],
        spawnPos: [-3.5, 0, 11],
        lookAtPos: [-6, 0, 11],
    },
    R4: {
        id: 'R4',
        name: 'Lớp Mây',
        title: 'Lớp Mây · Túi Ngủ (REF-SLEEP-CARA-STD)',
        productReference: 'REF-SLEEP-CARA-STD',
        doorPos: [2, 0, 11],
        spawnPos: [3.5, 0, 11],
        lookAtPos: [6, 0, 11],
    },
    R5: {
        id: 'R5',
        name: 'Góc Gọn Gàng',
        title: 'Góc Gọn Gàng · Túi Bảo Quản (REF-BAG-*)',
        productReference: 'REF-BAG-HANDLE',
        doorPos: [-2, 0, 18],
        spawnPos: [-3.5, 0, 18],
        lookAtPos: [-6, 0, 18],
    },
    R6: {
        id: 'R6',
        name: 'Lớp HULA',
        title: 'Lớp HULA · Phối Hợp Đa Sản Phẩm',
        productReference: 'MIXED',
        doorPos: [2, 0, 18],
        spawnPos: [3.5, 0, 18],
        lookAtPos: [6, 0, 18],
    },
    R7: {
        id: 'R7',
        name: 'Phòng Đón Bé',
        title: 'Phòng Đón Bé · Bàn Giao Cuối Tuần',
        productReference: 'REF-BAG-HANDLE',
        doorPos: [0, 0, 23],
        spawnPos: [0, 0, 24.5],
        lookAtPos: [0, 0, 27],
    },
};

export interface CampusInstance {
    id: string;
    roomId: RoomId;
    productReference: string;
    label: string;
    colorId: string;
    position: [number, number, number];
    approachAnchor: [number, number, number];
    lookTarget: [number, number, number];
    folded?: boolean;
    stored?: boolean;
}

export class CampusWorldStateStore {
    public activeRole: RoleId = 'me-linh';
    public currentRoomId: RoomId = 'R1'; // Start in R1 as recommended for immediate product interaction
    public selectedInstanceId: string | null = 'Cara-02';
    public approachedInstanceId: string | null = null;
    public scope: ColorScope = 'selectedInstance';
    public visitedRooms: Set<RoomId> = new Set<RoomId>(['R1']);
    public isInspectorOpen: boolean = true;
    public isMapOpen: boolean = false;
    public isRoleSelectorOpen: boolean = false;

    // Persistent instances map
    public instances: Record<string, CampusInstance> = {
        // R1: 6 Cara instances
        'Cara-01': {
            id: 'Cara-01',
            roomId: 'R1',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ 01 · Cotton Cara',
            colorId: 'blue',
            position: [-7.5, 0.02, 2.5],
            approachAnchor: [-7.5, 0.7, 1.6],
            lookTarget: [-7.5, 0.05, 2.5],
        },
        'Cara-02': {
            id: 'Cara-02',
            roomId: 'R1',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ 02 · Cotton Cara',
            colorId: 'blue',
            position: [-6.0, 0.02, 2.5],
            approachAnchor: [-6.0, 0.7, 1.6],
            lookTarget: [-6.0, 0.05, 2.5],
        },
        'Cara-03': {
            id: 'Cara-03',
            roomId: 'R1',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ 03 · Cotton Cara',
            colorId: 'blue',
            position: [-4.5, 0.02, 2.5],
            approachAnchor: [-4.5, 0.7, 1.6],
            lookTarget: [-4.5, 0.05, 2.5],
        },
        'Cara-04': {
            id: 'Cara-04',
            roomId: 'R1',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ 04 · Cotton Cara',
            colorId: 'blue',
            position: [-7.5, 0.02, 5.5],
            approachAnchor: [-7.5, 0.7, 4.6],
            lookTarget: [-7.5, 0.05, 5.5],
        },
        'Cara-05': {
            id: 'Cara-05',
            roomId: 'R1',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ 05 · Cotton Cara',
            colorId: 'blue',
            position: [-6.0, 0.02, 5.5],
            approachAnchor: [-6.0, 0.7, 4.6],
            lookTarget: [-6.0, 0.05, 5.5],
        },
        'Cara-06': {
            id: 'Cara-06',
            roomId: 'R1',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ 06 · Cotton Cara',
            colorId: 'blue',
            position: [-4.5, 0.02, 5.5],
            approachAnchor: [-4.5, 0.7, 4.6],
            lookTarget: [-4.5, 0.05, 5.5],
        },

        // R2: 3 Satin Bedding instances
        'Satin-01': {
            id: 'Satin-01',
            roomId: 'R2',
            productReference: 'REF-MAT-SATIN-STD',
            label: 'Bộ 01 · Satin Hàn Quốc',
            colorId: 'satin-mint',
            position: [4.8, 0.02, 2.8],
            approachAnchor: [4.8, 0.7, 1.9],
            lookTarget: [4.8, 0.05, 2.8],
        },
        'Satin-02': {
            id: 'Satin-02',
            roomId: 'R2',
            productReference: 'REF-MAT-SATIN-STD',
            label: 'Bộ 02 · Satin Hàn Quốc',
            colorId: 'satin-pink',
            position: [6.3, 0.02, 2.8],
            approachAnchor: [6.3, 0.7, 1.9],
            lookTarget: [6.3, 0.05, 2.8],
        },
        'Satin-03': {
            id: 'Satin-03',
            roomId: 'R2',
            productReference: 'REF-MAT-SATIN-STD',
            label: 'Bộ 03 · Satin Hàn Quốc',
            colorId: 'satin-gold',
            position: [7.8, 0.02, 2.8],
            approachAnchor: [7.8, 0.7, 1.9],
            lookTarget: [7.8, 0.05, 2.8],
        },

        // R3: Foam instances
        'Foam-Fold4-01': {
            id: 'Foam-Fold4-01',
            roomId: 'R3',
            productReference: 'REF-FOAM-FOLD4',
            label: 'Nệm Foam Gấp 4 Khúc',
            colorId: 'blue',
            position: [-6.0, 0.03, 10.2],
            approachAnchor: [-6.0, 0.8, 9.2],
            lookTarget: [-6.0, 0.05, 10.2],
            folded: false,
            stored: false,
        },
        'Foam-Basic-01': {
            id: 'Foam-Basic-01',
            roomId: 'R3',
            productReference: 'REF-FOAM-BASIC',
            label: 'Nệm Foam Cơ Bản',
            colorId: 'cream',
            position: [-4.2, 0.03, 10.2],
            approachAnchor: [-4.2, 0.8, 9.2],
            lookTarget: [-4.2, 0.05, 10.2],
            folded: false,
            stored: false,
        },

        // R4: Sleeping Bag instances
        'Sleep-Cara-Std-01': {
            id: 'Sleep-Cara-Std-01',
            roomId: 'R4',
            productReference: 'REF-SLEEP-CARA-STD',
            label: 'Túi Ngủ Cara Tiêu Chuẩn',
            colorId: 'blue',
            position: [4.8, 0.02, 10.5],
            approachAnchor: [4.8, 0.7, 9.5],
            lookTarget: [4.8, 0.05, 10.5],
        },
        'Sleep-Cara-Plus-01': {
            id: 'Sleep-Cara-Plus-01',
            roomId: 'R4',
            productReference: 'REF-SLEEP-CARA-PLUS',
            label: 'Túi Ngủ Cara Nâng Cao (Chần Gòn)',
            colorId: 'orange',
            position: [7.2, 0.02, 10.5],
            approachAnchor: [7.2, 0.7, 9.5],
            lookTarget: [7.2, 0.05, 10.5],
        },

        // R5: Storage Bag instances (5 types)
        'Bag-Drawstring-01': {
            id: 'Bag-Drawstring-01',
            roomId: 'R5',
            productReference: 'REF-BAG-DRAWSTRING',
            label: 'Balo Dây Rút',
            colorId: 'pink',
            position: [-7.6, 0.4, 17],
            approachAnchor: [-7.6, 0.7, 16.2],
            lookTarget: [-7.6, 0.4, 17],
            stored: false,
        },
        'Bag-Handle-01': {
            id: 'Bag-Handle-01',
            roomId: 'R5',
            productReference: 'REF-BAG-HANDLE',
            label: 'Túi Quai Xách (Có Quai)',
            colorId: 'teal',
            position: [-6.8, 0.4, 17],
            approachAnchor: [-6.8, 0.7, 16.2],
            lookTarget: [-6.8, 0.4, 17],
            stored: false,
        },
        'Bag-Shoulder-01': {
            id: 'Bag-Shoulder-01',
            roomId: 'R5',
            productReference: 'REF-BAG-SHOULDER',
            label: 'Túi Quai Đeo Chéo',
            colorId: 'green',
            position: [-6.0, 0.4, 17],
            approachAnchor: [-6.0, 0.7, 16.2],
            lookTarget: [-6.0, 0.4, 17],
            stored: false,
        },
        'Bag-Box-01': {
            id: 'Bag-Box-01',
            roomId: 'R5',
            productReference: 'REF-BAG-BOX',
            label: 'Túi Hộp Khóa Mặt Trên',
            colorId: 'orange',
            position: [-5.2, 0.4, 17],
            approachAnchor: [-5.2, 0.7, 16.2],
            lookTarget: [-5.2, 0.4, 17],
            stored: false,
        },
        'Bag-BoxStitch-01': {
            id: 'Bag-BoxStitch-01',
            roomId: 'R5',
            productReference: 'REF-BAG-BOX-STITCH',
            label: 'Túi Hộp Diễu Viền',
            colorId: 'blue',
            position: [-4.4, 0.4, 17],
            approachAnchor: [-4.4, 0.7, 16.2],
            lookTarget: [-4.4, 0.4, 17],
            stored: false,
        },

        // R6: Lớp HULA — Phối Hợp Đa Sản Phẩm (5 Categories)
        // Khu A: Cotton Cara (2 sets)
        'R6-Cara-01': {
            id: 'R6-Cara-01',
            roomId: 'R6',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ Cara 01 · Khu Nghỉ',
            colorId: 'blue',
            position: [4.6, 0.02, 16.2],
            approachAnchor: [4.6, 0.7, 15.3],
            lookTarget: [4.6, 0.05, 16.2],
        },
        'R6-Cara-02': {
            id: 'R6-Cara-02',
            roomId: 'R6',
            productReference: 'REF-MAT-CARA-STD',
            label: 'Bộ Cara 02 · Khu Nghỉ',
            colorId: 'orange',
            position: [4.6, 0.02, 18.5],
            approachAnchor: [4.6, 0.7, 17.6],
            lookTarget: [4.6, 0.05, 18.5],
        },

        // Khu B: Satin Hàn Quốc (2 sets)
        'R6-Satin-01': {
            id: 'R6-Satin-01',
            roomId: 'R6',
            productReference: 'REF-MAT-SATIN-STD',
            label: 'Bộ Satin 01 · Khu Nghỉ',
            colorId: 'satin-mint',
            position: [6.3, 0.02, 16.2],
            approachAnchor: [6.3, 0.7, 15.3],
            lookTarget: [6.3, 0.05, 16.2],
        },
        'R6-Satin-02': {
            id: 'R6-Satin-02',
            roomId: 'R6',
            productReference: 'REF-MAT-SATIN-STD',
            label: 'Bộ Satin 02 · Khu Nghỉ',
            colorId: 'satin-pink',
            position: [6.3, 0.02, 18.5],
            approachAnchor: [6.3, 0.7, 17.6],
            lookTarget: [6.3, 0.05, 18.5],
        },

        // Khu C: Nệm Foam Gấp 4 (1 set)
        'R6-Foam-01': {
            id: 'R6-Foam-01',
            roomId: 'R6',
            productReference: 'REF-FOAM-FOLD4',
            label: 'Nệm Foam Gấp 4 · Góc Tiện Lợi',
            colorId: 'blue',
            position: [8.0, 0.03, 16.2],
            approachAnchor: [8.0, 0.8, 15.2],
            lookTarget: [8.0, 0.05, 16.2],
            folded: false,
            stored: false,
        },

        // Khu D: Túi Ngủ Cara (1 set)
        'R6-Sleep-01': {
            id: 'R6-Sleep-01',
            roomId: 'R6',
            productReference: 'REF-SLEEP-CARA-STD',
            label: 'Túi Ngủ Cara · Góc Trải Nghiệm',
            colorId: 'orange',
            position: [8.0, 0.02, 18.5],
            approachAnchor: [8.0, 0.7, 17.5],
            lookTarget: [8.0, 0.05, 18.5],
        },

        // Kệ E: Túi Bảo Quản (2 bags)
        'R6-Bag-01': {
            id: 'R6-Bag-01',
            roomId: 'R6',
            productReference: 'REF-BAG-HANDLE',
            label: 'Túi Quai Xách (hula_bag.glb)',
            colorId: 'teal',
            position: [5.8, 0.4, 20.3],
            approachAnchor: [5.8, 0.7, 19.5],
            lookTarget: [5.8, 0.4, 20.3],
            stored: false,
        },
        'R6-Bag-02': {
            id: 'R6-Bag-02',
            roomId: 'R6',
            productReference: 'REF-BAG-DRAWSTRING',
            label: 'Balo Dây Rút Mầm Non',
            colorId: 'pink',
            position: [6.8, 0.4, 20.3],
            approachAnchor: [6.8, 0.7, 19.5],
            lookTarget: [6.8, 0.4, 20.3],
            stored: false,
        },
    };

    private listeners: Set<() => void> = new Set();

    public subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        this.listeners.forEach(fn => fn());
    }

    public setRole(roleId: RoleId) {
        if (this.activeRole === roleId) return;
        this.activeRole = roleId;
        this.notify();
    }

    public setRoom(roomId: RoomId) {
        if (!ROOMS[roomId]) {
            console.warn(`[CampusWorldState] Phòng không hợp lệ: ${roomId}. Giữ nguyên phòng hiện tại.`);
            return;
        }
        if (this.currentRoomId === roomId) return;
        this.currentRoomId = roomId;
        this.visitedRooms.add(roomId);
        this.approachedInstanceId = null;

        // Pick first instance in new room if available
        const roomInstances = Object.values(this.instances).filter(i => i.roomId === roomId);
        if (roomInstances.length > 0) {
            this.selectedInstanceId = roomInstances[0].id;
        } else {
            this.selectedInstanceId = null;
        }

        this.notify();
    }

    public selectInstance(instanceId: string | null) {
        if (this.selectedInstanceId === instanceId) return;
        this.selectedInstanceId = instanceId;
        this.notify();
    }

    public setApproached(approached: boolean) {
        const next = approached ? this.selectedInstanceId : null;
        if (this.approachedInstanceId === next) return;
        this.approachedInstanceId = next;
        this.notify();
    }

    public setScope(scope: ColorScope) {
        if (this.scope === scope) return;
        this.scope = scope;
        this.notify();
    }

    public setColor(colorId: string) {
        if (!this.selectedInstanceId) return;
        const currentInst = this.instances[this.selectedInstanceId];
        if (!currentInst) return;

        if (this.scope === 'selectedInstance') {
            currentInst.colorId = colorId;
        } else {
            // Scope: matchingProductsInCurrentRoom
            // Isolates strictly to matching productReference within current room
            const targetRef = currentInst.productReference;
            const currentRoom = this.currentRoomId;

            Object.values(this.instances).forEach(inst => {
                if (inst.roomId === currentRoom && inst.productReference === targetRef) {
                    inst.colorId = colorId;
                }
            });
        }
        this.notify();
    }

    public setFolded(instanceId: string, folded: boolean) {
        const inst = this.instances[instanceId];
        if (inst) {
            inst.folded = folded;
            this.notify();
        }
    }

    public setStored(instanceId: string, stored: boolean) {
        const inst = this.instances[instanceId];
        if (inst) {
            inst.stored = stored;
            this.notify();
        }
    }

    public toggleFold(instanceId?: string) {
        const id = instanceId || this.selectedInstanceId;
        if (!id) return;
        const inst = this.instances[id];
        if (inst) {
            inst.folded = !inst.folded;
            this.notify();
        }
    }

    public toggleStore(instanceId?: string) {
        const id = instanceId || this.selectedInstanceId;
        if (!id) return;
        const inst = this.instances[id];
        if (inst) {
            inst.stored = !inst.stored;
            this.notify();
        }
    }

    public toggleInspector(open?: boolean) {
        this.isInspectorOpen = open !== undefined ? open : !this.isInspectorOpen;
        this.notify();
    }

    public toggleMap(open?: boolean) {
        this.isMapOpen = open !== undefined ? open : !this.isMapOpen;
        this.notify();
    }

    public toggleRoleSelector(open?: boolean) {
        this.isRoleSelectorOpen = open !== undefined ? open : !this.isRoleSelectorOpen;
        this.notify();
    }

    public getSelectedInstance(): CampusInstance | null {
        if (!this.selectedInstanceId) return null;
        return this.instances[this.selectedInstanceId] || null;
    }

    public getActiveColorInfo(): { colorId: string; label: string; isMixed: boolean } {
        const selected = this.getSelectedInstance();
        if (!selected) {
            return { colorId: 'blue', label: 'Xanh dương', isMixed: false };
        }

        const isSatin = selected.productReference === 'REF-MAT-SATIN-STD';
        const colorPalette = isSatin ? SATIN_COLORS : CARA_COLORS;

        if (this.scope === 'matchingProductsInCurrentRoom') {
            const sameGroup = Object.values(this.instances).filter(
                i => i.roomId === this.currentRoomId && i.productReference === selected.productReference
            );
            const firstColor = sameGroup[0]?.colorId;
            const allSame = sameGroup.every(i => i.colorId === firstColor);

            if (!allSame) {
                return { colorId: 'mixed', label: 'Nhiều màu', isMixed: true };
            }
            const color = colorPalette.find(c => c.id === firstColor);
            return {
                colorId: firstColor || (isSatin ? 'satin-mint' : 'blue'),
                label: color?.label || (isSatin ? 'Xanh ngọc' : 'Xanh dương'),
                isMixed: false,
            };
        }

        const color = colorPalette.find(c => c.id === selected.colorId);
        return {
            colorId: selected.colorId,
            label: color?.label || selected.colorId,
            isMixed: false,
        };
    }

    /**
     * Summarizes the user's active product choices across the 5 categories (especially in R6).
     * Strictly factual without fake cart or pricing.
     */
    public getMyChoicesSummary() {
        const instancesInR6 = Object.values(this.instances).filter(i => i.roomId === 'R6');

        // Cara
        const caraItems = instancesInR6.filter(i => i.productReference === 'REF-MAT-CARA-STD');
        const caraColors = Array.from(new Set(caraItems.map(i => {
            const c = CARA_COLORS.find(col => col.id === i.colorId);
            return c ? c.label : i.colorId;
        })));

        // Satin
        const satinItems = instancesInR6.filter(i => i.productReference === 'REF-MAT-SATIN-STD');
        const satinColors = Array.from(new Set(satinItems.map(i => {
            const c = SATIN_COLORS.find(col => col.id === i.colorId);
            return c ? c.label : i.colorId;
        })));

        // Foam
        const foamItem = instancesInR6.find(i => i.productReference === 'REF-FOAM-FOLD4');

        // Sleep
        const sleepItem = instancesInR6.find(i => i.productReference.startsWith('REF-SLEEP-'));
        const sleepColor = sleepItem
            ? (CARA_COLORS.find(col => col.id === sleepItem.colorId)?.label || sleepItem.colorId)
            : '';

        // Bags
        const bagItems = instancesInR6
            .filter(i => i.productReference.startsWith('REF-BAG-'))
            .map(b => ({
                id: b.id,
                label: b.label,
                stored: !!b.stored,
            }));

        return {
            cara: { count: caraItems.length, colors: caraColors },
            satin: { count: satinItems.length, colors: satinColors },
            foam: {
                present: !!foamItem,
                folded: !!foamItem?.folded,
                stored: !!foamItem?.stored,
            },
            sleep: { present: !!sleepItem, color: sleepColor },
            bags: bagItems,
        };
    }
}

// Global singleton campus world state for the browser session
export const campusWorldState = new CampusWorldStateStore();
