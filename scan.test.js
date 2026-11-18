import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTicketNumbers } from './public/scan.js';

test('finds plain and spaced 6-digit numbers, ignores other numbers', () => {
  const lines = [
    'สลากกินแบ่งรัฐบาล', '423224', 'งวดที่ 43 ชุดที่ 12', '1 พฤศจิกายน 2569', 'ราคา 80 บาท',
    '9 5 0 3 9 3', 'barcode 4312423224460', '777777 123456', '423224',
  ];
  assert.deepEqual(extractTicketNumbers(lines), ['423224', '950393', '777777', '123456']);
});
test('fixes letters misread as digits', () => {
  assert.deepEqual(extractTicketNumbers(['95O393', 'l23456']), ['950393', '123456']);
});
test('real ML Kit output from a photo of 3 tickets', () => {
  const lines = ['nai 43 nñ 12', '4 23 2 24', '1 wagânNgw 2569 80 uNn', 'snai 43 yai 31', '777777',
    '1 wafânngu 2569 80 uNm', 'nan 43 añ o7', '950393', '1 wgaânnøu 2569 80 unn'];
  assert.deepEqual(extractTicketNumbers(lines), ['423224', '777777', '950393']);
});
test('does not glue separate groups together', () => {
  assert.deepEqual(extractTicketNumbers(['12 3456', '43 12 99']), []);
});
