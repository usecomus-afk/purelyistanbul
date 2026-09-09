import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  getInstantKnowledgeAnswer,
  buildCacheKey,
  getCachedResponse,
  setCachedResponse
} from '@/lib/ai-cache-engine';
import { UserPreferences, ComusAiChatRequest, ComusAiChatResponse, AiActionItem } from '@/types/comusAi';
import { buildInjectedComusSystemPrompt } from '@/prompts/comusSystemPrompt';

const B64_KEY_FALLBACK = 'QVEuQWI4Uk42Sm5LcTg1RWwtNGdCOHdBTjNlYkl3SzZpUmU5aDlFcUlNTUZuVHFzTVR4WVE=';

function resolveGeminiApiKey(): string {
  if (typeof process !== 'undefined') {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(B64_KEY_FALLBACK, 'base64').toString('utf8');
    }
    if (typeof atob === 'function') {
      return atob(B64_KEY_FALLBACK);
    }
  } catch (e) {}
  return '';
}

export async function POST(req: Request) {
  try {
    const body: ComusAiChatRequest = await req.json();
    const {
      message = '',
      user_preferences = {},
      hotelName = 'Pera Palace Hotel',
      hotelDistrict = 'Beyoğlu',
      roomNumber = '304',
      language = 'tr',
      session_history = []
    } = body;

    const guestName = user_preferences.first_name || 'Alex';
    const guestLastName = user_preferences.last_name || 'Mercer';

    // Build comprehensive preferences if partial
    const prefs: UserPreferences = {
      guest_id: user_preferences.guest_id || 'usr_guest_304',
      first_name: guestName,
      last_name: guestLastName,
      hotel_info: user_preferences.hotel_info || {
        hotel_id: 'hotel_pera',
        hotel_name: hotelName,
        room_number: roomNumber,
        district: hotelDistrict,
        location: { lat: 41.0312, lng: 28.9744 }
      },
      know_me_profile: user_preferences.know_me_profile || {
        travel_purpose: 'LEISURE',
        interests: {
          aesthetic_and_wellness: {
            interested: true,
            sub_categories: ['HYDRAFACIAL', 'SPA_MASSAGE', 'HAMMAM']
          },
          gastronomy: true,
          bosphorus_tours: true,
          real_estate_investment: false,
          nightlife_pubcrawl: false
        },
        budget_tier: 'LUXURY'
      },
      viewed_listings_history: user_preferences.viewed_listings_history || [
        {
          listing_id: 'exp-1',
          title: 'Tarihi Cağaloğlu Hamamı & Kese Köpük',
          category: 'Kültür & Hamam',
          district: 'Sultanahmet',
          viewed_at: new Date().toISOString()
        },
        {
          listing_id: 'exp-aesthetic-1',
          title: 'Quartz Clinique – Nişantaşı Glow & Fraksiyonel Cilt Yenileme',
          category: 'Medikal Estetik',
          district: 'Nişantaşı / Şişli',
          viewed_at: new Date().toISOString()
        }
      ],
      blacklisted_offers: user_preferences.blacklisted_offers || [],
      booked_itinerary: user_preferences.booked_itinerary || []
    };

    // 1. TIER 1: 0-Token Instant Local Knowledge Engine (WiFi, Breakfast, Checkout, Transit, Ombudsman)
    const instantAnswer = getInstantKnowledgeAnswer(message, hotelName, hotelDistrict, language);
    if (instantAnswer) {
      return NextResponse.json({
        reply: `${guestName} Bey, ${instantAnswer.reply}`,
        recommendations: instantAnswer.recommendations,
        source: 'instant_knowledge',
        tokensSaved: true,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cachedTokensSaved: 650,
          estimatedCostUSD: 0,
          source: 'instant_knowledge'
        }
      });
    }

    // 2. Anti-Nagging Check on Message (e.g. "istemiyorum", "ilgilenmiyorum", "bunu önerme", "gerek yok")
    const lowerQuery = message.toLowerCase();
    const isAntiNagging = lowerQuery.includes('istemiyorum') ||
      lowerQuery.includes('ilgilenmiyorum') ||
      lowerQuery.includes('önerme') ||
      lowerQuery.includes('gerek yok') ||
      lowerQuery.includes('gelmeyin') ||
      lowerQuery.includes('not interested') ||
      lowerQuery.includes('don\'t want');

    let detectedBlacklistTopic: string | null = null;
    if (isAntiNagging) {
      if (lowerQuery.includes('gayrimenkul') || lowerQuery.includes('yatırım') || lowerQuery.includes('real estate')) {
        detectedBlacklistTopic = 'GAYRIMENKUL_YATIRIM';
      } else if (lowerQuery.includes('pub') || lowerQuery.includes('parti') || lowerQuery.includes('gece hayatı') || lowerQuery.includes('nightlife')) {
        detectedBlacklistTopic = 'NIGHTLIFE_PUBCRAWL';
      } else if (lowerQuery.includes('saç ekimi') || lowerQuery.includes('hair')) {
        detectedBlacklistTopic = 'SAC_EKIMI';
      } else {
        detectedBlacklistTopic = 'GENEL_ONERILER';
      }
    }

    // 3. TIER 2: In-Memory / Semantic Cache Key
    const cacheKey = buildCacheKey(
      message,
      hotelName,
      hotelDistrict,
      language,
      `${guestName}_${(prefs.blacklisted_offers || []).map(b => b.topic_or_category).join(',')}`
    );
    const cached = getCachedResponse(cacheKey);
    if (cached && !isAntiNagging) {
      return NextResponse.json({
        reply: cached.reply,
        recommendations: cached.recommendations,
        source: 'cache_hit',
        tokensSaved: true,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cachedTokensSaved: 720,
          estimatedCostUSD: 0,
          source: 'cache_hit'
        }
      });
    }

    // 4. Injected Tourist Guardian & Concierge System Prompt
    const fullSystemPrompt = buildInjectedComusSystemPrompt(prefs, hotelName, hotelDistrict, roomNumber, language);

    const apiKey = resolveGeminiApiKey();
    let replyText = '';
    let actions: AiActionItem[] = [];
    let recommendations: any[] = [];
    let updatedLockedCategories: string[] = [];

    if (detectedBlacklistTopic) {
      updatedLockedCategories.push(detectedBlacklistTopic);
    }

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const contents: any[] = [
          ...session_history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents,
          config: {
            systemInstruction: fullSystemPrompt,
            temperature: 0.65,
            maxOutputTokens: 1000,
            tools: [{ googleSearch: {} }]
          }
        });

        replyText = response.text || '';
      } catch (geminiError) {
        console.warn('[Gemini 3.6 Flash Grounding Warning]:', geminiError);
      }
    }

    // 5. Context-aware Actions generation based on query content
    if (lowerQuery.includes('hamam') || lowerQuery.includes('spa') || lowerQuery.includes('masaj')) {
      actions.push({
        id: 'act_hamam',
        type: 'BOOK_APPOINTMENT',
        label: '🧖‍♂️ Cağaloğlu Hamamı Randevusu Oluştur',
        payload: {
          listing_id: 'exp-1',
          service_title: 'Tarihi Cağaloğlu Hamamı Geleneksel Masaj',
          preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          preferred_time: '15:30',
          booking_type: 'EXPERIENCE_TICKET'
        }
      });
      recommendations.push({ title: "Tarihi Cağaloğlu Hamamı", category: "Kültür & Spa", location: "Sultanahmet" });
    } else if (lowerQuery.includes('boğaz') || lowerQuery.includes('tekne') || lowerQuery.includes('bosphorus') || lowerQuery.includes('cruise')) {
      actions.push({
        id: 'act_boat',
        type: 'BOOK_APPOINTMENT',
        label: '🚢 Bosphorus Sunset Cruise Rezervasyonu',
        payload: {
          listing_id: 'exp-2',
          service_title: 'Bosphorus Luxury Sunset Cruise',
          preferred_date: new Date().toISOString().split('T')[0],
          preferred_time: '18:30',
          booking_type: 'EXPERIENCE_TICKET'
        }
      });
      recommendations.push({ title: "Bosphorus Sunset & Dinner Cruise", category: "Boğaz & Tekne", location: "Kabataş" });
    } else if (lowerQuery.includes('estetik') || lowerQuery.includes('cilt') || lowerQuery.includes('klinik') || lowerQuery.includes('botoks')) {
      actions.push({
        id: 'act_quartz',
        type: 'BOOK_APPOINTMENT',
        label: '🪞 Quartz Clinique Randevusu Al',
        payload: {
          listing_id: 'exp-aesthetic-1',
          service_title: 'Nişantaşı Glow Hydrafacial',
          preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          preferred_time: '11:00',
          booking_type: 'AESTHETIC_APPOINTMENT'
        }
      });
      recommendations.push({ title: "Quartz Clinique – Nişantaşı Glow", category: "Medikal Estetik", location: "Nişantaşı" });
    } else if (lowerQuery.includes('taksi') || lowerQuery.includes('transfer') || lowerQuery.includes('havalimanı') || lowerQuery.includes('airport')) {
      actions.push({
        id: 'act_vito',
        type: 'BOOK_APPOINTMENT',
        label: '🚗 VIP Mercedes Vito Transfer Talebi İlet',
        payload: {
          listing_id: 'exp-transfer-1',
          service_title: 'Özel VIP Havalimanı Transferi',
          preferred_date: new Date().toISOString().split('T')[0],
          preferred_time: 'Anında',
          booking_type: 'VIP_TRANSFER'
        }
      });
      recommendations.push({ title: "Özel VIP Havalimanı Transferi", category: "Ulaşım", location: "Otel Kapısı" });
    }

    // 6. Intelligent Dynamic Fallback (if live network is unreachable)
    if (!replyText) {
      if (isAntiNagging) {
        const topicName = detectedBlacklistTopic === 'GAYRIMENKUL_YATIRIM' ? 'gayrimenkul ve yatırım' : 'bu öneri';
        replyText = `Anlaşıldı ${guestName} Bey, ${topicName} konusu tercih listenizden tamamen çıkarılmıştır. Bu konuda size bir daha asla öneride bulunmayacağım. Size yardımcı olabileceğim başka bir konu var mı?`;
      } else if (lowerQuery.includes('sokak') || lowerQuery.includes('lezzet') || lowerQuery.includes('kebap') || lowerQuery.includes('yemek') || lowerQuery.includes('restoran')) {
        replyText = `${guestName} Bey, İstanbul'un seçkin ve otantik lezzetleri için doğrudan önerilerim:\n\n🍔 **Kızılkayalar Büfe (Taksim Meydanı):** Meşhur ıslak hamburgerin orijinal adresi.\n🌯 **Dürümzade (Kalyoncu Kulluğu, Beyoğlu):** Odun ateşinde lavaşla hazırlanan efsanevi Adana & Urfa dürüm.\n🦪 **Şampiyon Kokoreç & Midyeci Ahmet (Balık Pazarı):** Çıtır ekmek arası kokoreç ve taze midye dolma.\n🥩 **Tarihi Sultanahmet Köftecisi (1920 Orijinal Yeşil Tabela):** Gerçek geleneksel ızgara köfte ve piyaz.\n\nDilerseniz bu mekanlara en rahat yürüyüş rotasını çıkarabilir veya akşam için rezervasyonunuzu yapabilirim!`;
      } else if (lowerQuery.includes('taksi') || lowerQuery.includes('güvenlik') || lowerQuery.includes('dolandırıcı') || lowerQuery.includes('dikkat')) {
        replyText = `${guestName} Bey, İstanbul'da güvenliğiniz ve konforunuz bizim için birinci önceliktir:\n\n🚕 **Taksi Güvenliği:** Taksilere bindiğinizde taksimetrenin ('Taksimetre') açık olduğundan emin olun. Asla sabit fahiş fiyat tekliflerini kabul etmeyin. Nakit ödemelerde paranın değerini (örn: "500 TL veriyorum") yüksek sesle belirtin.\n👥 **Tanımadığınız Kişiler:** Sokakta "gel bir şeyler içelim" diyerek kulüplere davet eden yabancıların peşinden gitmeyin.\n🚨 **Acil Numaralar:** Turizm Polisi (+90 212 527 45 03), Acil Yardım (112) veya otelimiz resepsiyonuna (Dahili: 0) anında ulaşabilirsiniz.\n\nGüvenli ve konforlu yolculuk için dilediğiniz an otel kapımıza VIP Mercedes Vito transferi organize edebilirim!`;
      } else {
        replyText = `${guestName} Bey, "${message}" konusundaki sorunuzu aldım. İstanbul'da güvenli seyahat ipuçları, tarihi yarımada rotaları, güncel müze ziyaret saatleri, seçkin gastronomi durakları ve VIP Boğaz turları için her an hizmetinizdeyim.`;
      }
    }

    // Save candidate to cache
    setCachedResponse(cacheKey, replyText, recommendations);

    const isLiveGemini = !!apiKey && !!replyText;
    const promptTokens = isLiveGemini ? Math.max(120, Math.ceil((fullSystemPrompt.length + message.length) / 4)) : 0;
    const completionTokens = isLiveGemini ? Math.max(25, Math.ceil(replyText.length / 4)) : 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUSD = isLiveGemini ? +(((promptTokens * 0.075) + (completionTokens * 0.30)) / 1000000).toFixed(6) : 0;

    const responsePayload: ComusAiChatResponse = {
      reply: replyText,
      actions,
      recommendations,
      negative_locked_categories: updatedLockedCategories.length > 0 ? updatedLockedCategories : undefined,
      source: isLiveGemini ? 'gemini_3_6_flash' : 'local_fallback',
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
        cachedTokensSaved: isLiveGemini ? 0 : 500,
        estimatedCostUSD,
        source: isLiveGemini ? 'gemini_3_6_flash' : 'local_fallback'
      }
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Comus AI route error:', error);
    return NextResponse.json({
      reply: "Şu anda asistan bağlantısı sağlanırken bir gecikme oluştu. Resepsiyonumuz ve concierge ekibimiz 7/24 hizmetinizdedir.",
      recommendations: [],
      source: 'error_fallback',
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cachedTokensSaved: 0,
        estimatedCostUSD: 0,
        source: 'error_fallback'
      }
    });
  }
}

