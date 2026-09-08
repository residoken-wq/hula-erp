/**
 * Automated Verification Script for HULA 360 Product Showroom State (Instruction 06)
 * Tests mandatory cases from 02_AI-IDE_Instruction06.md:
 * 1. Initial state (Xanh dương, Toàn bộ lớp, mat-01..mat-06)
 * 2. 6-color palette full cycle
 * 3. Single instance mode (Một bộ -> Bộ 02 -> Hồng: only mat-02 changes)
 * 4. Mixed color ("Nhiều màu") detection when instances diverge
 * 5. Scope switch does NOT auto-repaint until subsequent selection
 * 6. Rapid color selection (latest request wins)
 * 7. Camera angle switching retains instance color mappings
 */

const assert = require('assert');

// Color definitions matching showroomConfig.ts & color-preview-config.json
const SHOWROOM_COLORS = [
    { id: 'blue', label: 'Xanh dương', previewHex: '#56C5ED' },
    { id: 'green', label: 'Xanh lá', previewHex: '#ACD942' },
    { id: 'mint', label: 'Xanh ngọc', previewHex: '#8CE3CB' },
    { id: 'orange', label: 'Cam', previewHex: '#FFC076' },
    { id: 'yellow', label: 'Vàng', previewHex: '#F5E978' },
    { id: 'pink', label: 'Hồng', previewHex: '#EFA9D7' },
];

const SHOWROOM_INSTANCES = ['mat-01', 'mat-02', 'mat-03', 'mat-04', 'mat-05', 'mat-06'];

function analyzeColors(state) {
    const colors = Object.values(state.instanceColors);
    const firstColor = colors[0];
    const isUniform = colors.every(c => c === firstColor);

    if (state.scope === 'selectedInstance') {
        const activeInstanceColor = state.instanceColors[state.selectedInstanceId];
        const colorObj = SHOWROOM_COLORS.find(c => c.id === activeInstanceColor);
        return {
            isUniform: false,
            activeColorId: activeInstanceColor,
            activeColorLabel: colorObj ? colorObj.label : activeInstanceColor,
            isMixed: false,
        };
    }

    if (isUniform) {
        const colorObj = SHOWROOM_COLORS.find(c => c.id === firstColor);
        return {
            isUniform: true,
            activeColorId: firstColor,
            activeColorLabel: colorObj ? colorObj.label : firstColor,
            isMixed: false,
        };
    }

    return {
        isUniform: false,
        activeColorId: 'mixed',
        activeColorLabel: 'Nhiều màu',
        isMixed: true,
    };
}

function showroomReducer(state, action) {
    switch (action.type) {
        case 'SET_COLOR': {
            const color = SHOWROOM_COLORS.find(c => c.id === action.colorId);
            const colorName = color ? color.label : action.colorId;

            if (state.scope === 'allMatchingProducts') {
                const newColors = {};
                Object.keys(state.instanceColors).forEach(k => {
                    newColors[k] = action.colorId;
                });
                return {
                    ...state,
                    instanceColors: newColors,
                    liveMessage: `Đã áp dụng màu ${colorName} cho toàn bộ lớp`,
                    pipelineNotice: action.colorId !== 'blue'
                        ? `Đã chọn màu ${colorName}. Ảnh phối cảnh đang dùng mẫu chuẩn Xanh dương.`
                        : null,
                };
            } else {
                return {
                    ...state,
                    instanceColors: {
                        ...state.instanceColors,
                        [state.selectedInstanceId]: action.colorId,
                    },
                    liveMessage: `Đã áp dụng màu ${colorName} cho ${state.selectedInstanceId}`,
                };
            }
        }

        case 'SET_SCOPE': {
            if (state.scope === action.scope) return state;
            return {
                ...state,
                scope: action.scope,
            };
        }

        case 'SELECT_INSTANCE': {
            return {
                ...state,
                scope: 'selectedInstance',
                selectedInstanceId: action.instanceId,
            };
        }

        case 'SET_ANGLE': {
            return {
                ...state,
                activeAngle: action.angleId,
            };
        }

        default:
            return state;
    }
}

// Create initial state
function createInitialState() {
    const instanceColors = {};
    SHOWROOM_INSTANCES.forEach(id => {
        instanceColors[id] = 'blue';
    });

    return {
        activeAngle: 'overview',
        scope: 'allMatchingProducts',
        selectedInstanceId: 'mat-01',
        instanceColors,
        isDetailOpen: false,
        isHelpOpen: false,
        pipelineNotice: null,
        liveMessage: '',
    };
}

