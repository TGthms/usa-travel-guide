'use strict';
/* USA Travel Guide — features/home.js
   Classic non-module script. Shared global scope with other src/js scripts.
   Canonical load order: see header of src/js/app.js
*/

/* ── HOMEPAGE-ONLY FEATURES ──
   Everything below (hero parallax, regions carousel, destinations carousel
   + favorites + filtering) only exists on the homepage. This script is
   shared with other pages (e.g. gallery.html) that reuse the same header,
   settings/tools dialogs, and gallery/lightbox further down — so this whole
   block is skipped there instead of throwing on missing elements. */
if (document.getElementById('hero')) {

/* ── IMMERSIVE HERO PHOTO ──
   Classic style → images/main-classic.webp
   Modern style  → images/main-modern.webp
   Light/dark is handled with CSS scrims + brightness filters. */
const HERO_PHOTO = {
  classic: { src: 'images/main-classic.webp', w: 8064, h: 6048 },
  modern:  { src: 'images/main-modern.webp',  w: 4032, h: 3024 }
};
function playHeroEnterMotion(force) {
  const img = document.getElementById('heroBgImg');
  if (!img) return;
  // Reduced / off: show sharp photo immediately
  if (typeof motionIsOff === 'function' && motionIsOff()) {
    img.classList.remove('is-hero-enter');
    img.style.opacity = '1';
    img.style.filter = 'none';
    img.style.transform = 'none';
    return;
  }
  if (typeof motionIsReduced === 'function' && motionIsReduced()) {
    img.classList.add('is-hero-enter');
    return;
  }
  // Restart CSS animation (class remove → reflow → add)
  img.classList.remove('is-hero-enter');
  // Clear any inline rest state from prior reduced/off
  img.style.opacity = '';
  img.style.filter = '';
  img.style.transform = '';
  void img.offsetWidth;
  img.classList.add('is-hero-enter');
}

function syncHeroBackground() {
  const img = document.getElementById('heroBgImg');
  if (!img) return;
  const style = (typeof prefStyle === 'string' && prefStyle === 'classic') ? 'classic' : 'modern';
  const next = HERO_PHOTO[style] || HERO_PHOTO.modern;
  img.classList.toggle('hero-bg-img--classic', style === 'classic');
  img.classList.toggle('hero-bg-img--modern', style === 'modern');
  const changed = img.getAttribute('src') !== next.src;
  if (changed) {
    img.setAttribute('width', String(next.w));
    img.setAttribute('height', String(next.h));
    img.src = next.src;
  }
  // Replay enter when the photo asset changes (Classic ↔ Modern)
  if (changed) {
    const run = () => playHeroEnterMotion(true);
    if (img.complete && img.naturalWidth > 0) run();
    else img.addEventListener('load', run, { once: true });
  }
}
window.syncHeroBackground = syncHeroBackground;
window.playHeroEnterMotion = playHeroEnterMotion;
syncHeroBackground();

/* Start luxury enter after the splash so blur→clear is actually visible */
(function scheduleHeroEnter() {
  const img = document.getElementById('heroBgImg');
  if (!img) return;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    // Wait for decode when possible so first frame is sharp enough to blur from
    const kick = () => playHeroEnterMotion(false);
    if (img.decode) {
      img.decode().then(kick).catch(kick);
    } else if (img.complete) {
      kick();
    } else {
      img.addEventListener('load', kick, { once: true });
      // Never leave a blank hero if load stalls
      setTimeout(kick, 1600);
    }
  };
  const loader = document.getElementById('loader');
  if (!loader || loader.classList.contains('gone')) {
    // Slight delay so paint lands after splash paint on mobile (instant gone)
    requestAnimationFrame(() => setTimeout(start, 40));
  } else {
    const mo = new MutationObserver(() => {
      if (loader.classList.contains('gone')) {
        mo.disconnect();
        // Brief beat after splash fades so the motion is the first thing you see
        setTimeout(start, 80);
      }
    });
    mo.observe(loader, { attributes: true, attributeFilter: ['class'] });
    // Fallback if observer never fires
    window.addEventListener('load', () => setTimeout(start, 900), { once: true });
  }
  // Hard fallback: never stuck at opacity 0
  setTimeout(() => {
    if (!img.classList.contains('is-hero-enter')) start();
  }, 2200);
})();

/* ── HERO SCROLL CLICK ── */
const heroScrollBtn = document.getElementById('heroScroll');
if (heroScrollBtn) {
  heroScrollBtn.addEventListener('click', () => {
    const intro = document.getElementById('intro');
    if (intro) intro.scrollIntoView({ behavior: scrollBehaviorPref() });
  });
}

