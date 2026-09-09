"use client";

import { useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { getT, detectBrowserLanguage } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { Home, Compass, LayoutGrid, Building2 } from 'lucide-react';
import Image from 'next/image';
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

    window.addEventListener('xenios_tab_changed', handleTabEvent);
    window.addEventListener('xenios_lang_changed', handleLangEvent);
    return () => {
      window.removeEventListener('xenios_tab_changed', handleTabEvent);
      window.removeEventListener('xenios_lang_changed', handleLangEvent);
    };
  }, []);

  const t = getT(currentLang);

  const tabs: { id: TabId; label: string; iconType: 'lucide' | 'image'; icon?: any; imgSrc?: string }[] = [
    { id: 'services', label: t.tabs.services, iconType: 'lucide', icon: Home },
    { id: 'experiences', label: t.tabs.experiences, iconType: 'lucide', icon: Compass },
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

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[99999] border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
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
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer active:scale-90 ${
                isActive 
                  ? 'text-amber-800 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all ${
                isActive 
                  ? 'btn-3d text-amber-800 scale-105' 
                  : 'hover:bg-amber-50/80'
              }`}>
                {tab.iconType === 'image' && tab.imgSrc ? (
                  <div className="w-5 h-5 relative flex items-center justify-center">
                    <Image
                      src={tab.imgSrc}
                      alt={tab.label}
                      width={22}
                      height={22}
                      className="object-contain"
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

