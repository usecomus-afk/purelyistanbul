import { permanentRedirect } from "next/navigation";

export default function LegacyPartnerIstirakRedirect() {
  permanentRedirect("/marketplace/partner/partnership");
}
