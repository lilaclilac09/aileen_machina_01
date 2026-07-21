import { ALBUM_TTL_DAYS } from "./constants";

export function albumExpiresAt(from = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + ALBUM_TTL_DAYS);
  return d;
}

export function isExpired(expiresAt: Date | string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function daysLeft(expiresAt: Date | string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function publicAlbumUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010").replace(/\/$/, "");
  return `${base}/a/${slug}`;
}
