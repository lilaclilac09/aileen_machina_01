/**
 * Pick China vs intl CDN edge for photo URLs.
 * Priority: x-gather-region → Vercel/CF country → Accept-Language zh-CN.
 */
export function preferChinaCdn(req: Request): boolean {
  const forced = req.headers.get("x-gather-region")?.toLowerCase();
  if (forced === "cn" || forced === "china") return true;
  if (forced === "intl" || forced === "global") return false;

  const country = (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    ""
  ).toUpperCase();
  if (country === "CN") return true;
  if (country && country !== "CN") return false;

  const al = req.headers.get("accept-language") || "";
  const primary = al.split(",")[0]?.trim() || "";
  if (/^zh([-_]cn)?$/i.test(primary) || /^zh-hans/i.test(primary)) return true;
  return false;
}

export function pickPhotoUrls(
  photo: {
    url: string;
    thumbUrl: string;
    urlCn?: string | null;
    thumbUrlCn?: string | null;
  },
  useCn: boolean
): { url: string; thumbUrl: string; cdn: "cn" | "intl" } {
  if (useCn && photo.urlCn && photo.thumbUrlCn) {
    return { url: photo.urlCn, thumbUrl: photo.thumbUrlCn, cdn: "cn" };
  }
  return { url: photo.url, thumbUrl: photo.thumbUrl, cdn: "intl" };
}
