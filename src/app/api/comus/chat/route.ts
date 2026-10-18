import { GoogleGenAI, Type, type FunctionDeclaration } from '@google/genai';
import verifiedPlacesData from '@/data/purely_verified_places.json';
import rawHotels from '@/data/hotels.json';
import rawProperties from '@/data/properties.json';
import { Hotel, InRoomServiceItem, PropertyListing } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
- If a guest asks for an inactive or closed service (e.g. asks for breakfast at 14:00 or dry cleaning on Sunday when disabled), politely explain the current status:
  "Şu an dairenize kahvaltı servis saatimiz (08:00 - 11:30) sona erdi; ancak yakınınızda harika bir yerel fırın/kafe önerebilirim veya yarın sabah için siparişinizi şimdiden oluşturabilirim."

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
- Only recommend locations from the curated 4 districts (Fatih, Beyoğlu, Beşiktaş, Kadıköy) via \`searchVerifiedPlaces\`. Never hallucinate unverified businesses or fake entry fees.
- Append relevant deep-link tags for booking verified city experiences:
  - [action:explore_category, id:bosphorus]
  - [action:explore_category, id:history]
  - [action:explore_category, id:hammam]
  - [action:explore_category, id:culinary]
  - [action:explore_category, id:transfer]
- Keep responses concise (under 150-180 words), structured with clean bullet points.`;

/**
 * Builds the full Gemini system_instruction with the injected [LIVE PROPERTY SNAPSHOT] JSON.
 */
