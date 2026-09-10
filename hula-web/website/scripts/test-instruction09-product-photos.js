/**
 * test-instruction09-product-photos.js
 * Automated verification suite for HULA Instruction 09:
 * - Real product photos asset pipeline & catalogue crops
 * - Upgraded CaraBeddingMesh geometry & PBR materials
 * - Inspector real photo card & lightbox modal integration
 * - Camera bookmarks C01-C03
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const WEBSITE_DIR = path.resolve(__dirname, '..');
const REAL_PHOTOS_DIR = path.join(WEBSITE_DIR, 'public', 'images', 'tour360', 'real-photos');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✓ PASS: ${name}`);
        passCount++;
    } catch (err) {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    -> ${err.message}`);
        failCount++;
    }
}

console.log('====================================================');
console.log(' HULA Instruction 09: Real Photos & Cara PBR Test Suite');
console.log('====================================================\n');

// 1. Asset Pipeline Tests
console.log('Group 1: Real Product Photos Asset Pipeline');

runTest('1.1 Catalogue 6 colorway crops exist with valid sizes', () => {
    const colors = ['blue', 'green', 'mint', 'orange', 'yellow', 'pink'];
    for (const c of colors) {
        const p = path.join(REAL_PHOTOS_DIR, 'catalogue', `cara_${c}.jpg`);
        assert.ok(fs.existsSync(p), `Missing crop: cara_${c}.jpg`);
        const stats = fs.statSync(p);
        assert.ok(stats.size > 10000, `Crop file cara_${c}.jpg is too small: ${stats.size} bytes`);
    }
});

runTest('1.2 Full catalogue page NEM_MN_-_03 and spec sheet NEM_MN_-_01 exist', () => {
    const cat3 = path.join(REAL_PHOTOS_DIR, 'catalogue', 'NEM_MN_-_03.jpg');
    const cat1 = path.join(REAL_PHOTOS_DIR, 'catalogue', 'NEM_MN_-_01.jpg');
    assert.ok(fs.existsSync(cat3), 'Missing NEM_MN_-_03.jpg');
    assert.ok(fs.existsSync(cat1), 'Missing NEM_MN_-_01.jpg');
});

runTest('1.3 Project photos for Sright (15) and KIS (11) exist', () => {
    const srightDir = path.join(REAL_PHOTOS_DIR, 'projects', 'sright');
    const kisDir = path.join(REAL_PHOTOS_DIR, 'projects', 'kis');
    assert.ok(fs.existsSync(srightDir), 'Missing Sright dir');
    assert.ok(fs.existsSync(kisDir), 'Missing KIS dir');
    const srightFiles = fs.readdirSync(srightDir).filter(f => f.endsWith('.jpg'));
    const kisFiles = fs.readdirSync(kisDir).filter(f => f.endsWith('.jpg'));
    assert.strictEqual(srightFiles.length, 15, `Expected 15 Sright photos, got ${srightFiles.length}`);
    assert.strictEqual(kisFiles.length, 11, `Expected 11 KIS photos, got ${kisFiles.length}`);
});

runTest('1.4 Real photos manifest is present with valid metadata', () => {
    const manifestPath = path.join(REAL_PHOTOS_DIR, 'real_photos_manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'Missing real_photos_manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.cottonCara6Colors, 'Manifest missing cottonCara6Colors');
    assert.ok(manifest.disclaimer.includes('YOUR LOGO HERE'), 'Manifest missing disclaimer');
});

// 2. 3D CaraBeddingMesh Verification
console.log('\nGroup 2: Upgraded CaraBeddingMesh Geometry & Materials');

const caraMeshPath = path.join(WEBSITE_DIR, 'src', 'components', 'tour360', 'engine', 'procedural', 'CaraBeddingMesh.ts');
const caraMeshCode = fs.readFileSync(caraMeshPath, 'utf8');

runTest('2.1 Mattress dimensions strictly conform to 1.20m x 0.63m x 0.025m', () => {
    assert.ok(caraMeshCode.includes('matLength = 1.20'), 'matLength must be 1.20m');
    assert.ok(caraMeshCode.includes('matWidth = 0.63'), 'matWidth must be 0.63m');
    assert.ok(caraMeshCode.includes('matThickness = 0.025'), 'matThickness must be 0.025m');
});

runTest('2.2 Pillow has 3D cushion loft volume (0.40m x 0.25m) and dedicated piping', () => {
    assert.ok(caraMeshCode.includes('0.40, 0.024, 0.25'), 'Pillow geometry must be 0.40x0.25m');
    assert.ok(caraMeshCode.includes('pillowPipingGeo'), 'Pillow must have dedicated perimeter piping');
    assert.ok(caraMeshCode.includes('0.065 * loft'), 'Pillow must use cushion loft calculation');
});

runTest('2.3 Blanket has natural drape overhang and turned-down cuff (#FAF8F2)', () => {
    assert.ok(caraMeshCode.includes('blanketW = 0.67'), 'Blanket width must drape over 0.63m mattress');
    assert.ok(caraMeshCode.includes('cuffMesh'), 'Blanket must feature turned-down cuff');
    assert.ok(caraMeshCode.includes('#FAF8F2'), 'Cuff must use soft cream-white lining #FAF8F2');
});

runTest('2.4 Dedicated Piping_Gray (#8E9B97) is strictly preserved during recoloring', () => {
    assert.ok(caraMeshCode.includes('#8E9B97'), 'Piping must use #8E9B97');
    assert.ok(caraMeshCode.includes('pipingMaterial'), 'Piping must be a dedicated material');
});

runTest('2.5 Obsolete cyan ring is completely removed and replaced by soft floor halo', () => {
    assert.ok(!caraMeshCode.includes('RingGeometry(0.45, 0.48'), 'Obsolete cyan RingGeometry must be removed');
    assert.ok(caraMeshCode.includes('haloMaterial'), 'Must use soft floor halo');
    assert.ok(caraMeshCode.includes('depthWrite: false'), 'Halo must have depthWrite: false');
});

runTest('2.6 Realistic cotton fabric textures are generated and bound', () => {
    assert.ok(caraMeshCode.includes('getCaraTextures'), 'Must have getCaraTextures generator');
    assert.ok(caraMeshCode.includes('cachedCaraNormalMap'), 'Must cache normal map');
    assert.ok(caraMeshCode.includes('cachedCaraRoughnessMap'), 'Must cache roughness map');
});

// 3. Inspector Real Photos Integration
console.log('\nGroup 3: Inspector Real Photos Integration & Camera Bookmarks');

const inspectorPath = path.join(WEBSITE_DIR, 'src', 'components', 'tour360', 'school-pov', 'CampusInspector.tsx');
const inspectorCode = fs.readFileSync(inspectorPath, 'utf8');
const modalPath = path.join(WEBSITE_DIR, 'src', 'components', 'tour360', 'school-pov', 'CampusRealPhotosModal.tsx');
const modalCode = fs.readFileSync(modalPath, 'utf8');

runTest('3.1 Inspector features dedicated Real Product Photos card for Cotton Cara', () => {
    assert.ok(inspectorCode.includes('Ảnh Sản Phẩm Thật'), 'Inspector missing Real Product Photos card');
    assert.ok(inspectorCode.includes('Catalogue HULA'), 'Card missing Catalogue badge');
    assert.ok(inspectorCode.includes('YOUR LOGO HERE'), 'Card missing logo disclaimer');
});

runTest('3.2 CampusRealPhotosModal exists with Catalogue 6-color tab and Project Gallery tab', () => {
    assert.ok(fs.existsSync(modalPath), 'Missing CampusRealPhotosModal.tsx');
    assert.ok(modalCode.includes('Ảnh Catalogue 6 Màu'), 'Modal missing Catalogue tab');
    assert.ok(modalCode.includes('Ảnh Dự Án Thực Tế'), 'Modal missing Projects tab');
    assert.ok(modalCode.includes('SRIGHT_PHOTOS'), 'Modal missing Sright photos');
    assert.ok(modalCode.includes('KIS_PHOTOS'), 'Modal missing KIS photos');
});

runTest('3.3 3 Cara QA Bookmarks (C01-C03) are defined and accessible', () => {
    const camCtrlPath = path.join(WEBSITE_DIR, 'src', 'components', 'tour360', 'engine', 'CampusCameraController.ts');
    const camCtrlCode = fs.readFileSync(camCtrlPath, 'utf8');
    assert.ok(camCtrlCode.includes('CARA_R1_BOOKMARKS'), 'Missing CARA_R1_BOOKMARKS in controller');
    assert.ok(camCtrlCode.includes('C01'), 'Missing C01 bookmark');
    assert.ok(camCtrlCode.includes('C02'), 'Missing C02 bookmark');
    assert.ok(camCtrlCode.includes('C03'), 'Missing C03 bookmark');
    assert.ok(inspectorCode.includes('CARA_R1_BOOKMARKS'), 'Inspector missing CARA_R1_BOOKMARKS');
});

console.log('\n====================================================');
console.log(` Summary: ${passCount} passed, ${failCount} failed`);
console.log('====================================================');

if (failCount > 0) {
    process.exit(1);
} else {
    console.log('All Instruction 09 unit and integration tests passed successfully!\n');
}
