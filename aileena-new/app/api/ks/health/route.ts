import { NextResponse } from 'next/server';
import { KS_APP_HOST, KS_HKDF_MASTER, KS_HKDF_VAULT_ID, KS_PRF_FIRST } from '@/lib/keyshield/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'keyshield',
    host: KS_APP_HOST,
    method: 'keyshield',
    prfFirst: KS_PRF_FIRST,
    hkdfMaster: KS_HKDF_MASTER,
    hkdfVaultId: KS_HKDF_VAULT_ID,
    railway: false,
  });
}
