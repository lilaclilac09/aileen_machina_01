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

/** data:image/jpeg|png|webp;base64,... — required spending-page screenshot */
const SCREENSHOT_RE =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i;

/** ~750KB base64 ceiling (Vercel body limit headroom) */
export const MAX_SCREENSHOT_CHARS = 750_000;
export const MIN_SCREENSHOT_CHARS = 80;

export const createTicketSchema = z.object({
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
  screenshotDataUrl: z
    .string()
    .min(MIN_SCREENSHOT_CHARS, "Screenshot of Spending page is required")
    .max(MAX_SCREENSHOT_CHARS, "Screenshot is too large — try a smaller crop")
    .refine(
      (v) => SCREENSHOT_RE.test(v),
      "Screenshot must be a PNG/JPEG/WebP image of cursor.com/dashboard/spending"
    ),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
