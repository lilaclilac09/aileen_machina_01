'use client';

import { useLanguage } from './LanguageProvider';

export default function Header() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="fixed right-0 top-0 z-50 px-5 pt-4 sm:px-10 lg:px-12">
      <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/88 px-3 py-2 text-[0.62rem] uppercase tracking-[0.3em] text-[#14110c]/62 shadow-[0_12px_34px_-28px_rgba(20,17,12,0.5)] backdrop-blur sm:gap-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage('EN')}
            className={`transition ${language === 'EN' ? 'text-[#00a99f]' : 'hover:text-[#14110c]'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('DE')}
            className={`transition ${language === 'DE' ? 'text-[#00a99f]' : 'hover:text-[#14110c]'}`}
          >
            DE
          </button>
        </div>
        <button className="text-sm leading-none text-[#14110c]/72 transition hover:text-[#00a99f]" aria-label="Menu">
          ≡
        </button>
      </div>
    </header>
  );
}
