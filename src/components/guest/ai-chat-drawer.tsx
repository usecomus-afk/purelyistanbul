"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Hotel, Language } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { ChatMessage } from '@/lib/gemini';
import {
  Send,
  X,
  RotateCcw,
  Sparkles,
  WifiOff,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export interface AiChatDrawerProps {
  hotel?: Hotel;
  roomNumber?: string;
  lang?: Language;
  isOpen: boolean;
  onClose: () => void;
  /** Optional callback when an explore_category action is triggered */
  onExploreCategory?: (categoryKey: string) => void;
}

export interface ParsedComusAction {
  raw: string;
  actionType: string; // 'explore_category' | 'in_stay'
  targetKind: 'id' | 'service';
  targetValue: string; // 'bosphorus' | 'transfer' | 'breakfast' | 'support' | 'laundry' | etc.
  label: string;
  sublabel: string;
}

export const TURKISH_ONBOARDING_MESSAGE = `İstanbul’a hoş geldiniz! Ben Comus. 🕌

Ben bu şehirde sıradan bir turist gibi kaybolmamanız, dolandırıcılardan ve fahiş fiyat tuzaklarından korunarak İstanbul’u gerçek bir misafir gibi güvenle yaşamanız için geliştirildim.

Kaldığınız bu odada ve şehrin sokaklarında sizin için yapabileceklerim:

• Sizi Turist Tuzaklarından Korurum: Bindiğiniz taksinin ücretinden gittiğiniz restorandaki adisyona kadar şüphelendiğiniz her şeyi bana sorabilirsiniz; rayiç fiyatları söyler, kazıklanmanızı engellerim.
• Oda İçi İhtiyaçlarınızı Çözerim: Wi-Fi bağlantısı, klima/teknik arızalar, ekstra temizlik talepleri ya da sabah kapınıza gelecek taze bir kahvaltı sepeti için doğrudan mülk yönetim ekibinizle iletişim kurarım.
• Şehrin Gerçek Yüzünü Gösteririm: Turist kalabalıklarına boğulmadan en otantik lezzet duraklarını, gün batımı rotalarını, gizli hanları ve güvenilir Boğaz turlarını sizin zevkinize göre anlık olarak planlarım.
• Kendi Dilinizde Yanınızdayım: İstanbul’u adım adım gezerken aklınıza takılan her şeyi ana dilinizde bana sorabilirsiniz; 7/24 cebinizdeki yerel dostunuzum.

Şu an sizin için ne yapmamı istersiniz?`;

export const TURKISH_QUICK_ACTION_CHIPS = [
  '🛡️ Beni İstanbul’daki yaygın tuzaklara karşı uyar',
  '🥐 Odam için hizmet/kahvaltı talep et',
  '📍 Bana buraya en yakın otantik yerleri öner',
  '🗺️ Bugün için bana özel bir rota çiz',
] as const;

export const OFFLINE_FALLBACK_MESSAGE_TR =
  'Comus ile bağlantı kurulamadı. Lütfen Wi-Fi bağlantınızı kontrol edin.';

// Matches both single tags like [action:in_stay, service:breakfast]
// and compound slash tags like [action:in_stay, service:support/breakfast/laundry]
const ACTION_TAG_REGEX = /\[action:(\w+),\s*(id|service):([\w/]+)\]/g;

const ACTION_METADATA: Record<
  string,
  { label: string; sublabel: string; categoryKey?: string }
> = {
  'service:breakfast': {
    label: '🥐 Order Doorstep Breakfast Basket',
    sublabel: 'Fresh artisanal Turkish spread delivered to your room door',
  },
  'service:support': {
    label: '🛎️ Open Urgent Room & Technical Ticket',
    sublabel: 'Direct WhatsApp dispatch to your property management team',
  },
  'service:laundry': {
    label: '👔 Request Express Laundry & Garment Care',
    sublabel: 'Doorstep laundry pickup & 24-hour pressed delivery',
  },
  'id:transfer': {
    label: '🚐 Book Scam-Free VIP Chauffeur',
    sublabel: 'Fixed-rate licensed Mercedes-Benz Vito airport & city fleet',
    categoryKey: 'cat-7',
  },
  'id:bosphorus': {
    label: '⛵ Explore Verified Bosphorus Cruises',
    sublabel: 'Private yachts & small-group sunset cruises with zero markups',
    categoryKey: 'cat-1',
  },
  'id:history': {
    label: '🏛️ Explore Historic Routes & Fast-Track Walks',
    sublabel: 'Licensed historian guides for Hagia Sophia, Blue Mosque & cisterns',
    categoryKey: 'cat-2',
  },
  'id:hammam': {
    label: '🫧 Explore Traditional Turkish Bath & Hammam Rituals',
    sublabel: 'Vetted 16th-century Ottoman marble baths & private scrub rituals',
    categoryKey: 'cat-4',
  },
  'id:culinary': {
    label: '🍢 Explore Culinary & Street Food Trails',
    sublabel: 'Celebrated local staples across Kadıköy, Karaköy & Fatih',
    categoryKey: 'cat-3',
  },
  'id:photography': {
    label: '📸 Explore Rooftop Photography & Costumes',
    sublabel: 'Private golden-hour Bosphorus & Galata rooftop sessions',
    categoryKey: 'cat-6',
  },
};

const COMUS_I18N: Record<
  Language,
  {
    headerTitle: string;
    statusBadge: string;
    suiteLabel: string;
    resetBtn: string;
    historyCleared: string;
    offlineMsg: string;
    connInterrupted: string;
    verifiedActionBadge: string;
    typingText: string;
    inputPlaceholder: string;
    justNow: string;
    chips: string[];
    welcomeText: string;
    actions: Record<string, { label: string; sublabel: string }>;
  }
> = {
  tr: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'Çevrimiçi • Yerel Dostunuz',
    suiteLabel: 'Oda',
    resetBtn: 'Sıfırla',
    historyCleared: 'Sohbet geçmişi temizlendi.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Doğrulanmış Comus İşlemi',
    typingText: 'Comus yanıtınızı hazırlıyor...',
    inputPlaceholder: 'Comus’a dilediğiniz dilde sorun (taksi, adisyon, oda talebi, rota)...',
    justNow: 'Az önce',
    chips: [...TURKISH_QUICK_ACTION_CHIPS],
    welcomeText: TURKISH_ONBOARDING_MESSAGE,
    actions: {
      'service:breakfast': {
        label: '🥐 Kapıya Taze Kahvaltı Sepeti İste',
        sublabel: 'Odanızın kapısına taze geleneksel Türk kahvaltısı teslimatı',
      },
      'service:support': {
        label: '🛎️ Oda İçi Teknik / Temizlik Talebi Aç',
        sublabel: 'Mülk yönetim ekibinizin WhatsApp hattına anında iletilir',
      },
      'service:laundry': {
        label: '👔 Ekspres Çamaşır & Ütü Hizmeti İste',
        sublabel: 'Kapıdan teslim alım ve 24 saatte ütülü teslimat',
      },
      'id:transfer': {
        label: '🚐 Sabit Fiyatlı VIP Şoförlü Transfer',
        sublabel: 'Lisanslı Mercedes-Benz Vito havalimanı ve şehir içi filosu',
      },
      'id:bosphorus': {
        label: '⛵ Doğrulanmış Boğaz Turlarını Keşfet',
        sublabel: 'Komisyonsuz özel yatlar ve butik gün batımı turları',
      },
      'id:history': {
        label: '🏛️ Tarihi Rotalar & Hızlı Geçiş Turları',
        sublabel: 'Ayasofya, Sultanahmet ve Sarnıçlar için lisanslı tarihçi rehberler',
      },
      'id:hammam': {
        label: '🫧 Geleneksel Türk Hamamı & Kese Ritüeli',
        sublabel: 'Seçkin 16. yüzyıl Osmanlı hamamları ve özel bakım paketleri',
      },
      'id:culinary': {
        label: '🍢 Gastronomi & Sokak Lezzetleri Rotaları',
        sublabel: 'Kadıköy, Karaköy ve Fatih’in en sevilen yerel lezzet durakları',
      },
      'id:photography': {
        label: '📸 Teras Fotoğraf Çekimi & Kostüm',
        sublabel: 'Boğaz ve Galata teraslarında gün batımı özel fotoğraf çekimi',
      },
    },
  },
  en: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'Online • Local Guardian',
    suiteLabel: 'Suite',
    resetBtn: 'Reset',
    historyCleared: 'Conversation history cleared.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Verified Comus Action',
    typingText: 'Comus is preparing your local guidance...',
    inputPlaceholder: 'Ask Comus in any language (taxi fare, bill check, room request, route)...',
    justNow: 'Just now',
    chips: [
      '🛡️ Warn me about common tourist traps in Istanbul',
      '🥐 Request room service or a fresh breakfast basket',
      '📍 Recommend the nearest authentic local spots',
      '🗺️ Plan a custom crowd-free itinerary for today',
    ],
    welcomeText: `Welcome to Istanbul! I am Comus. 🕌

I was created so you never feel lost like an ordinary tourist in this city—protecting you from scams and overpricing so you can experience Istanbul safely like a true local guest.

Here is what I can do for you in your room and out on the streets of the city:

• I Protect You from Tourist Traps: From your taxi fare to the bill at a restaurant, you can ask me about anything you suspect; I will tell you the fair local rates and stop you from being overcharged.
• I Solve Your In-Room Needs: For Wi-Fi connection, AC/technical issues, extra housekeeping requests, or a fresh breakfast basket delivered to your door in the morning, I communicate directly with your property management team.
• I Show You the Real Face of the City: Without getting lost in tourist crowds, I instantly plan the most authentic culinary stops, sunset routes, hidden historic courtyards (hans), and trusted Bosphorus cruises tailored to your taste.
• I Am by Your Side in Your Own Language: As you explore Istanbul step by step, you can ask me anything in your native language; I am your 24/7 local friend in your pocket.

What would you like me to do for you right now?`,
    actions: {
      'service:breakfast': ACTION_METADATA['service:breakfast'],
      'service:support': ACTION_METADATA['service:support'],
      'service:laundry': ACTION_METADATA['service:laundry'],
      'id:transfer': ACTION_METADATA['id:transfer'],
      'id:bosphorus': ACTION_METADATA['id:bosphorus'],
      'id:history': ACTION_METADATA['id:history'],
      'id:hammam': ACTION_METADATA['id:hammam'],
      'id:culinary': ACTION_METADATA['id:culinary'],
      'id:photography': ACTION_METADATA['id:photography'],
    },
  },
  ar: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'متصل • حارسك المحلي',
    suiteLabel: 'غرفة',
    resetBtn: 'إعادة تعيين',
    historyCleared: 'تم مسح سجل المحادثة.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'إجراء موثق من Comus',
    typingText: 'يقوم Comus بإعداد إرشاداتك المحلية...',
    inputPlaceholder: 'اسأل Comus بأي لغة (أسعار التاكسي، طلبات الغرفة، الأماكن الأصيلة)...',
    justNow: 'الآن',
    chips: [
      '🛡️ حذرني من الفخاخ السياحية الشائعة في إسطنبول',
      '🥐 اطلب خدمة الغرف أو سلة إفطار طازجة',
      '📍 اقترح أقرب الأماكن المحلية الأصيلة من هنا',
      '🗺️ خطط لي مساراً خاصاً لهذا اليوم',
    ],
    welcomeText: `أهلاً بك في إسطنبول! أنا Comus. 🕌

لقد تم تطويري لكي لا تضيع كسائح عادي في هذه المدينة، ولحمايتك من الاحتيال والأسعار المبالغ فيها لتعيش إسطنبول بأمان كضيف حقيقي.

إليك ما يمكنني القيام به من أجلك في غرفتك وفي شوارع المدينة:

• أحميك من فخاخ السياح: من أجرة التاكسي إلى فاتورة المطعم، يمكنك سؤالي عن أي شيء تشك فيه؛ سأخبرك بالأسعار الحقيقية وأمنع استغلالك.
• أحل احتياجاتك داخل الغرفة: لاتصال Wi-Fi، أعطال التكييف، طلبات التنظيف الإضافية أو سلة إفطار طازجة تصل لباب غرفتك صباحاً، أتواصل مباشرة مع فريق إدارة مكان إقامتك.
• أريك الوجه الحقيقي للمدينة: بعيداً عن ازدحام السياح، أخطط لك فوراً أصدق محطات التذوق، مسارات الغروب، الخانات التاريخية المخفية وجولات البوسفور الموثوقة حسب ذوقك.
• بجانبك بلغتك الأم: أثناء تجولك في إسطنبول خطوة بخطوة، يمكنك سؤالي عن أي شيء بلغتك على مدار الساعة؛ أنا صديقك المحلي في جيبك 24/7.

ماذا تود أن أفعل من أجلك الآن؟`,
    actions: {
      'service:breakfast': {
        label: '🥐 اطلب سلة الإفطار إلى باب الغرفة',
        sublabel: 'تشكيلة إفطار تركي طازج توصل مباشرة إلى غرفتك',
      },
      'service:support': {
        label: '🛎️ فتح طلب صيانة أو خدمة للغرفة',
        sublabel: 'إرسال فوري عبر واتساب إلى فريق إدارة العقار',
      },
      'service:laundry': {
        label: '👔 طلب غسيل وكي الملابس السريع',
        sublabel: 'استلام من باب الغرفة وتسليم خلال 24 ساعة',
      },
      'id:transfer': {
        label: '🚐 حجز سيارة VIP مع سائق بسعر ثابت',
        sublabel: 'أسطول مرسيدس فيتو مرخص للمطار والمدينة',
      },
      'id:bosphorus': {
        label: '⛵ استكشف جولات البوسفور المعتمدة',
        sublabel: 'يخوت خاصة وجولات غروب الشمس بدون عمولات إضافية',
      },
      'id:history': {
        label: '🏛️ استكشف المسارات التاريخية والدخول السريع',
        sublabel: 'مرشدون مؤرخون مرخصون لآيا صوفيا والمسجد الأزرق',
      },
      'id:hammam': {
        label: '🫧 استكشف طقوس الحمام التركي التقليدي',
        sublabel: 'حمامات عثمانية تاريخية معتمدة وجلسات تقشير خاصة',
      },
      'id:culinary': {
        label: '🍢 استكشف جولات التذوق وطعام الشارع',
        sublabel: 'أشهر النكهات المحلية في كاديكوي وكاراكوي والفاتح',
      },
      'id:photography': {
        label: '📸 جلسات التصوير على الأسطح والأزياء',
        sublabel: 'جلسات تصوير خاصة عند الغروب بإطلالة البوسفور وغالاتا',
      },
    },
  },
  ru: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'Онлайн • Ваш защитник и гид',
    suiteLabel: 'Номер',
    resetBtn: 'Сброс',
    historyCleared: 'История чата очищена.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Проверенное действие Comus',
    typingText: 'Comus готовит ответ...',
    inputPlaceholder: 'Спросите Comus на любом языке (такси, счет, услуги в номере, маршрут)...',
    justNow: 'Только что',
    chips: [
      '🛡️ Предупреди меня о частых ловушках для туристов',
      '🥐 Заказать услугу в номер или корзину с завтраком',
      '📍 Посоветуй ближайшие аутентичные места',
      '🗺️ Составь для меня персональный маршрут на сегодня',
    ],
    welcomeText: `Добро пожаловать в Стамбул! Я Comus. 🕌

Я создан для того, чтобы вы не потерялись в этом городе как обычный турист, были защищены от мошенников и завышенных цен и могли безопасно прожить Стамбул как настоящий дорогой гость.

Вот что я могу сделать для вас в этом номере и на улицах города:

• Защищу от туристических ловушек: От стоимости поездки на такси до счета в ресторане — спрашивайте меня обо всем, что вызывает сомнения; я назову честные местные цены и не дам вас обмануть.
• Решу вопросы в номере: Подключение к Wi-Fi, кондиционер/технические неполадки, дополнительная уборка или свежая корзина с завтраком утром прямо к вашей двери — я напрямую свяжусь с управляющей командой вашего отеля.
• Покажу настоящее лицо города: Без туристических толп мгновенно спланирую под ваш вкус самые аутентичные гастро-точки, маршруты на закате, тайные исторические ханы и проверенные прогулки по Босфору.
• Рядом на вашем родном языке: Гуляя по Стамбулу шаг за шагом, вы можете спрашивать меня о чем угодно на своем языке; я ваш местный друг в кармане 24/7.

Что бы вы хотели, чтобы я сделал для вас прямо сейчас?`,
    actions: {
      'service:breakfast': {
        label: '🥐 Заказать корзину с завтраком к двери',
        sublabel: 'Свежий турецкий завтрак с доставкой прямо в ваш номер',
      },
      'service:support': {
        label: '🛎️ Открыть заявку по номеру / техподдержке',
        sublabel: 'Мгновенное уведомление управляющему в WhatsApp',
      },
      'service:laundry': {
        label: '👔 Заказать экспресс-прачечную и глажку',
        sublabel: 'Забор вещей у двери и доставка через 24 часа',
      },
      'id:transfer': {
        label: '🚐 Заказать VIP-трансфер по фиксированной цене',
        sublabel: 'Лицензированный флот Mercedes-Benz Vito в аэропорт и по городу',
      },
      'id:bosphorus': {
        label: '⛵ Проверенные круизы по Босфору',
        sublabel: 'Приватные яхты и вечерние прогулки без наценок',
      },
      'id:history': {
        label: '🏛️ Исторические маршруты без очередей',
        sublabel: 'Лицензированные гиды-историки в Айя-Софию и Голубую мечеть',
      },
      'id:hammam': {
        label: '🫧 Традиционные турецкие хаммамы и СПА',
        sublabel: 'Проверенные османские мраморные бани XVI века',
      },
      'id:culinary': {
        label: '🍢 Гастрономические маршруты и стрит-фуд',
        sublabel: 'Лучшие локальные места в Кадыкёе, Каракёе и Фатихе',
      },
      'id:photography': {
        label: '📸 Фотосессии на крышах и в платьях',
        sublabel: 'Приватные съемки на закате с видом на Босфор и Галату',
      },
    },
  },
  de: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'Online • Lokaler Beschützer',
    suiteLabel: 'Zimmer',
    resetBtn: 'Reset',
    historyCleared: 'Gesprächsverlauf gelöscht.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Verifizierte Comus-Aktion',
    typingText: 'Comus bereitet Ihre Antwort vor...',
    inputPlaceholder: 'Fragen Sie Comus in Ihrer Sprache (Taxipreis, Zimmerwunsch, Route)...',
    justNow: 'Gerade eben',
    chips: [
      '🛡️ Warne mich vor häufigen Touristenfallen in Istanbul',
      '🥐 Zimmerservice oder frischen Frühstückskorb anfordern',
      '📍 Empfiehl mir die nächsten authentischen Orte',
      '🗺️ Plane eine individuelle Route für heute',
    ],
    welcomeText: `Willkommen in Istanbul! Ich bin Comus. 🕌

Ich wurde entwickelt, damit Sie sich in dieser Stadt nicht wie ein gewöhnlicher Tourist verlieren, sondern vor Betrügern und überhöhten Preisen geschützt sind und Istanbul sicher wie ein echter Gast erleben.

Das kann ich in Ihrem Zimmer und auf den Straßen der Stadt für Sie tun:

• Ich schütze Sie vor Touristenfallen: Vom Taxitarif bis zur Restaurantrechnung können Sie mich alles fragen, was Ihnen verdächtig vorkommt; ich nenne Ihnen die fairen Ortspreise und verhindere Abzocke.
• Ich löse Ihre Anliegen im Zimmer: Für WLAN-Verbindung, Klimaanlage/technische Störungen, zusätzliche Reinigungswünsche oder einen frischen Frühstückskorb morgens an Ihre Tür kontaktiere ich direkt Ihr Hausmanagement-Team.
• Ich zeige Ihnen das wahre Gesicht der Stadt: Abseits der Touristenmassen plane ich sofort die authentischsten Genuss-Stopps, Sonnenuntergangsrouten, versteckten historischen Innenhöfe (Hans) und seriöse Bosporus-Touren nach Ihrem Geschmack.
• Ich bin in Ihrer Sprache an Ihrer Seite: Während Sie Istanbul Schritt für Schritt entdecken, können Sie mich rund um die Uhr in Ihrer Muttersprache fragen; ich bin Ihr 24/7 lokaler Freund in der Tasche.

Was darf ich jetzt gerade für Sie tun?`,
    actions: {
      'service:breakfast': {
        label: '🥐 Frühstückskorb an die Zimmertür bestellen',
        sublabel: 'Frisches türkisches Frühstück direkt an Ihre Zimmertür geliefert',
      },
      'service:support': {
        label: '🛎️ Dringendes Zimmer- & Technik-Ticket öffnen',
        sublabel: 'Direkte WhatsApp-Weiterleitung an Ihr Hausmanagement',
      },
      'service:laundry': {
        label: '👔 Express-Wäsche & Bügelservice anfordern',
        sublabel: 'Abholung an der Zimmertür & gebügelte Lieferung in 24 Stunden',
      },
      'id:transfer': {
        label: '🚐 VIP-Chauffeur zum Festpreis buchen',
        sublabel: 'Lizenzierte Mercedes-Benz Vito Flotte für Flughafen & Stadt',
      },
      'id:bosphorus': {
        label: '⛵ Geprüfte Bosporus-Kreuzfahrten entdecken',
        sublabel: 'Private Yachten & Sonnenuntergangstouren ohne Aufschläge',
      },
      'id:history': {
        label: '🏛️ Historische Routen & Fast-Track-Touren',
        sublabel: 'Lizenzierte Historiker-Guides für Hagia Sophia, Blaue Moschee & Zisternen',
      },
      'id:hammam': {
        label: '🫧 Traditionelle Türkische Hamam-Rituale',
        sublabel: 'Geprüfte osmanische Marmorbäder aus dem 16. Jahrhundert',
      },
      'id:culinary': {
        label: '🍢 Kulinarik- & Street-Food-Touren',
        sublabel: 'Beliebte lokale Klassiker in Kadıköy, Karaköy & Fatih',
      },
      'id:photography': {
        label: '📸 Dachterrassen-Fotoshooting & Kostüme',
        sublabel: 'Private Golden-Hour-Shootings über dem Bosporus & Galata',
      },
    },
  },
  fr: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'En ligne • Gardien & Concierge',
    suiteLabel: 'Chambre',
    resetBtn: 'Réinitialiser',
    historyCleared: 'Historique de conversation effacé.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Action Vérifiée Comus',
    typingText: 'Comus prépare votre réponse...',
    inputPlaceholder: 'Posez votre question à Comus (tarif taxi, service chambre, itinéraire)...',
    justNow: 'À l’instant',
    chips: [
      '🛡️ Avertis-moi des pièges à touristes courants à Istanbul',
      '🥐 Demander un service en chambre ou un panier petit-déjeuner',
      '📍 Recommande-moi les adresses authentiques les plus proches',
      '🗺️ Trace-moi un itinéraire sur mesure pour aujourd’hui',
    ],
    welcomeText: `Bienvenue à Istanbul ! Je suis Comus. 🕌

J’ai été conçu pour que vous ne vous perdiez pas dans cette ville comme un touriste ordinaire, mais pour vous protéger des arnaques et des tarifs abusifs afin de vivre Istanbul en toute sécurité comme un véritable invité de marque.

Voici ce que je peux faire pour vous dans votre chambre et dans les rues de la ville :

• Je vous protège des pièges à touristes : Du tarif de votre taxi à l’addition du restaurant, vous pouvez m’interroger sur tout ce qui vous semble suspect ; je vous indique les vrais prix locaux et vous évite toute surfacturation.
• Je résous vos besoins en chambre : Connexion Wi-Fi, climatisation/pannes techniques, demandes de ménage supplémentaire ou panier petit-déjeuner frais livré à votre porte le matin — je communique directement avec l’équipe de gestion de votre établissement.
• Je vous montre le vrai visage de la ville : Loin de la foule touristique, je planifie instantanément selon vos goûts les haltes gourmandes les plus authentiques, les itinéraires au coucher du soleil, les caravansérails (hans) secrets et les croisières vérifiées sur le Bosphore.
• Je suis à vos côtés dans votre langue : En explorant Istanbul pas à pas, posez-moi toutes vos questions dans votre langue maternelle ; je suis votre ami local de poche 24h/24 et 7j/7.

Que souhaitez-vous que je fasse pour vous dès maintenant ?`,
    actions: {
      'service:breakfast': {
        label: '🥐 Commander un Panier Petit-Déjeuner',
        sublabel: 'Assortiment turc artisanal livré directement devant votre porte',
      },
      'service:support': {
        label: '🛎️ Ouvrir un Ticket Chambre & Maintenance',
        sublabel: 'Transmission immédiate sur le WhatsApp de votre gestionnaire',
      },
      'service:laundry': {
        label: '👔 Blanchisserie Express & Repassage',
        sublabel: 'Collecte à votre porte et livraison pressée sous 24h',
      },
      'id:transfer': {
        label: '🚐 Réserver un Chauffeur VIP à Tarif Fixe',
        sublabel: 'Flotte Mercedes-Benz Vito agréée pour aéroport et ville',
      },
      'id:bosphorus': {
        label: '⛵ Explorer les Croisières Vérifiées sur le Bosphore',
        sublabel: 'Yachts privés et croisières au coucher du soleil sans commission',
      },
      'id:history': {
        label: '🏛️ Parcours Historiques & Visites Coupe-File',
        sublabel: 'Guides conférenciers pour Sainte-Sophie, Mosquée Bleue et citernes',
      },
      'id:hammam': {
        label: '🫧 Rituels de Hammam Turc Traditionnel',
        sublabel: 'Bains ottomans historiques du XVIe siècle et soins privés',
      },
      'id:culinary': {
        label: '🍢 Parcours Gastronomiques & Street Food',
        sublabel: 'Les meilleures tables locales à Kadıköy, Karaköy et Fatih',
      },
      'id:photography': {
        label: '📸 Séance Photo sur les Toits & Costumes',
        sublabel: 'Séances privées à l’heure dorée face au Bosphore et Galata',
      },
    },
  },
};

