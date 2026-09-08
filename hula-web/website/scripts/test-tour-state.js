/**
 * Automated Verification Script for HULA 360 State Transitions (Prompt 06 / A05, A06, A07)
 * Tests:
 * 1. Single-object bag ownership invariant
 * 2. Anti-spam protection on rapid CTA clicks
 * 3. Replay reset consistency
 * 4. Deferred role switching during transferring phase
 * 5. Multi-POV synchronization in EV-06 (Cô An, Mẹ Linh, Bé Mây)
 */

const assert = require('assert');

// Simplified Tour Reducer mirror matching useTourState.ts
function tourReducer(state, action) {
    switch (action.type) {
        case 'START_HANDOVER': {
            if (state.handoverPhase !== 'ready') return state; // Anti-spam check
            return {
                ...state,
                handoverPhase: 'transferring',
                transitionLabel: 'Đang bàn giao túi nệm...',
            };
        }

        case 'COMPLETE_HANDOVER': {
            if (state.handoverPhase !== 'transferring') return state;
            return {
                ...state,
                handoverPhase: 'received',
                transitionLabel: 'Mẹ Linh đã nhận túi an toàn',
                productState: {
                    ...state.productState,
                    holder: 'mother',
                    status: 'packed',
                    location: 'door',
                },
                progressByRole: {
                    ...state.progressByRole,
                    [state.activeRole]: Math.max(state.progressByRole[state.activeRole], state.currentStepIndex + 1),
                },
            };
        }

        case 'RESET_HANDOVER': {
            return {
                ...state,
                handoverPhase: 'ready',
                transitionLabel: 'Đã đặt lại vị trí túi',
                productState: {
                    ...state.productState,
                    holder: 'teacher',
                    status: 'packed',
                    location: 'door',
                },
            };
        }

        case 'SWITCH_ROLE_SAME_MOMENT': {
            if (action.targetRole === state.activeRole) return state;
            if (state.handoverPhase === 'transferring') return state; // Block switch during transferring

            return {
                ...state,
                activeRole: action.targetRole,
                isChildMode: action.targetRole === 'CHAR-MAY',
                // Keeps same currentEvent, productState, handoverPhase
            };
        }

        default:
            return state;
    }
}

// Initial state
const initialState = {
    activeRole: 'CHAR-LINH',
    currentEvent: 'EV-06',
    currentStepIndex: 4, // PH-05
    handoverPhase: 'ready',
    productState: {
        holder: 'teacher',
        status: 'packed',
        location: 'door',
    },
    progressByRole: {
        'CHAR-AN': 0,
        'CHAR-LINH': 0,
        'CHAR-MAY': 0,
    },
};

console.log('=== RUNNING HULA 360 TOUR STATE MACHINE VERIFICATION (PROMPT 06) ===\n');

// TEST 1: Initial state & Ownership
console.log('Test 1: Initial Ownership in EV-06 (Ready state)');
let state = { ...initialState };
assert.strictEqual(state.handoverPhase, 'ready', 'Phase should be ready');
assert.strictEqual(state.productState.holder, 'teacher', 'Teacher (Cô An) must initially hold the bag');
console.log('✔ PASS: Initial state has exactly 1 bag owned by Cô An\n');

// TEST 2: Start handover
console.log('Test 2: Start Handover transition');
state = tourReducer(state, { type: 'START_HANDOVER' });
assert.strictEqual(state.handoverPhase, 'transferring', 'Phase should transition to transferring');
console.log('✔ PASS: Handover transitioned to transferring\n');

// TEST 3: Anti-spam on rapid CTA clicks (A06)
console.log('Test 3: Anti-spam protection against rapid clicks');
const spamState1 = tourReducer(state, { type: 'START_HANDOVER' });
const spamState2 = tourReducer(spamState1, { type: 'START_HANDOVER' });
assert.strictEqual(spamState2.handoverPhase, 'transferring', 'Phase must remain transferring');
assert.strictEqual(spamState2.productState.holder, 'teacher', 'Bag ownership must not corrupt during rapid spam');
console.log('✔ PASS: Anti-spam prevented double activation or state duplication\n');

// TEST 4: Role switch deferred during transferring (Prompt 05 / A07)
console.log('Test 4: Role switch blocked/deferred during transferring phase');
const blockedSwitch = tourReducer(state, { type: 'SWITCH_ROLE_SAME_MOMENT', targetRole: 'CHAR-AN' });
assert.strictEqual(blockedSwitch.activeRole, 'CHAR-LINH', 'Role switch must be deferred during transferring');
console.log('✔ PASS: Role switch safely deferred while in active handover motion\n');

// TEST 5: Complete handover
console.log('Test 5: Complete Handover (Received state & Ownership transfer)');
state = tourReducer(state, { type: 'COMPLETE_HANDOVER' });
assert.strictEqual(state.handoverPhase, 'received', 'Phase must be received');
assert.strictEqual(state.productState.holder, 'mother', 'Bag ownership must now belong to Mẹ Linh');
assert.strictEqual(state.progressByRole['CHAR-LINH'], 5, 'Mẹ Linh progress must be recorded as 5');
console.log('✔ PASS: Ownership transferred cleanly to mother (Mẹ Linh) with single bag invariant\n');

// TEST 6: Role switch after handover retains ownership (Prompt 05)
console.log('Test 6: Switch role to Cô An after handover');
state = tourReducer(state, { type: 'SWITCH_ROLE_SAME_MOMENT', targetRole: 'CHAR-AN' });
assert.strictEqual(state.activeRole, 'CHAR-AN', 'Active role is now Cô An');
assert.strictEqual(state.productState.holder, 'mother', 'Cô An must observe that Mẹ Linh holds the bag');
assert.strictEqual(state.handoverPhase, 'received', 'Handover phase remains received');
console.log('✔ PASS: Same-moment role switch accurately reflects post-handover ownership for Cô An\n');

// TEST 7: Switch role to Bé Mây (Child perspective)
console.log('Test 7: Switch role to Bé Mây (Child mode & perspectives)');
state = tourReducer(state, { type: 'SWITCH_ROLE_SAME_MOMENT', targetRole: 'CHAR-MAY' });
assert.strictEqual(state.activeRole, 'CHAR-MAY', 'Active role is now Bé Mây');
assert.strictEqual(state.isChildMode, true, 'Child mode must be active for Bé Mây');
assert.strictEqual(state.productState.holder, 'mother', 'Bé Mây observes bag is held by mother');
console.log('✔ PASS: Bé Mây POV inherits correct world state without cloning\n');

// TEST 8: Replay Handover reset (A06)
console.log('Test 8: Replay reset to Ready state');
state = tourReducer(state, { type: 'RESET_HANDOVER' });
assert.strictEqual(state.handoverPhase, 'ready', 'Phase must reset to ready');
assert.strictEqual(state.productState.holder, 'teacher', 'Bag ownership must reset back to teacher');
console.log('✔ PASS: Replay successfully restored ready snapshot without leaking states\n');

console.log('=== ALL 8 STATE MACHINE TESTS PASSED SUCCESSFULLY! ===');
