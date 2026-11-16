# Thai Lottery Checker (ตรวจหวย)

Check Thai Government Lottery tickets against the official GLO results.

```bash
npm start        # http://localhost:3000  (Node 18+, no dependencies)
npm test         # prize-matching unit tests
```

Languages: Thai, English, Myanmar (switch at the top; translations in `public/i18n.js`).

- `public/` – the app (shared by web, Android and iOS)
  - `app.js` UI, `i18n.js` translations, `checker.js` prize matching, `api.js` data access
- `server.js` – web version only: serves `public/` and proxies `glo.or.th` (it blocks browser calls)
- `android/`, `ios/` – native projects (Capacitor). The apps call GLO directly, no server needed.

## Mobile apps

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
