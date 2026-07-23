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
   · src/js/data/modal-content.js → window.MODAL_DATA*   (index)
   · src/js/data/dest-links.js    → window.DEST_*        (index)
   · src/js/data/legal-i18n.js    → window.LEGAL_I18N    (privacy/terms)

   Runtime load order (classic deferred scripts, shared global scope):
   1. core/env.js
   2. core/runtime.js      prefs · i18n · chrome · settings
   3. features/tools.js    (no-op off tools page)
   4. features/home.js     (no-op off index)
   5. features/legal.js    (no-op off legal pages)
   6. features/gallery.js  (no-op off gallery / without #galleryGrid)
   7. app.js               this file — apply saved prefs + final init

   Kept as non-module scripts so window.toggleFavorite and similar globals
   remain available to any legacy handlers.
   ═══════════════════════════════════════════════════════════════════════ */

/* Apply saved preferences once all feature scripts have registered. */
if (typeof initFunFacts === 'function') initFunFacts();
if (typeof applyLanguage === 'function') applyLanguage(currentLang);
if (typeof applyUnits === 'function') applyUnits();

// Legal body depends on LEGAL_I18N (loaded before runtime) — ensure first paint
if (document.body.classList.contains('page-legal')) {
  if (typeof renderLegalPage === 'function') renderLegalPage(currentLang);
  if (typeof updateLegalLangSwitch === 'function') updateLegalLangSwitch(currentLang);
}
