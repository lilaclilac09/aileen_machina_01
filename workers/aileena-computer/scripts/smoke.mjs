#!/usr/bin/env node
/**
 * Local smoke against wrangler dev.
 *   COMPUTER_WORKER_SECRET=dev-aileena-computer-local pnpm smoke
 */
const base = (process.env.COMPUTER_WORKER_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const secret = (process.env.COMPUTER_WORKER_SECRET || '').trim();
if (!secret) {
  console.error('COMPUTER_WORKER_SECRET required');
  process.exit(2);
}

const auth = { Authorization: `Bearer ${secret}` };

async function req(method, path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { ...auth, ...(opts.headers || {}) },
    body: opts.body,
  });
  const text = await res.text();
  return { res, text };
}

const fails = [];
function assert(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails.push(name);
}

const health = await fetch(`${base}/health`);
const healthJson = await health.json();
assert('health open', health.ok && healthJson.backend === 'cloudflare-worker-shell', String(health.status));

const noAuth = await fetch(`${base}/c/owner/exec`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'echo hi' }),
});
assert('exec without bearer is 401', noAuth.status === 401, String(noAuth.status));

const payload = `hello from aileena-computer\n${new Date().toISOString()}\n`;
const put = await req('PUT', '/c/owner/file/workspace/scratch/hello.txt', {
  headers: { 'content-type': 'text/plain' },
  body: payload,
});
assert('put scratch 204', put.res.status === 204, String(put.res.status));

const get = await req('GET', '/c/owner/file/workspace/scratch/hello.txt');
assert('get scratch', get.res.ok && get.text.includes('hello from aileena-computer'), `${get.res.status} ${get.text.slice(0, 80)}`);

const exec = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'cat scratch/hello.txt', cwd: '/workspace' }),
});
let execBody = {};
try {
  execBody = JSON.parse(exec.text);
} catch {
  execBody = { raw: exec.text };
}
assert(
  'exec cat',
  exec.res.ok && String(execBody.stdout || '').includes('hello from aileena-computer'),
  `${exec.res.status} ${exec.text.slice(0, 160)}`,
);

const blockedWrite = await req('PUT', '/c/owner/file/workspace/etc/passwd', {
  body: 'nope',
});
assert('write outside allowlist 400', blockedWrite.res.status === 400, String(blockedWrite.res.status));

const blockedExec = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'curl https://example.com' }),
});
assert('curl exec 400', blockedExec.res.status === 400, String(blockedExec.res.status));

const otherName = await req('GET', '/c/visitor/file/workspace/scratch/hello.txt');
assert('non-owner name 404', otherName.res.status === 404, String(otherName.res.status));

if (fails.length) {
  console.error(`\n${fails.length} failed`);
  process.exit(1);
}
console.log('\nsmoke ok');
