"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HostGuard } from "@/components/marketplace/HostGuard";
import { createDraftListing } from "@/lib/marketplace/listings";
import type { ListingType } from "@/lib/marketplace/types";
import { toast } from "sonner";

function NewListingInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState<ListingType | null>(null);

  async function handleChoose(type: ListingType) {
    if (!user) return;
    setCreating(type);
    try {
      const id = await createDraftListing(user.uid, type);
      router.push(`/marketplace/host/listings/${id}/edit`);
    } catch (err: any) {
      toast.error(err?.message || "İlan oluşturulamadı.");
      setCreating(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      <h1 className="text-2xl font-light tracking-tight text-ink mb-1">Ne yayınlamak istiyorsunuz?</h1>
      <p className="text-sm text-ink-muted mb-8">Devam etmek için bir ilan türü seçin.</p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleChoose("stay")}
          disabled={creating !== null}
          className="rounded-2xl border border-sand-border bg-white p-6 text-left hover:border-terracotta/50 hover:shadow-sm transition disabled:opacity-60"
        >
          <Building2 className="w-6 h-6 text-terracotta mb-3" />
          <p className="text-sm font-semibold text-ink">Konaklama</p>
          <p className="text-xs text-ink-muted mt-1">Ev, oda veya konaklanabilir bir mekan.</p>
        </button>
        <button
          onClick={() => handleChoose("experience")}
          disabled={creating !== null}
          className="rounded-2xl border border-sand-border bg-white p-6 text-left hover:border-terracotta/50 hover:shadow-sm transition disabled:opacity-60"
        >
          <Compass className="w-6 h-6 text-terracotta mb-3" />
          <p className="text-sm font-semibold text-ink">Deneyim</p>
          <p className="text-xs text-ink-muted mt-1">Tur, aktivite veya kişi başı deneyim.</p>
        </button>
      </div>
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
