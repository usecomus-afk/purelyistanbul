"use client";

import { useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { getT, detectBrowserLanguage } from '@/lib/i18n';
import { LayoutGrid } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

type TabId = 'services' | 'experiences' | 'categories' | 'ai' | 'practical' | 'invest';

interface GuestTabBarProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  lang?: Language;
}

/**
 * 3-Column Heritage Hotel Building SVG Icon matching reference bottom bar "Hotel"
 */
function LuxuryHotelBuildingIcon({ active }: { active: boolean }) {
  const strokeColor = active ? "#A67C46" : "currentColor";
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[22px] h-[22px]"
    >
      {/* Left Wing */}
      <path
        d="M4.5 22.5V10.5C4.5 10.22 4.72 10 5 10H9.5V22.5"
        stroke={strokeColor}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Wing */}
      <path
        d="M18.5 22.5V10H23C23.28 10 23.5 10.22 23.5 10.5V22.5"
        stroke={strokeColor}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Main Tower */}
      <path
        d="M9.5 22.5V6.5C9.5 6.22 9.72 6 10 6H18C18.28 6 18.5 6.22 18.5 6.5V22.5"
        stroke={strokeColor}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Tower Roof Crown */}
      <path
        d="M11.2 6V4.6H16.8V6"
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Tower Windows (2x3 grid) */}
      <rect x="11.3" y="8.2" width="1.8" height="1.8" rx="0.3" stroke={strokeColor} strokeWidth="1.15" />
      <rect x="14.9" y="8.2" width="1.8" height="1.8" rx="0.3" stroke={strokeColor} strokeWidth="1.15" />
      <rect x="11.3" y="11.5" width="1.8" height="1.8" rx="0.3" stroke={strokeColor} strokeWidth="1.15" />
      <rect x="14.9" y="11.5" width="1.8" height="1.8" rx="0.3" stroke={strokeColor} strokeWidth="1.15" />
      <rect x="11.3" y="14.8" width="1.8" height="1.8" rx="0.3" stroke={strokeColor} strokeWidth="1.15" />
      <rect x="14.9" y="14.8" width="1.8" height="1.8" rx="0.3" stroke={strokeColor} strokeWidth="1.15" />
      {/* Left Wing Windows */}
      <line x1="6.4" y1="12.5" x2="7.7" y2="12.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.4" y1="15.5" x2="7.7" y2="15.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.4" y1="18.5" x2="7.7" y2="18.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      {/* Right Wing Windows */}
      <line x1="20.3" y1="12.5" x2="21.6" y2="12.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20.3" y1="15.5" x2="21.6" y2="15.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20.3" y1="18.5" x2="21.6" y2="18.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      {/* Central Entrance Door */}
      <path
        d="M12.3 22.5V18.8C12.3 18.36 12.66 18 13.1 18H14.9C15.34 18 15.7 18.36 15.7 18.8V22.5"
        stroke={strokeColor}
        strokeWidth="1.25"
      />
      {/* Base Plinth Line */}
      <line x1="3" y1="22.5" x2="25" y2="22.5" stroke={strokeColor} strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Multi-line Nautilus / Vortex Spiral SVG Icon for comusAI matching reference bottom bar
 */
