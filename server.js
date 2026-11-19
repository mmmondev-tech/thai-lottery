// Local web server (npm start). Serves public/ and runs the same API handlers
// that Vercel runs from api/, so local and deployed behave identically.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import latest from './api/latest.js';
import result from './api/result.js';
import check from './api/check.js';

const PORT = process.env.PORT || 3000;
const PUBLIC = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const ROUTES = { '/api/latest': latest, '/api/result': result, '/api/check': check };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

// Give Node's req/res the small Vercel-style helpers the handlers use.
function vercelify(req, res, url, body) {
  req.query = Object.fromEntries(url.searchParams);
  req.body = body;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res; };
}

const readJson = (req) =>
  new Promise((ok) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); });
    req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok(undefined); } });
    req.on('error', () => ok(undefined));
  });

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const handler = ROUTES[url.pathname];
    if (handler) {
      vercelify(req, res, url, req.method === 'POST' ? await readJson(req) : undefined);
      return handler(req, res);
    }
    const file = normalize(url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1)));
    if (file.startsWith('..')) { res.writeHead(400); return res.end('Bad path'); }
    const body = await readFile(join(PUBLIC, file)).catch(() => null);
    if (!body) { res.writeHead(404); return res.end('Not found'); }
    // no-cache: the browser re-checks each file, so edits show up on a normal reload.
    // COOP/COEP: lets the photo reader use several CPU cores (same headers in vercel.json).
    res.writeHead(200, {
      'Content-Type': (MIME[extname(file)] ?? 'application/octet-stream') + '; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    });
    res.end(body);
  })
  .listen(PORT, () => console.log(`Thai Lottery Checker → http://localhost:${PORT}`));
