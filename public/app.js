import { T, LANGS, formatDate, detectLang, myNum } from './i18n.js';
import { extractTicketNumbers } from './scan.js';
import { checkTicket } from './checker.js';
import { getLatestDate, getAward } from './api.js';

const $ = (id) => document.getElementById(id);
const baht = (n) => '฿' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const digits = (num, cls = '') => `<span class="digits ${cls}">${[...String(num)].map((d) => `<span>${esc(d)}</span>`).join('')}</span>`;
const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let lang = detectLang();
let award = null;       // currently shown draw
let errorKey = null;    // error for the draw results card
let lastCheck = null;   // { tickets } | { message } — kept so it re-renders on language change
let scanStatus = null;  // { key, n } message under the photo buttons
let tickets = (storage.get('tickets') || '').split(/[^\d]+/).filter((t) => /^\d{6}$/.test(t));
const t = () => T[lang];
const fmtN = (n) => (lang === 'my' ? myNum(n) : String(n));

// ---------------------------------------------------------------- draw dates
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

// ---------------------------------------------------------------- tickets
function saveTickets() { storage.set('tickets', tickets.join('\n')); }

function addTickets(nums) {
  const before = tickets.length;
  for (const n of nums) if (/^\d{6}$/.test(n) && !tickets.includes(n)) tickets.push(n);
  saveTickets();
  renderTickets();
  return tickets.length - before;
}

function renderTickets() {
  $('count').textContent = tickets.length ? t().ticketCount.replace('{n}', fmtN(tickets.length)) : '';
  $('clear').disabled = !tickets.length && !lastCheck;
  $('chips').innerHTML = tickets.length
    ? tickets.map((n) => `<span class="chip">${esc(n)}<button type="button" data-remove="${esc(n)}" aria-label="${esc(t().remove)} ${esc(n)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>`).join('')
    : `<div class="empty">${esc(t().noTickets)}</div>`;
}

// Typing/pasting: every complete 6-digit number becomes a chip automatically.
function takeFromEntry({ force = false } = {}) {
  const input = $('entry');
  const found = input.value.match(/\d{6}/g) || [];
  if (found.length) {
    addTickets(found);
    input.value = input.value.replace(/\d{6}/g, '').replace(/[^\d]/g, '');
  } else if (force && input.value.trim()) {
    input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
    return false;
  }
  return true;
}

// ---------------------------------------------------------------- rendering
function applyLanguage() {
  document.documentElement.lang = lang;
  document.title = t().title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t]; });
  $('entry').placeholder = t().entryPlaceholder;
  $('langs').innerHTML = Object.entries(LANGS)
    .map(([k, name]) => `<button type="button" data-lang="${k}" aria-pressed="${k === lang}">${name}</button>`).join('');
  [...$('date').options].forEach((o) => { o.textContent = formatDate(o.value, lang); });
  renderTickets();
  renderResults();
  renderCheck();
  renderScanStatus();
}

function renderResults() {
  const date = $('date').value;
  $('resultsTitle').textContent = t().results + (date ? ' · ' + formatDate(date, lang) : '');
  if (errorKey) { $('results').innerHTML = `<p class="err">${esc(t()[errorKey])}</p>`; return; }
  if (!award) { $('results').innerHTML = '<div class="skeleton"></div>'; return; }
  if (!award.announced) { $('results').innerHTML = `<p class="muted">${esc(t().notAnnounced)}</p>`; return; }

  const d = award.data, P = t().prizes;
  const mine = new Set(lastCheck?.tickets ?? []);
  const nums = (k) => (d[k]?.number ?? []).map((n) => n.value).sort();
  const first = nums('first')[0];
  const tail = { last3f: (n) => n.slice(0, 3), last3b: (n) => n.slice(3), last2: (n) => n.slice(4) };
  const isMine = (k, v) => [...mine].some((n) => tail[k](n) === v);

  let html = `
    <div class="first">
      <div class="lbl">${esc(P.first)} · <b>${baht(d.first.price)}</b></div>
      ${digits(first, mine.has(first) ? 'mine' : '')}
      <div class="near">${esc(P.near1)} (${baht(d.near1.price)})<br><b>${nums('near1').map(esc).join(' · ')}</b></div>
    </div>
    <div class="grid3">
      ${['last3f', 'last3b', 'last2'].map((k) => `<div class="stat">
        <div class="lbl">${esc(P[k])}</div>
        <div class="vals">${nums(k).map((v) => `<span class="${isMine(k, v) ? 'mine' : ''}">${esc(v)}</span>`).join('')}</div>
        <div class="amt">${baht(d[k].price)}</div></div>`).join('')}
    </div>`;
  for (const k of ['second', 'third', 'fourth', 'fifth']) {
    const list = nums(k);
    const hit = list.some((v) => mine.has(v));
    html += `<details${hit ? ' open' : ''}><summary>${esc(P[k])} <span class="muted">(${fmtN(list.length)})</span><span class="amt">${baht(d[k].price)}</span></summary>
      <div class="list">${list.map((v) => `<span class="${mine.has(v) ? 'mine' : ''}">${esc(v)}</span>`).join('')}</div></details>`;
  }
  if (award.pdfUrl) {
    html += `<a class="pdf" href="${esc(award.pdfUrl)}" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15l3 3 3-3"/></svg>
      ${esc(t().officialPdf)}</a>`;
  }
  $('results').innerHTML = html;
}

