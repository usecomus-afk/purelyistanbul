"use client";

import { useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { getT, detectBrowserLanguage } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { Home, Compass, LayoutGrid, Building2, Sparkles, BookOpen, Info } from 'lucide-react';
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

  const tabs: { id: TabId; label: string; iconType: 'lucide' | 'image'; icon?: any; imgSrc?: string }[] = [
    { id: 'services', label: t.tabs.services, iconType: 'lucide', icon: Home },
    { id: 'categories', label: t.tabs.categories, iconType: 'lucide', icon: LayoutGrid },
    { id: 'ai', label: t.tabs.aiGuide, iconType: 'image', imgSrc: '/icons/menu/aiGuide.png' },
    { id: 'practical', label: t.tabs.practical, iconType: 'lucide', icon: Info }
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
      className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[99999] px-2 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] transition-all duration-300 ease-in-out bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pointer-events-auto ${
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
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.03)',
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
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isActive 
                  ? 'text-orange-500 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div className={`transition-all flex items-center justify-center ${
                isActive 
                  ? 'w-10 h-10 rounded-full bg-orange-500 text-white shadow-md' 
                  : 'w-8 h-8 text-slate-500'
              }`}>
                {tab.iconType === 'image' && tab.imgSrc ? (
                  <div
                    className="w-6 h-6 transition-transform"
                    style={{
                      backgroundColor: isActive ? '#ffffff' : '#64748b',
                      WebkitMaskImage: `url(${tab.imgSrc})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(${tab.imgSrc})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                ) : (
                  tab.icon && <tab.icon className="w-6 h-6 stroke-[1.8]" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

