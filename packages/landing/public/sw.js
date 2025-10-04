// @ts-check
/// <reference lib="webworker" />

// Service Worker for Nvisy Web App
// Version: 1.0.0

// Properly type the service worker global scope
const sw = /** @type {ServiceWorkerGlobalScope} */ (
	/** @type {unknown} */ (self)
);

const CACHE_NAME = "nvisy-v1.0.0";
const STATIC_CACHE_NAME = "nvisy-static-v1.0.0";
const DYNAMIC_CACHE_NAME = "nvisy-dynamic-v1.0.0";

// Assets to cache on install
const STATIC_ASSETS = ["/", "/favicon.svg", "/robots.txt", "/humans.txt"];

// Assets that should be cached with cache-first strategy
const CACHE_FIRST_PATTERNS = [
	/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|gif|ico)$/,
	/\/fonts\//,
	/\/_astro\//,
];

// Assets that should use network-first strategy
const NETWORK_FIRST_PATTERNS = [/\/api\//, /\/blog\//];

// Install event - cache static assets
sw.addEventListener("install", (event) => {
	console.log("[SW] Installing service worker");

	event.waitUntil(
		caches
			.open(STATIC_CACHE_NAME)
			.then((cache) => {
				console.log("[SW] Caching static assets");
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => {
				console.log("[SW] Static assets cached");
				return sw.skipWaiting();
			})
			.catch((error) => {
				console.error("[SW] Failed to cache static assets:", error);
			}),
	);
});

// Activate event - clean up old caches
sw.addEventListener("activate", (event) => {
	console.log("[SW] Activating service worker");

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (
							cacheName !== STATIC_CACHE_NAME &&
							cacheName !== DYNAMIC_CACHE_NAME &&
							cacheName.startsWith("nvisy-")
						) {
							console.log("[SW] Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
						return Promise.resolve();
					}),
				);
			})
			.then(() => {
				console.log("[SW] Service worker activated");
				return sw.clients.claim();
			}),
	);
});

// Fetch event - handle requests with appropriate strategy
sw.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip cross-origin requests
	if (url.origin !== location.origin) {
		return;
	}

	// Skip non-GET requests
	if (request.method !== "GET") {
		return;
	}

	event.respondWith(handleRequest(request));
});

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
	const url = new URL(request.url);

	try {
		// Cache-first strategy for static assets
		if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
			return await cacheFirstStrategy(request);
		}

		// Network-first strategy for dynamic content
		if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
			return await networkFirstStrategy(request);
		}

		// Default: Network-first for HTML pages
		return await networkFirstStrategy(request);
	} catch (error) {
		console.error("[SW] Request handling failed:", error);
		return await handleOffline(request);
	}
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirstStrategy(request) {
	const cached = await caches.match(request);

	if (cached) {
		// Update cache in background
		updateCacheInBackground(request);
		return cached;
	}

	return await fetchAndCache(request);
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirstStrategy(request) {
	try {
		const response = await fetch(request);

		if (response.ok) {
			await cacheResponse(request, response.clone());
		}

		return response;
	} catch (error) {
		// Network failed, try cache
		const cached = await caches.match(request);
		if (cached) {
			return cached;
		}

		throw error;
	}
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function fetchAndCache(request) {
	const response = await fetch(request);

	if (response.ok) {
		await cacheResponse(request, response.clone());
	}

	return response;
}

/**
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<void>}
 */
async function cacheResponse(request, response) {
	const url = new URL(request.url);

	// Determine which cache to use
	const cacheName = CACHE_FIRST_PATTERNS.some((pattern) =>
		pattern.test(url.pathname),
	)
		? STATIC_CACHE_NAME
		: DYNAMIC_CACHE_NAME;

	const cache = await caches.open(cacheName);
	await cache.put(request, response);
}

/**
 * @param {Request} request
 * @returns {Promise<void>}
 */
async function updateCacheInBackground(request) {
	try {
		const response = await fetch(request);
		if (response.ok) {
			await cacheResponse(request, response);
		}
	} catch (error) {
		// Silently fail background updates
		console.warn("[SW] Background cache update failed:", error);
	}
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleOffline(request) {
	// Try to find a cached response
	const cached = await caches.match(request);
	if (cached) {
		return cached;
	}

	// For HTML requests, try to serve cached homepage or a generic offline page
	if (request.headers.get("accept")?.includes("text/html")) {
		const cachedHome = await caches.match("/");
		if (cachedHome) {
			return cachedHome;
		}

		// Return a basic offline response
		return new Response(
			`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Offline - Nvisy</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            text-align: center;
            padding: 2rem;
            color: #666;
          }
          .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <div class="offline-icon">📡</div>
        <h1>You're offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Retry</button>
      </body>
      </html>
      `,
			{
				status: 200,
				headers: { "Content-Type": "text/html" },
			},
		);
	}

	// For other requests, return a 503 Service Unavailable
	return new Response(
		JSON.stringify({ error: "Service unavailable offline" }),
		{
			status: 503,
			headers: { "Content-Type": "application/json" },
		},
	);
}

// Handle messages from the main thread
sw.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		sw.skipWaiting();
	}

	if (event.data && event.data.type === "GET_VERSION") {
		if (event.ports?.[0]) {
			event.ports[0].postMessage({ version: CACHE_NAME });
		}
	}
});

// Background sync for offline actions (if supported)
if ("sync" in sw.registration) {
	sw.addEventListener("sync", (/** @type {any} */ event) => {
		console.log("[SW] Background sync:", event.tag);

		if (event.tag === "background-sync") {
			event.waitUntil(performBackgroundSync());
		}
	});
}

async function performBackgroundSync() {
	// Implement background sync logic here
	// For example, retry failed API requests
	console.log("[SW] Performing background sync");
}
