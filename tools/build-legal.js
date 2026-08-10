#!/usr/bin/env node
'use strict';
/**
 * Build src/js/data/legal-i18n.js from docs/legal/{en,es,zh,ja}/{privacy,terms}.md
 *
 * Source format: YAML frontmatter + ## Section Title {#id} + Markdown body.
 * Supports **bold**, *italic*, `code`, [links](url), lists; raw HTML passthrough.
 *
 * Usage: node tools/build-legal.js  |  npm run build:legal
 *        npm run serve watches docs/legal and rebuilds on save.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEGAL_DIR = path.join(ROOT, 'docs', 'legal');
const OUT = path.join(ROOT, 'src', 'js', 'data', 'legal-i18n.js');
const LANGS = ['en', 'es', 'zh', 'ja'];
const KINDS = ['privacy', 'terms'];

function die(msg) {
  console.error('[build-legal] ' + msg);
  process.exit(1);
}

/** Minimal YAML-ish frontmatter: key: value or key: "json string" */
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) die('missing frontmatter ---');
  const end = raw.indexOf('\n---', 3);
  if (end < 0) die('unclosed frontmatter');
  const fmBlock = raw.slice(3, end).replace(/^\n/, '');
  const body = raw.slice(end + 4).replace(/^\n/, '');
  const meta = {};
  const lines = fmBlock.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) die('bad frontmatter line: ' + line);
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      try {
        val = JSON.parse(val.startsWith("'") ? '"' + val.slice(1, -1).replace(/"/g, '\\"') + '"' : val);
      } catch (e) {
        val = val.slice(1, -1);
      }
    }
    meta[key] = val;
  }
  return { meta, body };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline markdown → HTML (**bold**, *italic*, `code`, [text](url)). */
function mdInline(text) {
  if (!text) return '';
  let s = String(text);

  const codes = [];
  s = s.replace(/`([^`\n]+)`/g, (_, code) => {
    const i = codes.length;
    codes.push('<code>' + escapeHtml(code) + '</code>');
    return '\u0000C' + i + '\u0000';
  });

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const safeHref = String(href).replace(/"/g, '%22');
    const ext = /^https?:\/\//i.test(safeHref) || safeHref.startsWith('//');
    const attrs = ext
      ? ' href="' + safeHref + '" target="_blank" rel="noopener"'
      : ' href="' + safeHref + '"';
    return '<a' + attrs + '>' + label + '</a>';
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');

  s = s.replace(/\u0000C(\d+)\u0000/g, (_, i) => codes[Number(i)] || '');

  return s;
}

function looksLikeHtmlBlock(block) {
  const t = block.trim();
  if (!t) return false;
  return /^</.test(t) && /<[a-zA-Z]/.test(t);
}

/** Markdown section body → HTML (paragraphs, lists; HTML blocks pass through). */
function mdToHtml(md) {
  const src = String(md || '').replace(/\r\n/g, '\n').trim();
  if (!src) return '';

  if (/^</.test(src) && !/^#{1,6}\s/m.test(src)) {
    const blocks = src.split(/\n{2,}/);
    if (blocks.every((b) => !b.trim() || looksLikeHtmlBlock(b))) {
      return src;
    }
  }

  const lines = src.split('\n');
  const out = [];
  let i = 0;

  function flushPara(buf) {
    const text = buf.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (looksLikeHtmlBlock(text)) {
      out.push(text);
      return;
    }
    out.push('<p>' + mdInline(text) + '</p>');
  }

  while (i < lines.length) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }

    if (/^\s*</.test(lines[i])) {
      const htmlLines = [];
      while (i < lines.length && (lines[i].trim() === '' || /^\s*</.test(lines[i]) || htmlLines.length)) {
        if (!lines[i].trim()) {
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j >= lines.length || !/^\s*</.test(lines[j])) break;
        }
        htmlLines.push(lines[i]);
        i++;
        if (htmlLines.length && !lines[i - 1].trim()) break;
      }
      const html = htmlLines.join('\n').trim();
      if (html) out.push(html);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(lines[i])) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      out.push(
        '<ul>\n' +
          items.map((it) => '<li>' + mdInline(it.trim()) + '</li>').join('\n') +
          '\n</ul>'
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(lines[i])) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push(
        '<ol>\n' +
          items.map((it) => '<li>' + mdInline(it.trim()) + '</li>').join('\n') +
          '\n</ol>'
      );
      continue;
    }

    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*</.test(lines[i])
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    flushPara(buf);
  }

  return out.join('\n');
}

function parseSections(body) {
  const sections = [];
  const re = /^##\s+(.+?)\s*\{#([a-z0-9-]+)\}\s*$/gm;
  const matches = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    matches.push({ title: m[1].trim(), id: m[2], index: m.index, len: m[0].length });
  }
  if (!matches.length) die('no sections found (need ## Title {#id})');
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].len;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const rawBody = body.slice(start, end).trim();
    if (!rawBody) die('empty section body for #' + matches[i].id);
    const html = mdToHtml(rawBody);
    if (!html.trim()) die('empty HTML after markdown convert for #' + matches[i].id);
    sections.push({ id: matches[i].id, title: matches[i].title, html: html });
  }
  return sections;
}

function loadDoc(lang, kind) {
  const file = path.join(LEGAL_DIR, lang, kind + '.md');
  if (!fs.existsSync(file)) die('missing ' + path.relative(ROOT, file));
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.trim()) die('empty ' + path.relative(ROOT, file));
  const { meta, body } = parseFrontmatter(raw);
  const sections = parseSections(body);
  const toc = sections.map((s) => ({ id: s.id, label: s.title }));
  return {
    title: meta.title || '',
    eyebrow: meta.eyebrow || 'Legal',
    updatedLabel: meta.updatedLabel || 'Updated',
    updatedDate: meta.updatedDate || '',
    onThisPage: meta.onThisPage || 'On this page',
    lead: mdInline(meta.lead || ''),
    toc: toc,
    sections: sections,
    footerNote: mdInline(meta.footerNote || ''),
  };
}

function build() {
  const LEGAL_I18N = { privacy: {}, terms: {} };
  for (const kind of KINDS) {
    for (const lang of LANGS) {
      LEGAL_I18N[kind][lang] = loadDoc(lang, kind);
    }
  }

  const header = [
    "'use strict';",
    '/**',
    ' * Privacy Policy & Terms of Use — full copy in en / es / zh / ja.',
    ' * Rendered by features/legal.js when body.page-legal is present.',
    ' *',
    ' * GENERATED by tools/build-legal.js — edit docs/legal then: npm run build:legal',
    ' * (npm run serve watches and rebuilds on save.)',
    ' * English is the legal source of meaning; es/zh/ja match structure in natural voice.',
    ' */',
    'window.LEGAL_I18N = ',
  ].join('\n');

  const json = JSON.stringify(LEGAL_I18N, null, 2);
  const out = header + json + ';\n';
  fs.writeFileSync(OUT, out, 'utf8');
  console.log('[build-legal] wrote ' + path.relative(ROOT, OUT));
  console.log('[build-legal] privacy langs: ' + LANGS.join(', '));
  console.log('[build-legal] terms langs: ' + LANGS.join(', '));
  return OUT;
}

if (require.main === module) {
  build();
}

module.exports = { build, mdToHtml, mdInline, parseFrontmatter, parseSections };
