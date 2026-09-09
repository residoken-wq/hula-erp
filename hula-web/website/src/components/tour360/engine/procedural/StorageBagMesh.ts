/**
 * StorageBagMesh.ts
 * 3D models for 5 Storage Bag variants (REF-BAG-*):
 * 1. REF-BAG-DRAWSTRING: Balo rút mầm non
 * 2. REF-BAG-HANDLE: Túi quai xách (loads /models/hula_bag.glb with procedural fallback)
 * 3. REF-BAG-SHOULDER: Túi quai đeo chéo
 * 4. REF-BAG-BOX: Túi hộp vuông vắn
 * 5. REF-BAG-BOX-STITCH: Túi hộp diễu viền
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type StorageBagType =
    | 'REF-BAG-DRAWSTRING'
    | 'REF-BAG-HANDLE'
    | 'REF-BAG-SHOULDER'
    | 'REF-BAG-BOX'
    | 'REF-BAG-BOX-STITCH';

export interface StorageBagMeshInstance {
    group: THREE.Group;
    instanceId: string;
    bagType: StorageBagType;
    isStored: boolean;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    animateStore: (targetStored: boolean, targetSlotPos: [number, number, number], onDone?: () => void) => void;
    update: (dt: number) => void;
    dispose: () => void;
}

let cachedGLTFBagScene: THREE.Group | null = null;
let gltfLoadingPromise: Promise<THREE.Group> | null = null;

function loadGLTFBag(): Promise<THREE.Group> {
    if (cachedGLTFBagScene) return Promise.resolve(cachedGLTFBagScene.clone());
    if (gltfLoadingPromise) return gltfLoadingPromise;

    gltfLoadingPromise = new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            '/models/hula_bag.glb',
            (gltf) => {
                cachedGLTFBagScene = gltf.scene;
                // Scale model to real world size (~0.48m x 0.40m)
                cachedGLTFBagScene.scale.set(0.01, 0.01, 0.01);
                cachedGLTFBagScene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                resolve(cachedGLTFBagScene.clone());
            },
            undefined,
            (err) => {
                console.warn('Could not load hula_bag.glb, fallback to procedural handle bag', err);
                reject(err);
            }
        );
    });

    return gltfLoadingPromise;
}

export function createStorageBagMesh(
    instanceId: string,
    bagType: StorageBagType,
    colorHex: string = '#087F8C'
): StorageBagMeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: bagType };

    const bagMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.65,
        metalness: 0.1,
    });

    const strapMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#183B3A'),
        roughness: 0.8,
    });

    const labelMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FFF8EE'),
        roughness: 0.4,
    });

    // Ring indicator
    const ringGeo = new THREE.RingGeometry(0.25, 0.28, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x087f8c, transparent: true, opacity: 0 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.005, 0);
    group.add(ringMesh);

    // Build geometry based on bag type
    if (bagType === 'REF-BAG-HANDLE') {
        // Handle bag: try loading GLTF model or fallback
        const placeholderBox = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.40, 0.16), bagMat);
        placeholderBox.position.set(0, 0.20, 0);
        placeholderBox.castShadow = true;
        group.add(placeholderBox);

        // Webbing handle straps
        const handleGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 24, Math.PI);
        const handleMesh = new THREE.Mesh(handleGeo, strapMat);
        handleMesh.position.set(0, 0.40, 0);
        group.add(handleMesh);

        loadGLTFBag().then((gltfGroup) => {
            group.remove(placeholderBox);
            group.remove(handleMesh);
            gltfGroup.position.set(0, 0.05, 0);
            group.add(gltfGroup);
        }).catch(() => {});
    } else if (bagType === 'REF-BAG-DRAWSTRING') {
        // Drawstring backpack
        const geo = new THREE.CylinderGeometry(0.16, 0.22, 0.42, 20);
        const mesh = new THREE.Mesh(geo, bagMat);
        mesh.position.set(0, 0.21, 0);
        mesh.castShadow = true;
        group.add(mesh);

        // Drawstring cords
        const cordGeo = new THREE.TorusGeometry(0.18, 0.008, 6, 20);
        const cordMesh = new THREE.Mesh(cordGeo, strapMat);
        cordMesh.position.set(0, 0.40, 0);
        cordMesh.rotateX(Math.PI / 2);
        group.add(cordMesh);
    } else if (bagType === 'REF-BAG-SHOULDER') {
        // Shoulder cross-body bag
        const geo = new THREE.BoxGeometry(0.42, 0.36, 0.14);
        const mesh = new THREE.Mesh(geo, bagMat);
        mesh.position.set(0, 0.18, 0);
        mesh.castShadow = true;
        group.add(mesh);

        // Long shoulder strap
        const strapGeo = new THREE.TorusGeometry(0.24, 0.014, 8, 30, Math.PI);
        const strapMesh = new THREE.Mesh(strapGeo, strapMat);
        strapMesh.position.set(0, 0.36, 0);
        group.add(strapMesh);
    } else if (bagType === 'REF-BAG-BOX') {
        // Box bag (structured duffel/cuboid)
        const geo = new THREE.BoxGeometry(0.50, 0.32, 0.24);
        const mesh = new THREE.Mesh(geo, bagMat);
        mesh.position.set(0, 0.16, 0);
        mesh.castShadow = true;
        group.add(mesh);

        // Top zip line
        const zipGeo = new THREE.BoxGeometry(0.46, 0.006, 0.02);
        const zipMesh = new THREE.Mesh(zipGeo, strapMat);
        zipMesh.position.set(0, 0.325, 0);
        group.add(zipMesh);
    } else {
        // REF-BAG-BOX-STITCH: Box bag with stitched piping
        const geo = new THREE.BoxGeometry(0.50, 0.32, 0.24);
        const mesh = new THREE.Mesh(geo, bagMat);
        mesh.position.set(0, 0.16, 0);
        mesh.castShadow = true;
        group.add(mesh);

        // Stitched piping edge accent
        const stitchGeo = new THREE.BoxGeometry(0.51, 0.33, 0.01);
        const stitchMesh = new THREE.Mesh(stitchGeo, strapMat);
        stitchMesh.position.set(0, 0.16, 0.125);
        group.add(stitchMesh);
    }

    // Name label on front (e.g. tag for "Mây — Lớp Mầm")
    const labelGeo = new THREE.PlaneGeometry(0.09, 0.05);
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, 0.18, 0.12);
    group.add(labelMesh);

    let isStored = false;
    let isSelected = false;
    let isHovered = false;

    let isAnimatingStore = false;
    let storeProgress = 0;
    let storeStartPos = new THREE.Vector3();
    let storeEndPos = new THREE.Vector3();
    let onStoreDoneCb: (() => void) | null = null;

    const updateRing = () => {
        if (isSelected) {
            ringMat.color.setHex(0x087f8c);
            ringMat.opacity = 0.9;
        } else if (isHovered) {
            ringMat.color.setHex(0x56c5ed);
            ringMat.opacity = 0.5;
        } else {
            ringMat.opacity = 0;
        }
    };

    return {
        group,
        instanceId,
        bagType,
        get isStored() { return isStored; },
        setHovered: (h: boolean) => {
            isHovered = h;
            updateRing();
        },
        setSelected: (s: boolean) => {
            isSelected = s;
            updateRing();
        },
        animateStore: (targetStored: boolean, targetSlotPos: [number, number, number], onDone?: () => void) => {
            isStored = targetStored;
            isAnimatingStore = true;
            storeProgress = 0;
            storeStartPos.copy(group.position);
            storeEndPos.set(targetSlotPos[0], targetSlotPos[1], targetSlotPos[2]);
            onStoreDoneCb = onDone || null;
        },
        update: (dt: number) => {
            if (isAnimatingStore) {
                storeProgress = Math.min(1, storeProgress + dt * 1.5);
                const t = storeProgress < 0.5
                    ? 2 * storeProgress * storeProgress
                    : -1 + (4 - 2 * storeProgress) * storeProgress;

                group.position.lerpVectors(storeStartPos, storeEndPos, t);

                if (storeProgress >= 1) {
                    isAnimatingStore = false;
                    if (onStoreDoneCb) {
                        const cb = onStoreDoneCb;
                        onStoreDoneCb = null;
                        cb();
                    }
                }
            }
        },
        dispose: () => {
            ringGeo.dispose();
            bagMat.dispose();
            strapMat.dispose();
            labelMat.dispose();
            ringMat.dispose();
        },
    };
}
