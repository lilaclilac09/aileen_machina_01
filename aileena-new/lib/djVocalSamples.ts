/** Spoken clips for the /sound vocal rack — source only, no cover titles. */

export type VocalLang = 'fr' | 'en' | 'zh';

export type VocalSample = {
  id: string;
  lang: VocalLang;
  /** Desk note: outlet · show · who · date. Not a title card. */
  source: string;
  href: string;
};

export const VOCAL_LANGS: { id: VocalLang; label: string }[] = [
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
];

export const VOCAL_SAMPLES: VocalSample[] = [
  {
    id: 'fr-20min-montangon-attal',
    lang: 'fr',
    source: '20 minutes · LCI clip · Montangon / Attal · 2026-10-07',
    href: 'https://www.20min.ch/fr/video/attal-tacle-par-une-etudiante-ca-sert-a-rien-de-me-regarder-avec-un-petit-sourire-103645647',
  },
  {
    id: 'fr-lci-montangon-attal',
    lang: 'fr',
    source: 'LCI · Vous avez la parole · Montangon / Attal · 2026-10-06',
    href: 'https://www.tf1.fr/lci/vous-avez-la-parole/videos/vous-avez-la-parole-linterview-integrale-de-gabriel-attal-sur-lci-76865149.html',
  },
  {
    id: 'fr-lci-elwan-pujadas',
    lang: 'fr',
    source: 'LCI · 24H Pujadas · Elwan · 2026-10-07',
    href: 'https://www.tf1.fr/lci/24h-pujadas-l-info-en-questions/videos/24h-pujadas-du-mercredi-7-octobre-2026-96633769.html',
  },
];
