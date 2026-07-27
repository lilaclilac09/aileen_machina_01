import { z } from "zod";

export const SUPPORT_CATEGORIES = [
  "credits_not_landed",
  "email_mismatch",
  "already_claimed",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

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
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
