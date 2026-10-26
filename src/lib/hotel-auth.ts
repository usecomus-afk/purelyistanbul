/**
 * Otel portalı için GERÇEK kimlik doğrulama (Firebase Authentication).
 *
 * Otel hesapları yönetici tarafından açılır (/api/admin/hotel-users) ve
 * `role: 'hotel_manager'` + `hotelId` custom claim'leri taşır. `admin` ve `pilot`
 * rolleri de portala girebilir.
 */
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

export const HOTEL_PORTAL_ROLES = ['admin', 'pilot', 'hotel_manager'] as const;

export interface HotelSession {
  uid: string;
  email: string;
  role: string;
  hotelId?: string;
}

/** Eski sürümlerin `localStorage`'a yazdığı düz metin parolaları temizler. */
export function purgeLegacySavedPasswords() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('xenios_hotel_saved_pass');
    localStorage.removeItem('xenios_saved_pass');
  } catch {
    /* yoksay */
  }
}

async function readSession(user: import('firebase/auth').User | null): Promise<HotelSession | null> {
  if (!user || user.isAnonymous) return null;
  try {
    const tok = await user.getIdTokenResult();
    const role = String(tok.claims.role || '');
    if (!(HOTEL_PORTAL_ROLES as readonly string[]).includes(role)) return null;
    return {
      uid: user.uid,
      email: user.email || '',
      role,
      hotelId: typeof tok.claims.hotelId === 'string' ? tok.claims.hotelId : undefined,
    };
  } catch {
    return null;
  }
}

/** Oturum değiştikçe (giriş / çıkış / yenileme) çağrılır. Dönüş: aboneliği iptal eden fonksiyon. */
export function onHotelSession(cb: (s: HotelSession | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (u) => cb(await readSession(u)));
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Hatalı e-posta veya şifre. Lütfen kontrol ediniz.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.';
    case 'auth/network-request-failed':
      return 'Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.';
    default:
      return 'Giriş başarısız. Lütfen tekrar deneyin.';
  }
}

export async function hotelLogin(
  email: string,
  password: string,
  remember = true
): Promise<{ ok: true; session: HotelSession } | { ok: false; error: string }> {
  if (!auth) return { ok: false, error: 'Kimlik doğrulama servisi yapılandırılmamış.' };
  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const session = await readSession(cred.user);
    if (!session) {
      await signOut(auth);
      return { ok: false, error: 'Bu hesap otel yönetim paneline erişim yetkisine sahip değil.' };
    }
    return { ok: true, session };
  } catch (err: any) {
    return { ok: false, error: friendlyError(String(err?.code || '')) };
  }
}

export async function hotelLogout(): Promise<void> {
  try {
    if (auth) await signOut(auth);
  } catch {
    /* yoksay */
  }
}

/** Gerçek Firebase şifre sıfırlama e-postası gönderir. Hesap yoksa bile aynı yanıt (kullanıcı sızdırmaz). */
export async function sendHotelPasswordReset(email: string): Promise<boolean> {
  if (!auth) return false;
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  } catch (err: any) {
    if (err?.code === 'auth/too-many-requests' || err?.code === 'auth/network-request-failed') return false;
    /* user-not-found vb.: sessizce başarılı say */
  }
  return true;
}
