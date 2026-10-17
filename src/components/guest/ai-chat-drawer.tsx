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
  '🚕 How much should a taxi to Sultanahmet cost?',
  '🍳 Authentic breakfast near my stay',
  '🕌 Dress code & prayer times for Blue Mosque',
  '🚢 Best sunset boat trip without crowds',
  '🔧 Report a room / Wi-Fi issue',
] as const;

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'comus-welcome-1',
  sender: 'assistant',
  text: `Welcome to Istanbul! I am **ComusAI**, your hyper-local Istanbul Guardian & Concierge—here to treat you as our honored guest (*Tanrı Misafiri*).

• **Scam-Free Guidance:** Ask me about fair taxi fares, public transit, or how to avoid tourist traps across Fatih, Beyoğlu (Galata/Karaköy/Cihangir), Beşiktaş, and Kadıköy (Moda).
• **Verified Experiences:** Discover private Bosphorus sunset cruises, fast-track historic walks, and authentic 16th-century Turkish hammams.
• **In-Stay Suite Care:** Order a doorstep breakfast box, schedule express laundry, or report a room/Wi-Fi issue in seconds.

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
    title: 'ComusAI — İstanbul Rehberiniz',
    statusBadge: 'Çevrimiçi • Yerel Rehber',
    suiteLabel: 'Oda',
    resetBtn: 'Sıfırla',
    historyCleared: 'Sohbet geçmişi temizlendi.',
    offlineMsg: 'ComusAI ile sohbet etmek için lütfen oda Wi-Fi ağına bağlanın.',
    connInterrupted: 'Bağlantı kesildi. Lütfen oda Wi-Fi bağlantınızı kontrol edin.',
    verifiedActionBadge: 'Doğrulanmış Hızlı İşlem',
    typingText: 'ComusAI yerel rehberinizi hazırlıyor...',
    inputPlaceholder: 'ComusAI\'ya dilediğiniz dilde sorun (taksi, yemek, tarih, oda desteği)...',
    justNow: 'Az önce',
    chips: [
      '🚕 Sultanahmet\'e taksi ücreti ne kadar tutar?',
      '🍳 Otelime yakın otantik kahvaltı mekanları',
      '🕌 Sultanahmet Camii ziyaret saatleri ve kuralları',
      '🚢 Kalabalıksız en iyi Boğaz gün batımı turu',
      '🔧 Oda / Wi-Fi sorunu bildir'
    ],
    welcomeText: `İstanbul'a hoş geldiniz! Ben **ComusAI**, yerel İstanbul Rehberiniz ve Dijital Konsiyerjinizim — sizi burada *Tanrı Misafiri* olarak ağırlamak için yanınızdayım.

