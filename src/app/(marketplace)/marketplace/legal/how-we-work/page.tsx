import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export const metadata: Metadata = {
  title: "How We Work | Purely Istanbul",
  description:
    "How Purely Istanbul curates, audits, and coordinates authentic local experiences and boutique hotel concierge services across Istanbul.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/legal/how-we-work",
  },
};

export default function HowWeWorkPage() {
  return (
    <LegalPageShell
      eyebrow="Legal & Trust"
      title="How We Work"
      intro="Purely Istanbul is a hospitality technology platform and curated city companion created to keep travelers away from tourist traps and connect them directly to Istanbul's authentic heart."
    >
      <section>
        <h2>Curated Excellence Across 10 Active Categories</h2>
        <p>
          Every experience on purelyistanbul.com — from Bosphorus yacht cruises and traditional hammams to licensed VIP
          airport transfers and in-stay gourmet catering — is vetted in person for licensing, transparent local pricing,
          and genuine hospitality.
        </p>
      </section>

      <section>
        <h2>In-Room Smart QR Stand &amp; Comus Concierge</h2>
        <p>
          Travelers staying with our partner Boutique Hotels &amp; Professional Property Managers enjoy instant Wi-Fi
          onboarding, seamless digital guest services, and 24/7 native-language guidance from Comus — our hyper-local
          concierge.
        </p>
      </section>
    </LegalPageShell>
  );
}
