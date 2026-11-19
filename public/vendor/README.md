# vendor/paddle-ocr.js

Browser photo reader used by `../web-ocr.js`: [@gutenye/ocr-browser](https://github.com/gutenye/ocr)
1.4.9 (PaddleOCR, MIT) with OpenCV.js and ONNX Runtime Web 1.31.1 (wasm build), bundled
into one ES module because this project has no build step.

The model files and the ONNX Runtime `.wasm` are not bundled; `web-ocr.js` loads them
from jsDelivr (`@gutenye/ocr-models@1.4.2`, `onnxruntime-web@1.31.1`). Keep the
onnxruntime-web version here in step with `ORT_WASM` in `web-ocr.js`.

Rebuild:

```bash
npm i @gutenye/ocr-browser@1.4.9 esbuild@0.24.2
echo "export default {};" > empty.js
cat > entry.js <<'JS'
import Ocr from '@gutenye/ocr-browser';
import { env } from 'onnxruntime-web';
export { Ocr, env };
JS
npx esbuild entry.js --bundle --format=esm --platform=browser --minify --legal-comments=none \
  --alias:fs=./empty.js --alias:path=./empty.js --alias:crypto=./empty.js \
  --alias:onnxruntime-web=./node_modules/onnxruntime-web/dist/ort.wasm.min.mjs \
  --outfile=paddle-ocr.js
```
