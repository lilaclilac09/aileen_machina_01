#!/usr/bin/env tsx
/**
 * Computer workspace prototype — static + live HTTP owner/public gates.
 *
 *   pnpm verify:computer-prototype
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm verify:computer-prototype
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';
import { inspectRouteFiles, analyzeDailyFixPlan } from '../lib/computer/inspect';
import { parseOwnerComputerCommand, parseVisitorComputerCommand } from '../lib/computer/parseOwnerCommand';
import { labelForTask, matchLearned, rememberCommand } from '../lib/computer/learned';
import { redactSecrets } from '../lib/computer/redact';
import { isComputerPrototypeEnabled, hasComputerWorkerEnv } from '../lib/computer/flag';
import { HARNESS_PLUGINS } from '../lib/computer/plugins';
import { spokenQueued } from '../lib/computer/spokenQueue';
import { gitFindCommit, gitStatus } from '../lib/computer/gitAllowlist';
import { filesOpen } from '../lib/computer/filesAllowlist';
import { TAB_WIRE } from '../lib/computer/capabilities';
import { workspaceGrep, workspaceList, workspaceReadFile, workspaceRuntimeProbe, workspaceWriteFile } from '../lib/computer/workspace';
import { deriveKeyshield, sealOwner, openOwnerSeal } from '../lib/keyshield/prf';
import { KS_HKDF_MASTER, KS_HKDF_VAULT_ID, KS_PRF_FIRST } from '../lib/keyshield/constants';
import { b64urlFromBytes, bytesFromB64url } from '../lib/passkey/b64';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function sourceChecks() {
  const chat = readFileSync(join(process.cwd(), 'app/api/chat/route.ts'), 'utf8');
  const tasks = readFileSync(join(process.cwd(), 'app/api/agent/computer/tasks/route.ts'), 'utf8');
  const flag = readFileSync(join(process.cwd(), 'lib/computer/flag.ts'), 'utf8');
  const runner = readFileSync(join(process.cwd(), 'lib/computer/runner.ts'), 'utf8');
  const pluginsSrc = readFileSync(join(process.cwd(), 'lib/computer/plugins.ts'), 'utf8');
  const dockSrc = readFileSync(join(process.cwd(), 'components/ComputerConsoleDock.tsx'), 'utf8');
  const agentChatSrc = readFileSync(join(process.cwd(), 'components/AgentChat.tsx'), 'utf8');
  const proofPageSrc = readFileSync(join(process.cwd(), 'app/proof/page.tsx'), 'utf8');
  const unlockSrc = readFileSync(join(process.cwd(), 'components/OwnerUnlockForm.tsx'), 'utf8');
  const dailySrc = readFileSync(join(process.cwd(), 'components/DailyBoard.tsx'), 'utf8');
  const gitSrc = readFileSync(join(process.cwd(), 'lib/computer/gitAllowlist.ts'), 'utf8');
  const filesSrc = readFileSync(join(process.cwd(), 'lib/computer/filesAllowlist.ts'), 'utf8');
  const chatFast = readFileSync(join(process.cwd(), 'lib/computer/chatFastPath.ts'), 'utf8');
  assert(
    'chat is not Next edge runtime (OpenNext Cloudflare forbids it)',
    !/export const runtime = 'edge'/.test(chat),
  );
  assert('fast path expands learned aliases', /api\/agent\/computer\/learned/.test(chatFast) && /resolved\.kind !== 'queue_task'/.test(chatFast));
  assert('visitor fast path exists', /tryVisitorComputerFastPath/.test(chatFast));
  assert('fast path passes phrase', /phrase: opts.lastQ/.test(chatFast));
  assert('chat does not import computer runner', !/from ['"].*computer\/runner['"]/.test(chat));
  assert('chat does not import git allowlist', !/from ['"].*computer\/gitAllowlist['"]/.test(chat));
  assert('tasks route is nodejs', /export const runtime = 'nodejs'/.test(tasks));
  assert('tasks route is actor-gated', /computerActorFromRequest/.test(tasks));
  assert('visitor POST is scratch-only', /isVisitorComputerTaskType/.test(tasks));
  assert('no arbitrary shell field', /forbiddenShellFields/.test(tasks));
  assert('production uses VERCEL_ENV', /VERCEL_ENV === 'production'/.test(flag));
  assert('production enable needs worker env', /hasComputerWorkerEnv/.test(flag) && /prototypeExplicitOn/.test(flag));
  assert('production is not unconditional API off', !/if \(isVercelProduction\(\)\) return false;\s*const raw/.test(flag));
  assert('runner does not merge', /not performed/.test(runner) || /owner approval/.test(runner));
  assert('runner still has local-shim fallback', /local-shim/.test(runner));
  assert(
    'visitor scratch resets monthly (lazy 30d TTL)',
    /VISITOR_SCRATCH_TTL_DAYS = 30/.test(runner) && /ensureVisitorScratchFresh/.test(runner),
  );
  assert(
    'monthly reset never touches the owner workspace',
    /!isOwnerComputerTask\(task\) && backend === 'cloudflare-worker-shell'/.test(runner),
  );
  const cfClientSrc = readFileSync(join(process.cwd(), 'lib/computer/cfClient.ts'), 'utf8');
  assert('cfClient does not import @cloudflare/computer', !/from ['"]@cloudflare\/computer/.test(cfClientSrc));
  assert('cfClient routes by workspace name', /\/c\/\$\{name\}\/file/.test(cfClientSrc) && /\/c\/\$\{name\}\/exec/.test(cfClientSrc));
  const storeSrc = readFileSync(join(process.cwd(), 'lib/computer/store.ts'), 'utf8');
  assert('task store persists to Durable Object', /TASKS_STORE_PATH/.test(storeSrc) && /hydrateComputerStore/.test(storeSrc));
  assert('task store does not persist every running tick', /isTerminalStatus/.test(storeSrc) && /reapStaleOpen/.test(storeSrc));
  assert('task store persist retries and does not throw', /attempt < 3/.test(storeSrc) && /persist failed/.test(storeSrc));
  assert('kickComputerTask cannot 500 the POST', /kickComputerTask/.test(tasks) && /status: 'failed'/.test(tasks));
  assert(
    'worker-shell skips the 1400ms running pause',
    /backend !== 'cloudflare-worker-shell'/.test(runner) && /setTimeout\(r, 1400\)/.test(runner),
  );
  assert(
    'worker lives beside the Next app',
    existsSync(join(process.cwd(), '..', 'workers', 'aileena-computer', 'src', 'index.ts')),
  );
  const workerSrc = readFileSync(join(process.cwd(), '..', 'workers', 'aileena-computer', 'src', 'index.ts'), 'utf8');
  assert('worker requires bearer secret', /Bearer/.test(workerSrc) && /COMPUTER_WORKER_SECRET/.test(workerSrc));
  assert('worker allowlists owner and visitor cwid', /VISITOR_RE/.test(workerSrc) && /idFromName\(name\)/.test(workerSrc));
  assert('worker PUT replaces existing files', /await ws\.fs\.rm\(path\)/.test(workerSrc) && /await using ws/.test(workerSrc));
  assert('runner finds git commits', /git_find_commit/.test(runner) && /gitFindCommit/.test(runner));
  assert('runner blocks email send', /email_send/.test(runner) && /email not connected/.test(runner));
  assert('runner blocks fake browser screenshots', /browser_screenshot/.test(runner) && /No fake screenshots/.test(runner));
  assert(
    'git verbs are inspect-only',
    /GIT_VERBS = new Set\(\['status', 'log', 'show', 'diff'\]\)/.test(gitSrc) &&
      /No reset, clean, push, merge, checkout/.test(gitSrc),
  );
  assert('files block .env and keys', /BLOCKED_NAME/.test(filesSrc) && /\.env/.test(filesSrc));
  assert('owner tabs exist', /computer-tabs/.test(dockSrc) && /computer-tab-\$\{id\}/.test(dockSrc));
  assert('git candidates surface', /git-merge-candidates/.test(dockSrc));
  assert(
    'computer toggle gates the dock',
    /computer-mode-toggle/.test(agentChatSrc) &&
      /computerMode \? <ComputerConsoleDock isOwner=\{isOwner\}/.test(agentChatSrc),
  );
  assert(
    'opening the Console turns the computer on',
    /setOpen\(true\);\s*setComputerMode\(true\)/.test(agentChatSrc),
  );
  assert('visitor chips skip git status', /VISITOR_STARTER_CHIPS/.test(dockSrc) && !/VISITOR_STARTER_CHIPS[\s\S]{0,200}git status/.test(dockSrc));
  assert('dock tells visitors scratch resets on a 30d mark', /isOwner \? '' : ' · 30d'/.test(dockSrc));
  assert('does not import @cloudflare/computer', !existsSync(join(process.cwd(), 'node_modules/@cloudflare/computer')));
  assert(
    'plugins are not DeepSeek Harness',
    pluginsSrc.includes('not DeepSeek Harness') && !/from ['"]@deepseek-ai\/dsh['"]/.test(pluginsSrc),
  );
  assert('merge is blocked in the dialog', /harness-merge-blocked/.test(dockSrc) && /canMerge: false/.test(pluginsSrc));
  assert('computer docks in AgentChat', /ComputerConsoleDock/.test(agentChatSrc));
  const dockAt = agentChatSrc.indexOf('<ComputerConsoleDock');
  const transAt = agentChatSrc.indexOf('data-agent-transcript');
  assert('monitor sits above transcript', dockAt > 0 && transAt > 0 && dockAt < transAt);
  assert('dock always polls', /setInterval\(\(\) => void load\(\), 900\)/.test(dockSrc));
  assert('dock shows learned chips', /computer-learned/.test(dockSrc) && /computer-monitor/.test(dockSrc));
  assert(
    'dock shows note/look/find sign keys',
    /computer-simple-keys/.test(dockSrc) &&
      /computer-key-note/.test(dockSrc) &&
      /computer-key-find/.test(dockSrc) &&
      /SignMark kind="note"/.test(dockSrc) &&
      /SignMark kind="look"/.test(dockSrc) &&
      /SignMark kind="find"/.test(dockSrc) &&
      !/>[\s]*记[\s]*</.test(dockSrc),
  );
  assert('keys have 44px tap targets', /min-h-11/.test(dockSrc) && /KEY_CLASS/.test(dockSrc));
  assert('empty 记 still queues a note', /phrase: raw \|\| 'note'/.test(dockSrc) && !/write first/.test(dockSrc));
  assert('empty 找 falls through to 看', /if \(!q\) \{\s*lookNow\(\);/.test(dockSrc) && !/type a word/.test(dockSrc));
  assert('idle monitor is blank until a task', /if \(!task\) return '';/.test(dockSrc) && !/点 看/.test(dockSrc));
  assert('POST completed clears the flash sign', /status === 'completed'\) setFlash\(''\)/.test(dockSrc));
  assert('starter chips stay before learned', /OWNER_STARTER_CHIPS : VISITOR_STARTER_CHIPS\), \.\.\.\(isOwner \? learned/.test(dockSrc));
  assert('GET tasks includes learned', /learned: listLearned\(\)/.test(tasks));
  assert('POST remembers phrase', /rememberCommand/.test(tasks) && /body.phrase/.test(tasks));
  assert('learn route exists', existsSync(join(process.cwd(), 'app/api/agent/computer/learned/route.ts')));
  assert('proof page does not mount ProofQueuePanel', !/ProofQueuePanel/.test(proofPageSrc));
  assert(
    'unlock form is KeyShield not typed secret',
    /owner-passkey-unlock/.test(unlockSrc) &&
      /prf:/.test(unlockSrc) &&
      /keyshield/.test(unlockSrc) &&
      !/type=["']password["']/.test(unlockSrc) &&
      !/OWNER_KEY/.test(unlockSrc),
  );
  assert('daily board has no owner door', !/OwnerUnlockForm/.test(dailySrc) && !/daily-owner-enter/.test(dailySrc));
  assert(
    'passkey routes exist',
    existsSync(join(process.cwd(), 'app/api/auth/passkey/options/route.ts')) &&
      existsSync(join(process.cwd(), 'app/api/auth/passkey/verify/route.ts')),
  );
  const proofStoreSrc = readFileSync(join(process.cwd(), 'lib/proofQueue/store.ts'), 'utf8');
  assert(
    'owner-door leftover seed is shipped',
    /proof-daily-owner-key/.test(proofStoreSrc) && /off the board/.test(proofStoreSrc) && /status: 'shipped'/.test(proofStoreSrc),
  );
  assert(
    'daily notes and comments seeds are shipped',
    /proof-daily-notes/.test(proofStoreSrc) &&
      /public latest/.test(proofStoreSrc) &&
      /proof-daily-comments/.test(proofStoreSrc) &&
      /on a published note/.test(proofStoreSrc),
  );
  assert('daily queue attaches next open proof', /nextOpenProof/.test(tasks));
  assert('computer dock skips shipped hung proof', /status !== 'shipped'/.test(dockSrc));
  assert('writer is owner-only', /const showWriter = owner;/.test(dailySrc) && !/on this phone until you enter/.test(dailySrc));
  const ks = readFileSync(join(process.cwd(), 'lib/keyshield/constants.ts'), 'utf8');
  const ksPrf = readFileSync(join(process.cwd(), 'lib/keyshield/prf.ts'), 'utf8');
  assert(
    'KeyShield HKDF info strings',
    ks.includes('keyshield-prf-v1:encryption-key') &&
      ks.includes('keyshield-prf-v1:vault-id') &&
      ks.includes('keyshield-prf-v1:vault-master-secret'),
  );
  assert('KeyShield AES-GCM is non-extractable', /AES-GCM[\s\S]{0,120}false,[\s\S]{0,40}\['encrypt', 'decrypt'\]/.test(ksPrf));
  assert('KeyShield PRF is 32 bytes', /PRF secret must be 32 bytes/.test(ksPrf) && /128/.test(ks));
  assert('KeyShield PRF is required', /readPrfFirst/.test(unlockSrc) && /prf:/.test(unlockSrc));
  assert('KeyShield register asks for ES256 and RS256', /alg: -7/.test(unlockSrc) && /alg: -257/.test(unlockSrc));
}

function flagUnit() {
  const snap = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    COMPUTER_PROTOTYPE: process.env.COMPUTER_PROTOTYPE,
    COMPUTER_WORKER_URL: process.env.COMPUTER_WORKER_URL,
    COMPUTER_WORKER_SECRET: process.env.COMPUTER_WORKER_SECRET,
  };
  const restore = () => {
    for (const [key, value] of Object.entries(snap)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  try {
    process.env.VERCEL_ENV = 'production';
    process.env.COMPUTER_PROTOTYPE = '1';
    delete process.env.COMPUTER_WORKER_URL;
    delete process.env.COMPUTER_WORKER_SECRET;
    assert('production without worker env is off', isComputerPrototypeEnabled() === false);
    assert('production without worker env reports missing worker', hasComputerWorkerEnv() === false);
    process.env.COMPUTER_WORKER_URL = 'https://example.workers.dev';
    process.env.COMPUTER_WORKER_SECRET = 'test-secret';
    assert('production with prototype and worker env is on', isComputerPrototypeEnabled() === true);
    process.env.COMPUTER_PROTOTYPE = '0';
    assert('production explicit off stays off', isComputerPrototypeEnabled() === false);
  } finally {
    restore();
  }
}

function unitChecks() {
  assert('hi is not a computer command', parseOwnerComputerCommand('hi') === null);
  assert('visitor hi is not a scratch command', parseVisitorComputerCommand('hi') === null);
  assert(
    'visitor git status is blocked',
    parseVisitorComputerCommand('git status')?.kind === 'blocked',
  );
  const visitorNote = parseVisitorComputerCommand('note: oat');
  assert(
    'visitor note queues scratch',
    visitorNote?.kind === 'queue_task' && visitorNote.taskType === 'write_scratch_file',
  );
  const visitorListCmd = parseVisitorComputerCommand('list');
  assert(
    'visitor list queues files_tree',
    visitorListCmd?.kind === 'queue_task' && visitorListCmd.taskType === 'files_tree',
  );
  assert(
    'visitor prepare fix is not a scratch command',
    parseVisitorComputerCommand('prepare fix for /daily owner key UI') === null,
  );
  assert('what did she write is not a computer command', parseOwnerComputerCommand('what did she write about solana?') === null);
  const daily = parseOwnerComputerCommand('prepare fix for /daily owner key UI');
  assert(
    'prepare fix /daily queues draft_daily_fix_plan',
    daily?.kind === 'queue_task' && daily.taskType === 'draft_daily_fix_plan' && daily.route === '/daily',
  );
  assert('show proof queue is fast', parseOwnerComputerCommand('show proof queue')?.kind === 'show_queue');
  assert('redact OWNER_KEY', redactSecrets('set OWNER_KEY=secret') === 'set [redacted]=secret');
  assert('prototype enabled in this verify process', isComputerPrototypeEnabled() === true, String(isComputerPrototypeEnabled()));
  assert('harness plugins exist', HARNESS_PLUGINS.length >= 4);
  assert('no plugin can merge', HARNESS_PLUGINS.every((p) => p.canMerge === false));
  assert('merge plugin is a gate', HARNESS_PLUGINS.some((p) => p.id === 'merge' && p.kind === 'merge-gate'));
  assert('KeyShield PRF salt is vault-master-secret', KS_PRF_FIRST === 'keyshield-prf-v1:vault-master-secret');
  assert('KeyShield HKDF master is encryption-key', KS_HKDF_MASTER === 'keyshield-prf-v1:encryption-key');
  assert('KeyShield HKDF vault id is vault-id', KS_HKDF_VAULT_ID === 'keyshield-prf-v1:vault-id');
  assert(
    'spoken names proof id',
    spokenQueued({ taskType: 'draft_daily_fix_plan', route: '/daily', proofItemId: 'proof-daily-notes' }).includes(
      'proof-daily-notes',
    ),
  );

  const inspected = inspectRouteFiles('/daily');
  assert(
    'inspects daily files',
    inspected.some((f) => f.path.endsWith('DailyBoard.tsx') && f.exists),
    inspected.filter((f) => !f.exists).map((f) => f.path).join(',') || 'all exist',
  );
  const plan = analyzeDailyFixPlan(inspected);
  assert('daily owner door is off the board', !plan.problemsFound.some((p) => /owner door|owner key/i.test(p)));
  assert('finds note path', plan.problemsFound.some((p) => /note/i.test(p)));
  assert('finds comment path', plan.problemsFound.some((p) => /comment/i.test(p)));
  assert('does not list merge as a step', !plan.implementationPlan.some((p) => /merge this/i.test(p)));

  const find = parseOwnerComputerCommand('find me the commit where I merged Sound Lab changes');
  assert(
    'find Sound Lab merge routes to git_find_commit',
    find?.kind === 'queue_task' && find.taskType === 'git_find_commit',
  );
  const savedNote = parseOwnerComputerCommand('note: buy oat milk');
  assert(
    'note: queues write_scratch_file',
    savedNote?.kind === 'queue_task' && savedNote.taskType === 'write_scratch_file' && savedNote.instructions === 'buy oat milk',
  );
  const findNote = parseOwnerComputerCommand('find oat');
  assert(
    'find queues workspace search',
    findNote?.kind === 'queue_task' && findNote.taskType === 'files_search' && findNote.instructions === '/workspace oat',
  );
  const recent = parseOwnerComputerCommand('show me recent sound commits');
  assert('recent sound commits routes to git_log', recent?.kind === 'queue_task' && recent.taskType === 'git_log');
  const openSound = parseOwnerComputerCommand('open the /sound file');
  assert(
    'open /sound file routes to files_open',
    openSound?.kind === 'queue_task' &&
      openSound.taskType === 'files_open' &&
      openSound.instructions.includes('app/sound/page.tsx'),
  );
  const draftMail = parseOwnerComputerCommand('draft an email to sponsor about Sound Lab');
  assert('draft email routes to email_draft', draftMail?.kind === 'queue_task' && draftMail.taskType === 'email_draft');
  const sendIt = parseOwnerComputerCommand('send it');
  assert('send it is blocked not sent', sendIt?.kind === 'blocked');
  const shots = parseOwnerComputerCommand('take screenshots of /daily mobile');
  assert('browser screenshots are blocked', shots?.kind === 'blocked');
  const patch = parseOwnerComputerCommand('draft a patch to remove owner key from /daily');
  assert('draft patch is plan-only', patch?.kind === 'queue_task' && patch.taskType === 'draft_patch');
  const ready = parseOwnerComputerCommand('mark proposal 3 ready');
  assert('mark ready asks for proof first', ready?.kind === 'clarify');
  const learn = parseOwnerComputerCommand('learn: 仓库 = git status');
  assert(
    'learn: stores alias',
    learn?.kind === 'learn' && learn.alias === '仓库' && learn.expands === 'git status',
  );
  const remembered = rememberCommand({
    alias: '仓库',
    expands: 'git status',
    taskType: 'git_status',
    instructions: 'git status --short',
    route: '/proof',
  });
  assert('remembered alias matches', matchLearned('仓库')?.taskType === 'git_status', remembered.alias);
  assert('label for git status', labelForTask('git_status', '') === 'git status');
  assert('browser tab is blocked', TAB_WIRE.browser === 'blocked');
  assert('email tab is draft-only', TAB_WIRE.email === 'draft-only');
  assert('code tab is draft-only', TAB_WIRE.code === 'draft-only');
  assert('git tab is wired', TAB_WIRE.git === 'wired');
  assert('redact OWNER_RIDDLE', redactSecrets('OWNER_RIDDLE=secret') === '[redacted]=secret');
}

async function workspaceUnit() {
  await workspaceWriteFile('owner', '/scratch/hello.txt', 'hello');
  const back = await workspaceReadFile('owner', '/scratch/hello.txt');
  assert('workspace write/read', back === 'hello');
  const probe = await workspaceRuntimeProbe();
  assert('workspace runtime probe', probe.exitCode === 0 && probe.stdout === 'ok');
  let denied = false;
  try {
    await workspaceWriteFile('owner', '/etc/passwd', 'nope');
  } catch {
    denied = true;
  }
  assert('workspace rejects non-allowlisted path', denied);
  await workspaceWriteFile('v-visitorone', '/scratch/notes/x.txt', 'visitor-secret-note');
  const visitorList = workspaceList('v-visitorone');
  assert('visitor workspace lists own files', visitorList.lines.some((l) => l.includes('scratch')));
  const visitorHit = workspaceGrep('v-visitorone', 'visitor-secret-note');
  assert('visitor workspace greps own files', visitorHit.lines.length >= 1);
  const ownerMiss = workspaceGrep('owner', 'visitor-secret-note');
  assert('owner workspace does not see visitor note', ownerMiss.lines.length === 0);
}

async function gitAndFilesUnit() {
  const status = await gitStatus();
  assert('git status runs', status.ok, status.summary);
  const found = await gitFindCommit('find me the commit where I merged Sound Lab changes');
  assert(
    'git find returns 3–5 Sound Lab candidates',
    found.ok && found.candidates.length >= 3 && found.candidates.length <= 5,
    `${found.candidates.length} ${found.summary}`,
  );
  assert(
    'candidates have hash date message',
    found.candidates.every((c) => /^[0-9a-f]{7,40}$/i.test(c.hash) && c.date && c.message),
  );
  assert(
    'a candidate looks like a Sound Lab merge or revert',
    found.candidates.some((c) => /merge|revert/i.test(c.message) && /sound/i.test(c.message)),
    found.lines.slice(0, 3).join(' | '),
  );
  const env = filesOpen('.env.local');
  assert('files open blocks .env', env.ok === false && /blocked/i.test(env.summary), env.summary);
  const secret = filesOpen('id_rsa');
  assert('files open blocks private key name', secret.ok === false, secret.summary);
  const sound = filesOpen('aileena-new/app/sound/page.tsx');
  assert('files open sound page read-only', sound.ok === true && /read-only/.test(sound.summary), sound.summary);
}

async function keyshieldUnit() {
  const noisy = new Uint8Array([0, 1, 0xfb, 0xff, 0x2b, 0x2f, 255, 10, 13, 61]);
  const round = bytesFromB64url(b64urlFromBytes(noisy));
  assert(
    'base64url round-trips slash and plus bytes',
    round.length === noisy.length && round.every((b, i) => b === noisy[i]),
  );

  let shortRejected = false;
  try {
    await deriveKeyshield(new Uint8Array(16));
  } catch {
    shortRejected = true;
  }
  assert('KeyShield rejects non-32-byte PRF', shortRejected);

  const { aes, vaultId } = await deriveKeyshield(new Uint8Array(32).fill(0xaa));
  assert('KeyShield vault id pin (PRF 0xaa)', vaultId === 'nHXL0jBaJxwIGSdMau45Rw', vaultId);
  const seal = await sealOwner(aes);
  assert('KeyShield owner seal round-trips', await openOwnerSeal(aes, seal.iv, seal.cipher));
  const other = await deriveKeyshield(new Uint8Array(32).fill(0xbb));
  assert('KeyShield cross-PRF seal fails', (await openOwnerSeal(other.aes, seal.iv, seal.cipher)) === false);
}

async function postOwnerTask(base: string, cookie: string, body: Record<string, unknown>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${base}/api/agent/computer/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(body),
    });
    if (res.status !== 429) return res;
    const waitSec = Math.min(Number(res.headers.get('Retry-After') || 8) + 1, 25);
    await new Promise((r) => setTimeout(r, waitSec * 1000));
  }
  return fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
}

async function pollTask(base: string, cookie: string, id: string) {
  const started = Date.now();
  while (Date.now() - started < 45_000) {
    const res = await fetch(`${base}/api/agent/computer/tasks/${id}`, { headers: { Cookie: cookie } });
    if (!res.ok) return { ok: false as const, status: res.status };
    const body = (await res.json()) as {
      status?: string;
      task?: {
        status?: string;
        filesInspected?: string[];
        artifacts?: { kind?: string; preview?: string }[];
        proofItemId?: string;
        resultSummary?: string;
      };
      proofItem?: { status?: string; computerTaskIds?: string[]; resultSummary?: string; id?: string };
    };
    const st = body.task?.status || body.status;
    if (st === 'completed' || st === 'failed' || st === 'blocked') return { ok: true as const, body, st };
    await new Promise((r) => setTimeout(r, 250));
  }
  return { ok: false as const, status: 'timeout' };
}

function cookieJar(res: Response): string {
  const hdrs = res.headers as Headers & { getSetCookie?: () => string[] };
  const list = typeof hdrs.getSetCookie === 'function' ? hdrs.getSetCookie() : [];
  if (list.length) return list.map((c) => c.split(';')[0] || '').filter(Boolean).join('; ');
  const one = res.headers.get('set-cookie');
  return one ? one.split(';')[0] : '';
}

async function liveHttp() {
  const base = (process.env.VERIFY_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    assert('live HTTP', true, 'skipped (set VERIFY_BASE_URL)');
    return;
  }

  const page = await fetch(`${base}/proof`);
  const html = page.ok ? await page.text() : '';
  assert('GET /proof', page.ok, String(page.status));
  assert(
    'visitor /proof shows KeyShield door',
    html.includes('owner-passkey-unlock') && /keyshield/i.test(html),
  );
  assert('visitor /proof does not name typed owner secret', !/owner key/i.test(html));
  assert('visitor /proof hides queue panel', !html.includes('proof-queue-daily') && !html.includes('proof-queue-panel'));
  assert('local experiment enter is offered', html.includes('proof-experiment-enter') || html.includes('enter local experiment'));

  const opt = await fetch(`${base}/api/auth/passkey/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'unlock' }),
  });
  const optJson = opt.ok
    ? ((await opt.json()) as { method?: string; prfFirst?: string })
    : {};
  assert('passkey options method is keyshield', optJson.method === 'keyshield', String(optJson.method));
  assert(
    'passkey options PRF salt is KeyShield vault-master-secret',
    optJson.prfFirst === 'keyshield-prf-v1:vault-master-secret',
    String(optJson.prfFirst),
  );

  const expGet = await fetch(`${base}/api/auth/owner/experiment`);
  assert('GET experiment unlock → 404', expGet.status === 404, String(expGet.status));

  const forbidden = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType: 'draft_daily_fix_plan', route: '/daily' }),
  });
  assert('visitor POST computer tasks → 403', forbidden.status === 403, String(forbidden.status));

  const visitorGet = await fetch(`${base}/api/agent/computer/tasks`);
  assert('visitor GET computer tasks → 200', visitorGet.status === 200, String(visitorGet.status));
  const visitorGetJson = visitorGet.ok
    ? ((await visitorGet.json()) as {
        actor?: string;
        cloudflareComputer?: boolean;
        learned?: unknown[];
        proof?: unknown[];
        harness?: string;
      })
    : {};
  assert('visitor GET is scratch actor', visitorGetJson.actor === 'visitor', String(visitorGetJson.actor));
  assert('visitor GET has no learned aliases', Array.isArray(visitorGetJson.learned) && visitorGetJson.learned.length === 0);
  assert('visitor GET has no proof queue', Array.isArray(visitorGetJson.proof) && visitorGetJson.proof.length === 0);
  if (process.env.COMPUTER_WORKER_URL && process.env.COMPUTER_WORKER_SECRET) {
    assert(
      'visitor GET reports worker-shell when Worker env is set',
      visitorGetJson.cloudflareComputer === true,
      String(visitorGetJson.cloudflareComputer),
    );
  } else {
    assert('visitor GET is not worker-shell', visitorGetJson.cloudflareComputer === false);
  }

  const visitorCookie = cookieJar(visitorGet);
  assert('visitor GET mints workspace cookie', /__aileena_cwid=v-/.test(visitorCookie), visitorCookie.slice(0, 80));

  const visitorScratch = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({ taskType: 'write_scratch_file', route: '/proof', instructions: 'visitor-isolation-note' }),
  });
  assert('visitor POST write_scratch_file → 202', visitorScratch.status === 202, String(visitorScratch.status));
  const visitorScratchJson = visitorScratch.status === 202
    ? ((await visitorScratch.json()) as {
        task?: { id?: string; actorId?: string; status?: string; backend?: string };
        proofItem?: unknown;
      })
    : {};
  assert('visitor scratch has no proof item', visitorScratchJson.proofItem == null);
  if (process.env.COMPUTER_WORKER_URL && process.env.COMPUTER_WORKER_SECRET) {
    assert(
      'visitor note POST returns completed on worker-shell (not left queued)',
      visitorScratchJson.task?.status === 'completed',
      `${visitorScratchJson.task?.status ?? 'missing'} backend=${visitorScratchJson.task?.backend ?? ''}`,
    );
  }
  const visitorScratchId = visitorScratchJson.task?.id || '';
  const visitorScratchDone = visitorScratchId
    ? await pollTask(base, visitorCookie, visitorScratchId)
    : { ok: false as const, status: visitorScratch.status };
  assert(
    'visitor scratch completed',
    visitorScratchDone.ok && visitorScratchDone.st === 'completed',
    String(visitorScratchDone.ok ? visitorScratchDone.st : visitorScratchDone.status),
  );

  if (process.env.COMPUTER_WORKER_URL && process.env.COMPUTER_WORKER_SECRET) {
    // Monthly reset (lazy 30d TTL): plant an expired .born, run one visitor
    // task, then confirm the old note is gone and .born was re-stamped.
    const workerBase = process.env.COMPUTER_WORKER_URL.replace(/\/$/, '');
    const bearer = { Authorization: `Bearer ${process.env.COMPUTER_WORKER_SECRET}` };
    const cwid = (visitorCookie.match(/__aileena_cwid=(v-[a-z0-9]+)/) || [])[1] || '';
    assert('visitor cwid extracted for reset test', cwid.length > 0, visitorCookie.slice(0, 60));
    const day = new Date().toISOString().slice(0, 10);
    const notePath = `/c/${cwid}/file/workspace/scratch/notes/${day}.txt`;
    const bornPath = `/c/${cwid}/file/workspace/scratch/.born`;
    const noteBefore = await fetch(`${workerBase}${notePath}`, { headers: bearer });
    assert('visitor note exists before reset', noteBefore.status === 200, String(noteBefore.status));
    const planted = '2020-01-01T00:00:00.000Z';
    const plant = await fetch(`${workerBase}${bornPath}`, { method: 'PUT', headers: bearer, body: planted });
    assert('expired .born planted', plant.status === 204, String(plant.status));
    const resetKick = await fetch(`${base}/api/agent/computer/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
      body: JSON.stringify({ taskType: 'files_tree', route: '/proof', instructions: '/workspace' }),
    });
    assert('visitor files_tree after expiry → 202', resetKick.status === 202, String(resetKick.status));
    const resetKickJson = resetKick.status === 202
      ? ((await resetKick.json()) as { task?: { id?: string; status?: string } })
      : {};
    assert(
      'visitor 看 POST returns completed on worker-shell (not left queued)',
      resetKickJson.task?.status === 'completed',
      String(resetKickJson.task?.status),
    );
    const resetTaskId = resetKickJson.task?.id || '';
    const resetDone = resetTaskId ? await pollTask(base, visitorCookie, resetTaskId) : { ok: false as const, status: resetKick.status };
    assert('visitor task after expiry completed', resetDone.ok && resetDone.st === 'completed', String(resetDone.ok ? resetDone.st : resetDone.status));
    const noteAfter = await fetch(`${workerBase}${notePath}`, { headers: bearer });
    assert('monthly reset wiped the old visitor note', noteAfter.status === 404, String(noteAfter.status));
    const bornAfter = await fetch(`${workerBase}${bornPath}`, { headers: bearer });
    const bornAfterText = bornAfter.ok ? (await bornAfter.text()).trim() : '';
    assert(
      'monthly reset re-stamped .born',
      bornAfter.status === 200 && Date.parse(bornAfterText) > Date.parse(planted),
      bornAfterText.slice(0, 40),
    );
  }

  const otherVisitor = await fetch(`${base}/api/agent/computer/tasks`);
  const otherCookie = cookieJar(otherVisitor);
  const otherList = otherVisitor.ok
    ? ((await otherVisitor.json()) as { tasks?: { id?: string }[] })
    : { tasks: [] };
  assert(
    'other visitor does not see first visitor task',
    !(otherList.tasks || []).some((t) => t.id === visitorScratchId),
    otherCookie.slice(0, 40),
  );

  const visitorOpen = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: visitorCookie },
    body: JSON.stringify({ taskType: 'files_open', instructions: 'aileena-new/app/sound/page.tsx' }),
  });
  assert('visitor POST files_open → 403', visitorOpen.status === 403, String(visitorOpen.status));

  const visitorGit = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType: 'git_find_commit', instructions: 'find me the commit where I merged Sound Lab changes' }),
  });
  assert('visitor POST git_find_commit → 403', visitorGit.status === 403, String(visitorGit.status));

  const visitorProof = await fetch(`${base}/api/agent/proof`);
  assert('visitor GET proof → 403', visitorProof.status === 403, String(visitorProof.status));

  const shell = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType: 'draft_daily_fix_plan', command: 'rm -rf /' }),
  });
  assert(
    'shell field rejected (visitor or 400/403)',
    shell.status === 403 || shell.status === 400,
    String(shell.status),
  );

  const token = await createOwnerSession();
  const cookie = `${SESSION_COOKIE}=${token}`;

  const ownerProof = await fetch(`${base}/proof`, { headers: { Cookie: cookie } });
  const ownerProofHtml = ownerProof.ok ? await ownerProof.text() : '';
  assert(
    'owner /proof is signpost not panel',
    ownerProofHtml.includes('proof-console-signpost') && !ownerProofHtml.includes('proof-queue-panel'),
    String(ownerProof.status),
  );

  const listed = await fetch(`${base}/api/agent/computer/tasks`, { headers: { Cookie: cookie } });
  const listedJson = listed.ok
    ? ((await listed.json()) as {
        plugins?: unknown[];
        deepSeekHarness?: boolean;
        tasks?: { id?: string }[];
        cloudflareComputer?: boolean;
      })
    : {};
  assert('owner GET lists plugins', Array.isArray(listedJson.plugins) && (listedJson.plugins?.length ?? 0) >= 4);
  assert('owner GET says not dsh', listedJson.deepSeekHarness === false, String(listedJson.deepSeekHarness));
  assert(
    'owner GET hides visitor tasks',
    !(listedJson.tasks || []).some((t) => t.id === visitorScratchId),
  );
  if (process.env.COMPUTER_WORKER_URL && process.env.COMPUTER_WORKER_SECRET) {
    const cfListed = listed.ok ? ((listedJson as { cloudflareComputer?: boolean }).cloudflareComputer) : false;
    assert('owner GET reports cloudflareComputer when Worker env is set', cfListed === true, String(cfListed));
  }

  const ownerShell = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ taskType: 'draft_daily_fix_plan', command: 'ls', exec: 'whoami' }),
  });
  assert('owner arbitrary shell → 400', ownerShell.status === 400, String(ownerShell.status));

  const created = await postOwnerTask(base, cookie, {
    taskType: 'draft_daily_fix_plan',
    route: '/daily',
    instructions: 'prepare fix for /daily owner key UI',
  });
  assert('owner POST queues 202', created.status === 202, String(created.status));
  const createdJson = created.ok || created.status === 202 ? ((await created.json()) as {
    message?: string;
    spoken?: string;
    task?: { id?: string };
    proofItem?: { id?: string; status?: string };
  }) : {};
  assert('immediate ⚡ queued.', createdJson.message === '⚡ queued.', createdJson.message);
  assert(
    'spoken names proof and work',
    Boolean(createdJson.spoken?.includes('queued') && createdJson.spoken?.includes('proof')),
    createdJson.spoken?.slice(0, 180),
  );
  assert(
    'queue hangs on a new open proof not a shipped daily leftover',
    Boolean(createdJson.spoken && /proof-/.test(createdJson.spoken)) &&
      createdJson.proofItem?.id !== 'proof-daily-owner-key' &&
      createdJson.proofItem?.id !== 'proof-daily-notes' &&
      createdJson.proofItem?.id !== 'proof-daily-comments' &&
      !/owner door leftover/.test(createdJson.spoken || ''),
    `${createdJson.proofItem?.id ?? ''} ${createdJson.spoken?.slice(0, 180) ?? ''}`,
  );
  const taskId = createdJson.task?.id || '';
  assert('task id returned', Boolean(taskId), taskId);

  const polled = await pollTask(base, cookie, taskId);
  assert('task completed', polled.ok && polled.st === 'completed', String(polled.ok ? polled.st : polled.status));
  if (polled.ok) {
    const files = polled.body.task?.filesInspected ?? [];
    assert('inspected DailyBoard', files.some((f) => f.includes('DailyBoard.tsx')));
    assert('has artifact report', Array.isArray(polled.body.task?.artifacts) && (polled.body.task?.artifacts?.length ?? 0) > 0);
    assert(
      'proof attached',
      Boolean(polled.body.proofItem?.computerTaskIds?.includes(taskId)),
    );
    assert(
      'proof needs_screenshots or ready_for_review',
      polled.body.proofItem?.status === 'needs_screenshots' || polled.body.proofItem?.status === 'ready_for_review',
      polled.body.proofItem?.status,
    );
  }

  const scratch = await postOwnerTask(base, cookie, { taskType: 'write_scratch_file', route: '/proof' });
  const scratchJson = scratch.status === 202 ? ((await scratch.json()) as { task?: { id?: string } }) : {};
  const scratchId = scratchJson.task?.id || '';
  const scratchDone = scratchId ? await pollTask(base, cookie, scratchId) : { ok: false as const, status: scratch.status };
  assert('scratch task completed', scratchDone.ok && scratchDone.st === 'completed', String(scratchDone.ok ? scratchDone.st : scratchDone.status));

  const gitFind = await postOwnerTask(base, cookie, {
    taskType: 'git_find_commit',
    route: '/sound',
    instructions: 'find me the commit where I merged Sound Lab changes',
  });
  assert('owner git_find_commit queues 202', gitFind.status === 202, String(gitFind.status));
  const gitJson = gitFind.status === 202 ? ((await gitFind.json()) as { task?: { id?: string }; proofItem?: { id?: string } }) : {};
  assert(
    'git find hangs on Sound Lab rollback proof',
    gitJson.proofItem?.id === 'proof-sound-lab-rollback',
    gitJson.proofItem?.id,
  );
  const gitId = gitJson.task?.id || '';
  const gitDone = gitId ? await pollTask(base, cookie, gitId) : { ok: false as const, status: gitFind.status };
  assert('git find completed', gitDone.ok && gitDone.st === 'completed', String(gitDone.ok ? gitDone.st : gitDone.status));
  if (gitDone.ok) {
    const preview = gitDone.body.task?.artifacts?.find((a) => a.kind === 'git')?.preview || gitDone.body.task?.resultSummary || '';
    const n = preview.split('\n').filter((line) => /^[0-9a-f]{7,40}\s/i.test(line) || /^[0-9a-f]{7,40} \|/i.test(line)).length;
    assert('live git find returned 3–5 candidates', n >= 3 && n <= 5, String(n));
    assert(
      'live proof attached',
      Boolean(gitDone.body.proofItem?.computerTaskIds?.includes(gitId)),
      String(gitDone.body.proofItem?.computerTaskIds),
    );
  }

  const envOpen = await postOwnerTask(base, cookie, { taskType: 'files_open', instructions: '.env.local' });
  const envJson = envOpen.status === 202 ? ((await envOpen.json()) as { task?: { id?: string } }) : {};
  const envDone = envJson.task?.id
    ? await pollTask(base, cookie, envJson.task.id)
    : { ok: false as const, status: envOpen.status };
  assert(
    'owner .env open is blocked',
    envDone.ok && envDone.st === 'blocked',
    String(envDone.ok ? envDone.st : envDone.status),
  );

  const browser = await postOwnerTask(base, cookie, { taskType: 'browser_screenshot', route: '/daily' });
  const browserJson = browser.status === 202 ? ((await browser.json()) as { task?: { id?: string } }) : {};
  const browserDone = browserJson.task?.id
    ? await pollTask(base, cookie, browserJson.task.id)
    : { ok: false as const, status: browser.status };
  assert(
    'browser screenshot task is blocked',
    browserDone.ok && browserDone.st === 'blocked',
    String(browserDone.ok ? browserDone.st : browserDone.status),
  );

  const send = await postOwnerTask(base, cookie, { taskType: 'email_send', instructions: 'send it' });
  const sendJson = send.status === 202 ? ((await send.json()) as { task?: { id?: string } }) : {};
  const sendDone = sendJson.task?.id ? await pollTask(base, cookie, sendJson.task.id) : { ok: false as const, status: send.status };
  assert('email send task is blocked', sendDone.ok && sendDone.st === 'blocked', String(sendDone.ok ? sendDone.st : sendDone.status));

  const chat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      agentMode: 'public',
      messages: [
        {
          id: 'u1',
          role: 'user',
          parts: [{ type: 'text', text: 'prepare fix for /daily owner key UI' }],
        },
      ],
    }),
  });
  assert('owner chat fast path 200', chat.ok, String(chat.status));
  assert(
    'owner chat X-Computer-Fast-Path',
    chat.headers.get('x-computer-fast-path') === '1',
    chat.headers.get('x-computer-fast-path') ?? 'missing',
  );
  const chatText = await chat.text();
  assert('owner chat says queued', /queued/i.test(chatText), chatText.slice(0, 180));
  assert('owner chat names proof', /proof/i.test(chatText), chatText.slice(0, 220));

  const visitorChat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentMode: 'public',
      messages: [
        {
          id: 'u2',
          role: 'user',
          parts: [{ type: 'text', text: 'prepare fix for /daily owner key UI' }],
        },
      ],
    }),
  });
  assert(
    'visitor chat is not computer fast path',
    visitorChat.headers.get('x-computer-fast-path') !== '1',
    visitorChat.headers.get('x-computer-fast-path') ?? 'none',
  );

  const visitorNoteChat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentMode: 'public',
      messages: [
        {
          id: 'u3',
          role: 'user',
          parts: [{ type: 'text', text: 'note: visitor chat scratch' }],
        },
      ],
    }),
  });
  assert('visitor note chat is computer fast path', visitorNoteChat.headers.get('x-computer-fast-path') === '1');
  const visitorNoteText = await visitorNoteChat.text();
  assert('visitor note chat says queued', /queued/i.test(visitorNoteText), visitorNoteText.slice(0, 180));
}

async function main() {
  loadEnvLocal();
  if (!process.env.COMPUTER_PROTOTYPE) process.env.COMPUTER_PROTOTYPE = '1';
  sourceChecks();
  flagUnit();
  unitChecks();
  await keyshieldUnit();
  await workspaceUnit();
  await gitAndFilesUnit();
  await liveHttp();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
