"use client";

import { Language, Hotel, ModuleAdminSettingsMap, InRoomServiceItem } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getModuleConfig, deriveStatus, formatFieldValue, resolvePricing } from '@/lib/service-modules';
import { ServiceRequestForm, translateServiceOption, ServiceFormPaymentMeta } from './service-request-form';
import { GuestRoomServiceMenu } from './guest-room-service-menu';
import { LuxuryServiceIcon } from './luxury-service-icon';
import {
  InlineOnlinePaymentBox,
  GuestPaymentMethod,
  OnlineCardDetails,
  ONLINE_PAYMENT_I18N,
  processOnlineServicePayment,
  formatCurrencyAmount,
} from './inline-online-payment-box';
import { Clock, Lock } from 'lucide-react';

interface InRoomServicesProps {
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
}

const REQUEST_ERROR_I18N: Record<Language, string> = {
  tr: 'Talep iletilirken bir sorun oluştu.',
  en: 'An error occurred while submitting your request.',
  ar: 'حدث خطأ أثناء إرسال طلبك.',
  ru: 'Произошла ошибка при отправке запроса.',
  de: 'Beim Senden Ihrer Anfrage ist ein Fehler aufgetreten.',
  fr: 'Une erreur est survenue lors de l’envoi de votre demande.',
};

const BUILTIN_LUXURY_KEYS = new Set([
  'roomservice',
  'dnd',
  'cleaning',
  'linens',
  'towels',
  'toiletries',
  'hygiene',
  'technical',
  'lateCheckout',
  'extendStay',
  'pillows',
  'minibar',
  'safe',
  'laundry',
  'breakfast',
  'taxi',
]);

