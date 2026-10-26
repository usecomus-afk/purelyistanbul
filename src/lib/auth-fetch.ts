import { auth } from './firebase';

/**
 * İstemci tarafı fetch sarmalayıcısı: oturum açmış Firebase kullanıcısının
 * ID token'ını `Authorization: Bearer` olarak ekler (admin API'leri için).
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    if (auth) {
      await auth.authStateReady().catch(() => {});
      const token = await auth.currentUser?.getIdToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    /* token alınamazsa isteği başlıksız gönder; sunucu 401 döner */
  }
  return fetch(input, { ...init, headers });
}
