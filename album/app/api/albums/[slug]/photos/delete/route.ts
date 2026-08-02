import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isAlbumAdmin } from "@/lib/auth";
import { deleteStoredObjects } from "@/lib/storage";

type Ctx = { params: { slug: string } };

const bodySchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);
  if (!isAlbumAdmin(album.id, album.adminSecretHash)) {
    return jsonError("Admin only", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("photoIds required");

  const photos = await prisma.photo.findMany({
    where: {
      albumId: album.id,
      id: { in: parsed.data.photoIds },
      deletedAt: null,
    },
  });

  if (photos.length === 0) return jsonOk({ deleted: 0 });

  const now = new Date();
  await prisma.photo.updateMany({
    where: { id: { in: photos.map((p) => p.id) } },
    data: { deletedAt: now },
  });

  const nextCount = Math.max(0, album.photoCount - photos.length);
  await prisma.album.update({
    where: { id: album.id },
    data: { photoCount: nextCount },
  });

  await deleteStoredObjects({
    keys: photos.flatMap((p) => [p.storageKey, p.thumbKey]),
    urls: photos.flatMap((p) => [p.url, p.thumbUrl, p.urlCn, p.thumbUrlCn].filter(Boolean)),
  });

  return jsonOk({ deleted: photos.length });
}
