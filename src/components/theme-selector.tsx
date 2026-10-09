"use client";

import { useTheme } from "@/services/themeService";

export function ThemeSelector() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <div className="p-6 rounded-3xl bg-white  border border-slate-100  shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 ">Görünüm & Tema</h2>
        <p className="text-[11px] text-slate-500 ">
          Uygulama arayüzünün görünümünü tercihlerinize göre özelleştirin.
        </p>
      </div>

      <div className="flex bg-slate-100  p-1 rounded-xl">
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
            theme === 'light' 
              ? 'bg-white  shadow-sm text-slate-900 ' 
              : 'text-slate-500  hover:text-slate-700 '
          }`}
        >
          <span>☀️</span>
          <span>Açık</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
            theme === 'dark' 
              ? 'bg-white  shadow-sm text-slate-900 ' 
              : 'text-slate-500  hover:text-slate-700 '
          }`}
        >
          <span>🌙</span>
          <span>Koyu</span>
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
            theme === 'system' 
              ? 'bg-white  shadow-sm text-slate-900 ' 
              : 'text-slate-500  hover:text-slate-700 '
          }`}
        >
          <span>⚙️</span>
          <span>Sistem</span>
        </button>
      </div>
    </div>
  );
}
