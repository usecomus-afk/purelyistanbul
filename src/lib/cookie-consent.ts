/**
 * KVKK/GDPR çerez tercihleri — localStorage'da tutulur, sunucuya gönderilmez.
 * Zorunlu çerezler her zaman aktiftir; analitik/pazarlama betikleri ancak
 * kullanıcı onay verdiğinde çalışmalıdır (bkz. hasConsent()).
 */
const STORAGE_KEY = "pi_cookie_consent";
const CONSENT_VERSION = 1;

export interface CookieConsent {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(prefs: { analytics: boolean; marketing: boolean }): CookieConsent {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    decidedAt: new Date().toISOString()
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent("pi_cookie_consent_updated", { detail: consent }));
  } catch {
    // localStorage kapalıysa (gizli sekme vb.) sessizce geç — banner her ziyarette yeniden görünür.
  }
  return consent;
}

/** Analitik/pazarlama betiği çalıştırmadan önce çağrılmalıdır. Zorunlu çerezler her zaman true döner. */
export function hasConsent(category: "necessary" | "analytics" | "marketing"): boolean {
  if (category === "necessary") return true;
  return getStoredConsent()?.[category] === true;
}
