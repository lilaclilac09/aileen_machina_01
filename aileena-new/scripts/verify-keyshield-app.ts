/**
 * KeyShield public app (`/ks` · app.ks.aileena.xyz) uses the latest
 * lib/keyshield PRF functions — not the retired Railway / ks-prf-salt-v1 SPA.
 *
 *   pnpm verify:keyshield
 *   VERIFY_BASE_URL=http://localhost:3000 pnpm verify:keyshield
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  KS_APP_HOST,
  KS_APP_URL,
  KS_EXTENSION_HREF,
  KS_HKDF_MASTER,
  KS_HKDF_VAULT_ID,
  KS_PRF_FIRST,
} from '../lib/keyshield/constants';
import { deriveKeyshield, openText, sealText } from '../lib/keyshield/prf';
import { GET as healthGet } from '../app/api/ks/health/route';
import { POST as optionsPost } from '../app/api/ks/passkey/options/route';
import { GET as vaultGet } from '../app/api/ks/vault/route';

const root = process.cwd();
let failed = 0;

function assert(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

async function main() {
  assert('PRF first is vault-master-secret', KS_PRF_FIRST === 'keyshield-prf-v1:vault-master-secret');
  assert('HKDF master is encryption-key', KS_HKDF_MASTER === 'keyshield-prf-v1:encryption-key');
  assert('HKDF vault id is vault-id', KS_HKDF_VAULT_ID === 'keyshield-prf-v1:vault-id');
  assert('public host is app.ks.aileena.xyz', KS_APP_HOST === 'app.ks.aileena.xyz' && KS_APP_URL === 'https://app.ks.aileena.xyz');

  const { aes } = await deriveKeyshield(new Uint8Array(32).fill(0xaa));
  const sealed = await sealText(aes, JSON.stringify({ label: 'openai', secret: 'sk-test' }));
  const opened = await openText(aes, sealed.iv, sealed.cipher);
  assert('vault envelope round-trips', opened === JSON.stringify({ label: 'openai', secret: 'sk-test' }));
  const other = await deriveKeyshield(new Uint8Array(32).fill(0xbb));
  assert('cross-PRF vault envelope fails', (await openText(other.aes, sealed.iv, sealed.cipher)) === null);

  const appSrc = read('components/KeyShieldApp.tsx');
  const prfSrc = read('lib/keyshield/prf.ts');
  const vercel = read('vercel.json');
  const nextCfg = read('next.config.ts');
  const chat = read('components/AgentChat.tsx');
  const tx = read('lib/translations.ts');
  const agent = read('lib/agentContext.ts');

  assert('app uses deriveKeyshield + sealText', /deriveKeyshield/.test(appSrc) && /sealText/.test(appSrc));
  assert('app uses latest PRF first constant', /KS_PRF_FIRST/.test(appSrc) && !/ks-prf-salt-v1/.test(appSrc));
  assert('AES-GCM key is non-extractable', /AES-GCM[\s\S]{0,120}false,[\s\S]{0,40}\['encrypt', 'decrypt'\]/.test(prfSrc));
  assert(
    'vercel host rewrite',
    /app\.ks\.aileena\.xyz/.test(vercel) && /"destination": "\/ks"/.test(vercel),
  );
  assert(
    'next host rewrite',
    /app\.ks\.aileena\.xyz/.test(nextCfg) && /destination: "\/ks"/.test(nextCfg),
  );
  assert('Console chrome hidden on /ks', /pathname === '\/ks'/.test(chat));
  assert('works + footer point at app.ks', (tx.match(/https:\/\/app\.ks\.aileena\.xyz/g) || []).length >= 6);
  assert(
    'extension install is src/extension',
    KS_EXTENSION_HREF === 'https://github.com/lilaclilac09/keyshield/tree/main/src/extension' &&
      appSrc.includes('KS_EXTENSION_HREF') &&
      tx.includes(KS_EXTENSION_HREF),
  );
  assert('agent context has live KeyShield URL', agent.includes('https://app.ks.aileena.xyz'));
  assert('no Railway fallback in app', !/keyshield-production\.up\.railway\.app/.test(appSrc));

  const health = await healthGet();
  const healthJson = (await health.json()) as { ok?: boolean; railway?: boolean; prfFirst?: string };
  assert('health ok', health.ok && healthJson.ok === true && healthJson.railway === false, JSON.stringify(healthJson));
  assert('health PRF salt', healthJson.prfFirst === KS_PRF_FIRST);

  const optRes = await optionsPost(
    new Request('http://localhost/api/ks/passkey/options', {
      method: 'POST',
      headers: { host: 'localhost', 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'unlock' }),
    }),
  );
  const optJson = (await optRes.json()) as { method?: string; prfFirst?: string; rpName?: string };
  assert('options method is keyshield', optRes.ok && optJson.method === 'keyshield', JSON.stringify(optJson));
  assert('options PRF is latest', optJson.prfFirst === KS_PRF_FIRST);
  assert('options rpName is KeyShield', optJson.rpName === 'KeyShield');

  const vaultRes = await vaultGet(new Request('http://localhost/api/ks/vault'));
  assert('vault GET without session is 401', vaultRes.status === 401);

  const base = (process.env.VERIFY_BASE_URL || '').replace(/\/$/, '');
  if (base) {
    const page = await fetch(`${base}/ks`);
    const html = await page.text();
    assert('/ks renders', page.ok && /keyshield-app/.test(html), `status=${page.status}`);
    assert('/ks shows latest PRF method', html.includes(KS_PRF_FIRST));
    assert('/ks has extension install link', html.includes(KS_EXTENSION_HREF));
    assert('/ks has no old PRF salt', !html.includes('ks-prf-salt-v1'));
    const liveHealth = await fetch(`${base}/api/ks/health`);
    const liveJson = (await liveHealth.json()) as { railway?: boolean; prfFirst?: string };
    assert('live health', liveHealth.ok && liveJson.railway === false && liveJson.prfFirst === KS_PRF_FIRST);
  } else {
    console.log('skip HTTP /ks (set VERIFY_BASE_URL to probe a server)');
  }

  if (failed) {
    console.error(`\n${failed} failed`);
    process.exit(1);
  }
  console.log('\nkeyshield app ok');
}

void main();
