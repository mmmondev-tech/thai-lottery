// Photo text recognition for browsers (desktop & mobile web), where the native
// ML Kit / Vision plugin isn't available. Uses PaddleOCR (free, open source) running
// in the browser via ONNX Runtime — the photo never leaves the device.
//
// Loaded only on the first scan:
//   - vendor/paddle-ocr.js: @gutenye/ocr-browser 1.4.9 + OpenCV + ONNX Runtime (wasm),
//     bundled with esbuild (see vendor/README.md)
//   - the ONNX Runtime .wasm and the PaddleOCR models from the jsDelivr CDN (~30 MB,
//     cached by the browser afterwards)
//
// Same interface as the native plugin: recognize({ image: url }) → { lines: string[] },
// plus an optional onProgress({ stage: 'load' | 'read', progress }).
import { extractTicketNumbers } from './scan.js';

const ORT_WASM = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/';
const MODELS = 'https://cdn.jsdelivr.net/npm/@gutenye/ocr-models@1.4.2/assets/';

let ocrPromise = null;
function getOcr() {
  ocrPromise ??= (async () => {
    const { Ocr, env } = await import('./vendor/paddle-ocr.js');
    env.wasm.wasmPaths = ORT_WASM;
    return Ocr.create({
      models: {
        detectionPath: MODELS + 'ch_PP-OCRv4_det_infer.onnx',
        recognitionPath: MODELS + 'ch_PP-OCRv4_rec_infer.onnx',
        dictionaryPath: MODELS + 'ppocr_keys_v1.txt',
      },
    });
  })().catch((e) => { ocrPromise = null; throw e; }); // allow retry after a network error
  return ocrPromise;
}

const loadImage = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

// Part of the photo (x, y, w, h), scaled so its long side is `longSide` px, as raw pixels.
function crop(img, [x, y, w, h], longSide) {
  const scale = longSide / Math.max(w, h);
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  return { data, width, height };
}

// Ticket numbers are small in a photo of many tickets, so the photo is enlarged before
// reading, and read three ways. A number counts only when at least two readings agree:
// each reading on its own sometimes invents a number (from dates, serials, barcodes),
// but rarely the same one twice. Tested on 5 photos of 10 tickets: 49/50 read, none wrong.
const READINGS = [
  { name: 'whole, large', parts: (W, H) => [[0, 0, W, H]], longSide: 2560 },
  { name: 'whole, medium', parts: (W, H) => [[0, 0, W, H]], longSide: 1920 },
  {
    name: '4 pieces', longSide: 1420,
    parts: (W, H) => {
      const out = [], ov = 0.12, tw = W / 2, th = H / 2;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const x = Math.max(0, c * tw - tw * ov), y = Math.max(0, r * th - th * ov);
        out.push([x, y, Math.min(W - x, tw * (1 + 2 * ov)), Math.min(H - y, th * (1 + 2 * ov))]);
      }
      return out;
    },
  },
];

export const webScanner = {
  async recognize({ image, onProgress = () => {} }) {
    onProgress({ stage: 'load' });
    const ocr = await getOcr();
    const img = await loadImage(image);
    const W = img.naturalWidth, H = img.naturalHeight;
    const jobs = READINGS.flatMap((r, i) => r.parts(W, H).map((part) => ({ reading: i, part, longSide: r.longSide })));
    const lines = READINGS.map(() => []);
    for (const [n, job] of jobs.entries()) {
      onProgress({ stage: 'read', progress: n / jobs.length });
      const { texts } = await ocr.detect(crop(img, job.part, job.longSide));
      lines[job.reading].push(...texts.map((t) => t.text));
    }
    onProgress({ stage: 'read', progress: 1 });
    return { lines: pickTicketNumbers(lines) };
  },
};

// Merge the readings: a number read by all 3 counts; one read by 2 counts unless it
// looks like a piece of a longer code. Each ticket has a small orange code under the
// date (e.g. "43 4311021 12"); readers sometimes return its tail plus the set number
// ("1021" + "12" → 102112), and can do so twice. Real ticket numbers rarely share
// their first 4 digits with such a 7+ digit code in the same photo.
export function pickTicketNumbers(readings) {
  const votes = new Map();
  for (const l of readings) for (const n of extractTicketNumbers(l)) votes.set(n, (votes.get(n) ?? 0) + 1);
  const codes = readings.flat().join(' ').match(/\d{7,}/g) ?? [];
  const partOfCode = (n) => codes.some((c) => c.includes(n.slice(0, 4)));
  return [...votes].filter(([n, v]) => v >= 3 || (v === 2 && !partOfCode(n))).map(([n]) => n);
}
