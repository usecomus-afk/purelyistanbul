import { permanentRedirect } from "next/navigation";

export default function LegacyPartnerYardimRedirect() {
  permanentRedirect("/marketplace/partner/support");
}
