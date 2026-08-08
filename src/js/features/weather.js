'use strict';
/* USA Travel Guide — features/weather.js (shim)
   Weather is split into classic modules under features/weather/:
     ns.js → sky.js → charts.js → alerts.js → data.js → app.js
   tools-weather.html loads those files directly.
   This shim is kept so docs/grep paths still resolve; it no-ops if modules load.
*/
(function () {
  if (window.USATravelWeather && window.USATravelWeather.active) return;
  // If someone only loaded this shim (wrong HTML), fail soft.
  if (document.getElementById('weatherList') || document.querySelector('[data-tool="weather"]')) {
    console.error('[weather] Load features/weather/*.js modules (see tools-weather.html), not weather.js alone.');
  }
})();
