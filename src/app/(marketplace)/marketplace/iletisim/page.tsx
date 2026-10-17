import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { Phone, Mail, Clock, MapPin, HeartHandshake } from "lucide-react";

const CHANNELS = [
  { icon: Phone, label: "Live Guest Care & WhatsApp Concierge", value: "Available 7 days via In-Room PWA & Partner Desk" },
  { icon: Mail, label: "Guest Care & Support Email", value: "support@purelyistanbul.com" },
  { icon: Clock, label: "Concierge Operating Hours", value: "7 days a week, 08:30 – 23:00 (Istanbul GMT+3)" },
  { icon: MapPin, label: "Local Operations", value: "Beyoğlu, Istanbul" },
  { icon: HeartHandshake, label: "Tanrı Misafiri Quality Assurance", value: "Direct accountability and empathetic resolution: care@purelyistanbul.com" },
];

export default function IletisimPage() {
  return (
    <LegalPageShell
      eyebrow="Guest Care & Support"
      title="Contact Our Guest Care Team"
      intro="Our dedicated hospitality specialists in Istanbul are here to ensure every moment of your stay meets our verified standards."
    >
      <ul className="!mt-0 space-y-5">
        {CHANNELS.map(({ icon: Icon, label, value }) => (
          <li key={label} className="!pl-0 flex items-start gap-4 before:content-none">
            <span className="w-9 h-9 rounded-full border border-sand-border bg-white flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-terracotta" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-ink">{label}</span>
              <span className="block text-ink-muted">{value}</span>
            </span>
          </li>
        ))}
      </ul>
    </LegalPageShell>
  );
}
