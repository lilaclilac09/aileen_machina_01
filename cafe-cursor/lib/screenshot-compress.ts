/**
 * Compress a File to a JPEG data URL suitable for ticket upload.
 * Targets Spending-page screenshots without blowing Vercel body limits.
 */
export async function compressScreenshotToDataUrl(
  file: File,
  opts?: { maxWidth?: number; quality?: number; maxChars?: number }
): Promise<string> {
  const maxWidth = opts?.maxWidth ?? 1280;
  const quality = opts?.quality ?? 0.72;
  const maxChars = opts?.maxChars ?? 750_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image (PNG/JPEG/WebP)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let q = quality;
  let dataUrl = canvas.toDataURL("image/jpeg", q);
  while (dataUrl.length > maxChars && q > 0.35) {
    q -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", q);
  }
  if (dataUrl.length > maxChars) {
    throw new Error("Screenshot is still too large — crop to the Spending page");
  }
  return dataUrl;
}
