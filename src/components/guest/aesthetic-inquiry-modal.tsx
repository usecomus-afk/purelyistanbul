"use client";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { 
  X, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ShieldCheck,
  Building2,
  Phone,
  User,
  Mail,
  Send,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Image from 'next/image';

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
  const [leadId, setLeadId] = useState<string | null>(null);

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<'WHATSAPP' | 'EMAIL' | 'PHONE'>('WHATSAPP');
  const [message, setMessage] = useState('');

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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-left flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-600 leading-relaxed">
                  <strong className="text-zinc-900 block font-medium">Sağlayıcı: {experience.provider} ({experience.location})</strong>
                  <span>Tedavi paketleri, fiyat detayları veya hekim konsültasyonu hakkında klinik danışmanları en kısa sürede sizinle iletişime geçecektir.</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Adınız Soyadınız *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Adınız ve Soyadınız"
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
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">E-Posta Adresi</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="ornek@mail.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">
                    Nasıl İletişime Geçilmesini İstersiniz?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'WHATSAPP', label: '💬 WhatsApp' },
                      { id: 'PHONE', label: '📞 Telefon' },
                      { id: 'EMAIL', label: '✉️ E-Posta' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setContactMethod(opt.id as any)}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                          contactMethod === opt.id
                            ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Merak Ettiğiniz Sorular / Özel Notunuz
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tedavi süreci, konaklama veya fiyatlar hakkında sormak istedikleriniz..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer text-center"
                >
                  Vazgeç / Kapat
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Bilgi Talebiniz Kliniğe İletildi!</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Klinik hasta koordinatörleri seçtiğiniz iletişim kanalı ({contactMethod}) üzerinden en kısa sürede tarafınıza dönüş sağlayacaktır.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-left space-y-1 text-[11px] font-medium">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>purelyİstanbul Medikal Konsiyerj Bildirimi</span>
                </div>
                <p className="text-[10px] text-zinc-600">
                  Talebinizin detayları ve takip linki SMS/WhatsApp üzerinden iletilmiştir.
                </p>
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
