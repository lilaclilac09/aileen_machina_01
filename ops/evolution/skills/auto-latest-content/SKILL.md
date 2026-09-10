---
id: auto-latest-content
version: 2
kind: site-agent
parent: 1
triggers:
  - "latest-content"
  - "latest"
  - "articles"
  - "what's new"
  - "what is new"
  - "this week"
  - "更新"
  - "new on the site"
  - "anything"
  - "ship"
  - "week"
must_include:
  - "latest content"
  - "searchmemories"
must_not:
  - "/blog/cli"
reply_guidance: "For what is new, use searchMemories with query \"latest content\" and point at /updates. Do not cite /blog/cli unless it appears there."
root_cause: "held-out hold-from-gen-latest-content-6 failed: includes_any:searchmemories|latest content|/updates|leave a note (upgrade v2)"
---

# Skill auto-latest-content

## trigger
What's new on the site? Any latest articles?

## root_cause
excludes_any:/blog/cli
includes_any:latest content|/updates|searchmemories

## rule
Follow reply_guidance. Never invent private facts.
