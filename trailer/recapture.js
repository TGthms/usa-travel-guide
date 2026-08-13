#!/usr/bin/env node
'use strict';

/** Recapture currency (after rates), storm-city weather detail, and title cards. */

const path = require('path');
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');

const recaptureCards = process.argv.includes('--cards-only') ? 'cards' : 'all';

async function main() {
  if (recaptureCards === 'cards') {
    // Re-run only the card half via capture.js helpers by spawning capture after patching? 
    // Easier: duplicate the card loop here.
  }
  const r = spawnSync(process.execPath, [path.join(__dirname, 'capture.js')], {
    stdio: 'inherit',
    env: { ...process.env, TRAILER_RECAPTURE: recaptureCards },
  });
  process.exit(r.status || 0);
}

// If TRAILER_RECAPTURE is unset, this file can also run a focused pass itself.
if (!process.env.TRAILER_RECAPTURE && !process.argv.includes('--via-capture')) {
  focused().catch((e) => { console.error(e); process.exit(1); });
} else {
  main();
}

async function focused() {
  const fs = require('fs');
  const ROOT = __dirname;
  const STILLS = path.join(ROOT, 'stills');
  const CARDS = path.join(ROOT, 'cards');
  const BASE = process.env.TRAILER_BASE || 'http://127.0.0.1:8000';
  const PREFS = {
    'usa-travel-appearance': 'dark',
    'usa-travel-style': 'modern',
    'usa-travel-lang': 'en',
    'usa-travel-theme': 'glass',
    'usa-travel-motion': 'reduced',
  };
  const CHROME_HIDE = `
    #cursorCanvas, #progress-bar, .skip-link { display: none !important; }
    .reveal, .reveal-left, .reveal-right { opacity: 1 !important; transform: none !important; }
  `;

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

  async function ready() {
    await page.waitForFunction(() => {
      const loader = document.getElementById('loader');
      return !loader || loader.classList.contains('gone');
    }, null, { timeout: 25_000 });
    await page.addStyleTag({ content: CHROME_HIDE });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
  }

  console.log('Recapture currency…');
  await page.goto(`${BASE}/tools-currency.html`, { waitUntil: 'domcontentloaded' });
  await ready();
  await page.waitForFunction(() => {
    const el = document.getElementById('currencyResult');
    const t = ((el && el.textContent) || '').trim();
    return t.length > 0 && !/updating|ready|fetching/i.test(t);
  }, null, { timeout: 25_000 });
  await page.screenshot({ path: path.join(STILLS, 'currency.png'), type: 'png' });
  console.log('  still currency');

  console.log('Recapture weather (storm city)…');
  await page.goto(`${BASE}/tools-weather.html`, { waitUntil: 'domcontentloaded' });
  await ready();
  await page.waitForFunction(() => {
    const list = document.getElementById('weatherList');
    const loading = document.getElementById('weatherLoading');
    const stillLoading = loading && !loading.hidden;
    const rows = list ? list.querySelectorAll('.weather-row').length : 0;
    return rows > 2 && !stillLoading;
  }, null, { timeout: 45_000 });
  await page.screenshot({ path: path.join(STILLS, 'weather-list.png'), type: 'png' });
  const storm = page.locator('#weatherList .weather-row').filter({ hasText: /Thunderstorm|Rain|Storm/i }).first();
  const row = (await storm.count()) ? storm : page.locator('#weatherList .weather-row').first();
  await row.click();
  await page.waitForFunction(() => {
    const d = document.getElementById('weatherDetail');
    const mods = document.getElementById('weatherModules');
    return d && d.classList.contains('open') && mods && mods.children.length > 1;
  }, null, { timeout: 20_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(STILLS, 'weather-detail.png'), type: 'png' });
  console.log('  still weather-detail');

  console.log('Recapture title cards…');
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
    const qs = new URLSearchParams({ card: spec.card });
    if (spec.bg) qs.set('bg', spec.bg);
    await page.goto(`${BASE}/trailer/cards.html?${qs}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(CARDS, `${spec.card}.png`), type: 'png' });
    console.log('  card', spec.card);
  }

  await browser.close();
  console.log('Recapture done');
}
