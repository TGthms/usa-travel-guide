#!/usr/bin/env node
'use strict';
/**
 * Fail if generated legal/partials are stale, markers are missing,
 * or chrome i18n keys used in JS are absent from es/zh/ja.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function die(msg) {
  console.error('[check-generated] ' + msg);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

require('./build-legal').build();
require('./build-partials').build();

try {
  execFileSync('git', ['diff', '--exit-code', '--', 'src/js/data/legal-i18n.js'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch (e) {
  die('src/js/data/legal-i18n.js is stale — commit the output of npm run build:legal');
}

const { PAGES, BLOCKS } = require('./build-partials');
BLOCKS.forEach((b) => {
  const body = read(path.join('docs/partials', b.file)).replace(/\s+$/, '') + '\n';
  PAGES.forEach((rel) => {
    const src = read(rel);
    if (!src.includes(b.start) || !src.includes(b.end)) {
      die(rel + ' is missing ' + b.start);
    }
    const i0 = src.indexOf(b.start);
    const i1 = src.indexOf(b.end);
    const inner = src.slice(i0 + b.start.length, i1).replace(/^\n/, '');
    if (inner !== body) {
      die(rel + ' marked region ' + b.name + ' does not match docs/partials/' + b.file);
    }
  });
});

const gallery = read('gallery.html');
if (!gallery.includes('<!-- GALLERY_MANAGER_INSERT -->')) {
  die('gallery.html is missing <!-- GALLERY_MANAGER_INSERT -->');
}

const i18nSrc = read('src/js/data/i18n.js');
const used = new Set();
const files = [
  'src/js/core/runtime.js',
  'src/js/features/dest-weather.js',
  'src/js/features/gallery.js',
  'src/js/features/home.js',
  'src/js/features/tools.js',
  'src/js/features/weather/app.js',
  'src/js/features/weather/charts.js',
  'src/js/features/weather/alerts.js',
];
const keyRe = /(?:USATravel\.t|[\s.]t)\(\s*['"]([a-zA-Z0-9.]+)['"]/g;
files.forEach((rel) => {
  const src = read(rel);
  let m;
  while ((m = keyRe.exec(src))) used.add(m[1]);
});
const langStarts = {
  es: i18nSrc.indexOf('  es: {'),
  zh: i18nSrc.indexOf('  zh: {'),
  ja: i18nSrc.indexOf('  ja: {'),
};
['es', 'zh', 'ja'].forEach((lang) => {
  const langAt = langStarts[lang];
  if (langAt < 0) die('I18N missing language ' + lang);
  const end = lang === 'ja' ? i18nSrc.length : (lang === 'es' ? langStarts.zh : langStarts.ja);
  const block = i18nSrc.slice(langAt, end);
  used.forEach((key) => {
    if (key.indexOf('.') < 0) return;
    if (!block.includes('"' + key + '":')) {
      die('I18N.' + lang + ' missing key ' + key);
    }
  });
});

console.log('[check-generated] legal, partials, gallery marker, and i18n keys ok');
