"use client";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLocalizedExperience } from '@/lib/experience-i18n';
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

const AESTHETIC_INQ_I18N: Record<Language, {
  missingFieldsError: string;
  successToast: string;
  sendError: string;
  genericError: string;
  providerLabel: string;
  infoBannerDesc: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  phoneLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  contactMethodQuestion: string;
  phoneMethod: string;
  emailMethod: string;
  questionsLabel: string;
  questionsPlaceholder: string;
  cancelCloseBtn: string;
  sendingToClinic: string;
  sendToClinicBtn: string;
  successTitle: string;
  successDesc: (method: string) => string;
  conciergeNoticeTitle: string;
  conciergeNoticeDesc: string;
  closeBtn: string;
}> = {
  tr: {
    missingFieldsError: 'Lütfen Ad Soyad ve İletişim Numaranızı giriniz.',
    successToast: 'Talebiniz kliniğe iletildi. Detaylar WhatsApp/SMS ile tarafınıza gönderilmiştir.',
    sendError: 'Talep gönderilemedi.',
    genericError: 'Bir hata oluştu.',
    providerLabel: 'Sağlayıcı',
    infoBannerDesc: 'Tedavi paketleri, fiyat detayları veya hekim konsültasyonu hakkında klinik danışmanları en kısa sürede sizinle iletişime geçecektir.',
    fullNameLabel: 'Adınız Soyadınız *',
    fullNamePlaceholder: 'Adınız ve Soyadınız',
    phoneLabel: 'Telefon / WhatsApp *',
    emailLabel: 'E-Posta Adresi',
    emailPlaceholder: 'ornek@mail.com',
    contactMethodQuestion: 'Nasıl İletişime Geçilmesini İstersiniz?',
    phoneMethod: 'Telefon',
    emailMethod: 'E-Posta',
    questionsLabel: 'Merak Ettiğiniz Sorular / Özel Notunuz',
    questionsPlaceholder: 'Tedavi süreci, konaklama veya fiyatlar hakkında sormak istedikleriniz...',
    cancelCloseBtn: 'Vazgeç / Kapat',
    sendingToClinic: 'Kliniğe İletiliyor...',
    sendToClinicBtn: 'Talebi Kliniğe İlet',
    successTitle: 'Bilgi Talebiniz Kliniğe İletildi!',
    successDesc: (method) => `Klinik hasta koordinatörleri seçtiğiniz iletişim kanalı (${method}) üzerinden en kısa sürede tarafınıza dönüş sağlayacaktır.`,
    conciergeNoticeTitle: 'purelyİstanbul Medikal Konsiyerj Bildirimi',
    conciergeNoticeDesc: 'Talebinizin detayları ve takip linki SMS/WhatsApp üzerinden iletilmiştir.',
    closeBtn: 'Kapat'
  },
  en: {
    missingFieldsError: 'Please enter your Full Name and Contact Number.',
    successToast: 'Your inquiry has been sent to the clinic. Details have been sent via WhatsApp/SMS.',
    sendError: 'Could not send inquiry.',
    genericError: 'An error occurred.',
    providerLabel: 'Provider',
    infoBannerDesc: 'Clinic consultants will contact you shortly regarding treatment packages, pricing details, or physician consultation.',
    fullNameLabel: 'Full Name *',
    fullNamePlaceholder: 'Your Full Name',
    phoneLabel: 'Phone / WhatsApp *',
    emailLabel: 'E-Mail Address',
    emailPlaceholder: 'example@mail.com',
    contactMethodQuestion: 'How Would You Like to Be Contacted?',
    phoneMethod: 'Phone',
    emailMethod: 'E-Mail',
    questionsLabel: 'Your Questions / Special Notes',
    questionsPlaceholder: 'What you would like to ask about the treatment process, accommodation, or pricing...',
    cancelCloseBtn: 'Cancel / Close',
    sendingToClinic: 'Sending to Clinic...',
    sendToClinicBtn: 'Send Inquiry to Clinic',
    successTitle: 'Your Inquiry Has Been Sent to the Clinic!',
    successDesc: (method) => `Clinic patient coordinators will get back to you shortly via your selected channel (${method}).`,
    conciergeNoticeTitle: 'purelyIstanbul Medical Concierge Notice',
    conciergeNoticeDesc: 'Details of your request and tracking link have been sent via SMS/WhatsApp.',
    closeBtn: 'Close'
  },
  ar: {
    missingFieldsError: 'يرجى إدخال الاسم الكامل ورقم الاتصال.',
    successToast: 'تم إرسال طلبك إلى العيادة. تم إرسال التفاصيل عبر واتساب/SMS.',
    sendError: 'تعذر إرسال الطلب.',
    genericError: 'حدث خطأ.',
    providerLabel: 'مقدم الخدمة',
    infoBannerDesc: 'سيتواصل معك مستشارو العيادة في أقرب وقت بخصوص باقات العلاج أو تفاصيل الأسعار أو استشارة الطبيب.',
    fullNameLabel: 'الاسم الكامل *',
    fullNamePlaceholder: 'الاسم الكامل',
    phoneLabel: 'الهاتف / واتساب *',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'example@mail.com',
    contactMethodQuestion: 'كيف تفضل التواصل معك؟',
    phoneMethod: 'هاتف',
    emailMethod: 'بريد إلكتروني',
    questionsLabel: 'أسئلتك / ملاحظاتك الخاصة',
    questionsPlaceholder: 'استفساراتك حول خطوات العلاج أو الإقامة أو الأسعار...',
    cancelCloseBtn: 'إلغاء / إغلاق',
    sendingToClinic: 'جارٍ الإرسال إلى العيادة...',
    sendToClinicBtn: 'إرسال الطلب إلى العيادة',
    successTitle: 'تم إرسال طلب المعلومات إلى العيادة!',
    successDesc: (method) => `سيتواصل معك منسقو المرضى في العيادة قريباً عبر قناة الاتصال المحددة (${method}).`,
    conciergeNoticeTitle: 'إشعار الكونسيرج الطبي purelyİstanbul',
    conciergeNoticeDesc: 'تم إرسال تفاصيل طلبك ورابط المتابعة عبر SMS/WhatsApp.',
    closeBtn: 'إغلاق'
  },
  ru: {
    missingFieldsError: 'Пожалуйста, введите ваше имя и контактный номер.',
    successToast: 'Ваш запрос отправлен в клинику. Детали высланы по WhatsApp/SMS.',
    sendError: 'Не удалось отправить запрос.',
    genericError: 'Произошла ошибка.',
    providerLabel: 'Клиника',
    infoBannerDesc: 'Консультанты клиники свяжутся с вами в ближайшее время по вопросам пакетов лечения, стоимости или консультации врача.',
    fullNameLabel: 'Имя и фамилия *',
    fullNamePlaceholder: 'Ваше имя и фамилия',
    phoneLabel: 'Телефон / WhatsApp *',
    emailLabel: 'Адрес эл. почты',
    emailPlaceholder: 'example@mail.com',
    contactMethodQuestion: 'Как вы предпочитаете связаться?',
    phoneMethod: 'Телефон',
    emailMethod: 'E-Mail',
    questionsLabel: 'Ваши вопросы / Особые примечания',
    questionsPlaceholder: 'Вопросы о процессе лечения, проживании или ценах...',
    cancelCloseBtn: 'Отмена / Закрыть',
    sendingToClinic: 'Отправка в клинику...',
    sendToClinicBtn: 'Отправить запрос в клинику',
    successTitle: 'Ваш запрос отправлен в клинику!',
    successDesc: (method) => `Координаторы клиники свяжутся с вами в ближайшее время через выбранный канал связи (${method}).`,
    conciergeNoticeTitle: 'Уведомление медицинского консьержа purelyİstanbul',
    conciergeNoticeDesc: 'Детали вашего запроса и ссылка для отслеживания отправлены по SMS/WhatsApp.',
    closeBtn: 'Закрыть'
  },
  de: {
    missingFieldsError: 'Bitte geben Sie Ihren vollständigen Namen und Ihre Telefonnummer ein.',
    successToast: 'Ihre Anfrage wurde an die Klinik gesendet. Details wurden per WhatsApp/SMS übermittelt.',
    sendError: 'Anfrage konnte nicht gesendet werden.',
    genericError: 'Ein Fehler ist aufgetreten.',
    providerLabel: 'Anbieter',
    infoBannerDesc: 'Die Klinikberater werden sich in Kürze bezüglich Behandlungspaketen, Preisdetails oder ärztlicher Beratung mit Ihnen in Verbindung setzen.',
    fullNameLabel: 'Vollständiger Name *',
    fullNamePlaceholder: 'Ihr Vor- und Nachname',
    phoneLabel: 'Telefon / WhatsApp *',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'beispiel@mail.com',
    contactMethodQuestion: 'Wie möchten Sie kontaktiert werden?',
    phoneMethod: 'Telefon',
    emailMethod: 'E-Mail',
    questionsLabel: 'Ihre Fragen / Besondere Hinweise',
    questionsPlaceholder: 'Fragen zum Behandlungsablauf, zur Unterkunft oder zu den Preisen...',
    cancelCloseBtn: 'Abbrechen / Schließen',
    sendingToClinic: 'Wird an die Klinik gesendet...',
    sendToClinicBtn: 'Anfrage an Klinik senden',
    successTitle: 'Ihre Informationsanfrage wurde gesendet!',
    successDesc: (method) => `Die Patientenkoordinatoren der Klinik melden sich in Kürze über Ihren gewählten Kanal (${method}) bei Ihnen.`,
    conciergeNoticeTitle: 'purelyİstanbul Medical Concierge Hinweis',
    conciergeNoticeDesc: 'Details Ihrer Anfrage und der Tracking-Link wurden per SMS/WhatsApp gesendet.',
    closeBtn: 'Schließen'
  },
  fr: {
    missingFieldsError: 'Veuillez saisir votre nom complet et votre numéro de téléphone.',
    successToast: 'Votre demande a été transmise à la clinique. Les détails ont été envoyés par WhatsApp/SMS.',
    sendError: 'Impossible d’envoyer la demande.',
    genericError: 'Une erreur est survenue.',
    providerLabel: 'Prestataire',
    infoBannerDesc: 'Les conseillers de la clinique vous contacteront très prochainement concernant les forfaits de soins, les tarifs ou une consultation médicale.',
    fullNameLabel: 'Nom complet *',
    fullNamePlaceholder: 'Votre nom et prénom',
    phoneLabel: 'Téléphone / WhatsApp *',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'exemple@mail.com',
    contactMethodQuestion: 'Comment souhaitez-vous être contacté ?',
    phoneMethod: 'Téléphone',
    emailMethod: 'E-mail',
    questionsLabel: 'Vos questions / Notes particulières',
    questionsPlaceholder: 'Vos questions sur le déroulement des soins, l’hébergement ou les tarifs...',
    cancelCloseBtn: 'Annuler / Fermer',
    sendingToClinic: 'Envoi à la clinique...',
    sendToClinicBtn: 'Envoyer la demande à la clinique',
    successTitle: 'Votre demande a été envoyée à la clinique !',
    successDesc: (method) => `Les coordinateurs patients de la clinique vous recontacteront rapidement via le canal choisi (${method}).`,
    conciergeNoticeTitle: 'Notification Conciergerie Médicale purelyİstanbul',
    conciergeNoticeDesc: 'Les détails de votre demande et le lien de suivi ont été envoyés par SMS/WhatsApp.',
    closeBtn: 'Fermer'
  }
};

