"use client";

import { useState, useEffect } from 'react';
import { PwaNotificationManager, PwaNotificationPrefs } from '@/lib/pwa-notifications';
import { XeniosStore } from '@/lib/store';
import { Language } from '@/lib/types';
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

const PWA_I18N: Record<Language, {
  title: string;
  subtitle: string;
  devicePermission: string;
  granted: string;
  denied: string;
  requestBtn: string;
  grantedDesc: string;
  defaultDesc: string;
  channelsTitle: string;
  roomRequestsTitle: string;
  roomRequestsDesc: string;
  tourBookingsTitle: string;
  tourBookingsDesc: string;
  soundTitle: string;
  soundDesc: string;
  doneBtn: string;
  permSuccessToast: string;
  prefUpdatedToast: string;
}> = {
  tr: {
    title: "Bildirim Ayarları",
    subtitle: "Oda talepleri, bilet onayları & VIP duyurular",
    devicePermission: "Tarayıcı & Cihaz İzni:",
    granted: "İzin Verildi",
    denied: "Engellendi",
    requestBtn: "İzin İste",
    grantedDesc: "purelyİstanbul bildirimleri aktif. Oda içi hizmet taleplerinizde ve rezervasyonlarınızda anında bildirim alacaksınız.",
    defaultDesc: "Mobil veya masaüstü ekranınız kilitliyken bile anlık durum güncellemelerini almak için bildirimlere izin verin.",
    channelsTitle: "Bildirim Kanalları",
    roomRequestsTitle: "Oda İçi Hizmet Güncellemeleri",
    roomRequestsDesc: "Temizlik, havlu, oda servisi durumu",
    tourBookingsTitle: "Tur & Bilet Onayları",
    tourBookingsDesc: "Yat turu, restoran ve transfer saatleri",
    soundTitle: "Ses & Titreşim Uyarısı",
    soundDesc: "Bildirim geldiğinde hafif ses ve titreşim",
    doneBtn: "Tamam",
    permSuccessToast: "Bildirim izinleri başarıyla verildi!",
    prefUpdatedToast: "Bildirim tercihleriniz güncellendi."
  },
  en: {
    title: "Notification Settings",
    subtitle: "In-room requests, ticket confirmations & VIP updates",
    devicePermission: "Browser & Device Permission:",
    granted: "Allowed",
    denied: "Blocked",
    requestBtn: "Allow Notifications",
    grantedDesc: "purelyİstanbul notifications are active. You will receive instant updates on your room requests and bookings.",
    defaultDesc: "Allow notifications to receive real-time status updates even when your screen is locked.",
    channelsTitle: "Notification Channels",
    roomRequestsTitle: "In-Room Service Updates",
    roomRequestsDesc: "Housekeeping, towels, and room service status",
    tourBookingsTitle: "Tour & Ticket Confirmations",
    tourBookingsDesc: "Yacht cruise, restaurant, and transfer schedules",
    soundTitle: "Sound & Vibration Alert",
    soundDesc: "Gentle chime and vibration when an update arrives",
    doneBtn: "Done",
    permSuccessToast: "Notification permissions granted!",
    prefUpdatedToast: "Notification preferences updated."
  },
  ar: {
    title: "إعدادات الإشعارات",
    subtitle: "طلبات الغرفة، تأكيدات التذاكر وإشعارات VIP",
    devicePermission: "إذن المتصفح والجهاز:",
    granted: "مفعل",
    denied: "محظور",
    requestBtn: "تفعيل الإشعارات",
    grantedDesc: "إشعارات purelyİstanbul مفعلة. ستتلقى تحديثات فورية لطلبات الغرفة والحجوزات الخاصة بك.",
    defaultDesc: "اسمح بالإشعارات لتلقي تحديثات فورية حتى عندما تكون شاشة هاتفك مغلقة.",
    channelsTitle: "قنوات الإشعارات",
    roomRequestsTitle: "تحديثات خدمات الغرف",
    roomRequestsDesc: "حالة التنظيف، المناشف وخدمة الغرف",
    tourBookingsTitle: "تأكيدات الجولات والتذاكر",
    tourBookingsDesc: "مواعيد جولات اليخوت والمطاعم والتوصيل",
    soundTitle: "تنبيه الصوت والاهتزاز",
    soundDesc: "صوت خفيف واهتزاز عند وصول إشعار",
    doneBtn: "تم",
    permSuccessToast: "تم منح إذن الإشعارات بنجاح!",
    prefUpdatedToast: "تم تحديث تفضيلات الإشعارات."
  },
  ru: {
    title: "Настройки уведомлений",
    subtitle: "Запросы в номер, подтверждения билетов и VIP-уведомления",
    devicePermission: "Разрешение браузера и устройства:",
    granted: "Разрешено",
    denied: "Заблокировано",
    requestBtn: "Разрешить",
    grantedDesc: "Уведомления purelyİstanbul активны. Вы будете получать мгновенные обновления по вашим запросам и бронированиям.",
    defaultDesc: "Разрешите уведомления, чтобы получать обновления статуса даже при заблокированном экране.",
    channelsTitle: "Каналы уведомлений",
    roomRequestsTitle: "Обновления рум-сервиса",
    roomRequestsDesc: "Статус уборки, полотенец и обслуживания в номере",
    tourBookingsTitle: "Подтверждения экскурсий и билетов",
    tourBookingsDesc: "Время прогулок на яхте, ресторанов и трансфера",
    soundTitle: "Звук и вибрация",
    soundDesc: "Мягкий звуковой сигнал и вибрация при уведомлении",
    doneBtn: "Готово",
    permSuccessToast: "Разрешение на уведомления получено!",
    prefUpdatedToast: "Настройки уведомлений обновлены."
  },
  de: {
    title: "Benachrichtigungseinstellungen",
    subtitle: "Zimmeranfragen, Ticketbestätigungen & VIP-Updates",
    devicePermission: "Browser- & Geräteberechtigung:",
    granted: "Erlaubt",
    denied: "Blockiert",
    requestBtn: "Erlauben",
    grantedDesc: "purelyİstanbul-Benachrichtigungen sind aktiv. Sie erhalten sofortige Updates zu Ihren Zimmeranfragen und Buchungen.",
    defaultDesc: "Erlauben Sie Benachrichtigungen, um Status-Updates auch bei gesperrtem Bildschirm zu erhalten.",
    channelsTitle: "Benachrichtigungskanäle",
    roomRequestsTitle: "Zimmerservice-Updates",
    roomRequestsDesc: "Status für Reinigung, Handtücher und Zimmerservice",
    tourBookingsTitle: "Tour- & Ticketbestätigungen",
    tourBookingsDesc: "Zeiten für Yachttouren, Restaurants und Transfers",
    soundTitle: "Ton- & Vibrationsalarm",
    soundDesc: "Sanfter Ton und Vibration bei neuen Benachrichtigungen",
    doneBtn: "Fertig",
    permSuccessToast: "Benachrichtigungen erfolgreich aktiviert!",
    prefUpdatedToast: "Benachrichtigungseinstellungen aktualisiert."
  },
  fr: {
    title: "Paramètres de Notification",
    subtitle: "Demandes en chambre, confirmations de billets & alertes VIP",
    devicePermission: "Autorisation navigateur & appareil :",
    granted: "Autorisé",
    denied: "Bloqué",
    requestBtn: "Autoriser",
    grantedDesc: "Les notifications purelyİstanbul sont actives. Vous recevrez des mises à jour instantanées pour vos demandes et réservations.",
    defaultDesc: "Autorisez les notifications pour recevoir des mises à jour en temps réel même lorsque votre écran est verrouillé.",
    channelsTitle: "Canaux de Notification",
    roomRequestsTitle: "Mises à jour Services en Chambre",
    roomRequestsDesc: "Statut ménage, serviettes et service d'étage",
    tourBookingsTitle: "Confirmations Visites & Billets",
    tourBookingsDesc: "Horaires croisières, restaurants et transferts",
    soundTitle: "Alerte Sonore & Vibration",
    soundDesc: "Son doux et vibration à la réception d'une alerte",
    doneBtn: "Terminé",
    permSuccessToast: "Autorisation de notification accordée !",
    prefUpdatedToast: "Préférences de notification mises à jour."
  }
};

