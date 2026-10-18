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
        message: `[Partner Onboarding Inquiry] ${about}`,
        uid: user?.uid,
      });
      toast.success("Your inquiry has been received. Our team will contact you shortly.");
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
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <Link href="/" className="text-[13px] text-ink-muted hover:text-ink transition">
          ← Back to Marketplace
        </Link>

        <p className="mt-8 text-[12px] font-semibold tracking-wide uppercase text-terracotta">
          Partner Network
        </p>
        <h1 className="mt-2 font-luxury-serif text-2xl md:text-[34px] font-semibold tracking-tight text-ink">
          Partner &amp; Property Application
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          Connect with Purely Istanbul to integrate in-room digital guest services or submit your local Istanbul experience for review.
        </p>

        <div className="mt-8 rounded-2xl border border-sand-border bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgba(11,25,44,0.04)]">
          <h2 className="font-luxury-serif text-lg font-semibold text-ink mb-2">
            Partnership Inquiry Form
          </h2>
          <p className="text-[13.5px] text-ink-muted leading-relaxed">
            Share your business or property details below and our Istanbul team will get in touch with you directly.
          </p>

          <form onSubmit={handlePreRegister} className="mt-5 space-y-3">
            <input
              type="text"
              required
              placeholder="Business or Property Name"
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
              placeholder="Tell us about your property or local service in Istanbul"
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Partnership Inquiry"}
            </button>
          </form>
        </div>
      </div>
      <MarketplaceFooter />
    </>
  );
}
