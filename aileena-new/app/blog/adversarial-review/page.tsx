'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * Adversarial Review — elimination, not corroboration.
 * Sibling to "Concepts You Think You Know" on the Investing / AI-hardware rail:
 * things that feel settled until you try to prove them wrong.
 */

export default function AdversarialReviewArticle() {
  return (
    <SubstackShell
      category="Method"
      date="2026.10.30"
      tags="Review · Verification · Agents · Repro · Revoke"
      title="Adversarial Review"
      dek="The point of review is not to prove yourself right. It is to try to prove yourself wrong — elimination, not corroboration. Same discipline for agent reproductions: matching symptoms is not matching the fault."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          A review that only gathers confirming evidence is a ceremony. Adversarial review flips the
          goal: attack the claim until it fails, or until the attack runs out of road. The stance is
          the thesis defense — examiners do not help you polish; they press the weakest link until it
          holds or snaps.
        </p>

        <SectionLabel>1 · Elimination, not corroboration</SectionLabel>
        <p style={bodyStyle}>
          Start from the hypothesis you want to ship. Then try to kill it. Useful checks:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Is the signal real?</strong> Measurement noise, sampling bias, and
            dashboard artifacts can look like discovery.
          </li>
          <li>
            <strong style={strong}>Is the hypothesis true?</strong> Not &ldquo;consistent with,&rdquo;
            not &ldquo;suggestive of&rdquo; — can you state a falsifier and look for it?
          </li>
          <li>
            <strong style={strong}>Did the same bug hit the control?</strong> If the control shows the
            same failure, the control is invalid and the comparison is theater.
          </li>
          <li>
            <strong style={strong}>Gaps in fact collection?</strong> Missing logs, missing timestamps,
            missing counterfactuals — mark them empty; do not paper over.
          </li>
          <li>
            <strong style={strong}>Multi-cause stories:</strong> is each named factor{' '}
            <em>necessary</em>? Drop one. If the story still &ldquo;works,&rdquo; that factor was
            decoration.
          </li>
          <li>
            <strong style={strong}>Sources for key claims.</strong> Every load-bearing sentence needs
            a cite, a trace, or a reproducible artifact. No orphan assertions.
          </li>
        </ul>
        <blockquote style={quoteStyle}>
          Corroboration asks &ldquo;what else looks like this?&rdquo; Elimination asks &ldquo;what
          would make this false?&rdquo; Only the second one earns merge confidence.
        </blockquote>

        <SectionLabel>2 · Agent reproductions need signal consistency</SectionLabel>
        <p style={bodyStyle}>
          When an agent claims it reproduced a bug, do not accept &ldquo;it hung&rdquo; or &ldquo;it
          leaked.&rdquo; Demand <strong style={strong}>signal consistency</strong>: does the repro
          show the same diagnostic features as the real fault?
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Accepted — memory-leak repro.</strong> Story 2 matched the live
          incident on the heap call-frame signature. Same frames, same growth shape. Similar symptoms
          plus matching forensic fingerprint → keep.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Rejected — clock-skew hang repro.</strong> The agent produced a hang
          that felt familiar, but packet capture and IPC evidence did not match the real fault.
          Similar symptoms ≠ same root cause. Reject the repro; keep hunting.
        </p>
        <p style={bodyStyle}>
          Analogy: a counterfeit check. Color is not enough. Watermark, security thread, and paper
          must match. A repro that only matches the color of the bug is still counterfeit.
        </p>

        <SectionLabel>3 · Why revoke matters</SectionLabel>
        <p style={bodyStyle}>
          Adversarial review without revoke is incomplete. Verification finds that a credential,
          session, or agent key should no longer be trusted — revoke is the actuator that makes that
          finding real. Mint without revoke leaves a permanent hole: a leaked{' '}
          <code style={codeStyle}>sk-gw-…</code> keeps working after you know it is burned.
        </p>
        <p style={bodyStyle}>
          On this site, Agent-Gateway keeps official provider keys on the box and hands agents
          gateway bearers you can kill:{' '}
          <Link href="/tools/agent-gateway" style={inlineLink}>
            revoke that id and the bearer dies
          </Link>
          . The adversarial loop is: detect misuse or drift → revoke → confirm 401 on the old bearer →
          only then mint a replacement. Elimination applies to access as much as to hypotheses.
        </p>

        <SectionLabel>4 · Practice</SectionLabel>
        <p style={bodyStyle}>
          Before you call a finding done: write the falsifier, check the control, demand matching
          forensic signals on any agent repro, cite every key claim, and revoke anything the review
          proved unsafe. If you cannot name how the claim would fail, you are still in corroboration
          mode — which is how wrong stories survive.
        </p>
        <p style={bodyStyle}>
          Sibling reset on hardware vocabulary you only think you know:{' '}
          <Link href="/blog/semi-basics-review" style={inlineLink}>
            Concepts You Think You Know
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
