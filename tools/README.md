# Gallery Manager

Local mini-app for bulk-adding trip photos to this site — **no hand-editing HTML**, no manual thumbnails.

## Quick start (browser UI)

From the project root:

```bash
cd /Users/timgong/Desktop/usa-travel-guide-pre
python3 tools/gallery_manager.py
```

Your browser opens **http://127.0.0.1:8791**. Then:

1. Set **category**, **location**, and **date** (applied to the whole batch)
2. **Drop** photos (or click to choose) — multi-select is fine
3. Edit captions if you want
4. Click **Add to gallery**

Done. Refresh `gallery.html` to see them.

Stop the app with **Ctrl+C** in the terminal.

## CLI (folder import)

After a long trip, dump everything in one folder:

```bash
python3 tools/gallery_manager.py --cli ~/Pictures/big-sur-july \
  --category coast \
  --location "Big Sur, California" \
  --date "July 2026"
```

## Remove photos

### In the browser UI
Under **Already in gallery**, click **Remove** on any photo.  
Confirms first, then deletes **everything** for that photo:

- Full image (`images/gallery/…`)
- Thumbnail (`images/gallery/thumbs/…`)
- HTML block in `gallery.html`
- Caption keys in `assets/js/app.js` (es / zh / ja)

### CLI

```bash
# List slugs
python3 tools/gallery_manager.py --list

# Remove one or more (slug or filename)
python3 tools/gallery_manager.py --remove richmondbay sfgoldengate
```

Options:

| Flag | Meaning |
|------|---------|
| `--cli FOLDER` | Import every image in that folder |
| `--remove SLUG…` | Fully delete photo(s) by slug/filename |
| `--list` | Show current gallery entries |
| `--category` | `cityscapes` · `landmarks` · `nature` · `coast` · `food-culture` · `roads` |
| `--location` | Shown under the photo in the lightbox |
| `--date` | e.g. `July 2026` |
| `--dry-run` | Import only: parse only, write nothing |
## What it writes

For each photo:

| Output | Path |
|--------|------|
| Full web image (max 2000px) | `images/gallery/{slug}.jpeg` |
| Thumbnail (max 900px) | `images/gallery/thumbs/{slug}.jpeg` |
| Grid item | `gallery.html` (`#galleryGrid`) |
| Caption keys (es/zh/ja) | `assets/js/app.js` (defaults to your English caption) |

## Requirements

- **macOS** with `sips` (built-in)
- **Python 3.9+** (stdlib only — no `pip install`)

## Tips

- **HEIC** from iPhone usually works via `sips`
- Captions for other languages start as English — search `gallery.item.` in `app.js` to translate later
- Filenames become safe slugs (`Golden Gate!!.jpg` → `goldengate.jpeg`)
- Don’t run two managers at once; stop the server when you’re done editing

## Safety

Only listens on **127.0.0.1** (your machine). It never uploads to the internet.
