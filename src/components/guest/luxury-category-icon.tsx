"use client";

import React from "react";

interface LuxuryCategoryIconProps {
  categoryKey: string;
  className?: string;
}

/**
 * Minimal, refined, modern monoline icons for Istanbul Categories & Practical Guide.
 * - Clean 24x24 architectural geometry
 * - Calm antique-bronze stroke (#7D5E28) with whisper-soft warm ivory tint
 * - Zero cartoon clip-art details, zero heavy 3D extrusion filters
 */
export function LuxuryCategoryIcon({
  categoryKey,
  className = "w-[64px] h-[64px] sm:w-[76px] sm:h-[76px]",
}: LuxuryCategoryIconProps) {
  const key = (categoryKey || "").toLowerCase();
  const strokeColor = "#7D5E28";
  const softFill = "rgba(255, 251, 242, 0.55)";

  const renderPaths = () => {
    // A. Official Istanbulkart & Public Transit Card
    if (key.includes("istanbulkart") || key.includes("transit-card")) {
      return (
        <g>
          <rect x="3.5" y="6" width="17" height="12" rx="2.2" fill={softFill} />
          <rect x="6.5" y="10" width="3.5" height="2.8" rx="0.6" />
          <path d="M15.5 10.2C16.3 11 16.3 12.2 15.5 13M17.2 9C18.5 10.3 18.5 12.9 17.2 14.2" />
          <path d="M3.5 15H20.5" />
        </g>
      );
    }

    // B. Official MuseumPass (MüzeKart)
    if (key.includes("muzekart") || key.includes("museum-pass")) {
      return (
        <g>
          <path d="M4 9.5L12 4.5L20 9.5H4Z" fill={softFill} />
          <path d="M6.5 9.5V17.5M10.2 9.5V17.5M13.8 9.5V17.5M17.5 9.5V17.5" />
          <path d="M4 17.5H20M3 20H21" />
        </g>
      );
    }

    // C. Guest Shield / Legal Rights
    if (key.includes("shield") || key.includes("kalkan")) {
      return (
        <g>
          <path
            d="M12 3.8L5 6.8V12.2C5 16.8 8 20.1 12 21.4C16 20.1 19 16.8 19 12.2V6.8L12 3.8Z"
            fill={softFill}
          />
          <path d="M9.2 12.3L11.1 14.2L15 10.2" />
        </g>
      );
    }

    // D. Emergency / SOS Support
    if (key.includes("emergency") || key.includes("sos") || key.includes("acil")) {
      return (
        <g>
          <circle cx="12" cy="12" r="8.2" fill={softFill} />
          <path d="M9.4 9.2C8.9 10.1 9.4 11.9 10.8 13.2C12.1 14.6 13.9 15.1 14.8 14.6L15.7 13.7C16 13.4 16 12.9 15.7 12.6L14.6 11.9C14.3 11.7 13.8 11.8 13.5 12.1L13 12.5C12.3 12.1 11.9 11.7 11.5 11L11.9 10.5C12.2 10.2 12.3 9.7 12.1 9.4L11.4 8.3C11.1 8 10.6 8 10.3 8.3L9.4 9.2Z" />
        </g>
      );
    }

    // E. Ombudsman / Fair Shopping / Scales of Justice
    if (
      key.includes("complaint") ||
      key.includes("ombudsman") ||
      key.includes("scale") ||
      key.includes("bad-experience")
    ) {
      return (
        <g>
          <path d="M12 4.5V19.5M8 19.5H16" />
          <path d="M5.5 7.5H18.5" />
          <path d="M5.5 7.5L3.5 13H7.5L5.5 7.5Z" fill={softFill} />
          <path d="M18.5 7.5L16.5 13H20.5L18.5 7.5Z" fill={softFill} />
        </g>
      );
    }

    // F. Online Check-in & KBS Biometric Passport
    if (key.includes("kbs") || key.includes("checkin") || key.includes("passport")) {
      return (
        <g>
          <rect x="5.5" y="3.8" width="13" height="16.4" rx="2" fill={softFill} />
          <circle cx="12" cy="10.5" r="3.2" />
          <path d="M8.8 10.5H15.2" />
          <path d="M9.5 16.5H14.5" />
        </g>
      );
    }

    // G. Taxi
    if (key.includes("taxi") || key.includes("taksi")) {
      return (
        <g>
          <path d="M10 6.2H14V8H10V6.2Z" fill={softFill} />
          <path
            d="M5.5 13.5L7.3 9.2C7.7 8.4 8.5 7.8 9.4 7.8H14.6C15.5 7.8 16.3 8.4 16.7 9.2L18.5 13.5"
            fill={softFill}
          />
          <rect x="3.5" y="13.5" width="17" height="4.2" rx="1.6" fill={softFill} />
          <circle cx="7.5" cy="17.8" r="1.8" fill={softFill} />
          <circle cx="16.5" cy="17.8" r="1.8" fill={softFill} />
        </g>
      );
    }

    // 1. Historic Routes & Fast-Track Walks — Minimal Architectural Dome & Arch
    if (
      key === "cat-2" ||
      key.includes("tarih") ||
      key.includes("history") ||
      key.includes("historic") ||
      key.includes("müze")
    ) {
      return (
        <g>
          <path
            d="M5 17.5C5 13.08 8.13 9.5 12 9.5C15.87 9.5 19 13.08 19 17.5H5Z"
            fill={softFill}
          />
          <path d="M12 6.5V9.5" />
          <path d="M10 17.5V15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15V17.5" />
          <path d="M3.5 17.5H20.5" />
          <path d="M6.5 20H17.5" />
        </g>
      );
    }

    // 2. Culinary & Street Food Trails — Minimal Fine-Dining Cloche
    if (
      key === "cat-3" ||
      key.includes("gastro") ||
      key.includes("gurme") ||
      key.includes("culinary") ||
      key.includes("street food")
    ) {
      return (
        <g>
          <path
            d="M4.5 16.5C4.5 12.36 7.86 9 12 9C16.14 9 19.5 12.36 19.5 16.5H4.5Z"
            fill={softFill}
          />
          <circle cx="12" cy="7.2" r="1.4" fill={softFill} />
          <path d="M3 16.5H21" />
          <path d="M6.5 19.2H17.5" />
        </g>
      );
    }

    // 3. Arts & Whirling Dervishes — Minimal Poetic Whirling Cone & Orbital Arc
    if (
      key === "cat-5" ||
      key.includes("sanat") ||
      key.includes("semazen") ||
      key.includes("dervish") ||
      key.includes("arts &")
    ) {
      return (
        <g>
          <path
            d="M12 5.5C12 5.5 9.2 11 6 16.5C8 18 10 18.8 12 18.8C14 18.8 16 18 18 16.5C14.8 11 12 5.5 12 5.5Z"
            fill={softFill}
          />
          <path d="M4.5 16.2C4.5 18.6 7.86 20.2 12 20.2C16.14 20.2 19.5 18.6 19.5 16.2" />
          <circle cx="12" cy="4" r="1" fill={softFill} />
        </g>
      );
    }

    // 4. Curated Artisan & Bazaar Shopping — Minimal Boutique Atelier Tote
    if (
      key === "cat-8" ||
      key.includes("alışveriş") ||
      key.includes("çarşı") ||
      key.includes("shopping") ||
      key.includes("bazaar") ||
      key.includes("artisan")
    ) {
      return (
        <g>
          <path
            d="M6.2 8.5H17.8L18.8 19C18.86 19.6 18.4 20.1 17.8 20.1H6.2C5.6 20.1 5.14 19.6 5.2 19L6.2 8.5Z"
            fill={softFill}
          />
          <path d="M9 10.5V7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V10.5" />
        </g>
      );
    }

    // 5. Bosphorus & Boat Cruises — Minimalist Sail & Calm Horizon
    if (
      key === "cat-1" ||
      key.includes("boğaz") ||
      key.includes("yat") ||
      key.includes("bosphorus") ||
      key.includes("boat") ||
      key.includes("cruise")
    ) {
      return (
        <g>
          <path d="M12 4.5L17.8 13.5H12V4.5Z" fill={softFill} />
          <path d="M12 6.8L7.2 13.5H12V6.8Z" fill={softFill} />
          <path d="M4 16H20L18.2 18.8H5.8L4 16Z" fill={softFill} />
          <path d="M12 4.5V16" />
          <path d="M4.5 21C7 21 8.5 20.2 12 20.2C15.5 20.2 17 21 19.5 21" />
        </g>
      );
    }

    // 6. Traditional Turkish Bath & Hammam Rituals — Serene Spa Lotus
    if (
      key === "cat-4" ||
      key.includes("hamam") ||
      key.includes("hammam") ||
      key.includes("spa") ||
      key.includes("bath")
    ) {
      return (
        <g>
          <path
            d="M12 17.5C8.5 17.5 5.2 15 4.5 10.8C7.2 11 9.4 12.6 10.5 15.2"
            fill={softFill}
          />
          <path
            d="M12 17.5C15.5 17.5 18.8 15 19.5 10.8C16.8 11 14.6 12.6 13.5 15.2"
            fill={softFill}
          />
          <path
            d="M12 5C12 5 8.8 9.2 8.8 13C8.8 15.5 10.2 17.5 12 17.5C13.8 17.5 15.2 15.5 15.2 13C15.2 9.2 12 5 12 5Z"
            fill={softFill}
          />
          <path d="M7 20H17" />
        </g>
      );
    }

    // 7. Rooftop Photography & Costumes — Minimalist Rangefinder Camera
    if (
      key === "cat-6" ||
      key.includes("fotoğraf") ||
      key.includes("kostüm") ||
      key.includes("photo") ||
      key.includes("rooftop")
    ) {
      return (
        <g>
          <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" fill={softFill} />
          <path d="M8.5 7.5L9.8 5.2H14.2L15.5 7.5" fill={softFill} />
          <circle cx="12" cy="13.5" r="3.4" />
          <circle cx="16.8" cy="10.2" r="0.6" fill={strokeColor} stroke="none" />
        </g>
      );
    }

    // 8. Private VIP Airport Transfers — Streamlined Executive Saloon Silhouette
    if (key === "cat-7" || key.includes("transfer") || key.includes("vip") || key.includes("airport")) {
      return (
        <g>
          <path
            d="M5.5 13.5L7.3 9.2C7.7 8.4 8.5 7.8 9.4 7.8H14.6C15.5 7.8 16.3 8.4 16.7 9.2L18.5 13.5"
            fill={softFill}
          />
          <rect x="3.5" y="13.5" width="17" height="4.2" rx="1.6" fill={softFill} />
          <circle cx="7.5" cy="17.8" r="1.8" fill={softFill} />
          <circle cx="16.5" cy="17.8" r="1.8" fill={softFill} />
        </g>
      );
    }

    // 9. Comus Curated Dining Guide — Minimalist Crystal Stemware Coupe
    if (
      key === "cat-9" ||
      key.includes("breakfast") ||
      key.includes("catering") ||
      key.includes("restoran") ||
      key.includes("restaurant") ||
      key.includes("dining")
    ) {
      return (
        <g>
          <path
            d="M7.5 4.5H16.5L15.8 9.2C15.4 11.9 13.85 13.8 12 13.8C10.15 13.8 8.6 11.9 8.2 9.2L7.5 4.5Z"
            fill={softFill}
          />
          <path d="M8.1 8.5H15.9" />
          <path d="M12 13.8V19.5" />
          <path d="M8.5 19.5H15.5" />
        </g>
      );
    }

    // 10. In-Stay Express Laundry & Garment Care — Minimalist Valet Hanger
    return (
      <g>
        <path d="M12 7.2C12 6.26 12.76 5.5 13.7 5.5C14.64 5.5 15.4 6.26 15.4 7.2C15.4 8 14.8 8.5 13.8 9L12 9.8V11.2" />
        <path
          d="M3.8 16.2L12 11.2L20.2 16.2C20.8 16.56 20.55 17.5 19.85 17.5H4.15C3.45 17.5 3.2 16.56 3.8 16.2Z"
          fill={softFill}
        />
        <path d="M8.5 17.5H15.5" />
      </g>
    );
  };

  return (
    <svg
      viewBox="2.2 2.2 19.6 19.6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {renderPaths()}
      </g>
    </svg>
  );
}
