/**
 * Browser side of console engagement: remembers how this tab's session
 * arrived (sessionStorage only — cleared when the tab closes), builds the
 * VisitorContext for the opening, and sends tiny engagement events.
 *
 * No cookies, no localStorage, no fingerprinting: just the referrer host,
 * utm_source / utm_campaign, the paths visited this session, navigator
 * languages and a coarse device class.
 */

import {
  classifySource,
  localeFromLanguages,
  type Device,
  type Region,
  type VisitorContext,
} from './opening';

const KEY = 'aileena_engage_v1';
const MAX_PAGES = 12;

type Stored = {
  sid: string;
  source: VisitorContext['source'];
  utmSource?: string;
  utmCampaign?: string;
  landing: string;
  pages: string[];
  region?: Region;
  opened?: boolean;
  asked?: boolean;
};

function newSid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '').slice(0, 16);
  return Math.random().toString(36).slice(2, 18);
}

function read(): Stored | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function write(s: Stored): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode — engagement just isn't remembered */
  }
}

function clean(v: string | null): string | undefined {
  const s = (v || '').trim().toLowerCase().replace(/[^a-z0-9_.\-]/g, '').slice(0, 40);
  return s || undefined;
}

/** Call on every route change. First call of a session captures referrer + utm. */
export function recordPageView(path: string): Stored {
  const cur = read();
  const p = (path || '/').split('?')[0].slice(0, 120);
  if (!cur) {
    const params = new URLSearchParams(window.location.search);
    const utmSource = clean(params.get('utm_source'));
    const s: Stored = {
      sid: newSid(),
      source: classifySource(document.referrer, utmSource, window.location.hostname.replace(/^www\./, '')),
      utmSource,
      utmCampaign: clean(params.get('utm_campaign')),
      landing: p,
      pages: [p],
    };
    write(s);
    return s;
  }
  if (cur.pages[cur.pages.length - 1] !== p) {
    cur.pages = [...cur.pages, p].slice(-MAX_PAGES);
    write(cur);
  }
  return cur;
}

export function deviceClass(): Device {
  try {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 639px)').matches) return 'mobile';
  } catch {
    /* ignore */
  }
  return 'desktop';
}

export function readVisitorContext(): VisitorContext & { sid: string } {
  const s = read() ?? recordPageView(window.location.pathname);
  const region = s.region;
  return {
    sid: s.sid,
    source: s.source,
    utmSource: s.utmSource,
    utmCampaign: s.utmCampaign,
    landing: s.landing,
    pages: s.pages,
    locale: localeFromLanguages(navigator.languages?.length ? navigator.languages : [navigator.language]),
    device: deviceClass(),
    region,
  };
}

export type EngageEventType = 'open' | 'starters_seen' | 'starter_tap' | 'first_message';

/**
 * Fire-and-forget engagement event. open / first_message are sent once per
 * session; starter_tap carries the starter id (not its text).
 */
export function sendEngageEvent(type: EngageEventType, extra: { starter?: string; topic?: string } = {}): void {
  const s = read();
  if (!s) return;
  if (type === 'open' && s.opened) return;
  if (type === 'first_message' && s.asked) return;
  if (type === 'open') write({ ...s, opened: true });
  if (type === 'first_message') write({ ...s, asked: true });
  const ctx = readVisitorContext();
  const body = JSON.stringify({
    type,
    sid: s.sid,
    source: ctx.source,
    utmSource: ctx.utmSource,
    utmCampaign: ctx.utmCampaign,
    landing: ctx.landing,
    pagesViewed: ctx.pages.length,
    locale: ctx.locale,
    device: ctx.device,
    starter: extra.starter,
    topic: extra.topic,
  });
  try {
    const ok = navigator.sendBeacon?.('/api/agent/engage', new Blob([body], { type: 'application/json' }));
    if (!ok) {
      void fetch('/api/agent/engage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { region?: Region } | null) => {
          if (j?.region) rememberRegion(j.region);
        })
        .catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

/** Region comes back from /api/agent/engage (coarse bucket only) and nudges later openings. */
export function rememberRegion(region: Region): void {
  const s = read();
  if (s && s.region !== region) write({ ...s, region });
}

/** Ask the server for the coarse region once per session (no-op if known). */
export async function fetchRegionOnce(): Promise<void> {
  const s = read();
  if (!s || s.region) return;
  try {
    const r = await fetch('/api/agent/engage', { method: 'GET', headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const j = (await r.json()) as { region?: Region };
    if (j.region) rememberRegion(j.region);
  } catch {
    /* ignore */
  }
}
