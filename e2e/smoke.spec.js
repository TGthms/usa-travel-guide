// @ts-check
'use strict';

const { test, expect } = require('@playwright/test');

/** Resolved data-theme for Appearance × Style */
const THEME_MATRIX = [
  { appearance: 'light', style: 'modern', theme: 'minimal' },
  { appearance: 'light', style: 'classic', theme: 'elegant' },
  { appearance: 'dark', style: 'classic', theme: 'default' },
  { appearance: 'dark', style: 'modern', theme: 'glass' },
];
const LANGS = ['en', 'es', 'zh', 'ja'];
const TOOL_PAGES = [
  '/tools-currency.html',
  '/tools-clock.html',
  '/tools-tip-tax.html',
  '/tools-drive.html',
  '/tools-emergency.html',
  '/tools-weather.html',
];

/** Prefer domcontentloaded — gallery/tools load many assets; full "load" is flaky in CI. */
async function gotoPage(page, path, opts = {}) {
  return page.goto(path, { waitUntil: 'domcontentloaded', timeout: 25_000, ...opts });
}

async function openSettings(page) {
  await page.locator('#settingsOpen').click();
  await expect(page.locator('#settingsOverlay')).toHaveClass(/open/);
}

async function closeSettings(page) {
  await page.locator('#settingsClose').click();
  await expect(page.locator('#settingsOverlay')).not.toHaveClass(/open/);
}

async function waitAppReady(page) {
  await page.waitForFunction(() => {
    return typeof window.applyLanguage === 'function';
  }, null, { timeout: 15_000 });
}

async function waitLoaderGone(page) {
  const loader = page.locator('#loader');
  if (await loader.count() === 0) return;
  await expect(loader).toHaveClass(/gone/, { timeout: 20_000 });
}

/** Ignore benign noise; surface real page script failures. */
function isBenignConsoleError(text) {
  const t = String(text || '');
  if (/favicon/i.test(t)) return true;
  if (/Failed to load resource/i.test(t) && /net::ERR_/i.test(t)) return true;
  return false;
}

/**
 * Block live weather/geocode/AQ APIs so e2e never drains NWS / Open-Meteo quotas.
 * Product still works with live APIs in the browser; tests only exercise chrome + fail-closed paths.
 */
async function blockLiveWeatherApis(page) {
  await page.route(/api\.weather\.gov|api\.open-meteo\.com|air-quality-api\.open-meteo\.com|geocoding-api\.open-meteo\.com/, (route) => {
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: true, reason: 'e2e blocked — do not drain live weather APIs' }),
    });
  });
}

/**
 * Fixture weather APIs so list rows paint with real pack.weather and openDetail can run
 * without hitting live NWS/Open-Meteo (and without the prior openDetail ReferenceError path).
 */
async function fixtureWeatherApis(page) {
  const now = Date.now();
  const isoHour = (h) => new Date(now + h * 3600000).toISOString();
  const dayIso = (d) => {
    const t = new Date(now + d * 86400000);
    return t.toISOString().slice(0, 10);
  };
  const nwsHourlyPeriods = Array.from({ length: 24 }, (_, i) => ({
    startTime: isoHour(i),
    endTime: isoHour(i + 1),
    isDaytime: i % 24 < 18,
    temperature: 70 + (i % 5),
    temperatureUnit: 'F',
    windSpeed: '8 mph',
    windDirection: 'SW',
    shortForecast: i % 3 === 0 ? 'Partly Cloudy' : 'Sunny',
    probabilityOfPrecipitation: { value: 10 },
  }));
  const nwsDayPeriods = [];
  for (let d = 0; d < 7; d++) {
    nwsDayPeriods.push({
      startTime: dayIso(d) + 'T12:00:00-04:00',
      isDaytime: true,
      temperature: 78,
      temperatureUnit: 'F',
      shortForecast: 'Sunny',
    });
    nwsDayPeriods.push({
      startTime: dayIso(d) + 'T00:00:00-04:00',
      isDaytime: false,
      temperature: 58,
      temperatureUnit: 'F',
      shortForecast: 'Clear',
    });
  }
  const omCurrent = {
    time: isoHour(0),
    temperature_2m: 22,
    relative_humidity_2m: 55,
    apparent_temperature: 21,
    weather_code: 2,
    wind_speed_10m: 3.5,
    wind_direction_10m: 220,
    surface_pressure: 1012,
    visibility: 10000,
    precipitation: 0,
  };
  const omHourly = {
    time: Array.from({ length: 24 }, (_, i) => isoHour(i)),
    temperature_2m: Array.from({ length: 24 }, (_, i) => 18 + (i % 6)),
    apparent_temperature: Array.from({ length: 24 }, (_, i) => 17 + (i % 6)),
    weather_code: Array.from({ length: 24 }, () => 2),
    precipitation_probability: Array.from({ length: 24 }, () => 12),
    precipitation: Array.from({ length: 24 }, () => 0),
    wind_speed_10m: Array.from({ length: 24 }, () => 3),
    wind_direction_10m: Array.from({ length: 24 }, () => 200),
    relative_humidity_2m: Array.from({ length: 24 }, () => 50),
    surface_pressure: Array.from({ length: 24 }, () => 1012),
    uv_index: Array.from({ length: 24 }, () => 3),
  };
  const omDaily = {
    time: Array.from({ length: 10 }, (_, d) => dayIso(d)),
    weather_code: Array.from({ length: 10 }, () => 2),
    temperature_2m_max: Array.from({ length: 10 }, () => 26),
    temperature_2m_min: Array.from({ length: 10 }, () => 14),
    sunrise: Array.from({ length: 10 }, (_, d) => dayIso(d) + 'T10:30:00Z'),
    sunset: Array.from({ length: 10 }, (_, d) => dayIso(d) + 'T00:15:00Z'),
    uv_index_max: Array.from({ length: 10 }, () => 6),
    precipitation_sum: Array.from({ length: 10 }, () => 0),
    precipitation_probability_max: Array.from({ length: 10 }, () => 20),
  };
  const omPack = {
    latitude: 40.71,
    longitude: -74.01,
    timezone: 'America/New_York',
    current: omCurrent,
    hourly: omHourly,
    daily: omDaily,
  };

  await page.route(/api\.weather\.gov\/points\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify({
        properties: {
          gridId: 'OKX',
          gridX: 33,
          gridY: 37,
          timeZone: 'America/New_York',
          forecast: 'https://api.weather.gov/gridpoints/OKX/33,37/forecast',
          forecastHourly: 'https://api.weather.gov/gridpoints/OKX/33,37/forecast/hourly',
        },
      }),
    });
  });
  await page.route(/api\.weather\.gov\/gridpoints\/.+\/forecast(\/hourly)?/, async (route) => {
    const hourly = /\/hourly/.test(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify({
        properties: {
          periods: hourly ? nwsHourlyPeriods : nwsDayPeriods,
        },
      }),
    });
  });
  await page.route(/api\.weather\.gov\/alerts/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify({ features: [] }),
    });
  });
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, async (route) => {
    const url = route.request().url();
    // Batch requests use comma-separated lats — return array of packs
    if (/latitude=[^&]*,/.test(url)) {
      const n = (url.match(/latitude=([^&]+)/) || [])[1].split(',').length;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(Array.from({ length: n }, () => omPack)),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(omPack),
    });
  });
  await page.route(/air-quality-api\.open-meteo\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: { us_aqi: 42, pm2_5: 8, pm10: 12, european_aqi: 30 },
      }),
    });
  });
  await page.route(/geocoding-api\.open-meteo\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{
          id: 1, name: 'Boston', latitude: 42.36, longitude: -71.06,
          admin1: 'Massachusetts', country: 'United States', country_code: 'US',
          timezone: 'America/New_York',
        }],
      }),
    });
  });
}

