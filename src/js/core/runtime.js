'use strict';
/* USA Travel Guide — core/runtime.js
   Classic non-module script. Shared global scope with other src/js scripts.
   Canonical load order: see header of src/js/app.js
*/

/* Data files (plain scripts, not ES modules — preserves global onclick handlers) */
/* I18N dictionary: src/js/data/i18n.js → window.I18N */
const I18N = window.I18N || {};
/* Fun facts: src/js/data/fun-facts.js → window.FUN_FACTS (homepage only) */
const FUN_FACTS = window.FUN_FACTS || { en: [] };
/* Modal + dest link data: src/js/data/modal-content.js, dest-links.js (homepage) */
const MODAL_DATA = window.MODAL_DATA || {};
const MODAL_DATA_I18N = window.MODAL_DATA_I18N || {};
const DEST_TRAVEL_LINKS = window.DEST_TRAVEL_LINKS || {};
const DEST_LINKS_HEADING = window.DEST_LINKS_HEADING || {
  en: 'Helpful links', es: 'Enlaces útiles', zh: '实用链接', ja: '役立つリンク'
};


/* ── I18N ENGINE ──
   English lives directly in the HTML (already written for every section),
   so it never needs duplicating here. On first run we snapshot each
   [data-i18n]/[data-i18n-html] element's original English content; switching
   back to English just restores that snapshot rather than looking anything
   up. Switching to zh/ja overwrites content from the I18N dictionary above,
   keyed by the same data-i18n attribute already present in the markup. */
const i18nEls = document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-aria], [data-i18n-placeholder]');
const i18nOriginals = new Map();
i18nEls.forEach(el => {
  const isHtml = el.hasAttribute('data-i18n-html');
  const isAria = el.hasAttribute('data-i18n-aria');
  const isPh = el.hasAttribute('data-i18n-placeholder');
  i18nOriginals.set(
    el,
    isAria ? el.getAttribute('aria-label')
      : isPh ? el.getAttribute('placeholder')
      : isHtml ? el.innerHTML
      : el.textContent
  );
});

/** Calendar year for © notices — never hardcode the year in UI copy. */
function copyrightYear() {
  return String(new Date().getFullYear());
}

/** Expand `{year}` (and legacy `© 20xx`) so footers/legal stay current automatically. */
function withCopyrightYear(text) {
  if (text == null || text === '') return text;
  const y = copyrightYear();
  return String(text)
    .replace(/\{year\}/g, y)
    .replace(/©\s*20\d{2}\b/g, '© ' + y);
}

/**
 * Safe lookup into window.I18N (es/zh/ja packs). English has no pack — returns null.
 * Never throws if i18n.js failed to load (site still works in English from HTML).
 */
function getI18nDict(lang) {
  let pack = null;
  try {
    if (typeof window !== 'undefined' && window.I18N) pack = window.I18N;
    else if (typeof I18N !== 'undefined') pack = I18N;
  } catch (_) {
    pack = null;
  }
  if (!pack || !lang || lang === 'en') return null;
  return pack[lang] || null;
}

// Shared with features/home.js (modal open state). Declared here so
// applyLanguage can re-render an open modal on language change even when
// home.js loads later or is omitted on mini-app pages.
var currentModalKey = null;

