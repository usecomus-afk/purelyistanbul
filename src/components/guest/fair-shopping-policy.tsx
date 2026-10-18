"use client";

import { ExternalLink, ShieldCheck, HeartHandshake, Compass, Mail, MessageCircle } from "lucide-react";
import { Language } from "@/lib/types";
import { LuxuryCategoryIcon } from "./luxury-category-icon";

interface FairShoppingPolicyProps {
  lang?: Language;
}

const GUIDE_I18N: Record<Language, {
  istanbulkartTitle: string;
  istanbulkartDesc: string;
  istanbulkartCta: string;
  museumPassTitle: string;
  museumPassDesc: string;
  museumPassCta: string;
  charterHeading: string;
  charterQuote: string;
  pillars: { number: string; title: string; desc: string }[];
  contactTitle: string;
  contactSubtitle: string;
  emailLabel: string;
  whatsappLabel: string;
  emergencyTitle: string;
  emergency112: string;
  tourismPolice: string;
  municipality153: string;
  guestCare: string;
  support247: string;
}> = {
  tr: {
    istanbulkartTitle: "Resmi İstanbulkart & Ulaşım",
    istanbulkartDesc: "Tüm metro, tramvay, vapur ve Marmaray hatlarında geçerli resmi toplu ulaşım kartı. İstasyon gişelerinden temin edebilir veya online dolum yapabilirsiniz.",
    istanbulkartCta: "İstanbulkart Resmi Portalı",
    museumPassTitle: "Resmi MuseumPass & Biletler",
    museumPassDesc: "T.C. Kültür ve Turizm Bakanlığı'na bağlı tarihi müze ve saraylarda sıra beklemeden giriş sağlayan resmi müze kartı.",
    museumPassCta: "Resmi Müze Biletleri",
    charterHeading: "Şeffaf, Misafirperver ve Samimi Yerel Deneyim",
    charterQuote: "“Purely İstanbul olarak her misafirimizin İstanbul’u baş tacı edilen bir ‘Tanrı Misafiri’ olarak deneyimlemesi için özenle seçilmiş yerel deneyimler ve dijital rehberlik sunuyoruz.”",
    pillars: [
      {
        number: "01",
        title: "Şeffaf Deneyim",
        desc: "Açık deneyim bilgileri, yerel rehberlik ve kolay dijital rezervasyon altyapısı.",
      },
      {
        number: "02",
        title: "Gerçek Misafirperverlik",
        desc: "Köklü Türk misafirperverliği dijitale taşındı; konaklamanız boyunca özenli misafir desteği yanınızda.",
      },
      {
        number: "03",
        title: "Tamamen Yerel & Samimi",
        desc: "“Sadece İstanbul.” 100 şehre dağılmıyoruz; Galata’nın her Arnavut kaldırımını, Kadıköy’ün her çay bahçesini ve Sultanahmet’in her tarihi sırrını biliyoruz.",
      },
    ],
    contactTitle: "Bizimle İletişime Geçin",
    contactSubtitle: "Her türlü soru, öneri ve destek talebiniz için bize doğrudan ulaşabilirsiniz.",
    emailLabel: "E-posta Adresimiz",
    whatsappLabel: "WhatsApp İletişim",
    emergencyTitle: "Resmi Acil Durum & Destek Hatları",
    emergency112: "Acil Çağrı Merkezi",
    tourismPolice: "Turizm Polisi",
    municipality153: "Belediye Çözüm Merkezi",
    guestCare: "Purely Misafir İlişkileri",
    support247: "7/24 Destek",
  },
  en: {
    istanbulkartTitle: "Official Istanbulkart & Transit",
    istanbulkartDesc: "The official public transit card valid across all metros, trams, ferries, and Marmaray trains. Obtain at station kiosks or top up online.",
    istanbulkartCta: "Istanbulkart Official Portal",
    museumPassTitle: "Official MuseumPass & Tickets",
    museumPassDesc: "Skip-the-line official entrance pass valid at historic museums and palaces under the Ministry of Culture and Tourism.",
    museumPassCta: "Official Museum Tickets",
    charterHeading: "Transparent, Hospitable, and Sincerely Local",
    charterQuote: "“At Purely Istanbul, we believe every traveler should experience Istanbul as an honored guest with authentic local guidance and curated city experiences.”",
    pillars: [
      {
        number: "01",
        title: "Clear & Direct",
        desc: "Clear experience details, local context, and straightforward digital booking across Istanbul.",
      },
      {
        number: "02",
        title: "Genuine Hospitality",
        desc: "Inspired by the timeless hosting tradition, with attentive guest support throughout your stay.",
      },
      {
        number: "03",
        title: "Hyper-Local & Sincere",
        desc: "\"Nothing but Istanbul.\" We don't stretch across 100 cities. We know every cobble of Galata, every tea garden in Kadıköy, and every historical secret of Sultanahmet.",
      },
    ],
    contactTitle: "Contact Us",
    contactSubtitle: "Reach out to us directly via email or WhatsApp for any inquiries or assistance.",
    emailLabel: "Email Address",
    whatsappLabel: "WhatsApp Support",
    emergencyTitle: "Official Emergency & Support Lines",
    emergency112: "Emergency Call Center",
    tourismPolice: "Tourism Police",
    municipality153: "Municipality Help Desk",
    guestCare: "Purely Guest Care",
    support247: "24/7 Support",
  },
  ar: {
    istanbulkartTitle: "بطاقة إسطنبول كارت والمواصلات الرسمية",
    istanbulkartDesc: "بطاقة النقل العام الرسمية الصالحة في جميع خطوط المترو والترام والعبارات وقطارات مرمراي. احصل عليها من أكشاك المحطات أو اشحنها عبر الإنترنت.",
    istanbulkartCta: "البوابة الرسمية لإسطنبول كارت",
    museumPassTitle: "بطاقة المتاحف والتذاكر الرسمية",
    museumPassDesc: "بطاقة الدخول الرسمية لتخطي الطوابير والصالحة في المتاحف والقصور التاريخية التابعة لوزارة الثقافة والسياحة.",
    museumPassCta: "تذاكر المتاحف الرسمية",
    charterHeading: "شفافية وضيافة أصيلة",
    charterQuote: "«في Purely إسطنبول، نقدم تجارب محلية مختارة وإرشاداً رقمياً ليعيش كل مسافر تجربة إسطنبول كضيف مكرّم.»",
    pillars: [
      {
        number: "01",
        title: "وضوح وبساطة",
        desc: "تفاصيل واضحة للتجارب وإرشاد محلي وحجز رقمي سهل في إسطنبول.",
      },
      {
        number: "02",
        title: "ضيافة صادقة",
        desc: "تقاليد الضيافة العريقة في قالب رقمي مع دعم متواصل للضيوف طوال فترة الإقامة.",
      },
      {
        number: "03",
        title: "خبرة محلية أصيلة",
        desc: "«إسطنبول فقط.» نحن لا نتوسع في 100 مدينة؛ بل نعرف كل زقاق في غلطة، وكل حديقة شاي في كاديكوي، وكل سر تاريخي في السلطان أحمد.",
      },
    ],
    contactTitle: "تواصل معنا",
    contactSubtitle: "يمكنكم التواصل معنا مباشرة عبر البريد الإلكتروني أو واتساب لأي استفسار أو مساعدة.",
    emailLabel: "البريد الإلكتروني",
    whatsappLabel: "التواصل عبر واتساب",
    emergencyTitle: "خطوط الطوارئ والدعم الرسمية",
    emergency112: "مركز طوارئ 112",
    tourismPolice: "شرطة السياحة",
    municipality153: "مكتب مساعدة البلدية",
    guestCare: "رعاية ضيوف Purely",
    support247: "دعم 24/7",
  },
  ru: {
    istanbulkartTitle: "Официальная Istanbulkart и транспорт",
    istanbulkartDesc: "Официальная транспортная карта для метро, трамваев, паромов и поездов Мармарай. Приобретайте в автоматах на станциях или пополняйте онлайн.",
    istanbulkartCta: "Официальный портал Istanbulkart",
    museumPassTitle: "Официальный MuseumPass и билеты",
    museumPassDesc: "Официальный абонемент для прохода без очереди в исторические музеи и дворцы Министерства культуры и туризма.",
    museumPassCta: "Официальные билеты в музеи",
    charterHeading: "Прозрачность, гостеприимство и искренность",
    charterQuote: "«В Purely Istanbul мы предлагаем избранные городские впечатления и цифровую поддержку, чтобы каждый путешественник чувствовал себя в Стамбуле дорогим гостем.»",
    pillars: [
      {
        number: "01",
        title: "Ясность и удобство",
        desc: "Понятная информация о впечатлениях, местный контекст и удобное цифровое бронирование.",
      },
      {
        number: "02",
        title: "Истинное гостеприимство",
        desc: "Традиции гостеприимства в цифровом формате и внимательная поддержка гостей на протяжении всего пребывания.",
      },
      {
        number: "03",
        title: "Локальная экспертиза",
        desc: "«Только Стамбул.» Мы не распыляемся на 100 городов — мы знаем каждую брусчатку Галаты, каждый чайный сад Кадыкёя и каждую тайну Султанахмета.",
      },
    ],
    contactTitle: "Свяжитесь с нами",
    contactSubtitle: "Свяжитесь с нами напрямую по электронной почте или через WhatsApp по любым вопросам.",
    emailLabel: "Электронная почта",
    whatsappLabel: "Связь в WhatsApp",
    emergencyTitle: "Официальные экстренные службы и поддержка",
    emergency112: "Экстренная служба",
    tourismPolice: "Туристическая полиция",
    municipality153: "Справочная мэрии",
    guestCare: "Поддержка гостей Purely",
    support247: "24/7 Поддержка",
  },
  de: {
    istanbulkartTitle: "Offizielle Istanbulkart & Nahverkehr",
    istanbulkartDesc: "Die offizielle Fahrkarte für alle U-Bahnen, Straßenbahnen, Fähren und Marmaray-Züge. Erhältlich an Stationsautomaten oder online aufladbar.",
    istanbulkartCta: "Offizielles Istanbulkart-Portal",
    museumPassTitle: "Offizieller MuseumPass & Tickets",
    museumPassDesc: "Offizieller Skip-the-Line-Eintrittspass für historische Museen und Paläste des Ministeriums für Kultur und Tourismus.",
    museumPassCta: "Offizielle Museumstickets",
    charterHeading: "Transparent, Gastfreundlich und Echt Lokal",
    charterQuote: "„Bei Purely Istanbul bieten wir kuratierte Stadterlebnisse und digitale Begleitung, damit jeder Reisende Istanbul als geschätzter Gast erlebt.“",
    pillars: [
      {
        number: "01",
        title: "Klar & Direkt",
        desc: "Klare Erlebnisdetails, lokaler Kontext und unkomplizierte digitale Buchung in Istanbul.",
      },
      {
        number: "02",
        title: "Echte Gastfreundschaft",
        desc: "Zeitlose Gastfreundschaft digitalisiert mit aufmerksamer Gästebetreuung während Ihres Aufenthalts.",
      },
      {
        number: "03",
        title: "Hyperlokal & Aufrichtig",
        desc: "„Nichts als Istanbul.“ Wir kennen jedes Kopfsteinpflaster in Galata, jeden Teegarten in Kadıköy und jedes historische Geheimnis von Sultanahmet.",
      },
    ],
    contactTitle: "Kontaktieren Sie uns",
    contactSubtitle: "Erreichen Sie uns direkt per E-Mail oder WhatsApp für alle Fragen und Anliegen.",
    emailLabel: "E-Mail-Adresse",
    whatsappLabel: "WhatsApp-Kontakt",
    emergencyTitle: "Offizielle Notruf- & Supportnummern",
    emergency112: "Notrufzentrale",
    tourismPolice: "Tourismuspolizei",
    municipality153: "Bürgertelefon der Stadt",
    guestCare: "Purely Gästebetreuung",
    support247: "24/7 Support",
  },
  fr: {
    istanbulkartTitle: "Istanbulkart Officielle & Transports",
    istanbulkartDesc: "La carte officielle de transport valable dans tous les métros, tramways, ferries et trains Marmaray. Disponible aux bornes des stations ou rechargeable en ligne.",
    istanbulkartCta: "Portail Officiel Istanbulkart",
    museumPassTitle: "MuseumPass Officiel & Billets",
    museumPassDesc: "Pass officiel coupe-file valable dans les musées et palais historiques relevant du Ministère de la Culture et du Tourisme.",
    museumPassCta: "Billets Officiels des Musées",
    charterHeading: "Transparent, Hospitalier et Authentiquement Local",
    charterQuote: "« Chez Purely Istanbul, nous proposons des expériences locales sélectionnées et un accompagnement numérique pour vivre Istanbul comme un hôte d’honneur. »",
    pillars: [
      {
        number: "01",
        title: "Clair & Direct",
        desc: "Informations claires sur les expériences, conseils locaux et réservation numérique simple à Istanbul.",
      },
      {
        number: "02",
        title: "Hospitalité Sincère",
        desc: "La tradition d’accueil intemporelle digitalisée avec une assistance attentive tout au long de votre séjour.",
      },
      {
        number: "03",
        title: "Hyper-Local & Authentique",
        desc: "« Rien qu’Istanbul. » Nous connaissons chaque pavé de Galata, chaque jardin de thé de Kadıköy et chaque secret historique de Sultanahmet.",
      },
    ],
    contactTitle: "Contactez-nous",
    contactSubtitle: "Contactez-nous directement par e-mail ou WhatsApp pour toute question ou assistance.",
    emailLabel: "Adresse E-mail",
    whatsappLabel: "Contact WhatsApp",
    emergencyTitle: "Numéros Officiels d’Urgence & d’Assistance",
    emergency112: "Centre d’Appels d’Urgence",
    tourismPolice: "Police du Tourisme",
    municipality153: "Assistance Municipale",
    guestCare: "Service Client Purely",
    support247: "Support 24h/24",
  },
};

