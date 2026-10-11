/**
 * Night Desk is gone. Assert no public /night surface and no night lane.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decideAgentMode } from '../lib/agentMode';
import { classifySiteLane } from '../lib/siteLanes';

const ROOT = process.cwd();
let failed = 0;

function assert(name: string, ok: boolean, detail = '') {
  if (ok) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name} ${detail}`);
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

assert('no app/night/page.tsx', !existsSync(join(ROOT, 'app/night/page.tsx')));
assert('no app/api/night/route.ts', !existsSync(join(ROOT, 'app/api/night/route.ts')));
assert('no lib/nightDesk.ts', !existsSync(join(ROOT, 'lib/nightDesk.ts')));

const translations = read('lib/translations.ts');
assert('no /night hub door', !translations.includes("href: '/night'"));
assert('no Night Desk door label', !translations.includes('Night Desk'));
assert('no hub-night id', !translations.includes('hub-night'));

const landing = read('components/landing/LandingMarquee.tsx');
assert('landing has no night upsell', !/Night Desk|\/night/.test(landing));

const graph = read('lib/product-surface/graph.ts');
assert('product graph has no /night room', !graph.includes("href: '/night'"));

assert('console night keyword is not a lane', classifySiteLane('今晚还在吗') === null);
assert('plain night is not a lane', classifySiteLane('night desk') === null);
assert('forge lane still works', classifySiteLane('open a pr') === 'forge');

const nightChat = decideAgentMode('night', false);
assert('public chat rejects night mode', !nightChat.ok && nightChat.status === 400);
assert(
  'night refusal does not point at /night',
  !nightChat.ok && !nightChat.error.includes('/night'),
);
const pub = decideAgentMode(undefined, false);
assert('omitted chat stays public', pub.ok && pub.mode === 'public');

assert(
  'no root agent-gateway preview',
  !existsSync(join(ROOT, 'public/agent-gateway-preview.html')),
);
assert('agent-gateway page stays under /tools', existsSync(join(ROOT, 'app/tools/agent-gateway/page.tsx')));
assert('agent-gateway use stays under /tools', existsSync(join(ROOT, 'app/tools/agent-gateway/use/page.tsx')));
assert('no doors shortcut for agent-gateway', !translations.includes('hub-agent-gateway'));
assert('preview stays on the tools page', translations.includes("previewHref: '/tools/agent-gateway'"));
assert('no leftover preview html href', !translations.includes('agent-gateway-preview.html'));

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log('night desk absence checks passed');
