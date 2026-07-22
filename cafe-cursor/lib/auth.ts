import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "cafe-cursor-admin-session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SCRYPT_KEYLEN = 64;

function trimEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

function getAdminUsername(): string {
  return trimEnv(process.env.ADMIN_USERNAME) || "admin";
}

/**
 * Signing secret for HMAC session cookies.
 * Uses SESSION_SECRET if set; otherwise a stable fallback so existing
 * Vercel deploys keep working without forcing env edits.
 * (Password / ADMIN_* settings are never touched here.)
 */
function getSessionSecret(): string {
  const secret = trimEnv(process.env.SESSION_SECRET);
  if (secret.length >= 8) return secret;
  // Fallback for deploys that never set SESSION_SECRET — do not block login
  return "cafe-cursor-secret-key-2024";
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still do a compare to reduce trivial timing leaks on length
    const dummy = Buffer.alloc(bufA.length);
    timingSafeEqual(bufA, dummy);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Hash format: scrypt$<salt_b64>$<hash_b64>
 * Generate with: npx tsx scripts/hash-admin-password.ts 'your-password'
 */
export function hashAdminPassword(password: string, salt?: Buffer): string {
  const saltBuf = salt || randomBytes(16);
  const hash = scryptSync(password, saltBuf, SCRYPT_KEYLEN);
  return `scrypt$${saltBuf.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "base64");
    const expected = Buffer.from(parts[2], "base64");
    const actual = scryptSync(password, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * ADMIN_PASSWORD_HASH (scrypt) if set; else ADMIN_PASSWORD plaintext.
 * Does not rewrite or reject the operator's existing password env.
 */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = getAdminUsername();
  if (!safeEqualString(username.trim(), expectedUser)) {
    return false;
  }

  const hash = trimEnv(process.env.ADMIN_PASSWORD_HASH);
  if (hash) {
    return verifyPasswordHash(password, hash);
  }

  const plaintext = trimEnv(process.env.ADMIN_PASSWORD) || "cafecursor2024";
  return safeEqualString(password, plaintext);
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

/**
 * HMAC-signed session: v1.<payload_b64url>.<sig_b64url>
 * payload = username:expMs — secret never leaves the server.
 */
export function createSessionToken(): string {
  const secret = getSessionSecret();
  const username = getAdminUsername();
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${username}:${exp}`;
  const payloadPart = b64url(Buffer.from(payload, "utf8"));
  const sig = createHmac("sha256", secret).update(payloadPart).digest();
  return `v1.${payloadPart}.${b64url(sig)}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const secret = getSessionSecret();

    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return false;
    const [, payloadPart, sigPart] = parts;
    const expected = createHmac("sha256", secret).update(payloadPart).digest();
    const actual = fromB64url(sigPart);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return false;
    }

    const payload = fromB64url(payloadPart).toString("utf8");
    const colon = payload.lastIndexOf(":");
    if (colon <= 0) return false;
    const username = payload.slice(0, colon);
    const exp = parseInt(payload.slice(colon + 1), 10);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    return safeEqualString(username, getAdminUsername());
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionCookie();
  if (!token) return false;
  return verifySessionToken(token);
}
