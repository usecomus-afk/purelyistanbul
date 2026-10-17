"use client";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { AvailableTimeSlot } from '@/types/aesthetic';
import { getT } from '@/lib/i18n';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Phone,
  User,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="luxury-service-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#C4B8A4] flex items-center justify-between gap-3 bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="shrink-0">
              <LuxuryCategoryIcon categoryKey="aesthetic" className="w-12 h-12" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-luxury-sans text-[10px] uppercase font-bold text-[#7D5E2A] tracking-wider block truncate">
                {t.categoriesList.aesthetic?.title || "Medikal Estetik & Güzellik"}
              </span>
              <h2 className="font-luxury-serif text-base sm:text-lg font-bold text-[#141414] leading-snug line-clamp-1" title={experience.title}>
                {experience.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] border border-[#C4B8A4] flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <X className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-luxury-sans text-xs">

          {step === 'SELECT_SLOT' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8E7252] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#3D352E]">
                  <strong className="text-[#141414] block font-bold">Sağlayıcı: {experience.provider} ({experience.location})</strong>
                  <span>Tarih ve saat seçtiğinizde kliniğin CRM takvimi anlık kilitlenir.</span>
                </div>
              </div>

              {/* Date Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1.5">
                  Randevu Tarihi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>
              </div>

              {/* Live Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase font-bold text-[#5C4938]">
                    Müsait Saat Dilimleri (Canlı CRM)
                  </label>
                  {isLoadingSlots && (
                    <span className="text-[10px] text-[#7D5E2A] flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" /> CRM Sorgulanıyor...
                    </span>
                  )}
                </div>

                {isLoadingSlots ? (
                  <div className="py-8 text-center text-[#5C4938]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8E7252] mb-2" />
                    <span>Kliniğin uygun seansları çekiliyor...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-center text-[#5C4938]">
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
                        className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                          !s.is_available
                            ? 'bg-[#EFE8DA]/60 border-[#D8CBB8] text-[#9E9589] cursor-not-allowed line-through'
                            : 'bg-[#FAF8F4] hover:bg-[#EFE8DA] border-[#C4B8A4] text-[#141414] font-bold hover:border-[#8E7252] shadow-2xs'
                        }`}
                      >
                        <span className="block text-xs">{s.start_time}</span>
                        <span className="text-[9px] text-[#6B5A48] font-normal">
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
                  className="w-full py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition cursor-pointer text-center"
                >
                  Kapat / Vazgeç
                </button>
              </div>
            </div>
          )}

          {step === 'GUEST_FORM' && selectedSlot && (
            <form onSubmit={handleBookSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-[#141414] text-[11px] flex items-center justify-between font-medium">
                <div>
                  <strong className="text-[#7D5E2A]">Seçilen Randevu:</strong> {selectedDate} • {selectedSlot.start_time} - {selectedSlot.end_time}
                </div>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="text-[10px] text-[#7D5E2A] underline font-bold cursor-pointer"
                >
                  Değiştir
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Adınız Soyadınız *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Alex Mercer"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Telefon / WhatsApp *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+90 532 ..."
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">E-Posta (İsteğe bağlı)</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Özel İstek / Sağlık Notu</label>
                  <textarea
                    rows={2}
                    placeholder="Varsa alerjileriniz veya kliniğe iletmek istediğiniz özel notunuz..."
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="w-1/3 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition cursor-pointer"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>CRM&apos;e İletiliyor...</span>
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
              <div className="w-16 h-16 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#C5A059] text-[#7D5E2A] mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">Randevunuz Onaylandı!</h3>
                <p className="text-xs text-[#5C4938] mt-1">
                  Randevu kaydı kliniğin takvimine işlendi. Konakladığınız otel ({hotel.name}) koordinatörlüğü ile klinik karşılamanız organize edilecektir.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Klinik:</span>
                  <strong className="text-[#141414]">{experience.provider}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Tarih & Saat:</span>
                  <strong className="text-[#141414]">{selectedDate} - {selectedSlot?.start_time}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Misafir:</span>
                  <strong className="text-[#141414]">{guestName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Kayıt Referansı:</span>
                  <strong className="text-[#7D5E2A] font-mono font-bold">{confirmedBookingId}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition cursor-pointer"
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
