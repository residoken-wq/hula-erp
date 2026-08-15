const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('====================================================');
console.log('👀 ERP4U REAL-TIME AUTO-SYNC WATCHER STARTED');
console.log('Watching for changes in hula-erp and auto-syncing to erp4u-demo...');
console.log('Press Ctrl+C to stop.');
console.log('====================================================');

let debounceTimer = null;
let isSyncing = false;

function triggerSync() {
  if (isSyncing) return;
  isSyncing = true;

  console.log(`\n[${new Date().toLocaleTimeString()}] ⚡ Change detected! Running sync...`);
  const child = spawn('node', [path.join(__dirname, 'sync_to_demo.js')], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });

  child.on('close', (code) => {
    isSyncing = false;
    console.log(`[${new Date().toLocaleTimeString()}] ✨ Auto-sync completed (exit code: ${code}). Listening for next changes...`);
  });
}

function onChange(eventType, filename) {
  if (!filename) return;
  if (filename.includes('node_modules') || filename.includes('.git') || filename.includes('dist')) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(triggerSync, 1000); // 1s debounce
}

const watchDirs = [
  path.resolve(__dirname, '..', 'src'),
  path.resolve(__dirname, '..', 'frontend', 'src'),
];

for (const dir of watchDirs) {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, onChange);
    console.log(`👀 Watching: ${dir}`);
  }
}

// Initial sync on startup
triggerSync();
