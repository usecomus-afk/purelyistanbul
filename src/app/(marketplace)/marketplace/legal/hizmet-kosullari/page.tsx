import { permanentRedirect } from "next/navigation";

export default function LegacyHizmetKosullariRedirect() {
  permanentRedirect("/marketplace/legal/terms-of-service");
}
