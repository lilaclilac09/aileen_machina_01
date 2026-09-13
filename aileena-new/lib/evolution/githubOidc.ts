/**
 * Verify GitHub Actions OIDC JWTs so production can drain the live inbox
 * without storing UPSTASH secrets on GitHub.
 */

export const GITHUB_OIDC_ISS = 'https://token.actions.githubusercontent.com';
export const GITHUB_OIDC_JWKS = 'https://token.actions.githubusercontent.com/.well-known/jwks';
export const EVOLVE_OIDC_AUD = 'https://www.aileena.xyz';
export const EVOLVE_OIDC_REPO = 'lilaclilac09/aileen_machina_01';
export const EVOLVE_OIDC_WORKFLOW = 'site-agent-evolve.yml';

export type GithubOidcClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  repository?: string;
  ref?: string;
  job_workflow_ref?: string;
  workflow_ref?: string;
};

type Jwks = { keys: Array<JsonWebKey & { kid?: string; alg?: string; kty?: string }> };

function bytesFromB64url(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function jsonFromB64url<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(bytesFromB64url(part))) as T;
}

export function decodeJwtUnverified(token: string): { header: { alg?: string; kid?: string }; payload: GithubOidcClaims } | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  try {
    return {
      header: jsonFromB64url(parts[0]),
      payload: jsonFromB64url(parts[1]),
    };
  } catch {
    return null;
  }
}

function audList(aud: GithubOidcClaims['aud']): string[] {
  if (!aud) return [];
  return Array.isArray(aud) ? aud.map(String) : [String(aud)];
}

/** Claim checks after the signature is verified. */
export function assertEvolveOidcClaims(
  payload: GithubOidcClaims,
  nowSec = Math.floor(Date.now() / 1000),
): { ok: boolean; reason: string } {
  if (payload.iss !== GITHUB_OIDC_ISS) return { ok: false, reason: 'iss' };
  if (!audList(payload.aud).includes(EVOLVE_OIDC_AUD)) return { ok: false, reason: 'aud' };
  if (typeof payload.exp === 'number' && payload.exp < nowSec) return { ok: false, reason: 'exp' };
  if (typeof payload.nbf === 'number' && payload.nbf > nowSec + 30) return { ok: false, reason: 'nbf' };
  const repo = process.env.EVOLVE_OIDC_REPOSITORY || EVOLVE_OIDC_REPO;
  if (payload.repository !== repo) return { ok: false, reason: 'repository' };
  if (payload.ref && payload.ref !== 'refs/heads/main') return { ok: false, reason: 'ref' };
  const wf = String(payload.job_workflow_ref || payload.workflow_ref || '');
  if (!wf.includes(`/.github/workflows/${EVOLVE_OIDC_WORKFLOW}`)) return { ok: false, reason: 'workflow' };
  if (!wf.includes('@refs/heads/main')) return { ok: false, reason: 'workflow-ref' };
  return { ok: true, reason: 'ok' };
}

async function fetchJwks(): Promise<Jwks> {
  const res = await fetch(GITHUB_OIDC_JWKS, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  return (await res.json()) as Jwks;
}

async function verifyRs256(token: string, jwk: JsonWebKey): Promise<boolean> {
  const [h, p, s] = token.split('.');
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sig = bytesFromB64url(s);
  const data = new TextEncoder().encode(`${h}.${p}`);
  const sigBuf = sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength) as ArrayBuffer;
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBuf, data);
}

export async function verifyGithubActionsOidc(
  token: string,
  opts?: { jwks?: Jwks; nowSec?: number },
): Promise<{ ok: boolean; reason: string; payload?: GithubOidcClaims }> {
  if (!token) return { ok: false, reason: 'empty' };
  const decoded = decodeJwtUnverified(token);
  if (!decoded) return { ok: false, reason: 'malformed' };
  if (decoded.header.alg !== 'RS256') return { ok: false, reason: 'alg' };
  if (!decoded.header.kid) return { ok: false, reason: 'kid' };
  try {
    const jwks = opts?.jwks ?? (await fetchJwks());
    const jwk = jwks.keys.find((k) => k.kid === decoded.header.kid);
    if (!jwk) return { ok: false, reason: 'jwk' };
    const signed = await verifyRs256(token, jwk);
    if (!signed) return { ok: false, reason: 'sig' };
  } catch {
    return { ok: false, reason: 'jwks' };
  }
  const claims = assertEvolveOidcClaims(decoded.payload, opts?.nowSec);
  if (!claims.ok) return { ok: false, reason: claims.reason };
  return { ok: true, reason: 'ok', payload: decoded.payload };
}
