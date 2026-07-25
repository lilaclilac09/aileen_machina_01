/**
 * Offline smoke: core loop + rules + apply_patch + review path + mcp registry.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Harness } from '../src/core/harness.ts';
import { BUILTIN_TOOLS } from '../src/tools/builtin.ts';
import { createMockProvider } from '../src/providers/mock.ts';
import { applyUnifiedDiff } from '../src/tools/applyPatch.ts';
import { loadRules } from '../src/core/rules.ts';
import { addMcpServer, mcpToolsFromConfig, removeMcpServer } from '../src/mcp/config.ts';
import { buildHarness, selectTools } from '../src/adapters/factory.ts';
import { runCursorCli } from '../src/adapters/cursorCli.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const events: string[] = [];
  const harness = Harness.builder({
    provider: createMockProvider(),
    tools: BUILTIN_TOOLS.filter((t) => !['write_file', 'shell', 'apply_patch'].includes(t.name)),
    cwd: root,
    system: 'test',
    onEvent: (e) => events.push(e.type),
  }).build();

  const list = await (await harness.prompt('list files')).result();
  assert(list.toolCalls.some((c) => c.name === 'list_dir'), 'expected list_dir');
  assert(events.includes('turn.start') && events.includes('tool.start') && events.includes('turn.end'), 'events');

  const code = await (await harness.prompt('use code mode to count md files')).result();
  assert(code.toolCalls.some((c) => c.name === 'code_mode'), 'expected code_mode');

  const forked = await harness.fork();
  assert(forked.sessionId !== harness.sessionId, 'fork id');

  // apply_patch unit
  const tmp = mkdtempSync(join(tmpdir(), 'hx-patch-'));
  try {
    const report = applyUnifiedDiff(
      tmp,
      `--- /dev/null
+++ b/hello.txt
@@ -0,0 +1,1 @@
+hi
`,
    );
    assert(report.includes('hello.txt'), report);
    assert(readFileSync(join(tmp, 'hello.txt'), 'utf8').includes('hi'), 'patch content');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  // rules loader
  const system = loadRules(root, 'base');
  assert(system.includes('TOKEN-HX-RULES'), 'rules not loaded');

  // mcp registry projection
  addMcpServer({ name: 'hxsmoke', command: 'false', tools: [{ name: 'ping' }] });
  try {
    const tools = mcpToolsFromConfig();
    assert(tools.some((t) => t.name === 'mcp__hxsmoke__ping'), 'mcp stub missing');
    const selected = selectTools({ write: false, shell: false });
    assert(selected.some((t) => t.name === 'mcp__hxsmoke__ping'), 'mcp not in selectTools');
  } finally {
    removeMcpServer('hxsmoke');
  }

  // review preset via factory
  const review = buildHarness({
    provider: 'mock',
    cwd: root,
    write: false,
    shell: false,
    readOnly: true,
    systemExtra: 'hx review mode',
  });
  const reviewed = await (await review.harness.prompt('review')).result();
  assert(reviewed.toolCalls.length >= 1, 'review should use tools');
  assert(review.resolved.profile === 'ask' || review.resolved.readOnly, 'review read-only resolved');

  // Cursor ask adapter (oneshot)
  await runCursorCli(['-p', 'ask about harness layout', '--mode', 'ask', '--cwd', root, '--output-format', 'json']);

  console.log('smoke ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
