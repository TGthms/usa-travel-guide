'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   USA Travel Guide — client application
   Shared by index.html · gallery.html · tools.html · privacy · terms

   Companion data scripts (plain classic scripts, not ES modules):
   · src/js/data/i18n.js          → window.I18N          (all pages)
   · src/js/data/fun-facts.js     → window.FUN_FACTS     (index)
   · src/js/data/modal-content.js → window.MODAL_DATA*   (index)
   · src/js/data/dest-links.js    → window.DEST_*        (index)
   · src/js/legal-i18n.js         → window.LEGAL_I18N    (privacy/terms)

   Kept as non-module scripts so inline onclick handlers (e.g. favorites)
   continue to resolve globals via window.toggleFavorite.

   Design goals for extreme environments (watchOS Safari, low-memory
   webviews, feature-incomplete browsers):
   · Never throw on missing APIs (IntersectionObserver, matchMedia, …)
   · Skip GPU-heavy work (cursor trail) when constrained / mobile
   · One full-res gallery image in flight at a time
   · Preferences survive sandboxed storage via safeStorage
   ═══════════════════════════════════════════════════════════════════════ */

/* ── CAPABILITY / ENVIRONMENT ── */
function safeMatchMedia(query) {
  try {
    if (typeof window.matchMedia === 'function') return window.matchMedia(query);
  } catch (e) { /* some webviews throw on unknown queries */ }
  return { matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
}

function isConstrainedViewport() {
  try {
    const w = window.innerWidth || 0;
    const h = window.innerHeight || 0;
    // watchOS / wearable webviews are typically well under 320 CSS px
    if ((w > 0 && w <= 320) || (h > 0 && h <= 280)) return true;
    if (safeMatchMedia('(max-width: 320px), (max-height: 280px)').matches) return true;
    // Optional Client Hints — ignore if absent
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory < 1) return true;
  } catch (e) { /* ignore */ }
  return false;
}

/** Phones / tablets / coarse pointers — skip perpetual GPU effects that jank scroll. */
function isMobileOrCoarsePointer() {
  try {
    if (safeMatchMedia('(max-width: 900px)').matches) return true;
    if (safeMatchMedia('(pointer: coarse)').matches) return true;
    if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1
        && safeMatchMedia('(max-width: 1200px)').matches) return true;
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4) return true;
  } catch (e) { /* ignore */ }
  return false;
}

const ENV = {
  constrained: isConstrainedViewport(),
  mobile: isMobileOrCoarsePointer(),
  hasIO: typeof IntersectionObserver === 'function',
  hasRAF: typeof requestAnimationFrame === 'function',
  hasXHR: typeof XMLHttpRequest === 'function',
  reduceMotion: safeMatchMedia('(prefers-reduced-motion: reduce)').matches
};

// Let CSS disable GPU-heavy layers without waiting for full script paint.
try {
  if (ENV.mobile || ENV.constrained) {
    document.documentElement.setAttribute('data-mobile-lite', 'true');
  }
} catch (e) { /* ignore */ }

function raf(fn) {
  if (ENV.hasRAF) return requestAnimationFrame(fn);
  return setTimeout(() => fn(Date.now()), 16);
}
function cancelRaf(id) {
  if (id == null) return;
  try {
    if (ENV.hasRAF) cancelAnimationFrame(id);
    else clearTimeout(id);
  } catch (e) { /* ignore */ }
}

/** Observe elements entering the viewport; fall back to immediate reveal. */
function observeWhenVisible(elements, onVisible, options) {
  const list = elements && elements.length != null ? Array.from(elements) : [];
  if (!list.length) return null;
  if (!ENV.hasIO) {
    list.forEach(onVisible);
    return null;
  }
  try {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onVisible(entry.target);
          try { obs.unobserve(entry.target); } catch (e) { /* ignore */ }
        }
      });
    }, options || { threshold: 0.08 });
    list.forEach((el) => { try { obs.observe(el); } catch (e) { onVisible(el); } });
    return obs;
  } catch (e) {
    list.forEach(onVisible);
    return null;
  }
}

// Prevent a single unhandled rejection from blanking constrained webviews.
window.addEventListener('unhandledrejection', (e) => {
  try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (err) { /* ignore */ }
});

/* ── LOADER ── */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  // Keep the splash short — long artificial waits hurt first interaction.
  // Constrained / mobile skip the wait entirely.
  if (ENV.constrained || ENV.mobile) {
    loader.classList.add('gone');
    return;
  }
  const isMiniApp = document.body.classList.contains('page-gallery')
    || document.body.classList.contains('page-tools')
    || document.body.classList.contains('page-legal');
  const delay = isMiniApp ? 400 : 700;
  setTimeout(() => { try { loader.classList.add('gone'); } catch (e) { /* ignore */ } }, delay);
});


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

