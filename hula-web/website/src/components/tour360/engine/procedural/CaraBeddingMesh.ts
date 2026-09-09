/**
 * CaraBeddingMesh.ts
 * Procedural PBR 3D model for Cotton Cara Bedding Set (REF-MAT-CARA-STD):
 * - Mattress: 1.20 x 0.63 m with rounded edges, quilted surface wave, and anti-slip underside
 * - Pillow: 0.40 x 0.25 m soft contoured pillow at head of bed
 * - Blanket: 1.30 x 0.70 m folded cotton blanket resting on lower half
 * - Dedicated Gray Piping (#8E9B97) framing the full mattress perimeter
 * - Independent fabric materials per instance so single vs group recoloring is exact
 * - Real PBR materials with procedural canvas normal/bump map (cotton weave + quilting waves)
 */

import * as THREE from 'three';

// Procedural normal map generator for cotton weave + quilting wave
let cachedQuiltNormalMap: THREE.CanvasTexture | null = null;

function getQuiltNormalMap(): THREE.CanvasTexture {
    if (cachedQuiltNormalMap) return cachedQuiltNormalMap;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#8080ff'; // flat tangent space normal (128, 128, 255)
        ctx.fillRect(0, 0, 512, 512);

        // Draw soft wave quilting contours
        ctx.lineWidth = 14;
        for (let y = 0; y <= 512; y += 64) {
            ctx.beginPath();
            for (let x = 0; x <= 512; x += 10) {
                const waveY = y + Math.sin((x / 512) * Math.PI * 4) * 16;
                if (x === 0) ctx.moveTo(x, waveY);
                else ctx.lineTo(x, waveY);
            }
            // Normal map channel gradient
            ctx.strokeStyle = 'rgba(160, 100, 240, 0.45)';
            ctx.stroke();
        }

        // Add fine cotton weave noise
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 18;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        }
        ctx.putImageData(imgData, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 3);
    cachedQuiltNormalMap = texture;
    return texture;
}

export interface CaraBeddingMeshInstance {
    group: THREE.Group;
    instanceId: string;
    updateColor: (hex: string) => void;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    dispose: () => void;
}

export function createCaraBeddingMesh(
    instanceId: string,
    initialHex: string = '#56C5ED'
): CaraBeddingMeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: 'REF-MAT-CARA-STD' };

    const normalMap = typeof document !== 'undefined' ? getQuiltNormalMap() : null;

    // Independent fabric material for this specific instance (Mattress, Pillow, Blanket)
    const fabricMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.85,
        metalness: 0.05,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
    });

    // Piping Gray Material (Piping_Gray #8E9B97 - strictly preserved during recoloring)
    const pipingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8E9B97'),
        roughness: 0.7,
        metalness: 0.1,
    });

    // AntiSlip Underlay Material (Preserved)
    const antislipMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2C3331'),
        roughness: 0.95,
        metalness: 0.0,
    });

    // Label Material
    const labelMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FAFAF7'),
        roughness: 0.5,
    });

    // 1. Mattress Geometry: 1.20m (Z) x 0.63m (X), thickness 0.025m (Y)
    const matLength = 1.20;
    const matWidth = 0.63;
    const matThickness = 0.025;

    // Beveled rounded box for soft fabric mattress
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
        steps: 1,
        bevelSize: 0.012,
        bevelThickness: 0.008,
    };

    const matGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    matGeometry.rotateX(Math.PI / 2); // Lay flat on XZ plane
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

    // 3. Gray Piping perimeter (tubular border around edge)
    const pipingCurvePath = new THREE.CurvePath<THREE.Vector3>();
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

    pipingCurvePath.add(new THREE.LineCurve3(p1, p2));
    pipingCurvePath.add(new THREE.QuadraticBezierCurve3(p2, new THREE.Vector3(pw, 0, -pl), p3));
    pipingCurvePath.add(new THREE.LineCurve3(p3, p4));
    pipingCurvePath.add(new THREE.QuadraticBezierCurve3(p4, new THREE.Vector3(pw, 0, pl), p5));
    pipingCurvePath.add(new THREE.LineCurve3(p5, p6));
    pipingCurvePath.add(new THREE.QuadraticBezierCurve3(p6, new THREE.Vector3(-pw, 0, pl), p7));
    pipingCurvePath.add(new THREE.LineCurve3(p7, p8));
    pipingCurvePath.add(new THREE.QuadraticBezierCurve3(p8, new THREE.Vector3(-pw, 0, -pl), p1));

    const pipingGeo = new THREE.TubeGeometry(pipingCurvePath, 64, 0.006, 8, true);
    const pipingMesh = new THREE.Mesh(pipingGeo, pipingMaterial);
    pipingMesh.position.y = matThickness / 2 + 0.006;
    pipingMesh.castShadow = true;
    group.add(pipingMesh);

    // 4. Volumetric Cushion Loft Pillow: 0.40m (X) x 0.25m (Z) x 0.065m (Y)
    const pillowGeo = new THREE.BoxGeometry(0.40, 0.025, 0.25, 24, 6, 18);
    const pillowPos = pillowGeo.attributes.position;
    const phw = 0.40 / 2;
    const phl = 0.25 / 2;
    for (let i = 0; i < pillowPos.count; i++) {
        const px = pillowPos.getX(i);
        const py = pillowPos.getY(i);
        const pz = pillowPos.getZ(i);
        const pu = Math.min(1, Math.max(-1, px / phw));
        const pv = Math.min(1, Math.max(-1, pz / phl));
        const envelope = Math.max(0, 1 - pu * pu) * Math.max(0, 1 - pv * pv);
        const loft = Math.pow(envelope, 0.65);
        if (py > 0) {
            pillowPos.setY(i, py * 0.25 + 0.065 * loft);
        } else {
            pillowPos.setY(i, py * 0.2 - 0.012 * envelope);
        }
        pillowPos.setX(i, px * (1 + 0.05 * (1 - pv * pv)));
        pillowPos.setZ(i, pz * (1 + 0.05 * (1 - pu * pu)));
    }
    pillowGeo.computeVertexNormals();

    const pillowMesh = new THREE.Mesh(pillowGeo, fabricMaterial);
    pillowMesh.position.set(0, matThickness + 0.038, -halfL + 0.18);
    pillowMesh.castShadow = true;
    pillowMesh.receiveShadow = true;
    group.add(pillowMesh);

    // 5. Folded Blanket: 1.30m x 0.70m folded into 0.65m x 0.60m layer on lower half
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

    // 6. Label tag
    const labelGeo = new THREE.PlaneGeometry(0.045, 0.025);
    labelGeo.rotateX(-Math.PI / 2);
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.set(halfW - 0.04, matThickness + 0.008, halfL - 0.05);
    group.add(labelMesh);

    // Selection / hover indicator ring on floor
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
            labelGeo.dispose();
            ringGeo.dispose();
            fabricMaterial.dispose();
            pipingMaterial.dispose();
            antislipMaterial.dispose();
            labelMaterial.dispose();
            ringMat.dispose();
        },
    };
}
