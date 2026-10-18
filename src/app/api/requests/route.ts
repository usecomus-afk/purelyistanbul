import { NextResponse } from 'next/server';
import { NotificationDispatcher } from '@/services/notificationDispatcher';
import { FcmPushService } from '@/services/fcmPushService';

const FIRESTORE_REQUESTS_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests';

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

    // 2. Build APNs & FCM Push Notification Alert
    const isUrgent = priority === 'acil';
    const alertTitle = isUrgent ? '🚨 Acil Misafir Talebi! 🛎️' : 'Yeni Misafir Talebi! 🛎️';
    const unitPrefix = /^(Daire|Birim|Suite|Oda)/i.test(roomNumber) ? roomNumber : `Daire ${roomNumber}`;
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

    const pushResult = await NotificationDispatcher.dispatchSmartNotification({
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
    });

    return NextResponse.json({
      success: true,
      requestId: id,
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
