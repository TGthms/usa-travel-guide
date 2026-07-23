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
  // modal-content.js only loads on the main guide; other pages must not throw.
  const i18nPack = (typeof MODAL_DATA_I18N !== 'undefined' && MODAL_DATA_I18N[currentLang]) || null;
  const localized = i18nPack && i18nPack[key];
  const base = localized || ((typeof MODAL_DATA !== 'undefined' && MODAL_DATA[key]) || null);
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
