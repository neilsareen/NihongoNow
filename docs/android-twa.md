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

## 4. Make it fill the screen

By default a TWA starts *below* the status bar: the clock and battery sit on
their own opaque band above the app, which is what makes an otherwise native
app still read as a web page in a frame.

Getting the header to run to the physical top edge is a **build-time** setting,
not something the website can change. Editing `public/manifest.json` on the
live site does nothing to an APK that already exists — the display behaviour
was read out of the manifest when the package was generated and baked into it.
Any change here means rebuilding and reinstalling.

### What the website already does

The web app is written for an edge-to-edge shell and needs no further change:

- `viewportFit: "cover"` in `app/layout.tsx` opts the page into drawing behind
  the system bars, which is what makes `env(safe-area-inset-*)` report real
  numbers instead of zero.
- `--safe-t` / `--safe-b` in `app/globals.css` lift those insets into tokens,
  and a `.top-chrome` class puts the inset on whichever element carries a bar's
  fill — so the fill paints up behind the status bar while the contents clear
  it. Every top bar in the app uses it; the tab bar and the fixed drilling
  screens do the same at the bottom.

When the shell is *not* edge-to-edge those insets are zero and the whole thing
computes to no padding, so the app looks exactly as it does today. Nothing has
to be undone to go back.

### The build change

Target **API 35 or higher**. Android 15 enforces edge-to-edge for apps that do:
the system bars go transparent, the activity draws underneath them, and Chrome
passes the resulting insets through to the page as `env(safe-area-inset-*)`.
The status bar stays visible — the clock and battery sit over the app's own
header band rather than above it.

With Bubblewrap, that means regenerating the Android project on a current CLI
rather than hand-editing it:

```bash
npm install -g @bubblewrap/cli@latest
bubblewrap update      # regenerates the project with current SDK targets
bubblewrap build
```

Then confirm `targetSdkVersion` is 35 or higher in the generated
`app/build.gradle` before installing. PWABuilder packages target a current SDK
by default, so re-downloading the package is the equivalent step — reuse the
**same signing key**, or Asset Links stops verifying and the address bar comes
back (see step 2).

### Checking it worked

Reinstall and launch. The warm header band should run all the way up, with the
clock and battery sitting on top of it, and no content hidden underneath them.

**This only takes effect on Android 15 or newer** — Settings → About phone →
Android version. On Android 14 and below the app targets a high SDK but the
platform does not enforce edge-to-edge, so the status bar keeps its own band
and the app looks as it does today. That is the expected outcome there, not a
failure.

If you would rather have the whole screen on every Android version and can live
without the clock, the alternative is `"display": "fullscreen"` in
`public/manifest.json` before generating the package: that puts the TWA in
immersive mode and hides the system bars entirely. It is deterministic
everywhere, at the cost of the status bar the design currently expects.

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
