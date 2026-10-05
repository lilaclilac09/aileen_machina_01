import { NextResponse } from 'next/server';

/**
 * Apple Passwords / credential managers (WWDC passkey endpoints).
 * https://github.com/w3c/webappsec-passkey-endpoints
 */
export const dynamic = 'force-static';

const LIVE = 'https://www.aileena.xyz/ks';

export function GET() {
  return NextResponse.json(
    {
      enroll: LIVE,
      manage: LIVE,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Content-Type': 'application/json',
      },
    },
  );
}
