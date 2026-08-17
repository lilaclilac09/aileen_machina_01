'use client';

import { useLanguage } from './LanguageProvider';

export default function Header() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="site-lang-chrome fixed right-0 top-0 z-50 px-5 pt-4 sm:px-10 lg:px-12">
      <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/92 px-1.5 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-[#14110c]/62 shadow-[0_12px_34px_-28px_rgba(20,17,12,0.5)] sm:gap-3 sm:px-3 sm:py-2 sm:bg-white/88 sm:backdrop-blur">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setLanguage('EN')}
            aria-pressed={language === 'EN'}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center transition sm:min-h-0 sm:min-w-0 ${language === 'EN' ? 'text-[#00a99f]' : 'hover:text-[#14110c]'}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('DE')}
            aria-pressed={language === 'DE'}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center transition sm:min-h-0 sm:min-w-0 ${language === 'DE' ? 'text-[#00a99f]' : 'hover:text-[#14110c]'}`}
          >
            DE
          </button>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm leading-none text-[#14110c]/72 transition hover:text-[#00a99f] sm:min-h-0 sm:min-w-0"
          aria-label="Menu"
        >
          ≡
        </button>
      </div>
    </header>
  );
}
