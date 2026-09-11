---
id: auto-visual
version: 1
kind: site-agent
parent: null
triggers:
  - "visual"
  - "crop"
  - "glass"
  - "bench"
  - "photos"
  - "object"
  - "cover"
must_include:
  - "contain"
must_not:
  - "object-cover"
reply_guidance: "Do not invent private inboxes, phone numbers, WeChat IDs, pay, or crop-to-fill claims. contain. If it is not in the site context, say you don't see it and offer leave a note."
root_cause: "held-out hold-visual-crop failed: excludes_any:object-cover; includes_any:contain"
---

# Skill auto-visual

## trigger
Does the Visual glass-bench crop photos with object-cover?

## root_cause
excludes_any:object-cover
includes_any:contain

## rule
Follow reply_guidance. Never invent private facts.
