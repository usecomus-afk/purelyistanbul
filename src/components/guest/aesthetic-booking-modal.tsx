"use client";

import { useState, useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { AvailableTimeSlot } from '@/types/aesthetic';
import { getT } from '@/lib/i18n';
import { getLocalizedExperience } from '@/lib/experience-i18n';
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

const AESTHETIC_BOOK_I18N: Record<Language, {
  missingFieldsError: string;
  successToast: string;
  createError: string;
  genericError: string;
  providerLabel: string;
  crmLockNote: string;
  appointmentDate: string;
  availableSlotsLabel: string;
  queryingCrm: string;
  fetchingSlots: string;
  noSlotsFound: string;
  fullSlot: string;
  closeCancel: string;
  selectedAppointment: string;
  changeBtn: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  phoneLabel: string;
  emailLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  backBtn: string;
  sendingToCrm: string;
  confirmAppointment: string;
  confirmedTitle: string;
  confirmedDesc: (hotelName: string) => string;
  clinicLabel: string;
  dateTimeLabel: string;
  guestLabel: string;
  refCodeLabel: string;
  closeBtn: string;
}> = {
  tr: {
    missingFieldsError: 'Lütfen adınızı ve telefon numaranızı giriniz.',
    successToast: 'Randevunuz kliniğin canlı CRM sistemine işlendi ve onaylandı.',
    createError: 'Randevu oluşturulamadı.',
    genericError: 'Bir hata oluştu.',
    providerLabel: 'Sağlayıcı',
    crmLockNote: 'Tarih ve saat seçtiğinizde kliniğin CRM takvimi anlık kilitlenir.',
    appointmentDate: 'Randevu Tarihi',
    availableSlotsLabel: 'Müsait Saat Dilimleri (Canlı CRM)',
    queryingCrm: 'CRM Sorgulanıyor...',
    fetchingSlots: 'Kliniğin uygun seansları çekiliyor...',
    noSlotsFound: 'Seçilen tarihte uygun seans bulunamadı. Lütfen başka bir gün seçiniz.',
    fullSlot: 'Dolu',
    closeCancel: 'Kapat / Vazgeç',
    selectedAppointment: 'Seçilen Randevu:',
    changeBtn: 'Değiştir',
    fullNameLabel: 'Adınız Soyadınız *',
    fullNamePlaceholder: 'Örn: Alex Mercer',
    phoneLabel: 'Telefon / WhatsApp *',
    emailLabel: 'E-Posta (İsteğe bağlı)',
    notesLabel: 'Özel İstek / Sağlık Notu',
    notesPlaceholder: 'Varsa alerjileriniz veya kliniğe iletmek istediğiniz özel notunuz...',
    backBtn: 'Geri',
    sendingToCrm: "CRM'e İletiliyor...",
    confirmAppointment: 'Randevuyu Onayla',
    confirmedTitle: 'Randevunuz Onaylandı!',
    confirmedDesc: (hotelName) => `Randevu kaydı kliniğin takvimine işlendi. Konakladığınız otel (${hotelName}) koordinatörlüğü ile klinik karşılamanız organize edilecektir.`,
    clinicLabel: 'Klinik:',
    dateTimeLabel: 'Tarih & Saat:',
    guestLabel: 'Misafir:',
    refCodeLabel: 'Kayıt Referansı:',
    closeBtn: 'Kapat'
  },
  en: {
    missingFieldsError: 'Please enter your full name and phone number.',
    successToast: 'Your appointment has been registered and confirmed in the clinic live CRM.',
    createError: 'Could not create appointment.',
    genericError: 'An error occurred.',
    providerLabel: 'Provider',
    crmLockNote: 'Selecting a date and time instantly reserves the slot on the clinic CRM calendar.',
    appointmentDate: 'Appointment Date',
    availableSlotsLabel: 'Available Time Slots (Live CRM)',
    queryingCrm: 'Querying CRM...',
    fetchingSlots: 'Fetching available clinic sessions...',
    noSlotsFound: 'No available sessions found for the selected date. Please select another day.',
    fullSlot: 'Booked',
    closeCancel: 'Close / Cancel',
    selectedAppointment: 'Selected Appointment:',
    changeBtn: 'Change',
    fullNameLabel: 'Full Name *',
    fullNamePlaceholder: 'e.g., Alex Mercer',
    phoneLabel: 'Phone / WhatsApp *',
    emailLabel: 'E-Mail (Optional)',
    notesLabel: 'Special Request / Medical Note',
    notesPlaceholder: 'Any allergies or special notes you would like to share with the clinic...',
    backBtn: 'Back',
    sendingToCrm: 'Sending to CRM...',
    confirmAppointment: 'Confirm Appointment',
    confirmedTitle: 'Appointment Confirmed!',
    confirmedDesc: (hotelName) => `Your appointment is registered on the clinic calendar. Your clinic reception will be coordinated with your hotel (${hotelName}).`,
    clinicLabel: 'Clinic:',
    dateTimeLabel: 'Date & Time:',
    guestLabel: 'Guest:',
    refCodeLabel: 'Booking Reference:',
    closeBtn: 'Close'
  },
  ar: {
    missingFieldsError: 'يرجى إدخال الاسم الكامل ورقم الهاتف.',
    successToast: 'تم تسجيل موعدك وتأكيده في نظام CRM المباشر للعيادة.',
    createError: 'تعذر إنشاء الموعد.',
    genericError: 'حدث خطأ.',
    providerLabel: 'مقدم الخدمة',
    crmLockNote: 'عند اختيار التاريخ والوقت، يتم حجز الموعد فوراً في تقويم العيادة.',
    appointmentDate: 'تاريخ الموعد',
    availableSlotsLabel: 'الأوقات المتاحة (CRM مباشر)',
    queryingCrm: 'جارٍ الاستعلام...',
    fetchingSlots: 'جارٍ جلب الجلسات المتاحة في العيادة...',
    noSlotsFound: 'لا توجد جلسات متاحة في التاريخ المحدد. يرجى اختيار يوم آخر.',
    fullSlot: 'ممتلئ',
    closeCancel: 'إغلاق / إلغاء',
    selectedAppointment: 'الموعد المحدد:',
    changeBtn: 'تغيير',
    fullNameLabel: 'الاسم الكامل *',
    fullNamePlaceholder: 'مثال: Alex Mercer',
    phoneLabel: 'الهاتف / واتساب *',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    notesLabel: 'طلب خاص / ملاحظة طبية',
    notesPlaceholder: 'أي حساسية أو ملاحظات خاصة تود إبلاغ العيادة بها...',
    backBtn: 'رجوع',
    sendingToCrm: 'جارٍ الإرسال إلى CRM...',
    confirmAppointment: 'تأكيد الموعد',
    confirmedTitle: 'تم تأكيد موعدك!',
    confirmedDesc: (hotelName) => `تم تسجيل الموعد في تقويم العيادة. سيتم تنسيق استقبالك بالتعاون مع فندقك (${hotelName}).`,
    clinicLabel: 'العيادة:',
    dateTimeLabel: 'التاريخ والوقت:',
    guestLabel: 'الضيف:',
    refCodeLabel: 'مرجع التسجيل:',
    closeBtn: 'إغلاق'
  },
  ru: {
    missingFieldsError: 'Пожалуйста, введите ваше имя и номер телефона.',
    successToast: 'Ваша запись зарегистрирована и подтверждена в CRM-системе клиники.',
    createError: 'Не удалось создать запись.',
    genericError: 'Произошла ошибка.',
    providerLabel: 'Клиника',
    crmLockNote: 'При выборе даты и времени слот мгновенно бронируется в CRM-календаре клиники.',
    appointmentDate: 'Дата приема',
    availableSlotsLabel: 'Доступное время (Live CRM)',
    queryingCrm: 'Запрос в CRM...',
    fetchingSlots: 'Загрузка доступных сеансов клиники...',
    noSlotsFound: 'На выбранную дату нет свободных сеансов. Пожалуйста, выберите другой день.',
    fullSlot: 'Занято',
    closeCancel: 'Закрыть / Отмена',
    selectedAppointment: 'Выбранное время:',
    changeBtn: 'Изменить',
    fullNameLabel: 'Имя и фамилия *',
    fullNamePlaceholder: 'Напр.: Alex Mercer',
    phoneLabel: 'Телефон / WhatsApp *',
    emailLabel: 'E-Mail (необязательно)',
    notesLabel: 'Особые пожелания / Медицинские примечания',
    notesPlaceholder: 'Аллергии или особые примечания для клиники...',
    backBtn: 'Назад',
    sendingToCrm: 'Отправка в CRM...',
    confirmAppointment: 'Подтвердить запись',
    confirmedTitle: 'Ваша запись подтверждена!',
    confirmedDesc: (hotelName) => `Запись внесена в календарь клиники. Встреча в клинике будет организована совместно с вашим отелем (${hotelName}).`,
    clinicLabel: 'Клиника:',
    dateTimeLabel: 'Дата и время:',
    guestLabel: 'Гость:',
    refCodeLabel: 'Номер брони:',
    closeBtn: 'Закрыть'
  },
  de: {
    missingFieldsError: 'Bitte geben Sie Ihren Namen und Ihre Telefonnummer ein.',
    successToast: 'Ihr Termin wurde im Live-CRM-System der Klinik registriert und bestätigt.',
    createError: 'Termin konnte nicht erstellt werden.',
    genericError: 'Ein Fehler ist aufgetreten.',
    providerLabel: 'Anbieter',
    crmLockNote: 'Mit der Auswahl von Datum und Uhrzeit wird der Termin sofort im CRM-Kalender der Klinik reserviert.',
    appointmentDate: 'Termindatum',
    availableSlotsLabel: 'Verfügbare Zeitfenster (Live-CRM)',
    queryingCrm: 'CRM wird abgefragt...',
    fetchingSlots: 'Verfügbare Sitzungen der Klinik werden geladen...',
    noSlotsFound: 'Für das ausgewählte Datum wurden keine freien Sitzungen gefunden. Bitte wählen Sie einen anderen Tag.',
    fullSlot: 'Belegt',
    closeCancel: 'Schließen / Abbrechen',
    selectedAppointment: 'Ausgewählter Termin:',
    changeBtn: 'Ändern',
    fullNameLabel: 'Vollständiger Name *',
    fullNamePlaceholder: 'z. B. Alex Mercer',
    phoneLabel: 'Telefon / WhatsApp *',
    emailLabel: 'E-Mail (Optional)',
    notesLabel: 'Sonderwunsch / Medizinischer Hinweis',
    notesPlaceholder: 'Allergien oder besondere Hinweise für die Klinik...',
    backBtn: 'Zurück',
    sendingToCrm: 'Wird an CRM gesendet...',
    confirmAppointment: 'Termin bestätigen',
    confirmedTitle: 'Ihr Termin ist bestätigt!',
    confirmedDesc: (hotelName) => `Ihr Termin wurde im Klinikkalender eingetragen. Ihr Empfang wird in Koordination mit Ihrem Hotel (${hotelName}) organisiert.`,
    clinicLabel: 'Klinik:',
    dateTimeLabel: 'Datum & Uhrzeit:',
    guestLabel: 'Gast:',
    refCodeLabel: 'Referenzcode:',
    closeBtn: 'Schließen'
  },
  fr: {
    missingFieldsError: 'Veuillez saisir votre nom complet et votre numéro de téléphone.',
    successToast: 'Votre rendez-vous a été enregistré et confirmé dans le CRM en direct de la clinique.',
    createError: 'Impossible de créer le rendez-vous.',
    genericError: 'Une erreur est survenue.',
    providerLabel: 'Prestataire',
    crmLockNote: 'En choisissant la date et l’heure, le créneau est immédiatement réservé dans le CRM de la clinique.',
    appointmentDate: 'Date du rendez-vous',
    availableSlotsLabel: 'Créneaux disponibles (CRM en direct)',
    queryingCrm: 'Interrogation du CRM...',
    fetchingSlots: 'Récupération des séances disponibles...',
    noSlotsFound: 'Aucune séance disponible à la date sélectionnée. Veuillez choisir un autre jour.',
    fullSlot: 'Complet',
    closeCancel: 'Fermer / Annuler',
    selectedAppointment: 'Rendez-vous choisi :',
    changeBtn: 'Modifier',
    fullNameLabel: 'Nom complet *',
    fullNamePlaceholder: 'Ex. : Alex Mercer',
    phoneLabel: 'Téléphone / WhatsApp *',
    emailLabel: 'E-mail (Optionnel)',
    notesLabel: 'Demande spéciale / Note médicale',
    notesPlaceholder: 'Allergies éventuelles ou notes particulières à transmettre à la clinique...',
    backBtn: 'Retour',
    sendingToCrm: 'Envoi au CRM...',
    confirmAppointment: 'Confirmer le rendez-vous',
    confirmedTitle: 'Votre rendez-vous est confirmé !',
    confirmedDesc: (hotelName) => `Votre rendez-vous est inscrit au calendrier de la clinique. Votre accueil sera coordonné avec votre hôtel (${hotelName}).`,
    clinicLabel: 'Clinique :',
    dateTimeLabel: 'Date & Heure :',
    guestLabel: 'Client :',
    refCodeLabel: 'Référence :',
    closeBtn: 'Fermer'
  }
};

export function AestheticBookingModal({
  experience,
  hotel,
  roomNumber,
  lang,
  onClose
}: AestheticBookingModalProps) {
  const t = getT(lang);
  const ab = AESTHETIC_BOOK_I18N[lang] || AESTHETIC_BOOK_I18N.en;
  const locExp = getLocalizedExperience(experience, lang);

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
      toast.error(ab.missingFieldsError);
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
        toast.success(ab.successToast);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || ab.createError);
      }
    } catch (err: any) {
      toast.error(err.message || ab.genericError);
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
            aria-label={ab.closeBtn}
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
                  <strong className="text-[#141414] block font-bold">{ab.providerLabel}: {experience.provider} ({experience.location})</strong>
                  <span>{ab.crmLockNote}</span>
                </div>
              </div>

              {/* Date Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1.5">
                  {ab.appointmentDate}
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
                    {ab.availableSlotsLabel}
                  </label>
                  {isLoadingSlots && (
                    <span className="text-[10px] text-[#7D5E2A] flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" /> {ab.queryingCrm}
                    </span>
                  )}
                </div>

                {isLoadingSlots ? (
                  <div className="py-8 text-center text-[#5C4938]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8E7252] mb-2" />
                    <span>{ab.fetchingSlots}</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-center text-[#5C4938]">
                    {ab.noSlotsFound}
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
                          {s.is_available ? `${experience.price} ${experience.currency}` : ab.fullSlot}
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
                  {ab.closeCancel}
                </button>
              </div>
            </div>
          )}

          {step === 'GUEST_FORM' && selectedSlot && (
            <form onSubmit={handleBookSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-[#141414] text-[11px] flex items-center justify-between font-medium">
                <div>
                  <strong className="text-[#7D5E2A]">{ab.selectedAppointment}</strong> {selectedDate} • {selectedSlot.start_time} - {selectedSlot.end_time}
                </div>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="text-[10px] text-[#7D5E2A] underline font-bold cursor-pointer"
                >
                  {ab.changeBtn}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ab.fullNameLabel}</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8E7252] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={ab.fullNamePlaceholder}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-medium text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ab.phoneLabel}</label>
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
                    <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ab.emailLabel}</label>
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
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ab.notesLabel}</label>
                  <textarea
                    rows={2}
                    placeholder={ab.notesPlaceholder}
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
                  {ab.backBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{ab.sendingToCrm}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{ab.confirmAppointment} ({experience.price} {experience.currency})</span>
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
                <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">{ab.confirmedTitle}</h3>
                <p className="text-xs text-[#5C4938] mt-1">
                  {ab.confirmedDesc(hotel.name)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ab.clinicLabel}</span>
                  <strong className="text-[#141414]">{experience.provider}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ab.dateTimeLabel}</span>
                  <strong className="text-[#141414]">{selectedDate} - {selectedSlot?.start_time}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ab.guestLabel}</span>
                  <strong className="text-[#141414]">{guestName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ab.refCodeLabel}</span>
                  <strong className="text-[#7D5E2A] font-mono font-bold">{confirmedBookingId}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                {ab.closeBtn}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

