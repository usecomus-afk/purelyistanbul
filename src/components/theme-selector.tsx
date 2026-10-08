"use client";

import { useTheme } from "@/services/themeService";

export function ThemeSelector() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Görünüm & Tema</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Uygulama arayüzünün görünümünü tercihlerinize göre özelleştirin.
        </p>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
            theme === 'light' 
              ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>☀️</span>
          <span>Açık</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
            theme === 'dark' 
              ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>🌙</span>
          <span>Koyu</span>
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
            theme === 'system' 
              ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>⚙️</span>
          <span>Sistem</span>
        </button>
      </div>
    </div>
  );
}
