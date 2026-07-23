import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isAlbumAdmin } from "@/lib/auth";
import { daysLeft, isExpired, publicAlbumUrl } from "@/lib/album";
import { preferChinaCdn, pickPhotoUrls } from "@/lib/cdn";
import { pinRank } from "@/lib/pin";
import { MAX_PHOTOS_PER_ALBUM } from "@/lib/constants";

type Ctx = { params: { slug: string } };

export async function GET(req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({
    where: { slug: params.slug },
  });
  if (!album) return jsonError("Album not found", 404);

  const useCn = preferChinaCdn(req);

  const photos = await prisma.photo.findMany({
    where: { albumId: album.id, deletedAt: null },
    include: {
      _count: { select: { comments: true } },
    },
  });

  photos.sort((a, b) => {
    const pr = pinRank(b.pinMode) - pinRank(a.pinMode);
    if (pr !== 0) return pr;
    const pa = (b.pinnedAt?.getTime() || 0) - (a.pinnedAt?.getTime() || 0);
    if (pa !== 0) return pa;
    return b.createdAt.getTime() - a.createdAt.getTime();
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
      cdn: useCn ? "cn" : "intl",
    },
    photos: photos.map((p) => {
      const urls = pickPhotoUrls(p, useCn);
      return {
        id: p.id,
        url: urls.url,
        thumbUrl: urls.thumbUrl,
        width: p.width,
        height: p.height,
        uploaderName: p.uploaderName,
        caption: p.caption,
        pinned: p.pinned,
        pinMode: p.pinMode,
        likeCount: p.likeCount,
        commentCount: p._count.comments,
        createdAt: p.createdAt.toISOString(),
        cdn: urls.cdn,
      };
    }),
  });
}
