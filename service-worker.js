/**
 * ============================================
 * CONECTA JÁ - SERVICE WORKER PWA + FCM
 * Versão: 1.2.0
 * ============================================
 */

// ── Firebase Messaging (background push) ──
// DESACTIVADO — requer plano Blaze. Descomentar quando activares o Blaze.
/*
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: 'AIzaSyA8C6FHaecrnb16MOCk5SG-dplVhOh8wug',
  projectId: 'conectaja-b1076', messagingSenderId: '65289995093',
  appId: '1:65289995093:web:fa24addbcbcd447e74e5dc'
});
firebase.messaging().onBackgroundMessage(function(payload) {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'ConectaJá', {
    body: n.body || '', icon: '/icons/icon-192x192.png',
    data: { url: (payload.data || {}).url || '/mensagens.html' }
  });
});
*/

const CACHE_NAME = 'conectaja-v1.2.0';
const OFFLINE_PAGE = '/offline.html';

// Ficheiros essenciais para cache (funciona offline)
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/prestadores.html',
    '/sobre.html',
    '/contacto.html',
    '/faq.html',
    '/blog.html',
    '/offline.html',
    '/mensagens.html',
    '/chat.html',
    '/login.html',
    '/register.html',
    '/configuracoes.html',
    '/styles.css',
    '/global.css',
    '/script.js',
    '/i18n.js',
];

// Recursos externos (CDN)
const EXTERNAL_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ============================================
// INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(STATIC_CACHE_URLS)
                    .then(() => {
                        return Promise.allSettled(
                            EXTERNAL_RESOURCES.map(url =>
                                cache.add(url).catch(() => {})
                            )
                        );
                    });
            })
            .then(() => self.skipWaiting())
            .catch(() => {})
    );
});

// ============================================
// ATIVAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============================================
// INTERCEPTAÇÃO DE REQUISIÇÕES
// Estratégia: Network First, fallback para Cache
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    if (url.origin !== location.origin && !EXTERNAL_RESOURCES.includes(request.url)) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;

                        if (request.headers.get('accept')?.includes('text/html')) {
                            return caches.match(OFFLINE_PAGE);
                        }

                        return new Response('Recurso não disponível offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({ 'Content-Type': 'text/plain' })
                        });
                    });
            })
    );
});

// ============================================
// NOTIFICAÇÕES PUSH (FCM + Web Push)
// ============================================
self.addEventListener('push', (event) => {
    let data = {
        title: 'ConectaJá',
        body: 'Tens uma nova notificação!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'cj-notification',
        url: '/mensagens.html'
    };

    if (event.data) {
        try {
            const json = event.data.json();
            // FCM formato padrão
            if (json.notification) {
                data.title = json.notification.title || data.title;
                data.body  = json.notification.body  || data.body;
            }
            // Formato personalizado ConectaJá
            if (json.title) data.title = json.title;
            if (json.body)  data.body  = json.body;
            if (json.url)   data.url   = json.url;
            if (json.tag)   data.tag   = json.tag;
            if (json.data)  Object.assign(data, json.data);
        } catch (_) {}
    }

    const options = {
        body:    data.body,
        icon:    data.icon,
        badge:   data.badge,
        tag:     data.tag,
        vibrate: [200, 100, 200],
        data:    { url: data.url },
        actions: [
            { action: 'open',    title: 'Ver mensagem' },
            { action: 'dismiss', title: 'Ignorar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================
// CLIQUE EM NOTIFICAÇÃO
// ============================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/mensagens.html';

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Se app já está aberta, foca e navega
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin)) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // Senão abre nova janela
            return clients.openWindow(url);
        })
    );
});

// ============================================
// MENSAGENS DO CLIENTE
// ============================================
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data?.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames =>
                Promise.all(cacheNames.map(name => caches.delete(name)))
            )
        );
    }
});
