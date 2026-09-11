import { spawn } from 'node:child_process';
import { join } from 'node:path';
import {
  ALLOWED_CHECK_COMMANDS,
  COMPUTER_LIMITS,
  curlFetchCommand,
  curlHttpsTarget,
  fetchScratchName,
} from './allowlist';
import { analyzeDailyFixPlan, inspectRouteFiles } from './inspect';
import { clip, redactSecrets } from './redact';
import { getComputerTask, isOwnerComputerTask, nowIso, taskActorId, upsertComputerTask } from './store';
import type { ComputerArtifact, ComputerTask, ComputerTaskStatus } from './types';
import {
  parsePeekSelector,
  workspaceGrep,
  workspaceList,
  workspacePickNote,
  workspaceReadFile,
  workspaceRuntimeProbe,
  workspaceWriteFile,
} from './workspace';
import {
  attachComputerFinding,
  attachTaskToProof,
  ensureProofItem,
  getProofItem,
  SOUND_LAB_ROLLBACK_PROOF_ID,
  upsertProofItem,
} from '../proofQueue/store';
import type { ProofStatus } from '../proofQueue/types';
import {
  formatCandidates,
  gitDiffStat,
  gitFindCommit,
  gitLog,
  gitShow,
  gitStatus,
  type GitInspectResult,
} from './gitAllowlist';
import { filesOpen, filesSearch, filesTree, type FileInspectResult } from './filesAllowlist';
import {
  cfExec,
  cfGetFile,
  cfPutFile,
  isCloudflareComputerReady,
  isWorkspaceIntent,
  reportedBackend,
  toWorkspacePath,
  workspaceSearchQuery,
} from './cfClient';
import type { ComputerBackend } from './cfClient';

function workspaceIdFor(task: ComputerTask): string {
  return taskActorId(task);
}

function taskBackend(): ComputerBackend {
  return reportedBackend();
}

async function ensureCfMount(name: string): Promise<void> {
  await cfExec('mkdir -p scratch reports artifacts', '/workspace', name);
}

/**
 * Visitor scratch pads reset monthly (lazy TTL, checked on next use).
 * The owner workspace is never wiped. No cron, no DO registry: Durable Objects
 * created via idFromName cannot be enumerated, so expiry runs per workspace.
 */
const VISITOR_SCRATCH_TTL_DAYS = 30;
const VISITOR_BORN_PATH = '/workspace/scratch/.born';

async function ensureVisitorScratchFresh(name: string): Promise<'kept' | 'reset'> {
  await ensureCfMount(name);
  let bornMs = Number.NaN;
  try {
    bornMs = Date.parse((await cfGetFile(VISITOR_BORN_PATH, name)).trim());
  } catch {
    /* first visit — stamp below */
  }
  const ttlMs = VISITOR_SCRATCH_TTL_DAYS * 24 * 60 * 60 * 1000;
  if (Number.isFinite(bornMs) && Date.now() - bornMs < ttlMs) return 'kept';
  let wiped = false;
  if (Number.isFinite(bornMs)) {
    const { stdout } = await cfExec('ls -1 /workspace/scratch', '/workspace', name);
    const entries = stdout
      .split('\n')
      .map((l) => l.trim())
      .filter((e) => /^[\w][\w.-]*$/.test(e))
      .slice(0, 50);
    for (const entry of entries) {
      await cfExec(`rm -r /workspace/scratch/${entry}`, '/workspace', name);
    }
    wiped = entries.length > 0;
  }
  await cfPutFile(VISITOR_BORN_PATH, nowIso(), name);
  return wiped ? 'reset' : 'kept';
}

async function log(task: ComputerTask, line: string): Promise<ComputerTask> {
  const next = {
    ...task,
    logsRedacted: [...task.logsRedacted, redactSecrets(clip(line, 400))].slice(-40),
    updatedAt: nowIso(),
  };
  return upsertComputerTask(next);
}

function artifact(
  kind: ComputerArtifact['kind'],
  path: string,
  title: string,
  body: string,
): ComputerArtifact {
  const preview = redactSecrets(clip(body, COMPUTER_LIMITS.maxArtifactPreviewChars));
  return {
    id: path.replace(/[^\w.-]+/g, '-').slice(0, 48),
    kind,
    path,
    title,
    bytes: Buffer.byteLength(body),
    preview,
  };
}

async function runAllowlistedCheck(): Promise<{ ok: boolean; summary: string }> {
  const spec = ALLOWED_CHECK_COMMANDS['echo-ok'];
  return new Promise((resolve) => {
    const child = spawn(spec.argv[0], spec.argv.slice(1), {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: process.env.HOME ?? '',
        NODE_ENV: process.env.NODE_ENV ?? 'development',
      } as NodeJS.ProcessEnv,
      timeout: 8000,
    });
    let out = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
    });
    child.stderr?.on('data', (d) => {
      out += String(d);
    });
    child.on('error', (err) => {
      resolve({ ok: false, summary: redactSecrets(err.message) });
    });
    child.on('close', (code) => {
      const stdout = redactSecrets(out).trim();
      resolve({ ok: code === 0 && stdout === 'ok', summary: `${spec.label}: exit ${code} stdout=${stdout || '(empty)'}` });
    });
  });
}

