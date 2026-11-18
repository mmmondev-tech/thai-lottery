// GET /api/latest → { date } of the newest draw
import { getLatestDate } from '../lib/glo.js';

export default async function handler(req, res) {
  try {
    const date = await getLatestDate();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ date });
  } catch (e) {
    res.status(502).json({ error: `Could not reach lottery service: ${e.message}` });
  }
}
