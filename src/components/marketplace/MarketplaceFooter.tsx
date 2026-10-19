"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ShieldCheck, QrCode, Building2, Phone, Mail, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Legal & Governance",
    links: [
      { label: "Privacy Policy", href: "/marketplace/legal/privacy-policy" },
      { label: "Terms of Service", href: "/marketplace/legal/terms-of-service" },
      { label: "Distance Sales Agreement", href: "/marketplace/legal/distance-sales-agreement" },
      { label: "Cancellation & Refund Policy", href: "/marketplace/legal/cancellation-refund" },
      { label: "Accessibility Statement", href: "/marketplace/legal/accessibility" },
      { label: "How We Work", href: "/marketplace/legal/how-we-work" },
    ],
  },
  {
    title: "For Boutique Hotels & Property Managers",
    links: [
      { label: "For Boutique Hotels & Property Managers", href: "/marketplace/partner/extranet" },
      { label: "Partner Support & Onboarding", href: "/marketplace/partner/support" },
      { label: "Register Certified Experience / Service", href: "/marketplace/partner/register" },
      { label: "Boutique Hotel Partnership", href: "/marketplace/partner/partnership" },
    ],
  },
];

export function MarketplaceFooter() {
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({ name, email, message, uid: user?.uid });
      toast.success("Your message has been received. Our Guest Care team will reply shortly.");
      setName("");
      setEmail("");
      setMessage("");
      setShowContact(false);
    } catch (err: any) {
      toast.error(err?.message || "Could not send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="border-t border-sand-border mt-16 bg-sand-bg">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-14 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-10">
        <div>
          <h3 className="text-[13px] font-semibold text-ink mb-4 uppercase tracking-wider">
            Guest Care &amp; Support
          </h3>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="/our-philosophy"
                className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition"
              >
                Our Philosophy
              </Link>
            </li>
            <li>
              <Link
                href="/marketplace/contact"
                className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition"
              >
                Contact Guest Care &amp; Support
              </Link>
            </li>
            <li>
              <a
                href={CORPORATE_CONFIG.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition"
              >
                WhatsApp Concierge ({CORPORATE_CONFIG.contactPhone})
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition text-left"
              >
                Send a Direct Message
              </button>
            </li>
          </ul>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-[13px] font-semibold text-ink mb-4 uppercase tracking-wider">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Mandatory Regulatory Compliance Footer, Corporate Impressum & ETBİS Badge Container */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 pb-8 space-y-4">
        <div className="rounded-2xl border border-sand-border bg-white/80 p-5 sm:p-6 shadow-[0_2px_12px_rgba(11,25,44,0.03)]">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-terracotta shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-[12px] sm:text-[12.5px] text-ink-muted leading-relaxed">
              <p className="font-semibold text-ink mb-1">Marketplace &amp; Fulfillment Notice:</p>
              <p>
                <span translate="no" className="notranslate">Purely Istanbul</span> is a curated marketplace and digital
                concierge platform, not a travel agency, tour operator, or transportation carrier. All excursions,
                historical walking tours, boat cruises, wellness treatments, and private transfers displayed on this
                platform are fulfilled and operated exclusively by independent, legally certified third-party businesses
                (including licensed TÜRSAB Group A travel agencies and authorized D2 transportation fleets under the
                laws of the Republic of Türkiye).
              </p>
            </div>
          </div>
        </div>

        {/* Official Corporate Impressum & ETBİS Verification Slot */}
        <div className="rounded-2xl border border-sand-border bg-white/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(11,25,44,0.03)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 text-[12px] text-ink-muted leading-relaxed flex-1">
            <div className="flex items-center gap-2 text-ink font-semibold text-[12.5px]">
              <Building2 className="w-4 h-4 text-terracotta shrink-0" strokeWidth={1.75} />
              <span>Corporate Impressum &amp; Statutory Disclosure</span>
            </div>
            <p>
              <strong className="text-ink">Commercial Title:</strong> {CORPORATE_CONFIG.legalEntityName} ·{" "}
              {CORPORATE_CONFIG.ukEntityName} ({CORPORATE_CONFIG.companyRegNo})
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0" />
                <strong className="text-ink">Registered Office:</strong> {CORPORATE_CONFIG.registeredAddress}
              </span>
              <span>
                <strong className="text-ink">Tax Office &amp; ID:</strong> {CORPORATE_CONFIG.taxOffice} ·{" "}
                {CORPORATE_CONFIG.taxId} · <strong className="text-ink">MERSİS:</strong> {CORPORATE_CONFIG.mersisNo}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a
                href={`mailto:${CORPORATE_CONFIG.contactEmail}`}
                className="inline-flex items-center gap-1.5 hover:text-terracotta transition"
              >
                <Mail className="w-3.5 h-3.5 text-terracotta shrink-0" />
                <strong className="text-ink">Email:</strong> {CORPORATE_CONFIG.contactEmail}
              </a>
              <a
                href={CORPORATE_CONFIG.contactPhoneHref}
                className="inline-flex items-center gap-1.5 hover:text-terracotta transition"
              >
                <Phone className="w-3.5 h-3.5 text-terracotta shrink-0" />
                <strong className="text-ink">Phone / WhatsApp Concierge:</strong> {CORPORATE_CONFIG.contactPhone}
              </a>
            </p>
          </div>

          {/* Dedicated ETBİS QR Code Badge Container */}
          <div
            id="etbis-badge-container"
            data-testid="etbis-badge-slot"
            className="shrink-0 w-full sm:w-auto rounded-xl border border-sand-border bg-sand-bg/70 px-4 py-3 flex items-center gap-3.5"
          >
            <div
              className="w-12 h-12 rounded-lg border border-sand-border bg-white flex flex-col items-center justify-center text-ink shrink-0 shadow-2xs"
              aria-label="ETBİS QR Verification Slot"
            >
              <QrCode className="w-6 h-6 text-ink" strokeWidth={1.6} />
              <span className="text-[8px] font-bold tracking-widest uppercase text-terracotta mt-0.5">ETBİS</span>
            </div>
            <div className="text-[11px] leading-snug text-ink-muted">
              <p className="font-semibold text-ink">ETBİS Registered E-Commerce</p>
              <p>Republic of Türkiye Ministry of Trade</p>
              <a
                href={CORPORATE_CONFIG.etbisVerifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10.5px] font-medium text-terracotta hover:underline inline-block mt-0.5"
              >
                Electronic Commerce Information System →
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-sand-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <span className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 bg-transparent">
              <Image src="/logo-header.png" alt="Purely Istanbul" fill unoptimized className="object-contain" />
            </span>
            <Image
              src="/purely-wordmark.png"
              alt="purelyistanbul"
              width={132}
              height={48}
              unoptimized
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>

          <div className="flex flex-col items-center md:items-start gap-1.5">
            <p className="text-[12px] text-ink-muted/80 tracking-wide text-center md:text-left">
              © {new Date().getFullYear()} <span translate="no" className="notranslate">Purely Istanbul</span> — Nothing but Istanbul.
            </p>
            <span className="relative h-4 sm:h-5 w-16 sm:w-20 opacity-70 bg-transparent">
              <Image src="/comus-logo.png" alt="Powered by Comus" fill unoptimized className="object-contain" />
            </span>
          </div>
        </div>
      </div>

      {showContact && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowContact(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sand-border relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContact(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand-bg hover:bg-sand-border/60 flex items-center justify-center text-ink-muted transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-luxury-serif text-xl font-semibold tracking-tight text-ink mb-1">
              Contact <span translate="no" className="notranslate">Purely Istanbul</span>
            </h2>
            <p className="text-sm text-ink-muted mb-5">
              Write to our Guest Care or Boutique Hotel Partnership team in Istanbul.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we assist you?"
                rows={4}
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
