import { z } from "zod";

/** Where guests should check if credits landed (Spending dashboard). */
export const CURSOR_SPENDING_URL = "https://cursor.com/dashboard/spending";

export const SUPPORT_CATEGORIES = [
  "credits_not_landed",
  "email_mismatch",
  "already_claimed",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/** data:image/jpeg|png|webp;base64,... — spending-page screenshot */
const SCREENSHOT_RE =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i;

/** Per-image ceiling (two shots still under Vercel body limit) */
export const MAX_SCREENSHOT_CHARS = 600_000;
export const MIN_SCREENSHOT_CHARS = 80;

const screenshotField = (label: string) =>
  z
    .string()
    .min(MIN_SCREENSHOT_CHARS, `${label} is required`)
    .max(MAX_SCREENSHOT_CHARS, `${label} is too large — try a smaller crop`)
    .refine(
      (v) => SCREENSHOT_RE.test(v),
      `${label} must be a PNG/JPEG/WebP image`
    );

/**
 * True when guest is switching / mismatching accounts — both Spending screenshots required.
 */
export function requiresDualScreenshots(input: {
  category: SupportCategory;
  email: string;
  lumaEmail?: string | null;
}): boolean {
  if (input.category === "email_mismatch") return true;
  const a = (input.email || "").trim().toLowerCase();
  const b = (input.lumaEmail || "").trim().toLowerCase();
  return Boolean(b && b.includes("@") && b !== a);
}

export const createTicketSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email")
      .max(255)
      .toLowerCase()
      .trim(),
    lumaEmail: z
      .string()
      .email()
      .max(255)
      .toLowerCase()
      .trim()
      .optional()
      .or(z.literal("")),
    category: z.enum(SUPPORT_CATEGORIES),
    message: z
      .string()
      .trim()
      .min(10, "Please describe the issue (at least 10 characters)")
      .max(2000),
    locale: z.enum(["zh", "en"]).optional(),
    /** Account A — current Cursor login / contact email Spending page */
    screenshotDataUrl: screenshotField("Screenshot #1 (Cursor account)"),
    /** Account B — Luma / other account Spending page (required for account swap) */
    screenshot2DataUrl: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const needBoth = requiresDualScreenshots({
      category: data.category,
      email: data.email,
      lumaEmail: data.lumaEmail,
    });
    const shot2 = (data.screenshot2DataUrl || "").trim();
    if (needBoth) {
      if (shot2.length < MIN_SCREENSHOT_CHARS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["screenshot2DataUrl"],
          message:
            "Screenshot #2 (other account) is required when switching accounts / email mismatch",
        });
        return;
      }
      if (shot2.length > MAX_SCREENSHOT_CHARS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["screenshot2DataUrl"],
          message: "Screenshot #2 is too large — try a smaller crop",
        });
        return;
      }
      if (!SCREENSHOT_RE.test(shot2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["screenshot2DataUrl"],
          message: "Screenshot #2 must be a PNG/JPEG/WebP image",
        });
      }
    } else if (shot2) {
      if (shot2.length > MAX_SCREENSHOT_CHARS || !SCREENSHOT_RE.test(shot2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["screenshot2DataUrl"],
          message: "Screenshot #2 must be a valid PNG/JPEG/WebP under size limit",
        });
      }
    }
  });

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
