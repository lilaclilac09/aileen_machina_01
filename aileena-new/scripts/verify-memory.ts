#!/usr/bin/env tsx
/**
 * Verify Machina memory stack (v0.5) — hard taste retrieval + visitor soft helpers.
 *
 * Usage:
 *   pnpm verify:memory
 *   pnpm build:memory-index && pnpm verify:memory
 *
 * Optional live chat probe (needs a running site + model key on that host):
 *   VERIFY_BASE_URL=http://localhost:3000 pnpm verify:memory
 *
 * Optional Redis round-trip (needs UPSTASH_* in env):
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... pnpm verify:memory
 *
 * Writes: .verify-memory/verify-report.json
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { searchMemories, memoryIndexMeta } from '../lib/memorySearch';
import {
  mergeVisitorQuestion,
  formatVisitorSoftMemoryForPrompt,
  visitorSoftMemoryEnabled,
  loadVisitorSoftMemory,
  recordVisitorQuestion,
  chooseVisitorStance,
  VISITOR_TTL_SECONDS,
  type VisitorSoftMemory,
} from '../lib/visitorMemory';

const OUT_DIR = process.env.VERIFY_OUT_DIR ?? join(process.cwd(), '.verify-memory');
const BASE_URL = (process.env.VERIFY_BASE_URL ?? '').replace(/\/$/, '');

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function emptySoft(): VisitorSoftMemory {
  return { questions: [], topics: [], updatedAt: '', hitCount: 0 };
}

function hitBlob(hits: ReturnType<typeof searchMemories>): string {
  return hits.map((h) => `${h.path} ${h.section} ${h.snippet}`).join(' ').toLowerCase();
}

/** Manual prompts for a human / site agent QA pass (printed at end). */
export const AGENT_MANUAL_PROMPTS = [
  {
    id: 'A1',
    ask: 'what music does she like / what is on her DJ set?',
    expect: 'Mentions curated set or techno taste (Daydreaming / Beltran / Beatrice / Lovegod or DVS1-style taste) — not inventing random Spotify charts.',
  },
  {
    id: 'A2',
    ask: 'what documentaries or films does she recommend?',
    expect: 'Didion / Hockney shelf docs and/or film-taste circle (Léa Seydoux, Spectre/No Time to Die, The Crown, The Capture, Bodyguard) — life-texture, not a random Letterboxd dump.',
  },
  {
    id: 'A2b',
    ask: 'how does she assemble a European lifestyle / 欧洲生活指南?',
    expect: 'European living notes (wander, B&W looking, FR/IT, Bond wardrobe, slow museum, table ritual) and/or weekly lifestyle practices — points to watch-listening-shelf anchors.',
  },
  {
    id: 'A3',
    ask: 'David Hockney — what does she watch or care about?',
    expect: 'Hockney-related shelf items; no fake biography dump from training only.',
  },
  {
    id: 'A4',
    ask: 'any podcasts on her listening shelf?',
    expect: 'Fashion Neurosis and/or Do You Read Her (or says she has a shelf at /blog/watch-listening-shelf).',
  },
  {
    id: 'A5',
    ask: 'what did I ask you before?',
    expect: 'If soft memory / priorTopics empty: honest "I don\'t have prior questions". If you asked A1–A4 first: soft recall of those topics — not Aileen\'s taste list.',
  },
  {
    id: 'A6',
    ask: 'is she available for hire?',
    expect: 'CV / contact style answer — must NOT require searchMemories; must not invent chip prices.',
  },
  {
    id: 'A7',
    ask: 'what is her faith / what does she believe or trust?',
    expect: 'From essays: evidence over seniority myth; power as commits/archive; kiln trust; Didion sentences; not a declared religion. Cite harassment / third-culture / glass / shelf — do not invent a church.',
  },
  {
    id: 'A8',
    ask: 'what music does she like?',
    expect: 'Accommodate: DJ set / techno taste, warm, no pierce, no "you asked before" opener.',
  },
  {
    id: 'A9',
    ask: 'if I get senior enough, will that protect women in tech?',
    expect: 'Pierce once (soft, warm): seniority myth is false per harassment essay — then help. Not a roast.',
  },
] as const;

