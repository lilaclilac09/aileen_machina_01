import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, isUI, overlayItem, parseArgs, readFiles, sections } from './check.mjs';
import { options, recentPRs } from './sweep.mjs';

const pass = readFileSync(new URL('./fixtures/pass.md', import.meta.url), 'utf8');
const fail = readFileSync(new URL('./fixtures/fail.md', import.meta.url), 'utf8');
const result = (body, id, files = []) => check(body, files).find(row => row.id === id).pass;
const text = `root cause: request for evidence kit
files changed: check.mjs
checks run: node --test — pass
manual QA: none; command-line only
verification: captured command output
remaining risks: heuristic evidence checks
manual steps: none
safe to merge: no`;

test('passing heading fixture and all eight text keys', () => {
  assert.deepEqual(check(pass, []).filter(row => !row.pass), []);
  assert.deepEqual(check(text, []).filter(row => !row.pass), []);
  assert.equal(sections(pass)['root cause'].startsWith('Add'), true);
});

test('empty and failing sample fail with source-cited findings', () => {
  assert.equal(check('').filter(row => row.id.startsWith('closer:') && !row.pass).length, 8);
  const failures = check(fail, ['app/page.tsx']).filter(row => !row.pass);
  for (const id of ['safe-to-merge', 'evidence-not-speculation', 'ui-artifact', 'ui-interaction', 'production-proof', 'blocker-fields', 'checks-run-checkboxes'])
    assert.ok(failures.some(row => row.id === id), id);
  assert.ok(failures.every(row => row.source.includes('§')));
});

test('empty/comment-only fields and unchecked-only checks fail', () => {
  assert.equal(result(text.replace('request for evidence kit', '<!-- fill here -->'), 'closer:root cause'), false);
  assert.equal(result(text.replace('node --test — pass', '- [ ] build'), 'closer:checks run'), false);
  assert.equal(result(text.replace('node --test — pass', '- [ ] build — not run: docs only'), 'checks-run-checkboxes'), true);
});

test('safe to merge requires one exact option', () => {
  for (const value of ['yes', 'no', 'yes after manual env/config step'])
    assert.equal(result(text.replace('safe to merge: no', `safe to merge: ${value}`), 'safe-to-merge'), true);
  for (const value of ['', 'maybe', 'yes please', '- [x] yes\n- [x] no'])
    assert.equal(result(text.replace('safe to merge: no', `safe to merge: ${value}`), 'safe-to-merge'), false);
});

test('UI needs artifacts and interaction; absent files is explicitly unknown', () => {
  for (const file of ['x.tsx', 'x.jsx', 'x.css', 'x.html', 'App.swift', 'x.vue', 'x.dart', 'HomeScreen.kt', 'res/layout/main.xml']) assert.equal(isUI(file), true, file);
  assert.equal(isUI('README.md'), false);
  assert.equal(result(text, 'ui-artifact', ['x.tsx']), false);
  assert.equal(result(text + '\nScreenshot: shots/home.png', 'ui-interaction', ['x.tsx']), false);
  const ui = text + '\nScreenshot: shots/home.png; clicked menu → opened settings.';
  assert.equal(result(ui, 'ui-artifact', ['x.tsx']), true);
  assert.equal(result(ui, 'ui-interaction', ['x.tsx']), true);
  assert.equal(result(text + '\nNo screenshots: shots/home.png', 'ui-artifact', ['x.tsx']), false);
  assert.match(check(text).find(row => row.id === 'ui-artifact').detail, /unknown/);
});

test('production heuristics reject local claims but permit local dev and negation', () => {
  for (const claim of ['Production proof: http://localhost:3000', 'Preview URL https://preview.test proves production ready', 'localhost — ship done'])
    assert.equal(result(text + '\n' + claim, 'production-proof'), false, claim);
  for (const claim of ['Local dev: localhost:3000', 'Preview Ready ≠ Production Ready; not production proof', 'Production verified at https://example.com'])
    assert.equal(result(text + '\n' + claim, 'production-proof'), true, claim);
});

test('speculation is rejected; quoted or prohibited phrases are not claims', () => {
  for (const phrase of ['should work', 'should be fixed', 'looks good', '应该好了']) {
    assert.equal(result(text + '\n' + phrase, 'evidence-not-speculation'), false);
    assert.equal(result(text + '\n> ' + phrase, 'evidence-not-speculation'), true);
    assert.equal(result(text + '\nDo not say ' + phrase, 'evidence-not-speculation'), true);
  }
});

