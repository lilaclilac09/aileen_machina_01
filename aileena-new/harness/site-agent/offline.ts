/**
 * Offline layer: deterministic checks on the pure routing / gating functions
 * the /api/chat route calls BEFORE any model or network. No secrets, no Redis,
 * no network. Run: npx -y tsx harness/site-agent/offline.ts
 */
import { decideAgentMode, isCouncilPipelineRequest } from '../../lib/agentMode';
import { parseOwnerBrowseCommand } from '../../lib/browserUse/parseBrowseCommand';
import { parseVisitorComputerCommand } from '../../lib/computer/parseOwnerCommand';
import { classifySiteLane } from '../../lib/siteLanes';
import { collegeReply } from '../../lib/collegeCite';
import { classifyRootProvider, parseNewRootError } from '../../lib/consolePrefixCopy';
import { parseVoiceAccent } from '../../lib/voiceAccent';

type Row = { name: string; ok: boolean; detail?: string; known?: boolean };
const rows: Row[] = [];
const eq = (name: string, got: unknown, want: unknown, known = false) =>
  rows.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), detail: `got ${JSON.stringify(got)}`, known });

// Owner gate — server decides, client agentMode is a request not a credential.
eq('council without owner → 403', decideAgentMode('council', false), { ok: false, status: 403, error: 'Council is owner-only.' });
eq('COUNCIL (case) without owner → 403', decideAgentMode('  COUNCIL ', false).ok, false);
eq('council with owner → council', decideAgentMode('council', true), { ok: true, mode: 'council' });
eq('night → 400', decideAgentMode('night', false).ok, false);
eq('site → public', decideAgentMode('site', false), { ok: true, mode: 'public' });
eq('unknown → public', decideAgentMode('admin', false), { ok: true, mode: 'public' });
eq('machina without owner → machina (documented: public first-person mode)', decideAgentMode('machina', false), { ok: true, mode: 'machina' });

// Contact/forward must reject council-shaped payloads even when agentMode is spoofed to public.
eq('forward: council lens → council pipeline', isCouncilPipelineRequest({ agentMode: 'public', councilLens: 'money' }), true);
eq('forward: /council context → council pipeline', isCouncilPipelineRequest({ context: 'https://aileena.xyz/council' }), true);
eq('forward: council format text → council pipeline', isCouncilPipelineRequest({ transcript: 'Judgment: x\nLeverage: y\nNext move: z\nDo not: w' }), true);
eq('forward: plain visitor note → public', isCouncilPipelineRequest({ note: 'Hi, I build on Solana.' }), false);

// Pre-model fast paths: ordinary questions must NOT be hijacked into side-effect lanes.
eq('browse: plain question is not a browse command', parseOwnerBrowseCommand('what does she browse for music?'), null);
eq('browse: "browse: x" is a dry-run prepare', parseOwnerBrowseCommand('browse: aileena.xyz')?.kind, 'prepare');
eq('lane: "forge" → forge', classifySiteLane('use forge to fix the header'), 'forge');
eq('lane: a question mentioning "pull request" does not fire forge', classifySiteLane('has she ever opened a pull request to solana?'), null);
eq('lane: "open a pull request for the typo" does not fire forge', classifySiteLane('open a pull request for the typo'), null);
eq('scratch: "find her tamper-check project" stays a question', parseVisitorComputerCommand('find her tamper-check project'), null);
eq('scratch: explicit "find: x" is still a scratch search', parseVisitorComputerCommand('find: oat')?.kind, 'queue_task');
eq('scratch: "note: hi" is a scratch write', parseVisitorComputerCommand('note: hi')?.kind, 'queue_task');

// College lane: crisis copy and CV-in-Chinese collision.
eq('college: crisis line answers before model', Boolean(collegeReply('我不想活了')), true);
eq('college: zh crisis copy gives 12356 + HK 2389 2222 + TW 1925', ['12356', '2389 2222', '1925'].every((n) => (collegeReply('我不想活了') ?? '').includes(n)), true);
eq('college: de crisis copy gives TelefonSeelsorge + 112', ['0800 111 0 111', '116 123', '112'].every((n) => (collegeReply('Ich will nicht mehr leben') ?? '').includes(n)), true);
eq('college: en crisis copy gives 988 + findahelpline', ['988', 'findahelpline.com'].every((n) => (collegeReply('I want to kill myself') ?? '').includes(n)), true);
eq('college: "她现在的工作是什么" is not a CBT card', collegeReply('她现在的工作是什么？'), null);
eq('college: "what does she do for work" is not a CBT card', collegeReply('what does she do for work, should I hire her?'), null);
eq('college: a visitor\'s own work stress still gets the shelf', /Judith Beck/.test(collegeReply('我工作好累，老板总说我应该加班') ?? ''), true);
eq('college: "solana" question bypasses shelf', collegeReply('她在 solana 上的工作'), null);

// Frozen root + accent lock.
eq('provider deepseek → deepseek', classifyRootProvider('deepseek'), 'deepseek');
eq('provider empty → unset (never default DeepSeek)', classifyRootProvider(''), 'unset');
eq('409 new_root parse', parseNewRootError('{"code":"new_root","reason":"model_swap","error":"x"}')?.reason, 'model_swap');
eq('accent whitelist', [parseVoiceAccent('Berlin'), parseVoiceAccent('paris')], ['berlin', null]);

let fail = 0;
let known = 0;
for (const r of rows) {
  const tag = r.ok ? 'PASS' : r.known ? 'KNOWN' : 'FAIL';
  if (!r.ok && !r.known) fail++;
  if (!r.ok && r.known) known++;
  console.log(`${tag.padEnd(5)} ${r.name}${r.ok ? '' : ` — ${r.detail}`}`);
}
console.log(`\n${rows.length - fail - known}/${rows.length} pass · ${known} known issues · ${fail} unexpected failures`);
process.exit(fail ? 1 : 0);