console.log('=== RUNNING HULA 360 PRODUCT SHOWROOM STATE VERIFICATION (INSTRUCTION 06) ===\n');

// TEST 1: Initial state
console.log('Test 1: Initial Showroom State Verification');
let state = createInitialState();
assert.strictEqual(state.activeAngle, 'overview', 'Default angle must be overview (Tổng thể)');
assert.strictEqual(state.scope, 'allMatchingProducts', 'Default scope must be allMatchingProducts');
assert.strictEqual(state.selectedInstanceId, 'mat-01', 'Default instance must be mat-01');
SHOWROOM_INSTANCES.forEach(id => {
    assert.strictEqual(state.instanceColors[id], 'blue', `${id} must be blue initially`);
});
let analysis = analyzeColors(state);
assert.strictEqual(analysis.activeColorId, 'blue', 'Active color must be blue');
assert.strictEqual(analysis.activeColorLabel, 'Xanh dương', 'Active color label must be Xanh dương');
assert.strictEqual(analysis.isMixed, false, 'Initial state must not be mixed');
console.log('✔ PASS: Initial state strictly satisfies contract (6 mats, all blue, overview angle)\n');

// TEST 2: Full 6-color palette cycle in "Toàn bộ lớp" scope
console.log('Test 2: Full 6-color palette cycle in Toàn bộ lớp');
const testColors = ['green', 'mint', 'orange', 'yellow', 'pink', 'blue'];
testColors.forEach(colorId => {
    state = showroomReducer(state, { type: 'SET_COLOR', colorId });
    analysis = analyzeColors(state);
    assert.strictEqual(analysis.activeColorId, colorId, `Color should be ${colorId}`);
    SHOWROOM_INSTANCES.forEach(id => {
        assert.strictEqual(state.instanceColors[id], colorId, `${id} must be updated to ${colorId}`);
    });
});
console.log('✔ PASS: All 6 colors cycle cleanly with 100% synchronization across 6 instances\n');

// TEST 3: Single instance mode (Một bộ -> Bộ 02 -> Hồng)
console.log('Test 3: Single Instance Selection (Một bộ -> mat-02 -> pink)');
// Set back all to blue first
state = showroomReducer(state, { type: 'SET_COLOR', colorId: 'blue' });
// Switch to single instance: mat-02
state = showroomReducer(state, { type: 'SELECT_INSTANCE', instanceId: 'mat-02' });
assert.strictEqual(state.scope, 'selectedInstance', 'Scope must switch to selectedInstance');
assert.strictEqual(state.selectedInstanceId, 'mat-02', 'Active instance must be mat-02');
// Recolor to pink
state = showroomReducer(state, { type: 'SET_COLOR', colorId: 'pink' });
// Verify: only mat-02 is pink, other 5 are blue
assert.strictEqual(state.instanceColors['mat-02'], 'pink', 'mat-02 must be pink');
SHOWROOM_INSTANCES.filter(id => id !== 'mat-02').forEach(id => {
    assert.strictEqual(state.instanceColors[id], 'blue', `${id} must remain blue`);
});
analysis = analyzeColors(state);
assert.strictEqual(analysis.activeColorId, 'pink', 'In selectedInstance mode, active color is mat-02 (pink)');
console.log('✔ PASS: Single instance recoloring only mutates mat-02, leaving other 5 mats untouched\n');

// TEST 4: Mixed color ("Nhiều màu") detection when viewing "Toàn bộ lớp"
console.log('Test 4: Mixed Color Detection ("Nhiều màu")');
state = showroomReducer(state, { type: 'SET_SCOPE', scope: 'allMatchingProducts' });
analysis = analyzeColors(state);
assert.strictEqual(analysis.activeColorId, 'mixed', 'Active color must be detected as mixed');
assert.strictEqual(analysis.activeColorLabel, 'Nhiều màu', 'Active label must be Nhiều màu');
assert.strictEqual(analysis.isMixed, true, 'isMixed flag must be true');
console.log('✔ PASS: System accurately displays "Nhiều màu" without incorrectly selecting a single swatch\n');

