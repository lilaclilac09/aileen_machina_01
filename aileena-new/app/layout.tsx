'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Header() {
  const [lang, setLang] = useState('EN');
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 bg-black/80 backdrop-blur-md">
      {/* 左上角按钮 */}
      <button className="text-3xl font-bold tracking-widest text-white hover:text-[#00ffea] transition">
        AILEENA
      </button>

      {/* 中间蓝色灯带 */}
      <div className="marquee flex-1 mx-8 py-2 text-sm md:text-base">
        <div className="marquee-inner">
          MACHINA UNDER CONSTRUCTION +++ AILEENA IS +++ MECHANICAL VISIONS +++ SOUND & BRUTALIST REALMS +++ NEW VINYL DROP MARCH 2026 +++ 
          TECHNO NIGHT 28 MAR +++ FOLLOW @AILEENA +++ HARD WAX • OYE • HHV +++ EST 2025 +++ REPEAT ...
        </div>
      </div>

      {/* 右边语言 + Hamburger */}
      <div className="flex items-center gap-8">
        <div className="flex gap-2 text-xs uppercase tracking-widest">
          {['DE', 'CN', 'EN'].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`hover:text-[#00ffea] transition ${lang === l ? 'text-[#00ffea]' : 'text-white/70'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <button className="text-white">
          <Menu size={28} />
        </button>
      </div>
    </header>
  );
}