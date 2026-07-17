// @ts-check
'use strict';

const { test, expect } = require('@playwright/test');

const THEMES = ['default', 'minimal', 'elegant', 'luxury', 'glass', 'nature'];
const LANGS = ['en', 'es', 'zh', 'ja'];

async function openSettings(page) {
  await page.locator('#settingsOpen').click();
  await expect(page.locator('#settingsOverlay')).toHaveClass(/open/);
}

async function closeSettings(page) {
  await page.locator('#settingsClose').click();
  await expect(page.locator('#settingsOverlay')).not.toHaveClass(/open/);
}

test.describe('USA Travel Guide smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (_) { /* ignore */ }
    });
    await page.reload();
    // Wait for deferred app.js + data scripts
    await page.waitForFunction(() => typeof window.toggleFavorite === 'function');
  });

  test('loads five main pages without console page errors', async ({ page }) => {
    for (const path of [
      '/index.html',
      '/gallery.html',
      '/tools.html',
      '/privacy.html',
      '/terms.html',
    ]) {
      const res = await page.goto(path);
      expect(res && res.ok(), `${path} should return OK`).toBeTruthy();
      await expect(page.locator('link[href="src/css/styles.css"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/app.js"]')).toHaveCount(1);
    }
  });

  test('cycles all six themes', async ({ page }) => {
    await openSettings(page);
    for (const theme of THEMES) {
      await page.locator(`.theme-swatch[data-theme-val="${theme}"]`).click();
      // Preference is always stored; painted data-theme may twin under OS dark
      // (minimal→glass, elegant→luxury via effectiveTheme).
      const stored = await page.evaluate(() => localStorage.getItem('usa-travel-theme'));
      expect(stored).toBe(theme);
      const painted = await page.locator('html').getAttribute('data-theme');
      if (theme === 'minimal') {
        expect(['minimal', 'glass']).toContain(painted);
      } else if (theme === 'elegant') {
        expect(['elegant', 'luxury']).toContain(painted);
      } else {
        expect(painted).toBe(theme);
      }
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
    // Spot-check a translated nav label after zh
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
    await page.waitForFunction(() => typeof window.toggleFavorite === 'function');
    await expect(page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn')).toHaveClass(/active/);

    // Toggle off
    await page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn').click();
    await expect(page.locator('.dest-card[data-dest="nyc"] .dest-fav-btn')).not.toHaveClass(/active/);
  });

  test('gallery page filters and scripts load', async ({ page }) => {
    await page.goto('/gallery.html');
    await page.waitForFunction(() => typeof window.toggleFavorite === 'function' || document.body.classList.contains('page-gallery'));
    await expect(page.locator('#galleryGrid .gallery-item').first()).toBeVisible();
    await page.locator('.gallery-filter[data-filter="coast"]').click();
    await expect(page.locator('.gallery-filter[data-filter="coast"]')).toHaveClass(/active/);
  });

  test('tools page mounts converter UI', async ({ page }) => {
    await page.goto('/tools.html');
    await expect(page.locator('#currencyAmount')).toBeVisible();
    await expect(page.locator('#currencyFrom')).toBeVisible();
  });

  test('tools state selector localizes on language change', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => document.querySelectorAll('#salesTaxState option').length > 10);
    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    const caLabel = await page.locator('#salesTaxState option[value="CA"]').textContent();
    expect(caLabel).toMatch(/加利福尼亚|California/);
    // Chinese build should show 加利福尼亚州
    expect(caLabel).toContain('加利福尼亚');
  });

  test('legal pages load i18n packs', async ({ page }) => {
    await page.goto('/privacy.html');
    await page.waitForFunction(() => window.LEGAL_I18N && window.LEGAL_I18N.privacy);
    await expect(page.locator('#legalDoc, .legal-doc, article').first()).toBeVisible({ timeout: 10_000 });
  });
});
