// ========================================
// NSE Market Analytics
// Service Worker
//
// Caches the app shell (HTML/CSS/JS + the
// small companies.json) so the app can be
// installed and opens instantly even offline.
//
// Deliberately does NOT cache data/prices/*.json
// - that's ~90MB+ across 20 files, and caching
// it all on install would be slow, wasteful of
// device storage, and would silently serve stale
// price data. Price files are always fetched from
// the network (cache-first fallback to whatever
// happens to already be in the HTTP cache).
// ========================================

const CACHE_NAME = "nse-analytics-shell-v1";

const SHELL_FILES = [
    "index.html",
    "sector.html",
    "company.html",
    "manifest.json",

    "css/variables.css",
    "css/base.css",
    "css/dashboard.css",

    "js/app.js",
    "js/sector.js",
    "js/company.js",
    "js/performance.js",
    "js/data-loader.js",
    "js/year-range.js",
    "js/watchlist.js",
    "js/csv-export.js",

    "data/companies.json",

    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/apple-touch-icon.png"
];


// ========================================
// Install: pre-cache the app shell
// ========================================

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache =>
                    cache.addAll(
                        SHELL_FILES
                    )
                )
                .then(() =>
                    self.skipWaiting()
                )

        );

    }
);


// ========================================
// Activate: clean up old cache versions
// ========================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(keys =>
                    Promise.all(
                        keys
                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )
                            .map(key =>
                                caches.delete(
                                    key
                                )
                            )
                    )
                )
                .then(() =>
                    self.clients.claim()
                )

        );

    }
);


// ========================================
// Fetch: cache-first for shell files,
// network-only (never cached) for the large
// yearly price data files
// ========================================

self.addEventListener(
    "fetch",
    event => {

        const url =
            new URL(event.request.url);


        // Never cache the large per-year price
        // files - always go to the network.

        if (
            url.pathname.includes(
                "/data/prices/"
            )
        ) {

            return;

        }


        // Only handle same-origin GET requests
        // for everything else.

        if (
            event.request.method !== "GET" ||
            url.origin !==
                self.location.origin
        ) {

            return;

        }


        event.respondWith(

            caches
                .match(event.request)
                .then(cachedResponse => {

                    if (cachedResponse) {

                        return cachedResponse;

                    }


                    return fetch(
                        event.request
                    ).then(networkResponse => {

                        // Opportunistically cache
                        // newly-seen shell-like
                        // assets (e.g. companies.json
                        // updates)

                        if (
                            networkResponse &&
                            networkResponse.ok
                        ) {

                            const responseClone =
                                networkResponse.clone();

                            caches
                                .open(CACHE_NAME)
                                .then(cache =>
                                    cache.put(
                                        event.request,
                                        responseClone
                                    )
                                );

                        }


                        return networkResponse;

                    });

                })

        );

    }
);
