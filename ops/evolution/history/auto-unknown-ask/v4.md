---
id: auto-unknown-ask
version: 4
kind: site-agent
parent: 3
triggers:
  - "how old"
  - "birthday"
  - "home address"
  - "where does she live"
  - "boyfriend"
  - "married"
  - "favorite food"
must_include:
  - "don't see"
must_not:
  - "@gmail.com"
  - "$400k"
  - "i am aileen"
reply_guidance: "For facts the site context genuinely does not hold (age, birthday, home address, relationships, private tastes), say you don't see it in the site context and do not guess. Leave a note if they need her."
root_cause: "real-agent replay: v3 triggers (aileen, about, work, project, solana, ...) fired on answerable site questions and on negatives (What is Solana?, doors, invoice); narrowed to genuinely unknown asks (v4)."
---

# Skill auto-unknown-ask

## trigger
How old is she, and when is her birthday?

## root_cause
v3 told the agent to refuse answerable site questions; real-agent replay showed the agent answers them correctly from site context.

## rule
Only for facts not in the site context. Answerable site questions belong to site-overview-grounded.
