#!/usr/bin/env node
'use strict';

/**
 * Record live Dark+Modern UI motion for the trailer (not stills).
 * Requires the static server on :8000.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const RAW = path.join(ROOT, 'raw');
const CARDS = path.join(ROOT, 'cards');
const BASE = process.env.TRAILER_BASE || 'http://127.0.0.1:8000';

fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(CARDS, { recursive: true });

const PREFS = {
  'usa-travel-appearance': 'dark',
  'usa-travel-style': 'modern',
  'usa-travel-lang': 'en',
  'usa-travel-theme': 'glass',
  'usa-travel-motion': 'full',
  'usa-travel-gallery-quality': 'medium',
};

const HIDE = `
  #cursorCanvas, #progress-bar, .skip-link { display: none !important; }
`;

const KILL_LOADER = `
  (function () {
    function hide() {
      var l = document.getElementById('loader');
      if (l) l.classList.add('gone');
    }
    hide();
    document.addEventListener('DOMContentLoaded', hide);
    new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
  })();
`;

async function easeScrollY(page, selector, ms) {
  await page.evaluate(async ({ selector, ms }) => {
    const el = document.querySelector(selector);
    const target = el ? el.getBoundingClientRect().top + window.scrollY - 4 : 0;
    const start = window.scrollY;
    const dist = target - start;
    const t0 = performance.now();
    await new Promise((resolve) => {
      function tick(now) {
        const p = Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        window.scrollTo(0, start + dist * e);
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });
  }, { selector, ms });
}

async function easeScrollX(page, selector, delta, ms) {
  await page.evaluate(async ({ selector, delta, ms }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    const start = el.scrollLeft;
    const dest = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, start + delta));
    const t0 = performance.now();
    await new Promise((resolve) => {
      function tick(now) {
        const p = Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        el.scrollLeft = start + (dest - start) * e;
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });
  }, { selector, delta, ms });
}

async function ready(page) {
  await page.addStyleTag({ content: HIDE });
  await page.waitForFunction(() => {
    const loader = document.getElementById('loader');
    return !loader || loader.classList.contains('gone');
  }, null, { timeout: 20_000 }).catch(() => {});
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch (_) { /* ignore */ }
}

const MARKS = {};

