'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function LocalModelsArticle() {
  return (
    <SubstackShell
      category="Essay"
      date="2026.07.28"
      tags="Polar Lab · Local LoRA · Holdout · Ownership"
      title="How I Fell for Local Models"
      dek={
        <>
          Then a tiny cloud video · where the model sits vs the harness · which layers to change ·
          scenarios · what we adjusted · scores · whether eval meets the bar. Lab:{' '}
          <a href="https://github.com/lilaclilac09/polar-lab" target="_blank" rel="noopener noreferrer" style={inlineLink}>
            polar-lab
          </a>{' '}
          · <code style={codeStyle}>Qwen2.5-0.5B-Instruct</code> + LoRA.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
          <strong style={strong}>Not this:</strong> Claude/Codex API fine-tune · Centaur replacement · production persona.
          {' '}Curriculum order (Rust → CLI → eval → SFT):{' '}
          <Link href="/blog/post-training-path" style={inlineLink}>
            Post-Training Path
          </Link>
          .
        </p>

        <SectionLabel>1 · Why — how I started loving local models</SectionLabel>
        <p style={bodyStyle}>
          I already live in API agents — Claude, Codex, whatever is sharp this month. They&apos;re great at{' '}
          <strong style={strong}>harness work</strong>: tools, long context, coding, &ldquo;just get it done.&rdquo;
        </p>
        <p style={bodyStyle}>
          What they can&apos;t give me is a clean answer to:
        </p>
        <blockquote style={quoteStyle}>
          Did <em>our</em> washed facts change <em>a model we own</em>?
        </blockquote>
        <p style={bodyStyle}>
          That itch is how Polar Lab started. Not &ldquo;replace Claude.&rdquo; More like: keep a small open model
          on the desk (Mac MPS / CPU), teach it with LoRA, and force an honest holdout score.
        </p>
        <p style={bodyStyle}>
          When the score sat at <strong style={strong}>0.200</strong>, the lab was telling the truth. When short-fact
          v4 and later packs hit <strong style={strong}>1.000</strong>, I could see <em>why</em> — data shape and
          adapter capacity, not vibes.
        </p>
        <p style={bodyStyle}>
          Loving local models, for me, means loving <strong style={strong}>ownership + measurement</strong>. The
          romance is the scoreboard.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Why Polar exists in one line:</strong> prove{' '}
          <strong style={strong}>owned data → owned weights → holdout score</strong>.
        </p>
        <ul style={listStyle}>
          <li>
            API brains are rented. You can prompt them; you cannot LoRA &ldquo;our facts&rdquo; into their weights.
          </li>
          <li>
            Memory and registries can retrieve truth, but retrieval is not a weight update.
          </li>
          <li>
            Only a model you own can answer whether <em>this</em> washed JSONL changed <em>this</em> behavior.
          </li>
        </ul>
        <p style={bodyStyle}>
          <strong style={strong}>Why early low scores were still good news:</strong> a flat{' '}
          <strong style={strong}>0.200</strong> on small packs meant the pipeline and eval were honest. A fake high
          score from leakage would have taught the wrong lesson. Polar did its job when it refused to lie.
        </p>

        <SectionLabel>2 · Then a small video of the cloud loop</SectionLabel>
        <p style={bodyStyle}>
          I don&apos;t only run this on the laptop. <strong style={strong}>Cursor cloud agents</strong> pull the same
          repo, train on CPU, write reports, open PRs. That trail is the video storyboard:
        </p>
        <ol style={listStyle}>
          <li>Wash JSONL (Machina / space)</li>
          <li>
            <code style={codeStyle}>./run_next.sh</code> or <code style={codeStyle}>POLAR_CONFIG=…</code>
          </li>
          <li>Holdout table: LoRA vs base</li>
          <li>Miss → boost golds → retrain</li>
          <li>
            PR merge · scoreboard at <strong style={strong}>1.000</strong>
          </li>
        </ol>
        <p style={bodyStyle}>
          That&apos;s enough for a short cloud clip: terminal → report → GitHub. The point of the video is the{' '}
          <strong style={strong}>loop</strong>, not a chat UI skin. Cloud doesn&apos;t invent capacity. It records
          the same lab rules at scale while you&apos;re away.
        </p>

        <SectionLabel>3 · Where this model sits — vs the harness</SectionLabel>
        <Table
          headers={['Layer', 'What it is', 'Uses local LoRA?']}
          rows={[
            [
              'Harness (Centaur-style agent runtime)',
              'Rented / API brain + tools + orchestration',
              'No — Polar is not a Centaur replacement',
            ],
            [
              'Memory (files, Postgres, Redis, second brain)',
              'Retrieve truth',
              'No — retrieval ≠ weight update',
            ],
            [
              'Product (/tools registry, live URLs / status, contact)',
              'Live site facts',
              'No — registry wins for users',
            ],
            ['Polar Lab', 'Gated LoRA playground', 'Yes — only here by default'],
          ]}
        />
        <p style={bodyStyle}>
          So: the <strong style={strong}>0.5B + adapter is not plugged into the harness as the daily brain</strong>.
          Harness keeps using strong API models + memory. Polar is the <strong style={strong}>side lab</strong>{' '}
          where we prove post-training hygiene before anyone talks about persona export.
        </p>
        <p style={bodyStyle}>
          If someone later wants a local model <em>inside</em> a harness, that is a{' '}
          <strong style={strong}>separate product decision</strong> with an explicit export gate — not
          &ldquo;smoke run = ship.&rdquo;
        </p>

        <SectionLabel>4 · Scenarios — when each piece wins</SectionLabel>
        <Table
          headers={['Scenario', 'Use', 'Why']}
          rows={[
            [
              'Live tool URL / status / hub tags that change often',
              'Product registry',
              'Facts change in git tomorrow morning; LoRA would lag',
            ],
            [
              'Guest lists, emails, allowlist codes, API secrets',
              'Memory / never train',
              'Compliance + freshness; must not enter JSONL',
            ],
            [
              'Long second-brain trees, SKU tables, news feeds',
              'Retrieve, don’t memorize',
              'Too big / too mutable for exact-match LoRA',
            ],
            [
              '“Did these washed short facts stick in our weights?”',
              'Polar holdout',
              'Only base-vs-LoRA exact_match answers that',
            ],
            [
              'Coding, multi-tool ops, long diligence jobs',
              'API harness',
              'Capacity and tooling a 0.5B adapter doesn’t have',
            ],
            [
              'Offline / edge / own-weights literacy / merge gate',
              'Local LoRA (Polar)',
              'Cheap, owned, measurable',
            ],
            [
              'Overnight CPU train + report + PR while you’re away',
              'Cloud agent',
              'Same SPEC; good process video; not magic capacity',
            ],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>Decision line:</strong> if a wrong answer is fixed by editing one source file, it
          belongs in product memory — not weights. If you need the number to prove a weight change, use Polar +
          holdout.
        </p>

        <SectionLabel>5 · Which layers need changing</SectionLabel>
        <Table
          headers={['Layer', 'Touch it?', 'What to change']}
          rows={[
            [
              'Product / registry',
              'Yes (product work)',
              'Live status / URLs / tags — edit registry / source files, not LoRA',
            ],
            [
              'Memory (files / DB / Redis)',
              'Yes when wrong',
              'Hotfix truth, PII, long docs; wrong answer → fix the source, don’t bump max_steps',
            ],
            [
              'Harness (Centaur / API agent)',
              'Don’t wire Polar yet',
              'Keep the API brain + tools; don’t make the 0.5B adapter the daily brain',
            ],
            [
              'Polar Lab (LoRA)',
              'Lab only',
              'Wash short golds; run holdout; keep adapter behind the gate',
            ],
            [
              'Cloud agent',
              'No architecture change',
              'Keep using it for train / report / video trail; same lab rules',
            ],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>One-liner:</strong> wrong answer in production → fix{' '}
          <strong style={strong}>registry / memory</strong>. Need proof that weights changed → change{' '}
          <strong style={strong}>Polar data / gates</strong>. Harness does not take the adapter yet.
        </p>

        <SectionLabel>6 · What we adjusted — pack by pack</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>6.1 What failed early.</strong> On small Machina packs (36–79 rows), holdout{' '}
          <code style={codeStyle}>exact_match</code> stuck at <strong style={strong}>0.200</strong> — same as base.
          Loss was falling; strings were not sticking.
        </p>
        <Table
          headers={['Failure mode', 'Example', 'Why it hurt']}
          rows={[
            ['Paraphrase', 'gold path → “In the Aileena memory store.”', 'Meaning-ish, string fail'],
            ['Ignored “reply with only”', 'short gold → long waffle', 'Format not pinned'],
            ['Near-miss hallucination', 'paradigmxyz/centaur → wrong org URL', 'Plausible fake'],
            ['Wrong numeral / concept', '90 → 100, sandbox pods → wrong story', 'Identifier not learned'],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>Root causes:</strong> too little data; harsh golds (paths/names); strong base
          priors toward fluent essays; train/eval paraphrases that tiny LoRA doesn&apos;t transfer; more steps alone
          didn&apos;t fix strings.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>What was not broken:</strong> the Transformer, the eval script, Mac-vs-CPU as the
          main story, or &ldquo;must have an H100 to learn the loop.&rdquo;
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>6.2 Machina — short-fact v4.</strong>
        </p>
        <Table
          headers={['Before', 'Adjustment', 'After']}
          rows={[
            [
              '36–79 rows, LoRA 0.200 = base 0.200',
              '450 train rows of identical short golds for paths/names; ~400 steps',
              'LoRA 1.000 vs base 0.200 (CPU + Mac MPS)',
            ],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>Progress:</strong> volume of identical short answers was the missing piece. Same
          holdout, same metric — behavior moved.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>6.3 Space — miss-boost + full-attn LoRA.</strong>
        </p>
        <Table
          headers={['Before', 'Adjustment', 'After']}
          rows={[
            [
              'Number misses (−132, 0.086, 102.3, 725…)',
              'Wave-1 miss-boost → 1002 train / 10 eval',
              'Intermediate 0.600',
            ],
            ['Over-boost to 1338 rows', 'Hit-set flip / overfit', 'Discarded (0.400)'],
            [
              'q,v-only LoRA on wave-1 data',
              'Expand LoRA targets to q/k/v/o',
              '1.000 vs base 0.000',
            ],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>Progress:</strong> more of the <em>right</em> short golds helped; dumping more of
          the wrong kind hurt; adapter capacity (full attention projections) closed the rest.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>6.4 What we deliberately did not do</strong>
        </p>
        <ul style={listStyle}>
          <li>
            Dump Slack / whole <code style={codeStyle}>aileena_second_brain/**</code> into JSONL
          </li>
          <li>Treat smoke adapters as production persona</li>
          <li>
            Jump <code style={codeStyle}>0.5B</code> → larger base before holdout moved
          </li>
          <li>Wire the adapter into Centaur/harness without an export gate</li>
          <li>Start DPO/RL before SFT exact-match was honest and moving</li>
        </ul>

        <SectionLabel>7 · Scoreboard — progress vs base</SectionLabel>
        <Table
          headers={['Pack', 'Train/eval', 'Config', 'LoRA', 'Base', 'Δ', 'Useful ≥0.60?', 'Clear win ≥ base+0.20?']}
          rows={[
            ['Machina', '450/10', 'machina_sft.yaml', '1.000', '0.200', '+0.800', 'YES', 'YES'],
            ['Space', '1002/10', 'space_sft.yaml (q/k/v/o)', '1.000', '0.000', '+1.000', 'YES', 'YES'],
          ]}
        />
        <p style={bodyStyle}>Earlier checkpoints (for the story arc):</p>
        <Table
          headers={['Checkpoint', 'Score', 'Note']}
          rows={[
            ['Arithmetic smoke', '0.667', 'Short answers can stick'],
            ['Machina v1–v3', '0.125–0.200', 'Honest flatline'],
            ['Machina v4', '1.000', 'Short-gold volume unlock'],
            ['Space mid', '0.600 → 0.400 → 1.000', 'Miss-boost good; over-boost bad; q/k/v/o finish'],
          ]}
        />
        <p style={bodyStyle}>
          Both packs <strong style={strong}>meet and clear</strong> the lab gates on CPU.
        </p>

        <SectionLabel>8 · Eval — is it up to standard?</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>Metric</strong> (<code style={codeStyle}>utils/eval.py</code>):
        </p>
        <pre style={preStyle}>{`pred.strip().lower() == gold.strip().lower()`}</pre>
        <ul style={listStyle}>
          <li>
            Disjoint train vs holdout prompts (<code style={codeStyle}>scripts/check_data.py</code> → overlap = 0)
          </li>
          <li>
            Always report <strong style={strong}>base vs LoRA</strong> on the same holdout
          </li>
          <li>
            <code style={codeStyle}>temperature=0</code> for scoring
          </li>
          <li>Washed English short golds only in this repo (per SPEC)</li>
          <li>
            Never commit <code style={codeStyle}>outputs/</code> adapters as the product brain
          </li>
        </ul>
        <Table
          headers={['Gate', 'Rule', 'Machina', 'Space']}
          rows={[
            [
              'Beat baseline / noise',
              'LoRA clearly above ~0.20 floor when base is weak',
              'Pass',
              'Pass',
            ],
            ['Useful', 'LoRA ≥ 0.60', 'Pass (1.000)', 'Pass'],
            ['Clear win', 'LoRA ≥ base + 0.20', 'Pass (+0.80)', 'Pass (+1.00)'],
            ['Hygiene', 'Train/eval disjoint; no holdout leakage', 'Pass', 'Pass'],
            [
              'Honesty',
              'Don’t edit eval golds mid-comparison with an old baseline',
              'Pass (by process)',
              'Pass',
            ],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>Verdict:</strong> yes — for these washed short-fact packs, holdout{' '}
          <code style={codeStyle}>exact_match</code> is <strong style={strong}>in standard</strong> and at the top
          of the bar.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>What &ldquo;in standard&rdquo; does not mean:</strong> it does not mean the adapter
          should answer live product status/URLs for users (registry wins). It does not mean Polar replaces Centaur
          or Claude. It does not mean CI &ldquo;proves 1.000&rdquo; on every PR — CI is hygiene + dry-run; pack
          scores come from real train/eval runs. Exact-match is brittle on purpose: paraphrases count as zero so we
          don&apos;t congratulate ourselves with vibes.
        </p>

        <SectionLabel>9 · Where each piece wins</SectionLabel>
        <Table
          headers={['Piece', 'Best at', 'Weak at']}
          rows={[
            [
              'API harness (Claude etc.)',
              'Reasoning, tools, coding, live ops',
              'You don’t own weights; can’t LoRA “our facts” into it',
            ],
            [
              'Memory / registry',
              'Fresh truth, PII boundaries, hotfix in git',
              'Doesn’t change model defaults; needs retrieval every time',
            ],
            [
              'Local 0.5B + LoRA (Polar)',
              'Cheap proof: data → behavior → exact_match; offline literacy',
              'Tiny model; brittle strings; stale when facts move; not a harness brain',
            ],
            [
              'Cloud agent runs',
              'Long CPU trains, reports, PRs while you’re away; process video',
              'Still the same lab rules; not magic capacity',
            ],
          ]}
        />
        <p style={bodyStyle}>
          <strong style={strong}>One-liner:</strong> harness + memory for <strong style={strong}>shipping answers</strong>;
          Polar for <strong style={strong}>proving weight change</strong>; cloud for{' '}
          <strong style={strong}>recording the proof at scale</strong>.
        </p>

        <SectionLabel>10 · Closing</SectionLabel>
        <p style={bodyStyle}>
          I didn&apos;t fall in love with local models because they&apos;re smarter than the harness. I fell in love
          because they&apos;re <strong style={strong}>mine to change</strong>, and Polar makes the change{' '}
          <strong style={strong}>visible</strong>.
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Why:</strong> own the weights and measure them.
          </li>
          <li>
            <strong style={strong}>Scenarios:</strong> registry/memory for live truth; Polar for proof; harness for
            shipping work.
          </li>
          <li>
            <strong style={strong}>Progress:</strong> short identical golds, miss polish, and full-attn LoRA moved
            Machina and space from flat or mid scores to <strong style={strong}>1.000</strong>.
          </li>
          <li>
            <strong style={strong}>Eval:</strong> disjoint holdout <code style={codeStyle}>exact_match</code> —{' '}
            <strong style={strong}>meets useful (≥0.60) and clear-win (≥ base+0.20) gates</strong> on Machina and
            space.
          </li>
        </ul>
        <p style={bodyStyle}>
          Cloud runs turn that into a small video: wash → train → miss → fix → 1.000. Harness stays the sharp rented
          brain. Registry stays the live truth. LoRA stays behind the gate until we deliberately decide otherwise.
        </p>
        <p style={bodyStyle}>
          That&apos;s the setup. That&apos;s enough to publish — and enough to keep building.
        </p>

        <p style={{ ...bodyStyle, marginTop: 48, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          Lab:{' '}
          <a href="https://github.com/lilaclilac09/polar-lab" target="_blank" rel="noopener noreferrer" style={inlineLink}>
            polar-lab
          </a>
          {' · '}
          <Link href="/dispatch" style={inlineLink}>
            Back to Dispatch
          </Link>
        </p>
      </article>
    </SubstackShell>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div style={{ margin: '28px 0 36px', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(0,255,234,0.75)',
                  borderBottom: '1px solid rgba(0,255,234,0.25)',
                  padding: '8px 12px 10px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '12px 14px 12px 0',
                    verticalAlign: 'top',
                    color: j === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    fontWeight: j === 0 ? 500 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
