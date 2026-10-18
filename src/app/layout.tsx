import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import { AppIntroSplash } from "@/components/app-intro-splash";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Purely Istanbul — Nothing but Istanbul | Curated Experiences & Local Marketplace",
  description:
    "Your curated city companion for authentic Bosphorus cruises, historic walks, culinary trails, and vetted local services across Istanbul.",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
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
