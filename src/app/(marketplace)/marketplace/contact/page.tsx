import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";
import { Phone, Mail, Clock, MapPin, HeartHandshake, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Guest Care & Corporate Impressum | Purely Istanbul",
  description:
    "24/7 WhatsApp Concierge, Guest Care support, and official corporate registration (Impressum) for Purely Istanbul.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/contact",
  },
};

const CHANNELS = [
  {
    icon: Phone,
    label: "WhatsApp Concierge / Live Guest Care",
    value: CORPORATE_CONFIG.contactPhone,
    href: CORPORATE_CONFIG.whatsappHref,
  },
  {
    icon: Mail,
    label: "Guest Care & Support Email",
    value: CORPORATE_CONFIG.contactEmail,
    href: `mailto:${CORPORATE_CONFIG.contactEmail}`,
  },
  {
    icon: Clock,
    label: "Concierge Operating Hours",
    value: CORPORATE_CONFIG.operatingHours,
  },
  {
    icon: MapPin,
    label: "Local Operations & Registered Office",
    value: CORPORATE_CONFIG.registeredAddress,
  },
  {
    icon: HeartHandshake,
    label: "Tanrı Misafiri Quality Assurance",
    value: `Direct accountability and empathetic resolution: ${CORPORATE_CONFIG.contactEmail}`,
  },
];

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="Guest Care & Support"
      title="Contact Our Guest Care Team"
      intro="Our dedicated hospitality specialists in Istanbul are available 24/7 in English to ensure every moment of your stay meets our verified local standards."
    >
      <ul className="!mt-0 space-y-5">
        {CHANNELS.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="!pl-0 flex items-start gap-4 before:content-none">
            <span className="w-9 h-9 rounded-full border border-sand-border bg-white flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-terracotta" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-ink">{label}</span>
              {href ? (
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block text-ink-muted hover:text-terracotta underline-offset-2 hover:underline transition"
                >
                  {value}
                </a>
              ) : (
                <span className="block text-ink-muted">{value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Official Corporate Impressum & Legal Disclosure */}
      <div className="mt-10 rounded-2xl border border-sand-border bg-white p-6 shadow-[0_2px_16px_rgba(11,25,44,0.04)]">
        <div className="flex items-center gap-2.5 mb-3">
          <Building2 className="w-4 h-4 text-terracotta shrink-0" strokeWidth={1.75} />
          <h2 className="!mb-0 text-[16px] font-luxury-serif font-semibold text-ink">
            Corporate Impressum &amp; Legal Disclosure
          </h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px] mt-4">
          <div>
            <dt className="font-semibold text-ink">Registered Legal Entity (Commercial Title)</dt>
            <dd className="text-ink-muted mt-0.5">
              {CORPORATE_CONFIG.legalEntityName} ({CORPORATE_CONFIG.ukEntityName})
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Registered Office Address</dt>
            <dd className="text-ink-muted mt-0.5">{CORPORATE_CONFIG.registeredAddress}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Tax Office &amp; Tax ID / MERSİS No</dt>
            <dd className="text-ink-muted mt-0.5">
              {CORPORATE_CONFIG.taxOffice} · Tax ID: {CORPORATE_CONFIG.taxId} · MERSİS: {CORPORATE_CONFIG.mersisNo}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">UK Registration &amp; Regulatory Status</dt>
            <dd className="text-ink-muted mt-0.5">
              {CORPORATE_CONFIG.companyRegNo} · {CORPORATE_CONFIG.etbisStatusLabel}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Official Contact Email</dt>
            <dd className="text-ink-muted mt-0.5">{CORPORATE_CONFIG.contactEmail}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Official Concierge &amp; Support Line</dt>
            <dd className="text-ink-muted mt-0.5">{CORPORATE_CONFIG.contactPhone}</dd>
          </div>
        </dl>
      </div>
    </LegalPageShell>
  );
}
