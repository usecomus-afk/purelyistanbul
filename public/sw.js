// Purely Istanbul PWA Service Worker — Lock-Screen Web Push & Background Live Request Watcher
const CACHE_NAME = 'xenios-v5';
const FIRESTORE_QUERY_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents:runQuery';

const notifiedIds = new Set();
let seedCompleted = false;
let watcherActive = false;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function pollFirestoreRequestsOnce() {
  try {
    const res = await fetch(FIRESTORE_QUERY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'service_requests' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 35,
        },
      }),
    });
    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows)) return;

    const nowMs = Date.now();
    const isFirstSeed = !seedCompleted;
    if (isFirstSeed) seedCompleted = true;

    for (let i = rows.length - 1; i >= 0; i--) {
      const docObj = rows[i] && rows[i].document;
      const fields = docObj && docObj.fields;
      if (!fields) continue;
      const docName = String(docObj.name || '');
      const fallbackId = docName.split('/').pop() || '';
      const reqId = (fields.id && fields.id.stringValue) || fallbackId;
      if (!reqId || reqId.includes('test') || reqId.includes('demo')) continue;

      const status = (fields.status && fields.status.stringValue) || 'pending';
      const createdAtStr = (fields.createdAt && fields.createdAt.stringValue) || '';
      const createdMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
      const ageMs = createdMs > 0 ? nowMs - createdMs : 999999999;

      if (notifiedIds.has(reqId)) continue;

      if (isFirstSeed) {
        const isVeryRecent = ageMs > -300000 && ageMs < 60000;
        notifiedIds.add(reqId);
        if (isVeryRecent && status === 'pending') {
          await showRequestNotification(reqId, fields);
        }
      } else {
        notifiedIds.add(reqId);
        const isActiveWindow = ageMs > -300000 && ageMs < 1800000;
        if (isActiveWindow && status === 'pending') {
          await showRequestNotification(reqId, fields);
        }
      }
    }
  } catch (err) {
    // Ignore transient network errors
  }
}

async function showRequestNotification(reqId, fields) {
  const roomNumber = ((fields.roomNumber && fields.roomNumber.stringValue) || '101').trim();
  const hotelName = (fields.hotelName && fields.hotelName.stringValue) || 'Purely Istanbul';
  const serviceTitle = (fields.serviceTitle && fields.serviceTitle.stringValue) || 'Birim Hizmeti';
  const notes = ((fields.notes && fields.notes.stringValue) || '').replace(/\s+/g, ' ').trim();
  const priority = (fields.priority && fields.priority.stringValue) || 'standart';
  const isUrgent = priority === 'acil';

  const title = isUrgent ? '🚨 Acil Misafir Talebi! 🛎️' : 'Yeni Misafir Talebi! 🛎️';
  const unitPrefix = /^(Daire|Birim|Suite|Oda)/i.test(roomNumber) ? roomNumber : `Daire ${roomNumber}`;
  const body = `${unitPrefix} - ${serviceTitle}${notes ? ` (${notes})` : ''} Siparişi Verildi.`;

  await self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icon.png',
    tag: reqId,
    renotify: true,
    requireInteraction: isUrgent,
    vibrate: isUrgent ? [300, 100, 300, 100, 400] : [200, 100, 200],
    data: {
      url: '/hotel-portal/requests',
      requestId: reqId,
      hotelName,
    },
  });
}

// Push Notification Listener (RFC 8030 Web Push from Server when screen is locked)
self.addEventListener('push', (event) => {
  if (!event.data) {
    event.waitUntil(pollFirestoreRequestsOnce());
    return;
  }

  try {
    const data = event.data.json();
    const reqId = data.requestId || data.tag || `purely-${Date.now()}`;
    if (data.requestId) {
      notifiedIds.add(data.requestId);
    }
    const title = data.title || 'Yeni Misafir Talebi! 🛎️';
    const isUrgent = data.priority === 'acil' || data.urgency === 'HIGH';
    const options = {
      body: data.body || 'Yeni bir misafir talebiniz var.',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icon.png',
      tag: reqId,
      renotify: true,
      requireInteraction: isUrgent,
      vibrate: isUrgent ? [300, 100, 300, 100, 400] : [200, 100, 200],
      data: {
        url: data.url || '/hotel-portal/requests',
        requestId: reqId,
      },
      actions: [
        { action: 'open', title: 'Görüntüle' },
        { action: 'close', title: 'Kapat' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Yeni Misafir Talebi! 🛎️', {
        body: text,
        icon: '/icons/icon-192x192.png',
        badge: '/icon.png',
        vibrate: [200, 100, 200],
        data: { url: '/hotel-portal/requests' },
      })
    );
  }
});

// Client -> Service Worker Message Listener (Deduplication Sync)
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'MARK_NOTIFIED' && msg.requestId) {
    notifiedIds.add(msg.requestId);
    seedCompleted = true;
    return;
  }

  if (msg.type === 'SEED_NOTIFIED_IDS' && Array.isArray(msg.ids)) {
    msg.ids.forEach((id) => {
      if (id) notifiedIds.add(id);
    });
    seedCompleted = true;
    return;
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/hotel-portal/requests';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
