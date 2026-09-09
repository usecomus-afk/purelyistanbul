"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getStoredConsent, saveConsent } from "@/lib/cookie-consent";

/**
 * KVKK/GDPR uyumlu çerez izni banner'ı. Sadece "Kabul Et" değil, kategori
 * bazlı ("Zorunlu", "Analitik", "Pazarlama") bir "Tercihleri Yönet" paneli de
 * sunar. Karar localStorage'da saklanır (bkz. src/lib/cookie-consent.ts).
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);
  }, []);

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

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 md:p-5">
      <div className="max-w-3xl mx-auto rounded-2xl border border-sand-border bg-white shadow-xl p-5">
        {!managing ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <ShieldCheck className="w-6 h-6 text-terracotta shrink-0 hidden sm:block" />
            <p className="text-xs text-ink-muted flex-1 leading-relaxed">
              Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler sitenin
              çalışması için gereklidir; analitik ve pazarlama çerezlerini onaylamak size kalmıştır.
            </p>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setManaging(true)}
                className="flex-1 sm:flex-none rounded-full border border-sand-border px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-card transition"
              >
                Tercihleri Yönet
              </button>
              <button
                onClick={rejectNonEssential}
                className="flex-1 sm:flex-none rounded-full border border-sand-border px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-card transition"
              >
                Reddet
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none rounded-full bg-terracotta text-white px-4 py-2 text-xs font-semibold hover:bg-terracotta/90 transition"
              >
                Kabul Et
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink">Çerez Tercihleri</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-ink">Zorunlu Çerezler</p>
                  <p className="text-[11px] text-ink-muted">
                    Oturum ve güvenlik için gereklidir, devre dışı bırakılamaz.
                  </p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 accent-terracotta" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-ink">Analitik Çerezler</p>
                  <p className="text-[11px] text-ink-muted">Kullanım istatistikleri, site iyileştirme.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 accent-terracotta"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-ink">Pazarlama Çerezleri</p>
                  <p className="text-[11px] text-ink-muted">Kişiselleştirilmiş öneri ve kampanyalar.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-4 h-4 accent-terracotta"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-sand-border">
              <button
                onClick={() => setManaging(false)}
                className="rounded-full border border-sand-border px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-card transition"
              >
                Geri
              </button>
              <button
                onClick={savePreferences}
                className="rounded-full bg-terracotta text-white px-4 py-2 text-xs font-semibold hover:bg-terracotta/90 transition"
              >
                Tercihleri Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
