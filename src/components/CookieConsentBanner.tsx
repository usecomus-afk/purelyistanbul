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
    <aside 
      role="region" 
      aria-label="Çerez İzinleri" 
      className="fixed inset-x-0 bottom-0 z-[9999999] p-3 sm:p-5 pointer-events-none pb-[calc(5.2rem+env(safe-area-inset-bottom))] sm:pb-5"
    >
      <div className="max-w-2xl mx-auto rounded-3xl border-2 border-amber-300/80 bg-white/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.18)] p-4 sm:p-5 pointer-events-auto text-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!managing ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 font-serif">Çerez Tercihleri ve Gizlilik</h4>
                <p className="text-[11.5px] sm:text-xs text-zinc-600 leading-relaxed">
                  Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler sitenin
                  çalışması için gereklidir; analitik ve pazarlama çerezlerini onaylamak size kalmıştır.
                </p>
              </div>
            </div>

            {/* Butonlar: Mobil ve Masaüstünde %100 Görünür ve Erişilebilir */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-amber-100/80">
              <button
                type="button"
                onClick={() => setManaging(true)}
                className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 underline text-center sm:text-left py-1 cursor-pointer transition"
              >
                Tercihleri Özelleştir
              </button>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={rejectNonEssential}
                  className="flex-1 sm:flex-none text-center rounded-full border border-zinc-300 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800 px-4 py-2 text-xs font-bold transition cursor-pointer"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 sm:flex-none text-center rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Kabul Et
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sand-border pb-2">
              <p className="text-sm font-bold text-ink font-serif">Çerez Tercihleri</p>
              <span className="text-[11px] text-ink-muted">Özelleştirilebilir</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 bg-sand-bg/50 p-2.5 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-ink">Zorunlu Çerezler</p>
                  <p className="text-[11px] text-ink-muted">
                    Oturum ve güvenlik için gereklidir, devre dışı bırakılamaz.
                  </p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 accent-red-600 cursor-not-allowed" />
              </div>

              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-sand-bg/40 transition">
                <div>
                  <p className="text-xs font-semibold text-ink">Analitik Çerezler</p>
                  <p className="text-[11px] text-ink-muted">Kullanım istatistikleri, site iyileştirme.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-sand-bg/40 transition">
                <div>
                  <p className="text-xs font-semibold text-ink">Pazarlama Çerezleri</p>
                  <p className="text-[11px] text-ink-muted">Kişiselleştirilmiş öneri ve kampanyalar.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-sand-border">
              <button
                type="button"
                onClick={() => setManaging(false)}
                className="rounded-full border border-sand-border px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-card transition cursor-pointer"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tercihleri Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
