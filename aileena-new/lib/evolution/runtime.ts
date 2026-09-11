/**
 * Site-agent runtime surface for self-evolution.
 * Safe to import from the chat route: no verifier paths, no ops/ fs.
 */

export { ACTIVE_SKILLS, type ActiveSkill } from './activeSkills.generated';
export {
  matchingSkills,
  formatMatchingSkills,
  formatHardRulesDigest,
  formatSkillsForTurn,
  uncoveredBankPrompts,
  falsePositiveNegatives,
  searchHaystack,
  triggerMatches,
  QUESTION_ALIASES,
  TRIGGER_NOISE,
  VOICE_HOWTO_RE,
} from './selectSkills';
export type { SkillTriggerSource } from './selectSkills';
export type { SkillKind, SkillPatch } from './types';
