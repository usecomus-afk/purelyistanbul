"use client";

import React, { useId } from 'react';

interface LuxuryServiceIconProps {
  serviceKey: string;
  className?: string;
}

/**
 * High-end European luxury minimalist line-art icons with a subtle 3D metallic
 * embossed finish in soft brushed gold/bronze and dark charcoal/obsidian.
 */
export function LuxuryServiceIcon({ serviceKey, className = "w-14 h-14 sm:w-16 sm:h-16" }: LuxuryServiceIconProps) {
  const uid = useId().replace(/:/g, '');
  const darkGradId = `lux-dark-${uid}`;
  const goldGradId = `lux-gold-${uid}`;
  const softGoldFillId = `lux-gold-fill-${uid}`;
  const embossFilterId = `lux-emboss-${uid}`;

  const normalizedKey = (serviceKey || '').trim();

  const renderPaths = () => {
    switch (normalizedKey) {
      case 'roomservice':
        // Elegant serving cart with domed cloche, fine wheels, poised handle & bottle
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Subtle warm metallic glow under cloche */}
            <path
              d="M17 31C17 24.9249 21.9249 20 28 20C34.0751 20 39 24.9249 39 31H17Z"
              fill={`url(#${softGoldFillId})`}
            />
            {/* Domed Cloche (Gold/Bronze) */}
            <path
              d="M17 31C17 24.9249 21.9249 20 28 20C34.0751 20 39 24.9249 39 31"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Cloche Finial Ring */}
            <circle
              cx="28"
              cy="17.8"
              r="1.8"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
            />
            {/* Cloche Platter Base */}
            <path
              d="M14.5 31H41.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Minimalist Wine / Champagne Bottle beside cloche */}
            <path
              d="M43.5 17.5H45.5V21.5L47.2 24.2V31H41.8V24.2L43.5 21.5V17.5Z"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Trolley Upper & Lower Tiers (Dark Charcoal) */}
            <path
              d="M12 34.5H50"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Draped Linen Valance Curve */}
            <path
              d="M13.5 34.5V39.5C13.5 41.2 15 42.5 16.8 42.5H45.2C47 42.5 48.5 41.2 48.5 39.5V34.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M17 38.5H45"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeDasharray="1 3"
            />
            {/* Trolley Legs & Lower Shelf */}
            <path
              d="M16.5 42.5V49.5M45.5 42.5V49.5M14.5 47H47.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            {/* Poised Curved Push Handle (Gold/Bronze) */}
            <path
              d="M48.5 34.5H51.5C53.4 34.5 55 32.9 55 31C55 29.3 53.7 28 52 28H50.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Precision Spoked Wheels */}
            <circle
              cx="18"
              cy="52.5"
              r="3.8"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.4"
            />
            <circle
              cx="18"
              cy="52.5"
              r="1.3"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
            />
            <circle
              cx="44"
              cy="52.5"
              r="3.8"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.4"
            />
            <circle
              cx="44"
              cy="52.5"
              r="1.3"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
            />
          </g>
        );

      case 'dnd':
        // Door hanger with soft architectural lines, crescent/privacy emblem & tassel
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Soft Gold Fill Inside Hanger Body */}
            <path
              d="M20 27C20 23.6863 22.6863 21 26 21H38C41.3137 21 44 23.6863 44 27V49C44 52.3137 41.3137 55 38 55H26C22.6863 55 20 52.3137 20 49V27Z"
              fill={`url(#${softGoldFillId})`}
            />
            {/* Graceful Hanger Hook & Body (Dark Charcoal) */}
            <path
              d="M32 18.5C28.9 18.5 26.5 16.2 26.5 13.3C26.5 10.4 28.9 8 32 8C35.1 8 37.5 10.4 37.5 13.3C37.5 15.6 36.1 17.5 34 18.2V21"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Door Knob Escutcheon Ring */}
            <circle
              cx="32"
              cy="13.3"
              r="2.1"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.25"
            />
            {/* Outer Door Hanger Tag */}
            <path
              d="M26 21H38C41.3137 21 44 23.6863 44 27V48.5C44 52.0899 41.0899 55 37.5 55H26.5C22.9101 55 20 52.0899 20 48.5V27C20 23.6863 22.6863 21 26 21Z"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinejoin="round"
            />
            {/* Inner Fine Gold Frame Line */}
            <rect
              x="23.2"
              y="24.2"
              width="17.6"
              height="27.6"
              rx="4.2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.05"
            />
            {/* Minimalist Privacy Emblem (Circle + Crescent / Slash) */}
            <circle
              cx="32"
              cy="36.5"
              r="6.2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.4"
            />
            <path
              d="M27.8 40.7L36.2 32.3"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Delicate Typography Lines */}
            <path
              d="M27.5 46.5H36.5M29.5 49H34.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        );

      case 'cleaning':
        // Luxury bed with tailored headboard, crisp linens, and subtle 4-point sparkles
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Subtle Gold Glow on Headboard & Duvet */}
            <rect
              x="14"
              y="35"
              width="36"
              height="11"
              rx="3"
              fill={`url(#${softGoldFillId})`}
            />
            {/* 4-Point Subtle Sparkle Left (Gold) */}
            <path
              d="M18 11.5L19.1 14.9L22.5 16L19.1 17.1L18 20.5L16.9 17.1L13.5 16L16.9 14.9L18 11.5Z"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            {/* 4-Point Subtle Sparkle Top-Right (Gold) */}
            <path
              d="M46.5 9.5L47.4 12.1L50 13L47.4 13.9L46.5 16.5L45.6 13.9L43 13L45.6 12.1L46.5 9.5Z"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Small Center Sparkle */}
            <path
              d="M32 13.5V17.5M30 15.5H34"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Arch Headboard (Dark Charcoal + Gold Trim) */}
            <path
              d="M15 35V24.5C15 22.0147 17.0147 20 19.5 20H44.5C46.9853 20 49 22.0147 49 24.5V35"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Twin Tailored Pillows (Gold/Bronze) */}
            <rect
              x="18.5"
              y="27.5"
              width="11.5"
              height="7.5"
              rx="2.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
            />
            <rect
              x="34"
              y="27.5"
              width="11.5"
              height="7.5"
              rx="2.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
            />
            {/* Mattress & Turned-Down Duvet */}
            <rect
              x="12"
              y="35"
              width="40"
              height="12"
              rx="3"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            {/* Duvet Fold Line */}
            <path
              d="M12.5 39.5H51.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
            />
            {/* Bed Frame Base & Poised Legs */}
            <path
              d="M15.5 47V52.5M48.5 47V52.5M12 49.5H52"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
          </g>
        );

      case 'linens':
      case 'towels':
        // Neatly folded luxury sheets/towels stack with fine hemstitch & botanical crest detail
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Subtle Gold Sheen on Middle Fold */}
            <rect
              x="14"
              y="28.5"
              width="36"
              height="10"
              rx="5"
              fill={`url(#${softGoldFillId})`}
            />
            {/* Delicate Botanical / Laurel Sprig Above Stack (Gold) */}
            <path
              d="M32 19V11.5M32 14.5C29.5 14.5 27.5 12.8 27.5 10.8C29.8 10.8 32 12.3 32 14.5ZM32 14.5C34.5 14.5 36.5 12.8 36.5 10.8C34.2 10.8 32 12.3 32 14.5Z"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Top Folded Linen Layer */}
            <path
              d="M19 19.5H45C47.7614 19.5 50 21.7386 50 24.5C50 27.2614 47.7614 29.5 45 29.5H19C16.2386 29.5 14 27.2614 14 24.5C14 21.7386 16.2386 19.5 19 19.5Z"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            <path
              d="M20 24.5H44"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Middle Folded Linen Layer */}
            <path
              d="M17.5 29.5H46.5C49.5376 29.5 52 31.9624 52 35C52 38.0376 49.5376 40.5 46.5 40.5H17.5C14.4624 40.5 12 38.0376 12 35C12 31.9624 14.4624 29.5 17.5 29.5Z"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.45"
            />
            <path
              d="M18.5 35H45.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            {/* Bottom Folded Linen Layer */}
            <path
              d="M16 40.5H48C51.0376 40.5 53.5 42.9624 53.5 46C53.5 49.0376 51.0376 51.5 48 51.5H16C12.9624 51.5 10.5 49.0376 10.5 46C10.5 42.9624 12.9624 40.5 16 40.5Z"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            <path
              d="M17.5 46H46.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        );

      case 'toiletries':
      case 'hygiene':
        // Minimalist luxury apothecary bottles & flacon on a tray
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Subtle Gold Fill in Tall Bottle Label */}
            <rect
              x="18.5"
              y="31"
              width="11"
              height="12"
              rx="1.5"
              fill={`url(#${softGoldFillId})`}
            />
            {/* Tall Pump Dispenser Bottle (Left - Dark Charcoal + Gold Pump) */}
            <rect
              x="16"
              y="23.5"
              width="16"
              height="26.5"
              rx="3.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            {/* Neck & Pump Nozzle (Gold) */}
            <path
              d="M21.5 23.5V19.5H26.5V23.5M24 19.5V14.5H30.5L32 16"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Minimalist Bottle Label Frame */}
            <rect
              x="19"
              y="30.5"
              width="10"
              height="13"
              rx="1.2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.15"
            />
            {/* Second Parfum / Elixir Flacon (Right) */}
            <rect
              x="36"
              y="29.5"
              width="13"
              height="20.5"
              rx="3"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            {/* Flacon Stopper & Collar (Gold) */}
            <path
              d="M40 29.5V26H45V29.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
            <circle
              cx="42.5"
              cy="23"
              r="2.6"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
            />
            <circle
              cx="42.5"
              cy="39.5"
              r="3.2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.15"
            />
            {/* Presentation Tray Base */}
            <path
              d="M12 53H52"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        );

      case 'technical':
        // Precision interlocking horology gears with a subtle alert emblem
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Primary Gear (Dark Charcoal) */}
            <circle
              cx="27"
              cy="34"
              r="8.5"
              fill={`url(#${softGoldFillId})`}
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            <circle
              cx="27"
              cy="34"
              r="3.6"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.3"
            />
            {/* Precision Gear Teeth */}
            <path
              d="M27 22V25.2M27 42.8V46M15 34H18.2M35.8 34H39M18.5 25.5L20.8 27.8M33.2 40.2L35.5 42.5M35.5 25.5L33.2 27.8M20.8 40.2L18.5 42.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Secondary Upper-Left Gear (Gold/Bronze) */}
            <circle
              cx="42.5"
              cy="20.5"
              r="5.2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
            />
            <circle
              cx="42.5"
              cy="20.5"
              r="1.8"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.2"
            />
            <path
              d="M42.5 13V15M42.5 26V28M35 20.5H37M48 20.5H50M37.2 15.2L38.6 16.6M46.4 24.4L47.8 25.8M47.8 15.2L46.4 16.6M38.6 24.4L37.2 25.8"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            {/* Subtle Diamond/Triangle Alert Emblem (Bottom Right) */}
            <path
              d="M44.5 35.5L52.5 49.5C53.1 50.5 52.4 51.8 51.2 51.8H37.8C36.6 51.8 35.9 50.5 36.5 49.5L44.5 35.5Z"
              fill="#FAF7F2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M44.5 41V45.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <circle
              cx="44.5"
              cy="48.5"
              r="0.85"
              fill="#232528"
            />
          </g>
        );

      case 'lateCheckout':
        // Minimalist horology timepiece / clock with extended check-out arc
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Soft Gold Dial Halo */}
            <circle
              cx="32"
              cy="33.5"
              r="16.5"
              fill={`url(#${softGoldFillId})`}
            />
            {/* Watch Crown & Bow at Top (Gold) */}
            <path
              d="M29.5 13H34.5M32 13V16.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Outer Precision Bezel (Dark Charcoal) */}
            <circle
              cx="32"
              cy="33.5"
              r="17"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            {/* Inner Gold Chapter Ring */}
            <circle
              cx="32"
              cy="33.5"
              r="13.8"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.05"
              strokeDasharray="2 3.5"
            />
            {/* Cardinal Baton Hour Markers */}
            <path
              d="M32 19V21.2M32 45.8V48M17.5 33.5H19.7M44.3 33.5H46.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            {/* Slender Clock Hands (Pointing to 2:00 PM Late Check-out) */}
            <path
              d="M32 23.5V33.5L39.5 29"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="32"
              cy="33.5"
              r="1.6"
              fill="#B89146"
            />
            {/* Subtle Extended Time Arrow Arc (Gold) */}
            <path
              d="M46.5 18.5C50.2 22.1 52.5 27.1 52.5 32.8"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            <path
              d="M50.2 30.8L52.5 33.2L54.8 30.8"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'extendStay':
        // Architectural calendar with a poised feather quill pen
        return (
          <g filter={`url(#${embossFilterId})`}>
            {/* Soft Gold Header Fill */}
            <path
              d="M13 22C13 19.7909 14.7909 18 17 18H41C43.2091 18 45 19.7909 45 22V26.5H13V22Z"
              fill={`url(#${softGoldFillId})`}
            />
            {/* Calendar Binding Rings (Gold) */}
            <path
              d="M21 14.5V20.5M37 14.5V20.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Calendar Frame (Dark Charcoal) */}
            <path
              d="M35 50H17C14.7909 50 13 48.2091 13 46V22C13 19.7909 14.7909 18 17 18H41C43.2091 18 45 19.7909 45 22V32"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Calendar Header Divider */}
            <path
              d="M13.5 26.5H44.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.3"
            />
            {/* Minimalist Date Grid Dots / Lines */}
            <path
              d="M19.5 33H23.5M27.5 33H31.5M35.5 33H39.5M19.5 39H23.5M27.5 39H31.5M19.5 45H23.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            {/* Elegant Feather Quill Pen (Gold/Bronze + Charcoal Nib) */}
            <path
              d="M36.5 49.5L51.5 20.5C53 24.5 52 31.5 47.5 37.5C44.5 41.5 40.5 44 38.5 45.5L36.5 49.5Z"
              fill="#FAF7F2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Feather Vane Details & Spine */}
            <path
              d="M35 52.5L51.5 20.5M47.5 28.5L51.2 27.5M44.5 34.5L49.2 33.2"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </g>
        );

      case 'pillows':
        // Plush tailored luxury pillows with piping
        return (
          <g filter={`url(#${embossFilterId})`}>
            <rect
              x="18"
              y="18"
              width="32"
              height="20"
              rx="6"
              fill={`url(#${softGoldFillId})`}
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
            />
            <rect
              x="14"
              y="25"
              width="32"
              height="21"
              rx="6"
              fill="#FAF7F2"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            <rect
              x="17.5"
              y="28.5"
              width="25"
              height="14"
              rx="3.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.1"
            />
          </g>
        );

      case 'minibar':
        // Champagne flute & crystal decanter
        return (
          <g filter={`url(#${embossFilterId})`}>
            <path
              d="M22 16H30L29 29C28.8 31.2 27.5 33 26 33C24.5 33 23.2 31.2 23 29L22 16Z"
              fill={`url(#${softGoldFillId})`}
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M26 33V48M21 48H31M22.5 23.5H29.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            <path
              d="M40 16H44V23L48 29V48H36V29L40 23V16Z"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'safe':
        // Private vault / luxury safe with dial
        return (
          <g filter={`url(#${embossFilterId})`}>
            <rect
              x="14"
              y="16"
              width="36"
              height="32"
              rx="4"
              fill={`url(#${softGoldFillId})`}
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
            />
            <rect
              x="18"
              y="20"
              width="28"
              height="24"
              rx="2"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.2"
            />
            <circle
              cx="30"
              cy="32"
              r="5.5"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.4"
            />
            <circle
              cx="30"
              cy="32"
              r="1.8"
              fill="#B89146"
            />
            <path
              d="M41 28V36M19 48V51M45 48V51"
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
          </g>
        );

      case 'laundry':
        // Tailored suit hanger & steam lines
        return (
          <g filter={`url(#${embossFilterId})`}>
            <path
              d="M32 22C32 19.5 34.5 18.5 34.5 16C34.5 14.3 33.2 13 31.5 13C29.8 13 28.5 14.3 28.5 16"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <path
              d="M32 22L51 35C52.5 36 51.8 38.5 50 38.5H14C12.2 38.5 11.5 36 13 35L32 22Z"
              fill={`url(#${softGoldFillId})`}
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinejoin="round"
            />
            <path
              d="M22 38.5V48.5H42V38.5"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
        );

      default:
        // Classic concierge bell in gold & charcoal
        return (
          <g filter={`url(#${embossFilterId})`}>
            <path
              d="M16 42C16 33.1634 23.1634 26 32 26C40.8366 26 48 33.1634 48 42H16Z"
              fill={`url(#${softGoldFillId})`}
              stroke={`url(#${darkGradId})`}
              strokeWidth="1.45"
              strokeLinejoin="round"
            />
            <path
              d="M29 21H35M32 21V26M12 46H52"
              stroke={`url(#${goldGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Subtle 3D Embossed Metallic Halo Behind Icon */}
      <div
        className="absolute inset-1 rounded-2xl pointer-events-none transition-transform duration-300 group-hover:scale-105"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(246, 240, 228, 0.55) 60%, rgba(212, 188, 142, 0.12) 100%)',
          boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.9), 0 4px 12px -2px rgba(140, 108, 50, 0.10)'
        }}
      />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          {/* Deep Charcoal / Obsidian Metallic Gradient */}
          <linearGradient id={darkGradId} x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3A3D42" />
            <stop offset="48%" stopColor="#1F2124" />
            <stop offset="100%" stopColor="#121316" />
          </linearGradient>

          {/* Brushed European Gold / Bronze Metallic Gradient */}
          <linearGradient id={goldGradId} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DEC084" />
            <stop offset="35%" stopColor="#B89146" />
            <stop offset="70%" stopColor="#8E6928" />
            <stop offset="100%" stopColor="#C5A059" />
          </linearGradient>

          {/* Subtle Warm Champagne Inner Tint */}
          <linearGradient id={softGoldFillId} x1="16" y1="16" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5EBD6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#DEC28E" stopOpacity="0.18" />
          </linearGradient>

          {/* 3D Embossed Specular & Drop Shadow Filter */}
          <filter id={embossFilterId} x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="-0.6" dy="-0.7" stdDeviation="0.35" floodColor="#FFFFFF" floodOpacity="0.95" />
            <feDropShadow dx="0.8" dy="1.3" stdDeviation="0.95" floodColor="#2C2214" floodOpacity="0.22" />
          </filter>
        </defs>

        {renderPaths()}
      </svg>
    </div>
  );
}
