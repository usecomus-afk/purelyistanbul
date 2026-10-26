import { redirect } from "next/navigation";

/**
 * /usepurelydashboard ve /admin tek bir tam donanımlı PWA dashboard panelinde birleştirilmiştir.
 * Bu sayfaya gelen tüm istekler doğrudan /admin paneline yönlendirilir.
 */
export default function UsePurelyDashboardPage() {
  redirect("/admin");
}
