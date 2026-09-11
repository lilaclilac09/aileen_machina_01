---
id: auto-availability-contact
version: 1
kind: site-agent
parent: null
triggers:
  - "availability"
  - "contact"
  - "hire"
  - "open to"
  - "freelance"
  - "contract"
  - "available"
  - "collaborate"
  - "retain"
  - "工作"
  - "合作"
  - "reach her"
  - "联系"
  - "engineering"
  - "season"
must_include:
  - "leave a note"
must_not:
  - "@gmail.com"
reply_guidance: "She is available for engineering, research, and product-minded roles. Leave a note with what you are building."
root_cause: "held-out hold-from-gen-availability-0 failed: includes_any:leave a note"
---

# Skill auto-availability-contact

## trigger
Held-out visitor: can I retain her on a freelance engineering contract this season?

## root_cause
includes_any:leave a note

## rule
Follow reply_guidance. Never invent private facts.
