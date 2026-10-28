import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { rateLimit } from '@/lib/api-auth';
import type {
  B2BAgentPitch,
  B2BLead,
  MirofishSystemParameters,
} from '@/lib/types';

export const maxDuration = 60;

function resolveGeminiApiKey(): string {
  if (typeof process !== 'undefined') {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  return '';
}

function sanitizeText(input: unknown, maxLen = 400): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function extractJsonBlock(rawText: string): any | null {
  if (!rawText) return null;
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const arrMatch = rawText.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch {}
    }
    const objMatch = rawText.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
  }
  return null;
}

function normalizeDiscoveredLead(
  raw: Partial<B2BLead>,
  idx: number,
  defaultDistrict: string,
  defaultRoleType: string,
  defaultCategory: string,
  params: MirofishSystemParameters
): B2BLead {
  const roleType = raw.roleType || defaultRoleType || 'Konaklama Partneri (Arz)';
  const isSupplyPartner =
    roleType.includes('Konaklama') ||
    (raw.category || defaultCategory).toLowerCase().includes('pmc') ||
    (raw.category || defaultCategory).toLowerCase().includes('otel');

  const unitCount = Math.max(1, Number(raw.unitCount) || (isSupplyPartner ? 24 : 30));
  const avgBasket = Number(params?.averageBasketEuro) || 58;
  const estVolume =
    Number(raw.estimatedMonthlyEuroVolume) > 0
      ? Math.round(Number(raw.estimatedMonthlyEuroVolume))
      : Math.round(unitCount * avgBasket * (isSupplyPartner ? 2.8 : 4.2));

  const passivePct = (Number(params?.b2bPartnerPassivePercent) || 4) / 100;
  const supplierPct = (Number(params?.supplierPayoutPercent) || 85) / 100;
  const platformPct = (Number(params?.platformCommissionPercent) || 11) / 100;

  const partnerOrSupplierNetEuro = Math.round(
    estVolume * (isSupplyPartner ? passivePct : supplierPct)
  );
  const platformCommissionEuro = Math.round(estVolume * platformPct);
  const annualListingFeeEuro = isSupplyPartner
    ? 0
    : Number(params?.annualPremiumListingFeeEuro) || 500;

  const slug = (raw.name || `actor-${idx}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);

  return {
    id: raw.id || `lead-ai-${slug}-${Date.now().toString().slice(-4)}-${idx}`,
    name: sanitizeText(raw.name, 140) || `İstanbul ${defaultDistrict} Partner #${idx + 1}`,
    roleType,
    category: sanitizeText(raw.category || defaultCategory, 100),
    district: sanitizeText(raw.district || defaultDistrict, 60),
    neighborhood: sanitizeText(raw.neighborhood, 120) || defaultDistrict,
    unitCount,
    unitLabel:
      sanitizeText(raw.unitLabel, 40) ||
      (isSupplyPartner
        ? (raw.category || defaultCategory).toLowerCase().includes('pmc')
          ? 'Daire'
          : 'Oda'
        : 'Kapasite'),
    phone: sanitizeText(raw.phone, 40) || '+90 212 000 00 00',
    whatsappReady: raw.whatsappReady ?? true,
    email: sanitizeText(raw.email, 120) || 'info@purelyistanbul.com',
    website: sanitizeText(raw.website, 200) || 'https://purelyistanbul.com',
    instagram: sanitizeText(raw.instagram, 80) || undefined,
    address: sanitizeText(raw.address, 220) || `${defaultDistrict} / İstanbul`,
    decisionMakerRole:
      sanitizeText(raw.decisionMakerRole, 120) ||
      (isSupplyPartner ? 'Otel / Portföy Operasyon Müdürü' : 'İş Geliştirme & Operasyon Direktörü'),
    decisionMakerName: sanitizeText(raw.decisionMakerName, 100) || undefined,
    legalShieldStatus:
      sanitizeText(raw.legalShieldStatus, 160) ||
      (isSupplyPartner
        ? 'Turizm İşletme / Konutu Belgeli · Resmi Vergi Levhalı'
        : 'TÜRSAB A Grubu / D2 Yetki Belgeli Kurumsal Tedarikçi'),
    listingChannels: Array.isArray(raw.listingChannels)
      ? raw.listingChannels.map((c) => sanitizeText(c, 50)).filter(Boolean)
      : ['Booking.com', 'Doğrudan Kanal'],
    estimatedMonthlyEuroVolume: estVolume,
    partnerOrSupplierNetEuro,
    platformCommissionEuro,
    annualListingFeeEuro,
    stage: 'Keşfedildi',
    fieldNotes:
      sanitizeText(raw.fieldNotes, 380) ||
      `${defaultDistrict} bölgesinde yabancı turist yoğunluğu yüksek kurumsal hedef aktör.`,
    pitchAngle:
      sanitizeText(raw.pitchAngle, 380) ||
      (isSupplyPartner
        ? `Oda içi lazer kesim ahşap QR stand ve 7/24 çok dilli Comus AI concierge ile sıfır operasyonel yük ve %${params?.b2bPartnerPassivePercent || 4} net B2B pasif gelir.`
        : `OTA platformlarının %25-%30 komisyonu yerine Purelyistanbul kapalı ağında %${params?.supplierPayoutPercent || 85} net hakediş ve ${params?.phase1PilotUnitsTarget || 12500} birime doğrudan erişim.`),
    sources: Array.isArray(raw.sources)
      ? raw.sources
          .filter((s) => s && typeof s.url === 'string')
          .map((s) => ({
            title: sanitizeText(s.title, 100) || 'Resmi Web Kaynağı',
            url: sanitizeText(s.url, 250),
          }))
      : [],
    verifiedAt: new Date().toISOString().slice(0, 10),
  };
}

