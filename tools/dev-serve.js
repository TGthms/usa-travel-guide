#!/usr/bin/env node
'use strict';
// Dev server: rebuild legal-i18n.js from docs/legal, watch for saves, serve :8000
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { build } = require('./build-legal');

const ROOT = path.resolve(__dirname, '..');
const LEGAL_DIR = path.join(ROOT, 'docs', 'legal');
const PORT = process.env.PORT || '8000';

function rebuild(reason) {
  try {
    build();
    if (reason) console.log('[dev-serve] legal rebuilt (' + reason + ')');
  } catch (e) {
    console.error('[dev-serve] legal build failed:', e && e.message ? e.message : e);
  }
}

rebuild('startup');

let debounce = null;
function onLegalChange(fname) {
  if (fname && !String(fname).endsWith('.md')) return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => rebuild(fname || 'watch'), 120);
}

try {
  fs.watch(LEGAL_DIR, { recursive: true }, (_eventType, filename) => {
    onLegalChange(filename);
  });
  console.log('[dev-serve] watching docs/legal');
} catch (e) {
  for (const lang of ['en', 'es', 'zh', 'ja']) {
    const dir = path.join(LEGAL_DIR, lang);
    try {
      fs.watch(dir, (_eventType, filename) => onLegalChange(path.join(lang, filename || '')));
    } catch (err) { /* ignore */ }
  }
  console.log('[dev-serve] watching docs/legal language folders');
}

const child = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: ROOT,
  stdio: 'inherit',
});

console.log('[dev-serve] http://127.0.0.1:' + PORT + '/');

child.on('exit', (code) => process.exit(code == null ? 0 : code));
process.on('SIGINT', () => {
  try { child.kill('SIGINT'); } catch (e) { /* ignore */ }
  process.exit(0);
});
