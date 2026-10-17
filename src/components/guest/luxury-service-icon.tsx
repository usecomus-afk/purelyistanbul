"use client";

import React, { useId } from 'react';

interface LuxuryServiceIconProps {
  serviceKey: string;
  className?: string;
}

/**
 High-relief 3D embossed ("kabarık, belirgin ve şık") luxury hotel service icons:
 * - Scaled up geometry with multi-layer 3D bas-relief elevation shadows
 * - Luminous champagne-pearl & 24K gold 3D domed fills with top-left specular highlights
 * - High-contrast deep burnished bronze & espresso-gold strokes so every interior detail
 *   (especially the clock face, hands, and hour markers on Late Check-out) is razor-sharp.
 */
export function LuxuryServiceIcon({
  serviceKey,
  className = "w-[78px] h-[78px] sm:w-24 sm:h-24",
}: LuxuryServiceIconProps) {
  const uid = useId().replace(/:/g, '');
  const strokeGradId = `lux-stroke-${uid}`;
  const bronzeGradId = `lux-bronze-${uid}`;
  const handleFillId = `lux-handle-${uid}`;
  const champagneFillId = `lux-champagne-${uid}`;
  const dialFillId = `lux-dial-${uid}`;
  const shadowFilterId = `lux-shadow-${uid}`;

  const normalizedKey = (serviceKey || '').trim();

  const renderPaths = () => {
    switch (normalizedKey) {
      case 'roomservice':
        // 3D Embossed Serving Cart with Domed Cloche, Wine Bottle, Curved Handle, Scalloped Tablecloth & Wheels
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32 32.5) scale(1.14) translate(-32 -32.5)"
          >
            {/* Soft 3D Champagne-Gold Fill inside Cloche & Tablecloth */}
            <path
              d="M15.5 29C15.5 22.8 20.5 18 26.8 18C33.1 18 38 22.8 38 29H15.5Z"
              fill={`url(#${handleFillId})`}
            />
            <path
              d="M12.5 31.5H49.5L49 48.5C49 50.2 47.7 51.5 46 51.5H14.5C12.8 51.5 11.5 50.2 11.6 48.5L12.5 31.5Z"
              fill={`url(#${champagneFillId})`}
            />

            {/* Cloche Top Loop Knob */}
            <path
              d="M25 18V15.8C25 14.6 25.9 13.7 27 13.7C28.1 13.7 29 14.6 29 15.8V18"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            {/* Cloche Dome */}
            <path
              d="M15.6 28.8C16 22.6 20.9 18 27 18C33.1 18 38 22.6 38.4 28.8"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Cloche 3D Specular Highlight + Dark Relief Arc */}
            <path
              d="M18.8 26.2C19.8 23.2 22.1 21.1 25 20.5"
              stroke="#FFFFFF"
              strokeOpacity="0.92"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M19.5 26.4C20.4 23.7 22.4 21.8 25 21.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            {/* Cloche Platter Base Rim */}
            <rect
              x="14"
              y="28.6"
              width="26"
              height="3.1"
              rx="1.3"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.05"
            />

            {/* Bottle on Right of Cloche */}
            <path
              d="M43 13.2H47V16.5H43V13.2Z"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
              strokeLinejoin="round"
            />
            <path
              d="M43.5 16.5V20L41.3 22.8V31.5H48.7V22.8L46.5 20V16.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.05"
              strokeLinejoin="round"
            />

            {/* Cart Body & Right Curved Push Handle */}
            <path
              d="M12.5 31.5H49.5V48.5C49.5 50.2 48.2 51.5 46.5 51.5H14.2C12.5 51.5 11.2 50.2 11.3 48.5L12.5 31.5Z"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            {/* Top Tablecloth Specular Highlight */}
            <path
              d="M14.2 33.4H47.6"
              stroke="#FFFFFF"
              strokeOpacity="0.88"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M49.5 32.5C49.8 27.6 51.6 25.2 56 25.2"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.25"
              strokeLinecap="round"
            />

            {/* Vertical Cloth Fold Lines */}
            <path
              d="M16.8 37.5V46.5M44.8 37.5V46.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.95"
              strokeLinecap="round"
            />

            {/* Wavy Scalloped Tablecloth Hem */}
            <path
              d="M11.6 45.8C13.5 45.8 14.5 48 16.5 48C18.5 48 19.8 45.8 22 45.8C24.2 45.8 25.5 48 27.8 48C30 48 31.5 45.8 33.8 45.8C36 45.8 37.2 48 39.5 48C41.8 48 43 45.8 45 45.8C47 45.8 48 47.4 49.4 46.3"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.05"
              strokeLinecap="round"
            />

            {/* Left Wheel & Fork */}
            <circle
              cx="17.2"
              cy="55.4"
              r="3.4"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
            />
            <circle cx="17.2" cy="55.4" r="1.2" fill="#2B1C08" />

            {/* Right Wheel & Fork */}
            <circle
              cx="44.2"
              cy="55.4"
              r="3.4"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
            />
            <circle cx="44.2" cy="55.4" r="1.2" fill="#2B1C08" />
          </g>
        );

      case 'dnd':
        // Vertical Arched 3D Door Hanger with Sculpted Cylindrical Gold Lever & Tassel Fringe
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32 33) scale(1.15) translate(-32 -33)"
          >
            {/* Door Hanger Body */}
            <path
              d="M19 23C19 16.3726 24.3726 11 31 11C37.6274 11 43 16.3726 43 23V52C43 54.2091 41.2091 56 39 56H23C20.7909 56 19 54.2091 19 52V23Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.25"
            />
            {/* Inner 3D Specular Rim */}
            <path
              d="M21.2 23C21.2 17.5876 25.5876 13.2 31 13.2C36.4124 13.2 40.8 17.5876 40.8 23V51.4C40.8 52.8 39.7 53.8 38.4 53.8H23.6C22.3 53.8 21.2 52.8 21.2 51.4V23Z"
              stroke="#FFFFFF"
              strokeOpacity="0.92"
              strokeWidth="1.5"
            />

            {/* Circular Cutout Hole */}
            <circle
              cx="31"
              cy="23.2"
              r="6.8"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
            />

            {/* 3D Cylindrical Metallic Gold Door Handle / Lever */}
            <rect
              x="28.2"
              y="19.6"
              width="25"
              height="7"
              rx="3.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.1"
            />
            {/* Specular Highlight on Handle */}
            <path
              d="M31 21.6H50"
              stroke="#FFFFFF"
              strokeOpacity="0.95"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* Tassel / Fringe Motif in Lower Half */}
            <rect
              x="23.8"
              y="37.5"
              width="14.4"
              height="3.6"
              rx="1.2"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
            />
            <path
              d="M25 41.1L23.6 50.8M27 41.1L26.1 50.8M29 41.1L28.6 50.8M31 41.1V50.8M33 41.1L33.4 50.8M35 41.1L35.9 50.8M37 41.1L38.4 50.8"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.85"
              strokeLinecap="round"
            />
          </g>
        );

      case 'cleaning':
        // Arched Luxury Bed with 2 Pillows, Leaning Broom on Right, and 4 Star Sparkles
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32 32.5) scale(1.14) translate(-32 -32.5)"
          >
            {/* 4-Point Concave Sparkles Above Bed */}
            <path
              d="M38.5 9C38.9 13 40 14.1 44 14.5C40 14.9 38.9 16 38.5 20C38.1 16 37 14.9 33 14.5C37 14.1 38.1 13 38.5 9Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.85"
              strokeLinejoin="round"
            />
            <path
              d="M46.8 17.5C47 19.7 47.6 20.3 49.8 20.5C47.6 20.7 47 21.3 46.8 23.5C46.6 21.3 46 20.7 43.8 20.5C46 20.3 46.6 19.7 46.8 17.5Z"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 17.5C15.7 19.7 16.3 20.3 18.5 20.5C16.3 20.7 15.7 21.3 15.5 23.5C15.3 21.3 14.7 20.7 12.5 20.5C14.7 20.3 15.3 19.7 15.5 17.5Z"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M24.5 12.6V17.4M22.1 15H26.9"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.95"
              strokeLinecap="round"
            />

            {/* Arched Headboard */}
            <path
              d="M15.5 36.5V25.2C19.5 25.2 23.5 21.6 30.5 21.6C37.5 21.6 41.5 25.2 45.5 25.2V36.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
              strokeLinejoin="round"
            />

            {/* Two Rounded Pillows */}
            <rect
              x="18.8"
              y="27.8"
              width="10.5"
              height="6.4"
              rx="2.5"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />
            <rect
              x="31.7"
              y="27.8"
              width="10.5"
              height="6.4"
              rx="2.5"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />

            {/* Mattress / Duvet & Bed Frame */}
            <path
              d="M11 47.5V41.2C11 36.6 14.8 34 19.5 34H41.5C46.2 34 50 36.6 50 41.2V47.5H11Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Duvet Specular & Fold Line */}
            <path
              d="M14.5 36.2H39"
              stroke="#FFFFFF"
              strokeOpacity="0.9"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M14.5 38.4H35"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.95"
              strokeLinecap="round"
            />
            {/* Bed Base & Legs */}
            <path
              d="M11 47.5H50V53.8H47L45.8 50.6H15.2L14 53.8H11V47.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
              strokeLinejoin="round"
            />

            {/* Leaning Broom on Right Side */}
            <path
              d="M44.2 34L51.8 21.2C52.4 20.2 53.6 19.9 54.5 20.5C55.4 21 55.7 22.2 55.1 23.2L47.5 36"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.05"
              strokeLinecap="round"
            />
            <path
              d="M42.2 33.5L48.8 37.4L47.4 39.8L40.8 35.9L42.2 33.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
              strokeLinejoin="round"
            />
            <path
              d="M40.8 35.9C38.6 38.6 36.5 40.2 34.4 40.8C36.9 44.2 41.3 46.6 46.2 47.5C46.8 44.8 47.2 42.2 47.4 39.8L40.8 35.9Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            <path
              d="M38.5 43.2L40.6 40.2M41.3 45L42.9 41.6M44.1 46.4L45.2 42.8"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </g>
        );

      case 'linens':
      case 'towels':
        // Isometric 3D Stack of 3 Neatly Folded Linens / Towels
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32 34) scale(1.16) translate(-32 -34)"
          >
            {/* Bottom Layer of Folded Sheet */}
            <path
              d="M14.5 36.5C11.8 38 11.5 42.2 14.2 43.8L31.5 53.5C32.8 54.2 34.2 54.2 35.5 53.4L50.8 43.5C53.2 42 53.2 38.2 50.5 36.8"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M33 49.5L49 39.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
              strokeLinecap="round"
            />

            {/* Middle Layer of Folded Sheet */}
            <path
              d="M17.5 28.2L14.2 30.2C11.5 31.8 11.5 35.8 14.2 37.4L31.5 47C32.8 47.7 34.2 47.7 35.5 46.9L50.8 37.2C53.2 35.6 53.2 31.8 50.5 30.2L47.5 28.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M33 43.2L49 33.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.95"
              strokeLinecap="round"
            />

            {/* Top Folded Sheet (Isometric Diamond + Folded Right Edge) */}
            <path
              d="M16.2 26.2L31.8 16.2L50.2 24.8C52.5 25.9 52.6 29.2 50.4 30.6L34.5 40.5L16.2 30.2L16.2 26.2Z"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
              strokeLinejoin="round"
            />
            <path
              d="M16.2 26.2L31.8 16.2L49.5 24.5L34.2 34.5L16.2 26.2Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
              strokeLinejoin="round"
            />
            {/* Top Specular & Woven Hem Lines */}
            <path
              d="M18.8 25.4L31.8 17.4L46.8 24.4"
              stroke="#FFFFFF"
              strokeOpacity="0.92"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M20.2 23.6L37.8 32M23 21.8L40.4 30.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.85"
              strokeLinecap="round"
            />
          </g>
        );

      case 'toiletries':
      case 'hygiene':
        // Left: Pump Dispenser Bottle; Front-center: Embossed Soap Bar; Right: Tumbler with Toothbrush & Lotion Tube
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(33 31.5) scale(1.13) translate(-33 -31.5)"
          >
            {/* Left Pump Bottle Body */}
            <path
              d="M11.5 31.5C11.5 27.4 14.8 24 19 24H20.5C24.7 24 28 27.4 28 31.5V50.5C28 52.2 26.7 53.5 25 53.5H14.5C12.8 53.5 11.5 52.2 11.5 50.5V31.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
            />
            {/* Pump Neck Collar & Dispenser Nozzle */}
            <rect
              x="16"
              y="19.5"
              width="7.5"
              height="4.5"
              rx="1"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />
            <path
              d="M18.2 19.5V16.2M21.2 19.5V16.2M13.5 16.2H22.2C22.8 16.2 23.2 15.6 23.2 14.8C23.2 14 22.8 13.4 22.2 13.4H14.5L11.5 15.2L13.5 16.2Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
              strokeLinejoin="round"
            />
            {/* Bottle Label */}
            <path
              d="M19.8 24V32.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.8"
            />
            <rect
              x="14.8"
              y="32.5"
              width="9.8"
              height="13.5"
              rx="1.2"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
            />

            {/* Right Toothbrush Sticking Out of Cup */}
            <path
              d="M35.5 32.5L34.2 25.5L31.5 20L29.8 10.2C29.6 9 30.4 8 31.5 7.8C32.6 7.6 33.6 8.4 33.8 9.5L35.4 19L37.8 24.5L39.2 32.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Toothbrush Head & Bristles */}
            <path
              d="M33.6 8.5L37.4 8L39 17.5L35.2 18.2"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.85"
              strokeLinejoin="round"
            />
            <path
              d="M34.2 11L37.6 10.5M34.6 13.3L38 12.8M35 15.6L38.4 15.1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />

            {/* Right Toiletry Bottle inside Cup */}
            <rect
              x="44.5"
              y="11.5"
              width="6.5"
              height="5.5"
              rx="1.2"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
            />
            <path
              d="M44.5 17L40.8 21.5L40.2 32.5H53.8L53.2 21.5L51 17H44.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.05"
              strokeLinejoin="round"
            />
            <path
              d="M42.2 23.5C44.5 23.5 46 25 48.5 25C50 25 51.2 24.5 52 24.2"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {/* Tapered Tumbler Cup */}
            <path
              d="M32.5 32.5H56L52.8 51.5C52.6 52.7 51.6 53.5 50.4 53.5H38C36.8 53.5 35.8 52.7 35.6 51.5L32.5 32.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M33.5 36.2H54.8"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.85"
              strokeLinecap="round"
            />

            {/* Front-Center Rounded 3D Bar of Soap */}
            <rect
              x="21.5"
              y="41"
              width="21"
              height="13"
              rx="6.5"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
            />
            <rect
              x="23.6"
              y="43"
              width="16.8"
              height="9"
              rx="4.5"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />
            <path
              d="M22.2 47.5H41.8"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.75"
            />
          </g>
        );

      case 'technical':
        // Large 8-Tooth Gear + Top-Right High-Contrast '!' Alert Badge + Bottom-Right Bronze Gear
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(33.5 32.5) scale(1.13) translate(-33.5 -32.5)"
          >
            {/* Primary 8-Tooth Mechanical Gear (Left/Center) */}
            <path
              d="M24.2 17.5H28.8L29.6 21.2C30.8 21.5 32 22 33 22.7L36.2 20.5L39.5 23.8L37.3 27C38 28 38.5 29.2 38.8 30.4L42.5 31.2V35.8L38.8 36.6C38.5 37.8 38 39 37.3 40L39.5 43.2L36.2 46.5L33 44.3C32 45 30.8 45.5 29.6 45.8L28.8 49.5H24.2L23.4 45.8C22.2 45.5 21 45 20 44.3L16.8 46.5L13.5 43.2L15.7 40C15 39 14.5 37.8 14.2 36.6L10.5 35.8V31.2L14.2 30.4C14.5 29.2 15 28 15.7 27L13.5 23.8L16.8 20.5L20 22.7C21 22 22.2 21.5 23.4 21.2L24.2 17.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Two Inner Concentric Rings */}
            <circle
              cx="26.5"
              cy="33.5"
              r="9.2"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />
            <circle
              cx="26.5"
              cy="33.5"
              r="5.8"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />

            {/* Secondary Smaller Gold Gear (Bottom-Right) */}
            <path
              d="M46.2 36.5H48.8L49.3 38.6C50 38.8 50.6 39.2 51.2 39.6L53.1 38.4L54.9 40.2L53.7 42.1C54.1 42.7 54.5 43.3 54.7 44L56.8 44.5V47.1L54.7 47.6C54.5 48.3 54.1 48.9 53.7 49.5L54.9 51.4L53.1 53.2L51.2 52C50.6 52.4 50 52.8 49.3 53L48.8 55.1H46.2L45.7 53C45 52.8 44.4 52.4 43.8 52L41.9 53.2L40.1 51.4L41.3 49.5C40.9 48.9 40.5 48.3 40.3 47.6L38.2 47.1V44.5L40.3 44C40.5 43.3 40.9 42.7 41.3 42.1L40.1 40.2L41.9 38.4L43.8 39.6C44.4 39.2 45 38.8 45.7 38.6L46.2 36.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle
              cx="47.5"
              cy="45.8"
              r="3.2"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.95"
            />

            {/* Top-Right Circular Speech-Bubble Alert Badge */}
            <path
              d="M45 9.5C51.6274 9.5 57 14.8726 57 21.5C57 28.1274 51.6274 33.5 45 33.5C42.1 33.5 39.4 32.5 37.3 30.8L32.8 31.8L34.5 27.6C33.5 25.8 33 23.7 33 21.5C33 14.8726 38.3726 9.5 45 9.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle
              cx="45"
              cy="21.5"
              r="9.6"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />
            {/* Crisp High-Contrast 3D Exclamation Mark (!) */}
            <rect
              x="43.4"
              y="14"
              width="3.2"
              height="9"
              rx="1.6"
              fill="#2B1C08"
            />
            <circle
              cx="45"
              cy="26.5"
              r="1.85"
              fill="#2B1C08"
            />
          </g>
        );

      case 'lateCheckout':
        // High-Contrast 3D Embossed Luxury Timepiece with Sculpted Gold Bezel, Crisp Porcelain Dial,
        // Bold 12-Hour Indices, and Distinct 10:10 Watch Hands
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32 31.5) scale(1.18) translate(-32 -31.5)"
          >
            {/* Outer 3D Gold Case Back Cushion */}
            <circle
              cx="32.5"
              cy="31.5"
              r="19.2"
              fill={`url(#${handleFillId})`}
            />

            {/* Crisp High-Contrast Porcelain Inner Clock Dial so Hands & Ticks Stand Out Clearly */}
            <circle
              cx="32.5"
              cy="31.5"
              r="15.4"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.75"
            />

            {/* Inner Specular Rim inside Dial */}
            <circle
              cx="32.5"
              cy="31.5"
              r="13.8"
              stroke="#FFFFFF"
              strokeOpacity="0.95"
              strokeWidth="1.2"
            />

            {/* Outer Beveled 3D Metallic Gold Ring with Bottom-Left Arrowhead */}
            <path
              d="M15.2 40.5C13.5 36.8 13 32.5 13.8 28.2C15.8 18.2 25.5 11.6 35.5 13.5C45.5 15.5 52 25.2 50 35.2C48 45.2 38.4 51.8 28.4 49.8C25.2 49.2 22.3 47.7 20 45.6L17.2 48.5L15.4 39.2L24.8 41L22.2 43.5C24.1 45.2 26.5 46.4 29.1 46.9C37.4 48.5 45.5 43.1 47.1 34.8C48.7 26.5 43.3 18.4 35 16.8C26.7 15.2 18.6 20.6 17 28.9C16.3 32.4 16.8 36 18.2 39.1L15.2 40.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* 4 Primary Cardinal Hour Indices (12, 3, 6, 9) — Bold Dark Espresso-Bronze */}
            <path
              d="M32.5 17.8V21.2M32.5 41.8V45.2M18.8 31.5H22.2M42.8 31.5H46.2"
              stroke="#231707"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* 8 Secondary Radial Hour Markers */}
            <path
              d="M25.7 19.7L27.1 22.1M37.9 40.9L39.3 43.3M20.7 24.7L23.1 26.1M41.9 36.9L44.3 38.3M44.3 24.7L41.9 26.1M23.1 36.9L20.7 38.3M39.3 19.7L37.9 22.1M27.1 40.9L25.7 43.3"
              stroke="#4A300D"
              strokeWidth="1.85"
              strokeLinecap="round"
            />

            {/* Bold Sculpted Clock Hands (~10:10) */}
            <path
              d="M24.2 26.5L32.5 31.5L40.4 23.6"
              stroke="#231707"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Subtle Gold Inner Highlight on Hands */}
            <path
              d="M24.8 26.9L32.5 31.5L39.8 24.2"
              stroke="#C4922A"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Center 3D Jewel Pivot Cap */}
            <circle
              cx="32.5"
              cy="31.5"
              r="2.7"
              fill={`url(#${handleFillId})`}
              stroke="#231707"
              strokeWidth="2.1"
            />
          </g>
        );

      case 'extendStay':
        // Rounded-Square 3D Calendar with Top Ring, Crisp 2x4 Date Squares, and Sculpted Feather Quill
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32.5 32) scale(1.15) translate(-32.5 -32)"
          >
            {/* Calendar Rounded Body */}
            <rect
              x="13"
              y="17"
              width="37"
              height="36"
              rx="5.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.25"
            />
            {/* Top Header Band Fill */}
            <path
              d="M13 22.5C13 19.4624 15.4624 17 18.5 17H44.5C47.5376 17 50 19.4624 50 22.5V26.5H13V22.5Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.1"
            />

            {/* Calendar Top Binding Rings */}
            <rect
              x="20"
              y="12.8"
              width="4"
              height="8"
              rx="2"
              fill={`url(#${dialFillId})`}
              stroke="#231707"
              strokeWidth="2.1"
            />
            <rect
              x="33"
              y="12.8"
              width="4"
              height="8"
              rx="2"
              fill={`url(#${dialFillId})`}
              stroke="#231707"
              strokeWidth="2.1"
            />

            {/* 2x4 Grid of High-Contrast Date Squares */}
            {/* Row 1 */}
            <rect x="17.2" y="30.8" width="5.6" height="5.6" rx="1.2" fill={`url(#${dialFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.85" />
            <rect x="25.2" y="30.8" width="5.6" height="5.6" rx="1.2" fill={`url(#${dialFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.85" />
            <rect x="33.2" y="30.8" width="5.6" height="5.6" rx="1.2" fill={`url(#${dialFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.85" />
            <rect x="41.2" y="30.8" width="5.6" height="5.6" rx="1.2" fill={`url(#${dialFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.85" />

            {/* Row 2 — Highlighted Selected Date Square + 3 Extended Days */}
            <rect x="17.2" y="40.2" width="5.6" height="5.6" rx="1.2" fill="#231707" stroke="#231707" strokeWidth="2.1" />
            <rect x="25.2" y="40.2" width="5.6" height="5.6" rx="1.2" fill={`url(#${handleFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.95" />
            <rect x="33.2" y="40.2" width="5.6" height="5.6" rx="1.2" fill={`url(#${dialFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.85" />
            <rect x="41.2" y="40.2" width="5.6" height="5.6" rx="1.2" fill={`url(#${dialFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.85" />

            {/* Sculpted 3D Feather Quill Pen Resting Diagonally Across Top-Right */}
            <path
              d="M34.8 35.8C34 28.6 36 21.4 40 16.2L39.5 19L42.2 14.2C45.6 10.8 49.8 9 54 8.8C53.6 13.2 51.8 17.8 48.6 22L46.2 21.5L47.2 24C43.8 29.4 39.4 33.4 34.8 35.8Z"
              fill={`url(#${dialFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.15"
              strokeLinejoin="round"
            />
            {/* Feather Central Shaft / Quill Nib */}
            <path
              d="M32.8 39.8L48.2 15.2"
              stroke="#231707"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        );

      default:
        return (
          <g
            filter={`url(#${shadowFilterId})`}
            transform="translate(32 33) scale(1.16) translate(-32 -33)"
          >
            <path
              d="M16 42C16 33.1634 23.1634 26 32 26C40.8366 26 48 33.1634 48 42H16Z"
              fill={`url(#${handleFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M29 21H35M32 21V26M12 46H52"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.2"
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
          {/* High-Contrast Deep Burnished Bronze & Espresso-Gold Contour Stroke */}
          <linearGradient id={strokeGradId} x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#261806" />
            <stop offset="35%" stopColor="#4A300D" />
            <stop offset="68%" stopColor="#634112" />
            <stop offset="100%" stopColor="#1F1304" />
          </linearGradient>

          {/* Rich Antique Gold Filigree & Interior Detail Stroke (Strong Contrast against Champagne Fill) */}
          <linearGradient id={bronzeGradId} x1="14" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4E330D" />
            <stop offset="45%" stopColor="#754D14" />
            <stop offset="100%" stopColor="#332007" />
          </linearGradient>

          {/* 3D Domed 24K Gold Leaf Fill */}
          <linearGradient id={handleFillId} x1="14" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF4" />
            <stop offset="28%" stopColor="#F8DF8C" />
            <stop offset="68%" stopColor="#D4A138" />
            <stop offset="100%" stopColor="#9A6B19" />
          </linearGradient>

          {/* Soft 3D Champagne-Gold Body Fill */}
          <linearGradient id={champagneFillId} x1="14" y1="14" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF8" />
            <stop offset="45%" stopColor="#F7E6BC" />
            <stop offset="82%" stopColor="#DFBA6A" />
            <stop offset="100%" stopColor="#B88930" />
          </linearGradient>

          {/* Crisp Warm Porcelain-Ivory Inner Surface Fill (for Clock Dial, Pillows, Labels) */}
          <linearGradient id={dialFillId} x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFBF0" />
            <stop offset="100%" stopColor="#F3E3BE" />
          </linearGradient>

          {/* Sculpted 3D High-Relief ("Kabarık & Belirgin") Elevation Shadow Filter */}
          <filter id={shadowFilterId} x="-25%" y="-25%" width="150%" height="155%">
            {/* Crisp Top-Left Specular Rim */}
            <feDropShadow dx="-0.75" dy="-0.95" stdDeviation="0.25" floodColor="#FFFFFF" floodOpacity="0.95" />
            {/* Immediate 3D Extrusion Bevel */}
            <feDropShadow dx="0.9" dy="1.5" stdDeviation="0.35" floodColor="#3D2708" floodOpacity="0.72" />
            {/* Deep Floating Plinth Shadow */}
            <feDropShadow dx="0" dy="3.8" stdDeviation="2.2" floodColor="#1E1304" floodOpacity="0.38" />
          </filter>
        </defs>

        {renderPaths()}
      </svg>
    </div>
  );
}
