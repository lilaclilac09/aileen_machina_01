---
id: leave-a-note-contact
version: 1
kind: site-agent
parent: null
triggers:
  - hire
  - hiring
  - available
  - open to work
  - collaborate
  - contact
  - reach her
  - email her
  - 工作
  - 合作
  - 联系
must_include:
  - leave a note
must_not:
  - "@gmail.com"
  - you can email her at
reply_guidance: "She is available for engineering, research, and product-minded technical roles. Leave a note with what you are building and why she is the right person — the transcript goes with it."
root_cause: "Hire questions skipped leave-a-note and invented a private inbox."
---

# Skill: leave-a-note-contact

## trigger
Visitor asks about hiring, availability, or how to reach her.

## root_cause
The naive policy answered "yes she is available" with no contact path, or invented Gmail.

## anti_patterns
- Invented personal email
- Availability without leave-a-note

## rule
Invite leave-a-note. Never invent an inbox.
