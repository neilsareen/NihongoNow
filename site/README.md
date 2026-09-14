# Ikou — business site

The public site for Ikou, separate from the app itself. Two files and no build
step: plain HTML and one stylesheet, so any static host will serve it as-is.

```
site/
  index.html     the page
  styles.css     the design system, ported from the app
  favicon.svg
```

## Run it locally

Any static server will do — there is nothing to compile.

```bash
npx serve site        # or: python3 -m http.server -d site 8080
```

## Deploy it

The site is intentionally independent of the Next.js app, so it can live on its
own host and its own domain (`ikou.app`, say) while the app keeps its own.

- **Vercel / Netlify / Cloudflare Pages** — new project, point it at this repo,
  set the *root directory* (Vercel) or *publish directory* (Netlify, Pages) to
  `site`, and leave the build command empty.
- **GitHub Pages** — serve from `/site` on the branch of your choice.
- **Anything else** — upload the three files.

## Before launch

Three things in `index.html` are written against values that are not settled
yet. All three are marked with comments in the file.

1. **The app's URL.** Every link to the live app currently points at
   `https://nihongo-now-lilac.vercel.app`. Search for that string — it appears
   in the hero button, the store plate and the footer — and replace it with the
   app's real domain once there is one.
2. **The site's own URL.** `og:url`, `og:image` and the canonical link assume
   `https://ikou.app/`. Set them to wherever this is actually hosted.
3. **A social card image.** `og:image` points at `/og.png`, which does not exist
   yet. 1200×630, and until it exists a shared link simply renders as a title
   and description rather than breaking.

## When the Play Store listing goes live

The Google Play plate in the "Get the app" section is deliberately **not a
link** — it is a labelled `<span>` reading "Coming soon to Google Play", because
a store button that 404s costs more trust than an honest label. There is a
comment beside it in `index.html` with the exact replacement markup. Two edits:

1. Swap the `<span class="store store--soon">` for an `<a class="store
   store--live pressable">` pointing at
   `https://play.google.com/store/apps/details?id=com.neilsareen.ikou`
   (the package name is fixed — see `docs/android-twa.md`), with the label
   changed to "Get it on / Google Play".
2. Replace the plain Play triangle drawn inline with Google's official badge
   artwork. Their brand guidelines require the official badge on a live
   listing, and it is theirs to supply:
   <https://play.google.com/intl/en_us/badges/>

## Design notes

The palette, the two Latin faces (Outfit for display, Plus Jakarta Sans for
text), the Japanese face (Noto Sans JP) and the elevation model are lifted from
the app's own design system in `app/globals.css` rather than reinvented — the
site and the app should not feel like two products.

The one deliberate divergence: this site commits to the dark violet ground
only, where the app themes both ways. The app is read for ten minutes at a time
in whatever light the reader is in; a marketing page is looked at once, and the
violet ink is the brand.

The phone in the hero is the drill screen rebuilt from those same tokens, not a
screenshot. It costs a little markup and never goes stale against a redesign the
way a PNG would.
