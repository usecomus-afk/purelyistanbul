"use client";

import { NotificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firestore-service";

import { Experience, Hotel, Language, Booking } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLocalizedExperience } from '@/lib/experience-i18n';
import { formatPrice, generateCalendarUrl } from '@/lib/utils';
import { XeniosStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CreditCard, Lock, CheckCircle2, Calendar, X } from 'lucide-react';

interface VirtualPosModalProps {
  experience: Experience;
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  onClose: () => void;
}

const POS_I18N: Record<Language, {
  code: string;
  close: string;
  guestInfo: string;
  fullName: string;
  phoneSms: string;
}> = {
  tr: {
    code: 'Kod',
    close: 'Kapat',
    guestInfo: 'Misafir Bilgileri',
    fullName: 'Ad Soyad',
    phoneSms: 'Telefon / SMS'
  },
  en: {
    code: 'Code',
    close: 'Close',
    guestInfo: 'Guest Details',
    fullName: 'Full Name',
    phoneSms: 'Phone / SMS'
  },
  ar: {
    code: 'الرمز',
    close: 'إغلاق',
    guestInfo: 'بيانات الضيف',
    fullName: 'الاسم الكامل',
    phoneSms: 'الهاتف / SMS'
  },
  ru: {
    code: 'Код',
    close: 'Закрыть',
    guestInfo: 'Данные гостя',
    fullName: 'Имя и фамилия',
    phoneSms: 'Телефон / SMS'
  },
  de: {
    code: 'Code',
    close: 'Schließen',
    guestInfo: 'Gästedaten',
    fullName: 'Vollständiger Name',
    phoneSms: 'Telefon / SMS'
  },
  fr: {
    code: 'Code',
    close: 'Fermer',
    guestInfo: 'Informations client',
    fullName: 'Nom complet',
    phoneSms: 'Téléphone / SMS'
  }
};

export function VirtualPosModal({ experience, hotel, roomNumber, lang, onClose }: VirtualPosModalProps) {
  const t = getT(lang);
  const posUi = POS_I18N[lang] || POS_I18N.en;
  const locExp = getLocalizedExperience(experience, lang);
  const [guestName, setGuestName] = useState('Alex Mercer');
  const [guestPhone, setGuestPhone] = useState('+90 532 555 44 33');
  const [guestEmail] = useState('alex.mercer@gmail.com');
  const [guestCount, setGuestCount] = useState(2);
  const [bookingDate, setBookingDate] = useState('2026-08-16');
  const [bookingTime] = useState('19:30');

  const [cardNumber, setCardNumber] = useState('4543 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('734');

  const [isProcessing, setIsProcessing] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  const totalAmount = experience.price * guestCount;

  const handlePay = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const booking = XeniosStore.addBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber: roomNumber,
        experienceId: experience.id,
        experienceTitle: locExp.title,
        providerName: experience.provider,
        providerPhone: experience.phone,
        guestName,
        guestPhone,
        guestEmail,
        guestCount,
        bookingDate,
        bookingTime,
        amount: totalAmount,
        currency: experience.currency,
        status: 'payment_success',
        calendarLink: generateCalendarUrl(
          locExp.title,
          `${experience.provider} - ${locExp.agentNote}\n${hotel.name} (${t.room} ${roomNumber})`,
          experience.location,
          bookingDate,
          bookingTime
        )
      });

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      FirestoreService.addBooking(booking);
      NotificationService.notifyBookingCreated(booking);
      setCreatedBooking(booking);
      setIsProcessing(false);
      toast.success(t.posSuccess);
    }, 1200);
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
          className="luxury-service-card relative w-full max-w-lg p-5 sm:p-6 my-auto space-y-4 animate-in zoom-in-95 text-[#141414]"
          onClick={(e) => e.stopPropagation()}
        >
        
        {createdBooking ? (
          /* Success Screen */
          <div className="text-center space-y-4 py-2 font-luxury-sans">
            <div className="w-16 h-16 bg-[#FAF8F4] border-[1.5px] border-[#C5A059] text-[#7D5E2A] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[1.75]" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-[#7D5E2A] bg-[#FAF8F4] border border-[#C4B8A4] px-3 py-1 rounded-full">
                {posUi.code}: {createdBooking.confirmationCode}
              </span>
              <h3 className="font-luxury-serif text-xl font-bold text-[#141414] mt-2.5">{t.posSuccess}</h3>
              <p className="text-xs text-[#5C4938] mt-1 max-w-xs mx-auto">
                {createdBooking.experienceTitle} ({createdBooking.guestCount} {t.guestCount})
              </p>
            </div>

            {/* Provider SMS Notice Box */}
            <div className="bg-[#FAF8F4]/90 p-3.5 rounded-2xl border border-[#C4B8A4] text-xs text-[#221F1C] text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#7D5E2A]">
                <span>{t.posSmsNotice}</span>
              </div>
            </div>

            {/* Google Calendar Sync Action */}
            <div className="pt-2 space-y-2">
              <a
                href={createdBooking.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.addToCalendar}</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] border border-[#C4B8A4] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {posUi.close}
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <div className="space-y-4 font-luxury-sans">
            <div className="flex items-center justify-between border-b border-[#D8CBB8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F4] border border-[#C4B8A4] text-[#8E7252] flex items-center justify-center shadow-2xs">
                  <CreditCard className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="font-luxury-serif text-base font-bold uppercase tracking-[0.04em] text-[#141414]">{t.posTitle}</h3>
                  <p className="text-[11px] text-[#5C4938]">3D Secure 256-Bit SSL</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] hover:bg-[#EFE8DA] flex items-center justify-center text-[#141414] font-bold cursor-pointer">
                <X className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-[#FAF8F4]/90 p-3.5 rounded-2xl border border-[#C4B8A4] flex items-center justify-between text-xs">
              <div>
                <strong className="font-luxury-serif text-sm font-bold text-[#141414] block">{locExp.title}</strong>
                <span className="text-[#5C4938]">{experience.provider} • {t.room} {roomNumber}</span>
              </div>
              <div className="text-right">
                <span className="font-luxury-serif text-lg font-bold text-[#7D5E2A]">{formatPrice(totalAmount, experience.currency)}</span>
                <span className="text-[10px] text-[#6B5A48] block">{guestCount} {t.guestCount}</span>
              </div>
            </div>

            {/* Guest Details */}
            <div className="space-y-2">
              <h4 className="font-luxury-serif text-sm font-bold uppercase tracking-[0.04em] text-[#141414]">{posUi.guestInfo}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#5C4938]">{posUi.fullName}</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#5C4938]">{posUi.phoneSms}</label>
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] font-mono focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#5C4938]">{t.date}</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#5C4938]">{t.guestCount}</label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} {t.guestCount}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Credit Card Input Form */}
            <div className="space-y-2 pt-2 border-t border-[#D8CBB8]">
              <h4 className="font-luxury-serif text-sm font-bold uppercase tracking-[0.04em] text-[#141414]">{t.posCardNumber}</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={t.posCardNumber}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] font-mono focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder={t.posExpiry}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] font-mono focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                  />
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder={t.posCvv}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] font-mono focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessing ? "3D Secure..." : `${formatPrice(totalAmount, experience.currency)} ${t.posPayButton}`}</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
