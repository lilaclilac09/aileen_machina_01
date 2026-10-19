// Render the real-agent replay result for a self-improve PR and decide the
// PR update. Pure functions + a tiny CLI; the workflow does the GitHub calls.
//
//   node evolve-replay-report.mjs --after after.json [--before before.json]
//        [--ledger branch-ledger.json --base-ledger main-ledger.json] [--sha <head>] [--run <url>] --out comment.md
// Prints {"status":"passed"|"failed"|"error", ...} on stdout.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const MARKER = '<!-- machina-evolve-replay -->';

export function loadJson(path) {
  if (!path || !existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** passed = every replayed prompt passed; error = replay could not run. */
export function replayStatus(after) {
  if (!after || !Array.isArray(after.rows) || after.rows.length === 0 || after.unreachable) return 'error';
  return after.rows.every((r) => !r.failed?.length) ? 'passed' : 'failed';
}

/** Offline ratchet held-out scores from the ledger entries added by the branch. */
export function ledgerHeldOut(ledger, baseLedger) {
  const skip = Array.isArray(baseLedger) ? baseLedger.length : 0;
  const rows = (Array.isArray(ledger) ? ledger : []).slice(skip).filter((e) => e && e.action === 'promote');
  if (!rows.length) return null;
  return { before: rows[0].heldOutBefore, after: rows[rows.length - 1].heldOutAfter, promotions: rows.map((e) => `${e.skillId}@v${e.version}`) };
}

const pct = (n, d) => (d ? `${n}/${d} (${Math.round((100 * n) / d)}%)` : 'n/a');
const clean = (s) => String(s ?? '').replace(/[\r\n|`<>]+/g, ' ').slice(0, 140);

export function summarize(report) {
  if (!report || !Array.isArray(report.rows)) return null;
  const held = report.rows.filter((r) => r.split === 'held-out');
  return {
    replayed: report.rows.length,
    passed: report.rows.filter((r) => !r.failed?.length).length,
    heldOut: { replayed: held.length, passed: held.filter((r) => !r.failed?.length).length },
    elapsedMs: report.elapsedMs ?? report.rows.reduce((a, r) => a + (r.ms || 0), 0),
  };
}

export function renderComment({ after, before, offline, sha, run }) {
  const status = replayStatus(after);
  const a = summarize(after);
  const b = summarize(before);
  const icon = { passed: '✅', failed: '❌', error: '⚠️' }[status];
  const lines = [MARKER, `## Real-agent replay: ${icon} **${status}**`, ''];
  lines.push(`Head \`${String(sha || '').slice(0, 12)}\`${run ? ` · [run](${run})` : ''} · model replies from \`next start\` + DeepSeek, scored by the bank verifiers`, '');
  lines.push('| | Before (main) | After (this PR) |', '| --- | --- | --- |');
  if (offline) lines.push(`| Offline ratchet held-out | ${offline.before.toFixed(3)} | ${offline.after.toFixed(3)} |`);
  lines.push(`| Real-agent held-out | ${b ? pct(b.heldOut.passed, b.heldOut.replayed) : 'not run'} | ${a ? pct(a.heldOut.passed, a.heldOut.replayed) : 'n/a'} |`);
  lines.push(`| Real-agent all replayed | ${b ? pct(b.passed, b.replayed) : 'not run'} | ${a ? pct(a.passed, a.replayed) : 'n/a'} |`);
  lines.push(`| Wall time | ${b ? `${Math.round(b.elapsedMs / 1000)} s` : '–'} | ${a ? `${Math.round(a.elapsedMs / 1000)} s` : '–'} |`, '');
  if (offline?.promotions?.length) lines.push(`Promotions: ${offline.promotions.map((p) => `\`${p}\``).join(', ')}`, '');
  if (after?.rows?.length) {
    const beforeById = new Map((before?.rows || []).map((r) => [r.id, r]));
    lines.push('<details><summary>Per prompt</summary>', '', '| Prompt | Split | Before | After | Failed checks (after) |', '| --- | --- | --- | --- | --- |');
    for (const r of after.rows) {
      const br = beforeById.get(r.id);
      const mark = (x) => (!x ? '–' : x.failed?.length ? '❌' : '✅');
      lines.push(`| \`${clean(r.id)}\` | ${clean(r.split)} | ${mark(br)} | ${mark(r)} | ${clean((r.failed || []).join('; ')) || ''} |`);
    }
    lines.push('', '</details>', '');
  }
  if (status === 'passed') lines.push('All replayed prompts pass. Marked ready for review; a human merges.');
  else if (status === 'failed') lines.push('Some replayed prompts fail. The PR stays a draft; do not merge until fixed or rolled back.');
  else lines.push('The replay could not run (build, server or model unreachable). The PR stays a draft.');
  lines.push('', 'This gate never merges. Re-run: Actions → "Site-agent replay gate" → Run workflow with this PR number.');
  return { status, body: lines.join('\n'), after: a, before: b, offline };
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const after = loadJson(arg('after'));
  const before = loadJson(arg('before'));
  const offline = ledgerHeldOut(loadJson(arg('ledger')), loadJson(arg('base-ledger')));
  const out = renderComment({ after, before, offline, sha: arg('sha'), run: arg('run') });
  if (arg('out')) writeFileSync(arg('out'), out.body);
  console.log(JSON.stringify({ status: out.status, after: out.after, before: out.before, offline: out.offline }));
}
