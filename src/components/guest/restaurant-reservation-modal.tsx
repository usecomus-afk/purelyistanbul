"use client";

import { NotificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firestore-service";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { getT } from '@/lib/i18n';
import { getLocalizedExperience } from '@/lib/experience-i18n';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { toast } from 'sonner';
import {
  Users, Calendar, Clock, Phone, User, Sparkles, X, CheckCircle2, ShieldCheck, MapPin
} from 'lucide-react';

interface RestaurantReservationModalProps {
  lang?: Language;
  restaurant: Experience;
  hotel: Hotel;
  roomNumber: string;
  onClose: () => void;
}

const RES_MODAL_I18N: Record<Language, {
  defaultNote: string;
  phoneRequiredError: string;
  guestDefault: string;
  requestTitlePrefix: string;
  stageConfirming: string;
  successToastTitle: string;
  successToastDesc: (title: string, code: string) => string;
  headerBadge: string;
  hotelAndRoomInfo: string;
  conciergeGuarantee: string;
  guestCountLabel: string;
  dateLabel: string;
  timeLabel: string;
  mobilePhoneLabel: string;
  mobilePhonePlaceholder: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  tablePrefLabel: string;
  tablePrefPlaceholder: string;
  cancelBtn: string;
  processingBtn: string;
  reserveBtn: string;
}> = {
  tr: {
    defaultNote: 'Boğaz / Manzaralı masa tercihi',
    phoneRequiredError: 'Lütfen rezervasyon teyidi için cep telefonu numaranızı girin.',
    guestDefault: 'Misafir',
    requestTitlePrefix: 'Masa Rezervasyonu',
    stageConfirming: 'Restoran Teyidi Alınıyor',
    successToastTitle: 'Masa Rezervasyon Talebiniz Alındı!',
    successToastDesc: (title, code) => `${title} için rezervasyon kodunuz: ${code}. Concierge ekibimiz restoran ile teyitleşip onay iletecektir.`,
    headerBadge: 'Concierge Masa Rezervasyonu',
    hotelAndRoomInfo: 'Otel & Oda Bilgisi',
    conciergeGuarantee: 'Concierge Güvencesi',
    guestCountLabel: 'Kişi Sayısı *',
    dateLabel: 'Tarih *',
    timeLabel: 'Saat *',
    mobilePhoneLabel: 'Cep Telefonu *',
    mobilePhonePlaceholder: '+90 5xx xxx xx xx (Rezervasyon onayı SMS/WhatsApp ile iletilir)',
    fullNameLabel: 'Adınız & Soyadınız',
    fullNamePlaceholder: 'Örn: David Miller / Ayşe Yılmaz',
    tablePrefLabel: 'Masa Tercihi & Not',
    tablePrefPlaceholder: 'Örn: Manzaralı masa, doğum günü kutlaması, sigarasız alan vb.',
    cancelBtn: 'Vazgeç',
    processingBtn: 'İşleniyor...',
    reserveBtn: 'Masa Rezerve Et'
  },
  en: {
    defaultNote: 'Bosphorus / Scenic view table preference',
    phoneRequiredError: 'Please enter your mobile number for reservation confirmation.',
    guestDefault: 'Guest',
    requestTitlePrefix: 'Table Reservation',
    stageConfirming: 'Confirming with Restaurant',
    successToastTitle: 'Table Reservation Request Received!',
    successToastDesc: (title, code) => `Your reservation code for ${title}: ${code}. Our Concierge team will confirm with the restaurant and notify you.`,
    headerBadge: 'Concierge Table Reservation',
    hotelAndRoomInfo: 'Hotel & Room Info',
    conciergeGuarantee: 'Concierge Guarantee',
    guestCountLabel: 'Number of Guests *',
    dateLabel: 'Date *',
    timeLabel: 'Time *',
    mobilePhoneLabel: 'Mobile Phone *',
    mobilePhonePlaceholder: '+90 5xx xxx xx xx (Confirmation sent via SMS/WhatsApp)',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g., David Miller',
    tablePrefLabel: 'Table Preference & Notes',
    tablePrefPlaceholder: 'e.g., Window table, birthday celebration, non-smoking area, etc.',
    cancelBtn: 'Cancel',
    processingBtn: 'Processing...',
    reserveBtn: 'Reserve Table'
  },
  ar: {
    defaultNote: 'تفضيل طاولة بإطلالة على البوسفور',
    phoneRequiredError: 'يرجى إدخال رقم هاتفك المحمول لتأكيد الحجز.',
    guestDefault: 'ضيف',
    requestTitlePrefix: 'حجز طاولة',
    stageConfirming: 'جارٍ التأكيد مع المطعم',
    successToastTitle: 'تم استلام طلب حجز الطاولة!',
    successToastDesc: (title, code) => `رمز الحجز الخاص بك في ${title}: ${code}. سيتأكد فريق الكونسيرج مع المطعم ويرسل لك التأكيد.`,
    headerBadge: 'حجز طاولة عبر الكونسيرج',
    hotelAndRoomInfo: 'معلومات الفندق والغرفة',
    conciergeGuarantee: 'ضمان الكونسيرج',
    guestCountLabel: 'عدد الضيوف *',
    dateLabel: 'التاريخ *',
    timeLabel: 'الوقت *',
    mobilePhoneLabel: 'الهاتف المحمول *',
    mobilePhonePlaceholder: '+90 5xx xxx xx xx (يتم إرسال التأكيد عبر SMS/WhatsApp)',
    fullNameLabel: 'الاسم الكامل',
    fullNamePlaceholder: 'مثال: David Miller',
    tablePrefLabel: 'تفضيل الطاولة والملاحظات',
    tablePrefPlaceholder: 'مثال: طاولة بإطلالة، احتفال عيد ميلاد، منطقة لغير المدخنين، إلخ.',
    cancelBtn: 'إلغاء',
    processingBtn: 'جارٍ المعالجة...',
    reserveBtn: 'احجز طاولة'
  },
  ru: {
    defaultNote: 'Предпочтение столика с видом на Босфор / панорамным видом',
    phoneRequiredError: 'Пожалуйста, введите номер мобильного телефона для подтверждения брони.',
    guestDefault: 'Гость',
    requestTitlePrefix: 'Бронирование столика',
    stageConfirming: 'Подтверждение с рестораном',
    successToastTitle: 'Запрос на бронирование столика принят!',
    successToastDesc: (title, code) => `Ваш код брони для ${title}: ${code}. Наша служба консьержа свяжется с рестораном и отправит подтверждение.`,
    headerBadge: 'Бронирование столика через консьержа',
    hotelAndRoomInfo: 'Отель и номер',
    conciergeGuarantee: 'Гарантия консьержа',
    guestCountLabel: 'Количество гостей *',
    dateLabel: 'Дата *',
    timeLabel: 'Время *',
    mobilePhoneLabel: 'Мобильный телефон *',
    mobilePhonePlaceholder: '+90 5xx xxx xx xx (Подтверждение по SMS/WhatsApp)',
    fullNameLabel: 'Имя и фамилия',
    fullNamePlaceholder: 'Напр.: David Miller',
    tablePrefLabel: 'Предпочтения по столику и примечания',
    tablePrefPlaceholder: 'Напр.: столик с видом, день рождения, зона для некурящих и т.д.',
    cancelBtn: 'Отмена',
    processingBtn: 'Обработка...',
    reserveBtn: 'Забронировать столик'
  },
  de: {
    defaultNote: 'Tischwunsch mit Bosporus- / Panoramablick',
    phoneRequiredError: 'Bitte geben Sie Ihre Mobiltelefonnummer zur Reservierungsbestätigung ein.',
    guestDefault: 'Gast',
    requestTitlePrefix: 'Tischreservierung',
    stageConfirming: 'Bestätigung durch das Restaurant läuft',
    successToastTitle: 'Tischreservierungsanfrage erhalten!',
    successToastDesc: (title, code) => `Ihr Reservierungscode für ${title}: ${code}. Unser Concierge-Team bestätigt die Anfrage mit dem Restaurant.`,
    headerBadge: 'Concierge-Tischreservierung',
    hotelAndRoomInfo: 'Hotel- & Zimmerinfo',
    conciergeGuarantee: 'Concierge-Garantie',
    guestCountLabel: 'Personenanzahl *',
    dateLabel: 'Datum *',
    timeLabel: 'Uhrzeit *',
    mobilePhoneLabel: 'Mobiltelefon *',
    mobilePhonePlaceholder: '+90 5xx xxx xx xx (Bestätigung per SMS/WhatsApp)',
    fullNameLabel: 'Vollständiger Name',
    fullNamePlaceholder: 'z. B. David Miller',
    tablePrefLabel: 'Tischwunsch & Notiz',
    tablePrefPlaceholder: 'z. B. Tisch mit Aussicht, Geburtstagsfeier, Nichtraucherbereich usw.',
    cancelBtn: 'Abbrechen',
    processingBtn: 'Wird verarbeitet...',
    reserveBtn: 'Tisch reservieren'
  },
  fr: {
    defaultNote: 'Préférence table avec vue sur le Bosphore / panoramique',
    phoneRequiredError: 'Veuillez saisir votre numéro de téléphone mobile pour la confirmation.',
    guestDefault: 'Client',
    requestTitlePrefix: 'Réservation de table',
    stageConfirming: 'Confirmation auprès du restaurant',
    successToastTitle: 'Demande de réservation reçue !',
    successToastDesc: (title, code) => `Votre code de réservation pour ${title} : ${code}. Notre équipe Concierge confirmera avec le restaurant.`,
    headerBadge: 'Réservation de table Concierge',
    hotelAndRoomInfo: 'Infos Hôtel & Chambre',
    conciergeGuarantee: 'Garantie Concierge',
    guestCountLabel: 'Nombre de convives *',
    dateLabel: 'Date *',
    timeLabel: 'Heure *',
    mobilePhoneLabel: 'Téléphone mobile *',
    mobilePhonePlaceholder: '+90 5xx xxx xx xx (Confirmation envoyée par SMS/WhatsApp)',
    fullNameLabel: 'Nom complet',
    fullNamePlaceholder: 'Ex. : David Miller',
    tablePrefLabel: 'Préférence de table & Notes',
    tablePrefPlaceholder: 'Ex. : Table avec vue, anniversaire, espace non-fumeur, etc.',
    cancelBtn: 'Annuler',
    processingBtn: 'Traitement...',
    reserveBtn: 'Réserver une table'
  }
};

export function RestaurantReservationModal({
  lang = "tr",
  restaurant,
  hotel,
  roomNumber,
  onClose
}: RestaurantReservationModalProps) {
  const t = getT(lang);
  const rm = RES_MODAL_I18N[lang] || RES_MODAL_I18N.en;
  const locRest = getLocalizedExperience(restaurant, lang);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('20:00');
  const [phone, setPhone] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>(rm.defaultNote);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  const timeSlots = ['12:30', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error(rm.phoneRequiredError);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const code = 'RES-' + Math.floor(100000 + Math.random() * 900000);
      const newBooking = XeniosStore.addBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber,
        experienceId: restaurant.id,
        experienceTitle: locRest.title,
        providerName: restaurant.provider,
        providerPhone: restaurant.phone || '',
        guestName: guestName.trim() || `${rm.guestDefault} (${t.room} ${roomNumber})`,
        guestPhone: phone.trim(),
        guestEmail: 'concierge@xenios.istanbul',
        guestCount,
        bookingDate: date,
        bookingTime: time,
        amount: 0,
        currency: 'TRY',
        status: 'confirmed'
      });

      FirestoreService.addBooking(newBooking);
      NotificationService.notifyRestaurantReservation(newBooking, specialNotes);

      FirestoreService.addRequest({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber,
        serviceKey: 'concierge',
        serviceTitle: `${rm.requestTitlePrefix}: ${locRest.title}`,
        notes: `${guestCount} ${t.guestCount} | ${rm.dateLabel.replace(' *', '')}: ${date} | ${rm.timeLabel.replace(' *', '')}: ${time} | Tel: ${phone} | Note: ${specialNotes} | Code: ${code}`,
        status: 'pending',
        stage: rm.stageConfirming
      });

      toast.success(rm.successToastTitle, {
        description: rm.successToastDesc(locRest.title, code)
      });

      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-scroll bg-black/50 backdrop-blur-sm p-3 sm:p-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center py-6">
        <div 
          className="luxury-service-card relative w-full max-w-lg animate-in zoom-in-95 flex flex-col overflow-hidden text-[#141414]"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] border-b border-[#C4B8A4] p-5 text-[#141414] relative shrink-0 flex items-center gap-3.5">
          <div className="shrink-0">
            <LuxuryCategoryIcon categoryKey="restaurants" className="w-12 h-12" />
          </div>
          <div className="space-y-0.5 pr-8 min-w-0">
            <span className="font-luxury-sans text-[10px] font-bold text-[#7D5E2A] uppercase tracking-wider block">
              {rm.headerBadge}
            </span>
            <h3 className="font-luxury-serif text-lg font-bold leading-snug text-[#141414] truncate">{locRest.title}</h3>
            <p className="font-luxury-sans text-xs text-[#5C4938] flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-[#8E7252] shrink-0" /> {restaurant.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 font-luxury-sans text-xs">
          {/* Hotel & Guest Room Info */}
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#C4B8A4] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#6B5A48] font-semibold block">{rm.hotelAndRoomInfo}</span>
              <strong className="text-[#141414] font-bold">Purely Istanbul — {t.room} {roomNumber}</strong>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-[#D8CBB8] text-[#7D5E2A] font-bold text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#8E7252]" /> {rm.conciergeGuarantee}
            </span>
          </div>

          {/* 1. Kişi Sayısı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#8E7252]" /> {rm.guestCountLabel}
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setGuestCount(num)}
                  className={`flex-1 py-2 rounded-xl font-bold transition text-xs cursor-pointer border ${
                    guestCount === num
                      ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] border-[#7D5E2A] text-white shadow-sm'
                      : 'bg-[#FAF8F4] hover:bg-[#EFE8DA] border-[#C4B8A4] text-[#221F1C]'
                  }`}
                >
                  {num} {num >= 8 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tarih & Saat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8E7252]" /> {rm.dateLabel}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8E7252]" /> {rm.timeLabel}
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] font-medium"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Cep Telefonu */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#8E7252]" /> {rm.mobilePhoneLabel}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={rm.mobilePhonePlaceholder}
              className="w-full text-xs p-3 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] font-medium"
            />
          </div>

          {/* 4. Ad Soyad (İsteğe Bağlı) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8E7252]" /> {rm.fullNameLabel}
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={rm.fullNamePlaceholder}
              className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] font-medium"
            />
          </div>

          {/* Masa / Özel İstek */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8E7252]" /> {rm.tablePrefLabel}
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder={rm.tablePrefPlaceholder}
              className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-xs font-bold text-[#141414] transition cursor-pointer"
            >
              {rm.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                rm.processingBtn
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> {rm.reserveBtn}
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

