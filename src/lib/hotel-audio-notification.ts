"use client";

import { ServiceRequest } from './types';
import { Capacitor, registerPlugin } from '@capacitor/core';

export type HotelSoundType = 'luxury_bell' | 'dual_melody' | 'urgent_chime' | 'digital_ping';

export interface HotelAudioNotificationPrefs {
  soundEnabled: boolean;
  selectedSound: HotelSoundType;
  volume: number; // 0.0 to 1.0
  visualBannerEnabled: boolean;
  repeatUrgent: boolean;
  systemNotificationEnabled: boolean;
}

interface XeniosNotificationPluginType {
  requestNotificationPermissions(): Promise<{ display: 'granted' | 'denied' }>;
  checkNotificationPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
  scheduleNotification(options: { id?: string; title: string; body: string; subtitle?: string }): Promise<{ success: boolean }>;
}

const XeniosNotifications = registerPlugin<XeniosNotificationPluginType>('XeniosNotifications');

const STORAGE_KEY = 'xenios_hotel_audio_notification_prefs';
const NOTIFIED_IDS_KEY = 'xenios_staff_notified_req_ids_v3';

const DEFAULT_PREFS: HotelAudioNotificationPrefs = {
  soundEnabled: true,
  selectedSound: 'luxury_bell',
  volume: 0.85,
  visualBannerEnabled: true,
  repeatUrgent: false,
  systemNotificationEnabled: true,
};

export function isNativeHostApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return (
    Capacitor.isNativePlatform() ||
    !!w.Capacitor?.isNativePlatform?.() ||
    !!w.webkit?.messageHandlers?.bridge ||
    !!w.webkit?.messageHandlers?.purelyNotify ||
    !!w.__PURELY_NATIVE_VIDEO_SPLASH__ ||
    !!w.__PURELY_NATIVE_VIDEO_SPLASH_V2__ ||
    !!w.__PURELY_NATIVE_VIDEO_SPLASH_V6__
  );
}

export function isStaffManagementRoute(pathname?: string): boolean {
  if (typeof window === 'undefined') return false;
  const p = pathname ?? window.location.pathname ?? '';
  return (
    p.startsWith('/hotel-portal') ||
    p.startsWith('/usepurelydashboard') ||
    p.startsWith('/live-requests') ||
    p.startsWith('/admin') ||
    p.startsWith('/dashboard') ||
    p.startsWith('/pilot')
  );
}

export function isHotelStaffSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem('xenios_hotel_portal_session') === '1' ||
      localStorage.getItem('xenios_master_admin_session') === '1' ||
      localStorage.getItem('xenios_app_role') === 'hotel'
    );
  } catch {
    return false;
  }
}

export function isGuestConciergeRoute(pathname?: string): boolean {
  if (typeof window === 'undefined') return false;
  const p = pathname ?? window.location.pathname ?? '';
  if (p.startsWith('/stay/')) {
    const parts = p.split('/').filter(Boolean); // ['stay', hotelId, roomId]
    const roomPart = parts[2] ? decodeURIComponent(parts[2]).trim().toUpperCase() : '';
    if (roomPart === 'TEST') return false;
    return true;
  }
  if (p === '/stay' || p.startsWith('/guest')) return true;
  const search = window.location.search ?? '';
  if (search.includes('partner_id=') || search.includes('unit_id=') || search.includes('room=')) {
    const params = new URLSearchParams(search);
    const unit = (params.get('unit_id') || params.get('roomId') || params.get('room') || '').trim().toUpperCase();
    if (unit === 'TEST') return false;
    return true;
  }
  return false;
}

/**
 * Returns true inside the Native iOS App (built for accommodation providers),
 * on web management portals (/hotel-portal, /usepurelydashboard, /live-requests),
 * or when a hotel staff session is active and not on a real Guest QR unit URL.
 * Returns false on the QR Guest PWA (/stay/[hotelId]/[roomId], /guest)!
 */
export function shouldReceiveStaffRequestAlerts(pathname?: string): boolean {
  if (typeof window === 'undefined') return false;
  if (isNativeHostApp()) return true;
  if (isStaffManagementRoute(pathname)) return true;
  if (isGuestConciergeRoute(pathname)) return false;
  if (isHotelStaffSessionActive()) return true;
  return false;
}

