import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  ALLOWED_MODELS,
  DEFAULT_MODEL,
  OFFICIAL_BASE_URL,
  loadDotEnv,
  maskKey,
  resolveConfig,
  requireConfig,
} from '../src/config.mjs';
import {
  buildChatBody,
  chatCompletion,
  extractDelta,
  getBalance,
  listModels,
  parseSseDataLines,
  redact,
} from '../src/client.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`ok  ${name}`);
    })
    .catch((err) => {
      failures.push(name);
      console.error(`FAIL ${name}`);
      console.error(err);
    });
}

await test('official base URL and current models', () => {
  assert.equal(OFFICIAL_BASE_URL, 'https://api.deepseek.com');
  assert.deepEqual(ALLOWED_MODELS, ['deepseek-v4-flash', 'deepseek-v4-pro']);
  assert.equal(DEFAULT_MODEL, 'deepseek-v4-flash');
});

await test('missing key fails closed', () => {
  const cfg = resolveConfig({ DEEPSEEK_API_KEY: '' }, {});
  assert.equal(cfg.ok, false);
  assert.match(cfg.errors[0], /DEEPSEEK_API_KEY/);
  assert.throws(() => requireConfig({ DEEPSEEK_API_KEY: '' }, {}), /DEEPSEEK_API_KEY/);
});

await test('env wins over empty file and masks key', () => {
  const cfg = resolveConfig(
    { DEEPSEEK_API_KEY: 'sk-test-abcdef1234', DEEPSEEK_MODEL: 'deepseek-v4-pro' },
    { DEEPSEEK_API_KEY: 'sk-file-should-lose' },
  );
  assert.equal(cfg.ok, true);
  assert.equal(cfg.model, 'deepseek-v4-pro');
  assert.equal(cfg.keyMasked, 'set(…1234)');
  assert.equal(maskKey('sk-ab'), 'set(****)');
});

await test('rejects unknown model', () => {
  const cfg = resolveConfig({
    DEEPSEEK_API_KEY: 'sk-test-abcdef1234',
    DEEPSEEK_MODEL: 'gpt-4o',
  }, {});
  assert.equal(cfg.ok, false);
  assert.match(cfg.errors.join(' '), /DEEPSEEK_MODEL/);
});

await test('loadDotEnv ignores comments and quotes', () => {
  const parsed = loadDotEnv(join(ROOT, '.env.example'));
  assert.equal(parsed.DEEPSEEK_API_KEY, 'sk-the-key-you-bought');
});

await test('chat body matches official OpenAI-compatible shape', () => {
  const body = buildChatBody({
    model: 'deepseek-v4-flash',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: false,
    thinking: true,
    reasoningEffort: 'high',
  });
  assert.deepEqual(body, {
    model: 'deepseek-v4-flash',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: false,
    thinking: { type: 'enabled' },
    reasoning_effort: 'high',
  });
  const quiet = buildChatBody({
    model: 'deepseek-v4-flash',
    messages: [{ role: 'user', content: 'Hi' }],
    thinking: false,
  });
  assert.deepEqual(quiet.thinking, { type: 'disabled' });
  assert.equal('reasoning_effort' in quiet, false);
});

await test('SSE parser and delta extract', () => {
  const events = parseSseDataLines('data: {"choices":[{"delta":{"content":"Hi"}}]}\ndata: [DONE]\n');
  assert.equal(events[0].json.choices[0].delta.content, 'Hi');
  assert.equal(events[1].done, true);
  const extracted = extractDelta({
    choices: [{ message: { content: 'pong', reasoning_content: 'think' }, finish_reason: 'stop' }],
  });
  assert.equal(extracted.content, 'pong');
  assert.equal(extracted.reasoning, 'think');
});

await test('redact never leaks the key', () => {
  const key = 'sk-secret-leak-me';
  const out = redact(`Bearer ${key} and also ${key}`, key);
  assert.equal(out.includes(key), false);
  assert.match(out, /redacted-key/);
});

await test('README is English and tells you to use your purchased key', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, /official DeepSeek HTTP API/i);
  assert.match(readme, /key you bought/i);
  assert.match(readme, /platform\.deepseek\.com/);
  assert.match(readme, /DEEPSEEK_API_KEY/);
  assert.match(readme, /^## How to use$/m);
  assert.match(readme, /node src\/cli\.mjs check/);
  assert.match(readme, /node src\/cli\.mjs chat "Hello from my DeepSeek key"/);
  assert.match(readme, /node src\/cli\.mjs chat$/m);
  assert.match(readme, /node src\/cli\.mjs balance/);
  assert.match(readme, /^## Alongside Cursor$/m);
  assert.match(readme, /does \*\*not\*\* bypass Cursor/i);
  assert.match(readme, /separate\*\* CLI/i);
  assert.doesNotMatch(readme, /[\u4e00-\u9fff]/);
  assert.doesNotMatch(readme, /workbench\.desktop\.main\.js|slow pool|usage-limit banner/i);
});

