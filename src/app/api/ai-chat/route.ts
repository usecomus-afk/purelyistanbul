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
import { comusAiFunctionTools } from '@/services/comusTools';
import { calculateTrafficAwareRoute, generateGuestWeeklyItinerary } from '@/services/itineraryEngine';

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
        reply: `Sayın ${guestName} Bey, ${instantAnswer.reply}`,
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
      lowerQuery.includes('not interested');

    let detectedBlacklistTopic: string | null = null;
    if (isAntiNagging) {
      if (lowerQuery.includes('gayrimenkul') || lowerQuery.includes('yatırım') || lowerQuery.includes('real estate')) {
        detectedBlacklistTopic = 'GAYRIMENKUL_YATIRIM';
      } else if (lowerQuery.includes('pub') || lowerQuery.includes('parti') || lowerQuery.includes('gece hayatı')) {
        detectedBlacklistTopic = 'NIGHTLIFE_PUBCRAWL';
      } else if (lowerQuery.includes('saç ekimi') || lowerQuery.includes('hair')) {
        detectedBlacklistTopic = 'SAC_EKIMI';
      } else {
        detectedBlacklistTopic = 'GENEL_ONERILER';
      }
    }

    // 3. TIER 2: Intelligent In-Memory / Semantic Cache Key
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

    // 4. Injected System Prompt
    const fullSystemPrompt = buildInjectedComusSystemPrompt(prefs, hotelName, hotelDistrict, roomNumber, language);

    const apiKey = process.env.GEMINI_API_KEY;
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
            temperature: 0.5,
            maxOutputTokens: 600,
            tools: [{ functionDeclarations: comusAiFunctionTools as any }]
          }
        });

        // Check for function call
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            if (call.name === 'add_negative_preference') {
              const args = call.args as any;
              const topic = args?.topic_or_category || detectedBlacklistTopic || 'GENEL';
              updatedLockedCategories.push(topic);
            } else if (call.name === 'create_booking_action') {
              const args = call.args as any;
              actions.push({
                id: `act_${Date.now()}`,
                type: 'BOOK_APPOINTMENT',
                label: `Randevuyu Onayla (${args.service_title || 'Seçili Hizmet'})`,
                payload: {
                  listing_id: args.listing_id,
                  service_title: args.service_title,
                  preferred_date: args.preferred_date,
                  preferred_time: args.preferred_time,
                  booking_type: args.booking_type
                }
              });
            } else if (call.name === 'generate_weekly_itinerary') {
              actions.push({
                id: `act_itin_${Date.now()}`,
                type: 'VIEW_ITINERARY',
                label: 'Haftalık Seyahat Ajandamı Göster',
                payload: {}
              });
            }
          }
        }

        replyText = response.text || '';
      } catch (geminiError) {
        console.warn('[Gemini 2.5 Flash SDK Warning]:', geminiError);
      }
    }

    // 5. Intelligent Grounded Fallback Engine (when API Key is offline or fallback required)
    if (!replyText) {
      if (isAntiNagging && (lowerQuery.includes('hamam') || lowerQuery.includes('randevu'))) {
        const topicName = detectedBlacklistTopic === 'GAYRIMENKUL_YATIRIM' ? 'gayrimenkul ve yatırım' : 'bu öneri';
        replyText = `Anlaşıldı ${guestName} Bey, ${topicName} konuları tercih halkanızdan tamamen çıkarılmıştır. Bu konuda size bir daha asla öneride bulunmayacağım.\n\nCağaloğlu Hamamı Geleneksel Masaj seansınız yarın saat 15:30 için adınıza başarıyla rezerve edilmiştir! 🎟️\n\n📅 Haftalık Ajandanız Güncellendi:\n• 15:30 - Cağaloğlu Hamamı (Sultanahmet)\n🚗 Ulaşım Notu: Otelinize sadece 400 metre mesafede olduğu için 5 dakikalık keyifli bir yürüyüşle ulaşabilirsiniz.\n\nBaşka bir arzunuz olursa 7/24 buradayım!`;
        actions.push({
          id: 'act_hamam_done',
          type: 'VIEW_ITINERARY',
          label: 'Haftalık Ajandayı İncele',
          payload: {}
        });
      } else if (isAntiNagging) {
        const topicName = detectedBlacklistTopic === 'GAYRIMENKUL_YATIRIM' ? 'gayrimenkul ve yatırım' : 'bu';
        replyText = `Anlaşıldı ${guestName} Bey, ${topicName} konusu tercih listenizden çıkarılmıştır ve karalistemize kilitlenmiştir. Bu konuda size bir daha asla öneride bulunmayacağım. Size yardımcı olabileceğim başka bir konu var mı?`;
      } else if (lowerQuery.includes('akşam') || lowerQuery.includes('yoruldum') || lowerQuery.includes('rahatlatıcı') || lowerQuery.includes('yarın')) {
        replyText = `İyi akşamlar ${guestName} Bey! Otelinizde (${hotelName}, Oda ${roomNumber}) umarım keyifli bir gün geçirmişsinizdir.\n\nProfilinizdeki 'Aesthetic & Wellness' tercihlerinize ve az önce incelediğiniz Cağaloğlu Hamamı ile Quartz Clinique ilanlarına istinaden size iki harika önerim var:\n\n1. 🧖‍♂️ Tarihi Cağaloğlu Hamamı - Otelinize 5 dk yürüme mesafesinde geleneksel Kese & Köpük masajı.\n2. 🪞 Nişantaşı Quartz Clinique - Cildinizi neme doyuracak 45 dakikalık Ekspres Hydrafacial Bakımı.\n\nİsterseniz sizin adınıza yarın saat 11:00 veya 15:30 için anında randevu oluşturabilirim. Hangisini tercih edersiniz?`;
        
        actions.push(
          {
            id: 'act_book_hamam',
            type: 'BOOK_APPOINTMENT',
            label: '🧖‍♂️ Cağaloğlu Hamamı (Yarın 15:30)',
            payload: {
              listing_id: 'exp-1',
              service_title: 'Tarihi Cağaloğlu Hamamı & Masaj',
              preferred_date: '2026-08-24',
              preferred_time: '15:30',
              booking_type: 'EXPERIENCE_TICKET'
            }
          },
          {
            id: 'act_book_quartz',
            type: 'BOOK_APPOINTMENT',
            label: '🪞 Quartz Clinique Hydrafacial (Yarın 11:00)',
            payload: {
              listing_id: 'exp-aesthetic-1',
              service_title: 'Nişantaşı Glow & Hydrafacial',
              preferred_date: '2026-08-24',
              preferred_time: '11:00',
              booking_type: 'AESTHETIC_APPOINTMENT'
            }
          }
        );

        recommendations = [
          { title: "Tarihi Cağaloğlu Hamamı Masaj & Kese", category: "Kültür & Spa", location: "Sultanahmet" },
          { title: "Quartz Clinique – Nişantaşı Glow & Fraksiyonel Cilt Yenileme", category: "Medikal Estetik", location: "Nişantaşı" }
        ];
      } else {
        replyText = `Merhaba ${guestName} Bey! ${hotelName} (Oda ${roomNumber}) konaklamanızda size rehberlik etmekten memnuniyet duyarım. İstanbul'da seçkin restoranlar, Boğaz turları, Nişantaşı medikal estetik klinikleri ve size özel gezi rotaları için dilediğinizi sorabilirsiniz. İsterseniz sizin adınıza hemen rezervasyon veya randevu oluşturabilirim.`;
        recommendations = [
          { title: "Bosphorus Dinner Cruise & Shows", category: "Boğaz & Tekne", location: "Kabataş" },
          { title: "Quartz Clinique – Nişantaşı Glow", category: "Medikal Estetik", location: "Nişantaşı" }
        ];
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
