/**
 * Xenios & Comus 0850 Meta WhatsApp Cloud API Service (+90 850 308 59 06)
 * Dispatches Real-Time Guest In-Stay Orders & Service Requests, Digital QR Vouchers & Location Pins
 * Uses Official Meta Graph API (v21.0)
 */

const COMUS_DEFAULT_WHATSAPP_TOKEN =
  'EAAQL7lziK8wBSqJWGlNoDwz1fAepnwZBVDzNB3sMN2X3qGqS2SzoaZBZACwBfCP3ah8uzSrKBDR8gIfCfdl3YRq5M6uZBah95bUm32mjlDxxJ3TzSWKW9L7465fcBcy71hJLl2dzV6yIadLI5Y7JO6VZCpEKYrjclkxoZBa37ZBdPqVzw2ZCJIyLzZAuVOzEUuwZDZD';
const COMUS_DEFAULT_PHONE_NUMBER_ID = '1384418771423280'; // +90 850 308 59 06 (Rezervasyon Comus)
const COMUS_DEFAULT_WABA_ID = '4071375639665332'; // Meta WhatsApp Business Account: "comus"

export interface WhatsAppBookingDetailsDTO {
  bookingId: string;
  confirmationCode: string;
  experienceTitle: string;
  providerName: string;
  guestName: string;
  guestCount: number;
  bookingDate: string;
  bookingTime: string;
  hotelName: string;
  roomNumber: string;
  amount: number;
  currency: string;
  voucherUrl?: string;
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface WhatsAppGuestRequestAlertDTO {
  requestId: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  serviceKey: string;
  serviceTitle: string;
  notes?: string;
  department?: string;
  priority?: 'standart' | 'acil' | string;
  createdAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentReference?: string;
  baseUrl?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  message_id: string;
  recipient_phone: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  sender_number?: string;
  details?: any;
}

export class WhatsAppService {
  static getCredentials() {
    const token =
      process.env.WHATSAPP_CLOUD_API_TOKEN ||
      process.env.WHATSAPP_API_TOKEN ||
      COMUS_DEFAULT_WHATSAPP_TOKEN;
    const phoneId =
      process.env.WHATSAPP_PHONE_NUMBER_ID || COMUS_DEFAULT_PHONE_NUMBER_ID;
    const wabaId =
      process.env.WHATSAPP_WABA_ID || COMUS_DEFAULT_WABA_ID;
    const isLive = !!token && !!phoneId && !token.includes('mock') && !token.startsWith('test_');
    return { token, phoneId, wabaId, isLive, senderNumber: '+90 850 308 59 06' };
  }

  /**
   * Meta yalnızca son 24 saat içinde size yazmış kişilere serbest metin teslim eder.
   * Bu pencere dışındaki (işletme başlatmalı) mesajlar, Meta'da ONAYLI bir şablonla gönderilmelidir;
   * aksi halde API 200 döner ama mesaj sessizce düşer (hata 131047 webhook ile gelir).
   * WABA "comus" (4071375639665332) üzerinde onaylı şablonlarımız varsayılan olarak tanımlıdır.
   */
  static getTemplateConfig() {
    return {
      language: process.env.WHATSAPP_TEMPLATE_LANG || 'tr',
      orderAlert:
        process.env.WHATSAPP_TEMPLATE_ORDER_ALERT || 'misafir_siparis_talep_bildirimi',
      orderAlertFallback:
        process.env.WHATSAPP_TEMPLATE_ORDER_ALERT_FALLBACK || 'yeni_rezervasyon_bildirimi',
      reservationConfirm:
        process.env.WHATSAPP_TEMPLATE_RESERVATION_CONFIRM || 'rezervasyon_onay_bildirimi',
      reservationConfirmFallback: 'yeni_rezervasyon_bildirimi',
    };
  }

