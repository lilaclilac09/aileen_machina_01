import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isAlbumAdmin } from "@/lib/auth";

type Ctx = { params: { slug: string; id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);
  if (!isAlbumAdmin(album.id, album.adminSecretHash)) {
    return jsonError("Admin only", 403);
  }

  const photo = await prisma.photo.findFirst({
    where: { id: params.id, albumId: album.id, deletedAt: null },
  });
  if (!photo) return jsonError("Photo not found", 404);

  const pinned = !photo.pinned;
  const updated = await prisma.photo.update({
    where: { id: photo.id },
    data: {
      pinned,
      pinnedAt: pinned ? new Date() : null,
    },
  });

  return jsonOk({ id: updated.id, pinned: updated.pinned });
}
