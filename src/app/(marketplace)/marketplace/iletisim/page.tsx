import { permanentRedirect } from "next/navigation";

export default function LegacyIletisimRedirect() {
  permanentRedirect("/marketplace/contact");
}
