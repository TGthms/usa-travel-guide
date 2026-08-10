#!/usr/bin/env node
'use strict';
// One-shot helper: convert HTML section bodies under docs/legal/ to Markdown.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEGAL_DIR = path.join(ROOT, 'docs', 'legal');
const LANGS = ['en', 'es', 'zh', 'ja'];
const KINDS = ['privacy', 'terms'];

function decodeEntities(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function htmlInlineToMd(html) {
  let s = String(html);
  s = s.replace(/<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi, (_, attrs, text) => {
    const hm = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = hm ? hm[1] : '#';
    const inner = htmlInlineToMd(text);
    return '[' + inner + '](' + href + ')';
  });
  s = s.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  s = s.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  s = s.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  s = s.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  s = s.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');
  s = s.replace(/<br\s*\/?>/gi, '  \n');
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, '');
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

function htmlBodyToMd(html) {
  let s = String(html).trim();
  // Already markdown-ish (no block tags)
  if (!/<(p|ul|ol|li)\b/i.test(s)) return s;

  const notes = [];
  s = s.replace(/<p\s+class=["']legal-note["']>([\s\S]*?)<\/p>/gi, (_, inner) => {
    const i = notes.length;
    notes.push('<p class="legal-note">' + inner.trim() + '</p>');
    return '\n\n%%NOTE' + i + '%%\n\n';
  });

  s = s.replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => '- ' + htmlInlineToMd(m[1]));
    return '\n\n' + items.join('\n') + '\n\n';
  });
  s = s.replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(
      (m, idx) => (idx + 1) + '. ' + htmlInlineToMd(m[1])
    );
    return '\n\n' + items.join('\n') + '\n\n';
  });
  s = s.replace(/<p>([\s\S]*?)<\/p>/gi, (_, inner) => '\n\n' + htmlInlineToMd(inner) + '\n\n');
  s = s.replace(/<\/?(ul|ol|li|div|span)[^>]*>/gi, '');
  s = s.replace(/%%NOTE(\d+)%%/g, (_, i) => notes[Number(i)] || '');
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function convertLead(lead) {
  if (!lead) return lead;
  if (!/<[a-zA-Z]/.test(lead)) return lead;
  return htmlInlineToMd(lead);
}

function convertFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.startsWith('---')) throw new Error('no fm: ' + file);
  const end = raw.indexOf('\n---', 3);
  const fmBlock = raw.slice(3, end).replace(/^\n/, '');
  const body = raw.slice(end + 4).replace(/^\n/, '');

  const fmLines = fmBlock.split('\n').map((line) => {
    const m = line.match(/^(lead)\s*:\s*(.*)$/);
    if (!m) return line;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      try {
        val = JSON.parse(val.startsWith("'") ? '"' + val.slice(1, -1).replace(/"/g, '\\"') + '"' : val);
      } catch (e) {
        val = val.slice(1, -1);
      }
    }
    return 'lead: ' + JSON.stringify(convertLead(val));
  });

  const re = /^##\s+(.+?)\s*\{#([a-z0-9-]+)\}\s*$/gm;
  const matches = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    matches.push({ title: m[1].trim(), id: m[2], index: m.index, len: m[0].length });
  }
  if (!matches.length) throw new Error('no sections: ' + file);

  let outBody = '';
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].len;
    const endI = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const html = body.slice(start, endI).trim();
    const md = htmlBodyToMd(html);
    outBody += '## ' + matches[i].title + ' {#' + matches[i].id + '}\n\n' + md + '\n\n';
  }

  const newRaw = '---\n' + fmLines.join('\n') + '\n---\n\n' + outBody.trim() + '\n';
  fs.writeFileSync(file, newRaw, 'utf8');
  console.log('[convert-legal] ' + path.relative(ROOT, file));
}

for (const lang of LANGS) {
  for (const kind of KINDS) {
    convertFile(path.join(LEGAL_DIR, lang, kind + '.md'));
  }
}
console.log('[convert-legal] done');
