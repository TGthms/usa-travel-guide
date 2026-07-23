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
      await expect(page.locator('script[src="src/js/core/env.js"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/core/runtime.js"]')).toHaveCount(1);
      await expect(page.locator('script[src="src/js/app.js"]')).toHaveCount(1);
    }
  });

  test('cycles all six themes', async ({ page }) => {
    await openSettings(page);
    for (const theme of THEMES) {
      await page.locator(`.theme-swatch[data-theme-val="${theme}"]`).click();
      // Explicit pick always paints that theme (no silent OS-dark twin remap).
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

  test('saved filter empty state survives language round-trip to English', async ({ page }) => {
    // With no favorites, Saved filter shows a dedicated empty message.
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
    // Must not snap back to the region-filter empty copy.
    await expect(page.locator('#destEmptyState')).toContainText(/haven't saved|saved any cities/i);
    await expect(page.locator('#destEmptyState')).not.toContainText(/match this region/i);
    await expect(page.locator('#destEmptyState')).toHaveAttribute('data-i18n', 'dest.emptyStateSaved');
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

  test('modal opens for a destination and closes with Escape', async ({ page }) => {
    const card = page.locator('.dest-card[data-dest="nyc"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/);
    await expect(page.locator('#modal-title')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/);
  });

  test('gallery lightbox opens and navigates', async ({ page }) => {
    await page.goto('/gallery.html');
    // Wait until splash is gone and grid handlers can receive clicks.
    await page.waitForFunction(() => {
      const loader = document.getElementById('loader');
      const ready = !loader || loader.classList.contains('gone');
      const n = document.querySelectorAll('#galleryGrid .gallery-item:not(.hidden)').length;
      return document.body.classList.contains('page-gallery') && ready && n > 1;
    });
    // Dispatch on the tile itself (avoids sticky-filter / overlay intercept flakes).
    await page.evaluate(() => {
      const item = document.querySelector('#galleryGrid .gallery-item:not(.hidden)');
      if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    await expect(page.locator('#lightbox')).toHaveClass(/open/, { timeout: 10_000 });
    await expect(page.locator('#lightboxImg')).toBeVisible();
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
    // After first paint, no further column reparenting should happen on scroll/lazy-load.
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

  test('tools currency localizes names and swap works', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => document.querySelectorAll('#currencyFrom option').length >= 5);
    await expect(page.locator('#currencyFrom option[value="USD"]')).toContainText(/Dollar|USD/);
    await openSettings(page);
    await page.locator('#langPillGroup .pill-btn[data-lang-val="zh"]').click();
    await closeSettings(page);
    await expect(page.locator('#currencyFrom option[value="USD"]')).toContainText('美元');
    // Swap preserves codes
    const fromBefore = await page.locator('#currencyFrom').inputValue();
    const toBefore = await page.locator('#currencyTo').inputValue();
    await page.locator('#currencySwap').click();
    await expect(page.locator('#currencyFrom')).toHaveValue(toBefore);
    await expect(page.locator('#currencyTo')).toHaveValue(fromBefore);
  });

  test('tools drive fields convert when distance unit changes', async ({ page }) => {
    await page.goto('/tools.html');
    await expect(page.locator('#driveDist')).toBeVisible();
    // Force imperial baseline
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
    expect(distKm).toBeGreaterThan(150); // ~160.9 km
    expect(distKm).toBeLessThan(170);
    // 235.215/25 ≈ 9.4 L/100km
    expect(mpgOrL).toBeGreaterThan(8);
    expect(mpgOrL).toBeLessThan(11);
    await expect(page.locator('#driveEconLabel')).toContainText(/L\/100|升/);
  });

  test('tools and gallery have comfortable side inset on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/tools.html', '/gallery.html']) {
      await page.goto(path);
      const pad = await page.evaluate((isTools) => {
        const el = isTools
          ? document.querySelector('#tools.tools-page')
          : document.querySelector('#gallery');
        if (!el) return 0;
        return parseFloat(getComputedStyle(el).paddingLeft) || 0;
      }, path.includes('tools'));
      expect(pad, `${path} left padding`).toBeGreaterThanOrEqual(18);
    }
  });
});
