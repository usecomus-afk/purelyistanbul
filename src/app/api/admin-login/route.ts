import { NextResponse } from 'next/server';
import { getAdminAuthOrNull } from '@/lib/firebase-admin';

/**
 * Cockpit admin girişini onaylar VE (Admin SDK yapılandırılmışsa) `role: 'admin'`
 * custom claim'ine sahip bir Firebase custom token üretir. İstemci bu token ile
 * signInWithCustomToken() çağırarak aynı oturumda hem cockpit'e hem de
 * firestore.rules'ın isAdmin() koluna erişim kazanır — ekstra bir giriş gerekmez.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const expectedEmail = (process.env.ADMIN_EMAIL || 'anilaslan@usecomus.com').trim().toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'Camille+1618';

    const providedEmail = (email ?? '').toString().trim().toLowerCase();
    const providedPassword = (password ?? '').toString();

    const isMatch = (providedEmail === expectedEmail || providedEmail === 'anilaslan') && providedPassword === expectedPassword;

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }

    let customToken: string | undefined;
    const adminAuth = getAdminAuthOrNull();
    if (adminAuth) {
      try {
        let userRecord;
        try {
          userRecord = await adminAuth.getUserByEmail(expectedEmail);
        } catch {
          userRecord = await adminAuth.createUser({ email: expectedEmail, emailVerified: true });
        }
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
        customToken = await adminAuth.createCustomToken(userRecord.uid, { role: 'admin' });
      } catch (err) {
        console.warn('[admin-login] Firebase custom token üretilemedi (cockpit girişi yine de devam eder):', err);
      }
    }

    return NextResponse.json({
      success: true,
      email: expectedEmail,
      name: 'Anıl Aslan',
      role: 'pilot',
      customToken
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });
  }
}
