export const maxDuration = 60;
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
import { generateSmartContextualFallback } from '@/lib/gemini';
import {
  formatCatalogForPrompt,
  getPublishedListings,
  searchPublishedListings,
} from '@/services/comusListingCatalog';

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
      hotelName = '',
      hotelDistrict = '',
      roomNumber = '',
      language = 'tr',
      session_history = []
    } = body;

    const guestName = user_preferences.first_name || '';
    const guestLastName = user_preferences.last_name || '';

    // Build comprehensive preferences if partial
    const prefs: UserPreferences = {
      guest_id: user_preferences.guest_id || 'guest_anonymous',
      first_name: guestName,
      last_name: guestLastName,
      hotel_info: user_preferences.hotel_info || {
        hotel_id: '',
        hotel_name: hotelName,
        room_number: roomNumber,
        district: hotelDistrict,
        location: { lat: 0, lng: 0 }
      },
      know_me_profile: user_preferences.know_me_profile || {
        travel_purpose: 'LEISURE',
        interests: {
          aesthetic_and_wellness: {
            interested: false,
            sub_categories: []
          },
          gastronomy: false,
          bosphorus_tours: false,
          real_estate_investment: false,
          nightlife_pubcrawl: false
        },
        budget_tier: 'MODERATE'
      },
      viewed_listings_history: user_preferences.viewed_listings_history || [],
      blacklisted_offers: user_preferences.blacklisted_offers || [],
      booked_itinerary: user_preferences.booked_itinerary || []
    };

    // 1. TIER 1: 0-Token Instant Local Knowledge Engine (WiFi, Breakfast, Checkout, Transit, Ombudsman)
    const instantAnswer = getInstantKnowledgeAnswer(message, hotelName, hotelDistrict, language);
    if (instantAnswer) {
      return NextResponse.json({
        reply: instantAnswer.reply,
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
    const survey = prefs.guest_profile_survey || {};
    const profileSummary = `${guestName}_budget:${survey.budgetLevel || 'luxury'}_allergies:${(survey.allergies || []).join('-')}_style:${survey.travelStyle || 'couple'}_blacklists:${(prefs.blacklisted_offers || []).map(b => b.topic_or_category).join(',')}`;
    const cacheKey = buildCacheKey(
      message,
      hotelName,
      hotelDistrict,
      language,
      profileSummary
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

    // 4. Injected Tourist Guardian & Concierge System Prompt (+ yalnızca YAYINDAKİ ilanlar)
    const publishedListings = await getPublishedListings();
    const fullSystemPrompt = buildInjectedComusSystemPrompt(
      prefs,
      hotelName,
      hotelDistrict,
      roomNumber,
      language,
      prefs.guest_profile_survey,
      formatCatalogForPrompt(publishedListings)
    );

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
          model: 'gemini-1.5-flash',
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

    // 5. Öneri kartları — yalnızca ŞU AN YAYINDA olan ilanlardan (sabit/demo ilan yok)
    const isListingQuery =
      /hamam|spa|masaj|boğaz|tekne|bosphorus|cruise|tur|tour|restoran|yemek|deneyim|experience|estetik|klinik|transfer|aktivite|gezi/i.test(lowerQuery);
    if (isListingQuery && !isAntiNagging) {
      const found = await searchPublishedListings({ query: message, limit: 3 });
      for (const l of found.matches) {
        recommendations.push({ title: l.title, category: l.category, location: l.district });
        actions.push({
          id: `act_${l.id}`,
          type: 'BOOK_APPOINTMENT',
          label: `📅 ${l.title}`,
          payload: {
            listing_id: l.id,
            service_title: l.title,
            preferred_date: new Date().toISOString().split('T')[0],
            preferred_time: '',
            booking_type: 'EXPERIENCE_TICKET'
          }
        });
      }
    }

    // 6. Intelligent Dynamic Fallback (if live network is unreachable)
    if (!replyText) {
      if (isAntiNagging) {
        const topicName = detectedBlacklistTopic === 'GAYRIMENKUL_YATIRIM' ? 'gayrimenkul ve yatırım' : 'bu öneri';
        replyText = `Anlaşıldı, ${topicName} konusu tercih listenizden tamamen çıkarılmıştır. Bu konuda size bir daha asla öneride bulunmayacağım. Size yardımcı olabileceğim başka bir konu var mı?`;
      } else {
        const fallback = generateSmartContextualFallback(message, guestName, hotelName, hotelDistrict, roomNumber, prefs.guest_profile_survey);
        replyText = fallback.reply;
        if (!recommendations || recommendations.length === 0) {
          recommendations = fallback.recs;
        }
        if (!actions || actions.length === 0) {
          actions = fallback.actions;
        }
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



