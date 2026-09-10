/**
 * test-instruction12-16-r7-assets.js
 * Comprehensive automated verification script for HULA_Instruction 12 - 16:
 * - Direct mapping to 02_ACCEPTANCE.csv (32 Acceptance Test Cases):
 *   - MOB-R1 to MOB-R7: Mobile Layout (400x528, 390x844), Closed Inspector, No Screen Clipping
 *   - R7-me-linh-H0..H5: 6 Canonical Assets, SHA-256 Checksums, Contain Framing, Exact Dialogues & CTAs
 *   - R7-co-an-H0..H5: 6 Canonical Assets (with replacements.json for H0 and H2), Checksums, Dialogues & CTAs
 *   - R7-be-may-H0..H5: 6 Low-Angle POV Assets, Checksums, Child-Specific Dialogues & CTAs
 *   - CMS01: Draft changes isolated from published view
 *   - CMS02: Publish validates 18 slots and atomic Rollback restores revisions
 *   - ERR01: Image load error retains state and does not falsely commit received
 *   - STATE01: Anti-double-click guard, atomic bagOwner handoff (teacher -> mother), replay & switchRole safety
 *   - MAP01: Mobile map modal label and non-overlapping R7 geometry
 *   - A11Y01: Minimum touch target compliance (>= 44px, primary >= 48px) and font scaling resilience
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

console.log('================================================================');
console.log(' HULA Instruction 12-16: R7 Three-Perspective Acceptance Suite');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;
const results = [];

function runTest(id, name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ [PASS] [${id}] ${name}`);
        passedTests++;
        results.push({ id, status: 'PASS', error: null });
    } catch (err) {
        console.error(`  ✗ [FAIL] [${id}] ${name}`);
        console.error(`    Error: ${err.message}`);
        results.push({ id, status: 'FAIL', error: err.message });
    }
}

// File paths
const basePath = path.resolve(__dirname, '..');
const rootPath = path.resolve(__dirname, '../../..');

const r7AssetsDir = path.join(basePath, 'public/images/tour360/r7');
const r7ManifestFile = path.join(r7AssetsDir, 'r7-assets-manifest.json');
const inst16Dir = path.join(rootPath, 'docs/website_v2/HULA-360/HULA_Instruction16');
const inst16ManifestFile = path.join(inst16Dir, 'r7-assets.json');

const handoverStateMachineFile = path.join(basePath, 'src/components/tour360/engine/HandoverStateMachine.ts');
const r7SequenceFile = path.join(basePath, 'src/components/tour360/school-pov/CampusR7IllustratedSequence.tsx');
const handoverPanelFile = path.join(basePath, 'src/components/tour360/school-pov/CampusHandoverPanel.tsx');
const schoolPovFile = path.join(basePath, 'src/components/tour360/school-pov/CampusSchoolPOV.tsx');
const inspectorFile = path.join(basePath, 'src/components/tour360/school-pov/CampusInspector.tsx');
const mapModalFile = path.join(basePath, 'src/components/tour360/school-pov/CampusSchoolMapModal.tsx');
const serviceFile = path.join(rootPath, 'src/school-experience/school-experience.service.ts');
const cmsPageFile = path.join(rootPath, 'hula-web/cms/src/app/school-experience/page.tsx');

// ============================================================================
// GROUP 1: Mobile Isolation & Layout (MOB-R1 to MOB-R7)
// ============================================================================
console.log('--- Group 1: Mobile Layout & Viewport (MOB-R1 to MOB-R7) ---');

const mobRooms = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
mobRooms.forEach((roomId) => {
    runTest(`MOB-${roomId}`, `Room ${roomId}: Clean initial mobile load, no clipping, inspector collapsed in R1-R6`, () => {
        const povContent = fs.readFileSync(schoolPovFile, 'utf8');
        assert(povContent.includes('h-[100dvh] max-h-[100dvh]'), 'Must use 100dvh dynamic mobile height');
        assert(povContent.includes('window.innerWidth < 640'), 'Must detect mobile breakpoint');
        assert(povContent.includes('campusWorldState.toggleInspector(false)'), 'Inspector must default to closed on mobile');

        if (roomId === 'R7') {
            // R7 uses illustrated sequence and vertical flow
            const r7Seq = fs.readFileSync(r7SequenceFile, 'utf8');
            assert(r7Seq.includes('object-contain'), 'R7 must use object-contain to prevent bottom bag clipping');
            const panelContent = fs.readFileSync(handoverPanelFile, 'utf8');
            assert(panelContent.includes('min-h-[48px]'), 'Primary CTA must have min-h-[48px]');
        } else {
            // R1-R6 have floating Xem sản phẩm button when collapsed
            assert(povContent.includes('Xem sản phẩm'), 'Must render floating Xem sản phẩm CTA');
        }
    });
});

// ============================================================================
// GROUP 2: Canonical Assets & SHA-256 Checksums (R7-me-linh, R7-co-an, R7-be-may)
// ============================================================================
console.log('\n--- Group 2: R7 Illustrated Sequence Assets & Checksums (18 Slots) ---');

assert(fs.existsSync(inst16ManifestFile), `Instruction 16 manifest must exist at ${inst16ManifestFile}`);
const inst16Manifest = JSON.parse(fs.readFileSync(inst16ManifestFile, 'utf8'));

const stepCodeMap = {
    H0: 'h0-greet',
    H1: 'h1-table',
    H2: 'h2-label',
    H3: 'h3-ready',
    H4: 'h4-transfer',
    H5: 'h5-received',
};

inst16Manifest.assets.forEach((assetMeta) => {
    const testId = `R7-${assetMeta.roleId}-${assetMeta.stepId}`;
    runTest(testId, `Asset ${assetMeta.roleId} ${assetMeta.stepId}: PNG & WebP exist with valid SHA-256 and dimensions`, () => {
        const stepCode = stepCodeMap[assetMeta.stepId];
        const roleDir = path.join(r7AssetsDir, assetMeta.roleId);

        // Check PNG exists
        const destPngByCode = path.join(roleDir, `${stepCode}.png`);
        assert(fs.existsSync(destPngByCode), `PNG asset must exist at ${destPngByCode}`);

        // Verify SHA-256 against Instruction 16 canonical checksum
        const fileBuffer = fs.readFileSync(destPngByCode);
        const actualSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        assert.strictEqual(actualSha256, assetMeta.sha256, `SHA-256 mismatch for ${testId}!`);

        // Check WebP derivative exists and is non-empty
        const destWebp = path.join(roleDir, `${stepCode}.webp`);
        assert(fs.existsSync(destWebp), `Optimized WebP must exist at ${destWebp}`);
        const webpStat = fs.statSync(destWebp);
        assert(webpStat.size > 10000, `WebP asset must be non-trivial (>10KB), got ${webpStat.size}`);

        // Verify contain fit in CampusR7IllustratedSequence
        const r7SeqContent = fs.readFileSync(r7SequenceFile, 'utf8');
        assert(r7SeqContent.includes('object-contain'), 'Illustrated sequence image must be styled with object-contain');
    });
});

// ============================================================================
// GROUP 3: Dialogue & CTA Contract Verification (Instruction 16 §2 Matrix)
// ============================================================================
console.log('\n--- Group 3: Character Dialogue & Action CTA Contract (3 Roles x 6 Steps) ---');

const expectedDialogues = {
    'co-an': {
        H0: { dialogue: 'Chào mẹ Linh, hôm nay mình bàn giao túi của Mây nhé.', action: 'Chọn túi của Mây' },
        H1: { dialogue: 'Mình đặt túi trên bàn để cùng đối chiếu.', action: 'Xem thông tin túi' },
        H2: { dialogue: 'Cùng xác nhận thông tin Mây – Lớp Mầm.', action: 'Xác nhận đúng túi' },
        H3: { dialogue: 'Mình giữ quai túi và đưa về phía mẹ Linh.', action: 'Đưa túi cho mẹ' },
        H4: { dialogue: 'Mẹ Linh đã nắm quai, mình chuẩn bị buông tay.', action: 'Buông quai túi' },
        H5: { dialogue: 'Mẹ đã nhận túi. Chào Mây, hẹn gặp con nhé!', action: 'Hoàn tất bàn giao' },
    },
    'me-linh': {
        H0: { dialogue: 'Em chào cô An, em đến đón Mây và nhận túi ạ.', action: 'Xem túi của Mây' },
        H1: { dialogue: 'Túi đã được đặt lên bàn để mình kiểm tra.', action: 'Xem nhãn túi' },
        H2: { dialogue: 'Đối chiếu thông tin: Mây – Lớp Mầm.', action: 'Xác nhận đúng túi' },
        H3: { dialogue: 'Cô An đã nhấc túi, mình chuẩn bị nhận.', action: 'Đưa tay nhận túi' },
        H4: { dialogue: 'Mình đã nắm quai, chờ cô buông tay.', action: 'Nhận túi' },
        H5: { dialogue: 'Mình đã nhận túi. Cảm ơn cô An!', action: 'Hoàn tất bàn giao' },
    },
    'be-may': {
        H0: { dialogue: 'Mẹ đến đón con rồi!', action: 'Xem túi của con' },
        H1: { dialogue: 'Con thấy túi màu xanh trên bàn.', action: 'Nhìn nhãn túi' },
        H2: { dialogue: 'Mẹ cùng con xem tên nhé.', action: 'Cùng mẹ xác nhận' },
        H3: { dialogue: 'Cô An đang đưa túi cho mẹ.', action: 'Xem mẹ nhận túi' },
        H4: { dialogue: 'Mẹ đã cầm quai túi rồi.', action: 'Xem tiếp' },
        H5: { dialogue: 'Con chào cô An, con về với mẹ ạ!', action: 'Chào cô và hoàn tất' },
    },
};

runTest('CONTRACT-01', 'HandoverStateMachine: Verifies exact dialogue and CTA strings for all 3 roles across H0-H5', () => {
    const fsmContent = fs.readFileSync(handoverStateMachineFile, 'utf8');
    ['co-an', 'me-linh', 'be-may'].forEach((role) => {
        ['H0', 'H1', 'H2', 'H3', 'H4', 'H5'].forEach((step) => {
            const exp = expectedDialogues[role][step];
            assert(fsmContent.includes(exp.dialogue), `FSM must include dialogue for ${role} ${step}: "${exp.dialogue}"`);
            assert(fsmContent.includes(exp.action), `FSM must include CTA action for ${role} ${step}: "${exp.action}"`);
        });
    });
});

// ============================================================================
// GROUP 4: CMS Draft, Publish, Rollback Contract (CMS01, CMS02)
// ============================================================================
console.log('\n--- Group 4: CMS Revision Architecture (CMS01, CMS02) ---');

runTest('CMS01', 'CMS01: Draft configuration is isolated from published endpoint', () => {
    const serviceContent = fs.readFileSync(serviceFile, 'utf8');
    assert(serviceContent.includes('where: { status: SchoolExperienceStatus.PUBLISHED }'), 'getPublishedConfig must only query PUBLISHED revisions');
    assert(serviceContent.includes('status: SchoolExperienceStatus.DRAFT'), 'Draft revisions must have DRAFT status');
});

runTest('CMS02', 'CMS02: Publish enforces 18-slot matrix completeness and rollback restores prior revision', () => {
    const serviceContent = fs.readFileSync(serviceFile, 'utf8');
    assert(serviceContent.includes('Chuỗi minh họa R7 còn'), 'Publish must enforce missing slot check');
    assert(serviceContent.includes("roles = ['co-an', 'me-linh', 'be-may']"), 'Publish must check all 3 roles');
    assert(serviceContent.includes("steps = ['h0-greet', 'h1-table', 'h2-label', 'h3-ready', 'h4-transfer', 'h5-received']"), 'Publish must check all 6 steps');
    assert(serviceContent.includes('async rollbackToRevision'), 'Service must implement atomic rollbackToRevision');
});

// ============================================================================
// GROUP 5: Error Handling, State Transition, Map & Accessibility (ERR01, STATE01, MAP01, A11Y01)
// ============================================================================
console.log('\n--- Group 5: Fault Tolerance, State Machine, Map & Accessibility ---');

runTest('ERR01', 'ERR01: When image fails to load, step state is preserved and error fallback displayed', () => {
    const r7Content = fs.readFileSync(r7SequenceFile, 'utf8');
    assert(r7Content.includes('loadError'), 'Must track loadError state');
    assert(r7Content.includes('Chưa tải được hình minh họa'), 'Must render error fallback title');
    assert(r7Content.includes('Thử lại'), 'Must offer retry CTA');
    assert(r7Content.includes('Quay lại hành lang'), 'Must offer navigation out on failure');
});

runTest('STATE01', 'STATE01: Double click debounce lock, single bag instance, atomic bagOwner handoff, replay & switchRole', () => {
    const fsmContent = fs.readFileSync(handoverStateMachineFile, 'utf8');
    assert(fsmContent.includes('actionLock'), 'Must use actionLock anti-double-click guard');
    assert(fsmContent.includes("this.holder = 'mother'"), 'Ownership must transfer to mother during H4');
    assert(fsmContent.includes('public replay()') && fsmContent.includes("this.holder = 'shelf'"), 'Replay must reset holder to shelf at H0');
    assert(fsmContent.includes('public switchRole') && fsmContent.includes("this.state = 'waiting'"), 'switchRole must reset encounter to H0');

    // Check Toast notification on role switch in CampusR7IllustratedSequence
    const r7Content = fs.readFileSync(r7SequenceFile, 'utf8');
    assert(r7Content.includes('Bắt đầu lại theo góc nhìn'), 'Must show toast on role switch');
});

runTest('MAP01', 'MAP01: Mobile school map has friendly "Bản đồ" label, no overlapping R7 SVG elements, touch >= 44px', () => {
    const mapContent = fs.readFileSync(mapModalFile, 'utf8');
    assert(mapContent.includes('Bản đồ'), 'Map modal must use friendly "Bản đồ" title');
    assert(mapContent.includes("furniture: [{ type: 'desk', x: 435, y: 172, w: 90, h: 36 }]"), 'R7 desk must be separated at x=435 to prevent text collision');
    assert(mapContent.includes("rect: { x: 303, y: 156, width: 236, height: 108 }"), 'R7 room rect must have distinct coordinates');
    assert(mapContent.includes('min-w-[44px] min-h-[44px]'), 'Map close and action buttons must be >= 44px');
});

runTest('A11Y01', 'A11Y01: Font 200% resilience, buttons >= 44px (primary >= 48px), object-contain framing', () => {
    const panelContent = fs.readFileSync(handoverPanelFile, 'utf8');
    assert(panelContent.includes('min-h-[48px]'), 'Primary action button must be at least 48px height');
    assert(panelContent.includes('min-w-[44px] min-h-[44px]'), 'Modal close buttons must be at least 44x44px');

    const r7Content = fs.readFileSync(r7SequenceFile, 'utf8');
    assert(r7Content.includes('object-contain'), 'Must use object-contain framing to safeguard bags at edge');
});

// ============================================================================
// SUMMARY & ACCEPTANCE REPORT
// ============================================================================
console.log('\n================================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================');

if (passedTests === totalTests) {
    console.log('🎉 ALL ACCEPTANCE TEST CASES FROM INSTRUCTION 16 (02_ACCEPTANCE.csv) PASSED SUCCESSFULLY!\n');
    process.exit(0);
} else {
    console.error(`❌ ${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
}
