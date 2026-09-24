"use client";

import Image from 'next/image';
import { Language, Hotel, ModuleAdminSettingsMap, InRoomServiceItem } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getModuleConfig, deriveStatus, formatFieldValue, resolvePricing } from '@/lib/service-modules';
import { ServiceRequestForm } from './service-request-form';
import { GuestRoomServiceMenu } from './guest-room-service-menu';
import { Clock, CheckCircle2 } from 'lucide-react';

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

  return (
    <div>
      {/* Background moved to GuestConciergeView to apply globally */}
      
      {/* Grid of In-Room Services */}
      <div className="relative z-10 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 -mx-2 sm:mx-0">
        {services.map((item) => {
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
              className={`p-3 flex flex-col items-center text-center justify-center gap-2 min-h-[110px] group relative bg-black/10 backdrop-blur-[3px] rounded-[24px] border border-white/30 shadow-[0_16px_32px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-4px_6px_rgba(0,0,0,0.6)] transition-all duration-300 hover:bg-black/15 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.8),inset_0_-6px_8px_rgba(0,0,0,0.7)] ${
                isEnabled
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed opacity-50 grayscale'
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center group-hover:scale-110 transition-transform relative drop-shadow-[0_4px_8px_rgba(245,158,11,0.3)]">
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600"
                  style={{
                    WebkitMaskImage: `url(${item.icon})`,
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: `url(${item.icon})`,
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center'
                  }}
                />
              </div>
              <div className="w-full mt-1">
                <span className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent leading-tight block drop-shadow-sm">
                  {serviceTitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal for In-Room Request Confirmation */}
      {selectedService && (
        <div 
          className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedService(null);
            }
          }}
        >
          {selectedService.key === 'roomservice' ? (
            <div className="min-h-full flex items-center justify-center py-2 sm:py-6" onClick={(e) => e.stopPropagation()}>
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
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 p-1.5 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden">
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
                    className="text-zinc-400 hover:text-zinc-700 text-xl font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const config = getModuleConfig(selectedService.key);
                  if (config) {
                    const settings = moduleSettings[selectedService.key];
                    return (
                      <ServiceRequestForm
                        config={config}
                        onSubmit={handleStandardRequestSubmit}
                        onCancel={() => setSelectedService(null)}
                        isSubmitting={isSubmitting}
                        pricing={resolvePricing(config, settings?.pricing)}
                        fieldOptionOverrides={settings?.fieldOptions}
                      />
                    );
                  }

                  // Generic Dynamic Form for Custom In-Room Services
                  return (
                    <form onSubmit={handleCustomRequestSubmit} className="space-y-4 text-xs">
                      {getLocalizedDesc(selectedService) && (
                        <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/60 text-zinc-700 text-xs">
                          {getLocalizedDesc(selectedService)}
                        </div>
                      )}

                      {/* Options Selection */}
                      {selectedService.options && selectedService.options.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-800">{t.serviceForm?.optionChoice || 'Seçenek'}</label>
                          <select
                            value={customOption}
                            onChange={(e) => setCustomOption(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 font-medium"
                          >
                            {selectedService.options.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Count / Quantity */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-800">{t.serviceForm?.quantity || 'Adet'}</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              type="button"
                              key={num}
                              onClick={() => setCustomCount(num)}
                              className={`flex-1 py-2 rounded-xl font-bold transition text-xs cursor-pointer border ${
                                customCount === num
                                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                  : 'bg-zinc-50 hover:bg-amber-50 border-zinc-200 text-zinc-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Preference */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> {t.serviceForm?.deliveryTime || 'Zaman'}
                        </label>
                        <select
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 font-medium"
                        >
                          <option value={t.serviceForm?.asap || 'Hemen'}>{t.serviceForm?.asap || 'Hemen'}</option>
                          <option value={t.serviceForm?.in30Min || '30 Dakika'}>{t.serviceForm?.in30Min || '30 Dakika'}</option>
                          <option value={t.serviceForm?.in1Hour || '1 Saat'}>{t.serviceForm?.in1Hour || '1 Saat'}</option>
                          <option value={t.serviceForm?.tonight || 'Akşam'}>{t.serviceForm?.tonight || 'Akşam'}</option>
                          <option value={t.serviceForm?.tomorrowMorning || 'Yarın Sabah'}>{t.serviceForm?.tomorrowMorning || 'Yarın Sabah'}</option>
                        </select>
                      </div>

                      {/* Special Note */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-800">{t.serviceForm?.specialNote || 'Not'}</label>
                        <textarea
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          rows={2}
                          placeholder={t.serviceForm?.notePlaceholder || 'Özel istekleriniz...'}
                          className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedService(null)}
                          className="flex-1 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition text-xs cursor-pointer"
                        >
                          {t.serviceForm?.cancel || 'Vazgeç'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-md text-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? '...' : (t.serviceForm?.submitRequest || 'Talebi Gönder')}
                        </button>
                      </div>
                    </form>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
