"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ShieldCheck, X } from "lucide-react";
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
    <footer className="border-t border-white/70 mt-16 bg-white/35 backdrop-blur-xl shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8),0_-8px_30px_rgba(11,25,44,0.04)]">
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

      {/* Mandatory Regulatory Compliance Footer */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 pb-8">
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

export { MarketplaceFooter as Footer };

