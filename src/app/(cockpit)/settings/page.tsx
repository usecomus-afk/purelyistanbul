"use client";

import { PwaNotificationModal } from "@/components/pwa-notification-modal";

import { ThemeSelector } from "@/components/theme-selector";
import { useState } from 'react';
import { 
  Building2, 
  CalendarSync, 
  DoorOpen, 
  Bell, 
  Sparkles, 
  CreditCard, 
  Save, 
  RefreshCw, 
  Check, 
  Copy, 
  ShieldCheck,
  Globe,
  Wifi,
  Phone,
  Clock,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'ical' | 'rooms' | 'notifications' | 'pos'>('general');
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  // General Settings
  const [hotelName, setHotelName] = useState('Old City Heritage Hotel Istanbul');
  const [receptionPhone, setReceptionPhone] = useState('+90 212 518 90 00');
  const [receptionExt, setReceptionExt] = useState('9');
  const [wifiSsid, setWifiSsid] = useState('OldCity_Guest');
  const [wifiPass, setWifiPass] = useState('Heritage2026!');
  const [breakfastHours, setBreakfastHours] = useState('07:30 - 10:30');
  const [checkoutTime, setCheckoutTime] = useState('11:30');

  // iCal & OTA Settings
  const [airbnbIcal, setAirbnbIcal] = useState('https://www.airbnb.com/calendar/ical/10948291.ics?s=f839');
  const [bookingIcal, setBookingIcal] = useState('https://admin.booking.com/hotel/hoteladmin/ical.html?t=948192');
  const [expediaIcal, setExpediaIcal] = useState('https://expediapartnercentral.com/ical/export/84920');
  const [vrboIcal, setVrboIcal] = useState('');
  const [syncInterval, setSyncInterval] = useState('15');

  // Notifications
  const [whatsappNumber, setWhatsappNumber] = useState('+90 532 123 45 67');
  const [staffEmail, setStaffEmail] = useState('concierge@xenios-istanbul.com');
  const [notifyDnd, setNotifyDnd] = useState(true);
  const [notifyCleaning, setNotifyCleaning] = useState(true);

  // POS & Google
  const [geminiKey, setGeminiKey] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [posMerchantId, setPosMerchantId] = useState('XENIOS_MERCHANT_3401');

  const handleSave = () => {
    toast.success("Ayarlar başarıyla kaydedildi ve senkronize edildi!");
  };

  const handleSyncNow = () => {
    toast.success("iCal & OTA kanalları başarıyla eşitlendi! (0 çakışma)");
  };

  return (
    <div className="space-y-6 max-w-4xl">
        <ThemeSelector />
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100">
            Tesis & Entegrasyon Ayarları
          </h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            Otel bilgileri, iCal OTA takvim eşitlemesi, kat hizmetleri ve POS parametreleri
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Değişiklikleri Kaydet</span>
        </button>
      </div>

      {/* Setting Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-amber-200/80">
        {[
          { id: 'general', label: 'Genel Otel Bilgileri', icon: Building2 },
          { id: 'ical', label: 'iCal & OTA Kanalları', icon: CalendarSync },
          { id: 'rooms', label: 'Oda Envanteri', icon: DoorOpen },
          { id: 'notifications', label: 'Bildirimler & WhatsApp', icon: Bell },
          { id: 'pos', label: 'POS & Google AI', icon: Sparkles }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:text-slate-100 hover:bg-white dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Genel Otel Bilgileri */}
      {activeTab === 'general' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mb-2">Temel Tesis ve Wi-Fi Parametreleri</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Otel / Tesis Adı:</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Resepsiyon Dahili No:</label>
              <input
                type="text"
                value={receptionExt}
                onChange={(e) => setReceptionExt(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Misafir Wi-Fi Ağ Adı (SSID):</label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Misafir Wi-Fi Şifresi:</label>
              <input
                type="text"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Kahvaltı Saatleri:</label>
              <input
                type="text"
                value={breakfastHours}
                onChange={(e) => setBreakfastHours(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Çıkış Saati (Check-out):</label>
              <input
                type="text"
                value={checkoutTime}
                onChange={(e) => setCheckoutTime(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: iCal & OTA Kanalları */}
      {activeTab === 'ical' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">OTA Takvim Entegrasyonu (iCal)</h3>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400">Rezervasyon çakışmalarını önlemek için 2 yönlü takvim eşitlemesi</p>
            </div>
            <button
              type="button"
              onClick={handleSyncNow}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-zinc-900 dark:text-slate-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer self-start"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Şimdi Eşitle</span>
            </button>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-700 font-bold">Airbnb iCal İçe Aktarma Linki:</label>
                <span className="text-emerald-400 text-[10px] font-bold">● Aktif Senkron</span>
              </div>
              <input
                type="url"
                value={airbnbIcal}
                onChange={(e) => setAirbnbIcal(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-700 font-bold">Booking.com iCal İçe Aktarma Linki:</label>
                <span className="text-emerald-400 text-[10px] font-bold">● Aktif Senkron</span>
              </div>
              <input
                type="url"
                value={bookingIcal}
                onChange={(e) => setBookingIcal(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-700 font-bold">Expedia iCal İçe Aktarma Linki:</label>
                <span className="text-emerald-400 text-[10px] font-bold">● Aktif Senkron</span>
              </div>
              <input
                type="url"
                value={expediaIcal}
                onChange={(e) => setExpediaIcal(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-1.5">
              <span className="text-zinc-500 dark:text-slate-400 font-bold block text-[11px]">Xenios Dışa Aktarma iCal Linkiniz (OTA'lara Yapıştırın):</span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-amber-400 font-mono text-[10px] truncate block">
                  https://xenios.usecomus.com/api/ical/export/hotel-heritage-fatih.ics
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://xenios.usecomus.com/api/ical/export/hotel-heritage-fatih.ics');
                    toast.success("iCal linki kopyalandı!");
                  }}
                  className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-[10px] shrink-0"
                >
                  Kopyala
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Oda Envanteri */}
      {activeTab === 'rooms' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mb-2">Oda Tipleri & Envanter Dağılımı</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-2">
              <strong className="text-zinc-900 dark:text-slate-100 block font-bold">Deluxe Queen Oda</strong>
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span>Mevcut Adet:</span>
                <strong className="text-zinc-900 dark:text-slate-100 font-mono">18 Oda</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span>Temel Fiyat:</span>
                <strong className="text-amber-400 font-mono">€120 / gece</strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-2">
              <strong className="text-zinc-900 dark:text-slate-100 block font-bold">Panoramic Bosphorus Suite</strong>
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span>Mevcut Adet:</span>
                <strong className="text-zinc-900 dark:text-slate-100 font-mono">12 Oda</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span>Temel Fiyat:</span>
                <strong className="text-amber-400 font-mono">€240 / gece</strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-2">
              <strong className="text-zinc-900 dark:text-slate-100 block font-bold">Aile Odası (2+2)</strong>
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span>Mevcut Adet:</span>
                <strong className="text-zinc-900 dark:text-slate-100 font-mono">12 Oda</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span>Temel Fiyat:</span>
                <strong className="text-amber-400 font-mono">€180 / gece</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Bildirimler */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mb-2">Kat Hizmetleri & Resepsiyon İletişim Kanalları</h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Yeni Talep WhatsApp Bildirim Numarası:</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Resepsiyon Bildirim E-Postası:</label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: POS & Google AI */}
      {activeTab === 'pos' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mb-2">Sanal POS & Google Gemini AI Parametreleri</h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Google Gemini API Anahtarı:</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-bold">Varsayılan Para Birimi:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100"
              >
                <option value="EUR">Euro (€)</option>
                <option value="TRY">Türk Lirası (₺)</option>
                <option value="USD">Amerikan Doları ($)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
