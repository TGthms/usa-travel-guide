'use strict';
/* USA Travel Guide — cross-page return context (scroll + back label)
   Stamp outbound navigations from Guide / Tools hub; restore on return.
   Load after env.js; safe on all pages.

   Rules:
     · Tools hub (tools.html) always “Back to the Guide” — never “Back to Tools”
     · Tool mini-apps: Guide deep-link → Guide; hub → Tools
     · Gallery / legal: same stamp; default Guide
     · Header + footer home chrome stay in sync
*/

(function () {
  var KEY = 'usa-travel-return-v1';
  var MAX_AGE_MS = 2 * 60 * 60 * 1000;

  function pathOf(href) {
    try {
      var u = new URL(href, location.href);
      return u.pathname.replace(/\\/g, '/');
    } catch (e) {
      return String(href || '');
    }
  }

  function fileOf(p) {
    p = pathOf(p);
    var parts = p.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  function isGuidePath(p) {
    p = p || '';
    return /\/index\.html$/i.test(p) || p === '/' || /\/$/.test(p);
  }

  /** Hub only — not tools-currency.html etc. */
  function isToolsHubPath(p) {
    return /\/tools\.html$/i.test(p || '') || fileOf(p).toLowerCase() === 'tools.html';
  }

  /** tools-*.html mini-apps only (excludes tools.html hub) */
  function isToolMiniAppPath(p) {
    return /\/tools-[a-z0-9]+\.html$/i.test(p || '');
  }

  function isGalleryPath(p) {
    return /\/gallery\.html$/i.test(p || '');
  }

  function isLegalPath(p) {
    return /\/(privacy|terms)\.html$/i.test(p || '');
  }

  /** Destinations that receive a return stamp */
  function isStampableDest(p) {
    return isToolMiniAppPath(p)
      || isToolsHubPath(p)
      || isGalleryPath(p)
      || isLegalPath(p);
  }

  function pageKindFromPath(p) {
    if (isToolsHubPath(p)) return 'tools';
    if (isGuidePath(p)) return 'guide';
    return 'other';
  }

  function readReturn() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.ts || Date.now() - o.ts > MAX_AGE_MS) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeReturn(obj) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) { /* private mode */ }
  }

  function dictText(key, fallback) {
    var lang = typeof currentLang === 'string' ? currentLang : 'en';
    var dict = typeof getI18nDict === 'function' ? getI18nDict(lang) : null;
    if (dict && dict[key]) return dict[key];
    return fallback;
  }

  function stampOutbound(targetHref) {
    var fromPath = pathOf(location.href);
    var kind = pageKindFromPath(fromPath);
    if (kind === 'other') return;
    writeReturn({
      from: fromPath,
      href: fileOf(fromPath) || (kind === 'guide' ? 'index.html' : 'tools.html'),
      scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
      label: kind === 'tools' ? 'tools' : 'guide',
      ts: Date.now(),
      to: pathOf(targetHref)
    });
  }

  /** Capture clicks on internal links leaving guide or tools hub */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
    var dest = pathOf(href);
    var here = pathOf(location.href);
    if (dest === here) return;
    var kind = pageKindFromPath(here);
    if (kind === 'other') return;
    if (!isStampableDest(dest)) return;

    // Guide → hub / mini / gallery / legal
    if (kind === 'guide') {
      stampOutbound(href);
      return;
    }
    // Tools hub → mini / gallery / legal (not hub self)
    if (kind === 'tools' && (isToolMiniAppPath(dest) || isGalleryPath(dest) || isLegalPath(dest))) {
      stampOutbound(href);
    }
  }, true);

  function setChromeLink(el, href, i18nKey, enLabel) {
    if (!el) return;
    el.setAttribute('href', href);
    el.setAttribute('data-i18n-aria', i18nKey);
    el.setAttribute('aria-label', dictText(i18nKey, enLabel));
    var labelEl = el.querySelector('.gallery-app-back-label')
      || el.querySelector('[data-i18n]')
      || null;
    if (labelEl) {
      labelEl.setAttribute('data-i18n', i18nKey);
      labelEl.textContent = dictText(i18nKey, enLabel);
    }
  }

  function applyGuideChrome(back, footer, i18nKey) {
    var key = i18nKey || 'gallery.backToGuide';
    var en = 'Back to the Guide';
    setChromeLink(back, 'index.html', key, en);
    if (footer) setChromeLink(footer, 'index.html', key, en);
  }

  function applyToolsChrome(back, footer) {
    setChromeLink(back, 'tools.html', 'tools.backToTools', 'Back to Tools');
    if (footer) setChromeLink(footer, 'tools.html', 'tools.backToTools', 'Back to Tools');
  }

  function applyReturnChrome() {
    var back = document.querySelector('a.gallery-app-back');
    var footer = document.querySelector('a.gallery-app-footer-home');
    if (!back && !footer) return;

    var here = pathOf(location.href);

    // ── Tools hub: always Back to the Guide (never “Back to Tools”) ──
    if (isToolsHubPath(here)) {
      applyGuideChrome(back, footer, 'tools.backToGuide');
      return;
    }

    var ret = readReturn();

    // Tool mini-apps: contextual; default markup is Tools if no / other stamp
    if (isToolMiniAppPath(here)) {
      if (ret && ret.label === 'guide') {
        applyGuideChrome(back, footer, 'gallery.backToGuide');
      } else if (ret && ret.label === 'tools') {
        applyToolsChrome(back, footer);
      }
      // else: leave HTML defaults (Back to Tools)
      return;
    }

    // Gallery / legal: default Guide; tools stamp → Tools
    if (isGalleryPath(here) || isLegalPath(here)) {
      if (ret && ret.label === 'tools') {
        applyToolsChrome(back, footer);
      } else if (ret && ret.label === 'guide') {
        applyGuideChrome(back, footer, 'gallery.backToGuide');
      }
      // else markup default Guide
    }
  }

  function restoreGuideScroll() {
    if (!isGuidePath(pathOf(location.href))) return;
    var ret = readReturn();
    if (!ret || ret.label !== 'guide' || typeof ret.scrollY !== 'number') return;
    if (!ret.scrollY) return;
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch (e) {}
    var y = ret.scrollY;
    try {
      ret.scrollY = 0;
      writeReturn(ret);
    } catch (e2) {}
    var apply = function () {
      window.scrollTo(0, y);
    };
    requestAnimationFrame(function () {
      requestAnimationFrame(apply);
    });
    window.addEventListener('load', function () {
      window.scrollTo(0, y);
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyReturnChrome();
      restoreGuideScroll();
    });
  } else {
    applyReturnChrome();
    restoreGuideScroll();
  }

  window.addEventListener('load', function () {
    applyReturnChrome();
  });

  window.__usaTravelNavReturn = {
    stamp: stampOutbound,
    read: readReturn,
    apply: applyReturnChrome
  };
})();
