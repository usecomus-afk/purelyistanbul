"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Hotel, InRoomServiceItem, Language } from '@/lib/types';
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
  targetValue: string; // 'bosphorus' | 'transfer' | 'breakfast' | 'cleaning' | 'maintenance' | 'support' | 'laundry' | etc.
  unitName?: string;
  label: string;
  sublabel: string;
}

export function inferClientPropertyType(
  rawType?: string,
  propertyName?: string
): 'hotel' | 'apartment' {
  const combined = `${rawType || ''} ${propertyName || ''}`.toLowerCase();
  if (rawType === 'apartment' || rawType === 'short_term_rental') return 'apartment';
  if (rawType === 'hotel') return 'hotel';
  if (
    /apart|rezidans|residence|daire|pmc|kısa dönem|short-term|short term|loft|villa|home|flat/i.test(
      combined
    )
  ) {
    return 'apartment';
  }
  if (/suite|süit/i.test(combined) && !/hotel|otel|konak|palace|saray/i.test(combined)) {
    return 'apartment';
  }
  return 'hotel';
}

export function formatClientUnitName(
  rawUnitId: string,
  propertyType: 'hotel' | 'apartment',
  roomTypeLabel?: string
): string {
  const trimmed = String(rawUnitId || '101').trim();
  const shortUnit = trimmed.includes('·')
    ? trimmed.split('·').pop()!.trim()
    : trimmed;

  if (/^(suite|süit|daire|oda|room|birim|unit|apt|penthouse|loft)\b/i.test(shortUnit)) {
    if (propertyType === 'apartment' && /^oda\s+/i.test(shortUnit)) {
      return shortUnit.replace(/^oda\s+/i, 'Suite ');
    }
    return shortUnit;
  }

  if (propertyType === 'apartment') {
    if (roomTypeLabel && /daire/i.test(roomTypeLabel)) {
      return `Daire ${shortUnit}`;
    }
    return `Suite ${shortUnit}`;
  }

  if (roomTypeLabel && /suite|süit/i.test(roomTypeLabel)) {
    return `Suite ${shortUnit}`;
  }
  return `Oda ${shortUnit}`;
}

/**
 * Generates the first opening message dynamically according to the property type ("hotel" vs "apartment"),
 * propertyName, and guest's auto-detected browser language.
 */
