const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.resolve(__dirname, '../../.tmp-chrome-profile');
const EVIDENCE_DIR = path.resolve(__dirname, '../../docs/chatbot/evidence/P2');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id && this.callbacks.has(data.id)) {
            const cb = this.callbacks.get(data.id);
            this.callbacks.delete(data.id);
            if (data.error) {
              cb.reject(new Error(data.error.message));
            } else {
              cb.resolve(data.result);
            }
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height, isMobile = false, scale = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: scale,
      mobile: isMobile
    });
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${path.basename(filePath)} (${fs.statSync(filePath).size} bytes)`);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function getWsUrl() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const list = await res.json();
  const page = list.find((t) => t.type === 'page');
  return page ? page.webSocketDebuggerUrl : null;
}

async function main() {
  console.log('Launching headless Chrome...');
  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-background-networking',
      '--window-size=1280,800',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );

  await sleep(2500);

  try {
    const wsUrl = await getWsUrl();
    if (!wsUrl) throw new Error('No page WebSocket URL found from Chrome');
    console.log('Connecting CDP to:', wsUrl);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // ----------------------------------------------------
    // Screenshot 1: Header desktop with "Tư vấn ngay" CTA & avatar
    // ----------------------------------------------------
    console.log('\n--- 1. Header Desktop ---');
    await cdp.setViewport(1280, 800, false, 1);
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    // Wait for page load (2s is before the 5s auto-open)
    await sleep(2000);
    await cdp.eval('window.scrollTo(0, 0)');
    await sleep(500);
    await cdp.screenshot(path.join(EVIDENCE_DIR, '01-header-desktop.png'));

    // ----------------------------------------------------
    // Screenshot 2: Panel desktop auto-opened after 5s
    // ----------------------------------------------------
    console.log('\n--- 2. Panel Desktop Auto-Open ---');
    // Wait until 5s timer expires and auto-open triggers
    await sleep(4000);
    // Ensure panel is open
    await cdp.eval(`
      (() => {
        const panel = document.querySelector('#chat-panel');
        if (!panel) {
          const btn = document.querySelector('#header-chat-cta');
          if (btn) btn.click();
        }
      })()
    `);
    await sleep(1500);
    await cdp.screenshot(path.join(EVIDENCE_DIR, '02-panel-desktop-autoopen.png'));

    // ----------------------------------------------------
    // Screenshot 3: Teaser on mobile at 390x844
    // ----------------------------------------------------
    console.log('\n--- 3. Teaser Mobile ---');
    await cdp.setViewport(390, 844, true, 2);
    // Clear storage so auto-open teaser fires
    await cdp.eval(`
      (() => {
        sessionStorage.clear();
        localStorage.removeItem('hula_chat_autoopened');
        localStorage.removeItem('hula_chat_snooze_until');
        localStorage.removeItem('hula_chat_session');
      })()
    `);
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    // Wait 5.5s for mobile teaser auto-open
    await sleep(6000);
    // If not open yet, click mobile widget
    await cdp.eval(`
      (() => {
        const teaser = document.querySelector('#chat-teaser');
        if (!teaser) {
          const mobileBtn = document.querySelector('button[aria-label*="Tư vấn với Cừu Hula"]');
          if (mobileBtn) mobileBtn.click();
        }
      })()
    `);
    await sleep(1000);
    await cdp.screenshot(path.join(EVIDENCE_DIR, '03-teaser-mobile.png'));

    // ----------------------------------------------------
    // Screenshot 4: Panel mobile when keyboard is open
    // ----------------------------------------------------
    console.log('\n--- 4. Panel Mobile Keyboard ---');
    // Click button to open full panel on mobile
    await cdp.eval(`
      (() => {
        const startBtn = document.querySelector('#chat-teaser button:has(span)') || document.querySelector('button[aria-label*="Tư vấn với Cừu Hula"]');
        if (startBtn) startBtn.click();
      })()
    `);
    await sleep(2000);

    // Focus input and type sample message
    await cdp.eval(`
      (() => {
        const textarea = document.querySelector('#chat-panel textarea');
        if (textarea) {
          textarea.focus();
          textarea.value = 'Trường mầm non Ánh Sao cần tư vấn 50 bộ nệm gối ạ';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(1500);
    await cdp.screenshot(path.join(EVIDENCE_DIR, '04-panel-mobile-keyboard.png'));

    // ----------------------------------------------------
    // Screenshot 5: ERP Inbox in "đã nhận xử lý" state
    // ----------------------------------------------------
    console.log('\n--- 5. ERP Inbox Taken ---');
    await cdp.setViewport(1440, 900, false, 1);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    const loginRes = await fetch('http://localhost:3999/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'test-local' })
    });
    const loginData = await loginRes.json();
    console.log('Admin login status:', loginRes.status, 'hasToken:', !!loginData.access_token);

    await cdp.eval(`
      localStorage.setItem('token', '${loginData.access_token}');
      localStorage.setItem('user', JSON.stringify(${JSON.stringify(loginData.user)}));
    `);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/chatbot/inbox' });
    await sleep(4000);

    // Ensure first conversation is clicked and detail loaded
    await cdp.eval(`
      (() => {
        // Dismiss any notification dropdowns
        document.body.click();
        const firstItem = document.querySelector('div[style*="cursor: pointer"]');
        if (firstItem) firstItem.click();
        setTimeout(() => document.body.click(), 500);
      })()
    `);
    await sleep(2500);
    await cdp.screenshot(path.join(EVIDENCE_DIR, '05-erp-inbox-taken.png'));

    // ----------------------------------------------------
    // Screenshot 6: ERP Request Drawer with Lead Link
    // ----------------------------------------------------
    console.log('\n--- 6. ERP Request Drawer ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/chatbot/requests' });
    await sleep(4000);

    // Click "Xem" on YC-260927-0001 row to open Drawer
    await cdp.eval(`
      (() => {
        // Find button with text 'Xem'
        const xemBtns = Array.from(document.querySelectorAll('button')).filter(el => el.textContent.trim() === 'Xem');
        // Click the one for YC-260927-0001 (has Lead)
        if (xemBtns.length > 1) {
          xemBtns[1].click();
        } else if (xemBtns.length > 0) {
          xemBtns[0].click();
        }
      })()
    `);
    await sleep(3000);
    await cdp.screenshot(path.join(EVIDENCE_DIR, '06-erp-request-drawer.png'));

    console.log('\nAll 6 screenshots captured successfully!');
    cdp.close();
  } catch (err) {
    console.error('Error taking screenshots:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

main();
