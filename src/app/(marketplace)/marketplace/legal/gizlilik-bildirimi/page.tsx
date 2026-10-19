import { permanentRedirect } from "next/navigation";

export default function LegacyGizlilikBildirimiRedirect() {
  permanentRedirect("/marketplace/legal/privacy-policy");
}
