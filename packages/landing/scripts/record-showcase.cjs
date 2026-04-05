#!/usr/bin/env node
'use strict';

const { chromium } = require(
  require.resolve('playwright', { paths: ['/Users/dorlugasigal/Projects/termbeam'] })
);
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3456';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const SHOWCASE_DIR = path.join(__dirname, '..', 'public', 'showcase');
const TEMP_DIR = path.join(__dirname, '..', '.video-tmp');

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 720 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createSession(name) {
  const res = await apiRequest('POST', '/api/sessions', {
    name,
    cwd: '/Users/dorlugasigal/Projects/termbeam',
  });
  return res;
}

async function deleteSession(id) {
  return apiRequest('DELETE', `/api/sessions/${id}`);
}

function convertToMp4(input, output) {
  execSync(
    `"${FFMPEG}" -y -i "${input}" -c:v libx264 -crf 28 -preset slow ` +
      `-an -movflags +faststart -pix_fmt yuv420p "${output}"`,
    { stdio: 'pipe' }
  );
}

async function openContext(browser, size) {
  const dir = path.join(TEMP_DIR, `ctx-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: size,
    recordVideo: { dir, size },
    // Suppress permission prompts (microphone etc.)
    permissions: [],
  });
  return context;
}

async function finalize(page, context, outputName) {
  const videoPath = await page.video().path();
  await context.close(); // triggers video save
  const mp4Path = path.join(SHOWCASE_DIR, outputName);
  convertToMp4(videoPath, mp4Path);
  const stat = fs.statSync(mp4Path);
  console.log(`  ✓ ${outputName} (${(stat.size / 1024).toFixed(0)} KB)`);
}

async function focusTerminal(page) {
  await page.locator('.xterm-helper-textarea').first().focus();
}

async function typeCommand(page, cmd) {
  await focusTerminal(page);
  await page.keyboard.type(cmd, { delay: 30 });
  await page.keyboard.press('Enter');
}

// ---------------------------------------------------------------------------
// Recording functions
// ---------------------------------------------------------------------------

async function recordHubMobile(browser) {
  console.log('Recording hub-mobile...');
  const context = await openContext(browser, MOBILE);
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  // Wait for sessions list to render
  await page.waitForSelector('[data-testid="hub-new-session-btn"]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await finalize(page, context, 'hub-mobile.mp4');
}

async function recordAgentsDesktop(browser) {
  console.log('Recording agents-desktop...');
  const context = await openContext(browser, DESKTOP);
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Click the new session button to open the modal
  const btn = page.locator('[data-testid="hub-new-session-btn"]');
  try {
    await btn.waitFor({ timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(500);
    // Wait for the modal
    await page.waitForSelector('[data-testid="new-session-modal"]', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(3000);
  } catch {
    // Fallback: just show the sessions page
    await page.waitForTimeout(3000);
  }
  await finalize(page, context, 'agents-desktop.mp4');
}

async function recordTerminalMobile(browser) {
  console.log('Recording terminal-mobile...');
  const session = await createSession('demo-terminal');
  const context = await openContext(browser, MOBILE);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/terminal?session=${session.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);
    await typeCommand(page, 'ls');
    await page.waitForTimeout(1500);
    await typeCommand(page, 'echo "Hello World"');
    await page.waitForTimeout(2000);
    await finalize(page, context, 'terminal-mobile.mp4');
  } finally {
    await deleteSession(session.id);
  }
}

async function recordVoiceMobile(browser) {
  console.log('Recording voice-mobile...');
  const session = await createSession('demo-voice');
  const context = await openContext(browser, MOBILE);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/terminal?session=${session.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);
    await typeCommand(page, 'git log --oneline -5');
    await page.waitForTimeout(1500);

    // Trigger mic button
    const micBtn = page.locator('[data-testid="mic-btn"]');
    try {
      await micBtn.waitFor({ timeout: 3000 });
      await micBtn.dispatchEvent('mousedown');
      await page.waitForTimeout(2000);
      await micBtn.dispatchEvent('mouseup');
    } catch {
      // mic button might not be visible; continue
    }
    await page.waitForTimeout(1000);
    await finalize(page, context, 'voice-mobile.mp4');
  } finally {
    await deleteSession(session.id);
  }
}

async function recordSessionsDesktop(browser) {
  console.log('Recording sessions-desktop...');
  const sessions = [];

  try {
    for (const name of ['frontend', 'backend', 'deploy']) {
      sessions.push(await createSession(name));
    }
    const context = await openContext(browser, DESKTOP);
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Click first session to open it
    const sessionCard = page.locator('.session-card, [class*="session"]').first();
    try {
      await sessionCard.waitFor({ timeout: 3000 });
      await sessionCard.click();
      await page.waitForTimeout(2500);
    } catch {
      await page.waitForTimeout(2500);
    }
    await finalize(page, context, 'sessions-desktop.mp4');
  } finally {
    for (const s of sessions) {
      await deleteSession(s.id).catch(() => {});
    }
  }
}

async function recordResumeDesktop(browser) {
  console.log('Recording resume-desktop...');
  const s1 = await createSession('api-server');
  const s2 = await createSession('debug-logs');

  try {
    const context = await openContext(browser, DESKTOP);
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Click a session to open it
    const sessionCard = page.locator('.session-card, [class*="session"]').first();
    try {
      await sessionCard.waitFor({ timeout: 3000 });
      await sessionCard.click();
      await page.waitForTimeout(2000);
    } catch {
      await page.waitForTimeout(2000);
    }
    await finalize(page, context, 'resume-desktop.mp4');
  } finally {
    await deleteSession(s1.id).catch(() => {});
    await deleteSession(s2.id).catch(() => {});
  }
}

async function recordGitdiffDesktop(browser) {
  console.log('Recording gitdiff-desktop...');
  const session = await createSession('demo-diff');
  const context = await openContext(browser, DESKTOP);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/terminal?session=${session.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);
    await typeCommand(page, 'git diff --color');
    await page.waitForTimeout(3000);
    await finalize(page, context, 'gitdiff-desktop.mp4');
  } finally {
    await deleteSession(session.id);
  }
}

async function recordUploadDesktop(browser) {
  console.log('Recording upload-desktop...');
  const session = await createSession('demo-upload');
  const context = await openContext(browser, DESKTOP);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/terminal?session=${session.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);
    await typeCommand(page, 'ls -la --color');
    await page.waitForTimeout(2500);
    await finalize(page, context, 'upload-desktop.mp4');
  } finally {
    await deleteSession(session.id);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(SHOWCASE_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log(`Output directory: ${SHOWCASE_DIR}`);
  console.log(`Temp directory:   ${TEMP_DIR}\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    await recordHubMobile(browser);
    await recordAgentsDesktop(browser);
    await recordTerminalMobile(browser);
    await recordVoiceMobile(browser);
    await recordSessionsDesktop(browser);
    await recordResumeDesktop(browser);
    await recordGitdiffDesktop(browser);
    await recordUploadDesktop(browser);
  } finally {
    await browser.close();
    // Clean up temp recordings
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('\n✅ All 8 showcase videos recorded and optimized!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
