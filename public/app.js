import { T, LANGS, formatDate, detectLang } from './i18n.js';
import { checkTicket } from './checker.js';
import { getLatestDate, getAward } from './api.js';

const $ = (id) => document.getElementById(id);
const baht = (n) => '฿' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let lang = detectLang();
let award = null;      // currently shown draw
let lastCheck = null;  // { tickets } so results re-render on language change
let errorKey = null;
const t = () => T[lang];

// Draws are normally on the 1st and 16th of each month (occasionally shifted
// for holidays). The newest draw date comes from the GLO API.
function drawDates(latest, count = 48) {
  const out = [latest];
  const d = new Date(latest + 'T00:00:00');
  let y = d.getFullYear(), m = d.getMonth(), day = d.getDate() >= 16 ? 1 : 16;
  if (day === 16) m -= 1;
  while (out.length < count) {
    const dt = new Date(y, m, day);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    if (day === 16) day = 1; else { day = 16; m -= 1; }
  }
  return out;
}

function applyLanguage() {
  document.documentElement.lang = lang;
  document.title = t().title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t]; });
  $('langs').innerHTML = Object.entries(LANGS)
    .map(([k, name]) => `<button type="button" data-lang="${k}" aria-pressed="${k === lang}">${name}</button>`).join('');
  [...$('date').options].forEach((o) => { o.textContent = formatDate(o.value, lang); });
  renderResults();
  renderCheck();
}

function renderResults() {
  const date = $('date').value;
  $('resultsTitle').textContent = t().results + (date ? ' · ' + formatDate(date, lang) : '');
  if (errorKey) { $('results').innerHTML = `<span class="err">${esc(t()[errorKey])}</span>`; return; }
  if (!award) { $('results').textContent = t().loading; return; }
  if (!award.announced) { $('results').textContent = t().notAnnounced; return; }
  const d = award.data, P = t().prizes;
  const nums = (k) => (d[k]?.number ?? []).map((n) => n.value).sort();
  let html = `
    <div class="first"><div class="small">${P.first} · ${baht(d.first.price)}</div>
      <div class="num">${esc(nums('first')[0])}</div>
      <div class="small">${P.near1}: ${nums('near1').map(esc).join(', ')} (${baht(d.near1.price)})</div></div>
    <div class="grid3">
      ${['last3f', 'last3b', 'last2'].map((k) => `<div><div class="small">${P[k]} · ${baht(d[k].price)}</div>
        <div class="num">${nums(k).map(esc).join(' ')}</div></div>`).join('')}
    </div>`;
  for (const k of ['second', 'third', 'fourth', 'fifth']) {
    html += `<details><summary>${P[k]} · ${baht(d[k].price)} (${d[k].number.length})</summary>
      <div class="list">${nums(k).map(esc).join(' ')}</div></details>`;
  }
  if (award.pdfUrl) html += `<p class="small"><a href="${esc(award.pdfUrl)}" target="_blank" rel="noopener">${t().officialPdf}</a></p>`;
  $('results').innerHTML = html;
}

function renderCheck() {
  if (!lastCheck) { $('out').innerHTML = ''; return; }
  if (lastCheck.message) { $('out').innerHTML = `<p class="err">${esc(t()[lastCheck.message])}</p>`; return; }
  if (!award?.announced) { $('out').innerHTML = `<p>${esc(t().notAnnounced)}</p>`; return; }
  const P = t().prizes;
  let total = 0;
  $('out').innerHTML = lastCheck.tickets.map((ticket) => {
    let r;
    try { r = checkTicket(ticket, award.data); }
    catch { return `<div class="result"><span class="num">${esc(ticket)}</span><span class="prize err">${t().mustBe6}</span></div>`; }
    total += r.total;
    if (!r.wins.length) return `<div class="result"><span class="num">${esc(ticket)}</span><span class="prize">${t().noPrize}</span></div>`;
    const w = r.wins.map((w) => `${P[w.key]} (${baht(w.amount)})`).join('<br>');
    return `<div class="result win"><span class="num">${esc(ticket)}</span><span class="prize">${w}<br><strong>${baht(r.total)}</strong></span></div>`;
  }).join('') + (total ? `<div class="total">🎉 ${t().total}: ${baht(total)} <span class="small">(${t().stampDuty})</span></div>` : '');
}

async function loadDraw(date) {
  award = null; errorKey = null; lastCheck = null;
  renderResults(); renderCheck();
  try { award = await getAward(date); }
  catch { errorKey = 'networkError'; }
  if ($('date').value === date) renderResults();
}

$('langs').addEventListener('click', (e) => {
  const k = e.target.closest('[data-lang]')?.dataset.lang;
  if (!k) return;
  lang = k;
  try { localStorage.setItem('lang', k); } catch {}
  applyLanguage();
});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = $('tickets').value;
  try { localStorage.setItem('tickets', raw); } catch {}
  const tickets = [...new Set(raw.split(/[^\d]+/).filter(Boolean))];
  if (!tickets.length) { lastCheck = { message: 'enterTicket' }; renderCheck(); return; }
  $('check').disabled = true;
  try {
    if (!award) award = await getAward($('date').value);
    lastCheck = { tickets };
  } catch { lastCheck = { message: 'networkError' }; }
  $('check').disabled = false;
  renderCheck();
});

$('date').addEventListener('change', () => loadDraw($('date').value));

(async () => {
  try { $('tickets').value = localStorage.getItem('tickets') || ''; } catch {}
  applyLanguage();
  try {
    const latest = await getLatestDate();
    $('date').innerHTML = drawDates(latest).map((d) => `<option value="${d}">${formatDate(d, lang)}</option>`).join('');
    const first = await getAward(latest);
    if (!first.announced) $('date').selectedIndex = 1; // today's draw not out yet → previous draw
    await loadDraw($('date').value);
  } catch { errorKey = 'networkError'; renderResults(); }
})();
