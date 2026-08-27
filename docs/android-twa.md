# Packaging Ikou as an Android app

Ikou ships to Android as a **Trusted Web Activity** — a thin native shell that
opens this site in Chrome, without the browser UI. The APK contains a URL, not
the app: deploying to `master` updates what everyone sees immediately, with no
new build and no store review. A rebuild is only needed to change the app name,
icon, package name, or the domain it points at.

The TWA runs the real Chrome engine rather than a WebView, which is why the
speaking drills keep working — `SpeechRecognition` does not exist in an Android
WebView, so a Capacitor/Cordova wrapper would silently lose that feature.

## Decide these once

Both are permanent. Changing either after publishing means a new Play Store
listing, not an update.

| | Value | Why it's fixed |
| --- | --- | --- |
| Package name | `com.neilsareen.ikou` | Play identifies the app by this forever |
| Domain | whatever the TWA is built against | Asset Links binds the app to one origin |

The domain in particular is worth settling before publishing: shipping against
`nihongo-now-lilac.vercel.app` marries the app to that hostname.

## 1. Build the package

### Option A — PWABuilder (no toolchain)

<https://www.pwabuilder.com> takes the site URL, reads `public/manifest.json`
and returns a signed package. It needs no JDK and no Android SDK, which makes it
the fastest route if you don't already develop Android locally.

1. Enter the site URL, let it analyse the manifest
2. **Package for stores → Android**
3. Set **Package ID** to `com.neilsareen.ikou`
4. Leave "signing key" as **Create new** — download the `.zip` and keep it safe
5. The zip contains the APK, the AAB (for Play), the signing key, and an
   `assetlinks.json` with the fingerprint already filled in

### Option B — Bubblewrap (local CLI)

Needs JDK 17+ and the Android SDK. Bubblewrap offers to install both on first
run.

```bash
npm install -g @bubblewrap/cli

bubblewrap init --manifest="https://<your-domain>/manifest.json"
# Package name: com.neilsareen.ikou
# Target SDK: 36  (Play requires API 36 for new apps from 31 Aug 2026)

bubblewrap build          # produces app-release-signed.apk and .aab
```

If you generate the signing key yourself:

```bash
keytool -genkeypair -v \
  -keystore ikou-release.keystore \
  -alias ikou -keyalg RSA -keysize 2048 -validity 10000
```

> Back the keystore and its passwords up somewhere you won't lose them. Losing
> the key means you can never ship an update to an app published outside Play
> App Signing — the listing has to be replaced.

## 2. Publish the fingerprint

Read the SHA-256 fingerprint of the signing certificate:

```bash
keytool -list -v -keystore ikou-release.keystore -alias ikou | grep SHA256
```

PWABuilder puts the same value in the `assetlinks.json` inside its zip.

Set it as an environment variable on the host (Vercel → Settings → Environment
Variables), then redeploy:

```
ANDROID_CERT_FINGERPRINTS=AB:CD:EF:...
```

`app/api/assetlinks/route.ts` serves this at `/.well-known/assetlinks.json`
(via the rewrite in `next.config.ts`). The variable accepts a comma-separated
list, which matters later: publishing through Play means Google re-signs the app
with **its own** certificate, and that fingerprint has to be added here too or
Play Store installs stop verifying. Find it under Play Console → Setup → App
signing.

Optionally override the package name with `ANDROID_PACKAGE_NAME`; it defaults to
`com.neilsareen.ikou`.

Verify:

```bash
curl https://<your-domain>/.well-known/assetlinks.json
```

## 3. Install it

Transfer the APK to the phone (Drive, email, USB) and open it, allowing
"install unknown apps" for whichever app you opened it from. Android only — an
APK does nothing on iOS, where the equivalent is Safari → Share → Add to Home
Screen.

**The check that matters:** launch the installed app. No address bar across the
top means Asset Links verified. If a URL bar is showing, the fingerprint served
at `/.well-known/assetlinks.json` doesn't match the certificate the APK was
signed with.

## Before the Play Store

- Play Console account, $25 one-off
- Personal accounts created after 13 Nov 2023 must run a closed test with **12
  testers opted in for 14 consecutive days** before applying for production.
  The **internal testing** track is exempt and installs immediately — start
  there.
- New apps must target **API 36** from 31 Aug 2026
- An account deletion path is required for apps with accounts; Ikou has none yet
- Store listing: 512×512 icon, 1024×500 feature graphic, 2+ phone screenshots,
  descriptions, content rating, and a Data safety form that has to agree with
  `/privacy`
