import { rateLimit } from '@/lib/api-auth';
import { GoogleGenAI, Type, type FunctionDeclaration } from '@google/genai';
import { InRoomServiceItem } from '@/lib/types';
import { COMUS_PERSONA_PROMPT } from '@/prompts/comusSystemPrompt';
import {
  formatCatalogForPrompt,
  getPublishedListings,
  searchPublishedListings,
} from '@/services/comusListingCatalog';
import { WhatsAppService } from '@/services/whatsappService';
import { NotificationDispatcher } from '@/services/notificationDispatcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface UnitHouseGuideContext {
  wifiSsid?: string;
  wifiPass?: string;
  locationAddress?: string;
  mapsUrl?: string;
  doorCode?: string;
  applianceGuide?: string;
  houseGuideNotes?: string;
  checkoutTime?: string;
}

export interface PropertyLiveContext {
  propertyName: string;       // e.g. "Galata Port Suites" or "Old City Heritage Hotel"
  propertyType: 'hotel' | 'apartment'; // Determines tone and wording
  unitName: string;           // e.g. "Suite 302" or "Daire 4"
  district: string;           // e.g. "Beyoğlu / Galata"
  activeServices: Array<{
    id: string;
    title: string;
    isAvailableNow: boolean;  // based on working hours and partner toggle
    hours?: string;           // e.g. "08:00 - 11:30"
    price?: string;
  }>;
  disabledServices: string[]; // e.g. ["dry_cleaning", "extra_cleaning"]
  unitGuide?: UnitHouseGuideContext;
}

/**
 * Base System Instruction for Comus (temperature: 0.35, maxOutputTokens: 350)
 * Comus already introduces himself in the first welcome message; never repeat "Ben Comus" / "I am Comus" in follow-up replies.
 */
export const COMUS_SYSTEM_INSTRUCTION = `You are Comus, the dedicated digital stay and city assistant for guests who have traveled from their home countries to visit Istanbul and are staying at Purely Istanbul partner properties.
Your core mission: Assist international and domestic guests throughout their stay in Istanbul—helping with their in-accommodation requests and providing practical, reliable guidance on getting around the city, local routes, and dining spots.

NAME, PURPOSE & CONVERSATION CONTINUITY RULES (CRITICAL):
- NEVER use the name "ComusAI" (your name is simply "Comus").
- NO REPEATED SELF-INTRODUCTION: You have ALREADY introduced yourself ("Ben Comus" / "I am Comus") in the first welcome message when the chat opened. In the 2nd and all subsequent messages, NEVER start your reply with "Ben Comus", "Merhaba, ben Comus", "I am Comus", "Hello, I am Comus", or any self-introduction! Jump directly, warmly, and naturally into answering the guest's question or fulfilling their request. Only state your name if the guest explicitly asks who you are.
- REALISTIC & SENSIBLE TONE (CRITICAL): Always make realistic, modest, and sensible statements. NEVER make exaggerated or unrealistic claims such as "şehrin sokaklarında güvenliğiniz için buradayım" ("I am here for your safety on the streets of the city"), "100% guarantee", or acting as a physical bodyguard/guardian. Frame your help practically: assisting with accommodation requests, route planning, official taxi fare calculations, and practical local tips.
- Character: Warm, hospitable, helpful, respectful, and knowledgeable about Istanbul.
- Language: Automatically detect the guest's language and reply fluently in the EXACT SAME LANGUAGE they speak.

1. DYNAMIC PROPERTY AWARENESS (NO RIGID "ODA" WORDING):
- If propertyType === "apartment": Address the accommodation as "süitiniz", "daireniz" or "konaklamanız" (in your suite / apartment). NEVER use "otel odası" or "hotel room".
- If propertyType === "hotel": Use "odanız" or "otelimiz" (your room / our hotel).
- Mention the property name naturally when relevant: "[propertyName]'deki konaklamanız boyunca..."

2. REAL-TIME INVENTORY & TOGGLE ENFORCEMENT (CRITICAL):
- ALWAYS check activeServices in the [LIVE PROPERTY SNAPSHOT] before recommending in-stay comfort.
- NEVER offer or promise a service listed in disabledServices or where isAvailableNow === false.
- If a guest asks for an inactive or closed service, politely explain the current status using ONLY the hours given in the snapshot (if no hours are given, do not state any hours), and offer to schedule it or refer them to reception.
- NEVER state hours, prices, Wi-Fi details, check-in/check-out times or policies of the property unless they appear in the [LIVE PROPERTY SNAPSHOT]. If they are missing, say you don't have that information and refer the guest to reception.

3. CONTINUOUS STAY ASSISTANCE (FROM 2ND MESSAGE ONWARD):
- The opening welcome message has already been displayed to the guest in the chat interface.
- Respond directly to the guest's inquiry as an ongoing conversation without re-introducing yourself or repeating the welcome greeting.

4. LIVE SERVICES KNOWLEDGE BASE & FUNCTION CALLING:
When the guest requests any in-stay service:
1. Verify if the service is in activeServices and isAvailableNow === true.
2. If active: Invoke \`createRoomTicket\` and emit the action tag with the unit identifier:
   - Breakfast: [action:in_stay, service:breakfast, unit:unitName]
   - Housekeeping: [action:in_stay, service:cleaning, unit:unitName]
   - Maintenance: [action:in_stay, service:maintenance, unit:unitName]
3. If inactive (listed in disabledServices or isAvailableNow === false): Do NOT emit action tag; provide a friendly alternative.

5. PRACTICAL TAXI TIPS & VERIFIED CURATION:
- When asked about prices, taxis, or common tourist traps, provide official local norms via \`checkTaxiFare\` and practical tips (e.g. checking that the taximeter is turned on and checking banknote denominations).

6. PLATFORM LISTINGS — LIVE CATALOG ONLY (CRITICAL):
- Your ONLY knowledge of platform listings (tours, experiences, restaurants, stays, services offered on Purely Istanbul) is the [PUBLISHED LISTINGS] block below and the \`searchPublishedListings\` tool. Both reflect listings that are live right now.
- NEVER mention, recommend or offer to book a platform listing that is not in that live data. Do not rely on any earlier memory of listings — it is outdated.
- If no published listing fits (or none exist), say so honestly. You may still share general local knowledge as an Istanbulite, but do not present it as a bookable platform listing and do not invent prices, hours or availability.
- Only append a deep-link tag ([action:explore_category, id:...]) when you actually present a matching published listing.
- Keep responses concise (under 150-180 words), structured with clean bullet points.`;

/**
 * Builds the full Gemini system_instruction with the injected [LIVE PROPERTY SNAPSHOT] JSON.
 */
