# Maintainer tools

Local-only utilities. **Strip `tools/` from public deploys** (Cloudflare / GitHub Pages).

---

## Legal markdown builder

Privacy Policy and Terms of Use sources:

```
docs/legal/{en,es,zh,ja}/{privacy,terms}.md
```

YAML frontmatter (`title`, `lead`, …) plus Markdown sections:

```markdown
## Section Title {#section-id}

Paragraph with **bold**, *italic*, `code`, and [links](https://example.com).

- List item one

<p class="legal-note">Optional raw HTML for styled notes.</p>
```

| Command | Behavior |
|---|---|
| `npm run serve` | Serve site; rebuild `legal-i18n.js` when legal sources change |
| `npm run build:legal` | One-shot rebuild → `src/js/data/legal-i18n.js` |

Commit both the `.md` sources and generated `legal-i18n.js`. Do not hand-edit `legal-i18n.js`. English is the legal source of meaning; es/zh/ja keep the same structure in natural voice.---

# Gallery Manager

Local mini-app for bulk-adding trip **photos and videos** to this site — **no hand-editing HTML**, no manual thumbnails.

## Videos

- Drop **MP4 / MOV / M4V / WebM** alongside photos (or multi-select them).
- Files are **copied as-is** into `images/gallery/videos/` (no re-encode). Large files show a soft warning (≥ 40 MB).
- A **cover frame** is auto-extracted (macOS Quick Look / `qlmanage`). Optionally pick a cover image per queue item to override.
- Cover → same thumb / medium / full JPEG pipeline as photos; the gallery tile shows an iOS-style **Video** badge and plays in the lightbox.

## Quick start (browser UI)

From the project root:

```bash
cd /Users/timgong/Desktop/usa-travel-guide
python3 tools/gallery_manager.py
```

Your browser opens **http://127.0.0.1:8791**. Then:

1. **Defaults are optional** — leave category empty for mixed trips (e.g. LA).  
   Tick only the fields you want to apply (category / date fallback / location fallback).
2. **Auto-detect** (on by default) fills **date** (e.g. `June 1, 2026` when EXIF has a day) and **location**  
   (e.g. `Los Angeles, CA`) from each photo’s EXIF + GPS.
3. **Date fields** use the system calendar (`<input type="date">`). The site stores English display form: **Month D, YYYY**. 
4. **Drop** photos (multi-select OK). New items do **not** force “coast” — pick a category per photo (or apply a default).
5. **Per photo**, set caption and category independently; adjust date/location if needed.
6. **Apply checked defaults to queue** only overwrites the fields you selected.
7. **Re-detect metadata** re-runs EXIF/GPS for the whole queue.
8. **Add all to gallery** writes full + medium + thumb + HTML + i18n keys (requires a category on every item).
9. In **Library**, search/filter, **Save** metadata edits, or **Remove** entirely.  
   **Save** updates the English caption in HTML; hand-translated es/zh/ja captions are preserved.

Stop the app with **Ctrl+C** in the terminal.

### If “Add” fails with structure errors

`gallery.html` should keep this comment **inside** `#galleryGrid` (just before the grid’s closing `</div>`):

```html
    <!-- GALLERY_MANAGER_INSERT -->
```

The manager inserts new photos at that marker. If the marker is missing, it falls back to a whitespace-tolerant match against the empty-state block.

## CLI (folder import)

After a long trip, dump everything in one folder:

```bash
# Explicit defaults
python3 tools/gallery_manager.py --cli ~/Pictures/big-sur-july \
  --category coast \
  --location "Big Sur, California" \
  --date "July 4, 2026"

# Auto-detect date + location from each photo’s metadata
python3 tools/gallery_manager.py --cli ~/Pictures/la-trip --category cityscapes
```

## Backfill precise dates

Upgrade month-only `data-date` values from EXIF/sips on the full files. Never invents a day when EXIF has none.

