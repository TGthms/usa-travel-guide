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
│       │   └── dest-links.js
│       ├── core/          # Shared shell
│       │   ├── env.js     # ENV, raf, loader, observers
│       │   └── runtime.js # prefs, i18n engine, settings, nav chrome
│       ├── features/      # Page behavior (safe no-op if DOM missing)
│       │   ├── home.js
│       │   ├── gallery.js
│       │   ├── tools.js   # currency, clock, tip/tax, drive, emergency
│       │   ├── weather.js # Open-Meteo weather mini-app
│       │   └── legal.js
│       └── app.js         # Boot: applyLanguage / applyUnits / legal first paint
├── images/gallery/        # full + medium/ + thumbs/ + videos/
├── e2e/                   # Playwright smoke
├── docs/                  # Maintainer docs
└── tools/                 # Gallery Manager (in git; stripped on public deploy)
    ├── gallery_manager.py
    └── README.md
```

## Hosting

| | |
|---|---|
| **Primary** | `https://travelusa.pages.dev/` — canonical URLs, OG, sitemap, robots |
| **Backup** | `https://tgthms.github.io/usa-travel-guide/` — GitHub Actions `static.yml` |
| **Strip on deploy** | `tools/` and `Add Photos.command` removed before Pages publish |

## Script load order

Classic `defer` scripts share one global lexical environment (not ES modules), so `let currentLang` from `runtime.js` is visible to `features/*`.

| Page | Scripts |
|------|---------|
| **index** | data (i18n, fun-facts, modal, dest-links) → core → features (tools, home, legal, gallery) → app |
| **gallery** | i18n → core → gallery → app |
| **tools.html** (hub) | i18n → core → tools → app |
| **tools-currency / clock / tip-tax / drive / emergency** | i18n → core → tools → app |
| **tools-weather** | i18n → core → **weather** → app |
| **privacy / terms** | legal-i18n (sync) → i18n → core → legal → app |

`app.js` runs last so feature functions (`initFunFacts`, `renderLegalPage`, gallery chrome, weather hooks) already exist.

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

## Gallery Manager

Local tool at `tools/gallery_manager.py` (**tracked in git**, stripped from public deploys). It mutates:

- `gallery.html` (items + `<!-- GALLERY_MANAGER_INSERT -->` inside `#galleryGrid`)
- `images/gallery/**` (full, medium, thumbs; videos → `images/gallery/videos/`)
- `src/js/data/i18n.js` (es/zh/ja caption keys)

See `tools/README.md` for CLI and browser UI (`python3 tools/gallery_manager.py` → port 8791).
