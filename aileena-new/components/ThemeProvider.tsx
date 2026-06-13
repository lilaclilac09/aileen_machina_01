'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'french-girl-light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aileena-theme') as Theme | null;
      if (stored === 'dark' || stored === 'french-girl-light') {
        setThemeState(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (theme === 'french-girl-light') {
      document.documentElement.setAttribute('data-theme', 'french-girl-light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    try {
      localStorage.setItem('aileena-theme', newTheme);
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
