import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isAlbumAdmin } from "@/lib/auth";
import { daysLeft, isExpired, publicAlbumUrl } from "@/lib/album";
import { MAX_PHOTOS_PER_ALBUM } from "@/lib/constants";

type Ctx = { params: { slug: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({
    where: { slug: params.slug },
  });
  if (!album) return jsonError("Album not found", 404);

  const photos = await prisma.photo.findMany({
    where: { albumId: album.id, deletedAt: null },
    orderBy: [{ pinned: "desc" }, { pinnedAt: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { comments: true } },
    },
  });

  const admin = isAlbumAdmin(album.id, album.adminSecretHash);
  const expired = isExpired(album.expiresAt);

  return jsonOk({
    album: {
      id: album.id,
      slug: album.slug,
      title: album.title,
      expiresAt: album.expiresAt.toISOString(),
      daysLeft: daysLeft(album.expiresAt),
      expired,
      uploadLocked: album.uploadLocked || expired,
      photoCount: album.photoCount,
      maxPhotos: MAX_PHOTOS_PER_ALBUM,
      url: publicAlbumUrl(album.slug),
      isAdmin: admin,
    },
    photos: photos.map((p) => ({
      id: p.id,
      url: p.url,
      thumbUrl: p.thumbUrl,
      width: p.width,
      height: p.height,
      uploaderName: p.uploaderName,
      caption: p.caption,
      pinned: p.pinned,
      likeCount: p.likeCount,
      commentCount: p._count.comments,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