function applyLanguage(lang) {
  const dict = getI18nDict(lang);
  i18nEls.forEach(el => {
    const isHtml = el.hasAttribute('data-i18n-html');
    const isAria = el.hasAttribute('data-i18n-aria');
    const isPh = el.hasAttribute('data-i18n-placeholder');
    const key = isAria ? el.getAttribute('data-i18n-aria')
      : isPh ? el.getAttribute('data-i18n-placeholder')
      : isHtml ? el.getAttribute('data-i18n-html')
      : el.getAttribute('data-i18n');
    const translated = dict && dict[key];
    if (lang === 'en' || !translated) {
      const orig = withCopyrightYear(i18nOriginals.get(el));
      if (isAria) el.setAttribute('aria-label', orig);
      else if (isPh) el.setAttribute('placeholder', orig);
      else if (isHtml) el.innerHTML = orig;
      else el.textContent = orig;
    } else {
      const t = withCopyrightYear(translated);
      if (isAria) el.setAttribute('aria-label', t);
      else if (isPh) el.setAttribute('placeholder', t);
      else if (isHtml) el.innerHTML = t;
      else el.textContent = t;
    }
  });
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : lang === 'es' ? 'es' : 'en');
  document.documentElement.setAttribute('data-lang', lang);
  // Keep page-specific titles (gallery / tools / legal vs main guide).
  const onGallery = document.body.classList.contains('page-gallery');
  const onTools = document.body.classList.contains('page-tools');
  const onLegal = document.body.classList.contains('page-legal');
  const legalKind = onLegal
    ? (location.pathname.indexOf('terms') >= 0 || /terms\.html$/i.test(location.href) ? 'terms' : 'privacy')
    : null;
  const titles = onGallery
    ? {
        en: 'Photo Gallery — America, A Travel Guide',
        es: 'Galería — América, Una Guía de Viaje',
        zh: '相册 — 美国旅行指南',
        ja: 'ギャラリー — アメリカ旅行ガイド'
      }
    : onTools
    ? {
        en: 'Travel Tools — America, A Travel Guide',
        es: 'Herramientas — América, Una Guía de Viaje',
        zh: '旅行工具 — 美国旅行指南',
        ja: '旅行ツール — アメリカ旅行ガイド'
      }
    : legalKind === 'terms'
    ? {
        en: 'Terms of Use — America, A Travel Guide',
        es: 'Términos de uso — América, Una Guía de Viaje',
        zh: '使用条款 — 美国旅行指南',
        ja: '利用規約 — アメリカ旅行ガイド'
      }
    : legalKind === 'privacy'
    ? {
        en: 'Privacy Policy — America, A Travel Guide',
        es: 'Política de privacidad — América, Una Guía de Viaje',
        zh: '隐私政策 — 美国旅行指南',
        ja: 'プライバシーポリシー — アメリカ旅行ガイド'
      }
    : {
        en: 'America — A Travel Guide',
        es: 'América — Una Guía de Viaje',
        zh: '美国 — 旅行指南',
        ja: 'アメリカ — 旅行ガイド'
      };
  document.title = titles[lang] || titles.en;
  applyUnits(); // re-stamp unit spans that may have been inside translated HTML
  if (typeof renderLegalPage === 'function') renderLegalPage(lang);
  if (typeof updateLegalLangSwitch === 'function') updateLegalLangSwitch(lang);
  if (currentModalKey && typeof getModalData === 'function' && typeof openModal === 'function') {
    const d = getModalData(currentModalKey);
    if (d) openModal(d.tag, d.title, d.body);
  }
  // Refresh live-generated tools text when language changes (tools page).
  if (document.body.classList.contains('page-tools') || document.getElementById('currencyAmount')) {
    // refreshToolsLive is defined later in this file (function-hoisted).
    if (typeof populateStateSelect === 'function') populateStateSelect();
    if (typeof refreshToolsLive === 'function') refreshToolsLive();
  }
  // Gallery chrome (placeholders / open lightbox) — function is declared later and hoisted.
  if (typeof refreshGalleryLanguageChrome === 'function') refreshGalleryLanguageChrome();
  if (typeof refreshFunFact === 'function') refreshFunFact();
  // Dest filter empty-state key can change at runtime (Saved vs region). Re-sync so
  // English restore doesn't snap back to the original region empty message.
  if (typeof window.syncDestFilterUi === 'function') window.syncDestFilterUi();
}

/* ── UNIT CONVERSION ENGINE ──
   Any element with class "unit-temp" + data-f="<fahrenheit>" or "unit-dist"
   + data-mi="<miles>" gets its displayed text regenerated here. Safe to call
   after any DOM change (language swap, modal open) since it always derives
   the label fresh from the stored raw value rather than parsing prior text. */
function numberLocale() {
  return currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : 'en-US';
}

function applyUnits() {
  const loc = numberLocale();
  document.querySelectorAll('.unit-temp[data-f]').forEach(el => {
    const f = parseFloat(el.getAttribute('data-f'));
    if (currentTempUnit === 'c') {
      const c = Math.round((f - 32) * 5 / 9);
      el.textContent = c + '°C';
    } else {
      el.textContent = Math.round(f) + '°F';
    }
  });
  document.querySelectorAll('.unit-dist[data-mi]').forEach(el => {
    const mi = parseFloat(el.getAttribute('data-mi'));
    const suffix = el.dataset.suffix || '';
    if (currentDistUnit === 'km') {
      const km = Math.round(mi * 1.60934).toLocaleString(loc);
      el.textContent = km + (currentLang === 'zh' ? ' 公里' : ' km') + suffix;
    } else {
      const miFmt = Math.round(mi).toLocaleString(loc);
      const unit = currentLang === 'zh' ? ' 英里' : currentLang === 'ja' ? ' マイル' : ' mi';
      el.textContent = miFmt + unit + suffix;
    }
  });
  // Road-trip tool: unit-aware labels + math.
  if (typeof updateDriveUnitLabels === 'function') updateDriveUnitLabels();
  if (typeof updateDriveCost === 'function') updateDriveCost();
}

/* ── SAFE STORAGE ──
   Wraps localStorage in try/catch so preferences persist normally when this
   file is opened directly in a browser, but the site still works perfectly
   (just without cross-visit memory) in sandboxed contexts where storage
   access throws. In-memory `current*` variables are always the source of
   truth during a session either way. */
const safeStorage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  },
  /** True only when the user (or a prior session) has explicitly saved a value. */
  has(key) {
    try { return localStorage.getItem(key) !== null; }
    catch (e) { return false; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* in-memory state still works */ }
  }
};

