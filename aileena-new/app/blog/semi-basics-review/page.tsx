'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * Five-minute English review of "obvious" semi / systems concepts —
 * paired with Branch Education explainers (cache/memory, PCB factory walk,
 * GPU architecture).
 */

const VIDEOS = [
  {
    id: 'TfhL5kBiQVI',
    title: 'How does Computer Cache, Memory, and Storage Work?',
    channel: 'Branch Education',
    role: 'Memory hierarchy',
  },
  {
    id: 'Z2LgmIGE2nI',
    title: 'What are PCBs? How do PCBs Work?',
    channel: 'Branch Education',
    role: 'Board stack + manufacturing walk',
  },
  {
    id: 'h9Z4oGN89MU',
    title: 'How do Graphics Cards Work? Exploring GPU Architecture',
    channel: 'Branch Education',
    role: 'GPU as parallel machine',
  },
] as const;

export default function SemiBasicsReviewArticle() {
  return (
    <SubstackShell
      category="Hardware"
      date="2026.08.06"
      tags="Semiconductors · Memory · PCB · GPU · Branch Education · Five-minute review"
      title="Concepts You Think You Know"
      dek="A five-minute English review of three basics that feel obvious until you have to explain them: memory hierarchy, the printed circuit board (and how it is actually built), and what a GPU is doing when it is not 'just a faster CPU'."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          Semi writing goes bad when the vocabulary is familiar and the picture is not. People say{' '}
          <em>cache</em>, <em>HBM</em>, <em>PCB</em>, <em>GPU</em> fluently — then stall when asked
          what moves, what waits, and what the factory is actually stacking. This note is a short
          reset: three concepts, three Branch Education videos, no jargon for its own sake.
        </p>
        <p style={bodyStyle}>
          Pair this with the denser rack / board pieces —{' '}
          <Link href="/blog/ai-pcb" style={linkStyle}>
            The PCB Stack Inside an AI Rack
          </Link>
          ,{' '}
          <Link href="/blog/huawei-hbm" style={linkStyle}>
            Huawei / HBM
          </Link>
          ,{' '}
          <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>
            What AI Hardware Is Running Out Of
          </Link>
          — after the mental model is clean. Next shelf up (TPU + CPO, high-signal YouTube
          only):{' '}
          <Link href="/blog/semi-watch-tpu-cpo" style={linkStyle}>
            TPU &amp; CPO watch list
          </Link>
          .
        </p>

        <SectionLabel>1 · Cache, memory, storage — three speeds, one lie</SectionLabel>
        <p style={bodyStyle}>
          The lie: &ldquo;memory&rdquo; is one thing. The machine is a stack of different
          distances to data. Registers and L1/L2/L3 caches sit next to the cores — tiny, expensive,
          fast. DRAM (and on AI cards, HBM) is the working set you can afford to keep warm. Disk /
          SSD is where data lives when you are not using it. Latency and bandwidth are not the same
          constraint: a miss can stall a core even when peak bandwidth looks huge on a slide.
        </p>
        <p style={bodyStyle}>
          What to re-learn in five minutes: every &ldquo;fast AI&rdquo; story is partly a story about
          keeping useful bits close to the math. When people say the memory wall, they mean the
          cores are waiting on the stack, not that FLOPs disappeared.
        </p>
        <VideoCard {...VIDEOS[0]} />

        <SectionLabel>2 · PCB — not &ldquo;the green board,&rdquo; a multi-layer factory object</SectionLabel>
        <p style={bodyStyle}>
          A PCB is the city grid under the chips: copper traces, power and ground planes, vias that
          climb between layers, pads where packages land (including BGA under an SoC). Smartphones
          and AI racks both live or die on how those layers are stacked — signal integrity, power
          delivery, heat, and yield.
        </p>
        <p style={bodyStyle}>
          Factory angle (same Branch walk-through): boards are laminated, imaged, etched, drilled,
          plated, and tested — a manufacturing loop, not a single print. When AI racks talk about
          22-layer HDI or mid-planes copper-sintered together, that is this loop pushed to extremes.
          If you only remember &ldquo;PCB = green rectangle,&rdquo; you will misread the supply chain
          articles.
        </p>
        <VideoCard {...VIDEOS[1]} note="Treat this as the board-side factory tour: how layers become a product." />

        <SectionLabel>3 · GPU — parallel machine, not &ldquo;CPU with more cores&rdquo;</SectionLabel>
        <p style={bodyStyle}>
          A GPU wins when thousands of simple lanes run the same kind of work on different data
          (SIMD / SIMT). It loses when the work is full of branches, tiny dependent steps, or
          constant trips to far memory. &ldquo;More TFLOPS&rdquo; only matters if the problem maps
          onto that parallel shape and the memory system can feed it.
        </p>
        <p style={bodyStyle}>
          What to re-learn: graphics cards and AI accelerators share the same basic bet —
          throughput over single-thread latency — and they inherit the same cache / HBM / PCB
          constraints from sections 1 and 2. Architecture diagrams are not decoration; they are
          where the bottlenecks hide.
        </p>
        <VideoCard {...VIDEOS[2]} />

        <SectionLabel>Watch order · ~5 minutes of framing + the videos</SectionLabel>
        <ol style={listStyle}>
          <li>Skim this page once (concepts only).</li>
          <li>
            Play the three Branch Education videos above — cache/memory, PCB (+ manufacturing),
            GPU.
          </li>
          <li>
            Come back to the AI-rack / HBM essays when you need numbers, not definitions.
          </li>
        </ol>
        <p style={bodyStyle}>
          If you can explain, without slides: (1) why a cache miss hurts, (2) why a via and a power
          plane matter on a board, (3) why a GPU hates serial work — you are past &ldquo;I already
          know this&rdquo; and into usable semi literacy.
        </p>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/blog/watch-listening-shelf"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.35em',
              color: 'rgba(255,255,255,0.35)',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            ← Listening & watching shelf
          </Link>
        </div>
      </article>
    </SubstackShell>
  );
}

function VideoCard({
  id,
  title,
  channel,
  role,
  note,
}: {
  id: string;
  title: string;
  channel: string;
  role: string;
  note?: string;
}) {
  const href = `https://www.youtube.com/watch?v=${id}`;
  return (
    <div
      style={{
        margin: '28px 0 40px',
        padding: '20px 22px',
        border: '1px solid rgba(0,255,234,0.18)',
        background: 'rgba(0,255,234,0.03)',
      }}
    >
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#00ffea',
          marginBottom: 10,
          opacity: 0.85,
        }}
      >
        {role} · {channel}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'rgba(255,255,255,0.92)',
          fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
          fontWeight: 600,
          textDecoration: 'none',
          borderBottom: '1px solid rgba(0,255,234,0.35)',
          lineHeight: 1.45,
        }}
      >
        {title}
      </a>
      <p
        style={{
          marginTop: 12,
          fontFamily: 'monospace',
          fontSize: '0.62rem',
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.4)',
          wordBreak: 'break-all',
        }}
      >
        {href}
      </p>
      {note ? (
        <p style={{ ...bodyStyle, marginTop: 14, marginBottom: 0, fontSize: '0.92rem' }}>{note}</p>
      ) : null}
    </div>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const linkStyle: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(0,255,234,0.3)',
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.45em',
        color: '#00ffea',
        textTransform: 'uppercase',
        marginBottom: 20,
        marginTop: 56,
        opacity: 0.8,
      }}
    >
      {children}
    </p>
  );
}
