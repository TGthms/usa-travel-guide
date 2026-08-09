#!/usr/bin/env python3
"""
USA Travel Guide — Gallery Manager
==================================
A local mini-app (and CLI) so you can bulk-add trip photos without hand-editing
HTML or making thumbnails yourself.

What it does for each photo (add):
  1. Saves the full photo              → images/gallery/
     JPEG originals are copied byte-for-byte when already upright;
     EXIF Orientation ≠ 1 is baked into pixels (Pillow) so browsers,
     thumbs, and width/height attrs always match the visual image.
     Other formats convert at quality 100 with no resize.
  2. Saves a medium lightbox asset     → images/gallery/medium/
     (long edge ≤ 1920px — quality + performance balance)
  3. Saves a grid thumbnail            → images/gallery/thumbs/
     (long edge ≤ 900px — grid stays fast)
  4. Appends a gallery-item block      → gallery.html
  5. Adds caption keys (es/zh/ja)      → src/js/data/i18n.js
     (slug / i18n key always come from the original filename or caption —
      never from the server tempfile used during browser upload)

  Metadata: date (e.g. "June 1, 2026" or month-only "July 2026") and
  location (e.g. "Los Angeles, CA") can be auto-detected from EXIF/GPS
  via macOS sips + mdls. Full calendar day is preferred when EXIF has it;
  month-only is kept when no day is known (never invent day 1).

What it does on remove (clears ALL of the above):
  · Deletes full + medium + thumb
  · Removes the HTML block from gallery.html
  · Removes caption keys from src/js/data/i18n.js (all languages)

Usage — browser UI (recommended after a long trip):
  cd /path/to/usa-travel-guide
  python3 tools/gallery_manager.py
  # opens http://127.0.0.1:8791

Usage — CLI batch from a folder:
  python3 tools/gallery_manager.py --cli ~/Pictures/california-trip \\
      --category coast --location "Big Sur, California" --date "July 4, 2026"
  # omit --location / --date to auto-detect from each photo's metadata

Usage — rebuild medium assets for existing gallery photos:
  python3 tools/gallery_manager.py --rebuild-media
  # Also bakes EXIF orientation into full files when needed, refreshes
  # thumbs/webp, and patches gallery.html width/height for stable masonry.

Usage — backfill precise dates from EXIF (month-only → Month D, YYYY):
  python3 tools/gallery_manager.py --backfill-dates          # dry-run
  python3 tools/gallery_manager.py --backfill-dates --apply  # write HTML

Usage — CLI remove:
  python3 tools/gallery_manager.py --remove sfgoldengate richmondbay

Requires: Python 3.9+, macOS `sips` (preinstalled), and Pillow (for EXIF
orientation bake). Install with: python3 -m pip install Pillow
"""

from __future__ import annotations

import argparse
import html
import json
import mimetypes
import os
import re
import shutil
import struct
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
MEDIUM_DIR = GALLERY_DIR / "medium"
VIDEOS_DIR = GALLERY_DIR / "videos"
GALLERY_HTML = ROOT / "gallery.html"
# Caption keys live in the data pack (es/zh/ja). Path unchanged after core/features split.
APP_JS = ROOT / "src" / "js" / "data" / "i18n.js"
VIDEO_SUFFIXES = {".mp4", ".mov", ".m4v", ".webm"}
# Soft warning only — videos are copied as-is (can be large for GH/Pages).
VIDEO_WARN_MB = 40.0

CATEGORIES = [
    "cityscapes",
    "landmarks",
    "nature",
    "coast",
    "food-culture",
    "roads",
]

# Full lightbox assets: keep the *real* photo for optional HD upgrade.
# JPEG originals are copied byte-for-byte when upright (no re-encode → color/HDR
# gain maps stay intact). Photos with EXIF Orientation ≠ 1 are re-encoded once
# so pixels match the visual orientation (stable thumbs + masonry aspect).
# Other formats convert without resizing at max JPEG quality.
# Medium is the default viewer size; thumbs stay small for the masonry grid.
FULL_MAX = None  # None = do not resize (preserve original size)
MEDIUM_MAX = 1920
THUMB_MAX = 900
FULL_QUALITY = 100  # only used when format conversion is required (HEIC/PNG/…)
FULL_ORIENT_QUALITY = 95  # re-encode quality when baking EXIF orientation
MEDIUM_QUALITY = 82
THUMB_QUALITY = 72
PORT = 8791
# Serialize gallery.html + i18n.js writes (server is multi-threaded)
_WRITE_LOCK = threading.Lock()
JPEG_SUFFIXES = {".jpg", ".jpeg", ".jpe", ".jfif"}

# Offline reverse-geocode fallback only (lat, lon, "Place, State").
# Kept tight so a distant neighbor city is never preferred over real GPS.
# Primary path uses online reverse geocode (OpenStreetMap Nominatim via curl).
MAX_GEO_KM = 8.0
GEO_CACHE_PATH = ROOT / "tools" / ".geo_cache.json"
US_PLACES: list[tuple[float, float, str]] = [
    # California Bay Area / coast
    (37.7749, -122.4194, "San Francisco, California"),
    (37.8044, -122.2712, "Oakland, California"),
    (37.8715, -122.2730, "Berkeley, California"),
    (37.9358, -122.3477, "Richmond, California"),
    (37.4419, -122.1430, "Palo Alto, California"),
    (37.3382, -121.8863, "San Jose, California"),
    (37.8716, -122.2727, "Berkeley, California"),
    (36.6002, -121.8947, "Monterey, California"),
    (36.5552, -121.9233, "Carmel by the Sea, California"),
    (36.4799, -121.9100, "Garrapata State Beach, California"),
    (36.4193, -121.9152, "Garrapata Beach, California"),
    (36.3724, -121.9015, "Bixby Creek Bridge, California"),
    (36.3575, -121.9029, "CA-1, California"),
    (36.2704, -121.8081, "Big Sur, California"),
    (36.2116, -121.1238, "King City, California"),
    (36.9741, -122.0308, "Santa Cruz, California"),
    (37.7856, -122.4297, "Japantown, San Francisco, California"),
    (37.8199, -122.4783, "Golden Gate Bridge, California"),
    (37.9091, -122.3910, "Richmond, California"),
    (34.4208, -119.6982, "Santa Barbara, California"),
    (34.0522, -118.2437, "Los Angeles, California"),
    (34.0195, -118.4912, "Santa Monica, California"),
    (33.7701, -118.1937, "Long Beach, California"),
    (32.7157, -117.1611, "San Diego, California"),
    (36.7783, -119.4179, "Fresno, California"),
    (38.5816, -121.4944, "Sacramento, California"),
    (39.5296, -119.8138, "Reno, Nevada"),
    (36.1699, -115.1398, "Las Vegas, Nevada"),
    # West
    (47.6062, -122.3321, "Seattle, Washington"),
    (45.5152, -122.6784, "Portland, Oregon"),
    (39.7392, -104.9903, "Denver, Colorado"),
    (40.7608, -111.8910, "Salt Lake City, Utah"),
    (33.4484, -112.0740, "Phoenix, Arizona"),
    (36.0544, -112.1401, "Grand Canyon, Arizona"),
    (35.1983, -111.6513, "Flagstaff, Arizona"),
    # Midwest / South / East
    (41.8781, -87.6298, "Chicago, Illinois"),
    (29.7604, -95.3698, "Houston, Texas"),
    (30.2672, -97.7431, "Austin, Texas"),
    (32.7767, -96.7970, "Dallas, Texas"),
    (29.4241, -98.4936, "San Antonio, Texas"),
    (29.9511, -90.0715, "New Orleans, Louisiana"),
    (33.7490, -84.3880, "Atlanta, Georgia"),
    (25.7617, -80.1918, "Miami, Florida"),
    (28.5383, -81.3792, "Orlando, Florida"),
    (38.9072, -77.0369, "Washington, D.C."),
    (40.7128, -74.0060, "New York, New York"),
    (42.3601, -71.0589, "Boston, Massachusetts"),
    (39.9526, -75.1652, "Philadelphia, Pennsylvania"),
    (36.1627, -86.7816, "Nashville, Tennessee"),
    (21.3069, -157.8583, "Honolulu, Hawaii"),
    (61.2181, -149.9003, "Anchorage, Alaska"),
]

MONTH_NAMES = (
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)
MONTH_NAME_TO_NUM = {name.lower(): i for i, name in enumerate(MONTH_NAMES) if name}

# ── Helpers ─────────────────────────────────────────────────────────────────

def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


# ── Gallery dates: display "June 1, 2026" · ISO wire "2026-06-01" ───────────

def format_display_date(year: int, month: int, day: int | None = None) -> str:
    """
    English gallery date.
    Full day: Month D, YYYY (no zero-padded day).
    Month only: Month YYYY when day is None (no invented day).
    """
    if not (1 <= month <= 12) or year < 1000:
        raise ValueError(f"invalid date {year}-{month}-{day}")
    if day is None:
        return f"{MONTH_NAMES[month]} {int(year)}"
    if not (1 <= day <= 31):
        raise ValueError(f"invalid date {year}-{month}-{day}")
    return f"{MONTH_NAMES[month]} {int(day)}, {int(year)}"


def parse_display_date(s: str) -> tuple[int, int, int | None] | None:
    """
    Parse gallery/display dates into (year, month, day|None).
    Accepts: June 1, 2026; June 2026 (day=None); ISO 2026-06-01.
    Never invents a day for month-only inputs.
    """
    text = (s or "").strip()
    if not text:
        return None
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", text)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return y, mo, d
        return None
    m = re.match(r"^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$", text)
    if m:
        mo = MONTH_NAME_TO_NUM.get(m.group(1).lower())
        if not mo:
            return None
        d, y = int(m.group(2)), int(m.group(3))
        if 1 <= d <= 31:
            return y, mo, d
        return None
    m = re.match(r"^([A-Za-z]+)\s+(\d{4})$", text)
    if m:
        mo = MONTH_NAME_TO_NUM.get(m.group(1).lower())
        if not mo:
            return None
        return int(m.group(2)), mo, None
    return None


def iso_to_display(iso: str) -> str | None:
    parsed = parse_display_date((iso or "").strip())
    if not parsed:
        return None
    y, mo, d = parsed
    try:
        return format_display_date(y, mo, d)
    except ValueError:
        return None


def display_to_iso(display: str) -> str | None:
    """Full day → ISO. Month-only uses day 01 only for <input type=date> wire format."""
    parsed = parse_display_date((display or "").strip())
    if not parsed:
        return None
    y, mo, d = parsed
    day = 1 if d is None else d
    return f"{y:04d}-{mo:02d}-{day:02d}"


def is_month_only_date(s: str) -> bool:
    parsed = parse_display_date((s or "").strip())
    return bool(parsed and parsed[2] is None)


def today_display_date() -> str:
    n = datetime.now()
    return format_display_date(n.year, n.month, n.day)


def normalize_gallery_date(raw: str | None, *, fallback_today: bool = True) -> str:
    """
    Normalize user/API/metadata date to gallery display form.
    Accepts ISO or English display. Month-only stays month-only (no fake day 1).
    Optional today fallback (full calendar day).
    """
    text = (raw or "").strip()
    if text:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", text):
            disp = iso_to_display(text)
            if disp:
                return disp
        parsed = parse_display_date(text)
        if parsed:
            y, mo, d = parsed
            return format_display_date(y, mo, d)
    if fallback_today:
        return today_display_date()
    raise ValueError(f"Unrecognized date: {raw!r}")


def ensure_layout() -> None:
    if not GALLERY_HTML.is_file():
        die(f"gallery.html not found at {GALLERY_HTML}")
    if not APP_JS.is_file():
        die(f"i18n data file not found at {APP_JS}")
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    MEDIUM_DIR.mkdir(parents=True, exist_ok=True)
    if not shutil.which("sips"):
        die("macOS `sips` is required (should be at /usr/bin/sips)")


def slugify(name: str) -> str:
    """Turn a filename or caption into a stable a-z0-9 slug (no separators)."""
    base = Path(name).stem if name else ""
    # Captions may not look like paths — still strip extension-like tails.
    if not base and name:
        base = re.sub(r"\.[A-Za-z0-9]{2,5}$", "", name)
    base = base or name or ""
    base = re.sub(r"[^a-zA-Z0-9]+", "", base).lower()
    return base


def is_temp_or_generic_stem(stem: str) -> bool:
    """
    True for names that must NOT become gallery slugs / i18n keys.
    The web UI saves uploads to NamedTemporaryFile first (e.g. tmpdk2t3a5.jpeg);
    slugging that path was the Japantown bug.
    """
    s = (stem or "").lower()
    s = re.sub(r"[^a-z0-9]", "", s)
    if not s:
        return True
    # Python tempfile: tmpXXXXXX, and some systems use temp*
    if s.startswith("tmp") and len(s) <= 16:
        return True
    if s.startswith("temp") and len(s) <= 20:
        return True
    # Camera dumps with no human meaning (prefer caption instead)
    if re.fullmatch(r"(img|dsc|dscn|pict|photo|image|untitled|screenshot)\d*", s):
        return True
    if re.fullmatch(r"photo\d{6,}", s):  # our own timestamp fallbacks
        return False
    return False


def slug_base_from_sources(
    *,
    original_name: str | None = None,
    src_name: str | None = None,
    caption: str | None = None,
) -> str:
    """
    Pick the best human-meaningful stem for the slug / i18n key.
    Priority: original client filename → caption → src path → timestamp.
    Never uses tempfile names.
    """
    candidates: list[str] = []
    if original_name:
        candidates.append(original_name)
    if caption:
        candidates.append(caption)
    if src_name:
        candidates.append(src_name)

    for raw in candidates:
        stem = Path(raw).stem if raw else ""
        # Caption is often not a path — Path('Japantown').stem works fine
        if not stem:
            stem = re.sub(r"\.[A-Za-z0-9]{2,5}$", "", raw or "")
        if is_temp_or_generic_stem(stem):
            continue
        slug = slugify(stem)
        if slug and not is_temp_or_generic_stem(slug):
            return slug

    # Last resort — unique but readable
    return f"photo{int(time.time())}"


def unique_slug(base: str) -> str:
    """Avoid colliding with existing i18n keys / filenames."""
    base = re.sub(r"[^a-z0-9]", "", (base or "").lower()) or f"photo{int(time.time())}"
    # Never allow a temp-looking base through even if the caller missed a check
    if is_temp_or_generic_stem(base):
        base = f"photo{int(time.time())}"

    existing = set()
    # From HTML
    if GALLERY_HTML.is_file():
        existing.update(re.findall(r"gallery\.item\.([a-z0-9]+)\.caption", GALLERY_HTML.read_text(encoding="utf-8")))
    # From app.js keys (covers keys whose HTML was removed)
    if APP_JS.is_file():
        existing.update(re.findall(r"gallery\.item\.([a-z0-9]+)\.caption", APP_JS.read_text(encoding="utf-8")))
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


