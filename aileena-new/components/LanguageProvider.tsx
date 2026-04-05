'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'EN' | 'DE' | 'CN';

const langCode: Record<Language, string> = {
  EN: 'en',
  DE: 'de',
  CN: 'zh',
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
  const [language, setLanguage] = useState<Language>('EN');

  useEffect(() => {
    document.documentElement.lang = langCode[language];
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
