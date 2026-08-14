/**
 * POST /api/owner/voice-code/apply — owner door.
 *
 * OWNER_KEY session (`__aileena_pass` via=owner) only.
 * Writes only under the Console/footer allowlist.
 * Missing session → 401, no file touch. No-op patch → 409, never fake 200.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { applyAllowlistedPatch } from '@/lib/voiceCodeApply';
import { VOICE_CODE_WRITE_ALLOWLIST } from '@/lib/voiceCodeAllowlist';

export const runtime = 'nodejs';
export const maxDuration = 15;

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return json(
      {
        ok: false,
        apply: false,
        written: [],
        error: 'Owner session required.',
        allowlist: VOICE_CODE_WRITE_ALLOWLIST,
      },
      401,
    );
  }

  if (process.env.VERCEL === '1') {
    return json(
      {
        ok: false,
        apply: false,
        written: [],
        error:
          'Owner apply is local-only. Vercel filesystem is ephemeral — copy the .patch and apply on the machine that holds the repo.',
        allowlist: VOICE_CODE_WRITE_ALLOWLIST,
      },
      503,
    );
  }

  let body: { patch?: unknown; apply?: unknown };
  try {
    body = (await req.json()) as { patch?: unknown; apply?: unknown };
  } catch {
    return json({ ok: false, apply: false, written: [], error: 'Invalid JSON.' }, 400);
  }

  const patch = typeof body.patch === 'string' ? body.patch : '';
  const result = applyAllowlistedPatch(process.cwd(), patch);
  if (!result.ok) {
    return json(
      {
        ok: false,
        apply: false,
        written: result.written,
        error: result.error,
        allowlist: VOICE_CODE_WRITE_ALLOWLIST,
      },
      result.status,
    );
  }

  return json(
    {
      ok: true,
      apply: true,
      written: result.written,
      allowlist: VOICE_CODE_WRITE_ALLOWLIST,
    },
    200,
  );
}
