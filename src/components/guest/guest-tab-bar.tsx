"use client";

import { useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { getT, detectBrowserLanguage } from '@/lib/i18n';
import { Home, LayoutGrid, Compass } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

type TabId = 'services' | 'experiences' | 'categories' | 'ai' | 'practical' | 'invest';

interface GuestTabBarProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  lang?: Language;
}

/**
 * Minimalist fine-line Fibonacci / Golden Spiral SVG icon for comusAI
 */
function LuxurySpiralIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[22px] h-[22px]"
    >
      <path
        d="M12 12.5C12 11.95 12.45 11.5 13 11.5C13.83 11.5 14.5 12.17 14.5 13C14.5 14.38 13.38 15.5 12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 9.51 10.51 7.5 13 7.5C16.04 7.5 18.5 9.96 18.5 13C18.5 16.59 15.59 19.5 12 19.5C7.86 19.5 4.5 16.14 4.5 12C4.5 7.31 8.31 3.5 13 3.5C16.2 3.5 18.98 5.25 20.4 7.85"
        stroke={active ? "#6E501E" : "currentColor"}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
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

  const tabs: { id: TabId; label: string; iconType: 'lucide' | 'spiral'; icon?: any }[] = [
    { id: 'services', label: t.tabs.services, iconType: 'lucide', icon: Home },
    { id: 'categories', label: t.tabs.categories, iconType: 'lucide', icon: LayoutGrid },
    { id: 'ai', label: t.tabs.aiGuide, iconType: 'spiral' },
    { id: 'practical', label: t.tabs.practical, iconType: 'lucide', icon: Compass }
  ];

  const handleTabClick = (tabId: TabId) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_tab_changed', { detail: { tab: tabId } }));
      if (tabId === 'ai') {
        window.dispatchEvent(new CustomEvent('xenios_open_ai'));
      }

      // If we are on a sub-route (e.g. /complaints or /misafir-kalkani), navigate to / with query
      if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/stay')) {
        router.push(`/?tab=${tabId}`);
      }
    }
  };

  if (!shouldShow) return null;

  const isHidden = !shouldShowDark;

  return (
    <nav
      className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[99999] px-3 py-1.5 transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-xl border-t border-[#EAE2D4] shadow-[0_-6px_24px_rgba(32,26,18,0.05)] pointer-events-auto ${
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
        background: 'rgba(255, 255, 255, 0.96)',
        borderTop: '1px solid #EAE2D4',
        boxShadow: '0 -6px 24px rgba(32, 26, 18, 0.05)',
        transform: isHidden ? 'translateY(100%)' : 'translateY(0)',
        WebkitTransform: isHidden ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-in-out'
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative z-10">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-0.5 px-3 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#6E501E] font-medium'
                  : 'text-[#6E685F] hover:text-[#23201D] font-normal'
              }`}
            >
              <div
                className={`transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'w-9 h-9 rounded-full bg-gradient-to-br from-[#FBF7F0] via-[#F2E6CF] to-[#E4CFA7] border border-[#C5A059]/65 text-[#6E501E] shadow-[0_3px_10px_rgba(176,138,62,0.20),inset_0_1px_1.5px_rgba(255,255,255,0.95)]'
                    : 'w-9 h-9 text-[#524D46]'
                }`}
              >
                {tab.iconType === 'spiral' ? (
                  <LuxurySpiralIcon active={isActive} />
                ) : (
                  tab.icon && <tab.icon className="w-[20px] h-[20px] stroke-[1.35]" />
                )}
              </div>
              <span className="font-luxury-sans text-[11px] tracking-[0.015em] mt-0.5 leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
