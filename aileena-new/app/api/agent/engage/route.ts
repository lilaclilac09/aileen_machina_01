import { NextResponse } from 'next/server';
import { parseEngageBody } from '@/lib/agentEngage/events';
import { recordEngageEvent } from '@/lib/agentEngage/store';
import { clientIpTransient, countryFromRequest, dailyVisitorHash } from '@/lib/agentEngage/visitorHash';
import { regionFromCountry } from '@/lib/agentEngage/opening';
import { takeAgentRate } from '@/lib/agentMcp/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Console engagement beacon: open / starters_seen / starter_tap / first_message.
 * Stores aggregate counters and a capped recent-session list. The IP is used
 * only transiently for a salted daily hash (unique counts) and never stored.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ev = parseEngageBody(body);
  if (!ev) return NextResponse.json({ ok: false }, { status: 400 });
  const country = countryFromRequest(req);
  const hash = await dailyVisitorHash({ ip: clientIpTransient(req), extra: req.headers.get('user-agent') ?? '', purpose: 'engage' });
  // Beacon spam guard: a real session sends a handful of events.
  const rl = await takeAgentRate(hash, [{ name: 'engage-min', limit: 30, windowSec: 60 }]);
  if (!rl.ok) return NextResponse.json({ ok: false }, { status: 429 });
  const uniqHash = ev.type === 'open' ? hash : undefined;
  try {
    await recordEngageEvent({ ...ev, dims: { ...ev.dims, country, caller: 'visitor' }, uniqHash, at: Date.now() });
  } catch (err) {
    console.error('[engage] record failed', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true, region: regionFromCountry(country) });
}

/** Coarse region bucket for the opening (cn / dach / us / other). Never a city. */
export async function GET(req: Request) {
  return NextResponse.json(
    { region: regionFromCountry(countryFromRequest(req)) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
