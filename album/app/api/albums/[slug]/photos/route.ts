import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { daysLeft, isExpired, renewedExpiry } from "@/lib/album";
import {
  ALLOWED_MIME,
  MAX_FILE_BYTES,
  MAX_FILES_PER_UPLOAD,
  MAX_NICKNAME_LENGTH,
  MAX_PHOTOS_PER_ALBUM,
} from "@/lib/constants";
import { storePhoto, storePreparedPhoto } from "@/lib/storage";

type Ctx = { params: { slug: string } };

type Skip = { name: string; reason: string };

function acceptable(file: File): boolean {
  return (
    ALLOWED_MIME.has(file.type) ||
    /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
  );
}

export async function POST(req: Request, { params }: Ctx) {
  const album = await prisma.album.findUnique({ where: { slug: params.slug } });
  if (!album) return jsonError("Album not found", 404);
  if (isExpired(album.expiresAt)) return jsonError("Album expired", 410);
  if (album.uploadLocked) return jsonError("Uploads locked by admin", 403);

  const form = await req.formData();
  const nickname = String(form.get("nickname") || "")
    .trim()
    .slice(0, MAX_NICKNAME_LENGTH);
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const thumbs = form.getAll("thumbs").filter((f): f is File => f instanceof File);
  /** Present only when the browser prepared the pair. */
  const prepared = thumbs.length === files.length && files.length > 0;
  const declaredWidth = Number(form.get("width") || 0);
  const declaredHeight = Number(form.get("height") || 0);

  if (files.length === 0) return jsonError("No files");
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return jsonError(`Max ${MAX_FILES_PER_UPLOAD} files per upload`);
  }

  const remaining = MAX_PHOTOS_PER_ALBUM - album.photoCount;
  if (remaining <= 0) return jsonError("Album is full (500 photos)", 403);
  const accepted = files.slice(0, remaining);
  const skipped: Skip[] = files.slice(remaining).map((f) => ({
    name: f.name,
    reason: "相册已满 / album full",
  }));

  const created = [];

  for (const [index, file] of accepted.entries()) {
    const isHeic = /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
    if (!acceptable(file)) {
      skipped.push({ name: file.name, reason: "不支持的格式 / unsupported type" });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push({ name: file.name, reason: "文件过大 / too large" });
      continue;
    }

    const fileId = randomBytes(8).toString("hex");
    let stored;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (prepared) {
        const thumb = Buffer.from(await thumbs[index].arrayBuffer());
        stored = await storePreparedPhoto(album.id, fileId, {
          full: buffer,
          thumb,
          width: declaredWidth,
          height: declaredHeight,
        });
      } else {
        stored = await storePhoto(album.id, fileId, buffer);
      }
    } catch (err) {
      console.error("store photo failed", err);
      skipped.push({
        name: file.name,
        reason: isHeic
          ? "HEIC 转换失败，请用系统「照片」导出 JPEG 再传"
          : "处理失败 / process failed",
      });
      continue;
    }

    const photo = await prisma.photo.create({
      data: {
        albumId: album.id,
        storageKey: stored.storageKey,
        thumbKey: stored.thumbKey,
        url: stored.url,
        thumbUrl: stored.thumbUrl,
        urlCn: stored.urlCn,
        thumbUrlCn: stored.thumbUrlCn,
        width: stored.width,
        height: stored.height,
        uploaderName: nickname,
      },
    });
    created.push(photo);
  }

  if (created.length === 0) {
    return jsonError(
      skipped[0]?.reason || "No valid images uploaded (check type/size)",
      400
    );
  }

  const renewed = await prisma.album.update({
    where: { id: album.id },
    data: {
      photoCount: { increment: created.length },
      expiresAt: renewedExpiry(album.expiresAt),
    },
  });

  return jsonOk({
    uploaded: created.length,
    skipped,
    expiresAt: renewed.expiresAt.toISOString(),
    daysLeft: daysLeft(renewed.expiresAt),
    photos: created.map((p) => ({
      id: p.id,
      url: p.url,
      thumbUrl: p.thumbUrl,
      width: p.width,
      height: p.height,
      uploaderName: p.uploaderName,
      pinned: p.pinned,
      pinMode: p.pinMode,
      likeCount: 0,
      commentCount: 0,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