const PILLAR_ICONS = [ShieldCheck, HeartHandshake, Compass];

export function FairShoppingPolicy({ lang = "en" }: FairShoppingPolicyProps) {
  const ui = GUIDE_I18N[lang] || GUIDE_I18N.en;

  return (
    <div className="space-y-5 font-luxury-sans text-[#0B192C]">
      {/* Official Istanbulkart & MuseumPass Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div className="luxury-service-card p-5 space-y-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 flex items-center justify-center">
              <LuxuryCategoryIcon categoryKey="istanbulkart" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-luxury-sans text-[14.5px] sm:text-[16px] font-bold text-[#0B192C] leading-snug">
                {ui.istanbulkartTitle}
              </h3>
              <p className="text-xs text-[#4A433B] leading-relaxed">
                {ui.istanbulkartDesc}
              </p>
            </div>
          </div>

          <a
            href="https://www.istanbulkart.istanbul"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8E6C35] hover:to-[#6B4F21] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(92,68,30,0.22)] transition cursor-pointer"
          >
            <span>{ui.istanbulkartCta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="luxury-service-card p-5 space-y-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 flex items-center justify-center">
              <LuxuryCategoryIcon categoryKey="muzekart" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-luxury-sans text-[14.5px] sm:text-[16px] font-bold text-[#0B192C] leading-snug">
                {ui.museumPassTitle}
              </h3>
              <p className="text-xs text-[#4A433B] leading-relaxed">
                {ui.museumPassDesc}
              </p>
            </div>
          </div>

          <a
            href="https://muze.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8E6C35] hover:to-[#6B4F21] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(92,68,30,0.22)] transition cursor-pointer"
          >
            <span>{ui.museumPassCta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Guiding Principles */}
      <div className="luxury-service-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <LuxuryCategoryIcon categoryKey="shield" className="w-12 h-12 shrink-0" />
          <h3 className="font-luxury-serif text-lg sm:text-xl font-semibold text-[#0B192C] tracking-wide">
            {ui.charterHeading}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-[#2C2620] leading-relaxed">
          {ui.charterQuote}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {ui.pillars.map((pillar, idx) => {
            const Icon = PILLAR_ICONS[idx] || ShieldCheck;
            return (
              <div
                key={pillar.number}
                className="p-4 rounded-2xl bg-[#FAF8F4]/95 border border-[#D8CBB8] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-[#D47A43]/15 flex items-center justify-center text-[#D47A43]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[#64748B]">{pillar.number}</span>
                </div>
                <h4 className="font-luxury-serif text-sm font-bold text-[#0B192C]">{pillar.title}</h4>
                <p className="text-xs text-[#4A433B] leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Us (Bizimle İletişime Geçin) */}
      <div className="luxury-service-card p-5 space-y-3.5">
        <div className="space-y-1">
          <h3 className="font-luxury-serif text-lg font-semibold text-[#0B192C]">
            {ui.contactTitle}
          </h3>
          <p className="text-xs text-[#4A433B] leading-relaxed">
            {ui.contactSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="mailto:hi@usecomus.com"
            className="p-3.5 bg-[#FAF8F4]/95 rounded-2xl border border-[#D8CBB8] hover:border-[#9E7B42] flex items-center gap-3.5 transition group"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(92,68,30,0.2)]">
              <Mail className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[#6E655B] block text-[10.5px] font-medium">
                {ui.emailLabel}
              </span>
              <strong className="text-[#0B192C] group-hover:text-[#7D5E2A] text-sm font-mono font-bold truncate block transition">
                hi@usecomus.com
              </strong>
            </div>
          </a>

          <a
            href="https://wa.me/908503085906"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-[#FAF8F4]/95 rounded-2xl border border-[#D8CBB8] hover:border-[#9E7B42] flex items-center gap-3.5 transition group"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(92,68,30,0.2)]">
              <MessageCircle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[#6E655B] block text-[10.5px] font-medium">
                {ui.whatsappLabel}
              </span>
              <strong className="text-[#0B192C] group-hover:text-[#7D5E2A] text-sm font-mono font-bold truncate block transition">
                0850 308 59 06
              </strong>
            </div>
          </a>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="luxury-service-card p-5 space-y-3.5">
        <div className="flex items-center gap-3">
          <LuxuryCategoryIcon categoryKey="emergency" className="w-12 h-12 shrink-0" />
          <h3 className="font-luxury-serif text-lg font-semibold text-[#0B192C]">
            {ui.emergencyTitle}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">{ui.emergency112}</span>
            <strong className="text-[#8B3A2B] text-sm font-mono font-bold">112</strong>
          </div>
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">{ui.tourismPolice}</span>
            <strong className="text-[#0B192C] text-sm font-mono font-bold">+90 212 527 45 03</strong>
          </div>
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">{ui.municipality153}</span>
            <strong className="text-[#0B192C] text-sm font-mono font-bold">153</strong>
          </div>
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">{ui.guestCare}</span>
            <strong className="text-[#D47A43] text-xs font-mono font-bold">{ui.support247}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

