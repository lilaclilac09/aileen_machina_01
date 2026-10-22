/**
 * Persona contract (offline, no network, no secrets).
 *  - "# Voice and character" sits in the public SYSTEM_PROMPT, before "# Hard rules";
 *    the third-person, harassment and hard-rule sections are still there.
 *  - every page it cites exists, and every quoted line in its biography part
 *    is found word for word in her published pages or memories (no invented quotes);
 *  - it stays small;
 *  - the per-reply speaker button is browser-only (no server route, no fetch)
 *    and picks an English voice unless the reply is mostly Chinese.
 * Run: npx -y tsx harness/site-agent/persona.ts
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_PROMPT } from '../../lib/agentContext';
import { replySpeechLang } from '../../lib/tts';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });

const root = join(__dirname, '..', '..');
const start = SYSTEM_PROMPT.indexOf('# Voice and character');
const end = SYSTEM_PROMPT.indexOf('# Hard rules');
const persona = start >= 0 && end > start ? SYSTEM_PROMPT.slice(start, end) : '';
check('persona section present before # Hard rules', persona.length > 0);
check('persona stays small (<= 5000 chars)', persona.length > 0 && persona.length <= 5000, String(persona.length));
check('third-person rule kept', SYSTEM_PROMPT.includes('You are not Aileen: speak about her in third person.'));
check('persona restates third person', persona.includes('Still third person.'));
check('harassment section kept', SYSTEM_PROMPT.includes('# Harassment (factual, not theatrical)'));
check('hard rules still last', end > 0 && !/\n# /.test(SYSTEM_PROMPT.slice(end)));
check('internal-path rule kept', SYSTEM_PROMPT.includes('Never name internal file paths'));

// Cited pages exist.
const cited = [...new Set([...persona.matchAll(/\((\/[a-z0-9\-/#]+)\)/g)].map((m) => m[1].split('#')[0]))];
for (const p of cited) {
  check(`cited page ${p} exists`, existsSync(join(root, 'app', p, 'page.tsx')));
}

// Quotes in the biography part come from her published text.
const norm = (s: string) => s.replace(/\\/g, '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').toLowerCase();
const sources: string[] = [];
for (const d of readdirSync(join(root, 'app/blog'))) {
  const f = join(root, 'app/blog', d, 'page.tsx');
  if (existsSync(f)) sources.push(readFileSync(f, 'utf8'));
}
sources.push(readFileSync(join(root, 'app/updates/page.tsx'), 'utf8'));
sources.push(readFileSync(join(root, 'lib/translations.ts'), 'utf8'));
const corpus = norm(sources.join('\n'));
// Reply templates ("Pushed past …") are Machina's lines, not her quotes.
const bio = persona
  .slice(0, persona.indexOf('## Not published'))
  .split('\n')
  .filter((l) => !l.startsWith('- Pushed past'))
  .join('\n');
const quotes = [...bio.matchAll(/"([^"\n]{12,})"/g)].map((m) => m[1].replace(/[.,]$/, ''));
check('biography quotes found', quotes.length >= 4, String(quotes.length));
for (const q of quotes) check(`quote is hers: "${q}"`, corpus.includes(norm(q)));

// Reply speaker: browser only, English first.
const btn = readFileSync(join(root, 'components/SpeakReplyButton.tsx'), 'utf8');
check('speaker button has no fetch / server route', !/fetch\(|\/api\//.test(btn));
check('speaker button renders nothing when unsupported', /if \(!supported\) return null;/.test(btn));
check('speaker never speaks from an effect (no autoplay)', !/useEffect\([^]*?synth\.speak[^]*?\}, \[/.test(btn.split('const speak =')[0]));
const chat = readFileSync(join(root, 'components/AgentChat.tsx'), 'utf8');
check('chat stops reply speech on a new message', /useEffect\(\(\) => \{\s*stopReplySpeech\(\);\s*\}, \[messages\.length\]\)/.test(chat));
check('lang: English reply → en-GB', replySpeechLang('She builds AI agents on Solana.') === 'en-GB');
check('lang: Chinese reply → zh-CN', replySpeechLang('她在柏林读统计，写关于偏见的文章。') === 'zh-CN');
check('lang: mostly English with a Chinese name → en-GB', replySpeechLang('Gather · 共影 is her photo album tool, built on Next.js.') === 'en-GB');
check('lang: empty → en-GB', replySpeechLang('  — ') === 'en-GB');

const failed = rows.filter((r) => !r.ok);
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
console.log(`\npersona: ${rows.length - failed.length}/${rows.length}`);
if (failed.length) process.exit(1);
