/**
 * Personalized console opening: one short greeting + 3–4 one-tap starters,
 * picked from how the visitor arrived (referrer source / utm, landing page,
 * pages viewed this session), their language, device and a coarse region.
 *
 * Pure and shared by the client (render) and the harness (tests). Nothing here
 * shows a city, IP or anything that looks like tracking — copy stays light:
 * "Coming from GitHub? Here's the code side."
 */

export type Locale = 'en' | 'de' | 'zh';
export type Source = 'github' | 'x' | 'linkedin' | 'google' | 'search' | 'direct' | 'internal' | 'agent' | 'other';
export type Device = 'desktop' | 'mobile';
/** Coarse region derived server-side from the country header. Never a city. */
export type Region = 'cn' | 'dach' | 'us' | 'other';

export type VisitorContext = {
  source: Source;
  utmSource?: string;
  utmCampaign?: string;
  /** First path of this browser session on aileena.xyz. */
  landing: string;
  /** Paths viewed this session, oldest first, capped. */
  pages: string[];
  locale: Locale;
  device: Device;
  region?: Region;
};

export type Starter = { id: string; text: string };
export type Opening = { greeting: string; starters: Starter[]; topic: Topic; privacyNote: string; placeholder: string; locale: Locale };

export type Topic = 'tamper' | 'keyshield' | 'dj' | 'infra' | 'tools' | 'writing' | 'code' | 'work' | 'default';

/** Classify where the visit came from. Only the referrer host and utm_source are read. */
export function classifySource(referrer: string, utmSource: string | undefined, ownHost = 'aileena.xyz'): Source {
  const utm = (utmSource || '').toLowerCase();
  if (utm) {
    if (/github/.test(utm)) return 'github';
    if (/^(x|twitter|t\.co)$|twitter|x\.com/.test(utm)) return 'x';
    if (/linkedin/.test(utm)) return 'linkedin';
    if (/google/.test(utm)) return 'google';
    if (/agent|mcp|llm/.test(utm)) return 'agent';
  }
  let host = '';
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : '';
  } catch {
    host = '';
  }
  if (!host) return utm ? 'other' : 'direct';
  if (host === ownHost || host.endsWith(`.${ownHost}`)) return 'internal';
  if (host === 'github.com' || host.endsWith('.github.com') || host.endsWith('github.io')) return 'github';
  if (host === 't.co' || host === 'x.com' || host.endsWith('.x.com') || host.endsWith('twitter.com')) return 'x';
  if (host.endsWith('linkedin.com') || host === 'lnkd.in') return 'linkedin';
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
  if (/(^|\.)(bing\.com|duckduckgo\.com|baidu\.com|search\.brave\.com|ecosia\.org|kagi\.com|perplexity\.ai|chatgpt\.com)$/.test(host)) return 'search';
  return 'other';
}

/** Topic from the pages this session, most recent first. */
export function topicFromPages(pages: string[], landing: string): Topic | null {
  const seen = [...pages].reverse().concat(landing ? [landing] : []);
  for (const p of seen) {
    const path = (p || '').toLowerCase();
    if (path.startsWith('/tools/tamper-check')) return 'tamper';
    if (path.startsWith('/ks') || path.includes('keyshield')) return 'keyshield';
    if (path.startsWith('/sound')) return 'dj';
    if (path.startsWith('/research') || path.startsWith('/dispatch') || /hbm|gpu|neocloud|chip|infra/.test(path)) return 'infra';
    if (path.startsWith('/tools')) return 'tools';
    if (path.startsWith('/works')) return 'work';
    if (path.startsWith('/blog')) return 'writing';
  }
  return null;
}


