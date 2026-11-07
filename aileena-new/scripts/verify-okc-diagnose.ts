/**
 * OKC Explorer diagnose data + wiring.
 * Run: pnpm verify:okc-diagnose
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getToolBySlug } from '../lib/tools/registry';
import { t } from '../lib/translations';

function assert(name: string, ok: boolean, detail = '') {
  if (!ok) throw new Error(`FAIL ${name}${detail ? ` ${detail}` : ''}`);
  console.log(`PASS ${name}${detail ? ` ${detail}` : ''}`);
}

const CJK = /[\u3040-\u30ff\u3400-\u9fff]/;
const root = join(__dirname, '..');
const jsonPath = join(root, 'public/okc-diagnose.json');
const htmlPath = join(root, 'public/nsight.html');
const jsPath = join(root, 'public/okc-diagnose.js');
const docPath = join(root, 'docs/OKC_DIAGNOSE.md');
const pagePath = join(root, 'app/nsight/page.tsx');

assert('json exists', existsSync(jsonPath));
assert('html exists', existsSync(htmlPath));
assert('js exists', existsSync(jsPath));
assert('doc exists', existsSync(docPath));

const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
  contest: { gpu: string; board: string };
  playbook: { formulas: string[]; reduction: { id: string }[] };
  problems: Record<
    string,
    {
      key: string;
      name: string;
      view: string;
      solving: string;
      notSolving: string;
      measuredMs: number | null;
      slices: {
        id: string;
        verdict: string;
        method: string | null;
        floorMs: number | null;
        measuredMs: number | null;
        why: string;
      }[];
    }
  >;
};

const VERDICTS = new Set(['floor', 'gap', 'unknown']);
const KEYS = ['bf16', 'attn', 'moe', 'declayer', 'prelayer'];

assert('five problems', KEYS.every((k) => data.problems[k]));
assert('contest gpu names H200', data.contest.gpu.includes('H200'));
assert(
  'playbook formulas',
  data.playbook.formulas.some((f) => f.includes('round trips')) &&
    data.playbook.formulas.some((f) => f.includes('S · B / L')),
);
assert('three reduction paths', data.playbook.reduction.length === 3);

for (const key of KEYS) {
  const p = data.problems[key];
  assert(`${key} view matches`, p.view === key || (key === 'bf16' && p.view === 'bf16'));
  assert(`${key} has slices`, p.slices.length >= 2);
  assert(
    `${key} verdicts legal`,
    p.slices.every((s) => VERDICTS.has(s.verdict)),
  );
  assert(`${key} solving is English`, !CJK.test(p.solving) && p.solving.length > 12);
  assert(`${key} notSolving is English`, !CJK.test(p.notSolving));
}

const bf16 = data.problems.bf16;
const math = bf16.slices.find((s) => s.id === 'math');
const stream = bf16.slices.find((s) => s.id === 'stream');
const tail = bf16.slices.find((s) => s.id === 'tail');
const drain = bf16.slices.find((s) => s.id === 'drain');

assert('bf16 measured 4.599', bf16.measuredMs === 4.599);
assert('math is floor', math?.verdict === 'floor' && math.method === null);
assert('stream is gap', stream?.verdict === 'gap' && stream.method === 'M02');
assert('stream floor 59 µs', stream?.floorMs === 0.059);
assert('stream measured >> floor', (stream?.measuredMs ?? 0) > (stream?.floorMs ?? 1) * 10);
assert('tail is gap', tail?.verdict === 'gap');
assert('drain is unknown', drain?.verdict === 'unknown' && drain.measuredMs === null);
assert(
  'floor slices have no method',
  bf16.slices.filter((s) => s.verdict === 'floor').every((s) => s.method === null),
);

const attnMath = data.problems.attn.slices.find((s) => s.id === 'math');
assert('attn math is floor', attnMath?.verdict === 'floor');
assert('attn measured unknown', data.problems.attn.measuredMs === null);

const html = readFileSync(htmlPath, 'utf8');
assert('diagnose tab', html.includes('data-view="diagnose"'));
assert('four steps', ['1 · Separate', '2 · Round trips', '3 · Floor', '4 · Methods'].every((s) => html.includes(s)));
assert('loads diagnose js', html.includes('src="/okc-diagnose.js"'));
assert('open diagnose cta', html.includes('data-testid="okc-open-diagnose"'));
assert('english diagnose copy', !CJK.test(html));
assert('no gradient in diagnose css', !/linear-gradient/.test(html));

const js = readFileSync(jsPath, 'utf8');
assert('js fetches json', js.includes('/okc-diagnose.json'));
assert('js english', !CJK.test(js));
assert('js stops on floor', js.includes('AT THE BOTTOM'));

const page = readFileSync(pagePath, 'utf8');
assert('page whitelists diagnose', page.includes("'diagnose'"));
assert('iframe gets view query', page.includes('/nsight.html?view='));

const tool = getToolBySlug('nsight');
assert('registry href diagnose', tool?.href === '/nsight?view=diagnose');
assert('EN title', t.EN.tools.items.nsight.title === 'OKC Explorer');
assert('DE title stays OKC Explorer', t.DE.tools.items.nsight.title === 'OKC Explorer');
assert('EN body names floor', t.EN.tools.items.nsight.body.includes('Floor vs gap'));
assert('EN verdict names floor', t.EN.tools.items.nsight.verdict.includes('Stop at the floor'));

const doc = readFileSync(docPath, 'utf8');
assert('doc has add-a-problem template', doc.includes('Append one key'));
assert('doc english', !CJK.test(doc));

console.log('okc-diagnose ok');
