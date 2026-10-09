"use client";

import { NotificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firestore-service";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { getT } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Utensils, Users, Calendar, Clock, Phone, User, Sparkles, X, CheckCircle2, ShieldCheck, MapPin
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

      // Also create a service request so the hotel cockpit concierge is alerted
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
      className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-3 sm:p-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center py-6">
        <div 
          className="relative w-full max-w-lg bg-white   rounded-3xl shadow-2xl border border-amber-200 animate-in zoom-in-95 flex flex-col overflow-hidden text-slate-900 "
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-amber-950 p-5 text-white relative rounded-t-3xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Xenios Concierge Masa Rezervasyonu
            </span>
            <h3 className="text-lg font-bold font-serif leading-snug">{restaurant.title}</h3>
            <p className="text-xs text-zinc-300 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" /> {restaurant.location}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Hotel & Guest Room Info */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500  font-semibold block">Otel & Oda Bilgisi</span>
              <strong className="text-slate-900  font-bold">{hotel.name} — Oda {roomNumber}</strong>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-700" /> Concierge Güvencesi
            </span>
          </div>

          {/* 1. Kişi Sayısı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800  flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" /> Kişi Sayısı *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setGuestCount(num)}
                  className={`flex-1 py-2 rounded-xl font-bold transition text-xs cursor-pointer border ${
                    guestCount === num
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-zinc-50 hover:bg-amber-50 border-zinc-200 text-slate-700'
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
              <label className="text-xs font-bold text-slate-800  flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Tarih *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white   focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900  font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800  flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Saat *
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white   focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900  font-medium"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Cep Telefonu */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800  flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-600" /> Cep Telefonu *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5xx xxx xx xx (Rezervasyon onayı SMS/WhatsApp ile iletilir)"
              className="w-full text-xs p-3 rounded-xl border border-amber-200 bg-white   focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900  font-medium"
            />
          </div>

          {/* 4. Ad Soyad (İsteğe Bağlı) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800  flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" /> Adınız & Soyadınız
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Örn: David Miller / Ayşe Yılmaz"
              className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white   focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900  font-medium"
            />
          </div>

          {/* Masa / Özel İstek */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800  flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Masa Tercihi & Not
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Örn: Manzaralı masa, doğum günü kutlaması, sigarasız alan vb."
              className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white   focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 "
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-slate-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
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
