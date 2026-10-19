"use client";

import React from "react";

interface MarketplaceCategoryIconProps {
  categoryKey: string;
  className?: string;
}

/**
 * Minimal, architectural, eye-soothing monoline category icons for the Web Marketplace.
 * - Clean 24x24 geometry with generous negative space
 * - Soft antique-gold stroke (#8F6F32) with crisp white interior fill (#FFFFFF)
 * - Zero cartoon clutter, zero heavy drop shadows
 */
export function MarketplaceCategoryIcon({
  categoryKey,
  className = "w-9 h-9 sm:w-10 sm:h-10",
}: MarketplaceCategoryIconProps) {
  const key = (categoryKey || "").toLowerCase();
  const strokeColor = "#8F6F32";
  const fillWhite = "#FFFFFF";

  const renderPaths = () => {
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
            fill={fillWhite}
          />
          <path d="M12 6.5V9.5" />
          <path d="M5 17.5C5 13.08 8.13 9.5 12 9.5C15.87 9.5 19 13.08 19 17.5" />
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
            fill={fillWhite}
          />
          <circle cx="12" cy="7.2" r="1.4" fill={fillWhite} />
          <path d="M4.5 16.5C4.5 12.36 7.86 9 12 9C16.14 9 19.5 12.36 19.5 16.5" />
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
            fill={fillWhite}
          />
          <path d="M4.5 16.2C4.5 18.6 7.86 20.2 12 20.2C16.14 20.2 19.5 18.6 19.5 16.2" />
          <circle cx="12" cy="4" r="1" fill={fillWhite} />
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
            fill={fillWhite}
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
          <path d="M12 4.5L17.8 13.5H12V4.5Z" fill={fillWhite} />
          <path d="M12 6.8L7.2 13.5H12V6.8Z" fill={fillWhite} />
          <path
            d="M4 16H20L18.2 18.8H5.8L4 16Z"
            fill={fillWhite}
          />
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
            fill={fillWhite}
          />
          <path
            d="M12 17.5C15.5 17.5 18.8 15 19.5 10.8C16.8 11 14.6 12.6 13.5 15.2"
            fill={fillWhite}
          />
          <path
            d="M12 5C12 5 8.8 9.2 8.8 13C8.8 15.5 10.2 17.5 12 17.5C13.8 17.5 15.2 15.5 15.2 13C15.2 9.2 12 5 12 5Z"
            fill={fillWhite}
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
          <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" fill={fillWhite} />
          <path d="M8.5 7.5L9.8 5.2H14.2L15.5 7.5" fill={fillWhite} />
          <circle cx="12" cy="13.5" r="3.4" fill={fillWhite} />
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
            fill={fillWhite}
          />
          <rect x="3.5" y="13.5" width="17" height="4.2" rx="1.6" fill={fillWhite} />
          <circle cx="7.5" cy="17.8" r="1.8" fill={fillWhite} />
          <circle cx="16.5" cy="17.8" r="1.8" fill={fillWhite} />
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
            fill={fillWhite}
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
          fill={fillWhite}
        />
        <path d="M8.5 17.5H15.5" />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke={strokeColor}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {renderPaths()}
      </g>
    </svg>
  );
}
