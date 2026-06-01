import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollUnlock from '../blog/ScrollUnlock';
import '../blog/_substack/substack.css';

export const metadata: Metadata = {
  title: 'Privacy · AILEENA MACHINA',
  description: 'What this site collects, where it goes, and how to delete it.',
};

const h2: React.CSSProperties = {
  fontFamily: "'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#fff',
  margin: '2.4rem 0 0.8rem',
  letterSpacing: '-0.005em',
};

const lead: React.CSSProperties = {
  fontFamily: "'Iowan Old Style', 'Charter', 'Source Serif Pro', 'Georgia', serif",
  fontSize: '1.05rem',
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.75)',
  margin: '0 0 1.3em',
};

export default function PrivacyPage() {
  return (
    <div className="substack-article">
      <ScrollUnlock />
      <header className="substack-nav">
        <div className="substack-nav-inner">
          <Link href="/" className="substack-back">← Home</Link>
          <span className="substack-brand">AILEENA MACHINA</span>
        </div>
      </header>

      <section className="substack-hero">
        <p className="substack-meta">Last updated · 2026.06.01</p>
        <h1 className="substack-title">Privacy</h1>
        <p className="substack-dek">
          What this site collects, where it goes, and how to delete it. Plain
          language — this is a personal website, not a SaaS.
        </p>
      </section>

      <div className="substack-rule"><div /></div>

      <article>
        <p>
          aileena.xyz (the &ldquo;Site&rdquo;) is a personal website. Below is
          exactly what happens with anything you share with it. Nothing more,
          nothing less.
        </p>

        <h2 style={h2}>What you send</h2>
        <p>The Site only stores something when you actively send it:</p>
        <ul>
          <li>
            <strong>Agent lead-capture.</strong> If you talk to the on-site
            agent (the Aileena Console) and then enter your email (with an
            optional name/note) to keep chatting, your email, the name/note,
            and the conversation transcript are forwarded to the Site operator
            so they can reply.
          </li>
          <li>
            <strong>Transcript forwarding.</strong> If you ask the agent to
            send the transcript on, the same applies — your email and the
            conversation are forwarded.
          </li>
          <li>
            <strong>Sign-in (for any gated page).</strong> If a page asks you
            to sign in, the Site sends a one-time link to the address you
            provide and uses that address to recognise you on the next visit.
          </li>
        </ul>
        <p>
          That&rsquo;s it. No analytics tracker, no Google or Meta pixel, no
          Hotjar / PostHog, no behavioural fingerprint, no newsletter list.
        </p>

        <h2 style={h2}>Where it goes</h2>
        <p>
          Anything you send through the agent lead-capture flow — your
          email, the optional name/note, the transcript you choose to
          forward — is delivered through <strong>Resend</strong> (a
          transactional email provider that does not keep a marketing
          copy) to the Site operator. That&rsquo;s the only human
          destination. Nothing is sold, syndicated, or shared with anyone
          else.
        </p>

        <h2 style={h2}>The agent</h2>
        <p>
          The agent itself is a chat backed by a third-party large
          language model. When you send a message, the message — plus
          the last ~20 turns of the current conversation and a fixed
          system prompt about this site — goes over HTTPS to the model
          provider, which returns the response.
        </p>
        <p>
          Current provider: <strong>Anthropic</strong> (Claude, US). If
          the provider changes (for cost or latency reasons), the name
          above will be updated and the date at the top of this page
          will move with it. Under Anthropic&rsquo;s API policy, inputs
          and outputs are deleted after 30 days and are not used for
          model training.
        </p>
        <p>
          The Site itself keeps no separate copy of the conversation
          beyond what&rsquo;s described under &ldquo;What you
          send&rdquo; — i.e. only when you actively opt into the
          lead-capture flow.
        </p>

        <h2 style={h2}>Cookies</h2>
        <p>
          One. The agent uses a signed cookie to count how many messages
          you&rsquo;ve sent in a day so the per-visitor rate limit works.
          It contains a date and a counter, nothing else — no user id, no
          tracking. It expires after 25 hours.
        </p>

        <h2 style={h2}>Hosting</h2>
        <p>
          The Site runs on <strong>Vercel</strong>. Standard request logs
          (IP address, path, status code) live there briefly for operational
          and security reasons; they are not used for anything else and are
          not joined to your email or any other identifier.
        </p>

        <h2 style={h2}>Deleting your data</h2>
        <p>
          Want anything removed — your email, a transcript, a sign-in record?
          Reach out through the on-site <strong>Aileena Console</strong> (the
          agent panel, available from anywhere on the Site), or reply to any
          email this Site has previously sent you, and ask. No form, no
          friction. If you&rsquo;re in the EU/EEA or UK, this is also how
          you exercise your access / rectification / erasure / objection
          rights under GDPR / UK-GDPR.
        </p>

        <h2 style={h2}>Children</h2>
        <p>
          The Site isn&rsquo;t directed at anyone under 16. Please don&rsquo;t
          submit personal data if you are.
        </p>

        <h2 style={h2}>Changes</h2>
        <p>
          If anything material here changes, the date at the top of this page
          will be updated.
        </p>

        <p style={{ ...lead, marginTop: 48, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          Questions? Reach out through the on-site Aileena Console.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
          }}>
            ← Back home
          </Link>
        </div>
      </article>
    </div>
  );
}
