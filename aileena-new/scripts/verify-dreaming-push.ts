#!/usr/bin/env tsx
/**
 * Dreaming push recovery + sibling automation gates.
 *
 *   pnpm verify:dreaming-push
 *
 * Proves the Cognition write-one path: rejected push of generated reports
 * must abort rebase, reset to latest main, regenerate, then push one file.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..');
}

function sh(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function git(cwd: string, args: string[], env?: NodeJS.ProcessEnv) {
  return sh('git', ['-c', 'user.name=Dreaming Test', '-c', 'user.email=bot@aileena.xyz', ...args], cwd, env);
}

function main() {
  const root = repoRoot();
  const job = readFileSync(join(root, '.github/workflows/machina-memory-job.yml'), 'utf8');
  const pushSh = readFileSync(join(root, '.github/scripts/push-generated-memory.sh'), 'utf8');
  const daily = readFileSync(join(root, '.github/workflows/daily-update.yml'), 'utf8');
  const label = readFileSync(join(root, '.github/workflows/label-ai-prs.yml'), 'utf8');
  const profile = readFileSync(join(root, 'scripts/sync-github-profile-readme.mjs'), 'utf8');

  assert(
    'job calls push-generated-memory.sh',
    job.includes('bash .github/scripts/push-generated-memory.sh'),
  );
  assert(
    'job does not rebase generated reports',
    !/git rebase origin\/main/.test(job),
  );
  assert(
    'push script writes one after rejected push',
    /write one/.test(pushSh) && /git reset --hard/.test(pushSh) && /REGENERATE_CMD/.test(pushSh),
  );
  assert(
    'push script never rebases',
    !/git rebase origin/.test(pushSh) && /rebase --abort/.test(pushSh),
  );
  assert(
    'daily-update no longer cds into aileena/scripts',
    !/cd aileena\/scripts/.test(daily) && /retired/i.test(daily),
  );
  assert(
    'label-ai-prs sets GH_REPO so gh works without checkout',
    /GH_REPO:\s*\$\{\{\s*github\.repository\s*\}\}/.test(label) && /--repo "\$GH_REPO"/.test(label),
  );
  assert(
    'profile sync falls back when search 422s',
    /listMergedViaPulls/.test(profile) && /falling back to pulls API/.test(profile),
  );

  const tmp = mkdtempSync(join(tmpdir(), 'dreaming-push-'));
  const remote = join(tmp, 'remote.git');
  const first = join(tmp, 'first');
  const second = join(tmp, 'second');
  const reportRel = 'aileena-new/aileena_second_brain/memories/archived/consolidate-report-2026-10-11.md';
  const latestRel = 'aileena-new/aileena_second_brain/memories/semantic/latest-content.md';

  try {
    sh('git', ['init', '--bare', remote], tmp);
    sh('git', ['--git-dir', remote, 'symbolic-ref', 'HEAD', 'refs/heads/main'], tmp);
    git(tmp, ['clone', remote, first]);
    git(first, ['checkout', '-B', 'main']);
    mkdirSync(join(first, dirname(reportRel)), { recursive: true });
    mkdirSync(join(first, dirname(latestRel)), { recursive: true });
    writeFileSync(join(first, reportRel), 'seed report\n');
    writeFileSync(join(first, latestRel), 'seed latest\n');
    git(first, ['add', reportRel, latestRel]);
    git(first, ['commit', '-m', 'seed']);
    git(first, ['push', '-u', 'origin', 'main']);

    git(tmp, ['clone', '-b', 'main', remote, second]);
    mkdirSync(join(second, dirname(reportRel)), { recursive: true });
    mkdirSync(join(second, dirname(latestRel)), { recursive: true });

    writeFileSync(join(first, reportRel), 'first writer\n');
    writeFileSync(join(first, latestRel), 'first latest\n');
    git(first, ['add', reportRel, latestRel]);
    git(first, ['commit', '-m', 'first dreaming']);
    git(first, ['push', 'origin', 'main']);

    writeFileSync(join(second, reportRel), 'second writer\n');
    writeFileSync(join(second, latestRel), 'second latest\n');
    git(second, ['add', reportRel, latestRel]);
    git(second, ['commit', '-m', 'stale dreaming']);

    const regen = [
      `mkdir -p "${dirname(reportRel)}" "${dirname(latestRel)}"`,
      `printf 'ONE regenerated report\\n' > "${reportRel}"`,
      `printf 'ONE regenerated latest\\n' > "${latestRel}"`,
    ].join(' && ');

    const result = spawnSync('bash', [join(root, '.github/scripts/push-generated-memory.sh')], {
      cwd: second,
      encoding: 'utf8',
      env: {
        ...process.env,
        MEMORY_REASON: 'article-path',
        MEMORY_REMOTE: 'origin',
        MEMORY_BRANCH: 'main',
        MEMORY_REGENERATE_CMD: regen,
        MEMORY_PUSH_ATTEMPTS: '3',
        GIT_AUTHOR_NAME: 'Dreaming Test',
        GIT_AUTHOR_EMAIL: 'bot@aileena.xyz',
        GIT_COMMITTER_NAME: 'Dreaming Test',
        GIT_COMMITTER_EMAIL: 'bot@aileena.xyz',
      },
    });

    assert(
      'recovery script exits 0',
      result.status === 0,
      `status=${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert(
      'recovery logs write-one regenerate',
      /Regenerating Dreaming on latest/.test(result.stdout + result.stderr),
      (result.stdout + result.stderr).slice(0, 400),
    );

    const verify = join(tmp, 'verify');
    git(tmp, ['clone', remote, verify]);
    const report = readFileSync(join(verify, reportRel), 'utf8');
    const latest = readFileSync(join(verify, latestRel), 'utf8');
    assert('remote report is the single regenerated file', report === 'ONE regenerated report\n', report);
    assert('remote latest-content is the single regenerated file', latest === 'ONE regenerated latest\n', latest);
    assert(
      'no conflict markers on remote',
      !report.includes('<<<<<<<') && !latest.includes('<<<<<<<'),
    );
    assert(
      'stale second-writer text is gone',
      !report.includes('second writer') && !latest.includes('second latest'),
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) {
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail ?? ''}`);
    process.exit(1);
  }
}

if (!existsSync(join(repoRoot(), '.github/scripts/push-generated-memory.sh'))) {
  console.error('missing push-generated-memory.sh');
  process.exit(1);
}

main();
