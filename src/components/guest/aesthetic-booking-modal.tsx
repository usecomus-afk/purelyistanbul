"use client";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { AvailableTimeSlot } from '@/types/aesthetic';
import { getT } from '@/lib/i18n';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ShieldCheck,
  Building2,
  Phone,
  User,
  Mail,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface AestheticBookingModalProps {
  experience: Experience;
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  onClose: () => void;
}

export function AestheticBookingModal({
  experience,
  hotel,
  roomNumber,
  lang,
  onClose
}: AestheticBookingModalProps) {
  const t = getT(lang);

  const [step, setStep] = useState<'SELECT_SLOT' | 'GUEST_FORM' | 'SUCCESS'>('SELECT_SLOT');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  // Guest Form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  // Clinic mapping
  const clinicId = `clinic_${experience.id.replace('exp_aesthetic_', '')}`;
  const serviceId = `srv_${experience.id.replace('exp_aesthetic_', '')}`;

  // ESC key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function fetchSlots() {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/aesthetic/slots?clinicId=${clinicId}&serviceId=${serviceId}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        }
      } catch (err) {
        console.warn('Failed to load slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [clinicId, serviceId, selectedDate]);

  const handleSlotSelect = (slot: AvailableTimeSlot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setStep('GUEST_FORM');
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !selectedSlot) {
      toast.error('Lütfen adınızı ve telefon numaranızı giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/aesthetic/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          service_id: serviceId,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_email: guestEmail,
          hotel_id: hotel.id,
          room_number: roomNumber,
          appointment_date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          notes: guestNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmedBookingId(data.booking?.id || 'APT_CONFIRMED');
        setStep('SUCCESS');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Randevunuz kliniğin canlı CRM sistemine işlendi ve onaylandı.');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Randevu oluşturulamadı.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white border border-rose-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50 to-orange-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-200 flex items-center justify-center p-1 shadow-xs shrink-0">
              <Image 
                src="/icons/categories/aesthetic-beauty.png" 
                alt="Aesthetic & Beauty" 
                width={40} 
                height={40} 
                className="w-full h-full object-contain scale-110"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block truncate">
                {t.categoriesList.aesthetic?.title || "Medikal Estetik & Güzellik"}
              </span>
              <h2 className="text-xs sm:text-sm font-bold font-serif text-zinc-900 leading-snug line-clamp-1" title={experience.title}>
                {experience.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-white hover:bg-rose-100 text-zinc-600 hover:text-zinc-900 border border-rose-200 flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">

          {step === 'SELECT_SLOT' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-600">
                  <strong className="text-zinc-900 block font-medium">Sağlayıcı: {experience.provider} ({experience.location})</strong>
                  <span>Tarih ve saat seçtiğinizde kliniğin CRM takvimi anlık kilitlenir.</span>
                </div>
              </div>

              {/* Date Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">
                  Randevu Tarihi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Live Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">
                    Müsait Saat Dilimleri (Canlı CRM)
                  </label>
                  {isLoadingSlots && (
                    <span className="text-[10px] text-rose-600 flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" /> CRM Sorgulanıyor...
                    </span>
                  )}
                </div>

                {isLoadingSlots ? (
                  <div className="py-8 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                    <span>Kliniğin uygun seansları çekiliyor...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-center text-zinc-500">
                    Seçilen tarihte uygun seans bulunamadı. Lütfen başka bir gün seçiniz.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!s.is_available}
                        onClick={() => handleSlotSelect(s)}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          !s.is_available
                            ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through'
                            : 'bg-white hover:bg-rose-50/80 border-rose-200 text-zinc-900 font-bold hover:border-rose-400 shadow-2xs'
                        }`}
                      >
                        <span className="block text-xs">{s.start_time}</span>
                        <span className="text-[9px] text-zinc-500 font-normal">
                          {s.is_available ? `${experience.price} ${experience.currency}` : 'Dolu'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Close Button for Step 1 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer text-center"
                >
                  Kapat / Vazgeç
                </button>
              </div>
            </div>
          )}

          {step === 'GUEST_FORM' && selectedSlot && (
            <form onSubmit={handleBookSubmit} className="space-y-3.5">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-[11px] flex items-center justify-between font-medium">
                <div>
                  <strong>Seçilen Randevu:</strong> {selectedDate} • {selectedSlot.start_time} - {selectedSlot.end_time}
                </div>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="text-[10px] text-rose-700 underline font-bold cursor-pointer"
                >
                  Değiştir
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Adınız Soyadınız *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Alex Mercer"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Telefon / WhatsApp *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+90 532 ..."
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">E-Posta (İsteğe bağlı)</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Özel İstek / Sağlık Notu</label>
                  <textarea
                    rows={2}
                    placeholder="Varsa alerjileriniz veya kliniğe iletmek istediğiniz özel notunuz..."
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="w-1/3 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>CRM'e İletiliyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Randevuyu Onayla ({experience.price} {experience.currency})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Randevunuz Onaylandı!</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Randevu kaydı kliniğin takvimine işlendi. Konakladığınız otel ({hotel.name}) koordinatörlüğü ile klinik karşılamanız organize edilecektir.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Klinik:</span>
                  <strong className="text-zinc-900">{experience.provider}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tarih & Saat:</span>
                  <strong className="text-zinc-900">{selectedDate} - {selectedSlot?.start_time}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Misafir:</span>
                  <strong className="text-zinc-900">{guestName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kayıt Referansı:</span>
                  <strong className="text-rose-900 font-mono font-bold">{confirmedBookingId}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