export function PwaNotificationModal({
  isOpen,
  onClose,
  lang
}: {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}) {
  const [prefs, setPrefs] = useState<PwaNotificationPrefs>(PwaNotificationManager.getPreferences());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [, setIsSupported] = useState(true);
  const activeLang: Language = lang || XeniosStore.getLanguage() || 'en';
  const ui = PWA_I18N[activeLang] || PWA_I18N.en;

  useEffect(() => {
    setIsSupported(PwaNotificationManager.isSupported());
    setPermission(PwaNotificationManager.getPermission());
    setPrefs(PwaNotificationManager.getPreferences());
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const result = await PwaNotificationManager.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success(ui.permSuccessToast);
      PwaNotificationManager.testNotification();
    }
  };

  const handleToggle = (key: keyof PwaNotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    PwaNotificationManager.savePreferences(updated);
    toast.success(ui.prefUpdatedToast);
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
              <h3 className="font-luxury-serif text-base font-bold uppercase tracking-[0.04em] text-[#141414]">{ui.title}</h3>
              <p className="text-[11px] text-[#5C4938]">{ui.subtitle}</p>
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
            <span className="text-xs font-bold text-[#141414]">{ui.devicePermission}</span>
            {permission === 'granted' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[#7D5E2A] font-bold text-[10px] flex items-center gap-1 border border-[#C4B8A4]">
                <CheckCircle2 className="w-3 h-3 text-[#8E7252]" /> {ui.granted}
              </span>
            ) : permission === 'denied' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-[#141414] font-bold text-[10px] border border-[#C4B8A4]">
                {ui.denied}
              </span>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold text-[11px] rounded-xl shadow-xs cursor-pointer transition"
              >
                {ui.requestBtn}
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#3D352E] leading-relaxed">
            {permission === 'granted' ? ui.grantedDesc : ui.defaultDesc}
          </p>
        </div>

        {/* Channel Preferences Toggles */}
        <div className="space-y-2.5 text-xs">
          <div className="font-bold text-[#7D5E2A] text-[10px] uppercase tracking-wider">
            {ui.channelsTitle}
          </div>

          {/* 1. Oda İçi Talepler */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4]/90 border border-[#C4B8A4]">
            <div className="flex items-center gap-2.5">
              <Hotel className="w-4 h-4 text-[#8E7252]" />
              <div>
                <strong className="text-[#141414] block font-bold text-[11px]">{ui.roomRequestsTitle}</strong>
                <span className="text-[10px] text-[#5C4938]">{ui.roomRequestsDesc}</span>
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
                <strong className="text-[#141414] block font-bold text-[11px]">{ui.tourBookingsTitle}</strong>
                <span className="text-[10px] text-[#5C4938]">{ui.tourBookingsDesc}</span>
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
                <strong className="text-[#141414] block font-bold text-[11px]">{ui.soundTitle}</strong>
                <span className="text-[10px] text-[#5C4938]">{ui.soundDesc}</span>
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
            {ui.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

