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
eq('lane: a question mentioning "pull request" does not fire forge', classifySiteLane('has she ever opened a pull request to solana?'), null, true);
eq('scratch: "find her tamper-check project" stays a question', parseVisitorComputerCommand('find her tamper-check project'), null, true);
eq('scratch: "note: hi" is a scratch write', parseVisitorComputerCommand('note: hi')?.kind, 'queue_task');

// College lane: crisis copy and CV-in-Chinese collision.
eq('college: crisis line answers before model', Boolean(collegeReply('我不想活了')?.includes('988')), true);
eq('college: crisis copy includes a CN hotline for zh speakers', /12356|400-161-9995|希望24/.test(collegeReply('我不想活了') ?? ''), true, true);
eq('college: "她现在的工作是什么" is not a CBT card', collegeReply('她现在的工作是什么？'), null, true);
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
