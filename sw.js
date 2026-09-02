/**
 * Service Worker - منصة نهج الأوائل
 * يدعم: التخزين المؤقت، العمل Offline، مزامنة الخلفية
 * بدون مكتبات خارجية للرياضيات
 */

const CACHE_NAME = 'nahj-alawael-v3';
const STATIC_CACHE = 'nahj-static-v3';
const DYNAMIC_CACHE = 'nahj-dynamic-v3';
const CDN_CACHE = 'nahj-cdn-v3';
const FONT_CACHE = 'nahj-fonts-v3';
const IMAGE_CACHE = 'nahj-images-v3';

// الملفات الأساسية للتطبيق (محلية)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/normalize.css',
    '/css/animate.css',
    '/css/style.css',
    '/js/jquery-3.1.1.min.js',
    '/js/jquery-ui.min.js',
    '/js/jquery.ns-autogrow.min.js',
    '/js/sweetAlert.js',
    '/js/crypto.js',
    '/js/lan_ar.js',
    '/js/script.js',
    '/js/goTo_pages.js',
    '/js/home.js',
    '/js/mytest.js',
    '/js/newtest.js',
    '/js/page_result.js',
    '/js/search.js',
    '/img/icon48x48.png',
    '/img/load.gif'
];

// مكتبات CDN للتخزين المؤقت (للموارد الخارجية)
const CDN_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-brands-400.woff2',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// خطوط Google Fonts (تشمل خطوط الرموز)
const FONT_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    'https://fonts.googleapis.com/css2?family=STIX+Two+Math:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Math&display=swap',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap'
];

// ==================== التثبيت ====================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(CDN_CACHE).then((cache) => {
                console.log('[SW] Caching CDN assets');
                return cache.addAll(CDN_ASSETS).catch((err) => {
                    console.warn('[SW] Some CDN assets failed:', err);
                    return Promise.resolve();
                });
            }),
            caches.open(FONT_CACHE).then((cache) => {
                console.log('[SW] Caching fonts');
                return cache.addAll(FONT_ASSETS).catch((err) => {
                    console.warn('[SW] Some fonts failed:', err);
                    return Promise.resolve();
                });
            })
        ]).then(() => {
            console.log('[SW] Install complete');
            return self.skipWaiting();
        })
    );
});

// ==================== التنشيط ====================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        return name.startsWith('nahj-') && 
                               name !== STATIC_CACHE && 
                               name !== DYNAMIC_CACHE &&
                               name !== CDN_CACHE &&
                               name !== FONT_CACHE &&
                               name !== IMAGE_CACHE;
                    })
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Activate complete');
            return self.clients.claim();
        })
    );
});

// ==================== الجلب ====================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (url.pathname.includes('analytics') || 
        url.pathname.includes('tracking')) {
        return;
    }
    
    if (request.method !== 'GET') {
        return;
    }
    
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isCDNAsset(url)) {
        event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    } else if (isFont(url)) {
        event.respondWith(cacheFirstWithExpiry(request, FONT_CACHE, 30 * 24 * 60 * 60 * 1000));
    } else if (isImage(url)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else if (isAPI(request)) {
        event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE));
    } else {
        event.respondWith(networkWithCacheFallback(request, DYNAMIC_CACHE));
    }
});

// ==================== استراتيجيات التخزين ====================

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        throw error;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
}

async function cacheFirstWithExpiry(request, cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
        const dateHeader = cached.headers.get('sw-date');
        if (dateHeader) {
            const age = Date.now() - parseInt(dateHeader);
            if (age < maxAge) {
                return cached;
            }
        } else {
            return cached;
        }
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set('sw-date', Date.now().toString());
            const modifiedResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });
            cache.put(request, modifiedResponse.clone());
            return modifiedResponse;
        }
        return response;
    } catch (error) {
        if (cached) return cached;
        throw error;
    }
}

async function networkFirstWithCache(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', error);
        const cached = await cache.match(request);
        if (cached) return cached;
        
        if (request.url.includes('supabase')) {
            return new Response(
                JSON.stringify({ 
                    error: 'offline',
                    message: 'أنت في وضع عدم الاتصال. سيتم المزامنة لاحقاً.' 
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        throw error;
    }
}

async function networkWithCacheFallback(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);
        if (cached) return cached;
        
        if (request.mode === 'navigate') {
            return cache.match('/index.html');
        }
        throw error;
    }
}

// ==================== مزامنة الخلفية ====================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-exam-results') {
        event.waitUntil(syncExamResults());
    } else if (event.tag === 'sync-class-data') {
        event.waitUntil(syncClassData());
    }
});

async function syncExamResults() {
    const db = await openDB('NahjOfflineDB', 1);
    const pendingResults = await db.getAll('pendingResults');
    
    for (const result of pendingResults) {
        try {
            const response = await fetch('/api/submit-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
            if (response.ok) {
                await db.delete('pendingResults', result.id);
            }
        } catch (error) {
            console.error('[SW] Sync failed for result:', error);
        }
    }
}

// ==================== الإشعارات ====================

self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/img/icon48x48.png',
        badge: '/img/icon48x48.png',
        tag: data.tag || 'nahj-notification',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        data: data.data || {}
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const notificationData = event.notification.data;
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    client.postMessage({
                        type: 'notification-click',
                        data: notificationData
                    });
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(notificationData.url || '/');
            }
        })
    );
});

// ==================== دوال مساعدة ====================

function isStaticAsset(url) {
    const staticPaths = ['/css/', '/js/', '/img/', '/assets/'];
    return staticPaths.some(path => url.pathname.startsWith(path));
}

function isCDNAsset(url) {
    const cdnHosts = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'];
    return cdnHosts.includes(url.hostname);
}

function isFont(url) {
    return url.hostname === 'fonts.googleapis.com' || 
           url.hostname === 'fonts.gstatic.com' ||
           url.pathname.endsWith('.woff2') ||
           url.pathname.endsWith('.woff') ||
           url.pathname.endsWith('.ttf');
}

function isImage(url) {
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    return imageExts.some(ext => url.pathname.endsWith(ext));
}

function isAPI(request) {
    return request.url.includes('supabase.co') ||
           request.url.includes('/api/') ||
           request.headers.get('Accept')?.includes('application/json');
}

function openDB(name, version) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingResults')) {
                db.createObjectStore('pendingResults', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('pendingContent')) {
                db.createObjectStore('pendingContent', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// ==================== رسائل من التطبيق ====================

self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    } else if (event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ size });
        });
    }
});

async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const request of requests) {
            const response = await cache.match(request);
            const blob = await response.blob();
            totalSize += blob.size;
        }
    }
    return {
        bytes: totalSize,
        mb: (totalSize / 1024 / 1024).toFixed(2)
    };
}