const STARTERS: Record<'tamper' | 'keyshield' | 'dj' | 'infra' | 'hire' | 'solana' | 'writing' | 'europe', Record<Locale, string>> = {
  tamper: {
    en: 'How does Tamper Check spot a tampered Ledger?',
    de: 'Wie erkennt Tamper Check einen manipulierten Ledger?',
    zh: 'Tamper Check 怎么判断 Ledger 被动过手脚？',
  },
  keyshield: {
    en: 'What is KeyShield and where can I try it?',
    de: 'Was ist KeyShield und wo kann ich es ausprobieren?',
    zh: 'KeyShield 是什么？在哪里能试？',
  },
  dj: {
    en: "What's in her current DJ set?",
    de: 'Was läuft in ihrem aktuellen DJ-Set?',
    zh: '她现在的 DJ set 里有什么？',
  },
  infra: {
    en: 'What does she track in AI infra — chips, HBM, prices?',
    de: 'Was verfolgt sie bei KI-Infrastruktur — Chips, HBM, Preise?',
    zh: '她在 AI 基础设施上追踪什么——芯片、HBM、价格？',
  },
  hire: {
    en: 'Is she open to new roles?',
    de: 'Ist sie offen für neue Rollen?',
    zh: '她现在接受新的工作机会吗？',
  },
  solana: {
    en: "What's her Solana stack?",
    de: 'Was ist ihr Solana-Stack?',
    zh: '她的 Solana 技术栈是什么？',
  },
  writing: {
    en: 'What should I read first from her writing?',
    de: 'Welchen ihrer Texte sollte ich zuerst lesen?',
    zh: '她的文章先读哪一篇？',
  },
  europe: {
    en: 'Does she work with teams in Europe?',
    de: 'Arbeitet sie mit Teams in Europa?',
    zh: '她和欧洲的团队合作吗？',
  },
};

const GREETING: Record<Topic, Record<Locale, string>> = {
  tamper: {
    en: 'You were just looking at Tamper Check — ask me how the scale-and-ruler test works, or anything else.',
    de: 'Du hast dir gerade Tamper Check angesehen — frag mich, wie der Waage-und-Lineal-Test funktioniert.',
    zh: '你刚在看 Tamper Check —— 可以问我秤加尺子的测法怎么用，或者别的。',
  },
  keyshield: {
    en: 'KeyShield is one of her security builds — ask me what it does.',
    de: 'KeyShield ist eines ihrer Security-Projekte — frag mich, was es macht.',
    zh: 'KeyShield 是她做的安全项目之一 —— 问我它是做什么的。',
  },
  dj: {
    en: 'Here for the music? Ask me about her set, or her work.',
    de: 'Wegen der Musik hier? Frag mich nach ihrem Set — oder ihrer Arbeit.',
    zh: '来听歌的？可以问她的 set，也可以问她的工作。',
  },
  infra: {
    en: 'Into AI infra? She tracks chips, memory and prices — ask away.',
    de: 'KI-Infrastruktur? Sie verfolgt Chips, Speicher und Preise — frag ruhig.',
    zh: '关心 AI 基础设施？她在追踪芯片、内存和价格 —— 随便问。',
  },
  tools: {
    en: "Browsing her tools? They're free — ask me what any of them does.",
    de: 'Du stöberst in ihren Tools? Alle kostenlos — frag mich, was sie können.',
    zh: '在看她的小工具？都免费 —— 问我哪个是做什么的。',
  },
  writing: {
    en: 'Reading her writing? I can point you to the next piece.',
    de: 'Du liest ihre Texte? Ich zeige dir den nächsten.',
    zh: '在读她的文章？我可以帮你挑下一篇。',
  },
  code: {
    en: "Coming from GitHub? Here's the code side — ask about any repo.",
    de: 'Von GitHub hier? Hier ist die Code-Seite — frag nach jedem Repo.',
    zh: '从 GitHub 过来的？这边是代码那一面 —— 任何仓库都可以问。',
  },
  work: {
    en: 'Ask me about her projects — or whether she is open to work.',
    de: 'Frag mich nach ihren Projekten — oder ob sie offen für Arbeit ist.',
    zh: '可以问她的项目，或者她现在是否在找工作。',
  },
  default: {
    en: "Hi — I'm Aileen's site agent. Ask about her projects, writing or music, or tap a question.",
    de: 'Hallo — ich bin Aileens Site-Agent. Frag nach Projekten, Texten oder Musik, oder tipp eine Frage an.',
    zh: '你好，我是 Aileen 的站点助手。可以问她的项目、文章或音乐，或者直接点一个问题。',
  },
};

