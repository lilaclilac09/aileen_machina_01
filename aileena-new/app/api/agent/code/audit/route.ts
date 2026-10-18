import { requireOwnerFromRequest } from '../../../../../lib/owner-gate';
import { readCodeAudit } from '../../../../../lib/codeAgent/run';

export const dynamic = 'force-dynamic';

/** Owner-only: code-mode audit log (repo, run id, tool names, paths, sizes, PR). No file contents. */
export async function GET(req: Request) {
  if (!(await requireOwnerFromRequest(req))) {
    return Response.json({ error: 'Owner only.' }, { status: 403 });
  }
  return Response.json({ rows: await readCodeAudit(100) }, { headers: { 'Cache-Control': 'no-store' } });
}
