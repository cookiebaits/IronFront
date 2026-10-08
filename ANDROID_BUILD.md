# Installing Iron Front on your Android phone

The game is a web app wrapped with [Capacitor](https://capacitorjs.com). It is locked to
**landscape + fullscreen** inside the APK.

## Option A — GitHub builds the APK for you (no Android tools needed)

1. Push this project to a GitHub repository.
2. Open the repo's **Actions** tab → **Build Android APK** → **Run workflow**.
3. When it finishes, open the run and download the **iron-front-debug-apk** artifact (a zip).
4. Unzip it and copy `app-debug.apk` to your phone.
5. On the phone, open the file and allow *Install unknown apps* when asked.

## Option B — build it on your computer

Needs Node 24+, JDK 21 and the Android SDK (install Android Studio once, then set `ANDROID_HOME`).

```bash
bash scripts/build-apk.sh
adb install -r iron-front-debug.apk     # with USB debugging on, or copy the file to your phone
```

## Option C — no APK: install as a web app

Host the `dist/` folder over HTTPS (e.g. GitHub Pages, Netlify). Open the URL in Chrome on your
phone → ⋮ menu → **Add to Home screen**. It opens fullscreen and requests landscape.

## Notes

- The APK is a **debug** build, fine for testing. A Play Store release needs signing.
- Progress is stored on the device (localStorage) and survives app restarts.
- Online / Co-op rooms need an internet connection on both phones.
