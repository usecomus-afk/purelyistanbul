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
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            [data-comus-dashboard] {
              --cream: #F6F1E8;
              --cream-dark: #EDE8DE;
              --surface: #FFFCFA;
              --green: #3B6D11;
              --green-hover: #27500A;
              --green-light: #EAF3DE;
              --green-border: #C0DD97;
              --green-mid: #639922;
              --terracotta: #C1622F;
              --terracotta-dark: #9C4E24;
              --terracotta-soft: #F3E3D8;
              --text: #2C2C1A;
              --text-muted: #6B6B55;
              --border: #C8C4B0;
              background-color: var(--cream);
              color: var(--text);
              font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              font-weight: 400;
              line-height: 1.6;
              width: 100%;
              max-width: 100vw;
              max-width: 100dvw;
              min-height: 100vh;
              min-height: 100dvh;
              overflow-x: hidden;
              -webkit-text-size-adjust: 100%;
            }
            [data-comus-dashboard] .comus-serif {
              font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              font-weight: 600 !important;
              letter-spacing: -0.02em;
            }
            [data-comus-dashboard] .comus-serif em {
              font-style: normal !important;
              font-weight: 700 !important;
            }
            @media (max-width: 767px) {
              [data-comus-dashboard] {
                padding-top: max(3.25rem, calc(env(safe-area-inset-top, 47px) + 0.5rem));
              }
            }
            .admin-safe-top-mask {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: max(3rem, env(safe-area-inset-top, 47px));
              background: linear-gradient(180deg, #F6F1E8 80%, rgba(246, 241, 232, 0));
              z-index: 45;
              pointer-events: none;
            }
            @media (min-width: 768px) {
              .admin-safe-top-mask {
                display: none;
              }
            }
            [data-comus-dashboard] .comus-logo {
              font-family: 'Cormorant Garamond', Georgia, serif;
              font-size: clamp(1.3rem, 1.05rem + 1.4vw, 1.65rem);
              font-weight: 400;
              letter-spacing: 0.06em;
              color: var(--text);
              text-decoration: none;
            }
            [data-comus-dashboard] .comus-logo span {
              color: var(--green);
              font-style: italic;
            }
            [data-comus-dashboard] .comus-badge {
              display: inline-flex;
              align-items: center;
              gap: 0.45rem;
              background: var(--green-light);
              color: var(--green);
              font-size: 0.72rem;
              font-weight: 600;
              letter-spacing: 0.06em;
              line-height: 1.25;
              padding: 0.38rem 0.75rem;
              border-radius: 8px;
              border: 1px solid var(--green-border);
              text-transform: uppercase;
              max-width: 100%;
            }
            [data-comus-dashboard] .comus-badge-dot {
              width: 6px;
              height: 6px;
              border-radius: 2px;
              background: var(--green-mid);
              flex-shrink: 0;
            }
            [data-comus-dashboard] .comus-btn-primary {
              background: var(--green);
              color: #ffffff;
              border: 1px solid var(--green);
              padding: 0.6rem 1.05rem;
              min-height: 38px;
              border-radius: 8px;
              font-family: 'DM Sans', sans-serif;
              font-size: 0.82rem;
              font-weight: 500;
              line-height: 1.3;
              letter-spacing: 0.01em;
              cursor: pointer;
              touch-action: manipulation;
              transition: all 0.2s ease;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.45rem;
            }
            [data-comus-dashboard] .comus-btn-primary:hover {
              background: var(--green-hover);
              border-color: var(--green-hover);
            }
            [data-comus-dashboard] .comus-btn-terracotta {
              background: var(--terracotta);
              color: #ffffff;
              border: 1px solid var(--terracotta);
              padding: 0.6rem 1.05rem;
              min-height: 38px;
              border-radius: 8px;
              font-family: 'DM Sans', sans-serif;
              font-size: 0.82rem;
              font-weight: 500;
              line-height: 1.3;
              letter-spacing: 0.01em;
              cursor: pointer;
              touch-action: manipulation;
              transition: all 0.2s ease;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.45rem;
            }
            [data-comus-dashboard] .comus-btn-terracotta:hover {
              background: var(--terracotta-dark);
              border-color: var(--terracotta-dark);
            }
            [data-comus-dashboard] .comus-btn-ghost {
              background: var(--surface);
              color: var(--text);
              border: 1px solid var(--border);
              padding: 0.58rem 1rem;
              min-height: 38px;
              border-radius: 8px;
              font-family: 'DM Sans', sans-serif;
              font-size: 0.82rem;
              font-weight: 500;
              line-height: 1.3;
              cursor: pointer;
              touch-action: manipulation;
              transition: all 0.2s ease;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.45rem;
            }
            [data-comus-dashboard] .comus-btn-ghost:hover {
              border-color: var(--green);
              color: var(--green);
              background: var(--green-light);
            }
            [data-comus-dashboard] .comus-card {
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 1rem;
              min-width: 0;
              max-width: 100%;
              box-shadow: 0 4px 20px rgba(44, 44, 26, 0.04);
            }
            @media (min-width: 640px) {
              [data-comus-dashboard] .comus-card {
                padding: 1.5rem;
              }
            }
            [data-comus-dashboard] .comus-hairline-grid {
              display: grid;
              gap: 1px;
              background: var(--border);
              border: 1px solid var(--border);
              border-radius: 12px;
              overflow: hidden;
              max-width: 100%;
            }
            [data-comus-dashboard] .comus-hairline-cell {
              background: var(--surface);
              padding: 1rem;
              min-width: 0;
              transition: background 0.2s ease;
            }
            @media (min-width: 640px) {
              [data-comus-dashboard] .comus-hairline-cell {
                padding: 1.5rem;
              }
            }
            [data-comus-dashboard] .comus-hairline-cell:hover {
              background: var(--cream);
            }
            [data-comus-dashboard] .comus-input {
              font-family: 'DM Sans', sans-serif;
              font-size: 16px;
              font-weight: 400;
              border: 1px solid var(--border);
              border-radius: 8px;
              padding: 0.6rem 0.85rem;
              color: var(--text);
              background: var(--surface);
              width: 100%;
              max-width: 100%;
              min-width: 0;
              outline: none;
              transition: border-color 0.2s ease;
            }
            @media (min-width: 640px) {
              [data-comus-dashboard] .comus-input {
                font-size: 0.875rem;
              }
            }
            [data-comus-dashboard] .comus-input.pl-10 {
              padding-left: 2.5rem;
            }
            [data-comus-dashboard] .comus-input:focus {
              border-color: var(--green);
            }
            [data-comus-dashboard] .comus-label {
              display: block;
              font-size: 0.72rem;
              font-weight: 500;
              letter-spacing: 0.07em;
              text-transform: uppercase;
              color: var(--text-muted);
              margin-bottom: 0.35rem;
            }
            [data-comus-dashboard] .rounded-full:not(.animate-spin) {
              border-radius: 8px !important;
            }
            [data-comus-dashboard] .comus-mobile-tabbar {
              display: flex;
              align-items: center;
              gap: 0.375rem;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            [data-comus-dashboard] .comus-mobile-tabbar::-webkit-scrollbar {
              display: none;
            }
            /* Container-queried responsive table */
            [data-comus-dashboard] .comus-table-wrapper {
              overflow: auto;
              max-inline-size: 100%;
              container-type: inline-size;
            }
            [data-comus-dashboard] .comus-responsive-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              --label-1: "Kategori";
              --label-2: "Durum";
              --label-3: "Toplam İlan";
              --label-4: "Yayında (Aktif)";
              --label-5: "Askıda";
              --label-6: "Ort. Komisyon";
            }
            [data-comus-dashboard] .comus-responsive-table thead {
              position: sticky;
              inset-block-start: 0;
              z-index: 1;
              background: var(--surface);
            }
            [data-comus-dashboard] .comus-responsive-table tbody th {
              position: sticky;
              inset-inline-start: 0;
              background: var(--surface);
              text-align: left;
            }
            @container (width < 600px) {
              [data-comus-dashboard] .comus-responsive-table,
              [data-comus-dashboard] .comus-responsive-table thead,
              [data-comus-dashboard] .comus-responsive-table tbody,
              [data-comus-dashboard] .comus-responsive-table tr,
              [data-comus-dashboard] .comus-responsive-table th,
              [data-comus-dashboard] .comus-responsive-table td {
                display: block;
              }
              [data-comus-dashboard] .comus-responsive-table thead {
                display: none;
              }
              [data-comus-dashboard] .comus-responsive-table tbody tr {
                margin-block-end: 0.75rem;
                border: 1px solid var(--border);
                border-radius: 10px;
                padding: 0.65rem 0.85rem;
                background: var(--cream);
              }
              [data-comus-dashboard] .comus-responsive-table tbody th {
                position: sticky;
                inset-block-start: 0;
                z-index: 2;
                background: var(--cream);
                padding: 0.25rem 0 0.4rem 0;
                margin-bottom: 0.35rem;
                border-bottom: 1px solid var(--border);
                font-size: 0.85rem;
              }
              [data-comus-dashboard] .comus-responsive-table td {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.25rem 0 !important;
                font-size: 0.78rem;
              }
              [data-comus-dashboard] .comus-responsive-table td:nth-child(2)::before {
                content: var(--label-2) ": " / var(--label-2);
                color: var(--text-muted);
                font-weight: 500;
              }
              [data-comus-dashboard] .comus-responsive-table td:nth-child(3)::before {
                content: var(--label-3) ": " / var(--label-3);
                color: var(--text-muted);
                font-weight: 500;
              }
              [data-comus-dashboard] .comus-responsive-table td:nth-child(4)::before {
                content: var(--label-4) ": " / var(--label-4);
                color: var(--text-muted);
                font-weight: 500;
              }
              [data-comus-dashboard] .comus-responsive-table td:nth-child(5)::before {
                content: var(--label-5) ": " / var(--label-5);
                color: var(--text-muted);
                font-weight: 500;
              }
              [data-comus-dashboard] .comus-responsive-table td:nth-child(6)::before {
                content: var(--label-6) ": " / var(--label-6);
                color: var(--text-muted);
                font-weight: 500;
              }
            }
          `,
        }}
      />
      {children}
    </>
  );
}
