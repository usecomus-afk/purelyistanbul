"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

export default function PartnerKayitPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePreRegister(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({
        name,
        email,
        message: `[Boutique Hotel & Property Manager Onboarding] ${about}`,
        uid: user?.uid,
      });
      toast.success("Your onboarding request has been received. Our team will contact you to ship your custom acrylic QR stands.");
      setName("");
      setEmail("");
      setAbout("");
    } catch (err: any) {
      toast.error(err?.message || "Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <Link href="/" className="text-[13px] text-ink-muted hover:text-ink transition">
          ← Back to Marketplace
        </Link>

        <p className="mt-8 text-[12px] font-semibold tracking-wide uppercase text-terracotta">
          For Boutique Hotels &amp; Property Managers
        </p>
        <h1 className="mt-2 font-luxury-serif text-2xl md:text-[34px] font-semibold tracking-tight text-ink">
          Register Your Boutique Property or Certified Experience
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          Whether you operate a licensed cultural excursion, traditional hammam, or manage one of Istanbul&apos;s finest boutique hotels and designer suites, join our pre-vetted ecosystem.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-sand-border bg-white p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(11,25,44,0.04)]">
            <div>
              <h2 className="font-luxury-serif text-lg font-semibold text-ink mb-2">
                Certified Experience &amp; Service Operators
              </h2>
              <p className="text-[14px] text-ink-muted leading-relaxed mb-5">
                Licensed TÜRSAB Group A agencies, private Bosphorus yacht captains, historic hammams, culinary guides, and in-stay catering or laundry specialists can apply across our 10 curated categories with a fair 10–12% technology fee.
              </p>
            </div>
            <Link
              href="/marketplace/become-a-host"
              className="inline-flex items-center justify-center w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition"
            >
              Apply as a Certified Operator
            </Link>
          </div>

          <div className="rounded-2xl border border-sand-border bg-white p-6 shadow-[0_4px_20px_rgba(11,25,44,0.04)]">
            <h2 className="font-luxury-serif text-lg font-semibold text-ink mb-2">
              Boutique Hotels &amp; Professional Property Managers
            </h2>
            <p className="text-[13.5px] text-ink-muted leading-relaxed">
              Zero Software Fees, Zero Extra Work. Enhance your guest satisfaction with a branded in-room PWA, automate Wi-Fi &amp; housekeeping requests, and earn passive ancillary revenue on every city experience booked by your guests. Custom in-room acrylic stands provided to verified partners with zero upfront friction.
            </p>

            <form onSubmit={handlePreRegister} className="mt-5 space-y-3">
              <input
                type="text"
                required
                placeholder="Boutique Hotel / Property Management Company"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
              <input
                type="email"
                required
                placeholder="Work Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
              <textarea
                placeholder="Number of suites/rooms & neighborhood in Istanbul"
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full border border-ink text-ink font-semibold py-2.5 text-sm hover:bg-ink hover:text-white transition disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Request Free In-Room QR Stands"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <MarketplaceFooter />
    </>
  );
}