export function parseMessageAndActions(
  rawText: string,
  lang: Language = 'tr'
): {
  cleanText: string;
  parsedActions: ParsedComusAction[];
} {
  const parsedActions: ParsedComusAction[] = [];
  const seen = new Set<string>();
  const langDict = COMUS_I18N[lang] || COMUS_I18N.tr;

  const regex = new RegExp(ACTION_TAG_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    const [raw, actionType, targetKind, rawTargetValues] = match;
    const subValues = rawTargetValues
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const targetValue of subValues) {
      const lookupKey = `${targetKind}:${targetValue}`;
      if (!seen.has(lookupKey)) {
        seen.add(lookupKey);
        const meta = langDict.actions[lookupKey] ||
          ACTION_METADATA[lookupKey] || {
            label:
              targetKind === 'service'
                ? `🛎️ ${targetValue.charAt(0).toUpperCase() + targetValue.slice(1)} Service`
                : `✨ ${targetValue.charAt(0).toUpperCase() + targetValue.slice(1)}`,
            sublabel: 'Purely Istanbul Verified Concierge Action',
          };
        parsedActions.push({
          raw: `${raw}-${targetValue}`,
          actionType,
          targetKind: targetKind as 'id' | 'service',
          targetValue,
          label: meta.label,
          sublabel: meta.sublabel,
        });
      }
    }
  }

  // Strip complete action tags and any partially-streamed trailing "[action:..." fragment,
  // and sanitize any legacy "ComusAI" string to "Comus".
  const cleanText = rawText
    .replace(/ComusAI/gi, 'Comus')
    .replace(ACTION_TAG_REGEX, '')
    .replace(/\[action:[^\]]*$/g, '')
    .trim();

  return { cleanText, parsedActions };
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} className="h-2" />;
    }

    const isBullet =
      trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const contentStr = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line;

    // Parse inline **bold** and *italic*
    const parts = contentStr.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const renderedParts = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[#221F1C]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-[#5C4938]">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-0.5 py-0.5">
          <span className="text-[#9E7B42] font-bold leading-snug select-none">•</span>
          <span className="flex-1 leading-relaxed">{renderedParts}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="leading-relaxed">
        {renderedParts}
      </p>
    );
  });
}

