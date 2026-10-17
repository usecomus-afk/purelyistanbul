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
        <h2>In-Room Smart QR Stand &amp; ComusAI Concierge</h2>
        <p>
          Travelers staying with our partner Boutique Hotels &amp; Professional Property Managers enjoy instant Wi-Fi onboarding, seamless PWA guest services (housekeeping, maintenance, breakfast catering, express laundry), and 24/7 native-language guidance from ComusAI — our Gemini-powered hyper-local AI concierge.
        </p>
      </section>

      <section>
        <h2>Fairness &amp; Merit-Based Curation</h2>
        <p>
          While global platforms extract 25–30% commissions from local boat captains and artisans, Purely Istanbul charges a modest 10–12% technology fee. Rankings are determined strictly by verified guest satisfaction and adherence to our Ethical Charter — never paid advertising.
        </p>
      </section>
    </LegalPageShell>
  );
}
