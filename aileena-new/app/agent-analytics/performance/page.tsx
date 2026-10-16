import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';
import { readPerfDashboard, type PerfDashboard, type PerfSource, type PerfTurn } from '@/lib/agentRuntime/perf';
import type { PerfSummary, SeriesPoint } from '@/lib/agentRuntime/perfStats';

export const metadata: Metadata = {
  title: 'Inference performance · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TEAL = '#008f86';

// ── formatting ──
const ms = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`);
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v * 1000) / 10}%`);
const usd = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v === 0 ? '$0' : v < 0.01 ? `$${v.toFixed(5)}` : `$${v.toFixed(3)}`;
const n0 = (v: number | null | undefined) => (v === null || v === undefined ? '—' : String(Math.round(v)));
const hhmm = (t: number) => new Date(t).toISOString().slice(11, 16);
const when = (t: number) => new Date(t).toISOString().slice(5, 16).replace('T', ' ');

/** What each metric means, for learning. Shown on tap/hover via <details>. */
const HELP: Record<string, string> = {
  ttft: 'Time to first token: from the request reaching the server to the first model output. This is the wait a visitor feels before text starts. It includes prep (quota, prompt build, routing) plus the model’s prefill of the whole prompt.',
  latency: 'Total latency: request received to the last token. TTFT plus decode time (output tokens ÷ decode speed), plus any tool round trips.',
  p50p95: 'p50 is the median turn. p95 means 95% of turns were faster than this; it shows the slow tail that a few visitors hit.',
  tokens: 'Tokens per turn: input (system prompt + history + tool results, summed over tool steps) and output (what the model wrote). Cost and prefill time grow with input; decode time grows with output.',
  cache: 'Prefix cache hit rate: share of input tokens the provider already had cached from an earlier request with the same prefix. Cached tokens skip prefill (faster TTFT) and DeepSeek bills them at ~2% of the miss price. The site keeps a byte-stable system prefix per conversation to maximise this.',
  decode: 'Decode speed: output tokens per second after the first token. Memory-bandwidth bound on a GPU; quantisation (FP8/AWQ) and speculative decoding mainly improve this number.',
  cost: 'Estimated from list prices (DeepSeek per-token, peak/off-peak; GPU = seconds the turn held the GPU × Modal’s per-second price). The provider invoice is the source of truth.',
  prep: 'Prep: time the server spent before calling the model (quota, memory, prompt and tool table, routing).',
  rates: 'Error: provider failed mid-turn. Empty: the model finished with no visible output (retried automatically). Retry: an attempt was thrown away first (empty retry or GPU failover). Degrade: the visitor got fixed fallback copy instead of a model answer. Drop: the connection broke mid-answer.',
  breaker: 'Circuit breaker per provider: after 3 consecutive failures it opens for 60 s (traffic goes elsewhere), then half-open lets one probe through; success closes it.',
  gpu: 'GPU lifecycle: COLD (no replica, costs nothing) → WARMING (wake sent, container + model loading) → WARM (serving) → DRAINING (owner stopped new GPU turns). The router only sends visitors to a WARM GPU.',
  compare: 'Same metrics grouped by provider and, for the GPU, by optimisation variant (base, fp8, awq, ngram/draft speculative decoding). The variant comes from the GPU server’s /v1/models alias or AGENT_GPU_VARIANT. Compare rows with similar turn counts and prompts.',
  bench: 'Bench runs are owner turns sent by `pnpm bench:inference`. They use the same prompt shapes each time, so runs are comparable across providers and GPU variants.',
};

function Info({ k }: { k: keyof typeof HELP }) {
  return (
    <details className="relative inline-block align-middle ml-1 group">
      <summary
        className="list-none cursor-pointer select-none inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#1b1713]/25 text-[0.6rem] text-[#1b1713]/55 hover:border-[#008f86] hover:text-[#008f86]"
        aria-label="What this means"
      >
        ?
      </summary>
      <div className="absolute z-20 left-0 mt-1 w-64 sm:w-72 border border-[#ded8ce] bg-white p-3 text-[0.75rem] leading-relaxed normal-case tracking-normal font-sans text-[#1b1713]/80 shadow-sm">
        {HELP[k]}
      </div>
    </details>
  );
}

