import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";

export const metadata: Metadata = {
  title: "Privacy Policy (UK GDPR & KVKK) | Purely Istanbul",
  description:
    "Data protection, cookie governance, UK GDPR, and Turkish Law No. 6698 (KVKK) privacy notice for Purely Istanbul guests and partners.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/legal/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal & Trust"
      title="Privacy Policy (UK GDPR & KVKK)"
      intro={`${CORPORATE_CONFIG.ukEntityName} (${CORPORATE_CONFIG.companyRegNo}) and ${CORPORATE_CONFIG.legalEntityName} protect the personal data of guests, partner Boutique Hotels & Professional Property Managers, and certified local operators in strict accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and Turkish Law No. 6698 on the Protection of Personal Data (KVKK).`}
    >
      <section>
        <h2>1. Data Controller &amp; Contact Information</h2>
        <p>
          For the purposes of applicable data protection legislation, the joint data controllers are{" "}
          <strong>{CORPORATE_CONFIG.ukEntityName}</strong> ({CORPORATE_CONFIG.companyRegNo}) and{" "}
          <strong>{CORPORATE_CONFIG.legalEntityName}</strong>, located at {CORPORATE_CONFIG.registeredAddress} (MERSİS No:{" "}
          {CORPORATE_CONFIG.mersisNo}). For any privacy inquiries or data subject requests, contact our Data Protection
          Team at <strong>{CORPORATE_CONFIG.contactEmail}</strong> or <strong>{CORPORATE_CONFIG.contactPhone}</strong>.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>
          To facilitate reservation requests, in-room guest services, and licensed airport transfers, we collect only
          essential contact and booking details:
        </p>
        <ul>
          <li>
            <strong>Identity &amp; Contact Data:</strong> Full name, email address, and mobile/WhatsApp contact number.
          </li>
          <li>
            <strong>Booking &amp; Stay Details:</strong> Preferred experience dates, participant count, pickup/meeting
            points, and statutory passenger details required by Turkish transport regulations (for VIP airport
            transfers and yacht charters).
          </li>
          <li>
            <strong>Payment Security:</strong> All card transactions are processed directly via PCI-DSS Level 1
            encrypted Stripe infrastructure. Purely Istanbul never stores raw credit or debit card numbers on its
            servers.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Comus Concierge Personalization &amp; Explicit Consent</h2>
        <p>
          Guests staying at partner Boutique Hotels &amp; Professional Property Managers may optionally share travel
          preferences, dietary requirements, or food allergies with Comus to receive tailored, native-language daily
          itineraries and culinary recommendations. This data is processed solely with explicit guest consent and is
          never sold or shared with third-party advertising networks.
        </p>
      </section>

      <section>
        <h2>4. Data Sharing &amp; Third-Party Fulfillment</h2>
        <p>
          Booking details are shared strictly on a need-to-know basis with the specific certified local operator
          (including licensed TÜRSAB Group A travel agencies and D2-certified transport operators) or partner Boutique
          Hotel fulfilling your requested service. We never sell or rent personal data to third parties.
        </p>
      </section>

      <section>
        <h2>5. Your Rights Under UK GDPR &amp; KVKK Article 11</h2>
        <p>
          Under UK GDPR and Article 11 of Turkish Law No. 6698 (KVKK), you have the right to learn whether your personal
          data is processed, request information regarding processing, request rectification of incomplete or inaccurate
          data, request erasure or destruction of data under statutory conditions, and object to automated profiling. You
          may exercise these rights at any time by emailing <strong>{CORPORATE_CONFIG.contactEmail}</strong>.
        </p>
      </section>
    </LegalPageShell>
  );
}