export function AestheticInquiryModal({
  experience,
  hotel,
  roomNumber,
  lang,
  onClose
}: AestheticInquiryModalProps) {
  const t = getT(lang);
  const ai = AESTHETIC_INQ_I18N[lang] || AESTHETIC_INQ_I18N.en;
  const locExp = getLocalizedExperience(experience, lang);

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
      toast.error(ai.missingFieldsError);
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
        toast.success(ai.successToast);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || ai.sendError);
      }
    } catch (err: any) {
      toast.error(err.message || ai.genericError);
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
                {t.categoriesList.aesthetic?.title}
              </span>
              <h2 className="font-luxury-serif text-base sm:text-lg font-bold text-[#141414] leading-snug line-clamp-1" title={locExp.title}>
                {locExp.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={ai.closeBtn}
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
                  <strong className="text-[#141414] block font-bold">{ai.providerLabel}: {experience.provider} ({experience.location})</strong>
                  <span>{ai.infoBannerDesc}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ai.fullNameLabel}</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={ai.fullNamePlaceholder}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ai.phoneLabel}</label>
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
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ai.emailLabel}</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder={ai.emailPlaceholder}
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1.5">
                    {ai.contactMethodQuestion}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'WHATSAPP', label: 'WhatsApp' },
                      { id: 'PHONE', label: ai.phoneMethod },
                      { id: 'EMAIL', label: ai.emailMethod }
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
                    {ai.questionsLabel}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={ai.questionsPlaceholder}
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
                  {ai.cancelCloseBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{ai.sendingToClinic}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{ai.sendToClinicBtn}</span>
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
                <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">{ai.successTitle}</h3>
                <p className="text-xs text-[#5C4938] mt-1">
                  {ai.successDesc(contactMethod)}
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-[#141414] text-left space-y-1 text-[11px] font-medium">
                <div className="flex items-center gap-1.5 font-bold text-[#7D5E2A]">
                  <Sparkles className="w-3.5 h-3.5 text-[#8E7252]" />
                  <span>{ai.conciergeNoticeTitle}</span>
                </div>
                <p className="text-[10px] text-[#5C4938]">
                  {ai.conciergeNoticeDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                {ai.closeBtn}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

