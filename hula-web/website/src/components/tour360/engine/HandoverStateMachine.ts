/**
 * HandoverStateMachine.ts
 * Finite State Machine for R7 Weekend Handover Encounter (Instruction 07):
 * - 6 Steps:
 *   H0: waiting (Meeting at teacher's desk)
 *   H1: bag_selected (Bag located on shelf and placed on desk)
 *   H2: label_verified (Label "Mây — Lớp Mầm" and items verified)
 *   H3: ready_to_transfer (Teacher and Mother in position to hand over)
 *   H4: transferring (Grip transfer from Teacher to Mother at grip_transfer marker)
 *   H5: completed (Received by Mother, farewell lines)
 * - Single bag instance: bag-may-01 (never cloned)
 * - Holder state: shelf -> table -> teacher -> mother
 * - Preserves world transform, anti-double-click, replay support
 */

import { RoleId } from './CampusWorldState';

export type HandoverState =
    | 'waiting'
    | 'bag_selected'
    | 'label_verified'
    | 'ready_to_transfer'
    | 'transferring'
    | 'received'
    | 'completed';

export type BagHolder = 'shelf' | 'table' | 'teacher' | 'mother';

export interface HandoverLabelData {
    childName: string;
    className: string;
    beddingRef: string;
    beddingName: string;
    bagRef: string;
    bagName: string;
}

export const MAY_HANDOVER_LABEL: HandoverLabelData = {
    childName: 'Mây',
    className: 'Lớp Mầm',
    beddingRef: 'REF-MAT-CARA-STD',
    beddingName: 'Bộ nệm Cotton Cara (120×63 cm)',
    bagRef: 'REF-BAG-HANDLE',
    bagName: 'Túi quai xách mầm non tiêu chuẩn',
};

// 3D coordinates for bag-may-01 in Room R7
export const HANDOVER_ANCHORS: Record<BagHolder, [number, number, number]> = {
    shelf: [-2.8, 0.55, 26.5],     // On the cubby shelf
    table: [0.0, 0.78, 26.5],      // Centered on the consultation desk
    teacher: [-0.25, 0.95, 26.1],  // Held by Teacher Cô An
    mother: [0.25, 0.95, 26.1],   // Held by Mother Mẹ Linh
};

export const TRANSFER_MARKER_POS: [number, number, number] = [0.0, 0.95, 26.1];

export interface HandoverStepDialog {
    stepCode: string;
    stepTitle: string;
    dialogue: Record<RoleId, string>;
    actionLabel: Record<RoleId, string>;
}