• **Güvenli & Adil Rehberlik:** Fatih, Beyoğlu (Galata/Karaköy/Cihangir), Beşiktaş ve Kadıköy (Moda) genelinde adil taksi ücretleri, ulaşım ve turist tuzaklarından korunma hakkında bana her şeyi sorabilirsiniz.
• **Doğrulanmış Deneyimler:** Özel Boğaz gün batımı turlarını, hızlı geçişli tarihi yürüyüşleri ve otantik 16. yüzyıl Türk hamamlarını keşfedin.
• **Oda İçi Konfor:** Saniyeler içinde kapıya sıcak kahvaltı kutusu sipariş edin, ekspres çamaşırhane planlayın veya oda/Wi-Fi desteği talep edin.

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
    title: 'ComusAI — Your Istanbul Guardian',
    statusBadge: 'Online • Local Guide',
    suiteLabel: 'Suite',
    resetBtn: 'Reset',
    historyCleared: 'Conversation history cleared.',
    offlineMsg: 'Please connect to your suite Wi-Fi to chat with ComusAI.',
    connInterrupted: 'Connection interrupted. Please check your suite Wi-Fi.',
    verifiedActionBadge: 'Verified Instant Action',
    typingText: 'ComusAI is crafting your local guide...',
    inputPlaceholder: 'Ask ComusAI in any language (fares, food, history, room help)...',
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
    title: 'ComusAI — دليلك الشخصي في إسطنبول',
    statusBadge: 'متصل • مرشد محلي',
    suiteLabel: 'غرفة',
    resetBtn: 'إعادة تعيين',
    historyCleared: 'تم مسح سجل المحادثة.',
    offlineMsg: 'يرجى الاتصال بشبكة Wi-Fi الخاصة بالغرفة للدردشة مع ComusAI.',
    connInterrupted: 'انقطع الاتصال. يرجى التحقق من شبكة Wi-Fi.',
    verifiedActionBadge: 'إجراء فوري موثق',
    typingText: 'يقوم ComusAI بإعداد دليلك المحلي...',
    inputPlaceholder: 'اسأل ComusAI بأي لغة (أسعار التاكسي، المطاعم، التاريخ، خدمة الغرف)...',
    justNow: 'الآن',
    chips: [
      '🚕 كم تبلغ تكلفة التاكسي إلى السلطان أحمد؟',
      '🍳 إفطار تركي أصيل بالقرب من فندقي',
      '🕌 أوقات الزيارة وقواعد اللباس في المسجد الأزرق',
      '🚢 أفضل جولة بحرية عند الغروب بدون ازدحام',
      '🔧 الإبلاغ عن مشكلة في الغرفة / Wi-Fi'
    ],
    welcomeText: `أهلاً بك في إسطنبول! أنا **ComusAI**، مرشدك المحلي والكونسيرج الشخصي في إسطنبول — هنا لخدمتك كضيف عزيز ومُكرّم (*Tanrı Misafiri*).

• **إرشاد آمن وموثوق:** اسألني عن أسعار التاكسي العادلة، المواصلات العامة، أو كيفية تجنب فخاخ السياح في الفاتح، بيوغلو (غالاتا/كاراكوي/جيهانغير)، بشكطاش، وكاديكوي.
• **تجارب معتمدة:** اكتشف جولات البوسفور الخاصة عند الغروب، الجولات التاريخية السريعة، والحمامات التركية العثمانية الأصيلة.
• **عناية فورية بالغرفة:** اطلب صندوق إفطار إلى باب غرفتك، أو خدمة غسيل الملابس السريعة، أو أبلغ عن مشكلة في الغرفة/Wi-Fi خلال ثوانٍ.

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
    title: 'ComusAI — Ваш гид по Стамбулу',
    statusBadge: 'Онлайн • Местный гид',
    suiteLabel: 'Номер',
    resetBtn: 'Сброс',
    historyCleared: 'История чата очищена.',
    offlineMsg: 'Пожалуйста, подключитесь к Wi-Fi в номере для общения с ComusAI.',
    connInterrupted: 'Соединение прервано. Проверьте подключение к Wi-Fi.',
    verifiedActionBadge: 'Проверенное быстрое действие',
    typingText: 'ComusAI готовит ваш местный гид...',
    inputPlaceholder: 'Спросите ComusAI на любом языке (такси, еда, история, помощь в номере)...',
    justNow: 'Только что',
    chips: [
      '🚕 Сколько стоит такси до Султанахмета?',
      '🍳 Аутентичный завтрак рядом с отелем',
      '🕌 Дресс-код и часы посещения Голубой мечети',
      '🚢 Лучший круиз на закате без толп',
      '🔧 Сообщить о проблеме в номере / Wi-Fi'
    ],
    welcomeText: `Добро пожаловать в Стамбул! Я **ComusAI**, ваш локальный гид и консьерж в Стамбуле — здесь, чтобы окружить вас заботой как дорогого гостя (*Tanrı Misafiri*).

