#!/usr/bin/env python3
"""
USA Travel Guide — Gallery Manager
==================================
A local mini-app (and CLI) so you can bulk-add trip photos without hand-editing
HTML or making thumbnails yourself.

What it does for each photo (add):
  1. Saves a web-optimized full image  → images/gallery/
  2. Saves a grid thumbnail            → images/gallery/thumbs/
  3. Appends a gallery-item block      → gallery.html
  4. Adds caption keys (es/zh/ja)      → assets/js/app.js

What it does on remove (clears ALL of the above):
  · Deletes full image + thumb
  · Removes the HTML block from gallery.html
  · Removes caption keys from app.js (all languages)

Usage — browser UI (recommended after a long trip):
  cd /path/to/usa-travel-guide-pre
  python3 tools/gallery_manager.py
  # opens http://127.0.0.1:8791

Usage — CLI batch from a folder:
  python3 tools/gallery_manager.py --cli ~/Pictures/california-trip \\
      --category coast --location "Big Sur, California" --date "July 2026"

Usage — CLI remove:
  python3 tools/gallery_manager.py --remove sfgoldengate richmondbay

Requires: Python 3.9+ and macOS `sips` (preinstalled). No pip packages needed.
"""

from __future__ import annotations

import argparse
import html
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
GALLERY_DIR = ROOT / "images" / "gallery"
THUMBS_DIR = GALLERY_DIR / "thumbs"
GALLERY_HTML = ROOT / "gallery.html"
APP_JS = ROOT / "assets" / "js" / "app.js"

CATEGORIES = [
    "cityscapes",
    "landmarks",
    "nature",
    "coast",
    "food-culture",
    "roads",
]

FULL_MAX = 2000
THUMB_MAX = 900
FULL_QUALITY = 82
THUMB_QUALITY = 72
PORT = 8791

# ── Helpers ─────────────────────────────────────────────────────────────────

def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def ensure_layout() -> None:
    if not GALLERY_HTML.is_file():
        die(f"gallery.html not found at {GALLERY_HTML}")
    if not APP_JS.is_file():
        die(f"app.js not found at {APP_JS}")
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    if not shutil.which("sips"):
        die("macOS `sips` is required (should be at /usr/bin/sips)")


def slugify(name: str) -> str:
    base = Path(name).stem
    base = re.sub(r"[^a-zA-Z0-9]+", "", base).lower()
    return base or f"photo{int(time.time())}"


def unique_slug(base: str) -> str:
    """Avoid colliding with existing i18n keys / filenames."""
    existing = set()
    # From HTML
    if GALLERY_HTML.is_file():
        existing.update(re.findall(r"gallery\.item\.([a-z0-9]+)\.caption", GALLERY_HTML.read_text(encoding="utf-8")))
    # From files
    for p in GALLERY_DIR.glob("*"):
        if p.is_file():
            existing.add(slugify(p.name))
    slug = base
    n = 2
    while slug in existing or (GALLERY_DIR / f"{slug}.jpeg").exists():
        slug = f"{base}{n}"
        n += 1
    return slug