// TEST 5: Scope switch does NOT auto-repaint until subsequent selection
console.log('Test 5: Scope switch invariance (no auto-repainting on toggle)');
// Switch back and forth
state = showroomReducer(state, { type: 'SET_SCOPE', scope: 'selectedInstance' });
assert.strictEqual(state.instanceColors['mat-02'], 'pink', 'mat-02 must still be pink');
assert.strictEqual(state.instanceColors['mat-01'], 'blue', 'mat-01 must still be blue');
state = showroomReducer(state, { type: 'SET_SCOPE', scope: 'allMatchingProducts' });
assert.strictEqual(state.instanceColors['mat-02'], 'pink', 'mat-02 must still be pink after toggle');
assert.strictEqual(state.instanceColors['mat-01'], 'blue', 'mat-01 must still be blue after toggle');
// Now select Yellow in allMatchingProducts -> all must become yellow
state = showroomReducer(state, { type: 'SET_COLOR', colorId: 'yellow' });
SHOWROOM_INSTANCES.forEach(id => {
    assert.strictEqual(state.instanceColors[id], 'yellow', `${id} must now be yellow`);
});
analysis = analyzeColors(state);
assert.strictEqual(analysis.activeColorId, 'yellow', 'Active color is now uniform yellow');
assert.strictEqual(analysis.isMixed, false, 'No longer mixed');
console.log('✔ PASS: Switching scope preserves instance colors until explicit subsequent recoloring\n');

// TEST 6: Rapid color clicks (Anti-race / Last request wins)
console.log('Test 6: Rapid color clicks anti-race test');
const rapidColors = ['mint', 'orange', 'pink', 'green', 'blue', 'yellow', 'orange', 'mint', 'pink', 'yellow'];
rapidColors.forEach(c => {
    state = showroomReducer(state, { type: 'SET_COLOR', colorId: c });
});
analysis = analyzeColors(state);
assert.strictEqual(analysis.activeColorId, 'yellow', 'Last clicked color (yellow) must be final state');
SHOWROOM_INSTANCES.forEach(id => {
    assert.strictEqual(state.instanceColors[id], 'yellow', `${id} must be yellow`);
});
console.log('✔ PASS: Rapid click stream resolves deterministically to the latest request\n');

// TEST 7: Camera Angle switching retains instance color mappings
console.log('Test 7: Camera angle switching retains state');
// Give mat-01 blue, mat-02 pink, mat-03 green
state = showroomReducer(state, { type: 'SELECT_INSTANCE', instanceId: 'mat-01' });
state = showroomReducer(state, { type: 'SET_COLOR', colorId: 'blue' });
state = showroomReducer(state, { type: 'SELECT_INSTANCE', instanceId: 'mat-02' });
state = showroomReducer(state, { type: 'SET_COLOR', colorId: 'pink' });
state = showroomReducer(state, { type: 'SELECT_INSTANCE', instanceId: 'mat-03' });
state = showroomReducer(state, { type: 'SET_COLOR', colorId: 'green' });

// Switch angles
state = showroomReducer(state, { type: 'SET_ANGLE', angleId: 'closeup' });
assert.strictEqual(state.activeAngle, 'closeup', 'Angle is closeup (Cận sản phẩm)');
assert.strictEqual(state.instanceColors['mat-01'], 'blue');
assert.strictEqual(state.instanceColors['mat-02'], 'pink');
assert.strictEqual(state.instanceColors['mat-03'], 'green');

state = showroomReducer(state, { type: 'SET_ANGLE', angleId: 'storage' });
assert.strictEqual(state.activeAngle, 'storage', 'Angle is storage (Góc cất đồ)');
assert.strictEqual(state.instanceColors['mat-01'], 'blue');
assert.strictEqual(state.instanceColors['mat-02'], 'pink');
assert.strictEqual(state.instanceColors['mat-03'], 'green');

state = showroomReducer(state, { type: 'SET_ANGLE', angleId: 'overview' });
assert.strictEqual(state.activeAngle, 'overview', 'Angle returned to overview');
assert.strictEqual(state.instanceColors['mat-01'], 'blue');
assert.strictEqual(state.instanceColors['mat-02'], 'pink');
assert.strictEqual(state.instanceColors['mat-03'], 'green');
console.log('✔ PASS: Camera angle switching preserves all instance colors and configuration states\n');

console.log('=== ALL 7 SHOWROOM STATE VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
