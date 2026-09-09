/**
 * CampusEngine.ts
 * Main Three.js Runtime Engine for HULA School POV Experience:
 * - Orchestrates Scene, WebGLRenderer, PerspectiveCamera, PBR Lighting
 * - Supports H0 Corridor + R1 Cara, R2 Satin, R3 Foam, R4 Sleep Bag, R5 Storage Bag
 * - Manages fold & store animations for Foam and Bags
 * - Ties with CampusWorldState for instant (<100ms) material recoloring
 * - Raycasting for hover/selection of product instances and door navigation
 */

import * as THREE from 'three';
import { campusWorldState, RoomId, CARA_COLORS, SATIN_COLORS } from './CampusWorldState';
import { CampusRoomBuilder, BuiltRoom } from './CampusRoomBuilder';
import { CampusCameraController } from './CampusCameraController';

export class CampusEngine {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private cameraController: CampusCameraController;
    private roomBuilder: CampusRoomBuilder;
    private activeRoom: BuiltRoom | null = null;

    private raycaster: THREE.Raycaster;
    private pointer: THREE.Vector2;
    private hoveredInstanceId: string | null = null;

    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private unsubscribeState?: () => void;
    private resizeObserver?: ResizeObserver;

    constructor(container: HTMLElement) {
        this.container = container;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#F6F8F5');

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';

        this.roomBuilder = new CampusRoomBuilder();
        this.cameraController = new CampusCameraController(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2(-999, -999);

        this.loadRoom(campusWorldState.currentRoomId);

        this.setupPointerInteraction();
        this.setupStateSync();
        this.setupResize();

        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    public loadRoom(roomId: RoomId) {
        try {
            if (this.activeRoom) {
                this.scene.remove(this.activeRoom.group);
                this.activeRoom.dispose();
                this.activeRoom = null;
            }

            if (roomId === 'H0') {
                this.activeRoom = this.roomBuilder.buildCorridor();
            } else if (roomId === 'R2') {
                this.activeRoom = this.roomBuilder.buildRoomR2();
            } else if (roomId === 'R3') {
                this.activeRoom = this.roomBuilder.buildRoomR3();
            } else if (roomId === 'R4') {
                this.activeRoom = this.roomBuilder.buildRoomR4();
            } else if (roomId === 'R5') {
                this.activeRoom = this.roomBuilder.buildRoomR5();
            } else if (roomId === 'R6') {
                this.activeRoom = this.roomBuilder.buildRoomR6();
            } else if (roomId === 'R7') {
                this.activeRoom = this.roomBuilder.buildRoomR7();
            } else {
                // Default to R1 Lớp Lá
                this.activeRoom = this.roomBuilder.buildRoomR1();
            }

            this.scene.add(this.activeRoom.group);
            this.cameraController.setRoomSpawn(roomId);
            this.syncInstanceColors();
        } catch (err) {
            console.error(`[CampusEngine] Lỗi khi tạo phòng ${roomId}, khôi phục vị trí an toàn:`, err);
            if (!this.activeRoom) {
                this.activeRoom = this.roomBuilder.buildRoomR1();
                this.scene.add(this.activeRoom.group);
                this.cameraController.setRoomSpawn('R1');
            }
        }
    }

    private getAllInteractiveInstances(): Array<{
        id: string;
        group: THREE.Group;
        setHovered: (h: boolean) => void;
        setSelected: (s: boolean) => void;
    }> {
        if (!this.activeRoom) return [];
        const result: Array<{
            id: string;
            group: THREE.Group;
            setHovered: (h: boolean) => void;
            setSelected: (s: boolean) => void;
        }> = [];

        if (this.activeRoom.caraInstances) {
            Object.values(this.activeRoom.caraInstances).forEach(i => result.push({ id: i.instanceId, group: i.group, setHovered: i.setHovered, setSelected: i.setSelected }));
        }
        if (this.activeRoom.satinInstances) {
            Object.values(this.activeRoom.satinInstances).forEach(i => result.push({ id: i.instanceId, group: i.group, setHovered: i.setHovered, setSelected: i.setSelected }));
        }
        if (this.activeRoom.foamFoldInstances) {
            Object.values(this.activeRoom.foamFoldInstances).forEach(i => result.push({ id: i.instanceId, group: i.group, setHovered: i.setHovered, setSelected: i.setSelected }));
        }
        if (this.activeRoom.foamBasicInstances) {
            Object.values(this.activeRoom.foamBasicInstances).forEach(i => result.push({ id: i.instanceId, group: i.group, setHovered: i.setHovered, setSelected: i.setSelected }));
        }
        if (this.activeRoom.sleepInstances) {
            Object.values(this.activeRoom.sleepInstances).forEach(i => result.push({ id: i.instanceId, group: i.group, setHovered: i.setHovered, setSelected: i.setSelected }));
        }
        if (this.activeRoom.bagInstances) {
            Object.values(this.activeRoom.bagInstances).forEach(i => result.push({ id: i.instanceId, group: i.group, setHovered: i.setHovered, setSelected: i.setSelected }));
        }

        return result;
    }

    private setupStateSync() {
        let lastRole = campusWorldState.activeRole;
        let lastRoom = campusWorldState.currentRoomId;
        let lastSelected = campusWorldState.selectedInstanceId;
        let lastApproached = campusWorldState.approachedInstanceId;

        this.unsubscribeState = campusWorldState.subscribe(() => {
            if (campusWorldState.activeRole !== lastRole) {
                lastRole = campusWorldState.activeRole;
                this.cameraController.updateEyeHeightFromRole();
            }

            if (campusWorldState.currentRoomId !== lastRoom) {
                lastRoom = campusWorldState.currentRoomId;
                this.loadRoom(lastRoom);
            }

            if (campusWorldState.selectedInstanceId !== lastSelected) {
                const instances = this.getAllInteractiveInstances();
                if (lastSelected) {
                    const prev = instances.find(i => i.id === lastSelected);
                    if (prev) prev.setSelected(false);
                }
                if (campusWorldState.selectedInstanceId) {
                    const curr = instances.find(i => i.id === campusWorldState.selectedInstanceId);
                    if (curr) curr.setSelected(true);
                }
                lastSelected = campusWorldState.selectedInstanceId;
            }

            if (campusWorldState.approachedInstanceId !== lastApproached) {
                lastApproached = campusWorldState.approachedInstanceId;
                if (lastApproached) {
                    const inst = campusWorldState.instances[lastApproached];
                    if (inst) {
                        this.cameraController.approachInstance(inst.approachAnchor, inst.lookTarget);
                    }
                } else {
                    this.cameraController.returnToStanding();
                }
            }

            // Sync QA Camera Bookmarks (V01 to V06)
            if (campusWorldState.activeBookmarkId) {
                const bmId = campusWorldState.activeBookmarkId;
                campusWorldState.activeBookmarkId = null;
                this.cameraController.goToBookmark(bmId);
            }

            // Sync Foam Fold / Store animations across all rooms (R3, R6)
            if (this.activeRoom?.foamFoldInstances) {
                Object.entries(this.activeRoom.foamFoldInstances).forEach(([foamId, fold4Mesh]) => {
                    const fold4Data = campusWorldState.instances[foamId];
                    if (fold4Mesh && fold4Data) {
                        if (fold4Mesh.isFolded !== !!fold4Data.folded) {
                            fold4Mesh.animateFold(!!fold4Data.folded);
                        }
                        if (fold4Mesh.isStored !== !!fold4Data.stored) {
                            const shelfZ = fold4Data.roomId === 'R6' ? 15.4 : 8.4;
                            const targetPos: [number, number, number] = fold4Data.stored
                                ? [fold4Data.position[0], 0.45, shelfZ]
                                : [fold4Data.position[0], 0.02, fold4Data.position[2]];
                            fold4Mesh.animateStore(!!fold4Data.stored, targetPos);
                        }
                    }
                });
            }

            // Sync Bag Store animation across all rooms (R5, R6)
            if (this.activeRoom?.bagInstances) {
                Object.entries(this.activeRoom.bagInstances).forEach(([bagId, bagMesh]) => {
                    const bagData = campusWorldState.instances[bagId];
                    if (bagMesh && bagData) {
                        if (bagMesh.isStored !== !!bagData.stored) {
                            const shelfZ = bagData.roomId === 'R6' ? 15.4 : 15.5;
                            const targetPos: [number, number, number] = bagData.stored
                                ? [bagData.position[0], 0.45, shelfZ]
                                : [bagData.position[0], bagData.position[1], bagData.position[2]];
                            bagMesh.animateStore(!!bagData.stored, targetPos);
                        }
                    }
                });
            }

            this.syncInstanceColors();
        });
    }

    private syncInstanceColors() {
        if (!this.activeRoom) return;

        // Cara instances
        if (this.activeRoom.caraInstances) {
            Object.entries(this.activeRoom.caraInstances).forEach(([instId, bedding]) => {
                const instData = campusWorldState.instances[instId];
                if (instData) {
                    const colorCfg = CARA_COLORS.find(c => c.id === instData.colorId);
                    if (colorCfg) bedding.updateColor(colorCfg.previewHex);
                }
            });
        }

        // Satin instances
        if (this.activeRoom.satinInstances) {
            Object.entries(this.activeRoom.satinInstances).forEach(([instId, bedding]) => {
                const instData = campusWorldState.instances[instId];
                if (instData) {
                    const colorCfg = SATIN_COLORS.find(c => c.id === instData.colorId);
                    const hex = colorCfg ? colorCfg.previewHex : instData.colorId;
                    bedding.updateColor(hex);
                }
            });
        }

        // Sleep Bag instances
        if (this.activeRoom.sleepInstances) {
            Object.entries(this.activeRoom.sleepInstances).forEach(([instId, bag]) => {
                const instData = campusWorldState.instances[instId];
                if (instData) {
                    const colorCfg = CARA_COLORS.find(c => c.id === instData.colorId);
                    if (colorCfg) bag.updateColor(colorCfg.previewHex);
                }
            });
        }
    }

    private setupPointerInteraction() {
        const dom = this.renderer.domElement;

        const onPointerMove = (e: PointerEvent) => {
            const rect = dom.getBoundingClientRect();
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.checkHover();
        };

        const onClick = (e: MouseEvent) => {
            if (e.button !== 0) return;
            const rect = dom.getBoundingClientRect();
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.handleClick();
        };

        dom.addEventListener('pointermove', onPointerMove);
        dom.addEventListener('click', onClick);

        this.disposePointer = () => {
            dom.removeEventListener('pointermove', onPointerMove);
            dom.removeEventListener('click', onClick);
        };
    }

    private disposePointer?: () => void;

    private checkHover() {
        if (!this.activeRoom) return;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const instances = this.getAllInteractiveInstances();

        let hitInstanceId: string | null = null;
        for (const inst of instances) {
            const hits = this.raycaster.intersectObjects(inst.group.children, true);
            if (hits.length > 0) {
                hitInstanceId = inst.id;
                break;
            }
        }

        let hitDoor = false;
        if (this.activeRoom.doorInteractiveMeshes.length > 0) {
            const doorHits = this.raycaster.intersectObjects(this.activeRoom.doorInteractiveMeshes, false);
            if (doorHits.length > 0) hitDoor = true;
        }

        if (hitInstanceId !== this.hoveredInstanceId) {
            if (this.hoveredInstanceId) {
                const prev = instances.find(i => i.id === this.hoveredInstanceId);
                if (prev) prev.setHovered(false);
            }
            if (hitInstanceId) {
                const curr = instances.find(i => i.id === hitInstanceId);
                if (curr) curr.setHovered(true);
            }
            this.hoveredInstanceId = hitInstanceId;
        }

        this.renderer.domElement.style.cursor = (hitInstanceId || hitDoor) ? 'pointer' : 'default';
    }

    private handleClick() {
        if (!this.activeRoom) return;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        // Check doors
        if (this.activeRoom.doorInteractiveMeshes.length > 0) {
            const doorHits = this.raycaster.intersectObjects(this.activeRoom.doorInteractiveMeshes, false);
            if (doorHits.length > 0) {
                const targetRoomId = doorHits[0].object.userData?.targetRoomId as RoomId;
                if (targetRoomId) {
                    campusWorldState.setRoom(targetRoomId);
                    return;
                }
            }
        }

        // Check instances
        const instances = this.getAllInteractiveInstances();
        for (const inst of instances) {
            const hits = this.raycaster.intersectObjects(inst.group.children, true);
            if (hits.length > 0) {
                campusWorldState.selectInstance(inst.id);
                campusWorldState.toggleInspector(true);
                return;
            }
        }
    }

    private setupResize() {
        this.resizeObserver = new ResizeObserver(() => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            if (width === 0 || height === 0) return;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
        this.resizeObserver.observe(this.container);
    }

    private animate(time: number) {
        this.animationFrameId = requestAnimationFrame(this.animate);

        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.cameraController.update(dt);
        if (this.activeRoom?.update) {
            this.activeRoom.update(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }

    public dispose() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.unsubscribeState) this.unsubscribeState();
        if (this.disposePointer) this.disposePointer();
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.cameraController.dispose();

        if (this.activeRoom) {
            this.activeRoom.dispose();
        }

        this.renderer.dispose();
        this.container.innerHTML = '';
    }
}
