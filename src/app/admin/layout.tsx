import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Purely İstanbul — Operasyon & Yönetim Paneli",
  description: "Purely Istanbul Master Operasyon, İlan, Rezervasyon & Finans Yönetim Paneli (PWA)",
  manifest: "/manifest-admin.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Purely Admin",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B6D11",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