const ONLY = new Set(
  (process.env.TAKE || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

async function recordTake(browser, name, fn) {
  if (ONLY.size && !ONLY.has(name)) {
    console.log('  skip', name);
    return;
  }
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'en-US',
    recordVideo: {
      dir: RAW,
      size: { width: 1920, height: 1080 },
    },
  });
  await context.addInitScript((prefs) => {
    for (const [k, v] of Object.entries(prefs)) localStorage.setItem(k, v);
  }, PREFS);
  await context.addInitScript(KILL_LOADER);

  const page = await context.newPage();
  page.setDefaultTimeout(25_000);
  const t0 = Date.now();
  const mark = (label) => {
    MARKS[name] = MARKS[name] || {};
    MARKS[name][label] = +((Date.now() - t0) / 1000).toFixed(2);
    console.log('    mark', name, label, MARKS[name][label]);
  };
  console.log('  take', name);
  try {
    await fn(page, mark);
    await page.waitForTimeout(280);
  } catch (err) {
    console.error('  take failed', name, err.message);
  }
  await page.close();
  await context.close();

  // Playwright writes a random webm; pick the newest file in RAW and rename.
  const files = fs.readdirSync(RAW)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => ({ f, t: fs.statSync(path.join(RAW, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error('No webm recorded for ' + name);
  const dest = path.join(RAW, `${name}.webm`);
  const src = path.join(RAW, files[0].f);
  if (src !== dest) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(src, dest);
  }
  const st = fs.statSync(dest);
  console.log('    ->', name + '.webm', (st.size / 1024 / 1024).toFixed(1) + ' MB');
}

async function captureSupers(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const names = ['america-super', 'guide-super', 'states-super', 'sky-super', 'yours-super', 'end'];
  for (const card of names) {
    const qs = new URLSearchParams({ card, clear: card === 'end' ? '0' : '1' });
    await page.goto(`${BASE}/trailer/cards.html?${qs}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(CARDS, `${card}.png`),
      type: 'png',
      omitBackground: card !== 'end',
    });
    console.log('  overlay', card);
  }
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  await recordTake(browser, '01-home', async (page, mark) => {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await page.waitForFunction(() => {
      const img = document.getElementById('heroBgImg');
      return img && img.complete && img.naturalWidth > 40;
    }, null, { timeout: 15_000 }).catch(() => {});
    mark('action');
    await page.waitForTimeout(2800);
    mark('scrollIntro');
    await easeScrollY(page, '#intro', 2600);
    mark('holdIntro');
    await page.waitForTimeout(1600);
    mark('scrollGallery');
    await easeScrollY(page, '#gallery', 2800);
    mark('holdTeaser');
    await page.waitForTimeout(2000);
    mark('end');
  });

  await recordTake(browser, '02-gallery', async (page, mark) => {
    await page.goto(`${BASE}/gallery.html`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await page.waitForSelector('#galleryGrid .gallery-item img', { timeout: 20_000 });
    mark('action');
    await page.waitForTimeout(1400);
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(700);
    mark('click');
    await page.locator('#galleryGrid .gallery-item').first().click();
    await page.waitForSelector('#lightbox.open', { timeout: 10_000 });
    await page.waitForFunction(() => {
      const p = document.getElementById('lightboxProgress');
      return !p || p.hidden;
    }, null, { timeout: 12_000 }).catch(() => {});
    mark('lightbox');
    await page.waitForTimeout(1400);
    if (await page.locator('#lightboxNext').count()) {
      await page.locator('#lightboxNext').click();
      await page.waitForFunction(() => {
        const p = document.getElementById('lightboxProgress');
        return !p || p.hidden;
      }, null, { timeout: 12_000 }).catch(() => {});
      mark('next');
      await page.waitForTimeout(1800);
    }
    mark('end');
  });

  await recordTake(browser, '03-dest', async (page, mark) => {
    await page.goto(`${BASE}/index.html#destinations`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await page.evaluate(() => {
      const el = document.getElementById('destinations');
      if (el) el.scrollIntoView({ block: 'start' });
    });
    mark('action');
    await page.waitForTimeout(900);
    mark('pan');
    await easeScrollX(page, '#destTrack', 1100, 3800);
    await page.waitForTimeout(800);
    const right = page.locator('#destScrollRight');
    if (await right.count()) {
      await right.click();
      await page.waitForTimeout(900);
    }
    mark('end');
  });

  await recordTake(browser, '04-regions', async (page, mark) => {
    await page.goto(`${BASE}/index.html#regions`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await page.evaluate(() => {
      const el = document.getElementById('regions');
      if (el) el.scrollIntoView({ block: 'start' });
    });
    mark('action');
    await page.waitForTimeout(800);
    await easeScrollX(page, '#regionsTrack', 720, 2400);
    await page.waitForTimeout(500);
    mark('toSeasons');
    await easeScrollY(page, '#seasons', 2600);
    await page.waitForTimeout(1600);
    mark('end');
  });

  await recordTake(browser, '05-tools', async (page, mark) => {
    await page.goto(`${BASE}/tools.html`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    mark('action');
    await page.waitForTimeout(900);
    const cards = page.locator('.tools-hub-card');
    const n = await cards.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      await cards.nth(i).hover();
      await page.waitForTimeout(280);
    }
    mark('clickCurrency');
    await page.locator('a[href="tools-currency.html"]').click();
    await page.waitForURL(/tools-currency/, { timeout: 10_000 }).catch(() => {});
    await ready(page);
    await page.waitForFunction(() => {
      const el = document.getElementById('currencyResult');
      const t = ((el && el.textContent) || '').trim();
      return t.length > 0 && !/updating|ready|fetching/i.test(t);
    }, null, { timeout: 20_000 }).catch(() => {});
    mark('rate');
    await page.waitForTimeout(2800);
    mark('end');
  });

  await recordTake(browser, '06-drive', async (page, mark) => {
    await page.goto(`${BASE}/tools-drive.html`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    mark('action');
    await page.waitForTimeout(600);
    const dist = page.locator('#driveDist');
    if (await dist.count()) {
      await dist.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type('850', { delay: 110 });
      await page.waitForTimeout(2200);
    } else {
      await page.waitForTimeout(1600);
    }
    mark('end');
  });

  await recordTake(browser, '07-weather', async (page, mark) => {
    await page.goto(`${BASE}/tools-weather.html`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await page.waitForFunction(() => {
      const list = document.getElementById('weatherList');
      const loading = document.getElementById('weatherLoading');
      const still = loading && !loading.hidden;
      const rows = list ? list.querySelectorAll('.weather-row').length : 0;
      return rows > 2 && !still;
    }, null, { timeout: 90_000 });
    mark('action');
    await page.waitForTimeout(1100);
    const storm = page.locator('#weatherList .weather-row').filter({ hasText: /Thunderstorm|Rain|Storm/i }).first();
    const row = (await storm.count()) ? storm : page.locator('#weatherList .weather-row').first();
    mark('click');
    await row.click();
    await page.waitForFunction(() => {
      const d = document.getElementById('weatherDetail');
      return d && d.classList.contains('open');
    }, null, { timeout: 20_000 });
    mark('detail');
    await page.waitForTimeout(5200);
    mark('end');
  });

  await recordTake(browser, '08-settings', async (page, mark) => {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await ready(page);
    mark('action');
    await page.waitForTimeout(700);
    await page.locator('#settingsOpen').click();
    await page.waitForSelector('#settingsOverlay.open', { timeout: 8_000 });
    mark('open');
    await page.waitForTimeout(2200);
    mark('end');
  });

  const marksPath = path.join(RAW, 'marks.json');
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(marksPath, 'utf8')); } catch (_) { /* first run */ }
  fs.writeFileSync(marksPath, JSON.stringify({ ...prev, ...MARKS }, null, 2));
  if (!ONLY.size) {
    console.log('Overlays…');
    await captureSupers(browser);
  }
  await browser.close();
  console.log('Record done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
