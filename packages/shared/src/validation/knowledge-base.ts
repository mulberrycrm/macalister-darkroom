import { z } from "zod";

export const KB_CATEGORIES = [
  "Getting Started",
  "Features",
  "Billing",
  "Client Portal",
  "Troubleshooting",
  "FAQ",
  "User Guide",
] as const;

export const createKnowledgeBaseSchema = z.object({
  category: z.enum(KB_CATEGORIES),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  codeBlocks: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  searchKeywords: z.string().optional(),
  published: z.boolean().optional().default(false),
});

export type CreateKnowledgeBaseInput = z.infer<typeof createKnowledgeBaseSchema>;

export const updateKnowledgeBaseSchema = z.object({
  category: z.enum(KB_CATEGORIES).optional(),
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
  codeBlocks: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.string().optional().nullable(),
  published: z.boolean().optional(),
});

export type UpdateKnowledgeBaseInput = z.infer<typeof updateKnowledgeBaseSchema>;

export const searchKnowledgeBaseSchema = z.object({
  query: z.string().min(1).max(255),
  category: z.enum(KB_CATEGORIES).optional(),
  tags: z.array(z.string()).optional(),
});

export type SearchKnowledgeBaseInput = z.infer<typeof searchKnowledgeBaseSchema>;
