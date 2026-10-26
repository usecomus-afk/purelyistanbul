/**
 * SUNUCU TARAFI API güvenlik yardımcıları (yalnızca route handler'larda kullanın).
 *
 *  - requireAdmin / requireAdminOrCron : Firebase ID token (role === 'admin') veya CRON_SECRET
 *  - verifyHmacSha256 / verifyStripeSignature : webhook imza doğrulaması
 *  - rateLimit : bellek içi (örnek başına) hız sınırı
 *  - getAdminCredentials : admin e-posta / parola (kodda varsayılan parola YOK)
 *
 * Bu modül istemci bileşenlerinden import edilmemelidir.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminAuthOrNull, getAdminDbOrNull } from '@/lib/firebase-admin';

const isProd = () => process.env.NODE_ENV === 'production';

/** Sabit zamanlı string karşılaştırması. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Uzunluk farkını sızdırmamak için yine de sabit zamanlı bir karşılaştırma yap.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function bearerToken(req: Request): string | null {
  const h = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

/** İstekteki Firebase ID token'ını doğrular; geçersizse null döner. */
export async function verifyIdToken(req: Request) {
  const token = bearerToken(req);
  if (!token) return null;
  const auth = getAdminAuthOrNull();
  if (!auth) return null;
  try {
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

function unauthorized(message = 'Yetkisiz istek.', status = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Admin yetkisi gerektirir. Yetkiliyse null, değilse döndürülecek NextResponse verir:
 *   const denied = await requireAdmin(req); if (denied) return denied;
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  if (!getAdminAuthOrNull()) {
    return unauthorized('Sunucu kimlik doğrulaması yapılandırılmamış.', 503);
  }
  const decoded = await verifyIdToken(req);
  if (!decoded) return unauthorized();
  if (decoded.role !== 'admin') return unauthorized('Bu işlem için yönetici yetkisi gerekir.', 403);
  return null;
}

/** CRON_SECRET (Authorization: Bearer ...) veya admin token kabul eder. */
export async function requireAdminOrCron(req: Request): Promise<NextResponse | null> {
  const secret = process.env.CRON_SECRET?.trim();
  const token = bearerToken(req) || req.headers.get('x-cron-secret');
  if (secret && token && safeEqual(token, secret)) return null;
  return requireAdmin(req);
}

export interface StaffClaims {
  uid: string;
  email?: string;
  role: 'admin' | 'pilot' | 'hotel_manager';
  hotelId?: string;
}

/**
 * Otel personeli / yönetici yetkisi (role: admin | pilot | hotel_manager).
 * `hotelId` verilirse, otel yöneticisi YALNIZCA kendi otelinin verisine erişebilir.
 * Başarılıysa { claims }, değilse { denied } döner:
 *   const s = await requireStaff(req, hotelId); if (s.denied) return s.denied;
 */
export async function requireStaff(
  req: Request,
  hotelId?: string | null
): Promise<{ denied: NextResponse; claims?: undefined } | { denied?: undefined; claims: StaffClaims }> {
  if (!getAdminAuthOrNull()) {
    return { denied: unauthorized('Sunucu kimlik doğrulaması yapılandırılmamış.', 503) };
  }
  const decoded = await verifyIdToken(req);
  if (!decoded) return { denied: unauthorized() };
  const role = decoded.role as string | undefined;
  if (role !== 'admin' && role !== 'pilot' && role !== 'hotel_manager') {
    return { denied: unauthorized('Bu işlem için otel yönetimi yetkisi gerekir.', 403) };
  }
  const claimHotel = typeof decoded.hotelId === 'string' ? decoded.hotelId : undefined;
  if (role === 'hotel_manager') {
    if (!claimHotel) return { denied: unauthorized('Hesabınız bir otele bağlı değil.', 403) };
    if (hotelId && hotelId !== claimHotel) {
      return { denied: unauthorized('Bu otelin verilerine erişim yetkiniz yok.', 403) };
    }
  }
  return { claims: { uid: decoded.uid, email: decoded.email, role, hotelId: claimHotel } };
}

/** `sha256=<hex>` veya düz hex imzayı ham gövde üzerinde doğrular. */
export function verifyHmacSha256(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const provided = signatureHeader.replace(/^sha256=/i, '').trim();
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return safeEqual(provided, expected);
}

/** Stripe `stripe-signature` başlığı (t=...,v1=...) doğrulaması; 5 dk tolerans. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  ) as Record<string, string>;
  const t = Number(parts.t);
  if (!parts.v1 || !Number.isFinite(t)) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`, 'utf8').digest('hex');
  return safeEqual(parts.v1, expected);
}

/**
 * Webhook doğrulama sonucu: ok=true ise devam; değilse `response` döndürülmelidir.
 * Üretimde secret tanımlı değilse FAIL-CLOSED (503) çalışır.
 */
export function webhookGate(
  secret: string | undefined,
  verified: boolean
): { ok: true } | { ok: false; response: NextResponse } {
  if (!secret) {
    if (isProd()) {
      return { ok: false, response: unauthorized('Webhook gizli anahtarı yapılandırılmamış.', 503) };
    }
    return { ok: true }; // yerel geliştirme
  }
  if (!verified) return { ok: false, response: unauthorized('Geçersiz webhook imzası.', 401) };
  return { ok: true };
}

/** Admin kimlik bilgileri. Üretimde ADMIN_PASSWORD tanımlı değilse null döner (giriş kapalı). */
export function getAdminCredentials(): { email: string; password: string } | null {
  const email = (process.env.ADMIN_EMAIL || 'anilaslan@usecomus.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (password && password.length >= 8) return { email, password };
  if (isProd()) return null;
  return { email, password: 'dev-only-admin-password' };
}

/** Yönetici e-postası (ADMIN_EMAIL, yoksa varsayılan). */
export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || 'anilaslan@usecomus.com').trim().toLowerCase();
}

const ADMIN_PW_COLLECTION = 'system_security';
const ADMIN_PW_DOC = 'admin_password';

async function readAdminPasswordRecord(): Promise<{ hash: string; salt: string } | null | 'error'> {
  const db = getAdminDbOrNull();
  if (!db) return null;
  try {
    const snap = await db.collection(ADMIN_PW_COLLECTION).doc(ADMIN_PW_DOC).get();
    if (!snap.exists) return null;
    const d = snap.data();
    return d?.hash && d?.salt ? { hash: String(d.hash), salt: String(d.salt) } : null;
  } catch (err) {
    console.error('[admin-password] Firestore okuma hatası:', err);
    return 'error';
  }
}

/** Yönetici parolası tanımlı mı? (Firestore'da yenilenmiş parola VEYA ADMIN_PASSWORD) */
export async function hasAdminPasswordSource(): Promise<boolean> {
  const rec = await readAdminPasswordRecord();
  if (rec && rec !== 'error') return true;
  return getAdminCredentials() !== null;
}

/**
 * Yönetici parolasını doğrular. Dashboard'dan yenilenmiş parola (Firestore'da scrypt özeti)
 * varsa YALNIZCA o geçerlidir; yoksa ADMIN_PASSWORD kullanılır. Okuma hatasında kapalı kalır.
 */
export async function verifyAdminPassword(provided: string): Promise<boolean> {
  const rec = await readAdminPasswordRecord();
  if (rec === 'error') return false;
  if (rec) {
    const calc = scryptSync(provided, rec.salt, 64).toString('hex');
    return safeEqual(calc, rec.hash);
  }
  const creds = getAdminCredentials();
  return !!creds && safeEqual(provided, creds.password);
}

/** Yeni yönetici parolasını scrypt özeti olarak Firestore'a yazar (düz metin saklanmaz). */
export async function storeAdminPassword(newPassword: string): Promise<boolean> {
  const db = getAdminDbOrNull();
  if (!db) return false;
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(newPassword, salt, 64).toString('hex');
  await db.collection(ADMIN_PW_COLLECTION).doc(ADMIN_PW_DOC).set({
    hash,
    salt,
    algo: 'scrypt-64',
    updatedAt: new Date().toISOString(),
  });
  return true;
}
// ---------------------------------------------------------------------------
// Bellek içi hız sınırı (Cloud Run örneği başına). Kaba kötüye kullanım koruması;
// dağıtık sınır için ileride Redis / Cloud Armor eklenmelidir.
// ---------------------------------------------------------------------------
const buckets = new Map<string, { count: number; reset: number }>();

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff ? xff.split(',')[0] : req.headers.get('x-real-ip') || 'unknown').trim();
}

/** Sınır aşılırsa 429 NextResponse, aksi halde null döner. */
export function rateLimit(req: Request, key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  const id = `${key}:${clientIp(req)}`;
  const b = buckets.get(id);
  if (!b || b.reset <= now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
  } else {
    b.count += 1;
    if (b.count > limit) {
      const retry = Math.max(1, Math.ceil((b.reset - now) / 1000));
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: { 'Retry-After': String(retry) } }
      );
    }
  }
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  }
  return null;
}
