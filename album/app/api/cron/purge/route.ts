import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isPurgeDue } from "@/lib/album";
import { deleteStoredObjects } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(req.url).searchParams.get("secret") || "";
  return bearer === secret || query === secret;
}

/**
 * Purge albums whose expiresAt + 7d grace has passed.
 * Vercel Cron: GET /api/cron/purge  Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: Request) {
  if (!authorized(req)) return jsonError("Unauthorized", 401);

  const candidates = await prisma.album.findMany({
    where: { expiresAt: { lt: new Date() } },
    include: {
      photos: {
        where: { deletedAt: null },
        select: {
          id: true,
          storageKey: true,
          thumbKey: true,
          url: true,
          thumbUrl: true,
          urlCn: true,
          thumbUrlCn: true,
        },
      },
    },
    take: 50,
  });

  const due = candidates.filter((a) => isPurgeDue(a.expiresAt));
  let purgedAlbums = 0;
  let purgedPhotos = 0;

  for (const album of due) {
    if (album.photos.length > 0) {
      await deleteStoredObjects({
        keys: album.photos.flatMap((p) => [p.storageKey, p.thumbKey]),
        urls: album.photos.flatMap((p) =>
          [p.url, p.thumbUrl, p.urlCn, p.thumbUrlCn].filter(Boolean)
        ),
      });
      purgedPhotos += album.photos.length;
    }
    await prisma.album.delete({ where: { id: album.id } });
    purgedAlbums += 1;
  }

  return jsonOk({
    ok: true,
    scanned: candidates.length,
    purgedAlbums,
    purgedPhotos,
    graceDays: 7,
  });
}