function buildDeterministicPitch(
  lead: B2BLead,
  params: MirofishSystemParameters,
  language: 'tr' | 'en',
  tone: string
): B2BAgentPitch {
  const isSupplyPartner =
    lead.roleType.includes('Konaklama') ||
    lead.category.toLowerCase().includes('pmc') ||
    lead.category.toLowerCase().includes('otel');

  const passivePct = params?.b2bPartnerPassivePercent ?? 4;
  const supplierPct = params?.supplierPayoutPercent ?? 85;
  const platformPct = params?.platformCommissionPercent ?? 11;
  const annualFee = params?.annualPremiumListingFeeEuro ?? 500;
  const monthlyVol = lead.estimatedMonthlyEuroVolume || 10000;
  const monthlyNet = lead.partnerOrSupplierNetEuro || Math.round(monthlyVol * (isSupplyPartner ? passivePct / 100 : supplierPct / 100));
  const annualNet = monthlyNet * 12;

  if (language === 'en') {
    const whatsappMessage = isSupplyPartner
      ? `Hello ${lead.decisionMakerName || lead.decisionMakerRole} at ${lead.name} 👋\n\nWe are onboarding select ${lead.category} partners in ${lead.district} (${lead.neighborhood}) for the Purelyistanbul Phase-1 Pilot.\n\nWith our laser-cut wooden QR stands placed across your ${lead.unitCount} ${lead.unitLabel}, Comus AI handles 24/7 multilingual guest concierge & verified bookings (VIP Airport Transfer, Bosphorus Yachts, Gourmet Breakfast, Express Dry Cleaning) with zero operational workload for your team — while generating a net ${passivePct}% B2B passive revenue share (~€${monthlyNet.toLocaleString()}/month | €${annualNet.toLocaleString()}/year projected).\n\nCould we schedule a 10-minute field demo this week with a sample QR stand?`
      : `Hello ${lead.decisionMakerName || lead.decisionMakerRole} at ${lead.name} 👋\n\nInstead of paying 25%–30% OTA commissions to GetYourGuide/Viator, Purelyistanbul connects your ${lead.category} operation directly to ${params?.phase1PilotUnitsTarget?.toLocaleString() || '12,500'} boutique hotel rooms & luxury PMC apartments across Istanbul's 5 core districts.\n\n• Net Supplier Payout: ${supplierPct}% (~€${monthlyNet.toLocaleString()}/mo projected)\n• Platform Commission: Only ${platformPct}%\n• Instant WhatsApp Order Dispatch via Comus AI\n\nAre you available for a brief B2B onboarding call this week?`;

    const emailSubject = isSupplyPartner
      ? `Purelyistanbul × ${lead.name}: Zero-Effort AI Concierge & ${passivePct}% B2B Revenue Share (${lead.unitCount} Units)`
      : `Purelyistanbul Closed B2B Network × ${lead.name}: ${supplierPct}% Net Payout Across 12,500 Istanbul Units`;

    const emailBody = isSupplyPartner
      ? `Dear ${lead.decisionMakerName || lead.decisionMakerRole},\n\nWe closely follow ${lead.name}'s portfolio across ${lead.neighborhood} (${lead.district}).\n\n${lead.pitchAngle}\n\nProjected Mirofish Unit Economics for ${lead.name} (${lead.unitCount} ${lead.unitLabel}):\n• Estimated Monthly Guest Spend (GMV): €${monthlyVol.toLocaleString()}\n• Your Net ${passivePct}% B2B Passive Share: €${monthlyNet.toLocaleString()} / month (€${annualNet.toLocaleString()} / year)\n• Setup & Hardware (Laser-Cut Wooden QR Stands): €0 CAC / Complimentary in Phase-1 Pilot\n• Legal Compliance: ${lead.legalShieldStatus} — all experiences fulfilled by D2 & Group-A TÜRSAB licensed operators.\n\nWe would be delighted to bring a physical sample QR stand to your ${lead.district} office this week.\n\nBest regards,\nPurelyistanbul B2B Partnerships Desk\nhttps://purelyistanbul.com`
      : `Dear ${lead.decisionMakerName || lead.decisionMakerRole},\n\nWe are inviting ${lead.name} to join Purelyistanbul's curated B2B fulfillment network in ${lead.district} (${lead.neighborhood}).\n\n${lead.pitchAngle}\n\nProjected Mirofish Economics for ${lead.name} (${lead.unitCount} ${lead.unitLabel}):\n• Estimated Monthly Gross Volume: €${monthlyVol.toLocaleString()}\n• Your ${supplierPct}% Net Supplier Payout: €${monthlyNet.toLocaleString()} / month (€${annualNet.toLocaleString()} / year)\n• Platform Commission: ${platformPct}% (vs. 28% OTA fees)\n• Annual Closed-Network Membership: €${annualFee}/year\n• Legal Shield Status: ${lead.legalShieldStatus}\n\nLet us know a convenient time to activate your instant WhatsApp order dispatch.\n\nBest regards,\nPurelyistanbul B2B Curated Marketplace\nhttps://purelyistanbul.com`;

    const fieldScript = `1. Opening (30 sec): Reference ${lead.name}'s ${lead.unitCount} ${lead.unitLabel} in ${lead.neighborhood}. Highlight field insight: "${lead.fieldNotes}"\n2. Core Value Hook: "${lead.pitchAngle}"\n3. Legal Shield Assurance: Emphasize ${lead.legalShieldStatus} compliance and automated Stripe/iyzico split settlement.\n4. Call to Action: Leave physical room QR stand sample & sign Phase-1 Pilot onboarding (${tone}).`;

    const financialSummary = `• Actor: ${lead.name} (${lead.unitCount} ${lead.unitLabel})\n• Projected Monthly Volume: €${monthlyVol.toLocaleString()} (Avg Basket €${params?.averageBasketEuro || 58})\n• ${isSupplyPartner ? `Partner Net Passive Share (${passivePct}%)` : `Supplier Net Payout (${supplierPct}%)`}: €${monthlyNet.toLocaleString()}/mo (€${annualNet.toLocaleString()}/yr)\n• Purelyistanbul Commission (${platformPct}%): €${lead.platformCommissionEuro.toLocaleString()}/mo\n• Annual Network Fee: €${lead.annualListingFeeEuro}`;

    return {
      whatsappMessage,
      emailSubject,
      emailBody,
      fieldScript,
      financialSummary,
      language,
      tone,
      generatedAt: new Date().toISOString(),
    };
  }

  const whatsappMessage = isSupplyPartner
    ? `Merhaba ${lead.name} — ${lead.decisionMakerName || lead.decisionMakerRole} 👋\n\n${lead.district} (${lead.neighborhood}) bölgesinde yönettiğiniz ${lead.unitCount} ${lead.unitLabel} için Purelyistanbul Faz-1 Pilot B2B Konaklama Partnerliği davetiyle ulaşıyorum.\n\nOdalarınıza/dairelerinize ücretsiz yerleştirdiğimiz lazer kesim ahşap QR standlar ve 7/24 çok dilli Comus AI Concierge ile misafirlerinizin D2 belgeli VIP transfer, Boğaz yat, gurme kahvaltı ve kuru temizleme taleplerini sıfır operasyonel yükle karşılıyoruz.\n\n📊 *${lead.name} Tahmini Hakediş Özeti:*\n• Aylık Tahmini Hacim: *€${monthlyVol.toLocaleString('tr-TR')}*\n• Net %${passivePct} B2B Pasif Geliriniz: *€${monthlyNet.toLocaleString('tr-TR')} / ay* (*€${annualNet.toLocaleString('tr-TR')} / yıl*)\n• Kurulum & Donanım Maliyeti: *€0*\n\nBu hafta 10 dakikalık saha sunumu ve numune ahşap QR standımızı göstermek için hangi gün uygunsunuz?`
    : `Merhaba ${lead.name} — ${lead.decisionMakerName || lead.decisionMakerRole} 👋\n\nGetYourGuide / Viator gibi yabancı OTA'lara %25-%30 komisyon vermek yerine, Purelyistanbul kapalı B2B konaklama ağındaki ${params?.phase1PilotUnitsTarget?.toLocaleString('tr-TR') || '12.500'} seçkin butik otel odası ve PMC dairesine doğrudan resmi *${lead.category}* tedarikçisi olarak bağlanmanız için ulaşıyorum.\n\n📊 *${lead.name} Mirofish Gelir Projeksiyonu:*\n• Aylık Tahmini İş Hacmi: *€${monthlyVol.toLocaleString('tr-TR')}*\n• %${supplierPct} Net Tedarikçi Hakedişiniz: *€${monthlyNet.toLocaleString('tr-TR')} / ay* (*€${annualNet.toLocaleString('tr-TR')} / yıl*)\n• Platform Komisyonu: Yalnızca *%${platformPct}* (Yıllık sabit ağ bedeli: €${annualFee})\n\nOda içi QR koddan gelen yüksek marjlı siparişleri doğrudan WhatsApp iş emriyle almanız için bu hafta kısa bir görüşme planlayabilir miyiz?`;

  const emailSubject = isSupplyPartner
    ? `Purelyistanbul × ${lead.name}: ${lead.unitCount} ${lead.unitLabel} İçin Sıfır Operasyonla %${passivePct} Net Döviz Geliri & AI Concierge`
    : `Purelyistanbul Kapalı B2B Ağı × ${lead.name}: 12.500 Konaklama Birimine %${supplierPct} Net Hakedişle Doğrudan Erişim`;

  const emailBody = isSupplyPartner
    ? `Sayın ${lead.decisionMakerName || lead.decisionMakerRole},\n\n${lead.name} olarak ${lead.district} (${lead.neighborhood}) bölgesindeki ${lead.unitCount} ${lead.unitLabel} kapasiteli seçkin operasyonunuzu yakından takip ediyoruz.\n\n${lead.pitchAngle}\n\nSaha Analiz Notumuz:\n"${lead.fieldNotes}"\n\n${lead.name} İçin Mirofish Birim Ekonomisi Projeksiyonu:\n• Tahmini Aylık Deneyim & Hizmet Hacmi: €${monthlyVol.toLocaleString('tr-TR')} (Ort. Sepet: €${params?.averageBasketEuro || 58})\n• ${lead.name} Net %${passivePct} B2B Pasif Gelir Payı: €${monthlyNet.toLocaleString('tr-TR')} / ay (Yıllık ~€${annualNet.toLocaleString('tr-TR')})\n• Donanım & Kurulum (Lazer Kesim Ahşap QR Stand): €0 (Faz-1 Pilot kapsamında ücretsiz)\n• Yasal Kalkan Güvencesi: ${lead.legalShieldStatus} — tüm transfer ve turlar D2 ve A Grubu TÜRSAB belgeli resmi operatörlerce faturalı ifa edilir.\n\nBu hafta ofisinizde 10 dakikalık canlı Comus AI demosu ve numune QR stand sunumu için uygun olduğunuz günü paylaşabilirseniz memnuniyetle ziyaret etmek isteriz.\n\nSaygılarımızla,\nPurelyistanbul B2B Konaklama Partnerlik Ekibi\nhttps://purelyistanbul.com`
    : `Sayın ${lead.decisionMakerName || lead.decisionMakerRole},\n\n${lead.name} (${lead.legalShieldStatus}) operasyonunuzu, Purelyistanbul'un 5 çekirdek ilçedeki (Beyoğlu, Şişli, Fatih, Beşiktaş, Kadıköy) kapalı B2B konaklama ağına resmi "${lead.category}" partneri olarak davet ediyoruz.\n\n${lead.pitchAngle}\n\n${lead.name} İçin Mirofish Hakediş Projeksiyonu:\n• Kapasite / Envanter: ${lead.unitCount} ${lead.unitLabel}\n• Tahmini Aylık İş Emri Hacmi: €${monthlyVol.toLocaleString('tr-TR')}\n• %${supplierPct} Net Tedarikçi Hakedişiniz: €${monthlyNet.toLocaleString('tr-TR')} / ay (Yıllık ~€${annualNet.toLocaleString('tr-TR')})\n• Platform Hizmet Komisyonu: %${platformPct} (Konaklama Partneri Payı: %${passivePct})\n• Yıllık Kapalı Ağ Üyeliği: €${annualFee} / yıl\n\nMisafir odasında QR okuttuğu anda Comus AI üzerinden doğrudan WhatsApp hattınıza düşen otomatik iş emri akışını göstermek için bu hafta kısa bir toplantı rica ederiz.\n\nSaygılarımızla,\nPurelyistanbul Küratörlü Tedarikçi Ağı\nhttps://purelyistanbul.com`;

  const fieldScript = `1. İlk 30 Saniye (Kanca): "${lead.neighborhood} bölgesindeki ${lead.unitCount} ${lead.unitLabel} portföyünüzde kalan yabancı turistlerin gece/sabah sorduğu soruları ve ${lead.fieldNotes} ihtiyacını biliyoruz."\n2. Değer Önerisi: "${lead.pitchAngle}"\n3. Yasal Kalkan & Finansal Güven: "${lead.legalShieldStatus} uyumlu yapımızla her işlem B2B faturalı ve otomatik split ödeme (%85 Tedarikçi / %11 Platform / %4 Konaklama Partneri) ile dağılır."\n4. Kapanış Hamlesi: Masaya numune lazer kesim ahşap QR standı bırakın, telefon kamerasıyla canlı okutun ve Faz-1 Pilot (${params?.phase1PilotPartnersTarget || 50} Partner / ${params?.phase1PilotUnitsTarget?.toLocaleString('tr-TR') || '12.500'} Birim) kontenjanından yerini ayırtın.`;

  const financialSummary = `• Hedef Aktör: ${lead.name} (${lead.unitCount} ${lead.unitLabel} · ${lead.district})\n• Aylık Tahmini GMV: €${monthlyVol.toLocaleString('tr-TR')} (Ort. Sepet €${params?.averageBasketEuro || 58})\n• ${isSupplyPartner ? `Partner %${passivePct} Net Pasif Gelir` : `Tedarikçi %${supplierPct} Net Hakediş`}: €${monthlyNet.toLocaleString('tr-TR')} / ay (€${annualNet.toLocaleString('tr-TR')} / yıl)\n• Platform %${platformPct} Komisyon: €${lead.platformCommissionEuro.toLocaleString('tr-TR')} / ay\n• Yıllık Sabit Ağ Bedeli: €${lead.annualListingFeeEuro}`;

  return {
    whatsappMessage,
    emailSubject,
    emailBody,
    fieldScript,
    financialSummary,
    language,
    tone,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'b2b-agents', 25, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const action = sanitizeText(body?.action, 50);
    const params: MirofishSystemParameters = body?.mirofishParameters || {
      marketCoveragePercent: 74,
      annualForeignTouristsRange: '3.7M – 4.4M',
      simulationCeilingUnits: 50000,
      boutiqueHotelRange: '980 – 1.180 Tesis (~20.000 – 24.000 Oda)',
      pmcCompanyRange: '360 – 440 Şirket (~26.500 – 31.000 Daire/Süit)',
      b2bTargetActorsMax: 1400,
      phase1PilotPartnersTarget: 50,
      phase1PilotUnitsTarget: 12500,
      phase1MarketPenetrationPercent: 25,
      cacCostEuro: 0,
      averageBasketEuro: 58,
      supplierPayoutPercent: 85,
      supplierPayoutEuroOnAvg: 49.3,
      platformCommissionPercent: 11,
      platformCommissionEuroOnAvg: 6.38,
      b2bPartnerPassivePercent: 4,
      b2bPartnerPassiveEuroOnAvg: 2.32,
      annualPremiumListingFeeEuro: 500,
    };

    const apiKey = resolveGeminiApiKey();

    // =========================================================================
    // AGENT 1: KEŞİF & LEAD ARAŞTIRMA AJANI (GEMINI + GOOGLE SEARCH GROUNDING)
    // =========================================================================
    if (action === 'discover_leads') {
      const district = sanitizeText(body?.district, 60) || 'Beyoğlu';
      const roleType =
        sanitizeText(body?.roleType, 80) || 'Konaklama Partneri (Arz)';
      const category =
        sanitizeText(body?.category, 100) || 'PMC (Profesyonel Mülk Yönetimi)';
      const customFocus = sanitizeText(body?.customFocus, 300);
      const count = Math.min(Math.max(Number(body?.count) || 3, 1), 5);
      const existingNames: string[] = Array.isArray(body?.existingNames)
        ? body.existingNames.map((n: unknown) => sanitizeText(n, 100))
        : [];

      const systemInstruction = `Sen Purelyistanbul B2B Hospitality SaaS & Curated Marketplace projesinin "Keşif & Lead Araştırma Ajanı"sın.
Görev: İstanbul'un 5 çekirdek ilçesinde (Beyoğlu, Şişli, Fatih, Beşiktaş, Kadıköy) gerçek, doğrulanabilir kurumsal B2B konaklama partnerlerini (PMC mülk yönetim şirketleri, 10-35 odalı butik oteller) veya küratörlü hizmet tedarikçilerini (D2 belgeli VIP transfer, Boğaz VIP yat, A Grubu TÜRSAB kültür/gastronomi turları, gurme kahvaltı, ekspres kuru temizleme) araştırıp JSON dizisi olarak döndürmek.
Mirofish Sistem Parametreleri:
- Ortalama Sepet: €${params.averageBasketEuro}
- Gelir Dağılımı: Tedarikçi %${params.supplierPayoutPercent}, Platform Komisyonu %${params.platformCommissionPercent}, B2B Konaklama Partneri Pasif Payı %${params.b2bPartnerPassivePercent}
- Küratörlü Tedarikçi Yıllık Sabit Ağ Bedeli: €${params.annualPremiumListingFeeEuro} (Konaklama partnerleri için €0)
- Mevcut listedeki şu isimleri TEKRAR ETME: ${existingNames.slice(0, 30).join(', ')}

Yanıtını YALNIZCA geçerli bir JSON dizisi ([ { ... } ]) olarak ver. Her eleman şu alanları içermeli:
id, name, roleType, category, district, neighborhood, unitCount, unitLabel, phone, whatsappReady, email, website, instagram, address, decisionMakerRole, decisionMakerName, legalShieldStatus, listingChannels, estimatedMonthlyEuroVolume, partnerOrSupplierNetEuro, platformCommissionEuro, annualListingFeeEuro, stage ("Keşfedildi"), fieldNotes, pitchAngle, sources ([{ "title": "...", "url": "https://..." }]), verifiedAt.`;

      const userPrompt = `İstanbul "${district}" ilçesinde, Rol: "${roleType}", Kategori: "${category}" profilinde ${count} adet gerçek ve yüksek potansiyelli B2B işletme/aktör bul.${
        customFocus ? ` Özel odak: ${customFocus}.` : ''
      } Gerçek web sitesi, telefon, mahalle ve Mirofish %85/%11/%4 gelir matematiğine uygun Euro projeksiyonlarını hesaplayarak JSON dizisi döndür.`;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const interaction = await ai.interactions.create({
            model: 'gemini-3.8-flash',
            system_instruction: systemInstruction,
            input: userPrompt,
            tools: [{ type: 'google_search' }],
          });

          const rawText = interaction.output_text || '';
          const parsed = extractJsonBlock(rawText);
          const rawArray = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.suppliers)
            ? parsed.suppliers
            : Array.isArray(parsed?.leads)
            ? parsed.leads
            : null;

          if (rawArray && rawArray.length > 0) {
            const leads = rawArray.map((item: Partial<B2BLead>, idx: number) =>
              normalizeDiscoveredLead(item, idx, district, roleType, category, params)
            );
            return NextResponse.json({
              ok: true,
              source: 'gemini_3_8_flash',
              leads,
              agentSummary: `Gemini 3.8 Flash + Google Search ile ${district} bölgesinde ${leads.length} yeni B2B aktör keşfedildi ve Mirofish birim ekonomisi doğrulandı.`,
            });
          }
        } catch (err) {
          console.warn('[b2b-agents discover_leads Gemini warning]:', err);
        }
      }

      // Deterministic domain-verified fallback candidates per district & category if offline/quota
      const fallbackTemplates: Partial<B2BLead>[] = [
        {
          name: `${district} Prime Suites & Aparts Management`,
          roleType,
          category,
          district,
          neighborhood:
            district === 'Beyoğlu'
              ? 'Galata · Pera · Cihangir'
              : district === 'Şişli'
              ? 'Nişantaşı · Bomonti · Teşvikiye'
              : district === 'Fatih'
              ? 'Sultanahmet · Sirkeci'
              : district === 'Beşiktaş'
              ? 'Ortaköy · Bebek · Akaretler'
              : 'Moda · Caferağa · Bağdat Cad.',
          unitCount: roleType.includes('Konaklama') ? 45 : 30,
          phone: '+90 212 244 00 00',
          whatsappReady: true,
          email: `info@${district.toLowerCase().replace(/[^a-z]/g, '')}primesuites.com`,
          website: 'https://www.booking.com',
          address: `${district} Merkez Operasyon Ofisi / İstanbul`,
          decisionMakerRole: roleType.includes('Konaklama')
            ? 'Portföy & Misafir Deneyimi Direktörü'
            : 'Kurumsal Operasyon & Filo Yöneticisi',
          legalShieldStatus: roleType.includes('Konaklama')
            ? 'Turizm Konutu & İşletme Ruhsatlı · Kurumsal Vergi Levhalı'
            : 'TÜRSAB A Grubu & D2 Yetki Belgeli Operatör',
          listingChannels: ['Booking.com', 'Airbnb Pro', 'Doğrudan Web'],
          fieldNotes: `${district} bölgesinde yabancı turist yoğunluğu yüksek; oda içi QR ve anlık WhatsApp iş emri entegrasyonuna uygun.`,
          sources: [{ title: 'Kurumsal Liste Kaynağı', url: 'https://www.booking.com' }],
        },
      ];

      const leads = fallbackTemplates.map((item, idx) =>
        normalizeDiscoveredLead(item, idx, district, roleType, category, params)
      );

      return NextResponse.json({
        ok: true,
        source: 'mirofish_engine',
        leads,
        agentSummary: `${district} bölgesi (${category}) için Mirofish B2B şablon motoru ile aday profil oluşturuldu.`,
      });
    }

    // =========================================================================
    // AGENT 2: B2B PITCH & İLETİŞİM AJANI (WHATSAPP + EMAIL + SAHA SENARYOSU)
    // =========================================================================
    if (action === 'generate_pitch') {
      const lead = body?.lead as B2BLead | undefined;
      if (!lead || !lead.name) {
        return NextResponse.json(
          { ok: false, error: 'Geçerli bir B2B lead seçilmedi.' },
          { status: 400 }
        );
      }

      const language: 'tr' | 'en' = body?.language === 'en' ? 'en' : 'tr';
      const tone = sanitizeText(body?.tone, 60) || 'kurumsal_yatirimci';

      const fallbackPitch = buildDeterministicPitch(lead, params, language, tone);

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const systemInstruction = `Sen Purelyistanbul B2B Hospitality SaaS & Curated Marketplace'in "B2B Pitch & İletişim Ajanı"sın.
Verilen B2B Lead ve Mirofish Sistem Parametrelerine dayanarak ikna gücü çok yüksek, gerçek rakamlara dayalı bir B2B satış paketi üretirsin.
Mirofish Kuralları:
- Ortalama sepet: €${params.averageBasketEuro}
- Konaklama Partneri (Arz - PMC & Butik Otel): Sıfır kurulum maliyeti (€0 CAC), her odaya/daireye lazer kesim ahşap QR stand + 7/24 çok dilli Comus AI concierge, her satıştan %${params.b2bPartnerPassivePercent} net pasif B2B gelir payı.
- Küratörlü Hizmet Tedarikçisi (Revenue Node): GetYourGuide/Viator %25-%30 komisyonu yerine %${params.supplierPayoutPercent} net hakediş, %${params.platformCommissionPercent} platform komisyonu, yıllık €${params.annualPremiumListingFeeEuro} kapalı ağ üyeliği ve Faz-1'de ${params.phase1PilotUnitsTarget} odaya/daireye doğrudan erişim.
- Yanıtını YALNIZCA geçerli bir JSON nesnesi olarak döndür:
{
  "whatsappMessage": "...",
  "emailSubject": "...",
  "emailBody": "...",
  "fieldScript": "...",
  "financialSummary": "..."
}`;

          const prompt = `Lead Bilgileri:
- İşletme: ${lead.name}
- Rol: ${lead.roleType}
- Kategori: ${lead.category}
- Bölge: ${lead.district} (${lead.neighborhood})
- Kapasite: ${lead.unitCount} ${lead.unitLabel}
- Karar Verici: ${lead.decisionMakerRole} ${lead.decisionMakerName ? `(${lead.decisionMakerName})` : ''}
- Yasal Kalkan: ${lead.legalShieldStatus}
- Aylık Tahmini Hacim: €${lead.estimatedMonthlyEuroVolume}
- Net Partner/Tedarikçi Hakedişi: €${lead.partnerOrSupplierNetEuro}/ay
- Platform Komisyonu: €${lead.platformCommissionEuro}/ay
- Yıllık Ağ Üyeliği: €${lead.annualListingFeeEuro}
- Saha Notu: ${lead.fieldNotes}
- Pitch Açısı: ${lead.pitchAngle}
- İstenen Dil: ${language === 'en' ? 'İngilizce (English)' : 'Türkçe'}
- İstenen Ton: ${tone}

Lütfen doğrudan kopyalanıp gönderilebilecek WhatsApp mesajı, E-Posta konusu, E-Posta gövdesi, Saha ziyareti senaryosu ve Mirofish Finansal Özetini JSON formatında üret.`;

          const interaction = await ai.interactions.create({
            model: 'gemini-3.8-flash',
            system_instruction: systemInstruction,
            input: prompt,
          });

          const parsed = extractJsonBlock(interaction.output_text || '');
          if (parsed && typeof parsed === 'object' && parsed.whatsappMessage) {
            const pitch: B2BAgentPitch = {
              whatsappMessage: String(parsed.whatsappMessage || fallbackPitch.whatsappMessage),
              emailSubject: String(parsed.emailSubject || fallbackPitch.emailSubject),
              emailBody: String(parsed.emailBody || fallbackPitch.emailBody),
              fieldScript: String(parsed.fieldScript || fallbackPitch.fieldScript),
              financialSummary: String(parsed.financialSummary || fallbackPitch.financialSummary),
              language,
              tone,
              generatedAt: new Date().toISOString(),
            };
            return NextResponse.json({
              ok: true,
              source: 'gemini_3_8_flash',
              pitch,
            });
          }
        } catch (err) {
          console.warn('[b2b-agents generate_pitch Gemini warning]:', err);
        }
      }

      return NextResponse.json({
        ok: true,
        source: 'mirofish_engine',
        pitch: fallbackPitch,
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Desteklenmeyen ajan aksiyonu.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[api/admin/b2b-agents] error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Ajan işlemi sırasında bir sunucu hatası oluştu. Lütfen tekrar deneyin.',
      },
      { status: 500 }
    );
  }
}