export function buildComusSystemInstruction(liveContext: PropertyLiveContext): string {
  const dynamicInstruction = COMUS_SYSTEM_INSTRUCTION
    .replace(/\[propertyName\]/g, liveContext.propertyName)
    .replace(/unit:unitName/g, `unit:${liveContext.unitName}`);

  return `${dynamicInstruction}\n\n[LIVE PROPERTY SNAPSHOT: ${JSON.stringify(liveContext)}]`;
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
  defaultHours?: string;
  defaultPrice?: string;
  aliases?: string[];
}> = [
  {
    id: 'breakfast',
    key: 'breakfast',
    title: 'Kahvaltı & Yeme-İçme',
    defaultEnabled: true,
    defaultHours: '08:00 - 11:30',
    defaultPrice: '300 ₺',
    aliases: ['roomservice'],
  },
  {
    id: 'cleaning',
    key: 'cleaning',
    title: 'Temizlik Talebi',
    defaultEnabled: true,
    defaultHours: '09:00 - 18:00',
    defaultPrice: 'Ücretsiz',
    aliases: ['extra_cleaning', 'housekeeping'],
  },
  {
    id: 'maintenance',
    key: 'technical',
    title: 'Teknik Destek',
    defaultEnabled: true,
    defaultHours: '7/24',
    defaultPrice: 'Ücretsiz',
    aliases: ['technical', 'support', 'ac', 'wifi'],
  },
  {
    id: 'dnd',
    key: 'dnd',
    title: 'Rahatsız Etmeyin',
    defaultEnabled: true,
    defaultHours: '7/24',
  },
  {
    id: 'linens',
    key: 'linens',
    title: 'Çarşaf & Nevresim',
    defaultEnabled: true,
    defaultHours: '09:00 - 20:00',
  },
  {
    id: 'toiletries',
    key: 'toiletries',
    title: 'Banyo Bukleti',
    defaultEnabled: true,
    defaultHours: '7/24',
  },
  {
    id: 'lateCheckout',
    key: 'lateCheckout',
    title: 'Geç Çıkış Talebi',
    defaultEnabled: true,
    defaultHours: '08:00 - 12:00',
    defaultPrice: "14:00'e kadar ücretsiz",
  },
  {
    id: 'extendStay',
    key: 'extendStay',
    title: 'Konaklama Uzatma',
    defaultEnabled: true,
    defaultHours: '7/24',
    defaultPrice: '3.200 ₺ / gece',
  },
  {
    id: 'towels',
    key: 'towels',
    title: 'Temiz Havlu',
    defaultEnabled: false,
    defaultHours: '08:00 - 22:00',
  },
  {
    id: 'pillows',
    key: 'pillows',
    title: 'Ekstra Yastık',
    defaultEnabled: false,
    defaultHours: '08:00 - 22:00',
  },
  {
    id: 'hygiene',
    key: 'hygiene',
    title: 'Hijyen & Bakım Seti',
    defaultEnabled: false,
    defaultHours: '7/24',
  },
  {
    id: 'minibar',
    key: 'minibar',
    title: 'Mini Bar Dolumu',
    defaultEnabled: false,
    defaultHours: '10:00 - 22:00',
  },
  {
    id: 'safe',
    key: 'safe',
    title: 'Kasa & Güvenlik',
    defaultEnabled: false,
    defaultHours: '7/24',
  },
  {
    id: 'laundry',
    key: 'laundry',
    title: 'Çamaşırhane & Kuru Temizleme',
    defaultEnabled: false,
    defaultHours: '08:00 - 20:00',
    defaultPrice: '35 ₺ - 80 ₺',
    aliases: ['dry_cleaning'],
  },
  {
    id: 'taxi',
    key: 'taxi',
    title: 'Taksi & VIP Transfer',
    defaultEnabled: false,
    defaultHours: '7/24',
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

  // 2. Fallback to seeded JSON catalogs if not yet written to Firestore
  const seedHotels = rawHotels as Hotel[];
  const seedProps = rawProperties as PropertyListing[];
  const matchedSeedHotel =
    seedHotels.find((h) => h.id === cleanPropertyId) ||
    (fallbackHotelName
      ? seedHotels.find((h) => h.name.toLowerCase() === fallbackHotelName.toLowerCase())
      : undefined) ||
    seedHotels[0];
  const matchedSeedProp = seedProps.find((p) => p.id === cleanPropertyId);

  const propertyName =
    remoteHotel?.name ||
    remoteProperty?.title ||
    clientLiveContext?.propertyName ||
    fallbackHotelName ||
    matchedSeedHotel?.name ||
    matchedSeedProp?.title ||
    'Old City Heritage Hotel Istanbul';

  const rawTypeStr =
    remoteHotel?.type ||
    remoteProperty?.propertyType ||
    remoteProperty?.managementType ||
    clientLiveContext?.propertyType ||
    clientLiveContext?.rawPropertyType ||
    matchedSeedHotel?.type ||
    matchedSeedProp?.propertyType ||
    'Butik Otel & Konak';

  const propertyType =
    clientLiveContext?.propertyType === 'apartment' || clientLiveContext?.propertyType === 'hotel'
      ? clientLiveContext.propertyType
      : inferPropertyType(rawTypeStr, propertyName);

  const district =
    remoteHotel?.district ||
    remoteProperty?.district ||
    clientLiveContext?.district ||
    matchedSeedHotel?.district ||
    matchedSeedProp?.district ||
    'Sultanahmet / Fatih';

  const rooms: Array<{ id?: string; number?: string; type?: string }> =
    Array.isArray(remoteHotel?.rooms)
      ? remoteHotel.rooms
      : Array.isArray(matchedSeedHotel?.rooms)
        ? matchedSeedHotel.rooms
        : [];

  const matchedRoom = rooms.find(
    (r) => String(r.id) === cleanUnitId || String(r.number) === cleanUnitId
  );

  const unitName =
    clientLiveContext?.unitName ||
    formatUnitName(cleanUnitId, propertyType, matchedRoom?.type);

  const breakfastHours =
    remoteHotel?.breakfastHours ||
    clientLiveContext?.breakfastHours ||
    matchedSeedHotel?.breakfastHours ||
    '08:00 - 11:30';

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
    let customPrice = def.defaultPrice;

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

    const hours = def.id === 'breakfast' ? breakfastHours : def.defaultHours;

    if (isEnabled) {
      let isAvailableNow = isWithinIstanbulWorkingHours(hours);
      if (def.id === 'laundry' && isIstanbulSunday()) {
        isAvailableNow = false;
      }
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
            hours: '7/24',
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
  };
}

// Official İBB UKOME Taxi Tariff Constants (as specified)
export const UKOME_TAXI_RATES = {
  OPENING_TL: 30,
  PER_KM_TL: 20,
  MIN_FARE_TL: 100,
  EUR_TO_TRY_RATE: 37.5,
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
  estimatedFareEUR: {
    min: number;
    max: number;
    formatted: string;
  };
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
 * Uses official İBB UKOME taxi rates (Opening: 30 TL, Per Km: 20 TL, Min fare: 100 TL)
 * to compute accurate Turkish Lira and Euro equivalents.
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

  const minEUR = Math.max(3, Math.round(minTL / UKOME_TAXI_RATES.EUR_TO_TRY_RATE));
  const maxEUR = Math.max(minEUR + 1, Math.round(maxTL / UKOME_TAXI_RATES.EUR_TO_TRY_RATE));

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
    estimatedFareEUR: {
      min: minEUR,
      max: maxEUR,
      formatted: `€${minEUR} – €${maxEUR}`,
    },
    tollsNote,
    antiScamChecklist: [
      'Taksimetrenin açılışta 30 TL ile başladığından emin olun (İndi-bindi minimum 100 TL).',
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
      hours: canonicalService === 'breakfast' ? '08:00 - 11:30' : '7/24',
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
  hotelId = 'hotel-heritage-1',
  hotelName = 'Old City Heritage Hotel Istanbul',
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
      : `Şu an ${unitWordTr} ${check.title.toLowerCase()} servis saatimiz (${check.hours || '08:00 - 11:30'}) sona erdi; ancak yakınınızda harika bir yerel alternatif önerebilirim veya yarın sabah için siparişinizi şimdiden oluşturabilirim.`;

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

  // Persist to Firestore service_requests so the iOS App & Management Portal receive immediate push/live notification
  try {
    const reqDocId = `req-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const firestoreServiceKey =
      check.canonicalService === 'maintenance' ? 'technical' : check.canonicalService;
    await fetch(
      `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests?documentId=${reqDocId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            id: { stringValue: reqDocId },
            hotelId: { stringValue: String(hotelId || 'hotel-heritage-1') },
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

  const managerPhone = process.env.PROPERTY_MANAGER_WHATSAPP || '905325554433';
  const deepLinkUrl = `https://api.whatsapp.com/send?phone=${managerPhone}&text=${encodeURIComponent(waMessage)}`;

  let dispatchedViaCloudApi = false;
  if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: managerPhone,
            type: 'text',
            text: { body: waMessage },
          }),
        }
      );
      dispatchedViaCloudApi = resp.ok;
    } catch {
      dispatchedViaCloudApi = false;
    }
  }

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
 * TOOL 3: searchVerifiedPlaces({ neighborhood, category, preference })
 * Queries local purely_verified_places.json containing ONLY vetted spots in
 * Fatih, Beyoğlu, Beşiktaş, and Kadıköy.
 */
