'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function ConsoleOrbArticle() {
  return (
    <SubstackShell
      category="Essay"
      date="2026.08.05"
      tags="Machina · Console · Voice · Safari · DeepSeek"
      title="How the Console Speaks"
      dek="The orb is a microphone with manners. The brain stays DeepSeek. Soft hints stay kind. Code proposals never touch the disk — and iPhone Safari taught us which laws are real."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
          <strong style={strong}>Not this:</strong> shipping a Cursor Cloud Agent to strangers · stuffing
          continuous wake into iOS · letting &ldquo;fix the footer&rdquo; merge to{' '}
          <code style={codeStyle}>main</code> · confusing the glass ball with the dialog.
        </p>

        <SectionLabel>1 · The itch</SectionLabel>
        <p style={bodyStyle}>
          aileena.xyz has a Console. People open it on a laptop and on a phone. They expect to talk, get a
          soft hint, maybe ask for a tiny patch sketch. What they must <em>not</em> get is a site that freezes
          on the first slide, a keyboard that covers the input, or a promise that their utterance rewrote the
          repo.
        </p>
        <p style={bodyStyle}>
          So the public orb is a <strong style={strong}>transport</strong>. Speech-to-text lands as text. Text
          goes to <code style={codeStyle}>/api/chat</code> (DeepSeek via{' '}
          <code style={codeStyle}>lib/modelRouter</code>). Optional intents go to{' '}
          <code style={codeStyle}>/api/voice-code</code> — still DeepSeek, propose-only, five times a day.
          Prophecy Hall only injects copy into the Console dialog. Nothing writes the visitor&apos;s disk.
        </p>
        <blockquote style={quoteStyle}>
          Voice is the wire. DeepSeek is the brain. The dialog is the only place answers are allowed to land.
        </blockquote>

        <SectionLabel>2 · What actually ships (surfaces)</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Console chat</strong> — <code style={codeStyle}>AgentChat</code> →{' '}
            <code style={codeStyle}>POST /api/chat</code>. Soft visitor topics in localStorage; hard taste from
            Machina memory (
            <Link href="/blog/machina-memory" style={inlineLink}>
              How the Site Remembers
            </Link>
            ).
          </li>
          <li>
            <strong style={strong}>Voice orb</strong> — <code style={codeStyle}>AgentVoiceOrb</code>. Caps say
            Whisper off → Web Speech STT; TTS via ElevenLabs when present, else{' '}
            <code style={codeStyle}>speechSynthesis</code>.
          </li>
          <li>
            <strong style={strong}>Summon</strong> — after one mic gesture, saying &ldquo;Aileena&rdquo; opens
            Console + voice. Continuous soft-wake is desktop-only; iOS skips it.
          </li>
          <li>
            <strong style={strong}>Soft oracle</strong> — kind, shallow hints woven with{' '}
            <code style={codeStyle}>priorTopics</code>. Text in the dialog, never painted inside the glass ball.
          </li>
          <li>
            <strong style={strong}>Prophecy Hall</strong> — <code style={codeStyle}>/prophecy</code>. Touch an
            orb → personalized line → <code style={codeStyle}>open-agent-chat</code> event into Console.
          </li>
          <li>
            <strong style={strong}>Voice → code</strong> — intent words (
            <code style={codeStyle}>fix</code> / <code style={codeStyle}>implement</code> / &ldquo;Voice →
            code&rdquo;) burn a separate 5/day cookie <code style={codeStyle}>__aileena_vcode</code>, not the
            chat 20. Response is a proposal string with{' '}
            <code style={codeStyle}>permission: &apos;propose&apos;</code>,{' '}
            <code style={codeStyle}>write_target: null</code>,{' '}
            <code style={codeStyle}>provider: &apos;deepseek&apos;</code>.
          </li>
        </ul>

        <SectionLabel>3 · Call path (happy path)</SectionLabel>
        <pre style={preStyle}>{`tap Voice / Summon  →  getUserMedia unlock (gesture)
speak               →  Web Speech STT  →  text
ordinary ask        →  POST /api/chat       →  DeepSeek  →  dialog (+ optional TTS)
fix / implement…  →  POST /api/voice-code →  DeepSeek generateText  →  dialog only
Hall touch          →  CustomEvent open-agent-chat  →  dialog`}</pre>
        <p style={bodyStyle}>
          polar-lab owns the pack under{' '}
          <code style={codeStyle}>integrations/aileena-console-voice/COPY_PASTE/</code>. The live site is{' '}
          <code style={codeStyle}>aileen_machina_01</code>. Cursor bot cannot push the site repo — apply is curl
          + human <code style={codeStyle}>git push origin main</code>.
        </p>

        <SectionLabel>4 · Scenario A — &ldquo;completely broken&rdquo; on iPhone</SectionLabel>
        <p style={bodyStyle}>
          The homepage is not a blank crash. SSR returns the opening slide. What fails is gesture physics:
        </p>
        <ul style={listStyle}>
          <li>
            <code style={codeStyle}>html/body &#123; overflow: hidden &#125;</code> plus scroll-snap{' '}
            <code style={codeStyle}>100dvh</code> sections — if the outer scroller glitches, the page feels
            frozen.
          </li>
          <li>
            Desk rooms nest <code style={codeStyle}>overflow-y: auto</code> inside a clipped snap section —
            classic iOS nested-scroll death.
          </li>
          <li>
            Body <code style={codeStyle}>-webkit-user-select: none</code> without restoring{' '}
            <code style={codeStyle}>user-select: text</code> on inputs — caret/typing dies in the Console.
          </li>
          <li>
            Centered <code style={codeStyle}>top: 50%</code> dialog + autofocus — iOS keyboard covers the
            field; <code style={codeStyle}>overflow: hidden</code> means you cannot scroll to recover.
          </li>
          <li>
            Continuous SpeechRecognition / <code style={codeStyle}>autoListen</code> from{' '}
            <code style={codeStyle}>useEffect</code> — outside a user gesture. Safari kills the mic.
          </li>
        </ul>
        <p style={bodyStyle}>
          Fixes that match the product law: on mobile, disable snap and let sections grow; unlock form
          selection; Console goes <code style={codeStyle}>inset-0 / 100dvh</code> with safe-area; skip
          autofocus on coarse pointers; iOS Summon does not run continuous wake; orb shows &ldquo;Tap orb to
          speak&rdquo; instead of auto-starting.
        </p>
        <pre style={preStyle}>{`@media (max-width: 768px) {
  .snap-container { scroll-snap-type: none; overflow: visible; height: auto; }
  .snap-section   { height: auto; min-height: 100dvh; overflow: visible; }
}
input, textarea { -webkit-user-select: text; user-select: text; }
body.site-body  /* class — never inline overflow:hidden (inline wins CSS) */`}</pre>

        <SectionLabel>5 · Scenario B — Voice → code without Cursor tokens</SectionLabel>
        <p style={bodyStyle}>
          Early pack tried Cursor Cloud Agents (<code style={codeStyle}>CURSOR_API_KEY</code>). Wrong product
          for a public orb: strangers should not burn my Cursor bill, and the site chat already runs on
          DeepSeek.
        </p>
        <p style={bodyStyle}>
          Current contract: same <code style={codeStyle}>routeModel</code> stack as chat. Propose a unified
          diff or numbered steps. Never claim files were written. Cap at five proposals per local day via
          signed cookie. Harness <code style={codeStyle}>display_gate</code> keeps{' '}
          <code style={codeStyle}>show_in_dialog=true</code> and <code style={codeStyle}>write_target=null</code>.
        </p>
        <pre style={preStyle}>{`ASK:   fix the Console footer spacing
ROUTE: isVoiceCodeIntent → POST /api/voice-code
BRAIN: generateText(deepseek-chat)
OUT:   proposal + remaining + provider:"deepseek"
DISK:  none`}</pre>
        <p style={bodyStyle}>
          What code comes out? A <em>sketch for review</em> — demo of the gate, not a stranger applying to
          aileena.xyz. If the ask is vague, the system prompt asks for the smallest clarifying patch. Owner
          apply stays on my machine.
        </p>

        <SectionLabel>6 · Scenario C — Prophecy stays mist, not cruelty</SectionLabel>
        <p style={bodyStyle}>
          Soft oracle and Hall share a cruel-forbid regex and positive craft. Hints weave prior topics when
          present. The sphere is atmosphere; the sentence always lands in Console text. That keeps the first
          viewport honest: brand, one mood, one action — not a fortune sticker glued on media.
        </p>

        <SectionLabel>7 · Quota and env (ops)</SectionLabel>
        <ul style={listStyle}>
          <li>
            Chat: ~20/day visitor cookie (HMAC with <code style={codeStyle}>CHAT_QUOTA_SECRET</code>).
          </li>
          <li>
            Voice-code: 5/day <code style={codeStyle}>__aileena_vcode</code> (same secret family).
          </li>
          <li>
            Brain: <code style={codeStyle}>DEEPSEEK_API_KEY</code> — required for chat and voice-code.
          </li>
          <li>
            TTS: <code style={codeStyle}>ELEVENLABS_API_KEY</code> optional; browser speech is the fallback.
          </li>
          <li>
            <strong style={strong}>No</strong> <code style={codeStyle}>CURSOR_API_KEY</code> on this path.
          </li>
        </ul>

        <SectionLabel>8 · What we refuse (for now)</SectionLabel>
        <ul style={listStyle}>
          <li>Letting public voice-code merge or open PRs for visitors.</li>
          <li>Continuous background wake on iOS.</li>
          <li>Autofocus that forces the keyboard before the visitor taps.</li>
          <li>Inline <code style={codeStyle}>style=&#123;&#123; overflow: &apos;hidden&apos; &#125;&#125;</code> on{' '}
            <code style={codeStyle}>&lt;body&gt;</code> — it defeats every mobile CSS unlock.</li>
          <li>Mixing hard Machina taste with soft visitor history in the orb captions.</li>
        </ul>

        <SectionLabel>9 · How to poke it</SectionLabel>
        <ol style={listStyle}>
          <li>Phone Safari: swipe opening → desk rooms (must not freeze).</li>
          <li>Open Console: type without the keyboard eating the field.</li>
          <li>Tap orb after a gesture: speak a short hello → dialog reply.</li>
          <li>
            <code style={codeStyle}>/prophecy</code>: touch B → text appears in Console, not inside the glass.
          </li>
          <li>
            Say &ldquo;fix the footer spacing&rdquo; → propose-only draft; check remaining counter (
            <code style={codeStyle}>voice-code n/5</code>).
          </li>
        </ol>
        <p style={bodyStyle}>
          Pack apply (human Mac):{' '}
          <code style={codeStyle}>integrations/aileena-console-voice/COPY_PASTE/APPLY_IOS.md</code> · voice-code
          DeepSeek branch pack · ops notes in{' '}
          <code style={codeStyle}>docs/guide/console-voice.md</code> /{' '}
          <code style={codeStyle}>docs/guide/voice-to-code.md</code>.
        </p>
        <p style={bodyStyle}>
          Related:{' '}
          <Link href="/blog/machina-memory" style={inlineLink}>
            How the Site Remembers
          </Link>{' '}
          ·{' '}
          <Link href="/blog/local-models" style={inlineLink}>
            How I Fell for Local Models
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
