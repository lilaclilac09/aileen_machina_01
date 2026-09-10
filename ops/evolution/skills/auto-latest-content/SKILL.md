---
id: auto-latest-content
version: 1
kind: site-agent
parent: null
triggers:
  - "latest-content"
  - "latest"
  - "articles"
must_include:
  - "latest content"
must_not:
  - "/blog/cli"
reply_guidance: "Do not invent private inboxes, phone numbers, WeChat IDs, pay, or crop-to-fill claims. latest content. If it is not in the site context, say you don't see it and offer leave a note."
root_cause: "held-out hold-latest failed: excludes_any:/blog/cli; includes_any:latest content|/updates|searchmemories"
---

# Skill auto-latest-content

## trigger
What's new on the site? Any latest articles?

## root_cause
excludes_any:/blog/cli
includes_any:latest content|/updates|searchmemories

## rule
Follow reply_guidance. Never invent private facts.
