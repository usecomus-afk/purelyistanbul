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

  // 1-3. Tesise özel bilgiler (Wi-Fi, kahvaltı, giriş/çıkış saatleri)
  // Bu bilgiler her tesiste farklıdır ve burada doğrulanmış veri yoktur; sabit saat/şifre UYDURMAK yerine
  // misafiri dürüstçe resepsiyona yönlendiririz.
  const isWifi = norm.includes('wifi') || norm.includes('wi-fi') || norm.includes('internet') || norm.includes('sifre') || norm.includes('şifre') || norm.includes('password');
  const isBreakfast = norm.includes('kahvalti') || norm.includes('kahvaltı') || norm.includes('breakfast') || norm.includes('frühstück') || norm.includes('petit dejeuner') || norm.includes('فطور') || norm.includes('завтрак');
  const isCheckout = norm.includes('cikis') || norm.includes('çıkış') || norm.includes('checkout') || norm.includes('check out') || norm.includes('gec cikis') || norm.includes('geç çıkış') || norm.includes('выезд') || norm.includes('مغادرة');
  if (isWifi || isBreakfast || isCheckout) {
    const topicTr = isWifi ? 'Wi-Fi bilgileri' : isBreakfast ? 'kahvaltı saatleri' : 'giriş/çıkış saatleri';
    const topicEn = isWifi ? 'Wi-Fi details' : isBreakfast ? 'breakfast hours' : 'check-in/check-out times';
    const place = hotelName || '';
    const replies: Record<string, string> = {
      tr: `${place ? `${place} için ` : ''}${topicTr} konusunda elimde doğrulanmış bir bilgi yok; yanlış bilgi vermemek için tahmin yürütmüyorum. En doğru bilgiyi resepsiyon verecektir. Bir talebiniz varsa "Oda İçi Hizmetler" menüsünden de iletebilirsiniz.`,
      en: `I don't have verified ${topicEn}${place ? ` for ${place}` : ''}, and I'd rather not guess. Reception will give you the accurate information. You can also send a request via the in-room services menu.`,
      ar: `لا تتوفر لدي معلومات مؤكدة حول هذا الموضوع${place ? ` في ${place}` : ''}، ولا أريد التخمين. سيزودك مكتب الاستقبال بالمعلومات الدقيقة.`,
      ru: `У меня нет проверенной информации по этому вопросу${place ? ` для ${place}` : ''}, и я не хочу гадать. Точную информацию вам даст стойка регистрации.`,
      de: `Dazu habe ich${place ? ` für ${place}` : ''} keine verifizierten Informationen und möchte nicht raten. Die Rezeption gibt Ihnen gerne die genaue Auskunft.`,
      fr: `Je n'ai pas d'information vérifiée à ce sujet${place ? ` pour ${place}` : ''} et je préfère ne pas deviner. La réception vous donnera l'information exacte.`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: []
    };
  }

  // 4. Istanbulkart / Transit Pass Questions
  if (norm.includes('istanbulkart') || norm.includes('istanbul kart') || norm.includes('metro kart') || norm.includes('akbil') || norm.includes('toplu tasima')) {
    const replies: Record<string, string> = {
      tr: `İstanbulkart; metro, tramvay, Marmaray, metrobüs ve şehir hatları vapurlarında kullanılan toplu taşıma kartıdır. Kartı istasyonlardaki bilet makinelerinden alıp yükleyebilirsiniz. Güncel ücretleri makinede veya resmi İstanbulkart kaynaklarında kontrol edin; "yardım" bahanesiyle yaklaşan kişilere kart ya da para vermeyin.`,
      en: `Istanbulkart is the public transit card used on metro, tram, Marmaray, metrobus and city ferries. You can buy and top it up at ticket machines in stations. Check current fares at the machine or on official Istanbulkart sources, and never hand your card or cash to strangers offering "help".`,
      ar: `بطاقة إسطنبول كارت صالحة في خطوط المترو والترام والسفن. يمكنك شراؤها وشحنها من أجهزة التذاكر في المحطات. تحقق من الأسعار الحالية على الجهاز.`,
      ru: `Istanbulkart действует на всех линиях метро, трамваев и паромов. Купить карту можно в автоматах Biletmatik на станциях.`,
      de: `Die Istanbulkart gilt für alle U-Bahnen, Straßenbahnen und Fähren. Erhältlich an den gelben Automaten aller Stationen.`,
      fr: `L'Istanbulkart est valable sur tous les métros, tramways et ferries. Achat possible aux bornes de chaque station.`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: []
    };
  }

  // 5. Tourist Rights / Fraud / Complaint Desk
  if (norm.includes('sikayet') || norm.includes('şikayet') || norm.includes('dolandirildim') || norm.includes('dolandırıldım') || norm.includes('fazla para') || norm.includes('hakem masasi') || norm.includes('hakem masası') || norm.includes('complaint') || norm.includes('scam') || norm.includes('ombudsman')) {
    const replies: Record<string, string> = {
      tr: `Bunu yaşadığınız için üzgünüm. Uygulamadaki "Hakem Masası" sayfasından yaşadığınız sorunu fiş/fatura veya fotoğrafla birlikte iletebilirsiniz. Acil bir durum varsa 112'yi arayın; turist olarak yaşadığınız sorunlarda Turizm Polisi'ne de başvurabilirsiniz.`,
      en: `I'm sorry this happened. You can report it with a receipt or photo through the "Complaint Desk" page in the app. In an emergency call 112; you can also contact the Tourism Police.`,
      ar: `نأسف لما حدث. يمكنك تقديم شكوى مع الإيصال أو صورة عبر صفحة "مكتب الشكاوى" في التطبيق. في حالات الطوارئ اتصل بالرقم 112، ويمكنك أيضاً التواصل مع شرطة السياحة.`,
      ru: `Сожалеем о случившемся. Вы можете подать жалобу с чеком или фото через раздел «Жалобы» в приложении. В экстренной ситуации звоните 112; также можно обратиться в туристическую полицию.`,
      de: `Das tut mir leid. Sie können den Vorfall mit Beleg oder Foto über die Seite „Beschwerdestelle" in der App melden. Im Notfall wählen Sie 112; außerdem können Sie sich an die Touristenpolizei wenden.`,
      fr: `Désolé pour cette situation. Vous pouvez la signaler avec un reçu ou une photo via la page « Réclamations » de l'application. En cas d'urgence, appelez le 112 ; vous pouvez aussi contacter la police touristique.`
    };
    return {
      reply: replies[language] || replies.en,
      recommendations: []
    };
  }

  return null;
}
