"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { XeniosStore } from '@/lib/store';
import { Booking } from '@/lib/types';
import { CheckCircle2, Calendar, Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ConfirmBookingPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (bookingId) {
      const b = XeniosStore.getBookings().find(item => item.id === bookingId);
      if (b) {
        setBooking(b);
        if (b.status === 'confirmed') setIsConfirmed(true);
      }
    }
  }, [bookingId]);

  const handleApprove = () => {
    if (bookingId) {
      XeniosStore.updateBookingStatus(bookingId, 'confirmed');
      setIsConfirmed(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f8f6f0] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-3xl border border-amber-200 text-center space-y-2">
          <p className="text-xs text-zinc-600 dark:text-slate-400">Rezervasyon kaydı bulunamadı veya süre aşımına uğradı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] flex items-center justify-center p-4 text-zinc-900 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-xl border border-amber-200 space-y-4">
        <div className="text-center space-y-1 border-b border-amber-100 pb-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
            İlan Sahibi Onay Paneli (SMS/E-posta Simülasyonu)
          </span>
          <h1 className="text-lg font-bold font-serif text-zinc-900 dark:text-slate-100 mt-2">{booking.providerName}</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">Gelen Rezervasyon Talebi ve Onay Masası</p>
        </div>

        {/* Booking Details */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/70 space-y-2 text-xs">
          <div className="flex justify-between border-b border-amber-100 pb-1.5">
            <span className="text-zinc-500 dark:text-slate-400">Deneyim:</span>
            <strong className="text-zinc-900 dark:text-slate-100 font-bold">{booking.experienceTitle}</strong>
          </div>
          <div className="flex justify-between border-b border-amber-100 pb-1.5">
            <span className="text-zinc-500 dark:text-slate-400">Misafir & Otel:</span>
            <strong className="text-zinc-900 dark:text-slate-100">{booking.guestName} ({booking.hotelName} - Oda {booking.roomNumber})</strong>
          </div>
          <div className="flex justify-between border-b border-amber-100 pb-1.5">
            <span className="text-zinc-500 dark:text-slate-400">Tarih & Saat:</span>
            <strong className="text-zinc-900 dark:text-slate-100">{booking.bookingDate} - {booking.bookingTime}</strong>
          </div>
          <div className="flex justify-between border-b border-amber-100 pb-1.5">
            <span className="text-zinc-500 dark:text-slate-400">Kişi Sayısı & Tutar:</span>
            <strong className="text-zinc-900 dark:text-slate-100 font-mono">{booking.guestCount} Kişi • {booking.amount} {booking.currency} (Ödendi)</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-slate-400">Misafir Telefon:</span>
            <strong className="text-zinc-900 dark:text-slate-100 font-mono">{booking.guestPhone}</strong>
          </div>
        </div>

        {isConfirmed ? (
          <div className="text-center space-y-3 pt-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-800">Rezervasyon Başarıyla Onaylandı!</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">Misafire SMS onayı ve Google Takvim bağlantısı iletildi.</p>
            </div>

            {booking.calendarLink && (
              <a
                href={booking.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Google Takvime Ekle</span>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <button
              onClick={handleApprove}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Rezervasyonu Onayla ve Takvimi Başlat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
