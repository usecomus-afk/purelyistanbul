import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import { AppIntroSplash } from "@/components/app-intro-splash";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

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
  themeColor: "#F8F4ED"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* Blocking script: hides body instantly on first paint to prevent
            the marketplace page flashing before the splash GIF mounts.
            Runs before React hydration, skipped if splash already played. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var played = sessionStorage.getItem('purely_splash_played') ||
                               sessionStorage.getItem('xenios_splash_played');
                  var path = window.location.pathname;
                  var skipPaths = ['/hotel-portal','/dashboard','/qr-generator'];
                  var isSkipPath = skipPaths.some(function(p){ return path.startsWith(p); });
                  if (!played && !isSkipPath) {
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
