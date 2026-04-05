'use client';

import { useLanguage } from './LanguageProvider';

export default function Header() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="fixed right-0 top-0 z-50 px-5 pt-4 sm:px-10 lg:px-12">
      <div className="flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.3em] text-white/70 sm:gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage('DE')}
            className={`transition ${language === 'DE' ? 'text-[#00ffea]' : 'hover:text-white'}`}
          >
            DE
          </button>
          <button
            onClick={() => setLanguage('CN')}
            className={`transition ${language === 'CN' ? 'text-[#00ffea]' : 'hover:text-white'}`}
          >
            CN
          </button>
          <button
            onClick={() => setLanguage('EN')}
            className={`transition ${language === 'EN' ? 'text-[#00ffea]' : 'hover:text-white'}`}
          >
            EN
          </button>
        </div>
        <button className="text-sm leading-none text-white/85 transition hover:text-[#00ffea]" aria-label="Menu">
          ≡
        </button>
      </div>
    </header>
  );
}
