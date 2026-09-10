/**
 * CaraBeddingMesh.ts
 * Upgraded PBR 3D model for Cotton Cara Bedding Set (REF-MAT-CARA-STD) - Instruction 09:
 * - Mattress: 1.20 x 0.63 m with rounded beveled edges, realistic cotton weave & quilting
 * - Pillow: 0.40 x 0.25 m volumetric cushion loft pillow with gray piping perimeter
 * - Blanket: Folded draped blanket with turned-down cream cuff (#FAF8F2) & side drape
 * - Dedicated Gray Piping (#8E9B97) framing mattress & pillow perimeter
 * - Authentic cotton fabric normal & roughness maps derived from catalogue NEM_MN_-_03.jpg
 * - Soft floor contact halo replacing the obsolete cyan ring
 * - Independent surface materials allowing 100% accurate real-time recoloring without plastic look
 */

import * as THREE from 'three';

// Cached procedural normal and roughness maps for Cotton Cara
let cachedCaraNormalMap: THREE.CanvasTexture | null = null;
let cachedCaraRoughnessMap: THREE.CanvasTexture | null = null;

function getCaraTextures(): { normalMap: THREE.Texture; roughnessMap: THREE.Texture } {
    if (cachedCaraNormalMap && cachedCaraRoughnessMap) {
        return { normalMap: cachedCaraNormalMap, roughnessMap: cachedCaraRoughnessMap };
    }

    if (typeof document === 'undefined') {
        // Fallback for SSR / test runners
        const dummyCanvas = {} as any;
        const dummyTex = new THREE.Texture();
        return { normalMap: dummyTex, roughnessMap: dummyTex };
    }

    const size = 1024;
    const canvasNorm = document.createElement('canvas');
    canvasNorm.width = size;
    canvasNorm.height = size;
    const ctxNorm = canvasNorm.getContext('2d');

    const canvasRough = document.createElement('canvas');
    canvasRough.width = size;
    canvasRough.height = size;
    const ctxRough = canvasRough.getContext('2d');

    if (ctxNorm && ctxRough) {
        // 1. Normal Map Base: Flat tangent space normal (128, 128, 255)
        ctxNorm.fillStyle = '#8080ff';
        ctxNorm.fillRect(0, 0, size, size);

        // Roughness Map Base: Mid-rough matte cotton (~0.82 -> rgb 210)
        ctxRough.fillStyle = '#d2d2d2';
        ctxRough.fillRect(0, 0, size, size);

        // 2. Draw authentic Cotton Cara quilting grid stitches (spaced ~128px)
        const gridStep = 128;

        // Horizontal quilting grooves
        for (let y = 0; y <= size; y += gridStep) {
            // Normal shadow (indented groove)
            ctxNorm.lineWidth = 10;
            ctxNorm.strokeStyle = 'rgba(110, 80, 240, 0.45)';
            ctxNorm.beginPath();
            ctxNorm.moveTo(0, y);
            ctxNorm.lineTo(size, y);
            ctxNorm.stroke();

            // Normal highlight
            ctxNorm.lineWidth = 5;
            ctxNorm.strokeStyle = 'rgba(150, 160, 255, 0.40)';
            ctxNorm.beginPath();
            ctxNorm.moveTo(0, y + 4);
            ctxNorm.lineTo(size, y + 4);
            ctxNorm.stroke();

            // Roughness groove (higher roughness in stitching depression)
            ctxRough.lineWidth = 8;
            ctxRough.strokeStyle = '#eeeeee';
            ctxRough.beginPath();
            ctxRough.moveTo(0, y);
            ctxRough.lineTo(size, y);
            ctxRough.stroke();
        }

        // Vertical quilting grooves
        for (let x = 0; x <= size; x += gridStep) {
            ctxNorm.lineWidth = 10;
            ctxNorm.strokeStyle = 'rgba(80, 110, 240, 0.45)';
            ctxNorm.beginPath();
            ctxNorm.moveTo(x, 0);
            ctxNorm.lineTo(x, size);
            ctxNorm.stroke();

            ctxNorm.lineWidth = 5;
            ctxNorm.strokeStyle = 'rgba(160, 150, 255, 0.40)';
            ctxNorm.beginPath();
            ctxNorm.moveTo(x + 4, 0);
            ctxNorm.lineTo(x + 4, size);
            ctxNorm.stroke();

            ctxRough.lineWidth = 8;
            ctxRough.strokeStyle = '#eeeeee';
            ctxRough.beginPath();
            ctxRough.moveTo(x, 0);
            ctxRough.lineTo(x, size);
            ctxRough.stroke();
        }

        // 3. Add fine organic cotton twill weave texture to eliminate plastic sheen
        const imgNorm = ctxNorm.getImageData(0, 0, size, size);
        const dataNorm = imgNorm.data;
        const imgRough = ctxRough.getImageData(0, 0, size, size);
        const dataRough = imgRough.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                // Diagonal cotton twill fiber pattern
                const weave = Math.sin((x + y) * 1.8) * Math.cos((x - y) * 1.8) * 8;
                const grain = (Math.random() - 0.5) * 10;
                const perturbation = weave + grain;

                dataNorm[idx] = Math.min(255, Math.max(0, dataNorm[idx] + perturbation * 0.8));
                dataNorm[idx + 1] = Math.min(255, Math.max(0, dataNorm[idx + 1] + perturbation * 0.8));

                dataRough[idx] = Math.min(255, Math.max(0, dataRough[idx] + perturbation * 0.5));
                dataRough[idx + 1] = dataRough[idx];
                dataRough[idx + 2] = dataRough[idx];
            }
        }
        ctxNorm.putImageData(imgNorm, 0, 0);
        ctxRough.putImageData(imgRough, 0, 0);
    }

    const normTexture = new THREE.CanvasTexture(canvasNorm);
    normTexture.wrapS = THREE.RepeatWrapping;
    normTexture.wrapT = THREE.RepeatWrapping;
    normTexture.repeat.set(3, 5);

    const roughTexture = new THREE.CanvasTexture(canvasRough);
    roughTexture.wrapS = THREE.RepeatWrapping;
    roughTexture.wrapT = THREE.RepeatWrapping;
    roughTexture.repeat.set(3, 5);

    cachedCaraNormalMap = normTexture;
    cachedCaraRoughnessMap = roughTexture;

    return { normalMap: normTexture, roughnessMap: roughTexture };
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

    const { normalMap, roughnessMap } = getCaraTextures();

    // 1. Dedicated Material for Mattress Body
    const mattressMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.84,
        roughnessMap: roughnessMap,
        metalness: 0.02,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.40, 0.40),
    });

    // 2. Dedicated Material for Pillow (Soft fabric with loft)
    const pillowMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.82,
        roughnessMap: roughnessMap,
        metalness: 0.02,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
    });

    // 3. Dedicated Material for Blanket (Draped quilted fabric)
    const blanketMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(initialHex),
        roughness: 0.85,
        roughnessMap: roughnessMap,
        metalness: 0.02,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
    });

    // 4. Turned-Down Blanket Cuff Material (Soft cream-white lining #FAF8F2)
    const cuffMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FAF8F2'),
        roughness: 0.88,
        metalness: 0.01,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.20, 0.20),
    });

    // 5. Dedicated Gray Piping Material (Piping_Gray #8E9B97 - strictly preserved during recoloring)
    const pipingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8E9B97'),
        roughness: 0.65,
        metalness: 0.05,
    });

    // 6. AntiSlip Underlay Material (Preserved dark charcoal #2C3331)
    const antislipMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2C3331'),
        roughness: 0.95,
        metalness: 0.0,
    });

    // 7. Woven Brand Tag Material
    const labelMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#F6F4EE'),
        roughness: 0.6,
    });

    // 8. Soft Floor Contact Halo (Replacing the old cyan ring)
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#087F8C'),
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
    });

    // === DIMENSIONS: Cotton Cara Standard Spec ===
    // Mattress: 1.20m (Z) x 0.63m (X) x 0.025m (Y)
    const matLength = 1.20;
    const matWidth = 0.63;
    const matThickness = 0.025;
    const halfW = matWidth / 2;
    const halfL = matLength / 2;
    const cornerRadius = 0.04;

    // --- A. MATTRESS GEOMETRY (Rounded Beveled Box) ---
    const matShape = new THREE.Shape();
    matShape.moveTo(-halfW + cornerRadius, -halfL);
    matShape.lineTo(halfW - cornerRadius, -halfL);
    matShape.quadraticCurveTo(halfW, -halfL, halfW, -halfL + cornerRadius);
    matShape.lineTo(halfW, halfL - cornerRadius);
    matShape.quadraticCurveTo(halfW, halfL, halfW - cornerRadius, halfL);
    matShape.lineTo(-halfW + cornerRadius, halfL);
    matShape.quadraticCurveTo(-halfW, halfL, -halfW, halfL - cornerRadius);
    matShape.lineTo(-halfW, -halfL + cornerRadius);
    matShape.quadraticCurveTo(-halfW, -halfL, -halfW + cornerRadius, -halfL);

    const matExtrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: matThickness,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.010,
        bevelThickness: 0.007,
    };

    const matGeometry = new THREE.ExtrudeGeometry(matShape, matExtrudeSettings);
    matGeometry.rotateX(Math.PI / 2); // Lay flat on XZ plane
    matGeometry.center();

    const mattressMesh = new THREE.Mesh(matGeometry, mattressMaterial);
    mattressMesh.position.y = matThickness / 2 + 0.004;
    mattressMesh.castShadow = true;
    mattressMesh.receiveShadow = true;
    group.add(mattressMesh);

    // --- B. ANTI-SLIP BASE ---
    const bottomGeo = new THREE.PlaneGeometry(matWidth * 0.96, matLength * 0.96);
    bottomGeo.rotateX(-Math.PI / 2);
    const bottomMesh = new THREE.Mesh(bottomGeo, antislipMaterial);
    bottomMesh.position.y = 0.002;
    group.add(bottomMesh);

    // --- C. MATTRESS PERIMETER GRAY PIPING ---
    const pipingCurvePath = new THREE.CurvePath<THREE.Vector3>();
    const pw = halfW + 0.006;
    const pl = halfL + 0.006;
    const pr = cornerRadius;

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

    const pipingGeo = new THREE.TubeGeometry(pipingCurvePath, 64, 0.0055, 8, true);
    const pipingMesh = new THREE.Mesh(pipingGeo, pipingMaterial);
    pipingMesh.position.y = matThickness / 2 + 0.006;
    pipingMesh.castShadow = true;
    group.add(pipingMesh);

    // 4. Volumetric Cushion Loft Pillow: 0.40m (X) x 0.25m (Z) x 0.065m (Y)
    const pillowGeo = new THREE.BoxGeometry(0.40, 0.024, 0.25, 24, 6, 18);
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
            pillowPos.setY(i, py * 0.2 - 0.010 * envelope);
        }
        pillowPos.setX(i, px * (1 + 0.04 * (1 - pv * pv)));
        pillowPos.setZ(i, pz * (1 + 0.04 * (1 - pu * pu)));
    }
    pillowGeo.computeVertexNormals();

    const pillowMesh = new THREE.Mesh(pillowGeo, pillowMaterial);
    pillowMesh.position.set(0, matThickness + 0.038, -halfL + 0.18);
    pillowMesh.castShadow = true;
    pillowMesh.receiveShadow = true;
    group.add(pillowMesh);

    // Pillow perimeter piping accent
    const pillowPipingCurve = new THREE.CurvePath<THREE.Vector3>();
    const ppw = phw + 0.003;
    const ppl = phl + 0.003;
    const ppr = 0.03;
    pillowPipingCurve.add(new THREE.LineCurve3(new THREE.Vector3(-ppw + ppr, 0, -ppl), new THREE.Vector3(ppw - ppr, 0, -ppl)));
    pillowPipingCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(ppw - ppr, 0, -ppl), new THREE.Vector3(ppw, 0, -ppl), new THREE.Vector3(ppw, 0, -ppl + ppr)));
    pillowPipingCurve.add(new THREE.LineCurve3(new THREE.Vector3(ppw, 0, -ppl + ppr), new THREE.Vector3(ppw, 0, ppl - ppr)));
    pillowPipingCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(ppw, 0, ppl - ppr), new THREE.Vector3(ppw, 0, ppl), new THREE.Vector3(ppw - ppr, 0, ppl)));
    pillowPipingCurve.add(new THREE.LineCurve3(new THREE.Vector3(ppw - ppr, 0, ppl), new THREE.Vector3(-ppw + ppr, 0, ppl)));
    pillowPipingCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-ppw + ppr, 0, ppl), new THREE.Vector3(-ppw, 0, ppl), new THREE.Vector3(-ppw, 0, ppl - ppr)));
    pillowPipingCurve.add(new THREE.LineCurve3(new THREE.Vector3(-ppw, 0, ppl - ppr), new THREE.Vector3(-ppw, 0, -ppl + ppr)));
    pillowPipingCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-ppw, 0, -ppl + ppr), new THREE.Vector3(-ppw, 0, -ppl), new THREE.Vector3(-ppw + ppr, 0, -ppl)));

    const pillowPipingGeo = new THREE.TubeGeometry(pillowPipingCurve, 48, 0.004, 6, true);
    const pillowPipingMesh = new THREE.Mesh(pillowPipingGeo, pipingMaterial);
    pillowPipingMesh.position.set(0, matThickness + 0.026, -halfL + 0.18);
    pillowPipingMesh.castShadow = true;
    group.add(pillowPipingMesh);

    // --- E. FOLDED DRAPED BLANKET WITH TURNED-DOWN CUFF ---
    // Blanket dimensions: 1.30m x 0.70m folded to cover lower body: width 0.67m (drapes 2cm each side), length 0.58m
    const blanketW = 0.67;
    const blanketL = 0.58;
    const blanketGeo = new THREE.BoxGeometry(blanketW, 0.016, blanketL, 20, 4, 16);
    const bPos = blanketGeo.attributes.position;
    const bhw = blanketW / 2;
    const bhl = blanketL / 2;

    // Apply natural fabric drape: sides curve gently downward over mattress edges
    for (let i = 0; i < bPos.count; i++) {
        const bx = bPos.getX(i);
        const by = bPos.getY(i);
        const bz = bPos.getZ(i);
        const edgeRatio = Math.abs(bx) / bhw;
        if (edgeRatio > 0.85) {
            const drop = Math.pow((edgeRatio - 0.85) / 0.15, 2) * 0.016;
            bPos.setY(i, by - drop);
        }
    }
    blanketGeo.computeVertexNormals();

    const blanketCenterZ = halfL * 0.38;
    const blanketMesh = new THREE.Mesh(blanketGeo, blanketMaterial);
    blanketMesh.position.set(0, matThickness + 0.016, blanketCenterZ);
    blanketMesh.castShadow = true;
    blanketMesh.receiveShadow = true;
    group.add(blanketMesh);

    // Turned-Down Blanket Cuff (Cổ chăn lật ngược - soft cream-white inner lining #FAF8F2)
    const cuffW = 0.675;
    const cuffL = 0.11;
    const cuffGeo = new THREE.BoxGeometry(cuffW, 0.019, cuffL, 16, 4, 6);
    const cuffMesh = new THREE.Mesh(cuffGeo, cuffMaterial);
    // Position cuff at top of blanket
    cuffMesh.position.set(0, matThickness + 0.020, blanketCenterZ - bhl + cuffL / 2);
    cuffMesh.castShadow = true;
    cuffMesh.receiveShadow = true;
    group.add(cuffMesh);

    // Cuff seam piping line
    const cuffPipingGeo = new THREE.CylinderGeometry(0.0035, 0.0035, cuffW, 16);
    cuffPipingGeo.rotateZ(Math.PI / 2);
    const cuffPipingMesh = new THREE.Mesh(cuffPipingGeo, pipingMaterial);
    cuffPipingMesh.position.set(0, matThickness + 0.023, blanketCenterZ - bhl + cuffL);
    cuffPipingMesh.castShadow = true;
    group.add(cuffPipingMesh);

    // --- F. WOVEN BRAND LABEL ---
    const labelGeo = new THREE.PlaneGeometry(0.045, 0.025);
    labelGeo.rotateX(-Math.PI / 2);
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.set(halfW - 0.04, matThickness + 0.008, halfL - 0.05);
    group.add(labelMesh);

    // --- G. SOFT FLOOR CONTACT HALO (Replacing old cyan ring) ---
    const haloShape = new THREE.Shape();
    const haloW = halfW + 0.08;
    const haloL = halfL + 0.08;
    const haloR = cornerRadius + 0.04;
    haloShape.moveTo(-haloW + haloR, -haloL);
    haloShape.lineTo(haloW - haloR, -haloL);
    haloShape.quadraticCurveTo(haloW, -haloL, haloW, -haloL + haloR);
    haloShape.lineTo(haloW, haloL - haloR);
    haloShape.quadraticCurveTo(haloW, haloL, haloW - haloR, haloL);
    haloShape.lineTo(-haloW + haloR, haloL);
    haloShape.quadraticCurveTo(-haloW, haloL, -haloW, haloL - haloR);
    haloShape.lineTo(-haloW, -haloL + haloR);
    haloShape.quadraticCurveTo(-haloW, -haloL, -haloW + haloR, -haloL);

    const haloGeo = new THREE.ShapeGeometry(haloShape);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMesh = new THREE.Mesh(haloGeo, haloMaterial);
    haloMesh.position.y = 0.003;
    group.add(haloMesh);

    return {
        group,
        instanceId,
        updateColor: (hex: string) => {
            const targetCol = new THREE.Color(hex);
            mattressMaterial.color.copy(targetCol);
            pillowMaterial.color.copy(targetCol);
            blanketMaterial.color.copy(targetCol);
            // Cuff remains cream-white (#FAF8F2)
            // Piping remains gray (#8E9B97)
        },
        setHovered: (hovered: boolean) => {
            if (group.userData.selected) return;
            haloMaterial.opacity = hovered ? 0.16 : 0.0;
        },
        setSelected: (selected: boolean) => {
            group.userData.selected = selected;
            haloMaterial.opacity = selected ? 0.35 : 0.0;
        },
        dispose: () => {
            matGeometry.dispose();
            bottomGeo.dispose();
            pipingGeo.dispose();
            pillowGeo.dispose();
            pillowPipingGeo.dispose();
            blanketGeo.dispose();
            cuffGeo.dispose();
            cuffPipingGeo.dispose();
            labelGeo.dispose();
            haloGeo.dispose();

            mattressMaterial.dispose();
            pillowMaterial.dispose();
            blanketMaterial.dispose();
            cuffMaterial.dispose();
            pipingMaterial.dispose();
            antislipMaterial.dispose();
            labelMaterial.dispose();
            haloMaterial.dispose();
        },
    };
}