/* ── FIRST-VISIT PREFERENCE DETECTION ──
   Only used when a key has never been saved — once the visitor picks something
   in Settings, that choice always wins. Safe, progressive, no network calls. */
const SUPPORTED_LANGS = ['en', 'es', 'zh', 'ja'];

function detectLanguage() {
  const candidates = [];
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  if (navigator.language) candidates.push(navigator.language);
  for (const raw of candidates) {
    const tag = String(raw || '').toLowerCase().replace('_', '-');
    if (!tag) continue;
    // Chinese: zh, zh-CN, zh-TW, zh-Hans, etc.
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh';
    if (tag === 'ja' || tag.startsWith('ja-')) return 'ja';
    if (tag === 'es' || tag.startsWith('es-')) return 'es';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
    // Primary subtag only (e.g. "pt-BR" → no match → keep scanning)
    const primary = tag.split('-')[0];
    if (SUPPORTED_LANGS.includes(primary)) return primary;
  }
  return 'en';
}

const LIGHT_THEMES = ['minimal', 'elegant'];

/**
 * Style-matched dark twins used only when the OS *switches into* dark mode
 * while a light theme is active — we change the user's selection to the twin
 * (so Settings UI matches what is painted). We do NOT silently paint a light
 * pick as its twin; choosing Gallery Daylight always paints Gallery Daylight.
 *   Gallery Daylight (minimal) → Twilight Glass (glass)
 *   Heritage Paper (elegant)   → Grand Tour (luxury)
 */
const LIGHT_THEME_DARK_TWIN = {
  minimal: 'glass',
  elegant: 'luxury'
};

function detectTheme() {
  /* First visit only (no saved Settings choice):
     · OS light mode  → Gallery Daylight (`minimal`)
     · OS dark mode / no preference → Midnight Atlas (`default`) */
  if (safeMatchMedia('(prefers-color-scheme: light)').matches) return 'minimal';
  return 'default';
}

function detectUnits() {
  // Prefer full locale region when available (en-GB → metric, en-US → imperial).
  const locales = [];
  if (Array.isArray(navigator.languages)) locales.push(...navigator.languages);
  if (navigator.language) locales.push(navigator.language);
  let region = '';
  for (const loc of locales) {
    const parts = String(loc || '').replace('_', '-').split('-');
    if (parts.length >= 2 && parts[1].length === 2) {
      region = parts[1].toUpperCase();
      break;
    }
  }
  // Countries that primarily use US customary units for everyday distance/temp.
  const imperialRegions = new Set(['US', 'LR', 'MM']);
  const imperial = imperialRegions.has(region);
  return { temp: imperial ? 'f' : 'c', dist: imperial ? 'mi' : 'km' };
}

/** Default animation level: OS “reduce motion” → reduced; constrained → off. */
function detectMotionModeDefault() {
  if (ENV.constrained) return 'off';
  if (ENV.reduceMotion) return 'reduced';
  return 'full';
}

function detectCursorDefault() {
  // No trail on touch-first / no-hover devices (phones, most tablets, watch).
  if (ENV.constrained) return false;
  if (safeMatchMedia('(hover: none)').matches) return false;
  if (safeMatchMedia('(pointer: coarse)').matches && !safeMatchMedia('(pointer: fine)').matches) return false;
  return true;
}

/** Migrate legacy on/off reduce-motion storage → full | reduced | off. */
function loadMotionModePreference() {
  if (safeStorage.has('usa-travel-motion')) {
    const v = safeStorage.get('usa-travel-motion', 'full');
    if (v === 'full' || v === 'reduced' || v === 'off') return v;
  }
  // Legacy: usa-travel-reduce-motion on = reduced-like (was near-off), off = full
  if (safeStorage.has('usa-travel-reduce-motion')) {
    return safeStorage.get('usa-travel-reduce-motion', 'off') === 'on' ? 'reduced' : 'full';
  }
  return detectMotionModeDefault();
}

/* ── SETTINGS STATE ──
   Saved preference → use it. Never saved → detect from the environment. */
const detectedUnits = detectUnits();
let currentTheme    = safeStorage.has('usa-travel-theme')
  ? safeStorage.get('usa-travel-theme', 'default')
  : detectTheme();
let currentLang     = safeStorage.has('usa-travel-lang')
  ? safeStorage.get('usa-travel-lang', 'en')
  : detectLanguage();
let currentTempUnit = safeStorage.has('usa-travel-temp-unit')
  ? safeStorage.get('usa-travel-temp-unit', 'f')
  : detectedUnits.temp;
let currentDistUnit = safeStorage.has('usa-travel-dist-unit')
  ? safeStorage.get('usa-travel-dist-unit', 'mi')
  : detectedUnits.dist;
/** User preference: full | reduced | off */
let motionMode = loadMotionModePreference();
let cursorEffectEnabled = safeStorage.has('usa-travel-cursor-fx')
  ? safeStorage.get('usa-travel-cursor-fx', 'on') !== 'off'
  : detectCursorDefault();
