#!/usr/bin/env tsx
/**
 * Site-agent TTS: stable voice profile + chunk queue + cancellable session.
 *
 *   pnpm verify:tts-session
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareSpeakText } from '../lib/tts/speakPrep';
import { chunkSpeakableText, TTS_CHUNK_MAX, TTS_CHUNK_MIN } from '../lib/tts/chunkText';
import {
  profileFingerprint,
  resolveTtsProfile,
} from '../lib/tts/voiceProfile';
import { runTtsQueue, shouldRetryTtsStatus, TTS_UI } from '../lib/tts/runQueue';
import { ELEVEN_VOICE_ID } from '../lib/voiceAccent';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

function cps(s: string): number {
  return Array.from(s).length;
}

async function main() {
  const cleaned = prepareSpeakText(
    '# Title\n```\ncode fence\n```\nSee [docs](https://example.com/path) please.\n| a | b |\n| --- | --- |\n- bullet one\nhttps://raw.example/x\n这里用简体，不转繁体。',
  );
  assert('strips code fences', !/code fence/.test(cleaned));
  assert('strips raw URLs', !/https?:\/\//.test(cleaned));
  assert('keeps markdown link label', /docs/.test(cleaned));
  assert('strips tables', !/\| a \|/.test(cleaned));
  assert('keeps simplified Chinese', /简体/.test(cleaned) && !/簡體/.test(cleaned));
  assert('does not convert 们', prepareSpeakText('我们').includes('我们'));

  const longEn =
    'First sentence is short. ' +
    'Second sentence explains the machine with enough English words to grow. '.repeat(8) +
    'Final beat.';
  const longChunks = chunkSpeakableText(prepareSpeakText(longEn));
  assert('long English splits into several chunks', longChunks.length >= 2, String(longChunks.length));
  assert(
    'chunks stay within max',
    longChunks.every((c) => cps(c) <= TTS_CHUNK_MAX),
    longChunks.map((c) => cps(c)).join(','),
  );

  const zhPad = ('这是一句完整的中文，用来测试按句号切开，不要把半句丢掉。').repeat(24);
  const zhChunks = chunkSpeakableText(prepareSpeakText(zhPad));
  assert('Chinese splits on 。', zhChunks.length >= 2, `${zhChunks.length} chars=${cps(zhPad)}`);
  assert(
    'Chinese chunks within max',
    zhChunks.every((c) => cps(c) <= TTS_CHUNK_MAX),
  );
  assert('Chinese chunks keep punctuation', zhChunks.some((c) => /[。！？]/.test(c)));

  const mixed = 'Hello. 你好。This is mixed English and 中文 in one reply, with another sentence after that.';
  const mixedChunks = chunkSpeakableText(prepareSpeakText(mixed));
  assert('mixed language still chunks', mixedChunks.length >= 1);

  const urlSafe = prepareSpeakText('Go here https://do-not-split.example/foo/bar and rest.');
  assert('URLs removed before chunk', !/https?:\/\//.test(urlSafe));

  const tiny = chunkSpeakableText('One line.');
  assert('short reply is one chunk', tiny.length === 1);

  const sh = resolveTtsProfile({ accent: 'shanghai' });
  const sh2 = resolveTtsProfile({ accent: 'shanghai', voice: ELEVEN_VOICE_ID.shanghai });
  assert('shanghai profile stable', profileFingerprint(sh) === profileFingerprint(sh2), profileFingerprint(sh));
  const ldn = resolveTtsProfile({ accent: 'london' });
  assert('london is not shanghai auntie', !/上海阿姨/.test(ldn.instructions) && ldn.elevenVoiceId === ELEVEN_VOICE_ID.london);
  assert('london openai voice is sage', ldn.openaiVoice === 'sage');
  const pinned = resolveTtsProfile({
    accent: 'london',
    env: { accent: 'berlin', voiceId: ELEVEN_VOICE_ID.berlin },
  });
  assert('env accent pin wins', pinned.accent === 'berlin' && pinned.elevenVoiceId === ELEVEN_VOICE_ID.berlin);
  const rejected = resolveTtsProfile({ accent: 'shanghai', voice: 'not-a-real-voice-id' });
  assert('rejects unknown client voice id', rejected.elevenVoiceId === ELEVEN_VOICE_ID.shanghai);

  const fingerprints = ['a', 'b', 'c'].map(() => profileFingerprint(resolveTtsProfile({ accent: 'london' })));
  assert(
    'every chunk would share one fingerprint',
    fingerprints.every((f) => f === fingerprints[0]),
  );

  assert('retry 429', shouldRetryTtsStatus(429));
  assert('no retry 400', !shouldRetryTtsStatus(400));
  assert('compact failed copy', TTS_UI.failed === '⚡ Voice failed.');
  assert('compact busy copy', TTS_UI.busy === '⚡ Voice busy.');
  assert('compact stopped copy', TTS_UI.stopped === '⚡ Stopped.');

  const played: string[] = [];
  const stale = await runTtsQueue({
    chunks: ['one', 'two'],
    signal: new AbortController().signal,
    isCurrent: () => false,
    fetchChunk: async (text) => {
      played.push(text);
      return { ok: true, buf: new ArrayBuffer(1) };
    },
    playBuf: async () => {
      played.push('play');
    },
    onStatus: () => {},
  });
  assert('stale session does not play', stale === 'interrupted' && !played.includes('play'), stale);

  const ac = new AbortController();
  const statuses: string[] = [];
  const aborted = runTtsQueue({
    chunks: ['one', 'two', 'three'],
    signal: ac.signal,
    isCurrent: () => !ac.signal.aborted,
    fetchChunk: async () => {
      ac.abort();
      return { ok: true, buf: new ArrayBuffer(1) };
    },
    playBuf: async () => {
      played.push('late-play');
    },
    onStatus: (s) => statuses.push(s),
  });
  const abortResult = await aborted;
  assert('abort stops queue', abortResult === 'interrupted', abortResult);
  assert('late play skipped after abort', !played.includes('late-play'));

  let fetches = 0;
  const retried = await runTtsQueue({
    chunks: ['hello'],
    signal: new AbortController().signal,
    isCurrent: () => true,
    fetchChunk: async () => {
      fetches += 1;
      if (fetches === 1) return { ok: false, status: 429 };
      return { ok: true, buf: new ArrayBuffer(2) };
    },
    playBuf: async () => {},
    onStatus: () => {},
  });
  assert('429 retries once then plays', retried === 'complete' && fetches === 2, `${retried} fetches=${fetches}`);

  const orb = read('components/AgentVoiceOrb.tsx');
  const route = read('app/api/tts/route.ts');
  assert('orb uses runTtsQueue', /runTtsQueue/.test(orb));
  assert('orb does not slice 4000-char one-shot', !/slice\(0,\s*4000\)/.test(orb));
  assert('orb aborts TTS fetches on stop', /ttsAbortRef/.test(orb) && /abort\(\)/.test(orb));
  assert('orb freezes session voice', /sessionVoiceRef/.test(orb));
  assert('orb compact voice failed', /Voice failed/.test(orb));
  assert('route resolves profile server-side', /resolveTtsProfile/.test(route));
  assert('route returns 429 busy', /status === 429/.test(route));
  assert('no secrets in client tts lib', !/ELEVENLABS_API_KEY/.test(read('lib/tts/voiceProfile.ts')));
  assert('chunk min/max documented', TTS_CHUNK_MIN === 180 && TTS_CHUNK_MAX === 500);

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

void main();
