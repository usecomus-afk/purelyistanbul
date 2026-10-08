import { useState } from 'react';
import { GuestProfile, Language } from '@/lib/types';
import { ShieldCheck, HeartPulse, ShoppingBag, Compass, Briefcase, UtensilsCrossed, Sparkles, Trash2, X } from 'lucide-react';

interface GuestPreferenceSurveyProps {
  initialProfile: GuestProfile;
  lang?: Language;
  onSave: (profile: GuestProfile) => void;
  onClear: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const DICTS: Record<string, any> = {
  tr: {
    title: "Misafir Profil Tercihleri",
    subtitle: "Size özel İstanbul önerileri ve güvenliğiniz için tercihlerinizi belirleyin.",
    travelStyle: "Seyahat Tarzı",
    travelStyles: [
      { value: 'solo', label: 'Yalnız Gezgin' },
      { value: 'couple', label: 'Çift / Romantik' },
      { value: 'family', label: 'Aile (Çocuklu)' },
      { value: 'business', label: 'İş Seyahati' }
    ],
    budgetLevel: "Bütçe Tercihi",
    budgetLevels: [
      { value: 'economy', label: 'Ekonomik' },
      { value: 'moderate', label: 'Standart / Dengeli' },
      { value: 'luxury', label: 'Lüks & VIP' }
    ],
    interestsTitle: "İlgi Alanları",
    interests: ['Tarih & Kültür', 'Boğaz & Deniz', 'Gastronomi', 'Gece Hayatı', 'Alışveriş', 'Sanat & Müzeler', 'Doğa & Yürüyüş', 'Fotoğrafçılık', 'Yatırım'],
    healthTitle: "Sağlık & Alerjiler",
    allergies: ['Fıstık / Kuruyemiş', 'Deniz Ürünleri', 'Laktoz / Süt', 'Gluten', 'Polen / Toz'],
    dietaryRestrictions: ['Helal', 'Vejetaryen', 'Vegan', 'Glutensiz', 'Diyabetik'],
    kvkkConsent: "Kişisel tercihlerimin ve sağlık/alerji notlarımın bana özel rehberlik için AI concierge tarafından işlenmesine onay veriyorum.",
    saveBtn: "Tercihleri Kaydet",
    clearBtn: "Sıfırla",
    cancelBtn: "Vazgeç"
  },
  en: {
    title: "Guest Profile & Preferences",
    subtitle: "Customize your preferences for tailored Istanbul itineraries and recommendations.",
    travelStyle: "Travel Style",
    travelStyles: [
      { value: 'solo', label: 'Solo Traveler' },
      { value: 'couple', label: 'Couple / Romantic' },
      { value: 'family', label: 'Family with Kids' },
      { value: 'business', label: 'Business Trip' }
    ],
    budgetLevel: "Budget Level",
    budgetLevels: [
      { value: 'economy', label: 'Economy' },
      { value: 'moderate', label: 'Standard / Balanced' },
      { value: 'luxury', label: 'Luxury & VIP' }
    ],
    interestsTitle: "Interests & Passions",
    interests: ['History & Culture', 'Bosphorus & Sea', 'Gastronomy', 'Nightlife', 'Shopping', 'Art & Museums', 'Nature & Outdoors', 'Photography', 'Investment'],
    healthTitle: "Health & Allergies",
    allergies: ['Peanuts / Nuts', 'Seafood / Shellfish', 'Dairy / Lactose', 'Gluten', 'Pollen / Dust'],
    dietaryRestrictions: ['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Diabetic'],
    kvkkConsent: "I consent to the processing of my travel preferences and allergy notes by the AI concierge for tailored recommendations.",
    saveBtn: "Save Preferences",
    clearBtn: "Reset",
    cancelBtn: "Cancel"
  },
  ar: {
    title: "تفضيلات وملف النزيل",
    subtitle: "حدد تفضيلاتك للحصول على اقتراحات مخصصة وآمنة في إسطنبول.",
    travelStyle: "نمط السفر",
    travelStyles: [
      { value: 'solo', label: 'مسافر بمفردي' },
      { value: 'couple', label: 'زوجان / رومانسي' },
      { value: 'family', label: 'عائلة مع أطفال' },
      { value: 'business', label: 'رحلة عمل' }
    ],
    budgetLevel: "مستوى الميزانية",
    budgetLevels: [
      { value: 'economy', label: 'اقتصادي' },
      { value: 'moderate', label: 'متوسط / متوازن' },
      { value: 'luxury', label: 'فاخر وVIP' }
    ],
    interestsTitle: "الاهتمامات والهوايات",
    interests: ['التاريخ والثقافة', 'البوسفور والبحر', 'تذوق الطعام', 'الحياة الليلية', 'التسوق', 'الفنون والمتاحف', 'الطبيعة', 'التصوير', 'الاستثمار العقاري'],
    healthTitle: "الصحة والحساسية",
    allergies: ['الفول السوداني والمكسرات', 'المأكولات البحرية', 'اللاكتوز والحليب', 'الغلوتين', 'الغبار'],
    dietaryRestrictions: ['حلال', 'نباتي', 'نباتي صرف', 'خال من الغلوتين', 'حمية السكري'],
    kvkkConsent: "أوافق على معالجة تفضيلاتي وملاحظات الحساسية بواسطة المساعد الذكي لتقديم توصيات مخصصة.",
    saveBtn: "حفظ التفضيلات",
    clearBtn: "إعادة ضبط",
    cancelBtn: "إلغاء"
  },
  ru: {
    title: "Предпочтения гостя",
    subtitle: "Настройте предпочтения для персональных рекомендаций по Стамбулу.",
    travelStyle: "Стиль поездки",
    travelStyles: [
      { value: 'solo', label: 'Один' },
      { value: 'couple', label: 'Пара / Романтика' },
      { value: 'family', label: 'Семья с детьми' },
      { value: 'business', label: 'Деловая поездка' }
    ],
    budgetLevel: "Бюджет",
    budgetLevels: [
      { value: 'economy', label: 'Эконом' },
      { value: 'moderate', label: 'Стандарт' },
      { value: 'luxury', label: 'Люкс и VIP' }
    ],
    interestsTitle: "Интересы",
    interests: ['История и культура', 'Босфор и море', 'Гастрономия', 'Ночная жизнь', 'Шопинг', 'Музеи и искусство', 'Природа', 'Фотография', 'Инвестиции'],
    healthTitle: "Здоровье и аллергии",
    allergies: ['Орехи / Арахис', 'Морепродукты', 'Лактоза / Молоко', 'Глютен', 'Пыльца'],
    dietaryRestrictions: ['Халяль', 'Вегетарианское', 'Веганское', 'Без глютена', 'Диабетическое'],
    kvkkConsent: "Я согласен на обработку моих предпочтений и заметок об аллергиях для персональных рекомендаций.",
    saveBtn: "Сохранить",
    clearBtn: "Сбросить",
    cancelBtn: "Отмена"
  },
  de: {
    title: "Gästeprofil & Vorlieben",
    subtitle: "Passen Sie Ihre Vorlieben für personalisierte Istanbul-Tipps an.",
    travelStyle: "Reisestil",
    travelStyles: [
      { value: 'solo', label: 'Alleinreisend' },
      { value: 'couple', label: 'Paar / Romantisch' },
      { value: 'family', label: 'Familie mit Kindern' },
      { value: 'business', label: 'Geschäftsreise' }
    ],
    budgetLevel: "Budget",
    budgetLevels: [
      { value: 'economy', label: 'Günstig' },
      { value: 'moderate', label: 'Standard / Ausgewogen' },
      { value: 'luxury', label: 'Luxus & VIP' }
    ],
    interestsTitle: "Interessen",
    interests: ['Geschichte & Kultur', 'Bosporus & Meer', 'Gastronomie', 'Nachtleben', 'Shopping', 'Kunst & Museen', 'Natur', 'Fotografie', 'Investition'],
    healthTitle: "Gesundheit & Allergien",
    allergies: ['Erdnüsse / Nüsse', 'Meeresfrüchte', 'Laktose / Milch', 'Gluten', 'Pollen / Staub'],
    dietaryRestrictions: ['Halal', 'Vegetarisch', 'Vegan', 'Glutenfrei', 'Diabetisch'],
    kvkkConsent: "Ich stimme der Verarbeitung meiner Reisevorlieben und Allergiehinweise für personalisierte Empfehlungen zu.",
    saveBtn: "Speichern",
    clearBtn: "Zurücksetzen",
    cancelBtn: "Abbrechen"
  },
  fr: {
    title: "Profil & Préférences Invité",
    subtitle: "Personnalisez vos préférences pour des conseils sur mesure à Istanbul.",
    travelStyle: "Style de voyage",
    travelStyles: [
      { value: 'solo', label: 'Voyageur Solo' },
      { value: 'couple', label: 'Couple / Romantique' },
      { value: 'family', label: 'Famille avec enfants' },
      { value: 'business', label: 'Affaires' }
    ],
    budgetLevel: "Budget",
    budgetLevels: [
      { value: 'economy', label: 'Économique' },
      { value: 'moderate', label: 'Standard / Équilibré' },
      { value: 'luxury', label: 'Luxe & VIP' }
    ],
    interestsTitle: "Centres d'intérêt",
    interests: ['Histoire & Culture', 'Bosphore & Mer', 'Gastronomie', 'Vie nocturne', 'Shopping', 'Art & Musées', 'Nature', 'Photographie', 'Investissement'],
    healthTitle: "Santé & Allergies",
    allergies: ['Arachides / Fruits à coque', 'Fruits de mer', 'Lactose / Lait', 'Gluten', 'Pollen'],
    dietaryRestrictions: ['Halal', 'Végétarien', 'Végétalien', 'Sans gluten', 'Diabétique'],
    kvkkConsent: "J'accepte le traitement de mes préférences de voyage et allergies par l'assistant pour des recommandations personnalisées.",
    saveBtn: "Enregistrer",
    clearBtn: "Réinitialiser",
    cancelBtn: "Annuler"
  }
};

export function GuestPreferenceSurvey({ initialProfile, lang = 'tr', onSave, onClear, onCancel, onClose }: GuestPreferenceSurveyProps) {
  const t = DICTS[lang] || DICTS.en;
  const [profile, setProfile] = useState<GuestProfile>(initialProfile);
  const [consent, setConsent] = useState<boolean>(!!initialProfile.kvkkConsent);

  const toggleInterest = (item: string) => {
    const curr = profile.interests || [];
    const next = curr.includes(item) ? curr.filter(i => i !== item) : [...curr, item];
    setProfile(p => ({ ...p, interests: next }));
  };

  const toggleAllergy = (item: string) => {
    const curr = profile.allergies || [];
    const next = curr.includes(item) ? curr.filter(i => i !== item) : [...curr, item];
    setProfile(p => ({ ...p, allergies: next }));
  };

  const handleSave = () => {
    onSave({
      ...profile,
      kvkkConsent: consent,
      consentTimestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">{t.title}</h3>
          <p className="text-[11px] text-zinc-500 dark:text-slate-400">{t.subtitle}</p>
        </div>
        {(onClose || onCancel) && (
          <button
            onClick={onClose || onCancel}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 dark:text-slate-400 font-bold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Travel Style */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-800 dark:text-slate-200 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-600" /> {t.travelStyle}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {t.travelStyles.map((item: any) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setProfile(p => ({ ...p, travelStyle: item.value }))}
              className={`p-2.5 rounded-xl font-semibold text-xs border text-left transition cursor-pointer ${
                profile.travelStyle === item.value
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-700 hover:bg-amber-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Level */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-800 dark:text-slate-200">{t.budgetLevel}</label>
        <div className="grid grid-cols-3 gap-1.5">
          {t.budgetLevels.map((item: any) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setProfile(p => ({ ...p, budgetLevel: item.value }))}
              className={`py-2 px-1 text-center rounded-xl font-semibold text-xs border transition cursor-pointer ${
                profile.budgetLevel === item.value
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-700 hover:bg-amber-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-800 dark:text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> {t.interestsTitle}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {t.interests.map((item: string) => {
            const active = (profile.interests || []).includes(item);
            return (
              <button
                type="button"
                key={item}
                onClick={() => toggleInterest(item)}
                className={`px-2.5 py-1.5 rounded-xl font-medium text-xs border transition cursor-pointer ${
                  active
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-700 hover:bg-amber-50'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Health & Allergies */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-800 dark:text-slate-200 flex items-center gap-1.5">
          <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> {t.healthTitle}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {t.allergies.map((item: string) => {
            const active = (profile.allergies || []).includes(item);
            return (
              <button
                type="button"
                key={item}
                onClick={() => toggleAllergy(item)}
                className={`px-2.5 py-1.5 rounded-xl font-medium text-xs border transition cursor-pointer ${
                  active
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-rose-200 text-zinc-700 hover:bg-rose-50'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/70 flex items-start gap-2">
        <input
          type="checkbox"
          id="kvkkConsent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
        />
        <label htmlFor="kvkkConsent" className="text-[11px] text-zinc-700 leading-snug cursor-pointer">
          {t.kvkkConsent}
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onClear}
          title={t.clearBtn}
          className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-500 dark:text-slate-400" />
          <span>{t.clearBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!consent}
          className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
        >
          {t.saveBtn}
        </button>
      </div>
    </div>
  );
}

