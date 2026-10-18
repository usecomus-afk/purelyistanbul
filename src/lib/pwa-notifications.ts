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
  sound: true
};

const PREFS_KEY = 'xenios_pwa_notification_prefs';

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
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const current = this.getPreferences();
        this.savePreferences({ ...current, enabled: true });
        this.registerServiceWorker();
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
      return reg;
    } catch (e) {
      console.warn("Service worker registration error:", e);
      return null;
    }
  },

  async showNotification(title: string, body: string, url: string = '/') {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return;

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/icon.png',
            vibrate: prefs.sound ? [100, 50, 100] : undefined,
            data: { url }
          } as any);
          return;
        }
      }

      // Fallback
      new Notification(title, {
        body,
        icon: '/logo.png'
      });
    } catch (e) {
      console.warn("Notification trigger error:", e);
    }
  },

  async testNotification() {
    await this.showNotification(
      '🛎️ Xenios Istanbul Bildirim Testi',
      'PWA bildirimleriniz başarıyla aktif edildi! Oda talepleriniz ve rezervasyon güncellemeleri anında buraya iletilecektir.',
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
  }
};

