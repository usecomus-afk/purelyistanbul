import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Purely Istanbul",
  description:
    "Clear cancellation windows, refund timeframes, weather guarantees, and TÜRSAB Group A agency liability terms for Purely Istanbul experiences.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/legal/cancellation-refund",
  },
};

export default function CancellationRefundPage() {
  return (
    <LegalPageShell
      eyebrow="Legal & Trust"
      title="Cancellation & Refund Policy"
      intro="At Purely Istanbul, we believe peace of mind is the foundation of genuine hospitality. Every experience booked on our marketplace is backed by clear cancellation windows, prompt refund processing, and direct concierge accountability."
    >
      <section>
        <h2>1. Standard Cancellation Windows</h2>
        <ul>
          <li>
            <strong>Free Cancellation (Up to 48 Hours Before Start):</strong> Guests may cancel any standard experience,
            walking tour, hammam reservation, or airport transfer up to <strong>48 hours</strong> before the scheduled
            start time for a <strong>100% full refund</strong>, with zero administrative fees.
          </li>
          <li>
            <strong>Flexible Rescheduling (24–48 Hours Before Start):</strong> Requests received between 24 and 48 hours
            prior to start are eligible for complimentary date/time rescheduling (subject to partner availability) or a
            50% refund.
          </li>
          <li>
            <strong>Late Cancellations (&lt; 24 Hours) &amp; No-Shows:</strong> Because licensed guides, private yachts,
            D2 transfer vehicles, and hammam therapists are allocated exclusively to your booking, cancellations within
            24 hours of start time or no-shows are non-refundable, except in verified cases of flight cancellation or
            medical emergency.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Weather, Maritime Safety &amp; Operator Cancellations</h2>
        <p>
          For Bosphorus yacht cruises and outdoor experiences, guest safety is paramount. If the Coast Guard, Port
          Authority, or certified captain postpones a sailing due to severe weather or force majeure, or if a partner
          operator cancels for any operational reason, you are entitled to your choice of:
        </p>
        <ul>
          <li>Priority rescheduling to the next available time slot during your stay in Istanbul, or</li>
          <li>An immediate <strong>100% full refund</strong> to your original payment method.</li>
        </ul>
      </section>

      <section>
        <h2>3. Refund Processing Timeframes</h2>
        <ul>
          <li>
            <strong>Initiation:</strong> Approved refunds are initiated by Purely Istanbul Guest Care within{" "}
            <strong>24 hours</strong> of your cancellation confirmation.
          </li>
          <li>
            <strong>Bank &amp; Card Settlement:</strong> Refunds are processed back to the original credit/debit card or
            Apple Pay / Google Pay wallet via Stripe and typically appear on your statement within{" "}
            <strong>3 to 7 business days</strong>, depending on your issuing bank.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. TÜRSAB Group A Agency Liability &amp; Guest Protection</h2>
        <p>
          Regulated cultural tours, museum fast-track excursions, and travel packages offered on purelyistanbul.com are
          fulfilled by licensed <strong>TÜRSAB Group A travel agencies</strong> in accordance with Turkish Travel
          Agencies Law No. 1618 and the Package Travel Regulation. Where a service fails to meet the contracted itinerary
          specifications or verified local pricing standards under our{" "}
          <Link href="/our-philosophy" className="text-terracotta underline font-medium">
            Tanrı Misafiri Ethical Guarantee
          </Link>
          , Purely Istanbul intervenes directly on the Guest&apos;s behalf to enforce full or partial restitution.
        </p>
      </section>

      <section>
        <h2>5. How to Request a Cancellation or Modification</h2>
        <p>
          To cancel or reschedule a booking, simply contact our 24/7 Guest Care team with your reservation reference:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> {CORPORATE_CONFIG.contactEmail}
          </li>
          <li>
            <strong>WhatsApp Concierge / Phone:</strong> {CORPORATE_CONFIG.contactPhone} (24/7 Live Support)
          </li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
