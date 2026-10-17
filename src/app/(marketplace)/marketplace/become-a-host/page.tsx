"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * "İlan Sahibi (Host) Moduna Geç" başvuru formu.
 * Başvuru admin onayına düşer; komisyon oranı ancak onay anında belirlenip
 * kullanıcıya bildirilir (bkz. src/lib/marketplace/firestore.ts#approveHostApplication).
 */
export default function BecomeAHostPage() {
  const { user, profile, hostApplication, requestHostMode } = useAuth();
  const router = useRouter();
  const [businessType, setBusinessType] = useState<"individual" | "company">("individual");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto p-8 text-sm text-ink-muted">
        Başvuru yapmak için önce giriş yapmalısınız.
      </div>
    );
  }

  if (profile.roles.host) {
    return (
      <div className="max-w-md mx-auto p-8 space-y-2">
        <p className="text-sm font-semibold text-emerald-700">Host hesabınız zaten onaylı.</p>
        <p className="text-xs text-ink-muted">
          Komisyon anlaşmanız: %{Math.round(profile.hostProfile!.commissionRate.hostRate * 100)} host payı /{" "}
          %{Math.round(profile.hostProfile!.commissionRate.platformRate * 100)} platform payı.
        </p>
      </div>
    );
  }

  if (hostApplication?.status === "pending") {
    return (
      <div className="max-w-md mx-auto p-8 text-sm text-ink-muted">
        Başvurunuz alındı, admin onayı bekleniyor. Onaylandığında komisyon oranınız ve
        detaylar size bildirilecektir.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestHostMode({
        applicantName: profile!.displayName,
        applicantPhone: phone || undefined,
        businessType,
        taxId: taxId || undefined,
        about
      });
      toast.success("Başvurunuz alındı. Admin onayı sonrası bilgilendirileceksiniz.");
      router.push("/marketplace/account");
    } catch (err: any) {
      toast.error(err?.message || "Başvuru gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-xl font-semibold text-terracotta mb-1">İlan Sahibi (Host) Moduna Geç</h1>
      <p className="text-xs text-ink-muted mb-6">
        Başvurunuz incelendikten sonra komisyon oranınız admin tarafından belirlenip size iletilecektir.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(["individual", "company"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBusinessType(t)}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                businessType === t ? "bg-terracotta text-white border-terracotta" : "border-sand-border bg-white text-ink-muted"
              }`}
            >
              {t === "individual" ? "Bireysel" : "Şirket"}
            </button>
          ))}
        </div>
        {businessType === "company" && (
          <input
            type="text"
            placeholder="Vergi No"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
          />
        )}
        <input
          type="tel"
          placeholder="Telefon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
        />
        <textarea
          placeholder="Kendinizden ve vermeyi planladığınız ilan(lar)dan kısaca bahsedin"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          required
          rows={4}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-terracotta text-white font-semibold py-2.5 text-sm disabled:opacity-60"
        >
          Başvuruyu Gönder
        </button>
      </form>
    </div>
  );
}
