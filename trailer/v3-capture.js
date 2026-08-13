#!/usr/bin/env node
'use strict';

/** Landing stills for trailer v3. Dark+Modern unless a theme take. */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const STILLS = path.join(ROOT, 'stills');
const BASE = process.env.TRAILER_BASE || 'http://127.0.0.1:8000';
fs.mkdirSync(STILLS, { recursive: true });

const HIDE = `
  #cursorCanvas, #progress-bar, .skip-link { display: none !important; }
  .reveal, .reveal-left, .reveal-right { opacity: 1 !important; transform: none !important; }
`;

function prefs(extra) {
  return {
    'usa-travel-appearance': 'dark',
    'usa-travel-style': 'modern',
    'usa-travel-lang': 'en',
    'usa-travel-theme': 'glass',
    'usa-travel-motion': 'full',
    'usa-travel-gallery-quality': 'medium',
    ...extra,
  };
}

async function boot(browser, extraPrefs) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    colorScheme: extraPrefs && extraPrefs['usa-travel-appearance'] === 'light' ? 'light' : 'dark',
    locale: 'en-US',
  });
  await context.addInitScript((p) => {
    for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v);
  }, prefs(extraPrefs));
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);
  return { context, page };
}

async function ready(page) {
  await page.addStyleTag({ content: HIDE });
  await page.waitForFunction(() => {
    const l = document.getElementById('loader');
    return !l || l.classList.contains('gone');
  }, null, { timeout: 20_000 }).catch(() => {});
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (_) { /* */ }
  await page.waitForTimeout(250);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(STILLS, `${name}.png`), type: 'png' });
  console.log('  still', name);
}

async function gotoReady(page, urlPath) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await ready(page);
}

