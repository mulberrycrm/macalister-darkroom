import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { z } from "zod";
import { tenants } from "./core";
import { contacts } from "./contacts";
import { projects } from "./projects";

// ============================================================================
// Database Tables
// ============================================================================

export const galleries = pgTable("galleries", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  slug: text().notNull(),
  title: text().notNull(),
  galleryType: text("gallery_type", { enum: ["design_consultation", "portrait", "wedding", "other"] }).notNull().default("other"),
  coverImageUrl: text("cover_image_url"),
  password: text(), // Hashed bcrypt password; null = no password
  isPublished: boolean("is_published").notNull().default(false),
  allowDownload: boolean("allow_download").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  accentColor: text("accent_color"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("galleries_tenant_id_idx").on(table.tenantId),
  index("galleries_tenant_slug_idx").on(table.tenantId, table.slug),
  index("galleries_is_published_idx").on(table.isPublished),
  index("galleries_contact_id_idx").on(table.contactId),
  index("galleries_project_id_idx").on(table.projectId),
  index("galleries_created_at_idx").on(table.createdAt),
  uniqueIndex("galleries_slug_unique").on(table.tenantId, table.slug),
]);

export const gallerySections = pgTable("gallery_sections", {
  id: uuid().defaultRandom().primaryKey(),
  galleryId: uuid("gallery_id").notNull().references(() => galleries.id, { onDelete: "cascade" }),
  title: text().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("gallery_sections_gallery_id_idx").on(table.galleryId),
]);

export const galleryPhotos = pgTable("gallery_photos", {
  id: uuid().defaultRandom().primaryKey(),
  sectionId: uuid("section_id").notNull().references(() => gallerySections.id, { onDelete: "cascade" }),
  r2Key: text("r2_key").notNull(),
  url: text().notNull(),
  thumbnailUrl: text("thumbnail_url"),
  width: integer(),
  height: integer(),
  caption: text(),
  originalFilename: text("original_filename"),
  starRating: integer("star_rating"),  // 0-5 from Lightroom XMP metadata
  isHero: boolean("is_hero").notNull().default(false),
  isPortfolio: boolean("is_portfolio").notNull().default(false),  // 4-5★ auto-flagged for portfolio/social
  sortOrder: integer("sort_order").notNull().default(0),
  thumbnailStatus: text("thumbnail_status", { enum: ["pending", "processing", "complete", "failed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("gallery_photos_section_id_idx").on(table.sectionId),
  index("gallery_photos_created_at_idx").on(table.createdAt),
  index("gallery_photos_thumbnail_status_idx").on(table.thumbnailStatus),
  index("gallery_photos_is_portfolio_idx").on(table.isPortfolio),
  index("gallery_photos_star_rating_idx").on(table.starRating),
]);

export const galleryFavorites = pgTable("gallery_favorites", {
  id: uuid().defaultRandom().primaryKey(),
  galleryId: uuid("gallery_id").notNull().references(() => galleries.id, { onDelete: "cascade" }),
  photoId: uuid("photo_id").notNull().references(() => galleryPhotos.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("gallery_favorites_gallery_id_idx").on(table.galleryId),
  index("gallery_favorites_photo_id_idx").on(table.photoId),
  index("gallery_favorites_session_id_idx").on(table.sessionId),
  uniqueIndex("gallery_favorites_unique_idx").on(table.galleryId, table.photoId, table.sessionId),
]);

export const galleryAnalytics = pgTable("gallery_analytics", {
  id: uuid().defaultRandom().primaryKey(),
  galleryId: uuid("gallery_id").notNull().references(() => galleries.id, { onDelete: "cascade" }),
  event: text({ enum: ["view", "download", "favorite", "share"] }).notNull(),
  photoId: uuid("photo_id").references(() => galleryPhotos.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  clientEmail: text("client_email"),
  metadata: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("gallery_analytics_gallery_id_idx").on(table.galleryId),
  index("gallery_analytics_event_idx").on(table.event),
  index("gallery_analytics_created_at_idx").on(table.createdAt),
  index("gallery_analytics_session_id_idx").on(table.sessionId),
]);

// ============================================================================
// TypeScript Types (inferred from Drizzle schemas)
// ============================================================================

export type Gallery = InferSelectModel<typeof galleries>;
export type GalleryInsert = InferInsertModel<typeof galleries>;

export type GallerySection = InferSelectModel<typeof gallerySections>;
export type GallerySectionInsert = InferInsertModel<typeof gallerySections>;

export type GalleryPhoto = InferSelectModel<typeof galleryPhotos>;
export type GalleryPhotoInsert = InferInsertModel<typeof galleryPhotos>;

export type GalleryFavorite = InferSelectModel<typeof galleryFavorites>;
export type GalleryFavoriteInsert = InferInsertModel<typeof galleryFavorites>;

export type GalleryAnalytic = InferSelectModel<typeof galleryAnalytics>;
export type GalleryAnalyticInsert = InferInsertModel<typeof galleryAnalytics>;

// ============================================================================
// Zod Validation Schemas
// ============================================================================

// Gallery creation/update input validation
export const galleryTypeEnum = z.enum(["design_consultation", "portrait", "wedding", "other"]);
export type GalleryType = z.infer<typeof galleryTypeEnum>;

export const createGallerySchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  galleryType: galleryTypeEnum.default("other"),
  contactId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  password: z.string().min(6).optional(), // Will be hashed before storage
  isPublished: z.boolean().default(false),
  allowDownload: z.boolean().default(false),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  expiresAt: z.date().optional(),
});

export type CreateGalleryInput = z.infer<typeof createGallerySchema>;

export const updateGallerySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  galleryType: galleryTypeEnum.optional(),
  contactId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  password: z.string().min(6).optional().nullable(), // Will be hashed if provided
  isPublished: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
});

export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;

// Gallery section creation/update
export const createGallerySectionSchema = z.object({
  title: z.string().min(1).max(255),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateGallerySectionInput = z.infer<typeof createGallerySectionSchema>;

export const updateGallerySectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateGallerySectionInput = z.infer<typeof updateGallerySectionSchema>;

// Gallery photo creation/update
export const createGalleryPhotoSchema = z.object({
  r2Key: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  caption: z.string().optional(),
  isHero: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateGalleryPhotoInput = z.infer<typeof createGalleryPhotoSchema>;

export const updateGalleryPhotoSchema = z.object({
  caption: z.string().optional().nullable(),
  isHero: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateGalleryPhotoInput = z.infer<typeof updateGalleryPhotoSchema>;

// Gallery favorite creation
export const createGalleryFavoriteSchema = z.object({
  sessionId: z.string().min(1),
});

export type CreateGalleryFavoriteInput = z.infer<typeof createGalleryFavoriteSchema>;

// Gallery analytics event tracking
export const createGalleryAnalyticSchema = z.object({
  event: z.enum(["view", "download", "favorite", "share"]),
  photoId: z.string().uuid().optional(),
  sessionId: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateGalleryAnalyticInput = z.infer<typeof createGalleryAnalyticSchema>;

// Password verification schema
export const verifyGalleryPasswordSchema = z.object({
  password: z.string().min(1),
});

export type VerifyGalleryPasswordInput = z.infer<typeof verifyGalleryPasswordSchema>;
