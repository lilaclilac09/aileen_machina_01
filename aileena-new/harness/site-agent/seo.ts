/**
 * Offline SEO gate: robots + sitemap build, every sitemap URL maps to a real
 * app route, noindex / redirect / canonical-elsewhere pages stay out of the
 * sitemap, blog posts have unique titles and a canonical layout, and the SEO
 * code is not reachable from any /api route (Machina's frozen prefix cannot
 * change). Pure file + function checks, no network, no keys.
 *
 * Run: npx -y tsx harness/site-agent/seo.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { DEFAULT_TITLE, EXTRA_POSTS, TITLE_BRAND, SITE_URL, STATIC_PATHS, blogPosts, postMetadata } from '../../lib/seo';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail?: string) => rows.push({ name, ok, detail });

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
/** app/foo/(group)/bar/page.tsx → /foo/bar */
const routeOf = (file: string) =>
  '/' + relative('app', file).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)).join('/');
const appFiles = walk('app');
const pageRoutes = new Set(appFiles.filter((f) => /[\\/]page\.tsx$/.test(f)).map(routeOf));

// ── robots ──
const r = robots();
const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
const disallow = ([] as string[]).concat(rule.disallow ?? []);
check('robots: allow /', ([] as string[]).concat(rule.allow ?? []).includes('/'));
for (const p of ['/api/', '/cabinet', '/inbox', '/council', '/reviews', '/proof']) check(`robots: disallow ${p}`, disallow.includes(p));
check('robots: sitemap line', r.sitemap === `${SITE_URL}/sitemap.xml`, String(r.sitemap));

// ── sitemap ──
const entries = sitemap();
const paths = entries.map((e) => (e.url.startsWith(SITE_URL) ? e.url.slice(SITE_URL.length) || '/' : `BAD:${e.url}`));
check('sitemap: builds with entries', entries.length > 20, String(entries.length));
check('sitemap: every URL on https://www.aileena.xyz', paths.every((p) => !p.startsWith('BAD:')));
check('sitemap: no duplicate URLs', new Set(paths).size === paths.length);
const missing = paths.filter((p) => !pageRoutes.has(p));
check('sitemap: every URL maps to a real app route', missing.length === 0, missing.join(', '));
const posts = blogPosts();
check('sitemap: every Dispatch post listed with lastmod', posts.every((p) => entries.some((e) => e.url === `${SITE_URL}${p.href}` && !!e.lastModified)));

// ── noindex / redirects / canonical-elsewhere out of sitemap ──
const excluded: string[] = [];
for (const f of appFiles.filter((f) => /[\\/](page|layout)\.tsx$/.test(f))) {
  const src = readFileSync(f, 'utf8');
  const route = routeOf(f);
  if (/index:\s*false|robots:\s*NOINDEX|\bNOINDEX\b\s*\}/.test(src)) excluded.push(route);
  if (/\b(permanentRedirect|redirect)\(/.test(src) && /[\\/]page\.tsx$/.test(f)) excluded.push(route);
  {
    const cm = src.match(/canonical:\s*'(\/[^']*)'/);
    // Self-canonical (/doors → /doors) is fine; only true elsewhere targets leave the sitemap.
    if (cm && cm[1] !== route) excluded.push(route);
  }
}
for (const must of ['/unlock', '/tools/pricing-slot', '/tools/chip-guess', '/tools/feed-flash', '/tools/inkling-clips', '/research']) {
  check(`excluded set covers ${must}`, excluded.includes(must));
}
const leaked = excluded.filter((p) => paths.includes(p));
check('sitemap: no noindex / redirect / canonical-elsewhere page', leaked.length === 0, leaked.join(', '));
check('sitemap: no explainer pages', !paths.some((p) => p.endsWith('/explainer')));

// ── blog posts: unique titles, layout wired, explainers canonical to parent ──
const titles = posts.map((p) => String(postMetadata(p.href).title));
const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
check('blog: no duplicate post titles', dupes.length === 0, dupes.join(' | '));
const unwired = posts.filter((p) => {
  const f = join('app', p.href, 'layout.tsx');
  return !existsSync(f) || !readFileSync(f, 'utf8').includes(`postMetadata('${p.href}')`);
});
check('blog: every post has layout with postMetadata(href)', unwired.length === 0, unwired.map((p) => p.href).join(', '));
check('blog: post og/twitter image set', posts.every((p) => { const m = postMetadata(p.href); return !!m.openGraph?.images && !!m.twitter?.images; }));
check('blog: post canonical = own path', posts.every((p) => postMetadata(p.href).alternates?.canonical === p.href));
const explainers = [...pageRoutes].filter((p) => /^\/blog\/[^/]+\/explainer$/.test(p));
const orphanExpl = explainers.filter((p) => !existsSync(join('app', p.replace(/\/explainer$/, ''), 'layout.tsx')));
check(`blog: ${explainers.length} explainers inherit parent canonical layout`, explainers.length > 0 && orphanExpl.length === 0, orphanExpl.join(', '));

// ── off-rail posts: copied from the page's own SubstackShell props, listed + wired ──
for (const p of EXTRA_POSTS) {
  const src = readFileSync(join('app', p.href, 'page.tsx'), 'utf8');
  check(`extra post ${p.href}: title + date from page`, src.includes(`title="${p.title}"`) && src.includes(`date="${p.date}"`));
  check(`extra post ${p.href}: in sitemap`, paths.includes(p.href));
}
const dispatchHtmlSource = readFileSync('app/dispatch/layout.tsx', 'utf8');
check('dispatch index lists every post incl. off-rail (blogPosts())', dispatchHtmlSource.includes('blogPosts().map') && posts.length === new Set(posts.map((p) => p.href)).size);

