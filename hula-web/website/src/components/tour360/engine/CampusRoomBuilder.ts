/**
 * CampusRoomBuilder.ts
 * Builds architectural 3D geometry for HULA preschool campus according to school-blueprint.json:
 * - H0 Central Corridor (width 4m, length 24m)
 * - R1 Lớp Lá (Cotton Cara, 8x6m, 6 Cara bedding sets)
 * - R2 Lớp Nắng (Satin, 8x6m, 3 Satin bedding sets, material swatch table)
 * - R3 Lớp Mầm (Foam, 8x6m, 1 Foam Fold4 + 1 Foam Basic, cubby storage shelf)
 * - R4 Lớp Mây (Túi Ngủ, 8x6m, 2 stations: Standard vs Plus quilted)
 * - R5 Góc Gọn Gàng (Túi Bảo Quản, 8x6m, 5 bag models + cubby storage)
 */

import * as THREE from 'three';
import { RoomId, campusWorldState, CARA_COLORS, SATIN_COLORS } from './CampusWorldState';
import { createCaraBeddingMesh, CaraBeddingMeshInstance } from './procedural/CaraBeddingMesh';
import { createSatinBeddingMesh, SatinBeddingMeshInstance } from './procedural/SatinBeddingMesh';
import {
    createFoamFold4Mesh,
    createFoamBasicMesh,
    FoamFold4MeshInstance,
    FoamBasicMeshInstance,
} from './procedural/FoamMattressMesh';
import { createSleepingBagMesh, SleepingBagMeshInstance } from './procedural/SleepingBagMesh';
import { createStorageBagMesh, StorageBagMeshInstance } from './procedural/StorageBagMesh';
import { handoverStateMachine } from './HandoverStateMachine';

export interface BuiltRoom {
    id: RoomId;
    group: THREE.Group;
    caraInstances?: Record<string, CaraBeddingMeshInstance>;
    satinInstances?: Record<string, SatinBeddingMeshInstance>;
    foamFoldInstances?: Record<string, FoamFold4MeshInstance>;
    foamBasicInstances?: Record<string, FoamBasicMeshInstance>;
    sleepInstances?: Record<string, SleepingBagMeshInstance>;
    bagInstances?: Record<string, StorageBagMeshInstance>;
    doorInteractiveMeshes: THREE.Mesh[];
    update?: (dt: number) => void;
    dispose: () => void;
}

export class CampusRoomBuilder {
    private woodMaterial: THREE.MeshStandardMaterial;
    private wallMaterial: THREE.MeshStandardMaterial;
    private ceilingMaterial: THREE.MeshStandardMaterial;
    private doorFrameMaterial: THREE.MeshStandardMaterial;
    private shelfWoodMaterial: THREE.MeshStandardMaterial;
    private windowGlassMaterial: THREE.MeshStandardMaterial;

