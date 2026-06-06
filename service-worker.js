const CACHE_NAME = "imposter-v20260606-2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles.css",
  "./styles-1.css",
  "./styles-2.css",
  "./styles-3.css",
  "./words.js",
  "./words-food.js",
  "./words-animals.js",
  "./words-places.js",
  "./words-objects.js",
  "./words-movies.js",
  "./words-brands.js",
  "./words-jobs.js",
  "./words-moments.js",
  "./script.js",
  "./helpers.js",
  "./actions.js",
  "./round.js",
  "./render-core.js",
  "./view-setup.js",
  "./view-play.js",
  "./view-result.js",
  "./boot.js",
  "./favicon.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./imposter_logo_transparent.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