function nextProofStatus(task: ComputerTask): ProofStatus {
  if (task.status === 'failed') return 'observed';
  if (task.taskType === 'write_scratch_file') return 'ready_for_review';
  return 'needs_screenshots';
}

function token(instructions: string, key: string): string | undefined {
  const m = new RegExp(`\\b${key}:(\\S+)`, 'i').exec(instructions);
  return m?.[1];
}

function parseEmailDraft(instructions: string): { to: string; subject: string; body: string } {
  const toAbout = /draft (?:an )?email to (.+?) about (.+)$/i.exec(instructions.trim());
  if (toAbout) {
    const to = clip(toAbout[1], 120);
    const subject = clip(toAbout[2], 160);
    return {
      to,
      subject,
      body: `Draft only. Not sent.\n\nTo: ${to}\nSubject: ${subject}\n\n${clip(instructions, 1500)}`,
    };
  }
  return {
    to: '(unspecified)',
    subject: clip(instructions, 80) || 'draft',
    body: `Draft only. Not sent.\n\n${clip(instructions, 1500)}`,
  };
}

async function finishInspectStyle(
  task: ComputerTask,
  opts: {
    status: ComputerTaskStatus;
    summary: string;
    report: string;
    preview: string;
    title: string;
    kind: ComputerArtifact['kind'];
    filesInspected?: string[];
    problemsFound?: string[];
    risksBlockers?: string[];
    error?: string | null;
  },
): Promise<ComputerTask> {
  const reportPath = isCloudflareComputerReady()
    ? `/workspace/reports/${task.id}.md`
    : `/reports/${task.id}.md`;
  if (isCloudflareComputerReady()) {
    await cfPutFile(reportPath, opts.report, workspaceIdFor(task));
  } else {
    await workspaceWriteFile(workspaceIdFor(task), reportPath, opts.report);
  }
  return upsertComputerTask({
    ...task,
    status: opts.status,
    resultSummary: clip(opts.summary, 2000),
    filesInspected: opts.filesInspected ?? task.filesInspected,
    problemsFound: opts.problemsFound ?? [],
    risksBlockers: opts.risksBlockers ?? [],
    artifacts: [artifact(opts.kind, reportPath, opts.title, opts.preview)],
    completedAt: nowIso(),
    updatedAt: nowIso(),
    error: opts.error ?? null,
  });
}

async function runGitTask(task: ComputerTask): Promise<ComputerTask> {
  let result: GitInspectResult;
  if (task.taskType === 'git_status') {
    task = await log(task, 'git status --short (inspect only)');
    result = await gitStatus();
  } else if (task.taskType === 'git_log') {
    task = await log(task, 'git log inspect (no mutation)');
    result = await gitLog({
      n: 50,
      since: token(task.instructions, 'since'),
      until: token(task.instructions, 'until'),
      path: token(task.instructions, 'path'),
      grep: token(task.instructions, 'grep'),
      merges: /\bmerges?:true\b/i.test(task.instructions),
    });
  } else if (task.taskType === 'git_show') {
    const diff = /\bdiff\s+([0-9a-f]{7,40})\s+([0-9a-f]{7,40})\b/i.exec(task.instructions);
    if (diff) {
      task = await log(task, `git diff --stat ${diff[1]}..${diff[2]}`);
      result = await gitDiffStat(diff[1], diff[2]);
    } else {
      const hash = (task.instructions.match(/[0-9a-f]{7,40}/i) || [])[0] || '';
      task = await log(task, `git show --stat ${hash || '(missing hash)'}`);
      result = await gitShow(hash);
    }
  } else {
    task = await log(task, 'git find commit (inspect only, no checkout)');
    result = await gitFindCommit(task.instructions);
  }

  const body = [
    `# ${task.taskType}`,
    '',
    result.summary,
    '',
    formatCandidates(result),
    '',
    ...result.lines,
    '',
    '## merge',
    '- not requested. not performed. owner approval still required.',
  ].join('\n');

  const preview = result.candidates.length ? formatCandidates(result) : result.lines.join('\n');
  const status: ComputerTaskStatus = result.ok ? 'completed' : 'failed';
  const next = await finishInspectStyle(task, {
    status,
    summary: result.candidates.length ? formatCandidates(result) : result.summary,
    report: body,
    preview,
    title: result.action,
    kind: 'git',
    filesInspected: result.candidates.flatMap((c) => c.soundFiles).slice(0, 12),
    problemsFound: result.ok ? [] : [result.summary],
    risksBlockers: ['Inspect only. No reset, clean, push, merge, or checkout.'],
    error: result.ok ? null : result.summary,
  });
  const logged = await log(next, result.ok ? `completed ${result.action}; repo unmodified` : `git ${result.action} failed`);

  if (task.taskType === 'git_find_commit' && result.candidates.length) {
    const proof = ensureProofItem({
      id: SOUND_LAB_ROLLBACK_PROOF_ID,
      title: 'Sound Lab rollback investigation',
      route: '/sound',
      problem:
        'Find the commit where Sound Lab changes were merged. Inspection only. No checkout, no reset, no merge.',
      proposedChange: 'Report candidate commits. Do not roll back until the owner approves a separate task.',
      source: 'computer',
      status: 'in_progress',
      risk: 'medium',
      acceptanceCriteria: [
        'Git find returns 3–5 candidates',
        'No repo mutation',
        'Owner reviews before any rollback',
      ],
      screenshots: [],
      filesChanged: [],
      checksRun: [],
      computerTaskIds: [],
      resultSummary: '',
    });
    attachComputerFinding(proof.id, {
      computerTaskId: logged.id,
      summary: formatCandidates(result),
      extraFiles: result.candidates.flatMap((c) => c.soundFiles).slice(0, 8),
    });
  }

  return logged;
}

