# HARNESS.md

Why this repo's agent rules exist, and where a person still has to decide.

> "A good harness should not necessarily aim to fully eliminate human input, but to direct it to where our input is most important."
> — Birgitta Böckeler, *The role of the human*

## What a human brings that an agent doesn't

A developer carries an unwritten harness into every codebase. An agent carries none of it. Each item below says what we write down to make up for it.

| What a human has | What the agent lacks | What we write down instead |
| --- | --- | --- |
| Their name is on the commit | No social accountability | Whoever directs an agent counts as a reviewer and owns the outcome. An agent's approve never fills a human slot. |
| Pain at a 300-line function | No disgust at complexity | Smallest diff. No redesign unless asked. No parallel systems. Reviewer checks 6–12 month maintainability. |
| "We don't do it that way here" | No local intuition | Load-bearing conventions are listed below and in `REVIEW.md`. |
| Organisational memory | Forgets every session | Decisions and tolerated debt are listed below. Every incident becomes an eval case. |
| Knows what the team is trying to do | Can't tell if a correct fix is the right fix | Every PR states root cause and runtime path. "Should we build this?" stays with a person. |
| Small steps at a human pace | Writes hundreds of lines at once | One vertical slice per PR. Propose before acting. Round cap of 3. |

## Pace is a feature

Working slowly is what gives experience time to come back to mind. An agent that writes hundreds of lines in one pass removes that pause, so the harness puts it back:

- **Propose, then act.** The agent states the next action and waits. Each step is a chance to stop and think.
- **One slice per PR.** If a PR does two things, split it. #418 bundled draw features into a chat fix; that should have been split.
- **Run it before asking anyone.** Show output, not "done".
- **Stop after 3 review rounds.** More rounds mean the approach is wrong, not that the code needs another pass.

## Load-bearing conventions (don't change without a human)

These hold the system up. Breaking one is a blocker, not a nit.

- Owner-only access is checked on the server. Never trust a client field, a cookie's name, or the contact inbox env. The allow-list is `OWNER_EMAILS` only.
- Council transcripts never reach public contact or email.
- Every public POST that sends mail or calls a model has a server-side limit.
- Secrets and private transcripts never reach the client, logs, or error bodies.
- Agents that review, test, or gate never edit code. The implementer never approves its own work.

## Tolerated debt (known, accepted for now)

Don't flag these as new findings. Tag them **Pre-existing**.

- Full-repo `pnpm lint` is red on `main`. Only touched files are linted.
- The rate limiter is in-memory, per instance.
- The council guard on public contact is a pattern check. A stripped council transcript can still get through.
- Preview deploys sit behind SSO, so QA often can't observe runtime there.

## Where a person decides

The harness handles the routine checks. These stay with a person:

1. **Direction:** should this be built at all, and in this shape?
2. **Risky paths:** owner, auth, contact, council, env, CI workflows.
3. **Patterns others will copy:** architecture that sets precedent.
4. **Reading the evidence:** the command, its output, the screenshot. If you can't say what the checks would miss, ask for a real review.
5. **Owning the outcome:** someone's name is on every change that ships.

## Keeping the harness honest

- When a reviewer keeps flagging the same thing, move the rule here or into `REVIEW.md`, a lint rule, or a check.
- When something slips through, ask what the agent didn't have in front of it, and write that down.
- When a convention turns out to be just habit, delete it. This file should stay short.

## Still to fill in (needs Aileen)

- What "good" looks like for this site: who it's for and what it must never feel like.
- Which other conventions are load-bearing, and which are habit.
- Debt that's tolerated for product reasons, beyond the technical items above.