/* ── INTRO FACT CARDS: staggered entrance on first reveal ── */
(function initIntroFactEntrance() {
  const facts = document.querySelector('.intro-facts');
  if (!facts) return;
  const mark = () => facts.classList.add('is-entered');
  if (typeof motionIsOff === 'function' && motionIsOff()) {
    mark();
    return;
  }
  if (!('IntersectionObserver' in window)) {
    mark();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        mark();
        io.disconnect();
        break;
      }
    }
  }, { threshold: 0.22, rootMargin: '0px 0px -8% 0px' });
  io.observe(facts);
})();

/* ── INTRO PHOTO SHUFFLE ──
   3-slot collage cycling weighted gallery THUMB WebPs.
   All slots refresh every 6s, phase-staggered by 2s so only one swaps at a time
   (avoids the three cards “fighting”). Click → gallery.html?photo= */
(function initIntroPhotoShuffle() {
  const root = document.getElementById('introGallery');
  if (!root) return;
  const catalog = (typeof window.INTRO_GALLERY_PHOTOS !== 'undefined' && Array.isArray(window.INTRO_GALLERY_PHOTOS))
    ? window.INTRO_GALLERY_PHOTOS
    : [];
  if (!catalog.length) return;

  const WEIGHTS = {
    nature: 4.2,
    landmarks: 4.0,
    coast: 4.0,
    cityscapes: 3.2,
    roads: 1.6,
    'food-culture': 0.45
  };
  // Same cadence for all three; phase offset keeps swaps sequential.
  const SLOT_MS = 6000;
  const PHASE_MS = 2000; // 0s / 2s / 4s → one change every 2s, each slot every 6s

  function photoUrl(p) {
    if (!p) return '';
    return p.thumbWebp || p.thumb || p.mediumWebp || '';
  }
  function weightOf(p) {
    const w = WEIGHTS[p.category];
    return typeof w === 'number' ? w : 1;
  }
  function pickWeighted(list, excludeFiles) {
    const ex = excludeFiles || new Set();
    const pool = list.filter((p) => p && photoUrl(p) && !ex.has(p.file));
    const use = pool.length ? pool : list.filter((p) => p && photoUrl(p));
    if (!use.length) return null;
    let total = 0;
    const weights = use.map((p) => {
      const w = weightOf(p);
      total += w;
      return w;
    });
    let r = Math.random() * total;
    for (let i = 0; i < use.length; i++) {
      r -= weights[i];
      if (r <= 0) return use[i];
    }
    return use[use.length - 1];
  }
  /** Prefer full location name; only shorten when truly too long for the chip. */
  function captionFor(photo, mode) {
    if (!photo) return '';
    const city = (photo.city || '').trim();
    const state = (photo.state || '').trim();
    const loc = (photo.location || '').trim();
    // Full location first (e.g. "San Francisco, CA")
    const full = loc || (city && state ? city + ', ' + state : (city || state || photo.caption || ''));
    const max = mode === 'small' ? 36 : 48;
    if (!full) return '';
    if (full.length <= max) return full;
    // Too long: fall back to city, then state, then hard ellipsis
    if (city && city.length <= max) return city;
    if (state && state.length <= max) return state;
    return full.slice(0, Math.max(0, max - 1)) + '…';
  }
  function preload(url) {
    return new Promise((resolve) => {
      if (!url) { resolve(false); return; }
      const im = new Image();
      im.onload = () => resolve(true);
      im.onerror = () => resolve(false);
      im.src = url;
    });
  }

  const slots = [
    { el: root.querySelector('[data-intro-slot="tall"]'), mode: 'tall', photo: null },
    { el: root.querySelector('[data-intro-slot="small-a"]'), mode: 'small', photo: null },
    { el: root.querySelector('[data-intro-slot="small-b"]'), mode: 'small', photo: null }
  ].filter((s) => s.el);

  function activeFiles() {
    const s = new Set();
    slots.forEach((slot) => { if (slot.photo && slot.photo.file) s.add(slot.photo.file); });
    return s;
  }

  function applyPhoto(slot, photo, { animate }) {
    if (!slot || !photo || !slot.el) return;
    const layers = slot.el.querySelectorAll('.intro-photo-layer');
    const label = slot.el.querySelector('.intro-photo-label');
    if (!layers.length) return;
    const active = slot.el.querySelector('.intro-photo-layer.is-active') || layers[0];
    const next = active === layers[0] ? layers[1] || layers[0] : layers[0];
    const url = photoUrl(photo);
    const cap = captionFor(photo, slot.mode);

    const finishPhoto = () => {
      slot.photo = photo;
      slot.el.dataset.photoFile = photo.file || '';
      slot.el.dataset.photoSlug = photo.slug || '';
      const aria = cap ? ('Open gallery — ' + cap) : 'Open gallery photo';
      slot.el.setAttribute('aria-label', aria);
    };
    /**
     * Soft exit → swap text → single ease-in (CSS transition only).
     * Do NOT also run a keyframe enter — that stacked and looked like a double anim.
     */
    const showCaption = (withMotion) => {
      if (!label) return;
      // Cancel any pending caption timer from a prior swap on this slot
      if (slot._capTimer) {
        clearTimeout(slot._capTimer);
        slot._capTimer = 0;
      }
      if (!withMotion || (typeof motionIsOff === 'function' && motionIsOff())) {
        label.classList.remove('is-swapping');
        label.textContent = cap || '—';
        return;
      }
      // Same text — skip motion entirely
      if ((label.textContent || '') === (cap || '—') && !label.classList.contains('is-swapping')) {
        return;
      }
      label.classList.add('is-swapping');
      slot._capTimer = window.setTimeout(() => {
        slot._capTimer = 0;
        label.textContent = cap || '—';
        // One enter only: removing is-swapping transitions back to the rest pose
        label.classList.remove('is-swapping');
      }, 160);
    };

    if (!animate || layers.length < 2 || (typeof motionIsOff === 'function' && motionIsOff())) {
      active.style.backgroundImage = url ? 'url("' + url + '")' : '';
      active.classList.add('is-active');
      active.classList.remove('is-exit');
      if (layers[1] && layers[1] !== active) {
        layers[1].classList.remove('is-active', 'is-exit');
        layers[1].style.backgroundImage = '';
      }
      finishPhoto();
      showCaption(false);
      return;
    }

    // Caption animates on its own quick timeline; photo crossfade stays longer.
    showCaption(true);

    next.style.backgroundImage = url ? 'url("' + url + '")' : '';
    // Force reflow so transform/opacity transitions run
    void next.offsetWidth;
    next.classList.add('is-active');
    next.classList.remove('is-exit');
    active.classList.remove('is-active');
    active.classList.add('is-exit');
    window.setTimeout(() => {
      active.classList.remove('is-exit');
      active.style.backgroundImage = '';
      finishPhoto();
    }, (typeof motionIsReduced === 'function' && motionIsReduced()) ? 360 : 1100);
  }

  async function showNext(slot, animate) {
    const photo = pickWeighted(catalog, activeFiles());
    if (!photo) return;
    const ok = await preload(photoUrl(photo));
    if (!ok) return;
    applyPhoto(slot, photo, { animate: !!animate });
  }

  function openPhoto(slot) {
    const file = (slot.photo && slot.photo.file) || slot.el.dataset.photoFile || '';
    const slug = (slot.photo && slot.photo.slug) || slot.el.dataset.photoSlug || '';
    const q = file ? encodeURIComponent(file) : (slug ? encodeURIComponent(slug) : '');
    // Prefer in-page lightbox only when gallery grid + lightbox exist (gallery page).
    if (typeof openLightbox === 'function' && document.getElementById('galleryGrid') && document.getElementById('lightbox')) {
      const items = document.querySelectorAll('.gallery-item');
      let idx = -1;
      items.forEach((item, i) => {
        const img = item.querySelector('img');
        const full = img && img.getAttribute('data-full');
        if (full && file && full.endsWith(file)) idx = i;
      });
      if (idx >= 0) {
        if (typeof openGalleryItem === 'function') openGalleryItem(items[idx]);
        else openLightbox(idx);
        return;
      }
    }
    window.location.href = q ? ('gallery.html?photo=' + q) : 'gallery.html';
  }

  slots.forEach((slot) => {
    slot.el.addEventListener('click', () => openPhoto(slot));
    slot.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPhoto(slot);
      }
    });
  });

  // Seed distinct photos, then one shared scheduler (phase-staggered 6s cadence).
  (async function start() {
    for (let i = 0; i < slots.length; i++) {
      await showNext(slots[i], false);
    }
    const reduced = typeof motionIsOff === 'function' && (motionIsOff() || (typeof motionIsReduced === 'function' && motionIsReduced()));
    if (reduced) return; // static first frame only

    let timers = [];
    let phaseTimeouts = [];
    const clearTimers = () => {
      timers.forEach((t) => clearInterval(t));
      phaseTimeouts.forEach((t) => clearTimeout(t));
      timers = [];
      phaseTimeouts = [];
    };
    const startTimers = () => {
      clearTimers();
      slots.forEach((slot, i) => {
        // Even phases: only one slot swaps at a time (0s / 2s / 4s), then every 6s.
        const phase = i * PHASE_MS;
        const tid = window.setTimeout(() => {
          if (document.hidden) return;
          showNext(slot, true);
          const id = window.setInterval(() => {
            if (document.hidden) return;
            const rect = root.getBoundingClientRect();
            if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return;
            showNext(slot, true);
          }, SLOT_MS);
          timers.push(id);
        }, phase);
        phaseTimeouts.push(tid);
      });
    };
    startTimers();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimers();
      else startTimers();
    });
  })();
})();

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
      const dict = getI18nDict(currentLang);
      destEmptyState.textContent = (dict && dict['dest.emptyStateSaved'])
        || EMPTY_STATE_SAVED_TEXT[currentLang]
        || EMPTY_STATE_SAVED_TEXT.en;
    } else if (destEmptyStateDefaultKey) {
      destEmptyState.setAttribute('data-i18n', destEmptyStateDefaultKey);
      const dict = getI18nDict(currentLang);
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

/* Scroll-reveal for .reveal is initialized in core/runtime.js (all pages). */

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
/* ── MODAL SYSTEM ── */
const overlay   = document.getElementById('modal-overlay');
const modalTag  = document.getElementById('modal-tag');
const modalTitle= document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');


// currentModalKey is declared in core/runtime.js (shared with applyLanguage).

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
  ensureBodyScrollUnlocked();
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


function buildLinksListHtml(links) {
  if (!links || !links.length) return '';
  const heading = (typeof DEST_LINKS_HEADING !== 'undefined' && (DEST_LINKS_HEADING[currentLang] || DEST_LINKS_HEADING.en))
    || 'Helpful links';
  const items = links.map((l) => {
    const label = (l.label && (l.label[currentLang] || l.label.en)) || l.url;
    const internal = !!l.internal || (typeof l.url === 'string' && !/^https?:\/\//i.test(l.url));
    const attrs = internal
      ? `href="${l.url}"`
      : `href="${l.url}" target="_blank" rel="noopener noreferrer"`;
    return `<li><a ${attrs}>${label}</a></li>`;
  }).join('');
  return `<div class="modal-links"><div class="modal-links-label">${heading}</div><ul class="modal-links-list">${items}</ul></div>`;
}

function buildDestLinksHtml(destId) {
  const links = (typeof DEST_TRAVEL_LINKS !== 'undefined' && DEST_TRAVEL_LINKS[destId]) || null;
  let html = buildLinksListHtml(links);
  // Deep-link into the weather mini-app for this city
  if (typeof DEST_WEATHER_CITIES !== 'undefined' && DEST_WEATHER_CITIES[destId]) {
    const wxLabels = {
      en: 'Live weather for this city →',
      es: 'Tiempo en vivo de esta ciudad →',
      zh: '查看该城市实时天气 →',
      ja: 'この都市の天気を見る →'
    };
    const wxLab = wxLabels[currentLang] || wxLabels.en;
    const wxBlock =
      `<p class="modal-tool-cta"><a class="guide-tool-link" href="tools-weather.html?city=${encodeURIComponent(destId)}">${wxLab}</a></p>`;
    html = wxBlock + html;
  }
  return html;
}

function buildSectionLinksHtml(modalKey) {
  if (!modalKey || typeof GUIDE_SECTION_LINKS === 'undefined') return '';
  return buildLinksListHtml(GUIDE_SECTION_LINKS[modalKey]);
}

function getModalData(key) {
  // modal-content.js only loads on the main guide; other pages must not throw.
  const i18nPack = (typeof MODAL_DATA_I18N !== 'undefined' && MODAL_DATA_I18N[currentLang]) || null;
  const localized = i18nPack && i18nPack[key];
  const base = localized || ((typeof MODAL_DATA !== 'undefined' && MODAL_DATA[key]) || null);
  if (!base) return null;

  let body = base.body || '';
  // Avoid duplicate link blocks when English/i18n HTML already embeds .modal-links
  // (e.g. prac_transport, tip_parks). Section links still append for keys that lack them.
  const hasInlineLinks = /class=["']modal-links["']/.test(body);

  if (key && key.indexOf('dest_') === 0) {
    const destId = key.slice(5);
    body += buildDestLinksHtml(destId);
  } else if (!hasInlineLinks) {
    // Strip duplicate tool-only CTAs when we inject a richer link list that includes the same tools
    const sectionHtml = buildSectionLinksHtml(key);
    if (sectionHtml) {
      body = body.replace(/<p class=["']modal-tool-cta["']>[\s\S]*?<\/p>/g, '');
      body += sectionHtml;
    }
  }

  return { tag: base.tag, title: base.title, body: body };
}

// Tool / external links inside tip & practical cards must not open the modal
document.querySelectorAll('.guide-tool-link').forEach((link) => {
  link.addEventListener('click', (e) => { e.stopPropagation(); });
});

document.querySelectorAll('[data-modal]').forEach(el => {
  el.addEventListener('click', (e) => {
    if (e.target && e.target.closest && e.target.closest('.guide-tool-link')) return;
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
