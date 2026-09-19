'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WizardCategoryL2, WizardOption } from './types';
import { resolveGoogleDriveUrl } from './utils';

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (typeof url === 'string' && url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/b2b/${url.replace('/uploads/', '')}`;
    return resolveGoogleDriveUrl(url);
};

interface Product360StudioProps {
    subcategory: WizardCategoryL2;
    selectedOptions: WizardOption[];
    selectedColorHex?: string;
    selectedColorName?: string;
    logoUrl?: string | null;
    onProceedToLead?: () => void;
}

// 5 Điểm chạm Hotspot độc quyền trích xuất từ HULA Sale Kit
interface HotspotInfo {
    id: number;
    title: string;
    badge: string;
    description: string;
    salesPitch: string;
    position3D: [number, number, number];
}

const HULA_HOTSPOTS: HotspotInfo[] = [
    {
        id: 1,
        title: 'Móc Cố Định Chống Rơi Gối',
        badge: 'ĐỘC QUYỀN HULA',
        description: 'Đai móc chuyên dụng giữ gối nằm luôn cố định vào nệm, không bị rơi lệch khi trẻ xoay trở mình trong giấc ngủ trưa.',
        salesPitch: 'Giúp cô giáo không phải liên tục sửa gối cho trẻ, đảm bảo tư thế ngủ khoa học cho cột sống bé.',
        position3D: [0, 0.12, -0.42],
    },
    {
        id: 2,
        title: 'Lớp Vải Lót Mặt Sau Logo',
        badge: 'CHĂM CHÚT TỪNG ĐƯỜNG MAY',
        description: 'May thêm lớp vải lót siêu mềm che kín toàn bộ mặt sau vết chỉ thêu logo trường trên chăn và nệm.',
        salesPitch: 'Loại bỏ hoàn toàn cảm giác cọ xát ngứa ngáy hay kích ứng cho làn da nhạy cảm của trẻ sơ sinh và mầm non.',
        position3D: [0.18, 0.08, -0.2],
    },
    {
        id: 3,
        title: 'Mặt Đáy Chống Trượt An Toàn',
        badge: 'TIÊU CHUẨN TRƯỜNG HỌC',
        description: 'Mặt dưới nệm được may phủ lớp vải chấm bi silicon bám dính chắc chắn trên bề mặt sàn gỗ hoặc gạch men của lớp học.',
        salesPitch: 'Chống trượt dịch chuyển khi các con nô đùa hoặc thức dậy bước xuống sàn, phòng ngừa ngã té.',
        position3D: [-0.22, 0.02, 0.25],
    },
    {
        id: 4,
        title: 'Dây Kéo Giấu & Khóa Tháo Rời Chăn',
        badge: 'TỐI ƯU VẬN HÀNH',
        description: 'Dây kéo được giấu mép vải kỹ lưỡng, kèm tùy chọn khóa kéo liên kết tháo rời chăn riêng biệt khi giặt phơi.',
        salesPitch: 'Giúp nhà trường và phụ huynh tháo rời từng bộ phận để giặt sấy định kỳ cực kỳ nhanh gọn và mau khô.',
        position3D: [0.28, 0.06, 0.1],
    },
    {
        id: 5,
        title: 'Nhãn Tên Lớp Định Danh',
        badge: 'CHỐNG THẤT LẠC ĐỒ',
        description: 'Nhãn may dệt sẵn dòng thông tin: Tên trường, Khóa học, Tên lớp và Tên học sinh (ví dụ: Bé Minh Khuê - Lớp Mầm 1).',
        salesPitch: 'Giải quyết triệt để vấn đề nhầm lẫn đồ dùng cá nhân khi cô giáo sắp xếp hoặc khi phụ huynh đến đón bé cuối tuần.',
        position3D: [-0.18, 0.06, 0.52],
    },
];

export default function Product360Studio({
    subcategory,
    selectedOptions,
    selectedColorHex = '#8CE3CB',
    selectedColorName = 'Xanh ngọc',
    logoUrl = null,
    onProceedToLead,
}: Product360StudioProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    // Dynamic 3D Groups
    const productRootRef = useRef<THREE.Group>(new THREE.Group());
    const mattressGroupRef = useRef<THREE.Group>(new THREE.Group());
    const pillowGroupRef = useRef<THREE.Group>(new THREE.Group());
    const blanketGroupRef = useRef<THREE.Group>(new THREE.Group());
    const bagGroupRef = useRef<THREE.Group>(new THREE.Group());
    const logoMeshRef = useRef<THREE.Mesh | null>(null);

    // Interactive States
    const [viewMode, setViewMode] = useState<'assembled' | 'exploded' | 'folded'>('assembled');
    const [explodedT, setExplodedT] = useState(0); // 0 to 1
    const [activeHotspotId, setActiveHotspotId] = useState<number | null>(null);
    const [hotspotScreenCoords, setHotspotScreenCoords] = useState<Array<{ id: number; x: number; y: number; visible: boolean }>>([]);
    const [lightingPreset, setLightingPreset] = useState<'studio' | 'daylight' | 'cozy'>('studio');
    const [autoRotate, setAutoRotate] = useState(false);
    const [selectedBagStyle, setSelectedBagStyle] = useState<'box' | 'handle' | 'drawstring'>('box');

    // Color resolution
    const activeColor = selectedColorHex || '#8CE3CB';
    const isSatin = subcategory.name.toLowerCase().includes('satin');
    const isFoam = subcategory.name.toLowerCase().includes('foam');

    // 360 Frames Turntable State
    const frames = subcategory.frames_360 || [];
    const has360Frames = frames.length > 0;
    const [viewEngine, setViewEngine] = useState<'3d' | 'frames_360'>(has360Frames ? 'frames_360' : '3d');
    const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
    const [isFramesAutoRotating, setIsFramesAutoRotating] = useState<boolean>(false);
    const [framesZoom, setFramesZoom] = useState<number>(1);
    const isDraggingFrameRef = useRef<boolean>(false);
    const dragStartXRef = useRef<number>(0);
    const dragStartIndexRef = useRef<number>(0);

    // Auto rotate turntable player
    useEffect(() => {
        if (!isFramesAutoRotating || frames.length === 0 || viewEngine !== 'frames_360') return;
        const timer = setInterval(() => {
            setCurrentFrameIndex(prev => (prev + 1) % frames.length);
        }, 250);
        return () => clearInterval(timer);
    }, [isFramesAutoRotating, frames.length, viewEngine]);

    const handleTurntablePointerDown = (e: React.PointerEvent) => {
        if (frames.length === 0) return;
        isDraggingFrameRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartIndexRef.current = currentFrameIndex;
        try {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        } catch {}
    };

    const handleTurntablePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingFrameRef.current || frames.length === 0) return;
        const deltaX = e.clientX - dragStartXRef.current;
        const step = 16; // 16px drag advances 1 frame
        const frameOffset = Math.floor(deltaX / step);
        const newIndex = (((dragStartIndexRef.current - frameOffset) % frames.length) + frames.length) % frames.length;
        setCurrentFrameIndex(newIndex);
    };

    const handleTurntablePointerUp = (e: React.PointerEvent) => {
        isDraggingFrameRef.current = false;
        try {
            (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch {}
    };

    // ----------------------------------------------------
    // 1. Procedural Texture Generator for Cotton Cara Waffle
    // ----------------------------------------------------
    const createCaraTexture = useCallback(() => {
        if (typeof document === 'undefined') return null;
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        // Waffle quilting grid (64px step)
        const step = 64;
        ctx.lineWidth = 4;
        for (let i = 0; i <= size; i += step) {
            ctx.strokeStyle = 'rgba(100, 70, 220, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
        }

        // Diamond cotton waffle indentations
        ctx.fillStyle = 'rgba(130, 130, 255, 0.25)';
        for (let x = step / 2; x < size; x += step) {
            for (let y = step / 2; y < size; y += step) {
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 12);
        return texture;
    }, []);

    // ----------------------------------------------------
    // 2. Initialize Three.js WebGL Scene
    // ----------------------------------------------------
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(lightingPreset === 'cozy' ? '#F7F3EA' : '#F8FAF9');
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(1.4, 1.2, 1.6);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        rendererRef.current = renderer;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 0.7;
        controls.maxDistance = 3.8;
        controls.maxPolarAngle = Math.PI / 2 + 0.02; // prevent going below floor
        controls.target.set(0, 0.08, 0);
        controlsRef.current = controls;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        const mainDirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainDirLight.position.set(3, 5, 2.5);
        mainDirLight.castShadow = true;
        mainDirLight.shadow.mapSize.width = 2048;
        mainDirLight.shadow.mapSize.height = 2048;
        mainDirLight.shadow.bias = -0.0003;
        mainDirLight.shadow.camera.near = 0.5;
        mainDirLight.shadow.camera.far = 15;
        const d = 1.5;
        mainDirLight.shadow.camera.left = -d;
        mainDirLight.shadow.camera.right = d;
        mainDirLight.shadow.camera.top = d;
        mainDirLight.shadow.camera.bottom = -d;
        scene.add(mainDirLight);

        // Soft Warm Fill light
        const fillLight = new THREE.DirectionalLight(0xfff4e6, 0.45);
        fillLight.position.set(-3, 3, -2);
        scene.add(fillLight);

        // Subtle Rim Light for product separation
        const rimLight = new THREE.DirectionalLight(0xd9f2ff, 0.35);
        rimLight.position.set(0, -2, -3);
        scene.add(rimLight);

        // Soft Floor Contact Shadow
        const shadowPlaneGeo = new THREE.PlaneGeometry(2.4, 2.4);
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const sctx = shadowCanvas.getContext('2d');
        if (sctx) {
            const grad = sctx.createRadialGradient(128, 128, 30, 128, 128, 120);
            grad.addColorStop(0, 'rgba(0,0,0,0.42)');
            grad.addColorStop(0.5, 'rgba(0,0,0,0.18)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            sctx.fillStyle = grad;
            sctx.fillRect(0, 0, 256, 256);
        }
        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false,
        });
        const shadowMesh = new THREE.Mesh(shadowPlaneGeo, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.y = 0.002;
        scene.add(shadowMesh);

        // Setup Root Hierarchy
        const rootGroup = productRootRef.current;
        rootGroup.clear();
        rootGroup.add(mattressGroupRef.current);
        rootGroup.add(pillowGroupRef.current);
        rootGroup.add(blanketGroupRef.current);
        rootGroup.add(bagGroupRef.current);
        scene.add(rootGroup);

        // Render Loop
        let animId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animId = requestAnimationFrame(animate);
            const delta = clock.getDelta();

            if (controls.autoRotate) {
                controls.update();
            } else {
                controls.update();
            }

            // Project Hotspots to 2D screen coordinates
            if (cameraRef.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const coords = HULA_HOTSPOTS.map(h => {
                    const worldPos = new THREE.Vector3(...h.position3D);
                    // Account for exploded mode displacement
                    if (viewMode === 'exploded') {
                        if (h.id === 1) worldPos.y += 0.22; // pillow lifted
                        if (h.id === 2 || h.id === 4) worldPos.y += 0.35; // blanket lifted
                    }
                    worldPos.project(camera);
                    const isFacing = worldPos.z < 1.0;
                    const x = ((worldPos.x + 1) * rect.width) / 2;
                    const y = ((-worldPos.y + 1) * rect.height) / 2;
                    return { id: h.id, x, y, visible: isFacing && x >= 0 && x <= rect.width && y >= 0 && y <= rect.height };
                });
                setHotspotScreenCoords(coords);
            }

            renderer.render(scene, camera);
        };
        animate();

        // Resize Listener
        const handleResize = () => {
            if (!containerRef.current || !renderer || !camera) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // ----------------------------------------------------
    // 3. Build & Rebuild 3D Meshes when options / color changes
    // ----------------------------------------------------
    useEffect(() => {
        const caraNormalTex = createCaraTexture();

        // 3.1 Mattress Material
        const fabricColor = new THREE.Color(activeColor);
        const mattressMat = new THREE.MeshPhysicalMaterial({
            color: fabricColor,
            roughness: isSatin ? 0.42 : 0.88,
            metalness: isSatin ? 0.05 : 0.0,
            sheen: isSatin ? 0.75 : 0.3,
            sheenRoughness: 0.65,
            sheenColor: isSatin ? new THREE.Color(0xffffff) : fabricColor,
            normalMap: caraNormalTex,
            normalScale: new THREE.Vector2(0.35, 0.35),
            clearcoat: isSatin ? 0.1 : 0.0,
        });

        // 3.2 Gray Perimeter Piping Material (#8E9B97 from HULA catalogue)
        const pipingMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#8E9B97'),
            roughness: 0.7,
            metalness: 0.05,
        });

        // 3.3 Cream Soft Lining Material (#FAF8F2)
        const liningMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#FAF8F2'),
            roughness: 0.9,
            metalness: 0.0,
        });

        // Clear Groups
        mattressGroupRef.current.clear();
        pillowGroupRef.current.clear();
        blanketGroupRef.current.clear();
        bagGroupRef.current.clear();

        // ==========================================
        // BUILD MATTRESS PAD (Standard: 1.20 x 0.63m)
        // ==========================================
        const mWidth = 0.63;
        const mLength = 1.20;
        const mThickness = isFoam ? 0.035 : 0.025;

        // Base Mattress Box with smooth bevel
        const mattressGeo = new THREE.BoxGeometry(mWidth, mThickness, mLength, 16, 4, 32);
        const mattressMesh = new THREE.Mesh(mattressGeo, mattressMat);
        mattressMesh.position.y = mThickness / 2;
        mattressMesh.castShadow = true;
        mattressMesh.receiveShadow = true;
        mattressGroupRef.current.add(mattressMesh);

        // Piping Torus along perimeter edges
        const pipingRadius = 0.005;
        const pipingCurvePoints = [
            new THREE.Vector3(-mWidth / 2, mThickness, -mLength / 2),
            new THREE.Vector3(mWidth / 2, mThickness, -mLength / 2),
            new THREE.Vector3(mWidth / 2, mThickness, mLength / 2),
            new THREE.Vector3(-mWidth / 2, mThickness, mLength / 2),
            new THREE.Vector3(-mWidth / 2, mThickness, -mLength / 2),
        ];
        const pipingPath = new THREE.CatmullRomCurve3(pipingCurvePoints, true);
        const pipingGeo = new THREE.TubeGeometry(pipingPath, 64, pipingRadius, 8, true);
        const pipingMesh = new THREE.Mesh(pipingGeo, pipingMat);
        mattressGroupRef.current.add(pipingMesh);

        // Anti-slip underside simulation (dark subtle dots)
        const undersideGeo = new THREE.PlaneGeometry(mWidth * 0.96, mLength * 0.96);
        const undersideMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#3A3A3A'),
            roughness: 0.95,
        });
        const undersideMesh = new THREE.Mesh(undersideGeo, undersideMat);
        undersideMesh.rotation.x = Math.PI / 2;
        undersideMesh.position.y = 0.002;
        mattressGroupRef.current.add(undersideMesh);

        // ==========================================
        // BUILD PILLOW (Standard: 0.40 x 0.25m)
        // ==========================================
        const pWidth = 0.40;
        const pLength = 0.25;
        const pHeight = 0.07;

        // Volumetric cushion loft using Spherical deformation on Box
        const pillowGeo = new THREE.BoxGeometry(pWidth, pHeight, pLength, 24, 12, 24);
        const posAttr = pillowGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);

            // Loft factor: puff up center, taper corners
            const distFromCenter = Math.sqrt((vx / (pWidth / 2)) ** 2 + (vz / (pLength / 2)) ** 2);
            const bulge = Math.max(0, 1 - distFromCenter * 0.55);
            if (vy > 0) {
                posAttr.setY(i, vy * (1 + bulge * 0.65));
            } else {
                posAttr.setY(i, vy * 0.8);
            }
        }
        pillowGeo.computeVertexNormals();

        const pillowMat = new THREE.MeshPhysicalMaterial({
            color: isSatin ? fabricColor.clone().offsetHSL(0.02, 0.05, 0.05) : fabricColor,
            roughness: isSatin ? 0.42 : 0.85,
            metalness: 0.0,
            sheen: 0.5,
        });
        const pillowMesh = new THREE.Mesh(pillowGeo, pillowMat);
        pillowMesh.position.set(0, mThickness + pHeight / 2 - 0.005, -mLength / 2 + pLength / 2 + 0.06);
        pillowMesh.castShadow = true;
        pillowMesh.receiveShadow = true;
        pillowGroupRef.current.add(pillowMesh);

        // Anchor Elastic Strap ("Móc cố định chống rơi gối")
        const strapGeo = new THREE.BoxGeometry(pWidth * 1.04, 0.006, 0.03);
        const strapMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4A5568'), roughness: 0.8 });
        const strapMesh = new THREE.Mesh(strapGeo, strapMat);
        strapMesh.position.set(0, mThickness + 0.003, pillowMesh.position.z);
        pillowGroupRef.current.add(strapMesh);

        // ==========================================
        // BUILD DRAPED BLANKET (Standard: 1.30 x 0.70m)
        // ==========================================
        const bWidth = mWidth * 1.08;
        const bLength = mLength * 0.72;
        const blanketGeo = new THREE.BoxGeometry(bWidth, 0.012, bLength, 24, 4, 32);

        // Soft cloth curve draping over mattress sides
        const bPos = blanketGeo.attributes.position;
        for (let i = 0; i < bPos.count; i++) {
            const vx = bPos.getX(i);
            const vz = bPos.getZ(i);

            // Drape over left/right sides
            if (Math.abs(vx) > mWidth / 2 - 0.02) {
                const overhang = Math.abs(vx) - (mWidth / 2 - 0.02);
                bPos.setY(i, bPos.getY(i) - overhang * 1.2);
            }
            // Gentle fold wrinkles
            const wave = Math.sin(vz * 18) * 0.004;
            bPos.setY(i, bPos.getY(i) + wave);
        }
        blanketGeo.computeVertexNormals();

        const blanketMat = new THREE.MeshPhysicalMaterial({
            color: fabricColor,
            roughness: isSatin ? 0.45 : 0.85,
            sheen: 0.6,
            normalMap: caraNormalTex,
        });
        const blanketMesh = new THREE.Mesh(blanketGeo, blanketMat);
        blanketMesh.position.set(0, mThickness + 0.012, 0.12);
        blanketMesh.castShadow = true;
        blanketMesh.receiveShadow = true;
        blanketGroupRef.current.add(blanketMesh);

        // Turned-down cream cuff at head of blanket
        const cuffGeo = new THREE.BoxGeometry(bWidth * 0.98, 0.014, 0.12);
        const cuffMesh = new THREE.Mesh(cuffGeo, liningMat);
        cuffMesh.position.set(0, mThickness + 0.02, blanketMesh.position.z - bLength / 2 + 0.06);
        blanketGroupRef.current.add(cuffMesh);

        // ==========================================
        // BUILD STORAGE BAG (3 Styles from Sale Kit)
        // ==========================================
        const bagGroup = bagGroupRef.current;
        const bagColor = fabricColor.clone().offsetHSL(-0.03, 0.1, -0.05);

        if (selectedBagStyle === 'box') {
            // Túi Hộp Quai Đeo HULA (Best Choice: 36 x 28 x 14cm)
            const boxGeo = new THREE.BoxGeometry(0.36, 0.28, 0.14);
            const boxMat = new THREE.MeshStandardMaterial({
                color: bagColor,
                roughness: 0.8,
                metalness: 0.05,
            });
            const bagMesh = new THREE.Mesh(boxGeo, boxMat);
            bagMesh.position.set(0.55, 0.14, 0);
            bagMesh.castShadow = true;
            bagGroup.add(bagMesh);

            // Handle Strap on top
            const handleGeo = new THREE.TorusGeometry(0.08, 0.012, 8, 24, Math.PI);
            const handleMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#333333'), roughness: 0.7 });
            const handleMesh = new THREE.Mesh(handleGeo, handleMat);
            handleMesh.rotation.z = Math.PI;
            handleMesh.position.set(0.55, 0.29, 0);
            bagGroup.add(handleMesh);

            // Front pocket with zipper line
            const pocketGeo = new THREE.BoxGeometry(0.26, 0.18, 0.015);
            const pocketMesh = new THREE.Mesh(pocketGeo, liningMat);
            pocketMesh.position.set(0.55, 0.12, 0.075);
            bagGroup.add(pocketMesh);
        } else if (selectedBagStyle === 'handle') {
            // Túi Quai Xách (48 x 40cm)
            const bagGeo = new THREE.BoxGeometry(0.44, 0.38, 0.08);
            const bagMat = new THREE.MeshStandardMaterial({ color: bagColor, roughness: 0.85 });
            const bagMesh = new THREE.Mesh(bagGeo, bagMat);
            bagMesh.position.set(0.55, 0.19, 0);
            bagMesh.castShadow = true;
            bagGroup.add(bagMesh);

            // Double Straps
            const sGeo = new THREE.TorusGeometry(0.09, 0.01, 8, 24, Math.PI);
            const sMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#222222'), roughness: 0.8 });
            const sMesh = new THREE.Mesh(sGeo, sMat);
            sMesh.rotation.z = Math.PI;
            sMesh.position.set(0.55, 0.39, 0);
            bagGroup.add(sMesh);
        } else {
            // Balo Rút Mầm Non (40 x 50cm)
            const drawGeo = new THREE.CylinderGeometry(0.18, 0.21, 0.44, 24);
            const drawMat = new THREE.MeshStandardMaterial({ color: bagColor, roughness: 0.85 });
            const drawMesh = new THREE.Mesh(drawGeo, drawMat);
            drawMesh.position.set(0.55, 0.22, 0);
            drawMesh.castShadow = true;
            bagGroup.add(drawMesh);
        }

        // ==========================================
        // DYNAMIC LOGO DECAL EMBROIDERY
        // ==========================================
        if (logoUrl) {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.onload = () => {
                const lCanvas = document.createElement('canvas');
                lCanvas.width = 512;
                lCanvas.height = 512;
                const lctx = lCanvas.getContext('2d');
                if (lctx) {
                    lctx.clearRect(0, 0, 512, 512);

                    // Soft cloth patch background with rounded corners
                    lctx.fillStyle = '#ffffff';
                    lctx.beginPath();
                    lctx.roundRect(16, 16, 480, 480, 40);
                    lctx.fill();

                    // Gold stitched border
                    lctx.lineWidth = 14;
                    lctx.strokeStyle = '#D4AF37';
                    lctx.setLineDash([20, 10]);
                    lctx.stroke();

                    // Draw Logo centered
                    lctx.drawImage(logoImg, 64, 64, 384, 384);
                }

                const logoTexture = new THREE.CanvasTexture(lCanvas);
                const logoMat = new THREE.MeshStandardMaterial({
                    map: logoTexture,
                    transparent: true,
                    roughness: 0.5,
                });
                const logoGeo = new THREE.PlaneGeometry(0.12, 0.12);
                const logoMesh = new THREE.Mesh(logoGeo, logoMat);
                logoMesh.rotation.x = -Math.PI / 2;
                // Place at foot corner of mattress
                logoMesh.position.set(0.18, mThickness + 0.003, 0.45);
                mattressGroupRef.current.add(logoMesh);
                logoMeshRef.current = logoMesh;
            };
            logoImg.src = logoUrl;
        }

    }, [activeColor, isSatin, isFoam, logoUrl, selectedBagStyle, createCaraTexture]);

    // ----------------------------------------------------
    // 4. Exploded View (Bung linh kiện) Animation Controller
    // ----------------------------------------------------
    useEffect(() => {
        let startTime: number | null = null;
        const targetT = viewMode === 'exploded' ? 1.0 : 0.0;
        const startT = explodedT;
        const duration = 400; // ms

        const animateExplode = (time: number) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            // Ease out cubic
            const ease = 1 - (1 - progress) ** 3;
            const currentT = startT + (targetT - startT) * ease;
            setExplodedT(currentT);

            // Apply 3D separation along axes
            pillowGroupRef.current.position.y = currentT * 0.22;
            pillowGroupRef.current.position.z = -currentT * 0.08;

            blanketGroupRef.current.position.y = currentT * 0.35;
            blanketGroupRef.current.position.z = currentT * 0.12;

            bagGroupRef.current.position.x = 0.55 + currentT * 0.35;

            if (progress < 1.0) {
                requestAnimationFrame(animateExplode);
            }
        };

        requestAnimationFrame(animateExplode);
    }, [viewMode]);

    // ----------------------------------------------------
    // 5. Lighting Presets Handler
    // ----------------------------------------------------
    const handleSetLighting = (preset: 'studio' | 'daylight' | 'cozy') => {
        setLightingPreset(preset);
        if (!sceneRef.current) return;

        if (preset === 'daylight') {
            sceneRef.current.background = new THREE.Color('#F0F7FA');
        } else if (preset === 'cozy') {
            sceneRef.current.background = new THREE.Color('#FDF8F0');
        } else {
            sceneRef.current.background = new THREE.Color('#F8FAF9');
        }
    };

    // ----------------------------------------------------
    // 6. Camera View Presets
    // ----------------------------------------------------
    const setCameraPreset = (angle: 'perspective' | 'top' | 'closeup' | 'bag') => {
        if (!controlsRef.current || !cameraRef.current) return;
        const controls = controlsRef.current;
        const camera = cameraRef.current;

        if (angle === 'top') {
            camera.position.set(0, 2.2, 0.01);
            controls.target.set(0, 0, 0);
        } else if (angle === 'closeup') {
            camera.position.set(0.35, 0.3, 0.4);
            controls.target.set(0.1, 0.08, 0.2);
        } else if (angle === 'bag') {
            camera.position.set(0.85, 0.45, 0.45);
            controls.target.set(0.55, 0.15, 0);
        } else {
            camera.position.set(1.4, 1.2, 1.6);
            controls.target.set(0, 0.08, 0);
        }
        controls.update();
    };

    const activeHotspotData = HULA_HOTSPOTS.find(h => h.id === activeHotspotId);

    const activeFrame = frames.length > 0 ? frames[currentFrameIndex] : null;

    return (
        <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-slate-900">
            {/* 1. Main 3D Canvas Viewport (Active when viewEngine === '3d') */}
            <div
                ref={containerRef}
                className={`relative flex-1 w-full h-full cursor-grab active:cursor-grabbing touch-none ${viewEngine === '3d' ? 'block' : 'hidden'}`}
            />

            {/* 2. Main 360 Turntable Viewport (Active when viewEngine === 'frames_360') */}
            {viewEngine === 'frames_360' && (
                <div
                    className="relative flex-1 w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none overflow-hidden"
                    style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
                    onPointerDown={handleTurntablePointerDown}
                    onPointerMove={handleTurntablePointerMove}
                    onPointerUp={handleTurntablePointerUp}
                    onPointerLeave={handleTurntablePointerUp}
                >
                    {frames.length === 0 ? (
                        <div className="text-slate-400 text-center p-6">
                            <div className="text-3xl mb-2">🌐</div>
                            <div className="font-bold text-sm">Chưa có dữ liệu khung hình 360° cho sản phẩm này</div>
                            <div className="text-xs text-slate-500 mt-1">Vui lòng cấu hình các góc 360° trong CMS</div>
                        </div>
                    ) : (
                        <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center p-4">
                            {/* Angle indicator badge */}
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-white text-xs font-bold flex items-center gap-2 z-10 pointer-events-none shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span>Góc {activeFrame?.angle ?? 0}°: {activeFrame?.label || 'Khung 360°'}</span>
                                <span className="text-[10px] text-slate-400">({currentFrameIndex + 1}/{frames.length})</span>
                            </div>

                            {/* BASE PHOTO FRAME */}
                            {activeFrame?.image_url && (
                                <img
                                    src={resolveImageUrl(activeFrame.image_url)}
                                    alt={activeFrame.label || `Góc ${activeFrame.angle}°`}
                                    className="w-full h-full object-contain pointer-events-none transition-transform duration-150"
                                    style={{ transform: `scale(${framesZoom})` }}
                                    draggable={false}
                                />
                            )}

                            {/* DYNAMIC HEX COLOR TINT OVERLAY */}
                            {activeColor && activeFrame?.image_url && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 16,
                                        backgroundColor: activeColor,
                                        WebkitMaskImage: `url(${resolveImageUrl(activeFrame.mask_url || activeFrame.image_url)})`,
                                        maskImage: `url(${resolveImageUrl(activeFrame.mask_url || activeFrame.image_url)})`,
                                        WebkitMaskSize: 'contain',
                                        maskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskPosition: 'center',
                                        mixBlendMode: (activeFrame.tint_blend_mode as any) || 'multiply',
                                        opacity: activeFrame.tint_opacity ?? 0.72,
                                        pointerEvents: 'none',
                                        transform: `scale(${framesZoom})`,
                                        transition: 'background-color 0.25s ease, opacity 0.2s ease',
                                    }}
                                />
                            )}

                            {/* EMBROIDERED BRAND LOGO OVERLAY (on front/side views) */}
                            {logoUrl && (activeFrame?.angle === 0 || activeFrame?.angle === 45 || activeFrame?.angle === 315) && (
                                <div
                                    className="absolute pointer-events-none z-10"
                                    style={{
                                        top: '40%',
                                        left: activeFrame?.angle === 45 ? '58%' : activeFrame?.angle === 315 ? '42%' : '50%',
                                        transform: `translate(-50%, -50%) scale(${framesZoom})`,
                                        maxWidth: 65,
                                        maxHeight: 65,
                                    }}
                                >
                                    <img
                                        src={resolveImageUrl(logoUrl)}
                                        alt="Logo thương hiệu"
                                        className="w-full h-full object-contain drop-shadow-md opacity-90"
                                    />
                                </div>
                            )}

                            {/* Drag hint overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs font-semibold bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/50">
                                👈 Vuốt hoặc kéo chuột sang ngang để xoay 360° 👉
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TOP BAR: Product Badge & Mode Toggles */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20 flex-wrap gap-2">
                {/* Left: Product & Specs Pill */}
                <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
                        style={{ backgroundColor: activeColor }}
                    />
                    <div>
                        <div className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                            <span>{subcategory.name}</span>
                            <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-bold">
                                {selectedColorName}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            {isFoam ? 'Nệm 120x60x3cm · Gối 40x25cm' : 'Nệm 120x63cm · Gối 40x25cm · Chăn 130x70cm'}
                        </div>
                    </div>
                </div>

                {/* Center: Dual-Engine Switcher (Mô hình 3D PBR vs Chuỗi Frame 360° Studio) */}
                {has360Frames && (
                    <div className="bg-slate-950/80 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-700 pointer-events-auto flex items-center gap-1">
                        <button
                            onClick={() => setViewEngine('frames_360')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewEngine === 'frames_360' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                            <span>Ảnh Thật 360° ({frames.length} góc)</span>
                        </button>
                        <button
                            onClick={() => setViewEngine('3d')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewEngine === '3d' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <span>🎮 Mô Hình 3D PBR</span>
                        </button>
                    </div>
                )}

                {/* Right: Controls dependent on mode */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    {viewEngine === '3d' ? (
                        <>
                            {/* Lighting Preset */}
                            <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 flex items-center gap-1 text-xs">
                                <button
                                    onClick={() => handleSetLighting('studio')}
                                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${lightingPreset === 'studio' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title="Ánh sáng Studio trung thực"
                                >
                                    Studio
                                </button>
                                <button
                                    onClick={() => handleSetLighting('daylight')}
                                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${lightingPreset === 'daylight' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title="Ánh sáng lớp học ban ngày"
                                >
                                    Ban Ngày
                                </button>
                                <button
                                    onClick={() => handleSetLighting('cozy')}
                                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${lightingPreset === 'cozy' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title="Ánh sáng ấm giờ ngủ trưa"
                                >
                                    Giờ Ngủ
                                </button>
                            </div>

                            {/* 3D Auto Rotate Toggle */}
                            <button
                                onClick={() => {
                                    if (controlsRef.current) {
                                        controlsRef.current.autoRotate = !autoRotate;
                                        setAutoRotate(!autoRotate);
                                    }
                                }}
                                className={`p-2 rounded-xl shadow-lg border transition-all ${autoRotate ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'}`}
                                title="Tự động xoay 360°"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            {/* 360 Turntable Controls: Auto-spin + Zoom */}
                            <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 flex items-center gap-1">
                                <button
                                    onClick={() => setIsFramesAutoRotating(!isFramesAutoRotating)}
                                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${isFramesAutoRotating ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                    title="Tự động quay 360°"
                                >
                                    <span>{isFramesAutoRotating ? '⏸ Dừng' : '▶ Tự xoay'}</span>
                                </button>

                                <button
                                    onClick={() => setFramesZoom(framesZoom === 1 ? 1.4 : framesZoom === 1.4 ? 2 : 1)}
                                    className="px-2.5 py-1 rounded-lg text-slate-700 font-bold text-xs hover:bg-slate-100"
                                    title="Phóng to / Thu nhỏ"
                                >
                                    🔍 {framesZoom}x
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* FLOATING 3D HOTSPOT PINS (Only in 3D mode) */}
            {viewEngine === '3d' && hotspotScreenCoords.map(h => {
                const info = HULA_HOTSPOTS.find(item => item.id === h.id);
                if (!info || !h.visible) return null;

                const isCurrent = activeHotspotId === h.id;

                return (
                    <button
                        key={h.id}
                        onClick={() => setActiveHotspotId(isCurrent ? null : h.id)}
                        style={{
                            transform: `translate(${h.x - 16}px, ${h.y - 16}px)`,
                        }}
                        className={`absolute top-0 left-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-125 z-30 group cursor-pointer ${isCurrent ? 'scale-125' : ''}`}
                    >
                        <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-60 animate-ping" />
                        <div className="w-6 h-6 rounded-full bg-cyan-600 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black text-white">
                            {h.id}
                        </div>
                        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-slate-900/90 text-white text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                            {info.title}
                        </span>
                    </button>
                );
            })}

            {/* ACTIVE HOTSPOT POPOVER DRAWER (Sale Kit Details) */}
            {viewEngine === '3d' && activeHotspotData && (
                <div className="absolute top-20 right-4 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-cyan-200 p-5 z-40 animate-fade-in">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                                {activeHotspotData.badge}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                                {activeHotspotData.title}
                            </h4>
                        </div>
                        <button
                            onClick={() => setActiveHotspotId(null)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {activeHotspotData.description}
                    </p>

                    <div className="bg-cyan-50/70 p-3 rounded-xl border border-cyan-100 flex items-start gap-2">
                        <span className="text-cyan-600 font-bold text-sm">💡</span>
                        <div className="text-[11px] text-cyan-900 font-semibold leading-relaxed">
                            {activeHotspotData.salesPitch}
                        </div>
                    </div>
                </div>
            )}

            {/* BOTTOM DOCKED TOOLBAR: Engine specific */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none z-20">
                {viewEngine === '3d' ? (
                    <>
                        {/* Left: Exploded View Button & Angles */}
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'exploded' ? 'assembled' : 'exploded')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${viewMode === 'exploded' ? 'bg-cyan-600 text-white shadow-cyan-600/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                <span>{viewMode === 'exploded' ? '📦 Gom Linh Kiện' : '✨ Bung Linh Kiện (Exploded View)'}</span>
                            </button>

                            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
                            <div className="flex items-center gap-1 text-xs">
                                <button
                                    onClick={() => setCameraPreset('perspective')}
                                    className="px-2.5 py-1.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100"
                                >
                                    Toàn cảnh
                                </button>
                                <button
                                    onClick={() => setCameraPreset('top')}
                                    className="px-2.5 py-1.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100"
                                >
                                    Mặt trên
                                </button>
                                <button
                                    onClick={() => setCameraPreset('closeup')}
                                    className="px-2.5 py-1.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100"
                                >
                                    Cận cảnh vải
                                </button>
                                <button
                                    onClick={() => setCameraPreset('bag')}
                                    className="px-2.5 py-1.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100"
                                >
                                    Túi đựng
                                </button>
                            </div>
                        </div>

                        {/* Right: Storage Bag Switcher & CTA */}
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 ml-2 hidden sm:inline">Mẫu túi:</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setSelectedBagStyle('box')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${selectedBagStyle === 'box' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title="Túi hộp quai đeo (Best Choice)"
                                >
                                    Túi Hộp
                                </button>
                                <button
                                    onClick={() => setSelectedBagStyle('handle')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${selectedBagStyle === 'handle' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title="Túi quai xách"
                                >
                                    Quai Xách
                                </button>
                                <button
                                    onClick={() => setSelectedBagStyle('drawstring')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${selectedBagStyle === 'drawstring' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title="Balo rút"
                                >
                                    Balo Rút
                                </button>
                            </div>

                            {onProceedToLead && (
                                <button
                                    onClick={onProceedToLead}
                                    className="ml-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                    NHẬN BÁO GIÁ SỈ
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* 360 Turntable Quick Angles Bar */}
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 ml-2">Góc nhìn nhanh:</span>
                            <div className="flex items-center gap-1 text-xs">
                                {frames.map((f, idx) => (
                                    <button
                                        key={f.id || idx}
                                        onClick={() => setCurrentFrameIndex(idx)}
                                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${currentFrameIndex === idx ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                        title={f.label || `Góc ${f.angle}°`}
                                    >
                                        {f.angle}°
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Color Hex indicator & CTA */}
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                <div className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0" style={{ backgroundColor: activeColor }} />
                                <span className="font-bold text-slate-700">{selectedColorName}</span>
                                <code className="text-[10px] text-cyan-700 font-mono font-semibold">{activeColor}</code>
                            </div>

                            {onProceedToLead && (
                                <button
                                    onClick={onProceedToLead}
                                    className="ml-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                    NHẬN BÁO GIÁ SỈ
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Instruction Tip */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none opacity-60 text-slate-400 text-[11px] font-bold">
                {viewEngine === '3d'
                    ? 'Kéo chuột để xoay 360° · Cuộn chuột để phóng to · Bấm các điểm ✦ để xem tính năng'
                    : 'Kéo chuột / Vuốt màn hình sang ngang để xoay 360° các góc chụp thực tế'}
            </div>
        </div>
    );
}
