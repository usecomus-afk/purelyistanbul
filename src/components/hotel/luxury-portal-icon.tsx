"use client";

import React, { useId } from 'react';

interface LuxuryPortalIconProps {
  id: string;
  className?: string;
}

/**
 * European Luxury 3D Metallic Gold/Bronze (#8E7252) & Dark Charcoal (#1D2025)
 * Fine Line-Art Vector Icons for the Hotel Management Portal (Login & 8 Menu Modules).
 * Matches LuxuryServiceIcon on the Hotel page 1:1.
 */
export function LuxuryPortalIcon({ id, className = "w-[52px] h-[52px] sm:w-[58px] sm:h-[58px]" }: LuxuryPortalIconProps) {
  const uid = useId().replace(/:/g, '');
  const strokeGradId = `portal-stroke-${uid}`;
  const bronzeGradId = `portal-bronze-${uid}`;
  const handleFillId = `portal-handle-${uid}`;
  const champagneFillId = `portal-champagne-${uid}`;
  const shadowFilterId = `portal-shadow-${uid}`;

  const key = (id || '').trim().toLowerCase();

  const renderPaths = () => {
    switch (key) {
      case 'requests':
        // Canlı Oda Talepleri — Reception Service Bell with Stepped Base & Radiating Chime Waves
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Bell Dome Champagne Fill */}
            <path
              d="M15 41C15 30.5 22.4 22.5 32 22.5C41.6 22.5 49 30.5 49 41H15Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            {/* Inner Specular Highlight Curve */}
            <path
              d="M20.5 36.5C21.6 31.2 25.4 27.2 30.2 26.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Top Ring Button & Stem */}
            <line
              x1="32"
              y1="18.2"
              x2="32"
              y2="22.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
              strokeLinecap="round"
            />
            <rect
              x="28.2"
              y="15.8"
              width="7.6"
              height="2.6"
              rx="1.3"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
            />
            {/* Stepped Reception Plinth Base */}
            <rect
              x="12.5"
              y="41"
              width="39"
              height="3.6"
              rx="1.5"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.6"
            />
            <rect
              x="10"
              y="44.6"
              width="44"
              height="3.4"
              rx="1.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
            />
            {/* Radiating Live Notification Waves (Left & Right) */}
            <path
              d="M16.5 19.5C13.8 22 12.2 25.4 11.8 29"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M47.5 19.5C50.2 22 51.8 25.4 52.2 29"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* 4-Point Luxury Star Sparkle at Top Right */}
            <path
              d="M46 11.5L47 14.3L49.8 15.3L47 16.3L46 19.1L45 16.3L42.2 15.3L45 14.3L46 11.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'services':
        // Otel İçi Hizmetler & Menü Yönetimi — Leather Menu Folio & Domed Cloche with Control Sliders
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Menu Folio Back Cover */}
            <rect
              x="12"
              y="12.5"
              width="28"
              height="37"
              rx="3"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
            />
            {/* Spine Binding Line */}
            <line
              x1="16.5"
              y1="13"
              x2="16.5"
              y2="49"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
            />
            {/* Menu Typography Lines & Sliders */}
            <line x1="20.5" y1="19.5" x2="34.5" y2="19.5" stroke={`url(#${strokeGradId})`} strokeWidth="1.55" strokeLinecap="round" />
            <circle cx="29.5" cy="19.5" r="2" fill={`url(#${handleFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.3" />
            <line x1="20.5" y1="25.5" x2="34.5" y2="25.5" stroke={`url(#${strokeGradId})`} strokeWidth="1.55" strokeLinecap="round" />
            <circle cx="24.5" cy="25.5" r="2" fill={`url(#${handleFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.3" />
            <line x1="20.5" y1="31.5" x2="31.5" y2="31.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.45" strokeLinecap="round" />

            {/* Overlapping Domed Room-Service Cloche on Bottom Right */}
            <path
              d="M27 46.5C27 39.6 32.6 34 39.5 34C46.4 34 52 39.6 52 46.5H27Z"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            {/* Cloche Knob */}
            <circle
              cx="39.5"
              cy="31.8"
              r="2"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
            />
            {/* Cloche Platter Base */}
            <rect
              x="25"
              y="46.5"
              width="29"
              height="3.2"
              rx="1.4"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
            />
          </g>
        );

      case 'rooms':
        // Oda Panosu — Architectural Hotel Room Door & Vintage Brass Key
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Grand Hotel Room Door Frame */}
            <rect
              x="12"
              y="12"
              width="26"
              height="40"
              rx="2.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
            />
            {/* Upper Recessed Moulding Panel */}
            <rect
              x="16"
              y="16"
              width="18"
              height="14"
              rx="1.2"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
            />
            {/* Room Number Plaque Inside Panel */}
            <line x1="21.5" y1="23" x2="28.5" y2="23" stroke={`url(#${strokeGradId})`} strokeWidth="1.6" strokeLinecap="round" />
            {/* Lower Recessed Moulding Panel */}
            <rect
              x="16"
              y="34"
              width="18"
              height="13.5"
              rx="1.2"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
            />
            {/* Door Handle */}
            <circle cx="31.5" cy="32" r="1.4" fill={`url(#${handleFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.2" />

            {/* Ornate Vintage Hotel Key on Right */}
            <circle
              cx="46.5"
              cy="21.5"
              r="6.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />
            <circle
              cx="46.5"
              cy="21.5"
              r="2.6"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.35"
            />
            {/* Key Shaft & Bit Teeth */}
            <path
              d="M46.5 28V48.5M46.5 42.5H51.5M46.5 46.5H50.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </g>
        );

      case 'channels':
        // iCal & OTA Kanalları — Synchronized Calendar & Global OTA Network Ring
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Calendar Card */}
            <rect
              x="12"
              y="15"
              width="32"
              height="31"
              rx="3.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
            />
            {/* Calendar Header Bar */}
            <path
              d="M12 22.5H44"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
            />
            {/* Top Binder Rings */}
            <line x1="20" y1="11.5" x2="20" y2="17.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.75" strokeLinecap="round" />
            <line x1="36" y1="11.5" x2="36" y2="17.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.75" strokeLinecap="round" />
            {/* Calendar Date Grid Dots */}
            <rect x="17" y="27" width="4" height="3.5" rx="0.8" fill={`url(#${handleFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.2" />
            <rect x="25" y="27" width="4" height="3.5" rx="0.8" fill="#FAF7F1" stroke={`url(#${strokeGradId})`} strokeWidth="1.2" />
            <rect x="17" y="34" width="4" height="3.5" rx="0.8" fill="#FAF7F1" stroke={`url(#${strokeGradId})`} strokeWidth="1.2" />
            <rect x="25" y="34" width="4" height="3.5" rx="0.8" fill={`url(#${handleFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.2" />

            {/* 2-Way Sync Badge Circle on Bottom-Right */}
            <circle
              cx="42.5"
              cy="41.5"
              r="10.5"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />
            {/* Bidirectional Sync Arrows Inside Badge */}
            <path
              d="M37.8 39.5C38.6 36.8 41.3 35.4 44.2 36.2L46.5 37.2M46.5 37.2V34.2M46.5 37.2H43.6"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M47.2 43.5C46.4 46.2 43.7 47.6 40.8 46.8L38.5 45.8M38.5 45.8V48.8M38.5 45.8H41.4"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'qr-generator':
        // Oda QR Kodları — Luxury Tabletop Standee with Precision QR Matrix
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Standee Acrylic / Brass Frame */}
            <rect
              x="14"
              y="11.5"
              width="36"
              height="36"
              rx="4"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
            />
            {/* Tabletop Pedestal Base */}
            <path
              d="M22 47.5L19.5 52.5H44.5L42 47.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinejoin="round"
            />
            {/* QR Top-Left Finder Pattern */}
            <rect x="19" y="16.5" width="9.5" height="9.5" rx="1.5" fill="#FAF7F1" stroke={`url(#${strokeGradId})`} strokeWidth="1.55" />
            <rect x="22" y="19.5" width="3.5" height="3.5" rx="0.5" fill={`url(#${handleFillId})`} />
            {/* QR Top-Right Finder Pattern */}
            <rect x="35.5" y="16.5" width="9.5" height="9.5" rx="1.5" fill="#FAF7F1" stroke={`url(#${strokeGradId})`} strokeWidth="1.55" />
            <rect x="38.5" y="19.5" width="3.5" height="3.5" rx="0.5" fill={`url(#${handleFillId})`} />
            {/* QR Bottom-Left Finder Pattern */}
            <rect x="19" y="33" width="9.5" height="9.5" rx="1.5" fill="#FAF7F1" stroke={`url(#${strokeGradId})`} strokeWidth="1.55" />
            <rect x="22" y="36" width="3.5" height="3.5" rx="0.5" fill={`url(#${handleFillId})`} />
            {/* QR Bottom-Right Data Matrix Modules */}
            <rect x="35.5" y="33" width="4" height="4" rx="0.7" fill={`url(#${handleFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.3" />
            <path
              d="M42.5 33V37.5H39.5M35.5 41.5H40.5M44.5 40V42.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Horizontal Gold Laser Scan Line */}
            <line
              x1="16.5"
              y1="29.5"
              x2="47.5"
              y2="29.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="2.5 2.5"
            />
          </g>
        );

      case 'profile':
        // Otel & Profil Ayarları — Heritage Hotel Architecture with Precision Brass Cogwheel
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Left Wing */}
            <path
              d="M11 47V25.5C11 24.7 11.7 24 12.5 24H19V47"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
              strokeLinejoin="round"
            />
            {/* Central Heritage Tower */}
            <path
              d="M19 47V16.5C19 15.7 19.7 15 20.5 15H37.5C38.3 15 39 15.7 39 16.5V47"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            {/* Tower Roof Crown Pediment */}
            <path
              d="M22 15V12H36V15"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Hotel Windows */}
            <rect x="23" y="19.5" width="3.5" height="3.5" rx="0.6" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
            <rect x="31.5" y="19.5" width="3.5" height="3.5" rx="0.6" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
            <rect x="23" y="26.5" width="3.5" height="3.5" rx="0.6" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
            <rect x="31.5" y="26.5" width="3.5" height="3.5" rx="0.6" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
            {/* Arched Grand Entrance */}
            <path
              d="M25.5 47V38.5C25.5 36.6 27.1 35 29 35C30.9 35 32.5 36.6 32.5 38.5V47"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.5"
            />
            {/* Ground Plinth */}
            <line x1="9" y1="47" x2="38" y2="47" stroke={`url(#${strokeGradId})`} strokeWidth="1.7" strokeLinecap="round" />

            {/* Precision Settings Cogwheel Badge on Bottom Right */}
            <circle
              cx="44.5"
              cy="40.5"
              r="7.2"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.6"
            />
            <circle
              cx="44.5"
              cy="40.5"
              r="3"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.4"
            />
            <path
              d="M44.5 31.2V33.2M44.5 47.8V49.8M35.2 40.5H37.2M51.8 40.5H53.8M37.9 33.9L39.3 35.3M49.7 45.7L51.1 47.1M51.1 33.9L49.7 35.3M39.3 45.7L37.9 47.1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
              strokeLinecap="round"
            />
          </g>
        );

      case 'kbs':
        // Online Check-in & KBS — Biometric Passport Booklet with OCR Scan Brackets
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* OCR Corner Scan Brackets */}
            <path
              d="M11 19V13.5C11 12.1 12.1 11 13.5 11H19M45 11H50.5C51.9 11 53 12.1 53 13.5V19M11 45V50.5C11 51.9 12.1 53 13.5 53H19M45 53H50.5C51.9 53 53 51.9 53 50.5V45"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Passport Booklet Cover */}
            <rect
              x="17.5"
              y="14.5"
              width="29"
              height="35"
              rx="3"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
            />
            {/* Passport Globe Emblem */}
            <circle
              cx="32"
              cy="26.5"
              r="6.5"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />
            <ellipse
              cx="32"
              cy="26.5"
              rx="3.2"
              ry="6.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.3"
            />
            <line x1="25.8" y1="26.5" x2="38.2" y2="26.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.3" />
            {/* Biometric e-Passport Chip Symbol */}
            <rect
              x="27.5"
              y="37.5"
              width="9"
              height="5.5"
              rx="1.2"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.4"
            />
            <circle cx="32" cy="40.25" r="1.3" fill="#FAF7F1" />
            {/* MRZ Machine Readable Lines */}
            <line x1="22" y1="45.8" x2="42" y2="45.8" stroke={`url(#${strokeGradId})`} strokeWidth="1.35" strokeLinecap="round" strokeDasharray="2 2.2" />
          </g>
        );

      case 'reports':
        // Raporlar — Executive 3D Bar Chart, Ascending Gold Trend Line & Pie Dial
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Analytics Frame Base Line */}
            <path
              d="M11 49.5H53"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            {/* 3 Ascending 3D Columns */}
            <rect
              x="15"
              y="36.5"
              width="7.5"
              height="13"
              rx="1.5"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
            />
            <rect
              x="27.5"
              y="28.5"
              width="7.5"
              height="21"
              rx="1.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.6"
            />
            <rect
              x="40"
              y="20.5"
              width="7.5"
              height="29"
              rx="1.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />
            {/* Rising Trend Curve & Nodes */}
            <path
              d="M16.5 29.5L27 21.5L35 23.5L45.5 13.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40.5 13.5H45.5V18.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Mini Comus AI Pie Chart Medallion on Top Left */}
            <circle
              cx="18.5"
              cy="17.5"
              r="5.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
            />
            <path
              d="M18.5 12V17.5H24"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'login-crest':
      default:
        // Otel Yönetim Girişi — Luxury Shield Crest with Key & Crown Star
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Heritage Shield Outline */}
            <path
              d="M32 11L49 17.2V31.5C49 42.2 41.6 49.8 32 53C22.4 49.8 15 42.2 15 31.5V17.2L32 11Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            {/* Inner Gold Filigree Shield Border */}
            <path
              d="M32 15L44.8 19.8V31.2C44.8 39.4 39.2 45.5 32 48.2C24.8 45.5 19.2 39.4 19.2 31.2V19.8L32 15Z"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            {/* Vertical Master Key Inside Shield */}
            <circle
              cx="32"
              cy="25.5"
              r="4.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
            />
            <circle cx="32" cy="25.5" r="1.6" fill="#FAF7F1" />
            <path
              d="M32 30V42.5M32 37.5H36M32 40.8H35"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          <linearGradient id={strokeGradId} x1="12" y1="24" x2="52" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1D2025" />
            <stop offset="48%" stopColor="#3B352F" />
            <stop offset="100%" stopColor="#8E7252" />
          </linearGradient>

          <linearGradient id={bronzeGradId} x1="20" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9C7F5E" />
            <stop offset="50%" stopColor="#7E6345" />
            <stop offset="100%" stopColor="#5E4730" />
          </linearGradient>

          <linearGradient id={handleFillId} x1="20" y1="14" x2="46" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5EBDD" />
            <stop offset="45%" stopColor="#C4A684" />
            <stop offset="100%" stopColor="#6D5135" />
          </linearGradient>

          <linearGradient id={champagneFillId} x1="14" y1="14" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCFBF8" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#F1EAE0" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#E2D5C3" stopOpacity="0.82" />
          </linearGradient>

          <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#3A2D1E" floodOpacity="0.16" />
            <feDropShadow dx="-0.5" dy="-0.5" stdDeviation="0.3" floodColor="#FFFFFF" floodOpacity="0.9" />
          </filter>
        </defs>

        {renderPaths()}
      </svg>
    </div>
  );
}