async function scrollJump(page, sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) el.scrollIntoView({ block: 'start' });
  }, sel);
  await page.waitForTimeout(350);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Home sections
  {
    const { context, page } = await boot(browser);
    await gotoReady(page, '/index.html');
    await page.waitForFunction(() => {
      const img = document.getElementById('heroBgImg');
      return img && img.complete && img.naturalWidth > 40;
    }).catch(() => {});
    await shot(page, 'hero');
    await scrollJump(page, '#intro');
    await shot(page, 'intro');
    await scrollJump(page, '#gallery');
    await shot(page, 'gallery-teaser');
    await scrollJump(page, '#destinations');
    await shot(page, 'destinations');
    await scrollJump(page, '#regions');
    await shot(page, 'regions');
    await scrollJump(page, '#seasons');
    await shot(page, 'seasons');
    await scrollJump(page, '#culture');
    await shot(page, 'culture');
    await scrollJump(page, '#routes');
    await shot(page, 'routes');
    await scrollJump(page, '#practical');
    await shot(page, 'essentials');
    await scrollJump(page, '#tips');
    await shot(page, 'tips');
    await scrollJump(page, '#fun-facts');
    await page.waitForTimeout(200);
    await shot(page, 'funfacts');
    await page.locator('#funFactNext').click();
    await page.waitForTimeout(450);
    await shot(page, 'funfacts-full');
    await context.close();
  }

  // Theme cycle on hero
  for (const [name, extra] of [
    ['hero-classic', { 'usa-travel-appearance': 'dark', 'usa-travel-style': 'classic', 'usa-travel-theme': 'default' }],
    ['hero-light', { 'usa-travel-appearance': 'light', 'usa-travel-style': 'modern', 'usa-travel-theme': 'minimal' }],
    ['hero-elegant', { 'usa-travel-appearance': 'light', 'usa-travel-style': 'classic', 'usa-travel-theme': 'elegant' }],
  ]) {
    const { context, page } = await boot(browser, extra);
    await gotoReady(page, '/index.html');
    await page.waitForTimeout(400);
    await shot(page, name);
    await context.close();
  }

  // Motion: reduced + off on fun facts
  for (const [name, motion] of [['funfacts-reduced', 'reduced'], ['funfacts-off', 'off']]) {
    const { context, page } = await boot(browser, { 'usa-travel-motion': motion });
    await gotoReady(page, '/index.html#fun-facts');
    await scrollJump(page, '#fun-facts');
    await page.locator('#funFactNext').click();
    await page.waitForTimeout(motion === 'off' ? 80 : 200);
    await shot(page, name);
    await context.close();
  }

  // Gallery roads + CA-58 lightbox
  {
    const { context, page } = await boot(browser);
    await gotoReady(page, '/gallery.html');
    await page.waitForSelector('#galleryGrid .gallery-item');
    const roads = page.locator('.gallery-filter[data-filter="roads"]');
    if (await roads.count()) await roads.click();
    await page.waitForTimeout(500);
    await shot(page, 'gallery-roads');
    const baker = page.locator('#galleryGrid .gallery-item').filter({ hasText: /CA-58 Baker|Baker/i }).first();
    const tile = (await baker.count()) ? baker : page.locator('#galleryGrid .gallery-item:visible').first();
    await tile.click();
    await page.waitForSelector('#lightbox.open');
    await page.waitForFunction(() => {
      const p = document.getElementById('lightboxProgress');
      const img = document.getElementById('lightboxImg');
      return img && !img.hidden && img.naturalWidth > 40 && (!p || p.hidden);
    }, null, { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, 'lightbox-ca58');
    await context.close();
  }

  // Tools
  {
    const { context, page } = await boot(browser);
    await gotoReady(page, '/tools.html');
    await shot(page, 'tools-hub');
    await gotoReady(page, '/tools-currency.html');
    await page.waitForFunction(() => {
      const t = ((document.getElementById('currencyResult') || {}).textContent || '');
      return t.trim() && !/updating|ready|fetching/i.test(t);
    }, null, { timeout: 20_000 }).catch(() => {});
    await shot(page, 'currency');
    await gotoReady(page, '/tools-tip-tax.html');
    await page.waitForTimeout(400);
    await shot(page, 'tip-tax');
    await gotoReady(page, '/tools-clock.html');
    await page.waitForSelector('#worldClockList .clock-row, #worldClockList > *', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, 'clock');
    await gotoReady(page, '/tools-emergency.html');
    await shot(page, 'emergency');
    await gotoReady(page, '/tools-drive.html');
    await page.waitForTimeout(300);
    await shot(page, 'drive');
    await context.close();
  }

  // Weather storm city
  {
    const { context, page } = await boot(browser);
    await gotoReady(page, '/tools-weather.html');
    const ok = await page.waitForFunction(() => {
      const list = document.getElementById('weatherList');
      const loading = document.getElementById('weatherLoading');
      const rows = list ? list.querySelectorAll('.weather-row').length : 0;
      return rows > 2 && !(loading && !loading.hidden);
    }, null, { timeout: 90_000 }).then(() => true).catch(() => false);
    if (ok) {
      await shot(page, 'weather-list');
      const storm = page.locator('#weatherList .weather-row').filter({ hasText: /Thunderstorm|Rain|Storm/i }).first();
      const row = (await storm.count()) ? storm : page.locator('#weatherList .weather-row').first();
      await row.click();
      await page.waitForFunction(() => {
        const d = document.getElementById('weatherDetail');
        const mods = document.getElementById('weatherModules');
        return d && d.classList.contains('open') && mods && mods.children.length > 1;
      }, null, { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(2500);
      await shot(page, 'weather-detail');
    } else {
      console.warn('  weather did not load');
    }
    await context.close();
  }

  // Settings over hero
  {
    const { context, page } = await boot(browser);
    await gotoReady(page, '/index.html');
    await page.locator('#settingsOpen').click();
    await page.waitForSelector('#settingsOverlay.open');
    await page.waitForTimeout(350);
    await shot(page, 'settings');
    await context.close();
  }

  await browser.close();
  console.log('v3 stills done');
}

main().catch((err) => { console.error(err); process.exit(1); });
