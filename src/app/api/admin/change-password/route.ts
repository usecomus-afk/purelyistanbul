import { NextResponse } from 'next/server';
import { getAdminAuthOrNull } from '@/lib/firebase-admin';
import { getAdminEmail, rateLimit, requireAdmin, storeAdminPassword, verifyAdminPassword } from '@/lib/api-auth';

/**
 * Yönetici parolasını yeniler. Yalnızca oturum açmış admin + MEVCUT parola doğrulaması gerekir.
 *
 * Yeni parola scrypt özeti olarak Firestore'da (system_security/admin_password) saklanır ve
 * ADMIN_PASSWORD ortam değişkeninin önüne geçer; Firebase Auth hesabının parolası da güncellenir.
 * Kurtarma: bu belge silinirse ADMIN_PASSWORD (Secret Manager) tekrar geçerli olur.
 */

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'admin-change-password', 5, 15 * 60 * 1000);
  if (limited) return limited;
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { currentPassword, newPassword } = await req.json();
    const current = String(currentPassword ?? '');
    const next = String(newPassword ?? '');

    if (!(await verifyAdminPassword(current))) {
      return fail('Mevcut parola hatalı.', 401);
    }
    if (next.length < 10) return fail('Yeni parola en az 10 karakter olmalıdır.');
    if (next.length > 128) return fail('Yeni parola en fazla 128 karakter olabilir.');
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      return fail('Yeni parola en az bir harf ve bir rakam içermelidir.');
    }
    if (next === current) return fail('Yeni parola mevcut parola ile aynı olamaz.');

    const stored = await storeAdminPassword(next);
    if (!stored) return fail('Parola kaydedilemedi (sunucu veritabanı yapılandırılmamış).', 503);

    // Firebase Auth hesabını da eşitle (yönetici paneli e-posta/parola oturumu için).
    const auth = getAdminAuthOrNull();
    if (auth) {
      try {
        const user = await auth.getUserByEmail(getAdminEmail());
        await auth.updateUser(user.uid, { password: next });
      } catch (err) {
        console.warn('[admin-change-password] Firebase Auth senkronu başarısız (giriş sırasında eşitlenecek):', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin-change-password] error:', err);
    return fail('Parola yenilenemedi.', 500);
  }
}