function H({ children, help }: { children: ReactNode; help?: keyof typeof HELP }) {
  return (
    <h3 className="font-mono text-[0.6rem] tracking-[0.22em] uppercase mb-2" style={{ color: TEAL }}>
      {children}
      {help ? <Info k={help} /> : null}
    </h3>
  );
}

function Card({ label, value, sub, help }: { label: string; value: string; sub?: string; help?: keyof typeof HELP }) {
  return (
    <div className="border border-[#ded8ce] bg-white p-4">
      <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#1b1713]/45">
        {label}
        {help ? <Info k={help} /> : null}
      </p>
      <p className="text-[1.45rem] tabular-nums leading-tight mt-1">{value}</p>
      {sub ? <p className="text-[0.72rem] text-[#1b1713]/50 tabular-nums mt-0.5">{sub}</p> : null}
    </div>
  );
}

/** Small dependency-free SVG line chart (p50 solid, p95 dashed). */
function LineChart({ points, pick, label }: { points: SeriesPoint[]; pick: 'ttft' | 'lat'; label: string }) {
  const W = 600;
  const Hh = 140;
  const p50 = points.map((p) => (pick === 'ttft' ? p.ttftP50 : p.latP50));
  const p95 = points.map((p) => (pick === 'ttft' ? p.ttftP95 : p.latP95));
  const max = Math.max(1, ...p95.filter((x): x is number => x !== null), ...p50.filter((x): x is number => x !== null));
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * (W - 40) + 30;
  const y = (v: number) => Hh - 18 - (v / max) * (Hh - 30);
  const path = (vals: Array<number | null>) =>
    vals
      .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .filter(Boolean)
      .join(' ');
  const any = p50.some((v) => v !== null);
  return (
    <figure className="border border-[#ded8ce] bg-white p-4" data-testid={`chart-${pick}`}>
      <H help={pick === 'ttft' ? 'ttft' : 'latency'}>{label} · last 24 h (UTC hours)</H>
      {!any ? (
        <p className="text-[0.8rem] text-[#1b1713]/45">No answered turns in the last 24 hours.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full h-auto" role="img" aria-label={`${label} p50 and p95 per hour`}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={30} x2={W - 10} y1={y(max * f)} y2={y(max * f)} stroke="#f0ebe3" />
              <text x={0} y={y(max * f) + 3} fontSize={9} fill="#1b171380">
                {ms(max * f)}
              </text>
            </g>
          ))}
          <polyline points={path(p95)} fill="none" stroke={TEAL} strokeOpacity={0.45} strokeDasharray="4 3" strokeWidth={1.5} />
          <polyline points={path(p50)} fill="none" stroke={TEAL} strokeWidth={2} />
          {p50.map((v, i) => (v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={2.2} fill={TEAL} />))}
          {points.map((p, i) => (i % 6 === 0 ? <text key={p.t} x={x(i) - 10} y={Hh - 3} fontSize={9} fill="#1b171380">{hhmm(p.t)}</text> : null))}
        </svg>
      )}
      <figcaption className="text-[0.7rem] text-[#1b1713]/45 mt-1">Solid: p50 · dashed: p95 · dots: hours with turns</figcaption>
    </figure>
  );
}

