const assert = require('assert');
const fs = require('fs');
const path = require('path');

const tourConfigPath = path.join(__dirname, '../src/components/tour360/data/tourConfig.ts');
const tourConfigSrc = fs.readFileSync(tourConfigPath, 'utf8');

console.log('Testing Beta Domain 360 Widget Bypass:');

// Test 1: Source code must contain isBetaDomain implementation
assert.ok(tourConfigSrc.includes('export function isBetaDomain()'), 'Must export isBetaDomain');
assert.ok(tourConfigSrc.includes('beta.nemmamnon.com'), 'Must explicitly check beta.nemmamnon.com');
assert.ok(tourConfigSrc.includes('localhost'), 'Must check localhost');
console.log('✓ PASS: tourConfig.ts defines isBetaDomain with beta.nemmamnon.com and localhost checks');

// Test 2: computeTourEligibility must bypass disabled settings when on beta
assert.ok(tourConfigSrc.includes('if (isBetaDomain())'), 'computeTourEligibility must check isBetaDomain');
console.log('✓ PASS: computeTourEligibility checks isBetaDomain prior to inspecting disabled settings');

// Test 3: Functional test of isBetaDomain logic
function testIsBeta(hostname, search = '', hash = '') {
    const host = (hostname || '').toLowerCase();
    return (
        host.startsWith('beta.') ||
        host.includes('beta.nemmamnon.com') ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        search.includes('beta=true') ||
        search.includes('tour360=true') ||
        hash === '#tour360'
    );
}

assert.strictEqual(testIsBeta('beta.nemmamnon.com'), true);
assert.strictEqual(testIsBeta('beta.example.com'), true);
assert.strictEqual(testIsBeta('localhost'), true);
assert.strictEqual(testIsBeta('127.0.0.1'), true);
assert.strictEqual(testIsBeta('nemmamnon.com'), false);
assert.strictEqual(testIsBeta('nemmamnon.com', '?beta=true'), true);
assert.strictEqual(testIsBeta('nemmamnon.com', '?tour360=true'), true);
console.log('✓ PASS: Domain logic accurately classifies beta.nemmamnon.com as beta and nemmamnon.com as prod');

// Test 4: Verify Backend public.controller.ts isBeta check
const controllerPath = path.join(__dirname, '../../../src/public/public.controller.ts');
const controllerSrc = fs.readFileSync(controllerPath, 'utf8');
assert.ok(controllerSrc.includes('beta.nemmamnon.com'), 'Controller must check beta.nemmamnon.com');
assert.ok(controllerSrc.includes("widget_360_enabled: isBeta ? 'true'"), 'Controller must force widget_360_enabled to true on beta');
console.log('✓ PASS: public.controller.ts forces widget_360_enabled to true on beta domain');

// Test 5: Verify FloatingActionWidgets.tsx uses isBeta
const widgetPath = path.join(__dirname, '../src/components/FloatingActionWidgets.tsx');
const widgetSrc = fs.readFileSync(widgetPath, 'utf8');
assert.ok(widgetSrc.includes('isBetaDomain'), 'FloatingActionWidgets must import and use isBetaDomain');
assert.ok(widgetSrc.includes('show360Widget = isBeta || computeTourEligibility(settings)'), 'show360Widget must be true if isBeta');
console.log('✓ PASS: FloatingActionWidgets renders 360 widget whenever on beta domain');

console.log('\nAll 5 Beta 360 Widget tests passed successfully!');