export const HANDOVER_STEPS_META: Record<HandoverState, HandoverStepDialog> = {
    waiting: {
        stepCode: 'H0',
        stepTitle: 'Gặp nhau tại bàn đón bé',
        dialogue: {
            'co-an': '“Chào mẹ Linh, hôm nay mình bàn giao túi của Mây nhé.”',
            'me-linh': '“Em chào cô An, em đến đón Mây và nhận túi ạ.”',
            'be-may': '“Mẹ đến đón con rồi!”',
        },
        actionLabel: {
            'co-an': 'Chọn túi của Mây',
            'me-linh': 'Xem túi của Mây',
            'be-may': 'Xem túi của con',
        },
    },
    bag_selected: {
        stepCode: 'H1',
        stepTitle: 'Tìm và đặt túi lên bàn kiểm',
        dialogue: {
            'co-an': '“Mình đặt túi trên bàn để cùng đối chiếu.”',
            'me-linh': '“Túi đã được đặt lên bàn để mình kiểm tra.”',
            'be-may': '“Con thấy túi màu xanh trên bàn.”',
        },
        actionLabel: {
            'co-an': 'Xem thông tin túi',
            'me-linh': 'Xem nhãn túi',
            'be-may': 'Nhìn nhãn túi',
        },
    },
    label_verified: {
        stepCode: 'H2',
        stepTitle: 'Xác nhận nhãn và danh mục đồ',
        dialogue: {
            'co-an': '“Cùng xác nhận thông tin Mây – Lớp Mầm.”',
            'me-linh': '“Đối chiếu thông tin: Mây – Lớp Mầm.”',
            'be-may': '“Mẹ cùng con xem tên nhé.”',
        },
        actionLabel: {
            'co-an': 'Xác nhận đúng túi',
            'me-linh': 'Xác nhận đúng túi',
            'be-may': 'Cùng mẹ xác nhận',
        },
    },
    ready_to_transfer: {
        stepCode: 'H3',
        stepTitle: 'Chuẩn bị trao nhận túi',
        dialogue: {
            'co-an': '“Mình giữ quai túi và đưa về phía mẹ Linh.”',
            'me-linh': '“Cô An đã nhấc túi, mình chuẩn bị nhận.”',
            'be-may': '“Cô An đang đưa túi cho mẹ.”',
        },
        actionLabel: {
            'co-an': 'Đưa túi cho mẹ',
            'me-linh': 'Đưa tay nhận túi',
            'be-may': 'Xem mẹ nhận túi',
        },
    },
    transferring: {
        stepCode: 'H4',
        stepTitle: 'Đang chuyển giao quyền sở hữu',
        dialogue: {
            'co-an': '“Mẹ Linh đã nắm quai, mình chuẩn bị buông tay.”',
            'me-linh': '“Mình đã nắm quai, chờ cô buông tay.”',
            'be-may': '“Mẹ đã cầm quai túi rồi.”',
        },
        actionLabel: {
            'co-an': 'Buông quai túi',
            'me-linh': 'Nhận túi',
            'be-may': 'Xem tiếp',
        },
    },
    received: {
        stepCode: 'H5',
        stepTitle: 'Đã nhận túi hoàn tất',
        dialogue: {
            'co-an': '“Mẹ đã nhận túi. Chào Mây, hẹn gặp con nhé!”',
            'me-linh': '“Mình đã nhận túi. Cảm ơn cô An!”',
            'be-may': '“Con chào cô An, con về với mẹ ạ!”',
        },
        actionLabel: {
            'co-an': 'Hoàn tất bàn giao',
            'me-linh': 'Hoàn tất bàn giao',
            'be-may': 'Chào cô và hoàn tất',
        },
    },
    completed: {
        stepCode: 'H5',
        stepTitle: 'Bàn giao cuối tuần thành công',
        dialogue: {
            'co-an': '“Mẹ đã nhận túi. Chào Mây, hẹn gặp con nhé!”',
            'me-linh': '“Mình đã nhận túi. Cảm ơn cô An!”',
            'be-may': '“Con chào cô An, con về với mẹ ạ!”',
        },
        actionLabel: {
            'co-an': 'Hoàn tất bàn giao',
            'me-linh': 'Hoàn tất bàn giao',
            'be-may': 'Chào cô và hoàn tất',
        },
    },
};

export class HandoverStateMachine {
    public state: HandoverState = 'waiting';
    public holder: BagHolder = 'shelf';
    public isLabelModalOpen: boolean = false;
    public isTransferring: boolean = false;
    public transferProgress: number = 0; // 0 to 1 during H4

    private listeners: Set<() => void> = new Set();
    private actionLock: boolean = false; // anti-double-click guard