function renderCheck() {
  const out = $('out');
  if (!lastCheck) { out.innerHTML = ''; return; }
  if (lastCheck.message) { out.innerHTML = `<div class="msg err">${esc(t()[lastCheck.message])}</div>`; return; }
  if (!award?.announced) { out.innerHTML = `<div class="msg muted">${esc(t().notAnnounced)}</div>`; return; }
  const P = t().prizes;
  const results = lastCheck.tickets.map((n) => checkTicket(n, award.data));
  const total = results.reduce((s, r) => s + r.total, 0);
  // Winners first, biggest prize first.
  results.sort((a, b) => b.total - a.total);
  out.innerHTML =
    (total ? `<div class="total"><div class="ttl">🎉 ${esc(t().congrats)} ${esc(t().total)}</div>
       <div class="big">${baht(total)}</div><div class="small">${esc(t().stampDuty)}</div></div>` : '') +
    `<div class="out-head">${esc(t().yourResults)}</div>` +
    results.map((r, i) => r.wins.length
      ? `<div class="tk win" style="animation-delay:${i * 40}ms"><span class="face" aria-hidden="true">🎉</span>${digits(r.ticket)}
           <div class="info">${r.wins.map((w) => esc(P[w.key])).join('<br>')}<div class="amt">${baht(r.total)}</div></div></div>`
      : `<div class="tk" style="animation-delay:${i * 40}ms"><span class="face" aria-hidden="true">😢</span>${digits(r.ticket)}<div class="info">${esc(t().noPrize)}</div></div>`).join('');
  return { total, winners: results.filter((r) => r.wins.length), count: results.length };
}

// Big happy / sad popup after a check, so the outcome is obvious at a glance.
function showPopup({ total, winners, count }) {
  const dlg = $('popup');
  const win = total > 0;
  dlg.className = 'popup ' + (win ? 'win' : 'lose');
  $('popupEmoji').textContent = win ? '🥳' : '😢';
  $('popupTitle').textContent = win ? t().congrats : t().noWinTitle;
  $('popupAmt').textContent = win ? baht(total) : '';
  $('popupSub').textContent = win
    ? t().winSub.replace('{n}', fmtN(winners.length)).replace('{m}', fmtN(count)) + ' · ' + t().stampDuty
    : t().noWinSub;
  // The winning numbers themselves, biggest prize first (already sorted).
  const P = t().prizes;
  $('popupWins').innerHTML = winners.map((r) => `<li>${digits(r.ticket)}
    <div class="pw-info">${r.wins.map((w) => esc(P[w.key])).join('<br>')}<b>${baht(r.total)}</b></div></li>`).join('');
  $('popupOk').textContent = t().ok;
  if (dlg.open) dlg.close();
  dlg.showModal();
}

function renderScanStatus() {
  const el = $('scanStatus');
  if (!scanStatus) { el.textContent = ''; el.className = 'scan-status'; return; }
  el.textContent = t()[scanStatus.key].replace('{n}', fmtN(scanStatus.n ?? ''));
  el.className = 'scan-status ' + ({ scanning: 'busy', scanFound: 'ok' }[scanStatus.key] ?? 'err');
}

// ---------------------------------------------------------------- confetti 🎉
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('confetti'), ctx = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  c.hidden = false; c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const colors = ['#ffd36b', '#e2a521', '#a8122f', '#d4243f', '#16794a', '#ffffff'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35,
    vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 4, s: 5 + Math.random() * 6,
    r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (now - start < 2800) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, innerWidth, innerHeight); c.hidden = true; }
  })(start);
}

// ---------------------------------------------------------------- actions
async function loadDraw(date) {
  award = null; errorKey = null; lastCheck = null;
  renderResults(); renderCheck(); renderTickets();
  try { award = await getAward(date); }
  catch { errorKey = 'networkError'; }
  if ($('date').value === date) renderResults();
}

async function runCheck() {
  takeFromEntry();
  if (!tickets.length) {
    lastCheck = { message: 'enterTicket' }; renderCheck(); renderTickets();
    $('entry').focus();
    return;
  }
  $('check').disabled = true;
  try {
    if (!award) award = await getAward($('date').value);
    lastCheck = { tickets: [...tickets] };
  } catch { lastCheck = { message: 'networkError' }; }
  $('check').disabled = false;
  const outcome = renderCheck();
  renderResults();   // highlight the user's numbers in the prize lists
  renderTickets();
  $('out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (outcome) {
    showPopup(outcome);
    if (outcome.total) confetti();
  }
}

