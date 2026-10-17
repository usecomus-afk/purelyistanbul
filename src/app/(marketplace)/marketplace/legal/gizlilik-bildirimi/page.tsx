import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function GizlilikBildirimiPage() {
  return (
    <LegalPageShell eyebrow="Legal & Governance" title="Privacy Notice (UK GDPR & KVKK)">
      <p className="text-ink-muted">
        Purely Istanbul Ltd (registered in the United Kingdom) protects the personal data of guests, partner Boutique Hotels &amp; Professional Property Managers, and certified local operators in strict accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and Turkish Law No. 6698 (KVKK).
      </p>

      <section>
        <h2>Information We Collect</h2>
        <p>
          To facilitate reservation requests, in-room guest services, and licensed airport transfers, we collect essential contact and booking details (full name, email address, phone number, and stay dates). Payment processing is handled directly via encrypted Stripe infrastructure.
        </p>
      </section>

      <section>
        <h2>ComusAI Personalization &amp; Consent</h2>
        <p>
          Guests staying at partner Boutique Hotels &amp; Professional Property Managers may optionally share travel preferences, dietary requirements, or food allergies with ComusAI to receive tailored, native-language daily itineraries and culinary recommendations. This data is processed solely with explicit guest consent and is never sold or shared with advertising networks.
        </p>
      </section>

      <section>
        <h2>Data Security &amp; Third-Party Fulfillment</h2>
        <p>
          Booking details are shared strictly with the specific certified local operator or Boutique Hotel fulfilling your requested service. Purely Istanbul Ltd never sells personal data to third parties.
        </p>
      </section>
    </LegalPageShell>
  );
}