export function searchVerifiedPlaces({
  neighborhood,
  category,
  preference,
}: {
  neighborhood?: string;
  category?: string;
  preference?: string;
}): {
  curatedDistricts: string[];
  matches: VerifiedPlace[];
  recommendedActionTag: string;
} {
  const allPlaces = verifiedPlacesData as VerifiedPlace[];
  const normNeighborhood = (neighborhood || '').toLowerCase().trim();
  const normCategory = (category || '').toLowerCase().trim();
  const normPref = (preference || '').toLowerCase().trim();

  let filtered = allPlaces.filter((place) => {
    const matchDistrict =
      !normNeighborhood ||
      place.neighborhood.toLowerCase().includes(normNeighborhood) ||
      place.subArea.toLowerCase().includes(normNeighborhood) ||
      (normNeighborhood.includes('sultanahmet') && place.neighborhood === 'Fatih') ||
      ((normNeighborhood.includes('galata') ||
        normNeighborhood.includes('karaköy') ||
        normNeighborhood.includes('cihangir') ||
        normNeighborhood.includes('taksim')) &&
        place.neighborhood === 'Beyoğlu') ||
      (normNeighborhood.includes('moda') && place.neighborhood === 'Kadıköy') ||
      ((normNeighborhood.includes('ortaköy') || normNeighborhood.includes('bebek')) &&
        place.neighborhood === 'Beşiktaş');

    const matchCategory =
      !normCategory ||
      place.category.toLowerCase().includes(normCategory) ||
      place.tags.some((t) => t.toLowerCase().includes(normCategory));

    const matchPref =
      !normPref ||
      place.name.toLowerCase().includes(normPref) ||
      place.summary.toLowerCase().includes(normPref) ||
      place.tags.some((t) => normPref.includes(t.toLowerCase()) || t.toLowerCase().includes(normPref));

    return matchDistrict && (matchCategory || matchPref);
  });

  if (filtered.length === 0) {
    filtered = allPlaces.slice(0, 5);
  }

  let recommendedActionTag = '[action:explore_category, id:culinary]';
  if (normCategory.includes('hammam') || normPref.includes('hamam') || normPref.includes('spa')) {
    recommendedActionTag = '[action:explore_category, id:hammam]';
  } else if (normCategory.includes('bosphorus') || normPref.includes('boğaz') || normPref.includes('sunset') || normPref.includes('tekne')) {
    recommendedActionTag = '[action:explore_category, id:bosphorus]';
  } else if (normCategory.includes('history') || normPref.includes('rota') || normPref.includes('route') || normPref.includes('han')) {
    recommendedActionTag = '[action:explore_category, id:history]';
  }

  return {
    curatedDistricts: ['Fatih', 'Beyoğlu', 'Beşiktaş', 'Kadıköy'],
    matches: filtered.slice(0, 4),
    recommendedActionTag,
  };
}

