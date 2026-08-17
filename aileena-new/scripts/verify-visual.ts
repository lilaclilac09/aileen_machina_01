#!/usr/bin/env tsx
/**
 * Visual / collage no-crop audit.
 * Content photos must stay object-fit: contain.
 * DJ vinyl thumbs may cover (allowlisted).
 *
 *   pnpm verify:visual
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

function main() {
  const glass = read('components/GlassBench.tsx');
  const scrap = read('components/zine/ScrapPhoto.tsx');
  const scrapCss = read('components/zine/scrap-photo.css');

  assert(
    'GlassBench content images use contain',
    /object-fit:\s*contain/.test(glass) && !/object-fit:\s*cover/.test(glass),
  );
  assert(
    'GlassBench frame is not a fixed crop shell',
    /overflow:\s*visible/.test(glass) && /height:\s*auto/.test(glass),
  );
  assert(
    'ScrapPhoto forbids cover crop',
    /no object-fit:cover/i.test(scrap) && !/object-cover/.test(scrap) && !/objectFit:\s*['"]cover['"]/.test(scrap),
  );
  assert('scrap-photo.css uses contain', /object-fit:\s*contain/.test(scrapCss) && !/object-fit:\s*cover/.test(scrapCss));

  const contentFiles = [
    'components/GlassBench.tsx',
    'components/zine/ScrapPhoto.tsx',
  ];
  for (const file of contentFiles) {
    const src = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    const cover = /object-cover|objectFit:\s*['"]cover['"]|object-fit:\s*cover/.test(src);
    assert(`${file} has no cover-crop`, !cover);
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
