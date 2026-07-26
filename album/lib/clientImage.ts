"use client";

import {
  FULL_MAX_EDGE,
  THUMB_MAX_EDGE,
  UPLOAD_BUDGET_BYTES,
} from "./constants";

export type PreparedImage = {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
};

type Source = ImageBitmap | HTMLImageElement;

function sourceSize(source: Source): { width: number; height: number } {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/**
 * Decoding through the browser also converts iPhone HEIC, which server-side
 * sharp cannot read without libheif.
 */
async function decode(file: File): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safari rejects some formats here; fall through to <img>.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

function scaleTo(
  source: Source,
  maxEdge: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const { width, height } = sourceSize(source);
  const ratio = Math.min(1, maxEdge / Math.max(width, height));
  const outWidth = Math.max(1, Math.round(width * ratio));
  const outHeight = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(source, 0, 0, outWidth, outHeight);
  return { canvas, width: outWidth, height: outHeight };
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      "image/jpeg",
      quality
    );
  });
}

/** Re-encodes at lower quality until the blob fits the request budget. */
async function encodeWithinBudget(
  canvas: HTMLCanvasElement,
  startQuality: number,
  budget: number
): Promise<Blob> {
  let quality = startQuality;
  let blob = await toBlob(canvas, quality);
  while (blob.size > budget && quality > 0.45) {
    quality -= 0.1;
    blob = await toBlob(canvas, quality);
  }
  return blob;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const source = await decode(file);

  const fullScaled = scaleTo(source, FULL_MAX_EDGE);
  const full = await encodeWithinBudget(fullScaled.canvas, 0.85, UPLOAD_BUDGET_BYTES);

  const thumbScaled = scaleTo(source, THUMB_MAX_EDGE);
  const thumb = await encodeWithinBudget(thumbScaled.canvas, 0.78, UPLOAD_BUDGET_BYTES);

  if (source instanceof ImageBitmap) source.close();

  return {
    full,
    thumb,
    width: fullScaled.width,
    height: fullScaled.height,
  };
}
