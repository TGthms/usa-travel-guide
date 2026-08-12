#!/usr/bin/env node
'use strict';
// Lightweight static file server for Playwright / local preview.
// More reliable under parallel asset load than python -m http.server.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0]);
  const rel = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(root, rel);
  if (!abs.startsWith(root)) return null;
  return abs;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function createStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      if (!req.url || req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, { 'Content-Type': 'text/plain' }, 'Method Not Allowed');
        return;
      }
      const u = new URL(req.url, 'http://127.0.0.1');
      let filePath = safeJoin(ROOT, u.pathname === '/' ? '/index.html' : u.pathname);
      if (!filePath) {
        send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
        return;
      }
      fs.stat(filePath, (err, st) => {
        if (err || !st.isFile()) {
          if (!err && st && st.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
          } else {
            send(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
            return;
          }
        }
        fs.stat(filePath, (err2, st2) => {
          if (err2 || !st2.isFile()) {
            send(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          const type = MIME[ext] || 'application/octet-stream';
          const headers = {
            'Content-Type': type,
            'Content-Length': st2.size,
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          };
          if (req.method === 'HEAD') {
            res.writeHead(200, headers);
            res.end();
            return;
          }
          const stream = fs.createReadStream(filePath);
          res.writeHead(200, headers);
          stream.pipe(res);
          stream.on('error', () => {
            try { res.destroy(); } catch (e) { /* ignore */ }
          });
          res.on('close', () => {
            try { stream.destroy(); } catch (e) { /* ignore */ }
          });
        });
      });
    } catch (e) {
      try {
        send(res, 500, { 'Content-Type': 'text/plain' }, 'Server Error');
      } catch (e2) { /* ignore */ }
    }
  });

  server.keepAliveTimeout = 30_000;
  server.headersTimeout = 35_000;
  server.requestTimeout = 60_000;
  server.maxHeadersCount = 100;
  return server;
}

function start(port, host) {
  const p = Number(port || process.env.PORT || 4173);
  const h = host || process.env.HOST || '127.0.0.1';
  const server = createStaticServer();
  server.listen(p, h, () => {
    console.log('[static-server] http://' + h + ':' + p + '/');
  });
  server.on('error', (err) => {
    console.error('[static-server]', err && err.message ? err.message : err);
    process.exit(1);
  });
  return server;
}

if (require.main === module) {
  start(process.env.PORT || process.argv[2] || 4173, process.env.HOST || '127.0.0.1');
}

module.exports = { start, createStaticServer, MIME };
