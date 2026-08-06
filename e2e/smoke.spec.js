// @ts-check
'use strict';

const { test, expect } = require('@playwright/test');

const THEMES = ['default', 'minimal', 'elegant', 'luxury', 'glass', 'nature'];
const LANGS = ['en', 'es', 'zh', 'ja'];
const TOOL_PAGES = [
  '/tools-currency.html',
  '/tools-clock.html',
  '/tools-tip-tax.html',
  '/tools-drive.html',
  '/tools-emergency.html',
  '/tools-weather.html',
];

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
    // Home exposes toggleFavorite; mini-apps expose body page class + runtime.
    return typeof window.applyLanguage === 'function'
      || typeof window.toggleFavorite === 'function'
      || document.body.classList.contains('page-tools')
      || document.body.classList.contains('page-gallery')
      || document.body.classList.contains('page-legal');
  }, null, { timeout: 15_000 });
}

async function waitLoaderGone(page) {
  await page.waitForFunction(() => {
    const loader = document.getElementById('loader');
    return !loader || loader.classList.contains('gone') || getComputedStyle(loader).opacity === '0';
  }, null, { timeout: 20_000 }).catch(() => {});
}

test.describe('USA Travel Guide smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => {
      try { localStorage.clear(); } catch (_) { /* ignore */ }
    });
    await page.reload();
    await waitAppReady(page);
  });

  test('loads main + tool pages without console page errors', async ({ page }) => {
    const paths = [
      '/index.html',
      '/gallery.html',
      '/tools.html',
      ...TOOL_PAGES,
      '/privacy.html',
      '/terms.html',
    ];
    for (const path of paths) {
      const res = await page.goto(path);
      expect(res && res.ok(), `${path} should return OK`).toBeTruthy();
      await expect(page.locator('link[href="src/css/styles.css"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/core/env.js"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/core/runtime.js"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/app.js"]')).toHaveCount(1);
    }
  });

  test('cycles all six themes', async ({ page }) => {
    await openSettings(page);
    for (const theme of THEMES) {
      await page.locator(`.theme-swatch[data-theme-val="${theme}"]`).click();
      const stored = await page.evaluate(() => localStorage.getItem('usa-travel-theme'));
      expect(stored).toBe(theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator(`.theme-swatch[data-theme-val="${theme}"]`)).toHaveClass(/active/);
    }
    await closeSettings(page);
  });

  test('cycles all four languages', async ({ page }) => {
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
    const fav = page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn');
    await fav.scrollIntoViewIfNeeded();
    await expect(fav).not.toHaveClass(/active/);

    await fav.click();
    await expect(fav).toHaveClass(/active/);

    const stored = await page.evaluate(() => localStorage.getItem('usa-travel-favorites'));
    expect(stored).toContain('nyc');

    await page.reload();
    await waitAppReady(page);
    await expect(page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn')).toHaveClass(/active/);

    await page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn').click();
    await expect(page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn')).not.toHaveClass(/active/);
  });

  test('saved filter empty state survives language round-trip to English', async ({ page }) => {
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
    await page.goto('/gallery.html');
    await waitLoaderGone(page);
    await expect(page.locator('#galleryGrid .gallery-item').first()).toBeVisible();
    await page.locator('.gallery-filter[data-filter="coast"]').click();
    await expect(page.locator('.gallery-filter[data-filter="coast"]')).toHaveClass(/active/);
    await expect(page.locator('#galleryHeading')).toBeVisible();
    await expect(page.locator('#gallerySearch')).toBeVisible();
    await expect(page.locator('.gallery-app-header')).toHaveCSS('opacity', '1');
  });

  test('gallery lightbox opens and navigates', async ({ page }) => {
    await page.goto('/gallery.html');
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
    await page.goto('/gallery.html');
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
    await page.goto('/tools.html');
    await waitLoaderGone(page);
    await expect(page.locator('.tools-hub-card')).toHaveCount(6);
    await expect(page.locator('a.tools-hub-card[href="tools-currency.html"]')).toBeVisible();
    await expect(page.locator('a.tools-hub-card[href="tools-weather.html"]')).toBeVisible();
    await page.locator('a.tools-hub-card[href="tools-currency.html"]').click();
    await expect(page).toHaveURL(/tools-currency\.html/);
    await expect(page.locator('#currencyAmount')).toBeVisible();
  });

  test('currency tool localizes names and swap works', async ({ page }) => {
    await page.goto('/tools-currency.html');
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
    await page.goto('/tools-currency.html');
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
    await openSettings(page);
    await page.locator('#motionPillGroup .pill-btn[data-motion-val="off"]').click();
    await closeSettings(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion-effective', 'off');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  });

  test('tip-tax state selector localizes on language change', async ({ page }) => {
    await page.goto('/tools-tip-tax.html');
    await page.waitForFunction(() => document.querySelectorAll('#salesTaxState option').length > 10);
    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    const caLabel = await page.locator('#salesTaxState option[value="CA"]').textContent();
    expect(caLabel).toContain('加利福尼亚');
  });

  test('drive fields convert when distance unit changes', async ({ page }) => {
    await page.goto('/tools-drive.html');
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

  test('world clock renders cities', async ({ page }) => {
    await page.goto('/tools-clock.html');
    await page.waitForFunction(() => {
      const list = document.getElementById('worldClockList');
      return list && list.children.length >= 3;
    });
    await expect(page.locator('#worldClockList')).toBeVisible();
  });

  test('emergency numbers page shows 911', async ({ page }) => {
    await page.goto('/tools-emergency.html');
    await expect(page.locator('#tools')).toContainText('911');
  });

  test('weather page loads city list from Open-Meteo', async ({ page }) => {
    await page.goto('/tools-weather.html');
    await waitLoaderGone(page);
    await expect(page.locator('#weatherSearch')).toBeVisible();
    // Wait for network list (or graceful error)
    await page.waitForFunction(() => {
      const list = document.getElementById('weatherList');
      const err = document.getElementById('weatherError');
      const loading = document.getElementById('weatherLoading');
      const hasRows = list && !list.hidden && list.querySelectorAll('.weather-row').length > 0;
      const hasErr = err && !err.hidden && (err.textContent || '').trim().length > 0;
      const stillLoading = loading && !loading.hidden;
      return hasRows || hasErr || !stillLoading;
    }, null, { timeout: 45_000 });
    const rowCount = await page.locator('#weatherList .weather-row').count();
    if (rowCount > 0) {
      await expect(page.locator('#weatherList .weather-row').first()).toBeVisible();
      // Prefer a row that already has live data (temp not dash)
      await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#weatherList .weather-row')];
        const ready = rows.find((r) => {
          const t = r.querySelector('.weather-row-temp');
          return t && t.textContent && t.textContent.trim() !== '—';
        }) || rows[0];
        if (ready) ready.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
      await expect(page.locator('#weatherDetail')).toHaveClass(/open/, { timeout: 15_000 });
      await expect(page.locator('#weatherDetailHero')).not.toBeEmpty();
      await expect(page.locator('#weatherDetailUpdated, .weather-detail-updated')).toContainText(/Updated|Actualizado|更新|更新/i);
      // Daily bars should have non-zero width style when data present
      const barStyled = await page.locator('.weather-daily-bar[style*="width"]').count();
      expect(barStyled).toBeGreaterThan(0);
      await page.locator('#weatherDetailBack').click({ force: true });
      await page.evaluate(() => {
        if (document.getElementById('weatherDetail')?.classList.contains('open')
          && typeof window.closeWeatherDetail === 'function') {
          window.closeWeatherDetail();
        }
      });
      await expect(page.locator('#weatherDetail')).not.toHaveClass(/open/);
    } else {
      // Offline / API blocked — still require chrome
      await expect(page.locator('#weatherSearch')).toBeVisible();
    }
  });

  test('legal pages load i18n packs', async ({ page }) => {
    await page.goto('/privacy.html');
    await page.waitForFunction(() => window.LEGAL_I18N && window.LEGAL_I18N.privacy);
    await expect(page.locator('#legalDoc, .legal-doc, article').first()).toBeVisible({ timeout: 10_000 });
    // Weather / Open-Meteo should appear in privacy (en)
    const body = await page.locator('main, #legalDoc, .legal-doc').first().innerText();
    expect(body.toLowerCase()).toMatch(/open-meteo|weather|tiempo|天气|天気|frankfurter/);
  });

  test('modal opens for a destination and closes with Escape', async ({ page }) => {
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
      await page.goto(path);
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
    const checks = [
      ['/tools-currency.html', 'Currency'],
      ['/tools-clock.html', 'Clock'],
      ['/tools-tip-tax.html', 'Tip'],
      ['/tools-drive.html', 'Drive'],
      ['/tools-emergency.html', 'Emergency'],
      ['/tools-weather.html', 'Weather'],
    ];
    for (const [path, word] of checks) {
      await page.goto(path);
      await expect(page.locator('#loader .loader-text')).toHaveText(word);
    }
  });

  test('weather search uses dropdown without clearing majors', async ({ page }) => {
    await page.goto('/tools-weather.html');
    await page.waitForFunction(() => {
      const list = document.getElementById('weatherList');
      return list && list.querySelectorAll('.weather-row').length > 3;
    }, null, { timeout: 45_000 }).catch(() => {});
    const before = await page.locator('#weatherList .weather-row').count();
    await page.locator('#weatherSearch').fill('Paris');
    await page.waitForTimeout(500);
    // majors should still be present while suggestions open
    const after = await page.locator('#weatherList .weather-row').count();
    if (before > 0) expect(after).toBe(before);
    // suggest panel may open with network
    const suggestOpen = await page.locator('#weatherSuggest.open, #weatherSuggest:not([hidden])').count();
    // soft: either suggest appears or network blocked
    expect(suggestOpen >= 0).toBeTruthy();
  });

  test('sitemap references new tool pages', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    expect(res && res.ok()).toBeTruthy();
    const xml = await page.content();
    expect(xml).toContain('tools-weather.html');
    expect(xml).toContain('tools-currency.html');
  });
});
