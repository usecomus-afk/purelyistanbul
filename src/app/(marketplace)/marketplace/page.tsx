import { redirect } from "next/navigation";

/**
 * Marketplace vitrini artık kök "/" adresinde (bkz. (guest)/page.tsx —
 * aktif otel/oda oturumu yoksa orada gösterilir). Eski /marketplace
 * bağlantıları kırılmasın diye buraya gelenler köke yönlendirilir.
 */
export default function MarketplaceRedirectPage() {
  redirect("/");
}
