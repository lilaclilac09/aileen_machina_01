'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function CentaurArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.05.26"
      tags="Paradigm · Centaur · Agent Infra"
      title="Centaur, and the market it's landing in"
      dek={<>On May 21, 2026, Paradigm and Tempo open-sourced Centaur — a self-hosted runtime for &quot;multiplayer, secure agents.&quot; It isn&apos;t another coding agent. It&apos;s the backend that lets a whole team share one.</>}
    >
      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>What it actually is</SectionLabel>
        <p style={bodyStyle}>
          Centaur is a self-hosted platform that gives a team <em>one</em> shared AI agent instead
          of N one-off local setups. You talk to it from Slack or an API. Every conversation runs
          in its own isolated Kubernetes sandbox with a real shell, a real workspace, git, Python,
          Node, Bun and the usual dev tooling. Tools you add once are available to every agent
          conversation. Workflows can pause, resume, wait for events, spawn child agents, and
          survive service restarts. Credentials never enter the sandbox in raw form.
        </p>

        <p style={bodyStyle}>
          The codebase is Apache 2.0 and built on five components:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`services/api          FastAPI control plane + Postgres
                      agent lifecycle, tool registry, durable workflows

services/slackbot     Slack event ingestion + threaded responses

services/sandbox      per-conversation K8s pod with shell + workspace

iron-proxy            credential gateway built on mitmproxy
                      sandbox sees placeholders; real keys injected at egress

plugins / workflows   Python tools + checkpointable workflow steps`}
          </pre>
        </div>

        <p style={bodyStyle}>
          The agent &quot;brain&quot; itself is{' '}
          <strong style={strong}>bring-your-own</strong>: Amp, Codex, Claude Code, pi-mono, or any
          custom CLI harness drops into the sandbox. Centaur is the chassis, not the engine.
        </p>

        <SectionLabel>Why Paradigm built it themselves</SectionLabel>
        <p style={bodyStyle}>
          Paradigm is a venture firm of roughly fifty people running a multi-billion crypto book
          plus the Reth / Foundry stacks. They&apos;ve been using Centaur internally since January
          2026. The motivation falls out of three constraints that didn&apos;t line up with anything
          off the shelf:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Compliance + data boundary.</strong> A VC handling LP positions,
            portfolio diligence and unannounced deals cannot pipe its repos, Slack DMs and secrets
            through a third-party SaaS cloud. Devin and the Cursor / Codex cloud agents are
            non-starters by policy.
          </li>
          <li>
            <strong style={strong}>Long-running work.</strong> Diligence memos, recruiting funnels,
            customer-support triage, CI investigations — none of these complete in a 30-minute
            chat window. They need an agent that can sleep for hours, wake on an event, and not
            lose its place because someone restarted a pod.
          </li>
          <li>
            <strong style={strong}>Shared institutional memory.</strong> Fifty people each running
            a local Claude Code with their own tool wrappers is fifty disjoint knowledge bases.
            One shared agent with a single tool registry compounds; fifty don&apos;t.
          </li>
        </ul>

        <p style={bodyStyle}>
          The strategic logic is the same logic that produced Reth and Foundry: build the
          internal tool first, harden it on real workloads, then open-source it once it&apos;s a
          competitive moat for the entire portfolio rather than for the firm alone. Centaur is
          Paradigm&apos;s pitch that the next layer of infrastructure portfolio companies need is
          not a model or a sandbox — it&apos;s the multi-tenant runtime that turns either into a
          coworker.
        </p>

        <SectionLabel>The PM bets, component by component</SectionLabel>
        <p style={bodyStyle}>
          Each of the five components is a deliberate scope choice. Reading them as PM decisions
          rather than as a list of services is the most informative way to look at the repo.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Slack as the primary UI, not the IDE.</strong> Devin reaches for
          Slack too, but Cursor / Codex / Claude Code reach for the editor. Picking Slack
          declares that the target user is everyone in the company — analysts, recruiters,
          ops — not just engineers. The blast radius of the product is much larger and the bar
          on the UI is much lower.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Durable workflows over chat turns.</strong> A FastAPI service
          backed by Postgres with checkpointable workflow steps says the unit of work is a{' '}
          <em>job</em>, not a <em>turn</em>. Jobs can sleep, wait, retry, and resume across pod
          restarts. This is what makes &quot;run this overnight&quot; or &quot;watch this PR
          until CI is green&quot; tractable.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>K8s sandboxes over a managed sandbox API.</strong> They could
          have leaned on E2B or Daytona. They didn&apos;t — because the same compliance constraint
          that ruled out Devin rules out a third-party sandbox. Running on the customer&apos;s K8s
          keeps the entire data path inside the customer&apos;s boundary, at the cost of asking
          the customer to operate K8s.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>iron-proxy as the secrets boundary.</strong> The agent never
          sees raw long-lived keys. mitmproxy sits between the sandbox and the public internet
          and injects real credentials only at the moment of outbound request, swapping
          placeholders for live keys. This is the single design choice that lets Paradigm hand
          the agent Stripe, 1Password, Slack admin and GitHub at once without losing sleep.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Bring-your-own harness + overlay images.</strong> Two
          extensibility primitives that look small but matter. The first decouples Centaur from
          model and CLI choice — Claude Code today, something else next quarter, with no fork.
          The second lets every adopter mount their own Docker image of tools, skills and
          workflows on top of upstream Centaur without touching the core. Together they keep
          Centaur from becoming &quot;Paradigm&apos;s agent product&quot; and let it grow into a
          platform.
        </p>

        <SectionLabel>How they&apos;re telling the story</SectionLabel>
        <p style={bodyStyle}>
          The launch communication is as deliberate as the architecture. Four pieces of it are
          worth noticing.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>The word &quot;centaur.&quot;</strong> Not &quot;agent,&quot;
          not &quot;copilot.&quot; The centaur frame — human-and-machine as one body — was Garry
          Kasparov&apos;s phrase for advanced chess where humans and engines compose. Paradigm is
          deliberately stepping away from the &quot;autonomous agent&quot; story (Devin) and the
          &quot;assistant&quot; story (Copilot) and pitching a third one: a teammate. The naming
          carries the positioning.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Co-released with Tempo.</strong> Paradigm is a VC; Tempo is a
          portfolio company that has been running Centaur in production. Shipping the launch
          jointly does two things — it removes the &quot;internal toy&quot; smell from the
          release, and it signals to other portfolio companies that the operating system for
          their AI work has already been chosen for them.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Apache 2.0, not BSL.</strong> Foundry uses MIT/Apache; Reth uses
          MIT/Apache. Paradigm is consistent. There is no &quot;managed Centaur cloud&quot;
          coming — the license forecloses the obvious SaaS play. The bet is that Centaur&apos;s
          value to Paradigm is portfolio leverage, not licensing revenue.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>The use-case list is unusually wide.</strong> Investing,
          engineering, design, recruiting, events, customer support. That breadth is the marketing
          asset: it&apos;s the part that&apos;s hard to fake. A six-month internal run across a
          fifty-person firm produces a list of jobs-to-be-done that a vendor demo never can.
        </p>

        <SectionLabel>The competitive grid</SectionLabel>
        <p style={bodyStyle}>
          Centaur sits at the intersection of four adjacent markets. None of them contain a
          direct equivalent yet, which is the most interesting thing about the launch.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`                       Closed SaaS                     Open + self-hosted
─────────────────────────────────────────────────────────────────────────────
Full-stack             Devin (Cognition)               ★ Centaur
team agent             Cursor Background Agents
                       Codex Cloud
                       Tempo (now on Centaur)

Agent orchestration    LangGraph Cloud                 LangGraph OSS
                                                       kagent (CNCF Sandbox)

Sandbox infra          E2B, Daytona, Modal,            OpenSandbox (Alibaba)
                       Northflank, Blaxel, Sprites     AIO Sandbox (Agent-Infra)

Coding-only agent      Sweep, Tusk, GH Copilot         OpenDevin-style forks
                       Workspaces`}
          </pre>
        </div>

        <p style={bodyStyle}>
          <strong style={strong}>vs. Devin.</strong> Closest functional analog. Devin is closed
          SaaS, per-seat pricing, fully autonomous, single brand. Centaur is open, self-hosted,
          harness-agnostic, and is a runtime rather than a product. For any team that can&apos;t
          ship code or secrets to a vendor cloud — finance, crypto, healthcare, anyone with a
          serious compliance posture — Centaur is the only thing in the column.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>vs. E2B / Daytona / Modal / Blaxel.</strong> These sell sandbox
          APIs. Centaur subsumes the sandbox layer (it runs its own on K8s) and adds the four
          things sandbox vendors don&apos;t: Slack ingress, durable workflows, credential
          gateway, audit trail. If you&apos;re an agent <em>builder</em> renting E2B by the hour
          you keep doing that; if you&apos;re a <em>company</em> deploying an agent for fifty
          coworkers you want Centaur.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>vs. kagent / LangGraph Platform.</strong> Both are open-source
          K8s-native control planes for agents. They&apos;re lower in the stack than Centaur —
          orchestration primitives and observability for platform-engineering teams. Centaur is
          a packaged product on top: Slack bot included, secrets gateway included, sandbox image
          included. Time-to-first-working-agent is hours, not weeks.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>vs. Sweep / Tusk / Copilot Workspaces.</strong> Different scope.
          These are PR-shaped: read an issue, produce a PR. Centaur runs the whole company &mdash;
          the PR-bot pattern is one of many workflows you could implement on top of it.
        </p>

        <SectionLabel>Where this leaves the market</SectionLabel>
        <p style={bodyStyle}>
          The interesting position Centaur stakes out is the top-right quadrant of that grid:{' '}
          <strong style={strong}>open-source, self-hosted, full-stack team agent runtime</strong>.
          Twelve months ago that quadrant didn&apos;t exist as a category. Today it has one
          credible entrant, backed by a firm whose previous infrastructure bets (Foundry, Reth,
          OpenClaw) became default tools for entire industries.
        </p>

        <p style={bodyStyle}>
          Three predictions follow directly from the design choices above:
        </p>

        <ul style={listStyle}>
          <li>
            <strong style={strong}>The sandbox-API vendors will commoditize faster.</strong>{' '}
            If the dominant deployment shape becomes &quot;an agent runtime on the customer&apos;s
            K8s,&quot; the standalone-sandbox layer is a feature, not a product. E2B and Daytona
            will either move up into orchestration or get squeezed.
          </li>
          <li>
            <strong style={strong}>Devin gets a self-hosted SKU.</strong> The compliance gap is
            wide enough that Cognition cannot ignore it forever, but moving from SaaS to
            self-hosted is a structural lift, not a flag flip.
          </li>
          <li>
            <strong style={strong}>The next year of agent product PMs will spend most of their
            time on workflows, not on models.</strong> Centaur is a bet that the unsolved
            problem is durability, sharing, and credentials — not capability. That bet matches
            what most users complain about once the novelty wears off.
          </li>
        </ul>

        <p style={bodyStyle}>
          Centaur is not the only thing that will work. It&apos;s the first credible answer to
          the question &quot;what does an agent look like when it has to be a teammate to fifty
          people for a year?&quot; — and it ships with six months of receipts from the firm that
          built it.
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

/* ── Styles (shared with the prop-amm-dict / humidifi articles) ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9, color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em', marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const preStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.6,
  color: 'rgba(255,255,255,0.75)', background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px', overflowX: 'auto', letterSpacing: '0.01em', margin: 0,
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9, color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em', marginBottom: 24, paddingLeft: 22,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.45em',
      color: '#00ffea', textTransform: 'uppercase',
      marginBottom: 20, marginTop: 56, opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
