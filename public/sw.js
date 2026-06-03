/**
 * Kolori RH — Service Worker
 * Strategies:
 *  - HTML/navigation → Network-first (SSR pages must be fresh)
 *  - JS/CSS/fonts    → Cache-first (stable hashed assets)
 *  - Images          → Stale-while-revalidate
 *  - API (supabase)  → Network-only (never cache auth data)
 *  - Offline fallback→ /offline.html
 */

const CACHE_NAME = "kolori-rh-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ── Supabase / external API → Network-only ──────────────────────────────
  if (url.hostname.includes("supabase.co") || url.hostname.includes("supabase.io")) {
    return; // let browser handle it natively
  }

  // ── Google Fonts → Cache-first ───────────────────────────────────────────
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Static assets (JS, CSS, images, icons) → Cache-first ────────────────
  if (/\.(js|css|woff2?|ttf|eot|svg|ico|png|jpg|jpeg|webp|gif)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── HTML Navigation → Network-first with offline fallback ────────────────
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ── Everything else → Network-first ─────────────────────────────────────
  event.respondWith(networkFirst(request));
});

// ─── Strategies ─────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Ressource indisponible hors ligne.", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Hors ligne.", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ||
      new Response("<h1>Hors ligne</h1>", {
        headers: { "Content-Type": "text/html" },
        status: 503,
      })
    );
  }
}

// ─── Push Notifications (base) ───────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Kolori RH", {
      body: data.body || "Vous avez une nouvelle notification.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
