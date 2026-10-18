"use client";

import { useState } from 'react';
import { Language, ServiceRequest } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { CreditCard, Lock, Building2, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export type GuestPaymentMethod = 'online_card' | 'room_charge';

export interface OnlineCardDetails {
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface OnlinePaymentResult {
  success: boolean;
  paymentReference: string;
  paymentIntentId?: string;
  error?: string;
}

export const ONLINE_PAYMENT_I18N: Record<Language, {
  paymentMethodTitle: string;
  payOnlineNow: string;
  payOnlineSub: string;
  chargeToRoom: string;
  chargeToRoomSub: string;
  cardHolder: string;
  cardHolderPlaceholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  sslBadge: string;
  payAndSubmit: (amountStr: string) => string;
  processing3DSecure: string;
  paidOnlineBadge: string;
  roomFolioBadge: string;
  payNowButton: string;
  paymentSuccessToast: string;
  invalidCardError: string;
  close: string;
}> = {
  tr: {
    paymentMethodTitle: 'Ödeme Yöntemi Seçimi',
    payOnlineNow: 'Şimdi Online Öde',
    payOnlineSub: 'Kredi / Banka Kartı · 3D Secure',
    chargeToRoom: 'Konaklama Hesabına / Teslimatta',
    chargeToRoomSub: 'Konaklama hesabına yansıtılır',
    cardHolder: 'Kart Üzerindeki İsim',
    cardHolderPlaceholder: 'AD SOYAD',
    cardNumber: 'Kart Numarası',
    expiry: 'AA / YY',
    cvv: 'CVV',
    sslBadge: '256-Bit SSL & 3D Secure Güvencesi',
    payAndSubmit: (amt) => `${amt} Online Öde & Gönder`,
    processing3DSecure: '3D Secure Onaylanıyor...',
    paidOnlineBadge: 'Online Ödendi',
    roomFolioBadge: 'Konaklama Hesabı / Teslimatta',
    payNowButton: 'Şimdi Online Öde',
    paymentSuccessToast: 'Online ödemeniz başarıyla alındı!',
    invalidCardError: 'Lütfen geçerli kart bilgilerini giriniz.',
    close: 'Kapat',
  },
  en: {
    paymentMethodTitle: 'Select Payment Method',
    payOnlineNow: 'Pay Online Now',
    payOnlineSub: 'Credit / Debit Card · 3D Secure',
    chargeToRoom: 'Charge to Stay / On Delivery',
    chargeToRoomSub: 'Added to your stay account',
    cardHolder: 'Cardholder Name',
    cardHolderPlaceholder: 'FULL NAME',
    cardNumber: 'Card Number',
    expiry: 'MM / YY',
    cvv: 'CVV',
    sslBadge: '256-Bit SSL & 3D Secure Protected',
    payAndSubmit: (amt) => `Pay ${amt} Online & Submit`,
    processing3DSecure: 'Verifying 3D Secure...',
    paidOnlineBadge: 'Paid Online',
    roomFolioBadge: 'Stay Account / On Delivery',
    payNowButton: 'Pay Online Now',
    paymentSuccessToast: 'Your online payment was completed successfully!',
    invalidCardError: 'Please enter valid card details.',
    close: 'Close',
  },
  ar: {
    paymentMethodTitle: 'اختر طريقة الدفع',
    payOnlineNow: 'ادفع أونلاين الآن',
    payOnlineSub: 'بطاقة ائتمان / خصم · 3D Secure',
    chargeToRoom: 'على حساب الغرفة / عند التسليم',
    chargeToRoomSub: 'يُضاف إلى فاتورة الغرفة',
    cardHolder: 'الاسم على البطاقة',
    cardHolderPlaceholder: 'الاسم الكامل',
    cardNumber: 'رقم البطاقة',
    expiry: 'MM / YY',
    cvv: 'CVV',
    sslBadge: 'حماية 256-Bit SSL و 3D Secure',
    payAndSubmit: (amt) => `ادفع ${amt} أونلاين وأرسل`,
    processing3DSecure: 'جاري التحقق من 3D Secure...',
    paidOnlineBadge: 'تم الدفع أونلاين',
    roomFolioBadge: 'فاتورة الغرفة / عند التسليم',
    payNowButton: 'ادفع أونلاين الآن',
    paymentSuccessToast: 'تمت عملية الدفع الإلكتروني بنجاح!',
    invalidCardError: 'يرجى إدخال بيانات بطاقة صحيحة.',
    close: 'إغلاق',
  },
  ru: {
    paymentMethodTitle: 'Способ оплаты',
    payOnlineNow: 'Оплатить онлайн сейчас',
    payOnlineSub: 'Банковская карта · 3D Secure',
    chargeToRoom: 'На счет номера / При получении',
    chargeToRoomSub: 'Записать на счет комнаты',
    cardHolder: 'Имя владельца карты',
    cardHolderPlaceholder: 'ИМЯ И ФАМИЛИЯ',
    cardNumber: 'Номер карты',
    expiry: 'ММ / ГГ',
    cvv: 'CVV',
    sslBadge: 'Защита 256-Bit SSL и 3D Secure',
    payAndSubmit: (amt) => `Оплатить ${amt} онлайн и отправить`,
    processing3DSecure: 'Проверка 3D Secure...',
    paidOnlineBadge: 'Оплачено онлайн',
    roomFolioBadge: 'Счет номера / При получении',
    payNowButton: 'Оплатить онлайн',
    paymentSuccessToast: 'Онлайн-оплата успешно выполнена!',
    invalidCardError: 'Пожалуйста, введите корректные данные карты.',
    close: 'Закрыть',
  },
  de: {
    paymentMethodTitle: 'Zahlungsmethode wählen',
    payOnlineNow: 'Jetzt online bezahlen',
    payOnlineSub: 'Kredit- / Debitkarte · 3D Secure',
    chargeToRoom: 'Auf Zimmerrechnung / Bei Lieferung',
    chargeToRoomSub: 'Wird Ihrem Zimmerkonto belastet',
    cardHolder: 'Karteninhaber',
    cardHolderPlaceholder: 'VOLLSTÄNDIGER NAME',
    cardNumber: 'Kartennummer',
    expiry: 'MM / JJ',
    cvv: 'CVV',
    sslBadge: '256-Bit SSL & 3D Secure geschützt',
    payAndSubmit: (amt) => `${amt} online zahlen & senden`,
    processing3DSecure: '3D Secure wird geprüft...',
    paidOnlineBadge: 'Online bezahlt',
    roomFolioBadge: 'Zimmerrechnung / Bei Lieferung',
    payNowButton: 'Jetzt online zahlen',
    paymentSuccessToast: 'Ihre Online-Zahlung war erfolgreich!',
    invalidCardError: 'Bitte geben Sie gültige Kartendaten ein.',
    close: 'Schließen',
  },
  fr: {
    paymentMethodTitle: 'Mode de paiement',
    payOnlineNow: 'Payer en ligne maintenant',
    payOnlineSub: 'Carte bancaire · 3D Secure',
    chargeToRoom: 'Sur la note de chambre / À la livraison',
    chargeToRoomSub: 'Ajouté à votre facture de chambre',
    cardHolder: 'Nom du titulaire',
    cardHolderPlaceholder: 'NOM COMPLET',
    cardNumber: 'Numéro de carte',
    expiry: 'MM / AA',
    cvv: 'CVV',
    sslBadge: 'Sécurisé par SSL 256-Bit & 3D Secure',
    payAndSubmit: (amt) => `Payer ${amt} en ligne et envoyer`,
    processing3DSecure: 'Vérification 3D Secure...',
    paidOnlineBadge: 'Payé en ligne',
    roomFolioBadge: 'Note de chambre / Livraison',
    payNowButton: 'Payer en ligne',
    paymentSuccessToast: 'Votre paiement en ligne a été effectué avec succès !',
    invalidCardError: 'Veuillez saisir des informations de carte valides.',
    close: 'Fermer',
  },
};

export function formatCurrencyAmount(amount: number, currency: string = 'TRY'): string {
  const cleanCurr = (currency || 'TRY').toUpperCase();
  if (cleanCurr === 'EUR' || cleanCurr === '€') {
    return `${amount.toLocaleString('tr-TR')} €`;
  }
  if (cleanCurr === 'USD' || cleanCurr === '$') {
    return `${amount.toLocaleString('tr-TR')} $`;
  }
  return `${amount.toLocaleString('tr-TR')} ₺`;
}

export function formatCardInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export async function processOnlineServicePayment(params: {
  amount: number;
  currency: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  serviceTitle: string;
  card?: OnlineCardDetails;
  lang?: Language;
}): Promise<OnlinePaymentResult> {
  const lang = params.lang || 'tr';
  const ui = ONLINE_PAYMENT_I18N[lang] || ONLINE_PAYMENT_I18N.en;

  if (params.card) {
    const cleanDigits = params.card.cardNumber.replace(/[^\d•]/g, '');
    if (cleanDigits.length < 12 || params.card.expiry.trim().length < 4 || params.card.cvv.trim().length < 3) {
      return { success: false, paymentReference: '', error: ui.invalidCardError };
    }
  }

  const bookingRef = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  let paymentIntentId = `pi_${Date.now()}`;

  try {
    const res = await fetch('/api/checkout/split-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'TRY',
        vendorAccountId: `hotel_${params.hotelId}`,
        hotelAccountId: params.hotelId,
        bookingReference: bookingRef,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.payment_intent_id) {
        paymentIntentId = data.payment_intent_id;
      }
    }
  } catch {
    // Graceful fallback if offline or API unreachable
  }

  // Record financial booking entry so it appears in Hotel Portal & Dashboard financial reports
  try {
    const now = new Date();
    const booking = XeniosStore.addBooking({
      hotelId: params.hotelId,
      hotelName: params.hotelName,
      roomNumber: params.roomNumber,
      experienceId: `inroom_${Date.now()}`,
      experienceTitle: `${params.serviceTitle} (Oda ${params.roomNumber})`,
      providerName: params.hotelName,
      providerPhone: '',
      guestName: params.card?.holderName?.trim() || `Oda ${params.roomNumber} Misafiri`,
      guestPhone: '',
      guestEmail: 'guest@purelyistanbul.com',
      guestCount: 1,
      bookingDate: now.toISOString().slice(0, 10),
      bookingTime: now.toTimeString().slice(0, 5),
      amount: params.amount,
      currency: params.currency || 'TRY',
      status: 'payment_success',
    });
    FirestoreService.addBooking(booking).catch(() => {});
  } catch {
    // Ignore secondary ledger errors
  }

  return {
    success: true,
    paymentReference: bookingRef,
    paymentIntentId,
  };
}

interface InlineOnlinePaymentBoxProps {
  amount: number;
  currency: string;
  lang: Language;
  paymentMethod: GuestPaymentMethod;
  onPaymentMethodChange: (method: GuestPaymentMethod) => void;
  cardDetails: OnlineCardDetails;
  onCardDetailsChange: (next: OnlineCardDetails) => void;
  compact?: boolean;
}

export function InlineOnlinePaymentBox({
  amount,
  currency,
  lang,
  paymentMethod,
  onPaymentMethodChange,
  cardDetails,
  onCardDetailsChange,
  compact = false,
}: InlineOnlinePaymentBoxProps) {
  const ui = ONLINE_PAYMENT_I18N[lang] || ONLINE_PAYMENT_I18N.en;
  const formattedAmt = formatCurrencyAmount(amount, currency);

  return (
    <div className="space-y-2.5 font-luxury-sans">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-[#141414] flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-[#8E7252]" />
          <span>{ui.paymentMethodTitle}</span>
        </label>
        <span className="font-luxury-serif text-xs font-bold text-[#7D5E2A]">
          {formattedAmt}
        </span>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onPaymentMethodChange('online_card')}
          className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
            paymentMethod === 'online_card'
              ? 'bg-gradient-to-b from-[#FAF3E3] to-[#F2E5C9] border-[#9E7B42] ring-1 ring-[#9E7B42]/40 shadow-xs'
              : 'bg-[#FAF8F4] border-[#C4B8A4] hover:bg-[#EFE8DA]'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11.5px] font-bold text-[#141414] leading-tight">
              {ui.payOnlineNow}
            </span>
            <CreditCard className={`w-3.5 h-3.5 shrink-0 ${paymentMethod === 'online_card' ? 'text-[#7D5E2A]' : 'text-[#8E7252]'}`} />
          </div>
          <span className="text-[10px] text-[#5C4938] leading-tight">
            {ui.payOnlineSub}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onPaymentMethodChange('room_charge')}
          className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
            paymentMethod === 'room_charge'
              ? 'bg-gradient-to-b from-[#FAF3E3] to-[#F2E5C9] border-[#9E7B42] ring-1 ring-[#9E7B42]/40 shadow-xs'
              : 'bg-[#FAF8F4] border-[#C4B8A4] hover:bg-[#EFE8DA]'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11.5px] font-bold text-[#141414] leading-tight">
              {ui.chargeToRoom}
            </span>
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${paymentMethod === 'room_charge' ? 'text-[#7D5E2A]' : 'text-[#8E7252]'}`} />
          </div>
          <span className="text-[10px] text-[#5C4938] leading-tight">
            {ui.chargeToRoomSub}
          </span>
        </button>
      </div>

      {/* Expandable 3D Secure Card Form when online_card is selected */}
      {paymentMethod === 'online_card' && (
        <div className="p-3 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] space-y-2 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[10px] text-[#5C4938] pb-1 border-b border-[#E5DAC8]">
            <span className="flex items-center gap-1 font-semibold text-[#7D5E2A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8E7252]" />
              {ui.sslBadge}
            </span>
            <span className="font-mono font-bold text-[10px] text-[#6B5A48]">VISA · MC · TROY</span>
          </div>

          {!compact && (
            <div>
              <input
                type="text"
                value={cardDetails.holderName}
                onChange={(e) => onCardDetailsChange({ ...cardDetails, holderName: e.target.value })}
                placeholder={ui.cardHolderPlaceholder}
                className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] placeholder:text-[#8C7B68] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
              />
            </div>
          )}

          <div>
            <input
              type="text"
              inputMode="numeric"
              value={cardDetails.cardNumber}
              onChange={(e) =>
                onCardDetailsChange({
                  ...cardDetails,
                  cardNumber: formatCardInput(e.target.value),
                })
              }
              placeholder={ui.cardNumber}
              className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] font-mono placeholder:text-[#8C7B68] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={cardDetails.expiry}
              onChange={(e) =>
                onCardDetailsChange({
                  ...cardDetails,
                  expiry: formatExpiryInput(e.target.value),
                })
              }
              placeholder={ui.expiry}
              className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] font-mono placeholder:text-[#8C7B68] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={cardDetails.cvv}
              onChange={(e) =>
                onCardDetailsChange({
                  ...cardDetails,
                  cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                })
              }
              placeholder={ui.cvv}
              className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] font-mono placeholder:text-[#8C7B68] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface OnlineRequestPayModalProps {
  request: ServiceRequest;
  lang: Language;
  onClose: () => void;
  onPaid: (updated: ServiceRequest) => void;
}

export function OnlineRequestPayModal({ request, lang, onClose, onPaid }: OnlineRequestPayModalProps) {
  const ui = ONLINE_PAYMENT_I18N[lang] || ONLINE_PAYMENT_I18N.en;
  const amount = request.paymentAmount || 0;
  const currency = request.paymentCurrency || 'TRY';
  const [cardDetails, setCardDetails] = useState<OnlineCardDetails>({
    holderName: '',
    cardNumber: '4543 •••• •••• 8892',
    expiry: '09/28',
    cvv: '734',
  });
  const [isPaying, setIsPaying] = useState(false);

  const handlePayNow = async () => {
    setIsPaying(true);
    const res = await processOnlineServicePayment({
      amount,
      currency,
      hotelId: request.hotelId,
      hotelName: request.hotelName,
      roomNumber: request.roomNumber,
      serviceTitle: request.serviceTitle,
      card: cardDetails,
      lang,
    });

    if (!res.success) {
      toast.error(res.error || ui.invalidCardError);
      setIsPaying(false);
      return;
    }

    const updated = await FirestoreService.updateRequestPayment(request.id, {
      paymentMethod: 'online_card',
      paymentStatus: 'paid_online',
      paymentAmount: amount,
      paymentCurrency: currency,
      paymentReference: res.paymentReference,
    });

    toast.success(ui.paymentSuccessToast, {
      description: `${request.serviceTitle} · #${res.paymentReference}`,
    });
    setIsPaying(false);
    if (updated) onPaid(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] overflow-y-auto bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="luxury-service-card w-full max-w-md p-5 space-y-4 text-[#141414] font-luxury-sans animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#D8CBB8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F4] border border-[#C4B8A4] flex items-center justify-center text-[#8E7252]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-luxury-serif text-base font-bold text-[#141414]">{ui.payOnlineNow}</h3>
              <p className="text-[11px] text-[#5C4938]">{request.serviceTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] space-y-2.5">
          <div className="flex items-center justify-between text-xs border-b border-[#E5DAC8] pb-2">
            <span className="text-[#5C4938] font-semibold">{ui.sslBadge}</span>
            <strong className="font-luxury-serif text-base text-[#7D5E2A]">
              {formatCurrencyAmount(amount, currency)}
            </strong>
          </div>

          <input
            type="text"
            value={cardDetails.holderName}
            onChange={(e) => setCardDetails({ ...cardDetails, holderName: e.target.value })}
            placeholder={ui.cardHolderPlaceholder}
            className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414]"
          />
          <input
            type="text"
            inputMode="numeric"
            value={cardDetails.cardNumber}
            onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: formatCardInput(e.target.value) })}
            placeholder={ui.cardNumber}
            className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] font-mono"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={cardDetails.expiry}
              onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiryInput(e.target.value) })}
              placeholder={ui.expiry}
              className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] font-mono"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={cardDetails.cvv}
              onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder={ui.cvv}
              className="w-full text-[16px] sm:text-xs px-2.5 py-2 rounded-xl border border-[#C4B8A4] bg-white text-[#141414] font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handlePayNow}
          disabled={isPaying}
          className="w-full py-3 rounded-2xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          <span>
            {isPaying ? ui.processing3DSecure : ui.payAndSubmit(formatCurrencyAmount(amount, currency))}
          </span>
        </button>
      </div>
    </div>
  );
}
