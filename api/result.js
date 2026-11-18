// GET /api/result?date=YYYY-MM-DD → prize results for that draw
import { getAward, DATE_RE } from '../lib/glo.js';

export default async function handler(req, res) {
  const date = String(req.query.date ?? '');
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  try {
    const award = await getAward(date);
    // Confirmed results never change: let Vercel's CDN keep them for a day.
    // Otherwise (draw in progress / not yet announced) only for a minute.
    res.setHeader('Cache-Control', award.announced && award.final
      ? 'public, s-maxage=86400, stale-while-revalidate=604800'
      : 'public, s-maxage=60');
    res.status(200).json(award);
  } catch (e) {
    res.status(502).json({ error: `Could not reach lottery service: ${e.message}` });
  }
}