function applyLanguage(lang) {
  const dict = I18N[lang];
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
  if (currentModalKey) {
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

/* ── HOMEPAGE-ONLY FEATURES ──
   Everything below (hero parallax, regions carousel, destinations carousel
   + favorites + filtering) only exists on the homepage. This script is
   shared with other pages (e.g. gallery.html) that reuse the same header,
   settings/tools dialogs, and gallery/lightbox further down — so this whole
   block is skipped there instead of throwing on missing elements. */
if (document.getElementById('hero')) {

/* ── PARALLAX removed — caused scroll jank and layer promotion cost on many GPUs.
   Hero background is a static gradient (see .hero-bg). */

/* ── HERO SCROLL CLICK ── */
const heroScrollBtn = document.getElementById('heroScroll');
if (heroScrollBtn) {
  heroScrollBtn.addEventListener('click', () => {
    const intro = document.getElementById('intro');
    if (intro) intro.scrollIntoView({ behavior: scrollBehaviorPref() });
  });
}

/* ── REGIONS CAROUSEL (mirrors destinations pattern; grid on desktop, carousel below 1100px) ── */
const regionsTrack = document.getElementById('regionsTrack');
const regionBtnLeft = document.getElementById('regionScrollLeft');
const regionBtnRight = document.getElementById('regionScrollRight');

function regionScrollStep() {
  if (!regionsTrack) return 300;
  const card = regionsTrack.querySelector('.region-card');
  if (!card) return 300;
  const style = getComputedStyle(regionsTrack);
  const gap = parseFloat(style.columnGap || style.gap || 16);
  return card.getBoundingClientRect().width + gap;
}
if (regionsTrack && regionBtnLeft && regionBtnRight) {
  regionBtnLeft.addEventListener('click', () => {
    regionsTrack.scrollBy({ left: -regionScrollStep(), behavior: scrollBehaviorPref() });
  });
  regionBtnRight.addEventListener('click', () => {
    regionsTrack.scrollBy({ left: regionScrollStep(), behavior: scrollBehaviorPref() });
  });

  function updateRegionBtns() {
    const maxScroll = regionsTrack.scrollWidth - regionsTrack.clientWidth;
    regionBtnLeft.disabled = regionsTrack.scrollLeft <= 5;
    regionBtnRight.disabled = regionsTrack.scrollLeft >= maxScroll - 5;
  }
  regionsTrack.addEventListener('scroll', updateRegionBtns, {passive: true});
  setTimeout(updateRegionBtns, 500);
  // Recalculate button state when the layout switches grid ↔ carousel
  onResizeRAF(updateRegionBtns);
}

/* ── DESTINATION FAVORITES ──
   A lightweight "save for later" system. Persists the same way as other
   preferences (safeStorage with in-memory fallback). The heart button sits
   on every destination card; state survives filtering, language switches,
   and (when storage is available) page reloads. */
let favorites = new Set();
try {
  const saved = JSON.parse(safeStorage.get('usa-travel-favorites', '[]'));
  if (Array.isArray(saved)) favorites = new Set(saved);
} catch (e) { /* corrupted or absent — start fresh */ }

const savedCountEl = document.getElementById('savedCount');
function persistFavorites() {
  safeStorage.set('usa-travel-favorites', JSON.stringify([...favorites]));
  if (savedCountEl) savedCountEl.textContent = favorites.size;
}
function syncFavoriteButtons() {
  document.querySelectorAll('.dest-card').forEach(card => {
    const btn = card.querySelector('.dest-fav-btn');
    if (btn) btn.classList.toggle('active', favorites.has(card.dataset.dest));
  });
}
function toggleFavorite(btn) {
  const card = btn.closest('.dest-card');
  const key = card.dataset.dest;
  if (favorites.has(key)) { favorites.delete(key); btn.classList.remove('active'); }
  else { favorites.add(key); btn.classList.add('active'); btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse'); }
  persistFavorites();
  // Live-refresh the "Saved" filter view if it's the active one
  if (destFilterBar && destFilterBar.querySelector('.dest-filter-btn.active')?.dataset.filter === 'saved') {
    applyDestFilter('saved');
  }
}
// Called from an inline onclick="" attribute in the HTML, which resolves
// names against the global scope — 'use strict' means a function declared
// inside this if-block would otherwise NOT be reachable from there.
window.toggleFavorite = toggleFavorite;
syncFavoriteButtons();
persistFavorites(); // paints the initial count without re-writing storage unnecessarily

/* ── DESTINATION FILTER (region + saved) ── */
const destFilterBar = document.getElementById('destFilterBar');
const destEmptyState = document.getElementById('destEmptyState');
const destEmptyStateDefaultKey = destEmptyState ? destEmptyState.getAttribute('data-i18n') : null;
const EMPTY_STATE_SAVED_TEXT = { en: "You haven't saved any cities yet. Tap the heart icon on a city card to save it.", es: "Aún no has guardado ninguna ciudad. Toca el icono del corazón en una tarjeta de ciudad para guardarla.", zh: "你还没有收藏任何城市。点击城市卡片上的心形图标即可收藏。", ja: "まだお気に入りの都市がありません。都市カードのハートアイコンをタップして保存しましょう。" };

function applyDestFilter(filter) {
  const track = document.getElementById('destTrack');
  if (!track) return;
  let visibleCount = 0;
  track.querySelectorAll('.dest-card').forEach(card => {
    const match = filter === 'all' || (filter === 'saved' ? favorites.has(card.dataset.dest) : card.dataset.region === filter);
    card.classList.toggle('filtered-out', !match);
    if (match) visibleCount++;
  });
  if (destEmptyState) {
    destEmptyState.classList.toggle('show', visibleCount === 0);
    if (filter === 'saved') {
      destEmptyState.setAttribute('data-i18n', 'dest.emptyStateSaved');
      const dict = I18N[currentLang];
      destEmptyState.textContent = (dict && dict['dest.emptyStateSaved'])
        || EMPTY_STATE_SAVED_TEXT[currentLang]
        || EMPTY_STATE_SAVED_TEXT.en;
    } else if (destEmptyStateDefaultKey) {
      destEmptyState.setAttribute('data-i18n', destEmptyStateDefaultKey);
      const dict = I18N[currentLang];
      destEmptyState.textContent = (dict && dict[destEmptyStateDefaultKey]) || i18nOriginals.get(destEmptyState) || destEmptyState.textContent;
    }
  }
}
/** Re-apply the active dest filter after language changes (homepage only). */
window.syncDestFilterUi = function syncDestFilterUi() {
  if (!destFilterBar) return;
  const active = destFilterBar.querySelector('.dest-filter-btn.active');
  applyDestFilter((active && active.dataset.filter) || 'all');
};
if (destFilterBar) {
  destFilterBar.addEventListener('click', e => {
    const btn = e.target.closest('.dest-filter-btn');
    if (!btn) return;
    destFilterBar.querySelectorAll('.dest-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyDestFilter(btn.dataset.filter);
    const track = document.getElementById('destTrack');
    if (track) track.scrollTo({ left: 0, behavior: scrollBehaviorPref() });
  });
}

/* ── DESTINATIONS CAROUSEL ── */
const destTrack = document.getElementById('destTrack');
const btnLeft = document.getElementById('destScrollLeft');
const btnRight = document.getElementById('destScrollRight');

function updateCarouselBtns() {
  if (!destTrack || !btnLeft || !btnRight) return;
  const maxScroll = destTrack.scrollWidth - destTrack.clientWidth;
  btnLeft.disabled = destTrack.scrollLeft <= 5;
  btnRight.disabled = destTrack.scrollLeft >= maxScroll - 5;
}

function destScrollStep() {
  if (!destTrack) return 344;
  const card = destTrack.querySelector('.dest-card');
  if (!card) return 344;
  const style = getComputedStyle(destTrack);
  const gap = parseFloat(style.columnGap || style.gap || 24);
  return card.getBoundingClientRect().width + gap;
}

if (destTrack && btnLeft && btnRight) {
  btnLeft.addEventListener('click', () => {
    destTrack.scrollBy({ left: -destScrollStep(), behavior: scrollBehaviorPref() });
  });
  btnRight.addEventListener('click', () => {
    destTrack.scrollBy({ left: destScrollStep(), behavior: scrollBehaviorPref() });
  });
  destTrack.addEventListener('scroll', updateCarouselBtns, {passive: true});
  setTimeout(updateCarouselBtns, 500);
  onResizeRAF(updateCarouselBtns);
}

} // end homepage-only guard (if #hero present)

/* ── SCROLL REVEAL ── */
const allReveal = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
observeWhenVisible(allReveal, (el) => { el.classList.add('visible'); }, {
  threshold: 0.05,
  rootMargin: '0px 0px -40px 0px'
});

/* ── TEMPERATURE BARS ── */
const tb = document.getElementById('tempBars');
if (tb) {
  observeWhenVisible([tb], (el) => {
    el.querySelectorAll('.temp-fill').forEach((b) => b.classList.add('animated'));
  }, { threshold: 0.3 });
}

/* ── SMOOTH ANCHORS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;
    if (a.classList.contains('nav-logo')) return;
    const target = document.querySelector(hash);
    if (!target) return; // let the browser handle anything we don't recognize
    e.preventDefault();
    closeMobileNav();
    target.scrollIntoView({ behavior: scrollBehaviorPref(), block: 'start' });
  });
});

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
  const y = lockedScrollY;
  const html = document.documentElement;
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


/* ── TRAVEL TOOLS ──
   Dedicated page (tools.html). Live widgets refresh on language/unit change. */
function refreshToolsLive() {
  if (typeof updateWorldClock === 'function') updateWorldClock();
  if (typeof populateCurrencySelects === 'function') populateCurrencySelects();
  if (typeof updateCurrency === 'function') updateCurrency();
  if (typeof updateTipEstimator === 'function') updateTipEstimator();
  if (typeof updateDriveUnitLabels === 'function') updateDriveUnitLabels();
  if (typeof updateDriveCost === 'function') updateDriveCost();
}

// Dynamic UI strings for the Tools panel (currency converter, tip estimator,
// world clock). These are generated at runtime rather than sitting in static
// HTML, so they need their own small translation table alongside the main
// I18N dictionary — this keeps the Tools panel fully localized instead of
// silently staying in English when another language is selected.
const TOOLS_TEXT = {
  en: { sameCurrency: 'Same currency selected.', updating: 'Updating...', fetching: 'Fetching latest available daily rate.', rateUnavailable: 'Rate unavailable', checkConnection: 'Check your connection and try again.', tax: 'Tax', tip: 'Tip',
    driveGal: 'gal', driveL: 'L', salesTaxZero: 'No statewide sales tax (local may apply).',
    driveMpgMi: 'MPG', driveMpgKm: 'L/100 km', driveFuelGal: 'Fuel $/gal', driveFuelL: 'Fuel $/L',
    driveEvMi: 'mi/kWh', driveEvKm: 'kWh/100 km',
    cities: { 'Los Angeles': 'Los Angeles', 'New York': 'New York', 'London': 'London', 'Paris': 'Paris', 'Tokyo': 'Tokyo', 'Shanghai': 'Shanghai' } },
  es: { sameCurrency: 'Misma divisa seleccionada.', updating: 'Actualizando…', fetching: 'Obteniendo el último tipo de cambio diario disponible.', rateUnavailable: 'Tipo de cambio no disponible', checkConnection: 'Comprueba tu conexión e inténtalo de nuevo.', tax: 'Impuesto', tip: 'Propina',
    driveGal: 'gal', driveL: 'L', salesTaxZero: 'Sin impuesto estatal de ventas (puede haber impuestos locales).',
    driveMpgMi: 'MPG', driveMpgKm: 'L/100 km', driveFuelGal: 'Combustible $/gal', driveFuelL: 'Combustible $/L',
    driveEvMi: 'mi/kWh', driveEvKm: 'kWh/100 km',
    cities: { 'Los Angeles': 'Los Ángeles', 'New York': 'Nueva York', 'London': 'Londres', 'Paris': 'París', 'Tokyo': 'Tokio', 'Shanghai': 'Shanghái' } },
  zh: { sameCurrency: '已选择相同货币。', updating: '更新中…', fetching: '正在获取最新每日汇率。', rateUnavailable: '汇率不可用', checkConnection: '请检查网络连接后重试。', tax: '税费', tip: '小费',
    driveGal: '加仑', driveL: '升', salesTaxZero: '该州无州销售税（可能仍有地方税）。',
    driveMpgMi: 'MPG', driveMpgKm: '升/百公里', driveFuelGal: '油价 $/加仑', driveFuelL: '油价 $/升',
    driveEvMi: '英里/度', driveEvKm: '度/百公里',
    cities: { 'Los Angeles': '洛杉矶', 'New York': '纽约', 'London': '伦敦', 'Paris': '巴黎', 'Tokyo': '东京', 'Shanghai': '上海' } },
  ja: { sameCurrency: '同じ通貨が選択されています。', updating: '更新中…', fetching: '最新の為替レートを取得しています。', rateUnavailable: 'レートを取得できません', checkConnection: '接続を確認して再度お試しください。', tax: '税金', tip: 'チップ',
    driveGal: 'ガロン', driveL: 'L', salesTaxZero: '州の売上税はありません（地方税がかかる場合あり）。',
    driveMpgMi: 'MPG', driveMpgKm: 'L/100km', driveFuelGal: '燃料 $/gal', driveFuelL: '燃料 $/L',
    driveEvMi: 'mi/kWh', driveEvKm: 'kWh/100km',
    cities: { 'Los Angeles': 'ロサンゼルス', 'New York': 'ニューヨーク', 'London': 'ロンドン', 'Paris': 'パリ', 'Tokyo': '東京', 'Shanghai': '上海' } },
};
function toolsText() { return TOOLS_TEXT[currentLang] || TOOLS_TEXT.en; }

/* Localized currency display names for the converter selects (codes stay ISO). */
const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'HKD', 'CHF', 'MXN'];
const CURRENCY_NAMES = {
  en: {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar', JPY: 'Japanese Yen', CNY: 'Chinese Yuan',
    HKD: 'Hong Kong Dollar', CHF: 'Swiss Franc', MXN: 'Mexican Peso'
  },
  es: {
    USD: 'Dólar estadounidense', EUR: 'Euro', GBP: 'Libra esterlina', CAD: 'Dólar canadiense',
    AUD: 'Dólar australiano', JPY: 'Yen japonés', CNY: 'Yuan chino',
    HKD: 'Dólar de Hong Kong', CHF: 'Franco suizo', MXN: 'Peso mexicano'
  },
  zh: {
    USD: '美元', EUR: '欧元', GBP: '英镑', CAD: '加拿大元',
    AUD: '澳大利亚元', JPY: '日元', CNY: '人民币',
    HKD: '港元', CHF: '瑞士法郎', MXN: '墨西哥比索'
  },
  ja: {
    USD: '米ドル', EUR: 'ユーロ', GBP: '英ポンド', CAD: 'カナダドル',
    AUD: 'オーストラリアドル', JPY: '日本円', CNY: '中国元',
    HKD: '香港ドル', CHF: 'スイスフラン', MXN: 'メキシコペソ'
  }
};

function getCurrencyNames() {
  return CURRENCY_NAMES[currentLang] || CURRENCY_NAMES.en;
}

function currencyOptionLabel(code) {
  const names = getCurrencyNames();
  const name = names[code] || code;
  // CJK: name first is more natural; Latin: code then name
  if (currentLang === 'zh' || currentLang === 'ja') return `${name} (${code})`;
  return `${code} — ${name}`;
}

function populateCurrencySelects() {
  if (!currencyFrom || !currencyTo) return;
  const prevFrom = currencyFrom.value || 'USD';
  const prevTo = currencyTo.value || 'EUR';
  const mkOptions = (selected) => CURRENCY_CODES.map(code =>
    `<option value="${code}"${code === selected ? ' selected' : ''}>${currencyOptionLabel(code)}</option>`
  ).join('');
  currencyFrom.innerHTML = mkOptions(CURRENCY_CODES.includes(prevFrom) ? prevFrom : 'USD');
  currencyTo.innerHTML = mkOptions(CURRENCY_CODES.includes(prevTo) ? prevTo : 'EUR');
  // Ensure selection stuck if browser ignored selected attributes
  currencyFrom.value = CURRENCY_CODES.includes(prevFrom) ? prevFrom : 'USD';
  currencyTo.value = CURRENCY_CODES.includes(prevTo) ? prevTo : 'EUR';
}

const currencyAmount = document.getElementById('currencyAmount');
const currencyFrom = document.getElementById('currencyFrom');
const currencyTo = document.getElementById('currencyTo');
const currencyResult = document.getElementById('currencyResult');
const currencyMeta = document.getElementById('currencyMeta');
const currencySwap = document.getElementById('currencySwap');
let currencyAbort = null;

function moneyFmt(value, currency) {
  try { return new Intl.NumberFormat(currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch (e) { return `${value.toFixed(2)} ${currency}`; }
}

// Build localized currency options as soon as the selects exist.
populateCurrencySelects();

let currencyReqId = 0;

async function updateCurrency() {
  if (!currencyAmount || !currencyFrom || !currencyTo || !currencyResult) return;
  // Always cancel any in-flight request first (including same-currency / offline paths)
  // so a late fetch cannot overwrite a newer UI state.
  if (currencyAbort && typeof currencyAbort.abort === 'function') {
    try { currencyAbort.abort(); } catch (_) { /* ignore */ }
  }
  currencyAbort = null;

  const amount = Math.max(0, Number(currencyAmount.value) || 0);
  const base = currencyFrom.value;
  const quote = currencyTo.value;
  const t = toolsText();
  const reqId = ++currencyReqId;

  if (base === quote) {
    currencyResult.textContent = `${moneyFmt(amount, base)} = ${moneyFmt(amount, quote)}`;
    currencyMeta.textContent = t.sameCurrency;
    return;
  }
  if (typeof fetch !== 'function') {
    currencyResult.textContent = t.rateUnavailable;
    currencyMeta.textContent = t.checkConnection;
    return;
  }
  const canAbort = typeof AbortController === 'function';
  currencyAbort = canAbort ? new AbortController() : null;
  currencyResult.textContent = t.updating;
  currencyMeta.textContent = t.fetching;
  try {
    const fetchOpts = currencyAbort ? { signal: currencyAbort.signal } : {};
    const res = await fetch(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, fetchOpts);
    if (reqId !== currencyReqId) return; // superseded
    if (!res.ok) throw new Error('Rate unavailable');
    const data = await res.json();
    if (reqId !== currencyReqId) return;
    // Inputs may have changed while we waited (even if abort is unsupported).
    if (currencyFrom.value !== base || currencyTo.value !== quote) return;
    const stillAmount = Math.max(0, Number(currencyAmount.value) || 0);
    const converted = stillAmount * Number(data.rate);
    currencyResult.textContent = `${moneyFmt(stillAmount, base)} = ${moneyFmt(converted, quote)}`;
    currencyMeta.textContent = `1 ${base} = ${Number(data.rate).toFixed(4)} ${quote}${data.date ? ` · ${data.date}` : ''}`;
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    if (reqId !== currencyReqId) return;
    currencyResult.textContent = t.rateUnavailable;
    currencyMeta.textContent = t.checkConnection;
  }
}

[currencyAmount, currencyFrom, currencyTo].forEach(el => {
  if (el) el.addEventListener('input', updateCurrency);
});
[currencyFrom, currencyTo].forEach(el => {
  if (el) el.addEventListener('change', updateCurrency);
});
if (currencySwap) {
  currencySwap.addEventListener('click', () => {
    const from = currencyFrom.value;
    currencyFrom.value = currencyTo.value;
    currencyTo.value = from;
    updateCurrency();
  });
}

const worldClockList = document.getElementById('worldClockList');
const CLOCK_ZONES = [
  ['Los Angeles', 'America/Los_Angeles'], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Paris', 'Europe/Paris'], ['Tokyo', 'Asia/Tokyo'], ['Shanghai', 'Asia/Shanghai']
];
function updateWorldClock() {
  if (!worldClockList) return;
  const locale = currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : 'en-US';
  const cities = toolsText().cities;
  worldClockList.innerHTML = CLOCK_ZONES.map(([city, zone]) => {
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: currentLang === 'en', timeZone: zone }).format(new Date());
    return `<div class="clock-row"><div><div class="clock-city">${cities[city] || city}</div><div class="clock-zone">${zone.replace(/_/g, ' ')}</div></div><div class="clock-time">${time}</div></div>`;
  }).join('');
}
// World clock interval — started only when the tools page is active.
let worldClockInterval = null;

/* Approximate average combined state + local sales tax (%).
   Source-style public averages — local rates vary; user can override Tax %. */
const SALES_TAX_RATES = {
  AL: 9.29, AK: 1.76, AZ: 8.40, AR: 9.51, CA: 8.85, CO: 7.77, CT: 6.35, DE: 0,
  DC: 6.00, FL: 7.01, GA: 7.38, HI: 4.44, ID: 6.03, IL: 8.86, IN: 7.00, IA: 6.94,
  KS: 8.70, KY: 6.00, LA: 9.56, ME: 5.50, MD: 6.00, MA: 6.25, MI: 6.00, MN: 7.49,
  MS: 7.07, MO: 8.29, MT: 0, NE: 6.94, NV: 8.23, NH: 0, NJ: 6.63, NM: 7.84,
  NY: 8.52, NC: 6.98, ND: 6.96, OH: 7.24, OK: 8.98, OR: 0, PA: 6.34, RI: 7.00,
  SC: 7.46, SD: 6.11, TN: 9.55, TX: 8.20, UT: 7.19, VT: 6.36, VA: 5.75, WA: 9.38,
  WV: 6.55, WI: 5.43, WY: 5.36
};
/* Localized U.S. state / DC names for the tip & sales-tax selector (en/es/zh/ja).
   Option values stay as ISO-style codes so tax rates never depend on display language. */
const US_STATE_NAMES = {
  en: {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
    MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  },
  es: {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington D. C.',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawái', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Luisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Míchigan', MN: 'Minnesota',
    MS: 'Misisipi', MO: 'Misuri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'Nuevo Hampshire', NJ: 'Nueva Jersey', NM: 'Nuevo México', NY: 'Nueva York',
    NC: 'Carolina del Norte', ND: 'Dakota del Norte', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregón',
    PA: 'Pensilvania', RI: 'Rhode Island', SC: 'Carolina del Sur', SD: 'Dakota del Sur',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'Virginia Occidental', WI: 'Wisconsin', WY: 'Wyoming'
  },
  zh: {
    AL: '阿拉巴马州', AK: '阿拉斯加州', AZ: '亚利桑那州', AR: '阿肯色州', CA: '加利福尼亚州',
    CO: '科罗拉多州', CT: '康涅狄格州', DE: '特拉华州', DC: '华盛顿哥伦比亚特区',
    FL: '佛罗里达州', GA: '佐治亚州', HI: '夏威夷州', ID: '爱达荷州', IL: '伊利诺伊州',
    IN: '印第安纳州', IA: '艾奥瓦州', KS: '堪萨斯州', KY: '肯塔基州', LA: '路易斯安那州',
    ME: '缅因州', MD: '马里兰州', MA: '马萨诸塞州', MI: '密歇根州', MN: '明尼苏达州',
    MS: '密西西比州', MO: '密苏里州', MT: '蒙大拿州', NE: '内布拉斯加州', NV: '内华达州',
    NH: '新罕布什尔州', NJ: '新泽西州', NM: '新墨西哥州', NY: '纽约州',
    NC: '北卡罗来纳州', ND: '北达科他州', OH: '俄亥俄州', OK: '俄克拉荷马州', OR: '俄勒冈州',
    PA: '宾夕法尼亚州', RI: '罗得岛州', SC: '南卡罗来纳州', SD: '南达科他州',
    TN: '田纳西州', TX: '得克萨斯州', UT: '犹他州', VT: '佛蒙特州', VA: '弗吉尼亚州',
    WA: '华盛顿州', WV: '西弗吉尼亚州', WI: '威斯康星州', WY: '怀俄明州'
  },
  ja: {
    AL: 'アラバマ州', AK: 'アラスカ州', AZ: 'アリゾナ州', AR: 'アーカンソー州', CA: 'カリフォルニア州',
    CO: 'コロラド州', CT: 'コネチカット州', DE: 'デラウェア州', DC: 'ワシントンD.C.',
    FL: 'フロリダ州', GA: 'ジョージア州', HI: 'ハワイ州', ID: 'アイダホ州', IL: 'イリノイ州',
    IN: 'インディアナ州', IA: 'アイオワ州', KS: 'カンザス州', KY: 'ケンタッキー州', LA: 'ルイジアナ州',
    ME: 'メイン州', MD: 'メリーランド州', MA: 'マサチューセッツ州', MI: 'ミシガン州', MN: 'ミネソタ州',
    MS: 'ミシシッピ州', MO: 'ミズーリ州', MT: 'モンタナ州', NE: 'ネブラスカ州', NV: 'ネバダ州',
    NH: 'ニューハンプシャー州', NJ: 'ニュージャージー州', NM: 'ニューメキシコ州', NY: 'ニューヨーク州',
    NC: 'ノースカロライナ州', ND: 'ノースダコタ州', OH: 'オハイオ州', OK: 'オクラホマ州', OR: 'オレゴン州',
    PA: 'ペンシルベニア州', RI: 'ロードアイランド州', SC: 'サウスカロライナ州', SD: 'サウスダコタ州',
    TN: 'テネシー州', TX: 'テキサス州', UT: 'ユタ州', VT: 'バーモント州', VA: 'バージニア州',
    WA: 'ワシントン州', WV: 'ウェストバージニア州', WI: 'ウィスコンシン州', WY: 'ワイオミング州'
  }
};

function getStateNames() {
  return US_STATE_NAMES[currentLang] || US_STATE_NAMES.en;
}

function stateNameLocale() {
  return currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja' : currentLang === 'es' ? 'es' : 'en';
}

const billAmount = document.getElementById('billAmount');
const taxRate = document.getElementById('taxRate');
const tipRate = document.getElementById('tipRate');
const tipResult = document.getElementById('tipResult');
const tipMeta = document.getElementById('tipMeta');
const salesTaxState = document.getElementById('salesTaxState');

function populateStateSelect() {
  if (!salesTaxState) return;
  const names = getStateNames();
  const prev = salesTaxState.value || 'CA';
  const locale = stateNameLocale();
  const codes = Object.keys(names).sort((a, b) => names[a].localeCompare(names[b], locale));
  salesTaxState.innerHTML = codes.map(code => {
    const rate = SALES_TAX_RATES[code] ?? 0;
    return `<option value="${code}">${names[code]} (~${rate.toFixed(2)}%)</option>`;
  }).join('');
  // Keep the user's state (and tax rate) when language changes; default CA on first fill.
  salesTaxState.value = names[prev] ? prev : 'CA';
  if (!salesTaxState.value) salesTaxState.value = 'CA';
}

function applyStateTaxRate() {
  if (!salesTaxState || !taxRate) return;
  const rate = SALES_TAX_RATES[salesTaxState.value];
  if (rate == null) return;
  taxRate.value = String(rate);
}

function updateTipEstimator() {
  if (!billAmount || !tipResult) return;
  const bill = Math.max(0, Number(billAmount.value) || 0);
  const taxPct = Math.max(0, Number(taxRate?.value) || 0);
  const tipPct = Math.max(0, Number(tipRate?.value) || 0);
  const tax = bill * taxPct / 100;
  const tip = bill * tipPct / 100;
  const total = bill + tax + tip;
  const t = toolsText();
  tipResult.textContent = moneyFmt(total, 'USD');
  if (tipMeta) {
    const names = getStateNames();
    const code = salesTaxState ? salesTaxState.value : '';
    const state = code ? (names[code] || code) : '';
    const tableRate = code ? SALES_TAX_RATES[code] : null;
    // Zero-tax message only for states with no statewide rate — not when the user manually zeros the field.
    const taxNote = (tableRate === 0 && taxPct === 0)
      ? (t.salesTaxZero || 'No statewide sales tax (local may apply).')
      : `${t.tax || 'Tax'} ${moneyFmt(tax, 'USD')} (${taxPct.toFixed(2)}%)`;
    tipMeta.textContent = [state, taxNote, `${t.tip || 'Tip'} ${moneyFmt(tip, 'USD')}`].filter(Boolean).join(' · ');
  }
}

// Combined tip + sales tax (one card)
populateStateSelect();
applyStateTaxRate();
if (salesTaxState) {
  salesTaxState.addEventListener('change', () => {
    applyStateTaxRate();
    updateTipEstimator();
  });
}
[billAmount, taxRate, tipRate].forEach(el => { if (el) el.addEventListener('input', updateTipEstimator); });
updateTipEstimator();
/* Road-trip cost: Gas (MPG / L/100km) or EV (mi/kWh / kWh/100km). */
const driveToolCard = document.getElementById('driveToolCard');
const driveDist = document.getElementById('driveDist');
const driveSpeed = document.getElementById('driveSpeed');
const driveMpg = document.getElementById('driveMpg');
const driveFuel = document.getElementById('driveFuel');
const driveEvEcon = document.getElementById('driveEvEcon');
const driveEvPrice = document.getElementById('driveEvPrice');
const driveResult = document.getElementById('driveResult');
const driveMeta = document.getElementById('driveMeta');
let driveMode = 'gas'; // 'gas' | 'ev'
// HTML field defaults are imperial (mi / MPG / mi/kWh / $/gal). Track last unit so toggles convert.
let driveFieldsUnit = 'mi';

function convertDriveInputsForUnitChange(fromUnit, toUnit) {
  if (!driveDist || fromUnit === toUnit) return;
  const toKm = toUnit === 'km';
  const fromKm = fromUnit === 'km';
  if (toKm === fromKm) return;
  const miToKm = 1.60934;
  const galToL = 3.78541;
  const round = (n, d) => {
    const f = Math.pow(10, d);
    return (Math.round(n * f) / f).toFixed(d);
  };
  const num = (el) => Math.max(0, Number(el && el.value) || 0);

  if (driveDist) {
    const v = num(driveDist);
    driveDist.value = toKm ? round(v * miToKm, 0) : round(v / miToKm, 0);
  }
  if (driveSpeed) {
    const v = Math.max(1, num(driveSpeed));
    driveSpeed.value = toKm ? round(v * miToKm, 0) : round(v / miToKm, 0);
  }
  // MPG ↔ L/100km  (L/100km = 235.215 / MPG)
  if (driveMpg) {
    const v = Math.max(0.1, num(driveMpg) || 0.1);
    driveMpg.value = round(235.215 / v, 1);
  }
  // mi/kWh ↔ kWh/100km  (kWh/100km = 100 / (mi/kWh × 1.60934))
  if (driveEvEcon) {
    const v = Math.max(0.1, num(driveEvEcon) || 0.1);
    driveEvEcon.value = round(100 / (v * miToKm), 1);
  }
  // $/gal ↔ $/L
  if (driveFuel) {
    const v = num(driveFuel);
    driveFuel.value = toKm ? round(v / galToL, 2) : round(v * galToL, 2);
  }
  driveFieldsUnit = toUnit;
  updateDriveUnitLabels();
}

/** Show only the active unit system on drive field labels (not dual “MPG / L/100km”). */
function updateDriveUnitLabels() {
  const t = toolsText();
  const imperial = currentDistUnit !== 'km';
  const mpgEl = document.getElementById('driveEconLabel');
  const fuelEl = document.getElementById('drivePriceLabel');
  const evEl = document.getElementById('driveEvEconLabel');
  if (mpgEl) mpgEl.textContent = imperial ? (t.driveMpgMi || 'MPG') : (t.driveMpgKm || 'L/100 km');
  if (fuelEl) fuelEl.textContent = imperial ? (t.driveFuelGal || 'Fuel $/gal') : (t.driveFuelL || 'Fuel $/L');
  if (evEl) evEl.textContent = imperial ? (t.driveEvMi || 'mi/kWh') : (t.driveEvKm || 'kWh/100 km');
}

function setDriveMode(mode) {
  driveMode = mode === 'ev' ? 'ev' : 'gas';
  if (driveToolCard) driveToolCard.setAttribute('data-drive-mode', driveMode);
  document.querySelectorAll('#driveToolCard .tool-seg-btn, .tool-seg [data-drive-type]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-drive-type') === driveMode);
  });
  updateDriveCost();
}

