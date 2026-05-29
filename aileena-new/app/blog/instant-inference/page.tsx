'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import { c, s, PullQuote, Aside, Sources } from '../essayStyle';

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
    <div style={s.page}>
      <ScrollUnlock />

      <header style={s.topBar}>
        <Link href="/#blog" style={s.topLink}
          onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = c.muted)}
        >
          ← Archive
        </Link>
        <span style={s.siteName}>Aileena Machina</span>
      </header>

      <article style={s.container}>
        <p style={s.kicker}>Hardware · May 29, 2026 · 7 min read</p>
        <h1 style={s.h1}>Why AI Has to Be Instantaneous</h1>
        <p style={s.dek}>
          Taalas bakes a language model directly into silicon and runs it at 17,000 tokens a second.
          A look at why that speed is the whole point — and what it costs.
        </p>

        <hr style={s.rule} />

        <p style={s.lead}>
          Two things keep AI out of most products: it&apos;s too slow, and it costs too much. A chatbot
          that takes a couple of seconds feels fine. An agent that makes a hundred model calls to finish
          one task does not — at human-paced latency it takes minutes, and the bill is enormous.
        </p>
        <p style={s.body}>
          Taalas, a chip startup founded by Tenstorrent founder Ljubisa Bajic, has a blunt answer: stop
          running the model as software on a general-purpose chip and cast it directly into silicon. Their
          first product, a Llama 3.1 8B baked into one chip, runs at 17,000 tokens per second per user —
          about ten times the fastest GPU setups — and you can talk to it right now at{' '}
          <a href="https://chatjimmy.ai" target="_blank" rel="noopener noreferrer" style={s.link}>ChatJimmy</a>.
          This is about why that number matters.
        </p>

        <h2 style={s.h2}>Two walls: latency and cost</h2>
        <p style={s.body}>
          Bajic&apos;s argument starts with two barriers. The first is <strong style={s.strong}>latency</strong>.
          Talking to a language model still lags far behind the speed of human thought — a coding assistant
          can stall for tens of seconds, which is enough to break a programmer&apos;s flow. The second is{' '}
          <strong style={s.strong}>cost</strong>. Running a modern model means room-sized machines pulling
          hundreds of kilowatts, with liquid cooling, stacked memory, exotic packaging, and miles of cable,
          scaling up to data-center campuses with their own power plants.
        </p>
        <p style={s.body}>
          Both problems trace back to the same root: we run AI models as <em>software</em> on
          general-purpose chips. A GPU is a flexible machine that can run any model, and it pays for that
          flexibility in energy, heat, and money. Taalas&apos;s claim is that AI inference — which Bajic
          calls the most critical computational workload humanity has ever faced — is too important to keep
          running on hardware that was designed to do everything.
        </p>

        <h2 style={s.h2}>Speed is the product, not a feature</h2>
        <p style={s.body}>
          The reason to care about extreme speed isn&apos;t that a faster chatbot feels nicer. It&apos;s
          that latency decides which applications are even <em>possible</em>. The clearest case is the
          agent. A single user-facing answer is no longer one model call; it&apos;s often dozens — planning,
          calling tools, reading results, re-planning, writing the answer.
        </p>
        <p style={s.body}>
          At normal GPU token rates, every step in that loop is a visible pause, and the pauses stack into
          minutes. At 17,000 tokens per second the whole loop finishes before you&apos;d notice the first
          one. The same logic applies to voice — a real conversation can&apos;t have a one-second gap before
          every reply — and to reasoning techniques that spend lots of tokens to think, like
          chain-of-thought or sampling many candidates, which only make sense if tokens are fast and nearly
          free.
        </p>

        <PullQuote attribution="Ljubisa Bajic, Taalas">
          Automated agentic AI applications demand millisecond latencies, not leisurely human-paced
          responses.
        </PullQuote>

        <h2 style={s.h2}>What Taalas actually shipped</h2>
        <p style={s.body}>
          The product is real, and you can poke at it today. <strong style={s.strong}>HC1</strong> is a
          technology demonstrator — a single chip on TSMC&apos;s 6 nm process, 815 mm² of die, 53 billion
          transistors, sitting in a 2.5 kW server. Hard-wired into it is Meta&apos;s Llama 3.1 8B. There are
          two front doors:
        </p>
        <ul style={s.list}>
          <li style={s.li}>
            <strong style={s.strong}><a href="https://chatjimmy.ai" target="_blank" rel="noopener noreferrer" style={s.link}>ChatJimmy</a></strong>,
            a stripped-down chatbot with a live token counter so you can watch how fast it generates. It is
            the consumer-facing face of the chip.
          </li>
          <li style={s.li}>
            <strong style={s.strong}>An inference API</strong>, the same hard-wired Llama offered to developers
            as a beta service.
          </li>
        </ul>
        <p style={s.body}>
          On that chip Taalas reports <strong style={s.strong}>17,000 tokens per second per user</strong>,
          which they put at roughly ten times the fastest current setups, twenty times cheaper to build, and
          ten times lower power. The company was founded about two and a half years ago, and the manifesto
          notes the first product was built by 24 people on $30M of the $200M-plus they&apos;ve raised — a
          deliberate contrast with the &quot;medieval army&quot; spending of most deep-tech startups.
        </p>

        <h2 style={s.h2}>The model is the computer</h2>
        <p style={s.body}>
          Taalas&apos;s tagline is literal. On a GPU, the model is data: billions of parameters that get
          loaded into a general-purpose chip and multiplied at runtime. On a Taalas chip, the model{' '}
          <em>is</em> the chip — the parameters are etched into the silicon itself, and human language is
          the only software that runs on top. They call the result a Hardcore Model, and the principle
          behind it is total specialization.
        </p>
        <p style={s.body}>
          The bet is an old one in hardware: whenever a workload matters enough, you stop running it on a
          general-purpose processor and build a chip that does only that. It&apos;s why Bitcoin mining moved
          from CPUs to ASICs, and why video codecs and network routers have dedicated silicon. Taalas is
          applying it to a whole neural network — one model, one chip, nothing general about it.
        </p>

        <h2 style={s.h2}>The memory wall is the real enemy</h2>
        <p style={s.body}>
          The speed comes from one specific idea. Modern inference hardware is split in two: memory on one
          side, compute on the other. That split exists because of a hardware paradox. The dense, cheap
          memory — DRAM — is built on a process that can&apos;t hold compute logic, and reaching it off-chip
          is thousands of times slower than on-chip memory, while the fast compute chips can&apos;t be built
          on a DRAM process. So a GPU spends much of its time and energy shuttling weights from stacked HBM
          memory into the compute cores, every single token.
        </p>
        <p style={s.body}>
          Taalas erases the boundary. By unifying storage and compute on a single die at DRAM-level density,
          the weights live exactly where they&apos;re used. There&apos;s no bus to cross and nothing to
          fetch. That&apos;s the structural reason the chip can be both much faster and much lower power at
          once — it isn&apos;t paying the energy tax of moving billions of parameters around on every token.
        </p>

        <h2 style={s.h2}>Radical simplification</h2>
        <p style={s.body}>
          Once you remove the memory-compute boundary and tailor the silicon to one model, most of the
          complexity of a modern AI server falls away. Bajic&apos;s third principle is that this lets you
          redesign the whole stack from first principles and skip the hard parts entirely.
        </p>

        <div style={{ margin: '2em 0', overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}></th>
                <th style={s.th}>GPU inference</th>
                <th style={s.th}>Taalas HC1</th>
              </tr>
            </thead>
            <tbody>
              {stackRows.map((r, i) => (
                <tr key={i}>
                  <td style={s.tdLabel}>{r[0]}</td>
                  <td style={s.td}>{r[1]}</td>
                  <td style={s.td}>{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={s.body}>
          No HBM, no advanced packaging, no 3D stacking, no liquid cooling, no high-speed I/O. Taalas argues
          that this engineering simplicity — not some exotic breakthrough — is what produces the
          order-of-magnitude drop in total system cost. The interesting move is that the speed and the
          cheapness come from the <em>same</em> decision, not two separate optimizations.
        </p>

        <h2 style={s.h2}>The catch: a frozen, low-bit model</h2>
        <p style={s.body}>
          A piece this favorable to a vendor needs the caveats stated plainly, and to their credit Taalas
          states most of them itself.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>It runs one model, and the model is quantized hard.</strong> The
          first-generation silicon predates standard low-precision formats, so it uses a custom 3-bit base
          data type; the Silicon Llama mixes 3-bit and 6-bit parameters and is, in Taalas&apos;s own words,
          &quot;aggressively quantized&quot; with &quot;some quality degradations relative to GPU
          benchmarks.&quot; The second-generation platform (HC2) moves to a standard 4-bit floating-point
          format to address this.
        </p>
        <p style={s.body}>
          <strong style={s.strong}>The chip is hard-wired.</strong> You can&apos;t load a new model onto it;
          a new model means new silicon. Flexibility survives only at the edges — a configurable context
          window and fine-tuning through LoRA adapters. The answer to obsolescence is speed of fabrication:
          Taalas says it can turn a previously unseen model into hardware in about two months, and the
          roadmap is a mid-sized reasoning model on HC1 this spring, then a frontier model on the denser HC2
          by winter.
        </p>

        <Aside label="What they admit">
          &quot;Our debut model is clearly not on the leading edge,&quot; Bajic writes — they shipped it
          as a beta anyway, specifically to let developers feel what changes when inference is
          sub-millisecond and near-free. The performance numbers are also Taalas&apos;s own (their
          H200/B200 measurements; Groq, Sambanova, and Cerebras figures via Artificial Analysis), at a
          1k/1k input/output length. Independent benchmarks aren&apos;t out yet.
        </Aside>

        <h2 style={s.h2}>What instant, near-free inference unlocks</h2>
        <p style={s.body}>
          Here&apos;s the answer to &quot;why be extremely fast.&quot; When a token costs almost nothing and
          arrives almost instantly, a set of applications that were impractical on GPUs starts to make sense.
        </p>
        <ul style={s.list}>
          <li style={s.li}><strong style={s.strong}>Agents.</strong> A loop that plans, searches, and self-corrects across dozens of calls finishes in the time a single GPU call used to take. The loop stops being the bottleneck.</li>
          <li style={s.li}><strong style={s.strong}>Voice.</strong> No awkward pause before every reply. Sub-millisecond inference is what lets a voice agent keep the rhythm of human speech instead of talking over it or lagging behind.</li>
          <li style={s.li}><strong style={s.strong}>Coding flow.</strong> The assistant that ponders for minutes is the one that breaks concentration. At keyboard speed it becomes a partner you don&apos;t wait on — the exact friction Bajic calls out.</li>
          <li style={s.li}><strong style={s.strong}>Reasoning at scale.</strong> Chain-of-thought and best-of-N sampling trade tokens for quality. They only pencil out when tokens are cheap and fast, which is precisely what hard-wired silicon makes them.</li>
          <li style={s.li}><strong style={s.strong}>On-device.</strong> A 2.5 kW box near the user, rather than a remote data center, changes the latency floor and the privacy story for anything that wants intelligence at the edge.</li>
          <li style={s.li}><strong style={s.strong}>Always-on.</strong> When each call is effectively free, you can run a model continuously — monitoring, classifying, transforming streams — instead of rationing calls behind a cost gate.</li>
        </ul>
        <p style={s.body}>
          The pattern across all six: these aren&apos;t faster versions of things we already do. They&apos;re
          things that don&apos;t work at all until latency and cost both collapse. That&apos;s why Taalas
          shipped a deliberately unremarkable model — the point of the demo isn&apos;t the model, it&apos;s
          the speed envelope around it.
        </p>

        <h2 style={s.h2}>The ENIAC bet, and the case against</h2>
        <p style={s.body}>
          Bajic frames the whole thing with a history lesson. The first computer, ENIAC, was a room full of
          vacuum tubes — slow, costly, and unscalable. The transistor is what turned computing into
          workstations, then PCs, then phones, then something in every device. His claim is that today&apos;s
          AI data centers are the ENIAC phase, and that specialized silicon — one model per chip — is the
          transistor moment that makes AI ubiquitous.
        </p>

        <blockquote style={s.blockquote}>
          General-purpose computing entered the mainstream by becoming easy to build, fast, and cheap. AI
          needs to do the same.
        </blockquote>

        <p style={s.body}>
          The case against is just as clear, and it&apos;s about churn. Models improve every few months;
          silicon is frozen the day it tapes out. A mask set for Llama 3.1 8B — a model that&apos;s already
          not state of the art — is a bet that a fast frozen model beats a current model at GPU speed for
          enough real workloads. Meanwhile GPUs keep getting faster, and a middle camp of
          fast-but-still-programmable chips (Groq, Cerebras, Sambanova) is chasing the same latency prize
          without committing to a single model.
        </p>
        <p style={s.body}>
          Taalas&apos;s edge holds only if three things stay true: the two-month turnaround keeps their
          catalog fresh enough, enough applications care more about speed and cost than about always running
          the newest weights, and the quality lost to aggressive quantization stays inside tolerance. All
          three are open questions. But the underlying observation — that we&apos;re running the most
          important workload in computing on hardware built to run everything, and paying for it in seconds
          and kilowatts — is hard to argue with. The fastest way to find out whether the bet pays is already
          live: you can go talk to it.
        </p>

        <hr style={s.rule} />

        <h2 style={{ ...s.h2, fontSize: '1.2rem', marginTop: '1.6em' }}>Sources</h2>
        <Sources items={references} />

        <p style={s.note}>
          All performance figures are Taalas-reported, at a 1k/1k input/output sequence length: their own
          H200 and B200 measurements, with Groq, Sambanova, and Cerebras numbers taken from Artificial
          Analysis. The Silicon Llama is aggressively quantized (3-bit / 6-bit) and Taalas acknowledges
          quality degradation versus GPU benchmarks; independent third-party benchmarks were not available
          at the time of writing.
        </p>

        <div style={{ marginTop: '3em' }}>
          <Link href="/#blog" style={s.topLink}
            onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = c.muted)}
          >
            ← Back to Archive
          </Link>
        </div>
      </article>
    </div>
  );
}
