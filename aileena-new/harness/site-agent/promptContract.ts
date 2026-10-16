/**
 * P3.10 prompt/code contract (offline, no network, no secrets).
 * The prompt may only promise what the code does:
 *  - every tool the tool tables / skills name exists as a real tool,
 *  - every tool the router allows exists,
 *  - blocked-reason strings the prompt teaches exist in the guard code,
 *  - numeric promises (max steps, daily cap) match the constants.
 * Run: npx -y tsx harness/site-agent/promptContract.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { agentDataTools } from '../../lib/data/tools';
import { REACT_MAX_STEPS } from '../../lib/reactGuard';
import { CHAT_DAILY_LIMIT } from '../../lib/chatQuota';
import { SYSTEM_PROMPT } from '../../lib/agentContext';
import { routeToolsForQuestion } from '../../lib/toolRouter';
import { ACTIVE_SKILLS } from '../../lib/evolution/activeSkills.generated';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });

const root = join(__dirname, '..', '..');
const route = readFileSync(join(root, 'app/api/chat/route.ts'), 'utf8');
const reactSrc = readFileSync(join(root, 'lib/reactGuard.ts'), 'utf8');

// Real tools: route-defined `name: tool({` plus the dataset tool table.
const routeTools = [...route.matchAll(/^\s+(\w+): tool\(\{/gm)].map((m) => m[1]);
const realTools = new Set([...routeTools, ...Object.keys(agentDataTools)]);
check('found route tools', routeTools.length >= 4, routeTools.join(','));

// Tool tables in the prompt: every "- name(" bullet must be a real tool.
function tableBody(name: string): string {
  const m = route.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`;\\n`));
  return m ? m[1] : '';
}
for (const t of ['publicToolTable', 'machinaToolTable', 'councilToolTable']) {
  const body = tableBody(t);
  check(`${t} present`, body.length > 0);
  const promised = [...body.matchAll(/^- (\w+)\(/gm)].map((m) => m[1]);
  const missing = promised.filter((n) => !realTools.has(n));
  check(`${t}: every promised tool exists`, missing.length === 0, missing.join(',') || `${promised.length} ok`);
}

// "call X" / "use X" mentions anywhere in the prompt tables or base system.
const callMentions = new Set(
  [...(tableBody('publicToolTable') + SYSTEM_PROMPT).matchAll(/\b(?:call|use)\s+(search\w+|query\w+|list\w+|compare\w+|latest\w+|price\w+|browse\w+)\b/g)].map(
    (m) => m[1],
  ),
);
const badMentions = [...callMentions].filter((n) => !realTools.has(n));
check('prompt "call/use <tool>" mentions exist', badMentions.length === 0, badMentions.join(',') || [...callMentions].join(','));

// Router: allowed tools exist.
const probes = ['what did she update', 'hire her', 'what is Centaur', 'her music taste', 'H100 price', 'faith', 'hello'];
for (const q of probes) {
  const r = routeToolsForQuestion(q);
  const allowed = Array.isArray(r.allowed) ? r.allowed : [];
  const missing = allowed.filter((n: string) => !realTools.has(n));
  check(`router "${q}" allows only real tools`, missing.length === 0, missing.join(','));
}

// Skills must not name tools that do not exist.
for (const s of ACTIVE_SKILLS) {
  const text = [s.replyGuidance, ...s.mustInclude].join('\n');
  const named = [...text.matchAll(/\b(search[A-Z]\w+|query[A-Z]\w+|list[A-Z]\w+|browseWeb|callMcp)\b/g)].map((m) => m[1]);
  const missing = named.filter((n) => !realTools.has(n));
  check(`skill ${s.id}: tools exist`, missing.length === 0, missing.join(','));
}

// Blocked reasons the prompt teaches exist in code.
for (const reason of [...tableBody('publicToolTable').matchAll(/reason:(\w+)/g)].map((m) => m[1])) {
  check(`blocked reason ${reason} exists in reactGuard`, reactSrc.includes(`'${reason}'`));
}

// Numeric promises.
const steps = tableBody('publicToolTable').match(/up to (\d+) steps/);
check('"up to N steps" matches REACT_MAX_STEPS', !!steps && Number(steps[1]) === REACT_MAX_STEPS, steps?.[1]);
check('daily cap unchanged at 20', CHAT_DAILY_LIMIT === 20, String(CHAT_DAILY_LIMIT));
check('last step forces toolChoice none', /stepNumber >= REACT_MAX_STEPS - 1 \? \{ toolChoice: 'none'/.test(route));

// Privileged tools promised only in owner branch.
const machina = tableBody('machinaToolTable');
check('callMcp/listMcpApps promised only behind owner gate', /owner && isComputerPrototypeEnabled\(\)/.test(machina));

const failed = rows.filter((r) => !r.ok);
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
console.log(`\nprompt contract: ${rows.length - failed.length}/${rows.length}`);
if (failed.length) process.exit(1);
