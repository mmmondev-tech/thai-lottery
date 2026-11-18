// Photo text recognition for browsers (desktop & mobile web), where the native
// ML Kit / Vision plugin isn't available. Uses Tesseract.js, loaded from the CDN
// only the first time someone scans a photo. Same interface as the native plugin:
// recognize({ image: dataUrl }) → { lines: string[] }.
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

let workerPromise = null;

function loadScript(src) {
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src));
    document.head.append(s);
  });
}

function getWorker() {
  workerPromise ??= (async () => {
    if (!window.Tesseract) await loadScript(TESSERACT_URL);
    const worker = await window.Tesseract.createWorker('eng');
    // Sparse text: find numbers scattered anywhere on the ticket(s), not paragraphs.
    await worker.setParameters({ tessedit_pageseg_mode: window.Tesseract.PSM.SPARSE_TEXT });
    return worker;
  })().catch((e) => { workerPromise = null; throw e; }); // allow retry after a network error
  return workerPromise;
}

const loadImage = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

function draw(img, longSide) {
  const scale = longSide / Math.max(img.naturalWidth, img.naturalHeight);
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// Ticket numbers are printed in black over a pink/orange wavy security pattern,
// which confuses Tesseract. Keep only dark, uncoloured (black ink) pixels.
function blackInkOnly(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height), d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    d[i] = d[i + 1] = d[i + 2] = lum < 140 && chroma < 90 ? 0 : 255;
  }
  ctx.putImageData(px, 0, 0);
  return canvas;
}

async function read(worker, canvas) {
  const { data } = await worker.recognize(canvas);
  return data.text.split('\n').map((l) => l.trim()).filter(Boolean);
}

export const webScanner = {
  // Two passes, merged: black-ink-only at ~2× (reads most tickets), plus the plain
  // photo (catches a few the first pass misses). Tested on a real 10-ticket photo:
  // 8/10 read, none wrong — vs 3/10 for the plain photo alone.
  async recognize({ image }) {
    const worker = await getWorker();
    const img = await loadImage(image);
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    const inked = await read(worker, blackInkOnly(draw(img, 2560)));
    const plain = await read(worker, draw(img, Math.min(long, 1280)));
    return { lines: [...inked, ...plain] };
  },
};