```bash
# Preview
python3 tools/gallery_manager.py --backfill-dates

# Write gallery.html
python3 tools/gallery_manager.py --backfill-dates --apply
```

## Rebuild media (orientation + thumbs + medium + WebP)

Full pass after upgrading the tool, fixing sideways photos, or refreshing derivatives:

```bash
python3 tools/gallery_manager.py --rebuild-media
```

For every gallery photo this will:

1. **Bake EXIF orientation** into the full JPEG when Orientation ≠ 1 (Pillow). Upright originals stay untouched.
2. Rebuild **medium** (long edge ≤ 1920) and **thumb** (≤ 900) from the upright full.
3. Refresh **WebP** sidecars for medium + thumb.
4. Patch `gallery.html` `width`/`height` (and city/state attrs) so masonry aspect ratios stay stable.

Requires **Pillow** (`python3 -m pip install Pillow`) and macOS `sips`.

Safe to re-run.

## Remove photos

### In the browser UI
Under **Library**, click **Remove** on any photo.  
Confirms first, then deletes **everything** for that photo:

- Full image (`images/gallery/…`)
- Medium (`images/gallery/medium/…`)
- Thumbnail (`images/gallery/thumbs/…`)
- HTML block in `gallery.html`
- Caption keys in `src/js/data/i18n.js` (es / zh / ja)

### CLI

```bash
# List slugs
python3 tools/gallery_manager.py --list

# Remove one or more (slug or filename)
python3 tools/gallery_manager.py --remove richmondbay sfgoldengate
```

## Options

| Flag | Meaning |
|------|---------|
| `--cli FOLDER` | Import every image in that folder |
| `--remove SLUG…` | Fully delete photo(s) by slug/filename |
| `--list` | Show current gallery entries |
| `--rebuild-media` | Bake orientation if needed; rebuild medium/thumb/WebP; patch HTML attrs |
| `--backfill-dates` | Upgrade dates from EXIF (dry-run unless `--apply`) |
| `--apply` | With `--backfill-dates`: write `gallery.html` |
| `--category` | `cityscapes` · `landmarks` · `nature` · `coast` · `food-culture` · `roads` |
| `--location` | Lightbox meta (omit → auto from GPS) |
| `--date` | e.g. `July 4, 2026` (omit → auto from EXIF) |
| `--dry-run` | Import only: parse only, write nothing |

## Dependencies

- Python 3.9+
- macOS `sips` (preinstalled)
- **Pillow** — EXIF orientation bake (`python3 -m pip install Pillow`)

## What it writes

For each photo:

| Output | Path |
|--------|------|
| Full image (JPEG copied as-is; HEIC/etc. → JPEG q100, no resize) | `images/gallery/{slug}.jpeg` |
| Medium viewer (long edge ≤ 1920px, default lightbox quality) | `images/gallery/medium/{slug}.jpeg` |
| Thumbnail (max 900px, masonry grid) | `images/gallery/thumbs/{slug}.jpeg` |
| Grid item | `gallery.html` (`#galleryGrid`) |
| Caption keys (es/zh/ja) | `src/js/data/i18n.js` (defaults to your English caption) |

HTML attributes per item: `data-category`, `data-location`, `data-city`, `data-state`, `data-date`,  
plus `data-thumb` / `data-medium` / `data-full` on the `<img>`.

`data-date` uses **Month D, YYYY** when a day is known (e.g. `June 1, 2026`), otherwise month-only (`July 2026`).

## Gallery media notes (v5+)

- **Full** images stay original JPEG (byte-for-byte) so Apple HDR gain maps are preserved.
- **Thumbs + medium** also get WebP siblings (via Pillow) for faster grids/lightbox.
- **Alt / VoiceOver**: optional field in Gallery Manager; blank → auto descriptive sentence (not bare title).
  Rebuild descriptive alts: re-save items, or re-run the backfill script used at ship time.
- WebP encode needs **Pillow** (`pip3 install pillow`). `cwebp` optional; not required when Pillow works.
