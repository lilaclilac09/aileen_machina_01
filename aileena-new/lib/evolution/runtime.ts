/**
 * Site-agent runtime surface for self-evolution.
 * Safe to import from the chat route: no verifier paths, no ops/ fs.
 */

export { ACTIVE_SKILLS, type ActiveSkill } from './activeSkills.generated';
export { matchingSkills, formatMatchingSkills } from './selectSkills';
export type { SkillKind, SkillPatch } from './types';