// Gallery lightbox quality: thumb | medium (default) | full
let galleryQuality = safeStorage.get('usa-travel-gallery-quality', 'medium');

// Guard against corrupt storage values
if (!['default', 'minimal', 'elegant', 'luxury', 'glass', 'nature'].includes(currentTheme)) currentTheme = 'default';
if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = 'en';
if (currentTempUnit !== 'f' && currentTempUnit !== 'c') currentTempUnit = 'f';
if (currentDistUnit !== 'mi' && currentDistUnit !== 'km') currentDistUnit = 'mi';
if (!['thumb', 'medium', 'full'].includes(galleryQuality)) galleryQuality = 'medium';
if (!['full', 'reduced', 'off'].includes(motionMode)) motionMode = 'full';

/* Respects the Settings choice AND the OS-level preference. Checked live so
   OS flips mid-session still calm things down. Constrained devices force off. */
const prefersReducedMotionMQ = safeMatchMedia('(prefers-reduced-motion: reduce)');

/**
 * Effective animation level after combining user + OS + device.
 * - off: no motion
 * - reduced: short, opacity-first, a11y-friendly motion
 * - full: standard experience
 */
function getEffectiveMotionMode() {
  if (ENV.constrained) return 'off';
  if (motionMode === 'off') return 'off';
  // OS “prefers reduced motion” never upgrades past reduced
  if (motionMode === 'reduced' || prefersReducedMotionMQ.matches) return 'reduced';
  return 'full';
}

/** True when non-essential motion should be avoided (reduced or off). */
function motionActive() {
  return getEffectiveMotionMode() !== 'full';
}
function motionIsOff() {
  return getEffectiveMotionMode() === 'off';
}
function motionIsReduced() {
  return getEffectiveMotionMode() === 'reduced';
}

function applyMotionModeToDom() {
  const effective = getEffectiveMotionMode();
  // User's explicit choice (for Settings UI)
  document.documentElement.setAttribute('data-motion', motionMode);
  // What CSS should actually paint
  document.documentElement.setAttribute('data-motion-effective', effective);
  // Legacy flag: only fully-off matches the old hard cut
  document.documentElement.setAttribute('data-reduce-motion', effective === 'off' ? 'true' : 'false');
}

applyMotionModeToDom();

/** Instant anchors when motion is reduced/off or on mobile (smoother under load). */
function scrollBehaviorPref() {
  const mode = getEffectiveMotionMode();
  if (mode !== 'full' || ENV.mobile) return 'auto';
  return 'smooth';
}

/* ── THEME SWATCHES ──
   currentTheme is always what paints AND what Settings highlights.
   OS dark does not repaint a light pick as its twin; user choice is sacred
   after an explicit swatch click. */
const themeSwatches = document.querySelectorAll('.theme-swatch');
function updateThemeUI(theme) {
  themeSwatches.forEach(sw => sw.classList.toggle('active', sw.dataset.themeVal === theme));
}
const THEME_META_COLORS = {
  default: '#07101c',
  minimal: '#f5f5f7',
  elegant: '#f6f1e8',
  luxury: '#0c0c0c',
  glass: '#000000',
  nature: '#141c18'
};
function applyThemeChrome(theme) {
  const light = LIGHT_THEMES.includes(theme);
  document.documentElement.style.colorScheme = light ? 'light' : 'dark';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META_COLORS[theme] || THEME_META_COLORS.default);
}
function applyThemePreference(preferred, { persist = false } = {}) {
  if (!['default', 'minimal', 'elegant', 'luxury', 'glass', 'nature'].includes(preferred)) {
    preferred = 'default';
  }
  currentTheme = preferred;
  if (persist) safeStorage.set('usa-travel-theme', preferred);
  // Paint exactly what the user chose — never silently substitute a twin.
  document.documentElement.setAttribute('data-theme', preferred);
  applyThemeChrome(preferred);
  updateThemeUI(preferred);
}
themeSwatches.forEach(sw => {
  sw.addEventListener('click', () => {
    applyThemePreference(sw.dataset.themeVal, { persist: true });
  });
});
applyThemePreference(currentTheme, { persist: false });
// When the OS flips into dark while a light theme is active, *switch selection*
// to the style-matched twin (persist). User can still pick Daylight/Paper after.
const prefersColorSchemeDarkMQ = safeMatchMedia('(prefers-color-scheme: dark)');
function onColorSchemeChange() {
  const osDark = !!prefersColorSchemeDarkMQ.matches;
  if (osDark && LIGHT_THEMES.includes(currentTheme)) {
    const twin = LIGHT_THEME_DARK_TWIN[currentTheme];
    if (twin) applyThemePreference(twin, { persist: true });
    return;
  }
  applyThemePreference(currentTheme, { persist: false });
}
if (typeof prefersColorSchemeDarkMQ.addEventListener === 'function') {
  prefersColorSchemeDarkMQ.addEventListener('change', onColorSchemeChange);
} else if (typeof prefersColorSchemeDarkMQ.addListener === 'function') {
  prefersColorSchemeDarkMQ.addListener(onColorSchemeChange);
}