  private static unwrapFirestoreVal(val: any): any {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('booleanValue' in val) return Boolean(val.booleanValue);
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('nullValue' in val) return null;
    if ('arrayValue' in val) {
      const values = val.arrayValue?.values;
      return Array.isArray(values) ? values.map((v: any) => this.unwrapFirestoreVal(v)) : [];
    }
    if ('mapValue' in val) {
      const fields = val.mapValue?.fields || {};
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(fields)) {
        out[k] = this.unwrapFirestoreVal(v);
      }
      return out;
    }
    return val;
  }

  private static normalizeDeptKey(rawDeptOrService?: string): string {
    const s = String(rawDeptOrService || '').toLowerCase();
    if (!s) return '';
    if (s.includes('teknik') || s.includes('technical') || s.includes('maintenance') || s.includes('arıza') || s.includes('ac') || s.includes('wifi')) {
      return 'Teknik';
    }
    if (s.includes('mutfak') || s.includes('kahvaltı') || s.includes('breakfast') || s.includes('roomservice') || s.includes('room service') || s.includes('yeme') || s.includes('minibar')) {
      return 'Mutfak';
    }
    if (s.includes('housekeeping') || s.includes('temizlik') || s.includes('cleaning') || s.includes('havlu') || s.includes('towel') || s.includes('çarşaf') || s.includes('linen') || s.includes('pillow') || s.includes('yastık') || s.includes('toiletries') || s.includes('hygiene')) {
      return 'Housekeeping';
    }
    if (s.includes('çamaşır') || s.includes('laundry') || s.includes('kuru temizleme') || s.includes('ütü')) {
      return 'Çamaşırhane';
    }
    if (s.includes('concierge') || s.includes('taksi') || s.includes('taxi') || s.includes('transfer') || s.includes('ulaşım')) {
      return 'Concierge';
    }
    if (s.includes('resepsiyon') || s.includes('ön büro') || s.includes('danışma') || s.includes('checkout') || s.includes('extend')) {
      return 'Resepsiyon';
    }
    return '';
  }

  /**
   * Resolves all WhatsApp recipient phones for a hotel, including responsible staff routed by department/serviceKey.
   */
  static async resolveHotelRecipients(
    hotelId: string = 'hotel-heritage-1',
    explicitPhones?: string | string[],
    departmentOrServiceKey?: string
  ): Promise<string[]> {
    const candidates: string[] = [];

    if (explicitPhones) {
      if (Array.isArray(explicitPhones)) {
        candidates.push(...explicitPhones);
      } else {
        candidates.push(String(explicitPhones));
      }
    }

    const normDept = this.normalizeDeptKey(departmentOrServiceKey);

    try {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/hotels/${encodeURIComponent(hotelId)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const docData = await res.json();
        const fields = docData?.fields || {};
        const hotelObj = this.unwrapFirestoreVal({ mapValue: { fields } }) || {};

        // 1. Check department-routed staff members first (highest priority)
        const staffList: Array<any> = Array.isArray(hotelObj.staffMembers)
          ? hotelObj.staffMembers
          : [];
        const routingMap: Record<string, string> =
          hotelObj.departmentStaffRouting && typeof hotelObj.departmentStaffRouting === 'object'
            ? hotelObj.departmentStaffRouting
            : {};

        if (normDept && routingMap[normDept]) {
          const routedStaffId = routingMap[normDept];
          const routedStaff = staffList.find(
            (st) => st && st.active !== false && st.id === routedStaffId && st.whatsappPhone
          );
          if (routedStaff?.whatsappPhone) {
            candidates.push(String(routedStaff.whatsappPhone));
          }
        }

        // 2. Also include any active staff member assigned to this department or marked receiveAllAlerts (Genel Sorumlu)
        for (const st of staffList) {
          if (!st || st.active === false || !st.whatsappPhone) continue;
          const depts: string[] = Array.isArray(st.departments) ? st.departments : [];
          if (
            st.receiveAllAlerts ||
            depts.includes('all') ||
            (normDept && depts.includes(normDept))
          ) {
            candidates.push(String(st.whatsappPhone));
          }
        }

        // 3. Always include main hotel WhatsApp / Manager phone
        if (fields.whatsappPhone?.stringValue) {
          candidates.push(fields.whatsappPhone.stringValue);
        }
        if (fields.managerPhone?.stringValue) {
          candidates.push(fields.managerPhone.stringValue);
        }
      }
    } catch {
      // Ignore Firestore lookup error and fall back to env/default
    }

    const defaultEnv =
      process.env.WHATSAPP_DEFAULT_RECIPIENT_PHONES || '+905325809676';
    candidates.push(defaultEnv);

    const parsed = this.parseRecipientPhones(candidates.join(','));
    if (!parsed.includes('905325809676')) {
      parsed.unshift('905325809676');
    }
    return parsed;
  }

