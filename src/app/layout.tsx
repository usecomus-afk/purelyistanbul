import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import { AppIntroSplash } from "@/components/app-intro-splash";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

const luxurySerif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
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
  title: "purelyİstanbul - Digital Guest Directory & Concierge",
  description: "purelyİstanbul Digital In-Room Directory, QR Check-in, City Experiences & Gemini AI Concierge",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F8F4ED"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${luxurySerif.variable} ${luxurySans.variable}`}>
      <head>
        {/* Blocking script: hides body instantly on first paint to prevent
            the marketplace page flashing before the splash GIF mounts.
            Runs before React hydration, skipped if splash already played. */}
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
                    document.documentElement.style.backgroundColor = '#F3F2EE';
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
