const XLSX = require('xlsx');

// Import compiled dist UploadService or define test
const types = ['materials', 'products', 'boms', 'combos', 'customers', 'suppliers', 'sales'];

// Load the compiled UploadService from dist/upload/upload.service.js
const { UploadService } = require('../dist/upload/upload.service');

const service = new UploadService();

console.log('--- TESTING ALL 7 EXCEL TEMPLATES ---');
let allPassed = true;

for (const type of types) {
  try {
    const buffer = service.getTemplate(type);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];

    console.log(`\n✅ Template: [${type}]`);
    console.log(`   Headers (${headers.length}):`, headers.join(', '));
    console.log(`   Sample rows count: ${data.length}`);
    console.log(`   Sample row 1:`, JSON.stringify(data[0]));

    if (!headers || headers.length === 0 || data.length === 0) {
      console.error(`❌ Template [${type}] has no headers or data!`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`❌ Error generating template [${type}]:`, err.message);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n--- TESTING ROW NORMALIZATION & PARSING HELPERS ---');

  // Test parseNumber
  const testNums = [
    { input: '35.000', expected: 35000 },
    { input: '1,000,000', expected: 1000000 },
    { input: '1.5', expected: 1.5 },
    { input: '1,5', expected: 1.5 },
    { input: 120000, expected: 120000 },
    { input: null, expected: 0 },
    { input: '', expected: 0 },
  ];

  for (const t of testNums) {
    const res = service.parseNumber(t.input);
    if (res !== t.expected) {
      console.error(`❌ parseNumber failed for '${t.input}': expected ${t.expected}, got ${res}`);
      allPassed = false;
    }
  }
  console.log('✅ parseNumber handles all Vietnamese and international currency/decimal formats correctly.');

  // Test normalizeRow
  const rawRow = {
    'Mã SP': 'SKU_TEST_01',
    'Tên Sản Phẩm': 'Sản Phẩm Test',
    'Đơn Giá (VNĐ)': '150.000',
    '% Hao Hụt': '2,5',
    'ĐVT Mua Hàng': 'Cuộn'
  };
  const norm = service.normalizeRow(rawRow);
  if (
    norm['masp'] !== 'SKU_TEST_01' ||
    norm['tensanpham'] !== 'Sản Phẩm Test' ||
    norm['dongiavnd'] !== '150.000' ||
    norm['haohut'] !== '2,5' ||
    norm['dvtmuahang'] !== 'Cuộn'
  ) {
    console.error('❌ normalizeRow failed to map Vietnamese headers with accents/spaces:', norm);
    allPassed = false;
  } else {
    console.log('✅ normalizeRow correctly normalizes Vietnamese diacritics, spaces, and punctuation in column headers.');
  }

  // Test parseDate
  const testDates = [
    { input: '2026-08-25', expectedYear: 2026, expectedMonth: 7, expectedDay: 25 },
    { input: '25/08/2026', expectedYear: 2026, expectedMonth: 7, expectedDay: 25 },
    { input: '25-08-2026', expectedYear: 2026, expectedMonth: 7, expectedDay: 25 },
  ];

  for (const d of testDates) {
    const parsed = service.parseDate(d.input);
    if (
      parsed.getFullYear() !== d.expectedYear ||
      parsed.getMonth() !== d.expectedMonth ||
      parsed.getDate() !== d.expectedDay
    ) {
      console.error(`❌ parseDate failed for '${d.input}': got ${parsed.toISOString()}`);
      allPassed = false;
    }
  }
  console.log('✅ parseDate correctly parses ISO and Vietnamese DD/MM/YYYY date strings.');
}

if (allPassed) {
  console.log('\n🎉 ALL TESTS AND VALIDATIONS PASSED WITH 100% ACCURACY!');
  process.exit(0);
} else {
  console.error('\n❌ SOME TESTS FAILED!');
  process.exit(1);
}