/* ── LANGUAGE PILLS ── */
const langPills = document.querySelectorAll('#langPillGroup .pill-btn');
function updateLangUI(lang) {
  langPills.forEach(p => p.classList.toggle('active', p.dataset.langVal === lang));
}
langPills.forEach(p => {
  p.addEventListener('click', () => {
    currentLang = p.dataset.langVal;
    safeStorage.set('usa-travel-lang', currentLang);
    updateLangUI(currentLang);
    applyLanguage(currentLang);
  });
});
updateLangUI(currentLang);

/* ── UNIT PILLS ── */
const tempPills = document.querySelectorAll('#unitTempGroup .pill-btn');
const distPills = document.querySelectorAll('#unitDistGroup .pill-btn');
function updateUnitUI() {
  tempPills.forEach(p => p.classList.toggle('active', p.dataset.unitVal === currentTempUnit));
  distPills.forEach(p => p.classList.toggle('active', p.dataset.unitVal === currentDistUnit));
}
tempPills.forEach(p => p.addEventListener('click', () => {
  currentTempUnit = p.dataset.unitVal;
  safeStorage.set('usa-travel-temp-unit', currentTempUnit);
  updateUnitUI();
  applyUnits();
}));
distPills.forEach(p => p.addEventListener('click', () => {
  const next = p.dataset.unitVal;
  if (next !== currentDistUnit && typeof convertDriveInputsForUnitChange === 'function') {
    convertDriveInputsForUnitChange(currentDistUnit, next);
  }
  currentDistUnit = next;
  safeStorage.set('usa-travel-dist-unit', currentDistUnit);
  updateUnitUI();
  applyUnits();
}));
updateUnitUI();

/* ── ACCESSIBILITY PILLS (Animations: full / reduced / off · Cursor Effect) ── */
const motionPills = document.querySelectorAll('#motionPillGroup .pill-btn');
function updateMotionUI() {
  motionPills.forEach(p => p.classList.toggle('active', p.dataset.motionVal === motionMode));
}
function setMotionMode(next, { persist = true } = {}) {
  if (!['full', 'reduced', 'off'].includes(next)) next = 'full';
  motionMode = next;
  if (persist) safeStorage.set('usa-travel-motion', motionMode);
  applyMotionModeToDom();
  updateMotionUI();
  if (typeof updateCursorUI === 'function') updateCursorUI();
}
motionPills.forEach(p => p.addEventListener('click', () => {
  setMotionMode(p.dataset.motionVal || 'full', { persist: true });
}));
updateMotionUI();

const cursorPills = document.querySelectorAll('#cursorPillGroup .pill-btn');
function updateCursorUI() {
  cursorPills.forEach(p => p.classList.toggle('active', p.dataset.cursorVal === (cursorEffectEnabled ? 'on' : 'off')));
  // Keep the overlay canvas in sync — trail is off in reduced/off modes.
  const cursorCanvasEl = document.getElementById('cursorCanvas');
  if (cursorCanvasEl) {
    const off = !cursorEffectEnabled || motionActive();
    cursorCanvasEl.classList.toggle('is-disabled', off);
    cursorCanvasEl.setAttribute('aria-hidden', off ? 'true' : 'false');
  }
}
cursorPills.forEach(p => p.addEventListener('click', () => {
  cursorEffectEnabled = p.dataset.cursorVal === 'on';
  safeStorage.set('usa-travel-cursor-fx', cursorEffectEnabled ? 'on' : 'off');
  updateCursorUI();
}));
updateCursorUI();
// If the OS reduced-motion preference flips mid-session, re-apply effective mode.
function onOsMotionPreferenceChange() {
  applyMotionModeToDom();
  updateCursorUI();
}
if (typeof prefersReducedMotionMQ.addEventListener === 'function') {
  prefersReducedMotionMQ.addEventListener('change', onOsMotionPreferenceChange);
} else if (typeof prefersReducedMotionMQ.addListener === 'function') {
  prefersReducedMotionMQ.addListener(onOsMotionPreferenceChange);
}

/* ── GALLERY QUALITY PILLS (thumb / medium / full) ── */
const galleryQualityPills = document.querySelectorAll('#galleryQualityGroup .pill-btn');
function updateGalleryQualityUI() {
  galleryQualityPills.forEach(p => {
    p.classList.toggle('active', p.dataset.galleryQuality === galleryQuality);
  });
}
galleryQualityPills.forEach(p => p.addEventListener('click', () => {
  const next = p.dataset.galleryQuality;
  if (!['thumb', 'medium', 'full'].includes(next)) return;
  galleryQuality = next;
  safeStorage.set('usa-travel-gallery-quality', galleryQuality);
  updateGalleryQualityUI();
  // If lightbox is open, reload current photo at the new quality.
  if (typeof showLightboxPhoto === 'function' && lightbox && lightbox.classList.contains('open')) {
    try { showLightboxPhoto(currentIndex, { fromNav: true, force: true }); } catch (e) { /* ignore */ }
  }
}));
updateGalleryQualityUI();

