import {
  HotelAudioNotification,
  isNativeHostApp,
  shouldReceiveStaffRequestAlerts,
} from './hotel-audio-notification';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from './vapid-keys';

export interface PwaNotificationPrefs {
  enabled: boolean;
  roomRequests: boolean;
  tourBookings: boolean;
  disputes: boolean;
  vipDeals: boolean;
  sound: boolean;
}

const DEFAULT_PREFS: PwaNotificationPrefs = {
  enabled: true,
  roomRequests: true,
  tourBookings: true,
  disputes: true,
  vipDeals: false,
  sound: true,
};

const PREFS_KEY = 'xenios_pwa_notification_prefs';

function detectActiveGuestSession(): { hotelId?: string; roomNumber?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const p = window.location.pathname || '';
    if (p.startsWith('/stay/')) {
      const parts = p.split('/').filter(Boolean);
      return {
        hotelId: parts[1] ? decodeURIComponent(parts[1]) : 'hotel-heritage-1',
        roomNumber: parts[2] ? decodeURIComponent(parts[2]) : '101',
      };
    }
    const raw = localStorage.getItem('xenios_active_hotel_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hotelId: parsed?.hotelId,
        roomNumber: parsed?.roomNumber,
      };
    }
  } catch {}
  return {};
}

export const PwaNotificationManager = {
  getPreferences(): PwaNotificationPrefs {
    if (typeof window === 'undefined') return DEFAULT_PREFS;
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_PREFS;
  },

  savePreferences(prefs: PwaNotificationPrefs) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      window.dispatchEvent(new Event('xenios_pwa_prefs_updated'));
    } catch (e) {}
  },

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    if (isNativeHostApp()) return true;
    return 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (typeof window === 'undefined') return 'default';
    if (isNativeHostApp()) return 'granted';
    if (!('Notification' in window)) return 'default';
    return Notification.permission;
  },

  async requestPermission(roleOverride?: 'guest' | 'staff'): Promise<NotificationPermission> {
    if (typeof window === 'undefined') return 'denied';
    if (isNativeHostApp()) {
      const ok = await HotelAudioNotification.requestSystemNotificationPermission();
      const current = this.getPreferences();
      this.savePreferences({ ...current, enabled: true });
      return ok ? 'granted' : 'granted';
    }
    if (!('Notification' in window)) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const current = this.getPreferences();
        this.savePreferences({ ...current, enabled: true });
        await this.subscribeToWebPush({ role: roleOverride });
      }
      return perm;
    } catch (e) {
      return 'denied';
    }
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      if ('Notification' in window && Notification.permission === 'granted') {
        this.subscribeToWebPush().catch(() => {});
      }
      return reg;
    } catch (e) {
      console.warn('Service worker registration error:', e);
      return null;
    }
  },

  async subscribeToWebPush(opts?: {
    role?: 'guest' | 'staff';
    hotelId?: string;
    roomNumber?: string;
  }): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer,
        });
      }

      const subJson = sub.toJSON();
      if (!subJson?.endpoint || !subJson?.keys?.p256dh || !subJson?.keys?.auth) {
        return false;
      }

      const isStaff = opts?.role ? opts.role === 'staff' : shouldReceiveStaffRequestAlerts();
      const guestSession = detectActiveGuestSession();
      const ua = navigator.userAgent || '';
      const platform: 'ios' | 'android' | 'web' = /iPhone|iPad|iPod/i.test(ua)
        ? 'ios'
        : /Android/i.test(ua)
        ? 'android'
        : 'web';

      await fetch('/api/notifications/register-device', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceToken: subJson.endpoint,
          platform,
          role: isStaff ? 'staff' : 'guest',
          hotelId: opts?.hotelId || guestSession.hotelId || 'hotel-heritage-1',
          roomNumber: isStaff ? undefined : opts?.roomNumber || guestSession.roomNumber || '101',
          webPushSubscription: {
            endpoint: subJson.endpoint,
            expirationTime: subJson.expirationTime ?? null,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
        }),
      });

      return true;
    } catch (err) {
      console.warn('Web Push subscription warning:', err);
      return false;
    }
  },

  async showNotification(title: string, body: string, url: string = '/') {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return;

    if (prefs.sound && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      HotelAudioNotification.play('digital_ping', 0.65).catch(() => {});
    }

    await HotelAudioNotification.scheduleSystemOrNativeNotification({
      title,
      body,
      subtitle: 'Purely Istanbul',
      url,
    });
  },

  async testNotification() {
    await this.showNotification(
      '🛎️ purelyİstanbul Bildirim Testi',
      'Bildirimleriniz başarıyla aktif edildi! Birim talepleriniz ve rezervasyon güncellemeleri ekranınız kilitliyken bile anında iletilecektir.',
      '/hotel-portal/requests'
    );
  },

  setupGlobalNotificationListeners() {
    if (typeof window === 'undefined') return;

    // Listen to new bookings
    window.addEventListener('xenios_booking_created', ((e: CustomEvent) => {
      const detail = e.detail;
      this.showNotification(
        '🎟️ Rezervasyonunuz Onaylandı',
        detail?.title ? `"${detail.title}" rezervasyonunuz başarıyla tamamlandı.` : 'Rezervasyonunuz kaydedildi.',
        '/bookings'
      );
    }) as EventListener);

    // Listen to broadcast announcements from Pilot Deck
    window.addEventListener('xenios_broadcast_notification', ((e: CustomEvent) => {
      const detail = e.detail;
      this.showNotification(
        detail?.title || '📢 Xenios Canlı Sistem Bildirimi',
        detail?.body || 'Sistem ve operasyon güncellemesi yayınlandı.',
        detail?.url || '/'
      );
    }) as EventListener);
  },
};
