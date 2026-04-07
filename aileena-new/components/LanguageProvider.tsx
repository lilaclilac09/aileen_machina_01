'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'EN' | 'DE';

const langCode: Record<Language, string> = {
  EN: 'en',
  DE: 'de',
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'EN',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('EN');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aileena-lang') as Language | null;
      if (stored === 'EN' || stored === 'DE') setLanguageState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = langCode[language];
  }, [language]);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    try { localStorage.setItem('aileena-lang', lang); } catch {}
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
