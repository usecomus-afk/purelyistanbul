import { permanentRedirect } from "next/navigation";

export default function LegacyCalismaSeklimizRedirect() {
  permanentRedirect("/marketplace/legal/how-we-work");
}
