// src/modules/auth/schemas/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  displayName: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Export TypeScript types
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;