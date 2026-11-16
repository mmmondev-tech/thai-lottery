// Tiny zero-dependency server: serves the UI and proxies the official
// Government Lottery Office (GLO) API, which does not allow browser CORS calls.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTicket } from './public/checker.js';

const PORT = process.env.PORT || 3000;
const GLO = 'https://www.glo.or.th/api/lottery';
const PUBLIC = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const cache = new Map(); // date -> award (only cached once results are complete)

async function glo(path, body = {}) {
  const res = await fetch(`${GLO}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`GLO API returned ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.message || 'GLO API error');
  return json.response;
}

async function getAward(date) {
  if (cache.has(date)) return cache.get(date);
  const [y, m, d] = date.split('-');
  const r = await glo('getLotteryAward', { date: d, month: m, year: y });
  const award = {
    date: r?.date ?? date,
    announced: Boolean(r?.data?.first?.number?.length),
    data: r?.data ?? null,
    pdfUrl: r?.pdf_url ?? null,
    youtubeUrl: r?.youtube_url ?? null,
  };
  // Cache only finished results (status 1 = officially confirmed).
  if (award.announced && r?.status === 1) cache.set(date, award);
  return award;
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
};

const readBody = (req) =>
  new Promise((ok, fail) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); });
    req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { fail(e); } });
    req.on('error', fail);
  });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (url.pathname === '/api/latest') {
        const r = await glo('getLatestLottery');
        return send(res, 200, { date: r.date });
      }
      if (url.pathname === '/api/result') {
        const date = url.searchParams.get('date') ?? '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'date must be YYYY-MM-DD' });
        return send(res, 200, await getAward(date));
      }
      if (url.pathname === '/api/check' && req.method === 'POST') {
        const { date, tickets } = await readBody(req);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Array.isArray(tickets) || tickets.length > 100)
          return send(res, 400, { error: 'Send { date: "YYYY-MM-DD", tickets: ["123456", ...] } (max 100)' });
        const award = await getAward(date);
        if (!award.announced) return send(res, 200, { date, announced: false, results: [] });
        const results = tickets.map((t) => {
          try { return checkTicket(String(t).trim(), award.data); }
          catch (e) { return { ticket: t, error: e.message }; }
        });
        return send(res, 200, { date, announced: true, results });
      }
      // Static files
      const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (file.includes('..')) return send(res, 400, { error: 'bad path' });
      const body = await readFile(join(PUBLIC, file)).catch(() => null);
      if (!body) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { 'Content-Type': (MIME[extname(file)] ?? 'application/octet-stream') + '; charset=utf-8' });
      res.end(body);
    } catch (e) {
      send(res, 502, { error: `Could not reach lottery service: ${e.message}` });
    }
  })
  .listen(PORT, () => console.log(`Thai Lottery Checker → http://localhost:${PORT}`));
