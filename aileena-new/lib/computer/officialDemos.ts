/**
 * Official cloudflare/computer catalog, runnable from the owner CLI.
 * Same workspace. No Linux container. No fake success.
 */
import { callComputer, computerTools } from '../mcp/computer';
import { cfExec, cfExecJs, cfPutFile } from './cfClient';
import { clip } from './redact';

export type OfficialDemoResult = { ok: boolean; text: string };

export const OFFICIAL_DEMO_NAMES = [
  'worker-shell',
  'js',
  'egress',
  'mcp',
  'rlm',
  'think',
  'compare',
  'tutorial',
  'artifacts',
  'assets',
  'container',
] as const;

export type OfficialDemoName = (typeof OFFICIAL_DEMO_NAMES)[number];

const JS_HELLO = `import fs from "node:fs/promises";
export default async () => {
  const raw = await fs.readFile("/workspace/scratch/demo/js-hello.json", "utf8");
  return { backend: "worker-javascript", heard: JSON.parse(raw).example };
};
`;

const JS_REDUCE = `import fs from "node:fs/promises";
export default async () => {
  const raw = await fs.readFile("/workspace/scratch/demo/rlm-long.md", "utf8");
  const heads = raw.split("\\n").filter((l) => l.startsWith("#")).slice(0, 8);
  return { backend: "worker-javascript", headings: heads, chars: raw.length };
};
`;

const JS_FETCH = `export default async () => {
  const res = await fetch("https://example.com/", { method: "HEAD" });
  return { backend: "worker-javascript", egress: "direct", status: res.status, ok: res.ok };
};
`;

const JS_FETCH_NONE = `export default async () => {
  try {
    const res = await fetch("https://example.com/", { method: "HEAD" });
    return { backend: "worker-javascript-none", egress: "none", leaked: true, status: res.status };
  } catch (err) {
    return { backend: "worker-javascript-none", egress: "none", blocked: true, error: String(err).slice(0, 160) };
  }
};
`;

const JS_THINK = `import fs from "node:fs/promises";
export default async () => {
  const listing = await fs.readFile("/workspace/scratch/demo/think-cwd.txt", "utf8");
  const names = listing.split("\\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  return { cwd: "/workspace", files: names, note: "workspace as cwd · not @cloudflare/think package" };
};
`;

const JS_COMPARE = `import fs from "node:fs/promises";
export default async () => {
  const raw = await fs.readFile("/workspace/scratch/demo/compare.txt", "utf8");
  return { backend: "worker-javascript", words: raw.trim().split(/\\s+/).filter(Boolean).length };
};
`;

function ok(text: string): OfficialDemoResult {
  return { ok: true, text };
}

function fail(text: string): OfficialDemoResult {
  return { ok: false, text };
}

export function parseOfficialDemo(cmd: string): OfficialDemoName | 'worker-shell' | null {
  const t = cmd.trim();
  const first = t.split(/\s+/)[0] || '';
  let rest = '';
  if (first === 'demo') rest = t.replace(/^demo\b/i, '').trim();
  else if (OFFICIAL_DEMO_NAMES.includes(first as OfficialDemoName)) rest = first;
  else return null;
  const key = rest.split(/\s+/)[0]?.toLowerCase() || 'worker-shell';
  if (!key || key === 'worker-shell' || key === 'shell') return 'worker-shell';
  if (key === 'js' || key === 'javascript' || key === 'worker-javascript') return 'js';
  if (key === 'egress') return 'egress';
  if (key === 'mcp') return 'mcp';
  if (key === 'rlm') return 'rlm';
  if (key === 'think') return 'think';
  if (key === 'compare' || key === 'think-compare' || key === 'think-compare-runtimes') return 'compare';
  if (key === 'tutorial') return 'tutorial';
  if (key === 'artifacts') return 'artifacts';
  if (key === 'assets') return 'assets';
  if (key === 'container') return 'container';
  return null;
}

export async function runOfficialDemo(
  name: OfficialDemoName | 'worker-shell',
  workspaceId: string,
  cwd: string,
): Promise<OfficialDemoResult> {
  try {
    if (name === 'worker-shell') return runShellDemo(workspaceId, cwd);
    if (name === 'js') return runJsDemo(workspaceId, cwd);
    if (name === 'egress') return runEgressDemo(workspaceId, cwd);
    if (name === 'mcp') return runMcpDemo(workspaceId, cwd);
    if (name === 'rlm') return runRlmDemo(workspaceId, cwd);
    if (name === 'think') return runThinkDemo(workspaceId, cwd);
    if (name === 'compare') return runCompareDemo(workspaceId, cwd);
    if (name === 'tutorial') return runTutorialDemo(workspaceId, cwd);
    if (name === 'artifacts') return runArtifactsDemo(workspaceId, cwd);
    if (name === 'assets') return runAssetsDemo(workspaceId, cwd);
    return runContainerDemo();
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'demo failed');
  }
}

