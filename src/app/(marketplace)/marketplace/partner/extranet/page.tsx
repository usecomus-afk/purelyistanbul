"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Building2, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

export default function ExtranetGirisiPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    toast.info("Partner portal credentials are issued upon verification. Our London & Istanbul onboarding team will contact you by email.");
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <Link href="/" className="text-[13px] text-ink-muted hover:text-ink transition">
          ← Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-8 items-start">
          {/* Left Column: B2B Hospitality SaaS Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 border border-terracotta/25 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
              <Building2 className="w-3.5 h-3.5" />
              B2B Hospitality SaaS &amp; Curated Marketplace
            </span>

            <h1 className="font-luxury-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink leading-tight">
              For Boutique Hotels &amp; Property Managers
            </h1>

            <div className="rounded-2xl border border-terracotta/30 bg-white p-6 shadow-[0_6px_28px_rgba(11,25,44,0.05)] space-y-3">
              <h2 className="font-luxury-serif text-xl sm:text-2xl font-semibold text-terracotta">
                Digital In-Room Concierge &amp; Guest Experience
              </h2>
              <p className="text-[15px] leading-relaxed text-ink">
                Enhance your guest experience with a branded in-room PWA, streamline Wi-Fi &amp; housekeeping requests, and connect your guests with curated city experiences across Istanbul.
              </p>
              <p className="text-[14px] font-semibold text-ink flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-terracotta shrink-0" />
                Seamless room-level QR integration for partner properties.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-sand-border bg-white p-5">
                <QrCode className="w-5 h-5 text-terracotta mb-2.5" strokeWidth={1.75} />
                <h3 className="font-luxury-serif text-base font-semibold text-ink mb-1">
                  In-Room Smart QR Operating System
                </h3>
                <p className="text-[13px] text-ink-muted leading-relaxed">
                  Instant Wi-Fi onboarding, 1-tap housekeeping, maintenance, in-stay breakfast catering, and express laundry requests — no app download required.
                </p>
              </div>
              <div className="rounded-2xl border border-sand-border bg-white p-5">
                <Sparkles className="w-5 h-5 text-terracotta mb-2.5" strokeWidth={1.75} />
                <h3 className="font-luxury-serif text-base font-semibold text-ink mb-1">
                  Comus &amp; Curated City Concierge
                </h3>
                <p className="text-[13px] text-ink-muted leading-relaxed">
                  Your guests receive 24/7 native-language concierge assistance and discover Bosphorus cruises, hammams, and private airport transfers.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Partner Extranet Sign-In */}
          <div className="lg:col-span-5 rounded-3xl border border-sand-border bg-white p-6 sm:p-8 shadow-[0_8px_36px_rgba(11,25,44,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta mb-1">
              Partner Extranet Portal
            </p>
            <h2 className="font-luxury-serif text-2xl font-semibold text-ink mb-2">
              Boutique Hotel &amp; Partner Sign In
            </h2>
            <p className="text-[13.5px] text-ink-muted leading-relaxed mb-6">
              Manage your property&apos;s room QR codes, live housekeeping requests, and experience listings.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                  Work Email / Partner Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="concierge@yourboutiquehotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-ink text-white font-semibold py-3 text-sm hover:bg-terracotta transition"
              >
                Access Partner Extranet
              </button>
              <div className="flex items-center justify-between text-[12.5px] text-ink-muted pt-2">
                <button
                  type="button"
                  onClick={() => toast.info("A password reset link will be sent to your registered partner email.")}
                  className="hover:text-ink transition"
                >
                  Forgot Password?
                </button>
                <Link href="/marketplace/partner/kayit" className="font-semibold text-terracotta hover:underline">
                  Request Partner Onboarding →
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <MarketplaceFooter />
    </>
  );
}
