"use client";
import { useState, useEffect } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme_preference', 'light');
  };

  return { theme, setTheme, mounted };
}