async function runShellDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const path = '/workspace/scratch/demo/worker-shell.json';
  await cfPutFile(
    path,
    `${JSON.stringify({ example: 'worker-shell', backend: 'just-bash', container: false }, null, 2)}\n`,
    workspaceId,
  );
  const jq = await cfExec('jq -r .example /workspace/scratch/demo/worker-shell.json', cwd, workspaceId);
  const named = (jq.stdout || jq.stderr || '').trim();
  return ok([
      'examples/worker-shell — running',
      'PUT  /c/owner/file/workspace/scratch/demo/worker-shell.json',
      `POST /c/owner/exec  jq -r .example → ${named}`,
    ].join('\n'),
  );
}

async function runJsDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  await cfPutFile(
    '/workspace/scratch/demo/js-hello.json',
    `${JSON.stringify({ example: 'worker-javascript' })}\n`,
    workspaceId,
  );
  const run = await cfExecJs(JS_HELLO, workspaceId);
  return ok([
      'examples/worker-javascript — running',
      'POST /c/owner/exec  backend=worker-javascript',
      `exit ${run.exitCode}  backend=${run.backend}`,
      clip(JSON.stringify(run.value ?? { stdout: run.stdout }, null, 2), 800),
    ].join('\n'),
  );
}

async function runEgressDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const shell = await cfExec('curl -sI --max-time 8 https://example.com', cwd, workspaceId);
  const shellHit = /HTTP\//i.test(`${shell.stdout}\n${shell.stderr}`);
  let jsLine = 'js direct: failed';
  try {
    const js = await cfExecJs(JS_FETCH, workspaceId);
    jsLine = `js direct: ${JSON.stringify(js.value)}`;
  } catch (err) {
    jsLine = `js direct: ${err instanceof Error ? err.message : 'failed'}`;
  }
  let noneLine = 'js none: failed';
  try {
    const none = await cfExecJs(JS_FETCH_NONE, workspaceId, { backend: 'worker-javascript-none' });
    noneLine = `js none: ${JSON.stringify(none.value)}`;
  } catch (err) {
    noneLine = `js none (blocked or error): ${err instanceof Error ? err.message : 'failed'}`;
  }
  return ok([
      'examples/egress — running (no container backend)',
      `worker-shell direct: ${shellHit ? 'HTTP from example.com' : 'no HTTP'}`,
      jsLine,
      noneLine,
      'http-gateway / custom playground: not bound (needs a gateway Fetcher)',
    ].join('\n'),
  );
}

async function runMcpDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const tools = computerTools()
    .map((t) => t.name)
    .join(' ');
  const exec = await callComputer('exec', { command: 'echo mcp-ok' }, workspaceId);
  const read = await callComputer('read', { path: '/workspace/etc/passwd' }, workspaceId);
  return ok([
      'examples/mcp — running (in-process computer, no Linux / no Code Mode package)',
      `tools: ${tools}`,
      `exec echo: ${exec.ok ? exec.text.trim() : exec.text}`,
      `read /workspace/etc/passwd blocked: ${read.blocked === true || read.ok === false}`,
    ].join('\n'),
  );
}

async function runRlmDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const long = [
    '# Official catalog',
    'worker-shell is bound.',
    '# Worker JavaScript',
    'ESM reduce reads the workspace.',
    '# Container',
    'computerd stays unbound.',
    '',
  ].join('\n');
  await cfPutFile('/workspace/scratch/demo/rlm-long.md', long, workspaceId);
  const run = await cfExecJs(JS_REDUCE, workspaceId);
  return ok([
      'examples/rlm — running (JS reduce of workspace context; no extra model workers)',
      clip(JSON.stringify(run.value, null, 2), 800),
    ].join('\n'),
  );
}

