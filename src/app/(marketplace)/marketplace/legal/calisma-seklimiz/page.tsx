import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function CalismaSeklimizPage() {
  return (
    <LegalPageShell eyebrow="Legal & Governance" title="How We Work">
      <p className="text-ink-muted">
        Purely Istanbul Ltd is a London-registered hospitality technology SaaS and curated city companion created to end predatory tourist traps and bridge discerning travelers directly to Istanbul&apos;s authentic heart.
      </p>

      <section>
        <h2>Curated Excellence Across 10 Active Categories</h2>
        <p>
          Every experience on purelyistanbul.com — from Bosphorus yacht cruises and traditional hammams to licensed VIP airport transfers and in-stay gourmet catering — is vetted in person for licensing, transparent local pricing, and genuine hospitality.
        </p>
      </section>

      <section>
        <h2>In-Room Smart QR Stand &amp; Comus Concierge</h2>
        <p>
          Travelers staying with our partner Boutique Hotels &amp; Professional Property Managers enjoy instant Wi-Fi onboarding, seamless PWA guest services, and 24/7 native-language guidance from Comus — our hyper-local concierge.
        </p>
      </section>
    </LegalPageShell>
  );
}
