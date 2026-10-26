const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');

// 1. Update font-luxury-serif token to prioritize EB Garamond
css = css.replace(
  '--font-luxury-serif: "Playfair Display", "Merriweather", Georgia, serif;',
  '--font-luxury-serif: "EB Garamond", "Cormorant Garamond", "Playfair Display", Georgia, serif;'
);

// 2. Define the Luxury Dark Ottoman / Heritage Boutique Design Tokens at root
const tokens = `
  /* Luxury Dark Ottoman / Heritage Boutique Tokens (Stay / Konaklama) */
  --ottoman-bg: #151310;
  --ottoman-card: #1D1B18;
  --ottoman-surface-active: #262420;
  --ottoman-surface-elevated: #3B3935;
  --ottoman-border: rgba(212, 175, 55, 0.14);
  --ottoman-border-subtle: rgba(255, 255, 255, 0.06);
  --ottoman-gold: #D4AF37;
  --ottoman-gold-hover: #E5C358;
  --ottoman-gold-glow: rgba(212, 175, 55, 0.25);
  --ottoman-text-primary: #F5F2EB;
  --ottoman-text-secondary: #A8A398;
  --ottoman-text-tertiary: #6E6B65;
  --ottoman-signal-green: #4E8B62;
  --ottoman-amber-glow: rgba(212, 140, 55, 0.28);
`;

if (!css.includes('--ottoman-bg:')) {
  css = css.replace('  /* Cockpit Olympus Dark Theme */', tokens + '\n  /* Cockpit Olympus Dark Theme */');
}

// 3. Add explicit Ottoman Theme styles for the Konaklama page
const ottomanThemeRules = `

/* ==========================================================================
   LUXURY DARK OTTOMAN / HERITAGE BOUTIQUE STYLES (Stay / Konaklama Page)
   ========================================================================== */

.ottoman-theme {
  background-color: var(--ottoman-bg) !important;
  color: var(--ottoman-text-primary) !important;
  font-family: var(--font-luxury-sans), "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Display & Headings: EB Garamond, 600 medium-semibold, relaxed letter-spacing */
.ottoman-theme .font-luxury-serif,
.ottoman-theme h1,
.ottoman-theme h2,
.ottoman-theme h3 {
  font-family: var(--font-luxury-serif), "EB Garamond", serif !important;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: var(--ottoman-text-primary);
}

/* Category Badges, Status Headers, Micro-labels: uppercase tracked-out */
.ottoman-badge {
  font-family: var(--font-luxury-sans), "Plus Jakarta Sans", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  font-size: 11px;
}

/* Ottoman Fixed Top Header Glass Pill */
.ottoman-theme .ottoman-header-pill {
  background: linear-gradient(145deg, rgba(29, 27, 24, 0.92) 0%, rgba(21, 19, 16, 0.95) 100%) !important;
  backdrop-filter: blur(20px) saturate(130%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(130%) !important;
  border: 1px solid var(--ottoman-border) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.08),
    0 10px 30px rgba(0, 0, 0, 0.45) !important;
}

/* Room badge pill inside header */
.ottoman-theme .ottoman-room-badge {
  background: var(--ottoman-surface-active) !important;
  border: 1px solid var(--ottoman-border) !important;
  color: var(--ottoman-text-primary) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}

.ottoman-theme .ottoman-room-badge:hover {
  background: var(--ottoman-surface-elevated) !important;
  border-color: rgba(212, 175, 55, 0.28) !important;
}

/* Elevated Cards in Konaklama (Services & Categories) */
.ottoman-theme .luxury-category-card,
.ottoman-theme .luxury-service-card {
  background: linear-gradient(155deg, #1D1B18 0%, #151310 100%) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid var(--ottoman-border) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.06),
    0 10px 24px -6px rgba(0, 0, 0, 0.5),
    0 2px 8px 0 rgba(0, 0, 0, 0.3) !important;
  transition: all 0.24s cubic-bezier(0.22, 1, 0.36, 1) !important;
}

.ottoman-theme .luxury-category-card::before,
.ottoman-theme .luxury-service-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.45) 50%, transparent 100%) !important;
  pointer-events: none;
}

.ottoman-theme .luxury-category-card::after,
.ottoman-theme .luxury-service-card::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.2) 50%, transparent 100%) !important;
  pointer-events: none;
}

.ottoman-theme .luxury-category-card:hover,
.ottoman-theme .luxury-service-card:hover {
  background: linear-gradient(155deg, #262420 0%, #1D1B18 100%) !important;
  border-color: rgba(212, 175, 55, 0.38) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    0 14px 32px -6px rgba(0, 0, 0, 0.65),
    0 0 18px rgba(212, 175, 55, 0.12) !important;
  transform: translateY(-2px) !important;
}

/* Card Titles and Labels */
.ottoman-theme .luxury-category-title {
  color: var(--ottoman-text-primary) !important;
  font-family: var(--font-luxury-sans), "Plus Jakarta Sans", sans-serif !important;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
}

.ottoman-theme .group:hover .luxury-category-title {
  color: var(--ottoman-gold-hover) !important;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.3) !important;
}

/* Bottom Tab Bar in Luxury Ottoman Dark */
.ottoman-theme .mobile-bottom-nav {
  background: linear-gradient(180deg, rgba(29, 27, 24, 0.94) 0%, rgba(21, 19, 16, 0.98) 100%) !important;
  backdrop-filter: blur(20px) saturate(130%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(130%) !important;
  border-top: 1px solid var(--ottoman-border) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.06), 0 -8px 28px rgba(0, 0, 0, 0.55) !important;
}

.ottoman-theme .mobile-bottom-nav::after {
  background: rgba(21, 19, 16, 0.98) !important;
}

/* Active tab item inside bottom bar */
.ottoman-theme .ottoman-tab-active {
  background: var(--ottoman-surface-active) !important;
  border: 1.5px solid var(--ottoman-gold) !important;
  color: var(--ottoman-gold) !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
}

/* Primary CTA Button: Antique Brass / Ottoman Gold */
.ottoman-btn-gold {
  background: linear-gradient(145deg, #E5C358 0%, #D4AF37 50%, #B89324 100%) !important;
  color: #151310 !important;
  font-family: var(--font-luxury-sans), "Plus Jakarta Sans", sans-serif;
  font-weight: 600;
  border-radius: 9999px;
  box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.ottoman-btn-gold:hover {
  background: linear-gradient(145deg, #F0D272 0%, #E5C358 50%, #C9A227 100%) !important;
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

/* Signal Indicator (e.g. Comus Online / Synced active signal) */
.ottoman-signal-dot {
  background-color: var(--ottoman-signal-green) !important;
  box-shadow: 0 0 8px var(--ottoman-signal-green);
}
`;

if (!css.includes('LUXURY DARK OTTOMAN')) {
  css += ottomanThemeRules;
  fs.writeFileSync('src/app/globals.css', css, 'utf8');
  console.log('globals.css updated with Luxury Dark Ottoman tokens');
} else {
  console.log('globals.css already has Luxury Dark Ottoman styles');
}
