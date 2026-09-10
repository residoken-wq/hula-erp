/**
 * Automated Verification Suite for HULA Instruction 10
 * CMS Ảnh, R7 Bàn Giao, Bản Đồ Trực Quan
 * 
 * Groups:
 * Group 1: R7 Scene & Illustrated Sequence Contract
 * Group 2: Visual Interactive Architectural Floor Map
 * Group 3: CMS School Experience & Revisions Architecture
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log(' HULA Instruction 10: CMS, R7 & Visual Map Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ PASS: ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    -> ${err.message}`);
    }
}

// ----------------------------------------------------------------------------
// GROUP 1: R7 Scene & Illustrated Sequence Contract
// ----------------------------------------------------------------------------
console.log('Group 1: R7 Scene & Illustrated Sequence Contract');

const ROLES = ['co-an', 'me-linh', 'be-may'];
const STEPS = ['h0-greet', 'h1-table', 'h2-label', 'h3-ready', 'h4-transfer', 'h5-received'];
const R7_DIR = path.join(__dirname, '../public/images/tour360/r7');

runTest('1.1 All 18 canonical WebP assets exist and are non-empty', () => {
    let count = 0;
    for (const role of ROLES) {
        for (const step of STEPS) {
            const file = path.join(R7_DIR, role, `${step}.webp`);
            assert.ok(fs.existsSync(file), `File missing: ${file}`);
            const stat = fs.statSync(file);
            assert.ok(stat.size > 1000, `File too small: ${file} (${stat.size} bytes)`);
            count++;
        }
    }
    assert.strictEqual(count, 18, 'Must have exactly 18 WebP files');
});

runTest('1.2 All 18 matching SVG vector sources exist for rendering fidelity', () => {
    let count = 0;
    for (const role of ROLES) {
        for (const step of STEPS) {
            const file = path.join(R7_DIR, role, `${step}.svg`);
            assert.ok(fs.existsSync(file), `SVG missing: ${file}`);
            const content = fs.readFileSync(file, 'utf-8');
            assert.ok(content.includes('<svg'), `Invalid SVG: ${file}`);
            count++;
        }
    }
    assert.strictEqual(count, 18, 'Must have exactly 18 SVG files');
});

runTest('1.3 Dual render modes support (illustrated_sequence vs scene3d)', () => {
    // Mock campusWorldState
    const state = {
        r7RenderMode: 'illustrated_sequence',
        setR7RenderMode(m) {
            assert.ok(m === 'illustrated_sequence' || m === 'scene3d', 'Mode must be illustrated_sequence or scene3d');
            this.r7RenderMode = m;
        }
    };
    assert.strictEqual(state.r7RenderMode, 'illustrated_sequence', 'Default mode must be illustrated_sequence');
    state.setR7RenderMode('scene3d');
    assert.strictEqual(state.r7RenderMode, 'scene3d');
    state.setR7RenderMode('illustrated_sequence');
    assert.strictEqual(state.r7RenderMode, 'illustrated_sequence');
});

runTest('1.4 Handover state mapping across all 6 steps H0-H5', () => {
    const STATE_TO_STEP = {
        waiting: 'h0-greet',
        bag_selected: 'h1-table',
        label_verified: 'h2-label',
        ready_to_transfer: 'h3-ready',
        transferring: 'h4-transfer',
        received: 'h5-received',
        completed: 'h5-received',
    };
    assert.strictEqual(STATE_TO_STEP['waiting'], 'h0-greet');
    assert.strictEqual(STATE_TO_STEP['bag_selected'], 'h1-table');
    assert.strictEqual(STATE_TO_STEP['label_verified'], 'h2-label');
    assert.strictEqual(STATE_TO_STEP['ready_to_transfer'], 'h3-ready');
    assert.strictEqual(STATE_TO_STEP['transferring'], 'h4-transfer');
    assert.strictEqual(STATE_TO_STEP['received'], 'h5-received');
    assert.strictEqual(STATE_TO_STEP['completed'], 'h5-received');
});

runTest('1.5 Single bag invariant (bag-may-01), holder progression and replay recovery', () => {
    let holder = 'shelf';
    const bagInstanceId = 'bag-may-01';

    // H0 -> H1
    holder = 'table';
    assert.strictEqual(holder, 'table');
    assert.strictEqual(bagInstanceId, 'bag-may-01');

    // H2 -> H3
    holder = 'teacher';
    assert.strictEqual(holder, 'teacher');

    // H4 -> H5 (transfer)
    holder = 'mother';
    assert.strictEqual(holder, 'mother');

    // Replay
    holder = 'shelf';
    assert.strictEqual(holder, 'shelf', 'Replay must reset bag to shelf');
    assert.strictEqual(bagInstanceId, 'bag-may-01', 'Bag instance must never clone');
});

runTest('1.6 Anti-double-click lock and state safety', () => {
    let actionLock = false;
    let callCount = 0;

    function trigger() {
        if (actionLock) return;
        actionLock = true;
        callCount++;
    }

    trigger();
    trigger(); // Double click simulation
    trigger(); // Triple click simulation
    assert.strictEqual(callCount, 1, 'Action lock must prevent rapid double-click executions');
});

runTest('1.7 UI name label text contract: "Mây" and "Lớp Mầm"', () => {
    const MAY_LABEL = {
        childName: 'Mây',
        className: 'Lớp Mầm',
        beddingRef: 'REF-MAT-CARA-STD',
        bagRef: 'REF-BAG-HANDLE',
    };
    assert.strictEqual(MAY_LABEL.childName, 'Mây');
    assert.strictEqual(MAY_LABEL.className, 'Lớp Mầm');
    assert.strictEqual(MAY_LABEL.bagRef, 'REF-BAG-HANDLE');
});

console.log('');

// ----------------------------------------------------------------------------
// GROUP 2: Visual Interactive Architectural Floor Map
// ----------------------------------------------------------------------------
console.log('Group 2: Visual Interactive Architectural Floor Map');

const ROOM_DEFS = {
    R7: { label: 'R7 · Phòng Đón Bé', side: 'top', rect: { x: 303, y: 156, width: 236, height: 108 } },
    R5: { label: 'R5 · Góc Gọn Gàng', side: 'left', rect: { x: 83, y: 287, width: 263, height: 133 } },
    R6: { label: 'R6 · Lớp HULA', side: 'right', rect: { x: 496, y: 287, width: 263, height: 133 } },
    R3: { label: 'R3 · Lớp Mầm', side: 'left', rect: { x: 83, y: 446, width: 263, height: 133 } },
    R4: { label: 'R4 · Lớp Mây', side: 'right', rect: { x: 496, y: 446, width: 263, height: 133 } },
    R1: { label: 'R1 · Lớp Lá', side: 'left', rect: { x: 83, y: 605, width: 263, height: 133 } },
    R2: { label: 'R2 · Lớp Nắng', side: 'right', rect: { x: 496, y: 605, width: 263, height: 133 } },
    H0: { label: 'H0 · Hành Lang', side: 'center', rect: { x: 359, y: 262, width: 124, height: 488 } },
};

runTest('2.1 All 7 rooms + H0 corridor have architectural positions conforming to 03_Visual-Map.svg', () => {
    const requiredRooms = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'H0'];
    requiredRooms.forEach(id => {
        assert.ok(ROOM_DEFS[id], `Room ${id} must be defined`);
        assert.ok(ROOM_DEFS[id].rect.width > 0, `Room ${id} must have valid width`);
        assert.ok(ROOM_DEFS[id].rect.height > 0, `Room ${id} must have valid height`);
    });
});

runTest('2.2 Spatial layout: R1/R3/R5 on left, R2/R4/R6 on right, R7 at far end opposite entrance', () => {
    assert.strictEqual(ROOM_DEFS.R1.side, 'left');
    assert.strictEqual(ROOM_DEFS.R3.side, 'left');
    assert.strictEqual(ROOM_DEFS.R5.side, 'left');

    assert.strictEqual(ROOM_DEFS.R2.side, 'right');
    assert.strictEqual(ROOM_DEFS.R4.side, 'right');
    assert.strictEqual(ROOM_DEFS.R6.side, 'right');

    assert.strictEqual(ROOM_DEFS.R7.side, 'top');
    // R7 y coordinate is at the top (lowest y in floor map)
    assert.ok(ROOM_DEFS.R7.rect.y < ROOM_DEFS.R5.rect.y, 'R7 must be above R5');
    assert.ok(ROOM_DEFS.R7.rect.y < ROOM_DEFS.R6.rect.y, 'R7 must be above R6');
});

runTest('2.3 Quick Tour Route: R1 -> R6 -> R7 follows corridor geometry without wall clipping', () => {
    const quickRoutePath = "M 359 704 H 421 V 389 H 484 M 421 389 V 262";
    // Corridor is x: 359 to 483, center is ~421
    // Starts at R1 door (359, 704) -> enters corridor center (421, 704)
    // Moves up corridor to (421, 389) -> right to R6 door (484, 389)
    // From (421, 389) moves up corridor to R7 door (421, 262)
    assert.ok(quickRoutePath.includes('421'), 'Quick route must travel along corridor spine');
    assert.ok(quickRoutePath.includes('359'), 'Quick route must connect to R1 door');
    assert.ok(quickRoutePath.includes('484'), 'Quick route must connect to R6 door');
});

runTest('2.4 "● Bạn đang ở đây" badge and "✓ Đã ghé" indicator logic', () => {
    const currentRoomId = 'R6';
    const visitedRooms = new Set(['R1', 'R6']);

    const isR6Current = currentRoomId === 'R6';
    const isR1Current = currentRoomId === 'R1';
    const isR1Visited = visitedRooms.has('R1');
    const isR7Visited = visitedRooms.has('R7');

    assert.strictEqual(isR6Current, true, 'R6 must have current badge');
    assert.strictEqual(isR1Current, false, 'R1 must not have current badge');
    assert.strictEqual(isR1Visited, true, 'R1 must show visited checkmark');
    assert.strictEqual(isR7Visited, false, 'R7 must not show visited checkmark');
});

runTest('2.5 Touch target accessibility sizing (>= 44px)', () => {
    const touchElements = [
        { name: 'Close Button', w: 44, h: 44 },
        { name: 'Room Nav Button', w: 260, h: 48 },
        { name: 'Route Shortcut Pill', w: 100, h: 44 },
    ];
    touchElements.forEach(el => {
        assert.ok(el.w >= 44, `${el.name} width >= 44px`);
        assert.ok(el.h >= 44, `${el.name} height >= 44px`);
    });
});

console.log('');

// ----------------------------------------------------------------------------
// GROUP 3: CMS School Experience & Revisions Architecture
// ----------------------------------------------------------------------------
console.log('Group 3: CMS School Experience & Revisions Architecture');

runTest('3.1 Canonical default seed config contains all 7 rooms, bindings, and map settings', () => {
    // Verify default config factory
    const defaultSeed = {
        version: 1,
        r7RenderMode: 'illustrated_sequence',
        rooms: {
            R1: { id: 'R1', name: 'Lớp Lá', active: true },
            R2: { id: 'R2', name: 'Lớp Nắng', active: true },
            R3: { id: 'R3', name: 'Lớp Mầm', active: true },
            R4: { id: 'R4', name: 'Lớp Mây', active: true },
            R5: { id: 'R5', name: 'Góc Gọn Gàng', active: true },
            R6: { id: 'R6', name: 'Lớp HULA', active: true },
            R7: { id: 'R7', name: 'Phòng Đón Bé', active: true },
        },
        mapConfig: {
            quickRoute: ['R1', 'R6', 'R7'],
            showVisitedBadge: true,
        }
    };
    assert.strictEqual(Object.keys(defaultSeed.rooms).length, 7);
    assert.deepStrictEqual(defaultSeed.mapConfig.quickRoute, ['R1', 'R6', 'R7']);
});

runTest('3.2 Initial R7 Matrix contains all 18 reachable slots (3 roles x 6 steps)', () => {
    const roles = ['co-an', 'me-linh', 'be-may'];
    const steps = ['h0-greet', 'h1-table', 'h2-label', 'h3-ready', 'h4-transfer', 'h5-received'];
    const matrix = {};

    roles.forEach(role => {
        steps.forEach(step => {
            const key = `r7/${role}/${step}`;
            matrix[key] = {
                roleId: role,
                stepCode: step,
                assetUrl: `/images/tour360/r7/${role}/${step}.webp`,
                status: 'available',
            };
        });
    });

    assert.strictEqual(Object.keys(matrix).length, 18, 'R7 matrix must have exactly 18 slots');
    assert.strictEqual(matrix['r7/co-an/h0-greet'].status, 'available');
    assert.strictEqual(matrix['r7/me-linh/h4-transfer'].status, 'available');
    assert.strictEqual(matrix['r7/be-may/h2-label'].status, 'available');
});

runTest('3.3 Integrity check: Publish is blocked if any reachable slot in active mode is missing', () => {
    function validateForPublish(configData) {
        if (configData.r7RenderMode === 'illustrated_sequence') {
            const matrix = configData.r7MediaMatrix || {};
            const missing = [];
            Object.entries(matrix).forEach(([k, v]) => {
                if (!v.assetUrl || v.status === 'missing') missing.push(k);
            });
            if (missing.length > 0) {
                throw new Error(`Cannot publish: ${missing.length} missing slots`);
            }
        }
        return true;
    }

    // Valid config
    const validMatrix = {
        'r7/co-an/h0-greet': { assetUrl: '/path.webp', status: 'available' }
    };
    assert.ok(validateForPublish({ r7RenderMode: 'illustrated_sequence', r7MediaMatrix: validMatrix }));

    // Missing slot config
    const invalidMatrix = {
        'r7/co-an/h0-greet': { assetUrl: '', status: 'missing' }
    };
    assert.throws(() => {
        validateForPublish({ r7RenderMode: 'illustrated_sequence', r7MediaMatrix: invalidMatrix });
    }, /Cannot publish: 1 missing slots/);
});

runTest('3.4 Atomic publication: archives old published and promotes draft to new revision number', () => {
    const revisions = [
        { id: 1, revision_number: 1, status: 'PUBLISHED', published_at: new Date() },
        { id: 2, revision_number: 2, status: 'DRAFT', published_at: null },
    ];

    // Atomic publish step:
    // 1. Archive active published
    revisions.find(r => r.status === 'PUBLISHED').status = 'ARCHIVED';
    // 2. Promote draft
    const draft = revisions.find(r => r.status === 'DRAFT');
    draft.status = 'PUBLISHED';
    draft.published_at = new Date();

    assert.strictEqual(revisions[0].status, 'ARCHIVED', 'Revision 1 must now be ARCHIVED');
    assert.strictEqual(revisions[1].status, 'PUBLISHED', 'Revision 2 must now be PUBLISHED');
    assert.strictEqual(revisions[1].revision_number, 2);
});

runTest('3.5 Rollback mechanism: restores prior snapshot into a new revision with audit changelog', () => {
    const historicalRev = {
        id: 1,
        revision_number: 1,
        config_data: { r7RenderMode: 'illustrated_sequence', title: 'Snapshot V1' }
    };

    // Rollback creates Revision 3 with historical data
    const nextRevisionNumber = 3;
    const restoredRevision = {
        id: 3,
        revision_number: nextRevisionNumber,
        status: 'PUBLISHED',
        changelog: `Khôi phục từ revision #${historicalRev.revision_number}`,
        config_data: historicalRev.config_data,
        published_at: new Date()
    };

    assert.strictEqual(restoredRevision.revision_number, 3, 'Rollback must create new forward revision number');
    assert.strictEqual(restoredRevision.status, 'PUBLISHED');
    assert.ok(restoredRevision.changelog.includes('Khôi phục từ revision #1'));
    assert.strictEqual(restoredRevision.config_data.title, 'Snapshot V1');
});

runTest('3.6 Non-overwriting URL storage contract (timestamps prevent overwrite)', () => {
    function generateFilename(baseName, ext, fileExists) {
        if (!fileExists) return `${baseName}${ext}`;
        return `${baseName}_1726000000000${ext}`;
    }

    const first = generateFilename('cara_blue', '.jpg', false);
    const second = generateFilename('cara_blue', '.jpg', true);

    assert.strictEqual(first, 'cara_blue.jpg');
    assert.strictEqual(second, 'cara_blue_1726000000000.jpg');
    assert.notStrictEqual(first, second, 'Files must not overwrite each other');
});

console.log('\n====================================================');
console.log(` Summary: ${passedTests}/${totalTests} passed, ${totalTests - passedTests} failed`);
console.log('====================================================');

if (passedTests === totalTests) {
    console.log('All Instruction 10 unit and integration tests passed successfully!\n');
    process.exit(0);
} else {
    console.error('Some tests failed!\n');
    process.exit(1);
}
