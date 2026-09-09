/**
 * CampusCameraController.ts
 * First-Person View (POV) Camera Controller for HULA School Experience:
 * - Implements 3 Design Eye Heights: Cô An (1.55m), Mẹ Linh (1.60m), Bé Mây (0.95m)
 * - Smooth Orbit/Look controls via mouse drag & touch swipe
 * - Smooth Tweening for "Lại gần" (Approach product) & "Đứng dậy / Quay lại"
 * - Room bounding box collision clamping (prevents clipping through walls)
 * - Keyboard WASD / Arrow movement support
 */

import * as THREE from 'three';
import { campusWorldState, ROLES, RoleId, RoomId } from './CampusWorldState';

export interface CameraTransition {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number; // ms
    onComplete?: () => void;
}

export class CampusCameraController {
    public camera: THREE.PerspectiveCamera;
    public domElement: HTMLElement;
    public isApproached: boolean = false;

    // Orientation state
    private yaw: number = 0; // horizontal angle in radians
    private pitch: number = 0; // vertical angle in radians (-60 deg to +60 deg)
    private isDragging: boolean = false;
    private lastPointerX: number = 0;
    private lastPointerY: number = 0;

    // Position & Bounds
    public currentRoomId: RoomId = 'R1';
    private currentEyeHeight: number = 1.60;
    private activeTransition: CameraTransition | null = null;
    private lookTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    // Keyboard state
    private keysPressed: Record<string, boolean> = {};

    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;

