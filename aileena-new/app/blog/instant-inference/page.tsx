'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const stackRows: [string, string, string][] = [
  ['Model', 'General-purpose, runs anything', 'One model, cast into the silicon'],
  ['Weights at runtime', 'Streamed from off-chip HBM', 'Embedded on-die, never moved'],
  ['Memory', 'HBM stacks + advanced packaging', 'Unified on-chip, DRAM-level density'],
  ['Cooling', 'Liquid', 'Air — a 2.5 kW server'],
  ['Interconnect', 'High-speed I/O, miles of cabling', 'Not needed'],
  ['Footprint', 'Racks → data-center campus', 'One 815 mm² die, TSMC 6 nm'],
  ['Power', 'Hundreds of kilowatts', '~10× less, per Taalas'],
];

const references = [
  { label: 'Taalas — Products (HC1 technology demonstrator)', href: 'https://taalas.com/products/' },
  { label: 'ChatJimmy — the hard-wired Llama chatbot demo', href: 'https://chatjimmy.ai' },
  { label: '"The path to ubiquitous AI" — Ljubisa Bajic, Taalas Mission Log', href: 'https://taalas.com/the-path-to-ubiquitous-ai/' },
  { label: 'Taalas — "The Model Is the Computer"', href: 'https://taalas.com' },
  { label: 'Taalas emerges from stealth with $50M (PR Newswire, 2024)', href: 'https://www.prnewswire.com/news-releases/taalas-emerges-from-stealth-with-50-million-in-funding-and-a-groundbreaking-silicon-ai-technology-302079053.html' },
  { label: 'Tenstorrent founder forms AI startup Taalas (EE News Europe)', href: 'https://www.eenewseurope.com/en/tenstorrent-founder-forms-ai-startup-taalas-raises-50-million/' },
  { label: 'Taalas raises $169M to develop AI chips challenging Nvidia (MLQ.ai)', href: 'https://mlq.ai/news/taalas-secures-169m-funding-to-develop-ai-chips-challenging-nvidia/' },
  { label: 'DoubleZero, Multicast Fiber — latency as the bottleneck, in another domain (companion piece)', href: '/blog/doublezero' },
];

