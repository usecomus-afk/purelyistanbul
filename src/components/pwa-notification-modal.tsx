"use client";

import { useState, useEffect } from 'react';
import { PwaNotificationManager, PwaNotificationPrefs } from '@/lib/pwa-notifications';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Compass, 
  X, 
  Hotel,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export function PwaNotificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<PwaNotificationPrefs>(PwaNotificationManager.getPreferences());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(PwaNotificationManager.isSupported());
    setPermission(PwaNotificationManager.getPermission());
    setPrefs(PwaNotificationManager.getPreferences());
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const result = await PwaNotificationManager.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success("Bildirim izinleri başarıyla verildi!");
      PwaNotificationManager.testNotification();
    } else {
      toast.error("Bildirim izni reddedildi. Tarayıcı ayarlarından izin verebilirsiniz.");
    }
  };

  const handleToggle = (key: keyof PwaNotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    PwaNotificationManager.savePreferences(updated);
    toast.success("Bildirim tercihleriniz güncellendi.");
  };

  const handleSendTest = async () => {
    if (permission !== 'granted') {
      await handleRequestPermission();
      return;
    }
    await PwaNotificationManager.testNotification();
    toast.success("Test bildirimi cihazınıza gönderildi!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-5 animate-in zoom-in-95 text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-800">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-zinc-900">PWA Bildirim Ayarları</h3>
              <p className="text-[11px] text-zinc-500">Oda talepleri, bilet onayları & VIP duyurular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center text-xs font-bold cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Permission Status Box */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800">Tarayıcı & Cihaz İzni:</span>
            {permission === 'granted' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> İzin Verildi
              </span>
            ) : permission === 'denied' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] border border-red-200">
                Engellendi
              </span>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] rounded-xl shadow-xs cursor-pointer transition"
              >
                İzin İste
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            {permission === 'granted'
              ? 'purelyİstanbul PWA bildirimleri aktif. Oda içi hizmet taleplerinizde ve rezervasyonlarınızda anında bildirim alacaksınız.'
              : 'Mobil veya masaüstü ekranınız kilitliyken bile anlık durum güncellemelerini almak için bildirimlere izin verin.'}
          </p>
        </div>

        {/* Channel Preferences Toggles */}
        <div className="space-y-2.5 text-xs">
          <div className="font-bold text-zinc-700 text-[11px] uppercase tracking-wider font-mono">
            Bildirim Kanalları
          </div>

          {/* 1. Oda İçi Talepler */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center gap-2.5">
              <Hotel className="w-4 h-4 text-amber-700" />
              <div>
                <strong className="text-zinc-900 block font-bold text-[11px]">Oda İçi Hizmet Güncellemeleri</strong>
                <span className="text-[10px] text-zinc-500">Temizlik, havlu, kahvaltı kapıda durumu</span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('roomRequests')}
              className={`w-10 h-6 rounded-full transition cursor-pointer p-0.5 ${
                prefs.roomRequests ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                prefs.roomRequests ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* 2. Tur & Rezervasyonlar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-sky-600" />
              <div>
                <strong className="text-zinc-900 block font-bold text-[11px]">Tur & Bilet Onayları</strong>
                <span className="text-[10px] text-zinc-500">Yat turu, restoran ve transfer saatleri</span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('tourBookings')}
              className={`w-10 h-6 rounded-full transition cursor-pointer p-0.5 ${
                prefs.tourBookings ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                prefs.tourBookings ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* 3. Sesli Uyarı */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center gap-2.5">
              {prefs.sound ? <Volume2 className="w-4 h-4 text-zinc-700" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              <div>
                <strong className="text-zinc-900 block font-bold text-[11px]">Ses & Titreşim Uyarısı</strong>
                <span className="text-[10px] text-zinc-500">Bildirim geldiğinde hafif ses ve titreşim</span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sound')}
              className={`w-10 h-6 rounded-full transition cursor-pointer p-0.5 ${
                prefs.sound ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                prefs.sound ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-zinc-100 flex items-center gap-2.5">
          <button
            onClick={handleSendTest}
            className="flex-1 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Test Bildirimi Gönder</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
