// POST /api/check { date: "YYYY-MM-DD", tickets: ["123456", ...] } → prizes per ticket
import { getAward, DATE_RE } from '../lib/glo.js';
import { checkTicket } from '../public/checker.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { date, tickets } = req.body ?? {};
  if (!DATE_RE.test(date ?? '') || !Array.isArray(tickets) || tickets.length > 100) {
    return res.status(400).json({ error: 'Send { date: "YYYY-MM-DD", tickets: ["123456", ...] } (max 100)' });
  }
  try {
    const award = await getAward(date);
    if (!award.announced) return res.status(200).json({ date, announced: false, results: [] });
    const results = tickets.map((t) => {
      try { return checkTicket(String(t).trim(), award.data); }
      catch (e) { return { ticket: t, error: e.message }; }
    });
    res.status(200).json({ date, announced: true, results });
  } catch (e) {
    res.status(502).json({ error: `Could not reach lottery service: ${e.message}` });
  }
}