export function InRoomServices({ hotel, roomNumber, lang }: InRoomServicesProps) {
  const t = getT(lang);
  const payUi = ONLINE_PAYMENT_I18N[lang] || ONLINE_PAYMENT_I18N.en;
  const [services, setServices] = useState<InRoomServiceItem[]>(() => XeniosStore.getInRoomServices());
  const [selectedService, setSelectedService] = useState<InRoomServiceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleSettings, setModuleSettings] = useState<ModuleAdminSettingsMap>(() => XeniosStore.getModuleSettings());

  // Custom Service Form State
  const [customOption, setCustomOption] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [customTime, setCustomTime] = useState(t.serviceForm?.asap || 'Hemen');
  const [customCount, setCustomCount] = useState(1);
  const [customPaymentMethod, setCustomPaymentMethod] = useState<GuestPaymentMethod>('online_card');
  const [customCardDetails, setCustomCardDetails] = useState<OnlineCardDetails>({
    holderName: '',
    cardNumber: '4543 •••• •••• 8892',
    expiry: '09/28',
    cvv: '734',
  });

  useEffect(() => {
    const refresh = () => {
      setServices(XeniosStore.getInRoomServices());
      setModuleSettings(XeniosStore.getModuleSettings());
    };
    refresh();
    window.addEventListener('xenios_in_room_services_updated', refresh);
    window.addEventListener('xenios_module_settings_updated', refresh);
    window.addEventListener('xenios_hotels_updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('xenios_in_room_services_updated', refresh);
      window.removeEventListener('xenios_module_settings_updated', refresh);
      window.removeEventListener('xenios_hotels_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [hotel?.id]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: !!selectedService } }));
  }, [selectedService]);

  const getLocalizedTitle = (item: InRoomServiceItem) => {
    return (t.servicesLabels as any)?.[item.key]?.title || (t as any)[item.key] || item.label;
  };

  const getLocalizedDesc = (item: InRoomServiceItem) => {
    return (t.servicesLabels as any)?.[item.key]?.desc || item.desc;
  };

  const handleStandardRequestSubmit = async (details: Record<string, any>, paymentMeta?: ServiceFormPaymentMeta) => {
    if (!selectedService) return;
    const config = getModuleConfig(selectedService.key);
    const serviceTitle = getLocalizedTitle(selectedService);
    setIsSubmitting(true);

    try {
      const payable = paymentMeta?.payable;
      let paymentReference = '';

      if (payable && payable.amount > 0 && paymentMeta?.paymentMethod === 'online_card') {
        const payRes = await processOnlineServicePayment({
          amount: payable.amount,
          currency: payable.currency,
          hotelId: hotel.id,
          hotelName: hotel.name,
          roomNumber,
          serviceTitle,
          card: paymentMeta.cardDetails,
          lang,
        });
        if (!payRes.success) {
          toast.error(payRes.error || payUi.invalidCardError);
          setIsSubmitting(false);
          return;
        }
        paymentReference = payRes.paymentReference;
      }

      const firstStage = config?.stages[0]?.id ?? 'pending';
      const isUrgent = config?.urgentIf?.(details) ?? false;
      const summaryFields = config?.fields.filter((f) => f.type !== 'display') ?? [];
      let notesSummary = summaryFields
        .map((f) => `${f.label}: ${formatFieldValue(f, details[f.key])}`)
        .join(' · ');

      if (payable && payable.amount > 0) {
        const amtText = formatCurrencyAmount(payable.amount, payable.currency);
        const paymentBadgeText =
          paymentMeta?.paymentMethod === 'online_card'
            ? `[${payUi.paidOnlineBadge} · ${amtText} · #${paymentReference}]`
            : `[${payUi.roomFolioBadge} · ${amtText}]`;
        notesSummary = notesSummary ? `${notesSummary} · ${paymentBadgeText}` : paymentBadgeText;
      }

      await FirestoreService.addRequest({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber: roomNumber,
        serviceKey: selectedService.key,
        serviceTitle: serviceTitle,
        notes: notesSummary,
        status: 'pending',
        details,
        department: config?.department || selectedService.department || 'Housekeeping',
        stage: firstStage,
        priority: isUrgent ? 'acil' : 'standart',
        ...(payable && payable.amount > 0
          ? {
              paymentMethod: (paymentMeta?.paymentMethod || 'room_charge') as 'online_card' | 'room_charge',
              paymentStatus: (paymentMeta?.paymentMethod === 'online_card' ? 'paid_online' : 'room_folio') as 'paid_online' | 'room_folio',
              paymentAmount: payable.amount,
              paymentCurrency: payable.currency,
              paymentReference: paymentReference || undefined,
            }
          : {}),
      });

      toast.success(
        payable && payable.amount > 0 && paymentMeta?.paymentMethod === 'online_card'
          ? payUi.paymentSuccessToast
          : t.serviceForm?.requestSent || 'Talebiniz Alındı!',
        {
          description: `${hotel.name} ${t.room} ${roomNumber} · ${serviceTitle}${paymentReference ? ` · #${paymentReference}` : ''}`
        }
      );

      setIsSubmitting(false);
      setSelectedService(null);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(REQUEST_ERROR_I18N[lang] || REQUEST_ERROR_I18N.en);
    }
  };

  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    const serviceTitle = getLocalizedTitle(selectedService);
    setIsSubmitting(true);

    try {
      const unitPrice = Number(selectedService.price || 0);
      const totalAmount = unitPrice > 0 ? unitPrice * customCount : 0;
      const currency = selectedService.currency || 'TRY';
      let paymentReference = '';

      if (totalAmount > 0 && customPaymentMethod === 'online_card') {
        const payRes = await processOnlineServicePayment({
          amount: totalAmount,
          currency,
          hotelId: hotel.id,
          hotelName: hotel.name,
          roomNumber,
          serviceTitle,
          card: customCardDetails,
          lang,
        });
        if (!payRes.success) {
          toast.error(payRes.error || payUi.invalidCardError);
          setIsSubmitting(false);
          return;
        }
        paymentReference = payRes.paymentReference;
      }

      const notesArr: string[] = [];
      if (customOption) notesArr.push(`${t.serviceForm?.optionChoice || 'Seçenek'}: ${customOption}`);
      if (customCount > 1) notesArr.push(`${t.serviceForm?.quantity || 'Adet'}: ${customCount}`);
      if (customTime) notesArr.push(`${t.serviceForm?.deliveryTime || 'Zaman'}: ${customTime}`);
      if (customNote) notesArr.push(`${t.serviceForm?.specialNote || 'Not'}: ${customNote}`);
      if (totalAmount > 0) {
        const amtText = formatCurrencyAmount(totalAmount, currency);
        notesArr.push(
          customPaymentMethod === 'online_card'
            ? `[${payUi.paidOnlineBadge} · ${amtText} · #${paymentReference}]`
            : `[${payUi.roomFolioBadge} · ${amtText}]`
        );
      }

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
        priority: 'standart',
        ...(totalAmount > 0
          ? {
              paymentMethod: customPaymentMethod,
              paymentStatus: (customPaymentMethod === 'online_card' ? 'paid_online' : 'room_folio') as 'paid_online' | 'room_folio',
              paymentAmount: totalAmount,
              paymentCurrency: currency,
              paymentReference: paymentReference || undefined,
            }
          : {}),
      });

      toast.success(
        totalAmount > 0 && customPaymentMethod === 'online_card'
          ? payUi.paymentSuccessToast
          : t.serviceForm?.requestSent || 'Talebiniz Alındı!',
        {
          description: `${hotel.name} ${t.room} ${roomNumber} · ${serviceTitle}${paymentReference ? ` · #${paymentReference}` : ''}`
        }
      );

      setIsSubmitting(false);
      setSelectedService(null);
      setCustomOption('');
      setCustomNote('');
      setCustomCount(1);
    } catch (err) {
      setIsSubmitting(false);
      toast.error(REQUEST_ERROR_I18N[lang] || REQUEST_ERROR_I18N.en);
    }
  };

  const renderServiceVisual = (item: InRoomServiceItem, sizeClass: string) => {
    if (BUILTIN_LUXURY_KEYS.has(item.key) || !item.icon || item.icon.startsWith('/icons/menu/')) {
      return <LuxuryServiceIcon serviceKey={item.key} className={sizeClass} />;
    }
    return (
      <div className={`${sizeClass} shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform relative`}>
        <img
          src={item.icon}
          alt={getLocalizedTitle(item)}
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </div>
    );
  };

  const activeServices = services.filter((item) => !item.hidden && item.enabled !== false);
  const isScrollableGrid = activeServices.length > 8;

  return (
    <div
      className={`h-full flex flex-col flex-1 min-h-0 ${
        isScrollableGrid ? 'overflow-y-auto touch-pan-y overscroll-contain no-scrollbar' : ''
      }`}
    >
      {/* 2x4 (or scrollable multi-row) Grid of Softly Rounded Luxury Neomorphic / Glassmorphic Cards */}
      <div
        className={`relative z-10 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 px-1.5 pt-0.5 sm:p-4 -mx-1 sm:mx-0 items-stretch ${
          isScrollableGrid
            ? 'pb-6 auto-rows-[minmax(122px,1fr)] sm:auto-rows-[minmax(150px,1fr)]'
            : 'pb-2.5 flex-1 min-h-0 grid-rows-4 sm:grid-rows-none sm:auto-rows-fr h-full'
        }`}
      >
        {activeServices.map((item) => {
          const isEnabled = true;
          const serviceTitle = getLocalizedTitle(item);

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
              className={`luxury-service-card px-3 py-2 flex flex-col items-center text-center justify-center gap-1.5 h-full min-h-0 group relative ${
                isEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale'
              }`}
            >
              {/* Fine Line-Art 3D Metallic Gold/Bronze & Dark Charcoal Icon */}
              <div className="shrink-0 flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-300 relative">
                {renderServiceVisual(item, "w-[78px] h-[78px] sm:w-24 sm:h-24")}
              </div>

              {/* Clean Bold Modern Sans-Serif Card Label */}
              <div className="w-full px-1">
                <span className="font-luxury-sans text-[13.5px] sm:text-[15px] font-bold tracking-[-0.01em] text-[#141414] leading-[1.18] block">
                  {serviceTitle === 'Late Check-out Request' ? (
                    <>
                      Late Check-out
                      <br />
                      Request
                    </>
                  ) : (
                    serviceTitle
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal for In-Room Request Confirmation */}
      {selectedService && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/25 backdrop-blur-md px-2 pt-[max(2.75rem,calc(env(safe-area-inset-top)+0.5rem))] pb-20 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedService(null);
            }
          }}
        >
          {selectedService.key === 'roomservice' ? (
            <div className="min-h-full flex items-center justify-center pb-16 sm:py-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-lg">
                <GuestRoomServiceMenu
                  hotel={hotel}
                  roomNumber={roomNumber}
                  lang={lang}
                  onClose={() => {
                    setSelectedService(null);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="min-h-full flex items-center justify-center py-6">
              <div
                className="luxury-service-card relative w-full max-w-md p-5 sm:p-6 animate-in zoom-in-95 space-y-4 text-[#141414]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#D8CBB8] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF8F4] p-1 border border-[#C4B8A4] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {renderServiceVisual(selectedService, "w-10 h-10")}
                    </div>
                    <div>
                      <h3 className="font-luxury-serif text-[17px] font-bold uppercase tracking-[0.04em] text-[#141414]">{getLocalizedTitle(selectedService)}</h3>
                      <p className="font-luxury-sans text-xs text-[#5C4938]">{hotel.name} · {t.room} {roomNumber}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] text-sm font-bold flex items-center justify-center cursor-pointer transition"
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
                        lang={lang}
                      />
                    );
                  }

                  // Generic Dynamic Form for Custom In-Room Services
                  return (
                    <form onSubmit={handleCustomRequestSubmit} className="space-y-4 text-xs">
                      {getLocalizedDesc(selectedService) && (
                        <div className="p-3 bg-[#F5EFE4] rounded-2xl border border-[#DFD2BC] text-[#4A443D] text-xs">
                          {getLocalizedDesc(selectedService)}
                        </div>
                      )}

                      {/* Options Selection */}
                      {selectedService.options && selectedService.options.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#2C2825]">{t.serviceForm?.optionChoice || 'Seçenek'}</label>
                          <select
                            value={customOption}
                            onChange={(e) => setCustomOption(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-[#D8C7A8] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89146]/40 text-[#221F1C] font-medium"
                          >
                            {selectedService.options.map((opt, i) => (
                              <option key={i} value={opt}>{translateServiceOption(opt, lang)}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Count / Quantity */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#2C2825]">{t.serviceForm?.quantity || 'Adet'}</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              type="button"
                              key={num}
                              onClick={() => setCustomCount(num)}
                              className={`flex-1 py-2 rounded-xl font-semibold transition text-xs cursor-pointer border ${
                                customCount === num
                                  ? 'bg-[#9E7B42] border-[#9E7B42] text-white shadow-xs'
                                  : 'bg-white hover:bg-[#F5EFE4] border-[#DFD5C5] text-[#3A3530]'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Preference */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#2C2825] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#9E7B42]" /> {t.serviceForm?.deliveryTime || 'Zaman'}
                        </label>
                        <select
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-[#D8C7A8] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89146]/40 text-[#221F1C] font-medium"
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
                        <label className="text-xs font-semibold text-[#2C2825]">{t.serviceForm?.specialNote || 'Not'}</label>
                        <textarea
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          rows={2}
                          placeholder={t.serviceForm?.notePlaceholder || 'Özel istekleriniz...'}
                          className="w-full text-[16px] sm:text-xs p-2.5 rounded-xl border border-[#D8C7A8] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89146]/40 text-[#221F1C]"
                        />
                      </div>

                      {Number(selectedService.price || 0) > 0 && (
                        <div className="pt-2 border-t border-[#D8CBB8]">
                          <InlineOnlinePaymentBox
                            amount={Number(selectedService.price || 0) * customCount}
                            currency={selectedService.currency || 'TRY'}
                            lang={lang}
                            paymentMethod={customPaymentMethod}
                            onPaymentMethodChange={setCustomPaymentMethod}
                            cardDetails={customCardDetails}
                            onCardDetailsChange={setCustomCardDetails}
                            compact
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedService(null)}
                          className="flex-1 py-3 rounded-2xl bg-[#EFECE6] hover:bg-[#E5E0D7] text-[#3A3530] font-semibold transition text-xs cursor-pointer"
                        >
                          {t.serviceForm?.cancel || 'Vazgeç'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-[#B89146] to-[#8E6928] hover:from-[#A8823A] hover:to-[#7D5B20] text-white font-semibold transition shadow-md text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {Number(selectedService.price || 0) > 0 && customPaymentMethod === 'online_card' && (
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {isSubmitting
                              ? Number(selectedService.price || 0) > 0 && customPaymentMethod === 'online_card'
                                ? payUi.processing3DSecure
                                : '...'
                              : Number(selectedService.price || 0) > 0 && customPaymentMethod === 'online_card'
                                ? payUi.payAndSubmit(
                                    formatCurrencyAmount(
                                      Number(selectedService.price || 0) * customCount,
                                      selectedService.currency || 'TRY'
                                    )
                                  )
                                : t.serviceForm?.submitRequest || 'Talebi Gönder'}
                          </span>
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
