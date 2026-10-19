import { permanentRedirect } from "next/navigation";

export default function LegacyPartnerKayitRedirect() {
  permanentRedirect("/marketplace/partner/register");
}