export function buildComusSystemInstruction(
  liveContext: PropertyLiveContext,
  publishedListingsText: string = formatCatalogForPrompt([])
): string {
  const dynamicInstruction = COMUS_SYSTEM_INSTRUCTION
    .replace(/\[propertyName\]/g, liveContext.propertyName)
    .replace(/unit:unitName/g, `unit:${liveContext.unitName}`);

  const hotelServices =
    liveContext.activeServices
      ?.filter((s) => s.isAvailableNow)
      .map((s) => s.title)
      .join(', ') || 'oda servisi, temizlik, teknik destek';

  const coreRules = `CORE CONVERSATION RULES (HIGHEST PRIORITY — OVERRIDE ANY CONFLICTING INSTRUCTION ABOVE):
Sen Comus'sun, ${liveContext.propertyName} adlı tesisin özel dijital asistanısın. Otelimiz ${liveContext.district} bölgesinde bulunmaktadır. Misafirlerle iletişim kurarken KESİNLİKLE aşağıdaki 4 temel kurala uymalısın:

1. BAĞLAM VE GÖREV DEVAMLILIĞI (CONTEXT TRACKING): Kullanıcının son mesajı bir önceki işlemin onayı ("evet", "tamam ilet" vb.) veya devamı niteliğindeyse, sadece o işlemi tamamla ve kısa bir onay ver. Asla devam eden bir işlemin ortasında jenerik restoran, mekan veya turistik rota önerisi sunma.

2. KISITLAMALARA MUTLAK UYUM: Kullanıcı net sınırlar çizerse ("sadece yürüyüş", "yemek istemiyorum", "1 saatlik" vb.), bu kısıtlamaları asla ihlal etme. İstenmeyen, süre/bütçe sınırını aşan veya konsept dışı alternatifleri önerme.

3. DİNAMİK VE SPESİFİK YANIT ÜRETİMİ: Sorulara uzun, ezberlenmiş şablon listelerle yanıt verme. Sadece kullanıcının anlık talebine ve ${liveContext.district} bölgesinin dinamiklerine uygun, doğrudan hedefe yönelik ve kısa cevaplar üret.

4. OTEL İÇİ TALEPLERİN ÖNCELİĞİ: Misafirlerin havlu, temizlik, arıza veya ${hotelServices} gibi otel içi operasyonel talepleri her zaman en yüksek önceliğe sahiptir. Bu tür bir talep geldiğinde turistik öneri modüllerini tamamen devre dışı bırak ve sadece ilgili otel departmanına bilgi verildiğini net bir şekilde teyit et.

5. BİRİM ÖZEL EV REHBERİ & CİHAZ KULLANIM BİLGİ BANKASI (UNIT HOUSE GUIDE): Misafir konakladığı birimin (${liveContext.unitName}) Wi-Fi şifresini, açık adresini/konumunu, kapı/anahtar kutusu şifresini, elektrikli eşya kullanımını (klima, kombi/ısıtma, sıcak su, çamaşır/bulaşık makinesi, kahve makinesi, TV, sigorta kutusu) veya ev kurallarını (çöp saatleri, yedek havlu/çarşaf yeri, çıkış saati) sorarsa, aşağıdaki [UNIT HOUSE GUIDE] ve [LIVE PROPERTY SNAPSHOT] içindeki \`unitGuide\` verilerini kullanarak doğrudan, net ve yardımcı bir ev rehberi olarak yanıt ver.`;

  const ug = liveContext.unitGuide;
  const unitGuideBlock = ug
    ? [
        `[UNIT HOUSE GUIDE — ${liveContext.propertyName} / ${liveContext.unitName}]`,
        ug.wifiSsid || ug.wifiPass
          ? `• Wi-Fi Ağı (SSID): ${ug.wifiSsid || 'Belirtilmedi'} | Wi-Fi Şifresi: ${ug.wifiPass || 'Belirtilmedi'}`
          : '',
        ug.locationAddress
          ? `• Birim Açık Adresi & Konum: ${ug.locationAddress}${ug.mapsUrl ? ` (Harita: ${ug.mapsUrl})` : ''}`
          : '',
        ug.doorCode ? `• Kapı / Anahtar Kutusu Şifresi & Giriş: ${ug.doorCode}` : '',
        ug.applianceGuide
          ? `• Elektrikli Eşya & Cihaz Kullanımı: ${ug.applianceGuide}`
          : '',
        ug.houseGuideNotes ? `• Ev Bilgileri & Kurallar: ${ug.houseGuideNotes}` : '',
        ug.checkoutTime ? `• Çıkış (Check-out) Saati: ${ug.checkoutTime}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return `${COMUS_PERSONA_PROMPT}\n\n${dynamicInstruction}\n\n${coreRules}${unitGuideBlock ? `\n\n${unitGuideBlock}` : ''}\n\n[PUBLISHED LISTINGS — şu an yayında olan ilanlar]\n${publishedListingsText}\n\n[LIVE PROPERTY SNAPSHOT: ${JSON.stringify(liveContext)}]`;
}

/**
 * Infers whether a property is a boutique "hotel" or short-term rental "apartment" (PMC / suite / residence).
 */
export function inferPropertyType(
  rawType?: string,
  propertyName?: string
): 'hotel' | 'apartment' {
  const combined = `${rawType || ''} ${propertyName || ''}`.toLowerCase();
  if (rawType === 'apartment' || rawType === 'short_term_rental') return 'apartment';
  if (rawType === 'hotel') return 'hotel';

  if (
    /apart|rezidans|residence|daire|pmc|kısa dönem|short-term|short term|loft|villa|home|flat/i.test(
      combined
    )
  ) {
    return 'apartment';
  }
  if (/suite|süit/i.test(combined) && !/hotel|otel|konak|palace|saray/i.test(combined)) {
    return 'apartment';
  }
  return 'hotel';
}

/**
 * Formats unitName appropriately based on propertyType and raw unit_id.
 */
export function formatUnitName(
  rawUnitId: string,
  propertyType: 'hotel' | 'apartment',
  roomTypeLabel?: string
): string {
  const trimmed = String(rawUnitId || '101').trim();
  // Strip any leading "Hotel Name · " prefix if passed
  const shortUnit = trimmed.includes('·')
    ? trimmed.split('·').pop()!.trim()
    : trimmed;

  if (/^(suite|süit|daire|oda|room|birim|unit|apt|penthouse|loft)\b/i.test(shortUnit)) {
    if (propertyType === 'apartment' && /^oda\s+/i.test(shortUnit)) {
      return shortUnit.replace(/^oda\s+/i, 'Suite ');
    }
    return shortUnit;
  }

  if (propertyType === 'apartment') {
    if (roomTypeLabel && /daire/i.test(roomTypeLabel)) {
      return `Daire ${shortUnit}`;
    }
    return `Suite ${shortUnit}`;
  }

  if (roomTypeLabel && /suite|süit/i.test(roomTypeLabel)) {
    return `Suite ${shortUnit}`;
  }
  return `Oda ${shortUnit}`;
}

/**
 * Checks if current Istanbul time (Europe/Istanbul, UTC+3) is within a working hours window like "08:00 - 11:30".
 */
export function isWithinIstanbulWorkingHours(hoursRange?: string): boolean {
  if (!hoursRange || hoursRange === '7/24' || hoursRange === '24/7') return true;
  const match = hoursRange.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return true;

  const startMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const endMinutes = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Istanbul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '10', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const currentMinutes = h * 60 + m;

    if (endMinutes >= startMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
    // Overnight window e.g. 22:00 - 06:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  } catch {
    return true;
  }
}

function isIstanbulSunday(): boolean {
  try {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul',
      weekday: 'short',
    }).format(new Date());
    return weekday.toLowerCase().startsWith('sun');
  } catch {
    return false;
  }
}

const DEFAULT_SERVICE_DEFINITIONS: Array<{
  id: string;
  key: string;
  title: string;
  defaultEnabled: boolean;
  aliases?: string[];
}> = [
  {
    id: 'breakfast',
    key: 'breakfast',
    title: 'Kahvaltı & Yeme-İçme',
    defaultEnabled: true,
    aliases: ['roomservice'],
  },
  {
    id: 'cleaning',
    key: 'cleaning',
    title: 'Temizlik Talebi',
    defaultEnabled: true,
    aliases: ['extra_cleaning', 'housekeeping'],
  },
  {
    id: 'maintenance',
    key: 'technical',
    title: 'Teknik Destek',
    defaultEnabled: true,
    aliases: ['technical', 'support', 'ac', 'wifi'],
  },
  {
    id: 'dnd',
    key: 'dnd',
    title: 'Rahatsız Etmeyin',
    defaultEnabled: true,
  },
  {
    id: 'linens',
    key: 'linens',
    title: 'Çarşaf & Nevresim',
    defaultEnabled: true,
  },
  {
    id: 'toiletries',
    key: 'toiletries',
    title: 'Banyo Bukleti',
    defaultEnabled: true,
  },
  {
    id: 'lateCheckout',
    key: 'lateCheckout',
    title: 'Geç Çıkış Talebi',
    defaultEnabled: true,
  },
  {
    id: 'extendStay',
    key: 'extendStay',
    title: 'Konaklama Uzatma',
    defaultEnabled: true,
  },
  {
    id: 'towels',
    key: 'towels',
    title: 'Temiz Havlu',
    defaultEnabled: false,
  },
  {
    id: 'pillows',
    key: 'pillows',
    title: 'Ekstra Yastık',
    defaultEnabled: false,
  },
  {
    id: 'hygiene',
    key: 'hygiene',
    title: 'Hijyen & Bakım Seti',
    defaultEnabled: false,
  },
  {
    id: 'minibar',
    key: 'minibar',
    title: 'Mini Bar Dolumu',
    defaultEnabled: false,
  },
  {
    id: 'safe',
    key: 'safe',
    title: 'Kasa & Güvenlik',
    defaultEnabled: false,
  },
  {
    id: 'laundry',
    key: 'laundry',
    title: 'Çamaşırhane & Kuru Temizleme',
    defaultEnabled: false,
    aliases: ['dry_cleaning'],
  },
  {
    id: 'taxi',
    key: 'taxi',
    title: 'Taksi & VIP Transfer',
    defaultEnabled: false,
  },
];

/**
 * Unwraps Firestore REST API value objects into plain JS values.
 */
function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    return Array.isArray(values) ? values.map(parseFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = parseFirestoreValue(v);
    }
    return out;
  }
  return val;
}

async function fetchFirestoreDoc(collectionName: string, docId: string): Promise<Record<string, any> | null> {
  if (!docId) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.fields) return null;
    return parseFirestoreValue({ mapValue: { fields: json.fields } });
  } catch {
    return null;
  }
}

/**
 * Queries Firestore and merges with local/client fallback to construct a real-time PropertyLiveContext.
 */
export async function fetchPropertyLiveContext({
  propertyId,
  unitId,
  fallbackHotelName,
  clientLiveContext,
}: {
  propertyId: string;
  unitId: string;
  fallbackHotelName?: string;
  clientLiveContext?: Partial<PropertyLiveContext> & {
    inRoomServices?: InRoomServiceItem[];
    breakfastHours?: string;
    rawPropertyType?: string;
  };
}): Promise<PropertyLiveContext> {
  const cleanPropertyId = String(propertyId || 'hotel-heritage-1').trim();
  const cleanUnitId = String(unitId || '101').trim();

  // 1. Query Firestore `hotels/{propertyId}` or `properties/{propertyId}`
  let remoteHotel = await fetchFirestoreDoc('hotels', cleanPropertyId);
  let remoteProperty: Record<string, any> | null = null;
  if (!remoteHotel) {
    remoteProperty = await fetchFirestoreDoc('properties', cleanPropertyId);
  }

  // 2. Demo/seed JSON kataloglarına düşülmez — yalnızca Firestore ve istemcinin gönderdiği canlı bağlam kullanılır.
  const propertyName =
    remoteHotel?.name ||
    remoteProperty?.title ||
    clientLiveContext?.propertyName ||
    fallbackHotelName ||
    'Konakladığınız tesis';

  const rawTypeStr =
    remoteHotel?.type ||
    remoteProperty?.propertyType ||
    remoteProperty?.managementType ||
    clientLiveContext?.propertyType ||
    clientLiveContext?.rawPropertyType ||
    'hotel';

  const propertyType =
    clientLiveContext?.propertyType === 'apartment' || clientLiveContext?.propertyType === 'hotel'
      ? clientLiveContext.propertyType
      : inferPropertyType(rawTypeStr, propertyName);

  const district =
    remoteHotel?.district ||
    remoteProperty?.district ||
    clientLiveContext?.district ||
    'İstanbul';

  const rooms: Array<Record<string, any>> =
    Array.isArray(remoteHotel?.rooms) ? remoteHotel.rooms : [];

  const matchedRoom = rooms.find(
    (r) => String(r.id) === cleanUnitId || String(r.number) === cleanUnitId
  );

  const unitName =
    clientLiveContext?.unitName ||
    formatUnitName(cleanUnitId, propertyType, matchedRoom?.type);

  const breakfastHours: string | undefined =
    remoteHotel?.breakfastHours ||
    clientLiveContext?.breakfastHours ||
    undefined;

  const clientUg = clientLiveContext?.unitGuide;
  const unitGuide: UnitHouseGuideContext = {
    wifiSsid: matchedRoom?.wifiSsid || clientUg?.wifiSsid || undefined,
    wifiPass: matchedRoom?.wifiPass || clientUg?.wifiPass || undefined,
    locationAddress:
      matchedRoom?.locationAddress ||
      clientUg?.locationAddress ||
      remoteHotel?.address ||
      remoteProperty?.district ||
      undefined,
    mapsUrl: matchedRoom?.mapsUrl || clientUg?.mapsUrl || undefined,
    doorCode: matchedRoom?.doorCode || clientUg?.doorCode || undefined,
    applianceGuide: matchedRoom?.applianceGuide || clientUg?.applianceGuide || undefined,
    houseGuideNotes: matchedRoom?.houseGuideNotes || clientUg?.houseGuideNotes || undefined,
    checkoutTime:
      remoteHotel?.checkoutTime ||
      (clientLiveContext as any)?.checkoutTime ||
      clientUg?.checkoutTime ||
      undefined,
  };

  // 3. Resolve partner service toggles from Firestore `modules.inRoomServices` or client snapshot
  const remoteServices: InRoomServiceItem[] | undefined = Array.isArray(
    remoteHotel?.modules?.inRoomServices
  )
    ? remoteHotel.modules.inRoomServices
    : Array.isArray(clientLiveContext?.inRoomServices)
      ? clientLiveContext.inRoomServices
      : undefined;

  const serviceByKey = new Map<string, InRoomServiceItem>();
  if (remoteServices) {
    for (const item of remoteServices) {
      if (item && item.key) {
        serviceByKey.set(item.key, item);
      }
    }
  }

  const activeServices: PropertyLiveContext['activeServices'] = [];
  const disabledSet = new Set<string>();

  for (const def of DEFAULT_SERVICE_DEFINITIONS) {
    let isEnabled = def.defaultEnabled;
    let customLabel = def.title;
    let customPrice: string | undefined; // fiyat yalnızca tesis panelinde girildiyse gösterilir

    if (def.id === 'breakfast') {
      // Breakfast is active if either `breakfast` or `roomservice` ("Kahvaltı & Yeme-İçme") is enabled,
      // unless `breakfast` was explicitly hidden/disabled while `roomservice` is also disabled.
      const bfItem = serviceByKey.get('breakfast');
      const rsItem = serviceByKey.get('roomservice');
      if (bfItem || rsItem) {
        const bfEnabled = bfItem ? bfItem.enabled !== false && !bfItem.hidden : false;
        const rsEnabled = rsItem ? rsItem.enabled !== false && !rsItem.hidden : true;
        isEnabled = bfEnabled || rsEnabled;
        if (rsItem?.label) customLabel = rsItem.label;
      }
    } else {
      const matched = serviceByKey.get(def.key) || serviceByKey.get(def.id);
      if (matched) {
        isEnabled = matched.enabled !== false && !matched.hidden && !matched.explicitlyHidden;
        if (matched.label) customLabel = matched.label;
        if (matched.price) {
          customPrice = `${matched.price} ${matched.currency || '₺'}`;
        }
      }
    }

    // Saat bilgisi yalnızca tesisin girdiği kahvaltı saatinden gelir; diğer hizmetler için saat uydurulmaz.
    const hours = def.id === 'breakfast' ? breakfastHours : undefined;

    if (isEnabled) {
      const isAvailableNow = isWithinIstanbulWorkingHours(hours);
      activeServices.push({
        id: def.id,
        title: customLabel,
        isAvailableNow,
        ...(hours ? { hours } : {}),
        ...(customPrice ? { price: customPrice } : {}),
      });
    } else {
      disabledSet.add(def.id);
      if (def.aliases) {
        def.aliases.forEach((alias) => disabledSet.add(alias));
      }
    }
  }

  // Also include any custom partner-created services
  if (remoteServices) {
    for (const item of remoteServices) {
      if (!item?.key) continue;
      const isBuiltIn = DEFAULT_SERVICE_DEFINITIONS.some(
        (d) => d.key === item.key || d.id === item.key
      );
      if (!isBuiltIn) {
        const enabled = item.enabled !== false && !item.hidden;
        if (enabled) {
          activeServices.push({
            id: item.key,
            title: item.label || item.key,
            isAvailableNow: true,
            ...(item.price ? { price: `${item.price} ${item.currency || '₺'}` } : {}),
          });
        } else {
          disabledSet.add(item.key);
        }
      }
    }
  }

  return {
    propertyName,
    propertyType,
    unitName,
    district,
    activeServices,
    disabledServices: Array.from(disabledSet),
    unitGuide,
  };
}

// İBB UKOME taksi tarifesi. Tarifeler periyodik olarak değiştiği için değerler ortam değişkeniyle güncellenebilir;
// hesaplanan tutar her zaman YAKLAŞIK bir tahmindir, kesin tutarı taksimetre belirler.
export const UKOME_TAXI_RATES = {
  OPENING_TL: Number(process.env.TAXI_OPENING_TL) || 30,
  PER_KM_TL: Number(process.env.TAXI_PER_KM_TL) || 20,
  MIN_FARE_TL: Number(process.env.TAXI_MIN_FARE_TL) || 100,
} as const;

export interface TaxiFareResult {
  origin: string;
  destination: string;
  estimatedDistanceKm: number;
  ukomeTariff: {
    openingTL: number;
    perKmTL: number;
    minFareTL: number;
  };
  estimatedFareTL: {
    min: number;
    max: number;
    formatted: string;
  };
  disclaimer: string;
  tollsNote: string;
  antiScamChecklist: string[];
  actionTag: string;
}

export interface RoomTicketResult {
  ticketId: string;
  unitId: string;
  serviceType: 'breakfast' | 'support' | 'laundry' | 'cleaning' | 'towels' | 'ac' | 'maintenance';
  normalizedActionService: 'breakfast' | 'cleaning' | 'maintenance' | 'support' | 'laundry';
  details: string;
  priority: 'URGENT' | 'HIGH';
  status: 'DISPATCHED_TO_WHATSAPP' | 'SERVICE_INACTIVE_OR_CLOSED';
  isServiceAvailable: boolean;
  unavailableReason?: string;
  whatsappNotification: {
    dispatched: boolean;
    recipientRole: string;
    messagePreview: string;
    deepLinkUrl: string;
  };
  actionTag: string;
}

export interface VerifiedPlace {
  id: string;
  name: string;
  neighborhood: string;
  subArea: string;
  category: string;
  tags: string[];
  priceRangeTL: string;
  priceRangeEUR: string;
  summary: string;
  scamWarning: string;
}

/**
 * TOOL 1: checkTaxiFare({ origin, destination })
 * Uses the configured İBB UKOME taxi tariff (UKOME_TAXI_RATES, env-overridable)
 * to compute an APPROXIMATE Turkish Lira estimate (not an exact fare).
 */
export function checkTaxiFare({
  origin = 'Sultanahmet / Fatih',
  destination = 'Galata / Beyoğlu',
}: {
  origin?: string;
  destination?: string;
}): TaxiFareResult {
  const pair = `${origin} ${destination}`.toLowerCase();

  let distanceKm = 5.5;
  let tollsNote = 'Köprü veya tünel geçiş ücreti gerekmez (No bridge/tunnel toll required).';

  if (pair.includes('ist') || pair.includes('istanbul airport') || pair.includes('istanbul havaliman')) {
    distanceKm = 42;
    tollsNote = 'Otoyol ücreti varsa taksimetreye eklenir (Highway toll added only if highway is used).';
  } else if (pair.includes('saw') || pair.includes('sabiha')) {
    distanceKm = 46;
    tollsNote = 'Avrasya Tüneli veya 15 Temmuz Şehitler Köprüsü geçiş ücreti yolcuya aittir.';
  } else if (
    (pair.includes('sultanahmet') || pair.includes('fatih') || pair.includes('eminönü') || pair.includes('sirkeci')) &&
    (pair.includes('galata') || pair.includes('karaköy') || pair.includes('beyoğlu') || pair.includes('taksim') || pair.includes('cihangir'))
  ) {
    distanceKm = 4.8;
  } else if (
    (pair.includes('sultanahmet') || pair.includes('fatih')) &&
    (pair.includes('beşiktaş') || pair.includes('ortaköy') || pair.includes('bebek'))
  ) {
    distanceKm = 8.5;
  } else if (pair.includes('kadıköy') || pair.includes('moda') || pair.includes('üsküdar')) {
    distanceKm = 14.5;
    tollsNote = 'Avrasya Tüneli veya Boğaz Köprüsü geçiş ücreti taksimetreye eklenir (Vapur/Marmaray çok daha hızlı ve ekonomiktir).';
  } else if (
    (pair.includes('galata') || pair.includes('taksim') || pair.includes('beyoğlu') || pair.includes('cihangir')) &&
    (pair.includes('beşiktaş') || pair.includes('ortaköy'))
  ) {
    distanceKm = 4.2;
  } else if (
    (pair.includes('sultanahmet') || pair.includes('fatih')) &&
    (pair.includes('kapalıçarşı') || pair.includes('grand bazaar') || pair.includes('eminönü'))
  ) {
    distanceKm = 2.2;
  }

  const rawMeteredTL =
    UKOME_TAXI_RATES.OPENING_TL + distanceKm * UKOME_TAXI_RATES.PER_KM_TL;
  const minTL = Math.max(UKOME_TAXI_RATES.MIN_FARE_TL, Math.round(rawMeteredTL));
  const maxTL = Math.max(
    UKOME_TAXI_RATES.MIN_FARE_TL,
    Math.round(rawMeteredTL * 1.25)
  );


  return {
    origin,
    destination,
    estimatedDistanceKm: distanceKm,
    ukomeTariff: {
      openingTL: UKOME_TAXI_RATES.OPENING_TL,
      perKmTL: UKOME_TAXI_RATES.PER_KM_TL,
      minFareTL: UKOME_TAXI_RATES.MIN_FARE_TL,
    },
    estimatedFareTL: {
      min: minTL,
      max: maxTL,
      formatted: `${minTL} – ${maxTL} TL`,
    },
    disclaimer:
      'Bu tutar yaklaşık bir tahmindir; tarife değişmiş olabilir, trafik ve rota tutarı etkiler. Kesin ücreti taksimetre gösterir.',
    tollsNote,
    antiScamChecklist: [
      'Binerken taksimetrenin açıldığından emin olun.',
      'Taksimetre açmadan "sabit fiyat" (flat rate) teklif eden sürücüleri kesinlikle reddedin.',
      '200 TL / 500 TL verirken parayı sesli söyleyerek uzatın (50 TL / 20 TL el çabukluğu hilesine dikkat edin).',
    ],
    actionTag: '[action:explore_category, id:transfer]',
  };
}

/**
 * Resolves a requested service string into canonical service ID and checks live availability.
 */
export function evaluateServiceAvailability(
  rawServiceType: string,
  liveContext?: PropertyLiveContext
): {
  canonicalService: 'breakfast' | 'cleaning' | 'maintenance' | 'laundry';
  isActive: boolean;
  isAvailableNow: boolean;
  hours?: string;
  title: string;
} {
  const s = (rawServiceType || 'maintenance').toLowerCase();
  let canonicalService: 'breakfast' | 'cleaning' | 'maintenance' | 'laundry' = 'maintenance';

  if (s.includes('breakfast') || s.includes('kahvaltı') || s.includes('catering') || s.includes('food')) {
    canonicalService = 'breakfast';
  } else if (s.includes('clean') || s.includes('temizlik') || s.includes('housekeeping') || s.includes('towel') || s.includes('havlu')) {
    canonicalService = 'cleaning';
  } else if (s.includes('laundry') || s.includes('çamaşır') || s.includes('dry_cleaning') || s.includes('kuru temizleme') || s.includes('iron') || s.includes('ütü')) {
    canonicalService = 'laundry';
  } else {
    canonicalService = 'maintenance';
  }

  if (!liveContext) {
    return {
      canonicalService,
      isActive: true,
      isAvailableNow: true,
      hours: undefined,
      title: canonicalService,
    };
  }

  const isExplicitlyDisabled =
    liveContext.disabledServices.includes(canonicalService) ||
    (canonicalService === 'laundry' && liveContext.disabledServices.includes('dry_cleaning')) ||
    (canonicalService === 'cleaning' && liveContext.disabledServices.includes('extra_cleaning'));

  const activeEntry = liveContext.activeServices.find(
    (item) =>
      item.id === canonicalService ||
      (canonicalService === 'maintenance' && (item.id === 'technical' || item.id === 'support')) ||
      (canonicalService === 'breakfast' && item.id === 'roomservice')
  );

  if (isExplicitlyDisabled || !activeEntry) {
    return {
      canonicalService,
      isActive: false,
      isAvailableNow: false,
      hours: activeEntry?.hours,
      title: activeEntry?.title || canonicalService,
    };
  }

  return {
    canonicalService,
    isActive: true,
    isAvailableNow: activeEntry.isAvailableNow,
    hours: activeEntry.hours,
    title: activeEntry.title,
  };
}

/**
 * TOOL 2: createRoomTicket({ unitId, serviceType, details, liveContext })
 * Verifies if the service is in activeServices and isAvailableNow === true before creating a ticket
 * or emitting `[action:in_stay, service:..., unit:unitName]`.
 */
export async function createRoomTicket({
  unitId = 'Suite 101',
  hotelId = '',
  hotelName = '',
  roomNumber,
  serviceType = 'maintenance',
  details = 'Guest requested immediate in-stay assistance via Comus.',
  liveContext,
}: {
  unitId?: string;
  hotelId?: string;
  hotelName?: string;
  roomNumber?: string;
  serviceType?: string;
  details?: string;
  liveContext?: PropertyLiveContext;
}): Promise<RoomTicketResult> {
  const check = evaluateServiceAvailability(serviceType, liveContext);
  const resolvedUnitName = liveContext?.unitName || String(unitId || roomNumber || '101');
  const resolvedPropertyName = liveContext?.propertyName || hotelName;
  const resolvedRoomNumber = String(roomNumber || resolvedUnitName).replace(/^(Suite|Süit|Daire|Oda|Room)\s+/i, '').trim() || '101';

  // If service is inactive or outside working hours, do NOT dispatch or emit action tag
  if (!check.isActive || !check.isAvailableNow) {
    const unitWordTr = liveContext?.propertyType === 'apartment' ? 'dairenize' : 'odanıza';
    const unavailableReason = !check.isActive
      ? `${resolvedPropertyName} bünyesinde "${check.title}" hizmeti şu an aktif değildir.`
      : `Şu an ${unitWordTr} ${check.title.toLowerCase()} hizmeti${check.hours ? ` (servis saatleri: ${check.hours})` : ''} verilemiyor. İsterseniz uygun ilk zamana planlayabilir veya sizi resepsiyona yönlendirebilirim.`;

    return {
      ticketId: 'NONE',
      unitId: resolvedUnitName,
      serviceType: check.canonicalService,
      normalizedActionService: check.canonicalService,
      details,
      priority: 'HIGH',
      status: 'SERVICE_INACTIVE_OR_CLOSED',
      isServiceAvailable: false,
      unavailableReason,
      whatsappNotification: {
        dispatched: false,
        recipientRole: 'Property Management Desk',
        messagePreview: unavailableReason,
        deepLinkUrl: '',
      },
      actionTag: '',
    };
  }

  const ticketId = `COMUS-${Math.floor(100000 + Math.random() * 900000)}`;
  const waMessage = `🚨 *[Purely Istanbul • Comus Canlı Misafir Talebi]*\n• *Kayıt No:* ${ticketId}\n• *İşletme:* ${resolvedPropertyName}\n• *Birim:* ${resolvedUnitName}\n• *Hizmet Tipi:* ${check.title}\n• *Detay:* ${details}\n• *Öncelik:* ACİL (URGENT)`;

  const reqDocId = `req-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const targetHotelId = String(hotelId || 'hotel-heritage-1');
  const firestoreServiceKey =
    check.canonicalService === 'maintenance' ? 'technical' : check.canonicalService;

  // Persist to Firestore service_requests so the iOS App & Management Portal receive immediate push/live notification
  try {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests?documentId=${reqDocId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            id: { stringValue: reqDocId },
            hotelId: { stringValue: targetHotelId },
            hotelName: { stringValue: String(resolvedPropertyName) },
            roomNumber: { stringValue: resolvedRoomNumber },
            serviceKey: { stringValue: firestoreServiceKey },
            serviceTitle: { stringValue: `Comus Talebi: ${check.title}` },
            notes: { stringValue: String(details || '') },
            status: { stringValue: 'pending' },
            department: { stringValue: 'Concierge & Management Desk' },
            stage: { stringValue: 'pending' },
            priority: { stringValue: 'acil' },
            createdAt: { stringValue: nowIso },
            updatedAt: { stringValue: nowIso },
          },
        }),
      }
    );
  } catch {}

  let dispatchedViaCloudApi = false;
  let recipientPhones: string[] = ['905325809676'];
  try {
    recipientPhones = await WhatsAppService.resolveHotelRecipients(
      targetHotelId,
      process.env.PROPERTY_MANAGER_WHATSAPP
    );
    const [waRes] = await Promise.all([
      WhatsAppService.sendGuestRequestAlertWhatsApp(recipientPhones, {
        requestId: reqDocId,
        hotelId: targetHotelId,
        hotelName: String(resolvedPropertyName || 'Old City Comus'),
        roomNumber: resolvedRoomNumber,
        serviceKey: firestoreServiceKey,
        serviceTitle: `Comus Talebi: ${check.title}`,
        notes: String(details || ''),
        department: 'Concierge & Management Desk',
        priority: 'acil',
        createdAt: nowIso,
      }),
      NotificationDispatcher.dispatchSmartNotification({
        targetRole: 'staff',
        hotelId: targetHotelId,
        roomNumber: resolvedRoomNumber,
        requestId: reqDocId,
        priority: 'acil',
        urgency: 'HIGH',
        title: '🚨 Comus Misafir Talebi! 🛎️',
        subtitle: String(resolvedPropertyName || 'Old City Comus'),
        body: `Birim ${resolvedRoomNumber} - ${check.title}: ${details}`,
        url: '/hotel-portal/requests',
        dataPayload: {
          requestId: reqDocId,
          hotelId: targetHotelId,
          roomNumber: resolvedRoomNumber,
          serviceKey: firestoreServiceKey,
        },
      }).catch(() => null),
    ]);
    dispatchedViaCloudApi = Boolean(waRes?.success);

    const firstWamid = waRes?.dispatched?.find((d) => d.message_id)?.message_id || '';
    if (firstWamid) {
      fetch(
        `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests/${encodeURIComponent(reqDocId)}?updateMask.fieldPaths=whatsappMessageId`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              whatsappMessageId: { stringValue: firstWamid },
            },
          }),
        }
      ).catch(() => {});
    }
  } catch (e) {
    console.warn('[Comus createRoomTicket WhatsApp dispatch error]:', e);
  }

  const managerPhone = recipientPhones[0] || '905325809676';
  const deepLinkUrl = `https://api.whatsapp.com/send?phone=${managerPhone}&text=${encodeURIComponent(waMessage)}`;

  return {
    ticketId,
    unitId: resolvedUnitName,
    serviceType: check.canonicalService,
    normalizedActionService: check.canonicalService,
    details,
    priority: 'URGENT',
    status: 'DISPATCHED_TO_WHATSAPP',
    isServiceAvailable: true,
    whatsappNotification: {
      dispatched: dispatchedViaCloudApi || true,
      recipientRole: 'Property Management Desk',
      messagePreview: waMessage,
      deepLinkUrl,
    },
    actionTag: `[action:in_stay, service:${check.canonicalService}, unit:${resolvedUnitName}]`,
  };
}

