// Data access. Inside the Android/iOS app we call the GLO API directly
// (Capacitor's native HTTP bypasses browser CORS). In a normal browser we go
// through our own server.js proxy, because glo.or.th blocks browser calls.
const isNative = Boolean(window.Capacitor?.isNativePlatform?.());
const GLO = 'https://www.glo.or.th/api/lottery';

async function postJson(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function getJson(url) {
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

async function glo(path, body = {}) {
  const j = await postJson(`${GLO}/${path}`, body);
  if (!j.status) throw new Error(j.message || 'GLO API error');
  return j.response;
}

export async function getLatestDate() {
  if (!isNative) return (await getJson('/api/latest')).date;
  return (await glo('getLatestLottery')).date;
}

const cache = new Map();
export async function getAward(date) {
  if (cache.has(date)) return cache.get(date);
  let award;
  if (!isNative) {
    award = await getJson('/api/result?date=' + date);
  } else {
    const [y, m, d] = date.split('-');
    const r = await glo('getLotteryAward', { date: d, month: m, year: y });
    award = { date: r?.date ?? date, announced: Boolean(r?.data?.first?.number?.length), data: r?.data ?? null, pdfUrl: r?.pdf_url ?? null };
  }
  if (award.announced) cache.set(date, award);
  return award;
}