  /** Şablon parametreleri satır sonu / tab / 4+ boşluk içeremez. */
  static sanitizeTemplateParam(value: string): string {
    const clean = String(value ?? '')
      .replace(/[\r\n\t]+/g, ' · ')
      .replace(/ {4,}/g, '   ')
      .trim();
    return (clean || '-').slice(0, 1000);
  }

  /**
   * Onaylı Meta şablonu ile mesaj gönderir (24 saat penceresi dışında çalışan tek yöntem).
   */
  static async sendTemplateMessage(
    phone: string,
    templateName: string,
    bodyParams: string[],
    language?: string
  ): Promise<WhatsAppSendResult> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const { token, phoneId, isLive, senderNumber } = this.getCredentials();
    const lang = language || this.getTemplateConfig().language;

    if (!isLive || !formattedPhone) {
      return {
        success: false,
        message_id: '',
        recipient_phone: formattedPhone,
        status: 'FAILED',
        sender_number: senderNumber,
        details: { error: 'WhatsApp API yapılandırılmamış veya telefon numarası geçersiz.' },
      };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: lang },
            components: bodyParams.length
              ? [
                  {
                    type: 'body',
                    parameters: bodyParams.map((p) => ({
                      type: 'text',
                      text: this.sanitizeTemplateParam(p),
                    })),
                  },
                ]
              : [],
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return {
          success: true,
          message_id: data.messages?.[0]?.id || `wamid_${Date.now()}`,
          recipient_phone: formattedPhone,
          status: 'SENT',
          sender_number: senderNumber,
          details: data,
        };
      }
      console.error('[WHATSAPP TEMPLATE API] Error response:', response.status, data);
      return {
        success: false,
        message_id: '',
        recipient_phone: formattedPhone,
        status: 'FAILED',
        sender_number: senderNumber,
        details: { error: data?.error?.message || `HTTP ${response.status}`, ...data },
      };
    } catch (err: any) {
      console.warn('[WHATSAPP TEMPLATE API] Network error:', err);
      return {
        success: false,
        message_id: '',
        recipient_phone: formattedPhone,
        status: 'FAILED',
        sender_number: senderNumber,
        details: { error: err?.message },
      };
    }
  }

  /**
   * Normalizes a Turkish or international phone number to Meta Graph API E.164 digits (e.g. "905321635520").
   */
  static formatPhoneNumber(phone: string): string {
    let digits = String(phone || '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('05')) {
      digits = '90' + digits.slice(1);
    } else if (digits.length === 10 && digits.startsWith('5')) {
      digits = '90' + digits;
    }
    return digits;
  }

  /**
   * Parses comma/semicolon-separated phone numbers and filters out invalid/dummy placeholders.
   */
  static parseRecipientPhones(rawInput?: string | string[]): string[] {
    const rawList = Array.isArray(rawInput)
      ? rawInput
      : String(rawInput || '')
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);

    const seen = new Set<string>();
    const valid: string[] = [];

    for (const item of rawList) {
      const normalized = this.formatPhoneNumber(item);
      if (
        normalized.length >= 10 &&
        normalized !== '905325554433' && // Ignore default demo placeholder
        normalized !== '902125189000' && // Ignore landline placeholder
        normalized !== '902125140000' &&
        normalized !== '908503085906' // Never send to sender number itself
      ) {
        if (!seen.has(normalized)) {
          seen.add(normalized);
          valid.push(normalized);
        }
      }
    }
    return valid;
  }

  /**
   * 0. Misafir Sipariş & Hizmet Taleplerini 0850 Comus WhatsApp Hattından Yetkiliye İletir
   */
  static async sendGuestRequestAlertWhatsApp(
    phones: string | string[],
    reqData: WhatsAppGuestRequestAlertDTO
  ): Promise<{
    success: boolean;
    sender_number: string;
    dispatched: WhatsAppSendResult[];
  }> {
    const { token, phoneId, isLive, senderNumber } = this.getCredentials();
    let recipients = this.parseRecipientPhones(phones);

    if (recipients.length === 0) {
      const envDefaults =
        process.env.WHATSAPP_DEFAULT_RECIPIENT_PHONES || '+905325809676';
      recipients = this.parseRecipientPhones(envDefaults);
    }

    const isUrgent = reqData.priority === 'acil';
    const headerTitle = isUrgent
      ? '🚨 *ACİL MİSAFİR TALEBİ / SİPARİŞİ*'
      : '🔔 *YENİ MİSAFİR SİPARİŞİ & TALEBİ*';

    const rawUnit = String(reqData.roomNumber || '101').trim();
    const unitLabel = /^(Birim|Daire|Suite|Oda)/i.test(rawUnit) ? rawUnit : `Birim ${rawUnit}`;

    const nowDate = reqData.createdAt ? new Date(reqData.createdAt) : new Date();
    const timeFormatted = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(nowDate);

    const cleanNotes = (reqData.notes || '').trim();
    let paymentLine = '';
    if (reqData.paymentAmount && reqData.paymentAmount > 0) {
      const curr = reqData.paymentCurrency || 'TRY';
      const methodLabel =
        reqData.paymentMethod === 'online_card' || reqData.paymentStatus === 'paid_online'
          ? 'Online Kart ile Ödendi'
          : 'Birim Folyosu / Teslimatta';
      paymentLine = `\n💳 *Tutar / Ödeme:* ${reqData.paymentAmount} ${curr} (${methodLabel})`;
    }

    const shortCode = String(reqData.requestId || '')
      .replace(/^req-/, '')
      .slice(-6)
      .toUpperCase();

    const messageBody = [
      headerTitle,
      '━━━━━━━━━━━━━━━━━━━━━━',
      `🏨 *Tesis:* ${reqData.hotelName || 'Old City Comus'}`,
      `🚪 *Birim:* ${unitLabel}`,
      `🛎️ *Talep / Sipariş:* ${reqData.serviceTitle}`,
      `🏢 *Departman:* ${reqData.department || 'Konaklama İçi Hizmet'}`,
      `⚡ *Öncelik:* ${isUrgent ? '🚨 ACİL' : 'Standart'}`,
      `⏰ *Tarih & Saat:* ${timeFormatted}`,
      cleanNotes ? `📝 *Detay / Not:* ${cleanNotes}` : '',
      paymentLine ? paymentLine.trim() : '',
      shortCode ? `🔖 *Talep Kodu:* #${shortCode}` : '',
      '━━━━━━━━━━━━━━━━━━━━━━',
      '✅ *Onaylamak İçin:* Aşağıdaki *Onayla & Tamamla* butonuna dokunun veya *OK* yazın.',
    ]
      .filter((line) => line !== '')
      .join('\n');

    const results: WhatsAppSendResult[] = [];
    const { orderAlert: orderTemplate, orderAlertFallback } = this.getTemplateConfig();
    const [datePart, timePart] = timeFormatted.split(' ');

    for (const formattedPhone of recipients) {
      let templateDelivered = false;

      // 1. Önce 24 saat penceresinden bağımsız (7/24 garantili) ONAYLI Meta Şablonu gönder
      if (isLive && orderTemplate) {
        // Birincil şablon: misafir_siparis_talep_bildirimi ({{1}} Tesis, {{2}} Birim, {{3}} Talep, {{4}} Öncelik, {{5}} Not, {{6}} Talep Kodu)
        const primaryTplRes = await this.sendTemplateMessage(formattedPhone, orderTemplate, [
          reqData.hotelName || 'Old City Comus',
          unitLabel,
          reqData.serviceTitle,
          isUrgent ? 'ACİL' : 'Standart',
          [cleanNotes, paymentLine.replace(/\*/g, '').trim()].filter(Boolean).join(' · ') || '-',
          shortCode ? `#${shortCode}` : '-',
        ]);

        if (primaryTplRes.success) {
          results.push(primaryTplRes);
          templateDelivered = true;
        } else if (orderAlertFallback && orderAlertFallback !== orderTemplate) {
          // Yedek onaylı şablon: yeni_rezervasyon_bildirimi (WABA 4071375639665332 üzerinde APPROVED)
          const fallbackTplRes = await this.sendTemplateMessage(
            formattedPhone,
            orderAlertFallback,
            [
              `${reqData.hotelName || 'Old City Comus'} — ${unitLabel}`,
              `${reqData.serviceTitle} (${isUrgent ? 'ACİL' : 'Standart'})`,
              [
                cleanNotes,
                paymentLine.replace(/\*/g, '').trim(),
                shortCode ? `Talep Kodu: #${shortCode}` : '',
              ]
                .filter(Boolean)
                .join(' · ') || 'Misafir Talebi',
              datePart || timeFormatted,
              `${timePart || ''} (Onay için OK yazınız)`.trim(),
            ]
          );
          if (fallbackTplRes.success) {
            results.push(fallbackTplRes);
            templateDelivered = true;
          } else {
            console.warn(
              `[WHATSAPP 0850 API] Both primary ('${orderTemplate}') and fallback ('${orderAlertFallback}') templates failed:`,
              fallbackTplRes.details
            );
          }
        }
      }

      if (isLive) {
        try {
          // 2. Ayrıca interaktif "✅ Onayla & Tamamla" butonlu mesajı da gönder (24 saatlik pencere açıksa tek dokunuşla onay sağlar)
          const interactiveBody = messageBody.slice(0, 1020);
          const interactiveRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: formattedPhone,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: interactiveBody },
                footer: { text: 'Purely Istanbul • Comus Concierge' },
                action: {
                  buttons: [
                    {
                      type: 'reply',
                      reply: {
                        id: shortCode ? `OK #${shortCode}` : 'OK',
                        title: '✅ Onayla & Tamamla',
                      },
                    },
                  ],
                },
              },
            }),
          });

          if (interactiveRes.ok) {
            const intData = await interactiveRes.json().catch(() => ({}));
            const msgId = intData.messages?.[0]?.id || `wamid_${Date.now()}`;
            if (!templateDelivered) {
              results.push({
                success: true,
                message_id: msgId,
                recipient_phone: formattedPhone,
                status: 'SENT',
                sender_number: senderNumber,
                details: intData,
              });
            }
            continue;
          }

          if (templateDelivered) {
            continue;
          }

          // 3. Fallback to standard text message if interactive payload exceeds limits
          const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: formattedPhone,
              type: 'text',
              text: {
                preview_url: false,
                body: messageBody,
              },
            }),
          });

          const data = await response.json().catch(() => ({}));
          if (response.ok) {
            const msgId = data.messages?.[0]?.id || `wamid_${Date.now()}`;
            results.push({
              success: true,
              message_id: msgId,
              recipient_phone: formattedPhone,
              status: 'SENT',
              sender_number: senderNumber,
              details: data,
            });
            continue;
          } else {
            console.error('[WHATSAPP 0850 API] Error response:', response.status, data);
            results.push({
              success: false,
              message_id: '',
              recipient_phone: formattedPhone,
              status: 'FAILED',
              sender_number: senderNumber,
              details: data,
            });
            continue;
          }
        } catch (err: any) {
          console.warn('[WHATSAPP 0850 API] Network error:', err);
          results.push({
            success: false,
            message_id: '',
            recipient_phone: formattedPhone,
            status: 'FAILED',
            sender_number: senderNumber,
            details: { error: err?.message },
          });
          continue;
        }
      }

      const simId = `wamid_mock_${Date.now()}`;
      results.push({
        success: true,
        message_id: simId,
        recipient_phone: formattedPhone,
        status: 'SIMULATED',
        sender_number: senderNumber,
      });
    }

    return {
      success: results.some((r) => r.success),
      sender_number: senderNumber,
      dispatched: results,
    };
  }

  /**
   * Serbest metin WhatsApp yanıt mesajı gönderir (Webhook onay dönüşü vb. için)
   */
  static async sendTextMessage(
    phone: string,
    body: string,
    previewUrl: boolean = true
  ): Promise<WhatsAppSendResult> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const { token, phoneId, isLive, senderNumber } = this.getCredentials();

    if (isLive && formattedPhone) {
      try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: {
              preview_url: previewUrl,
              body,
            },
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          return {
            success: true,
            message_id: data.messages?.[0]?.id || `wamid_${Date.now()}`,
            recipient_phone: formattedPhone,
            status: 'SENT',
            sender_number: senderNumber,
            details: data,
          };
        } else {
          return {
            success: false,
            message_id: '',
            recipient_phone: formattedPhone,
            status: 'FAILED',
            sender_number: senderNumber,
            details: data,
          };
        }
      } catch (err: any) {
        console.warn('[WHATSAPP TEXT API] Error:', err);
        return {
          success: false,
          message_id: '',
          recipient_phone: formattedPhone,
          status: 'FAILED',
          sender_number: senderNumber,
          details: { error: err?.message },
        };
      }
    }

    return {
      success: false,
      message_id: '',
      recipient_phone: formattedPhone,
      status: 'FAILED',
      sender_number: senderNumber,
    };
  }

  /**
   * 1. Rezervasyon Onayı ve Dijital Bilet İletimi (sendBookingConfirmationWhatsApp)
   */
  static async sendBookingConfirmationWhatsApp(
    phone: string,
    details: WhatsAppBookingDetailsDTO
  ): Promise<WhatsAppSendResult> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const { token, phoneId, isLive, senderNumber } = this.getCredentials();

    const voucherLink = details.voucherUrl || `https://xenios.usecomus.com/confirm-booking/${details.bookingId}`;

    const messageBody = `✨ *PURELY ISTANBUL — REZERVASYONUNUZ ONAYLANDI* ✨

Sayın *${details.guestName}*,
${details.hotelName} (Birim ${details.roomNumber}) konaklamanız için deneyim rezervasyonunuz başarıyla tamamlandı.

📋 *Rezervasyon Detayları:*
• *Deneyim:* ${details.experienceTitle}
• *Sağlayıcı:* ${details.providerName}
• *Tarih & Saat:* ${details.bookingDate} - ${details.bookingTime}
• *Kişi Sayısı:* ${details.guestCount} Misafir
• *Onay Kodu:* \`${details.confirmationCode}\`

🎟️ *Dijital QR Biletiniz:*
${voucherLink}

📍 *Buluşma Noktası:* ${details.locationName || 'Karaköy / Kabataş İskelesi'}
${details.locationAddress ? `_${details.locationAddress}_` : ''}

📞 *7/24 Misafir Destek Hattı:* ${senderNumber}
Keyifli ve unutulmaz bir İstanbul deneyimi dileriz!`;

    if (isLive) {
      const { reservationConfirm, reservationConfirmFallback } = this.getTemplateConfig();
      let templateResult: WhatsAppSendResult | null = null;

      if (reservationConfirm) {
        // Şablon değişkenleri: {{1}} Misafir, {{2}} Tesis, {{3}} Detay (deneyim/tarih/kod)
        const primaryRes = await this.sendTemplateMessage(formattedPhone, reservationConfirm, [
          details.guestName,
          `${details.hotelName} (Birim ${details.roomNumber})`,
          `${details.experienceTitle} · ${details.bookingDate} ${details.bookingTime} · Onay Kodu: ${details.confirmationCode}`,
        ]);
        if (primaryRes.success) {
          templateResult = primaryRes;
        } else if (reservationConfirmFallback && reservationConfirmFallback !== reservationConfirm) {
          const fallbackRes = await this.sendTemplateMessage(
            formattedPhone,
            reservationConfirmFallback,
            [
              `${details.hotelName} (Birim ${details.roomNumber})`,
              details.guestName,
              `${details.guestCount} Kişi · ${details.experienceTitle}`,
              details.bookingDate,
              `${details.bookingTime} (Kod: ${details.confirmationCode})`,
            ]
          );
          if (fallbackRes.success) {
            templateResult = fallbackRes;
          }
        }
      }

      try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: {
              preview_url: true,
              body: messageBody
            }
          })
        });

        const data = await response.json().catch(() => ({}));
        if (templateResult) {
          return templateResult;
        }
        if (response.ok) {
          const msgId = data.messages?.[0]?.id || `wamid_${Date.now()}`;
          return {
            success: true,
            message_id: msgId,
            recipient_phone: formattedPhone,
            status: 'SENT',
            sender_number: senderNumber,
            details: data
          };
        }
        console.error('[WHATSAPP API] Booking confirmation failed:', response.status, data);
        return {
          success: false,
          message_id: '',
          recipient_phone: formattedPhone,
          status: 'FAILED',
          sender_number: senderNumber,
          details: { error: data?.error?.message || `HTTP ${response.status}`, ...data }
        };
      } catch (err: any) {
        if (templateResult) {
          return templateResult;
        }
        console.warn('[WHATSAPP API] Live dispatch error:', err);
        return {
          success: false,
          message_id: '',
          recipient_phone: formattedPhone,
          status: 'FAILED',
          sender_number: senderNumber,
          details: { error: err?.message }
        };
      }
    }

    const simulatedMsgId = `wamid_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    console.log(`[WHATSAPP SIMULATION] To: +${formattedPhone} | Message ID: ${simulatedMsgId}\n${messageBody}`);

    return {
      success: true,
      message_id: simulatedMsgId,
      recipient_phone: formattedPhone,
      status: 'SIMULATED',
      sender_number: senderNumber
    };
  }

  /**
   * 2. Buluşma İskelesi / Mekan Konum Pini İletimi (sendLocationPinWhatsApp)
   */
  static async sendLocationPinWhatsApp(
    phone: string,
    latitude: number,
    longitude: number,
    name: string,
    address?: string
  ): Promise<WhatsAppSendResult> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const { token, phoneId, isLive, senderNumber } = this.getCredentials();

    if (isLive) {
      try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'location',
            location: {
              latitude,
              longitude,
              name,
              address: address || 'İstanbul, Türkiye'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message_id: data.messages?.[0]?.id || `wamid_loc_${Date.now()}`,
            recipient_phone: formattedPhone,
            status: 'SENT',
            sender_number: senderNumber
          };
        }
      } catch (err) {
        console.warn('[WHATSAPP LOCATION API] Failed, fallback to simulation:', err);
      }
    }

    const simId = `wamid_loc_mock_${Date.now()}`;
    console.log(
      `[WHATSAPP LOCATION PIN SIMULATION] To: +${formattedPhone} | Pin: ${latitude}, ${longitude} (${name})`
    );

    return {
      success: true,
      message_id: simId,
      recipient_phone: formattedPhone,
      status: 'SIMULATED',
      sender_number: senderNumber
    };
  }
}

