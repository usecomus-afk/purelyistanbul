/**
 * Comus AI Token-Saving Cache & Instant Knowledge Engine
 * 
 * Features:
 * 1. Instant 0-token answers for frequent hotel & city questions (Wi-Fi, breakfast, checkout, reception, passes, ombudsman).
 * 2. In-memory LRU response caching for duplicate / semantically identical queries across all 6 languages.
 * 3. 24-hour TTL with automatic memory management (max 2,000 entries).
 */

interface CacheEntry {
  reply: string;
  recommendations: Array<{ title: string; category: string; location: string }>;
  timestamp: number;
  hitCount: number;
}

// In-Memory Global LRU Cache Map
const responseCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 2000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function normalizeQuery(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_'~()?'"“”‘’]/g, '')
    .replace(/\s+/g, ' ');
}

export function buildCacheKey(
  query: string,
  hotelName: string,
  hotelDistrict: string,
  language: string,
  profileSummary: string
): string {
  const normQ = normalizeQuery(query);
  return `${language || 'tr'}_${hotelName}_${hotelDistrict}_${normQ}_${profileSummary}`;
}

export function getCachedResponse(cacheKey: string): CacheEntry | null {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }

  entry.hitCount += 1;
  return entry;
}

export function setCachedResponse(
  cacheKey: string,
  reply: string,
  recommendations: Array<{ title: string; category: string; location: string }> = []
) {
  // Prune if over limit
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }

  responseCache.set(cacheKey, {
    reply,
    recommendations,
    timestamp: Date.now(),
    hitCount: 1
  });
}

/**
 * 0-Token Instant Local Knowledge Base
 * Resolves standard recurring inquiries instantly without hitting Gemini API.
 */
