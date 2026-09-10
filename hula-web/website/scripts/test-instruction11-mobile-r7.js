/**
 * test-instruction11-mobile-r7.js
 * Comprehensive automated verification script for HULA_Instruction11:
 * - Shared Mobile 2-Row Header (< 640px) vs Desktop Single Row (>= 640px)
 * - Touch Targets >= 44x44px (CTAs >= 48px)
 * - Mobile Inspector Closed by Default in R1-R6 + Floating "Xem sản phẩm" CTA
 * - Bottom Sheet Single Scroll & Flex-Wrap Swatches (No Truncation)
 * - Single Overlay Manager (Map/Role modal exclusivity & canvas touch lock)
 * - R7 (Phòng Đón Bé) Desktop Split (340px right panel) vs Mobile Vertical Flow
 * - R7 Step Format ("Bước X/6 · [Tên bước]"), Navigation (‹ Trước / Chi tiết / Tiếp ›)
 * - Removal of Mysterious 7 Dots, 2 Duplicate Black Badges, Center Crosshairs
 * - Map Modal: "Bản đồ" Label, No Overlapping R7 SVG Elements, Zero Customer REF Codes
 * - CMS R7 Safe Area Bounds & Mobile Crop Simulator (400x528, 390x844)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING HULA INSTRUCTION 11 TEST SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(`    Error: ${err.message}`);
    }
}

// File paths
const basePath = path.resolve(__dirname, '..');
const headerFile = path.join(basePath, 'src/components/tour360/school-pov/CampusTopHeader.tsx');
const povFile = path.join(basePath, 'src/components/tour360/school-pov/CampusSchoolPOV.tsx');
const inspectorFile = path.join(basePath, 'src/components/tour360/school-pov/CampusInspector.tsx');
const handoverFile = path.join(basePath, 'src/components/tour360/school-pov/CampusHandoverPanel.tsx');
const r7SequenceFile = path.join(basePath, 'src/components/tour360/school-pov/CampusR7IllustratedSequence.tsx');
const mapModalFile = path.join(basePath, 'src/components/tour360/school-pov/CampusSchoolMapModal.tsx');
const stateMachineFile = path.join(basePath, 'src/components/tour360/engine/HandoverStateMachine.ts');

const rootPath = path.resolve(__dirname, '../../..');
const cmsPageFile = path.join(rootPath, 'hula-web/cms/src/app/school-experience/page.tsx');
const serviceFile = path.join(rootPath, 'src/school-experience/school-experience.service.ts');
const entityFile = path.join(rootPath, 'src/school-experience/entities/school-experience-revision.entity.ts');

// 1. CampusTopHeader Tests
runTest('CampusTopHeader: Implements 2-row mobile layout (< 640px) with Room Title and Close on Row 1, Role and Map on Row 2', () => {
    const content = fs.readFileSync(headerFile, 'utf8');
    assert(content.includes('flex sm:hidden flex-col py-2 gap-2'), 'Must have mobile 2-row container with sm:hidden');
    assert(content.includes('hidden sm:flex h-16 items-center justify-between'), 'Must have desktop single-row container with hidden sm:flex');
    assert(content.includes('currentRoom.title'), 'Must display room title in header');
    assert(content.includes('Bản đồ'), 'Must use user-friendly "Bản đồ" label');
    // Check touch targets >= 44x44
    assert(content.includes('min-w-[44px] min-h-[44px]'), 'Buttons must meet 44x44px minimum touch target');
});

// 2. CampusSchoolPOV Tests
runTest('CampusSchoolPOV: Dynamic 100dvh viewport and mobile closed inspector initialization', () => {
    const content = fs.readFileSync(povFile, 'utf8');
    assert(content.includes('h-[100dvh] max-h-[100dvh]'), 'Viewport must use dynamic 100dvh');
    assert(content.includes('pb-[env(safe-area-inset-bottom)]'), 'Must handle safe-area bottom inset');
    assert(content.includes('window.innerWidth < 640') && content.includes('campusWorldState.toggleInspector(false)'), 'Inspector must default to closed on mobile');
});

runTest('CampusSchoolPOV: Single Overlay Manager locks canvas touch and ensures modal exclusivity', () => {
    const content = fs.readFileSync(povFile, 'utf8');
    assert(content.includes('isMapOpen || isRoleSelectorOpen'), 'Overlay manager must track active modals');
    assert(content.includes('pointer-events-none'), 'Canvas touch events must be locked when modal is open');
    assert(content.includes('campusWorldState.toggleInspector(false)'), 'Opening map or role modal must close inspector');
});

runTest('CampusSchoolPOV: Floating "Xem sản phẩm" bottom control bar when inspector is collapsed in R1-R6', () => {
    const content = fs.readFileSync(povFile, 'utf8');
    assert(content.includes('Xem sản phẩm'), 'Must render "Xem sản phẩm" CTA button');
    assert(content.includes('min-h-[44px]'), 'Xem sản phẩm button must have min-h-[44px]');
    assert(content.includes('sm:hidden absolute bottom-4'), 'Must be positioned at bottom on mobile');
});

// 3. CampusInspector Tests
runTest('CampusInspector: Bottom sheet on mobile with fixed sticky header and drag indicator', () => {
    const content = fs.readFileSync(inspectorFile, 'utf8');
    assert(content.includes('rounded-t-3xl sm:rounded-none'), 'Must be rounded top sheet on mobile');
    assert(content.includes('max-h-[85dvh]'), 'Must restrict max height on mobile to 85dvh');
    assert(content.includes('w-12 h-1.5 rounded-full bg-[#DDE5E1] mx-auto mb-3 sm:hidden'), 'Must have mobile drag bar affordance');
    assert(content.includes('sticky top-0 z-10'), 'Header must be sticky at top of sheet');
});

runTest('CampusInspector: Single scroll container and flex-wrap color swatches with full labels', () => {
    const content = fs.readFileSync(inspectorFile, 'utf8');
    assert(content.includes('flex-1 overflow-y-auto min-h-0'), 'Must have single scroll container');
    assert(content.includes('flex flex-wrap gap-2'), 'Swatches must flex-wrap');
    assert(content.includes('min-w-[92px]'), 'Swatches must have min-w to prevent label truncation');
    assert(content.includes('pb-[calc(1.5rem+env(safe-area-inset-bottom))]'), 'Must have safe-area padding at bottom');
});

// 4. R7 Split Layout & Handover Panel Tests
runTest('CampusSchoolPOV & CampusHandoverPanel: R7 Desktop Split (340px right panel) vs Mobile Vertical Flow', () => {
    const povContent = fs.readFileSync(povFile, 'utf8');
    const handoverContent = fs.readFileSync(handoverFile, 'utf8');

    assert(povContent.includes('flex flex-col lg:flex-row'), 'R7 must use flex-col on mobile and flex-row on desktop');
    assert(povContent.includes('lg:w-[340px]'), 'R7 desktop right panel must be 340px');
    // Ensure no absolute floating overlay card covering the screen
    assert(!handoverContent.includes('absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%]'), 'Old floating center card must be eliminated');
    assert(handoverContent.includes('w-full h-full p-4 sm:p-5 flex flex-col justify-between'), 'Must fill its designated panel container');
});

runTest('CampusHandoverPanel: Step format "Bước X/6 · [Tên bước]", primary CTA >= 48px, step navigation (‹ Trước / Chi tiết / Tiếp ›)', () => {
    const content = fs.readFileSync(handoverFile, 'utf8');
    assert(content.includes('Bước {stepNumber}/6 · {stepMeta.stepTitle}'), 'Must format step title as "Bước X/6 · [Tên bước]"');
    assert(content.includes('min-h-[48px]'), 'Primary action CTA must have minimum height 48px');
    assert(content.includes('‹ Trước'), 'Must have "‹ Trước" back button');
    assert(content.includes('Chi tiết nhãn đồ'), 'Must have "Chi tiết" inspection button');
    assert(content.includes('Tiếp ›'), 'Must have "Tiếp ›" button');
    // Check that mysterious 7 dots are gone
    assert(!content.includes('w-2.5 h-2.5 rounded-full transition-all'), 'Mysterious dots must be replaced with clean progress bar');
    assert(content.includes('grid grid-cols-6 gap-1 w-full h-1.5'), 'Must use 6-segment progress bar');
});

runTest('CampusR7IllustratedSequence: Removes center crosshair dot and duplicate corner badges, anchors label on bag', () => {
    const content = fs.readFileSync(r7SequenceFile, 'utf8');
    // Crosshair button removed
    assert(!content.includes('animate-ping absolute'), 'Center crosshair ping animation must be removed');
    assert(!content.includes('Thông tin túi nệm của bé Mây'), 'Crosshair button must be removed');
    // Duplicate corner banners removed
    assert(!content.includes('Minh họa tương tác (Illustrated Sequence)'), 'Duplicate black corner banner must be removed');
    // UI Label anchored properly on bag
    assert(content.includes('top-[62%]') || content.includes('top-[65%]'), 'Label must be anchored on the lower bag area, not adult faces');
    assert(content.includes('MAY_HANDOVER_LABEL.childName'), 'Must render name label cleanly');
});

// 5. CampusSchoolMapModal Tests
runTest('CampusSchoolMapModal: Replaces "Mặt bằng SVG" with "Bản đồ", separates R7 SVG coordinates, eliminates REF codes from cards', () => {
    const content = fs.readFileSync(mapModalFile, 'utf8');
    assert(content.includes('>Bản đồ<') || content.includes('Bản đồ'), 'Toggle button must be labeled "Bản đồ"');
    assert(!content.includes('>Mặt bằng SVG<'), 'Technical "Mặt bằng SVG" label must be removed');
    // R7 furniture coordinates
    assert(content.includes('furniture: [{ type: \'desk\', x: 435, y: 172, w: 90, h: 36 }]'), 'R7 desk must be positioned at x=435 to prevent text collision');
    // Customer card badge
    assert(content.includes('{selectedDef.subLabel}'), 'Customer card must show user-friendly subLabel');
    assert(!content.includes('{selectedDef.productCode}'), 'Customer card must not show technical REF codes');
});

// 6. CMS & Backend Tests
runTest('SchoolExperienceRevision Entity & Service: Schema contains R7 bounds and mobile URLs, validates on publish', () => {
    const entityContent = fs.readFileSync(entityFile, 'utf8');
    const serviceContent = fs.readFileSync(serviceFile, 'utf8');

    assert(entityContent.includes('mediaDesktopUrl?: string'), 'Entity must support mediaDesktopUrl');
    assert(entityContent.includes('mediaMobileUrl?: string'), 'Entity must support mediaMobileUrl');
    assert(entityContent.includes('focalPoint?: [number, number]'), 'Entity must support focalPoint');
    assert(entityContent.includes('actionBounds?: { x: number; y: number; width: number; height: number }'), 'Entity must support actionBounds');
    assert(entityContent.includes('faceBounds?: { x: number; y: number; width: number; height: number }'), 'Entity must support faceBounds');

    assert(serviceContent.includes('mediaDesktopUrl: `/images/tour360/r7/${role}/${step}.webp`'), 'Service must initialize mediaDesktopUrl');
    assert(serviceContent.includes('Tọa độ vùng an toàn di động không hợp lệ'), 'Service must validate bounds coordinates on publish');
});

runTest('CMS School Experience Page: Includes R7 safe area editor modal and interactive mobile preview (400x528, 390x844)', () => {
    const content = fs.readFileSync(cmsPageFile, 'utf8');
    assert(content.includes('Vùng an toàn & Mobile'), 'CMS must have button to open R7 bounds modal');
    assert(content.includes('Cấu Hình Vùng An Toàn & Xem Trước Di Động'), 'Must have R7 safe area modal title');
    assert(content.includes('mobile_compact') && content.includes('400×528'), 'Must support 400x528 compact preview');
    assert(content.includes('mobile_standard') && content.includes('390×844'), 'Must support 390x844 standard preview');
    assert(content.includes('Cảnh báo cắt xén trên di động'), 'Must display mobile crop warning when bounds near border');
    assert(!content.includes('Cấu hình Tuyến khám phá nhanh & Mặt bằng SVG'), 'Technical label in alert must be cleaned up');
});

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);

if (passedTests !== totalTests) {
    process.exit(1);
}
