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
const NOTIFIED_IDS_KEY = 'xenios_notified_request_ids';

const DEFAULT_PREFS: HotelAudioNotificationPrefs = {
  soundEnabled: true,
  selectedSound: 'luxury_bell',
  volume: 0.85,
  visualBannerEnabled: true,
  repeatUrgent: false,
  systemNotificationEnabled: true,
};

class HotelAudioNotificationService {
  private audioCtx: AudioContext | null = null;
  private notifiedRequestIds: Set<string> = new Set();

  public hasNotified(requestId?: string): boolean {
    if (!requestId) return false;
    if (this.notifiedRequestIds.has(requestId)) return true;
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(NOTIFIED_IDS_KEY);
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          arr.forEach((id) => this.notifiedRequestIds.add(id));
        }
      } catch {}
    }
    return this.notifiedRequestIds.has(requestId);
  }

  public markNotified(requestId?: string) {
    if (!requestId) return;
    this.notifiedRequestIds.add(requestId);
    if (typeof window !== 'undefined') {
      try {
        const arr = Array.from(this.notifiedRequestIds).slice(-200);
        sessionStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(arr));
      } catch {}
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

    // 1. Native iOS via Custom Native Bridge
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await XeniosNotifications.requestNotificationPermissions();
        return res.display === 'granted';
      } catch (err) {
        console.warn('Native notification request error:', err);
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

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await XeniosNotifications.checkNotificationPermissions();
        return status.display;
      } catch (err) {
        return 'prompt';
      }
    }

    if ('Notification' in window) {
      return Notification.permission as any;
    }

    return 'prompt';
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

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const sound = soundType || prefs.selectedSound || 'luxury_bell';
    const volume = customVolume !== undefined ? customVolume : prefs.volume;

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
   * Broadcast and trigger on-screen live request alert and native iOS notification
   */
  public async triggerGuestRequestAlert(req: ServiceRequest) {
    if (typeof window === 'undefined' || !req) return;
    if (req.id && this.hasNotified(req.id)) return;
    if (req.id) this.markNotified(req.id);

    const isUrgent = req.priority === 'acil';
    const prefs = this.getPreferences();

    // 1. Play sound chime
    if (prefs.soundEnabled) {
      const soundType = isUrgent ? 'urgent_chime' : prefs.selectedSound;
      this.play(soundType);
    }

    // 2. Dispatch event for on-screen live banner / modal
    window.dispatchEvent(new CustomEvent('xenios_hotel_live_request_popup', { detail: req }));

    // 3. Trigger Native iOS Local Notification (Banner, Lock Screen, Sound)
    if (prefs.systemNotificationEnabled) {
      try {
        const title = isUrgent
          ? `🚨 ACİL TALEP: Oda ${req.roomNumber}`
          : `🛎️ Yeni Talep: Oda ${req.roomNumber}`;
        const body = `${req.serviceTitle}${req.notes ? ` · ${req.notes.replace(/\s+/g, ' ')}` : ''}`;

        if (Capacitor.isNativePlatform()) {
          await XeniosNotifications.scheduleNotification({
            id: req.id,
            title,
            subtitle: req.hotelName || 'Purely Istanbul',
            body,
          });
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon.png',
          });
        }
      } catch (err) {
        console.warn('System notification trigger warning:', err);
      }
    }
  }
}

export const HotelAudioNotification = new HotelAudioNotificationService();
