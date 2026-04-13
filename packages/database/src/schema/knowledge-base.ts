import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import { tenants } from "./core";

// ============================================================================
// Database Tables
// ============================================================================

export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  category: text({ enum: ["Getting Started", "Features", "Billing", "Client Portal", "Troubleshooting", "FAQ", "User Guide"] }).notNull(),
  title: text().notNull(),
  slug: varchar({ length: 255 }).notNull(),
  content: text().notNull(), // Rich text or markdown content
  codeBlocks: text("code_blocks"), // JSON array of code blocks
  tags: text().array().notNull().default([]),
  searchKeywords: text("search_keywords"), // Semicolon-separated keywords for FTS
  published: boolean().notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("knowledge_base_tenant_id_idx").on(table.tenantId),
  index("knowledge_base_category_idx").on(table.category),
  index("knowledge_base_published_idx").on(table.published),
  uniqueIndex("knowledge_base_slug_unique").on(table.tenantId, table.slug),
]);

// ============================================================================
// TypeScript Types (inferred from Drizzle schemas)
// ============================================================================

export type KnowledgeBaseArticle = InferSelectModel<typeof knowledgeBase>;
export type KnowledgeBaseArticleInsert = InferInsertModel<typeof knowledgeBase>;

// ============================================================================
// Zod Validation Schemas
// ============================================================================

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
