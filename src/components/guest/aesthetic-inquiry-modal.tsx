"use client";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Phone,
  User,
  Mail,
  Send,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AestheticInquiryModalProps {
  experience: Experience;
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  onClose: () => void;
}

export function AestheticInquiryModal({
  experience,
  hotel,
  roomNumber,
  lang,
  onClose
}: AestheticInquiryModalProps) {
  const t = getT(lang);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLeadId] = useState<string | null>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<'WHATSAPP' | 'EMAIL' | 'PHONE'>('WHATSAPP');
  const [message, setMessage] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      toast.error('Lütfen Ad Soyad ve İletişim Numaranızı giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/aesthetic/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          service_id: serviceId,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          preferred_contact_method: contactMethod,
          message,
          hotel_id: hotel.id,
          room_number: roomNumber
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLeadId(data.lead_id || 'LEAD_SENT');
        setIsSuccess(true);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
        toast.success('Talebiniz kliniğe iletildi. Detaylar WhatsApp/SMS ile tarafınıza gönderilmiştir.');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Talep gönderilemedi.');
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-luxury-sans text-xs">

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] text-left flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#8E7252] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#3D352E] leading-relaxed">
                  <strong className="text-[#141414] block font-bold">Sağlayıcı: {experience.provider} ({experience.location})</strong>
                  <span>Tedavi paketleri, fiyat detayları veya hekim konsültasyonu hakkında klinik danışmanları en kısa sürede sizinle iletişime geçecektir.</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Adınız Soyadınız *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Adınız ve Soyadınız"
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
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">E-Posta Adresi</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="ornek@mail.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1.5">
                    Nasıl İletişime Geçilmesini İstersiniz?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'WHATSAPP', label: 'WhatsApp' },
                      { id: 'PHONE', label: 'Telefon' },
                      { id: 'EMAIL', label: 'E-Posta' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setContactMethod(opt.id as any)}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                          contactMethod === opt.id
                            ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white border-[#7D5E2A] shadow-2xs'
                            : 'bg-[#FAF8F4] text-[#221F1C] border-[#C4B8A4] hover:bg-[#EFE8DA]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">
                    Merak Ettiğiniz Sorular / Özel Notunuz
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tedavi süreci, konaklama veya fiyatlar hakkında sormak istedikleriniz..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition cursor-pointer text-center"
                >
                  Vazgeç / Kapat
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kliniğe İletiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Talebi Kliniğe İlet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#C5A059] text-[#7D5E2A] mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">Bilgi Talebiniz Kliniğe İletildi!</h3>
                <p className="text-xs text-[#5C4938] mt-1">
                  Klinik hasta koordinatörleri seçtiğiniz iletişim kanalı ({contactMethod}) üzerinden en kısa sürede tarafınıza dönüş sağlayacaktır.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-[#141414] text-left space-y-1 text-[11px] font-medium">
                <div className="flex items-center gap-1.5 font-bold text-[#7D5E2A]">
                  <Sparkles className="w-3.5 h-3.5 text-[#8E7252]" />
                  <span>purelyİstanbul Medikal Konsiyerj Bildirimi</span>
                </div>
                <p className="text-[10px] text-[#5C4938]">
                  Talebinizin detayları ve takip linki SMS/WhatsApp üzerinden iletilmiştir.
                </p>
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
