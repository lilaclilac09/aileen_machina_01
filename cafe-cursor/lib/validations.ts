import { z } from "zod";

/**
 * Registration schema — email (+ optional check-in code).
 * Name is not collected; open redeem only needs a unique email.
 */
export const registerSchema = z.object({
  name: z.string().max(100).trim().optional(),
  email: z
    .string()
    .email("Please enter a valid email")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),
  checkinCode: z.string().trim().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Derive a display name from email when name is not collected. */
export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || "Attendee";
}
