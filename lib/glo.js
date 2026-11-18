// Talks to the official Government Lottery Office (GLO) API.
// Used by server.js (local) and the Vercel functions in api/ (deployed).
// Browsers can't call GLO directly (no CORS), so these run on the server.
const GLO = 'https://www.glo.or.th/api/lottery';
const cache = new Map(); // date -> award, only once results are officially confirmed

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export async function getLatestDate() {
  return (await glo('getLatestLottery')).date;
}

/** Returns { date, announced, final, data, pdfUrl, youtubeUrl } for a draw date (YYYY-MM-DD). */
export async function getAward(date) {
  if (cache.has(date)) return cache.get(date);
  const [y, m, d] = date.split('-');
  const r = await glo('getLotteryAward', { date: d, month: m, year: y });
  const award = {
    date: r?.date ?? date,
    announced: Boolean(r?.data?.first?.number?.length),
    final: r?.status === 1, // 1 = officially confirmed, won't change any more
    data: r?.data ?? null,
    pdfUrl: r?.pdf_url ?? null,
    youtubeUrl: r?.youtube_url ?? null,
  };
  if (award.announced && award.final) cache.set(date, award);
  return award;
}
