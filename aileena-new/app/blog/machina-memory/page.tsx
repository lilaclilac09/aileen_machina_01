'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function MachinaMemoryArticle() {
  return (
    <SubstackShell
      category="Essay"
      date="2026.07.29"
      tags="Machina · ReMeLight · Dreaming · Console"
      title="How the Site Remembers"
      dek="Not a vector warehouse. Markdown in git, TF-IDF at build, soft Redis per visitor, Dreaming on a timer — and the real console questions that broke it until we fixed the route."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
          <strong style={strong}>Not this:</strong> stuffing the whole second brain into the prompt · a paid vector DB as day-one · fine-tuning the site model every time I publish.
        </p>

        <SectionLabel>1 · The itch</SectionLabel>
        <p style={bodyStyle}>
          The site agent sits in the console and answers as if she knows the room: techno set, Didion shelf,
          what I published this week. Training weights do not know that room. They know a blur of the internet.
        </p>
        <p style={bodyStyle}>
          So Machina memory is external on purpose — closer to{' '}
          <strong style={strong}>ReMeLight</strong> than to &ldquo;just make the context window bigger.&rdquo;
          Git holds cold truth. Build makes a fast index. Chat keeps a short working window. Redis (optional)
          remembers <em>you</em>, not her taste.
        </p>
        <blockquote style={quoteStyle}>
          Hard memory is what she likes. Soft memory is what you asked. They must not mix.
        </blockquote>

        <SectionLabel>2 · Four layers (what actually ships)</SectionLabel>
        <p style={bodyStyle}>
          In the repo this is <code style={codeStyle}>aileena_second_brain/</code> + a thin runtime in{' '}
          <code style={codeStyle}>/api/chat</code>.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>L1 working</strong> — last ~20 turns + optional client{' '}
            <code style={codeStyle}>priorTopics</code>. Dies with the session.
          </li>
          <li>
            <strong style={strong}>L2 fast</strong> — TF-IDF over Markdown chunks (
            <code style={codeStyle}>searchMemories</code>). Built on every deploy; no live embedding call.
          </li>
          <li>
            <strong style={strong}>L3 cold</strong> — <code style={codeStyle}>memories/**</code> in git.
            Taste, setlist, faith-from-essays, <code style={codeStyle}>latest-content.md</code>. Dreaming may
            report; it must not delete hard pins.
          </li>
          <li>
            <strong style={strong}>Soft (visitor)</strong> — Upstash Redis{' '}
            <code style={codeStyle}>visitor:soft:&#123;id&#125;</code>, 90-day sliding TTL, anonymous cookie.
            If Redis is off, the console still works with local prior topics.
          </li>
        </ul>
        <p style={bodyStyle}>
          Chip prices, Semi news, research PDFs live in a <strong style={strong}>separate</strong> data tool
          lane. That is not Dreaming. That is catalogue.
        </p>

        <SectionLabel>3 · Scenario A — &ldquo;What music does she like?&rdquo;</SectionLabel>
        <p style={bodyStyle}>
          Tool router R2 classifies this as <strong style={strong}>taste</strong>. The model is only allowed
          memory (+ articles). <code style={codeStyle}>queryChip</code> is not in the room — so it cannot
          &ldquo;helpfully&rdquo; invent an H100 price while talking about Daydreaming.
        </p>
        <p style={bodyStyle}>
          Retrieval hits <code style={codeStyle}>setlist.md</code> / <code style={codeStyle}>latest-content.md</code>
          / music prompts. Answer cites the curated /sound set, not a random Spotify chart from training.
        </p>
        <pre style={preStyle}>{`route: taste
preferred: searchMemories
blocked: queryChip, latestPrice, …`}</pre>

        <SectionLabel>4 · Scenario B — &ldquo;更新了什么吗&rdquo; (this week&apos;s bug)</SectionLabel>
        <p style={bodyStyle}>
          A visitor asked what updated. The console answered with an old essay (
          <Link href="/blog/cli" style={inlineLink}>
            The CLI Was Always the Trading Floor
          </Link>
          ) and a Dreaming date that was already stale.
        </p>
        <p style={bodyStyle}>
          The Markdown shelf was fine — Local Models and YMTC Wuhan were already in{' '}
          <code style={codeStyle}>latest-content.md</code>. The failure was retrieval shape: Chinese
          &ldquo;更新了什么吗&rdquo; scored zero against English chunks, prefetch was empty, and the model
          filled the gap from training.
        </p>
        <p style={bodyStyle}>
          Fix: a hard route <code style={codeStyle}>latest_updates</code> that <em>requires</em>{' '}
          <code style={codeStyle}>searchMemories(&quot;latest content&quot;)</code>, and the same English query
          for prefetch. After deploy, that question must cite the shelf by date — not invent May.
        </p>
        <pre style={preStyle}>{`ASK:  更新了什么吗
ROUTE: latest_updates
QUERY: "latest content"   ← forced English shelf key
HIT:   How I Fell for Local Models · YMTC Wuhan · …`}</pre>

        <SectionLabel>5 · Scenario C — I publish an article</SectionLabel>
        <p style={bodyStyle}>
          I do not want to DM myself &ldquo;start dreaming.&rdquo; Merge to <code style={codeStyle}>main</code> under
          fixed paths triggers <strong style={strong}>Memory on Article</strong>:
        </p>
        <pre style={preStyle}>{`aileena-new/app/blog/**
aileena-new/app/updates/**
aileena-new/lib/research/**
+ DJ setlist paths`}</pre>
        <p style={bodyStyle}>
          Pipeline: <code style={codeStyle}>sync:content-memory</code> → <code style={codeStyle}>dreaming</code> →
          rebuild index → bot commits only under <code style={codeStyle}>aileena_second_brain/**</code> (outside
          the path filter, so it does not loop). Weekly Monday Dreaming still runs for the long compression pass.
        </p>
        <p style={bodyStyle}>
          Local alias if I want the same before merge:{' '}
          <code style={codeStyle}>pnpm memory:on-article</code>.
        </p>

        <SectionLabel>6 · Scenario D — &ldquo;Is she available for hire?&rdquo;</SectionLabel>
        <p style={bodyStyle}>
          Route: <strong style={strong}>hire_cv</strong>. Allowed tools: <em>none</em>. The model answers from
          the static CV / contact block. No memory search, no chip tools — so availability cannot be
          hallucinated out of a taste file or an H100 row.
        </p>

        <SectionLabel>7 · Scenario E — &ldquo;What did I ask before?&rdquo;</SectionLabel>
        <p style={bodyStyle}>
          That is soft memory, not hard. The prompt injects the visitor&apos;s recent questions/topics from Redis
          (or client prior topics). <code style={codeStyle}>searchMemories</code> is the wrong tool — it would
          return <em>her</em> Didion shelf, not your last turn about Huawei.
        </p>

        <SectionLabel>8 · Scenario F — teachers on X (Semi / mach33)</SectionLabel>
        <p style={bodyStyle}>
          Free RSS cron every 6h fills <code style={codeStyle}>tweets.jsonl</code>. Dreaming snapshots a digest.
          We learned the hard way that timeline RTs pull Elon / SpaceX meme noise into the teachers DB — so
          ingest is <strong style={strong}>watchlist-author only</strong>, and the 7-day sample applies a soft
          substance filter. The dossier stays analysts, not launch memes.
        </p>

        <SectionLabel>9 · ReAct guardrails (why the loop does not thrash)</SectionLabel>
        <ul style={listStyle}>
          <li>Max 4 tool steps per turn.</li>
          <li>Identical tool+args in the same turn → blocked as duplicate.</li>
          <li>Observations truncated (top hits, short snippets) so the KV cache does not eat the budget.</li>
          <li>
            Model circuit: provider failures open a short degrade window instead of hanging the console.
          </li>
        </ul>
        <p style={bodyStyle}>
          That is the Memory Wall angle in one line: external files + retrieval + compression → shorter
          prompts → less decode traffic. The essay lives in{' '}
          <code style={codeStyle}>hardware-memory-wall.md</code>; the product is the console staying fast.
        </p>

        <SectionLabel>10 · What we refuse (for now)</SectionLabel>
        <ul style={listStyle}>
          <li>Day-one vector warehouse — TF-IDF over pinned Markdown is enough at this scale.</li>
          <li>Dreaming that mutates hard taste files without a human promote step.</li>
          <li>Letting soft visitor history bleed into &ldquo;what she likes.&rdquo;</li>
          <li>Answering &ldquo;what&apos;s new&rdquo; from training when <code style={codeStyle}>latest-content.md</code> exists.</li>
        </ul>

        <SectionLabel>11 · How to poke it</SectionLabel>
        <p style={bodyStyle}>Paste these into the console after a deploy:</p>
        <ol style={listStyle}>
          <li>what music / DJ set?</li>
          <li>更新了什么吗</li>
          <li>is she available for hire?</li>
          <li>what did I ask before? (after 1–3)</li>
        </ol>
        <p style={bodyStyle}>
          Expect: setlist from memory · newest shelf articles by date · CV without tools · soft recall of
          your questions. If &ldquo;what&apos;s new&rdquo; cites a random 2026.05 post that is not on the shelf,
          the route regressed.
        </p>
        <p style={bodyStyle}>
          Ops map:{' '}
          <code style={codeStyle}>docs/MEMORY_ARCHITECTURE.md</code> · fixed paths:{' '}
          <code style={codeStyle}>docs/MEMORY_WATCH_PATHS.md</code> · frameworks list:{' '}
          <code style={codeStyle}>memories/semantic/memory-frameworks.md</code>.
        </p>
        <p style={bodyStyle}>
          Related writing:{' '}
          <Link href="/blog/local-models" style={inlineLink}>
            How I Fell for Local Models
          </Link>{' '}
          (owned weights vs retrieval) · the living shelf at{' '}
          <Link href="/blog/watch-listening-shelf" style={inlineLink}>
            watch-listening-shelf
          </Link>
          .
        </p>
      </article>
    </SubstackShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '0.7rem',
        letterSpacing: '0.18em',
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

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.88em',
  background: 'rgba(255,255,255,0.06)',
  padding: '1px 6px',
  borderRadius: 3,
  color: '#fff',
};
const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.78rem',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.75)',
  background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px',
  overflowX: 'auto',
  letterSpacing: '0.01em',
  margin: '0 0 24px',
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
const quoteStyle: React.CSSProperties = {
  margin: '28px 0 32px',
  padding: '20px 24px',
  borderLeft: '3px solid #00ffea',
  background: 'linear-gradient(90deg, rgba(0,255,234,0.08), rgba(0,255,234,0.0))',
  fontSize: 'clamp(1.05rem, 2.4vw, 1.25rem)',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.9)',
  fontStyle: 'italic',
};
