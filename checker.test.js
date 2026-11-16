import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTicket } from './public/checker.js';

const n = (...v) => v.map((value) => ({ value }));
const data = {
  first: { price: '6000000.00', number: n('423224') },
  near1: { price: '100000.00', number: n('423223', '423225') },
  second: { price: '200000.00', number: n('213938') },
  third: { price: '80000.00', number: n('006082') },
  fourth: { price: '40000.00', number: n('044469') },
  fifth: { price: '20000.00', number: n('001950') },
  last3f: { price: '4000.00', number: n('300', '950') },
  last3b: { price: '4000.00', number: n('393', '804') },
  last2: { price: '2000.00', number: n('24') },
};

test('first prize also collects last-2 prize', () => {
  const r = checkTicket('423224', data);
  assert.deepEqual(r.wins.map((w) => w.key), ['first', 'last2']);
  assert.equal(r.total, 6_002_000);
});
test('near first prize', () => assert.equal(checkTicket('423225', data).total, 100_000));
test('front 3 + back 3', () => {
  assert.deepEqual(checkTicket('950393', data).wins.map((w) => w.key), ['last3f', 'last3b']);
});
test('last 2 only', () => assert.equal(checkTicket('111124', data).total, 2_000));
test('no win', () => assert.equal(checkTicket('777777', data).wins.length, 0));
test('rejects bad input', () => assert.throws(() => checkTicket('12345', data)));
