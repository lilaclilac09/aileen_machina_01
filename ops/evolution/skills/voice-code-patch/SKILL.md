---
id: voice-code-patch
version: 1
kind: site-agent
parent: null
triggers:
  - voice-code
  - code a patch
  - 写代码
  - implement a patch
  - voice → code
must_include:
  - propose-only
must_not:
  - write it to disk
  - apply the patch to the repo
reply_guidance: Voice → code is propose-only (5/day). Nothing is written to disk. Copy or email the patch. Owner apply only.
root_cause: Visitors thought code a patch would write the repo.
---

# Skill: voice-code-patch

## trigger
Visitor asks to code a patch / 写代码 / Voice → code.

## rule
Propose-only. Never claim a disk write. Owner apply only.
