import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";
import { FULL_MAX_EDGE, THUMB_MAX_EDGE } from "./constants";

export type StoredObject = {
  key: string;
  url: string;
};

function driver(): "local" | "blob" | "r2" {
  const d = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  if (d === "blob" || d === "r2") return d;
  return "local";
}

async function processImage(buffer: Buffer): Promise<{
  full: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
  contentType: string;
}> {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(buffer, { failOn: "none" }).rotate().metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  const full = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: FULL_MAX_EDGE,
      height: FULL_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  const thumb = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: THUMB_MAX_EDGE,
      height: THUMB_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();

  return { full, thumb, width, height, contentType: "image/jpeg" };
}

async function putLocal(key: string, data: Buffer): Promise<StoredObject> {
  const abs = path.join(process.cwd(), "data", "uploads", key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, data);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
  return { key, url: `${base}/api/files/${key}` };
}

async function putBlob(key: string, data: Buffer, contentType: string): Promise<StoredObject> {
  const result = await put(key, data, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return { key, url: result.url };
}

/** Phase 2: wire @aws-sdk/client-s3 + dual-write 阿里云 OSS for CN edge. */
async function putR2(_key: string, _data: Buffer, _contentType: string): Promise<StoredObject> {
  throw new Error(
    "STORAGE_DRIVER=r2 is Phase 2. Use local (dev) or blob (Vercel) for MVP."
  );
}

export async function storePhoto(
  albumId: string,
  fileId: string,
  buffer: Buffer
): Promise<{
  storageKey: string;
  thumbKey: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
}> {
  const processed = await processImage(buffer);
  const storageKey = `${albumId}/${fileId}.jpg`;
  const thumbKey = `${albumId}/${fileId}_t.jpg`;
  const d = driver();

  let fullObj: StoredObject;
  let thumbObj: StoredObject;

  if (d === "blob") {
    fullObj = await putBlob(storageKey, processed.full, processed.contentType);
    thumbObj = await putBlob(thumbKey, processed.thumb, processed.contentType);
  } else if (d === "r2") {
    fullObj = await putR2(storageKey, processed.full, processed.contentType);
    thumbObj = await putR2(thumbKey, processed.thumb, processed.contentType);
  } else {
    fullObj = await putLocal(storageKey, processed.full);
    thumbObj = await putLocal(thumbKey, processed.thumb);
  }

  return {
    storageKey,
    thumbKey,
    url: fullObj.url,
    thumbUrl: thumbObj.url,
    width: processed.width,
    height: processed.height,
  };
}

export async function deleteStoredObjects(urlsOrKeys: string[]): Promise<void> {
  const d = driver();
  await Promise.all(
    urlsOrKeys.map(async (ref) => {
      try {
        if (d === "local") {
          const key = ref.includes("/api/files/")
            ? ref.split("/api/files/")[1]
            : ref;
          const abs = path.join(process.cwd(), "data", "uploads", key);
          await unlink(abs).catch(() => undefined);
        } else if (d === "blob") {
          await del(ref).catch(() => undefined);
        }
        // R2 hard-delete: Phase 2
      } catch {
        /* ignore */
      }
    })
  );
}
