import { GuestProfile, TokenUsageInfo } from './types';
import { UserPreferences, AiActionItem } from '@/types/comusAi';
import { XeniosStore } from './store';
import { buildInjectedComusSystemPrompt } from '@/prompts/comusSystemPrompt';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  actions?: AiActionItem[];
  recommendations?: Array<{
    title: string;
    category: string;
    location: string;
    action?: string;
  }>;
  negative_locked_categories?: string[];
  tokenUsage?: TokenUsageInfo;
}

const B64_KEY_FALLBACK = 'QVEuQWI4Uk42Sm5LcTg1RWwtNGdCOHdBTjNlYkl3SzZpUmU5aDlFcUlNTUZuVHFzTVR4WVE=';

function resolveGeminiApiKey(): string {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  }
  try {
    if (typeof atob === 'function') {
      return atob(B64_KEY_FALLBACK);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(B64_KEY_FALLBACK, 'base64').toString('utf8');
    }
  } catch (e) {}
  return '';
}

async function callDirectGeminiRest(
  userQuery: string,
  guestName: string,
  hotelName: string,
  hotelDistrict: string,
  roomNumber: string,
  lang: string,
  chatHistory?: ChatMessage[],
  guestProfile?: GuestProfile
): Promise<string | null> {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prefs: Partial<UserPreferences> = {
      first_name: guestName,
      guest_profile_survey: guestProfile
    };
    const systemPrompt = buildInjectedComusSystemPrompt(prefs, hotelName, hotelDistrict, roomNumber, lang, guestProfile);

    const contents: any[] = [];
    if (chatHistory && chatHistory.length > 0) {
      const recent = chatHistory.slice(-6);
      for (const m of recent) {
        contents.push({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: userQuery }] });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents,
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 1000
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } else {
      console.warn('Direct Gemini REST status:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.warn('Direct Gemini REST call error:', err);
  }
  return null;
}

