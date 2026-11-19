// Capture screenshots for gta6-cover-art-01 (Builder B).
// Reads shots.json, serves app/ on localhost:8080 via serve.ts, drives headless
// Chrome over CDP (Node built-in WebSocket, no deps), waits for
// window.__shotReady on each shot, saves PNG to /tmp then re-encodes to JPEG
// under the kit limits (<=256 KiB, long side <=1280, short side >=480) into
// screenshots/. Usage: node scripts/capture.mjs  (run from the repo root)
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const SHOTS = JSON.parse(readFileSync(join(ROOT, 'shots.json'), 'utf8'));
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chrome-linux64/chrome`;
const PORT = 9222;
const APP_PORT = 8091; // 8080 is taken by the gta6-01 game server (PID 7762); do not kill it.
const TMP = '/tmp/cover-shots';
mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitHttp(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch { /* retry */ }
    await sleep(200);
  }
  throw new Error(`never reachable: ${url}`);
}

async function cdpConnect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (msg) => msg.error ? reject(new Error(`${method}: ${JSON.stringify(msg.error)}`)) : resolve(msg.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  return { ws, send };
}

async function main() {
  // 1. Serve app/ on localhost:8091 (8080 is taken by another task's server)
  const server = spawn('node', ['serve.ts', '--port', String(APP_PORT)], { cwd: ROOT, stdio: 'ignore' });
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, '--no-sandbox',
    '--disable-gpu', '--hide-scrollbars', '--user-data-dir=/tmp/chrome-profile-cover-fresh-16778',
    'about:blank',
  ], { stdio: 'ignore' });
  try {
    await waitHttp(`http://localhost:${APP_PORT}/`);
    await waitHttp(`http://127.0.0.1:${PORT}/json/version`);
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('no page target from Chrome');
    const { ws, send } = await cdpConnect(page.webSocketDebuggerUrl);
    await send('Page.enable');
    await send('Runtime.enable');

    for (const shot of SHOTS) {
      const url = `http://localhost:${APP_PORT}/${shot.query.startsWith('?') ? shot.query : '?' + shot.query}`;
      await send('Emulation.setDeviceMetricsOverride', { width: shot.w, height: shot.h, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url });
      // Wait for the new document to finish loading first: polling
      // __shotReady too early can read the PREVIOUS shot's page, where it
      // is already true, and screenshot a half-applied scene.
      let loaded = false;
      for (let i = 0; i < 50; i++) {
        await sleep(200);
        const r = await send('Runtime.evaluate', { expression: `document.readyState === 'complete' && location.search === ${JSON.stringify(shot.query)}`, returnByValue: true });
        if (r?.result?.value === true) { loaded = true; break; }
      }
      if (!loaded) throw new Error(`shot ${shot.name}: page never reached readyState complete at ${url}`);
      // Wait for window.__shotReady (up to 30 s).
      let ready = false;
      for (let i = 0; i < 150; i++) {
        await sleep(200);
        const r = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
        if (r?.result?.value === true) { ready = true; break; }
      }
      if (!ready) throw new Error(`shot ${shot.name}: __shotReady never became true at ${url}`);
      await sleep(300); // let the final paint settle
      const shotRes = await send('Page.captureScreenshot', { format: 'png' });
      const pngPath = join(TMP, shot.name.replace(/\.jpg$/, '.png'));
      writeFileSync(pngPath, Buffer.from(shotRes.data, 'base64'));
      console.log(`captured ${shot.name} ${shot.w}x${shot.h} -> ${pngPath}`);
    }
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.kill('SIGKILL');
  }

  // 2. Re-encode to JPEG within kit limits via PIL.
  const py = `
import json, os
from PIL import Image
shots = json.load(open(${JSON.stringify(join(ROOT, 'shots.json'))}))
for s in shots:
    src = os.path.join(${JSON.stringify(TMP)}, s['name'].replace('.jpg', '.png'))
    dst = os.path.join(${JSON.stringify(join(ROOT, 'screenshots'))}, s['name'])
    im = Image.open(src).convert('RGB')
    w, h = im.size
    long_side, short_side = max(w, h), min(w, h)
    if long_side > 1280:
        scale = 1280 / long_side
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    q = 85
    while True:
        im.save(dst, 'JPEG', quality=q, optimize=True)
        if os.path.getsize(dst) <= 256 * 1024 or q <= 55:
            break
        q -= 5
    w2, h2 = Image.open(dst).size
    print(f"{s['name']}: {w2}x{h2} {os.path.getsize(dst)} bytes q={q}")
`;
  const { stdout, stderr } = await execFileAsync('python3', ['-c', py]);
  process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  console.log('capture done');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
