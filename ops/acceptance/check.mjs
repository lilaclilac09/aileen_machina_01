import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const sources = {
  closer: 'AGENTS.md §Evidence (required closer); .cursor/rules/verification.mdc §Every final reply',
  phrases: 'AGENTS.md §Evidence / §施工队安全条例 → 硬性禁止',
  ui: '.cursor/rules/ui-step-screenshot.mdc §Required deliverables / §Fail condition',
  production: 'AGENTS.md §施工队安全条例 §§5–6 / 硬性禁止',
  blocker: 'AGENTS.md §Blocker table / §施工队安全条例 → Fail-closed blockers',
  checks: '.github/pull_request_template.md §checks run; AGENTS.md §Verification is mandatory',
};

const aliases = {
  'root cause / reason': 'root cause', 'root cause or reason for change': 'root cause',
  risks: 'remaining risks', 'safe to merge?': 'safe to merge',
  'manual qa performed': 'manual qa',
};
const fields = ['root cause', 'files changed', 'checks run', 'manual qa', 'verification',
  'remaining risks', 'manual steps', 'safe to merge'];
const clean = value => value.replace(/<!--[^]*?-->/g, '').trim();
const substantive = value => clean(value).replace(/^\s*[-*]\s*\[[ xX]\].*$/gm, '')
  .replace(/[`*_\s|:~-]/g, '').length > 0;
const normalize = name => {
  const key = name.replace(/[*`]/g, '').trim().toLowerCase();
  return aliases[key] ?? key;
};

export function sections(body) {
  const result = {};
  let current;
  for (const line of clean(body).split(/\r?\n/)) {
    const heading = line.match(/^\s*#{1,6}\s+(.+?)\s*#*$/);
    const key = line.match(/^\s*(?:[-*]\s+)?(?:\*\*)?([\w /?]+?)(?:\*\*)?:\s*(.*)$/);
    if (heading || (key && fields.includes(normalize(key[1])))) {
      current = normalize((heading ?? key)[1]);
      result[current] = (result[current] ?? '') + (key ? key[2] : '') + '\n';
    } else if (current) result[current] += line + '\n';
  }
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, clean(value)]));
}

export const isUI = file => /\.(?:tsx|jsx|css|scss|sass|less|html?|vue|svelte|swift|xib|storyboard|dart|qml)$/i.test(file)
  || /(?:^|\/)(?:res\/layout\/.*\.xml|[^/]*(?:View|Screen|Activity|Fragment)\.kt)$/i.test(file);

function claimLines(body) {
  return clean(body).split(/\r?\n/).map(line => line.replace(/(`+)[^]*?\1|"(?:\\.|[^"\\])*"|“[^”]*”|‘[^’]*’|「[^」]*」/g, ' '))
    .filter(line => !/^\s*>/.test(line)
    && !/\b(?:not|never|no|cannot|can't|don't|do not|must not)\b|不能|不准|禁止/i.test(line));
}

function localProductionClaim(line) {
  if (!/localhost|127\.0\.0\.1|\bpreview\b|https?:\/\/\S+-\S+\.vercel\.app/i.test(line)) return false;
  const claim = /\b(?:verified|validated|proved|fixed|shipped)\b|(?:production|ship).{0,25}\b(?:done|complete|ready|success)\b|production\s+(?:proof|evidence)\s*:|线上.{0,12}(?:证明|修好|完成)/i.test(line);
  const url = /https?:\/\/[^\s)]+/i.test(line);
  return claim || (url && /production\s+(?:proof|evidence)/i.test(line));
}

function blockerComplete(body) {
  const names = ['blocked_on', 'evidence', 'impact', 'human_action', 'not_doing'];
  const values = {};
  const rows = body.split(/\r?\n/).filter(line => /^\s*\|/.test(line))
    .map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.replace(/[`*]/g, '').trim()));
  for (const name of names) {
    const text = body.match(new RegExp(`^[ \\t]*${name}:[ \\t]*([^\\r\\n]*)$`, 'mi'));
    const row = rows.find(cells => cells[0]?.toLowerCase() === name);
    values[name] = text?.[1] ?? row?.[1] ?? '';
  }
  if (names.every(name => substantive(values[name])) && /^(blocked|degraded)$/i.test(values.impact.trim())) return true;
  const header = rows.findIndex(cells => cells.join('|').includes('谁能解') && cells.join('|').includes('不解则任务状态')
    && cells.some(cell => /^blocker$/i.test(cell)) && cells.some(cell => cell.includes('证据')));
  return header >= 0 && rows.slice(header + 1).some(cells => cells.length === 4
    && cells.every(cell => substantive(cell)) && !cells.every(cell => /^[-: ]+$/.test(cell)));
}

