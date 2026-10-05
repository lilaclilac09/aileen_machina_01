import { NextResponse } from 'next/server';

/**
 * Related Origin Requests — Apple / Chrome fetch this at the RP ID
 * (https://aileena.xyz/.well-known/webauthn) so www and app.ks can share
 * the same iCloud Keychain passkey.
 * https://web.dev/articles/webauthn-related-origin-requests
 */
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    {
      origins: ['https://www.aileena.xyz', 'https://aileena.xyz', 'https://app.ks.aileena.xyz'],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Content-Type': 'application/json',
      },
    },
  );
}
