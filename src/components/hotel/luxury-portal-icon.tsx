"use client";

import React from "react";

interface LuxuryPortalIconProps {
  id: string;
  className?: string;
}

/**
 * Minimal, refined, modern monoline icons for the Hotel Management Portal.
 * - Clean 24x24 architectural geometry
 * - Calm antique-bronze stroke (#7D5E28) with whisper-soft warm ivory tint
 * - Subtle minimalist 3D: soft gradient volume, thin extrusion offset and gentle drop shadow
 */
export function LuxuryPortalIcon({
  id,
  className = "w-11 h-11 sm:w-12 sm:h-12",
}: LuxuryPortalIconProps) {
  const key = (id || "").trim().toLowerCase();
  const strokeColor = "#7D5E28";
  const uid = React.useId().replace(/:/g, "");
  const softFill = `url(#${uid}-fill)`;

  const renderPaths = () => {
    switch (key) {
      case "requests":
        return (
          <g>
            <path
              d="M5.5 16.5C5.5 12.91 8.41 10 12 10C15.59 10 18.5 12.91 18.5 16.5H5.5Z"
              fill={softFill}
            />
            <path d="M10.5 7.5H13.5M12 7.5V10" />
            <path d="M4 16.5H20M6 19H18" />
          </g>
        );

      case "services":
        return (
          <g>
            <rect x="4.5" y="4" width="12" height="16" rx="2" fill={softFill} />
            <path d="M8 8.5H13M8 12H13M8 15.5H11" />
            <circle cx="16.5" cy="15.5" r="3.2" fill="#FAF6EE" />
            <path d="M16.5 14.3V16.7M15.3 15.5H17.7" />
          </g>
        );

      case "rooms":
        return (
          <g>
            <rect x="5.5" y="4" width="11" height="16" rx="1.5" fill={softFill} />
            <circle cx="14" cy="12" r="0.8" fill={strokeColor} stroke="none" />
            <path d="M3.5 20H18.5" />
          </g>
        );

      case "channels":
        return (
          <g>
            <rect x="4" y="5.5" width="16" height="14" rx="2.2" fill={softFill} />
            <path d="M8.5 3.8V6.8M15.5 3.8V6.8M4 9.5H20" />
            <path d="M9.5 14.5L11.2 16.2L14.8 12.6" />
          </g>
        );

      case "qr-generator":
        return (
          <g>
            <rect x="4.5" y="4.5" width="6" height="6" rx="1" fill={softFill} />
            <rect x="13.5" y="4.5" width="6" height="6" rx="1" fill={softFill} />
            <rect x="4.5" y="13.5" width="6" height="6" rx="1" fill={softFill} />
            <path d="M13.5 13.5H16.5V16.5H13.5V13.5ZM16.5 16.5H19.5V19.5H16.5V16.5ZM19.5 13.5V14.5M13.5 19.5H14.5" />
          </g>
        );

      case "profile":
        return (
          <g>
            <rect x="6" y="4.5" width="12" height="15" rx="1.8" fill={softFill} />
            <path d="M9.5 8.5H14.5M9.5 12H14.5" />
            <path d="M10.5 19.5V16C10.5 15.17 11.17 14.5 12 14.5C12.83 14.5 13.5 15.17 13.5 16V19.5" />
            <path d="M4 19.5H20" />
          </g>
        );

      case "kbs":
        return (
          <g>
            <rect x="5.5" y="3.8" width="13" height="16.4" rx="2" fill={softFill} />
            <circle cx="12" cy="10.5" r="3.2" />
            <path d="M8.8 10.5H15.2M9.5 16.5H14.5" />
          </g>
        );

      case "reports":
        return (
          <g>
            <path d="M4 19.5H20" />
            <rect x="6" y="13" width="3" height="6.5" rx="0.8" fill={softFill} />
            <rect x="10.5" y="9.5" width="3" height="10" rx="0.8" fill={softFill} />
            <rect x="15" y="6" width="3" height="13.5" rx="0.8" fill={softFill} />
          </g>
        );

      case "login-crest":
      default:
        return (
          <g>
            <path
              d="M12 3.8L5 6.8V12.2C5 16.8 8 20.1 12 21.4C16 20.1 19 16.8 19 12.2V6.8L12 3.8Z"
              fill={softFill}
            />
            <circle cx="12" cy="10.5" r="2" />
            <path d="M12 12.5V16.5M12 15H13.8" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-fill`} gradientUnits="userSpaceOnUse" x1="4" y1="3" x2="20" y2="21">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="0.55" stopColor="#F7ECD3" stopOpacity="0.92" />
            <stop offset="1" stopColor="#DFC187" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`${uid}-stroke`} gradientUnits="userSpaceOnUse" x1="4" y1="3" x2="20" y2="21">
            <stop offset="0" stopColor="#B08A45" />
            <stop offset="1" stopColor="#6B4E1F" />
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="170%" height="180%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.65" floodColor="#5A3F14" floodOpacity="0.34" />
          </filter>
        </defs>
        <g
          transform="translate(0.45 0.7)"
          stroke="#8A6A32"
          strokeOpacity="0.42"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        >
          {renderPaths()}
        </g>
        <g
          filter={`url(#${uid}-shadow)`}
          stroke={`url(#${uid}-stroke)`}
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {renderPaths()}
        </g>
      </svg>
    </div>
  );
}
