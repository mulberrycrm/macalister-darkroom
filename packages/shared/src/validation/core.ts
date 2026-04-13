import { z } from "zod";

export const tenantInsertSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export const userInsertSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(200),
  role: z.enum(["admin", "user"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type TenantInsert = z.infer<typeof tenantInsertSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