    public subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        this.listeners.forEach(fn => fn());
    }

    /**
     * Executes next step according to the current state.
     * Guarded against double-clicks and invalid transitions.
     */
    public triggerAction(role: RoleId) {
        if (this.actionLock) return;

        switch (this.state) {
            case 'waiting':
                // H0 -> H1: Move bag from shelf to consultation desk
                this.actionLock = true;
                this.state = 'bag_selected';
                this.holder = 'table';
                this.actionLock = false;
                this.notify();
                break;

            case 'bag_selected':
                // H1 -> H2: Open and verify label modal
                this.isLabelModalOpen = true;
                this.notify();
                break;

            case 'label_verified':
                // H2 -> H3: Teacher holds bag
                this.actionLock = true;
                this.state = 'ready_to_transfer';
                this.holder = 'teacher';
                this.actionLock = false;
                this.notify();
                break;

            case 'ready_to_transfer':
                // H3 -> H4 -> H5: Grip transfer from teacher to mother
                this.startGripTransfer();
                break;

            case 'received':
                this.state = 'completed';
                this.notify();
                break;

            case 'completed':
                // Replay encounter
                this.replay();
                break;
        }
    }

    /**
     * Confirms the label and items inspection modal
     */
    public confirmLabelVerification() {
        this.isLabelModalOpen = false;
        this.state = 'label_verified';
        this.notify();
    }

    public closeLabelModal() {
        this.isLabelModalOpen = false;
        this.notify();
    }

    /**
     * Executes atomic grip transfer across marker grip_transfer
     */
    private startGripTransfer() {
        if (this.isTransferring) return;

        this.actionLock = true;
        this.isTransferring = true;
        this.state = 'transferring';
        this.notify();

        const duration = 1200; // 1.2s smooth transfer
        const startTime = performance.now();

        const animateTransfer = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / duration);
            this.transferProgress = progress;

            // At marker (progress >= 0.5), transfer ownership to mother
            if (progress >= 0.5 && this.holder !== 'mother') {
                this.holder = 'mother';
            }

            this.notify();

            if (progress < 1) {
                requestAnimationFrame(animateTransfer);
            } else {
                this.isTransferring = false;
                this.state = 'received';
                this.actionLock = false;
                this.notify();
            }
        };

        requestAnimationFrame(animateTransfer);
    }

    /**
     * Replays the encounter: resets bag to shelf and state to H0 waiting.
     * Preserves all product customizations in R1-R6.
     */
    public replay() {
        this.actionLock = false;
        this.isTransferring = false;
        this.transferProgress = 0;
        this.state = 'waiting';
        this.holder = 'shelf';
        this.isLabelModalOpen = false;
        this.notify();
    }

    /**
     * Resets handover sequence when character perspective is switched.
     * Cancels any in-flight transfer, closes overlays, and restores bag to shelf at H0.
     */
    public switchRole(_role: RoleId) {
        this.actionLock = false;
        this.isTransferring = false;
        this.transferProgress = 0;
        this.state = 'waiting';
        this.holder = 'shelf';
        this.isLabelModalOpen = false;
        this.notify();
    }

    /**
     * Navigates back to the previous step safely
     */
    public previousStep() {
        if (this.actionLock || this.isTransferring) return;
        const sequence: HandoverState[] = ['waiting', 'bag_selected', 'label_verified', 'ready_to_transfer', 'completed'];
        const currentEffective: HandoverState = (this.state === 'received' || this.state === 'transferring') ? 'ready_to_transfer' : this.state;
        const currentIdx = sequence.indexOf(currentEffective);
        if (currentIdx > 0) {
            const target = sequence[currentIdx - 1];
            this.state = target;
            if (target === 'waiting') this.holder = 'shelf';
            else if (target === 'bag_selected' || target === 'label_verified') this.holder = 'table';
            else if (target === 'ready_to_transfer') this.holder = 'teacher';
            this.isLabelModalOpen = false;
            this.notify();
        }
    }

    /**
     * Opens the label and checklist inspection modal
     */
    public openDetailsModal() {
        this.isLabelModalOpen = true;
        this.notify();
    }

    /**
     * Calculates the current 3D position of bag-may-01
     */
    public getBagPosition(): [number, number, number] {
        if (this.state === 'transferring') {
            const start = HANDOVER_ANCHORS.teacher;
            const end = HANDOVER_ANCHORS.mother;
            const t = this.transferProgress;
            return [
                start[0] + (end[0] - start[0]) * t,
                start[1] + Math.sin(t * Math.PI) * 0.05, // subtle natural lift during handover
                start[2] + (end[2] - start[2]) * t,
            ];
        }
        return HANDOVER_ANCHORS[this.holder];
    }
}

export const handoverStateMachine = new HandoverStateMachine();
