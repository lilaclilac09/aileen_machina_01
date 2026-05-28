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
          Centaur is a self-hosted platform that gives a whole team <em>one</em> shared AI agent
          instead of N separate local setups. You talk to it from Slack or an API. Every
          conversation runs in its own isolated Kubernetes sandbox &mdash; a locked-down container
          K8s spins up just for that chat &mdash; with a real shell, a real workspace, git, Python,
          Node, Bun and the usual dev tooling. Add a tool once and every agent conversation can use
          it. Workflows can pause, resume, wait for events, spawn child agents, and survive a
          service restart. And credentials never make it into the sandbox in raw form.
        </p>

        <p style={bodyStyle}>
          The codebase is Apache 2.0 and built out of five components:
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
          custom CLI harness drops straight into the sandbox. Centaur is the chassis, not the
          engine.
        </p>

        <SectionLabel>Why Paradigm built it themselves</SectionLabel>
        <p style={bodyStyle}>
          Paradigm is a venture firm of roughly fifty people running a multi-billion crypto book,
          plus the Reth / Foundry stacks. They&apos;ve been using Centaur internally since January
          2026. The reason they built it comes down to three constraints that nothing off the shelf
          could satisfy:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Compliance + data boundary.</strong> A VC handling LP positions,
            portfolio diligence and unannounced deals can&apos;t pipe its repos, Slack DMs and
            secrets through someone else&apos;s SaaS cloud. By policy, Devin and the Cursor / Codex
            cloud agents are off the table.
          </li>
          <li>
            <strong style={strong}>Long-running work.</strong> Diligence memos, recruiting funnels,
            customer-support triage, CI investigations — none of these wrap up inside a 30-minute
            chat window. You need an agent that can sleep for hours, wake up when something happens,
            and not lose its place just because someone restarted a pod.
          </li>
          <li>
            <strong style={strong}>Shared institutional memory.</strong> Fifty people each running
            their own local Claude Code with their own tool wrappers is fifty disconnected knowledge
            bases. One shared agent with a single tool registry compounds over time; fifty separate
            ones never do.
          </li>
        </ul>

        <p style={bodyStyle}>
          The strategy here is the same one that produced Reth and Foundry: build the internal tool
          first, harden it on real work, then open-source it once it&apos;s a competitive moat for
          the entire portfolio and not just for the firm. Centaur is Paradigm&apos;s argument that
          the next layer of infrastructure portfolio companies need isn&apos;t a model or a
          sandbox &mdash; it&apos;s the multi-tenant runtime that turns either one into a coworker.
        </p>

        <SectionLabel>The PM bets, component by component</SectionLabel>
        <p style={bodyStyle}>
          Each of the five components is a deliberate scope choice. The most useful way to read the
          repo is as a set of product decisions, not just a list of services.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Slack as the primary UI, not the IDE.</strong> Devin reaches for
          Slack too, but Cursor / Codex / Claude Code all reach for the editor. Choosing Slack is a
          statement that the target user is everyone in the company &mdash; analysts, recruiters,
          ops &mdash; not just engineers. That makes the product&apos;s reach much wider, and the
          bar on the UI much lower.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Durable workflows over chat turns.</strong> A FastAPI service
          backed by Postgres, with checkpointable workflow steps, says the unit of work is a{' '}
          <em>job</em>, not a <em>turn</em>. Jobs can sleep, wait, retry, and pick up again after a
          pod restart. That&apos;s what makes &quot;run this overnight&quot; or &quot;watch this PR
          until CI is green&quot; actually doable.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>K8s sandboxes over a managed sandbox API.</strong> They could
          have just leaned on E2B or Daytona. They didn&apos;t &mdash; because the same compliance
          constraint that ruled out Devin rules out a third-party sandbox too. Running on the
          customer&apos;s own K8s keeps the entire data path inside the customer&apos;s boundary;
          the price is that the customer now has to operate K8s.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>iron-proxy as the secrets boundary.</strong> The agent never sees
          raw long-lived keys. mitmproxy &mdash; a proxy that can intercept and rewrite traffic on
          the fly &mdash; sits between the sandbox and the public internet and slips the real
          credentials in only at the last second, on the outbound request, swapping placeholders
          for live keys. This is the one design choice that lets Paradigm hand the agent Stripe,
          1Password, Slack admin and GitHub all at once and still sleep at night.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Bring-your-own harness + overlay images.</strong> Two
          extensibility pieces that look small but matter a lot. The first unhooks Centaur from any
          one model or CLI &mdash; Claude Code today, something else next quarter, no fork required.
          The second lets every adopter mount their own Docker image of tools, skills and workflows
          on top of upstream Centaur without ever touching the core. Together they keep Centaur from
          collapsing into &quot;Paradigm&apos;s agent product&quot; and let it grow into a real
          platform.
        </p>

        <SectionLabel>Bring your own harness &mdash; what you can actually plug in</SectionLabel>
        <p style={bodyStyle}>
          This is the decision most people skim past, so it&apos;s worth slowing down on. A{' '}
          <strong style={strong}>harness</strong> is the agent &quot;brain&quot; &mdash; the CLI
          program that actually talks to a model, reads your task, edits files, and runs commands.
          Centaur doesn&apos;t ship one. It ships the <em>socket</em> a harness plugs into and lets
          you bring whichever you like. The repo already speaks to four &mdash; Amp, OpenAI&apos;s
          Codex CLI, Claude Code, and pi-mono (Mario Zechner&apos;s open-source, model-agnostic
          &quot;pi&quot; agent) &mdash; but the list isn&apos;t the point. The contract is.
        </p>
        <p style={bodyStyle}>
          And the contract is refreshingly literal. Centaur&apos;s control plane speaks one wire
          format &mdash; Anthropic&apos;s message format, streamed as NDJSON (newline-delimited
          JSON, one object per line) over the harness&apos;s stdin and stdout. A small per-harness
          adapter in <code style={codeStyle}>harness_session.py</code> then translates that one
          standard format into whatever each CLI actually wants. Claude Code already speaks Anthropic
          format, so it&apos;s passed straight through. Amp only takes text on stdin, so image and
          document blocks get written to disk and swapped for <code style={codeStyle}>@/path</code>{' '}
          mentions. Codex and pi-mono take the text and hand it over as a command-line argument.
          Adding a fifth harness isn&apos;t a fork &mdash; it&apos;s one more translation entry in
          that file.
        </p>
        <p style={bodyStyle}>
          So &quot;what are my options&quot; really just means &quot;which CLIs can run headless
          inside a box.&quot; Here&apos;s the field as it stands:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`HARNESS        MODEL          OPEN?          HEADLESS ENTRY
──────────────────────────────────────────────────────────────────
Claude Code    Claude only    source-avail   claude -p  /  stdin
Codex CLI      OpenAI only    Apache-2.0     codex exec
Gemini CLI     Gemini only    Apache-2.0     --non-interactive
Amp            any (cloud)    contested      amp -x
pi (pi-mono)   any, BYO-key   yes            scriptable CLI
Aider          any            yes            --message  /  pipe
Goose          any (MCP)      yes            headless run
OpenHands      any            yes            --headless --json
SWE-agent      any            yes            scriptable runner
Cursor CLI     Cursor/any     proprietary    cursor-agent -p
Devin          Cognition      no (SaaS)      cloud — can't drop in`}
          </pre>
        </div>

        <p style={bodyStyle}>
          Three things decide whether a given harness is a good fit for a chassis like this. First,{' '}
          <strong style={strong}>model-locked or model-agnostic?</strong> Claude Code, Codex CLI and
          Gemini CLI each ride a single vendor&apos;s model; pi, Aider, Goose, OpenHands and the
          others are bring-your-own-key and will run on whatever you point them at. For something
          whose entire pitch is &quot;swap the brain without a fork,&quot; that axis matters most.
          Second, <strong style={strong}>can it run headless?</strong> &mdash; non-interactively,
          driven by a pipe instead of a keyboard. A clean headless mode (the{' '}
          <code style={codeStyle}>-p</code>, <code style={codeStyle}>exec</code>, and{' '}
          <code style={codeStyle}>--headless</code> flags in that table) is the deciding feature,
          because Centaur drives the thing over stdin/stdout, not a terminal. Third,{' '}
          <strong style={strong}>open or closed?</strong> &mdash; which decides whether you can ship
          it inside your own image at all.
        </p>
        <p style={bodyStyle}>
          Which is exactly why <strong style={strong}>Devin doesn&apos;t belong on the list.</strong>{' '}
          It&apos;s a hosted cloud service, not a CLI you can drop in a box &mdash; the inference
          happens on Cognition&apos;s servers no matter what local bridge you wrap around it. That&apos;s
          the whole tell: a bring-your-own-harness runtime can adopt anything that runs as a process
          you control, and nothing that doesn&apos;t.
        </p>

        <SectionLabel>Memory: why it can babysit something for 48 hours</SectionLabel>
        <p style={bodyStyle}>
          Ask an ordinary chat agent to &quot;watch this PR and ping me when CI goes green&quot; and
          it falls over within the hour. The reason is structural. A chat agent keeps everything it
          knows in its <strong style={strong}>context window</strong> &mdash; the fixed-size
          scratchpad of tokens the model can see at once. Leave a task running for two days and that
          scratchpad fills with stale history, the bill climbs with every token re-read, and the
          moment the process restarts the memory is gone. A context window is short-term memory. It
          was never meant to hold 48 hours.
        </p>
        <p style={bodyStyle}>
          Centaur moves the memory out of the model entirely. The durable state of a job lives in{' '}
          <strong style={strong}>Postgres</strong>, as a sequence of checkpointed workflow steps
          &mdash; the unit of work is a <em>job</em>, not a chat turn. A two-day monitor, then, is
          mostly a job that sleeps. It wakes on an event &mdash; a webhook, a timer, a fresh CI
          result &mdash; pulls just the slice of state it needs back out of Postgres, runs one short
          bounded turn through the harness, writes a new checkpoint, and goes back to sleep. The
          model&apos;s context window only ever holds that one short turn. It never carries the full
          48 hours, so it never blows up.
        </p>
        <p style={bodyStyle}>
          That same checkpoint is what lets the job survive a restart. Because the last good step
          sits in Postgres rather than in a process&apos;s RAM, a sandbox that gets killed &mdash; a
          pod reschedule, a deploy, a 3 a.m. crash &mdash; comes back and resumes from where it
          stopped instead of starting over. &quot;Run this overnight&quot; only works if
          &quot;overnight&quot; is allowed to include a pod restart.
        </p>
        <p style={bodyStyle}>
          And because the state is a real database row instead of an opaque conversation, you get{' '}
          <strong style={strong}>control</strong> over it: you can inspect a running job, pause and
          resume it, branch it, kill it, let it spawn child agents, and read back an audit trail of
          everything it did and which credentials it used. The length of an agent&apos;s memory stops
          being capped by the model&apos;s token limit and starts being capped by your disk. That&apos;s
          the whole difference between an assistant you chat with and a teammate you can hand a
          two-day job.
        </p>

        <SectionLabel>How they&apos;re telling the story</SectionLabel>
        <p style={bodyStyle}>
          The launch messaging is every bit as deliberate as the architecture. Four things about it
          are worth noticing.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>The word &quot;centaur.&quot;</strong> Not &quot;agent,&quot;
          not &quot;copilot.&quot; The centaur image &mdash; human and machine as one body &mdash;
          was Garry Kasparov&apos;s term for advanced chess, where a human and an engine play
          together. Paradigm is deliberately walking away from the &quot;autonomous agent&quot;
          story (Devin) and the &quot;assistant&quot; story (Copilot) and pitching a third one: a
          teammate. The name carries the positioning.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Co-released with Tempo.</strong> Paradigm is a VC; Tempo is a
          portfolio company that&apos;s been running Centaur in production. Shipping the launch
          jointly does two things &mdash; it shakes off the &quot;internal toy&quot; smell, and it
          quietly tells the other portfolio companies that the operating system for their AI work
          has already been picked for them.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>Apache 2.0, not BSL.</strong> Foundry uses MIT/Apache; Reth uses
          MIT/Apache. Paradigm is being consistent. There&apos;s no &quot;managed Centaur
          cloud&quot; on the way &mdash; the license rules out the obvious SaaS play. The bet is
          that Centaur is worth more to Paradigm as portfolio leverage than as licensing revenue.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>The use-case list is unusually wide.</strong> Investing,
          engineering, design, recruiting, events, customer support. That breadth is the marketing
          asset, because it&apos;s the part you can&apos;t fake. Six months of real internal use
          across a fifty-person firm produces a list of jobs-to-be-done that no vendor demo ever
          could.
        </p>

        <SectionLabel>The competitive grid</SectionLabel>
        <p style={bodyStyle}>
          Centaur sits right where four neighbouring markets overlap. None of them has a direct
          equivalent yet &mdash; which is the most interesting thing about the launch.
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
          <strong style={strong}>vs. Devin.</strong> The closest functional cousin. Devin is closed
          SaaS, per-seat pricing, fully autonomous, single brand. Centaur is open, self-hosted,
          harness-agnostic, and a runtime rather than a product. For any team that can&apos;t ship
          its code or secrets off to a vendor cloud &mdash; finance, crypto, healthcare, anyone
          with a serious compliance posture &mdash; Centaur is the only thing in the column.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>vs. E2B / Daytona / Modal / Blaxel.</strong> These sell sandbox
          APIs. Centaur swallows the sandbox layer whole (it runs its own on K8s) and adds the four
          things the sandbox vendors don&apos;t: Slack ingress, durable workflows, a credential
          gateway, an audit trail. If you&apos;re an agent <em>builder</em> renting E2B by the hour,
          carry on; if you&apos;re a <em>company</em> deploying one agent for fifty coworkers, you
          want Centaur.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>vs. kagent / LangGraph Platform.</strong> Both are open-source,
          K8s-native control planes for agents. They sit lower in the stack than Centaur &mdash;
          orchestration primitives and observability aimed at platform-engineering teams. Centaur
          is a packaged product sitting on top: Slack bot included, secrets gateway included,
          sandbox image included. Time to your first working agent is hours, not weeks.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>vs. Sweep / Tusk / Copilot Workspaces.</strong> Different scope
          entirely. These are PR-shaped: read an issue, hand back a PR. Centaur runs the whole
          company &mdash; the PR-bot pattern is just one of many workflows you could build on top
          of it.
        </p>

        <SectionLabel>Where this leaves the market</SectionLabel>
        <p style={bodyStyle}>
          The spot Centaur stakes out is the top-right quadrant of that grid:{' '}
          <strong style={strong}>open-source, self-hosted, full-stack team agent runtime</strong>.
          Twelve months ago that quadrant didn&apos;t exist as a category at all. Today it has one
          credible entrant, backed by a firm whose earlier infrastructure bets (Foundry, Reth,
          OpenClaw) turned into default tools for whole industries.
        </p>

        <p style={bodyStyle}>
          Three predictions fall straight out of the design choices above:
        </p>

        <ul style={listStyle}>
          <li>
            <strong style={strong}>The sandbox-API vendors will commoditize faster.</strong>{' '}
            If the standard way to deploy becomes &quot;an agent runtime on the customer&apos;s
            own K8s,&quot; then the standalone-sandbox layer is a feature, not a product. E2B and
            Daytona will either climb up into orchestration or get squeezed.
          </li>
          <li>
            <strong style={strong}>Devin gets a self-hosted SKU.</strong> The compliance gap is
            wide enough that Cognition can&apos;t ignore it forever &mdash; but moving from SaaS to
            self-hosted is a structural lift, not a flag you flip.
          </li>
          <li>
            <strong style={strong}>Over the next year, agent product PMs will spend most of their
            time on workflows, not on models.</strong> Centaur is a bet that the unsolved problem
            is durability, sharing, and credentials &mdash; not raw capability. And that bet lines
            up with what most users gripe about once the novelty wears off.
          </li>
        </ul>

        <p style={bodyStyle}>
          Centaur isn&apos;t the only thing that&apos;ll work. But it&apos;s the first credible
          answer to the question &quot;what does an agent look like when it has to be a teammate to
          fifty people for a year?&quot; &mdash; and it ships with six months of receipts from the
          firm that built it.
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
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '0.88em',
  background: 'rgba(255,255,255,0.06)', padding: '1px 6px',
  borderRadius: 3, color: '#fff',
};
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