function updateDriveCost() {
  if (!driveDist || !driveResult) return;
  const dist = Math.max(0, Number(driveDist.value) || 0);
  const speed = Math.max(1, Number(driveSpeed.value) || 1);
  const imperial = currentDistUnit !== 'km';
  const hours = dist / speed;
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  // Rounding can land on 60m (e.g. 0.999h → 0h 60m); roll into the next hour.
  if (m >= 60) { h += 1; m = 0; }
  const t = toolsText();
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const distUnit = imperial ? 'mi' : 'km';
  let cost = 0;
  let energyLine = '';

  if (driveMode === 'ev') {
    const econ = Math.max(0.1, Number(driveEvEcon?.value) || 0.1);
    const price = Math.max(0, Number(driveEvPrice?.value) || 0);
    let kwh;
    if (imperial) {
      // econ = mi/kWh
      kwh = dist / econ;
    } else {
      // econ = kWh/100km
      kwh = (econ / 100) * dist;
    }
    cost = kwh * price;
    energyLine = `${kwh.toFixed(1)} kWh · $${price.toFixed(2)}/kWh`;
  } else {
    const economy = Math.max(0.1, Number(driveMpg?.value) || 0.1);
    const price = Math.max(0, Number(driveFuel?.value) || 0);
    let fuelAmt;
    if (imperial) {
      fuelAmt = dist / economy; // gallons
    } else {
      fuelAmt = (economy / 100) * dist; // liters
    }
    cost = fuelAmt * price;
    const fuelUnit = imperial ? (t.driveGal || 'gal') : (t.driveL || 'L');
    energyLine = `${fuelAmt.toFixed(1)} ${fuelUnit}`;
  }

  driveResult.textContent = `${timeStr} · ${moneyFmt(cost, 'USD')}`;
  driveMeta.textContent = `${dist.toLocaleString()} ${distUnit} · ${energyLine} · ~${speed} ${distUnit}/h`;
}

