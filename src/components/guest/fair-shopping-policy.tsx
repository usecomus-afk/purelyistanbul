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
  whoAreWeTitle: string;
  whoAreWeDesc: string;
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
    charterHeading: "‘Tanrı Misafiri’: İstanbul'un Gerçek Ruhu",
    charterQuote: "İstanbul'u keşfederken kendinizi bir “yürüyen cüzdan” gibi hissetmenize asla izin vermiyoruz. Yüzyıllardır süregelen “Tanrı Misafiri” inancımızla, sizi bu şehrin onur konuğu olarak görüyoruz. Birlikte çalıştığımız güvenilir yerel insanlarla, seyahatinizdeki tüm soru işaretlerini ve kaygıları ortadan kaldırıyor; yerini güvene, şeffaflığa ve saf İstanbul deneyimine bırakıyoruz.",
    pillars: [
      {
        number: "01",
        title: "Net ve Şeffaf (Şeffaf)",
        desc: "Sürprizlere kapalı, İstanbul'a açığız. Size sadece süslü kelimeler değil; net deneyim detayları ve şehrin gerçek yerel bağlamını sunuyoruz. Nereye gideceğinizi, ne deneyimleyeceğinizi en başından biliyor; kolay dijital rezervasyon altyapımızla yerinizi saniyeler içinde ayırtıyorsunuz.",
      },
      {
        number: "02",
        title: "Gerçek Misafirperver (Misafirperver)",
        desc: "Gerçek misafirperverlik sadece güler yüzlü olmak değil, bu şehirde kusursuz zaman geçirmenizi sağlamaktır. İstanbul seyahatiniz boyunca size kesintisiz, özenli ve samimi bir yol arkadaşlığı sunmayı hedefledik. İşte bu yüzden, size özel eğitilmiş Gemini tabanlı yapay zeka rehberiniz Comus'u hayata geçirdik. Üstelik sizi mağazalarda uygulama arama ve indirme zahmetine de sokmuyoruz; telefonunuzda sadece “ana ekrana ekle” diyerek anında kullanmaya başlayabileceğiniz, son derece pratik bir mobil web uygulaması tasarladık.",
      },
      {
        number: "03",
        title: "Hiper-Yerel ve Samimi (Samimi)",
        desc: "“Sadece İstanbul.” Başka şehirlere yayılmadık; her yerde olma gibi bir amacımız yok. Biz sadece İstanbul’dayız ve her zaman en iyisini sunmak için “Sadece İstanbul” demeye devam edeceğiz. Bu şehir büyüleyici, ancak kabul edelim ki devasa bir metropole dönüştükçe ışıltısını kaybeden köşeleri de var. İçinde şahane esnaflar barındırsa da kalabalıklar arasında yorucu yüzlerle karşılaşmak mümkün. İşte bizim tek amacımız, İstanbul’un misafirlerini İstanbul’a yakışır şekilde ağırlamak; iyi, güzel ve değerli olanı onların karşısına çıkarırken bu değerleri korumak ve çoğalmalarına destek olmak.",
      },
    ],
    whoAreWeTitle: "Biz Kimiz?",
    whoAreWeDesc: "Purely Istanbul, bu şehrin gururlu yerlileri tarafından tek bir amaç için tasarlandı: Sizi turistik tuzaklardan tamamen uzak tutmak ve rotanızı doğrudan İstanbul'un gerçek kalbine çevirmek. Bizimle şehri bir turist gibi değil, İstanbullu gibi yaşarsınız.",
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
    charterHeading: "‘Tanrı Misafiri’: The True Spirit of Istanbul",
    charterQuote: "We will never let you feel like a “walking wallet” while exploring Istanbul. Rooted in our centuries-old belief of the “Guest of God” (Tanrı Misafiri), we see you as the honored guest of this city. Alongside the trusted locals we work with, we remove all the question marks and anxieties from your journey, replacing them with trust, transparency, and the pure Istanbul experience.",
    pillars: [
      {
        number: "01",
        title: "Clear & Direct (Transparent)",
        desc: "Closed to surprises, open to Istanbul. We don't just give you fancy words; we provide clear experience details and the city's true local context. You know exactly where you're going and what you'll experience from the very beginning, and you can secure your spot in seconds with our easy digital booking platform.",
      },
      {
        number: "02",
        title: "Genuine Hospitality (Welcoming)",
        desc: "True hospitality isn't just about a smiling face; it's about ensuring you have an absolutely wonderful time in this city. We set out to offer you a seamless, attentive, and sincere companionship throughout your Istanbul journey. That’s exactly why we brought Comus to life—your specially trained, Gemini-based AI guide. Plus, we don't want to bother you with downloading apps; we designed it as a highly practical mobile web app that you can start using instantly just by tapping \"add to home screen.\"",
      },
      {
        number: "03",
        title: "Hyper-Local and Intimate (Sincere)",
        desc: "\"Only Istanbul.\" We haven't expanded to other cities; we have no intention of being everywhere. We are only in Istanbul, and to always provide the best, we will continue to say \"Only Istanbul.\" This city is captivating, but let's admit, as it turns into a massive metropolis, it has corners that lose their sparkle. While it is home to wonderful local artisans and shopkeepers, it's also possible to encounter weary faces in the crowds. Our sole purpose is to host Istanbul’s guests in a manner worthy of this city; presenting them with what is good, beautiful, and valuable, while protecting these treasures and helping them flourish.",
      },
    ],
    whoAreWeTitle: "Who Are We?",
    whoAreWeDesc: "Purely Istanbul was created by the proud locals of this city for one single purpose: to keep you completely away from tourist traps and navigate you directly to the true heart of Istanbul. With us, you experience the city not as a tourist, but as a local.",
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
    charterHeading: "«ضيف الرحمن»: الروح الحقيقية لإسطنبول",
    charterQuote: "لن ندعك تشعر أبداً وكأنك «محفظة متنقلة» أثناء استكشاف إسطنبول. انطلاقاً من إيماننا المتجذر عبر القرون بمفهوم «ضيف الرحمن» (Tanrı Misafiri)، نراك ضيف الشرف في هذه المدينة. بالتعاون مع أهل المدينة الموثوقين، نزيل كل علامات الاستفهام والقلق من رحلتك، لنضع مكانها الثقة والشفافية وتجربة إسطنبول الخالصة.",
    pillars: [
      {
        number: "01",
        title: "واضح ومباشر (شفاف)",
        desc: "مغلقون أمام المفاجآت، منفتحون على إسطنبول. لا نقدم لك مجرد كلمات منمقة، بل نوفر تفاصيل واضحة للتجارب والسياق المحلي الحقيقي للمدينة، مع إمكانية حجز مكانك في ثوانٍ.",
      },
      {
        number: "02",
        title: "ضيافة أصيلة (مرحّبة)",
        desc: "الضيافة الحقيقية تعني ضمان قضائك وقتاً رائعاً في هذه المدينة. لذلك ابتكرنا Comus، دليلك الذكي المدعوم بـ Gemini، كتطبيق ويب عملي يمكنك استخدامه فوراً بإضافته إلى الشاشة الرئيسية دون عناء تحميل التطبيقات.",
      },
      {
        number: "03",
        title: "محلي بامتياز وصادق (صادق)",
        desc: "«إسطنبول فقط.» لم نتوسع إلى مدن أخرى؛ فنحن في إسطنبول فقط. هدفنا الوحيد هو استضافة ضيوف إسطنبول بما يليق بهذه المدينة؛ وتقديم كل ما هو جيد وجميل وقيّم لهم مع الحفاظ على هذه الكنوز ودعم ازدهارها.",
      },
    ],
    whoAreWeTitle: "من نحن؟",
    whoAreWeDesc: "صُممت Purely Istanbul من قِبل أبناء هذه المدينة الفخورين بها لهدف واحد فقط: إبعادك تماماً عن المصائد السياحية وتوجيه مسارك مباشرة إلى القلب الحقيقي لإسطنبول. معنا، تعيش المدينة كأحد أهلها لا كسائح.",
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
    charterHeading: "«Tanrı Misafiri»: Истинный дух Стамбула",
    charterQuote: "Мы никогда не позволим вам чувствовать себя «ходячим кошельком» во время знакомства со Стамбулом. Опираясь на нашу многовековую традицию «Гостя Бога» (Tanrı Misafiri), мы видим в вас почётного гостя этого города и заменяем любые сомнения доверием, прозрачностью и подлинным опытом Стамбула.",
    pillars: [
      {
        number: "01",
        title: "Чётко и прозрачно (Прозрачность)",
        desc: "Закрыты для неприятных сюрпризов, открыты для Стамбула. Мы даём не просто красивые слова, а точные детали впечатлений и настоящий местный контекст с удобным цифровым бронированием за секунды.",
      },
      {
        number: "02",
        title: "Истинное гостеприимство (Радушие)",
        desc: "Настоящее гостеприимство — это забота о том, чтобы вы провели время в городе безупречно. Именно поэтому мы создали Comus — вашего ИИ-гида на базе Gemini, доступного мгновенно через «Добавить на главный экран».",
      },
      {
        number: "03",
        title: "Гиперлокально и искренне (Искренность)",
        desc: "«Только Стамбул.» Мы не расширялись на другие города и остаёмся только в Стамбуле. Наша единственная цель — принимать гостей Стамбула достойно этому городу, открывая для них всё самое доброе, прекрасное и ценное.",
      },
    ],
    whoAreWeTitle: "Кто мы?",
    whoAreWeDesc: "Purely Istanbul создан гордыми жителями этого города с одной-единственной целью: полностью оградить вас от туристических ловушек и направить прямо в истинное сердце Стамбула. С нами вы проживаете город не как турист, а как местный житель.",
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
    charterHeading: "‚Tanrı Misafiri‘: Der wahre Geist Istanbuls",
    charterQuote: "Wir werden niemals zulassen, dass Sie sich beim Erkunden Istanbuls wie eine „wandelnde Brieftasche“ fühlen. Verwurzelt in unserer jahrhundertealten Tradition des „Gastes Gottes“ (Tanrı Misafiri) sehen wir Sie als Ehrengast dieser Stadt – mit Vertrauen, Transparenz und dem reinen Istanbul-Erlebnis.",
    pillars: [
      {
        number: "01",
        title: "Klar & Direkt (Transparent)",
        desc: "Geschlossen für Überraschungen, offen für Istanbul. Wir liefern klare Erlebnisdetails, echten lokalen Kontext und eine unkomplizierte digitale Buchung in Sekunden.",
      },
      {
        number: "02",
        title: "Echte Gastfreundschaft (Herzlich)",
        desc: "Wahre Gastfreundschaft bedeutet, dass Sie eine wunderbare Zeit in dieser Stadt verbringen. Deshalb haben wir Comus ins Leben gerufen – Ihren speziell trainierten, Gemini-basierten KI-Guide.",
      },
      {
        number: "03",
        title: "Hyperlokal & Innig (Aufrichtig)",
        desc: "„Nur Istanbul.“ Wir haben nicht in andere Städte expandiert. Unser einziges Ziel ist es, Istanbuls Gäste so zu empfangen, wie es dieser Stadt würdig ist, und ihnen das Gute, Schöne und Wertvolle zu zeigen.",
      },
    ],
    whoAreWeTitle: "Wer sind wir?",
    whoAreWeDesc: "Purely Istanbul wurde von stolzen Einheimischen dieser Stadt zu einem einzigen Zweck geschaffen: Sie vollständig von Touristenfallen fernzuhalten und Sie direkt ins wahre Herz Istanbuls zu führen. Mit uns erleben Sie die Stadt nicht als Tourist, sondern wie ein Einheimischer.",
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
    charterHeading: "« Tanrı Misafiri » : Le véritable esprit d’Istanbul",
    charterQuote: "Nous ne vous laisserons jamais vous sentir comme un « portefeuille ambulant » en explorant Istanbul. Enracinés dans notre tradition séculaire de l’« Hôte de Dieu » (Tanrı Misafiri), nous vous accueillons comme l’invité d’honneur de cette ville, dans la confiance, la transparence et l’authenticité.",
    pillars: [
      {
        number: "01",
        title: "Clair & Direct (Transparent)",
        desc: "Fermés aux mauvaises surprises, ouverts à Istanbul. Nous vous offrons des détails clairs sur chaque expérience, le vrai contexte local et une réservation numérique en quelques secondes.",
      },
      {
        number: "02",
        title: "Hospitalité Véritable (Accueillant)",
        desc: "La vraie hospitalité consiste à vous assurer un séjour inoubliable. C’est pourquoi nous avons créé Comus, votre guide IA basé sur Gemini, accessible instantanément en l’ajoutant à votre écran d’accueil.",
      },
      {
        number: "03",
        title: "Hyper-Local & Sincère (Sincère)",
        desc: "« Seulement Istanbul. » Nous ne nous sommes pas dispersés dans d’autres villes. Notre seul but est d’accueillir les hôtes d’Istanbul d’une manière digne de cette ville et de préserver ses trésors.",
      },
    ],
    whoAreWeTitle: "Qui sommes-nous ?",
    whoAreWeDesc: "Purely Istanbul a été créé par les fiers habitants de cette ville dans un seul but : vous tenir totalement à l’écart des pièges à touristes et vous guider directement vers le véritable cœur d’Istanbul. Avec nous, vous vivez la ville non pas en touriste, mais comme un Stambouliote.",
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
                className="p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-[rgba(240,195,70,0.35)] border border-[rgba(220,175,50,0.6)] flex items-center justify-center text-[#7D5E2A]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="golden-pill-badge px-2 py-0.5 font-mono text-[10.5px] font-bold text-[#2C1E0F]">{pillar.number}</span>
                </div>
                <h4 className="font-luxury-serif text-sm font-bold text-[#0B192C]">{pillar.title}</h4>
                <p className="text-xs text-[#4A433B] leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Who Are We? / Biz Kimiz? */}
        <div className="p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] space-y-1.5 mt-2">
          <h4 className="font-luxury-serif text-sm font-bold text-[#0B192C]">{ui.whoAreWeTitle}</h4>
          <p className="text-xs text-[#4A433B] leading-relaxed">{ui.whoAreWeDesc}</p>
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
            className="p-3.5 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] hover:border-[#9E7B42] active:opacity-75 active:scale-[0.985] flex items-center gap-3.5 transition-all duration-150 group"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(92,68,30,0.2)]">
              <Mail className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[#5C4938] block text-[10.5px] font-medium">
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
            className="p-3.5 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] hover:border-[#9E7B42] active:opacity-75 active:scale-[0.985] flex items-center gap-3.5 transition-all duration-150 group"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(92,68,30,0.2)]">
              <MessageCircle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[#5C4938] block text-[10.5px] font-medium">
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
          <div className="p-3 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)]">
            <span className="text-[#5C4938] block text-[10.5px] font-medium">{ui.emergency112}</span>
            <strong className="text-[#8B3A2B] text-sm font-mono font-bold">112</strong>
          </div>
          <div className="p-3 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)]">
            <span className="text-[#5C4938] block text-[10.5px] font-medium">{ui.tourismPolice}</span>
            <strong className="text-[#0B192C] text-sm font-mono font-bold">+90 212 527 45 03</strong>
          </div>
          <div className="p-3 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)]">
            <span className="text-[#5C4938] block text-[10.5px] font-medium">{ui.municipality153}</span>
            <strong className="text-[#0B192C] text-sm font-mono font-bold">153</strong>
          </div>
          <div className="p-3 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)]">
            <span className="text-[#5C4938] block text-[10.5px] font-medium">{ui.guestCare}</span>
            <strong className="text-[#7D5E2A] text-xs font-mono font-bold">{ui.support247}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