async function runUnitChecks() {
  console.log('\n=== Hard memory (TF-IDF) ===\n');

  const meta = memoryIndexMeta();
  assert('memory index has chunks', meta.chunkCount > 0, `${meta.chunkCount} chunks @ ${meta.generatedAt || 'unknown'}`);

  const hockney = searchMemories('David Hockney documentary', 5);
  assert(
    'searchMemories(Hockney) returns hits',
    hockney.length > 0,
    hockney.map((h) => h.path).join(', ') || 'none',
  );
  assert(
    'Hockney hits mention Hockney / splash / exhibition',
    /hockney|splash|exhibition/.test(hitBlob(hockney)),
    hitBlob(hockney).slice(0, 120),
  );

  const didion = searchMemories('Joan Didion documentary', 5);
  assert(
    'searchMemories(Didion) returns hits',
    didion.length > 0 && /didion|center will not hold/.test(hitBlob(didion)),
    didion[0]?.path ?? 'none',
  );

  const music = searchMemories('DJ set Daydreaming techno taste', 5);
  assert(
    'searchMemories(music/set) returns hits',
    music.length > 0,
    music.map((h) => h.path).join(', ') || 'none',
  );
  assert(
    'music hits mention set / daydream / techno / beltran',
    /daydream|techno|beltran|setlist|dj|lovegod|beatrice/.test(hitBlob(music)),
    hitBlob(music).slice(0, 120),
  );

  const latest = searchMemories('latest content podcast documentary', 5);
  assert(
    'searchMemories(latest content) returns hits',
    latest.length > 0,
    latest.map((h) => h.path).join(', ') || 'none',
  );

  const faith = searchMemories('faith belief trust kiln evidence seniority', 5);
  assert(
    'searchMemories(faith) hits faith-from-essays',
    faith.some((h) => h.path.includes('faith-from-essays')),
    faith.map((h) => h.path).join(', ') || 'none',
  );
  assert(
    'faith hits mention evidence / kiln / commits / not religion',
    /evidence|kiln|commit|seniority|religion|belief/.test(hitBlob(faith)),
    hitBlob(faith).slice(0, 140),
  );

  const film = searchMemories('Léa Seydoux Bond girl Spectre The Crown Bodyguard The Capture', 5);
  assert(
    'searchMemories(film) hits film-taste',
    film.some((h) => h.path.includes('film-taste')),
    film.map((h) => h.path).join(', ') || 'none',
  );
  assert(
    'film hits mention Seydoux / Spectre / Crown / Capture / Bodyguard',
    /seydoux|spectre|crown|capture|bond|french dispatch|bodyguard/.test(hitBlob(film)),
    hitBlob(film).slice(0, 140),
  );

  const euro = searchMemories('欧洲生活指南 European living lifestyle Bond wardrobe museum', 5);
  assert(
    'searchMemories(euro lifestyle) hits lifestyle-europe',
    euro.some((h) => h.path.includes('lifestyle-europe')),
    euro.map((h) => h.path).join(', ') || 'none',
  );
  assert(
    'euro hits mention wandering / wardrobe / museum / collage',
    /wander|wardrobe|museum|collage|lifestyle|欧洲/.test(hitBlob(euro)),
    hitBlob(euro).slice(0, 140),
  );

  const nonsense = searchMemories('zzzzqxv9notatopic', 3);
  assert('nonsense query returns few/zero strong paths', nonsense.length === 0 || nonsense[0].score < 2, `n=${nonsense.length}`);

  console.log('\n=== Visitor soft memory (pure) ===\n');

  assert('visitor soft disabled without UPSTASH env OR enabled with it', true, `enabled=${visitorSoftMemoryEnabled()}`);

  const m1 = mergeVisitorQuestion(emptySoft(), 'what about Hockney?');
  assert('mergeVisitorQuestion adds question', !!m1 && m1.questions[0] === 'what about Hockney?', m1?.questions[0]);
  assert('mergeVisitorQuestion increments hitCount', m1?.hitCount === 1, String(m1?.hitCount));

  const m2 = mergeVisitorQuestion(m1!, 'what about Hockney?');
  assert('merge dedupes identical question', m2?.questions.filter((q) => q === 'what about Hockney?').length === 1);

  const m3 = mergeVisitorQuestion(m2!, 'tell me about her DJ set');
  assert('merge keeps newest first', m3?.questions[0]?.toLowerCase().includes('dj') === true, m3?.questions[0]);

  const prompt = formatVisitorSoftMemoryForPrompt(m3!, ['prior-local-topic']);
  assert('format prompt non-empty when soft has data', prompt.includes('This visitor') && prompt.includes('Hockney'), prompt.slice(0, 100));
  assert('format merges client priorTopics', prompt.includes('prior-local-topic'));

  const emptyPrompt = formatVisitorSoftMemoryForPrompt(emptySoft(), [], '');
  assert(
    'format prompt still emits stance with no history',
    emptyPrompt.includes('Auto stance: **accommodate**'),
    emptyPrompt.slice(0, 120),
  );

  const musicStance = chooseVisitorStance('what music does she like?', emptySoft(), []);
  assert('music ask → accommodate', musicStance.stance === 'accommodate', musicStance.reason);
  assert('music ask detects taste', musicStance.intents.includes('taste'), musicStance.intents.join(','));

  const mythStance = chooseVisitorStance(
    'if I get senior enough will that protect women in tech?',
    emptySoft(),
    [],
  );
  assert('seniority myth → pierce', mythStance.stance === 'pierce', mythStance.reason);

  const jokeStance = chooseVisitorStance(
    'if I get senior enough I am safe lol just kidding',
    emptySoft(),
    [],
  );
  assert('joke + myth → accommodate (stay light)', jokeStance.stance === 'accommodate', jokeStance.reason);

  const longQ = 'x'.repeat(300);
  const mLong = mergeVisitorQuestion(emptySoft(), longQ);
  assert('long question truncated', (mLong?.questions[0].length ?? 0) <= 160, String(mLong?.questions[0].length));

  assert('TTL is 90 days', VISITOR_TTL_SECONDS === 90 * 24 * 60 * 60, String(VISITOR_TTL_SECONDS));
}

