/**
 * FoamMattressMesh.ts
 * Procedural 3D models for Foam Mattress line (REF-FOAM-FOLD4 & REF-FOAM-BASIC):
 * - REF-FOAM-FOLD4: 1.20 x 0.60 x 0.03 m in 4 distinct segments (0.30m each)
 *   Hierarchical hinge pivots for folding animation (1.5-2.5s)
 *   Smooth storage into cubby slot / retrieval back to floor
 * - REF-FOAM-BASIC: 1.20 x 0.60 x 0.03 m single flat foam block with back zipper
 */

import * as THREE from 'three';

export interface FoamFold4MeshInstance {
    group: THREE.Group;
    instanceId: string;
    isFolded: boolean;
    isStored: boolean;
    updateColor: (hex: string) => void;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    animateFold: (targetFolded: boolean, onDone?: () => void) => void;
    animateStore: (targetStored: boolean, targetShelfPos: [number, number, number], onDone?: () => void) => void;
    update: (dt: number) => void;
    dispose: () => void;
}

export function createFoamFold4Mesh(
    instanceId: string,
    initialHex: string = '#56C5ED'
): FoamFold4MeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: 'REF-FOAM-FOLD4' };

    const fabricMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.75,
        metalness: 0.05,
    });

    const foamEdgeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#9AB5AA'),
        roughness: 0.7,
    });

    const strapMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#183B3A'),
        roughness: 0.6,
    });

    // 4 Segments: each 0.60m (X) x 0.30m (Z) x 0.03m (Y)
    const segW = 0.60;
    const segL = 0.30;
    const segH = 0.03;

    // Segment geometry
    const createSegmentMesh = () => {
        const segGroup = new THREE.Group();
        const boxGeo = new THREE.BoxGeometry(segW, segH, segL);
        const mesh = new THREE.Mesh(boxGeo, fabricMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(0, segH / 2, segL / 2);
        segGroup.add(mesh);
        return { segGroup, boxGeo };
    };

    // Seg 1 (base, on floor)
    const s1 = createSegmentMesh();
    group.add(s1.segGroup);

    // Hinge 1 -> Seg 2
    const h1 = new THREE.Group();
    h1.position.set(0, 0, segL);
    s1.segGroup.add(h1);
    const s2 = createSegmentMesh();
    h1.add(s2.segGroup);

    // Hinge 2 -> Seg 3
    const h2 = new THREE.Group();
    h2.position.set(0, 0, segL);
    s2.segGroup.add(h2);
    const s3 = createSegmentMesh();
    h2.add(s3.segGroup);

    // Hinge 3 -> Seg 4
    const h3 = new THREE.Group();
    h3.position.set(0, 0, segL);
    s3.segGroup.add(h3);
    const s4 = createSegmentMesh();
    h3.add(s4.segGroup);

    // Storage holding strap (visible when folded)
    const strapGeo = new THREE.BoxGeometry(segW * 0.4, 0.005, 0.04);
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.position.set(0, segH * 4 + 0.005, segL / 2);
    strapMesh.visible = false;
    group.add(strapMesh);

    // Floor selection indicator ring
    const ringGeo = new THREE.RingGeometry(0.42, 0.45, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x087f8c, transparent: true, opacity: 0 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.005, segL * 2);
    group.add(ringMesh);

    // State & Animation
    let isFolded = false;
    let isStored = false;
    let isSelected = false;
    let isHovered = false;

    let foldProgress = 0; // 0 = flat, 1 = folded
    let targetFoldProgress = 0;
    let isAnimatingFold = false;
    let onFoldDoneCb: (() => void) | null = null;

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
        get isFolded() { return isFolded; },
        get isStored() { return isStored; },
        updateColor: (hex: string) => {
            fabricMat.color.set(hex);
        },
        setHovered: (hovered: boolean) => {
            isHovered = hovered;
            updateRing();
        },
        setSelected: (sel: boolean) => {
            isSelected = sel;
            updateRing();
        },
        animateFold: (targetFolded: boolean, onDone?: () => void) => {
            isFolded = targetFolded;
            targetFoldProgress = targetFolded ? 1 : 0;
            isAnimatingFold = true;
            onFoldDoneCb = onDone || null;
        },
        animateStore: (targetStored: boolean, targetShelfPos: [number, number, number], onDone?: () => void) => {
            isStored = targetStored;
            isAnimatingStore = true;
            storeProgress = 0;
            storeStartPos.copy(group.position);
            storeEndPos.set(targetShelfPos[0], targetShelfPos[1], targetShelfPos[2]);
            onStoreDoneCb = onDone || null;
        },
        update: (dt: number) => {
            // Fold animation (accordion folding)
            if (isAnimatingFold) {
                const speed = 1.0 / 1.8; // ~1.8s duration
                if (targetFoldProgress > foldProgress) {
                    foldProgress = Math.min(1, foldProgress + dt * speed);
                } else {
                    foldProgress = Math.max(0, foldProgress - dt * speed);
                }

                // Hinge rotations in radians: folds z-stack
                const angle = foldProgress * Math.PI;
                h1.rotation.x = -angle;
                h2.rotation.x = angle;
                h3.rotation.x = -angle;

                strapMesh.visible = foldProgress > 0.85;

                if (foldProgress === targetFoldProgress) {
                    isAnimatingFold = false;
                    if (onFoldDoneCb) {
                        const cb = onFoldDoneCb;
                        onFoldDoneCb = null;
                        cb();
                    }
                }
            }

            // Store / retrieve translation animation
            if (isAnimatingStore) {
                storeProgress = Math.min(1, storeProgress + dt * 1.4);
                // EaseInOut
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
            s1.boxGeo.dispose();
            s2.boxGeo.dispose();
            s3.boxGeo.dispose();
            s4.boxGeo.dispose();
            strapGeo.dispose();
            ringGeo.dispose();
            fabricMat.dispose();
            foamEdgeMat.dispose();
            strapMat.dispose();
            ringMat.dispose();
        },
    };
}

export interface FoamBasicMeshInstance {
    group: THREE.Group;
    instanceId: string;
    updateColor: (hex: string) => void;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    dispose: () => void;
}

export function createFoamBasicMesh(
    instanceId: string,
    initialHex: string = '#EAD8C0'
): FoamBasicMeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: 'REF-FOAM-BASIC' };

    const fabricMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.8,
        metalness: 0.0,
    });

    const zipperMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#7A8B86'),
        metalness: 0.6,
        roughness: 0.3,
    });

    // 1.20 x 0.60 x 0.03 m single solid foam mattress
    const boxGeo = new THREE.BoxGeometry(0.60, 0.03, 1.20);
    const mesh = new THREE.Mesh(boxGeo, fabricMat);
    mesh.position.set(0, 0.015, 0.60);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Zipper line along back edge
    const zipGeo = new THREE.BoxGeometry(0.56, 0.004, 0.01);
    const zipMesh = new THREE.Mesh(zipGeo, zipperMat);
    zipMesh.position.set(0, 0.031, 0.05);
    group.add(zipMesh);

    return {
        group,
        instanceId,
        updateColor: (hex: string) => { fabricMat.color.set(hex); },
        setHovered: () => {},
        setSelected: () => {},
        dispose: () => {
            boxGeo.dispose();
            zipGeo.dispose();
            fabricMat.dispose();
            zipperMat.dispose();
        },
    };
}