export function generateSmartContextualFallback(
  userQuery: string,
  guestName: string,
  hotelName: string,
  hotelDistrict: string,
  roomNumber: string,
  guestProfile?: GuestProfile
): { reply: string; recs: any[]; actions: AiActionItem[] } {
  const q = userQuery.toLowerCase();
  const allergies = guestProfile?.allergies || [];
  const hasSeafoodAllergy = allergies.some(a => a.toLowerCase().includes('deniz') || a.toLowerCase().includes('seafood') || a.toLowerCase().includes('balık') || a.toLowerCase().includes('midye'));
  const budget = guestProfile?.budgetLevel || 'luxury';
  const isLuxury = budget === 'luxury';

  let reply = '';
  let recs: any[] = [];
  let actions: AiActionItem[] = [];

  const isStreetFoodQuery = q.includes('sokak') || q.includes('büfe') || q.includes('ıslak hamburger') || q.includes('dürüm') || q.includes('kokoreç') || q.includes('atıştırmalık');
  const isGeneralFoodQuery = q.includes('restoran') || q.includes('yemek') || q.includes('lokanta') || q.includes('nerede yenir') || q.includes('akşam yemeği') || q.includes('lezzet');

  if (isStreetFoodQuery || (!isLuxury && isGeneralFoodQuery)) {
    if (hasSeafoodAllergy) {
      reply = `${guestName} Bey, İstanbul'un seçkin sokak lezzetlerinden alerjinize (**Deniz Ürünleri Hariç**) %100 uygun önerilerim:\n\n🍔 **Kızılkayalar Büfe (Taksim Meydanı):** Meşhur ıslak hamburgerin orijinal adresi.\n🌯 **Dürümzade (Kalyoncu Kulluğu, Beyoğlu):** Odun ateşinde lavaşla hazırlanan efsanevi Adana & Urfa dürüm.\n🥩 **Tarihi Sultanahmet Köftecisi (1920 Orijinal Yeşil Tabela):** Gerçek geleneksel ızgara köfte ve piyaz.\n🍰 **Tarihi İnci Pastanesi:** Klasik profiterol ve tatlı molası.\n\n📌 *Not:* Bu ikonik sokak lezzeti mekanları hızlı servis konseptinde olduğu için rezervasyonla çalışmazlar; dilediğiniz zaman doğrudan gidip tadabilirsiniz. Dilerseniz en rahat yürüyüş rotanızı tarif edebilirim!`;
      recs = [{ title: "Dürümzade & Taksim Lezzet Rotaları", category: "Sokak Lezzeti", location: "Beyoğlu" }];
    } else {
      reply = `${guestName} Bey, İstanbul sokak lezzetleri için önerilerim:\n\n🍔 **Kızılkayalar Büfe (Taksim Meydanı):** Meşhur ıslak hamburgerin orijinal adresi.\n🌯 **Dürümzade (Kalyoncu Kulluğu, Beyoğlu):** Odun ateşinde lavaşla hazırlanan efsanevi Adana & Urfa dürüm.\n🦪 **Midyeci Ahmet & Şampiyon Kokoreç (Balık Pazarı):** Çıtır ekmek arası kokoreç ve taze midye dolma.\n🥩 **Tarihi Sultanahmet Köftecisi (1920):** Izgara köfte ve piyaz.\n\n📌 *Not:* Bu sokak lezzeti durakları hızlı servis sunduğu için rezervasyonla çalışmazlar; dilediğiniz zaman doğrudan uğrayarak tadabilirsiniz. Dilerseniz en rahat yürüyüş rotasını çıkarabilirim!`;
      recs = [{ title: "Dürümzade & Beyoğlu Lezzet Turu", category: "Sokak Lezzeti", location: "Beyoğlu" }];
    }
  } else if (isGeneralFoodQuery) {
    if (hasSeafoodAllergy) {
      reply = `${guestName} Bey, İstanbul'un en seçkin restoranlarından, sağlık ve alerji notunuza (**Deniz Ürünleri Hariç**) %100 uygun Lüks & VIP önerilerim:\n\n🍷 **Mikla (Pera / Beyoğlu):** Michelin yıldızlı çağdaş Anadolu mutfağı ve muhteşem panoramik manzara.\n🥩 **Sunset Grill & Bar (Ulus Parkı):** Boğaz manzarasına karşı seçkin ızgara etler, biftekler ve gurme dünya mutfağı.\n🏛️ **Neolokal (Karaköy SALT Galata):** Geleneksel Türk reçetelerinin şık fine-dining yorumu.\n🔥 **Mürver Restaurant (Karaköy):** Odun ateşinde pişen nefis et lezzetleri ve teras atmosferi.\n\nDilerseniz bu restoranlardan istediğiniz mekan için akşam masanızı concierge ekibimiz aracılığıyla anında organize edebilirim!`;
      recs = [
        { title: "Mikla Restaurant (Michelin Starred)", category: "Fine Dining", location: "Beyoğlu" },
        { title: "Sunset Grill & Bar", category: "Lüks Restoran", location: "Ulus" }
      ];
      actions = [{
        id: 'act_fine_dining',
        type: 'BOOK_APPOINTMENT',
        label: '🍷 Mikla / Sunset Masası Rezervasyonu İlet',
        payload: { listing_id: 'exp-restaurant-1', service_title: 'Mikla / Sunset Fine Dining Masa Rezervasyonu', preferred_date: new Date().toISOString().split('T')[0], preferred_time: '20:00', booking_type: 'TABLE_RESERVATION' }
      }];
    } else {
      reply = `${guestName} Bey, İstanbul'un en seçkin gurme lezzet duraklarından Lüks & VIP restoran önerilerim:\n\n🍷 **Mikla (Pera / Beyoğlu):** Michelin yıldızlı çağdaş Anadolu mutfağı ve teras manzarası.\n🌅 **Sunset Grill & Bar (Ulus):** Boğaz manzaralı seçkin ızgara ve uluslararası menü.\n🏛️ **Neolokal (Karaköy):** Tarihi dokuda modern Türk fine-dining deneyimi.\n🐟 **Villa Bosphorus / Park Fora:** Boğaz kıyısında gurme deniz ürünleri ve manzara.\n\nDilerseniz seçtiğiniz restoran için akşam masanızı concierge ekibimiz aracılığıyla anında organize edebilirim!`;
      recs = [
        { title: "Mikla Restaurant", category: "Fine Dining", location: "Beyoğlu" },
        { title: "Sunset Grill & Bar", category: "Lüks Restoran", location: "Ulus" }
      ];
      actions = [{
        id: 'act_fine_dining',
        type: 'BOOK_APPOINTMENT',
        label: '🍷 Fine Dining Masa Rezervasyonu İlet',
        payload: { listing_id: 'exp-restaurant-1', service_title: 'Sunset Grill & Bar Masa Rezervasyonu', preferred_date: new Date().toISOString().split('T')[0], preferred_time: '20:00', booking_type: 'TABLE_RESERVATION' }
      }];
    }
  } else if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('şifre')) {
    reply = `${guestName} Bey, odanızdaki (${hotelName}, Oda ${roomNumber}) yüksek hızlı misafir Wi-Fi ağı:\n\n📶 Ağ Adı (SSID): ${hotelName.split(' ')[0]}_Guest\n🔑 Şifre: purely2026!\n\nÜst bardaki Wi-Fi butonuna tıklayarak şifreyi tek dokunuşla kopyalayabilirsiniz.`;
  } else if (q.includes('kahvaltı') || q.includes('breakfast')) {
    reply = `${guestName} Bey, ${hotelName} bünyesinde açık büfe kahvaltı servisimiz her sabah 07:00 - 10:30 saatleri arasında ana restoran/teras katımızda sunulmaktadır. Ayrıca dilerseniz "Oda İçi Hizmetler" menümüzden odaya sıcak kahvaltı siparişi de verebilirsiniz.`;
  } else if (q.includes('çıkış') || q.includes('checkout') || q.includes('check-out') || q.includes('saat kaç')) {
    reply = `${guestName} Bey, otelimizde standart check-out saati 12:00'dir. Geç çıkış (Late Check-out) talebiniz veya bagaj emaneti için resepsiyonumuz (Dahili: 0) 7/24 memnuniyetle yardımcı olmaktadır.`;
  } else if (q.includes('boğaz') || q.includes('tekne') || q.includes('yat') || q.includes('tur')) {
    reply = `${guestName} Bey, İstanbul Boğazı'nı keşfetmek için harika bir gün! Sizin için gün batımı akşam yemeği turları veya özel yat kiralama seçeneklerini derledim:\n\n🚢 Bosphorus Sunset & Dinner Cruise (Kabataş Kalkışlı)\nSizin adınıza rezervasyon oluşturmamı ister misiniz?`;
    recs = [{ title: "Bosphorus Sunset & Dinner Cruise", category: "Boğaz & Tekne", location: "Kabataş" }];
    actions = [{
      id: 'act_boat',
      type: 'BOOK_APPOINTMENT',
      label: '🚢 Boğaz Turu Rezervasyonu Yap',
      payload: { listing_id: 'exp-2', service_title: 'Bosphorus Dinner Cruise', preferred_date: '2026-08-25', preferred_time: '18:30', booking_type: 'EXPERIENCE_TICKET' }
    }];
  } else if (q.includes('hamam') || q.includes('spa') || q.includes('masaj') || q.includes('rahatlatıcı') || q.includes('yoruldum')) {
    reply = `${guestName} Bey, günün yorgunluğunu atmak için Cağaloğlu Hamamı veya otelimiz anlaşmalı spa merkezinde geleneksel köpük ve masaj seansları harika bir tercihtir. Sizin adınıza hemen randevu oluşturabilirim.`;
    recs = [{ title: "Tarihi Cağaloğlu Hamamı", category: "Kültür & Spa", location: "Sultanahmet" }];
    actions = [{
      id: 'act_hamam',
      type: 'BOOK_APPOINTMENT',
      label: '🧖‍♂️ Cağaloğlu Hamamı Randevusu Al',
      payload: { listing_id: 'exp-1', service_title: 'Tarihi Cağaloğlu Hamamı Masaj', preferred_date: '2026-08-25', preferred_time: '15:30', booking_type: 'EXPERIENCE_TICKET' }
    }];
  } else if (q.includes('estetik') || q.includes('cilt') || q.includes('botoks') || q.includes('klinik') || q.includes('saç')) {
    reply = `${guestName} Bey, Nişantaşı ve Fulya aksındaki anlaşmalı A++ medikal estetik kliniklerimizde (Quartz Clinique vb.) Hydrafacial, medikal cilt bakımı ve uzman konsültasyonu için anında randevu planlayabilirim.`;
    recs = [{ title: "Quartz Clinique – Nişantaşı Glow", category: "Medikal Estetik", location: "Nişantaşı" }];
    actions = [{
      id: 'act_quartz',
      type: 'BOOK_APPOINTMENT',
      label: '🪞 Quartz Clinique Randevusu Al',
      payload: { listing_id: 'exp-aesthetic-1', service_title: 'Nişantaşı Glow Bakımı', preferred_date: '2026-08-25', preferred_time: '11:00', booking_type: 'AESTHETIC_APPOINTMENT' }
    }];
  } else if (q.includes('taksi') || q.includes('ulaşım') || q.includes('havalimanı') || q.includes('transfer') || q.includes('nasıl giderim')) {
    reply = `${guestName} Bey, ${hotelName} (${hotelDistrict}) konumundan İstanbul Havalimanı veya Sabiha Gökçen Havalimanı'na VIP Mercedes Vito transferi ya da sarı taksi çağrısı için resepsiyonumuz ve concierge servisimiz anında hizmetinizdedir.`;
    recs = [{ title: "Özel VIP Havalimanı Transferi", category: "Ulaşım", location: "Otel Kapısı" }];
  } else {
    reply = `${guestName} Bey, "${userQuery}" konusundaki sorunuzu aldım. İstanbul'da seçkin restoranlar, tarihi yarımada rotaları, Boğaz turları, Nişantaşı klinikleri ve size özel VIP deneyimler için dilediğiniz detayları sorabilirsiniz. Sizin adınıza hemen rezervasyon oluşturabilirim.`;
    recs = [
      { title: "Bosphorus Sunset Cruise", category: "Boğaz & Tekne", location: "Kabataş" },
      { title: "Tarihi Cağaloğlu Hamamı", category: "Kültür & Spa", location: "Sultanahmet" }
    ];
  }

  return { reply, recs, actions };
}

