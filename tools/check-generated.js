#!/usr/bin/env node
'use strict';
/**
 * Fail if generated legal/partials are stale vs git, markers are missing,
 * or i18n keys used in HTML/JS are absent from es/zh/ja packs.
 *
 * Writes generated files (build:legal / build:partials), then
 * `git diff --exit-code` is the stale-commit test. Local dirty HTML after
 * an uncommitted partial edit will fail until the rebuild is saved —
 * that is the point.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { PAGES, BLOCKS } = require('./build-partials');

function die(msg) {
  console.error('[check-generated] ' + msg);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function walkJs(dir, acc) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((ent) => {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJs(p, acc);
    else if (ent.isFile() && ent.name.endsWith('.js')) acc.push(p);
  });
}

require('./build-legal').build();
require('./build-partials').build();

const generatedJs = ['src/js/data/legal-i18n.js'];
if (exists('src/js/data/gallery-i18n.js')) {
  generatedJs.push('src/js/data/gallery-i18n.js');
}

try {
  execFileSync('git', ['diff', '--exit-code', '--'].concat(generatedJs), {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch (e) {
  die(
    'generated JS differs from git — run npm run build:legal (and commit gallery-i18n.js if captions moved)'
  );
}

function markedSnapshot(src) {
  return BLOCKS.map((b) => {
    const i0 = src.indexOf(b.start);
    const i1 = src.indexOf(b.end);
    if (i0 < 0 || i1 < 0 || i1 < i0) return '';
    return src.slice(i0, i1 + b.end.length);
  }).join('\n');
}

PAGES.forEach((rel) => {
  let head = '';
  try {
    head = execFileSync('git', ['show', 'HEAD:' + rel], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch (e) {
    die(rel + ' is not in git HEAD — cannot check marked regions');
  }
  const working = read(rel);
  if (markedSnapshot(working) !== markedSnapshot(head)) {
    die(
      rel +
        ' marked fonts/first-paint/settings region differs from git — run npm run build:partials and commit'
    );
  }
});

BLOCKS.forEach((b) => {
  PAGES.forEach((rel) => {
    const src = read(rel);
    if (!src.includes(b.start) || !src.includes(b.end)) {
      die(rel + ' is missing ' + b.start);
    }
  });
});

const gallery = read('gallery.html');
if (!gallery.includes('<!-- GALLERY_MANAGER_INSERT -->')) {
  die('gallery.html is missing <!-- GALLERY_MANAGER_INSERT -->');
}

const i18nSrc = read('src/js/data/i18n.js');
const galleryI18nSrc = exists('src/js/data/gallery-i18n.js')
  ? read('src/js/data/gallery-i18n.js')
  : '';
const used = new Set();

PAGES.forEach((rel) => {
  const src = read(rel);
  const attrRe = /data-i18n(?:-html|-aria|-placeholder)?="([^"]+)"/g;
  let m;
  while ((m = attrRe.exec(src))) used.add(m[1]);
});

const jsFiles = [];
walkJs(path.join(ROOT, 'src', 'js'), jsFiles);
const keyRe = /(?:USATravel\.t|[\s.]t)\(\s*['"]([a-zA-Z0-9.]+)['"]/g;
jsFiles.forEach((abs) => {
  const src = fs.readFileSync(abs, 'utf8');
  let m;
  while ((m = keyRe.exec(src))) used.add(m[1]);
});

const langStarts = {
  es: i18nSrc.indexOf('  es: {'),
  zh: i18nSrc.indexOf('  zh: {'),
  ja: i18nSrc.indexOf('  ja: {'),
};

function packHasKey(src, key) {
  return src.includes('"' + key + '":');
}

['es', 'zh', 'ja'].forEach((lang) => {
  const langAt = langStarts[lang];
  if (langAt < 0) die('I18N missing language ' + lang);
  const end = lang === 'ja' ? i18nSrc.length : (lang === 'es' ? langStarts.zh : langStarts.ja);
  const block = i18nSrc.slice(langAt, end);
  used.forEach((key) => {
    if (key.indexOf('.') < 0) return;
    if (key.indexOf('gallery.item.') === 0) {
      if (packHasKey(i18nSrc, key)) {
        if (!block.includes('"' + key + '":')) die('I18N.' + lang + ' missing key ' + key);
        return;
      }
      if (galleryI18nSrc && !packHasKey(galleryI18nSrc, key)) {
        die('gallery-i18n.js missing key ' + key);
      }
      return;
    }
    if (!block.includes('"' + key + '":')) {
      die('I18N.' + lang + ' missing key ' + key);
    }
  });
});

console.log('[check-generated] legal, partials, gallery marker, and i18n keys ok');
