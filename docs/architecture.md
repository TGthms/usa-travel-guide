# Architecture

Static multi-page site for GitHub Pages. No bundler required at runtime.

## Directory layout

```
usa-travel-guide/
├── *.html                 # Page entrypoints (root = GH Pages)
├── src/
│   ├── css/styles.css     # Design system + pages
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
│       │   ├── tools.js
│       │   └── legal.js
│       └── app.js         # Boot: applyLanguage / applyUnits / legal first paint
├── images/gallery/        # full + medium/ + thumbs/
├── e2e/                   # Playwright smoke
├── docs/                  # Maintainer docs
└── tools/                 # Local Gallery Manager (gitignored; not deployed)
```

## Script load order

Classic `defer` scripts share one global lexical environment (not ES modules), so `let currentLang` from `runtime.js` is visible to `features/*`.

| Page | Scripts |
|------|---------|
| **index** | data (i18n, fun-facts, modal, dest-links) → core → features (tools, home, legal, gallery) → app |
| **gallery** | i18n → core → gallery → app |
| **tools** | i18n → core → tools → app |
| **privacy / terms** | legal-i18n (sync) → i18n → core → legal → app |

`app.js` runs last so feature functions (`initFunFacts`, `renderLegalPage`, gallery chrome) already exist.

## Gallery Manager

Local tool at `tools/gallery_manager.py` (gitignored). It mutates:

- `gallery.html` (items + `<!-- GALLERY_MANAGER_INSERT -->`)
- `images/gallery/**`
- `src/js/data/i18n.js` (es/zh/ja caption keys)

Path constants live at the top of that file; they still point at `src/js/data/i18n.js` after this restructure.