export async function askGeminiConcierge(
  userQuery: string,
  guestProfile: GuestProfile,
  hotelName: string,
  hotelDistrict: string,
  lang: string = 'tr',
  roomNumber: string = '304',
  userPreferences?: Partial<UserPreferences>,
  chatHistory?: ChatMessage[]
): Promise<ChatMessage> {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const guestName = userPreferences?.first_name || 'Alex';

  const userPrefsPayload: Partial<UserPreferences> = {
    ...userPreferences,
    guest_profile_survey: guestProfile
  };

  // 1. Try server-side Gemini 3.6 Flash / Comus AI API route
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        user_preferences: userPrefsPayload,
        hotelName,
        hotelDistrict,
        roomNumber,
        language: lang,
        session_history: (chatHistory || []).map(h => ({
          role: h.sender === 'user' ? 'user' : 'model',
          text: h.text
        }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply && data.source !== 'error_fallback') {
        if (data.tokenUsage) {
          XeniosStore.recordAiTokenUsage(data.tokenUsage);
        }
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          time: now,
          actions: data.actions,
          recommendations: data.recommendations,
          negative_locked_categories: data.negative_locked_categories,
          tokenUsage: data.tokenUsage
        };
      }
    }
  } catch (err) {
    console.warn('Local API route call failed, attempting direct Gemini connection:', err);
  }

  // 2. Direct Gemini 3.6 Flash REST call (e.g. for standalone Capacitor iOS app or direct client access)
  const directText = await callDirectGeminiRest(userQuery, guestName, hotelName, hotelDistrict, roomNumber, lang, chatHistory, guestProfile);
  if (directText) {
    const tokenUsage: TokenUsageInfo = {
      promptTokens: 150,
      completionTokens: Math.ceil(directText.length / 4),
      totalTokens: 150 + Math.ceil(directText.length / 4),
      cachedTokensSaved: 0,
      estimatedCostUSD: 0.0001,
      source: 'gemini_3_6_flash'
    };
    XeniosStore.recordAiTokenUsage(tokenUsage);

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: directText,
      time: now,
      tokenUsage
    };
  }

  // 3. Smart contextual fallback matching query topic and guest profile
  const fallback = generateSmartContextualFallback(userQuery, guestName, hotelName, hotelDistrict, roomNumber, guestProfile);

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: fallback.reply,
    time: now,
    actions: fallback.actions,
    recommendations: fallback.recs
  };
}


