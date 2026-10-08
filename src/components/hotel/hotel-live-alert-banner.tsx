"use client";

import { useState, useEffect } from 'react';
import { ServiceRequest } from '@/lib/types';
import { HotelAudioNotification, HotelAudioNotificationPrefs } from '@/lib/hotel-audio-notification';
import { XeniosStore } from '@/lib/store';
import { 
  BellRing, 
  Volume2, 
  VolumeX, 
  X, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export function HotelLiveAlertBanner() {
  const [activeAlert, setActiveAlert] = useState<ServiceRequest | null>(null);
  const [prefs, setPrefs] = useState<HotelAudioNotificationPrefs>(() => HotelAudioNotification.getPreferences());

  useEffect(() => {
    const handleUpdatePrefs = () => {
      setPrefs(HotelAudioNotification.getPreferences());
    };
    window.addEventListener('xenios_hotel_audio_prefs_updated', handleUpdatePrefs);

    const handleNewRequest = (e: Event) => {
      const customEvent = e as CustomEvent<ServiceRequest>;
      const req = customEvent.detail;
      if (!req) return;

      const activeHotelId = XeniosStore.getActiveHotelId();
      // If request belongs to current hotel or global
      if (!req.hotelId || req.hotelId === activeHotelId) {
        HotelAudioNotification.triggerGuestRequestAlert(req);
        const currentPrefs = HotelAudioNotification.getPreferences();
        if (currentPrefs.visualBannerEnabled) {
          setActiveAlert(req);
        }
      }
    };

    window.addEventListener('xenios_request_created', handleNewRequest);
    window.addEventListener('xenios_hotel_live_request_popup', handleNewRequest);

    return () => {
      window.removeEventListener('xenios_hotel_audio_prefs_updated', handleUpdatePrefs);
      window.removeEventListener('xenios_request_created', handleNewRequest);
      window.removeEventListener('xenios_hotel_live_request_popup', handleNewRequest);
    };
  }, []);

  const handleDismiss = () => {
    setActiveAlert(null);
  };

  const toggleSound = () => {
    const next = !prefs.soundEnabled;
    HotelAudioNotification.savePreferences({ soundEnabled: next });
    setPrefs(prev => ({ ...prev, soundEnabled: next }));
    if (next) {
      HotelAudioNotification.play();
    }
  };

  if (!activeAlert) return null;

  const isUrgent = activeAlert.priority === 'acil';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[calc(100vw-32px)] sm:w-[420px] animate-in slide-in-from-top-4 duration-300">
      <div className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-xl transition-all ${
        isUrgent 
          ? 'bg-red-950/95 border-red-500 text-white shadow-red-950/50' 
          : 'bg-zinc-900/95 border-amber-500/80 text-white shadow-amber-950/40'
      }`}>
        <div className="flex items-start justify-between gap-3">
          {/* Icon & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isUrgent 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
            }`}>
              {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <BellRing className="w-5 h-5 animate-bounce" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isUrgent ? 'bg-red-800 text-red-100 border border-red-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isUrgent ? 'ACİL ODA TALEBİ' : 'YENİ MİSAFİR TALEBİ'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-0.5">
                Oda {activeAlert.roomNumber} · {activeAlert.serviceTitle}
              </h4>
            </div>
          </div>

          {/* Close & Sound Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleSound}
              title={prefs.soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              {prefs.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500 dark:text-slate-400" />}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Body */}
        {activeAlert.notes && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-200 line-clamp-2">
            {activeAlert.notes}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400 font-medium truncate">
            Departman: <strong className="text-zinc-200">{activeAlert.department || 'Housekeeping'}</strong>
          </span>

          <Link
            href="/hotel-portal/requests"
            onClick={handleDismiss}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isUrgent
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            }`}
          >
            <span>Talebi İncele</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