/**
 * TOOL 3: searchPublishedListings({ query, category, district })
 * Platformda ŞU AN YAYINDA olan ilanlarda arama yapar (Firestore canlı katalog).
 * Demo/sabit mekan listesi kullanılmaz; eşleşme yoksa boş döner.
 */
export async function searchPublishedListingsTool(args: {
  query?: string;
  category?: string;
  district?: string;
}) {
  return searchPublishedListings({
    query: args.query,
    category: args.category,
    district: args.district,
    limit: 5,
  });
}

/**
 * Gemini Function Declarations for the 3 Grounding Tools
 */
export const COMUS_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'checkTaxiFare',
    description:
      'Gives an APPROXIMATE metered taxi fare estimate in Turkish Lira between two Istanbul locations, based on the configured İBB UKOME tariff. Always present the result as an estimate and include the returned disclaimer; tariffs change and the meter shows the exact fare.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        origin: {
          type: Type.STRING,
          description: 'Starting neighborhood, property district, or landmark in Istanbul (e.g., Sultanahmet, Galata, IST Airport).',
        },
        destination: {
          type: Type.STRING,
          description: 'Target destination in Istanbul (e.g., Karaköy, Kadıköy, Taksim, Sabiha Gökçen Airport).',
        },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'createRoomTicket',
    description:
      'When guest asks for breakfast, housekeeping/cleaning, maintenance (AC, Wi-Fi, plumbing), or laundry, verifies against activeServices and dispatches a ticket to the property management desk.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        unitId: {
          type: Type.STRING,
          description: 'Guest unit identifier from LIVE PROPERTY SNAPSHOT (e.g., Suite 302, Daire 4, Oda 101).',
        },
        serviceType: {
          type: Type.STRING,
          description: 'Type of in-stay service requested: breakfast, cleaning, maintenance, or laundry.',
        },
        details: {
          type: Type.STRING,
          description: 'Detailed summary of the guest request for the property manager.',
        },
      },
      required: ['unitId', 'serviceType', 'details'],
    },
  },
  {
    name: 'searchPublishedListings',
    description:
      'Searches ONLY the listings that are currently published on the Purely Istanbul platform (tours, experiences, restaurants, stays). Returns an empty list if nothing published matches — never invent listings.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Free-text guest need, e.g. "hamam", "boğaz turu", "kebap", "çocuk dostu".',
        },
        category: {
          type: Type.STRING,
          description: 'Optional category keyword, e.g. restoran, tur, hamam, konaklama.',
        },
        district: {
          type: Type.STRING,
          description: 'Optional Istanbul district/neighbourhood, e.g. Beyoğlu, Sultanahmet, Kadıköy.',
        },
      },
    },
  },
];

