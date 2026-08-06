'use strict';
/* USA Travel Guide — features/weather.js
   Hybrid weather:
     · NWS primary for US forecasts + severe alerts
     · Open-Meteo for non-US, geocode, AQ, detail enrich, and NWS fallback
   Load order: data/i18n → core/env → core/runtime → weather.js → app.js

   Refresh contract:
     · Manual Refresh always available (never stuck disabled; re-click cancels prior)
     · Manual force re-fetches NWS + Open-Meteo (+ alerts)
     · Auto-refresh every 10 min while document.visibilityState === 'visible'
     · Auto fully paused (timer cleared) when tab hidden/inactive; resume refreshes if stale
     · Auto/detail use quiet mode (list stays; no progress lock)

   Overlay contract (stability):
     · hoistOverlays() once → detail + sheet on <body>, sheet after detail
     · Sheet closed ⇒ pointer-events:none + aria-hidden (never trap list taps)
     · openUnitsSheet / openSheet always go through presentSheet()
     · Escape: suggest → sheet → detail
     · Detail enter: CSS opacity transition; exit: unlock list first, short fade
     · Scroll reset only on open/switch city (not unit re-render)
     · refreshGen / detailMotionGen / sheetGen / searchGen cancel races
*/

(function () {
  if (!document.getElementById('weatherList') && !document.querySelector('[data-tool="weather"]')) return;

  // ── API + storage keys ──────────────────────────────────────────────
  const FORECAST = 'https://api.open-meteo.com/v1/forecast';
  const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
  const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  const REFRESH_MS = 10 * 60 * 1000;
  const WIND_KEY = 'usa-travel-weather-wind';
  const PRECIP_KEY = 'usa-travel-weather-precip';
  const PRESS_KEY = 'usa-travel-weather-pressure';
  const FAV_KEY = 'usa-travel-weather-favorites';
  const MYLOC_KEY = 'usa-travel-weather-myloc';

  const MAJOR = [
    { name: 'New York', admin1: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    { name: 'Los Angeles', admin1: 'California', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
    { name: 'Chicago', admin1: 'Illinois', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
    { name: 'Houston', admin1: 'Texas', lat: 29.7604, lon: -95.3698, tz: 'America/Chicago' },
    { name: 'Phoenix', admin1: 'Arizona', lat: 33.4484, lon: -112.074, tz: 'America/Phoenix' },
    { name: 'Philadelphia', admin1: 'Pennsylvania', lat: 39.9526, lon: -75.1652, tz: 'America/New_York' },
    { name: 'San Antonio', admin1: 'Texas', lat: 29.4241, lon: -98.4936, tz: 'America/Chicago' },
    { name: 'San Diego', admin1: 'California', lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' },
    { name: 'Dallas', admin1: 'Texas', lat: 32.7767, lon: -96.797, tz: 'America/Chicago' },
    { name: 'San Jose', admin1: 'California', lat: 37.3382, lon: -121.8863, tz: 'America/Los_Angeles' },
    { name: 'Austin', admin1: 'Texas', lat: 30.2672, lon: -97.7431, tz: 'America/Chicago' },
    { name: 'Jacksonville', admin1: 'Florida', lat: 30.3322, lon: -81.6557, tz: 'America/New_York' },
    { name: 'San Francisco', admin1: 'California', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
    { name: 'Columbus', admin1: 'Ohio', lat: 39.9612, lon: -82.9988, tz: 'America/New_York' },
    { name: 'Charlotte', admin1: 'North Carolina', lat: 35.2271, lon: -80.8431, tz: 'America/New_York' },
    { name: 'Indianapolis', admin1: 'Indiana', lat: 39.7684, lon: -86.1581, tz: 'America/Indiana/Indianapolis' },
    { name: 'Seattle', admin1: 'Washington', lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
    { name: 'Denver', admin1: 'Colorado', lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
    { name: 'Washington', admin1: 'District of Columbia', lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    { name: 'Boston', admin1: 'Massachusetts', lat: 42.3601, lon: -71.0589, tz: 'America/New_York' },
    { name: 'Nashville', admin1: 'Tennessee', lat: 36.1627, lon: -86.7816, tz: 'America/Chicago' },
    { name: 'Detroit', admin1: 'Michigan', lat: 42.3314, lon: -83.0458, tz: 'America/Detroit' },
    { name: 'Portland', admin1: 'Oregon', lat: 45.5152, lon: -122.6784, tz: 'America/Los_Angeles' },
    { name: 'Las Vegas', admin1: 'Nevada', lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
    { name: 'Memphis', admin1: 'Tennessee', lat: 35.1495, lon: -90.049, tz: 'America/Chicago' },
    { name: 'Louisville', admin1: 'Kentucky', lat: 38.2527, lon: -85.7585, tz: 'America/Kentucky/Louisville' },
    { name: 'Baltimore', admin1: 'Maryland', lat: 39.2904, lon: -76.6122, tz: 'America/New_York' },
    { name: 'Milwaukee', admin1: 'Wisconsin', lat: 43.0389, lon: -87.9065, tz: 'America/Chicago' },
    { name: 'Albuquerque', admin1: 'New Mexico', lat: 35.0844, lon: -106.6504, tz: 'America/Denver' },
    { name: 'Tucson', admin1: 'Arizona', lat: 32.2226, lon: -110.9747, tz: 'America/Phoenix' },
    { name: 'Fresno', admin1: 'California', lat: 36.7378, lon: -119.7871, tz: 'America/Los_Angeles' },
    { name: 'Sacramento', admin1: 'California', lat: 38.5816, lon: -121.4944, tz: 'America/Los_Angeles' },
    { name: 'Atlanta', admin1: 'Georgia', lat: 33.749, lon: -84.388, tz: 'America/New_York' },
    { name: 'Miami', admin1: 'Florida', lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
    { name: 'New Orleans', admin1: 'Louisiana', lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
    { name: 'Minneapolis', admin1: 'Minnesota', lat: 44.9778, lon: -93.265, tz: 'America/Chicago' },
    { name: 'Salt Lake City', admin1: 'Utah', lat: 40.7608, lon: -111.891, tz: 'America/Denver' },
    { name: 'Honolulu', admin1: 'Hawaii', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
    { name: 'Anchorage', admin1: 'Alaska', lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' }
  ];

  const WMO = {
    0: { en: 'Clear', es: 'Despejado', zh: '晴', ja: '快晴' },
    1: { en: 'Mainly clear', es: 'Mayormente despejado', zh: '大部晴朗', ja: 'ほぼ晴れ' },
    2: { en: 'Partly cloudy', es: 'Parcialmente nublado', zh: '多云', ja: '晴れ時々曇り' },
    3: { en: 'Overcast', es: 'Cubierto', zh: '阴', ja: '曇り' },
    45: { en: 'Fog', es: 'Niebla', zh: '雾', ja: '霧' },
    48: { en: 'Rime fog', es: 'Niebla helada', zh: '雾凇', ja: '着氷性の霧' },
    51: { en: 'Light drizzle', es: 'Llovizna ligera', zh: '小毛毛雨', ja: '弱い霧雨' },
    53: { en: 'Drizzle', es: 'Llovizna', zh: '毛毛雨', ja: '霧雨' },
    55: { en: 'Heavy drizzle', es: 'Llovizna intensa', zh: '强毛毛雨', ja: '強い霧雨' },
    61: { en: 'Light rain', es: 'Lluvia ligera', zh: '小雨', ja: '弱い雨' },
    63: { en: 'Rain', es: 'Lluvia', zh: '雨', ja: '雨' },
    65: { en: 'Heavy rain', es: 'Lluvia intensa', zh: '大雨', ja: '強い雨' },
    71: { en: 'Light snow', es: 'Nieve ligera', zh: '小雪', ja: '弱い雪' },
    73: { en: 'Snow', es: 'Nieve', zh: '雪', ja: '雪' },
    75: { en: 'Heavy snow', es: 'Nieve intensa', zh: '大雪', ja: '大雪' },
    80: { en: 'Rain showers', es: 'Chubascos', zh: '阵雨', ja: 'にわか雨' },
    81: { en: 'Rain showers', es: 'Chubascos', zh: '阵雨', ja: 'にわか雨' },
    82: { en: 'Violent rain showers', es: 'Chubascos fuertes', zh: '强阵雨', ja: '激しいにわか雨' },
    95: { en: 'Thunderstorm', es: 'Tormenta', zh: '雷暴', ja: '雷雨' },
    96: { en: 'Thunderstorm with hail', es: 'Tormenta con granizo', zh: '雷暴伴冰雹', ja: '雷雨（ひょう）' },
    99: { en: 'Thunderstorm with hail', es: 'Tormenta con granizo', zh: '雷暴伴冰雹', ja: '雷雨（ひょう）' }
  };

  const $ = (id) => document.getElementById(id);
  const listEl = $('weatherList');
  const favListEl = $('weatherFavoritesList');
  const favBlock = $('weatherFavoritesBlock');
  const myLocListEl = $('weatherMyLocationList');
  const myLocBlock = $('weatherMyLocationBlock');
  const majorsBlock = $('weatherMajorsBlock');
  const shellEl = $('weatherShell');
  const loadingEl = $('weatherLoading');
  const errorEl = $('weatherError');
  const updatedEl = $('weatherUpdated');
  const searchEl = $('weatherSearch');
  const searchClear = $('weatherSearchClear');
  const suggestEl = $('weatherSuggest');
  const refreshBtn = $('weatherRefresh');
  const locateBtn = $('weatherLocate');
  const unitsBtn = $('weatherUnitsBtn');
  const detailEl = $('weatherDetail');
  const detailHero = $('weatherDetailHero');
  const detailMods = $('weatherModules');
  const detailScroll = $('weatherDetailScroll');
  const detailBack = $('weatherDetailBack');
  const detailRefresh = $('weatherDetailRefresh');
  const detailFavBtn = $('weatherDetailFav');
  const detailSky = $('weatherDetailSky');
  const sheetEl = $('weatherSheet');
  const sheetBody = $('weatherSheetBody');
  const sheetClose = $('weatherSheetClose');

  let cache = new Map();
  let autoRefreshTimer = null;
  let searchTimer = 0;
  let openCity = null;
  let abortCtl = null;
  let lastListFetch = 0;
  let myLocationCity = null;
  let refreshGen = 0;       // supersede stale refresh() completions
  let refreshInflight = null; // Promise of current refresh, if any
  /** Detail open/close motion — generation counters cancel stale rAF/timeouts. */
  let detailMotionGen = 0;
  let detailMotionTimer = 0;
  let detailEnterTimer = 0;
  let detailCloseListener = null;
  let searchGen = 0;
  let overlaysHoisted = false;

  function lang() {
    return (typeof currentLang === 'string' && currentLang) || 'en';
  }
  function t(key, fallback) {
    const dict = typeof getI18nDict === 'function' ? getI18nDict(lang()) : null;
    if (dict && dict[key]) return dict[key];
    return fallback || key;
  }
  function localeTag() {
    return lang() === 'zh' ? 'zh-CN' : lang() === 'ja' ? 'ja-JP' : lang() === 'es' ? 'es-ES' : 'en-US';
  }
  function useF() {
    return typeof currentTempUnit === 'undefined' || currentTempUnit === 'f';
  }
  function useMi() {
    return typeof currentDistUnit === 'undefined' || currentDistUnit === 'mi';
  }
  function motionLevel() {
    try {
      const m = document.documentElement.getAttribute('data-motion-effective');
      if (m === 'off' || m === 'reduced') return m;
      return 'full';
    } catch (e) { return 'full'; }
  }
  function motionFull() { return motionLevel() === 'full'; }

  function windUnit() {
    try { return localStorage.getItem(WIND_KEY) || (useMi() ? 'mph' : 'kmh'); }
    catch (e) { return useMi() ? 'mph' : 'kmh'; }
  }
  function precipUnit() {
    try { return localStorage.getItem(PRECIP_KEY) || (useMi() ? 'in' : 'mm'); }
    catch (e) { return useMi() ? 'in' : 'mm'; }
  }
  function pressUnit() {
    try { return localStorage.getItem(PRESS_KEY) || 'hPa'; }
    catch (e) { return 'hPa'; }
  }
  function setWindUnit(u) { try { localStorage.setItem(WIND_KEY, u); } catch (e) {} }
  function setPrecipUnit(u) { try { localStorage.setItem(PRECIP_KEY, u); } catch (e) {} }
  function setPressUnit(u) { try { localStorage.setItem(PRESS_KEY, u); } catch (e) {} }

  function cityKey(c) {
    return (Number(c.lat).toFixed(3) + ',' + Number(c.lon).toFixed(3));
  }
  function sameCity(a, b) {
    return cityKey(a) === cityKey(b);
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter((c) => c && typeof c.lat === 'number' && typeof c.lon === 'number' && c.name)
        .map((c) => ({ name: c.name, admin1: c.admin1 || '', lat: c.lat, lon: c.lon, tz: c.tz }));
    } catch (e) { return []; }
  }
  function saveFavorites(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, 24))); } catch (e) {}
  }
  function isFavorite(c) {
    return loadFavorites().some((f) => sameCity(f, c));
  }
  function toggleFavorite(c) {
    let list = loadFavorites();
    if (list.some((f) => sameCity(f, c))) {
      list = list.filter((f) => !sameCity(f, c));
    } else {
      list = [{ name: c.name, admin1: c.admin1 || '', lat: c.lat, lon: c.lon, tz: c.tz }, ...list.filter((f) => !sameCity(f, c))];
    }
    saveFavorites(list);
    return list;
  }

  function loadMyLocation() {
    try {
      const raw = localStorage.getItem(MYLOC_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (!c || typeof c.lat !== 'number' || typeof c.lon !== 'number' || !c.name) return null;
      return { name: c.name, admin1: c.admin1 || '', lat: c.lat, lon: c.lon, tz: c.tz, isMyLocation: true };
    } catch (e) { return null; }
  }
  function saveMyLocation(c) {
    if (!c) {
      try { localStorage.removeItem(MYLOC_KEY); } catch (e) {}
      myLocationCity = null;
      return;
    }
    myLocationCity = {
      name: c.name, admin1: c.admin1 || '', lat: c.lat, lon: c.lon, tz: c.tz, isMyLocation: true
    };
    try { localStorage.setItem(MYLOC_KEY, JSON.stringify(myLocationCity)); } catch (e) {}
  }

  async function reverseGeocode(lat, lon) {
    const langParam = lang() === 'zh' ? 'zh' : lang() === 'ja' ? 'ja' : lang() === 'es' ? 'es' : 'en';
    // BigDataCloud client reverse geocode (browser-safe, no API key)
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${langParam}`;
      const data = await fetchJson(url);
      const name = data.city || data.locality || data.principalSubdivision || data.countryName;
      if (name) {
        const admin = [data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
        return { name, admin1: admin, lat, lon };
      }
    } catch (e) { /* fall through */ }
    // Nominatim fallback
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${langParam}`;
      const data = await fetchJson(url);
      const a = data.address || {};
      const name = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || data.name;
      if (name) {
        const admin = [a.state, a.country].filter(Boolean).join(', ');
        return { name, admin1: admin, lat, lon };
      }
    } catch (e) { /* fall through */ }
    return {
      name: lat.toFixed(2) + '°, ' + lon.toFixed(2) + '°',
      admin1: t('weather.myLocation', 'My Location'),
      lat, lon
    };
  }

  function condLabel(code) {
    const row = WMO[code] || WMO[3];
    return row[lang()] || row.en;
  }

  /* SF Symbols–inspired stroke glyphs (24×24, consistent optical weight) */
  function sfIcon(name, cls) {
    const c = cls || 'weather-sf';
    const base = `class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;
    const fillBase = `class="${c}" viewBox="0 0 24 24" fill="currentColor"`;
    const map = {
      'sun.max': `<svg ${base}><circle cx="12" cy="12" r="3.25"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.05 5.05l1.55 1.55M17.4 17.4l1.55 1.55M5.05 18.95l1.55-1.55M17.4 6.6l1.55-1.55"/></svg>`,
      /* Clean crescent (SF-style) + small star — no ambiguous filled disc */
      'moon.stars': `<svg ${base}><path d="M14 4.2a6.8 6.8 0 1 0 5.5 10.6 5.2 5.2 0 0 1-5.5-10.6z"/><path d="m18.2 5.1.4 1.15h1.2l-.95.7.35 1.15-.95-.7-.95.7.35-1.15-.95-.7h1.2z"/></svg>`,
      moon: `<svg ${base}><path d="M14.2 4a7 7 0 1 0 5.8 11 5.4 5.4 0 0 1-5.8-11z"/></svg>`,
      cloud: `<svg ${base}><path d="M7 18h10.2A3.8 3.8 0 0 0 18 10.5a5.6 5.6 0 0 0-10.7 1.5A3.6 3.6 0 0 0 7 18z"/></svg>`,
      'cloud.sun': `<svg ${base}><circle cx="8.2" cy="9" r="2.4"/><path d="M8.2 3.8v1.4M8.2 12.8v1.4M3.4 9h1.4M11.6 9h1.4M4.7 5.5l1 1M10.7 11.5l1 1M4.7 12.5l1-1M10.7 6.5l1-1"/><path d="M8.5 18h8.8A3.3 3.3 0 0 0 18 11.6a4.8 4.8 0 0 0-8.6 1.6A3.1 3.1 0 0 0 8.5 18z"/></svg>`,
      'cloud.moon': `<svg ${base}><path d="M14.5 5.2A4.2 4.2 0 1 0 17.8 11a3.4 3.4 0 0 1-3.3-5.8z"/><path d="M7.2 18.2h9.2A3.4 3.4 0 0 0 17 11.8a5 5 0 0 0-9.5 1.5A3.2 3.2 0 0 0 7.2 18.2z"/></svg>`,
      'cloud.rain': `<svg ${base}><path d="M7 15.2h10.2A3.8 3.8 0 0 0 18 7.7a5.6 5.6 0 0 0-10.7 1.5A3.6 3.6 0 0 0 7 15.2z"/><path d="m9.2 17.5-1 2.6M12.2 17.5l-1 2.6M15.2 17.5l-1 2.6"/></svg>`,
      'cloud.drizzle': `<svg ${base}><path d="M7 15h10.2A3.8 3.8 0 0 0 18 7.5a5.6 5.6 0 0 0-10.7 1.5A3.6 3.6 0 0 0 7 15z"/><path d="M9.5 17.2v1.6M12.2 18v1.6M14.9 17.2v1.6"/></svg>`,
      'cloud.heavyrain': `<svg ${base}><path d="M7 14.5h10.2A3.8 3.8 0 0 0 18 7a5.6 5.6 0 0 0-10.7 1.5A3.6 3.6 0 0 0 7 14.5z"/><path d="m8.8 16.5-1.2 3.2M11.5 16.5l-1.2 3.2M14.2 16.5l-1.2 3.2M16.9 16.5l-1.2 3.2"/></svg>`,
      'cloud.snow': `<svg ${base}><path d="M7 15h10.2A3.8 3.8 0 0 0 18 7.5a5.6 5.6 0 0 0-10.7 1.5A3.6 3.6 0 0 0 7 15z"/><path d="M9.2 17.6h.01M12.2 19h.01M15.2 17.6h.01M10.7 19.8h.01M13.7 18.2h.01"/></svg>`,
      'cloud.bolt': `<svg ${base}><path d="M7 15.5h9.5A3.6 3.6 0 0 0 17 8.2a5.4 5.4 0 0 0-10.2 1.4A3.5 3.5 0 0 0 7 15.5z"/><path d="m12.2 13.2-2.2 4.2h2.1l-1 3.4 3.5-5.2h-2.1l1.2-2.4z"/></svg>`,
      'cloud.fog': `<svg ${base}><path d="M7 11.5h10.2A3.8 3.8 0 0 0 18 4a5.6 5.6 0 0 0-10.7 1.5A3.6 3.6 0 0 0 7 11.5z"/><path d="M4 15h16M5.5 18h13M7 21h10"/></svg>`,
      wind: `<svg ${base}><path d="M3.5 9.5h11.2a2.4 2.4 0 1 0-1.2-4.5"/><path d="M3.5 13.5h14a2.6 2.6 0 1 1-1.3 4.9"/><path d="M3.5 17.5h7"/></svg>`,
      snowflake: `<svg ${base}><path d="M12 3v18M5.2 6.5l13.6 11M5.2 17.5l13.6-11"/><path d="M9.5 4.8 12 7l2.5-2.2M9.5 19.2 12 17l2.5 2.2"/></svg>`,
      thermometer: `<svg ${base}><path d="M10 14.2V6.5a2 2 0 1 1 4 0v7.7a3.2 3.2 0 1 1-4 0z"/><path d="M12 17.5v0"/></svg>`,
      drop: `<svg ${base}><path d="M12 3.5c0 0 5.5 6.2 5.5 10.2a5.5 5.5 0 1 1-11 0C6.5 9.7 12 3.5 12 3.5z"/></svg>`,
      eye: `<svg ${base}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.4"/></svg>`,
      gauge: `<svg ${base}><path d="M5.2 16.2a7.5 7.5 0 1 1 13.6 0"/><path d="M12 13.5 15.5 8"/><circle cx="12" cy="13.5" r="1.2"/></svg>`,
      barometer: `<svg ${base}><circle cx="12" cy="13" r="7"/><path d="M12 6.5V4.8M8 7.8 6.8 6.6M16 7.8l1.2-1.2"/><path d="M12 13 15 9.5"/></svg>`,
      umbrella: `<svg ${base}><path d="M12 3.5v1.2M4.5 12.5a7.5 7.5 0 0 1 15 0H4.5z"/><path d="M12 12.5v6a1.8 1.8 0 0 0 3.5.4"/></svg>`,
      sunrise: `<svg ${base}><path d="M3.5 17.5h17"/><path d="M12 14.5V8M7.5 12.5 5.8 10.8M16.5 12.5l1.7-1.7M4.5 17.5a7.5 7.5 0 0 1 15 0"/><path d="M9 7.2 12 4.5l3 2.7"/></svg>`,
      location: `<svg ${base}><path d="M12 21s6.5-5.4 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.6 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`,
      'location.fill': `<svg ${fillBase}><path d="M12 21s6.5-5.4 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.6 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.1" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/></svg>`,
      star: `<svg ${base}><path d="m12 3.5 2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 17l.9-5L4.8 8.7l5-.7z"/></svg>`,
      'star.fill': `<svg ${fillBase}><path d="m12 3.5 2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 17l.9-5L4.8 8.7l5-.7z"/></svg>`,
      'arrow.clockwise': `<svg ${base}><path d="M20 7.5v5h-5"/><path d="M19.2 12.5A7.2 7.2 0 1 1 17 6.6L20 7.5"/></svg>`,
      sparkles: `<svg ${base}><path d="M12 3.5 13.2 8l4.8 1.2-4.8 1.2L12 15l-1.2-4.6L6 9.2l4.8-1.2z"/><path d="m18 14 .6 2 2 .5-2 .5-.6 2-.6-2-2-.5 2-.5z"/></svg>`
    };
    return map[name] || map.cloud;
  }

  function condIcon(code, night, cls) {
    const c = cls || 'weather-row-icon';
    if (code >= 95) return sfIcon('cloud.bolt', c);
    if (code >= 71 && code < 80) return sfIcon('cloud.snow', c);
    if (code >= 85 && code < 90) return sfIcon('cloud.snow', c);
    if (code >= 80 && code < 85) return sfIcon('cloud.heavyrain', c);
    if (code >= 61 && code < 70) return sfIcon(code >= 65 ? 'cloud.heavyrain' : 'cloud.rain', c);
    if (code >= 51 && code < 60) return sfIcon('cloud.drizzle', c);
    if (code === 45 || code === 48) return sfIcon('cloud.fog', c);
    if (code === 3) return sfIcon('cloud', c);
    if (code === 2) return sfIcon(night ? 'cloud.moon' : 'cloud.sun', c);
    if (code === 1) return sfIcon(night ? 'moon.stars' : 'cloud.sun', c);
    return sfIcon(night ? 'moon.stars' : 'sun.max', c);
  }

  function modLabelIcon(key) {
    const map = {
      aqi: 'sparkles', feels: 'thermometer', humidity: 'drop', wind: 'wind',
      uv: 'sun.max', vis: 'eye', pressure: 'barometer', precip: 'umbrella',
      sun: 'sunrise', conditions: 'cloud.sun'
    };
    return sfIcon(map[key] || 'cloud', 'weather-mod-sf');
  }

  function starIcon(filled) {
    return filled ? sfIcon('star.fill', 'weather-star-sf') : sfIcon('star', 'weather-star-sf');
  }

  function locBadgeHtml() {
    return `<span class="weather-row-loc" aria-hidden="true">${sfIcon('location.fill', 'weather-loc-sf')}</span>`;
  }

  function fmtTemp(c) {
    if (c == null || Number.isNaN(c)) return '—';
    if (useF()) return Math.round(c * 9 / 5 + 32) + '°';
    return Math.round(c) + '°';
  }
  function windMsTo(unit, ms) {
    if (ms == null) return null;
    if (unit === 'mph') return ms * 2.23694;
    if (unit === 'kmh') return ms * 3.6;
    if (unit === 'kn') return ms * 1.94384;
    if (unit === 'bft') {
      const t = Math.pow(ms / 0.836, 2 / 3);
      return Math.max(0, Math.min(12, Math.round(t)));
    }
    return ms;
  }
  function fmtWind(ms) {
    const u = windUnit();
    const v = windMsTo(u, ms);
    if (v == null) return '—';
    if (u === 'bft') return v + ' bft';
    if (u === 'mph') return Math.round(v) + ' mph';
    if (u === 'kmh') return Math.round(v) + ' km/h';
    if (u === 'kn') return Math.round(v) + ' kn';
    return Number(v).toFixed(1) + ' m/s';
  }
  function fmtVis(m) {
    if (m == null) return '—';
    if (useMi()) return (m / 1609.34).toFixed(1) + ' mi';
    return (m / 1000).toFixed(1) + ' km';
  }
  function fmtPrecip(mm) {
    if (mm == null) return '—';
    const u = precipUnit();
    if (u === 'in') return (mm / 25.4).toFixed(2) + ' in';
    if (u === 'cm') return (mm / 10).toFixed(1) + ' cm';
    return mm.toFixed(1) + ' mm';
  }
  function fmtPress(hpa) {
    if (hpa == null) return '—';
    const u = pressUnit();
    if (u === 'mbar') return Math.round(hpa) + ' mbar';
    if (u === 'inHg') return (hpa * 0.02953).toFixed(2) + ' inHg';
    if (u === 'mmHg') return Math.round(hpa * 0.75006) + ' mmHg';
    if (u === 'kPa') return (hpa / 10).toFixed(1) + ' kPa';
    return Math.round(hpa) + ' hPa';
  }
  function formatClock(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleTimeString(localeTag(), { hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return '—'; }
  }
  /** Sparse chart axis labels — Apple Weather style (00 / 06 / 12 / 18), not full “9:00 AM”. */
  function formatChartAxisHour(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      const h = d.getHours();
      return String(h).padStart(2, '0');
    } catch (e) {
      return '';
    }
  }
  function degToCompass(d) {
    if (d == null) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(d / 45) % 8];
  }
  function aqiLabel(v) {
    if (v == null) return '';
    if (v <= 50) return lang() === 'zh' ? '优' : lang() === 'ja' ? '良好' : lang() === 'es' ? 'Buena' : 'Good';
    if (v <= 100) return lang() === 'zh' ? '良' : lang() === 'ja' ? '普通' : lang() === 'es' ? 'Moderada' : 'Moderate';
    if (v <= 150) return lang() === 'zh' ? '轻度污染' : lang() === 'ja' ? '敏感者に有害' : lang() === 'es' ? 'Dañina (SG)' : 'Unhealthy (SG)';
    if (v <= 200) return lang() === 'zh' ? '中度污染' : lang() === 'ja' ? '有害' : lang() === 'es' ? 'Dañina' : 'Unhealthy';
    if (v <= 300) return lang() === 'zh' ? '重度污染' : lang() === 'ja' ? '非常に有害' : lang() === 'es' ? 'Muy dañina' : 'Very unhealthy';
    return lang() === 'zh' ? '严重污染' : lang() === 'ja' ? '危険' : lang() === 'es' ? 'Peligrosa' : 'Hazardous';
  }
  function aqiColor(v) {
    if (v == null) return '#8e8e93';
    if (v <= 50) return '#34c759';
    if (v <= 100) return '#ffd60a';
    if (v <= 150) return '#ff9f0a';
    if (v <= 200) return '#ff453a';
    if (v <= 300) return '#bf5af2';
    return '#9b2335';
  }
  function aqiPct(v) {
    if (v == null) return 0;
    return Math.max(0, Math.min(100, (v / 300) * 100));
  }
  function aqiBarHtml(v, compact) {
    const pct = aqiPct(v);
    const col = aqiColor(v);
    if (compact) {
      return `<div class="wx-aqi-bar wx-aqi-bar--compact" aria-hidden="true">
        <span class="wx-aqi-track"><span class="wx-aqi-fill" style="width:${pct.toFixed(1)}%;background:${col}"></span></span>
        <span class="wx-aqi-dot" style="left:${pct.toFixed(1)}%;background:${col}"></span>
      </div>`;
    }
    return `<div class="wx-aqi-scale" aria-hidden="true">
      <div class="wx-aqi-scale-track">
        <span class="wx-aqi-seg" style="background:#34c759"></span>
        <span class="wx-aqi-seg" style="background:#ffd60a"></span>
        <span class="wx-aqi-seg" style="background:#ff9f0a"></span>
        <span class="wx-aqi-seg" style="background:#ff453a"></span>
        <span class="wx-aqi-seg" style="background:#bf5af2"></span>
        <span class="wx-aqi-seg" style="background:#9b2335"></span>
      </div>
      <span class="wx-aqi-marker" style="left:${pct.toFixed(1)}%"></span>
    </div>
    <div class="wx-aqi-labels"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span></div>`;
  }
  function humidityBarHtml(pct) {
    const p = pct == null ? 0 : Math.max(0, Math.min(100, pct));
    return `<div class="wx-metric-bar" aria-hidden="true"><span style="width:${p}%"></span></div>`;
  }
  function uvBarHtml(v) {
    const pct = v == null ? 0 : Math.max(0, Math.min(100, (v / 12) * 100));
    return `<div class="weather-mod-viz"><span class="weather-mod-viz-bar"></span><span class="weather-mod-viz-dot" style="left:${pct.toFixed(1)}%"></span></div>`;
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  /** Local clock hour (0–23) for a city pack, using its timezone when available. */
  function localHourForPack(pack) {
    try {
      const tz = (pack && pack.weather && pack.weather.timezone)
        || (pack && pack.city && pack.city.tz);
      if (tz) {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, hour: 'numeric', hour12: false, hourCycle: 'h23'
        }).formatToParts(new Date());
        const h = parts.find((p) => p.type === 'hour');
        if (h) return parseInt(h.value, 10) % 24;
      }
      const cur = pack && pack.weather && pack.weather.current;
      // Open-Meteo local times are often "YYYY-MM-DDTHH:mm" without offset — parse hour digit
      if (cur && cur.time && typeof cur.time === 'string') {
        const m = cur.time.match(/T(\d{2})/);
        if (m) return parseInt(m[1], 10);
      }
    } catch (e) {}
    return new Date().getHours();
  }

  /** Sun (or moon) position on a day arc from local hour. Returns CSS % left/top + size. */
  function celestialPos(hour, isRow) {
    const night = hour < 5.5 || hour >= 20;
    if (night) {
      // Moon drifts across evening sky by hour
      const t = hour >= 20 ? (hour - 20) / 9.5 : (hour + 4) / 9.5;
      const left = 18 + t * 55;
      const top = 18 + Math.sin(t * Math.PI) * 8;
      return { left, top, size: isRow ? 36 : 72, night: true };
    }
    // Solar day ~5:30–20:00 → t 0..1
    const t = Math.max(0, Math.min(1, (hour - 5.5) / 14.5));
    const left = 6 + t * 72; // morning left → afternoon right
    // Arc: high near noon
    const top = 48 - Math.sin(t * Math.PI) * 38; // noon ~10%, ends ~48%
    const noonBoost = Math.sin(t * Math.PI);
    const size = isRow
      ? (32 + noonBoost * 14)
      : (70 + noonBoost * 50);
    return { left, top, size, night: false, t };
  }

  function skyFor(code, hour, seed) {
    const night = hour < 6 || hour >= 20;
    // Small per-city hue shift so identical conditions still differ
    const s = ((seed || 0) % 7) - 3; // -3..3
    const shift = (hex, n) => {
      // lightweight RGB nudge
      try {
        const h = hex.replace('#', '');
        let r = parseInt(h.slice(0, 2), 16);
        let g = parseInt(h.slice(2, 4), 16);
        let b = parseInt(h.slice(4, 6), 16);
        r = Math.max(0, Math.min(255, r + n * 4));
        g = Math.max(0, Math.min(255, g + n * 2));
        b = Math.max(0, Math.min(255, b - n * 3));
        return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      } catch (e) { return hex; }
    };
    if (code >= 95) return { c1: shift('#1a1428', s), c2: shift('#0a0612', s), fx: 'storm' };
    // Snow 71–77 / snow showers 85–86 (do not catch rain showers 80–82)
    if ((code >= 71 && code < 80) || (code >= 85 && code < 90)) {
      return { c1: shift('#3d4f66', s), c2: shift('#1c2533', s), fx: 'snow' };
    }
    // Drizzle/rain 51–67, rain showers 80–82
    if ((code >= 51 && code < 70) || (code >= 80 && code < 85)) {
      return { c1: shift('#2c3e50', s), c2: shift('#1a252f', s), fx: 'rain' };
    }
    if (code === 45 || code === 48) return { c1: shift('#4a5560', s), c2: shift('#2a3038', s), fx: 'fog' };
    if (code >= 2) {
      return night
        ? { c1: shift('#1e2a44', s), c2: shift('#0c1220', s), fx: 'cloud' }
        : { c1: shift('#5b86b8', s), c2: shift('#2c4870', s), fx: 'cloud' };
    }
    // Clear: palette follows local time (not one flat blue for every city)
    if (night) return { c1: shift('#0b1a3a', s), c2: shift('#050b18', s), fx: 'clear-night' };
    if (hour < 8) return { c1: shift('#e8926a', s), c2: shift('#5a7eb8', s), fx: 'clear-dawn' };
    if (hour < 10) return { c1: shift('#6ec8f0', s), c2: shift('#3a8fd0', s), fx: 'clear' };
    if (hour < 15) return { c1: shift('#4aa3e0', s), c2: shift('#1a6bb5', s), fx: 'clear' };
    if (hour < 17.5) return { c1: shift('#5a9fd0', s), c2: shift('#2a6090', s), fx: 'clear' };
    return { c1: shift('#e88858', s), c2: shift('#4a5a9a', s), fx: 'clear-dusk' };
  }

  /** 0–1 precip visual intensity from WMO code + optional mm amount. */
  function precipIntensity(code, precipMm) {
    const c = code || 0;
    let base = 0;
    if (c >= 95) base = 0.88;
    else if (c === 82 || c === 65 || c === 67) base = 0.92;
    else if (c === 81 || c === 63 || c === 55 || c === 57) base = 0.68;
    else if (c === 80 || c === 61 || c === 53) base = 0.48;
    else if (c >= 51 && c < 60) base = 0.32;
    else if (c >= 80 && c < 90) base = 0.58;
    else if (c >= 61 && c < 70) base = 0.55;
    else if (c >= 71 && c < 80) base = 0.5; // snow
    else if (c >= 85 && c < 87) base = 0.7;
    else return 0;
    if (precipMm != null && precipMm > 0) {
      base = Math.min(1, base + Math.min(0.28, precipMm / 8));
    }
    return base;
  }

  function applySky(el, code, isoTime, opts) {
    if (!el) return;
    opts = opts || {};
    let hour = opts.hour;
    if (hour == null) {
      hour = 12;
      try {
        if (isoTime && typeof isoTime === 'string') {
          const m = isoTime.match(/T(\d{2})/);
          if (m) hour = parseInt(m[1], 10);
          else hour = new Date(isoTime).getHours();
        } else hour = new Date().getHours();
      } catch (e) {}
    }
    const seed = opts.seed != null ? opts.seed : 0;
    const isRow = !!opts.isRow;
    const s = skyFor(code || 0, hour, seed);
    const level = motionLevel();
    el.style.setProperty('--wx-sky-1', s.c1);
    el.style.setProperty('--wx-sky-2', s.c2);
    el.style.setProperty('--wx-flat', s.c2);

    // Celestial position from local hour
    const pos = celestialPos(hour, isRow);
    el.style.setProperty('--wx-sun-left', pos.left.toFixed(1) + '%');
    el.style.setProperty('--wx-sun-top', pos.top.toFixed(1) + '%');
    el.style.setProperty('--wx-sun-size', pos.size.toFixed(0) + 'px');
    // Per-card cloud offsets so rows don't look stamped
    const c1x = ((seed * 17) % 30) - 10;
    const c2x = ((seed * 29) % 40) - 15;
    const c3x = ((seed * 13) % 25) - 8;
    el.style.setProperty('--wx-cloud-1-x', c1x + '%');
    el.style.setProperty('--wx-cloud-2-x', c2x + '%');
    el.style.setProperty('--wx-cloud-3-x', c3x + '%');
    const isPrecipFx = s.fx === 'rain' || s.fx === 'storm' || s.fx === 'snow';
    el.style.setProperty('--wx-cloud-op', isPrecipFx ? '0.9' : ((code >= 2 && code < 50) ? '0.85' : (s.fx === 'clear' || s.fx === 'clear-dawn' || s.fx === 'clear-dusk') ? '0.22' : '0.55'));

    // Rain opacity: clearly visible, but capped below the old ~0.78 “static” peak
    const intensity = precipIntensity(code || 0, opts.precipMm);
    const rowScale = isRow ? 0.55 : 1;
    let rainOp = 0;
    if (intensity > 0) {
      if (level === 'reduced') {
        rainOp = Math.min(0.42, 0.28 + intensity * 0.2) * rowScale;
      } else {
        // Light ~0.35 → heavy ~0.58 (was up to 0.78 — that caused discomfort)
        rainOp = Math.min(0.58, 0.32 + intensity * 0.32) * rowScale;
      }
    }
    el.style.setProperty('--wx-rain-opacity', String(rainOp));
    el.dataset.wxIntensity = intensity < 0.4 ? 'light' : intensity < 0.72 ? 'med' : 'heavy';

    if (level === 'off') {
      el.style.setProperty('--wx-fx-bg', 'none');
      el.style.setProperty('--wx-fx-bg-2', 'none');
      el.style.setProperty('--wx-fx-opacity', '0');
      el.style.setProperty('--wx-rain-opacity', '0');
      if (!opts.noOrnaments) paintSkyMode(el, code || 0, isoTime, { hour, seed, isRow, intensity });
      return;
    }
    // Soft atmospheric base (mist/veil) — particles are separate ornaments
    const sunGlow = `radial-gradient(circle at ${pos.left.toFixed(1)}% ${pos.top.toFixed(1)}%, rgba(255,230,150,.48), transparent 44%)`;
    // Cool wet-atmosphere veil under rain (supports the drop layer)
    const rainVeil = 'radial-gradient(ellipse at 40% 0%, rgba(140,175,210,.38), transparent 55%), linear-gradient(180deg, rgba(90,120,150,.12) 0%, rgba(50,70,95,.28) 100%), radial-gradient(ellipse at 70% 60%, rgba(160,190,220,.16), transparent 50%)';
    const snow = 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.28) 0 1.2px, transparent 2.2px), radial-gradient(circle at 70% 60%, rgba(255,255,255,.2) 0 1px, transparent 2px), radial-gradient(circle at 45% 75%, rgba(255,255,255,.16) 0 1px, transparent 2px), radial-gradient(ellipse at 50% 0%, rgba(220,230,245,.2), transparent 50%)';
    const cloud = 'radial-gradient(ellipse at 28% 18%, rgba(255,255,255,.28), transparent 50%), radial-gradient(ellipse at 72% 38%, rgba(255,255,255,.16), transparent 44%), radial-gradient(ellipse at 50% 90%, rgba(255,255,255,.08), transparent 40%)';
    const clear = sunGlow + ', radial-gradient(ellipse at 50% -10%, rgba(255,255,255,.32), transparent 55%)';
    const dawn = sunGlow + ', radial-gradient(ellipse at 30% 90%, rgba(255,160,100,.32), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,200,160,.15), transparent 40%)';
    const dusk = sunGlow + ', radial-gradient(ellipse at 70% 85%, rgba(255,120,80,.34), transparent 50%), radial-gradient(ellipse at 20% 30%, rgba(120,80,160,.18), transparent 45%)';
    const nightFx = 'radial-gradient(circle at 72% 18%, rgba(255,255,255,.5) 0 1.2px, transparent 2px), radial-gradient(circle at 30% 40%, rgba(255,255,255,.3) 0 1px, transparent 2px), radial-gradient(ellipse at 50% 100%, rgba(80,100,180,.24), transparent 50%)';
    const storm = 'radial-gradient(ellipse at 40% 0%, rgba(140,120,220,.35), transparent 52%), radial-gradient(ellipse at 60% 30%, rgba(50,35,80,.3), transparent 45%), ' + rainVeil;
    let fx = clear, fx2 = cloud, op = isRow ? 0.48 : 0.55;
    if (s.fx === 'rain') { fx = rainVeil; fx2 = cloud; op = isRow ? 0.55 : 0.68; }
    else if (s.fx === 'snow') { fx = snow; fx2 = cloud; op = 0.58; }
    else if (s.fx === 'storm') { fx = storm; fx2 = cloud; op = 0.72; }
    else if (s.fx === 'fog') { fx = 'linear-gradient(180deg, rgba(200,210,220,.2), rgba(120,130,140,.28))'; fx2 = cloud; op = 0.45; }
    else if (s.fx === 'cloud') { fx = cloud; fx2 = sunGlow; op = 0.52; }
    else if (s.fx === 'clear-night') { fx = nightFx; fx2 = cloud; op = 0.48; }
    else if (s.fx === 'clear-dawn') { fx = dawn; fx2 = cloud; op = 0.55; }
    else if (s.fx === 'clear-dusk') { fx = dusk; fx2 = cloud; op = 0.55; }
    el.style.setProperty('--wx-fx-bg', fx);
    el.style.setProperty('--wx-fx-bg-2', fx2);
    el.style.setProperty('--wx-fx-opacity', level === 'reduced' ? String(op * 0.55) : String(op));
    if (!opts.noOrnaments) paintSkyMode(el, code || 0, isoTime, { hour, seed, isRow, intensity });
  }

  /** Page canvas: time-of-day + theme gradient — independent of city weather cards. */
  function applyAmbientPageSky() {
    const sky = document.getElementById('weatherPageSky');
    if (!sky) return;
    const hour = new Date().getHours();
    const theme = (document.documentElement.getAttribute('data-theme') || 'default');
    const period = hour < 5 ? 'night' : hour < 8 ? 'dawn' : hour < 17 ? 'day' : hour < 20 ? 'dusk' : 'night';
    // [top, mid, bottom] — soft, satisfying palettes tuned per theme
    const palettes = {
      default: {
        night: ['#0a1024', '#121a38', '#060a14'],
        dawn: ['#2a1848', '#c4785a', '#1a2848'],
        day: ['#1a5a9e', '#4a9fd4', '#0c2440'],
        dusk: ['#3a1848', '#c45a48', '#101828']
      },
      minimal: {
        night: ['#1c1c1e', '#2c2c2e', '#0d0d0f'],
        dawn: ['#a8c0d8', '#f0c8b0', '#d8e4f0'],
        day: ['#7eb8e8', '#c5e0f5', '#e8f2fa'],
        dusk: ['#6b7a9a', '#e8a878', '#2a3040']
      },
      elegant: {
        night: ['#1a1410', '#2a2018', '#0e0a08'],
        dawn: ['#8a6a58', '#e8c4a0', '#f0e6d8'],
        day: ['#c8b8a0', '#efe6d8', '#f7f1e8'],
        dusk: ['#5a3040', '#c47858', '#2a1810']
      },
      luxury: {
        night: ['#0a0a0a', '#1a1610', '#050505'],
        dawn: ['#2a2010', '#8a6a38', '#12100c'],
        day: ['#1a1814', '#3a3428', '#0c0c0a'],
        dusk: ['#1a1008', '#6a4a28', '#0a0806']
      },
      glass: {
        night: ['#000000', '#0a1020', '#000000'],
        dawn: ['#0a1028', '#4a3060', '#000810'],
        day: ['#061428', '#0a3a68', '#000810'],
        dusk: ['#100818', '#3a1848', '#000408']
      },
      nature: {
        night: ['#0c1410', '#1a2820', '#060a08'],
        dawn: ['#2a3828', '#c8a060', '#141c18'],
        day: ['#2a4838', '#6a9070', '#141c18'],
        dusk: ['#2a2818', '#8a6040', '#101410']
      }
    };
    const set = (palettes[theme] || palettes.default)[period];
    const level = motionLevel();
    sky.style.setProperty('--wx-page-1', set[0]);
    sky.style.setProperty('--wx-page-2', set[1]);
    sky.style.setProperty('--wx-page-3', set[2]);
    sky.style.setProperty('--wx-page-flat', set[2]);
    sky.setAttribute('data-period', period);
    sky.setAttribute('data-theme-sky', theme);

    // Soft ambient texture (not weather-condition FX)
    let fx = 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.12), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(255,255,255,.06), transparent 45%)';
    let op = 0.45;
    if (period === 'night') {
      fx = 'radial-gradient(circle at 72% 18%, rgba(255,255,255,.5) 0 1px, transparent 2px), radial-gradient(circle at 30% 40%, rgba(255,255,255,.28) 0 1px, transparent 2px), radial-gradient(ellipse at 50% 100%, rgba(80,100,180,.18), transparent 50%)';
      op = 0.4;
    } else if (period === 'dawn' || period === 'dusk') {
      fx = 'radial-gradient(ellipse at 50% 80%, rgba(255,180,120,.22), transparent 55%), radial-gradient(ellipse at 20% 10%, rgba(255,220,180,.15), transparent 40%)';
      op = 0.5;
    } else if (theme === 'minimal' || theme === 'elegant') {
      fx = 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.35), transparent 55%), radial-gradient(ellipse at 80% 40%, rgba(255,255,255,.12), transparent 40%)';
      op = 0.35;
    }
    sky.style.setProperty('--wx-page-fx', fx);
    sky.style.setProperty('--wx-page-fx-o', level === 'off' ? '0' : (level === 'reduced' ? String(op * 0.55) : String(op)));
    // Theme class for CSS light/dark text tuning
    document.body.classList.toggle('weather-sky-light', theme === 'minimal' || (theme === 'elegant' && period === 'day'));
    // Ensure living page ornaments (drifting blobs / sun disc) exist
    let live = sky.querySelector('.wx-page-live');
    if (!live) {
      live = document.createElement('div');
      live.className = 'wx-page-live';
      live.setAttribute('aria-hidden', 'true');
      live.innerHTML = `
        <div class="wx-page-blob wx-page-blob-1"></div>
        <div class="wx-page-blob wx-page-blob-2"></div>
        <div class="wx-page-blob wx-page-blob-3"></div>
        <div class="wx-page-sun"></div>
        <div class="wx-page-glow"></div>`;
      sky.appendChild(live);
    }
    // Position page sun by local clock (viewer time for ambient canvas)
    const pos = celestialPos(hour, false);
    sky.style.setProperty('--wx-page-sun-left', pos.left.toFixed(1) + '%');
    sky.style.setProperty('--wx-page-sun-top', Math.max(8, pos.top * 0.55).toFixed(1) + '%');
    sky.style.setProperty('--wx-page-sun-size', (pos.night ? 0 : Math.max(90, pos.size * 1.1)).toFixed(0) + 'px');
    sky.classList.toggle('wx-page--night', period === 'night');
    sky.classList.toggle('wx-page--day', period === 'day' || period === 'dawn' || period === 'dusk');
  }
  function applyPageSkyFromPacks() {
    applyAmbientPageSky();
  }

  const FETCH_MS = 14000;

  /** Merge caller signal with a timeout so hung Open-Meteo requests cannot freeze the list forever. */
  function withTimeoutSignal(outer, ms) {
    if (typeof AbortController !== 'function') return { signal: outer, cancel: function () {} };
    const ctl = new AbortController();
    let timer = 0;
    const abortFromOuter = function () {
      try { ctl.abort(); } catch (e) {}
    };
    if (outer) {
      if (outer.aborted) abortFromOuter();
      else outer.addEventListener('abort', abortFromOuter, { once: true });
    }
    timer = window.setTimeout(abortFromOuter, ms || FETCH_MS);
    return {
      signal: ctl.signal,
      cancel: function () {
        if (timer) window.clearTimeout(timer);
        timer = 0;
        if (outer) {
          try { outer.removeEventListener('abort', abortFromOuter); } catch (e) {}
        }
      }
    };
  }

  async function fetchJson(url, signal) {
    const wrap = withTimeoutSignal(signal, FETCH_MS);
    try {
      const res = await fetch(url, { signal: wrap.signal });
      if (res.status === 429) {
        const err = new Error('HTTP 429');
        err.name = 'RateLimitError';
        throw err;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      // Open-Meteo sometimes returns 200 + { error: true, reason: "..." }
      if (data && data.error) {
        const reason = String(data.reason || data.error || 'API error');
        const err = new Error(reason);
        err.name = /limit|429|rate/i.test(reason) ? 'RateLimitError' : 'ApiError';
        throw err;
      }
      return data;
    } finally {
      wrap.cancel();
    }
  }

  // ── Hybrid providers: NWS (US primary) + Open-Meteo (global / enrich / fallback) ──
  const NWS_BASE = 'https://api.weather.gov';
  const NWS_POINTS_LS = 'usa-travel-nws-points-v1';
  const NWS_POINTS_TTL = 7 * 24 * 60 * 60 * 1000;
  const nwsPointsMem = new Map();

  function roundCoord(n) {
    return Math.round(Number(n) * 10000) / 10000;
  }

  function isLikelyUs(c) {
    if (!c || c.lat == null || c.lon == null) return false;
    if (c.country && /united states|^usa$|^us$|u\.s\./i.test(String(c.country))) return true;
    try {
      if (MAJOR.some(function (m) { return sameCity(m, c); })) return true;
    } catch (e) {}
    const lat = Number(c.lat);
    const lon = Number(c.lon);
    if (!(lat === lat) || !(lon === lon)) return false;
    // Contiguous US
    if (lat >= 24.4 && lat <= 49.5 && lon >= -125.0 && lon <= -66.8) return true;
    // Alaska
    if (lat >= 51 && lat <= 72 && lon >= -170 && lon <= -129) return true;
    // Hawaii
    if (lat >= 18.8 && lat <= 22.4 && lon >= -160.5 && lon <= -154.7) return true;
    // Puerto Rico / USVI (rough)
    if (lat >= 17.6 && lat <= 18.6 && lon >= -67.5 && lon <= -64.5) return true;
    return false;
  }

  function getCachedNwsPoints(lat, lon) {
    const k = roundCoord(lat) + ',' + roundCoord(lon);
    if (nwsPointsMem.has(k)) return nwsPointsMem.get(k);
    try {
      const raw = localStorage.getItem(NWS_POINTS_LS);
      const all = raw ? JSON.parse(raw) : {};
      const hit = all[k];
      if (hit && hit.data && Date.now() - (hit.ts || 0) < NWS_POINTS_TTL) {
        nwsPointsMem.set(k, hit.data);
        return hit.data;
      }
    } catch (e) {}
    return null;
  }

  function setCachedNwsPoints(lat, lon, data) {
    const k = roundCoord(lat) + ',' + roundCoord(lon);
    nwsPointsMem.set(k, data);
    try {
      const raw = localStorage.getItem(NWS_POINTS_LS);
      const all = raw ? JSON.parse(raw) : {};
      all[k] = { ts: Date.now(), data: data };
      const keys = Object.keys(all);
      if (keys.length > 100) {
        keys.sort(function (a, b) { return (all[a].ts || 0) - (all[b].ts || 0); });
        keys.slice(0, keys.length - 70).forEach(function (x) { delete all[x]; });
      }
      localStorage.setItem(NWS_POINTS_LS, JSON.stringify(all));
    } catch (e) {}
  }

  function clearCachedNwsPoints(lat, lon) {
    const k = roundCoord(lat) + ',' + roundCoord(lon);
    nwsPointsMem.delete(k);
    try {
      const raw = localStorage.getItem(NWS_POINTS_LS);
      const all = raw ? JSON.parse(raw) : {};
      delete all[k];
      localStorage.setItem(NWS_POINTS_LS, JSON.stringify(all));
    } catch (e) {}
  }

  /** Full clear — used by Refresh so NWS grid points are re-fetched too */
  function clearAllNwsPointsCache() {
    nwsPointsMem.clear();
    try { localStorage.removeItem(NWS_POINTS_LS); } catch (e) {}
  }

  function shortForecastToCode(text, isNight) {
    const s = String(text || '').toLowerCase();
    if (/thunder|t-?storm|lightning/.test(s)) return 95;
    if (/blizzard|heavy snow|snow shower|flurries|snow|wintry/.test(s)) return 73;
    if (/sleet|ice pellet|freezing rain|freezing drizzle/.test(s)) return 66;
    if (/heavy rain|torrential/.test(s)) return 65;
    if (/rain shower|showers|rain|drizzle/.test(s)) return 63;
    if (/fog|mist|haze/.test(s)) return 45;
    if (/overcast/.test(s)) return 3;
    if (/mostly cloudy|partly cloudy|partly sunny|mostly sunny|partly clear/.test(s)) return 2;
    if (/cloud/.test(s)) return 3;
    if (/clear|sunny|fair|hot|cold/.test(s)) return 0;
    return isNight ? 1 : 2;
  }

  function parseWindMphToMs(str) {
    if (str == null) return null;
    if (typeof str === 'number' && Number.isFinite(str)) return str * 0.44704;
    const m = String(str).match(/(\d+)(?:\s*to\s*(\d+))?/i);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] != null ? Number(m[2]) : a;
    return ((a + b) / 2) * 0.44704;
  }

  function parseWindDir(str) {
    if (str == null) return null;
    if (typeof str === 'number' && Number.isFinite(str)) return str;
    const dirs = {
      N: 0, NNE: 22, NE: 45, ENE: 67, E: 90, ESE: 112, SE: 135, SSE: 157,
      S: 180, SSW: 202, SW: 225, WSW: 247, W: 270, WNW: 292, NW: 315, NNW: 337
    };
    const s = String(str).trim().toUpperCase();
    if (dirs[s] != null) return dirs[s];
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  function nwsTempToC(temp, unit) {
    if (temp == null || !Number.isFinite(Number(temp))) return null;
    const u = String(unit || 'F').toUpperCase();
    const t = Number(temp);
    return u === 'C' ? t : (t - 32) * 5 / 9;
  }

  function normalizeNws(city, points, forecast, hourlyDoc) {
    const periods = (forecast && forecast.properties && forecast.properties.periods) || [];
    const hPeriods = (hourlyDoc && hourlyDoc.properties && hourlyDoc.properties.periods) || [];
    const now = Date.now();
    let curP = null;
    for (let i = 0; i < hPeriods.length; i++) {
      const t0 = new Date(hPeriods[i].startTime).getTime();
      const t1 = hPeriods[i].endTime ? new Date(hPeriods[i].endTime).getTime() : t0 + 3600000;
      if (now >= t0 - 600000 && now < t1 + 600000) { curP = hPeriods[i]; break; }
      if (t0 > now) { curP = hPeriods[Math.max(0, i - 1)] || hPeriods[i]; break; }
    }
    if (!curP) curP = hPeriods[0] || periods[0] || null;
    const isNight = !!(curP && curP.isDaytime === false);
    const code = shortForecastToCode(curP && curP.shortForecast, isNight);
    const tempC = curP ? nwsTempToC(curP.temperature, curP.temperatureUnit) : null;

    const current = {
      time: curP && curP.startTime,
      temperature_2m: tempC,
      weather_code: code,
      wind_speed_10m: parseWindMphToMs(curP && curP.windSpeed),
      wind_direction_10m: parseWindDir(curP && curP.windDirection)
    };

    const hTime = [];
    const hTemp = [];
    const hCode = [];
    const hPop = [];
    const hWind = [];
    const hDir = [];
    hPeriods.slice(0, 72).forEach(function (p) {
      hTime.push(p.startTime);
      hTemp.push(nwsTempToC(p.temperature, p.temperatureUnit));
      hCode.push(shortForecastToCode(p.shortForecast, p.isDaytime === false));
      const pop = p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value;
      hPop.push(pop != null ? pop : null);
      hWind.push(parseWindMphToMs(p.windSpeed));
      hDir.push(parseWindDir(p.windDirection));
    });

    const byDay = {};
    periods.forEach(function (p) {
      const day = String(p.startTime || '').slice(0, 10);
      if (!day) return;
      if (!byDay[day]) byDay[day] = { max: -Infinity, min: Infinity, code: 2 };
      const c = nwsTempToC(p.temperature, p.temperatureUnit);
      if (c != null) {
        byDay[day].max = Math.max(byDay[day].max, c);
        byDay[day].min = Math.min(byDay[day].min, c);
      }
      if (p.isDaytime) byDay[day].code = shortForecastToCode(p.shortForecast, false);
    });
    const days = Object.keys(byDay).sort().slice(0, 10);
    const daily = {
      time: days,
      temperature_2m_max: days.map(function (d) {
        return Number.isFinite(byDay[d].max) ? byDay[d].max : null;
      }),
      temperature_2m_min: days.map(function (d) {
        return Number.isFinite(byDay[d].min) && byDay[d].min !== Infinity ? byDay[d].min : null;
      }),
      weather_code: days.map(function (d) { return byDay[d].code; })
    };

    const tz = points && points.properties && points.properties.timeZone;
    const weather = {
      timezone: tz,
      current: current,
      hourly: {
        time: hTime,
        temperature_2m: hTemp,
        weather_code: hCode,
        precipitation_probability: hPop,
        wind_speed_10m: hWind,
        wind_direction_10m: hDir
      },
      daily: daily
    };

    return {
      city: city,
      weather: weather,
      air: null,
      fetchedAt: Date.now(),
      source: 'nws',
      needsEnrich: true,
      nwsGrid: points && points.properties ? {
        office: points.properties.gridId,
        gridX: points.properties.gridX,
        gridY: points.properties.gridY,
        forecast: points.properties.forecast,
        forecastHourly: points.properties.forecastHourly
      } : null
    };
  }

  async function nwsFetchJson(url, signal) {
    const wrap = withTimeoutSignal(signal, FETCH_MS);
    try {
      const res = await fetch(url, {
        signal: wrap.signal,
        headers: { 'Accept': 'application/geo+json' }
      });
      if (res.status === 403) {
        const err = new Error('NWS 403');
        err.name = 'NwsForbidden';
        throw err;
      }
      if (res.status === 404) {
        const err = new Error('NWS 404');
        err.name = 'NwsNotFound';
        throw err;
      }
      if (!res.ok) throw new Error('NWS HTTP ' + res.status);
      return await res.json();
    } finally {
      wrap.cancel();
    }
  }

  async function loadNwsCity(c, signal) {
    const lat = roundCoord(c.lat);
    const lon = roundCoord(c.lon);
    let points = getCachedNwsPoints(lat, lon);
    if (!points) {
      points = await nwsFetchJson(NWS_BASE + '/points/' + lat + ',' + lon, signal);
      setCachedNwsPoints(lat, lon, points);
    }
    const props = points.properties || {};
    if (!props.forecast) throw new Error('NWS missing forecast URL');

    async function loadForecasts(pt) {
      const p = pt.properties || {};
      const forecast = await nwsFetchJson(p.forecast, signal);
      const hourly = p.forecastHourly
        ? await nwsFetchJson(p.forecastHourly, signal).catch(function () { return null; })
        : null;
      return { forecast: forecast, hourly: hourly, points: pt };
    }

    let result;
    try {
      result = await loadForecasts(points);
    } catch (e) {
      if (e && e.name === 'NwsNotFound') {
        clearCachedNwsPoints(lat, lon);
        points = await nwsFetchJson(NWS_BASE + '/points/' + lat + ',' + lon, signal);
        setCachedNwsPoints(lat, lon, points);
        result = await loadForecasts(points);
      } else {
        throw e;
      }
    }
    // Alerts loaded on detail open (not list) to avoid N× alert requests.
    const pack = normalizeNws(c, result.points, result.forecast, result.hourly);
    pack.alerts = null; // pending — filled by ensureNwsAlerts
    return pack;
  }

  const SEVERITY_RANK = { extreme: 0, severe: 1, moderate: 2, minor: 3, unknown: 4 };

  function severityRank(s) {
    const k = String(s || 'unknown').toLowerCase();
    return SEVERITY_RANK[k] != null ? SEVERITY_RANK[k] : 4;
  }

  /**
   * NWS product text often has fixed-width hard wraps, and sometimes
   * pathological one-character-per-line blobs. Normalize for readable UI.
   */
  function normalizeNwsText(raw) {
    if (!raw) return '';
    var t = String(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = t.split('\n');
    var nonEmpty = lines.filter(function (l) { return l.trim().length > 0; });
    var shortCount = 0;
    for (var i = 0; i < nonEmpty.length; i++) {
      if (nonEmpty[i].trim().length <= 2) shortCount++;
    }
    // Character-per-line garbage → rejoin into words
    if (nonEmpty.length >= 6 && shortCount >= nonEmpty.length * 0.5) {
      var allSingle = nonEmpty.every(function (l) { return l.trim().length === 1; });
      t = nonEmpty.map(function (l) { return l.trim(); }).join(allSingle ? '' : ' ');
      t = t.replace(/([.!?])([A-Z*])/g, '$1 $2');
      return t.replace(/  +/g, ' ').trim();
    }
    // Fixed-width wrap: single newlines → space; keep blank lines as paragraphs
    t = lines.map(function (l) { return l.replace(/[ \t]+$/g, ''); }).join('\n');
    t = t.replace(/\n{3,}/g, '\n\n');
    t = t.replace(/([^\n])\n(?!\n)/g, '$1 ');
    t = t.replace(/[ \t]{2,}/g, ' ');
    // Soft-wrap artifacts: space before punctuation
    t = t.replace(/ ([.,;:!?])/g, '$1');
    return t.trim();
  }

  function dedupeAlerts(list) {
    if (!list || !list.length) return [];
    var out = [];
    var seenId = new Set();
    var seenSoft = new Set();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!a) continue;
      var id = a.id ? String(a.id) : '';
      // Same event + end time = same product (NWS often duplicates multi-geometry)
      var soft = String(a.event || '').toLowerCase() + '|' + String(a.ends || '');
      if (id && seenId.has(id)) continue;
      if (seenSoft.has(soft)) continue;
      if (id) seenId.add(id);
      seenSoft.add(soft);
      out.push(a);
    }
    out.sort(function (a, b) {
      return severityRank(a.severity) - severityRank(b.severity);
    });
    return out;
  }

  /** Active NWS watches/warnings/advisories for a lat/lon (US only). Best-effort. */
  async function loadNwsAlerts(lat, lon, signal) {
    const url = NWS_BASE + '/alerts/active?point=' + lat + ',' + lon;
    const doc = await nwsFetchJson(url, signal);
    const features = (doc && doc.features) || [];
    const out = [];
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      const p = (f && f.properties) || {};
      if (!p.event && !p.headline) continue;
      const mt = String(p.messageType || '').toLowerCase();
      if (mt === 'cancel') continue;
      const status = String(p.status || '').toLowerCase();
      if (status === 'test' || status === 'draft' || status === 'exercise') continue;
      out.push({
        id: p.id || (f && f.id) || ('alert-' + i),
        event: p.event || 'Alert',
        severity: p.severity || 'Unknown',
        urgency: p.urgency || '',
        certainty: p.certainty || '',
        headline: normalizeNwsText(p.headline || p.event || ''),
        description: normalizeNwsText(p.description || ''),
        instruction: normalizeNwsText(p.instruction || ''),
        ends: p.ends || p.expires || null,
        senderName: p.senderName || 'NWS',
        areaDesc: normalizeNwsText(p.areaDesc || '')
      });
    }
    return dedupeAlerts(out).slice(0, 5);
  }

  function topAlert(pack) {
    if (!pack || !Array.isArray(pack.alerts) || !pack.alerts.length) return null;
    return pack.alerts[0];
  }

  function applyAlertsToPack(pack, alerts) {
    if (!pack) return;
    pack.alerts = Array.isArray(alerts) ? alerts : [];
    pack._alertsLoading = false;
    const key = pack.city ? cityKey(pack.city) : null;
    if (key) {
      const cached = cache.get(key);
      if (cached && cached.city && pack.city && sameCity(cached.city, pack.city)) {
        cached.alerts = pack.alerts;
        cached._alertsLoading = false;
      }
    }
  }

  /**
   * While true, city lists must not re-render. Initial load shows only the
   * progress bar, then one reveal after forecasts + alerts finish.
   */
  var listPaintLocked = false;
  var listPaintTimer = 0;
  var listPaintQueued = false;
  function cancelPendingListPaints() {
    listPaintQueued = false;
    if (listPaintTimer) {
      window.clearTimeout(listPaintTimer);
      listPaintTimer = 0;
    }
  }
  /** Only used after unlock for incidental single-city alert updates. */
  function scheduleListPaintFromAlerts() {
    if (listPaintLocked) return;
    listPaintQueued = true;
    if (listPaintTimer) return;
    listPaintTimer = window.setTimeout(function () {
      listPaintTimer = 0;
      if (!listPaintQueued || listPaintLocked) return;
      listPaintQueued = false;
      refreshListsFromCache({ skipAmbient: true });
    }, 500);
  }

  function captureOpenAlertTitles() {
    if (!detailMods) return [];
    var titles = [];
    detailMods.querySelectorAll('details.weather-alert[open]').forEach(function (d) {
      var tEl = d.querySelector('.weather-alert-title');
      var name = tEl ? String(tEl.textContent || '').trim() : '';
      if (name) titles.push(name);
    });
    return titles;
  }

  function restoreOpenAlertTitles(titles) {
    if (!detailMods || !titles || !titles.length) return;
    var want = {};
    for (var i = 0; i < titles.length; i++) want[titles[i]] = true;
    detailMods.querySelectorAll('details.weather-alert').forEach(function (d) {
      var tEl = d.querySelector('.weather-alert-title');
      var name = tEl ? String(tEl.textContent || '').trim() : '';
      if (name && want[name]) d.open = true;
    });
  }

  /**
   * Update only the alerts block in an open detail — never rebuild the whole
   * detail (that was collapsing expanded <details> mid-read).
   */
  function patchDetailAlerts(pack) {
    if (!pack || !pack.city || !detailMods || !isDetailVisible()) return;
    if (!openCity || !openCity.city || !sameCity(openCity.city, pack.city)) return;
    openCity.alerts = pack.alerts;
    var openTitles = captureOpenAlertTitles();
    var existing = detailMods.querySelector('.weather-alerts');
    var html = alertsBlockHtml(pack.alerts);
    if (!html) {
      if (existing) existing.remove();
      return;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var node = wrap.firstElementChild;
    if (!node) return;
    if (existing) existing.replaceWith(node);
    else detailMods.insertAdjacentElement('afterbegin', node);
    restoreOpenAlertTitles(openTitles);
  }

  function ensureNwsAlerts(pack) {
    if (!pack || !pack.city || pack.error) return;
    if (!isLikelyUs(pack.city)) {
      if (pack.alerts == null) pack.alerts = [];
      return;
    }
    if (Array.isArray(pack.alerts)) return;
    if (pack._alertsLoading) return;
    pack._alertsLoading = true;
    const city = pack.city;
    const lat = roundCoord(city.lat);
    const lon = roundCoord(city.lon);
    loadNwsAlerts(lat, lon, null).then(function (alerts) {
      applyAlertsToPack(pack, alerts || []);
      // Surgical DOM update only — full openDetail() was wiping open <details>
      patchDetailAlerts(pack);
      scheduleListPaintFromAlerts();
    }).catch(function () {
      applyAlertsToPack(pack, []);
      patchDetailAlerts(pack);
      scheduleListPaintFromAlerts();
    });
  }

  /**
   * Prefetch NWS alerts into cache. Returns a Promise — does NOT paint the list.
   * Caller paints once after this resolves (with forecasts).
   */
  var alertsPrefetchGen = 0;
  function prefetchAlertsForCache(onProgress) {
    const gen = ++alertsPrefetchGen;
    const pending = [];
    cache.forEach(function (pack) {
      if (!pack || !pack.city || pack.error || !pack.weather) return;
      if (!isLikelyUs(pack.city)) return;
      if (Array.isArray(pack.alerts) || pack._alertsLoading) return;
      pending.push(pack);
    });
    if (!pending.length) return Promise.resolve(0);

    let idx = 0;
    let finished = 0;
    const total = pending.length;
    const workers = Math.min(2, pending.length);

    return new Promise(function (resolve) {
      function oneDone() {
        finished += 1;
        if (typeof onProgress === 'function') {
          try { onProgress(finished, total); } catch (e) {}
        }
        if (finished >= total) resolve(total);
      }

      async function worker() {
        while (idx < pending.length && gen === alertsPrefetchGen) {
          const pack = pending[idx++];
          if (!pack || Array.isArray(pack.alerts) || pack._alertsLoading) {
            oneDone();
            continue;
          }
          pack._alertsLoading = true;
          try {
            const lat = roundCoord(pack.city.lat);
            const lon = roundCoord(pack.city.lon);
            const alerts = await loadNwsAlerts(lat, lon, null);
            if (gen !== alertsPrefetchGen) {
              resolve(finished);
              return;
            }
            applyAlertsToPack(pack, alerts || []);
          } catch (e) {
            if (gen !== alertsPrefetchGen) {
              resolve(finished);
              return;
            }
            applyAlertsToPack(pack, []);
          }
          oneDone();
        }
      }
      for (let w = 0; w < workers; w++) worker();
    });
  }

  /**
   * Turn NWS * WHAT... / * WHERE... blocks into scannable full-width sections.
   */
  function formatAlertDescHtml(raw) {
    var text = normalizeNwsText(raw || '');
    if (!text) return '';
    // Prefer NWS bullet sections
    var parts = text.split(/\s*\*\s+(?=(?:WHAT|WHERE|WHEN|IMPACTS|ADDITIONAL DETAILS)\.\.\.)/i);
    if (parts.length > 1) {
      var html = '<div class="weather-alert-sections">';
      for (var i = 0; i < parts.length; i++) {
        var chunk = parts[i].trim();
        if (!chunk) continue;
        var m = chunk.match(/^(WHAT|WHERE|WHEN|IMPACTS|ADDITIONAL DETAILS)\.\.\.\s*([\s\S]*)$/i);
        if (m) {
          var label = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
          if (label === 'Additional details') label = 'Details';
          var body = (m[2] || '').trim();
          if (body.length > 320) body = body.slice(0, 320).replace(/\s+\S*$/, '') + '…';
          html += '<div class="weather-alert-section">' +
            '<div class="weather-alert-section-label">' + escapeHtml(label) + '</div>' +
            '<p class="weather-alert-section-body">' + escapeHtml(body) + '</p>' +
            '</div>';
        } else {
          var free = chunk;
          if (free.length > 280) free = free.slice(0, 280).replace(/\s+\S*$/, '') + '…';
          html += '<p class="weather-alert-section-body">' + escapeHtml(free) + '</p>';
        }
      }
      html += '</div>';
      return html;
    }
    if (text.length > 520) text = text.slice(0, 520).replace(/\s+\S*$/, '') + '…';
    return '<p class="weather-alert-desc">' + escapeHtml(text) + '</p>';
  }

  function alertsBlockHtml(alerts) {
    if (!alerts || !alerts.length) return '';
    const title = t('weather.alerts', 'Weather Alerts');
    const cards = alerts.map(function (a) {
      const sev = String(a.severity || 'Unknown').toLowerCase();
      const sevClass = sev === 'extreme' || sev === 'severe'
        ? 'weather-alert--severe'
        : (sev === 'moderate' ? 'weather-alert--moderate' : 'weather-alert--minor');
      const until = a.ends
        ? t('weather.alertUntil', 'Until {time}').replace('{time}', formatClock(a.ends) || String(a.ends).slice(0, 16))
        : '';
      const head = a.event || t('weather.alert', 'Alert');
      const bodyParts = [];
      // Compact headline only if it adds info beyond the event name
      if (a.headline && a.headline !== a.event && a.headline.indexOf(a.event) !== 0) {
        bodyParts.push('<p class="weather-alert-headline">' + escapeHtml(a.headline) + '</p>');
      }
      if (a.description) {
        bodyParts.push(formatAlertDescHtml(a.description));
      }
      if (a.instruction) {
        var inst = a.instruction;
        if (inst.length > 420) inst = inst.slice(0, 420).replace(/\s+\S*$/, '') + '…';
        bodyParts.push(
          '<div class="weather-alert-action">' +
            '<div class="weather-alert-action-label">' +
              escapeHtml(lang() === 'zh' ? '应对建议' : lang() === 'ja' ? '対応' : lang() === 'es' ? 'Instrucciones' : 'What to do') +
            '</div>' +
            '<p class="weather-alert-instruction">' + escapeHtml(inst) + '</p>' +
          '</div>'
        );
      }
      if (a.areaDesc) {
        var area = a.areaDesc;
        if (area.length > 140) area = area.slice(0, 140).replace(/\s+\S*$/, '') + '…';
        bodyParts.push('<p class="weather-alert-area">' + escapeHtml(area) + '</p>');
      }
      bodyParts.push('<p class="weather-alert-source">' +
        escapeHtml(t('weather.alertSource', 'National Weather Service')) +
        (a.senderName ? ' · ' + escapeHtml(a.senderName) : '') +
        '</p>');
      return (
        // Collapsed by default — summary is the scannable Apple-style chip
        '<details class="weather-alert ' + sevClass + '">' +
          '<summary class="weather-alert-summary">' +
            '<span class="weather-alert-badge" aria-hidden="true">!</span>' +
            '<span class="weather-alert-title">' + escapeHtml(head) + '</span>' +
            (until ? '<span class="weather-alert-until">' + escapeHtml(until) + '</span>' : '') +
            '<span class="weather-alert-chevron" aria-hidden="true"></span>' +
          '</summary>' +
          '<div class="weather-alert-body">' + bodyParts.join('') + '</div>' +
        '</details>'
      );
    }).join('');
    return (
      '<div class="weather-alerts" role="region" aria-label="' + escapeHtml(title) + '">' +
        '<div class="weather-alerts-label">' + escapeHtml(title) + '</div>' +
        cards +
      '</div>'
    );
  }

  const FORECAST_Q =
    'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,precipitation'
    + '&hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure,uv_index'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum'
    + '&temperature_unit=celsius&wind_speed_unit=ms&timezone=auto&forecast_days=10';

  async function loadOpenMeteoCity(c, signal) {
    const wUrl = FORECAST + '?latitude=' + c.lat + '&longitude=' + c.lon + '&' + FORECAST_Q;
    const aUrl = AIR + '?latitude=' + c.lat + '&longitude=' + c.lon + '&current=us_aqi,pm2_5,pm10,european_aqi&timezone=auto';

    async function once() {
      const pair = await Promise.all([
        fetchJson(wUrl, signal),
        fetchJson(aUrl, signal).catch(function () { return null; })
      ]);
      return {
        weather: pair[0],
        air: pair[1],
        fetchedAt: Date.now(),
        city: c,
        source: 'open-meteo',
        needsEnrich: false
      };
    }

    try {
      let packed;
      try {
        packed = await once();
      } catch (e) {
        if (e && (e.name === 'RateLimitError' || (e.message && e.message.indexOf('429') >= 0))) {
          await new Promise(function (r) { window.setTimeout(r, 650); });
          if (signal && signal.aborted) throw e;
          packed = await once();
        } else {
          throw e;
        }
      }
      if (!packed.weather || !packed.weather.current) {
        return { error: true, city: c, fetchedAt: Date.now() };
      }
      return packed;
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      return { error: true, city: c, fetchedAt: Date.now() };
    }
  }

  async function enrichWithOpenMeteo(pack, signal) {
    if (!pack || !pack.weather || !pack.city || pack.error) return pack;
    try {
      const om = await loadOpenMeteoCity(pack.city, signal);
      if (!om || !om.weather || !om.weather.current) {
        pack.needsEnrich = false;
        return pack;
      }
      const cur = pack.weather.current || {};
      const ocur = om.weather.current || {};
      ['relative_humidity_2m', 'apparent_temperature', 'surface_pressure', 'visibility', 'precipitation'].forEach(function (k) {
        if (cur[k] == null && ocur[k] != null) cur[k] = ocur[k];
      });
      pack.weather.current = cur;

      const d = pack.weather.daily || {};
      const od = om.weather.daily || {};
      if (!d.sunrise && od.sunrise) d.sunrise = od.sunrise;
      if (!d.sunset && od.sunset) d.sunset = od.sunset;
      if (!d.uv_index_max && od.uv_index_max) d.uv_index_max = od.uv_index_max;
      if (!d.precipitation_sum && od.precipitation_sum) d.precipitation_sum = od.precipitation_sum;
      pack.weather.daily = d;

      const h = pack.weather.hourly || {};
      const oh = om.weather.hourly || {};
      ['relative_humidity_2m', 'apparent_temperature', 'surface_pressure', 'uv_index', 'precipitation', 'precipitation_probability'].forEach(function (k) {
        if ((h[k] == null || !h[k].length) && oh[k] && oh[k].length) h[k] = oh[k];
      });
      // Align enrich series times if NWS hourly empty for those keys but OM has full set
      if ((!h.time || !h.time.length) && oh.time) {
        h.time = oh.time;
        if (oh.temperature_2m) h.temperature_2m = oh.temperature_2m;
        if (oh.weather_code) h.weather_code = oh.weather_code;
      }
      pack.weather.hourly = h;

      if (!pack.air && om.air) pack.air = om.air;
      pack.source = pack.source === 'nws' || pack.source === 'nws+om' ? 'nws+om' : pack.source;
      pack.needsEnrich = false;
      pack.enrichedAt = Date.now();
    } catch (e) {
      pack.needsEnrich = false;
    }
    return pack;
  }

  /**
   * Load one city.
   * US: NWS → Open-Meteo fallback
   * Non-US: Open-Meteo only
   * opts.enrich: Open-Meteo gap-fill after NWS (detail open only)
   * opts.forceFetch: bypass TTL cache (manual/auto refresh)
   */
  async function loadCity(c, signal, opts) {
    opts = opts || {};
    const key = cityKey(c);
    const hit = cache.get(key);
    if (!opts.forceFetch && hit && hit.weather && Date.now() - hit.fetchedAt < REFRESH_MS - 5000) {
      if (opts.enrich && hit.needsEnrich) {
        const en = await enrichWithOpenMeteo(hit, signal);
        cache.set(key, en);
        return en;
      }
      return hit;
    }

    let pack = null;
    if (isLikelyUs(c)) {
      try {
        pack = await loadNwsCity(c, signal);
      } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        pack = null;
      }
    }

    if (!pack || pack.error || !pack.weather) {
      pack = await loadOpenMeteoCity(c, signal);
    }

    if (pack && pack.weather && opts.enrich && pack.needsEnrich) {
      pack = await enrichWithOpenMeteo(pack, signal);
    }

    if (pack) cache.set(key, pack);
    return pack || { error: true, city: c, fetchedAt: Date.now() };
  }

  // Smooth progress: never jump straight to ~85% — always ease from low values
  var progDisplay = 0;
  var progTarget = 0;
  var progRaf = 0;
  var progLabel = '';

  function paintProgressNow() {
    const fill = document.getElementById('weatherLoadFill');
    const pctEl = document.getElementById('weatherLoadPct');
    const label = document.getElementById('weatherLoadLabel');
    const bar = document.getElementById('weatherLoadBar');
    const p = Math.max(0, Math.min(100, Math.round(progDisplay)));
    if (fill) fill.style.width = p + '%';
    if (pctEl) pctEl.textContent = p + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(p));
    if (label && progLabel) label.textContent = progLabel;
  }

  function tickProgressAnim() {
    progRaf = 0;
    const diff = progTarget - progDisplay;
    if (Math.abs(diff) < 0.4) {
      progDisplay = progTarget;
      paintProgressNow();
      return;
    }
    // Ease toward target (readable climb from 0, no instant 85%)
    const step = Math.max(0.55, Math.abs(diff) * 0.13);
    progDisplay += diff > 0 ? step : -step;
    if ((diff > 0 && progDisplay > progTarget) || (diff < 0 && progDisplay < progTarget)) {
      progDisplay = progTarget;
    }
    paintProgressNow();
    progRaf = window.requestAnimationFrame(tickProgressAnim);
  }

  function setLoadProgress(pct, labelText) {
    progTarget = Math.max(0, Math.min(100, Number(pct) || 0));
    if (labelText) progLabel = labelText;
    if (!progRaf) progRaf = window.requestAnimationFrame(tickProgressAnim);
    // Also update label immediately for snappy copy
    const label = document.getElementById('weatherLoadLabel');
    if (label && progLabel) label.textContent = progLabel;
  }

  function resetLoadProgress() {
    if (progRaf) {
      try { window.cancelAnimationFrame(progRaf); } catch (e) {}
      progRaf = 0;
    }
    progDisplay = 0;
    progTarget = 0;
    progLabel = t('weather.loadingForecasts', 'Loading forecasts…');
    paintProgressNow();
  }

  function showWeatherLoadingUI() {
    listPaintLocked = true;
    cancelPendingListPaints();
    if (loadingEl) {
      loadingEl.hidden = false;
      loadingEl.className = 'weather-load-panel weather-load-panel--hero';
      loadingEl.innerHTML =
        '<div class="weather-load-card">' +
          '<div class="weather-load-orb" aria-hidden="true"></div>' +
          '<div class="weather-load-status">' +
            '<span id="weatherLoadLabel">' + escapeHtml(t('weather.loadingForecasts', 'Loading forecasts…')) + '</span>' +
            '<span class="weather-load-pct" id="weatherLoadPct">0%</span>' +
          '</div>' +
          '<div class="weather-load-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="weatherLoadBar" aria-label="Loading">' +
            '<div class="weather-load-fill" id="weatherLoadFill"></div>' +
          '</div>' +
          '<p class="weather-load-hint" id="weatherLoadHint">' +
            escapeHtml(t('weather.loadingHint', 'Fetching cities & alerts…')) +
          '</p>' +
        '</div>';
      resetLoadProgress();
      // Start gently at a few percent so the bar is visibly "alive"
      setLoadProgress(3, t('weather.loadingForecasts', 'Loading forecasts…'));
    }
    // Hide lists entirely until the single final paint — no skeleton thrash
    if (listEl) {
      listEl.innerHTML = '';
      listEl.hidden = true;
      listEl.classList.remove('weather-skeleton-list');
    }
    if (favListEl) { favListEl.innerHTML = ''; }
    if (myLocListEl) { myLocListEl.innerHTML = ''; }
    if (favBlock) favBlock.hidden = true;
    if (myLocBlock) myLocBlock.hidden = true;
    if (majorsBlock) majorsBlock.hidden = false;
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
  }

  /** Open-Meteo multi-location batch (non-US / fallback groups). */
  async function loadCityBatchOm(cities, signal) {
    if (!cities.length) return [];
    const lats = cities.map(function (c) { return c.lat; }).join(',');
    const lons = cities.map(function (c) { return c.lon; }).join(',');
    const wUrl = FORECAST + '?latitude=' + lats + '&longitude=' + lons + '&' + FORECAST_Q;
    const aUrl = AIR + '?latitude=' + lats + '&longitude=' + lons + '&current=us_aqi,pm2_5,pm10,european_aqi&timezone=auto';
    const weatherRaw = await fetchJson(wUrl, signal);
    const airRaw = await fetchJson(aUrl, signal).catch(function () { return null; });
    const weatherList = Array.isArray(weatherRaw) ? weatherRaw : [weatherRaw];
    const airList = airRaw == null ? [] : (Array.isArray(airRaw) ? airRaw : [airRaw]);
    const now = Date.now();
    return cities.map(function (c, i) {
      const weather = weatherList[i];
      if (!weather || !weather.current) {
        return { error: true, city: c, fetchedAt: now };
      }
      return {
        weather: weather,
        air: airList[i] || null,
        fetchedAt: now,
        city: c,
        source: 'open-meteo',
        needsEnrich: false
      };
    });
  }

  async function loadMany(cities, opts) {
    opts = opts || {};
    const quiet = !!opts.quiet;
    const forceFetch = !!opts.forceFetch;
    if (abortCtl) try { abortCtl.abort(); } catch (e) {}
    abortCtl = typeof AbortController === 'function' ? new AbortController() : null;
    const myCtl = abortCtl;
    const signal = abortCtl ? abortCtl.signal : undefined;
    const total = cities.length;
    const out = new Array(total);
    if (!quiet) setLoadProgress(5, t('weather.loadingForecasts', 'Loading forecasts…'));

    const usIdx = [];
    const omIdx = [];
    for (let i = 0; i < cities.length; i++) {
      if (isLikelyUs(cities[i])) usIdx.push(i);
      else omIdx.push(i);
    }

    let done = 0;
    function bump() {
      done++;
      if (signal && signal.aborted) return;
      if (quiet) return;
      // Forecasts: 5% → 62% (alerts continue 62% → 96%; never park at ~85% as the "start")
      const pct = 5 + Math.round((done / Math.max(1, total)) * 57);
      setLoadProgress(Math.min(62, pct), t('weather.loadingForecasts', 'Loading forecasts…')
        + ' (' + Math.min(done, total) + '/' + total + ')');
    }

    // US: NWS with limited concurrency (no OM enrich on list)
    async function nwsWorker(queue) {
      while (queue.length) {
        if (signal && signal.aborted) return;
        const idx = queue.shift();
        try {
          out[idx] = await loadCity(cities[idx], signal, { enrich: false, forceFetch: forceFetch });
        } catch (e) {
          if (e && e.name === 'AbortError') return;
          out[idx] = { error: true, city: cities[idx], fetchedAt: Date.now() };
        }
        cache.set(cityKey(cities[idx]), out[idx]);
        bump();
      }
    }

    const usQueue = usIdx.slice();
    await Promise.all([nwsWorker(usQueue), nwsWorker(usQueue), nwsWorker(usQueue)]);

    // Non-US (and any holes): Open-Meteo batch
    const needOm = [];
    for (let i = 0; i < cities.length; i++) {
      if (!out[i] || out[i].error || !out[i].weather) needOm.push(i);
    }
    // Prefer batch for pure non-US indices first
    const omCities = needOm.map(function (i) { return cities[i]; });
    if (omCities.length && !(signal && signal.aborted)) {
      const CHUNK = 20;
      try {
        for (let start = 0; start < omCities.length; start += CHUNK) {
          if (signal && signal.aborted) break;
          const slice = omCities.slice(start, start + CHUNK);
          const sliceIdx = needOm.slice(start, start + CHUNK);
          let packs;
          try {
            packs = await loadCityBatchOm(slice, signal);
          } catch (e) {
            if (e && e.name === 'AbortError') throw e;
            if (e && e.name === 'RateLimitError') {
              await new Promise(function (r) { window.setTimeout(r, 900); });
              packs = await loadCityBatchOm(slice, signal);
            } else {
              // sequential OM fallback for this chunk
              packs = [];
              for (let j = 0; j < slice.length; j++) {
                packs.push(await loadOpenMeteoCity(slice[j], signal));
              }
            }
          }
          for (let j = 0; j < packs.length; j++) {
            const idx = sliceIdx[j];
            // Don't overwrite a good NWS pack
            if (out[idx] && out[idx].weather && !out[idx].error) continue;
            out[idx] = packs[j];
            cache.set(cityKey(cities[idx]), packs[j]);
            bump();
          }
        }
      } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        for (let k = 0; k < needOm.length; k++) {
          const idx = needOm[k];
          if (out[idx] && out[idx].weather) continue;
          out[idx] = { error: true, city: cities[idx], fetchedAt: Date.now() };
          cache.set(cityKey(cities[idx]), out[idx]);
          bump();
        }
      }
    }

    for (let i = 0; i < total; i++) {
      if (!out[i]) {
        out[i] = { error: true, city: cities[i], fetchedAt: Date.now() };
        cache.set(cityKey(cities[i]), out[i]);
      }
    }

    if (signal && signal.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }
    if (myCtl && abortCtl !== myCtl) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }
    return out;
  }

  function clearWeatherSkeleton() {
    if (loadingEl) {
      loadingEl.hidden = true;
      loadingEl.className = 'weather-load-panel';
      loadingEl.innerHTML = '';
    }
    if (listEl) {
      listEl.hidden = false;
      listEl.classList.remove('weather-skeleton-list');
    }
  }

  function setUpdated(ts, el) {
    const target = el || updatedEl;
    if (!target) return;
    const d = new Date(ts || Date.now());
    target.textContent = t('weather.updated', 'Updated') + ' ' + d.toLocaleString(localeTag(), {
      hour: 'numeric', minute: '2-digit'
    });
  }
  function showError(msg) {
    if (!errorEl) return;
    if (!msg) { errorEl.hidden = true; errorEl.textContent = ''; return; }
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }

  function buildRowButton(pack) {
    const c = pack.city || {};
    const li = document.createElement('li');
    const fav = isFavorite(c);

    if (pack.error || !pack.weather || !pack.weather.current) {
      const row = document.createElement('div');
      row.className = 'weather-row';
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      row.innerHTML = `<div class="weather-row-main"><div class="weather-row-city">${escapeHtml(c.name || '?')}</div><div class="weather-row-meta">${escapeHtml(c.admin1 || '')}</div></div><div class="weather-row-temps"><div class="weather-row-temp">—</div></div>`;
      const retry = async () => {
        try {
          const fresh = await loadCity(c);
          openDetail(fresh);
          refreshListsFromCache();
        } catch (e) { showError(t('weather.error', 'Could not load weather data.')); }
      };
      row.addEventListener('click', retry);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); retry(); }
      });
      li.appendChild(row);
      return li;
    }

    const cur = pack.weather.current;
    const daily = pack.weather.daily || {};
    const code = cur.weather_code;
    const hi = daily.temperature_2m_max && daily.temperature_2m_max[0];
    const lo = daily.temperature_2m_min && daily.temperature_2m_min[0];
    let localTime = '';
    try {
      localTime = new Date().toLocaleTimeString(localeTag(), {
        timeZone: pack.weather.timezone || c.tz,
        hour: 'numeric', minute: '2-digit'
      });
    } catch (e) { localTime = ''; }
    const hour = localHourForPack(pack);
    const night = hour < 6 || hour >= 20;
    const seed = Math.abs(Math.round((c.lat || 0) * 100) + Math.round((c.lon || 0) * 10));

    const row = document.createElement('div');
    row.className = 'weather-row';
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    applySky(row, code, cur.time, {
      hour, seed, isRow: true,
      precipMm: cur.precipitation,
      windDeg: cur.wind_direction_10m
    });

    const alert = topAlert(pack);
    const alertSev = alert ? String(alert.severity || '').toLowerCase() : '';
    const alertTone = alertSev === 'extreme' || alertSev === 'severe'
      ? 'weather-row-alert--severe'
      : (alertSev === 'moderate' ? 'weather-row-alert--moderate' : 'weather-row-alert--minor');
    // Apple-style list: when an alert is active, surface it as the primary status line
    const statusLine = alert
      ? `<div class="weather-row-alert ${alertTone}"><span class="weather-row-alert-ico" aria-hidden="true">!</span><span>${escapeHtml(alert.event || t('weather.alert', 'Alert'))}</span></div>`
      : `<div class="weather-row-cond">${condIcon(code, night)}<span>${escapeHtml(condLabel(code))}</span></div>`;

    const main = document.createElement('div');
    main.className = 'weather-row-main';
    main.innerHTML = `
        <div class="weather-row-city">${escapeHtml(displayCityName(c))}</div>
        <div class="weather-row-meta">${escapeHtml(localTime)}${c.admin1 ? ' · ' + escapeHtml(c.admin1) : ''}</div>
        ${statusLine}`;

    const temps = document.createElement('div');
    temps.className = 'weather-row-temps';
    temps.innerHTML = `
        <div class="weather-row-temp">${fmtTemp(cur.temperature_2m)}</div>
        <div class="weather-row-hl">${t('weather.high', 'H')}:${fmtTemp(hi)}  ${t('weather.low', 'L')}:${fmtTemp(lo)}</div>`;

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'weather-row-star';
    star.setAttribute('aria-pressed', fav ? 'true' : 'false');
    star.setAttribute('aria-label', fav ? t('weather.unfavorite', 'Remove favorite') : t('weather.favorite', 'Favorite'));
    star.innerHTML = starIcon(fav);
    star.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(c);
      refreshListsFromCache();
      if (openCity && openCity.city && sameCity(openCity.city, c)) syncDetailFav(c);
    });

    const open = () => openDetail(pack);
    row.addEventListener('click', (e) => {
      if (e.target.closest('.weather-row-star')) return;
      open();
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    if (c.isMyLocation) {
      row.classList.add('weather-row--myloc');
      const cityEl = main.querySelector('.weather-row-city');
      if (cityEl) cityEl.insertAdjacentHTML('afterbegin', locBadgeHtml());
    }

    row.appendChild(main);
    row.appendChild(temps);
    row.appendChild(star);
    li.appendChild(row);
    return li;
  }

  function renderCityList(ul, packs) {
    if (!ul) return;
    ul.innerHTML = '';
    packs.forEach((pack) => ul.appendChild(buildRowButton(pack)));
  }

  function refreshListsFromCache(opts) {
    opts = opts || {};
    // Block mid-load repaints (this was the multi-refresh flicker)
    if (listPaintLocked && !opts.force) return;

    if (!myLocationCity) myLocationCity = loadMyLocation();
    const favs = loadFavorites();
    const favKeys = new Set(favs.map(cityKey));
    const myKey = myLocationCity ? cityKey(myLocationCity) : null;

    const myPacks = myLocationCity
      ? [cache.get(myKey) || { city: myLocationCity, error: true, fetchedAt: 0 }]
      : [];
    // Favorites exclude my-location pin (shown above)
    const favPacks = favs
      .filter((c) => !myKey || cityKey(c) !== myKey)
      .map((c) => cache.get(cityKey(c)) || { city: c, error: true, fetchedAt: 0 });
    const majorPacks = MAJOR
      .filter((c) => !favKeys.has(cityKey(c)) && (!myKey || cityKey(c) !== myKey))
      .map((c) => cache.get(cityKey(c)) || { city: c, error: true, fetchedAt: 0 });

    if (myLocBlock) myLocBlock.hidden = !myLocationCity;
    if (favBlock) favBlock.hidden = favPacks.length === 0;
    renderCityList(myLocListEl, myPacks);
    renderCityList(favListEl, favPacks);
    if (listEl) listEl.hidden = false;
    renderCityList(listEl, majorPacks);
    if (loadingEl) {
      loadingEl.hidden = true;
      loadingEl.className = 'weather-load-panel';
      loadingEl.innerHTML = '';
    }

    let latest = 0;
    [...myPacks, ...favPacks, ...majorPacks].forEach((p) => { latest = Math.max(latest, p.fetchedAt || 0); });
    if (latest) setUpdated(latest);
    if (!opts.skipAmbient) applyAmbientPageSky();
  }

  /** Page is foreground-active (auto-refresh only runs then). */
  function isPageActive() {
    try {
      return document.visibilityState === 'visible';
    } catch (e) {
      return true;
    }
  }

  /** Manual Refresh must always stay clickable; busy is visual only. */
  function setRefreshBusy(busy) {
    [refreshBtn, detailRefresh].forEach(function (btn) {
      if (!btn) return;
      // Never leave the control disabled — user can always re-trigger.
      btn.disabled = false;
      if (busy) {
        btn.setAttribute('aria-busy', 'true');
        btn.classList.add('is-busy');
      } else {
        btn.removeAttribute('aria-busy');
        btn.classList.remove('is-busy');
      }
    });
  }

  function clearAutoRefresh() {
    if (autoRefreshTimer) {
      try { clearInterval(autoRefreshTimer); } catch (e) {}
      autoRefreshTimer = null;
    }
  }

  /**
   * Auto-refresh every REFRESH_MS while the page is active.
   * Fully paused (timer cleared) when tab is hidden / inactive.
   * Rescheduling after a successful load resets the 10-minute clock.
   */
  function scheduleAutoRefresh() {
    clearAutoRefresh();
    if (!isPageActive()) return;
    autoRefreshTimer = setInterval(function () {
      if (!isPageActive()) return;
      // Don't stack on an in-flight manual/auto load
      if (refreshInflight) return;
      refresh(true, { quiet: true, reason: 'auto' });
    }, REFRESH_MS);
  }

  function onPageActivityChange() {
    if (isPageActive()) {
      scheduleAutoRefresh();
      // If data is stale after being away, quiet-refresh immediately
      const stale = !lastListFetch || (Date.now() - lastListFetch >= REFRESH_MS);
      if (stale && !refreshInflight) {
        refresh(true, { quiet: true, reason: 'resume' });
      }
    } else {
      clearAutoRefresh();
    }
  }

  /**
   * @param {boolean} force  Re-fetch from NWS + Open-Meteo (not cache-only paint)
   * @param {{ quiet?: boolean, reason?: string }} [opts]
   *   quiet: background refresh (auto/resume) — keep list visible, no progress lock
   */
  async function refresh(force, opts) {
    opts = opts || {};
    const quiet = !!opts.quiet;
    const gen = ++refreshGen;

    // Forced reload: ensure NWS + OM re-fetch
    if (force) {
      if (!quiet) {
        // Manual / first load: wipe layers so UI can show progress cleanly
        cache.clear();
        clearAllNwsPointsCache();
      } else {
        // Quiet auto: keep showing last good list; invalidate NWS grid + forceFetch
        clearAllNwsPointsCache();
      }
      alertsPrefetchGen++; // cancel any in-flight alert prefetch
      if (abortCtl) {
        try { abortCtl.abort(); } catch (e) {}
        abortCtl = null;
      }
    }

    showError('');
    // Manual always available — busy state only (re-click cancels prior gen)
    setRefreshBusy(true);

    if (!quiet) {
      if (favBlock) favBlock.hidden = true;
      if (myLocBlock) myLocBlock.hidden = true;
      // Single progress surface until forecasts + alerts complete — then one list paint
      showWeatherLoadingUI();
    }

    if (!myLocationCity) myLocationCity = loadMyLocation();
    const favs = loadFavorites();
    const cities = [];
    if (myLocationCity) cities.push(myLocationCity);
    favs.forEach((c) => {
      if (!myLocationCity || !sameCity(c, myLocationCity)) cities.push(c);
    });
    const seen = new Set(cities.map(cityKey));
    MAJOR.forEach((c) => { if (!seen.has(cityKey(c))) cities.push(c); });

    const run = (async () => {
      try {
        if (!quiet) {
          // Let the browser paint 0–3% before network work (avoids "starts at 85%")
          await new Promise(function (r) {
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(r);
            });
          });
        }
        if (gen !== refreshGen) return;

        await loadMany(cities, {
          quiet: quiet,
          forceFetch: !!force
        });
        if (gen !== refreshGen) return;
        lastListFetch = Date.now();

        // Phase 2: alerts
        if (!quiet) {
          setLoadProgress(64, t('weather.loadingAlerts', 'Checking weather alerts…'));
        }
        await prefetchAlertsForCache(function (done, total) {
          if (gen !== refreshGen || quiet) return;
          const pct = 64 + Math.round((done / Math.max(1, total)) * 32);
          setLoadProgress(Math.min(96, pct), t('weather.loadingAlerts', 'Checking weather alerts…')
            + ' (' + done + '/' + total + ')');
        });
        if (gen !== refreshGen) return;

        if (!quiet) {
          setLoadProgress(100, t('weather.loadingDone', 'Ready'));
          // Brief beat so the bar can ease to 100% before the list appears
          await new Promise(function (r) { window.setTimeout(r, 180); });
          if (gen !== refreshGen) return;
        }

        // ONE reveal (or quiet single paint over existing list)
        listPaintLocked = false;
        cancelPendingListPaints();
        if (!quiet) clearWeatherSkeleton();
        refreshListsFromCache({ force: true });

        let ok = 0;
        cache.forEach(function (p) { if (p && p.weather && !p.error) ok++; });
        if (ok) showError('');
        else if (!quiet) {
          showError(t('weather.error', 'Could not load weather data. Pull to refresh or try again shortly.'));
        }

        if (isDetailVisible() && openCity && openCity.city) {
          forceCloseSheet();
          const fresh = cache.get(cityKey(openCity.city));
          if (fresh && fresh.weather) openDetail(fresh);
        }
      } catch (e) {
        if (e && e.name === 'AbortError') {
          // Superseded by a newer refresh — leave UI to the winner
          if (gen === refreshGen) {
            listPaintLocked = false;
            if (!quiet) clearWeatherSkeleton();
            if (cache.size) refreshListsFromCache({ force: true });
            else if (!quiet) showError(t('weather.error', 'Could not load weather data.'));
          }
          return;
        }
        if (gen !== refreshGen) return;
        listPaintLocked = false;
        if (!quiet) {
          showError(t('weather.error', 'Could not load weather data.'));
          clearWeatherSkeleton();
        }
        if (cache.size) refreshListsFromCache({ force: true });
        else if (!quiet && listEl) {
          listEl.innerHTML = '';
          listEl.hidden = false;
        }
      } finally {
        if (gen === refreshGen) {
          listPaintLocked = false;
          setRefreshBusy(false);
          // Reset 10-minute auto clock after every completed cycle (while active)
          if (isPageActive()) scheduleAutoRefresh();
        }
      }
    })();
    refreshInflight = run;
    try {
      await run;
    } finally {
      if (refreshInflight === run) refreshInflight = null;
      // Belt-and-suspenders: never leave buttons disabled
      if (gen === refreshGen) setRefreshBusy(false);
      if (refreshBtn) refreshBtn.disabled = false;
      if (detailRefresh) detailRefresh.disabled = false;
    }
  }

  function syncDetailFav(c) {
    if (!detailFavBtn || !c) return;
    const fav = isFavorite(c);
    detailFavBtn.setAttribute('aria-pressed', fav ? 'true' : 'false');
    detailFavBtn.innerHTML = starIcon(fav);
    detailFavBtn.setAttribute('aria-label', fav ? t('weather.unfavorite', 'Remove favorite') : t('weather.favorite', 'Favorite'));
  }

  function dailyBarsHtml(daily) {
    const highs = daily.temperature_2m_max || [];
    const lows = daily.temperature_2m_min || [];
    const codes = daily.weather_code || [];
    const times = daily.time || [];
    const n = Math.min(10, times.length, highs.length, lows.length);
    let weekMin = Infinity;
    let weekMax = -Infinity;
    for (let i = 0; i < n; i++) {
      if (lows[i] != null) weekMin = Math.min(weekMin, lows[i]);
      if (highs[i] != null) weekMax = Math.max(weekMax, highs[i]);
    }
    if (!Number.isFinite(weekMin) || !Number.isFinite(weekMax) || weekMax <= weekMin) {
      weekMin = 0; weekMax = 1;
    }
    const span = weekMax - weekMin;
    let html = '<div class="weather-daily">';
    for (let i = 0; i < n; i++) {
      let day = '';
      try {
        day = new Date(times[i] + 'T12:00:00').toLocaleDateString(localeTag(), { weekday: 'short' });
      } catch (e) { day = ''; }
      const lo = lows[i];
      const hi = highs[i];
      const left = Math.max(0, Math.min(92, ((lo - weekMin) / span) * 100));
      let width = Math.max(8, ((hi - lo) / span) * 100);
      if (left + width > 100) width = 100 - left;
      const icon = condIcon(codes[i] || 0, false);
      html += `<div class="weather-daily-row">
        <span>${escapeHtml(day)}</span>
        <span>${icon}</span>
        <span class="weather-daily-track"><span class="weather-daily-bar" style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%"></span></span>
        <span class="weather-daily-lo">${fmtTemp(lo)}</span>
        <span class="weather-daily-hi">${fmtTemp(hi)}</span>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  /** Hoist fixed overlays to <body> once so viewport stacking is reliable. */
  function hoistOverlays() {
    if (overlaysHoisted) return;
    try {
      if (detailEl && detailEl.parentElement !== document.body) {
        document.body.appendChild(detailEl);
      }
      if (sheetEl && sheetEl.parentElement !== document.body) {
        document.body.appendChild(sheetEl);
      }
      // Sheet must paint after detail in DOM order
      if (detailEl && sheetEl && detailEl.parentElement === document.body) {
        document.body.appendChild(sheetEl);
      }
      overlaysHoisted = true;
    } catch (e) { /* keep in place */ }
  }

  function cancelDetailMotion() {
    detailMotionGen += 1;
    if (detailMotionTimer) {
      window.clearTimeout(detailMotionTimer);
      detailMotionTimer = 0;
    }
    if (detailEnterTimer) {
      window.clearTimeout(detailEnterTimer);
      detailEnterTimer = 0;
    }
    if (detailCloseListener && detailEl) {
      try { detailEl.removeEventListener('transitionend', detailCloseListener); } catch (e) {}
      detailCloseListener = null;
    }
    return detailMotionGen;
  }

  function lockDetailPage() {
    try {
      document.body.classList.add('weather-detail-open');
      document.documentElement.classList.add('weather-detail-open');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (e) {}
  }

  function isDetailVisible() {
    return !!(detailEl && detailEl.classList.contains('open') && !detailEl.classList.contains('is-closing'));
  }

  function openDetail(pack) {
    if (!detailEl || !pack || !pack.weather) return;
    const prevCity = openCity && openCity.city;
    const cityChanged = !!(prevCity && pack.city && !sameCity(prevCity, pack.city));
    // Preserve expanded warnings across enrich / unit / language re-renders
    const keepAlertOpen = !cityChanged && isDetailVisible() ? captureOpenAlertTitles() : [];
    // Preserve alerts already loaded when enrich replaces the pack object
    if (!cityChanged && openCity && Array.isArray(openCity.alerts) && pack.alerts == null) {
      pack.alerts = openCity.alerts;
    }
    openCity = pack;
    const c = pack.city;
    const cur = pack.weather.current;
    const daily = pack.weather.daily || {};
    const hourly = pack.weather.hourly || {};
    {
      const hour = localHourForPack(pack);
      const seed = Math.abs(Math.round((c.lat || 0) * 100) + Math.round((c.lon || 0) * 10));
      const skyOpts = {
        hour, seed, isRow: false,
        precipMm: cur.precipitation,
        windDeg: cur.wind_direction_10m
      };
      // Gradient on shell; ornaments/rain only on sky layer (avoid double rain)
      applySky(detailEl, cur.weather_code, cur.time, Object.assign({}, skyOpts, { noOrnaments: true }));
      if (detailSky) {
        applySky(detailSky, cur.weather_code, cur.time, skyOpts);
        // Mirror mode class on shell so any host-scoped CSS still matches
        detailSky.classList.forEach((cls) => {
          if (cls.indexOf('wx-sky--') === 0) {
            detailEl.classList.remove('wx-sky--day', 'wx-sky--night', 'wx-sky--cloud', 'wx-sky--rain', 'wx-sky--storm', 'wx-sky--snow');
            detailEl.classList.add(cls);
          }
        });
        const base = detailSky.querySelector('.wx-layer-base');
        if (base) {
          base.style.background = 'linear-gradient(165deg, var(--wx-sky-1), var(--wx-sky-2))';
        }
      }
    }
    // Ensure back control is always interactive
    if (detailBack) {
      detailBack.hidden = false;
      detailBack.style.visibility = 'visible';
      detailBack.style.display = '';
    }

    const night = localHourForPack(pack) < 6 || localHourForPack(pack) >= 20;
    detailHero.innerHTML = `
      <h2>${escapeHtml(displayCityName(c))}</h2>
      <div class="weather-detail-temp">${fmtTemp(cur.temperature_2m)}</div>
      <div class="weather-detail-cond">${condIcon(cur.weather_code, night)} ${escapeHtml(condLabel(cur.weather_code))}</div>
      <div class="weather-detail-hl">${t('weather.high', 'H')}:${fmtTemp(daily.temperature_2m_max && daily.temperature_2m_max[0])}  ${t('weather.low', 'L')}:${fmtTemp(daily.temperature_2m_min && daily.temperature_2m_min[0])}</div>
      <div class="weather-detail-updated" id="weatherDetailUpdated"></div>`;
    setUpdated(pack.fetchedAt, $('weatherDetailUpdated'));
    syncDetailFav(c);

    // NWS severe weather / disaster alerts (Apple Weather–style banner stack)
    ensureNwsAlerts(pack);

    const aqi = pack.air && pack.air.current && pack.air.current.us_aqi;
    const mods = [];
    {
      const alertHtml = alertsBlockHtml(pack.alerts);
      if (alertHtml) mods.push(alertHtml);
    }
    mods.push(modHtml(
      'aqi', t('weather.aqi', 'Air Quality'),
      aqi != null ? String(Math.round(aqi)) : '—',
      aqiLabel(aqi) || '',
      true, false, aqiBarHtml(aqi, true)
    ));
    {
      const feels = cur.apparent_temperature;
      const delta = feels != null && cur.temperature_2m != null ? feels - cur.temperature_2m : null;
      let feelsSub = '';
      if (delta != null) {
        const abs = Math.abs(Math.round(delta));
        if (abs < 1) feelsSub = lang() === 'zh' ? '与气温相近' : lang() === 'ja' ? '気温に近い' : lang() === 'es' ? 'Similar a la temperatura' : 'Similar to actual';
        else if (delta > 0) feelsSub = (lang() === 'zh' ? '比气温高 ' : lang() === 'ja' ? '気温より ' : lang() === 'es' ? 'Más cálido ' : 'Warmer by ') + abs + '°';
        else feelsSub = (lang() === 'zh' ? '比气温低 ' : lang() === 'ja' ? '気温より ' : lang() === 'es' ? 'Más fresco ' : 'Cooler by ') + abs + '°';
      }
      mods.push(modHtml('feels', t('weather.feelsLike', 'Feels like'), fmtTemp(feels), feelsSub, true));
    }
    {
      const rh = cur.relative_humidity_2m;
      mods.push(modHtml(
        'humidity', t('weather.humidity', 'Humidity'),
        rh != null && Number.isFinite(rh) ? Math.round(rh) + '%' : '—',
        '',
        true, false, humidityBarHtml(rh)
      ));
    }
    {
      const deg = cur.wind_direction_10m;
      const dirLab = degToCompass(deg) + (deg != null ? ' · ' + Math.round(deg) + '°' : '');
      mods.push(modHtml(
        'wind', t('weather.wind', 'Wind'),
        fmtWind(cur.wind_speed_10m),
        dirLab,
        true, false,
        windCompassMarkup(deg, 'mini')
      ));
    }
    {
      const uvv = daily.uv_index_max ? daily.uv_index_max[0] : null;
      let uvLab = '';
      if (uvv != null) {
        if (uvv >= 11) uvLab = lang() === 'zh' ? '极高' : lang() === 'ja' ? '極端' : lang() === 'es' ? 'Extremo' : 'Extreme';
        else if (uvv >= 8) uvLab = lang() === 'zh' ? '很高' : lang() === 'ja' ? '非常に高い' : lang() === 'es' ? 'Muy alto' : 'Very High';
        else if (uvv >= 6) uvLab = lang() === 'zh' ? '高' : lang() === 'ja' ? '高い' : lang() === 'es' ? 'Alto' : 'High';
        else if (uvv >= 3) uvLab = lang() === 'zh' ? '中等' : lang() === 'ja' ? '中' : lang() === 'es' ? 'Moderado' : 'Moderate';
        else uvLab = lang() === 'zh' ? '低' : lang() === 'ja' ? '低い' : lang() === 'es' ? 'Bajo' : 'Low';
      }
      mods.push(modHtml(
        'uv', t('weather.uv', 'UV Index'),
        uvv != null ? String(Math.round(uvv * 10) / 10) : '—',
        uvLab,
        true, false, uvBarHtml(uvv)
      ));
    }
    {
      const visSub = cur.visibility != null && cur.visibility < 5000
        ? (lang() === 'zh' ? '能见度偏低' : lang() === 'ja' ? '視程が低い' : lang() === 'es' ? 'Visibilidad reducida' : 'Reduced visibility')
        : '';
      mods.push(modHtml('vis', t('weather.visibility', 'Visibility'), fmtVis(cur.visibility), visSub, true));
    }
    {
      // Simple pressure trend from hourly if available
      let trend = '';
      try {
        const ht = hourly.time || [];
        const hp = hourly.surface_pressure || [];
        const now = Date.now();
        let idx = 0;
        for (let i = 0; i < ht.length; i++) {
          if (new Date(ht[i]).getTime() >= now - 3600000) { idx = i; break; }
        }
        if (idx >= 3 && hp[idx] != null && hp[idx - 3] != null) {
          const d = hp[idx] - hp[idx - 3];
          if (d > 0.8) trend = lang() === 'zh' ? '上升' : lang() === 'ja' ? '上昇' : lang() === 'es' ? 'Subiendo' : 'Rising';
          else if (d < -0.8) trend = lang() === 'zh' ? '下降' : lang() === 'ja' ? '低下' : lang() === 'es' ? 'Bajando' : 'Falling';
          else trend = lang() === 'zh' ? '稳定' : lang() === 'ja' ? '安定' : lang() === 'es' ? 'Estable' : 'Steady';
        }
      } catch (e) {}
      mods.push(modHtml('pressure', t('weather.pressure', 'Pressure'), fmtPress(cur.surface_pressure), trend, true));
    }
    {
      const dayPrecip = daily.precipitation_sum && daily.precipitation_sum[0];
      const sub = dayPrecip != null
        ? (lang() === 'zh' ? '今日累计 ' : lang() === 'ja' ? '今日 ' : lang() === 'es' ? 'Hoy ' : 'Today ') + fmtPrecip(dayPrecip)
        : '';
      mods.push(modHtml('precip', t('weather.precip', 'Precipitation'), fmtPrecip(cur.precipitation), sub, true));
    }

    // Hourly strip
    let hourlyHtml = '<div class="weather-hourly">';
    const times = hourly.time || [];
    const now = Date.now();
    let start = 0;
    for (let i = 0; i < times.length; i++) {
      if (new Date(times[i]).getTime() >= now - 3600000) { start = i; break; }
    }
    for (let i = start; i < Math.min(start + 24, times.length); i++) {
      let lab = '';
      try { lab = new Date(times[i]).toLocaleTimeString(localeTag(), { hour: 'numeric' }); } catch (e) { lab = ''; }
      const code = hourly.weather_code && hourly.weather_code[i];
      const h = (() => { try { return new Date(times[i]).getHours(); } catch (e) { return 12; } })();
      const pop = hourly.precipitation_probability && hourly.precipitation_probability[i];
      hourlyHtml += `<div class="weather-hourly-item">
        <div>${escapeHtml(i === start ? (lang() === 'zh' ? '现在' : lang() === 'ja' ? '現在' : lang() === 'es' ? 'Ahora' : 'Now') : lab)}</div>
        <div class="ic">${condIcon(code || 0, h < 6 || h >= 20)}</div>
        <div class="t">${fmtTemp(hourly.temperature_2m && hourly.temperature_2m[i])}</div>
        ${pop != null ? `<div class="p">${Math.round(pop)}%</div>` : ''}
      </div>`;
    }
    hourlyHtml += '</div>';
    mods.push(`<button type="button" class="weather-mod weather-mod-wide is-tappable" data-sheet="conditions"><div class="weather-mod-label">${modLabelIcon('conditions')}<span>${escapeHtml(t('weather.hourly', 'Hourly Forecast'))}</span></div>${hourlyHtml}</button>`);

    mods.push(`<div class="weather-mod weather-mod-wide"><div class="weather-mod-label">${escapeHtml(t('weather.daily', '10-Day Forecast'))}</div>${dailyBarsHtml(daily)}</div>`);

    const sr = daily.sunrise && daily.sunrise[0];
    const ss = daily.sunset && daily.sunset[0];
    const sunViz = `<div class="wx-sun-mod-times"><span>${escapeHtml(formatClock(sr))}</span><span>${escapeHtml(formatClock(ss))}</span></div>` + sunArcSvg(sr, ss, true);
    mods.push(modHtml('sun', t('weather.sunrise', 'Sunrise') + ' & ' + t('weather.sunset', 'Sunset'),
      '', sunViz, true, true));

    // Apple-style location attribution
    const placeBits = [displayCityName(c), c.admin1, c.country || (c.admin1 ? '' : '')].filter(Boolean);
    // Majors are US — append country label when missing
    if (!c.country && MAJOR.some((m) => sameCity(m, c))) {
      placeBits.push(countryLabelUS());
    }
    const placeStr = placeBits.filter((x, i, a) => a.indexOf(x) === i).join(', ');
    const forLine = t('weather.forLocation', 'Weather for {place}').replace('{place}', placeStr);
    mods.push(`<p class="weather-detail-attrib">${escapeHtml(forLine)}</p>`);

    detailMods.innerHTML = mods.join('');
    // Restore any expanded alerts the user had open before this re-render
    if (keepAlertOpen && keepAlertOpen.length) restoreOpenAlertTitles(keepAlertOpen);
    // Clicks use delegated handler on detailMods (bound once) — survives re-renders

    const isClosing = detailEl.classList.contains('is-closing');
    const wasOpen = detailEl.classList.contains('open') && !isClosing;

    hoistOverlays();

    // Opening a city (or switching cities) must never leave a units/info sheet
    // trapping the full-screen pointer layer over the list or detail.
    if (!wasOpen || cityChanged) {
      forceCloseSheet();
    } else if (sheetEl && !sheetEl.classList.contains('open')) {
      inertSheet();
    }

    detailEl.setAttribute('aria-hidden', 'false');
    detailEl.style.transform = 'none';
    detailEl.style.animation = '';
    lockDetailPage();

    // Scroll reset only when opening/switching cities — not on unit re-render
    if ((!wasOpen || cityChanged) && detailScroll) {
      detailScroll.scrollTop = 0;
      try { detailScroll.scrollTo(0, 0); } catch (e) {}
    }

    const motionGen = cancelDetailMotion();
    detailEl.classList.remove('is-closing');

    // Enter motion only when coming from closed (or reversing a close).
    // Unit/refresh re-renders while already open skip enter to avoid flicker.
    if (!wasOpen) {
      const reversing = isClosing;
      if (!reversing) {
        detailEl.classList.remove('open', 'wx-detail-enter');
        detailEl.style.transition = 'none';
        detailEl.style.opacity = '0';
        void detailEl.offsetWidth;
        detailEl.style.transition = '';
        detailEl.style.opacity = '';
      } else {
        detailEl.classList.remove('wx-detail-enter');
      }

      window.requestAnimationFrame(function () {
        if (motionGen !== detailMotionGen) return;
        window.requestAnimationFrame(function () {
          if (motionGen !== detailMotionGen) return;
          detailEl.classList.add('open', 'wx-detail-enter');
          if (detailEnterTimer) window.clearTimeout(detailEnterTimer);
          detailEnterTimer = window.setTimeout(function () {
            if (motionGen !== detailMotionGen) return;
            try { detailEl.classList.remove('wx-detail-enter'); } catch (e) {}
            detailEnterTimer = 0;
          }, 450);
        });
      });
    } else {
      detailEl.classList.add('open');
      detailEl.classList.remove('wx-detail-enter');
    }

    if (!wasOpen && detailBack && typeof detailBack.focus === 'function') {
      try { detailBack.focus({ preventScroll: true }); } catch (e2) { detailBack.focus(); }
    }

    // Open-Meteo gap-fill after NWS list paint (humidity, UV, sunrise, AQI, …)
    if (pack.needsEnrich && pack.city && !pack._enriching) {
      pack._enriching = true;
      const enrichKey = cityKey(pack.city);
      // Snapshot expanded alerts so enrich re-render can restore them
      const openTitlesBeforeEnrich = captureOpenAlertTitles();
      loadCity(pack.city, null, { enrich: true }).then(function (fresh) {
        if (!fresh || !fresh.weather) return;
        fresh._enriching = false;
        // Keep alerts from pre-enrich pack (enrich path does not re-fetch them)
        if (Array.isArray(pack.alerts)) fresh.alerts = pack.alerts;
        else if (openCity && Array.isArray(openCity.alerts)) fresh.alerts = openCity.alerts;
        cache.set(enrichKey, fresh);
        if (openCity && openCity.city && sameCity(openCity.city, pack.city) && isDetailVisible()) {
          // Stash titles for openDetail restore (also captured at openDetail entry)
          if (openTitlesBeforeEnrich.length && detailMods) {
            // openDetail will capture empty if we already rebuilt — set on pack for restore
            fresh._restoreAlertOpen = openTitlesBeforeEnrich;
          }
          openDetail(fresh);
          if (fresh._restoreAlertOpen) {
            restoreOpenAlertTitles(fresh._restoreAlertOpen);
            delete fresh._restoreAlertOpen;
          }
        }
      }).catch(function () {
        pack._enriching = false;
        pack.needsEnrich = false;
      });
    }
  }

  /**
   * Apple Weather-style module tile:
   * label (icon + title) → large value → subtitle → optional foot viz (bar / compass).
   * footHtml is always raw HTML (bars, compass), kept separate from sub text.
   */
  function modHtml(key, label, value, sub, tappable, subIsHtml, footHtml) {
    const tag = tappable ? 'button' : 'div';
    const type = tappable ? ' type="button"' : '';
    const ds = tappable ? ` data-sheet="${key}"` : '';
    const icon = modLabelIcon(key);
    const subBlock = !sub
      ? ''
      : (subIsHtml ? sub : `<div class="weather-mod-sub">${escapeHtml(sub)}</div>`);
    const valBlock = (value === '' || value == null)
      ? ''
      : `<div class="weather-mod-value">${escapeHtml(value)}</div>`;
    const foot = footHtml
      ? `<div class="weather-mod-foot" aria-hidden="true">${footHtml}</div>`
      : '';
    return `<${tag}${type} class="weather-mod${tappable ? ' is-tappable' : ''}"${ds}><div class="weather-mod-label">${icon}<span>${escapeHtml(label)}</span></div>${valBlock}${subBlock}${foot}</${tag}>`;
  }

  function countryLabelUS() {
    if (lang() === 'zh') return '美国';
    if (lang() === 'ja') return 'アメリカ合衆国';
    if (lang() === 'es') return 'Estados Unidos';
    return 'United States';
  }

  /** Display name for a city (localized majors when available). */
  function displayCityName(c) {
    if (!c) return '';
    const L = lang();
    if (c.names && c.names[L]) return c.names[L];
    // Lookup major by coordinates
    const key = cityKey(c);
    const cached = nameCache.get(L + ':' + key);
    if (cached) return cached;
    return c.name || '';
  }

  // lang → "lat,lon" → localized name
  const nameCache = new Map();
  let nameFetchTimer = 0;
  let namesFetching = false;

  async function ensureLocalizedMajorNames() {
    const L = lang();
    if (L === 'en' || namesFetching) return;
    namesFetching = true;
    try {
      // Batch a few at a time to avoid hammering geocode
      const pending = MAJOR.filter((c) => !nameCache.has(L + ':' + cityKey(c)));
      for (let i = 0; i < pending.length; i++) {
        const c = pending[i];
        const k = L + ':' + cityKey(c);
        try {
          const data = await fetchJson(
            `${GEOCODE}?name=${encodeURIComponent(c.name)}&count=3&language=${L === 'zh' ? 'zh' : L}&format=json`
          );
          const results = data.results || [];
          // Prefer nearest match to known lat/lon
          let best = results[0];
          let bestD = Infinity;
          results.forEach((r) => {
            const d = Math.abs(r.latitude - c.lat) + Math.abs(r.longitude - c.lon);
            if (d < bestD) { bestD = d; best = r; }
          });
          if (best && best.name) nameCache.set(k, best.name);
          else nameCache.set(k, c.name);
        } catch (e) {
          nameCache.set(k, c.name);
        }
        // Small yield every few requests
        if (i % 4 === 3) await new Promise((r) => setTimeout(r, 80));
      }
      // Persist lightly
      try {
        const obj = {};
        nameCache.forEach((v, k) => { if (k.startsWith(L + ':')) obj[k] = v; });
        sessionStorage.setItem('usa-travel-wx-names-' + L, JSON.stringify(obj));
      } catch (e) {}
      // Never re-paint during locked bootstrap; names apply on next unlock paint
      if (cache.size && !listPaintLocked) refreshListsFromCache({ skipAmbient: true });
    } finally {
      namesFetching = false;
    }
  }

  function loadNameCacheFromSession() {
    ['es', 'zh', 'ja'].forEach((L) => {
      try {
        const raw = sessionStorage.getItem('usa-travel-wx-names-' + L);
        if (!raw) return;
        const obj = JSON.parse(raw);
        Object.keys(obj).forEach((k) => nameCache.set(k, obj[k]));
      } catch (e) {}
    });
  }


  function hourlyWindow(hourly, hours) {
    const times = hourly.time || [];
    const now = Date.now();
    let start = 0;
    for (let i = 0; i < times.length; i++) {
      if (new Date(times[i]).getTime() >= now - 45 * 60 * 1000) { start = i; break; }
    }
    const end = Math.min(start + (hours || 24), times.length);
    return { start, end, times };
  }

  /**
   * Smooth open cubic path through points (Catmull–Rom → Bezier).
   * Avoids the jagged “connect the dots” look on hourly charts.
   */
  function smoothLinePath(pts) {
    if (!pts || pts.length < 2) return '';
    if (pts.length === 2) {
      return 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1)
        + ' L' + pts[1].x.toFixed(1) + ',' + pts[1].y.toFixed(1);
    }
    let d = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      // Gentle tension (÷6) — smooth without overshooting too hard on weather series
      let c1x = p1.x + (p2.x - p0.x) / 6;
      let c1y = p1.y + (p2.y - p0.y) / 6;
      let c2x = p2.x - (p3.x - p1.x) / 6;
      let c2y = p2.y - (p3.y - p1.y) / 6;
      // Soft-clamp Y so curves don’t spike wildly past local min/max
      const yLo = Math.min(p1.y, p2.y) - 12;
      const yHi = Math.max(p1.y, p2.y) + 12;
      c1y = Math.max(yLo, Math.min(yHi, c1y));
      c2y = Math.max(yLo, Math.min(yHi, c2y));
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1)
        + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1)
        + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
    }
    return d;
  }

  /** Apple-style scrub chart used by Wind, Hourly, Humidity, etc. */
  function buildTempChart(hourly, key, unitFmt) {
    const { start, end, times } = hourlyWindow(hourly, 24);
    const vals = [];
    for (let i = start; i < end; i++) {
      const v = hourly[key] && hourly[key][i];
      if (v == null || Number.isNaN(v)) continue;
      vals.push({ i, t: times[i], v: Number(v) });
    }
    if (vals.length < 2) return '<p class="weather-chart-sub">—</p>';
    let min = Math.min(...vals.map((d) => d.v));
    let max = Math.max(...vals.map((d) => d.v));
    const padAmt = (max - min) * 0.14 || 1;
    min -= padAmt;
    max += padAmt;
    const span = (max - min) || 1;
    const W = 360, H = 176, padL = 10, padR = 10, padT = 14, padB = 28;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const pts = vals.map((d, idx) => {
      const x = padL + (idx / (vals.length - 1)) * plotW;
      const y = padT + (1 - (d.v - min) / span) * plotH;
      return { x, y, ...d };
    });
    const line = smoothLinePath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = line
      + ' L' + last.x.toFixed(1) + ',' + (H - padB).toFixed(1)
      + ' L' + first.x.toFixed(1) + ',' + (H - padB).toFixed(1)
      + ' Z';
    const id = 'wxChart' + Math.random().toString(36).slice(2, 8);
    // Default scrub position near “now” (first third) like Apple
    const mid = pts[Math.min(pts.length - 1, Math.max(0, Math.floor(pts.length * 0.22)))];
    const payload = pts.map((p) => ({ x: p.x, y: p.y, v: p.v, t: p.t }));
    // Subtle horizontal rules
    let grids = '';
    for (let g = 0; g < 4; g++) {
      const gy = padT + (g / 3) * plotH;
      grids += `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="rgba(255,255,255,.1)" stroke-width="1"/>`;
    }
    // Apple-style axis: only ~4 short hour marks (00 / 06 / 12 / 18), never dense “9:00 AM”
    const axisCount = Math.min(4, pts.length);
    let labels = '';
    for (let k = 0; k < axisCount; k++) {
      const i = axisCount === 1
        ? 0
        : Math.round((k / (axisCount - 1)) * (pts.length - 1));
      const p = pts[i];
      if (!p) continue;
      const lab = formatChartAxisHour(p.t);
      if (!lab) continue;
      const anchor = k === 0 ? 'start' : (k === axisCount - 1 ? 'end' : 'middle');
      labels += `<text class="wx-chart-axis" x="${p.x.toFixed(1)}" y="${H - 8}" fill="rgba(255,255,255,.48)" font-size="11" font-weight="500" letter-spacing="0.02em" text-anchor="${anchor}" font-family="system-ui,-apple-system,BlinkMacSystemFont,sans-serif" font-variant-numeric="tabular-nums">${escapeHtml(lab)}</text>`;
    }
    return `<div class="weather-chart-wrap weather-chart-card" data-chart="${id}" data-pts='${JSON.stringify(payload).replace(/'/g, '&#39;')}' data-kind="${key}" data-vw="${W}" data-vh="${H}" data-padt="${padT}" data-padb="${padB}">
      <div class="weather-chart-readout" data-readout>${escapeHtml(unitFmt(mid.v))}</div>
      <div class="weather-chart-sub" data-sub>${escapeHtml(formatClock(mid.t))}</div>
      <svg class="weather-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.38"/>
            <stop offset="40%" stop-color="#7ec8ff" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#3a7ab8" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${grids}
        <path d="${area}" fill="url(#${id}g)"/>
        <path d="${line}" fill="none" stroke="rgba(255,255,255,.95)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <line data-guide x1="${mid.x}" y1="${padT}" x2="${mid.x}" y2="${H - padB}" stroke="rgba(255,255,255,.75)" stroke-width="1.25" stroke-dasharray="4 4"/>
        <circle data-dot cx="${mid.x}" cy="${mid.y}" r="6.5" fill="#fff" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
        ${labels}
        <rect data-hit x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
      </svg>
    </div>`;
  }

  function bindCharts(root) {
    if (!root) return;
    root.querySelectorAll('.weather-chart-wrap').forEach((wrap) => {
      let pts;
      try { pts = JSON.parse((wrap.getAttribute('data-pts') || '[]').replace(/&#39;/g, "'")); } catch (e) { return; }
      const kind = wrap.getAttribute('data-kind') || '';
      if (!pts.length) return;
      const svg = wrap.querySelector('svg');
      const guide = wrap.querySelector('[data-guide]');
      const dot = wrap.querySelector('[data-dot]');
      const readout = wrap.querySelector('[data-readout]');
      const sub = wrap.querySelector('[data-sub]');
      const hit = wrap.querySelector('[data-hit]');
      if (!svg || !hit) return;
      const vw = Number(wrap.getAttribute('data-vw')) || 360;
      const padT = Number(wrap.getAttribute('data-padt')) || 12;
      const padB = Number(wrap.getAttribute('data-padb')) || 26;
      const vh = Number(wrap.getAttribute('data-vh')) || 176;
      let idx0 = Math.min(pts.length - 1, Math.max(0, Math.floor(pts.length * 0.22)));
      let curPt = pts[idx0];
      const formatVal = (v) => {
        if (kind === 'temperature_2m' || kind === 'apparent_temperature') return fmtTemp(v);
        if (kind === 'surface_pressure') return fmtPress(v);
        if (kind === 'wind_speed_10m') return fmtWind(v);
        if (kind === 'relative_humidity_2m') return Math.round(v) + '%';
        if (kind === 'precipitation') return fmtPrecip(v);
        if (kind === 'uv_index') return String(Math.round(v * 10) / 10);
        return String(Math.round(v * 10) / 10);
      };
      const paintImmediate = (x, y, pt) => {
        if (guide) {
          guide.setAttribute('x1', x);
          guide.setAttribute('x2', x);
          guide.setAttribute('y1', padT);
          guide.setAttribute('y2', vh - padB);
        }
        if (dot) {
          dot.setAttribute('cx', x);
          dot.setAttribute('cy', y);
        }
        if (readout) readout.textContent = formatVal(pt.v);
        if (sub) sub.textContent = formatClock(pt.t);
        curPt = pt;
      };
      paintImmediate(curPt.x, curPt.y, curPt);
      const scrub = (clientX) => {
        const rect = svg.getBoundingClientRect();
        if (!rect.width) return;
        const x = ((clientX - rect.left) / rect.width) * vw;
        // Nearest sample for honest reading
        let best = pts[0], bestD = Infinity;
        for (let i = 0; i < pts.length; i++) {
          const d = Math.abs(pts[i].x - x);
          if (d < bestD) { bestD = d; best = pts[i]; }
        }
        // Visual position interpolates along the polyline so the dot stays on the curve
        let i0 = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          if (x >= pts[i].x && x <= pts[i + 1].x) { i0 = i; break; }
          if (x > pts[i].x) i0 = i;
        }
        const a = pts[i0], b = pts[Math.min(i0 + 1, pts.length - 1)];
        const sp = (b.x - a.x) || 1;
        const u = Math.max(0, Math.min(1, (x - a.x) / sp));
        const px = a.x + (b.x - a.x) * u;
        const py = a.y + (b.y - a.y) * u;
        // Instant follow — no lerp lag
        paintImmediate(px, py, best);
      };
      const onMove = (e) => {
        const cx = e.clientX != null ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
        if (cx != null) {
          if (e.cancelable) e.preventDefault();
          scrub(cx);
        }
      };
      hit.style.touchAction = 'none';
      hit.style.cursor = 'ew-resize';
      // Hover + drag follow immediately
      hit.addEventListener('pointerdown', (e) => {
        hit.setPointerCapture && hit.setPointerCapture(e.pointerId);
        onMove(e);
      });
      hit.addEventListener('pointermove', onMove);
      hit.addEventListener('pointerenter', onMove);
      svg.addEventListener('pointermove', onMove);
      svg.addEventListener('mousemove', onMove);
    });
  }

  function uvGauge(v) {
    if (v == null) return '';
    const pct = Math.max(0, Math.min(100, (v / 12) * 100));
    let lab = 'Low';
    if (v >= 11) lab = 'Extreme';
    else if (v >= 8) lab = 'Very High';
    else if (v >= 6) lab = 'High';
    else if (v >= 3) lab = 'Moderate';
    return `<div class="weather-gauge"><span class="weather-gauge-dot" style="left:${pct.toFixed(1)}%"></span></div>
      <div class="weather-mod-sub">${escapeHtml(lab)}</div>`;
  }

  function sunArcSvg(sunriseIso, sunsetIso, compact) {
    const now = Date.now();
    let rise = sunriseIso ? new Date(sunriseIso).getTime() : now;
    let set = sunsetIso ? new Date(sunsetIso).getTime() : now + 1;
    if (set <= rise) set = rise + 1;
    let p = (now - rise) / (set - rise);
    p = Math.max(0, Math.min(1, p));
    const W = compact ? 280 : 320;
    const H = compact ? 64 : 88;
    const cx = W / 2, cy = H - 10, r = compact ? 100 : 118;
    const x = (ang) => cx + r * Math.cos(Math.PI - ang * Math.PI);
    const y = (ang) => cy - r * Math.sin(Math.PI - ang * Math.PI) * 0.55;
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const a = i / 48;
      d += (i ? ' L' : 'M') + x(a).toFixed(1) + ',' + y(a).toFixed(1);
    }
    const px = x(p), py = y(p);
    // Soft fill under daytime arc
    const area = d + ` L${x(1).toFixed(1)},${cy} L${x(0).toFixed(1)},${cy} Z`;
    return `<svg class="weather-sun-arc${compact ? ' weather-sun-arc--compact' : ''}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="${area}" fill="rgba(255,210,120,.12)"/>
      <path d="${d}" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2"/>
      <line x1="12" y1="${cy}" x2="${W - 12}" y2="${cy}" stroke="rgba(255,255,255,.22)" stroke-width="1"/>
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${compact ? 5 : 7}" fill="#ffe08a" stroke="#fff" stroke-width="1.5"/>
    </svg>`;
  }

  function formatDurationMs(ms) {
    if (!Number.isFinite(ms) || ms < 0) ms = 0;
    const totalMin = Math.round(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (lang() === 'zh') return h + ' 小时 ' + m + ' 分钟';
    if (lang() === 'ja') return h + '時間' + m + '分';
    if (lang() === 'es') return h + ' h ' + m + ' min';
    return h + ' hr ' + m + ' min';
  }

  /** Full-day sun path chart + metrics (Apple-inspired, civil twilight approx). */
  function buildSunDaySheet(sunriseIso, sunsetIso) {
    const now = Date.now();
    let rise = sunriseIso ? new Date(sunriseIso).getTime() : now;
    let set = sunsetIso ? new Date(sunsetIso).getTime() : now + 12 * 3600000;
    if (set <= rise) set = rise + 12 * 3600000;
    const TW = 35 * 60 * 1000; // civil twilight approx
    const firstLight = rise - TW;
    const lastLight = set + TW;
    const daylight = set - rise;
    const beforeRise = now < rise;
    const afterSet = now > set;
    const nextIsSunset = !beforeRise && !afterSet;
    const heroIso = beforeRise ? sunriseIso : (afterSet ? sunriseIso : sunsetIso);
    // If after sunset, hero is next sunrise (already tomorrow's in daily[0] for evening — use sunrise)
    // Daylight remaining / until event
    let remainLab = t('weather.daylightRemaining', 'Daylight remaining');
    let remainVal = formatDurationMs(Math.max(0, set - now));
    if (beforeRise) {
      remainLab = t('weather.untilSunrise', 'Until sunrise');
      remainVal = formatDurationMs(rise - now);
    } else if (afterSet) {
      remainLab = t('weather.untilSunrise', 'Until sunrise');
      // next sunrise ~ +24h if we only have today
      remainVal = formatDurationMs(rise + 24 * 3600000 - now);
    }
    const heroTitle = beforeRise || afterSet
      ? t('weather.sunrise', 'Sunrise')
      : t('weather.sunset', 'Sunset');

    // 24h elevation-style curve (sinusoid between rise/set, night below horizon)
    const W = 340, H = 150, padL = 8, padR = 8, padT = 16, padB = 28;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const dayStart = new Date(sunriseIso || Date.now());
    dayStart.setHours(0, 0, 0, 0);
    const day0 = dayStart.getTime();
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const tms = day0 + (i / 48) * 24 * 3600000;
      // elevation 0 at rise/set, 1 at solar noon, negative at night
      let elev = 0;
      if (tms >= rise && tms <= set) {
        const u = (tms - rise) / (set - rise);
        elev = Math.sin(u * Math.PI);
      } else if (tms < rise) {
        elev = -0.15 * Math.min(1, (rise - tms) / (6 * 3600000));
      } else {
        elev = -0.15 * Math.min(1, (tms - set) / (6 * 3600000));
      }
      const x = padL + (i / 48) * plotW;
      const y = padT + (1 - (elev + 0.2) / 1.2) * plotH;
      pts.push({ x, y, tms, elev });
    }
    const line = smoothLinePath(pts);
    // Horizon y at elev=0
    const horizonY = padT + (1 - (0 + 0.2) / 1.2) * plotH;
    // Current sun position
    let curIdx = 0;
    const fracDay = (now - day0) / (24 * 3600000);
    const curX = padL + Math.max(0, Math.min(1, fracDay)) * plotW;
    let curY = horizonY;
    for (let i = 0; i < pts.length - 1; i++) {
      if (curX >= pts[i].x && curX <= pts[i + 1].x) {
        const u = (curX - pts[i].x) / ((pts[i + 1].x - pts[i].x) || 1);
        curY = pts[i].y + (pts[i + 1].y - pts[i].y) * u;
        curIdx = i;
        break;
      }
    }
    const areaDay = (() => {
      // fill only above horizon between rise and set
      const riseX = padL + Math.max(0, Math.min(1, (rise - day0) / (24 * 3600000))) * plotW;
      const setX = padL + Math.max(0, Math.min(1, (set - day0) / (24 * 3600000))) * plotW;
      let d = '';
      pts.forEach((p, i) => {
        if (p.x < riseX || p.x > setX) return;
        d += (d ? ' L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
      });
      if (!d) return '';
      return d + ` L${setX.toFixed(1)},${horizonY.toFixed(1)} L${riseX.toFixed(1)},${horizonY.toFixed(1)} Z`;
    })();
    const hourLabs = [
      { f: 0, lab: '00' }, { f: 0.25, lab: '06' }, { f: 0.5, lab: '12' }, { f: 0.75, lab: '18' }, { f: 1, lab: '24' }
    ].map(({ f, lab }) => {
      const x = padL + f * plotW;
      return `<text x="${x.toFixed(1)}" y="${H - 8}" fill="rgba(255,255,255,.4)" font-size="10" text-anchor="middle" font-family="system-ui,sans-serif">${lab}</text>`;
    }).join('');

    let html = `<div class="wx-sheet-hero">
      <div class="weather-mod-label">${escapeHtml(heroTitle)}</div>
      <div class="weather-chart-readout">${escapeHtml(formatClock(heroIso))}</div>
      <div class="weather-chart-sub">${escapeHtml(remainLab)}: ${escapeHtml(remainVal)}</div>
    </div>`;
    html += `<div class="weather-chart-card wx-sun-day-card">
      <svg class="weather-chart weather-sun-day" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="${padL}" y1="${horizonY.toFixed(1)}" x2="${W - padR}" y2="${horizonY.toFixed(1)}" stroke="rgba(255,255,255,.28)" stroke-width="1"/>
        ${areaDay ? `<path d="${areaDay}" fill="rgba(255,210,120,.16)"/>` : ''}
        <path d="${line}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="7" fill="#ffe08a" stroke="#fff" stroke-width="1.5"/>
        ${hourLabs}
      </svg>
    </div>`;
    const fmtMs = (ms) => {
      try { return new Date(ms).toLocaleTimeString(localeTag(), { hour: 'numeric', minute: '2-digit' }); }
      catch (e) { return '—'; }
    };
    const rows = [
      [t('weather.firstLight', 'First Light'), fmtMs(firstLight)],
      [t('weather.sunrise', 'Sunrise'), formatClock(sunriseIso)],
      [t('weather.sunset', 'Sunset'), formatClock(sunsetIso)],
      [t('weather.lastLight', 'Last Light'), fmtMs(lastLight)],
      [t('weather.totalDaylight', 'Total Daylight'), formatDurationMs(daylight)]
    ];
    html += '<div class="wx-sun-metrics">';
    rows.forEach(([lab, val]) => {
      html += `<div class="wx-sun-metric"><span>${escapeHtml(lab)}</span><strong>${escapeHtml(val)}</strong></div>`;
    });
    html += '</div>';
    return html;
  }

  /**
   * Apple Weather-inspired wind compass (not a clock hand).
   * Arrow points where the wind is going TO (meteorological FROM + 180°).
   * size: 'mini' | 'full'
   */
  function windCompassMarkup(deg, size) {
    const from = deg == null ? 0 : Number(deg);
    const to = (from + 180) % 360;
    const cls = size === 'mini' ? 'weather-compass weather-compass--mini' : 'weather-compass weather-compass--full';
    return `<div class="${cls}" style="--wx-wind-from:${from}deg;--wx-wind-to:${to}deg" aria-hidden="true">
      <span class="wx-compass-tick wx-compass-tick--n">N</span>
      <span class="wx-compass-tick wx-compass-tick--e">E</span>
      <span class="wx-compass-tick wx-compass-tick--s">S</span>
      <span class="wx-compass-tick wx-compass-tick--w">W</span>
      <div class="wx-compass-ring"></div>
      <div class="wx-compass-arrow">
        <span class="wx-compass-arrow-head"></span>
        <span class="wx-compass-arrow-shaft"></span>
      </div>
      <div class="wx-compass-hub"></div>
    </div>`;
  }

  function windCompass(deg) {
    return `${windCompassMarkup(deg, 'full')}
      <div class="weather-chart-sub weather-compass-caption">${escapeHtml(degToCompass(deg))} · ${deg != null ? Math.round(deg) + '°' : '—'}</div>`;
  }

  function openSheet(kind, pack) {
    if (!sheetEl || !sheetBody || !pack || !pack.weather) return;
    if (kind === 'hourly' || kind === 'daily') return;

    const cur = pack.weather.current || {};
    const hourly = pack.weather.hourly || {};
    const daily = pack.weather.daily || {};
    const about = {
      humidity: {
        en: 'The relative humidity is the amount of moisture in the air compared to the maximum the air can hold at that temperature. High humidity can make warm air feel stickier and cooler air feel colder.',
        es: 'La humedad relativa es el vapor de agua en el aire respecto al máximo a esa temperatura. Una humedad alta hace que el calor se sienta más sofocante.',
        zh: '相对湿度是空气中水汽含量相对于当前温度下最大可容纳量的比例。湿度高时，炎热更闷、寒冷更刺骨。',
        ja: '相対湿度は、その気温で空気が保持できる最大の水蒸気量に対する実際の量の割合です。高いと蒸し暑く感じやすくなります。'
      },
      uv: {
        en: 'The UV Index measures the strength of ultraviolet radiation from the sun. 0–2 low, 3–5 moderate, 6–7 high, 8–10 very high, 11+ extreme. Use sun protection when the index is 3 or higher.',
        es: 'El índice UV mide la radiación ultravioleta. 0–2 bajo, 3–5 moderado, 6–7 alto, 8–10 muy alto, 11+ extremo. Usa protección solar a partir de 3.',
        zh: '紫外线指数衡量太阳紫外线强度。0–2 低，3–5 中等，6–7 高，8–10 很高，11+ 极高。指数≥3 时请注意防晒。',
        ja: 'UV指数は紫外線の強さの目安です。0–2低、3–5中、6–7高、8–10非常に高い、11+極端。3以上では対策を。'
      },
      aqi: {
        en: 'The U.S. Air Quality Index (AQI) is a measure of air pollution. Lower values are healthier. Sensitive groups should take care when AQI is above 100, and everyone when it is above 150.',
        es: 'El AQI de EE. UU. resume la contaminación del aire. Valores más bajos son mejores. Grupos sensibles deben cuidar por encima de 100.',
        zh: '美国空气质量指数（AQI）综合反映污染水平。数值越低越好。超过 100 时敏感人群需注意，超过 150 时所有人都应减少户外活动。',
        ja: '米国AQIは大気汚染の目安です。低いほど健康的です。100超で敏感な方は注意、150超では屋外活動を控えましょう。'
      },
      wind: {
        en: 'Wind speed and direction describe how air is moving. Direction is where the wind comes from. Gusts can be significantly stronger than sustained wind.',
        es: 'La velocidad y dirección del viento describen el movimiento del aire. La dirección indica de dónde sopla. Las rachas pueden ser mucho más fuertes.',
        zh: '风速与风向描述空气如何流动。风向指风的来向。阵风可能明显高于平均风速。',
        ja: '風速と風向は空気の流れを示します。風向は風の吹いてくる方向です。突風は平均よりかなり強くなることがあります。'
      },
      pressure: {
        en: 'Atmospheric pressure is the weight of air above you. Significant, rapid changes often precede weather shifts — falling pressure can mean rain is on the way; rising pressure often means clearing skies.',
        es: 'La presión atmosférica es el peso del aire. Cambios rápidos predicen el tiempo: bajar suele anticipar lluvia; subir, mejoría.',
        zh: '气压是头顶空气柱的重量。快速变化常预示天气转折：下降可能带来降雨，上升常表示转晴。',
        ja: '気圧は上空の空気の重さです。急変は天気の転換を示しやすく、低下は雨、上昇は回復の兆しになりがちです。'
      },
      vis: {
        en: 'Visibility is the distance at which objects can be clearly seen. Fog, heavy rain, snow, dust, and smoke reduce it — especially important when driving.',
        es: 'La visibilidad es la distancia a la que se ven objetos con claridad. Niebla, lluvia o humo la reducen — importante al conducir.',
        zh: '能见度是肉眼能清晰看见物体的距离。雾、大雨、雪、沙尘和烟雾都会降低能见度，驾车时尤其要注意。',
        ja: '視程は物体をはっきり見られる距離です。霧・大雨・雪・煙で低下し、運転時に特に重要です。'
      },
      precip: {
        en: 'Precipitation is any form of water — rain, snow, sleet, or hail — falling from clouds. Amounts may be shown for the current hour and totals for the day.',
        es: 'La precipitación es agua líquida o congelada que cae de las nubes. Puede mostrarse por hora y el total del día.',
        zh: '降水指从云中落下的雨、雪、霰或冰雹等。可查看当前小时降水量与全天累计。',
        ja: '降水は雲から降る雨・雪・みぞれ・ひょうなどの水です。時間ごとの量と日合計で示されます。'
      },
      sun: {
        en: 'Sunrise and sunset times depend on your location and the date. Day length changes through the seasons; the sun is highest near solar noon.',
        es: 'La salida y puesta del sol dependen de la ubicación y la fecha. La duración del día cambia con las estaciones.',
        zh: '日出日落时间取决于地点和日期。昼长随季节变化，太阳通常在正午前后最高。',
        ja: '日の出・日の入りは場所と日付で変わります。日照時間は季節で変化し、太陽は南中頃に最も高くなります。'
      },
      feels: {
        en: 'Feels Like accounts for humidity, wind, and sunlight so you know how the temperature will actually feel outdoors.',
        es: 'La sensación térmica tiene en cuenta humedad, viento y sol para indicar cómo se siente realmente la temperatura.',
        zh: '体感温度综合了湿度、风和日照，更贴近你在户外实际感受到的冷暖。',
        ja: '体感温度は湿度・風・日差しを加味し、屋外で実際にどう感じるかを示します。'
      },
      conditions: {
        en: 'Temperature through the day. Drag the chart to inspect any hour.',
        es: 'Temperatura a lo largo del día. Arrastra el gráfico para ver cada hora.',
        zh: '全天气温变化。拖动图表可查看任意时刻。',
        ja: '一日の気温の推移。グラフをなぞると各時刻を確認できます。'
      }
    };
    const titleMap = {
      humidity: t('weather.humidity', 'Humidity'),
      uv: t('weather.uv', 'UV Index'),
      aqi: t('weather.aqi', 'Air Quality'),
      wind: t('weather.wind', 'Wind'),
      pressure: t('weather.pressure', 'Pressure'),
      vis: t('weather.visibility', 'Visibility'),
      precip: t('weather.precip', 'Precipitation'),
      sun: t('weather.sunrise', 'Sunrise') + ' & ' + t('weather.sunset', 'Sunset'),
      feels: t('weather.feelsLike', 'Feels Like'),
      conditions: t('weather.hourly', 'Hourly Forecast')
    };

    const aboutTitle = lang() === 'zh' ? '说明' : lang() === 'ja' ? '説明' : lang() === 'es' ? 'Acerca de' : 'About';
    // Title row is rendered into the drag zone (grabber + icon + title) like about hub Preferences
    const sheetTitleHtml = `
      <div class="wx-sheet-head" data-sheet-title>
        <div class="wx-sheet-icon">${modLabelIcon(kind === 'conditions' ? 'conditions' : kind)}</div>
        <h3 class="wx-sheet-title">${escapeHtml(titleMap[kind] || t('weather.about', 'About'))}</h3>
      </div>`;
    let body = '';

    // Chart sheets: Apple pattern = title → large live value lives in chart readout → scrub chart → about
    if (kind === 'conditions') {
      // Chart owns the big readout (scrub updates it). Secondary context line above.
      body += `<p class="wx-sheet-context">${escapeHtml(condLabel(cur.weather_code))}</p>`;
      body += buildTempChart(hourly, 'temperature_2m', (v) => fmtTemp(v));
      body += `<p class="weather-mod-label" style="margin-top:16px">${escapeHtml(t('weather.feelsLike', 'Feels Like'))}</p>`;
      body += buildTempChart(hourly, 'apparent_temperature', (v) => fmtTemp(v));
    } else if (kind === 'feels') {
      body += `<p class="wx-sheet-context">${escapeHtml(condLabel(cur.weather_code))}</p>`;
      body += buildTempChart(hourly, 'apparent_temperature', (v) => fmtTemp(v));
    } else if (kind === 'humidity') {
      body += buildTempChart(hourly, 'relative_humidity_2m', (v) => Math.round(v) + '%');
    } else if (kind === 'wind') {
      // Direction as context; speed is the scrub readout
      body += `<p class="wx-sheet-context">${escapeHtml(degToCompass(cur.wind_direction_10m))}${cur.wind_direction_10m != null ? ' · ' + Math.round(cur.wind_direction_10m) + '°' : ''}</p>`;
      body += buildTempChart(hourly, 'wind_speed_10m', (v) => fmtWind(v));
      body += `<div class="wx-sheet-compass-row">${windCompass(cur.wind_direction_10m)}</div>`;
      body += `<p class="weather-mod-label">${escapeHtml(t('weather.units', 'Units'))}</p><div class="weather-units-row" id="wxWindUnits">`;
      [['mph', 'mph'], ['kmh', 'km/h'], ['ms', 'm/s'], ['bft', 'bft'], ['kn', 'kn']].forEach(([u, lab]) => {
        body += `<button type="button" data-u="${u}" class="${windUnit() === u ? 'active' : ''}">${lab}</button>`;
      });
      body += '</div>';
    } else if (kind === 'pressure') {
      body += buildTempChart(hourly, 'surface_pressure', (v) => fmtPress(v));
      body += `<div class="weather-units-row" id="wxPressUnits">`;
      ['hPa', 'mbar', 'inHg', 'mmHg', 'kPa'].forEach((u) => {
        body += `<button type="button" data-u="${u}" class="${pressUnit() === u ? 'active' : ''}">${u}</button>`;
      });
      body += '</div>';
    } else if (kind === 'uv') {
      const uv = daily.uv_index_max ? daily.uv_index_max[0] : null;
      if (hourly.uv_index) {
        body += buildTempChart(hourly, 'uv_index', (v) => String(Math.round(v * 10) / 10));
      } else {
        body += `<div class="wx-sheet-hero"><div class="weather-chart-readout">${uv != null ? Math.round(uv * 10) / 10 : '—'}</div></div>`;
      }
      body += uvGauge(uv);
    } else if (kind === 'aqi') {
      const aqi = pack.air && pack.air.current && pack.air.current.us_aqi;
      body += `<div class="wx-sheet-hero">
        <div class="weather-chart-readout" style="color:${aqiColor(aqi)}">${aqi != null ? Math.round(aqi) : '—'}</div>
        <div class="weather-chart-sub">${escapeHtml(aqiLabel(aqi) || t('weather.aqi', 'Air Quality'))}</div>
      </div>`;
      body += aqiBarHtml(aqi, false);
      if (pack.air && pack.air.current) {
        const pm = pack.air.current.pm2_5;
        const pm10 = pack.air.current.pm10;
        body += `<div class="wx-sheet-stats">
          <div class="wx-sheet-stat"><span class="wx-sheet-stat-lab">PM2.5</span><span class="wx-sheet-stat-val">${pm != null ? pm.toFixed(1) : '—'} µg/m³</span></div>
          <div class="wx-sheet-stat"><span class="wx-sheet-stat-lab">PM10</span><span class="wx-sheet-stat-val">${pm10 != null ? pm10.toFixed(1) : '—'} µg/m³</span></div>
        </div>`;
      }
    } else if (kind === 'precip') {
      if (hourly.precipitation) body += buildTempChart(hourly, 'precipitation', (v) => fmtPrecip(v));
      else {
        body += `<div class="wx-sheet-hero"><div class="weather-chart-readout">${escapeHtml(fmtPrecip(cur.precipitation))}</div></div>`;
      }
      body += `<div class="weather-units-row" id="wxPrecipUnits">`;
      [['in', 'in'], ['mm', 'mm'], ['cm', 'cm']].forEach(([u, lab]) => {
        body += `<button type="button" data-u="${u}" class="${precipUnit() === u ? 'active' : ''}">${lab}</button>`;
      });
      body += '</div>';
    } else if (kind === 'sun') {
      const sr = daily.sunrise && daily.sunrise[0];
      const ss = daily.sunset && daily.sunset[0];
      body += buildSunDaySheet(sr, ss);
    } else if (kind === 'vis') {
      body += `<div class="wx-sheet-hero">
        <div class="weather-chart-readout">${escapeHtml(fmtVis(cur.visibility))}</div>
        <div class="weather-chart-sub">${escapeHtml(t('weather.visibility', 'Visibility'))}</div>
      </div>`;
    }

    const blurb = about[kind];
    if (blurb) {
      body += `<div class="wx-sheet-about">
        <div class="wx-sheet-about-title">${escapeHtml(aboutTitle)} ${escapeHtml(titleMap[kind] || '')}</div>
        <p>${escapeHtml(blurb[lang()] || blurb.en)}</p>
      </div>`;
    }

    sheetBody.innerHTML = body;
    setSheetTitle(sheetTitleHtml);
    bindCharts(sheetBody);

    const bind = (id, setter) => {
      const row = document.getElementById(id);
      if (!row) return;
      row.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          setter(b.getAttribute('data-u'));
          const pack = openCity && openCity.city
            ? (cache.get(cityKey(openCity.city)) || openCity)
            : openCity;
          if (pack && pack.weather) {
            openDetail(pack);
            openSheet(kind, pack);
          }
        });
      });
    };
    bind('wxWindUnits', setWindUnit);
    bind('wxPrecipUnits', setPrecipUnit);
    bind('wxPressUnits', setPressUnit);

    presentSheet();
  }

  /* ── Bottom sheet presentation (iOS-style pop + drag dismiss) ──
     Pattern adapted from the about hub Preferences sheet. */
  const sheetPanel = $('weatherSheetPanel') || (sheetEl && sheetEl.querySelector('.weather-sheet-panel'));
  let sheetY = 0;
  let sheetGen = 0;
  let sheetSpringRaf = 0;
  let sheetOpen = false;

  function sheetReduceMotion() {
    return motionLevel() === 'off' || motionLevel() === 'reduced'
      || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function sheetHeight() {
    return (sheetPanel && sheetPanel.getBoundingClientRect().height) || 420;
  }

  function cancelSheetSpring() {
    if (sheetSpringRaf) {
      window.cancelAnimationFrame(sheetSpringRaf);
      sheetSpringRaf = 0;
    }
  }

  function applySheetY(y) {
    if (!sheetPanel) return;
    if (Math.abs(y) < 0.15) y = 0;
    sheetY = y;
    if (y === 0) sheetPanel.style.transform = '';
    else sheetPanel.style.transform = 'translate3d(0,' + y + 'px,0)';
  }

  function resetSheetInline() {
    cancelSheetSpring();
    sheetY = 0;
    if (!sheetPanel) return;
    sheetPanel.style.transform = '';
    sheetPanel.style.transition = '';
    sheetPanel.classList.remove('is-dragging');
    if (sheetEl) sheetEl.style.opacity = '';
  }

  /** Instantly inert sheet — no animation. Use when opening detail or recovering stuck UI. */
  function inertSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove('open', 'is-raised');
    sheetEl.setAttribute('aria-hidden', 'true');
    sheetEl.style.pointerEvents = 'none';
    sheetEl.style.opacity = '';
    resetSheetInline();
  }

  function forceCloseSheet() {
    sheetGen += 1;
    sheetOpen = false;
    inertSheet();
  }

  function isSheetOpen() {
    return !!(sheetEl && (sheetOpen || sheetEl.classList.contains('open')));
  }

  function setSheetTitle(html) {
    if (!sheetPanel) return;
    const dragZone = sheetPanel.querySelector('[data-sheet-grab]');
    if (!dragZone) return;
    let titleHost = dragZone.querySelector('[data-sheet-title-host]');
    if (!titleHost) {
      titleHost = document.createElement('div');
      titleHost.setAttribute('data-sheet-title-host', '');
      titleHost.className = 'wx-sheet-title-host';
      dragZone.appendChild(titleHost);
    }
    titleHost.innerHTML = html || '';
  }

  function presentSheet() {
    if (!sheetEl || !sheetPanel) return;
    hoistOverlays();
    sheetGen += 1;
    const gen = sheetGen;
    sheetOpen = true;
    resetSheetInline();
    sheetEl.classList.remove('open', 'is-raised');
    sheetEl.setAttribute('aria-hidden', 'false');
    sheetEl.style.pointerEvents = 'auto';
    // Force start below, then pop up next frames (snappy open)
    sheetPanel.style.transition = 'none';
    sheetPanel.style.transform = 'translate3d(0,100%,0)';
    sheetEl.classList.add('open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (gen !== sheetGen) return;
        const reduce = sheetReduceMotion();
        if (reduce) {
          sheetPanel.style.transition = '';
          sheetPanel.style.transform = '';
          sheetEl.classList.add('is-raised');
          return;
        }
        sheetPanel.style.transition = 'transform .38s cubic-bezier(0.32, 0.72, 0, 1)';
        sheetPanel.style.transform = 'translate3d(0,0,0)';
        sheetEl.classList.add('is-raised');
        window.setTimeout(function () {
          if (gen !== sheetGen) return;
          sheetPanel.style.transition = '';
          sheetPanel.style.transform = '';
        }, 400);
      });
    });
  }

  function closeSheet() {
    if (!sheetEl || !sheetPanel) return;
    if (!isSheetOpen()) {
      inertSheet();
      sheetOpen = false;
      return;
    }
    sheetGen += 1;
    const gen = sheetGen;
    sheetOpen = false;
    sheetPanel.classList.remove('is-dragging');
    const reduce = sheetReduceMotion();
    const closeMs = reduce ? 0 : 280;

    if (!reduce) {
      sheetPanel.style.transition = 'transform ' + closeMs + 'ms cubic-bezier(0.32, 0.72, 0, 1)';
      sheetPanel.style.transform = 'translate3d(0,100%,0)';
    }
    sheetEl.classList.remove('is-raised');
    // Drop backdrop immediately so modules/list stay tappable even if
    // the panel slide-out is still finishing.
    sheetEl.style.pointerEvents = 'none';
    window.setTimeout(function () {
      if (gen !== sheetGen) return;
      inertSheet();
    }, closeMs);
  }

  function finishDragClose() {
    forceCloseSheet();
  }

  function initSheetDrag() {
    if (!sheetEl || !sheetPanel) return;
    const grab = sheetPanel.querySelector('[data-sheet-grab]');
    if (!grab) return;

    const drag = { active: false, fingerStart: 0, yAtGrab: 0, samples: [] };

    function clientY(e) {
      if (e.touches && e.touches[0]) return e.touches[0].clientY;
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientY;
      return e.clientY;
    }
    function rubberband(overshoot, dimension, constant) {
      const c = constant == null ? 0.55 : constant;
      const d = Math.max(1, dimension);
      return (overshoot * d * c) / (d + c * Math.abs(overshoot));
    }
    function mapDragY(desired, reduce) {
      if (desired >= 0) return desired;
      if (reduce) return 0;
      const h = sheetHeight();
      return -rubberband(-desired, Math.max(120, h * 0.45), 0.55);
    }
    function recordSample(y) {
      const t = performance.now();
      drag.samples.push({ t: t, y: y });
      if (drag.samples.length > 6) drag.samples.shift();
    }
    function sampleVelocity() {
      if (drag.samples.length < 2) return 0;
      const a = drag.samples[0];
      const b = drag.samples[drag.samples.length - 1];
      const dt = b.t - a.t;
      if (dt < 8) return 0;
      return (b.y - a.y) / dt;
    }
    function updateBackdropForY(y) {
      if (!sheetEl) return;
      if (y <= 0) {
        sheetEl.style.opacity = '';
        return;
      }
      /* keep sheet chrome visible; dim backdrop via CSS variable */
      const o = Math.max(0.2, 1 - y / 320);
      sheetEl.style.setProperty('--wx-sheet-backdrop', String(o));
    }
    function springSheetTo(target, velocityPxMs, opts) {
      opts = opts || {};
      cancelSheetSpring();
      sheetPanel.style.transition = 'none';
      sheetPanel.classList.remove('is-dragging');
      const reduce = sheetReduceMotion();
      const gen = sheetGen;
      let pos = sheetY;
      let vel = velocityPxMs || 0;
      let lastT = performance.now();
      const response = reduce ? 0.22 : (opts.response != null ? opts.response : 0.32);
      const dampingRatio = reduce ? 1 : (opts.dampingRatio != null ? opts.dampingRatio : 0.86);
      const omega = (2 * Math.PI) / Math.max(0.12, response);
      const maxMs = opts.maxMs || 900;
      const startT = lastT;
      if (reduce) {
        applySheetY(target);
        updateBackdropForY(target);
        return;
      }
      function frame(now) {
        if (gen !== sheetGen) { sheetSpringRaf = 0; return; }
        const dt = Math.min(0.032, Math.max(0.001, (now - lastT) / 1000));
        lastT = now;
        const x = pos - target;
        const accel = -omega * omega * x - 2 * dampingRatio * omega * vel;
        vel += accel * dt;
        pos += vel * dt;
        applySheetY(pos);
        updateBackdropForY(pos);
        if (Math.abs(pos - target) < 0.4 && Math.abs(vel) < 0.05) {
          sheetSpringRaf = 0;
          applySheetY(target);
          updateBackdropForY(target);
          sheetPanel.style.transition = '';
          sheetEl.style.removeProperty('--wx-sheet-backdrop');
          return;
        }
        if (now - startT > maxMs) {
          sheetSpringRaf = 0;
          applySheetY(target);
          updateBackdropForY(target);
          sheetPanel.style.transition = '';
          return;
        }
        sheetSpringRaf = window.requestAnimationFrame(frame);
      }
      sheetSpringRaf = window.requestAnimationFrame(frame);
    }

    function onDragStart(e) {
      if (!sheetOpen || !sheetEl.classList.contains('open')) return;
      cancelSheetSpring();
      sheetPanel.style.transition = 'none';
      sheetPanel.classList.add('is-dragging');
      drag.active = true;
      drag.fingerStart = clientY(e);
      drag.yAtGrab = sheetY;
      drag.samples = [];
      recordSample(sheetY);
      if (e.pointerId != null && grab.setPointerCapture) {
        try { grab.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (e.cancelable) e.preventDefault();
    }
    function onDragMove(e) {
      if (!drag.active) return;
      const reduce = sheetReduceMotion();
      const raw = clientY(e) - drag.fingerStart;
      const y = mapDragY(drag.yAtGrab + raw, reduce);
      applySheetY(y);
      recordSample(y);
      updateBackdropForY(y);
      if (e.cancelable) e.preventDefault();
    }
    function onDragEnd() {
      if (!drag.active) return;
      drag.active = false;
      sheetPanel.classList.remove('is-dragging');
      const y = sheetY;
      const v = sampleVelocity();
      const h = sheetHeight();
      const reduce = sheetReduceMotion();
      const vPxS = v * 1000;
      const projected = y + (vPxS / 1000) * (0.998 / (1 - 0.998));
      const shouldClose =
        y > Math.min(120, h * 0.28)
        || (y > 40 && v > 0.45)
        || projected > Math.min(160, h * 0.38);

      if (shouldClose && y > 8) {
        cancelSheetSpring();
        sheetPanel.classList.remove('is-dragging');
        sheetPanel.style.transition = 'none';
        const gen = sheetGen;
        let pos = y;
        let vel = Math.max(v, reduce ? 1.2 : 0.55);
        let lastT = performance.now();
        const startT = lastT;
        function dismissFrame(now) {
          if (gen !== sheetGen) { sheetSpringRaf = 0; return; }
          const dt = Math.min(32, Math.max(1, now - lastT));
          lastT = now;
          if (!reduce) vel += 0.0028 * dt;
          pos += vel * dt;
          applySheetY(pos);
          updateBackdropForY(pos);
          if (pos >= h || now - startT > 700) {
            sheetSpringRaf = 0;
            finishDragClose();
            return;
          }
          sheetSpringRaf = window.requestAnimationFrame(dismissFrame);
        }
        sheetSpringRaf = window.requestAnimationFrame(dismissFrame);
      } else {
        const hasMomentum = Math.abs(v) > 0.12 || y < -6;
        springSheetTo(0, v, {
          dampingRatio: reduce ? 1 : hasMomentum ? 0.78 : 0.9,
          response: reduce ? 0.2 : hasMomentum ? 0.28 : 0.34,
          maxMs: 900
        });
      }
      drag.samples = [];
    }

    if (window.PointerEvent) {
      grab.addEventListener('pointerdown', onDragStart);
      grab.addEventListener('pointermove', onDragMove);
      grab.addEventListener('pointerup', onDragEnd);
      grab.addEventListener('pointercancel', onDragEnd);
    } else {
      grab.addEventListener('touchstart', onDragStart, { passive: false });
      grab.addEventListener('touchmove', onDragMove, { passive: false });
      grab.addEventListener('touchend', onDragEnd);
      grab.addEventListener('touchcancel', onDragEnd);
    }
  }
  initSheetDrag();
  function ensureOrnaments(host) {
    if (!host) return null;
    let box = host.querySelector('.wx-ornaments');
    if (!box) {
      box = document.createElement('div');
      box.className = 'wx-ornaments';
      box.setAttribute('aria-hidden', 'true');
      box.innerHTML = `
        <div class="wx-ornament wx-sun"></div>
        <div class="wx-ornament wx-moon"></div>
        <div class="wx-ornament wx-stars"></div>
        <div class="wx-ornament wx-cloud wx-cloud-1"></div>
        <div class="wx-ornament wx-cloud wx-cloud-2"></div>
        <div class="wx-ornament wx-cloud wx-cloud-3"></div>
        <div class="wx-ornament wx-rain" aria-hidden="true"></div>
        <div class="wx-ornament wx-snow" aria-hidden="true"></div>
        <div class="wx-ornament wx-lightning" aria-hidden="true"></div>`;
      host.appendChild(box);
    } else if (!box.querySelector('.wx-rain')) {
      // Upgrade ornaments created before rain layers existed
      box.insertAdjacentHTML('beforeend',
        '<div class="wx-ornament wx-rain" aria-hidden="true"></div>' +
        '<div class="wx-ornament wx-snow" aria-hidden="true"></div>' +
        '<div class="wx-ornament wx-lightning" aria-hidden="true"></div>');
    }
    return box;
  }
  function paintSkyMode(host, code, isoTime, opts) {
    if (!host) return;
    ensureOrnaments(host);
    opts = opts || {};
    let hour = opts.hour;
    if (hour == null) {
      hour = 12;
      try {
        if (isoTime && typeof isoTime === 'string') {
          const m = isoTime.match(/T(\d{2})/);
          if (m) hour = parseInt(m[1], 10);
          else hour = new Date(isoTime).getHours();
        } else hour = new Date().getHours();
      } catch (e) {}
    }
    const night = hour < 6 || hour >= 20;
    const c = code || 0;
    let mode = night ? 'night' : 'day';
    // WMO: drizzle 51–57, rain 61–67, snow 71–77, showers 80–82, snow showers 85–86, thunder 95–99
    if (c >= 95) mode = 'storm';
    else if ((c >= 51 && c < 70) || (c >= 80 && c < 85)) mode = 'rain';
    else if ((c >= 71 && c < 80) || (c >= 85 && c < 90)) mode = 'snow';
    else if (c >= 2 && c <= 3) mode = night ? 'night' : 'cloud';
    else if (c === 45 || c === 48) mode = 'cloud';
    host.classList.remove('wx-sky--day', 'wx-sky--night', 'wx-sky--cloud', 'wx-sky--rain', 'wx-sky--storm', 'wx-sky--snow');
    host.classList.add('wx-sky--' + mode);
    if (opts.isRow) host.classList.add('wx-sky--row');
    else host.classList.remove('wx-sky--row');
  }
  function unlockDetailPage() {
    try {
      document.body.classList.remove('weather-detail-open');
      document.documentElement.classList.remove('weather-detail-open');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    } catch (e) {}
    if (typeof ensureBodyScrollUnlocked === 'function') ensureBodyScrollUnlocked();
  }

  function finishDetailClose() {
    if (!detailEl) return;
    detailEl.classList.remove('open', 'wx-detail-enter', 'is-closing');
    detailEl.setAttribute('aria-hidden', 'true');
    detailEl.style.transform = 'none';
    detailEl.style.animation = '';
    detailEl.style.opacity = '';
    detailEl.style.transition = '';
    unlockDetailPage();
    openCity = null;
    forceCloseSheet();
  }

  function closeDetail() {
    if (!detailEl) return;
    const motionGen = cancelDetailMotion();
    const isOpen = detailEl.classList.contains('open') || detailEl.classList.contains('is-closing');

    detailEl.classList.remove('wx-detail-enter');
    detailEl.style.animation = '';
    detailEl.style.transform = 'none';
    detailEl.setAttribute('aria-hidden', 'true');
    openCity = null;
    forceCloseSheet();

    // Restore city list immediately — no solid-sky void under the fade.
    unlockDetailPage();

    if (!isOpen) {
      finishDetailClose();
      return;
    }

    detailEl.classList.add('is-closing');
    detailEl.classList.remove('open');

    const done = function () {
      if (motionGen !== detailMotionGen) return;
      if (detailCloseListener) {
        try { detailEl.removeEventListener('transitionend', detailCloseListener); } catch (e) {}
        detailCloseListener = null;
      }
      if (detailMotionTimer) {
        window.clearTimeout(detailMotionTimer);
        detailMotionTimer = 0;
      }
      finishDetailClose();
    };

    detailCloseListener = function (e) {
      if (e.target !== detailEl) return;
      if (e.propertyName && e.propertyName !== 'opacity') return;
      done();
    };
    detailEl.addEventListener('transitionend', detailCloseListener);
    detailMotionTimer = window.setTimeout(done, 220);
  }
  window.closeWeatherDetail = closeDetail;

  function closeSuggest() {
    if (!suggestEl || !searchEl) return;
    suggestEl.classList.remove('open');
    suggestEl.hidden = true;
    suggestEl.innerHTML = '';
    searchEl.setAttribute('aria-expanded', 'false');
  }
  function openSuggest() {
    if (!suggestEl || !searchEl) return;
    suggestEl.hidden = false;
    suggestEl.classList.add('open');
    searchEl.setAttribute('aria-expanded', 'true');
  }

  async function searchSuggest(q) {
    if (!suggestEl) return;
    if (!q || q.length < 2) {
      searchGen += 1;
      closeSuggest();
      return;
    }
    const gen = ++searchGen;
    try {
      const langParam = lang() === 'zh' ? 'zh' : lang() === 'ja' ? 'ja' : lang() === 'es' ? 'es' : 'en';
      const data = await fetchJson(`${GEOCODE}?name=${encodeURIComponent(q)}&count=8&language=${langParam}&format=json`);
      if (gen !== searchGen) return;
      const results = data.results || [];
      suggestEl.innerHTML = '';
      if (!results.length) {
        suggestEl.innerHTML = `<li class="s-empty">${escapeHtml(t('weather.emptySearch', 'No cities found.'))}</li>`;
        openSuggest();
        return;
      }
      results.forEach((r) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'option');
        const admin = [r.admin1, r.country].filter(Boolean).join(', ');
        btn.innerHTML = `<div class="s-name">${escapeHtml(r.name)}</div><div class="s-meta">${escapeHtml(admin)}</div>`;
        btn.addEventListener('click', async () => {
          const city = {
            name: r.name,
            admin1: r.admin1 || r.country || '',
            lat: r.latitude,
            lon: r.longitude,
            tz: r.timezone
          };
          closeSuggest();
          if (searchEl) searchEl.value = r.name;
          if (searchClear) {
            searchClear.hidden = false;
            searchClear.classList.add('show');
          }
          try {
            const pack = await loadCity(city);
            openDetail(pack);
          } catch (e) {
            showError(t('weather.error', 'Could not load weather data.'));
          }
        });
        li.appendChild(btn);
        suggestEl.appendChild(li);
      });
      openSuggest();
    } catch (e) {
      if (gen !== searchGen) return;
      suggestEl.innerHTML = `<li class="s-empty">${escapeHtml(t('weather.error', 'Could not load weather data.'))}</li>`;
      openSuggest();
    }
  }

  function openUnitsSheet() {
    if (!sheetEl || !sheetBody) return;
    hoistOverlays();
    setSheetTitle(`
      <div class="wx-sheet-head" data-sheet-title>
        <div class="wx-sheet-icon">${modLabelIcon('conditions')}</div>
        <h3 class="wx-sheet-title">${escapeHtml(t('weather.units', 'Units'))}</h3>
      </div>`);
    sheetBody.innerHTML =
      `<p class="weather-mod-label">${escapeHtml(t('weather.wind', 'Wind'))}</p>` +
      `<div class="weather-units-row" id="wxWindUnits2"></div>` +
      `<p class="weather-mod-label">${escapeHtml(t('weather.precip', 'Precipitation'))}</p>` +
      `<div class="weather-units-row" id="wxPrecipUnits2"></div>` +
      `<p class="weather-mod-label">${escapeHtml(t('weather.pressure', 'Pressure'))}</p>` +
      `<div class="weather-units-row" id="wxPressUnits2"></div>` +
      `<p class="wx-sheet-context" style="margin-top:12px">${escapeHtml(
        (useF() ? 'Temperature: °F (Settings)' : 'Temperature: °C (Settings)') +
        ' · ' +
        (useMi() ? 'Distance/visibility: mi' : 'Distance/visibility: km')
      )}</p>`;
    const fill = (id, units, current, setter) => {
      const row = document.getElementById(id);
      if (!row) return;
      units.forEach(([u, lab]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = lab;
        if (current === u) b.classList.add('active');
        b.addEventListener('click', () => {
          setter(u);
          row.querySelectorAll('button').forEach((x) => {
            x.classList.toggle('active', x === b);
          });
          refreshListsFromCache();
          if (openCity && openCity.weather && openCity.city) {
            const fresh = cache.get(cityKey(openCity.city)) || openCity;
            openDetail(fresh);
          }
        });
        row.appendChild(b);
      });
    };
    fill('wxWindUnits2', [['mph', 'mph'], ['kmh', 'km/h'], ['ms', 'm/s'], ['bft', 'bft'], ['kn', 'kn']], windUnit(), setWindUnit);
    fill('wxPrecipUnits2', [['in', 'in'], ['mm', 'mm'], ['cm', 'cm']], precipUnit(), setPrecipUnit);
    fill('wxPressUnits2', [['hPa', 'hPa'], ['mbar', 'mbar'], ['inHg', 'inHg'], ['mmHg', 'mmHg'], ['kPa', 'kPa']], pressUnit(), setPressUnit);
    presentSheet();
  }

  // Wire UI — manual refresh always works (re-click cancels prior load via refreshGen)
  if (refreshBtn) {
    refreshBtn.disabled = false;
    refreshBtn.addEventListener('click', function () {
      refresh(true, { quiet: false, reason: 'manual' });
    });
  }
  if (detailRefresh) {
    detailRefresh.disabled = false;
    detailRefresh.addEventListener('click', function () {
      // Always force NWS + Open-Meteo re-fetch. Quiet keeps detail open without
      // blanking the list under the overlay; re-click cancels prior load.
      refresh(true, { quiet: true, reason: 'manual-detail' });
    });
  }
  if (detailBack) detailBack.addEventListener('click', closeDetail);

  // Delegated module taps — stable across openDetail re-renders and node hoist
  if (detailMods && !detailMods._wxSheetBound) {
    detailMods._wxSheetBound = true;
    detailMods.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-sheet]') : null;
      if (!btn || !detailMods.contains(btn)) return;
      const kind = btn.getAttribute('data-sheet');
      if (!kind || !openCity) return;
      e.preventDefault();
      openSheet(kind, openCity);
    });
  }

  // Sheet must never intercept when closed (init safety)
  hoistOverlays();
  forceCloseSheet();
  if (detailFavBtn) {
    detailFavBtn.addEventListener('click', () => {
      if (!openCity || !openCity.city) return;
      toggleFavorite(openCity.city);
      syncDetailFav(openCity.city);
      refreshListsFromCache();
    });
  }
  if (sheetClose) sheetClose.addEventListener('click', closeSheet);
  if (sheetEl) sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl) closeSheet(); });
  if (unitsBtn) unitsBtn.addEventListener('click', openUnitsSheet);

  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showError(t('weather.error', 'Could not load weather data.'));
        return;
      }
      locateBtn.disabled = true;
      locateBtn.setAttribute('aria-busy', 'true');
      const prevTitle = locateBtn.getAttribute('title') || '';
      locateBtn.setAttribute('title', t('weather.locating', 'Getting location…'));
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          // Round to ~1 km (2 decimal degrees ≈ 1.1 km) — enough for weather grids; better privacy
          const lat = Math.round(pos.coords.latitude * 100) / 100;
          const lon = Math.round(pos.coords.longitude * 100) / 100;
          const place = await reverseGeocode(lat, lon);
          const city = {
            name: place.name,
            admin1: place.admin1 || '',
            lat, lon,
            tz: undefined,
            isMyLocation: true
          };
          saveMyLocation(city);
          await loadCity(city);
          refreshListsFromCache();
          // Card only — do not open detail
          if (myLocBlock) {
            try { myLocBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
          }
        } catch (e) {
          showError(t('weather.error', 'Could not load weather data.'));
        } finally {
          locateBtn.disabled = false;
          locateBtn.removeAttribute('aria-busy');
          locateBtn.setAttribute('title', prevTitle || t('weather.useLocation', 'Use my location'));
        }
      }, () => {
        locateBtn.disabled = false;
        locateBtn.removeAttribute('aria-busy');
        locateBtn.setAttribute('title', prevTitle || t('weather.useLocation', 'Use my location'));
        showError(t('weather.error', 'Could not load weather data.'));
      }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
    });
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      const q = searchEl.value.trim();
      if (searchClear) {
        searchClear.hidden = !q;
        searchClear.classList.toggle('show', !!q);
      }
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => searchSuggest(q), 280);
    });
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSuggest();
        searchEl.blur();
      }
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchEl) searchEl.value = '';
      searchClear.hidden = true;
      searchClear.classList.remove('show');
      closeSuggest();
      searchEl && searchEl.focus();
    });
  }
  document.addEventListener('click', (e) => {
    if (!suggestEl || !searchEl) return;
    if (suggestEl.contains(e.target) || searchEl.contains(e.target) || (searchClear && searchClear.contains(e.target))) return;
    closeSuggest();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // Dismiss overlays in order: suggest → sheet → detail
    if (suggestEl && !suggestEl.hidden && suggestEl.classList.contains('open')) {
      closeSuggest();
      e.preventDefault();
      return;
    }
    if (isSheetOpen()) {
      closeSheet();
      e.preventDefault();
      return;
    }
    if (isDetailVisible() || (detailEl && detailEl.classList.contains('is-closing'))) {
      closeDetail();
      e.preventDefault();
    }
  });

  // Pause auto-refresh when tab/page is not active; resume (+ stale refresh) when active
  document.addEventListener('visibilitychange', onPageActivityChange);
  window.addEventListener('pageshow', function (e) {
    if (e && e.persisted) onPageActivityChange();
  });
  window.addEventListener('focus', function () {
    // Window focus while still "visible" — ensure timer is running
    if (isPageActive() && !autoRefreshTimer) scheduleAutoRefresh();
  });
  window.addEventListener('blur', function () {
    // Do not clear on blur alone (user may be in another app on same desktop
    // while the tab remains visible). Visibility API owns pause.
  });

  window.refreshWeatherUi = function refreshWeatherUi() {
    applyAmbientPageSky();
    // Never interrupt bootstrap list-lock / inflight load with extra paints
    if (listPaintLocked || refreshInflight) {
      clearTimeout(nameFetchTimer);
      nameFetchTimer = setTimeout(function () { ensureLocalizedMajorNames(); }, 400);
      return;
    }
    if (cache.size) {
      refreshListsFromCache();
    } else {
      refresh(true, { quiet: false, reason: 'lang' });
    }
    if (isDetailVisible() && openCity && openCity.weather) {
      const fresh = (openCity.city && cache.get(cityKey(openCity.city))) || openCity;
      openDetail(fresh);
    }
    clearTimeout(nameFetchTimer);
    nameFetchTimer = setTimeout(function () { ensureLocalizedMajorNames(); }, 200);
  };

  // Kick off
  myLocationCity = loadMyLocation();
  loadNameCacheFromSession();
  applyAmbientPageSky();
  refresh(true, { quiet: false, reason: 'boot' });
  scheduleAutoRefresh();
  clearTimeout(nameFetchTimer);
  nameFetchTimer = setTimeout(() => { ensureLocalizedMajorNames(); }, 600);
  // Keep ambient sky in sync with clock / theme
  setInterval(() => { if (isPageActive()) applyAmbientPageSky(); }, 5 * 60 * 1000);
  document.querySelectorAll('.weather-root .reveal, .tools-page .reveal').forEach((el) => el.classList.add('visible'));
})();