// ── STATIC_PATHS: every public page owns title + description (client pages via layout) ──
const bareStatic: string[] = [];
for (const route of STATIC_PATHS) {
  if (route === '/') continue;
  const candidates = [join('app', route.slice(1), 'layout.tsx'), join('app', route.slice(1), 'page.tsx')];
  const own = candidates.some((f) => {
    if (!existsSync(f)) return false;
    const src = readFileSync(f, 'utf8');
    return (
      /toolMetadata\(/.test(src) ||
      ((/export const metadata|generateMetadata/.test(src) && /title\s*:/.test(src) && /description\s*:/.test(src)))
    );
  });
  if (!own) bareStatic.push(route);
}
check(`STATIC_PATHS: every page has own title+description (${STATIC_PATHS.length - 1} non-root)`, bareStatic.length === 0, bareStatic.join(', '));

// ── one brand per title: template adds ' · Aileen', so no title may carry a site brand ──
const BRAND = /AILEENA|Aileena|aileena\.xyz|\bAileen\b/;
const literalTitles: string[] = [];
for (const f of appFiles.filter((f) => /\.(tsx|ts)$/.test(f) && !f.includes(`${sep}api${sep}`))) {
  const src = readFileSync(f, 'utf8');
  if (!/export const metadata|opengraph-image/.test(src)) continue;
  for (const m of src.matchAll(/(?:^|\n)\s*(?:title|alt)\s*[:=]\s*(['"`])((?:(?!\1).)*)\1/g)) literalTitles.push(`${relative('app', f)}: ${m[2]}`);
}
const titled = [...literalTitles, ...posts.map((p) => `post ${p.href}: ${postMetadata(p.href).title}`)];
const branded = titled.filter((x) => BRAND.test(x.slice(x.indexOf(': ') + 2)));
check(`titles: no site brand in ${titled.length} page/post titles (no double branding)`, branded.length === 0, branded.join(' | '));
check("titles: default title is the short brand 'Aileen'", DEFAULT_TITLE === 'Aileen' && TITLE_BRAND === 'Aileen');
const rendered = [DEFAULT_TITLE, ...titled.map((x) => `${x.slice(x.indexOf(': ') + 2)} · ${TITLE_BRAND}`)];
const fullName = rendered.filter((x) => x.includes('Aileen Choo'));
check(`titles: no rendered <title> contains 'Aileen Choo' (${rendered.length})`, fullName.length === 0, fullName.join(' | '));
check('og image: share card text + alt use the short brand', !readFileSync('app/opengraph-image.tsx', 'utf8').includes('Aileen Choo'));
check("JSON-LD Person keeps real name 'Aileen Choo' + alternateName", /name: AUTHOR_NAME/.test(readFileSync('lib/jsonLd.ts', 'utf8')) && readFileSync('lib/jsonLd.ts', 'utf8').includes("alternateName: 'lilaclilac09'"));

// ── root layout + misc ──
const root = readFileSync('app/layout.tsx', 'utf8');
check('layout: metadataBase', /metadataBase:\s*new URL\(SITE_URL\)/.test(root));
check("layout: title template '%s · Aileen'", root.includes('template: `%s · ${TITLE_BRAND}`'));
check("layout: canonical './'", root.includes("canonical: './'"));
check('layout: Person + WebSite JSON-LD', root.includes('siteJsonLd()') && readFileSync('lib/jsonLd.ts', 'utf8').includes("'@type': 'WebSite'"));
check('SubstackShell: BlogPosting JSON-LD', readFileSync('app/blog/_substack/SubstackShell.tsx', 'utf8').includes('blogPostingJsonLd('));
check('dispatch: server index of all posts', /blogPosts\(\)\.map/.test(readFileSync('app/dispatch/layout.tsx', 'utf8')));
check('opengraph-image exists', existsSync('app/opengraph-image.tsx'));
const llms = readFileSync('public/llms.txt', 'utf8');
check('llms.txt: www URLs only', !/https:\/\/aileena\.xyz/.test(llms));
check('llms.txt: no /blog index link', !/aileena\.xyz\/blog\)/.test(llms));

// ── frozen prefix: SEO code unreachable from /api and shared lib ──
const seoMods = /from\s+['"][^'"]*\/(seo|jsonLd)['"]/;
const importers = [...walk('app/api'), ...walk('lib')]
  .filter((f) => /\.(ts|tsx)$/.test(f) && !/lib[\\/](seo|jsonLd)\.ts$/.test(f))
  .filter((f) => seoMods.test(readFileSync(f, 'utf8')));
check('prefix: no /api route or lib module imports lib/seo or lib/jsonLd', importers.length === 0, importers.join(', '));

const failed = rows.filter((x) => !x.ok);
for (const x of rows) console.log(`${x.ok ? 'ok  ' : 'FAIL'} ${x.name}${x.ok || !x.detail ? '' : ` — ${x.detail}`}`);
console.log(`\nsitemap urls: ${entries.length} (${posts.length} posts)`);
console.log(`seo: ${rows.length - failed.length}/${rows.length}`);
process.exit(failed.length ? 1 : 0);
