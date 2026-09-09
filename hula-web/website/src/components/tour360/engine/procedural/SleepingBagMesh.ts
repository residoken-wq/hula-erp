/**
 * SleepingBagMesh.ts
 * Procedural 3D model for Sleeping Bag line:
 * - REF-SLEEP-CARA-STD: Standard thin blanket sleeping bag (1.25 x 0.63 m pad, 0.98 x 0.80 m blanket)
 * - REF-SLEEP-CARA-PLUS: Enhanced warm sleeping bag with thick quilted wave blanket
 */

import * as THREE from 'three';

export interface SleepingBagMeshInstance {
    group: THREE.Group;
    instanceId: string;
    isPlus: boolean;
    updateColor: (hex: string) => void;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    dispose: () => void;
}

export function createSleepingBagMesh(
    instanceId: string,
    isPlus: boolean = false,
    initialHex: string = '#56C5ED'
): SleepingBagMeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: isPlus ? 'REF-SLEEP-CARA-PLUS' : 'REF-SLEEP-CARA-STD' };

    const fabricMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.8,
        metalness: 0.05,
    });

    const innerLiningMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FAF8F2'),
        roughness: 0.9,
    });

    const pipingMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8E9B97'),
        roughness: 0.6,
    });

    // 1. Sleeping Pad base: 1.25m (Z) x 0.63m (X) x 0.02m (Y)
    const padW = 0.63;
    const padL = 1.25;
    const padGeo = new THREE.BoxGeometry(padW, 0.02, padL);
    const padMesh = new THREE.Mesh(padGeo, fabricMat);
    padMesh.position.set(0, 0.01, padL / 2);
    padMesh.castShadow = true;
    padMesh.receiveShadow = true;
    group.add(padMesh);

    // Integrated pillow at head (Z in [0, 0.25])
    const pillowGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.40, 20);
    pillowGeo.rotateZ(Math.PI / 2);
    pillowGeo.scale(1, 0.35, 1);
    const pillowMesh = new THREE.Mesh(pillowGeo, fabricMat);
    pillowMesh.position.set(0, 0.045, 0.16);
    pillowMesh.castShadow = true;
    group.add(pillowMesh);

    // Attached Blanket: 0.80m (X) x 0.98m (Z)
    // Starts at Z = 0.27m and covers down to Z = 1.25m
    const blanketThickness = isPlus ? 0.035 : 0.014;
    const blanketGeo = new THREE.BoxGeometry(padW * 1.05, blanketThickness, 0.96);
    const blanketMesh = new THREE.Mesh(blanketGeo, fabricMat);
    blanketMesh.position.set(0, 0.02 + blanketThickness / 2, 0.27 + 0.96 / 2);
    blanketMesh.castShadow = true;
    blanketMesh.receiveShadow = true;
    group.add(blanketMesh);

    // Turned-over top fold of blanket (showing soft inner lining)
    const cuffGeo = new THREE.BoxGeometry(padW * 1.05, blanketThickness * 1.1, 0.12);
    const cuffMesh = new THREE.Mesh(cuffGeo, innerLiningMat);
    cuffMesh.position.set(0, 0.025 + blanketThickness, 0.27 + 0.06);
    group.add(cuffMesh);

    // If PLUS, add puffy quilting crests along blanket
    const plusCrests: THREE.Mesh[] = [];
    if (isPlus) {
        for (let cz = 0.45; cz <= 1.15; cz += 0.18) {
            const crestGeo = new THREE.CylinderGeometry(0.012, 0.012, padW * 1.02, 16);
            crestGeo.rotateZ(Math.PI / 2);
            const crest = new THREE.Mesh(crestGeo, pipingMat);
            crest.position.set(0, 0.025 + blanketThickness, cz);
            group.add(crest);
            plusCrests.push(crest);
        }
    }

    // Selection ring
    const ringGeo = new THREE.RingGeometry(0.42, 0.45, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x087f8c, transparent: true, opacity: 0 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.005, padL / 2);
    group.add(ringMesh);

    let isSelected = false;
    let isHovered = false;

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
        isPlus,
        updateColor: (hex: string) => {
            fabricMat.color.set(hex);
        },
        setHovered: (h: boolean) => {
            isHovered = h;
            updateRing();
        },
        setSelected: (s: boolean) => {
            isSelected = s;
            updateRing();
        },
        dispose: () => {
            padGeo.dispose();
            pillowGeo.dispose();
            blanketGeo.dispose();
            cuffGeo.dispose();
            ringGeo.dispose();
            plusCrests.forEach(c => c.geometry.dispose());
            fabricMat.dispose();
            innerLiningMat.dispose();
            pipingMat.dispose();
            ringMat.dispose();
        },
    };
}
