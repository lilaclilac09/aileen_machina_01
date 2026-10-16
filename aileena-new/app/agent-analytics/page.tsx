import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';
import GpuRouterPanel from '@/components/GpuRouterPanel';
import { readEngageStats, type EngageStats } from '@/lib/agentEngage/store';

export const metadata: Metadata = {
  title: 'Console analytics · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function pct(n: number): string {
  return `${Math.round(n * 1000) / 10}%`;
}

function Breakdown({ title, rows, asked }: { title: string; rows: Record<string, number>; asked?: Record<string, number> }) {
  const list = Object.entries(rows).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return (
    <section className="border border-[#ded8ce] bg-white p-4" data-testid={`breakdown-${title.toLowerCase()}`}>
      <h3 className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-[#008f86] mb-2">{title}</h3>
      {list.length === 0 ? (
        <p className="text-[0.8rem] text-[#1b1713]/45">No data yet.</p>
      ) : (
        <table className="w-full text-[0.8rem]">
          <tbody>
            {list.map(([k, v]) => (
              <tr key={k} className="border-t border-[#f0ebe3]">
                <td className="py-1 pr-2 font-mono text-[#1b1713]/75 break-all">{k}</td>
                <td className="py-1 text-right tabular-nums">{v}</td>
                {asked ? (
                  <td className="py-1 pl-3 text-right tabular-nums text-[#1b1713]/50">
                    {v ? pct((asked[k] ?? 0) / v) : '—'} asked
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Funnel({ f }: { f: EngageStats['funnel'] }) {
  const steps: Array<[string, number]> = [
    ['Opened', f.opened],
    ['Saw starters', f.sawStarters],
    ['Asked', f.asked],
  ];
  const max = Math.max(1, f.opened);
  return (
    <section className="border border-[#ded8ce] bg-white p-4" data-testid="funnel">
      <h3 className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-[#008f86] mb-3">
        Drop-off funnel (last {200} sessions)
      </h3>
      <div className="space-y-2">
        {steps.map(([label, n]) => (
          <div key={label} className="flex items-center gap-3 text-[0.8rem]">
            <span className="w-28 shrink-0 text-[#1b1713]/70">{label}</span>
            <span className="h-3 bg-[#00a89d]/70" style={{ width: `${Math.max(2, (n / max) * 100)}%` }} />
            <span className="tabular-nums">{n}</span>
            <span className="text-[#1b1713]/45 tabular-nums">{pct(n / max)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Owner-only: gated server-side; non-owners get the unlock form and no data. */
export default async function AgentAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const denied = (await searchParams).error === 'denied';
  const stats = owner ? await readEngageStats(14) : null;
  const t = stats?.totals ?? {};
  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14 space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">owner · console analytics</p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight">Does the console get asked?</h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Opens, starter taps and first messages from the site console and from agent callers (/api/mcp).
            Aggregates only: no IPs, no cities, no message text. Unique counts use a salted hash that rotates daily.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/inbox" className="hover:text-[#008f86]">← cabinet</Link>
            {' · '}
            <Link href="/agent-analytics/performance" className="hover:text-[#008f86]">inference performance →</Link>
          </p>
        </header>

        {!stats ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4 max-w-xl" data-testid="analytics-locked">
            <OwnerUnlockForm next="/agent-analytics" enterLabel="enter analytics" denied={denied} />
          </div>
        ) : (
          <>
            {stats.backend === 'memory' ? (
              <p className="border border-amber-300 bg-amber-50 px-4 py-2 text-[0.8rem]" data-testid="backend-memory">
                Upstash Redis is not configured, so counts live in one server instance and reset on deploy. Add
                UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel to keep them.
              </p>
            ) : null}
            <section className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="totals">
              {[
                ['Opens', t.opens ?? 0],
                ['First messages', t.first_messages ?? 0],
                ['First-message rate', pct(stats.rates.firstMessageRate)],
                ['Starter taps', t.starter_taps ?? 0],
                ['Agent asks (MCP)', t.agent_asks ?? 0],
              ].map(([k, v]) => (
                <div key={String(k)} className="border border-[#ded8ce] bg-white p-4">
                  <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#1b1713]/45">{k}</p>
                  <p className="text-[1.6rem] tabular-nums">{v}</p>
                </div>
              ))}
            </section>
            <Funnel f={stats.funnel} />
            <GpuRouterPanel />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Breakdown title="Source" rows={stats.breakdown.source} asked={stats.askedBy.source} />
              <Breakdown title="Landing" rows={stats.breakdown.landing} asked={stats.askedBy.landing} />
              <Breakdown title="Country" rows={stats.breakdown.country} />
              <Breakdown title="Language" rows={stats.breakdown.locale} />
              <Breakdown title="Device" rows={stats.breakdown.device} />
              <Breakdown title="Caller" rows={stats.breakdown.caller} />
              <Breakdown title="Starter" rows={stats.breakdown.starter} />
              <Breakdown title="Topic" rows={stats.breakdown.topic} />
            </div>
            <section className="border border-[#ded8ce] bg-white p-4 overflow-x-auto" data-testid="days">
              <h3 className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-[#008f86] mb-2">Last 14 days (UTC)</h3>
              <table className="w-full text-[0.78rem]">
                <thead>
                  <tr className="text-left text-[#1b1713]/50">
                    <th className="py-1">Day</th><th>Opens</th><th>Uniques</th><th>Saw starters</th><th>Taps</th><th>Asked</th><th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.days.map((d) => (
                    <tr key={d.day} className="border-t border-[#f0ebe3] tabular-nums">
                      <td className="py-1 font-mono">{d.day}</td>
                      <td>{d.counters.opens ?? 0}</td>
                      <td>{d.uniques}</td>
                      <td>{d.counters.starters_seen ?? 0}</td>
                      <td>{d.counters.starter_taps ?? 0}</td>
                      <td>{d.counters.first_messages ?? 0}</td>
                      <td>{d.counters.agent_asks ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="border border-[#ded8ce] bg-white p-4 overflow-x-auto" data-testid="recent">
              <h3 className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-[#008f86] mb-2">Recent sessions (no IPs)</h3>
              <table className="w-full text-[0.75rem]">
                <thead>
                  <tr className="text-left text-[#1b1713]/50">
                    <th className="py-1">When (UTC)</th><th>Caller</th><th>Source</th><th>Landing</th><th>Country</th><th>Lang</th><th>Device</th><th>Starters</th><th>Taps</th><th>Asked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.slice(0, 50).map((r) => (
                    <tr key={r.sid} className="border-t border-[#f0ebe3]">
                      <td className="py-1 font-mono">{new Date(r.firstAt).toISOString().slice(0, 16).replace('T', ' ')}</td>
                      <td>{r.caller}</td><td>{r.source}</td><td className="font-mono">{r.landing}</td><td>{r.country}</td>
                      <td>{r.locale}</td><td>{r.device}</td><td>{r.sawStarters ? 'yes' : '—'}</td><td>{r.starterTaps}</td><td>{r.asked ? 'yes' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
