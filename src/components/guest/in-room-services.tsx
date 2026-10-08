"use client";

import Image from 'next/image';
import { Language, Hotel, ModuleAdminSettingsMap, InRoomServiceItem } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getModuleConfig, deriveStatus, formatFieldValue } from '@/lib/service-modules';
import { ServiceRequestForm } from './service-request-form';
import { GuestRoomServiceMenu } from './guest-room-service-menu';
import { PaperArtHeader } from './paper-art-header';
import { 
  Utensils, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  Wifi, 
  Clock, 
  CheckCircle2, 
  Shirt, 
  Key, 
  Wrench, 
  ShoppingBag,
  Moon,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';

interface InRoomServicesProps {
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
}

export function InRoomServices({ hotel, roomNumber, lang }: InRoomServicesProps) {
  const t = getT(lang);
  const [services, setServices] = useState<InRoomServiceItem[]>(() => XeniosStore.getInRoomServices());
  const [selectedService, setSelectedService] = useState<InRoomServiceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleSettings, setModuleSettings] = useState<ModuleAdminSettingsMap>(() => XeniosStore.getModuleSettings());

  // Custom Service Form State
  const [customOption, setCustomOption] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [customTime, setCustomTime] = useState(t.serviceForm?.asap || 'Hemen');
  const [customCount, setCustomCount] = useState(1);

  useEffect(() => {
    const refresh = () => {
      setServices(XeniosStore.getInRoomServices());
      setModuleSettings(XeniosStore.getModuleSettings());
    };
    refresh();
    window.addEventListener('xenios_in_room_services_updated', refresh);
    window.addEventListener('xenios_module_settings_updated', refresh);
    return () => {
      window.removeEventListener('xenios_in_room_services_updated', refresh);
      window.removeEventListener('xenios_module_settings_updated', refresh);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: !!selectedService } }));
  }, [selectedService]);

  const getLocalizedTitle = (item: InRoomServiceItem) => {
    return (t.servicesLabels as any)?.[item.key]?.title || (t as any)[item.key] || item.label;
  };

  const getLocalizedDesc = (item: InRoomServiceItem) => {
    return (t.servicesLabels as any)?.[item.key]?.desc || item.desc;
  };

  const handleStandardRequestSubmit = async (details: Record<string, any>) => {
    if (!selectedService) return;
    const config = getModuleConfig(selectedService.key);
    const serviceTitle = getLocalizedTitle(selectedService);
    setIsSubmitting(true);

    try {
      const firstStage = config?.stages[0]?.id ?? 'pending';
      const isUrgent = config?.urgentIf?.(details) ?? false;
      const summaryFields = config?.fields.filter((f) => f.type !== 'display') ?? [];
      const notesSummary = summaryFields
        .map((f) => `${f.label}: ${formatFieldValue(f, details[f.key])}`)
        .join(' · ');

      await FirestoreService.addRequest({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber: roomNumber,
        serviceKey: selectedService.key,
        serviceTitle: serviceTitle,
        notes: notesSummary,
        status: config ? deriveStatus(config, firstStage) : 'pending',
        details,
        department: config?.department || selectedService.department || 'Housekeeping',
        stage: firstStage,
        priority: isUrgent ? 'acil' : 'standart'
      });

      toast.success(t.serviceForm?.requestSent || 'Talebiniz Alındı!', {
        description: `${hotel.name} ${t.room} ${roomNumber} · ${serviceTitle}`
      });

      setIsSubmitting(false);
      setSelectedService(null);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error('Talep iletilirken bir sorun oluştu.');
    }
  };

  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    const serviceTitle = getLocalizedTitle(selectedService);
    setIsSubmitting(true);

    try {
      const notesArr: string[] = [];
      if (customOption) notesArr.push(`${t.serviceForm?.optionChoice || 'Seçenek'}: ${customOption}`);
      if (customCount > 1) notesArr.push(`${t.serviceForm?.quantity || 'Adet'}: ${customCount}`);
      if (customTime) notesArr.push(`${t.serviceForm?.deliveryTime || 'Zaman'}: ${customTime}`);
      if (customNote) notesArr.push(`${t.serviceForm?.specialNote || 'Not'}: ${customNote}`);

      const summary = notesArr.join(' · ') || 'Standart';

      await FirestoreService.addRequest({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber: roomNumber,
        serviceKey: selectedService.key || selectedService.id,
        serviceTitle: serviceTitle,
        notes: summary,
        status: 'pending',
        department: selectedService.department || 'Housekeeping',
        stage: 'pending',
        priority: 'standart'
      });

      toast.success(t.serviceForm?.requestSent || 'Talebiniz Alındı!', {
        description: `${hotel.name} ${t.room} ${roomNumber} · ${serviceTitle}`
      });

      setIsSubmitting(false);
      setSelectedService(null);
      setCustomOption('');
      setCustomNote('');
      setCustomCount(1);
    } catch (err) {
      setIsSubmitting(false);
      toast.error('Talep iletilirken bir sorun oluştu.');
    }
  };

  // Group services into clean categories for ultra-premium UX
  const featuredKeys = ['roomservice', 'cleaning', 'towels', 'lateCheckout'];
  const featuredServices = services.filter(s => featuredKeys.includes(s.key));
  const housekeepingServices = services.filter(s => ['cleaning', 'towels', 'linens', 'pillows', 'toiletries', 'hygiene', 'dnd'].includes(s.key));
  const conciergeServices = services.filter(s => !housekeepingServices.some(h => h.id === s.id));

  const renderServiceCard = (item: InRoomServiceItem, isFeatured = false) => {
    const settings = moduleSettings[item.key];
    const isEnabled = settings ? settings.enabled : item.enabled !== false;
    const serviceTitle = getLocalizedTitle(item);
    const serviceDesc = getLocalizedDesc(item);

    return (
      <button
        key={item.id || item.key}
        type="button"
        disabled={!isEnabled}
        onClick={() => {
          if (!isEnabled) return;
          setSelectedService(item);
          if (item.options && item.options.length > 0) {
            setCustomOption(item.options[0]);
          }
        }}
        className={`p-3.5 sm:p-4 flex flex-col justify-between h-full min-h-[135px] sm:min-h-[145px] group relative bg-gradient-to-b from-white/15 via-white/10 to-black/20 backdrop-blur-md rounded-[28px] border border-white/25 shadow-[0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] ${
          isEnabled
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-40 grayscale'
        }`}
      >
        {/* Top Icon & Badge Row */}
        <div className="flex items-center justify-between w-full">
          <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-white/20 p-2 border border-white/30 backdrop-blur-sm shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform">
            <img
              src={item.icon}
              alt={serviceTitle}
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/15 text-white/90 border border-white/20 shadow-xs">
            {item.key === 'roomservice' ? '7/24 Lezzet' : item.key === 'cleaning' ? 'Günlük' : 'Odaya Özel'}
          </span>
        </div>

        {/* Title & Description */}
        <div className="text-left w-full mt-2">
          <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors leading-snug drop-shadow-sm flex items-center justify-between">
            <span>{serviceTitle}</span>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </h4>
          <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5 font-medium">
            {serviceDesc}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Paper-Art Header (Matching PDF Page 1) */}
      <PaperArtHeader lang={lang} />

      {/* Luxury Room Status Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-900/30 backdrop-blur-md border border-amber-300/40 shadow-xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md font-bold text-sm shrink-0">
            {roomNumber}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Oda Konaklama Durumu</span>
            <strong className="text-sm sm:text-base font-bold text-white block leading-tight">{hotel.name}</strong>
            <span className="text-[11px] text-white/70">7/24 Dijital Resepsiyon & Concierge Hizmeti</span>
          </div>
        </div>

        <div className="hidden xs:flex flex-col items-end shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Canlı Bağlantı
          </span>
        </div>
      </div>

      {/* SECTION 1: Öne Çıkan Hızlı Hizmetler */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-extrabold font-serif text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Öne Çıkan Hızlı Hizmetler</span>
          </h2>
          <span className="text-[11px] text-white/60 font-medium">Tek tıkla talep edin</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {featuredServices.map(item => renderServiceCard(item, true))}
        </div>
      </div>

      {/* SECTION 2: Housekeeping & Oda Temizliği */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-extrabold font-serif text-white tracking-wide flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-sky-400" />
            <span>Housekeeping & Oda Temizliği</span>
          </h2>
          <span className="text-[11px] text-white/60 font-medium">{housekeepingServices.length} Hizmet</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {housekeepingServices.map(item => renderServiceCard(item))}
        </div>
      </div>

      {/* SECTION 3: Resepsiyon & Destek Hizmetleri */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-extrabold font-serif text-white tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Resepsiyon & Destek Hizmetleri</span>
          </h2>
          <span className="text-[11px] text-white/60 font-medium">{conciergeServices.length} Hizmet</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {conciergeServices.map(item => renderServiceCard(item))}
        </div>
      </div>

      {/* Modal for In-Room Request Confirmation */}
      {selectedService && (
        <div 
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md p-2 pb-20 sm:p-6 animate-in fade-in"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedService(null);
            }
          }}
        >
          {selectedService.key === 'roomservice' ? (
            <div className="min-h-full flex items-center justify-center py-2 pb-20 sm:py-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-lg">
                <GuestRoomServiceMenu hotel={hotel} roomNumber={roomNumber} lang={lang} onClose={() => {
                  setSelectedService(null);
                }} />
              </div>
            </div>
          ) : (
            <div className="min-h-full flex items-center justify-center py-6">
              <div 
                className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-200 animate-in zoom-in-95 space-y-4 text-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 p-1.5 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      <img
                        src={selectedService.icon}
                        alt={getLocalizedTitle(selectedService)}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{getLocalizedTitle(selectedService)}</h3>
                      <p className="text-xs text-zinc-500">{hotel.name} - {t.room} {roomNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-zinc-600 font-medium">
                  {getLocalizedDesc(selectedService)}
                </p>

                {getModuleConfig(selectedService.key) ? (
                  <ServiceRequestForm
                    config={getModuleConfig(selectedService.key)!}
                    onSubmit={handleStandardRequestSubmit}
                    onCancel={() => setSelectedService(null)}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <form onSubmit={handleCustomRequestSubmit} className="space-y-4">
                    {selectedService.options && selectedService.options.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 block">{t.serviceForm?.optionChoice || 'Seçenek'}</label>
                        <select
                          value={customOption}
                          onChange={(e) => setCustomOption(e.target.value)}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {selectedService.options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 block">{t.serviceForm?.quantity || 'Adet'}</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={customCount}
                          onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 block">{t.serviceForm?.deliveryTime || 'Zaman'}</label>
                        <select
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Hemen">{t.serviceForm?.asap || 'Hemen (En Kısa Sürede)'}</option>
                          <option value="30 dk içinde">30 Dk İçinde</option>
                          <option value="1 saat içinde">1 Saat İçinde</option>
                          <option value="Akşam üstü">Akşamüstü</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 block">{t.serviceForm?.specialNote || 'Özel Notunuz'}</label>
                      <textarea
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Varsa ekstra isteklerinizi belirtebilirsiniz..."
                        rows={2}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedService(null)}
                        className="w-1/3 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {(t as any).cancel || 'İptal'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Gonderiliyor...' : (t.serviceForm?.submitRequest || 'Talebi Gonder')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