/**
 * The in-page dark popup banner ("YENİ MİSAFİR TALEBİ ... Talebi İncele ->")
 * appears on staff management screens and inside the Native Host App / staff preview,
 * NEVER on a guest's QR unit screen (/stay/[hotelId]/[roomId]).
 */
export function shouldShowInPageStaffBanner(pathname?: string): boolean {
  return shouldReceiveStaffRequestAlerts(pathname);
}

class HotelAudioNotificationService {
  private audioCtx: AudioContext | null = null;
  private notifiedRequestIds: Set<string> = new Set();
  private lifecycleBound = false;
  private userAudioUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindForegroundAudioLifecycle();
    }
  }

  /**
   * Explicitly clear navigator.mediaSession so notification chimes or splash media
   * NEVER register as system media playback or trigger the iOS lock-screen "Now Playing" widget.
   */
  public clearMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'stop',
        'seekbackward',
        'seekforward',
        'previoustrack',
        'nexttrack',
      ];
      for (const action of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    } catch {}
  }

  private bindForegroundAudioLifecycle() {
    if (this.lifecycleBound || typeof window === 'undefined') return;
    this.lifecycleBound = true;
    this.clearMediaSession();

    const unlockOnGesture = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      this.userAudioUnlocked = true;
      this.clearMediaSession();
    };

    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('touchend', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });
    window.addEventListener('click', unlockOnGesture, { passive: true });

    const suspendAudioOnBackground = () => {
      this.clearMediaSession();
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend().catch(() => {});
      }
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          this.syncNotifiedFromStorage();
          navigator.serviceWorker.controller.postMessage({
            type: 'SEED_NOTIFIED_IDS',
            ids: Array.from(this.notifiedRequestIds).slice(-200),
          });
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        suspendAudioOnBackground();
      } else {
        this.clearMediaSession();
      }
    });
    window.addEventListener('pagehide', suspendAudioOnBackground);
  }

  private syncNotifiedFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const rawLocal = localStorage.getItem(NOTIFIED_IDS_KEY);
      if (rawLocal) {
        const arr: string[] = JSON.parse(rawLocal);
        if (Array.isArray(arr)) arr.forEach((id) => this.notifiedRequestIds.add(id));
      }
      const rawSession = sessionStorage.getItem(NOTIFIED_IDS_KEY);
      if (rawSession) {
        const arr: string[] = JSON.parse(rawSession);
        if (Array.isArray(arr)) arr.forEach((id) => this.notifiedRequestIds.add(id));
      }
    } catch {}
  }

  public hasNotified(requestId?: string): boolean {
    if (!requestId) return false;
    if (this.notifiedRequestIds.has(requestId)) return true;
    this.syncNotifiedFromStorage();
    return this.notifiedRequestIds.has(requestId);
  }

  public markNotified(requestId?: string) {
    if (!requestId) return;
    this.syncNotifiedFromStorage();
    this.notifiedRequestIds.add(requestId);
    if (typeof window !== 'undefined') {
      try {
        const arr = Array.from(this.notifiedRequestIds).slice(-300);
        const serialized = JSON.stringify(arr);
        localStorage.setItem(NOTIFIED_IDS_KEY, serialized);
        sessionStorage.setItem(NOTIFIED_IDS_KEY, serialized);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'MARK_NOTIFIED',
            requestId,
          });
        }
      } catch {}
    }
  }

  public isNotifiedStorageInitialized(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(NOTIFIED_IDS_KEY) !== null;
    } catch {
      return false;
    }
  }

  public ensureNotifiedStorageInitialized() {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(NOTIFIED_IDS_KEY) === null) {
        const arr = Array.from(this.notifiedRequestIds).slice(-300);
        localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(arr));
      }
    } catch {}
  }

  /**
   * Replaces legacy background audio keep-alive with clean foreground lifecycle binding
   * and MediaSession cleanup. Background/locked alerts are delivered strictly via Native Push (APNs/FCM/WebPush).
   */
  public startNativeWebViewKeepAlive() {
    if (typeof window === 'undefined') return;
    this.bindForegroundAudioLifecycle();
    this.clearMediaSession();
  }

  public getPreferences(): HotelAudioNotificationPrefs {
    if (typeof window === 'undefined') return DEFAULT_PREFS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return DEFAULT_PREFS;
  }

  public savePreferences(prefs: Partial<HotelAudioNotificationPrefs>) {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xenios_hotel_audio_prefs_updated', { detail: updated }));
    } catch (e) {}
  }

  /**
   * Request iOS Native System Notification Permission or Web Push Subscription
   */
  public async requestSystemNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const w = window as any;
    if (w.webkit?.messageHandlers?.purelyNotify?.postMessage) {
      try {
        w.webkit.messageHandlers.purelyNotify.postMessage({ action: 'requestPermissions' });
      } catch {}
    }

    // 1. Native iOS via Custom Native Bridge
    if (isNativeHostApp()) {
      try {
        const res = await XeniosNotifications.requestNotificationPermissions();
        return res.display === 'granted';
      } catch {
        return true;
      }
    }

    // 2. Web Browser & PWA Fallback + Web Push (VAPID) Subscription
    if ('Notification' in window) {
      try {
        const permission =
          Notification.permission === 'granted'
            ? 'granted'
            : await Notification.requestPermission();
        if (permission === 'granted') {
          import('./pwa-notifications')
            .then(({ PwaNotificationManager }) => {
              PwaNotificationManager.subscribeToWebPush({ role: 'staff' }).catch(() => {});
            })
            .catch(() => {});
          return true;
        }
      } catch (err) {
        console.warn('Web notification request error:', err);
      }
    }

    return false;
  }

  /**
   * Check if notification permission is currently granted
   */
  public async checkPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
    if (typeof window === 'undefined') return 'prompt';

    if (isNativeHostApp()) {
      try {
        const status = await XeniosNotifications.checkNotificationPermissions();
        return status.display;
      } catch {
        return 'granted';
      }
    }

    if ('Notification' in window) {
      return Notification.permission as any;
    }

    return 'prompt';
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    if (document.visibilityState !== 'visible' || !this.userAudioUnlocked) return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      this.clearMediaSession();
      return this.audioCtx;
    } catch (e) {
      console.warn('AudioContext init warning:', e);
      return null;
    }
  }

  /**
   * Synthesize and play authentic luxury hotel desk bell / concierge chime.
   * Strictly executes ONLY when the app is actively in the FOREGROUND (visibilityState === 'visible')
   * and after a prior user interaction has unlocked the Web Audio context.
   */
  public async play(soundType?: HotelSoundType, customVolume?: number): Promise<void> {
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
      // Never touch WebAudio / HTMLAudio while backgrounded or locked so iOS never shows "Now Playing"
      return;
    }
    if (!this.userAudioUnlocked) {
      return;
    }

    this.clearMediaSession();

    const prefs = this.getPreferences();
    if (!prefs.soundEnabled && customVolume === undefined) return;

    const sound = soundType || prefs.selectedSound || 'luxury_bell';
    const volume = customVolume !== undefined ? customVolume : prefs.volume;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    try {
      if (sound === 'luxury_bell') {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.7, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        masterGain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1175, now);
        osc1.connect(masterGain);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, now);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.6, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        const osc3 = ctx.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(2350, now);
        const gain3 = ctx.createGain();
        gain3.gain.setValueAtTime(0.3, now);
        gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc3.connect(gain3);
        gain3.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + 1.85);
        osc2.stop(now + 1.85);
        osc3.stop(now + 1.85);
      } else if (sound === 'dual_melody') {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.7, now);
        masterGain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(784, now);
        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0.8, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.55);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046, now + 0.22);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.9, now + 0.22);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + 0.22);
        osc2.stop(now + 1.55);
      } else if (sound === 'urgent_chime') {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.8, now);
        masterGain.connect(ctx.destination);

        const notes = [880, 1046, 1318];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.16;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.85, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.65);
        });
      } else {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume * 0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
      }
      this.clearMediaSession();
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Dispatch a notification across Native WKWebView bridge, Capacitor Plugin, ServiceWorker, or Web Notification API
   */
  public async scheduleSystemOrNativeNotification(opts: {
    id?: string;
    title: string;
    subtitle?: string;
    body: string;
    url?: string;
  }): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    let delivered = false;
    const w = window as any;

    // 1. Direct WKScriptMessageHandler (works in WKWebView without Capacitor plugin registration)
    if (w.webkit?.messageHandlers?.purelyNotify?.postMessage) {
      try {
        w.webkit.messageHandlers.purelyNotify.postMessage({
          action: 'scheduleNotification',
          id: opts.id || String(Date.now()),
          title: opts.title,
          subtitle: opts.subtitle || 'Purely Istanbul',
          body: opts.body,
        });
        delivered = true;
      } catch {}
    }

    // 2. Capacitor Plugin bridge
    if (isNativeHostApp()) {
      try {
        await XeniosNotifications.scheduleNotification({
          id: opts.id,
          title: opts.title,
          subtitle: opts.subtitle,
          body: opts.body,
        });
        delivered = true;
      } catch {
        try {
          if (w.Capacitor?.Plugins?.XeniosNotifications?.scheduleNotification) {
            await w.Capacitor.Plugins.XeniosNotifications.scheduleNotification({
              id: opts.id,
              title: opts.title,
              subtitle: opts.subtitle,
              body: opts.body,
            });
            delivered = true;
          }
        } catch {}
      }
    }

    // 3. Service Worker & Web Notification API (for iOS/Android Home Screen PWA & Desktop/Mobile Web)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await Promise.race([
            navigator.serviceWorker.getRegistration(),
            new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1200)),
          ]);
          if (reg && typeof reg.showNotification === 'function') {
            await reg.showNotification(opts.title, {
              body: opts.body,
              icon: '/icons/icon-192x192.png',
              badge: '/icon.png',
              tag: opts.id || `purely-${Date.now()}`,
              renotify: true,
              vibrate: [200, 100, 200],
              data: { url: opts.url || '/hotel-portal/requests' },
            } as any);
            delivered = true;
          }
        }
      } catch {}

      if (!delivered) {
        try {
          new Notification(opts.title, {
            body: opts.body,
            icon: '/icons/icon-192x192.png',
            tag: opts.id || `purely-${Date.now()}`,
          });
          delivered = true;
        } catch {}
      }
    }

    return delivered;
  }

  /**
   * Broadcast and trigger on-screen live request alert and native iOS / PWA notification
   */
  public async triggerGuestRequestAlert(req: ServiceRequest) {
    if (typeof window === 'undefined' || !req) return;
    if (!shouldReceiveStaffRequestAlerts()) return;
    if (req.id && this.hasNotified(req.id)) return;
    if (req.id) this.markNotified(req.id);

    const isUrgent = req.priority === 'acil';
    const prefs = this.getPreferences();
    const showStaffBanner = shouldShowInPageStaffBanner();
    const isForeground = typeof document !== 'undefined' && document.visibilityState === 'visible';

    // 1. Play WebAudio chime ONLY when actively in the foreground AND after user interaction unlocked audio
    if (isForeground && this.userAudioUnlocked && prefs.soundEnabled && (showStaffBanner || isNativeHostApp())) {
      const soundType = isUrgent ? 'urgent_chime' : prefs.selectedSound;
      this.play(soundType);
    }

    // 2. Dispatch event for on-screen live banner / modal
    if (showStaffBanner || isNativeHostApp()) {
      window.dispatchEvent(new CustomEvent('xenios_hotel_live_request_popup', { detail: req }));
    }

    // 3. Trigger Native iOS / PWA System Notification Banner
    if (prefs.systemNotificationEnabled !== false) {
      const title = isUrgent
        ? `🚨 Acil Misafir Talebi! 🛎️`
        : `Yeni Misafir Talebi! 🛎️`;
      const cleanNotes = req.notes ? req.notes.replace(/\s+/g, ' ').trim() : '';
      const unitLabel = String(req.roomNumber || '101').trim();
      const body = `${unitLabel.match(/^(Birim|Daire|Suite)/i) ? unitLabel : `Birim ${unitLabel}`} - ${req.serviceTitle}${cleanNotes ? ` (${cleanNotes})` : ''} Siparişi Verildi.`;
      const subtitle = req.hotelName || 'Purely Istanbul';

      await this.scheduleSystemOrNativeNotification({
        id: req.id,
        title,
        subtitle,
        body,
        url: '/hotel-portal/requests',
      });
    }
  }
}

export const HotelAudioNotification = new HotelAudioNotificationService();
