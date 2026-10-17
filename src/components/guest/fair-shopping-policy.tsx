"use client";

import { ExternalLink, ShieldCheck, Scale, HeartHandshake, Compass } from "lucide-react";
import Link from "next/link";
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
  charterBadge: string;
  charterHeading: string;
  charterQuote: string;
  charterLink: string;
  pillars: { number: string; title: string; desc: string }[];
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
    charterBadge: "Etik İlkelerimiz & Misafir Taahhüdümüz",
    charterHeading: "Şeffaf, Adil, Misafirperver ve Samimi Yerel Deneyim",
    charterQuote: "“Purely İstanbul olarak her misafirimizin İstanbul’u bir turist gibi değil, baş tacı edilen bir ‘Tanrı Misafiri’ olarak deneyimlemesi gerektiğine inanıyoruz. Radikal şeffaflık, denetlenmiş yerel iş ortakları ve doğrudan sorumluluk ilkesiyle endişenin yerine güveni koyuyoruz.”",
    charterLink: "Etik İlkelerimizin Tamamını Okuyun →",
    pillars: [
      {
        number: "01",
        title: "Radikal Şeffaflık",
        desc: "Gerçek yerel fiyatlar, sıfır turist komisyonu, sıfır gizli ücret ve güvenli ödeme altyapısı.",
      },
      {
        number: "02",
        title: "Herkes İçin Adalet",
        desc: "Küresel platformlar yerel tekne kaptanlarından ve zanaatkarlardan %25-30 komisyon alırken, biz yalnızca %10-12 teknoloji hizmet bedeli uyguluyoruz; böylece hem yerel esnaf kazanıyor hem misafirlerimiz tasarruf ediyor.",
      },
      {
        number: "03",
        title: "Gerçek Misafirperverlik",
        desc: "Köklü Türk misafirperverliği dijitale taşındı. Bir deneyim doğrulanmış standartlarımızı karşılamazsa, özel misafir ilişkileri ekibimiz empati ve hızla çözüm üretir.",
      },
      {
        number: "04",
        title: "Tamamen Yerel & Samimi",
        desc: "“Sadece İstanbul.” 100 şehre dağılmıyoruz; Galata’nın her Arnavut kaldırımını, Kadıköy’ün her çay bahçesini ve Sultanahmet’in her tarihi sırrını biliyoruz.",
      },
    ],
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
    charterBadge: "Our Ethical Charter & Guest Commitment",
    charterHeading: "Transparent, Fair, Hospitable, and Sincerely Local",
    charterQuote: "“At Purely Istanbul, we believe every traveler should experience Istanbul not as a walking wallet, but as an honored guest. We replace anxiety with authenticity through radical transparency, pre-vetted local partners, and direct accountability.”",
    charterLink: "Read Our Full Ethical Charter →",
    pillars: [
      {
        number: "01",
        title: "Radical Transparency",
        desc: "Real local rates, zero tourist markups, zero hidden backroom commissions, secure Stripe processing.",
      },
      {
        number: "02",
        title: "Fairness for All",
        desc: "While global platforms take 25-30% from local boat captains and artisans, we charge a modest 10-12% tech fee so authentic craftspeople thrive and travelers save.",
      },
      {
        number: "03",
        title: "Genuine Hospitality",
        desc: "The timeless hosting tradition digitized. If an experience doesn't match our verified standards, our dedicated guest care resolves it with empathy and speed.",
      },
      {
        number: "04",
        title: "Hyper-Local & Sincere",
        desc: "\"Nothing but Istanbul.\" We don't stretch across 100 cities. We know every cobble of Galata, every tea garden in Kadıköy, and every historical secret of Sultanahmet.",
      },
    ],
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
    charterBadge: "ميثاقنا الأخلاقي والتزامنا تجاه الضيوف",
    charterHeading: "شفافية وعدالة وضيافة أصيلة",
    charterQuote: "«في Purely إسطنبول، نؤمن بأن كل مسافر يجب أن يعيش تجربة إسطنبول كضيف مكرّم. نستبدل القلق بالأصالة من خلال الشفافية الكاملة والشركاء المحليين المعتمدين والمسؤولية المباشرة.»",
    charterLink: "اقرأ ميثاقنا الأخلاقي الكامل ←",
    pillars: [
      {
        number: "01",
        title: "شفافية تامة",
        desc: "أسعار محلية حقيقية، بدون زيادات سياحية أو عمولات خفية، ومعالجة دفع آمنة.",
      },
      {
        number: "02",
        title: "العدالة للجميع",
        desc: "بينما تأخذ المنصات العالمية 25-30% من الحرفيين وقباطنة القوارب المحليين، نحن نفرض رسوم تقنية متواضعة بنسبة 10-12% ليدخر المسافرون ويزدهر المجتمع المحلي.",
      },
      {
        number: "03",
        title: "ضيافة صادقة",
        desc: "تقاليد الضيافة العريقة في قالب رقمي. إذا لم تتطابق أي تجربة مع معاييرنا المعتمدة، فإن فريق رعاية الضيوف لدينا يحلها بتعاطف وسرعة.",
      },
      {
        number: "04",
        title: "خبرة محلية أصيلة",
        desc: "«إسطنبول فقط.» نحن لا نتوسع في 100 مدينة؛ بل نعرف كل زقاق في غلطة، وكل حديقة شاي في كاديكوي، وكل سر تاريخي في السلطان أحمد.",
      },
    ],
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
    charterBadge: "Наша этическая хартия и обязательства перед гостями",
    charterHeading: "Прозрачность, честность, гостеприимство и искренность",
    charterQuote: "«В Purely Istanbul мы убеждены, что каждый путешественник должен чувствовать себя в Стамбуле дорогим и почетным гостем. Мы заменяем тревогу уверенностью благодаря полной прозрачности, проверенным партнерам и прямой ответственности.»",
    charterLink: "Читать полную этическую хартию →",
    pillars: [
      {
        number: "01",
        title: "Радикальная прозрачность",
        desc: "Честные местные цены, никаких туристических наценок и скрытых комиссий, безопасная оплата.",
      },
      {
        number: "02",
        title: "Справедливость для всех",
        desc: "Пока глобальные платформы берут 25–30% комиссии у местных капитанов и мастеров, наш технологический сбор составляет всего 10–12%, помогая гостям экономить.",
      },
      {
        number: "03",
        title: "Истинное гостеприимство",
        desc: "Вековые традиции гостеприимства в цифровом формате. Если впечатление не соответствует нашим стандартам, служба заботы о гостях оперативно решит вопрос.",
      },
      {
        number: "04",
        title: "Локальная экспертиза",
        desc: "«Только Стамбул.» Мы не распыляемся на 100 городов — мы знаем каждую брусчатку Галаты, каждый чайный сад Кадыкёя и каждую тайну Султанахмета.",
      },
    ],
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
    charterBadge: "Unsere Ethik-Charta & Gästeversprechen",
    charterHeading: "Transparent, Fair, Gastfreundlich und Echt Lokal",
    charterQuote: "„Bei Purely Istanbul glauben wir, dass jeder Reisende Istanbul als geehrter Gast erleben sollte. Wir ersetzen Unsicherheit durch Authentizität – mit radikaler Transparenz, geprüften lokalen Partnern und direkter Verantwortung.“",
    charterLink: "Vollständige Ethik-Charta lesen →",
    pillars: [
      {
        number: "01",
        title: "Radikale Transparenz",
        desc: "Echte lokale Preise, null Touristenaufschläge, null versteckte Provisionen und sichere Zahlungsabwicklung.",
      },
      {
        number: "02",
        title: "Fairness für Alle",
        desc: "Während globale Plattformen 25–30 % von lokalen Kapitänen und Kunsthandwerkern verlangen, berechnen wir nur 10–12 % Technologiegebühr – zum Vorteil für Gäste und Einheimische.",
      },
      {
        number: "03",
        title: "Echte Gastfreundschaft",
        desc: "Zeitlose Gastfreundschaft digitalisiert. Wenn ein Erlebnis nicht unseren geprüften Standards entspricht, löst unser Gästeservice das Anliegen schnell und kulant.",
      },
      {
        number: "04",
        title: "Hyperlokal & Aufrichtig",
        desc: "„Nichts als Istanbul.“ Wir kennen jedes Kopfsteinpflaster in Galata, jeden Teegarten in Kadıköy und jedes historische Geheimnis von Sultanahmet.",
      },
    ],
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
    charterBadge: "Notre Charte Éthique & Engagement Client",
    charterHeading: "Transparent, Équitable, Hospitalier et Authentiquement Local",
    charterQuote: "« Chez Purely Istanbul, nous croyons que chaque voyageur doit vivre Istanbul comme un hôte d’honneur. Nous remplaçons l’incertitude par l’authenticité grâce à une transparence totale, des partenaires locaux vérifiés et une responsabilité directe. »",
    charterLink: "Lire notre Charte Éthique complète →",
    pillars: [
      {
        number: "01",
        title: "Transparence Totale",
        desc: "De vrais tarifs locaux, zéro majoration touristique, zéro commission cachée et paiement sécurisé.",
      },
      {
        number: "02",
        title: "Équité pour Tous",
        desc: "Alors que les plateformes mondiales prélèvent 25 à 30 % aux capitaines et artisans locaux, nous appliquons seulement 10 à 12 % de frais technologiques pour que chacun y gagne.",
      },
      {
        number: "03",
        title: "Hospitalité Sincère",
        desc: "La tradition d’accueil intemporelle digitalisée. Si une expérience ne correspond pas à nos standards vérifiés, notre service client la résout avec empathie et rapidité.",
      },
      {
        number: "04",
        title: "Hyper-Local & Authentique",
        desc: "« Rien qu’Istanbul. » Nous connaissons chaque pavé de Galata, chaque jardin de thé de Kadıköy et chaque secret historique de Sultanahmet.",
      },
    ],
    emergencyTitle: "Numéros Officiels d’Urgence & d’Assistance",
    emergency112: "Centre d’Appels d’Urgence",
    tourismPolice: "Police du Tourisme",
    municipality153: "Assistance Municipale",
    guestCare: "Service Client Purely",
    support247: "Support 24h/24",
  },
};

const PILLAR_ICONS = [ShieldCheck, Scale, HeartHandshake, Compass];

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

      {/* Our Ethical Charter & Guest Commitment */}
      <div className="luxury-service-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <LuxuryCategoryIcon categoryKey="shield" className="w-12 h-12 shrink-0" />
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#D47A43] block">
              {ui.charterBadge}
            </span>
            <h3 className="font-luxury-serif text-lg sm:text-xl font-semibold text-[#0B192C] tracking-wide mt-0.5">
              {ui.charterHeading}
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#2C2620] leading-relaxed">
          {ui.charterQuote}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

        <div className="pt-2 flex justify-end">
          <Link
            href="/our-philosophy"
            className="text-xs font-semibold text-[#D47A43] hover:underline"
          >
            {ui.charterLink}
          </Link>
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

