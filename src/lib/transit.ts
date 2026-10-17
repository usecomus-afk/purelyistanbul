import { TransitCalculation, Language } from './types';

// Haversine formula to compute distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.max(0.8, Number(d.toFixed(1)));
}

export function calculateTransitOptions(
  originCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number },
  originDistrict: string,
  destLocation: string,
  lang: Language = 'tr'
): TransitCalculation {
  const distKm = calculateDistanceKm(
    originCoords.lat,
    originCoords.lng,
    destinationCoords.lat,
    destinationCoords.lng
  );

  // Taxi calculation (Istanbul Taxi tariff simulation: Opening 35 TL, ~25 TL/km, min fare ~135 TL)
  const taxiCost = Math.round(Math.max(150, 45 + distKm * 28));
  const taxiDuration = Math.round(Math.max(8, distKm * 3.8));

  // VIP Transfer calculation
  const vipCost = Math.round(Math.max(35, 25 + distKm * 2.5));
  const vipDuration = Math.round(Math.max(10, distKm * 3.2));

  const stopsCount = Math.ceil(distKm * 1.5);
  const destLower = destLocation.toLowerCase();
  const isFerry = destLower.includes('kadıköy') || destLower.includes('üsküdar');
  const isMetro = !isFerry && (destLower.includes('taksim') || destLower.includes('şişli'));

  const i18nTransit: Record<Language, {
    tramLine: string;
    tramSteps: string[];
    ferryLine: string;
    ferrySteps: string[];
    metroLine: string;
    metroSteps: string[];
    taxiDesc: string;
    vipDesc: string;
  }> = {
    tr: {
      tramLine: "T1 Kabataş - Bağcılar Tramvayı",
      tramSteps: [
        `Otelden en yakın durağa 4 dk yürüyün.`,
        `T1 Tramvayına binin (${stopsCount} durak).`,
        `İndikten sonra hedefinize 3 dk yürüyüş mesafesinde.`
      ],
      ferryLine: "Şehir Hatları Tarihi Vapur",
      ferrySteps: [
        `Eminönü veya Karaköy İskelesi'ne gidin.`,
        `Boğaz manzaralı Tarihi Vapura binin (15 dk keyifli yolculuk).`,
        `İskeleden 5 dk yürüyerek mekana ulaşın.`
      ],
      metroLine: "M2 Yenikapı - Hacıosman Metrosu / F1 Füniküler",
      metroSteps: [
        `En yakın M2 metro veya T1 Tramvay durağına geçin.`,
        `M2 Metrosu ile direkt Taksim istasyonunda inin.`,
        `Çıkıştan 4 dk yürüyüş mesafesi.`
      ],
      taxiDesc: `Trafik durumuna göre yaklaşık ${taxiDuration} dk. Sarı taksi doğrudan otel kapısına çağrılabilir.`,
      vipDesc: `Mercedes Vito / VIP araç ile özel şoförlü, klimalı ve konforlu kapıdan kapıya transfer.`
    },
    en: {
      tramLine: "T1 Kabataş - Bağcılar Tram",
      tramSteps: [
        `Walk 4 min from the hotel to the nearest station.`,
        `Board the T1 Tram (${stopsCount} stops).`,
        `3 min walk to your destination after alighting.`
      ],
      ferryLine: "Şehir Hatları Historic Ferry",
      ferrySteps: [
        `Head to Eminönü or Karaköy Pier.`,
        `Board the Historic Bosphorus Ferry (15 min scenic ride).`,
        `Walk 5 min from the pier to the venue.`
      ],
      metroLine: "M2 Yenikapı - Hacıosman Metro / F1 Funicular",
      metroSteps: [
        `Proceed to the nearest M2 Metro or T1 Tram station.`,
        `Take the M2 Metro directly to Taksim station.`,
        `4 min walk from the exit.`
      ],
      taxiDesc: `Approx. ${taxiDuration} min depending on traffic. A yellow taxi can be called directly to the hotel entrance.`,
      vipDesc: `Comfortable, air-conditioned door-to-door transfer with a private chauffeur in a Mercedes Vito / VIP vehicle.`
    },
    ar: {
      tramLine: "ترامواي T1 كاباتاش - باغجلار",
      tramSteps: [
        `امشِ لمدة 4 دقائق من الفندق إلى أقرب محطة.`,
        `اركب ترامواي T1 (${stopsCount} محطات).`,
        `على بُعد 3 دقائق سيراً على الأقدام إلى وجهتك بعد النزول.`
      ],
      ferryLine: "عبّارة المدينة التاريخية",
      ferrySteps: [
        `توجّه إلى رصيف أمينونو أو كاراكوي.`,
        `اركب العبّارة التاريخية بإطلالة على البوسفور (رحلة ممتعة لمدة 15 دقيقة).`,
        `امشِ لمدة 5 دقائق من الرصيف للوصول إلى المكان.`
      ],
      metroLine: "مترو M2 يني كابي - حجي عثمان / القطار الجبلي F1",
      metroSteps: [
        `انتقل إلى أقرب محطة مترو M2 أو ترامواي T1.`,
        `انزل مباشرة في محطة تقسيم عبر مترو M2.`,
        `على بُعد 4 دقائق سيراً على الأقدام من المخرج.`
      ],
      taxiDesc: `حوالي ${taxiDuration} دقيقة حسب حركة المرور. يمكن طلب سيارة أجرة صفراء مباشرة إلى باب الفندق.`,
      vipDesc: `نقل مريح ومكيّف من الباب إلى الباب مع سائق خاص بسيارة مرسيدس فيتو / VIP.`
    },
    ru: {
      tramLine: "Трамвай T1 Кабаташ - Багджылар",
      tramSteps: [
        `Пройдите 4 мин от отеля до ближайшей остановки.`,
        `Сядьте на трамвай T1 (${stopsCount} ост.).`,
        `После выхода 3 мин пешком до места назначения.`
      ],
      ferryLine: "Исторический паром Şehir Hatları",
      ferrySteps: [
        `Направляйтесь к причалу Эминёню или Каракёй.`,
        `Сядьте на исторический паром с видом на Босфор (15 мин живописной поездки).`,
        `Пройдите 5 мин пешком от причала до места.`
      ],
      metroLine: "Метро M2 Еникапы - Хаджиосман / Фуникулер F1",
      metroSteps: [
        `Пройдите к ближайшей станции метро M2 или трамвая T1.`,
        `На метро M2 доезжайте прямо до станции Таксим.`,
        `4 мин пешком от выхода.`
      ],
      taxiDesc: `Около ${taxiDuration} мин в зависимости от трафика. Желтое такси можно вызвать прямо ко входу в отель.`,
      vipDesc: `Комфортабельный трансфер от двери до двери с кондиционером и личным водителем на Mercedes Vito / VIP-автомобиле.`
    },
    de: {
      tramLine: "T1 Kabataş - Bağcılar Straßenbahn",
      tramSteps: [
        `4 Min. Fußweg vom Hotel zur nächsten Haltestelle.`,
        `Steigen Sie in die Straßenbahn T1 (${stopsCount} Stationen).`,
        `Nach dem Aussteigen 3 Min. Fußweg bis zum Ziel.`
      ],
      ferryLine: "Historische Fähre (Şehir Hatları)",
      ferrySteps: [
        `Begeben Sie sich zum Fähranleger Eminönü oder Karaköy.`,
        `Nehmen Sie die historische Bosporus-Fähre (15 Min. malerische Fahrt).`,
        `5 Min. Fußweg vom Anleger bis zum Zielort.`
      ],
      metroLine: "M2 Yenikapı - Hacıosman U-Bahn / F1 Standseilbahn",
      metroSteps: [
        `Gehen Sie zur nächsten M2 U-Bahn- oder T1 Straßenbahnhaltestelle.`,
        `Fahren Sie mit der U-Bahn M2 direkt bis zur Station Taksim.`,
        `4 Min. Fußweg vom Ausgang.`
      ],
      taxiDesc: `Ca. ${taxiDuration} Min. je nach Verkehrslage. Ein gelbes Taxi kann direkt zum Hoteleingang gerufen werden.`,
      vipDesc: `Komfortabler, klimatisierter Tür-zu-Tür-Transfer mit privatem Chauffeur im Mercedes Vito / VIP-Fahrzeug.`
    },
    fr: {
      tramLine: "Tramway T1 Kabataş - Bağcılar",
      tramSteps: [
        `Marchez 4 min depuis l'hôtel jusqu'à l'arrêt le plus proche.`,
        `Prenez le tramway T1 (${stopsCount} arrêts).`,
        `À 3 min à pied de votre destination après être descendu.`
      ],
      ferryLine: "Ferry Historique Şehir Hatları",
      ferrySteps: [
        `Rendez-vous à l'embarcadère d'Eminönü ou de Karaköy.`,
        `Montez à bord du ferry historique sur le Bosphore (15 min de traversée panoramique).`,
        `Marchez 5 min depuis l'embarcadère jusqu'au lieu.`
      ],
      metroLine: "Métro M2 Yenikapı - Hacıosman / Funiculaire F1",
      metroSteps: [
        `Rejoignez la station de métro M2 ou de tramway T1 la plus proche.`,
        `Prenez le métro M2 directement jusqu'à la station Taksim.`,
        `À 4 min à pied de la sortie.`
      ],
      taxiDesc: `Environ ${taxiDuration} min selon la circulation. Un taxi jaune peut être appelé directement devant l'hôtel.`,
      vipDesc: `Transfert porte-à-porte confortable et climatisé avec chauffeur privé en Mercedes Vito / véhicule VIP.`
    }
  };

  const dict = i18nTransit[lang] || i18nTransit.en;
  const lineName = isFerry ? dict.ferryLine : isMetro ? dict.metroLine : dict.tramLine;
  const steps = isFerry ? dict.ferrySteps : isMetro ? dict.metroSteps : dict.tramSteps;

  const transitDuration = Math.round(Math.max(12, distKm * 4.5 + 8));
  const transitCost = 30; // ~30 TL Istanbulkart standard fare

  return {
    distanceKm: distKm,
    taxi: {
      durationMin: taxiDuration,
      costTl: taxiCost,
      desc: dict.taxiDesc
    },
    vipTransfer: {
      durationMin: vipDuration,
      costEur: vipCost,
      desc: dict.vipDesc
    },
    publicTransit: {
      durationMin: transitDuration,
      costTl: transitCost,
      lineName: lineName,
      routeSteps: steps
    }
  };
}

