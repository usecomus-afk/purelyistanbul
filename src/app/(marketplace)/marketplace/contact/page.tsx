import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";
import { Phone, Mail, Clock, MapPin, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Guest Care | Purely Istanbul",
  description:
    "24/7 WhatsApp Concierge and Guest Care support for Purely Istanbul.",
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
    label: "Local Operations",
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
    </LegalPageShell>
  );
}