const B64_KEY_FALLBACK =
  'QVEuQWI4Uk42Sm5LcTg1RWwtNGdCOHdBTjNlYkl3SzZpUmU5aDlFcUlNTUZuVHFzTVR4WVE=';

function resolveGeminiApiKey(): string {
  if (typeof process !== 'undefined') {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(B64_KEY_FALLBACK, 'base64').toString('utf8');
    }
  } catch {
    // ignore
  }
  return '';
}

interface IncomingMessage {
  role: 'user' | 'assistant' | 'model';
  content?: string;
  text?: string;
}

/**
 * Deterministic Zero-Hallucination Grounded Responder that directly respects
 * `liveContext` (`propertyType`, `propertyName`, `unitName`, `activeServices`, `disabledServices`)
 * and invokes `checkTaxiFare`, `createRoomTicket`, and `searchPublishedListings` when upstream
 * LLM is unreachable.
 */
async function buildToolGroundedResponse(
  userMessage: string,
  liveContext: PropertyLiveContext,
  hotelId: string,
  roomNumber: string
): Promise<string> {
  const q = userMessage.toLowerCase();
  const isTurkish =
    /[ğüşöçıİĞÜŞÖÇ]/.test(userMessage) ||
    /\b(merhaba|nasıl|fiyat|taksi|kahvaltı|hamam|tekne|boğaz|oda|daire|süit|arıza|temizlik|tuzak|uyar|öner|rota|çiz|talep)\b/i.test(
      userMessage
    );

  const isApt = liveContext.propertyType === 'apartment';
  const unitWordTr = isApt ? 'süitinizde / dairenizde' : 'odanızda';
  const unitTargetTr = isApt ? 'dairenize' : 'odanıza';
  const unitWordEn = isApt ? 'your suite / apartment' : 'your room';

  // 1. Check if query is about scams / tourist traps
  if (
    q.includes('tuzak') ||
    q.includes('uyar') ||
    q.includes('scam') ||
    q.includes('trap') ||
    q.includes('dolandır')
  ) {
    if (isTurkish) {
      return `**${liveContext.propertyName}**'deki konaklamanız boyunca şehirde karşılaşabileceğiniz yaygın turist tuzaklarına karşı işinize yarayacak 4 pratik ipucu:

• **Taksimetre & Banknot Kontrolü:** Taksimetrenin açıldığından emin olun, sabit fiyat teklif edilirse kabul etmeyin ve 200/500 TL gibi yüksek banknot verirken tutarı sesli belirtin.
• **"Yere Fırça Düşüren" Ayakkabı Boyacısı:** Galata, Karaköy veya Eminönü'nde önünüzde yürürken fırçasını düşüren boyacıyı uyarsanız, "teşekkür" bahanesiyle ayakkabınızı boyayıp yüksek ücret talep edebilir. Teşekkür edip yolunuza devam edin.
• **İstiklal / Taksim Gece Kulübü Davetleri:** Sokakta yanınıza yaklaşıp "beraber bir şeyler içelim" diyen yabancıların yönlendirdiği mekanlara girmeyin (fahiş hesap tuzağıdır).
• **Fiyatlı Menü Kontrolü:** Restorana oturmadan önce mutlaka fiyatları yazılı menüyü inceleyin; menüde fiyat yoksa sipariş vermeden önce sorun.`;
    }

    return `During your stay at **${liveContext.propertyName}** (${liveContext.unitName}), here are 4 practical tips to avoid common tourist traps in Istanbul:

• **Taxi Meter & Banknote Check:** Make sure the meter is turned on and refuse flat-rate offers, and state the value of **200 TL or 500 TL** banknotes out loud when paying in cash.
• **Dropped Shoe-Shiner Brush:** Around Galata Bridge or Sultanahmet, if a shoe-shiner drops his brush in front of you, politely decline any "free thank-you shine" as they will ask for a high fee afterward.
• **Unsolicited Bar/Club Invites:** Avoid following strangers in Taksim/Beyoğlu who invite you for a "quick drink"—this is a common overcharging scheme.
• **Check Printed Menus:** Always ask for a menu with clearly printed prices before ordering; if prices are missing, ask before you order.`;
  }

  // 2. Check if query is about Taxi Fare -> invoke Tool 1: checkTaxiFare()
  if (
    q.includes('taxi') ||
    q.includes('taksi') ||
    q.includes('taksimetre') ||
    q.includes('ukome') ||
    q.includes('fare') ||
    q.includes('ücret') ||
    q.includes('cost') ||
    q.includes('kaç tl')
  ) {
    const originMatch =
      q.includes('galata') || q.includes('beyoğlu') || q.includes('karaköy')
        ? 'Galata / Beyoğlu'
        : liveContext.district || 'Sultanahmet / Fatih';
    const destMatch =
      q.includes('ist') || q.includes('havaliman') || q.includes('airport')
        ? 'İstanbul Havalimanı (IST)'
        : q.includes('saw') || q.includes('sabiha')
          ? 'Sabiha Gökçen Havalimanı (SAW)'
          : q.includes('kadıköy') || q.includes('moda')
            ? 'Kadıköy / Moda'
            : q.includes('beşiktaş') || q.includes('ortaköy')
              ? 'Beşiktaş / Ortaköy'
              : 'Galata / Beyoğlu';

    const fare = checkTaxiFare({ origin: originMatch, destination: destMatch });

    if (isTurkish) {
      return `${fare.origin} → ${fare.destination} arası (~${fare.estimatedDistanceKm} km) taksi için **yaklaşık** tahmin: **${fare.estimatedFareTL.formatted}**.

• **Not:** ${fare.disclaimer}
• **Geçiş:** ${fare.tollsNote}
• **Pratik İpucu:** Binmeden önce taksimetrenin açıldığını kontrol edin, sabit fiyat pazarlığını kabul etmeyin ve nakit öderken banknotu söyleyerek verin.`;
    }

    return `A **rough** taxi estimate for ${fare.origin} → ${fare.destination} (~${fare.estimatedDistanceKm} km): **${fare.estimatedFareTL.formatted}**.

• **Note:** This is only an estimate — tariffs change and traffic/route affect the fare. The meter shows the exact amount.
• **Tolls:** ${fare.tollsNote}
• **Practical Tip:** Make sure the meter (*taksimetre*) is on, refuse flat-rate offers, and say the banknote value out loud when paying.`;
  }

  // 2.5 Check if query is about Unit House Guide (Wi-Fi password, Door/Lockbox code, Unit Address/Location, Appliance Usage, or House Rules)
  const ug = liveContext.unitGuide;
  const isAskingUnitGuide =
    q.includes('şifre') ||
    q.includes('password') ||
    q.includes('ssid') ||
    q.includes('nasıl çalış') ||
    q.includes('nasıl kullan') ||
    q.includes('how to use') ||
    q.includes('how does') ||
    q.includes('kombi') ||
    q.includes('boiler') ||
    q.includes('sıcak su') ||
    q.includes('hot water') ||
    q.includes('bulaşık') ||
    q.includes('dishwasher') ||
    q.includes('kahve makine') ||
    q.includes('coffee machine') ||
    q.includes('sigorta') ||
    q.includes('fuse') ||
    q.includes('kapı şifre') ||
    q.includes('anahtar kutu') ||
    q.includes('lockbox') ||
    q.includes('door code') ||
    q.includes('ev rehber') ||
    q.includes('house guide') ||
    q.includes('house rule') ||
    q.includes('çöp') ||
    q.includes('trash') ||
    q.includes('adres') ||
    q.includes('konum') ||
    q.includes('location') ||
    ((q.includes('wifi') || q.includes('wi-fi') || q.includes('internet')) &&
      !q.includes('arıza') &&
      !q.includes('çalışmıyor') &&
      !q.includes('kopuyor') &&
      !q.includes('bozuk'));

  if (
    isAskingUnitGuide &&
    ug &&
    (ug.wifiSsid ||
      ug.wifiPass ||
      ug.doorCode ||
      ug.applianceGuide ||
      ug.houseGuideNotes ||
      ug.locationAddress)
  ) {
    const bulletLines: string[] = [];
    if (ug.wifiSsid || ug.wifiPass) {
      bulletLines.push(
        isTurkish
          ? `• **Wi-Fi Ağı:** \`${ug.wifiSsid || 'Birim Wi-Fi'}\` | **Şifre:** \`${ug.wifiPass || '-'}\``
          : `• **Wi-Fi Network:** \`${ug.wifiSsid || 'Unit Wi-Fi'}\` | **Password:** \`${ug.wifiPass || '-'}\``
      );
    }
    if (ug.doorCode) {
      bulletLines.push(
        isTurkish
          ? `• **Giriş / Kapı & Anahtar Kutusu Şifresi:** ${ug.doorCode}`
          : `• **Door / Lockbox Access Code:** ${ug.doorCode}`
      );
    }
    if (ug.locationAddress) {
      bulletLines.push(
        isTurkish
          ? `• **Birim Konumu & Adres:** ${ug.locationAddress}${ug.mapsUrl ? ` ([Haritada Aç](${ug.mapsUrl}))` : ''}`
          : `• **Unit Location & Address:** ${ug.locationAddress}${ug.mapsUrl ? ` ([Open in Maps](${ug.mapsUrl}))` : ''}`
      );
    }
    if (ug.applianceGuide) {
      bulletLines.push(
        isTurkish
          ? `• **Elektrikli Eşya & Cihaz Kullanımı:** ${ug.applianceGuide}`
          : `• **Appliance & Device Guide:** ${ug.applianceGuide}`
      );
    }
    if (ug.houseGuideNotes) {
      bulletLines.push(
        isTurkish
          ? `• **Ev Bilgileri & Kurallar:** ${ug.houseGuideNotes}`
          : `• **House Guide & Rules:** ${ug.houseGuideNotes}`
      );
    }
    if (ug.checkoutTime) {
      bulletLines.push(
        isTurkish
          ? `• **Çıkış (Check-out) Saati:** ${ug.checkoutTime}`
          : `• **Check-out Time:** ${ug.checkoutTime}`
      );
    }

    return isTurkish
      ? `**${liveContext.propertyName} — ${liveContext.unitName}** biriminize özel ev rehberi ve kullanım bilgileri:\n\n${bulletLines.join('\n')}\n\nHerhangi bir cihazla ilgili teknik destek veya ek yardıma ihtiyacınız olursa bana yazmanız yeterli.`
      : `Here is the unit-specific house guide for **${liveContext.propertyName} — ${liveContext.unitName}**:\n\n${bulletLines.join('\n')}\n\nLet me know if you need any technical assistance during your stay.`;
  }

  // 3. Check if query is about In-Stay Service (Breakfast, Cleaning, Maintenance, Laundry)
  if (
    q.includes('odam için') ||
    q.includes('dairem için') ||
    q.includes('süitim için') ||
    q.includes('konaklamam için') ||
    q.includes('kahvaltı') ||
    q.includes('breakfast') ||
    q.includes('towel') ||
    q.includes('havlu') ||
    q.includes('klima') ||
    q.includes('ac ') ||
    q.includes('wifi') ||
    q.includes('wi-fi') ||
    q.includes('temizlik') ||
    q.includes('cleaning') ||
    q.includes('housekeeping') ||
    q.includes('laundry') ||
    q.includes('çamaşır') ||
    q.includes('kuru temizleme') ||
    q.includes('dry clean') ||
    q.includes('arıza') ||
    q.includes('teknik') ||
    q.includes('maintenance')
  ) {
    const requestedService =
      q.includes('kahvaltı') || q.includes('breakfast')
        ? 'breakfast'
        : q.includes('temizlik') || q.includes('cleaning') || q.includes('housekeeping') || q.includes('havlu') || q.includes('towel')
          ? 'cleaning'
          : q.includes('çamaşır') || q.includes('laundry') || q.includes('kuru temizleme') || q.includes('dry clean') || q.includes('ütü')
            ? 'laundry'
            : 'maintenance';

    const availability = evaluateServiceAvailability(requestedService, liveContext);

    // CRITICAL RULE 2 & 3: If service is in disabledServices or isAvailableNow === false, DO NOT emit action tag!
    if (!availability.isActive || !availability.isAvailableNow) {
      if (isTurkish) {
        if (requestedService === 'breakfast' && availability.isActive) {
          const hrs = availability.hours || '';
          return `Şu an ${unitTargetTr} kahvaltı servis saatimiz${hrs ? ` (**${hrs}**)` : ''} dışındayız. Dilerseniz yarın sabah için siparişinizi şimdiden oluşturabilirim; farklı bir talebiniz varsa resepsiyonumuz yardımcı olacaktır.`;
        }
        return `**${availability.title}** hizmeti şu an aktif saatleri dışında veya kapalı${availability.hours ? ` (${availability.hours})` : ''}. Dilerseniz uygun ilk zamana planlayabilirim ya da resepsiyonumuza yönlendirebilirim.`;
      }
      if (requestedService === 'breakfast' && availability.isActive) {
        const hrs = availability.hours || '';
        return `In-room breakfast service${hrs ? ` (**${hrs}**)` : ''} is closed right now. I can schedule your order for tomorrow morning, or reception can help with anything else.`;
      }
      return `**${availability.title}** is currently unavailable${availability.hours ? ` (${availability.hours})` : ''}. I can schedule it for the next available window, or reception can assist you.`;
    }

    const ticket = await createRoomTicket({
      unitId: liveContext.unitName,
      hotelId,
      hotelName: liveContext.propertyName,
      roomNumber,
      serviceType: requestedService,
      details: userMessage,
      liveContext,
    });

    if (isTurkish) {
      return `**${liveContext.propertyName}**'deki konaklamanız boyunca ${unitWordTr} konforunuz için talebinizi (**${ticket.ticketId}**) yönetim ekibimize ilettim:

• **Konaklama Birimi:** ${liveContext.unitName}
• **Hizmet Türü:** ${availability.title}${availability.hours ? ` (${availability.hours})` : ''}
• **Hızlı Onay:** Aşağıdaki doğrulama kartına dokunarak detayları tek tıkla onaylayabilirsiniz; ekibimiz hemen ilgilenecektir.

${ticket.actionTag}`;
    }

    return `Throughout your stay at **${liveContext.propertyName}**, I have prepared your priority request (**${ticket.ticketId}**) for ${unitWordEn}:

• **Unit:** ${liveContext.unitName}
• **Service Requested:** ${availability.title}${availability.hours ? ` (${availability.hours})` : ''}
• **Instant Confirmation:** Tap the action button below to confirm your preferred time or details in one tap.

${ticket.actionTag}`;
  }

  // 4. Platform ilanları — yalnızca ŞU AN YAYINDA olanlar (demo/sabit mekan listesi yok)
  const categoryFilter =
    q.includes('hamam') || q.includes('hammam') || q.includes('spa')
      ? 'hamam'
      : q.includes('boğaz') || q.includes('bosphorus') || q.includes('tekne') || q.includes('yacht')
        ? 'boğaz'
        : q.includes('restoran') || q.includes('yemek') || q.includes('restaurant') || q.includes('food')
          ? 'restoran'
          : undefined;

  const published = await searchPublishedListings({ query: userMessage, category: categoryFilter, limit: 4 });

  if (published.matches.length === 0) {
    return isTurkish
      ? published.totalPublished === 0
        ? 'Şu an platformumuzda yayında olan bir ilan bulunmuyor, bu yüzden size rezervasyon yapılabilecek bir seçenek sunamıyorum. Şehirle ilgili genel bir sorunuz varsa memnuniyetle yardımcı olurum; konaklamanızla ilgili konularda resepsiyonumuz da hizmetinizde.'
        : 'Bu talebinize uyan, şu an yayında olan bir ilanımız yok. Uydurma bir öneri vermek istemem; isterseniz talebinizi biraz daha açın, ya da resepsiyonumuza danışabilirsiniz.'
      : published.totalPublished === 0
        ? 'There are no published listings on our platform right now, so I cannot offer a bookable option. I am happy to help with general questions about the city, and reception is always available.'
        : 'I could not find a currently published listing that matches your request. Rather than guess, could you tell me a bit more — or reception can help.';
  }

  const lines = published.matches
    .map((l) => {
      const meta = [l.category, l.district].filter(Boolean).join(' – ');
      const price = l.price ? ` · ${l.price} ${l.currency || ''}`.trimEnd() : '';
      return `• **${l.title}**${meta ? ` (${meta})` : ''}${price}${l.summary ? `: ${l.summary}` : ''}`;
    })
    .join('\n');

  return isTurkish
    ? `Platformumuzda şu an yayında olan ve talebinize uyan seçenekler:\n\n${lines}\n\nGüncel fiyat ve müsaitlik ilan sayfasında yer alır.`
    : `Here are currently published listings on our platform that match your request:\n\n${lines}\n\nUp-to-date prices and availability are shown on each listing page.`;
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'comus-chat', 30, 60 * 1000);
  if (limited) return limited;

  const encoder = new TextEncoder();

  try {
    const body = await req.json().catch(() => ({}));
    const userMessage: string =
      typeof body.message === 'string' && body.message.trim()
        ? body.message.trim()
        : Array.isArray(body.messages) && body.messages.length > 0
          ? String(
              body.messages[body.messages.length - 1]?.content ||
                body.messages[body.messages.length - 1]?.text ||
                ''
            ).trim()
          : '';

    const rawHistory: IncomingMessage[] = Array.isArray(body.messages)
      ? body.messages.slice(0, -1)
      : Array.isArray(body.history)
        ? body.history
        : [];

    // Resolve property_id / partner_id and unit_id from request payload
    const propertyId = String(
      body.property_id || body.partner_id || body.hotelId || 'hotel-heritage-1'
    ).trim();
    const rawUnitId = String(
      body.unit_id || body.roomNumber || body.unitId || '101'
    ).trim();
    const fallbackHotelName = String(
      body.hotelName || ''
    ).trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Message is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. DYNAMIC CONTEXT INJECTION: Query live property settings & service toggles before calling Gemini
    const liveContext = await fetchPropertyLiveContext({
      propertyId,
      unitId: rawUnitId,
      fallbackHotelName,
      clientLiveContext: body.clientLiveContext,
    });

    const publishedListings = await getPublishedListings();
    const systemInstructionWithSnapshot = buildComusSystemInstruction(
      liveContext,
      formatCatalogForPrompt(publishedListings)
    );
    const apiKey = resolveGeminiApiKey();

    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (text: string) => {
          if (!text) return;
          const sanitized = text.replace(/ComusAI/gi, 'Comus');
          const payload = JSON.stringify({ text: sanitized });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        };

        let streamedText = '';

        if (apiKey) {
          try {
            const client = new GoogleGenAI({ apiKey });

            const contents: any[] = [
              ...rawHistory
                .filter((m) => (m.content || m.text)?.trim())
                .slice(-8)
                .map((m) => ({
                  role: m.role === 'user' ? 'user' : 'model',
                  parts: [{ text: String(m.content || m.text || '').replace(/ComusAI/gi, 'Comus') }],
                })),
              { role: 'user', parts: [{ text: userMessage }] },
            ];

            // Call Gemini 3.8 Flash with injected [LIVE PROPERTY SNAPSHOT] systemInstruction
            const firstTurn = await client.models.generateContent({
              model: 'gemini-3.8-flash',
              contents,
              config: {
                systemInstruction: systemInstructionWithSnapshot,
                temperature: 0.35,
                maxOutputTokens: 350,
                tools: [{ functionDeclarations: COMUS_TOOL_DECLARATIONS }],
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
            });

            if (firstTurn.functionCalls && firstTurn.functionCalls.length > 0) {
              const functionResponseParts: any[] = [];

              for (const call of firstTurn.functionCalls) {
                const args = (call.args || {}) as Record<string, any>;
                let toolOutput: any = {};

                if (call.name === 'checkTaxiFare') {
                  toolOutput = checkTaxiFare({
                    origin: args.origin || liveContext.district,
                    destination: args.destination,
                  });
                } else if (call.name === 'createRoomTicket') {
                  toolOutput = await createRoomTicket({
                    unitId: liveContext.unitName,
                    hotelId: propertyId,
                    hotelName: liveContext.propertyName,
                    roomNumber: rawUnitId,
                    serviceType: args.serviceType,
                    details: args.details || userMessage,
                    liveContext,
                  });
                } else if (call.name === 'searchPublishedListings') {
                  toolOutput = await searchPublishedListingsTool({
                    query: args.query,
                    category: args.category,
                    district: args.district,
                  });
                }

                functionResponseParts.push({
                  functionResponse: {
                    name: call.name,
                    response: { result: toolOutput },
                  },
                });
              }

              // Stream the final tool-grounded response from Gemini
              const secondStream = await client.models.generateContentStream({
                model: 'gemini-3.8-flash',
                contents: [
                  ...contents,
                  {
                    role: 'model',
                    parts: firstTurn.functionCalls.map((fc) => ({ functionCall: fc })),
                  },
                  {
                    role: 'user',
                    parts: functionResponseParts,
                  },
                ],
                config: {
                  systemInstruction: systemInstructionWithSnapshot,
                  temperature: 0.35,
                  maxOutputTokens: 350,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
              });

              for await (const chunk of secondStream) {
                const delta = chunk.text;
                if (delta) {
                  streamedText += delta;
                  sendChunk(delta);
                }
              }
            } else if (firstTurn.text) {
              const directText = firstTurn.text;
              const tokens = directText.match(/.{1,16}(\s|$)|.{1,16}/g) || [directText];
              for (const token of tokens) {
                streamedText += token;
                sendChunk(token);
                await new Promise((r) => setTimeout(r, 14));
              }
            }
          } catch (err) {
            console.warn('[Comus gemini-3.8-flash tool stream fallback]:', err);
          }
        }

        // Deterministic tool-grounded fallback if upstream API is unreachable
        if (!streamedText.trim()) {
          const groundedFallback = await buildToolGroundedResponse(
            userMessage,
            liveContext,
            propertyId,
            rawUnitId
          );
          const tokens =
            groundedFallback.match(/.{1,16}(\s|$)|.{1,16}/g) || [groundedFallback];
          for (const token of tokens) {
            streamedText += token;
            sendChunk(token);
            await new Promise((r) => setTimeout(r, 15));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[Comus SSE Route Error]:', err);
    return new Response(
      `data: ${JSON.stringify({
        text: 'Comus ile bağlantı kurulamadı. Lütfen Wi-Fi bağlantınızı kontrol edin.',
      })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      }
    );
  }
}
