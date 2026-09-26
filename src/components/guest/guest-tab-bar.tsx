"use client";

import { useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { getT, detectBrowserLanguage } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { Home, Compass, LayoutGrid, Building2, Sparkles, BookOpen } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';


type TabId = 'services' | 'experiences' | 'categories' | 'ai' | 'practical' | 'invest';

interface GuestTabBarProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  lang?: Language;
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
  const [shouldShow, setShouldShow] = useState(false);
  const [shouldShowDark, setShouldShowDark] = useState(true);

  useEffect(() => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const isGuestRoute = pathname?.startsWith('/stay') || pathname?.startsWith('/guest');
    setShouldShow(isNative || isGuestRoute);
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

  const tabs: { id: TabId; label: string; iconType: 'lucide' | 'image'; icon?: any; imgSrc?: string }[] = [
    { id: 'services', label: t.tabs.services, iconType: 'lucide', icon: Home },
    { id: 'categories', label: t.tabs.categories, iconType: 'lucide', icon: LayoutGrid },
    { id: 'ai', label: t.tabs.aiGuide, iconType: 'image', imgSrc: '/icons/menu/aiGuide.png' },
    { id: 'practical', label: t.tabs.practical, iconType: 'image', imgSrc: '/icons/menu/practical.png' },
    { id: 'invest', label: t.tabs.invest, iconType: 'lucide', icon: Building2 }
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

  const isServicesDarkOverall = true; // Always dark theme for all tabs

  return (
    <nav
      className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[99999] px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-colors duration-300 ${
        isServicesDarkOverall
          ? 'bg-black/10 backdrop-blur-[4px] border-t border-white/20 shadow-[0_-8px_24px_rgba(0,0,0,0.3)]'
          : 'bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
      }`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        zIndex: 99999,
        transform: 'none',
        WebkitTransform: 'none'
      }}
    >
      {/* iOS Overscroll / Rubber Banding gap filler */}
      <div 
        className={`absolute top-full left-0 right-0 h-[100px] -mt-[1px] transition-colors duration-300 ${
          isServicesDarkOverall
            ? 'bg-black/10 backdrop-blur-[4px]' 
            : 'bg-white/95 backdrop-blur-md'
        }`}
      />

      <div className="max-w-md mx-auto flex items-center justify-around relative z-10">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const isServicesDark = isServicesDarkOverall;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer active:scale-90 ${
                isActive 
                  ? (isServicesDark ? 'text-white font-bold' : 'text-amber-800 font-bold') 
                  : (isServicesDark ? 'text-white/60 hover:text-white' : 'text-zinc-500 hover:text-zinc-800')
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all ${
                isActive 
                  ? (isServicesDark ? 'bg-white/20 text-white shadow-[inset_0_1px_4px_rgba(255,255,255,0.3)] scale-105' : 'btn-3d text-amber-800 scale-105') 
                  : (isServicesDark ? 'hover:bg-white/10' : 'hover:bg-amber-50/80')
              }`}>
                {tab.iconType === 'image' && tab.imgSrc ? (
                  <div className="w-5 h-5 relative flex items-center justify-center">
                    <img
                      src={tab.imgSrc}
                      alt={tab.label}
                      style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                      className={isServicesDark && tab.id === 'ai' ? 'brightness-0 invert' : ''}
                    />
                  </div>
                ) : (
                  tab.icon && <tab.icon className="w-5 h-5" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