document.querySelectorAll('[data-drive-type]').forEach(btn => {
  btn.addEventListener('click', () => setDriveMode(btn.getAttribute('data-drive-type')));
});
[driveDist, driveSpeed, driveMpg, driveFuel, driveEvEcon, driveEvPrice].forEach(el => {
  if (el) el.addEventListener('input', updateDriveCost);
});
if (driveToolCard) setDriveMode('gas');
// If the user prefers metric (or OS default is km), convert imperial HTML defaults once.
if (driveDist && currentDistUnit === 'km' && driveFieldsUnit === 'mi') {
  convertDriveInputsForUnitChange('mi', 'km');
}
updateDriveUnitLabels();

// Tools mini-app: start live widgets immediately (page is always "open").
if (document.body.classList.contains('page-tools') || currencyAmount || worldClockList) {
  refreshToolsLive();
  if (worldClockList) {
    if (worldClockInterval) clearInterval(worldClockInterval);
    worldClockInterval = setInterval(updateWorldClock, 30000);
  }
  // Reveal tool cards without waiting for scroll (above-the-fold mini-app).
  document.querySelectorAll('#tools .reveal, .tools-page .reveal').forEach(el => {
    el.classList.add('visible');
  });
}

/* ── MODAL SYSTEM ── */
const overlay   = document.getElementById('modal-overlay');
const modalTag  = document.getElementById('modal-tag');
const modalTitle= document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');


let currentModalKey = null;

function openModal(tag, title, body) {
  if (!overlay) return;
  const alreadyOpen = overlay.classList.contains('open');
  if (modalTag) modalTag.textContent = tag;
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = body;
  if (!alreadyOpen) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
  }
  applyUnits();
}
function closeModal() {
  if (!overlay || !overlay.classList.contains('open')) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  unlockBodyScroll();
  currentModalKey = null;
}

const modalCloseBtn = document.getElementById('modal-close');
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (overlay) {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // Higher layers own Escape first (settings / lightbox have their own handlers).
  if (settingsOverlay && settingsOverlay.classList.contains('open')) return;
  if (document.getElementById('lightbox')?.classList.contains('open')) return;
  if (overlay && overlay.classList.contains('open')) {
    closeModal();
    return;
  }
  // No overlay open — dismiss the mobile nav drawer if it is.
  closeMobileNav();
});

// Keyboard accessibility for interactive elements
document.querySelectorAll('.prac-card, .season-card, .culture-tile, .dest-card, .region-card, .route-card, .tip-row, .fact-card, .gallery-item').forEach(card => {
  card.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});


