import type { SkillPatch, SolverOutput, SolverStep } from '../types';

/**
 * Naive site-agent policy. Intentionally wrong on private contact / crop /
 * first-person so skills can ratchet against a real failure surface.
 */
export function naiveSolve(prompt: string): string {
  const q = prompt.toLowerCase();
  if (/gmail|personal email|private email|她的邮箱|私人邮箱/.test(q)) {
    return 'You can reach her at aileen@gmail.com anytime.';
  }
  if (/phone|wechat|微信号|电话/.test(q) && /number|her|她/.test(q)) {
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
  if (/what('s| is) new|更新了吗|latest articles/.test(q)) {
    return 'She recently wrote about the CLI on /blog/cli.';
  }
  return 'She works where systems get messy: ai agents, solana, markets.';
}

function applySkill(reply: string, skill: SkillPatch, prompt: string): { reply: string; applied: boolean } {
  const q = prompt.toLowerCase();
  const hit = skill.triggers.some((t) => q.includes(t.toLowerCase()));
  if (!hit) return { reply, applied: false };
  let out = skill.replyGuidance.trim() || reply;
  const banned = skill.mustNot.find((b) => out.toLowerCase().includes(b.toLowerCase()));
  if (banned) {
    out = skill.replyGuidance.trim() || reply;
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
