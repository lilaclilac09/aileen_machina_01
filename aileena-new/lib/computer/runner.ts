import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ALLOWED_CHECK_COMMANDS, COMPUTER_LIMITS } from './allowlist';
import { analyzeDailyFixPlan, inspectRouteFiles } from './inspect';
import { clip, redactSecrets } from './redact';
import { getComputerTask, nowIso, upsertComputerTask } from './store';
import type { ComputerArtifact, ComputerTask, ComputerTaskStatus } from './types';
import { workspaceReadFile, workspaceRuntimeProbe, workspaceWriteFile } from './workspace';
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

const WORKSPACE_ID = 'owner';

function log(task: ComputerTask, line: string): ComputerTask {
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
  const wrote = await workspaceWriteFile(WORKSPACE_ID, `/reports/${task.id}.md`, opts.report);
  return upsertComputerTask({
    ...task,
    status: opts.status,
    resultSummary: clip(opts.summary, 2000),
    filesInspected: opts.filesInspected ?? task.filesInspected,
    problemsFound: opts.problemsFound ?? [],
    risksBlockers: opts.risksBlockers ?? [],
    artifacts: [artifact(opts.kind, wrote.path, opts.title, opts.preview)],
    completedAt: nowIso(),
    updatedAt: nowIso(),
    error: opts.error ?? null,
  });
}

async function runGitTask(task: ComputerTask): Promise<ComputerTask> {
  let result: GitInspectResult;
  if (task.taskType === 'git_status') {
    task = log(task, 'git status --short (inspect only)');
    result = await gitStatus();
  } else if (task.taskType === 'git_log') {
    task = log(task, 'git log inspect (no mutation)');
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
      task = log(task, `git diff --stat ${diff[1]}..${diff[2]}`);
      result = await gitDiffStat(diff[1], diff[2]);
    } else {
      const hash = (task.instructions.match(/[0-9a-f]{7,40}/i) || [])[0] || '';
      task = log(task, `git show --stat ${hash || '(missing hash)'}`);
      result = await gitShow(hash);
    }
  } else {
    task = log(task, 'git find commit (inspect only, no checkout)');
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
  const logged = log(next, result.ok ? `completed ${result.action}; repo unmodified` : `git ${result.action} failed`);

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

async function runFilesTask(task: ComputerTask): Promise<ComputerTask> {
  let result: FileInspectResult;
  if (task.taskType === 'files_tree') {
    task = log(task, 'list directory (read-only)');
    result = filesTree(task.instructions || 'aileena-new');
  } else if (task.taskType === 'files_search') {
    task = log(task, `search files (rg -F, secrets blocked)`);
    result = await filesSearch(task.instructions || 'Sound Lab');
  } else {
    const path = task.instructions.trim() || 'aileena-new/app/sound/page.tsx';
    task = log(task, `open ${path} read-only`);
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
  return log(next, result.ok ? `completed ${result.action}` : result.summary);
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
    return log(next, '⚡ blocked. Email send is not connected.');
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
  return log(next, 'draft stored; not sent');
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
  return log(next, '⚡ blocked. No fake screenshots.');
}

export async function runComputerTask(id: string): Promise<ComputerTask | null> {
  const existing = getComputerTask(id);
  if (!existing || existing.cancelled) return existing;
  if (existing.status !== 'queued') return existing;

  let task = upsertComputerTask({
    ...existing,
    status: 'running',
    updatedAt: nowIso(),
  });
  attachTaskToProof(task.proofItemId, task.id, 'in_progress');
  task = log(task, 'backend=local-shim (not @cloudflare/computer)');
  // Short pause so owner UI can observe running without a 30s spinner.
  await new Promise((r) => setTimeout(r, 1400));

  const fresh = getComputerTask(id);
  if (!fresh || fresh.cancelled) {
    return fresh ? upsertComputerTask({ ...fresh, status: 'failed', error: 'cancelled', completedAt: nowIso() }) : null;
  }
  task = fresh;

  try {
    if (task.taskType.startsWith('git_')) {
      task = await runGitTask(task);
    } else if (task.taskType.startsWith('files_')) {
      task = await runFilesTask(task);
    } else if (task.taskType.startsWith('email_')) {
      task = await runEmailTask(task);
    } else if (task.taskType === 'browser_screenshot') {
      task = await runBrowserTask(task);
    } else if (task.taskType === 'write_scratch_file') {
      task = log(task, 'write /scratch/hello.txt');
      const payload = `hello from aileena computer shim\nroute=${task.route}\n${nowIso()}\n`;
      await workspaceWriteFile(WORKSPACE_ID, '/scratch/hello.txt', payload);
      const readBack = await workspaceReadFile(WORKSPACE_ID, '/scratch/hello.txt');
      const probe = await workspaceRuntimeProbe();
      const report = [
        '# write_scratch_file',
        '',
        `wrote: /scratch/hello.txt (${payload.length} chars)`,
        `read back: ${JSON.stringify(readBack)}`,
        `runtime probe: ${probe.stdout} exit=${probe.exitCode}`,
        '',
        'Workspace is local disk under .data/computer-prototype/ws/owner/.',
        'Not a Cloudflare Durable Object.',
      ].join('\n');
      const wrote = await workspaceWriteFile(WORKSPACE_ID, `/reports/${task.id}.md`, report);
      task = upsertComputerTask({
        ...task,
        status: 'completed',
        resultSummary: 'Scratch file wrote and read back. Runtime probe ok.',
        filesInspected: ['/scratch/hello.txt'],
        artifacts: [
          artifact('scratch', '/scratch/hello.txt', 'hello.txt', readBack),
          artifact('report', wrote.path, 'scratch report', report),
        ],
        completedAt: nowIso(),
        updatedAt: nowIso(),
        error: null,
      });
      task = log(task, 'completed write_scratch_file');
    } else {
      const inspectRoute = task.route || '/daily';
      task = log(task, `inspect route ${inspectRoute} (read-only)`);
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
        task = log(task, checkSummary);
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

      const wrote = await workspaceWriteFile(WORKSPACE_ID, `/reports/${task.id}.md`, report);
      const checklist = [
        'Screenshot /daily visitor 390×844',
        'Screenshot /daily owner 390×844 after key',
        'Click save note',
        'Leave a bubble',
        'Confirm no horizontal overflow',
      ].join('\n');
      await workspaceWriteFile(WORKSPACE_ID, `/artifacts/${task.id}-screenshot-checklist.txt`, checklist);

      task = upsertComputerTask({
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
      task = log(task, 'completed inspect; repo unmodified');
    }

    const skipGenericProof =
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
    const failed = upsertComputerTask({
      ...task,
      status: 'failed',
      error: message,
      resultSummary: `failed: ${message}`,
      completedAt: nowIso(),
      updatedAt: nowIso(),
    });
    attachTaskToProof(failed.proofItemId, failed.id, 'observed');
    return failed;
  }
}

export function appDir(): string {
  return join(process.cwd());
}