function clearAll() {
  tickets = []; saveTickets();
  $('entry').value = '';
  lastCheck = null; scanStatus = null;
  renderTickets(); renderCheck(); renderScanStatus(); renderResults();
}

// ---------------------------------------------------------------- photo scanning
// Apps use the phone's built-in recognizer; browsers fall back to Tesseract.js.
const nativeScanner = window.Capacitor?.isPluginAvailable?.('TicketScanner') ? window.Capacitor.Plugins.TicketScanner : null;
const scanner = nativeScanner ?? { recognize: async (opts) => (await import('./web-ocr.js')).webScanner.recognize(opts) };
// Desktop (mouse, no camera capture): hide "Take photo", offer drag & drop / paste instead.
const desktop = !nativeScanner && matchMedia('(pointer: fine)').matches;
$('scan').classList.toggle('desktop', desktop);

// Shrink big camera photos before sending them to the recognizer (faster, same accuracy).
async function photoToDataUrl(file, maxSide = 2400) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url; });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  } finally { URL.revokeObjectURL(url); }
}

async function scanPhoto(file) {
  if (!file || !file.type.startsWith('image/')) return;
  scanStatus = { key: 'scanning' }; renderScanStatus();
  try {
    // Native apps get a shrunk JPEG (faster to pass over the bridge). The browser reader
    // gets the original file untouched: re-compressing changes Tesseract's results.
    const image = nativeScanner ? await photoToDataUrl(file) : URL.createObjectURL(file);
    let lines;
    try { ({ lines } = await scanner.recognize({ image })); }
    finally { if (!nativeScanner) URL.revokeObjectURL(image); }
    const numbers = extractTicketNumbers(lines);
    if (!numbers.length) { scanStatus = { key: 'scanNone' }; renderScanStatus(); return; }
    addTickets(numbers);
    scanStatus = { key: 'scanFound', n: numbers.length }; renderScanStatus();
    runCheck(); // check all tickets at once
  } catch (e) {
    console.error(e);
    scanStatus = { key: 'scanFailed' }; renderScanStatus();
  }
}

// ---------------------------------------------------------------- events
$('langs').addEventListener('click', (e) => {
  const k = e.target.closest('[data-lang]')?.dataset.lang;
  if (!k) return;
  lang = k;
  storage.set('lang', k);
  applyLanguage();
});
$('entry').addEventListener('input', () => takeFromEntry());
$('entryForm').addEventListener('submit', (e) => { e.preventDefault(); takeFromEntry({ force: true }); });
$('chips').addEventListener('click', (e) => {
  const n = e.target.closest('[data-remove]')?.dataset.remove;
  if (!n) return;
  tickets = tickets.filter((x) => x !== n);
  saveTickets(); renderTickets();
});
$('clear').addEventListener('click', clearAll);
// Tap outside the popup to close it.
$('popup').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.currentTarget.close();
});
$('check').addEventListener('click', runCheck);
$('date').addEventListener('change', () => loadDraw($('date').value));
for (const id of ['photoCamera', 'photoPick']) {
  $(id).addEventListener('change', (e) => { scanPhoto(e.target.files[0]); e.target.value = ''; });
}
// Drag a photo onto the page, or paste one (Ctrl/Cmd+V), e.g. a screenshot.
let dragDepth = 0;
const dropZone = $('scan');
addEventListener('dragenter', (e) => { if (e.dataTransfer?.types.includes('Files')) { dragDepth++; dropZone.classList.add('dragging'); } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; dropZone.classList.remove('dragging'); } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => {
  e.preventDefault(); dragDepth = 0; dropZone.classList.remove('dragging');
  scanPhoto([...(e.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/')));
});
addEventListener('paste', (e) => {
  const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
  if (file) { e.preventDefault(); scanPhoto(file); }
});

// ---------------------------------------------------------------- start
(async () => {
  // Light status-bar icons over the red header (apps only).
  window.Capacitor?.Plugins?.SystemBars?.setStyle?.({ style: 'DARK', bar: 'StatusBar' }).catch?.(() => {});
  applyLanguage();
  try {
    const latest = await getLatestDate();
    $('date').innerHTML = drawDates(latest).map((d) => `<option value="${d}">${formatDate(d, lang)}</option>`).join('');
    const first = await getAward(latest);
    if (!first.announced) $('date').selectedIndex = 1; // today's draw not out yet → previous draw
    await loadDraw($('date').value);
  } catch { errorKey = 'networkError'; renderResults(); }
})();
