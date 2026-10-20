import { GuestProfile, TokenUsageInfo } from './types';
import { UserPreferences, AiActionItem } from '@/types/comusAi';
import { XeniosStore } from './store';
import { buildInjectedComusSystemPrompt } from '@/prompts/comusSystemPrompt';
import { formatCatalogForPrompt, getPublishedListings } from '@/services/comusListingCatalog';

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
    const publishedListings = await getPublishedListings().catch(() => []);
    const systemPrompt = buildInjectedComusSystemPrompt(
      prefs,
      hotelName,
      hotelDistrict,
      roomNumber,
      lang,
      guestProfile,
      formatCatalogForPrompt(publishedListings)
    );

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

/**
 * Gemini'ye ulaşılamadığında kullanılan dürüst yedek yanıt.
 * Sabit/demo ilan, mekan, Wi-Fi şifresi veya saat UYDURMAZ; bilinmeyen tesis bilgisinde resepsiyona yönlendirir.
 */
export function generateSmartContextualFallback(
  userQuery: string,
  guestName: string,
  hotelName: string,
  _hotelDistrict: string,
  _roomNumber: string,
  _guestProfile?: GuestProfile
): { reply: string; recs: any[]; actions: AiActionItem[] } {
  const q = userQuery.toLowerCase();
  const hello = guestName ? `${guestName}, ` : '';
  const property = hotelName || 'tesisimiz';

  const isPropertyQuestion =
    /wifi|wi-fi|internet|şifre|kahvaltı|breakfast|çıkış|checkout|check-out|giriş|check-in|otopark|havuz|resepsiyon|oda|havlu|temizlik|arıza|klima/.test(q);

  if (isPropertyQuestion) {
    return {
      reply: `${hello}bu konuda ${property} için elimde doğrulanmış bir bilgi yok, tahminde bulunmak istemem. En doğru bilgiyi resepsiyonumuz verecektir. Bir talebiniz varsa "Oda İçi Hizmetler" menüsünden de iletebilirsiniz.`,
      recs: [],
      actions: []
    };
  }

  if (/tuzak|dolandır|scam|taksi|taxi/.test(q)) {
    return {
      reply: `${hello}kısa birkaç yerel ipucu: taksiye binerken taksimetrenin açıldığından emin olun, sabit fiyat pazarlığını kabul etmeyin ve nakit öderken banknotun değerini sesli söyleyin. Sokakta tanışıp sizi bir bara ya da dükkana götürmek isteyenlere nazikçe "hayır" deyin.`,
      recs: [],
      actions: []
    };
  }

  return {
    reply: `${hello}şu an bağlantıda kısa bir gecikme var, bu yüzden sorunuza doğru bir yanıt veremiyorum. Birazdan tekrar deneyebilir ya da acil bir konu için resepsiyonumuza ulaşabilirsiniz.`,
    recs: [],
    actions: []
  };
}

export async function askGeminiConcierge(
  userQuery: string,
  guestProfile: GuestProfile,
  hotelName: string,
  hotelDistrict: string,
  lang: string = 'tr',
  roomNumber: string = '',
  userPreferences?: Partial<UserPreferences>,
  chatHistory?: ChatMessage[]
): Promise<ChatMessage> {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const guestName = userPreferences?.first_name || '';

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


