---
id: auto-latest-content
version: 3
kind: site-agent
parent: 2
triggers:
  - "latest-content"
  - "latest"
  - "what's new"
  - "what is new"
  - "更新"
  - "new on the site"
must_include:
  - "latest content"
  - "searchmemories"
must_not:
  - "/blog/cli"
reply_guidance: For what is new, use searchMemories with query latest content and point at /updates. Do not cite old training posts unless they appear there.
root_cause: "Guidance named /blog/cli so the solver ate its own instruction; noise triggers (week/ship/anything) false-fired. Upgrade v3."
---

# Skill auto-latest-content

## trigger
What's new on the site? Any latest articles?

## root_cause
Guidance must not contain the banned path. Triggers must not be generic tokens.

## rule
Follow reply_guidance. Never invent private facts.
