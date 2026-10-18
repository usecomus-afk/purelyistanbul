import { NextResponse } from 'next/server';
import { NotificationDispatcher } from '@/services/notificationDispatcher';
import { FcmPushService } from '@/services/fcmPushService';
import { WhatsAppService } from '@/services/whatsappService';

const FIRESTORE_REQUESTS_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests';

const FIRESTORE_HOTELS_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/hotels';

async function resolveHotelWhatsAppRecipients(
  hotelId: string,
  explicitPhones?: string | string[]
): Promise<string[]> {
  const candidates: string[] = [];

  if (explicitPhones) {
    if (Array.isArray(explicitPhones)) {
      candidates.push(...explicitPhones);
    } else {
      candidates.push(String(explicitPhones));
    }
  }

  try {
    const res = await fetch(`${FIRESTORE_HOTELS_BASE_URL}/${encodeURIComponent(hotelId)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const docData = await res.json();
      const fields = docData?.fields || {};
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

  const parsed = WhatsAppService.parseRecipientPhones(candidates.join(','));
  // Ensure test/default phone 905325809676 is always included unless explicitly removed
  if (!parsed.includes('905325809676')) {
    parsed.unshift('905325809676');
  }
  return parsed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nowIso = new Date().toISOString();

    const id = String(body.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const hotelId = String(body.hotelId || 'hotel-heritage-1');
    const hotelName = String(body.hotelName || 'Purely Istanbul Partner Hotel');
    const roomNumber = String(body.roomNumber || body.unitName || '101').trim();
    const serviceKey = String(body.serviceKey || 'service');
    const serviceTitle = String(body.serviceTitle || body.title || 'Birim Hizmeti');
    const notes = String(body.notes || '');
    const status = String(body.status || 'pending');
    const department = String(body.department || 'Housekeeping');
    const stage = String(body.stage || 'pending');
    const priority = String(body.priority || 'standart');
    const createdAt = String(body.createdAt || nowIso);

    // 1. Persist to Firestore REST if not already persisted
    if (body.persistToFirestore !== false) {
      const restFields: Record<string, any> = {
        id: { stringValue: id },
        hotelId: { stringValue: hotelId },
        hotelName: { stringValue: hotelName },
        roomNumber: { stringValue: roomNumber },
        serviceKey: { stringValue: serviceKey },
        serviceTitle: { stringValue: serviceTitle },
        notes: { stringValue: notes },
        status: { stringValue: status },
        department: { stringValue: department },
        stage: { stringValue: stage },
        priority: { stringValue: priority },
        createdAt: { stringValue: createdAt },
        updatedAt: { stringValue: nowIso },
      };

      if (body.paymentMethod) {
        restFields.paymentMethod = { stringValue: String(body.paymentMethod) };
      }
      if (body.paymentStatus) {
        restFields.paymentStatus = { stringValue: String(body.paymentStatus) };
      }
      if (body.paymentAmount !== undefined) {
        restFields.paymentAmount = { doubleValue: Number(body.paymentAmount) };
      }
      if (body.paymentCurrency) {
        restFields.paymentCurrency = { stringValue: String(body.paymentCurrency) };
      }
      if (body.paymentReference) {
        restFields.paymentReference = { stringValue: String(body.paymentReference) };
      }

      fetch(`${FIRESTORE_REQUESTS_BASE_URL}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: restFields }),
      }).catch(() => {});
    }

    // 2. Build APNs, FCM & 0850 WhatsApp Alert
    const isUrgent = priority === 'acil';
    const alertTitle = isUrgent ? '🚨 Acil Misafir Talebi! 🛎️' : 'Yeni Misafir Talebi! 🛎️';
    const unitPrefix = /^(Daire|Birim|Suite|Oda)/i.test(roomNumber) ? roomNumber : `Birim ${roomNumber}`;
    const cleanNotes = notes ? notes.replace(/\s+/g, ' ').trim() : '';
    const alertBody =
      body.body ||
      `${unitPrefix} - ${serviceTitle}${cleanNotes ? ` (${cleanNotes})` : ''} Siparişi Verildi.`;

    const apnsPayload = FcmPushService.buildApnsPayload({
      title: alertTitle,
      body: alertBody,
      badgeCount: 1,
      dataPayload: {
        requestId: id,
        hotelId,
        roomNumber,
        url: '/hotel-portal/requests',
      },
    });

    const originUrl = (() => {
      try {
        return new URL(req.url).origin;
      } catch {
        return 'https://xenios.usecomus.com';
      }
    })();

    const recipientPhones = await resolveHotelWhatsAppRecipients(
      hotelId,
      body.whatsappPhone || body.managerPhone
    );

    const [whatsappResult, pushResult] = await Promise.all([
      WhatsAppService.sendGuestRequestAlertWhatsApp(recipientPhones, {
        requestId: id,
        hotelId,
        hotelName,
        roomNumber,
        serviceKey,
        serviceTitle,
        notes,
        department,
        priority,
        createdAt,
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentStatus,
        paymentAmount: body.paymentAmount !== undefined ? Number(body.paymentAmount) : undefined,
        paymentCurrency: body.paymentCurrency,
        paymentReference: body.paymentReference,
        baseUrl: originUrl.includes('localhost') ? 'https://xenios.usecomus.com' : originUrl,
      }),
      NotificationDispatcher.dispatchSmartNotification({
        targetRole: 'staff',
        hotelId,
        roomNumber,
        requestId: id,
        priority: isUrgent ? 'acil' : 'standart',
        urgency: isUrgent ? 'HIGH' : 'NORMAL',
        title: alertTitle,
        subtitle: hotelName,
        body: alertBody,
        url: '/hotel-portal/requests',
        dataPayload: {
          requestId: id,
          hotelId,
          roomNumber,
          serviceKey,
        },
      }),
    ]);

    const firstWamid = whatsappResult?.dispatched?.find((d) => d.message_id)?.message_id || '';
    if (firstWamid) {
      await fetch(
        `${FIRESTORE_REQUESTS_BASE_URL}/${encodeURIComponent(id)}?updateMask.fieldPaths=whatsappMessageId&updateMask.fieldPaths=status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              whatsappMessageId: { stringValue: firstWamid },
              status: { stringValue: status },
            },
          }),
        }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      requestId: id,
      whatsappResult,
      apnsPayload,
      pushResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

