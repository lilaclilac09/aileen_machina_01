import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ALLOWED_CHECK_COMMANDS, COMPUTER_LIMITS } from './allowlist';
import { analyzeDailyFixPlan, inspectRouteFiles } from './inspect';
import { clip, redactSecrets } from './redact';
import { getComputerTask, nowIso, upsertComputerTask } from './store';
import type { ComputerArtifact, ComputerTask } from './types';
import { workspaceReadFile, workspaceRuntimeProbe, workspaceWriteFile } from './workspace';
import { attachTaskToProof, getProofItem, upsertProofItem } from '../proofQueue/store';
import type { ProofStatus } from '../proofQueue/types';

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
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
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
  // Short pause so owner UI can observe in_progress / running without a 30s spinner.
  await new Promise((r) => setTimeout(r, 700));

  const fresh = getComputerTask(id);
  if (!fresh || fresh.cancelled) {
    return fresh ? upsertComputerTask({ ...fresh, status: 'failed', error: 'cancelled', completedAt: nowIso() }) : null;
  }
  task = fresh;

  try {
    if (task.taskType === 'write_scratch_file') {
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

      const status = task.taskType === 'draft_patch' ? 'completed' : 'completed';
      task = upsertComputerTask({
        ...task,
        status,
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
