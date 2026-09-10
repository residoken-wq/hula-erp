/**
 * generate-r7-illustrated-scenes.js
 * Generates 18 canonical visual scenes for R7 Weekend Handover:
 * 3 Roles (co-an, me-linh, be-may) x 6 Steps (H0 to H5)
 * Strict conformance to:
 * - 02_R7_Asset-Brief.md & 01_AI-IDE_Instruction10.md
 * - 16:9 ratio (1280x720) WebP output
 * - Perspective consistency & character design locks
 * - Single bag instance: bag-may-01 (teal blue, gray piping, dual handles)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(__dirname, '../public/images/tour360/r7');

const ROLES = ['co-an', 'me-linh', 'be-may'];
const STEPS = [
    { code: 'h0-greet', title: 'H0: Gặp nhau tại bàn đón bé' },
    { code: 'h1-table', title: 'H1: Đặt túi lên bàn kiểm tra' },
    { code: 'h2-label', title: 'H2: Xác nhận nhãn và danh mục đồ' },
    { code: 'h3-ready', title: 'H3: Chuẩn bị trao nhận túi' },
    { code: 'h4-transfer', title: 'H4: Tiếp xúc quai và bàn giao' },
    { code: 'h5-received', title: 'H5: Hoàn tất bàn giao' },
];

function generateSceneSvg(role, stepCode) {
    const isLowAngle = role === 'be-may';
    const isCoAnPOV = role === 'co-an';
    const isMeLinhPOV = role === 'me-linh';

    // Base background layout
    const deskY = isLowAngle ? 480 : 490;
    const eyeLevelY = isLowAngle ? 220 : 360;

    // Cubby shelf on left
    const cubbySvg = `
        <g id="cubby-shelf" opacity="0.95">
            <rect x="30" y="${deskY - 260}" width="220" height="340" rx="8" fill="#E2D4C0" stroke="#C4B49F" stroke-width="3"/>
            <!-- Shelves -->
            <line x1="30" y1="${deskY - 150}" x2="250" y2="${deskY - 150}" stroke="#C4B49F" stroke-width="4"/>
            <line x1="30" y1="${deskY - 40}" x2="250" y2="${deskY - 40}" stroke="#C4B49F" stroke-width="4"/>
            <line x1="140" y1="${deskY - 260}" x2="140" y2="${deskY + 80}" stroke="#C4B49F" stroke-width="4"/>
            
            <!-- Other children's bags on shelves -->
            <rect x="50" y="${deskY - 130}" width="70" height="75" rx="10" fill="#FFB067" stroke="#E0924A" stroke-width="2"/>
            <rect x="155" y="${deskY - 130}" width="75" height="75" rx="10" fill="#9CCB53" stroke="#84B03F" stroke-width="2"/>
            <rect x="50" y="${deskY - 20}" width="70" height="85" rx="8" fill="#F495B4" stroke="#DB789A" stroke-width="2"/>
            <rect x="155" y="${deskY - 20}" width="75" height="85" rx="8" fill="#FCD860" stroke="#E2BB3C" stroke-width="2"/>
            
            <!-- bag-may-01 on shelf in H0 if co-an or me-linh -->
            ${stepCode === 'h0-greet' ? `
                <g id="bag-on-shelf" transform="translate(150, ${deskY - 240}) scale(0.75)">
                    <rect x="0" y="20" width="100" height="85" rx="12" fill="#087F8C" stroke="#066772" stroke-width="3"/>
                    <path d="M 30 20 C 30 -5, 70 -5, 70 20" fill="none" stroke="#8E9B97" stroke-width="7" stroke-linecap="round"/>
                    <rect x="25" y="45" width="50" height="24" rx="4" fill="#FFFFFF" stroke="#087F8C" stroke-width="1.5"/>
                    <text x="50" y="61" font-family="DejaVu Sans, sans-serif" font-size="10" font-weight="bold" fill="#087F8C" text-anchor="middle">MÂY</text>
                </g>
            ` : ''}
        </g>
    `;

    // Window on right
    const windowSvg = `
        <g id="window-wall">
            <rect x="1060" y="60" width="180" height="420" rx="12" fill="#E8F4F8" stroke="#CADDE5" stroke-width="4"/>
            <line x1="1150" y1="60" x2="1150" y2="480" stroke="#CADDE5" stroke-width="3"/>
            <line x1="1060" y1="200" x2="1240" y2="200" stroke="#CADDE5" stroke-width="3"/>
            <line x1="1060" y1="340" x2="1240" y2="340" stroke="#CADDE5" stroke-width="3"/>
            <!-- Sunlight stream polygon -->
            <polygon points="1060,120 1240,120 900,720 600,720" fill="url(#sunlight-grad)" opacity="0.32"/>
        </g>
    `;

    // Consultation Desk
    const deskSvg = `
        <g id="consultation-desk">
            <!-- Table top -->
            <rect x="260" y="${deskY}" width="760" height="28" rx="8" fill="#D6A97A" stroke="#B88A58" stroke-width="2.5"/>
            <!-- Front skirt -->
            <rect x="280" y="${deskY + 28}" width="720" height="190" fill="#C4925F" opacity="0.9"/>
            <!-- Legs -->
            <rect x="270" y="${deskY + 28}" width="26" height="200" fill="#A87442"/>
            <rect x="984" y="${deskY + 28}" width="26" height="200" fill="#A87442"/>
            <!-- Desk blotter mat -->
            <rect x="420" y="${deskY - 4}" width="440" height="16" rx="4" fill="#EAE0D0" stroke="#D0C4B0" stroke-width="1.5"/>
            <!-- Small green plant in ceramic pot -->
            <g transform="translate(300, ${deskY - 55})">
                <rect x="15" y="25" width="26" height="30" rx="5" fill="#E8F0EA" stroke="#A8BCB0" stroke-width="1.5"/>
                <circle cx="28" cy="18" r="16" fill="#8BB89E"/>
                <circle cx="20" cy="12" r="12" fill="#75A68A"/>
                <circle cx="36" cy="14" r="11" fill="#9EC4B0"/>
            </g>
        </g>
    `;

    // Character Rendering across table
    let characterSvg = '';

    // If POV is Mẹ Linh -> Character across table is Cô An
    if (isMeLinhPOV) {
        const coAnX = 640;
        const coAnY = deskY - 240;
        characterSvg = `
            <g id="char-co-an" transform="translate(${coAnX}, ${coAnY})">
                <!-- Hair (tied back, black) -->
                <ellipse cx="0" cy="-6" rx="44" ry="48" fill="#1C2123"/>
                <circle cx="0" cy="38" r="18" fill="#1C2123"/> <!-- low ponytail -->
                <!-- Neck & Body (Teal polo #087F8C) -->
                <path d="M -16 28 L 16 28 L 22 55 L -22 55 Z" fill="#F8CBB1"/>
                <path d="M -75 60 C -75 45, 75 45, 75 60 L 95 240 L -95 240 Z" fill="#087F8C"/>
                <!-- Polo Collar -->
                <polygon points="0,75 -24,52 -10,50 0,60" fill="#066772"/>
                <polygon points="0,75 24,52 10,50 0,60" fill="#066772"/>
                <!-- Friendly face -->
                <ellipse cx="0" cy="0" rx="36" ry="42" fill="#FDDFCC"/>
                <!-- Eyes & Smile -->
                <ellipse cx="-14" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                <ellipse cx="14" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                <path d="M -12 14 Q 0 24 12 14" fill="none" stroke="#B86A50" stroke-width="3" stroke-linecap="round"/>
                <!-- Eyebrows -->
                <path d="M -22 -14 Q -14 -19 -6 -14" fill="none" stroke="#1C2123" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M 6 -14 Q 14 -19 22 -14" fill="none" stroke="#1C2123" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Hands / Arms based on step -->
                ${stepCode === 'h0-greet' ? `
                    <!-- Welcoming gesture resting on table -->
                    <rect x="-85" y="160" width="30" height="78" rx="14" fill="#087F8C"/>
                    <rect x="55" y="160" width="30" height="78" rx="14" fill="#087F8C"/>
                    <circle cx="-70" cy="242" r="16" fill="#FDDFCC"/>
                    <circle cx="70" cy="242" r="16" fill="#FDDFCC"/>
                ` : stepCode === 'h1-table' || stepCode === 'h2-label' ? `
                    <!-- Hands pointing to bag on table -->
                    <rect x="-80" y="150" width="28" height="85" rx="12" fill="#087F8C"/>
                    <circle cx="-60" cy="238" r="15" fill="#FDDFCC"/>
                ` : ''}
            </g>
        `;
    }

    // If POV is Cô An -> Characters across table are Mẹ Linh & Bé Mây
    if (isCoAnPOV) {
        const meLinhX = 660;
        const meLinhY = deskY - 245;
        const beMayX = 460;
        const beMayY = deskY - 150;

        characterSvg = `
            <!-- Mẹ Linh across desk -->
            <g id="char-me-linh" transform="translate(${meLinhX}, ${meLinhY})">
                <!-- Hair (shoulder length, parted) -->
                <path d="M -50 -10 C -50 -55, 50 -55, 50 -10 L 52 50 C 42 75, 28 85, 22 90 L -22 90 C -28 85, -42 75, -52 50 Z" fill="#202426"/>
                <!-- Neck & Cream Blouse #FEF3C7 -->
                <path d="M -15 28 L 15 28 L 22 55 L -22 55 Z" fill="#F8CBB1"/>
                <path d="M -70 58 C -70 45, 70 45, 70 58 L 90 245 L -90 245 Z" fill="#FEF3C7"/>
                <!-- Blouse collar -->
                <path d="M 0 78 L -28 54 L -10 50 L 0 65 L 10 50 L 28 54 Z" fill="#FBE8A6"/>
                <!-- Gentle face -->
                <ellipse cx="0" cy="0" rx="35" ry="40" fill="#FEE2D1"/>
                <!-- Eyes & Smile -->
                <ellipse cx="-13" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                <ellipse cx="13" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                <path d="M -10 14 Q 0 22 10 14" fill="none" stroke="#B86A50" stroke-width="2.8" stroke-linecap="round"/>
                <!-- Side bangs -->
                <path d="M -35 -15 Q -10 -35 25 -20 Q 38 -5 40 15 Q 30 5 25 -8 Q 15 -18 -32 -8 Z" fill="#202426"/>
            </g>

            <!-- Bé Mây beside mother -->
            <g id="char-be-may" transform="translate(${beMayX}, ${beMayY})">
                <!-- Cute bob hair with leaf clip on right (viewer's left) -->
                <ellipse cx="0" cy="-4" rx="32" ry="34" fill="#181B1C"/>
                <!-- Green leaf hair clip -->
                <ellipse cx="22" cy="-14" rx="7" ry="4" transform="rotate(30 22 -14)" fill="#4ADE80" stroke="#16A34A" stroke-width="1.2"/>
                <!-- Face -->
                <ellipse cx="0" cy="0" rx="26" ry="28" fill="#FEE5D5"/>
                <ellipse cx="-9" cy="-2" rx="3" ry="4" fill="#181B1C"/>
                <ellipse cx="9" cy="-2" rx="3" ry="4" fill="#181B1C"/>
                <path d="M -6 10 Q 0 16 6 10" fill="none" stroke="#C26A54" stroke-width="2.2" stroke-linecap="round"/>
                <!-- Soft yellow shirt #FEF08A -->
                <path d="M -45 32 C -45 22, 45 22, 45 32 L 55 140 L -55 140 Z" fill="#FEF08A"/>
            </g>
        `;
    }

    // If POV is Bé Mây -> Low angle, seeing both adults taller across desk
    if (isLowAngle) {
        characterSvg = `
            <!-- Low Angle: Cô An (Left-Center) & Mẹ Linh (Right-Center) -->
            <g id="adults-low-angle" transform="translate(0, -30)">
                <!-- Cô An behind desk -->
                <g transform="translate(480, ${deskY - 260}) scale(1.15)">
                    <ellipse cx="0" cy="-6" rx="44" ry="48" fill="#1C2123"/>
                    <ellipse cx="0" cy="0" rx="36" ry="42" fill="#FDDFCC"/>
                    <ellipse cx="-14" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                    <ellipse cx="14" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                    <path d="M -12 14 Q 0 24 12 14" fill="none" stroke="#B86A50" stroke-width="3" stroke-linecap="round"/>
                    <path d="M -75 60 C -75 45, 75 45, 75 60 L 95 260 L -95 260 Z" fill="#087F8C"/>
                </g>

                <!-- Mẹ Linh beside Mây -->
                <g transform="translate(800, ${deskY - 250}) scale(1.15)">
                    <ellipse cx="0" cy="-6" rx="42" ry="46" fill="#202426"/>
                    <ellipse cx="0" cy="0" rx="35" ry="40" fill="#FEE2D1"/>
                    <ellipse cx="-13" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                    <ellipse cx="13" cy="-3" rx="4" ry="5.5" fill="#242B2E"/>
                    <path d="M -10 14 Q 0 22 10 14" fill="none" stroke="#B86A50" stroke-width="2.8" stroke-linecap="round"/>
                    <path d="M -70 58 C -70 45, 70 45, 70 58 L 90 260 L -90 260 Z" fill="#FEF3C7"/>
                </g>
            </g>
        `;
    }

    // Primary Handover Bag Rendering (bag-may-01)
    let bagSvg = '';
    const bagCenterTableX = 640;
    const bagCenterTableY = deskY - 70;

    if (stepCode === 'h1-table') {
        bagSvg = `
            <g id="bag-on-table" transform="translate(${bagCenterTableX - 80}, ${bagCenterTableY})">
                <!-- Drop shadow -->
                <ellipse cx="80" cy="98" rx="90" ry="14" fill="#8C7050" opacity="0.35"/>
                <!-- Teal body #087F8C -->
                <rect x="0" y="20" width="160" height="85" rx="14" fill="#087F8C" stroke="#066772" stroke-width="3"/>
                <!-- Gray piping trim -->
                <rect x="4" y="24" width="152" height="77" rx="10" fill="none" stroke="#8E9B97" stroke-width="2.5"/>
                <!-- Dual Handles -->
                <path d="M 45 20 C 45 -14, 115 -14, 115 20" fill="none" stroke="#6B7D79" stroke-width="9" stroke-linecap="round"/>
                <!-- White name label zone -->
                <rect x="42" y="48" width="76" height="32" rx="6" fill="#FFFFFF" stroke="#087F8C" stroke-width="2"/>
                <text x="80" y="70" font-family="DejaVu Sans, sans-serif" font-size="14" font-weight="bold" fill="#087F8C" text-anchor="middle">MÂY</text>
            </g>
        `;
    } else if (stepCode === 'h2-label') {
        // H2: Super close-up on the bag and its label
        const zoomScale = isLowAngle ? 1.6 : 1.45;
        const zoomX = bagCenterTableX - (80 * zoomScale);
        const zoomY = bagCenterTableY - 35;
        bagSvg = `
            <g id="bag-closeup" transform="translate(${zoomX}, ${zoomY}) scale(${zoomScale})">
                <!-- Drop shadow -->
                <ellipse cx="80" cy="98" rx="95" ry="15" fill="#8C7050" opacity="0.4"/>
                <!-- Bag Body -->
                <rect x="0" y="20" width="160" height="85" rx="14" fill="#087F8C" stroke="#066772" stroke-width="3"/>
                <rect x="4" y="24" width="152" height="77" rx="10" fill="none" stroke="#8E9B97" stroke-width="2.5"/>
                <!-- Dual Handles upright -->
                <path d="M 45 20 C 45 -18, 115 -18, 115 20" fill="none" stroke="#6B7D79" stroke-width="9" stroke-linecap="round"/>
                <!-- Name label prominent with gold verification glow -->
                <rect x="25" y="44" width="110" height="38" rx="8" fill="#FFFFFF" stroke="#087F8C" stroke-width="2.5" filter="drop-shadow(0 0 8px rgba(8,127,140,0.5))"/>
                <text x="80" y="68" font-family="DejaVu Sans, sans-serif" font-size="16" font-weight="bold" fill="#087F8C" text-anchor="middle">MÂY — LỚP MẦM</text>
            </g>
        `;
    } else if (stepCode === 'h3-ready') {
        // H3: Bag lifted slightly in air, ready to transfer
        bagSvg = `
            <g id="bag-lifted" transform="translate(${bagCenterTableX - 80}, ${bagCenterTableY - 45})">
                <!-- Soft air shadow -->
                <ellipse cx="80" cy="140" rx="75" ry="10" fill="#8C7050" opacity="0.2"/>
                <rect x="0" y="20" width="160" height="85" rx="14" fill="#087F8C" stroke="#066772" stroke-width="3"/>
                <rect x="4" y="24" width="152" height="77" rx="10" fill="none" stroke="#8E9B97" stroke-width="2.5"/>
                <path d="M 45 20 C 45 -18, 115 -18, 115 20" fill="none" stroke="#6B7D79" stroke-width="9" stroke-linecap="round"/>
                <rect x="42" y="48" width="76" height="32" rx="6" fill="#FFFFFF" stroke="#087F8C" stroke-width="2"/>
                <text x="80" y="70" font-family="DejaVu Sans, sans-serif" font-size="14" font-weight="bold" fill="#087F8C" text-anchor="middle">MÂY</text>
            </g>
        `;
    } else if (stepCode === 'h4-transfer') {
        // H4: Transfer point! Two pairs of hands contacting bag handles
        bagSvg = `
            <g id="bag-transferring" transform="translate(${bagCenterTableX - 80}, ${bagCenterTableY - 50})">
                <ellipse cx="80" cy="145" rx="75" ry="10" fill="#8C7050" opacity="0.2"/>
                <rect x="0" y="20" width="160" height="85" rx="14" fill="#087F8C" stroke="#066772" stroke-width="3"/>
                <rect x="4" y="24" width="152" height="77" rx="10" fill="none" stroke="#8E9B97" stroke-width="2.5"/>
                <path d="M 45 20 C 45 -18, 115 -18, 115 20" fill="none" stroke="#6B7D79" stroke-width="9" stroke-linecap="round"/>
                <rect x="42" y="48" width="76" height="32" rx="6" fill="#FFFFFF" stroke="#087F8C" stroke-width="2"/>
                <text x="80" y="70" font-family="DejaVu Sans, sans-serif" font-size="14" font-weight="bold" fill="#087F8C" text-anchor="middle">MÂY</text>
                
                <!-- Hands touching the handles simultaneously -->
                <!-- Cô An hand (Left grip) -->
                <rect x="42" y="-12" width="22" height="24" rx="8" fill="#F8CBB1" stroke="#E2A687" stroke-width="1.5"/>
                <!-- Mẹ Linh hand (Right grip) -->
                <rect x="96" y="-12" width="22" height="24" rx="8" fill="#FEE2D1" stroke="#E6B8A2" stroke-width="1.5"/>
            </g>
        `;
    } else if (stepCode === 'h5-received') {
        // H5: Bag held securely by Mẹ Linh
        const shiftX = isMeLinhPOV ? bagCenterTableX - 50 : bagCenterTableX + 30;
        bagSvg = `
            <g id="bag-received" transform="translate(${shiftX - 80}, ${bagCenterTableY - 30})">
                <rect x="0" y="20" width="160" height="85" rx="14" fill="#087F8C" stroke="#066772" stroke-width="3"/>
                <rect x="4" y="24" width="152" height="77" rx="10" fill="none" stroke="#8E9B97" stroke-width="2.5"/>
                <path d="M 45 20 C 45 -18, 115 -18, 115 20" fill="none" stroke="#6B7D79" stroke-width="9" stroke-linecap="round"/>
                <rect x="42" y="48" width="76" height="32" rx="6" fill="#FFFFFF" stroke="#087F8C" stroke-width="2"/>
                <text x="80" y="70" font-family="DejaVu Sans, sans-serif" font-size="14" font-weight="bold" fill="#087F8C" text-anchor="middle">MÂY</text>
                
                <!-- Mẹ Linh's holding hands -->
                <rect x="55" y="-10" width="20" height="22" rx="7" fill="#FEE2D1" stroke="#E6B8A2" stroke-width="1.5"/>
                <rect x="85" y="-10" width="20" height="22" rx="7" fill="#FEE2D1" stroke="#E6B8A2" stroke-width="1.5"/>
            </g>
        `;
    }

    // First-person Hands entering from bottom for active POV
    let povHandsSvg = '';
    if (isCoAnPOV && (stepCode === 'h3-ready' || stepCode === 'h4-transfer')) {
        // Cô An hands entering from bottom left (Teal polo sleeve #087F8C)
        povHandsSvg = `
            <g id="pov-coan-arms" opacity="0.96">
                <!-- Left arm -->
                <path d="M 280 720 L 480 480 L 525 510 L 370 720 Z" fill="#087F8C"/>
                <ellipse cx="505" cy="488" rx="24" ry="18" fill="#FDDFCC" stroke="#E6B8A2" stroke-width="2"/>
            </g>
        `;
    } else if (isMeLinhPOV && (stepCode === 'h3-ready' || stepCode === 'h4-transfer' || stepCode === 'h5-received')) {
        // Mẹ Linh hands entering from bottom right (Cream blouse cuff #FEF3C7)
        povHandsSvg = `
            <g id="pov-melinh-arms" opacity="0.96">
                <!-- Right arm -->
                <path d="M 1000 720 L 780 490 L 735 520 L 890 720 Z" fill="#FEF3C7" stroke="#FBE8A6" stroke-width="2"/>
                <ellipse cx="760" cy="500" rx="24" ry="18" fill="#FEE2D1" stroke="#E6B8A2" stroke-width="2"/>
            </g>
        `;
    }

    // Step Watermark / Badge Info in corner
    const roleBadgeTitle = role === 'co-an' ? 'Góc nhìn Cô An (1.55m)' : role === 'me-linh' ? 'Góc nhìn Mẹ Linh (1.60m)' : 'Góc nhìn Bé Mây (0.95m)';
    const stepObj = STEPS.find(s => s.code === stepCode);

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
            <!-- Sunlight Linear Gradient -->
            <linearGradient id="sunlight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFFDF5" stop-opacity="0.9"/>
                <stop offset="60%" stop-color="#FFF9E6" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#FFF9E6" stop-opacity="0.0"/>
            </linearGradient>
            <!-- Wall Gradient -->
            <linearGradient id="wall-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#FBFDFB"/>
                <stop offset="100%" stop-color="#EDF4F0"/>
            </linearGradient>
            <!-- Wood Parquet Floor Gradient -->
            <linearGradient id="floor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ECDDC6"/>
                <stop offset="100%" stop-color="#DCBFA1"/>
            </linearGradient>
        </defs>

        <!-- 1. Background Wall -->
        <rect x="0" y="0" width="1280" height="${deskY + 20}" fill="url(#wall-grad)"/>
        <!-- Baseboard -->
        <rect x="0" y="${deskY + 12}" width="1280" height="12" fill="#D3E0D8"/>

        <!-- 2. Wood Floor with Parquet Lines -->
        <rect x="0" y="${deskY + 24}" width="1280" height="${720 - (deskY + 24)}" fill="url(#floor-grad)"/>
        <g stroke="#CDB093" stroke-width="1.2" opacity="0.6">
            <line x1="0" y1="560" x2="1280" y2="560"/>
            <line x1="0" y1="640" x2="1280" y2="640"/>
            <!-- Vertical parquet seams -->
            <line x1="200" y1="${deskY + 24}" x2="200" y2="560"/>
            <line x1="450" y1="560" x2="450" y2="640"/>
            <line x1="750" y1="${deskY + 24}" x2="750" y2="560"/>
            <line x1="980" y1="560" x2="980" y2="640"/>
            <line x1="1150" y1="${deskY + 24}" x2="1150" y2="560"/>
        </g>

        <!-- 3. Room architectural elements -->
        ${windowSvg}
        ${cubbySvg}
        
        <!-- 4. Characters across table -->
        ${characterSvg}

        <!-- 5. Consultation Desk -->
        ${deskSvg}

        <!-- 6. Handover Bag -->
        ${bagSvg}

        <!-- 7. POV First-person arms/hands -->
        ${povHandsSvg}

        <!-- 8. Subtle Room Info Badge (Top Left) -->
        <g id="info-badge" transform="translate(36, 32)">
            <rect x="0" y="0" width="340" height="52" rx="14" fill="#173F40" fill-opacity="0.88"/>
            <text x="18" y="24" font-family="DejaVu Sans, sans-serif" font-size="13" font-weight="bold" fill="#8CE3CB">R7 · PHÒNG ĐÓN BÉ (HULA-360)</text>
            <text x="18" y="42" font-family="DejaVu Sans, sans-serif" font-size="12" fill="#FFFFFF">${roleBadgeTitle} • ${stepObj.title}</text>
        </g>
    </svg>
    `;
}

async function main() {
    console.log('=== GENERATING 18 CANONICAL R7 ILLUSTRATED SCENES ===\n');

    let count = 0;
    for (const role of ROLES) {
        const roleDir = path.join(OUTPUT_DIR, role);
        if (!fs.existsSync(roleDir)) {
            fs.mkdirSync(roleDir, { recursive: true });
        }

        for (const step of STEPS) {
            const svgContent = generateSceneSvg(role, step.code);
            const svgPath = path.join(roleDir, `${step.code}.svg`);
            const webpPath = path.join(roleDir, `${step.code}.webp`);

            fs.writeFileSync(svgPath, svgContent, 'utf-8');

            // Render crisp 1280x720 WebP
            await sharp(Buffer.from(svgContent))
                .resize(1280, 720)
                .webp({ quality: 92 })
                .toFile(webpPath);

            count++;
            console.log(`✓ [${count}/18] Generated: r7/${role}/${step.code}.webp (1280x720)`);
        }
    }

    console.log(`\n🎉 Successfully generated all 18 R7 Illustrated Scenes in: ${OUTPUT_DIR}`);
}

main().catch(err => {
    console.error('Error generating scenes:', err);
    process.exit(1);
});
