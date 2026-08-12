#!/usr/bin/env node
'use strict';
/**
 * Inject docs/partials/{first-paint,settings}.html into every page entrypoint.
 *
 * Markers (required on each page):
 *   <!-- FIRST_PAINT_START --> … <!-- FIRST_PAINT_END -->
 *   <!-- SETTINGS_START --> … <!-- SETTINGS_END -->
 *
 * Usage: node tools/build-partials.js  |  npm run build:partials
 *        npm run serve watches docs/partials and rebuilds on save.
 * Do not hand-edit the generated regions.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PARTIALS = path.join(ROOT, 'docs', 'partials');
const PAGES = [
  'index.html',
  'gallery.html',
  'tools.html',
  'tools-currency.html',
  'tools-clock.html',
  'tools-tip-tax.html',
  'tools-drive.html',
  'tools-emergency.html',
  'tools-weather.html',
  'privacy.html',
  'terms.html',
];
const BLOCKS = [
  { name: 'first-paint', file: 'first-paint.html', start: '<!-- FIRST_PAINT_START -->', end: '<!-- FIRST_PAINT_END -->' },
  { name: 'settings', file: 'settings.html', start: '<!-- SETTINGS_START -->', end: '<!-- SETTINGS_END -->' },
];

function die(msg) {
  console.error('[build-partials] ' + msg);
  process.exit(1);
}

function readPartial(name) {
  const p = path.join(PARTIALS, name);
  if (!fs.existsSync(p)) die('missing ' + p);
  return fs.readFileSync(p, 'utf8').replace(/\s+$/, '') + '\n';
}

function inject(src, start, end, body) {
  const i0 = src.indexOf(start);
  const i1 = src.indexOf(end);
  if (i0 < 0 || i1 < 0 || i1 < i0) return null;
  return src.slice(0, i0 + start.length) + '\n' + body + src.slice(i1);
}

function build() {
  const bodies = {};
  BLOCKS.forEach((b) => { bodies[b.name] = readPartial(b.file); });

  PAGES.forEach((rel) => {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) die('missing page ' + rel);
    let src = fs.readFileSync(file, 'utf8');
    BLOCKS.forEach((b) => {
      const next = inject(src, b.start, b.end, bodies[b.name]);
      if (next == null) die(rel + ' is missing ' + b.start + ' / ' + b.end);
      src = next;
    });
    fs.writeFileSync(file, src);
  });
  console.log('[build-partials] wrote first-paint + settings into ' + PAGES.length + ' pages');
}

if (require.main === module) {
  try { build(); } catch (e) { die(e && e.message ? e.message : String(e)); }
}

module.exports = { build, PAGES, BLOCKS };
