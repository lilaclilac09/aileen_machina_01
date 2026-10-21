/**
 * Offline gate for console answer links (AgentChat linkify -> splitLinks):
 * a URL must stop at CJK text / fullwidth punctuation and must not swallow
 * trailing sentence punctuation. Pure function, no network, no keys.
 *
 * Run: npx -y tsx harness/site-agent/linkify.ts
 */
import { readFileSync } from 'node:fs';
import { splitLinks, type LinkPart } from '../../lib/linkifyText';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];

const show = (parts: LinkPart[]) => JSON.stringify(parts.map((p) => (typeof p === 'string' ? p : `<${p.url}>`)));
function expect(name: string, text: string, want: Array<string | { url: string }>) {
  const got = splitLinks(text);
  const ok = show(got) === show(want) && got.map((p) => (typeof p === 'string' ? p : p.url)).join('') === text;
  rows.push({ name, ok, detail: `got ${show(got)} want ${show(want)}` });
}

expect('CJK comma after URL + #fragment', '精选曲目在 https://aileena.xyz/sound#dj-set，比如 Eden', [
  '精选曲目在 ',
  { url: 'https://aileena.xyz/sound#dj-set' },
  '，比如 Eden',
]);
expect('CJK full stop after URL', '播放器在 https://aileena.xyz/sound。', ['播放器在 ', { url: 'https://aileena.xyz/sound' }, '。']);
expect('CJK directly after URL, no punctuation', 'https://aileena.xyz/sound比如', [{ url: 'https://aileena.xyz/sound' }, '比如']);
expect('English trailing period', 'Listen at https://aileena.xyz/sound.', ['Listen at ', { url: 'https://aileena.xyz/sound' }, '.']);
expect('English trailing comma and quote', 'see "https://aileena.xyz/blog", then', ['see "', { url: 'https://aileena.xyz/blog' }, '", then']);
expect('URL in parentheses', 'the set (https://aileena.xyz/sound) is live', ['the set (', { url: 'https://aileena.xyz/sound' }, ') is live']);
expect('URL in fullwidth parentheses', '曲目（https://aileena.xyz/sound）', ['曲目（', { url: 'https://aileena.xyz/sound' }, '）']);
expect('query + fragment kept', 'go https://aileena.xyz/sound?set=eden&t=30#dj-set now', [
  'go ',
  { url: 'https://aileena.xyz/sound?set=eden&t=30#dj-set' },
  ' now',
]);
expect('bare domain/path form', 'read aileena.xyz/blog/centaur.', ['read ', { url: 'aileena.xyz/blog/centaur' }, '.']);
expect('bare domain/path before CJK', '见aileena.xyz/sound，谢谢', ['见', { url: 'aileena.xyz/sound' }, '，谢谢']);
expect('normal URL unchanged', 'https://github.com/lilaclilac09/aileen_machina_01/pull/12', [
  { url: 'https://github.com/lilaclilac09/aileen_machina_01/pull/12' },
]);
expect('percent-encoded path unchanged', 'x https://en.wikipedia.org/wiki/%E9%9F%B3 y', ['x ', { url: 'https://en.wikipedia.org/wiki/%E9%9F%B3' }, ' y']);
expect('two URLs in one line', 'a https://a.io/x。b https://b.io/y.', ['a ', { url: 'https://a.io/x' }, '。b ', { url: 'https://b.io/y' }, '.']);
expect('no URL: text untouched', '没有链接 no link here.', ['没有链接 no link here.']);
expect('repeat call is stateless', '播放器在 https://aileena.xyz/sound。', ['播放器在 ', { url: 'https://aileena.xyz/sound' }, '。']);

const chat = readFileSync('components/AgentChat.tsx', 'utf8');
rows.push({ name: 'AgentChat linkify uses splitLinks', ok: /function linkify\(text: string\) \{[\s\S]{0,300}splitLinks\(text\)/.test(chat) });
rows.push({ name: 'no old [^\\s)] URL regex left in AgentChat', ok: !chat.includes('[^\\s)]+') });

const failed = rows.filter((r) => !r.ok);
for (const r of rows) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok || !r.detail ? '' : ` — ${r.detail}`}`);
console.log(`\nlinkify: ${rows.length - failed.length}/${rows.length}`);
process.exit(failed.length ? 1 : 0);
