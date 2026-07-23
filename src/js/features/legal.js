'use strict';
/* USA Travel Guide — features/legal.js
   Classic non-module script. Shared global scope with other src/js scripts.
   Canonical load order: see header of src/js/app.js
*/

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
  const uiDict = getI18nDict(lang);
  const otherLabel = (uiDict && uiDict[otherKey])
    || (lang === 'en' ? (kind === 'privacy' ? 'Terms of Use' : 'Privacy Policy')
      : (window.LEGAL_I18N[kind === 'privacy' ? 'terms' : 'privacy'][lang] || {}).title)
    || (kind === 'privacy' ? 'Terms of Use' : 'Privacy Policy');
  const backLabel = (uiDict && uiDict['gallery.backToGuide'])
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