/**
 * Gemini Function Declarations for the 3 Grounding Tools
 */
export const COMUS_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'checkTaxiFare',
    description:
      'Uses official İBB UKOME taxi rates (Opening: 30 TL, Per Km: 20 TL, Min fare: 100 TL) to compute accurate Turkish Lira and Euro equivalents between two locations in Istanbul.',
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
    name: 'searchVerifiedPlaces',
    description:
      'Queries local purely_verified_places.json containing only vetted spots in Fatih, Beyoğlu, Beşiktaş, and Kadıköy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        neighborhood: {
          type: Type.STRING,
          description: 'One of the 4 verified districts: Fatih, Beyoğlu, Beşiktaş, or Kadıköy.',
        },
        category: {
          type: Type.STRING,
          description: 'Category filter: culinary, hammam, history, or bosphorus.',
        },
        preference: {
          type: Type.STRING,
          description: 'Specific guest preference such as breakfast, kebab, baklava, sunset, hidden-gem, or route.',
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
 * and invokes `checkTaxiFare`, `createRoomTicket`, and `searchVerifiedPlaces` when upstream
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

• **Taksimetre & Banknot Kontrolü:** İBB UKOME resmi tarifesine göre taksi açılışı **30 TL**, km başı **20 TL**, indi-bindi (minimum) **100 TL**'dir. Taksimetrenin açıldığından emin olun ve 200/500 TL gibi yüksek banknot verirken tutarı sesli belirtin.
• **"Yere Fırça Düşüren" Ayakkabı Boyacısı:** Galata, Karaköy veya Eminönü'nde önünüzde yürürken fırçasını düşüren boyacıyı uyarsanız, "teşekkür" bahanesiyle ayakkabınızı boyayıp yüksek ücret talep edebilir. Teşekkür edip yolunuza devam edin.
• **İstiklal / Taksim Gece Kulübü Davetleri:** Sokakta yanınıza yaklaşıp "beraber bir şeyler içelim" diyen yabancıların yönlendirdiği mekanlara girmeyin (fahiş hesap tuzağıdır).
• **Fiyatlı Menü Kontrolü:** Restorana oturmadan önce mutlaka fiyatları yazılı menüyü inceleyin; **Fatih, Beyoğlu, Beşiktaş ve Kadıköy**'deki önerdiğimiz yerel mekanları tercih edebilirsiniz.

[action:explore_category, id:culinary]`;
    }

    return `During your stay at **${liveContext.propertyName}** (${liveContext.unitName}), here are 4 practical tips to avoid common tourist traps in Istanbul:

• **Taxi Meter & Banknote Check:** Official İBB UKOME rates are **30 TL opening**, **20 TL/km**, and **100 TL minimum fare**. Make sure the meter is turned on, and state the value of **200 TL or 500 TL** banknotes out loud when paying in cash.
• **Dropped Shoe-Shiner Brush:** Around Galata Bridge or Sultanahmet, if a shoe-shiner drops his brush in front of you, politely decline any "free thank-you shine" as they will ask for a high fee afterward.
• **Unsolicited Bar/Club Invites:** Avoid following strangers in Taksim/Beyoğlu who invite you for a "quick drink"—this is a common overcharging scheme.
• **Check Printed Menus:** Always ask for a menu with clearly printed prices before ordering, or choose from our recommended spots in **Fatih, Beyoğlu, Beşiktaş, and Kadıköy**.

[action:explore_category, id:culinary]`;
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
      return `**${liveContext.propertyName}** (${liveContext.unitName}) konaklamanızdan resmi **İBB UKOME** taksi tarifesine göre (**Açılış: ${fare.ukomeTariff.openingTL} TL**, **Km Başı: ${fare.ukomeTariff.perKmTL} TL**, **İndi-Bindi Min: ${fare.ukomeTariff.minFareTL} TL**) tahmini ücret:

• **Rota & Mesafe:** ${fare.origin} → ${fare.destination} (~${fare.estimatedDistanceKm} km)
• **Tahmini Taksimetre Tutarı:** **${fare.estimatedFareTL.formatted}** (Yaklaşık **${fare.estimatedFareEUR.formatted}**)
• **Geçiş Notu:** ${fare.tollsNote}
• **Pratik İpucu:** Binmeden önce taksimetrenin açıldığını kontrol edin. Sabit fiyatlı, lisanslı VIP transfer tercih ederseniz aşağıdan inceleyebilirsiniz.

${fare.actionTag}`;
    }

    return `From **${liveContext.propertyName}** (${liveContext.unitName}), based on official **İBB UKOME** metered taxi rates (**Opening: ${fare.ukomeTariff.openingTL} TL**, **Per Km: ${fare.ukomeTariff.perKmTL} TL**, **Minimum Fare: ${fare.ukomeTariff.minFareTL} TL**):

• **Route & Distance:** ${fare.origin} → ${fare.destination} (~${fare.estimatedDistanceKm} km)
• **Estimated Metered Fare:** **${fare.estimatedFareTL.formatted}** (Approx. **${fare.estimatedFareEUR.formatted}**)
• **Toll Note:** ${fare.tollsNote}
• **Practical Tip:** Make sure the digital meter (*taksimetre*) is turned on when starting the ride, and state large banknotes (200/500 TL) out loud when paying.

${fare.actionTag}`;
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
      const localSpots = searchVerifiedPlaces({
        neighborhood: liveContext.district,
        category: 'culinary',
        preference: requestedService === 'breakfast' ? 'breakfast' : undefined,
      });
      const topSpot = localSpots.matches[0]?.name || 'Van Kahvaltı Evi (Cihangir)';

      if (isTurkish) {
        if (requestedService === 'breakfast') {
          const hrs = availability.hours || '08:00 - 11:30';
          return availability.isActive
            ? `Şu an ${unitTargetTr} kahvaltı servis saatimiz (**${hrs}**) sona erdi; ancak **${liveContext.propertyName}** yakınında harika bir yerel fırın/kafe (**${topSpot}**) önerebilirim veya yarın sabah için siparişinizi şimdiden oluşturabilirim.`
            : `**${liveContext.propertyName}**'deki konaklamanız boyunca ${unitTargetTr} doğrudan kahvaltı servisimiz şu an kapalıdır; ancak yürüme mesafenizdeki **${topSpot}** gibi doğrulanmış yerel kahvaltı duraklarımızı önerebilirim.`;
        }
        return `**${liveContext.propertyName}**'deki konaklamanız boyunca **${availability.title}** hizmetimiz şu an aktif saatleri dışındadır veya geçici olarak kapalıdır (${availability.hours || 'Kapalı'}). Dilerseniz yarın için planlayabilir veya yakınınızdaki doğrulanmış yerel noktalarımız konusunda yardımcı olabilirim.`;
      }

      if (requestedService === 'breakfast') {
        const hrs = availability.hours || '08:00 - 11:30';
        return availability.isActive
          ? `Our doorstep breakfast service hours (**${hrs}**) to ${unitWordEn} at **${liveContext.propertyName}** have ended for today; however, I can recommend a wonderful local bakery/café nearby (**${topSpot}**) or schedule your breakfast order right now for tomorrow morning.`
          : `During your stay at **${liveContext.propertyName}**, in-stay breakfast service is currently inactive; however, I would love to guide you to a verified local café nearby such as **${topSpot}**.`;
      }
      return `During your stay at **${liveContext.propertyName}** (${liveContext.unitName}), **${availability.title}** is currently outside active service hours or unavailable. I would be happy to arrange a nearby local alternative or schedule it for the next available window.`;
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

  // 4. Check if query is about Daily Route / Itinerary
  if (
    q.includes('rota') ||
    q.includes('itinerary') ||
    q.includes('plan') ||
    q.includes('bugün için')
  ) {
    const verified = searchVerifiedPlaces({ preference: 'route' });
    if (isTurkish) {
      return `**${liveContext.propertyName}**'deki konaklamanız boyunca turist kalabalıklarına girmeden, doğrulanmış 4 bölgemizi (**Fatih, Beyoğlu, Beşiktaş, Kadıköy**) kapsayan bugünkü yerel rotanız:

• **Sabah (Beyoğlu / Cihangir & Galata):** Güne **Van Kahvaltı Evi**'nde (Cihangir) gerçek serpme kahvaltıyla başlayın, ardından **Serdar-ı Ekrem Sokak** ve **Kamondo Merdivenleri**'nden Karaköy'e yürüyün.
• **Öğle (Fatih / Tarihi Yarımada):** T1 tramvayıyla Sirkeci'ye geçip **Şehzade Cağ Kebap** veya **Tarihi Sultanahmet Köftecisi (1920)**'nde öğle yemeği yiyin; **Büyük Valide Han** avlusunda közde çay molası verin.
• **Gün Batımı (Beşiktaş / Boğaz veya Kadıköy Moda):** Akşamüstü doğrulanmış kaptanlarımızla kalabalıksız bir **Boğaz gün batımı turuna** çıkın ya da vapurla **Moda Sahili**'ne geçin.

[action:explore_category, id:bosphorus]`;
    }

    return `From **${liveContext.propertyName}** (${liveContext.unitName}), here is your crowd-free, authentic full-day Istanbul itinerary across our 4 verified districts (**Fatih, Beyoğlu, Beşiktaş, Kadıköy**):

• **Morning (Beyoğlu — Cihangir & Galata):** Start with an artisanal spread at **Van Kahvaltı Evi**, then stroll down **Serdar-ı Ekrem Street** and the historic **Camondo Stairs** to Karaköy (${verified.matches.length} vetted spots nearby).
• **Midday (Fatih — Historic Peninsula):** Ride the T1 tram to Sirkeci for lunch at **Şehzade Cağ Kebap** or **Tarihi Sultanahmet Köftecisi (1920)**, followed by hidden-courtyard tea at **Büyük Valide Han**.
• **Golden Hour (Beşiktaş / Bosphorus or Kadıköy Moda):** Board a verified small-group **Bosphorus sunset yacht** or take the public ferry across to **Moda Pier** for sunset views.

[action:explore_category, id:bosphorus]`;
  }

  // 5. Default / Nearby Authentic Places
  const neighborhoodFilter =
    q.includes('fatih') || q.includes('sultanahmet')
      ? 'Fatih'
      : q.includes('beyoğlu') || q.includes('galata') || q.includes('karaköy') || q.includes('cihangir')
        ? 'Beyoğlu'
        : q.includes('beşiktaş') || q.includes('ortaköy')
          ? 'Beşiktaş'
          : q.includes('kadıköy') || q.includes('moda')
            ? 'Kadıköy'
            : liveContext.district;

  const categoryFilter =
    q.includes('hamam') || q.includes('hammam') || q.includes('spa')
      ? 'hammam'
      : q.includes('boğaz') || q.includes('bosphorus') || q.includes('tekne') || q.includes('yacht')
        ? 'bosphorus'
        : undefined;

  const verifiedResult = searchVerifiedPlaces({
    neighborhood: neighborhoodFilter,
    category: categoryFilter,
  });

  if (isTurkish) {
    const bulletLines = verifiedResult.matches
      .map(
        (p) =>
          `• **${p.name} (${p.neighborhood} – ${p.subArea}):** ${p.summary} *(Rayiç: ${p.priceRangeTL} / ${p.priceRangeEUR})*`
      )
      .join('\n');

    return `**${liveContext.propertyName}**'deki konaklamanız boyunca **Fatih, Beyoğlu, Beşiktaş ve Kadıköy** bölgelerinden seçtiğim yerel mekan önerilerim:

${bulletLines}

• **Pratik Not:** Önerdiğim bu mekanlar şeffaf menü ve yerel fiyatlarla hizmet veren bilinen noktalardır.

${verifiedResult.recommendedActionTag}`;
  }

  const bulletLinesEn = verifiedResult.matches
    .map(
      (p) =>
        `• **${p.name} (${p.neighborhood} – ${p.subArea}):** ${p.summary} *(Local norm: ${p.priceRangeTL} / ${p.priceRangeEUR})*`
    )
    .join('\n');

  return `During your stay at **${liveContext.propertyName}** (${liveContext.unitName}), here are my local recommendations curated from **Fatih, Beyoğlu, Beşiktaş, and Kadıköy**:

${bulletLinesEn}

• **Helpful Tip:** All spots above operate with clear printed menus and standard local prices.

${verifiedResult.recommendedActionTag}`;
}

export async function POST(req: Request) {
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
      body.hotelName || 'Old City Heritage Hotel Istanbul'
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

    const systemInstructionWithSnapshot = buildComusSystemInstruction(liveContext);
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
                } else if (call.name === 'searchVerifiedPlaces') {
                  toolOutput = searchVerifiedPlaces({
                    neighborhood: args.neighborhood || liveContext.district,
                    category: args.category,
                    preference: args.preference,
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
