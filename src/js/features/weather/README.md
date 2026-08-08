# Weather modules

Classic (non-module) scripts loaded by `tools-weather.html` in this order:

| File | Role |
|------|------|
| `ns.js` | Page gate + `window.USATravelWeather` factory registry |
| `sky.js` | Sky / ambient FX (`W.factories.sky`) |
| `charts.js` | Daily bars + hourly/sun charts (`W.factories.charts`) |
| `alerts.js` | NWS alerts accordion + prefetch (`W.factories.alerts`) |
| `data.js` | NWS + Open-Meteo fetch/normalize (`W.factories.data`) |
| `app.js` | UI state, list/detail/sheets, boot |

`app.js` creates deps (units, DOM, cache) and calls each factory. Do not load `app.js` alone.

The root `features/weather.js` is a **shim** only (logs if modules were skipped).

## Editing

- Sky visuals → `sky.js`
- Chart geometry / daily range colors → `charts.js`
- Alert cards / collapse animation → `alerts.js`
- API + hybrid NWS/OM → `data.js`
- List, detail, units sheet, refresh → `app.js`

After edits: `node --check src/js/features/weather/*.js` and Playwright `weather` smokes.
