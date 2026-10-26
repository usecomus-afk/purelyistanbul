import { NextResponse } from 'next/server';
import { getAdminAuthOrNull } from '@/lib/firebase-admin';
import { rateLimit, requireAdmin } from '@/lib/api-auth';

/**
 * Otel yöneticisi hesapları (Firebase Auth + custom claims). YALNIZCA admin.
 *
 *   GET    → mevcut otel hesaplarını listeler
 *   POST   → { email, password, hotelId, displayName? } hesap açar / parola ve otel günceller
 *   DELETE → { email } hesabı siler (yalnızca hotel_manager hesapları)
 *
 * Claims: { role: 'hotel_manager', hotelId }. Admin / pilot hesaplarına DOKUNMAZ.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function bad(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const auth = getAdminAuthOrNull();
  if (!auth) return bad('Sunucu kimlik doğrulaması yapılandırılmamış.', 503);

  try {
    const accounts: Array<{ uid: string; email?: string; displayName?: string; hotelId?: string; disabled: boolean; lastSignIn?: string }> = [];
    let pageToken: string | undefined;
    do {
      const res = await auth.listUsers(1000, pageToken);
      for (const u of res.users) {
        const claims = (u.customClaims || {}) as Record<string, unknown>;
        if (claims.role === 'hotel_manager') {
          accounts.push({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            hotelId: typeof claims.hotelId === 'string' ? claims.hotelId : undefined,
            disabled: u.disabled,
            lastSignIn: u.metadata.lastSignInTime,
          });
        }
      }
      pageToken = res.pageToken;
    } while (pageToken);
    return NextResponse.json({ success: true, accounts });
  } catch (err) {
    console.error('[hotel-users] GET error:', err);
    return bad('Hesaplar listelenemedi.', 500);
  }
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'hotel-users', 30, 60 * 1000);
  if (limited) return limited;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const auth = getAdminAuthOrNull();
  if (!auth) return bad('Sunucu kimlik doğrulaması yapılandırılmamış.', 503);

  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const hotelId = String(body.hotelId ?? '').trim();
    const displayName = body.displayName ? String(body.displayName).trim().slice(0, 120) : undefined;

    if (!EMAIL_RE.test(email)) return bad('Geçerli bir e-posta girin.');
    if (!hotelId || hotelId.length > 120) return bad('hotelId zorunludur.');
    if (password.length < 8) return bad('Parola en az 8 karakter olmalıdır.');

    let uid: string;
    let created = false;
    try {
      const existing = await auth.getUserByEmail(email);
      const role = (existing.customClaims || {}).role;
      if (role && role !== 'hotel_manager') {
        return bad('Bu e-posta yönetici / pilot hesabına ait; otel hesabı olarak değiştirilemez.', 409);
      }
      await auth.updateUser(existing.uid, { password, displayName, disabled: false, emailVerified: true });
      uid = existing.uid;
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') throw err;
      const u = await auth.createUser({ email, password, displayName, emailVerified: true });
      uid = u.uid;
      created = true;
    }
    await auth.setCustomUserClaims(uid, { role: 'hotel_manager', hotelId });
    // Eski oturumlar geçersiz olsun (parola / otel değiştiyse).
    if (!created) await auth.revokeRefreshTokens(uid);

    return NextResponse.json({ success: true, uid, created });
  } catch (err) {
    console.error('[hotel-users] POST error:', err);
    return bad('Hesap oluşturulamadı / güncellenemedi.', 500);
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const auth = getAdminAuthOrNull();
  if (!auth) return bad('Sunucu kimlik doğrulaması yapılandırılmamış.', 503);

  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return bad('Geçerli bir e-posta girin.');
    const user = await auth.getUserByEmail(email).catch(() => null);
    if (!user) return bad('Hesap bulunamadı.', 404);
    if ((user.customClaims || {}).role !== 'hotel_manager') {
      return bad('Yalnızca otel hesapları silinebilir.', 409);
    }
    await auth.deleteUser(user.uid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[hotel-users] DELETE error:', err);
    return bad('Hesap silinemedi.', 500);
  }
}
