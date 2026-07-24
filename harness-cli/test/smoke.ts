/**
 * Offline smoke checks for the harness core + mock provider.
 */
import { Harness } from '../src/core/harness.ts';
import { BUILTIN_TOOLS } from '../src/tools/builtin.ts';
import { createMockProvider } from '../src/providers/mock.ts';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const harness = Harness.builder({
    provider: createMockProvider(),
    tools: BUILTIN_TOOLS.filter((t) => t.name !== 'write_file' && t.name !== 'shell'),
    cwd: root,
    system: 'test',
  }).build();

  const list = await (await harness.prompt('list files')).result();
  assert(list.toolCalls.some((c) => c.name === 'list_dir'), 'expected list_dir');
  assert(list.text.includes('DESIGN.md') || list.toolResults[0]?.output.includes('DESIGN.md'), 'DESIGN.md missing');

  const code = await (await harness.prompt('use code mode to count md files')).result();
  assert(code.toolCalls.some((c) => c.name === 'code_mode'), 'expected code_mode');
  assert(/md/i.test(code.text), 'expected md summary');

  const forked = await harness.fork();
  assert(forked.sessionId !== harness.sessionId, 'fork should new session id');

  console.log('smoke ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
