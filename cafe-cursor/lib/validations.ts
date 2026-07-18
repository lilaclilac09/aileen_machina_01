import { z } from "zod";

/**
 * Schema de validación para registro de usuarios
 * Usa Zod para validación robusta en servidor y cliente
 * Names allow Latin + CJK (Shanghai Cafe Cursor IRL)
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .trim()
    .regex(/^[\p{L}\p{M}\s.'·\-]+$/u, "Name can only contain letters"),
  email: z
    .string()
    .email("Please enter a valid email")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),
  checkinCode: z.string().trim().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