/* ── UTILITY: GET CSS VARIABLE ── */
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#e8a435';
}

// Sizes a canvas's backing store to the device pixel ratio so drawing stays
// crisp on Retina / HiDPI / 4K+ screens instead of looking soft/blurry, while
// letting the rest of the drawing code keep working in plain CSS-pixel units.
// Capped lower on mobile so we don't allocate multi‑megapixel bitmaps.
// Explicit CSS width/height keep clientX/clientY coordinates aligned with the
// drawing buffer after the bitmap is scaled up for DPR.
function fitCanvasToDPR(canvas, ctx) {
  const maxDpr = ENV.mobile || ENV.constrained ? 1.5 : 3;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: cssW, height: cssH };
}

// Throttles a resize handler to at most once per animation frame so live
// window drag-resizing doesn't repeatedly reallocate canvas buffers.
// Ignores pure height-only visualViewport changes (mobile URL bar show/hide),
// which used to thrash canvas rebuilds mid-scroll and could crash Safari.
function onResizeRAF(fn) {
  let pending = false;
  let lastW = window.innerWidth || 0;
  let lastH = window.innerHeight || 0;
  const run = (force) => {
    if (pending) return;
    pending = true;
    raf(() => {
      pending = false;
      try {
        const w = window.innerWidth || 0;
        const h = window.innerHeight || 0;
        // Treat as meaningful only if width changed or height jumped a lot
        // (orientation / keyboard), not the ~50–100px URL-bar collapse.
        const dw = Math.abs(w - lastW);
        const dh = Math.abs(h - lastH);
        if (!force && dw < 40 && dh < 140) return;
        lastW = w;
        lastH = h;
        fn();
      } catch (e) { /* ignore */ }
    });
  };
  try {
    window.addEventListener('resize', () => run(false), { passive: true });
    window.addEventListener('orientationchange', () => run(true), { passive: true });
    // Intentionally NOT listening to visualViewport.resize — that fires on
    // every iOS chrome show/hide and caused mid-scroll canvas reallocations.
  } catch (e) { /* ignore */ }
}

