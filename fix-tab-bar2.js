const fs = require('fs');
const file = 'src/components/guest/guest-tab-bar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use exact styling from the screenshot
const newReturn = \  return (
    <nav
      className={\\\mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[99999] px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-300 ease-in-out bg-white border-t border-slate-200 shadow-sm pointer-events-auto \\\\\\}
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
        boxShadow: '0 -4px 10px rgba(0,0,0,0.03)',
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
              className={\\\lex flex-col items-center justify-center py-1 px-2 transition-all relative cursor-pointer active:scale-95 \\\\\\}
            >
              <div className={\\\w-10 h-10 rounded-full transition-all flex items-center justify-center \\\\\\}>
                {tab.iconType === 'image' && tab.imgSrc ? (
                  <div
                    className="w-6 h-6 transition-transform"
                    style={{
                      backgroundColor: isActive ? '#ffffff' : '#64748b',
                      WebkitMaskImage: \\\url(\\\)\\\,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: \\\url(\\\)\\\,
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
\

// Replace the return block
content = content.replace(/return \([\s\S]*?\n  \);\n}$/, newReturn + "\n}");

// Change the tabs array to use Info for practical
content = content.replace(/import \{ Home, Compass, LayoutGrid, Building2, Sparkles, BookOpen \} from 'lucide-react';/, "import { Home, Compass, LayoutGrid, Building2, Sparkles, BookOpen, Info } from 'lucide-react';");

const tabsOld = "const tabs: { id: TabId; label: string; iconType: 'lucide' | 'image'; icon?: any; imgSrc?: string }[] = [\n    { id: 'services', label: t.tabs.services, iconType: 'lucide', icon: Home },\n    { id: 'categories', label: t.tabs.categories, iconType: 'lucide', icon: LayoutGrid },\n    { id: 'ai', label: t.tabs.aiGuide, iconType: 'image', imgSrc: '/icons/menu/aiGuide.png' },\n    { id: 'practical', label: t.tabs.practical, iconType: 'image', imgSrc: '/icons/menu/practical.png' }\n  ];";
const tabsNew = "const tabs: { id: TabId; label: string; iconType: 'lucide' | 'image'; icon?: any; imgSrc?: string }[] = [\n    { id: 'services', label: t.tabs.services, iconType: 'lucide', icon: Home },\n    { id: 'categories', label: t.tabs.categories, iconType: 'lucide', icon: LayoutGrid },\n    { id: 'ai', label: t.tabs.aiGuide, iconType: 'image', imgSrc: '/icons/menu/aiGuide.png' },\n    { id: 'practical', label: t.tabs.practical, iconType: 'lucide', icon: Info }\n  ];";

content = content.replace(/const tabs:[\s\S]*?\];/, tabsNew);

fs.writeFileSync(file, content);
console.log('done');
