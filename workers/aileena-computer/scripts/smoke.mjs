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
  body: JSON.stringify({ command: 'npm install' }),
});
assert('npm exec 400', blockedExec.res.status === 400, String(blockedExec.res.status));

const awk = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: "printf 'a b\\n' | awk '{print $1}'" }),
});
let awkBody = {};
try {
  awkBody = JSON.parse(awk.text);
} catch {
  awkBody = { raw: awk.text };
}
assert('owner awk', awk.res.ok && String(awkBody.stdout || '').includes('a'), `${awk.res.status} ${awk.text.slice(0, 160)}`);

const curl = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'curl -sI https://example.com' }),
});
let curlBody = {};
try {
  curlBody = JSON.parse(curl.text);
} catch {
  curlBody = { raw: curl.text };
}
assert(
  'owner curl',
  curl.res.ok && /HTTP\//i.test(String(curlBody.stdout || '') + String(curlBody.stderr || '')),
  `${curl.res.status} ${curl.text.slice(0, 200)}`,
);

const jq = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: `printf '{"a":1}' | jq .a` }),
});
let jqBody = {};
try {
  jqBody = JSON.parse(jq.text);
} catch {
  jqBody = { raw: jq.text };
}
assert('owner jq', jq.res.ok && String(jqBody.stdout || '').trim() === '1', `${jq.res.status} ${jq.text.slice(0, 160)}`);

const otherName = await req('GET', '/c/visitor/file/workspace/scratch/hello.txt');
assert('non-cwid name 404', otherName.res.status === 404, String(otherName.res.status));

const visitorId = 'v-testdevworker01';
const visitorPayload = `visitor isolation ${new Date().toISOString()}\n`;
const visitorPut = await req('PUT', `/c/${visitorId}/file/workspace/scratch/hello.txt`, {
  headers: { 'content-type': 'text/plain' },
  body: visitorPayload,
});
assert('visitor put scratch 204', visitorPut.res.status === 204, String(visitorPut.res.status));

const visitorGet = await req('GET', `/c/${visitorId}/file/workspace/scratch/hello.txt`);
assert(
  'visitor get own scratch',
  visitorGet.res.ok && visitorGet.text.includes('visitor isolation'),
  `${visitorGet.res.status} ${visitorGet.text.slice(0, 80)}`,
);

const ownerStill = await req('GET', '/c/owner/file/workspace/scratch/hello.txt');
assert(
  'owner scratch is not visitor scratch',
  ownerStill.res.ok && ownerStill.text.includes('hello from aileena-computer') && !ownerStill.text.includes('visitor isolation'),
  ownerStill.text.slice(0, 80),
);

const otherVisitor = await req('GET', '/c/v-otherxxxxxxxx/file/workspace/scratch/hello.txt');
assert('other visitor missing 404', otherVisitor.res.status === 404, String(otherVisitor.res.status));

const visitorCurl = await req('POST', `/c/${visitorId}/exec`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'curl -sI https://example.com' }),
});
assert('visitor curl 400', visitorCurl.res.status === 400, String(visitorCurl.res.status));

const findCmd = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'find scratch -name hello.txt', cwd: '/workspace' }),
});
let findBody = {};
try {
  findBody = JSON.parse(findCmd.text);
} catch {
  findBody = { raw: findCmd.text };
}
assert(
  'owner find',
  findCmd.res.ok && /hello\.txt/.test(String(findBody.stdout || '')),
  `${findCmd.res.status} ${findCmd.text.slice(0, 160)}`,
);

const yq = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'yq .' }),
});
assert('owner yq 400 (not allowlisted; node:process missing in workerd)', yq.res.status === 400, String(yq.res.status));

const visitorYq = await req('POST', `/c/${visitorId}/exec`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'yq .' }),
});
assert('visitor yq 400', visitorYq.res.status === 400, String(visitorYq.res.status));

const visitorFind = await req('POST', `/c/${visitorId}/exec`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'find scratch -name hello.txt', cwd: '/workspace' }),
});
assert('visitor find allowed', visitorFind.res.ok, String(visitorFind.res.status));