export function buildDynamicWelcomeMessage(
  lang: Language = 'tr',
  propertyName: string = 'Old City Heritage Hotel Istanbul',
  propertyType: 'hotel' | 'apartment' = 'hotel'
): string {
  const isApt = propertyType === 'apartment';

  switch (lang) {
    case 'tr':
      if (isApt) {
        return `İstanbul’a ve ${propertyName}’deki süitinize hoş geldiniz! Ben Comus. 🕌
Bu özel dairede kendinizi evinizde hissetmeniz ve İstanbul'u bir turist gibi değil, gerçek bir misafir gibi güvenle yaşamanız için buradayım. Daire içi ihtiyaçlarınızdan (kapıya kahvaltı, temizlik, teknik destek) şehirdeki taksi ve rota rehberliğine kadar 7/24 hizmetinizdeyim. Bugün nasıl yardımcı olabilirim?`;
      }
      return `İstanbul’a ve ${propertyName}’e hoş geldiniz! Ben Comus. 🕌
Kaldığınız süre boyunca hem otel içi konforunuz hem de şehrin sokaklarında güvenliğiniz için buradayım. Resepsiyon ve oda içi hizmetlerden şehirdeki gizli lezzet duraklarına kadar her an yanınızdayım. Bugün sizin için ne yapabilirim?`;

    case 'en':
      if (isApt) {
        return `Welcome to Istanbul and to your suite at ${propertyName}! I am Comus. 🕌
I am here so you feel right at home in this private apartment and experience Istanbul safely—not like a tourist, but like a true guest. From your in-suite needs (doorstep breakfast, housekeeping, technical support) to city taxi fares and route guidance, I am at your service 24/7. How may I help you today?`;
      }
      return `Welcome to Istanbul and ${propertyName}! I am Comus. 🕌
Throughout your stay, I am here for both your in-hotel comfort and your safety on the streets of the city. From reception and in-room services to hidden culinary gems across the city, I am by your side at every moment. What can I do for you today?`;

    case 'ar':
      if (isApt) {
        return `أهلاً بك في إسطنبول وفي جناحك الخاص في ${propertyName}! أنا Comus. 🕌
أنا هنا لتشعر وكأنك في منزلك داخل هذه الشقة الخاصة ولتعيش إسطنبول بأمان كضيف حقيقي وليس كسائح. من احتياجات شقتك (إفطار عند الباب، تنظيف، دعم فني) إلى أسعار التاكسي ومسارات المدينة، أنا في خدمتك 24/7. كيف يمكنني مساعدتك اليوم؟`;
      }
      return `أهلاً بك في إسطنبول وفي ${propertyName}! أنا Comus. 🕌
طوال فترة إقامتك، أنا هنا من أجل راحتك داخل الفندق وأمانك في شوارع المدينة. من الاستقبال وخدمات الغرف إلى الوجهات المحلية المخفية، أنا بجانبك في كل لحظة. ماذا يمكنني أن أفعل من أجلك اليوم؟`;

    case 'ru':
      if (isApt) {
        return `Добро пожаловать в Стамбул и в ваши апартаменты в ${propertyName}! Я Comus. 🕌
Я здесь, чтобы в этих частных апартаментах вы чувствовали себя как дома и прожили Стамбул безопасно — не как турист, а как дорогой гость. От ваших потребностей в апартаментах (завтрак к двери, уборка, техподдержка) до расчета такси и маршрутов по городу — я к вашим услугам 24/7. Чем я могу помочь вам сегодня?`;
      }
      return `Добро пожаловать в Стамбул и в ${propertyName}! Я Comus. 🕌
На протяжении всего вашего пребывания я забочусь о вашем комфорте в отеле и вашей безопасности на улицах города. От ресепшена и обслуживания в номере до скрытых гастрономических мест — я рядом в любой момент. Что я могу сделать для вас сегодня?`;

    case 'de':
      if (isApt) {
        return `Willkommen in Istanbul und in Ihrer Suite im ${propertyName}! Ich bin Comus. 🕌
Ich bin hier, damit Sie sich in diesem privaten Apartment wie zu Hause fühlen und Istanbul sicher wie ein echter Gast erleben. Von Ihren Wünschen im Apartment (Frühstück an die Tür, Reinigung, technischer Support) bis zu Taxitarifen und Routenführung in der Stadt bin ich 24/7 für Sie da. Wie kann ich Ihnen heute helfen?`;
      }
      return `Willkommen in Istanbul und im ${propertyName}! Ich bin Comus. 🕌
Während Ihres gesamten Aufenthalts bin ich sowohl für Ihren Komfort im Hotel als auch für Ihre Sicherheit auf den Straßen der Stadt da. Von der Rezeption und dem Zimmerservice bis zu versteckten kulinarischen Orten stehe ich Ihnen jederzeit zur Seite. Was kann ich heute für Sie tun?`;

    case 'fr':
      if (isApt) {
        return `Bienvenue à Istanbul et dans votre suite au ${propertyName} ! Je suis Comus. 🕌
Je suis là pour que vous vous sentiez comme chez vous dans cet appartement privé et que vous viviez Istanbul en toute sécurité, non pas comme un touriste, mais comme un véritable invité. De vos besoins en suite (petit-déjeuner à la porte, ménage, assistance technique) aux tarifs de taxi et itinéraires en ville, je suis à votre service 24h/24 et 7j/7. Comment puis-je vous aider aujourd’hui ?`;
      }
      return `Bienvenue à Istanbul et au ${propertyName} ! Je suis Comus. 🕌
Tout au long de votre séjour, je veille aussi bien à votre confort au sein de l’hôtel qu’à votre sécurité dans les rues de la ville. De la réception et des services en chambre jusqu’aux adresses secrètes de la ville, je suis à vos côtés à chaque instant. Que puis-je faire pour vous aujourd’hui ?`;

    default:
      return `Welcome to Istanbul and ${propertyName}! I am Comus. 🕌`;
  }
}

export const TURKISH_ONBOARDING_MESSAGE = buildDynamicWelcomeMessage(
  'tr',
  'Old City Heritage Hotel Istanbul',
  'hotel'
);

export const TURKISH_QUICK_ACTION_CHIPS = [
  '🛡️ Beni İstanbul’daki yaygın tuzaklara karşı uyar',
  '🥐 Konaklamam için hizmet/kahvaltı talep et',
  '📍 Bana buraya en yakın otantik yerleri öner',
  '🗺️ Bugün için bana özel bir rota çiz',
] as const;

export const OFFLINE_FALLBACK_MESSAGE_TR =
  'Comus ile bağlantı kurulamadı. Lütfen Wi-Fi bağlantınızı kontrol edin.';

// Matches tags with or without unit parameter:
// e.g. [action:in_stay, service:breakfast, unit:Suite 302]
// or   [action:in_stay, service:breakfast]
// or   [action:explore_category, id:bosphorus]
const ACTION_TAG_REGEX =
  /\[action:(\w+),\s*(id|service):([\w/-]+)(?:,\s*unit:([^\]]+))?\]/g;

