import { GuestProfile, TokenUsageInfo } from './types';
import { UserPreferences, AiActionItem } from '@/types/comusAi';
import { XeniosStore } from './store';

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

const GEMINI_DIRECT_API_KEY =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

async function callDirectGeminiRest(
  userQuery: string,
  guestName: string,
  hotelName: string,
  hotelDistrict: string,
  roomNumber: string,
  lang: string
): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_DIRECT_API_KEY}`;
    const systemPrompt = `Sene 2026. Sen "Comus AI", İstanbul'daki Xenios platformunun 7/24 hizmet veren akıllı kişisel konsiyerjisisin.
Konaklayan misafir: ${guestName || 'Misafir'}
Otel: ${hotelName} (${hotelDistrict}), Oda No: ${roomNumber}
Yanıt Dili: ${lang === 'tr' ? 'Türkçe' : lang}.

Kurallar:
- Misafirin sorduğu soruya doğrudan, net, bilgili ve samimi bir şekilde odaklanarak cevap ver.
- Asla ezber, sabit bir karşılama metnini papağan gibi tekrarlama. Soru neyi soruyorsa (müzeler, restoranlar, vapur saatleri, Galata Kulesi, Ayasofya, taksi, hamam, klinik vs.) ona özel uzman İstanbul bilgisi ver.
- Misafire her zaman saygılı ve ismiyle (${guestName}) hitap et.
- Cevabın sonuna, misafir arzu ederse ilgili mekan veya etkinlik için hemen rezervasyon ya da randevu oluşturabileceğini belirten nazik bir cümle ekle.`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { role: 'user', parts: [{ text: userQuery }] }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Direct Gemini REST call error:', err);
  }
  return null;
}

function generateSmartContextualFallback(
  userQuery: string,
  guestName: string,
  hotelName: string,
  hotelDistrict: string,
  roomNumber: string
): { reply: string; recs: any[]; actions: AiActionItem[] } {
  const q = userQuery.toLowerCase();
  let reply = '';
  let recs: any[] = [];
  let actions: AiActionItem[] = [];

  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('şifre')) {
    reply = `${guestName} Bey, odanızdaki (${hotelName}, Oda ${roomNumber}) yüksek hızlı misafir Wi-Fi ağı:\n\n📶 Ağ Adı (SSID): ${hotelName.split(' ')[0]}_Guest\n🔑 Şifre: Xenios2026!\n\nÜst bardaki Wi-Fi butonuna tıklayarak şifreyi tek dokunuşla kopyalayabilirsiniz.`;
  } else if (q.includes('kahvaltı') || q.includes('breakfast') || q.includes('yemek')) {
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
    reply = `${guestName} Bey, "${userQuery}" konusundaki talebinizi aldım. İstanbul'da seçkin restoranlar, tarihi yarımada rotaları, Boğaz turları, Nişantaşı klinikleri ve size özel VIP deneyimler için dilediğiniz detayları sorabilirsiniz. Sizin adınıza hemen rezervasyon oluşturabilirim.`;
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
  userPreferences?: Partial<UserPreferences>
): Promise<ChatMessage> {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const guestName = userPreferences?.first_name || 'Alex';

  // 1. Try server-side Gemini 3.6 Flash / Comus AI API route
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        user_preferences: userPreferences,
        hotelName,
        hotelDistrict,
        roomNumber,
        language: lang
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
  const directText = await callDirectGeminiRest(userQuery, guestName, hotelName, hotelDistrict, roomNumber, lang);
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

  // 3. Smart contextual fallback matching query topic
  const fallback = generateSmartContextualFallback(userQuery, guestName, hotelName, hotelDistrict, roomNumber);

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: fallback.reply,
    time: now,
    actions: fallback.actions,
    recommendations: fallback.recs
  };
}