/* ── SCROLL UI (progress + nav) — one rAF-throttled handler ── */
const progressBar = document.getElementById('progress-bar');
let scrollUiPending = false;
function updateScrollUi() {
  scrollUiPending = false;
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  if (progressBar) {
    const h = document.documentElement;
    const scrollable = h.scrollHeight - h.clientHeight;
    const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  // Navbar / section spy live in handlers registered below; fire a shared hook.
  if (typeof onPageScroll === 'function') onPageScroll(y);
}
window.addEventListener('scroll', () => {
  if (scrollUiPending) return;
  scrollUiPending = true;
  raf(updateScrollUi);
}, { passive: true });

/* ── CURSOR TRAIL ──
   Fine-pointer desktops only. Spawns particles only while the cursor is
   actually moving (not a stationary fountain), keeps CSS/bitmap size in
   lockstep for correct coordinates, and hard-caps particle count. */
(function() {
  const c = document.getElementById('cursorCanvas');
  if (!c) return;

  // Prefer devices that can hover with a fine pointer (mice / trackpads).
  // pointer:coarse alone is wrong on hybrid convertibles that report both.
  // Always off on constrained / wearable webviews (GPU + battery budget).
  const canHoverFine = !ENV.constrained
    && safeMatchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHoverFine) {
    c.classList.add('is-disabled');
    c.setAttribute('aria-hidden', 'true');
    return;
  }

  const ctx = c.getContext('2d', { alpha: true });
  if (!ctx) return;

  const particles = [];
  /* Toned-down editorial trail: fewer, smaller, shorter-lived sparks */
  const MAX_PARTICLES = 22;
  let mx = -999, my = -999;
  let prevX = -999, prevY = -999;
  let isMouseIn = false;
  let movedThisFrame = false;
  let cssW = 0, cssH = 0;
  let rafId = 0;
  let running = false;

  function resize() { ({ width: cssW, height: cssH } = fitCanvasToDPR(c, ctx)); }
  resize();
  onResizeRAF(resize);

  document.addEventListener('pointermove', e => {
    // Ignore touch/pen so hybrid tablets don't paint trails from finger pans.
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    isMouseIn = true;
    // Only treat as "moving" when the cursor actually traveled a pixel.
    if (Math.abs(mx - prevX) > 0.5 || Math.abs(my - prevY) > 0.5) {
      movedThisFrame = true;
      prevX = mx;
      prevY = my;
    }
    if (!running && cursorEffectEnabled && !motionActive()) startLoop();
  }, { passive: true });

  // window/document "mouseleave" is unreliable; relatedTarget null means the
  // pointer left the document (to chrome / another app).
  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget && !e.toElement) {
      isMouseIn = false;
      movedThisFrame = false;
    }
  });
  document.documentElement.addEventListener('mouseleave', () => {
    isMouseIn = false;
    movedThisFrame = false;
  });
  window.addEventListener('blur', () => {
    isMouseIn = false;
    movedThisFrame = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isMouseIn = false;
      movedThisFrame = false;
      particles.length = 0;
      ctx.clearRect(0, 0, cssW, cssH);
    }
  });

  function startLoop() {
    if (running) return;
    running = true;
    rafId = raf(tick);
  }
  function stopLoop() {
    running = false;
    if (rafId) cancelRaf(rafId);
    rafId = 0;
    ctx.clearRect(0, 0, cssW, cssH);
  }

  function tick() {
    if (!running) return;
    rafId = raf(tick);
    ctx.clearRect(0, 0, cssW, cssH);

    // Respect the "Cursor Trail" Settings toggle and reduced-motion preference.
    if (!cursorEffectEnabled || motionActive()) {
      if (particles.length) particles.length = 0;
      stopLoop();
      return;
    }

    const themeAccent = getCssVar('--accent-1');

    // Emit only while the pointer is moving — a quiet ink-trail, not a fountain.
    if (isMouseIn && movedThisFrame) {
      const burst = particles.length < MAX_PARTICLES / 3 ? 1 : (Math.random() > 0.45 ? 1 : 0);
      for (let n = 0; n < burst; n++) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push({
          x: mx + (Math.random() - 0.5) * 4,
          y: my + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -Math.random() * 0.55 - 0.12,
          life: 1,
          size: Math.random() * 1.6 + 0.7,
          color: themeAccent
        });
      }
      movedThisFrame = false;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.006;
      p.life -= 0.045;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.globalAlpha = p.life * 0.32;
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Idle with nothing left to draw — pause the RAF loop until next move.
    if (!particles.length && !movedThisFrame) {
      stopLoop();
    }
  }

  // Kick once if the trail is enabled so resize state is warm.
  if (cursorEffectEnabled && !motionActive()) {
    // Loop starts on first pointermove; keep canvas ready and visible.
    c.classList.remove('is-disabled');
  }
})();

/* ── NAVBAR + ACTIVE LINK ── */
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]:not(#settings):not(#tools)');
const navLinks = document.querySelectorAll('.nav-links a[data-section]');
const isGalleryPage = document.body.classList.contains('page-gallery');
const isToolsPage = document.body.classList.contains('page-tools');
const isMiniAppPage = isGalleryPage || isToolsPage;

// Cache section tops — avoid layout thrash from offsetTop on every scroll tick.
let sectionTopsCache = [];
let sectionTopsDirty = true;
function invalidateSectionTops() { sectionTopsDirty = true; }
function refreshSectionTops() {
  if (!sectionTopsDirty) return;
  sectionTopsCache = [];
  sections.forEach((s) => {
    sectionTopsCache.push({ id: s.id, top: s.offsetTop });
  });
  sectionTopsDirty = false;
}
try {
  window.addEventListener('resize', invalidateSectionTops, { passive: true });
  window.addEventListener('orientationchange', invalidateSectionTops, { passive: true });
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => { invalidateSectionTops(); });
    sections.forEach((s) => { try { ro.observe(s); } catch (e) { /* ignore */ } });
  }
} catch (e) { /* ignore */ }

function onPageScroll(y) {
  if (navbar) navbar.classList.toggle('scrolled', y > 60);

  // Mini-apps use their own chrome (no section spy on guide nav links).
  if (isMiniAppPage) {
    if (isGalleryPage) {
      navLinks.forEach(a => a.classList.toggle('active-link', a.dataset.section === 'gallery'));
    }
    return;
  }

  refreshSectionTops();
  let current = '';
  const threshold = y + 200;
  for (let i = 0; i < sectionTopsCache.length; i++) {
    if (threshold >= sectionTopsCache[i].top) current = sectionTopsCache[i].id;
  }
  // Homepage teaser uses id="gallery" — highlight Gallery while it's in view.
  navLinks.forEach(a => a.classList.toggle('active-link', a.dataset.section === current));
}

// Initial paint (e.g. gallery page load, deep-linked homepage section)
if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
if (isGalleryPage) {
  navLinks.forEach(a => a.classList.toggle('active-link', a.dataset.section === 'gallery'));
}

/* ── HAMBURGER (main guide only — gallery mini-app has no mobile drawer) ── */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    const willOpen = !hamburger.classList.contains('open');
    if (willOpen) {
      lockBodyScroll();
      hamburger.classList.add('open');
      navMobile.classList.add('open');
    } else {
      hamburger.classList.remove('open');
      navMobile.classList.remove('open');
      unlockBodyScroll();
    }
    hamburger.setAttribute('aria-expanded', String(willOpen));
  });
}

