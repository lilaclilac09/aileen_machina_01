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
          language — this is a personal portfolio, not a SaaS.
        </p>
      </section>

      <div className="substack-rule"><div /></div>

      <article>
        <p>
          aileena.xyz is the personal site of Aileen Zhou. Below is exactly
          what happens with anything you share with it. Nothing more, nothing
          less.
        </p>

        <h2 style={h2}>What you send me</h2>
        <p>The site only stores something when you actively send it:</p>
        <ul>
          <li>
            <strong>Agent lead-capture.</strong> If you talk to the on-site
            agent and then enter your email (with an optional name/note) to
            keep chatting, I receive your email, the name/note, and the
            transcript of that conversation so I can reply.
          </li>
          <li>
            <strong>Transcript forwarding.</strong> If you ask the agent to
            email the transcript to me, same thing — your email and the
            conversation are sent to my inbox.
          </li>
          <li>
            <strong>Sign-in (for any gated page).</strong> If a page asks you
            to sign in, I email a one-time link to the address you give and
            use that address to recognise you on the next visit.
          </li>
        </ul>
        <p>
          That&rsquo;s it. There is no analytics tracker, no Google or Meta
          pixel, no Hotjar / PostHog, no behavioural fingerprint, no
          newsletter list.
        </p>

        <h2 style={h2}>Where it goes</h2>
        <p>
          Emails and messages are sent through <strong>Resend</strong>
          {' '}(a transactional email provider that delivers the message and
          does not keep a marketing copy) straight to my personal inbox at{' '}
          <a href="mailto:rosazxc0915@gmail.com">rosazxc0915@gmail.com</a>.
          That is the only destination. Nothing is sold, syndicated, or
          shared with anyone else.
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
          The site runs on <strong>Vercel</strong>. Standard request logs
          (IP address, path, status code) live there briefly for operational
          and security reasons; they are not used for anything else and are
          not joined to your email or any other identifier.
        </p>

        <h2 style={h2}>Deleting your data</h2>
        <p>
          Want anything removed — your email, a transcript, a sign-in record?
          Just email{' '}
          <a href="mailto:rosazxc0915@gmail.com">rosazxc0915@gmail.com</a>{' '}
          and ask. No form, no friction. If you&rsquo;re in the EU/EEA or UK,
          this is also how you exercise your access / rectification /
          erasure / objection rights under GDPR / UK-GDPR.
        </p>

        <h2 style={h2}>Children</h2>
        <p>
          This site isn&rsquo;t directed at anyone under 16. Please
          don&rsquo;t submit personal data if you are.
        </p>

        <h2 style={h2}>Changes</h2>
        <p>
          If anything material here changes, I&rsquo;ll update the date at
          the top of this page.
        </p>

        <p style={{ ...lead, marginTop: 48, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          Questions? <a href="mailto:rosazxc0915@gmail.com">rosazxc0915@gmail.com</a>.
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
