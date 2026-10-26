import { NextResponse } from 'next/server';
import { getAdminAuthOrNull, getAdminDbOrNull } from '@/lib/firebase-admin';
import { verifyTOTP } from '@/lib/totp';

/**
 * Cockpit & usepurelydashboard admin girişini onaylar.
 * Google Authenticator (TOTP) aktifse 2FA kodunu doğrular.
 * Onay sonrasında Firebase admin custom token döner.
 */
export async function POST(req: Request) {
  try {
    const { email, password, totpCode } = await req.json();

    const expectedEmail = (process.env.ADMIN_EMAIL || 'anilaslan@usecomus.com').trim().toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'Camille+1618';

    const providedEmail = (email ?? '').toString().trim().toLowerCase();
    const providedPassword = (password ?? '').toString();

    const isMatch = (providedEmail === expectedEmail || providedEmail === 'anilaslan') && providedPassword === expectedPassword;

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }

    // --- Google Authenticator (TOTP 2FA Kontrolü) ---
    let activeSecret: string | null = process.env.ADMIN_TOTP_SECRET?.trim() || null;
    let is2FAEnabled = Boolean(activeSecret);

    if (!activeSecret) {
      const db = getAdminDbOrNull();
      if (db) {
        try {
          const doc = await db.collection('system_security').doc('admin_2fa').get();
          if (doc.exists) {
            const data = doc.data();
            if (data?.enabled && data?.secret) {
              activeSecret = data.secret;
              is2FAEnabled = true;
            }
          }
        } catch (err) {
          console.warn('[admin-login] 2FA Firestore okuma hatası:', err);
        }
      }
    }

    if (is2FAEnabled && activeSecret) {
      const code = (totpCode ?? '').toString().trim();
      if (!code) {
        return NextResponse.json({
          success: false,
          require2FA: true,
          error: 'Lütfen Google Authenticator uygulamanızdaki 6 haneli doğrulama kodunu giriniz.',
        }, { status: 403 });
      }

      const isValidTOTP = verifyTOTP(code, activeSecret, 1);
      if (!isValidTOTP) {
        return NextResponse.json({
          success: false,
          require2FA: true,
          error: 'Girilen 6 haneli Google Authenticator kodu geçersiz veya süresi dolmuş.',
        }, { status: 401 });
      }
    }

    let customToken: string | undefined;
    const adminAuth = getAdminAuthOrNull();
    if (adminAuth) {
      try {
        let userRecord;
        try {
          userRecord = await adminAuth.getUserByEmail(expectedEmail);
          await adminAuth.updateUser(userRecord.uid, {
            password: expectedPassword,
            emailVerified: true,
          });
        } catch {
          userRecord = await adminAuth.createUser({
            email: expectedEmail,
            password: expectedPassword,
            emailVerified: true,
          });
        }
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
        try {
          customToken = await adminAuth.createCustomToken(userRecord.uid, { role: 'admin' });
        } catch (tokenErr) {
          console.warn('[admin-login] Custom token skipped, email/password auth synced:', tokenErr);
        }
      } catch (err) {
        console.warn('[admin-login] Firebase admin user sync warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      email: expectedEmail,
      name: 'Anıl Aslan',
      role: 'pilot',
      customToken,
    });
  } catch (err) {
    console.error('[admin-login] POST exception:', err);
    return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });
  }
}
