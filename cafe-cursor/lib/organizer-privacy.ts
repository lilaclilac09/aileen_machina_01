import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Encrypt organizer-only audit payloads (recipient lists, etc.).
 * Key: ORGANIZER_COPY_SECRET or SESSION_SECRET (server env only — never shipped to clients).
 */
function getCopyKey(): Buffer {
  const raw =
    (process.env.ORGANIZER_COPY_SECRET || process.env.SESSION_SECRET || "")
      .trim()
      .replace(/^["']|["']$/g, "") || "cafe-cursor-organizer-copy-fallback";
  return createHash("sha256").update(raw).digest();
}

export type OrganizerAuditPayload = {
  v: 1;
  at: string;
  subject: string;
  from: string;
  sentCount: number;
  /** Full recipient list — only inside ciphertext */
  recipients: string[];
};

export function encryptOrganizerAudit(payload: OrganizerAuditPayload): string {
  const key = getCopyKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plain = Buffer.from(JSON.stringify(payload), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: ocopy1.<iv>.<tag>.<ciphertext>  (all base64url)
  const b64 = (b: Buffer) =>
    b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `ocopy1.${b64(iv)}.${b64(tag)}.${b64(enc)}`;
}

export function decryptOrganizerAudit(blob: string): OrganizerAuditPayload {
  const parts = blob.trim().split(".");
  if (parts.length !== 4 || parts[0] !== "ocopy1") {
    throw new Error("Invalid encrypted organizer receipt");
  }
  const fromB64 = (s: string) => {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
  };
  const iv = fromB64(parts[1]);
  const tag = fromB64(parts[2]);
  const data = fromB64(parts[3]);
  const key = getCopyKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as OrganizerAuditPayload;
}

/** Public Reply-To shown to guests — never a personal inbox. */
export function getPublicReplyToAddress(): string {
  const explicit = (process.env.NOTIFY_REPLY_TO || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();
  if (explicit && !/@gmail\.com$/i.test(explicit) && !/@qq\.com$/i.test(explicit)) {
    return explicit;
  }
  // Prefer verified brand address from FROM_EMAIL
  const from = (process.env.FROM_EMAIL || "").trim();
  const m = from.match(/<([^>]+)>/);
  const addr = (m?.[1] || from).trim().toLowerCase();
  if (addr.includes("@") && !/@gmail\.com$/i.test(addr)) return addr;
  return "cafe@aileena.xyz";
}

/**
 * Private organizer inbox for encrypted copies (Vercel NOTIFY_CC_EMAIL).
 * Never hardcode a personal address in source.
 */
export function getOrganizerInbox(): string {
  const cc = (process.env.NOTIFY_CC_EMAIL || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();
  if (cc.includes("@")) return cc;
  // Brand fallback so Notify still works without exposing a personal mailbox in git
  return getPublicReplyToAddress();
}

export function maskContact(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${(user[0] || "*")}***@${domain}`;
}
