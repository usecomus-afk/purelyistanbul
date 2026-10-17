"use client";

import React, { useId } from 'react';

interface LuxuryServiceIconProps {
  serviceKey: string;
  className?: string;
}

/**
 * Exact 1:1 vector recreation of the 8 luxury hotel icons from the reference design:
 * - Left-to-right charcoal (#1F2227) to warm bronze (#8E7252) gradient strokes
 * - Soft 3D champagne/ivory inner shading and warm ambient drop shadows
 */
export function LuxuryServiceIcon({ serviceKey, className = "w-16 h-16 sm:w-20 sm:h-20" }: LuxuryServiceIconProps) {
  const uid = useId().replace(/:/g, '');
  const strokeGradId = `lux-stroke-${uid}`;
  const bronzeGradId = `lux-bronze-${uid}`;
  const handleFillId = `lux-handle-${uid}`;
  const champagneFillId = `lux-champagne-${uid}`;
  const shadowFilterId = `lux-shadow-${uid}`;

  const normalizedKey = (serviceKey || '').trim();

  const renderPaths = () => {
    switch (normalizedKey) {
      case 'roomservice':
        // Serving cart with domed cloche on left, bottle on right, curved right handle, wavy cloth & 2 wheels
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Soft 3D Champagne Fill inside Cart Cloth & Cloche */}
            <path
              d="M15.5 29C15.5 22.8 20.5 18 26.8 18C33.1 18 38 22.8 38 29H15.5Z"
              fill={`url(#${champagneFillId})`}
            />
            <path
              d="M12.5 31.5H49.5L49 48.5C49 50.2 47.7 51.5 46 51.5H14.5C12.8 51.5 11.5 50.2 11.6 48.5L12.5 31.5Z"
              fill={`url(#${champagneFillId})`}
            />

            {/* Cloche Top Loop Knob */}
            <path
              d="M25.2 18V16.2C25.2 15.1 26 14.3 27 14.3C28 14.3 28.8 15.1 28.8 16.2V18"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinecap="round"
            />
            {/* Cloche Dome */}
            <path
              d="M15.8 28.8C16.2 22.7 21 18 27 18C33 18 37.8 22.7 38.2 28.8"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinecap="round"
            />
            {/* Cloche Inner Specular Arc */}
            <path
              d="M19.5 26C20.3 23.4 22.3 21.5 24.8 21"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Cloche Platter Base Rim */}
            <rect
              x="14.2"
              y="28.8"
              width="25.6"
              height="2.7"
              rx="1"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
            />

            {/* Bottle on Right of Cloche */}
            <path
              d="M43.2 13.5H46.8V16.5H43.2V13.5Z"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M43.6 16.5V20.2L41.5 22.8V31.5H48.5V22.8L46.4 20.2V16.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinejoin="round"
            />

            {/* Cart Body & Right Curved Push Handle */}
            <path
              d="M12.5 31.5H49.5V48.5C49.5 50.2 48.2 51.5 46.5 51.5H14.2C12.5 51.5 11.2 50.2 11.3 48.5L12.5 31.5Z"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M49.5 32.5C49.8 27.8 51.5 25.5 55.8 25.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
              strokeLinecap="round"
            />

            {/* Vertical Cloth Fold Lines */}
            <path
              d="M16.5 38.5V47.5M45 38.5V47.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />

            {/* Wavy Scalloped Tablecloth Hem */}
            <path
              d="M11.6 46C13.5 46 14.5 48 16.5 48C18.5 48 19.8 46 22 46C24.2 46 25.5 48 27.8 48C30 48 31.5 46 33.8 46C36 46 37.2 48 39.5 48C41.8 48 43 46 45 46C47 46 48 47.5 49.4 46.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
              strokeLinecap="round"
            />

            {/* Left Wheel & Fork */}
            <circle
              cx="17.2"
              cy="55.2"
              r="3.2"
              fill="#FAF7F1"
              stroke="#1F2227"
              strokeWidth="1.65"
            />
            <path
              d="M16 51.5V54.8C16 55.5 16.5 56 17.2 56C17.9 56 18.4 55.5 18.4 54.8V51.5"
              stroke="#1F2227"
              strokeWidth="1.4"
            />

            {/* Right Wheel & Fork */}
            <circle
              cx="44.2"
              cy="55.2"
              r="3.2"
              fill="#FAF7F1"
              stroke="#2C2825"
              strokeWidth="1.65"
            />
            <path
              d="M43 51.5V54.8C43 55.5 43.5 56 44.2 56C44.9 56 45.4 55.5 45.4 54.8V51.5"
              stroke="#2C2825"
              strokeWidth="1.4"
            />
          </g>
        );

      case 'dnd':
        // Vertical arched door hanger with 3D cylindrical bronze lever & 7-line tassel fringe
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Door Hanger Body */}
            <path
              d="M19 23C19 16.3726 24.3726 11 31 11C37.6274 11 43 16.3726 43 23V52C43 54.2091 41.2091 56 39 56H23C20.7909 56 19 54.2091 19 52V23Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
            />
            {/* Inner Subtle Rim */}
            <path
              d="M20.8 23C20.8 17.3667 25.3667 12.8 31 12.8C36.6333 12.8 41.2 17.3667 41.2 23V51.5C41.2 53.1 39.9 54.2 38.5 54.2H23.5C22.1 54.2 20.8 53.1 20.8 51.5V23Z"
              stroke="#FFFFFF"
              strokeOpacity="0.8"
              strokeWidth="1"
            />

            {/* Circular Cutout Hole */}
            <circle
              cx="31"
              cy="23.2"
              r="6.8"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
            />

            {/* 3D Cylindrical Metallic Bronze Door Handle / Lever */}
            <rect
              x="28.5"
              y="20"
              width="24.5"
              height="6.4"
              rx="3.2"
              fill={`url(#${handleFillId})`}
              stroke="#6E5233"
              strokeWidth="1.35"
            />
            {/* Specular Highlight on Handle */}
            <path
              d="M31 21.6H50"
              stroke="#FFFDF9"
              strokeOpacity="0.85"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Tassel / Fringe Motif in Lower Half */}
            <rect
              x="24"
              y="38"
              width="14"
              height="3.2"
              rx="1"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
            />
            <path
              d="M25.2 41.2L23.8 50.5M27.1 41.2L26.2 50.5M29 41.2L28.6 50.5M31 41.2V50.5M33 41.2L33.4 50.5M34.9 41.2L35.8 50.5M36.8 41.2L38.2 50.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
          </g>
        );

      case 'cleaning':
        // Arched bed with 2 pillows, leaning broom on right, and 4 concave star sparkles above
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* 4-Point Concave Sparkles Above Bed */}
            {/* Top-Right Main Sparkle */}
            <path
              d="M38.5 9.5C38.8 13.2 39.8 14.2 43.5 14.5C39.8 14.8 38.8 15.8 38.5 19.5C38.2 15.8 37.2 14.8 33.5 14.5C37.2 14.2 38.2 13.2 38.5 9.5Z"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
            {/* Far-Right Small Sparkle */}
            <path
              d="M46.5 18C46.7 20 47.2 20.5 49.2 20.7C47.2 20.9 46.7 21.4 46.5 23.4C46.3 21.4 45.8 20.9 43.8 20.7C45.8 20.5 46.3 20 46.5 18Z"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            {/* Top-Left Small Sparkle */}
            <path
              d="M15.5 18C15.7 20 16.2 20.5 18.2 20.7C16.2 20.9 15.7 21.4 15.5 23.4C15.3 21.4 14.8 20.9 12.8 20.7C14.8 20.5 15.3 20 15.5 18Z"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            {/* Upper-Left Tiny Sparkle */}
            <path
              d="M24.5 13V17M22.5 15H26.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            {/* Arched Headboard */}
            <path
              d="M15.5 36.5V25.5C19.5 25.5 23.5 22 30.5 22C37.5 22 41.5 25.5 45.5 25.5V36.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />

            {/* Two Rounded Pillows */}
            <rect
              x="19"
              y="28.2"
              width="10.2"
              height="6"
              rx="2.4"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.5"
            />
            <rect
              x="31.8"
              y="28.2"
              width="10.2"
              height="6"
              rx="2.4"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />

            {/* Mattress / Duvet & Bed Frame with Cutout Legs */}
            <path
              d="M11 47.5V41.5C11 36.8 14.8 34.2 19.5 34.2H41.5C46.2 34.2 50 36.8 50 41.5V47.5H11Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            {/* Duvet Fold Line */}
            <path
              d="M14.5 38.2H34.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Bed Base & Legs */}
            <path
              d="M11 47.5H50V53.5H47.2L46 50.5H15L13.8 53.5H11V47.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />

            {/* Leaning Broom on Right Side */}
            {/* Broom Handle */}
            <path
              d="M44.2 34L51.8 21.2C52.4 20.2 53.6 19.9 54.5 20.5C55.4 21 55.7 22.2 55.1 23.2L47.5 36"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinecap="round"
            />
            {/* Broom Ferrule Cap */}
            <path
              d="M42.2 33.5L48.8 37.4L47.4 39.8L40.8 35.9L42.2 33.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Flared Broom Bristles Head */}
            <path
              d="M40.8 35.9C38.8 38.5 36.8 40 34.8 40.5C37.2 43.8 41.5 46.2 46.2 47.2C46.8 44.5 47.2 42 47.4 39.8L40.8 35.9Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinejoin="round"
            />
            {/* Bristle Lines */}
            <path
              d="M38.5 43L40.5 40.2M41.2 44.8L42.8 41.6M44 46.2L45.1 42.8"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          </g>
        );

      case 'linens':
      case 'towels':
        // Isometric 3D stack of 3 neatly folded sheets/linens angled diagonally
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Bottom Layer of Folded Sheet */}
            <path
              d="M14.5 36.5C11.8 38 11.5 42.2 14.2 43.8L31.5 53.5C32.8 54.2 34.2 54.2 35.5 53.4L50.8 43.5C53.2 42 53.2 38.2 50.5 36.8"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Crease of Bottom Layer */}
            <path
              d="M33 49.5L49 39.5"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.55"
              strokeLinecap="round"
            />

            {/* Middle Layer of Folded Sheet */}
            <path
              d="M17.5 28.2L14.2 30.2C11.5 31.8 11.5 35.8 14.2 37.4L31.5 47C32.8 47.7 34.2 47.7 35.5 46.9L50.8 37.2C53.2 35.6 53.2 31.8 50.5 30.2L47.5 28.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Crease of Middle Layer */}
            <path
              d="M33 43.2L49 33.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinecap="round"
            />

            {/* Top Folded Sheet (Isometric Diamond + Folded Right Edge) */}
            <path
              d="M16.2 26.2L31.8 16.2L50.2 24.8C52.5 25.9 52.6 29.2 50.4 30.6L34.5 40.5L16.2 30.2L16.2 26.2Z"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            {/* Top Sheet Diamond Upper Surface & Hem Lines */}
            <path
              d="M16.2 26.2L31.8 16.2L49.5 24.5L34.2 34.5L16.2 26.2Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            <path
              d="M20.2 23.6L37.8 32M22.8 22L40.2 30.4"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          </g>
        );

      case 'toiletries':
      case 'hygiene':
        // Left: pump bottle; Front-center: oval soap bar; Right: cup with toothbrush & tube
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Left Pump Bottle Body */}
            <path
              d="M11.5 31.5C11.5 27.4 14.8 24 19 24H20.5C24.7 24 28 27.4 28 31.5V50.5C28 52.2 26.7 53.5 25 53.5H14.5C12.8 53.5 11.5 52.2 11.5 50.5V31.5Z"
              fill={`url(#${champagneFillId})`}
              stroke="#1F2227"
              strokeWidth="1.7"
            />
            {/* Pump Neck Collar & Dispenser Nozzle */}
            <rect
              x="16"
              y="19.5"
              width="7.5"
              height="4.5"
              rx="0.8"
              fill="#FAF7F1"
              stroke="#1F2227"
              strokeWidth="1.6"
            />
            <path
              d="M18.2 19.5V16.2M21.2 19.5V16.2M13.5 16.2H22.2C22.8 16.2 23.2 15.6 23.2 14.8C23.2 14 22.8 13.4 22.2 13.4H14.5L11.5 15.2L13.5 16.2Z"
              fill="#FAF7F1"
              stroke="#1F2227"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Bottle Dip Tube & Rectangular Label */}
            <path
              d="M19.8 24V32.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.4"
            />
            <rect
              x="15"
              y="32.5"
              width="9.5"
              height="13.5"
              rx="0.8"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />

            {/* Right Toothbrush Sticking Out of Cup */}
            <path
              d="M35.5 32.5L34.2 25.5L31.5 20L29.8 10.2C29.6 9 30.4 8 31.5 7.8C32.6 7.6 33.6 8.4 33.8 9.5L35.4 19L37.8 24.5L39.2 32.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinejoin="round"
            />
            {/* Toothbrush Head & Bristles */}
            <path
              d="M33.6 8.5L37.2 8L38.8 17.5L35.2 18.2"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.45"
              strokeLinejoin="round"
            />
            <path
              d="M34.2 11L37.4 10.5M34.6 13.3L37.8 12.8M35 15.6L38.2 15.1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.3"
            />

            {/* Right Toiletry Bottle inside Cup */}
            <rect
              x="44.5"
              y="11.5"
              width="6.5"
              height="5.5"
              rx="1"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />
            <path
              d="M44.5 17L40.8 21.5L40.2 32.5H53.8L53.2 21.5L51 17H44.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M42.2 23.5C44.5 23.5 46 25 48.5 25C50 25 51.2 24.5 52 24.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.35"
              strokeLinecap="round"
            />

            {/* Tapered Tumbler Cup */}
            <path
              d="M32.5 32.5H56L52.8 51.5C52.6 52.7 51.6 53.5 50.4 53.5H38C36.8 53.5 35.8 52.7 35.6 51.5L32.5 32.5Z"
              fill={`url(#${champagneFillId})`}
              stroke="#1F2227"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M33.2 36H36.2M38.5 36H55.2"
              stroke="#1F2227"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Front-Center Rounded Bar of Soap */}
            <rect
              x="22"
              y="41.5"
              width="20"
              height="12.5"
              rx="6.25"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
            />
            <rect
              x="23.8"
              y="43.2"
              width="16.4"
              height="9.1"
              rx="4.5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.2"
            />
            <path
              d="M22.5 48H41.5"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.4"
            />
          </g>
        );

      case 'technical':
        // Large dark 8-tooth gear + top-right bronze '!' speech-bubble + bottom-right small bronze gear
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Primary 8-Tooth Mechanical Gear (Left/Center) */}
            <path
              d="M24.2 17.5H28.8L29.6 21.2C30.8 21.5 32 22 33 22.7L36.2 20.5L39.5 23.8L37.3 27C38 28 38.5 29.2 38.8 30.4L42.5 31.2V35.8L38.8 36.6C38.5 37.8 38 39 37.3 40L39.5 43.2L36.2 46.5L33 44.3C32 45 30.8 45.5 29.6 45.8L28.8 49.5H24.2L23.4 45.8C22.2 45.5 21 45 20 44.3L16.8 46.5L13.5 43.2L15.7 40C15 39 14.5 37.8 14.2 36.6L10.5 35.8V31.2L14.2 30.4C14.5 29.2 15 28 15.7 27L13.5 23.8L16.8 20.5L20 22.7C21 22 22.2 21.5 23.4 21.2L24.2 17.5Z"
              fill="#F3F1EE"
              stroke="#1C2026"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            {/* Two Inner Concentric Rings */}
            <circle
              cx="26.5"
              cy="33.5"
              r="9.2"
              fill="#FAF7F1"
              stroke="#1C2026"
              strokeWidth="1.55"
            />
            <circle
              cx="26.5"
              cy="33.5"
              r="6.2"
              fill={`url(#${champagneFillId})`}
              stroke="#1C2026"
              strokeWidth="1.55"
            />

            {/* Secondary Smaller Bronze Gear (Bottom-Right) */}
            <path
              d="M46.2 36.5H48.8L49.3 38.6C50 38.8 50.6 39.2 51.2 39.6L53.1 38.4L54.9 40.2L53.7 42.1C54.1 42.7 54.5 43.3 54.7 44L56.8 44.5V47.1L54.7 47.6C54.5 48.3 54.1 48.9 53.7 49.5L54.9 51.4L53.1 53.2L51.2 52C50.6 52.4 50 52.8 49.3 53L48.8 55.1H46.2L45.7 53C45 52.8 44.4 52.4 43.8 52L41.9 53.2L40.1 51.4L41.3 49.5C40.9 48.9 40.5 48.3 40.3 47.6L38.2 47.1V44.5L40.3 44C40.5 43.3 40.9 42.7 41.3 42.1L40.1 40.2L41.9 38.4L43.8 39.6C44.4 39.2 45 38.8 45.7 38.6L46.2 36.5Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.55"
              strokeLinejoin="round"
            />
            <circle
              cx="47.5"
              cy="45.8"
              r="3.2"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />

            {/* Top-Right Circular Speech-Bubble Alert Badge */}
            <path
              d="M45 9.5C51.6274 9.5 57 14.8726 57 21.5C57 28.1274 51.6274 33.5 45 33.5C42.1 33.5 39.4 32.5 37.3 30.8L32.8 31.8L34.5 27.6C33.5 25.8 33 23.7 33 21.5C33 14.8726 38.3726 9.5 45 9.5Z"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle
              cx="45"
              cy="21.5"
              r="10.2"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="0.9"
            />
            {/* 3D Exclamation Mark (!) */}
            <rect
              x="43.5"
              y="14.2"
              width="3"
              height="9.2"
              rx="1.5"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />
            <circle
              cx="45"
              cy="26.8"
              r="1.6"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
            />
          </g>
        );

      case 'lateCheckout':
        // 3D circular timepiece with thick metallic bezel ending in bottom-left arrow & 10:10 hands
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Inner Clock Face */}
            <circle
              cx="32"
              cy="32"
              r="17.5"
              fill={`url(#${champagneFillId})`}
            />

            {/* Outer Beveled Metallic Ring with Bottom-Left Arrowhead */}
            <path
              d="M15.2 40.5C13.5 36.8 13 32.5 13.8 28.2C15.8 18.2 25.5 11.6 35.5 13.5C45.5 15.5 52 25.2 50 35.2C48 45.2 38.4 51.8 28.4 49.8C25.2 49.2 22.3 47.7 20 45.6L17.5 48.2L15.8 39.5L24.5 41.2L22.2 43.5C24.1 45.2 26.5 46.4 29.1 46.9C37.4 48.5 45.5 43.1 47.1 34.8C48.7 26.5 43.3 18.4 35 16.8C26.7 15.2 18.6 20.6 17 28.9C16.3 32.4 16.8 36 18.2 39.1L15.2 40.5Z"
              fill="#FAF7F1"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />

            {/* 12 Radial Hour Tick Marks */}
            <path
              d="M32 19V21.8M32 42.2V45M19 32H21.8M42.2 32H45M25.5 20.7L26.9 23.1M37.1 40.9L38.5 43.3M20.7 25.5L23.1 26.9M40.9 37.1L43.3 38.5M43.3 25.5L40.9 26.9M38.5 20.7L37.1 23.1M38.5 43.3L37.1 40.9"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Hour Hand (~10:00) & Minute Hand (~2:00) */}
            <path
              d="M24.5 27L32 32L39.8 24.2"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center Pivot Ring */}
            <circle
              cx="32"
              cy="32"
              r="2.1"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.6"
            />
          </g>
        );

      case 'extendStay':
        // Rounded-square calendar with left loop, 2x4 date squares (bottom-left dark), and notched feather quill
        return (
          <g filter={`url(#${shadowFilterId})`}>
            {/* Calendar Rounded Body */}
            <rect
              x="13"
              y="17"
              width="37"
              height="36"
              rx="5"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.7"
            />

            {/* Calendar Top Binding Ring (Left) */}
            <rect
              x="20.5"
              y="13"
              width="3.6"
              height="7.5"
              rx="1.8"
              fill="#FAF7F1"
              stroke="#1C2026"
              strokeWidth="1.7"
            />

            {/* Horizontal Header Line */}
            <path
              d="M13.5 26.5H32.5M45.5 26.5H49.5"
              stroke="#1C2026"
              strokeWidth="1.65"
              strokeLinecap="round"
            />

            {/* 2x4 Grid of Date Squares */}
            {/* Row 1 */}
            <rect x="17.5" y="31" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />
            <rect x="25.5" y="31" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />
            <rect x="33.5" y="31" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />
            <rect x="41.5" y="31" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />

            {/* Row 2 — First Square is Bold Dark Charcoal */}
            <rect x="17.5" y="40.5" width="5.2" height="5.2" rx="1" fill="#E8E6E1" stroke="#1C2026" strokeWidth="1.75" />
            <rect x="25.5" y="40.5" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />
            <rect x="33.5" y="40.5" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />
            <rect x="41.5" y="40.5" width="5.2" height="5.2" rx="1" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />

            {/* Notched Feather Quill Pen Resting Diagonally Across Top-Right */}
            <path
              d="M35 35.5C34.2 28.5 36.2 21.5 40 16.5L39.5 19.2L42.2 14.5C45.5 11.2 49.5 9.5 53.5 9.2C53.2 13.5 51.5 18 48.5 22L46.2 21.5L47.2 24C43.8 29.2 39.5 33.2 35 35.5Z"
              fill="#FAF7F1"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            {/* Feather Central Shaft / Quill Nib */}
            <path
              d="M33.2 39.2L47.8 15.8"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
              strokeLinecap="round"
            />
          </g>
        );

      default:
        return (
          <g filter={`url(#${shadowFilterId})`}>
            <path
              d="M16 42C16 33.1634 23.1634 26 32 26C40.8366 26 48 33.1634 48 42H16Z"
              fill={`url(#${champagneFillId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            <path
              d="M29 21H35M32 21V26M12 46H52"
              stroke={`url(#${bronzeGradId})`}
              strokeWidth="1.65"
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
          {/* 24K Gilded Gold & Burnished Bronze Relief Contour Stroke */}
          <linearGradient id={strokeGradId} x1="10" y1="12" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6B4812" />
            <stop offset="28%" stopColor="#C4922A" />
            <stop offset="52%" stopColor="#EAC864" />
            <stop offset="76%" stopColor="#9C6E1B" />
            <stop offset="100%" stopColor="#583A0D" />
          </linearGradient>

          {/* Luminous Gilded Gold Leaf Accent & Filigree Gradient */}
          <linearGradient id={bronzeGradId} x1="18" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DEB54A" />
            <stop offset="42%" stopColor="#F7DF8A" />
            <stop offset="72%" stopColor="#B88624" />
            <stop offset="100%" stopColor="#724E12" />
          </linearGradient>

          {/* 3D Cylindrical 24K Gold Handle Fill (for DND Lever) */}
          <linearGradient id={handleFillId} x1="40" y1="20" x2="40" y2="26.4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFCEE" />
            <stop offset="45%" stopColor="#E6BD56" />
            <stop offset="100%" stopColor="#8A5E14" />
          </linearGradient>

          {/* Soft 3D Gilded Pearl & Champagne Gold Inner Fill */}
          <linearGradient id={champagneFillId} x1="14" y1="14" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF6" stopOpacity="0.98" />
            <stop offset="48%" stopColor="#F9EAC1" stopOpacity="0.95" />
            <stop offset="82%" stopColor="#E5C578" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#C6993E" stopOpacity="0.9" />
          </linearGradient>

          {/* 3D Bas-Relief Embossed Gold ("Yaldızlı Kabartılı") Filter */}
          <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="-0.85" dy="-1.05" stdDeviation="0.38" floodColor="#FFFDF5" floodOpacity="0.96" />
            <feDropShadow dx="0.85" dy="1.35" stdDeviation="0.35" floodColor="#6E4B12" floodOpacity="0.62" />
            <feDropShadow dx="0" dy="3.2" stdDeviation="1.8" floodColor="#3A2608" floodOpacity="0.28" />
          </filter>
        </defs>

        {renderPaths()}
      </svg>
    </div>
  );
}