export function check(body, files = null) {
  const parsed = sections(body);
  const results = [];
  const add = (id, pass, source, detail) => results.push({ id, pass, source, detail });
  for (const field of fields) {
    const value = parsed[field] ?? '';
    const nonempty = field === 'checks run'
      ? substantive(value) || /^\s*[-*]\s*\[[xX]\]\s*\S/m.test(value)
        || /(?:not run|not applicable|skipped|n\/a|未运行|不适用)\s*[:—-]\s*\S/i.test(value)
      : field === 'safe to merge' ? Boolean(value) : substantive(value);
    add(`closer:${field}`, nonempty, sources.closer, nonempty ? 'present' : 'missing or empty');
  }
  const merge = parsed['safe to merge'] ?? '';
  const selected = [...merge.matchAll(/^\s*[-*]\s*\[[xX]\]\s*(.+?)\s*$/gm)].map(match => match[1]);
  const value = selected.length === 1 ? selected[0] : merge;
  add('safe-to-merge', /^(yes|no|yes after manual env\/config step)$/i.test(value.trim()), sources.closer,
    'allowed: yes | no | yes after manual env/config step');
  const claims = claimLines(body);
  add('evidence-not-speculation', !claims.some(line => /\bshould (?:work|be fixed)\b|\blooks good\b|应该好了/i.test(line)),
    sources.phrases, 'no speculative completion phrases');
  const ui = files?.some(isUI);
  const evidence = clean(body).split(/\r?\n/).filter(line => !/\b(?:no|missing|not attached|not captured|not run)\b|没有|未截图/i.test(line)).join('\n');
  const image = /(?:https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|mp4|webm|mov)|(?:[\w./-]+\.(?:png|jpe?g|gif|webp|mp4|webm|mov))\b|!\[[^\]]*\]\([^)]+\)|https:\/\/github\.com\/user-attachments\/[^\s)]+)/i.test(evidence);
  add('ui-artifact', !ui || image, sources.ui, files === null ? 'UI applicability unknown: --files not supplied' : ui ? 'UI files require an image/screenshot/recording artifact' : 'no detected UI files');
  add('ui-interaction', !ui || /\b(?:click(?:ed|s|-through)?|scroll(?:ed|s)?|snap|drag(?:ged)?|hover|walkthrough|recording)\b|交互|录屏|点击|滚动/i.test(evidence),
    sources.ui, 'UI requires interaction evidence/explicit steps; quality remains manual');
  add('production-proof', !claims.some(localProductionClaim),
  sources.production, 'no apparent localhost/preview-as-production claim (manual review still required)');
  const blockerClaims = clean(body).replace(/\bAfter merge \(or a blocked gate\)/gi, '');
  const blocked = /\bblocked\b|\bblocked_on\s*[:|]/i.test(blockerClaims);
  add('blocker-fields', !blocked || blockerComplete(clean(body)), sources.blocker,
    blocked ? 'blocked mentioned: require populated blocker fields/table' : 'no blocked claim');
  const boxes = (parsed['checks run'] ?? '').split(/\r?\n/).filter(line => /^\s*[-*]\s*\[[ xX]\]/.test(line));
  add('checks-run-checkboxes', boxes.every(line => /^\s*[-*]\s*\[[xX]\]\s*\S/.test(line)
    || /(?:not run|not applicable|skipped|n\/a|未运行|不适用)\s*[:—-]\s*\S/i.test(line)), sources.checks,
  boxes.length ? 'unchecked checks must explicitly state why unrun/inapplicable' : 'text closer: no PR checkboxes');
  return results;
}

export function overlayItem(path, body) {
  const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1]);
  return `${path} — ${headings.join(' / ') || '(no headings; read complete file)'}`;
}

export function overlays(root) {
  return execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0')
    .filter(isOverlay).map(path => overlayItem(path, readFileSync(resolve(root, path), 'utf8')));
}

export const isOverlay = path => /(?:^|\/)(?:AGENTS|CLAUDE)\.md$/.test(path)
  || /(?:^|\/)\.cursor\/rules\/.*\.(?:md|mdc)$/.test(path);

export function parseArgs(args, allowed) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!allowed.includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || args[i] in result)
      throw new Error(`Expected ${allowed.join(', ')} with one value each`);
    result[args[i]] = args[i + 1];
  }
  return result;
}

export function readFiles(path) {
  const input = readFileSync(path, 'utf8').trim();
  const files = input.startsWith('[') ? JSON.parse(input) : input.split(/\r?\n/).filter(Boolean);
  return files.map(file => {
    const name = typeof file === 'string' ? file : file?.filename;
    if (typeof name !== 'string' || !name.trim()) throw new Error('Invalid changed-files entry');
    return name;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = parseArgs(process.argv.slice(2), ['--body', '--files', '--root']);
    if (!args['--body']) throw new Error('Usage: node check.mjs --body <file|-> [--files <list>] [--root <checkout>]');
    const body = readFileSync(args['--body'] === '-' ? 0 : args['--body'], 'utf8');
    const results = check(body, args['--files'] ? readFiles(args['--files']) : null);
    for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id}: ${result.detail} [${result.source}]`);
    console.log('\nAdditional manual items (target repo rules; not automatic gates):');
    for (const item of overlays(resolve(args['--root'] ?? '.'))) console.log(`MANUAL ${item}`);
    console.log('\nMachine PASS is not approval, verified execution, or production ship evidence.');
    process.exitCode = results.some(result => !result.pass) ? 1 : 0;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  }
}