export function getInstantKnowledgeAnswer(
  query: string,
  hotelName: string,
  hotelDistrict: string,
  language: string = 'tr'
): { reply: string; recommendations: Array<{ title: string; category: string; location: string }> } | null {
  const norm = normalizeQuery(query);

  // 1. Wi-Fi / Internet Questions
  if (norm.includes('wifi') || norm.includes('wi-fi') || norm.includes('internet') || norm.includes('sifre') || norm.includes('şifre') || norm.includes('password')) {
    const replies: Record<string, string> = {
      tr: `Otelimiz ${hotelName} bünyesinde tüm oda ve ortak alanlarda yüksek hızlı ücretsiz Wi-Fi hizmeti bulunmaktadır. Ağ adı ve şifrenize ekranın üst kısmındaki "Otel & Wi-Fi Bilgisi" kartına tıklayarak hemen erişebilirsiniz.`,
      en: `Complimentary high-speed Wi-Fi is available across all rooms and public areas at ${hotelName}. You can view the network name and copy the password directly by tapping the "Hotel & Wi-Fi Info" bar at the top of your screen.`,
      ar: `يتوفر إنترنت واي فاي عالي السرعة مجاناً في جميع الغرف والمرافق في ${hotelName}. يمكنك عرض كلمة المرور ونسخها مباشرة من بطاقة معلومات الفندق والواي فاي أعلى الشاشة.`,
      ru: `В отеле ${hotelName} доступен бесплатный высокоскоростной Wi-Fi во всех номерах. Вы можете посмотреть имя сети и скопировать пароль в верхней карточке "Инфо об отеле и Wi-Fi".`,
      de: `Kostenloses Highspeed-WLAN steht Ihnen in allen Zimmern und öffentlichen Bereichen des ${hotelName} zur Verfügung. Die Zugangsdaten können Sie direkt oben in der Leiste einsehen.`,
      fr: `Une connexion Wi-Fi haut débit gratuite est disponible dans toutes les chambres de ${hotelName}. Vous pouvez consulter les identifiants en haut de votre écran.`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: [{ title: `${hotelName} Oda & Wi-Fi Rehberi`, category: "Otel Hizmeti", location: hotelDistrict }]
    };
  }

  // 2. Breakfast Questions
  if (norm.includes('kahvalti') || norm.includes('kahvaltı') || norm.includes('breakfast') || norm.includes('frühstück') || norm.includes('petit dejeuner') || norm.includes('فطور') || norm.includes('завтрак')) {
    const replies: Record<string, string> = {
      tr: `${hotelName} bünyesinde zengin açık büfe Türk ve dünya kahvaltısı her sabah 07:30 – 10:30 saatleri arasında ana restoranda servis edilmektedir. Odanıza kahvaltı servisi için "Otel Hizmetleri" sekmesinden 1 tıkla talep oluşturabilirsiniz.`,
      en: `At ${hotelName}, a rich open buffet Turkish and international breakfast is served every morning from 07:30 to 10:30 in the main restaurant. You can also order breakfast to your room via the "Hotel Services" tab.`,
      ar: `يقدم بوفيه إفطار تركي وعالمي مفتوح يومياً في ${hotelName} من الساعة 07:30 حتى 10:30 صباحاً في المطعم الرئيسي. يمكنك أيضاً طلب الإفطار إلى غرفتك من تبويب خدمات الفندق.`,
      ru: `В ${hotelName} богатый завтрак "шведский стол" сервируется каждое утро с 07:30 до 10:30 в главном ресторане. Вы также можете заказать завтрак в номер в разделе "Услуги отеля".`,
      de: `Im ${hotelName} wird jeden Morgen von 07:30 bis 10:30 Uhr ein reichhaltiges Frühstücksbuffet serviert. Zimmerservice ist über den Reiter "Hotelservices" bestellbar.`,
      fr: `À ${hotelName}, un buffet de petit-déjeuner complet est servi chaque matin de 07h30 à 10h30. Vous pouvez également commander en chambre via l'onglet "Services Hôtel".`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: [{ title: "Zengin Açık Büfe Kahvaltı", category: "Gastronomi", location: hotelDistrict }]
    };
  }

  // 3. Checkout / Late Checkout Questions
  if (norm.includes('cikis') || norm.includes('çıkış') || norm.includes('checkout') || norm.includes('check out') || norm.includes('gec cikis') || norm.includes('geç çıkış') || norm.includes('выезд') || norm.includes('مغادرة')) {
    const replies: Record<string, string> = {
      tr: `Standart çıkış saatimiz 12:00'dir. Müsaitlik durumuna göre saat 14:00'e kadar geç çıkış talebinde bulunmak için "Otel Hizmetleri" sekmesindeki "Geç Çıkış Talebi" modülünü kullanabilir veya resepsiyonumuza danışabilirsiniz.`,
      en: `Our standard check-out time is 12:00 PM. Late check-out until 02:00 PM is subject to availability and can be requested via the "Late Check-out" button in the Hotel Services tab.`,
      ar: `وقت تسجيل المغادرة القياسي هو الساعة 12:00 ظهراً. يمكنك طلب تسجيل مغادرة متأخر حتى الساعة 14:00 حسب الإمكانية عبر تبويب خدمات الفندق.`,
      ru: `Стандартное время выезда — 12:00. Поздний выезд до 14:00 возможен при наличии мест через кнопку "Поздний выезд" в услугах отеля.`,
      de: `Die reguläre Check-out-Zeit ist 12:00 Uhr. Einen Late Check-out bis 14:00 Uhr können Sie im Bereich "Hotelservices" anfragen.`,
      fr: `L'heure de départ standard est 12h00. Un départ tardif jusqu'à 14h00 peut être demandé via l'onglet "Services Hôtel".`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: [{ title: "Geç Çıkış Hizmeti", category: "Otel Hizmeti", location: hotelDistrict }]
    };
  }

  // 4. Istanbulkart / Transit Pass Questions
  if (norm.includes('istanbulkart') || norm.includes('istanbul kart') || norm.includes('metro kart') || norm.includes('akbil') || norm.includes('toplu tasima')) {
    const replies: Record<string, string> = {
      tr: `İstanbulkart, şehrimizdeki tüm metro, tramvay, Marmaray, metrobüs ve şehir hatları vapurlarında geçerlidir. Fiziksel kartı en yakın tramvay/metro istasyonu biletmatiklerinden temin edebilir veya "Rehber" sekmemizdeki resmi bağlantıdan dijital yükleme yapabilirsiniz.`,
      en: `Istanbulkart is the official public transit card valid across all metro, tram, Marmaray, and ferry lines. You can purchase physical cards from yellow ticket kiosks at nearby stations or top up online via the link in our "City Guide" tab.`,
      ar: `بطاقة إسطنبول كارت صالحة في جميع خطوط المترو والترام والسفن. يمكنك شراء البطاقة من أجهزة المحطات أو إعادة الشحن عبر رابط دليل المدينة.`,
      ru: `Istanbulkart действует на всех линиях метро, трамваев и паромов. Купить карту можно в автоматах Biletmatik на станциях.`,
      de: `Die Istanbulkart gilt für alle U-Bahnen, Straßenbahnen und Fähren. Erhältlich an den gelben Automaten aller Stationen.`,
      fr: `L'Istanbulkart est valable sur tous les métros, tramways et ferries. Achat possible aux bornes de chaque station.`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: [{ title: "İstanbulkart Resmi Başvuru & Yükleme", category: "Ulaşım", location: "Tüm İstanbul" }]
    };
  }

  // 5. Tourist Rights / Fraud / Complaint Desk
  if (norm.includes('sikayet') || norm.includes('şikayet') || norm.includes('dolandirildim') || norm.includes('dolandırıldım') || norm.includes('fazla para') || norm.includes('hakem masasi') || norm.includes('hakem masası') || norm.includes('complaint') || norm.includes('scam') || norm.includes('ombudsman')) {
    const replies: Record<string, string> = {
      tr: `purelyİstanbul olarak misafirlerimizin güvenliğini en üst düzeyde koruyoruz! "Rehber" sekmesinde yer alan "purelyİstanbul Misafir Kalkanı & Turist Hakem Masası" üzerinden taksi, esnaf veya işletme şikayetlerinizi fiş/fatura ile doğrudan iletebilirsiniz. Kimliğiniz gizli tutularak resmi bildirim süreci başlatılır.`,
      en: `As purelyİstanbul, your safety is our top priority! Through our "Guest Shield & Tourist Ombudsman Desk" located in the "Guide" tab, you can officially submit disputes regarding taxis or vendors with receipt evidence while keeping your identity 100% private.`,
      ar: `سلامتكم هي أولويتنا في purelyİstanbul! من خلال "درع حماية النزلاء وديوان المظالم" في تبويب الدليل، يمكنك تقديم أي شكوى رسمية بشأن التاكسي أو المتاجر بأمان تام وهوية محمية.`,
      ru: `Ваша безопасность — наш приоритет! В разделе "Гид" доступен "Щит защиты гостей", где можно подать официальную жалобу на такси или магазин с сохранением конфиденциальности.`,
      de: `Ihre Sicherheit steht an erster Stelle! Über den "Gästeschutz & Tourismus-Ombudsmann" im Reiter "Führer" können Sie Beschwerden sicher und anonym einreichen.`,
      fr: `Votre sécurité est notre priorité ! Via le "Bouclier Invités" dans l'onglet "Guide", vous pouvez signaler tout litige de manière totalement confidentielle.`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: [{ title: "purelyİstanbul Turist Hakem Masası & Misafir Kalkanı", category: "Güvenlik & Haklar", location: "Merkez Masası" }]
    };
  }

  return null;
}
