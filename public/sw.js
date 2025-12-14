
const CACHE_NAME = 'telepathy-v1';
const DB_NAME = 'telepathy-db';
const STORE_NAME = 'settings';

// --- Pure IndexedDB Helper for SW ---
function getDeviceIdFromDB() {
    return new Promise((resolve, reject) => {
        if (!indexedDB) resolve(null);
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => resolve(null);
        request.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                resolve(null);
                return;
            }
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get('myDeviceId');
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => resolve(null);
        };
    });
}

// 1. Register OUR listener FIRST to intercept loopback
self.addEventListener('push', async (event) => {
    const payload = event.data ? event.data.json() : null;

    // Check if it's our message and if it has senderId
    if (payload && payload.data && payload.data.senderId) {
        const myId = await getDeviceIdFromDB();

        // If sender is ME, stop everything.
        if (myId && payload.data.senderId === myId) {
            console.log('Loopback notification suppressed:', myId);
            event.stopImmediatePropagation();
            return;
        }
    }
});

// 2. Import Beams SDK AFTER our listener (so ours runs first)
importScripts("https://js.pusher.com/beams/service-worker.js");

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
