// Bumped from ikou-v1 to purge caches poisoned by the bug below, where failed
// responses (404s for chunks removed by a deploy) were stored permanently and
// then served as JS forever, breaking the app with a client-side exception.
// The activate handler deletes every cache whose name !== CACHE, so renaming
// this constant is what actually clears the bad entries off existing devices.
const CACHE = "ikou-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => {
      self.clients.claim();
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
      });
    })
  );
});

// Only a complete, successful, same-origin response is safe to keep. Caching a
// 404/500 (or an opaque cross-origin response) means later serving an HTML
// error body in place of a script, which throws on execution.
function isCacheable(response) {
  return response && response.ok && response.status === 200 && response.type === "basic";
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // Never intercept HTML navigation requests — auth state must come from server
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Never intercept API calls
  if (e.request.url.includes("/api/")) return;

  const url = new URL(e.request.url);

  // Let the service worker script itself always come from the network, so a
  // broken worker can never cache itself into permanence.
  if (url.pathname === "/sw.js") return;

  // Cache-first for static assets (JS, CSS, fonts, images)
  // The clip map is a mutable pointer at immutable files, so it cannot be
  // cache-first the way the clips themselves are: one stale copy would keep
  // pointing at a previous deploy's set forever, and a learner who had ever
  // been online would never see a new line's audio. Network first, falling
  // back to the cached copy so offline still resolves clips.
  if (url.pathname === "/audio/manifest.json") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (isCacheable(r)) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
          }
          return r;
        })
        .catch(() =>
          caches.match(e.request).then(
            (cached) =>
              cached ||
              // An empty map is a valid answer: every reading then misses and
              // the app falls through to device synthesis, as it did before
              // any audio was shipped.
              new Response('{"version":0,"format":"none","clips":{}}', {
                headers: { "Content-Type": "application/json" },
              })
          )
        )
    );
    return;
  }

  // Pre-rendered speech is cached like any other static asset, which is what
  // makes it work offline and on a device whose speech engine has no Japanese
  // voice. Clip filenames are content-addressed, so a cached one is by
  // definition still correct.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/audio/ja/") ||
    /\.(js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|ico|webp|mp3|opus|ogg|m4a|wav)$/.test(url.pathname);

  if (isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((r) => {
          if (isCacheable(r)) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
          }
          return r;
        });
      })
    );
  }
});