async function runOwnerFetch(task: ComputerTask, url: string): Promise<ComputerTask> {
  const name = workspaceIdFor(task);
  await ensureCfMount(name);
  await cfExec('mkdir -p scratch/fetch', '/workspace', name);
  const cmd = curlFetchCommand(url);
  task = await log(task, `$ ${cmd}`);
  const run = await cfExec(cmd, '/workspace', name);
  const raw = [run.stdout, run.stderr].filter(Boolean).join('\n');
  if (run.exitCode !== 0) {
    return finishInspectStyle(task, {
      status: 'failed',
      summary: `exit ${run.exitCode}`,
      report: `# shell_exec\n\n$ ${cmd}\nexit ${run.exitCode}\n\n${raw}`,
      preview: raw || `exit ${run.exitCode}`,
      title: url.slice(0, 40),
      kind: 'report',
      error: run.stderr || `exit ${run.exitCode}`,
    });
  }
  const body = clip(run.stdout || '', COMPUTER_LIMITS.workspaceFileBytes);
  const file = `/workspace/scratch/fetch/${fetchScratchName(url)}`;
  const rel = file.replace(/^\/workspace\//, '');
  await cfPutFile(file, body, name);
  const trimmed = body.trim();
  let extra = '';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const keys = await cfExec(`jq 'if type=="object" then keys else type end' ${shellWord(rel)}`, '/workspace', name);
    extra = keys.stdout.trim() ? `\n── jq ──\n${keys.stdout.trim()}` : '';
  } else if (/<!DOCTYPE html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    const mdPath = file.replace(/\.txt$/i, '.md');
    const mdRel = mdPath.replace(/^\/workspace\//, '');
    const md = await cfExec(`html-to-markdown ${shellWord(rel)}`, '/workspace', name);
    if (md.exitCode === 0 && md.stdout.trim()) {
      await cfPutFile(mdPath, clip(md.stdout, COMPUTER_LIMITS.workspaceFileBytes), name);
      extra = `\n── md ──\n${clip(md.stdout.trim(), 800)}\n${mdRel}`;
    }
  }
  const preview = `${file}\n${clip(body, 1200)}${extra}`;
  return finishInspectStyle(task, {
    status: 'completed',
    summary: file,
    report: `# shell_exec\n\n$ ${cmd}\n${file}\n\n${body}${extra}`,
    preview,
    title: file.split('/').pop() || 'fetch',
    kind: 'scratch',
    filesInspected: [file],
  });
}

async function runShellTask(task: ComputerTask): Promise<ComputerTask> {
  const cmd = (task.instructions || '').trim().slice(0, 2000);
  if (!cmd) {
    return finishInspectStyle(task, {
      status: 'failed',
      summary: '⚡ empty command.',
      report: '# shell_exec\n\nEmpty.\n',
      preview: 'empty command',
      title: 'shell',
      kind: 'report',
      error: 'empty command',
    });
  }
  if (!isCloudflareComputerReady()) {
    return finishInspectStyle(task, {
      status: 'blocked',
      summary: '⚡ needs worker-shell.',
      report: '# shell_exec\n\nLocal shim is not the computer. Set COMPUTER_WORKER_URL.\n',
      preview: 'needs worker-shell',
      title: 'shell',
      kind: 'report',
      error: 'needs worker-shell',
    });
  }
  const target = curlHttpsTarget(cmd);
  if (target && !target.head) return runOwnerFetch(task, target.url);
  const name = workspaceIdFor(task);
  await ensureCfMount(name);
  task = await log(task, `$ ${cmd}`);
  const run = await cfExec(cmd, '/workspace', name);
  const text = [run.stdout, run.stderr].filter(Boolean).join('\n');
  const ok = run.exitCode === 0;
  return finishInspectStyle(task, {
    status: ok ? 'completed' : 'failed',
    summary: ok ? `$ ${cmd}` : `exit ${run.exitCode}`,
    report: `# shell_exec\n\n$ ${cmd}\nexit ${run.exitCode}\n\n${text}`,
    preview: text || `exit ${run.exitCode}`,
    title: cmd.slice(0, 40),
    kind: 'report',
    error: ok ? null : run.stderr || `exit ${run.exitCode}`,
  });
}

async function runScratchTask(task: ComputerTask): Promise<ComputerTask> {
  const backend = taskBackend();
  const name = workspaceIdFor(task);
  const note = scratchPayload(task, backend);
  if (backend === 'cloudflare-worker-shell') {
    await ensureCfMount(name);
    task = await log(task, `write ${note.cfPath} on worker-shell`);
    let body = note.body;
    if (note.append) {
      try {
        const existing = await cfGetFile(note.cfPath, name);
        body = `${existing}${note.body}`;
      } catch {
        /* new file */
      }
    }
    await cfPutFile(note.cfPath, body, name);
    const readBack = await cfGetFile(note.cfPath, name);
    const probe = await cfExec('echo ok', '/workspace', name);
    const report = [
      '# write_scratch_file',
      '',
      `backend: cloudflare-worker-shell`,
      `wrote: ${note.cfPath} (${body.length} chars)`,
      `read back: ${JSON.stringify(readBack.slice(-400))}`,
      `runtime probe: ${probe.stdout} exit=${probe.exitCode}`,
      '',
      'Workspace is a Cloudflare Durable Object (worker-shell).',
    ].join('\n');
    await cfPutFile(`/workspace/reports/${task.id}.md`, report, name);
    task = await upsertComputerTask({
      ...task,
      backend,
      status: 'completed',
      resultSummary: note.append ? 'Note saved on Cloudflare Computer.' : 'Scratch file wrote on Cloudflare Computer and read back.',
      filesInspected: [note.cfPath],
      artifacts: [
        artifact('scratch', note.cfPath, note.cfPath.split('/').pop() || 'scratch', readBack.slice(-800)),
        artifact('report', `/workspace/reports/${task.id}.md`, 'scratch report', report),
      ],
      completedAt: nowIso(),
      updatedAt: nowIso(),
      error: null,
    });
    return await log(task, 'completed write_scratch_file on worker-shell');
  }

  task = await log(task, `write ${note.shimPath}`);
  let body = note.body;
  if (note.append) {
    try {
      const existing = await workspaceReadFile(workspaceIdFor(task), note.shimPath);
      body = `${existing}${note.body}`;
    } catch {
      /* new file */
    }
  }
  await workspaceWriteFile(workspaceIdFor(task), note.shimPath, body);
  const readBack = await workspaceReadFile(workspaceIdFor(task), note.shimPath);
  const probe = await workspaceRuntimeProbe();
  const report = [
    '# write_scratch_file',
    '',
    `wrote: ${note.shimPath} (${body.length} chars)`,
    `read back: ${JSON.stringify(readBack.slice(-400))}`,
    `runtime probe: ${probe.stdout} exit=${probe.exitCode}`,
    '',
    `Workspace is local disk under .data/computer-prototype/ws/${workspaceIdFor(task)}/.`,
    'Not a Cloudflare Durable Object.',
  ].join('\n');
  const wrote = await workspaceWriteFile(workspaceIdFor(task), `/reports/${task.id}.md`, report);
  task = await upsertComputerTask({
    ...task,
    backend,
    status: 'completed',
    resultSummary: note.append ? 'Note saved in local workspace.' : 'Scratch file wrote and read back. Runtime probe ok.',
    filesInspected: [note.shimPath],
    artifacts: [
      artifact('scratch', note.shimPath, note.shimPath.split('/').pop() || 'scratch', readBack.slice(-800)),
      artifact('report', wrote.path, 'scratch report', report),
    ],
    completedAt: nowIso(),
    updatedAt: nowIso(),
    error: null,
  });
  return await log(task, 'completed write_scratch_file');
}

function scratchPayload(
  task: ComputerTask,
  backend: ComputerBackend,
): { shimPath: string; cfPath: string; body: string; append: boolean } {
  const raw = (task.instructions || '').trim();
  const isProbe = /hello\.txt/i.test(raw) || /write \/scratch/i.test(raw) || /read it back/i.test(raw);
  if (isProbe) {
    return {
      shimPath: '/scratch/hello.txt',
      cfPath: '/workspace/scratch/hello.txt',
      body: `hello from aileena computer\nroute=${task.route}\nbackend=${backend}\n${nowIso()}\n`,
      append: false,
    };
  }
  const day = nowIso().slice(0, 10);
  return {
    shimPath: `/scratch/notes/${day}.txt`,
    cfPath: `/workspace/scratch/notes/${day}.txt`,
    body: `${nowIso()}\n${raw ? raw.slice(0, 4000) : '·'}\n\n`,
    append: true,
  };
}

async function cfListNotes(name: string): Promise<string[]> {
  const ls = await cfExec('ls -1 /workspace/scratch/notes', '/workspace', name);
  return String(ls.stdout || '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('.') && !s.includes('/'))
    .sort()
    .map((file) => `/workspace/scratch/notes/${file}`);
}

async function cfReadNote(name: string, path: string): Promise<{ path: string; body: string } | null> {
  try {
    return { path, body: await cfGetFile(path, name) };
  } catch {
    return null;
  }
}

async function cfPickNote(name: string, raw: string): Promise<{ path: string; body: string } | null> {
  const sel = parsePeekSelector(raw);
  const notes = await cfListNotes(name);

  const tryPaths = async (paths: string[]) => {
    for (const path of paths) {
      const hit = await cfReadNote(name, path);
      if (hit) return hit;
    }
    return null;
  };

  if (sel.kind === 'last') {
    const last = notes.at(-1);
    if (last) return tryPaths([last]);
    return tryPaths(['/workspace/scratch/hello.txt']);
  }
  if (sel.kind === 'nth') {
    const pick = [...notes].reverse()[sel.n - 1];
    return pick ? tryPaths([pick]) : null;
  }
  if (sel.kind === 'date') {
    return tryPaths([`/workspace/scratch/notes/${sel.day}.txt`]);
  }
  const rel = sel.virtual.replace(/^\/scratch\//, '');
  return tryPaths([
    `/workspace/scratch/${rel}`,
    sel.virtual.endsWith('.txt') ? '' : `/workspace/scratch/${rel}.txt`,
    `/workspace/scratch/${rel.replace(/^notes\//, '')}`,
  ].filter(Boolean));
}

async function runScratchPeek(task: ComputerTask): Promise<ComputerTask> {
  const name = workspaceIdFor(task);
  const selector = (task.instructions || '').trim() || 'last';
  if (isCloudflareComputerReady()) {
    await ensureCfMount(name);
    const note = await cfPickNote(name, selector);
    if (!note) {
      return finishInspectStyle(task, {
        status: 'completed',
        summary: 'empty scratch',
        report: '# scratch_peek\n\nempty\n',
        preview: 'empty scratch',
        title: 'peek',
        kind: 'scratch',
      });
    }
    return finishInspectStyle(task, {
      status: 'completed',
      summary: note.path,
      report: `# scratch_peek\n\n${note.path}\n\n${note.body}`,
      preview: `${note.path}\n──\n${note.body}`.slice(0, 2000),
      title: 'peek',
      kind: 'scratch',
      filesInspected: [note.path],
    });
  }
  const note = await workspacePickNote(name, selector);
  if (!note) {
    return finishInspectStyle(task, {
      status: 'completed',
      summary: 'empty scratch',
      report: '# scratch_peek\n\nempty\n',
      preview: 'empty scratch',
      title: 'peek',
      kind: 'scratch',
    });
  }
  return finishInspectStyle(task, {
    status: 'completed',
    summary: note.path,
    report: `# scratch_peek\n\n${note.path} (${note.bytes}b)\n\n${note.body}`,
    preview: `${note.path} · ${note.bytes}b\n──\n${note.body}`.slice(0, 2000),
    title: 'peek',
    kind: 'scratch',
    filesInspected: [note.path],
  });
}

async function appendTodayStamp(
  task: ComputerTask,
  stamp: string,
): Promise<{ path: string; body: string }> {
  const name = workspaceIdFor(task);
  const day = stamp.slice(0, 10);
  const line = `${stamp}\n`;
  const join = (existing: string) => {
    if (!existing) return line;
    return `${existing.endsWith('\n') ? existing : `${existing}\n`}${line}`;
  };
  if (isCloudflareComputerReady()) {
    const path = `/workspace/scratch/notes/${day}.txt`;
    await ensureCfMount(name);
    await cfExec('mkdir -p scratch/notes', '/workspace', name);
    let body = line;
    try {
      body = join(await cfGetFile(path, name));
    } catch {
      /* first stamp today */
    }
    await cfPutFile(path, body, name);
    return { path, body };
  }
  const path = `/scratch/notes/${day}.txt`;
  let existing = '';
  try {
    existing = await workspaceReadFile(name, path);
  } catch {
    /* first stamp today */
  }
  const body = join(existing);
  await workspaceWriteFile(name, path, body);
  return { path, body };
}

async function runScratchClock(task: ComputerTask): Promise<ComputerTask> {
  const stamp = nowIso();
  task = await log(task, `stamp ${stamp}`);
  const note = await appendTodayStamp(task, stamp);
  const tail = note.body.trim().split(/\n/).slice(-8).join('\n');
  return finishInspectStyle(task, {
    status: 'completed',
    summary: stamp,
    report: `# scratch_clock\n\n${note.path}\n${stamp}\n${taskBackend()}\n\n${tail}\n`,
    preview: `${note.path}\n${stamp}\n──\n${tail}`,
    title: 'clock',
    kind: 'scratch',
    filesInspected: [note.path],
  });
}

async function runCfFilesTask(task: ComputerTask): Promise<ComputerTask> {
  const name = workspaceIdFor(task);
  await ensureCfMount(name);
  const path = toWorkspacePath(task.instructions || '/workspace') || '/workspace';
  task = await log(task, `cloudflare ${task.taskType} ${path}`);
  if (task.taskType === 'files_open') {
    const body = await cfGetFile(path, name);
    return finishInspectStyle(task, {
      status: 'completed',
      summary: `opened ${path} on worker-shell`,
      report: `# files_open\n\n${path}\n\n${body}`,
      preview: body,
      title: path,
      kind: 'file',
      filesInspected: [path],
    });
  }
  if (task.taskType === 'files_search') {
    const query = clip(workspaceSearchQuery(task.instructions || '') || 'hello', 80);
    const run = await cfExec(`grep -R -n -F ${shellWord(query)} scratch`, '/workspace', name);
    const text = [run.stdout, run.stderr].filter(Boolean).join('\n');
    return finishInspectStyle(task, {
      status: run.exitCode === 0 || run.exitCode === 1 ? 'completed' : 'failed',
      summary: run.exitCode === 1 ? `no matches for ${query}` : `search ${query} on worker-shell`,
      report: `# files_search\n\n${text}`,
      preview: text,
      title: 'workspace search',
      kind: 'file',
      error: run.exitCode > 1 ? run.stderr || 'grep failed' : null,
    });
  }
  const run = await cfExec(`ls -la ${path === '/workspace' ? '.' : path}`, '/workspace', name);
  const heads = await cfExec('head -n 4 scratch/notes/*.txt', '/workspace', name);
  const excerpt = heads.exitCode === 0 && heads.stdout.trim() ? `\n── notes ──\n${heads.stdout.trim()}` : '';
  const text = [run.stdout, run.stderr].filter(Boolean).join('\n') + excerpt;
  return finishInspectStyle(task, {
    status: run.exitCode === 0 ? 'completed' : 'failed',
    summary: run.exitCode === 0 ? `listed ${path} on worker-shell` : `ls failed ${path}`,
    report: `# files_tree\n\n${text}`,
    preview: text,
    title: path,
    kind: 'file',
    filesInspected: [path],
    error: run.exitCode === 0 ? null : run.stderr || 'ls failed',
  });
}

function shellWord(value: string): string {
  if (/^[A-Za-z0-9_./-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

async function runVisitorShimFiles(task: ComputerTask): Promise<ComputerTask> {
  const id = workspaceIdFor(task);
  if (task.taskType === 'files_open') {
    const next = await finishInspectStyle(task, {
      status: 'blocked',
      summary: '⚡ scratch pad only. Cannot open site files.',
      report: '# files_open\n\nBlocked for visitors. Scratch pad only.\n',
      preview: 'scratch pad only',
      title: 'blocked',
      kind: 'file',
      error: 'visitor cannot open site files',
    });
    return await log(next, 'blocked files_open for visitor');
  }
  if (task.taskType === 'files_search') {
    task = await log(task, 'search scratch pad (not the site git)');
    const result = workspaceGrep(id, task.instructions || '');
    const next = await finishInspectStyle(task, {
      status: 'completed',
      summary: result.summary,
      report: [`# files_search`, '', result.summary, '', ...result.lines].join('\n'),
      preview: result.lines.join('\n') || result.summary,
      title: 'scratch search',
      kind: 'file',
    });
    return await log(next, result.summary);
  }
  task = await log(task, 'list scratch pad (not the site git)');
  const result = workspaceList(id);
  const next = await finishInspectStyle(task, {
    status: 'completed',
    summary: result.summary,
    report: [`# files_tree`, '', result.summary, '', ...result.lines].join('\n'),
    preview: result.lines.join('\n') || result.summary,
    title: 'scratch list',
    kind: 'file',
    filesInspected: result.lines.slice(0, 20),
  });
  return await log(next, result.summary);
}

async function runFilesTask(task: ComputerTask): Promise<ComputerTask> {
  if (!isOwnerComputerTask(task)) {
    if (task.taskType === 'files_open') return runVisitorShimFiles(task);
    if (isCloudflareComputerReady()) return runCfFilesTask(task);
    return runVisitorShimFiles(task);
  }
  if (isCloudflareComputerReady() && isWorkspaceIntent(task.instructions || '/workspace')) {
    return runCfFilesTask(task);
  }
  let result: FileInspectResult;
  if (task.taskType === 'files_tree') {
    task = await log(task, 'list directory (read-only)');
    result = filesTree(task.instructions || 'aileena-new');
  } else if (task.taskType === 'files_search') {
    task = await log(task, `search files (rg -F, secrets blocked)`);
    result = await filesSearch(task.instructions || 'Sound Lab');
  } else {
    const path = task.instructions.trim() || 'aileena-new/app/sound/page.tsx';
    task = await log(task, `open ${path} read-only`);
    result = filesOpen(path);
  }

  const blocked = /blocked|secret/i.test(result.summary);
  const status: ComputerTaskStatus = result.ok ? 'completed' : blocked ? 'blocked' : 'failed';
  const next = await finishInspectStyle(task, {
    status,
    summary: result.summary,
    report: [`# ${task.taskType}`, '', result.summary, '', ...result.lines].join('\n'),
    preview: result.lines.join('\n'),
    title: result.action,
    kind: 'file',
    filesInspected: result.ok && task.taskType === 'files_open' ? [task.instructions.trim()] : [],
    problemsFound: result.ok ? [] : [result.summary],
    risksBlockers: ['Read-only. .env, keys, and credentials are blocked.'],
    error: result.ok ? null : result.summary,
  });
  return await log(next, result.ok ? `completed ${result.action}` : result.summary);
}

async function runEmailTask(task: ComputerTask): Promise<ComputerTask> {
  if (task.taskType === 'email_send') {
    const next = await finishInspectStyle(task, {
      status: 'blocked',
      summary: '⚡ needs approval. Email send is not connected. Draft only.',
      report: '# email_send\n\nBlocked. No background send. No public access. Owner confirm required.\n',
      preview: '⚡ email not connected.',
      title: 'email blocked',
      kind: 'report',
      risksBlockers: ['Email provider is not wired for the computer. Draft/copy only.'],
      error: 'email not connected',
    });
    return await log(next, '⚡ blocked. Email send is not connected.');
  }
  const draft = parseEmailDraft(task.instructions);
  const preview = `To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`;
  const next = await finishInspectStyle(task, {
    status: 'completed',
    summary: `⚡ email not connected. Draft to ${draft.to}. Not sent.`,
    report: `# email_draft\n\n${preview}\n\nSend is blocked until the owner confirms and a provider is wired.\n`,
    preview,
    title: 'email draft',
    kind: 'report',
    risksBlockers: ['Draft only. Send needs explicit owner confirm. Provider not connected.'],
  });
  return await log(next, 'draft stored; not sent');
}

async function runBrowserTask(task: ComputerTask): Promise<ComputerTask> {
  const checklist = [
    'Browser automation is not wired on this computer.',
    'Do not invent screenshot names.',
    'Required later: /daily QA, /sound QA, landing, mobile 390px, link clicks.',
    'Desktop + mobile screenshots before any visual change is ready_for_review.',
  ].join('\n');
  const next = await finishInspectStyle(task, {
    status: 'blocked',
    summary: '⚡ blocked. Browser automation is not wired. No fake screenshots.',
    report: `# browser_screenshot\n\n${checklist}\n`,
    preview: checklist,
    title: 'browser blocked',
    kind: 'checklist',
    risksBlockers: ['No Playwright computer session. Checklist only.'],
    error: 'browser automation unavailable',
  });
  return await log(next, '⚡ blocked. No fake screenshots.');
}

export async function runComputerTask(id: string): Promise<ComputerTask | null> {
  const existing = getComputerTask(id);
  if (!existing || existing.cancelled) return existing;
  if (existing.status !== 'queued') return existing;

  let task = existing;
  try {
    task = await upsertComputerTask({
      ...existing,
      status: 'running',
      updatedAt: nowIso(),
    });
    const ownerTask = isOwnerComputerTask(task);
    if (ownerTask) {
      attachTaskToProof(task.proofItemId, task.id, 'in_progress');
    }
    const backend = taskBackend();
    task = await upsertComputerTask({ ...task, backend });
    task = await log(
      task,
      backend === 'cloudflare-worker-shell'
        ? 'backend=cloudflare-worker-shell'
        : ownerTask
          ? 'backend=local-shim (not @cloudflare/computer)'
          : 'backend=local-shim visitor scratch',
    );
    // Local shim: short pause so the dock can paint "running".
    // Production POST awaits the full worker-shell run — do not burn 1.4s there.
    if (backend !== 'cloudflare-worker-shell') {
      await new Promise((r) => setTimeout(r, 1400));
    }

    const fresh = getComputerTask(id);
    if (!fresh || fresh.cancelled) {
      return fresh
        ? upsertComputerTask({ ...fresh, status: 'failed', error: 'cancelled', completedAt: nowIso() })
        : null;
    }
    task = fresh;
    if (!isOwnerComputerTask(task) && !['write_scratch_file', 'files_tree', 'files_search', 'scratch_peek', 'scratch_clock'].includes(task.taskType)) {
      const blocked = await finishInspectStyle(task, {
        status: 'blocked',
        summary: '⚡ scratch pad only. No site git, no merge.',
        report: `# ${task.taskType}\n\nBlocked for visitors.\n`,
        preview: 'scratch pad only',
        title: 'blocked',
        kind: 'report',
        error: 'visitor scratch pad only',
      });
      return await log(blocked, 'blocked non-scratch task for visitor');
    }
    if (!isOwnerComputerTask(task) && backend === 'cloudflare-worker-shell') {
      try {
        if ((await ensureVisitorScratchFresh(workspaceIdFor(task))) === 'reset') {
          task = await log(task, `monthly reset: scratch cleared after ${VISITOR_SCRATCH_TTL_DAYS}d`);
        }
      } catch {
        /* freshness is best-effort; the task itself still runs */
      }
    }
    if (task.taskType.startsWith('git_')) {
      task = await runGitTask(task);
    } else if (task.taskType.startsWith('files_')) {
      task = await runFilesTask(task);
    } else if (task.taskType.startsWith('email_')) {
      task = await runEmailTask(task);
    } else if (task.taskType === 'browser_screenshot') {
      task = await runBrowserTask(task);
    } else if (task.taskType === 'write_scratch_file') {
      task = await runScratchTask(task);
    } else if (task.taskType === 'scratch_peek') {
      task = await runScratchPeek(task);
    } else if (task.taskType === 'scratch_clock') {
      task = await runScratchClock(task);
    } else if (task.taskType === 'shell_exec') {
      task = await runShellTask(task);
    } else {
      const inspectRoute = task.route || '/daily';
      task = await log(task, `inspect route ${inspectRoute} (read-only)`);
      const inspected = inspectRouteFiles(inspectRoute);
      const analysis =
        task.taskType === 'draft_daily_fix_plan' || inspectRoute === '/daily'
          ? analyzeDailyFixPlan(inspected)
          : {
              problemsFound: inspected.filter((f) => !f.exists).map((f) => `missing ${f.path}`),
              proposedFilesToChange: inspected.filter((f) => f.exists).map((f) => f.path),
              implementationPlan: ['Inspect only. Do not modify files until owner approves.'],
              risksBlockers: ['Prototype shim; no Cloudflare Computer backend.'],
            };

      let checkSummary = 'check skipped';
      if (task.taskType === 'run_build_check' || task.taskType === 'draft_daily_fix_plan') {
        const check = await runAllowlistedCheck();
        checkSummary = check.summary;
        task = await log(task, checkSummary);
      }

      const filesInspected = inspected.map((f) => `${f.path}${f.exists ? '' : ' (missing)'}`);
      const report = [
        `# ${task.taskType}`,
        '',
        `route: ${inspectRoute}`,
        `scope: ${task.scope || '(none)'}`,
        `instructions: ${redactSecrets(task.instructions)}`,
        '',
        '## files inspected',
        ...filesInspected.map((l) => `- ${l}`),
        '',
        '## problems found',
        ...analysis.problemsFound.map((l) => `- ${l}`),
        '',
        '## proposed files to change',
        ...analysis.proposedFilesToChange.map((l) => `- ${l}`),
        '',
        '## implementation plan',
        ...analysis.implementationPlan.map((l) => `- ${l}`),
        '',
        '## risks / blockers',
        ...analysis.risksBlockers.map((l) => `- ${l}`),
        '',
        '## checks',
        `- ${checkSummary}`,
        '',
        '## merge',
        '- not requested. not performed. owner approval still required.',
      ].join('\n');

      const wrote = await workspaceWriteFile(workspaceIdFor(task), `/reports/${task.id}.md`, report);
      const checklist = [
        'Screenshot /daily visitor 390×844',
        'Screenshot /daily owner 390×844 after key',
        'Click save note',
        'Leave a bubble',
        'Confirm no horizontal overflow',
      ].join('\n');
      await workspaceWriteFile(workspaceIdFor(task), `/artifacts/${task.id}-screenshot-checklist.txt`, checklist);

      task = await upsertComputerTask({
        ...task,
        status: 'completed',
        resultSummary: clip(
          `${analysis.problemsFound.length} problems. ${analysis.proposedFilesToChange.length} files proposed. Checks: ${checkSummary}. No repo files modified.`,
          500,
        ),
        filesInspected,
        problemsFound: analysis.problemsFound,
        proposedFilesToChange: analysis.proposedFilesToChange,
        implementationPlan: analysis.implementationPlan,
        risksBlockers: analysis.risksBlockers,
        artifacts: [
          artifact('report', wrote.path, 'patch plan', report),
          artifact('checklist', `/artifacts/${task.id}-screenshot-checklist.txt`, 'screenshot checklist', checklist),
        ],
        completedAt: nowIso(),
        updatedAt: nowIso(),
        error: null,
      });
      task = await log(task, 'completed inspect; repo unmodified');
    }

    const skipGenericProof =
      !isOwnerComputerTask(task) ||
      task.taskType.startsWith('git_') ||
      task.taskType.startsWith('files_') ||
      task.taskType.startsWith('email_') ||
      task.taskType === 'browser_screenshot';
    if (!skipGenericProof) {
      const proof = getProofItem(task.proofItemId);
      if (proof) {
        upsertProofItem({
          ...proof,
          status: nextProofStatus(task),
          resultSummary: task.resultSummary,
          filesChanged: [],
          checksRun: task.logsRedacted.filter((l) => l.includes('echo ok') || l.includes('verify')),
          computerTaskIds: proof.computerTaskIds.includes(task.id)
            ? proof.computerTaskIds
            : [...proof.computerTaskIds, task.id],
          proposedChange: proof.proposedChange || task.implementationPlan[0] || proof.proposedChange,
          updatedAt: nowIso(),
        });
      }
    }
    return getComputerTask(id);
  } catch (err) {
    const message = redactSecrets(err instanceof Error ? err.message : String(err));
    const failed = await upsertComputerTask({
      ...task,
      status: 'failed',
      error: message,
      resultSummary: `failed: ${message}`,
      completedAt: nowIso(),
      updatedAt: nowIso(),
    });
    if (isOwnerComputerTask(failed)) {
      attachTaskToProof(failed.proofItemId, failed.id, 'observed');
    }
    return failed;
  }
}

export function appDir(): string {
  return join(process.cwd());
}