function closeMobileNav() {
  if (!hamburger || !navMobile) return;
  const wasOpen = navMobile.classList.contains('open');
  navMobile.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  if (wasOpen) unlockBodyScroll();
}

/* ── SETTINGS DIALOG ── */
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsOpenBtn = document.getElementById('settingsOpen');
const mobileSettingsBtn = document.getElementById('mobileSettingsBtn'); // may be null on gallery mini-app
const settingsCloseBtn = document.getElementById('settingsClose');
let lastSettingsTrigger = null;
// Nested-safe scroll lock: mobile nav, settings, tools, modals, and the
// lightbox all share this so opening one over another never resets scroll to 0
// or leaves body permanently fixed.
let scrollLockCount = 0;
let lockedScrollY = 0;

/** True when any full-screen overlay that owns the scroll lock is open. */
function isAnyScrollLockOverlayOpen() {
  const lb = document.getElementById('lightbox');
  if (lb && lb.classList.contains('open')) return true;
  if (settingsOverlay && settingsOverlay.classList.contains('open')) return true;
  const modal = document.getElementById('modal-overlay');
  if (modal && modal.classList.contains('open')) return true;
  const mobile = document.getElementById('navMobile');
  if (mobile && mobile.classList.contains('open')) return true;
  return false;
}

function clearBodyScrollLockStyles() {
  const html = document.documentElement;
  const y = lockedScrollY;
  // Force instant scroll BEFORE releasing body lock — otherwise CSS
  // `scroll-behavior: smooth` animates from the top to the saved offset.
  const prevInline = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  html.classList.add('scroll-instant');

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  html.style.overflow = '';

  if (typeof window.scrollTo === 'function') {
    try {
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, y);
    }
  } else {
    html.scrollTop = y;
    document.body.scrollTop = y;
  }

  // Restore smooth anchors on the next frame (after paint settles).
  raf(() => {
    raf(() => {
      html.style.scrollBehavior = prevInline;
      html.classList.remove('scroll-instant');
    });
  });
}

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    // Prevent iOS rubber-band from fighting the lock.
    document.documentElement.style.overflow = 'hidden';
  }
  scrollLockCount++;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount > 0) return;
  clearBodyScrollLockStyles();
}

/**
 * Safety net: if no overlay is open but the body is still locked (e.g. Enter
 * on role=button also synthesized a click and double-incremented the counter),
 * force a full release so mouse wheel / trackpad scrolling works again.
 */
function ensureBodyScrollUnlocked() {
  if (isAnyScrollLockOverlayOpen()) return;
  if (scrollLockCount === 0
      && !document.body.style.position
      && !document.documentElement.style.overflow) {
    return;
  }
  scrollLockCount = 0;
  clearBodyScrollLockStyles();
}

function openSettings(trigger) {
  if (!settingsOverlay || settingsOverlay.classList.contains('open')) return;
  // Don't open settings over an open lightbox — close it first so scroll lock stays sane.
  if (typeof closeLightbox === 'function' && document.getElementById('lightbox')?.classList.contains('open')) {
    closeLightbox();
  }
  lastSettingsTrigger = trigger || document.activeElement;
  closeMobileNav();
  lockBodyScroll();
  settingsOverlay.classList.add('open');
  settingsOverlay.setAttribute('aria-hidden', 'false');
  settingsOverlay.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  if (settingsCloseBtn) setTimeout(() => settingsCloseBtn.focus(), 100);
}

function closeSettings() {
  if (!settingsOverlay || !settingsOverlay.classList.contains('open')) return;
  const restoreY = lockedScrollY;
  settingsOverlay.classList.remove('open');
  settingsOverlay.setAttribute('aria-hidden', 'true');
  unlockBodyScroll();
  ensureBodyScrollUnlocked();
  if (lastSettingsTrigger && typeof lastSettingsTrigger.focus === 'function') {
    try { lastSettingsTrigger.focus({ preventScroll: true }); }
    catch (e) { lastSettingsTrigger.focus(); }
  }
  try { window.scrollTo({ top: restoreY, left: 0, behavior: 'instant' }); }
  catch (e) { window.scrollTo(0, restoreY); }
}

if (settingsOpenBtn) settingsOpenBtn.addEventListener('click', () => openSettings(settingsOpenBtn));
if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', () => openSettings(mobileSettingsBtn));
if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettings);
if (settingsOverlay) settingsOverlay.addEventListener('click', e => { if (e.target === settingsOverlay) closeSettings(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && settingsOverlay && settingsOverlay.classList.contains('open')) {
    e.preventDefault();
    closeSettings();
    // Prevent the later modal / mobile-nav Escape handler from also firing.
    e.stopImmediatePropagation();
  }
});

