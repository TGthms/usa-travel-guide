'use strict';
/* USA Travel Guide — features/dest-weather.js
   Lightweight live weather chips on homepage destination cards.
   Fetches all cities in one Open-Meteo multi-location request, caches in sessionStorage.
   Fail-soft: muted “Open weather →” when data is unavailable.
*/
(function () {
  if (!document.getElementById('destTrack')) return;
  if (!window.DEST_WEATHER_CITIES) return;

  var CACHE_KEY = 'usa-travel-dest-wx-v1';
  var CACHE_TTL_MS = 20 * 60 * 1000;
  var OM = 'https://api.open-meteo.com/v1/forecast';

  var OPEN_LABEL = {
    en: 'Open weather →',
    es: 'Ver el tiempo →',
    zh: '查看天气 →',
    ja: '天気を見る →'
  };
  var HL_LABEL = {
    en: { h: 'H', l: 'L' },
    es: { h: 'Máx', l: 'Mín' },
    zh: { h: '高', l: '低' },
    ja: { h: '最高', l: '最低' }
  };

  function lang() {
    return (typeof currentLang === 'string' && currentLang) || 'en';
  }

  function useF() {
    try {
      if (typeof currentTempUnit === 'string') return currentTempUnit !== 'c';
    } catch (e) { /* ignore */ }
    return true;
  }

  function fmtTemp(c) {
    if (c == null || Number.isNaN(Number(c))) return '—';
    if (useF()) return Math.round(Number(c) * 9 / 5 + 32) + '°';
    return Math.round(Number(c)) + '°';
  }

  /** Compact condition glyph (emoji — no SF symbol dependency on homepage). */
  function condGlyph(code) {
    var c = Number(code);
    if (!Number.isFinite(c)) return '·';
    if (c === 0) return '☀️';
    if (c <= 3) return '⛅';
    if (c <= 48) return '🌫️';
    if (c <= 67) return '🌧️';
    if (c <= 77) return '❄️';
    if (c <= 82) return '🌦️';
    if (c <= 86) return '🌨️';
    if (c >= 95) return '⛈️';
    return '☁️';
  }

  function condAria(code) {
    var c = Number(code);
    if (c === 0) return { en: 'Clear', es: 'Despejado', zh: '晴', ja: '晴れ' };
    if (c <= 3) return { en: 'Partly cloudy', es: 'Parcialmente nublado', zh: '多云', ja: '晴れ時々曇り' };
    if (c <= 48) return { en: 'Fog', es: 'Niebla', zh: '雾', ja: '霧' };
    if (c <= 67) return { en: 'Rain', es: 'Lluvia', zh: '雨', ja: '雨' };
    if (c <= 77) return { en: 'Snow', es: 'Nieve', zh: '雪', ja: '雪' };
    if (c >= 95) return { en: 'Storm', es: 'Tormenta', zh: '雷暴', ja: '嵐' };
    return { en: 'Weather', es: 'Tiempo', zh: '天气', ja: '天気' };
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.at || !obj.data) return null;
      if (Date.now() - obj.at > CACHE_TTL_MS) return null;
      return obj.data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: data }));
    } catch (e) { /* quota / private mode */ }
  }

  function ensureMounts() {
    document.querySelectorAll('#destTrack .dest-card[data-dest]').forEach(function (card) {
      if (card.querySelector('.dest-weather')) return;
      var slug = card.dataset.dest;
      if (!DEST_WEATHER_CITIES[slug]) return;
      var content = card.querySelector('.dest-content');
      if (!content) return;
      var a = document.createElement('a');
      a.className = 'dest-weather is-loading';
      a.href = 'tools-weather.html?city=' + encodeURIComponent(slug);
      a.setAttribute('data-dest-wx', slug);
      a.setAttribute('aria-label', OPEN_LABEL[lang()] || OPEN_LABEL.en);
      a.innerHTML =
        '<span class="dest-weather-icon" aria-hidden="true">·</span>' +
        '<span class="dest-weather-main">' +
          '<span class="dest-weather-temp">…</span>' +
          '<span class="dest-weather-hl"></span>' +
        '</span>' +
        '<span class="dest-weather-fallback">' + (OPEN_LABEL[lang()] || OPEN_LABEL.en) + '</span>';
      // Don't open the destination modal; ensure guide return stamp is set
      a.addEventListener('click', function (e) {
        e.stopPropagation();
        try {
          if (window.__usaTravelNavReturn && typeof window.__usaTravelNavReturn.stamp === 'function') {
            window.__usaTravelNavReturn.stamp(a.getAttribute('href') || a.href);
          }
        } catch (err) { /* ignore */ }
      });
      content.appendChild(a);
    });
  }

  function paintOne(el, pack) {
    var L = lang();
    var openLab = OPEN_LABEL[L] || OPEN_LABEL.en;
    var hl = HL_LABEL[L] || HL_LABEL.en;
    var fallback = el.querySelector('.dest-weather-fallback');
    var icon = el.querySelector('.dest-weather-icon');
    var temp = el.querySelector('.dest-weather-temp');
    var hlEl = el.querySelector('.dest-weather-hl');
    el.classList.remove('is-loading');

    if (!pack || pack.error || pack.temp == null) {
      el.classList.add('is-fallback');
      el.classList.remove('is-live');
      if (fallback) fallback.textContent = openLab;
      if (icon) icon.textContent = '';
      if (temp) temp.textContent = '';
      if (hlEl) hlEl.textContent = '';
      el.setAttribute('aria-label', openLab);
      return;
    }

    el.classList.remove('is-fallback');
    el.classList.add('is-live');
    var glyph = condGlyph(pack.code);
    var cond = condAria(pack.code);
    var condLab = (cond && (cond[L] || cond.en)) || '';
    if (icon) icon.textContent = glyph;
    if (temp) temp.textContent = fmtTemp(pack.temp);
    if (hlEl) {
      hlEl.textContent = hl.h + ' ' + fmtTemp(pack.hi) + ' · ' + hl.l + ' ' + fmtTemp(pack.lo);
    }
    if (fallback) fallback.textContent = openLab;
    var aria = (condLab ? condLab + ', ' : '') + fmtTemp(pack.temp) +
      ', ' + hl.h + ' ' + fmtTemp(pack.hi) + ' ' + hl.l + ' ' + fmtTemp(pack.lo) +
      '. ' + openLab;
    el.setAttribute('aria-label', aria);
  }

  function paintAll(data) {
    ensureMounts();
    document.querySelectorAll('.dest-weather[data-dest-wx]').forEach(function (el) {
      var slug = el.getAttribute('data-dest-wx');
      paintOne(el, data && data[slug]);
    });
  }

  function parseOmResponse(list, slugs) {
    var out = {};
    if (!Array.isArray(list)) list = list ? [list] : [];
    slugs.forEach(function (slug, i) {
      var row = list[i];
      if (!row || !row.current) {
        out[slug] = { error: true };
        return;
      }
      var cur = row.current;
      var daily = row.daily || {};
      out[slug] = {
        temp: cur.temperature_2m,
        code: cur.weather_code,
        hi: daily.temperature_2m_max && daily.temperature_2m_max[0],
        lo: daily.temperature_2m_min && daily.temperature_2m_min[0]
      };
    });
    return out;
  }

  async function fetchAll() {
    var entries = Object.keys(DEST_WEATHER_CITIES).map(function (slug) {
      return { slug: slug, c: DEST_WEATHER_CITIES[slug] };
    });
    var lats = entries.map(function (e) { return e.c.lat; }).join(',');
    var lons = entries.map(function (e) { return e.c.lon; }).join(',');
    var url = OM +
      '?latitude=' + encodeURIComponent(lats) +
      '&longitude=' + encodeURIComponent(lons) +
      '&current=temperature_2m,weather_code' +
      '&daily=temperature_2m_max,temperature_2m_min' +
      '&forecast_days=1&timezone=auto&temperature_unit=celsius';
    var res = await fetch(url);
    if (!res.ok) throw new Error('wx ' + res.status);
    var json = await res.json();
    var slugs = entries.map(function (e) { return e.slug; });
    return parseOmResponse(json, slugs);
  }

  function bindClicks() {
    document.querySelectorAll('.dest-weather').forEach(function (el) {
      if (el._wxBound) return;
      el._wxBound = true;
      el.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });
  }

  window.paintDestWeather = function paintDestWeather() {
    var data = readCache();
    if (data) paintAll(data);
    else {
      ensureMounts();
      document.querySelectorAll('.dest-weather').forEach(function (el) {
        el.classList.add('is-fallback');
        el.classList.remove('is-live', 'is-loading');
        var fb = el.querySelector('.dest-weather-fallback');
        if (fb) fb.textContent = OPEN_LABEL[lang()] || OPEN_LABEL.en;
      });
    }
    bindClicks();
  };

  async function boot() {
    ensureMounts();
    bindClicks();

    var cached = readCache();
    if (cached) {
      paintAll(cached);
    }

    // Defer network until destinations are near the viewport (or soon if already visible)
    var track = document.getElementById('destTrack');
    var started = false;
    async function startFetch() {
      if (started) return;
      started = true;
      try {
        var data = await fetchAll();
        writeCache(data);
        paintAll(data);
        bindClicks();
      } catch (err) {
        if (!cached) {
          // Soft fail — muted open links
          paintAll(null);
        }
        bindClicks();
      }
    }

    if (track && typeof IntersectionObserver === 'function') {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          io.disconnect();
          startFetch();
        }
      }, { rootMargin: '240px 0px' });
      io.observe(track);
      // Fallback if never observed (hidden filter edge cases)
      setTimeout(startFetch, 8000);
    } else {
      startFetch();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
