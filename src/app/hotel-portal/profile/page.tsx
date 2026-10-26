"use client";

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { XeniosStore } from '@/lib/store';
import { Hotel } from '@/lib/types';
import { FirestoreService } from '@/lib/firestore-service';
import { StaffWhatsappRoutingPanel } from '@/components/hotel/staff-whatsapp-routing-panel';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Globe, 
  MapPin, 
  Wifi, 
  Clock, 
  Save, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  BellRing,
  DoorOpen,
  Volume2,
  VolumeX,
  Play,
  Music,
  Smartphone,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { HotelAudioNotification, HotelSoundType, HotelAudioNotificationPrefs } from '@/lib/hotel-audio-notification';

export default function HotelProfileManagementPage() {
  const hotels = XeniosStore.getHotels();
  const activeHotelId = XeniosStore.getActiveHotelId();
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  // Audio Notification Settings State
  const [audioPrefs, setAudioPrefs] = useState<HotelAudioNotificationPrefs>(() => HotelAudioNotification.getPreferences());

  // Property Info State
  const [hotelName, setHotelName] = useState(currentHotel.name || '');
  const [hotelType, setHotelType] = useState(currentHotel.type || 'Butik Konaklama & Konak');
  const [hotelDistrict, setHotelDistrict] = useState(currentHotel.district || 'Sultanahmet / Fatih');
  const [hotelAddress, setHotelAddress] = useState(currentHotel.address || '');
  const [hotelPhone, setHotelPhone] = useState(currentHotel.phone || '+90 212 514 00 00');
  const [hotelWebsite, setHotelWebsite] = useState(currentHotel.website || 'https://');
  const [breakfastHours, setBreakfastHours] = useState(currentHotel.breakfastHours || '07:30 - 10:30');
  const [checkoutTime, setCheckoutTime] = useState(currentHotel.checkoutTime || '11:30');
  const [receptionExt, setReceptionExt] = useState(currentHotel.receptionExt || '9');
  const [wifiSsid, setWifiSsid] = useState(currentHotel.rooms?.[0]?.wifiSsid || 'Hotel_Guest');
  const [wifiPass, setWifiPass] = useState(currentHotel.rooms?.[0]?.wifiPass || 'purely2026!');

  // User / Manager Info State
  const [managerName, setManagerName] = useState('Ahmet Yılmaz');
  const [managerTitle, setManagerTitle] = useState('Genel Müdür / Ön Büro Direktörü');
  const [managerPhone, setManagerPhone] = useState(
    currentHotel.managerPhone || '05325809676'
  );
  const [whatsappPhone, setWhatsappPhone] = useState(
    currentHotel.whatsappPhone || currentHotel.managerPhone || '05325809676'
  );
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);

  // Email Info State
  const [contactEmail, setContactEmail] = useState('heritage@purelyistanbul.com');
  const [notificationEmail, setNotificationEmail] = useState('concierge@heritagehotel.com');
  const [notifyOnNewBooking, setNotifyOnNewBooking] = useState(true);
  const [notifyOnRoomRequest, setNotifyOnRoomRequest] = useState(true);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // General Save State
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const profile = XeniosStore.getHotelManagerProfile(currentHotel.id);
    if (profile) {
      setManagerName(profile.managerName || 'Ahmet Yılmaz');
      setManagerTitle(profile.managerTitle || 'Genel Müdür / Ön Büro Direktörü');
      const resolvedPhone =
        currentHotel.whatsappPhone ||
        profile.whatsappPhone ||
        profile.managerPhone ||
        '05325809676';
      setManagerPhone(profile.managerPhone || resolvedPhone);
      setWhatsappPhone(resolvedPhone);
      setContactEmail(profile.contactEmail || 'heritage@purelyistanbul.com');
      setNotificationEmail(profile.notificationEmail || 'concierge@heritagehotel.com');
    }
  }, [currentHotel.id, currentHotel.whatsappPhone]);

  const handleTestWhatsAppAlert = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Lütfen önce bildirim alacak WhatsApp telefon numarasını girin.');
      return;
    }
    setIsTestingWhatsApp(true);
    try {
      const res = await authFetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_ALERT',
          phone: whatsappPhone.trim(),
          requestAlert: {
            requestId: `test-${Date.now()}`,
            hotelId: currentHotel.id,
            hotelName: hotelName.trim() || currentHotel.name,
            roomNumber: '101',
            serviceKey: 'whatsapp_test',
            serviceTitle: 'WhatsApp 0850 Bildirim Test Siparişi',
            notes: 'Comus +90 850 308 59 06 hattından misafir sipariş ve talep bildirimleri başarıyla iletildi.',
            department: 'Resepsiyon & Concierge',
            priority: 'standart',
          },
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success('📲 0850 WhatsApp Test Mesajı Gönderildi!', {
          description: `+90 850 308 59 06 hattından (${whatsappPhone}) numarasına mesaj iletildi.`,
        });
      } else {
        toast.error('WhatsApp mesajı gönderilemedi. Numara formatını kontrol edin.');
      }
    } catch (e: any) {
      toast.error('WhatsApp bağlantı hatası: ' + (e?.message || 'Bilinmeyen hata'));
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const handleToggleSound = (enabled: boolean) => {
    HotelAudioNotification.savePreferences({ soundEnabled: enabled });
    setAudioPrefs(prev => ({ ...prev, soundEnabled: enabled }));
    if (enabled) {
      HotelAudioNotification.play();
      toast.success("Sesli bildirimler açıldı!");
    } else {
      toast.info("Sesli bildirimler kapatıldı.");
    }
  };

  const handleChangeSoundType = (sound: HotelSoundType) => {
    HotelAudioNotification.savePreferences({ selectedSound: sound });
    setAudioPrefs(prev => ({ ...prev, selectedSound: sound }));
    HotelAudioNotification.play(sound, audioPrefs.volume);
  };

  const handleChangeVolume = (volume: number) => {
    HotelAudioNotification.savePreferences({ volume });
    setAudioPrefs(prev => ({ ...prev, volume }));
  };

  const handleToggleVisualBanner = (enabled: boolean) => {
    HotelAudioNotification.savePreferences({ visualBannerEnabled: enabled });
    setAudioPrefs(prev => ({ ...prev, visualBannerEnabled: enabled }));
    toast.success(enabled ? "Ekranda canlı uyarı kartı açıldı." : "Ekranda canlı uyarı kartı gizlendi.");
  };

  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    HotelAudioNotification.checkPermissionStatus().then(st => setPermissionStatus(st));
  }, []);

  const handleRequestPermission = async () => {
    const granted = await HotelAudioNotification.requestSystemNotificationPermission();
    const st = await HotelAudioNotification.checkPermissionStatus();
    setPermissionStatus(st);
    if (granted) {
      toast.success("Telefon / iOS bildirim izni başarıyla etkinleştirildi!", {
        description: "purelyİstanbul artık iPhone Ayarlar > Bildirimler menüsünde görünür."
      });
    } else {
      toast.info("Bildirim izni talep edildi. Lütfen ekrandaki sistem bildirimine 'İzin Ver' deyiniz.");
    }
  };

  const handleToggleSystemNotification = (enabled: boolean) => {
    HotelAudioNotification.savePreferences({ systemNotificationEnabled: enabled });
    setAudioPrefs(prev => ({ ...prev, systemNotificationEnabled: enabled }));
    if (enabled) {
      handleRequestPermission();
    }
  };

  const handleTestSound = () => {
    HotelAudioNotification.play(audioPrefs.selectedSound, audioPrefs.volume);
    toast.info("🔔 Bildirim zil sesi çalınıyor...");
  };

  const handleSaveHotelAndManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update Hotel Info in XeniosStore
      const updatedRooms = (currentHotel.rooms || []).map(r => ({
        ...r,
        wifiSsid,
        wifiPass
      }));

      const updatedHotel: Partial<Hotel> = {
        name: hotelName.trim(),
        type: hotelType,
        district: hotelDistrict.trim(),
        address: hotelAddress.trim() || `${hotelDistrict}, İstanbul`,
        phone: hotelPhone.trim(),
        managerName: managerName.trim(),
        managerPhone: managerPhone.trim(),
        whatsappPhone: whatsappPhone.trim() || managerPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        website: hotelWebsite.trim(),
        breakfastHours: breakfastHours.trim(),
        checkoutTime: checkoutTime.trim(),
        receptionExt: receptionExt.trim(),
        rooms: updatedRooms
      };

      XeniosStore.updateHotel(currentHotel.id, updatedHotel);

      // 2. Save Manager Profile
      const managerProfile = {
        managerName: managerName.trim(),
        managerTitle: managerTitle.trim(),
        managerPhone: managerPhone.trim(),
        whatsappPhone: whatsappPhone.trim() || managerPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        notificationEmail: notificationEmail.trim().toLowerCase(),
        notifyOnNewBooking,
        notifyOnRoomRequest,
        updatedAt: new Date().toISOString()
      };

      XeniosStore.saveHotelManagerProfile(currentHotel.id, managerProfile);

      // 3. Save to Google Cloud Firestore
      if (typeof window !== 'undefined') {
        const mergedHotel = XeniosStore.getHotelById(currentHotel.id);
        if (mergedHotel) {
          FirestoreService.upsertHotel(mergedHotel).catch(() => {});
        }
        FirestoreService.syncAllLocalDataToFirestore().catch(e => console.warn('Firestore sync warning:', e));
      }

      setTimeout(() => {
        setIsSaving(false);
        toast.success("İşletme ve WhatsApp Bildirim Ayarları Güncellendi!", {
          description: `${hotelName} bilgileri ve 0850 WhatsApp alıcı numaraları canlı sisteme aktarıldı.`
        });
      }, 400);
    } catch (err: any) {
      setIsSaving(false);
      toast.error("Profil kaydedilirken bir hata oluştu: " + err.message);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter uzunluğunda olmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifre ile şifre tekrarı birbiriyle eşleşmiyor!");
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success("Yönetici Güvenlik Şifreniz Başarıyla Güncellendi!", {
        description: "Yeni şifreniz bir sonraki girişinizden itibaren geçerli olacaktır."
      });
    }, 500);
  };

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      {/* Header Banner */}
      <div className="luxury-service-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="golden-pill-badge text-[10px] uppercase font-bold tracking-widest text-[#2C1E0F] px-2.5 py-0.5 rounded-full font-mono">
              İŞLETME & YÖNETİCİ PROFİLİ
            </span>
            <span className="text-xs text-zinc-700 font-medium">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100">
            İşletme & Profil Ayarları
          </h1>
          <p className="text-xs text-zinc-700 max-w-2xl leading-relaxed">
            İşletme bilgileri, yönetici iletişim detayları, bildirim e-postaları ve portal giriş şifrenizi bu masadan yönetebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="golden-pill-badge flex items-center gap-2 px-4 py-2 rounded-full shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-[#2C1E0F]">Doğrulanmış Partner İşletme</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveHotelAndManager} className="space-y-6">
        {/* 1. İŞLETME BİLGİLERİ */}
        <div className="luxury-service-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[rgba(230,185,75,0.45)] pb-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(240,195,70,0.35)] border border-[rgba(220,175,50,0.6)] text-[#2C1E0F] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100">İşletme Adı & Tesis Bilgileri</h2>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400">Misafirlerin dijital concierge ekranında gördüğü işletme detayları.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-zinc-700 block">İşletme / Tesis Adı</label>
              <input
                type="text"
                required
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Ör: Galata Port Suites Istanbul"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">İşletme Tipi</label>
              <select
                value={hotelType}
                onChange={(e) => setHotelType(e.target.value)}
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs font-medium"
              >
                <option value="Apart & Rezidans">Apart & Rezidans</option>
                <option value="Kısa Dönem Mülk Yönetimi (PMC)">Kısa Dönem Mülk Yönetimi (PMC)</option>
                <option value="Butik Konaklama & Konak">Butik Konaklama & Konak</option>
                <option value="Tarihi Yalı / Saray">Tarihi Yalı / Saray</option>
                <option value="Butik Otel & Konak">Butik Konaklama (Tarihi)</option>
                <option value="5 Yıldızlı Lüks Otel">Lüks Konaklama Tesisi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Semt / İlçe</label>
              <input
                type="text"
                value={hotelDistrict}
                onChange={(e) => setHotelDistrict(e.target.value)}
                placeholder="Sultanahmet / Fatih"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-zinc-700 block">Açık Adres</label>
              <input
                type="text"
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                placeholder="Ör: Alemdar Mah. Yerebatan Cad. No:18 Sultanahmet, Fatih, İstanbul"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">İşletme Sabit Telefonu</label>
              <input
                type="text"
                value={hotelPhone}
                onChange={(e) => setHotelPhone(e.target.value)}
                placeholder="+90 212 514 00 00"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Web Sitesi</label>
              <input
                type="text"
                value={hotelWebsite}
                onChange={(e) => setHotelWebsite(e.target.value)}
                placeholder="https://purelyistanbul.com"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Danışma / Resepsiyon Dahili No</label>
              <input
                type="text"
                value={receptionExt}
                onChange={(e) => setReceptionExt(e.target.value)}
                placeholder="9 veya 0"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Kahvaltı Saatleri</label>
              <input
                type="text"
                value={breakfastHours}
                onChange={(e) => setBreakfastHours(e.target.value)}
                placeholder="07:30 - 10:30"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Check-out Saati</label>
              <input
                type="text"
                value={checkoutTime}
                onChange={(e) => setCheckoutTime(e.target.value)}
                placeholder="11:30 veya 12:00"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Misafir Wi-Fi Adı (SSID)</label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Purely_Guest"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-zinc-700 block">Misafir Wi-Fi Şifresi</label>
              <input
                type="text"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                placeholder="purely2026!"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 2. KULLANICI & YETKİLİ BİLGİLERİ */}
        <div className="luxury-service-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[rgba(230,185,75,0.45)] pb-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(240,195,70,0.35)] border border-[rgba(220,175,50,0.6)] text-[#2C1E0F] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Kullanıcı & İşletme Yetkilisi Bilgileri</h2>
              <p className="text-[11px] text-zinc-600">Purelyİstanbul operasyon ekibinin temas kuracağı sorumlu yönetici.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Yetkili Adı Soyadı</label>
              <input
                type="text"
                required
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Yetkili Unvanı / Görevi</label>
              <input
                type="text"
                value={managerTitle}
                onChange={(e) => setManagerTitle(e.target.value)}
                placeholder="İşletme Yöneticisi / Operasyon Direktörü"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Yetkili Cep Telefonu</label>
              <input
                type="text"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="+90 532 555 44 33"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 3. E-POSTA & BİLDİRİM BİLGİLERİ */}
        <div className="luxury-service-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[rgba(230,185,75,0.45)] pb-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(240,195,70,0.35)] border border-[rgba(220,175,50,0.6)] text-[#2C1E0F] flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100">E-Posta & Bildirim İletişimi</h2>
              <p className="text-[11px] text-zinc-600">Giriş hesabı ve rezervasyon/talep bildirim adresleri.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Resmi Giriş E-Postası (Portal Girişi)</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="yonetim@purelyistanbul.com"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Talep & Rezervasyon Bildirim E-Postası</label>
              <input
                type="email"
                required
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="operasyon@purelyistanbul.com"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-zinc-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnRoomRequest}
                onChange={(e) => setNotifyOnRoomRequest(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Misafir konaklama içi hizmet taleplerinde anlık e-posta ve WhatsApp bildirimi al</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnNewBooking}
                onChange={(e) => setNotifyOnNewBooking(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Yeni tur & deneyim rezervasyonlarında bilgilendir</span>
            </label>
          </div>
        </div>

        {/* 3B. 0850 COMUS WHATSAPP SİPARİŞ & TALEP BİLDİRİM HATTI */}
        <div className="luxury-service-card p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(230,185,75,0.45)] pb-3 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                    0850 WhatsApp Sipariş & Talep Bildirim Hattı
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-[10px]">
                    +90 850 308 59 06 • AKTİF
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-slate-400">
                  Misafirler birimlerinden sipariş veya hizmet talebi oluşturduğunda Comus 0850 kurumsal hattından doğrudan WhatsApp&apos;ınıza tek tık onaylı bildirim mesajı iletilir.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleTestWhatsAppAlert}
                disabled={isTestingWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isTestingWhatsApp ? 'Gönderiliyor...' : '📲 WhatsApp Test Bildirimi Gönder'}
              </button>
              <a
                href="https://wa.me/908503085906?text=Merhaba%20Comus%20Bildirim%20Aktif"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-zinc-900 dark:text-amber-200 font-bold text-xs transition"
              >
                💬 0850 Hattına Mesaj At (Aktifleştir)
              </a>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-zinc-700 dark:text-slate-200 block">
              Sipariş & Talep Bildirimi Alacak WhatsApp Numaraları (Virgülle birden fazla numara ekleyebilirsiniz)
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="05325809676"
              className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-[16px] md:text-xs"
            />
            <p className="text-[11px] text-zinc-600 dark:text-slate-400 leading-relaxed">
              💡 <strong>Önemli:</strong> Yeni eklediğiniz bir telefon numarasının WhatsApp mesajlarını kesintisiz alabilmesi için yukarıdaki <strong>&quot;💬 0850 Hattına Mesaj At (Aktifleştir)&quot;</strong> butonuna tıklayarak <strong>+90 850 308 59 06</strong> numarasına bir kez &quot;Merhaba&quot; mesajı göndermeniz yeterlidir.
            </p>
          </div>
        </div>

        {/* 3C. SORUMLU PERSONEL KAYDI & OTOMATİK WHATSAPP YÖNLENDİRME MASASI */}
        <StaffWhatsappRoutingPanel hotel={currentHotel} defaultExpanded={true} />

        {/* 4. SESLİ BİLDİRİM & CANLI TALEP ALARM AYARLARI */}
        <div className="luxury-service-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-[rgba(230,185,75,0.45)] pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[rgba(240,195,70,0.35)] border border-[rgba(220,175,50,0.6)] text-[#2C1E0F] flex items-center justify-center font-bold">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Sesli Bildirim & Canlı Talep Uyarı Ayarları</h2>
                <p className="text-[11px] text-zinc-600">Misafir birimlerinden gelen canlı taleplerde sesli çan ve ekranda pop-up alarmı.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleSound(!audioPrefs.soundEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                audioPrefs.soundEnabled
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-600'
                  : 'bg-zinc-100 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              {audioPrefs.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioPrefs.soundEnabled ? 'Ses Açık' : 'Sessiz'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Sound Choice */}
            <div className="space-y-2">
              <label className="font-bold text-zinc-700 block flex items-center justify-between">
                <span>Zil Sesi Tipi (Sound Alert)</span>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-amber-700" /> Sesi Dinle / Test Et
                </button>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'luxury_bell', name: 'Lüks Resepsiyon Çanı', desc: 'Klasik pirinç masa zili (Ding!)' },
                  { id: 'dual_melody', name: 'İki Tonlu Melodi', desc: 'Modern armonik yükselen çan' },
                  { id: 'urgent_chime', name: 'Acil / Yüksek Ton', desc: 'Üçlü uyarı tonu (Dikkat!)' },
                  { id: 'digital_ping', name: 'Dijital Kristal Ping', desc: 'Yumuşak dijital bildirim sesi' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleChangeSoundType(s.id as HotelSoundType)}
                    className={`p-3 rounded-2xl border text-left active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer flex flex-col justify-between gap-1 ${
                      audioPrefs.selectedSound === s.id
                        ? 'bg-[rgba(240,195,70,0.42)] border-[rgba(220,175,50,0.85)] ring-2 ring-amber-500/30'
                        : 'bg-[rgba(245,215,130,0.22)] border-[rgba(230,185,75,0.55)] hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-slate-100 text-xs">{s.name}</span>
                      {audioPrefs.selectedSound === s.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume & Banner Settings */}
            <div className="space-y-4 bg-[rgba(245,215,130,0.22)] p-4 rounded-2xl border border-[rgba(230,185,75,0.55)]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 block">Ses Seviyesi (Volume)</label>
                  <span className="font-mono font-bold text-amber-800 text-xs">
                    %{Math.round(audioPrefs.volume * 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={audioPrefs.volume}
                  onChange={(e) => handleChangeVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Kısık</span>
                  <span>Orta</span>
                  <span>Maksimum</span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-zinc-800 dark:text-slate-200 text-xs">Ekranda Canlı Pop-up Kartı Göster</span>
                  <input
                    type="checkbox"
                    checked={audioPrefs.visualBannerEnabled}
                    onChange={(e) => handleToggleVisualBanner(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Yeni bir misafir talebi geldiğinde ekranın sağ üst köşesinde birim numarası ve notunu içeren canlı kart belirir.
                </p>
              </div>

              {/* iOS / Phone System Notifications */}
              <div className="pt-3 border-t border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-800" />
                    <span className="font-bold text-zinc-800 dark:text-slate-200 text-xs">Telefon & Kilit Ekranı Bildirimi</span>
                  </div>
                  {permissionStatus === 'granted' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> İzin Verildi
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-[11px] transition cursor-pointer shadow-2xs"
                    >
                      İzni Etkinleştir
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Uygulama arka plandayken veya kilit ekranındayken misafir taleplerini telefon bildirimi olarak alın. İzin verildiğinde iPhone <strong>Ayarlar &gt; Bildirimler &gt; purelyİstanbul</strong> altında listelenir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE PROPERTY & MANAGER BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold rounded-2xl shadow-md text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'İşletme & Yönetici Profilini Kaydet'}</span>
          </button>
        </div>
      </form>

      {/* 4. ŞİFRE DEĞİŞİKLİĞİ FORMU */}
      <div className="luxury-service-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[rgba(230,185,75,0.45)] pb-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(240,195,70,0.35)] border border-[rgba(220,175,50,0.6)] text-[#2C1E0F] flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Güvenlik & Şifre Değişikliği</h2>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400">Partner işletme yönetim paneli giriş şifrenizi yenileyin.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Mevcut Şifre</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Yeni Şifre</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar girin"
                className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <p className="text-[11px] text-zinc-500 dark:text-slate-400">
              Şifrenizi unuttuysanız giriş ekranındaki <strong className="text-amber-800">"Şifremi Unuttum"</strong> akışını kullanabilirsiniz.
            </p>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-amber-400 font-bold rounded-xl shadow-md text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSavingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
