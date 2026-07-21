import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isAlbumAdmin } from "@/lib/auth";
import { isPinned, nextPinMode, type PinMode } from "@/lib/pin";

type Ctx = { params: { slug: string; id: string } };

const bodySchema = z
  .object({
    mode: z.enum(["none", "front", "center"]).optional(),
  })
  .optional();

export async function POST(req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);
  if (!isAlbumAdmin(album.id, album.adminSecretHash)) {
    return jsonError("Admin only", 403);
  }

  const photo = await prisma.photo.findFirst({
    where: { id: params.id, albumId: album.id, deletedAt: null },
  });
  if (!photo) return jsonError("Photo not found", 404);

  let body: unknown = undefined;
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  const parsed = bodySchema.safeParse(body);
  const mode: PinMode =
    parsed.success && parsed.data?.mode
      ? parsed.data.mode
      : nextPinMode(photo.pinMode);

  const updated = await prisma.photo.update({
    where: { id: photo.id },
    data: {
      pinMode: mode,
      pinned: isPinned(mode),
      pinnedAt: isPinned(mode) ? new Date() : null,
    },
  });

  return jsonOk({
    id: updated.id,
    pinned: updated.pinned,
    pinMode: updated.pinMode,
  });
}
