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
  const res = await fetch(input, { ...init, headers });
  // Eski token (claim henüz yokken alınmış) 401/403 döndürebilir: token'ı zorla yenileyip bir kez tekrar dene.
  if ((res.status === 401 || res.status === 403) && auth?.currentUser) {
    try {
      const fresh = await auth.currentUser.getIdToken(true);
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${fresh}`);
      return fetch(input, { ...init, headers: retryHeaders });
    } catch {
      return res;
    }
  }
  return res;
}
