# Architecture

Static multi-page site. **Primary host:** [travelusa.pages.dev](https://travelusa.pages.dev/) (Cloudflare Pages). **Backup mirror:** [tgthms.github.io/usa-travel-guide](https://tgthms.github.io/usa-travel-guide/) (GitHub Pages). No bundler required at runtime.

## Directory layout

```
usa-travel-guide/
├── *.html                 # Page entrypoints (repo root)
├── src/
│   ├── css/
│   │   ├── styles.css        # Ordered @import barrel (only link pages need)
│   │   ├── tokens.css        # Themes, variables, base, typography
│   │   ├── gallery.css       # Gallery grid + lightbox
│   │   ├── chrome.css        # Mini-app chrome, settings, progress
│   │   ├── tools.css         # Tools hub cards
│   │   ├── weather.css       # Weather list / toolbar shell
│   │   ├── home.css          # Loader, nav, homepage sections
│   │   ├── legal.css         # Privacy / terms reading layout
│   │   ├── site-extra.css    # Fun facts + homepage footer
│   │   ├── motion.css        # Scroll reveal
│   │   ├── responsive.css    # Breakpoints, constrained, CJK, theme finish
│   │   ├── motion-levels.css # Animation Full / Reduced / Off
│   │   ├── tools-miniapp.css # Currency/clock/tip/drive mini-app layouts
│   │   └── weather-app.css   # Weather redesign, sky FX, detail, sheets
│   └── js/
│       ├── data/          # Content only (no DOM)
│       │   ├── i18n.js
│       │   ├── legal-i18n.js
│       │   ├── modal-content.js
│       │   ├── fun-facts.js
│       │   ├── dest-links.js
│       │   ├── dest-weather-cities.js  # lat/lon for homepage dest weather chips
│       │   └── intro-gallery.js        # catalog for About 3-slot photo shuffle
│       ├── core/          # Shared shell
│       │   ├── env.js     # ENV, raf, loader, observers
│       │   ├── nav-return.js # sessionStorage stamp, contextual Back, guide scroll restore
│       │   └── runtime.js # prefs, i18n engine, settings, nav chrome
│       ├── features/      # Page behavior (safe no-op if DOM missing)
│       │   ├── home.js    # immersive hero, intro shuffle, carousels, favorites, fun facts
│       │   ├── dest-weather.js # homepage destination live weather chips
│       │   ├── gallery.js
│       │   ├── tools.js   # currency, clock, tip/tax, drive, emergency
│       │   ├── weather/   # Hybrid NWS (US) + Open-Meteo (world / enrich / fallback)
│       │   └── legal.js
│       └── app.js         # Boot: applyLanguage / applyUnits / legal first paint
├── images/
│   ├── main-classic.webp  # Hero photo (Classic style)
│   ├── main-modern.webp   # Hero photo (Modern style)
│   └── gallery/           # full + medium/ + thumbs/ + videos/
├── e2e/                   # Playwright smoke
├── docs/
│   ├── architecture.md
│   ├── legal/             # Privacy / terms markdown sources
│   └── partials/          # first-paint + settings HTML (injected into every page)
└── tools/                 # Gallery Manager + legal/partials builders (stripped on public deploy)
    ├── gallery_manager.py
    └── README.md
```

## Hosting

| | |
|---|---|
| **Primary** | `https://travelusa.pages.dev/` — canonical URLs, OG, sitemap, robots |
| **Backup** | `https://tgthms.github.io/usa-travel-guide/` — GitHub Actions `static.yml` (deploys only after **E2E smoke** succeeds on `main`) |
| **Strip on deploy** | `tools/`, `e2e/`, `docs/`, `trailer/`, npm/Playwright metadata, and `Add Photos.command` (`tools/strip-public.sh`). Cloudflare also 404s those paths via `_redirects`. |

Cloudflare Pages (primary) is not gated from this repo. In the Cloudflare dashboard, wait for the GitHub check **E2E smoke** before deploying when that option exists. Do not publish `travelusa.pages.dev` from a red E2E run.

## Script load order

Classic `defer` scripts share one global lexical environment (not ES modules), so `let currentLang` from `runtime.js` is visible to `features/*`.

Core load order on every page: `env.js` → **`nav-return.js`** → `runtime.js`.

| Page | Scripts |
|------|---------|
| **index** | data (i18n, fun-facts, intro-gallery, modal, dest-links, dest-weather-cities) → core (env, nav-return, runtime) → features (home, dest-weather) → app |
| **gallery** | i18n → core → gallery → app |
| **tools.html** (hub) | i18n → core → tools → app |
| **tools-currency / clock / tip-tax / drive / emergency** | i18n → core → tools → app |
| **tools-weather** | i18n → dest-weather-cities (optional deep-link helpers) → core → **weather/** modules → app |
| **privacy / terms** | legal-i18n (`defer`) → i18n → core → legal → app |

`app.js` runs last so feature functions (`initFunFacts`, `renderLegalPage`, gallery chrome, weather hooks) already exist.

Settings dialog, first-paint theme script, and the Google Fonts links are generated from `docs/partials/` (`npm run build:partials`). Do not hand-edit the marked regions in `*.html`.

`applyLanguage` paints `[data-i18n*]` (including `<title>`), restamps unit spans, and dispatches `usa-travel:prefs` (`{ type: 'lang'|'units'|'theme'|'motion' }`). Features subscribe. Temperature/distance formatting for JS UI goes through `window.USATravel.formatTempFromC` / `formatDistFromMi`. Auto units follow the browser locale region, then time zone — not OS Language & Region radios.

### Weather hybrid (summary)

- **US majors / my-location in US:** National Weather Service `api.weather.gov` (points → forecast + forecastHourly). List paint does **not** enrich.
- **Detail open:** Open-Meteo gap-fill for humidity, UV, sunrise/set, AQ, etc. (`source: nws+om`).
- **Non-US / NWS fail / geocode:** Open-Meteo full pack.
- **Points cache:** `localStorage` `usa-travel-nws-points-v1` (~7d).

### Guide → tool deep links + return chrome

- Quiet `.guide-tool-link` CTAs on seasons / tips / practical (and matching modal CTAs).
- `nav-return.js` stamps `sessionStorage` `usa-travel-return-v1` from guide or tools hub; rewrites header `a.gallery-app-back` **and** footer `a.gallery-app-footer-home`; restores guide `scrollY` on return.
- **Tools hub (`tools.html`) always “Back to the Guide”** — never “Back to Tools” (hub is not a mini-app).
- Tool mini-apps: stamp `guide` → Back to Guide; stamp `tools` → Back to Tools; no stamp → markup default (Tools).
- `tools.html` is **not** a mini-app path (`tools-*.html` only); leftover tools stamps must not rewrite the hub.
- `applyLanguage` re-calls `__usaTravelNavReturn.apply()` so language switches do not wipe contextual Back.
- Covered by Playwright `nav-return chrome` tests in `e2e/smoke.spec.js`.

### New tool mini-page checklist

1. Copy shell from an existing `tools-*.html` (settings, footer, script order).
2. Canonical + OG URLs on `https://travelusa.pages.dev/…`.
3. Link from `tools.html` hub card.
4. Feature code in `tools.js` or a dedicated `features/*.js` (weather pattern).
5. i18n keys in `src/js/data/i18n.js` (en/es/zh/ja).
6. Add path to `sitemap.xml` and `e2e/smoke.spec.js` `TOOL_PAGES`.
7. CSS in the matching domain file under `src/css/` (not a one-off inline dump).

## CSS domains

Pages always load **only** `src/css/styles.css`. That file imports domain sheets in cascade order — **do not reorder imports** without re-checking specificity and later overrides (`motion-levels.css` and `weather-app.css` intentionally come after `responsive.css`).

## Homepage hero & intro collage

- **Hero photos:** `images/main-classic.webp` (Classic style) and `images/main-modern.webp` (Modern style). Appearance (light/dark/system) only changes scrims/dimming, not the file.
- **Enter motion:** `home.js` starts blur→clear + zoom after the splash loader so the motion is visible; respects Full / Reduced / Off.
- **Intro shuffle:** `intro-gallery.js` catalogs the full gallery (from `gallery.html`). Runtime picks random thumb WebPs; phase-staggered 6s cadence. Click → `gallery.html?photo=…`.
- After bulk gallery adds, regenerate the catalog so the collage stays in sync.

## Legal copy

- **Sources:** `docs/legal/{en,es,zh,ja}/{privacy,terms}.md` (YAML frontmatter + `## Title {#id}` Markdown).
- **Build:** `npm run build:legal` → `src/js/data/legal-i18n.js`. `npm run serve` watches and rebuilds on save.
- Do not hand-edit `legal-i18n.js`.

## Motion policy

`getEffectiveMotionMode()` in `runtime.js`:

- **User Full always wins** over OS `prefers-reduced-motion` (explicit opt-in).
- User Reduced / Off always win.
- Constrained / wearable webviews force Off.

## Gallery Manager

Local tool at `tools/gallery_manager.py` (**tracked in git**, stripped from public deploys). It mutates:

- `gallery.html` (items + `<!-- GALLERY_MANAGER_INSERT -->` inside `#galleryGrid`)
- `images/gallery/**` (full, medium, thumbs, WebP sidecars; videos → `images/gallery/videos/`)
- `src/js/data/i18n.js` (es/zh/ja caption keys)
- `src/js/data/intro-gallery.js` (homepage About collage — rewritten on add / remove / save / `--rebuild-intro`)

**Orientation:** EXIF Orientation ≠ 1 is baked into pixels (Pillow) so thumbs/medium/width×height always match the visual image. Upright JPEGs still copy byte-for-byte (HDR-safe).

**Rebuild:** `python3 tools/gallery_manager.py --rebuild-media` re-orients when needed, rebuilds medium + thumb + WebP, and patches `width`/`height` for stable masonry.

See `tools/README.md` for CLI and browser UI (`python3 tools/gallery_manager.py` → port 8791).
