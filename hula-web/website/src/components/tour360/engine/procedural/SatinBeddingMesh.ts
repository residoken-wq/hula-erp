/**
 * SatinBeddingMesh.ts
 * Procedural 3D model for Satin Korean Bedding Set (REF-MAT-SATIN-STD):
 * - Mattress: 1.20 x 0.65 m (distinct 65cm width, compared to Cara 63cm)
 * - Pillow: 0.40 x 0.25 m soft contoured pillow
 * - Blanket: 1.30 x 0.70 m silky draped blanket
 * - Luxurious smooth Satin PBR material with subtle sheen (MeshPhysicalMaterial)
 * - Dedicated piping and anti-slip base
 */

import * as THREE from 'three';

export interface SatinBeddingMeshInstance {
    group: THREE.Group;
    instanceId: string;
    updateColor: (hex: string) => void;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    dispose: () => void;
}

export function createSatinBeddingMesh(
    instanceId: string,
    initialHex: string = '#78C4B8'
): SatinBeddingMeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: 'REF-MAT-SATIN-STD' };

    // Silky smooth Korean Satin material
    const fabricMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.38,
        metalness: 0.12,
        clearcoat: 0.25,
        clearcoatRoughness: 0.3,
        reflectivity: 0.6,
    });

    const pipingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#94A39E'),
        roughness: 0.6,
    });

    const antislipMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2C3331'),
        roughness: 0.95,
    });

    // 1. Mattress Geometry: 1.20m (Z) x 0.65m (X) x 0.025m (Y)
    const matLength = 1.20;
    const matWidth = 0.65;
    const matThickness = 0.025;

    const shape = new THREE.Shape();
    const halfW = matWidth / 2;
    const halfL = matLength / 2;
    const radius = 0.04;

    shape.moveTo(-halfW + radius, -halfL);
    shape.lineTo(halfW - radius, -halfL);
    shape.quadraticCurveTo(halfW, -halfL, halfW, -halfL + radius);
    shape.lineTo(halfW, halfL - radius);
    shape.quadraticCurveTo(halfW, halfL, halfW - radius, halfL);
    shape.lineTo(-halfW + radius, halfL);
    shape.quadraticCurveTo(-halfW, halfL, -halfW, halfL - radius);
    shape.lineTo(-halfW, -halfL + radius);
    shape.quadraticCurveTo(-halfW, -halfL, -halfW + radius, -halfL);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: matThickness,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.012,
        bevelThickness: 0.008,
    };

    const matGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    matGeometry.rotateX(Math.PI / 2);
    matGeometry.center();

    const mattressMesh = new THREE.Mesh(matGeometry, fabricMaterial);
    mattressMesh.position.y = matThickness / 2 + 0.005;
    mattressMesh.castShadow = true;
    mattressMesh.receiveShadow = true;
    group.add(mattressMesh);

    // 2. Anti-slip bottom plane
    const bottomGeo = new THREE.PlaneGeometry(matWidth * 0.96, matLength * 0.96);
    bottomGeo.rotateX(-Math.PI / 2);
    const bottomMesh = new THREE.Mesh(bottomGeo, antislipMaterial);
    bottomMesh.position.y = 0.002;
    group.add(bottomMesh);

    // 3. Satin Piping border
    const pipingCurve = new THREE.CurvePath<THREE.Vector3>();
    const pw = halfW + 0.008;
    const pl = halfL + 0.008;
    const pr = radius;

    const p1 = new THREE.Vector3(-pw + pr, 0, -pl);
    const p2 = new THREE.Vector3(pw - pr, 0, -pl);
    const p3 = new THREE.Vector3(pw, 0, -pl + pr);
    const p4 = new THREE.Vector3(pw, 0, pl - pr);
    const p5 = new THREE.Vector3(pw - pr, 0, pl);
    const p6 = new THREE.Vector3(-pw + pr, 0, pl);
    const p7 = new THREE.Vector3(-pw, 0, pl - pr);
    const p8 = new THREE.Vector3(-pw, 0, -pl + pr);

    pipingCurve.add(new THREE.LineCurve3(p1, p2));
    pipingCurve.add(new THREE.QuadraticBezierCurve3(p2, new THREE.Vector3(pw, 0, -pl), p3));
    pipingCurve.add(new THREE.LineCurve3(p3, p4));
    pipingCurve.add(new THREE.QuadraticBezierCurve3(p4, new THREE.Vector3(pw, 0, pl), p5));
    pipingCurve.add(new THREE.LineCurve3(p5, p6));
    pipingCurve.add(new THREE.QuadraticBezierCurve3(p6, new THREE.Vector3(-pw, 0, pl), p7));
    pipingCurve.add(new THREE.LineCurve3(p7, p8));
    pipingCurve.add(new THREE.QuadraticBezierCurve3(p8, new THREE.Vector3(-pw, 0, -pl), p1));

    const pipingGeo = new THREE.TubeGeometry(pipingCurve, 64, 0.006, 8, true);
    const pipingMesh = new THREE.Mesh(pipingGeo, pipingMaterial);
    pipingMesh.position.y = matThickness / 2 + 0.006;
    pipingMesh.castShadow = true;
    group.add(pipingMesh);

    // 4. Pillow: 0.40m x 0.25m
    const pillowGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.38, 24);
    pillowGeo.rotateZ(Math.PI / 2);
    pillowGeo.scale(1, 0.35, 1);
    const pillowMesh = new THREE.Mesh(pillowGeo, fabricMaterial);
    pillowMesh.position.set(0, matThickness + 0.045, -halfL + 0.18);
    pillowMesh.castShadow = true;
    pillowMesh.receiveShadow = true;
    group.add(pillowMesh);

    // 5. Silky Blanket: 1.30m x 0.70m folded
    const blanketShape = new THREE.Shape();
    const bw = halfW * 0.98;
    const bl = halfL * 0.95;
    const br = 0.03;

    blanketShape.moveTo(-bw + br, -bl);
    blanketShape.lineTo(bw - br, -bl);
    blanketShape.quadraticCurveTo(bw, -bl, bw, -bl + br);
    blanketShape.lineTo(bw, bl - br);
    blanketShape.quadraticCurveTo(bw, bl, bw - br, bl);
    blanketShape.lineTo(-bw + br, bl);
    blanketShape.quadraticCurveTo(-bw, bl, -bw, bl - br);
    blanketShape.lineTo(-bw, -bl + br);
    blanketShape.quadraticCurveTo(-bw, -bl, -bw + br, -bl);

    const blanketExtrude = new THREE.ExtrudeGeometry(blanketShape, {
        depth: 0.016,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.008,
        bevelThickness: 0.006,
    });
    blanketExtrude.rotateX(Math.PI / 2);
    blanketExtrude.center();

    const blanketMesh = new THREE.Mesh(blanketExtrude, fabricMaterial);
    blanketMesh.position.set(0, matThickness + 0.018, halfL * 0.4);
    blanketMesh.castShadow = true;
    blanketMesh.receiveShadow = true;
    group.add(blanketMesh);

    // Selection ring
    const ringGeo = new THREE.RingGeometry(0.45, 0.48, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x087f8c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.005;
    group.add(ringMesh);

    let isSelectedState = false;
    let isHoveredState = false;

    const updateRing = () => {
        if (isSelectedState) {
            ringMat.color.setHex(0x087f8c);
            ringMat.opacity = 0.9;
        } else if (isHoveredState) {
            ringMat.color.setHex(0x56c5ed);
            ringMat.opacity = 0.5;
        } else {
            ringMat.opacity = 0;
        }
    };

    return {
        group,
        instanceId,
        updateColor: (hex: string) => {
            fabricMaterial.color.set(hex);
        },
        setHovered: (hovered: boolean) => {
            isHoveredState = hovered;
            updateRing();
        },
        setSelected: (selected: boolean) => {
            isSelectedState = selected;
            updateRing();
        },
        dispose: () => {
            matGeometry.dispose();
            bottomGeo.dispose();
            pipingGeo.dispose();
            pillowGeo.dispose();
            blanketExtrude.dispose();
            ringGeo.dispose();
            fabricMaterial.dispose();
            pipingMaterial.dispose();
            antislipMaterial.dispose();
            ringMat.dispose();
        },
    };
}
