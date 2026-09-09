/**
 * SleepingBagMesh.ts
 * Procedural PBR 3D model for Kindy Preschool Sleeping Bag line (Instruction 08):
 * - REF-SLEEP-CARA-STD: Standard cotton sleeping bag (1.25 x 0.63 m pad, 0.97 x 0.78 m draped blanket)
 * - REF-SLEEP-CARA-PLUS: Enhanced warm sleeping bag with thick puffy wave quilting
 *
 * Features:
 * - Organic cushion loft pillow (volumetric convex loft with piping seam, replacing cylinder)
 * - Padded base with rounded corners and dedicated gray perimeter piping (#8E9B97)
 * - Natural blanket drape: draped overhangs along sides, folded cuff revealing soft cream lining (#FAF8F2)
 * - Physical undulating puffy wave channels for PLUS version
 * - Soft contact floor halo replacing primitive cyan ring and removing 2D plane artifacts
 */

import * as THREE from 'three';

// Procedural normal map generator for cotton weave
let cachedWeaveNormalMap: THREE.CanvasTexture | null = null;

function getCottonWeaveNormalMap(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    if (cachedWeaveNormalMap) return cachedWeaveNormalMap;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#8080ff'; // tangent space flat normal
        ctx.fillRect(0, 0, 256, 256);

        // Fine cotton cross-weave pattern
        const imgData = ctx.getImageData(0, 0, 256, 256);
        const data = imgData.data;
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                const idx = (y * 256 + x) * 4;
                const pattern = ((x % 4 < 2) === (y % 4 < 2) ? 1 : -1) * 10;
                const noise = (Math.random() - 0.5) * 8;
                data[idx] = Math.min(255, Math.max(0, 128 + pattern + noise));     // R
                data[idx + 1] = Math.min(255, Math.max(0, 128 - pattern + noise)); // G
                data[idx + 2] = 255;                                               // B
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 12);
    cachedWeaveNormalMap = texture;
    return texture;
}

export interface SleepingBagMeshInstance {
    group: THREE.Group;
    instanceId: string;
    isPlus: boolean;
    updateColor: (hex: string) => void;
    setHovered: (hovered: boolean) => void;
    setSelected: (selected: boolean) => void;
    dispose: () => void;
}

/**
 * Creates an organic 3D cushion loft geometry with smooth convex volume and soft edges.
 */
function createCushionLoftGeometry(
    width: number,
    length: number,
    height: number,
    segX: number = 24,
    segY: number = 6,
    segZ: number = 18
): THREE.BufferGeometry {
    const geo = new THREE.BoxGeometry(width, height * 0.35, length, segX, segY, segZ);
    const pos = geo.attributes.position;

    const halfW = width / 2;
    const halfL = length / 2;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        const u = Math.min(1, Math.max(-1, x / halfW));
        const v = Math.min(1, Math.max(-1, z / halfL));

        // Smooth dome envelope that falls to 0 at edges
        const envelope = Math.max(0, 1 - u * u) * Math.max(0, 1 - v * v);
        const loft = Math.pow(envelope, 0.65);

        if (y > 0) {
            // Upper surface puffed up
            pos.setY(i, y * 0.25 + height * loft);
        } else {
            // Lower surface slightly rounded underneath
            pos.setY(i, y * 0.2 - (height * 0.18) * envelope);
        }

        // Gentle outward belly bulge along perimeter
        const bulgeX = 1 + 0.05 * (1 - v * v);
        const bulgeZ = 1 + 0.05 * (1 - u * u);
        pos.setX(i, x * bulgeX);
        pos.setZ(i, z * bulgeZ);
    }

    geo.computeVertexNormals();
    return geo;
}

/**
 * Creates blanket geometry with natural draped overhangs along sides and foot,
 * plus physical puffy wave channels for PLUS version.
 */