/**
 * Warm Gilded Champagne & Royal Gold Comus Emblem matching the app theme
 */
export function ComusGlowingAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconDims = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`relative ${dims} shrink-0 flex items-center justify-center`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#C59B38] to-[#9E7B42] opacity-55 blur-[3px] animate-pulse" />
      <div
        className={`relative ${dims} rounded-full bg-gradient-to-br from-[#FFFDF7] via-[#F5E6C8] to-[#E2C285] border border-[#C59B38] flex items-center justify-center shadow-[0_4px_12px_rgba(158,123,66,0.32),inset_0_1px_2px_rgba(255,255,255,0.95)]`}
      >
        <Sparkles className={`${iconDims} text-[#8B6220]`} />
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#FAF8F4]"
        aria-hidden="true"
      />
    </div>
  );
}

export function AiChatDrawer({
  hotel,
  roomNumber = '304',
  lang = 'tr',
  isOpen,
  onClose,
  onExploreCategory,
}: AiChatDrawerProps) {
  const resolvedHotelName = hotel?.name || 'Purely Istanbul Partner Suite';
  const resolvedHotelId = hotel?.id || 'hotel-1';
  const ui = COMUS_I18N[lang] || COMUS_I18N.tr;

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForFirstToken, setIsWaitingForFirstToken] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Interactive Sub-Modals triggered by Action Cards
  const [activeActionModal, setActiveActionModal] = useState<
    null | 'breakfast' | 'support' | 'transfer' | 'laundry'
  >(null);

  // Sub-modal states
  const [breakfastBoxType, setBreakfastBoxType] = useState(
    'Traditional Anatolian Serpme Box (For 2)'
  );
  const [breakfastTime, setBreakfastTime] = useState('08:30 AM');
  const [breakfastNotes, setBreakfastNotes] = useState('');

  const [supportIssueType, setSupportIssueType] = useState('Wi-Fi & Internet Connectivity');
  const [supportNotes, setSupportNotes] = useState('Need immediate assistance in room.');

  const [transferAirport, setTransferAirport] = useState(
    'Istanbul Airport (IST) — €65 Fixed Rate'
  );
  const [transferFlightNo, setTransferFlightNo] = useState('');
  const [transferPickupTime, setTransferPickupTime] = useState('Today · 16:00');

  const [laundryPackage, setLaundryPackage] = useState(
    'Express Wash, Fold & Steam Press (24h)'
  );
  const [laundryPickupTime, setLaundryPickupTime] = useState('Within 30 Minutes');

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const freshWelcome: ChatMessage = {
      id: 'comus-welcome-v3',
      sender: 'assistant',
      text: ui.welcomeText,
      time: ui.justNow,
    };
    const saved = XeniosStore.getAiChatMessages();
    if (saved && saved.length > 0) {
      if (saved.length === 1 && saved[0]?.sender === 'assistant') {
        XeniosStore.saveAiChatMessages([freshWelcome]);
        return [freshWelcome];
      }
      // Ensure first message is always the updated Comus v3 onboarding message
      const normalized = saved.map((m, i) =>
        i === 0 && m.sender === 'assistant'
          ? freshWelcome
          : { ...m, text: m.text.replace(/ComusAI/gi, 'Comus') }
      );
      XeniosStore.saveAiChatMessages(normalized);
      return normalized;
    }
    return [freshWelcome];
  });

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length >= 1 && prev[0]?.sender === 'assistant') {
        const updatedFirst: ChatMessage = {
          ...prev[0],
          id: 'comus-welcome-v3',
          text: ui.welcomeText,
          time: ui.justNow,
        };
        const next = [updatedFirst, ...prev.slice(1)];
        XeniosStore.saveAiChatMessages(next);
        return next;
      }
      return prev;
    });
  }, [lang, ui.welcomeText, ui.justNow]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForFirstToken, isStreaming]);

  // Offline / Wi-Fi Disconnection Detector
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      toast.error(OFFLINE_FALLBACK_MESSAGE_TR);
    };
    const handleOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
      return () => {
        window.dispatchEvent(
          new CustomEvent('xenios_modal_state', { detail: { isOpen: false } })
        );
      };
    }
  }, [isOpen]);

  const handleClearHistory = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsWaitingForFirstToken(false);
    const fresh: ChatMessage = {
      id: 'comus-welcome-v3',
      sender: 'assistant',
      text: ui.welcomeText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([fresh]);
    XeniosStore.saveAiChatMessages([fresh]);
    toast.success(ui.historyCleared);
  }, [ui.welcomeText, ui.historyCleared]);

  const handleSend = async (customPrompt?: string) => {
    const queryText = (customPrompt ?? input).trim();
    if (!queryText || isStreaming) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      const offlineMsgBubble: ChatMessage = {
        id: `offline-${Date.now()}`,
        sender: 'assistant',
        text: OFFLINE_FALLBACK_MESSAGE_TR,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, offlineMsgBubble]);
      toast.error(OFFLINE_FALLBACK_MESSAGE_TR);
      return;
    }

    setInput('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      time: nowTime,
    };

    const assistantMsgId = `ai-${Date.now() + 1}`;
    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    XeniosStore.saveAiChatMessages(updatedWithUser);

    setIsStreaming(true);
    setIsWaitingForFirstToken(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyPayload = updatedWithUser.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      const res = await fetch('/api/comus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          messages: historyPayload,
          hotelName: resolvedHotelName,
          roomNumber,
          unitId: `${resolvedHotelName} · ${ui.suiteLabel} ${roomNumber}`,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulatedText = '';
      let receivedFirstToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataPayload = trimmed.slice(5).trim();
            if (dataPayload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataPayload);
              if (typeof parsed.text === 'string' && parsed.text.length > 0) {
                if (!receivedFirstToken) {
                  receivedFirstToken = true;
                  setIsWaitingForFirstToken(false);
                }
                accumulatedText += parsed.text.replace(/ComusAI/gi, 'Comus');
                const currentText = accumulatedText;
                setMessages((prev) => {
                  const hasAssistant = prev.some((m) => m.id === assistantMsgId);
                  if (!hasAssistant) {
                    return [
                      ...prev,
                      {
                        id: assistantMsgId,
                        sender: 'assistant',
                        text: currentText,
                        time: nowTime,
                      },
                    ];
                  }
                  return prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, text: currentText } : m
                  );
                });
              }
            } catch {
              // ignore malformed SSE chunk
            }
          }
        }
      }

      setIsWaitingForFirstToken(false);
      setIsStreaming(false);

      if (accumulatedText) {
        const finalHistory: ChatMessage[] = [
          ...updatedWithUser,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: accumulatedText,
            time: nowTime,
          },
        ];
        setMessages(finalHistory);
        XeniosStore.saveAiChatMessages(finalHistory);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      setIsWaitingForFirstToken(false);
      setIsStreaming(false);

      const fallbackBubble: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: OFFLINE_FALLBACK_MESSAGE_TR,
        time: nowTime,
      };
      setMessages((prev) => {
        const hasAssistant = prev.some((m) => m.id === assistantMsgId);
        return hasAssistant ? prev : [...prev, fallbackBubble];
      });

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
      }
      toast.error(OFFLINE_FALLBACK_MESSAGE_TR);
    }
  };

  const handleActionCardClick = (act: ParsedComusAction) => {
    if (act.targetKind === 'service') {
      if (act.targetValue === 'breakfast') {
        setActiveActionModal('breakfast');
        return;
      }
      if (act.targetValue === 'support') {
        setActiveActionModal('support');
        return;
      }
      if (act.targetValue === 'laundry') {
        setActiveActionModal('laundry');
        return;
      }
    }

    if (act.targetKind === 'id') {
      if (act.targetValue === 'transfer') {
        setActiveActionModal('transfer');
        return;
      }

      const categoryKeyMap: Record<string, string> = {
        bosphorus: 'cat-1',
        history: 'cat-2',
        culinary: 'cat-3',
        hammam: 'cat-4',
        photography: 'cat-6',
      };
      const targetCatKey = categoryKeyMap[act.targetValue] || 'cat-1';

      if (onExploreCategory) {
        onExploreCategory(targetCatKey);
        onClose();
        return;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('xenios_explore_category', {
            detail: { categoryKey: targetCatKey, id: act.targetValue },
          })
        );
        onClose();
      }
    }
  };

  const submitInStayRequest = async (
    serviceKey: string,
    serviceTitle: string,
    notes: string,
    priority: 'standart' | 'acil' = 'standart'
  ) => {
    try {
      await FirestoreService.addRequest({
        hotelId: resolvedHotelId,
        hotelName: resolvedHotelName,
        roomNumber,
        serviceKey,
        serviceTitle,
        notes,
        status: 'pending',
        department: priority === 'acil' ? 'Engineering & IT' : 'In-Stay Concierge',
        stage: 'pending',
        priority,
      });
    } catch {
      // Fallback local persistence already handled inside FirestoreService / XeniosStore
    }

    const confirmText =
      serviceKey === 'breakfast'
        ? `✅ **Doorstep Breakfast Basket Confirmed:** Your *${breakfastBoxType}* is scheduled for **${breakfastTime}** to ${ui.suiteLabel} **${roomNumber}**.${breakfastNotes ? ` Note: "${breakfastNotes}"` : ''}`
        : serviceKey === 'support'
          ? `🛎️ **Urgent Room Ticket Dispatched:** Your property manager's WhatsApp desk has been alerted for **${supportIssueType}** in ${ui.suiteLabel} **${roomNumber}** (Priority: **URGENT**).`
          : serviceKey === 'laundry'
            ? `👔 **Express Garment Pickup Scheduled:** Valet pickup (**${laundryPickupTime}**) for *${laundryPackage}* from ${ui.suiteLabel} **${roomNumber}** is confirmed.`
            : `🚐 **VIP Chauffeur Transfer Reserved:** Your licensed Mercedes-Benz Vito for **${transferAirport}** (${transferPickupTime}${transferFlightNo ? ` · Flight ${transferFlightNo}` : ''}) is confirmed.`;

    const confirmMsg: ChatMessage = {
      id: `act-confirm-${Date.now()}`,
      sender: 'assistant',
      text: confirmText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => {
      const next = [...prev, confirmMsg];
      XeniosStore.saveAiChatMessages(next);
      return next;
    });

    setActiveActionModal(null);
    toast.success(`${serviceTitle} (${ui.suiteLabel} ${roomNumber})`);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ui.headerTitle}
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#221F1C]/45 backdrop-blur-sm overflow-hidden overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg h-[100dvh] sm:h-[85vh] max-h-[100dvh] sm:max-h-[760px] bg-[#FAF8F4] rounded-none sm:rounded-3xl shadow-[0_24px_70px_rgba(34,31,28,0.35)] border-0 sm:border sm:border-[#D8CBB8] flex flex-col overflow-hidden overscroll-contain relative text-[#221F1C]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER: Minimalist title "Comus • Local Guardian & Concierge" with online green indicator */}
        <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5 bg-gradient-to-r from-[#FAF7F0] via-[#F5EFE4] to-[#EDE3D2] text-[#221F1C] flex items-center justify-between gap-3 shrink-0 border-b border-[#D8CBB8]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ComusGlowingAvatar size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25 shrink-0"
                  aria-label="Online"
                />
                <h2 className="font-luxury-serif text-[15.5px] sm:text-[16.5px] font-bold tracking-tight text-[#221F1C] truncate">
                  Comus • Local Guardian &amp; Concierge
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-600/12 border border-emerald-600/30 text-[10.5px] font-semibold text-emerald-800 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {ui.statusBadge}
                </span>
                <span className="text-[11px] text-[#5C4938] truncate hidden xs:inline">
                  {ui.suiteLabel} {roomNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleClearHistory}
              title={ui.resetBtn}
              aria-label={ui.resetBtn}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F3ECE0] text-[#5C4938] hover:text-[#221F1C] text-[11px] font-semibold border border-[#C4B8A4] transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8B6220]" />
              <span className="hidden sm:inline">{ui.resetBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Comus"
              className="w-8 h-8 rounded-xl bg-[#FFFDF9] hover:bg-[#F3ECE0] text-[#221F1C] border border-[#C4B8A4] flex items-center justify-center transition cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* OFFLINE DETECTOR BANNER */}
        {isOffline && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2 shrink-0">
            <WifiOff className="w-4 h-4 text-[#9E7B42] shrink-0" />
            <span>{OFFLINE_FALLBACK_MESSAGE_TR}</span>
          </div>
        )}

        {/* 2. MESSAGE BUBBLES, QUICK ACTION CHIPS BELOW FIRST MESSAGE & INTERACTIVE ACTION CARDS */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FAF8F4] overscroll-contain">
          {messages.map((msg, msgIndex) => {
            const isUser = msg.sender === 'user';
            const { cleanText, parsedActions } = isUser
              ? { cleanText: msg.text, parsedActions: [] }
              : parseMessageAndActions(msg.text, lang);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2.5`}
              >
                <div
                  className={`flex items-start gap-2.5 max-w-[90%] ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {!isUser && <ComusGlowingAvatar size="sm" />}

                  <div
                    className={`rounded-2xl px-4 py-3 text-[13px] shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] text-white rounded-tr-xs'
                        : 'bg-[#FFFDF9] text-[#221F1C] border border-[#DFD5C5] rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-white">
                        {cleanText}
                      </p>
                    ) : (
                      <div className="space-y-1 text-[#221F1C]">
                        {renderFormattedText(cleanText)}
                      </div>
                    )}

                    <div
                      className={`mt-1.5 text-[10px] flex items-center justify-end gap-1 ${
                        isUser ? 'text-[#F5EFE4]' : 'text-[#78716C]'
                      }`}
                    >
                      <span>{msg.time}</span>
                    </div>
                  </div>
                </div>

                {/* 4 QUICK ACTION CHIPS DIRECTLY BELOW THE FIRST MESSAGE */}
                {!isUser && msgIndex === 0 && (
                  <div className="pl-10 w-full max-w-[92%] grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    {ui.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={isStreaming}
                        onClick={() => handleSend(chip)}
                        className="px-3.5 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-gradient-to-r hover:from-[#9E7B42] hover:to-[#7D5E2A] hover:text-white text-[#221F1C] border border-[#C59B38]/65 hover:border-[#9E7B42] text-[12px] font-semibold text-left leading-snug transition-all duration-150 cursor-pointer shadow-2xs flex items-center justify-between gap-2 disabled:opacity-50"
                      >
                        <span className="flex-1">{chip}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Dynamically Rendered Interactive Action Banner Cards */}
                {!isUser && parsedActions.length > 0 && (
                  <div className="pl-10 w-full max-w-[88%] space-y-2">
                    {parsedActions.map((act) => (
                      <button
                        key={act.raw}
                        type="button"
                        onClick={() => handleActionCardClick(act)}
                        className="w-full group rounded-2xl bg-gradient-to-r from-[#FFFDF7] via-[#F7EFE0] to-[#EFE2C8] hover:from-[#FAF2E1] hover:to-[#E8D5B2] text-[#221F1C] p-3.5 border border-[#C59B38]/65 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B6220]">
                              {ui.verifiedActionBadge}
                            </span>
                            <ShieldCheck className="w-3.5 h-3.5 text-[#8B6220]" />
                          </div>
                          <p className="text-[13px] font-bold text-[#221F1C] mt-0.5 truncate">
                            {act.label}
                          </p>
                          <p className="text-[11px] text-[#5C4938] truncate mt-0.5">
                            {act.sublabel}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform shadow-2xs">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 3. WARM TYPING INDICATOR (While waiting for first token) */}
          {isWaitingForFirstToken && (
            <div className="flex items-start gap-2.5">
              <ComusGlowingAvatar size="sm" />
              <div className="bg-[#FFFDF9] border border-[#DFD5C5] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1" aria-label="Comus is typing">
                  <span
                    className="w-2 h-2 rounded-full bg-[#9E7B42] animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#9E7B42] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#9E7B42] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-xs font-medium text-[#5C4938]">
                  {ui.typingText}
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* INTERACTIVE IN-STAY / TRANSFER ACTION SUB-MODAL OVERLAY */}
        {activeActionModal && (
          <div className="absolute inset-0 z-30 bg-[#221F1C]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#FAF8F4] rounded-2xl border border-[#D8CBB8] shadow-2xl p-5 space-y-4 text-[#221F1C]">
              <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B6220]">
                    Purely Istanbul · {ui.suiteLabel} {roomNumber}
                  </span>
                  <h3 className="font-luxury-serif text-base font-bold text-[#221F1C] mt-0.5">
                    {activeActionModal === 'breakfast' && ui.actions['service:breakfast'].label}
                    {activeActionModal === 'support' && ui.actions['service:support'].label}
                    {activeActionModal === 'transfer' && ui.actions['id:transfer'].label}
                    {activeActionModal === 'laundry' && ui.actions['service:laundry'].label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="w-7 h-7 rounded-lg bg-[#F3ECE0] hover:bg-[#E8DEC8] text-[#221F1C] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeActionModal === 'breakfast' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Select Artisanal Breakfast Basket
                    </label>
                    <select
                      value={breakfastBoxType}
                      onChange={(e) => setBreakfastBoxType(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Traditional Anatolian Serpme Box (For 2) — €28</option>
                      <option>Galata Artisan Simit, Ezine Cheese &amp; Kaymak Box — €16</option>
                      <option>Healthy Mediterranean Avocado &amp; Poached Eggs Box — €18</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Preferred Doorstep Delivery Time
                    </label>
                    <select
                      value={breakfastTime}
                      onChange={(e) => setBreakfastTime(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>08:00 AM</option>
                      <option>08:30 AM</option>
                      <option>09:00 AM</option>
                      <option>09:30 AM</option>
                      <option>10:00 AM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Dietary Preferences or Tea/Coffee Note
                    </label>
                    <input
                      type="text"
                      value={breakfastNotes}
                      onChange={(e) => setBreakfastNotes(e.target.value)}
                      placeholder="e.g., Fresh brewed Turkish tea, no nuts..."
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      submitInStayRequest(
                        'breakfast',
                        'Doorstep Breakfast Basket',
                        `${breakfastBoxType} · Delivery: ${breakfastTime}${breakfastNotes ? ` · ${breakfastNotes}` : ''}`,
                        'standart'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Doorstep Breakfast Delivery</span>
                  </button>
                </div>
              )}

              {activeActionModal === 'support' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="font-semibold">
                      Unit: {resolvedHotelName} · {ui.suiteLabel} {roomNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
                      Urgent Priority
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Issue Category
                    </label>
                    <select
                      value={supportIssueType}
                      onChange={(e) => setSupportIssueType(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Wi-Fi &amp; Internet Connectivity</option>
                      <option>Air Conditioning / Heating Climate Control</option>
                      <option>Hot Water / Bathroom Plumbing</option>
                      <option>Fresh Towels / Housekeeping Refill</option>
                      <option>Smart Lock / Keycard Access</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Details for Property Manager
                    </label>
                    <textarea
                      rows={2}
                      value={supportNotes}
                      onChange={(e) => setSupportNotes(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      submitInStayRequest(
                        'support',
                        `Urgent Support: ${supportIssueType}`,
                        `${supportIssueType} · ${supportNotes}`,
                        'acil'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispatch Urgent Maintenance Ticket</span>
                  </button>
                </div>
              )}

              {activeActionModal === 'transfer' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#DFD5C5] text-[#5C4938] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#8B6220] shrink-0" />
                    <span>
                      TÜRSAB Licensed VIP Mercedes-Benz Vito Fleet · 100% Fixed Local Rate (Zero Toll Tricks)
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Transfer Route &amp; Fixed Rate
                    </label>
                    <select
                      value={transferAirport}
                      onChange={(e) => setTransferAirport(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Istanbul Airport (IST) — €65 Fixed Rate (Up to 6 Guests)</option>
                      <option>Sabiha Gökçen Airport (SAW) — €70 Fixed Rate (Up to 6 Guests)</option>
                      <option>Private Half-Day City Chauffeur (4 Hours) — €140 Fixed Rate</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-[#5C4938] mb-1">
                        Pickup Date &amp; Time
                      </label>
                      <input
                        type="text"
                        value={transferPickupTime}
                        onChange={(e) => setTransferPickupTime(e.target.value)}
                        className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#5C4938] mb-1">
                        Flight Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={transferFlightNo}
                        onChange={(e) => setTransferFlightNo(e.target.value)}
                        placeholder="e.g. TK1984 / BA676"
                        className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      submitInStayRequest(
                        'transfer',
                        'VIP Airport Chauffeur Booking',
                        `${transferAirport} · Pickup: ${transferPickupTime}${transferFlightNo ? ` · Flight: ${transferFlightNo}` : ''}`,
                        'standart'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reserve Licensed VIP Chauffeur</span>
                  </button>
                </div>
              )}

              {activeActionModal === 'laundry' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Garment Care Package
                    </label>
                    <select
                      value={laundryPackage}
                      onChange={(e) => setLaundryPackage(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Express Wash, Fold &amp; Steam Press (24h) — €25 / Bag</option>
                      <option>Same-Day Evening Suit &amp; Dress Dry Cleaning — €35</option>
                      <option>Express 2-Hour Steam Pressing Only — €15</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Suite Doorstep Pickup Window
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#8B6220]" />
                      <input
                        type="text"
                        value={laundryPickupTime}
                        onChange={(e) => setLaundryPickupTime(e.target.value)}
                        className="flex-1 rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      submitInStayRequest(
                        'laundry',
                        'In-Stay Express Laundry & Garment Care',
                        `${laundryPackage} · Pickup: ${laundryPickupTime}`,
                        'standart'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Schedule Doorstep Valet Pickup</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. MESSAGE INPUT BAR */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 pb-[max(0.75rem,calc(0.75rem+env(safe-area-inset-bottom)))] bg-[#FAF8F4] border-t border-[#DFD5C5] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.inputPlaceholder}
            className="flex-1 text-[13px] px-4 py-3 rounded-2xl border border-[#C4B8A4] bg-[#FFFDF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9E7B42]/40 focus:border-[#9E7B42] text-[#221F1C] placeholder:text-[#78716C] transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            aria-label="Send message to Comus"
            className="p-3 rounded-2xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white transition shadow-sm disabled:opacity-40 cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