const mkdir = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'mkdir -p scratch/deeper', cwd: '/workspace' }),
});
assert('owner mkdir -p scratch', mkdir.res.ok, String(mkdir.res.status));

const tree = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'tree scratch', cwd: '/workspace' }),
});
let treeBody = {};
try {
  treeBody = JSON.parse(tree.text);
} catch {
  treeBody = { raw: tree.text };
}
assert(
  'owner tree',
  tree.res.ok && /hello\.txt/.test(String(treeBody.stdout || '')),
  `${tree.res.status} ${tree.text.slice(0, 160)}`,
);

const fileCmd = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'file scratch/hello.txt', cwd: '/workspace' }),
});
let fileBody = {};
try {
  fileBody = JSON.parse(fileCmd.text);
} catch {
  fileBody = { raw: fileCmd.text };
}
assert(
  'owner file',
  fileCmd.res.ok && /hello\.txt/.test(String(fileBody.stdout || '')),
  `${fileCmd.res.status} ${fileCmd.text.slice(0, 160)}`,
);

const xan = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: "printf 'a,b\\n1,2\\n' | xan count" }),
});
let xanBody = {};
try {
  xanBody = JSON.parse(xan.text);
} catch {
  xanBody = { raw: xan.text };
}
assert(
  'owner xan',
  xan.res.ok && /[12]/.test(String(xanBody.stdout || '')),
  `${xan.res.status} ${xan.text.slice(0, 160)}`,
);

const visitorFile = await req('POST', `/c/${visitorId}/exec`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'file scratch/hello.txt' }),
});
assert('visitor file 400', visitorFile.res.status === 400, String(visitorFile.res.status));

const visitorXan = await req('POST', `/c/${visitorId}/exec`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'xan count' }),
});
assert('visitor xan 400', visitorXan.res.status === 400, String(visitorXan.res.status));

const htmlPut = await req('PUT', '/c/owner/file/workspace/scratch/t.html', {
  headers: { 'content-type': 'text/plain' },
  body: '<h1>Hi</h1>',
});
assert('put html 204', htmlPut.res.status === 204, String(htmlPut.res.status));
const md = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'html-to-markdown scratch/t.html', cwd: '/workspace' }),
});
let mdBody = {};
try {
  mdBody = JSON.parse(md.text);
} catch {
  mdBody = { raw: md.text };
}
assert(
  'owner html-to-markdown',
  md.res.ok && /Hi/.test(String(mdBody.stdout || '')),
  `${md.res.status} ${md.text.slice(0, 200)}`,
);

const visitorMd = await req('POST', `/c/${visitorId}/exec`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'html-to-markdown scratch/t.html' }),
});
assert('visitor html-to-markdown 400', visitorMd.res.status === 400, String(visitorMd.res.status));

const getBody = await req('POST', '/c/owner/exec', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ command: 'curl -sL --max-time 8 https://example.com/' }),
});
let getBodyJson = {};
try {
  getBodyJson = JSON.parse(getBody.text);
} catch {
  getBodyJson = { raw: getBody.text };
}
assert(
  'owner curl GET body',
  getBody.res.ok && /Example Domain/i.test(String(getBodyJson.stdout || '')),
  `${getBody.res.status} ${String(getBodyJson.stdout || getBody.text).slice(0, 160)}`,
);

const storePath = '/c/v-testdevworker01/file/workspace/reports/_store/tasks.json';
const putStore1 = await req('PUT', storePath, {
  headers: { 'content-type': 'text/plain' },
  body: '{"n":1}',
});
const putStore2 = await req('PUT', storePath, {
  headers: { 'content-type': 'text/plain' },
  body: '{"n":2}',
});
const getStore = await req('GET', storePath);
assert('overwrite tasks.json 204', putStore1.res.status === 204 && putStore2.res.status === 204, `${putStore1.res.status} ${putStore2.res.status}`);
assert('overwrite tasks.json read', getStore.res.ok && getStore.text.includes('"n":2'), `${getStore.res.status} ${getStore.text.slice(0, 80)}`);

if (fails.length) {
  console.error(`\n${fails.length} failed`);
  process.exit(1);
}
console.log('\nsmoke ok');
