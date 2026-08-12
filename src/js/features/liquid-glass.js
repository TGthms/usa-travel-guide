'use strict';
/* USA Travel Guide — features/liquid-glass.js
   True WebGL Liquid Glass (@ybouane/liquidglass), demo-faithful.

   Diagnosis-driven architecture:
   - Never make #settings itself a glass host (library forces overflow:visible
     and buries the canvas at z-index:-1 under opaque cards → “broken panel,
     no glass”).
   - One in-panel FX root: photographic mirror + sliding glass indicators
     (same pattern as #hero-root + #glass-tab-indicator on the demo site).
   - Indicators sit UNDER the settings-grid; tracks/buttons stay transparent
     so the refractive pill is visible and labels stay on top.
   - CSS frosted panel is the shell; WebGL is the liquid material on switchers.
*/

(function () {
  var PREF_ON = 'usa-travel-liquid-glass';
  var PREF_TINT = 'usa-travel-liquid-glass-tint';
  var VENDOR_URL = 'vendor/liquidglass/index.js';

  var liquidGlassEnabled = false;
  var liquidGlassTint = 0.35;
  var liquidGlassMode = 'off';
  var liquidGlassLib = null;
  var liquidGlassInstances = [];
  var liquidGlassImporting = null;
  var liquidGlassBooted = false;

  /** @type {null | {
   *   root: HTMLElement,
   *   mirror: HTMLCanvasElement,
   *   grid: HTMLElement,
   *   gridParent: Node,
   *   gridNext: ChildNode | null,
   *   indicators: Array<{ group: HTMLElement, indicator: HTMLElement }>,
   *   instance: any,
   *   panel: HTMLElement
   * }} */
  var settingsFx = null;
  var pageFxList = [];
  var resizeTimer = null;
  var mutationBound = false;

  function storageGet(key, fallback) {
    if (typeof safeStorage !== 'undefined' && safeStorage.get) {
      return safeStorage.get(key, fallback);
    }
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function storageSet(key, value) {
    if (typeof safeStorage !== 'undefined' && safeStorage.set) {
      safeStorage.set(key, value);
      return;
    }
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function loadPrefs() {
    liquidGlassEnabled = storageGet(PREF_ON, 'off') === 'on';
    var t = parseFloat(storageGet(PREF_TINT, '0.35'));
    if (isNaN(t)) t = 0.35;
    liquidGlassTint = Math.min(1, Math.max(0, t));
  }

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  function isExtremelySmallScreen() {
    if (typeof ENV !== 'undefined' && ENV.constrained) return true;
    try {
      var w = window.innerWidth || 0;
      var h = window.innerHeight || 0;
      return (w > 0 && w <= 320) || (h > 0 && h <= 280);
    } catch (e) {
      return false;
    }
  }

  function isFileProtocol() {
    try { return location.protocol === 'file:'; } catch (e) { return false; }
  }

  function canUseWebGL() {
    return !isFileProtocol() && hasWebGL();
  }

  function qualityTier() {
    var mem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;
    var mobile = typeof ENV !== 'undefined' && ENV.mobile;
    if (mem !== null && mem <= 2) return 'balanced';
    if (mobile) return 'balanced';
    return 'full';
  }

  /** Demo-faithful configs. Tint only gently shifts clear → frosted. */
  function tintToConfig(tint, kind) {
    var t = Math.min(1, Math.max(0, tint));
    if (kind === 'indicator') {
      // Exact spirit of #glass-tab-indicator on liquid-glass.ybouane.com
      return {
        cornerRadius: 12,
        zRadius: 14,
        blurAmount: 0.02 + t * 0.18,
        refraction: 1.15 - t * 0.25,
        chromAberration: 0.1 * (1 - t * 0.35),
        edgeHighlight: 0.22,
        specular: 0.28,
        fresnel: 1.1,
        brightness: -0.02 - t * 0.1,
        saturation: 0.05 + t * 0.06,
        shadowOpacity: 0.28,
        shadowSpread: 12,
        floating: false,
        button: false,
        bevelMode: 0
      };
    }
    if (kind === 'button') {
      return {
        button: true,
        cornerRadius: 26,
        zRadius: 24,
        blurAmount: 0.12 + t * 0.2,
        refraction: 1.0 - t * 0.2,
        chromAberration: 0.06,
        edgeHighlight: 0.14,
        specular: 0.2,
        fresnel: 1.05,
        brightness: -0.05 - t * 0.08,
        saturation: 0.04,
        shadowOpacity: 0.22,
        floating: false,
        bevelMode: 0
      };
    }
    return {
      cornerRadius: 20,
      zRadius: 26,
      blurAmount: 0.2 + t * 0.25,
      refraction: 0.85 - t * 0.2,
      chromAberration: 0.05,
      edgeHighlight: 0.1,
      specular: 0.15,
      fresnel: 1,
      brightness: -0.08 - t * 0.12,
      saturation: t * 0.06,
      shadowOpacity: 0.24,
      floating: false,
      button: false,
      bevelMode: 0
    };
  }

  function setHostConfig(el, kind) {
    if (!el) return;
    try {
      el.dataset.config = JSON.stringify(tintToConfig(liquidGlassTint, kind || 'panel'));
    } catch (e) { /* ignore */ }
  }

  function applyCssTint() {
    try {
      document.documentElement.style.setProperty('--lg-tint', String(liquidGlassTint));
    } catch (e) { /* ignore */ }
  }

  function setDomMode(mode) {
    liquidGlassMode = mode;
    try {
      if (mode === 'off') {
        document.documentElement.removeAttribute('data-liquid-glass');
        document.documentElement.style.removeProperty('--lg-tint');
      } else {
        document.documentElement.setAttribute('data-liquid-glass', mode);
        applyCssTint();
      }
    } catch (e) { /* ignore */ }
  }

  function importLib() {
    if (liquidGlassLib) return Promise.resolve(liquidGlassLib);
    if (liquidGlassImporting) return liquidGlassImporting;
    liquidGlassImporting = import(
      /* webpackIgnore: true */
      new URL(VENDOR_URL, window.location.href).href
    ).then(function (mod) {
      liquidGlassLib = mod;
      liquidGlassImporting = null;
      return mod;
    }).catch(function (err) {
      liquidGlassImporting = null;
      throw err;
    });
    return liquidGlassImporting;
  }

  function destroyInstances() {
    for (var i = 0; i < liquidGlassInstances.length; i++) {
      try {
        if (liquidGlassInstances[i] && liquidGlassInstances[i].destroy) {
          liquidGlassInstances[i].destroy();
        }
      } catch (e) { /* ignore */ }
    }
    liquidGlassInstances = [];
    try {
      document.querySelectorAll('.lg-glass-host').forEach(function (el) {
        el.classList.remove('lg-glass-host');
        el.removeAttribute('data-config');
      });
      document.querySelectorAll('.lg-root').forEach(function (el) {
        el.classList.remove('lg-root');
      });
    } catch (e2) { /* ignore */ }
  }

  function notifyDirty(el) {
    liquidGlassInstances.forEach(function (inst) {
      try {
        if (inst && inst.markChanged) inst.markChanged(el);
      } catch (e) { /* ignore */ }
    });
  }

  async function startRoot(root, glasses, kindMap) {
    if (!root || root === document.body || root === document.documentElement) return null;
    if (!glasses || !glasses.length || !liquidGlassLib || !liquidGlassLib.LiquidGlass) return null;

    var valid = [];
    for (var i = 0; i < glasses.length; i++) {
      if (glasses[i] && glasses[i].parentNode === root) valid.push(glasses[i]);
    }
    if (!valid.length) return null;

    valid.forEach(function (g) {
      var kind = (kindMap && kindMap.get(g)) || 'indicator';
      setHostConfig(g, kind);
      g.classList.add('lg-glass-host');
    });

    try {
      var cs = window.getComputedStyle(root);
      if (cs.position === 'static') root.style.position = 'relative';
      root.classList.add('lg-root');
      var inst = await liquidGlassLib.LiquidGlass.init({
        root: root,
        glassElements: valid,
        defaults: tintToConfig(liquidGlassTint, 'indicator')
      });
      liquidGlassInstances.push(inst);
      return inst;
    } catch (e) {
      console.warn('[liquid-glass] init failed', e);
      root.classList.remove('lg-root');
      valid.forEach(function (g) {
        g.classList.remove('lg-glass-host');
        g.removeAttribute('data-config');
      });
      return null;
    }
  }

  /* ── Photographic mirror (must have detail or refraction is invisible) ── */

  function findHeroMedia() {
    return document.querySelector(
      '#hero video, #hero img, .hero video, .hero img, .hero-media img, .hero-photo, .hero-bg'
    );
  }

  function drawCover(ctx, media, boxW, boxH) {
    var nw = media.videoWidth || media.naturalWidth || 0;
    var nh = media.videoHeight || media.naturalHeight || 0;
    if (!nw || !nh) return false;
    var scale = Math.max(boxW / nw, boxH / nh);
    var sw = nw * scale;
    var sh = nh * scale;
    ctx.drawImage(media, (boxW - sw) / 2, (boxH - sh) / 2, sw, sh);
    return true;
  }

  function paintPhotographicMirror(canvas, w, h) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.floor(w * dpr));
    canvas.height = Math.max(2, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Base sky gradient (always has some structure)
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#6eb6ff');
    g.addColorStop(0.35, '#3d7ab5');
    g.addColorStop(0.65, '#1a3a5c');
    g.addColorStop(1, '#0c1828');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    var media = findHeroMedia();
    var drew = false;
    try {
      if (media && media.tagName === 'VIDEO' && media.readyState >= 2) {
        drew = drawCover(ctx, media, w, h);
      } else if (media && media.tagName === 'IMG' && media.complete && media.naturalWidth) {
        drew = drawCover(ctx, media, w, h);
      }
    } catch (e) { /* cross-origin */ }

    if (!drew) {
      // High-contrast synthetic scene so refraction is still obvious
      var r1 = ctx.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.3, h * 0.25, w * 0.6);
      r1.addColorStop(0, 'rgba(255,220,120,0.85)');
      r1.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = r1;
      ctx.fillRect(0, 0, w, h);
      var r2 = ctx.createRadialGradient(w * 0.75, h * 0.7, 0, w * 0.75, h * 0.7, w * 0.5);
      r2.addColorStop(0, 'rgba(80,200,255,0.7)');
      r2.addColorStop(1, 'rgba(80,200,255,0)');
      ctx.fillStyle = r2;
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + Math.random() * 0.06) + ')';
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 12 + Math.random() * 30, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Light vignette so UI text stays readable through clear glass
    var vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  /* ── Switcher helpers ── */

  function activeBtn(group) {
    return group.querySelector(
      '.pill-btn.active, .dest-filter-btn.active, .gallery-filter.active, .tool-seg-btn.active, button.active'
    ) || group.querySelector('.pill-btn, .dest-filter-btn, .gallery-filter, .tool-seg-btn, button');
  }

  function syncIndicator(root, group, indicator, animate) {
    if (!root || !group || !indicator) return;
    var btn = activeBtn(group);
    if (!btn) {
      indicator.style.opacity = '0';
      return;
    }
    var rootRect = root.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    // Hide if not visible in viewport of root (scrolled away)
    if (btnRect.bottom < rootRect.top + 2 || btnRect.top > rootRect.bottom - 2) {
      indicator.style.opacity = '0';
      return;
    }
    indicator.style.opacity = '1';
    var x = btnRect.left - rootRect.left;
    var y = btnRect.top - rootRect.top;
    if (!animate) indicator.style.transition = 'none';
    indicator.style.width = Math.max(8, btnRect.width) + 'px';
    indicator.style.height = Math.max(8, btnRect.height) + 'px';
    indicator.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    if (!animate) {
      void indicator.offsetHeight;
      indicator.style.transition = '';
    }
  }

  function isSettingsOpen() {
    return !!(document.body && document.body.classList.contains('settings-open'));
  }

  /* ── Settings FX: single root inside the panel ── */

  function teardownSettingsFx() {
    if (!settingsFx) return;
    try {
      var panel = settingsFx.panel;
      if (panel) {
        panel.removeEventListener('scroll', onSettingsScroll);
        panel.querySelectorAll('.pill-btn').forEach(function (b) {
          b.removeEventListener('click', onSettingsPillClick);
        });
        panel.querySelectorAll('.pill-group, .units-row').forEach(function (g) {
          g.classList.remove('lg-switch-group');
        });
      }
      // Move grid back
      if (settingsFx.grid && settingsFx.gridParent) {
        settingsFx.gridParent.insertBefore(settingsFx.grid, settingsFx.gridNext);
      }
      if (settingsFx.root && settingsFx.root.parentNode) {
        settingsFx.root.parentNode.removeChild(settingsFx.root);
      }
    } catch (e) { /* ignore */ }
    settingsFx = null;
  }

  function onSettingsPillClick() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!settingsFx) return;
        settingsFx.indicators.forEach(function (item) {
          syncIndicator(settingsFx.root, item.group, item.indicator, true);
        });
        notifyDirty();
      });
    });
  }

  function onSettingsScroll() {
    if (!settingsFx) return;
    settingsFx.indicators.forEach(function (item) {
      syncIndicator(settingsFx.root, item.group, item.indicator, false);
    });
    notifyDirty();
  }

  async function ensureSettingsFx() {
    if (!liquidGlassEnabled || !canUseWebGL() || !isSettingsOpen()) return null;

    var panel = document.getElementById('settings');
    if (!panel) return null;

    if (settingsFx && settingsFx.root && settingsFx.root.isConnected) {
      var r = settingsFx.root.getBoundingClientRect();
      paintPhotographicMirror(settingsFx.mirror, Math.max(r.width, 320), Math.max(r.height, 240));
      settingsFx.indicators.forEach(function (item) {
        syncIndicator(settingsFx.root, item.group, item.indicator, false);
      });
      notifyDirty(settingsFx.mirror);
      return settingsFx.instance;
    }

    teardownSettingsFx();

    var grid = panel.querySelector('.settings-grid');
    if (!grid) return null;

    var root = document.createElement('div');
    root.id = 'lg-settings-fx';
    root.className = 'lg-settings-fx';

    var mirror = document.createElement('canvas');
    mirror.className = 'lg-settings-fx-mirror';
    mirror.setAttribute('aria-hidden', 'true');

    var gridParent = grid.parentNode;
    var gridNext = grid.nextSibling;
    gridParent.insertBefore(root, grid);
    root.appendChild(mirror);
    root.appendChild(grid);

    var groups = grid.querySelectorAll('.pill-group, .units-row');
    var indicators = [];
    var kindMap = new Map();

    groups.forEach(function (group) {
      group.classList.add('lg-switch-group');
      var ind = document.createElement('div');
      ind.className = 'lg-switch-indicator';
      ind.setAttribute('aria-hidden', 'true');
      root.appendChild(ind);
      kindMap.set(ind, 'indicator');
      indicators.push({ group: group, indicator: ind });
    });

    settingsFx = {
      root: root,
      mirror: mirror,
      grid: grid,
      gridParent: gridParent,
      gridNext: gridNext,
      indicators: indicators,
      instance: null,
      panel: panel
    };

    // Size mirror to fx root
    var rect = root.getBoundingClientRect();
    paintPhotographicMirror(mirror, Math.max(rect.width, 400), Math.max(rect.height, 300));
    mirror.style.width = '100%';
    mirror.style.height = '100%';

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    } catch (e) { /* ignore */ }

    // Pre-size indicators (demo does this before init)
    indicators.forEach(function (item) {
      syncIndicator(root, item.group, item.indicator, false);
    });

    var inst = await startRoot(
      root,
      indicators.map(function (i) { return i.indicator; }),
      kindMap
    );
    settingsFx.instance = inst;

    panel.querySelectorAll('.pill-btn').forEach(function (b) {
      b.addEventListener('click', onSettingsPillClick);
    });
    panel.addEventListener('scroll', onSettingsScroll, { passive: true });

    // Panel must keep scrolling — never a glass host
    panel.style.overflow = 'auto';

    setTimeout(function () {
      if (!settingsFx) return;
      settingsFx.indicators.forEach(function (item) {
        syncIndicator(settingsFx.root, item.group, item.indicator, false);
      });
      notifyDirty();
    }, 100);
    setTimeout(function () {
      if (!settingsFx) return;
      var rr = settingsFx.root.getBoundingClientRect();
      paintPhotographicMirror(settingsFx.mirror, Math.max(rr.width, 400), Math.max(rr.height, 300));
      notifyDirty(settingsFx.mirror);
    }, 400);

    return inst;
  }

  /* ── Page-level switchers (filters, etc.) — few local roots ── */

  function teardownPageFx() {
    while (pageFxList.length) {
      var fx = pageFxList.pop();
      try {
        if (fx.unbind) fx.unbind();
        if (fx.group && fx.root && fx.root.parentNode) {
          fx.root.parentNode.insertBefore(fx.group, fx.root);
          fx.group.classList.remove('lg-switch-group');
          fx.root.parentNode.removeChild(fx.root);
        }
      } catch (e) { /* ignore */ }
    }
  }

  function upgradePageSwitcher(group) {
    if (!group || group.closest('#settings, .settings-panel, .lg-settings-fx, .lg-switch-root')) return null;
    if (group.dataset.lgPageFx === '1') return null;

    var parent = group.parentNode;
    if (!parent) return null;

    var root = document.createElement('div');
    root.className = 'lg-switch-root';
    var env = document.createElement('canvas');
    env.className = 'lg-switch-env';
    env.setAttribute('aria-hidden', 'true');
    var ind = document.createElement('div');
    ind.className = 'lg-switch-indicator';
    ind.setAttribute('aria-hidden', 'true');

    parent.insertBefore(root, group);
    root.appendChild(env);
    root.appendChild(group);
    root.appendChild(ind);
    group.dataset.lgPageFx = '1';
    group.classList.add('lg-switch-group');

    function paint() {
      var r = root.getBoundingClientRect();
      paintPhotographicMirror(env, Math.max(r.width, 80), Math.max(r.height, 40));
      env.style.width = '100%';
      env.style.height = '100%';
    }
    paint();

    function onClick() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          syncIndicator(root, group, ind, true);
          notifyDirty(ind);
        });
      });
    }
    group.querySelectorAll('button, .pill-btn, .dest-filter-btn, .gallery-filter, .tool-seg-btn').forEach(function (b) {
      b.addEventListener('click', onClick);
    });

    var fx = {
      root: root,
      group: group,
      indicator: ind,
      env: env,
      paint: paint,
      unbind: function () {
        group.querySelectorAll('button, .pill-btn, .dest-filter-btn, .gallery-filter, .tool-seg-btn').forEach(function (b) {
          b.removeEventListener('click', onClick);
        });
        delete group.dataset.lgPageFx;
      }
    };
    pageFxList.push(fx);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        syncIndicator(root, group, ind, false);
      });
    });
    return fx;
  }

  async function initPageSwitchers() {
    var selectors = ['#destFilterBar', '.gallery-filters', '.tool-seg'];
    var nodes = [];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (n) { nodes.push(n); });
    });
    var limit = qualityTier() === 'balanced' ? 1 : 3;
    var started = 0;
    for (var i = 0; i < nodes.length && started < limit; i++) {
      var fx = upgradePageSwitcher(nodes[i]);
      if (!fx) continue;
      var km = new Map();
      km.set(fx.indicator, 'indicator');
      // Env must be non-glass sibling; indicator is glass. Put env first, then group, indicator already last — but group is between env and indicator. For capture, env + group are non-glass. Indicator must be direct child — yes.
      // Problem: startRoot only glasses indicator. Group is between env and indicator - good.
      // But indicator is AFTER group in DOM; for z-index CSS puts indicator under labels.
      var inst = await startRoot(fx.root, [fx.indicator], km);
      if (inst) started++;
    }

    // Gallery enter over photos
    if (qualityTier() === 'full' && started < limit + 1) {
      var teaser = document.querySelector('.gallery-teaser');
      if (teaser) {
        var btns = [];
        var km2 = new Map();
        for (var c = teaser.firstElementChild; c; c = c.nextElementSibling) {
          if (c.classList && (c.classList.contains('gallery-enter-btn') || c.classList.contains('btn-primary'))) {
            btns.push(c);
            km2.set(c, 'button');
          }
        }
        if (btns.length) {
          var ti = await startRoot(teaser, btns, km2);
          if (ti) started++;
        }
      }
    }
    return started;
  }

  function updateAllConfigs() {
    applyCssTint();
    document.querySelectorAll('.lg-glass-host').forEach(function (el) {
      var kind = el.classList.contains('lg-switch-indicator') ? 'indicator' : 'panel';
      if (el.classList.contains('gallery-enter-btn') || el.classList.contains('btn-primary')) kind = 'button';
      setHostConfig(el, kind);
    });
    notifyDirty();
  }

  function updateSettingsUI() {
    var group = document.getElementById('liquidGlassSettingsGroup');
    if (!group) return;
    if (isExtremelySmallScreen()) {
      group.hidden = true;
      return;
    }
    group.hidden = false;
    document.querySelectorAll('#liquidGlassPillGroup .pill-btn').forEach(function (p) {
      var on = p.getAttribute('data-liquid-glass-val') === 'on';
      p.classList.toggle('active', liquidGlassEnabled ? on : !on);
    });
    var wrap = document.getElementById('liquidGlassTintWrap');
    if (wrap) wrap.classList.toggle('is-visible', liquidGlassEnabled);
    var range = document.getElementById('liquidGlassTint');
    if (range) range.value = String(Math.round(liquidGlassTint * 100));
  }

  function fullTeardown() {
    destroyInstances();
    teardownSettingsFx();
    teardownPageFx();
  }

  async function applyLiquidGlassState() {
    if (isExtremelySmallScreen()) {
      liquidGlassEnabled = false;
      fullTeardown();
      setDomMode('off');
      updateSettingsUI();
      return liquidGlassMode;
    }

    if (!liquidGlassEnabled) {
      fullTeardown();
      setDomMode('off');
      updateSettingsUI();
      return liquidGlassMode;
    }

    applyCssTint();
    setDomMode('fallback');
    updateSettingsUI();

    if (!canUseWebGL()) {
      setDomMode('fallback');
      return liquidGlassMode;
    }

    try {
      await importLib();
      destroyInstances();
      // Keep DOM wrappers if re-applying; rebuild cleanly
      teardownSettingsFx();
      teardownPageFx();

      var n = await initPageSwitchers();
      if (isSettingsOpen()) {
        var s = await ensureSettingsFx();
        if (s) n++;
      }

      setDomMode(liquidGlassInstances.length > 0 ? 'on' : 'fallback');
      setTimeout(function () { notifyDirty(); }, 120);
      setTimeout(function () { notifyDirty(); }, 500);
    } catch (err) {
      console.warn('[liquid-glass] fallback:', err && err.message ? err.message : err);
      destroyInstances();
      setDomMode('fallback');
    }
    updateSettingsUI();
    return liquidGlassMode;
  }

  function setLiquidGlassEnabled(on, opts) {
    opts = opts || {};
    liquidGlassEnabled = !!on;
    if (opts.persist !== false) storageSet(PREF_ON, liquidGlassEnabled ? 'on' : 'off');
    return applyLiquidGlassState();
  }

  function setLiquidGlassTint(t, opts) {
    opts = opts || {};
    var n = typeof t === 'number' ? t : parseFloat(t);
    if (isNaN(n)) n = 0.35;
    liquidGlassTint = Math.min(1, Math.max(0, n));
    if (opts.persist !== false) storageSet(PREF_TINT, String(liquidGlassTint));
    applyCssTint();
    if (liquidGlassEnabled) {
      updateAllConfigs();
      if (settingsFx) {
        var r = settingsFx.root.getBoundingClientRect();
        paintPhotographicMirror(settingsFx.mirror, Math.max(r.width, 400), Math.max(r.height, 300));
        notifyDirty(settingsFx.mirror);
      }
      pageFxList.forEach(function (fx) {
        if (fx.paint) fx.paint();
      });
    }
    updateSettingsUI();
  }

  function bindSettings() {
    document.querySelectorAll('#liquidGlassPillGroup .pill-btn').forEach(function (p) {
      p.addEventListener('click', function () {
        setLiquidGlassEnabled(p.getAttribute('data-liquid-glass-val') === 'on');
      });
    });
    var range = document.getElementById('liquidGlassTint');
    if (range) {
      range.addEventListener('input', function () {
        setLiquidGlassTint((parseInt(range.value, 10) || 0) / 100, { persist: false });
      });
      range.addEventListener('change', function () {
        setLiquidGlassTint((parseInt(range.value, 10) || 0) / 100, { persist: true });
      });
    }
  }

  function onResize() {
    if (!liquidGlassEnabled) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (settingsFx) {
        var r = settingsFx.root.getBoundingClientRect();
        paintPhotographicMirror(settingsFx.mirror, Math.max(r.width, 400), Math.max(r.height, 300));
        settingsFx.indicators.forEach(function (item) {
          syncIndicator(settingsFx.root, item.group, item.indicator, false);
        });
      }
      pageFxList.forEach(function (fx) {
        if (fx.paint) fx.paint();
        syncIndicator(fx.root, fx.group, fx.indicator, false);
      });
      notifyDirty();
    }, 120);
  }

  async function onSettingsOpened() {
    if (!liquidGlassEnabled || !canUseWebGL()) return;
    try {
      await importLib();
      // Destroy page instances only if we need budget? Keep both — settings is one root.
      await ensureSettingsFx();
      setDomMode(liquidGlassInstances.length ? 'on' : 'fallback');
    } catch (e) {
      console.warn('[liquid-glass] settings fx failed', e);
    }
  }

  function onSettingsClosed() {
    if (!settingsFx) return;
    try {
      // Destroy all WebGL then rebuild page-only
      destroyInstances();
      teardownSettingsFx();
      if (liquidGlassEnabled && canUseWebGL()) {
        initPageSwitchers().then(function () {
          setDomMode(liquidGlassInstances.length ? 'on' : 'fallback');
        });
      }
    } catch (e) { /* ignore */ }
  }

  function observeSettingsBodyClass() {
    if (mutationBound || !document.body) return;
    mutationBound = true;
    var prev = document.body.classList.contains('settings-open');
    var mo = new MutationObserver(function () {
      var now = document.body.classList.contains('settings-open');
      if (now === prev) return;
      prev = now;
      if (now) onSettingsOpened();
      else onSettingsClosed();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('usa-travel-theme-change', function () {
    if (!liquidGlassEnabled) return;
    applyCssTint();
    if (settingsFx) {
      var r = settingsFx.root.getBoundingClientRect();
      paintPhotographicMirror(settingsFx.mirror, Math.max(r.width, 400), Math.max(r.height, 300));
      notifyDirty(settingsFx.mirror);
    }
    updateAllConfigs();
  });

  loadPrefs();
  if (liquidGlassEnabled) {
    setDomMode('fallback');
    applyCssTint();
  }

  function boot() {
    if (liquidGlassBooted) return;
    liquidGlassBooted = true;
    bindSettings();
    updateSettingsUI();
    observeSettingsBodyClass();
    window.addEventListener('resize', onResize);
    if (liquidGlassEnabled) applyLiquidGlassState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('pagehide', function () {
    if (liquidGlassEnabled) fullTeardown();
  });

  window.__usaTravelLiquidGlass = {
    isEnabled: function () { return liquidGlassEnabled; },
    getTint: function () { return liquidGlassTint; },
    getMode: function () { return liquidGlassMode; },
    setEnabled: setLiquidGlassEnabled,
    setTint: setLiquidGlassTint,
    refresh: function () {
      if (!liquidGlassEnabled) return Promise.resolve(liquidGlassMode);
      if (isSettingsOpen()) return onSettingsOpened();
      notifyDirty();
      return Promise.resolve(liquidGlassMode);
    },
    markChanged: function (el) { notifyDirty(el); }
  };
})();
