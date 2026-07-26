import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import OSS from "ali-oss";
import { FULL_MAX_EDGE, THUMB_MAX_EDGE } from "./constants";

export type StoredObject = {
  key: string;
  url: string;
};

export type DualStored = {
  storageKey: string;
  thumbKey: string;
  url: string;
  thumbUrl: string;
  urlCn: string;
  thumbUrlCn: string;
  width: number;
  height: number;
};

export type StorageDriver = "local" | "blob" | "r2" | "dual";

export function storageDriver(): StorageDriver {
  const d = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  if (d === "blob" || d === "r2" || d === "dual") return d;
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

function r2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing (R2_ACCOUNT_ID / ACCESS_KEY / SECRET)");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function putR2(key: string, data: Buffer, contentType: string): Promise<StoredObject> {
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!bucket || !publicBase) throw new Error("R2_BUCKET / R2_PUBLIC_BASE_URL missing");

  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key, url: `${publicBase.replace(/\/$/, "")}/${key}` };
}

function ossClient(): OSS {
  const region = process.env.OSS_REGION;
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;
  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    throw new Error("OSS credentials missing (OSS_REGION / KEY / SECRET / BUCKET)");
  }
  return new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
    secure: true,
    timeout: 60_000,
  });
}

async function putOss(key: string, data: Buffer, contentType: string): Promise<StoredObject> {
  const publicBase = process.env.OSS_PUBLIC_BASE_URL;
  if (!publicBase) throw new Error("OSS_PUBLIC_BASE_URL missing");

  await ossClient().put(key, data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  return { key, url: `${publicBase.replace(/\/$/, "")}/${key}` };
}

async function deleteR2(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) return;
  await r2Client()
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    .catch(() => undefined);
}

async function deleteOss(key: string): Promise<void> {
  await ossClient()
    .delete(key)
    .catch(() => undefined);
}

type Pair = { full: Buffer; thumb: Buffer; width: number; height: number };

async function storePair(
  albumId: string,
  fileId: string,
  { full, thumb, width, height }: Pair
): Promise<DualStored> {
  const storageKey = `${albumId}/${fileId}.jpg`;
  const thumbKey = `${albumId}/${fileId}_t.jpg`;
  const contentType = "image/jpeg";
  const d = storageDriver();

  if (d === "dual") {
    const [fullIntl, thumbIntl, fullCn, thumbCn] = await Promise.all([
      putR2(storageKey, full, contentType),
      putR2(thumbKey, thumb, contentType),
      putOss(storageKey, full, contentType),
      putOss(thumbKey, thumb, contentType),
    ]);
    return {
      storageKey,
      thumbKey,
      url: fullIntl.url,
      thumbUrl: thumbIntl.url,
      urlCn: fullCn.url,
      thumbUrlCn: thumbCn.url,
      width,
      height,
    };
  }

  const put =
    d === "r2"
      ? (key: string, data: Buffer) => putR2(key, data, contentType)
      : d === "blob"
        ? (key: string, data: Buffer) => putBlob(key, data, contentType)
        : (key: string, data: Buffer) => putLocal(key, data);

  const [fullObj, thumbObj] = await Promise.all([
    put(storageKey, full),
    put(thumbKey, thumb),
  ]);

  return {
    storageKey,
    thumbKey,
    url: fullObj.url,
    thumbUrl: thumbObj.url,
    urlCn: "",
    thumbUrlCn: "",
    width,
    height,
  };
}

/** Server-side resize path, used when the browser could not prepare the image. */
export async function storePhoto(
  albumId: string,
  fileId: string,
  buffer: Buffer
): Promise<DualStored> {
  const processed = await processImage(buffer);
  return storePair(albumId, fileId, {
    full: processed.full,
    thumb: processed.thumb,
    width: processed.width,
    height: processed.height,
  });
}

/** Browser already downscaled and encoded both sizes; just persist them. */
export async function storePreparedPhoto(
  albumId: string,
  fileId: string,
  prepared: Pair
): Promise<DualStored> {
  return storePair(albumId, fileId, prepared);
}

export async function deleteStoredObjects(refs: {
  keys: string[];
  urls: string[];
}): Promise<void> {
  const d = storageDriver();
  const { keys, urls } = refs;

  if (d === "local") {
    await Promise.all(
      keys.map(async (key) => {
        const abs = path.join(process.cwd(), "data", "uploads", key);
        await unlink(abs).catch(() => undefined);
      })
    );
    return;
  }

  if (d === "blob") {
    await Promise.all(urls.map((u) => del(u).catch(() => undefined)));
    return;
  }

  if (d === "r2") {
    await Promise.all(keys.map((k) => deleteR2(k)));
    return;
  }

  if (d === "dual") {
    await Promise.all([
      ...keys.map((k) => deleteR2(k)),
      ...keys.map((k) => deleteOss(k)),
    ]);
  }
}