function Bars({ title, rows, help }: { title: string; rows: Record<string, number>; help?: keyof typeof HELP }) {
  const list = Object.entries(rows).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const total = list.reduce((a, [, v]) => a + v, 0) || 1;
  return (
    <section className="border border-[#ded8ce] bg-white p-4" data-testid={`bars-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <H help={help}>{title}</H>
      {list.length === 0 ? (
        <p className="text-[0.8rem] text-[#1b1713]/45">No data yet.</p>
      ) : (
        <div className="space-y-1.5">
          {list.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-[0.78rem]">
              <span className="w-28 shrink-0 truncate font-mono text-[#1b1713]/75" title={k}>{k}</span>
              <span className="h-2.5 bg-[#00a89d]/70" style={{ width: `${Math.max(2, (v / total) * 100)}%` }} />
              <span className="tabular-nums text-[#1b1713]/60">{v}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Rates({ s }: { s: PerfSummary }) {
  const rows: Array<[string, number]> = [
    ['Error', s.rates.error],
    ['Empty', s.rates.empty],
    ['Retry', s.rates.retry],
    ['Degrade', s.rates.degrade],
    ['Drop', s.rates.drop],
    ['Cancelled', s.rates.cancelled],
  ];
  return (
    <section className="border border-[#ded8ce] bg-white p-4" data-testid="rates">
      <H help="rates">Reliability</H>
      <div className="grid grid-cols-3 gap-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="text-[0.68rem] text-[#1b1713]/50">{k}</p>
            <p className={`tabular-nums text-[1.05rem] ${v > 0.05 && k !== 'Cancelled' ? 'text-[#b4532a]' : ''}`}>{pct(v)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusCards({ d }: { d: PerfDashboard }) {
  const tone = (s: string) => (s === 'closed' || s === 'WARM' ? 'bg-[#00a89d]' : s === 'open' || s === 'COLD' || s === 'off' ? 'bg-[#1b1713]/25' : 'bg-amber-400');
  const lastWake = d.events.find((e) => e.kind === 'gpu' && e.to === 'WARM' && e.ms);
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="status">
      <div className="border border-[#ded8ce] bg-white p-4">
        <H help="breaker">Breakers</H>
        {Object.entries(d.status.breakers).map(([p, s]) => (
          <p key={p} className="flex items-center gap-2 text-[0.82rem]">
            <span className={`h-2 w-2 rounded-full ${tone(s)}`} />
            <span className="font-mono">{p}</span>
            <span className="text-[#1b1713]/55">{s}</span>
          </p>
        ))}
      </div>
      <div className="border border-[#ded8ce] bg-white p-4">
        <H help="gpu">GPU tier</H>
        <p className="flex items-center gap-2 text-[0.82rem]">
          <span className={`h-2 w-2 rounded-full ${tone(d.status.gpu.state)}`} />
          <span className="font-mono">{d.status.gpu.state}</span>
          <span className="text-[#1b1713]/55">mode {d.status.gpu.mode}</span>
        </p>
        <p className="text-[0.72rem] text-[#1b1713]/50 mt-1">
          {d.status.gpu.provider ? `${d.status.gpu.provider} (${d.status.gpu.model})` : 'Off: set AGENT_GPU_MODE (see infra/gpu/README.md).'}
        </p>
        {lastWake ? <p className="text-[0.72rem] text-[#1b1713]/50">Last cold start: {ms(lastWake.ms)}</p> : null}
      </div>
      <div className="border border-[#ded8ce] bg-white p-4">
        <H>Storage</H>
        <p className="text-[0.82rem] font-mono">{d.backend === 'redis' ? 'Upstash Redis' : 'in-memory ring buffer'}</p>
        <p className="text-[0.72rem] text-[#1b1713]/50">
          {d.window.turns} turns kept (cap {d.window.cap})
          {d.window.oldestAt ? ` · since ${when(d.window.oldestAt)} UTC` : ''}
        </p>
      </div>
    </section>
  );
}

function CompareTable({ rows, label }: { rows: PerfDashboard['compare']; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.76rem] min-w-[760px]">
        <thead>
          <tr className="text-left text-[#1b1713]/50">
            <th className="py-1">{label}</th>
            <th>Turns</th>
            <th>TTFT p50</th>
            <th>TTFT p95</th>
            <th>Latency p50</th>
            <th>Decode tok/s</th>
            <th>Tok in / out</th>
            <th>Cache hit</th>
            <th>Cost / turn</th>
            <th>Degrade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, s }) => (
            <tr key={key} className="border-t border-[#f0ebe3] tabular-nums">
              <td className="py-1 pr-2 font-mono break-all">{key}</td>
              <td>{s.n}</td>
              <td>{ms(s.ttftP50)}</td>
              <td>{ms(s.ttftP95)}</td>
              <td>{ms(s.latP50)}</td>
              <td>{s.decodeTokS === null ? '—' : s.decodeTokS.toFixed(1)}</td>
              <td>
                {n0(s.tokInAvg)} / {n0(s.tokOutAvg)}
              </td>
              <td>{pct(s.cacheHitRate)}</td>
              <td>{usd(s.costPerTurn)}</td>
              <td>{pct(s.rates.degrade)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareBars({ rows }: { rows: PerfDashboard['compare'] }) {
  const max = Math.max(1, ...rows.map((r) => r.s.ttftP95 ?? r.s.ttftP50 ?? 0));
  return (
    <div className="space-y-2 mt-3" data-testid="compare-bars">
      {rows.map(({ key, s }) => (
        <div key={key} className="text-[0.75rem]">
          <p className="font-mono text-[#1b1713]/70 truncate">{key}</p>
          <div className="relative h-3 bg-[#f4f0ea]">
            <span className="absolute inset-y-0 left-0 bg-[#00a89d]/30" style={{ width: `${((s.ttftP95 ?? 0) / max) * 100}%` }} />
            <span className="absolute inset-y-0 left-0 bg-[#00a89d]" style={{ width: `${((s.ttftP50 ?? 0) / max) * 100}%` }} />
          </div>
          <p className="text-[#1b1713]/45 tabular-nums">
            TTFT p50 {ms(s.ttftP50)} · p95 {ms(s.ttftP95)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RecentTable({ turns }: { turns: PerfTurn[] }) {
  return (
    <section className="border border-[#ded8ce] bg-white p-4" data-testid="recent-turns">
      <H>Recent turns (no text, no ids)</H>
      {turns.length === 0 ? (
        <p className="text-[0.8rem] text-[#1b1713]/45">No turns recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[0.72rem] min-w-[820px]">
            <thead>
              <tr className="text-left text-[#1b1713]/50">
                <th className="py-1">When (UTC)</th>
                <th>Provider · model</th>
                <th>Rule</th>
                <th>TTFT</th>
                <th>Total</th>
                <th>In / out</th>
                <th>Cached</th>
                <th>Cost</th>
                <th>Outcome</th>
                <th>Src</th>
              </tr>
            </thead>
            <tbody>
              {turns.map((t) => (
                <tr key={t.id} className="border-t border-[#f0ebe3] tabular-nums">
                  <td className="py-1 font-mono">{when(t.at)}</td>
                  <td className="font-mono">
                    {t.provider}
                    {t.model ? ` · ${t.model}` : ''}
                    {t.variant ? ` · ${t.variant}` : ''}
                  </td>
                  <td className="font-mono">{t.rule}</td>
                  <td>{ms(t.ttftMs)}</td>
                  <td>{ms(t.latencyMs)}</td>
                  <td>
                    {t.inTok} / {t.outTok}
                  </td>
                  <td>{t.cacheHit === null ? '—' : t.cacheHit}</td>
                  <td>{usd(t.costUsd)}</td>
                  <td className={t.outcome === 'ok' ? '' : 'text-[#b4532a]'}>
                    {t.outcome}
                    {t.retries ? ` (+${t.retries} retry)` : ''}
                  </td>
                  <td>{t.src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Tabs({ view, src }: { view: string; src: PerfSource }) {
  const tab = (v: string, label: string) => (
    <Link
      key={v}
      href={`/agent-analytics/performance?view=${v}&src=${src}`}
      className={`px-3 py-1.5 border text-[0.75rem] ${view === v ? 'border-[#008f86] text-[#008f86] bg-white' : 'border-[#ded8ce] text-[#1b1713]/60'}`}
    >
      {label}
    </Link>
  );
  const s = (v: PerfSource, label: string) => (
    <Link
      key={v}
      href={`/agent-analytics/performance?view=${view}&src=${v}`}
      className={`px-2 py-1 text-[0.7rem] font-mono ${src === v ? 'text-[#008f86] underline' : 'text-[#1b1713]/45'}`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex flex-wrap items-center gap-2" data-testid="perf-tabs">
      {tab('overview', 'Overview')}
      {tab('compare', 'Compare')}
      {tab('bench', 'Bench')}
      <span className="ml-auto flex gap-1">
        {s('site', 'site turns')}
        {s('bench', 'bench turns')}
        {s('all', 'all')}
      </span>
    </nav>
  );
}

function Overview({ d }: { d: PerfDashboard }) {
  const s = d.summary;
  const today = d.today;
  return (
    <>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="cards">
        <Card label="TTFT p50 / p95" value={ms(s.ttftP50)} sub={`p95 ${ms(s.ttftP95)}`} help="ttft" />
        <Card label="Latency p50 / p95" value={ms(s.latP50)} sub={`p95 ${ms(s.latP95)}`} help="latency" />
        <Card label="Tokens / turn" value={`${n0(s.tokInAvg)} → ${n0(s.tokOutAvg)}`} sub="input → output" help="tokens" />
        <Card label="Cache hit rate" value={pct(s.cacheHitRate)} sub="of input tokens" help="cache" />
        <Card label="Decode speed" value={s.decodeTokS === null ? '—' : `${s.decodeTokS.toFixed(1)} tok/s`} sub="p50 after first token" help="decode" />
        <Card label="Cost / turn" value={usd(s.costPerTurn)} sub={`${s.n} turns · ${usd(s.costTotal)} total`} help="cost" />
        <Card label="Today (UTC)" value={usd(today.costTotal)} sub={`${today.n} turns`} help="cost" />
        <Card label="Prep p50" value={ms(s.prepP50)} sub="before the model call" help="prep" />
      </section>
      <StatusCards d={d} />
      <div className="grid lg:grid-cols-2 gap-3">
        <LineChart points={d.series} pick="ttft" label="TTFT" />
        <LineChart points={d.series} pick="lat" label="Latency" />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Rates s={s} />
        <Bars title="Provider mix" rows={d.providerMix} />
        <Bars title="Routing rule" rows={d.ruleMix} />
      </div>
      <section className="border border-[#ded8ce] bg-white p-4 overflow-x-auto" data-testid="days">
        <H help="cost">Per day (UTC)</H>
        <table className="w-full text-[0.76rem] min-w-[560px]">
          <thead>
            <tr className="text-left text-[#1b1713]/50">
              <th className="py-1">Day</th>
              <th>Turns</th>
              <th>Cost</th>
              <th>Cost / turn</th>
              <th>Cache hit</th>
              <th>Errors</th>
              <th>Empty</th>
              <th>Retried</th>
              <th>Degrade</th>
            </tr>
          </thead>
          <tbody>
            {d.days.map(({ day, counters: c }) => {
              const turns = c.turns ?? 0;
              const cost = (c.costMicro ?? 0) / 1_000_000;
              const cacheAll = (c.cacheHit ?? 0) + (c.cacheMiss ?? 0);
              return (
                <tr key={day} className="border-t border-[#f0ebe3] tabular-nums">
                  <td className="py-1 font-mono">{day}</td>
                  <td>{turns}</td>
                  <td>{usd(cost)}</td>
                  <td>{turns ? usd(cost / turns) : '—'}</td>
                  <td>{cacheAll ? pct((c.cacheHit ?? 0) / cacheAll) : '—'}</td>
                  <td>{c['o:error'] ?? 0}</td>
                  <td>{c['o:empty'] ?? 0}</td>
                  <td>{c.retried ?? 0}</td>
                  <td>{c['o:degrade'] ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="border border-[#ded8ce] bg-white p-4" data-testid="events">
        <H help="breaker">Breaker &amp; GPU events</H>
        {d.events.length === 0 ? (
          <p className="text-[0.8rem] text-[#1b1713]/45">No transitions yet (everything has stayed closed / off).</p>
        ) : (
          <ul className="text-[0.75rem] font-mono space-y-0.5">
            {d.events.slice(0, 20).map((e, i) => (
              <li key={`${e.at}-${i}`}>
                {when(e.at)} · {e.kind}
                {e.provider ? ` ${e.provider}` : ''} · {e.from ?? '?'} → {e.to}
                {e.ms ? ` (${ms(e.ms)})` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
      <RecentTable turns={d.recent} />
    </>
  );
}

/** Owner-only: gated server-side; non-owners get the unlock form and no data (the JSON API answers 403). */
export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string; src?: string }>;
}) {
  const sp = await searchParams;
  const owner = await getOwnerIdentity();
  const view = sp.view === 'compare' || sp.view === 'bench' ? sp.view : 'overview';
  const src: PerfSource = sp.src === 'bench' || sp.src === 'all' ? sp.src : view === 'bench' ? 'bench' : 'site';
  const d = owner ? await readPerfDashboard({ src }) : null;
  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14 space-y-5">
        <header className="space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">owner · inference performance</p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight">How fast and how cheap is each answer?</h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Every /api/chat turn: which model answered and why, time to first token, total latency, tokens, prefix-cache hits
            and estimated cost. Numbers only: no message text, no IPs, no visitor or session ids.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/agent-analytics" className="hover:text-[#008f86]">← console analytics</Link>
          </p>
        </header>

        {!d ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4 max-w-xl" data-testid="perf-locked">
            <OwnerUnlockForm next="/agent-analytics/performance" enterLabel="enter performance" denied={sp.error === 'denied'} />
          </div>
        ) : (
          <>
            <Tabs view={view} src={src} />
            {d.backend === 'memory' ? (
              <p className="border border-amber-300 bg-amber-50 px-4 py-2 text-[0.8rem]" data-testid="perf-backend-memory">
                Upstash Redis is not configured, so turns live in one server instance’s memory and reset on deploy. Add
                UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel to keep history.
              </p>
            ) : null}
            {view === 'overview' ? <Overview d={d} /> : null}
            {view === 'compare' ? (
              <section className="border border-[#ded8ce] bg-white p-4 space-y-2" data-testid="compare">
                <H help="compare">Compare providers &amp; GPU variants</H>
                {d.compare.length === 0 ? <p className="text-[0.8rem] text-[#1b1713]/45">No turns yet.</p> : <CompareTable rows={d.compare} label="Provider · variant" />}
                <CompareBars rows={d.compare} />
                <p className="text-[0.72rem] text-[#1b1713]/50">
                  GPU rows split by variant once the GPU tier is live. Deploy a variant with AILEENA_GPU_QUANT / AILEENA_GPU_SPEC (infra/gpu/README.md),
                  then run <span className="font-mono">pnpm bench:inference --tier gpu</span> to fill a comparable row.
                </p>
              </section>
            ) : null}
            {view === 'bench' ? (
              <section className="border border-[#ded8ce] bg-white p-4 space-y-2" data-testid="bench">
                <H help="bench">Bench runs</H>
                {d.benchRuns.length === 0 ? (
                  <p className="text-[0.8rem] text-[#1b1713]/45">No bench runs yet.</p>
                ) : (
                  <CompareTable rows={d.benchRuns} label="Run · provider" />
                )}
                <pre className="text-[0.7rem] bg-[#f6f3ee] p-3 overflow-x-auto">
{`AILEENA_OWNER_COOKIE=<__aileena_pass value> pnpm bench:inference --base https://www.aileena.xyz --tier deepseek --n 5
pnpm bench:inference --target openai --base-url https://api.deepseek.com --model deepseek-flash --key-env DEEPSEEK_API_KEY --report`}
                </pre>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
