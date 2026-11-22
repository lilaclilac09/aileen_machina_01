import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { check, isOverlay, overlayItem, parseArgs } from './check.mjs';

const owner = 'lilaclilac09';
const reportDir = resolve(dirname(fileURLToPath(import.meta.url)), 'reports');
const gh = args => JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const api = endpoint => gh(['api', endpoint]);
const pages = endpoint => gh(['api', '--paginate', '--slurp', endpoint]).flat();
const cell = value => String(value).replaceAll('|', '\\|').replace(/[\r\n]/g, ' ');

export function options(args) {
  const values = parseArgs(args, ['--days', '--repos']);
  const days = Number(values['--days'] ?? 14);
  if (!Number.isInteger(days) || days <= 0) throw new Error('--days must be a positive integer');
  const repos = values['--repos']?.split(',').map(repo => repo.includes('/') ? repo : `${owner}/${repo}`);
  if (repos?.some(repo => !new RegExp(`^${owner}/[A-Za-z0-9_.-]+$`).test(repo)))
    throw new Error(`--repos must name repositories owned by ${owner}`);
  return { days, repos: repos && [...new Set(repos)] };
}

export function recentPRs(repo, cutoff, request = api) {
  const prs = [];
  for (let page = 1; ; page++) {
    const batch = request(`repos/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100&page=${page}`);
    prs.push(...batch.filter(pr => Date.parse(pr.updated_at) >= cutoff));
    if (batch.length < 100 || batch.some(pr => Date.parse(pr.updated_at) < cutoff)) return prs;
  }
}

function remoteOverlays(repo, branch) {
  const tree = api(`repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (tree.truncated) throw new Error(`${repo}: truncated tree; overlays cannot be fully listed`);
  return tree.tree.filter(entry => entry.type === 'blob' && isOverlay(entry.path)).map(entry => {
    const blob = api(`repos/${repo}/git/blobs/${entry.sha}`);
    if (blob.encoding !== 'base64') throw new Error(`${repo}:${entry.path}: unsupported blob encoding`);
    return overlayItem(entry.path, Buffer.from(blob.content, 'base64').toString('utf8'));
  });
}

export function sweep(args) {
  const { days, repos: selected } = options(args);
  const started = new Date();
  const cutoff = started.getTime() - days * 24 * 60 * 60 * 1000;
  const repos = selected
    ? selected.map(repo => api(`repos/${repo}`))
    : gh(['repo', 'list', owner, '--limit', '10000', '--json', 'nameWithOwner,isFork,defaultBranchRef'])
      .filter(repo => !repo.isFork);
  if (!selected && repos.length >= 10000) throw new Error('Repository listing reached limit; audit would be incomplete');
  const rows = [];
  const manual = [];
  for (const repo of repos) {
    const name = repo.full_name ?? repo.nameWithOwner;
    console.error(`Auditing ${name}`);
    const prs = recentPRs(name, cutoff);
    if (!prs.length) rows.push(`| ${cell(name)} | — | no PRs updated in window |`);
    for (const pr of prs) {
      const files = pages(`repos/${name}/pulls/${pr.number}/files?per_page=100`).map(file => file.filename);
      // GitHub caps this endpoint at 3,000 files. Do not certify a partial file set.
      if (files.length >= 3000) throw new Error(`${name}#${pr.number}: files endpoint reached 3,000-file cap`);
      const failures = check(pr.body ?? '', files).filter(result => !result.pass);
      rows.push(`| ${cell(name)} | [#${pr.number}](${pr.html_url}) | ${failures.length ? failures.map(result => cell(`${result.id} [${result.source}]`)).join('; ') : 'none'} |`);
    }
    if (prs.length) {
      const branch = repo.default_branch ?? repo.defaultBranchRef?.name;
      if (!branch) throw new Error(`${name}: missing default branch`);
      const items = remoteOverlays(name, branch);
      manual.push(`### ${name} (${branch})\n\n${items.length ? items.map(item => `- MANUAL ${item}`).join('\n') : 'No matching project overlay files found.'}`);
    }
  }
  const table = ['| repo | PR | failing checks |', '| --- | --- | --- |', ...rows].join('\n');
  const report = `# Acceptance sweep — ${started.toISOString()}\n\nWindow: PRs updated since ${new Date(cutoff).toISOString()} (${days} days), all states.\nRepositories: ${repos.length}. Non-forks by default; explicit --repos is honored as given.\nMachine checks are format heuristics, not proof of execution/approval/production.\n\n${table}\n\n## Additional manual items\n\nDefault-branch rules only; also review PR-branch rule changes.\n\n${manual.join('\n\n')}\n`;
  mkdirSync(reportDir, { recursive: true });
  const path = resolve(reportDir, `sweep-${started.toISOString().slice(0, 10)}.md`);
  writeFileSync(path, report);
  console.log(`Acceptance sweep: ${repos.length} repositories; last ${days} days (updated PRs, all states)`);
  console.log(table);
  console.log(`Report: ${path}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { sweep(process.argv.slice(2)); }
  catch (error) {
    console.error(`ERROR: audit incomplete — ${error.message}`);
    process.exitCode = 2;
  }
}
