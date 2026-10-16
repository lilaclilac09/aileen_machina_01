/**
 * Validation for engagement events posted by the console. Everything is
 * clamped to short labels; unknown fields are ignored.
 */

import type { EngageEvent } from './store';
import { dimValue } from './store';

const TYPES = new Set(['open', 'starters_seen', 'starter_tap', 'first_message']);
const SOURCES = new Set(['github', 'x', 'linkedin', 'google', 'search', 'direct', 'internal', 'agent', 'other']);
const LOCALES = new Set(['en', 'de', 'zh']);
const DEVICES = new Set(['desktop', 'mobile']);

export type ParsedEvent = Omit<EngageEvent, 'dims' | 'at' | 'uniqHash'> & {
  dims: Omit<EngageEvent['dims'], 'country' | 'caller'>;
};

export function parseEngageBody(body: unknown): ParsedEvent | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const type = String(b.type || '');
  if (!TYPES.has(type)) return null;
  const sid = String(b.sid || '');
  if (!/^[a-z0-9]{8,32}$/i.test(sid)) return null;
  const source = SOURCES.has(String(b.source)) ? String(b.source) : 'other';
  const landing = String(b.landing || '/').startsWith('/') ? dimValue(String(b.landing).split('?')[0], '/') : '/';
  const locale = LOCALES.has(String(b.locale)) ? String(b.locale) : 'en';
  const device = DEVICES.has(String(b.device)) ? String(b.device) : 'desktop';
  const starter = typeof b.starter === 'string' ? dimValue(b.starter) : undefined;
  const topic = typeof b.topic === 'string' ? dimValue(b.topic) : undefined;
  return {
    type: type as ParsedEvent['type'],
    sid,
    starter,
    dims: { source, landing, locale, device, topic },
  };
}
