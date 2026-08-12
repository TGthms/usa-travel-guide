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

function scrollLegalPageToTop() {
  try {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    html.classList.add('scroll-instant');
    if (typeof window.scrollTo === 'function') {
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
      catch (e1) { window.scrollTo(0, 0); }
    }
    html.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    html.style.scrollBehavior = prev;
    html.classList.remove('scroll-instant');
  } catch (e) { /* ignore */ }
}

function renderLegalPage(lang, opts) {
  const kind = getLegalPageKind();
  const root = document.getElementById('legalDoc');
  if (!kind || !root) return;
  const pack = (typeof window.LEGAL_I18N !== 'undefined' && window.LEGAL_I18N[kind]) || null;
  if (!pack) return;
  const data = pack[lang] || pack.en;
  if (!data) return;
  const y = (s) => withCopyrightYear(s);
  // Keep place when switching language mid-read; only pin top on first paint / forced.
  const pinTop = !opts || opts.scrollTop !== false;
  const prevY = pinTop ? 0 : (window.scrollY || document.documentElement.scrollTop || 0);

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

  if (pinTop) {
    scrollLegalPageToTop();
    requestAnimationFrame(scrollLegalPageToTop);
  } else if (prevY > 0) {
    try { window.scrollTo(0, prevY); } catch (e) { /* ignore */ }
  }
}

// Footer / history must not reopen Privacy/Terms mid-document.
(function initLegalPageScroll() {
  if (!document.body.classList.contains('page-legal')) return;
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (e) { /* ignore */ }
  scrollLegalPageToTop();
  window.addEventListener('load', scrollLegalPageToTop, { once: true });
  window.addEventListener('pageshow', function (ev) {
    // bfcache restore can re-apply an old scroll offset
    if (ev && ev.persisted) scrollLegalPageToTop();
  });
})();

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



document.addEventListener('usa-travel:prefs', function (e) {
  if (!document.getElementById('legalDoc')) return;
  const type = e && e.detail && e.detail.type;
  const lang = (e.detail && e.detail.lang) || currentLang;
  if (type === 'ready') {
    renderLegalPage(lang, { scrollTop: true });
    updateLegalLangSwitch(lang);
    return;
  }
  if (type !== 'lang') return;
  renderLegalPage(lang, { scrollTop: false });
  updateLegalLangSwitch(lang);
});
