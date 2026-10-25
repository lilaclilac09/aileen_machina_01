import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { isShelfBookSlug, readEpubBytes } from '@/lib/shelfEpub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stream a private EPUB for one shelf book slug.
 * Owner session only — 403 visitors; never exposed under /public.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { slug: rawSlug } = await ctx.params;
  const slug = decodeURIComponent(rawSlug || '').trim().toLowerCase();
  if (!isShelfBookSlug(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const bytes = await readEpubBytes(slug);
  if (!bytes) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': `inline; filename="${slug}.epub"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