function LuxurySpiralIcon({ active }: { active: boolean }) {
  const strokeColor = active ? "#A67C46" : "currentColor";
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[24px] h-[24px]"
    >
      {/* Inner spiral core */}
      <path
        d="M11.8 16.5C10.9 16.5 10.2 15.8 10.2 14.9C10.2 13.7 11.2 12.7 12.4 12.7C14 12.7 15.3 14 15.3 15.6C15.3 17.6 13.7 19.2 11.7 19.2C9.2 19.2 7.2 17.2 7.2 14.7C7.2 11.6 9.7 9.1 12.8 9.1"
        stroke={strokeColor}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      {/* Concentric nautilus outer ribs */}
      <path
        d="M12.2 4.2C17.8 5.2 21.8 10.1 21.8 15.8C21.8 20.5 18 24.2 13.2 24.2C8.8 24.2 5.2 20.9 4.8 16.5"
        stroke={strokeColor}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M12.4 6.5C16.8 7.3 19.6 11.1 19.6 15.6C19.6 19.3 16.6 22.1 12.8 22.1C9.5 22.1 6.8 19.6 6.4 16.4"
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M12.6 8.8C15.6 9.4 17.5 12.1 17.5 15.4C17.5 18 15.4 20.1 12.6 20.1"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Clean Circular Info '(i)' SVG Icon for Guide matching reference bottom bar
 */
function LuxuryGuideInfoIcon({ active }: { active: boolean }) {
  const strokeColor = active ? "#A67C46" : "currentColor";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[22px] h-[22px]"
    >
      <circle cx="12" cy="12" r="9.25" stroke={strokeColor} strokeWidth="1.55" />
      <circle cx="12" cy="8" r="1" fill={strokeColor} />
      <line x1="12" y1="11.2" x2="12" y2="16.5" stroke={strokeColor} strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

export function GuestTabBar({
  activeTab: propActiveTab,
  onTabChange,
  lang: propLang
}: GuestTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState<TabId>(() => propActiveTab || 'services');
  const [currentLang, setCurrentLang] = useState<Language>(() => propLang || detectBrowserLanguage());
  const [shouldShow, setShouldShow] = useState(true);
  const [shouldShowDark, setShouldShowDark] = useState(true);

  useEffect(() => {
    const isCockpit = pathname?.startsWith('/cockpit') || pathname?.startsWith('/hotel-portal');
    setShouldShow(!isCockpit);
  }, [pathname]);

  // Sync prop changes
  useEffect(() => {
    if (propActiveTab) setCurrentTab(propActiveTab);
  }, [propActiveTab]);

  useEffect(() => {
    if (propLang) setCurrentLang(propLang);
  }, [propLang]);

  // Global event listeners
  useEffect(() => {
    const handleTabEvent = (e: any) => {
      if (e.detail?.tab) setCurrentTab(e.detail.tab);
    };
    const handleLangEvent = (e: any) => {
      if (e.detail?.lang) setCurrentLang(e.detail.lang);
    };
    const handleModalEvent = (e: any) => {
      setShouldShowDark(e.detail?.isOpen ? false : true);
    };

    window.addEventListener('xenios_tab_changed', handleTabEvent);
    window.addEventListener('xenios_lang_changed', handleLangEvent);
    window.addEventListener('xenios_modal_state', handleModalEvent);
    return () => {
      window.removeEventListener('xenios_tab_changed', handleTabEvent);
      window.removeEventListener('xenios_lang_changed', handleLangEvent);
      window.removeEventListener('xenios_modal_state', handleModalEvent);
    };
  }, []);

  const t = getT(currentLang);

  const tabs: { id: TabId; label: string; iconType: 'hotel' | 'grid' | 'spiral' | 'guide' }[] = [
    { id: 'services', label: t.tabs.services || 'Stay Essentials', iconType: 'hotel' },
    { id: 'categories', label: t.tabs.categories || 'Categories', iconType: 'grid' },
    { id: 'ai', label: 'Ask ComusAI', iconType: 'spiral' },
    { id: 'practical', label: t.tabs.practical || 'Guide', iconType: 'guide' }
  ];

  const handleTabClick = (tabId: TabId) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_tab_changed', { detail: { tab: tabId } }));
      if (tabId === 'ai') {
        window.dispatchEvent(new CustomEvent('xenios_open_ai'));
      }

      if (
        window.location.pathname !== '/' &&
        !window.location.pathname.startsWith('/stay') &&
        !window.location.pathname.startsWith('/guest')
      ) {
        router.push(`/guest?tab=${tabId}`);
      }
    }
  };

  if (!shouldShow) return null;

  const isHidden = !shouldShowDark;

  return (
    <nav
      className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[99999] px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] transition-all duration-300 ease-in-out backdrop-blur-xl border-t border-[#DFD8CA] pointer-events-auto after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-[50px] after:bg-[#EAE5DC] ${
        isHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        zIndex: 99999,
        background: 'linear-gradient(180deg, rgba(245, 242, 236, 0.96) 0%, rgba(234, 229, 220, 0.98) 100%)',
        borderTop: '1px solid #DFD8CA',
        boxShadow: '0 -6px 22px rgba(32, 26, 18, 0.08)',
        transform: isHidden ? 'translateY(100%)' : 'translateY(0)',
        WebkitTransform: isHidden ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-in-out'
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative z-10">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const isComusTrigger = tab.id === 'ai';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-0.5 px-3 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isComusTrigger
                  ? 'text-[#0B192C] font-bold'
                  : isActive
                    ? 'text-[#9E7035] font-semibold'
                    : 'text-[#222222] hover:text-[#000000] font-normal'
              }`}
            >
              <div
                className={`transition-all duration-300 flex items-center justify-center relative ${
                  isComusTrigger
                    ? 'w-11 h-11 rounded-full bg-gradient-to-br from-[#0B192C] to-[#162B47] border-[1.5px] border-[#D47A43] text-[#D47A43] shadow-[0_4px_14px_rgba(212,122,67,0.38)]'
                    : isActive
                      ? 'w-11 h-11 rounded-full bg-gradient-to-b from-[#FDFCF9] to-[#F0EAE0] border-[1.5px] border-[#C9AE82] text-[#A67C46] shadow-[0_5px_12px_rgba(60,45,20,0.16),inset_0_1px_2px_rgba(255,255,255,1)]'
                      : 'w-10 h-10 text-[#1E1E1E]'
                }`}
              >
                {isComusTrigger && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B192C] animate-pulse"
                    aria-hidden="true"
                  />
                )}
                {tab.iconType === 'hotel' && <LuxuryHotelBuildingIcon active={isActive} />}
                {tab.iconType === 'grid' && <LayoutGrid className="w-[21px] h-[21px] stroke-[1.55]" />}
                {tab.iconType === 'spiral' && <LuxurySpiralIcon active={true} />}
                {tab.iconType === 'guide' && <LuxuryGuideInfoIcon active={isActive} />}
              </div>
              <span className="font-luxury-sans text-[11.5px] tracking-[0.01em] mt-0.5 leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