async function runThinkDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const ls = await cfExec('ls /workspace/scratch/demo', cwd, workspaceId);
  await cfPutFile('/workspace/scratch/demo/think-cwd.txt', `${ls.stdout || ''}\n`, workspaceId);
  const run = await cfExecJs(JS_THINK, workspaceId);
  await cfPutFile(
    '/workspace/scratch/demo/think.md',
    `# think\n\nworkspace cwd. files: ${JSON.stringify(run.value)}\n`,
    workspaceId,
  );
  return ok([
      'examples/think — running (workspace as cwd · useThink compatibility on the DO)',
      'not a standalone @cloudflare/think chat agent',
      clip(JSON.stringify(run.value, null, 2), 800),
      'wrote /workspace/scratch/demo/think.md',
    ].join('\n'),
  );
}

async function runCompareDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  await cfPutFile('/workspace/scratch/demo/compare.txt', 'one two three four five\n', workspaceId);
  const shell = await cfExec('wc -w /workspace/scratch/demo/compare.txt', cwd, workspaceId);
  const js = await cfExecJs(JS_COMPARE, workspaceId);
  return ok([
      'examples/think-compare-runtimes — same file, two bound runtimes (no container)',
      `worker-shell wc -w: ${(shell.stdout || '').trim()}`,
      `worker-javascript words: ${JSON.stringify(js.value)}`,
    ].join('\n'),
  );
}

async function runTutorialDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const md = `# sesame noodles\n\n- noodles\n- sesame\n- scallion\n\nboil, toss, eat.\n`;
  await cfPutFile('/workspace/scratch/demo/recipe.md', md, workspaceId);
  await cfPutFile('/workspace/scratch/demo/recipe.pdf', tinyPdf('aileena recipe'), workspaceId);
  return ok([
      'examples/tutorial — running (host half + tiny PDF)',
      'wrote /workspace/scratch/demo/recipe.md',
      'wrote /workspace/scratch/demo/recipe.pdf',
      'not pandoc · no Linux container',
    ].join('\n'),
  );
}

async function runArtifactsDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  await cfPutFile(
    '/workspace/scratch/artifacts/worker/wrangler.jsonc',
    '{\n  "name": "aileena-scratch-worker",\n  "main": "src/index.ts",\n  "compatibility_date": "2026-05-26"\n}\n',
    workspaceId,
  );
  await cfPutFile(
    '/workspace/scratch/artifacts/worker/src/index.ts',
    'export default { fetch() { return new Response("aileena scratch worker"); } };\n',
    workspaceId,
  );
  return ok([
      'examples/artifacts — scaffold running',
      'wrote /workspace/scratch/artifacts/worker/wrangler.jsonc',
      'wrote /workspace/scratch/artifacts/worker/src/index.ts',
      'publish: needs Cloudflare ARTIFACTS binding (not set)',
    ].join('\n'),
  );
}

async function runAssetsDemo(workspaceId: string, cwd: string): Promise<OfficialDemoResult> {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="240" height="80" fill="#0b2422"/><text x="16" y="48" fill="#8fe6dd" font-size="18">aileena assets</text></svg>\n';
  await cfPutFile('/workspace/scratch/assets/share.svg', svg, workspaceId);
  return ok([
      'examples/assets — file written',
      'wrote /workspace/scratch/assets/share.svg',
      'presigned share: needs R2 + createAssets (not bound · no R2 in computer v1)',
    ].join('\n'),
  );
}

function runContainerDemo(): OfficialDemoResult {
  return ok([
      'examples/container — not possible on this isolate',
      'needs Workers Containers + computerd image + CloudflareContainerBackend',
      'not binding that here (second computer / paid slice)',
      'type demo js · demo egress · demo compare for the bound official surfaces',
    ].join('\n'),
  );
}

export async function runJsSource(source: string, workspaceId: string): Promise<OfficialDemoResult> {
  const run = await cfExecJs(source, workspaceId);
  const text = [
    `backend=${run.backend} exit=${run.exitCode}`,
    run.stdout,
    run.stderr,
    run.value == null ? '' : clip(JSON.stringify(run.value, null, 2), 800),
  ]
    .filter(Boolean)
    .join('\n');
  return { ok: run.exitCode === 0, text };
}

function tinyPdf(title: string): string {
  const safe = title.replace(/[()\\]/g, ' ').slice(0, 40);
  const stream = `BT /F1 16 Tf 40 140 Td (${safe}) Tj ET`;
  return [
    '%PDF-1.1',
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj',
    `4 0 obj<< /Length ${stream.length} >>stream`,
    stream,
    'endstream',
    'endobj',
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
    'trailer<< /Root 1 0 R >>',
    '%%EOF',
    '',
  ].join('\n');
}
