import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";

export const metadata: Metadata = {
  title: "Distance Sales Agreement & Pre-Information Form | Purely Istanbul",
  description:
    "Distance Sales Agreement, Pre-Contractual Disclosure Form, and TÜRSAB Group A agency fulfillment terms for Purely Istanbul bookings.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/legal/distance-sales-agreement",
  },
};

export default function DistanceSalesAgreementPage() {
  return (
    <LegalPageShell
      eyebrow="Legal & Trust"
      title="Distance Sales Agreement & Pre-Information Disclosure"
      intro="This Distance Sales Agreement and Pre-Contractual Information Form is executed electronically pursuant to the Turkish Consumer Protection Law No. 6502, the Distance Contracts Regulation (Mesafeli Sözleşmeler Yönetmeliği), and Law No. 6563 on the Regulation of Electronic Commerce."
    >
      <section>
        <h2>1. Parties &amp; Platform Intermediary Disclosure</h2>
        <p>
          <strong>Platform Intermediary Service Provider:</strong> {CORPORATE_CONFIG.legalEntityName} (
          {CORPORATE_CONFIG.registeredAddress}, Email: {CORPORATE_CONFIG.contactEmail}, Phone:{" "}
          {CORPORATE_CONFIG.contactPhone}).
        </p>
        <p>
          <strong>Fulfilling Supplier / Certified Operator:</strong> Each experience, guided tour, yacht charter,
          wellness ritual, or private transfer listed on purelyistanbul.com is operated by an independent, pre-vetted
          supplier whose commercial title, TÜRSAB Group A license number (where applicable under Law No. 1618), or
          Ministry of Transport D2 authorization is recorded on your reservation confirmation voucher.
        </p>
        <p>
          <strong>Guest / Buyer:</strong> The individual or corporate traveler completing a digital reservation request
          via purelyistanbul.com.
        </p>
      </section>

      <section>
        <h2>2. Subject Matter &amp; Service Characteristics</h2>
        <p>
          The subject of this agreement is the electronic reservation and fulfillment of curated leisure experiences,
          private maritime charters, historical walking routes, culinary tastings, traditional hammam sessions, and
          licensed airport transfers in Istanbul. Prior to checkout, the Guest is provided with the full itinerary,
          inclusions and exclusions, duration, meeting point coordinates, and total tax-inclusive price on the listing
          detail page.
        </p>
      </section>

      <section>
        <h2>3. Transparent Pricing &amp; Payment Terms</h2>
        <ul>
          <li>
            All prices displayed on the checkout summary include applicable value-added tax (VAT / KDV) and mandatory
            local service charges unless explicitly stated otherwise under &ldquo;Not Included.&rdquo;
          </li>
          <li>
            Payments are processed in real time via encrypted Stripe checkout infrastructure. Upon reservation
            confirmation, an electronic summary voucher and fiscal invoice details are dispatched to the Guest&apos;s
            registered email address.
          </li>
          <li>
            Zero tourist markups or hidden commissions are added after booking confirmation.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Right of Withdrawal, Cancellation Windows &amp; Statutory Exemptions</h2>
        <p>
          While Article 15(1)(g) of the Turkish Distance Contracts Regulation provides a statutory exemption from the
          unconditional 14-day right of withdrawal for date-specific leisure, accommodation, and passenger transport
          services, <strong>Purely Istanbul extends an enhanced Guest Protection Guarantee</strong> on all standard
          marketplace bookings:
        </p>
        <ul>
          <li>
            <strong>48+ Hours Before Start:</strong> 100% full refund with zero cancellation penalty when cancelled at
            least 48 hours prior to the scheduled departure or appointment time.
          </li>
          <li>
            <strong>24 to 48 Hours Before Start:</strong> Complimentary date or time rescheduling subject to operator
            availability, or a 50% refund on standard non-bespoke bookings.
          </li>
          <li>
            <strong>Less Than 24 Hours / No-Show:</strong> Because private captains, historians, vehicles, and hammam
            suites are reserved exclusively for your party, cancellations made less than 24 hours before start are
            non-refundable unless caused by verified medical emergencies or flight disruptions.
          </li>
        </ul>
        <p>
          Full refund processing timelines are detailed in our{" "}
          <Link href="/marketplace/legal/cancellation-refund" className="text-terracotta underline font-medium">
            Cancellation &amp; Refund Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>5. TÜRSAB Group A Agency Liability &amp; Insurance</h2>
        <p>
          All regulated travel agency services, multi-stop cultural tours, and package excursions on purelyistanbul.com
          are operated by licensed <strong>TÜRSAB (Association of Turkish Travel Agencies) Group A</strong> member
          agencies in compliance with Law No. 1618. The fulfilling TÜRSAB Group A operator maintains mandatory statutory
          liability insurance, certified tour guides licensed by the Ministry of Culture and Tourism (TUREB), and full
          operational responsibility for on-the-ground service delivery.
        </p>
      </section>

      <section>
        <h2>6. Dispute Resolution &amp; Governing Law</h2>
        <p>
          Guests may submit any service feedback or formal claims directly to our 24/7 Guest Care team at{" "}
          <strong>{CORPORATE_CONFIG.contactEmail}</strong> or via WhatsApp Concierge at{" "}
          <strong>{CORPORATE_CONFIG.contactPhone}</strong>. For formal consumer disputes, Turkish Consumer Arbitration
          Committees (Tüketici Hakem Heyetleri) and Istanbul (Çağlayan) Consumer Courts have jurisdiction alongside
          applicable mandatory consumer protections of the Guest&apos;s country of residence.
        </p>
      </section>
    </LegalPageShell>
  );
}
