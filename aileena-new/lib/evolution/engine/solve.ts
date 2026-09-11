import type { SkillPatch, SolverOutput, SolverStep } from '../types';
import { QUESTION_ALIASES, TRIGGER_NOISE, searchHaystack, triggerMatches } from '../selectSkills';

/**
 * Naive site-agent policy. Intentionally wrong on private contact / crop /
 * first-person so skills can ratchet against a real failure surface.
 * Uses the same Chinese aliases as chat (`searchHaystack`) so CJK questions
 * are a real failure surface, not invisible to the solver.
 */
export function naiveSolve(prompt: string): string {
  const q = searchHaystack(prompt);
  if (/gmail|personal email|private email|她的邮箱|私人邮箱/.test(q)) {
    return 'You can reach her at aileen@gmail.com anytime.';
  }
  if (/wechat|微信号|电话/.test(q) || (/phone/.test(q) && /number|her|她/.test(q))) {
    return 'Her WeChat is aileen1999 and her number is 555-0100.';
  }
  if (/salary|compensation|how much does she make|薪/.test(q)) {
    return 'She makes $400k at a hedge fund.';
  }
  if (/hire|open to work|available for|collaborate|合作|招聘/.test(q)) {
    return 'Yes she is available.';
  }
  if (/object-cover|crop|visual page|glass-bench|裁切/.test(q)) {
    return 'The Visual page uses object-cover so images fill the frame.';
  }
  if (/are you aileen|你是 aileen|你就是她/.test(q)) {
    return 'I am Aileen — this is my site.';
  }
  if (/what('s| is) new|更新了吗|latest articles|latest content/.test(q)) {
    return 'She recently wrote about the CLI on /blog/cli.';
  }
  if (/voice-code|code a patch|写代码|implement a patch/.test(q)) {
    return "I'll apply the patch to the repo and write it to disk now.";
  }
  if (/voice howto|how do i use voice|语音|声音|麦克风/.test(q)) {
    return 'Just say Aileena — the mic is always on.';
  }
  return 'She works where systems get messy: ai agents, solana, markets.';
}

function applySkill(reply: string, skill: SkillPatch, prompt: string): { reply: string; applied: boolean } {
  const hay = searchHaystack(prompt);
  const hit = skill.triggers.some((t) => triggerMatches(hay, t));
  if (!hit) return { reply, applied: false };
  const guidance = skill.replyGuidance.trim();
  let out = guidance || reply;
  if (!guidance) {
    for (const ban of skill.mustNot) {
      const re = new RegExp(ban.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
      out = out.replace(re, '').replace(/\s+/g, ' ').trim();
    }
  }
  for (const must of skill.mustInclude) {
    if (!out.toLowerCase().includes(must.toLowerCase())) out = `${out} ${must}`.trim();
  }
  return { reply: out, applied: true };
}

/** Sandbox default solver — same aliases, noise filter, and guidance-preserving apply. */
export function standaloneSolverSource(): string {
  const aliases = QUESTION_ALIASES.map(([re, add]) => [re.source, re.flags, add]);
  return `import { readFileSync } from 'node:fs';
const ALIASES = ${JSON.stringify(aliases)};
const NOISE = new Set(${JSON.stringify([...TRIGGER_NOISE])});
function haystack(question) {
  const q = String(question).toLowerCase();
  let extra = '';
  for (const [source, flags, add] of ALIASES) {
    const re = new RegExp(source, flags);
    if (re.test(question) || re.test(q)) extra += add;
  }
  return q + extra;
}
function triggerHits(hay, trigger) {
  const t = String(trigger).toLowerCase().trim();
  if (!t || NOISE.has(t)) return false;
  if (t.length < 4 && !/[\\u4e00-\\u9fff]/.test(t)) return false;
  const i = hay.indexOf(t);
  if (i < 0) return false;
  if (/[\\u4e00-\\u9fff]/.test(t)) return true;
  const before = i === 0 || /[^a-z0-9]/.test(hay[i - 1]);
  const after = i + t.length >= hay.length || /[^a-z0-9]/.test(hay[i + t.length]);
  return before && after;
}
function naive(prompt) {
  const q = haystack(prompt);
  if (/gmail|personal email|private email|她的邮箱|私人邮箱/.test(q)) return 'You can reach her at aileen@gmail.com anytime.';
  if (/wechat|微信号|电话/.test(q) || (/phone/.test(q) && /number|her|她/.test(q))) return 'Her WeChat is aileen1999 and her number is 555-0100.';
  if (/salary|compensation|how much does she make|薪/.test(q)) return 'She makes $400k at a hedge fund.';
  if (/hire|open to work|available for|collaborate|合作|招聘/.test(q)) return 'Yes she is available.';
  if (/object-cover|crop|visual page|glass-bench|裁切/.test(q)) return 'The Visual page uses object-cover so images fill the frame.';
  if (/are you aileen|你是 aileen|你就是她/.test(q)) return 'I am Aileen — this is my site.';
  if (/what('s| is) new|更新了吗|latest articles|latest content/.test(q)) return 'She recently wrote about the CLI on /blog/cli.';
  if (/voice-code|code a patch|写代码|implement a patch/.test(q)) return "I'll apply the patch to the repo and write it to disk now.";
  if (/voice howto|how do i use voice|语音|声音|麦克风/.test(q)) return 'Just say Aileena — the mic is always on.';
  return 'She works where systems get messy: ai agents, solana, markets.';
}
function apply(reply, skill, prompt) {
  const hay = haystack(prompt);
  if (!(skill.triggers || []).some((t) => triggerHits(hay, t))) return { reply, applied: false };
  const guidance = String(skill.replyGuidance || '').trim();
  let out = guidance || reply;
  for (const must of skill.mustInclude || []) {
    if (!out.toLowerCase().includes(String(must).toLowerCase())) out = (out + ' ' + must).trim();
  }
  return { reply: out, applied: true };
}
const task = JSON.parse(readFileSync(new URL('./task.json', import.meta.url), 'utf8'));
let reply = naive(task.prompt);
const skillIds = [];
const steps = [{ skillId: null, action: 'naive', detail: 'sandbox baseline' }];
for (const skill of task.skills || []) {
  const next = apply(reply, skill, task.prompt);
  if (next.applied) {
    reply = next.reply;
    skillIds.push(skill.id + '@' + skill.version);
    steps.push({ skillId: skill.id + '@' + skill.version, action: 'apply', detail: skill.rootCause || '' });
  }
}
process.stdout.write(JSON.stringify({ reply, skillIds, steps, hackAttempt: false }));
`;
}

/** Deterministic skill-following solver. No filesystem. No verifier access. */
export function skillSolve(prompt: string, skills: SkillPatch[]): SolverOutput {
  const steps: SolverStep[] = [{ skillId: null, action: 'naive', detail: 'baseline policy' }];
  let reply = naiveSolve(prompt);
  const skillIds: string[] = [];
  for (const skill of skills) {
    const next = applySkill(reply, skill, prompt);
    if (next.applied) {
      reply = next.reply;
      skillIds.push(`${skill.id}@${skill.version}`);
      steps.push({
        skillId: `${skill.id}@${skill.version}`,
        action: 'apply',
        detail: skill.rootCause || skill.replyGuidance.slice(0, 80),
      });
    }
  }
  return { reply, skillIds, steps, hackAttempt: false };
}

export function skillSetKey(skills: SkillPatch[]): string[] {
  return skills.map((s) => `${s.id}@${s.version}`).sort();
}
