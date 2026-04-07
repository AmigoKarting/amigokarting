const CACHE_NAME = "amigo-karting-v1";

// Pages à mettre en cache pour un chargement rapide
const PRECACHE = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Installation : mettre les pages de base en cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activation : nettoyer les vieux caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : réseau d'abord, cache en backup
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes API et auth
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("supabase") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse fraîche
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Si hors-ligne, utiliser le cache
        return caches.match(event.request);
      })
  );
});
