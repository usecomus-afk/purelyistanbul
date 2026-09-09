/**
 * Client helper for the /admin login gate. The actual email/password check
 * happens server-side in src/app/api/admin-login/route.ts, against the
 * ADMIN_EMAIL / ADMIN_PASSWORD environment variables — those values are
 * never sent to the browser, unlike a NEXT_PUBLIC_ constant would be.
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; email?: string; name?: string; role?: string; customToken?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.' };
  }
}