function createDrapedBlanketGeometry(
    width: number,
    length: number,
    thickness: number,
    isPlus: boolean,
    padHalfWidth: number = 0.315
): THREE.BufferGeometry {
    const segX = 28;
    const segY = 4;
    const segZ = 36;
    const geo = new THREE.BoxGeometry(width, thickness, length, segX, segY, segZ);
    const pos = geo.attributes.position;

    const halfW = width / 2;
    const halfL = length / 2;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        let y = pos.getY(i);
        const z = pos.getZ(i);

        // 1. Natural side drape: when blanket extends beyond pad edge
        let drapeY = 0;
        const absX = Math.abs(x);
        const drapeThreshold = padHalfWidth * 0.88;
        if (absX > drapeThreshold) {
            const t = Math.min(1, (absX - drapeThreshold) / (halfW - drapeThreshold));
            // Smoothstep curve for graceful gravity drape
            const smoothT = t * t * (3 - 2 * t);
            drapeY = -0.026 * smoothT;
        }

        // 2. Foot drape: gentle downward curl at bottom edge
        const footThreshold = halfL - 0.09;
        if (z > footThreshold) {
            const tz = Math.min(1, (z - footThreshold) / 0.09);
            drapeY -= 0.014 * tz * tz;
        }

        // 3. PLUS wave quilting: physical puffy wave channels across the top surface
        let waveY = 0;
        if (isPlus && y > 0) {
            // Wave progress along Z: 6 wavy quilt bands
            const normZ = (z + halfL) / length;
            const lateralCurve = Math.sin((x / halfW) * Math.PI * 2) * 0.12;
            const wavePhase = (normZ + lateralCurve) * Math.PI * 12;
            const crest = Math.cos(wavePhase);
            // Damp wave near outer draped edges
            const damping = Math.max(0, 1 - Math.pow(absX / halfW, 4));
            waveY = 0.007 * crest * damping;
        }

        pos.setY(i, y + drapeY + waveY);
    }

    geo.computeVertexNormals();
    return geo;
}

