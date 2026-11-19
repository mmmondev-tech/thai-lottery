// Turns OCR text lines from a photo of tickets into 6-digit ticket numbers.
// Lottery tickets also show other numbers (draw no., set no., dates, prices),
// which are shorter, so only standalone 6-digit groups are kept.

// Letters OCR commonly confuses with digits — only applied to digit-heavy tokens.
const CONFUSABLE = { O: '0', o: '0', D: '0', Q: '0', I: '1', l: '1', '|': '1', '!': '1', S: '5', s: '5', B: '8', Z: '2', z: '2' };

function fixToken(token) {
  const digits = (token.match(/\d/g) || []).length;
  if (digits < 4) return token;
  return token.replace(/[OoDQIl|!SsBZz]/g, (c) => CONFUSABLE[c]);
}

// Every ticket prints its draw date, "1 พฤศจิกายน 2569" or "16 … 2569". When the Thai
// month is lost or misread as a digit, that line looks like a ticket number: a 1, one
// more digit, then the Buddhist year (e.g. 112569, 162569). Skip that shape — only
// 0.05% of real ticket numbers have it, and those can still be typed in.
const DATE_LINE = /^1\d25[5-9]\d$/;
// Readers also glue the printed year (2569 / 2026) onto nearby digits, e.g. "1n782569"
// or "16 NOVEMBER 2026" → 162026. Skip numbers ending in a year close to now: about
// 0.25% of real ticket numbers, which can still be typed in.
const YEAR_END = /(25[67]\d|202[5-8])$/;

export function extractTicketNumbers(lines) {
  const found = [];
  const add = (n) => { if (!DATE_LINE.test(n) && !YEAR_END.test(n) && !found.includes(n)) found.push(n); };
  for (const raw of lines) {
    const line = raw.split(/\s+/).map(fixToken).join(' ');
    // "423224" as one group
    for (const m of line.matchAll(/(?<!\d)\d{6}(?!\d)/g)) add(m[0]);
    // "4 2 3 2 2 4" / "4 23 2 24" — big ticket digits are printed spaced out and OCR
    // splits them unevenly. Accept a run of short groups (1–3 digits) totalling 6 digits.
    for (const m of line.matchAll(/(?<![\d ])\d{1,3}(?: \d{1,3})+(?![ \d])/g)) {
      const groups = m[0].split(' ');
      // At least one lone digit = spaced-out lettering, not separate numbers like "43 12 99".
      if (groups.join('').length === 6 && groups.some((g) => g.length === 1)) add(groups.join(''));
    }
  }
  return found;
}
