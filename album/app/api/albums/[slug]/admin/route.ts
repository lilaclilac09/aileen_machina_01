import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import {
  adminCookieOptions,
  hashSecret,
  isAlbumAdmin,
} from "@/lib/auth";

type Ctx = { params: { slug: string } };

const unlockSchema = z.object({
  secret: z.string().trim().min(6).max(64),
});

const patchSchema = z.object({
  uploadLocked: z.boolean().optional(),
  title: z.string().trim().min(1).max(80).optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = unlockSchema.safeParse(body);
  if (!parsed.success) return jsonError("Secret required");

  if (hashSecret(parsed.data.secret) !== album.adminSecretHash) {
    return jsonError("Wrong admin secret", 403);
  }

  cookies().set(adminCookieOptions(album.id, parsed.data.secret));
  return jsonOk({ ok: true, isAdmin: true });
}

export async function PATCH(req: Request, { params }: Ctx) {
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body");

  const updated = await prisma.album.update({
    where: { id: album.id },
    data: {
      ...(parsed.data.uploadLocked !== undefined
        ? { uploadLocked: parsed.data.uploadLocked }
        : {}),
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
    },
  });

  return jsonOk({
    uploadLocked: updated.uploadLocked,
    title: updated.title,
  });
}
