// Service Worker for ReBin Pro PWA
const CACHE_NAME = "rebin-pro-v1.0.0";
const STATIC_CACHE_NAME = "rebin-pro-static-v1.0.0";
const DYNAMIC_CACHE_NAME = "rebin-pro-dynamic-v1.0.0";

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/earthTransparent.png",
  "/avatars/eco-emma.png",
  "/avatars/green-gary.png",
  "/avatars/professor-pete.png",
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/analytics\/trends/,
  /\/api\/analytics\/leaderboard/,
  /\/api\/challenges/,
  /\/api\/users\/preferences/,
  /\/api\/policies/,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Static assets cached successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Failed to cache static assets:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API requests to prevent caching issues
  if (isAPIRequest(request)) {
    return; // Let the browser handle API requests normally
  }

  // IMPORTANT: Skip cross-origin requests entirely (e.g., Supabase, OpenRouter)
  // to avoid interfering with auth/network flows
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Static assets - Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (isImageRequest(request)) {
    // Images - Cache First with fallback
    event.respondWith(cacheFirst(request));
  } else {
    // Other requests - Network First
    event.respondWith(networkFirst(request));
  }
});

// Cache First strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Cache first failed:", error);
    return new Response("Offline - Resource not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return (
        caches.match("/offline.html") ||
        new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
        })
      );
    }

    return new Response("Offline - Resource not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  return (
    STATIC_ASSETS.some((asset) => request.url.endsWith(asset)) ||
    request.url.includes("/static/") ||
    request.url.includes("/public/")
  );
}

function isAPIRequest(request) {
  return (
    API_CACHE_PATTERNS.some((pattern) => pattern.test(request.url)) ||
    request.url.includes("/api/")
  );
}

function isImageRequest(request) {
  return (
    request.destination === "image" ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url)
  );
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "sort-event-sync") {
    event.waitUntil(syncSortEvents());
  } else if (event.tag === "feedback-sync") {
    event.waitUntil(syncFeedback());
  }
});

// Sync sort events when back online
async function syncSortEvents() {
  try {
    const cache = await caches.open("offline-actions");
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes("/api/event")) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.delete(request);
            console.log("Synced sort event:", request.url);
          }
        } catch (error) {
          console.error("Failed to sync sort event:", error);
        }
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Sync feedback when back online
async function syncFeedback() {
  try {
    const cache = await caches.open("offline-actions");
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes("/api/feedback")) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.delete(request);
            console.log("Synced feedback:", request.url);
          }
        } catch (error) {
          console.error("Failed to sync feedback:", error);
        }
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  const options = {
    body: event.data ? event.data.text() : "New challenge available!",
    icon: "/avatars/eco-emma.png",
    badge: "/avatars/eco-emma.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/avatars/eco-emma.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/avatars/eco-emma.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("ReBin Pro", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Message handling for communication with main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
