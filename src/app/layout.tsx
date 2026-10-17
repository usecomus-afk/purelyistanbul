import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import { AppIntroSplash } from "@/components/app-intro-splash";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

const luxurySerif = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-luxury-serif",
  display: "swap",
});

const luxurySans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-luxury-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Purely Istanbul — Nothing but Istanbul | Hospitality SaaS & Curated Marketplace",
  description:
    "The in-room hospitality operating system and curated city companion for travelers staying in Istanbul's finest boutique hotels and designer suites.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#FBFBF9"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${luxurySerif.variable} ${luxurySans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                  var path = window.location.pathname || '';
                  var adminLightPaths = ['/usepurelydashboard', '/pilot', '/admin', '/dashboard', '/hotel-portal', '/qr-generator'];
                  var isAdminLightPath = adminLightPaths.some(function(p){ return path.startsWith(p); });
                  var played = sessionStorage.getItem('purely_splash_played') ||
                               sessionStorage.getItem('xenios_splash_played');
                  if (!played && !isAdminLightPath) {
                    document.documentElement.style.backgroundColor = '#FBFBF9';
                  }
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-amber-200">
        <AppIntroSplash />
        <PwaRegister />
        {children}
        <CookieConsentBanner />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
