<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=300&color=gradient&text=USA%20Travel%20Guide&animation=fadeIn"/>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="docs/i18n/README.es.md">Español</a> ·
  <a href="docs/i18n/README.zh.md">中文</a> ·
  <a href="docs/i18n/README.ja.md">日本語</a>
</p>

<p align="center">
  A beautifully designed travel guide to the United States — covering 5 regions, 12 destination cities, road-trip routes, a filterable photo gallery, travel tools (including live weather), seasonal advice, culture highlights, America fun facts, and practical planning essentials.
</p>

<p align="center">
  <a href="https://travelusa.pages.dev/"><strong>🔗 Try it out</strong></a><br>
  <sub>Mirror (GitHub Pages): <a href="https://tgthms.github.io/usa-travel-guide/">tgthms.github.io/usa-travel-guide</a></sub>
</p>

---

## ✨ Features

| | |
|---|---|
| 🌍 **Comprehensive coverage** | All 50 U.S. states, organized by major regions (Northeast, South, Midwest, West, Southwest). |
| 🏙️ **Destination cities** | Twelve featured cities with unique CSS card art, ratings, expandable modals, and **live weather chips** (Open-Meteo) that deep-link into the weather tool. |
| 🔗 **Helpful links** | Tourism, transit, parks, and museums from city modals — plus selective guide-section links (regions, essentials, culture, routes, tips). |
| 🖼️ **Photo gallery** | Filterable travel photography with search, sort, quality tiers (thumbnail / medium / full), lightbox, optional video, and EXIF-upright media pipeline. *HDR supported on full JPEG copies when already upright.* |
| 🌄 **Immersive homepage hero** | Full-bleed photo background by style (**Classic** / **Modern**), light/dark scrims, luxury enter motion, and bottom-weighted mobile layout. |
| 🎞️ **About photo collage** | Three-slot shuffle of gallery thumbs with soft transitions; click opens the gallery. |
| 🧰 **Travel tools** | Hub plus mini-apps: currency, world clock, tip & sales tax (all 50 states), gas/EV road-trip cost, U.S. emergency numbers, and **live weather** (NWS for U.S. + Open-Meteo for world/enrich). |
| 🌦️ **Seasons, culture & routes** | When to go, cultural highlights, and classic road-trip ideas. |
| 🎲 **America Fun Facts** | One shuffled fact at a time — 250+ trivia items in every language. |
| 🌐 **Multi-language** | English, Spanish, Chinese, and Japanese for the full guide (including legal pages). |
| ⚙️ **Personalization** | Appearance (system / light / dark) × style (**Classic** / **Modern**), language, °F/°C and mi/km units, gallery photo quality — saved on your device. |
| ♿️ **Animations: Full / Reduced / Off** | Accessibility-first motion: full effects, calm minimal fades, or no decorative animation. **Settings “Full” wins** even when the OS prefers reduced motion. Cursor trail can be toggled separately. |
| 📱 **Mobile-ready** | Transparent nav over the hero until scroll, performance safeguards, and guide scroll restore when returning from tools. |
| 🔒 **Privacy & terms** | On-site [Privacy Policy](https://travelusa.pages.dev/privacy.html) and [Terms of Use](https://travelusa.pages.dev/terms.html), including external-link disclosures. |

---

**Live site:** [travelusa.pages.dev](https://travelusa.pages.dev/) (primary) · [GitHub Pages mirror](https://tgthms.github.io/usa-travel-guide/) (backup)

Main pages: `index.html` · `gallery.html` · `tools.html` · tool mini-apps · `privacy.html` · `terms.html`

### Project layout

| Path | Role |
|------|------|
| `*.html` (repo root) | Site entrypoints (static hosting) |
| `src/css/` | Design system split by domain; `styles.css` is the ordered entry barrel |
| `src/js/app.js` | Boot only (applies saved prefs after feature scripts load) |
| `src/js/core/` | Shared shell: env, prefs, i18n, settings chrome, nav-return |
| `src/js/features/` | Page features: home, gallery, tools, weather, dest-weather, legal |
| `src/js/data/` | Content packs (i18n, modals, fun facts, legal copy, dest links, intro-gallery catalog) |
| `images/` | Hero assets (`main-classic.webp`, `main-modern.webp`) + gallery tiers |
| `tools/` | Local **Gallery Manager** (tracked in git; stripped from public deploy) |
| `docs/` | Architecture + translated READMEs + legal markdown sources |
| `.github/workflows/static.yml` | Deploy mirror to GitHub Pages on push to `main` |

See [docs/architecture.md](docs/architecture.md) for script load order and maintainer notes.

Local preview from the repo root:

```bash
npm run serve
# → http://127.0.0.1:8000/
```

Legal copy lives under `docs/legal/` (Markdown). `npm run serve` rebuilds `legal-i18n.js` on save; or run `npm run build:legal`.

Gallery Manager (add photos/videos locally):

```bash
python3 tools/gallery_manager.py
# → http://127.0.0.1:8791
```

Smoke tests (dev-only, Playwright):

```bash
npm ci
npx playwright install chromium
npm test
```

---

## 💬 Feedback

This is an interest-driven personal project — bug reports and suggestions are welcome!

📧 **contact.timg@icloud.com**

---

## 📄 License and legal

- **Code:** MIT — see [LICENSE](LICENSE).
- **Photos** in `/images`: © 2026 Tim G (TGthms), licensed under **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** — free to use with credit.
- **Fonts (web):** Loaded from Google Fonts — **Fraunces**, **Public Sans**, **Special Elite**, and **Noto Sans/Serif** (ZH/JP). These are open-licensed (SIL OFL / Apache where applicable).
- **Site policies:** [Privacy Policy](https://travelusa.pages.dev/privacy.html) · [Terms of Use](https://travelusa.pages.dev/terms.html)  
  Mirror: [Privacy](https://tgthms.github.io/usa-travel-guide/privacy.html) · [Terms](https://tgthms.github.io/usa-travel-guide/terms.html)

Suggested photo credit: *“Photo © Tim G (@TGthms), licensed under CC BY 4.0.”*
