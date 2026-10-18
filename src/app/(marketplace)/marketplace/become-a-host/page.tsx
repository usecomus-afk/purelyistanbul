"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

export default function BecomeAHostPage() {
  const { user, profile, hostApplication, requestHostMode } = useAuth();
  const router = useRouter();
  const [businessType, setBusinessType] = useState<"individual" | "company">("company");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user || !profile) {
    return (
      <>
        <div className="max-w-md mx-auto px-5 py-16 text-center space-y-4">
          <h1 className="font-luxury-serif text-2xl font-semibold text-ink">
            Partner Application
          </h1>
          <p className="text-sm text-ink-muted">
            Please sign in to apply as a verified Boutique Hotel, Professional Property Manager, or Certified Experience Operator.
          </p>
          <Link
            href="/marketplace/account"
            className="inline-flex items-center justify-center rounded-full bg-ink text-white px-6 py-2.5 text-sm font-semibold hover:bg-terracotta transition"
          >
            Sign In to Continue
          </Link>
        </div>
        <MarketplaceFooter />
      </>
    );
  }

  if (profile.roles.host) {
    return (
      <>
        <div className="max-w-md mx-auto p-8 space-y-2">
          <p className="text-sm font-semibold text-emerald-700">Your Partner account is active.</p>
        </div>
        <MarketplaceFooter />
      </>
    );
  }

  if (hostApplication?.status === "pending") {
    return (
      <>
        <div className="max-w-md mx-auto p-8 text-sm text-ink-muted">
          Your partner application has been received and is currently under review by our team. You will be notified once approved.
        </div>
        <MarketplaceFooter />
      </>
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
        about,
      });
      toast.success("Partner application submitted. Our team will review your information.");
      router.push("/marketplace/account");
    } catch (err: any) {
      toast.error(err?.message || "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-5 py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta mb-1">
          Partner Onboarding
        </p>
        <h1 className="font-luxury-serif text-2xl sm:text-3xl font-semibold text-ink mb-2">
          Apply as a Partner
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed">
          Submit your business or property details below to apply to the Purely Istanbul partner network.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(["company", "individual"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBusinessType(t)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  businessType === t
                    ? "bg-ink text-white border-ink"
                    : "border-sand-border bg-white text-ink-muted"
                }`}
              >
                {t === "company"
                  ? "Boutique Hotel / Licensed Company"
                  : "Certified Artisan / Licensed Guide"}
              </button>
            ))}
          </div>
          {businessType === "company" && (
            <input
              type="text"
              placeholder="Company Registration / TÜRSAB / Tax Number"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
            />
          )}
          <input
            type="tel"
            placeholder="Phone / WhatsApp Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
          />
          <textarea
            placeholder="Tell us about your Boutique Hotel, Property Management portfolio, or certified Istanbul experience"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            required
            rows={4}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink hover:bg-terracotta text-white font-semibold py-3 text-sm transition disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Partner Application"}
          </button>
        </form>
      </div>
      <MarketplaceFooter />
    </>
  );
}