export function createSleepingBagMesh(
    instanceId: string,
    isPlus: boolean = false,
    initialHex: string = '#56C5ED'
): SleepingBagMeshInstance {
    const group = new THREE.Group();
    group.name = instanceId;
    group.userData = { instanceId, type: isPlus ? 'REF-SLEEP-CARA-PLUS' : 'REF-SLEEP-CARA-STD' };

    const normalMap = getCottonWeaveNormalMap();

    // 1. Materials
    const fabricMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.82,
        metalness: 0.04,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
    });

    const innerLiningMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FAF8F2'),
        roughness: 0.92,
        metalness: 0.02,
    });

    const pipingMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8E9B97'),
        roughness: 0.65,
        metalness: 0.08,
    });

    const antislipMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2C3331'),
        roughness: 0.95,
        metalness: 0.0,
    });

    // 2. Sleeping Pad Base (1.25m Z x 0.63m X x 0.025m Y with beveled corners)
    const padW = 0.63;
    const padL = 1.25;
    const padThickness = 0.024;
    const padRadius = 0.035;

    const padShape = new THREE.Shape();
    const hw = padW / 2;
    const hl = padL / 2;
    padShape.moveTo(-hw + padRadius, -hl);
    padShape.lineTo(hw - padRadius, -hl);
    padShape.quadraticCurveTo(hw, -hl, hw, -hl + padRadius);
    padShape.lineTo(hw, hl - padRadius);
    padShape.quadraticCurveTo(hw, hl, hw - padRadius, hl);
    padShape.lineTo(-hw + padRadius, hl);
    padShape.quadraticCurveTo(-hw, hl, -hw, hl - padRadius);
    padShape.lineTo(-hw, -hl + padRadius);
    padShape.quadraticCurveTo(-hw, -hl, -hw + padRadius, -hl);

    const padGeo = new THREE.ExtrudeGeometry(padShape, {
        depth: padThickness,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.007,
        bevelThickness: 0.005,
    });
    padGeo.rotateX(Math.PI / 2);
    padGeo.center();

    const padMesh = new THREE.Mesh(padGeo, fabricMat);
    padMesh.position.set(0, padThickness / 2 + 0.005, padL / 2);
    padMesh.castShadow = true;
    padMesh.receiveShadow = true;
    group.add(padMesh);

    // Bottom anti-slip sheet
    const bottomGeo = new THREE.PlaneGeometry(padW * 0.94, padL * 0.94);
    bottomGeo.rotateX(-Math.PI / 2);
    const bottomMesh = new THREE.Mesh(bottomGeo, antislipMat);
    bottomMesh.position.set(0, 0.002, padL / 2);
    group.add(bottomMesh);

    // Perimeter Piping Frame around Pad Edge
    const pipingPath = new THREE.CurvePath<THREE.Vector3>();
    const pw = hw + 0.005;
    const pl = hl + 0.005;
    const pr = padRadius;

    const p1 = new THREE.Vector3(-pw + pr, 0, -pl);
    const p2 = new THREE.Vector3(pw - pr, 0, -pl);
    const p3 = new THREE.Vector3(pw, 0, -pl + pr);
    const p4 = new THREE.Vector3(pw, 0, pl - pr);
    const p5 = new THREE.Vector3(pw - pr, 0, pl);
    const p6 = new THREE.Vector3(-pw + pr, 0, pl);
    const p7 = new THREE.Vector3(-pw, 0, pl - pr);
    const p8 = new THREE.Vector3(-pw, 0, -pl + pr);

    pipingPath.add(new THREE.LineCurve3(p1, p2));
    pipingPath.add(new THREE.QuadraticBezierCurve3(p2, new THREE.Vector3(pw, 0, -pl), p3));
    pipingPath.add(new THREE.LineCurve3(p3, p4));
    pipingPath.add(new THREE.QuadraticBezierCurve3(p4, new THREE.Vector3(pw, 0, pl), p5));
    pipingPath.add(new THREE.LineCurve3(p5, p6));
    pipingPath.add(new THREE.QuadraticBezierCurve3(p6, new THREE.Vector3(-pw, 0, pl), p7));
    pipingPath.add(new THREE.LineCurve3(p7, p8));
    pipingPath.add(new THREE.QuadraticBezierCurve3(p8, new THREE.Vector3(-pw, 0, -pl), p1));

    const padPipingGeo = new THREE.TubeGeometry(pipingPath, 64, 0.005, 8, true);
    const padPipingMesh = new THREE.Mesh(padPipingGeo, pipingMat);
    padPipingMesh.position.set(0, padThickness / 2 + 0.005, padL / 2);
    padPipingMesh.castShadow = true;
    group.add(padPipingMesh);

    // 3. Volumetric Cushion Loft Pillow (0.42m W x 0.24m L x 0.065m H)
    const pillowGeo = createCushionLoftGeometry(0.42, 0.24, 0.065, 24, 6, 18);
    const pillowMesh = new THREE.Mesh(pillowGeo, fabricMat);
    pillowMesh.position.set(0, padThickness + 0.038, 0.16);
    pillowMesh.castShadow = true;
    pillowMesh.receiveShadow = true;
    group.add(pillowMesh);

    // Pillow Seam Piping Ring
    const pillowSeamGeo = new THREE.TorusGeometry(0.18, 0.004, 8, 32);
    pillowSeamGeo.rotateX(Math.PI / 2);
    pillowSeamGeo.scale(1.15, 1, 0.65);
    const pillowSeamMesh = new THREE.Mesh(pillowSeamGeo, pipingMat);
    pillowSeamMesh.position.set(0, padThickness + 0.038, 0.16);
    pillowSeamMesh.castShadow = true;
    group.add(pillowSeamMesh);

    // 4. Attached Draped Blanket (0.78m W x 0.97m L)
    // Starts at Z = 0.28m and extends to Z = 1.25m
    const blanketW = 0.78;
    const blanketL = 0.97;
    const blanketThickness = isPlus ? 0.032 : 0.018;
    const blanketGeo = createDrapedBlanketGeometry(blanketW, blanketL, blanketThickness, isPlus, padW / 2);
    const blanketMesh = new THREE.Mesh(blanketGeo, fabricMat);
    blanketMesh.position.set(0, padThickness + blanketThickness / 2 + 0.004, 0.28 + blanketL / 2);
    blanketMesh.castShadow = true;
    blanketMesh.receiveShadow = true;
    group.add(blanketMesh);

    // 5. Folded Top Cuff (turned-over fold showing soft cream inner lining #FAF8F2)
    const cuffW = blanketW * 0.99;
    const cuffL = 0.11;
    const cuffThickness = 0.022;
    const cuffGeo = new THREE.BoxGeometry(cuffW, cuffThickness, cuffL, 20, 2, 8);
    // Subtle side drape on cuff to match blanket profile
    const cuffPos = cuffGeo.attributes.position;
    for (let i = 0; i < cuffPos.count; i++) {
        const cx = Math.abs(cuffPos.getX(i));
        if (cx > padW * 0.44) {
            const dt = (cx - padW * 0.44) / (cuffW / 2 - padW * 0.44);
            cuffPos.setY(i, cuffPos.getY(i) - 0.018 * dt * dt);
        }
    }
    cuffGeo.computeVertexNormals();

    const cuffMesh = new THREE.Mesh(cuffGeo, innerLiningMat);
    cuffMesh.position.set(0, padThickness + blanketThickness + cuffThickness / 2 + 0.002, 0.28 + cuffL / 2);
    cuffMesh.castShadow = true;
    group.add(cuffMesh);

    // 6. Plus Quilted Waves Accents (for REF-SLEEP-CARA-PLUS)
    const plusQuiltRibbons: THREE.Mesh[] = [];
    if (isPlus) {
        // Add subtle accent piping ribbons along quilt channel valleys
        for (let cz = 0.46; cz <= 1.15; cz += 0.15) {
            const ribbonCurve = new THREE.CurvePath<THREE.Vector3>();
            const segCount = 16;
            for (let s = 0; s < segCount; s++) {
                const x1 = -blanketW * 0.44 + (s / segCount) * (blanketW * 0.88);
                const x2 = -blanketW * 0.44 + ((s + 1) / segCount) * (blanketW * 0.88);
                const waveOff1 = Math.sin((x1 / (blanketW * 0.5)) * Math.PI * 2) * 0.015;
                const waveOff2 = Math.sin((x2 / (blanketW * 0.5)) * Math.PI * 2) * 0.015;
                ribbonCurve.add(new THREE.LineCurve3(
                    new THREE.Vector3(x1, 0, waveOff1),
                    new THREE.Vector3(x2, 0, waveOff2)
                ));
            }
            const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 24, 0.0025, 6, false);
            const ribbonMesh = new THREE.Mesh(ribbonGeo, pipingMat);
            ribbonMesh.position.set(0, padThickness + blanketThickness + 0.004, cz);
            group.add(ribbonMesh);
            plusQuiltRibbons.push(ribbonMesh);
        }
    }

    // 7. Soft Ambient Floor Halo (replacing harsh cyan ring with subtle contact glow)
    const haloShape = new THREE.Shape();
    const haloW = 0.86;
    const haloL = 1.42;
    const haloR = 0.12;
    const hhw = haloW / 2;
    const hhl = haloL / 2;
    haloShape.moveTo(-hhw + haloR, -hhl);
    haloShape.lineTo(hhw - haloR, -hhl);
    haloShape.quadraticCurveTo(hhw, -hhl, hhw, -hhl + haloR);
    haloShape.lineTo(hhw, hhl - haloR);
    haloShape.quadraticCurveTo(hhw, hhl, hhw - haloR, hhl);
    haloShape.lineTo(-hhw + haloR, hhl);
    haloShape.quadraticCurveTo(-hhw, hhl, -hhw, hhl - haloR);
    haloShape.lineTo(-hhw, -hhl + haloR);
    haloShape.quadraticCurveTo(-hhw, -hhl, -hhw + haloR, -hhl);

    const haloGeo = new THREE.ShapeGeometry(haloShape);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0x087f8c,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0.004, padL / 2);
    group.add(haloMesh);

    let isSelected = false;
    let isHovered = false;

    const updateHalo = () => {
        if (isSelected) {
            haloMat.color.setHex(0x087f8c); // Brand cyan/teal
            haloMat.opacity = 0.35;         // Soft ambient glow
        } else if (isHovered) {
            haloMat.color.setHex(0x56c5ed); // Warm sky cyan
            haloMat.opacity = 0.18;         // Gentle hover feedback
        } else {
            haloMat.opacity = 0;
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
            updateHalo();
        },
        setSelected: (s: boolean) => {
            isSelected = s;
            updateHalo();
        },
        dispose: () => {
            padGeo.dispose();
            bottomGeo.dispose();
            padPipingGeo.dispose();
            pillowGeo.dispose();
            pillowSeamGeo.dispose();
            blanketGeo.dispose();
            cuffGeo.dispose();
            haloGeo.dispose();
            plusQuiltRibbons.forEach(r => r.geometry.dispose());

            fabricMat.dispose();
            innerLiningMat.dispose();
            pipingMat.dispose();
            antislipMat.dispose();
            haloMat.dispose();
        },
    };
}