export default function InstantInferenceArticle() {
  return (
    <SubstackShell
      category="Hardware"
      date="2026.05.29"
      tags="Taalas · HC1 · Hardcore Models · ChatJimmy"
      title="Why AI Has to Be Instantaneous"
      dek={<>Taalas bakes a Llama directly into silicon and runs it at 17,000 tokens a second — roughly 10× the fastest GPUs, 20× cheaper to build. Why extreme speed isn&apos;t a feature but the thing that makes agents, voice, and cheap reasoning <em>possible</em> — and the catch.</>}
    >
      {/* ── Stats wall ── */}
      <StatsWall stats={[
        { value: '17K tok/s', label: 'per user', sub: 'Llama 3.1 8B, hard-wired into HC1' },
        { value: '~10×', label: 'faster than SOTA', sub: 'vs H200 · B200 · Groq · Cerebras' },
        { value: '20×', label: 'cheaper to build', sub: 'and ~10× less power, per Taalas' },
        { value: '2 mo', label: 'model to silicon', sub: 'any model, via Taalas Foundry' },
      ]} />

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Two things keep AI out of most products: it&apos;s too slow, and it costs too much. A chatbot that
          takes a couple of seconds feels fine. An agent that makes a hundred model calls to finish one task
          does not — at human-paced latency it takes minutes, and the bill is enormous. Taalas, a chip startup
          founded by Tenstorrent founder Ljubisa Bajic, has a blunt answer: stop running the model as software
          on a general-purpose chip and cast it directly into silicon. Their first product, a Llama 3.1 8B
          baked into one chip, runs at 17,000 tokens per second per user — about ten times the fastest GPU
          setups — and you can talk to it right now at{' '}
          <a href="https://chatjimmy.ai" target="_blank" rel="noopener noreferrer" style={inlineLink}>ChatJimmy</a>.
          This is about why that number matters.
        </p>

        <SectionLabel>Two walls: latency and cost</SectionLabel>
        <p style={bodyStyle}>
          Bajic&apos;s argument starts with two barriers. The first is <strong style={strong}>latency</strong>.
          Talking to a language model still lags far behind the speed of human thought — a coding assistant can
          stall for tens of seconds, which is enough to break a programmer&apos;s flow. The second is{' '}
          <strong style={strong}>cost</strong>. Running a modern model means room-sized machines pulling
          hundreds of kilowatts, with liquid cooling, stacked memory, exotic packaging, and miles of cable,
          scaling up to data-center campuses with their own power plants.
        </p>
        <p style={bodyStyle}>
          Both problems trace back to the same root: we run AI models as <em>software</em> on general-purpose
          chips. A GPU is a flexible machine that can run any model, and it pays for that flexibility in
          energy, heat, and money. Taalas&apos;s claim is that AI inference — which Bajic calls the most
          critical computational workload humanity has ever faced — is too important to keep running on
          hardware that was designed to do everything.
        </p>

        <SectionLabel>Speed is the product, not a feature</SectionLabel>
        <p style={bodyStyle}>
          The reason to care about extreme speed isn&apos;t that a faster chatbot feels nicer. It&apos;s that
          latency decides which applications are even <em>possible</em>. The clearest case is the agent: a
          single user-facing answer is no longer one model call, it&apos;s often dozens — planning, calling
          tools, reading results, re-planning, writing the answer.
        </p>

        <Diagram caption="One agent task fans out into many model calls. Per-call latency compounds.">
{`one agent task
  ├─ plan          ─► model call
  ├─ search        ─► model call
  ├─ read result   ─► model call
  ├─ …             ─► × dozens
  └─ write answer  ─► model call

at ~50 tok/s   each step is seconds   → the task takes minutes
at 17,000 tok/s the whole loop is imperceptible`}
        </Diagram>

        <p style={bodyStyle}>
          At normal GPU token rates, every step in that loop is a visible pause, and the pauses stack into
          minutes. At 17,000 tokens per second the whole loop finishes before you&apos;d notice the first one.
          The same logic applies to voice — a real conversation can&apos;t have a one-second gap before every
          reply — and to reasoning techniques that spend lots of tokens to think, like chain-of-thought or
          sampling many candidates, which only make sense if tokens are fast and nearly free.
        </p>

        <PullQuote attribution="Ljubisa Bajic, Taalas">
          Automated agentic AI applications demand millisecond latencies, not leisurely human-paced responses.
        </PullQuote>

        <SectionLabel>What Taalas actually shipped</SectionLabel>
        <p style={bodyStyle}>
          The product is real, and you can poke at it today. <strong style={strong}>HC1</strong> is a
          technology demonstrator — a single chip on TSMC&apos;s 6 nm process, 815 mm² of die, 53 billion
          transistors, sitting in a 2.5 kW server. Hard-wired into it is Meta&apos;s Llama 3.1 8B. There are
          two front doors:
        </p>
        <ul style={listStyle}>
          <li><strong style={strong}><a href="https://chatjimmy.ai" target="_blank" rel="noopener noreferrer" style={inlineLink}>ChatJimmy</a></strong>, a stripped-down chatbot with a live token counter so you can watch how fast it generates. It is the consumer-facing face of the chip.</li>
          <li><strong style={strong}>An inference API</strong>, the same hard-wired Llama offered to developers as a beta service.</li>
        </ul>
        <p style={bodyStyle}>
          On that chip Taalas reports <strong style={strong}>17,000 tokens per second per user</strong>, which
          they put at roughly ten times the fastest current setups, twenty times cheaper to build, and ten
          times lower power. The company was founded about two and a half years ago, and the manifesto notes
          the first product was built by 24 people on $30M of the $200M-plus they&apos;ve raised — a deliberate
          contrast with the &quot;medieval army&quot; spending of most deep-tech startups.
        </p>

        <SectionLabel>The model is the computer</SectionLabel>
        <p style={bodyStyle}>
          Taalas&apos;s tagline is literal. On a GPU, the model is data: billions of parameters that get loaded
          into a general-purpose chip and multiplied at runtime. On a Taalas chip, the model <em>is</em> the
          chip — the parameters are etched into the silicon itself, and human language is the only software
          that runs on top. They call the result a Hardcore Model, and the principle behind it is total
          specialization.
        </p>
        <p style={bodyStyle}>
          The bet is an old one in hardware: whenever a workload matters enough, you stop running it on a
          general-purpose processor and build a chip that does only that. It&apos;s why Bitcoin mining moved
          from CPUs to ASICs, and why video codecs and network routers have dedicated silicon. Taalas is
          applying it to a whole neural network — one model, one chip, nothing general about it.
        </p>

        <SectionLabel>The memory wall is the real enemy</SectionLabel>
        <p style={bodyStyle}>
          The speed comes from one specific idea. Modern inference hardware is split in two: memory on one
          side, compute on the other. That split exists because of a hardware paradox. The dense, cheap memory
          — DRAM — is built on a process that can&apos;t hold compute logic, and reaching it off-chip is
          thousands of times slower than on-chip memory, while the fast compute chips can&apos;t be built on a
          DRAM process. So a GPU spends much of its time and energy shuttling weights from stacked HBM memory
          into the compute cores, every single token.
        </p>

        <Diagram caption="The GPU moves weights to the compute. Taalas puts the compute where the weights already are.">
{`GPU / general-purpose inference
   ┌───────────┐   slow bus    ┌──────────────┐
   │   HBM     │ ────────────► │   compute    │
   │ (weights) │ ◄──────────── │   cores      │
   └───────────┘   shuttle     └──────────────┘
   weights moved every token · most energy spent moving, not computing

Taalas HC1 — the model is the computer
   ┌─────────────────────────────────────────┐
   │   weights embedded in the silicon,       │
   │   compute wrapped directly around them   │
   │   (storage + compute unified on-die)     │
   └─────────────────────────────────────────┘
   nothing to fetch · the parameter IS the circuit`}
        </Diagram>

        <p style={bodyStyle}>
          Taalas erases the boundary. By unifying storage and compute on a single die at DRAM-level density,
          the weights live exactly where they&apos;re used. There&apos;s no bus to cross and nothing to fetch.
          That&apos;s the structural reason the chip can be both much faster and much lower power at once — it
          isn&apos;t paying the energy tax of moving billions of parameters around on every token.
        </p>

        <SectionLabel>Radical simplification</SectionLabel>
        <p style={bodyStyle}>
          Once you remove the memory-compute boundary and tailor the silicon to one model, most of the
          complexity of a modern AI server falls away. Bajic&apos;s third principle is that this lets you
          redesign the whole stack from first principles and skip the hard parts entirely.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>GPU inference</th>
                <th style={thStyle}>Taalas HC1</th>
              </tr>
            </thead>
            <tbody>
              {stackRows.map((r, i) => (
                <tr key={i} style={trStyle}>
                  <td style={tdLabelStyle}>{r[0]}</td>
                  <td style={tdStyle}>{r[1]}</td>
                  <td style={tdStyle}>{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          No HBM, no advanced packaging, no 3D stacking, no liquid cooling, no high-speed I/O. Taalas argues
          that this engineering simplicity — not some exotic breakthrough — is what produces the
          order-of-magnitude drop in total system cost. The interesting move is that the speed and the
          cheapness come from the <em>same</em> decision, not two separate optimizations.
        </p>

        <SectionLabel>The catch: a frozen, low-bit model</SectionLabel>
        <p style={bodyStyle}>
          A piece this favorable to a vendor needs the caveats stated plainly, and to their credit Taalas
          states most of them itself.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>It runs one model, and the model is quantized hard.</strong> The
          first-generation silicon predates standard low-precision formats, so it uses a custom{' '}
          <code style={codeStyle}>3-bit</code> base data type; the Silicon Llama mixes{' '}
          <code style={codeStyle}>3-bit</code> and <code style={codeStyle}>6-bit</code> parameters and is, in
          Taalas&apos;s own words, &quot;aggressively quantized&quot; with &quot;some quality degradations
          relative to GPU benchmarks.&quot; The second-generation platform (HC2) moves to a standard{' '}
          <code style={codeStyle}>4-bit</code> floating-point format to address this.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>The chip is hard-wired.</strong> You can&apos;t load a new model onto it; a
          new model means new silicon. Flexibility survives only at the edges — a configurable context window
          and fine-tuning through <code style={codeStyle}>LoRA</code> adapters. The answer to obsolescence is
          speed of fabrication: Taalas says it can turn a previously unseen model into hardware in about two
          months, and the roadmap is a mid-sized reasoning model on HC1 this spring, then a frontier model on
          the denser HC2 by winter.
        </p>

        <div style={calloutAccent}>
          <p style={calloutTitle}>What they admit</p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            &quot;Our debut model is clearly not on the leading edge,&quot; Bajic writes — they shipped it as a
            beta anyway, specifically to let developers feel what changes when inference is sub-millisecond and
            near-free. The performance numbers are also Taalas&apos;s own (their H200/B200 measurements; Groq,
            Sambanova, and Cerebras figures via Artificial Analysis), at a 1k/1k input/output length.
            Independent benchmarks aren&apos;t out yet.
          </p>
        </div>

        <SectionLabel>What instant, near-free inference unlocks</SectionLabel>
        <p style={bodyStyle}>
          Here&apos;s the answer to &quot;why be extremely fast.&quot; When a token costs almost nothing and
          arrives almost instantly, a set of applications that were impractical on GPUs starts to make sense.
        </p>

        <CardGrid columns={3} cards={[
          { tag: 'Agents', title: 'Hundred-call loops', body: <>A loop that plans, searches, and self-corrects across dozens of calls finishes in the time a single GPU call used to take. The loop stops being the bottleneck.</> },
          { tag: 'Voice', title: 'Real-time conversation', body: <>No awkward pause before every reply. Sub-millisecond inference is what lets a voice agent keep the rhythm of human speech instead of talking over it or lagging behind.</> },
          { tag: 'Coding', title: 'Keeping the flow', body: <>The assistant that ponders for minutes is the one that breaks concentration. At keyboard speed it becomes a partner you don&apos;t wait on — the exact friction Bajic calls out.</> },
          { tag: 'Reasoning', title: 'Spend tokens freely', body: <>Chain-of-thought and best-of-N sampling trade tokens for quality. They only pencil out when tokens are cheap and fast, which is precisely what hard-wired silicon makes them.</> },
          { tag: 'On-device', title: 'A box, not a campus', body: <>A 2.5 kW box near the user, rather than a remote data center, changes the latency floor and the privacy story for anything that wants intelligence at the edge.</> },
          { tag: 'Ambient', title: 'Always-on intelligence', body: <>When each call is effectively free, you can run a model continuously — monitoring, classifying, transforming streams — instead of rationing calls behind a cost gate.</> },
        ]} />

        <p style={bodyStyle}>
          The pattern across all six: these aren&apos;t faster versions of things we already do. They&apos;re
          things that don&apos;t work at all until latency and cost both collapse. That&apos;s why Taalas
          shipped a deliberately unremarkable model — the point of the demo isn&apos;t the model, it&apos;s the
          speed envelope around it.
        </p>

        <SectionLabel>The ENIAC bet, and the case against</SectionLabel>
        <p style={bodyStyle}>
          Bajic frames the whole thing with a history lesson. The first computer, ENIAC, was a room full of
          vacuum tubes — slow, costly, and unscalable. The transistor is what turned computing into
          workstations, then PCs, then phones, then something in every device. His claim is that today&apos;s
          AI data centers are the ENIAC phase, and that specialized silicon — one model per chip — is the
          transistor moment that makes AI ubiquitous.
        </p>

        <blockquote style={blockquoteStyle}>
          General-purpose computing entered the mainstream by becoming easy to build, fast, and cheap. AI needs
          to do the same.
        </blockquote>

        <p style={bodyStyle}>
          The case against is just as clear, and it&apos;s about churn. Models improve every few months;
          silicon is frozen the day it tapes out. A mask set for Llama 3.1 8B — a model that&apos;s already not
          state of the art — is a bet that a fast frozen model beats a current model at GPU speed for enough
          real workloads. Meanwhile GPUs keep getting faster, and a middle camp of fast-but-still-programmable
          chips (Groq, Cerebras, Sambanova) is chasing the same latency prize without committing to a single
          model.
        </p>
        <p style={bodyStyle}>
          Taalas&apos;s edge holds only if three things stay true: the two-month turnaround keeps their catalog
          fresh enough, enough applications care more about speed and cost than about always running the newest
          weights, and the quality lost to aggressive quantization stays inside tolerance. All three are open
          questions. But the underlying observation — that we&apos;re running the most important workload in
          computing on hardware built to run everything, and paying for it in seconds and kilowatts — is hard
          to argue with. The fastest way to find out whether the bet pays is already live: you can go talk to
          it.
        </p>

        <SectionLabel>References</SectionLabel>
        <div style={{ marginTop: 16 }}>
          <ol style={{ paddingLeft: 28, margin: 0 }}>
            {references.map((ref, i) => (
              <li key={i} style={{
                fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 6,
              }}>
                <a
                  href={ref.href}
                  target={ref.href.startsWith('http') ? '_blank' : undefined}
                  rel={ref.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{ color: 'rgba(0,255,234,0.6)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,255,234,0.6)')}
                >
                  {ref.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <p style={{ ...bodyStyle, marginTop: 40, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          All performance figures are Taalas-reported, at a 1k/1k input/output sequence length: their own H200
          and B200 measurements, with Groq, Sambanova, and Cerebras numbers taken from Artificial Analysis. The
          Silicon Llama is aggressively quantized (3-bit / 6-bit) and Taalas acknowledges quality degradation
          versus GPU benchmarks; independent third-party benchmarks were not available at the time of writing.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Styles (dark inline values; substack.css re-skins them light) ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};

const strong: React.CSSProperties = {
  color: 'rgba(255,255,255,0.95)',
  fontWeight: 600,
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.85em',
  background: 'rgba(0,255,234,0.08)',
  padding: '1px 6px',
  border: '1px solid rgba(0,255,234,0.18)',
  borderRadius: 2,
  color: 'rgba(0,255,234,0.9)',
};

const listStyle: React.CSSProperties = {
  paddingLeft: 24,
  margin: '0 0 24px',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  letterSpacing: '0.025em',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: '#00ffea',
  fontSize: '0.65rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem',
  letterSpacing: '0.02em',
  verticalAlign: 'top',
};

const tdLabelStyle: React.CSSProperties = {
  ...tdStyle,
  color: 'rgba(255,255,255,0.45)',
  fontWeight: 500,
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const blockquoteStyle: React.CSSProperties = {
  margin: '48px 0',
  padding: '28px 32px',
  background: 'rgba(0,255,234,0.04)',
  borderLeft: '3px solid #00ffea',
  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
  fontWeight: 600,
  letterSpacing: '0.05em',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.9)',
};

const calloutAccent: React.CSSProperties = {
  margin: '32px 0',
  padding: '22px 26px',
  background: 'rgba(0,255,234,0.04)',
  border: '1px solid rgba(0,255,234,0.18)',
};

const calloutTitle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.55rem',
  letterSpacing: '0.4em',
  color: 'rgba(0,255,234,0.8)',
  textTransform: 'uppercase',
  margin: '0 0 14px',
};

const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationColor: 'rgba(0,255,234,0.4)',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace',
      fontSize: '0.6rem',
      letterSpacing: '0.45em',
      color: '#00ffea',
      textTransform: 'uppercase',
      marginBottom: 20,
      marginTop: 56,
      opacity: 0.8,
    }}>
      {children}
    </p>
  );
}

/* ── Stats wall ── */
function StatsWall({ stats }: { stats: { value: string; label: string; sub?: string }[] }) {
  return (
    <div style={{
      maxWidth: 1100,
      margin: '48px auto 0',
      padding: '0 32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 1,
      background: 'rgba(0,255,234,0.12)',
      border: '1px solid rgba(0,255,234,0.18)',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: '#000',
          padding: '32px 28px',
          display: 'flex', flexDirection: 'column', gap: 8,
          position: 'relative',
        }}>
          <span style={{
            fontFamily: "'Barlow Condensed', system-ui, sans-serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 700, letterSpacing: '0.02em',
            color: '#00ffea', lineHeight: 1,
          }}>
            {s.value}
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
            marginTop: 6,
          }}>
            {s.label}
          </span>
          {s.sub && (
            <span style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.45, letterSpacing: '0.02em', marginTop: 2,
            }}>
              {s.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Card grid ── */
function CardGrid({ cards, columns = 3 }: {
  cards: { num?: string; tag: string; title: string; href?: string; body: React.ReactNode }[];
  columns?: number;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 2 ? 280 : 240}px, 1fr))`,
      gap: 14,
      margin: '32px 0 40px',
    }}>
      {cards.map((c, i) => {
        const inner = (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
              {c.num ? (
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.3em',
                  color: 'rgba(0,255,234,0.55)',
                }}>
                  {c.num}
                </span>
              ) : null}
              <span style={{
                fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.4em',
                color: '#00ffea', textTransform: 'uppercase',
              }}>
                {c.tag}
              </span>
            </div>
            <p style={{
              fontFamily: 'monospace', fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.92)', margin: '0 0 12px',
              wordBreak: 'break-word', letterSpacing: '0.01em',
            }}>
              {c.title}
            </p>
            <p style={{
              fontSize: '0.85rem', lineHeight: 1.65,
              color: 'rgba(255,255,255,0.55)', margin: 0,
              letterSpacing: '0.02em',
            }}>
              {c.body}
            </p>
          </>
        );
        const baseCardStyle: React.CSSProperties = {
          padding: '20px 22px',
          background: 'rgba(0,255,234,0.025)',
          border: '1px solid rgba(0,255,234,0.15)',
          borderTop: '2px solid rgba(0,255,234,0.5)',
          textDecoration: 'none',
          display: 'block',
          transition: 'background 0.18s, border-color 0.18s',
        };
        if (c.href) {
          return (
            <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" style={baseCardStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,255,234,0.06)';
                e.currentTarget.style.borderColor = 'rgba(0,255,234,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,255,234,0.025)';
                e.currentTarget.style.borderColor = 'rgba(0,255,234,0.15)';
              }}
            >
              {inner}
            </a>
          );
        }
        return <div key={i} style={baseCardStyle}>{inner}</div>;
      })}
    </div>
  );
}

/* ── Pull quote ── */
function PullQuote({ children, attribution }: { children: React.ReactNode; attribution?: string }) {
  return (
    <div style={{
      margin: '48px -8px',
      padding: '28px 32px 28px 28px',
      borderLeft: '3px solid #00ffea',
      background: 'linear-gradient(90deg, rgba(0,255,234,0.08), rgba(0,255,234,0.0))',
    }}>
      <p style={{
        fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)',
        lineHeight: 1.5, letterSpacing: '0.02em',
        color: 'rgba(255,255,255,0.92)', fontStyle: 'italic',
        margin: 0, fontWeight: 500,
      }}>
        &ldquo;{children}&rdquo;
      </p>
      {attribution && (
        <p style={{
          fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.3em',
          color: 'rgba(0,255,234,0.7)', textTransform: 'uppercase',
          margin: '14px 0 0',
        }}>
          — {attribution}
        </p>
      )}
    </div>
  );
}

/* ── Diagram frame (wraps ASCII as a visual figure) ── */
function Diagram({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <figure style={{ margin: '40px 0 48px' }}>
      <div style={{
        padding: '4px',
        background: 'linear-gradient(135deg, rgba(0,255,234,0.25), rgba(0,255,234,0.04))',
      }}>
        <div style={{
          background: '#000',
          padding: '28px 32px',
          overflowX: 'auto',
          boxShadow: 'inset 0 0 40px rgba(0,255,234,0.05)',
        }}>
          <pre style={{
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            {children}
          </pre>
        </div>
      </div>
      {caption && (
        <figcaption style={{
          fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
          margin: '10px 0 0', textAlign: 'left',
        }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
