"use client";

import React, { useId } from 'react';

interface LuxuryCategoryIconProps {
  categoryKey: string;
  className?: string;
}

/**
 * Bespoke European luxury fine line-art + 3D champagne/bronze vector icons
 * for all Istanbul Categories, Guide modules (Istanbulkart, MuseumPass, Guest Shield,
 * Emergency, Ombudsman/Complaints, Online Check-in KBS, Taxi), matching the exact
 * aesthetic, stroke gradients, 3D champagne fills, and drop shadows of the Hotel page.
 */
export function LuxuryCategoryIcon({
  categoryKey,
  className = "w-16 h-16 sm:w-20 sm:h-20",
}: LuxuryCategoryIconProps) {
  const uid = useId().replace(/:/g, '');
  const strokeGradId = `cat-stroke-${uid}`;
  const bronzeGradId = `cat-bronze-${uid}`;
  const goldFillId = `cat-gold-${uid}`;
  const champagneFillId = `cat-champagne-${uid}`;
  const shadowFilterId = `cat-shadow-${uid}`;

  const key = (categoryKey || '').toLowerCase();

  const renderPaths = () => {
    // Special Guide / Utility Icons:
    // A. Official Istanbulkart & Public Transit Card
    if (key.includes('istanbulkart') || key.includes('transit-card')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Angled Rear Card */}
          <rect
            x="16"
            y="16"
            width="36"
            height="23"
            rx="3.5"
            transform="rotate(-8 16 16)"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
          />
          {/* Front Smart Transit Card */}
          <rect
            x="12"
            y="22"
            width="40"
            height="26"
            rx="4"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          {/* EMV Smart Chip */}
          <rect
            x="17"
            y="29"
            width="8"
            height="6.5"
            rx="1.2"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.35"
          />
          {/* Contactless NFC Waves */}
          <path
            d="M42.5 29.5C44.2 31 44.2 33.5 42.5 35M45 27.5C47.8 30 47.8 34.5 45 37"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Card Horizon Wave & Tram Silhouette Line */}
          <path
            d="M12.5 41.5C20 39.5 26 43 34 41.5C40 40.2 46 41 51.5 42"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // B. Official MuseumPass (MüzeKart)
    if (key.includes('muzekart') || key.includes('museum-pass')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Classical Museum Pediment & Columns */}
          <path
            d="M14 25L32 14L50 25H14Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <rect
            x="15.5"
            y="25"
            width="33"
            height="3.2"
            rx="0.8"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.45"
          />
          {/* 4 Fluted Columns */}
          <path
            d="M19.5 28.2V44.5M27.5 28.2V44.5M36.5 28.2V44.5M44.5 28.2V44.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          {/* VIP Pass Ticket Overlapping Bottom-Right */}
          <rect
            x="28"
            y="36"
            width="24"
            height="14"
            rx="2.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.55"
          />
          <circle cx="34.5" cy="43" r="2.2" fill="#FAF7F1" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
          <line x1="39.5" y1="41.2" x2="47.5" y2="41.2" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" strokeLinecap="round" />
          <line x1="39.5" y1="44.8" x2="45.5" y2="44.8" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" strokeLinecap="round" />
          {/* Museum Steps Base */}
          <path
            d="M13 44.8H26.5M11 48.2H26.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // C. Guest Shield / Legal Rights (Misafir Kalkanı)
    if (key.includes('shield') || key.includes('kalkan')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Outer 3D Crest Shield */}
          <path
            d="M32 12L15 18.5V31.5C15 42.2 22.3 49.8 32 53C41.7 49.8 49 42.2 49 31.5V18.5L32 12Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Inner Metallic Gold Shield Bevel */}
          <path
            d="M32 16.2L19 21.2V31.2C19 39.6 24.6 45.8 32 48.6C39.4 45.8 45 39.6 45 31.2V21.2L32 16.2Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Checkmark / Star Emblem Inside Shield */}
          <path
            d="M26.5 32.2L30.2 36L38.2 27.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    // D. Emergency / SOS Support (Acil Çağrı & Destek)
    if (key.includes('emergency') || key.includes('sos') || key.includes('acil')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* 3D Circular Emergency Medallion */}
          <circle
            cx="32"
            cy="33"
            r="17"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          <circle
            cx="32"
            cy="33"
            r="13"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.35"
          />
          {/* Classic Handset Receiver Inside */}
          <path
            d="M25.5 27.5C24.5 29.5 25.5 33.5 28.5 36.5C31.5 39.5 35.5 40.5 37.5 39.5L39.5 37.5C40.2 36.8 40.2 35.8 39.5 35.1L37.2 33.5C36.5 33 35.5 33.2 34.8 33.8L33.8 34.8C32.2 34 30.8 32.6 30 31L31 30C31.6 29.3 31.8 28.3 31.3 27.6L29.7 25.3C29 24.6 28 24.6 27.3 25.3L25.5 27.5Z"
            fill="#FAF7F1"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Top Signal Rays */}
          <path
            d="M32 11V13.5M23 13L24.5 15M41 13L39.5 15"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // E. Ombudsman / Fair Shopping / Scales of Justice (Adil Alışveriş & Şikayet)
    if (key.includes('complaint') || key.includes('ombudsman') || key.includes('scale') || key.includes('bad-experience')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Central Pillar & Pedestal */}
          <line x1="32" y1="14" x2="32" y2="49" stroke={`url(#${strokeGradId})`} strokeWidth="1.75" strokeLinecap="round" />
          <path
            d="M21 49.5H43"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.85"
            strokeLinecap="round"
          />
          <rect
            x="24.5"
            y="46"
            width="15"
            height="3.5"
            rx="1.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.5"
          />
          {/* Balance Beam */}
          <path
            d="M15 21.5L32 18.5L49 21.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          {/* Left Scale Pan */}
          <path
            d="M15 21.5L11 33.5H19L15 21.5Z"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M10 33.5C10 36.5 12.2 38.5 15 38.5C17.8 38.5 20 36.5 20 33.5H10Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
          />
          {/* Right Scale Pan */}
          <path
            d="M49 21.5L45 33.5H53L49 21.5Z"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M44 33.5C44 36.5 46.2 38.5 49 38.5C51.8 38.5 54 36.5 54 33.5H44Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.55"
          />
        </g>
      );
    }

    // F. Online Check-in & KBS Biometric Passport
    if (key.includes('kbs') || key.includes('checkin') || key.includes('passport')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Passport Booklet */}
          <rect
            x="16"
            y="13"
            width="28"
            height="38"
            rx="3.5"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          {/* Globe Emblem on Passport Cover */}
          <circle
            cx="30"
            cy="27.5"
            r="6.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.45"
          />
          <ellipse cx="30" cy="27.5" rx="3" ry="6.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
          <line x1="23.5" y1="27.5" x2="36.5" y2="27.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.25" />
          {/* Biometric Chip Symbol at Bottom */}
          <line x1="24" y1="41" x2="36" y2="41" stroke={`url(#${strokeGradId})`} strokeWidth="1.5" strokeLinecap="round" />
          {/* Verified Check Badge Overlapping Bottom-Right */}
          <circle
            cx="43"
            cy="41.5"
            r="7.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.6"
          />
          <path
            d="M39.8 41.5L42 43.8L46.5 39"
            stroke="#5C3F10"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    // G. Taxi (Sarı Taksi)
    if (key.includes('taxi') || key.includes('taksi')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Taxi Roof Sign */}
          <rect
            x="26.5"
            y="17"
            width="11"
            height="4.5"
            rx="1.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
          />
          {/* Cabin Roof */}
          <path
            d="M17.5 31.5L22.5 21.5H41.5L46.5 31.5H17.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <line x1="32" y1="21.5" x2="32" y2="31.5" stroke={`url(#${strokeGradId})`} strokeWidth="1.45" />
          {/* Car Body */}
          <path
            d="M11 36C11 33.5 13 31.5 15.5 31.5H48.5C51 31.5 53 33.5 53 36V42.5C53 43.6 52.1 44.5 51 44.5H13C11.9 44.5 11 43.6 11 42.5V36Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          {/* Wheels */}
          <circle cx="19.5" cy="44.5" r="4.2" fill={`url(#${champagneFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.65" />
          <circle cx="44.5" cy="44.5" r="4.2" fill={`url(#${champagneFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.65" />
        </g>
      );
    }

    // 1. Historic Routes & Fast-Track Walks — Historic Mosque Dome & Flanking Minarets
    if (key === 'cat-2' || key.includes('tarih') || key.includes('history') || key.includes('historic') || key.includes('müze')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Left & Right Minarets */}
          <path
            d="M12.5 49V20.5L14.2 15.5L15.9 20.5V49"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <line x1="11.5" y1="25" x2="16.9" y2="25" stroke={`url(#${strokeGradId})`} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M48.1 49V20.5L49.8 15.5L51.5 20.5V49"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <line x1="47.1" y1="25" x2="52.5" y2="25" stroke={`url(#${bronzeGradId})`} strokeWidth="1.5" strokeLinecap="round" />

          {/* Central Mosque Sanctuary Base */}
          <rect
            x="17.5"
            y="33.5"
            width="29"
            height="15.5"
            rx="1.5"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
          />
          {/* Central Ribbed Dome */}
          <path
            d="M19.5 33.5C19.5 24.8 25.1 19 32 19C38.9 19 44.5 24.8 44.5 33.5H19.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          {/* Dome Rib & Finial Spire */}
          <path
            d="M32 19V14.5M26.5 33.5C26.5 26.5 29 20.5 32 19C35 20.5 37.5 26.5 37.5 33.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          {/* Arched Entrance Portal & Windows */}
          <path
            d="M28.2 49V41.2C28.2 39.1 29.9 37.5 32 37.5C34.1 37.5 35.8 39.1 35.8 41.2V49"
            fill="#FAF6EE"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
          />
          <circle cx="22.5" cy="40.5" r="1.8" stroke={`url(#${strokeGradId})`} strokeWidth="1.35" />
          <circle cx="41.5" cy="40.5" r="1.8" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" />
          {/* Plinth Base Line */}
          <line x1="9.5" y1="49.2" x2="54.5" y2="49.2" stroke={`url(#${strokeGradId})`} strokeWidth="1.75" strokeLinecap="round" />
        </g>
      );
    }

    // 2. Culinary & Street Food Trails — Domed Cloche Platter & Crystal Wine Goblet
    if (key === 'cat-3' || key.includes('gastro') || key.includes('gurme') || key.includes('culinary') || key.includes('street food')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Wine Bottle / Carafe Neck behind */}
          <path
            d="M44.5 16.5C44.5 22.5 41 25.5 41 30.5C41 34.4 43.8 37 47.2 37C50.6 37 53.4 34.4 53.4 30.5C53.4 25.5 49.9 22.5 49.9 16.5H44.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Crystal Goblet Stem & Base */}
          <line x1="47.2" y1="37" x2="47.2" y2="48.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="42.5" y1="48.5" x2="52" y2="48.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.65" strokeLinecap="round" />
          <path d="M42.2 29.5H52.2" stroke={`url(#${bronzeGradId})`} strokeWidth="1.3" strokeLinecap="round" />

          {/* Fine Dining Cloche Dome */}
          <path
            d="M11.5 43.5C11.5 34.2 18.2 27.5 26.8 27.5C35.4 27.5 42.1 34.2 42.1 43.5H11.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Cloche Ring Handle */}
          <circle
            cx="26.8"
            cy="25"
            r="2.4"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
          />
          {/* Specular Highlight Arc */}
          <path
            d="M16.8 39C18 34.8 21.2 31.8 25.2 31"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Silver Platter Base */}
          <rect
            x="9.5"
            y="43.5"
            width="34.6"
            height="3.5"
            rx="1.75"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.6"
          />
          {/* Rising Aroma Steam Curls */}
          <path
            d="M19.5 21.5C18.5 19.5 20.5 18 19.5 16M26.8 19.5C25.8 17.5 27.8 16 26.8 14"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // 3. Arts & Whirling Dervishes — Graceful Semazen Silhouette & Sparkles
    if (key === 'cat-5' || key.includes('sanat') || key.includes('semazen') || key.includes('dervish') || key.includes('arts &')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Tall Sikke Hat */}
          <path
            d="M29.2 13.5C29.2 12.1 30.4 11 32 11C33.6 11 34.8 12.1 34.8 13.5L34.2 20.5H29.8L29.2 13.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          {/* Head & Torso */}
          <circle cx="32" cy="23.2" r="2.5" fill={`url(#${champagneFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.5" />
          {/* Raised Right Arm & Lowered Left Arm */}
          <path
            d="M17.5 21.5L26.5 27.5H37.5L46.5 24.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Flowing Pleated Tennure Skirt */}
          <path
            d="M27.5 28.5L13.5 47.5C18.5 50.5 25 51.5 32 51.5C39 51.5 45.5 50.5 50.5 47.5L36.5 28.5H27.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Pleat Fold Lines */}
          <path
            d="M29.5 31.5L22.5 49.5M32 31.5V51.2M34.5 31.5L41.5 49.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* 4-Point Concave Sparkle on Right */}
          <path
            d="M47 13C47 15.8 47.8 16.6 50.6 16.6C47.8 16.6 47 17.4 47 20.2C47 17.4 46.2 16.6 43.4 16.6C46.2 16.6 47 15.8 47 13Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    // 4. Curated Artisan & Bazaar Shopping — Luxury Boutique Bag & Grand Bazaar Lantern
    if (key === 'cat-8' || key.includes('alışveriş') || key.includes('çarşı') || key.includes('shopping') || key.includes('bazaar') || key.includes('artisan')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Rear Boutique Gift Bag */}
          <path
            d="M28.5 22.5H49.5L51.5 47.5C51.6 48.9 50.5 50 49.1 50H30.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M35.5 22.5V18.5C35.5 15.7 37.7 13.5 40.5 13.5C43.3 13.5 45.5 15.7 45.5 18.5V22.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          {/* Front Primary Luxury Bag */}
          <path
            d="M13.5 26.5H37.5L39.5 48.5C39.6 49.9 38.5 51 37.1 51H13.9C12.5 51 11.4 49.9 11.5 48.5L13.5 26.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Bag Cord Handles */}
          <path
            d="M20 29.5V21.5C20 18.5 22.5 16 25.5 16C28.5 16 31 18.5 31 21.5V29.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          {/* Diamond Emblem on Front Bag */}
          <path
            d="M25.5 34.5L29.5 39.5L25.5 44.5L21.5 39.5L25.5 34.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    // 5. Bosphorus & Boat Cruises — Sleek Luxury Motor Yacht & Waves
    if (key === 'cat-1' || key.includes('boğaz') || key.includes('yat') || key.includes('bosphorus') || key.includes('boat') || key.includes('cruise')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Upper Cabin & Flybridge */}
          <path
            d="M18.5 32.5L23.5 24.5H40.5L45.5 32.5H18.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M26.5 24.5L29.5 19.5H37.5L35.5 24.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Cabin Panoramic Windows */}
          <path
            d="M24.5 28.5H39.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          {/* Yacht Hull */}
          <path
            d="M10.5 32.5H54.5L48.5 42.5H14.5L10.5 32.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <line x1="13.5" y1="36.5" x2="50.5" y2="36.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" strokeLinecap="round" />
          {/* Bosphorus Wavy Water Lines */}
          <path
            d="M9.5 46.5C13 44.8 16.5 44.8 20 46.5C23.5 48.2 27 48.2 30.5 46.5C34 44.8 37.5 44.8 41 46.5C44.5 48.2 48 48.2 51.5 46.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M15.5 51C18.5 49.6 21.5 49.6 24.5 51C27.5 52.4 30.5 52.4 33.5 51C36.5 49.6 39.5 49.6 42.5 51"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.45"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // 6. Traditional Turkish Bath & Hammam Rituals — Fluted Marble Basin, Lotus & Folded Towels
    if (key === 'cat-4' || key.includes('hamam') || key.includes('hammam') || key.includes('spa') || key.includes('bath')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Lotus / Spa Blossom Above */}
          <path
            d="M32 14.5C29.2 18.5 28.5 23.5 32 27.5C35.5 23.5 34.8 18.5 32 14.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M32 27.5C26.5 26.5 22.5 22.5 22 18.5C26 18.8 29.5 21.5 32 27.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M32 27.5C37.5 26.5 41.5 22.5 42 18.5C38 18.8 34.5 21.5 32 27.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Fluted Hammam Bowl (Hamam Tası / Kurna) */}
          <path
            d="M14.5 32.5H49.5C49.5 41.5 42 47.5 32 47.5C22 47.5 14.5 41.5 14.5 32.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Fluted Ribs on Basin */}
          <path
            d="M23.5 32.5C23.5 39.5 26.8 45.5 32 47.5M40.5 32.5C40.5 39.5 37.2 45.5 32 47.5M32 32.5V47.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          {/* Pedestal Base */}
          <rect
            x="22.5"
            y="47.5"
            width="19"
            height="3.2"
            rx="1.6"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
          />
        </g>
      );
    }

    // 7. Rooftop Photography & Costumes — Luxury Camera with 3D Metallic Lens & Sparkles
    if (key === 'cat-6' || key.includes('fotoğraf') || key.includes('kostüm') || key.includes('photo') || key.includes('rooftop')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Camera Body */}
          <rect
            x="12.5"
            y="23.5"
            width="39"
            height="26"
            rx="4.5"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          {/* Camera Top Viewfinder Prism & Shutter Button */}
          <path
            d="M23.5 23.5L26 18.5H38L40.5 23.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <line x1="16.5" y1="20.5" x2="20.5" y2="20.5" stroke={`url(#${strokeGradId})`} strokeWidth="1.7" strokeLinecap="round" />
          {/* Outer & Inner 3D Metallic Lens Rings */}
          <circle
            cx="32"
            cy="36.5"
            r="8.8"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
          />
          <circle
            cx="32"
            cy="36.5"
            r="5.2"
            fill="#FFFDF5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
          />
          {/* Flash & Sparkle Star */}
          <circle cx="45.5" cy="28.5" r="1.4" fill="#B6862C" />
          <path
            d="M49 12C49 14.5 49.8 15.3 52.3 15.3C49.8 15.3 49 16.1 49 18.6C49 16.1 48.2 15.3 45.7 15.3C48.2 15.3 49 14.5 49 12Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    // 8. Private VIP Airport Transfers (Licensed Fleets) — Executive Luxury Sedan & VIP Crown Shield
    if (key === 'cat-7' || key.includes('transfer') || key.includes('vip') || key.includes('airport')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* VIP Crown / Shield Above */}
          <path
            d="M25.5 18.5L27.5 13.5L32 16.5L36.5 13.5L38.5 18.5H25.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
          {/* Executive Sedan Roof & Windows */}
          <path
            d="M17.5 34.5L22.5 25.5H41.5L46.5 34.5H17.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <line x1="32" y1="25.5" x2="32" y2="34.5" stroke={`url(#${strokeGradId})`} strokeWidth="1.45" />
          {/* Lower Body Chassis */}
          <path
            d="M10.5 39C10.5 36.5 12.5 34.5 15 34.5H49C51.5 34.5 53.5 36.5 53.5 39V44.5C53.5 45.6 52.6 46.5 51.5 46.5H12.5C11.4 46.5 10.5 45.6 10.5 44.5V39Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          {/* Front & Rear 3D Wheels */}
          <circle cx="19.5" cy="46.5" r="4.2" fill={`url(#${goldFillId})`} stroke={`url(#${strokeGradId})`} strokeWidth="1.65" />
          <circle cx="19.5" cy="46.5" r="1.6" fill="#7A5618" />
          <circle cx="44.5" cy="46.5" r="4.2" fill={`url(#${goldFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.65" />
          <circle cx="44.5" cy="46.5" r="1.6" fill="#7A5618" />
        </g>
      );
    }

    // 9. In-Stay Breakfast & Gourmet Catering — Fine Porcelain Plate, Fork & Knife
    if (key === 'cat-9' || key.includes('breakfast') || key.includes('catering') || key.includes('restoran') || key.includes('restaurant')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Left Fork */}
          <path
            d="M12.5 18.5V27.5C12.5 29.2 13.8 30.5 15.5 30.5C17.2 30.5 18.5 29.2 18.5 27.5V18.5M15.5 18.5V48.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Knife */}
          <path
            d="M49.5 48.5V18.5C52.2 20.5 53.2 25.5 52.8 31.5H49.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Outer Porcelain Dinner Plate */}
          <circle
            cx="32.5"
            cy="34"
            r="12"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
          />
          {/* Inner Gold Rim */}
          <circle
            cx="32.5"
            cy="34"
            r="8"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.4"
          />
          {/* Culinary Star Emblem in Center */}
          <path
            d="M32.5 29.5C32.5 32.2 33.3 33 36 33C33.3 33 32.5 33.8 32.5 36.5C32.5 33.8 31.7 33 29 33C31.7 33 32.5 32.2 32.5 29.5Z"
            fill="#FAF7F1"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.2"
          />
        </g>
      );
    }

    // 10. In-Stay Express Laundry & Garment Care — Luxury Valet Hanger, Folded Linens & Sparkle
    return (
      <g filter={`url(#${shadowFilterId})`}>
        {/* Hook */}
        <path
          d="M29.5 16.5C29.5 14.3 31.2 12.5 33.5 12.5C35.8 12.5 37.5 14.3 37.5 16.5C37.5 18.5 35.5 19.5 32 21V23.5"
          stroke={`url(#${bronzeGradId})`}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        {/* Wooden / Brass Valet Hanger Shoulders */}
        <path
          d="M12.5 35.5L32 23.5L51.5 35.5C52.6 36.2 52.1 38 50.8 38H13.2C11.9 38 11.4 36.2 12.5 35.5Z"
          fill={`url(#${goldFillId})`}
          stroke={`url(#${strokeGradId})`}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        {/* Pressed Garment Fold Draped Over Bar */}
        <rect
          x="19.5"
          y="38"
          width="25"
          height="12.5"
          rx="2.5"
          fill={`url(#${champagneFillId})`}
          stroke={`url(#${strokeGradId})`}
          strokeWidth="1.65"
        />
        <line x1="24" y1="43.5" x2="40" y2="43.5" stroke={`url(#${bronzeGradId})`} strokeWidth="1.35" strokeLinecap="round" />
        {/* Sparkle Star */}
        <path
          d="M48 15C48 17.5 48.8 18.3 51.3 18.3C48.8 18.3 48 19.1 48 21.6C48 19.1 47.2 18.3 44.7 18.3C47.2 18.3 48 17.5 48 15Z"
          fill={`url(#${goldFillId})`}
          stroke={`url(#${bronzeGradId})`}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      aria-hidden="true"
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

        {/* Luminous Gilded Gold Leaf Accent & Filigree Stroke */}
        <linearGradient id={bronzeGradId} x1="18" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DEB54A" />
          <stop offset="42%" stopColor="#F7DF8A" />
          <stop offset="72%" stopColor="#B88624" />
          <stop offset="100%" stopColor="#724E12" />
        </linearGradient>

        {/* 3D Embossed 24K Gold Leaf Fill */}
        <linearGradient id={goldFillId} x1="14" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFCEE" />
          <stop offset="28%" stopColor="#F9E292" />
          <stop offset="65%" stopColor="#D8A83B" />
          <stop offset="100%" stopColor="#9B6D1A" />
        </linearGradient>

        {/* Soft 3D Gilded Pearl & Champagne Gold Relief Fill */}
        <linearGradient id={champagneFillId} x1="12" y1="14" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF6" stopOpacity="0.98" />
          <stop offset="45%" stopColor="#F9EAC1" stopOpacity="0.95" />
          <stop offset="82%" stopColor="#E5C578" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#C6993E" stopOpacity="0.9" />
        </linearGradient>

        {/* 3D Bas-Relief Embossed Gold ("Yaldızlı Kabartılı") Filter */}
        <filter id={shadowFilterId} x="-18%" y="-16%" width="136%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="-0.85" dy="-1.05" stdDeviation="0.38" floodColor="#FFFDF5" floodOpacity="0.96" />
          <feDropShadow dx="0.85" dy="1.35" stdDeviation="0.35" floodColor="#6E4B12" floodOpacity="0.62" />
          <feDropShadow dx="0" dy="3.2" stdDeviation="1.8" floodColor="#3A2608" floodOpacity="0.28" />
        </filter>
      </defs>

      {renderPaths()}
    </svg>
  );
}