async function runRedisChecks() {
  if (!visitorSoftMemoryEnabled()) {
    console.log('\n=== Redis (skipped — UPSTASH_* not set) ===\n');
    assert('redis round-trip skipped', true, 'set UPSTASH_REDIS_REST_URL + TOKEN to enable');
    return;
  }

  console.log('\n=== Redis round-trip ===\n');
  const id = `verify-memory-${Date.now()}`;
  const q = `verify probe ${id}`;
  const written = await recordVisitorQuestion(id, q);
  assert('redis SET via recordVisitorQuestion', !!written && written.questions[0] === q, written?.questions[0]);

  const loaded = await loadVisitorSoftMemory(id);
  assert('redis GET returns same question', loaded.questions[0] === q, loaded.questions[0]);
  assert('redis hitCount >= 1', loaded.hitCount >= 1, String(loaded.hitCount));
}

async function runLiveChatChecks() {
  if (!BASE_URL) {
    console.log('\n=== Live /api/chat (skipped — no VERIFY_BASE_URL) ===\n');
    assert('live chat probe skipped', true, 'set VERIFY_BASE_URL=http://localhost:3000 to enable');
    return;
  }

  console.log(`\n=== Live chat @ ${BASE_URL} ===\n`);

  const body = {
    messages: [
      {
        id: 'verify-1',
        role: 'user',
        parts: [{ type: 'text', text: 'what documentaries does she like?' }],
      },
    ],
    priorTopics: ['verify-memory-script'],
  };

  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const softHeader = res.headers.get('x-visitor-soft-memory');
    const setCookie = res.headers.get('set-cookie') ?? '';
    assert(
      'POST /api/chat responds (not 5xx)',
      res.status < 500,
      `status=${res.status} soft=${softHeader ?? 'missing'}`,
    );
    if (res.status === 200) {
      assert(
        'X-Visitor-Soft-Memory header present',
        softHeader === 'redis' || softHeader === 'off',
        softHeader ?? 'missing',
      );
      assert(
        'Set-Cookie includes __aileena_vid or quota',
        /__aileena_vid|__aileena_quota/.test(setCookie),
        setCookie.slice(0, 80) || 'no set-cookie',
      );
    } else {
      assert('live chat 200 (model/quota may block)', false, `status=${res.status} — check DEEPSEEK_API_KEY / daily limit`);
    }
  } catch (e) {
    assert('live chat reachable', false, String(e));
  }
}

async function main() {
  console.log('verify-memory — Machina v0.5\n');

  await runUnitChecks();
  await runRedisChecks();
  await runLiveChatChecks();

  const failed = checks.filter((c) => !c.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    softMemoryEnabled: visitorSoftMemoryEnabled(),
    memoryIndex: memoryIndexMeta(),
    baseUrl: BASE_URL || null,
    passed: checks.length - failed.length,
    failed: failed.length,
    checks,
    agentManualPrompts: AGENT_MANUAL_PROMPTS,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, 'verify-report.json');
  await writeFile(outPath, JSON.stringify(report, null, 2));

  console.log('\n=== Agent manual prompts (paste into site console) ===\n');
  for (const p of AGENT_MANUAL_PROMPTS) {
    console.log(`${p.id}. ASK: ${p.ask}`);
    console.log(`   EXPECT: ${p.expect}\n`);
  }

  console.log(`Report → ${outPath}`);
  console.log(`Result: ${report.passed}/${checks.length} passed`);

  if (failed.length > 0) {
    console.error('\nFailed:');
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail ?? ''}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
