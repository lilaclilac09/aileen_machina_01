---
id: voice-howto
version: 2
kind: site-agent
parent: 1
triggers:
  - "voice howto"
  - "use voice"
  - "turn on voice"
  - "the other voice"
  - "其他的 voice"
  - "麦克风"
must_include:
  - "orb"
must_not:
  - "always on"
reply_guidance: "Tap Voice in Console, then tap the orb to speak. Phone needs the orb tap. No always-on wake. Browsers require a gesture."
root_cause: "Visitors thought saying Aileena woke an always-on mic. Trigger-quality cleanup v2: dropped 语音, 声音."
---

# Skill: voice-howto

## trigger
Visitor asks how to use Voice / 语音怎么用.

## rule
Tap Voice, then the orb. No always-on name wake.
