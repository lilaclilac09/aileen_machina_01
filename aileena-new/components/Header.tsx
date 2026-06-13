'use client';

import { useLanguage } from './LanguageProvider';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed right-0 top-0 z-50 px-5 pt-4 sm:px-10 lg:px-12">
      <div className="flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.3em] text-white/70 sm:gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'french-girl-light' : 'dark')}
            className="transition hover:text-white flex items-center gap-1.5"
            aria-label="Toggle theme"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: theme === 'dark' ? 'transparent' : '#FAF2EE' }} />
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage('EN')}
            className={`transition ${language === 'EN' ? 'text-[#00ffea]' : 'hover:text-white'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('DE')}
            className={`transition ${language === 'DE' ? 'text-[#00ffea]' : 'hover:text-white'}`}
          >
            DE
          </button>
        </div>
        <button className="text-sm leading-none text-white/85 transition hover:text-[#00ffea]" aria-label="Menu">
          ≡
        </button>
      </div>
    </header>
  );
}
