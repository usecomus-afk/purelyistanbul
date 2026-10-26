import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import { getAdminEmail, hasAdminPasswordSource, rateLimit, requireAdmin, verifyAdminPassword } from '@/lib/api-auth';
import {
  generateTOTPSecret,
  generateOTPAuthURI,
  verifyTOTP,
} from '@/lib/totp';

/**
 * 2FA kurulum ve doğrulama durumunu yöneten backend API.
 * 
 * Secret kaynağı sırasıyla:
 * 1. Ortam değişkeni: process.env.ADMIN_TOTP_SECRET
 * 2. Firestore: 'system_security/admin_2fa' belgesindeki totpSecret alanı
 */
async function getActiveTOTPSecret(expectedEmail: string): Promise<{ secret: string | null; isEnabled: boolean }> {
  // 1. Env değişkeni varsa doğrudan aktiftir
  const envSecret = process.env.ADMIN_TOTP_SECRET?.trim();
  if (envSecret) {
    return { secret: envSecret, isEnabled: true };
  }

  // 2. Firestore'dan kontrol et
  const db = getAdminDbOrNull();
  if (db) {
    try {
      const snap = await db.collection('system_security').doc('admin_2fa').get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.secret && data?.enabled) {
          return { secret: data.secret, isEnabled: true };
        }
        if (data?.pendingSecret) {
          return { secret: data.pendingSecret, isEnabled: false };
        }
      }
    } catch (err) {
      console.warn('[2fa-status] Firestore okuma hatası:', err);
    }
  }

  return { secret: null, isEnabled: false };
}

/**
 * GET: 2FA durumunu döner. Eğer aktif değilse kurulum için yeni geçici QR kod ve secret üretir.
 */
export async function GET(req: Request) {
  // 2FA kurulum sırrı/QR yalnızca oturum açmış yönetici tarafından alınabilir.
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase() || 'anilaslan@usecomus.com';
    const expectedEmail = (process.env.ADMIN_EMAIL || 'anilaslan@usecomus.com').trim().toLowerCase();

    if (email !== expectedEmail && email !== 'anilaslan') {
      return NextResponse.json({ success: false, error: 'Yetkisiz istek.' }, { status: 403 });
    }

    const { secret, isEnabled } = await getActiveTOTPSecret(expectedEmail);

    if (isEnabled && secret) {
      return NextResponse.json({
        success: true,
        isEnabled: true,
      });
    }

    // 2FA henüz aktif değil veya kurulum aşamasında
    let setupSecret = secret;
    if (!setupSecret) {
      setupSecret = generateTOTPSecret();
      const db = getAdminDbOrNull();
      if (db) {
        await db.collection('system_security').doc('admin_2fa').set({
          pendingSecret: setupSecret,
          enabled: false,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    const otpauth = generateOTPAuthURI({
      issuer: 'Purely Istanbul',
      accountName: expectedEmail,
      secret: setupSecret,
    });

    const qrDataUrl = await QRCode.toDataURL(otpauth, {
      width: 250,
      margin: 2,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      success: true,
      isEnabled: false,
      setupSecret,
      qrDataUrl,
      otpauth,
    });
  } catch (err: any) {
    console.error('[2fa-status] GET error:', err);
    return NextResponse.json({ success: false, error: '2FA durumu sorgulanamadı.' }, { status: 500 });
  }
}

/**
 * POST: İlk kurulumu doğrular ve kalıcı olarak aktifleştirir.
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, 'admin-2fa', 10, 15 * 60 * 1000);
  if (limited) return limited;
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { email, password, token, secret } = await req.json();

    if (!(await hasAdminPasswordSource())) {
      return NextResponse.json({ success: false, error: 'Y\u00f6netici kimlik bilgileri sunucuda yap\u0131land\u0131r\u0131lmam\u0131\u015f.' }, { status: 503 });
    }
    const expectedEmail = getAdminEmail();

    const providedEmail = (email ?? '').toString().trim().toLowerCase();
    const providedPassword = (password ?? '').toString();

    if ((providedEmail !== expectedEmail && providedEmail !== 'anilaslan') || !(await verifyAdminPassword(providedPassword))) {
      return NextResponse.json({ success: false, error: 'Kimlik doğrulama başarısız.' }, { status: 401 });
    }

    const targetSecret = (secret || '').toString().trim();
    if (!targetSecret) {
      return NextResponse.json({ success: false, error: 'Kurulum anahtarı eksik.' }, { status: 400 });
    }

    const isValid = verifyTOTP(token, targetSecret, 1);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Google Authenticator kodu hatalı veya süresi dolmuş.' }, { status: 400 });
    }

    // Başarılı doğrulandı -> Firestore'da 2FA'yı aktifleştir
    const db = getAdminDbOrNull();
    if (db) {
      await db.collection('system_security').doc('admin_2fa').set({
        secret: targetSecret,
        pendingSecret: null,
        enabled: true,
        activatedAt: new Date().toISOString(),
        activatedBy: expectedEmail,
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: 'Google Authenticator 2FA başarıyla etkinleştirildi.',
    });
  } catch (err: any) {
    console.error('[2fa-status] POST error:', err);
    return NextResponse.json({ success: false, error: 'İşlem tamamlanamadı.' }, { status: 500 });
  }
}
