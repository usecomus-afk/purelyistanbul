import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export const metadata: Metadata = {
  title: "Partner Support & Operational Guide | Purely Istanbul",
  description:
    "Operational standards and onboarding documentation for Boutique Hotels, Property Managers, and certified experience operators on Purely Istanbul.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/partner/support",
  },
};

export default function PartnerSupportPage() {
  return (
    <LegalPageShell
      eyebrow="For Boutique Hotels & Property Managers"
      title="Partner Support & Operational Guide"
      intro="Operational standards and onboarding documentation for Boutique Hotels & Professional Property Managers and certified local experience operators on purelyistanbul.com."
    >
      <section>
        <h2>10 Curated Category Standards</h2>
        <p>
          All experiences and in-stay services across our 10 active categories (Bosphorus &amp; Boat Cruises, Historic
          Routes &amp; Fast-Track Walks, Culinary &amp; Street Food Trails, Traditional Turkish Bath &amp; Hammam
          Rituals, Arts &amp; Whirling Dervishes, Rooftop Photography &amp; Costumes, Private VIP Airport Transfers,
          Curated Artisan &amp; Bazaar Shopping, In-Stay Breakfast &amp; Gourmet Catering, and In-Stay Express Laundry
          &amp; Garment Care) are audited for licensing, hygiene, and transparent local pricing.
        </p>
      </section>

      <section>
        <h2>Guest Care &amp; Quality Standards</h2>
        <p>
          Our platform focuses on authentic local experiences, clear information, and attentive hospitality across
          Istanbul.
        </p>
      </section>

      <section>
        <h2>In-Room Smart QR &amp; Comus Integration</h2>
        <p>
          Boutique Hotels &amp; Professional Property Managers can integrate room-specific QR access so guests enjoy
          instant Wi-Fi connection, 1-tap housekeeping, Comus native-language guidance, and curated city experiences.
        </p>
      </section>
    </LegalPageShell>
  );
}
