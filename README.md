# Thai Lottery Checker (ตรวจหวย)

Check Thai Government Lottery tickets against the official GLO results.

```bash
npm start        # http://localhost:3000  (Node 18+, no dependencies)
npm test         # prize-matching unit tests
```

Languages: Thai, English, Myanmar (switch at the top; translations in `public/i18n.js`).

- `public/` – the app (shared by web, Android and iOS)
  - `app.js` UI, `i18n.js` translations, `checker.js` prize matching, `api.js` data access
  - `scan.js` picks 6-digit ticket numbers out of text read from a photo
- `api/` – Vercel serverless functions (`/api/latest`, `/api/result`, `/api/check`) that fetch from `glo.or.th`
  (it blocks direct browser calls); shared code in `lib/glo.js`
- `server.js` – local web server (`npm start`); serves `public/` and runs the same `api/` handlers
- `android/`, `ios/` – native projects (Capacitor). The apps call GLO directly, no server needed.

## Deploy the web version (Vercel)

Import the GitHub repo in Vercel with Framework Preset **Other** and no build command.
`vercel.json` serves `public/` and runs the functions in Singapore (`sin1`), close to the GLO servers.
Every push to `main` redeploys.

## Mobile apps

**Scan tickets from a photo** (apps only): *Take photo* / *Choose photo* reads every ticket
number in the picture on the device and checks them all at once. Text recognition is native:
Google ML Kit on Android (`android/.../TicketScannerPlugin.java`, model supplied by Google Play
services) and Apple Vision on iOS (`TicketScannerPlugin` in `ios/App/App/AppDelegate.swift`).

After changing anything in `public/`, copy it into the native projects:

```bash
npx cap sync
```

**Android** – `npx cap open android` and press Run in Android Studio, or build from the terminal:
```bash
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

**iOS** – needs Xcode (Mac App Store). Then `npx cap open ios`, choose your Apple team under
Signing & Capabilities, and press Run.

Before publishing, change `appId` in `capacitor.config.json` (and the Android/iOS bundle ids) to one you own.

API: `GET /api/latest`, `GET /api/result?date=YYYY-MM-DD`,
`POST /api/check` with `{ "date": "YYYY-MM-DD", "tickets": ["123456"] }`.