    constructor() {
        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#E3D5C5'),
            roughness: 0.65,
            metalness: 0.05,
        });

        this.wallMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#F7F9F6'),
            roughness: 0.9,
            metalness: 0.0,
        });

        this.ceilingMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#FFFFFF'),
            roughness: 0.95,
        });

        this.doorFrameMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#087F8C'),
            roughness: 0.4,
            metalness: 0.1,
        });

        this.shelfWoodMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#D8BA94'),
            roughness: 0.6,
            metalness: 0.05,
        });

        this.windowGlassMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#D6EEF8'),
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.45,
        });
    }

    /**
     * Builds H0 Central Corridor
     */
    public buildCorridor(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_H0';
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const length = 24;
        const width = 4;
        const height = 3.2;

        const floorGeo = new THREE.PlaneGeometry(width, length);
        floorGeo.rotateX(-Math.PI / 2);
        const floor = new THREE.Mesh(floorGeo, this.woodMaterial);
        floor.position.set(0, 0, length / 2);
        floor.receiveShadow = true;
        group.add(floor);

        const ceilingGeo = new THREE.PlaneGeometry(width, length);
        ceilingGeo.rotateX(Math.PI / 2);
        const ceiling = new THREE.Mesh(ceilingGeo, this.ceilingMaterial);
        ceiling.position.set(0, height, length / 2);
        group.add(ceiling);

        for (let z = 3; z <= 22; z += 5) {
            const lightMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.05, 1.2),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            lightMesh.position.set(0, height - 0.03, z);
            group.add(lightMesh);

            const pointLight = new THREE.PointLight(0xfff8ee, 0.7, 8);
            pointLight.position.set(0, height - 0.3, z);
            group.add(pointLight);
        }

        const doors: Array<[RoomId, number, number, number, string]> = [
            ['R1', -2, 4, Math.PI / 2, 'R1 · Lớp Lá (Cotton Cara)'],
            ['R2', 2, 4, -Math.PI / 2, 'R2 · Lớp Nắng (Satin)'],
            ['R3', -2, 11, Math.PI / 2, 'R3 · Lớp Mầm (Nệm Foam)'],
            ['R4', 2, 11, -Math.PI / 2, 'R4 · Lớp Mây (Túi Ngủ)'],
            ['R5', -2, 18, Math.PI / 2, 'R5 · Góc Gọn Gàng (Túi)'],
            ['R6', 2, 18, -Math.PI / 2, 'R6 · Lớp HULA (Phối Hợp)'],
            ['R7', 0, 23.5, 0, 'R7 · Phòng Đón Bé (Bàn Giao)'],
        ];

        doors.forEach(([roomId, x, z, rotY, label]) => {
            const doorGroup = this.createDoorway(roomId, label);
            doorGroup.position.set(x, 0, z);
            doorGroup.rotation.y = rotY;
            group.add(doorGroup);

            const triggerMesh = doorGroup.getObjectByName(`door_trigger_${roomId}`) as THREE.Mesh;
            if (triggerMesh) doorInteractiveMeshes.push(triggerMesh);
        });

        return {
            id: 'H0',
            group,
            doorInteractiveMeshes,
            dispose: () => {
                floorGeo.dispose();
                ceilingGeo.dispose();
            },
        };
    }

    /**
     * Builds R1: Lớp Lá — Cotton Cara
     */
    public buildRoomR1(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R1';
        const caraInstances: Record<string, CaraBeddingMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 6;
        const height = 3.2;
        const centerX = -6;
        const centerZ = 4;

        this.addRoomShell(group, centerX, centerZ, roomW, roomL, height, 'left', 'H0', '← Ra Hành Lang', doorInteractiveMeshes);

        // Classroom signs & furniture
        const roomSign = this.createTextLabel('LỚP LÁ — COTTON CARA', 0x183b3a, 0xffffff);
        roomSign.position.set(-2.1, 2.6, 4);
        roomSign.rotation.y = Math.PI / 2;
        group.add(roomSign);

        const cubby = this.createCubbyShelf(4.0, 0.85, 0.4);
        cubby.position.set(-6, 0, 1.3);
        group.add(cubby);

        // 6 Cotton Cara instances
        const caraConfigs = [
            { id: 'Cara-01', x: -7.5, z: 2.8 },
            { id: 'Cara-02', x: -6.0, z: 2.8 },
            { id: 'Cara-03', x: -4.5, z: 2.8 },
            { id: 'Cara-04', x: -7.5, z: 5.0 },
            { id: 'Cara-05', x: -6.0, z: 5.0 },
            { id: 'Cara-06', x: -4.5, z: 5.0 },
        ];

        caraConfigs.forEach(cfg => {
            const instData = campusWorldState.instances[cfg.id];
            const colorId = instData?.colorId || 'blue';
            const colorCfg = CARA_COLORS.find(c => c.id === colorId);
            const hex = colorCfg?.previewHex || '#56C5ED';

            const bedding = createCaraBeddingMesh(cfg.id, hex);
            bedding.group.position.set(cfg.x, 0, cfg.z);
            if (campusWorldState.selectedInstanceId === cfg.id) bedding.setSelected(true);

            group.add(bedding.group);
            caraInstances[cfg.id] = bedding;
        });

        return {
            id: 'R1',
            group,
            caraInstances,
            doorInteractiveMeshes,
            dispose: () => {
                Object.values(caraInstances).forEach(b => b.dispose());
            },
        };
    }

    /**
     * Builds R2: Lớp Nắng — Satin
     */
    public buildRoomR2(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R2';
        const satinInstances: Record<string, SatinBeddingMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 6;
        const height = 3.2;
        const centerX = 6;
        const centerZ = 4;

        this.addRoomShell(group, centerX, centerZ, roomW, roomL, height, 'right', 'H0', '← Ra Hành Lang', doorInteractiveMeshes);

        const roomSign = this.createTextLabel('LỚP NẮNG — NỆM SATIN HÀN QUỐC', 0x183b3a, 0xffffff);
        roomSign.position.set(2.1, 2.6, 4);
        roomSign.rotation.y = -Math.PI / 2;
        group.add(roomSign);

        // 3 Satin bedding sets
        const satinConfigs = [
            { id: 'Satin-01', x: 4.8, z: 2.8, color: '#78C4B8' },
            { id: 'Satin-02', x: 6.3, z: 2.8, color: '#F7C5CC' },
            { id: 'Satin-03', x: 7.8, z: 2.8, color: '#F5E4B5' },
        ];

        satinConfigs.forEach(cfg => {
            const instData = campusWorldState.instances[cfg.id];
            const hex = instData?.colorId || cfg.color;

            const bedding = createSatinBeddingMesh(cfg.id, hex);
            bedding.group.position.set(cfg.x, 0, cfg.z);
            if (campusWorldState.selectedInstanceId === cfg.id) bedding.setSelected(true);

            group.add(bedding.group);
            satinInstances[cfg.id] = bedding;
        });

        // Comparison table with material sample swatches
        const tableGeo = new THREE.BoxGeometry(2.0, 0.65, 0.9);
        const table = new THREE.Mesh(tableGeo, this.shelfWoodMaterial);
        table.position.set(6.3, 0.325, 5.0);
        group.add(table);

        const tableLabel = this.createTextLabel('BÀN TRẢI NGHIỆM CHẤT LIỆU SATIN', 0x183b3a, 0xffffff);
        tableLabel.position.set(6.3, 0.75, 5.0);
        group.add(tableLabel);

        return {
            id: 'R2',
            group,
            satinInstances,
            doorInteractiveMeshes,
            dispose: () => {
                Object.values(satinInstances).forEach(b => b.dispose());
            },
        };
    }

    /**
     * Builds R3: Lớp Mầm — Nệm Foam
     */
    public buildRoomR3(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R3';
        const foamFoldInstances: Record<string, FoamFold4MeshInstance> = {};
        const foamBasicInstances: Record<string, FoamBasicMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 6;
        const height = 3.2;
        const centerX = -6;
        const centerZ = 11;

        this.addRoomShell(group, centerX, centerZ, roomW, roomL, height, 'left', 'H0', '← Ra Hành Lang', doorInteractiveMeshes);

        const roomSign = this.createTextLabel('LỚP MẦM — NỆM FOAM', 0x183b3a, 0xffffff);
        roomSign.position.set(-2.1, 2.6, 11);
        roomSign.rotation.y = Math.PI / 2;
        group.add(roomSign);

        // 1. Cubby shelf for storage along back wall
        const cubby = this.createCubbyShelf(4.0, 0.9, 0.45);
        cubby.position.set(-6, 0, 8.3);
        group.add(cubby);

        const shelfLabel = this.createTextLabel('KỆ CẤT NỆM SAU GIỜ NGỦ TRƯA', 0x183b3a, 0xffffff);
        shelfLabel.position.set(-6, 1.1, 8.3);
        group.add(shelfLabel);

        // 2. REF-FOAM-FOLD4 on floor
        const fold4Inst = createFoamFold4Mesh('Foam-Fold4-01', '#56C5ED');
        fold4Inst.group.position.set(-6.0, 0.02, 10.2);
        if (campusWorldState.selectedInstanceId === 'Foam-Fold4-01') fold4Inst.setSelected(true);
        group.add(fold4Inst.group);
        foamFoldInstances['Foam-Fold4-01'] = fold4Inst;

        // 3. REF-FOAM-BASIC on floor (side-by-side comparison)
        const basicInst = createFoamBasicMesh('Foam-Basic-01', '#EAD8C0');
        basicInst.group.position.set(-4.2, 0.02, 10.2);
        group.add(basicInst.group);
        foamBasicInstances['Foam-Basic-01'] = basicInst;

        const basicLabel = this.createTextLabel('FOAM CƠ BẢN (KHÔNG GẤP)', 0x566967, 0xffffff);
        basicLabel.position.set(-4.2, 0.4, 10.8);
        group.add(basicLabel);

        return {
            id: 'R3',
            group,
            foamFoldInstances,
            foamBasicInstances,
            doorInteractiveMeshes,
            update: (dt: number) => {
                fold4Inst.update(dt);
            },
            dispose: () => {
                fold4Inst.dispose();
                basicInst.dispose();
            },
        };
    }

    /**
     * Builds R4: Lớp Mây — Túi Ngủ
     */
    public buildRoomR4(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R4';
        const sleepInstances: Record<string, SleepingBagMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 6;
        const height = 3.2;
        const centerX = 6;
        const centerZ = 11;

        this.addRoomShell(group, centerX, centerZ, roomW, roomL, height, 'right', 'H0', '← Ra Hành Lang', doorInteractiveMeshes);

        const roomSign = this.createTextLabel('LỚP MÂY — TÚI NGỦ', 0x183b3a, 0xffffff);
        roomSign.position.set(2.1, 2.6, 11);
        roomSign.rotation.y = -Math.PI / 2;
        group.add(roomSign);

        // Station 1: Standard (Thin blanket)
        const stdBag = createSleepingBagMesh('Sleep-Cara-Std-01', false, '#56C5ED');
        stdBag.group.position.set(4.8, 0.02, 10.5);
        if (campusWorldState.selectedInstanceId === 'Sleep-Cara-Std-01') stdBag.setSelected(true);
        group.add(stdBag.group);
        sleepInstances['Sleep-Cara-Std-01'] = stdBag;

        const stdLabel = this.createTextLabel('TIÊU CHUẨN (CHĂN MỎNG)', 0x183b3a, 0xffffff);
        stdLabel.position.set(4.8, 0.45, 11.2);
        group.add(stdLabel);

        // Station 2: Plus (Quilted wave blanket)
        const plusBag = createSleepingBagMesh('Sleep-Cara-Plus-01', true, '#FFC076');
        plusBag.group.position.set(7.2, 0.02, 10.5);
        if (campusWorldState.selectedInstanceId === 'Sleep-Cara-Plus-01') plusBag.setSelected(true);
        group.add(plusBag.group);
        sleepInstances['Sleep-Cara-Plus-01'] = plusBag;

        const plusLabel = this.createTextLabel('NÂNG CAO (CHĂN CHẦN GÒN)', 0x183b3a, 0xffffff);
        plusLabel.position.set(7.2, 0.45, 11.2);
        group.add(plusLabel);

        return {
            id: 'R4',
            group,
            sleepInstances,
            doorInteractiveMeshes,
            dispose: () => {
                stdBag.dispose();
                plusBag.dispose();
            },
        };
    }

    /**
     * Builds R5: Góc Gọn Gàng — Túi Bảo Quản
     */
    public buildRoomR5(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R5';
        const bagInstances: Record<string, StorageBagMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 6;
        const height = 3.2;
        const centerX = -6;
        const centerZ = 18;

        this.addRoomShell(group, centerX, centerZ, roomW, roomL, height, 'left', 'H0', '← Ra Hành Lang', doorInteractiveMeshes);

        const roomSign = this.createTextLabel('GÓC GỌN GÀNG — TÚI BẢO QUẢN', 0x183b3a, 0xffffff);
        roomSign.position.set(-2.1, 2.6, 18);
        roomSign.rotation.y = Math.PI / 2;
        group.add(roomSign);

        // Display rack / low table
        const rackGeo = new THREE.BoxGeometry(4.2, 0.4, 0.8);
        const rack = new THREE.Mesh(rackGeo, this.shelfWoodMaterial);
        rack.position.set(-6, 0.2, 17);
        group.add(rack);

        // Cubby storage unit on wall
        const cubby = this.createCubbyShelf(4.0, 0.9, 0.4);
        cubby.position.set(-6, 0, 15.3);
        group.add(cubby);

        // 5 Bags on rack
        const bagConfigs: Array<{ id: string; type: any; x: number; color: string }> = [
            { id: 'Bag-Drawstring-01', type: 'REF-BAG-DRAWSTRING', x: -7.6, color: '#EFA9D7' },
            { id: 'Bag-Handle-01', type: 'REF-BAG-HANDLE', x: -6.8, color: '#087F8C' },
            { id: 'Bag-Shoulder-01', type: 'REF-BAG-SHOULDER', x: -6.0, color: '#ACD942' },
            { id: 'Bag-Box-01', type: 'REF-BAG-BOX', x: -5.2, color: '#FFC076' },
            { id: 'Bag-BoxStitch-01', type: 'REF-BAG-BOX-STITCH', x: -4.4, color: '#56C5ED' },
        ];

        bagConfigs.forEach(cfg => {
            const bag = createStorageBagMesh(cfg.id, cfg.type, cfg.color);
            bag.group.position.set(cfg.x, 0.4, 17);
            if (campusWorldState.selectedInstanceId === cfg.id) bag.setSelected(true);
            group.add(bag.group);
            bagInstances[cfg.id] = bag;
        });

        return {
            id: 'R5',
            group,
            bagInstances,
            doorInteractiveMeshes,
            update: (dt: number) => {
                Object.values(bagInstances).forEach(b => b.update(dt));
            },
            dispose: () => {
                Object.values(bagInstances).forEach(b => b.dispose());
            },
        };
    }

    /**
     * Builds R6: Lớp HULA — Phối Hợp Đa Sản Phẩm
     * Features representative instances of all 5 product lines:
     * - Khu A: 2 Cotton Cara sets (Cara-01, Cara-02)
     * - Khu B: 2 Satin sets (Satin-01, Satin-02)
     * - Khu C: 1 Foam Fold 4 set (Foam-01) + Cubby shelf
     * - Khu D: 1 Sleeping bag set (Sleep-01)
     * - Kệ E: 2 Storage bags (Bag-01 handle, Bag-02 drawstring)
     * - Direct Doorway to R7 Phòng Đón Bé
     */
    public buildRoomR6(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R6';
        const caraInstances: Record<string, CaraBeddingMeshInstance> = {};
        const satinInstances: Record<string, SatinBeddingMeshInstance> = {};
        const foamFoldInstances: Record<string, FoamFold4MeshInstance> = {};
        const sleepInstances: Record<string, SleepingBagMeshInstance> = {};
        const bagInstances: Record<string, StorageBagMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 6;
        const height = 3.2;
        const centerX = 6;
        const centerZ = 18;

        // 1. Room Shell & Corridor Door
        this.addRoomShell(group, centerX, centerZ, roomW, roomL, height, 'right', 'H0', '← Ra Hành Lang', doorInteractiveMeshes);

        // Entrance Room Sign
        const roomSign = this.createTextLabel('LỚP HULA — PHỐI HỢP ĐA SẢN PHẨM', 0x183b3a, 0xffffff);
        roomSign.position.set(2.1, 2.6, 18);
        roomSign.rotation.y = -Math.PI / 2;
        group.add(roomSign);

        // 2. Direct Doorway to R7 (Phòng Đón Bé) on Back Wall (Z = 21)
        const doorR7FrameGeo = new THREE.BoxGeometry(1.6, 2.4, 0.15);
        const doorR7Frame = new THREE.Mesh(doorR7FrameGeo, this.doorFrameMaterial);
        doorR7Frame.position.set(6, 1.2, 20.95);
        group.add(doorR7Frame);

        const doorR7PanelGeo = new THREE.BoxGeometry(1.4, 2.3, 0.05);
        const doorR7PanelMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#087F8C'),
            roughness: 0.5,
        });
        const doorR7Mesh = new THREE.Mesh(doorR7PanelGeo, doorR7PanelMat);
        doorR7Mesh.position.set(6, 1.2, 20.95);
        doorR7Mesh.userData = { targetRoomId: 'R7' };
        group.add(doorR7Mesh);
        doorInteractiveMeshes.push(doorR7Mesh);

        const doorR7Sign = this.createTextLabel('→ ĐI SANG PHÒNG ĐÓN BÉ (R7)', 0x183b3a, 0xffffff);
        doorR7Sign.position.set(6, 2.5, 20.9);
        group.add(doorR7Sign);

        // 3. Khu A: Cotton Cara (2 sets)
        const cara1Color = campusWorldState.instances['R6-Cara-01']?.colorId || 'blue';
        const cara1Hex = CARA_COLORS.find(c => c.id === cara1Color)?.previewHex || '#56C5ED';
        const cara1 = createCaraBeddingMesh('R6-Cara-01', cara1Hex);
        cara1.group.position.set(4.6, 0.02, 16.2);
        if (campusWorldState.selectedInstanceId === 'R6-Cara-01') cara1.setSelected(true);
        group.add(cara1.group);
        caraInstances['R6-Cara-01'] = cara1;

        const cara2Color = campusWorldState.instances['R6-Cara-02']?.colorId || 'orange';
        const cara2Hex = CARA_COLORS.find(c => c.id === cara2Color)?.previewHex || '#FFC076';
        const cara2 = createCaraBeddingMesh('R6-Cara-02', cara2Hex);
        cara2.group.position.set(4.6, 0.02, 18.5);
        if (campusWorldState.selectedInstanceId === 'R6-Cara-02') cara2.setSelected(true);
        group.add(cara2.group);
        caraInstances['R6-Cara-02'] = cara2;

        const zoneALabel = this.createTextLabel('KHU A: COTTON CARA', 0x183b3a, 0xffffff);
        zoneALabel.position.set(4.6, 0.45, 15.3);
        group.add(zoneALabel);

        // 4. Khu B: Satin Hàn Quốc (2 sets)
        const satin1Color = campusWorldState.instances['R6-Satin-01']?.colorId || 'satin-mint';
        const satin1Hex = (satin1Color.startsWith('#') ? satin1Color : null) ||
            SATIN_COLORS.find(c => c.id === satin1Color)?.previewHex || '#78C4B8';
        const satin1 = createSatinBeddingMesh('R6-Satin-01', satin1Hex);
        satin1.group.position.set(6.3, 0.02, 16.2);
        if (campusWorldState.selectedInstanceId === 'R6-Satin-01') satin1.setSelected(true);
        group.add(satin1.group);
        satinInstances['R6-Satin-01'] = satin1;

        const satin2Color = campusWorldState.instances['R6-Satin-02']?.colorId || 'satin-pink';
        const satin2Hex = (satin2Color.startsWith('#') ? satin2Color : null) ||
            SATIN_COLORS.find(c => c.id === satin2Color)?.previewHex || '#F7C5CC';
        const satin2 = createSatinBeddingMesh('R6-Satin-02', satin2Hex);
        satin2.group.position.set(6.3, 0.02, 18.5);
        if (campusWorldState.selectedInstanceId === 'R6-Satin-02') satin2.setSelected(true);
        group.add(satin2.group);
        satinInstances['R6-Satin-02'] = satin2;

        const zoneBLabel = this.createTextLabel('KHU B: SATIN HÀN QUỐC', 0x183b3a, 0xffffff);
        zoneBLabel.position.set(6.3, 0.45, 15.3);
        group.add(zoneBLabel);

        // 5. Khu C: Nệm Foam Gấp 4 (1 set) + Cubby shelf
        const foamCubby = this.createCubbyShelf(2.2, 0.9, 0.45);
        foamCubby.position.set(8.0, 0, 15.3);
        group.add(foamCubby);

        const foamInst = createFoamFold4Mesh('R6-Foam-01', '#56C5ED');
        foamInst.group.position.set(8.0, 0.02, 16.2);
        if (campusWorldState.selectedInstanceId === 'R6-Foam-01') foamInst.setSelected(true);
        group.add(foamInst.group);
        foamFoldInstances['R6-Foam-01'] = foamInst;

        const zoneCLabel = this.createTextLabel('KHU C: NỆM FOAM GẤP 4', 0x183b3a, 0xffffff);
        zoneCLabel.position.set(8.0, 1.1, 15.3);
        group.add(zoneCLabel);

        // 6. Khu D: Túi Ngủ Cara (1 set)
        const sleepInst = createSleepingBagMesh('R6-Sleep-01', false, '#FFC076');
        sleepInst.group.position.set(8.0, 0.02, 18.5);
        if (campusWorldState.selectedInstanceId === 'R6-Sleep-01') sleepInst.setSelected(true);
        group.add(sleepInst.group);
        sleepInstances['R6-Sleep-01'] = sleepInst;

        const zoneDLabel = this.createTextLabel('KHU D: TÚI NGỦ MẦM NON', 0x183b3a, 0xffffff);
        zoneDLabel.position.set(8.0, 0.45, 17.6);
        group.add(zoneDLabel);

        // 7. Kệ E: Túi Bảo Quản (2 bags on rack)
        const bagRackGeo = new THREE.BoxGeometry(2.0, 0.4, 0.6);
        const bagRack = new THREE.Mesh(bagRackGeo, this.shelfWoodMaterial);
        bagRack.position.set(6.2, 0.2, 20.3);
        group.add(bagRack);

        const bag1 = createStorageBagMesh('R6-Bag-01', 'REF-BAG-HANDLE', '#087F8C');
        bag1.group.position.set(5.8, 0.4, 20.3);
        if (campusWorldState.selectedInstanceId === 'R6-Bag-01') bag1.setSelected(true);
        group.add(bag1.group);
        bagInstances['R6-Bag-01'] = bag1;

        const bag2 = createStorageBagMesh('R6-Bag-02', 'REF-BAG-DRAWSTRING', '#EFA9D7');
        bag2.group.position.set(6.6, 0.4, 20.3);
        if (campusWorldState.selectedInstanceId === 'R6-Bag-02') bag2.setSelected(true);
        group.add(bag2.group);
        bagInstances['R6-Bag-02'] = bag2;

        const shelfELabel = this.createTextLabel('KỆ E: TÚI BẢO QUẢN', 0x183b3a, 0xffffff);
        shelfELabel.position.set(6.2, 0.85, 20.3);
        group.add(shelfELabel);

        return {
            id: 'R6',
            group,
            caraInstances,
            satinInstances,
            foamFoldInstances,
            sleepInstances,
            bagInstances,
            doorInteractiveMeshes,
            update: (dt: number) => {
                foamInst.update(dt);
                bag1.update(dt);
                bag2.update(dt);
            },
            dispose: () => {
                cara1.dispose();
                cara2.dispose();
                satin1.dispose();
                satin2.dispose();
                foamInst.dispose();
                sleepInst.dispose();
                bag1.dispose();
                bag2.dispose();
            },
        };
    }

    /**
     * Builds R7: Phòng Đón Bé — Bàn Giao Cuối Tuần
     * Blueprint: 8x8m, center (0, 27), entrance door at Z=23 connecting to H0
     * Features:
     * - Teacher's consultation desk with chairs
     * - Storage cubby shelf with bag-may-01 and sample bags
     * - Single bag instance bag-may-01 reactively positioned by HandoverStateMachine
     * - Doorway back to H0 corridor
     */
    public buildRoomR7(): BuiltRoom {
        const group = new THREE.Group();
        group.name = 'Room_R7';
        const bagInstances: Record<string, StorageBagMeshInstance> = {};
        const doorInteractiveMeshes: THREE.Mesh[] = [];

        const roomW = 8;
        const roomL = 8;
        const height = 3.2;
        const centerX = 0;
        const centerZ = 27;

        // 1. Floor & Ceiling
        const floorGeo = new THREE.PlaneGeometry(roomW, roomL);
        floorGeo.rotateX(-Math.PI / 2);
        const floor = new THREE.Mesh(floorGeo, this.woodMaterial);
        floor.position.set(centerX, 0, centerZ);
        floor.receiveShadow = true;
        group.add(floor);

        const ceiling = new THREE.Mesh(floorGeo, this.ceilingMaterial);
        ceiling.position.set(centerX, height, centerZ);
        group.add(ceiling);

        // 2. Walls
        // Left Wall (X = -4)
        const sideWallGeo = new THREE.BoxGeometry(0.1, height, roomL);
        const leftWall = new THREE.Mesh(sideWallGeo, this.wallMaterial);
        leftWall.position.set(-roomW / 2, height / 2, centerZ);
        group.add(leftWall);

        // Right Wall (X = +4) with daylight windows
        const rightWall = new THREE.Mesh(sideWallGeo, this.wallMaterial);
        rightWall.position.set(roomW / 2, height / 2, centerZ);
        group.add(rightWall);

        for (let wz = centerZ - 2.5; wz <= centerZ + 2.5; wz += 2.5) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.6), this.windowGlassMaterial);
            win.position.set(roomW / 2, 1.8, wz);
            group.add(win);
        }

        // Back Wall (Z = 31)
        const backWallGeo = new THREE.BoxGeometry(roomW, height, 0.1);
        const backWall = new THREE.Mesh(backWallGeo, this.wallMaterial);
        backWall.position.set(centerX, height / 2, centerZ + roomL / 2);
        group.add(backWall);

        // Front Wall (Z = 23) with central doorway
        const wallSegmentW = (roomW - 1.8) / 2;
        const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallSegmentW, height, 0.1), this.wallMaterial);
        frontWallLeft.position.set(-roomW / 2 + wallSegmentW / 2, height / 2, centerZ - roomL / 2);
        group.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(wallSegmentW, height, 0.1), this.wallMaterial);
        frontWallRight.position.set(roomW / 2 - wallSegmentW / 2, height / 2, centerZ - roomL / 2);
        group.add(frontWallRight);

        const frontDoorLintel = new THREE.Mesh(new THREE.BoxGeometry(1.8, height - 2.4, 0.1), this.wallMaterial);
        frontDoorLintel.position.set(centerX, 2.4 + (height - 2.4) / 2, centerZ - roomL / 2);
        group.add(frontDoorLintel);

        // Door frame to H0
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 0.15), this.doorFrameMaterial);
        doorFrame.position.set(centerX, 1.2, centerZ - roomL / 2);
        group.add(doorFrame);

        // Door panel trigger to H0
        const doorPanel = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.3, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x087f8c, roughness: 0.5 })
        );
        doorPanel.position.set(centerX, 1.2, centerZ - roomL / 2);
        doorPanel.userData = { targetRoomId: 'H0' };
        group.add(doorPanel);
        doorInteractiveMeshes.push(doorPanel);

        const exitSign = this.createTextLabel('← RA HÀNH LANG (H0)', 0x183b3a, 0xffffff);
        exitSign.position.set(centerX, 2.5, centerZ - roomL / 2 + 0.1);
        group.add(exitSign);

        // Room Header Sign inside R7
        const roomSign = this.createTextLabel('PHÒNG ĐÓN BÉ — BÀN GIAO CUỐI TUẦN', 0x183b3a, 0xffffff);
        roomSign.position.set(centerX, 2.8, centerZ - roomL / 2 + 0.1);
        group.add(roomSign);

        // 3. Furniture: Teacher's Consultation Desk
        const deskGeo = new THREE.BoxGeometry(2.0, 0.75, 1.0);
        const desk = new THREE.Mesh(deskGeo, this.shelfWoodMaterial);
        desk.position.set(0, 0.375, 26.5);
        desk.castShadow = true;
        desk.receiveShadow = true;
        group.add(desk);

        const deskLabel = this.createTextLabel('BÀN ĐÓN TRẺ & KIỂM ĐỒ', 0x183b3a, 0xffffff);
        deskLabel.position.set(0, 0.85, 26.5);
        group.add(deskLabel);

        // Teacher's Chair (behind desk, Z=27.3)
        const chairGeo = new THREE.BoxGeometry(0.5, 0.45, 0.5);
        const teacherChair = new THREE.Mesh(chairGeo, this.shelfWoodMaterial);
        teacherChair.position.set(0, 0.225, 27.3);
        group.add(teacherChair);

        // Parent's Chair (in front of desk, Z=25.7)
        const parentChair = new THREE.Mesh(chairGeo, this.shelfWoodMaterial);
        parentChair.position.set(0.3, 0.225, 25.6);
        group.add(parentChair);

        // 4. Furniture: Storage Shelf along Left Wall (X = -2.8, Z = 26.5)
        const cubby = this.createCubbyShelf(2.4, 1.0, 0.45);
        cubby.position.set(-2.8, 0, 26.5);
        group.add(cubby);

        const shelfLabel = this.createTextLabel('KỆ ĐỒ CHỜ PHỤ HUYNH ĐÓN', 0x183b3a, 0xffffff);
        shelfLabel.position.set(-2.8, 1.2, 26.5);
        group.add(shelfLabel);

        // Background sample bags on other cubby slots (fictional class bags)
        const sampleBag1 = createStorageBagMesh('sample-bag-01', 'REF-BAG-DRAWSTRING', '#FFC076');
        sampleBag1.group.position.set(-3.2, 0.55, 26.5);
        group.add(sampleBag1.group);

        const sampleBag2 = createStorageBagMesh('sample-bag-02', 'REF-BAG-BOX', '#ACD942');
        sampleBag2.group.position.set(-2.4, 0.55, 26.5);
        group.add(sampleBag2.group);

        // 5. Primary Handover Bag: bag-may-01
        // Single bag instance initialized on shelf
        const bagMay = createStorageBagMesh('bag-may-01', 'REF-BAG-HANDLE', '#087F8C');
        bagMay.group.position.set(-2.8, 0.55, 26.5);
        group.add(bagMay.group);
        bagInstances['bag-may-01'] = bagMay;

        return {
            id: 'R7',
            group,
            bagInstances,
            doorInteractiveMeshes,
            update: (dt: number) => {
                // Dynamically sync bag-may-01 position from HandoverStateMachine
                const pos = handoverStateMachine.getBagPosition();
                bagMay.group.position.set(pos[0], pos[1], pos[2]);
                bagMay.update(dt);
                sampleBag1.update(dt);
                sampleBag2.update(dt);
            },
            dispose: () => {
                bagMay.dispose();
                sampleBag1.dispose();
                sampleBag2.dispose();
            },
        };
    }

    /**
     * Helper to construct walls, floor, ceiling, daylight windows, and doorway
     */
    private addRoomShell(
        group: THREE.Group,
        centerX: number,
        centerZ: number,
        roomW: number,
        roomL: number,
        height: number,
        side: 'left' | 'right',
        targetExitId: RoomId,
        exitLabel: string,
        doorTriggers: THREE.Mesh[]
    ) {
        // Floor & Ceiling
        const floorGeo = new THREE.PlaneGeometry(roomW, roomL);
        floorGeo.rotateX(-Math.PI / 2);
        const floor = new THREE.Mesh(floorGeo, this.woodMaterial);
        floor.position.set(centerX, 0, centerZ);
        floor.receiveShadow = true;
        group.add(floor);

        const ceilingGeo = new THREE.PlaneGeometry(roomW, roomL);
        ceilingGeo.rotateX(Math.PI / 2);
        const ceiling = new THREE.Mesh(ceilingGeo, this.ceilingMaterial);
        ceiling.position.set(centerX, height, centerZ);
        group.add(ceiling);

        // Back & Front walls
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, height, 0.15), this.wallMaterial);
        backWall.position.set(centerX, height / 2, centerZ - roomL / 2);
        group.add(backWall);

        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, height, 0.15), this.wallMaterial);
        frontWall.position.set(centerX, height / 2, centerZ + roomL / 2);
        group.add(frontWall);

        // Outer wall with windows
        const outerX = side === 'left' ? centerX - roomW / 2 : centerX + roomW / 2;
        const outerWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, height, roomL), this.wallMaterial);
        outerWall.position.set(outerX, height / 2, centerZ);
        group.add(outerWall);

        // Windows
        for (let wz = centerZ - 1.5; wz <= centerZ + 1.5; wz += 1.8) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.2), this.windowGlassMaterial);
            win.position.set(outerX + (side === 'left' ? 0.05 : -0.05), 1.8, wz);
            group.add(win);
        }

        // Inner wall with door to corridor
        const innerX = side === 'left' ? centerX + roomW / 2 : centerX - roomW / 2;
        const innerWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, height, (roomL - 1.6) / 2), this.wallMaterial);
        innerWall1.position.set(innerX, height / 2, centerZ - 1.9);
        group.add(innerWall1);

        const innerWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, height, (roomL - 1.6) / 2), this.wallMaterial);
        innerWall2.position.set(innerX, height / 2, centerZ + 1.9);
        group.add(innerWall2);

        // Exit doorway
        const exitDoor = this.createDoorway(targetExitId, exitLabel);
        exitDoor.position.set(innerX, 0, centerZ);
        exitDoor.rotation.y = side === 'left' ? -Math.PI / 2 : Math.PI / 2;
        group.add(exitDoor);

        const trigger = exitDoor.getObjectByName(`door_trigger_${targetExitId}`) as THREE.Mesh;
        if (trigger) doorTriggers.push(trigger);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.75);
        group.add(ambientLight);

        const spot = new THREE.PointLight(0xfff3e0, 0.8, 9);
        spot.position.set(centerX, 2.9, centerZ);
        group.add(spot);
    }

    private createDoorway(targetRoomId: RoomId, label: string): THREE.Group {
        const doorGroup = new THREE.Group();
        doorGroup.name = `Door_${targetRoomId}`;

        const postGeo = new THREE.BoxGeometry(0.08, 2.2, 0.16);
        const postLeft = new THREE.Mesh(postGeo, this.doorFrameMaterial);
        postLeft.position.set(-0.6, 1.1, 0);
        doorGroup.add(postLeft);

        const postRight = new THREE.Mesh(postGeo, this.doorFrameMaterial);
        postRight.position.set(0.6, 1.1, 0);
        doorGroup.add(postRight);

        const beamGeo = new THREE.BoxGeometry(1.28, 0.1, 0.16);
        const beamTop = new THREE.Mesh(beamGeo, this.doorFrameMaterial);
        beamTop.position.set(0, 2.25, 0);
        doorGroup.add(beamTop);

        const sign = this.createTextLabel(label, 0x183b3a, 0xffffff);
        sign.position.set(0, 2.45, 0.05);
        doorGroup.add(sign);

        const triggerGeo = new THREE.PlaneGeometry(1.1, 2.1);
        const triggerMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
        const triggerMesh = new THREE.Mesh(triggerGeo, triggerMat);
        triggerMesh.name = `door_trigger_${targetRoomId}`;
        triggerMesh.userData = { isDoor: true, targetRoomId };
        triggerMesh.position.set(0, 1.05, 0);
        doorGroup.add(triggerMesh);

        return doorGroup;
    }

    private createCubbyShelf(width: number, height: number, depth: number): THREE.Group {
        const shelfGroup = new THREE.Group();
        const woodMat = this.shelfWoodMaterial;

        const sideGeo = new THREE.BoxGeometry(0.03, height, depth);
        const topGeo = new THREE.BoxGeometry(width, 0.03, depth);

        const leftSide = new THREE.Mesh(sideGeo, woodMat);
        leftSide.position.set(-width / 2, height / 2, 0);
        shelfGroup.add(leftSide);

        const rightSide = new THREE.Mesh(sideGeo, woodMat);
        rightSide.position.set(width / 2, height / 2, 0);
        shelfGroup.add(rightSide);

        const top = new THREE.Mesh(topGeo, woodMat);
        top.position.set(0, height, 0);
        shelfGroup.add(top);

        const bottom = new THREE.Mesh(topGeo, woodMat);
        bottom.position.set(0, 0.015, 0);
        shelfGroup.add(bottom);

        const mid = new THREE.Mesh(topGeo, woodMat);
        mid.position.set(0, height / 2, 0);
        shelfGroup.add(mid);

        for (let i = 1; i <= 3; i++) {
            const x = -width / 2 + (width / 4) * i;
            const divider = new THREE.Mesh(sideGeo, woodMat);
            divider.position.set(x, height / 2, 0);
            shelfGroup.add(divider);
        }

        return shelfGroup;
    }

    private createTextLabel(text: string, fgColor: number, bgColor: number): THREE.Mesh {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#' + bgColor.toString(16).padStart(6, '0');
            ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 16) : ctx.fillRect(10, 10, 492, 108);
            ctx.fill();

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#DDE5E1';
            ctx.stroke();

            ctx.fillStyle = '#' + fgColor.toString(16).padStart(6, '0');
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 256, 64);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const planeGeo = new THREE.PlaneGeometry(0.8, 0.2);
        const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
        return new THREE.Mesh(planeGeo, planeMat);
    }
}
