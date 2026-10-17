"use client";

import { useState, useEffect } from 'react';
import { PwaNotificationManager, PwaNotificationPrefs } from '@/lib/pwa-notifications';
import { 
  BellRing, 
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
  const [, setIsSupported] = useState(true);

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
    }
  };

  const handleToggle = (key: keyof PwaNotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    PwaNotificationManager.savePreferences(updated);
    toast.success("Bildirim tercihleriniz güncellendi.");
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="luxury-service-card max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 text-[#141414] font-luxury-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D8CBB8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F4] border border-[#C4B8A4] flex items-center justify-center text-[#8E7252] shadow-2xs">
              <BellRing className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-luxury-serif text-base font-bold uppercase tracking-[0.04em] text-[#141414]">Bildirim Ayarları</h3>
              <p className="text-[11px] text-[#5C4938]">Oda talepleri, bilet onayları & VIP duyurular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F4] text-[#141414] hover:bg-[#EFE8DA] border border-[#C4B8A4] flex items-center justify-center text-xs font-bold cursor-pointer transition"
          >
            <X className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Permission Status Box */}
        <div className="p-4 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#141414]">Tarayıcı & Cihaz İzni:</span>
            {permission === 'granted' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[#7D5E2A] font-bold text-[10px] flex items-center gap-1 border border-[#C4B8A4]">
                <CheckCircle2 className="w-3 h-3 text-[#8E7252]" /> İzin Verildi
              </span>
            ) : permission === 'denied' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-[#141414] font-bold text-[10px] border border-[#C4B8A4]">
                Engellendi
              </span>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold text-[11px] rounded-xl shadow-xs cursor-pointer transition"
              >
                İzin İste
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#3D352E] leading-relaxed">
            {permission === 'granted'
              ? 'purelyİstanbul bildirimleri aktif. Oda içi hizmet taleplerinizde ve rezervasyonlarınızda anında bildirim alacaksınız.'
              : 'Mobil veya masaüstü ekranınız kilitliyken bile anlık durum güncellemelerini almak için bildirimlere izin verin.'}
          </p>
        </div>

        {/* Channel Preferences Toggles */}
        <div className="space-y-2.5 text-xs">
          <div className="font-bold text-[#7D5E2A] text-[10px] uppercase tracking-wider">
            Bildirim Kanalları
          </div>

          {/* 1. Oda İçi Talepler */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4]/90 border border-[#C4B8A4]">
            <div className="flex items-center gap-2.5">
              <Hotel className="w-4 h-4 text-[#8E7252]" />
              <div>
                <strong className="text-[#141414] block font-bold text-[11px]">Oda İçi Hizmet Güncellemeleri</strong>
                <span className="text-[10px] text-[#5C4938]">Temizlik, havlu, oda servisi durumu</span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('roomRequests')}
              className={`w-10 h-6 rounded-full transition cursor-pointer p-0.5 ${
                prefs.roomRequests ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A]' : 'bg-[#D8CBB8]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                prefs.roomRequests ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* 2. Tur & Rezervasyonlar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4]/90 border border-[#C4B8A4]">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-[#8E7252]" />
              <div>
                <strong className="text-[#141414] block font-bold text-[11px]">Tur & Bilet Onayları</strong>
                <span className="text-[10px] text-[#5C4938]">Yat turu, restoran ve transfer saatleri</span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('tourBookings')}
              className={`w-10 h-6 rounded-full transition cursor-pointer p-0.5 ${
                prefs.tourBookings ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A]' : 'bg-[#D8CBB8]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                prefs.tourBookings ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* 3. Sesli Uyarı */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4]/90 border border-[#C4B8A4]">
            <div className="flex items-center gap-2.5">
              {prefs.sound ? <Volume2 className="w-4 h-4 text-[#8E7252]" /> : <VolumeX className="w-4 h-4 text-[#9E9589]" />}
              <div>
                <strong className="text-[#141414] block font-bold text-[11px]">Ses & Titreşim Uyarısı</strong>
                <span className="text-[10px] text-[#5C4938]">Bildirim geldiğinde hafif ses ve titreşim</span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sound')}
              className={`w-10 h-6 rounded-full transition cursor-pointer p-0.5 ${
                prefs.sound ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A]' : 'bg-[#D8CBB8]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                prefs.sound ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#D8CBB8] flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-6 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
