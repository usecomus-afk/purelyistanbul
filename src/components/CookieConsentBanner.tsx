"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getStoredConsent, saveConsent } from "@/lib/cookie-consent";

/**
 * KVKK/GDPR uyumlu çerez izni bildirimi. Sade, küçük bir kart olarak gösterilir;
 * "Tercihleri Yönet" ile kategori bazlı (Zorunlu / Analitik / Pazarlama) seçim sunar.
 * Karar localStorage'da saklanır (bkz. src/lib/cookie-consent.ts).
 *
 * Misafir uygulamasında (alt sekme menüsü varken) menünün üstünde durur; web
 * sitesinde ise köşede, içeriği örtmeyecek kompakt bir kart olarak görünür.
 */
export function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [hasTabBar, setHasTabBar] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);
  }, []);

  // Alt sekme menüsü yalnızca uygulama bağlamında vardır; varsa kartı onun üstüne al.
  useEffect(() => {
    const check = () => setHasTabBar(!!document.querySelector(".mobile-bottom-nav"));
    check();
    const t = setTimeout(check, 600);
    return () => clearTimeout(t);
  }, [pathname]);

  function acceptAll() {
    saveConsent({ analytics: true, marketing: true });
    setVisible(false);
  }

  function rejectNonEssential() {
    saveConsent({ analytics: false, marketing: false });
    setVisible(false);
  }

  function savePreferences() {
    saveConsent({ analytics, marketing });
    setVisible(false);
    setManaging(false);
  }

  if (!visible) return null;

  const bottomPad = hasTabBar
    ? "pb-[calc(5.2rem+env(safe-area-inset-bottom))] sm:pb-[calc(5.2rem+env(safe-area-inset-bottom))]"
    : "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5";

  return (
    <aside
      role="region"
      aria-label="Cookie Preferences"
      className={`fixed inset-x-0 bottom-0 z-[9999999] px-3 pt-3 sm:px-5 pointer-events-none ${bottomPad}`}
    >
      <div className="sm:max-w-[400px] sm:mr-auto rounded-2xl border border-sand-border bg-white/95 backdrop-blur-md shadow-[0_10px_40px_-12px_rgba(11,25,44,0.28)] p-4 pointer-events-auto text-ink animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!managing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="text-[13px] font-semibold text-ink">Cookie Preferences</h4>
              <p className="text-[12px] text-ink-muted leading-relaxed">
                We use cookies to deliver a seamless concierge and marketplace experience. Essential cookies are required for security; analytics and personalization cookies are optional.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="flex-1 rounded-full bg-ink hover:bg-terracotta text-white px-4 py-2 text-[12px] font-semibold transition cursor-pointer"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="flex-1 rounded-full border border-sand-border hover:bg-sand-card text-ink px-4 py-2 text-[12px] font-semibold transition cursor-pointer"
              >
                Essential Only
              </button>
            </div>
            <button
              type="button"
              onClick={() => setManaging(true)}
              className="w-full text-center text-[11.5px] text-ink-muted hover:text-ink underline underline-offset-2 transition cursor-pointer"
            >
              Customize preferences
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-sand-border pb-2">
              <p className="text-[13px] font-semibold text-ink">Cookie Preferences</p>
              <span className="text-[11px] text-ink-muted">Customizable</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 bg-sand-bg/60 p-2.5 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-ink">Essential Cookies</p>
                  <p className="text-[11px] text-ink-muted">Required for session state and security.</p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 accent-[#D47A43] cursor-not-allowed" />
              </div>

              <label className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-sand-bg/50 transition cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-ink">Analytics Cookies</p>
                  <p className="text-[11px] text-ink-muted">Anonymous usage insights to improve our platform.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 accent-[#D47A43] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-sand-bg/50 transition cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-ink">Personalization Cookies</p>
                  <p className="text-[11px] text-ink-muted">Tailored local recommendations for your stay.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-4 h-4 accent-[#D47A43] cursor-pointer"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-sand-border">
              <button
                type="button"
                onClick={() => setManaging(false)}
                className="rounded-full border border-sand-border px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-card transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-full bg-ink hover:bg-terracotta text-white px-5 py-2 text-xs font-semibold transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
