"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HostGuard } from "@/components/marketplace/HostGuard";
import { createDraftListing } from "@/lib/marketplace/listings";
import { toast } from "sonner";

// Bu ilk etapta platform sadece deneyim/hizmet ilanlarına odaklanıyor —
// konaklama (stay) kapsam dışı, bu yüzden tür seçimi tek seçenekle sunulur.
function NewListingInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createDraftListing(user.uid, "experience");
      router.push(`/marketplace/host/listings/${id}/edit`);
    } catch (err: any) {
      toast.error(err?.message || "İlan oluşturulamadı.");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="text-2xl font-light tracking-tight text-ink mb-1">Yeni deneyim ilanı</h1>
      <p className="text-sm text-ink-muted mb-8">Bir tur, aktivite veya kişi başı deneyim yayınlayın.</p>

      <button
        onClick={handleCreate}
        disabled={creating}
        className="w-full rounded-2xl border border-sand-border bg-white p-6 text-left hover:border-terracotta/50 hover:shadow-sm transition disabled:opacity-60"
      >
        <Compass className="w-6 h-6 text-terracotta mb-3" />
        <p className="text-sm font-semibold text-ink">{creating ? "Oluşturuluyor..." : "Deneyim İlanı Oluştur"}</p>
        <p className="text-xs text-ink-muted mt-1">Tur, aktivite veya kişi başı deneyim.</p>
      </button>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <HostGuard>
      <NewListingInner />
    </HostGuard>
  );
}
