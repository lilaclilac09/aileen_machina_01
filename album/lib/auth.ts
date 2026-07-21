import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_PREFIX, VISITOR_COOKIE } from "./constants";

export function hashSecret(secret: string): string {
  const salt = process.env.ADMIN_COOKIE_SECRET || "dev-secret";
  return createHash("sha256").update(`${salt}:${secret}`).digest("hex");
}

export function generateAdminSecret(): string {
  return randomBytes(6).toString("hex"); // 12 hex chars, easy to copy
}

export function generateSlug(): string {
  return randomBytes(5).toString("hex");
}

export function secretsEqual(a: string, b: string): boolean {
  const ha = Buffer.from(hashSecret(a));
  const hb = Buffer.from(hashSecret(b));
  if (ha.length !== hb.length) return false;
  return timingSafeEqual(ha, hb);
}

export function adminCookieName(albumId: string): string {
  return `${ADMIN_COOKIE_PREFIX}${albumId}`;
}

export function isAlbumAdmin(albumId: string, adminSecretHash: string): boolean {
  const jar = cookies();
  const token = jar.get(adminCookieName(albumId))?.value;
  if (!token) return false;
  return hashSecret(token) === adminSecretHash;
}

export function getOrCreateVisitorKey(): string {
  const jar = cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;
  return randomBytes(16).toString("hex");
}

export function visitorCookieOptions(value: string) {
  return {
    name: VISITOR_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  };
}

export function adminCookieOptions(albumId: string, secret: string) {
  return {
    name: adminCookieName(albumId),
    value: secret,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 40,
  };
}
