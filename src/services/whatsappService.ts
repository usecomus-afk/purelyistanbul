/**
 * Xenios & Comus 0850 Meta WhatsApp Cloud API Service (+90 850 308 59 06)
 * Dispatches Real-Time Guest In-Stay Orders & Service Requests, Digital QR Vouchers & Location Pins
 * Uses Official Meta Graph API (v21.0)
 */

const COMUS_DEFAULT_WHATSAPP_TOKEN =
  'EAAQL7lziK8wBSqJWGlNoDwz1fAepnwZBVDzNB3sMN2X3qGqS2SzoaZBZACwBfCP3ah8uzSrKBDR8gIfCfdl3YRq5M6uZBah95bUm32mjlDxxJ3TzSWKW9L7465fcBcy71hJLl2dzV6yIadLI5Y7JO6VZCpEKYrjclkxoZBa37ZBdPqVzw2ZCJIyLzZAuVOzEUuwZDZD';
const COMUS_DEFAULT_PHONE_NUMBER_ID = '1384418771423280'; // +90 850 308 59 06 (Rezervasyon Comus)

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
    const isLive = !!token && !!phoneId && !token.includes('mock') && !token.startsWith('test_');
    return { token, phoneId, isLive, senderNumber: '+90 850 308 59 06' };
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
        process.env.WHATSAPP_DEFAULT_RECIPIENT_PHONES || '+905332036260,+905321635520';
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

    const baseUrl = (reqData.baseUrl || 'https://xenios.usecomus.com').replace(/\/$/, '');
    const quickCompleteUrl = `${baseUrl}/api/requests/quick-action?id=${encodeURIComponent(reqData.requestId)}&action=complete`;
    const portalUrl = `${baseUrl}/hotel-portal/requests`;

    const messageBody = [
      headerTitle,
      '━━━━━━━━━━━━━━━━━━━━━━',
      `🏨 *Tesis:* ${reqData.hotelName || 'Purely Istanbul Partner'}`,
      `🚪 *Birim:* ${unitLabel}`,
      `🛎️ *Talep / Sipariş:* ${reqData.serviceTitle}`,
      `🏢 *Departman:* ${reqData.department || 'Konaklama İçi Hizmet'}`,
      `⚡ *Öncelik:* ${isUrgent ? '🚨 ACİL' : 'Standart'}`,
      `⏰ *Tarih & Saat:* ${timeFormatted}`,
      cleanNotes ? `📝 *Detay / Not:* ${cleanNotes}` : '',
      paymentLine ? paymentLine.trim() : '',
      '━━━━━━━━━━━━━━━━━━━━━━',
      `✅ *TAMAMLANDI İŞARETLE (Tek Tık):*\n${quickCompleteUrl}`,
      '',
      `📲 *Canlı Talep Paneli:*\n${portalUrl}`,
    ]
      .filter((line) => line !== '')
      .join('\n');

    const results: WhatsAppSendResult[] = [];

    for (const formattedPhone of recipients) {
      if (isLive) {
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

        if (response.ok) {
          const data = await response.json();
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
      } catch (err) {
        console.warn('[WHATSAPP API] Live dispatch error, falling back to simulation:', err);
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