        this.updateEyeHeightFromRole();
        this.setupEventListeners();
    }

    public updateEyeHeightFromRole() {
        const role = ROLES[campusWorldState.activeRole];
        this.currentEyeHeight = role ? role.eyeHeight : 1.60;

        if (!this.isApproached) {
            this.camera.position.y = this.currentEyeHeight;
        }
    }

    public setRoomSpawn(roomId: RoomId) {
        this.currentRoomId = roomId;
        this.isApproached = false;
        this.activeTransition = null;

        const role = ROLES[campusWorldState.activeRole];
        const eyeH = role ? role.eyeHeight : 1.60;
        this.currentEyeHeight = eyeH;

        if (roomId === 'H0') {
            // Start of corridor looking towards end
            this.camera.position.set(0, eyeH, 1.5);
            this.yaw = 0;
            this.pitch = 0;
        } else if (roomId === 'R1') {
            this.camera.position.set(-3.2, eyeH, 4.0);
            this.yaw = Math.PI / 2;
            this.pitch = -0.15;
        } else if (roomId === 'R2') {
            this.camera.position.set(3.2, eyeH, 4.0);
            this.yaw = -Math.PI / 2;
            this.pitch = -0.15;
        } else if (roomId === 'R3') {
            this.camera.position.set(-3.2, eyeH, 11.0);
            this.yaw = Math.PI / 2;
            this.pitch = -0.15;
        } else if (roomId === 'R4') {
            this.camera.position.set(3.2, eyeH, 11.0);
            this.yaw = -Math.PI / 2;
            this.pitch = -0.15;
        } else if (roomId === 'R5') {
            this.camera.position.set(-3.2, eyeH, 18.0);
            this.yaw = Math.PI / 2;
            this.pitch = -0.15;
        } else if (roomId === 'R6') {
            this.camera.position.set(3.2, eyeH, 18.0);
            this.yaw = -Math.PI / 2;
            this.pitch = -0.15;
        } else if (roomId === 'R7') {
            this.camera.position.set(0, eyeH, 24.5);
            this.yaw = 0;
            this.pitch = -0.1;
        } else {
            this.camera.position.set(0, eyeH, 0);
            this.yaw = 0;
            this.pitch = 0;
        }

        this.updateCameraVectors();
    }

    /**
     * Smoothly moves camera to the designed inspection anchor of an instance ("Lại gần")
     */
    public approachInstance(anchor: [number, number, number], target: [number, number, number]) {
        this.isApproached = true;

        const startPos = this.camera.position.clone();
        const endPos = new THREE.Vector3(anchor[0], anchor[1], anchor[2]);

        const startTarget = this.lookTarget.clone();
        const endTarget = new THREE.Vector3(target[0], target[1], target[2]);

        this.activeTransition = {
            startPos,
            endPos,
            startTarget,
            endTarget,
            startTime: performance.now(),
            duration: 700, // smooth 700ms animation
            onComplete: () => {
                // Compute resulting yaw and pitch from end vectors
                const dir = endTarget.clone().sub(endPos).normalize();
                this.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
                this.yaw = Math.atan2(-dir.x, -dir.z);
            },
        };
    }

    /**
     * Smoothly returns camera to standing room position ("Đứng dậy / Quay lại")
     */
    public returnToStanding() {
        this.isApproached = false;

        let endX = -3.2;
        let endZ = 4.0;
        let targetX = -6.0;
        let targetZ = 4.0;

        if (this.currentRoomId === 'H0') {
            endX = 0; endZ = 1.5; targetX = 0; targetZ = 10;
        } else if (this.currentRoomId === 'R1') {
            endX = -3.2; endZ = 4.0; targetX = -6.0; targetZ = 4.0;
        } else if (this.currentRoomId === 'R2') {
            endX = 3.2; endZ = 4.0; targetX = 6.0; targetZ = 4.0;
        } else if (this.currentRoomId === 'R3') {
            endX = -3.2; endZ = 11.0; targetX = -6.0; targetZ = 11.0;
        } else if (this.currentRoomId === 'R4') {
            endX = 3.2; endZ = 11.0; targetX = 6.0; targetZ = 11.0;
        } else if (this.currentRoomId === 'R5') {
            endX = -3.2; endZ = 18.0; targetX = -6.0; targetZ = 18.0;
        } else if (this.currentRoomId === 'R6') {
            endX = 3.2; endZ = 18.0; targetX = 6.0; targetZ = 18.0;
        } else if (this.currentRoomId === 'R7') {
            endX = 0; endZ = 24.5; targetX = 0; targetZ = 27.0;
        }

        const startPos = this.camera.position.clone();
        const endPos = new THREE.Vector3(endX, this.currentEyeHeight, endZ);

        const startTarget = this.lookTarget.clone();
        const endTarget = new THREE.Vector3(targetX, this.currentEyeHeight * 0.4, targetZ);

        this.activeTransition = {
            startPos,
            endPos,
            startTarget,
            endTarget,
            startTime: performance.now(),
            duration: 650,
            onComplete: () => {
                const dir = endTarget.clone().sub(endPos).normalize();
                this.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
                this.yaw = Math.atan2(-dir.x, -dir.z);
            },
        };
    }

    public update(deltaTime: number) {
        // 1. Handle Active Camera Tween Animation
        if (this.activeTransition) {
            const now = performance.now();
            const elapsed = now - this.activeTransition.startTime;
            const progress = Math.min(1, elapsed / this.activeTransition.duration);

            // EaseInOutCubic
            const t = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            this.camera.position.lerpVectors(this.activeTransition.startPos, this.activeTransition.endPos, t);
            this.lookTarget.lerpVectors(this.activeTransition.startTarget, this.activeTransition.endTarget, t);
            this.camera.lookAt(this.lookTarget);

            if (progress >= 1) {
                const cb = this.activeTransition.onComplete;
                this.activeTransition = null;
                if (cb) cb();
            }
            return;
        }

        // 2. Handle Keyboard WASD / Arrow Movement (only when not approached)
        if (!this.isApproached) {
            this.handleKeyboardMovement(deltaTime);
        }

        // 3. Update Camera vectors from yaw & pitch
        this.updateCameraVectors();
    }

    private updateCameraVectors() {
        const cosPitch = Math.cos(this.pitch);
        const dirX = -Math.sin(this.yaw) * cosPitch;
        const dirY = Math.sin(this.pitch);
        const dirZ = -Math.cos(this.yaw) * cosPitch;

        const forward = new THREE.Vector3(dirX, dirY, dirZ);
        this.lookTarget.copy(this.camera.position).add(forward);
        this.camera.lookAt(this.lookTarget);
    }

    private handleKeyboardMovement(dt: number) {
        const speed = 2.4 * dt;
        let moveX = 0;
        let moveZ = 0;

        if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveZ += 1;
        if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveZ -= 1;
        if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveX -= 1;
        if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveX += 1;

        if (moveX === 0 && moveZ === 0) return;

        // Forward vector in horizontal XZ plane
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
        const right = new THREE.Vector3(forward.z, 0, -forward.x);

        const delta = forward.multiplyScalar(moveZ * speed).add(right.multiplyScalar(moveX * speed));
        this.camera.position.add(delta);

        // Clamp inside room boundaries to prevent wall clipping
        this.clampPositionToBounds();
    }

    private clampPositionToBounds() {
        if (this.currentRoomId === 'H0') {
            // Corridor: X in [-1.6, 1.6], Z in [0.8, 23.2]
            this.camera.position.x = Math.max(-1.6, Math.min(1.6, this.camera.position.x));
            this.camera.position.z = Math.max(0.8, Math.min(23.2, this.camera.position.z));
        } else if (['R1', 'R3', 'R5'].includes(this.currentRoomId)) {
            const centerZ = this.currentRoomId === 'R1' ? 4 : this.currentRoomId === 'R3' ? 11 : 18;
            this.camera.position.x = Math.max(-9.5, Math.min(-2.4, this.camera.position.x));
            this.camera.position.z = Math.max(centerZ - 2.5, Math.min(centerZ + 2.5, this.camera.position.z));
        } else if (['R2', 'R4', 'R6'].includes(this.currentRoomId)) {
            const centerZ = this.currentRoomId === 'R2' ? 4 : this.currentRoomId === 'R4' ? 11 : 18;
            this.camera.position.x = Math.max(2.4, Math.min(9.5, this.camera.position.x));
            this.camera.position.z = Math.max(centerZ - 2.5, Math.min(centerZ + 2.5, this.camera.position.z));
        } else if (this.currentRoomId === 'R7') {
            this.camera.position.x = Math.max(-3.5, Math.min(3.5, this.camera.position.x));
            this.camera.position.z = Math.max(23.5, Math.min(30.5, this.camera.position.z));
        }
        this.camera.position.y = this.currentEyeHeight;
    }

    private setupEventListeners() {
        // Pointer / Touch drag for looking around
        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            this.isDragging = true;
            this.lastPointerX = e.clientX;
            this.lastPointerY = e.clientY;
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.lastPointerX;
            const deltaY = e.clientY - this.lastPointerY;

            this.lastPointerX = e.clientX;
            this.lastPointerY = e.clientY;

            // Sensitivity
            const sensitivity = 0.0035;
            this.yaw -= deltaX * sensitivity;

            // Clamp pitch to [-70 deg, +60 deg]
            const maxPitch = (60 * Math.PI) / 180;
            const minPitch = (-70 * Math.PI) / 180;
            this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch - deltaY * sensitivity));
        };

        const onPointerUp = () => {
            this.isDragging = false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            this.keysPressed[e.code] = true;
        };

        const onKeyUp = (e: KeyboardEvent) => {
            this.keysPressed[e.code] = false;
        };

        this.domElement.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        this.disposeListeners = () => {
            this.domElement.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }

    public disposeListeners?: () => void;

    public dispose() {
        if (this.disposeListeners) {
            this.disposeListeners();
        }
    }
}