test.describe('USA Travel Guide smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage once per test context (not on every navigation — favorites/return stamps must persist)
    await page.addInitScript(() => {
      try {
        if (sessionStorage.getItem('__e2e_inited') === '1') return;
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('__e2e_inited', '1');
      } catch (_) { /* ignore */ }
    });
  });

  test('loads main + tool pages without console page errors', async ({ page }) => {
    test.setTimeout(90_000);
    await blockLiveWeatherApis(page);
    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err && err.message ? err.message : String(err));
    });
    const paths = [
      '/index.html',
      '/gallery.html',
      '/tools.html',
      ...TOOL_PAGES,
      '/privacy.html',
      '/terms.html',
    ];
    for (const path of paths) {
      const res = await gotoPage(page, path);
      expect(res && res.ok(), `${path} should return OK`).toBeTruthy();
      await expect(page.locator('link[href="src/css/styles.css"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/core/env.js"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/core/runtime.js"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/app.js"]')).toHaveCount(1);
      await waitAppReady(page);
    }
    const real = pageErrors.filter((m) => !isBenignConsoleError(m));
    expect(real, real.join('\n')).toEqual([]);
  });

  test('cycles appearance × style theme matrix', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await openSettings(page);
    // System default
    await page.locator('#appearancePillGroup .pill-btn[data-appearance-val="system"]').click();
    await expect(page.locator('#appearancePillGroup .pill-btn[data-appearance-val="system"]')).toHaveClass(/active/);
    const storedApp = await page.evaluate(() => localStorage.getItem('usa-travel-appearance'));
    expect(storedApp).toBe('system');

    for (const row of THEME_MATRIX) {
      await page.locator(`#appearancePillGroup .pill-btn[data-appearance-val="${row.appearance}"]`).click();
      await page.locator(`#stylePillGroup .pill-btn[data-style-val="${row.style}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', row.theme);
      await expect(page.locator(`#appearancePillGroup .pill-btn[data-appearance-val="${row.appearance}"]`)).toHaveClass(/active/);
      await expect(page.locator(`#stylePillGroup .pill-btn[data-style-val="${row.style}"]`)).toHaveClass(/active/);
    }
    await closeSettings(page);
  });

  test('cycles all four languages', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await openSettings(page);
    for (const lang of LANGS) {
      await page.locator(`#langPillGroup .pill-btn[data-lang-val="${lang}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('data-lang', lang);
      const stored = await page.evaluate(() => localStorage.getItem('usa-travel-lang'));
      expect(stored).toBe(lang);
    }
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    await expect(page.locator('[data-i18n="nav.gallery"]').first()).not.toHaveText('Gallery');
  });

  test('toggles destination favorites and persists', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    const fav = page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn');
    await fav.scrollIntoViewIfNeeded();
    await expect(fav).not.toHaveClass(/active/);

    await fav.click();
    await expect(fav).toHaveClass(/active/);

    const stored = await page.evaluate(() => localStorage.getItem('usa-travel-favorites'));
    expect(stored).toContain('nyc');

    // goto (not reload) — more stable against static-server keep-alive races
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await expect(page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn')).toHaveClass(/active/);

    await page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn').click();
    await expect(page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn')).not.toHaveClass(/active/);
  });

  test('saved filter empty state survives language round-trip to English', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await page.locator('#destFilterBar [data-filter="saved"]').click();
    await expect(page.locator('#destEmptyState')).toHaveClass(/show/);
    await expect(page.locator('#destEmptyState')).toContainText(/haven't saved|saved any cities/i);

    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    await expect(page.locator('#destEmptyState')).toContainText(/收藏/);

    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="en"]').click();
    await closeSettings(page);
    await expect(page.locator('#destEmptyState')).toContainText(/haven't saved|saved any cities/i);
    await expect(page.locator('#destEmptyState')).not.toContainText(/match this region/i);
    await expect(page.locator('#destEmptyState')).toHaveAttribute('data-i18n', 'dest.emptyStateSaved');
  });

  test('gallery page filters and chrome are visible', async ({ page }) => {
    await gotoPage(page, '/gallery.html');
    await waitLoaderGone(page);
    await expect(page.locator('#galleryGrid .gallery-item').first()).toBeVisible();
    await page.locator('.gallery-filter[data-filter="coast"]').click();
    await expect(page.locator('.gallery-filter[data-filter="coast"]')).toHaveClass(/active/);
    await expect(page.locator('#galleryHeading')).toBeVisible();
    await expect(page.locator('#gallerySearch')).toBeVisible();
    await expect(page.locator('.gallery-app-header')).toHaveCSS('opacity', '1');
  });

  test('gallery lightbox opens and navigates', async ({ page }) => {
    await gotoPage(page, '/gallery.html');
    await page.waitForFunction(() => {
      const loader = document.getElementById('loader');
      const ready = !loader || loader.classList.contains('gone');
      const n = document.querySelectorAll('#galleryGrid .gallery-item:not(.hidden):not(.load-error)').length;
      return document.body.classList.contains('page-gallery') && ready && n > 1;
    });
    await page.evaluate(() => {
      const item = document.querySelector('#galleryGrid .gallery-item:not(.hidden):not(.load-error)');
      if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    await expect(page.locator('#lightbox')).toHaveClass(/open/, { timeout: 10_000 });
    // Photo tiles use #lightboxImg; video tiles use #lightboxVideo
    await expect(page.locator('#lightboxImg:not([hidden]), #lightboxVideo:not([hidden])').first())
      .toBeVisible({ timeout: 10_000 });
    const before = await page.locator('#lightboxCounter').textContent();
    await page.locator('#lightboxNext').click();
    await expect(page.locator('#lightboxCounter')).not.toHaveText(before || '', { timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).not.toHaveClass(/open/);
  });

  test('gallery masonry does not reparent tiles while scrolling', async ({ page }) => {
    await gotoPage(page, '/gallery.html');
    await page.waitForFunction(() => {
      const loader = document.getElementById('loader');
      const ready = !loader || loader.classList.contains('gone');
      return document.body.classList.contains('page-gallery') && ready
        && document.querySelectorAll('.gallery-item').length > 5;
    });
    const moves = await page.evaluate(async () => {
      let count = 0;
      const orig = Element.prototype.appendChild;
      Element.prototype.appendChild = function appendChildInstrumented(child) {
        if (this.classList && this.classList.contains('gallery-col')
          && child && child.classList && child.classList.contains('gallery-item')) {
          count += 1;
        }
        return orig.call(this, child);
      };
      for (let i = 0; i < 12; i++) {
        window.scrollBy(0, 280);
        await new Promise((r) => setTimeout(r, 90));
      }
      Element.prototype.appendChild = orig;
      return count;
    });
    expect(moves).toBe(0);
  });

  test('tools hub lists all tools and navigates', async ({ page }) => {
    await gotoPage(page, '/tools.html');
    await waitLoaderGone(page);
    await expect(page.locator('.tools-hub-card')).toHaveCount(6);
    await expect(page.locator('a.tools-hub-card[href="tools-currency.html"]')).toBeVisible();
    await expect(page.locator('a.tools-hub-card[href="tools-weather.html"]')).toBeVisible();
    await page.locator('a.tools-hub-card[href="tools-currency.html"]').click();
    await expect(page).toHaveURL(/tools-currency\.html/);
    await expect(page.locator('#currencyAmount')).toBeVisible();
  });

  test('currency tool localizes names and swap works', async ({ page }) => {
    await gotoPage(page, '/tools-currency.html');
    await page.waitForFunction(() => document.querySelectorAll('#currencyFrom option').length >= 5);
    await expect(page.locator('#currencyFrom option[value="USD"]')).toContainText(/Dollar|USD/);
    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    await expect(page.locator('#currencyFrom option[value="USD"]')).toContainText('美元');
    const fromBefore = await page.locator('#currencyFrom').inputValue();
    const toBefore = await page.locator('#currencyTo').inputValue();
    await page.locator('#currencySwap').click();
    await expect(page.locator('#currencyFrom')).toHaveValue(toBefore);
    await expect(page.locator('#currencyTo')).toHaveValue(fromBefore);
  });

  test('currency meta shows rate and last-updated stamp', async ({ page }) => {
    await gotoPage(page, '/tools-currency.html');
    await waitLoaderGone(page);
    // Ensure different currencies so a network rate is fetched
    await page.locator('#currencyFrom').selectOption('USD');
    await page.locator('#currencyTo').selectOption('EUR');
    await page.locator('#currencyAmount').fill('100');
    await page.waitForFunction(() => {
      const meta = document.getElementById('currencyMeta');
      const text = (meta && meta.textContent) || '';
      // Success: pair + updated label, or offline: connection message
      return /1\s+USD\s*=/.test(text)
        || /Updated|Actualizado|更新|check|connection|conexión|连接|接続/i.test(text);
    }, null, { timeout: 25_000 });
    const meta = await page.locator('#currencyMeta').textContent();
    // When online, expect labeled last-updated (not bare ISO alone)
    if (/1\s+USD\s*=/.test(meta || '')) {
      expect(meta).toMatch(/Updated|Actualizado|更新/i);
    }
  });

  test('motion Off sets data-motion-effective', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await openSettings(page);
    await page.locator('#motionPillGroup .pill-btn[data-motion-val="off"]').click();
    await closeSettings(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion-effective', 'off');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  });

  test('settings panel lives inside the overlay dialog', async ({ page }) => {
    const paths = ['/index.html', '/gallery.html', '/tools-weather.html'];
    for (const path of paths) {
      await gotoPage(page, path);
      await waitAppReady(page);
      const overlay = page.locator('#settingsOverlay');
      await expect(overlay, `${path} overlay is the dialog`).toHaveAttribute('role', 'dialog');
      await expect(overlay.locator('#settings'), `${path} panel is inside overlay`).toHaveCount(1);
      await expect(page.locator('#liquidGlassSettingsGroup')).toHaveCount(0);
      await expect(page.locator('script[src="src/js/features/liquid-glass.js"]')).toHaveCount(0);
      await expect(page.locator('html')).not.toHaveAttribute('data-liquid-glass');
    }
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await openSettings(page);
    await expect(page.locator('#settingsOverlay #settings')).toBeVisible();
    await closeSettings(page);
  });

  test('settings overlay structure matches across pages', async ({ page }) => {
    const paths = ['/index.html', '/gallery.html', '/tools-weather.html', '/privacy.html'];
    const signatures = [];
    for (const path of paths) {
      await gotoPage(page, path);
      await waitAppReady(page);
      const html = await page.content();
      expect(html, `${path} first-paint marker`).toContain('FIRST_PAINT_START');
      expect(html, `${path} settings marker`).toContain('SETTINGS_START');
      const sig = await page.locator('#settingsOverlay').evaluate((el) => {
        return [...el.querySelectorAll('[id]')].map((n) => n.id).join(',');
      });
      signatures.push(sig);
    }
    expect(new Set(signatures).size, signatures.join(' | ')).toBe(1);
    expect(signatures[0]).toContain('appearancePillGroup');
    expect(signatures[0]).toContain('unitTempGroup');
  });

  test('first paint resolves Appearance × Style before runtime', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('usa-travel-appearance', 'dark');
      localStorage.setItem('usa-travel-style', 'modern');
    });
    await gotoPage(page, '/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass');
  });

  test('legacy luxury theme first-paints as default', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('usa-travel-appearance');
      localStorage.removeItem('usa-travel-style');
      localStorage.setItem('usa-travel-theme', 'luxury');
    });
    await gotoPage(page, '/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'default');
    await waitAppReady(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'default');
  });

  test('homepage does not load unused feature scripts', async ({ page }) => {
    await gotoPage(page, '/index.html');
    const srcs = await page.locator('script[src]').evaluateAll((els) => els.map((e) => e.getAttribute('src') || ''));
    expect(srcs.some((s) => s.includes('features/gallery.js'))).toBeFalsy();
    expect(srcs.some((s) => s.includes('features/legal.js'))).toBeFalsy();
    expect(srcs.some((s) => s.includes('features/tools.js'))).toBeFalsy();
    expect(srcs.some((s) => s.includes('features/home.js'))).toBeTruthy();
  });

  test('Auto units copy does not claim OS temperature radios', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await openSettings(page);
    const sub = await page.locator('[data-i18n="settings.unitsSub"]').textContent();
    expect(sub.toLowerCase()).not.toMatch(/temperature unit and measurement system/);
    expect(sub.toLowerCase()).toMatch(/region|time zone|zona horaria|地区|タイムゾーン/);
    const hint = await page.locator('#unitsResolvedHint').textContent();
    expect(hint).not.toMatch(/Device:/);
    expect(hint).toMatch(/Using|当前|現在|Ahora/);
  });

  test('i18n includes weather.untilSunset in es/zh/ja', async () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../src/js/data/i18n.js'), 'utf8');
    expect(src).toMatch(/"weather\.untilSunset": "Hasta el atardecer"/);
    expect(src).toMatch(/"weather\.untilSunset": "直到日落"/);
    expect(src).toMatch(/"weather\.untilSunset": "日没まで"/);
  });

  test('motion Full wins over OS reduced-motion on first paint', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      localStorage.setItem('usa-travel-motion', 'full');
    });
    await gotoPage(page, '/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-motion-effective', 'full');
    await waitAppReady(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion-effective', 'full');
  });

  test('dest weather chips follow effective temp unit', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await page.evaluate(() => {
      sessionStorage.setItem('usa-travel-dest-wx-v1', JSON.stringify({
        at: Date.now(),
        data: { nyc: { temp: 20, code: 0, hi: 22, lo: 10 } }
      }));
      if (window.paintDestWeather) window.paintDestWeather();
    });
    const chip = page.locator('.dest-weather[data-dest-wx="nyc"] .dest-weather-temp');
    await openSettings(page);
    await page.locator('#unitTempGroup .pill-btn[data-unit-val="c"]').click();
    await closeSettings(page);
    await expect(chip).toHaveText('20°');
    await openSettings(page);
    await page.locator('#unitTempGroup .pill-btn[data-unit-val="f"]').click();
    await closeSettings(page);
    await expect(chip).toHaveText('68°');
  });

  test('tip-tax state selector localizes on language change', async ({ page }) => {
    await gotoPage(page, '/tools-tip-tax.html');
    await page.waitForFunction(() => document.querySelectorAll('#salesTaxState option').length > 10);
    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    const caLabel = await page.locator('#salesTaxState option[value="CA"]').textContent();
    expect(caLabel).toContain('加利福尼亚');
  });

  test('drive fields convert when distance unit changes', async ({ page }) => {
    await gotoPage(page, '/tools-drive.html');
    await expect(page.locator('#driveDist')).toBeVisible();
    await openSettings(page);
    await page.locator('#unitDistGroup .pill-btn[data-unit-val="mi"]').click();
    await closeSettings(page);
    await page.locator('#driveDist').fill('100');
    await page.locator('#driveMpg').fill('25');
    await openSettings(page);
    await page.locator('#unitDistGroup .pill-btn[data-unit-val="km"]').click();
    await closeSettings(page);
    const distKm = Number(await page.locator('#driveDist').inputValue());
    const mpgOrL = Number(await page.locator('#driveMpg').inputValue());
    expect(distKm).toBeGreaterThan(150);
    expect(distKm).toBeLessThan(170);
    expect(mpgOrL).toBeGreaterThan(8);
    expect(mpgOrL).toBeLessThan(11);
    await expect(page.locator('#driveEconLabel')).toContainText(/L\/100|升/);
  });

  test('Auto units resolve live and paint data-temp-unit', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await openSettings(page);
    // Explicit °C first
    await page.locator('#unitTempGroup .pill-btn[data-unit-val="c"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-temp-unit', 'c');
    await expect(page.locator('#unitTempGroup .pill-btn[data-unit-val="c"]')).toHaveClass(/active/);
    // Auto re-detects system (must highlight Auto + set f or c)
    await page.locator('#unitTempGroup .pill-btn[data-unit-val="auto"]').click();
    await expect(page.locator('#unitTempGroup .pill-btn[data-unit-val="auto"]')).toHaveClass(/active/);
    const tempUnit = await page.locator('html').getAttribute('data-temp-unit');
    expect(tempUnit === 'f' || tempUnit === 'c').toBeTruthy();
    const distUnit = await page.locator('html').getAttribute('data-dist-unit');
    expect(distUnit === 'mi' || distUnit === 'km').toBeTruthy();
    // Live debug helper must agree
    const info = await page.evaluate(() => window.__usaTravelUnits());
    expect(info.prefTemp).toBe('auto');
    expect(info.effectiveTemp).toBe(tempUnit);
    expect(info.detected && info.detected.temp).toBeTruthy();
    // Hint shows resolved units
    await expect(page.locator('#unitsResolvedHint')).toBeVisible();
    const hint = await page.locator('#unitsResolvedHint').textContent();
    expect(hint).toMatch(/°[FC]|Using|当前|現在|Ahora/);
  });

  test('weather alerts use class accordion (not details)', async ({ page }) => {
    // Static source check — class-based open/close, no native details
    const fs = require('fs');
    const path = require('path');
    const weatherJs = fs.readFileSync(path.join(__dirname, '../src/js/features/weather/alerts.js'), 'utf8');
    expect(weatherJs).toMatch(/class="weather-alert/);
    expect(weatherJs).toMatch(/weather-alert-summary/);
    expect(weatherJs).toMatch(/is-open/);
    expect(weatherJs).toMatch(/bindAlertCollapseAnimation/);
    // Must not emit native <details class="weather-alert
    expect(weatherJs).not.toMatch(/<details class="weather-alert/);
    // Height pixel animation (smooth collapse)
    expect(weatherJs).toMatch(/scrollHeight/);
    expect(weatherJs).toMatch(/panel\.style\.height/);
  });

  test('world clock renders cities', async ({ page }) => {
    await gotoPage(page, '/tools-clock.html');
    await page.waitForFunction(() => {
      const list = document.getElementById('worldClockList');
      return list && list.children.length >= 3;
    });
    await expect(page.locator('#worldClockList')).toBeVisible();
  });

  test('emergency numbers page shows 911', async ({ page }) => {
    await gotoPage(page, '/tools-emergency.html');
    await expect(page.locator('#tools')).toContainText('911');
  });

  test('weather page chrome works without live weather APIs', async ({ page }) => {
    test.setTimeout(90_000);
    await blockLiveWeatherApis(page);
    await gotoPage(page, '/tools-weather.html');
    await waitLoaderGone(page);
    await expect(page.locator('#weatherSearch')).toBeVisible();
    await expect(page.locator('#weatherUnitsBtn')).toBeVisible();

    // Fail-closed: skeleton must clear even when every forecast request is 429
    await page.waitForFunction(() => {
      const list = document.getElementById('weatherList');
      const err = document.getElementById('weatherError');
      const loading = document.getElementById('weatherLoading');
      const hasRows = list && list.querySelectorAll('.weather-row').length > 0;
      const hasErr = err && !err.hidden && (err.textContent || '').trim().length > 0;
      const stillLoading = loading && !loading.hidden;
      const skel = list && list.querySelectorAll('.weather-skeleton-row').length > 0;
      return (hasRows || hasErr) && !stillLoading && !skel;
    }, null, { timeout: 45_000 });

    await expect(page.locator('#weatherList .weather-skeleton-row')).toHaveCount(0);
    await expect(page.locator('#weatherSearch')).toBeVisible();

    const attrib = page.locator('.weather-attribution');
    if (await attrib.count()) {
      await expect(attrib.first()).toContainText(/NWS|Open-Meteo|open-meteo|Weather|Datos|数据|データ/i);
    }

    // Units sheet must not trap the page when data is unavailable
    await page.locator('#weatherUnitsBtn').click();
    await expect(page.locator('#weatherSheet')).toHaveClass(/open/, { timeout: 5_000 });
    // Temp + distance share Settings prefs (Auto / °F / °C · Auto / mi / km)
    await expect(page.locator('#wxTempUnits')).toBeVisible();
    await expect(page.locator('#wxDistUnits')).toBeVisible();
    await expect(page.locator('#wxTempUnits button[data-unit="auto"]')).toBeVisible();
    await expect(page.locator('#wxTempUnits button[data-unit="c"]')).toBeVisible();
    await page.locator('#wxTempUnits button[data-unit="c"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-temp-unit', 'c');
    await page.locator('#wxTempUnits button[data-unit="f"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-temp-unit', 'f');
    await page.keyboard.press('Escape');
    await expect(page.locator('#weatherSheet')).not.toHaveClass(/open/);
    const sheetPe = await page.locator('#weatherSheet').evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(sheetPe).toBe('none');

    // Manual Refresh must stay enabled (never stuck disabled mid-load)
    const refresh = page.locator('#weatherRefresh');
    await expect(refresh).toBeVisible();
    await expect(refresh).toBeEnabled();
    await refresh.click();
    // Immediately after click — still enabled (busy is aria-busy, not disabled)
    await expect(refresh).toBeEnabled();
    await page.waitForTimeout(400);
    await expect(refresh).toBeEnabled();
    // Settle: still available
    await page.waitForFunction(() => {
      const btn = document.getElementById('weatherRefresh');
      return btn && !btn.disabled;
    }, null, { timeout: 45_000 });
    await expect(refresh).toBeEnabled();

    // List rows must be hit-testable (ghost detail/sheet PE regression)
    await page.waitForFunction(() => {
      return document.querySelectorAll('#weatherList .weather-row').length > 0;
    }, null, { timeout: 45_000 });
    const hitOk = await page.evaluate(() => {
      const r = document.querySelector('#weatherList .weather-row');
      if (!r) return false;
      const rect = r.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + Math.min(rect.height / 2, 20);
      const el = document.elementFromPoint(cx, cy);
      if (!el) return false;
      return !!(el.closest && el.closest('.weather-row'));
    });
    expect(hitOk).toBeTruthy();
    // PE on closed detail shell
    const detailPe = await page.locator('#weatherDetail').evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(detailPe).toBe('none');
    // Closed detail children must not steal hits either
    const barPe = await page.evaluate(() => {
      const bar = document.querySelector('#weatherDetail .weather-detail-bar');
      return bar ? getComputedStyle(bar).pointerEvents : 'none';
    });
    expect(barPe).toBe('none');
  });

  test('weather city row click opens detail and Done returns to list', async ({ page }) => {
    test.setTimeout(90_000);
    await fixtureWeatherApis(page);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await gotoPage(page, '/tools-weather.html');
    await waitLoaderGone(page);
    await page.waitForFunction(() => {
      return document.querySelectorAll('#weatherList .weather-row:not(.weather-row--error)').length > 0;
    }, null, { timeout: 45_000 });

    await page.locator('#weatherList .weather-row:not(.weather-row--error)').first().click();
    // Open + a11y after double-rAF enter (must not stay inert/aria-hidden from list-paint race)
    await page.waitForFunction(() => {
      const d = document.getElementById('weatherDetail');
      return !!(d && d.classList.contains('open')
        && d.getAttribute('aria-hidden') === 'false'
        && !d.inert
        && !d.hidden);
    }, null, { timeout: 10_000 });
    await expect(page.locator('#weatherDetailHero')).not.toBeEmpty();
    // Daily module must render (where the split bug used timezone)
    await expect(page.locator('#weatherModules .weather-mod-wide').first()).toBeVisible();

    await page.locator('#weatherDetailBack').click();
    await expect(page.locator('#weatherDetail')).not.toHaveClass(/open/, { timeout: 8_000 });
    // After close, list must be hit-testable (wait for finishDetailClose + PE restore)
    await page.waitForFunction(() => {
      const d = document.getElementById('weatherDetail');
      const r = document.querySelector('#weatherList .weather-row');
      if (!d || !r || d.classList.contains('open')) return false;
      const rect = r.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;
      const el = document.elementFromPoint(rect.left + rect.width / 2, rect.top + 16);
      return !!(el && el.closest && el.closest('.weather-row'));
    }, null, { timeout: 10_000 });

    // Second open (another city) still works
    await page.locator('#weatherList .weather-row:not(.weather-row--error)').nth(1).click();
    await expect(page.locator('#weatherDetail')).toHaveClass(/open/, { timeout: 10_000 });
    expect(pageErrors.filter((m) => /is not defined/i.test(m))).toEqual([]);

    // Detail module tiles must open sheets (split deps regression: wind/pressure/precip/sun)
    for (const kind of ['wind', 'pressure', 'precip', 'sun', 'feels']) {
      const tile = page.locator(`#weatherModules [data-sheet="${kind}"]`).first();
      if (!(await tile.count())) continue;
      await tile.scrollIntoViewIfNeeded();
      await tile.click();
      await expect(page.locator('#weatherSheet')).toHaveClass(/open/, { timeout: 5_000 });
      await expect(page.locator('#weatherSheetBody')).not.toBeEmpty();
      await page.keyboard.press('Escape');
      await expect(page.locator('#weatherSheet')).not.toHaveClass(/open/, { timeout: 5_000 });
    }
    expect(pageErrors.filter((m) => /is not defined/i.test(m))).toEqual([]);
  });

  test('weather auto-refresh is 10 minutes and pauses when document hidden', async ({ page }) => {
    // Static contract check + runtime pause behavior (no live APIs)
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(process.cwd(), 'src/js/features/weather/app.js'), 'utf8');
    expect(src).toMatch(/REFRESH_MS\s*=\s*10\s*\*\s*60\s*\*\s*1000/);
    expect(src).toMatch(/scheduleAutoRefresh/);
    expect(src).toMatch(/clearAutoRefresh/);
    expect(src).toMatch(/visibilitychange/);
    expect(src).toMatch(/setRefreshBusy/);
    // Manual must not use disabled=true as the busy mechanism
    expect(src).not.toMatch(/refreshBtn\.disabled\s*=\s*true/);

    await blockLiveWeatherApis(page);
    await gotoPage(page, '/tools-weather.html');
    await waitLoaderGone(page);
    await expect(page.locator('#weatherRefresh')).toBeEnabled();
    await expect(page.locator('#weatherDetailRefresh')).toBeAttached();
  });

  test('legal pages load i18n packs', async ({ page }) => {
    await gotoPage(page, '/privacy.html');
    await page.waitForFunction(() => window.LEGAL_I18N && window.LEGAL_I18N.privacy);
    await expect(page.locator('#legalDoc, .legal-doc, article').first()).toBeVisible({ timeout: 10_000 });
    const body = await page.locator('main, #legalDoc, .legal-doc').first().innerText();
    expect(body.toLowerCase()).toMatch(/open-meteo|weather\.gov|national weather|weather|tiempo|天气|天気|frankfurter/);
  });

  test('footer Privacy link opens policy at the top', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    // Simulate a prior mid-doc privacy visit that browsers would restore
    await gotoPage(page, '/privacy.html');
    await page.waitForFunction(() => document.querySelector('#legalDoc h1'));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    // Leave and re-enter via guide footer (the regression path)
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.locator('.footer-legal-links a[href="privacy.html"]').click();
    await page.waitForURL(/privacy\.html/);
    await page.waitForFunction(() => document.querySelector('#legalDoc h1'));
    await page.waitForTimeout(300);
    const y = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop || 0);
    expect(y).toBeLessThan(80);
    await expect(page.locator('#legalDoc h1')).toBeInViewport();
  });

  test('legal pages render sections and switch language', async ({ page }) => {
    await gotoPage(page, '/privacy.html');
    await waitAppReady(page);
    await page.waitForFunction(() => {
      const root = document.getElementById('legalDoc');
      return root && root.querySelectorAll('.legal-section, section[id]').length >= 3;
    });
    await expect(page.locator('#legalDoc h1, .legal-doc-header h1').first()).toBeVisible();
    await expect(page.locator('#legalDoc .legal-section, #legalDoc section[id]').first()).toBeVisible();

    // Language switcher on legal chrome
    const zhBtn = page.locator('#legalLangSwitch [data-lang-val="zh"], [data-lang-val="zh"]').first();
    if (await zhBtn.count()) {
      await zhBtn.click();
      await expect(page.locator('html')).toHaveAttribute('data-lang', 'zh');
      const body = await page.locator('#legalDoc').innerText();
      expect(body).toMatch(/隐私|个人信息|本网站/);
    }

    await gotoPage(page, '/terms.html');
    await waitAppReady(page);
    await page.waitForFunction(() => window.LEGAL_I18N && window.LEGAL_I18N.terms);
    const termsBody = await page.locator('#legalDoc, main').first().innerText();
    expect(termsBody.toLowerCase()).toMatch(/terms|条件|条款|términos|規約|creative commons|cc by/);
  });

  test('intro collage seeds from gallery catalog', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await page.waitForFunction(() => {
      return Array.isArray(window.INTRO_GALLERY_PHOTOS) && window.INTRO_GALLERY_PHOTOS.length > 20;
    });
    const root = page.locator('#introGallery');
    await root.scrollIntoViewIfNeeded();
    await expect(root).toBeVisible();
    const slots = root.locator('[data-intro-slot]');
    await expect(slots).toHaveCount(3);
    // Seeded layers should have background images after init
    await page.waitForFunction(() => {
      const layers = document.querySelectorAll('#introGallery .intro-photo-layer.is-active');
      let withBg = 0;
      layers.forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage || '';
        if (bg && bg !== 'none') withBg += 1;
      });
      return withBg >= 2;
    }, null, { timeout: 10_000 });
  });

  test.describe('nav-return chrome', () => {
    async function backChrome(page) {
      const back = page.locator('a.gallery-app-back').first();
      await expect(back).toBeVisible();
      const href = await back.getAttribute('href');
      const label = ((await back.innerText()) || '').replace(/\s+/g, ' ').trim();
      return { href, label };
    }

    test('tools hub always says Back to the Guide', async ({ page }) => {
      await gotoPage(page, '/tools.html');
      await page.evaluate(() => {
        sessionStorage.setItem('usa-travel-return-v1', JSON.stringify({
          from: '/tools.html',
          href: 'tools.html',
          scrollY: 0,
          label: 'tools',
          ts: Date.now(),
          to: '/tools-currency.html',
        }));
      });
      await gotoPage(page, '/tools.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/index\.html/i);
      expect(label).toMatch(/guide|guía|指南|ガイド/i);
      expect(label).not.toMatch(/tools|herramientas|工具|ツール/i);
    });

    test('guide deep-link → mini-app Back to Guide', async ({ page }) => {
      await gotoPage(page, '/index.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      const link = page.locator('a.guide-tool-link[href="tools-currency.html"]').first();
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await page.waitForURL(/tools-currency\.html/);
      await waitLoaderGone(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/index\.html/i);
      expect(label).toMatch(/guide|guía|指南|ガイド/i);
    });

    test('Travel Essentials road-trip link backs to Guide not Tools', async ({ page }) => {
      await gotoPage(page, '/index.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      // Residual tools stamp (prior hub visit / incomplete pop) must not win over guide origin
      await page.evaluate(() => {
        try {
          sessionStorage.setItem('usa-travel-return-v1', JSON.stringify({
            label: 'tools', href: 'tools.html', ts: Date.now()
          }));
        } catch (_) { /* ignore */ }
      });
      const link = page.locator('#practical a.guide-tool-link[href="tools-drive.html"]').first();
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await page.waitForURL(/tools-drive\.html/);
      await waitLoaderGone(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/index\.html/i);
      expect(label).toMatch(/guide|guía|指南|ガイド/i);
      const stamp = await page.evaluate(() => {
        try { return JSON.parse(sessionStorage.getItem('usa-travel-return-v1') || 'null'); }
        catch (_) { return null; }
      });
      expect(stamp && stamp.label).toBe('guide');
      expect(stamp && stamp.parent).toBeFalsy();
      await page.locator('a.gallery-app-back').first().click();
      await page.waitForURL(/index\.html|\/(#|$)/);
      expect(page.url()).not.toMatch(/tools\.html/);
    });

    test('tools hub → mini-app Back to Tools', async ({ page }) => {
      await gotoPage(page, '/tools.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      // Hub itself must be Guide first
      let chrome = await backChrome(page);
      expect(chrome.href).toMatch(/index\.html/i);
      await page.locator('a[href="tools-currency.html"]').first().click();
      await page.waitForURL(/tools-currency\.html/);
      await waitLoaderGone(page);
      chrome = await backChrome(page);
      expect(chrome.href).toMatch(/tools\.html/i);
      expect(chrome.label).toMatch(/tools|herramientas|工具|ツール/i);
      // Return to hub — still Guide, not Tools
      await page.locator('a.gallery-app-back').first().click();
      await page.waitForURL(/tools\.html/);
      await waitLoaderGone(page);
      chrome = await backChrome(page);
      expect(chrome.href).toMatch(/index\.html/i);
      expect(chrome.label).toMatch(/guide|guía|指南|ガイド/i);
      expect(chrome.label).not.toMatch(/back to tools/i);
    });

    test('guide → tools hub → Back to Guide', async ({ page }) => {
      await gotoPage(page, '/index.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      await page.locator('a[href="tools.html"]').first().click();
      await page.waitForURL(/tools\.html/);
      await waitLoaderGone(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/index\.html/i);
      expect(label).toMatch(/guide|guía|指南|ガイド/i);
    });

    test('tool mini-app → Gallery → Back to that tool', async ({ page }) => {
      await blockLiveWeatherApis(page);
      await gotoPage(page, '/tools-weather.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      // Jump to Gallery via app-bar
      await page.locator('a.nav-tool-btn[href="gallery.html"], a[href="gallery.html"]').first().click();
      await page.waitForURL(/gallery\.html/);
      await waitLoaderGone(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/tools-weather\.html/i);
      expect(label).toMatch(/weather|tiempo|天气|天気/i);
      expect(label).not.toMatch(/guide|guía|指南|ガイド/i);
    });

    test('Guide → Weather → Gallery → Back does not loop', async ({ page }) => {
      await blockLiveWeatherApis(page);
      await gotoPage(page, '/index.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      const wxLink = page.locator('a.guide-tool-link[href="tools-weather.html"], a.seasons-weather-cta[href="tools-weather.html"]').first();
      await wxLink.scrollIntoViewIfNeeded();
      await wxLink.click();
      await page.waitForURL(/tools-weather\.html/);
      await waitLoaderGone(page);
      let chrome = await backChrome(page);
      expect(chrome.href).toMatch(/index\.html/i);
      expect(chrome.label).toMatch(/guide|guía|指南|ガイド/i);

      // Weather → Gallery
      await page.locator('a.nav-tool-btn[href="gallery.html"], a[href="gallery.html"]').first().click();
      await page.waitForURL(/gallery\.html/);
      await waitLoaderGone(page);
      chrome = await backChrome(page);
      expect(chrome.href).toMatch(/tools-weather\.html/i);
      expect(chrome.label).toMatch(/weather|tiempo|天气|天気/i);

      // Gallery → Back to Weather: must restore Guide, not loop to Gallery
      await page.locator('a.gallery-app-back').first().click();
      await page.waitForURL(/tools-weather\.html/);
      await waitLoaderGone(page);
      chrome = await backChrome(page);
      expect(chrome.href).toMatch(/index\.html/i);
      expect(chrome.label).toMatch(/guide|guía|指南|ガイド/i);
      expect(chrome.href).not.toMatch(/gallery/i);
      expect(chrome.label).not.toMatch(/gallery|galería|图库|ギャラリー/i);

      // One more hop: Gallery again then back — still Guide, never loop
      await page.locator('a.nav-tool-btn[href="gallery.html"], a[href="gallery.html"]').first().click();
      await page.waitForURL(/gallery\.html/);
      await page.locator('a.gallery-app-back').first().click();
      await page.waitForURL(/tools-weather\.html/);
      await waitLoaderGone(page);
      chrome = await backChrome(page);
      expect(chrome.href).toMatch(/index\.html/i);
      expect(chrome.label).toMatch(/guide|guía|指南|ガイド/i);
    });

    test('tools hub → Gallery → Back to Tools', async ({ page }) => {
      await gotoPage(page, '/tools.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      await page.locator('a[href="gallery.html"]').first().click();
      await page.waitForURL(/gallery\.html/);
      await waitLoaderGone(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/tools\.html/i);
      expect(label).toMatch(/tools|herramientas|工具|ツール/i);
    });

    test('gallery → tools hub → Back to Gallery', async ({ page }) => {
      await gotoPage(page, '/gallery.html');
      await waitLoaderGone(page);
      await waitAppReady(page);
      await page.locator('a[href="tools.html"]').first().click();
      await page.waitForURL(/tools\.html/);
      await waitLoaderGone(page);
      const { href, label } = await backChrome(page);
      expect(href).toMatch(/gallery\.html/i);
      expect(label).toMatch(/gallery|galería|图库|ギャラリー/i);
    });
  });

  test('modal opens for a destination and closes with Escape', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    const card = page.locator('.dest-card[data-dest="nyc"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/);
    await expect(page.locator('#modal-title')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/);
  });

  test('tools and gallery have comfortable side inset on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/tools.html', '/tools-currency.html', '/gallery.html']) {
      await gotoPage(page, path);
      const pad = await page.evaluate((p) => {
        const el = p.includes('gallery')
          ? document.querySelector('#gallery')
          : document.querySelector('#tools.tools-page');
        if (!el) return 0;
        return parseFloat(getComputedStyle(el).paddingLeft) || 0;
      }, path);
      expect(pad, `${path} left padding`).toBeGreaterThanOrEqual(18);
    }
  });

  test('tool splash words are meaningful', async ({ page }) => {
    await blockLiveWeatherApis(page);
    const checks = [
      ['/tools-currency.html', 'Currency'],
      ['/tools-clock.html', 'Clock'],
      ['/tools-tip-tax.html', 'Tip'],
      ['/tools-drive.html', 'Drive'],
      ['/tools-emergency.html', 'Emergency'],
      ['/tools-weather.html', 'Weather'],
    ];
    for (const [path, word] of checks) {
      await gotoPage(page, path);
      await expect(page.locator('#loader .loader-text')).toHaveText(word);
    }
  });

  test('weather search keeps majors without live geocode', async ({ page }) => {
    test.setTimeout(90_000);
    await blockLiveWeatherApis(page);
    await gotoPage(page, '/tools-weather.html');
    await waitLoaderGone(page);
    await page.waitForFunction(() => {
      const list = document.getElementById('weatherList');
      return list && list.querySelectorAll('.weather-row').length > 3;
    }, null, { timeout: 45_000 });
    const before = await page.locator('#weatherList .weather-row').count();
    expect(before).toBeGreaterThan(0);
    await page.locator('#weatherSearch').fill('Paris');
    await page.waitForTimeout(400);
    // majors list must not be wiped while typing (geocode is blocked)
    const after = await page.locator('#weatherList .weather-row').count();
    expect(after).toBe(before);
    await expect(page.locator('#weatherSearch')).toHaveValue('Paris');
  });

  test('sitemap references new tool pages', async ({ page }) => {
    const res = await gotoPage(page, '/sitemap.xml');
    expect(res && res.ok()).toBeTruthy();
    const xml = await page.content();
    expect(xml).toContain('tools-weather.html');
    expect(xml).toContain('tools-currency.html');
  });

  test('homepage section nav clears the fixed bar', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await waitLoaderGone(page);
    await page.locator('.nav-links a[href="#destinations"]').click();
    await expect.poll(async () => page.evaluate(() => {
      const dest = document.getElementById('destinations');
      const nav = document.getElementById('navbar');
      if (!dest || !nav) return 9999;
      return dest.getBoundingClientRect().top - nav.getBoundingClientRect().height;
    }), { timeout: 10_000 }).toBeLessThan(80);
    const gap = await page.evaluate(() => {
      const dest = document.getElementById('destinations');
      const nav = document.getElementById('navbar');
      return dest.getBoundingClientRect().top - nav.getBoundingClientRect().height;
    });
    expect(gap).toBeGreaterThan(-24);
  });

  test('gallery manager insert marker and intro catalog slugs', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, '../gallery.html'), 'utf8');
    expect(html).toContain('<!-- GALLERY_MANAGER_INSERT -->');
    const intro = fs.readFileSync(path.join(__dirname, '../src/js/data/intro-gallery.js'), 'utf8');
    const htmlSlugs = new Set([...html.matchAll(/gallery\.item\.([a-z0-9]+)\.caption/g)].map((m) => m[1]));
    const introSlugs = [...intro.matchAll(/"slug": "([^"]+)"/g)].map((m) => m[1]);
    introSlugs.forEach((s) => expect(htmlSlugs.has(s), s).toBeTruthy());
  });

  test('modern English first visit does not request Fraunces or Noto', async ({ page }) => {
    const fontUrls = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) fontUrls.push(u);
    });
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await page.waitForTimeout(400);
    const joined = fontUrls.join('\n');
    expect(joined).not.toMatch(/Fraunces/i);
    expect(joined).not.toMatch(/Noto/i);
    expect(joined).toMatch(/Public\+Sans|Public Sans/i);
  });

  test('weather deep link ?city=nyc opens New York', async ({ page }) => {
    test.setTimeout(90_000);
    await fixtureWeatherApis(page);
    await gotoPage(page, '/tools-weather.html?city=nyc');
    await waitLoaderGone(page);
    // Must open this city first — not after the full majors list finishes
    await expect(page.locator('#weatherDetail')).toHaveClass(/open/, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/New York|Nueva York|纽约|ニューヨーク/);
  });

  test('below-fold card photos wait until the section is near view', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await waitLoaderGone(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(80);
    await expect(page.locator('#culture')).not.toHaveClass(/is-photos-ready/);
    await expect(page.locator('#tips')).not.toHaveClass(/is-photos-ready/);
    await page.locator('#culture').scrollIntoViewIfNeeded();
    await expect(page.locator('#culture')).toHaveClass(/is-photos-ready/, { timeout: 8_000 });
    await page.locator('#tips').scrollIntoViewIfNeeded();
    await expect(page.locator('#tips')).toHaveClass(/is-photos-ready/, { timeout: 8_000 });
    await expect(page.locator('.site-footer-credits a[href="privacy.html#generated-images"]')).toBeVisible();
  });

  test('privacy policy discloses generated card images', async ({ page }) => {
    await gotoPage(page, '/privacy.html#generated-images');
    await waitAppReady(page);
    await expect(page.locator('#generated-images')).toBeVisible({ timeout: 10_000 });
    const body = await page.locator('#generated-images').innerText();
    expect(body.toLowerCase()).toMatch(/ai-generated|generadas por ia|ai 生成|ai生成/);
  });

  test('progress bar and nav scroll chrome update on scroll', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await waitAppReady(page);
    await waitLoaderGone(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(50);
    // Scroll past hero so nav gains .scrolled and progress advances
    await page.evaluate(() => window.scrollTo(0, Math.min(document.body.scrollHeight * 0.35, 1200)));
    await page.waitForFunction(() => {
      const nav = document.getElementById('navbar');
      const bar = document.getElementById('progress-bar');
      if (!nav || !bar) return false;
      const scrolled = nav.classList.contains('scrolled');
      const t = getComputedStyle(bar).transform || '';
      // scaleX applied as matrix(a, 0, 0, 1, 0, 0) with a > 0
      const m = t.match(/matrix\(([^,]+)/);
      const scale = m ? parseFloat(m[1]) : 0;
      return scrolled && scale > 0.01;
    }, null, { timeout: 10_000 });
  });
});