• **Защита от переплат:** Спрашивайте меня о честных тарифах такси, транспорте и о том, как избежать туристических ловушек в Фатихе, Бейоглу (Галата/Каракёй/Джихангир), Бешикташе и Кадыкёе.
• **Проверенные впечатления:** Приватные круизы по Босфору на закате, исторические маршруты без очередей и аутентичные хаммамы XVI века.
• **Забота в номере:** Закажите завтрак к двери номера, экспресс-прачечную или сообщите о проблеме с Wi-Fi за пару секунд.

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
    inputPlaceholder: 'Fragen Sie ComusAI in jeder Sprache (Taxis, Essen, Geschichte, Zimmerhilfe)...',
    justNow: 'Gerade eben',
    chips: [
      '🚕 Was kostet ein Taxi nach Sultanahmet?',
      '🍳 Authentisches Frühstück in der Nähe',
      '🕌 Kleiderordnung & Zeiten für die Blaue Moschee',
      '🚢 Beste Sonnenuntergangs-Bootstour ohne Massen',
      '🔧 Zimmer- / WLAN-Problem melden'
    ],
    welcomeText: `Willkommen in Istanbul! Ich bin **ComusAI**, Ihr lokaler Istanbul-Begleiter & Concierge — hier, um Sie als unseren Ehrengast (*Tanrı Misafiri*) zu betreuen.

• **Schutz vor Touristenfallen:** Fragen Sie mich nach fairen Taxipreisen, öffentlichen Verkehrsmitteln und Geheimtipps in Fatih, Beyoğlu (Galata/Karaköy/Cihangir), Beşiktaş und Kadıköy.
• **Geprüfte Erlebnisse:** Entdecken Sie private Bosporus-Sonnenuntergangsfahrten, historische Führungen ohne Anstehen und authentische Hamams aus dem 16. Jahrhundert.
• **Zimmer-Service:** Bestellen Sie eine Frühstücksbox an die Zimmertür, Express-Wäscheservice oder melden Sie ein WLAN-/Zimmerproblem in Sekunden.

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
    inputPlaceholder: 'Posez votre question à ComusAI (taxis, restaurants, histoire, service chambre)...',
    justNow: 'À l’instant',
    chips: [
      '🚕 Combien coûte un taxi pour Sultanahmet ?',
      '🍳 Petit-déjeuner authentique près de mon hôtel',
      '🕌 Code vestimentaire & horaires de la Mosquée Bleue',
      '🚢 Meilleure croisière au coucher du soleil sans foule',
      '🔧 Signaler un problème de chambre / Wi-Fi'
    ],
    welcomeText: `Bienvenue à Istanbul ! Je suis **ComusAI**, votre guide local et concierge dédié — ici pour vous accueillir comme notre invité d'honneur (*Tanrı Misafiri*).

