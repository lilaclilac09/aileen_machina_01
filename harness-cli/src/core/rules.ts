import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * S6 — compose system prompt from base + AGENTS.md + .hx/rules/*.md
 */
export function loadRules(cwd: string, baseSystem: string): string {
  const parts = [baseSystem.trim()];

  const agents = join(cwd, 'AGENTS.md');
  if (existsSync(agents)) {
    parts.push(`# AGENTS.md\n${readFileSync(agents, 'utf8').trim()}`);
  }

  const rulesDir = join(cwd, '.hx', 'rules');
  if (existsSync(rulesDir)) {
    const files = readdirSync(rulesDir)
      .filter((f) => f.endsWith('.md'))
      .sort();
    for (const f of files) {
      const body = readFileSync(join(rulesDir, f), 'utf8').trim();
      if (body) parts.push(`# .hx/rules/${f}\n${body}`);
    }
  }

  return parts.join('\n\n');
}
