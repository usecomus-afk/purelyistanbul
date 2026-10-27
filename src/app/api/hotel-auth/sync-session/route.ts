import { NextResponse } from 'next/server';
import { getAdminAuthOrNull, getAdminDbOrNull } from '@/lib/firebase-admin';
import { verifyIdToken, getAdminEmail } from '@/lib/api-auth';

/**
 * Otel portalına giriş yapan kullanıcıların custom claim'lerini (role, hotelId)
 * otomatik senkronize eden güvenli sunucu endpoint'i.
 */
export async function POST(req: Request) {
  const auth = getAdminAuthOrNull();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Auth not configured' }, { status: 503 });
  }

  const decoded = await verifyIdToken(req);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const email = (decoded.email || '').toLowerCase();
  const currentRole = decoded.role as string | undefined;

  // Zaten geçerli bir role sahipse tekrar atamaya gerek yok
  if (currentRole === 'admin' || currentRole === 'pilot' || currentRole === 'hotel_manager') {
    return NextResponse.json({ success: true, role: currentRole, hotelId: decoded.hotelId });
  }

  const adminEmail = getAdminEmail();
  let assignedRole = 'hotel_manager';
  let assignedHotelId = 'hotel-heritage-1';

  // Yönetici hesabı kontrolü
  if (
    email === adminEmail ||
    email === 'eanilaslan@gmail.com' ||
    email === 'anilaslan@usecomus.com' ||
    email === 'hi@usecomus.com'
  ) {
    assignedRole = 'admin';
  } else {
    // Firestore'da otele kayıtlı e-posta mı kontrol et
    const db = getAdminDbOrNull();
    if (db) {
      try {
        const hotelSnap = await db.collection('hotels').where('email', '==', email).limit(1).get();
        if (!hotelSnap.empty) {
          assignedHotelId = hotelSnap.docs[0].id;
        }
      } catch (err) {
        console.warn('[sync-session] Hotel query warning:', err);
      }
    }
  }

  try {
    const claims = {
      role: assignedRole,
      ...(assignedRole === 'admin' ? {} : { hotelId: assignedHotelId }),
    };
    await auth.setCustomUserClaims(decoded.uid, claims);
    return NextResponse.json({ success: true, role: assignedRole, hotelId: assignedHotelId });
  } catch (err: any) {
    console.error('[sync-session] Failed to set claims:', err);
    return NextResponse.json({ success: false, error: 'Failed to assign role' }, { status: 500 });
  }
}
