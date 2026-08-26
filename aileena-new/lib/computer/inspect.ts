import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { inspectFilesForRoute } from './allowlist';

const BLOCKED_NAME = /(\.env|\.pem|credentials|secrets?)/i;

export function findRepoRoot(): string {
  const cwd = process.cwd();
  const parent = join(cwd, '..');
  if (existsSync(join(cwd, 'AGENTS.md')) && existsSync(join(cwd, 'aileena-new'))) return cwd;
  if (existsSync(join(parent, 'AGENTS.md')) && existsSync(join(parent, 'aileena-new'))) return parent;
  return parent;
}

function resolveAllowlisted(relFromRepo: string): string | null {
  if (BLOCKED_NAME.test(relFromRepo)) return null;
  const root = resolve(findRepoRoot());
  const abs = resolve(join(root, relFromRepo));
  const rel = relative(root, abs);
  if (rel.startsWith('..')) return null;
  if (!existsSync(abs)) return null;
  return abs;
}

export type InspectedFile = { path: string; exists: boolean; bytes: number; text: string };

export function inspectRouteFiles(route: string): InspectedFile[] {
  const files = inspectFilesForRoute(route);
  return files.map((path) => {
    const abs = resolveAllowlisted(path);
    if (!abs) return { path, exists: false, bytes: 0, text: '' };
    const text = readFileSync(abs, 'utf8');
    return { path, exists: true, bytes: Buffer.byteLength(text), text };
  });
}

export function analyzeDailyFixPlan(files: InspectedFile[]): {
  problemsFound: string[];
  proposedFilesToChange: string[];
  implementationPlan: string[];
  risksBlockers: string[];
} {
  const byPath = new Map(files.map((f) => [f.path, f]));
  const board = byPath.get('aileena-new/components/DailyBoard.tsx')?.text ?? '';
  const unlock = byPath.get('aileena-new/components/OwnerUnlockForm.tsx')?.text ?? '';
  const notesApi = byPath.get('aileena-new/app/api/daily/notes/route.ts')?.text ?? '';
  const commentsApi = byPath.get('aileena-new/app/api/daily/comments/route.ts')?.text ?? '';
  const store = byPath.get('aileena-new/lib/dailyBoardStore.ts')?.text ?? '';

  const problemsFound: string[] = [];
  const proposedFilesToChange: string[] = [];
  const implementationPlan: string[] = [];
  const risksBlockers: string[] = [];

  if (/OwnerUnlockForm/.test(board) || /daily-owner-enter/.test(board)) {
    problemsFound.push(
      'Owner door: DailyBoard still renders an owner unlock on the public page (data-testid=daily-owner-enter). Passkey belongs off this board.',
    );
    proposedFilesToChange.push('aileena-new/components/DailyBoard.tsx');
  }
  if (/OWNER_KEY/.test(unlock) || /type=["']password["']/.test(unlock)) {
    problemsFound.push(
      'Owner door: unlock form still names a typed secret or uses a password field. Site UI is KeyShield (PRF → HKDF → AES-GCM) on this device only.',
    );
    proposedFilesToChange.push('aileena-new/components/OwnerUnlockForm.tsx');
  }
  if (/className=/.test(unlock) && /--daily-/.test(board) && /OwnerUnlockForm/.test(board)) {
    problemsFound.push(
      'Owner door: unlock form uses Tailwind cream/teal, not daily theme CSS variables — looks bolted onto the board.',
    );
    proposedFilesToChange.push('aileena-new/components/DailyBoard.tsx');
  }

  if (/dailyBoardWritesOk/.test(notesApi) && /not_stored/.test(notesApi)) {
    problemsFound.push(
      'Note save: POST /api/daily/notes is owner-only and 503s when persistence is memory on Vercel.',
    );
  }
  if (/showWriter = owner \|\|/.test(board) || /on this phone until you enter/.test(board)) {
    problemsFound.push(
      'Note display: visitors with no todayNote see a local writer (“on this phone until you enter”) instead of a clear public latest-note surface.',
    );
    proposedFilesToChange.push('aileena-new/components/DailyBoard.tsx');
  }
  if (!/daily-persistence/.test(board) || !/this instance/.test(board)) {
    problemsFound.push(
      'Note display: public board does not name memory persistence honestly (“this instance”).',
    );
    proposedFilesToChange.push('aileena-new/components/DailyBoard.tsx');
  }
  if (/VERCEL/.test(store) && /memory/.test(store)) {
    problemsFound.push(
      'Note save path: dailyBoardStore uses Redis when UPSTASH_* is set; otherwise in-memory. Production writes refuse memory.',
    );
    proposedFilesToChange.push('aileena-new/lib/dailyBoardStore.ts');
  }

  if (/commentNote \?/.test(board) || /\{commentNote \?/.test(board)) {
    problemsFound.push(
      'Comments: bubble UI mounts only when commentNote exists (todayNote ?? latest). Empty board → no comment path.',
    );
  }
  if (/not_stored/.test(commentsApi)) {
    problemsFound.push(
      'Comments: POST /api/daily/comments returns 503 without a durable store — bubbles look “missing” on production without Redis.',
    );
    proposedFilesToChange.push('aileena-new/app/api/daily/comments/route.ts');
  }

  implementationPlan.push(
    'Do not modify files in this computer task. Plan only.',
    'Owner door: KeyShield (WebAuthn PRF → HKDF → AES-256-GCM) on council and Console, never a typed secret on /daily.',
    'Notes: public GET should show latest published note; writer stays owner-only; empty state stays “nothing today yet.”',
    'Comments: require a published note as the target; keep 503 bolt copy; do not invent a second store.',
    'Verify with pnpm verify:daily-board + 390px stills. No merge without owner approval and screenshots.',
  );

  risksBlockers.push(
    'This prototype did not change the repo. Applying a patch still needs owner approval.',
    'Durable notes/comments on Vercel still need existing Upstash env — do not add a parallel store.',
    'Cloudflare Computer is not wired; this inspect ran in the local shim against the git tree.',
  );

  const unique = [...new Set(proposedFilesToChange)];
  return {
    problemsFound,
    proposedFilesToChange: unique,
    implementationPlan,
    risksBlockers,
  };
}