const ACTION_METADATA: Record<
  string,
  { label: string; sublabel: string; categoryKey?: string }
> = {
  'service:breakfast': {
    label: '🥐 Order Doorstep Breakfast Basket',
    sublabel: 'Fresh artisanal Turkish spread delivered to your door',
  },
  'service:cleaning': {
    label: '🧹 Request Housekeeping & Fresh Towels',
    sublabel: 'Dispatched immediately to your property housekeeping team',
  },
  'service:maintenance': {
    label: '🛠️ Open Technical & Maintenance Support Ticket',
    sublabel: 'Direct priority dispatch for Wi-Fi, AC, or plumbing',
  },
  'service:support': {
    label: '🛎️ Open Urgent In-Stay & Technical Ticket',
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
    suiteLabelHotel: string;
    suiteLabelApartment: string;
    resetBtn: string;
    historyCleared: string;
    offlineMsg: string;
    connInterrupted: string;
    verifiedActionBadge: string;
    typingText: string;
    inputPlaceholder: string;
    justNow: string;
    chipsHotel: string[];
    chipsApartment: string[];
    actions: Record<string, { label: string; sublabel: string }>;
  }
> = {
  tr: {
    headerTitle: 'Comus • Local Guardian & Concierge',
    statusBadge: 'Çevrimiçi • Yerel Dostunuz',
    suiteLabelHotel: 'Oda',
    suiteLabelApartment: 'Süit',
    resetBtn: 'Sıfırla',
    historyCleared: 'Sohbet geçmişi temizlendi.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Doğrulanmış Comus İşlemi',
    typingText: 'Comus yanıtınızı hazırlıyor...',
    inputPlaceholder: 'Comus’a dilediğiniz dilde sorun (taksi, adisyon, konaklama talebi, rota)...',
    justNow: 'Az önce',
    chipsHotel: [
      '🛡️ Beni İstanbul’daki yaygın tuzaklara karşı uyar',
      '🥐 Odam için hizmet/kahvaltı talep et',
      '📍 Bana buraya en yakın otantik yerleri öner',
      '🗺️ Bugün için bana özel bir rota çiz',
    ],
    chipsApartment: [
      '🛡️ Beni İstanbul’daki yaygın tuzaklara karşı uyar',
      '🥐 Dairem için hizmet/kahvaltı talep et',
      '📍 Bana buraya en yakın otantik yerleri öner',
      '🗺️ Bugün için bana özel bir rota çiz',
    ],
    actions: {
      'service:breakfast': {
        label: '🥐 Kapıya Taze Kahvaltı Sepeti İste',
        sublabel: 'Kapınıza taze geleneksel Türk kahvaltısı teslimatı',
      },
      'service:cleaning': {
        label: '🧹 Temizlik & Taze Havlu Talebi Oluştur',
        sublabel: 'Konaklama yönetim ekibinize anında iletilir',
      },
      'service:maintenance': {
        label: '🛠️ Teknik Destek Talebi Aç (Klima / Wi-Fi / Tesisat)',
        sublabel: 'Yönetim ekibinizin WhatsApp ve operasyon ekranına anında düşer',
      },
      'service:support': {
        label: '🛎️ Konaklama İçi Teknik / Temizlik Talebi Aç',
        sublabel: 'Yönetim ekibinizin WhatsApp hattına anında iletilir',
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
    suiteLabelHotel: 'Room',
    suiteLabelApartment: 'Suite',
    resetBtn: 'Reset',
    historyCleared: 'Conversation history cleared.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Verified Comus Action',
    typingText: 'Comus is preparing your local guidance...',
    inputPlaceholder: 'Ask Comus in any language (taxi fare, bill check, stay request, route)...',
    justNow: 'Just now',
    chipsHotel: [
      '🛡️ Warn me about common tourist traps in Istanbul',
      '🥐 Request room service or a fresh breakfast basket',
      '📍 Recommend the nearest authentic local spots',
      '🗺️ Plan a custom crowd-free itinerary for today',
    ],
    chipsApartment: [
      '🛡️ Warn me about common tourist traps in Istanbul',
      '🥐 Request in-suite service or a fresh breakfast basket',
      '📍 Recommend the nearest authentic local spots',
      '🗺️ Plan a custom crowd-free itinerary for today',
    ],
    actions: {
      'service:breakfast': ACTION_METADATA['service:breakfast'],
      'service:cleaning': ACTION_METADATA['service:cleaning'],
      'service:maintenance': ACTION_METADATA['service:maintenance'],
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
    suiteLabelHotel: 'غرفة',
    suiteLabelApartment: 'جناح',
    resetBtn: 'إعادة تعيين',
    historyCleared: 'تم مسح سجل المحادثة.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'إجراء موثق من Comus',
    typingText: 'يقوم Comus بإعداد إرشاداتك المحلية...',
    inputPlaceholder: 'اسأل Comus بأي لغة (أسعار التاكسي، طلبات الإقامة، الأماكن الأصيلة)...',
    justNow: 'الآن',
    chipsHotel: [
      '🛡️ حذرني من الفخاخ السياحية الشائعة في إسطنبول',
      '🥐 اطلب خدمة الغرف أو سلة إفطار طازجة',
      '📍 اقترح أقرب الأماكن المحلية الأصيلة من هنا',
      '🗺️ خطط لي مساراً خاصاً لهذا اليوم',
    ],
    chipsApartment: [
      '🛡️ حذرني من الفخاخ السياحية الشائعة في إسطنبول',
      '🥐 اطلب خدمة الجناح أو سلة إفطار طازجة',
      '📍 اقترح أقرب الأماكن المحلية الأصيلة من هنا',
      '🗺️ خطط لي مساراً خاصاً لهذا اليوم',
    ],
    actions: {
      'service:breakfast': {
        label: '🥐 اطلب سلة الإفطار إلى الباب',
        sublabel: 'تشكيلة إفطار تركي طازج توصل مباشرة إليك',
      },
      'service:cleaning': {
        label: '🧹 طلب تنظيف ومناشف نظيفة',
        sublabel: 'يتم إرسال الطلب فوراً إلى فريق التدبير المنزلي',
      },
      'service:maintenance': {
        label: '🛠️ طلب دعم فني أو صيانة',
        sublabel: 'إرسال فوري لفريق الإدارة (الواي فاي، التكييف، السباكة)',
      },
      'service:support': {
        label: '🛎️ فتح طلب صيانة أو خدمة للإقامة',
        sublabel: 'إرسال فوري عبر واتساب إلى فريق إدارة العقار',
      },
      'service:laundry': {
        label: '👔 طلب غسيل وكي الملابس السريع',
        sublabel: 'استلام من الباب وتسليم خلال 24 ساعة',
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
    suiteLabelHotel: 'Номер',
    suiteLabelApartment: 'Апартаменты',
    resetBtn: 'Сброс',
    historyCleared: 'История чата очищена.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Проверенное действие Comus',
    typingText: 'Comus готовит ответ...',
    inputPlaceholder: 'Спросите Comus на любом языке (такси, счет, услуги, маршрут)...',
    justNow: 'Только что',
    chipsHotel: [
      '🛡️ Предупреди меня о частых ловушках для туристов',
      '🥐 Заказать услугу в номер или корзину с завтраком',
      '📍 Посоветуй ближайшие аутентичные места',
      '🗺️ Составь для меня персональный маршрут на сегодня',
    ],
    chipsApartment: [
      '🛡️ Предупреди меня о частых ловушках для туристов',
      '🥐 Заказать услугу в апартаменты или корзину с завтраком',
      '📍 Посоветуй ближайшие аутентичные места',
      '🗺️ Составь для меня персональный маршрут на сегодня',
    ],
    actions: {
      'service:breakfast': {
        label: '🥐 Заказать корзину с завтраком к двери',
        sublabel: 'Свежий турецкий завтрак с доставкой прямо к вашей двери',
      },
      'service:cleaning': {
        label: '🧹 Заказать уборку и свежие полотенца',
        sublabel: 'Мгновенная передача запроса службе хаускипинга',
      },
      'service:maintenance': {
        label: '🛠️ Открыть заявку на техподдержку',
        sublabel: 'Приоритетное уведомление (Wi-Fi, кондиционер, сантехника)',
      },
      'service:support': {
        label: '🛎️ Открыть заявку по проживанию / техподдержке',
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
    suiteLabelHotel: 'Zimmer',
    suiteLabelApartment: 'Suite',
    resetBtn: 'Reset',
    historyCleared: 'Gesprächsverlauf gelöscht.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Verifizierte Comus-Aktion',
    typingText: 'Comus bereitet Ihre Antwort vor...',
    inputPlaceholder: 'Fragen Sie Comus in Ihrer Sprache (Taxipreis, Servicewunsch, Route)...',
    justNow: 'Gerade eben',
    chipsHotel: [
      '🛡️ Warne mich vor häufigen Touristenfallen in Istanbul',
      '🥐 Zimmerservice oder frischen Frühstückskorb anfordern',
      '📍 Empfiehl mir die nächsten authentischen Orte',
      '🗺️ Plane eine individuelle Route für heute',
    ],
    chipsApartment: [
      '🛡️ Warne mich vor häufigen Touristenfallen in Istanbul',
      '🥐 Apartment-Service oder frischen Frühstückskorb anfordern',
      '📍 Empfiehl mir die nächsten authentischen Orte',
      '🗺️ Plane eine individuelle Route für heute',
    ],
    actions: {
      'service:breakfast': {
        label: '🥐 Frühstückskorb an die Tür bestellen',
        sublabel: 'Frisches türkisches Frühstück direkt an Ihre Tür geliefert',
      },
      'service:cleaning': {
        label: '🧹 Reinigung & frische Handtücher anfordern',
        sublabel: 'Sofortige Weiterleitung an das Housekeeping-Team',
      },
      'service:maintenance': {
        label: '🛠️ Technisches Support-Ticket öffnen',
        sublabel: 'Direkte Weiterleitung für WLAN, Klimaanlage oder Sanitär',
      },
      'service:support': {
        label: '🛎️ Dringendes Service- & Technik-Ticket öffnen',
        sublabel: 'Direkte WhatsApp-Weiterleitung an Ihr Hausmanagement',
      },
      'service:laundry': {
        label: '👔 Express-Wäsche & Bügelservice anfordern',
        sublabel: 'Abholung an der Tür & gebügelte Lieferung in 24 Stunden',
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
    suiteLabelHotel: 'Chambre',
    suiteLabelApartment: 'Suite',
    resetBtn: 'Réinitialiser',
    historyCleared: 'Historique de conversation effacé.',
    offlineMsg: OFFLINE_FALLBACK_MESSAGE_TR,
    connInterrupted: OFFLINE_FALLBACK_MESSAGE_TR,
    verifiedActionBadge: 'Action Vérifiée Comus',
    typingText: 'Comus prépare votre réponse...',
    inputPlaceholder: 'Posez votre question à Comus (tarif taxi, service, itinéraire)...',
    justNow: 'À l’instant',
    chipsHotel: [
      '🛡️ Avertis-moi des pièges à touristes courants à Istanbul',
      '🥐 Demander un service en chambre ou un panier petit-déjeuner',
      '📍 Recommande-moi les adresses authentiques les plus proches',
      '🗺️ Trace-moi un itinéraire sur mesure pour aujourd’hui',
    ],
    chipsApartment: [
      '🛡️ Avertis-moi des pièges à touristes courants à Istanbul',
      '🥐 Demander un service en suite ou un panier petit-déjeuner',
      '📍 Recommande-moi les adresses authentiques les plus proches',
      '🗺️ Trace-moi un itinéraire sur mesure pour aujourd’hui',
    ],
    actions: {
      'service:breakfast': {
        label: '🥐 Commander un Panier Petit-Déjeuner',
        sublabel: 'Assortiment turc artisanal livré directement devant votre porte',
      },
      'service:cleaning': {
        label: '🧹 Demander le Ménage & Serviettes Propres',
        sublabel: 'Transmis immédiatement à l’équipe d’entretien',
      },
      'service:maintenance': {
        label: '🛠️ Ouvrir un Ticket d’Assistance Technique',
        sublabel: 'Intervention rapide (Wi-Fi, climatisation, plomberie)',
      },
      'service:support': {
        label: '🛎️ Ouvrir un Ticket Conciergerie & Maintenance',
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
  lang: Language = 'tr',
  disabledServiceIds: string[] = []
): {
  cleanText: string;
  parsedActions: ParsedComusAction[];
} {
  const parsedActions: ParsedComusAction[] = [];
  const seen = new Set<string>();
  const langDict = COMUS_I18N[lang] || COMUS_I18N.tr;
  const disabledSet = new Set(disabledServiceIds.map((s) => s.toLowerCase()));

  const regex = new RegExp(ACTION_TAG_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    const [raw, actionType, targetKind, rawTargetValues, unitParam] = match;
    const subValues = rawTargetValues
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const targetValue of subValues) {
      // Do not render an in-stay action card if the service is disabled in real-time inventory
      if (
        targetKind === 'service' &&
        (disabledSet.has(targetValue.toLowerCase()) ||
          (targetValue === 'maintenance' && disabledSet.has('technical')) ||
          (targetValue === 'laundry' && disabledSet.has('dry_cleaning')))
      ) {
        continue;
      }

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
          unitName: unitParam?.trim(),
          label: meta.label,
          sublabel: unitParam?.trim()
            ? `${meta.sublabel} · ${unitParam.trim()}`
            : meta.sublabel,
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

/**
 * Extracts `partner_id` (`property_id`) and `unit_id` from PWA URL parameters (`/stay/[hotelId]/[roomId]` or query params)
 */
function resolvePwaUrlSessionParams(
  fallbackPartnerId: string,
  fallbackUnitId: string
): { partnerId: string; unitId: string } {
  if (typeof window === 'undefined') {
    return { partnerId: fallbackPartnerId, unitId: fallbackUnitId };
  }
  try {
    const pathname = window.location.pathname || '';
    const stayMatch = pathname.match(/^\/stay\/([^/]+)\/([^/]+)/);
    const searchParams = new URLSearchParams(window.location.search);

    const urlPartnerId =
      searchParams.get('partner_id') ||
      searchParams.get('property_id') ||
      searchParams.get('hotelId') ||
      (stayMatch?.[1] ? decodeURIComponent(stayMatch[1]) : '');

    const urlUnitId =
      searchParams.get('unit_id') ||
      searchParams.get('roomId') ||
      searchParams.get('room') ||
      (stayMatch?.[2] ? decodeURIComponent(stayMatch[2]) : '');

    return {
      partnerId: urlPartnerId || fallbackPartnerId,
      unitId: urlUnitId || fallbackUnitId,
    };
  } catch {
    return { partnerId: fallbackPartnerId, unitId: fallbackUnitId };
  }
}

export function AiChatDrawer({
  hotel,
  roomNumber = '101',
  lang = 'tr',
  isOpen,
  onClose,
  onExploreCategory,
}: AiChatDrawerProps) {
  const [liveHotels, setLiveHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [inRoomServices, setInRoomServices] = useState<InRoomServiceItem[]>(() =>
    XeniosStore.getInRoomServices()
  );

  // Sync live hotel and active/passive service toggles whenever updated in Management Portal or Firestore
  useEffect(() => {
    const syncInventory = () => {
      setLiveHotels(XeniosStore.getHotels());
      setInRoomServices(XeniosStore.getInRoomServices());
    };
    syncInventory();
    window.addEventListener('xenios_hotels_updated', syncInventory);
    window.addEventListener('xenios_in_room_services_updated', syncInventory);
    window.addEventListener('xenios_module_settings_updated', syncInventory);
    window.addEventListener('storage', syncInventory);
    return () => {
      window.removeEventListener('xenios_hotels_updated', syncInventory);
      window.removeEventListener('xenios_in_room_services_updated', syncInventory);
      window.removeEventListener('xenios_module_settings_updated', syncInventory);
      window.removeEventListener('storage', syncInventory);
    };
  }, []);

  const { partnerId: resolvedPartnerId, unitId: resolvedRawUnitId } = useMemo(
    () =>
      resolvePwaUrlSessionParams(
        hotel?.id || XeniosStore.getActiveHotelId() || 'hotel-heritage-1',
        roomNumber || XeniosStore.getActiveRoomId() || '101'
      ),
    [hotel?.id, roomNumber]
  );

  const activeProperty = useMemo(
    () =>
      liveHotels.find((h) => h.id === resolvedPartnerId) ||
      hotel ||
      liveHotels[0],
    [liveHotels, resolvedPartnerId, hotel]
  );

  const resolvedPropertyName =
    activeProperty?.name || hotel?.name || 'Old City Heritage Hotel Istanbul';
  const propertyType = useMemo(
    () => inferClientPropertyType(activeProperty?.type, resolvedPropertyName),
    [activeProperty?.type, resolvedPropertyName]
  );

  const matchedRoom = useMemo(
    () =>
      activeProperty?.rooms?.find(
        (r) => String(r.id) === String(resolvedRawUnitId) || String(r.number) === String(resolvedRawUnitId)
      ),
    [activeProperty?.rooms, resolvedRawUnitId]
  );

  const formattedUnitName = useMemo(
    () => formatClientUnitName(resolvedRawUnitId, propertyType, matchedRoom?.type),
    [resolvedRawUnitId, propertyType, matchedRoom?.type]
  );

  const ui = COMUS_I18N[lang] || COMUS_I18N.tr;
  const dynamicSuiteLabel =
    propertyType === 'apartment' ? ui.suiteLabelApartment : ui.suiteLabelHotel;
  const dynamicChips =
    propertyType === 'apartment' ? ui.chipsApartment : ui.chipsHotel;

  const dynamicWelcomeText = useMemo(
    () => buildDynamicWelcomeMessage(lang, resolvedPropertyName, propertyType),
    [lang, resolvedPropertyName, propertyType]
  );

  const disabledServiceIds = useMemo(() => {
    const disabled: string[] = [];
    const bfItem = inRoomServices.find((s) => s.key === 'breakfast');
    const rsItem = inRoomServices.find((s) => s.key === 'roomservice');
    const bfActive =
      (bfItem && bfItem.enabled !== false && !bfItem.hidden) ||
      (rsItem && rsItem.enabled !== false && !rsItem.hidden);
    if (!bfActive) {
      disabled.push('breakfast', 'roomservice');
    }
    for (const s of inRoomServices) {
      if (s.key === 'breakfast' || s.key === 'roomservice') continue;
      if (s.enabled === false || s.hidden || s.explicitlyHidden) {
        disabled.push(s.key);
        if (s.key === 'technical') disabled.push('maintenance', 'support');
        if (s.key === 'laundry') disabled.push('dry_cleaning');
        if (s.key === 'cleaning') disabled.push('extra_cleaning');
      }
    }
    return disabled;
  }, [inRoomServices]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForFirstToken, setIsWaitingForFirstToken] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Interactive Sub-Modals triggered by Action Cards
  const [activeActionModal, setActiveActionModal] = useState<
    null | 'breakfast' | 'cleaning' | 'maintenance' | 'support' | 'transfer' | 'laundry'
  >(null);

  // Sub-modal states
  const [breakfastBoxType, setBreakfastBoxType] = useState(
    'Traditional Anatolian Serpme Box (For 2)'
  );
  const [breakfastTime, setBreakfastTime] = useState('08:30 AM');
  const [breakfastNotes, setBreakfastNotes] = useState('');

  const [cleaningUrgency, setCleaningUrgency] = useState('Standart Temizlik & Havlu Değişimi');
  const [cleaningUnitState, setCleaningUnitState] = useState('Boş');
  const [cleaningNotes, setCleaningNotes] = useState('');

  const [supportIssueType, setSupportIssueType] = useState('Wi-Fi & Internet Connectivity');
  const [supportNotes, setSupportNotes] = useState('Need immediate assistance.');

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
      id: 'comus-welcome-v4',
      sender: 'assistant',
      text: dynamicWelcomeText,
      time: ui.justNow,
    };
    const saved = XeniosStore.getAiChatMessages();
    if (saved && saved.length > 0) {
      if (saved.length === 1 && saved[0]?.sender === 'assistant') {
        XeniosStore.saveAiChatMessages([freshWelcome]);
        return [freshWelcome];
      }
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

  // Always keep the opening welcome message synchronized with current language, propertyName & propertyType
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length >= 1 && prev[0]?.sender === 'assistant') {
        const updatedFirst: ChatMessage = {
          ...prev[0],
          id: 'comus-welcome-v4',
          text: dynamicWelcomeText,
          time: ui.justNow,
        };
        const next = [updatedFirst, ...prev.slice(1)];
        XeniosStore.saveAiChatMessages(next);
        return next;
      }
      return prev;
    });
  }, [dynamicWelcomeText, ui.justNow]);

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
      id: 'comus-welcome-v4',
      sender: 'assistant',
      text: dynamicWelcomeText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([fresh]);
    XeniosStore.saveAiChatMessages([fresh]);
    toast.success(ui.historyCleared);
  }, [dynamicWelcomeText, ui.historyCleared]);

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

      // Pass unit_id and partner_id from PWA URL parameters + live property context snapshot
      const res = await fetch('/api/comus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          messages: historyPayload,
          partner_id: resolvedPartnerId,
          property_id: resolvedPartnerId,
          unit_id: resolvedRawUnitId,
          hotelId: resolvedPartnerId,
          hotelName: resolvedPropertyName,
          roomNumber: resolvedRawUnitId,
          unitId: formattedUnitName,
          lang,
          clientLiveContext: {
            propertyName: resolvedPropertyName,
            propertyType,
            rawPropertyType: activeProperty?.type,
            unitName: formattedUnitName,
            district: activeProperty?.district || 'Sultanahmet / Fatih',
            breakfastHours: activeProperty?.breakfastHours || '08:00 - 11:30',
            inRoomServices,
          },
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
      if (act.targetValue === 'cleaning') {
        setActiveActionModal('cleaning');
        return;
      }
      if (act.targetValue === 'maintenance' || act.targetValue === 'technical') {
        setActiveActionModal('maintenance');
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
        hotelId: resolvedPartnerId,
        hotelName: resolvedPropertyName,
        roomNumber: resolvedRawUnitId,
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
        ? `✅ **Kahvaltı Talebiniz Alındı:** *${breakfastBoxType}* siparişiniz **${breakfastTime}** saati için **${formattedUnitName}** birimine planlandı.${breakfastNotes ? ` Not: "${breakfastNotes}"` : ''}`
        : serviceKey === 'cleaning'
          ? `🧹 **Temizlik Talebiniz İletildi:** **${formattedUnitName}** birimi için *${cleaningUrgency}* (Durum: ${cleaningUnitState}) talebiniz kat hizmetleri ekibine iletildi.`
          : serviceKey === 'technical' || serviceKey === 'support'
            ? `🛠️ **Teknik Destek Kaydınız Açıldı:** **${formattedUnitName}** birimi için **${supportIssueType}** talebiniz yönetim ekibine **ACİL** koduyla iletildi.`
            : serviceKey === 'laundry'
              ? `👔 **Çamaşır & Ütü Talebiniz Alındı:** **${formattedUnitName}** biriminden (**${laundryPickupTime}**) *${laundryPackage}* teslim alımı planlandı.`
              : `🚐 **VIP Transfer Rezervasyonunuz Alındı:** **${transferAirport}** (${transferPickupTime}${transferFlightNo ? ` · Uçuş ${transferFlightNo}` : ''}) transfer talebiniz onaylandı.`;

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
    toast.success(`${serviceTitle} (${formattedUnitName})`);
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
                  {resolvedPropertyName} · {formattedUnitName}
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
              : parseMessageAndActions(msg.text, lang, disabledServiceIds);

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
                    {dynamicChips.map((chip) => (
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
                    {resolvedPropertyName} · {formattedUnitName}
                  </span>
                  <h3 className="font-luxury-serif text-base font-bold text-[#221F1C] mt-0.5">
                    {activeActionModal === 'breakfast' && ui.actions['service:breakfast'].label}
                    {activeActionModal === 'cleaning' && ui.actions['service:cleaning'].label}
                    {activeActionModal === 'maintenance' && ui.actions['service:maintenance'].label}
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
                      Kahvaltı Seçimi / Breakfast Basket
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
                      Teslimat Saati / Delivery Time
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
                      Özel İstekler / Dietary Note
                    </label>
                    <input
                      type="text"
                      value={breakfastNotes}
                      onChange={(e) => setBreakfastNotes(e.target.value)}
                      placeholder="Örn: Taze demlenmiş çay, laktozsuz süt..."
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      submitInStayRequest(
                        'breakfast',
                        'Kahvaltı & Yeme-İçme Talebi',
                        `${breakfastBoxType} · Teslimat: ${breakfastTime}${breakfastNotes ? ` · ${breakfastNotes}` : ''}`,
                        'standart'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kahvaltı Talebini Onayla ({formattedUnitName})</span>
                  </button>
                </div>
              )}

              {activeActionModal === 'cleaning' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Temizlik Türü / Housekeeping Type
                    </label>
                    <select
                      value={cleaningUrgency}
                      onChange={(e) => setCleaningUrgency(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Standart Temizlik &amp; Havlu Değişimi</option>
                      <option>Kahvaltı Sonrası Toparlama</option>
                      <option>Acil Temizlik / Ekstra Havlu &amp; Çarşaf</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Durum / Current Status
                    </label>
                    <select
                      value={cleaningUnitState}
                      onChange={(e) => setCleaningUnitState(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option value="Boş">Boş</option>
                      <option value="Dolu (Misafir İçeride)">Dolu (Misafir İçeride)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Özel Not / Special Note
                    </label>
                    <input
                      type="text"
                      value={cleaningNotes}
                      onChange={(e) => setCleaningNotes(e.target.value)}
                      placeholder="Örn: Ekstra banyo havlusu rica ederim..."
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2 bg-[#FFFDF9] text-[#221F1C]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      submitInStayRequest(
                        'cleaning',
                        'Temizlik Talebi',
                        `${cleaningUrgency} · Durum: ${cleaningUnitState}${cleaningNotes ? ` · ${cleaningNotes}` : ''}`,
                        cleaningUrgency.includes('Acil') ? 'acil' : 'standart'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Temizlik Talebini İlet ({formattedUnitName})</span>
                  </button>
                </div>
              )}

              {(activeActionModal === 'maintenance' || activeActionModal === 'support') && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="font-semibold">
                      {resolvedPropertyName} · {formattedUnitName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
                      Acil / Urgent
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Konu / Issue Category
                    </label>
                    <select
                      value={supportIssueType}
                      onChange={(e) => setSupportIssueType(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Wi-Fi &amp; Internet Connectivity</option>
                      <option>Air Conditioning / Heating Climate Control</option>
                      <option>Hot Water / Bathroom Plumbing</option>
                      <option>Electricity / Lighting</option>
                      <option>Smart Lock / Access Assistance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#5C4938] mb-1">
                      Detay / Details for Management
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
                        'technical',
                        `Teknik Destek: ${supportIssueType}`,
                        `${supportIssueType} · ${supportNotes}`,
                        'acil'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Teknik Destek Talebini İlet ({formattedUnitName})</span>
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
                      Doorstep Pickup Window ({dynamicSuiteLabel})
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
                    <span>Schedule Doorstep Valet Pickup ({formattedUnitName})</span>
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
