#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolveConfig, requireConfig } from './config.mjs';
import { chatCompletion, getBalance, listModels } from './client.mjs';

function printHelp() {
  console.log(`DeepSeek Client — official API, your purchased key.

Usage:
  node src/cli.mjs check
  node src/cli.mjs models
  node src/cli.mjs balance
  node src/cli.mjs chat [--stream] [--thinking] [--model NAME] [prompt...]
  node src/cli.mjs chat

Put the key you bought on platform.deepseek.com in .env as DEEPSEEK_API_KEY.
Requests go to https://api.deepseek.com. DeepSeek bills that key.
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = { stream: false, thinking: false, model: null, help: false };
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '-h' || a === '--help') flags.help = true;
    else if (a === '--stream') flags.stream = true;
    else if (a === '--thinking') flags.thinking = true;
    else if (a === '--model') {
      flags.model = args[i + 1];
      i += 1;
    } else if (a.startsWith('--model=')) flags.model = a.slice('--model='.length);
    else positional.push(a);
  }
  return { cmd: positional[0] || 'help', rest: positional.slice(1), flags };
}

function applyFlags(cfg, flags) {
  if (flags.model) cfg.model = flags.model;
  if (flags.thinking) cfg.thinking = true;
  return cfg;
}

async function cmdCheck() {
  const cfg = resolveConfig();
  console.log(JSON.stringify({
    ok: cfg.ok,
    errors: cfg.errors,
    baseURL: cfg.baseURL,
    model: cfg.model,
    thinking: cfg.thinking,
    apiKey: cfg.keyMasked,
    quotaInThisClient: 'none',
  }, null, 2));
  if (!cfg.ok) process.exitCode = 2;
}

async function cmdModels(cfg) {
  const json = await listModels(cfg);
  console.log(JSON.stringify(json, null, 2));
}

async function cmdBalance(cfg) {
  const json = await getBalance(cfg);
  console.log(JSON.stringify(json, null, 2));
}

async function oneShot(cfg, prompt, stream) {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];
  if (stream) {
    const result = await chatCompletion(cfg, {
      messages,
      stream: true,
      onDelta: (d) => {
        if (d.type === 'reasoning') process.stderr.write(d.text);
        else process.stdout.write(d.text);
      },
    });
    process.stdout.write('\n');
    if (result.finishReason) {
      console.error(`finish_reason=${result.finishReason}`);
    }
    return;
  }
  const result = await chatCompletion(cfg, { messages, stream: false });
  if (result.reasoning) console.error(result.reasoning);
  console.log(result.content);
}

async function interactive(cfg, stream) {
  const rl = createInterface({ input, output });
  const messages = [{ role: 'system', content: 'You are a helpful assistant.' }];
  console.error(`DeepSeek ${cfg.model} @ ${cfg.baseURL}  key=${cfg.keyMasked}`);
  console.error('Using your purchased DeepSeek key. Type /exit to quit.');
  try {
    while (true) {
      const line = (await rl.question('you> ')).trim();
      if (!line) continue;
      if (line === '/exit' || line === '/quit') break;
      messages.push({ role: 'user', content: line });
      process.stdout.write('deepseek> ');
      const result = await chatCompletion(cfg, {
        messages,
        stream,
        onDelta: stream
          ? (d) => {
            if (d.type === 'content') process.stdout.write(d.text);
          }
          : undefined,
      });
      if (!stream) process.stdout.write(result.content);
      process.stdout.write('\n');
      messages.push({ role: 'assistant', content: result.content || '' });
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const { cmd, rest, flags } = parseArgs(process.argv);
  if (flags.help || cmd === 'help') {
    printHelp();
    return;
  }
  if (cmd === 'check') {
    await cmdCheck();
    return;
  }
  const cfg = applyFlags(requireConfig(), flags);
  if (cmd === 'models') await cmdModels(cfg);
  else if (cmd === 'balance') await cmdBalance(cfg);
  else if (cmd === 'chat') {
    const prompt = rest.join(' ').trim();
    if (prompt) await oneShot(cfg, prompt, flags.stream);
    else await interactive(cfg, flags.stream);
  } else {
    printHelp();
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
