import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { getOrCreateVisitorKey, visitorCookieOptions } from "@/lib/auth";
import {
  COMMENT_RATE_LIMIT,
  COMMENT_RATE_WINDOW_MS,
  MAX_COMMENT_LENGTH,
  MAX_NICKNAME_LENGTH,
} from "@/lib/constants";

type Ctx = { params: { slug: string; id: string } };

const postSchema = z.object({
  authorName: z.string().trim().min(1).max(MAX_NICKNAME_LENGTH),
  body: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
});

export async function GET(_req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);

  const photo = await prisma.photo.findFirst({
    where: { id: params.id, albumId: album.id, deletedAt: null },
  });
  if (!photo) return jsonError("Photo not found", 404);

  const comments = await prisma.comment.findMany({
    where: { photoId: photo.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return jsonOk({
    comments: comments.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);

  const photo = await prisma.photo.findFirst({
    where: { id: params.id, albumId: album.id, deletedAt: null },
  });
  if (!photo) return jsonError("Photo not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Nickname and comment required");

  const visitorKey = getOrCreateVisitorKey();
  cookies().set(visitorCookieOptions(visitorKey));
  void visitorKey;

  // Soft limit: same nickname on same photo within window (no schema change).
  const since = new Date(Date.now() - COMMENT_RATE_WINDOW_MS);
  const recent = await prisma.comment.count({
    where: {
      photoId: photo.id,
      authorName: parsed.data.authorName,
      createdAt: { gte: since },
    },
  });
  if (recent >= COMMENT_RATE_LIMIT) {
    return jsonError("评论太快了，稍后再试 / slow down", 429);
  }

  const comment = await prisma.comment.create({
    data: {
      photoId: photo.id,
      authorName: parsed.data.authorName,
      body: parsed.data.body,
    },
  });

  return jsonOk({
    comment: {
      id: comment.id,
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    },
  });
}
