interface Env {
  ANALYTICS_KV: KVNamespace;
  RESEND_API_KEY: string;
  REPORT_EMAIL: string;
  ALLOWED_ORIGIN: string;
}

interface AnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  ts: number;
  ua: string;
  ref: string;
}

/* ── helpers ─────────────────────────────────────────────── */

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* ── track handler ───────────────────────────────────────── */

async function handleTrack(req: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(env.ALLOWED_ORIGIN || '*');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: cors });
  }

  try {
    const body = await req.json<{ type: string; data?: Record<string, unknown> }>();
    if (!body?.type) return new Response('ok', { headers: cors });

    const event: AnalyticsEvent = {
      type: body.type,
      data: body.data ?? {},
      ts: Date.now(),
      ua: req.headers.get('user-agent') ?? '',
      ref: req.headers.get('referer') ?? '',
    };

    // unique key per event — prefix allows listing by day
    const key = `e:${today()}:${event.ts}:${Math.random().toString(36).slice(2, 8)}`;
    await env.ANALYTICS_KV.put(key, JSON.stringify(event), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  } catch {
    // never break the site over analytics
  }

  return new Response('ok', { headers: corsHeaders(env.ALLOWED_ORIGIN || '*') });
}

/* ── daily report ────────────────────────────────────────── */

async function sendDailyReport(env: Env): Promise<void> {
  const day = yesterday();

  // list all events for yesterday
  const list = await env.ANALYTICS_KV.list({ prefix: `e:${day}:` });
  if (list.keys.length === 0) return;

  const raw = await Promise.all(
    list.keys.map(k => env.ANALYTICS_KV.get<AnalyticsEvent>(k.name, 'json'))
  );
  const events = raw.filter((e): e is AnalyticsEvent => e !== null);

  // aggregate
  const sections: Record<string, number> = {};
  const djTracks: Record<string, number> = {};
  const referrers: Record<string, number> = {};
  let pageViews = 0, formStarts = 0, formSubmits = 0;

  for (const e of events) {
    if (e.type === 'page_view') {
      pageViews++;
      try {
        const host = new URL(e.ref).hostname || 'direct';
        referrers[host] = (referrers[host] ?? 0) + 1;
      } catch {
        referrers['direct'] = (referrers['direct'] ?? 0) + 1;
      }
    }
    if (e.type === 'section_view') {
      const id = (e.data.id as string) ?? 'unknown';
      sections[id] = (sections[id] ?? 0) + 1;
    }
    if (e.type === 'dj_play') {
      const t = (e.data.track as string) ?? 'unknown';
      djTracks[t] = (djTracks[t] ?? 0) + 1;
    }
    if (e.type === 'form_start') formStarts++;
    if (e.type === 'form_submit') formSubmits++;
  }

  const rank = (obj: Record<string, number>) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n') || '  —';

  const body = [
    `AILEENA MACHINA · Daily Report · ${day}`,
    ``,
    `Page views     ${pageViews}`,
    `Total events   ${events.length}`,
    ``,
    `── SECTIONS ──────────────`,
    rank(sections),
    ``,
    `── DJ STATION ────────────`,
    rank(djTracks),
    ``,
    `── CONTACT ───────────────`,
    `  Opens:   ${formStarts}`,
    `  Submits: ${formSubmits}`,
    ``,
    `── REFERRERS ─────────────`,
    rank(referrers),
  ].join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AILEENA MACHINA <onboarding@resend.dev>',
      to: env.REPORT_EMAIL,
      subject: `[AILEENA] Daily · ${day} · ${pageViews} views`,
      text: body,
    }),
  });
}

/* ── worker entry ────────────────────────────────────────── */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/track') return handleTrack(req, env);
    return new Response('not found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await sendDailyReport(env);
  },
};