function buildDestLinksHtml(destId) {
  const links = DEST_TRAVEL_LINKS[destId];
  if (!links || !links.length) return '';
  const heading = DEST_LINKS_HEADING[currentLang] || DEST_LINKS_HEADING.en;
  const items = links.map((l) => {
    const label = (l.label && (l.label[currentLang] || l.label.en)) || l.url;
    return `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
  }).join('');
  return `<div class="modal-links"><div class="modal-links-label">${heading}</div><ul class="modal-links-list">${items}</ul></div>`;
}

function getModalData(key) {
  const localized = MODAL_DATA_I18N[currentLang] && MODAL_DATA_I18N[currentLang][key];
  const base = localized || MODAL_DATA[key];
  if (!base) return null;
  // Attach city travel links when expanding a destination card
  if (key && key.indexOf('dest_') === 0) {
    const destId = key.slice(5);
    const linksHtml = buildDestLinksHtml(destId);
    if (linksHtml) {
      return { tag: base.tag, title: base.title, body: (base.body || '') + linksHtml };
    }
  }
  return base;
}

document.querySelectorAll('[data-modal]').forEach(el => {
  el.addEventListener('click', () => {
    const type = el.dataset.modal;
    let key = '';
    if (type === 'region')  key = `region_${el.dataset.region}`;
    if (type === 'dest')    key = `dest_${el.dataset.dest}`;
    if (type === 'season')  key = `season_${el.dataset.season}`;
    if (type === 'route')   key = `route_${el.dataset.route}`;
    if (type === 'prac')    key = `prac_${el.dataset.prac}`;
    if (type === 'culture') key = `culture_${el.dataset.culture}`;
    if (type === 'tip')     key = `tip_${el.dataset.tip}`;
    if (type === 'fact')    key = `fact_${el.dataset.fact}`;

    const d = getModalData(key);
    if (d) { currentModalKey = key; openModal(d.tag, d.title, d.body); }
  });
});

/* ── LEGAL PAGES (privacy / terms) multi-language body ── */
function getLegalPageKind() {
  if (!document.body.classList.contains('page-legal')) return null;
  const attr = document.body.getAttribute('data-legal-page');
  if (attr === 'privacy' || attr === 'terms') return attr;
  if (/terms\.html/i.test(location.pathname) || /terms\.html/i.test(location.href)) return 'terms';
  return 'privacy';
}

function renderLegalPage(lang) {
  const kind = getLegalPageKind();
  const root = document.getElementById('legalDoc');
  if (!kind || !root) return;
  const pack = (typeof window.LEGAL_I18N !== 'undefined' && window.LEGAL_I18N[kind]) || null;
  if (!pack) return;
  const data = pack[lang] || pack.en;
  if (!data) return;
  // Stamp © years at render time so legal copy never needs a manual year edit.
  const y = (s) => withCopyrightYear(s);

  const topTitle = document.getElementById('legalTopTitle');
  if (topTitle) topTitle.textContent = data.title;

  const tocHtml = (data.toc || []).map((t) =>
    `<li><a href="#${t.id}">${t.label}</a></li>`
  ).join('');

  const sectionsHtml = (data.sections || []).map((s) =>
    `<section id="${s.id}" class="legal-section"><h2>${s.title}</h2>${y(s.html)}</section>`
  ).join('');
  const otherPage = kind === 'privacy' ? 'terms.html' : 'privacy.html';
  const otherKey = kind === 'privacy' ? 'legal.termsLink' : 'legal.privacyLink';
  const otherLabel = (I18N[lang] && I18N[lang][otherKey])
    || (lang === 'en' ? (kind === 'privacy' ? 'Terms of Use' : 'Privacy Policy')
      : (window.LEGAL_I18N[kind === 'privacy' ? 'terms' : 'privacy'][lang] || {}).title)
    || (kind === 'privacy' ? 'Terms of Use' : 'Privacy Policy');
  const backLabel = (I18N[lang] && I18N[lang]['gallery.backToGuide'])
    || (lang === 'es' ? 'Volver a la guía' : lang === 'zh' ? '返回指南' : lang === 'ja' ? 'ガイドに戻る' : 'Back to the Guide');

  root.innerHTML = `
    <header class="legal-doc-header">
      <p class="legal-eyebrow">${data.eyebrow || 'Legal'}</p>
      <h1>${data.title}</h1>
      <p class="legal-updated">${data.updatedLabel || 'Updated'} ${data.updatedDate || ''}</p>
      <p class="legal-lead">${data.lead || ''}</p>
    </header>
    <nav class="legal-toc" aria-label="${data.onThisPage || 'On this page'}">
      <h2 class="legal-toc-title">${data.onThisPage || 'On this page'}</h2>
      <ol>${tocHtml}</ol>
    </nav>
    ${sectionsHtml}
    <footer class="legal-doc-footer">
      <p>
        <a href="${otherPage}">${otherLabel}</a>
        <span aria-hidden="true"> · </span>
        <a href="index.html">${backLabel}</a>
      </p>
      <p class="legal-copy">${y(data.footerNote || '')}</p>
    </footer>
  `;
}

function updateLegalLangSwitch(lang) {
  document.querySelectorAll('#legalLangSwitch .legal-lang-btn, #legalLangSwitch [data-lang-val]').forEach((btn) => {
    const on = btn.getAttribute('data-lang-val') === lang;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

// Top-bar language switcher on legal pages (also writes to the same preference as Settings)
const legalLangSwitch = document.getElementById('legalLangSwitch');
if (legalLangSwitch) {
  legalLangSwitch.querySelectorAll('[data-lang-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-lang-val');
      if (!SUPPORTED_LANGS.includes(next)) return;
      currentLang = next;
      safeStorage.set('usa-travel-lang', currentLang);
      if (typeof updateLangUI === 'function') updateLangUI(currentLang);
      applyLanguage(currentLang);
    });
  });
}



let funFactIndex = 0;
let funFactAnimating = false;

function getFunFactsList() {
  const list = FUN_FACTS[currentLang] || FUN_FACTS.en;
  return (list && list.length) ? list : FUN_FACTS.en;
}

/** Pick a random fact index, never the same as the current one when possible. */
function pickShuffledFunFactIndex() {
  const n = getFunFactsList().length;
  if (n <= 1) return 0;
  let next = Math.floor(Math.random() * n);
  if (next === funFactIndex) next = (next + 1) % n;
  return next;
}

function refreshFunFact(animate) {
  const textEl = document.getElementById('funFactText');
  if (!textEl) return;
  const facts = getFunFactsList();
  if (funFactIndex < 0 || funFactIndex >= facts.length) funFactIndex = 0;
  const apply = () => {
    textEl.textContent = facts[funFactIndex];
    textEl.classList.remove('is-swapping');
    textEl.classList.add('is-visible');
    // Reset scroll so long→short transitions always start at the top of the fixed box
    const wrap = textEl.closest('.fun-fact-text-wrap');
    if (wrap) wrap.scrollTop = 0;
    funFactAnimating = false;
  };
  // Full + reduced: short fade; off: instant swap
  if (animate && !motionIsOff()) {
    funFactAnimating = true;
    textEl.classList.remove('is-visible');
    textEl.classList.add('is-swapping');
    setTimeout(apply, motionIsReduced() ? 140 : 200);
  } else {
    apply();
  }
}

function shuffleFunFact(animate) {
  funFactIndex = pickShuffledFunFactIndex();
  refreshFunFact(!!animate);
}

function initFunFacts() {
  const textEl = document.getElementById('funFactText');
  if (!textEl) return;
  const nextBtn = document.getElementById('funFactNext');
  // Always start shuffled
  funFactIndex = Math.floor(Math.random() * getFunFactsList().length);
  refreshFunFact(false);
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (funFactAnimating) return;
      shuffleFunFact(true);
    });
  }
}

/* ── APPLY SAVED PREFERENCES ON LOAD (must run after everything above is defined) ── */
initFunFacts();
applyLanguage(currentLang);
applyUnits();
// Legal body depends on LEGAL_I18N (loaded before app.js) — ensure first paint
if (document.body.classList.contains('page-legal')) {
  renderLegalPage(currentLang);
  updateLegalLangSwitch(currentLang);
}

// ═══════════════════════════════════════════════════════════════════════
// GALLERY — filtering, scroll-in animation, image loading state, lightbox
// ═══════════════════════════════════════════════════════════════════════

// Declared early (false) so mid-script applyLanguage can safely gate gallery chrome.
// Flipped true after gallery event handlers and lightbox bindings are ready.
var galleryUiReady = false;

const galleryGrid = document.getElementById('galleryGrid');
const filterBtns = document.querySelectorAll('.gallery-filter');
const galleryEmptyState = document.getElementById('galleryEmptyState');
const gallerySearchInput = document.getElementById('gallerySearch');
const gallerySortSelect = document.getElementById('gallerySort');
let visibleItems = [...document.querySelectorAll('.gallery-item:not(.load-error)')];
let currentIndex = 0;
let lastFocusedThumb = null; // so closing the lightbox returns focus sensibly
let filterFadeTimers = new WeakMap();
let galleryActiveCategory = 'all';
let gallerySearchQuery = '';
let gallerySortMode = (gallerySortSelect && gallerySortSelect.value) || 'date-desc';

// Mirrors the EMPTY_STATE_SAVED_TEXT pattern used by the destinations filter:
// the "photo not added yet" placeholder is generated dynamically in JS, so it
// can't pick up a data-i18n attribute — it's translated by hand instead.
const GALLERY_PLACEHOLDER_TEXT = {
  en: 'Photo not added yet',
  es: 'Foto aún no añadida',
  zh: '照片尚未上传',
  ja: '写真はまだ追加されていません'
};

// --- Reveal captions when tiles approach the viewport (safe without IO).

// --- Image loading state: tile keeps a skeleton min-height until the thumb
// loads, then sizes to the image's natural aspect ratio (masonry columns pack
// without holes). Grid always uses thumbs — never full-res — for paint stability.
function watchImageLoad(img) {
  if (!img) return;
  const item = img.closest('.gallery-item');
  const onOk = () => {
    img.classList.add('loaded');
    if (item) {
      item.classList.add('img-ready');
      // If already on-screen when the thumb finishes, show caption immediately.
      if (item.getBoundingClientRect().top < window.innerHeight + 80) {
        item.classList.add('is-revealed', 'in-view');
      }
    }
  };
  if (img.complete && img.naturalWidth > 0) {
    onOk();
  } else if (img.complete) {
    // .complete is true even for failed loads once the browser gives up, so
    // naturalWidth === 0 here means "tried and failed", not "still loading".
    showLoadError(item);
  } else {
    img.addEventListener('load', onOk, { once: true });
    img.addEventListener('error', () => showLoadError(item), { once: true });
  }
}
function showLoadError(item) {
  if (!item) return;
  item.classList.add('load-error', 'img-ready');
  item.setAttribute('tabindex', '-1');
  item.setAttribute('aria-disabled', 'true');
  item.removeAttribute('role');
  // Keep a stable tile size for error states so the column doesn't collapse.
  item.style.minHeight = '180px';
  if (!item.querySelector('.gallery-item-placeholder')) {
    const ph = document.createElement('div');
    ph.className = 'gallery-item-placeholder';
    const text = GALLERY_PLACEHOLDER_TEXT[currentLang] || GALLERY_PLACEHOLDER_TEXT.en;
    ph.innerHTML = `<span class="ph-icon" aria-hidden="true">🖼️</span><span class="ph-text">${text}</span>`;
    item.appendChild(ph);
  }
  refreshVisibleGalleryItems();
  updateFilterCounts();
}

function ensureZoomHint(item) {
  if (item.querySelector('.gallery-zoom-hint') || item.classList.contains('load-error')) return;
  const hint = document.createElement('span');
  hint.className = 'gallery-zoom-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>';
  item.appendChild(hint);
}

function initGalleryItem(item, index) {
  if (!ENV.constrained) {
    item.style.transitionDelay = `${(index % 6) * 60}ms`;
  }
  if (!item.hasAttribute('aria-label')) {
    const cap = item.querySelector('.gallery-caption');
    if (cap) item.setAttribute('aria-label', cap.textContent.trim());
  }
  ensureZoomHint(item);
  const img = item.querySelector('img');
  if (img) {
    img.setAttribute('decoding', 'async');
    // Eager-load the first few above-the-fold tiles on the dedicated gallery page.
    // On constrained viewports only warm the first tile (memory budget).
    const eagerCount = ENV.constrained ? 1 : 4;
    if (document.body.classList.contains('page-gallery') && index < eagerCount) {
      img.loading = 'eager';
      try { img.fetchPriority = 'high'; } catch (e) { /* ignore */ }
    }
  }
  watchImageLoad(img);
}
const galleryItems = document.querySelectorAll('.gallery-item');
galleryItems.forEach(initGalleryItem);
observeWhenVisible(galleryItems, (node) => {
  node.classList.add('is-revealed', 'in-view');
}, { threshold: 0.08, rootMargin: '40px 0px 40px 0px' });

function refreshVisibleGalleryItems() {
  visibleItems = [...document.querySelectorAll('.gallery-item:not(.hidden):not(.load-error)')];
}

/** Parse "July 2026" / "June 2026" into a sortable number (year*12+month). */
function galleryDateSortKey(dateStr) {
  const s = String(dateStr || '').trim();
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const m = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const mon = months[m[1].toLowerCase()] || 0;
    return parseInt(m[2], 10) * 12 + mon;
  }
  const iso = s.match(/^(\d{4})[-/](\d{1,2})/);
  if (iso) return parseInt(iso[1], 10) * 12 + parseInt(iso[2], 10);
  return 0;
}

function galleryItemSearchHaystack(item) {
  const cap = item.querySelector('.gallery-caption');
  return [
    cap ? cap.textContent : '',
    item.dataset.location || '',
    item.dataset.city || '',
    item.dataset.state || '',
    item.dataset.date || '',
    item.dataset.category || '',
    (item.querySelector('img') || {}).alt || ''
  ].join(' ').toLowerCase();
}

function galleryItemMatchesFilters(item) {
  if (item.classList.contains('load-error')) return false;
  const catOk = galleryActiveCategory === 'all' || item.dataset.category === galleryActiveCategory;
  if (!catOk) return false;
  if (!gallerySearchQuery) return true;
  return galleryItemSearchHaystack(item).includes(gallerySearchQuery);
}

/** Normalize "California" / "CA" / "Calif." style state tokens for sort/search. */
const US_STATE_SORT_MAP = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
  michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY', 'district of columbia': 'DC', 'washington dc': 'DC', 'washington d c': 'DC'
};

function normalizeGalleryState(raw) {
  const s = (raw || '').trim();
  if (!s) return '';
  if (s.length === 2) return s.toUpperCase();
  const key = s.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  return US_STATE_SORT_MAP[key] || s;
}

function sortGalleryItems() {
  if (!galleryGrid) return;
  const items = [...galleryGrid.querySelectorAll('.gallery-item')];
  if (items.length < 2) return;
  const mode = gallerySortMode || 'date-desc';
  items.sort((a, b) => {
    if (mode === 'date-desc' || mode === 'date-asc') {
      const da = galleryDateSortKey(a.dataset.date);
      const db = galleryDateSortKey(b.dataset.date);
      if (da !== db) return mode === 'date-desc' ? db - da : da - db;
      // Stable tie-break: location then caption
      const la = (a.dataset.location || '').localeCompare(b.dataset.location || '', undefined, { sensitivity: 'base' });
      if (la !== 0) return la;
      const ca = (a.querySelector('.gallery-caption') || {}).textContent || '';
      const cb = (b.querySelector('.gallery-caption') || {}).textContent || '';
      return ca.localeCompare(cb, undefined, { sensitivity: 'base' });
    }
    if (mode === 'location') {
      const ca = (a.dataset.city || a.dataset.location || '').localeCompare(
        b.dataset.city || b.dataset.location || '', undefined, { sensitivity: 'base' }
      );
      if (ca !== 0) return ca;
      return galleryDateSortKey(b.dataset.date) - galleryDateSortKey(a.dataset.date);
    }
    if (mode === 'state') {
      const sa = normalizeGalleryState(a.dataset.state).localeCompare(
        normalizeGalleryState(b.dataset.state), undefined, { sensitivity: 'base' }
      );
      if (sa !== 0) return sa;
      const ca = (a.dataset.city || a.dataset.location || '').localeCompare(
        b.dataset.city || b.dataset.location || '', undefined, { sensitivity: 'base' }
      );
      if (ca !== 0) return ca;
      return galleryDateSortKey(b.dataset.date) - galleryDateSortKey(a.dataset.date);
    }
    if (mode === 'category') {
      const cat = (a.dataset.category || '').localeCompare(b.dataset.category || '', undefined, { sensitivity: 'base' });
      if (cat !== 0) return cat;
      return galleryDateSortKey(b.dataset.date) - galleryDateSortKey(a.dataset.date);
    }
    return 0;
  });
  items.forEach(item => galleryGrid.appendChild(item));
}

function updateFilterCounts() {
  if (!filterBtns.length) return;
  const items = [...document.querySelectorAll('.gallery-item:not(.load-error)')];
  // Counts respect search but not category (so each category shows its size under current search).
  filterBtns.forEach(btn => {
    const filter = btn.dataset.filter;
    const count = items.filter(i => {
      if (filter !== 'all' && i.dataset.category !== filter) return false;
      if (!gallerySearchQuery) return true;
      return galleryItemSearchHaystack(i).includes(gallerySearchQuery);
    }).length;
    let badge = btn.querySelector('.gallery-filter-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'gallery-filter-count';
      badge.setAttribute('aria-hidden', 'true');
      btn.appendChild(badge);
    }
    badge.textContent = String(count);
    // Hide empty categories except "All" so the filter bar stays honest.
    if (filter !== 'all' && count === 0) {
      btn.hidden = true;
      btn.setAttribute('aria-hidden', 'true');
    } else {
      btn.hidden = false;
      btn.removeAttribute('aria-hidden');
    }
  });
}

// --- Filtering + search: items leaving shrink/fade out, THEN get display:none once
// that transition finishes; items entering drop .hidden and re-run rise-in.
const FADE_MS = 300;
function applyGalleryVisibility({ animate = true } = {}) {
  let matchCount = 0;
  document.querySelectorAll('.gallery-item').forEach((item, index) => {
    const match = galleryItemMatchesFilters(item);
    const pending = filterFadeTimers.get(item);
    if (pending) { clearTimeout(pending); filterFadeTimers.delete(item); }

    if (match) {
      matchCount++;
      item.classList.remove('fade-out', 'hidden');
      if (animate) item.style.transitionDelay = `${(index % 6) * 40}ms`;
      item.classList.add('is-revealed', 'in-view');
    } else if (!item.classList.contains('hidden')) {
      if (!animate) {
        item.classList.add('hidden');
        item.classList.remove('fade-out');
      } else {
        item.classList.add('fade-out');
        const t = setTimeout(() => {
          item.classList.add('hidden');
          filterFadeTimers.delete(item);
        }, FADE_MS);
        filterFadeTimers.set(item, t);
      }
    } else {
      item.classList.add('hidden');
    }
  });

  if (galleryEmptyState) galleryEmptyState.classList.toggle('show', matchCount === 0);
  const delay = animate ? FADE_MS + 20 : 0;
  setTimeout(() => { refreshVisibleGalleryItems(); }, delay);
}

filterBtns.forEach(btn => {
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    galleryActiveCategory = btn.dataset.filter || 'all';
    applyGalleryVisibility({ animate: true });
  });
});

if (gallerySearchInput) {
  let searchTimer = 0;
  gallerySearchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      gallerySearchQuery = (gallerySearchInput.value || '').trim().toLowerCase();
      updateFilterCounts();
      applyGalleryVisibility({ animate: true });
    }, 120);
  });
}

if (gallerySortSelect) {
  gallerySortSelect.addEventListener('change', () => {
    gallerySortMode = gallerySortSelect.value || 'date-desc';
    sortGalleryItems();
    applyGalleryVisibility({ animate: false });
  });
}

// Default order: newest first (by data-date)
if (galleryGrid) {
  sortGalleryItems();
}
updateFilterCounts();
applyGalleryVisibility({ animate: false });

// --- Lightbox ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxMeta = document.getElementById('lightboxMeta');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxCloseBtn = document.getElementById('lightboxClose');
const lightboxNextBtn = document.getElementById('lightboxNext');
const lightboxPrevBtn = document.getElementById('lightboxPrev');
const lightboxHdBtn = document.getElementById('lightboxHdBtn');

function galleryFullSrc(img) {
  if (!img) return '';
  return img.getAttribute('data-full') || img.currentSrc || img.src || '';
}
function galleryThumbSrc(img) {
  if (!img) return '';
  return img.getAttribute('data-thumb') || img.currentSrc || img.src || '';
}
function galleryMediumSrc(img) {
  if (!img) return '';
  return img.getAttribute('data-medium') || '';
}

/**
 * Preferred lightbox asset for the current quality setting.
 * Falls back: full → medium → thumb when a tier is missing.
 */
function galleryPreferredSrc(img, quality) {
  const q = quality || galleryQuality || 'medium';
  const full = galleryFullSrc(img);
  const medium = galleryMediumSrc(img);
  const thumb = galleryThumbSrc(img);
  if (q === 'full') return full || medium || thumb;
  if (q === 'thumb') return thumb || medium || full;
  // medium (default)
  return medium || full || thumb;
}

function lightboxHdLabel(key) {
  const dict = (typeof I18N !== 'undefined' && I18N[currentLang]) || null;
  const fallback = {
    loadFull: 'Load full quality',
    loadingFull: 'Loading original…',
    showingFull: 'Full quality'
  };
  if (dict && dict['gallery.' + key]) return dict['gallery.' + key];
  // English originals from button if present, else fallback
  if (key === 'loadFull' && lightboxHdBtn && !lightboxHdBtn.classList.contains('is-loading')) {
    const orig = lightboxHdBtn.getAttribute('data-i18n') === 'gallery.loadFull'
      ? (i18nOriginals.get(lightboxHdBtn) || fallback.loadFull)
      : fallback.loadFull;
    if (currentLang === 'en') return orig;
  }
  return fallback[key] || fallback.loadFull;
}

function updateLightboxHdButton(img, loadedTier) {
  if (!lightboxHdBtn) return;
  const full = galleryFullSrc(img);
  const tier = loadedTier || (lightboxImg && lightboxImg.getAttribute('data-loaded-tier')) || '';
  // Show upgrade button only when a higher-res full asset exist
  const canUpgrade = !!(full && tier !== 'full' && galleryQuality !== 'full');
  if (!canUpgrade) {
    lightboxHdBtn.hidden = true;
    lightboxHdBtn.classList.remove('is-loading');
    return;
  }
  lightboxHdBtn.hidden = false;
  lightboxHdBtn.disabled = false;
  lightboxHdBtn.classList.remove('is-loading');
  lightboxHdBtn.textContent = lightboxHdLabel('loadFull');
}

/*
  Lightbox loading model (one photo at a time):
  - Grid always uses thumbs (fast masonry).
  - Viewer loads preferred quality: medium by default (settings: thumb/medium/full).
  - "Load full quality" button upgrades to the original camera file when not already full.
  - On open/arrow: show thumb immediately, then upgrade to preferred size.
  - Only one download is in flight; navigating aborts the previous XHR.
*/
let lightboxLoadToken = 0;
let lightboxXhr = null;
let lightboxDecodeImg = null;
// Session cache: full path → object URL (instant re-open / back-nav). Cap size to limit memory.
const lightboxFullCache = new Map();
const LIGHTBOX_CACHE_MAX = 10;
function lightboxCacheSet(key, objectUrl) {
  if (lightboxFullCache.has(key)) {
    const old = lightboxFullCache.get(key);
    if (old && old !== objectUrl && typeof old === 'string' && old.startsWith('blob:')) {
      try { URL.revokeObjectURL(old); } catch (_) { /* ignore */ }
    }
    lightboxFullCache.delete(key);
  }
  while (lightboxFullCache.size >= LIGHTBOX_CACHE_MAX) {
    const oldest = lightboxFullCache.keys().next().value;
    const url = lightboxFullCache.get(oldest);
    lightboxFullCache.delete(oldest);
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch (_) { /* ignore */ }
    }
  }
  lightboxFullCache.set(key, objectUrl);
}

const lightboxProgress = document.getElementById('lightboxProgress');
const lightboxProgressFill = document.getElementById('lightboxProgressFill');
const lightboxProgressPct = document.getElementById('lightboxProgressPct');
const lightboxProgressMsg = document.getElementById('lightboxProgressMsg');

const LIGHTBOX_PROGRESS_TEXT = {
  en: {
    loading: 'Downloading…',
    preparing: 'Rendering full photo…',
    almost: 'Ready',
    failed: 'Couldn’t load full photo'
  },
  es: {
    loading: 'Descargando…',
    preparing: 'Procesando la foto…',
    almost: 'Listo',
    failed: 'No se pudo cargar la foto'
  },
  zh: {
    loading: '下载中…',
    preparing: '正在渲染高清照片…',
    almost: '完成',
    failed: '高清照片加载失败'
  },
  ja: {
    loading: 'ダウンロード中…',
    preparing: 'フルサイズを描画中…',
    almost: '完了',
    failed: '読み込みに失敗しました'
  }
};
function lightboxProgressText() {
  return LIGHTBOX_PROGRESS_TEXT[currentLang] || LIGHTBOX_PROGRESS_TEXT.en;
}

/*
  Progress model (tuned for real full-res JPEGs):
  ───────────────────────────────────────────────
  Download is usually FAST. Decode/render of multi‑MB photos is SLOW and has
  no browser progress events. The bar is weighted so wait time feels honest:
    · Network owns only ~0–18% of the bar (download finishes early)
    · Decode/render owns ~18–96% with a two-phase time curve:
        Phase A — ease from start → 94% over an estimated decode duration
        Phase B — if still waiting, slow crawl 94 → 98% (never freezes)
    · Fill width uses sub-pixel precision so the bar keeps moving even when
      the integer % label holds the same number for a moment
    · On complete, sprint to 100% and dismiss
*/
const LB_NET_FLOOR = 3;
const LB_NET_CEIL = 18;       // network phase ends here
const LB_DECODE_MID = 94;     // end of primary decode climb
const LB_DECODE_CAP = 98;     // hard ceiling until truly done

let lbProgDisplay = 0;
let lbProgTarget = 0;
let lbProgRaf = 0;
let lbProgMsgKey = 'loading';
let lbProgVisible = false;
let lbProgDecodeTimer = 0;
let lbProgDecodeStart = 0;
let lbProgDecodeStartPct = LB_NET_CEIL;
let lbProgDecodeExpected = 3; // seconds for primary climb
let lbProgCompleting = false;

function lbProgNow() {
  return (typeof performance !== 'undefined' && performance.now)
    ? performance.now()
    : Date.now();
}

function lbProgPaint() {
  if (!lightboxProgress || !lbProgVisible) return;
  // Continuous fill (feels alive); integer label for readability
  const fillPct = Math.max(0, Math.min(100, lbProgDisplay));
  const labelPct = Math.max(0, Math.min(100, Math.round(lbProgDisplay)));
  lightboxProgress.hidden = false;
  lightboxProgress.classList.remove('is-indeterminate');
  lightboxProgress.classList.toggle('is-decoding', lbProgMsgKey === 'preparing' || lbProgMsgKey === 'almost');
  lightboxProgress.setAttribute('aria-busy', labelPct < 100 ? 'true' : 'false');
  if (lightboxProgressFill) lightboxProgressFill.style.width = fillPct.toFixed(2) + '%';
  if (lightboxProgressPct) lightboxProgressPct.textContent = labelPct + '%';
  const t = lightboxProgressText();
  if (lightboxProgressMsg) {
    lightboxProgressMsg.textContent =
      lbProgMsgKey === 'preparing' ? t.preparing
      : lbProgMsgKey === 'almost' ? t.almost
      : lbProgMsgKey === 'failed' ? t.failed
      : t.loading;
  }
}

function lbProgTick() {
  lbProgRaf = 0;
  if (!lbProgVisible) return;
  const diff = lbProgTarget - lbProgDisplay;
  if (Math.abs(diff) < 0.05) {
    lbProgDisplay = lbProgTarget;
  } else {
    // Smooth catch-up: fast enough to feel alive, never jump
    const step = diff > 0
      ? Math.max(0.18, Math.min(2.8, diff * 0.22))
      : diff * 0.28;
    lbProgDisplay += step;
    if (diff > 0 && lbProgDisplay > lbProgTarget) lbProgDisplay = lbProgTarget;
  }
  lbProgPaint();
  if (Math.abs(lbProgTarget - lbProgDisplay) >= 0.05 || lbProgDecodeTimer || lbProgCompleting) {
    lbProgRaf = raf(lbProgTick);
  }
}

function lbProgEnsureTicking() {
  if (!lbProgRaf) lbProgRaf = raf(lbProgTick);
}

function lbProgStart() {
  lbProgVisible = true;
  lbProgCompleting = false;
  lbProgDisplay = 0;
  lbProgTarget = LB_NET_FLOOR;
  lbProgMsgKey = 'loading';
  lbProgDecodeStartPct = LB_NET_CEIL;
  if (lbProgDecodeTimer) { clearInterval(lbProgDecodeTimer); lbProgDecodeTimer = 0; }
  if (lbProgRaf) { cancelRaf(lbProgRaf); lbProgRaf = 0; }
  if (lightboxProgress) {
    lightboxProgress.hidden = false;
    lightboxProgress.classList.remove('is-decoding');
  }
  lbProgPaint();
  lbProgEnsureTicking();
}

/** Raise target (network or manual). Never lowers. */
function lbProgSetTarget(pct, msgKey) {
  if (!lbProgVisible) lbProgStart();
  if (lbProgCompleting) return;
  const next = Math.max(0, Math.min(100, pct));
  if (next >= lbProgTarget) lbProgTarget = next;
  if (msgKey) lbProgMsgKey = msgKey;
  if (lightboxProgress) lightboxProgress.hidden = false;
  lbProgEnsureTicking();
}

/**
 * Map raw download fraction (0–1) into the short network band of the bar.
 */
function lbProgMapNetwork(loaded, total) {
  if (!(total > 0)) return LB_NET_FLOOR;
  const frac = Math.max(0, Math.min(1, loaded / total));
  return LB_NET_FLOOR + frac * (LB_NET_CEIL - LB_NET_FLOOR);
}

/**
 * Decode/render phase — the long wait for full-res photos.
 * Phase A: ease start → 94% over estimated duration (based on file size).
 * Phase B: if still decoding after that, crawl 94 → 98% so it never freezes.
 */
function lbProgBeginDecode(estimatedBytes) {
  if (lbProgCompleting) return;
  lbProgMsgKey = 'preparing';
  // Start decode right after network band (never above ~22%)
  lbProgDecodeStartPct = Math.min(22, Math.max(lbProgTarget, lbProgDisplay, LB_NET_FLOOR + 2));
  if (lbProgTarget < lbProgDecodeStartPct) lbProgTarget = lbProgDecodeStartPct;
  lbProgDecodeStart = lbProgNow();

  // Estimate how long decode/render should take from payload size.
  // Multi‑MB full JPEGs often spend several seconds in decode on mid devices.
  const mb = estimatedBytes > 0 ? estimatedBytes / (1024 * 1024) : 5;
  // Primary climb duration: ~1.6s for small, up to ~12s for huge files
  lbProgDecodeExpected = Math.min(12, Math.max(1.6, 1.1 + mb * 0.85));

  if (lbProgDecodeTimer) clearInterval(lbProgDecodeTimer);
  lbProgDecodeTimer = setInterval(() => {
    if (!lbProgVisible || lbProgCompleting) {
      clearInterval(lbProgDecodeTimer);
      lbProgDecodeTimer = 0;
      return;
    }
    const t = Math.max(0, (lbProgNow() - lbProgDecodeStart) / 1000);
    let curved;
    if (t <= lbProgDecodeExpected) {
      // Phase A — ease-out from start → LB_DECODE_MID over expected duration.
      // Covers most of the bar while the user is still waiting.
      const u = t / lbProgDecodeExpected;
      const eased = 1 - Math.pow(1 - u, 1.65); // gentle ease-out
      curved = lbProgDecodeStartPct + (LB_DECODE_MID - lbProgDecodeStartPct) * eased;
      lbProgMsgKey = 'preparing';
    } else {
      // Phase B — overtime: slow crawl toward LB_DECODE_CAP, never freezes.
      // Over 0→∞ maps to 0→1 of remaining 94→98 band.
      const over = t - lbProgDecodeExpected;
      const crawlFrac = 1 - Math.exp(-over / 5.5); // ~half of tail in ~4s
      curved = LB_DECODE_MID + (LB_DECODE_CAP - LB_DECODE_MID) * crawlFrac;
      lbProgMsgKey = over > 1.2 ? 'almost' : 'preparing';
    }
    // Always advance at least a little each tick so UI never looks stuck
    const floorStep = lbProgTarget + 0.08;
    lbProgTarget = Math.min(LB_DECODE_CAP, Math.max(floorStep, curved));
    lbProgEnsureTicking();
  }, 40);
  lbProgEnsureTicking();
}

function lbProgComplete(onDone) {
  if (lbProgDecodeTimer) { clearInterval(lbProgDecodeTimer); lbProgDecodeTimer = 0; }
  lbProgCompleting = true;
  lbProgMsgKey = 'almost';
  lbProgTarget = 100;
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    lbProgDisplay = 100;
    lbProgPaint();
    setTimeout(() => {
      lbProgHide();
      if (typeof onDone === 'function') onDone();
    }, 180);
  };
  lbProgEnsureTicking();
  const wait = setInterval(() => {
    if (lbProgDisplay < 100) {
      lbProgDisplay = Math.min(100, lbProgDisplay + 5.5);
      lbProgPaint();
    }
    if (lbProgDisplay >= 99.5) {
      clearInterval(wait);
      finish();
    }
  }, 20);
  setTimeout(() => {
    try { clearInterval(wait); } catch (e) { /* ignore */ }
    finish();
  }, 420);
}

function lbProgHide() {
  lbProgVisible = false;
  lbProgCompleting = false;
  if (lbProgDecodeTimer) { clearInterval(lbProgDecodeTimer); lbProgDecodeTimer = 0; }
  if (lbProgRaf) { cancelRaf(lbProgRaf); lbProgRaf = 0; }
  lbProgDisplay = 0;
  lbProgTarget = 0;
  lbProgMsgKey = 'loading';
  if (!lightboxProgress) return;
  lightboxProgress.hidden = true;
  lightboxProgress.classList.remove('is-indeterminate', 'is-decoding');
  lightboxProgress.removeAttribute('aria-busy');
  if (lightboxProgressFill) lightboxProgressFill.style.width = '0%';
  if (lightboxProgressPct) lightboxProgressPct.textContent = '0%';
}

function lbProgFail() {
  if (lbProgDecodeTimer) { clearInterval(lbProgDecodeTimer); lbProgDecodeTimer = 0; }
  if (lbProgRaf) { cancelRaf(lbProgRaf); lbProgRaf = 0; }
  lbProgCompleting = false;
  lbProgVisible = true;
  lbProgMsgKey = 'failed';
  lbProgTarget = 0;
  lbProgDisplay = 0;
  if (lightboxProgress) {
    lightboxProgress.hidden = false;
    lightboxProgress.classList.remove('is-decoding');
  }
  lbProgPaint();
  if (lightboxProgressFill) lightboxProgressFill.style.width = '0%';
}

function setLightboxProgressUI({ visible, percent, indeterminate, message }) {
  if (!visible) { lbProgHide(); return; }
  if (indeterminate) {
    if (!lbProgVisible) lbProgStart();
    lbProgBeginDecode(0);
    return;
  }
  if (!lbProgVisible) lbProgStart();
  const msgKey = message && /prepar|render|proces|描画|渲染/i.test(message) ? 'preparing'
    : message && /almost|ready|完成|listo|完了/i.test(message) ? 'almost'
    : message && /fail|no se|失败|失敗/i.test(message) ? 'failed'
    : 'loading';
  if (msgKey === 'failed') { lbProgFail(); return; }
  lbProgSetTarget(percent || 0, msgKey);
}

function cancelLightboxLoad() {
  lightboxLoadToken += 1;
  if (lightboxXhr) {
    try { lightboxXhr.abort(); } catch (e) { /* ignore */ }
    lightboxXhr = null;
  }
  if (lightboxDecodeImg) {
    try {
      lightboxDecodeImg.onload = null;
      lightboxDecodeImg.onerror = null;
      lightboxDecodeImg.src = '';
    } catch (e) { /* ignore */ }
    lightboxDecodeImg = null;
  }
  if (lightboxImg) {
    lightboxImg.classList.remove('is-loading');
    lightboxImg.removeAttribute('data-loaded-tier');
  }
  if (lightboxHdBtn) {
    lightboxHdBtn.hidden = true;
    lightboxHdBtn.classList.remove('is-loading');
  }
  lbProgHide();
}

function updateLightboxChrome(item, index) {
  if (!item) return;
  const img = item.querySelector('img');
  if (lightboxImg) lightboxImg.alt = (img && img.alt) || '';
  const cap = item.querySelector('.gallery-caption');
  if (lightboxCaption) lightboxCaption.textContent = cap ? cap.textContent.trim() : '';
  const location = item.dataset.location || '';
  const date = item.dataset.date || '';
  if (lightboxMeta) lightboxMeta.textContent = [location, date].filter(Boolean).join(' · ');
  if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${visibleItems.length}`;
  if (lightbox) {
    lightbox.setAttribute('aria-label', (lightboxCaption && lightboxCaption.textContent) || 'Photo');
  }
  const multi = visibleItems.length > 1;
  if (lightboxNextBtn) lightboxNextBtn.hidden = !multi;
  if (lightboxPrevBtn) lightboxPrevBtn.hidden = !multi;
}

function applyLightboxFullSrc(displaySrc, cacheKey, token, tier) {
  if (token !== lightboxLoadToken || !lightboxImg) return;
  lightboxImg.src = displaySrc;
  if (cacheKey) lightboxImg.setAttribute('data-full-src', cacheKey);
  else lightboxImg.removeAttribute('data-full-src');
  if (tier) lightboxImg.setAttribute('data-loaded-tier', tier);
  lightboxImg.classList.remove('is-loading');
  lbProgComplete();
  // HD upgrade button after progress dismisses
  setTimeout(() => {
    if (token !== lightboxLoadToken) return;
    const item = visibleItems[currentIndex];
    const img = item && item.querySelector('img');
    updateLightboxHdButton(img, tier);
  }, 220);
}

function decodeThenApply(displaySrc, cacheKey, token, onFail, estimatedBytes, tier) {
  // Network done → bar spends most of its life here (decode/render)
  lbProgBeginDecode(estimatedBytes || 0);
  const probe = new Image();
  lightboxDecodeImg = probe;
  probe.decoding = 'async';
  const done = (ok) => {
    if (lightboxDecodeImg === probe) lightboxDecodeImg = null;
    if (token !== lightboxLoadToken) return;
    if (!ok) {
      if (typeof onFail === 'function') onFail();
      return;
    }
    applyLightboxFullSrc(displaySrc, cacheKey, token, tier || 'medium');
  };
  probe.onload = () => {
    if (typeof probe.decode === 'function') {
      probe.decode().then(() => done(true)).catch(() => done(true));
    } else {
      done(true);
    }
  };
  probe.onerror = () => done(false);
  probe.src = displaySrc;
}

function failLightboxLoad(token, thumbFallback) {
  if (token !== lightboxLoadToken) return;
  if (thumbFallback && lightboxImg && !lightboxImg.getAttribute('data-full-src')) {
    lightboxImg.src = thumbFallback;
    lightboxImg.removeAttribute('data-full-src');
  }
  if (lightboxImg) lightboxImg.classList.remove('is-loading');
  lbProgFail();
  setTimeout(() => {
    if (token === lightboxLoadToken) lbProgHide();
  }, 1400);
}

/**
 * Fallback when XHR can't report progress (file://, blocked XHR, etc.).
 * Short synthetic network band, then full decode crawl.
 */
function loadFullViaImageFallback(assetUrl, token, thumbFallback, tier) {
  if (token !== lightboxLoadToken) return;
  if (lightboxImg) lightboxImg.classList.add('is-loading');
  if (!lbProgVisible) lbProgStart();
  // Synthetic network crawl only through the short network band
  let synth = Math.max(lbProgTarget, LB_NET_FLOOR + 1);
  lbProgSetTarget(synth, 'loading');
  const tick = setInterval(() => {
    if (token !== lightboxLoadToken) {
      clearInterval(tick);
      return;
    }
    if (synth < LB_NET_CEIL) {
      synth = Math.min(LB_NET_CEIL, synth + 0.9);
      lbProgSetTarget(synth, 'loading');
    }
  }, 70);

  const probe = new Image();
  lightboxDecodeImg = probe;
  probe.decoding = 'async';
  const finish = (ok) => {
    clearInterval(tick);
    if (lightboxDecodeImg === probe) lightboxDecodeImg = null;
    if (token !== lightboxLoadToken) return;
    if (ok) {
      lightboxCacheSet(assetUrl, assetUrl);
      applyLightboxFullSrc(assetUrl, assetUrl, token, tier || 'medium');
    } else {
      failLightboxLoad(token, thumbFallback);
    }
  };
  probe.onload = () => {
    clearInterval(tick);
    // Image bytes are in — remaining wait is decode/render
    lbProgBeginDecode(0);
    if (typeof probe.decode === 'function') {
      probe.decode().then(() => finish(true)).catch(() => finish(true));
    } else {
      finish(true);
    }
  };
  probe.onerror = () => { clearInterval(tick); finish(false); };
  probe.src = assetUrl;
}

function loadFullWithProgress(assetUrl, token, thumbFallback, tier) {
  if (!assetUrl) return;
  const loadedTier = tier || 'medium';

  let absoluteUrl = assetUrl;
  try {
    absoluteUrl = new URL(assetUrl, window.location.href).href;
  } catch (e) { /* keep relative */ }

  // Instant path: already downloaded this session — still need decode
  if (lightboxFullCache.has(assetUrl) || lightboxFullCache.has(absoluteUrl)) {
    const cached = lightboxFullCache.get(assetUrl) || lightboxFullCache.get(absoluteUrl);
    lbProgStart();
    lbProgSetTarget(LB_NET_CEIL, 'loading');
    decodeThenApply(cached, assetUrl, token, () => {
      lightboxFullCache.delete(assetUrl);
      lightboxFullCache.delete(absoluteUrl);
      loadFullWithProgress(assetUrl, token, thumbFallback, loadedTier);
    }, 0, loadedTier);
    return;
  }

  if (lightboxImg) lightboxImg.classList.add('is-loading');
  lbProgStart();

  // Thumbs are tiny — skip XHR progress overhead
  if (loadedTier === 'thumb' || window.location.protocol === 'file:') {
    loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
    return;
  }

  const xhr = new XMLHttpRequest();
  lightboxXhr = xhr;
  let gotProgress = false;
  let lastNetPct = LB_NET_FLOOR;
  let lastTotal = 0;

  try {
    xhr.open('GET', absoluteUrl, true);
    xhr.responseType = 'blob';
  } catch (err) {
    lightboxXhr = null;
    loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
    return;
  }

  xhr.onprogress = (e) => {
    if (token !== lightboxLoadToken) return;
    if (e.lengthComputable && e.total > 0) {
      gotProgress = true;
      lastTotal = e.total;
      // Network only fills 3% → 18% of the bar
      lastNetPct = Math.max(lastNetPct, lbProgMapNetwork(e.loaded, e.total));
      lbProgSetTarget(lastNetPct, 'loading');
    } else if (e.loaded > 0) {
      gotProgress = true;
      // Unknown total: nudge slowly within network band
      lastNetPct = Math.min(LB_NET_CEIL, lastNetPct + 1.2);
      lbProgSetTarget(lastNetPct, 'loading');
    }
  };

  xhr.onload = () => {
    if (token !== lightboxLoadToken) return;
    lightboxXhr = null;
    const body = xhr.response;
    const hasBody = body && (typeof body.size !== 'number' || body.size > 0);
    const statusOk = xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300);
    if (statusOk && hasBody) {
      // Download done — land at network ceiling (decode owns the rest)
      if (!gotProgress) {
        lbProgSetTarget(Math.max(LB_NET_FLOOR + 4, lastNetPct), 'loading');
        setTimeout(() => {
          if (token !== lightboxLoadToken) return;
          lbProgSetTarget(LB_NET_CEIL, 'loading');
        }, 60);
      } else {
        lbProgSetTarget(LB_NET_CEIL, 'loading');
      }
      const byteSize = (body && typeof body.size === 'number') ? body.size : lastTotal;
      try {
        const objUrl = URL.createObjectURL(body);
        lightboxCacheSet(assetUrl, objUrl);
        lightboxCacheSet(absoluteUrl, objUrl);
        // Brief beat so the bar can reach the network ceiling, then decode crawl
        setTimeout(() => {
          if (token !== lightboxLoadToken) return;
          decodeThenApply(objUrl, assetUrl, token, () => {
            try { URL.revokeObjectURL(objUrl); } catch (e) { /* ignore */ }
            lightboxFullCache.delete(assetUrl);
            lightboxFullCache.delete(absoluteUrl);
            loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
          }, byteSize, loadedTier);
        }, gotProgress ? 40 : 100);
      } catch (err) {
        loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
      }
    } else {
      loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
    }
  };

  xhr.onerror = () => {
    if (token !== lightboxLoadToken) return;
    lightboxXhr = null;
    loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
  };

  xhr.onabort = () => {
    if (lightboxXhr === xhr) lightboxXhr = null;
  };

  try {
    xhr.send();
  } catch (err) {
    lightboxXhr = null;
    loadFullViaImageFallback(assetUrl, token, thumbFallback, loadedTier);
  }
}

function showLightboxPhoto(index, { fromNav = false, force = false, forceTier = null } = {}) {
  if (!lightbox || !lightboxImg) return;
  const item = visibleItems[index];
  if (!item) return;
  const img = item.querySelector('img');
  if (!img) return;

  // Abort any in-flight download so only the photo the user is viewing loads.
  cancelLightboxLoad();
  const token = lightboxLoadToken;

  updateLightboxChrome(item, index);
  if (lightboxHdBtn) {
    lightboxHdBtn.hidden = true;
    lightboxHdBtn.classList.remove('is-loading');
  }

  const thumb = galleryThumbSrc(img);
  const preferredTier = forceTier || galleryQuality || 'medium';
  const preferred = forceTier === 'full'
    ? (galleryFullSrc(img) || galleryPreferredSrc(img, 'full'))
    : galleryPreferredSrc(img, preferredTier);
  if (!preferred && !thumb) return;

  // Already showing this asset — nothing to do (unless forced quality change).
  if (!force && preferred && lightboxImg.getAttribute('data-full-src') === preferred && lightboxImg.getAttribute('src')) {
    lightboxImg.classList.remove('is-loading');
    setLightboxProgressUI({ visible: false });
    updateLightboxHdButton(img, lightboxImg.getAttribute('data-loaded-tier'));
    return;
  }

  // Instant feedback: always paint the new photo's thumb first (open + arrows).
  if (thumb) {
    lightboxImg.src = thumb;
    lightboxImg.removeAttribute('data-full-src');
    lightboxImg.setAttribute('data-loaded-tier', 'thumb');
  }

  if (!preferred || preferred === thumb) {
    lightboxImg.classList.remove('is-loading');
    setLightboxProgressUI({ visible: false });
    updateLightboxHdButton(img, 'thumb');
    return;
  }

  // Determine tier label for the asset we're about to load
  let tier = preferredTier;
  const full = galleryFullSrc(img);
  const medium = galleryMediumSrc(img);
  if (preferred === full) tier = 'full';
  else if (preferred === medium) tier = 'medium';
  else if (preferred === thumb) tier = 'thumb';

  loadFullWithProgress(preferred, token, thumb, tier);
}

if (lightboxHdBtn) {
  lightboxHdBtn.addEventListener('click', () => {
    const item = visibleItems[currentIndex];
    if (!item) return;
    const img = item.querySelector('img');
    if (!img) return;
    const full = galleryFullSrc(img);
    if (!full) return;
    lightboxHdBtn.classList.add('is-loading');
    lightboxHdBtn.textContent = lightboxHdLabel('loadingFull');
    showLightboxPhoto(currentIndex, { fromNav: false, force: true, forceTier: 'full' });
  });
}

function openLightbox(index) {
  if (!lightbox || index < 0 || visibleItems.length === 0) return;
  currentIndex = index;
  showLightboxPhoto(index, { fromNav: false });
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  lockBodyScroll();
  if (lightboxCloseBtn) lightboxCloseBtn.focus();
}
function closeLightbox() {
  if (!lightbox || !lightbox.classList.contains('open')) return;
  // Capture before unlock — focus restore can otherwise scroll masonry items
  // into view and jump the page (seen on lower-column photos like Richmond).
  const restoreY = lockedScrollY;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  // Abort download + free the displayed full bitmap when the viewer closes.
  cancelLightboxLoad();
  if (lightboxImg) {
    lightboxImg.removeAttribute('src');
    lightboxImg.removeAttribute('data-full-src');
    lightboxImg.removeAttribute('data-loaded-tier');
    lightboxImg.alt = '';
    lightboxImg.classList.remove('is-loading');
  }
  if (lightboxHdBtn) {
    lightboxHdBtn.hidden = true;
    lightboxHdBtn.classList.remove('is-loading');
  }
  unlockBodyScroll();
  if (lastFocusedThumb && typeof lastFocusedThumb.focus === 'function') {
    try { lastFocusedThumb.focus({ preventScroll: true }); }
    catch (e) { lastFocusedThumb.focus(); }
  }
  // Pin scroll after unlock + focus (some browsers still adjust for focus).
  const pin = () => {
    try { window.scrollTo({ top: restoreY, left: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, restoreY); }
  };
  pin();
  raf(() => {
    pin();
    raf(pin);
  });
}

// Immediate nav — full quality for the new current photo only (no delayed
// crossfade that briefly showed thumbs / dimmed the stage).
function navigate(step) {
  if (!lightboxImg || visibleItems.length < 2) return;
  if (!lightbox.classList.contains('open')) return;
  currentIndex = (currentIndex + step + visibleItems.length) % visibleItems.length;
  showLightboxPhoto(currentIndex, { fromNav: true });
}
function showNext() { navigate(1); }
function showPrev() { navigate(-1); }

document.querySelectorAll('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => {
    if (item.classList.contains('load-error') || item.classList.contains('hidden')) return;
    lastFocusedThumb = item;
    refreshVisibleGalleryItems();
    let idx = visibleItems.indexOf(item);
    // If the tile is visible but missing from the cache (race after filter/sort), rebuild once.
    if (idx < 0) {
      visibleItems = [...document.querySelectorAll('.gallery-item:not(.hidden):not(.load-error)')];
      idx = visibleItems.indexOf(item);
    }
    if (idx >= 0) openLightbox(idx);
  });
});