def caption_from_filename(name: str) -> str:
    stem = Path(name).stem
    stem = re.sub(r"[_\-]+", " ", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    # Title-case lightly without destroying SF / CA acronyms
    parts = []
    for w in stem.split(" "):
        if w.isupper() and len(w) <= 4:
            parts.append(w)
        else:
            parts.append(w[:1].upper() + w[1:] if w else w)
    return " ".join(parts) or "Untitled"


def sips_size(path: Path) -> tuple[int, int]:
    out = subprocess.check_output(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        text=True,
    )
    w = int(re.search(r"pixelWidth:\s*(\d+)", out).group(1))
    h = int(re.search(r"pixelHeight:\s*(\d+)", out).group(1))
    return w, h


def sips_export(src: Path, dest: Path, max_edge: int, quality: int) -> tuple[int, int]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Work in a temp file then move (sips can be finicky overwriting in-place)
    with tempfile.NamedTemporaryFile(suffix=".jpeg", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        subprocess.check_call(
            ["sips", "-Z", str(max_edge), "-s", "format", "jpeg",
             "-s", "formatOptions", str(quality), str(src), "--out", str(tmp_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        shutil.move(str(tmp_path), str(dest))
    finally:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
    return sips_size(dest)


def html_item_block(
    *,
    slug: str,
    category: str,
    location: str,
    date: str,
    caption: str,
    alt: str,
    tw: int,
    th: int,
    filename: str,
) -> str:
    cap_esc = html.escape(caption, quote=True)
    alt_esc = html.escape(alt or caption, quote=True)
    loc_esc = html.escape(location, quote=True)
    date_esc = html.escape(date, quote=True)
    cat_esc = html.escape(category, quote=True)
    file_esc = html.escape(filename, quote=True)
    return (
        f'    <div class="gallery-item" data-category="{cat_esc}" '
        f'data-location="{loc_esc}" data-date="{date_esc}" tabindex="0" role="button">\n'
        f'      <img src="images/gallery/thumbs/{file_esc}" '
        f'data-full="images/gallery/{file_esc}" '
        f'width="{tw}" height="{th}" alt="{alt_esc}" loading="lazy">\n'
        f'      <div class="gallery-caption" data-i18n="gallery.item.{slug}.caption">'
        f"{html.escape(caption)}</div>\n"
        f"    </div>\n"
    )


def insert_gallery_html(block: str) -> None:
    """Append a gallery-item block inside #galleryGrid (before its closing tag)."""
    text = GALLERY_HTML.read_text(encoding="utf-8")
    # Prefer an explicit marker comment if present
    marker = "<!-- GALLERY_MANAGER_INSERT -->"
    if marker in text:
        text = text.replace(marker, block + "    " + marker, 1)
        GALLERY_HTML.write_text(text, encoding="utf-8")
        return

    # Structure:
    #   <div class="gallery-grid" id="galleryGrid">
    #     ...items...
    #   </div>
    #   <p class="gallery-empty-state" ...
    m = re.search(
        r'(id="galleryGrid"[^>]*>)([\s\S]*?)(\n  </div>\s*\n  <p class="gallery-empty-state")',
        text,
    )
    if not m:
        die("Could not find #galleryGrid in gallery.html — structure unexpected")
    # Insert before the grid's closing </div>
    text = text[: m.start(3)] + "\n" + block.rstrip("\n") + m.group(3) + text[m.end(3) :]
    GALLERY_HTML.write_text(text, encoding="utf-8")


def insert_i18n(slug: str, caption: str) -> None:
    """Add gallery.item.{slug}.caption to es/zh/ja (English comes from HTML)."""
    key = f"gallery.item.{slug}.caption"
    text = APP_JS.read_text(encoding="utf-8")
    if f'"{key}"' in text:
        return  # already present

    # Escape for JS double-quoted string
    cap_js = (
        caption.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", " ")
    )
    line = f'    "{key}": "{cap_js}",\n'

    # Insert after the last gallery.item.*.caption line in each language block.
    # Safer approach: after every occurrence of the last known richmondview line
    # per language — or append after any gallery.item line for each lang.

    def inject_lang_block(src: str, lang: str) -> str:
        # Find language object: es: { ... },
        # Insert after last "gallery.item. in that block
        pattern = rf'(  {lang}: \{{)'
        m = re.search(pattern, src)
        if not m:
            return src
        start = m.end()
        # Find matching closing brace for this object at depth 1 from start-1
        depth = 1
        i = start
        while i < len(src) and depth:
            if src[i] == "{":
                depth += 1
            elif src[i] == "}":
                depth -= 1
            i += 1
        end = i - 1  # position of closing }
        block = src[start:end]
        if f'"{key}"' in block:
            return src
        # Find last gallery.item caption line in block
        matches = list(re.finditer(r'^[ \t]*"gallery\.item\.[^"]+\.caption": .*,\s*$', block, re.M))
        if matches:
            last = matches[-1]
            insert_at = start + last.end()
            # ensure newline
            if not src[insert_at - 1] == "\n":
                pass
            return src[:insert_at] + line + src[insert_at:]
        # No gallery items yet — insert near start of block after opening
        return src[:start] + "\n" + line + src[start:]

    for lang in ("es", "zh", "ja"):
        text = inject_lang_block(text, lang)

    APP_JS.write_text(text, encoding="utf-8")


def process_one(
    src: Path,
    *,
    category: str,
    location: str,
    date: str,
    caption: str | None = None,
    alt: str | None = None,
    dry_run: bool = False,
) -> dict:
    if category not in CATEGORIES:
        raise ValueError(f"Invalid category '{category}'. Choose from: {', '.join(CATEGORIES)}")

    cap = (caption or caption_from_filename(src.name)).strip()
    alt_text = (alt or cap).strip()
    slug = unique_slug(slugify(src.name))
    filename = f"{slug}.jpeg"
    full_path = GALLERY_DIR / filename
    thumb_path = THUMBS_DIR / filename

    result = {
        "slug": slug,
        "filename": filename,
        "caption": cap,
        "category": category,
        "location": location,
        "date": date,
        "full": str(full_path.relative_to(ROOT)),
        "thumb": str(thumb_path.relative_to(ROOT)),
    }

    if dry_run:
        result["status"] = "dry-run"
        return result

    # Copy original to temp if needed (handle HEIC? sips can convert many formats)
    tw, th = sips_export(src, thumb_path, THUMB_MAX, THUMB_QUALITY)
    sips_export(src, full_path, FULL_MAX, FULL_QUALITY)

    block = html_item_block(
        slug=slug,
        category=category,
        location=location,
        date=date,
        caption=cap,
        alt=alt_text,
        tw=tw,
        th=th,
        filename=filename,
    )
    insert_gallery_html(block)
    insert_i18n(slug, cap)

    result["thumb_size"] = f"{tw}x{th}"
    result["status"] = "ok"
    return result


def list_photos() -> list[dict]:
    text = GALLERY_HTML.read_text(encoding="utf-8")
    items = []
    for m in re.finditer(
        r'<div class="gallery-item" data-category="([^"]*)" data-location="([^"]*)" data-date="([^"]*)"[^>]*>\s*'
        r'<img src="([^"]+)" data-full="([^"]+)"[^>]*alt="([^"]*)"[^>]*>\s*'
        r'<div class="gallery-caption"[^>]*data-i18n="([^"]*)"[^>]*>([^<]*)</div>',
        text,
        re.S,
    ):
        full = m.group(5)
        filename = Path(full).name
        slug = Path(filename).stem
        i18n_key = m.group(7)
        # Prefer slug from i18n key when present: gallery.item.{slug}.caption
        key_m = re.match(r"gallery\.item\.([a-z0-9]+)\.caption", i18n_key)
        if key_m:
            slug = key_m.group(1)
        items.append(
            {
                "slug": slug,
                "filename": filename,
                "i18n_key": i18n_key,
                "category": m.group(1),
                "location": m.group(2),
                "date": m.group(3),
                "thumb": m.group(4),
                "full": full,
                "alt": m.group(6),
                "caption": m.group(8),
            }
        )
    return items


def remove_gallery_html(slug: str, filename: str | None = None) -> bool:
    """Remove the full gallery-item block for this photo from gallery.html."""
    text = GALLERY_HTML.read_text(encoding="utf-8")
    fname = filename or f"{slug}.jpeg"
    # Match a complete item (caption is a nested div — must close both).
    patterns = [
        # By i18n key (most reliable)
        rf'[ \t]*<div class="gallery-item"[^>]*>\s*'
        rf'<img[^>]*>\s*'
        rf'<div class="gallery-caption"[^>]*data-i18n="gallery\.item\.{re.escape(slug)}\.caption"[^>]*>[\s\S]*?</div>\s*'
        rf'</div>\s*',
        # By data-full path
        rf'[ \t]*<div class="gallery-item"[^>]*>\s*'
        rf'<img[^>]*data-full="images/gallery/{re.escape(fname)}"[^>]*>\s*'
        rf'<div class="gallery-caption"[^>]*>[\s\S]*?</div>\s*'
        rf'</div>\s*',
    ]
    new = text
    removed = False
    for pat in patterns:
        new2, n = re.subn(pat, "", new, count=1, flags=re.S)
        if n:
            new = new2
            removed = True
            break
    if removed:
        GALLERY_HTML.write_text(new, encoding="utf-8")
    return removed


def remove_i18n(slug: str) -> int:
    """Remove gallery.item.{slug}.caption from every language block in app.js."""
    key = f"gallery.item.{slug}.caption"
    text = APP_JS.read_text(encoding="utf-8")
    new, n = re.subn(
        rf'^[ \t]*"{re.escape(key)}":\s*.*?,\s*\n',
        "",
        text,
        flags=re.M,
    )
    if n:
        APP_JS.write_text(new, encoding="utf-8")
    return n


def remove_files(slug: str, filename: str | None = None) -> list[str]:
    """Delete full + thumb files. Returns list of paths removed."""
    fname = filename or f"{slug}.jpeg"
    removed = []
    for path in (GALLERY_DIR / fname, THUMBS_DIR / fname):
        if path.is_file():
            path.unlink()
            removed.append(str(path.relative_to(ROOT)))
    # Also try slug.jpeg if filename differed
    if fname != f"{slug}.jpeg":
        for path in (GALLERY_DIR / f"{slug}.jpeg", THUMBS_DIR / f"{slug}.jpeg"):
            if path.is_file():
                path.unlink()
                removed.append(str(path.relative_to(ROOT)))
    return removed


def remove_one(slug: str, filename: str | None = None) -> dict:
    """
    Fully remove a photo: HTML block, i18n keys (all langs), full image, thumb.
    """
    slug = re.sub(r"[^a-z0-9]", "", slug.lower())
    if not slug:
        raise ValueError("Invalid slug")

    # Resolve filename from listing when possible
    fname = filename
    if not fname:
        for item in list_photos():
            if item["slug"] == slug:
                fname = item["filename"]
                break
    fname = fname or f"{slug}.jpeg"

    html_ok = remove_gallery_html(slug, fname)
    i18n_n = remove_i18n(slug)
    files = remove_files(slug, fname)

    if not html_ok and i18n_n == 0 and not files:
        raise FileNotFoundError(f"No gallery entry found for '{slug}'")

    return {
        "slug": slug,
        "filename": fname,
        "html_removed": html_ok,
        "i18n_keys_removed": i18n_n,
        "files_removed": files,
        "status": "removed",
    }


# ── Web UI ──────────────────────────────────────────────────────────────────

UI_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gallery Manager — USA Travel Guide</title>
<style>
  :root {
    --bg: #0b1220; --surface: #121a2b; --card: #182235; --border: rgba(201,162,89,.25);
    --accent: #c9a259; --accent2: #e0c48a; --text: #f4efe4; --muted: rgba(244,239,228,.62);
    --ok: #6fbf7a; --err: #e07070; --radius: 12px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Public Sans", system-ui, -apple-system, sans-serif;
    background: radial-gradient(ellipse 80% 50% at 20% 0%, rgba(201,162,89,.12), transparent 50%), var(--bg);
    color: var(--text); min-height: 100vh; line-height: 1.5;
  }
  header {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 20px 28px; border-bottom: 1px solid var(--border);
    background: rgba(11,18,32,.85); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 10;
  }
  header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -.02em; }
  header h1 span { color: var(--accent); font-style: italic; }
  header p { color: var(--muted); font-size: 13px; }
  main { max-width: 960px; margin: 0 auto; padding: 28px 20px 80px; }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 22px; margin-bottom: 18px;
  }
  .card h2 { font-size: 14px; letter-spacing: .12em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 14px; font-weight: 600; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 11px;
    letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  input, select, textarea {
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); padding: 11px 12px; font: 500 14px system-ui; outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  .drop {
    border: 2px dashed var(--border); border-radius: var(--radius);
    padding: 40px 20px; text-align: center; cursor: pointer;
    transition: border-color .2s, background .2s; background: var(--card);
  }
  .drop.drag { border-color: var(--accent); background: rgba(201,162,89,.08); }
  .drop strong { display: block; font-size: 16px; margin-bottom: 6px; }
  .drop span { color: var(--muted); font-size: 13px; }
  .queue { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
  .row {
    display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center;
    background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 10px;
  }
  .row img { width: 64px; height: 64px; object-fit: cover; border-radius: 6px; background: #000; }
  .row .meta { min-width: 0; }
  .row .meta input { width: 100%; margin-top: 4px; }
  .row .meta .name { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row button {
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 12px;
  }
  .row button:hover { color: var(--err); border-color: var(--err); }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; align-items: center; }
  .btn {
    appearance: none; border: 0; border-radius: 8px; padding: 12px 20px;
    font: 650 13px system-ui; letter-spacing: .06em; text-transform: uppercase;
    cursor: pointer; transition: transform .15s, opacity .15s;
  }
  .btn:disabled { opacity: .45; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #0b1220; }
  .btn-primary:hover:not(:disabled) { background: var(--accent2); }
  .btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .log {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; background: var(--bg); border-radius: 8px; padding: 12px;
    max-height: 220px; overflow: auto; color: var(--muted); white-space: pre-wrap;
  }
  .log .ok { color: var(--ok); }
  .log .err { color: var(--err); }
  .existing { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .existing figure {
    margin: 0; background: var(--card); border-radius: 8px; overflow: hidden;
    border: 1px solid var(--border); display: flex; flex-direction: column;
  }
  .existing img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
  .existing figcaption { padding: 10px; font-size: 11px; color: var(--muted); flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .existing .cap-title { color: var(--text); font-size: 12px; font-weight: 600; line-height: 1.3; }
  .existing .cap-meta { font-size: 10px; opacity: .85; }
  .existing .rm {
    margin-top: auto; width: 100%;
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    border-radius: 6px; padding: 8px; cursor: pointer; font-size: 11px; font-weight: 600;
    letter-spacing: .04em; text-transform: uppercase;
  }
  .existing .rm:hover { color: #fff; background: rgba(224,112,112,.2); border-color: var(--err); }
  .existing .rm:disabled { opacity: .5; cursor: wait; }
  .existing-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
  .existing-head h2 { margin-bottom: 0; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: rgba(201,162,89,.15);
    color: var(--accent); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
  .hint { font-size: 13px; color: var(--muted); margin-top: 8px; line-height: 1.55; }
  .btn-danger { background: transparent; color: var(--err); border: 1px solid rgba(224,112,112,.45); }
  .btn-danger:hover:not(:disabled) { background: rgba(224,112,112,.15); }
</style>
</head>
<body>
<header>
  <div>
    <h1>✦ <span>Gallery Manager</span></h1>
    <p>Add or remove trip photos · clears full image, thumb, HTML &amp; captions</p>
  </div>
  <div class="pill" id="countPill">0 in gallery</div>
</header>
<main>
  <section class="card">
    <h2>Batch defaults</h2>
    <div class="grid2">
      <label>Category
        <select id="category">
          <option value="coast">Coast</option>
          <option value="landmarks">Landmarks</option>
          <option value="nature">Nature</option>
          <option value="roads">Roads</option>
          <option value="cityscapes">Cityscapes</option>
          <option value="food-culture">Food &amp; Culture</option>
        </select>
      </label>
      <label>Date <input id="date" type="text" placeholder="July 2026" value=""></label>
      <label style="grid-column: 1 / -1">Location
        <input id="location" type="text" placeholder="e.g. Big Sur, California">
      </label>
    </div>
    <p class="hint">These apply to every photo in the queue. You can still edit each caption before uploading.</p>
  </section>

  <section class="card">
    <h2>Add photos</h2>
    <div class="drop" id="drop">
      <strong>Drop photos here</strong>
      <span>or click to choose · JPEG, PNG, HEIC, WebP · multi-select OK</span>
      <input type="file" id="fileInput" accept="image/*,.heic,.HEIC" multiple hidden>
    </div>
    <div class="queue" id="queue"></div>
    <div class="actions">
      <button class="btn btn-primary" id="uploadBtn" disabled>Add to gallery</button>
      <button class="btn btn-ghost" id="clearBtn" type="button">Clear queue</button>
      <span class="hint" id="status"></span>
    </div>
    <div class="log" id="log" hidden></div>
  </section>

  <section class="card">
    <div class="existing-head">
      <h2>Already in gallery</h2>
      <button class="btn btn-danger" id="removeSelectedBtn" type="button" disabled style="display:none">Remove selected</button>
    </div>
    <p class="hint" style="margin-top:0;margin-bottom:14px">
      Remove deletes <strong>everything</strong> for that photo: full image, thumbnail, HTML block, and i18n caption keys.
    </p>
    <div class="existing" id="existing"></div>
  </section>
</main>
<script>
const $ = (s) => document.querySelector(s);
const queue = [];
const drop = $('#drop');
const fileInput = $('#fileInput');
const queueEl = $('#queue');
const logEl = $('#log');
const statusEl = $('#status');
const uploadBtn = $('#uploadBtn');

function log(msg, cls='') {
  logEl.hidden = false;
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function renderQueue() {
  queueEl.innerHTML = '';
  queue.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <img src="${item.preview}" alt="">
      <div class="meta">
        <div class="name">${item.file.name}</div>
        <input type="text" value="${item.caption.replace(/"/g, '&quot;')}" data-i="${i}" class="cap">
      </div>
      <button type="button" data-rm="${i}">Remove</button>`;
    queueEl.appendChild(row);
  });
  uploadBtn.disabled = queue.length === 0;
  queueEl.querySelectorAll('.cap').forEach(inp => {
    inp.addEventListener('input', e => { queue[+e.target.dataset.i].caption = e.target.value; });
  });
  queueEl.querySelectorAll('[data-rm]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.rm;
      URL.revokeObjectURL(queue[i].preview);
      queue.splice(i, 1);
      renderQueue();
    });
  });
}

function addFiles(fileList) {
  [...fileList].forEach(file => {
    if (!file.type.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp)$/i.test(file.name)) return;
    const caption = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    queue.push({ file, caption, preview: URL.createObjectURL(file) });
  });
  renderQueue();
}

drop.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.add('drag');
}));
['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.remove('drag');
}));
drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));

$('#clearBtn').addEventListener('click', () => {
  queue.forEach(q => URL.revokeObjectURL(q.preview));
  queue.length = 0;
  renderQueue();
  statusEl.textContent = '';
});

$('#date').value = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

async function loadExisting() {
  const res = await fetch('/api/list');
  const data = await res.json();
  $('#countPill').textContent = data.length + ' in gallery';
  const box = $('#existing');
  box.innerHTML = data.length ? '' : '<p class="hint">No photos yet.</p>';
  data.slice().reverse().forEach(item => {
    const fig = document.createElement('figure');
    const slug = item.slug || '';
    const loc = item.location || '';
    fig.innerHTML = `
      <img src="/site/${item.thumb}?t=${Date.now()}" alt="">
      <figcaption>
        <div class="pill">${item.category || ''}</div>
        <div class="cap-title"></div>
        <div class="cap-meta"></div>
        <button type="button" class="rm" data-slug="${slug}" data-file="${(item.filename || '').replace(/"/g, '')}">Remove</button>
      </figcaption>`;
    fig.querySelector('.cap-title').textContent = item.caption || slug;
    fig.querySelector('.cap-meta').textContent = [loc, item.date].filter(Boolean).join(' · ');
    box.appendChild(fig);
  });
  box.querySelectorAll('.rm').forEach(btn => {
    btn.addEventListener('click', () => removePhoto(btn));
  });
}

async function removePhoto(btn) {
  const slug = btn.dataset.slug;
  const filename = btn.dataset.file || '';
  if (!slug) return;
  const label = btn.closest('figure')?.querySelector('.cap-title')?.textContent || slug;
  if (!confirm(`Remove “${label}” permanently?\n\nThis deletes:\n• Full image\n• Thumbnail\n• Gallery HTML block\n• Caption keys (all languages)`)) {
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Removing…';
  logEl.hidden = false;
  try {
    const res = await fetch('/api/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, filename }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    const files = (data.files_removed || []).join(', ') || 'none left on disk';
    log(`✓ Removed ${slug} · HTML=${data.html_removed} · i18n=${data.i18n_keys_removed} · files: ${files}`, 'ok');
    await loadExisting();
  } catch (err) {
    log(`✗ Remove ${slug}: ${err.message}`, 'err');
    btn.disabled = false;
    btn.textContent = 'Remove';
  }
}

uploadBtn.addEventListener('click', async () => {
  if (!queue.length) return;
  const category = $('#category').value;
  const location = $('#location').value.trim() || 'United States';
  const date = $('#date').value.trim() || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  uploadBtn.disabled = true;
  statusEl.textContent = 'Uploading…';
  logEl.innerHTML = '';
  logEl.hidden = false;
  let ok = 0, fail = 0;
  for (const item of [...queue]) {
    const fd = new FormData();
    fd.append('file', item.file);
    fd.append('category', category);
    fd.append('location', location);
    fd.append('date', date);
    fd.append('caption', item.caption);
    try {
      const res = await fetch('/api/add', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      log(`✓ ${item.file.name} → ${data.filename} (${data.thumb_size})`, 'ok');
      ok++;
      URL.revokeObjectURL(item.preview);
      const idx = queue.indexOf(item);
      if (idx >= 0) queue.splice(idx, 1);
    } catch (err) {
      log(`✗ ${item.file.name}: ${err.message}`, 'err');
      fail++;
    }
    renderQueue();
  }
  statusEl.textContent = `Done — ${ok} added` + (fail ? `, ${fail} failed` : '');
  uploadBtn.disabled = queue.length === 0;
  await loadExisting();
});

loadExisting().catch(e => log(String(e), 'err'));
</script>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    server_version = "GalleryManager/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def _send(self, code: int, body: bytes, content_type: str = "text/html; charset=utf-8") -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, obj: object) -> None:
        raw = json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8")
        self._send(code, raw, "application/json; charset=utf-8")

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path in ("/", "/index.html"):
            self._send(200, UI_HTML.encode("utf-8"))
            return
        if path == "/api/list":
            self._json(200, list_photos())
            return
        if path.startswith("/site/"):
            rel = path[len("/site/") :]
            rel = urllib.parse.unquote(rel)
            # only allow reading under project root
            target = (ROOT / rel).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                self._send(403, b"Forbidden")
                return
            if not target.is_file():
                self._send(404, b"Not found")
                return
            ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
            data = target.read_bytes()
            self._send(200, data, ctype)
            return
        self._send(404, b"Not found")

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b""
        ctype = self.headers.get("Content-Type", "")

        if path == "/api/remove":
            try:
                payload = json.loads(body.decode("utf-8") or "{}")
                slug = (payload.get("slug") or "").strip()
                filename = (payload.get("filename") or "").strip() or None
                if not slug:
                    self._json(400, {"error": "Missing slug"})
                    return
                result = remove_one(slug, filename)
                self._json(200, result)
            except FileNotFoundError as e:
                self._json(404, {"error": str(e)})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        if path != "/api/add":
            self._send(404, b"Not found")
            return
        try:
            fields, files = parse_multipart(ctype, body)
            if "file" not in files:
                self._json(400, {"error": "No file uploaded"})
                return
            name, data = files["file"]
            category = (fields.get("category") or ["coast"])[0]
            location = (fields.get("location") or ["United States"])[0]
            date = (fields.get("date") or [datetime.now().strftime("%B %Y")])[0]
            caption = (fields.get("caption") or [None])[0]

            with tempfile.NamedTemporaryFile(suffix=Path(name).suffix or ".jpg", delete=False) as tmp:
                tmp.write(data)
                tmp_path = Path(tmp.name)
            try:
                result = process_one(
                    tmp_path,
                    category=category,
                    location=location,
                    date=date,
                    caption=caption or caption_from_filename(name),
                    alt=caption or caption_from_filename(name),
                )
            finally:
                tmp_path.unlink(missing_ok=True)
            self._json(200, result)
        except Exception as e:
            self._json(500, {"error": str(e)})


def parse_multipart(content_type: str, body: bytes) -> tuple[dict, dict]:
    """Minimal multipart/form-data parser (stdlib only)."""
    fields: dict[str, list[str]] = {}
    files: dict[str, tuple[str, bytes]] = {}
    m = re.search(r"boundary=(.+)", content_type)
    if not m:
        return fields, files
    boundary = m.group(1).strip().strip('"').encode()
    parts = body.split(b"--" + boundary)
    for part in parts:
        if not part or part in (b"--\r\n", b"--", b"\r\n"):
            continue
        if part.startswith(b"--"):
            continue
        if part.startswith(b"\r\n"):
            part = part[2:]
        if part.endswith(b"\r\n"):
            part = part[:-2]
        header_blob, _, data = part.partition(b"\r\n\r\n")
        if data.endswith(b"\r\n"):
            data = data[:-2]
        headers = header_blob.decode("utf-8", errors="replace")
        name_m = re.search(r'name="([^"]+)"', headers)
        if not name_m:
            continue
        name = name_m.group(1)
        fname_m = re.search(r'filename="([^"]*)"', headers)
        if fname_m is not None:
            files[name] = (fname_m.group(1) or "upload.jpg", data)
        else:
            fields.setdefault(name, []).append(data.decode("utf-8", errors="replace"))
    return fields, files


def run_server(port: int = PORT, open_browser: bool = True) -> None:
    ensure_layout()
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"
    print("=" * 56)
    print("  Gallery Manager is running")
    print(f"  Open:  {url}")
    print("  Press Ctrl+C to stop")
    print("=" * 56)
    print(f"  Project: {ROOT}")
    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


def run_cli(args: argparse.Namespace) -> None:
    ensure_layout()
    folder = Path(args.cli).expanduser().resolve()
    if not folder.is_dir():
        die(f"Not a folder: {folder}")

    exts = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"}
    files = sorted(
        p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in exts
    )
    if not files:
        die(f"No images found in {folder}")

    category = args.category
    location = args.location or "United States"
    date = args.date or datetime.now().strftime("%B %Y")

    print(f"Importing {len(files)} photo(s) from {folder}")
    print(f"  category={category}  location={location!r}  date={date!r}")
    ok = 0
    for src in files:
        try:
            r = process_one(
                src,
                category=category,
                location=location,
                date=date,
                dry_run=args.dry_run,
            )
            print(f"  ✓ {src.name} → {r['filename']}")
            ok += 1
        except Exception as e:
            print(f"  ✗ {src.name}: {e}")
    print(f"Done. {ok}/{len(files)} added." + (" (dry-run)" if args.dry_run else ""))
    if not args.dry_run:
        print("Open gallery.html in a browser to review.")


def run_remove(slugs: list[str]) -> None:
    ensure_layout()
    if not slugs:
        die("Pass one or more slugs, e.g. --remove sfgoldengate richmondbay")
    print("Removing:", ", ".join(slugs))
    for raw in slugs:
        slug = Path(raw).stem  # allow passing filename.jpeg
        try:
            r = remove_one(slug)
            print(
                f"  ✓ {r['slug']}: html={r['html_removed']} i18n={r['i18n_keys_removed']} "
                f"files={r['files_removed'] or '—'}"
            )
        except Exception as e:
            print(f"  ✗ {slug}: {e}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Add or remove photos in the USA Travel Guide gallery"
    )
    parser.add_argument(
        "--cli",
        metavar="FOLDER",
        help="Batch-import all images from a folder (no browser UI)",
    )
    parser.add_argument(
        "--remove",
        nargs="+",
        metavar="SLUG",
        help="Fully remove photo(s) by slug (or filename), e.g. sfgoldengate",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List photos currently in the gallery and exit",
    )
    parser.add_argument(
        "--category",
        default="coast",
        choices=CATEGORIES,
        help="Default category for CLI import",
    )
    parser.add_argument("--location", default="", help="Default location string")
    parser.add_argument("--date", default="", help='Default date, e.g. "July 2026"')
    parser.add_argument("--dry-run", action="store_true", help="CLI: parse only, write nothing")
    parser.add_argument("--port", type=int, default=PORT, help=f"UI port (default {PORT})")
    parser.add_argument("--no-browser", action="store_true", help="Don't auto-open browser")
    args = parser.parse_args()

    if args.list:
        ensure_layout()
        for p in list_photos():
            print(f"{p['slug']:24}  {p['category']:12}  {p['caption']}")
        return
    if args.remove:
        run_remove(args.remove)
    elif args.cli:
        run_cli(args)
    else:
        run_server(port=args.port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
