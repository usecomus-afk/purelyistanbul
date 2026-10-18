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
  private keepAliveAudioEl: HTMLAudioElement | null = null;
  private keepAliveStarted = false;

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
   * Builds a 1-second 8kHz 16-bit mono WAV with 1-LSB non-zero amplitude
   * so iOS WKWebView / mediaserverd keeps the native app process awake in the background
   * when the hotel manager switches to another app or locks the screen.
   */
  private buildKeepAliveWavDataUri(): string {
    const sampleRate = 8000;
    const numSamples = sampleRate;
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);
    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, i % 2 === 0 ? 1 : -1, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  public startNativeWebViewKeepAlive() {
    if (typeof window === 'undefined' || !shouldReceiveStaffRequestAlerts()) return;

    const activateKeepAlive = () => {
      try {
        if (!this.keepAliveAudioEl) {
          const audio = new Audio(this.buildKeepAliveWavDataUri());
          audio.loop = true;
          audio.volume = 0.01;
          (audio as any).playsInline = true;
          audio.setAttribute('playsinline', 'true');
          this.keepAliveAudioEl = audio;
        }
        if (this.keepAliveAudioEl.paused) {
          this.keepAliveAudioEl.play().catch(() => {});
        }
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch {}
    };

    activateKeepAlive();

    if (!this.keepAliveStarted) {
      this.keepAliveStarted = true;
      window.addEventListener('touchstart', activateKeepAlive, { passive: true });
      window.addEventListener('click', activateKeepAlive, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (shouldReceiveStaffRequestAlerts()) {
          activateKeepAlive();
        }
      });
    }
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
   * Request iOS Native System Notification Permission
   * This registers the app into iPhone Settings -> Notifications!
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
        // Native AppDelegate already requests UNUserNotificationCenter permissions on launch
        return true;
      }
    }

    // 2. Web Browser Fallback
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
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

  private buildChimeWavDataUri(isUrgent: boolean, volume: number = 0.85): string {
    const sampleRate = 16000;
    const durationSec = isUrgent ? 0.75 : 0.65;
    const numSamples = Math.floor(sampleRate * durationSec);
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const amp = Math.max(0.15, Math.min(1.0, volume));
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      if (isUrgent) {
        const freq = t < 0.22 ? 880 : t < 0.44 ? 1046 : 1318;
        const localT = t % 0.22;
        const env = Math.exp(-localT * 9.0);
        sample = Math.sin(2 * Math.PI * freq * t) * env;
      } else {
        const env1 = Math.exp(-t * 4.5);
        const env2 = t >= 0.14 ? Math.exp(-(t - 0.14) * 4.0) : 0;
        sample =
          Math.sin(2 * Math.PI * 1175 * t) * 0.55 * env1 +
          Math.sin(2 * Math.PI * 1760 * t) * 0.45 * env2;
      }
      const pcm = Math.max(-32767, Math.min(32767, Math.floor(sample * amp * 28000)));
      view.setInt16(44 + i * 2, pcm, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 4096;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength)))
      );
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('AudioContext init warning:', e);
      return null;
    }
  }

  /**
   * Synthesize and play authentic luxury hotel desk bell / concierge chime
   */
  public async play(soundType?: HotelSoundType, customVolume?: number): Promise<void> {
    const prefs = this.getPreferences();
    if (!prefs.soundEnabled && customVolume === undefined) return;

    const sound = soundType || prefs.selectedSound || 'luxury_bell';
    const volume = customVolume !== undefined ? customVolume : prefs.volume;

    // Play HTML5 Audio WAV chime so iOS AVAudioSession plays even when WebAudio is suspended
    try {
      const wavUri = this.buildChimeWavDataUri(sound === 'urgent_chime', volume);
      const htmlAudio = new Audio(wavUri);
      htmlAudio.volume = Math.max(0.1, Math.min(1.0, volume));
      (htmlAudio as any).playsInline = true;
      htmlAudio.setAttribute('playsinline', 'true');
      htmlAudio.play().catch(() => {});
    } catch {}

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    try {
      if (sound === 'luxury_bell') {
        // 🛎️ Authentic Dual-tone Brass Concierge Desk Bell (D6 1175Hz + A6 1760Hz with harmonic overtone)
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.7, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        masterGain.connect(ctx.destination);

        // Primary fundamental bell
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1175, now); // D6
        osc1.connect(masterGain);

        // High crystal overtone
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, now); // A6
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.6, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        // Metallic harmonic strike
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
        // 🎶 Two-tone Ascending Concierge Chime (G5 784Hz -> C6 1046Hz)
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.7, now);
        masterGain.connect(ctx.destination);

        // Note 1 (G5)
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

        // Note 2 (C6)
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
        // 🚨 High Priority Urgent Alert (Triple Ping: 880Hz -> 1046Hz -> 1318Hz)
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
        // 💡 Modern Digital Glass Ping (1200Hz soft decay)
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
              icon: '/logo.png',
              badge: '/icon.png',
              tag: opts.id || `purely-${Date.now()}`,
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
            icon: '/icon.png',
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

    // 1. Play sound chime (always on staff routes, or in native app when enabled)
    if (prefs.soundEnabled && (showStaffBanner || isNativeHostApp())) {
      const soundType = isUrgent ? 'urgent_chime' : prefs.selectedSound;
      this.play(soundType);
    }

    // 2. Dispatch event for on-screen live banner / modal
    if (showStaffBanner || isNativeHostApp()) {
      window.dispatchEvent(new CustomEvent('xenios_hotel_live_request_popup', { detail: req }));
    }

    // 3. Trigger Native iOS / PWA System Notification (Banner, Lock Screen, Sound)
    if (prefs.systemNotificationEnabled !== false) {
      const title = isUrgent
        ? `🚨 ACİL TALEP: Birim ${req.roomNumber}`
        : `🛎️ Yeni Sipariş / Talep: Birim ${req.roomNumber}`;
      const cleanNotes = req.notes ? req.notes.replace(/\s+/g, ' ').trim() : '';
      const body = `${req.serviceTitle}${cleanNotes ? ` · ${cleanNotes}` : ''}`;
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

