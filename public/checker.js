// Prize matching logic for the Thai Government Lottery.
// `data` is the `response.data` object returned by the GLO getLotteryAward API.

export const PRIZE_KEYS = ['first', 'near1', 'second', 'third', 'fourth', 'fifth', 'last3f', 'last3b', 'last2'];

const values = (data, key) => (data?.[key]?.number ?? []).map((n) => n.value);
const price = (data, key) => Number(data?.[key]?.price ?? 0);

/** Returns every prize a 6-digit ticket wins (a ticket can win several). */
export function checkTicket(ticket, data) {
  if (!/^\d{6}$/.test(ticket)) throw new Error(`Invalid ticket "${ticket}" — must be 6 digits`);
  const wins = [];
  const add = (key) => wins.push({ key, amount: price(data, key) });

  for (const key of ['first', 'near1', 'second', 'third', 'fourth', 'fifth']) {
    if (values(data, key).includes(ticket)) add(key);
  }
  // Each matching number counts separately (e.g. both front-3 numbers can't match one ticket,
  // but listing them this way keeps the logic uniform).
  for (const v of values(data, 'last3f')) if (ticket.slice(0, 3) === v) add('last3f');
  for (const v of values(data, 'last3b')) if (ticket.slice(3) === v) add('last3b');
  for (const v of values(data, 'last2')) if (ticket.slice(4) === v) add('last2');

  return { ticket, wins, total: wins.reduce((s, w) => s + w.amount, 0) };
}