test('inline code and quoted phrases are excluded from both claim checks', () => {
  for (const [open, close] of [['`', '`'], ['``', '``'], ['"', '"'], ['“', '”'], ['‘', '’'], ['「', '」']]) {
    for (const phrase of ['should work', 'should be fixed', 'looks good', '应该好了', 'Production proof: http://localhost:3000', 'verified on https://preview.example.com']) {
      const body = text + `\nCheck detects ${open}${phrase}${close} claims.`;
      assert.equal(result(body, 'evidence-not-speculation'), true, body);
      assert.equal(result(body, 'production-proof'), true, body);
    }
    const actual = text + `\nCheck detects ${open}should work${close}; verified on http://localhost:3000, should work`;
    assert.equal(result(actual, 'evidence-not-speculation'), false);
    assert.equal(result(actual, 'production-proof'), false);
  }
});

test('production check names are not claims, but localhost verification still fails', () => {
  for (const description of ['localhost/preview as production proof', 'Checks localhost as production proof', 'production proof check for localhost/preview'])
    assert.equal(result(text + '\n' + description, 'production-proof'), true, description);
  for (const claim of ['verified on http://localhost:3000, should work', 'verified on https://preview.example.com', 'Production proof: localhost:3000', 'http://localhost:3000 as production proof'])
    assert.equal(result(text + '\n' + claim, 'production-proof'), false, claim);
});

test('dogfooded PR body passes all checks without changed UI files', () => {
  const prbody = readFileSync(new URL('./fixtures/prbody.md', import.meta.url), 'utf8');
  assert.deepEqual(check(prbody).filter(row => !row.pass), []);
});

test('blocked requires populated fields, valid impact; accepts both source tables', () => {
  assert.equal(result(text + '\nblocked', 'blocker-fields'), false);
  const blocker = '\nblocked_on: missing token\nevidence: gh returned 403\nimpact: blocked\nhuman_action: admin adds token\nnot_doing: no bypass';
  assert.equal(result(text + blocker, 'blocker-fields'), true);
  assert.equal(result(text + blocker.replace('impact: blocked', 'impact: low'), 'blocker-fields'), false);
  const table = '\nblocked\n| field | value |\n| --- | --- |\n| blocked_on | token |\n| evidence | API 403 |\n| impact | blocked |\n| human_action | admin adds token |\n| not_doing | no bypass |';
  assert.equal(result(text + table, 'blocker-fields'), true);
  const ship = '\nblocked\n| Blocker | 证据（命令或原文） | 谁能解 | 不解则任务状态 |\n| --- | --- | --- | --- |\n| token | API 403 | admin | not done |';
  assert.equal(result(text + ship, 'blocker-fields'), true);
  assert.equal(result(text + ship.slice(0, ship.lastIndexOf('\n')), 'blocker-fields'), false);
});

test('CLI stdin, missing input, and fail exit codes', () => {
  const script = fileURLToPath(new URL('./check.mjs', import.meta.url));
  const good = spawnSync(process.execPath, [script, '--body', '-'], { input: text, encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /PASS closer:root cause/);
  const bad = spawnSync(process.execPath, [script, '--body', '-'], { input: '', encoding: 'utf8' });
  assert.equal(bad.status, 1);
  const error = spawnSync(process.execPath, [script, '--body', '/no/such/body.md'], { encoding: 'utf8' });
  assert.equal(error.status, 2);
  assert.match(error.stderr, /ERROR:/);
});

test('argument validation, changed-files formats and overlay headings', () => {
  assert.throws(() => parseArgs(['--body'], ['--body']));
  assert.throws(() => parseArgs(['--other', 'x'], ['--body']));
  assert.throws(() => options(['--days', '0']));
  assert.throws(() => options(['--repos', 'other/repo']));
  assert.deepEqual(options(['--repos', 'keyshield,keyshield']).repos, ['lilaclilac09/keyshield']);
  assert.match(overlayItem('AGENTS.md', '# One\n## Two'), /AGENTS.md — One \/ Two/);
  const dir = mkdtempSync(join(tmpdir(), 'acceptance-test-'));
  try {
    const path = join(dir, 'files');
    for (const content of ['x.tsx\ny.css\n', '["x.tsx",{"filename":"y.css"}]']) {
      writeFileSync(path, content);
      assert.deepEqual(readFiles(path), ['x.tsx', 'y.css']);
    }
    writeFileSync(path, '[{}]');
    assert.throws(() => readFiles(path), /Invalid/);
  } finally { rmSync(dir, { recursive: true }); }
});

test('sweep paginates all states and stops at the update cutoff, including empty result', () => {
  let calls = 0;
  const recent = { updated_at: '2026-01-10T00:00:00Z' };
  const older = { updated_at: '2025-01-01T00:00:00Z' };
  const prs = recentPRs('owner/repo', Date.parse('2026-01-01'), endpoint => {
    assert.match(endpoint, /state=all/);
    calls++;
    return calls === 1 ? Array(100).fill(recent) : [recent, older];
  });
  assert.equal(calls, 2);
  assert.equal(prs.length, 101);
  assert.deepEqual(recentPRs('owner/repo', 0, () => []), []);
  assert.throws(() => recentPRs('owner/repo', 0, () => { throw new Error('API 403'); }), /API 403/);
});
