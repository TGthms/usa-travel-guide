'use strict';
/* USA Travel Guide — features/gallery.js
   Classic non-module script. Shared global scope with other src/js scripts.
   Canonical load order: see header of src/js/app.js
*/

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
// Legacy timer id (repack-on-load removed; kept so old call sites stay harmless).
let galleryPackTimer = 0;

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

// --- Image loading: grid always uses thumbs. Space is reserved from width/height
// attributes (aspect-ratio) so lazy-load never reflows the masonry or moves
// neighbors. We deliberately do NOT re-pack columns when a thumb finishes —
// that was the "photos magically jump while scrolling" bug.
function applyGalleryAspectRatio(img, item) {
  if (!img) return;
  const aw = parseFloat(img.getAttribute('width') || '') || 0;
  const ah = parseFloat(img.getAttribute('height') || '') || 0;
  if (aw > 0 && ah > 0) {
    img.style.aspectRatio = `${aw} / ${ah}`;
    if (item) item.style.aspectRatio = `${aw} / ${ah}`;
  }
}

function watchImageLoad(img) {
  if (!img) return;
  const item = img.closest('.gallery-item');
  applyGalleryAspectRatio(img, item);
  const onOk = () => {
    img.classList.add('loaded');
    if (item) {
      item.classList.add('img-ready');
      // Prefer measured size only if attributes were missing (keeps layout stable).
      if (!img.style.aspectRatio && img.naturalWidth > 0 && img.naturalHeight > 0) {
        img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        item.style.aspectRatio = img.style.aspectRatio;
      }
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

/**
 * Visible tiles for lightbox prev/next. Must follow the active sort mode
 * (e.g. newest-first), not masonry column DOM order — otherwise arrow keys
 * jump between columns and feel random.
 */
function refreshVisibleGalleryItems() {
  const items = [...document.querySelectorAll('.gallery-item:not(.hidden):not(.load-error)')];
  if (items.length >= 2 && typeof compareGalleryItems === 'function') {
    items.sort(compareGalleryItems);
  }
  visibleItems = items;
}

/**
 * Parse gallery dates into a sortable number (higher = newer).
 * Uses YYYYMMDD integers so ordering is obvious and stable.
 * Accepts: "July 4, 2026", "July 2026" (day 0 — before any day that month),
 * ISO "2026-07-04" / "2026-07".
 */
function galleryDateSortKey(dateStr) {
  const s = String(dateStr || '').trim();
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  // "Month D, YYYY" (precise day)
  let m = s.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const mon = months[m[1].toLowerCase()] || 0;
    const day = Math.min(31, Math.max(0, parseInt(m[2], 10) || 0));
    const year = parseInt(m[3], 10) || 0;
    if (!year || !mon) return 0;
    return year * 10000 + mon * 100 + day;
  }
  // "Month YYYY" (month-only — sorts before day 1 of that month)
  m = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const mon = months[m[1].toLowerCase()] || 0;
    const year = parseInt(m[2], 10) || 0;
    if (!year || !mon) return 0;
    return year * 10000 + mon * 100; // day = 0
  }
  // ISO YYYY-MM-DD or YYYY-MM
  m = s.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (m) {
    const year = parseInt(m[1], 10) || 0;
    const mon = parseInt(m[2], 10) || 0;
    const day = m[3] ? Math.min(31, Math.max(0, parseInt(m[3], 10) || 0)) : 0;
    if (!year || !mon) return 0;
    return year * 10000 + mon * 100 + day;
  }
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

/** Column count must match gallery CSS breakpoints. */
function getGalleryColumnCount() {
  const w = window.innerWidth || 1200;
  if (w <= 360) return 1;
  if (w <= 1024) return 2;
  if (w >= 1600) return 4;
  return 3;
}

function getGalleryColumnGap() {
  const w = window.innerWidth || 1200;
  if (w <= 360) return 12;
  if (w <= 640) return 10;
  if (w <= 1024) return 14;
  if (w >= 1600) return 18;
  return 16;
}

/**
 * Height estimate for packing. Uses HTML width/height attributes ONLY —
 * never naturalWidth (which arrives mid-scroll and used to reshuffle columns).
 */
function estimateGalleryItemHeight(item, colWidth) {
  if (!item || item.classList.contains('hidden')) return 0;
  const img = item.querySelector('img');
  let ratio = 0.75;
  if (img) {
    const aw = parseFloat(img.getAttribute('width') || '') || 0;
    const ah = parseFloat(img.getAttribute('height') || '') || 0;
    if (aw > 0 && ah > 0) ratio = ah / aw;
  }
  return colWidth * ratio;
}

/** Last pack signature — skip DOM moves when nothing meaningful changed. */
let galleryPackSignature = '';

function galleryPackFingerprint(visible, n) {
  // Identity + order of visible tiles and column count.
  return n + '|' + visible.map((el) => el.querySelector('img')?.getAttribute('data-full') || el.dataset.date || '').join(',');
}

/**
 * Pack sorted items into N flex columns (shortest-column).
 * Only mutates the DOM when the visible set/order or column count changes.
 * Does not run on image load — that caused mid-scroll "teleporting" photos.
 */
function packGalleryMasonry(orderedItems) {
  if (!galleryGrid) return;
  const items = orderedItems || [...galleryGrid.querySelectorAll('.gallery-item')];
  if (!items.length) return;

  const n = Math.max(1, getGalleryColumnCount());
  const gap = getGalleryColumnGap();

  const visible = [];
  const parked = [];
  items.forEach((item) => {
    if (item.classList.contains('hidden') || item.classList.contains('load-error')) {
      parked.push(item);
    } else {
      visible.push(item);
    }
  });

  const signature = galleryPackFingerprint(visible, n);
  // Still ensure columns exist on first paint even if signature matches empty.
  let cols = [...galleryGrid.querySelectorAll(':scope > .gallery-col')];
  const needsStructure = cols.length !== n;
  if (!needsStructure && signature && signature === galleryPackSignature) {
    return; // no-op: avoids scroll jump from redundant appendChild
  }
  galleryPackSignature = signature;

  while (cols.length < n) {
    const col = document.createElement('div');
    col.className = 'gallery-col';
    col.setAttribute('role', 'presentation');
    galleryGrid.appendChild(col);
    cols.push(col);
  }
  while (cols.length > n) {
    const doomed = cols.pop();
    while (doomed.firstChild) galleryGrid.appendChild(doomed.firstChild);
    doomed.remove();
  }
  cols = [...galleryGrid.querySelectorAll(':scope > .gallery-col')];

  const gridW = galleryGrid.clientWidth || galleryGrid.offsetWidth || 900;
  const colWidth = Math.max(80, (gridW - gap * (n - 1)) / n);
  const heights = new Array(n).fill(0);

  // Disable scroll anchoring while we reparent nodes (prevents browser jump).
  const prevAnchor = galleryGrid.style.overflowAnchor;
  galleryGrid.style.overflowAnchor = 'none';

  visible.forEach((item) => {
    let shortest = 0;
    for (let i = 1; i < n; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    cols[shortest].appendChild(item);
    heights[shortest] += estimateGalleryItemHeight(item, colWidth) + gap;
  });

  parked.forEach((item, i) => {
    cols[i % n].appendChild(item);
  });

  [...galleryGrid.children].forEach((child) => {
    if (child.classList && child.classList.contains('gallery-col')) return;
    if (child.classList && child.classList.contains('gallery-item')) {
      cols[0].appendChild(child);
    }
  });

  galleryGrid.style.overflowAnchor = prevAnchor;
}

function scheduleGalleryMasonryPack() {
  // Kept as a named no-op hook for any legacy call sites. Layout is stable
  // from attributes; only sort/filter/resize should repack (via sortGalleryItems).
  if (!galleryGrid) return;
}

function compareGalleryItems(a, b) {
  const mode = gallerySortMode || 'date-desc';
  if (mode === 'date-desc' || mode === 'date-asc') {
    const da = galleryDateSortKey(a.dataset.date);
    const db = galleryDateSortKey(b.dataset.date);
    if (da !== db) return mode === 'date-desc' ? db - da : da - db;
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
}

function sortGalleryItems() {
  if (!galleryGrid) return;
  const items = [...galleryGrid.querySelectorAll('.gallery-item')];
  if (!items.length) return;
  if (items.length >= 2) items.sort(compareGalleryItems);
  packGalleryMasonry(items);
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
  setTimeout(() => {
    refreshVisibleGalleryItems();
    // Rebalance columns after .hidden changes so filtered-out tiles leave no holes.
    if (typeof sortGalleryItems === 'function') sortGalleryItems();
  }, delay);
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

// Default order: newest first (by data-date), packed into masonry columns.
if (galleryGrid) {
  sortGalleryItems();
  // Re-pack when column count / widths change (responsive breakpoints).
  let lastColCount = getGalleryColumnCount();
  let lastGridW = galleryGrid.clientWidth || 0;
  const onGalleryResize = () => {
    const nextN = getGalleryColumnCount();
    const nextW = galleryGrid.clientWidth || 0;
    if (nextN !== lastColCount || Math.abs(nextW - lastGridW) > 24) {
      lastColCount = nextN;
      lastGridW = nextW;
      sortGalleryItems();
    }
  };
  window.addEventListener('resize', onGalleryResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(onGalleryResize, 120);
  }, { passive: true });
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
  const dict = getI18nDict(currentLang);
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
  const alreadyOpen = lightbox.classList.contains('open');
  currentIndex = index;
  showLightboxPhoto(index, { fromNav: false });
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  // Only lock once per open. Enter/Space on role=button often also fires click,
  // which would double-increment scrollLockCount and leave the page unscrollable
  // after a single Escape.
  if (!alreadyOpen) lockBodyScroll();
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
  // Hard recovery if a prior double-open left the lock counter high.
  ensureBodyScrollUnlocked();
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

function openGalleryItem(item) {
  if (!item || item.classList.contains('load-error') || item.classList.contains('hidden')) return;
  lastFocusedThumb = item;
  refreshVisibleGalleryItems();
  let idx = visibleItems.indexOf(item);
  // If the tile is visible but missing from the cache (race after filter/sort), rebuild once.
  if (idx < 0) {
    refreshVisibleGalleryItems();
    idx = visibleItems.indexOf(item);
  }
  // openLightbox only locks scroll on the first open — safe if Enter also synthesizes click.
  if (idx >= 0) openLightbox(idx);
}

document.querySelectorAll('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => openGalleryItem(item));
  // role="button" tiles must open on Enter/Space (matches destination cards).
  // preventDefault stops the browser from also synthesizing a click after Space.
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openGalleryItem(item);
    }
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
