/**
 * Site identity + JSON-LD builders with no heavy imports, so client
 * components (SubstackShell) can use them without pulling in translations.
 */
export const SITE_URL = 'https://www.aileena.xyz';
export const SITE_NAME = 'AILEENA MACHINA';
export const AUTHOR_NAME = 'Aileen Choo';
/** One brand per title: the template appends ' · Aileen Choo', so the default is the name alone. */
export const DEFAULT_TITLE = AUTHOR_NAME;
export const DEFAULT_DESCRIPTION =
  'Personal site of Aileen Choo: Solana/MEV research, security tools (Tamper Check, KeyShield), AI infra notes, essays and DJ sets.';
/** Only profiles already linked from the site (footer). */
export const SAME_AS = ['https://github.com/lilaclilac09'];
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

/** "2026.05.20" → "2026-05-20" (ISO date). */
export function isoDate(date: string): string {
  return date.replace(/\./g, '-');
}

export function personJsonLd() {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: AUTHOR_NAME,
    alternateName: 'lilaclilac09',
    url: SITE_URL,
    sameAs: SAME_AS,
  };
}

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personJsonLd(),
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        author: { '@id': `${SITE_URL}/#person` },
      },
    ],
  };
}

export function blogPostingJsonLd(p: { url: string; headline: string; description?: string; date: string; keywords?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.headline,
    ...(p.description ? { description: p.description } : {}),
    datePublished: isoDate(p.date),
    author: personJsonLd(),
    ...(p.keywords ? { keywords: p.keywords.split('·').map((k) => k.trim()).filter(Boolean).join(', ') } : {}),
    image: DEFAULT_OG_IMAGE,
    url: p.url,
    mainEntityOfPage: p.url,
  };
}

/** Escape `<` so JSON-LD can never close its <script> tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
