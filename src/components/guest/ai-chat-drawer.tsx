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
  targetValue: string; // 'bosphorus' | 'transfer' | 'breakfast' | 'support' | etc.
  label: string;
  sublabel: string;
}

export const QUICK_SUGGESTION_CHIPS = [
  '✨ What can you do for me during my stay?',
  '🚕 How much should a taxi to Sultanahmet cost?',
  '🕌 Dress code & visiting hours for Blue Mosque',
  '🚢 Best sunset Bosphorus cruise without crowds',
  '🛎️ Request room service or technical support',
] as const;

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'comus-welcome-v2',
  sender: 'assistant',
  text: `Welcome to Istanbul! I am **ComusAI**, your personal AI Concierge and hyper-local Istanbul companion. Here is what I can do for you during your stay:

• **In-Stay & Room Services:** Instantly request room service, housekeeping, fresh linens & towels, bathroom amenities, technical/Wi-Fi support, late check-out, or stay extensions directly from your room.
• **Curated Istanbul Experiences:** Discover and book verified private Bosphorus sunset cruises, fast-track historic walks, authentic 16th-century Turkish hammams, culinary trails, and rooftop photo sessions.
• **VIP Transfers & Fair Transit:** Arrange fixed-rate licensed VIP airport/city chauffeurs, check real local taxi fares, and get step-by-step public transit directions.
• **Scam-Free Local Guidance:** Get 24/7 recommendations in your own language for trusted local restaurants, hidden gems, and artisan shopping with zero tourist traps.

How may I assist you today?

[action:explore_category, id:bosphorus]`,
  time: 'Just now',
};

const ACTION_TAG_REGEX = /\[action:(\w+),\s*(id|service):(\w+)\]/g;

const ACTION_METADATA: Record<
  string,
  { label: string; sublabel: string; categoryKey?: string }
