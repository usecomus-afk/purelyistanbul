"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { MARKETPLACE_COLLECTIONS } from "@/lib/marketplace/collections";
import type { HostApplication } from "@/lib/marketplace/types";
import { approveHostApplication, rejectHostApplication } from "@/lib/marketplace/firestore";
import { toast } from "sonner";

/**
 * Süperadmin: Host başvurularını onaylar/reddeder. Onay anında admin,
 * host/platform komisyon oranını belirler — bu oran kullanıcıya ancak
 * bu adımda bildirilir (ilk etap kuralı, bkz. görev talimatları).
 */
export default function HostApplicationsPage() {
  const [applications, setApplications] = useState<HostApplication[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, MARKETPLACE_COLLECTIONS.HOST_APPLICATIONS), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HostApplication, "id">) })));
    });
    return () => unsub();
  }, []);

  async function handleApprove(app: HostApplication) {
    const hostPercent = parseFloat(rates[app.id] ?? "90");
    if (isNaN(hostPercent) || hostPercent <= 0 || hostPercent > 100) {
      toast.error("Geçerli bir host payı yüzdesi girin (0-100).");
      return;
    }
    const adminUid = auth?.currentUser?.uid;
    if (!adminUid) {
      toast.error("Admin oturumu bulunamadı (Firebase Auth ile giriş yapmalısınız).");
      return;
    }
    setBusyId(app.id);
    try {
      await approveHostApplication({
        applicationId: app.id,
        adminUid,
        hostRate: hostPercent / 100,
        platformRate: (100 - hostPercent) / 100
      });
      toast.success(`${app.applicantName} onaylandı — host payı %${hostPercent}.`);
    } catch (err: any) {
      toast.error(err?.message || "Onay başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(app: HostApplication) {
    const adminUid = auth?.currentUser?.uid;
    if (!adminUid) {
      toast.error("Admin oturumu bulunamadı.");
      return;
    }
    setBusyId(app.id);
    try {
      await rejectHostApplication({ applicationId: app.id, adminUid });
      toast.success(`${app.applicantName} reddedildi.`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">Host Başvuruları</h1>
      <p className="text-xs text-ink-muted">
        Komisyon oranı henüz sabitlenmedi — her başvuruyu onaylarken host payını (%) siz belirlersiniz;
        kalan yüzde platforma kalır. Onay sonrası kullanıcı Firestore üzerinden anında bilgilendirilir.
      </p>

      <div className="space-y-3">
        {applications.length === 0 && (
          <p className="text-xs text-ink-muted">Henüz başvuru yok.</p>
        )}
        {applications.map((app) => (
          <div key={app.id} className="rounded-2xl border border-amber-200/80 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{app.applicantName}</p>
                <p className="text-xs text-ink-muted">{app.applicantEmail} · {app.businessType === "company" ? "Şirket" : "Bireysel"}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                app.status === "pending" ? "bg-amber-100 text-amber-800" :
                app.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
              }`}>
                {app.status === "pending" ? "Bekliyor" : app.status === "approved" ? "Onaylandı" : "Reddedildi"}
              </span>
            </div>
            <p className="text-xs text-zinc-700">{app.about}</p>

            {app.status === "pending" && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Host payı %"
                  value={rates[app.id] ?? ""}
                  onChange={(e) => setRates((r) => ({ ...r, [app.id]: e.target.value }))}
                  className="w-28 rounded-lg border border-sand-border px-2 py-1.5 text-xs"
                />
                <button
                  disabled={busyId === app.id}
                  onClick={() => handleApprove(app)}
                  className="rounded-lg bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 disabled:opacity-60"
                >
                  Onayla
                </button>
                <button
                  disabled={busyId === app.id}
                  onClick={() => handleReject(app)}
                  className="rounded-lg bg-red-600 text-white text-xs font-bold px-3 py-1.5 disabled:opacity-60"
                >
                  Reddet
                </button>
              </div>
            )}

            {app.status === "approved" && app.commissionRate && (
              <p className="text-[11px] text-emerald-700 font-semibold">
                Host payı %{Math.round(app.commissionRate.hostRate * 100)} / Platform payı %{Math.round(app.commissionRate.platformRate * 100)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
