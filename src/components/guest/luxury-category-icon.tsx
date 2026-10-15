"use client";

import React, { useId } from 'react';

interface LuxuryCategoryIconProps {
  categoryKey: string;
  className?: string;
}

/**
 * Bespoke European luxury fine line-art + 3D champagne/bronze vector icons
 * for the 12 Istanbul Categories, matching the exact aesthetic, stroke gradients,
 * 3D champagne fills, and drop shadows of LuxuryServiceIcon on the Hotel page.
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
    // 1. History & Museums (Tarih & Müzeler) — Historic Mosque Dome & Flanking Minarets
    if (key.includes('tarih') || key.includes('history') || key.includes('müze')) {
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

    // 2. Gastronomy & Fine Dining (Gastronomi & Gurme) — Domed Cloche Platter & Crystal Wine Goblet
    if (key.includes('gastro') || key.includes('gurme')) {
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

    // 3. Art & Whirling Dervish (Sanat & Semazen) — Graceful Semazen Silhouette & Sparkles
    if (key.includes('sanat') || key.includes('semazen') || key.includes('art')) {
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

    // 4. Shopping & Grand Bazaars (Alışveriş & Çarşılar) — Luxury Boutique Bag & Grand Bazaar Lantern
    if (key.includes('alışveriş') || key.includes('çarşı') || key.includes('shopping')) {
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

    // 5. Bosphorus & Yacht Cruises (Boğaz Turları & Yat) — Sleek Luxury Motor Yacht & Waves
    if (key.includes('boğaz') || key.includes('yat') || key.includes('bosphorus')) {
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

    // 6. Cultural Heritage (Kültürel Miras) — Ornate Ottoman Ewer (İbrik) & Turkish Tulip Motif
    if (key.includes('kültür') || key.includes('miras') || key.includes('culture')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Ewer (İbrik) Body */}
          <path
            d="M24 27C24 27 18.5 31 18.5 38C18.5 43.5 22.8 47.5 28 47.5C33.2 47.5 37.5 43.5 37.5 38C37.5 31 32 27 32 27H24Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Ewer Tall Neck & Lid Dome */}
          <path
            d="M25.5 27V18.5H30.5V27"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
          />
          <path
            d="M25 18.5C25 15.5 26.3 13.5 28 13.5C29.7 13.5 31 15.5 31 18.5H25Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
          />
          {/* Ornate S-Curved Spout on Left */}
          <path
            d="M20.5 34.5C15.5 32.5 14.5 26.5 12.5 23.5"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          {/* Ornate Curved Handle on Right */}
          <path
            d="M30.5 20.5C38.5 20.5 41.5 26.5 41.5 32.5C41.5 37.5 37.5 41 35.5 41.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          {/* Ewer Footed Base */}
          <path
            d="M23.5 47.5L21.5 51H34.5L32.5 47.5"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          {/* Ottoman Tulip Motif Inside Body */}
          <path
            d="M28 33.5C26 35.5 25 38 26.2 40.5C27 42 29 42 29.8 40.5C31 38 30 35.5 28 33.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.35"
          />
        </g>
      );
    }

    // 7. Turkish Hammam & Spa (Türk Hamamı & Spa) — Fluted Marble Basin, Lotus & Folded Towels
    if (key.includes('hamam') || key.includes('spa')) {
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

    // 8. Rooftop Photo & Costume (Fotoğraf & Kostüm) — Luxury Camera with 3D Metallic Lens & Sparkles
    if (key.includes('fotoğraf') || key.includes('kostüm') || key.includes('photo')) {
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
            fill="#FAF7F1"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.5"
          />
          {/* Flash & Sparkle Star */}
          <circle cx="45.5" cy="28.5" r="1.4" fill="#8E7252" />
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

    // 9. Private VIP Transfer (Özel VIP Transfer) — Executive Luxury Sedan & VIP Crown Shield
    if (key.includes('transfer') || key.includes('vip')) {
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
          <circle cx="19.5" cy="46.5" r="1.6" fill="#22252A" />
          <circle cx="44.5" cy="46.5" r="4.2" fill={`url(#${goldFillId})`} stroke={`url(#${bronzeGradId})`} strokeWidth="1.65" />
          <circle cx="44.5" cy="46.5" r="1.6" fill="#22252A" />
        </g>
      );
    }

    // 10. Recommended Restaurants (Önerdiğimiz Restoranlar) — Fine Porcelain Plate, Fork & Knife
    if (key.includes('restoran') || key.includes('restaurant')) {
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

    // 11. Medical Aesthetics & Beauty (Medikal Estetik & Güzellik) — Elixir Dropper Bottle & Diamond Mirror
    if (key.includes('estetik') || key.includes('aesthetic') || key.includes('güzellik')) {
      return (
        <g filter={`url(#${shadowFilterId})`}>
          {/* Ornate Oval Beauty Mirror on Right */}
          <ellipse
            cx="39.5"
            cy="29.5"
            rx="9.5"
            ry="12.5"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.65"
          />
          <ellipse
            cx="39.5"
            cy="29.5"
            rx="6.8"
            ry="9.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.25"
          />
          <path
            d="M39.5 42V50M34.5 50H44.5"
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          {/* Luxury Serum Dropper Bottle on Left */}
          <path
            d="M19.5 16.5C19.5 14.8 20.8 13.5 22.5 13.5C24.2 13.5 25.5 14.8 25.5 16.5V21.5H19.5V16.5Z"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.55"
          />
          <rect
            x="17.5"
            y="21.5"
            width="10"
            height="3"
            rx="1"
            fill="#FAF7F1"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.5"
          />
          <path
            d="M18.5 24.5L15.5 29V47.5C15.5 49.2 16.8 50.5 18.5 50.5H26.5C28.2 50.5 29.5 49.2 29.5 47.5V29L26.5 24.5H18.5Z"
            fill={`url(#${champagneFillId})`}
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <rect
            x="18.8"
            y="33.5"
            width="7.4"
            height="10.5"
            rx="1.2"
            fill={`url(#${goldFillId})`}
            stroke={`url(#${bronzeGradId})`}
            strokeWidth="1.3"
          />
        </g>
      );
    }

    // 12. Invest in Istanbul (İstanbul'da Yatırım) — Luxury Residence Towers & Rising Growth Arrow
    return (
      <g filter={`url(#${shadowFilterId})`}>
        {/* Left Tower */}
        <path
          d="M14.5 49.5V25.5C14.5 24.4 15.4 23.5 16.5 23.5H25.5V49.5"
          fill={`url(#${champagneFillId})`}
          stroke={`url(#${strokeGradId})`}
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        {/* Central Taller Prestige Tower */}
        <path
          d="M25.5 49.5V16.5C25.5 15.4 26.4 14.5 27.5 14.5H38.5C39.6 14.5 40.5 15.4 40.5 16.5V49.5"
          fill={`url(#${goldFillId})`}
          stroke={`url(#${strokeGradId})`}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        {/* Tower Window Lines */}
        <path
          d="M29.5 20.5H36.5M29.5 25.5H36.5M29.5 30.5H36.5M18.5 29.5H22M18.5 34.5H22"
          stroke={`url(#${strokeGradId})`}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Rising Investment Shield / Coin & Upward Trend Arrow */}
        <circle
          cx="44.5"
          cy="38.5"
          r="7.5"
          fill={`url(#${champagneFillId})`}
          stroke={`url(#${bronzeGradId})`}
          strokeWidth="1.65"
        />
        <path
          d="M41.5 41L44.5 36L47.5 38.5L51.5 21.5"
          stroke={`url(#${bronzeGradId})`}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M47 21.5H51.8V26.2"
          stroke={`url(#${bronzeGradId})`}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="10.5" y1="49.5" x2="53.5" y2="49.5" stroke={`url(#${strokeGradId})`} strokeWidth="1.7" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Left-Charcoal (#1D2025) to Right-Bronze (#8E7252) Dual-Tone Metallic Stroke */}
        <linearGradient id={strokeGradId} x1="10" y1="14" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D2025" />
          <stop offset="48%" stopColor="#3B352F" />
          <stop offset="100%" stopColor="#8E7252" />
        </linearGradient>

        {/* Warm Metallic Bronze Stroke */}
        <linearGradient id={bronzeGradId} x1="26" y1="12" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A68763" />
          <stop offset="50%" stopColor="#826544" />
          <stop offset="100%" stopColor="#5E472E" />
        </linearGradient>

        {/* 3D Embossed Champagne Gold Fill */}
        <linearGradient id={goldFillId} x1="16" y1="14" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBF6EC" />
          <stop offset="52%" stopColor="#E6D5B8" />
          <stop offset="100%" stopColor="#C8AE86" />
        </linearGradient>

        {/* Soft 3D Warm Ivory / Champagne Fill */}
        <linearGradient id={champagneFillId} x1="14" y1="16" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#F4EDE1" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#E5D8C3" stopOpacity="0.85" />
        </linearGradient>

        {/* Soft 3D Embossed Drop Shadow */}
        <filter id={shadowFilterId} x="-12%" y="-10%" width="124%" height="128%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#2A2118" floodOpacity="0.18" />
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.4" floodColor="#FFFFFF" floodOpacity="0.85" />
        </filter>
      </defs>

      {renderPaths()}
    </svg>
  );
}
