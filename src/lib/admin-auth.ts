import {
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Client helper for the /admin login gate. The actual email/password check
 * happens server-side in src/app/api/admin-login/route.ts, against the
 * ADMIN_EMAIL / ADMIN_PASSWORD environment variables - those values are
 * never sent to the browser, unlike a NEXT_PUBLIC_ constant would be.
 */
export async function adminLogin(
  email: string,
  password: string,
  totpCode?: string
): Promise<{
  success: boolean;
  email?: string;
  name?: string;
  role?: string;
  customToken?: string;
  require2FA?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totpCode }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.' };
  }
}

/**
 * Yönetici girişinden sonra Firebase oturumunu açar. Bu oturum olmadan Firestore
 * kuralları (isAdmin()) yazmaları REDDEDER; yani panelden yapılan değişiklikler
 * yalnızca o tarayıcıda kalır ve web sitesi / uygulamada hiç görünmez.
 *
 * Sıra: 1) sunucunun ürettiği özel token (Admin SDK varsa),
 *       2) yönetici e-postası + şifresiyle Firebase Auth girişi,
 *       3) hesap hiç yoksa ilk girişte oluşturma (şifre sunucuda zaten doğrulandı).
 * Başarılıysa true döner.
 */
export async function establishAdminFirebaseSession(opts: {
  email: string;
  password: string;
  customToken?: string;
}): Promise<boolean> {
  if (!auth) return false;

  if (opts.customToken) {
    try {
      await signInWithCustomToken(auth, opts.customToken);
      return true;
    } catch (err) {
      console.warn('Özel token ile Firebase girişi başarısız, e-posta ile deneniyor:', err);
    }
  }

  const email = opts.email.trim().toLowerCase();
  try {
    await signInWithEmailAndPassword(auth, email, opts.password);
    return true;
  } catch (err: any) {
    const code: string = err?.code || '';
    const missing =
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials';
    if (!missing) {
      console.warn('Firebase yönetici girişi başarısız:', err);
      return false;
    }
  }

  try {
    await createUserWithEmailAndPassword(auth, email, opts.password);
    return true;
  } catch (err) {
    // Hesap var ama şifre farklı (auth/email-already-in-use): otomatik çözülemez.
    console.warn('Firebase yönetici hesabı oluşturulamadı / şifre uyuşmuyor:', err);
    return false;
  }
}

/**
 * Sayfa yenilendiğinde yerel "yönetici" bayrağı kalmış olabilir ama Firebase oturumu
 * sona ermiş olabilir. Bu durumda kaydedilen değişiklikler buluta gitmez; çağıran
 * taraf kullanıcıyı yeniden giriş yapmaya yönlendirmelidir.
 */
export async function hasAdminFirebaseSession(): Promise<boolean> {
  if (!auth) return true; // Firebase hiç yapılandırılmadıysa (yerel geliştirme) engelleme
  try {
    await auth.authStateReady();
  } catch {
    /* yoksay */
  }
  const user: User | null = auth.currentUser;
  return !!user && !user.isAnonymous;
}
