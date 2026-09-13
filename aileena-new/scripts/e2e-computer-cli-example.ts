/**
 * End-to-end owner CLI coding example against a live Next + worker-shell.
 *
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm exec tsx scripts/e2e-computer-cli-example.ts
 *
 * Writes /opt/cursor/artifacts/computer_cli_e2e_example.log
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.VERIFY_OUT_DIR ?? '/opt/cursor/artifacts';

const GREET = `export function greet(name: string): string {
  return \`hello, \${name}\`;
}
`;

const MAIN = `import { greet } from './greet';

const who = 'aileena';
console.log(greet(who));
`;

const PKG = `{
  "name": "cli-demo",
  "private": true,
  "type": "module"
}
`;

type Step = { cmd: string; expect: RegExp | string };

const STEPS: Step[] = [
  { cmd: 'cd', expect: '/workspace' },
  { cmd: 'pwd', expect: '/workspace' },
  { cmd: 'mkdir -p scratch/cli-demo', expect: /exit 0|cli-demo|^$/ },
  { cmd: 'cd scratch/cli-demo', expect: '/workspace/scratch/cli-demo' },
  { cmd: `put greet.ts\n${GREET}`, expect: /greet\.ts/ },
  { cmd: `put main.ts\n${MAIN}`, expect: /main\.ts/ },
  { cmd: `put package.json\n${PKG}`, expect: /package\.json/ },
  { cmd: 'ls', expect: /greet\.ts/ },
  { cmd: 'cat greet.ts', expect: /export function greet/ },
  { cmd: 'cat main.ts', expect: /hello, \$\{name\}|greet\(who\)/ },
  { cmd: 'jq -r .name package.json', expect: 'cli-demo' },
  { cmd: 'cd /workspace', expect: '/workspace' },
  { cmd: 'help', expect: /demo container/ },
  { cmd: 'examples', expect: /examples\/container/ },
  { cmd: 'demo', expect: /scratch\/demo\/worker-shell\.json/ },
  { cmd: 'cat scratch/demo/worker-shell.json', expect: /"example": "worker-shell"/ },
  { cmd: 'demo js', expect: /worker-javascript/ },
  { cmd: 'demo container', expect: /Linux/ },
  { cmd: 'container node -v', expect: /v\d+/ },
  { cmd: 'demo tutorial', expect: /recipe\.md/ },
  { cmd: 'vcode scratch/vcode/voice.ts\nexport function hello() {\n  return "hi";\n}\n', expect: /voice\.ts/ },
  { cmd: 'cat scratch/vcode/voice.ts', expect: /export function hello/ },
  { cmd: 'find scratch/cli-demo -type f', expect: /greet\.ts/ },
];

async function postShell(cookie: string, cmd: string) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${BASE}/api/agent/computer/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ taskType: 'shell_exec', route: '/proof', instructions: cmd, phrase: cmd.split('\n')[0] }),
    });
    if (res.status === 429) {
      const waitSec = Math.min(Number(res.headers.get('Retry-After') || 8) + 1, 20);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }
    return res;
  }
  throw new Error('rate_limit');
}

async function poll(cookie: string, id: string, timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${BASE}/api/agent/computer/tasks/${id}`, { headers: { Cookie: cookie } });
    if (!res.ok) return { ok: false as const, status: res.status, preview: '', cwd: '' };
    const body = (await res.json()) as {
      task?: { status?: string; artifacts?: { preview?: string }[]; resultSummary?: string };
    };
    const st = body.task?.status;
    if (st === 'completed' || st === 'failed' || st === 'blocked') {
      return {
        ok: st === 'completed',
        status: st,
        preview: body.task?.artifacts?.[0]?.preview || body.task?.resultSummary || '',
        cwd: '',
      };
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { ok: false as const, status: 'timeout', preview: '', cwd: '' };
}

function match(expect: RegExp | string, text: string): boolean {
  return typeof expect === 'string' ? text.includes(expect) : expect.test(text);
}

async function main() {
  loadEnvLocal();
  await mkdir(OUT, { recursive: true });
  const cookie = `${SESSION_COOKIE}=${await createOwnerSession()}`;
  const lines: string[] = [
    `# computer CLI e2e example`,
    `base: ${BASE}`,
    `started: ${new Date().toISOString()}`,
    '',
  ];
  let failed = 0;
  for (const step of STEPS) {
    const res = await postShell(cookie, step.cmd);
    const json = res.status === 202 ? ((await res.json()) as { task?: { id?: string } }) : {};
    const id = json.task?.id || '';
    const long = /^(demo container|container\b)/.test(step.cmd);
    const done = id
      ? await poll(cookie, id, long ? 120_000 : 45_000)
      : { ok: false as const, status: String(res.status), preview: '', cwd: '' };
    const preview = `${done.preview}\n${done.status}`;
    const ok = done.ok && match(step.expect, preview);
    if (!ok) failed += 1;
    lines.push(`## ${ok ? 'PASS' : 'FAIL'}  ${step.cmd.split('\n')[0]}`);
    lines.push(`status: ${done.status}`);
    lines.push(done.preview || '(empty)');
    lines.push('');
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${step.cmd.split('\n')[0]}  →  ${(done.preview || String(done.status)).slice(0, 80)}`,
    );
  }
  const listed = await fetch(`${BASE}/api/agent/computer/tasks`, { headers: { Cookie: cookie } });
  const listedJson = listed.ok ? ((await listed.json()) as { cwd?: string; cloudflareComputer?: boolean }) : {};
  lines.push(`cwd after session: ${listedJson.cwd}`);
  lines.push(`cloudflareComputer: ${listedJson.cloudflareComputer}`);
  lines.push(`result: ${STEPS.length - failed}/${STEPS.length}`);
  const logPath = join(OUT, 'computer_cli_e2e_example.log');
  writeFileSync(logPath, lines.join('\n'));
  console.log(`\n${STEPS.length - failed}/${STEPS.length}  wrote ${logPath}`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
