import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import {
  adminCookieOptions,
  generateAdminSecret,
  generateSlug,
  hashSecret,
} from "@/lib/auth";
import { albumExpiresAt, publicAlbumUrl } from "@/lib/album";
import { ALBUM_TTL_DAYS, MAX_PHOTOS_PER_ALBUM, MAX_TITLE_LENGTH } from "@/lib/constants";
import { cookies } from "next/headers";

const createSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Title required (1–80 chars)");
  }

  const adminSecret = generateAdminSecret();
  let slug = generateSlug();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.album.findUnique({ where: { slug } });
    if (!exists) break;
    slug = generateSlug();
  }

  const album = await prisma.album.create({
    data: {
      slug,
      title: parsed.data.title,
      adminSecretHash: hashSecret(adminSecret),
      expiresAt: albumExpiresAt(),
    },
  });

  cookies().set(adminCookieOptions(album.id, adminSecret));

  return jsonOk({
    album: {
      id: album.id,
      slug: album.slug,
      title: album.title,
      expiresAt: album.expiresAt.toISOString(),
      ttlDays: ALBUM_TTL_DAYS,
      maxPhotos: MAX_PHOTOS_PER_ALBUM,
      url: publicAlbumUrl(album.slug),
    },
    adminSecret,
  });
}
