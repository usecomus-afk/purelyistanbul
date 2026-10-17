"use client";

import { NotificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firestore-service";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { getT } from '@/lib/i18n';
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

export function RestaurantReservationModal({
  lang = "tr",
  restaurant,
  hotel,
  roomNumber,
  onClose
}: RestaurantReservationModalProps) {
  const t = getT(lang);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('20:00');
  const [phone, setPhone] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('Boğaz / Manzaralı masa tercihi');
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
      toast.error('Lütfen rezervasyon teyidi için cep telefonu numaranızı girin.');
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
        experienceTitle: restaurant.title,
        providerName: restaurant.provider,
        providerPhone: restaurant.phone || '',
        guestName: guestName.trim() || `Misafir (Oda ${roomNumber})`,
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

      XeniosStore.addRequest({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber,
        serviceKey: 'concierge',
        serviceTitle: `Masa Rezervasyonu: ${restaurant.title}`,
        notes: `${guestCount} Kişi | Tarih: ${date} | Saat: ${time} | Tel: ${phone} | Not: ${specialNotes} | Kod: ${code}`,
        status: 'pending',
        stage: 'Restoran Teyidi Alınıyor'
      });

      toast.success('Masa Rezervasyon Talebiniz Alındı!', {
        description: `${restaurant.title} için rezervasyon kodunuz: ${code}. Concierge ekibimiz restoran ile teyitleşip onay iletecektir.`
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
              Concierge Masa Rezervasyonu
            </span>
            <h3 className="font-luxury-serif text-lg font-bold leading-snug text-[#141414] truncate">{restaurant.title}</h3>
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
              <span className="text-[10px] text-[#6B5A48] font-semibold block">Otel & Oda Bilgisi</span>
              <strong className="text-[#141414] font-bold">{hotel.name} — Oda {roomNumber}</strong>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-[#D8CBB8] text-[#7D5E2A] font-bold text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#8E7252]" /> Concierge Güvencesi
            </span>
          </div>

          {/* 1. Kişi Sayısı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#8E7252]" /> Kişi Sayısı *
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
                <Calendar className="w-3.5 h-3.5 text-[#8E7252]" /> Tarih *
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
                <Clock className="w-3.5 h-3.5 text-[#8E7252]" /> Saat *
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
              <Phone className="w-3.5 h-3.5 text-[#8E7252]" /> Cep Telefonu *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5xx xxx xx xx (Rezervasyon onayı SMS/WhatsApp ile iletilir)"
              className="w-full text-xs p-3 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] font-medium"
            />
          </div>

          {/* 4. Ad Soyad (İsteğe Bağlı) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8E7252]" /> Adınız & Soyadınız
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Örn: David Miller / Ayşe Yılmaz"
              className="w-full text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] font-medium"
            />
          </div>

          {/* Masa / Özel İstek */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#141414] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8E7252]" /> Masa Tercihi & Not
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Örn: Manzaralı masa, doğum günü kutlaması, sigarasız alan vb."
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
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                'İşleniyor...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Masa Rezerve Et
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
