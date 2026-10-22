/**
 * Browser speechSynthesis voice picks, shared by the Voice orb and the
 * per-reply speaker button in the chat. No network, no keys.
 */

/** Prefer warmer local / neural voices; avoid novelty and overly “PA system” picks. */
export function pickNaturalVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const base = lang.slice(0, 2).toLowerCase();
  const pool = voices.filter((v) => {
    const hay = `${v.lang} ${v.name}`.toLowerCase();
    if (v.lang?.toLowerCase() === lang.toLowerCase()) return true;
    if (v.lang?.toLowerCase().startsWith(base)) return true;
    if (base === 'zh') return /zh|cmn|chinese|华文|中文/.test(hay);
    return false;
  });
  const list = pool.length ? pool : voices;

  const score = (v: SpeechSynthesisVoice): number => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let s = 0;
    if (v.localService) s += 4;
    if (v.lang?.toLowerCase() === lang.toLowerCase()) s += 5;
    else if (v.lang?.toLowerCase().startsWith(base)) s += 2;
    if (/neural|natural|enhanced|premium|online \(natural\)|premium online/.test(n)) s += 8;
    if (/google|microsoft|apple|siri/.test(n)) s += 3;
    if (base === 'zh' && /tingting|mei-jia|meijia|xiaoxiao|xiaoyi|yunxi|sin-ji|li-mu|hanhan|yaoyao/.test(n)) {
      s += 7;
    }
    if (base === 'en') {
      const gb = /en-gb|uk english|british|gbr|daniel|serena|hazel|kate|libby|sonia/.test(n) || v.lang?.toLowerCase() === 'en-gb';
      const us = /en-us|us english|samantha|aaron|google us english/.test(n);
      if (lang.toLowerCase() === 'en-gb') {
        if (gb) s += 10;
        if (us) s -= 8;
      } else if (/samantha|karen|moira|serena|fiona|martha|aria|jenny|google us english|google uk english|siri/.test(n)) {
        s += 7;
      }
    }
    // Soften “customer service / PA” defaults without blocking them entirely.
    // Daniel is the common British system voice — do not penalize it for en-GB.
    if (/microsoft david|microsoft mark|alex\b|ralph|bruce/.test(n)) s -= 3;
    if (lang.toLowerCase() !== 'en-gb' && /daniel\b/.test(n)) s -= 3;
    if (/compact|eloquence|novelty|whisper|zarvox|bad news|bahh|boing|bells|cellos|trinoids/.test(n)) {
      s -= 12;
    }
    return s;
  };

  return list.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function ttsRateForLang(lang: string): number {
  if (lang.startsWith('zh')) return 0.85;
  if (lang.startsWith('de')) return 0.88;
  return 0.9; // en — warm, not call-center rush
}

export function ttsPitchForLang(lang: string): number {
  if (lang.startsWith('zh')) return 1.0;
  if (lang.startsWith('de')) return 0.98;
  return 0.98;
}

/**
 * Reply-button speech lang. English first (en-GB, the site's narration voice);
 * a reply that is mostly Chinese is read with a Chinese voice so it is not
 * spelled out letter by letter.
 */
export function replySpeechLang(text: string): 'en-GB' | 'zh-CN' {
  const letters = text.replace(/[\s\d\p{P}\p{S}]/gu, '');
  if (!letters) return 'en-GB';
  const cjk = (letters.match(/[\u3400-\u9fff]/g) ?? []).length;
  return cjk / letters.length > 0.3 ? 'zh-CN' : 'en-GB';
}