await test('package has no runtime dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

await test('mock /chat/completions + /models + /user/balance', async () => {
  const seen = { auth: null, chatBody: null, paths: [] };
  const server = createServer(async (req, res) => {
    seen.paths.push(`${req.method} ${req.url}`);
    seen.auth = req.headers.authorization;
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (req.url === '/chat/completions') {
      seen.chatBody = JSON.parse(raw);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        id: 'chatcmpl-test',
        choices: [{
          message: { role: 'assistant', content: 'pong' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
      }));
      return;
    }
    if (req.url === '/models') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: [{ id: 'deepseek-v4-flash' }] }));
      return;
    }
    if (req.url === '/user/balance') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ is_available: true, balance_infos: [] }));
      return;
    }
    res.writeHead(404);
    res.end('nope');
  });
  const port = await listen(server);
  const cfg = {
    apiKey: 'sk-mock-key-9999',
    baseURL: `http://127.0.0.1:${port}`,
    model: 'deepseek-v4-flash',
    thinking: false,
  };
  try {
    const chat = await chatCompletion(cfg, {
      messages: [{ role: 'user', content: 'ping' }],
      stream: false,
    });
    assert.equal(chat.content, 'pong');
    assert.equal(seen.auth, 'Bearer sk-mock-key-9999');
    assert.equal(seen.chatBody.model, 'deepseek-v4-flash');
    assert.deepEqual(seen.chatBody.thinking, { type: 'disabled' });
    const models = await listModels(cfg);
    assert.equal(models.data[0].id, 'deepseek-v4-flash');
    const balance = await getBalance(cfg);
    assert.equal(balance.is_available, true);
    assert.deepEqual(seen.paths, [
      'POST /chat/completions',
      'GET /models',
      'GET /user/balance',
    ]);
  } finally {
    await close(server);
  }
});

await test('mock streaming SSE', async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.write('data: {"choices":[{"delta":{"content":"hel"}}]}\n\n');
    res.write('data: {"choices":[{"delta":{"content":"lo"},"finish_reason":"stop"}]}\n\n');
    res.write('data: [DONE]\n\n');
    res.end();
  });
  const port = await listen(server);
  const deltas = [];
  try {
    const result = await chatCompletion({
      apiKey: 'sk-mock-key-9999',
      baseURL: `http://127.0.0.1:${port}`,
      model: 'deepseek-v4-flash',
      thinking: false,
    }, {
      messages: [{ role: 'user', content: 'x' }],
      stream: true,
      onDelta: (d) => deltas.push(d.text),
    });
    assert.equal(result.content, 'hello');
    assert.deepEqual(deltas, ['hel', 'lo']);
  } finally {
    await close(server);
  }
});

await test('cli check without key exits 2 and prints JSON', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', 'check'], {
    cwd: ROOT,
    env: { ...process.env, DEEPSEEK_API_KEY: '' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
  const json = JSON.parse(result.stdout);
  assert.equal(json.ok, false);
  assert.equal(json.quotaInThisClient, 'none');
  assert.equal(json.apiKey, 'unset');
  assert.match(result.stderr, /How to use/);
  assert.match(result.stderr, /cp \.env\.example \.env/);
});

await test('cli how prints How to use', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', 'how'], {
    cwd: ROOT,
    env: { ...process.env, DEEPSEEK_API_KEY: '' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /How to use/);
  assert.match(result.stdout, /node src\/cli\.mjs check/);
  assert.match(result.stdout, /node src\/cli\.mjs chat "Hello from my DeepSeek key"/);
  assert.match(result.stdout, /platform\.deepseek\.com/);
  assert.match(result.stdout, /does not bypass Cursor/);
});

await test('this package has no app-level quota code', () => {
  const src = [
    readFileSync(join(ROOT, 'src/client.mjs'), 'utf8'),
    readFileSync(join(ROOT, 'src/cli.mjs'), 'utf8'),
    readFileSync(join(ROOT, 'src/config.mjs'), 'utf8'),
  ].join('\n');
  assert.doesNotMatch(src, /DAILY_LIMIT|readQuota|slowPool|workbench\.desktop/);
});

if (failures.length) {
  console.error(`\n${failures.length} failed`);
  process.exit(1);
}
console.log('\nall tests passed');
