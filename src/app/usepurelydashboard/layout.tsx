import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "purelyİstanbul — Yönetim Masası | Web, iOS App & PWA",
  description:
    "purelyistanbul.com Web Sitesi, iOS App ve Mobil PWA için sadeleştirilmiş merkezi yönetim paneli.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function UsePurelyDashboardLayout({
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
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
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
            }
            [data-comus-dashboard] .comus-serif {
              font-family: 'Cormorant Garamond', Georgia, serif;
            }
            [data-comus-dashboard] .comus-logo {
              font-family: 'Cormorant Garamond', Georgia, serif;
              font-size: 1.65rem;
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
              font-weight: 500;
              letter-spacing: 0.08em;
              padding: 0.3rem 0.85rem;
              border-radius: 100px;
              border: 1px solid var(--green-border);
              text-transform: uppercase;
            }
            [data-comus-dashboard] .comus-badge-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: var(--green-mid);
            }
            [data-comus-dashboard] .comus-btn-primary {
              background: var(--green);
              color: #ffffff;
              border: 1px solid var(--green);
              padding: 0.65rem 1.35rem;
              border-radius: 100px;
              font-family: 'DM Sans', sans-serif;
              font-size: 0.84rem;
              font-weight: 400;
              letter-spacing: 0.02em;
              cursor: pointer;
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
              padding: 0.65rem 1.35rem;
              border-radius: 100px;
              font-family: 'DM Sans', sans-serif;
              font-size: 0.84rem;
              font-weight: 400;
              letter-spacing: 0.02em;
              cursor: pointer;
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
              padding: 0.6rem 1.25rem;
              border-radius: 100px;
              font-family: 'DM Sans', sans-serif;
              font-size: 0.82rem;
              font-weight: 400;
              cursor: pointer;
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
              border-radius: 16px;
              padding: 1.5rem;
              box-shadow: 0 4px 20px rgba(44, 44, 26, 0.04);
            }
            [data-comus-dashboard] .comus-hairline-grid {
              display: grid;
              gap: 1px;
              background: var(--border);
              border: 1px solid var(--border);
              border-radius: 16px;
              overflow: hidden;
            }
            [data-comus-dashboard] .comus-hairline-cell {
              background: var(--surface);
              padding: 1.5rem;
              transition: background 0.2s ease;
            }
            [data-comus-dashboard] .comus-hairline-cell:hover {
              background: var(--cream);
            }
            [data-comus-dashboard] .comus-input {
              font-family: 'DM Sans', sans-serif;
              font-size: 0.875rem;
              font-weight: 400;
              border: 1px solid var(--border);
              border-radius: 10px;
              padding: 0.6rem 0.85rem;
              color: var(--text);
              background: var(--surface);
              width: 100%;
              outline: none;
              transition: border-color 0.2s ease;
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
          `,
        }}
      />
      {children}
    </>
  );
}
