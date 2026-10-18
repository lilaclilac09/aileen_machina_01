/**
 * Offline gate for the self-improve replay gate
 * (.github/scripts/evolve-replay-report.mjs + .github/workflows/site-agent-replay.yml):
 * status rules, before/after rendering, ledger delta, cell sanitizing, and the
 * workflow's security shape (bot-only self-improve PRs, read-only replay job,
 * never merges). No network, no keys.
 *
 * Run: npx -y tsx harness/site-agent/evolveReplay.ts
 */
import { readFileSync } from 'node:fs';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });

const row = (id: string, split: string, failed: string[] = []) => ({ id, split, status: 200, failed, ms: 1000, reply: 'x' });

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const R: any = await import('../../../.github/scripts/evolve-replay-report.mjs');

  const after = { rows: [row('hold-a', 'held-out'), row('hold-b', 'held-out'), row('train-c', 'train')], elapsedMs: 9000 };
  const before = { rows: [row('hold-a', 'held-out'), row('hold-b', 'held-out', ['missing: leave a note']), row('train-c', 'train')], elapsedMs: 8000 };
  check('status: all pass → passed', R.replayStatus(after) === 'passed');
  check('status: one fail → failed', R.replayStatus(before) === 'failed');
  check('status: skipped/empty → error', R.replayStatus({ skipped: true }) === 'error' && R.replayStatus({ rows: [] }) === 'error' && R.replayStatus(null) === 'error');
  check('status: unreachable → error', R.replayStatus({ rows: [row('a', 'held-out')], unreachable: true }) === 'error');

  const base = [{ action: 'promote', heldOutBefore: 0.5, heldOutAfter: 0.6, skillId: 'old', version: 1 }];
  const ledger = [...base, { action: 'promote', skillId: 's', version: 1, heldOutBefore: 0.8, heldOutAfter: 0.9 }, { action: 'promote', skillId: 's', version: 2, heldOutBefore: 0.9, heldOutAfter: 1 }];
  const off = R.ledgerHeldOut(ledger, base);
  check('ledger: only entries added by the branch', off.before === 0.8 && off.after === 1 && off.promotions.join() === 's@v1,s@v2', JSON.stringify(off));
  check('ledger: nothing new → null', R.ledgerHeldOut(base, base) === null);

  const out = R.renderComment({ after, before, offline: off, sha: 'abcdef0123456789', run: 'https://example/run' });
  check('comment: starts with marker', out.body.startsWith(R.MARKER));
  check('comment: held-out before/after', out.body.includes('| Real-agent held-out | 1/2 (50%) | 2/2 (100%) |'), out.body);
  check('comment: offline ratchet row', out.body.includes('| Offline ratchet held-out | 0.800 | 1.000 |'));
  check('comment: per-prompt before ❌ after ✅', /`hold-b` \| held-out \| ❌ \| ✅/.test(out.body));
  check('comment: never claims a merge', /never merges/.test(out.body) && !/auto-merg/i.test(out.body));
  const evil = R.renderComment({ after: { rows: [row('x|<script>`', 'held-out', ['a\n| injected | row'])] } });
  check('comment: cells sanitized', !evil.body.includes('<script>') && !evil.body.includes('\n| injected'), evil.body);
  check('comment: no baseline → "not run"', evil.body.includes('not run'));

  // ── Workflow shape ──
  const wf = readFileSync('../.github/workflows/site-agent-replay.yml', 'utf8');
  check('workflow: dispatch only', /on:\s*\n\s*workflow_dispatch:/.test(wf) && !/pull_request/.test(wf));
  check('workflow: top-level permissions {}', /^permissions: \{\}$/m.test(wf));
  check('workflow: self-improve ref pattern enforced', wf.includes('^self-improve/evolve-[0-9a-f]{24}$'));
  check('workflow: bot-opened, same-repo only', wf.includes('github-actions[bot]') && wf.includes('head is from a fork'));
  check('workflow: commits only from the evolve bot or the repo owner (verified, owner author, owner/web-flow committer)', wf.includes('bot@aileena.xyz') && wf.includes('OWNER: ${{ github.repository_owner }}') && wf.includes('.commit.verification.verified == true and .author.login == $ENV.OWNER and (.committer.login == $ENV.OWNER or .committer.login == "web-flow")'));
  const replayJob = wf.slice(wf.indexOf('\n  replay:'), wf.indexOf('\n  report:'));
  check('workflow: replay job read-only, no persisted creds', /permissions:\s*\n\s*contents: read\s*\n\s*defaults/.test(replayJob) && replayJob.includes('persist-credentials: false') && !/write/.test(replayJob));
  check('workflow: secret only in replay job', (wf.match(/secrets\./g) || []).length === 1 && replayJob.includes('secrets.DEEPSEEK_API_KEY'));
  check('workflow: never merges or approves', !/gh pr merge|--approve|APPROVE|git push/.test(wf));
  check('workflow: report runs main scripts', /sparse-checkout: \.github\/scripts/.test(wf));

  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok || !r.detail ? '' : ` — ${r.detail.slice(0, 400)}`}`);
  console.log(`\nevolveReplay: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}
main();
