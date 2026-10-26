"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useOpsData } from "@/lib/ops-client";

/**
 * Yönetici oturumu açıkken operasyon verisini (rezervasyon, oda talepleri, şikayetler, lead'ler)
 * sunucudan (Firestore) çekip panellere yansıtır ve küçük bir durum rozeti gösterir.
 * Yalnızca `role: admin` claim'ine sahip Firebase oturumunda çalışır.
 */
export function AdminOpsSync() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      if (!u || u.isAnonymous) return setIsAdmin(false);
      try {
        const t = await u.getIdTokenResult();
        setIsAdmin(t.claims.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    });
  }, []);

  const { state, error, lastUpdated, refresh } = useOpsData({ enabled: isAdmin });

  if (!isAdmin) return null;

  const ok = state === "ok";
  return (
    <div
      className="fixed bottom-3 left-3 z-[60] flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] shadow-sm bg-white/95 backdrop-blur"
      style={{ borderColor: ok ? "#C0DD97" : "#F2B8B5", color: ok ? "#3B6D11" : "#B3261E" }}
      role="status"
      aria-live="polite"
      title={ok ? "Operasyon verisi sunucudan (Firestore) alınıyor" : error}
    >
      {ok ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
      <span>
        {ok
          ? `Canlı veri · ${lastUpdated ? lastUpdated.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : ""}`
          : state === "loading"
            ? "Veri yükleniyor…"
            : "Bulut verisi alınamadı"}
      </span>
      <button type="button" onClick={refresh} className="cursor-pointer" aria-label="Verileri yenile">
        <RefreshCw className={`w-3.5 h-3.5 ${state === "loading" ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
