import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { getOrCreateVisitorKey, visitorCookieOptions } from "@/lib/auth";

type Ctx = { params: { slug: string; id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);

  const photo = await prisma.photo.findFirst({
    where: { id: params.id, albumId: album.id, deletedAt: null },
  });
  if (!photo) return jsonError("Photo not found", 404);

  const visitorKey = getOrCreateVisitorKey();
  cookies().set(visitorCookieOptions(visitorKey));

  const existing = await prisma.like.findUnique({
    where: {
      photoId_visitorKey: { photoId: photo.id, visitorKey },
    },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const updated = await prisma.photo.update({
      where: { id: photo.id },
      data: { likeCount: { decrement: 1 } },
    });
    return jsonOk({ liked: false, likeCount: Math.max(0, updated.likeCount) });
  }

  await prisma.like.create({
    data: { photoId: photo.id, visitorKey },
  });
  const updated = await prisma.photo.update({
    where: { id: photo.id },
    data: { likeCount: { increment: 1 } },
  });
  return jsonOk({ liked: true, likeCount: updated.likeCount });
}
