'use strict';
/* USA Travel Guide — app.js
   Classic non-module script. Shared global scope with other src/js scripts.
   Canonical load order: see header of src/js/app.js
*/

/* ═══════════════════════════════════════════════════════════════════════
   USA Travel Guide — application boot

   Companion data (load before these runtime scripts):
   · src/js/data/i18n.js          → window.I18N          (all pages)
   · src/js/data/fun-facts.js     → window.FUN_FACTS     (index)
   · src/js/data/intro-gallery.js → window.INTRO_GALLERY_PHOTOS (index)
   · src/js/data/modal-content.js → window.MODAL_DATA*   (index)
   · src/js/data/dest-links.js    → window.DEST_*        (index)
   · src/js/data/legal-i18n.js    → window.LEGAL_I18N    (privacy/terms)

   Runtime load order (classic deferred scripts, shared global scope):
   1. core/env.js
   2. core/runtime.js      prefs · i18n · chrome · settings
   3. features/tools.js    (tools hub + currency/clock/tip/drive/emergency)
   4. features/weather/*   (tools-weather only — ns/sky/charts/alerts/data/app)
   5. features/home.js     (index)
   6. features/legal.js    (privacy / terms)
   7. features/gallery.js  (gallery page)
   8. app.js               this file — apply saved prefs + final init

   Not every page loads every feature script; each feature no-ops when its
   root DOM is missing. Kept as non-module scripts so window.* hooks remain
   available (e.g. toggleFavorite, closeWeatherDetail, refreshWeatherUi).
   ═══════════════════════════════════════════════════════════════════════ */

/* Apply saved preferences once all feature scripts have registered. */
if (typeof initFunFacts === 'function') initFunFacts();
if (typeof applyLanguage === 'function') applyLanguage(currentLang);
if (typeof applyUnits === 'function') applyUnits();

// Legal body depends on LEGAL_I18N (loaded before runtime) — ensure first paint at top
if (document.body.classList.contains('page-legal')) {
  if (typeof renderLegalPage === 'function') renderLegalPage(currentLang, { scrollTop: true });
  if (typeof updateLegalLangSwitch === 'function') updateLegalLangSwitch(currentLang);
}
