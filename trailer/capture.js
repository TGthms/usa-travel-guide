#!/usr/bin/env node
'use strict';

/**
 * Capture 1080p Dark+Modern stills for the America trailer.
 * Requires the static server on :8000 (npm run serve:static).
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const STILLS = path.join(ROOT, 'stills');
const CARDS = path.join(ROOT, 'cards');
const BASE = process.env.TRAILER_BASE || 'http://127.0.0.1:8000';

fs.mkdirSync(STILLS, { recursive: true });
fs.mkdirSync(CARDS, { recursive: true });

const PREFS = {
  'usa-travel-appearance': 'dark',
  'usa-travel-style': 'modern',
  'usa-travel-lang': 'en',
  'usa-travel-theme': 'glass',
  'usa-travel-motion': 'reduced',
};

const CHROME_HIDE = `
  #cursorCanvas, #progress-bar, .skip-link { display: none !important; }
  .reveal, .reveal-left, .reveal-right {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    transition: none !important;
  }
`;

async function shot(page, name) {
  const file = path.join(STILLS, `${name}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log('  still', name);
  return file;
}

async function ready(page, { waitImages = true } = {}) {
  await page.waitForFunction(() => {
    const loader = document.getElementById('loader');
    return !loader || loader.classList.contains('gone');
  }, null, { timeout: 25_000 });
  await page.addStyleTag({ content: CHROME_HIDE });
  if (documentFontsReady) await documentFontsReady(page);
  if (waitImages) await waitVisibleImages(page);
  await page.waitForTimeout(350);
}

async function documentFontsReady(page) {
  try {
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  } catch (_) { /* ignore */ }
}

async function waitVisibleImages(page) {
  await page.evaluate(async () => {
    const imgs = [...document.images].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight + 200;
    });
    await Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth) return null;
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 4000);
      });
    }));
  });
}

async function goto(page, urlPath) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await ready(page);
}

async function scrollTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -12);
  }, selector);
  await page.waitForTimeout(450);
  await waitVisibleImages(page);
}

async function captureSite(page) {
  await goto(page, '/index.html');
  await page.waitForTimeout(400);
  await shot(page, 'hero');

  await scrollTo(page, '#intro');
  await shot(page, 'intro');

  await scrollTo(page, '#regions');
  await shot(page, 'regions');

  await scrollTo(page, '#gallery');
  await shot(page, 'gallery-teaser');

  await scrollTo(page, '#destinations');
  await page.waitForTimeout(300);
  await shot(page, 'destinations');

  await scrollTo(page, '#practical');
  await shot(page, 'essentials');

  await scrollTo(page, '#seasons');
  await shot(page, 'seasons');

  await scrollTo(page, '#culture');
  await shot(page, 'culture');

  await scrollTo(page, '#routes');
  await shot(page, 'routes');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.locator('#settingsOpen').click();
  await page.waitForSelector('#settingsOverlay.open', { timeout: 8_000 });
  await page.waitForTimeout(400);
  await shot(page, 'settings');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await goto(page, '/gallery.html');
  await page.waitForSelector('#galleryGrid .gallery-item img', { timeout: 20_000 });
  await page.waitForTimeout(700);
  await waitVisibleImages(page);
  await shot(page, 'gallery-masonry');

  const firstTile = page.locator('#galleryGrid .gallery-item').first();
  await firstTile.click();
  await page.waitForSelector('#lightbox.open', { timeout: 10_000 });
  await page.waitForFunction(() => {
    const img = document.getElementById('lightboxImg');
    const progress = document.getElementById('lightboxProgress');
    const imgOk = img && !img.hidden && img.naturalWidth > 40;
    const busy = progress && !progress.hidden;
    return imgOk && !busy;
  }, null, { timeout: 15_000 });
  await page.waitForTimeout(400);
  await shot(page, 'gallery-lightbox');
  await page.keyboard.press('Escape');

  await goto(page, '/tools.html');
  await shot(page, 'tools-hub');

  await goto(page, '/tools-currency.html');
  await page.waitForFunction(() => {
    const el = document.getElementById('currencyResult');
    const t = ((el && el.textContent) || '').trim();
    return t.length > 0 && !/updating|ready|fetching/i.test(t);
  }, null, { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(200);

  await goto(page, '/tools-drive.html');
  await page.waitForTimeout(600);
  await shot(page, 'drive');

  await goto(page, '/tools-clock.html');
  await page.waitForTimeout(400);
  await shot(page, 'clock');

  await goto(page, '/tools-weather.html');
  const weatherOk = await page.waitForFunction(() => {
    const list = document.getElementById('weatherList');
    const loading = document.getElementById('weatherLoading');
    const stillLoading = loading && !loading.hidden;
    const rows = list ? list.querySelectorAll('.weather-row').length : 0;
    const skel = list ? list.querySelectorAll('.weather-skeleton-row').length : 0;
    return rows > 2 && !stillLoading && skel === 0;
  }, null, { timeout: 45_000 }).then(() => true).catch(() => false);

  if (weatherOk) {
    await page.waitForTimeout(400);
    await shot(page, 'weather-list');
    const stormRow = page.locator('#weatherList .weather-row').filter({ hasText: /Thunderstorm|Rain|Storm/i }).first();
    const row = (await stormRow.count()) ? stormRow : page.locator('#weatherList .weather-row').first();
    await row.click();
    const detailOk = await page.waitForFunction(() => {
      const d = document.getElementById('weatherDetail');
      const mods = document.getElementById('weatherModules');
      return d && d.classList.contains('open') && mods && mods.children.length > 1;
    }, null, { timeout: 20_000 }).then(() => true).catch(() => false);
    if (detailOk) {
      await page.waitForTimeout(700);
      await shot(page, 'weather-detail');
    } else {
      console.warn('  weather detail did not open — using list only');
    }
  } else {
    console.warn('  weather list did not populate — skip weather stills');
  }
}

async function captureCards(page) {
  const overlays = [
    { card: 'america-black' },
    { card: 'guide-black' },
    { card: 'road-black' },
    { card: 'states-black' },
    { card: 'sky-black' },
    { card: 'yours-black' },
    { card: 'end' },
    { card: 'sky-over', bg: 'plates/storm.jpg' },
  ];

  for (const spec of overlays) {
    if (spec.bg && !fs.existsSync(path.join(ROOT, spec.bg))) {
      console.warn('  skip card', spec.card, 'missing', spec.bg);
      continue;
    }
    const qs = new URLSearchParams({ card: spec.card });
    if (spec.bg) qs.set('bg', spec.bg);
    await page.goto(`${BASE}/trailer/cards.html?${qs.toString()}`, {
      waitUntil: 'networkidle',
      timeout: 20_000,
    });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(250);
    const file = path.join(CARDS, `${spec.card}.png`);
    await page.screenshot({ path: file, type: 'png' });
    console.log('  card', spec.card);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    locale: 'en-US',
  });
  await context.addInitScript((prefs) => {
    for (const [k, v] of Object.entries(prefs)) localStorage.setItem(k, v);
  }, PREFS);

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  console.log('Capturing site stills…');
  await captureSite(page);

  // Title cards at 1x look softer; keep 2x for Ken Burns sources.
  console.log('Capturing title cards…');
  await captureCards(page);

  await browser.close();
  console.log('Done. Stills in trailer/stills and trailer/cards');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