• **Conseils Garantis Sans Arnaque :** Interrogez-moi sur les tarifs de taxi équitables, les transports ou les bonnes adresses à Fatih, Beyoğlu (Galata/Karaköy/Cihangir), Beşiktaş et Kadıköy.
• **Expériences Vérifiées :** Découvrez des croisières privées sur le Bosphore au coucher du soleil, des visites historiques coupe-file et des hammams ottomans du XVIe siècle.
• **Service en Chambre :** Commandez un coffret petit-déjeuner à votre porte, une blanchisserie express ou signalez un problème technique en quelques secondes.

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
          <strong key={i} className="font-semibold text-[#0B192C]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-0.5 py-0.5">
          <span className="text-[#D47A43] font-bold leading-snug select-none">•</span>
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
 * Glowing Indigo (#0B192C) & Terracotta (#D47A43) ComusAI Emblem
 */
export function ComusGlowingAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconDims = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`relative ${dims} shrink-0 flex items-center justify-center`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0B192C] via-[#1E3A5F] to-[#D47A43] opacity-80 blur-[3px] animate-pulse" />
      <div
        className={`relative ${dims} rounded-full bg-gradient-to-br from-[#0B192C] to-[#162B47] border border-[#D47A43]/70 flex items-center justify-center shadow-[0_0_14px_rgba(212,122,67,0.45)]`}
      >
        <Sparkles className={`${iconDims} text-[#D47A43]`} />
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B192C]"
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
      if (saved.length === 1 && (saved[0]?.id?.startsWith('init') || saved[0]?.id?.startsWith('comus-welcome'))) {
        return [{
          id: 'comus-welcome-1',
          sender: 'assistant',
          text: ui.welcomeText,
          time: ui.justNow
        }];
      }
      return saved;
    }
    return [{
      id: 'comus-welcome-1',
      sender: 'assistant',
      text: ui.welcomeText,
      time: ui.justNow
    }];
  });

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && (prev[0]?.id?.startsWith('init') || prev[0]?.id?.startsWith('comus-welcome'))) {
        return [{
          ...prev[0],
          text: ui.welcomeText,
          time: ui.justNow
        }];
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
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0B192C]/65 backdrop-blur-sm overflow-hidden overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg h-[100dvh] sm:h-[85vh] max-h-[100dvh] sm:max-h-[760px] bg-[#FBFBF9] rounded-none sm:rounded-3xl shadow-[0_24px_70px_rgba(11,25,44,0.45)] border-0 sm:border sm:border-slate-200/80 flex flex-col overflow-hidden overscroll-contain relative text-[#0B192C]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER */}
        <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5 bg-[#0B192C] text-white flex items-center justify-between gap-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ComusGlowingAvatar size="md" />
            <div className="min-w-0 flex-1">
              <h2 className="font-luxury-serif text-[16px] sm:text-[17px] font-bold tracking-tight text-white truncate">
                {ui.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10.5px] font-semibold text-emerald-300 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {ui.statusBadge}
                </span>
                <span className="text-[11px] text-slate-300 truncate hidden xs:inline">
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-[11px] font-semibold border border-white/15 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ui.resetBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close ComusAI"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. QUICK SUGGESTION CHIPS (Horizontal Scroll directly below header) */}
        <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
          {ui.chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#0B192C] hover:text-white text-[#1E293B] border border-slate-200/90 hover:border-[#0B192C] text-[11.5px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* OFFLINE DETECTOR BANNER */}
        {isOffline && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2 shrink-0">
            <WifiOff className="w-4 h-4 text-[#D47A43] shrink-0" />
            <span>{ui.offlineMsg}</span>
          </div>
        )}

        {/* 3. MESSAGE BUBBLES & INTERACTIVE ACTION CARDS */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FBFBF9] overscroll-contain">
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
                        ? 'bg-[#0B192C] text-white rounded-tr-xs'
                        : 'bg-[#F8FAFC] text-[#1E293B] border border-slate-200/90 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-white">
                        {cleanText}
                      </p>
                    ) : (
                      <div className="space-y-1 text-[#1E293B]">
                        {renderFormattedText(cleanText)}
                      </div>
                    )}

                    <div
                      className={`mt-1.5 text-[10px] flex items-center justify-end gap-1 ${
                        isUser ? 'text-slate-300' : 'text-[#64748B]'
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
                        className="w-full group rounded-2xl bg-gradient-to-r from-[#0B192C] to-[#152C4A] hover:from-[#122844] hover:to-[#1E3B63] text-white p-3.5 border border-[#D47A43]/50 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D47A43]">
                              {ui.verifiedActionBadge}
                            </span>
                            <ShieldCheck className="w-3.5 h-3.5 text-[#D47A43]" />
                          </div>
                          <p className="text-[13px] font-bold text-white mt-0.5 truncate">
                            {act.label}
                          </p>
                          <p className="text-[11px] text-slate-300 truncate mt-0.5">
                            {act.sublabel}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#D47A43] text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
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
              <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1" aria-label="ComusAI is typing">
                  <span
                    className="w-2 h-2 rounded-full bg-[#D47A43] animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#D47A43] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#D47A43] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-xs font-medium text-[#64748B]">
                  {ui.typingText}
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* INTERACTIVE IN-STAY / TRANSFER ACTION SUB-MODAL OVERLAY */}
        {activeActionModal && (
          <div className="absolute inset-0 z-30 bg-[#0B192C]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4 text-[#0B192C]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D47A43]">
                    Purely Istanbul · {ui.suiteLabel} {roomNumber}
                  </span>
                  <h3 className="font-luxury-serif text-base font-bold text-[#0B192C] mt-0.5">
                    {activeActionModal === 'breakfast' && ui.actions['service:breakfast'].label}
                    {activeActionModal === 'support' && ui.actions['service:support'].label}
                    {activeActionModal === 'transfer' && ui.actions['id:transfer'].label}
                    {activeActionModal === 'laundry' && ui.actions['service:laundry'].label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeActionModal === 'breakfast' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Select Artisanal Breakfast Box
                    </label>
                    <select
                      value={breakfastBoxType}
                      onChange={(e) => setBreakfastBoxType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-[#F8FAFC] text-[#0B192C] font-medium"
                    >
                      <option>Traditional Anatolian Serpme Box (For 2) — €28</option>
                      <option>Galata Artisan Simit, Ezine Cheese & Kaymak Box — €16</option>
                      <option>Healthy Mediterranean Avocado & Poached Eggs Box — €18</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Preferred Doorstep Delivery Time
                    </label>
                    <select
                      value={breakfastTime}
                      onChange={(e) => setBreakfastTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-[#F8FAFC] text-[#0B192C] font-medium"
                    >
                      <option>08:00 AM</option>
                      <option>08:30 AM</option>
                      <option>09:00 AM</option>
                      <option>09:30 AM</option>
                      <option>10:00 AM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dietary Preferences or Tea/Coffee Note
                    </label>
                    <input
                      type="text"
                      value={breakfastNotes}
                      onChange={(e) => setBreakfastNotes(e.target.value)}
                      placeholder="e.g., Fresh brewed Turkish tea, no nuts..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-[#F8FAFC] text-[#0B192C]"
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
                    className="w-full py-3 rounded-xl bg-[#D47A43] hover:bg-[#c06933] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
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
                    <label className="block font-semibold text-slate-700 mb-1">
                      Issue Category
                    </label>
                    <select
                      value={supportIssueType}
                      onChange={(e) => setSupportIssueType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-[#F8FAFC] text-[#0B192C] font-medium"
                    >
                      <option>Wi-Fi & Internet Connectivity</option>
                      <option>Air Conditioning / Heating Climate Control</option>
                      <option>Hot Water / Bathroom Plumbing</option>
                      <option>Fresh Towels / Housekeeping Refill</option>
                      <option>Smart Lock / Keycard Access</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Details for Property Manager
                    </label>
                    <textarea
                      rows={2}
                      value={supportNotes}
                      onChange={(e) => setSupportNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-[#F8FAFC] text-[#0B192C]"
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
                    className="w-full py-3 rounded-xl bg-[#0B192C] hover:bg-[#162d4c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D47A43]" />
                    <span>Dispatch Urgent Maintenance Ticket</span>
                  </button>
                </div>
              )}

              {activeActionModal === 'transfer' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D47A43] shrink-0" />
                    <span>
                      TÜRSAB Licensed VIP Mercedes-Benz Vito Fleet · 100% Fixed Local Rate (Zero Toll Tricks)
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Transfer Route & Fixed Rate
                    </label>
                    <select
                      value={transferAirport}
                      onChange={(e) => setTransferAirport(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-[#F8FAFC] text-[#0B192C] font-medium"
                    >
                      <option>Istanbul Airport (IST) — €65 Fixed Rate (Up to 6 Guests)</option>
                      <option>Sabiha Gökçen Airport (SAW) — €70 Fixed Rate (Up to 6 Guests)</option>
                      <option>Private Half-Day City Chauffeur (4 Hours) — €140 Fixed Rate</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Pickup Date & Time
                      </label>
                      <input
                        type="text"
                        value={transferPickupTime}
                        onChange={(e) => setTransferPickupTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-[#F8FAFC] text-[#0B192C]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Flight Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={transferFlightNo}
                        onChange={(e) => setTransferFlightNo(e.target.value)}
                        placeholder="e.g. TK1984 / BA676"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-[#F8FAFC] text-[#0B192C]"
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
                    className="w-full py-3 rounded-xl bg-[#D47A43] hover:bg-[#c06933] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reserve Licensed VIP Chauffeur</span>
                  </button>
                </div>
              )}

              {activeActionModal === 'laundry' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Garment Care Package
                    </label>
                    <select
                      value={laundryPackage}
                      onChange={(e) => setLaundryPackage(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-[#F8FAFC] text-[#0B192C] font-medium"
                    >
                      <option>Express Wash, Fold & Steam Press (24h) — €25 / Bag</option>
                      <option>Same-Day Evening Suit & Dress Dry Cleaning — €35</option>
                      <option>Express 2-Hour Steam Pressing Only — €15</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Suite Doorstep Pickup Window
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D47A43]" />
                      <input
                        type="text"
                        value={laundryPickupTime}
                        onChange={(e) => setLaundryPickupTime(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 bg-[#F8FAFC] text-[#0B192C]"
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
                    className="w-full py-3 rounded-xl bg-[#0B192C] hover:bg-[#162d4c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D47A43]" />
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
          className="p-3 pb-[max(0.75rem,calc(0.75rem+env(safe-area-inset-bottom)))] bg-white border-t border-slate-200/90 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.inputPlaceholder}
            className="flex-1 text-[13px] px-4 py-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D47A43]/50 focus:border-[#D47A43] text-[#0B192C] placeholder:text-[#64748B] transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            aria-label="Send message to ComusAI"
            className="p-3 rounded-2xl bg-[#0B192C] hover:bg-[#162B47] text-white transition shadow-sm disabled:opacity-40 cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-[#D47A43]" />
          </button>
        </form>
      </div>
    </div>
  );
}

export { AiChatDrawer as ComusAiConcierge };
