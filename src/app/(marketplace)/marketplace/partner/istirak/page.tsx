"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

export default function IstirakOlunPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({
        name,
        email,
        message: `[Hospitality SaaS & Affiliate Partnership] Property/Channel: ${channel}`,
        uid: user?.uid,
      });
      toast.success("Your partnership inquiry has been received. Our team will reach out shortly.");
      setName("");
      setEmail("");
      setChannel("");
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
          For Boutique Hotels &amp; Property Managers
        </p>
        <h1 className="mt-2 font-luxury-serif text-2xl md:text-[34px] font-semibold tracking-tight text-ink">
          Hospitality SaaS &amp; Curated Marketplace Partnership
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          An ancillary revenue-sharing ecosystem built for Boutique Hotels &amp; Professional Property Managers, luxury travel advisors, and cultural publications dedicated to Istanbul.
        </p>

        <section className="mt-10">
          <h2 className="font-luxury-serif text-[18px] font-semibold text-ink mb-3">
            Zero Software Fees, Shared Ancillary Revenue
          </h2>
          <p className="text-[14.5px] leading-relaxed text-ink-muted">
            Provide your guests with a branded in-room QR operating system powered by ComusAI, and earn passive ancillary revenue on every verified experience booked across our 10 curated categories.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-luxury-serif text-[18px] font-semibold text-ink mb-3">Partner Benefits</h2>
          <ul className="space-y-2 text-[14.5px] text-ink-muted [&_li]:pl-5 [&_li]:relative [&_li]:before:content-['—'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-terracotta">
            <li>Custom in-room acrylic stands provided to verified partners with zero upfront friction.</li>
            <li>Automated Wi-Fi onboarding, housekeeping requests, and real-time room attribution.</li>
            <li>Transparent revenue dashboard tracking every excursion, hammam ritual, and airport transfer booked by your guests.</li>
          </ul>
        </section>

        <form onSubmit={handleSubmit} className="mt-10 space-y-3 max-w-md">
          <input
            type="text"
            required
            placeholder="Boutique Hotel / Property Management Brand"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
          <input
            type="email"
            required
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
          <input
            type="text"
            placeholder="Website or Property Link"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Apply for SaaS & Revenue Partnership"}
          </button>
        </form>
      </div>
      <MarketplaceFooter />
    </>
  );
}