def js_escape(s: str) -> str:
    """Escape a string for a double-quoted JS object value."""
    return (
        (s or "")
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", " ")
        .replace("\r", " ")
    )


def find_object_block(src: str, open_brace_index: int) -> tuple[int, int]:
    """
    Given index of `{`, return (content_start, closing_brace_index).
    Brace depth ignores braces inside double-quoted strings.
    """
    if open_brace_index < 0 or open_brace_index >= len(src) or src[open_brace_index] != "{":
        raise ValueError("find_object_block: expected '{'")
    depth = 0
    i = open_brace_index
    in_str = False
    esc = False
    content_start = open_brace_index + 1
    while i < len(src):
        c = src[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return content_start, i
        i += 1
    raise RuntimeError("Unbalanced braces while scanning i18n.js language block")


def describe_alt(
    caption: str,
    location: str = "",
    category: str = "",
    date: str = "",
) -> str:
    """
    Build a VoiceOver-friendly description (not a bare title).
    Example: "Photograph of Golden Gate Bridge in San Francisco, California — landmark, May 23, 2026"
    """
    cat_phrase = {
        "landmarks": "landmark",
        "coast": "coastal scene",
        "nature": "nature landscape",
        "roads": "road trip view",
        "cities": "city scene",
        "food": "food photo",
        "parks": "park scene",
        "desert": "desert landscape",
        "nightlife": "night scene",
        "hotels": "hotel exterior",
        "attractions": "attraction",
        "lasvegas": "Las Vegas scene",
        "california": "California travel photo",
    }
    subject = (caption or "Travel photograph").strip()
    loc = (location or "").strip()
    if loc.endswith(", CA"):
        loc_full = loc.replace(", CA", ", California")
    elif loc.endswith(", NV"):
        loc_full = loc.replace(", NV", ", Nevada")
    elif loc.endswith(", UT"):
        loc_full = loc.replace(", UT", ", Utah")
    else:
        loc_full = loc
    kind = cat_phrase.get((category or "").strip().lower(), "travel photograph")
    if loc_full:
        loc_key = loc_full.split(",")[0].strip().lower()
        alt = f"Photograph of {subject}"
        if loc_key and loc_key not in subject.lower():
            alt += f" in {loc_full}"
        elif loc_full and loc_full.lower() not in subject.lower():
            alt += f", {loc_full}"
        alt += f" — {kind}"
    else:
        alt = f"Photograph of {subject} — {kind}"
    if (date or "").strip():
        alt += f", {date.strip()}"
    alt = re.sub(r"\s+", " ", alt).strip()
    if len(alt) > 180:
        alt = alt[:177].rsplit(" ", 1)[0] + "…"
    return alt


def write_webp_from_jpeg(jpeg_path: Path, webp_path: Path, quality: int = 82) -> bool:
    """
    Encode a WebP beside a JPEG (thumbs / medium only — never Full/HDR originals).
    Uses Pillow when available. Returns True on success.
    """
    try:
        from PIL import Image  # type: ignore
    except ImportError:
        return False
    try:
        jpeg_path = Path(jpeg_path)
        webp_path = Path(webp_path)
        if not jpeg_path.is_file():
            return False
        webp_path.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(jpeg_path) as im:
            # Flatten alpha for web gallery photos
            if im.mode in ("RGBA", "P"):
                im = im.convert("RGB")
            elif im.mode != "RGB":
                im = im.convert("RGB")
            im.save(webp_path, "WEBP", quality=int(quality), method=4)
        return webp_path.is_file() and webp_path.stat().st_size > 32
    except Exception:
        return False


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
    """Read pixel dimensions via sips. Raises RuntimeError with context on failure."""
    try:
        out = subprocess.check_output(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
            text=True,
            stderr=subprocess.STDOUT,
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(
            f"sips failed reading dimensions for {path}: {e.output or e}"
        ) from e
    except OSError as e:
        raise RuntimeError(f"sips could not run for {path}: {e}") from e
    wm = re.search(r"pixelWidth:\s*(\d+)", out)
    hm = re.search(r"pixelHeight:\s*(\d+)", out)
    if not wm or not hm:
        # Common when dest is empty/corrupt after a failed export
        raise RuntimeError(
            f"Could not parse image dimensions for {path}. sips output:\n{out!r}"
        )
    return int(wm.group(1)), int(hm.group(1))


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import radians, sin, cos, sqrt, atan2
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * atan2(sqrt(a), sqrt(1 - a))


def _geo_cache_key(lat: float, lon: float) -> str:
    # ~11 m precision — enough to reuse nearby lookups
    return f"{lat:.4f},{lon:.4f}"


def _load_geo_cache() -> dict:
    try:
        if GEO_CACHE_PATH.is_file():
            return json.loads(GEO_CACHE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        pass
    return {}


def _save_geo_cache(cache: dict) -> None:
    try:
        GEO_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        GEO_CACHE_PATH.write_text(json.dumps(cache, indent=0, ensure_ascii=False), encoding="utf-8")
    except OSError:
        pass


# Full US state/territory name → postal abbreviation (gallery style: "City, CA")
_STATE_NAME_TO_ABBREV = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC", "washington, d.c.": "DC", "washington d.c.": "DC",
    "washington dc": "DC",
}
_STATE_ABBREV = set(_STATE_NAME_TO_ABBREV.values()) | {"DC"}


def _normalize_state_name(state: str) -> str:
    """
    Normalize a state token to a 2-letter US postal code when possible.
    Auto-detect and gallery data prefer "Los Angeles, CA" over "... California".
    """
    s = (state or "").strip()
    if not s:
        return ""
    # Already an abbreviation
    if len(s) == 2 and s.upper() in _STATE_ABBREV:
        return s.upper()
    key = re.sub(r"\s+", " ", s.lower().replace(".", ""))
    key = key.replace(" ,", ",").strip()
    if key in _STATE_NAME_TO_ABBREV:
        return _STATE_NAME_TO_ABBREV[key]
    # "California, USA" / trailing country noise
    key2 = re.sub(r",?\s*(usa|us|united states)$", "", key).strip()
    if key2 in _STATE_NAME_TO_ABBREV:
        return _STATE_NAME_TO_ABBREV[key2]
    return s


def _abbreviate_location_state(location: str) -> str:
    """If location ends with ', FullStateName', rewrite to ', ST'."""
    loc = (location or "").strip()
    if not loc or "," not in loc:
        return loc
    place, state = loc.rsplit(",", 1)
    abbr = _normalize_state_name(state.strip())
    if not abbr:
        return loc
    return f"{place.strip()}, {abbr}"


def _is_generic_road_name(s: str) -> bool:
    """True for ordinary streets (not landmark names like 'Bixby Creek Bridge')."""
    s = (s or "").strip()
    if not s:
        return True
    # Compound highway labels often encode a real place after " / "
    if " / " in s:
        return False
    return bool(
        re.search(
            r"\b(Path|Road|Avenue|Street|Blvd|Boulevard|Drive|Way|Lane|"
            r"Hwy|Highway|Trail|Alley|Court|Place|Circle|Terrace)\s*$",
            s,
            re.I,
        )
    )


def _looks_like_landmark_name(s: str) -> bool:
    s = (s or "").strip()
    if not s:
        return False
    return bool(
        re.search(
            r"\b(Beach|Bridge|State Park|National Park|Canyon|Falls|"
            r"Overlook|Viewpoint|Lighthouse|Monument|Bluff|Cove|"
            r"Preserve|Refuge|Memorial|Pier|Harbor|Harbour)\b",
            s,
            re.I,
        )
    )


def _clean_place_fragment(s: str) -> str:
    """Normalize 'Carmel-by-the-Sea' → 'Carmel by the Sea'; strip noise."""
    s = (s or "").strip()
    s = s.replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    # "Highway 1 / Garrapata Beach" → prefer the place after slash
    if " / " in s:
        right = s.split(" / ")[-1].strip()
        if right and (_looks_like_landmark_name(right) or len(right) > 3):
            s = right
    return s


_GENERIC_LANDMARK_NAMES = {
    "view", "viewpoint", "scenic view", "lookout", "parking", "parking lot",
    "trail", "path", "picnic", "picnic area", "restroom", "restrooms",
    "toilet", "gate", "entrance", "exit", "unnamed", "yes",
}


def _format_nominatim_result(data: dict) -> str | None:
    """
    Build gallery-style "Place, State" from Nominatim reverse JSON.
    Uses the exact GPS point (high zoom), then picks the best human place:
    landmark → city/village → neighbourhood → county.
    Skips POI noise (parking lots, restaurants) and generic road names.
    """
    if not data or data.get("error"):
        return None
    addr = data.get("address") or {}
    state = _normalize_state_name(addr.get("state") or "")
    if not state and (addr.get("ISO3166-2-lvl4") or "").startswith("US-"):
        state = _normalize_state_name((addr.get("ISO3166-2-lvl4") or "")[3:])

    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("municipality")
        or addr.get("hamlet")
    )
    if city:
        city = _clean_place_fragment(city)

    neighbourhood = addr.get("neighbourhood") or addr.get("suburb") or addr.get("quarter")
    if neighbourhood:
        neighbourhood = _clean_place_fragment(neighbourhood)

    county = (addr.get("county") or "").strip()

    name = _clean_place_fragment(data.get("name") or "")
    category = (data.get("category") or "").strip().lower()
    addresstype = (data.get("addresstype") or data.get("type") or "").strip().lower()
    road = _clean_place_fragment(addr.get("road") or addr.get("highway") or "")

    # Categories that are almost never the place we want as the label
    skip_categories = {
        "amenity", "shop", "office", "craft", "building", "club", "healthcare",
        "place_of_worship", "man_made", "emergency",
    }
    # leisure subtypes that are minor facilities, not places
    skip_leisure_types = {
        "fishing", "pitch", "sports_centre", "fitness_centre", "playground",
        "dog_park", "slipway", "marina", "track",
    }

    landmark: str | None = None

    # 1) Explicit landmark-worthy names from the reverse hit
    if name and name.lower() not in _GENERIC_LANDMARK_NAMES:
        if category not in skip_categories:
            if category == "leisure" and addresstype in skip_leisure_types:
                pass
            elif _looks_like_landmark_name(name):
                landmark = name
            elif category in {"tourism", "natural", "historic", "waterway"} and addresstype != "hotel":
                # Named viewpoints etc. — keep only if name is specific (not "View")
                if len(name) >= 4 and name.lower() not in _GENERIC_LANDMARK_NAMES:
                    # Prefer city over ultra-generic tourism labels
                    if addresstype == "viewpoint" and city and name.lower() in {
                        "view", "scenic viewpoint", "lookout point",
                    }:
                        landmark = None
                    elif addresstype == "viewpoint" and city and len(name) < 8:
                        # Short generic viewpoint names → city wins (e.g. "View")
                        landmark = None
                    else:
                        landmark = name
            elif category == "highway" and _looks_like_landmark_name(name):
                landmark = name

    # 2) Road field only when it's clearly a named landmark (bridge/beach…), not "Main St"
    if not landmark and road and not _is_generic_road_name(road):
        if _looks_like_landmark_name(road):
            landmark = road

    # 3) Address tourism/natural keys (sometimes set even when top-level name is weak)
    if not landmark:
        for key in ("tourism", "natural", "leisure", "historic"):
            val = _clean_place_fragment(addr.get(key) or "")
            if val and val.lower() not in _GENERIC_LANDMARK_NAMES and _looks_like_landmark_name(val):
                landmark = val
                break
            # Named viewpoint with a real title
            if key == "tourism" and val and len(val) >= 10 and val.lower() not in _GENERIC_LANDMARK_NAMES:
                landmark = val
                break

    place: str | None = None
    if landmark:
        place = landmark
    elif neighbourhood and city and neighbourhood.lower() != city.lower():
        # "Japantown, San Francisco"
        place = f"{neighbourhood}, {city}"
        if state and state not in place:
            return f"{place}, {state}"
        return place
    elif city:
        place = city
    elif neighbourhood:
        place = neighbourhood
    elif county:
        place = county
    else:
        return None

    if not place:
        return None
    if state and state not in place:
        return f"{place}, {state}"
    return place


def reverse_geocode_online(lat: float, lon: float) -> str | None:
    """
    Precise reverse geocode using OpenStreetMap Nominatim.
    Uses macOS `curl` (reliable SSL); results cached under tools/.geo_cache.json.
    """
    cache = _load_geo_cache()
    key = _geo_cache_key(lat, lon)
    if key in cache and cache[key]:
        return cache[key]

    if not shutil.which("curl"):
        return None

    # High zoom → landmark / street-level precision (not county centroid)
    url = (
        "https://nominatim.openstreetmap.org/reverse"
        f"?lat={lat:.7f}&lon={lon:.7f}"
        "&format=jsonv2&addressdetails=1&zoom=18"
    )
    try:
        raw = subprocess.check_output(
            [
                "curl", "-sS",
                "-A", "USA-Travel-Guide-GalleryManager/1.0 (local admin; reverse-geocode)",
                "--max-time", "10",
                url,
            ],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        data = json.loads(raw) if raw.strip() else {}
    except (subprocess.CalledProcessError, json.JSONDecodeError, OSError):
        return None

    label = _format_nominatim_result(data)
    if label:
        cache[key] = label
        # Cap cache size
        if len(cache) > 500:
            for k in list(cache.keys())[:100]:
                cache.pop(k, None)
        _save_geo_cache(cache)
        # Be polite to Nominatim when batching
        time.sleep(0.35)
    return label


def reverse_geocode_local(lat: float, lon: float) -> str | None:
    """
    Offline fallback: nearest curated place, only if very close (≤ MAX_GEO_KM).
    Never stretch to a distant city — that caused wrong-city labels.
    """
    best: tuple[float, str] | None = None
    for plat, plon, label in US_PLACES:
        d = _haversine_km(lat, lon, plat, plon)
        if best is None or d < best[0]:
            best = (d, label)
    if best is None:
        return None
    if best[0] <= MAX_GEO_KM:
        return best[1]
    return None


def _is_weak_place_label(label: str | None) -> bool:
    """County-only / country-only labels are weak — prefer a closer local landmark."""
    if not label:
        return True
    s = label.strip().lower()
    if s in {"united states", "usa", "us", "america"}:
        return True
    if re.search(r"\bcounty\b", s) and not re.search(
        r"\b(beach|bridge|park|city|town)\b", s
    ):
        return True
    return False


def reverse_geocode(lat: float, lon: float) -> str | None:
    """
    Precise place for GPS coordinates.
    1) Online reverse geocode at the exact lat/lon (primary)
    2) If online is weak (e.g. only "Monterey County") or offline, use a
       tight local landmark table (≤ ~8 km) so a bridge/beach isn't labeled
       as a distant neighbor city.
    """
    online = reverse_geocode_online(lat, lon)
    local = reverse_geocode_local(lat, lon)

    if online and not _is_weak_place_label(online):
        return online
    if local:
        return local
    return online


def _mdls_float(path: Path, key: str) -> float | None:
    """Spotlight metadata — only works for indexed files, NOT browser temp uploads."""
    if not shutil.which("mdls"):
        return None
    try:
        out = subprocess.check_output(
            ["mdls", "-name", key, "-raw", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
        if not out or out == "(null)":
            return None
        return float(out)
    except (subprocess.CalledProcessError, ValueError, OSError):
        return None


def _sips_creation(path: Path) -> str | None:
    """Return 'Month D, YYYY' from sips creation, or None."""
    try:
        out = subprocess.check_output(
            ["sips", "-g", "creation", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, OSError):
        return None
    m = re.search(r"creation:\s*(\d{4}):(\d{2}):(\d{2})", out)
    if not m:
        return None
    year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return format_display_date(year, month, day)
    except ValueError:
        return None


def _display_date_from_exif_datetime(s: str) -> str | None:
    """Parse EXIF DateTimeOriginal 'YYYY:MM:DD HH:MM:SS' → 'Month D, YYYY'."""
    m = re.match(r"^(\d{4}):(\d{2}):(\d{2})", (s or "").strip())
    if not m:
        return None
    year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return format_display_date(year, month, day)
    except ValueError:
        return None


# Back-compat alias for any internal call sites still using the old name.
def _month_year_from_exif_datetime(s: str) -> str | None:
    return _display_date_from_exif_datetime(s)


def _dms_to_deg(vals: list[float]) -> float:
    if not vals:
        return 0.0
    d = vals[0] if len(vals) > 0 else 0.0
    m = vals[1] if len(vals) > 1 else 0.0
    s = vals[2] if len(vals) > 2 else 0.0
    return d + m / 60.0 + s / 3600.0


def _read_exif_gps_from_jpeg_bytes(data: bytes) -> tuple[float, float] | None:
    """
    Parse GPSLatitude/GPSLongitude from JPEG APP1 EXIF.
    Works on any copy of the file (including browser upload temps) — does NOT
    rely on Spotlight/mdls, which only indexes permanent disk locations.
    """
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return None

    i = 2
    n = len(data)
    while i < n - 4:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xD8, 0xD9):  # SOI / EOI
            i += 2
            continue
        if marker == 0xDA:  # SOS — image data follows
            break
        if marker == 0x00 or marker == 0xFF:
            i += 1
            continue
        if i + 4 > n:
            break
        seglen = struct.unpack(">H", data[i + 2 : i + 4])[0]
        if seglen < 2 or i + 2 + seglen > n:
            break
        # APP1 Exif
        if marker == 0xE1 and seglen >= 14 and data[i + 4 : i + 10] == b"Exif\x00\x00":
            tiff = data[i + 10 : i + 2 + seglen]
            gps = _parse_tiff_gps(tiff)
            if gps:
                return gps
        i += 2 + seglen
    return None


def _parse_tiff_gps(tiff: bytes) -> tuple[float, float] | None:
    if len(tiff) < 8:
        return None
    if tiff[:2] == b"II":
        endian = "<"
    elif tiff[:2] == b"MM":
        endian = ">"
    else:
        return None
    try:
        if struct.unpack(endian + "H", tiff[2:4])[0] != 42:
            return None
        ifd0 = struct.unpack(endian + "I", tiff[4:8])[0]
    except struct.error:
        return None

    def read_ifd(offset: int) -> dict[int, tuple[int, int, int]]:
        tags: dict[int, tuple[int, int, int]] = {}
        if offset <= 0 or offset + 2 > len(tiff):
            return tags
        try:
            count = struct.unpack(endian + "H", tiff[offset : offset + 2])[0]
        except struct.error:
            return tags
        pos = offset + 2
        for _ in range(count):
            if pos + 12 > len(tiff):
                break
            try:
                tag, typ, cnt, val = struct.unpack(endian + "HHII", tiff[pos : pos + 12])
            except struct.error:
                break
            tags[tag] = (typ, cnt, val)
            pos += 12
        return tags

    def type_size(typ: int) -> int:
        return {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8}.get(typ, 1)

    def entry_bytes(typ: int, cnt: int, val: int) -> bytes:
        size = type_size(typ) * cnt
        if size <= 4:
            return struct.pack(endian + "I", val)[:size]
        if val + size > len(tiff):
            return b""
        return tiff[val : val + size]

    def read_rationals(typ: int, cnt: int, val: int) -> list[float]:
        raw = entry_bytes(typ, cnt, val)
        out: list[float] = []
        for j in range(0, min(len(raw), cnt * 8), 8):
            try:
                num, den = struct.unpack(endian + "II", raw[j : j + 8])
            except struct.error:
                break
            out.append((num / den) if den else 0.0)
        return out

    def read_ascii(typ: int, cnt: int, val: int) -> str:
        raw = entry_bytes(typ, cnt, val)
        return raw.split(b"\x00")[0].decode("ascii", "ignore").strip()

    ifd0_tags = read_ifd(ifd0)
    gps_ptr = ifd0_tags.get(0x8825)  # GPSInfo IFD pointer
    if not gps_ptr:
        return None
    _, _, gps_off = gps_ptr
    gps_tags = read_ifd(gps_off)
    if 2 not in gps_tags or 4 not in gps_tags:
        return None

    lat_typ, lat_cnt, lat_val = gps_tags[2]
    lon_typ, lon_cnt, lon_val = gps_tags[4]
    lat_dms = read_rationals(lat_typ, lat_cnt, lat_val)
    lon_dms = read_rationals(lon_typ, lon_cnt, lon_val)
    if len(lat_dms) < 1 or len(lon_dms) < 1:
        return None

    lat = _dms_to_deg(lat_dms)
    lon = _dms_to_deg(lon_dms)

    if 1 in gps_tags:
        t, c, v = gps_tags[1]
        ref = read_ascii(t, c, v).upper()
        if ref.startswith("S"):
            lat = -abs(lat)
        elif ref.startswith("N"):
            lat = abs(lat)
    if 3 in gps_tags:
        t, c, v = gps_tags[3]
        ref = read_ascii(t, c, v).upper()
        if ref.startswith("W"):
            lon = -abs(lon)
        elif ref.startswith("E"):
            lon = abs(lon)

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    if lat == 0.0 and lon == 0.0:
        return None
    return lat, lon


def _read_exif_datetime_from_jpeg_bytes(data: bytes) -> str | None:
    """Return 'Month Year' from DateTimeOriginal / DateTime in JPEG EXIF."""
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return None
    i = 2
    n = len(data)
    while i < n - 4:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker == 0xDA:
            break
        if marker in (0x00, 0xFF):
            i += 1
            continue
        if i + 4 > n:
            break
        seglen = struct.unpack(">H", data[i + 2 : i + 4])[0]
        if seglen < 2 or i + 2 + seglen > n:
            break
        if marker == 0xE1 and seglen >= 14 and data[i + 4 : i + 10] == b"Exif\x00\x00":
            tiff = data[i + 10 : i + 2 + seglen]
            dt = _parse_tiff_datetime(tiff)
            if dt:
                return dt
        i += 2 + seglen
    return None


def _parse_tiff_datetime(tiff: bytes) -> str | None:
    if len(tiff) < 8:
        return None
    if tiff[:2] == b"II":
        endian = "<"
    elif tiff[:2] == b"MM":
        endian = ">"
    else:
        return None
    try:
        if struct.unpack(endian + "H", tiff[2:4])[0] != 42:
            return None
        ifd0 = struct.unpack(endian + "I", tiff[4:8])[0]
    except struct.error:
        return None

    def read_ifd(offset: int) -> dict[int, tuple[int, int, int]]:
        tags: dict[int, tuple[int, int, int]] = {}
        if offset <= 0 or offset + 2 > len(tiff):
            return tags
        try:
            count = struct.unpack(endian + "H", tiff[offset : offset + 2])[0]
        except struct.error:
            return tags
        pos = offset + 2
        for _ in range(count):
            if pos + 12 > len(tiff):
                break
            try:
                tag, typ, cnt, val = struct.unpack(endian + "HHII", tiff[pos : pos + 12])
            except struct.error:
                break
            tags[tag] = (typ, cnt, val)
            pos += 12
        return tags

    def ascii_at(typ: int, cnt: int, val: int) -> str:
        size = cnt
        if size <= 4:
            raw = struct.pack(endian + "I", val)[:size]
        else:
            if val + size > len(tiff):
                return ""
            raw = tiff[val : val + size]
        return raw.split(b"\x00")[0].decode("ascii", "ignore")

    ifd0_tags = read_ifd(ifd0)
    # Prefer DateTimeOriginal from Exif IFD (0x8769 → tag 0x9003)
    exif_ptr = ifd0_tags.get(0x8769)
    candidates: list[str] = []
    if exif_ptr:
        _, _, exif_off = exif_ptr
        exif_tags = read_ifd(exif_off)
        for tag in (0x9003, 0x9004):  # DateTimeOriginal, DateTimeDigitized
            if tag in exif_tags:
                t, c, v = exif_tags[tag]
                if t == 2:
                    candidates.append(ascii_at(t, c, v))
    if 0x0132 in ifd0_tags:  # DateTime
        t, c, v = ifd0_tags[0x0132]
        if t == 2:
            candidates.append(ascii_at(t, c, v))
    for s in candidates:
        disp = _display_date_from_exif_datetime(s)
        if disp:
            return disp
    return None


def _jpeg_bytes_for_exif(path: Path) -> bytes | None:
    """
    Return JPEG bytes suitable for EXIF parsing.
    HEIC/PNG/etc. are converted once via sips so GPS still works for iPhone HEIC uploads.
    """
    try:
        raw = path.read_bytes()
    except OSError:
        return None
    if raw[:2] == b"\xff\xd8":
        return raw
    # Convert non-JPEG to a temp JPEG (quality doesn't matter for EXIF GPS)
    with tempfile.NamedTemporaryFile(suffix=".jpeg", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        subprocess.check_call(
            [
                "sips",
                "-s", "format", "jpeg",
                "-s", "formatOptions", "70",
                str(path),
                "--out", str(tmp_path),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return tmp_path.read_bytes()
    except (subprocess.CalledProcessError, OSError):
        return None
    finally:
        tmp_path.unlink(missing_ok=True)


def _read_gps_coords(path: Path) -> tuple[float, float] | None:
    """GPS from embedded EXIF first (works on temp uploads); mdls as fallback."""
    jpeg = _jpeg_bytes_for_exif(path)
    if jpeg:
        gps = _read_exif_gps_from_jpeg_bytes(jpeg)
        if gps:
            return gps
    lat = _mdls_float(path, "kMDItemLatitude")
    lon = _mdls_float(path, "kMDItemLongitude")
    if lat is not None and lon is not None:
        return lat, lon
    return None


# Treat these as "no real location yet" so auto-detect can still win.
LOCATION_PLACEHOLDERS = {
    "",
    "united states",
    "usa",
    "us",
    "america",
    "unknown",
    "auto",
    "n/a",
    "na",
}


def is_placeholder_location(location: str | None) -> bool:
    return (location or "").strip().lower() in LOCATION_PLACEHOLDERS


def extract_photo_metadata(path: Path) -> dict:
    """
    Read EXIF/filesystem metadata for a local image.
    Returns {date, location, lat, lon, source_date, source_location}.
    date format matches gallery: "July 4, 2026".
    location format matches gallery: "Los Angeles, CA".

    GPS is read from the file's own EXIF bytes (not Spotlight), so browser
    multipart temp uploads still resolve correctly.
    """
    result: dict = {
        "date": None,
        "location": None,
        "lat": None,
        "lon": None,
        "source_date": None,
        "source_location": None,
    }
    if not path.is_file():
        return result

    # Date: prefer true EXIF DateTimeOriginal, then sips creation
    jpeg = _jpeg_bytes_for_exif(path)
    if jpeg:
        dt = _read_exif_datetime_from_jpeg_bytes(jpeg)
        if dt:
            result["date"] = dt
            result["source_date"] = "exif"
    if not result["date"]:
        date_str = _sips_creation(path)
        if date_str:
            result["date"] = date_str
            result["source_date"] = "sips"

    gps = _read_gps_coords(path)
    if gps:
        lat, lon = gps
        result["lat"] = lat
        result["lon"] = lon
        place = reverse_geocode(lat, lon)
        if place:
            result["location"] = place
            result["source_location"] = "gps"
        # GPS present but no city table hit → leave location unset so the
        # generic fallback "United States" is used (not raw coordinates).
        else:
            result["source_location"] = "gps-unmatched"
    if result.get("location"):
        result["location"] = _abbreviate_location_state(result["location"])
    return result


def _exif_orientation(path: Path) -> int | None:
    """Return EXIF Orientation tag (1–8) or None if missing / unreadable."""
    try:
        from PIL import Image

        with Image.open(path) as im:
            exif = im.getexif()
            if not exif:
                return None
            o = exif.get(274)  # Orientation
            return int(o) if o is not None else None
    except Exception:
        return None


def needs_orientation_bake(path: Path) -> bool:
    """True when EXIF Orientation is present and not upright (1)."""
    o = _exif_orientation(path)
    return o is not None and o != 1


def bake_orientation_to_path(
    src: Path,
    dest: Path,
    *,
    quality: int = FULL_ORIENT_QUALITY,
) -> tuple[int, int, bool]:
    """
    Write an upright JPEG to dest with EXIF orientation applied to pixels.

    Returns (width, height, changed). If no bake was needed, dest is a copy of
    src when paths differ (or left as-is when same); changed=False.
    Requires Pillow. Falls back to a plain copy if Pillow fails.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image, ImageOps, ImageFile

        ImageFile.LOAD_TRUNCATED_IMAGES = True
        with Image.open(src) as im:
            orient = None
            try:
                exif = im.getexif()
                if exif:
                    orient = exif.get(274)
            except Exception:
                orient = None
            if orient is None or int(orient) == 1:
                if src.resolve() != dest.resolve():
                    shutil.copy2(src, dest)
                return im.size[0], im.size[1], False

            icc = im.info.get("icc_profile")
            fixed = ImageOps.exif_transpose(im)
            if fixed is None:
                fixed = im
            if fixed.mode not in ("RGB", "L"):
                fixed = fixed.convert("RGB")
            elif fixed.mode == "L":
                fixed = fixed.convert("RGB")

            tmp_dir = Path(tempfile.mkdtemp(prefix="gm-orient-"))
            tmp_path = tmp_dir / "out.jpeg"
            try:
                save_kw: dict = {
                    "format": "JPEG",
                    "quality": int(quality),
                    "optimize": True,
                    "subsampling": 0,
                }
                if icc:
                    save_kw["icc_profile"] = icc
                fixed.save(tmp_path, **save_kw)
                shutil.move(str(tmp_path), str(dest))
                return fixed.size[0], fixed.size[1], True
            finally:
                shutil.rmtree(tmp_dir, ignore_errors=True)
    except Exception as e:
        sys.stderr.write(f"[gallery_manager] orientation bake failed for {src.name}: {e}\n")
        if src.resolve() != dest.resolve():
            shutil.copy2(src, dest)
        return (*sips_size(dest), False)


def bake_orientation_inplace(
    path: Path, *, quality: int = FULL_ORIENT_QUALITY
) -> tuple[int, int, bool]:
    """Bake EXIF orientation into path in place. Returns (w, h, changed)."""
    if not needs_orientation_bake(path):
        return (*sips_size(path), False)
    return bake_orientation_to_path(path, path, quality=quality)


def sips_export(
    src: Path,
    dest: Path,
    max_edge: int | None,
    quality: int,
) -> tuple[int, int]:
    """
    Export via macOS sips as JPEG.
    - max_edge set: downscale so the long edge is at most max_edge (thumbs).
    - max_edge None/0: keep original pixel dimensions.
    Always auto-orients first when EXIF Orientation ≠ 1 so thumb/medium
    pixels match the visual image (stable masonry width/height attrs).
    Re-encoding always risks losing HDR gain maps / subtle color — prefer
    export_full_image() for lightbox assets so upright JPEGs are copied.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    work_src = src
    orient_tmp_dir: Path | None = None
    if needs_orientation_bake(src):
        orient_tmp_dir = Path(tempfile.mkdtemp(prefix="gm-sips-orient-"))
        work_src = orient_tmp_dir / "upright.jpeg"
        bake_orientation_to_path(src, work_src)

    # Do not pre-create the temp file: sips can fail or write a broken JPEG when
    # targeting an already-opened/empty path on some macOS versions.
    tmp_path = Path(tempfile.mkdtemp(prefix="gm-sips-")) / "out.jpeg"
    try:
        cmd = ["sips"]
        if max_edge:
            cmd += ["-Z", str(int(max_edge))]
        cmd += [
            "-s", "format", "jpeg",
            "-s", "formatOptions", str(quality),
            str(work_src),
            "--out", str(tmp_path),
        ]
        try:
            subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            err = (e.stderr or b"").decode("utf-8", "replace")
            raise RuntimeError(f"sips export failed for {src.name}: {err or e}") from e
        if not tmp_path.is_file() or tmp_path.stat().st_size < 32:
            raise RuntimeError(f"sips produced empty/invalid output for {src.name}")
        shutil.move(str(tmp_path), str(dest))
    finally:
        try:
            if tmp_path.parent.is_dir():
                shutil.rmtree(tmp_path.parent, ignore_errors=True)
        except OSError:
            pass
        if orient_tmp_dir is not None:
            shutil.rmtree(orient_tmp_dir, ignore_errors=True)
    return sips_size(dest)


def _looks_like_jpeg(path: Path) -> bool:
    """True if extension or magic bytes say this is already a JPEG."""
    if path.suffix.lower() in JPEG_SUFFIXES:
        return True
    try:
        head = path.read_bytes()[:3]
        return head == b"\xff\xd8\xff"
    except OSError:
        return False


def export_full_image(src: Path, dest: Path) -> tuple[int, int, str]:
    """
    Save the lightbox / full-size asset with maximum fidelity.

    - Already JPEG and upright → byte-for-byte copy (keeps original quality,
      ICC profile, EXIF, and any HDR gain-map metadata).
    - Already JPEG but EXIF Orientation ≠ 1 → bake pixels upright once
      (required for correct thumbs + masonry aspect; mode "orient").
    - HEIC / PNG / WebP / etc. → convert to JPEG at quality 100, no resize
      (web gallery uses .jpeg paths; true HDR gain maps may still be lost
      on HEIC→JPEG — export JPEG from Photos when you need that).

    Returns (width, height, mode) where mode is "copy", "orient", or "convert".
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    if _looks_like_jpeg(src):
        if needs_orientation_bake(src):
            w, h, _ = bake_orientation_to_path(src, dest, quality=FULL_ORIENT_QUALITY)
            return w, h, "orient"
        # Exact original file — never re-encode when already upright.
        if src.resolve() != dest.resolve():
            shutil.copy2(src, dest)
        return (*sips_size(dest), "copy")

    # Format conversion required for the site's .jpeg URLs — no downscale.
    # sips_export already auto-orients when needed.
    sips_export(src, dest, max_edge=None, quality=FULL_QUALITY)
    return (*sips_size(dest), "convert")


def parse_location_parts(location: str) -> tuple[str, str]:
    """Split 'City, State' → (city/place, state)."""
    loc = (location or "").strip()
    if not loc:
        return "", ""
    if "," in loc:
        place, state = loc.rsplit(",", 1)
        return place.strip(), state.strip()
    return loc, ""


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
    video_filename: str | None = None,
    thumb_webp: bool = False,
    medium_webp: bool = False,
) -> str:
    alt_esc = html.escape(alt or describe_alt(caption, location, category, date), quote=True)
    loc_esc = html.escape(location, quote=True)
    date_esc = html.escape(date, quote=True)
    cat_esc = html.escape(category, quote=True)
    file_esc = html.escape(filename, quote=True)
    stem = Path(filename).stem
    city, state = parse_location_parts(location)
    city_esc = html.escape(city, quote=True)
    state_esc = html.escape(state, quote=True)
    media_attr = ' data-media="video"' if video_filename else ""
    video_attr = ""
    webp_attrs = ""
    if thumb_webp:
        webp_attrs += f' data-thumb-webp="images/gallery/thumbs/{html.escape(stem, quote=True)}.webp"'
    if medium_webp:
        webp_attrs += f' data-medium-webp="images/gallery/medium/{html.escape(stem, quote=True)}.webp"'
    if video_filename:
        v_esc = html.escape(video_filename, quote=True)
        video_attr = f' data-video="images/gallery/videos/{v_esc}"'
    badge = ""
    if video_filename:
        badge = (
            '      <span class="gallery-video-badge" aria-hidden="true">'
            '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">'
            '<path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/>'
            '</svg><span data-i18n="gallery.videoBadge">Video</span></span>\n'
        )
    return (
        f'    <div class="gallery-item"{media_attr} data-category="{cat_esc}" '
        f'data-location="{loc_esc}" data-city="{city_esc}" data-state="{state_esc}" '
        f'data-date="{date_esc}" tabindex="0" role="button">\n'
        f'      <img src="images/gallery/thumbs/{file_esc}" '
        f'data-thumb="images/gallery/thumbs/{file_esc}" '
        f'data-medium="images/gallery/medium/{file_esc}" '
        f'data-full="images/gallery/{file_esc}"{webp_attrs}{video_attr} '
        f'width="{tw}" height="{th}" alt="{alt_esc}" loading="lazy" decoding="async">\n'
        f"{badge}"
        f'      <div class="gallery-caption" data-i18n="gallery.item.{slug}.caption">'
        f"{html.escape(caption)}</div>\n"
        f"    </div>\n"
    )


def insert_gallery_html(block: str) -> None:
    """Append a gallery-item block inside #galleryGrid (before its closing tag).

    Raises RuntimeError (not sys.exit) so process_one can roll back media files.
    """
    text = GALLERY_HTML.read_text(encoding="utf-8")
    block = block.rstrip("\n") + "\n"

    # Prefer an explicit marker comment if present (most reliable).
    marker = "<!-- GALLERY_MANAGER_INSERT -->"
    if marker in text:
        # Keep marker after the new item so the next insert finds it again.
        text = text.replace(marker, block + "    " + marker, 1)
        GALLERY_HTML.write_text(text, encoding="utf-8")
        return

    # Structure (whitespace-tolerant):
    #   <div class="gallery-grid" id="galleryGrid">
    #     ...items...
    #   </div>
    #   <p class="gallery-empty-state" ...
    # Note: the grid's closing </div> may be flush-left or indented; do not
    # require a fixed indent (that broke adds after masonry HTML tweaks).
    m = re.search(
        r'(id="galleryGrid"[^>]*>)([\s\S]*?)(\n[ \t]*</div>\s*\n[ \t]*<p[^>]*class="gallery-empty-state")',
        text,
    )
    if not m:
        # Fallback: any closing div immediately before empty-state after grid id
        m = re.search(
            r'(id="galleryGrid"[^>]*>)([\s\S]*?)(\n[ \t]*</div>\s*\n[ \t]*<p[^>]*id="galleryEmptyState")',
            text,
        )
    if not m:
        raise RuntimeError(
            "Could not find #galleryGrid in gallery.html — structure unexpected. "
            "Ensure the grid closes with </div> immediately before "
            '<p class="gallery-empty-state" (or add <!-- GALLERY_MANAGER_INSERT -->).'
        )
    # Insert before the grid's closing </div>
    text = text[: m.start(3)] + "\n" + block.rstrip("\n") + m.group(3) + text[m.end(3) :]
    GALLERY_HTML.write_text(text, encoding="utf-8")


def insert_i18n(slug: str, caption: str) -> int:
    """
    Add gallery.item.{slug}.caption to es/zh/ja (English comes from HTML text).
    Returns how many language blocks received a new key (0–3).
    Raises if any of the three I18N language blocks cannot be found/updated.
    """
    key = f"gallery.item.{slug}.caption"
    text = APP_JS.read_text(encoding="utf-8")
    cap_js = js_escape(caption)
    line = f'    "{key}": "{cap_js}",\n'
    inserted = 0
    missing_langs: list[str] = []

    def inject_lang_block(src: str, lang: str) -> str:
        nonlocal inserted
        # Only the top-level I18N object uses "  es: {" (two spaces). Tool strings
        # further down use a denser inline form — still match first `  lang: {`.
        m = re.search(rf"(  {re.escape(lang)}: \{{)", src)
        if not m:
            missing_langs.append(lang)
            return src
        # m.end() is just after `{`; find_object_block wants the `{` index.
        brace_at = m.end() - 1
        try:
            start, end = find_object_block(src, brace_at)
        except RuntimeError:
            missing_langs.append(lang)
            return src
        block = src[start:end]
        if f'"{key}"' in block:
            return src  # already present in this language
        # Match a single key/value pair (one key per line)
        matches = list(
            re.finditer(
                r'^[ \t]*"gallery\.item\.[^"]+\.caption":\s*"(?:\\.|[^"\\])*",\s*$',
                block,
                re.M,
            )
        )
        if matches:
            last = matches[-1]
            insert_at = start + last.end()
            if insert_at < len(src) and src[insert_at] == "\n":
                insert_at += 1
            inserted += 1
            return src[:insert_at] + line + src[insert_at:]
        # No gallery items yet — insert right after the opening brace
        inserted += 1
        return src[:start] + "\n" + line + src[start:]

    for lang in ("es", "zh", "ja"):
        text = inject_lang_block(text, lang)

    if missing_langs:
        raise RuntimeError(
            f"Could not locate I18N language block(s) in i18n.js: {', '.join(missing_langs)}. "
            "Caption keys were not written — gallery HTML may be out of sync."
        )

    # Verify all three languages now have the key (insert or pre-existing)
    for lang in ("es", "zh", "ja"):
        m = re.search(rf"(  {re.escape(lang)}: \{{)", text)
        if not m:
            raise RuntimeError(f"I18N verification failed: missing {lang} block")
        start, end = find_object_block(text, m.end() - 1)
        if f'"{key}"' not in text[start:end]:
            raise RuntimeError(
                f"I18N verification failed: key {key!r} missing from {lang} after insert"
            )

    if inserted:
        APP_JS.write_text(text, encoding="utf-8")
    return inserted


def is_video_path(path: Path, original_name: str | None = None) -> bool:
    """True when the source (or client filename) is a known video container."""
    for name in (original_name or "", path.name):
        if Path(name).suffix.lower() in VIDEO_SUFFIXES:
            return True
    return path.suffix.lower() in VIDEO_SUFFIXES


def video_ext_for(path: Path, original_name: str | None = None) -> str:
    for name in (original_name or "", path.name):
        ext = Path(name).suffix.lower()
        if ext in VIDEO_SUFFIXES:
            return ext
    ext = path.suffix.lower()
    return ext if ext in VIDEO_SUFFIXES else ".mp4"


def extract_video_cover(src: Path, dest_jpeg: Path) -> tuple[int, int]:
    """Best-effort cover frame → JPEG. Prefer qlmanage (macOS), else solid placeholder.

    Returns (width, height) of the written cover image.
    """
    dest_jpeg.parent.mkdir(parents=True, exist_ok=True)
    # 1) Quick Look thumbnail (macOS) — works for most local video formats.
    with tempfile.TemporaryDirectory(prefix="gm-vcover-") as tmp:
        tmpdir = Path(tmp)
        try:
            subprocess.run(
                ["qlmanage", "-t", "-s", "1920", "-o", str(tmpdir), str(src)],
                check=False,
                capture_output=True,
                timeout=60,
            )
        except (OSError, subprocess.TimeoutExpired):
            pass
        # qlmanage names output like "file.mp4.png"
        candidates = sorted(tmpdir.glob("*"), key=lambda p: p.stat().st_size if p.is_file() else 0, reverse=True)
        for cand in candidates:
            if not cand.is_file():
                continue
            try:
                # Convert/resize via sips to JPEG cover
                tw, th = sips_export(cand, dest_jpeg, MEDIUM_MAX, MEDIUM_QUALITY)
                if dest_jpeg.is_file() and dest_jpeg.stat().st_size > 0:
                    return tw, th
            except Exception:
                continue

    # 2) Fallback: solid dark placeholder so the gallery tile still works
    # sips can create from a tiny base if we use Python to write a minimal JPEG? Prefer sips with a solid color.
    # Create a simple 1280x720 PNG with pure Python (uncompressed-ish via PPM + sips).
    ppm = dest_jpeg.with_suffix(".ppm")
    w, h = 1280, 720
    # Dark navy pixel row
    row = bytes([12, 18, 32]) * w
    try:
        with ppm.open("wb") as f:
            f.write(f"P6\n{w} {h}\n255\n".encode("ascii"))
            for _ in range(h):
                f.write(row)
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(MEDIUM_QUALITY),
             str(ppm), "--out", str(dest_jpeg)],
            check=True,
            capture_output=True,
            timeout=30,
        )
        ppm.unlink(missing_ok=True)
        return w, h
    except Exception:
        ppm.unlink(missing_ok=True)
        raise RuntimeError(
            "Could not extract a video cover frame. On macOS, ensure Quick Look "
            "(qlmanage) works for this file, or supply a cover image."
        )


def process_one(
    src: Path,
    *,
    category: str,
    location: str,
    date: str,
    caption: str | None = None,
    alt: str | None = None,
    original_name: str | None = None,
    cover_path: Path | None = None,
    dry_run: bool = False,
) -> dict:
    if category not in CATEGORIES:
        raise ValueError(f"Invalid category '{category}'. Choose from: {', '.join(CATEGORIES)}")

    # Caption: prefer explicit value, then original client filename, then src path.
    # Never derive the human caption from a tempfile stem (tmpXXXX).
    name_for_caption = original_name or (
        None if is_temp_or_generic_stem(Path(src.name).stem) else src.name
    )
    cap = (caption or caption_from_filename(name_for_caption or "Untitled")).strip()
    # Explicit alt wins; otherwise build a descriptive VoiceOver sentence (not bare title)
    alt_text = (alt or "").strip()
    if not alt_text:
        alt_text = describe_alt(cap, location or "", category or "", date or "")

    is_video = is_video_path(src, original_name)
    # Auto-fill empty/placeholder date/location from EXIF/GPS when possible.
    # Placeholder "United States" (legacy UI default) must NOT block detection.
    # Videos often have little EXIF; extract_photo_metadata is best-effort.
    meta: dict = {}
    if not is_video:
        try:
            meta = extract_photo_metadata(src)
        except Exception:
            meta = {}
    if not (date or "").strip() and meta.get("date"):
        date = meta["date"]
    if is_placeholder_location(location) and meta.get("location"):
        location = meta["location"]
    # Normalize ISO or English; empty → today (full day). Never free-form junk.
    try:
        date = normalize_gallery_date(date, fallback_today=True)
    except ValueError:
        date = today_display_date()
    location = _abbreviate_location_state((location or "United States").strip())

    # Slug base is computed outside the lock; unique_slug + all writes run under it
    # so concurrent /api/add cannot allocate the same slug.
    slug_base = slug_base_from_sources(
        original_name=original_name,
        src_name=src.name,
        caption=cap,
    )

    video_size_mb = 0.0
    video_warn = None
    if is_video:
        try:
            video_size_mb = src.stat().st_size / (1024 * 1024)
        except OSError:
            video_size_mb = 0.0
        if video_size_mb >= VIDEO_WARN_MB:
            video_warn = (
                f"Large video ({video_size_mb:.1f} MB). Copied as-is — "
                "consider compressing before commit/deploy."
            )

    if dry_run:
        slug = unique_slug(slug_base)
        filename = f"{slug}.jpeg"
        out = {
            "slug": slug,
            "filename": filename,
            "caption": cap,
            "category": category,
            "location": location,
            "date": date,
            "media": "video" if is_video else "photo",
            "full": str((GALLERY_DIR / filename).relative_to(ROOT)),
            "medium": str((MEDIUM_DIR / filename).relative_to(ROOT)),
            "thumb": str((THUMBS_DIR / filename).relative_to(ROOT)),
            "meta": {
                "detected_date": meta.get("date"),
                "detected_location": meta.get("location"),
                "lat": meta.get("lat"),
                "lon": meta.get("lon"),
            },
            "status": "dry-run",
        }
        if is_video:
            vext = video_ext_for(src, original_name)
            out["video"] = str((VIDEOS_DIR / f"{slug}{vext}").relative_to(ROOT))
            out["video_size_mb"] = round(video_size_mb, 2)
            if video_warn:
                out["warning"] = video_warn
        return out

    with _WRITE_LOCK:
        slug = unique_slug(slug_base)
        filename = f"{slug}.jpeg"
        full_path = GALLERY_DIR / filename
        medium_path = MEDIUM_DIR / filename
        thumb_path = THUMBS_DIR / filename
        video_path = None
        video_filename = None
        if is_video:
            VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
            vext = video_ext_for(src, original_name)
            video_filename = f"{slug}{vext}"
            video_path = VIDEOS_DIR / video_filename
        gallery_before = GALLERY_HTML.read_text(encoding="utf-8")
        i18n_before = APP_JS.read_text(encoding="utf-8")

        try:
            if is_video:
                # Copy video byte-for-byte (no re-encode). Cover → thumb/medium/full jpeg.
                shutil.copy2(src, video_path)
                cover_src = cover_path if cover_path and cover_path.is_file() else None
                if cover_src:
                    tw, th = sips_export(cover_src, thumb_path, THUMB_MAX, THUMB_QUALITY)
                    mw, mh = sips_export(cover_src, medium_path, MEDIUM_MAX, MEDIUM_QUALITY)
                    fw, fh, full_mode = export_full_image(cover_src, full_path)
                else:
                    # Auto cover into full_path, then derive medium + thumb from it.
                    extract_video_cover(src, full_path)
                    full_mode = "video-cover"
                    tw, th = sips_export(full_path, thumb_path, THUMB_MAX, THUMB_QUALITY)
                    mw, mh = sips_export(full_path, medium_path, MEDIUM_MAX, MEDIUM_QUALITY)
                    try:
                        # Prefer real dimensions if sips can report them.
                        info = subprocess.run(
                            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(full_path)],
                            capture_output=True, text=True, check=False, timeout=15,
                        )
                        fw = mw
                        fh = mh
                        for line in (info.stdout or "").splitlines():
                            if "pixelWidth:" in line:
                                fw = int(line.split(":")[-1].strip())
                            if "pixelHeight:" in line:
                                fh = int(line.split(":")[-1].strip())
                    except Exception:
                        fw, fh = mw, mh
            else:
                # Full first (upright / HDR-safe copy), then derive medium + thumb from it
                # so width/height attrs always match visual orientation.
                fw, fh, full_mode = export_full_image(src, full_path)
                tw, th = sips_export(full_path, thumb_path, THUMB_MAX, THUMB_QUALITY)
                mw, mh = sips_export(full_path, medium_path, MEDIUM_MAX, MEDIUM_QUALITY)

            thumb_webp_ok = write_webp_from_jpeg(
                thumb_path, thumb_path.with_suffix(".webp"), quality=80
            )
            medium_webp_ok = write_webp_from_jpeg(
                medium_path, medium_path.with_suffix(".webp"), quality=82
            )

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
                video_filename=video_filename,
                thumb_webp=thumb_webp_ok,
                medium_webp=medium_webp_ok,
            )
            insert_gallery_html(block)
            i18n_n = insert_i18n(slug, cap)
        except Exception:
            # A gallery entry is one logical record — undo partial writes.
            for path in (thumb_path, medium_path, full_path, video_path):
                if path is None:
                    continue
                try:
                    path.unlink(missing_ok=True)
                except OSError:
                    pass
            try:
                GALLERY_HTML.write_text(gallery_before, encoding="utf-8")
            except OSError:
                pass
            try:
                APP_JS.write_text(i18n_before, encoding="utf-8")
            except OSError:
                pass
            raise

    result = {
        "slug": slug,
        "filename": filename,
        "caption": cap,
        "category": category,
        "location": location,
        "date": date,
        "media": "video" if is_video else "photo",
        "full": str(full_path.relative_to(ROOT)),
        "medium": str(medium_path.relative_to(ROOT)),
        "thumb": str(thumb_path.relative_to(ROOT)),
        "meta": {
            "detected_date": meta.get("date"),
            "detected_location": meta.get("location"),
            "lat": meta.get("lat"),
            "lon": meta.get("lon"),
        },
        "thumb_size": f"{tw}x{th}",
        "medium_size": f"{mw}x{mh}",
        "full_size": f"{fw}x{fh}",
        "full_mode": full_mode,  # "copy" | "convert" | "video-cover"
        "i18n_keys_added": i18n_n,
        "status": "ok",
    }
    if is_video and video_path is not None:
        result["video"] = str(video_path.relative_to(ROOT))
        result["video_size_mb"] = round(video_size_mb, 2)
        if video_warn:
            result["warning"] = video_warn
    return result


def list_photos() -> list[dict]:
    text = GALLERY_HTML.read_text(encoding="utf-8")
    items = []
    # Flexible: attribute order may include data-city / data-state / data-medium.
    # Optional video badge sits between <img> and caption.
    for m in re.finditer(
        r'<div class="gallery-item"([^>]*)>\s*'
        r'<img\s+([^>]+)>\s*'
        r'(?:<span class="gallery-video-badge"[\s\S]*?</span>\s*)?'
        r'<div class="gallery-caption"[^>]*data-i18n="([^"]*)"[^>]*>([^<]*)</div>',
        text,
        re.S,
    ):
        item_attrs = m.group(1)
        img_attrs = m.group(2)
        i18n_key = m.group(3)
        caption = m.group(4)

        def attr(blob: str, name: str) -> str:
            am = re.search(rf'\b{name}="([^"]*)"', blob)
            return am.group(1) if am else ""

        # HTML is the storage format; the manager API must return the original
        # values. Returning escaped text here caused a later metadata save to
        # double-escape captions or locations containing characters such as &.
        category = html.unescape(attr(item_attrs, "data-category"))
        location = html.unescape(attr(item_attrs, "data-location"))
        date = html.unescape(attr(item_attrs, "data-date"))
        media = attr(item_attrs, "data-media") or "photo"
        thumb = html.unescape(attr(img_attrs, "src"))
        full = html.unescape(attr(img_attrs, "data-full"))
        video = html.unescape(attr(img_attrs, "data-video"))
        if video:
            media = "video"
        medium = attr(img_attrs, "data-medium") or (
            f"images/gallery/medium/{Path(full).name}" if full else ""
        )
        medium = html.unescape(medium)
        alt = html.unescape(attr(img_attrs, "alt"))
        filename = Path(full).name if full else Path(thumb).name
        slug = Path(filename).stem
        key_m = re.match(r"gallery\.item\.([a-z0-9]+)\.caption", i18n_key)
        if key_m:
            slug = key_m.group(1)
        row = {
            "slug": slug,
            "filename": filename,
            "i18n_key": i18n_key,
            "category": category,
            "location": location,
            "date": date,
            "media": media,
            "thumb": thumb,
            "medium": medium,
            "full": full,
            "alt": alt,
            "caption": html.unescape(caption),
        }
        if video:
            row["video"] = video
        items.append(row)
    return items


def remove_gallery_html(slug: str, filename: str | None = None) -> bool:
    """Remove the full gallery-item block for this photo from gallery.html."""
    text = GALLERY_HTML.read_text(encoding="utf-8")
    fname = filename or f"{slug}.jpeg"
    # Match a complete item (caption is a nested div — must close both).
    # Optional video badge between img and caption.
    badge = r'(?:<span class="gallery-video-badge"[\s\S]*?</span>\s*)?'
    patterns = [
        # By i18n key (most reliable)
        rf'[ \t]*<div class="gallery-item"[^>]*>\s*'
        rf'<img[^>]*>\s*'
        rf'{badge}'
        rf'<div class="gallery-caption"[^>]*data-i18n="gallery\.item\.{re.escape(slug)}\.caption"[^>]*>[\s\S]*?</div>\s*'
        rf'</div>\s*',
        # By data-full path
        rf'[ \t]*<div class="gallery-item"[^>]*>\s*'
        rf'<img[^>]*data-full="images/gallery/{re.escape(fname)}"[^>]*>\s*'
        rf'{badge}'
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
    """Remove gallery.item.{slug}.caption from every language block in i18n.js."""
    key = f"gallery.item.{slug}.caption"
    text = APP_JS.read_text(encoding="utf-8")
    # Allow escaped quotes inside values (same pattern as update/insert).
    val = r'"(?:\\.|[^"\\])*"'
    # Whole-line form
    new, n = re.subn(
        rf'^[ \t]*"{re.escape(key)}":\s*{val},\s*\n',
        "",
        text,
        flags=re.M,
    )
    # Inline form (legacy bug left multiple keys on one line)
    new2, n2 = re.subn(
        rf'[ \t]*"{re.escape(key)}":\s*{val},\s*',
        "",
        new,
    )
    n += n2
    if n:
        APP_JS.write_text(new2, encoding="utf-8")
    return n


def remove_files(slug: str, filename: str | None = None) -> list[str]:
    """Delete full + medium + thumb (+ video) files. Returns list of paths removed."""
    fname = filename or f"{slug}.jpeg"
    removed = []
    candidates = [
        GALLERY_DIR / fname,
        MEDIUM_DIR / fname,
        THUMBS_DIR / fname,
    ]
    if fname != f"{slug}.jpeg":
        candidates += [
            GALLERY_DIR / f"{slug}.jpeg",
            MEDIUM_DIR / f"{slug}.jpeg",
            THUMBS_DIR / f"{slug}.jpeg",
        ]
    # Video files (any supported extension)
    if VIDEOS_DIR.is_dir():
        for ext in VIDEO_SUFFIXES:
            candidates.append(VIDEOS_DIR / f"{slug}{ext}")
        # Also match any file whose stem is the slug
        for path in VIDEOS_DIR.glob(f"{slug}.*"):
            candidates.append(path)
    for path in candidates:
        if path.is_file():
            try:
                path.unlink()
                removed.append(str(path.relative_to(ROOT)))
            except OSError:
                pass
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


def rebuild_media_for_existing(*, patch_html: bool = True) -> dict:
    """
    Full media pass for every gallery photo:
      1. Bake EXIF Orientation into full JPEGs when needed (pixels upright).
      2. Rebuild medium + thumb from the upright full.
      3. Refresh medium/thumb WebP sidecars.
      4. Patch gallery.html width/height (+ city/state attrs) for stable masonry.

    Safe to re-run. Used after upgrading the tool or for --rebuild-media.
    """
    ensure_layout()
    photos = list_photos()
    built = []
    missing_full = []
    oriented = []
    for item in photos:
        fname = item["filename"]
        full_path = GALLERY_DIR / fname
        if not full_path.is_file():
            missing_full.append(fname)
            continue
        medium_path = MEDIUM_DIR / fname
        thumb_path = THUMBS_DIR / fname
        # Bake orientation first so all derivatives match visual upright pixels.
        fw, fh, changed = bake_orientation_inplace(full_path)
        if changed:
            oriented.append(fname)
        # Always refresh medium + thumb from full for consistent quality/aspect.
        mw, mh = sips_export(full_path, medium_path, MEDIUM_MAX, MEDIUM_QUALITY)
        tw, th = sips_export(full_path, thumb_path, THUMB_MAX, THUMB_QUALITY)
        write_webp_from_jpeg(thumb_path, thumb_path.with_suffix(".webp"), quality=80)
        write_webp_from_jpeg(medium_path, medium_path.with_suffix(".webp"), quality=82)
        built.append({
            "filename": fname,
            "full_size": f"{fw}x{fh}",
            "medium_size": f"{mw}x{mh}",
            "thumb_size": f"{tw}x{th}",
            "oriented": changed,
        })

    html_patched = 0
    if patch_html and GALLERY_HTML.is_file():
        text = GALLERY_HTML.read_text(encoding="utf-8")
        original = text
        # thumb size cache for width/height attrs
        thumb_sizes: dict[str, tuple[int, int]] = {}
        for b in built:
            parts = b["thumb_size"].split("x")
            if len(parts) == 2:
                try:
                    thumb_sizes[b["filename"]] = (int(parts[0]), int(parts[1]))
                except ValueError:
                    pass

        def patch_item(match: re.Match) -> str:
            nonlocal html_patched
            block = match.group(0)
            # Extract data-full filename
            fm = re.search(r'data-full="images/gallery/([^"]+)"', block)
            if not fm:
                return block
            fname = fm.group(1)
            # data-location → city/state attrs
            loc_m = re.search(r'data-location="([^"]*)"', block)
            loc = loc_m.group(1) if loc_m else ""
            city, state = parse_location_parts(html.unescape(loc))
            city_esc = html.escape(city, quote=True)
            state_esc = html.escape(state, quote=True)

            # Ensure data-city / data-state on the item div
            if 'data-city="' not in block:
                block = re.sub(
                    r'(data-location="[^"]*")',
                    rf'\1 data-city="{city_esc}" data-state="{state_esc}"',
                    block,
                    count=1,
                )
            else:
                block = re.sub(r'data-city="[^"]*"', f'data-city="{city_esc}"', block, count=1)
                block = re.sub(r'data-state="[^"]*"', f'data-state="{state_esc}"', block, count=1)

            # Ensure data-thumb / data-medium on img
            if "data-thumb=" not in block:
                block = re.sub(
                    r'(src="images/gallery/thumbs/[^"]+")',
                    rf'\1 data-thumb="images/gallery/thumbs/{html.escape(fname, quote=True)}"',
                    block,
                    count=1,
                )
            if "data-medium=" not in block:
                block = re.sub(
                    r'(data-(?:thumb|full)="[^"]+")',
                    rf'\1 data-medium="images/gallery/medium/{html.escape(fname, quote=True)}"',
                    block,
                    count=1,
                )
            # If data-medium was inserted after data-full somehow wrong, force correct path
            block = re.sub(
                r'data-medium="[^"]*"',
                f'data-medium="images/gallery/medium/{html.escape(fname, quote=True)}"',
                block,
                count=1,
            )
            # Patch width/height from actual thumb display size (post-orientation).
            size = thumb_sizes.get(fname)
            if size is None:
                tpath = THUMBS_DIR / fname
                if tpath.is_file():
                    size = sips_size(tpath)
            if size:
                tw, th = size
                if re.search(r'\bwidth="\d+"', block):
                    block = re.sub(r'\bwidth="\d+"', f'width="{tw}"', block, count=1)
                else:
                    block = re.sub(r'(<img\b)', rf'\1 width="{tw}"', block, count=1)
                if re.search(r'\bheight="\d+"', block):
                    block = re.sub(r'\bheight="\d+"', f'height="{th}"', block, count=1)
                else:
                    block = re.sub(r'(<img\b[^>]*\bwidth="\d+")', rf'\1 height="{th}"', block, count=1)
            html_patched += 1
            return block

        text = re.sub(
            r'<div class="gallery-item"[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?'
            r'<div class="gallery-caption"[^>]*>[\s\S]*?</div>\s*</div>',
            patch_item,
            text,
        )
        if text != original:
            GALLERY_HTML.write_text(text, encoding="utf-8")

    return {
        "built": built,
        "missing_full": missing_full,
        "oriented": oriented,
        "html_items_patched": html_patched,
        "status": "ok",
    }


def update_i18n_caption(slug: str, caption: str, old_caption: str | None = None) -> int:
    """
    Update gallery.item.{slug}.caption without wiping real translations.

    - If a language key is missing → insert with the new English caption (seed).
    - If a language value still equals the previous English caption (or the new
      one is the first edit and value == old) → update to the new caption.
    - If a language value differs from old_caption → leave it alone (hand-translated).

    Library Save always updates the English HTML caption separately.
    """
    key = f"gallery.item.{slug}.caption"
    cap_js = js_escape(caption)
    old = (old_caption or "").strip()
    text = APP_JS.read_text(encoding="utf-8")
    updated = 0

    def replacer(m: re.Match) -> str:
        nonlocal updated
        prefix, value = m.group(1), m.group(2)
        # Unescape a minimal JS string for comparison
        current = (
            value.replace("\\\\", "\0")
            .replace('\\"', '"')
            .replace("\0", "\\")
        )
        # Only overwrite untranslated clones of the previous English caption
        # (never wipe a hand-translated string that differs from old English).
        if (old and current == old) or current == caption:
            updated += 1
            return f'{prefix}"{cap_js}"'
        return m.group(0)

    new = re.sub(
        rf'("{re.escape(key)}":\s*)"((?:\\.|[^"\\])*)"',
        replacer,
        text,
    )
    if new != text:
        APP_JS.write_text(new, encoding="utf-8")
    # Fill any missing language keys (insert_i18n skips existing keys)
    inserted = insert_i18n(slug, caption)
    return updated + inserted


def update_one(
    slug: str,
    *,
    category: str | None = None,
    location: str | None = None,
    date: str | None = None,
    caption: str | None = None,
    alt: str | None = None,
) -> dict:
    """Update metadata for an existing gallery photo (no re-upload)."""
    slug = re.sub(r"[^a-z0-9]", "", slug.lower())
    items = list_photos()
    item = next((p for p in items if p["slug"] == slug), None)
    if not item:
        raise FileNotFoundError(f"No gallery entry found for '{slug}'")

    category = category if category is not None else item["category"]
    location = location if location is not None else item["location"]
    date = date if date is not None else item["date"]
    old_caption = (item.get("caption") or "").strip()
    caption = (caption if caption is not None else old_caption).strip()
    if alt is None:
        alt = (item.get("alt") or "").strip()
    else:
        alt = (alt or "").strip()
    if not alt:
        alt = describe_alt(caption, location or "", category or "", date or "")
    if category not in CATEGORIES:
        raise ValueError(f"Invalid category '{category}'")
    location = _abbreviate_location_state((location or "").strip())
    try:
        date = normalize_gallery_date(date, fallback_today=False)
    except ValueError as e:
        raise ValueError(f"Invalid date: {date!r}") from e

    with _WRITE_LOCK:
        text = GALLERY_HTML.read_text(encoding="utf-8")
        # Include leading indentation in the match so replacement does not
        # double-indent (html_item_block already starts with 4 spaces).
        item_m = re.search(
            rf'[ \t]*<div class="gallery-item"[^>]*>\s*'
            rf'<img\s+([^>]+)>\s*'
            rf'<div class="gallery-caption"[^>]*data-i18n="gallery\.item\.{re.escape(slug)}\.caption"[^>]*>[^<]*</div>\s*'
            rf'</div>',
            text,
            re.S,
        )
        if not item_m:
            raise RuntimeError(f"Could not locate HTML block for '{slug}'")
        img_attrs = item_m.group(1)
        old_block = item_m.group(0)

        def _img_attr(name: str) -> str:
            am = re.search(rf'\b{name}="([^"]*)"', img_attrs)
            return am.group(1) if am else ""

        full = _img_attr("data-full")
        try:
            tw = int(_img_attr("width") or "900")
            th = int(_img_attr("height") or "600")
        except ValueError:
            tw, th = 900, 600

        filename = Path(full).name
        new_block = html_item_block(
            slug=slug,
            category=category,
            location=location,
            date=date,
            caption=caption,
            alt=alt,
            tw=tw,
            th=th,
            filename=filename,
        ).rstrip("\n")

        text = text.replace(old_block, new_block, 1)
        GALLERY_HTML.write_text(text, encoding="utf-8")
        i18n_n = update_i18n_caption(slug, caption, old_caption=old_caption)

    return {
        "slug": slug,
        "filename": filename,
        "category": category,
        "location": location,
        "date": date,
        "caption": caption,
        "i18n_updated": i18n_n,
        "status": "updated",
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
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 18px 24px; border-bottom: 1px solid var(--border);
    background: rgba(11,18,32,.9); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 10;
  }
  header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -.02em; }
  header h1 span { color: var(--accent); font-style: italic; }
  header p { color: var(--muted); font-size: 13px; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px 18px 90px; }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px; margin-bottom: 16px;
  }
  .card h2 { font-size: 13px; letter-spacing: .12em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 12px; font-weight: 600; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  @media (max-width: 720px) { .grid2, .grid3 { grid-template-columns: 1fr; } }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 10px;
    letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  input, select, textarea {
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); padding: 10px 11px; font: 500 13px system-ui; outline: none; width: 100%;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  .drop {
    border: 2px dashed var(--border); border-radius: var(--radius);
    padding: 36px 18px; text-align: center; cursor: pointer;
    transition: border-color .2s, background .2s; background: var(--card);
  }
  .drop.drag { border-color: var(--accent); background: rgba(201,162,89,.08); }
  .drop strong { display: block; font-size: 16px; margin-bottom: 6px; }
  .drop span { color: var(--muted); font-size: 13px; }
  .queue { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
  .q-card {
    display: grid; grid-template-columns: 88px 1fr auto; gap: 14px;
    background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px;
    align-items: start;
  }
  @media (max-width: 640px) {
    .q-card { grid-template-columns: 72px 1fr; }
    .q-card .side { grid-column: 1 / -1; display: flex; gap: 8px; }
  }
  .q-card img { width: 88px; height: 88px; object-fit: cover; border-radius: 8px; background: #000; }
  .q-card .fields { display: grid; gap: 8px; min-width: 0; }
  .q-card .name { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .q-card .side { display: flex; flex-direction: column; gap: 6px; }
  .icon-btn {
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 12px; min-width: 40px;
  }
  .icon-btn:hover { color: var(--text); border-color: var(--accent); }
  .icon-btn.danger:hover { color: var(--err); border-color: var(--err); }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; align-items: center; }
  .btn {
    appearance: none; border: 0; border-radius: 8px; padding: 11px 16px;
    font: 650 12px system-ui; letter-spacing: .05em; text-transform: uppercase;
    cursor: pointer; transition: transform .15s, opacity .15s, background .15s;
  }
  .btn:disabled { opacity: .45; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #0b1220; }
  .btn-primary:hover:not(:disabled) { background: var(--accent2); }
  .btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn-danger { background: transparent; color: var(--err); border: 1px solid rgba(224,112,112,.45); }
  .btn-danger:hover:not(:disabled) { background: rgba(224,112,112,.15); }
  .log {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; background: var(--bg); border-radius: 8px; padding: 12px; margin-top: 12px;
    max-height: 200px; overflow: auto; color: var(--muted); white-space: pre-wrap;
  }
  .log .ok { color: var(--ok); }
  .log .err { color: var(--err); }
  .existing { display: flex; flex-direction: column; gap: 12px; }
  .e-card {
    display: grid; grid-template-columns: 100px 1fr; gap: 14px;
    background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px;
  }
  @media (max-width: 640px) { .e-card { grid-template-columns: 1fr; } }
  .e-card img { width: 100%; max-width: 100px; aspect-ratio: 1; object-fit: cover; border-radius: 8px; background: #000; }
  .e-card .fields { display: grid; gap: 8px; min-width: 0; }
  .e-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .e-actions .btn { padding: 8px 12px; font-size: 11px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; margin-bottom: 14px; }
  .toolbar label { flex: 1 1 160px; }
  .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(201,162,89,.15);
    color: var(--accent); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 600; }
  .hint { font-size: 13px; color: var(--muted); margin-top: 8px; line-height: 1.55; }
  .row-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .badge-warn { color: #e0b060; font-size: 11px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>✦ <span>Gallery Manager</span></h1>
    <p>Per-photo category · auto date/location · medium + full · add / edit / remove</p>
  </div>
  <div class="pill" id="countPill">0 in gallery</div>
</header>
<main>
  <section class="card">
    <h2>Defaults for new photos</h2>
    <p class="hint" style="margin-top:0;margin-bottom:12px">
      After a mixed trip (e.g. LA), leave category empty and set only what you want shared.
      Check which fields to apply — nothing forces a single category on every photo.
      Date &amp; location can be <strong>auto-detected</strong> from each photo’s EXIF/GPS.
    </p>
    <div class="grid3">
      <label>Category (optional)
        <select id="defCategory">
          <option value="">— Set per photo —</option>
          <option value="coast">Coast</option>
          <option value="landmarks">Landmarks</option>
          <option value="nature">Nature</option>
          <option value="roads">Roads</option>
          <option value="cityscapes">Cityscapes</option>
          <option value="food-culture">Food &amp; Culture</option>
        </select>
      </label>
      <label>Date fallback <input id="defDate" type="date"></label>
      <label>Location fallback <input id="defLocation" type="text" placeholder="United States"></label>
    </div>
    <div class="row-actions" style="flex-wrap:wrap;gap:12px;align-items:center">
      <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)">
        <input type="checkbox" id="applyCat" style="width:auto"> Apply category
      </label>
      <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)">
        <input type="checkbox" id="applyDate" checked style="width:auto"> Apply date fallback
      </label>
      <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)">
        <input type="checkbox" id="applyLoc" checked style="width:auto"> Apply location fallback
      </label>
      <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)">
        <input type="checkbox" id="autoMeta" checked style="width:auto"> Auto-detect date &amp; location from photos
      </label>
    </div>
    <div class="row-actions">
      <button class="btn btn-ghost" type="button" id="applyDefaultsBtn">Apply checked defaults to queue</button>
      <button class="btn btn-ghost" type="button" id="reprobeBtn">Re-detect metadata for queue</button>
    </div>
    <p class="hint">Each queue item keeps its own category/date/location. Auto-detect fills from EXIF/GPS when present (full calendar day, e.g. <strong>June 1, 2026</strong>). Date fields use the system calendar. If missing, defaults are <strong>today</strong> and <strong>United States</strong>.</p>
  </section>

  <section class="card">
    <h2>Upload queue</h2>
    <div class="drop" id="drop">
      <strong>Drop photos or videos here</strong>
      <span>or click to choose · multi-select · JPEG / PNG / HEIC / WebP · MP4 / MOV / WebM</span>
      <span style="display:block;margin-top:6px;color:var(--warn,#c9a259)">Videos are copied as-is (can be large). Cover frame is auto-extracted; optional cover image overrides it.</span>
      <input type="file" id="fileInput" accept="image/*,video/*,.heic,.HEIC,.mp4,.mov,.m4v,.webm" multiple hidden>
    </div>
    <div class="queue" id="queue"></div>
    <div class="actions">
      <button class="btn btn-primary" id="uploadBtn" disabled>Add all to gallery</button>
      <button class="btn btn-ghost" id="clearBtn" type="button">Clear queue</button>
      <span class="hint" id="status"></span>
    </div>
    <div class="log" id="log" hidden></div>
  </section>

  <section class="card">
    <h2>Library</h2>
    <div class="toolbar">
      <label>Search
        <input id="libSearch" type="search" placeholder="Caption, location, slug…">
      </label>
      <label>Filter category
        <select id="libFilter">
          <option value="">All categories</option>
          <option value="coast">Coast</option>
          <option value="landmarks">Landmarks</option>
          <option value="nature">Nature</option>
          <option value="roads">Roads</option>
          <option value="cityscapes">Cityscapes</option>
          <option value="food-culture">Food &amp; Culture</option>
        </select>
      </label>
    </div>
    <p class="hint" style="margin-top:0;margin-bottom:12px">
      Edit fields and <strong>Save</strong> to update category / location / date / caption without re-uploading.
      <strong>Remove</strong> deletes full, medium, thumb, HTML, and all language keys.
    </p>
    <div class="existing" id="existing"></div>
  </section>
</main>
<script>
const CATS = [
  ['coast','Coast'],['landmarks','Landmarks'],['nature','Nature'],
  ['roads','Roads'],['cityscapes','Cityscapes'],['food-culture','Food & Culture']
];
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const queue = [];
let library = [];
const drop = $('#drop');
const fileInput = $('#fileInput');
const queueEl = $('#queue');
const logEl = $('#log');
const statusEl = $('#status');
const uploadBtn = $('#uploadBtn');

function catOptions(selected) {
  const pick = `<option value=""${selected ? '' : ' selected'}>— pick category —</option>`;
  return pick + CATS.map(([v,l]) =>
    `<option value="${v}"${v===selected?' selected':''}>${l}</option>`).join('');
}
function escAttr(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
function log(msg, cls='') {
  logEl.hidden = false;
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}
function defaults() {
  return {
    category: $('#defCategory').value, // may be ""
    location: $('#defLocation').value.trim(),
    date: $('#defDate').value.trim(),
    applyCat: $('#applyCat').checked,
    applyDate: $('#applyDate').checked,
    applyLoc: $('#applyLoc').checked,
    autoMeta: $('#autoMeta').checked,
  };
}
function captionFromName(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
/** Today as YYYY-MM-DD for <input type="date">. */
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
/** English display "June 1, 2026" → ISO for native date inputs. */
function displayToISO(s) {
  const t = String(s || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const months = {
    january:1,february:2,march:3,april:4,may:5,june:6,
    july:7,august:8,september:9,october:10,november:11,december:12
  };
  let m = t.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const mo = months[m[1].toLowerCase()];
    if (!mo) return '';
    return `${m[3]}-${String(mo).padStart(2,'0')}-${String(+m[2]).padStart(2,'0')}`;
  }
  m = t.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const mo = months[m[1].toLowerCase()];
    if (!mo) return '';
    return `${m[2]}-${String(mo).padStart(2,'0')}-01`;
  }
  return '';
}
/** ISO or EXIF-ish → ISO for the picker (server still normalizes to English). */
function toPickerISO(s) {
  if (!s) return todayISO();
  const iso = displayToISO(s);
  return iso || todayISO();
}
function fallbackDate() {
  return ($('#defDate') && $('#defDate').value.trim()) || todayISO();
}
function fallbackLocation() {
  return $('#defLocation').value.trim() || 'United States';
}
// Seed generic fallbacks (admin can change; auto-detect still overrides per photo)
if ($('#defDate') && !$('#defDate').value) $('#defDate').value = todayISO();
if ($('#defLocation') && !$('#defLocation').value) $('#defLocation').value = 'United States';
async function probeFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/probe', { method: 'POST', body: fd });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    return {};
  }
}
function isPlaceholderLocation(loc) {
  const s = String(loc || '').trim().toLowerCase();
  return !s || ['united states','usa','us','america','unknown','auto','n/a','na'].includes(s);
}

function renderQueue() {
  queueEl.innerHTML = '';
  if (!queue.length) {
    uploadBtn.disabled = true;
    return;
  }
  queue.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'q-card';
    const isVid = !!item.isVideo;
    const coverBit = isVid
      ? `<label>Cover (optional) <input type="file" accept="image/*" data-cover="${i}"></label>
         <div class="hint" style="margin:0">${item.coverName ? 'Cover: ' + escAttr(item.coverName) : 'Auto frame if empty'}</div>`
      : '';
    row.innerHTML = `
      <img src="${item.preview}" alt="">
      <div class="fields">
        <div class="name">${escAttr(item.file.name)}${isVid ? ' · <span class="badge-warn">VIDEO</span>' : ''}${item.warn ? ' · <span class="badge-warn">'+escAttr(item.warn)+'</span>' : ''}</div>
        <label>Caption <input data-k="caption" data-i="${i}" value="${escAttr(item.caption)}"></label>
        <label>VoiceOver / alt text <span class="hint" style="display:inline;margin:0">(optional — leave blank to auto-describe)</span>
          <input data-k="alt" data-i="${i}" value="${escAttr(item.alt||'')}" placeholder="Auto from caption + location if empty"></label>
        <div class="grid3">
          <label>Category <select data-k="category" data-i="${i}">${catOptions(item.category)}</select></label>
          <label>Date <input type="date" data-k="date" data-i="${i}" value="${escAttr(toPickerISO(item.date))}"></label>
          <label>Location <input data-k="location" data-i="${i}" value="${escAttr(item.location)}" placeholder="United States"></label>
        </div>
        ${coverBit}
      </div>
      <div class="side">
        <button type="button" class="icon-btn" data-up="${i}" title="Move up">↑</button>
        <button type="button" class="icon-btn" data-dn="${i}" title="Move down">↓</button>
        <button type="button" class="icon-btn danger" data-rm="${i}" title="Remove from queue">✕</button>
      </div>`;
    queueEl.appendChild(row);
  });
  uploadBtn.disabled = false;

  $$('[data-k]', queueEl).forEach(el => {
    const sync = () => { queue[+el.dataset.i][el.dataset.k] = el.value; };
    el.addEventListener('input', sync);
    el.addEventListener('change', sync);
  });
  $$('[data-cover]', queueEl).forEach(el => {
    el.addEventListener('change', () => {
      const i = +el.dataset.cover;
      const f = el.files && el.files[0];
      if (!f) return;
      queue[i].coverFile = f;
      queue[i].coverName = f.name;
      if (queue[i].preview && queue[i].preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(queue[i].preview); } catch (e) {}
      }
      queue[i].preview = URL.createObjectURL(f);
      renderQueue();
    });
  });
  $$('[data-rm]', queueEl).forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.rm;
    URL.revokeObjectURL(queue[i].preview);
    queue.splice(i, 1);
    renderQueue();
  }));
  $$('[data-up]', queueEl).forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.up;
    if (i <= 0) return;
    [queue[i-1], queue[i]] = [queue[i], queue[i-1]];
    renderQueue();
  }));
  $$('[data-dn]', queueEl).forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.dn;
    if (i >= queue.length - 1) return;
    [queue[i+1], queue[i]] = [queue[i], queue[i+1]];
    renderQueue();
  }));
}

function isVideoFile(file) {
  return (file.type && file.type.startsWith('video/'))
    || /\.(mp4|mov|m4v|webm)$/i.test(file.name || '');
}
function isImageFile(file) {
  return (file.type && file.type.startsWith('image/'))
    || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name || '');
}

async function addFiles(fileList) {
  const d = defaults();
  const existingNames = new Set(library.map(p => (p.filename || '').toLowerCase()));
  const files = [...fileList].filter(file => isImageFile(file) || isVideoFile(file));
  if (!files.length) return;
  statusEl.textContent = d.autoMeta ? `Reading metadata for ${files.length} item(s)…` : 'Adding to queue…';
  for (const file of files) {
    const isVid = isVideoFile(file);
    const stem = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g,'') + '.jpeg';
    let warn = existingNames.has(stem) ? 'similar name may exist' : '';
    if (isVid && file.size > 40 * 1024 * 1024) {
      warn = (warn ? warn + ' · ' : '') + `large video (${(file.size/1024/1024).toFixed(1)} MB) — copied as-is`;
    }
    let meta = {};
    if (d.autoMeta && !isVid) meta = await probeFile(file);
    // Category: only from default when apply is on AND a value is chosen.
    // Otherwise inherit last queue item's category, or leave empty (user must pick).
    const category = (d.applyCat && d.category)
      ? d.category
      : (queue.length ? queue[queue.length - 1].category : '');
    // Date/location: prefer auto-detect, then admin fallbacks, then generics.
    // Queue stores ISO for <input type="date">; server normalizes to English display.
    // Server still re-detects when location is the generic placeholder.
    let date = (meta.date || '').trim();
    if (date) {
      const iso = displayToISO(date);
      if (iso) date = iso;
    }
    let location = (meta.location || '').trim();
    let metaNote = '';
    if (meta.date || meta.location) {
      const bits = [];
      if (meta.date) bits.push(meta.date);
      if (meta.location) bits.push(meta.location);
      metaNote = 'auto: ' + bits.join(' · ');
    } else if (d.autoMeta) {
      metaNote = 'no GPS/date in file — using defaults';
    }
    if (!date && d.applyDate && d.date) date = d.date;
    if (!location && d.applyLoc && d.location) location = d.location;
    if (!date) date = fallbackDate();             // today (ISO)
    if (!location) location = fallbackLocation(); // United States (generic)
    queue.push({
      file,
      isVideo: isVid,
      coverFile: null,
      coverName: '',
      preview: URL.createObjectURL(file),
      caption: captionFromName(file.name),
      category,
      location,
      date,
      warn: metaNote || warn,
      meta,
    });
  }
  renderQueue();
  statusEl.textContent = `${files.length} item(s) in queue` + (d.autoMeta ? ' (metadata checked)' : '');
}

drop.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));

$('#clearBtn').addEventListener('click', () => {
  queue.forEach(q => URL.revokeObjectURL(q.preview));
  queue.length = 0;
  renderQueue();
  statusEl.textContent = '';
});
$('#applyDefaultsBtn').addEventListener('click', () => {
  const d = defaults();
  let n = 0;
  queue.forEach(q => {
    if (d.applyCat && d.category) { q.category = d.category; n++; }
    if (d.applyDate && d.date) { q.date = d.date; n++; }
    if (d.applyLoc && d.location) { q.location = d.location; n++; }
  });
  renderQueue();
  statusEl.textContent = n
    ? 'Checked defaults applied to queue (only selected fields)'
    : 'Nothing applied — tick a field and fill a value first';
});
$('#reprobeBtn').addEventListener('click', async () => {
  if (!queue.length) { statusEl.textContent = 'Queue is empty'; return; }
  statusEl.textContent = 'Re-detecting metadata…';
  let hits = 0;
  for (const q of queue) {
    const meta = await probeFile(q.file);
    q.meta = meta;
    if (meta.date) {
      const iso = displayToISO(meta.date);
      q.date = iso || meta.date;
    } else if (!q.date) {
      q.date = fallbackDate();
    }
    // Re-probe: prefer GPS when present; otherwise keep generic United States
    if (meta.location) {
      q.location = meta.location;
    } else if (isPlaceholderLocation(q.location) || !q.location) {
      q.location = fallbackLocation();
    }
    if (meta.date || meta.location) {
      hits++;
      const bits = [];
      if (meta.date) bits.push(meta.date);
      if (meta.location) bits.push(meta.location);
      q.warn = 'auto: ' + bits.join(' · ');
    } else {
      q.warn = 'no GPS/date in file — using defaults';
    }
  }
  renderQueue();
  statusEl.textContent = `Metadata re-detected — ${hits}/${queue.length} with date/location`;
});

function filteredLibrary() {
  const q = ($('#libSearch').value || '').trim().toLowerCase();
  const cat = $('#libFilter').value;
  return library.filter(item => {
    if (cat && item.category !== cat) return false;
    if (!q) return true;
    const hay = [item.caption, item.location, item.date, item.slug, item.category, item.filename]
      .join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function renderLibrary() {
  const data = filteredLibrary();
  $('#countPill').textContent = library.length + ' in gallery';
  const box = $('#existing');
  if (!library.length) {
    box.innerHTML = '<p class="hint">No photos yet — drop some above.</p>';
    return;
  }
  if (!data.length) {
    box.innerHTML = '<p class="hint">No photos match your search/filter.</p>';
    return;
  }
  box.innerHTML = '';
  data.slice().reverse().forEach(item => {
    const card = document.createElement('div');
    card.className = 'e-card';
    card.dataset.slug = item.slug;
    card.innerHTML = `
      <img src="/site/${item.thumb}?t=${Date.now()}" alt="">
      <div class="fields">
        <label>Caption <input data-f="caption" value="${escAttr(item.caption)}"></label>
        <label>VoiceOver / alt text <input data-f="alt" value="${escAttr(item.alt||'')}" placeholder="Screen reader description"></label>
        <div class="grid3">
          <label>Category <select data-f="category">${catOptions(item.category)}</select></label>
          <label>Date <input type="date" data-f="date" value="${escAttr(toPickerISO(item.date))}"></label>
          <label>Location <input data-f="location" value="${escAttr(item.location)}"></label>
        </div>
        <div class="e-actions">
          <button type="button" class="btn btn-primary save-btn">Save</button>
          <button type="button" class="btn btn-danger rm-btn">Remove</button>
          <span class="hint" style="margin:0" data-slug-label>${escAttr(item.slug)}</span>
        </div>
      </div>`;
    box.appendChild(card);
    $('.save-btn', card).addEventListener('click', () => saveExisting(card, item));
    $('.rm-btn', card).addEventListener('click', () => removePhoto(card, item));
  });
}

async function loadExisting() {
  const res = await fetch('/api/list');
  library = await res.json();
  renderLibrary();
}

async function saveExisting(card, item) {
  // Preserve month-only display ("July 2026") when the admin did not change
  // the native date picker (picker maps month-only → day 01 for wire format only).
  let dateVal = $('[data-f=date]', card).value.trim();
  const orig = String(item.date || '').trim();
  if (/^[A-Za-z]+\s+\d{4}$/.test(orig) && displayToISO(orig) === dateVal) {
    dateVal = orig;
  }
  const payload = {
    slug: item.slug,
    filename: item.filename,
    caption: $('[data-f=caption]', card).value.trim(),
    alt: $('[data-f=alt]', card).value.trim(),
    category: $('[data-f=category]', card).value,
    date: dateVal,
    location: $('[data-f=location]', card).value.trim(),
  };
  const btn = $('.save-btn', card);
  btn.disabled = true;
  btn.textContent = 'Saving…';
  logEl.hidden = false;
  try {
    const res = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    log(`✓ Updated ${item.slug} · ${data.caption}`, 'ok');
    await loadExisting();
  } catch (err) {
    log(`✗ Update ${item.slug}: ${err.message}`, 'err');
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

async function removePhoto(card, item) {
  if (!confirm(`Remove “${item.caption || item.slug}” permanently?\n\nDeletes full, medium, thumb, HTML block, and all caption keys.`)) return;
  const btn = $('.rm-btn', card);
  btn.disabled = true;
  btn.textContent = 'Removing…';
  logEl.hidden = false;
  try {
    const res = await fetch('/api/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: item.slug, filename: item.filename }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    log(`✓ Removed ${item.slug} · files: ${(data.files_removed||[]).join(', ')||'—'}`, 'ok');
    await loadExisting();
  } catch (err) {
    log(`✗ Remove ${item.slug}: ${err.message}`, 'err');
    btn.disabled = false;
    btn.textContent = 'Remove';
  }
}

$('#libSearch').addEventListener('input', renderLibrary);
$('#libFilter').addEventListener('change', renderLibrary);

uploadBtn.addEventListener('click', async () => {
  if (!queue.length) return;
  const missingCat = queue.filter(q => !q.category);
  if (missingCat.length) {
    statusEl.textContent = `Pick a category for ${missingCat.length} photo(s) before adding`;
    logEl.hidden = false;
    log(`✗ ${missingCat.length} item(s) still need a category (not forced to coast)`, 'err');
    return;
  }
  uploadBtn.disabled = true;
  statusEl.textContent = 'Uploading…';
  logEl.innerHTML = '';
  logEl.hidden = false;
  let ok = 0, fail = 0;
  for (const item of [...queue]) {
    const fd = new FormData();
    fd.append('file', item.file);
    if (item.coverFile) fd.append('cover', item.coverFile);
    fd.append('category', item.category);
    if ((item.alt || '').trim()) fd.append('alt', item.alt.trim());
    // Send current values. Generic "United States" is a known placeholder on the
    // server — if EXIF/GPS exists it still overrides; otherwise it stays.
    fd.append('location', (item.location || '').trim() || fallbackLocation());
    fd.append('date', (item.date || '').trim() || fallbackDate());
    fd.append('caption', (item.caption || '').trim() || captionFromName(item.file.name));
    try {
      const res = await fetch('/api/add', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      const mode = data.full_mode === 'copy' ? 'full=original'
        : data.full_mode === 'video-cover' ? 'video+cover'
        : 'full=converted';
      const vbit = data.video ? ` video=${data.video}` + (data.video_size_mb != null ? ` (${data.video_size_mb} MB)` : '') : '';
      const wbit = data.warning ? ` ⚠ ${data.warning}` : '';
      log(`✓ ${item.file.name} → ${data.filename} [${data.category}] med=${data.medium_size || '?'} full=${data.full_size || ''} (${mode})${vbit}${wbit}`, 'ok');
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
        if path == "/api/rebuild-media":
            try:
                self._json(200, rebuild_media_for_existing())
            except Exception as e:
                self._json(500, {"error": str(e)})
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

        if path == "/api/update":
            try:
                payload = json.loads(body.decode("utf-8") or "{}")
                slug = (payload.get("slug") or "").strip()
                if not slug:
                    self._json(400, {"error": "Missing slug"})
                    return
                result = update_one(
                    slug,
                    category=payload.get("category"),
                    location=payload.get("location"),
                    date=payload.get("date"),
                    caption=payload.get("caption"),
                    alt=payload.get("alt"),
                )
                self._json(200, result)
            except FileNotFoundError as e:
                self._json(404, {"error": str(e)})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        if path == "/api/probe":
            try:
                fields, files = parse_multipart(ctype, body)
                if "file" not in files:
                    self._json(400, {"error": "No file uploaded"})
                    return
                name, data = files["file"]
                original_name = name or "upload.jpg"
                with tempfile.NamedTemporaryFile(
                    suffix=Path(original_name).suffix or ".jpg", delete=False
                ) as tmp:
                    tmp.write(data)
                    tmp_path = Path(tmp.name)
                try:
                    meta = extract_photo_metadata(tmp_path)
                    self._json(200, meta)
                finally:
                    tmp_path.unlink(missing_ok=True)
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
            category = (fields.get("category") or [""])[0].strip()
            if not category or category not in CATEGORIES:
                self._json(
                    400,
                    {
                        "error": (
                            "Category required. Choose one of: "
                            + ", ".join(CATEGORIES)
                        )
                    },
                )
                return
            # Placeholder "United States" still allows process_one to prefer GPS when present
            location = (fields.get("location") or ["United States"])[0]
            date = (fields.get("date") or [""])[0]
            caption = (fields.get("caption") or [None])[0]
            alt_field = (fields.get("alt") or [None])[0]
            # Original client filename is the only reliable source for the
            # gallery slug / i18n key. process_one used to slugify the
            # NamedTemporaryFile path (tmpXXXX) which produced broken keys.
            original_name = name or "upload.jpg"
            if not caption:
                caption = caption_from_filename(original_name)
            # ISO from native picker or English display → normalize inside process_one
            date = (date or "").strip()
            # Empty alt → process_one builds a descriptive VoiceOver string
            alt_val = (alt_field or "").strip() or None

            cover_tmp = None
            with tempfile.NamedTemporaryFile(suffix=Path(original_name).suffix or ".jpg", delete=False) as tmp:
                tmp.write(data)
                tmp_path = Path(tmp.name)
            try:
                if "cover" in files:
                    cname, cdata = files["cover"]
                    cname = cname or "cover.jpg"
                    with tempfile.NamedTemporaryFile(
                        suffix=Path(cname).suffix or ".jpg", delete=False
                    ) as ctmp:
                        ctmp.write(cdata)
                        cover_tmp = Path(ctmp.name)
                result = process_one(
                    tmp_path,
                    category=category,
                    location=location,
                    date=date,
                    caption=caption,
                    alt=alt_val,
                    original_name=original_name,
                    cover_path=cover_tmp,
                )
            finally:
                tmp_path.unlink(missing_ok=True)
                if cover_tmp is not None:
                    cover_tmp.unlink(missing_ok=True)
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
    # Empty location/date → auto-detect per photo from EXIF/GPS
    location = args.location or ""
    date = args.date or ""

    print(f"Importing {len(files)} photo(s) from {folder}")
    print(f"  category={category}  location={location or '(auto)'}  date={date or '(auto)'}")
    ok = 0
    for src in files:
        try:
            r = process_one(
                src,
                category=category,
                location=location,
                date=date,
                original_name=src.name,
                dry_run=args.dry_run,
            )
            mode = r.get("full_mode", "?")
            size = r.get("full_size", "")
            med = r.get("medium_size", "")
            print(
                f"  ✓ {src.name} → {r['filename']}  "
                f"[{r.get('date','')}] {r.get('location','')}  "
                f"(slug={r['slug']}, med={med}, full={size}, {mode})"
            )
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


def backfill_dates(*, apply: bool = False) -> dict:
    """
    Upgrade gallery dates from EXIF/sips on the full image file.

    Rules:
      · Only write a new date when EXIF/sips yields a full calendar day.
      · Never invent day 1 for month-only entries that lack EXIF day.
      · Skip when current display already matches the EXIF day.
    Default is dry-run (report only). Pass apply=True to write gallery.html.
    """
    ensure_layout()
    photos = list_photos()
    planned: list[dict] = []
    skipped: list[dict] = []
    missing: list[dict] = []

    for p in photos:
        slug = p["slug"]
        filename = p["filename"]
        current = (p.get("date") or "").strip()
        full_path = GALLERY_DIR / filename
        if not full_path.is_file():
            missing.append({"slug": slug, "filename": filename, "reason": "missing full file"})
            continue
        meta = extract_photo_metadata(full_path)
        exif_date = (meta.get("date") or "").strip()
        if not exif_date:
            skipped.append(
                {
                    "slug": slug,
                    "current": current,
                    "reason": "no EXIF/sips day — left unchanged",
                }
            )
            continue
        # extract_photo_metadata always returns full day when present
        if not re.match(r"^[A-Za-z]+\s+\d{1,2},\s*\d{4}$", exif_date):
            skipped.append(
                {
                    "slug": slug,
                    "current": current,
                    "exif": exif_date,
                    "reason": "EXIF not a full day — left unchanged",
                }
            )
            continue
        if current == exif_date:
            skipped.append(
                {
                    "slug": slug,
                    "current": current,
                    "reason": "already matches EXIF",
                }
            )
            continue
        planned.append(
            {
                "slug": slug,
                "filename": filename,
                "from": current,
                "to": exif_date,
                "category": p.get("category"),
                "location": p.get("location"),
                "caption": p.get("caption"),
                "alt": p.get("alt"),
            }
        )

    applied = 0
    errors: list[dict] = []
    if apply:
        for row in planned:
            try:
                update_one(
                    row["slug"],
                    category=row.get("category"),
                    location=row.get("location"),
                    date=row["to"],
                    caption=row.get("caption"),
                    alt=row.get("alt"),
                )
                applied += 1
            except Exception as e:
                errors.append({"slug": row["slug"], "error": str(e)})

    return {
        "total": len(photos),
        "planned": planned,
        "skipped": skipped,
        "missing": missing,
        "applied": applied,
        "errors": errors,
        "apply": apply,
    }


def run_backfill_dates(*, apply: bool = False) -> None:
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"Backfill gallery dates from EXIF/sips  [{mode}]")
    r = backfill_dates(apply=apply)
    print(f"  scanned {r['total']} photo(s)")
    if r["planned"]:
        print(f"  would update {len(r['planned'])}:" if not apply else f"  updating {len(r['planned'])}:")
        for row in r["planned"]:
            print(f"    · {row['slug']:28}  {row['from']!r:20} → {row['to']!r}")
    else:
        print("  no date upgrades available")
    if r["skipped"]:
        # Summarize common skip reasons
        from collections import Counter

        reasons = Counter(s.get("reason", "?") for s in r["skipped"])
        print(f"  skipped {len(r['skipped'])}:")
        for reason, n in reasons.most_common():
            print(f"    · {n:3}  {reason}")
    if r["missing"]:
        print(f"  missing full file ({len(r['missing'])}):")
        for m in r["missing"][:20]:
            print(f"    · {m['slug']} ({m['filename']})")
    if r["errors"]:
        print(f"  errors ({len(r['errors'])}):")
        for e in r["errors"]:
            print(f"    · {e['slug']}: {e['error']}")
    if apply:
        print(f"Done. Applied {r['applied']}/{len(r['planned'])}.")
    else:
        print("Dry-run only — re-run with --backfill-dates --apply to write gallery.html.")


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
        "--rebuild-media",
        action="store_true",
        help="Rebuild medium assets for all existing gallery photos and patch HTML",
    )
    parser.add_argument(
        "--category",
        default="coast",
        choices=CATEGORIES,
        help="Default category for CLI import",
    )
    parser.add_argument(
        "--location",
        default="",
        help='Location string (omit to auto-detect from GPS, e.g. "Los Angeles, California")',
    )
    parser.add_argument(
        "--date",
        default="",
        help='Date string (omit to auto-detect from EXIF, e.g. "July 4, 2026")',
    )
    parser.add_argument(
        "--backfill-dates",
        action="store_true",
        help="Upgrade month-only gallery dates from EXIF/sips (dry-run unless --apply)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="With --backfill-dates: write changes to gallery.html",
    )
    parser.add_argument("--dry-run", action="store_true", help="CLI: parse only, write nothing")
    parser.add_argument("--port", type=int, default=PORT, help=f"UI port (default {PORT})")
    parser.add_argument("--no-browser", action="store_true", help="Don't auto-open browser")
    args = parser.parse_args()

    if args.list:
        ensure_layout()
        for p in list_photos():
            print(f"{p['slug']:24}  {p['category']:12}  {p['date']:18}  {p['location']:32}  {p['caption']}")
        return
    if args.backfill_dates:
        run_backfill_dates(apply=args.apply)
        return
    if args.rebuild_media:
        ensure_layout()
        r = rebuild_media_for_existing()
        oriented = r.get("oriented") or []
        print(
            f"Rebuilt media for {len(r['built'])} photo(s); "
            f"oriented {len(oriented)}; HTML items patched: {r['html_items_patched']}"
        )
        for b in r["built"]:
            flag = "  [oriented]" if b.get("oriented") else ""
            print(
                f"  · {b['filename']}  full={b.get('full_size','?')}  "
                f"medium={b['medium_size']}  thumb={b.get('thumb_size','?')}{flag}"
            )
        if oriented:
            print("Orientation baked:", ", ".join(oriented))
        if r["missing_full"]:
            print("Missing full files:", ", ".join(r["missing_full"]))
        return
    if args.remove:
        run_remove(args.remove)
    elif args.cli:
        run_cli(args)
    else:
        run_server(port=args.port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
