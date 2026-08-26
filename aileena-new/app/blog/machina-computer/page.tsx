'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function MachinaComputerArticle() {
  return (
    <SubstackShell
      category="Essay"
      date="2026.08.26"
      tags="Machina · Console · Computer · KeyShield · Tools"
      title="Computer Lives in the Dialog"
      dek="The site agent already has a mouth. Computer is a tool in that same Console — not a second window, not a typed owner secret, not Cloudflare Computer, and never a merge. The door is KeyShield."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
          <strong style={strong}>Not this:</strong> a harness page next to chat · typing a server secret
          into <code style={codeStyle}>/daily</code> · shipping{' '}
          <code style={codeStyle}>@cloudflare/computer</code> on Vercel · importing DeepSeek Harness ·
          letting a plugin merge to <code style={codeStyle}>main</code>.
        </p>

        <SectionLabel>1 · The itch</SectionLabel>
        <p style={bodyStyle}>
          Visitors already talk in one dialog: the site-agent Console. Owner work tried to grow a second
          surface — a computer window on <code style={codeStyle}>/proof</code> with plugins, proof, and a
          merge gate. Two windows that share a brain is a product bug. You look at chat. The computer is
          somewhere else. The reply and the queue disagree about where the work lives.
        </p>
        <p style={bodyStyle}>
          The law is the same as the orb essay:{' '}
          <Link href="/blog/console-orb" style={inlineLink}>
            the dialog is the only place answers are allowed to land
          </Link>
          . Computer is not an answer-place. It is a tool inside that place.
        </p>
        <blockquote style={quoteStyle}>
          One Console. Fast talk stays in the transcript. Heavy work says ⚡ queued. plus one human
          sentence. Same window. No second screen.
        </blockquote>

        <SectionLabel>2 · What actually ships (surfaces)</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Site agent</strong> — <code style={codeStyle}>AgentChat</code> →{' '}
            <code style={codeStyle}>POST /api/chat</code>. Visitors get the existing agent. Owner heavy
            commands take a fast path: bolt, spoken line (what / which proof), computer after.
          </li>
          <li>
            <strong style={strong}>Computer dock</strong> —{' '}
            <code style={codeStyle}>ComputerConsoleDock</code> under the transcript when the owner
            session is on. Plugins: inspect, scratch, screenshots, checks, patch, merge-as-gate. Visitors
            never see it.
          </li>
          <li>
            <strong style={strong}>/proof</strong> — a KeyShield door and a signpost. Not a harness window.
            The button fires <code style={codeStyle}>open-agent-chat</code>.
          </li>
          <li>
            <strong style={strong}>Tools arcade</strong> — slug <code style={codeStyle}>computer</code>,
            experiment tier. Honest: not a live product. Opens the Console; links this essay.
          </li>
          <li>
            <strong style={strong}>KeyShield</strong> — WebAuthn PRF → HKDF → AES-256-GCM on this
            device (Touch ID / Face ID / Windows Hello). Server holds ciphertext only. Owner rooms no
            longer ask for a typed secret. Production enroll without an existing owner session stays off.
          </li>
        </ul>

        <SectionLabel>3 · Call path</SectionLabel>
        <pre style={preStyle}>{`visitor ask     →  POST /api/chat          →  existing agent  →  dialog
owner heavy     →  Edge fast path         →  ⚡ queued. + spoken  →  dialog
                →  after() Node runner    →  local shim workspace
owner plugin    →  POST /api/agent/computer/tasks  →  same dock
merge plugin    →  gate only              →  GitHub merge is not a tool
unlock          →  KeyShield PRF → HKDF → AES-GCM   →  owner cookie  →  dock appears`}</pre>
        <p style={bodyStyle}>
          Chat stays Edge. The runner stays Node. Production (
          <code style={codeStyle}>VERCEL_ENV === &apos;production&apos;</code>) hard-offs the prototype.
          The workspace is a local shim under <code style={codeStyle}>.data/computer-prototype/</code> —
          gitignored. This is not Cloudflare Durable Objects.
        </p>

        <SectionLabel>4 · Why not a computer window</SectionLabel>
        <p style={bodyStyle}>
          A separate harness looks serious. It also splits attention: chat says queued, the window shows
          plugins, merge looks like a button that might ship. The owner already has a Console. Putting
          computer there means the spoken line and the dock share one scroll, one orb, one input. If the
          computer is slow, she can still talk. That was the contract: 回复也是需要的.
        </p>
        <p style={bodyStyle}>
          <code style={codeStyle}>/daily</code> no longer carries an owner door. The board is paper.
          Unlock is KeyShield on council / cabinet / this-device rooms, then the dock in Console.
        </p>

        <SectionLabel>5 · KeyShield, not a typed owner secret</SectionLabel>
        <p style={bodyStyle}>
          A password field on a public page is a setting that teaches the secret&apos;s name. The door is
          the same method as{' '}
          <a href="https://github.com/lilaclilac09/keyshield" style={inlineLink}>
            KeyShield
          </a>
          : biometric unlocks a WebAuthn PRF, HKDF binds it (
          <code style={codeStyle}>ks-master-key-v1</code> /{' '}
          <code style={codeStyle}>ks-vault-id-v1</code>), AES-256-GCM seals{' '}
          <code style={codeStyle}>aileena-owner-v1</code> in the browser. The site only stores the
          envelope. It cannot read the key. No fallback password. Register on localhost for the
          prototype. Vercel production will not bootstrap a new passkey for a stranger. Council CLI can
          still use a server env for the terminal; the site UI does not.
        </p>
        <pre style={preStyle}>{`POST /api/auth/passkey/options   →  challenge cookie + ciphertext envelope
platform authenticator + PRF     →  fingerprint / Face ID / Hello
HKDF-SHA-256                     →  AES-GCM (extractable: false) + vault id
open seal in the browser         →  then POST verify
POST /api/auth/passkey/verify    →  owner session cookie
typed secret in the dialog       →  gone
server                           →  ciphertext only`}</pre>

        <SectionLabel>6 · What this is not</SectionLabel>
        <ul style={listStyle}>
          <li>
            Not <code style={codeStyle}>@cloudflare/computer</code>. That package wants a Worker and a
            Durable Object. This chat is Next on Vercel.
          </li>
          <li>
            Not DeepSeek Harness. Do not import <code style={codeStyle}>@deepseek-ai/dsh</code>. Identity
            stays Machina + DeepSeek for talk.
          </li>
          <li>
            Not merge. <code style={codeStyle}>canMerge</code> is always false. The merge plugin is a
            blocked gate in the same dialog.
          </li>
          <li>
            Not production. Local / preview only. Do not merge this prototype because it ran on
            localhost.
          </li>
        </ul>

        <SectionLabel>7 · How to try it (owner, localhost)</SectionLabel>
        <ol style={listStyle}>
          <li>Open Console. Ordinary questions still answer.</li>
          <li>Unlock with KeyShield on this device (or local experiment enter on the proof door).</li>
          <li>
            The dock appears under the transcript. Queue inspect. You should see ⚡ queued. and a
            spoken proof id in the same dialog — then she still talks.
          </li>
          <li>Merge stays grey. GitHub does not move.</li>
        </ol>
        <p style={bodyStyle}>
          Related:{' '}
          <Link href="/blog/console-orb" style={inlineLink}>
            How the Console Speaks
          </Link>{' '}
          ·{' '}
          <Link href="/blog/machina-memory" style={inlineLink}>
            How the Site Remembers
          </Link>{' '}
          ·{' '}
          <Link href="/tools/computer" style={inlineLink}>
            Computer on the tools bench
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