const SOURCE_PREFIX: Partial<Record<Source, Record<Locale, string>>> = {
  x: { en: 'Coming from X? ', de: 'Von X hier? ', zh: '从 X 过来的？' },
  linkedin: { en: 'Coming from LinkedIn? ', de: 'Von LinkedIn hier? ', zh: '从 LinkedIn 过来的？' },
};

export const PRIVACY_NOTE: Record<Locale, string> = {
  en: 'Picked from the page you came from and your language. No IPs or cross-site tracking. https://aileena.xyz/privacy',
  de: 'Ausgewählt nach Herkunftsseite und Sprache. Keine IPs, kein seitenübergreifendes Tracking. https://aileena.xyz/privacy',
  zh: '根据你来的页面和语言挑选。不记录 IP，不做跨站追踪。https://aileena.xyz/privacy',
};

export const PLACEHOLDER: Record<Locale, string> = {
  en: 'Ask about her projects, writing or music…',
  de: 'Frag nach Projekten, Texten oder Musik …',
  zh: '问她的项目、文章或音乐……',
};

const ORDER: Record<Topic, Array<keyof typeof STARTERS>> = {
  tamper: ['tamper', 'keyshield', 'infra', 'hire'],
  keyshield: ['keyshield', 'tamper', 'solana', 'hire'],
  dj: ['dj', 'tamper', 'infra', 'writing'],
  infra: ['infra', 'writing', 'tamper', 'hire'],
  tools: ['tamper', 'keyshield', 'infra', 'dj'],
  writing: ['writing', 'infra', 'tamper', 'dj'],
  code: ['keyshield', 'tamper', 'solana', 'infra'],
  work: ['hire', 'keyshield', 'tamper', 'infra'],
  default: ['tamper', 'keyshield', 'dj', 'infra'],
};

export function pickOpening(ctx: VisitorContext): Opening {
  const locale = ctx.locale;
  const pageTopic = topicFromPages(ctx.pages, ctx.landing);
  let topic: Topic =
    pageTopic ??
    (ctx.source === 'github'
      ? 'code'
      : ctx.source === 'linkedin'
        ? 'work'
        : 'default');
  // A GitHub visitor who already moved to /tools/tamper-check gets the page topic, not "code".
  if (pageTopic) topic = pageTopic;

  let greeting = GREETING[topic][locale];
  const prefix = SOURCE_PREFIX[ctx.source];
  if (prefix && (topic === 'default' || topic === 'work')) {
    greeting = `${prefix[locale]}${topic === 'default' ? GREETING.default[locale].replace(/^(Hi — |Hallo — |你好，)/, '') : greeting}`;
  }

  const keys = [...ORDER[topic]];
  // Coarse region only nudges the 4th slot; it is never shown or named.
  if (ctx.region === 'dach' && !keys.includes('europe')) keys[3] = 'europe';
  const max = ctx.device === 'mobile' ? 3 : 4;
  const starters = keys.slice(0, max).map((k) => ({ id: k, text: STARTERS[k][locale] }));
  return { greeting, starters, topic, privacyNote: PRIVACY_NOTE[locale], placeholder: PLACEHOLDER[locale], locale };
}

/**
 * Browser language → site locale. English is the primary language: only a
 * browser whose first matching language is German or Chinese gets DE / ZH.
 * Region never switches the language.
 */
export function localeFromLanguages(langs: readonly string[] | undefined): Locale {
  for (const l of langs ?? []) {
    const s = l.toLowerCase();
    if (s.startsWith('en')) return 'en';
    if (s.startsWith('zh')) return 'zh';
    if (s.startsWith('de')) return 'de';
  }
  return 'en';
}

/** Country header → coarse region bucket. */
export function regionFromCountry(country: string | null | undefined): Region {
  const c = (country || '').toUpperCase();
  if (['CN', 'HK', 'TW', 'MO'].includes(c)) return 'cn';
  if (['DE', 'AT', 'CH', 'LI'].includes(c)) return 'dach';
  if (c === 'US') return 'us';
  return 'other';
}
