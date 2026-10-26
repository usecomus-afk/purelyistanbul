import { rateLimit } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { NotificationDispatcher } from '@/services/notificationDispatcher';
import { FcmPushService } from '@/services/fcmPushService';
import { WhatsAppService } from '@/services/whatsappService';

const FIRESTORE_REQUESTS_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests';

async function resolveHotelWhatsAppRecipients(
  hotelId: string,
  explicitPhones?: string | string[],
  departmentOrServiceKey?: string
): Promise<string[]> {
  return WhatsAppService.resolveHotelRecipients(hotelId, explicitPhones, departmentOrServiceKey);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'requests', 60, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const nowIso = new Date().toISOString();

    const id = String(body.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const hotelId = String(body.hotelId || 'hotel-heritage-1');
    const rawHotelName = String(body.hotelName || '').trim();
    const hotelName =
      !rawHotelName ||
      rawHotelName === 'Purely Istanbul' ||
      rawHotelName === 'Purely Istanbul Partner Hotel' ||
      rawHotelName === 'Old City Heritage Hotel Istanbul'
        ? hotelId === 'hotel-heritage-1'
          ? 'Old City Comus'
          : rawHotelName || 'Old City Comus'
        : rawHotelName;
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
      body.whatsappPhone || body.managerPhone,
      `${department} ${serviceKey} ${serviceTitle}`
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

