"use client";

import React from "react";

interface LuxuryServiceIconProps {
  serviceKey: string;
  className?: string;
}

/**
 * Minimal, refined, modern monoline icons for In-Room Services (Konaklama).
 * - Clean 24x24 architectural geometry
 * - Calm antique-bronze stroke (#7D5E28) with whisper-soft warm ivory tint
 * - Subtle minimalist 3D: soft gradient volume, thin extrusion offset and gentle drop shadow
 */
export function LuxuryServiceIcon({
  serviceKey,
  className = "w-[62px] h-[62px] sm:w-[74px] sm:h-[74px]",
}: LuxuryServiceIconProps) {
  const normalizedKey = (serviceKey || "").trim();
  const strokeColor = "#7D5E28";
  const uid = React.useId().replace(/:/g, "");
  const softFill = `url(#${uid}-fill)`;

  const renderPaths = () => {
    switch (normalizedKey) {
      case "roomservice":
        return (
          <g>
            <path
              d="M4.5 16C4.5 11.86 7.86 8.5 12 8.5C16.14 8.5 19.5 11.86 19.5 16H4.5Z"
              fill={softFill}
            />
            <circle cx="12" cy="6.7" r="1.4" fill={softFill} />
            <path d="M3 16H21" />
            <path d="M6.5 18.8H17.5" />
          </g>
        );

      case "dnd":
        return (
          <g>
            <path
              d="M8 8.5C8 6.29 9.79 4.5 12 4.5C14.21 4.5 16 6.29 16 8.5V18.2C16 19.2 15.2 20 14.2 20H9.8C8.8 20 8 19.2 8 18.2V8.5Z"
              fill={softFill}
            />
            <circle cx="12" cy="8.5" r="1.6" />
            <path d="M10 15.2H14" />
          </g>
        );

      case "cleaning":
        return (
          <g>
            <path d="M5.5 11.5V7.5C5.5 6.4 6.4 5.5 7.5 5.5H16.5C17.6 5.5 18.5 6.4 18.5 7.5V11.5" />
            <path
              d="M4 17.5V13.5C4 12.4 4.9 11.5 6 11.5H18C19.1 11.5 20 12.4 20 13.5V17.5H4Z"
              fill={softFill}
            />
            <path d="M8 11.5V9.8C8 9.25 8.45 8.8 9 8.8H11C11.55 8.8 12 9.25 12 9.8V11.5" />
            <path d="M12 11.5V9.8C12 9.25 12.45 8.8 13 8.8H15C15.55 8.8 16 9.25 16 9.8V11.5" />
            <path d="M3 17.5H21" />
            <path d="M5.5 17.5V19.5M18.5 17.5V19.5" />
          </g>
        );

      case "linens":
        return (
          <g>
            <path d="M12 5L20 9L12 13L4 9L12 5Z" fill={softFill} />
            <path d="M4 13L12 17L20 13" />
            <path d="M4 17L12 21L20 17" />
          </g>
        );

      case "towels":
        return (
          <g>
            <path d="M4.5 7H19.5" />
            <path
              d="M7.5 7V17C7.5 18.1 8.4 19 9.5 19H14.5C15.6 19 16.5 18.1 16.5 17V7H7.5Z"
              fill={softFill}
            />
            <path d="M7.5 14.5H16.5" />
          </g>
        );

      case "pillows":
        return (
          <g>
            <rect x="4" y="6.5" width="16" height="11" rx="3.2" fill={softFill} />
            <rect x="6.8" y="9.1" width="10.4" height="5.8" rx="1.8" />
          </g>
        );

      case "toiletries":
        return (
          <g>
            <rect x="7" y="8.5" width="10" height="11.5" rx="2.2" fill={softFill} />
            <path d="M10 8.5V6H14V8.5" />
            <path d="M12 6V4" />
            <path d="M9.5 4H14.8" />
            <path d="M7 13.5H17" />
          </g>
        );

      case "hygiene":
        return (
          <g>
            <rect x="4.5" y="7.5" width="15" height="11.5" rx="2.8" fill={softFill} />
            <path d="M4.5 11.5H19.5" />
            <path d="M9.5 7.5V5.8C9.5 5.1 10.1 4.5 10.8 4.5H13.2C13.9 4.5 14.5 5.1 14.5 5.8V7.5" />
            <path d="M12 10.5V12.8" />
          </g>
        );

      case "minibar":
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

      case "safe":
        return (
          <g>
            <rect x="4" y="5.5" width="16" height="13" rx="2.4" fill={softFill} />
            <circle cx="10.5" cy="12" r="2.6" />
            <path d="M15.2 10.2H16.8M15.2 13.8H16.8" />
            <path d="M7 18.5V20M17 18.5V20" />
          </g>
        );

      case "laundry":
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

      case "breakfast":
        return (
          <g>
            <path
              d="M5.5 8.5H15.5V13.5C15.5 16.26 13.26 18.5 10.5 18.5C7.74 18.5 5.5 16.26 5.5 13.5V8.5Z"
              fill={softFill}
            />
            <path d="M15.5 10H17.2C18.47 10 19.5 11.03 19.5 12.3C19.5 13.57 18.47 14.6 17.2 14.6H15.5" />
            <path d="M4 18.5H17" />
            <path d="M8.8 5.2V6.5M12.2 5.2V6.5" />
          </g>
        );

      case "taxi":
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

      case "technical":
        return (
          <g>
            <path d="M4 8.5H20" />
            <circle cx="9" cy="8.5" r="2.2" fill="#FAF6EE" />
            <path d="M4 15.5H20" />
            <circle cx="15" cy="15.5" r="2.2" fill="#FAF6EE" />
          </g>
        );

      case "lateCheckout":
        return (
          <g>
            <circle cx="12" cy="12" r="8" fill={softFill} />
            <path d="M12 7.8V12L14.8 13.8" />
          </g>
        );

      case "extendStay":
        return (
          <g>
            <rect x="4" y="5.5" width="16" height="14.5" rx="2.4" fill={softFill} />
            <path d="M8.5 3.8V6.8M15.5 3.8V6.8" />
            <path d="M4 9.8H20" />
            <path d="M12 12.6V16.8M9.9 14.7H14.1" />
          </g>
        );

      default:
        return (
          <g>
            <path
              d="M5.5 16.5C5.5 12.91 8.41 10 12 10C15.59 10 18.5 12.91 18.5 16.5H5.5Z"
              fill={softFill}
            />
            <path d="M10.5 7.5H13.5M12 7.5V10M4 19H20" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="2.2 2.2 19.6 19.6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-fill`} gradientUnits="userSpaceOnUse" x1="4" y1="3" x2="20" y2="21">
            <stop offset="0" stopColor="#F5F2EB" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#E5C358" stopOpacity="0.85" />
            <stop offset="1" stopColor="#D4AF37" stopOpacity="0.80" />
          </linearGradient>
          <linearGradient id={`${uid}-stroke`} gradientUnits="userSpaceOnUse" x1="4" y1="3" x2="20" y2="21">
            <stop offset="0" stopColor="#E5C358" />
            <stop offset="1" stopColor="#B89324" />
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="170%" height="180%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.65" floodColor="#5A3F14" floodOpacity="0.34" />
          </filter>
        </defs>
        <g
          transform="translate(0.45 0.7)"
          stroke="#8A6A32"
          strokeOpacity="0.42"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        >
          {renderPaths()}
        </g>
        <g
          filter={`url(#${uid}-shadow)`}
          stroke={`url(#${uid}-stroke)`}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {renderPaths()}
        </g>
      </svg>
    </div>
  );
}