if (lightbox) {
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', e => { e.stopPropagation(); showNext(); });
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', e => { e.stopPropagation(); showPrev(); });
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      e.stopImmediatePropagation();
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); showNext(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPrev(); }
    // Focus trap: close / prev / next / optional HD upgrade.
    if (e.key === 'Tab') {
      const focusables = [lightboxCloseBtn, lightboxPrevBtn, lightboxNextBtn, lightboxHdBtn]
        .filter(el => el && !el.hidden && !el.disabled);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Mobile: swipe left/right anywhere on the lightbox to go next/prev
  let touchStartX = 0;
  let touchStartY = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Prefer horizontal swipes; ignore mostly-vertical gestures (scroll-ish).
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dx < 0 ? showNext() : showPrev();
    }
  }, { passive: true });
}

/** Refresh gallery placeholders, tile aria, and open lightbox after language change. */
function refreshGalleryLanguageChrome() {
  if (!document.body.classList.contains('page-gallery')) return;
  // applyLanguage() also runs mid-script (before the gallery section initializes).
  // Accessing const/let gallery bindings in that window throws TDZ — bail quietly.
  if (typeof galleryUiReady === 'undefined' || !galleryUiReady) return;
  try {
    document.querySelectorAll('.gallery-item-placeholder .ph-text').forEach(el => {
      el.textContent = GALLERY_PLACEHOLDER_TEXT[currentLang] || GALLERY_PLACEHOLDER_TEXT.en;
    });
    document.querySelectorAll('.gallery-item').forEach(item => {
      const cap = item.querySelector('.gallery-caption');
      if (cap && !item.classList.contains('load-error')) {
        item.setAttribute('aria-label', cap.textContent.trim());
      }
    });
    if (lightbox && lightbox.classList.contains('open') && visibleItems[currentIndex]) {
      updateLightboxChrome(visibleItems[currentIndex], currentIndex);
      const img = visibleItems[currentIndex].querySelector('img');
      if (typeof updateLightboxHdButton === 'function') {
        updateLightboxHdButton(img, lightboxImg && lightboxImg.getAttribute('data-loaded-tier'));
      }
    }
  } catch (_) { /* gallery bindings not ready */ }
}

// Mark gallery UI ready last so language switches can safely refresh chrome.
galleryUiReady = true;