> = {
  'service:breakfast': {
    label: '🥐 Order Doorstep Breakfast Box',
    sublabel: 'Fresh artisanal Turkish spread delivered to your suite door',
  },
  'service:support': {
    label: '🛎️ Open Urgent Maintenance Ticket',
    sublabel: 'Pre-filled suite & Wi-Fi support form routed to management',
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

const COMUS_I18N: Record<Language, {
  title: string;
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
}> = {
  tr: {
    title: 'ComusAI — Kişisel İstanbul Konsiyerjiniz',
    statusBadge: 'Çevrimiçi • Yerel Rehber',
    suiteLabel: 'Oda',
    resetBtn: 'Sıfırla',
    historyCleared: 'Sohbet geçmişi temizlendi.',
    offlineMsg: 'ComusAI ile sohbet etmek için lütfen oda Wi-Fi ağına bağlanın.',
    connInterrupted: 'Bağlantı kesildi. Lütfen oda Wi-Fi bağlantınızı kontrol edin.',
    verifiedActionBadge: 'Doğrulanmış Hızlı İşlem',
    typingText: 'ComusAI yanıtınızı hazırlıyor...',
    inputPlaceholder: 'ComusAI\'ya dilediğiniz dilde sorun (oda talebi, taksi, rota, lezzet)...',
    justNow: 'Az önce',
    chips: [
      '✨ Konaklamam boyunca benim için neler yapabilirsin?',
      '🚕 Sultanahmet\'e taksi ücreti ne kadar tutar?',
      '🕌 Sultanahmet Camii ziyaret saatleri ve kuralları',
      '🚢 Kalabalıksız en iyi Boğaz gün batımı turu',
      '🛎️ Oda servisi veya teknik destek talep et'
    ],
    welcomeText: `Merhaba, İstanbul'a hoş geldiniz! Ben **ComusAI**, kişisel dijital konsiyerjiniz ve yerel İstanbul rehberinizim. Konaklamanız boyunca sizin için yapabileceklerim:

• **Otel & Oda İçi Hizmetler:** Oda servisi, oda temizliği, temiz çarşaf ve havlu değişimi, banyo bukleti, teknik destek (Wi-Fi, klima vb.), geç çıkış (late check-out) ve konaklama uzatma taleplerinizi saniyeler içinde ilgili departmana iletebilirim.
• **Doğrulanmış İstanbul Deneyimleri:** Özel Boğaz yat ve gün batımı turları, sıra beklemeden tarihi yarımada yürüyüşleri, geleneksel Türk hamamı ritüelleri, gastronomi rotaları ve teras fotoğraf çekimlerini sizin için planlayabilirim.
• **VIP Transfer & Şehir İçi Ulaşım:** Sabit fiyatlı lisanslı VIP havalimanı/şehir içi transfer organize edebilir, güncel taksi ücretlerini ve en hızlı toplu taşıma rotalarını hesaplayabilirim.
• **Güvenli & Yerel Rehberlik:** Turist tuzaklarından uzak, gerçek yerel fiyatlarla hizmet veren seçkin restoranları, gizli kalmış lezzet duraklarını ve otantik alışveriş noktalarını 7/24 kendi dilinizde önerebilirim.

Bugün size nasıl yardımcı olabilirim?

[action:explore_category, id:bosphorus]`,
    actions: {
      'service:breakfast': {
        label: '🥐 Kapıya Kahvaltı Kutusu Sipariş Et',
        sublabel: 'Odanızın kapısına taze geleneksel Türk kahvaltısı teslimatı'
      },
      'service:support': {
        label: '🛎️ Acil Teknik Destek Kaydı Aç',
        sublabel: 'Yönetime anında iletilen oda & Wi-Fi destek formu'
      },
      'service:laundry': {
        label: '👔 Ekspres Çamaşır & Ütü Hizmeti İste',
        sublabel: 'Kapıdan teslim alım ve 24 saatte ütülü teslimat'
      },
      'id:transfer': {
        label: '🚐 Sabit Fiyatlı VIP Şoförlü Transfer',
        sublabel: 'Lisanslı Mercedes-Benz Vito havalimanı ve şehir içi filosu'
      },
      'id:bosphorus': {
        label: '⛵ Doğrulanmış Boğaz Turlarını Keşfet',
        sublabel: 'Komisyonsuz özel yatlar ve butik gün batımı turları'
      },
      'id:history': {
        label: '🏛️ Tarihi Rotalar & Hızlı Geçiş Turları',
        sublabel: 'Ayasofya, Sultanahmet ve Sarnıçlar için lisanslı tarihçi rehberler'
      },
      'id:hammam': {
        label: '🫧 Geleneksel Türk Hamamı & Kese Ritüeli',
        sublabel: 'Seçkin 16. yüzyıl Osmanlı hamamları ve özel bakım paketleri'
      },
      'id:culinary': {
        label: '🍢 Gastronomi & Sokak Lezzetleri Rotaları',
        sublabel: 'Kadıköy, Karaköy ve Fatih\'in en sevilen yerel lezzet durakları'
      },
      'id:photography': {
        label: '📸 Teras Fotoğraf Çekimi & Kostüm',
        sublabel: 'Boğaz ve Galata teraslarında gün batımı özel fotoğraf çekimi'
      }
    }
  },
  en: {
    title: 'ComusAI — Your Istanbul Concierge',
    statusBadge: 'Online • Local Guide',
    suiteLabel: 'Suite',
    resetBtn: 'Reset',
    historyCleared: 'Conversation history cleared.',
    offlineMsg: 'Please connect to your suite Wi-Fi to chat with ComusAI.',
    connInterrupted: 'Connection interrupted. Please check your suite Wi-Fi.',
    verifiedActionBadge: 'Verified Instant Action',
    typingText: 'ComusAI is crafting your local guide...',
    inputPlaceholder: 'Ask ComusAI in any language (room requests, fares, food, history)...',
    justNow: 'Just now',
    chips: [...QUICK_SUGGESTION_CHIPS],
    welcomeText: INITIAL_WELCOME_MESSAGE.text,
    actions: {
      'service:breakfast': ACTION_METADATA['service:breakfast'],
      'service:support': ACTION_METADATA['service:support'],
      'service:laundry': ACTION_METADATA['service:laundry'],
      'id:transfer': ACTION_METADATA['id:transfer'],
      'id:bosphorus': ACTION_METADATA['id:bosphorus'],
      'id:history': ACTION_METADATA['id:history'],
      'id:hammam': ACTION_METADATA['id:hammam'],
      'id:culinary': ACTION_METADATA['id:culinary'],
      'id:photography': ACTION_METADATA['id:photography']
    }
  },
  ar: {
    title: 'ComusAI — الكونسيرج الشخصي في إسطنبول',
    statusBadge: 'متصل • مرشد محلي',
    suiteLabel: 'غرفة',
    resetBtn: 'إعادة تعيين',
    historyCleared: 'تم مسح سجل المحادثة.',
    offlineMsg: 'يرجى الاتصال بشبكة Wi-Fi الخاصة بالغرفة للدردشة مع ComusAI.',
    connInterrupted: 'انقطع الاتصال. يرجى التحقق من شبكة Wi-Fi.',
    verifiedActionBadge: 'إجراء فوري موثق',
    typingText: 'يقوم ComusAI بإعداد دليلك المحلي...',
    inputPlaceholder: 'اسأل ComusAI بأي لغة (خدمة الغرف، التاكسي، المطاعم، الجولات)...',
    justNow: 'الآن',
    chips: [
      '✨ ماذا يمكنك أن تفعل لي خلال إقامتي؟',
      '🚕 كم تبلغ تكلفة التاكسي إلى السلطان أحمد؟',
      '🕌 أوقات الزيارة وقواعد اللباس في المسجد الأزرق',
      '🚢 أفضل جولة بحرية عند الغروب بدون ازدحام',
      '🛎️ طلب خدمة الغرف أو الدعم الفني'
    ],
    welcomeText: `أهلاً بك في إسطنبول! أنا **ComusAI**، الكونسيرج الرقمي الشخصي ومرشدك المحلي في إسطنبول. إليك ما يمكنني القيام به من أجلك طوال فترة إقامتك:

• **خدمات الفندق والغرف:** طلب خدمة الغرف، تنظيف الغرفة، تغيير الشراشف والمناشف، مستلزمات الحمام، الدعم الفني والـ Wi-Fi، تسجيل المغادرة المتأخر أو تمديد الإقامة فوراً.
• **تجارب إسطنبول المعتمدة:** تنظيم وحجز جولات البوسفور الخاصة عند الغروب، الجولات التاريخية السريعة، الحمامات التركية العثمانية الأصيلة، جولات الطعام وجلسات التصوير على الأسطح.
• **نقل VIP والمواصلات العادلة:** ترتيب سيارات VIP مرخصة بسعر ثابت للمطار والمدينة، وحساب أسعار التاكسي الحقيقية وأفضل مسارات المواصلات.
• **إرشاد محلي آمن وموثوق:** تقديم توصيات على مدار الساعة بلغتك لأفضل المطاعم المحلية والأسواق الأصيلة بعيداً عن فخاخ السياح.

كيف يمكنني مساعدتك اليوم؟

[action:explore_category, id:bosphorus]`,
    actions: {
      'service:breakfast': {
        label: '🥐 اطلب صندوق الإفطار إلى باب الغرفة',
        sublabel: 'تشكيلة إفطار تركي طازج توصل مباشرة إلى جناحك'
      },
      'service:support': {
        label: '🛎️ فتح طلب صيانة عاجل',
        sublabel: 'نموذج دعم فوري للغرفة والـ Wi-Fi يرسل للإدارة'
      },
      'service:laundry': {
        label: '👔 طلب غسيل وكي الملابس السريع',
        sublabel: 'استلام من باب الغرفة وتسليم خلال 24 ساعة'
      },
      'id:transfer': {
        label: '🚐 حجز سيارة VIP مع سائق بسعر ثابت',
        sublabel: 'أسطول مرسيدس فيتو مرخص للمطار والمدينة'
      },
      'id:bosphorus': {
        label: '⛵ استكشف جولات البوسفور المعتمدة',
        sublabel: 'يخوت خاصة وجولات غروب الشمس بدون عمولات إضافية'
      },
      'id:history': {
        label: '🏛️ استكشف المسارات التاريخية والدخول السريع',
        sublabel: 'مرشدون مؤرخون مرخصون لآيا صوفيا والمسجد الأزرق'
      },
      'id:hammam': {
        label: '🫧 استكشف طقوس الحمام التركي التقليدي',
        sublabel: 'حمامات عثمانية تاريخية معتمدة وجلسات تقشير خاصة'
      },
      'id:culinary': {
        label: '🍢 استكشف جولات التذوق وطعام الشارع',
        sublabel: 'أشهر النكهات المحلية في كاديكوي وكاراكوي والفاتح'
      },
      'id:photography': {
        label: '📸 جلسات التصوير على الأسطح والأزياء',
        sublabel: 'جلسات تصوير خاصة عند الغروب بإطلالة البوسفور وغالاتا'
      }
    }
  },
  ru: {
    title: 'ComusAI — Ваш консьерж в Стамбуле',
    statusBadge: 'Онлайн • Местный гид',
    suiteLabel: 'Номер',
    resetBtn: 'Сброс',
    historyCleared: 'История чата очищена.',
    offlineMsg: 'Пожалуйста, подключитесь к Wi-Fi в номере для общения с ComusAI.',
    connInterrupted: 'Соединение прервано. Проверьте подключение к Wi-Fi.',
    verifiedActionBadge: 'Проверенное быстрое действие',
    typingText: 'ComusAI готовит ваш местный гид...',
    inputPlaceholder: 'Спросите ComusAI на любом языке (услуги в номере, такси, еда, маршруты)...',
    justNow: 'Только что',
    chips: [
      '✨ Чем ты можешь помочь мне во время проживания?',
      '🚕 Сколько стоит такси до Султанахмета?',
      '🕌 Дресс-код и часы посещения Голубой мечети',
      '🚢 Лучший круиз на закате без толп',
      '🛎️ Заказать обслуживание номера или техподдержку'
    ],
    welcomeText: `Добро пожаловать в Стамбул! Я **ComusAI**, ваш персональный ИИ-консьерж и локальный гид по Стамбулу. Вот что я могу сделать для вас во время вашего пребывания:

• **Услуги отеля и в номере:** Мгновенно передать запрос на обслуживание в номере, уборку, смену белья и полотенец, банные принадлежности, техподдержку (Wi-Fi, кондиционер), поздний выезд или продление проживания.
• **Проверенные впечатления в Стамбуле:** Подобрать и забронировать приватные круизы по Босфору на закате, исторические прогулки без очередей, аутентичные хаммамы XVI века, гастро-туры и фотосессии на крышах.
• **VIP-трансфер и транспорт:** Организовать лицензированный VIP-трансфер по фиксированной цене, рассчитать честную стоимость такси и подсказать оптимальные маршруты по городу.
• **Защита от туристических ловушек:** Круглосуточно рекомендовать проверенные локальные рестораны, секретные места и аутентичный шопинг на вашем языке.

Чем я могу помочь вам сегодня?

[action:explore_category, id:bosphorus]`,
    actions: {
      'service:breakfast': {
        label: '🥐 Заказать бокс с завтраком к двери',
        sublabel: 'Свежий турецкий завтрак с доставкой прямо в ваш номер'
      },
      'service:support': {
        label: '🛎️ Открыть срочную заявку на ремонт / Wi-Fi',
        sublabel: 'Мгновенное уведомление управляющему отеля'
      },
      'service:laundry': {
        label: '👔 Заказать экспресс-прачечную и глажку',
        sublabel: 'Забор вещей у двери и доставка через 24 часа'
      },
      'id:transfer': {
        label: '🚐 Заказать VIP-трансфер по фиксированной цене',
        sublabel: 'Лицензированный флот Mercedes-Benz Vito в аэропорт и по городу'
      },
      'id:bosphorus': {
        label: '⛵ Проверенные круизы по Босфору',
        sublabel: 'Приватные яхты и вечерние прогулки без наценок'
      },
      'id:history': {
        label: '🏛️ Исторические маршруты без очередей',
        sublabel: 'Лицензированные гиды-историки в Айя-Софию и Голубую мечеть'
      },
      'id:hammam': {
        label: '🫧 Традиционные турецкие хаммамы и СПА',
        sublabel: 'Проверенные османские мраморные бани XVI века'
      },
      'id:culinary': {
        label: '🍢 Гастрономические маршруты и стрит-фуд',
        sublabel: 'Лучшие локальные места в Кадыкёе, Каракёе и Фатихе'
      },
      'id:photography': {
        label: '📸 Фотосессии на крышах и в платьях',
        sublabel: 'Приватные съемки на закате с видом на Босфор и Галату'
      }
    }
  },
  de: {
    title: 'ComusAI — Ihr Istanbul-Concierge',
    statusBadge: 'Online • Lokaler Guide',
    suiteLabel: 'Zimmer',
    resetBtn: 'Reset',
    historyCleared: 'Gesprächsverlauf gelöscht.',
    offlineMsg: 'Bitte verbinden Sie sich mit dem Zimmer-WLAN, um mit ComusAI zu chatten.',
    connInterrupted: 'Verbindung unterbrochen. Bitte prüfen Sie Ihr WLAN.',
    verifiedActionBadge: 'Verifizierte Sofortaktion',
    typingText: 'ComusAI erstellt Ihren lokalen Guide...',
    inputPlaceholder: 'Fragen Sie ComusAI in jeder Sprache (Zimmerservice, Taxis, Essen, Touren)...',
    justNow: 'Gerade eben',
    chips: [
      '✨ Was kannst du während meines Aufenthalts für mich tun?',
      '🚕 Was kostet ein Taxi nach Sultanahmet?',
      '🕌 Kleiderordnung & Zeiten für die Blaue Moschee',
      '🚢 Beste Sonnenuntergangs-Bootstour ohne Massen',
      '🛎️ Zimmerservice oder technische Hilfe anfordern'
    ],
    welcomeText: `Willkommen in Istanbul! Ich bin **ComusAI**, Ihr persönlicher KI-Concierge und lokaler Istanbul-Begleiter. Das kann ich während Ihres Aufenthalts für Sie tun:

• **Hotel- & Zimmerservice:** Fordern Sie sekundenschnell Zimmerservice, Zimmerreinigung, frische Bettwäsche/Handtücher, Bad-Artikel, technischen/WLAN-Support, Late Check-out oder eine Aufenthaltsverlängerung an.
• **Geprüfte Istanbul-Erlebnisse:** Entdecken und buchen Sie private Bosporus-Sonnenuntergangsfahrten, historische Führungen ohne Anstehen, authentische Hamams aus dem 16. Jahrhundert, Kulinarik-Touren und Dachterrassen-Fotoshootings.
• **VIP-Transfers & Faire Mobilität:** Buchen Sie lizenzierte VIP-Chauffeure zum Festpreis, prüfen Sie faire Taxitarife und erhalten Sie optimale Routenempfehlungen.
• **Schutz vor Touristenfallen:** Erhalten Sie rund um die Uhr Empfehlungen in Ihrer Sprache für verifizierte lokale Restaurants, Geheimtipps und authentisches Kunsthandwerk.

Wie darf ich Ihnen heute helfen?

[action:explore_category, id:bosphorus]`,
    actions: {
      'service:breakfast': {
        label: '🥐 Frühstücksbox an die Zimmertür bestellen',
        sublabel: 'Frisches türkisches Frühstück direkt an Ihre Suitetür geliefert'
      },
      'service:support': {
        label: '🛎️ Dringendes Wartungsticket eröffnen',
        sublabel: 'Direkte Weiterleitung von Zimmer- & WLAN-Anfragen an das Management'
      },
      'service:laundry': {
        label: '👔 Express-Wäsche & Bügelservice anfordern',
        sublabel: 'Abholung an der Zimmertür & gebügelte Lieferung in 24 Stunden'
      },
      'id:transfer': {
        label: '🚐 VIP-Chauffeur zum Festpreis buchen',
        sublabel: 'Lizenzierte Mercedes-Benz Vito Flotte für Flughafen & Stadt'
      },
      'id:bosphorus': {
        label: '⛵ Geprüfte Bosporus-Kreuzfahrten entdecken',
        sublabel: 'Private Yachten & Sonnenuntergangstouren ohne Aufschläge'
      },
      'id:history': {
        label: '🏛️ Historische Routen & Fast-Track-Touren',
        sublabel: 'Lizenzierte Historiker-Guides für Hagia Sophia, Blaue Moschee & Zisternen'
      },
      'id:hammam': {
        label: '🫧 Traditionelle Türkische Hamam-Rituale',
        sublabel: 'Geprüfte osmanische Marmorbäder aus dem 16. Jahrhundert'
      },
      'id:culinary': {
        label: '🍢 Kulinarik- & Street-Food-Touren',
        sublabel: 'Beliebte lokale Klassiker in Kadıköy, Karaköy & Fatih'
      },
      'id:photography': {
        label: '📸 Dachterrassen-Fotoshooting & Kostüme',
        sublabel: 'Private Golden-Hour-Shootings über dem Bosporus & Galata'
      }
    }
  },
  fr: {
    title: 'ComusAI — Votre Concierge d’Istanbul',
    statusBadge: 'En ligne • Guide local',
    suiteLabel: 'Chambre',
    resetBtn: 'Réinitialiser',
    historyCleared: 'Historique de conversation effacé.',
    offlineMsg: 'Veuillez vous connecter au Wi-Fi de votre chambre pour discuter avec ComusAI.',
    connInterrupted: 'Connexion interrompue. Veuillez vérifier votre Wi-Fi.',
    verifiedActionBadge: 'Action instantanée vérifiée',
    typingText: 'ComusAI prépare votre guide local...',
    inputPlaceholder: 'Posez votre question à ComusAI (service chambre, taxis, restaurants, visites)...',
    justNow: 'À l’instant',
    chips: [
      '✨ Que peux-tu faire pour moi pendant mon séjour ?',
      '🚕 Combien coûte un taxi pour Sultanahmet ?',
      '🕌 Code vestimentaire & horaires de la Mosquée Bleue',
      '🚢 Meilleure croisière au coucher du soleil sans foule',
      '🛎️ Demander le service en chambre ou une assistance'
    ],
    welcomeText: `Bienvenue à Istanbul ! Je suis **ComusAI**, votre concierge personnel IA et guide local dédié. Voici tout ce que je peux faire pour vous durant votre séjour :

• **Services Hôteliers & en Chambre :** Demandez en quelques secondes le room service, le ménage, des draps et serviettes propres, des produits de bain, une assistance technique/Wi-Fi, un départ tardif ou une prolongation de séjour.
• **Expériences Vérifiées à Istanbul :** Découvrez et réservez des croisières privées sur le Bosphore au coucher du soleil, des visites historiques coupe-file, des hammams ottomans du XVIe siècle, des parcours gastronomiques et des séances photo sur les toits.
• **Transferts VIP & Transports Équitables :** Organisez un chauffeur privé VIP à tarif fixe, vérifiez les vrais tarifs de taxi et obtenez les meilleurs itinéraires en ville.
• **Conseils Locaux Sans Arnaque :** Recevez 24h/24 dans votre langue des recommandations d’adresses locales authentiques, de trésors cachés et d’artisans vérifiés.

Comment puis-je vous aider aujourd'hui ?

[action:explore_category, id:bosphorus]`,
    actions: {
      'service:breakfast': {
        label: '🥐 Commander un Coffret Petit-Déjeuner',
        sublabel: 'Assortiment turc artisanal livré directement devant votre porte'
      },
      'service:support': {
        label: '🛎️ Ouvrir un Ticket de Maintenance Urgent',
        sublabel: 'Assistance chambre & Wi-Fi transmise immédiatement à la direction'
      },
      'service:laundry': {
        label: '👔 Blanchisserie Express & Repassage',
        sublabel: 'Collecte à votre porte et livraison pressée sous 24h'
      },
      'id:transfer': {
        label: '🚐 Réserver un Chauffeur VIP à Tarif Fixe',
        sublabel: 'Flotte Mercedes-Benz Vito agréée pour aéroport et ville'
      },
      'id:bosphorus': {
        label: '⛵ Explorer les Croisières Vérifiées sur le Bosphore',
        sublabel: 'Yachts privés et croisières au coucher du soleil sans commission'
      },
      'id:history': {
        label: '🏛️ Parcours Historiques & Visites Coupe-File',
        sublabel: 'Guides conférenciers pour Sainte-Sophie, Mosquée Bleue et citernes'
      },
      'id:hammam': {
        label: '🫧 Rituels de Hammam Turc Traditionnel',
        sublabel: 'Bains ottomans historiques du XVIe siècle et soins privés'
      },
      'id:culinary': {
        label: '🍢 Parcours Gastronomiques & Street Food',
        sublabel: 'Les meilleures tables locales à Kadıköy, Karaköy et Fatih'
      },
      'id:photography': {
        label: '📸 Séance Photo sur les Toits & Costumes',
        sublabel: 'Séances privées à l’heure dorée face au Bosphore et Galata'
      }
    }
  }
};

export function parseMessageAndActions(rawText: string, lang: Language = 'en'): {
  cleanText: string;
  parsedActions: ParsedComusAction[];
} {
  const parsedActions: ParsedComusAction[] = [];
  const seen = new Set<string>();
  const langDict = COMUS_I18N[lang] || COMUS_I18N.en;

  const regex = new RegExp(ACTION_TAG_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    const [raw, actionType, targetKind, targetValue] = match;
    const lookupKey = `${targetKind}:${targetValue}`;
    if (!seen.has(lookupKey)) {
      seen.add(lookupKey);
      const meta = langDict.actions[lookupKey] || ACTION_METADATA[lookupKey] || {
        label:
          targetKind === 'service'
            ? `🛎️ Open ${targetValue.charAt(0).toUpperCase() + targetValue.slice(1)} Service`
            : `✨ Explore ${targetValue.charAt(0).toUpperCase() + targetValue.slice(1)}`,
        sublabel: 'Verified Purely Istanbul In-Stay Concierge Action',
      };
      parsedActions.push({
        raw,
        actionType,
        targetKind: targetKind as 'id' | 'service',
        targetValue,
        label: meta.label,
        sublabel: meta.sublabel,
      });
    }
  }

  // Strip complete action tags and any partially-streamed trailing "[action:..." fragment
  const cleanText = rawText
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
 * Warm Gilded Champagne & Royal Gold ComusAI Emblem matching the app theme
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
  lang = 'en',
  isOpen,
  onClose,
  onExploreCategory,
}: AiChatDrawerProps) {
  const resolvedHotelName = hotel?.name || 'Purely Istanbul Partner Suite';
  const resolvedHotelId = hotel?.id || 'hotel-1';
  const ui = COMUS_I18N[lang] || COMUS_I18N.en;

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForFirstToken, setIsWaitingForFirstToken] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Interactive Sub-Modals triggered by Action Cards
  const [activeActionModal, setActiveActionModal] = useState<
    null | 'breakfast' | 'support' | 'transfer' | 'laundry'
  >(null);

  // Sub-modal states
  const [breakfastBoxType, setBreakfastBoxType] = useState('Traditional Anatolian Serpme Box (For 2)');
  const [breakfastTime, setBreakfastTime] = useState('08:30 AM');
  const [breakfastNotes, setBreakfastNotes] = useState('');

  const [supportIssueType, setSupportIssueType] = useState('Wi-Fi & Internet Connectivity');
  const [supportNotes, setSupportNotes] = useState('Need immediate assistance in suite.');

  const [transferAirport, setTransferAirport] = useState('Istanbul Airport (IST) — €65 Fixed Rate');
  const [transferFlightNo, setTransferFlightNo] = useState('');
  const [transferPickupTime, setTransferPickupTime] = useState('Today · 16:00');

  const [laundryPackage, setLaundryPackage] = useState('Express Wash, Fold & Steam Press (24h)');
  const [laundryPickupTime, setLaundryPickupTime] = useState('Within 30 Minutes');

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = XeniosStore.getAiChatMessages();
    if (saved && saved.length > 0) {
      if (saved.length === 1 && saved[0]?.sender === 'assistant') {
        const freshWelcome: ChatMessage = {
          id: 'comus-welcome-v2',
          sender: 'assistant',
          text: ui.welcomeText,
          time: ui.justNow
        };
        XeniosStore.saveAiChatMessages([freshWelcome]);
        return [freshWelcome];
      }
      return saved;
    }
    return [{
      id: 'comus-welcome-v2',
      sender: 'assistant',
      text: ui.welcomeText,
      time: ui.justNow
    }];
  });

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.sender === 'assistant') {
        const updatedWelcome: ChatMessage = {
          ...prev[0],
          id: 'comus-welcome-v2',
          text: ui.welcomeText,
          time: ui.justNow
        };
        XeniosStore.saveAiChatMessages([updatedWelcome]);
        return [updatedWelcome];
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
      toast.error(ui.offlineMsg);
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
  }, [ui.offlineMsg]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
      return () => {
        window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
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
      id: `comus-welcome-${Date.now()}`,
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
      toast.error(ui.offlineMsg);
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

      const res = await fetch('/api/comus-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          messages: historyPayload,
          hotelName: resolvedHotelName,
          roomNumber,
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
                accumulatedText += parsed.text;
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

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
        toast.error(ui.offlineMsg);
      } else {
        toast.error(ui.connInterrupted);
      }
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
        ? `✅ **Doorstep Breakfast Box Confirmed:** Your *${breakfastBoxType}* is scheduled for **${breakfastTime}** to ${ui.suiteLabel} **${roomNumber}**.${breakfastNotes ? ` Note: "${breakfastNotes}"` : ''}`
        : serviceKey === 'support'
          ? `🛎️ **Urgent Maintenance Ticket Dispatched:** Our property team has been alerted for **${supportIssueType}** in ${ui.suiteLabel} **${roomNumber}** (Priority: **URGENT**).`
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
      aria-label={ui.title}
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#221F1C]/45 backdrop-blur-sm overflow-hidden overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg h-[100dvh] sm:h-[85vh] max-h-[100dvh] sm:max-h-[760px] bg-[#FAF8F4] rounded-none sm:rounded-3xl shadow-[0_24px_70px_rgba(34,31,28,0.35)] border-0 sm:border sm:border-[#D8CBB8] flex flex-col overflow-hidden overscroll-contain relative text-[#221F1C]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER */}
        <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5 bg-gradient-to-r from-[#FAF7F0] via-[#F5EFE4] to-[#EDE3D2] text-[#221F1C] flex items-center justify-between gap-3 shrink-0 border-b border-[#D8CBB8]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ComusGlowingAvatar size="md" />
            <div className="min-w-0 flex-1">
              <h2 className="font-luxury-serif text-[16px] sm:text-[17px] font-bold tracking-tight text-[#221F1C] truncate">
                {ui.title}
              </h2>
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
              aria-label="Close ComusAI"
              className="w-8 h-8 rounded-xl bg-[#FFFDF9] hover:bg-[#F3ECE0] text-[#221F1C] border border-[#C4B8A4] flex items-center justify-center transition cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. QUICK SUGGESTION CHIPS (Horizontal Scroll directly below header) */}
        <div className="px-3.5 py-2.5 bg-[#FAF8F4] border-b border-[#DFD5C5] overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
          {ui.chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-full bg-[#FFFDF9] hover:bg-[#9E7B42] hover:text-white text-[#221F1C] border border-[#C4B8A4]/85 hover:border-[#9E7B42] text-[11.5px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* OFFLINE DETECTOR BANNER */}
        {isOffline && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2 shrink-0">
            <WifiOff className="w-4 h-4 text-[#9E7B42] shrink-0" />
            <span>{ui.offlineMsg}</span>
          </div>
        )}

        {/* 3. MESSAGE BUBBLES & INTERACTIVE ACTION CARDS */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FAF8F4] overscroll-contain">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const { cleanText, parsedActions } = isUser
              ? { cleanText: msg.text, parsedActions: [] }
              : parseMessageAndActions(msg.text, lang);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2`}
              >
                <div
                  className={`flex items-start gap-2.5 max-w-[88%] ${
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

          {/* 4. WARM TYPING INDICATOR (While waiting for first token) */}
          {isWaitingForFirstToken && (
            <div className="flex items-start gap-2.5">
              <ComusGlowingAvatar size="sm" />
              <div className="bg-[#FFFDF9] border border-[#DFD5C5] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1" aria-label="ComusAI is typing">
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
                      Select Artisanal Breakfast Box
                    </label>
                    <select
                      value={breakfastBoxType}
                      onChange={(e) => setBreakfastBoxType(e.target.value)}
                      className="w-full rounded-xl border border-[#C4B8A4] px-3 py-2.5 bg-[#FFFDF9] text-[#221F1C] font-medium"
                    >
                      <option>Traditional Anatolian Serpme Box (For 2) — €28</option>
                      <option>Galata Artisan Simit, Ezine Cheese & Kaymak Box — €16</option>
                      <option>Healthy Mediterranean Avocado & Poached Eggs Box — €18</option>
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
                        'Doorstep Breakfast Box',
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
                      Unit: {resolvedHotelName} · Suite {roomNumber}
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
                      <option>Wi-Fi & Internet Connectivity</option>
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
                      Transfer Route & Fixed Rate
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
                        Pickup Date & Time
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
                      <option>Express Wash, Fold & Steam Press (24h) — €25 / Bag</option>
                      <option>Same-Day Evening Suit & Dress Dry Cleaning — €35</option>
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

        {/* 5. MESSAGE INPUT BAR */}
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
            aria-label="Send message to ComusAI"
            className="p-3 rounded-2xl bg-gradient-to-br from-[#9E7B42] to-[#7D5E2A] hover:from-[#8B6933] hover:to-[#694D20] text-white transition shadow-sm disabled:opacity-40 cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}

export { AiChatDrawer as ComusAiConcierge };
