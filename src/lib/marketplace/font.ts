import { Manrope } from "next/font/google";

/**
 * Marketplace modülünün tipografisi — ince/hafif ağırlıklar, geniş harf
 * aralığı ile editoryal, minimalist bir his verir. Sadece marketplace
 * yüzeylerine uygulanır (mevcut otel-misafir PWA'sının fontuna dokunmaz).
 */
export const marketplaceFont = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
});
